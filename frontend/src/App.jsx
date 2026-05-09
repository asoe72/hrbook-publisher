import { useState } from 'react';
import { useStore } from './store';
import TitleBar from './components/TitleBar';
import TabPanels from './components/panels/TabPanels';



///@brief   최상위 App 컴포넌트 - 전체 상태 관리 및 API 호출 담당
function App() {

    const [remoteBookId, setRemoteBookId] = useState('');
    const [remoteVersion, setRemoteVersion] = useState('');

    return (
        <>
            <TitleBar />
            <div id="client-area">
                <h1 style={{ fontSize: '2.8em' }}>
                    <img src="/book-orange-80.png" 
                    style={{ height: '1em', verticalAlign: 'middle', marginBottom: '0.3em', marginRight: '0.3em' }} />
                    <b>hrbook-publisher</b>
                </h1>
                <br />
                <TabPanels
                    remoteBookId={remoteBookId}
                    setRemoteBookId={setRemoteBookId}
                    remoteVersion={remoteVersion}
                    setRemoteVersion={setRemoteVersion}
                />
            </div>
        </>
    );
}

export default App;
