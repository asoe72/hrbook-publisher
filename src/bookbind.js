const fs = require('fs');
const fse = require('fs-extra');
const ejs = require('ejs');
const path = require('path');
const md_it = require("markdown-it");
const toc_ex = require("./toc_ex");
const util = require("./util");
const helpsect = require("./helpsect");


///@param[in]	pathfile_toc		
exports.bind = function(path_out, path_in, pathfile_toc, pathname_bookinfo)
{
	let str_bookinfo = fs.readFileSync(pathname_bookinfo, 'utf8');	// utf16 bom이 붙어 리턴된다. 원인불명.
	str_bookinfo = util.removeUtf16Bom(str_bookinfo);
	const bookinfo = JSON.parse(str_bookinfo);

	const toc = readToc(pathfile_toc);
	bindMdWithToc(path_in, path_out, toc);
	bindHtmlWithToc(path_out, toc, bookinfo);
	copyAssets(path_out, path_in);
}


///@param[in]	path_out
///@param[in]	toc
function bindMdWithToc(path_in, path_out, toc)
{
	let binded = {
		str_all: '',
		index: [],
		char_ofs: 0,
		byte_ofs: 0
	};

	// 모든 toc 항목 처리
	for(let i=0; i<toc.length; i++)
	{
		let toc_item = toc[i];
		const pathname_md = path.join(path_in, toc_item.link_md);
		let ret = bindMdSub(pathname_md, toc_item, binded);
		if(ret == -1) continue;
	}

	// 한 덩어리로 bind된 파일로 출력 (검색용 색인 역할도 함.)
	let pathname_book_md = path.join(path_in, "book.md");
	util.writeFileSyncUtf8(pathname_book_md, binded.str_all);
	
	// 검색용 색인 파일로 출력
	let pathname_index_json = path.join(path_in, "index.json");
	let str_index = JSON.stringify(binded.index, null, '\t');
	util.writeFileSyncUtf8(pathname_index_json, str_index);
}


///@param[in]		pathname_md
///@param[in]		toc_item
///@param[in,out]	binded
function bindMdSub(pathname_md, toc_item, binded)
{
	if(fs.existsSync( pathname_md )==false) {
		console.log('file not found: ' + pathname_md);
		return -1;
	}
	
	// .md 파일을 한 덩어리로 bind
	let str_md = fs.readFileSync(pathname_md, 'utf8');
	str_md = str_md.replace('\ufeff', '');			// strip BOM
	str_md = str_md.replace(/\r\n/g, '\n');		// 개행문자 \n로 변환
	binded.str_all += str_md;

	calcIndexForFind(pathname_md, str_md, toc_item, binded);

	return 0;
}


///@param[in]		str_md
///@param[in]		toc_item
///@param[in,out]	binded
///@brief 			검색용 색인 생성
function calcIndexForFind(pathname_md, str_md, toc_item, binded)
{
	let idx_item = { link: toc_item.link_md, char_ofs: binded.char_ofs, byte_ofs: binded.byte_ofs };
	binded.index.push(idx_item);

	binded.char_ofs += str_md.length;	// 문자 단위 offset 계산

	// if(str_md.length<12) {
	// 	console.log(str_md.length);
	// 	console.log(`[${str_md}]`);
	// }
	let stats = fs.statSync(pathname_md);	// file size 얻기
	binded.byte_ofs += stats.size;	// byte 단위 offset 계산
}


///@param[in]	path_out
///@param[in]	toc
///@param[in]	bookinfo
function bindHtmlWithToc(path_out, toc, bookinfo)
{
	var pathfile_out = path.join(path_out, "book.html");
	var str_all = "";
	let html_toc = "";
	
	for(var i=0; i<toc.length; i++)
	{
		let str_html = bindHtmlSub(path_out, toc[i]);
		let res = toc_ex.processTocItem(str_html, toc[i], bookinfo.tocTitleElements);
		if(res==null) continue;
		
		str_all += res.str_html;
		html_toc += res.toc_row;
	}
	
	str_all = postprocHtml(str_all);

	let data = {
		bookinfo: bookinfo,
		merged_in_body: str_all		// article들이 병합된 in_body 문자열
	};

	data.str_book_cover_front = getHtmlBookCoverFront(bookinfo);
	data.str_book_cover_back = getHtmlBookCoverBack(bookinfo);
	data.toc_without_page = true;
	data.html_toc = html_toc;	// test

	str_all = getHtmlFromMergedInBody(data);

	fs.writeFileSync(pathfile_out, '\ufeff' + str_all, { encoding: 'utf8' });
}


///@param[in]	path_out
///@param[in]	item
///@return		생성된 html 문자열. 실패하면 ""
function bindHtmlSub(path_out, item)
{
	const pathname_html = path.join(path_out, item.link);
	if(fs.existsSync( pathname_html )==false) {
		console.log('file not found: ' + pathname_html);
		return "";
	}

	var str_html = fs.readFileSync(pathname_html, 'utf8');

	str_html = preprocHtml(str_html, item);

	helpsect.makeWholeHtmlFromInBody(pathname_html, str_html);

	return str_html;
}


///@param[in]	path_out
///@param[in]	path_in
function copyAssets(path_out, path_in)
{
	const pathname_src = path.join(path_in, '_assets');
	const pathname_dst = path.join(path_out, '_assets');
	if(fs.existsSync( pathname_src )==false) return;
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
		item.link_md = arr_tc[0].attrs[0][1];
		item.link = item.link_md.replace(".md", ".html");
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
	str = preprocHtml_preCodeStyle(str);
	str = preprocHtml_removeEmpty_thead(str);
	
	return str;
}


///@param[in]	str
///@return		postprocessed html text
function postprocHtml(str)
{
	var str = postprocHtml_assetPathTo1Level(str);
	
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
function postprocHtml_assetPathTo1Level(str)
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


///@param[in]   data
///				-	bookinfo
///				-	merged_in_body				article들이 병합된 in_body 문자열
///				-	str_book_cover_front		책 앞 표지 html
///				-	str_book_cover_back		책 뒷 표지 html
///@return      완전한 html 문서의 문자열
///@brief		template html의 in-body 표식을 merged_in_body로 대체하여
///				head까지 갖춘 완전한 html 문서의 문자열을 리턴한다.
function getHtmlFromMergedInBody(data)
{
	const rpathname = 'public/view/book_template.ejs';
	const book_tmpl_ejs = fs.readFileSync(rpathname, 'utf-8');

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

