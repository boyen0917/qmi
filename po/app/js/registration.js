$(function(){

	//部分跳頁不需要記錄
	back_exception = false;
	//語言
	lang = "zh_TW";
	//api
	base_url = "https://mapserver.mitake.com.tw/apiv1/";
	//base_url = "http://10.1.17.116:8090/apiv1/";

	//讀取圖示開啓
	load_show = false;
	s_load_show = false;

	back_hash = false;


	$.ajaxSetup ({
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
		$(document).trigger("click");
	});
	
	$(document).ajaxError(function(e, jqxhr, ajaxSettings) {
		//logout~

		$('.ui-loader').hide();
		$(".ajax-screen-lock").hide();

		console.debug("jqxhr:",jqxhr);
		popupShowAdjust("",$.parseJSON(jqxhr.responseText).rsp_msg,true);
		if(back_hash){
			popupAfterChangePage(back_hash);	
		}
		
	});


/*

     ##        #######   ######   #### ##    ## 
     ##       ##     ## ##    ##   ##  ###   ## 
     ##       ##     ## ##         ##  ####  ## 
     ##       ##     ## ##   ####  ##  ## ## ## 
     ##       ##     ## ##    ##   ##  ##  #### 
     ##       ##     ## ##    ##   ##  ##   ### 
     ########  #######   ######   #### ##    ## 

*/     


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

	$(".register").click(function(){
		$.mobile.changePage("#page-register", {transition: "slide"});
	});

	$(".register-phone input").bind("input",function(){
		$(this).val($(this).val().replace(/[^-_0-9]/g,''));
		var this_register = $(this).parent();

		if($(this).val().length == 10 && $(this).val().substring(0,2) == "09"){
			this_register.find("img").show();
			$(".register-next").addClass("register-next-ready");
		}else{
			this_register.find("img").hide();
			$(".register-next").removeClass("register-next-ready");
		}

	});

	$(".register-next").click(function(){
		if($(this).hasClass("register-next-ready")){
			var desc = "我們將傳送驗證碼簡訊至此手機<br/>號碼 : ( +886 ) " + $(".register-phone input").val().substring(1);
			popupShowAdjust("確認手機號碼",desc,"fun+otpSend",true);	
		}else{
			return false;
		}
	});

	$(".register-otp-input input").bind("input",function(){
		$(this).val($(this).val().replace(/[^-_0-9]/g,''));

		if($(this).val().length > 0){
			$(this).addClass("register-otp-input-style");
			
		}else{
			$(this).removeClass("register-otp-input-style");
		}

		if($(this).val().length == 4){
			$(".register-otp-next").addClass("register-otp-next-ready");
		}else{
			$(".register-otp-next").removeClass("register-otp-next-ready");
		}
	});

	$(".register-otp-next").click(function(){
		if($(this).hasClass("register-otp-next-ready")){
			otpAuth();
			// var desc = "我們將傳送驗證碼簡訊至此手機號碼 : ( +886 ) " + $(".register-phone input").val().substring(1);
			// popupShowAdjust("確認手機號碼",desc,"otpSend",true);	
		}else{
			return false;
		}
	});

	//重送驗證碼
	$(".resend-otp").click(function(){
		if($(this).hasClass("resend-otp-ready")){
			otpSend(true);
		}
	});

	$(".password-setting input,.password-confirm input").bind("input",function(){
		if($(".password-setting input").val() && $(".password-confirm input").val() && $(".password-setting input").val().length == $(".password-confirm input").val().length){
			$(".password-next").addClass("password-next-ready");
		}else{
			$(".password-next").removeClass("password-next-ready");
		}
	});

	//密碼設定
	$(".password-next").click(function(){
		if(!$(this).hasClass("password-next-ready")) return false;
		
		if($(".password-setting input").val() != $(".password-confirm input").val()){
			popupShowAdjust("","確認密碼輸入錯誤",true);
		}else{
			passwordSend();
		}

	});


	//資料設定

	//初始化 datetimepicker
	$("input.setting-birth-hidden").datetimepicker({
        maxDate:'+1970/01/02',
        value:'631152012',
        timepicker:false,
        format:'unixtime',
        onChangeDateTime: function() {
        	var unixtime = $("input.setting-birth-hidden").val();
        	var time = new Date($("input.setting-birth-hidden").val()*1000);
			var time_format = time.customFormat( "#YYYY# 年 #M# 月 #D# 日" );
        	$(".setting-birth input").val(time_format);
        }
    });

    $(".setting-birth").click(function(){
    	$("input.setting-birth-hidden").datetimepicker("show");
    });

    $(".avatar-area").click(function(){
    	$(".avatar-file").trigger("click");
    });

    $(".avatar-file").change(function(e) {
    	var imageType = /image.*/;
    	var file = $(this)[0].files[0];
    	console.debug("this:",$(this));
    	console.debug("file:",file);
    	if (file.type.match(imageType)) {

			var reader = new FileReader();
			reader.onload = function(e) {
				var img = $(".avatar-area img");
				$(".avatar-area img").removeClass("avatar-default");

				//調整長寬
				img.load(function() {
					var w = img.width();
		            var h = img.height();
    				mathAvatarPos(img,w,h,110);
		        });

		        img.attr("src",reader.result);
			}

			reader.readAsDataURL(file);	
		}else{
			this_grid.find("div").html('<span>file not supported</span>');
		}
    });



    $(".setting-next").click(function(){
    	console.debug($("input.setting-birth-hidden").val());
    });









// ---------------- tool action --------------------------------------------------------------------------


	$(".ajax-screen-lock").click(function(e){
	    e.stopPropagation();
	});
	


	otpSend = function(resend){
		if(!resend){
			// $(document).data("device-token",deviceTokenMake());
			$(document).data("device-token","web-5566");
			$(document).data("phone-id","+886" + $(".register-phone input").val().substring(1));	
		}
		
        var api_name = "registration";
        var headers = {
                 "li":lang,
                     };
        var method = "post";
        var body = {
                id: $(document).data("phone-id"),
                tp: 0,
                ud: $(document).data("device-token")
            }
            console.debug("otp send body:",JSON.stringify(body,null,2));
        var result = ajaxDo(api_name,headers,method,true,body);
        result.complete(function(data){
        	console.debug("send otp data:",data);
        	if(resend){
        		popupShowAdjust("","驗證碼已重新送出");
        		setTimeout(function(){
        			$(".popup-screen").trigger("click");
        		},1000);
			}else{
				$(".register-otp-desc-area div").html($(document).data("phone-id"));
				//default
				$(".resend-otp").removeClass("resend-otp-ready");
				$.mobile.changePage("#page-register-otp");
			}
        });
	}

	otpAuth = function(){
		var api_name = "activation/step1";
        var headers = {
                 "li":lang,
                     };
        var method = "put";
        var body = {
                id: $(document).data("phone-id"),
                tp: 0,
                vc: $(".register-otp-input input").val(),
                ud: $(document).data("device-token")
            }
            console.debug("auth body:",JSON.stringify(body,null,2));
        var result = ajaxDo(api_name,headers,method,true,body);
        result.complete(function(data){
        	if(data.status == 200){
        		popupShowAdjust("",$.parseJSON(data.responseText).rsp_msg,"hash+#page-password");
        	}else{
        		$(".register-otp-input input").val("");
        		$(".register-otp-input input").trigger("input");
        		$(".resend-otp").addClass("resend-otp-ready");
        	}
        });
	}

	passwordSend = function(){

		var api_name = "activation/step2";
        var headers = {
                 "li":lang,
                     };
        var method = "put";
        var body = {
                id: $(document).data("phone-id"),
                tp: 0,
                ud: $(document).data("device-token"),
                pw: toSha1Encode($(".password-confirm input").val())
            }
            console.debug("password body:",JSON.stringify(body,null,2));
        var result = ajaxDo(api_name,headers,method,true,body);
        result.complete(function(data){
        	if(data.status == 200){
        		//default
        		$(".avatar-area img").addClass("avatar-default");
        		popupShowAdjust("",$.parseJSON(data.responseText).rsp_msg,"#page-user-setting");
        	}else{
        		$(".password-setting").val("");
        		$(".password-confirm").val("");
        		$(".register-otp-input input").trigger("input");
        	}
        });
	}


	avatarToS3 = function(){
		var api_name = "me/avatar";

        var headers = {
                 "ui":$(document).data("ui"),
                 "at":$(document).data("at"), 
                 "li":lang,
                     };
        var method = "put";
        var result = ajaxDo(api_name,headers,method,false);
        result.complete(function(data){
        	var d =$.parseJSON(data.responseText);
        	if(d.rsp_code == 0){

        		var fi = d.fi;
        		var ou = d.ou;
        		var tu = d.tu;

        		//先大圖
        		$.ajax({
					url: ou,
					type: 'PUT',
					contentType: " ",
				 	data: file, 
					processData: false,
					complete: function(data) { 

						//大圖上傳s3成功或失敗
						if(data.status == 200){
							//再小圖
			        		$.ajax({
								url: tu,
								type: 'PUT',
								contentType: " ",
							 	data: file, 
								processData: false,
								complete: function(data) { 

									//上傳s3成功或失敗
									if(data.status == 200){
										var api_name = "me/avatar/commit";
					                    var headers = {
					                        "ui":$(document).data("ui"),
							                "at":$(document).data("at"), 
							                "li":lang,
					                    };
					                    var method = "put";

					                    var body = {
					                      "fi": fi,
					                      "si": "1234123"
					                    }
					                    var result = ajaxDo(api_name,headers,method,true,body);
					                    result.complete(function(data){

					                    	//commit 成功或失敗
					                    	if(data.status != 200){
					                    		this_compose.data("uploaded-err").push(i+1);
					                    	}else{
					                    		var img_arr = [fi,permission_id,file.name];

					                    		this_compose.data("img-compose-arr")[i] = img_arr;
					                    	}
				                    	});
									}else{
										// 小圖上傳 錯誤
										var error = true;
									}

								}
							});
						}else{
							// 大圖上傳 錯誤
							var error = true;
						}
					}
				});

        	}else{
        		// me/avatar 錯誤
        		var error = true;
        	}

        });
				
	}




// tool function ----------------------------------------------------------------------
	
	mathAvatarPos = function (img,w,h,x,limit){
		//設最大值 若小於此值 就用原尺寸
		if(limit){
			w < limit ? x = w : x = limit ;
		}
		
        if(w == 0 || h == 0) return false;
        
        img.removeAttr( 'style' );
        img.removeAttr( 'width' );
        img.removeAttr( 'height' );

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

	deviceTokenMake = function(){
		var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
        var string_length = 8;
        var randomstring = '';
        for (var i=0; i<string_length; i++) {
            var rnum = Math.floor(Math.random() * chars.length);
            randomstring += chars.substring(rnum,rnum+1);
        }
		return "web-" + randomstring;
	}


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



    $(".popup-confirm").click(function(){
    	var todo = $(".popup-confirm").data("todo");

    	if(typeof todo == "string"){
    		var todo_type = todo.split("+")[0];
    		var todo_act = todo.split("+")[1];

   //  		console.debug("todo_type:",todo_type);
			// console.debug("todo_act:",todo_act);

			if(todo_type == "fun"){
		    	switch(todo_act){
					case "otpSend":
						otpSend();
						break;
					case "passwordSend":
						passwordSend();
						break;
				}
	    	}else if(todo_type == "hash"){
	    		$.mobile.changePage(todo_act);
	    	}
    	}
		$(".popup-screen").trigger("click");
	});

	$(".popup-cancel").click(function(){
    	var todo = $(".popup-cancel").data("todo");

    	if(typeof todo == "string"){
    		var todo_type = todo.split("+")[0];
    		var todo_act = todo.split("+")[1];
			if(todo_type == "fun"){

	    	}else if(todo_type == "hash"){
	    		$.mobile.changePage(todo_act);
	    	}
    	}
		$(".popup-screen").trigger("click");
	});


	$(".popup-screen").click(function(){
	    $(".popup").hide();
	    $(".popup-screen").hide();
	});




    //對話框設定
	popupShowAdjust = function (title,desc,confirm,cancel){
		console.debug("title:",title);
		console.debug("desc:",desc);
		console.debug("confirm:",confirm);
		console.debug("cancel:",cancel);
		console.debug("=======================");

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
	
	//sha1 and base64 encode
	toSha1Encode = function (string){
		var hash = CryptoJS.SHA1(string);
	    var toBase64 = hash.toString(CryptoJS.enc.Base64);
	    return toBase64;
	}



})