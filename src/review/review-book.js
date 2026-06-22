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
const { applyRule_CompareSummary } = require('./rules/compare-summary');
const markdown_it = require('markdown-it');

const PROXY = 'https://hrcontentsrelay-bmgae5hdbzapc4bc.koreacentral-01.azurewebsites.net/api/proxy?path=';
const BOOKINFOS_URL = PROXY + 'hrbookinfos/refs/heads/master/bookinfos.json';
const PATH_OUT_MD = 'public/out-md/';


// --------------------------------------------------
///@param[in]   basePathMd    book의 .md 루트 경로
///@return      파싱된 bookinfo 객체, 파일 없거나 파싱 실패 시 {}
// --------------------------------------------------
function loadBookinfo(basePathMd)
{
  const pathfile = path.join(basePathMd, 'bookinfo.json');
  if (!fs.existsSync(pathfile)) return {};
  try {
    const str = file_util.removeBom(fs.readFileSync(pathfile, 'utf8'));
    return JSON.parse(str);
  } catch (e) {
    return {};
  }
}


// ----------------------------------------------
function initContext(basePathMd, variables, rules) {
  const context = { basePathMd, variables, rules,
    bookinfo: loadBookinfo(basePathMd),
    problems: [],
    nChecked: 0, nOkFile: 0, nNgFile: 0, nModifiedFile: 0, nNgItem: 0, nModified: 0 };

  return context;
}


// ----------------------------------------------
exports.reviewLocalBook = async function(basePathMd, variables, rules)
{
  log_util.init();

  log_util.log('');
  log_util.log('# REVIEW .md links in SUMMARY.md ================');

  const context = initContext(basePathMd, variables, rules);
  await reviewPathAll(context);

  printBookReport(context);

  log_util.log(`\n--------------------------- COMPLETED.`);

  return 0;
}


// ----------------------------------------------
exports.reviewRemoteBook = async function(bookId, verId, variables, rules)
{
  log_util.log('');
  log_util.log('# REVIEW .md links in SUMMARY.md ================');

  const pathOutMd = 'public/out-md/';
  const cloneRet = await updateBookToLocal(pathOutMd, bookId, verId);
  if (cloneRet !== 0) return cloneRet;

  const basePathMd = path.join(pathOutMd, bookId);
  const context = initContext(basePathMd, variables, rules);

  await reviewPathAll(context);

  if (rules?.compareSummary) {
    const versions = await exports.getVersionsByBookId(bookId);
    await applyRule_CompareSummary(context, bookId, versions);
  }

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
    if (tryPullBook(bookPath, verId) === 0) return 0;
    log_util.log(chalk.yellow(`  clone으로 재시도합니다.`));
  } else {
    log_util.log(`\ncloning ${bookId}/${verId}...`);
  }

  return doCloneBook(pathOutMd, bookId, verId);
}


// --------------------------------------------------
///@param[in]   bookPath    git repo 경로 (e.g. 'public/out-md/doc-endless')
///@param[in]   verId       checkout할 branch명 (e.g. 'ko', 'en')
///@return      0: ok, -1: checkout 또는 pull 실패
// --------------------------------------------------
function tryPullBook(bookPath, verId)
{
  if (git_util.checkoutBranch(bookPath, verId) !== 0) return -1;
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
  const iret = git_util.cloneBook(pathOutMd, bookId, verId);
  if (iret === 0) {
    log_util.log(`\n : OK`);
  } else {
    log_util.log(`\n : FAILED`);
    return -2;
  }
  return 0;
}


// --------------------------------------------------
///@param[in]   basePathMd    book의 .md 루트 경로
///@return      SUMMARY.md 텍스트 (BOM 제거), 파일 없으면 null
// --------------------------------------------------
function readSummaryText(basePathMd)
{
  const summaryPath = path.join(basePathMd, 'SUMMARY.md');
  if (!fs.existsSync(summaryPath)) return null;
  return file_util.removeBom(fs.readFileSync(summaryPath, 'utf8'));
}


