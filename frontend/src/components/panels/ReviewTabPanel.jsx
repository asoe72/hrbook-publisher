import LocalSourceInput from '../source-input/LocalSourceInput';
import SourceTypeRadio from '../source-input/SourceTypeRadio';
import RemoteSourceInput from '../source-input/RemoteSourceInput';
import ControllerModelSelect from '../ControllerModelSelect';
import FiltersGroupBox from '../review/FiltersGroupBox';
import RulesGroupBox from '../review/RulesGroupBox';
import { useStore } from '../../store';
import { requestReviewLocalBook, requestReviewRemoteBook, requestReviewRemoteBookAll, handleApiResponse } from '../../api/bookApi';
import { validatePathMd, validateRemoteSource } from '../../lib/validate';


///@brief       review 탭 콘텐츠 - 교정 관련 버튼
function ReviewTabPanel() {

    const { sourceType, setSourceType, pathMd, setPathMd,
        bookId, setBookId, verId, setVerId,
        contModel, setContModel,
        reviewRules, setReviewRules,
        reviewFilters, setReviewFilters } = useStore();

    async function handleReviewBook() {
        let res = 0;
        if (sourceType === 'local') {
            if (!validatePathMd(pathMd)) return;
            res = await requestReviewLocalBook(pathMd, contModel, reviewRules);

        } else if (sourceType === 'remote-book') {
            if (!validateRemoteSource(bookId, verId)) return;
            res = await requestReviewRemoteBook(bookId, verId, contModel, reviewRules);

        } else if (sourceType === 'remote-books-all') {
            res = await requestReviewRemoteBookAll(reviewRules, reviewFilters);
        }
        handleApiResponse(res, 'review-book completed!');
    }


    // ----------------------------------------------
    function renderSourceInput()
    {
        if(sourceType === 'local') {
            return <LocalSourceInput path={pathMd} setPath={setPathMd} />;
        }
        else if(sourceType === 'remote-book') {
            return <RemoteSourceInput
                        bookId={bookId}
                        setBookId={setBookId}
                        verId={verId}
                        setVerId={setVerId}
                        />
        }
        else return null;
    }


    // ----------------------------------------------
    function renderFilters()
    {
        if(sourceType === 'remote-books-all') {
            return <FiltersGroupBox filters={reviewFilters} setFilters={setReviewFilters} />
        }
        else return null;
    }


    // ----------------------------------------------
    return (
        <div className="pt-3">
            <SourceTypeRadio
                value={sourceType}
                onChange={setSourceType}
                options={['local', 'remote-book', 'remote-books-all']}
            />
            { renderSourceInput() }
            { renderFilters() }            
            <ControllerModelSelect contModel={contModel} setContModel={setContModel} />
            <div className="d-flex gap-2">
                <button type="button" className="btn btn-secondary" onClick={handleReviewBook}>
                    <i className="bi bi-file-text"></i>&nbsp;review-book
                </button>
            </div>
            <br/>
            <RulesGroupBox rules={reviewRules} setRules={setReviewRules} />
        </div>
    );
}

export default ReviewTabPanel;
