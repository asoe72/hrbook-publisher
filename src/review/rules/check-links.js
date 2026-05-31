const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { addProblem } = require('../problems');
const { replaceVariablesInStrToValues } = require('../../variables');
const markdown_it = require("markdown-it");


// --------------------------------------------------
async function applyRule_BrokenLinks(context, mdText) {

	const brokenItems = await brokenLinksFromMd(context, mdText);
  if(brokenItems.length) {
    addProblems(context, brokenItems);
    context.nNgItem += brokenItems.length;
  }
  return brokenItems;
}


// --------------------------------------------------
/// @param[in]	context
/// @param[in]	mdText	검사할 text
/// @return		brokenItems[] 배열    [ { url, line }, ... ]
/// @brief		mdText 내에서 모든 []() 요소와 ![]() 요소들의 link를 확인하여, brokenLinks[] 배열을 리턴한다.
// --------------------------------------------------
async function brokenLinksFromMd(context, mdText) {

  const items = linksFromMd(mdText);
  const brokenItems = [];

	for(const item of items) {
    // URL 인코딩된 경로(e.g. %EA%B7%B8%EB%A6%BC...)를 원본 경로로 변환
    try { item.url = decodeURIComponent(item.url); } catch { /* 변환 불가 시 원본 유지 */ }

		try {
			const broken = await isBrokenLink(context, item.url);
			if(broken) {
				brokenItems.push(item);
			}
		} catch (err) {
			console.error(`Error checking ${item.url}:`, err.message);
			brokenItems.push(item);
    }
	}
	return brokenItems;
}


// --------------------------------------------------
/// @param[in]	mdText	검사할 text
/// @return		items[] 배열 [ { url, line }, ... ]
/// @brief		mdText 내의 모든 []() 요소와 ![]() 요소들의 link로 구성된 links[] 배열을 리턴한다.
// --------------------------------------------------
function linksFromMd(mdText) {

  const md_it = new markdown_it();
  const tokens = md_it.parse(mdText, {});
  const items = [];

  tokens.forEach((token) => {

    if (token.children) { 
      const line = token.map ? (token.map[0] + 1) : null;   // 1-based line#
      token.children.forEach((child) => {
        let attr = null;
        if (child.type === 'link_open') {
          // attrs는 [['href', 'url'], ['target', '_blank']] 형태의 2차원 배열입니다.
          attr = child.attrs.find(attr => attr[0] === 'href');
        }
        else if (child.type === 'image') {
          // attrs는 [['src', '경로'], ['alt', '설명']] 형태의 2차원 배열입니다.
          attr = child.attrs.find(attr => attr[0] === 'src');
        }
        else {
          return;
        }
        if (attr) {
          const url = attr[1];
          items.push({ url, line });
        }
      });
    }
  });

	return items;
}


// --------------------------------------------------
/// @param[in]	context
/// @param[in]	url		검사할 URL
/// @return		broken 여부
// --------------------------------------------------
async function isBrokenLink(context, url) {
  const isOk = await checkLink(context, url);
	const broken = (isOk == false);
	return broken;
}


// --------------------------------------------------
/// @param[in]	context
/// @param[in]	url		검사할 URL
/// @return   OK 여부
// --------------------------------------------------
async function checkLink(context, url) {

  let url2 = replaceVariablesInStrToValues(url, context.variables);

  if(isRelativePathUrl(url2)) {
    return await checkRelativePathLink(context, url2);
  }
  else {
    let status;
    if(isHRBookUrl(url2)) {
      status = await checkHRBookLink(context.browserPage, url2);
    }
    else {
      status = await checkExternalLink(url2);
    }
    return (status == 200);
  }
}


// --------------------------------------------------
/// @param[in]	url	  e.g. "../3-endless/4-2-rcode/2-r354-manual-zero.md?cont_model=Hi6"
///               e.g. "2-system-setting/README.md"
///               e.g. "https://hrbook-hrc.web.app/#/view/doc-modbus/ko/1-intro/README?cont_model=Hi6"
// --------------------------------------------------
function isRelativePathUrl(url) {
  try {
    return ((url.includes('http://')==false) && (url.includes('https://')==false));
  } catch {
    return false;
  }
}


// --------------------------------------------------
function isHRBookUrl(url) {
  try {
    return url.includes('/hrbook-hrc.web.app/');
  } catch {
    return false;
  }
}


