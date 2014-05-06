$(function(){  
	//api 網址
	var base_url = "https://apserver.mitake.com.tw/apiv1/";
	//var base_url = "http://10.1.17.116:8090/apiv1/";
	//ajax用
	var myRand = Math.floor((Math.random()*1000)+1);
	
	var ui,at,gi,gu,gn,gd,ga,gm,ti_cal,ti_feed,ti_chat,device_token,zoom_out_cnt,zoom_in_cnt,filter_name,
	default_group,group_name,post_tmp_url,activityTimeout,
	timeline_type,data_group_user;
	
	//計算螢幕長寬以維持比例
	var proportion = 1.7;
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
	});
	
	$(".popup-close-cancel").click(function(){
	    $(".popup-screen").trigger("click");
	});
	
	$(document).ajaxSend(function() {
	    if(!$('.ui-loader').is(":visible"))
		$('.ui-loader').css("display","block");
	});
	$(document).ajaxComplete(function() {
		$('.ui-loader').hide();
		$(document).trigger("click");
	});
	
	$(document).ajaxError(function(e, jqxhr) {
		console.log(jqxhr.responseText);
		console.log(jqxhr.status);
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
	
	//取消
	function timelineDetailWrite(timeline_type){
			var this_box = $("#page-timeline-detail");
			switch(timeline_type){
			//貼文
			case 0:
				$(this).find(".st-sub-box-2").html(box_content);
	    		$(this).find(".st-sub-box-2").attr("data-st-cnt",i);
				$(".st-sub-box-2-more").hide();
				break;
			//公告
			case 1:
				$(".st-box2-more-desc").show();
				$(".st-sub-box-2-attach-div").show();
				$(".st-attach-audio").show();
				this_box.find(".st-box2-more-category").html("公告");
				this_box.find(".st-box2-more-title").html("今年加薪50%");
				this_box.find(".st-box2-more-desc").html("有夢最美希望相隨有夢最美希望相隨有夢最美希望相隨有夢最美希望相隨有夢最美希望相隨有夢最美希望相隨有夢最美希望相隨有夢最美希望相隨");
				
	//			this_box.find("audio").on('timeupdate', function() {
	//				this_box.find('input[type="range"]').val(($(this).get(0).currentTime / $(this).get(0).duration)*100);
	//				this_box.find('input[type="range"]').css('background-image',
	//		                '-webkit-gradient(linear, left top, right top, '
	//		                + 'color-stop(' + ((($(this).get(0).currentTime / $(this).get(0).duration)<0.5)?(($(this).get(0).currentTime / $(this).get(0).duration)+0.02):($(this).get(0).currentTime / $(this).get(0).duration)) + ', rgb(95,212,226)), '
	//		                + 'color-stop(' + ((($(this).get(0).currentTime / $(this).get(0).duration)<0.5)?(($(this).get(0).currentTime / $(this).get(0).duration)+0.02):($(this).get(0).currentTime / $(this).get(0).duration)) + ', rgb(197,203,207))'
	//		                + ')'
	//		                );
	//				this_box.find(".audio-progress div:nth-child(1)").html(secondsToTime(Math.floor($(this).get(0).currentTime)));
	//				this_box.find(".audio-progress div:nth-child(3)").html(secondsToTime(Math.floor($(this).get(0).duration)));
	//			});
				
				break;
			//通報
			case 2:
				this_box.find(".st-box2-more-category").addClass("st-box2-more-category-fb");
				$(".st-box2-more-desc").show();
				this_box.find(".st-box2-more-category").html("通報");
				this_box.find(".st-box2-more-title").html("請回報業務人員目前位置請回報業務人員目前位置");
				this_box.find(".st-box2-more-desc").html("你們到底去哪裡了不要偷懶你們到底去哪裡了不要偷懶你們到底去哪裡了不要偷懶你們到底去哪裡了不要偷懶你們到底去哪裡了不要偷懶你們到底去哪裡了不要偷懶你們到底去哪裡了不要偷懶你們到底去哪裡了不要偷懶");
				
				this_box.find(".st-feedback-box").click(function(){
					$(".st-feedback-box").data("fb-tick",0);
					$(".st-feedback-box-content img").hide();
					$(this).find("img").show();
					$(this).data("fb-tick",1);
					console.log($(".st-feedback-box:nth-child(1)").data("fb-tick"));
					console.log($(".st-feedback-box:nth-child(2)").data("fb-tick"));
				});
				
				break;
			case 3:
				break;
			case 4:
				break;
		};
	}
	
	$(".page-back").click(function(){
		$.mobile.changePage($("#page-back-chk-pre").html(), {transition: "slide",reverse: true});
		$($("#page-back-chk-pre").html() + " div[data-role=header] h3").html($("#page-back-pre-title").html());
	});
	
	
	//----------------------------------- 登入 ---------------------------------------------
	//login打勾
	$(".login-radio").click(function(){
	    $(".login-radio img").toggle();
	});
	//login
	$("#login").click(function(){
		var id = "+886" + $("#phone").val().substring(1);
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
	                if( data.status != 200 )
	                {
	                	$.mobile.changePage("#page-helper");
	                } else {
	                	//所有團體列表
	                	group_list = $.parseJSON(data.responseText).gl;
	                	
	                	//製作timeline
	                	//預設團體暫定為第一個團體？
	                	var default_group = group_list[1];
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
	                	
	                	//上次點選團體
	                	if(localStorage.currentGroup){
	                		var currentGroup = $.lStorage("currentGroup");
	                		gi = currentGroup.gi;
	                		gu = currentGroup.gu;
	                		gn = currentGroup.gn;
	                		ti_cal = currentGroup.ti_cal;
	                		ti_feed = currentGroup.ti_feed;
	                		ti_chat = currentGroup.ti_chat;
	                	}else{
	                		//存入localstorage
	                		var currentGroup = {"gi":gi,"gu":gu,"gn":gn,"ti_cal":ti_cal,"ti_feed":ti_feed,"ti_chat":ti_chat};
	                		$.lStorage("currentGroup",currentGroup);
	                	}
	                	
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
	
	function getUserName(gi,gu){
		var api_name = "groups/"+ gi +"/users";
	    var headers = {
	        "ui":ui,
	        "at":at,
	        "li":"zh_TW",
	    };
	    var method = "get";
	    var result = ajaxDo(api_name,headers,method,true);
	    result.complete(function(data){
	    	data_group_user = $.parseJSON(data.responseText).ul;
	    	$.each(data_group_user,function(i,val){
	    		if(val.gu == gu){
	    			return val.n;
	    		}
	    	});
	    });
	}
	
	
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
	                    groupMenuListArea(ui,at);
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
	            "gn":encodeURI($("#group-name").val()),
	            "gd":encodeURI($("#group-desc").val())
	        };
	        var method = "post";
	        var result = ajaxDo(api_name,headers,method,true);
	        result.complete(function(data){
	            if(data.status = 200){
	            	popupShowAdjust("創建成功。");
	                popupAfterChangePage("#page-group-main");
	            }else{
	            	popupShowAdjust("未知錯誤。");
	                return false;;
	            }
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
	
	//----------------------------------- 左側選單 ---------------------------------------------
	$(".side-menu-btn").click(function(){
	    $( "#side-menu" ).panel( "open");
	});
	
	//用戶區
	//detect page changing
	$("#side-menu").on("panelbeforeopen",function(){
	    //timeline固定右邊頁面
	    $("#page-group-main .ui-panel-content-wrap").addClass("page-fixed");
	    
		//取得個人資料
		$(".sm-user-area-l").html("<img class=\"sm-user-pic\" src=\"images/contact/contact_personal_default_list_nophoto.png\"/>");
		//計數
		$("div[data-sm-act=feed] .sm-count").show();
		$(".sm-group-area .sm-count").show();
		
		//團體列表
		groupMenuListArea(ui,at);
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
	$(document).on("mousedown",".sm-small-area,.sm-group-area,.sm-group-cj-btn",function(){
		var icon_default = "images/side_menu/sidemenu_icon_";
		var target = $(this);
		
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
		switch (target.data("sm-act")) {
	        case "feed":
	        	timelineListWrite();
	        	$(".subpage-contact").hide();
	        	$(".subpage-timeline").show();
	        	$( "#side-menu" ).panel( "close");
	        	$("#page-group-main").find("div[data-role=header] h3").html("動態消息");
	          break;
	        case "contact": 
	        	$(".subpage-contact").show();
	            $(".subpage-timeline").hide();
	            $( "#side-menu" ).panel( "close");
	            $("#page-group-main").find("div[data-role=header] h3").html("聯絡人");
	          break;
	        case "chat":
	        	$.mobile.changePage("#page-chatroom");
	        	$("#page-group-main").find("div[data-role=header] h3").html("聊天室");
	          break;
	        case "calendar":
	          break;
	        case "help":
	          break;
	        case "news":
	          break;
	        case "setting":
	          break;
	    }
	});
	//按鈕效果
	$(document).on("mouseup",".sm-small-area,.sm-group-area,.sm-group-cj-btn",function(){
		var icon_default = "images/side_menu/sidemenu_icon_";
		var target = $(this);
	    setTimeout(function(){
	    	//開關按鈕ui變化
	    	if($(".sm-group-list-area-add").is(":visible") ){
	            if(target.data("switch-chk") == "check2"){
	                $(".sm-switch-ui-adj").removeClass("sm-switch-ui-adj-show");
	            }
	        }else{
	            if(target.data("switch-chk") == "check"){
	                $(".sm-switch-ui-adj").removeClass("sm-switch-ui-adj-show");
	            }
	        }
	    	target.removeClass("sm-click-bg");
	    	target.find(".sm-small-area-l img").attr("src",icon_default + target.data("sm-act") + ".png");
	    	},500);
	});
	
	//更換團體 重新設定 gi gu gn tl
	$(document).on("click",".sm-group-area",function(){
		
		gi = $(this).attr("data-gi");
		gu = $(this).attr("data-gu");
		gn = $(this).find(".sm-group-area-r").html();
		
		$.each(group_list,function(gi,gval){
			if(gval.gi == gi){
				$.each(gval.tl,function(ti,tval){
					if(tval.tp == 1){
            			ti_cal = tval.ti;
            		}else if(tval.tp == 2){
            			ti_feed = tval.ti;
            		}else{
            			ti_chat = tval.ti;
            		}
				});
			}
		});
		
	
		//點選團體 記錄在localstorage 以便下次登入預設
		var currentGroup = $.lStorage("currentGroup");
		currentGroup.gi = gi;
		currentGroup.gu = gu;
		currentGroup.gn = gn;
		currentGroup.ti_cal = ti_cal;
		currentGroup.ti_feed = ti_feed;
		currentGroup.ti_chat = ti_chat;
		$.lStorage("currentGroup",currentGroup)
		
		setSmUserData(gi,gu,gn);
		$(".sm-small-area[data-sm-act=contact]").trigger("click");
		//$( "#side-menu" ).panel( "close");
		
	});
	
	function getTlByGroup(gi){
		$.each(group_list,function(i,val){
			if(val.gi == gi){
				return val.tl;
			}
		});
	}
	
	function setSmUserData(gi,gu,gn){
		$(".sm-user-area-r div:eq(0)").html(gn);
		$(".sm-user-area-r div:eq(1)").html("");
		$(".sm-user-area-r div:eq(1)").html(getUserName(gi,gu));
	}
	
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
	/* 游標位置和移動 */
	$(".st-cover-bar-selector").css("left",(selector_pos-1) + "%");
	
	$(".st-cover-bar-area").click(function(event){
		//游標起始位置 實際
	    var left_pos = $(window).width() * (selector_pos+5)/100;
	    //滑鼠位置在游標最左邊的左邊還是右邊 判斷移動
		if(event.clientX > left_pos*1 + ($(window).width() * movement*(movement_pos-1)/100)){
			if(movement_pos < top_msg_num){
				$(".st-cover-bar-selector").animate({left: ((selector_pos-1) + movement*movement_pos) + "%"});
				$(".st-cover-main-page").animate({'left':'-=100%'});
	            movement_pos++;
			}
		}else{
			if(movement_pos > 1){
	            $(".st-cover-bar-selector").animate({left: ((selector_pos-1) + movement*(movement_pos-2)) + "%"});
	            $(".st-cover-main-page").animate({'left':'+=100%'});
	            movement_pos--;
	        }
		}
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
		var like_count = parseInt($(this).parent().parent().find(".st-sub-box-3 div:eq(0)").html());
		if($(this).html().length == 1){
			$(this).parent().parent().find(".st-sub-box-3 img:eq(0)").attr("src","images/timeline/timeline_feedbox_icon_like_blue.png");
			$(this).parent().parent().find(".st-sub-box-3 div:eq(0)").html(like_count+1);
			$(this).html("收回讚");
		}else{
			$(this).parent().parent().find(".st-sub-box-3 img:eq(0)").attr("src","images/timeline/timeline_feedbox_icon_like.png");
			$(this).parent().parent().find(".st-sub-box-3 div:eq(0)").html(like_count-1);
			$(this).html("讚");
		}
	});
	
	//文章區塊 編輯按鈕
	$(document).on('mousedown','.st-sub-box-more-btn',function(e){
		e.stopPropagation();
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
	
	$(document).on('mousedown','.st-more-close',function(e){
		e.stopPropagation();
		zoom_in_cnt = 100;
		zoomIn($(this).parent());
	});
	
	$(document).on('mousedown','.st-user-pic,.st-sub-box-more',function(e){
		e.stopPropagation();
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
			return;
		}
		//var edit_pic = "image"
		$(".feed-compose").addClass("feed-compose-click");
		$(".feed-compose-area").slideDown();
		$(".feed-compose-area-cover").show();
		setTimeout(function(){
			$(".feed-compose").addClass("feed-compose-visit");
	    },100);
	});
	
	//貼文選單
	$(".fc-area-subbox").click(function(){
		var target = $(this);
		switch (target.data("fc-box")) {
	        case "post":
	          break;
	        case "announcement": 
	        	$.mobile.changePage("#page-announcement-post");
	          break;
	        case "feedback":
	            
	          break;
	        case "work":
	          break;
	        case "vote":
	          break;
	        case "check":
	          break;
	     }
		$(".feed-compose").trigger("click");
	});
	
	$(".feed-compose-area-cover").click(function(){
		$(".feed-compose").trigger("click");
	});
	
	//----------------------------------- timeline-公告 ---------------------------------------------
	$(".ap-content").height($(window).height()-80);
	
	$('.ap-textarea-desc').autosize({append: "\n"});
	
	$('.ap-textarea-desc').change(function(){
		var url_chk = $('.ap-textarea-desc').val().split(' ');
		if(post_tmp_url != url_chk[0]){
			post_tmp_url = url_chk[0];
			if(url_chk[0].substring(0, 7) == 'http://' || url_chk[0].substring(0, 8) == 'https://'){
				if(url_chk[0].match(/youtube.com|youtu.be/)){
					getLinkYoutube(url_chk[0]);
				}else{
					getLinkMeta(url_chk[0]);
				}
			}else{
				$(".ap-ta-yql").hide();
			}
		}
			
	});
	
	
	$(".ap-top-btn").click(function(){
		if($(".ap-top-btn").data("ap-top") == 0){
			$(".ap-top-btn").attr("src","images/compose/compose_form_icon_check.png");
			$(".ap-top-btn").data("ap-top",1);
		}else{
			$(".ap-top-btn").attr("src","images/compose/compose_form_icon_check_none.png");
			$(".ap-top-btn").data("ap-top",0);
		}
	});
	
	
	$(".ap-post").click(function(){
		var ap_title = $(".ap-textarea-title").val(),
		    ap_content = $('.ap-textarea-desc').val();
		
	   if(!ap_title){
		   popupShowAdjust("標題沒填");
	   }else if(!ap_content){
		   popupShowAdjust("內容沒填");
	   }else{
		   
		   var api_name = "groups/"+ localStorage.currentGroup.gi +"/timelines/"+ localStorage.currentGroup.ti +"/events";
	       var headers = {
	               "ui":ui,
	               "at":at, 
	               "li":"zh_TW"
	                   };
	       var method = "post";
	       
	       var body = {
	                 "meta":
	                 {
	                   "lv": 1,
	                   "tp": "00"
	                 },
	                 "ml":
	                 [
	                   {
	                     "tp": 0,
	                     "c": ap_content
	                   }
	                 ]
	               };
	       body = JSON.stringify(body);
	       
	       var result = ajaxDo(api_name,headers,method,true,body);
	       result.complete(function(data){
	    	   popupShowAdjust("已送出");
	    	   //製作timeline
	    	   timelineListWrite();
	    	   popupAfterChangePage("#page-group-main");
	       });
	   }
	});
	
	$(".ap-addfile").click(function(){
		
		var img_url = "images/compose/compose_form_addfile_";
		var target = $(this);
		target.find("img").attr("src",img_url+target.data("ap-addfile")+"_visit.png");
		setTimeout(function(){
			target.find("img").attr("src",img_url+target.data("ap-addfile")+".png");
		},100);
	})
	
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
	$(document).on("mousedown",".audio-play",function(e){
		e.stopPropagation();
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
	
	//----------------------------------- function ---------------------------------------------                
	//ajax
	function ajaxDo(api_name,headers,method,async,body){
	    //console.log(api_url);
	    var api_url = base_url + api_name;
	    var myRand = Math.floor((Math.random()*1000)+1);
	    
	    if(async){
	    	var result = $.ajax ({
	            url: api_url,
	            type: method,
	            headers:headers,
	            data:body
	        });/* ajax結束 */
	    }else{
	    	var result = $.ajax ({
	            url: api_url,
	            type: method,
	            headers:headers,
	            async:false,
	        });/* ajax結束 */
	    }
	    
	    return result;
	}
	
	function groupMenuListArea(ui,at){
	    var api_name = "groups";
	    var headers = {
	        "ui":ui,
	        "at":at,
	        "li":"zh_TW"
	    };
	    var method = "get";
	    result = ajaxDo(api_name,headers,method);
	    if(result.responseText){
	    	
	    	$(".sm-group-list-area").html("");
	    	$(".sm-group-list-area-add").html("");
	    	//chk是開關按鈕ui變化的檢查
	    	var tmp_selector,count,chk;
	    	var group_list = $.parseJSON(result.responseText).gl;
	    	var total = group_list.length;
	    	console.log(group_list);
	        $.each(group_list,function(i,val){
	        	if(i < 2){
	        		tmp_selector = ".sm-group-list-area";
	        	}else{
	        		tmp_selector = ".sm-group-list-area-add";
	        	}
	        	
	        	//開關按鈕ui變化
	            if(i == 1 || total == 1){
	                chk = "data-switch-chk=\"check\"";
	            }
	            if(i == total-1 ){
	                chk = "data-switch-chk=\"check2\"";
	            }
	        	
	            $(tmp_selector).append(
	           		'<div class="sm-group-area" data-gi="' + decodeURI(val.gi) + '" data-gu="' + decodeURI(val.me) + '" ' + chk + '>' +
	           	        '<div class="sm-group-area-l">' +
	           	            '<img src="images/no_pic_g.png">' +
	           	        '</div>' +
	           	        '<div class="sm-group-area-r">' + decodeURI(val.gn) + '</div>' +
	           	        '<div class="sm-count">20</div>' +
	           	    '</div>'
	     	    );
	        });
	        if(group_list.length > 2){
	        	$(".sm-group-switch").show();
	        }
	    }
	}
	
	//動態消息列表
	function timelineListWrite(){
	    //製作timeline
	    var api_name = "groups/"+ gi +"/timelines/"+ ti_feed +"/events";
	    var headers = {
	            "ui":ui,
	            "at":at, 
	            "li":"zh_TW"
	                };
	    var method = "get";
	    var result = ajaxDo(api_name,headers,method,true);
	    result.complete(function(data){
	        var timeline_list = $.parseJSON(data.responseText).el;
	        
	        var content,box_content,youtube_code,prelink_pic,prelink_title,prelink_desc;
	        $(".st-feedbox-area").html('');
	        $.each(timeline_list,function(i,val){
	        	
	        	console.log(JSON.stringify(val, null, 2));
	        	var is_reply = timeline_type = val.meta.tp.substring(0,1);
	        	var timeline_type = val.meta.tp.substring(1,2);

	        	$('.st-feedbox-area').append($('<div>').load('layout/timeline_box.html .st-sub-box',function(){

	        		var this_box = $(this);
	        		//為了排除複製 滑鼠按下少於0.1秒 判斷為click 用document是因為 其他子元素有些按鈕動作是document 父元素用click會比子元素的document早執行 所以無法阻止事件冒泡 
	        		$(document).on("mousedown",".st-sub-box",function(e){
	        		});
	        		
	        		//判斷是否存在副檔
	        		
	        		switch(timeline_type){
	        			//貼文
	        			case "0":
	        				
	        				$(this).find(".st-sub-box-2").html(box_content);
	        	    		$(this).find(".st-sub-box-2").attr("data-st-cnt",i);
	        				$(".st-sub-box-2-more").hide();
	        				break;
	        			//公告
	        			case "1":
	        				$(".st-box2-more-desc").show();
	        				$(".st-sub-box-2-attach-area").show();
	        				this_box.find(".st-box2-more-category").html("公告");
	        				this_box.find(".st-box2-more-title").html(val.meta.tt);
	        				//timeline內容
	        				timelineContentMake(this_box,val.ml);
	        				
//	        				this_box.find(".st-attach-audio").show();
//	        				
//	        				this_box.find("audio").on('timeupdate', function() {
//	        					this_box.find('input[type="range"]').val(($(this).get(0).currentTime / $(this).get(0).duration)*100);
//	        					this_box.find('input[type="range"]').css('background-image',
//	        			                '-webkit-gradient(linear, left top, right top, '
//	        			                + 'color-stop(' + ((($(this).get(0).currentTime / $(this).get(0).duration)<0.5)?(($(this).get(0).currentTime / $(this).get(0).duration)+0.02):($(this).get(0).currentTime / $(this).get(0).duration)) + ', rgb(95,212,226)), '
//	        			                + 'color-stop(' + ((($(this).get(0).currentTime / $(this).get(0).duration)<0.5)?(($(this).get(0).currentTime / $(this).get(0).duration)+0.02):($(this).get(0).currentTime / $(this).get(0).duration)) + ', rgb(197,203,207))'
//	        			                + ')'
//	        			                );
//	        					this_box.find(".audio-progress div:nth-child(1)").html(secondsToTime(Math.floor($(this).get(0).currentTime)));
//	        					this_box.find(".audio-progress div:nth-child(3)").html(secondsToTime(Math.floor($(this).get(0).duration)));
//	        				});
	        				
	        				break;
	        			//通報
	        			case "2":
	        				this_box.find(".st-box2-more-category").addClass("st-box2-more-category-fb");
	        				$(".st-box2-more-desc").show();
	        				this_box.find(".st-box2-more-category").html("通報");
	        				this_box.find(".st-box2-more-title").html("請回報業務人員目前位置請回報業務人員目前位置");
	        				this_box.find(".st-box2-more-desc").html("你們到底去哪裡了不要偷懶你們到底去哪裡了不要偷懶你們到底去哪裡了不要偷懶你們到底去哪裡了不要偷懶你們到底去哪裡了不要偷懶你們到底去哪裡了不要偷懶你們到底去哪裡了不要偷懶你們到底去哪裡了不要偷懶");
	        				
	        	//			this_box.find(".st-feedback-box").click(function(){
	        	//				$(".st-feedback-box").data("fb-tick",0);
	        	//				$(".st-feedback-box-content img").hide();
	        	//				$(this).find("img").show();
	        	//				$(this).data("fb-tick",1);
	        	//				console.log($(".st-feedback-box:nth-child(1)").data("fb-tick"));
	        	//				console.log($(".st-feedback-box:nth-child(2)").data("fb-tick"));
	        	//			});
	        				
	        				break;
	        			case "3":
	        				break;
	        			case "4":
	        				break;
	        			case "5":
	        				this_box.find(".st-box2-more-category").html("頭票");
	        				break;
	        		};
	        		
	        	}));
	        });
	    });
	    
	    
	}
	
	function timelineContentMake(target,ml){
		$.each(ml,function(i,val){
			//內容格式
			switch(val.tp){
				//貼文
				case 0:
					target.find(".st-box2-more-desc").append(val.c);
					break;
				//公告
				case 1:
					break;
				//通報
				case 2:
					break;
				case 3:
					break;
				case 4:
					break;
			};
		});
	}
	
	//parse 網址
	function getLinkMeta(url) {
		clearTimeout(activityTimeout);
		activityTimeout = setTimeout(function(){
			var q = 'http://query.yahooapis.com/v1/public/yql?q=' + encodeURIComponent('select * from html where url="' + url + '" and xpath="//img|//head/meta|//title"') + '&format=json&callback=?';
			$.ajax({
		        type: 'GET',
		        url: q, 
		        dataType: 'jsonp',
		        success: function(data, textStatus) {
		            var result = {};
		            console.log(data.query.results);
		            
		            //標題
		            if(data && data.query.results.title){
		            	result.title = data.query.results.title;
		            }
		            
		            //從meta取網址大綱和圖片
		            $.each(data.query.results.meta, function(key, val){
	                    if (val.content && (!result.description || !result.img || !result.title)) {
	                    	// title
	                    	if (!result.title && val.name && val.name.match(/title/i)) {
	                            result.title = val.content;
	                        }
	                    	
	                        // description
	                        if (!result.description && val.name && val.name.match(/description/i)) {
	                            result.description = val.content;
	                        }
	                        
	                        // 取圖片
	                        if (!result.img && (val.content.substring(0, 7) == 'http://'||val.content.substring(0, 2) == '//') && val.content.match(/\.jpg|\.png/)) {
	                            if (val.content != 'undefined') {
	                            	if(val.content.substring(0, 2) == '//'){
	                            		val.content = "http://" + val.content.substring(2);
	                            	}
	                            	result.img = val.content;
	                            }
	                        }
	                    }
	                });
		            
		            //如果沒描述 就和title相同
		            if(!result.description && result.title){
			  			result.description = result.title;
		            }
		            
		            //如果meta圖片存在 並檢查是否圖太小 太小或沒圖的話就從網頁裡的img tag裡面隨便找一張
		            if(result.img){
			            var img = new Image();
			            //因為有時差 所以要寫兩遍
		            	img.onload = function() {
		            		console.log(322);
							if((this.width*this.height) < 10000 && data.query.results.img){
								$.each(data.query.results.img,function(i,val){
			                        if (val.src && val.src.substring(0, 4) == 'http' && val.src.match(/\.jpg|\.png/)) {
			                            result.img = val.src;
			                            return false;
			                        }
			                    });
							}
							
							if(result.title){
								$(".ap-yql-title").html(result.title);
								$(".ap-yql-desc").html(result.description);
								$(".ap-yql-img").html("<img src='" + result.img + "'/>");  
								$(".ap-ta-yql").fadeIn();
							}
		            	}
		            	img.src = result.img;
	            	}else if(data.query.results.img){
	            		$.each(data.query.results.img,function(i,val){
	                        if (val.src && val.src.substring(0, 4) == 'http' && val.src.match(/\.jpg|\.png/)) {
	                            result.img = val.src;
	                            return false;
	                        }
	                    });
	            		
	            		if(result.img && result.title){
							$(".ap-yql-title").html(result.title);
							$(".ap-yql-desc").html(result.description);
							$(".ap-yql-img").html("<img src='" + result.img + "'/>");  
							$(".ap-ta-yql").fadeIn();
						}
	            	}
	    	      }
	    	  });
		});
	}
	
	//parse Youtube
	function getLinkYoutube(url) {
		clearTimeout(activityTimeout);
		activityTimeout = setTimeout(function(){
				$(".ap-yql-img").html("");
			  	var strpos,result={};
			  	if(url.match(/\?v=/)){
			  		if(url.match(/youtube.com/)){
						strpos = url.indexOf("?v=")+3;
					}else{
						strpos = url.indexOf("youtu.be")+9;
					}
					var youtube_code = url.substring(strpos,strpos+11);
					console.log(youtube_code);
					if(youtube_code.length < 11 || youtube_code.match(/\&/)){
						post_tmp_url = '';
						$(".ap-ta-yql").hide();
						getLinkMeta(url);
						return false;
					}else{
						console.log(youtube_code.length);
					}
					
					$(".ap-yql-title").html("");
					$(".ap-yql-desc").html("");
					$(".ap-yql-img").html(
						'<iframe width="320" height="280" src="//www.youtube.com/embed/'+ youtube_code +'" frameborder="0" allowfullscreen></iframe>'
					);  
					$(".ap-ta-yql").fadeIn();
			  	}else{
			  		post_tmp_url = '';
			  		$(".ap-ta-yql").hide();
			  		getLinkMeta(url);
			  	}
		},1000);
	}
	    
	  //計算彈出對話框置中
	function popupShowAdjust(desc,cancel){
		if(!cancel){
			$(".popup-close-cancel").hide();
		}
		
		$(".popup-frame").css("margin-left",0);
	    if(desc){
	        $('.popup-text').html(desc);
	    }
	    $(".popup-screen").show();
	    $(".popup").show();
	    $(".popup-frame").css("margin-left",($(document).width() - $(".popup-frame").width())/2-15);
	}
	
	function popupAfterChangePage(dest){
		$(".popup-close").bind("pageChange",function(){
			$.mobile.changePage(dest);
			$(".popup-close").unbind("pageChange");
		});
	}
	
	//sha1 and base64 encode
	function toSha1Encode(string){
		var hash = CryptoJS.SHA1(string);
	    var toBase64 = hash.toString(CryptoJS.enc.Base64);
	    return toBase64;
	}
	
	//timeline more
	function zoomOut(target)
	{
		target.css("zoom",(zoom_out_cnt/100));
	    if(zoom_out_cnt < 100){
	    	zoom_out_cnt+=4;
	        setTimeout(function(){
	        	zoomOut(target);
	        }, 1);
	    }
	}
	
	function zoomIn(target)
	{
		target.css("zoom",(zoom_in_cnt/100));
	    if(zoom_in_cnt > 10){
	    	zoom_in_cnt-=5;
	        setTimeout(function(){
	        	zoomIn(target);
	        }, 1);
	    }else{
	    	target.hide();
	    }
	}
	
	//秒數轉成時分秒
	function secondsToTime(secs)
	{
	    var s_hours = Math.floor(secs / (60 * 60));
	
	    var divisor_for_minutes = secs % (60 * 60);
	    var s_minutes = Math.floor(divisor_for_minutes / 60);
	
	    var divisor_for_seconds = divisor_for_minutes % 60;
	    var s_seconds = Math.ceil(divisor_for_seconds);
	    return s_minutes + ":" + ((s_seconds < 10)?("0" + s_seconds):(s_seconds));
	}

});  