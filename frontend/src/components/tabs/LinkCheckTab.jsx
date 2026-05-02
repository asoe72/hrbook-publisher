///@param[in]   onLinkCheck     link-check 버튼 클릭 콜백
///@brief       link-check 탭 콘텐츠 - 링크 유효성 검사 버튼
function LinkCheckTab({ onLinkCheck }) {
    return (
        <div className="pt-3">
            <button type="button" className="btn btn-secondary" onClick={onLinkCheck}>
                <i className="bi bi-link-45deg"></i>&nbsp;link-check
            </button>
        </div>
    );
}

export default LinkCheckTab;
