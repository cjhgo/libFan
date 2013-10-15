/*
 * Chrome Addin for Huiwen OPAC
 *
 * Copyright (c) 2013,
 * @CodeCorist http://weibo.com/u/2167662922
 * 
 * Released under the GPL license
 * http://www.gnu.org/copyleft/gpl.html
 *
 * UI handler for options
 *
 * 选项界面的响应
 *
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

	var loadSetting = function(){
		for(var i in ids){
			value = localStorage.getItem(i);
			e = $("#"+ids[i]);
			if(!e) continue;
			switch(e.attr("type")){
				case "checkbox":
					if(value=="true"){
						e.prop("checked", "checked");
					}
					break;
				case "number":
				case "text":
				default:
					e.val(value);
			}
		}	
	},
	saveSetting = function() {
		for(var i in ids) {
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
		setTimeout(function(){
			$("#successful-saved").animate({opacity:0});
		}, 3000);
	});
	//关闭
	$("#close").click(function() {
		window.close();
	});
	$("#opac-selections > a").on("click", function() {
		$("#opac-root").val(this.href);
		return false;
	});
})