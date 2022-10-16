///@author	Hyundai Robototics. choi, won-hyuk (asoe72@hyundai-robotics.com)


///@brief		button-handler 연결
function initApplication() {

    $('#adjust-md').click(function(){
        const path_md = $("#path-md").val();
        adjustMd(path_md);
        this.blur();
	});

    $('#bind-book').click(function(){
        const path_md = $("#path-md").val();
        const toc_without_page = $("#toc-without-page").is(":checked");
        bindBook(path_md, toc_without_page);
        this.blur();
	});
	
	$('#print-book').click(function(){
        printBook();
        this.blur();
    });
}


///@brief	서버에 adjust-md 요청 송신
function adjustMd(path_md) {
    if(path_md.trim() == "") {
        alert('Please, set the source-path (.md files)');
        return;
    }
    $.ajax({
        url: '/adjust-md',
        type: 'post',
        data: {
            path_md: path_md
		},
        success: function(res) {
            if(res.data.code==0) {
                alert('adjust-md completed!');
            }
            else {
                alert(res.message);
            }
        }
    })
}


///@brief	서버에 bind-book 요청 송신
function bindBook(path_md, toc_without_page) {
    if(path_md.trim() == "") {
        alert('Please, set the source-path (.md files)');
        return;
    }

    $.ajax({
        url: '/bind-book',
        type: 'post',
        data: {
            path_md: path_md,
            toc_without_page: toc_without_page
		},
        success: function(res) {
            if(res.data.code==0) {
                alert('bind-book completed!');
            }
            else {
                alert(res.message);
            }
        }
    })
}


///@brief	서버에 print-book 요청 송신
function printBook() {
    var win = window.open('out/book.html', '_blank');
	win.focus();
}
