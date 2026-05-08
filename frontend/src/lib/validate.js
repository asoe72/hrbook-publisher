
///@param[in]   pathMd  source-path 입력값
///@return      true: 유효, false: 빈 값 (경고 표시 후 false)
///@brief       path_md 유효성 검사
function validatePathMd(pathMd) {
    if (pathMd.trim() === '') {
        alert('Please, set the source-path (.md files)');
        return false;
    }
    return true;
}


///@param[in]   bookId  remote book ID
///@param[in]   version remote book version
///@return      true: 유효, false: 빈 값 (경고 표시 후 false)
///@brief       remote source (bookId, version) 유효성 검사
function validateRemoteSource(bookId, version) {
    if (bookId.trim() === '') {
        alert('Please, set the source-book id');
        return false;
    }
    if (version.trim() === '') {
        alert('Please, set the source-book version');
        return false;
    }
    return true;
}

export { validatePathMd, validateRemoteSource }