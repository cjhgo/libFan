/*
 * Chrome Addin for Huiwen OPAC
 *
 * Copyright (c) 2013,
 * @CodeCorist http://chichou.0ginr.com/blog
 * 
 * Released under the GPL license
 * http://www.gnu.org/copyleft/gpl.html
 *
 */

$(function() {
	//是否显示热门关键字
	if(!JSON.parse(localStorage.displayTopWords)) {
		$("#top-keyword").hide();
	}

	model.opac.getTopKeyword(function(result) {
		var a, div = $("#top-keyword");
		for(var i=0; i<result.length; i++) {
			a = $("<a>").attr("href", "#").html(result[i]);
			div.append(a);
		}
		div.find("a").click(function(){
			$("#keyword").val(this.innerHTML);
			$("form").submit();
			div.hide();
		});
	});
	
	$("#tooltip").mouseover(function() {
		$(this).toggleClass("bottom");
	});
	
	$("form").submit(function() {
		if($("form").data("status") == "busy") return false;		
		var keyword = $("#keyword").val();
		//check whether keyword is empty
		if(keyword.length > 0) {
			//显示loading动画
			$("form").data("status", "busy");
			$("header").animate({"margin-top":"-115px"}, 300);
			$("#search-result").empty();
			$("nav,#top-keyword,footer").hide();
			$("#loading").show();
			
			model.opac.search(keyword, {
				limit:localStorage.resultsPerPage
			}, function(data) {
				$("form").data("status", "idle");
				//显示结果
				var resultList = $("#search-result").show();
				$("nav").show();
				$("nav a").attr("href", data.fullURL);
				$("#loading").hide();

				if(data && data.list.length) {
					var i, item, li, a, span;
					//插入列头
					resultList.append(
						$("<li>").append(
							$("<span>").html(
								$("<em>").text("可借复本")
							).append("/馆藏复本")
						).addClass("first")
					);
					for(i=0; i<data.list.length;i++){
						item = data.list[i];
						a = $("<a>").attr("href", item.link).attr("target", "_blank").text(item.title).data("detail",
							"索书号：" + item.serial + "<br>作　者：" + item.author + "<br>出版社：" + item.publisher +
							"<br>类　别：" + item.type);
						span = $("<span>")./*append("[").*/append($("<em>").text(item.remain).attr("title", "可借复本")
							).append("/"+item.total/*+"]"*/).attr("title", "馆藏复本");
						li = $("<li>").append(span).append(a);
						resultList.append(li);
					}
					var tip = $("#tooltip");
					resultList.mouseout(function() {
						tip.hide(200);
					}).find("li a").mouseover(function() {
						tip.html($(this).data("detail")).show(200);
					});
				} else {
					//NO results found
					resultList.append($("<li>").text("对不起，没有找到您想要的书...试试热门检索吧。"));
					$("#top-keyword").show();
					$("nav").hide();
				}				
			});
		} else {
			//
			
		}
		return false;
	})
})