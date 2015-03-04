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
var bIsScrollPage = true;
var startIndex = 0;
var title;

$(document).ready(function(){
	var picArea = $(".picArea");
	//trigger loading
	$(".dataDom").off("click").click( function(){
		picArea.html("");
		picArea.data("index", startIndex);
		picArea.data("cnt", list.length);
		picArea.css("width",(list.length*100)+"%");
		picArea.css("left", (-100*startIndex)+"%");

		if( null != title ){
			$(".title").html(title).show();
		} else {
			$(".title").hide();
		}
		if( startIndex <list.length && null!=list[startIndex] ){
			$(".subTitle").html(list[startIndex].text||"");
		} else {
			$(".subTitle").html("");
		}

		var width = 100.0/list.length;
		for( var i=0; i<list.length; i++ ){
			var img = $("<div class='img'><img style='height: 100%;'/></div>");
			img.css("width",width+"%");
			img.data("oriW",width);
			img.data("text",list[i].text);
			img.find("img").load( function() {
				$(this).data("w",this.naturalWidth);
				$(this).data("h",this.naturalHeight);
			});
			if( list[i].s32 ){
				var fileName = getS3FileNameWithExtension( list[i].s32, 6 );
				img.find("img").attr("src", list[i].s32 ).after('<a href="'+ list[i].s32 +'" download="'+fileName+'"><div></div></a>');
				// img.css("background-image", "url("+list[i].s32+")" );
			} else {
				getS3file( list[i],img.find("img"), 6 );
			}
			picArea.append( img );
		}

		if( list.length<=1 ){
			$(".cnt").hide();
			// $(".cnt .current").html( 1 );
			// $(".cnt .all").html( list.length );

			$(".rBtn").hide();
			$(".lBtn").hide();
			// picArea.addClass("singleImage");
		} else {
			$(".cnt").show();
			$(".cnt .current").html( startIndex+1 );
			$(".cnt .all").html( list.length );

			$(".rBtn").show();
			$(".lBtn").show();
			// picArea.removeClass("singleImage");
		}
		changeImgViewSize(0);
	});

	$(".rBtn").off("click").click( moveRight );
	$(".lBtn").off("click").click( moveLeft );

	$(".zoomIn").off("click").click( zoomIn );
	$(".zoomOut").off("click").click( zoomOut );

	picArea.bind("mousewheel", function(e) {
		if(!bIsScrollPage) return;

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
	try{
		if( null==list ) return;
	
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
		$(".subTitle").html(list[index].text||"");
		changeImgViewSize(0);
	} catch(e){
		errorReport(e);
	}
}
moveLeft = function( isMove ){
	try{
		if( null==list ) return;

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
		$(".subTitle").html(list[index].text||"");
		changeImgViewSize(0);
	} catch(e){
		errorReport(e);
	}
}

getS3file = function(file_obj,target,tp){
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
                    var fileName = getS3FileNameWithExtension( obj.s32, 6 );
                    // target.css("background-image","url("+obj.s32+")");
                    target.attr("src",obj.s32).after('<a href="'+ obj.s32 +'" download="'+fileName+'"><div></div></a>');
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

zoomIn = function(){
	var imgView = $(".picArea");
	var size = imgView.data("size");
	size = Math.min(5,size+1);
	changeImgViewSize( size );
}
zoomOut = function(){
	var imgView = $(".picArea");
	var size = imgView.data("size");
	size = Math.max(0,size-1);
	changeImgViewSize( size );
}
changeImgViewSize = function(size){
	var picArea = $(".picArea");
	var index = picArea.data("index");
	if( null==index || index<0 ) index = 0;
	cns.debug( ".img:nth-child("+ (index+1) +")" );
	var imgView = picArea.find(".img:eq("+ index +")");
	picArea.data("size",size);

	// cns.debug(size);

	var img = imgView.find("img");
	
	if( size>0 ){
		var w = img.data("w");
		var h = img.data("h");
		img.css("width", w*size+"px");
		img.css("height", h*size+"px");
		// if( w>h ){
			img.css("min-height", "99%");
		// } else {
		// 	img.css("min-width", "100%");
		// }
		imgView.css("overflow", "auto");
		// img.css("object-position", "left top");
		bIsScrollPage = false;
		$(".zoom .info").html(size+"x");
	} else {
		size = 1;
		img.css("min-width", "");
		img.css("min-height", "");
		img.css("width", size*100+"%");
		img.css("height", size*100+"%");
		img.css("object-position", "");
		imgView.css("overflow", "");
		bIsScrollPage = true;
		$(".zoom .info").html("auto");
	}
	// $(".picArea .align").css("height",(100*size)+"%");
}
// downloadImage = function(){
// 	var picArea = $(".picArea");
// 	var index = picArea.data("index");
// 	var imgView = picArea.find(".img:eq("+ index +")");

// 	var download_img = $('<a href="'+ imgView.find("img").attr("src") +'" download></a>');
// 	download_img.trigger("click");
// }