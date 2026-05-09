
///@brief       source-path (.md files) 입력 필드
function LocalSourceInput({ path, setPath }) {

    return (
        <div className="mb-3">
            source-path (.md files)
            <br />
            <input
                type="text"
                className="form-control mt-1"
                style={{ width: '100%', color: '#111' }}
                value={path}
                onChange={e => setPath(e.target.value)}
                placeholder="e.g. d:/doc-hrscript"
            />
        </div>
    );
}

export default LocalSourceInput;
