const chalk = require('chalk');
const str_util = require("../../util/str_util");
const { addProblem } = require('../problems');


// https://unicodeplus.com/search 활용할 것
// 허용할 문자 (대체할 문자가 없는 경우)
const PERMITTED_CHARS = new Set([
  '→', '↑', '↓', '🠔', '←', '↔',
  '➔',
  '△', '▽', '◁','▷','▲', '▼','◀','▶',  // 화살표
  '·', '≠', '≤', '≥', '±', '∞', '²',  // 수학기호
  '°', '˚', '㎡', '㎟', '℃', 'Ω',   // 단위
  '🔗', '🌐', '📎', '📁', '📄',   // 링크, 첨부
  '◎', '⊙', '•', '✓',  // 표식
  '🟦', '🟥', '🟨', '🟩', '⬛', '🟪'
]);


const PERMITTED_CHAR_RANGE = [
  [ 0x2460, 0x2473],    // CIRCLED NUMBER
  [ 0x24B6, 0x24F4],    // CIRCLED LATIN, CIRCLED DIGIT ZERO, NEGATIVE CIRCLED NUMBER
  [ 0x2500, 0x256C],    // BOX DRAWINGS
  [ 0x0370, 0x03E1],    // GREEK LETTERS
  [ 0x4E00, 0x9FFF],    // CJK Unified Ideographs
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
  [ 'ㆍ', '•'] ,  // U+318D
  [ '※', '*'],
  [ '～', '~'], // U+FF5E
  [ '∼', '~'],  // U+223C
  [ '⇒', '=>'], // U+21D2
  [ '⇠', '<--'], // U+21E0
  [ '㎝', 'cm'],
  [ '㎜', 'mm'],
  [ '㎏', 'kg'],
  [ ' ', ' '],   // U+00A0
  [ '​', ' '],   // U+200B
  [ ' ', ' '],   // U+2003
  [ ' ', ' '],   // U+202F  
  [ '　', ' '],  // U+3000
  [ '﻿', '']   // U+FEFF

]);


// --------------------------------------------------
///@param[in]   context
///@param[in]   str
///@brief       비허용 특수문자를 감지하여 보고 (치환 없음)
// --------------------------------------------------
function applyRule_CheckSpecialChars(context, str)
{
	const items = findSpecialChars(str);
	if (!items.length) return;

	context.nNgItem += items.length;
  addProblems_SpecialChars(context, items);
}


// --------------------------------------------------
///@param[in]   context
///@param[in]   str
///@return      치환된 문자열
///@brief       대체 문자가 있는 특수문자를 치환하여 반환
// --------------------------------------------------
function applyRule_ReplaceSpecialChars(context, str)
{
	const normStr = normalizeSpecialChars(str);
	if (normStr !== str) {
		context.nModified++;
    addProblem(context, 'N', 'modified', 'replaced some characters');
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
      const location = str_util.lineColFromIndex(str, index);
      items.push({ char: ch, location });
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
function addProblems_SpecialChars(context, items)
{
	for(const item of items)
  {
    const unicode = str_util.strUnicodeHexFromChar(item.char);
    const msg = chalk.yellow(`'${item.char}'`) + `(${unicode})`;
    addProblem(context, 'W', 'special-char', msg, item.location);
  }
}


module.exports = {
  applyRule_CheckSpecialChars,
  applyRule_ReplaceSpecialChars
}
