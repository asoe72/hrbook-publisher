const chalk = require('chalk');
const str_util = require("../../util/str_util");


// https://unicodeplus.com/search 활용할 것
// 허용할 문자 (대체할 문자가 없는 경우)
const PERMITTED_CHARS = new Set([
  '→', '↑', '↓', '🠔', '←', '↔', '◁','▷',  // 화살표
  '·', '≤', '≥', '±', '∞', '²',  // 수학기호
  '°', '˚', '㎡', '㎟', '℃', 'Ω',   // 단위
  '◎', '⊙'  // 표식
]);


const PERMITTED_CHAR_RANGE = [
  [ 0x2460, 0x2473],    // CIRCLED NUMBER
  [ 0x24B6, 0x24F4],    // CIRCLED LATIN, CIRCLED DIGIT ZERO, NEGATIVE CIRCLED NUMBER
  [ 0x2500, 0x256C],    // BOX DRAWINGS
  [ 0x03B1, 0x03C9]     // GREEK SMALL LETTER ALPHA ~ OMEGA
];


// 대체 문자
const ALT_SPECIAL_CHAR = new Map([
  [ '‑', '-' ], // U+2011
  [ '–', '-' ], // U+2013
  [ '—', '-' ], // U+2014
  [ '−', '-' ], // U+2212
  [ '…', '...'],
  [ '“', '"'],
  [ '”', '"'],
  [ '‘', '\''],
  [ '’', '\''],
  [ '【', '['],
  [ '】', ']'],
  //[ '\[**', '\`'],
  //[ '**\]', '\`'],
  [ '○', 'o'],
  [ '×', 'x'],
  [ '※', '*'],
  [ '～', '~'], // U+FF5E
  [ '∼', '~'],  // U+223C
  [ '⇒', '=>'], // U+21D2
  [ '㎝', 'cm'],
  [ '㎜', 'mm'],
  [ '㎏', 'kg'],
  [ ' ', ' '],   // U+00A0
  [ '​', ' '],   // U+200B
  [ ' ', ' '],   // U+2003
  [ '　', ' ']   // U+3000
]);


// --------------------------------------------------
///@param[in]   str
///@return		정규화된 문자열
///@brief		    pathname file이 지정한 확장자이면, format check 수행
// --------------------------------------------------
function applyRule_SpecialChars(context, str)
{
	// 검사만 함.
	let items = findSpecialChars(str);
	context.nNgItem += items.length;

	// 대체 문자가 있는 것은 대체
	let normStr = normalizeSpecialChars(str);
	const replaced = (normStr != str);
	if(replaced) {
		context.nModified++;
	}

	if(items.length || replaced) {
		reportSpecialChars(context, items, str, replaced);
	}	

	return normStr;
}


// --------------------------------------------------
///@param[in]   str   대상 문자열 (utf8)
///@return      items [{ char: ch, index }, ... ]   처음 찾은 특수문자 (ascii 1~7f 영역 밖, 한글도 아님)
// --------------------------------------------------
function findSpecialChars(str)
{
  const items = [];
  let index = 0;

  for (const ch of str) {
    const cp = ch.codePointAt(0);
    if(!isPermittedChar(ch) && !isHangul(cp) && !isInAscii(cp)) {
      items.push({ char: ch, index });
    }
    index += ch.length;
  }
  return items;
}


// --------------------------------------------------
function isPermittedChar(ch)
{
  if(PERMITTED_CHARS.has(ch)) return true;

  const cp = ch.codePointAt(0);

  for(const [st, en] of PERMITTED_CHAR_RANGE) {
    if (st <= cp && cp <= en) {
      return true;
    }
  }
  return false;
}


// --------------------------------------------------
///@param[in]   str
///@return      normalized str
// --------------------------------------------------
function normalizeSpecialChars(str) {
  let _str = str;
  for (const [from, to] of ALT_SPECIAL_CHAR) {
    _str = _str.split(from).join(to);
  }
  return _str;
}


// --------------------------------------------------
///@param[in]   cp
///@return      한글 영역인지 여부
// --------------------------------------------------
function isHangul(cp) {
  return (cp >= 0xAC00 && cp <= 0xD7A3) || // 한글 음절
    (cp >= 0x1100 && cp <= 0x11FF) || // 자모
    (cp >= 0xA960 && cp <= 0xA97F) ||
    (cp >= 0xD7B0 && cp <= 0xD7FF);
}


// --------------------------------------------------
///@param[in]   cp
///@return      ascii 영역인지 여부
// --------------------------------------------------
function isInAscii(cp) {
  return (0x00 <= cp && cp <= 0x7F);
}


// --------------------------------------------------
function reportSpecialChars(context, items, str, replaced)
{
	console.log('\n');
  console.log(`  ### SPECIAL CHARS`);

	for (const item of items) {
		const { line, col } = str_util.lineColFromIndex(str, item.index);
		const unicode = str_util.strUnicodeHexFromChar(item.char);
		console.log('   - ' + chalk.yellow('[NG]') + ` (special character `
			+ chalk.yellow(`'${item.char}'`) + `(${unicode}) at (Ln ${line}, Col ${col}))`);
	}

	if(replaced) {
		console.log(chalk.green('    : replaced some characters'));
	}
}


module.exports = {
  applyRule_SpecialChars
}
