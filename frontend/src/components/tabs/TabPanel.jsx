import { useState } from 'react';
import LinkCheckTab from './LinkCheckTab';
import ProofReadTab from './ProofReadTab';
import PublishTab from './PublishTab';

const TABS = [
    { id: 'link-check',  label: 'link-check' },
    { id: 'proof-read',  label: 'proof-read' },
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
///@param[in]   handlers            { onLinkCheck, onNormalize, onBindBook, onPrintBook }
///@param[in]   contModel           현재 선택된 제어기 모델
///@param[in]   onContModelChange   제어기 모델 변경 콜백
///@brief       활성 탭에 해당하는 콘텐츠 컴포넌트 렌더링
function renderTabContent(activeTab, handlers, contModel, onContModelChange) {
    if (activeTab === 'link-check') {
        return <LinkCheckTab onLinkCheck={handlers.onLinkCheck} />;
    }
    if (activeTab === 'proof-read') {
        return <ProofReadTab onNormalize={handlers.onNormalize} />;
    }
    return (
        <PublishTab
            contModel={contModel}
            onContModelChange={onContModelChange}
            onBindBook={handlers.onBindBook}
            onPrintBook={handlers.onPrintBook}
        />
    );
}


///@param[in]   onLinkCheck         link-check 버튼 클릭 콜백
///@param[in]   onNormalize         normalize 버튼 클릭 콜백
///@param[in]   contModel           현재 선택된 제어기 모델
///@param[in]   onContModelChange   제어기 모델 변경 콜백 (newValue: string)
///@param[in]   onBindBook          bind-book 버튼 클릭 콜백
///@param[in]   onPrintBook         print-book 버튼 클릭 콜백
///@brief       link-check / proof-read / publish 3개 탭 패널 컨테이너 (기본 탭: publish)
function TabPanel({ onLinkCheck, onNormalize, contModel, onContModelChange, onBindBook, onPrintBook }) {
    const [activeTab, setActiveTab] = useState('publish');

    const handlers = { onLinkCheck, onNormalize, onBindBook, onPrintBook };

    return (
        <div>
            {renderTabNav(activeTab, setActiveTab)}
            {renderTabContent(activeTab, handlers, contModel, onContModelChange)}
        </div>
    );
}

export default TabPanel;
