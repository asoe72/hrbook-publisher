const fs = require('fs');
const path = require('path');

const md2html = require("./md2html");
const util = require("./util");
const { mainModule } = require('process');


//console.log(html_text.toString());

const path_parent = "D:/git_repo/";
const folder_name = "doc-hrscript";

const folder_name_out = folder_name + "_out";

const path_md = path.join(path_parent, folder_name);
const path_html = path.join(path_parent, folder_name_out);


// main routine
convDir_Md2Html(path_md, path_html);


///@param[in]	path_md
///@param[in]	path_html
function convDir_Md2Html(path_md, path_html)
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

			console.log(`convDir_Md2Html(${path_md2}, ${path_html2}`);
			convDir_Md2Html(path_md2, path_html2);
		}
		else {
			console.log(`convFile_Md2Html(${path_md}, ${path_html}, ${fname})`);
			convFile_Md2Html(path_md, path_html, fname);
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
function convFile_Md2Html(path_md, path_html, fname)
{
	const ftitle = util.ftitleFromFName(fname);
	const ext = util.extFromFName(fname);

	console.log(fname);
	console.log(ext);

	if(ext != "md") return -1;

	const pathname_md = path.join(path_md, fname);
	const pathname_html = path.join(path_html, ftitle) + ".html";

	console.log(`md2html.convFile(${pathname_md}, ${pathname_html}`);
	md2html.convFile(pathname_md, pathname_html);

	return 0;
}