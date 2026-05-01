///@param[in]   version     앱 버전 문자열
///@brief       타이틀바 - 우상단 앱 버전 표시
function TitleBar({ version }) {
    return (
        <div id="titlebar" style={{ textAlign: 'right' }}>
            Version <span>{version}</span>
        </div>
    );
}

export default TitleBar;
