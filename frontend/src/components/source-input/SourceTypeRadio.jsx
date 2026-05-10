///@param[in]   value       현재 선택값 ('local' | 'remote-book' | 'remote-books-all')
///@param[in]   onChange    선택 변경 콜백 (newValue: string)
///@param[in]   options     라디오 버튼 선택지 배열
///@brief       source 타입 선택 radio 버튼
function SourceTypeRadio({ value, onChange, options }) {
    return (
        <div className="mb-2">
            {options.map(type => (
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
