
///@brief       remote source 입력 필드 (book ID + version)
function RemoteSourceInput({ bookId, setBookId, bookVer, setBookVer }) {
    return (
        <div className="mb-3">
            source-book
            <div className="d-flex align-items-center gap-2 mt-1">

                {/* 책 ID (repository-name) */}
                <span>id=</span>
                <input
                    type="text"
                    className="form-control"
                    style={{ flex: 1, color: '#111' }}
                    value={bookId}
                    onChange={e => setBookId(e.target.value)}
                />

                {/* 책 판본 (branch) */}
                <span>, version=</span>
                <input
                    type="text"
                    className="form-control"
                    style={{ width: '8rem', color: '#111' }}
                    value={bookVer}
                    onChange={e => setBookVer(e.target.value)}
                />
            </div>
        </div>
    );
}

export default RemoteSourceInput;
