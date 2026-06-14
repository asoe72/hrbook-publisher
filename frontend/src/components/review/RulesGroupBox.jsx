const RULE_LABELS = [
    { key: 'checkBrokenLinks',    label: 'check broken links' },
    { key: 'checkSpecialChars',   label: 'check special characters' },
    { key: 'replaceSpecialChars', label: 'replace special characters' },
    { key: 'checkProhibitedStrs', label: 'check prohibited strings' },
    { key: 'compareSummary',      label: 'compare SUMMARY.md of ko/, en/', onlyFor: 'remote-book' },
];


// --------------------------------------------------
///@param[in]   rules       { checkBrokenLinks, checkSpecialChars, replaceSpecialChars, checkProhibitedStrs, compareSummary }
///@param[in]   setRules    rules 변경 핸들러
///@param[in]   sourceType  현재 소스 타입 ('local'|'remote-book'|'remote-books-all')
///@brief       review rules 체크박스 그룹박스
// --------------------------------------------------
function RulesGroupBox({ rules, setRules, sourceType }) {

    function handleChange(key) {
        setRules({ ...rules, [key]: !rules[key] });
    }

    const visibleRules = RULE_LABELS.filter(({ onlyFor }) => !onlyFor || onlyFor === sourceType);

    return (
        <fieldset className="border rounded p-2 mb-2">
            <legend className="float-none w-auto px-1" style={{ fontSize: '0.85em' }}>rules</legend>
            {visibleRules.map(({ key, label }) => (
                <div className="form-check" key={key}>
                    <input
                        className="form-check-input"
                        type="checkbox"
                        id={`rule-${key}`}
                        checked={rules[key]}
                        onChange={() => handleChange(key)}
                    />
                    <label className="form-check-label" htmlFor={`rule-${key}`}>
                        {label}
                    </label>
                </div>
            ))}
        </fieldset>
    );
}

export default RulesGroupBox;
