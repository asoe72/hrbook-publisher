const fs = require('fs');


///@brief      중간 폴더들을 모두 생성해 줌.
exports.mkdir = function( dirPath ) {
    const isExists = fs.existsSync( dirPath );
    if( !isExists ) {
        fs.mkdirSync( dirPath, { recursive: true } );
    }
}


///@param[in]	eg. "help_proc_ko.json"
///@return      eg. "help_proc_ko"
exports.ftitleFromFName = (fname) => {
    var re = /(.+)\.\w+/;
    var res = re.exec(fname);
    if(res == null) return fname;	// . 없음
    if(res.length < 2) return "";	// default
    return res[1];
}


///@param[in]	eg. "help_proc_ko.json"
///@return      eg. "json"
exports.extFromFName = (fname) => {
    var len = fname.length;
    var idx = fname.lastIndexOf('.');
 
    var ext = fname.substring(idx+1, len).toLowerCase();
    return ext;
}


///@param[in]	str	string starts with utf-16 BOM
///@return		string of utf-16
exports.removeUtf16Bom = (str) => {
	if(str.length < 1) return str;

	let str_ret = str;
	if(str.charCodeAt(0)==0xfeff) {
		str_ret = str.substring(1);
	}

	return str_ret;
}