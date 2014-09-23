$(function(){  

	//load language
	updateLanguage( lang );

	//沒有登入資訊 就導回登入頁面
	if($.lStorage("_loginData")){
		var _loginData = $.lStorage("_loginData");
		//清除_loginData
		localStorage.removeItem("_loginData");
		ui = _loginData.ui;
		at = _loginData.at;

    	//所有團體列表
    	group_list = _loginData.gl;

    	//所有團體列表 obj
    	group_list_obj = {};
    	$.each(group_list,function(i,val){
			group_list_obj[val.gi] = val;
    	});


    	//有group list 就去timeline 沒有就去group menu
        if(group_list) {
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

        	//設定guAll 
        	setGroupAllUser();
        	
        	//header 設定團體名稱
        	$(".header-group-name div:eq(1)").html(gn);
        	
        	//sidemenu name
        	setSmUserData(gi,gu,gn);
        	
        	//做團體列表
        	groupMenuListArea();

        	//top event
        	topEvent();

        	//動態消息
        	//timelineListWrite();
        	setTimeout(function(){
        		timelineListWrite();
        	},1000);
        	
        }

	}else{
		if(window.location.href.match(/webdev.cloud.mitake.com.tw/)) {
    		document.location = "index.html";
    		return false;
    	}else{
    		getLoginDataForTest();
    	}
	}

	// url參數 clear 存在 就清 local storage
    clear = $.getUrlVar('clear');
    if(clear == 123456) {
    	localStorage.clear();
	}


	$( window ).resize(function() {
		if($(".st-top-event").length < 2) return false;

		$(".st-top-bar-area").css("opacity",0);
		var timer = $(document).data("top-event-resize") || {};
		clearTimeout(timer);
		timer = setTimeout(function(){
			topBarMake($(".st-top-area"),$(".st-top-event").length,true);  		
			$(".st-top-bar-area").css("opacity",1);
		},200);
		$(document).data("top-event-resize",timer);


		// $(".st-top-bar-area").css("opacity",0);
		// $(".st-top-bar-area").animate({
		//     opacity: 0
		//   	}, 500, function() {
		// 	topBarMake($(".st-top-bar-area"),$(".st-top-event").length);  		
		// 	$(".st-top-bar-area").animate({opacity: 1});
	 //  	});
	});

	//test
	$(".header-group-name").click(function(){
		cns.debug("side-menu:",$("#side-menu").width());
		//彩蛋鑰匙
		supriseKey();
		
		if($(document).data("suprise") == 101) 
			pollingInterval();
	});


	//timeline下拉更新
	$(window).scroll(function() {
		//timeline 才要做
		if(!$(".feed-subarea").is(":visible")) return false;

		var top_height = $(window).scrollTop();
		
		//下拉更新
		if (top_height < -20 && !$(".st-navi-area").data("scroll-chk")){
			$(".st-navi-area").data("scroll-chk",true);
			timelineTopRefresh();

			//順便檢查置頂
			topEventChk();
		}

		//取舊資料
		var feed_type = $("#page-group-main").data("navi") || "00";

		//判斷沒資料的元件存在時 就不動作
		if($(".feed-subarea[data-feed=" + feed_type + "] .no-data").length) return false;
		
		var this_navi = $(".feed-subarea[data-feed=" + feed_type + "]");
		var last_show_event = this_navi.find(".filter-show").last();
		var last_event = this_navi.find(".st-sub-box").last();
		
		if(last_event.length){
			var bottom_height = $(window).scrollTop() + $(window).height();
			var last_height = last_show_event.offset().top + last_show_event.height() + 25;

			// cns.debug("bottom_height:",bottom_height);
			// cns.debug("last_height:",last_height);

	    	//scroll 高度 達到 bottom位置 並且只執行一次
		    if(bottom_height && bottom_height >= last_height && !this_navi.data("scroll-chk")){
		    	if(this_navi.data("last-ct")){
		    		var time = new Date(this_navi.data("last-ct"));
	        		var time_format = time.customFormat( "#M#/#D# #CD# #hhh#:#mm#" );	
	        		cns.debug("last-ct:",this_navi.data("last-ct"));
	        		cns.debug("最後一筆時間:",time_format);
		    	}
		    	
		    	//避免重複
		    	this_navi.data("scroll-chk",true);
		    	cns.debug("last event ct:",this_navi.data("last-ct"));
		    	timelineListWrite(this_navi.data("last-ct"));
		    }
		}
	});

//----------------------------------- 團體選單 ---------------------------------------------                
	//團體選單 點選團體
	$(document).on('click','.group-list-box',function(e){
	    $.mobile.changePage("#page-group-main");
	});
	
	//團體選單 點選nav
	$(".gm-nav-box").click(function(){
	    $(".gm-nav-box").removeClass("gm-nav-active");
	    $(".gm-nav-box").each(function(i,val){
	    	$(this).find("img").attr("src","images/groupmenu/buildgroup_tab_bt_" + $(this).data("type") + ".png")
	    });
	    
	    $(this).addClass("gm-nav-active");
	    $(this).find("img").attr("src","images/groupmenu/buildgroup_tab_bt_" + $(this).data("type") + "_click.png")

	    $(".gm-sub-area").hide();
	});

	$(".gm-create").click(function(){
		$(".gm-create-area").show();
	});

	$(".gmc-avatar").click(function(){
		$(".gmc-file").trigger("click");
	});

	$(".gmc-file").change(function(e) {
		var file_ori = $(this);
		var imageType = /image.*/;

		//每次選擇完檔案 就reset input file
		// file_ori.replaceWith( file_ori.val('').clone( true ) );
		var file = file_ori[0].files[0];

		if (file.type.match(imageType)) {
			//是否存在圖片
			$(".gmc-avatar").data("chk",true);

			var reader = new FileReader();
			reader.onload = function(e) {
				var img = $(".gmc-avatar-wrap img");

				//調整長寬
				img.load(function() {
					var w = img.width();
		            var h = img.height();
    				mathAvatarPos(img,w,h,120);
		        });

		        img.attr("src",reader.result);
			}

			reader.readAsDataURL(file);	
		}else{
			popupShowAdjust("","檔案必須為圖檔",true);
		}
	});
	
	//創建團體 建立
	$(".gm-create-submit").click(function(){

		if ( !$(".gmc-avatar").data("chk" )){
			popupShowAdjust("","圖片未上傳",true);
	        return false;
		} 
		if ( !$(".gmc-name input").val() ){
			popupShowAdjust("","團體名稱未填寫",true);
	        return false;
		} 

		if ( !$(".gmc-desc textarea").val() ){
	        popupShowAdjust("","團體介紹未填寫",true);
	        return false;
		}else{
			var file = $(".gmc-file")[0].files[0];
			var group_name = $(".gmc-name input").val();
			var group_desc = $(".gmc-desc textarea").val();

			var ori_arr = [1280,1280,0.7];
			var tmb_arr = [120,120,0.6];

			createGroup(group_name,group_desc).complete(function(data){
	        	cns.debug("create group data:",data);
	        	if(data.status == 200){
	        		var cg_result = $.parseJSON(data.responseText);

	        		var api_name = "groups/" + cg_result.gi + "/avatar"

	        		avatarToS3(file,api_name,ori_arr,tmb_arr,[groupMenuListArea,cg_result.gi]);
	        	}
	        });
		}
	});


	//團體邀請
	$(".gm-invite").click(function(){
		$(".gm-invite-area").show();
		getMeInvite();
	});

	$(document).on("click",".gmi-div-delete",function(){
		var this_invite = $(this).parents(".gmi-div");
		var group_name = this_invite.find(".gmi-div-data div:eq(0) span").html();
		popupShowAdjust("","您確定要刪除<div class='popup-blue'>" + group_name + "</div>的團體邀請",true,true,[deleteMeInvite,this_invite]);
	});

	$(document).on("click",".gmi-div-agree",function(){
		agreeMeInvite($(this).parents(".gmi-div"));
	});

	//----------------------------------- 小幫手 ---------------------------------------------
	//小幫手 創建團體
	$(".hg-create").click(function(){
		$("#page-group-menu").data("type","create");
		$(".gm-create").trigger("click");
		$.mobile.changePage("#page-group-menu");
	});
	//小幫手 加入團體
	$(".hg-join").click(function(){
    });
	  //小幫手 團體邀請  側邊選單
	$(".hg-invite").click(function(){
	    $("#page-group-menu").data("type","invite");
	    $(".gm-invite").trigger("click");
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

	$("#page-group-main div[data-role=content]").click(function(e){
		// e.stopPropagation();
		// $( "#side-menu" ).panel( "close");
	});
	
	//detect page changing
	$("#side-menu").on("panelbeforeopen",function(){
	    //timeline固定右邊頁面
	    $("#page-group-main .ui-panel-content-wrap").addClass("page-fixed");
	    
		//調整頭像大小
		var img = $(".sm-user-pic img");
		mathAvatarPos(img,img.width(),img.height(),avatar_size);

		//polling
	});
	

	$("#side-menu").on( "panelbeforeclose", function() {
		//timeline固定右邊頁面
	    $("#page-group-main .ui-panel-content-wrap").removeClass("page-fixed");

		if($(".sm-group-list-area-add").data("switch")){
			$(".sm-switch-ui-adj").removeClass("sm-switch-ui-adj-show");
	    	$(".sm-group-list-area-add").data("switch",false);
	    	$(".sm-group-list-area-add").css("height",0);
	    }
	});

	//開關團體列表
	$(".sm-group-switch").click(function(){
		var target = $(".sm-group-list-area-add");
		var target_height = target.data("height");

		if(target.data("switch")){
			var movement = "-=" + target_height;
		}else{
			var movement = "+=" + target_height;
		}
		$(".sm-group-list-area-add").animate({
		    height: movement
		  	}, 500, function() {
		  		if(target.data("switch")){
		  			target.data("switch",false);
		  			$(".sm-group-switch").find("img").attr("src","images/side_menu/sidemenu_slidedown_icon_click.png");		
		  		}else{
		  			target.data("switch",true);	
		  			$(".sm-group-switch").find("img").attr("src","images/side_menu/sidemenu_slidedown_icon_none.png");
		  		}
	  	});
	});
	
	//按鈕效果
	$(document).on("click",".sm-small-area,.sm-group-area,.sm-group-cj-btn",function(){
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
		timelineSwitch(target.data("sm-act"));
			
	});
	
	
	
	//按鈕效果
	$(document).on("mouseup",".sm-small-area,.sm-group-area,.sm-group-cj-btn",function(){
		var icon_default = "images/side_menu/sidemenu_icon_";
		var target = $(this);
	    setTimeout(function(){

	    	//mouseup了 左側選單 團體調整線 直接刪除就好了 
	    	$(".sm-switch-ui-adj").removeClass("sm-switch-ui-adj-show");

	    	target.removeClass("sm-click-bg");
	    	target.find(".sm-small-area-l img").attr("src",icon_default + target.data("sm-act") + ".png");
	    },500);
	});
	
	//更換團體
	$(document).on("click",".sm-group-area",function(){
		// cns.debug("auo:",$(this).data("auo"));
		// return false;
		// $( "#side-menu" ).panel( "close");
		setThisGroup($(this).attr("data-gi"));
		//更新gu all
		setGroupAllUser();
		
		timelineSwitch("feed");
	});
	
	$(".sm-small-area.setting").click(function(){
		popupShowAdjust("","確定登出？",true,true,[logout]);
	});
	
	//----------------------------------- timeline ---------------------------------------------  
	$(".st-navi-subarea").click(function(){

		var img_dir = "images/timeline/timeline_tab_icon_";
		var subareas = $(".st-navi-area [data-st-navi-group=navi]");
		var this_subarea = $(this);
		subareas.find("div").removeClass("color-white");

		//將選項存入
		$("#page-group-main").data("navi",this_subarea.data("tp"));

		var event_tp = $("#page-group-main").data("navi") || "00";

		//改filter文字為 全部 
		// $(".st-filter-main span").html("全部");

		$(".st-navi-area [data-st-navi-group=navi]").each(function(i,val){
	        //全關 switch開
			$(this).find("img").attr("src",img_dir + $(this).data("st-navi") + ".png");
	    });

		switch(this_subarea.data("st-navi")){
	    	case "home":
	    		 $(".st-navi-tridiv-r").show();
	    		 $(".st-navi-tridiv-l").hide();
	    		 this_subarea.find("img").attr("src",img_dir + "home_white.png");
	    		 this_subarea.find("div:eq(0)").addClass("color-white");
	          break;
	    	case "announcement":
	    		$(".st-navi-tridiv-l").show();
	    		$(".st-navi-tridiv-r").hide();
	    		this_subarea.find("img").attr("src",img_dir + "announcement_white.png");
	    		this_subarea.find("div:eq(0)").addClass("color-white");
	          break;
	    	case "feedback":
	    		$(".st-navi-tridiv-l").show();
	    		$(".st-navi-tridiv-r").hide();
	    		this_subarea.find("img").attr("src",img_dir + "feedback_white.png");
	    		this_subarea.find("div:eq(0)").addClass("color-white");
	          break;
	    	case "task":
	    		$(".st-navi-tridiv-l").show();
	    		$(".st-navi-tridiv-r").hide();
	    		this_subarea.find("img").attr("src",img_dir + "task_white.png");
	    		this_subarea.find("div:eq(0)").addClass("color-white");
	          break;
		}

		timelineListWrite();
	});

	//綁定點選公告事件
	$(document).on("click",".st-top-event",function(){
		var this_top_event = $(this);
		var event_tp = $("#page-group-main").data("navi") || "00";
    	var selector = $(".feed-subarea[data-feed=" + event_tp + "] .st-sub-box");

    	selector.each(function(){
    		var this_event = $(this);
    		cns.debug("ei:",this_event.data("event-id"));
    		if(this_event.data("event-id") == this_top_event.data("data-obj").ei){
    			cns.debug("this event data:",this_event.data());	
    		}
    	});
		// cns.debug("this event:",$(this).data("data-obj"));

		// cns.debug("event:",selector);
	});

	//主要filter
	$(".st-filter-main").click(function(){
		$(this).hide();
		$(".st-filter-main-hide").show();

		$(".st-filter-other").slideToggle();
	});

	//filter 點選的變化
	$(".st-filter-list").click(function(){
		filter_name = $(this).find("span").html();
		//關閉的css樣式
		$(".st-filter-list").removeClass("st-filter-list-active");
		
		//開起的css樣式
		$(this).addClass("st-filter-list-active");
	});

	$(".st-filter-action").click(function(){
		//動態變化
		$(".st-filter-main span").fadeOut("fast");
		$(".st-filter-other").slideUp(function(){
			$(".st-filter-main").addClass("st-filter-list-active");
			$(".st-filter-main img").attr("src","images/timeline/timeline_filter_icon_arrow.png");
			$(".st-filter-main span").html(filter_name);
			$(".st-filter-main span").fadeIn("fast");

			$(".st-filter-main-hide").hide();
			$(".st-filter-main").show();
		});

		//做搜尋
		//先關閉全區域
		$(".st-feedbox-area").hide();

		var event_tp = $("#page-group-main").data("navi") || "00";
		var this_events = $(".feed-subarea[data-feed=" + event_tp + "] .st-sub-box");

		var filter_status = $(this).data("status");

		//記錄
		$(".st-filter-area").data("filter",filter_status);
		$(".feed-subarea[data-feed=" + event_tp + "]").data("filter-name",$(this).find("span").html());
		
		//已讀未讀
		this_events.each(function(i,val){
			eventFilter($(this),filter_status);
		});

		//開啟全區域
		$(".st-feedbox-area").fadeIn("slow");
	});

	$(".st-filter-list-btn").click(function(){
		$(".st-filter-other").slideUp(function(){
			$(".st-filter-main-hide").hide();
			$(".st-filter-main").show();
		});
	});

	
	$(document).on('click','.st-like-btn',function(){
		var this_event = $(this).parents(".st-sub-box");
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

    	if(!event_status){
    		event_status = {};
    	}

    	//按讚區域
    	var parti_list = this_event.data("parti-list");

    	//檢查按讚了沒
		var like_chk = chkEventStatus(this_event,"il");
		// cns.debug("like_chk:",like_chk);
		//按讚 like_chk是true
		if(like_chk){
			$(this).html("收回讚");
			var est = 1;

			//存入event status
			event_status.il = true;

			//按讚區域 改寫陣列
			parti_list.push(gu);
		}else{
			//收回
			$(this).html("讚");
			var est = 0;

			//存入event status
			event_status.il = false;

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

			event_status.ir = true;
			//發完api後做真正存入動作
			target_obj.status = event_status;
			putEventStatus(target_obj,0,1);
		}
	});
	
	//點選開啟圖庫
	$(document).on("click",".img-show",function(){
		var this_img_area = $(this);

		var this_s32 = this_img_area.find(".auo").attr("src");
		var gallery_str = '<li data-thumb="' + this_s32 + '"><img src="' + this_s32 + '" /></li>';

		var img = new Image();
		img.onload = function() {
			var gallery = window.open("flexslider/index.html", "", "width=" + this.width + ", height=" + this.height);
    		$(gallery.document).ready(function(){
    			setTimeout(function(){
    				var this_slide = $(gallery.document).find(".slides");
    				this_slide.html(gallery_str);
    				$(gallery.document).find("input").val(1);
    				$(gallery.document).find("button").trigger("click");
    			},300);
    		});
		}
		img.src = this_s32;
		
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
		putEventStatus(target_obj,1,est);
	});

	//留言
	$(document).on('click','.st-message',function(){
		//
		// var pos = $(this).parents(".st-sub-box").find(".st-reply-message-area").position().top;

		// $('html, body').animate({scrollTop: $(this).parents(".st-sub-box").find(".st-reply-message-area").position().top}, 0);
		//判斷開啟或關閉
		var movement = $(".st-reply-message-area").data("movement");

		//設定 this event
		var this_event = $(this).parents(".st-sub-box");

		

		//開啟detail
		if(!this_event.data("switch-chk")){
			this_event.find(".st-sub-box-1").trigger("click");
		}

		this_event.find(".st-reply-message-area").slideToggle();

		// var new_ei = this_event.data("event-id");
		// var old_ei = $(".st-reply-message-area").data("event-id");

		//將新的ei 更新進留言區域
		// $(".st-reply-message-area").data("event-id",new_ei);

		//如果留言區域在沒關閉時就點選新的event => 重新開啟留言區域 然後不執行之後的開關
		// if(movement == -50 && new_ei != old_ei){
		// 	$(".st-reply-message-area").css("bottom",-50);
		// 	$(".st-reply-message-area").animate({bottom:0});
		// 	return false;
		// }
		
		//動畫結束與否
		// var animate_chk = $(".st-reply-message-area").data("animate-chk");

		// if(animate_chk){
		// 	//變成不能開啟狀態
		// 	$(".st-reply-message-area").data("animate-chk",false);

		// 	$(".st-reply-message-area").animate({bottom:movement},function(){
		// 		//變成可以開啟狀態
		// 		$(".st-reply-message-area").data("animate-chk",true);


		// 		if(movement == 0){
		// 			$(".st-reply-message-area").data("movement",-50);
		// 		}else{
		// 			$(".st-reply-message-area").data("movement",0);
		// 		}
				
		// 	});
		// }
	});

	//滾動隱藏留言
	// $(document).on('scroll',function(){
	// 	if($(".st-reply-message-area").data("movement") == 0) return false;

	// 	$(".st-reply-message-area").data("movement",0);
	// 	$(".st-reply-message-area").data("animate-chk",false);

	// 	$(".st-reply-message-area").animate({bottom:"-50px"},function(){
	// 		//變成可以開啟狀態
	// 		$(".st-reply-message-area").data("animate-chk",true);
			
	// 	});		
	// });

	//留言送出
	$(document).on('click','.st-reply-message-send',function(){
		var this_event = $(this).parents(".st-sub-box");
		if(!this_event.find(".st-reply-message-textarea textarea").val()) return false;

		if($(this).data("reply-chk")){
			return false;
		}

		$(this).data("reply-chk",true);

		replySend(this_event);
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
		//管理者可開啟公告
		if($.lStorage(ui)[gi].guAll[gu].ad == 1){
			$(".fc-area-subbox[data-fc-box=announcement]").show();
		}else{
			$(".fc-area-subbox[data-fc-box=announcement]").hide();
		}

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
		
		//判斷現在是開啟還是關閉
		if(this_event.data("switch-chk")){
			this_event.data("switch-chk",false);
		}else{
			this_event.data("switch-chk",true);
		}

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
                "li":lang
                    };
        var method = "get";
        ajaxDo(api_name,headers,method,false).complete(function(data){
        	var e_data = $.parseJSON(data.responseText).el;

	        	//計算投票的回文人次
	        	var count = 0;
	        	
	        	cns.debug("==================== 詳細內容 ================================");
	            cns.debug(JSON.stringify(e_data,null,2));
	            
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
	    				//工作
	    				this_event.find(".st-box2-more-task-area").hide();
	    				this_event.find(".st-box2-more-task-area-detail").show();
	    				//開啟工作細節
	    				this_event.find(".st-task-work-detail").show();

	    				if(this_event.data("task-over")) break;
	    				break;
	    			case 4:
	    				this_event.find(".st-box2-more-task-area").hide();
	    				this_event.find(".st-box2-more-task-area-detail").show();
	    				//開啟投票細節
	    				this_event.find(".st-task-vote-detail").show();
	    				
	    				if(this_event.data("task-over")) break;
	    				//判斷有無投票過 顯示送出 已送出 已結束等等
	    				var event_status = this_event.data("event-status");
	    				if(event_status && event_status.ik){
	    					this_event.find(".st-vote-send").html("完成");
	    					this_event.find(".st-vote-send").removeClass(".st-vote-send-blue");
	    				}
	    				
	    				break;
	    			case 5:
	    				break;
	    			case 6:
	    				break;
	    		};

	    		//讚留言閱讀
        		this_event.find(".st-sub-box-3 div:eq(0)").html(e_data[0].meta.lct);
        		this_event.find(".st-sub-box-3 div:eq(1)").html(e_data[0].meta.pct);
        		this_event.find(".st-sub-box-3 div:eq(2)").html(e_data[0].meta.rct);

	    		//detail timeline message內容
				detailTimelineContentMake(this_event,e_data);
    		});
	});



	
	//timeline裏面點擊不做展開收合的區域 設定在init.js
	$(document).on("click",timeline_detail_exception.join(","),function(e){
		e.stopPropagation();
	});
	
	
	//----------------------------------- compose-貼文 ---------------------------------------------

	
	//貼文選單
	$(".fc-area-subbox").click(function(){
		//定點回報暫時不做
		if($(this).hasClass("fc-check")) return false;

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

	//compose 送出	
	$(".cp-post").click(function(){
		var this_compose = $(document).find(".cp-content");

		//防止重複送出
		if(!this_compose.data("send-chk")){
			return false;
		}

		this_compose.data("send-chk",false);

		//允許繼續點選送出
		setTimeout(function(){
			this_compose.data("send-chk",true);
		},1500);
 			
		this_compose.data("compose-content",$('.cp-textarea-desc').val());
		this_compose.data("compose-title",$('.cp-textarea-title').val());

		var ctp = this_compose.data("compose-tp");
		var empty_chk = true;

		//錯誤訊息
		var error_msg_arr = [];
		error_msg_arr[".cp-textarea-title"] = "標題尚未填寫";
		error_msg_arr[".cp-textarea-desc"] = "內容尚未填寫";

		var chk_arr = [".cp-textarea-desc"];

		//判斷欄位是否填寫
		switch(ctp){
			case 0://普通貼文
				break;
			case 1://公告
				chk_arr.push(".cp-textarea-title");
				break;
			case 2://通報
				break;
			case 3://任務 工作
				chk_arr.push(".cp-textarea-title");
				break;
			case 4://任務 投票
				chk_arr.push(".cp-textarea-title");
				break;
			case 5://任務 定點回報
				break;
		}
 		
 		$.each(chk_arr,function(i,chk_str){
 			//有一個不存在就跳錯誤訊息
 			if(!$(chk_str).val()){
 				empty_chk = false;
 				popupShowAdjust("",error_msg_arr[chk_str],true);
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


		var this_compose = $(document).find(".cp-content");
		$(".cp-file").trigger("click");

		var add_type = target.data("cp-addfile");
		switch(add_type){
			case "img":
				break;
		}

	});


	$(".cp-file").change(function(e) {

		var this_compose = $(document).find(".cp-content");

		$(document).find(".cp-attach-area").show();
		$(document).find(".cp-file-area").show();
		$(document).find(".cp-file-img-area").show();

		$(".cp-file-img-area").html("");

		var file_ori = $(this);
		var imageType = /image.*/;
		var limit_chk = false;
		// var upload_arr = this_compose.data("upload-arr");

		$.each(file_ori[0].files,function(i,file){
			if(Object.keys(this_compose.data("upload-obj")).length == 9 ){
				limit_chk = true;
				return false;
			}
			
			//流水號
			var ai = this_compose.data("upload-ai");
			this_compose.data("upload-obj")[ai] = file;
			this_compose.data("upload-ai",ai+1)
		});

		if(limit_chk){
			popupShowAdjust("","圖檔最多限制9個");
			// return false;
		}

		//每次選擇完檔案 就reset input file
		file_ori.replaceWith( file_ori.val('').clone( true ) );

		$.each(this_compose.data("upload-obj"),function(i,file){
			var this_grid =  $('<div class="cp-grid"><div><img/></div><img class="grid-cancel" src="images/common/icon/icon_compose_close.png"/></div>');
			$(".cp-file-img-area").append(this_grid);
			
			//編號 方便刪除
			this_grid.data("file-num",i);

			if (file.type.match(imageType)) {

				//有圖片就push進 compose message list
				if($.inArray(6,this_compose.data("message-list")) < 0){
					this_compose.data("message-list").push(6);

					//附檔區域存在附檔
					this_compose.data("attach",true);
				}

				var reader = new FileReader();
				reader.onload = function(e) {
					var img = this_grid.find("div img");

					//調整長寬
					img.load(function() {
						var w = img.width();
			            var h = img.height();
        				mathAvatarPos(img,w,h,100);
			        });

			        img.attr("src",reader.result);
				}

				reader.readAsDataURL(file);	
			}else{
				this_grid.find("div").html('<span>file not supported</span>');
			}


		});
	});

	$(document).on("click",".cp-grid .grid-cancel",function(e){
		var this_compose = $(document).find(".cp-content");
		var this_grid = $(this).parent();
		var file_num = this_grid.data("file-num");
		var this_cancel = $(this);
		this_cancel.attr("src","images/common/icon/icon_compose_close_click.png");
		setTimeout(function(){

			//刪除upload arr
			delete this_compose.data("upload-obj")[file_num];

			this_cancel.attr("src","images/common/icon/icon_compose_close.png");
			this_cancel.remove();
			this_grid.hide('fast', function(){ 
				this_grid.remove(); 

				//圖檔區沒東西了 就剔除message list
				if($(document).find(".cp-file-img-area").html() == ""){
					this_compose.data("message-list").splice($.inArray(6,this_compose.data("message-list")),1);

					//圖檔刪光了 而且附檔區域沒有其他東西 就關閉附檔區域
					var chk = false;
					$.each(this_compose.data("message-list"),function(i,val){
						if($.inArray(val,attach_mtp_arr) >= 0){
							chk = true;
							return false;
						}
					});

					if(!chk){
						this_compose.find(".cp-attach-area").hide('fast');
					}
					
				}
			});
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
	    	$(".main-contact-l-subarea-row").height("0px");
	    }
	});

	$(".sm-user-area-r > img").click(function(){
		userInfoShow();
	});


	$(document).on("mousedown",".user-info-close",function(){
		$(this).attr("src","images/common/icon/bt_close_activity.png");
	});
	$(document).on("mouseup",".user-info-close",function(){
		$(".screen-lock").fadeOut();
		$(this).attr("src","images/common/icon/bt_close_normal.png");
		$(".user-info-load-area").fadeOut("fast");
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

	
	//polling update cnts
	$(document).on("click",".polling-cnt",function(e){
		// cns.debug("polling-cnt:",$(this).data("polling-cnt").substring);
		// return false;
		updatePollingCnts($(this).find(".sm-count"),$(this).data("polling-cnt"));
	});	


	$(document).on("click",".namecard",function(e){
		e.stopPropagation();
		cns.debug("hehe:",$(this).data("auo"));
	});
	
	//$(document).on("timeupdate",".st-attach-audio audio",function(){
	//	cns.debug(55555);
	////this_box.find("audio").on('timeupdate', function() {
	//	this_box = $(this).parent(".st-attach-audio");
	//	cns.debug(this_box.find('input[type="range"]'));
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

	
	/*
              ████████╗███████╗███████╗████████╗          
              ╚══██╔══╝██╔════╝██╔════╝╚══██╔══╝          
    █████╗       ██║   █████╗  ███████╗   ██║       █████╗
    ╚════╝       ██║   ██╔══╝  ╚════██║   ██║       ╚════╝
                 ██║   ███████╗███████║   ██║             
                 ╚═╝   ╚══════╝╚══════╝   ╚═╝                                               
	*/
	var smHrCliclTimes = 0;
	$(".sm-hr").click(function(){
		smHrCliclTimes++;
		if(smHrCliclTimes>4){
			$("div[data-sm-act='chat']").show();
			smHrCliclTimes=0;

			if( g_bIsPolling ){
				initChatDB();
				initChatCntDB();
				pollingInterval();
			}
			//彩蛋中的彩蛋
			supriseYeah();
		}
	});
});  