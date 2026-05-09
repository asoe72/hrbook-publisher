///@param[in]   value       현재 선택값 ('local' | 'remote')
///@param[in]   onChange    선택 변경 콜백 (newValue: 'local' | 'remote')
///@brief       source 타입 선택 radio 버튼 (local / remote)
function SourceTypeRadio({ value, onChange }) {
    return (
        <div className="mb-2">
            {['local', 'remote'].map(type => (
                <div key={type} className="form-check form-check-inline">
                    <input
                        className="form-check-input"
                        type="radio"
                        id={`source-type-${type}`}
                        value={type}
                        checked={value === type}
                        onChange={() => onChange(type)}
                    />
                    <label className="form-check-label" htmlFor={`source-type-${type}`}>
                        {type}
                    </label>
                </div>
            ))}
        </div>
    );
}

export default SourceTypeRadio;
