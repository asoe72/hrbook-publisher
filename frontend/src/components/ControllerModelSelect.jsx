import { useStore } from '../store';

const CONTROLLER_MODELS = ['Hi6', 'Hi7'];


///@brief       제어기 모델(cont_model) 선택 셀렉터
function ControllerModelSelect({ contModel, setContModel }) {

    return (
        <div className="mb-3">
            cont_model =&nbsp;
            <select
                className="form-select d-inline-block"
                style={{ width: '120px' }}
                value={contModel}
                onChange={e => setContModel(e.target.value)}
            >
                {CONTROLLER_MODELS.map(model => (
                    <option key={model} value={model}>{model}</option>
                ))}
            </select>
        </div>
    );
}

export default ControllerModelSelect;
