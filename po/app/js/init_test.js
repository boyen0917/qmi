$(function(){

	// registration

	$.ajaxSetup ({
		timeout: 15000,
	    // Disable caching of AJAX responses
	    cache: false
	});
	
	$(document).ajaxSend(function() {

		// console.log("ajax send! count : " + ajax_count);
		// ajax_count++;
		//顯示 loading
		if(!load_show && !s_load_show) return false;
	    if(!$('.ui-loader').is(":visible"))
		$('.ui-loader').css("display","block");
		$(".ajax-screen-lock").show();
	});
	$(document).ajaxComplete(function(data) {
		//特別的
		if(s_load_show) return false;

		$('.ui-loader').hide();
		$(".ajax-screen-lock").hide();
		// $(document).trigger("click");
	});
	
	$(document).ajaxError(function(e, jqxhr, ajaxSettings) {

		$('.ui-loader').hide();
		$(".ajax-screen-lock").hide();
		

		//ajax逾時
		if(jqxhr.statusText == "timeout"){
			console.debug("error timeout");
			popupShowAdjust("","網路不穩 請稍後再試",true);
			return false;
		}
		console.debug("error jqxhr:",jqxhr);
		//logout~暫時不做

		// popupShowAdjust("",$.parseJSON(jqxhr.responseText).rsp_msg,true);
		popupShowAdjust("",errorResponse(jqxhr),true);

	});

	$("#page-registration").css("height",$(window).height());
	$(window).resize(function(){ 
		$("#page-registration").css("height",$(window).height());
	});

	//上一頁功能
	$(document).data("page-history",[["#page-registration"]]);
	$(document).on("pagebeforeshow",function(event,ui){
		var hash = window.location.hash;

		//部分跳頁及上一頁按鈕不需要記錄歷程
		if(back_exception){
			back_exception = false;
			return false;
		}

		var page_title = $(hash + " .page-title").html();
		var page_arr = [hash,page_title];

		$(document).data("page-history").push(page_arr);
	});
	
	$(".page-back").click(function(){
		//按上一頁不需要記錄歷程
		back_exception = true;
		var t= $(document).data("page-history");

		$(document).data("page-history").pop();
		$.mobile.changePage($(document).data("page-history").last()[0], {transition: "slide",reverse: true});
		//console.debug("last:",$(document).data("page-history").last()[0]);
	});


	//對話框設定
    $(".popup-confirm").click(function(){
    	var todo = $(".popup-confirm").data("todo");

    	if(typeof todo == "string"){
    		var todo_type = todo.split("+")[0];
    		var todo_act = todo.split("+")[1];

   //  		console.debug("todo_type:",todo_type);
			// console.debug("todo_act:",todo_act);

			if(todo_type == "func"){
		    	switch(todo_act){
					case "registration":
						registration();
						break;
					case "toGroupMenu":
						toGroupMenu();
						break;
				}
	    	}else if(todo_type == "hash"){
	    		$.mobile.changePage(todo_act);
	    	}
    	}
		$(".popup-screen").trigger("close");
	});

	$(".popup-cancel").click(function(){
    	var todo = $(".popup-cancel").data("todo");

    	if(typeof todo == "string"){
    		var todo_type = todo.split("+")[0];
    		var todo_act = todo.split("+")[1];
			if(todo_type == "func"){

	    	}else if(todo_type == "hash"){
	    		$.mobile.changePage(todo_act);
	    	}
    	}
		$(".popup-screen").trigger("close");
	});


	$(".popup-screen").bind("close",function(){
	    $(".popup").hide();
	    $(".popup-screen").hide();
	});


// ========================================================================


//ajax
    ajaxDo = function(api_name,headers,method,load_show_chk,body){
        //設定是否顯示 loading 圖示
        load_show = load_show_chk;

        //console.log(api_url);
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
    

//對話框設定
	popupShowAdjust = function (title,desc,confirm,cancel){

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
	    	$(".popup-confirm").data("todo","");
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
	    		$(".popup-cancel").data("todo",cancel);
	    	}
	    }else{
	    	$(".popup-cancel").hide();
	    	$('.popup-confirm').addClass("full-width");
	    }


	    if(!confirm && !cancel){
	    	setTimeout(function(){
    			$(".popup-screen").trigger("close");
    		},2000);
	    }

	    $(".popup-screen").show();
	    $(".popup").show();

	    $(".popup-frame").css("margin-left",0);
	    $(".popup-frame").css("margin-left",($(document).width() - $(".popup-frame").width())/2);
	    
	}
	
	popupAfterChangePage = function (dest){
		$(".popup-close").bind("pageChange",function(){
			$.mobile.changePage(dest);
			$(".popup-close").unbind("pageChange");
		});
	}

	errorResponse = function(data){
		if(data.responseText){
			return $.parseJSON(data.responseText).rsp_msg;
		}else{
			console.debug("errorResponse:",data);
			return "網路連線不穩 請稍後再試";
		}
	}
	
	//sha1 and base64 encode
	toSha1Encode = function (string){
		var hash = CryptoJS.SHA1(string);
	    var toBase64 = hash.toString(CryptoJS.enc.Base64);
	    return toBase64;
	}


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
			w: tempW,
			h: tempH,
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

});