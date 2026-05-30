import { useState, useEffect } from 'react';
import { fetchBookVersions } from '../../api/bookApi';


// --------------------------------------------------
///@param[in]   bookId      현재 입력된 book id
///@param[in]   setVerId    ver_id 상태 변경 함수
///@return      versions    현재 bookId에 해당하는 ver_id 목록
///@brief       bookId 변경 시 300ms debounce 후 version 목록 fetch,
///             'ko' 포함 시 자동 선택, 없으면 첫 항목 선택, 무효 id면 초기화
// --------------------------------------------------
function useBookVersions(bookId, setVerId)
{
    const [versions, setVersions] = useState([]);

    useEffect(() => {
        const timer = setTimeout(async () => {
            try {
                const { versions: vers } = await fetchBookVersions(bookId);
                setVersions(vers);
                const initial = vers.includes('ko') ? 'ko' : (vers[0] ?? '');
                setVerId(initial);
            } catch {
                setVersions([]);
                setVerId('');
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [bookId]);

    return versions;
}


// --------------------------------------------------
function VersionSelect({ versions, verId, setVerId })
{
    return (
        <select
            className="form-select"
            style={{ width: '10rem', color: '#111' }}
            value={verId}
            onChange={e => setVerId(e.target.value)}
        >
            {versions.length === 0 && <option value="">-</option>}
            {versions.map(v => (
                <option key={v} value={v}>{v}</option>
            ))}
        </select>
    );
}


// --------------------------------------------------
///@brief       remote source 입력 필드 (book ID + version combobox)
function RemoteSourceInput({ bookId, setBookId, verId, setVerId })
{
    const versions = useBookVersions(bookId, setVerId);

    return (
        <div className="mb-3">
            source-book
            <div className="d-flex align-items-center gap-2 mt-1">

                {/* 책 ID (repository-name) */}
                <span>id (repository)=</span>
                <input
                    type="text"
                    className="form-control"
                    style={{ flex: 1, color: '#111' }}
                    value={bookId}
                    onChange={e => setBookId(e.target.value)}
                    placeholder="e.g. doc-hrscript"
                />

                {/* 책 판본 (branch) combobox */}
                <span>, version (branch)=</span>
                <VersionSelect versions={versions} verId={verId} setVerId={setVerId} />
            </div>
        </div>
    );
}

export default RemoteSourceInput;
