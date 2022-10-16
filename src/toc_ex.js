///@author	choi, won-hyuk (asoe72@gmail.com)
///@brief	자체 구현한 TOC 기능 (page번호는 안 매겨지는 기능상 한계가 있다.)
///			paged.js에서 제공하는 TOC 기능은 아래 최신 browser에서 1 page 이상 안 만들어지는 문제가 있음.
///			-	Google Chrome
///				* 106.0.5249.119 (64비트) : 문제 있음.
///				* 101.0.4951.67 : 문제 없다고 함.
///			-	Microsoft Edge
///				* 106.0.1370.42 (64bit) : 문제 있음.
///				* 106.0.1370.37 (64bit) : 문제 없음.

///@param[in]	item
///@param[in]	tocTitleElements		목차에 포함시킬 element
///											(e.g. "[ \"h1\", \"h2\" ]")
///@return		{ toc_row: TOC 항목의 html 문법 행, str_html: h1, h2 에 id부여된 html }
///				skip이면 null
exports.processTocItem = function( str_html, item, tocTitleElements ) {
	
	let tag_name = 'h' + item.level;
	if(tocTitleElements.includes(tag_name)==false) return null;

	const id = makeIdFromItem(item, tocTitleElements);
	
	let res = {};
	res.toc_row = makeTocItemHtml(id, item);
	res.str_html = applyIdOnHeadingTag(str_html, tag_name, id);

	return res;
}


///@return      
function makeTocItemHtml( id, item ) {
		
	const cls_name = 'toc-element-level-' + item.level;

	const div_st = `\t\t<div class="${cls_name}">`;
	const row = div_st + `<a href="#${id}">${item.title}</a></div>\n`;
	return row;
}


///@param[in]	tag_name		e.g. "h2"
///@param[in]	id				e.g. "1_Basic_information-2_Function_setting-README"
///@return      e.g. '..<h2 id="1_Basic_information-2_Function_setting-README">..' <- '..<h2>..'
function applyIdOnHeadingTag( str_html, tag_name, id )
{
	let tag = `<${tag_name}>`;
	let tag_new = `<${tag_name} id="${id}">`;

	let str_html_new = str_html.replace(tag, tag_new);
	return str_html_new;
}


///@return      e.g. "1_Basic_information-README" <- '1_Basic_information/README.html'
function makeIdFromItem( item ) {
	let str = item.link;
	if(str.length===0) return "";
	
	let sects = str.split('.');
	sects.length = sects.length-1;	// 확장자 제거
	let id = sects.join('-');
	id = id.replace(/\//g, '-');
	return id;
}
