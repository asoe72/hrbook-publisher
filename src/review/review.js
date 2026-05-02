const fs = require('fs');
const md2html = require('../md2html');


// ----------------------------------------------
exports.reviewBook = async function(basePathMd, variables)
{
  console.log('');
  console.log('# PROCESS ALL FILES ================');

  const basePathHtml = 'public/out/';

  await convMds2HtmlsAll(basePathMd, basePathHtml, variables);
  return 0;
}


// ----------------------------------------------
async function convMds2HtmlsAll(basePathMd, basePathHtml, variables)
{
  console.log('');
  console.log('## CONVERT MDs to HTMLs ALL');

	fs.rmSync(basePathHtml, { recursive: true, force: true });
	await md2html.convDir(basePathMd, basePathHtml, variables);

  return 0;
}

