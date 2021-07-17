const fs = require('fs');
const md_it = require("markdown-it");


///@param[in]	pathfile_md		markdown file
exports.convFile = function(pathfile_md, pathfile_html)
{
	const str_md = fs.readFileSync(pathfile_md, 'utf8');
	const str_body = getHtmlFromMd(str_md);
	
	fs.writeFileSync(pathfile_html, str_body);
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
