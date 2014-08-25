$(function(){
	//預設上一頁
	$(document).data("page-history",[["#page-registration"]]);
	
	
	//首頁大圖
	$("#page-registration").css("height",$(window).height());
	$(window).resize(function(){ 
		$("#page-registration").css("height",$(window).height());
	});

	$(".login").click(function(){
		//若local storage 有記錄密碼 就顯示

		idb_login_data.getAll(function(item){
			if(item.length){
				//順便幫他打個勾
				$(".login-remeber img").attr("src","images/common/icon/icon_check_gray_check.png");
				$(".login-remeber").data("chk",true);
				$(".login-remeber-area").show();
				$(".login-default-area").hide();
				$(".login-change").show();

				$(".login-next").addClass("login-next-adjust");

				//填入帳號
				$(".login-account span:eq(1)").html("(" + item[0].countrycode + ")" + item[0].phone.substring(1));

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
		idb_login_data.getAll(function(item){
			if(item.length && !$(".login-change").data("chk")){
				var phone_id = item[0].phone;
				var password = $(".login-remeber-password input").val();
			}else{
				var phone_id = $(".login-phone input").val();
				var password = $(".login-password input").val();
			}
			cns.debug("phone_id:",phone_id,"pw:",password,"countrycode:",countrycode);
			//登入
			login(phone_id,password,countrycode);
		});
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
        ajaxDo(api_name,headers,method,true,body).complete(function(data){
        	var login_result = $.parseJSON(data.responseText);
        	// cns.debug("login resutl:",JSON.stringify(login_result));
        	// return false;
        	if(data.status == 200){
        		//先刪除 有打勾就記錄 沒打勾就不動作
        		idb_login_data.clear(function(){
        			//登入成功 記錄帳號密碼
        			if($(".login-remeber").data("chk")){
						var login_data_obj = {};
						login_data_obj.phone = phone_id;
						login_data_obj.password = password;
						login_data_obj.countrycode = countrycode;
						idb_login_data.put(login_data_obj);
					}
        		});

				//儲存登入資料 跳轉到timeline
				login_result.page = "timeline";
        		$.lStorage("_loginData",login_result);

        		//附上group list
        		getGroupList(login_result.ui,login_result.at).complete(function(data){
        			if(data.status == 200){
        				if($.parseJSON(data.responseText).gl.length > 0){
        					//有group
        					login_result.gl = $.parseJSON(data.responseText).gl;

        					$.lStorage("_loginData",login_result);
        					document.location = "main.html#page-group-main";
        				}else{
        					//沒group
        					document.location = "main.html#page-group-menu";
        				}
        			}else{
        				//取得group list 失敗
        			}
        		});
        	}
        });
	}

	getGroupList = function(ui,at){
    	//取得團體列表
        var api_name = "groups";
        var headers = {
            "ui":ui,
            "at":at,
            "li":lang
        };
        var method = "get";
        return ajaxDo(api_name,headers,method,true);
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
			cns.debug("傳送驗證碼 還沒按確定");
			var desc = "我們將傳送驗證碼簡訊至此手機<br/>號碼 : ( " + countrycode + " ) " + $(".register-phone input").val().substring(1);
			popupShowAdjust("確認手機號碼",desc,true,true,[registration]);
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

			//刪除檔案
			$(this).replaceWith( $(this).val('').clone( true ) );
			//警語
			popupShowAdjust("","檔案格式必須為圖檔");
		}
    });


    $(".setting-first-name input,.setting-last-name input").bind("input",function(){
		if($(".setting-first-name input").val() && $(".setting-last-name input").val()  && $(".setting-birth input").val()){
			$(".setting-next").addClass("setting-next-ready");
		}else{
			$(".setting-next").removeClass("setting-next-ready");
		}
	});



    $(document).on("click",".setting-next-ready",function(){
    	// cns.debug("document data:",$(document).data());
    	// $(document).data("ui","U0000tXY08o");
    	// $(document).data("at","6a174db2-420b-4bda-97ce-6069d88f2926");
    	// $(document).data("phone-id","+886980922917");
    	// $(document).data("device-token","web-test");

    	//有上傳圖檔 圖檔上傳完畢之後再做註冊步驟3
    	if(!$(".avatar-area img").hasClass("avatar-default")){
    		avatarToS3($(".avatar-file")[0].files[0]);
    	}else{
    		var first_name = $(".setting-first-name input").val();
	    	var last_name = $(".setting-last-name input").val();
	    	var birth = $(".setting-birth-hidden").val()*1000;

	    	//姓名暫時先顛倒
	    	activateStep3(last_name,first_name,birth);
    	}
    });

    //test
    $(".login-forget-pw").click(function(){
    	// popupShowAdjust("","註冊完成",true,false,[toGroupMenu]);
    });


// ---------------- tool action --------------------------------------------------------------------------

	$(".ajax-screen-lock").click(function(e){
	    e.stopPropagation();
	});

	registration = function(resend){
		if(!resend){
			// $(document).data("device-token",deviceTokenMake());
			$(document).data("device-token","web-device");
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
        cns.debug("registration() 傳送驗證碼前的 body:",JSON.stringify(body,null,2));
        var result = ajaxDo(api_name,headers,method,true,body);
        result.complete(function(data){
        	cns.debug("傳送驗證碼後的 data:",data);
        	if(resend){
        		//popupShowAdjust("","驗證碼已重新送出");
        		toastShow("驗證碼已重新送出");
        		
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
        cns.debug("activateStep1() 驗證 驗證碼前的 body:",JSON.stringify(body,null,2));
        var result = ajaxDo(api_name,headers,method,true,body);
        result.complete(function(data){
        	cns.debug("驗證 驗證碼後的 data:",data);
        	if(data.status == 200){
        		cns.debug("跳到 #page-password");//"hash+#page-password"
        		popupShowAdjust("",$.parseJSON(data.responseText).rsp_msg,true,false,[changePageAfterPopUp,"#page-password"]);
        	}else{
        		$(".register-otp-input input").val("");
        		$(".register-otp-input input").trigger("input");
        		$(".resend-otp").addClass("resend-otp-ready");
        	}
        });
	}

	activateStep2 = function(){

		$(document).data("password",$(".password-confirm input").val());

		var api_name = "activation/step2";
        var headers = {
                 "li":lang,
                     };
        var method = "put";
        var body = {
                id: $(document).data("phone-id"),
                tp: 0,
                ud: $(document).data("device-token"),
                pw: toSha1Encode($(document).data("password"))
            }
        cns.debug("activateStep2() 變更密碼前的 body:",JSON.stringify(body,null,2));
        var result = ajaxDo(api_name,headers,method,true,body);
        result.complete(function(data){
        	cns.debug("變更密碼後的 data:",data);
        	if(data.status == 200){
        		var data = $.parseJSON(data.responseText);
        		//default
        		$(document).data("ui",data.ui);
        		$(document).data("at",data.at);
        		cns.debug("變更密碼後的 ui:",$(document).data("ui"));
        		cns.debug("變更密碼後的 at:",$(document).data("at"));
        		$(".avatar-area img").addClass("avatar-default");
        		// popupShowAdjust("",data.rsp_msg,"hash+#page-user-setting");
        		popupShowAdjust("",data.rsp_msg,true,false,[changePageAfterPopUp,"#page-user-setting"]);
        	}else{
        		$(".password-setting").val("");
        		$(".password-confirm").val("");
        		$(".register-otp-input input").trigger("input");
        		//popupShowAdjust("",errorResponse(data),true);
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
        cns.debug("step3 body:",body);
        var result = ajaxDo(api_name,headers,method,true,body);
        result.complete(function(data){
        	//loading icon off
			s_load_show = false;
			$('.ui-loader').hide();
        	cns.debug("資料設定後的 data:",data);
        	if(data.status == 200){
        		//登入成功 記錄帳號密碼
				var _loginRemeber = {};
	    		_loginRemeber.phone = "0" + $(document).data("phone-id").substring(4);
	    		_loginRemeber.password = $(document).data("password");
	    		_loginRemeber.countrycode = countrycode;
	    		$.lStorage("_loginRemeber",_loginRemeber);

				//儲存登入資料 跳轉到timeline
				var _loginData = {
					ui: $(document).data("ui"),
					at: $(document).data("at")
				}

				$.lStorage("_loginData",_loginData);
        		// popupShowAdjust("","註冊完成囉","func+toGroupMenu");
        		popupShowAdjust("","註冊完成",true,false,[toGroupMenu]);
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
        cns.debug("avatarToS3() 取得s3 url前的 headers:",JSON.stringify(headers,null,2));

        s_load_show = true;
        var result = ajaxDo(api_name,headers,method,false);
        result.complete(function(data){
        	cns.debug("取得s3 url後的 data:",data);
        	if(data.status == 200){
        		var d =$.parseJSON(data.responseText);
        		var fi = d.fi;
        		var ou = d.ou;
        		var tu = d.tu;
        		cns.debug("s3 fi:",fi);
        		cns.debug("s3 ou:",ou);
        		cns.debug("s3 tu:",tu);

        		//大小圖都要縮圖
				var reader = new FileReader();
		        reader.onloadend = function() {
		            var tempImg = new Image();
		            tempImg.src = reader.result;
		            tempImg.onload = function() {
		                
		                //大小圖都要縮圖
		                var o_obj = imgResizeByCanvas(this,0,0,1280,1280,0.7);
		                var t_obj = imgResizeByCanvas(this,0,0,120,120,0.6);
		                cns.debug("o_obj:",o_obj);
		                cns.debug("t_obj:",t_obj);
		                //先大圖
		        		$.ajax({
							url: ou,
							type: 'PUT',
							contentType: " ",
						 	data: o_obj.blob, 
							processData: false,
							complete: function(data) { 
								cns.debug("上傳大圖後的 data:",data);
								//大圖上傳s3成功或失敗
								if(data.status == 200){
									//再小圖 
									$.ajax({
										url: tu,
										type: 'PUT',
										contentType: " ",
										data: t_obj.blob, 
										processData: false,
										complete: function(data) { 
											cns.debug("上傳小圖後的 data:",data);

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
							                    cns.debug("commit前的 headers:",headers);
							                    cns.debug("commit前的 body:",body);
							                    var result = ajaxDo(api_name,headers,method,true,body);
							                    result.complete(function(data){
							                    	cns.debug("commit後的 data:",data);
							                    	//commit 成功或失敗
							                    	if(data.status == 200){

							                    		//大小圖上傳完畢 再做註冊步驟3
							                    		var first_name = $(".setting-first-name input").val();
												    	var last_name = $(".setting-last-name input").val();
												    	var birth = $(".setting-birth-hidden").val()*1000;

												    	activateStep3(first_name,last_name,birth);

							                    	}else{
							                    		//commit 失敗
							                    		cns.debug("commit 失敗");
							                    	}
						                    	});
											}else{
												// 小圖上傳 錯誤
												cns.debug("小圖上傳 錯誤");
											}
										}
									});
								}else{
									// 大圖上傳 錯誤
									cns.debug("大圖上傳 錯誤");
								}
							}
						});
		            }
			    }
		        reader.readAsDataURL(file);
        	}
        });
	}


// tool function ----------------------------------------------------------------------
	
	

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



 //    //對話框設定
 //    $(".popup-confirm").click(function(){
 //    	var todo = $(".popup-confirm").data("todo");

 //    	if(typeof todo == "string"){
 //    		var todo_type = todo.split("+")[0];
 //    		var todo_act = todo.split("+")[1];

 //   //  		cns.debug("todo_type:",todo_type);
	// 		// cns.debug("todo_act:",todo_act);

	// 		if(todo_type == "func"){
	// 	    	switch(todo_act){
	// 				case "registration":
	// 					registration();
	// 					break;
	// 				case "toGroupMenu":
	// 					toGroupMenu();
	// 					break;
	// 			}
	//     	}else if(todo_type == "hash"){
	//     		$.mobile.changePage(todo_act);
	//     	}
 //    	}
	// 	$(".popup-screen").trigger("close");
	// });

	// $(".popup-cancel").click(function(){
 //    	var todo = $(".popup-cancel").data("todo");

 //    	if(typeof todo == "string"){
 //    		var todo_type = todo.split("+")[0];
 //    		var todo_act = todo.split("+")[1];
	// 		if(todo_type == "func"){

	//     	}else if(todo_type == "hash"){
	//     		$.mobile.changePage(todo_act);
	//     	}
 //    	}
	// 	$(".popup-screen").trigger("close");
	// });


	// $(".popup-screen").bind("close",function(){
	//     $(".popup").hide();
	//     $(".popup-screen").hide();
	// });


	toGroupMenu = function(){
		document.location = "main.html#page-group-menu";
	}

    //對話框設定
	popupShowAdjust_bak = function (title,desc,confirm,cancel){

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
	
	



})