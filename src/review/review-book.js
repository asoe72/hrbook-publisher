const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const axios = require('axios');
const puppeteer = require('puppeteer');
const git_util = require('../util/git_util');
const file_util = require('../util/file_util');
const { printProblems } = require('./problems');
const { reviewFile } = require('./review-file');

const BOOKINFOS_URL = 'https://raw.githubusercontent.com/hyundai-robotics/hrbookinfos/refs/heads/master/bookinfos.json';
const PATH_OUT_MD = 'public/out-md/';


// 제외할 폴더 or 파일명 목록
const EXCLUDED_NAMES = new Set([
  '.git', 'book.md', 'index.json'
]);


// ----------------------------------------------
function initContext(basePathMd, rules) {
  const context = { basePathMd, rules,
    problems: [],
    nChecked: 0, nOkFile: 0, nNgFile: 0, nModifiedFile: 0, nNgItem: 0, nModified: 0 };
  
  return context;
}


// ----------------------------------------------
exports.reviewLocalBook = async function(basePathMd, variables, rules)
{
  console.log('');
  console.log('# REVIEW ALL FILES ================');

  const context = initContext(basePathMd, rules);
  await reviewPathAll(context);

  printBookReport(context);

  console.log(`\n--------------------------- COMPLETED.`);

  return 0;
}


// ----------------------------------------------
exports.reviewRemoteBook = async function(bookId, bookVer, variables, rules)
{
  console.log('');
  console.log('# REVIEW ALL FILES ================');

  const pathOutMd = 'public/out-md/';
  cloneBook(pathOutMd, bookId, bookVer);

  const basePathMd = path.join(pathOutMd, bookId);
  const context = initContext(basePathMd, rules);

  await reviewPathAll(context);

  printBookReport(context);

  console.log(`\n--------------------------- COMPLETED.`);

  return 0;
}


// ----------------------------------------------
async function cloneBook(pathOutMd, bookId, bookVer)
{
  console.log(`\ncloning...`);

  fs.rmSync(pathOutMd, { recursive: true, force: true });
  file_util.mkdir(pathOutMd);
  const iret = git_util.cloneBook(pathOutMd, bookId, bookVer);
  if(iret == 0) {
    console.log(`\n : OK`);
  }
  else {
    console.log(`\n : FAILED`);
  }
}


// ----------------------------------------------
async function reviewPathAll(context)
{
  console.log(`\nreviewing...`);

  const browser = await puppeteer.launch();
  context.browserPage = await browser.newPage();

  return await reviewPath(context, context.basePathMd);
}


///@param[in]   context   { basePathMd,
///               nChecked: 0, nOkFile: 0, nNgFile: 0, nNgItem: 0, nModified: 0 };
///@param[in]   _path     현재까지 진행된 base 경로
///@return      review한 파일 개수 (skip file 제외)
///@brief		    _path 내의 모든 파일에 대해 reviewFile() 수행
async function reviewPath(context, _path)
{
  const entries = fs.readdirSync(_path, { withFileTypes: true });
  
  for (const entry of entries) {
    const pathname = path.join(_path, entry.name);

    if(EXCLUDED_NAMES.has(entry.name)) {
      continue;
    }

    if (entry.isDirectory()) {
      await reviewPath(context, pathname);
    }
    else if (entry.isFile()) {
      await reviewFile(pathname, context);
    }
  }
}


///@brief		    결과 보고 출력
function printBookReport(context)
{
  console.log(`----------------------------------------`);
  printProblems(context);
  console.log(`----------------------------------------`);
  console.log(`${context.nChecked} file(s) checked.`);
  console.log(chalk.green(`  * OK : ${context.nOkFile} file(s)`));
  if(context.nNgFile > 0) {
    console.log(chalk.yellow(`  * NG : ${context.nNgFile} file(s), ${context.nNgItem} item(s)`));
    console.log(chalk.yellow(`    => Review and correct if necessary.`));
  }

  if(context.nModifiedFile > 0) {
    console.log(chalk.cyan(`${context.nModifiedFile}`) + ` file(s) modified.\nRun the process again to check the result.`);
  }
  else {
    console.log('No files modified.');
  }
}


// --------------------------------------------------
///@param[in]   destPath    저장할 폴더 경로 (e.g. 'public/out-md/')
///@return      bookinfos 배열 (파싱된 JSON)
///@brief       BOOKINFOS_URL에서 bookinfos.json을 다운로드하여 destPath에 저장
// --------------------------------------------------
async function downloadBookinfos(destPath)
{
  console.log(`\ndownloading bookinfos.json...`);
  file_util.mkdir(destPath);
  const response = await axios.get(BOOKINFOS_URL);
  const filePath = path.join(destPath, 'bookinfos.json');
  fs.writeFileSync(filePath, JSON.stringify(response.data, null, 2));
  console.log(` : OK (${response.data.length} entries)`);
  return response.data;
}


// --------------------------------------------------
///@param[in]   bookinfos   bookinfos.json 배열
///@return      { bookId, bookVer }[] — 필터 통과한 항목들
///@brief       url 속성 항목, products에 'manipulator' 포함 항목 제외
// --------------------------------------------------
function filterBookInfos(bookinfos)
{
  return bookinfos
    .filter(item => {
      const verId = item['ver_id'];
      const noUrl = !item.url;
      const isKoreanEnglish = verId?.startsWith('ko') || verId?.startsWith('en');
      const isManipulator = item.products && item.products.includes('manipulator');
      
      return (noUrl && isKoreanEnglish && !isManipulator);
      
    }).map(item => ({
      bookId: item['book_id'],
      bookVer: item['ver_id'],
      bookTitle: item['title']
    }));
}


// --------------------------------------------------
///@param[in]   rules   { checkBrokenLinks, checkSpecialChars, replaceSpecialChars, checkProhibitedStrs }
///@brief       bookinfos.json의 전체 book 목록을 받아 순차적으로 reviewRemoteBook() 수행
// --------------------------------------------------
exports.reviewRemoteBookAll = async function(rules)
{
  console.log('');
  console.log('# REVIEW ALL REMOTE BOOKS ================');

  const bookinfos = await downloadBookinfos(PATH_OUT_MD);
  const items = filterBookInfos(bookinfos);

  console.log(`\n${items.length} book(s) to review.`);

  for (const { bookId, bookVer, bookTitle } of items) {
    console.log(`\n=== ${bookId} / ${bookVer} ===`);
    console.log(`    ${bookTitle}`);
    await exports.reviewRemoteBook(bookId, bookVer, null, rules);
  }

  console.log(`\n--------------------------- ALL COMPLETED.`);
  return 0;
}
