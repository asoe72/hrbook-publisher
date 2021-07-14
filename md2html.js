const fs = require('fs');

const unified = require("unified");
const markdown = require("remark-parse");
const remark2rehype	= require("remark-rehype");
const rehype_stringify = require("rehype-stringify");


///@param[in]	pathfile_md		markdown file
exports.convFile_Md2Html = function(pathfile_md, pathfile_html)
{
	const md_text = fs.readFileSync(pathfile_md, 'utf8');
	const html_text = getHtmlFromMd(md_text);
	
	fs.writeFileSync(pathfile_html, html_text);
}


///@param[in]	md_txt		markdown text
///@return		html text
function getHtmlFromMd(md_text)
{
	const html = unified()
		.use(markdown)
		.use(remark2rehype)
		.use(rehype_stringify)
		.processSync(md_text);

	return html.toString();
}
