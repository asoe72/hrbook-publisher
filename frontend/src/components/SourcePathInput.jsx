///@param[in]   value       현재 source-path 값
///@param[in]   onChange    값 변경 콜백 (newValue: string)
///@brief       source-path (.md files) 입력 필드
function SourcePathInput({ value, onChange }) {
    return (
        <div className="mb-3">
            source-path (.md files)
            <br />
            <input
                type="text"
                className="form-control mt-1"
                style={{ width: '100%', color: '#111' }}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder="e.g. d:/doc-hrscript"
            />
        </div>
    );
}

export default SourcePathInput;
