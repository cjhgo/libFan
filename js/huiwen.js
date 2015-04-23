(function() {
  var REGEX_SRC = /(href|src)=\"(\.\.)?\/tpl\S*?\"/g;
  /**
   * Huiwen API
   * @param {String} ver 版本
   */
  function Huiwen(opt) {
    this.ver = opt.ver || '4.5';
    this.baseUrl = opt.baseUrl;
    this.name = opt.name;

    if (['4.5', '5.0'].indexOf(this.ver) === -1) {
      throw new Error('Invalid version number, must be 4.5 or 5.0');
    }
  };

  /**
   * RSS 类型
   * @type {Array}
   */
  Huiwen.RSSType = [
    null,
    'Preserve', // 预约到书
    'Delegate', // 委托到书
    'Expired', // 超期
    'AboutToExpire', // 即将到期
    'Recommend', // 系统推荐
  ];

  /**
   * 热门检索
   * @return {Promise} 
   */
  Huiwen.prototype.topKeywords = function() {
    return new Promise(function(resolve, reject) {
      var url = '{0}ajax_topten.php'.format(this.baseUrl);
      $.get(url).fail(reject).success(function(response) {
        var TAG_OPEN = "')\">",
          TAG_CLOSE = "</a>";
        var pos = response.indexOf(TAG_OPEN);
        var result = [];
        while (pos > -1) {
          a = pos TAG_OPEN.length;
          b = response.indexOf(TAG_CLOSE, a);
          result.push(response.substring(a, b));
          pos = response.indexOf(TAG_OPEN, b);
        }

        resolve(result);
      });
    });
  };

  /**
   * 
   * @return {[type]} [description]
   */
  Huiwen.prototype.rss = function(id, type) {
    var context = this;
    if (this.ver === '4.5') {
      return new Promise(function(resolve, reject) {
        var url = '{0}rss.php?id={2}&type={1}',
          format(context.baseUrl, id, type);
        $.ajax({
          dataType: 'xml',
          url: url
        }).fail(reject).success(function(xml) {
          var $dom = $(xml);
          var title = dom.find("channel > title").text();
          var tags = ['title', 'link', 'description'];
          var list = $dom.find('item').map(function(i, e) {
            var item = {};
            tags.forEach(function(tag) {
              item[tag] = $(e).find(tag).text();
            });
            return item;
          });

          resolve({
            title: title,
            list: list
          });
        })
      });
    }
  }

  /**
   * 获取特定 ISBN 书籍的馆藏信息
   */
  Huiwen.prototype.book(isbn) = {
    var baseUrl = this.baseUrl;
    var search = function(isbn, success, fail) {
      if (!/(\d{9}|\d{13})/.test(book.ISBN)) {
        fail(new Error('Malformed ISBN number'));
      }

      var url = '{0}openlink.php?strSearchType=isbn&strText={1}'.format(baseUrl, isbn);
      $.get(url).fail(reject).success(function(data) {
        if (data.indexOf('本馆没有您检索的馆藏书目') > -1) {
          if (isbn.length === 13) {
            // retry
            return search(isbn.substr(3, 12), success, fail);
          } else {
            fail();
          }
        } else {
          // found
          var $dom = $(data.replace(REGEX_SRC, ''));
          var numbers = dom.find("#list_books p span").text().match(/\d+/g);
          var url = dom.find("h3 a").attr("href");
          success({
            total: numbers[0],
            remain: numbers[1],
            url: url
          });
        }
      });
    };

    return new Promise(function(resolve, reject) {
      search(isbn, function(book) {
        $.get(baseUrl + book.url).fail(reject).success(function(data) {
          var $dom = data.replace(REGEX_SRC, '');
          var $table = $dom.find('table').removeAttr('width');
          // todo: serialize
          resolve($table);
        });
      }, reject);
    });
  };

  /**
   * 搜索馆藏
   * @return {[type]} [description]
   */
  Huiwen.prototype.search = function(keyword, options) {
    var page = options.page || 0;
    var limit = options.limit || 10;
    var field = options.field || 'title';
    var context = this;

    keyword = encodeURIComponent(keyword);

    // 版本适配
    if (this.ver == '4.5') {
      return new Promise(function(resolve, reject) {
        var url = '{0}opac/openlink.php?strSearchType={1}&strText={2}&displaypg={3}&page={4}'
          .format(baseUrl, field, keyword, limit, page);

        $.get(url).fail(reject).success(function(html) {
          // 消除控制台 404 错误
          var $dom = $(html.replace(REGEX_SRC, ''));
          var total = $dom.find("#titlenav strong.red").text();
          var list = dom.find(".list_books").slice(0, limit).map(function() {
            // 馆藏复本、可借复本信息
            var $this = $(this),
              numbers = div.find("p span").html().match(/\d+/g),
              intro = div.find("p").html().match(/<\/span>\s+([\S\s]+)/),
              serial = div.find("h3").html().match(/<\/a>\s+([\S\s]+)/);

            if (numbers && intro && serial) {
              // 分解为作者和出版社字段
              intro = intro[1].split(/\s<br>/);
              // 作者和出版社为空
              if (intro.length == 1) {
                intro = ["暂无", "暂无"];
              }

              return {
                title: div.find('h3 > a').text().replace(/^\d+\./, ''), // 除去开头的数字编号
                total: numbers[0], // 馆藏复本
                remain: numbers[1], // 可借复本
                author: intro[0], // 作者
                publisher: intro[1].replace(/^\s*|\s*$/g, ''), // 出版社
                serial: serial[1],
                type: div.find('.doc_type_class').text(), // 图书类别
                link: context.baseURL + div.find('h3 a').attr('href') // 详情页面链接
              };
            }
            return null;
          }).filter(function() {
            return this;
          });

          resolve({
            url: url,
            total: total,
            list: list
          });
        });

      });
    } else if (this.ver == '5.0') {
      // todo:

      return new Promise(function(resolve, reject) {
        var url = '{0}opac/openlink.php?strSearchType={1}&strText={1}&displaypg={2}&page={3}'
          .format(baseUrl, field, keyword, limit, page);
        $.get('url').fail(reject).success(function(html) {
          var $dom = $(html.replace(REGEX_SRC, ''));

          var total = $dom.find('strong.red').text();
          var list = $dom.find('#search_book_list > li').slice(0, limit).map(function() {
            var $li = $(this);

            var numbers = div.find("p span").html().match(/\d+/g);

            return {
              title: $li.find('h3 > a > b').text().replace(/^\d+\./, ''),
              total: numbers[0],
              remain: numbers[1]
              // todo
            }

          });

        });
      });
    }
  };

  // export
  window.Huiwen = Huiwen;
})()