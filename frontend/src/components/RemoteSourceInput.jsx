///@param[in]   bookId          remote book ID
///@param[in]   onBookIdChange  book ID 변경 콜백 (newValue: string)
///@param[in]   version         book version
///@param[in]   onVersionChange version 변경 콜백 (newValue: string)
///@brief       remote source 입력 필드 (book ID + version)
function RemoteSourceInput({ bookId, onBookIdChange, version, onVersionChange }) {
    return (
        <div className="mb-3">
            source-book
            <div className="d-flex align-items-center gap-2 mt-1">
                <span>id=</span>
                <input
                    type="text"
                    className="form-control"
                    style={{ flex: 1, color: '#111' }}
                    value={bookId}
                    onChange={e => onBookIdChange(e.target.value)}
                />
                <span>, version=</span>
                <input
                    type="text"
                    className="form-control"
                    style={{ width: '8rem', color: '#111' }}
                    value={version}
                    onChange={e => onVersionChange(e.target.value)}
                />
            </div>
        </div>
    );
}

export default RemoteSourceInput;
