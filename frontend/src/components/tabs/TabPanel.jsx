import { useState } from 'react';
import ReviewTab from './ReviewTab';
import PublishTab from './PublishTab';

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
///@param[in]   handlers            { onBindBook, onPrintBook }
///@param[in]   contModel           현재 선택된 제어기 모델
///@param[in]   onContModelChange   제어기 모델 변경 콜백
///@brief       활성 탭에 해당하는 콘텐츠 컴포넌트 렌더링
function renderTabContent(activeTab, handlers, contModel, onContModelChange) {
    if (activeTab === 'review') {
        return <ReviewTab
            contModel={contModel}
            onContModelChange={onContModelChange}
            onReviewBook={handlers.onReviewBook} />;
    }
    else {
        return <PublishTab
            contModel={contModel}
            onContModelChange={onContModelChange}
            onBindBook={handlers.onBindBook}
            onPrintBook={handlers.onPrintBook} />;
    }
}


///@param[in]   onReviewBook        review-book 버튼 클릭 콜백
///@param[in]   contModel           현재 선택된 제어기 모델
///@param[in]   onContModelChange   제어기 모델 변경 콜백 (newValue: string)
///@param[in]   onBindBook          bind-book 버튼 클릭 콜백
///@param[in]   onPrintBook         print-book 버튼 클릭 콜백
///@brief       review / publish 2개 탭 패널 컨테이너 (기본 탭: publish)
function TabPanel({ onReviewBook, contModel, onContModelChange, onBindBook, onPrintBook }) {
    const [activeTab, setActiveTab] = useState('publish');

    const handlers = { onReviewBook, onBindBook, onPrintBook };

    return (
        <div>
            {renderTabNav(activeTab, setActiveTab)}
            {renderTabContent(activeTab, handlers, contModel, onContModelChange)}
        </div>
    );
}

export default TabPanel;
