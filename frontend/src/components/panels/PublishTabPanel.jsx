import LocalSourceInput from '../source-input/LocalSourceInput';
import ControllerModelSelect from '../ControllerModelSelect';
import { useStore } from '../../store';
import { requestBindBook, handleApiResponse } from '../../api/bookApi';
import { validatePathMd, validateRemoteSource } from '../../lib/validate';


///@brief       publish 탭 콘텐츠 - 제어기 모델 선택 및 출판 버튼
function PublishTabPanel() {

    const { pathMd, setPathMd, contModel, setContModel } = useStore();

    async function handleBindBook() {
        if (!validatePathMd(pathMd)) return;
        const res = await requestBindBook(pathMd, contModel);
        handleApiResponse(res, 'bind-book completed!');
    }

    function handlePrintBook() {
        const win = window.open('out/book.html', '_blank');
        win.focus();
    }

    return (
        <div className="pt-3">
            <br/>
            <LocalSourceInput path={pathMd} setPath={setPathMd} />
            <ControllerModelSelect contModel={contModel} setContModel={setContModel} />
            <div className="d-flex gap-2">
                <button type="button" className="btn btn-secondary" onClick={handleBindBook}>
                    <i className="bi bi-book"></i>&nbsp;bind-book
                </button>
                <button type="button" className="btn btn-secondary" onClick={handlePrintBook}>
                    <i className="bi bi-printer"></i>&nbsp;print-book
                </button>
            </div>
        </div>
    );
}

export default PublishTabPanel;
