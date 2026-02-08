// teach-pendant 등에 탑재할 off-line help의 구성 .html 파일들 생성.
// 각각의 html이 개별적으로 browser에 render 될 수 있도록 css 경로 등 온전한 형태를 갖추게 한다.

const fs = require('fs');
const ejs = require('ejs');
const path = require('path');
const file_util = require("./util/file_util");
const str_util = require("./util/str_util");


///@param[in]   pathname_out
///@param[in]   in_body		<body> ~ </body> 사이의 문자열
///@return      in_body를 온전한 html로 만들어 pathname_out 파일로 생성.
exports.makeWholeHtmlFromInBody = (pathname_out, in_body) =>
{
	let title = str_util.strInTag(in_body, 'h1', false);
	if(title=="") title = str_util.strInTag(in_body, 'h2', false);
	if(title=="") title = str_util.strInTag(in_body, 'h3', false);

	in_body = replaceHintImgSrc(pathname_out, in_body);

	const href_css = findCssRelPathName(pathname_out, "css/book.css");

	const html_out = getHtmlHelpSection(title, href_css, in_body);
	fs.writeFileSync(pathname_out, '\ufeff' + html_out, { encoding: 'utf8' });
}


function replaceHintImgSrc(pathname_out, str)
{
	const src_caution = findCssRelPathName(pathname_out, "image/caution.png");
	const src_info = findCssRelPathName(pathname_out, "image/info.png");

	let re = RegExp('src="../view/image/caution.png"', 'g');
	str = str.replace(re, `src="${src_caution}"`);

	let re2 = RegExp('src="../view/image/info.png"', 'g');
	str = str.replace(re2, `src="${src_info}"`);

	return str;
}


///@param[in]   title
///@param[in]   href_css	"../css/book.css"
///@param[in]   in_body		<body> ~ </body> 사이의 문자열
///@return      offline-help를 위한 단일 section의 html
function getHtmlHelpSection(title, href_css, in_body)
{
	const rpathname = 'public/view/help_section.ejs';
	let book_tmpl_ejs = fs.readFileSync(rpathname, 'utf-8');
	book_tmpl_ejs = file_util.removeBom(book_tmpl_ejs);
	const data = {
		title: title,
		href_css: href_css,
		in_body: in_body	
	};
	const tmpl_rendered = ejs.render(book_tmpl_ejs, data
		, { views : [ 'public/view/' ] } );	// for include in .ejs

	return tmpl_rendered;
}


///@param[in]   pathname_html				e.g. "d:/abc/public/sub/content.html"
///@param[in]   rel_pathname_to_find	e.g. "css/book.css"
///@return     상대경로명	e.g. "../../css/book.cs"
///@brief		상위 디렉토리를 찾아 올라가면서 css를 찾은 후 상대경로명을 리턴한다.
function findCssRelPathName(pathname_html, rel_pathname_to_find)
{
	const lev_max = 20;
	const path_base = path.dirname(pathname_html)
	for (let cnt=0; cnt<lev_max; cnt++)
	{
		let dotdots = "";
		let path_tmp = path_base;
		for(let i=0; i<cnt; i++) {
			path_tmp = path.join(path_tmp, "..");
			dotdots += '..\\'
		}
		const pathname = path.join(path_tmp, rel_pathname_to_find);
		if (fs.existsSync(pathname)) {
			var re = /^public\\/;
			return pathname.replace(re, dotdots);
		}
	}
	return "";
}
