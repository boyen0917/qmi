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

		var width = 100.0/list.length;
		for( var i=0; i<list.length; i++ ){
			var img = $("<div class='img' width='100%'></div>");
			img.css("width",width+"%");
			if( list[i].s3 ){
				img.css("background-image", "url("+list[i].s3+")" );
				var tt = img.css("background-image");
			} else {
				getS3fileBackground( list[i],img, 6 );
			}
			picArea.append( img );
		}

		$(".cnt .current").html( 1 );
		$(".cnt .all").html( list.length );
	});

	$(".rBtn").off("click").click( function(){
		// cns.debug("------- R ---------");
		scrollPercent = 0;
		scrollVal = 0;
		var index = picArea.data("index");
		index++;
		if( index>=list.length ){
			index = 0;
		}
		picArea.css("left", (-100*index)+"%");
		picArea.data("index", index);
		$(".cnt .current").html( index+1 );
	});

	$(".lBtn").off("click").click( function(){
		// cns.debug("------- L ---------");
		scrollPercent = 0;
		scrollVal = 0;
		if( list.length<=1 ) return;
		var index = picArea.data("index");
		index--;
		if( index<0 ){
			index = list.length-1;
		}
		picArea.css("left", (-100*index)+"%");
		picArea.data("index", index);
		$(".cnt .current").html( index+1 );
	});

	picArea.bind("mousewheel", function(e) {
		isCheckPosi = true;
		var data = e.originalEvent;
		// cns.debug(data.wheelDelta, data.wheelDeltaX, scrollVal);

		var index = $(this).data("index");
		var left = -100*index;
		if( data.wheelDeltaX!=0 ){
			// scrollVal += data.wheelDeltaX;
			// scrollPercent = scrollVal/200.0;
			// // scrollPercent = data.wheelDeltaX/60;
			// left += scrollPercent*100;

			// if( scrollPercent>=0.8 )	$(".lBtn").trigger( "click" );
			// else if( scrollPercent<=-0.8 )	$(".rBtn").trigger( "click" );
			// checkTime = new Date().getTime()+1000;
		}
		else{
			scrollVal += data.wheelDelta;
			scrollPercent = scrollVal/120;
			left += scrollPercent*5;
			if( scrollPercent>=1 ){
				var time = new Date().getTime();
				if( time>=nextScrollTime ){
					nextScrollTime = time+200;
					$(".lBtn").trigger( "click" );
				}
			} else if( scrollPercent<=-1 ) {
				var time = new Date().getTime();
				if( time>=nextScrollTime ){
					nextScrollTime = time+200;
					$(".rBtn").trigger( "click" );
				}
			}
			checkTime = new Date().getTime()+300;
		}
		$(this).css("left", left+"%");
		return false;
	});

	setInterval( function(){
		if( isCheckPosi && (new Date().getTime())>=checkTime){
			scrollPercent = 0;
			var index = picArea.data("index");
			isCheckPosi = false;
			picArea.css("left", (-100*index)+"%");
		}
	}, 100);
});

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
                    target.css("background-image","url("+obj.s3+")");
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