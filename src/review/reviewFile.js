const fs = require('fs');
const path = require('path');
const { checkMdHasBrokenLink } = require('./links/check_links');
const { replaceVariablesInStrToValues } = require('../variables');


// 처리할 텍스트 파일 확장자 목록 (hrbook 문서만)
const TEXT_EXTENSIONS = new Set([
  '.md', '.html', '.json'
]);


///@param[in]   pathname    .md의 경로파일명
///@return
//      -   1   OK
//      -   0   skip
//      -   -1  NG
///@brief		    pathname file이 지정한 확장자이면, format check 수행
async function reviewFile(pathname, context)
{
  const relPath = path.relative(context.basePathMd, pathname);
  let strMsg = `  * review: ${relPath} : `;

  const ext = path.extname(pathname).toLowerCase();
  if (!TEXT_EXTENSIONS.has(ext)) {
    return 0;
  }
  
  // 파일 읽기
  const mdText0 = fs.readFileSync(pathname, 'utf8');

  let modified = false;   // 저장해야 할지 여부
  if(hasBOM(mdText0)==false) modified = true;    // 추후, BOM 붙여서 저장해야 함.

  // strip BOM
  const mdText1 = hasBOM ? mdText0.replace('\ufeff', '') : mdText0;

  // 변수 대체
  const mdText2 = replaceVariablesInStrToValues(mdText1, context.variables);

  context.pathCur = path.dirname(pathname);
  const brokenLinks = await checkMdHasBrokenLink(context, mdText2);
  if(brokenLinks.length) {
    reportBrokenLinks(pathname, brokenLinks);
  }

  // 파일 저장
  if(modified) {
    saveWithBOM(pathname, mdText1);
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


// --------------------------------------------------
function hasBOM(text)
{
  return (text.charCodeAt(0) === 0xFEFF);
}


// --------------------------------------------------
function saveWithBOM(pathname, text)
{
  const textWithBOM = '\uFEFF' + text;
  fs.writeFileSync(pathname, textWithBOM, 'utf8');
}


module.exports = {
  reviewFile
}
