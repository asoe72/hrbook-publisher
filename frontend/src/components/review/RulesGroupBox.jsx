const RULE_LABELS = [
    { key: 'checkBrokenLinks',    label: 'check broken links' },
    { key: 'checkSpecialChars',   label: 'check special characters' },
    { key: 'replaceSpecialChars', label: 'replace special characters' },
    { key: 'checkProhibitedStrs', label: 'check prohibited strings' },
];


// --------------------------------------------------
///@param[in]   rules       { checkBrokenLinks, checkSpecialChars, replaceSpecialChars, checkProhibitedStrs }
///@param[in]   setRules    rules 변경 핸들러
///@brief       review rules 체크박스 그룹박스
// --------------------------------------------------
function RulesGroupBox({ rules, setRules }) {

    function handleChange(key) {
        setRules({ ...rules, [key]: !rules[key] });
    }

    return (
        <fieldset className="border rounded p-2 mb-2">
            <legend className="float-none w-auto px-1" style={{ fontSize: '0.85em' }}>rules</legend>
            {RULE_LABELS.map(({ key, label }) => (
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
