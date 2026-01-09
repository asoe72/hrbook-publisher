import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { insertUtf8Bom } from './insert_utf8bom.js'


// 제외할 폴더 or 파일명 목록
const EXCLUDED_NAMES = new Set([
  '.git', 'book.md', 'index.json'
]);


// 처리할 텍스트 파일 확장자 목록 (hrbook 문서만)
const TEXT_EXTENSIONS = new Set([
  '.md', '.json'
]);


// 허용할 문자
const PERMITTED_CHAR = new Set(['°', '→']);

// 대체 문자
const ALT_SPECIAL_CHAR = new Map([
  [ '–', '-' ],
  [ '…', '...'],
  [ '“', '"'],
  [ '”', '"'],
  [ '’', '"'],
  [ '×', 'x'],
  [ '​', ' ']
]);



///@param[in]   _path     basePath
///@return      context
///@brief		    _path 내의 모든 TEXT_EXTENSIONS 파일들에 대해 check 수행
function processAll(_path)
{
  console.log('');
  console.log('# CHECK FILES ================');
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
    console.log(chalk.red(`  * NG : ${context.nNg} file(s)`));
  }
}


///@param[in]   _path
///@param[in]   context   { nChecked: 0, nOk: 0, nNg: 0 }
///@return
//      -   1   insert 했음.
//      -   0   insert 안 했음. (이미 있거나, 대상 확장자 아님.)
///@brief		    _path 내의 모든 파일에 대해 insertUtf8BomOnFile() 수행
function processPath(_path, context)
{
  const entries = fs.readdirSync(_path, { withFileTypes: true });
  let count = 0;

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

  return count;
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
  
  let result = findFirstSpecialChar(str);
  if(result) {
    console.log(strMsg + chalk.yellow('NG') + ` (special character '${result.char}' at ${result.index})`);

    let normStr = normalizeSpecialChars(str);
    if(normStr != str) {
      normStr = '\ufeff' + normStr;
      fs.writeFileSync(pathname, normStr);
      console.log(chalk.green('    : replaced some characters'));
      context.nModified++;
    }
    return -1;
  }
  console.log(strMsg + chalk.green('PASSED'));

  return 1;
}


///@param[in]   str   대상 문자열 (utf8)
///@return      { char: ch, index }   처음 찾은 특수문자 (ascii 1~7f 영역 밖, 한글도 아님)
///           없으면 null
function findFirstSpecialChar(str)
{
  let index = 0;

  for (const ch of str) {
    const cp = ch.codePointAt(0);
    if(!PERMITTED_CHAR.has(ch) && !isHangul(cp) && !isInAscii(cp)) {
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


///@brief		    Greeting 출력
function printGreeting()
{
  console.log(`----------------------------------------`);
  console.log(`check_hrbook_format`);
  console.log(`   programmed by choi, won-hyuk`);
  console.log(`   v1.0b  2026-01-09`);
  console.log(`----------------------------------------`);
}


///@brief		    사용법 출력
function printHowToUse()
{
    console.log(`  # HOW TO USE:`);
    console.log(`    node check_hrbook_format.js {pathname}.`);
}


///@brief		    main 함수
function main()
{
  printGreeting();

  // 실행
  if(process.argv.length < 3) {
    printHowToUse();
    return;
  }
  const basePath = process.argv[2];

  //const inputPath = '../../doc-hrscript';

  const nBomInserted = insertUtf8Bom(basePath);
  const context = processAll(basePath);

  console.log(`${nBomInserted} files BOM inserted.`);
  console.log(`${context.nModified} files characters modified.`);
}

///////////////////////////////////////
main();
