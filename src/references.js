const fs = require('fs');
const util = require("./util/util");
const ejs = require('ejs');


///@param[in]   bookinfo
///@return      references html
async function getHtmlReferencesSection(bookinfo)
{
	await enrichReferences(bookinfo);

	const rpathname = 'public/view/book_references.ejs';
	let book_tmpl_ejs = fs.readFileSync(rpathname, 'utf-8');
	book_tmpl_ejs = util.removeBom(book_tmpl_ejs);
	const data = { bookinfo: bookinfo };
	let tmpl_rendered = ejs.render(book_tmpl_ejs, data
		, { views : [ 'public/view/' ] } );	// for include in .ejs

	tmpl_rendered = util.strInTag(tmpl_rendered, 'body', true);
	return tmpl_rendered;
}


///@param[in,out]		bookinfo
async function enrichReferences(bookinfo)
{
	if(Array.isArray(bookinfo.references) == false) return bookinfo;

	for(const ref of bookinfo.references) {
		const bookinfoOfRef = await fetchBookinfoFromRPath(ref.rpath);
		if(!bookinfoOfRef) continue;
		ref.series = bookinfoOfRef.series;
		ref.title = bookinfoOfRef.title;
		ref.docId = bookinfoOfRef.docId;
	}
}


///@param[in]		rpath		'doc-hi6-operation/korean-Hi6-tp630'
///@return
async function fetchBookinfoFromRPath(rpath)
{
	const proxy = 'https://hrcontentsrelay-bmgae5hdbzapc4bc.koreacentral-01.azurewebsites.net/api/proxy?path=';
	const url = `${proxy}${rpath}/bookinfo.json`

	const res = await fetch(url);
	if (!res.ok) {
		return undefined;
	}

	const buffer = Buffer.from(await res.arrayBuffer());
	const str = buffer.toString('utf8')
	const strNoBom = util.removeBom(str);
	const bookinfo = JSON.parse(strNoBom);
	return bookinfo;
}

exports.getHtmlReferencesSection = getHtmlReferencesSection;
