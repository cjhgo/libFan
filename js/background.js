var BACKGROUND_REFRESH_INTERVAL = 1000 * 60 * 60 * 6; // refresh every 6 hours

/**
 * background service
 * @param {Object} opt options
 */
var LibService = function LibService(opt) {
  opt = opt || {};
  this.loadPref();
};

/**
 * default configurations
 * @type {Object}
 */
LibService.prototype.defaults = {
  notification: 'disabled',
  notificationList: '',
  resultsPerPage: 10,
  topWords: 'enabled',
  title: '江苏大学图书馆',
  ver: '4.5',
  baseUrl: 'http://huiwen.ujs.edu.cn:8080/',
  userId: 0,
  userName: '未登录'
};

/**
 * fetch notifications
 * 
 */
LibService.prototype.refresh = function() {
  // refresh every 6 hours
  setTimeout(this.refresh.bind(this), BACKGROUND_REFRESH_INTERVAL);

  var items = this.notificationList.split(',');
  if (items.length === 0 || !this.userId) {
    return;
  }

  var context = this;
  var tasks = items.map(function(type) {
    return context.client.rss(context.userId, type);
  });

  return Promise.all(tasks).then(function(results) {
    localStorage.notifications = JSON.stringify(results);
    var detail = results.map(function(item) {
      if (item.list.length > 0) {
        var header = ' {0} 本 {1}：'.format(item.list.length, item.title);
        var body = item.list.map(function(book) {
          return book.title;
        }).join('\n');
        return '{0}\n{1}'.format(header, body);
      }
    }).join('\n和');
    var message = '您有{0}'.format(detail);
    var showNotification = function(text) {
      var notification = new Notification('书迷提醒', {
        icon: 'images/32x32.png',
        body: text
      });
    };

    if (!('Notification' in window)) {
      alert('This browser does not support desktop notification');
    } else if (Notification.permission === 'granted') {
      showNotification(message);
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission(function(permission) {
        if (permission === 'granted') {
          showNotification(message);
        }
      });
    }
  });
};

/**
 * reload preferences
 * @return {LibService} this
 */
LibService.prototype.loadPref = function() {
  for (var key in this.defaults) {
    this[key] = localStorage.getItem(key);
  }
  return this;
};

/**
 * on startup
 * 
 */
LibService.prototype.start = function() {
  this.client = new Huiwen({
    title: this.title,
    baseUrl: this.baseUrl,
    ver: this.ver
  });

  // refresh message
  this.refresh();

  // context menu
  if (localStorage.showContextMenu === 'enabled') {
    var RE_ISBN = /\b(?:ISBN(?:: ?| ))?((?:978-)?(?:\d-\d{3}-\d{5}-|(?:978)?\d{9})[\dx])\b/i;
    this.menuId = chrome.contextMenus.create({
      title: '在{0}中搜索 "%s"'.format(this.title),
      contexts: ["selection"],
      onclick: function(info, tab) {
        var keyword = info.selectionText;
        var method = 'title';
        var match = keyword.match(RE_ISBN);
        if (match) {
          method = 'isbn';
          keyword = match[1];
        }
        keyword = encodeURIComponent(keyword);
        chrome.tabs.create({
          url: '{0}opac/openlink.php?strSearchType={1}&strText={2}'
        });
      }
    });
  }
}

/**
 * after installation
 * 
 */
LibService.prototype.install = function() {
  if (localStorage.installed === 'yes') {
    return;
  }

  // set all options to their defaults
  for (var key in this.defaults) {
    localStorage.setItem(key, this.defaults[key]);
  }
  localStorage.installed = 'yes';
  chrome.tabs.create({
    url: 'options.html'
  });
}

/**
 * message handlers
 * @param  {Object} request      request information
 * @param  {Object} sender       sender information
 * @param  {Function} sendResponse callback 
 * @return {Null}
 */
LibService.prototype.message = function(request, sender, sendResponse) {
  var huiwen = this.client;
  var handlers = {
    /**
     * search a book by isbn
     * @return {Null}
     */
    book: function() {
      huiwen.book(request.isbn).then(function(data) {
        sendResponse({
          found: true,
          ver: huiwen.ver
          title: huiwen.title,
          book: data
        });
      }).catch(function() {
        sendResponse({
          title: huiwen.title,
          found: false
        });
      });
    },

    /**
     * load url prefixes
     * @return {Null}
     */
    getPrefixes: function() {
      sendResponse(huiwen.prefixes);
    },

    /**
     * subscribe notifications
     * @return {Null}
     */
    subscribe: function() {
      localStorage.setItem('userName', request.name);
      localStorage.setItem('notification', 'enabled');
      localStorage.setItem('notificationList', '4,5');
      huiwen.id().then(function(id) {
        localStorage.setItem('userId', id);
        sendResponse(true);
      }).except(function () {
        sendResponse(false);
      });
    },

    /**
     * unsubscribe notifications
     * @return {Null}
     */
    unsubscribe: function() {
      localStorage.setItem('userName', '未登录');
      localStorage.setItem('notification', 'disabled');
      localStorage.setItem('userId', '0');
      sendResponse(true);
    }
  };

  if (handlers.hasOwnProperty(request.subject)) {
    var action = handlers[request.subject];
    action.call();
  } else {
    console.log('Unknown message', request, sender);
    throw new Error('unhandled message');
  }

};

// init service
var service = new LibService();

// event handler
chrome.runtime.onStartup.addListener(service.start.bind(service));
chrome.runtime.onInstalled.addListener(service.install.bind(service));
chrome.runtime.onMessage.addListener(service.message.bind(service));
