///@param[in]  str    		원문
///@param[in]  tagname		e.g. "body"
///@param[in]  bothside
///				-	true		closing tag는 뒤에서 접근해 찾음
///				-	false		closing tag도 앞에서 접근해 찾음
///@return     tag 사이의 문자열을 얻는다. tag 못 찾았으면 ""
exports.strInTag = (str, tagname, bothside) =>
{
	const opening_tag = `<${tagname}>`;
	const closing_tag = `</${tagname}>`;

	const idxSt = str.indexOf(opening_tag) + opening_tag.length;
	const idxEn = bothside ? 
		str.lastIndexOf(closing_tag) :
		str.indexOf(closing_tag);
	if((idxSt<0) || (idxEn<0)) return "";
		
	var in_tag = str.substring(idxSt, idxEn);

	return in_tag;
}


///@return     str 내의 index (0-based) 지점의 { 행, 열 } (1-based)
exports.lineColFromIndex = (str, index) =>
{
	let line = 1, col = 1;

	for (let i = 0; i < index && i < str.length; i++) {
		if (str[i] === '\n') {
			line++;
			col = 1;
		} else {
			col++;
		}
	}
	return { line, col };
}


///@param[in]		ch	e.g. '⇒'
///@return			e.g. 'U+21D2'
exports.strUnicodeHexFromChar = (ch) =>
{
  const hex = ch.codePointAt(0).toString(16).toUpperCase();
  return 'U+' + hex.padStart(4, '0');
}


///@brief		화면 지우기
exports.clearConsole = () =>
{
	process.stdout.write('\x1Bc');
}
