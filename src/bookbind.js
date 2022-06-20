const fs = require('fs');
const fse = require('fs-extra');
const ejs = require('ejs');
const path = require('path');
const md_it = require("markdown-it");
const util = require("./util");
const helpsect = require("./helpsect");


///@param[in]	pathfile_toc		
exports.bind = function(path_out, path_in, pathfile_toc, pathname_bookinfo)
{
	let str_bookinfo = fs.readFileSync(pathname_bookinfo, 'utf8');	// utf16 bom이 붙어 리턴된다. 원인불명.
	str_bookinfo = util.removeUtf16Bom(str_bookinfo);
	const bookinfo = JSON.parse(str_bookinfo);

	const toc = readToc(pathfile_toc);
	bindHtmlWithToc(path_out, toc, bookinfo);
	copyAssets(path_out, path_in);
}


///@param[in]	path_out
///@param[in]	toc
///@param[in]	bookinfo
function bindHtmlWithToc(path_out, toc, bookinfo)
{
	var pathfile_out = path.join(path_out, "book.html");
	var str_all = "";
	
	for(var i=0; i<toc.length; i++)
	{
		var item = toc[i];
		const pathname_html = path.join(path_out, item.link);
		if(fs.existsSync( pathname_html )==false) {
			console.log('file not found: ' + pathname_html);
			continue;
		}

		var str_html = fs.readFileSync(pathname_html, 'utf8');

		str_html = preprocHtml(str_html, item);

		str_all += str_html;

		helpsect.makeWholeHtmlFromInBody(pathname_html, str_html);
	}

	var str_book_cover_front = getHtmlBookCoverFront(bookinfo);
	var str_book_cover_back = getHtmlBookCoverBack(bookinfo);

	str_all = getHtmlFromMergedInBody(bookinfo, str_all, str_book_cover_front, str_book_cover_back);

	fs.writeFileSync(pathfile_out, str_all);
}


///@param[in]	path_out
///@param[in]	path_in
function copyAssets(path_out, path_in)
{
	const pathname_src = path.join(path_in, '_assets');
	const pathname_dst = path.join(path_out, '_assets');
	fse.copySync(pathname_src, pathname_dst);
}


///@param[in]	pathfile_toc
function readToc(pathfile_toc)
{
	const str_toc = fs.readFileSync(pathfile_toc, 'utf8');
	const md = md_it();
	const arr_token = md.parse(str_toc);

	const toc = arrItemFromArrToken(arr_token);
	return toc;
}


///@param[in]	arr_token
// @return		arr_item	간략화한 배열
function arrItemFromArrToken(arr_token)
{
	var arr_item = [];

	for(var i=0; i<arr_token.length; i++)
	{
		var item = {};
		const token = arr_token[i];
		if(token.type != "inline") continue;
		if(token.level < 3) continue;

		const arr_tc = token.children;
		const link_md = arr_tc[0].attrs[0][1];
		item.link = link_md.replace(".md", ".html");
		item.link = removeFolderTrailingDot(item.link);
		item.title = arr_tc[1].content;
		item.level = (token.level-1)/2;
		
		console.log(item.title);

		arr_item.push(item);		
	}

	return arr_item;
}


///@param[in]	str	"flowcontrol-subprogram/3.2./README.md"
///@return		"flowcontrol-subprogram/3.2/README.md"
function removeFolderTrailingDot(str)
{
    var re = /\.\//g;
	return str.replace(re, '/');
}


///@param[in]	str
///@param[in]	item
///@return		preprocessed html text
function preprocHtml(str, item)
{
	var str = preprocHtml_hdLevel(str, item.level);
	str = preprocHtml_assetPathTo1Level(str);
	str = preprocHtml_preCodeStyle(str);
	str = preprocHtml_removeEmpty_thead(str);
	
	return str;
}


///@param[in]	str_body	"<h1>introduction</h1>"
///@param[in]	level		1~6
///@return		"<h2>introduction</h2>"
function preprocHtml_hdLevel(str_body, level)
{
	if(level==1) return str_body;

	var hd_open = `<h${level}>`;
	var hd_close = `</h${level}>`;
	str_body = str_body.replace('<h1>', hd_open);
	str_body = str_body.replace('</h1>', hd_close);

	return str_body;
}


///@param[in]	str	"../../../_assets/image33.png"
///@return		"_assets/image33.png"
function preprocHtml_assetPathTo1Level(str)
{
    var re = /(\.\.\/)+_assets/g;
	return str.replace(re, '_assets');
}


///@param[in]	str		'<pre><code'
///@return		'<pre class="codebox"><code'
function preprocHtml_preCodeStyle(str)
{
    var re = /<pre><code/g;
	return str.replace(re, '<pre class="codebox"><code');
}


function preprocHtml_removeEmpty_thead(str)
{
	var re = /<thead>\s*<tr>\s*(<th.*?><\/th>\s*)+<\/tr>\s*<\/thead>\s*/gm;
	return str.replace(re, '');
}


///@param[in]   rel_pathname    상대 경로파일명
///@return      pathname 파일 내의 <body>...</body>의 ... 부분의 문자열
function getInBodyFromHtmlFile(pathname)
{
	const text = fs.readFileSync(pathname, 'utf8');
	const in_body = util.strInTag(text, 'body', true);
	return in_body;
}


///@param[in]   bookinfo
///@param[in]   merged_in_body		article들이 병합된 in_body 문자열
///@param[in]   book_tail			책 뒷 표지 html
///@return      완전한 html 문서의 문자열
///@brief		template html의 in-body 표식을 merged_in_body로 대체하여
///				head까지 갖춘 완전한 html 문서의 문자열을 리턴한다.
function getHtmlFromMergedInBody(bookinfo, merged_in_body, str_book_cover_front, str_book_cover_back)
{
	const rpathname = 'public/view/book_template.ejs';
	const book_tmpl_ejs = fs.readFileSync(rpathname, 'utf-8');
	const data = { 
		bookinfo: bookinfo, 
		merged_in_body: merged_in_body,
		str_book_cover_front: str_book_cover_front,
		str_book_cover_back: str_book_cover_back
	};
	const tmpl_rendered = ejs.render(book_tmpl_ejs, data
		, { views : [ 'public/view/' ] } );	// for include in .ejs

	return tmpl_rendered;
}


///@param[in]   bookinfo
///@return      책 앞 표지 html 문서의 문자열
function getHtmlBookCoverFront(bookinfo)
{
	const rpathname = 'public/view/book_cover_front.ejs';
	const book_tmpl_ejs = fs.readFileSync(rpathname, 'utf-8');
	const data = { bookinfo: bookinfo };
	let tmpl_rendered = ejs.render(book_tmpl_ejs, data
		, { views : [ 'public/view/' ] } );	// for include in .ejs

	tmpl_rendered = util.strInTag(tmpl_rendered, 'body', true);
	return tmpl_rendered;
}


///@param[in]   bookinfo
///@return      책 뒷 표지 html 문서의 문자열
function getHtmlBookCoverBack(bookinfo)
{
	var pathname_book_cover_back = `public/view/book_cover_back_${bookinfo.langCode}.html`;
	var html = getInBodyFromHtmlFile(pathname_book_cover_back);
	return html;
}

