///@brief   GET /app-version - 앱 버전 조회
///@return  { version: string }
async function fetchAppVersion() {
    const res = await fetch('/app-version');
    if (!res.ok) throw new Error('Failed to fetch app version');
    return res.json();
}


///@param[in]   pathMd  소스 .md 파일 경로
///@return      { message: string, data: { code: number } }
///@brief       POST /normalize-book - Markdown 정규화 요청
async function requestNormalizeBook(pathMd) {
    const res = await fetch('/normalize-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ path_md: pathMd })
    });
    if (!res.ok) throw new Error('normalize-book request failed');
    return res.json();
}


///@param[in]   pathMd      소스 .md 파일 경로
///@param[in]   contModel   제어기 모델 (e.g. 'Hi6', 'Hi7')
///@return      { message: string, data: { code: number } }
///@brief       POST /bind-book - 책 묶기 요청
async function requestBindBook(pathMd, contModel) {
    const res = await fetch('/bind-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            path_md: pathMd,
            'variables[cont_model]': contModel
        })
    });
    if (!res.ok) throw new Error('bind-book request failed');
    return res.json();
}


export { fetchAppVersion, requestNormalizeBook, requestBindBook };
