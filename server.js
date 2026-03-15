const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');

const md_adjuster = require("./src/md_adjuster");
const md2html = require("./src/md2html");
const bookbind = require("./src/bookbind");
const { normalizeProcAll } = require("./src/normalize/normalize.js");
const { normalizeBook, bindBook } = require('./src/book_commands');

var app = express();

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ 
    limit:"10mb",
    extended: true 
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


app.post('/normalize-book', async function(req, res) {
	console.log('normalize-book');

    var result = {};
    var iret = normalizeBook(req.body.path_md, result);
    var msg;
    if(iret==0) {
        msg = 'normalize-book ok';
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


app.post('/bind-book', async function(req, res) {
	console.log('bind-book');

    var result = {};
    const vars = req.body.variables;
    var iret = await bindBook(req.body.path_md, req.body.variables, result);
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



app.listen(50000, function() {
    console.log('Server Running at http://127.0.0.1:50000');
});
