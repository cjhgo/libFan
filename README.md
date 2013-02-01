﻿#书迷

一个为图书馆爱好者设计的Chrome扩展程序，可以更方便地检索图书馆资源。
基于[lmmsoft/njust-library-chrome-plugin](https://github.com/lmmsoft/njust-library-chrome-plugin)重构。

##功能

> 1.启动浏览器时检查图书到期情况并显示还书提醒。

> 2.在浏览豆瓣、亚马逊、当当、京东的图书网页时，可直接查看书籍在图书馆的馆藏和借阅情况。

> 3.馆藏书目关键字检索。

##安装扩展

本扩展暂未发布到Chrome商店。如果需要安装，请下载打包好的.crx文件或者使用开发者模式导入源代码。

###安装crx

> 1.在地址栏中输入chrome://extensions。

> 2.将.crx文件拖入，将弹出确认对话框。

> 3.选择安装

###开发者模式

> 1.在地址栏中输入chrome://extensions。

> 2.选中 开发者模式。

> 3.单击 载入未打包的扩展 ，将弹出一个文件选择对话框。

> 4.找到源代码存放的文件夹，导入。如果插件没有错误，将会立即安装成功。

##待完善

提供对其他公共图书馆OPAC系统的支持。

#libFan

A Chrome Extension that provides easy access to University of Jiangsu OPAC System.
Based on [lmmsoft/njust-library-chrome-plugin](https://github.com/lmmsoft/njust-library-chrome-plugin).

##Features

> 1.Checks books that are about to expire and shows an notify on startup.

> 2.Add a chart about the book while browsing websites below:
book.douban.com, 

> 3.Search books in the library by keyword.

##Load the extension from source

Extensions that you download from the Chrome Web Store are packaged up as .crx files, which is great for distribution, but not so great for development. Recognizing this, Chrome gives you a quick way of loading up your working directory for testing. Let's do that now.

> 1.Visit chrome://extensions in your browser (or open up the settings menu by clicking the icon to the far right of the Omnibox > and select *Extensions* under the *Tools* menu to get to the same place).

> 2.Ensure that the Developer Mode checkbox in the top right-hand corner is checked.

> 3.Click Load unpacked extension… to pop up a file-selection dialog.

> 4.Navigate to the directory in which your extension files live, and select it.
If the extension is valid, it'll be loaded up and active right away! If it's invalid, an error message will be displayed at the top of the page. Correct the error, and try again.

##TODO

Support more public libraries.