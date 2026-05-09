const fs = require('fs');
const path = require('path');
const { replaceVariablesInStrToValues } = require('../variables');

// rules
const { applyRule_BrokenLinks } = require('./rules/check-links');
const { applyRule_CheckSpecialChars, applyRule_ReplaceSpecialChars } = require('./rules/special-char');
const { applyRule_ProhibitedStrs } = require('./rules/prohibited-strs');


// 처리할 텍스트 파일 확장자 목록 (hrbook 문서만)
const TEXT_EXTENSIONS = new Set([
  '.md'
]);


///@param[in]   pathname    .md의 경로파일명
///@return
//      -   1   OK
//      -   0   skip
///@brief		    pathname file이 지정한 확장자이면, format check 수행
async function reviewFile(pathname, context)
{
  const ext = path.extname(pathname).toLowerCase();
  if (!TEXT_EXTENSIONS.has(ext)) {
    return 0;
  }

  //console.log(` --------------------------------`);
  const relPathname = path.relative(context.basePathMd, pathname);
  console.log(` * ${relPathname} : `);

  context.nChecked++;
  
  context.pathCur = path.dirname(pathname);
  context.pathname = pathname;
  context.nModified = 0;   // 저장해야 할지 여부

  // 파일 읽기
  const mdText0 = fs.readFileSync(pathname, 'utf8');

  const _hasBom = hasBOM(mdText0);
  if(_hasBom==false) {
    chalk.yellow(`  ### BOM added`);
    context.nModified++;    // 추후, BOM 붙여서 저장해야 함.
  }

  // strip BOM
  const mdText1 = _hasBom ? mdText0.replace('\ufeff', '') : mdText0;

  // text review
  const reviewedMdText = await reviewText(context, mdText1);
  
  // 파일 저장
  if(context.nModified > 0) {
    context.nModifiedFile++;
    saveWithBOM(pathname, reviewedMdText);
  }

  return 1;
}


// --------------------------------------------------
///@param[in]   mdText
///@return      reviewedMdText
///@brief       context.rules에 따라 선택된 rule만 적용
// --------------------------------------------------
async function reviewText(context, mdText)
{
  const nNgItemBefore = context.nNgItem;
  const rules = context.rules;

  // 변수 대체
  const mdTextVarApplied = replaceVariablesInStrToValues(mdText, context.variables);

  // link 깨짐 확인
  if (rules.checkBrokenLinks) {
    await applyRule_BrokenLinks(context, mdTextVarApplied);
  }

  // 비허용 특수문자 확인
  if (rules.checkSpecialChars) {
    applyRule_CheckSpecialChars(context, mdText);
  }

  // 특수문자 치환
  let normText = mdText;
  if (rules.replaceSpecialChars) {
    normText = applyRule_ReplaceSpecialChars(context, mdText);
  }

  // 금지 문자열 확인
  if (rules.checkProhibitedStrs) {
    applyRule_ProhibitedStrs(context, mdText);
  }

  if (nNgItemBefore < context.nNgItem) {
    context.nNgFile++;
  }
  else {
    context.nOkFile++;
  }

  return normText;
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
