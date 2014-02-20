/*
  Chrome Extention for Huiwen OPAC

  Copyright (c) 2013-2014 ChiChou
  This software may be freely distributed under the MIT license.

  http://chichou.0ginr.com
*/

$(function() {
  $('#book-list').html(localStorage.rawListData);
  $('#data-name').text(localStorage.userName);
  $('#data-library').text(localStorage.libraryName);
  
  var lastRow = $("#book-list tr:last-child"), beginningDate, index;
  $('.greytext').each(function(i, e) {
    if(e.innerText == "借阅日期") {
      index = i + 1;
      return false;
    }
  });
  $('#data-count').text(lastRow.find('td:first').text());
  beginningDate = lastRow.find('td:nth-of-type(' + index + ')').text();
  $('#data-days').text(Math.floor(((new Date) - new Date(beginningDate)) / (1000 * 3600 * 24)));

  // TODO:数据分析
  // $("#list tr").each(function(i, e) {

  // });

/*
70 是偶尔看看书的普通青年。

40 
20
10 是学富五车
10 读书切忌囫囵吞枣，有数量也要质量。
5
4 同学，你是来捣乱的吧？
*/
});