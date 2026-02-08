const fs = require('fs');
const path = require('path');

const file_util = require("./util/file_util");


///@param[in]	pathfile_md		markdown file
exports.adjustFile = function(pathfile_md)
{
	var str_md = fs.readFileSync(pathfile_md, 'utf8');
	var str_md2 = adjustMd(str_md);
	
	fs.writeFileSync(pathfile_md, str_md2);
}


///@param[in]	path_md
exports.adjustDir = function(path_md)
{
	if(path_md.length > 0) {
		if(path_md[0] == '.') return -1;
	}

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

			console.log(`adjustDir(${path_md2})`);
			module.exports.adjustDir(path_md2);
		}
		else {
			console.log(`adjustFileSub(${path_md}, ${fname})`);
			adjustFileSub(path_md, fname);
		}
	};

	return 0;
}


///@param[in]	path_md
///@param[in]	fname
///@return
///		-	0	ok
///		-	-1	ng. not .md
function adjustFileSub(path_md, fname)
{
	const ext = file_util.extFromFName(fname);

	console.log(fname);
	console.log(ext);

	if(ext != "md") return -1;

	const pathname_md = path.join(path_md, fname);

	console.log(`adjustFile(${pathname_md}`);
	module.exports.adjustFile(pathname_md);

	return 0;
}


///@param[in]	str
///@return		adjust md text
function adjustMd(str)
{
	//var test = adjustMd_entity2char('<th style="text-align:left">&#xBC88;&#xD638;</th>');
	var str = adjustMd_entity2char(str);
	return str;
}


///@param[in]	<th style="text-align:left">&#xBC88;&#xD638;</th>
///@return		<th style="text-align:left">번호</th>
///@breif		16진수 entity code를 문자로 변경
function adjustMd_entity2char(str)
{
	var re = /\&\#\x([0-9A-F]+)\;/g;

	function str_code2char(match) {
		var re2 = /\&\#\x([0-9A-F]+)\;/g;
		var arr = re2.exec(match);
		if(arr==null) return match;

		var str_hexcode = "0x" + arr[1];	// e.g. "0xBC88"
		var code = parseInt(str_hexcode);
		var str = String.fromCodePoint(code);
		return str;
	}

	var str = str.replace(re, str_code2char);
	return str;
}
