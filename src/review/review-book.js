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
  const cloneRet = await updateBookToLocal(pathOutMd, bookId, verId);
  if (cloneRet !== 0) return cloneRet;

  const basePathMd = path.join(pathOutMd, bookId);
  const context = initContext(basePathMd, rules);

  await reviewPathAll(context);

  printBookReport(context);

  log_util.log(`\n--------------------------- COMPLETED.`);

  return 0;
}


// --------------------------------------------------
///@return  0: ok, -1: 디렉터리 삭제 실패 (파일 잠김 등), -2: clone 실패
///@brief   기존 git repo이면 pull, 없으면 clone 수행
// --------------------------------------------------
async function updateBookToLocal(pathOutMd, bookId, verId)
{
  const bookPath = path.join(pathOutMd, bookId);

  if (git_util.isGitRepo(bookPath)) {
    log_util.log(`\npulling ${bookId}/${verId}...`);
    if (tryPullBook(bookPath) === 0) return 0;
    log_util.log(chalk.yellow(`  clone으로 재시도합니다.`));
  } else {
    log_util.log(`\ncloning ${bookId}/${verId}...`);
  }

  return doCloneBook(pathOutMd, bookId, verId);
}


// --------------------------------------------------
///@param[in]   bookPath    git repo 경로 (e.g. 'public/out-md/doc-endless')
///@return      0: ok, -1: pull 실패
// --------------------------------------------------
function tryPullBook(bookPath)
{
  const iret = git_util.pullBook(bookPath);
  if (iret === 0) {
    log_util.log(`\n : OK`);
  }
  return iret;
}


// --------------------------------------------------
///@return  0: ok, -1: 디렉터리 삭제 실패 (파일 잠김 등), -2: clone 실패
///@brief   book 디렉터리 삭제 후 fresh clone 수행
// --------------------------------------------------
function doCloneBook(pathOutMd, bookId, verId)
{
  const bookPath = path.join(pathOutMd, bookId);

  try {
    fs.rmSync(bookPath, { recursive: true, force: true });
  } catch (e) {
    log_util.log(chalk.yellow(`\n [경고] '${bookPath}' 삭제 실패 — 다른 프로세스가 파일을 점유 중인지 확인하십시오.`));
    log_util.log(chalk.yellow(`  해당 폴더를 수동으로 삭제한 뒤 다시 시도하세요.`));
    return -1;
  }

  file_util.mkdir(pathOutMd);
  const iret = git_util.updateBookToLocal(pathOutMd, bookId, verId);
  if (iret === 0) {
    log_util.log(`\n : OK`);
  } else {
    log_util.log(`\n : FAILED`);
    return -2;
  }
  return 0;
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


const LANG_PREFIX = { english: 'en', korean: 'ko', chinese: 'zh' };


// --------------------------------------------------
///@param[in]   verId       bookinfos의 ver_id (e.g. 'ko', 'en-Hi6')
///@param[in]   filters     { languages: { english: true, korean: true, chinese: false } }
///@return      filters에서 true인 언어 중 하나의 접두어로 verId가 시작하는지 여부
// --------------------------------------------------
function passesLanguageFilter(verId, filters)
{
  const permittedIds = 
    Object.entries(filters.languages)     // [ [ 'english', true ], ['korean', true ], ['chinese', false ] ]
    .filter(([, enabled]) => enabled)     // true인 것만, [ [ 'english', true ], ['korean', true ] ]
    .map(([lang]) => LANG_PREFIX[lang]);  // [ 'en', 'ko' ]
  return permittedIds.some(id => verId?.startsWith(id));
}


// --------------------------------------------------
///@param[in]   item        bookinfos 항목 (item.products: [ 'hi6', 'hi7' ])
///@param[in]   filters     { products: { hi5a: false, hi6: false, hi7: true } }
///@return      item.products가 없거나, item.products와 filters.products간 교집합이 있는지 여부
// --------------------------------------------------
function passesProductFilter(item, filters)
{
  if (!item.products || item.products.length === 0) return true;
  const selected =
    Object.entries(filters.products)    // [ [ 'hi5a', false ], ['hi6', true ], ['hi7', true ] ]
      .filter(([, enabled]) => enabled) // [ ['hi6', true ], ['hi7', true ] ]
      .map(([key]) => key);    // [ 'hi6', 'hi7' ]
  
  return item.products.some(p => selected.includes(p));
}


// --------------------------------------------------
///@param[in]   bookinfos   bookinfos.json 배열
///@param[in]   filters     { languages: { [key]: boolean }, products: { [key]: boolean } }
///@return      { bookId, verId, bookTitle }[] — 필터 통과한 항목들
///@brief       url 속성 항목 제외 후 language/product 필터 적용
// --------------------------------------------------
function filterBookInfos(bookinfos, filters)
{
  return bookinfos
    .filter(item => {
      if (item.url) return false;
      if (!passesLanguageFilter(item['ver_id'], filters)) return false;
      if (!passesProductFilter(item, filters)) return false;
      return true;
    })
    .map(item => ({
      bookId:    item['book_id'],
      verId:     item['ver_id'],
      bookTitle: item['title']
    }));
}


// --------------------------------------------------
///@param[in]   rules       { checkBrokenLinks, checkSpecialChars, replaceSpecialChars, checkProhibitedStrs }
///@param[in]   filters     { languages: { [key]: boolean }, products: { [key]: boolean } }
///@brief       bookinfos.json의 전체 book 목록을 받아 순차적으로 reviewRemoteBook() 수행
// --------------------------------------------------
exports.reviewRemoteBookAll = async function(rules, filters)
{
  log_util.log('');
  log_util.log('# REVIEW ALL REMOTE BOOKS ================');

  const bookinfos = await downloadBookinfos(PATH_OUT_MD);
  const items = filterBookInfos(bookinfos, filters);

  log_util.log(`\n${items.length} book(s) to review.`);

  for (const { bookId, verId, bookTitle } of items) {
    log_util.log(`\n=== ${bookId} / ${verId} ===`);
    log_util.log(`    ${bookTitle}`);
    await exports.reviewRemoteBook(bookId, verId, null, rules);
  }

  log_util.log(`\n--------------------------- ALL COMPLETED.`);
  return 0;
}