// --------------------------------------------------
/// @param[in]	url	  e.g. "../3-endless/4-2-rcode/2-r354-manual-zero.md?cont_model=Hi6"
///               e.g. "2-system-setting/README.md"
/// @brief		context.basePathMd 기준으로 url이 가리키는 .md 파일이 존재하는지 확인한다.
// --------------------------------------------------
function checkRelativePathLink(context, url) {
  // 페이지 내 앵커 링크는 항상 유효
  if (url.startsWith('#')) return true;

  // ? query 및 # anchor 제거
  let filePath = url.split('?')[0].split('#')[0];
  if (!filePath) return true;

  let absPath = path.resolve(context.pathCur, filePath);
  const ext = path.extname(absPath);
  if (ext=="") {
    absPath += '.md';
  }
  return fs.existsSync(absPath);
}


// --------------------------------------------------
/// @param[in]	page	Puppeteer Page 인스턴스
/// @param[in]	url		검사할 HRBOOK URL  e.g. 'https://hrbook-hrc.web.app/#/view/doc-hrscript/ko/3-flowcontrol-subprogram/7-call-jump/README?cont_model=Hi6'
/// @return
///				-		200					OK
///				-		4XX, 5XX		NG
/// @brief		URL의 broken 여부를 DOM 속성으로 판단.
///				렌더링 후 [data-page-status="404"] 요소 존재 시 broken으로 간주.
///				렌더링 후 [data-page-status="200"] 요소 존재 시 정상으로 간주.
///				Firebase WebSocket 등 지속 연결로 networkidle2가 만족되지 않으므로
///				'load' 이벤트 후 [data-page-status] 출현을 명시적으로 대기.
// --------------------------------------------------
async function checkHRBookLink(page, url) {
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 30000 });
  
		const attrName = 'data-page-status';
		const statusSelector = '[' + attrName + ']';

		// [data-page-status="404"]는 실패 시에만 DOM에 나타남.
		// 5초 내 나타나면 broken, timeout(= 나타나지 않음)이면 정상.
		try {
			await page.waitForSelector(statusSelector, { timeout: 5000 });
			const pageStatus = await page.$eval(
        statusSelector,
        (el, attr) => el.getAttribute(attr),
        attrName);
			return parseInt(pageStatus, 10) === 404 ? 404 : 200;
		} catch (timeoutErr) {
			return 400; 
		}
	} catch (err) {
    if (err.response) {
      return err.response.status;
    }
    return 400;
  }
}


const AXIOS_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
};

// --------------------------------------------------
/// @param[in]	url		검사할 URL  e.g. 'https://example.com/some/path'
/// @return
///				-		200					OK
///				-		4XX, 5XX		NG
/// @brief  HEAD 요청 후 405/403 시 GET으로 재시도.
// --------------------------------------------------
async function checkExternalLink(url) {
  // fragment(#...)는 서버로 전송되지 않으므로 제거
  const urlWithoutFragment = url.split('#')[0];

  try {
    await axios.head(urlWithoutFragment, { timeout: 10000, headers: AXIOS_HEADERS });
    return 200;
  } catch (headErr) {
    const status = headErr.response?.status;
    // HEAD를 차단하거나 오류 반환(405/403/400/5xx 등)하는 서버는 GET으로 재시도.
    // 404/410만 진짜 broken으로 확정; 나머지는 GET에서 최종 판단.
    if (status !== 404 && status !== 410) {
      return await checkExternalLinkWithGet(urlWithoutFragment);
    }
    return status;
  }
}


// --------------------------------------------------
/// @param[in]	url		검사할 URL  e.g. 'https://example.com/some/path'
/// @return
///				-		200					OK
///				-		4XX, 5XX		NG
/// @brief  GET 시도도 외부 링크 유효성 검사.
///         CDN(Cloudflare 등)이 HEAD를 차단하는 경우를 위한 fallback
// --------------------------------------------------
async function checkExternalLinkWithGet(url)
{
  try {
    await axios.get(url, {
      timeout: 10000,
      headers: AXIOS_HEADERS,
      responseType: 'stream',   // body를 받지 않아 메모리 낭비 방지
      maxRedirects: 5
    });
    return 200;
  } catch (getErr) {
    const status = getErr.response?.status;
    // 404/410만 진짜 broken. 403(봇 차단), 429(rate limit), 5xx(서버 오류) 등은
    // 페이지가 존재하지만 접근이 제한된 것이므로 broken으로 간주하지 않는다.
    return (status === 404 || status === 410) ? status : 200;
  }
}


// --------------------------------------------------
function addProblems(context, brokenItems)
{
  for(const item of brokenItems)
  {
    const location = { line: item.line };
    addProblem(context, 'E', 'broken-link', item.url, location);
  }
}


module.exports = {
  applyRule_BrokenLinks, checkLink
}
