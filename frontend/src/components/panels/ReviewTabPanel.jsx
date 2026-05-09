import SourcePathInput from '../SourcePathInput';
import SourceTypeRadio from '../SourceTypeRadio';
import RemoteSourceInput from '../RemoteSourceInput';
import ControllerModelSelect from '../ControllerModelSelect';
import { useStore } from '../../store';
import { requestReviewBook, handleApiResponse } from '../../api/bookApi';
import { validatePathMd, validateRemoteSource } from '../../lib/validate';


///@param[in]   remoteBookId        remote book ID
///@param[in]   setRemoteBookId     remote book ID 변경 콜백
///@param[in]   remoteVersion       remote book version
///@param[in]   setRemoteVersion    remote book version 변경 콜백
///@brief       review 탭 콘텐츠 - 교정 관련 버튼 (추후 옵션 체크박스 확장 예정)
function ReviewTabPanel({ remoteBookId, setRemoteBookId, remoteVersion, setRemoteVersion }) {
    
    const { sourceType, setSourceType, pathMd, setPathMd, contModel, setContModel } = useStore();

    async function handleReviewBook() {
        if (sourceType === 'local') {
            if (!validatePathMd(pathMd)) return;
            const res = await requestReviewBook(pathMd, contModel);
            handleApiResponse(res, 'review-book completed!');
        } else {
            if (!validateRemoteSource(remoteBookId, remoteVersion)) return;
            // remote review: Step 6에서 구현 예정
            alert('remote review-book: not implemented yet');
        }
    }

    return (
        <div className="pt-3">
            <SourceTypeRadio value={sourceType} onChange={setSourceType} />
            {sourceType === 'local'
                ? <SourcePathInput path={pathMd} setPath={setPathMd} />
                : <RemoteSourceInput
                    bookId={remoteBookId}
                    onBookIdChange={setRemoteBookId}
                    version={remoteVersion}
                    onVersionChange={setRemoteVersion}
                  />
            }
            <ControllerModelSelect contModel={contModel} setContModel={setContModel} />
            <div className="d-flex gap-2">
                <button type="button" className="btn btn-secondary" onClick={handleReviewBook}>
                    <i className="bi bi-file-text"></i>&nbsp;review-book
                </button>
            </div>
        </div>
    );
}

export default ReviewTabPanel;
