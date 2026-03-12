const fs = require('fs');
const file_util = require("./util/file_util");
const str_util = require("./util/str_util");
const ejs = require('ejs');


///@param[in]   bookinfo
///@return      references html
async function getHtmlReferencesSection(bookinfo)
{
	await enrichReferences(bookinfo);

	const rpathname = 'public/view/book_references.ejs';
	let book_tmpl_ejs = fs.readFileSync(rpathname, 'utf-8');
	book_tmpl_ejs = file_util.removeBom(book_tmpl_ejs);
	const data = { bookinfo: bookinfo };
	let tmpl_rendered = ejs.render(book_tmpl_ejs, data
		, { views : [ 'public/view/' ] } );	// for include in .ejs

	tmpl_rendered = str_util.strInTag(tmpl_rendered, 'body', true);
	return tmpl_rendered;
}


///@param[in,out]		bookinfo
async function enrichReferences(bookinfo)
{
	if(Array.isArray(bookinfo.references) == false) return bookinfo;

	for(const ref of bookinfo.references) {
		// .title, .id 직접 지정 방식
		if(ref.title || ref.id) {
			ref.series = ref.series ?? '';
			ref.title = ref.title ?? '';
			ref.docId = ref.id ?? '';
			continue;
		}
		// .rpath fetch 방식 (주의: 사내에서 방화벽에 막힐 수 있음.)
		const bookinfoOfRef = await fetchBookinfoFromRPath(ref.rpath);
		if(!bookinfoOfRef) {	// broken link
			ref.series = '';
			ref.title = '-';
			ref.docId = '';
		}
		else {
			ref.series = bookinfoOfRef.series;
			ref.title = bookinfoOfRef.title;
			ref.docId = bookinfoOfRef.docId;
		}
	}
}


///@param[in]		rpath		'doc-hi6-operation/korean-Hi6-tp630'
///@return
async function fetchBookinfoFromRPath(rpath)
{
	const proxy = 'https://hrcontentsrelay-bmgae5hdbzapc4bc.koreacentral-01.azurewebsites.net/api/proxy?path=';
	const url = `${proxy}${rpath}/bookinfo.json`

	let res;
	try {
		res = await fetch(url);
	} catch (e) {
		console.error(`fetchBookinfoFromRPath: Failed to fetch url="${url}"`);
		return undefined;
	}
	if (!res.ok) {
		return undefined;
	}

	const buffer = Buffer.from(await res.arrayBuffer());
	const str = buffer.toString('utf8')
	const strNoBom = file_util.removeBom(str);
	const bookinfo = JSON.parse(strNoBom);
	return bookinfo;
}

exports.getHtmlReferencesSection = getHtmlReferencesSection;
