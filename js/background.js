/*
  Chrome Extention for Huiwen OPAC

  Copyright (c) 2013-2014 ChiChou
  This software may be freely distributed under the MIT license.

  http://chichou.0ginr.com
*/

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
      $.post(localStorage.opacRoot + "reader/book_hist.php", {'para_string':'all', 'topage':'1'}, function(data) {
        var dom = $(data);
        localStorage.rawListData = dom.find("table").html()
          .replace(/href=\"\.\.\/opac/g, 'href="' + localStorage.opacRoot + 'opac')
          .replace(/bgcolor=\"#[0-9A-Fa-f]{3,6}\"/g, '');
        chrome.tabs.create({url: "list.html"});
      });
    }
  });

//初始化应用程序设置
chrome.runtime.onInstalled.addListener(function() {
  if (/^true$/.test(localStorage.installed)) return;

  //初始设置
  var defaultConfig = {
    enableNotify: false,
    resultsPerPage: 10,
    displayTopWords: true,
    libraryName: "江苏大学图书馆",
    opacRoot: "http://huiwen.ujs.edu.cn:8080/"
  };

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
    getExpired: true,
    //超期图书
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
          chrome.browserAction.setBadgeText({text: notifyCount});
          localStorage.notifyCount = notifyCount;

          while (notify = notifications.pop()) {
            text += (notify.list.length + "本" + notify.title + "：\n");
            for (var j = 0; j < notify.list.length && text.length < 60; j++) {
              text += (notify.list[j].title + " \n");
            }
          }

          //弹出消息
          var msg = webkitNotifications.createNotification("icon.png", "书迷提醒", text);
          msg.addEventListener('click', function() {
            msg.cancel();
            window.open('notifications.html');
          });
          msg.show();
        } else {
          localStorage.removeItem('notifyCount');
        }

        //TODO:这里有一些问题
        /*
				var notification = webkitNotifications.createHTMLNotification("notification.html");
				notification.show();
				setTimeout(function(){notification.close()}, localStorage.notifyTimeout || 20000);
				*/
      }
    });

  }
});

if (localStorage.showContextMenu === "true") {
  localStorage.contextMenuId = chrome.contextMenus.create({
    'title': '在' + localStorage.libraryName +'中搜索 "%s"',
    'contexts': ["selection"],
    'onclick': function(info, tab) {
      var keyword = info.selectionText, method = 'title', match = null;
      if(match = keyword.match(/\b(?:ISBN(?:: ?| ))?((?:978-)?(?:\d-\d{3}-\d{5}-|(?:978)?\d{9})[\dx])\b/i)) {
        method = 'isbn';
        keyword = match[1];
      }
      chrome.tabs.create({
        url: localStorage.opacRoot + "opac/openlink.php?strSearchType=" + method + "&strText=" + keyword
      });    
    }
  });
}