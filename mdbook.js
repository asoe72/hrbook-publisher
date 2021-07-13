const unified = require("unified");
const markdown = require("remark-parse");
const remark2rehype	= require("remark-rehype");
const html = require("rehype-stringify");


const mdText = `
# Our Project

Hello, **Markdown!**.
`;

const html_text = unified()
	.use(markdown)
	.use(remark2rehype)
	.use(html)
	.processSync(mdText);

console.log(html_text.toString());