﻿/*
  Chrome Extention for Huiwen OPAC

  Copyright (c) 2013-2014 ChiChou
  This software may be freely distributed under the MIT license.

  http://chichou.0ginr.com
*/
window.model = {
    supoorted: [
        {
            title: "江苏大学",
            url: "http://huiwen.ujs.edu.cn:8080/",
            ver: "4"
        },{
            title: "南京大学",
            url: "http://huiwen.ujs.edu.cn:8080/",
            ver: "4"
        },{
            title: "南京理工大学",
            url: "",
            ver: "5" //TODO:支持5的规则
        }
    ],
    //用户信息
    user: {
        baseURL: localStorage.opacRoot + "reader/",
        getRss: function(id, type, callback) {
            $.ajax({
                dataType: 'xml',
                url: model.user.baseURL + "rss.php?type={$t}&id={$i}"
                    .replace(/\{\$(\w)\}/g, function($0, $1) {
                        return {
                            "t": type,
                            "i": id
                        }[$1];
                    }),
                success: function(xml) {
                    var dom = $(xml), list = dom.find("item"), items, item,
                        result = {title: dom.find("channel > title").text(), list:[]},
                        child = function(parent, tag){
                            return $(parent).find(tag).text();
                        };

                    for(var i=0; i<list.length;i++) {                       
                        result.list.push({
                            title: child(list[i], "title"),
                            link: child(list[i], "link"),
                            description: child(list[i], "description")
                        });
                    }
                    callback(result);
                  } 
              }) 
        },
        //预约到书
        getPreserve: function(id, callback) {
            return this.getRss(id, 1, callback);
        },
        //委托到书
        getDelegate: function(id, callback) {
            return this.getRss(id, 2, callback);
        },
        //超期图书
        getExpired: function(id, callback) {
            return this.getRss(id, 3, callback);
        },
        //即将到期
        getAboutToExpire: function(id, callback){
            return this.getRss(id, 4, callback);
        },
        //系统推荐
        getRecommend: function(id, callback){
            return this.getRss(id, 5, callback);
        },
    },
    opac: {
        //
        baseURL: localStorage.opacRoot + "opac/",
        //热门检索
        getTopKeyword: function(callback) {
            $.get(this.baseURL + "ajax_topten.php", function(data) {
                var TAG_OPEN = "')\">", TAG_CLOSE = "</a>",
                    pos = data.indexOf(TAG_OPEN), result = [];

                while (pos !== -1) {
                    a = pos + TAG_OPEN.length;
                    b = data.indexOf(TAG_CLOSE, a);
                    result.push(data.substring(a, b));
                    pos = data.indexOf(TAG_OPEN, b);
                }
                callback(result);
            });
        },
        //执行搜索，并返回给callback
        search: function(keyword, options, callback) {
            var page = options.page || 0,
                limit = options.limit || 10;
            keyword = encodeURIComponent(keyword);

            var url = this.baseURL + "openlink.php?strSearchType=title&strText={$k}&displaypg={$l}&page={$p}"
                .replace(/\{\$(\w)\}/g, function($0, $1) {
                    return {
                        "k": keyword,
                        "l": limit,
                        "p": page
                    }[$1];
                });//搜索页面URL

            //解析页面
            $.ajax({
                dataType: "html",
                url: url,
                //解析正文内容
                success: function(data) {
                    //消除控制台404错误
                    data = data.replace(/(href|src)=\"..\/tpl\S*?\"/g, "");

                    var result = {
                        //详细的搜索列表页面地址
                        fullURL: url,
                        //结果列表
                        list: []
                    }, dom = $(data), list;

                    //结果总数
                    result.totalResult = dom.find("#titlenav strong.red").html();
                    list = dom.find(".list_books");
                    for(var i=0; i<list.length; i++) {
                        //在limit参数小于20的时候会失效，必须手动退出循环
                        if(i > limit) break;

                        //馆藏复本、可借复本信息
                        var div = $(list[i]),
                            numbers = div.find("p span").html().match(/\d+/g),
                            intro = div.find("p").html().match(/<\/span>\s+([\S\s]+)/),
                            serial = div.find("h3").html().match(/<\/a>\s+([\S\s]+)/);

                        if(!(numbers && intro && serial)) continue;
                        //分解为作者和出版社字段
                        intro = intro[1].split(/\s<br>/);
                        //作者和出版社为空
                        if(intro.length == 1) intro = ["暂无", "暂无"];

                        //添加项目
                        result.list.push({
                            title: div.find("h3 a").text().replace(/^\d+./, ""), //除去开头的数字编号
                            total: numbers[0], //馆藏复本
                            remain: numbers[1], //可借复本
                            author: intro[0], //作者
                            publisher: intro[1].replace(/^\s*|\s*$/g,""), //出版社
                            serial: serial[1],
                            type: div.find(".doc_type_class").text(), //图书类别
                            link: model.opac.baseURL + div.find("h3 a").attr("href") //详情页面链接
                        });
                    }
                    callback(result);
                },
                //失败
                error: function() {
                    callback(false);
                }
            });
        }
    }
}