const fs = require('fs');
const path = require('path');
const md2html = require('../md2html');
const puppeteer = require('puppeteer');
const { checkHasBrokenLink } = require('./links/check_links');


// 제외할 폴더 or 파일명 목록
const EXCLUDED_NAMES = new Set([
  '.git', 'book.md', 'index.json'
]);


// 처리할 텍스트 파일 확장자 목록 (hrbook 문서만)
const TEXT_EXTENSIONS = new Set([
  '.md', '.html', '.json'
]);


// ----------------------------------------------
exports.reviewBook = async function(basePathMd, variables)
{
  console.log('');
  console.log('# PROCESS ALL FILES ================');

  const basePathHtml = 'public/out/';

  await convMds2HtmlsAll(basePathMd, basePathHtml, variables);

  await reviewPathAll(basePathHtml);

  console.log(`\n------------------- COMPLETED.`);

  return 0;
}


// ----------------------------------------------
async function convMds2HtmlsAll(basePathMd, basePathHtml, variables)
{
  console.log('');
  console.log('## CONVERT MDs to HTMLs ALL');

	fs.rmSync(basePathHtml, { recursive: true, force: true });
	await md2html.convDir(basePathMd, basePathHtml, variables);

  return 0;
}


// ----------------------------------------------
async function reviewPathAll(_path)
{
  console.log('');
  console.log('# CHECK & MODIFY FILES ================');
  const context = { basePath: _path, nChecked: 0
    , nOk: 0, nNgFile: 0, nNgItem: 0, nModified: 0 };

  const browser = await puppeteer.launch();
  context.browserPage = await browser.newPage();

  return await reviewPath(_path, context);
}


///@param[in]   _path
///@param[in]   context   { nChecked: 0, nOk: 0, nNgFile: 0, nNgItem: 0 }
///@return      review한 파일 개수 (skip file 제외)
///@brief		    _path 내의 모든 파일에 대해 reviewFile() 수행
async function reviewPath(_path, context)
{
  const entries = fs.readdirSync(_path, { withFileTypes: true });
  
  for (const entry of entries) {
    const pathname = path.join(_path, entry.name);

    if(EXCLUDED_NAMES.has(entry.name)) {
      continue;
    }

    if (entry.isDirectory()) {
      await reviewPath(pathname, context);
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


///@param[in]   pathname
///@return
//      -   1   OK
//      -   0   skip
//      -   -1  NG
///@brief		    pathname file이 지정한 확장자이면, format check 수행
async function reviewFile(pathname, context)
{
  const relPath = path.relative(context.basePath, pathname);
  let strMsg = `  * review: ${relPath} : `;

  const ext = path.extname(pathname).toLowerCase();
  if (!TEXT_EXTENSIONS.has(ext)) {
    return 0;
  }
  
  const str = fs.readFileSync(pathname, 'utf8');
  const html = str.replace('\ufeff', '');			// strip BOM

  const brokenLinks = await checkHasBrokenLink(context.browserPage, html);
  if(brokenLinks.length) {
    reportBrokenLinks(pathname, brokenLinks);
  }

  return 1;
}


// --------------------------------------------------
function reportBrokenLinks(pathname, brokenLinks)
{
  console.log('\n');
  console.log(`## BROKEN LINKS of ${pathname}:`);
  for(const link of brokenLinks)
  {
    console.log(` - ${link}`);
  }
}
