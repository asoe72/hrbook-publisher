const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const puppeteer = require('puppeteer');
const str_util = require('../util/str_util');
const { reviewFile } = require('./review-file');


// 제외할 폴더 or 파일명 목록
const EXCLUDED_NAMES = new Set([
  '.git', 'book.md', 'index.json'
]);


// ----------------------------------------------
exports.reviewLocalBook = async function(basePathMd, variables)
{
  str_util.clearConsole();
  console.log('');
  console.log('# PROCESS ALL FILES ================');

  const context = { basePathMd, variables
    , nChecked: 0, nOkFile: 0, nNgFile: 0, nNgItem: 0, nModified: 0 };

  await reviewPathAll(context, basePathMd, variables);

  printBookReport(context);

  console.log(`\n--------------------------- COMPLETED.`);

  return 0;
}


// ----------------------------------------------
exports.reviewRemoteBook = async function(bookId, bookVer, variables)
{
  str_util.clearConsole();
  console.log('');
  console.log('# PROCESS ALL FILES ================');

  console.log(`\n under-construction.`);

  console.log(`\n--------------------------- COMPLETED.`);

  return 0;
}


// ----------------------------------------------
async function reviewPathAll(context, basePathMd, variables)
{
  const browser = await puppeteer.launch();
  context.browserPage = await browser.newPage();

  return await reviewPath(context, basePathMd);
}


///@param[in]   context   { basePathMd, basePathCur
///               , nChecked: 0, nOkFile: 0, nNgFile: 0, nNgItem: 0, nModified: 0 };
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
  console.log(`${context.nChecked} file(s) checked.`);
  console.log(chalk.green(`  * OK : ${context.nOkFile} file(s)`));
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
