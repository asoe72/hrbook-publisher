const LANGUAGES = ['english', 'korean', 'chinese'];
const PRODUCTS = ['hi5a', 'hi6', 'hi7', 'manipulator', 'common'];


// --------------------------------------------------
///@param[in]	legend		fieldset 제목
///@param[in]	keys		체크박스 키 목록
///@param[in]	values		{ [key]: boolean } 체크 상태
///@param[in]	onChange	key를 인자로 받는 토글 핸들러
///@brief		재사용 가능한 체크박스 그룹 렌더러
// --------------------------------------------------
function CheckboxGroup({ legend, keys, values, onChange }) {
  return (
    <fieldset className="border rounded p-2 mb-1">
      <legend className="float-none w-auto px-1" style={{ fontSize: '0.8em' }}>{legend}</legend>
      {keys.map(key => (
        <div className="form-check form-check-inline" key={key}>
          <input
            className="form-check-input"
            type="checkbox"
            id={`${legend}-${key}`}
            checked={values[key]}
            onChange={() => onChange(key)}
          />
          <label className="form-check-label" htmlFor={`${legend}-${key}`}>
            {key}
          </label>
        </div>
      ))}
    </fieldset>
  );
}


// --------------------------------------------------
///@param[in]	filters		{ languages: { [key]: boolean }, products: { [key]: boolean } }
///@param[in]	setFilters	filters 변경 핸들러
///@brief		review 필터 체크박스 그룹박스 (languages / products)
// --------------------------------------------------
function FiltersGroupBox({ filters, setFilters }) {

  function handleLanguageChange(key) {
    setFilters({ ...filters, languages: { ...filters.languages, [key]: !filters.languages[key] } });
  }

  function handleProductChange(key) {
    setFilters({ ...filters, products: { ...filters.products, [key]: !filters.products[key] } });
  }

  return (
    <fieldset className="border rounded p-2 mb-2">
      <legend className="float-none w-auto px-1" style={{ fontSize: '0.85em' }}>filters</legend>
      <CheckboxGroup
        legend="languages"
        keys={LANGUAGES}
        values={filters.languages}
        onChange={handleLanguageChange}
      />
      <CheckboxGroup
        legend="products"
        keys={PRODUCTS}
        values={filters.products}
        onChange={handleProductChange}
      />
    </fieldset>
  );
}

export default FiltersGroupBox;
