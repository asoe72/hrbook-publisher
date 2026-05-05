import { useState, useEffect } from 'react';
import TitleBar from './components/TitleBar';
import SourcePathInput from './components/SourcePathInput';
import TabPanel from './components/tabs/TabPanel';
import { fetchAppVersion, requestNormalizeBook, requestReviewBook, requestBindBook } from './api/bookApi';

///@param[in]   pathMd  source-path 입력값
///@return      true: 유효, false: 빈 값 (경고 표시 후 false)
///@brief       path_md 유효성 검사
function validatePathMd(pathMd) {
    if (pathMd.trim() === '') {
        alert('Please, set the source-path (.md files)');
        return false;
    }
    return true;
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


///@brief   최상위 App 컴포넌트 - 전체 상태 관리 및 API 호출 담당
function App() {
    const [version, setVersion] = useState('...');
    const [pathMd, setPathMd] = useState('');
    const [contModel, setContModel] = useState('Hi6');

    useEffect(() => {
        fetchAppVersion()
            .then(data => setVersion(data.version))
            .catch(() => setVersion('?'));
    }, []);

    async function handleNormalize() {
        if (!validatePathMd(pathMd)) return;
        const res = await requestNormalizeBook(pathMd);
        handleApiResponse(res, 'normalize-book completed!');
    }

    async function handleReviewBook() {
        if (!validatePathMd(pathMd)) return;
        const res = await requestReviewBook(pathMd, contModel);
        handleApiResponse(res, 'review-book completed!');
    }

    async function handleBindBook() {
        if (!validatePathMd(pathMd)) return;
        const res = await requestBindBook(pathMd, contModel);
        handleApiResponse(res, 'bind-book completed!');
    }

    function handlePrintBook() {
        const win = window.open('out/book.html', '_blank');
        win.focus();
    }

    return (
        <>
            <TitleBar version={version} />
            <div id="client-area">
                <h1 style={{ fontSize: '2.8em' }}>
                    <img src="/book-orange-80.png" 
                    style={{ height: '1em', verticalAlign: 'middle', marginBottom: '0.3em', marginRight: '0.3em' }} />
                    <b>hrbook-publisher</b>
                </h1>
                <br /><br />
                <SourcePathInput value={pathMd} onChange={setPathMd} />
                <TabPanel                                        
                    contModel={contModel}
                    onContModelChange={setContModel}
                    
                    onNormalize={handleNormalize}
                    onReviewBook={handleReviewBook}
                    
                    onBindBook={handleBindBook}
                    onPrintBook={handlePrintBook}
                />
            </div>
        </>
    );
}

export default App;
