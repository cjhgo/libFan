/*
  Chrome Extention for Huiwen OPAC

  Copyright (c) 2013-2014 ChiChou
  This software may be freely distributed under the MIT license.

  http://chichou.0ginr.com
*/

(function() {
  "use strict";

  window.libfan = {};

  var domain = (document.domain.match(/amazon|douban|dangdang|jd/i) || null)[0];
  if(domain) {
    libfan.mode = "market";
  } else {
    //是否OPAC
    libfan.mode = "opac";
    return false;
  }

  var getBookInfo = function() {
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
        _ISBN = $("#summary-isbn .dd").html().toString();
        _title = $("h1").text().match(/\S+/).toString();
        _cover = ".bigimg";
        break;
      default:
      }
    libfan.book = {
      ISBN:  _ISBN,
      cover: $(_cover).attr("src"),
      title: _title
    };
    
  }, search = function(book, config) {
    if (!/(\d{9}|\d{13})/.test(book.ISBN)) return;
    
    $.get([config.baseUrl, 'search_rss.php?isbn=', book.ISBN].join(''), function(data) {
      if (data.indexOf('无此类RSS源') !== -1) {
        //如果是13位的ISBN则尝试重试
        if (book.ISBN.length == 13) {
          book.ISBN = book.ISBN.substring(3, 12);
          search(book, config);
        } else {
          $('#libfan-inject-frame').html(['哎呀，没有找到这本书…… <a href="',
            config.baseUrl,
            "openlink.php?strSearchType=title&strText=",
            book.title,
            '" target="_blank">搜搜类似的书</a>'].join());
        }
      } else {
        //消除控制台的图片404错误
        data = data.replace(/(href|src)=\"..\/tpl\S*?\"/g, "");
        var dom = $(data),
          bookInfo = dom.find("#list_books p span").text().match(/\d+/g),
          url = dom.find("h3 a").attr("href"),
          total = bookInfo[0],
          remain = bookInfo[1],
          tip = '一共' + total + '本，';
          tip += (remain == 0 ? '竟然都被借光了！<br />学霸们太威武啦！': '还剩' + remain + '本~');
        $('#libfan-inject-frame').html(tip);
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
      ]);
      $("#libfan-detail table").hide().show(500);
    });
  };

  var book = getBookInfo();
  chrome.extension.sendMessage({type: 'getPref', key: 'inject'}, function(config) {
    libfan.config = config;
    var list = {
        'douban': ["#buyinfo", "gray_ad"],
        'amazon': ['#ps-content', "cBoxInner"],
        'dangdang': [".buy_area", "buy_area"],
        'jd': ['#o-suit', "box_jd"]
      }[libfan.domain], markElement;

    if (list) markElement = $(list[0]);
    if (markElement && markElement.length) {
      var box = $(['<div class="libfan-detail" id="', id[1], '"></div>'].join())
        .append(['<h2>', config.library, '中查找本书...</h2><div class="bs" id="libfan-inject-frame"><img src="',
        chrome.extension.getURL("css/loading.gif"), '""></div>'].join())
      markElement.before(box);

      var css = $("<link id='libfan-plugin-css'>").attr({
        rel: "stylesheet", type: "text/css", href: chrome.extension.getURL("css/inject.css")
      });
      $("head").append(css);
      search(book, config);
    };
    return false;    
  });
})();