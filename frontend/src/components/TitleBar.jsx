import { useEffect } from 'react';
import { useStore } from '../store';
import { fetchAppVersion } from '../api/bookApi';


///@brief       타이틀바 - 우상단 앱 버전 표시
function TitleBar() {
    
    const { appVersion, setAppVersion } = useStore();

    useEffect(() => {
        fetchAppVersion()
            .then(data => setAppVersion(data.version))
            .catch(() => setAppVersion('?'));
    }, []);

    return (
        <div id="titlebar" style={{ textAlign: 'right' }}>
            Version <span>{appVersion}</span>
        </div>
    );
}

export default TitleBar;
