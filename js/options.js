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
		opacRoot: "opac-root"
	}, value, e;

	var loadSetting = function() {
		for (var i in ids) {
			value = localStorage.getItem(i);
			e = $("#"+ids[i]);
			if (!e) continue;
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
		//todo:auth
	},
	saveSetting = function() {
		for (var i in ids) {
			e = $("#"+ids[i]);
			if(!e) continue;
			switch(e.attr("type")){
				case "checkbox":
					value = e.prop("checked");
					break;
				case "number":
				case "text":
				default:
					value = e.val();
			}
			localStorage.setItem(i, value);
		}
	}

	//加载设置到界面
	loadSetting();
	//保存
	$("#save").click(function() {
		saveSetting();
		$("#successful-saved").animate({opacity:1}, 100);
		setTimeout(function() { $("#successful-saved").animate({opacity:0}); }, 3000);
	})
	$("#close").click(function() { open(location, '_self').close(); });
	$("#opac-selections > a").on("click", function() { $("#opac-root").val(this.href); return false; });
	$("#auth").on("click", function(){ open(localStorage.opacRoot + 'reader/login.php','login') });
})