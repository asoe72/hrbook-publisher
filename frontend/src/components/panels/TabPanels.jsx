import { useState } from 'react';
import ReviewTabPanel from './ReviewTabPanel';
import PublishTabPanel from './PublishTabPanel';


const TABS = [
    { id: 'review',  label: 'review' },
    { id: 'publish',     label: 'publish' },
];


///@param[in]   activeTab   현재 활성 탭 id
///@param[in]   onSelect    탭 클릭 콜백 (tabId: string)
///@brief       Bootstrap nav-tabs 탭 헤더 렌더링
function renderTabNav(activeTab, onSelect) {
    return (
        <ul className="nav nav-tabs">
            {TABS.map(tab => (
                <li key={tab.id} className="nav-item">
                    <button
                        className={`nav-link${activeTab === tab.id ? ' active' : ''}`}
                        onClick={() => onSelect(tab.id)}
                    >
                        {tab.label}
                    </button>
                </li>
            ))}
        </ul>
    );
}


///@param[in]   activeTab           현재 활성 탭 id
///@param[in]   handlers            { onReviewBook, onBindBook, onPrintBook }
///@param[in]   sourceType          source 타입 ('local' | 'remote')
///@param[in]   setSourceType       source 타입 변경 콜백
///@param[in]   remoteBookId        remote book ID
///@param[in]   setRemoteBookId     remote book ID 변경 콜백
///@param[in]   remoteVersion       remote book version
///@param[in]   setRemoteVersion    remote book version 변경 콜백
///@brief       활성 탭에 해당하는 콘텐츠 컴포넌트 렌더링
function renderTabContent(activeTab, handlers, sourceType, setSourceType, remoteBookId, setRemoteBookId, remoteVersion, setRemoteVersion) {
    if (activeTab === 'review') {
        return <ReviewTabPanel
            sourceType={sourceType}
            setSourceType={setSourceType}
            remoteBookId={remoteBookId}
            setRemoteBookId={setRemoteBookId}
            remoteVersion={remoteVersion}
            setRemoteVersion={setRemoteVersion}
            onReviewBook={handlers.onReviewBook} />;
    }
    else {
        return <PublishTabPanel
            onBindBook={handlers.onBindBook}
            onPrintBook={handlers.onPrintBook} />;
    }
}


///@param[in]   onReviewBook        review-book 버튼 클릭 콜백
///@param[in]   sourceType          source 타입 ('local' | 'remote')
///@param[in]   setSourceType       source 타입 변경 콜백
///@param[in]   remoteBookId        remote book ID
///@param[in]   setRemoteBookId     remote book ID 변경 콜백
///@param[in]   remoteVersion       remote book version
///@param[in]   setRemoteVersion    remote book version 변경 콜백
///@param[in]   onBindBook          bind-book 버튼 클릭 콜백
///@param[in]   onPrintBook         print-book 버튼 클릭 콜백
///@brief       review / publish 2개 탭 패널 컨테이너 (기본 탭: publish)
function TabPanels({ onReviewBook, sourceType, setSourceType, remoteBookId, setRemoteBookId, remoteVersion, setRemoteVersion, onBindBook, onPrintBook }) {
    const [activeTab, setActiveTab] = useState('publish');

    const handlers = { onReviewBook, onBindBook, onPrintBook };

    return (
        <div>
            {renderTabNav(activeTab, setActiveTab)}
            <br/>
            {renderTabContent(activeTab, handlers, sourceType, setSourceType, remoteBookId, setRemoteBookId, remoteVersion, setRemoteVersion)}
        </div>
    );
}

export default TabPanels;
