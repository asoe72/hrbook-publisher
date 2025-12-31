const fs = require('fs');
const path = require('path');
const md_it = require("markdown-it");
const md_it_impl_fig = require("markdown-it-implicit-figures");

const util = require("./util/util");


///@param[in]	pathfile_md		markdown file
exports.convFile = function(pathfile_md, pathfile_html)
{
	var str_md = fs.readFileSync(pathfile_md, 'utf8');	// utf16 bom이 붙어 리턴된다. 원인불명.
	str_md = util.removeBom(str_md);
	str_md = preprocMd(str_md);
	const str_body = getHtmlFromMd(str_md);
	
	fs.writeFileSync(pathfile_html, str_body);
}


///@param[in]	path_md
///@param[in]	path_html
exports.convDir = function(path_md, path_html)
{
	if(path_md.length > 0) {
		if(path_md[0] == '.') return -1;
	}

	util.mkdir(path_html);

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
			module.exports.convDir(path_md2, path_html2);
		}
		else {
			console.log(`convFileSub(${path_md}, ${path_html}, ${fname})`);
			convFileSub(path_md, path_html, fname);
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
function convFileSub(path_md, path_html, fname)
{
	const ftitle = util.ftitleFromFName(fname);
	const ext = util.extFromFName(fname);

	console.log(fname);
	console.log(ext);

	if(ext != "md") return -1;

	const pathname_md = path.join(path_md, fname);
	const pathname_html = path.join(path_html, ftitle) + ".html";

	console.log(`convFile(${pathname_md}, ${pathname_html}`);
	module.exports.convFile(pathname_md, pathname_html);

	return 0;
}


///@param[in]	str
///@return		preprocessed md text
function preprocMd(str)
{
	let str2 = preprocMd_hyperLinkInTag(str);
	str2 = preprocMd_hintStyle(str2);
	return str2;
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


///@param[in]	str		`<td>자세한 내용은 [Hi6 로봇제어기 조작설명서](https://hrbook-hrc.web.app/#/view/doc-hi6-operation/korean-tp630/)를 참조하세요.</td>`
///@return		`<td>자세한 내용은 "<a href="https://hrbook-hrc.web.app/#/view/doc-hi6-operation/korean-tp630/">Hi6 로봇제어기 조작설명서</a>를 참조하세요.</td>`
///@brief		html tag 내부의 link는 md->html 변환이 제대로 안 되므로, 이 함수로 전처리 수행함.
function preprocMd_hyperLinkInTag(str)
{
	let re = /\[(.*?)]\((https:\/\/.*?)\)/g;

	let str2 = str.replace(re, `<a href="$2">$1</a>`);
	return str2;
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
