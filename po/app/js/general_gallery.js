var this_ei;
var this_gi;
var this_ti;
var ui;
var at;
var lang;
var list;
var scrollVal = 0;
var scrollPercent = 0;
var isCheckPosi = false;
var checkTime = 0;
var nextScrollTime = 0;

$(document).ready(function(){
	var picArea = $(".picArea");
	$(".dataDom").off("click").click( function(){
		picArea.html("");
		picArea.data("index", 0);
		picArea.data("cnt", list.length);
		picArea.css("width",(list.length*100)+"%");
		picArea.css("left", "0%");

		var width = 100.0/list.length;
		for( var i=0; i<list.length; i++ ){
			var img = $("<div class='img' width='100%'></div>");
			img.css("width",width+"%");
			if( list[i].s32 ){
				img.css("background-image", "url("+list[i].s32+")" );
				var tt = img.css("background-image");
			} else {
				getS3fileBackground( list[i],img, 6 );
			}
			picArea.append( img );
		}

		$(".cnt .current").html( 1 );
		$(".cnt .all").html( list.length );
	});

	$(".rBtn").off("click").click( moveRight );
	$(".lBtn").off("click").click( moveLeft );

	picArea.bind("mousewheel", function(e) {
		var cnt = $(this).data("cnt");
		if( cnt<=1 ) return;
		isCheckPosi = true;
		var data = e.originalEvent;

		var index = $(this).data("index");
		var maxIndex = cnt-1;
		var left = 0;
		var time = new Date().getTime();
		if( time< nextScrollTime ) return;

		if( data.wheelDeltaX!=0 ){
			cns.debug(data.wheelDeltaX, scrollVal, scrollPercent*100);
			scrollVal += data.wheelDeltaX;
			scrollPercent = scrollVal/100;
			left += scrollPercent*100;
			checkTime = new Date().getTime()+500;
		}
		else{
			scrollVal += data.wheelDelta;
			scrollPercent = scrollVal/120;
			left += scrollPercent*100;
			checkTime = new Date().getTime()+300;
		}
		if( (left>0&&0==index) || (left<0&&maxIndex==index) ){
			left=-100*index+left*0.1;

			if( scrollPercent>=1 ){
				moveLeft(false);
				nextScrollTime = time+600;
			} else if( scrollPercent<=-1 ) {
				moveRight(false);
				nextScrollTime = time+600;
			}
		}
		else{
			left=-100*index+left;

			if( scrollPercent>=1 ){
				moveLeft(false);
			} else if( scrollPercent<=-1 ) {
				moveRight(false);
			}
		}

		$(this).css("left", left+"%");
		return false;
	});

	setInterval( function(){
		if( isCheckPosi && (new Date().getTime())>checkTime){
			scrollPercent = 0;
			var index = picArea.data("index");
			isCheckPosi = false;
			picArea.css("left", (-100*index)+"%");
		}
	}, 100);
});

moveRight = function( isMove ){
	var picArea = $(".picArea");
	// cns.debug("------- R ---------");
	scrollPercent = 0;
	scrollVal = 0;
	var index = picArea.data("index");
	index++;
	if( index>=list.length ){
		index = 0;
	}
	if( false!=isMove ) picArea.css("left", (-100*index)+"%");
	picArea.data("index", index);
	$(".cnt .current").html( index+1 );
}
moveLeft = function( isMove ){
	var picArea = $(".picArea");
	// cns.debug("------- L ---------");
	scrollPercent = 0;
	scrollVal = 0;
	if( list.length<=1 ) return;
	var index = picArea.data("index");
	index--;
	if( index<0 ){
		index = list.length-1;
	}
	if( false!=isMove ) picArea.css("left", (-100*index)+"%");
	picArea.data("index", index);
	$(".cnt .current").html( index+1 );
}

getS3fileBackground = function(file_obj,target,tp){
    //default
    var api_name = "groups/" + this_gi + "/files/" + file_obj.c + "?pi=" + file_obj.p + "&ti=" + this_ti;
    var headers = {
             "ui":ui,
             "at":at, 
             "li":lang,
        };
    var method = "get";
    var result = ajaxDo(api_name,headers,method,false);
    result.complete(function(data){
        if(data.status != 200) return false;

        var obj =$.parseJSON(data.responseText);
        obj.api_name = api_name;
        if(target && tp){
            switch(tp){
                case 6://圖片
                    //小圖
                    target.css("background-image","url("+obj.s32+")");
                    //大圖
                    target.data("auo",obj.s32);
                    break;
                case 8://聲音
                    target.attr("src",obj.s3);
                    break;
            }
        }else{
            return obj.s3;
        }
    });
}