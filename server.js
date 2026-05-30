const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const str_util = require('./src/util/str_util');
const log_util = require('./src/util/log_util');

const { reviewLocalBook, reviewRemoteBook, reviewRemoteBookAll, getVersionsByBookId } = require('./src/review/review-book');
const md_adjuster = require("./src/md_adjuster");
const { bindBook } = require('./src/book_commands');

var app = express();

app.use(express.static('public'));
app.use(bodyParser.urlencoded({
    limit:"10mb",
    extended: true
}));
app.use(express.json());



// ----------------------------------------------
app.get('/app-version', function(req, res) {
    const { version } = require('./package.json');
    res.send({ version });
});


// ----------------------------------------------
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


// ----------------------------------------------
app.get('/book-versions', async function(req, res) {
    const { bookId } = req.query;
    const versions = await getVersionsByBookId(bookId || '');
    res.json({ versions });
});


// ----------------------------------------------
app.post('/review-local-book', async function(req, res) {
    str_util.clearConsole();
	console.log('review-local-book');

    var result = {};
    const vars = req.body.variables;
    const rules = parseBoolRules(req.body.rules);
    var iret = await reviewLocalBook(req.body.path_md, vars, rules, result);
    var msg;
    if(iret==0) {
        msg = 'review-local-book ok';
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
app.post('/review-remote-book', async function(req, res) {
    str_util.clearConsole();
	console.log('review-remote-book');
    log_util.init();

    var result = {};
    const vars = req.body.variables;
    const rules = parseBoolRules(req.body.rules);
    var iret = await reviewRemoteBook(req.body.bookId, req.body.verId, vars, rules, result);
    var msg;
    if(iret==0) {
        msg = 'review-remote-book ok';
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
app.post('/review-remote-books-all', async function(req, res) {
    str_util.clearConsole();
	console.log('review-remote-books-all');
    log_util.init();

    const { rules, filters } = req.body;
    var iret = await reviewRemoteBookAll(rules, filters);
    var msg;
    if(iret==0) {
        msg = 'review-remote-books-all ok';
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
app.post('/bind-book', async function(req, res) {
	console.log('bind-book');

    var result = {};
    const vars = req.body.variables;
    var iret = await bindBook(req.body.path_md, vars, result);
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


// --------------------------------------------------
///@param[in]   rulesRaw    form에서 파싱된 rules 객체 (값이 'true'/'false' 문자열). undefined 가능
///@return      { checkBrokenLinks, checkSpecialChars, replaceSpecialChars, checkProhibitedStrs }
///@brief       form string 'true'/'false' → boolean 변환. 키가 없으면 true로 기본 처리
// --------------------------------------------------
function parseBoolRules(rulesRaw)
{
    const keys = ['checkBrokenLinks', 'checkSpecialChars', 'replaceSpecialChars', 'checkProhibitedStrs'];
    const rules = {};
    for (const key of keys) {
        rules[key] = (rulesRaw?.[key] !== 'false');
    }
    return rules;
}


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


if (require.main === module) {
    app.listen(50000, function() {
        console.log('Server Running at http://127.0.0.1:50000');
    });
}

module.exports = app;
