///@param[in]   onNormalize     normalize 버튼 클릭 콜백
///@param[in]   onBindBook      bind-book 버튼 클릭 콜백
///@param[in]   onPrintBook     print-book 버튼 클릭 콜백
///@brief       normalize / bind-book / print-book 액션 버튼 묶음
function ActionButtons({ onNormalize, onBindBook, onPrintBook }) {
    return (
        <div className="d-flex gap-2">
            <button type="button" className="btn btn-secondary" onClick={onNormalize}>
                normalize
            </button>
            <button type="button" className="btn btn-secondary" onClick={onBindBook}>
                bind-book
            </button>
            <button type="button" className="btn btn-secondary" onClick={onPrintBook}>
                print-book
            </button>
        </div>
    );
}

export default ActionButtons;
