// --------------------------------------------------
///@param[in]   jsonStr     page-config 블록 내부의 JSON 문자열
///@return      파싱된 객체, 실패 시 {}
// --------------------------------------------------
function parsePageConfigJson(jsonStr)
{
  try {
    return JSON.parse(jsonStr.replace(/'/g, '"'));
  } catch (e) {
    return {};
  }
}


// --------------------------------------------------
///@param[in]   context     pageConfig 속성을 담을 객체
///@param[in]   mdText      .md 파일 전체 텍스트
///@return      <script id="page-config"> 블록을 제거한 나머지 텍스트
///@brief       <script id="page-config"> 블록을 추출하여 JSON으로 파싱한 후 context에 pageConfig 속성으로 담는다.
// --------------------------------------------------
function extractPageConfig(context, mdText)
{
  const match = mdText.match(/<script\s+id="page-config"[^>]*>([\s\S]*?)<\/script>/);
  if (!match) return mdText;
  
  context.pageConfig = parsePageConfigJson(match[1].trim());

  return mdText.replace(match[0], '');
}


module.exports = { extractPageConfig };
