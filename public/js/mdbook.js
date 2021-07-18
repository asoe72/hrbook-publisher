///@author	Hyundai Robototics Co., Ltd. choi, won-hyuk (asoe72@hyundai-robotics.com)


///@brief		button-handler 연결
function initMdBook() {

    $('#bind-book').click(function(){
        bindBook();
        this.blur();
	});
	
	$('#print-book').click(function(){
        printBook();
        this.blur();
    });
}


///@brief	서버에 bind-book 요청 송신
function bindBook() {
    $.ajax({
        url: '/bind-book',
        type: 'post',
        data: {
		},
        success: function(data) {
            alert('bind-book completed!');
        }
    })
}


///@brief	서버에 print-book 요청 송신
function printBook() {
    var win = window.open('out/book.html', '_blank');
	win.focus();
}
