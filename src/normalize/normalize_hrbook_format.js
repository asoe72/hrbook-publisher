const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const str_util = require("../util/str_util");


// 제외할 폴더 or 파일명 목록
const EXCLUDED_NAMES = new Set([
  '.git', 'book.md', 'index.json'
]);


// 처리할 텍스트 파일 확장자 목록 (hrbook 문서만)
const TEXT_EXTENSIONS = new Set([
  '.md', '.json'
]);


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
  [ 0x2500, 0x256C]     // BOX DRAWINGS
];

// 금지된 문자열 (검지되면 수작업 확인 안내)
const PROHIBITED_STRS = new Set([
  'Hi6', 'Hi7', 'HI6', 'HI7',
  'korean', 'english',      // -> ko, en으로 branch명 통일함.
  'hyundai-robotics.com',   // 과거 사이트 주소
  'Copyright ⓒ',           // 공용 page 참조만 해야 함.
  '[**', '**]' ]);

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



///@param[in]   _path     basePath
///@return      context
///@brief		    _path 내의 모든 TEXT_EXTENSIONS 파일들에 대해 check 수행
function normalizeAll(_path)
{
  console.log('');
  console.log('# CHECK & MODIFY FILES ================');
  const context = { basePath: _path, nChecked: 0
    , nOk: 0, nNgFile: 0, nNgItem: 0, nModified: 0 };
  processPath(_path, context);
  printReport(context);  
  
  return context;
}


///@brief		    결과 보고 출력
function printReport(context)
{
  console.log(`----------------------------------------`);
  console.log(`${context.nChecked} file(s) checked.`);
  console.log(chalk.green(`  * OK : ${context.nOk} file(s)`));
  if(context.nNgFile > 0) {
    console.log(chalk.yellow(`  * NG : ${context.nNgFile} file(s), ${context.nNgItem} item(s)`));
    console.log(chalk.yellow(`    => Review and correct if necessary.`));
  }

  if(context.nModified > 0) {
    console.log(chalk.yellow(`${context.nModified}`) + ` file(s) modified.\nRun the process again to check the result.`);
  }
  else {
    console.log('No files modified.');
  }
}


///@param[in]   _path
///@param[in]   context   { nChecked: 0, nOk: 0, nNgFile: 0, nNgItem: 0 }
///@return      check한 파일 개수 (skip file 제외)
///@brief		    _path 내의 모든 파일에 대해 processFile() 수행
function processPath(_path, context)
{
  const entries = fs.readdirSync(_path, { withFileTypes: true });

  for (const entry of entries) {
    const pathname = path.join(_path, entry.name);

    if(EXCLUDED_NAMES.has(entry.name)) {
      continue;
    }

    if (entry.isDirectory()) {
      processPath(pathname, context);
    }
    else if (entry.isFile()) {
      const ret = processFile(pathname, context);
      if(ret < 0) {
        context.nNgFile++;
      }
      else if(ret > 0) {
        context.nOk++;
      }
    }
    context.nChecked++;
  }

  return context.nChecked;
}


///@param[in]   pathname
///@return
//      -   1   OK
//      -   0   skip
//      -   -1  NG
///@brief		    pathname file이 지정한 확장자이면, format check 수행
function processFile(pathname, context)
{
  const relPath = path.relative(context.basePath, pathname);
  let strMsg = `  * check: ${relPath} : `;

  const ext = path.extname(pathname).toLowerCase();
  if (!TEXT_EXTENSIONS.has(ext)) {
    return 0;
  }

  let str = fs.readFileSync(pathname, 'utf8');
  str = str.replace('\ufeff', '');			// strip BOM
  
  let iret = processFile_SpecialChars(strMsg, pathname, str, context);
  if(iret < 0) {
    return iret;
  }

  iret = processFile_ProhibitedStrs(strMsg, str, context);
  if(iret < 0) {
    return iret;
  }

  //console.log(strMsg + chalk.green('PASSED'));

  return 1;
}


///@param[in]   pathname
///@param[in]   str
///@return
//      -   0   PASSED. (nothing to process)
//      -   -1  NG. (수작업 확인, 수정 필요)
///@brief		    pathname file이 지정한 확장자이면, format check 수행
function processFile_SpecialChars(strMsg, pathname, str, context)
{
  let items = findSpecialChars(str);
  for (const item of items) {
    const { line, col } = str_util.lineColFromIndex(str, item.index);
    const unicode = str_util.strUnicodeHexFromChar(item.char);
    console.log(strMsg + chalk.yellow('NG') + ` (special character `
      + chalk.yellow(`'${item.char}'`) + `(${unicode}) at (Ln ${line}, Col ${col}))`);
    context.nNgItem++;

    let normStr = normalizeSpecialChars(str);
    if(normStr != str) {
      normStr = '\ufeff' + normStr;
      fs.writeFileSync(pathname, normStr);
      console.log(chalk.green('    : replaced some characters'));
      context.nModified++;
    }
  }  

  return (items.length > 0) ? -1 : 0;
}


///@param[in]   str
///@return
//      -   0   PASSED. (no prohibited string)
//      -   -1  NG. (found prohibited string) (수작업 확인, 수정 필요)
///@brief     str내에서 PROHIBITED_STRS 배열의 금지 문자열들이 있으면 처리
function processFile_ProhibitedStrs(strMsg, str, context)
{
  let found = false;
  for(const prohibited_str of PROHIBITED_STRS) {
    const ret = processFile_ProhibitedStr(strMsg, str, prohibited_str, context);
    if(ret < 0) {
      found = true;
    }
  }
  return found ? -1 : 0;
}


function processFile_ProhibitedStr(strMsg, str, prohibited_str, context)
{
  let idx = str.indexOf(prohibited_str);
  let found = false;

  while (idx !== -1) {
    const { line, col } = str_util.lineColFromIndex(str, idx);
    console.log(strMsg + chalk.yellow('NG') + ` (prohibited string `
      + chalk.yellow(`'${prohibited_str}'`) + ` at (Ln ${line}, Col ${col}))`
    );
    context.nNgItem++;
    found = true;
    idx = str.indexOf(prohibited_str, idx + prohibited_str.length);
  }

  return found ? -1 : 0;
}


///@param[in]   str   대상 문자열 (utf8)
///@return      items [{ char: ch, index }, ... ]   처음 찾은 특수문자 (ascii 1~7f 영역 밖, 한글도 아님)
function findSpecialChars(str)
{
  const items = [];
  let index = 0;

  for (const ch of str) {
    const cp = ch.codePointAt(0);
    PERMITTED_CHAR_RANGE
    if(!isPermittedChar(ch) && !isHangul(cp) && !isInAscii(cp)) {
      items.push({ char: ch, index });
    }
    index += ch.length;
  }
  return items;
}


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


///@param[in]   str
///@return      normalized str
function normalizeSpecialChars(str) {
  let _str = str;
  for (const [from, to] of ALT_SPECIAL_CHAR) {
    _str = _str.split(from).join(to);
  }
  return _str;
}


///@param[in]   cp
///@return      한글 영역인지 여부
function isHangul(cp) {
  return (cp >= 0xAC00 && cp <= 0xD7A3) || // 한글 음절
    (cp >= 0x1100 && cp <= 0x11FF) || // 자모
    (cp >= 0xA960 && cp <= 0xA97F) ||
    (cp >= 0xD7B0 && cp <= 0xD7FF);
}


///@param[in]   cp
///@return      ascii 영역인지 여부
function isInAscii(cp) {
  return (0x00 <= cp && cp <= 0x7F);
}

module.exports = {
  normalizeAll
}
