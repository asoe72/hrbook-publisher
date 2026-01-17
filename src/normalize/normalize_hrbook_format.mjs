import fs from 'fs';
import path from 'path';
import chalk from 'chalk';


// 제외할 폴더 or 파일명 목록
const EXCLUDED_NAMES = new Set([
  '.git', 'book.md', 'index.json'
]);


// 처리할 텍스트 파일 확장자 목록 (hrbook 문서만)
const TEXT_EXTENSIONS = new Set([
  '.md', '.json'
]);


// 허용할 문자 (대체할 문자가 없는 경우)
const PERMITTED_CHARS = new Set(['°', '→', '↑', '↓', '🠔', '←', '·', '㎡', 'Ω', '≤']);

// 금지된 문자열 (검지되면 수작업 확인 안내)
const PROHIBITED_STRS = new Set(['Hi6', 'Hi7', 'HI6', 'HI7'
  , 'korean', 'english'
  , '[**', '**]' ]);

// 대체 문자
const ALT_SPECIAL_CHAR = new Map([
  [ '–', '-' ],
  [ '…', '...'],
  [ '“', '"'],
  [ '”', '"'],
  [ '‘', '\''],
  [ '’', '\''],
  [ '【', '['],
  [ '】', ']'],
  [ '\[**', '\`'],
  [ '**\]', '\`'],
  [ '○', 'o'],
  [ '×', 'x'],
  [ '※', '*'],
  [ '～', '~'],
  [ '⇒', '=>'],
  [ '⇒', '=>'],
  [ '㎝', 'cm'],
  [ '㎜', 'mm'],
  [ '㎏', 'kg'],
  [ '​', ' '],
  [ ' ', ' ']
]);



///@param[in]   _path     basePath
///@return      context
///@brief		    _path 내의 모든 TEXT_EXTENSIONS 파일들에 대해 check 수행
export function normalizeAll(_path)
{
  console.log('');
  console.log('# CHECK & MODIFY FILES ================');
  const context = { basePath: _path, nChecked: 0, nOk: 0, nNg: 0, nModified: 0 };
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
  if(context.nNg > 0) {
    console.log(chalk.yellow(`  * NG : ${context.nNg} file(s)`));
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
///@param[in]   context   { nChecked: 0, nOk: 0, nNg: 0 }
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
        context.nNg++;
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
  
  let iret = processFile_SpecialChar(strMsg, pathname, str, context);
  if(iret < 0) return iret;

  iret = processFile_ProhibitedStr(strMsg, str);
  if(iret < 0) return iret;

  console.log(strMsg + chalk.green('PASSED'));

  return 1;
}


///@param[in]   pathname
///@param[in]   str
///@return
//      -   0   PASSED. (nothing to process)
//      -   -1  NG. (수작업 확인, 수정 필요)
///@brief		    pathname file이 지정한 확장자이면, format check 수행
function processFile_SpecialChar(strMsg, pathname, str, context)
{
  let result = findFirstSpecialChar(str);
  if(result) {
    console.log(strMsg + chalk.yellow('NG') + ` (special character `
      + chalk.yellow(`'${result.char}'`) + ` at ${result.index})`);

    let normStr = normalizeSpecialChars(str);
    if(normStr != str) {
      normStr = '\ufeff' + normStr;
      fs.writeFileSync(pathname, normStr);
      console.log(chalk.green('    : replaced some characters'));
      context.nModified++;
    }
    return -1;
  }

  return 0;
}


///@param[in]   str
///@return
//      -   0   PASSED. (no prohibited string)
//      -   -1  NG. (found prohibited string) (수작업 확인, 수정 필요)
function processFile_ProhibitedStr(strMsg, str)
{
  for(const prohibited_str of PROHIBITED_STRS)
  {
    const idx = str.indexOf(prohibited_str);
    if(idx >= 0) {
      console.log(strMsg + chalk.yellow('NG') + ` (prohibited string `
        + chalk.yellow(`'${prohibited_str}'`) + ` at ${idx})`);
      return -1;
    }
  }
  return 0;
}


///@param[in]   str   대상 문자열 (utf8)
///@return      { char: ch, index }   처음 찾은 특수문자 (ascii 1~7f 영역 밖, 한글도 아님)
///           없으면 null
function findFirstSpecialChar(str)
{
  let index = 0;

  for (const ch of str) {
    const cp = ch.codePointAt(0);
    if(!PERMITTED_CHARS.has(ch) && !isHangul(cp) && !isInAscii(cp)) {
      return { char: ch, index };
    }
    index += ch.length;
  }
  return null;
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
