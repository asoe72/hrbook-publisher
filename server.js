const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');

const md_adjuster = require("./src/md_adjuster");
const md2html = require("./src/md2html");
const bookbind = require("./src/bookbind");

var app = express();

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ 
    limit:"10mb",
    extended: false 
}));


app.post('/adjust-md', function(req, res) {
	console.log('adjust-md');

    var result = {};
    var iret = adjustMd(req.body.path_md, result);
    var msg;
    if(iret==0) {
        msg = 'adjust-md ok';
    }
    else if(iret==-1 || iret==-2) {
        msg = result.msg;
    }
    else {
        msg = 'error code=' + iret;
    }

    res.send({
        message: msg,
        data: {
            code: iret
        }
    })
});


app.post('/bind-book', function(req, res) {
	console.log('bind-book');

    var result = {};
    var iret = bindBook(req.body.path_md, result);
    var msg;
    if(iret==0) {
        msg = 'bind-book ok';
    }
    else if(iret==-1 || iret==-2) {
        msg = result.msg;
    }
    else {
        msg = 'error code=' + iret;
    }

    res.send({
        message: msg,
        data: {
            code: iret
        }
    })
});


// ----------------------------------------------
///@return
///     -   0       ok
///     -   -1      SUMMARY.md (TOC) not found
///     -   -2      bookinfo.json found
function adjustMd(path_md, result)
{
    const pathfile_toc = path.join(path_md, "SUMMARY.md");
    const pathfile_bookinfo = path.join(path_md, "bookinfo.json");
    
    if(fs.existsSync( pathfile_toc )==false) {
        result.msg = pathfile_toc + ' not found.';
        return -1;
    }
    if(fs.existsSync( pathfile_bookinfo )==false) {
        result.msg = pathfile_bookinfo + ' not found.';
        return -2;
    }

    md_adjuster.adjustDir(path_md);

    return 0;
}


// ----------------------------------------------
///@return
///     -   0       ok
///     -   -1      SUMMARY.md (TOC) not found
///     -   -2      bookinfo.json found
function bindBook(path_md, result)
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

    fs.rmdirSync(path_html, { recursive: true });
    md2html.convDir(path_md, path_html);
    bookbind.bind(path_html, path_md, pathfile_toc, pathfile_bookinfo);

    return 0;
}


app.listen(50000, function() {
    console.log('Server Running at http://127.0.0.1:50000');
});
