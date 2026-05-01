const CONTROLLER_MODELS = ['Hi6', 'Hi7'];

///@param[in]   value       현재 선택된 모델 값
///@param[in]   onChange    선택 변경 콜백 (newValue: string)
///@brief       제어기 모델(cont_model) 선택 셀렉터
function ControllerModelSelect({ value, onChange }) {
    return (
        <div className="mb-3">
            cont_model =&nbsp;
            <select
                className="form-select d-inline-block"
                style={{ width: '120px' }}
                value={value}
                onChange={e => onChange(e.target.value)}
            >
                {CONTROLLER_MODELS.map(model => (
                    <option key={model} value={model}>{model}</option>
                ))}
            </select>
        </div>
    );
}

export default ControllerModelSelect;
