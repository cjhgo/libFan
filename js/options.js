/*
  Chrome Extention for Huiwen OPAC

  Copyright (c) 2013-2014 ChiChou
  This software may be freely distributed under the MIT license.

  http://chichou.0ginr.com
*/

$(function() {
    //加载所有设定值
    var ids = {
        resultsPerPage: "page-limit",
        displayTopWords: "show-top-search",
        enableNotify: "enable-notify",
        userId: "user-id",
        opacRoot: "opac-root",
        showContextMenu: "show-context-menu",
        userName: "user-name"
    }, value, e;

    var loadSetting = function() {
        for (var i in ids) {
            value = localStorage.getItem(i);
            e = $("#" + ids[i]);
            if (!e) continue;
            if (e[0].tagName.toLowerCase() !== "input") {
                e.text(value);
                continue;
            }
            switch (e.attr("type")) {
                case "checkbox":
                    if(value === "true") {
                        e.prop("checked", "checked");
                    }
                    break;
                case "number":
                case "text":
                default:
                    e.val(value);
            }
        }
        $(localStorage.userId ? '#message-authed' : '#message-guest').show();
    },
    saveSetting = function() {
        for (var i in ids) {
            e = $("#"+ids[i]);
            if(!e || e[0].tagName !== "input") continue;
            switch(e.attr("type")) {
                case "checkbox":
                    value = e.prop("checked");
                    break;
                case "number":
                case "text":
                    value = e.val();
                    break;
                default:
                    value = e.text();
            }
            localStorage.setItem(i, value);
        }
    }

    //加载设置到界面
    loadSetting();
    
    $("#opac-root").on("click", function() {
        $(this).select();
    });

    $("#save").click(function() {
        saveSetting();
        $("#successful-saved").animate({opacity:1}, 100);
        setTimeout(function() { $("#successful-saved").animate({opacity:0}); }, 3000);
    })
    $("#close").click(function() { open(location, '_self').close(); });
    $("#opac-selections > a").on("click", function() { $("#opac-root").val(this.href); return false; });
    $("#auth, #reauth").on("click", function(){ open(localStorage.opacRoot + 'reader/login.php','login') });
    $("#logoff").on('click', function() {
        if(!confirm('确认删除[' + localStorage.userName + ']的登录信息？')) return;
        localStorage.removeItem('userName');
        localStorage.removeItem('userId');
        localStorage.enableNotify = 'false';
        $('#enable-notify').prop('checked', 'unchecked');
        $('#message-authed, #message-guest').hide();
        $(localStorage.hasOwnProperty('userId') ? '#message-authed' : '#message-guest').show();
    });
})