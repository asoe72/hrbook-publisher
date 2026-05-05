import ControllerModelSelect from '../ControllerModelSelect';

///@param[in]   onNormalize     normalize 버튼 클릭 콜백
///@param[in]   onReviewBook    review-book 버튼 클릭 콜백
///@brief       review 탭 콘텐츠 - 교정 관련 버튼 (추후 옵션 체크박스 확장 예정)
function ReviewTab({ contModel, onContModelChange, onNormalize, onReviewBook }) {
    return (
        <div className="pt-3">
            <ControllerModelSelect value={contModel} onChange={onContModelChange} />
            <div className="d-flex gap-2">
                <button type="button" className="btn btn-secondary" onClick={onNormalize}>
                    <i className="bi bi-file-text"></i>&nbsp;normalize
                </button>
                <button type="button" className="btn btn-secondary" onClick={onReviewBook}>
                    <i className="bi bi-file-text"></i>&nbsp;review-book
                </button>
            </div>
        </div>
    );
}

export default ReviewTab;
