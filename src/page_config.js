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
///@param[in]   mdText      .md 파일 전체 텍스트
///@return      pageConfig 객체, 태그 없으면 {}
///@brief       <script id="page-config"> 블록을 추출하여 JSON으로 파싱
// --------------------------------------------------
function extractPageConfig(mdText)
{
  const match = mdText.match(/<script\s+id="page-config"[^>]*>([\s\S]*?)<\/script>/);
  if (!match) return {};
  return parsePageConfigJson(match[1].trim());
}


module.exports = { extractPageConfig };
