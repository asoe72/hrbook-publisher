const fs = require('fs');
const fse = require('fs-extra');
const ejs = require('ejs');
const path = require('path');
const md_it = require("markdown-it");
const util = require("./util/util");
const git_util = require("./util/git_util");
const { replaceVariablesInBookinfoToValues, replaceVariablesInStrToValues } = require('./variables.mjs');
const helpsect = require("./helpsect");
const references = require("./references");


///@param[in]	pathfile_toc		
exports.bind = async function(path_out, path_in, variables, pathfile_toc, pathname_bookinfo)
{
	let str_bookinfo = fs.readFileSync(pathname_bookinfo, 'utf8');	// utf16 bom이 붙어 리턴된다. 원인불명.
	str_bookinfo = util.removeBom(str_bookinfo);
	let bookinfo = null;
	try {
		bookinfo = JSON.parse(str_bookinfo);
	}
	catch(err) {
		console.error(`bookbind) json.parse(${pathname_bookinfo}) error`, err.message);
		return null;
	}
	if (bookinfo.variables !== null && typeof bookinfo.variables === 'object') {
		Object.assign(bookinfo.variables, variables);		// 전달받은 variables를 bookinfo.variables에 병합
	}
	else {
		bookinfo.variables = variables;
	}
	replaceVariablesInBookinfoToValues(bookinfo);

	bookinfo.updatedDate = git_util.getCurrentCommitDate(path_in);
	bookinfo.copyrightYear = makeCopyrightYear(path_in);
	const toc = readToc(pathfile_toc);
	bindMdWithToc(path_in, path_out, toc, bookinfo);
	await bindHtmlWithToc(path_out, toc, bookinfo);
	copyAssets(path_out, path_in);
}


///@return		e.g. '2022-2025' or '2025'
function makeCopyrightYear(path_in)
{
	const createdDate = git_util.getFirstCommitDate(path_in);
	const updatedDate = git_util.getCurrentCommitDate(path_in);
	const createdYear = createdDate.split("-")[0];
	const updatedYear = updatedDate.split("-")[0];
	if (createdYear === updatedYear) return createdYear;
	else return `${createdYear}-${updatedYear}`;
}


///@param[in]	path_out
///@param[in]	toc
function bindMdWithToc(path_in, path_out, toc, bookinfo)
{
	let binded = {
		str_all: '',
	};

	// 모든 toc 항목 처리
	for(let i=0; i<toc.length; i++)
	{
		let toc_item = toc[i];
		const pathname_md = path.join(path_in, toc_item.link_md);
		let ret = bindMdSub(pathname_md, toc_item, binded, bookinfo);
		if(ret == -1) continue;
	}

	// 한 덩어리로 bind된 파일로 출력 (검색용 색인 역할도 함.)
	let pathname_book_md = path.join(path_in, "book.md");
	util.writeFileSyncUtf8(pathname_book_md, binded.str_all);
}


///@param[in]		pathname_md
///@param[in]		toc_item
///@param[in,out]	binded
function bindMdSub(pathname_md, toc_item, binded, bookinfo)
{
	if(fs.existsSync( pathname_md )==false) {
		console.log('file not found: ' + pathname_md);
		return -1;
	}
	
	// .md 파일을 한 덩어리로 bind
	let str_md = fs.readFileSync(pathname_md, 'utf8');
	str_md = str_md.replace('\ufeff', '');			// strip BOM
	str_md = str_md.replace(/\r\n/g, '\n');		// 개행문자 \n로 변환
	str_md = `\r\n[__SOURCE](${toc_item.link_md})\r\n` + str_md;	// 검색용 링크 삽입
	binded.str_all += str_md;

	return 0;
}


