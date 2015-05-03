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
    localStorage.notifications = results;
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
      // 弹出消息
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
        // If the user is okay, let's create a notification
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
  var context = this;
  var handlers = {
    getPref: function() {
      if (request.key) {
        sendResponse(localStorage.getItem(request.key));
      } else {
        var result = {};
        for (var key in context.defaults) {
          result[key] = localStorage.getItem(key);
        }
        return result;
      }
    },
    setPref: function() {
      if (request.key in context.defaults) {
        localStorage.setItem(request.key, request.value);
      } else {
        throw new Error('Invalid key');
      }
    },
    updatePref: function() {
      context.loadPref().refresh();
    }
  }

  if (handlers.hasOwnProperty(request.subject)) {
    var action = handlers[request.subject];
    action();
  } else {
    console.log('Unknown message', request, sender);
    throw new Error('unhandled message');
  }

};

// init service
var service = new LibService();
service.start();

// event handler
chrome.runtime.onStartup.addListener(service.start.bind(service));
chrome.runtime.onInstalled.addListener(service.install.bind(service));
chrome.runtime.onMessage.addListener(service.message.bind(service));