// --------------------------------------------------
///@param[in]   text      SUMMARY.md 텍스트
///@param[in]   baseDir   SUMMARY.md가 위치한 디렉터리 (절대경로)
///@return      절대경로 배열 — text 내 상대경로 .md 링크만 추출
// --------------------------------------------------
function extractMdPathsFromText(text, baseDir)
{
  const tokens = new markdown_it().parse(text, {});
  const paths = [];

  for (const token of tokens) {
    if (!token.children) continue;
    for (const child of token.children) {
      if (child.type !== 'link_open') continue;
      const hrefAttr = child.attrs?.find(a => a[0] === 'href');
      if (!hrefAttr) continue;
      const href = hrefAttr[1].split('?')[0].split('#')[0].trim();
      if (href.startsWith('http://') || href.startsWith('https://')) continue;
      if (!href.toLowerCase().endsWith('.md')) continue;
      paths.push(path.resolve(baseDir, href));
    }
  }
  return paths;
}


// --------------------------------------------------
///@param[in]   basePathMd    book의 .md 루트 경로
///@return      절대경로 배열 — SUMMARY.md 자체 + SUMMARY.md에 링크된 .md 파일들
///             SUMMARY.md가 없으면 빈 배열 반환
// --------------------------------------------------
function getMdFilesFromSummary(basePathMd)
{
  const summaryPath = path.resolve(basePathMd, 'SUMMARY.md');
  const text = readSummaryText(basePathMd);
  if (text === null) return [];

  // (SUMMARY.md 자체도 포함.)
  return [summaryPath, ...extractMdPathsFromText(text, basePathMd)];
}


// --------------------------------------------------
///@brief   SUMMARY.md에 나열된 .md 파일들을 순서대로 review
// --------------------------------------------------
async function reviewMdFilesFromSummary(context)
{
  const mdFiles = getMdFilesFromSummary(context.basePathMd);
  if (mdFiles.length === 0) {
    log_util.log(chalk.yellow(`  [경고] SUMMARY.md를 찾을 수 없습니다: ${context.basePathMd}`));
    return;
  }
  for (const filepath of mdFiles) {
    await reviewFile(filepath, context);
  }
}


// --------------------------------------------------
async function reviewPathAll(context)
{
  log_util.log(`\nreviewing...`);

  const browser = await puppeteer.launch();
  context.browserPage = await browser.newPage();

  return await reviewMdFilesFromSummary(context);
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
///@return      bookinfos 배열 — 로컬 캐시 있으면 읽고, 없으면 download
// --------------------------------------------------
async function loadBookinfosWithCache(destPath)
{
  const filePath = path.join(destPath, 'bookinfos.json');
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  return await downloadBookinfos(destPath);
}


// --------------------------------------------------
///@param[in]   bookinfos   bookinfos.json 배열
///@param[in]   bookId      조회할 book_id
///@return      unique ver_id 목록 (string[])
// --------------------------------------------------
function extractUniqueVersions(bookinfos, bookId)
{
  const seen = new Set();   // 중복 제거
  const result = [];
  for (const item of bookinfos) {
    if (item['book_id'] === bookId && item['ver_id'] && !seen.has(item['ver_id'])) {
      seen.add(item['ver_id']);
      result.push(item['ver_id']);
    }
  }
  return result;
}


// --------------------------------------------------
///@param[in]   bookId      조회할 book_id
///@return      unique ver_id 목록 (string[])
///@brief       bookinfos.json(캐시 우선)에서 bookId에 해당하는 version 목록 반환
// --------------------------------------------------
exports.getVersionsByBookId = async function(bookId)
{
  log_util.init();
  const bookinfos = await loadBookinfosWithCache(PATH_OUT_MD);
  return extractUniqueVersions(bookinfos, bookId);
}


// --------------------------------------------------
///@param[in]   destPath    저장할 폴더 경로 (e.g. 'public/out-md/')
///@return      bookinfos 배열 (파싱된 JSON)
///@brief       BOOKINFOS_URL에서 bookinfos.json을 다운로드하여 destPath에 저장
// --------------------------------------------------
async function downloadBookinfos(destPath)
{
  log_util.log(`\ndownloading bookinfos.json...`);
  log_util.log(`     ${BOOKINFOS_URL}`);
  
  try {
    file_util.mkdir(destPath);
    const response = await axios.get(BOOKINFOS_URL);
    const filePath = path.join(destPath, 'bookinfos.json');
    fs.writeFileSync(filePath, JSON.stringify(response.data, null, 2));
    log_util.log(` : OK (${response.data.length} entries)`);
    return response.data;
  } catch (e) {
    return [];
  }
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
