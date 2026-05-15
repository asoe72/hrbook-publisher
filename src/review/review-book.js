const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const axios = require('axios');
const puppeteer = require('puppeteer');
const git_util = require('../util/git_util');
const file_util = require('../util/file_util');
const log_util = require('../util/log_util');
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
  log_util.init();

  log_util.log('');
  log_util.log('# REVIEW ALL FILES ================');

  const context = initContext(basePathMd, rules);
  await reviewPathAll(context);

  printBookReport(context);

  log_util.log(`\n--------------------------- COMPLETED.`);

  return 0;
}


// ----------------------------------------------
exports.reviewRemoteBook = async function(bookId, verId, variables, rules)
{
  log_util.log('');
  log_util.log('# REVIEW ALL FILES ================');

  const pathOutMd = 'public/out-md/';
  cloneBook(pathOutMd, bookId, verId);

  const basePathMd = path.join(pathOutMd, bookId);
  const context = initContext(basePathMd, rules);

  await reviewPathAll(context);

  printBookReport(context);

  log_util.log(`\n--------------------------- COMPLETED.`);

  return 0;
}


// ----------------------------------------------
async function cloneBook(pathOutMd, bookId, verId)
{
  log_util.log(`\ncloning...`);

  fs.rmSync(pathOutMd, { recursive: true, force: true });
  file_util.mkdir(pathOutMd);
  const iret = git_util.cloneBook(pathOutMd, bookId, verId);
  if(iret == 0) {
    log_util.log(`\n : OK`);
  }
  else {
    log_util.log(`\n : FAILED`);
  }
}


// ----------------------------------------------
async function reviewPathAll(context)
{
  log_util.log(`\nreviewing...`);

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
  log_util.log(`----------------------------------------`);
  printProblems(context);
  log_util.log(`----------------------------------------`);
  log_util.log(`${context.nChecked} file(s) checked.`);
  log_util.log(chalk.green(`  * OK : ${context.nOkFile} file(s)`));
  if(context.nNgFile > 0) {
    log_util.log(chalk.yellow(`  * NG : ${context.nNgFile} file(s), ${context.nNgItem} item(s)`));
    log_util.log(chalk.yellow(`    => Review and correct if necessary.`));
  }

  if(context.nModifiedFile > 0) {
    log_util.log(chalk.cyan(`${context.nModifiedFile}`) + ` file(s) modified.\nRun the process again to check the result.`);
  }
  else {
    log_util.log('No files modified.');
  }
}


// --------------------------------------------------
///@param[in]   destPath    저장할 폴더 경로 (e.g. 'public/out-md/')
///@return      bookinfos 배열 (파싱된 JSON)
///@brief       BOOKINFOS_URL에서 bookinfos.json을 다운로드하여 destPath에 저장
// --------------------------------------------------
async function downloadBookinfos(destPath)
{
  log_util.log(`\ndownloading bookinfos.json...`);
  file_util.mkdir(destPath);
  const response = await axios.get(BOOKINFOS_URL);
  const filePath = path.join(destPath, 'bookinfos.json');
  fs.writeFileSync(filePath, JSON.stringify(response.data, null, 2));
  log_util.log(` : OK (${response.data.length} entries)`);
  return response.data;
}


// --------------------------------------------------
///@param[in]   bookinfos   bookinfos.json 배열
///@return      { bookId, verId }[] — 필터 통과한 항목들
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
      verId: item['ver_id'],
      bookTitle: item['title']
    }));
}


// --------------------------------------------------
///@param[in]   rules   { checkBrokenLinks, checkSpecialChars, replaceSpecialChars, checkProhibitedStrs }
///@brief       bookinfos.json의 전체 book 목록을 받아 순차적으로 reviewRemoteBook() 수행
// --------------------------------------------------
exports.reviewRemoteBookAll = async function(rules)
{
  log_util.log('');
  log_util.log('# REVIEW ALL REMOTE BOOKS ================');

  const bookinfos = await downloadBookinfos(PATH_OUT_MD);
  const items = filterBookInfos(bookinfos);

  log_util.log(`\n${items.length} book(s) to review.`);

  for (const { bookId, verId, bookTitle } of items) {
    log_util.log(`\n=== ${bookId} / ${verId} ===`);
    log_util.log(`    ${bookTitle}`);
    await exports.reviewRemoteBook(bookId, verId, null, rules);
  }

  log_util.log(`\n--------------------------- ALL COMPLETED.`);
  return 0;
}
