/*
  Chrome Extention for Huiwen OPAC

  Copyright (c) 2013-2014 ChiChou
  This software may be freely distributed under the MIT license.

  http://chichou.0ginr.com
*/

(function() {
  'use strict';

  var Injector = function Injector() {
    this.init();
  };

  /**
   * grab book information from current page
   * @return {Object} book information
   */
  Injector.prototype.getBook = function() {
    var adapters = {
      douban: function() {
        return {
          isbn: $("#info").text().match(/ISBN\: (\d+)/)[1],
          cover: $('#mainpic img').attr('src'),
          title: $('h1 span').text()
        };
      },

      amazon: function() {
        var isbn;
        $(".content li b").each(function(i, e) {
          var $b = $(e);
          if ($b.html() == "条形码:") {
            isbn = $b.parent().html().match(/\d+/)[0];
            return false;
          }
        });

        return {
          isbn: isbn,
          cover: $('#original-main-image').attr('src'),
          title: $("#btAsinTitle").text().split(' [')[0]
        };
      },

      dangdang: function() {
        return {
          isbn: $(".ws4").parent().html().substring(27),
          cover: $('#largePic').attr('src'),
          title: $('h1').text()
        };
      },

      jd: function() {
        return {
          isbn: $("#summary-isbn .dd").html() || "",
          cover: $(".bigimg").attr('src'),
          title: $("h1").text().match(/\S+/)[0]
        }
      }
    };

    return adapters[this.domain]();
  };

  /**
   * init instance
   */
  Injector.prototype.init = function() {
    var loadTemplates = new Promise(function(resolve, reject) {
      var templateUrl = chrome.extension.getURL('inject-templates.html');
      $.get(templateUrl).then(function(source) {
        var templates = {};
        $(source).find('div').children('> div').forEach(function() {
          templates[this.id.camel()] = this.innerHTML;
        });
        resolve(templates);
      }).fail(reject);
    });

    loadTemplates().then();
    return this;
  };

  /**
   * load style into current page
   * @return {[type]} [description]
   */
  Injector.prototype.injectElements = function() {
    // inject stylesheet
    var attrs = {
      rel: 'stylesheet',
      type: 'text/css',
      href: chrome.extension.getURL("css/inject.css")
    };
    var link = document.createElement('link');
    for (var attr in attrs) {
      link.setAttribute(attr, attrs[attr]);
    }
    document.getElementsByTagName('head')[0].appendChild(link);
    return this;
  }

  /**
   * search book
   */
  Injector.prototype.search = function() {
    var isbn = this.getBook().isbn;
    Huiwen.book(isbn).then(function() {
      
    });
  };

  /**
   * load information for a certain book
   */
  Injector.prototype.book = function() {
    return new Promise(function(resolve, reject) {

      $.get(config.baseUrl + url, function(data) {
        // remove all links
        data = data.replace(/(href|src)=\"[\S\s]*?\"/g, '');
        var table = $(data).find("table").removeAttr('width');

        $('#Injector-detail').append(table).append([
          '<p><a href="',
          config.baseUrl,
          url,
          '" target="_blank">到图书馆看看</a></p>'
        ].join(''));
        $("#Injector-detail table").hide().show(500);
      });
    });
  }

  var Injector = new Injector();
  Injector.injectElements().;


  var Injector = {};

  Injector.html = {
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
    toolbar: '<div id="Injector-toolbar" style="display:none"><img class="logo" src="' + chrome.extension.getURL("icon.png") +
      '"><a href="#/Injector/subscribe" id="Injector-subscribe" title="在电脑上记住此帐号，每次启动Chrome' +
      '的时候检查到期图书">开启到期提醒</a> | <a href="#/Injector/generate-list" ' +
      'id="Injector-generate-list" title="用书单记录我的学习轨迹">生成我的书单</a><div id="Injector-message-tip"></div></div>'
  };

  var injectCss = function() {
      var css = $("<link id='Injector-plugin-css'>").attr({
        rel: "stylesheet",
        type: "text/css",
        href: chrome.extension.getURL("css/inject.css")
      });
      $("head").append(css);
    },
    getBookInfo = function() {
      //书籍的ISBN, 封面, 标题
      var _ISBN, _cover, _title;

      switch (Injector.domain) {
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
        ISBN: _ISBN,
        cover: $(_cover).attr("src"),
        title: _title
      };
    },
    search = function(book, config) {
      if (!/(\d{9}|\d{13})/.test(book.ISBN)) {
        $("#Injector-detail-box").hide();
        return;
      }

      // console.log([config.baseUrl, 'openlink.php?strSearchType=isbn&strText=', book.ISBN].join(''));

      $.get(config.baseUrl + 'openlink.php?strSearchType=isbn&strText=' + book.ISBN, function(data) {
        if (data.indexOf('本馆没有您检索的馆藏书目') !== -1) {
          //如果是13位的ISBN则尝试重试
          if (book.ISBN.length == 13) {
            book.ISBN = book.ISBN.substring(3, 12);
            search(book, config);
          } else {
            $('#Injector-detail').html(Injector.html.bookNotFound(config.baseUrl, book.title));
          }
        } else {
          //消除控制台的图片404错误
          data = data.replace(/(href|src)=\"(\.\.)?\/tpl\S*?\"/g, "");
          var dom = $(data),
            bookInfo = dom.find("#list_books p span").text().match(/\d+/g),
            url = dom.find("h3 a").attr("href"),
            total = bookInfo[0],
            remain = bookInfo[1],
            tip = '一共' + total + '本，' + (remain == 0 ? '都被借光了…' : '还剩' + remain + '本');
          $('#Injector-detail').html("<p>" + tip + "</p>");
          loadBookDetail(url, config);
        }
      });
    },
    loadBookDetail = function(url, config) {
      $.get(config.baseUrl + url, function(data) {
        //消除控制台404错误
        data = data.replace(/(href|src)=\"[\S\s]*?\"/g, "");
        var table = $(data).find("table").removeAttr("width");
        $('#Injector-detail').append(table).append([
          '<p><a href="',
          config.baseUrl,
          url,
          '" target="_blank">到图书馆看看</a></p>'
        ].join(''));
        $("#Injector-detail table").hide().show(500);
      });
    },
    runInStore = function(config) {
      var book = getBookInfo();
      Injector.config = config;

      var list = {
          'douban': ["#buyinfo", "gray_ad"],
          'amazon': ['#ps-content', "cBoxInner"],
          'dangdang': [".buy_area", "buy_area"],
          'jd': ['#out-of-stock', "box_jd"]
        }[Injector.domain],
        markElement;

      if (list) markElement = $(list[0]);
      if (markElement && markElement.length) {
        var box = $([
          '<div class="Injector ',
          domain,
          ' ',
          list[1],
          '" id="Injector-detail-box"></div>'
        ].join('')).append([
          '<h2>',
          config.library || "图书馆",
          '中查找本书...</h2><div class="bs" id="Injector-detail"><img src="',
          chrome.extension.getURL("css/loading.gif"),
          '""></div>'
        ].join(''));
        markElement.before(box);
        injectCss();
        search(book, config);
      };
    },
    runInOpac = function(config) {
      var copyright = $("#copy").text(),
        match;
      if (copyright &&
        (copyright.contains("江苏汇文")) &&
        (match = copyright.match(/OPAC\s+V([0-9.]+)\s/))) {
        var ver = match[1];
        //TODO:
        if (ver !== "4.5") return false;

        if ($("caption").text().contains("登录")) {
          $("input[type=submit]").before(Injector.html.loginTip);
        } else if (location.pathname.contains('redr_cust_result.php') &&
          $("#nav_mylibhome").text().contains('我的首页')) {

          $('body').append(Injector.html.toolbar);
          $('#Injector-toolbar').fadeIn(200);
          $('#Injector-subscribe, #Injector-generate-list').on('click', function() {
            var data = {
              'Injector-subscribe': ['setNotification', '设置成功'],
              'Injector-generate-list': ['generateList', '正在准备数据，请稍安勿躁…']
            }[this.id];

            var tip = $("#Injector-message-tip");

            chrome.runtime.sendMessage({
              method: data[0],
              uid: $("script:not([src])").html().match(/&id=(\w+)/)[1],
              userName: $("#menu > div").text().replace(/\s*注销/, "").trim()
            }, function(response) {
              var lastError = chrome.runtime.lastError;
              tip.stop().show().text('发生意外错误：' + lastError.message);
            });

            tip.text(data[1]).fadeIn();
            setTimeout(function() {
              tip.fadeOut();
            }, 3000);

            return false;
          });
        }
      } else {
        return false;
      }
    };

  window.Injector = {};
  var domain, callback;
  if (domain = (document.domain.match(/amazon|douban|dangdang|jd/) || [null])[0]) {
    Injector.domain = domain;
    Injector.mode = "market";
    callback = runInStore;
  } else if (location.pathname.indexOf('/reader/') > -1) {
    Injector.mode = "opac";
    callback = runInOpac;
  } else {
    return false;
  }

  chrome.runtime.sendMessage({
    method: 'getPref',
    key: 'inject'
  }, callback);
})();
