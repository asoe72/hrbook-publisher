const fs = require('fs');
const ejs = require('ejs');
const path = require('path');
const md_it = require("markdown-it");


///@param[in]	pathfile_toc		
exports.bind = function(path_out, path_in, pathfile_toc, pathname_bookinfo)
{
	const str_bookinfo = fs.readFileSync(pathname_bookinfo, 'utf8');
	const bookinfo = JSON.parse(str_bookinfo);

	const toc = readToc(pathfile_toc);
	bindHtmlWithToc(path_out, path_in, toc, bookinfo);
}


///@param[in]	path_out
///@param[in]	path_in
///@param[in]	toc
function bindHtmlWithToc(path_out, path_in, toc, bookinfo)
{
	var pathfile_out = path.join(path_out, "book.html");
	var str_all = "";
	
	for(var i=0; i<toc.length; i++)
	{
		var item = toc[i];
		const pathname_html = path.join(path_out, item.link);

		var str_html = fs.readFileSync(pathname_html, 'utf8');

		str_html = replaceHtml_hd(str_html, item.level);

		str_all += str_html;
	}

	var str_book_cover_front = getHtmlBookCoverFront(bookinfo);
	var str_book_cover_back = getHtmlBookCoverBack();

	str_all = getHtmlFromMergedInBody(bookinfo, str_all, str_book_cover_front, str_book_cover_back);

	fs.writeFileSync(pathfile_out, str_all);
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


///@param[in]	str_body	"<h1>introduction</h1>"
///@param[in]	level		1~6
///@return		"<h2>introduction</h2>"
function replaceHtml_hd(str_body, level)
{
	if(level==1) return str_body;

	var hd_open = `<h${level}>`;
	var hd_close = `</h${level}>`;
	str_body = str_body.replace('<h1>', hd_open);
	str_body = str_body.replace('</h1>', hd_close);

	return str_body;
}


///@param[in]   rel_pathname    상대 경로파일명
///@return      pathname 파일 내의 <body>...</body>의 ... 부분의 문자열
function getInBodyFromHtmlFile(pathname)
{
    const text = fs.readFileSync(pathname, 'utf8');

    const idxSt = text.indexOf('<body>') + '<body>'.length;
    const idxEn = text.lastIndexOf('</body>');
    
    var in_body = text.substring(idxSt, idxEn);

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
	const tmpl_rendered = ejs.render(book_tmpl_ejs, data
		, { views : [ 'public/view/' ] } );	// for include in .ejs

	return tmpl_rendered;
}


///@return      책 뒷 표지 html 문서의 문자열
function getHtmlBookCoverBack()
{
	var pathname_book_cover_back = 'public/view/book_cover_back_ko.html';
	var html = getInBodyFromHtmlFile(pathname_book_cover_back);
	return html;
}