///@param[in]	path_out
///@param[in]	toc
///@param[in]	bookinfo
async function bindHtmlWithToc(path_out, toc, bookinfo)
{
	var pathfile_out = path.join(path_out, "book.html");
	var str_all = "";
	let html_toc = "";
	
	for(var i=0; i<toc.length; i++)
	{
		let str_html = bindHtmlSub(path_out, toc[i]);
		str_all += str_html;
	}
	
	str_all = replaceVariablesInStrToValues(str_all, bookinfo.variables);
	str_all = postprocHtml(str_all);

	let data = {
		bookinfo: bookinfo,
		merged_in_body: str_all		// article들이 병합된 in_body 문자열
	};

	data.str_book_cover_front = getHtmlBookCoverFront(bookinfo);
	data.str_book_warning = getHtmlBookWarning(bookinfo);
	data.str_book_references = await references.getHtmlReferencesSection(bookinfo);
	data.str_book_cover_back = getHtmlBookCoverBack(bookinfo);
	data.html_toc = html_toc;	// test

	str_all = getHtmlFromMergedInBody(data);
	str_all = replaceVariablesInStrToValues(str_all, bookinfo.variables);

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
	let str_tmp = postprocHtml_assetPathTo1Level(str);
	str_tmp = postprocHtml_adjustPageBreak(str_tmp);
	
	return str_tmp;
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


///@param[in]	str	"../../../_assets/image33.png"
///@return		"_assets/image33.png"
function postprocHtml_assetPathTo1Level(str)
{
    var re = /(\.\.\/)+_assets/g;
	return str.replace(re, '_assets');
}


///@return	str에 `<div class="page-break"></div>`를 적당히 삽입한 결과
function postprocHtml_adjustPageBreak(str)
{
	let str_tmp = postprocHtml_addPageBreakBeforeLevel2Title(str);
	str_tmp = postprocHtml_removePageBreakBetweenLevel1_2Title(str_tmp);
	return str_tmp;
}


///@param[in]	str	"...<h2>..."
///@return		"...<div class="page-break"></div>\n<h2>..."
function postprocHtml_addPageBreakBeforeLevel2Title(str)
{
	const pageBreak = '\n<div class="page-break"></div>\n';
	return str.replace(
		/<h2>/gi,
		`${pageBreak}<h2>`
	);
}


///@param[in]	str	"...</h1>\s*<div class="page-break"></div>\s*<h2>..."
///@return		"...</h1>\n<h2>..."
function postprocHtml_removePageBreakBetweenLevel1_2Title(str)
{
	return str.replace(
		/<\/h1>\s*<div class="page-break"><\/div>\s*<h2>/gi,
		"</h1>\n<h2>"
	);
}


///@param[in]	str	"...</h1>\n<h2>..."
///@return		"...</h1>\n<div class="page-break"></div>\n<h2>..."
function postprocHtml_pageBreak(str)
{
    const pageBreak = '\n<div class="page-break"></div>\n';
	 return str.replace(
        /<\/h1>\s*<h2>/gi,
        `</h1>${pageBreak}<h2>`
    );
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
	let book_tmpl_ejs = fs.readFileSync(rpathname, 'utf-8');
	book_tmpl_ejs = util.removeBom(book_tmpl_ejs);

	const tmpl_rendered = ejs.render(book_tmpl_ejs, data
		, { views : [ 'public/view/' ] } );	// for include in .ejs

	return tmpl_rendered;
}


///@param[in]   bookinfo
///@return      책 앞 표지 html 문서의 문자열
function getHtmlBookCoverFront(bookinfo)
{
	const rpathname = 'public/view/book_cover_front.ejs';
	let book_tmpl_ejs = fs.readFileSync(rpathname, 'utf-8');
	book_tmpl_ejs = util.removeBom(book_tmpl_ejs);
	const data = { bookinfo: bookinfo };
	let tmpl_rendered = ejs.render(book_tmpl_ejs, data
		, { views : [ 'public/view/' ] } );	// for include in .ejs

	tmpl_rendered = util.strInTag(tmpl_rendered, 'body', true);
	return tmpl_rendered;
}


///@param[in]   bookinfo
///@return      책 경고 문구 페이지의 문자열
function getHtmlBookWarning(bookinfo)
{
	let rpathname = `public/view/book_warning_${bookinfo.langCode}.ejs`;
	if(fs.existsSync(rpathname)==false) {
		rpathname = `public/view/book_warning_en.ejs`;
	}

	let book_tmpl_ejs = fs.readFileSync(rpathname, 'utf-8');
	book_tmpl_ejs = util.removeBom(book_tmpl_ejs);
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
	var rpathname = `public/view/book_cover_back_${bookinfo.langCode}.html`;
	if(fs.existsSync(rpathname)==false) {
		rpathname = `public/view/book_cover_back_en.html`;
	}
	var html = getInBodyFromHtmlFile(rpathname);
	return html;
}
