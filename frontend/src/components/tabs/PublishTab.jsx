import SourcePathInput from '../SourcePathInput';
import ControllerModelSelect from '../ControllerModelSelect';

///@param[in]   contModel           현재 선택된 제어기 모델
///@param[in]   onContModelChange   제어기 모델 변경 콜백 (newValue: string)
///@param[in]   onBindBook          bind-book 버튼 클릭 콜백
///@param[in]   onPrintBook         print-book 버튼 클릭 콜백
///@brief       publish 탭 콘텐츠 - 제어기 모델 선택 및 출판 버튼
function PublishTab({ pathMd, setPathMd, contModel, onContModelChange, onBindBook, onPrintBook }) {
    return (
        <div className="pt-3">
            <SourcePathInput value={pathMd} onChange={setPathMd} />
            <ControllerModelSelect value={contModel} onChange={onContModelChange} />
            <div className="d-flex gap-2">
                <button type="button" className="btn btn-secondary" onClick={onBindBook}>
                    <i className="bi bi-book"></i>&nbsp;bind-book
                </button>
                <button type="button" className="btn btn-secondary" onClick={onPrintBook}>
                    <i className="bi bi-printer"></i>&nbsp;print-book
                </button>
            </div>
        </div>
    );
}

export default PublishTab;
