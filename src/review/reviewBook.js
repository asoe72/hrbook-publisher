const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { reviewFile } = require('./reviewFile');


// 제외할 폴더 or 파일명 목록
const EXCLUDED_NAMES = new Set([
  '.git', 'book.md', 'index.json'
]);


// ----------------------------------------------
exports.reviewBook = async function(basePathMd, variables)
{
  console.log('');
  console.log('# PROCESS ALL FILES ================');

  await reviewPathAll(basePathMd, variables);

  console.log(`\n------------------- COMPLETED.`);

  return 0;
}


// ----------------------------------------------
async function reviewPathAll(basePathMd, variables)
{
  console.log('');
  console.log('# CHECK & MODIFY FILES ================');
  const context = { basePathMd, variables
    , nChecked: 0, nOk: 0, nNgFile: 0, nNgItem: 0, nModified: 0 };

  const browser = await puppeteer.launch();
  context.browserPage = await browser.newPage();

  return await reviewPath(context, basePathMd);
}


///@param[in]   context   { basePathMd, basePathCur
///               , nChecked: 0, nOk: 0, nNgFile: 0, nNgItem: 0, nModified: 0 };
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
      const ret = await reviewFile(pathname, context);
      if(ret < 0) {
        context.nNgFile++;
      }
      else if(ret > 0) {
        context.nOk++;
      }
    }
    context.nChecked++;
  }
}
