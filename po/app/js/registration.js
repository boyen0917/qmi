onCheckVersionDone = function(needUpdate){
	if( needUpdate ){
		return;
	}
	clearBadgeLabel();



	if($.lStorage("_loginAutoChk") === true) {
		loginAction();
	} else if( window.location.hash !== "") {
		// window.location = "index.html";
		$.mobile.changePage("")
	}

	//預設上一頁
	// $(document).data("page-history",[["#page-group-menu"]]);
	
	//首頁大圖
	$("#page-registration").css("height",$(window).height());
	$(window).resize(function(){ 
		$("#page-registration").css("height",$(window).height());
	});


	$(document).on("click",".login-ready",function(){
		var isMail = false;
		var phone_id = "";
		var phoneInput = $(".login-ld-phone input");
		if( phoneInput.is(":visible") ){
			phone_id = phoneInput.val();
		} else {
			phone_id = $(".login-ld-email input").val();
			isMail = true;
		}
		var password = $(".login-ld-password input").val();

		//登入
		login(phone_id,password,countrycode,isMail);
		
	});

	$(".login-ld-password").off("keypress").keypress(function(e){
		if( e.which == 13 ) {
			$(".login-ready").click();
		}
	});

	$(".register").click(function(){
		$.mobile.changePage("#page-register", {transition: "slide"});
		//contry code
		var countryCodeDoms = $('#page-register .countrycode select');
		countryCodeDoms.selectbox({
			onOpen: function (inst) {
				console.log("open"); //, inst
			},
			onClose: function (inst) {
				console.log("close"); //, inst
			},
			onChange: function (val, inst) {
				cns.debug(val, inst);
				countryCodeDoms.attr("data-val",val);
				var text = countryCodeDoms.find("option[value='"+val+"']").text() || "";
				countryCodeDoms.attr("data-text",text);
				if( "undefined"!=typeof(checkRegisterPhone) ) checkRegisterPhone();
			},
			effect: "slide"
		});
		var firstDom = countryCodeDoms.find("option:eq(0)");
		countryCodeDoms.attr("data-val",firstDom.attr("value")||"TW");
		countryCodeDoms.attr("data-text",firstDom.text()||"");
	});


	//email / phone
	$(".login-tab").click(function(){
		var this_dom = $(this);
		if( this_dom.hasClass("active") ) return;
		$(".login-tab").removeClass("active");
		this_dom.addClass("active");
		switch( this_dom.data("type") ){
			case "phone":
				$(".login-ld-phone").show();
				$(".login-ld-email").hide();
				break;
			case "email":
				$(".login-ld-phone").hide();
				$(".login-ld-email").show();
				break;
		}
	});

	//contry code
	var countryCodeDoms = $('.login-ld-countrycode select');
	countryCodeDoms.selectbox({
		onOpen: function (inst) {
			console.log("open"); //, inst
		},
		onClose: function (inst) {
			console.log("close"); //, inst
		},
		onChange: function (val, inst) {
			countryCodeDoms.attr("data-val",val||"");
			if( "undefined"!=typeof(checkLoginReady) ) checkLoginReady();
		},
		effect: "slide"
	});

	//set default value
	countryCodeDoms.attr("data-val","TW");
	var loginData = $.lStorage("_loginRemeber");
	if( null!=loginData && null!=loginData ){
		var targetCountryDom = countryCodeDoms.find("option[data-code='"+loginData.countrycode+"']");
		if( targetCountryDom.length>0 ){
			countryCodeDoms.selectbox("change", targetCountryDom.val(), $(targetCountryDom[0]).text() );
			cns.debug(targetCountryDom.text());
		}
	}

	//調整
	$(".login-ld-countrycode label.sbSelector").css("line-height","40px")

/*

     ##        #######   ######   #### ##    ## 
     ##       ##     ## ##    ##   ##  ###   ## 
     ##       ##     ## ##         ##  ####  ## 
     ##       ##     ## ##   ####  ##  ## ## ## 
     ##       ##     ## ##    ##   ##  ##  #### 
     ##       ##     ## ##    ##   ##  ##   ### 
     ########  #######   ######   #### ##    ## 

*/     
	
	//----- landing page login start -------

	$(".login-ld-phone input").bind("input",function(){
		//限制輸入數字
		if($(this).parent().hasClass("login-ld-phone")){
			$(this).val($(this).val().replace(/[^-_0-9]/g,''));	
		}
		checkLoginReady();
	});
	$(".login-ld-password input").bind("input",function(){
		checkLoginReady();
	});
	$(".login-ld-email input").bind("input",function(){
		checkLoginReady();
	});

	checkLoginReady = function(){
		// cns.debug("[checkLoginReady]");
		var page = $("#page-registration");
		var activeTab = page.find(".login-tab.active");
		if( "phone" == activeTab.attr("data-type") ){
			var pwdInput = $(".login-ld-password input");
			var phoneInput = $(".login-ld-phone input");
			var countryInput = $(".login-ld-countrycode select");
			var phoneObj = getPhoneNumberObject( phoneInput.val(), countryInput.attr("data-val") );
			if( phoneObj.isValid && pwdInput.val().length >= 6 ){
				$("#page-registration .login").addClass("login-ready");

				countrycode = "+"+phoneObj.country_code;
				var loginData = $.lStorage("_loginRemeber");
				loginData.countrycode = countrycode;
				$.lStorage("_loginRemeber", loginData);
			} else {
				$("#page-registration .login").removeClass("login-ready");
			}
		} else {
			var pwdInput = $(".login-ld-password input");
			var emailInput = $(".login-ld-email input");
			var email = emailInput.val();
			if( email && email.length>3 ){
				var isMailCheck = email.replace(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,'');
				
				if(pwdInput.val().length >= 6 && isMailCheck.length == 0 ){
					$("#page-registration .login").addClass("login-ready");
				}else{
					$("#page-registration .login").removeClass("login-ready");
				}
			} else {
				$("#page-registration .login").removeClass("login-ready");
			}
		}
	}


	//------- landing page login end -------

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
			if( $(this).hasClass("landpage") ){
				$(this).find("img").attr("src","images/registration/checkbox_none.png");
			} else {
				$(this).find("img").attr("src","images/common/icon/icon_check_gray.png");
			}
			remeber_chk = false;
		}else{
			if( $(this).hasClass("landpage") ){
				$(this).find("img").attr("src","images/registration/checkbox_check.png");
			} else {
				$(this).find("img").attr("src","images/common/icon/icon_check_gray_check.png");
			}
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
		// cns.debug("phone_id:",phone_id,"pw:",password,"countrycode:",countrycode);

		//登入
		login(phone_id,password,countrycode);
		
	});

	login = function(phone_id,password,countrycode,isMail){
		isMail = isMail || false;
		var api_name = "login";
        var headers = {
            li:lang
        };
        var id = phone_id;
        if( false==isMail ){
        	id = countrycode + getInternationalPhoneNumber(countrycode, phone_id);
        }
        var body = {
            id: id,
            tp: 1,//0(Webadm)、1(Web)、2(Phone)、3(Pad)、4(Wear)、5(TV)
            dn: navigator.userAgent.substring(navigator.userAgent.indexOf("(")+1,navigator.userAgent.indexOf(")")),
            pw:toSha1Encode(password)
        };

        s_load_show = true;
        var method = "post";
        ajaxDo(api_name,headers,method,true,body).complete(function(data){
        	if(data.status == 200){

        		
        		QmiGlobal.auth = $.parseJSON(data.responseText);
        		
        		//自動登入儲存 有_loginData 有_loginAutoChk 才代表有選自動登入
                if($(".login-auto").data("chk")) {
                	$.lStorage("_loginData",QmiGlobal.auth);
                	$.lStorage("_loginAutoChk",true);
                }else {
                	localStorage.removeItem("_loginData");
                	localStorage.removeItem("_loginAutoChk");
                }

        		//判斷是否換帳號 換帳號就要清db
        		if(!$.lStorage(QmiGlobal.auth.ui)) resetDB();

    			//記錄帳號密碼
    			if($(".login-remeber").data("chk")){
					var _loginRemeber = {};
					_loginRemeber.phone = phone_id;
					_loginRemeber.isMail = isMail;
					// _loginRemeber.password = password;
					_loginRemeber.countrycode = countrycode;
					$.lStorage("_loginRemeber",_loginRemeber);
				}else{
					//沒打勾的話就清除local storage
		    		localStorage.removeItem("_loginRemeber");
				}
				loginAction();
        	}
        });
	}

	//初始化 
    function loginAction (){
        //儲存登入資料 跳轉到timeline
        if($.lStorage("_loginData") !== false) {
        	QmiGlobal.auth = $.lStorage("_loginData");	
        }
        
        var 
        deferred = $.Deferred(),
        group_list = [];

        ui = QmiGlobal.auth.ui;
        at = QmiGlobal.auth.at;

        //附上group list
        getGroupList().complete(function(data){
            if(data.status == 200){

                var parse_data = $.parseJSON(data.responseText);
                if( !parse_data ){
                    console.debug("no group data");
                    return;
                }

				group_list = parse_data.gl;
                if(group_list && (group_list.length > 0 || parse_data.cl.length>0) ){

                    //有group
                    getPrivateGroupFromList( parse_data.cl, function(){

                        //將group list 更新到 lstorage ui
                        groupListToLStorage(group_list);

                        // 取dgi的combo
                        if( group_list.length>0 ){
                        	//有dgi 但不存在列表裡
                            if( QmiGlobal.auth.dgi === undefined || $.lStorage(ui)[QmiGlobal.auth.dgi] === undefined ){
                            	localStorage.removeItem("uiData");
                            	
                                QmiGlobal.auth.dgi = group_list[0].gi;
                                $.lStorage("_loginData",QmiGlobal.auth);
                            }

                            getGroupComboInit(QmiGlobal.auth.dgi).done(function(resultObj){
                            	if( resultObj.status === false ){
                            		//發生錯誤 回首頁比較保險
                            		console.debug("dgi combo error",resultObj);
                            		window.location = "index.html";
                            	} else {
                            		deferred.resolve({location:"#page-group-main"});
                            	}
                            });
                            
                        } else{
                            //沒group
                            deferred.resolve({location:"#page-group-menu"});
                        }
                    });
                }else{

                    localStorage.removeItem("_groupList");
                    localStorage.removeItem("uiData");
                    //沒group
                    deferred.resolve({location:"#page-group-menu"});
                    // document.location = "main.html#page-group-menu";
                }
            }else if(data.status == 401){
                //取得group list 失敗 代表自動登入失敗了
                deferred.resolve({fail:true});
            }
        });

        deferred.done(function(data){
        	s_load_show = false;

            if(data.fail === true) {
                //取得group list 失敗 代表自動登入失敗了
                // localStorage.removeItem("_loginData");
                return false;
            }

            $.lStorage("refreshChk", false);
            localStorage["uiData"] = JSON.stringify($.lStorage(ui));
            // document.location = data.location;    
            $.mobile.changePage(data.location);

			//聊天室開啓DB
	    	initChatDB(); 
			initChatCntDB(); 

			//沒團體的情況
			if(group_list.length == 0 || !QmiGlobal.auth.dgi || QmiGlobal.auth.dgi==""){
				//關閉返回鍵
				$("#page-group-menu .page-back").hide();
				cns.debug("no group ");
				
				// 兩個選項都要執行polling()
				polling();
			}else{
				//設定目前團體 執行polling()
				setGroupInitial(QmiGlobal.auth.dgi).done(polling);
			}
        });
    }


	getPrivateGroupList = function(p_data, callback){
    	//取得團體列表
        var api_name = "groups";
        var headers = {
            "ui":p_data.ui,
            "at":p_data.at,
            "li":lang
        };
        var method = "get";
        ajaxDo(api_name,headers,method,false,false,false,true,p_data.cl).complete(function(res){
        	if( res.status==200 ){
        		var parse_data = $.parseJSON(res.responseText);
	    		var list = $.lStorage("_pri_group")||{};
	    		list[p_data.ci] = p_data;
	    		list[p_data.ci].tmp_groups = parse_data.gl;
	    		$.lStorage("_pri_group", list);
	    	}
	    	if(callback) callback();
        });
    }

    getPrivateGroupFromList = function( data, callback ){
    	if( !data || data.length==0 ){
    		if(callback) callback();
    	}
    	var cnt = 0;
    	for( var i=0; i<data.length; i++ ){
    		var p_data = data[i];
	    	getPrivateGroupList(p_data ,function(res){
	    		cnt++;
	    		if(callback && cnt==data.length){
	    			callback();
	    		}
	    	});
	    }
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


	$("#page-register .register-text span").html( $.i18n.getString("REGISTER_ACCOUNT_POLICY", "<a href='http://webdev.cloud.mitake.com.tw/user_agreement.html' target='_blank'>", "</a>", "<a href='http://webdev.cloud.mitake.com.tw/privacy_policy.html' target='_blank'>", "</a>") );
	
	$(document).on("click", "#page-register .register-text img", function(){
		var img = $(this);
		var next = $(".register-next");
		var chk = next.data("chk");
		if( true==chk ){
			img.attr("src","images/common/icon/icon_check_gray.png");
			next.data("chk", false);
			$(".register-next").removeClass("register-next-ready");
		} else {
			img.attr("src","images/common/icon/icon_check_gray_check.png");
			next.data("chk", true);

			if( true==next.data("textChk") ){
				$(".register-next").addClass("register-next-ready");
			}
		}
	});

	checkRegisterPhone = function(){
		var this_dom = $(".register-phone input");
		cns.debug("[checkRegisterPhone]");
		this_dom.val(this_dom.val().replace(/[^-_0-9]/g,''));
		var this_register = this_dom.parent();
		var countryCodeDoms = $('#page-register .countrycode select');
		var tmpCountryCode = countryCodeDoms.attr("data-val");

		var phoneObj = getPhoneNumberObject( this_dom.val(), tmpCountryCode );
		if( phoneObj.isValid ){
			countryCodeDoms.attr("data-countryCode", "+"+phoneObj.country_code);
			countryCodeDoms.attr("data-nationalNum", phoneObj.national_number);
			this_register.find("img").show();
			$(".register-next").data("textChk", true );

			if( true==$(".register-next").data("chk") ){
				$(".register-next").addClass("register-next-ready");
			}
		} else {
			this_register.find("img").hide();
			$(".register-next").data("textChk", false );
			$(".register-next").removeClass("register-next-ready");
		}
	};
	$(".register-phone input").bind("input",checkRegisterPhone );

	$(".register-next").click(function(){
		if($(this).hasClass("register-next-ready")){
			cns.debug("傳送驗證碼 還沒按確定");

			//get country code
			var countryCodeDoms = $('#page-register .countrycode select');
			var newCountryName = countryCodeDoms.attr("data-val");
			var newCountryCode = countryCodeDoms.attr("data-countryCode");
			var newCountryText = countryCodeDoms.attr("data-text");
			var nationalNum = countryCodeDoms.attr("data-nationalNum");
			countrycode = newCountryCode;
			cns.debug("newCountryCode", newCountryCode);
			// if( newCountryCode != countrycode ){
			// 	countrycode = newCountryCode;
			// 	var loginData = $.lStorage("_loginRemeber");
			// 	loginData.countrycode = newCountryCode;
			// 	$.lStorage("_loginRemeber", loginData);
			// }
			var targetCountryDom = $('.login-ld-countrycode select');
			if( targetCountryDom.length>0 ){
				targetCountryDom.selectbox("change", newCountryName, newCountryText );
				cns.debug(newCountryName, newCountryText);
			}

			var newPhoneNumber = nationalNum;
			if( newPhoneNumber.length>0 ){
				var desc = $.i18n.getString("REGISTER_ACCOUNT_WARN")+ "<br/><br/><label style='text-align:center;display: block;'>( " + countrycode + " ) " + newPhoneNumber+"</label>";
				popupShowAdjust( $.i18n.getString("REGISTER_ACCOUNT_WARN_TITEL"),desc,true,true,[registration]);
			}
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
		var p1 = $(".password-setting input").val();
		var p2 = $(".password-confirm input").val();
		if( p1 && p2 
			&& (p1.length>=6 && p1.length<=20)
			&& p1==p2
		){
			$(".password-next").addClass("password-next-ready");
		}else{
			$(".password-next").removeClass("password-next-ready");
		}
	});

	//密碼設定
	$(".password-next").click(function(){
		if(!$(this).hasClass("password-next-ready")) return false;
		
		if($(".password-setting input").val() != $(".password-confirm input").val()){
			popupShowAdjust("",$.i18n.getString("LOGIN_FORGETPASSWD_NOT_MATCH"),true);
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
			// var time_format = time.customFormat( "#YYYY# 年 #M# 月 #D# 日" );
			var time_format = time.toLocaleDateString();
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
			popupShowAdjust("",$.i18n.getString("COMMON_NOT_IMAGE"));
		}
    });


    $(".setting-first-name input,.setting-last-name input").bind("input",function(){
		if($(".setting-first-name input").val() 
			&& $(".setting-last-name input").val()  
			// && $(".setting-birth input").val()
		){
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

    $(".login-auto").click(function(){
    	if($(".login-auto").data("chk")){
    		// $(".login-auto").removeClass("login-auto-active");
    		if( $(this).hasClass("landpage") ){
				$(this).find("img").attr("src","images/registration/checkbox_none.png");
    		} else {
				$(this).find("img").attr("src","images/common/icon/icon_check_gray.png");
    		}
    		$(".login-auto").data("chk",false);
    	}else{
    		// $(".login-auto").addClass("login-auto-active");
    		if( $(this).hasClass("landpage") ){
				$(this).find("img").attr("src","images/registration/checkbox_check.png");
    		} else {
				$(this).find("img").attr("src","images/common/icon/icon_check_gray_check.png");
    		}
			$(".login-auto").data("chk",true);
    	}
    });


// ---------------- tool action --------------------------------------------------------------------------

	$(".ajax-screen-lock").click(function(e){
	    e.stopPropagation();
	});

	registration = function(resend){
		if(!resend){
			var newPhoneNumber = getInternationalPhoneNumber( countrycode, $(".register-phone input").val() );
			// if( newPhoneNumber.length>0 ){
				// var desc = $.i18n.getString("REGISTER_ACCOUNT_WARN")+ "<br/><br/><label style='text-align:center;display: block;'>( " + countrycode + " ) " + newPhoneNumber+"</label>";
				// popupShowAdjust( $.i18n.getString("REGISTER_ACCOUNT_WARN_TITEL"),desc,true,true,[registration]);
			// }
			// $(document).data("device-token",deviceTokenMake());
			$(document).data("device-token","web-device");
			var newPhoneNumber = getInternationalPhoneNumber( countrycode, $(".register-phone input").val() );
			$(document).data("phone-id", countrycode + newPhoneNumber );	
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
        	//default
			$(".resend-otp").removeClass("resend-otp-ready");

        	if(resend){
        		//popupShowAdjust("","驗證碼已重新送出");
				if(data.status == 200){
	                s_load_show = false;
	                $('.ui-loader').hide();
	                $(".ajax-screen-lock").hide();
	        		toastShow( $.i18n.getString("REGISTER_AUTH_SMS_HAS_SENT") );
        		}
			}else if(data.status == 200){
				$(".register-otp-desc-area div").html($(document).data("phone-id"));
				//default

				$(".register-otp-input input").val("");
				$.mobile.changePage("#page-register-otp");
			}else{
				var str = "unknown error";
				try {
					str = JSON.parse(data.responseText).rsp_msg;
				} catch(e){
					cns.debug( e.message );

				}

				toastShow( str );
			}
        });
	}

	activateStep1 = function(){
		var otpCode = $(".register-otp-input input").val();

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
        var result = ajaxDo(api_name,headers,method,true,body, null, true);

        		
	    result.error(function(jqXHR, textStatus, errorThrown) {
	    	try{
	    		//if(jqxhr.status == 400){
					if(jqXHR.responseText){
						var tmp = $.parseJSON(jqXHR.responseText);
						if( 900==tmp.rsp_code ){
			        		popupShowAdjust("",tmp.rsp_msg,true,true,[onRewriteRegitration,otpCode]);
			        	} else {
	    					popupShowAdjust("",tmp.rsp_msg,true);
			        	}
					}else{
						cns.debug("errorResponse:",data);
						return $.i18n.getString("COMMON_CHECK_NETWORK");
					}
				//}
	    	} catch(e){
				cns.debug( e.message );
			}
	    });
        result.complete(function(data){
        	cns.debug("驗證 驗證碼後的 data:",data);

        	//清除db
        	resetDB();
        	$(".register-otp-input input").val("");

        	$(".register-otp-input input").trigger("input");
        	$(".resend-otp").addClass("resend-otp-ready");

        	if(data.status == 200){
        		cns.debug("跳到 #page-password");//"hash+#page-password"
        		popupShowAdjust("",$.parseJSON(data.responseText).rsp_msg,true,false,[changePageAfterPopUp,"#page-password"]);
        	}else{
        		// var parseJSON = $.parseJSON(data.responseText);
        		// $(".register-otp-input input").val("");
        		
        	}
        });
	}

	onRewriteRegitration = function(otpCode){
		var api_name = "activation/unbind";
        var headers = {
                 "li":lang,
                     };
        var method = "post";
        var body = {
            id: $(document).data("phone-id"),
            ud: $(document).data("device-token"),
            vc: otpCode
        }
        
        var result = ajaxDo(api_name,headers,method,true,body);
        result.complete(function(data){
        	
        	if(data.status == 200){
        		var data = $.parseJSON(data.responseText);
        		//default
        		$.mobile.changePage("#page-password");
        	}else{
        		$(".password-setting").val("");
        		$(".password-confirm").val("");
        		$(".register-otp-input input").trigger("input");
        		//popupShowAdjust("",errorResponse(data),true);
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
                tp: 1,//多裝置代碼 0(Webadm)、1(Web)、2(Phone)、3(Pad)、4(Wear)、5(TV)
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
        //no bd now
        var body = {
                id: $(document).data("phone-id"),
                tp: 0,
                ud: $(document).data("device-token"),
                fn: first_name,
                ln: last_name,
                //bd: birth
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
				_loginRemeber.isMail = false;
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
        		popupShowAdjust("", $.i18n.getString("REGISTER_SUCC"),true,false,[toGroupMenu]);
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


	toGroupMenu = function(){
		//document.location = "main.html?v"+ new Date().getRandomString() +"#page-group-menu";
		$('.ui-loader').css("display","block");
		$(".ajax-screen-lock").show();
		loginAction($.lStorage("_loginData"));
	}
	
	initLandPage = function(){
		// s_load_show = true;
		// if($.lStorage("_loginData") && $.lStorage("_loginAutoChk")){
		// 	$('.ui-loader').css("display","block");
		// 	$(".ajax-screen-lock").show();
		// 	// setTimeout( function(){
		// 		loginAction($.lStorage("_loginData"));
		// 		return false;
		// 	// },1500);
		// }
		
		//若local storage 有記錄密碼 就顯示
		var rememberData = $.lStorage("_loginRemeber");
		if( rememberData ){
			//順便幫他打個勾
			$(".login-remeber img").attr("src","images/registration/checkbox_check.png");
			$(".login-remeber").data("chk",true);
			$(".login-remeber-area").show();
			$(".login-default-area").hide();
			$(".login-change").show();

			$(".login-next").addClass("login-next-adjust");

			//填入帳號
			if( rememberData.isMail ){
				$(".login-ld-email input").val( rememberData.phone );
				$(".login-tab[data-type=email]").trigger("click");
			} else {
				$(".login-ld-phone input").val( rememberData.phone );	//"(" + rememberData.countrycode + ")" + 
			}
		}else{
			// $("#page-registration .login-remeber img").attr("src","images/common/icon/icon_check_gray.png");
			$(".login-remeber").data("chk",false);
			$(".login-remeber-area").hide();
			$(".login-default-area").show();
			$(".login-change").hide();
			$(".login-next").removeClass("login-next-adjust");
		}

		if($.lStorage("_loginAutoChk")){
			$(".login-auto").find("img").attr("src","images/registration/checkbox_check.png");
	    	$(".login-auto").data("chk",true);
	    }
	}
	initLandPage();

	var logoClickCnt = 0;
	$(".registration-logo").click(function(){
		logoClickCnt++;
		if( logoClickCnt>=10 ){
			logoClickCnt = 0;
			if( clearCache() ){
				alert("succ");
			}
		}
	});
}


$(function(){

	//設定語言, 還沒登入先用瀏覽器的語言設定
	updateLanguage( lang );

	checkVersion( onCheckVersionDone );
});