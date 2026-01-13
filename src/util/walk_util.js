
///@param[in]		arg (필요한 각종 정보 전달용)
///@param[in]		value		cb를 수행할 대상
///@param[in]		cb			callback 함수 (context, value, path)
///@param[in]		path		경로	e.g. ['references', 2, 'rpath']
///@brief				value 포함 그 하부의 모든 배열이나 객체가 아닌 요소에 대해 cb(value, path) 호출
///							최상위의 indexOrKey는 null이다.
function walk(arg, value, cb, path = [])
{
  // 현재 노드에 대해 콜백 호출
  cb(arg, value, path);

  // 배열인 경우
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      walk(arg, item, cb, path.concat(index));
    });
    return;
  }

  // 객체인 경우 (null 제외)
  if (value !== null && typeof value === 'object') {
    Object.entries(value).forEach(([key, val]) => {
      walk(arg, val, cb, path.concat(key));
    });
  }
}

module.exports = {
  walk
}
