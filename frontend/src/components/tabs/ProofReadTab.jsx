///@param[in]   onNormalize     normalize 버튼 클릭 콜백
///@brief       proof-read 탭 콘텐츠 - 교정 관련 버튼 (추후 옵션 체크박스 확장 예정)
function ProofReadTab({ onNormalize }) {
    return (
        <div className="pt-3">
            <button type="button" className="btn btn-secondary" onClick={onNormalize}>
                <i className="bi bi-file-text"></i>&nbsp;normalize
            </button>
        </div>
    );
}

export default ProofReadTab;
