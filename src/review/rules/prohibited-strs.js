const path = require('path');
const chalk = require('chalk');
const { addProblem } = require('../problems');
const str_util = require("../../util/str_util");


// 금지된 문자열 (검지되면 수작업 확인 안내)
const PROHIBITED_STRS = new Set([
  'Hi6', 'Hi7', 'HI6', 'HI7',
  'korean', 'english',      // -> ko, en으로 branch명 통일함.
  'hyundai-robotics.com',   // 과거 사이트 주소
  'Copyright ⓒ',           // 공용 page 참조만 해야 함.
  '[**', '**]' ]);


// --------------------------------------------------
///@return  bookinfo.permittedStrs + pageConfig.permittedStrs 합산 배열
// --------------------------------------------------
function buildPermittedStrs(context)
{
  return [
    ...(context.bookinfo?.permittedStrs ?? []),
    ...(context.pageConfig?.permittedStrs ?? []),
  ];
}


// --------------------------------------------------
///@return  이미지 링크(![](...))를 동일 길이 공백으로 치환한 문자열
///         문자 인덱스를 유지해 location 왜곡 방지
// --------------------------------------------------
function maskImageLinks(str)
{
  return str.replace(/!\[[^\]]*\]\([^)]*\)/g, match => ' '.repeat(match.length));
}


// ----------------------------------------------
///@param[in]   str
///@return    items
///@brief     str내에서 PROHIBITED_STRS 배열의 금지 문자열들이 있으면 처리
///           그림 링크(![](...))는 검사 제외
// ----------------------------------------------
function applyRule_ProhibitedStrs(context, str)
{
  if (path.basename(context.pathname) === 'SUMMARY.md') return [];

  const permittedStrs = buildPermittedStrs(context);
  const strToCheck = maskImageLinks(str);   // 그림 링크(![](...))는 검사 제외
  let items = [];
  for(const prohibitedStr of PROHIBITED_STRS) {
    if (permittedStrs.includes(prohibitedStr)) continue;
    const itemsSub = findProhibitedStr(context, strToCheck, prohibitedStr);
    items = [...items, ...itemsSub];
  }

  if(items.length) {
    context.nNgItem += items.length;
    addProblems(context, items);
  }

  return items;
}


// ----------------------------------------------
function findProhibitedStr(context, str, prohibitedStr)
{
  let idx = str.indexOf(prohibitedStr);

  const items = [];
  while (idx !== -1) {
    const location = str_util.lineColFromIndex(str, idx);
    items.push({ prohibitedStr, location });
    
    idx = str.indexOf(prohibitedStr, idx + prohibitedStr.length);
  }

  return items;
}


// --------------------------------------------------
function addProblems(context, items)
{
  for(const item of items)
  {
    const { location, prohibitedStr } = item;
    const msg = chalk.yellow(`'${prohibitedStr}'`);
    addProblem(context, 'W', 'prohibited-str', msg, location);
  }
}


// ----------------------------------------------
module.exports = {
  applyRule_ProhibitedStrs
}
