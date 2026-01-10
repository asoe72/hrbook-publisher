import { walk } from "./util/walk_util.mjs";


///@param[in,out]		bookinfo
///@brief						bookinfo 항목 내의 요소들의 ${ }들을 bookinfo.variables로 replace
export function replaceVariablesInBookinfoToValues(bookinfo)
{
	walk(bookinfo.variables, bookinfo, cbReplaceVariablesInItemToValues);
}


///@brief			walk용 callback 함수
function cbReplaceVariablesInItemToValues(variables, value, path)
{
	const key = (path.length==0) ? '' : path[path.length-1];
	if (key == 'variables') return 0;

	// 배열인 경우
	if (Array.isArray(value)) {
		value.forEach((item, index) => {
			value[index] = replaceVariablesInStrToValues(item, variables);
		});
		return;
	}

	// 객체인 경우 (null 제외)
	if (value !== null && typeof value === 'object') {
		Object.entries(value).forEach(([key, val]) => {
			value[key] = replaceVariablesInStrToValues(val, variables);
		});
	}
}


///@param[in]	str		e.g.
export function replaceVariablesInStrToValues(str, vars)
{
	if (typeof str !== 'string') return str;

	//console.log('replaceVariablesInStrToValues');
	//console.log(JSON.stringify(info.variables));
	let modifiedStr = str;
	for(const vname in vars) {
		modifiedStr = replaceVariablesToValue(modifiedStr, vname, vars[vname]);
	}
	
	return modifiedStr;
}


///@param[in]	str		e.g.
///@param[in]	var_name		e.g. 'cont_model'
///@param[in]	var_value		e.g. 'Hi7'
function replaceVariablesToValue(str, var_name, var_value)
{
	const pattern = new RegExp(`\\$\\{${var_name}\\}`, 'g');
	return str.replace(pattern, var_value);
}
