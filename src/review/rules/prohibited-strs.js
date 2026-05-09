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
///@return    foundLocs
///@brief     str내에서 PROHIBITED_STRS 배열의 금지 문자열들이 있으면 처리
// ----------------------------------------------
function applyRule_ProhibitedStrs(context, str)
{
  let foundLocs = [];
  for(const prohibitedStr of PROHIBITED_STRS) {
    const foundLocsSub = findProhibitedStr(context, str, prohibitedStr);
    foundLocs = [...foundLocs, ...foundLocsSub];
  }

  if(foundLocs.length) {
    context.nNgItem += foundLocs.length;
    addProblems(context, foundLocs);
  }

  return foundLocs;
}


// ----------------------------------------------
function findProhibitedStr(context, str, prohibitedStr)
{
  let idx = str.indexOf(prohibitedStr);

  const foundLocs = [];
  while (idx !== -1) {
    const loc = str_util.lineColFromIndex(str, idx);
    loc.prohibitedStr = prohibitedStr;
    foundLocs.push(loc);
    
    idx = str.indexOf(prohibitedStr, idx + prohibitedStr.length);
  }

  return foundLocs;
}


// --------------------------------------------------
function addProblems(context, locs)
{
  for(const loc of locs)
  {
    const { line, col, prohibitedStr } = loc;
    const msg = chalk.yellow(`'${prohibitedStr}'`) + ` at (Ln ${line}, Col ${col}))`;
    addProblem(context, 'W', 'prohibited-str', msg);
  }
}


// ----------------------------------------------
module.exports = {
  applyRule_ProhibitedStrs
}
