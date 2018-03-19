appInitial = function(needUpdate){
	if( needUpdate ) return;
	resetDB();

	// 定時重新讀取
    if($.lStorage("_appReloadAuth")) {
    	QmiGlobal.auth = $.lStorage("_appReloadAuth");	
    	localStorage.removeItem("_appReloadAuth");
    	
    	QmiGlobal.isAppReload = true;
    	loginAction();

    } else if($.lStorage("_loginAutoChk") === true) {

    	QmiGlobal.auth = $.lStorage("_loginData");
    	loginAction();
  

	} else if( window.location.hash !== "") {
		// window.location = "index.html";
		$.mobile.changePage("")
	}
	
	//首頁大圖
	$("#page-registration").css("height",$(window).height());
	$(window).resize(function(){ 
		$("#page-registration").css("height",$(window).height());
	});

	$(document).on("click",".login-ready:not(.login-waiting)",function(){

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
		var accountPattern = new RegExp("[a-zA-Z0-9\\@\\_\\-\\.]+"); 

		if (isMail) {
			if (phone_id.replace(accountPattern, "").length == 0) {
				$(this).addClass("login-waiting");
				login(phone_id,password,countrycode,isMail);
			} else {
				toastShow($.i18n.getString("LOGIN_FORMAT_CHECK"));
			}
		} else {
			$(this).addClass("login-waiting");
			login(phone_id,password,countrycode,isMail);
		}
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
				cns.log("open"); //, inst
			},
			onClose: function (inst) {
				cns.log("close"); //, inst
			},
			onChange: function (val, inst) {
				cns.debug(val, inst);
				countryCodeDoms.attr("data-val",val);
				console.log(countryCodeDoms.find("option[value='"+val+"']").attr('data-code'))
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
			cns.log("open"); //, inst
		},
		onClose: function (inst) {
			cns.log("close"); //, inst
		},
		onChange: function (val, inst) {
			console.log(val);
			countryCodeDoms.attr("data-val",val||"");
			if( "undefined"!=typeof(checkLoginReady) ) checkLoginReady();
		},
		effect: "slide"
	});

	//set default value
	countryCodeDoms.attr("data-val","TW");
	var loginData = $.lStorage("_loginRemember");
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
			var countryInput = $(".login-ld-countrycode option:selected");
			
			// 拿掉手機驗證
			//var phoneObj = getPhoneNumberObject( phoneInput.val(), countryInput.attr("data-val") );
			// if( phoneObj.isValid && pwdInput.val().length >= 6 ){
			
			if (pwdInput.val().length >= 6 && phoneInput.val() >= 4){
				$("#page-registration .login").addClass("login-ready");

				countrycode = countryInput.attr('data-code');
				var loginData = $.lStorage("_loginRemember");
				loginData.countrycode = countrycode;
				$.lStorage("_loginRemember", loginData);
			} else {
				$("#page-registration .login").removeClass("login-ready");
			}
		} else {
			var pwdInput = $(".login-ld-password input");
			var emailInput = $(".login-ld-email input");
			var email = emailInput.val();
			if( email && email.length>3 ){
				// var isMailCheck = email.replace(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,5}$/,'');
				
				if(pwdInput.val().length >= 6){
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

	$(".login-remember-password input").bind("input",function(){
		if($(this).val().length >= 6){
			$(".login-next").addClass("login-next-ready");
		}else{
			$(".login-next").removeClass("login-next-ready");
		}
	});

	$("#page-registration div.login-remember").click(function(){
		var remember_chk = $(this).data("chk");
		if(remember_chk){
			if( $(this).hasClass("landpage") ){
				$(this).find("img").attr("src","images/registration/checkbox_none.png");
			} else {
				$(this).find("img").attr("src","images/common/icon/icon_check_gray.png");
			}
			remember_chk = false;
		}else{
			if( $(this).hasClass("landpage") ){
				$(this).find("img").attr("src","images/registration/checkbox_check.png");
			} else {
				$(this).find("img").attr("src","images/common/icon/icon_check_gray_check.png");
			}
			remember_chk = true;
		}

		$(this).data("chk",remember_chk);
	});


	$(".login-change").click(function(){
		$(".login-change").data("chk",true);

		$("body").fadeOut();
		setTimeout(function(){
			$("body").fadeIn();
		},100);
		setTimeout(function(){
			$("#page-registration div.login-remember img").attr("src","images/common/icon/icon_check_gray.png");
			$("#page-registration div.login-remember").data("chk",false);
			$(".login-remember-area").hide();
			$(".login-default-area").show();
			$(".login-change").hide();
			$(".login-next").removeClass("login-next-adjust");
		},400);
	});

	$(document).on("click",".login-next-ready:not(.login-waiting)",function(){

		if($.lStorage("_loginRemember") && !$(".login-change").data("chk")){
			var phone_id = $.lStorage("_loginRemember").phone;
			var password = $(".login-remember-password input").val();
		}else{
			var phone_id = $(".login-phone input").val();
			var password = $(".login-password input").val();
		}
		// cns.debug("phone_id:",phone_id,"pw:",password,"countrycode:",countrycode);

		//登入
		login(phone_id,password,countrycode);
	});


	login = function(phoneId,password,countrycode,isMail){
		isMail = isMail || false;

		// 清空資料
		resetDB();

		// 預防錯誤發生
		QmiGlobal.auth = {};

        var bodyData = {
    		// id: (isMail == false) ? countrycode + getInternationalPhoneNumber(countrycode, phoneId) : phoneId,
            id: (isMail == false) ? countrycode + phoneId.replace(/^0/, "") : phoneId,
            tp: 1,//0(Webadm)、1(Web)、2(Phone)、3(Pad)、4(Wear)、5(TV)
            dn: QmiGlobal.device,
            pw:toSha1Encode(password)
    	};
        
        new QmiAjax({
        	apiName: "login",
        	specifiedHeaders: {
	            li:lang
	        },
        	body: bodyData,
        	method: "post"
        }).complete(function(data){
        	var loginDef = $.Deferred();
        	if(data.status == 200){

        		var dataObj = $.parseJSON(data.responseText);
				
				QmiGlobal.auth = dataObj;

				//自動登入儲存 有_loginData 有_loginAutoChk 才代表有選自動登入
                if($(".login-auto").data("chk")) {
                	$.lStorage("_loginData", QmiGlobal.auth);
                	$.lStorage("_loginAutoChk", true);
                } else {
                	$.lStorage("_loginData", false);
                	$.lStorage("_loginAutoChk", false);
                }

        		// SSO 登入
        		if(dataObj.rsp_code === 104 || dataObj.rsp_code === 105) {
        			QmiGlobal.auth.isSso = true;
        			dataObj.id = bodyData.id;
        			dataObj.pw = password;

        			QmiGlobal.ssoLogin(dataObj).done(loginDef.resolve);
        		} else {
        			loginDef.resolve({isSso:false, isSuccess: true});
        		}
        	} else {
        		loginDef.resolve({isSso:false, isSuccess: false});
        	}

        	loginDef.done(function(rspData) {
        		
        		if(rspData.isSuccess === false) {
        			$("#page-registration .login").removeClass("login-waiting");	
        			return;
        		}
        			
        		// 判斷是否換帳號 換帳號就要清db
        		changeAccountToResetDB(phoneId);

    			//記錄帳號密碼
    			if($("#page-registration div.login-remember").data("chk")){
					var _loginRemember = {};
					_loginRemember.phone = phoneId;
					_loginRemember.isMail = isMail;
					// _loginRemember.password = password;
					_loginRemember.countrycode = countrycode;
					$.lStorage("_loginRemember",_loginRemember);
				}else{
					//沒打勾的話就清除local storage
		    		localStorage.removeItem("_loginRemember");
				}

				loginAction();
				
        	});

        }).error(function(){
        	window.errorTest = arguments;
        	cns.debug("login error ",arguments)
        });
	}

	function changeAccountToResetDB(phoneId) {
		var lastId = $.lStorage("_lastLoginAccount") || null;
		if(lastId !== phoneId && lastId !== null) 
			resetDB({removeItemArr: ["_sticker"]});

		// 紀錄上次登入帳號
		$.lStorage("_lastLoginAccount", phoneId);
	}

	//初始化 
    function loginAction() {

        ui = QmiGlobal.auth.ui;
        at = QmiGlobal.auth.at;

    	var isFromLogin = true;

        QmiGlobal.chainDeferred().then(function() {
        	return userInfoGetting();
        }).then(function() {
        	// 開啟chatDB
			var deferred = $.Deferred();
			initChatDB(deferred.resolve); 
	    	return deferred.promise();
		}).then(function() {
        	return getGroupList(isFromLogin);
        }).then(function(rspData) {
        	var deferred = $.Deferred();
        	var group_list = [];

        	if(rspData.isSuccess === false) {
        		deferred.resolve(rspData);
        		return deferred.promise();
        	}

        	var groupList = rspData.gl;
        	var specifiedGi = QmiGlobal.auth.dgi;
        	if($.lStorage("groupChat")){
        		groupChat = $.lStorage("groupChat");
		    	$.each(groupChat,function(key,value){
		    		try {
		    			if(key === "undefined" || !QmiGlobal.groups[key] || Object.keys(QmiGlobal.groups[key]).length === 0) return;

			    		getGroupComboInit(key);
			    		QmiGlobal.groups[key].chatAll = value;
			    		$.each(value,function(ci,item){
			    			openChatWindow(key,ci);
			    		})
		    		} catch(e) {}
		        });
		    	localStorage.removeItem("groupChat");
        	}
        	
        	// 取dgi的combo
            if( (groupList || []).length > 0 ){

            	// 定時重新整理 為了健康
            	if(QmiGlobal.isAppReload === true) {

            		specifiedGi = QmiGlobal.auth.appReloadObj.gi; 

            	//有dgi 但不存在列表裡
                } else if( QmiGlobal.auth.dgi === undefined || QmiGlobal.groups[QmiGlobal.auth.dgi] === undefined ){
                	localStorage.removeItem("uiData");
                	
                    QmiGlobal.auth.dgi = groupList[0].gi;
                    $.lStorage("_loginData",QmiGlobal.auth);

                    specifiedGi = QmiGlobal.auth.dgi;
                }

                getGroupComboInit(specifiedGi).done(function(resultObj){

                	if(resultObj.status === false){
                		//sso 取消
                		if(resultObj.data.isReAuthCancel === true){
                			cns.debug("sso reAuth 取消");	
                			var errCode = "code:E0000401";
                		} else {
                			var errCode = "code:E0000402";
                		}

                		new QmiGlobal.popup({
							desc: $.i18n.getString("WEBONLY_ERROR_OCCURED_RELOGIN") +"<br>"+ errCode,
							confirm: true,
							action: [reLogin]
						});

                		//發生錯誤 回首頁比較保險
                		// reLogin();
                	} else {
                		deferred.resolve({dgi: specifiedGi, location:"#page-group-main"});
                	}
                });
                
            } else{
                //沒group
                deferred.resolve({location:"#page-group-menu"});
            }

            return deferred.promise();
        }).then(function(rspData){
        	s_load_show = false;
        	QmiGlobal.ajaxLoadingUI.hide();

        	setTimeout(function() {
        		$("#page-registration .login").removeClass("login-waiting");
        	}, 1000);

        	// return
        	if(rspData.isSuccess === false) return;

            $.lStorage("refreshChk", false);
            // localStorage["uiData"] = JSON.stringify(QmiGlobal.groups);
            $.mobile.changePage(rspData.location);
            
			//聊天室開啓DB
			QmiGlobal.chainDeferred().then(function() {
				// 非同步沒關係
				var allGroups = Object.keys(QmiGlobal.groups);

				// 預設團體打過了，從陣列移除掉
				allGroups.splice(allGroups.indexOf(QmiGlobal.auth.dgi), 1);

        		getMultiGroupCombo(allGroups, true);

		    	activateClearChatsTimer();

		    	initChatCntDB(); 

				updateAlert(isFromLogin);
				
				//沒團體的情況
				if(Object.keys(QmiGlobal.groups).length == 0 || !QmiGlobal.auth.dgi || QmiGlobal.auth.dgi==""){
					//關閉返回鍵
					$("#page-group-menu .page-back").hide();
					// 兩個選項都要執行polling()
					polling();

					if (QmiGlobal.auth.isSso) $(".no-group-lock").show();
				}else{
					//設定目前團體 執行polling()
					setGroupInitial(rspData.dgi).done(polling);
				}
			});
        });
    }

    // LDAP SSO
    QmiGlobal.ssoLogin = function(ssoObj) {
    	var deferred = $.Deferred();
    	var webSsoDeviceStr = "web_sso_device";

    	// sso 登入
		new QmiAjax({
            url: "https://" + ssoObj.url + "/apiv1/sso/clouds/"+ ssoObj.cdi +"/companies/"+ ssoObj.ci +"/login",
            specifiedHeaders: { li: lang },
            body: {
			   id: ssoObj.id,
			   tp: "1",
			   dn: webSsoDeviceStr,    
			   pw: QmiGlobal.aesCrypto.enc(ssoObj.pw, (ssoObj.id +"_"+ webSsoDeviceStr).substring(0,16)),
			   uui: ssoObj.uui
			},
            method: "post",
            error: function(errData){
                deferred.resolve({
                	isSuccess: false,
                	data: errData
                });
            }
        }).done(function(rspData) {
        	var rspObj = JSON.parse(rspData.responseText);
        	try { 
        		var ssoKey = rspObj.key;
        	} catch(e) { 
        		var ssoKey = ""; 
        	}

        	ssoObj.key = ssoKey;

        	if (rspObj.rsp_code == 106) {
        		$("#page-registration .login").removeClass("login-waiting");
        		setFirstCompanyAccountPassword(ssoObj);
        	} else {
        		new QmiAjax({
		        	apiName: "cert",
		        	apiVer: "apiv2",
		        	isPublic: true,
		        	isSso: true,
			        specifiedHeaders: {
			            li:lang
			        },
		        	body: {
					  ui: ssoObj.uui,
					  key: ssoKey,
					  tp: "1",
					  dn: QmiGlobal.device,
					  ci: ssoObj.ci,
					  cdi: ssoObj.cdi
					},
		        	method: "post",
		        	error: function(errData){
		                deferred.resolve({
		                	isSuccess: false,
		                	data: errData
		                });
		            }
		        }).done(function(data){
		        	var dataObj = JSON.parse(data.responseText);
		        	QmiGlobal.auth.ui = dataObj.ui;
		        	QmiGlobal.auth.at = dataObj.at;
		        	QmiGlobal.auth.et = dataObj.et;
		        	// 保險用
		        	QmiGlobal.auth.cl = ssoObj.url;

		        	// 先存起來
		        	QmiGlobal.auth.passwordTp = dataObj.tp;

		        	// 存入QmiGlobal.auth的ui和at，需要reload時才不會打api失敗
		        	if($(".login-auto").data("chk")) {
	                	$.lStorage("_loginData", QmiGlobal.auth);
	                }

		        	// // sso 初始值
		        	// QmiGlobal.companies[QmiGlobal.auth.ci] = QmiGlobal.auth;
		        	// QmiGlobal.companies[QmiGlobal.auth.ci].nowAt = dataObj.at;
	          		// QmiGlobal.companies[QmiGlobal.auth.ci].passwordTp = dataObj.tp;

					deferred.resolve({isSuccess: true});
		        });
        	}
        });
        return deferred.promise();
    }

    function setFirstCompanyAccountPassword(ssoData) {

    	var deferred = $.Deferred();
    	QmiGlobal.PopupDialog.create({
			header: "<div class='alert'><img src='images/registration/symbols-icon_warning_ldap.png'>"
				+ "<h2>" + $.i18n.getString("ENTERPRISE_ACCOUNT_PASSWORD_SETTING") + "</h2><p>" 
				+ $.i18n.getString("ENTERPRISE_ACCOUNT_FIRSTTIME_RESET") +"</p>",

			input: [{
				type: "password",
				className: "input-password password",
				hint: "ENTERPRISE_ACCOUNT_SET_PASSWORD",
				maxLength : 10,
				eventType: "input",
				eventFun: function (e) {
					checkPasswordAreMatch(e, "confirm");
				}
			},{
				type: "password",
				className: "input-password password-again",
				hint: "ENTERPRISE_ACCOUNT_SET_PASSWORD_AGAIN",
				maxLength : 10,
				eventType: "input",
				eventFun: function (e) {
					checkPasswordAreMatch(e, "confirm");
				}
			}],
			errMsg: {
	            text: "ENTERPRISE_ACCOUNT_SET_PASSWORD_NOT_MATCH",
	            className: "error-message"
	        },
			buttons: {
				confirm: {
					text : "ENTERPRISE_ACCOUNT_DONE",
					className: "confirm",
					eventType : "click",
					eventFun : function (callback) {
						var firstPwInput = $("#popupDialog").find(".password input").val();
						var secondPwInput = $("#popupDialog").find(".password-again input").val();

						if (firstPwInput !== secondPwInput) {
							$("#popupDialog").find(".error-message").css("opacity", 1);
						} else {
							$("#popupDialog").find(".error-message").css("opacity", 0);
							new QmiAjax({
					        	url: "https://" + ssoData.url + "/apiv1/company_accounts/" + ssoData.ci + "/users/password_first",
					        	method: "put",
					        	specifiedHeaders: { li: lang },
					        	body: {
								    id : ssoData.id,
								    key : ssoData.key,
								    np : QmiGlobal.aesCrypto.enc(firstPwInput, (ssoData.id + "_" + QmiGlobal.device).substring(0, 16)),
								    dn : QmiGlobal.device,
								    uui : ssoData.uui,
								}
					        }).done(function(rspData) {
					        	console.log(ssoData)
					        	var rspObj = JSON.parse(rspData.responseText);
					        	if (rspData.status == 200) {
					        		// popupShowAdjust(
					        		// 	null, 
					        		// 	rspObj.rsp_msg, 
					        		// 	$.i18n.getString("LANDING_PAGE_LOGIN"), 
					        		// 	true, 
					        		// 	[login.bind(this, ssoData.id, firstPwInput, countrycode, true)]
					        		// );
                                    QmiGlobal.PopupDialog.close();

                                    // 修改成功直接登入首頁
                                    login(ssoData.id, firstPwInput, countrycode, true);
                                }
					        });
						}
					}
				}
			}
		}).open();

		deferred.promise();
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


	$("#page-register .register-text span").html( $.i18n.getString("REGISTER_ACCOUNT_POLICY", "<div class='register-policy user-agreement'>", "</div>", "<div class='register-policy privacy-policy'>", "</div>") );
	
	$(".user-agreement").on("click",function(e){
		window.open("user_agreement.html", "" , "width=600, height=600");
	});

	$(".privacy-policy").on("click",function(e){
		window.open("privacy_policy.html", "" , "width=600, height=600");
	});

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
		var thisDom = $(".register-phone input");
		cns.debug("[checkRegisterPhone]");
		thisDom.val(thisDom.val().replace(/[^-_0-9]/g,''));
		var this_register = thisDom.parent();
		var countryCodeDoms = $('#page-register .countrycode select');
		var tmpCountryCode = countryCodeDoms.attr("data-val");

		// 拿掉手機驗證
		// var phoneObj = getPhoneNumberObject( this_dom.val(), tmpCountryCode );
		// if( phoneObj.isValid ){
		countryCodeDoms.attr("data-countryCode", countryCodeDoms.find("option:selected").attr("data-code"));
		countryCodeDoms.attr("data-nationalNum", thisDom.val());
		this_register.find("img").show();
		$(".register-next").data("textChk", true );

		if( true==$(".register-next").data("chk") ){
			$(".register-next").addClass("register-next-ready");
		}
		// } else {
		// 	this_register.find("img").hide();
		// 	$(".register-next").data("textChk", false );
		// 	$(".register-next").removeClass("register-next-ready");
		// }
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
			// 	var loginData = $.lStorage("_loginRemember");
			// 	loginData.countrycode = newCountryCode;
			// 	$.lStorage("_loginRemember", loginData);
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

		if($(this).val().length == 6){
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
			&& (p1.length>=8 && p1.length<=20)
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
	// $("input.setting-birth-hidden").datetimepicker({
 //        maxDate:'+1970/01/02',
 //        value:'631152012',
 //        timepicker:false,
 //        format:'unixtime',
 //        onChangeDateTime: function() {
 //        	var unixtime = $("input.setting-birth-hidden").val();
 //        	var time = new Date($("input.setting-birth-hidden").val()*1000);
	// 		// var time_format = time.customFormat( "#YYYY# 年 #M# 月 #D# 日" );
	// 		var time_format = time.toLocaleDateString();
 //        	$(".setting-birth input").val(time_format);

 //        	if($(".setting-full-name input").val().length > 0){
	// 			$(".setting-next").addClass("setting-next-ready");
	// 		}else{
	// 			$(".setting-next").removeClass("setting-next-ready");
	// 		}
 //        }
 //    });

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


    $(".setting-full-name input").bind("input",function(){
		if ($(".setting-full-name input").val().length > 0
			// && $(".setting-birth input").val()
		) {
			$(".setting-next").addClass("setting-next-ready");
		} else {
			$(".setting-next").removeClass("setting-next-ready");
		}
	});


    $(document).on("click",".setting-next-ready",function(){
    	//有上傳圖檔 圖檔上傳完畢之後再做註冊步驟3
    	if(!$(".avatar-area img").hasClass("avatar-default")){
    		avatarToS3($(".avatar-file")[0].files[0]);
    	}else{
    		var fullName = $(".setting-full-name input").val();
	    	var birth = $(".setting-birth-hidden").val()*1000;

	    	//姓名暫時先顛倒
	    	activateStep3(fullName, birth);
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
			var phoneNumber = $(".register-phone input").val();
			$(document).data("phone-id", countrycode + phoneNumber.replace(/^0/, ""));	
		}
		
        var api_name = "registration";
        var headers = {
                 "li":lang,
                     };
        var method = "post";
        var body = {
                id: $(document).data("phone-id"),
                tp: 0,
                ud: QmiGlobal.device
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
	                QmiGlobal.ajaxLoadingUI.hide();
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

		new QmiAjax({
        	apiName: "activation/step1",
        	specifiedHeaders: {
	            li:lang
	        },
        	body: {
        		id: $(document).data("phone-id"),
                vc: otpCode,
                ud: QmiGlobal.device
        	},
        	errHide: true,
        	isLoadingShow: true,
        	method: "put",
        	error: function(jqXHR, textStatus, errorThrown) {
		    	try{
		    		if(jqXHR.status == 400){
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
					}
		    	} catch(e){
					cns.debug( e.message );
				}
		    }
        }).complete(function(data){
        	//清除db
        	resetDB({removeItemArr: ["_sticker"]});

        	$(".register-otp-input input").val("");

        	$(".register-otp-input input").trigger("input");
        	$(".resend-otp").addClass("resend-otp-ready");

        	if(data.status !== 200) return;
        	
    		popupShowAdjust("",$.parseJSON(data.responseText).rsp_msg,true,false,[changePageAfterPopUp,"#page-password"]);
        });
	}

	onRewriteRegitration = function(otpCode){
		new QmiAjax({
        	apiName: "activation/unbind",
        	specifiedHeaders: {
	            li:lang
	        },
        	body: {
        		id: $(document).data("phone-id"),
	            ud: QmiGlobal.device,
	            vc: otpCode
        	},
        	isLoadingShow: true,
        	method: "post"

		}).complete(function(data){
        	
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

		new QmiAjax({
        	apiName: "activation/step2",
        	specifiedHeaders: {
	            li:lang
	        },
        	body: {
        		id: $(document).data("phone-id"),
                tp: 1,//多裝置代碼 0(Webadm)、1(Web)、2(Phone)、3(Pad)、4(Wear)、5(TV)
                ud: QmiGlobal.device,
                pw: toSha1Encode($(document).data("password"))
        	},
        	isLoadingShow: true,
        	method: "put"
        	
		}).complete(function(data){
        	cns.debug("變更密碼後的 data:",data);
        	if(data.status == 200){
        		var data = $.parseJSON(data.responseText);
        		//default
        		
        		QmiGlobal.auth = data;

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

	activateStep3 = function(fullName, birth){

		new QmiAjax({
        	apiName: "activation/step3",
        	body: {
        		id: $(document).data("phone-id"),
                tp: 0,
                ud: QmiGlobal.device,
                nk: fullName,
        	},
        	isLoadingShow: true,
        	method: "put"
        	
		}).complete(function(data){
        	//loading icon off
			s_load_show = false;
			$('.ui-loader').hide();
        	cns.debug("資料設定後的 data:",data);
        	if(data.status == 200){
        		//登入成功 記錄帳號密碼
				var _loginRemember = {};
				_loginRemember.isMail = false;
	    		_loginRemember.phone = "0" + $(document).data("phone-id").substring(4);
	    		_loginRemember.password = $(document).data("password");
	    		_loginRemember.countrycode = countrycode;
	    		$.lStorage("_loginRemember",_loginRemember);

				//儲存登入資料 跳轉到timeline
				var _loginData = {
					"ui": QmiGlobal.auth.ui,
					"at": QmiGlobal.auth.at
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
            ui: QmiGlobal.auth.ui,
			at: QmiGlobal.auth.at,
            li:lang
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
							                        "ui": QmiGlobal.auth.ui,
									                "at": QmiGlobal.auth.at, 
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
							                    		var fullName = $(".setting-full-name input").val();
												    	var birth = $(".setting-birth-hidden").val()*1000;

												    	activateStep3(fullName, birth);

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
		loginAction();
	}
	
	initLandPage = function(){
		//若local storage 有記錄密碼 就顯示
		var rememberDom = $("#page-registration div.login-remember");
		var rememberData = $.lStorage("_loginRemember");
		if(rememberData){
			//順便幫他打個勾
			rememberDom.find("img").attr("src","images/registration/checkbox_check.png");
			rememberDom.data("chk",true);
			$(".login-remember-area").show();
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
		} else {
			// $("#page-registration .login-remember img").attr("src","images/common/icon/icon_check_gray.png");
			rememberDom.data("chk", false);
			$(".login-remember-area").hide();
			$(".login-default-area").show();
			$(".login-change").hide();
			$(".login-next").removeClass("login-next-adjust");

			rememberDom.click();
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
				// alert("succ");
			}
		}
	});
}

