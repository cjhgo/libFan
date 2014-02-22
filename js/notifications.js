/*
  Chrome Extention for Huiwen OPAC

  Copyright (c) 2013-2014 ChiChou
  This software may be freely distributed under the MIT license.

  http://chichou.0ginr.com
*/

$(function() {
  var nofity, notifications = JSON.parse(localStorage.notifications || '[]'), pretty = '';

  while (notify = notifications.pop()) {
    pretty += ("<section><h2>" + notify.list.length + "本" + notify.title + "</h2><ul>");
    for (var j = 0; j < notify.list.length; j++) {
      pretty += ("<li>" + notify.list[j].title + "</li>");
    }
    pretty += ("</ul></section>");
  }

  if(notifications.length)
    $('#notifications').html(pretty);
  else
    $('#close-window').hide();
  
  // localStorage.notificationsHTML = pretty;
  localStorage.removeItem('notifyCount');
  chrome.browserAction.setBadgeText({text: ''});

  var closeWindow = function() { open(location, '_self').close(); };
  $('#mark-as-read').on('click', function() {
    localStorage.removeItem('notifications');
    closeWindow();
  });
  $('#close-window').on('click', closeWindow);
});