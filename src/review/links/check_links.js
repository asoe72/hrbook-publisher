const axios = require('axios');
const cheerio = require('cheerio');


// --------------------------------------------------
async function checkHasBrokenLink(context, html) {

	const brokenLinks = await brokenLinkFromHtml(context, html);
  return brokenLinks;
}

// --------------------------------------------------
/// @param[in]	context
/// @param[in]	html	검사할 html
/// @return		brokenLinks[] 배열
/// @brief		html 내에서 모든 <a> 태그들의 link를 확인하여, brokenLinks[] 배열을 리턴한다.
// --------------------------------------------------
async function brokenLinkFromHtml(context, html) {
  const $ = cheerio.load(html);
  const links = [];
  const brokenLinks = [];

  // 모든 <a> 태그에서 href 추출
  $('a').each((_, el) => {
    const href = $(el).attr('href');
    if (href) links.push(href);
  });

	for(const url of links) {
		try {
			const broken = await isBrokenLink(context, url);
			if(broken) {
				brokenLinks.push(url);
			}
		} catch (err) {
			console.error(`Error checking ${url}:`, err.message);
			brokenLinks.push(url);
    }
	}
	return brokenLinks;
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
  if(isRelativePathUrl(url)) {
    return await checkRelativePathLink(context, url);
  }
  else {
    let status;
    if(isHRBookUrl(url)) {
      status = await checkHRBookLink(context.browserPage, url);
    }
    else {
      status = await checkExternalLink(url);
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
/// @brief		context.basePath에 url로 지정한 file이 존재하는지 여부로 확인한다.
// --------------------------------------------------
async function checkRelativePathLink(context, url) {
  
  // ? query 부분 제거

  
  return false;
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


// --------------------------------------------------
/// @param[in]	url		검사할 URL  e.g. 'https://example.com/some/path'
/// @return
///				-		200					OK
///				-		4XX, 5XX		NG
// --------------------------------------------------
async function checkExternalLink(url) {
  try {
    const response = await axios.head(url, {
			timeout: 10000,
			headers: { 'User-Agent': 'Mozilla/5.0 ...' }
		});
    return 200;
  } catch (err) {
    if (err.response) {
      return err.response.status;
    }
    return 400;
  }
}


module.exports = {
  checkHasBrokenLink, checkLink
}
