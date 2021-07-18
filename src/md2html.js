const fs = require('fs');
const path = require('path');
const md_it = require("markdown-it");

const util = require("./util");


///@param[in]	pathfile_md		markdown file
exports.convFile = function(pathfile_md, pathfile_html)
{
	const str_md = fs.readFileSync(pathfile_md, 'utf8');
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
			if(fname[0] == '.') continue;	// e.g. ".git", ".gitbook"

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


///@param[in]	str_md		markdown text
///@return		html text
function getHtmlFromMd(str_md)
{
	const md = md_it({
		html: true
	});
	const str_body = md.render(str_md);

	return str_body;
}
