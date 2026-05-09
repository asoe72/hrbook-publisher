import SourcePathInput from '../SourcePathInput';
import SourceTypeRadio from '../SourceTypeRadio';
import RemoteSourceInput from '../RemoteSourceInput';
import ControllerModelSelect from '../ControllerModelSelect';
import { useStore } from '../../store';
import { requestReviewBook, handleApiResponse } from '../../api/bookApi';
import { validatePathMd, validateRemoteSource } from '../../lib/validate';


///@brief       review 탭 콘텐츠 - 교정 관련 버튼
function ReviewTabPanel() {
    
    const { sourceType, setSourceType, pathMd, setPathMd,
        bookId, setBookId, bookVer, setBookVer,
        contModel, setContModel } = useStore();

    async function handleReviewBook() {
        if (sourceType === 'local') {
            if (!validatePathMd(pathMd)) return;
            const res = await requestReviewBook(pathMd, contModel);
            handleApiResponse(res, 'review-book completed!');
        } else {
            if (!validateRemoteSource(bookId, bookVer)) return;
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
                    bookId={bookId}
                    setBookId={setBookId}
                    bookVer={bookVer}
                    setBookVer={setBookVer}
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
