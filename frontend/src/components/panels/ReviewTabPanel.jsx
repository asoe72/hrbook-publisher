import SourcePathInput from '../SourcePathInput';
import SourceTypeRadio from '../SourceTypeRadio';
import RemoteSourceInput from '../RemoteSourceInput';
import ControllerModelSelect from '../ControllerModelSelect';

///@param[in]   pathMd              local source-path 값
///@param[in]   setPathMd           local source-path 변경 콜백
///@param[in]   sourceType          source 타입 ('local' | 'remote')
///@param[in]   setSourceType       source 타입 변경 콜백
///@param[in]   remoteBookId        remote book ID
///@param[in]   setRemoteBookId     remote book ID 변경 콜백
///@param[in]   remoteVersion       remote book version
///@param[in]   setRemoteVersion    remote book version 변경 콜백
///@param[in]   contModel           제어기 모델
///@param[in]   onContModelChange   제어기 모델 변경 콜백
///@param[in]   onReviewBook        review-book 버튼 클릭 콜백
///@brief       review 탭 콘텐츠 - 교정 관련 버튼 (추후 옵션 체크박스 확장 예정)
function ReviewTabPanel({ pathMd, setPathMd, sourceType, setSourceType, remoteBookId, setRemoteBookId, remoteVersion, setRemoteVersion, contModel, onContModelChange, onReviewBook }) {
    return (
        <div className="pt-3">
            <SourceTypeRadio value={sourceType} onChange={setSourceType} />
            {sourceType === 'local'
                ? <SourcePathInput value={pathMd} onChange={setPathMd} />
                : <RemoteSourceInput
                    bookId={remoteBookId}
                    onBookIdChange={setRemoteBookId}
                    version={remoteVersion}
                    onVersionChange={setRemoteVersion}
                  />
            }
            <ControllerModelSelect value={contModel} onChange={onContModelChange} />
            <div className="d-flex gap-2">
                <button type="button" className="btn btn-secondary" onClick={onReviewBook}>
                    <i className="bi bi-file-text"></i>&nbsp;review-book
                </button>
            </div>
        </div>
    );
}

export default ReviewTabPanel;
