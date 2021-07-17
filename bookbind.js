const fs = require('fs');
const md_it = require("markdown-it");


///@param[in]	pathfile_toc		
exports.bind = function(pathfile_toc)
{
	const toc = read_toc(pathfile_toc);
}


///@param[in]	pathfile_toc
function read_toc(pathfile_toc)
{
	const str_toc = fs.readFileSync(pathfile_toc, 'utf8');
	const md = md_it();
	const arr_token = md.parse(str_toc);

	const toc = arr_item_from_arr_token(arr_token);
	return toc;
}


///@param[in]	arr_token
// @return		arr_item	간략화한 배열
function arr_item_from_arr_token(arr_token)
{
	var arr_item = [];

	for(var i=0; i<arr_token.length; i++)
	{
		var item = {};
		const token = arr_token[i];
		if(token.type != "inline") continue;
		if(token.level < 3) continue;

		const arr_tc = token.children;
		item.link = arr_tc[0].attrs[0][1];
		item.title = arr_tc[1].content;
		item.level = (token.level-1)/2;
		
		console.log(item.title);

		arr_item.push(item);		
	}

	return arr_item;
}
