const fs = require('fs');
const path = require('path');
const { replaceVariablesInStrToValues } = require('../variables');

// rules
const { applyRule_BrokenLinks } = require('./rules/check-links');
const { applyRule_SpecialChars } = require('./rules/special-char');


// 처리할 텍스트 파일 확장자 목록 (hrbook 문서만)
const TEXT_EXTENSIONS = new Set([
  '.md'
]);


///@param[in]   pathname    .md의 경로파일명
///@return
//      -   1   OK
//      -   0   skip
//      -   -1  NG
///@brief		    pathname file이 지정한 확장자이면, format check 수행
async function reviewFile(pathname, context)
{
  const ext = path.extname(pathname).toLowerCase();
  if (!TEXT_EXTENSIONS.has(ext)) {
    return 0;
  }

  console.log(` --------------------------------`);
  const relPathname = path.relative(context.basePathMd, pathname);
  console.log(` ## FILE: ${relPathname} : `);
  
  // 파일 읽기
  const mdText0 = fs.readFileSync(pathname, 'utf8');

  context.nModified = 0;   // 저장해야 할지 여부
  if(hasBOM(mdText0)==false) {
    chalk.yellow(`  ### BOM added`);
    context.nModified++;    // 추후, BOM 붙여서 저장해야 함.
  }

  // strip BOM
  const mdText1 = hasBOM ? mdText0.replace('\ufeff', '') : mdText0;

  // 변수 대체
  const mdText2 = replaceVariablesInStrToValues(mdText1, context.variables);

  context.pathCur = path.dirname(pathname);
  context.pathname = pathname;

  const brokenLinks = await applyRule_BrokenLinks(context, mdText2);

  // 특수문자 확인, 대체
  const mdText3 = applyRule_SpecialChars(context, mdText1);

  // 파일 저장
  if(context.nModified > 0) {
    saveWithBOM(pathname, mdText3);
  }

  return 1;
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
