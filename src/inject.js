//Chrome Addin for Huiwen OPAC

//Copyright (c) 2012, lmmsoft@126.com
//Released under the GPL license
//http://www.gnu.org/copyleft/gpl.html

//rewritten by ChiChou [http://chichou.0ginr.com]

(function(){
    "use strict";
    //
    var
        //程序设定
        config = {
            school: "ujs",
            library: "江苏大学图书馆",
            baseUrl: "http://huiwen.ujs.edu.cn:8080/opac/"
        },

        //获得当前页面的域名
        domain = document.domain.match(/amazon|douban|dangdang|jd/i),

        //书籍信息
        book
    ;

    if(typeof domain == null)
        return false;

    domain = domain[0];
    book = getBookInfo();

    //不是详细内容页面
    if(!initUI()) return false;
    getSearchInfo(book.ISBN);

    function getBookInfo() {
        //书籍的ISBN, 封面, 标题
        var _ISBN, _cover, _title;

        switch (domain) {
            case 'douban':
                _ISBN  = $("#info").text().match(/ISBN\: (\d+)/)[1];
                _cover = '#mainpic img';
                _title = $('h1 span').text();
                break;
            case 'amazon':
                var items = $(".content li b");
                for(var i=0; i<items.length; i++) {
                    var e = $(items[i]);
                    if(e.html() == "条形码:") {
                        _ISBN = e.parent().html().match(/\d+/).toString();
                        break;
                    }
                }
                _cover = "#original-main-image";
                _title = $("#btAsinTitle").text().split(' [')[0].toString();
                _title = _ISBN = "";                
                break;
            case 'dangdang':
                _title = $("h1").text();
                //_ISBN  = $(".ws4").parent().html().match(/d+/);
                _ISBN  = $(".ws4").parent().html().substring(27);
                _cover = "#largePic";
                break;
            case 'jd':
                _ISBN  = $("#summary-isbn .dd").html().toString();
                _title = $("h1").text().match(/\S+/).toString();
                _cover = ".bigimg";
                break;
            default:
        }
        //alert($(_cover).attr("src"));
        return {
            ISBN : _ISBN,
            cover : $(_cover).attr("src"),
            title : _title
        };
    }

    //初始化界面
    function initUI() {
        var id = ["ujs-lib-plugin-css", "ujslib"],
            list = {
                'douban'   : ["#buyinfo", "gray_ad"],
                'amazon'   : ['#ps-content', "cBoxInner"],
                'dangdang' : [".buy_area", "buy_area"],
                'jd'       : ['#o-suit', "box_jd"]
            }[domain], markElement;

        if(list) markElement = $(list[0]);
        if(markElement && markElement.length) {
            //正确的页面
            markElement.before('<div class="'+list[1]+'" id="'+id[1]+'"></div>');
            $('#'+id[1]).append('<h2>'+config.library+'有没有?</h2><div class="bs" id="isex"><img src="'+
                chrome.extension.getURL("loading.gif")+'""></div>');
            //加载样式表
            $("head").append("<link id='"+id[0]+"'>").children("#"+id[0]).attr({
                rel: "stylesheet",
                type: "text/css",
                href: chrome.extension.getURL("inject.css")
            });

            return true;
        }
        return false;
    }

    /*
    抓取搜索图书页面
    部分书籍在OPAC系统中存储的ISBN编号可能是旧版的10位编码，直接截取substring(3,12)即可
    */
    function getSearchInfo(ISBN) {
        ISBN = String(ISBN);
        if(!/(\d{9}|\d{13})/.test(ISBN)) return;
        var url = config.baseUrl + "openlink.php?strSearchType=isbn&historyCount=1&strText=" + ISBN
         + "&x=0&y=0&doctype=ALL&match_flag=forward&displaypg=20&sort=CATA_DATE&orderby=desc&showmode=list&dept=ALL";
        $.ajax({
            dataType: "html",
            url: url,
            success: function (data) {
                if (data.indexOf('本馆没有您检索的馆藏书目') != -1) {
                    //如果是13位的ISBN则尝试重试
                    if(ISBN.length == 13) {
                        getSearchInfo(ISBN.substring(3,12));
                    } else {
                        var urlFull = config.baseUrl + "openlink.php?strSearchType=title&historyCount=1&strText=" + 
                            book.title + "&x=16&y=14&doctype=ALL&match_flag=forward&displaypg=20" + 
                            "&sort=CATA_DATE&orderby=desc&showmode=list&dept=ALL";

                        $('#isex').html('哎呀，没有找到这本书…… <a href="' + urlFull + '" target="_blank">搜搜类似的书</a>');                        
                    }
                } else {
                    //消除控制台的图片404错误
                    data = data.replace(/(href|src)=\"..\/tpl\S*?\"/g, "");

                    var dom = $(data),
                        bookInfo = dom.find("#list_books p span").text().match(/\d+/g),
                        url = dom.find("h3 a").attr("href"),
                        total = bookInfo[0], remain = bookInfo[1],
                        tip = '一共' + total + '本，';

                    tip += ( remain == 0 ? 
                        '竟然都被借光了！<br />学霸们太威武啦！' : '还剩' + remain + '本，哈哈，是我的啦！'
                    );

                    $('#isex').html(tip);
                    loadBookDetail(url);
                }
            }
        });
    }

    //抓取具体图书信息页面
    function loadBookDetail(url) {
        $.ajax({
            dataType: "html",
            url: config.baseUrl + url,
            success: function (data) {
                //消除控制台404错误
                data = data.replace(/(href|src)=\"[\S\s]*?\"/g, "");
                var table = $(data).find("table").removeAttr("width");

                $('#ujslib').append(table).append('<p><a href="'+config.baseUrl+url+'" target="_blank">到图书馆看看</a></p>');
                //删除不必要的信息
                /*
                $((function(){
                    var result = [], columns = [2,3,4];
                    for(var i=0;i<columns.length;i++) {
                        result.push("#ujslib tr td:nth-child("+columns[i]+")");
                    }
                    return result.join();
                })()).remove(); 
                */
                //删除2,3,4列                
                $("#ujslib tr td:nth-child(2),#ujslib tr td:nth-child(3),#ujslib tr td:nth-child(4)").remove();
                $("#ujslib table").hide().show(500);
            }
        });
    } 
})()