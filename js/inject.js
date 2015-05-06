/*
  Chrome Extention for Huiwen OPAC

  Copyright (c) 2013-2014 ChiChou
  This software may be freely distributed under the MIT license.

  http://chichou.0ginr.com
*/

(function() {
  'use strict';

  var Injector = function Injector() {};

  /**
   * run injector
   * @return {Injector} this
   */
  Injector.prototype.run = function() {
    this.loadTemplates(this.onload.bind(this));
    return this;
  };

  /**
   * initialized event
   * @return {Null}
   */
  Injector.prototype.onload = function() {
    var match = location.host.match(/\.(amazon|douban|dangdang|jd)\./);
    var context = this;
    if (match) {
      this.domain = match[1];
      this.loadAvaliableBook();
    } else {
      chrome.runtime.sendMessage({
        subject: 'getPref'
      }, function(pref) {
        var readerUrl = '{0}reader/'.format(pref.baseUrl);
        context.baseUrl = pre
        if (location.href.startsWith(readerUrl)) {
          context.login();
        }
      });
    }
  }

  /**
   * login OPAC system
   * 
   */
  Injector.prototype.login = function() {
    var element = document.getElementById('copy');
    if (element) {
      var copyright = element.textContent;
      if (copyright && copyright.contains('江苏汇文')) {
        var match = copyright.match(/OPAC\s+V([0-9.]+)\s/);
        this.ver = match[1];
      }
    }

    // login page
    if (this.ver && location.pathname.endsWith('login.php')) {
      $('input[type=submit]').before(this.templates.loginTip);
      return;
    }

    if (location.pathname.startsWith('{0}reader'.format(''))) {
      // guest or logged in
      if (this.ver === '4.5') {
      var menu = document.querySelector('#menu > div');
      if (menu.querySelector('a').pathname.endsWith('logout.php')) {
        this.userName = menu.childNodes[2].textContent.trim();

        $.get('.php').then(function(html) {
          // todo:
        });

        $('body').append(this.templates.toolbar.format({
          logo: chrome.extension.getURL('icon.png')
        }));
        $('#libfan-toolbar').fadeIn(200);
        $('#libfan-subscribe').click(function() {
          // 
          chrome.runtime.sendMessage({
            subject: 'setPref',
            key: 'userName',
            value: this.userName
          });

        });

        // todo:
        $('#libfan-generate-list').click(function() {
          
        });

        $('#libfan-subscribe').on('click', function() {
          
        });

      }

    } else if (this.ver === '5.0') {
      var menu = document.querySelector(
        '#header_opac > .header_right_top > .header_right_font:last-child');
      if (menu.querySelector('a:last-child').pathname.endsWith('logout.php')) {
        this.userName = menu.childNodes[4].textContent.trim();
        // todo:
        chrome.runtime.sendMessage({
          subject: 'setPref',
          key: 'userName',
          value: 'this.value'
        });
      }

    }
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
          cover: $('img.frontImage').attr('src'),
          title: $("#productTitle").text().split(' [')[0]
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

    var adapter = adapters[this.domain];
    return adapter();
  };

  /**
   * load html templates
   * @return {Promise} 
   */
  Injector.prototype.loadTemplates = function(callback) {
    this.templates = {};
    var context = this;
    var templateUrl = chrome.extension.getURL('templates.html');
    var xhr = new XMLHttpRequest();
    xhr.onload = function() {
      var list = xhr.responseXML.documentElement.getElementsByTagName('div');
      [].forEach.call(list, function(e) {
        context.templates[e.id.camel()] = e.innerHTML;
      });
      callback();
    }
    xhr.onerror = function() {
      throw new Error('Error while loading templates');
    }
    xhr.open('GET', templateUrl);
    xhr.responseType = 'document';
    xhr.send();
  };

  /**
   * render templates
   * @param  {String} key   template's key
   * @param  {Object} param params to bind
   * @return {String}       rendered html
   */
  Injector.prototype.render = function(key, param) {
    // todo: 
  }

  /**
   * find avaliable book in library
   */
  Injector.prototype.loadAvaliableBook = function() {
    var placeholders = {
      douban: ["#buyinfo", "gray_ad"],
      amazon: ['#buybox_feature_div', "cBoxInner"],
      dangdang: [".buy_area", "buy_area"],
      jd: ['#out-of-stock', "box_jd"]
    };
    var selectors = placeholders[this.domain];
    if (selectors) {
      var canary = $(selectors[0]);
      if (canary.length) {
        this.injectStyles();
        var book = this.getBook();
        var templates = this.templates;
        var huiwen = new Huiwen({
          baseUrl: 'http://58.194.172.34/',
          ver: '5.0',
          title: '山东大学图书馆'
        });
        var $frame = $('<div>').attr('id', 'libfan-detail').addClass(selectors[1]);
        canary.before($frame);
        huiwen.book(book.isbn).then(function(data) {
          data.table.setAttribute('data-ver', '5.0');
          $frame.append(templates.bookIsAvaliable.format({
            name: huiwen.title,
            url: data.link
          }));
          $frame.append(data.table);
        }, function() {
          $frame.html(templates.bookNotFound.format({
            title: book.title
          }));
        });
      }
    }
    return this;
  };

  /**
   * load style into current page
   * @return {[type]} [description]
   */
  Injector.prototype.injectStyles = function() {
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
  };

  var injector = new Injector();
  injector.run();

})();
