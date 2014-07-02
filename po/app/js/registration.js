$(function(){

	//部分跳頁不需要記錄
	back_exception = false;
	//國碼
	countrycode = "+886";

	//語言
	lang = "zh_TW";

	//api
	//base_url = "https://mapserver.mitake.com.tw/apiv1/";
	base_url = "https://apserver.mitake.com.tw/apiv1/";
	//base_url = "http://10.1.17.116:8090/apiv1/";

	//讀取圖示開啓
	load_show = false;
	s_load_show = false;

	back_hash = false;

	//縮圖寬高
	max_w = 500;
	max_h = 500;
	quality = 0.5;





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

	$(".login").click(function(){
		//若local storage 有記錄密碼 就顯示
		console.debug($.lStorage("_loginRemeber"));
		if($.lStorage("_loginRemeber")){

			//順便幫他打個勾
			$(".login-remeber img").attr("src","images/common/icon/icon_check_gray_check.png");
			$(".login-remeber").data("chk",true);
			$(".login-remeber-area").show();
			$(".login-default-area").hide();
			$(".login-change").show();

			$(".login-next").addClass("login-next-adjust");

			//填入帳號
			$(".login-account span:eq(1)").html("(" + $.lStorage("_loginRemeber").countrycode + ")" + $.lStorage("_loginRemeber").phone.substring(1));

		}else{
			$(".login-remeber img").attr("src","images/common/icon/icon_check_gray.png");
			$(".login-remeber").data("chk",false);
			$(".login-remeber-area").hide();
			$(".login-default-area").show();
			$(".login-change").hide();
			$(".login-next").removeClass("login-next-adjust");
		}

		$.mobile.changePage("#page-login", {transition: "slide"});
	});

	$(".register").click(function(){
		$.mobile.changePage("#page-register", {transition: "slide"});
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
	

	$(".login-phone input, .login-password input").bind("input",function(){
		//限制輸入數字
		if($(this).parent().hasClass("login-phone")){
			$(this).val($(this).val().replace(/[^-_0-9]/g,''));	
		}
		//電話號碼10碼 開頭為09 密碼大於等於6
		if($(".login-password input").val().length >= 6 && $(".login-phone input").val().length == 10 && $(".login-phone input").val().substring(0,2) == "09"){
			$(".login-next").addClass("login-next-ready");
		}else{
			$(".login-next").removeClass("login-next-ready");
		}
	});

	$(".login-remeber-password input").bind("input",function(){
		if($(this).val().length >= 6){
			$(".login-next").addClass("login-next-ready");
		}else{
			$(".login-next").removeClass("login-next-ready");
		}
	});

	$(".login-remeber").click(function(){
		var remeber_chk = $(this).data("chk");
		if(remeber_chk){
			$(this).find("img").attr("src","images/common/icon/icon_check_gray.png");
			remeber_chk = false;
		}else{
			$(this).find("img").attr("src","images/common/icon/icon_check_gray_check.png");
			remeber_chk = true;
		}

		$(this).data("chk",remeber_chk);
	});

	$(".login-change").click(function(){
		$(".login-change").data("chk",true);

		$("body").fadeOut();
		setTimeout(function(){
			$("body").fadeIn();
		},100);
		setTimeout(function(){
			$(".login-remeber img").attr("src","images/common/icon/icon_check_gray.png");
			$(".login-remeber").data("chk",false);
			$(".login-remeber-area").hide();
			$(".login-default-area").show();
			$(".login-change").hide();
			$(".login-next").removeClass("login-next-adjust");
		},400);
	});


	$(document).on("click",".login-next-ready",function(){

		if($.lStorage("_loginRemeber") && !$(".login-change").data("chk")){
			var phone_id = $.lStorage("_loginRemeber").phone;
			var password = $(".login-remeber-password input").val();
		}else{
			var phone_id = $(".login-phone input").val();
			var password = $(".login-password input").val();
		}

		//登入
		login(phone_id,password,countrycode);
	});



	login = function(phone_id,password,countrycode){
		var api_name = "login";
        var headers = {
            li:lang
        };
        var body = {
            id: countrycode + phone_id.substring(1),
            tp:"0",
            pw:toSha1Encode(password)
        };

        var method = "post";
        var result = ajaxDo(api_name,headers,method,true,body);
        result.complete(function(data){
        	var result = $.parseJSON(data.responseText);
        	if(data.status == 200){

        		//登入成功 記錄帳號密碼
        		if($(".login-remeber").data("chk")){
					var _loginRemeber = {};
		    		_loginRemeber.phone = phone_id;
		    		_loginRemeber.password = password;
		    		_loginRemeber.countrycode = countrycode;
		    		$.lStorage("_loginRemeber",_loginRemeber);

		    	}else{
		    		//沒打勾的話就清除local storage
		    		localStorage.removeItem("_loginRemeber");
				}

				//儲存登入資料 跳轉到timeline
				result.page = "timeline";
        		$.lStorage("_loginData",result);
        		document.location = "main.html#page-group-main";

        	}
        });
	}
/*	


	########  ########  ######   ####  ######  ######## ######## ########  
	##     ## ##       ##    ##   ##  ##    ##    ##    ##       ##     ## 
	##     ## ##       ##         ##  ##          ##    ##       ##     ## 
	########  ######   ##   ####  ##   ######     ##    ######   ########  
	##   ##   ##       ##    ##   ##        ##    ##    ##       ##   ##   
	##    ##  ##       ##    ##   ##  ##    ##    ##    ##       ##    ##  
	##     ## ########  ######   ####  ######     ##    ######## ##     ## 
	

*/	



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
			console.debug("傳送驗證碼 還沒按確定");
			var desc = "我們將傳送驗證碼簡訊至此手機<br/>號碼 : ( " + countrycode + " ) " + $(".register-phone input").val().substring(1);
			popupShowAdjust("確認手機號碼",desc,"fun+registration",true);	
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
			console.debug("驗證 驗證碼");
			activateStep1();
		}else{
			return false;
		}
	});

	//重送驗證碼
	$(".resend-otp").click(function(){
		if($(this).hasClass("resend-otp-ready")){
			registration(true);
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
			activateStep2();
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

        	if($(".setting-first-name input").val() && $(".setting-last-name input").val()){
				$(".setting-next").addClass("setting-next-ready");
			}else{
				$(".setting-next").removeClass("setting-next-ready");
			}
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
    	if (file.type.match(imageType)) {

			var reader = new FileReader();
			reader.onload = function(e) {
				var img = $(".avatar-area img");
				$(".avatar-area img").removeClass("avatar-default");
				//調整長寬
				img.load(function() {

					if($(".avatar-area img").hasClass("avatar-default")) return false;

					var w = img.width();
		            var h = img.height();
    				mathAvatarPos(img,w,h,110);
		        });

		        img.attr("src",reader.result);
			}
			reader.readAsDataURL(file);	
		}else{
			$(".avatar-area img").addClass("avatar-default");
			$(".avatar-area img").removeAttr( 'style' );
			$(".avatar-area img").attr("src","images/registration/registration_form_personalinfo_cam.png");
		}
    });


    $(".setting-first-name input,.setting-last-name input").bind("input",function(){
		if($(".setting-first-name input").val() && $(".setting-last-name input").val()  && $(".setting-birth input").val()){
			$(".setting-next").addClass("setting-next-ready");
		}else{
			$(".setting-next").removeClass("setting-next-ready");
		}
	});



    $(".setting-next").click(function(){

    	// $(document).data("ui","80f0b8e7-7b48-40ef-b2ea-658a17206d58");
    	// $(document).data("at","1ebc9204-bec6-43a9-9161-1a7e3d5620b1");
    	// $(document).data("phone-id","+886980922917");
     //    $(document).data("device-token","web-5566");

    	if(!$(this).hasClass("setting-next-ready")) return false;

    	//有上傳圖檔 圖檔上傳完畢之後再做註冊步驟3
    	if(!$(".avatar-area img").hasClass("avatar-default")){
    		avatarToS3($(".avatar-file")[0].files[0]);
    	}else{
    		var first_name = $(".setting-first-name input").val();
	    	var last_name = $(".setting-last-name input").val();
	    	var birth = $(".setting-birth-hidden").val()*1000;

	    	activateStep3(first_name,last_name,birth);
    	}

    	
    });









// ---------------- tool action --------------------------------------------------------------------------


	$(".ajax-screen-lock").click(function(e){
	    e.stopPropagation();
	});
	


	registration = function(resend){
		if(!resend){
			// $(document).data("device-token",deviceTokenMake());
			$(document).data("device-token","web-5566");
			$(document).data("phone-id", countrycode + $(".register-phone input").val().substring(1));	
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
        console.debug("registration() 傳送驗證碼前的 body:",JSON.stringify(body,null,2));
        var result = ajaxDo(api_name,headers,method,true,body);
        result.complete(function(data){
        	console.debug("傳送驗證碼後的 data:",data);
        	if(resend){
        		popupShowAdjust("","驗證碼已重新送出");
        		
			}else if(data.status == 200){
				$(".register-otp-desc-area div").html($(document).data("phone-id"));
				//default
				$(".resend-otp").removeClass("resend-otp-ready");
				$.mobile.changePage("#page-register-otp");
			}
        });
	}

	activateStep1 = function(){
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
        console.debug("activateStep1() 驗證 驗證碼前的 body:",JSON.stringify(body,null,2));
        var result = ajaxDo(api_name,headers,method,true,body);
        result.complete(function(data){
        	console.debug("驗證 驗證碼後的 data:",data);
        	if(data.status == 200){
        		console.debug("跳到 #page-password");
        		popupShowAdjust("",$.parseJSON(data.responseText).rsp_msg,"hash+#page-password");
        	}else{
        		$(".register-otp-input input").val("");
        		$(".register-otp-input input").trigger("input");
        		$(".resend-otp").addClass("resend-otp-ready");
        	}
        });
	}

	activateStep2 = function(){

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
        console.debug("activateStep2() 變更密碼前的 body:",JSON.stringify(body,null,2));
        var result = ajaxDo(api_name,headers,method,true,body);
        result.complete(function(data){
        	console.debug("變更密碼後的 data:",data);
        	var data = $.parseJSON(data.responseText);
        	if(data.rsp_code == 0){
        		//default
        		$(document).data("ui",data.ui);
        		$(document).data("at",data.at);
        		console.debug("變更密碼後的 ui:",$(document).data("ui"));
        		console.debug("變更密碼後的 at:",$(document).data("at"));
        		$(".avatar-area img").addClass("avatar-default");
        		popupShowAdjust("",data.rsp_msg,"hash+#page-user-setting");
        	}else{
        		$(".password-setting").val("");
        		$(".password-confirm").val("");
        		$(".register-otp-input input").trigger("input");
        	}
        });
	}

	activateStep3 = function(first_name,last_name,birth){
		var api_name = "activation/step3";
        var headers = {
        		ui: $(document).data("ui"),
        		at: $(document).data("at"),
                li: lang,
            };
        var method = "put";
        var body = {
                id: $(document).data("phone-id"),
                tp: 0,
                ud: $(document).data("device-token"),
                fn: first_name,
                ln: last_name,
                bd: birth
            }
        console.debug("activateStep3() 資料設定前的 headers:",JSON.stringify(headers,null,2));
        console.debug("activateStep3() 資料設定前的 body:",JSON.stringify(body,null,2));
        var result = ajaxDo(api_name,headers,method,true,body);
        result.complete(function(data){
        	//loading icon off
			s_load_show = false;
			$('.ui-loader').hide();
        	console.debug("資料設定後的 data:",data);
        	if(data.status == 200){
        		popupShowAdjust("","註冊完成囉");
        	}
        });
	}


	avatarToS3 = function(file){

		var result_msg = false;

		var api_name = "me/avatar";

        var headers = {
             "ui":$(document).data("ui"),
             "at":$(document).data("at"), 
             "li":lang
        };

        var method = "put";
        console.debug("avatarToS3() 取得s3 url前的 headers:",JSON.stringify(headers,null,2));

        s_load_show = true;
        var result = ajaxDo(api_name,headers,method,false);
        result.complete(function(data){
        	console.debug("取得s3 url後的 data:",data);
        	var d =$.parseJSON(data.responseText);
        	if(d.rsp_code == 0){

        		var fi = d.fi;
        		var ou = d.ou;
        		var tu = d.tu;
        		console.debug("s3 fi:",fi);
        		console.debug("s3 ou:",ou);
        		console.debug("s3 tu:",tu);
        		//先大圖
        		$.ajax({
					url: ou,
					type: 'PUT',
					contentType: " ",
				 	data: file, 
					processData: false,
					complete: function(data) { 
						console.debug("上傳大圖後的 data:",data);
						//大圖上傳s3成功或失敗
						if(data.status == 200){
							//再小圖 
							//縮圖
							var reader = new FileReader();
					        reader.onloadend = function() {
					           console.debug("reader.onloadend");
					            var tempImg = new Image();
					            tempImg.src = reader.result;
					            tempImg.onload = function() {
					                console.debug("tempImg.onload this:",this);
					                //縮圖
					                var blob = imgResizeByCanvas(this,0,0,max_w,max_h,quality);
					                console.debug("上傳小圖前的 blob:",blob);
									$.ajax({
										url: tu,
										type: 'PUT',
										contentType: " ",
										data: blob, 
										processData: false,
										complete: function(data) { 
											console.debug("上傳小圖後的 data:",data);

											//小圖上傳s3成功或失敗
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
							                      "si": file.size
							                    }
							                    console.debug("commit前的 headers:",headers);
							                    console.debug("commit前的 body:",body);
							                    var result = ajaxDo(api_name,headers,method,true,body);
							                    result.complete(function(data){
							                    	console.debug("commit後的 data:",data);
							                    	var data = $.parseJSON(data.responseText);
							                    	//commit 成功或失敗
							                    	if(data.rsp_code == 0){
							                    		result_msg = "個人頭像設定完成";
							                    		popupShowAdjust("",result_msg);

							                    		//大小圖上傳完畢 再做註冊步驟3
							                    		var first_name = $(".setting-first-name input").val();
												    	var last_name = $(".setting-last-name input").val();
												    	var birth = $(".setting-birth-hidden").val()*1000;

												    	activateStep3(first_name,last_name,birth);

							                    	}else{
							                    		//commit 失敗
							                    		result_msg = data.rsp_msg;
							                    		popupShowAdjust("",result_msg,true);
							                    	}
						                    	});
											}else{
												// 小圖上傳 錯誤
												result_msg = "小圖上傳 錯誤";
												popupShowAdjust("",result_msg,true);
											}
										}
									});
					            }
					        }
					        reader.readAsDataURL(file);
						}else{
							// 大圖上傳 錯誤
							result_msg = "大圖上傳 錯誤";
							popupShowAdjust("",result_msg,true);
						}
					}
				});

        	}else{
        		// me/avatar 錯誤
        		result_msg = d.rsp_msg;
        		popupShowAdjust("",result_msg,true);
        	}
        });
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
		console.debug("imgResizeByCanvas dataURL:",dataURL);
		return dataURItoBlob(dataURL);
	}

	dataURItoBlob = function(dataURI) {
        var binary = atob(dataURI.split(',')[1]);
        var array = [];
        for(var i = 0; i < binary.length; i++) {
            array.push(binary.charCodeAt(i));
        }
        return new Blob([new Uint8Array(array)], {type: 'image/jpeg'});
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


    //對話框設定
    $(".popup-confirm").click(function(){
    	var todo = $(".popup-confirm").data("todo");

    	if(typeof todo == "string"){
    		var todo_type = todo.split("+")[0];
    		var todo_act = todo.split("+")[1];

   //  		console.debug("todo_type:",todo_type);
			// console.debug("todo_act:",todo_act);

			if(todo_type == "fun"){
		    	switch(todo_act){
					case "registration":
						registration();
						break;
					case "activateStep1":
						activateStep1();
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
		console.debug("========彈跳視窗========");
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


	    if(!confirm && !cancel){
	    	setTimeout(function(){
    			$(".popup-screen").trigger("click");
    		},1000);
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