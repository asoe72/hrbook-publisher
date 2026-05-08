import SourcePathInput from '../SourcePathInput';
import ControllerModelSelect from '../ControllerModelSelect';


///@param[in]   onBindBook          bind-book 버튼 클릭 콜백
///@param[in]   onPrintBook         print-book 버튼 클릭 콜백
///@brief       publish 탭 콘텐츠 - 제어기 모델 선택 및 출판 버튼
function PublishTabPanel({ onBindBook, onPrintBook }) {
    
    return (
        <div className="pt-3">
            <SourcePathInput/>
            <ControllerModelSelect/>
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

export default PublishTabPanel;
