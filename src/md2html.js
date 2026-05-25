const fs = require('fs');
const path = require('path');
const md_it = require("markdown-it");
const { replaceIncludeUrls } = require('./include_urls.js');
const { replaceIncludeFiles } = require('./include_files.js');
const { replaceVariablesInStrToValues } = require('./variables.js');
const md_it_impl_fig = require("markdown-it-implicit-figures");

const file_util = require("./util/file_util");


///@param[in]	pathfile_md		markdown file
exports.convFile = async function(pathfile_md, pathfile_html, variables)
{
	var str_md = fs.readFileSync(pathfile_md, 'utf8');	// utf16 bom이 붙어 리턴된다. 원인불명.
	str_md = file_util.removeBom(str_md);
	str_md = await preprocMd(str_md, variables);
	const str_md2 = replaceVariablesInStrToValues(str_md, variables);
	const str_body = getHtmlFromMd(str_md2);
	const str_body2 = replaceVariablesInStrToValues(str_body, variables);

	fs.writeFileSync(pathfile_html, str_body2);
}


///@param[in]	path_md
///@param[in]	path_html
///@param[in]	variables
exports.convDir = async function(path_md, path_html, variables)
{
	if(path_md.length > 0) {
		if(path_md[0] == '.') return -1;
	}

	file_util.mkdir(path_html);

	fnames = fs.readdirSync(path_md);

	for(const fname of fnames) {
		console.log('fname=' + fname);
		
		var pathname_md = path.join(path_md, fname);
		
		var stats = fs.statSync(pathname_md);
		console.log('stat: pathname_md=' + pathname_md);

		if(stats.isDirectory()) {
			if(fname[0] == '.') continue;	// e.g. ".git"
			if(fname == '_assets') continue;	// 그림 등

			var path_md2 = pathname_md;
			var path_html2 = path.join(path_html, fname);

			console.log(`convDir(${path_md2}, ${path_html2})`);
			await module.exports.convDir(path_md2, path_html2, variables);
		}
		else {
			if(fname == 'book.md') continue;
			console.log(`convFileSub(${path_md}, ${path_html}, ${fname})`);
			await convFileSub(path_md, path_html, fname, variables);
		}
	};

	return 0;
}


///@param[in]	path_md
///@param[in]	path_html
///@param[in]	fname
///@return
///		-	0	ok
///		-	-1	ng. not .md
async function convFileSub(path_md, path_html, fname, variables)
{
	const ftitle = file_util.ftitleFromFName(fname);
	const ext = file_util.extFromFName(fname);

	console.log(fname);
	console.log(ext);

	if(ext != "md") return -1;

	const pathname_md = path.join(path_md, fname);
	const pathname_html = path.join(path_html, ftitle) + ".html";

	console.log(`convFile(${pathname_md}, ${pathname_html}`);
	await module.exports.convFile(pathname_md, pathname_html, variables);

	return 0;
}


///@param[in]	str
///@param[in]	variables
///@return		preprocessed md text
async function preprocMd(str, variables)
{
	let str2 = preprocMd_hyperLinkInTag(str, variables);
	str2 = await replaceIncludeFiles(str2);
	str2 = await replaceIncludeUrls(str2);
	str2 = preprocMd_inHintStyle(str2);
	str2 = preprocMd_hintStyle(str2);
	return str2;
}


///@brief 	{% hint %}~{% endhint %} 내부의 markdown 문법을 미리 html로 변환.
/// 				(preprocMd_hintStyle를 수행하고 나면, <table class='hint-box'>.. </table> 내부로 들어가서 
/// 				md2html이 작동하지 않기 때문에, 미리 html로 변환해둔다)
function preprocMd_inHintStyle(str)
{
	const re = /({% hint style=".*?" %})([\s\S]*?)({% endhint %})/g;
	return str.replace(re, (match, open, content, close) => {
		const convertedContent = getHtmlFromMd(content);
		return open + convertedContent + close;
	});
}


function preprocMd_hintStyle(str)
{
	//str_md = '{% hint style="warning" %}';	// test

	str = preprocMd_hintStyle_sub(str, 'danger');
	str = preprocMd_hintStyle_sub(str, 'warning');
	str = preprocMd_hintStyle_sub(str, 'info');

	var re2 = /{% endhint %}/g;
	str = str.replace(re2, "</td></tr></table>");

	return str;
}


///@param[in]	str		
///@param[in]	level		'danger', 'warning', 'info'
function preprocMd_hintStyle_sub(str, level)
{
	let ftitle = (level == 'info') ? 'info' : 'caution';
	let icon_url = `../view/image/${ftitle}.png`;
	
	//let re = RegExp(`{% hint style=&quot;${level}&quot; %}`, 'g');
	let re = RegExp(`{% hint style="${level}" %}`, 'g');
	
	let str2 = str.replace(re, 
`<table class='hint-box'><tr>
	<td class='${level}-box-left'>
		<img width='32' src="${icon_url}"><br>${level}
	</td><td class='hint-box-right'>`
	);

	return str2;
}


///@param[in]	str		`<td>자세한 내용은 [Hi6 로봇제어기 조작설명서](https://hrbook-hrc.web.app/#/view/doc-hi6-operation/ko-tp630/)를 참조하세요.</td>`
///@return		`<td>자세한 내용은 "<a href="https://hrbook-hrc.web.app/#/view/doc-hi6-operation/ko-tp630/">Hi6 로봇제어기 조작설명서</a>를 참조하세요.</td>`
///@brief		html tag 내부의 link는 md->html 변환이 제대로 안 되므로, 이 함수로 전처리 수행함.
function preprocMd_hyperLinkInTag(str, variables)
{
	// https://, http://, 상대경로(./  ../) 모두 처리. ![]() 이미지 문법은 제외.
	let re = /(?<!!)\[(.*?)]\(((?:https?:\/\/|\.{1,2}\/)[^)]*)\)/g;

	let str2 = str.replace(re, (match, text, href) => {
		const href2 = attachContModelQueryifNot(href, variables);
		return `<a href="${href2}">${text}</a>`;
	});
	return str2;
}


///@param[in]	_path				'../3-endless/3-2-rcode/1-r350-manual-reset.md'
///@param[in]	variables		cont_model 속성을 포함하는 객체
///@return								'../3-endless/3-2-rcode/1-r350-manual-reset.md?cont_model=Hi7'
///@brief		_path에 cont_path query가 이미 있으면 그대로 두고, 없으면 지정해준다.
function attachContModelQueryifNot(_path, variables)
{
	const cont_model = variables?.cont_model;
	if (!cont_model) return _path;
	if (_path.includes('cont_model=')) return _path;

	const sep = _path.includes('?') ? '&' : '?';
	return _path + sep + `cont_model=${cont_model}`;
}


///@param[in]	str_md		markdown text
///@return		html text
function getHtmlFromMd(str_md)
{
	const md = md_it({
		html: true
	});

	md.use(md_it_impl_fig, {
		dataType: false,
		figcaption: true,
		tabindex: false,
		link: false
	});

	const str_body = md.render(str_md);

	return str_body;
}
