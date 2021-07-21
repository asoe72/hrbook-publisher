const path = require('path');
var express = require('express');
var bodyParser = require('body-parser');

const md2html = require("./src/md2html");
const bookbind = require("./src/bookbind");

var app = express();

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ 
    limit:"10mb",
    extended: false 
}));


app.post('/bind-book', function(req, res) {
	console.log('bind-book');

    //work.saveFileToWork(req.body.form, req.body.fname, req.body.content);
    bindBook();

    res.send({
        message: 'bind-book ok',
        data: {}
    })
});


// ----------------------------------------------
const path_parent = "D:/git_repo/";
const folder_name = "doc-hrscript";

const path_md = path.join(path_parent, folder_name);
const path_html = 'public/out/';
const pathfile_toc = path.join(path_md, "SUMMARY.md");
const pathfile_bookinfo = path.join(path_md, "bookinfo.json");


function bindBook()
{
    md2html.convDir(path_md, path_html);
    bookbind.bind(path_html, path_html, pathfile_toc, pathfile_bookinfo);
}


app.listen(50000, function() {
    console.log('Server Running at http://127.0.0.1:50000');
});
