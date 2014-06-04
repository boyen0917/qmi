$(function(){  

	// url參數 clear 存在 就清 local storage
    clear = $.getUrlVar('clear');
    if(clear == 123456) {

    	localStorage.clear();
	}

	//沒宣告就會變成 global 我已經勸過前輩不要這樣寫
	// var ui,at,gi,gu,gn,gd,ga,gm,ti_cal,ti_feed,ti_chat,device_token,zoom_out_cnt,zoom_in_cnt,filter_name,
	// group_list,default_group,group_name,post_tmp_url,activityTimeout,
	// timeline_type,data_group_user;
	
	$(".main").css("width",$(window).width());
	$(".main").css("height",$(window).width()*proportion);
	$(".main-contact-l").css("height",$(window).height()-186);
	$(window).resize(function(){ 
		$(".main").css("width",$(window).width());
		$(".main").css("height",$(window).width()*proportion);
		$(".main-contact-l").css("height",$(window).height()-186);
	});
	
	$(".popup-screen").click(function(){
	    $(".popup").hide();
	    $(".popup-screen").hide();
	});
	
	$(".popup-close").click(function(){
		$(".popup-screen").trigger("click");
		$(".popup-close").trigger("pageChange");
		$(".popup-close").trigger("reload");
	});
	
	$(".popup-close-cancel").click(function(){
	    $(".popup-screen").trigger("click");
	});
	
	$.ajaxSetup ({
	    // Disable caching of AJAX responses
	    cache: false
	});
	
	$(document).ajaxSend(function() {

		console.log("ajax send! count : " + ajax_count);
		ajax_count++;

		//顯示 loading
		if(!load_show) return false;
		
	    if(!$('.ui-loader').is(":visible"))
		$('.ui-loader').css("display","block");
	});
	$(document).ajaxComplete(function(data) {
		$('.ui-loader').hide();
		$(document).trigger("click");
	});
	
	$(document).ajaxError(function(e, jqxhr, ajaxSettings) {
		//logout~
		
		popupShowAdjust("發生錯誤 請重新登入");
		popupAfterChangePage("#page-login")
		console.log(jqxhr.responseText);
		console.log(jqxhr.status);
		console.log(ajaxSettings);
	//	{"rsp_code":999,"rsp_msg":"參數不完整"}
	//	400 
	});
	
	//上一頁功能
	$("#page-back-chk").html(window.location.hash);
	$(document).on("pagebeforeshow",function(event,ui){
	    $("#page-back-chk-pre").html($("#page-back-chk").html());
	    $("#page-back-chk").html(window.location.hash);
	    $("#page-back-pre-title").html($($("#page-back-chk-pre").html() + " div[data-role=header] h3").html());
	    
	    //timeline detail 換頁前寫資料進去
//	    if(window.location.hash == "#page-timeline-detail"){
//	    	timelineDetailWrite(timeline_type);
//	    }
	});
	
	$(".page-back").click(function(){
		$.mobile.changePage($("#page-back-chk-pre").html(), {transition: "slide",reverse: true});
		$($("#page-back-chk-pre").html() + " div[data-role=header] h3").html($("#page-back-pre-title").html());
	});
	
	//----------------------------------- 登入 ---------------------------------------------

	
	//若local storage 有記錄密碼 就顯示
	if($.lStorage("_loginInfo")){
		console.log(12313);
		console.log($.lStorage("_loginInfo"));
		$("#phone").val($.lStorage("_loginInfo").phone);
		$("#code").val($.lStorage("_loginInfo").code);

		//順便幫他打個勾
		$(".login-radio img").show();
	}else{
		$(".login-radio img").hide();
	}


	//login打勾
	$(".login-remember").click(function(e){
	    $(".login-radio img").toggle();
	});
	//login
	$("#login").click(function(){
		var id = country_code + $("#phone").val().substring(1);
	    //登入認證
	    var api_name = "login";
	    var headers = {
	        "id":id,
	        "up":toSha1Encode($("#code").val()), 
	        "ns":"",
	        "li":"zh_TW"
	    };
	    var method = "post";
	    console.log(headers);
	    var result = ajaxDo(api_name,headers,method,true);
	    console.log(result);
	    result.complete(function(data){
	        if(data.status != 200){
	        	popupShowAdjust("帳號或密碼不對");
	        }else{

	        	//登入成功 若有勾選記錄帳號 就記在local storage裏
	        	if($(".login-radio img").is(":visible")){
	        		var _loginInfo = {};
	        		_loginInfo.phone = $("#phone").val();
	        		_loginInfo.code = $("#code").val();
	        		$.lStorage("_loginInfo",_loginInfo);
	        	}else{
	        		//沒打勾的話就清除local storage
	        		localStorage.removeItem("_loginInfo");
	        	}


	        	ui = $.parseJSON(data.responseText).ui;
	            at = $.parseJSON(data.responseText).at;
	            console.log(ui);
	            console.log(at);
	        	
	            //取得團體列表
	            var api_name = "groups";
	            var headers = {
	                "ui":ui,
	                "at":at,
	                "li":"zh_TW"
	            };
	            var method = "get";
	            var result = ajaxDo(api_name,headers,method,true);
	            result.complete(function(data){
	            	//所有團體列表
	            	group_list = $.parseJSON(data.responseText).gl;

	                if( group_list.length == 0 )
	                {
	                	$.mobile.changePage("#page-helper");
	                } else {
	                	
	                	//上次點選團體
	                	if($.lStorage(ui)){
	                		var _groupList = $.lStorage(ui);
	                		var dgi = _groupList.default_gi;
	                		var defaultGroup = _groupList[dgi];
	                		
	                		gi = dgi;
	                		gu = defaultGroup.gu;
	                		gn = defaultGroup.gn;
	                		ti_cal = defaultGroup.ti_cal;
	                		ti_feed = defaultGroup.ti_feed;
	                		ti_chat = defaultGroup.ti_chat;
	                		
	                	}else{
	                		
	                		//預設團體暫定為第一個團體？
		                	var default_group = group_list[0];
		                	$.each(default_group.tl,function(i,val){
		                		if(val.tp == 1){
		                			ti_cal = val.ti;
		                		}else if(val.tp == 2){
		                			ti_feed = val.ti;
		                		}else{
		                			ti_chat = val.ti;
		                		}
		                	});
		                	
		                	gi = default_group.gi;
	                		gu = default_group.me;
	                		gn = default_group.gn;
	                		
	                		//存入localstorage
	                		var _groupList = {"default_gi":gi};
	                		_groupList[gi] = {"gu":gu,"gn":gn,"ti_cal":ti_cal,"ti_feed":ti_feed,"ti_chat":ti_chat};
	                		$.lStorage(ui,_groupList);
	                	}
	                	
	                	//header 設定團體名稱
	                	$(".header-group-name div:eq(1)").html(gn);
	                	
	                	//sidemenu name
	                	setSmUserData(gi,gu,gn);
	                	
	                	//動態消息
	                	timelineListWrite();
	                	$.mobile.changePage("#page-group-main", {transition: "pop"});
	                }
	            });
	        }
	    });
	});
	
	


	//----------------------------------- 註冊 --------------------------------------------- 
	//register打勾
	$(".register-radio").click(function(){
	    $(".register-radio img").toggle();
	});
	
	//註冊頁面點選下一步 送出驗證碼
	$("#register-next").click(function(){
		if(!$("#r-phone").val()){
			popupShowAdjust("請輸入電話號碼");
			return false;
	    }else if($(".register-radio img").css("display") == "none"){
	        popupShowAdjust("請勾選\"看過並同意使用條款及隱私政策\"");  
	        return false;
	    }else{
	    	$(".register-desc-area h1").html($("#r-phone").val());
	    	
	    	//亂數device token
	    	var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
		    var string_length = 8;
		    var randomstring = '';
		    for (var i=0; i<string_length; i++) {
		        var rnum = Math.floor(Math.random() * chars.length);
		        randomstring += chars.substring(rnum,rnum+1);
		    }
		    device_token = "web-" + randomstring;
		    //取得otp驗證碼
	    	var api_name = "register/otp";
	    	var headers = {
	    		"cc":"+886",
				"pn":$("#r-phone").val().substring(1), 
				"di":device_token,
				"li":"zh_TW"
	    	};
	    	var method = "get";

	    	console.log(headers);
	    	var result = ajaxDo(api_name,headers,method,true);
	    	result.complete(function(data){
	    		console.log(data);
	    		if(data.status != 200){
	    			popupShowAdjust("電話號碼錯誤");
	    		}else{
	    			$.mobile.changePage("#page-register-auth");
	    		}
	    	});
	    	
	    }
	});
	
	//認證頁面點選下一步
	$("#register-auth-next").click(function(){
	    if(!$("#otp").val()){
	        popupShowAdjust("驗證碼輸入錯誤，請輸入正確的驗證碼。");                        
	        $(".resend-otp-close").hide();
	        $("#resend-otp").css("display","block");
	        return false;
	    }else{
	   	    //驗證otp
	        var api_name = "register/otp";
	        var headers = {
	            "cc":"+886",
	            "pn":$("#r-phone").val().substring(1), 
	            "di":device_token,
	            "op":toSha1Encode($("#otp").val()),
	            "li":"zh_TW"
	        };
	        var method = "post";
	        //非同步
	        var result = ajaxDo(api_name,headers,method,true);
	        result.complete(function(data){
	            if(data.status != 200){
	            	$(".resend-otp-close").hide();
	                $("#resend-otp").css("display","block");
	                popupShowAdjust("驗證碼錯誤");
	            }else{
	            	ui = $.parseJSON(data.responseText).ui;
	                at = $.parseJSON(data.responseText).at;
	                $.mobile.changePage("#page-password");
	                }
	            });
	        }
	    });
	    
	  //重送驗證碼
	$("#resend-otp").click(function(){
		//取得otp驗證碼
	    var api_name = "register/otp";
	    var headers = {
			"cc":"+886",
	        "pn":$("#r-phone").val().substring(1), 
	        "di":device_token,
	        "op":toSha1Encode($("#otp").val()),
	        "li":"zh_TW"
	    };
	    var method = "get";
	    ajaxDo(api_name,headers,method,true);
	    popupShowAdjust("驗證碼已送出。");
	    $("#resend-otp").css("display","none");
	});
	
	//密碼設定
	$("#pw-send").click(function(){
	    if(($("#pw-setting").val() != $("#pw-setting-c").val()) || $("#pw-setting").val().length < 6){
	    	popupShowAdjust();
	        return false;
	    }else{
	    	var api_name = "me/password";
	        var headers = {
	            "ui":ui, 
				"at":at,
				"li":"zh_TW",
				"up":toSha1Encode($("#pw-setting").val()),
				"id":"+886" + $("#r-phone").val().substring(1), 
				"ns":"", 
				"op":toSha1Encode($("#otp").val())
	        };
	        var method = "put";
	        //非同步 才能取值
	        var result = ajaxDo(api_name,headers,method,true);
	        result.complete(function(data){
	            if(data.status != 200){
	                popupShowAdjust("密碼輸入錯誤。");
	            }else{
	            	popupShowAdjust("密碼變更完成。");
	                popupAfterChangePage("#page-helper");
	            }
	        });
	    }
	});
	//----------------------------------- 團體選單 ---------------------------------------------                
	//團體選單 點選團體
	$(document).on('click','.group-list-box',function(e){
	    $.mobile.changePage("#page-group-main");
	});
	
	//團體選單 點選nav
	$("#group-nav-area li a").click(function(){
	    var act = $(this).data("group-act");
	    $(".group-nav-chk").each(function(i,val){
	        if($(this).data("group-act") == act){
	            $(this).fadeIn();
	            //個別的動作
	            switch (act) {
	                case "gl": 
	                    groupMenuListArea();
	                  break;
	                case "gc": 
	                    $(".group-create-area").find("input").val("");
	                    $(".group-create-area").find("textarea").val("");
	                  break;
	                case "gj":
	                  break;
	                case "gi":
	                  break;
	            }
	        }else{
	            $(this).hide();
	        }
	    });
	});
	
	//創建團體 建立
	$("#gm-create-submit").click(function(){
		if(!$("#group-name").val()){
	        popupShowAdjust("團體名稱不可空白");
	        return false;
		}else{
	        var api_name = "groups";
            var headers = {
                "ui":ui,
                "at":at,
                "li":"zh_TW",
            };
            var body = {
           		"gn":$("#group-name").val(),
                "gd":$("#group-desc").val()
            }
            var method = "post";

	        var result = ajaxDo(api_name,headers,method,true,body);
	        result.success(function(data){
	            popupShowAdjust("創建成功。");
	            popupAfterChangePage("#page-group-main");			
	        });
		}
	});
	//----------------------------------- 小幫手 ---------------------------------------------
	//小幫手 創建團體
	$(".hg-create").click(function(){
		$("#group-nav-area li a[data-group-act=gc]").trigger("click");
		$("#group-nav-area li a[data-group-act=gc]").addClass("ui-btn-active");
		$.mobile.changePage("#page-group-menu");
	});
	//小幫手 加入團體
	$(".hg-join").click(function(){
		$("#group-nav-area li a[data-group-act=gj]").trigger("click");
		$("#group-nav-area li a[data-group-act=gj]").addClass("ui-btn-active");
	    });
	  //小幫手 邀請團體  側邊選單
	$(".hg-invited").click(function(){
	    $("#group-nav-area li a[data-group-act=gi]").trigger("click");
	    $("#group-nav-area li a[data-group-act=gi]").addClass("ui-btn-active");
	    $.mobile.changePage("#page-group-menu");
	});




/*


 ######  #### ########  ######## ##     ## ######## ##    ## ##     ## 
##    ##  ##  ##     ## ##       ###   ### ##       ###   ## ##     ## 
##        ##  ##     ## ##       #### #### ##       ####  ## ##     ## 
 ######   ##  ##     ## ######   ## ### ## ######   ## ## ## ##     ## 
      ##  ##  ##     ## ##       ##     ## ##       ##  #### ##     ## 
##    ##  ##  ##     ## ##       ##     ## ##       ##   ### ##     ## 
 ######  #### ########  ######## ##     ## ######## ##    ##  #######  
	

*/


	$(".side-menu-btn").click(function(){
	    $( "#side-menu" ).panel( "open");
	});
	
	//用戶區
	//detect page changing
	$("#side-menu").on("panelbeforeopen",function(){
	    //timeline固定右邊頁面
	    $("#page-group-main .ui-panel-content-wrap").addClass("page-fixed");
	    
		//計數
		//$("div[data-sm-act=feed] .sm-count").show();
		//$(".sm-group-area .sm-count").show();
		
		//調整頭像大小
		var img = $(".sm-user-pic img");
		mathAvatarPos(img,img.width(),img.height(),avatar_size);
		
		//改做法 打開左側選單時 不load團體列表 改在timeline讀取時load
		//groupMenuListArea();
	});
	
	$("#side-menu").on( "panelbeforeclose", function() {
		//timeline固定右邊頁面
	    $("#page-group-main .ui-panel-content-wrap").removeClass("page-fixed");
	});
	//開關團體列表
	$(".sm-group-switch").click(function(){
		$(".sm-switch-ui-adj").removeClass("sm-switch-ui-adj-show");
		$(".sm-group-list-area-add").slideToggle(
			function(){
				if($(".sm-group-list-area-add").is(":visible")){
					$(".sm-group-switch").find("img").attr("src","images/side_menu/sidemenu_slidedown_icon_none.png");
				}else{
					$(".sm-group-switch").find("img").attr("src","images/side_menu/sidemenu_slidedown_icon_click.png");	
				}
			}
		);
	});
	
	//按鈕效果
	$(document).on("click",".sm-small-area,.sm-group-area,.sm-group-cj-btn",function(){
		var icon_default = "images/side_menu/sidemenu_icon_";
		var target = $(this);
		console.debug("target:",target);
		//開關按鈕ui變化
		if($(".sm-group-list-area-add").is(":visible") ){
			if(target.data("switch-chk") == "check2"){
				$(".sm-switch-ui-adj").addClass("sm-switch-ui-adj-show");
			}
	    }else{
	    	if(target.data("switch-chk") == "check"){
	            $(".sm-switch-ui-adj").addClass("sm-switch-ui-adj-show");
	        }
	    }
		
		target.addClass("sm-click-bg");
		target.find(".sm-small-area-l img").attr("src",icon_default + target.data("sm-act") + "_click.png");
		mainActionSwitch(target.data("sm-act"));
			
	});
	
	
	
	//按鈕效果
	$(document).on("mouseup",".sm-small-area,.sm-group-area,.sm-group-cj-btn",function(){
		var icon_default = "images/side_menu/sidemenu_icon_";
		var target = $(this);
	    setTimeout(function(){

	    	//mouseup了 左側選單 團體調整線 直接刪除就好了 
	    	$(".sm-switch-ui-adj").removeClass("sm-switch-ui-adj-show");
	    	// //開關按鈕ui變化
	    	// if($(".sm-group-list-area-add").is(":visible") ){
	     //        if(target.data("switch-chk") == "check2"){
	     //        	console.debug("??");
	     //            $(".sm-switch-ui-adj").removeClass("sm-switch-ui-adj-show");
	     //        }
	     //    }else{
	     //    	console.debug("第三個團體的區域看不見");
	     //        if(target.data("switch-chk") == "check"){
	     //        	console.debug("！！");
	     //            $(".sm-switch-ui-adj").removeClass("sm-switch-ui-adj-show");
	     //        }
	     //    }
	    	target.removeClass("sm-click-bg");
	    	target.find(".sm-small-area-l img").attr("src",icon_default + target.data("sm-act") + ".png");
	    	},500);
	});
	
	//更換團體 重新設定 gi gu gn tl
	$(document).on("click",".sm-group-area",function(){
		
		gi = $(this).attr("data-gi");
		gu = $(this).attr("data-gu");
		gn = $(this).find(".sm-group-area-r").html();
		
		//header 設定團體名稱
    	$(".header-group-name div:eq(1)").html(gn);
		
		$.each(group_list,function(g_i,g_val){
			if(g_val.gi == gi){
				$.each(g_val.tl,function(t_i,t_val){
					if(t_val.tp == 1){
            			ti_cal = t_val.ti;
            		}else if(t_val.tp == 2){
            			ti_feed = t_val.ti;
            		}else{
            			ti_chat = t_val.ti;
            		}
				});
			}
		});
		
		//點選團體 記錄在localstorage 以便下次登入預設
		var _groupList = $.lStorage(ui);
		if(typeof(_groupList[gi]) == "undefined"){
			_groupList[gi] = {};
    	}
		//更新預設團體gi
		_groupList.default_gi = gi;
		_groupList[gi].gu = gu;
		_groupList[gi].gn = gn;
		_groupList[gi].ti_cal = ti_cal;
		_groupList[gi].ti_feed = ti_feed;
		_groupList[gi].ti_chat = ti_chat;
		
		//存回
		$.lStorage(ui,_groupList);
		
		setSmUserData(gi,gu,gn);
		mainActionSwitch("feed");
	});
	
	
	
	//----------------------------------- timeline ---------------------------------------------  
	$(".st-navi-area [data-st-navi-group=navi]").click(function(){
		var img_dir = "images/timeline/timeline_tab_icon_";
		var subarea = $(".st-navi-area [data-st-navi-group=navi]");
		var subarea_this = $(this);
		subarea.find("div").removeClass("color-white");
		$(".st-navi-area [data-st-navi-group=navi]").each(function(i,val){
	        //全關 switch開
			$(this).find("img").attr("src",img_dir + $(this).data("st-navi") + ".png");
	    });
		switch($(this).data("st-navi")){
	    	case "home":
	    		 $(".st-navi-tridiv-r").show();
	    		 $(".st-navi-tridiv-l").hide();
	    		 subarea_this.find("img").attr("src",img_dir + "home_white.png");
	    		 subarea_this.find("div:eq(0)").addClass("color-white");
	          break;
	    	case "announcement":
	    		$(".st-navi-tridiv-l").show();
	    		$(".st-navi-tridiv-r").hide();
	    		subarea_this.find("img").attr("src",img_dir + "announcement_white.png");
	    		subarea_this.find("div:eq(0)").addClass("color-white");
	          break;
	    	case "feedback":
	    		$(".st-navi-tridiv-l").show();
	    		$(".st-navi-tridiv-r").hide();
	    		subarea_this.find("img").attr("src",img_dir + "feedback_white.png");
	    		subarea_this.find("div:eq(0)").addClass("color-white");
	          break;
	    	case "task":
	    		$(".st-navi-tridiv-l").show();
	    		$(".st-navi-tridiv-r").hide();
	    		subarea_this.find("img").attr("src",img_dir + "task_white.png");
	    		subarea_this.find("div:eq(0)").addClass("color-white");
	          break;
		}
	});
	
	//置頂公告的數量
	var top_msg_num = $(".st-cover-bar-case span").length;
	var img_cover_dir = "images/timeline/timeline_cover_bgimg_0";
	
	for (var i = 0; i < top_msg_num; i++) {
		$(".st-cover-main").append(
			'<div data-st-order="'+i+'" class="st-cover-main-page">'+
	            '<div class="st-cover-mp-l">'+
	                '<img src="images/timeline/timeline_cover_icon_announcement.png"/>'+
	                '<div>公告</div>'+
	            '</div>'+
	            '<div class="st-cover-mp-r">'+
	                '<div class="st-cover-mp-r-ttl">員工旅遊討論 - ' + (i+1) + '</div>'+
	                '<div class="st-cover-mp-r-content">希望大家可以在明天下班前回復，謝謝！</div>'+
	                '<div class="st-cover-mp-r-footer">林千里<img src="images/icon/icon_time_lightwhite.png"/>09:20</div>'+
	            '</div>'+
	        '</div>'
		);
	}
	$(".st-cover-main-page").addClass("st-bg1");
	
	//st-cover-bar-case 幾個就是幾十趴
	$(".st-cover-bar-case").css("width",top_msg_num*10 + "%")
	//st-cover-bar-area span 平均寬度在case中
	$(".st-cover-bar-area span").css("width",((1/top_msg_num)*100).toFixed(2) + "%");
	$(".st-cover-bar-area span:eq("+ (top_msg_num-1) +")").addClass("st-r-radius");
	
	//起始位置
	var selector_pos = (10-top_msg_num)/2*10;
	var movement = 10;
	var movement_pos = 1;
	//流程控制 不能連按
	var mfinish = 0;
	/* 游標位置和移動 */
	$(".st-cover-bar-selector").css("left",(selector_pos-1) + "%");
	
	$(".st-cover-bar-area").click(function(event,default_mouse_pos){
		//流程控制 不能連按
		if(mfinish){
			return;
		}
		mfinish = 1;
		
		//從箭頭trigger來的 用以判斷左移右移
		var mouse_pos = event.clientX;
		
		if(default_mouse_pos){
			mouse_pos = default_mouse_pos;
		}
		//游標起始位置 實際
	    var left_pos = $(window).width() * (selector_pos+5)/100;
	    //滑鼠位置在游標起始位置的左邊還是右邊 判斷移動
		if(mouse_pos > left_pos*1 + ($(window).width() * movement*(movement_pos-1)/100)){
			if(movement_pos < top_msg_num){
				$(".st-cover-bar-selector").animate({left: ((selector_pos-1) + movement*movement_pos) + "%"});
				$(".st-cover-main-page").animate({'left':'-=100%'},function(){
	            	mfinish = 0;
	            });
	            movement_pos++;
			}else{
				mfinish = 0;
			}
		}else{
			if(movement_pos > 1){
	            $(".st-cover-bar-selector").animate({left: ((selector_pos-1) + movement*(movement_pos-2)) + "%"});
	            $(".st-cover-main-page").animate({'left':'+=100%'},function(){
	            	mfinish = 0;
	            });
	            movement_pos--;
	        }else{
				mfinish = 0;
			}
		}
	});
	
	//置頂公告 左右換頁
	$(".st-cover-area-la,.st-cover-area-ra").mouseover(function(){
		$(".st-cover-area-la,.st-cover-area-ra").css("opacity",1);
	});
	
	$(".st-cover-area-la,.st-cover-area-ra").mouseout(function(){
		$(".st-cover-area-la,.st-cover-area-ra").css("opacity",0);
	});
	//置頂公告 設定左右的最大最小值 以方便換頁
	$(".st-cover-area-la,.st-cover-area-ra").click(function(e){
		var mouse_pos = 0;
		if(e.clientX > 100){
			mouse_pos = 1000;
		}
		$(".st-cover-bar-area").trigger("click",mouse_pos);
	});
	
	
	//主要filter
	$(".st-filter-main").click(function(){
		console.log(11);
		if($(".st-filter-other").is(":visible")){
			$(".st-filter-other").slideUp();	
		}else{
			$(".st-filter-main img").attr("src","images/timeline/timeline_filter_icon_arrow_click.png");
			$(".st-filter-main span").html("全部");
			$(".st-filter-other").slideDown();
		}
	});
	//filter變色
	$(".st-filter-list").click(function(){
		filter_name = $(this).find("span").html();
		//關閉的css樣式
		$(".st-filter-list").removeClass("st-filter-list-active");
		 
		//開起的css樣式
		$(this).addClass("st-filter-list-active");
	});
	
	$(".st-filter-other").click(function(){
		$(".st-filter-main span").fadeOut();
		$(".st-filter-other").slideUp(function(){
			$(".st-filter-main").addClass("st-filter-list-active");
			$(".st-filter-main img").attr("src","images/timeline/timeline_filter_icon_arrow.png");
			$(".st-filter-main span").html(filter_name);
			$(".st-filter-main span").fadeIn();
		});
	});
	
	$(document).on('click','.st-like-btn',function(){

		var this_event = $(this).parent().parent();
		var like_count = parseInt(this_event.find(".st-sub-box-3 div:eq(0)").html());
		//按讚 收回 api
		var target_obj = {};
		//target_obj.selector = this_event.find(".st-sub-box-3");
		target_obj.selector = this_event;
		target_obj.act = "like";
		target_obj.order = 0;


		//存回
    	var event_status = this_event.data("event-status");
    	var this_ei = this_event.data("event-id");

    	//event path
		this_event.data("event-path",this_ei);

    	if(!event_status[this_ei]){
    		event_status[this_ei] = {};
    	}

    	//按讚區域
    	var parti_list = this_event.data("parti-list");

    	//檢查按讚了沒
		var like_chk = chkEventStatus(this_event,"il");
		//按讚
		if(like_chk){
			console.log("like");
			$(this).html("收回讚");
			var est = 1;

			//存入event status
			event_status[this_ei].il = true;

			//按讚區域 改寫陣列
			parti_list.push(gu);
		}else{
			console.log("no like");
			//收回
			$(this).html("讚");
			var est = 0;

			//存入event status
			event_status[this_ei].il = false;

			//按讚區域 改寫陣列
			var i = $.inArray(gu,parti_list);
			parti_list.splice(i,1);
		}

		target_obj.status = event_status;

		//發完api後做真正存入動作
		putEventStatus(target_obj,1,est);

		//做按讚區域改寫 (你、按讚)
		this_event.data("parti-list",parti_list);
		detailLikeStringMake(this_event);


		//自己判斷的 按讚也算閱讀
		var read_chk = chkEventStatus(this_event,"ir");
		if(read_chk){
			target_obj.act = "read";
			target_obj.order = 2;

			event_status[this_ei].ir = true;
			//發完api後做真正存入動作
			target_obj.status = event_status;
			putEventStatus(target_obj,0,1);
		}
	});
	

	//回覆按讚
	$(document).on('click','.st-reply-message-like',function(){
		var this_event = $(this).parents('.st-reply-content-area');
		var event_path = this_event.data();

		
		//判斷是讚 還是 收回讚
		var est = 0;
		if($(this).html().length == 1){
			est = 1;
		}

		//更新狀態 參數
		var target_obj = {};
		target_obj.selector = this_event;
		console.log(": click :");
		console.log(est);
		console.log(target_obj);
		putEventStatus(target_obj,1,est);
	});

	





	//文章區塊 編輯按鈕
	$(document).on('click','.st-sub-box-more-btn',function(e){
		//按下效果
		$(this).attr("src","images/timeline/timeline_feedbox_icon_list_click.png");
		setTimeout(function(){
			$(this).attr("src","images/timeline/timeline_feedbox_icon_list.png");
	    },100);
		
		$(".st-more-close").each(function(){
		    if($(this).is(":visible")){
		    	$(this).trigger("click");
		    }                		
		});
		
		//開啟編輯區塊
		zoom_out_cnt = 8;
		var box_width = $(".st-sub-box").width();
	    $(this).next().width(box_width-3);
	    
	    $(this).next().css("zoom","0.05");
	    $(this).next().show();
	    zoomOut($(this).next());
	});
	
	$(document).on('click','.st-more-close',function(e){
		zoom_in_cnt = 100;
		zoomIn($(this).parent());
	});
	
	
	//編輯區塊按鈕效果
	$(document).on('click','.st-sub-box-more-box',function(){
	    var target = $(this);
	    var more_img_url = "images/timeline/timeline_hiddenmenu_icon_";
	    target.addClass("st-sub-box-more-box-click");
	    target.find("img").attr("src",more_img_url + target.data("st-more") + "_click.png");
	    setTimeout(function(){
	        target.removeClass("st-sub-box-more-box-click");
	        target.find("img").attr("src",more_img_url + target.data("st-more") + ".png");
	        },500);
	});
	
	$(".feed-compose").click(function(){
		if($(".feed-compose-area").is(":visible")){
			$(".feed-compose").removeClass("feed-compose-visit");
			$(".feed-compose-area-cover").hide();
			setTimeout(function(){
	            $(".feed-compose").removeClass("feed-compose-click");
	            $(".feed-compose-area").slideUp();
	        },100);
		}else{
			//var edit_pic = "image"
			$(".feed-compose").addClass("feed-compose-click");
			$(".feed-compose-area").slideDown();
			$(".feed-compose-area-cover").show();
			setTimeout(function(){
				$(".feed-compose").addClass("feed-compose-visit");
		    },100);
		}
		
	});




/*


 ######   #######  ##     ## ########   #######   ######  ######## 
##    ## ##     ## ###   ### ##     ## ##     ## ##    ## ##       
##       ##     ## #### #### ##     ## ##     ## ##       ##       
##       ##     ## ## ### ## ########  ##     ##  ######  ######   
##       ##     ## ##     ## ##        ##     ##       ## ##       
##    ## ##     ## ##     ## ##        ##     ## ##    ## ##       
 ######   #######  ##     ## ##         #######   ######  ######## 


 */




	
	//貼文選單
	$(".fc-area-subbox").click(function(){
//<div data-fc-box="post" class="fc-area-subbox">
// 	<img class="fc-icon-size" src="images/compose/compose_box_bticon_post.png"/>
// 	<div>貼文</div>
// </div>
	    var title = $(this).find("div").html();

	    $("#page-compose .header-group-name div:eq(0)").html(title);
		$("#page-compose .header-group-name div:eq(1)").html(gn);

		$.mobile.changePage("#page-compose");

		composeContentMake($(this).data("fc-box"));

		$(".feed-compose").trigger("click");
	});
	
	$(".feed-compose-area-cover").click(function(){
		$(".feed-compose").trigger("click");
	});
	



/*########################################################################################################################




         ########  ######## ########    ###    #### ##              ######  ##       ####  ######  ##    ## 
         ##     ## ##          ##      ## ##    ##  ##             ##    ## ##        ##  ##    ## ##   ##  
         ##     ## ##          ##     ##   ##   ##  ##             ##       ##        ##  ##       ##  ##   
         ##     ## ######      ##    ##     ##  ##  ##             ##       ##        ##  ##       #####    
         ##     ## ##          ##    #########  ##  ##             ##       ##        ##  ##       ##  ##   
         ##     ## ##          ##    ##     ##  ##  ##             ##    ## ##        ##  ##    ## ##   ##  
         ########  ########    ##    ##     ## #### ########        ######  ######## ####  ######  ##    ## 




########################################################################################################################*/




	//為了排除複製 滑鼠按下少於0.1秒 判斷為click  暫時不做 
	//detail view
	$(document).on("click",".st-sub-box-1, .st-sub-box-2",function(e){
		var this_event = $(this).parent();
		var this_ei = this_event.data("event-id");
		//此則timeline種類
		var tp = this_event.data("timeline-tp");
		
		console.debug("this event:",this_event.data());
		console.debug("qasx");

		//動態消息 判斷detail關閉區域
		var detail_chk = timelineDetailClose(this_event,tp);
		if(!detail_chk){
			return false;
		}
		
		//此則動態的按贊狀況
		getThisTimelinePart(this_event,this_event.find(".st-reply-like-area img:eq(0)"),1);

		//單一動態詳細內容
		var api_name = "groups/" + gi + "/timelines/" + ti_feed + "/events/" + this_ei;
        var headers = {
                "ui":ui,
                "at":at, 
                "li":"zh_TW"
                    };
        var method = "get";
        var result = ajaxDo(api_name,headers,method,false);
        result.complete(function(data){
        	var e_data = $.parseJSON(data.responseText).el;

	        	//計算投票的回文人次
	        	var count = 0;
	        	
	        	console.log("==================== 詳細內容 ================================");
	            console.log(JSON.stringify(e_data,null,2));
	            
	            //單一動態詳細內容 根據此則timeline類型 設定並開關區域
	        	//event種類 不同 讀取不同layout
	    		switch(tp){
	    			case 0:
	    				break;
	    			case 1:
	    				break;
	    			case 2:
	    				break;
	    			case 3:
	    				break;
	    			case 4:
	    				this_event.find(".st-box2-more-task-area").hide();
	    				this_event.find(".st-box2-more-task-area-detail").show();
	    				
	    				if(this_event.data("task-over")) break;
	    				//判斷有無投票過 顯示送出 已送出 已結束等等
	    				var event_status = this_event.data("event-status");
	    				if(event_status[this_ei] && event_status[this_ei].ik){
	    					this_event.find(".st-vote-send").html("完成");
	    					this_event.find(".st-vote-send").removeClass(".st-vote-send-blue");
	    				}
	    				
	    				break;
	    			case 5:
	    				break;
	    			case 6:
	    				break;
	    		};

	    		//回覆 detail timeline message內容
				replyDetailTimelineContentMake(this_event,e_data);
    		});
	});



	
	//timeline裏面點擊不做展開收合的區域 設定在init.js
	$(document).on("click",timeline_detail_exception.join(","),function(e){
		e.stopPropagation();
	});
	
	


	
	//----------------------------------- timeline-貼文 ---------------------------------------------
	
	$(".cp-post").click(function(){
		var this_compose = $(document).find(".cp-content");
		this_compose.data("compose-content",$('.cp-textarea-desc').val());
		this_compose.data("compose-title",$('.cp-textarea-title').val());

		var ctp = this_compose.data("compose-tp");
		var empty_chk = true;

		//錯誤訊息
		var error_msg_arr = [];
		error_msg_arr[".cp-textarea-desc"] = "內容尚未填寫";
		error_msg_arr[".cp-textarea-title"] = "標題尚未填寫";

		var chk_arr = [".cp-textarea-desc"];

		//判斷欄位是否填寫
		switch(ctp){
			//普通貼文
			case 0:
				break;
			//公告
			case 1:
				chk_arr.push(".cp-textarea-title");
				break;
			//通報
			case 2:
				break;
			//任務 工作
			case 3:
				break;
			//任務 投票
			case 4:
				chk_arr.push(".cp-textarea-title");
				break;
			//任務 定點回報
			case 5:
				break;
		}
 		
 		$.each(chk_arr,function(i,chk_str){
 			//有一個不存在就跳錯誤訊息
 			if(!$(chk_str).val()){
 				empty_chk = false;
 				popupShowAdjust(error_msg_arr[chk_str]);
 				return false;
 			}
 		});

		if(empty_chk) composeSend(this_compose);   
	});

	
	$(".cp-addfile").click(function(){
		
		var img_url = "images/compose/compose_form_addfile_";
		var target = $(this);
		target.find("img").attr("src",img_url+target.data("cp-addfile")+"_visit.png");
		setTimeout(function(){
			target.find("img").attr("src",img_url+target.data("cp-addfile")+".png");
		},100);
	});

	
	
	
	//----------------------------------- 聯絡人 ---------------------------------------------  
	//功能選單
	$(".main-more-btn").click(function(){
		var target = $(".main-footer-add");
		if(target.css("bottom") == "125px"){
			$(".main-footer-add").animate({bottom:"194px"},function(){
				$(".main-footer").css("z-index","0");
			});	
		}else if($(".main-footer").css("z-index") == "0"){
			$(".main-footer").css("z-index","100");
			$(".main-footer-add").animate({bottom:"125px"});
		}
	});
	
	//功能選單 按鈕效果
	$(".main-footer-item").click(function(){
		var main_act = $(this).data("main-act");
		var img_url = "images/contact/toolbar_icon_";
		$(".main-footer-item").each(function(i,val){
			$(this).children().attr("src",img_url + $(this).data("main-act") + ".png");
			$(this).find("div").removeClass("color-white");
		});
		$(this).children().attr("src",img_url + $(this).data("main-act") + "_active.png");
		$(this).find("div").addClass("color-white");
	
	    switch (main_act) {
	        case "chat":
	            $.mobile.changePage("#page-chatroom");
	          break;
	    }
	});
	
	//團體群組 按鈕效果
	$(".main-contact-l-row").click(function(){
		var ori_target = $(this);
	    var img_url = "images/contact/contact_sidemenu_";
	    //將聯絡人群組全部換成關閉狀態
	    $(".main-contact-l-row").css("background","url(" + img_url + "rowbg.png)");
	    $(".main-contact-l-row img").attr("src",img_url + "icon_arrow.png");
	    $(".main-contact-l-row").removeClass("color-white");
	    
	    //目標群組換成按下效果
	    ori_target.css("background","url(" + img_url + "rowbg_unfold.png)");
	    ori_target.addClass("color-white");
	    
	    //關閉所有子群組使用動畫效果
	    $(".main-contact-l-row-subarea").each(function(i,val){
	    	//不是現在按下的子群組同時高度不為零 表示除了現在按下的以外 全部用動畫效果來關閉
	    	if(!$(this).is(ori_target.next()) && $(this).css("height") != "0px"){
	    		$(this).animate({height:"0px"},function(){
	    			$(this).hide();	
	    		});
	        }
	    });
	    
	    //判斷開啓子群組
	    if(ori_target.data("main-sub-chk")){
	    	//動畫呈現部門子群組
	    	var subarea = ori_target.next();
	        subarea.show();
	        var subrow = subarea.find(".main-contact-l-subarea-row");
	        if(subarea.css("height") == "0px"){
	            subarea.animate({height:subrow.length*43}); 
	        }else{
	        	subarea.animate({height:"0px"},function(){
	        		ori_target.children().attr("src",img_url + "icon_arrow_white.png");
	        		subarea.hide(); 
	            });
	        }
	        ori_target.children().attr("src",img_url + "icon_arrow_white_below.png");
	    }else{
	    	ori_target.children().attr("src",img_url + "icon_arrow_white.png");	
	    	$(".main-contact-l-subarea-row").height("opx");
	    }
	});
	//----------------------------------- chatroom ---------------------------------------------
	$(".chatroom-addstate-top-btn").click(function(){
		$(".chatroom-addstate-top-area").slideToggle();
	});
	
	//聊天功能下方 按了彈出
	$(".chat-bar-add").click(function(){
		if($(".chatroom-footer").css("bottom") == "0px"){
			$(".chatroom-footer").animate({bottom:"165px"},function(){
	            $(".chat-bar-send").css("bottom","4px");
	        }); 
	        $(".chatroom-addstate-area").animate({bottom:"0px"}); 
		}else{
			$(".chatroom-footer").animate({bottom:"0px"},function(){
	            $(".chat-bar-send").css("bottom","5px");
	        }); 
	        $(".chatroom-addstate-area").animate({bottom:"-166px"}); 
		}
	});
	
	$(".chat-area").click(function(){
		
	});
	
	// 聊天功能上方 按鈕效果
	$(".chatroom-addstate-top-box").click(function(){
		var target = $(this);
		target.addClass("chatroom-addstate-top-box-click");
	    setTimeout(function(){
	    	target.removeClass("chatroom-addstate-top-box-click");
	        },500);
	});
	
	// 聊天功能下方 按鈕效果
	$(".chatroom-addstate-box").click(function(){
	    var target = $(this);
	    target.addClass("chatroom-addstate-box-click");
	    setTimeout(function(){
	        target.removeClass("chatroom-addstate-box-click");
	        },500);
	});
	
	$(".chat-bar-send").click(function(){
		var now = new Date();
		var outStr = (now.getHours()<10?"0" + now.getHours():now.getHours()) +':'+ (now.getMinutes()<10?"0" + now.getMinutes():now.getMinutes());
		if($(".chat-bar-input").val()){
			$(".chat-area").append(
				'<div class="chat-me">'+
	                '<div class="chat-me-text">'+
	                    $(".chat-bar-input").val() +
	                    '<div class="chat-me-time">' + outStr + '</div>'+
	                '</div>'+
	            '</div>'
			);
			$(".chat-bar-input").val('');
			
			//置底
	        $('html, body').animate({scrollTop: $(document).height()}, 0);
		};
	});
	
	//-----------------------------------  audio play  ----------------------------------- 
	
	$(document).on("change",'.audio-progress input[type="range"]',function(){
	//this_box.find('input[type="range"]').change(function () {
	    var val = ($(this).val() - $(this).attr('min')) / ($(this).attr('max') - $(this).attr('min'));
	    $(this).css('background-image',
	                '-webkit-gradient(linear, left top, right top, '
	                + 'color-stop(' + (val+0.02) + ', rgb(95,212,226)), '
	                + 'color-stop(' + (val+0.02) + ', rgb(197,203,207))'
	                + ')'
	                );
	});
	//
	$(document).on("click",".audio-play",function(e){
		var this_play = $(this);
		if (this_play.nextAll("audio").get(0).paused == false) {
			this_play.nextAll("audio").get(0).pause();
			this_play.find("img:nth-child(3)").hide();
			this_play.find("img:nth-child(1)").show();
		} else {
			this_play.nextAll("audio").get(0).play();
			this_play.find("img:nth-child(1)").hide();
			this_play.find("img:nth-child(3)").show();
	 	}
		
		this_play.nextAll("audio").bind('ended', function(){
			this_play.find("img:nth-child(3)").hide();
			this_play.find("img:nth-child(1)").show();
		});
		
	});
	
	//$(document).on("timeupdate",".st-attach-audio audio",function(){
	//	console.log(55555);
	////this_box.find("audio").on('timeupdate', function() {
	//	this_box = $(this).parent(".st-attach-audio");
	//	console.log(this_box.find('input[type="range"]'));
	//	this_box.find('input[type="range"]').val(($(this).get(0).currentTime / $(this).get(0).duration)*100);
	//	this_box.find('input[type="range"]').css('background-image',
	//            '-webkit-gradient(linear, left top, right top, '
	//            + 'color-stop(' + ((($(this).get(0).currentTime / $(this).get(0).duration)<0.5)?(($(this).get(0).currentTime / $(this).get(0).duration)+0.02):($(this).get(0).currentTime / $(this).get(0).duration)) + ', rgb(95,212,226)), '
	//            + 'color-stop(' + ((($(this).get(0).currentTime / $(this).get(0).duration)<0.5)?(($(this).get(0).currentTime / $(this).get(0).duration)+0.02):($(this).get(0).currentTime / $(this).get(0).duration)) + ', rgb(197,203,207))'
	//            + ')'
	//            );
	//	this_box.find(".audio-progress div:nth-child(1)").html(secondsToTime(Math.floor($(this).get(0).currentTime)));
	//	this_box.find(".audio-progress div:nth-child(3)").html(secondsToTime(Math.floor($(this).get(0).duration)));
	//});

	//.st-attach-img-arrow-l,.st-attach-img-arrow-r
	// $(".st-attach-img-arrow-l, .st-attach-img-arrow-r").mouseover(function(){
	// 	console.debug("dsafsdf");
	// 	$(".st-attach-img-arrow-l, .st-attach-img-arrow-r").css("opacity",1);
	// });

	// $(".st-attach-img-arrow-r").click(function(){
	// 	console.log("arrow l");
	// 	$(".st-attach-img").animate({'left':'-=100%'},function(){
	// 		console.log("complete");
	// 	});
	// });

	// $(".st-attach-img-arrow-l").click(function(){
	// 	console.log("arrow r");
	// 	$(".st-attach-img").animate({'left':'+=100%'},function(){
	// 		console.log("complete");
	// 	});
	// });

	$(document).on("mouseover",".st-attach-img-arrow-l, .st-attach-img-arrow-r",function(){
		$(this).parent().find(".st-attach-img-arrow-l, .st-attach-img-arrow-r").css("opacity",1);
	});

	$(document).on("mouseout",".st-attach-img-arrow-l, .st-attach-img-arrow-r",function(){
		$(this).parent().find(".st-attach-img-arrow-l, .st-attach-img-arrow-r").css("opacity",0);
	});
	
	$(document).on("click",".st-attach-img-arrow-r",function(){
		$(this).parent().find(".st-slide-img").animate({'left':'-=395px'},function(){
		});
	});

	$(document).on("click",".st-attach-img-arrow-l",function(){
		$(this).parent().find(".st-slide-img").animate({'left':'+=395px'},function(){
		});
	});
	

});  