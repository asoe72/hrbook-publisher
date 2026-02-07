
///@param[in] str		include가 여럿 섞인 문자열
async function replaceIncludeUrls(str)
{
	// e.g. '{% include url="https://example.com/a.html" %}'
	const re = /\{%\s*include\s+url="([^"]+)"\s*%\}/g;
	const matches = [...str.matchAll(re)];
	if (matches.length === 0) {
		return str;
	}

	const replacements = await Promise.all(
		matches.map(async (match) => {
			const fullMatch = match[0]; // {% include url="..." %}
			const url = match[1];       // 실제 URL

			const res = await fetch(url);
			const text = await res.text();

			return { fullMatch, text };
		})
	);
	
	for (const { fullMatch, text } of replacements) {
    str = str.replace(fullMatch, text);
  }

	return str;
}

module.exports = {
	replaceIncludeUrls,
}
