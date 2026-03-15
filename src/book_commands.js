const fs = require('fs');
const path = require('path');
const md2html = require('./md2html');
const bookbind = require('./bookbind');
const { normalizeProcAll } = require('./normalize/normalize.js');

// ----------------------------------------------
///@return
///     -   0       ok
function normalizeBook(path_md, result)
{
    console.log(path_md);
    normalizeProcAll(path_md);
    return 0;
}


// ----------------------------------------------
///@return
///     -   0       ok
///     -   -1      SUMMARY.md (TOC) not found
///     -   -2      bookinfo.json not found
async function bindBook(path_md, variables, result)
{
    const pathfile_toc = path.join(path_md, "SUMMARY.md");
    const pathfile_bookinfo = path.join(path_md, "bookinfo.json");
    const path_html = 'public/out/';

    if(fs.existsSync( pathfile_toc )==false) {
        result.msg = pathfile_toc + ' not found.';
        return -1;
    }
    if(fs.existsSync( pathfile_bookinfo )==false) {
        result.msg = pathfile_bookinfo + ' not found.';
        return -2;
    }

    fs.rmSync(path_html, { recursive: true, force: true });
    await md2html.convDir(path_md, path_html);
    await bookbind.bind(path_html, path_md, variables, pathfile_toc, pathfile_bookinfo);

    return 0;
}


module.exports = { normalizeBook, bindBook };
