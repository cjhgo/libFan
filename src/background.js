/*
 * Chrome Addin for Huiwen OPAC
 *
 * Copyright (c) 2013,
 * @CodeCorist http://weibo.com/u/2167662922
 * 
 * Released under the GPL license
 * http://www.gnu.org/copyleft/gpl.html
 *
 * 进行同步和初始化操作
 */

//初始化应用程序设置
chrome.runtime.onInstalled.addListener(function() {
	if(/^true$/.test(localStorage.installed)) return;

	//初始设置
	var defaultConfig = {
		enableNotify: false,
		resultsPerPage: 10,
		displayTopWords: true,
		opacRoot: "http://huiwen.ujs.edu.cn:8080/"
	};
	for(var i in defaultConfig){
		localStorage.setItem(i, defaultConfig[i]);
	}

	localStorage.installed = true;
});

//通信函数
function getNotifications() {
	return window.notifications || false;
}

//浏览器启动
chrome.runtime.onStartup.addListener(function() {
	//待处理提醒
	var notifications = [], totalMsgNum = 0, receivedMsgNum = 0;

	//同步提醒
	if(!JSON.parse(localStorage.enableNotify)) return

	//TODO:在设置界面中设定需要接收的提醒
	var notifyItems = {
		getExpired: true, //超期图书
		getAboutToExpire: true //即将到期图书
	};

	for(var i in notifyItems) {
		if(!notifyItems[i] || !model.user.hasOwnProperty(i)) break;

		totalMsgNum++;
		model.user[i](localStorage.userId, function(result) {				
			//添加结果集
			if(result && result.list.length){
				notifications.push(result);
			}
			
			//是否全部同步完成
			if(++receivedMsgNum == totalMsgNum) {
				var notify, text = "您有";
				while(notify = notifications.pop()) {
					text += (notify.list.length + "本" + notify.title + "：");
					for(var j=0; j<notify.list.length; j++){
						text += (notify.list[j].title + " ");
						if(text.length > 60) {
							text += "...";
							break;
						}
					}
				}
				
				//显示提醒数目
				if(notifications.length){
					chrome.browserAction.setBadgeText({
						text: notifications.length.toString()});

					//弹出消息
					var msg = webkitNotifications.createNotification("icon.png", "书迷提醒", text)
					msg.addEventListener('click', function() {
					    msg.cancel();
					    window.open('help/index.html');
					})
					msg.show();
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
