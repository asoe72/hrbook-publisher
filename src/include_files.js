
const fs = require('fs');
const path = require('path');

const PATH_MD_BASE = path.join(__dirname, '../public/md');

///@param[in] str		include가 여럿 섞인 문자열
async function replaceIncludeFiles(str)
{
	// e.g. '{% include file="en/precautions.md" %}'
	const re = /\{%\s*include\s+file="([^"]+)"\s*%\}/g;
	const matches = [...str.matchAll(re)];
	if (matches.length === 0) {
		return str;
	}

	const replacements = await Promise.all(
		matches.map(async (match) => {
			const fullMatch = match[0]; // {% include file="..." %}
			const filePath = match[1];  // 상대 경로

			const absPath = path.join(PATH_MD_BASE, filePath);
			let text;
			try {
				text = await fs.promises.readFile(absPath, 'utf8');
			} catch (e) {
				console.error(`replaceIncludeFiles: file not found: ${absPath}`);
				text = fullMatch; // 원본 유지
			}

			return { fullMatch, text };
		})
	);

	for (const { fullMatch, text } of replacements) {
		str = str.replace(fullMatch, text);
	}

	return str;
}

module.exports = {
	replaceIncludeFiles,
}
