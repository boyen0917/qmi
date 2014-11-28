$(function(){  

	//load language
	updateLanguage( lang );

	//沒有登入資訊 就導回登入頁面
	if($.lStorage("_loginData")){
		
		var _loginData = $.lStorage("_loginData");

		//自動登入
		if(!$.lStorage("_loginAutoChk")){
			//清除_loginData
			localStorage.removeItem("_loginData");
		}

		ui = _loginData.ui;
		at = _loginData.at;
			

		//聊天室開啓DB
    	initChatDB(); 
		initChatCntDB(); 

		//預設 default group
		setDefaultGroup();

		//第一次進來 沒團體的情況
		if(!$.lStorage("_groupList")){
			//關閉返回鍵
			$("#page-group-menu .page-back").hide();
			cns.debug("no group ");
		}else{

			//header 設定團體名稱
	    	$(".header-group-name div:eq(1)").html(gn);
	    	
			//執行polling
			pollingInterval();

			//將團體設定至 localstorage ui裡
			setGroupList();

	    	//設定guAll 
	    	setGroupAllUser(false,false,function(){
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
	    	});
		}
	}else{
    	document.location = "index.html";
    	return false;
	}

	$( window ).resize(function() {
		//top event
		if($(".st-top-event").length < 2) return false;

		//reply textarea
		var reply_textarea = $(document).find(".st-reply-message-textarea");
		var this_event = reply_textarea.parents(".st-sub-box");
		reply_textarea.css("width",$(window).width()- (this_event.hasClass("detail") ? 200 : 450));
	});

	//test
	$(".header-group-name").click(function(){
		// $(".subpage-timeline ").animate({bottom:"125px"});
		cns.debug("asdf");
		//彩蛋鑰匙
		supriseKey();
	});

	//下拉更新 滾輪版 
	$(".subpage-timeline ").bind('mousewheel DOMMouseScroll', function(event){

		var group_main = $(this);
		//timeline 才要做
		if(!$(".feed-subarea").is(":visible") || group_main.data("scroll-cnt") < 0 || $(".st-top-area-load").position().top < 50) return;

		if (event.originalEvent.wheelDelta > 0 || event.originalEvent.detail < 0) {

			//控制時限
			if(group_main.data("scroll-timer")) clearTimeout(group_main.data("scroll-timer"));

            var scroll_timer = setTimeout(function(){
            	group_main.data("scroll-cnt",0);
            },500);

            group_main.data("scroll-timer",scroll_timer);

            //計算力道
            var scroll_cnt = group_main.data("scroll-cnt") || 0;
            scroll_cnt = scroll_cnt + event.originalEvent.wheelDelta;
            group_main.data("scroll-cnt",scroll_cnt);

            //滾得夠猛 做下拉更新
            if(scroll_cnt > 5000) {
            	group_main.data("scroll-cnt",-10000);

				timelineTopRefresh();

				//順便檢查置頂
				topEventChk();
            }
        }		   
    });

	//timeline 滾到底部取舊資料
	$(".feed-subarea ").bind('mousewheel DOMMouseScroll', function(){

		//取舊資料
		var feed_type = $("#page-group-main").data("navi") || "00";

		//判斷沒資料的元件存在時 就不動作
		if($(".feed-subarea[data-feed=" + feed_type + "]").hasClass("no-data")) return;	
		
		var this_navi = $(".feed-subarea[data-feed=" + feed_type + "]");
		var last_show_event = this_navi.find(".filter-show").last();
		var last_event = this_navi.find(".st-sub-box").last();
		
		if(last_show_event.length){
			var bottom_height = $(window).scrollTop() + $(window).height();
			var last_height = last_show_event.offset().top + last_show_event.height() + 25;

			// cns.debug("this_navi:",{name:this_navi.selector,data:this_navi.data("scroll-chk")});
	    	//scroll 高度 達到 bottom位置 並且只執行一次
		    if(bottom_height && bottom_height >= last_height && !this_navi.data("scroll-chk")){
		    	
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

	        		uploadToS3(file,api_name,ori_arr,tmb_arr,function(chk){
	        			if(!chk) {
	        				toastShow("團體頭像上傳失敗");
	        			}

	        			groupMenuListArea(cg_result.gi);
	        		});
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
		popupShowAdjust("",$.i18n.getString("GROUP_REJECT_ALERT","<div class='popup-blue'>" + group_name + "</div>"),true,true,[deleteMeInvite,this_invite]);
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
	
	//更換動態
	$(document).on("click",".sm-small-area,.sm-group-area",function(){
		//滾動至最上面
		// $(".subpage-timeline ").animate({scrollTop: 0}, 0);

		var icon_default = "images/icon/icon_timeline_tab_";
		//圖片先還原
		$(".sm-small-area").each(function(i,val){
			$(this).find("img").attr("src",icon_default + $(this).data("sm-act") + "_normal.png");
		});

		var target = $(this);

		if($(this).hasClass("sm-group-area")){
			target = $(".sm-small-area[data-sm-act=feeds]");
		}else{
			timelineSwitch(target.data("sm-act"));
		}
		
		target.addClass("sm-click-bg");
		target.find(".sm-small-area-l img").attr("src",icon_default + target.data("sm-act") + "_activity.png");
		
	});
	
	//更換團體
	$(document).on("click",".sm-group-area.enable",function(){
		var this_group = $(this);
		$(".sm-group-area").removeClass("enable");

		//清空畫面
		$(".st-top-event-default").show();
		$(".st-top-event-set").hide();
		$(".feed-subarea").html("");
		
		var this_gi = $(this).attr("data-gi");
		setThisGroup(this_gi);
		//更新gu all
		setGroupAllUser(false,false,function(){
			timelineSwitch("feeds",true);

			setSmUserData(gi,gu,gn);
			cns.debug("this_gi",this_gi);
			//置頂設定
			topEvent();

			//左側選單圖案變換
			setSidemenuHeader(this_gi);

			setTimeout(function(){
				$(".sm-group-area").addClass("enable");
			},500);
		});
	});
	
	$(".sm-small-area.setting").click(function(){
		popupShowAdjust("",$.i18n.getString("SETTING_DO_LOGOUT"),true,true,[logout]);
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

		// $(".st-navi-area [data-st-navi-group=navi]").each(function(i,val){
	 //        //全關 switch開
		// 	$(this).find("img").attr("src",img_dir + $(this).data("st-navi") + ".png");
	 //    });

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

	// //綁定點選公告事件
	// $(document).on("click",".st-top-event",function(){
	// 	var this_top_event = $(this);
	// 	var event_tp = $("#page-group-main").data("navi") || "00";
 //    	var selector = $(".feed-subarea[data-feed=" + event_tp + "] .st-sub-box");

 //    	selector.each(function(){
 //    		var this_event = $(this);
 //    		cns.debug("ei:",this_event.data("event-id"));
 //    		if(this_event.data("event-id") == this_top_event.data("data-obj").ei){
 //    			cns.debug("this event data:",this_event.data());	
 //    		}
 //    	});
	// 	// cns.debug("this event data:",$(this).data("data-obj"));

	// 	// cns.debug("event:",selector);
	// });

	//主要filter
	$(".st-filter-main").click(function(){
		$(this).hide();
		$(".st-filter-main-hide").show();

		$(".st-filter-other").slideToggle();
	});

	$(".st-filter-action").click(function(){
		var filter_name = $(this).find("span").html();

		//動態變化
		$(".st-filter-main span").fadeOut("fast");
		$(".st-filter-other").slideUp(function(){
			$(".st-filter-main").addClass("st-filter-list-active");
			$(".st-filter-main img").attr("src","images/icon/icon_arrow_right.png");
			$(".st-filter-main span").html(filter_name);
			$(".st-filter-main span").fadeIn("fast");

			$(".st-filter-main-hide").hide();
			$(".st-filter-main").show();
		});

		var filter_status = $(this).data("status");

		//過濾發文類型
		if(filter_status == "navi" || filter_status == "all"){
        	$(".st-navi-subarea[data-st-navi="+ $(this).data("navi") +"]").trigger("click");
        	// return false;
		}

		var event_tp = $("#page-group-main").data("navi") || "00";
		var this_events = $(".feed-subarea[data-feed=" + event_tp + "] .st-sub-box");

		//做過濾
		//先關閉全區域
		$(".st-feedbox-area").hide();

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

	$(document).on('click','.st-sub-box-3 .st-like',function(){
		var this_event = $(this).parents(".st-sub-box");
		var like_count = parseInt(this_event.find(".st-sub-box-3 div:eq(0)").html());
		//按讚 收回 api
		var target_obj = {};
		target_obj.selector = this_event;
		target_obj.act = "like1";
		target_obj.order = 0;
		
		//存回
    	var this_ei = this_event.data("event-id");

    	//event path
		this_event.data("event-path",this_ei);


		//按讚區域
    	var parti_list = this_event.data("parti-list");

		//檢查按讚了沒
		//按讚 like_chk是true
		if(!this_event.data("event-val").meta.il){
			var est = 1;

			//按讚區域 改寫陣列
			parti_list.push(gu);
		}else{
			//收回
			var est = 0;

			//按讚區域 改寫陣列
			var i = $.inArray(gu,parti_list);
			parti_list.splice(i,1);
		}

		//發完api後做真正存入動作
		putEventStatus(target_obj,1,est,function(chk){

			if(chk){
				//做按讚區域改寫 (你、按讚)
				this_event.data("parti-list",parti_list);
				//detail開啓 才做按讚敘述
				if(this_event.data("detail-content")) detailLikeStringMake(this_event);
			}
		});
	});

	//show 已讀列表
	$(document).on('click','.st-sub-box-3 .st-read',function(){
		cns.debug("read list");
		var this_event = $(this).parents('.st-sub-box');

		timelineObjectTabShowDelegate( this_event, 0, function(){
			cns.debug("on back from read/unread");
		});
	});

	//回覆按讚
	$(document).on('click','.st-reply-message-like',function(){
		var this_event = $(this).parents('.st-reply-content-area');
		var event_path = this_event.data("event-path");
		var parent_event = $(this).parents(".st-sub-box");
		
		//判斷是讚 還是 收回讚
		var est = 0;
		if($(this).html().length == 1){
			est = 1;
		}

		//更新狀態 參數
		var target_obj = {};
		target_obj.selector = this_event;
		target_obj.status = parent_event.data("event-status");
		target_obj.reply = true;
		putEventStatus(target_obj,1,est);
	});

	
	//點選開啟圖庫
	$(document).on("click",".img-show",function(e){
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

	//sticker
	$(document).on('click','.st-reply-message-sticker',function(){
		var stickerIcon = $(this);
		var stickerArea = stickerIcon.parents(".st-sub-box").find(".stickerArea");

		if( "t"==stickerIcon.attr("data-open") ){
			stickerIcon.attr("data-open", "");
			stickerArea.hide();
			stickerIcon.attr("src", "images/chatroom/chat_textbar_icon_emoticon.png");
		} else {
			if( true!=stickerArea.data("isCreate") ){
				stickerArea.data("isCreate", true);
				initStickerArea.init(stickerArea, function(id){
					//on sitcker selected
					cns.debug(id);
					var path = getStickerPath(id);
					var preview = stickerIcon.parent().find(".st-reply-message-img");
					preview.data("type",5);
					preview.html("<div class='img'><img src='"+path+"'/></div>");
					preview.data("id", id);
					
					var allStickerArea = $(".stickerArea .imgArea");
					$.each( allStickerArea, function(index){
						var dom = $(this);
						initStickerArea.updateHistory( dom.parent() );
					});
					cns.debug("1");
				});
			}

			$('.st-reply-message-sticker[data-open="t"]').trigger("click");
			stickerIcon.attr("data-open", "t");
			stickerArea.show();
			stickerIcon.attr("src", "images/chatroom/chat_textbar_icon_emoticon_activity.png");
		}
	});

	//取消sticker或圖片
	$(document).on('click','.st-reply-message-img .img',function(){
		var tmp = $(this).parent();
		tmp.html("");
		cns.debug( tmp.data("type") );
		tmp.removeData("type");
		tmp.removeData("id");
		tmp.removeData("file");
		cns.debug( tmp.data("type") );
	});

	//圖片
	$(document).on('click','.st-reply-message-attach',function(){
		$(this).siblings(".st-reply-message-file").trigger("click");
	});

	//圖片檔案處理
	$(document).on('change','.st-reply-message-file',function(e){
		var file_ori = $(this);
		if(file_ori[0].files.length>1){
			popupShowAdjust("","圖檔最多限制1個");
			return false;
		}

		var imageType = /image.*/;
		$.each(file_ori[0].files,function(i,file){

			if (file.type.match(imageType)) {
				var this_grid =  file_ori.parent().find(".st-reply-message-img");
				this_grid.data("type",6);
				this_grid.html("<div class='img'><img/></div>");

				this_grid.data("file",file);

				var reader = new FileReader();
				reader.onload = function(e) {
					var img = this_grid.find("div img");

					//調整長寬
					// img.load(function() {
					// 	var w = img.width();
			  //           var h = img.height();
     //    				mathAvatarPos(img,w,h,100);
			  //       });

			        img.attr("src",reader.result);
			        img.css("border", "lightgray 1px solid");
				}

				reader.readAsDataURL(file);
			}else{
				// this_grid.find("div").html('<span>file not supported</span>');
			}
		});

		//每次選擇完檔案 就reset input file
		file_ori.replaceWith( file_ori.val('').clone( true ) );
	});
	
	//留言ui調整
	$(document).on("input",".st-reply-message-textarea textarea",function(){
		var this_textarea = $(this);
		if(this_textarea.height() > 40 && this_textarea.parent().hasClass("adjust")) {
			this_textarea.parent().removeClass("adjust");
			this_textarea.addClass("textarea-animated");
			return false;
		}

		if(!this_textarea.val()){
			this_textarea.parent().addClass("adjust");
			this_textarea.removeClass("textarea-animated");
			return false;
		}

		setTimeout(function(){
			if (this_textarea.height() < 40 && !this_textarea.parent().hasClass("adjust")) {
				this_textarea.parent().addClass("adjust");
				this_textarea.removeClass("textarea-animated");
			}
		},201);
	});

	//留言送出
	$(document).on('click','.st-reply-message-send',function(){
		var this_event = $(this).parents(".st-sub-box");
		var text = this_event.find(".st-reply-message-textarea textarea").val();
		var sticker = this_event.find(".st-reply-message-img").data("type");
		if(!text && !sticker) return false;

		if($(this).data("reply-chk")){
			return false;
		}

		$(this).data("reply-chk",true);

		replySend(this_event);
	});


	//文章區塊 編輯按鈕
	$(document).on('click','.st-sub-box-more-btn-stop',function(e){
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
	$(document).on("mousedown",".st-sub-box-1, .st-sub-box-2, .st-sub-box-3 .st-response",function(e){
		var this_event = $(this);

		this_event.data("trigger",true);
		setTimeout(function(){
			this_event.data("trigger",false);
		},300);
			
		
	});

	$(document).on("mouseup",".st-sub-box-1, .st-sub-box-2",function(e){
		if($(this).data("trigger")) $(this).trigger("detailShow");
	});

	$(document).on("mouseup",".st-sub-box-3 .st-response",function(e){
		if($(this).data("trigger")) $(this).parent().trigger("detailShow");
	});

	//detail view
	$(document).on("detailShow",".st-sub-box-1, .st-sub-box-2, .st-sub-box-3",function(){

		var this_event = $(this).parent();

		//detail頁面 離去
		if(this_event.data("detail-page")) return false;

		var this_ei = this_event.data("event-id");

		//此則timeline種類
		var tp = this_event.data("timeline-tp");
		
		//判斷現在是開啟還是關閉
		if(this_event.data("switch-chk")){
			this_event.data("switch-chk",false);
		}else{
			this_event.data("switch-chk",true);
		}
		cns.debug("st-sub-box-2-content:",this_event.find(".st-sub-box-2-content").is(":visible"));
		//動態消息 判斷detail關閉區域
		var detail_chk = timelineDetailClose(this_event,tp);
		
		//重置
		if(!detail_chk){
			this_event.find(".st-reply-all-content-area").html("");
			this_event.find(".st-vote-all-ques-area").html("");
			return false;
		}
		
		//此則動態的按贊狀況
		getThisTimelinePart(this_event,1,function(data){
			
			if(!data.responseText) return false;

			var epl = $.parseJSON(data.responseText).epl;
            
			if(typeof epl != "undefined" && epl.length > 0){
				var parti_list = [];
				$.each(epl,function(i,val){
					parti_list.push(val.gu);
				});

				// 存回 陣列
				this_event.data("parti-list",parti_list);
				this_event.data("parti-like",epl);
				// 編輯讚好區域
				detailLikeStringMake(this_event);
			}
		});
		
		//單一動態詳細內容
        getEventDetail(this_ei).complete(function(data){
        	if(data.status != 200) return false;

        	var e_data = $.parseJSON(data.responseText).el;

        	eventContentDetail(this_event,e_data);
        	
    		//detail timeline message內容
			detailTimelineContentMake(this_event,e_data);
		});
	});
	
	$(document).on("click",".st-reply-like-area",function(){
		var this_event = $(this).parents(".st-sub-box");
		cns.debug("gogoogg",this_event.data());
		timelineObjectTabShowDelegate( this_event, 1, function(){
			cns.debug("back from like list");
		});
	});
	
	//timeline裏面點擊不做展開收合的區域 設定在init.js
	$(document).on("mouseup",timeline_detail_exception.join(","),function(e){
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
		error_msg_arr[".cp-textarea-title"] = $.i18n.getString("COMPOSE_TITLE_EMPTY");
		error_msg_arr[".cp-textarea-desc"] = $.i18n.getString("COMPOSE_ DESCRIPTION_EMPTY");

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

	
	//貼文-下方附檔功能bar
	$(".cp-addfile").click(function(){
		var img_url = "images/compose/compose_form_addfile_";
		var target = $(this);

		// var this_compose = $(document).find(".cp-content");
		var add_type = target.data("cp-addfile");
		switch(add_type){

			case "img":	//附影像
				$(".cp-file").trigger("click");
				target.find("img").attr("src",img_url+target.data("cp-addfile")+"_visit.png");
				setTimeout(function(){
					target.find("img").attr("src",img_url+target.data("cp-addfile")+".png");
				},100);
				break;

			case "sticker":	//附貼圖
				var stickerArea = $("#page-compose .stickerArea");
				
				if( true==stickerArea.data("open") ){
					stickerArea.hide();
					stickerArea.data("open",false);
					target.find("img").attr("src",img_url+target.data("cp-addfile")+".png");
				} else {
					if( true!=stickerArea.data("isCreate") ){
						stickerArea.data("isCreate", true);
						initStickerArea.init(stickerArea, function(id){
							var this_compose = $(document).find(".cp-content");
							var path = getStickerPath( id );
							var preview = $("#page-compose .cp-sticker-area");
							preview.html("<div class='sticker'><img src='"+path+"'/></div>")
							this_compose.data("stickerID", id);
							preview.show();
							if( null== this_compose.data("message-list") ) this_compose.data("message-list",[] );
							if($.inArray(5,this_compose.data("message-list")) < 0){
								this_compose.data("message-list").push(5);
							}
							$("#page-compose .cp-attach-area").show();

							var allStickerArea = $(".stickerArea .imgArea");
							$.each( allStickerArea, function(index){
								var dom = $(this);
								initStickerArea.updateHistory( dom.parent() );
							});
							cns.debug("2");
						});
					}

					stickerArea.show();
					stickerArea.data("open",true);
					target.find("img").attr("src",img_url+target.data("cp-addfile")+"_visit.png");
				}
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

	//貼文-點選貼圖時取消貼圖
	$(document).on("click", ".cp-sticker-area .sticker", function(e){
		//delete & hide sticker preview
		var stickerArea = $(document).find(".cp-sticker-area");
		stickerArea.html("");
		stickerArea.hide();
		//clear data
		var this_compose = $(document).find(".cp-content");
		this_compose.data("message-list").splice($.inArray(5,this_compose.data("message-list")),1);
		this_compose.data("stickerID",null);
		var list = this_compose.data("message-list");
		if( !list || list.length.length==0 ){
			this_compose.find(".cp-attach-area").hide('fast');
		}
		composeCheckMessageList();
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

					composeCheckMessageList();
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

	$(document).on("mousedown",".user-info-close",function(){
		$(this).attr("src","images/common/icon/bt_close_activity.png");
	});
	$(document).on("mouseup",".user-info-close",function(){

		//歸位
		$(window).scrollTop($(document).data("namecard-pos"));

		//翻面特殊處理
		if($(".user-info-load-area .me").hasClass("adjust")){
			$(".user-info-load-area").addClass("transition1s");
            $(".user-info-load-area").addClass("user-info-flip");
            $(".user-info-load-area .me").removeClass("adjust");
		}

		$("body").removeClass("user-info-adjust");

		//reset
		$(".user-info-load-area > div").html("");

		$(".screen-lock").fadeOut();
		$(this).attr("src","images/common/icon/bt_close_normal.png");
		$(".user-info-load-area").fadeOut("fast",function(){
			$(".user-info-load-area").removeClass("user-info-flip");
			$(".user-info-load-area .user").show();
		});

	});

	$(document).on("mouseup",".user-info-back",function(){
		// $(".me-info-load user-avatar > ")
		$(".user-info-load-area").addClass("user-info-flip");
        $(".user-info-load-area .me").removeClass("adjust");

		setTimeout(function(){
	        $(".user-info-load-area").addClass("transition1s");

			$(".user-info-load-area").removeClass("user-info-flip");

			$(".user-info-load , .me-info-load").stop().animate({
				opacity:0
			},400);
			setTimeout(function(){
				$(".user-info-load-area .me").addClass("backface-visibility");
				$(document).find(".user-info-load-area .user").show();
				$(".user-info-load , .me-info-load").stop().animate({
					opacity:1
				},400);
			},400);
        },100);

			
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

	$(document).on("mouseup",".namecard",function(e){
		e.stopPropagation();
		$(document).data("namecard-pos",$(window).scrollTop());
		$(window).scrollTop(0);
		// $(".user-info-load-area").css("top",$(window).scrollTop());
		// $(".screen-lock").css("top",$(window).scrollTop());

		//鈴鐺頁面不動作
		if($(this).parents(".al-subbox").length) $(this).parents(".al-subbox").data("stop",true);

		userInfoShow($(this).data("gi"),$(this).data("gu"));
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
	// var smHrCliclTimes = 0;
	// $(".sm-hr").click(function(){
	// 	smHrCliclTimes++;
	// 	if(smHrCliclTimes>4){
	// 		$("div[data-sm-act='contact']").show();
	// 		smHrCliclTimes=0;
	// 	}
	// });
});  