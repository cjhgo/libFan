/*
  Chrome Extention for Huiwen OPAC

  Copyright (c) 2013-2014 ChiChou
  This software may be freely distributed under the MIT license.

  http://chichou.0ginr.com
*/

(function() {
  "use strict";

  (function() {
    if (!String.prototype.contains) {
      String.prototype.contains = function() {
          return String.prototype.indexOf.apply(this, arguments) !== -1;
      };
    }
    if (!String.prototype.trim) {
      String.prototype.trim = function () {
        return this.replace(/^\s+|\s+$/g, '');
      };
    }
  })();

  var libfan = {};

  libfan.html = {
    loginTip: "<p style='margin-bottom:10px;color:#882828'>登录成功后，单击页面下方的" +
      "“开启到期提醒” ，<br>可以在书迷插件里获取还书通知。</p>",
    bookNotFound: function(base, title) {
      return [
        '<p>哎呀，没有找到这本书…… <a href="',
        base,
        "openlink.php?strSearchType=title&strText=",
        title,
        '" target="_blank">搜搜类似的书</a></p>'
      ].join('');
    },
    toolbar: '<div id="libfan-toolbar" style="display:none"><img class="logo" src="' + chrome.extension.getURL("icon.png") + 
      '"><a href="#/libfan/subscribe" id="libfan-subscribe" title="在电脑上记住此帐号，每次启动Chrome' + 
      '的时候检查到期图书">开启到期提醒</a> | <a href="#/libfan/generate-list" ' + 
      'id="libfan-generate-list" title="用书单记录我的学习轨迹">生成我的书单</a><div id="libfan-message-tip"></div></div>'
  };

  var injectCss = function() {
    var css = $("<link id='libfan-plugin-css'>").attr({
      rel: "stylesheet",
      type: "text/css",
      href: chrome.extension.getURL("css/inject.css")
    });
    $("head").append(css);
  }, getBookInfo = function() {
    //书籍的ISBN, 封面, 标题
    var _ISBN, _cover, _title;

    switch (libfan.domain) {
      case 'douban':
        _ISBN = $("#info").text().match(/ISBN\: (\d+)/)[1];
        _cover = '#mainpic img';
        _title = $('h1 span').text();
        break;
      case 'amazon':
        $(".content li b").each(function(i, e) {
          var _ = $(e);
          if (_.html() == "条形码:") {
            _ISBN = _.parent().html().match(/\d+/).toString();
            return false;
          }
        });
        _cover = "#original-main-image";
        _title = $("#btAsinTitle").text().split(' [')[0].toString();
        break;
      case 'dangdang':
        _title = $("h1").text();
        _ISBN = $(".ws4").parent().html().substring(27);
        _cover = "#largePic";
        break;
      case 'jd':
        _ISBN = ($("#summary-isbn .dd").html() || "").toString();
        _title = $("h1").text().match(/\S+/).toString();
        _cover = ".bigimg";
        break;
      default:
      }
    return {
      ISBN:  _ISBN,
      cover: $(_cover).attr("src"),
      title: _title
    };    
  }, search = function(book, config) {
    if (!/(\d{9}|\d{13})/.test(book.ISBN)) {
      $("#libfan-detail-box").hide();
      return;
    }

    // console.log([config.baseUrl, 'openlink.php?strSearchType=isbn&strText=', book.ISBN].join(''));

    $.get(config.baseUrl + 'openlink.php?strSearchType=isbn&strText=' + book.ISBN, function (data) {
      if (data.indexOf('本馆没有您检索的馆藏书目') !== -1) {
        //如果是13位的ISBN则尝试重试
        if (book.ISBN.length == 13) {
          book.ISBN = book.ISBN.substring(3, 12);
          search(book, config);
        } else {
          $('#libfan-detail').html(libfan.html.bookNotFound(config.baseUrl,book.title));
        }
      } else {
        //消除控制台的图片404错误
        data = data.replace(/(href|src)=\"(\.\.)?\/tpl\S*?\"/g, "");
        var dom = $(data),
          bookInfo = dom.find("#list_books p span").text().match(/\d+/g),
          url = dom.find("h3 a").attr("href"),
          total = bookInfo[0],
          remain = bookInfo[1],
          tip = '一共' + total + '本，' + (remain == 0 ? '都被借光了…': '还剩' + remain + '本');
        $('#libfan-detail').html("<p>" + tip + "</p>");
        loadBookDetail(url, config);
      }
    });
  }, loadBookDetail = function(url, config) {
    $.get(config.baseUrl + url, function(data) {
      //消除控制台404错误
      data = data.replace(/(href|src)=\"[\S\s]*?\"/g, "");
      var table = $(data).find("table").removeAttr("width");
      $('#libfan-detail').append(table).append([
        '<p><a href="',
        config.baseUrl,
        url,
        '" target="_blank">到图书馆看看</a></p>'
      ].join(''));
      $("#libfan-detail table").hide().show(500);
    });
  }, runInStore = function(config) {
    var book = getBookInfo();
    libfan.config = config;

    var list = {
        'douban': ["#buyinfo", "gray_ad"],
        'amazon': ['#ps-content', "cBoxInner"],
        'dangdang': [".buy_area", "buy_area"],
        'jd': ['#out-of-stock', "box_jd"]
      }[libfan.domain], markElement;

    if (list) markElement = $(list[0]);
    if (markElement && markElement.length) {
      var box = $([
          '<div class="libfan ',
          domain,
          ' ',
          list[1],
          '" id="libfan-detail-box"></div>'
        ].join('')).append([
          '<h2>',
          config.library || "图书馆",
          '中查找本书...</h2><div class="bs" id="libfan-detail"><img src="',
          chrome.extension.getURL("css/loading.gif"),
          '""></div>'
        ].join(''));
      markElement.before(box);
      injectCss();
      search(book, config);
    };
  }, runInOpac = function(config) {
    var copyright = $("#copy").text(), match;
    if(copyright &&
        (copyright.indexOf("江苏汇文") > -1) && 
        (match = copyright.match(/OPAC\s+V([0-9.]+)\s/))) {
      var ver = match[1];
      //TODO:
      if (ver !== "4.5") return false;

      if ($("caption").text().indexOf("登录") > -1) {
        $("input[type=submit]").before(libfan.html.loginTip);        
      } else if (location.pathname.contains('redr_cust_result.php') &&
          $("#nav_mylibhome").text().contains('我的首页')) {

        $('body').append(libfan.html.toolbar);
        $('#libfan-toolbar').fadeIn(200);
        $('#libfan-subscribe, #libfan-generate-list').on('click', function() {
            var data = {
              'libfan-subscribe': ['setNotification', '设置成功'],
              'libfan-generate-list': ['generateList', '正在准备数据，请稍安勿躁…']
            }[this.id];

          var tip = $("#libfan-message-tip");
          
          chrome.runtime.sendMessage({
            method: data[0], 
            uid: $("script:not([src])").html().match(/&id=(\w+)/)[1],
            userName: $("#menu > div").text().replace(/\s*注销/, "").trim()
          }, function(response) {
            var lastError = chrome.runtime.lastError;
            tip.stop().show().text('发生意外错误：' + lastError.message);
          });
          
          tip.text(data[1]).fadeIn();
          setTimeout(function(){
            tip.fadeOut();
          }, 3000);

          return false;
        });
      }      
    } else {
      return false;
    }
  };

  window.libfan = {};
  var domain, callback;
  if (domain = (document.domain.match(/amazon|douban|dangdang|jd/) || [null])[0]) {
    libfan.domain = domain;
    libfan.mode = "market";
    callback = runInStore;
  } else if (location.pathname.indexOf('/reader/') > -1) {
    libfan.mode = "opac";
    callback = runInOpac;
  } else {
    return false;
  }

  chrome.runtime.sendMessage({method: 'getPref', key: 'inject'}, callback);
})();