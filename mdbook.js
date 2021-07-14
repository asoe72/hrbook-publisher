const fs = require('fs');
const md2html = require("./md2html");
const util = require("./util");


//console.log(html_text.toString());

const path_parent = "D:/git_repo/";
const folder_name = "doc-hrscript";
const rpath = "basic-syntax/";

const folder_name_out = folder_name + "_out";
//const ftitle = "statements";

const path_md = path_parent + folder_name + '/' + rpath;
const path_html = path_parent + folder_name_out + '/' + rpath;

util.mkdir(path_html);

const fnames = fs.readdirSync(path_md);

for(let fname of fnames) {
	const ftitle = util.ftitleFromFName(fname);
	console.log(fname + ', ' + ftitle);

	if(ftitle == fname) continue;	// directory
	
	const pathname_md = path_md + ftitle + ".md";
	const pathname_html = path_html + ftitle + ".html";
	md2html.convFile_Md2Html(pathname_md, pathname_html);

	//console.log(file);
}