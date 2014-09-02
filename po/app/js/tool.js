$(function(){

	//ajax
	ajaxDo = function (api_name,headers,method,load_show_chk,body){
		//設定是否顯示 loading 圖示
		load_show = load_show_chk;
		
	    //cns.debug(api_url);
	    var api_url = base_url + api_name;
	    var myRand = Math.floor((Math.random()*1000)+1);

	    if(body){
	        body = JSON.stringify(body);
	    }
	    
	    var result = $.ajax ({
            url: api_url,
            type: method,
            headers:headers,
            data:body
        });
	    
	    return result;
	}
	 

	reLogin = function() {
		document.location = "index.html";
	}

	//縮圖
	imgResizeByCanvas = function(img,x,y,max_w,max_h,quality){
		var MAX_WIDTH = max_w;
		var MAX_HEIGHT = max_h;
		var tempW = img.width;
		var tempH = img.height;
		if (tempW > tempH) {
			if (tempW > MAX_WIDTH) {
				tempH *= MAX_WIDTH / tempW;
				tempW = MAX_WIDTH;
			}
		} else {
			if (tempH > MAX_HEIGHT) {
				tempW *= MAX_HEIGHT / tempH;
				tempH = MAX_HEIGHT;
			}
		}

		var canvas = document.createElement('canvas');
		canvas.width = tempW;
		canvas.height = tempH;
		var ctx = canvas.getContext("2d");
		ctx.drawImage(img, x, y, tempW, tempH);
		var dataURL = canvas.toDataURL("image/jpeg",quality);
		var img_obj = {
			w: Math.floor(tempW),
			h: Math.floor(tempH),
			blob: dataURItoBlob(dataURL)
		}
		return img_obj;
	}

	dataURItoBlob = function(dataURI) {
        var binary = atob(dataURI.split(',')[1]);
        var array = [];
        for(var i = 0; i < binary.length; i++) {
            array.push(binary.charCodeAt(i));
        }
        return new Blob([new Uint8Array(array)], {type: 'image/jpeg'});
    }


	//調整個人頭像
	avatarPos = function (img,x){
		img.load(function() {
            var w = img.width();
            var h = img.height();
	        if(!x){
	        	x = avatar_size;
	        }
            mathAvatarPos(img,w,h,x);
        });
	}
	
	mathAvatarPos = function (img,w,h,x,limit){
		//設最大值 若小於此值 就用原尺寸
		if(limit){
			w < limit ? x = w : x = limit ;
		}
		
        if(w == 0 || h == 0) return false;
        
        
        img.removeAttr( 'style' );

        if(w <= h){
        	img.attr("width",x);
            var p = ((h/(w/x))-x)/2*(-1);
            img.css("margin-top",p +"px");
        }else{
        	img.attr("height",x);
        	var p = ((w/(h/x))-x)/2*(-1);
        	img.css("margin-left",p +"px");
        }
	}

	//sha1 and base64 encode
	toSha1Encode = function (string){
		var hash = CryptoJS.SHA1(string);
	    var toBase64 = hash.toString(CryptoJS.enc.Base64);
	    return toBase64;
	}

	htmlFormat = function (str){
        str = str.replace(/\n/g," \n ").split(" ");
        $.each(str,function(i,val){
            if(val.substring(0, 7) == 'http://' || val.substring(0, 8) == 'https://'){
                encode_val = "<a href=\"" + encodeHtmlEntity(val) + "\" target=\"_blank\">" + encodeHtmlEntity(val) + "</a>";
            }else{
                encode_val = encodeHtmlEntity(val);
            }
            if(encode_val) str.splice(i,1,encode_val);
        });

        return str.join(" ");

    }

    //轉換html符號
	encodeHtmlEntity = function(str) {
        if(!str) return false;

        var escape_list = {"10":"<br/>"};
        var buf = [];
        for (var i=str.length-1;i>=0;i--) {
            var char_code = str[i].charCodeAt();
            if(escape_list[char_code]){
                buf.unshift(escape_list[char_code]);
            }else{
                buf.unshift(['&#', char_code, ';'].join(''));
            }
         }
      return buf.join('');
    };

    //秒數轉成時分秒
	secondsToTime = function (secs)
	{
	    var s_hours = Math.floor(secs / (60 * 60));
	
	    var divisor_for_minutes = secs % (60 * 60);
	    var s_minutes = Math.floor(divisor_for_minutes / 60);
	
	    var divisor_for_seconds = divisor_for_minutes % 60;
	    var s_seconds = Math.ceil(divisor_for_seconds);
	    return s_minutes + ":" + ((s_seconds < 10)?("0" + s_seconds):(s_seconds));
	}

    toastShow = function(desc){
		$(".toast div").html(desc);
		setTimeout(function(){
			$(".toast").show();
			$(".toast").animate({
				bottom: "30px",
				opacity: "1.0"
			},100);
		},100);
		
		setTimeout(function(){
			$(".toast").fadeOut('fast', function(){
				$(this).css("bottom","0px");
				$(this).css("opacity","0");
			});
		},4000);
	}

	//對話框設定
    $(".popup-confirm").click(function(){
    	if($(".popup").data("callback")){
    		var func = $(".popup").data("callback")[0];
    		var arguments = $(".popup").data("callback")[1];
			func(arguments);
    	}
		$(".popup-screen").trigger("close");
	});

	$(".popup-cancel").click(function(){
		$(".popup-screen").trigger("close");
	});


	$(".popup-screen").bind("close",function(){
		
	    $(".popup").fadeOut("fast",function(){
	    	$(".popup-screen").hide();	
	    });
	    //ajax也關
	    $('.ui-loader').hide();
		$(".ajax-screen-lock").hide();

	    $("body").removeClass("screen-lock");
	});

	//對話框設定
	popupShowAdjust = function (title,desc,confirm,cancel,callback){
		// cns.debug("========彈跳視窗========");
		// cns.debug("title:",title);
		// cns.debug("desc:",desc);
		// cns.debug("confirm:",confirm);
		// cns.debug("cancel:",cancel);
		// cns.debug("=======================");

		$("body").addClass("screen-lock");

		//default
		$(".popup-confirm").html("確認");
		$(".popup-cancel").html("取消");

		if(title){
			$('.popup-title').html(title);
		}else{
			$('.popup-title').html("");
		}
	    if(desc){
	    	$('.popup-text').show();
	        $('.popup-text').html(desc);
	    }else{
	    	$('.popup-text').hide();
	    }
	    if(confirm){
	    	$(".popup-confirm").show();
	    	$('.popup-cancel').removeClass("full-width");

	    	if(typeof confirm == "string"){
	    		if(confirm.split("+")[2]){
	    			$(".popup-confirm").html(confirm.split("+")[2]);
	    		}
	    		$(".popup-confirm").data("todo",confirm);
	    	}
	    }else{
	    	$(".popup-confirm").hide();
	    	$('.popup-cancel').addClass("full-width");
	    	
	    }
	    if(cancel){
	    	$(".popup-cancel").show();
	    	$('.popup-confirm').removeClass("full-width");
	    	if(typeof cancel == "string"){
	    		if(cancel.split("+")[2]){
	    			$(".popup-cancel").html(cancel.split("+")[2]);
	    		}
	    		$(".popup-confirm").data("todo",confirm);
	    	}
	    }else{
	    	$(".popup-cancel").hide();
	    	$('.popup-confirm').addClass("full-width");
	    }

	    if(callback) $(".popup").data("callback",callback);


	    if(!confirm && !cancel){
	    	setTimeout(function(){
    			$(".popup-screen").trigger("close");
    			$("body").removeClass("screen-lock");
    		},2000);
	    }

	    $(".popup-screen").show();
	    $(".popup").show();

	    $(".popup-frame").css("margin-left",0);
	    $(".popup-frame").css("margin-left",($(document).width() - $(".popup-frame").width())/2);
	    
	}

	changePageAfterPopUp = function(page){
		$.mobile.changePage(page);
	}

});