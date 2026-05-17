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


// ----------------------------------------------
///@param[in]   str
///@return    items
///@brief     str내에서 PROHIBITED_STRS 배열의 금지 문자열들이 있으면 처리
// ----------------------------------------------
function applyRule_ProhibitedStrs(context, str)
{
  const permittedStrs = context.pageConfig?.permittedStr ?? [];
  let items = [];
  for(const prohibitedStr of PROHIBITED_STRS) {
    if (permittedStrs.includes(prohibitedStr)) continue;
    const itemsSub = findProhibitedStr(context, str, prohibitedStr);
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
