///@brief   GET /app-version - 앱 버전 조회
///@return  { version: string }
async function fetchAppVersion() {
    const res = await fetch('/app-version');
    if (!res.ok) throw new Error('Failed to fetch app version');
    return res.json();
}


///@param[in]   pathMd  소스 .md 파일 경로
///@param[in]   contModel   제어기 모델 (e.g. 'Hi6', 'Hi7')
///@return      { message: string, data: { code: number } }
///@brief       POST /review-book - check, fix
async function requestReviewBook(pathMd, contModel) {
    const res = await fetch('/review-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            path_md: pathMd,
            'variables[cont_model]': contModel
        })
    });
    if (!res.ok) throw new Error('review-book request failed');
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


///@param[in]   res         서버 응답 객체 { message, data: { code } }
///@param[in]   successMsg  code===0 일 때 표시할 메시지
///@brief       API 응답 처리 - 성공/실패 여부에 따라 alert 표시
function handleApiResponse(res, successMsg) {
    if (res.data.code === 0) {
        alert(successMsg);
    } else {
        alert(res.message);
    }
}


export { fetchAppVersion, requestReviewBook, requestBindBook, handleApiResponse };
