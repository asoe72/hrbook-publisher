import LocalSourceInput from '../source-input/LocalSourceInput';
import SourceTypeRadio from '../source-input/SourceTypeRadio';
import RemoteSourceInput from '../source-input/RemoteSourceInput';
import ControllerModelSelect from '../ControllerModelSelect';
import { useStore } from '../../store';
import { requestReviewLocalBook, requestReviewRemoteBook, handleApiResponse } from '../../api/bookApi';
import { validatePathMd, validateRemoteSource } from '../../lib/validate';


///@brief       review 탭 콘텐츠 - 교정 관련 버튼
function ReviewTabPanel() {
    
    const { sourceType, setSourceType, pathMd, setPathMd,
        bookId, setBookId, bookVer, setBookVer,
        contModel, setContModel } = useStore();

    async function handleReviewBook() {
        let res = 0;
        if (sourceType === 'local') {
            if (!validatePathMd(pathMd)) return;
            res = await requestReviewLocalBook(pathMd, contModel);
            
        } else {
            if (!validateRemoteSource(bookId, bookVer)) return;
            res = await requestReviewRemoteBook(bookId, bookVer);            
        }
        handleApiResponse(res, 'review-book completed!');
    }

    return (
        <div className="pt-3">
            <SourceTypeRadio value={sourceType} onChange={setSourceType} />
            {sourceType === 'local'
                ? <LocalSourceInput path={pathMd} setPath={setPathMd} />
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
