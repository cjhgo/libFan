/*
  Chrome Extention for Huiwen OPAC

  Copyright (c) 2013-2015 ChiChou
  This software may be freely distributed under the MIT license.

  http://chichou.0ginr.com
*/

var RE_ISBN = /\b(?:ISBN(?:: ?| ))?((?:978-)?(?:\d-\d{3}-\d{5}-|(?:978)?\d{9})[\dx])\b/i;

var Config = {};

//初始设置
var defaultConfig = {
  enableNotify: false,
  resultsPerPage: 10,
  displayTopWords: true,
  libraryName: "江苏大学图书馆",
  opacRoot: "http://huiwen.ujs.edu.cn:8080/"
};

for (var key in defaultConfig) {
  Config[key] = JSON.parse(localStorage) || defaultConfig[key];
}

/**
 * get configuration
 * @param  {String} key 
 * @return {Object} value
 */
Config.get = function(key) {
  return Config[key];
}

/**
 * set configuration
 * @param {String} key
 * @param {String} value
 */
Config.set = function(key, value) {
  Config[key] = localStorage[key] = value;
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.method === 'getPref' && request.key === 'inject') {
      sendResponse({
        library: localStorage.libraryName,
        baseUrl: localStorage.opacRoot + "opac/"
      });
    } else if (request.method === 'setNotification') {
      localStorage.userId = request.uid;
      localStorage.userName = request.userName;
      localStorage.enableNotify = "true";
    } else if (request.method === 'generateList') {
      $.post(localStorage.opacRoot + "reader/book_hist.php", {
        'para_string': 'all',
        'topage': '1'
      }, function(data) {
        var dom = $(data);
        if (dom.find("caption").text().contains("登录")) {
          chrome.tabs.reload(sender.tab.id);
          return;
        }
        localStorage.rawListData = dom.find("table").html()
          .replace(/href=\"\.\.\/opac/g, 'href="' + localStorage.opacRoot + 'opac')
          .replace(/bgcolor=\"#[0-9A-Fa-f]{3,6}\"/g, '');
        chrome.tabs.create({
          url: "list.html"
        });
      });
    }
  });

//初始化应用程序设置
chrome.runtime.onInstalled.addListener(function() {
  if (/^true$/.test(localStorage.installed)) return;

  for (var i in defaultConfig) {
    localStorage.setItem(i, defaultConfig[i]);
  }
  localStorage.installed = true;
});

//浏览器启动
chrome.runtime.onStartup.addListener(function() {
  //待处理提醒
  var notifications = [],
    totalMsgNum = 0,
    receivedMsgNum = 0;

  console.log(localStorage.enableNotify);
  //同步提醒
  if (localStorage.enableNotify != "true") return;

  //TODO:在设置界面中设定需要接收的提醒
  var notifyItems = {
    getExpired: true, //超期图书
    getAboutToExpire: true //即将到期图书
  };

  for (var i in notifyItems) {
    if (!notifyItems[i] || !model.user.hasOwnProperty(i)) break;

    totalMsgNum++;
    model.user[i](localStorage.userId, function(result) {
      //添加结果集
      if (result && result.list.length) {
        notifications.push(result);
      }

      //是否全部同步完成
      if (++receivedMsgNum == totalMsgNum) {
        var notify, text = "您有";
        var notifyCount = notifications.length;

        localStorage.notifications = JSON.stringify(notifications);

        //显示提醒数目
        if (notifyCount) {
          notifyCount = notifyCount.toString();
          chrome.browserAction.setBadgeText({
            text: notifyCount
          });
          localStorage.notifyCount = notifyCount;

          while (notify = notifications.pop()) {
            text += (notify.list.length + "本" + notify.title + "：\n");
            for (var j = 0; j < notify.list.length && text.length < 60; j++) {
              text += (notify.list[j].title + " \n");
            }
          }

          var showNotification = function() {
            // 弹出消息
            var notification = new Notification('书迷提醒', {
              icon: 'icon.png',
              body: text
            });
            msg.addEventListener('click', function() {
              msg.cancel();
              window.open('notifications.html');
            });
            msg.show();
          }

          if (!("Notification" in window)) {
            alert("This browser does not support desktop notification");
          } else if (Notification.permission === "granted") {
            showNotification();
          } else if (Notification.permission !== 'denied') {
            Notification.requestPermission(function(permission) {
              // If the user is okay, let's create a notification
              if (permission === "granted") {
                showNotification();
              }
            });
          }

        } else {
          localStorage.removeItem('notifyCount');
        }
      }
    });

  }
});

if (Config.showContextMenu) {
  var menuId = chrome.contextMenus.create({
    'title': '在' + localStorage.libraryName + '中搜索 "%s"',
    'contexts': ["selection"],
    'onclick': function(info, tab) {
      var keyword = info.selectionText,
        method = 'title',
        match = keyword.match(RE_ISBN);
      if (match) {
        method = 'isbn';
        keyword = match[1];
      }
      chrome.tabs.create({
        url: localStorage.opacRoot + "opac/openlink.php?strSearchType=" + method + "&strText=" + keyword
      });
    }
  });

  Config.set('contextMenuId', menuId);
}
