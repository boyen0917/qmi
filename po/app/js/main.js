$(function(){  

	//load language
	updateLanguage( lang );

	var refreshChk = false;

	$(".page-group-name").click(function(){
		$(".cp-post").trigger("click");
	});


	$(".feed-subarea ").bind('mousewheel DOMMouseScroll', function(){
		//取舊資料
		var feed_type = ("0" + $("#page-group-main").data("navi")).slice(-2) || "00";
		var this_navi = $(".feed-subarea[data-feed=" + feed_type + "]");

		//判斷沒資料的元件存在時 就不動作
		if( this_navi.hasClass("no-data") ) return;	
		
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

	$(".st-feebox-area-no-content ").bind('mousewheel DOMMouseScroll', function(){
		var this_dom = $(this);
		//取舊資料
		var feed_type = $("#page-group-main").data("navi") || "00";
		var this_navi = $(".feed-subarea[data-feed=" + feed_type + "]");

		//判斷沒資料的元件存在時 就不動作
		if( this_navi.hasClass("no-data") ) return;	

		var last_show_event = this_dom.siblings(".st-feedbox-area-bottom");
		var last_event = this_navi.find(".st-sub-box").last();
		
		
		//目前filter 沒內容, 但是還有資料可以拉
		var bottom_height = $(window).scrollTop() + $(window).height();
		var last_height = this_navi.offset().top + this_navi.height() + 25;

		// cns.debug("this_navi:",{name:this_navi.selector,data:this_navi.data("scroll-chk")});
	    //scroll 高度 達到 bottom位置 並且只執行一次
		if(bottom_height && bottom_height >= last_height && !this_navi.data("scroll-chk")){
			this_dom.addClass("disabled");
			//避免重複
			this_navi.data("scroll-chk",true);
			cns.debug("last event ct:",this_navi.data("last-ct"));
			timelineListWrite(this_navi.data("last-ct"));
			timelineScrollTop();
			// $(".gm-content > div:eq(1)").getNiceScroll(0).doScrollTop(0, 500);
		}
	});

	var docked = false;
	var init = 221;
	function checkFilterPosition(tt){
		var dom = $(".gm-content");
		if( !dom.is(":visible") ) return;
		// cns.debug( tt, dom.scrollTop() );  
		var menu = $(".st-filter-area");
	    if (!docked && dom.scrollTop() >= 163) 
	    {
	        menu.addClass("fixed");
	        docked = true;
	    } 
	    else if(docked && dom.scrollTop() <= 163)
	    {
	        menu.removeClass("fixed");

	        docked = false;
	    }
	}

	var checkFilterPositionTimeout;
	$(".gm-content").bind('mousewheel DOMMouseScroll', function(){     
		clearTimeout( checkFilterPositionTimeout );
		checkFilterPosition("onscroll");
	    checkFilterPositionTimeout = setTimeout( checkFilterPosition ,10);
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
				// img.load(function() {
				// 	var w = img.width();
		  //           var h = img.height();
    // 				mathAvatarPos(img,w,h,120);
		  //       });
		        img.attr("src",reader.result);
			}
			reader.readAsDataURL(file);	
		}else{
			popupShowAdjust("",$.i18n.getString("COMMON_NOT_IMAGE"),true);
		}
	});
	
	//創建團體 建立
	$(".gm-create-submit").click(function(){
		if ( !$(".gmc-name input").val() ){
			popupShowAdjust("",$.i18n.getString("GROUP_NAME_LIMIT"),true); //"團體名稱未填寫"
	        return false;
		} 

		if ( !$(".gmc-desc textarea").val() ){
	        popupShowAdjust("",$.i18n.getString("GROUP_ABOUT_ALERT"),true);	//"團體介紹未填寫"
	        return false;
		}else{
			var file = $(".gmc-file")[0].files[0];
			var group_name = $(".gmc-name input").val();
			var group_desc = $(".gmc-desc textarea").val();

			var ori_arr = [1280,1280,0.7];
			var tmb_arr = [120,120,0.6];

			s_load_show = true;

			new QmiAjax({
				apiName: "groups",
				isPublicApi: true,
				method: "post",
				body: {
			        gn: group_name,
			        gd: group_desc
			    }
			}).complete(function(data){
	        	if(data.status == 200){
	        		var deferred = $.Deferred();

	        		var cg_result = $.parseJSON(data.responseText);
		        	var api_name = "groups/" + cg_result.gi + "/avatar";
		        	
	        		if(file === undefined) {
	        			deferred.resolve(true);
	        		} else {
						
		        		uploadToS3(file,api_name,ori_arr,tmb_arr,function(chk){
		        			//團體頭像上傳失敗
		        			deferred.resolve(chk);
		        		});
	        		}

	        		deferred.done(function(chk){
	        			if(!chk) toastShow( $.i18n.getString("GROUP_AVATAR_UPLOAD_ALERT") );

	        			//現在不從polling執行更新
		        		groupMenuListArea().done(function(){
				            s_load_show = false;

				            //combo
				            getGroupComboInit(cg_result.gi,function(){
				            	s_load_show = false;

			                	//設定目前團體
    							setThisGroup(cg_result.gi);

			                    //sidemenu user
			                    setSmUserData(gi,gu,gn);

			                    //top event
			                    topEvent();

			                    //重新設定功能選單
			                    updateTab(gi);

			                    toastShow( $.i18n.getString("FEED_GROUP_CREATED") );
			                    $.mobile.changePage("#page-group-main");
			                    timelineSwitch("feeds", true);
				            });
		        		}); // groupMenuListArea
	        		})
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

	//個人資訊選單
	//$(".sm-person-info").hide();
	$("#userInfo").click(function(e){
		$(".sm-person-area-r").find("img").toggle();
		//$(".sm-person-info").fadeToggle();
		
		QmiGlobal.systemPopup.init();
	});
	//系統選單 Tab 
	$(".system-tab").on('click','li',function(){
        var tab_id = $(this).attr('data-tab');
        //console.log("tab is "+tab_id);
        $('ul.system-tab li').removeClass('current-tab');
        $('.system-tab-content').removeClass('current-tab');
        $(this).addClass('current-tab');
        $("#"+tab_id).addClass('current-tab');
    });
	//----------------------------------- 小幫手 ---------------------------------------------

	//小幫手 創建團體
	$(".hg-create").click(goToGroupMenu);
	//小幫手 加入團體
	$(".hg-join").click(function(){
    });

	  //小幫手 團體邀請  側邊選單
	$(".hg-invite").click(function(){
		clearCreateGroupPage();
	    $("#page-group-menu").data("type","invite");
	    $(".gm-invite").trigger("click");
	    $.mobile.changePage("#page-group-menu");
	});

	//更換動態
	$(document).on("click",".sm-small-area,.sm-group-area.enable",function(){

		$(".sm-group-list-area").removeAttr("data-unlock");
		var target = $(this);

		if($(this).hasClass("sm-group-area")){
			//滾動至最上面
			timelineScrollTop();

			//取消主頁
			timelineMainClose();

			target = $(".sm-small-area[data-sm-act=feeds]");
		}else{
			// $(".polling-local .sm-count").hide();

			if( $(".st-filter-area").hasClass("st-filter-lock") ){
				// cns.debug("-------------");
				// cns.debug("-------------");
				// cns.debug("-------------");
				// cns.debug("lock .sm-small-area,.sm-group-area");
				// cns.debug("-------------");
				// cns.debug("-------------");
				// cns.debug("-------------");
				return;
			}
			//滾動至最上面
			timelineScrollTop();

			//取消主頁
			timelineMainClose();

			//check pens
			//如果該tab的筆功能都沒開的話, 直接把筆hide起來
			var act = target.data("sm-act");
			var menu = $(".feed-compose-area");
			$(".feed-compose").show();
			switch( act ){
				case "feed-post": //貼文only
					if( menu.find(".fc-area-subbox.active[data-fc-box=post]").length<=0 ){
						$(".feed-compose").hide();
					}
					break;
				case "feed-public": //團體動態, 貼文不開
					if( menu.find(".fc-area-subbox.active:not([data-fc-box=post])").length<=0 ){
						$(".feed-compose").hide();
					}
					break;
				default: //一般&其他?, 筆有的都開
					if( menu.find(".fc-area-subbox.active").length<=0 ){
						$(".feed-compose").hide();
					}
					break;
			}

			$(".sm-small-area.active").removeClass("active");
			timelineSwitch(target.data("sm-act"));
			$(this).addClass("active");
		}

		target.addClass("sm-click-bg");
		// target.find(".sm-small-area-l img").attr("src",icon_default + target.data("sm-act") + "_activity.png");
		
	});

	// 登出 暫時
	// $(".sm-person-info").on("click",".system-logout",function(){
	// 	// popupShowAdjust("",$.i18n.getString("SETTING_DO_LOGOUT"),true,true,[logout]);
	// 	new QmiGlobal.popup({
	// 		desc: $.i18n.getString("SETTING_DO_LOGOUT"),
	// 		confirm: true,
	// 		cancel: true,
	// 		action: [logout]
	// 	});
	// });
	
	//更換團體
	$(document).on("click",".sm-group-area.enable",function(){

		$(".sm-group-area").removeClass("active").removeClass("enable");
		$(this).addClass("active");

		//指定gi
		timelineChangeGroup($(this).attr("data-gi")).done(function(){
			// 移轉 
        	if(QmiGlobal.groups[$(this).attr("data-gi")].isRefreshing === true) return;

			//updatePollingCnts
        	updatePollingCnts($(this).find(".sm-count"),$(this).data("polling-cnt"));
		}.bind(this));
	});
	
	//----------------------------------- timeline ---------------------------------------------  
	$(".st-navi-subarea").click(function(){
		if( $(".st-filter-area").hasClass("st-filter-lock") ){
			// cns.debug("-------------");
			// cns.debug("-------------");
			// cns.debug("-------------");
			// cns.debug("lock st-filter-lock");
			// cns.debug("-------------");
			// cns.debug("-------------");
			// cns.debug("-------------");
			return;
		}
		// var img_dir = "images/timeline/timeline_tab_icon_";
		// var subareas = $(".st-navi-area [data-st-navi-group=navi]");
		var this_subarea = $(this);
		// subareas.find("div").removeClass("color-white");

		//將選項存入
		$("#page-group-main").data("navi",this_subarea.data("tp"));

		// var event_tp = $("#page-group-main").data("navi") || "00";

		// switch(this_subarea.data("st-navi")){
	 //    	case "home":
	 //    		 $(".st-navi-tridiv-r").show();
	 //    		 $(".st-navi-tridiv-l").hide();
	 //    		 this_subarea.find("img").attr("src",img_dir + "home_white.png");
	 //    		 this_subarea.find("div:eq(0)").addClass("color-white");
	 //          break;
	 //    	case "announcement":
	 //    		$(".st-navi-tridiv-l").show();
	 //    		$(".st-navi-tridiv-r").hide();
	 //    		this_subarea.find("img").attr("src",img_dir + "announcement_white.png");
	 //    		this_subarea.find("div:eq(0)").addClass("color-white");
	 //          break;
	 //    	case "feedback":
	 //    		$(".st-navi-tridiv-l").show();
	 //    		$(".st-navi-tridiv-r").hide();
	 //    		this_subarea.find("img").attr("src",img_dir + "feedback_white.png");
	 //    		this_subarea.find("div:eq(0)").addClass("color-white");
	 //          break;
	 //    	case "task":
	 //    		$(".st-navi-tridiv-l").show();
	 //    		$(".st-navi-tridiv-r").hide();
	 //    		this_subarea.find("img").attr("src",img_dir + "task_white.png");
	 //    		this_subarea.find("div:eq(0)").addClass("color-white");
	 //          break;
		// }

		timelineListWrite();
		timelineScrollTop();
	});

	//主要filter
	$(".st-filter-main").click(function(){
		$(this).hide();
		$(".st-filter-main-hide").show();

		$(".st-filter-other").slideToggle();
	});

	$(".st-filter-action").click(function(){
		var filter_action = $(this);
		var navi_area = $(".st-navi-subarea");
		var parent = $(this).parent();
		if( parent.hasClass("lock") ){
			return;
		}
		parent.addClass("lock");
		setTimeout( function(){
			parent.removeClass("lock");
		}, 500);

		filter_action.parent().children(".st-filter-list-active").removeClass("st-filter-list-active");
		filter_action.addClass("st-filter-list-active");
		// var filter_name = $(this).find("span").html();

		//動態變化
		// $(".st-filter-main span").fadeOut("fast");
		// $(".st-filter-other").slideUp(function(){
		// 	$(".st-filter-main").addClass("st-filter-list-active");
		// 	$(".st-filter-main img").attr("src","images/icon/icon_arrow_right.png");
		// 	$(".st-filter-main span").html(filter_name);
		// 	$(".st-filter-main span").fadeIn("fast");

		// 	$(".st-filter-main-hide").hide();
		// 	$(".st-filter-main").show();
		// });

		var filter_status = $(this).data("status");

		//過濾發文類型
		if(filter_status == "navi" || filter_status == "all"){
        	navi_area.filter("[data-st-navi="+ $(this).data("navi") +"]").trigger("click");
        	// return false;
		} else {
			//檢查目前的首頁是哪頁(動態消息/團體消息/成員消息)
			var currentHome = $(".st-navi-area").data("currentHome") || "home";
			navi_area.filter("[data-st-navi="+currentHome+"]").trigger("click");
		}

		var event_tp = $("#page-group-main").data("navi") || "00";
		var event_area = $(".feed-subarea[data-feed=" + event_tp + "]");
		var this_events = event_area.find(".st-sub-box");

		//做過濾
		//先關閉全區域
		var feedbox_area = $(".st-feedbox-area");
		feedbox_area.hide();

		//記錄
		$(".st-filter-area").data("filter",filter_status);
		event_area.data("filter-name",$(this).find("span").html());
		
		//已讀未讀
		var cnt = 0;
		this_events.each(function(i,val){
			eventFilter($(this),filter_status);
			if( $(val).hasClass("filter-show") ){
				cnt++;
			}
		});
		showFeedboxNoContent( (cnt>0) );

		//開啟全區域
		feedbox_area.fadeIn("slow");
	});

	$(".st-filter-list-btn").click(function(){
		$(".st-filter-other").slideUp(function(){
			$(".st-filter-main-hide").hide();
			$(".st-filter-main").show();
		});
	});

	$(document).on('click','.st-sub-box-3 .st-like',function(){
		var this_event = $(this).parents(".st-sub-box");
		//api結束前 不能按
		if(this_event.data("like-lock")) return false;
		this_event.data("like-lock",true);

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

		//檢查按讚了沒
		//按讚 like_chk是true
		if(!this_event.data("event-val").meta.il){
			var est = 1;
		}else{
			//收回
			var est = 0;
		}

		//發完api後做真正存入動作
		putEventStatus(target_obj,1,est,function(chk){
			if(chk){
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

		//api結束前 不能按
		if(this_event.data("like-lock")) return false;
		this_event.data("like-lock",true);

		var event_path = this_event.data("event-path");
		var parent_event = $(this).parents(".st-sub-box");
		
		//判斷是讚 還是 收回讚
		var est = 0;
		//不能用字串長度判斷, 英文版的囧給你看OTL
		if( $(this).data("like")== false ){
			est = 1;
		}
		/*
		if( $(this).html().length == 1){
			est = 1;
		}
		*/

		//更新狀態 參數
		var target_obj = {};
		target_obj.selector = this_event;
		target_obj.reply = true;
		putEventStatus(target_obj,1,est);
	});

	//回覆按讚列表
	$(document).on('click','.st-reply-footer .cnt',function(){
		var this_event = $(this).parents('.st-reply-content-area');
		timelineShowResponseLikeDelegate( this_event, 1, function(){
			cns.debug("on back from response like");
		});
	});
	
	//點選開啟圖庫
	$(document).on("click",".img-show",function(e){
		var this_img_area = $(this);

		var this_s32 = this_img_area.find(".auo").data("src");

        showGallery( null, null, [{s32:this_s32}] );
		// var gallery_str = '<li data-thumb="' + this_s32 + '"><img src="' + this_s32 + '" /></li>';

		// var img = new Image();
		// img.onload = function() {
		// 	var gallery = window.open("flexslider/index.html", "", "width=" + this.width + ", height=" + this.height);
  //   		$(gallery.document).ready(function(){
  //   			setTimeout(function(){
  //   				var this_slide = $(gallery.document).find(".slides");
  //   				this_slide.html(gallery_str);
  //   				$(gallery.document).find("input").val(1);
  //   				$(gallery.document).find("button").trigger("click");
  //   			},300);
  //   		});
		// }
		// img.src = this_s32;
		
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
					// var path = getStickerPath(id);
					var preview = stickerIcon.parent().find(".st-reply-message-img");
					preview.data("type",5);
					preview.html("<div class='img'><img/></div>");
					preview.data("id", id);
					setStickerUrl( preview.find("img"), id);
					
					var allStickerArea = $(".stickerArea .imgArea");
					$.each( allStickerArea, function(index){
						var dom = $(this);
						initStickerArea.showHistory( dom.parent() );
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
		var deferred = $.Deferred(),
			inputFile = $(this),
			file = $(this)[0].files[0],
			matchArr = ["image", "video"],

			fileType = matchArr.find(function(tp){
				return file.type.match(new RegExp(tp, "g")) instanceof Array;
			}),

			fileURL = URL.createObjectURL(file);


		switch(fileType) {
			case "image":
				deferred.resolve(fileURL);
				break;

			case "video":
				getVideoImgUrl(file).done(deferred.resolve)				
				break;

			default:
				fileType = "file";
				fileURL = "images/file_icon.png";
				deferred.resolve(fileURL);
		}

		deferred.done(function(dataUrl) {
			inputFile.parent().find(".st-reply-message-img")
			.data("file",file).data("type", fileType)
			.html("<div class='img'><img src='" + dataUrl + "'/></div>");

			//每次選擇完檔案 就reset input file
			inputFile.replaceWith( inputFile.val('').clone( true ) );
		});

		return;
		var file_ori = $(this);

		var imageType = /image.*/;
		$.each(file_ori[0].files,function(i,file){

			if (file.type.match("image")) {
				var this_grid =  file_ori.parent().find(".st-reply-message-img");
				this_grid.data("type",6);
				this_grid.html("<div class='img'><img/></div>");

				this_grid.data("file",file);

				var reader = new FileReader();
				reader.onload = function(e) {
					var img = this_grid.find("div img");

			        img.attr("src",reader.result);
			        img.css("border", "lightgray 1px solid");
				}

				reader.readAsDataURL(file);
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
	    // $(this).next().width(box_width-3);
	    $(this).next().css("width","100%");
	    
	    $(this).next().css("zoom","0.05");
	    $(this).next().show();
	    zoomOut($(this).next());
		$(this).parent().find(".st-sub-box-more-screen").fadeIn();
	});
	
	$(document).on('click','.st-more-close',function(e){
		zoom_in_cnt = 100;
		zoomIn($(this).parent());
		$(this).parent().parent().find(".st-sub-box-more-screen").fadeOut();
	});
	
	
	//編輯區塊按鈕效果
	$(document).on('click','.st-sub-box-more-box:not(.deactive)',function(e){
		e.stopPropagation();
	    var target = $(this);
	    // var more_img_url = "images/timeline/timeline_hiddenmenu_icon_";
	    target.addClass("st-sub-box-more-box-click");
	    // target.find("img").attr("src",more_img_url + target.data("st-more") + "_click.png");
	    // setTimeout(function(){
	    //     target.removeClass("st-sub-box-more-box-click");
	    //     target.find("img").attr("src",more_img_url + target.data("st-more") + ".png");
	    //     },500);
	    var this_event = target.parents(".st-sub-box");
		try{
			var type = target.data("st-more");
			switch( type ){
				case "top":
					timelineEditStatus( this_event, 8, function(data){
						cns.debug( data.responseText );
					});
					break;
				case "subscribe":
					timelineEditStatus( this_event, 3, function(data){
						cns.debug( data.responseText );
					});
					break;
				case "del":
					timelineDeleteEvent( this_event, function(data){
						cns.debug( data.responseText );
					});
					break;
				// case "copy":
				// 	//get content (title & attachment excluded)
			 //        var data = this_event.data("event-val");
			 //        if(data){
				//     	var stringify = JSON.stringify(data);
				//     	cns.debug(stringify);
				// 		copyTextToClipboard( stringify );
				// 	} else {
				//     	toastShow("error occurred, null result.");
				//     }
				// 	break;
				case "copyword":
					//get content (title & attachment excluded)
			        var data = this_event.data("event-val");
			        var text = null;
			        try{
			        	text = data.ml[0].c;
					} catch(e) {
						errorReport(e);
				    }
				    if( null!=text ){
					    cns.debug( text );
						copyTextToClipboard( text );
					} else {
				    	toastShow("error occurred.");
					}
					target.siblings(".st-more-close").trigger("click");
					break;
			}
		} catch(e){
			cns.debug(e);
		}
	});
	
	$(".feed-compose").click(function(){
		if($(".feed-compose-area").is(":visible")){
			$(".feed-compose").removeClass("active");
			$(".feed-compose-area-cover").hide();
			setTimeout(function(){
	            // $(".feed-compose").removeClass("feed-compose-click");
	            $(".feed-compose-area").slideUp();
	        },100);
		}else{
			//非管理者不能使用公告
			if(QmiGlobal.groups[gi].guAll[gu].ad == 1){
				$(".fc-area-subbox[data-fc-box=announcement]").removeClass("disabled");
			}else{
				$(".fc-area-subbox[data-fc-box=announcement]").addClass("disabled");
			}

			//check pens
			var act = $(".header-menu .sm-small-area:visible.active").data("sm-act");
			var menu = $(".feed-compose-area");
			menu.find(".fc-area-subbox").hide();
			switch( act ){
				case "feed-public": //團體動態, 貼文不開
					menu.find(".fc-area-subbox.active:not([data-fc-box=post])").show();
					break;
				case "feed-post": //貼文only
					// menu.find(".fc-area-subbox.active[data-fc-box=post]").show();
					$(".feed-compose-area").css("opacity","0");
					$(".feed-compose-area").show();
					$(".feed-compose-area-cover").show();
					$(".feed-compose").addClass("active");
						menu.find(".fc-area-subbox.active[data-fc-box=post]").click();
			    	
					return;
					break;
				default: //一般&其他?, 筆有的都開
					menu.find(".fc-area-subbox.active").show();
					break;
			}

			//var edit_pic = "image"
			// $(".feed-compose").addClass("feed-compose-click");
			$(".feed-compose-area").css("opacity","");
			$(".feed-compose-area").slideDown();
			$(".feed-compose-area-cover").show();
			setTimeout(function(){
				$(".feed-compose").addClass("active");
		    },100);
		}
	});
	
	$(".st-filter-hide").click( function(e){
		var this_dom = $(this);
		var parent = this_dom.parent();
		e.stopPropagation();
		if( this_dom.hasClass("left") ){
			parent.animate({scrollLeft: 0}, 'fast');
			this_dom.siblings(".right").show();
		} else {
			parent.animate({scrollLeft: parent.width()}, 'fast');
			this_dom.siblings(".left").show();
		}
		this_dom.hide();
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

		//加入已讀
		if(this_event.data("event-val").meta.ir == false){
			var event_val = this_event.data("event-val");
			event_val.meta.ir = true;
			this_event.data("event-val",event_val);
		}

		//此則timeline種類
		var tp = this_event.data("timeline-tp");
		
		//判斷現在是開啟還是關閉
		if(this_event.data("switch-chk")){
			this_event.data("switch-chk",false);
			this_event.find(".st-reply-message-bg").removeAttr("style");
			//顯示隱藏發佈對象detail
			this_event.find(".st-sub-box-1-footer").addClass("hideOverflow");
		}else{
			this_event.data("switch-chk",true);
			this_event.find(".st-reply-message-bg").css("border",0);
			//顯示隱藏發佈對象detail
			this_event.find(".st-sub-box-1-footer").removeClass("hideOverflow");
		}

		//動態消息 判斷detail關閉區域
		var detail_chk = timelineDetailClose(this_event,tp);
		
		//重置
		if(!detail_chk){
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

			timelineUpdateTime();
		});
	});
	
	$(document).on("click",".st-reply-like-area",function(){
		var this_event = $(this).parents(".st-sub-box");

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
	$(document).on("click",".fc-area-subbox:not(.disabled)", function(){
		//定點回報暫時不做
		// if($(this).hasClass("fc-check")) return false;

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

		//因為太多例外了 一個一個加似乎很麻煩 會有遺漏
		setTimeout(function(){
			this_compose.data("send-chk",true);			
		}, 1500);

		this_compose.data("parse-resend",false);

		//等待截取網址內容 時間太久則取消
		if(this_compose.data("parse-waiting")){

			setTimeout(function(){
				//重新送出
				this_compose.data("send-chk",true);

				cns.debug("parse-retry",this_compose.data("parse-waiting-retry"));
				var cnt = this_compose.data("parse-waiting-retry") || 0;
				if(cnt < 3) {
					cnt++;
					this_compose.data("parse-waiting-retry",cnt);
					cns.debug("yooo",cnt);

					$(".cp-post").trigger("click");
				}else{
					cns.debug("parse retry toast");
					this_compose.data("parse-waiting-retry",0);
					toastShow( $.i18n.getString("COMPOSE_PARSE_ERROR") );
				}
				
			},1000);
			return false;
		}

		//網址截取 預備判斷 **此功能取消**
		// if(this_compose.data("parse-error")) {
		// 	$('.ui-loader').css("display","block");
		// 	$(".ajax-screen-lock").show();
		// 	cns.debug("parse url again");
		// 	this_compose.data("url-chk",false);
		// 	this_compose.data("parse-resend",true);
		// 	this_compose.find('.cp-textarea-desc').trigger("input");
		// 	return false;
		// }
 			
		this_compose.data("compose-content",$('.cp-textarea-desc').val());
		this_compose.data("compose-title",$('.cp-textarea-title').val());

		var ctp = this_compose.data("compose-tp");
		var empty_chk = true;

		//錯誤訊息
		var error_msg_arr = [];
		error_msg_arr[".cp-textarea-title"] = $.i18n.getString("COMPOSE_TITLE_EMPTY");
		error_msg_arr[".cp-textarea-desc"] = $.i18n.getString("COMPOSE_DESCRIPTION_EMPTY");

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
				chk_arr.push(".cp-textarea-title");
				break;
		}

 		$.each(chk_arr,function(i,chk_str){
 			//有一個不存在就跳錯誤訊息
 			if(!$(chk_str).val()){
 				empty_chk = false;
 				popupShowAdjust("",error_msg_arr[chk_str],true);

 				this_compose.data("send-chk",true);

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

			case "video":
				$(".cp-file").data("img",false).attr("accept", "video/mp4").trigger("click");
				target.find("img").attr("src",img_url+target.data("cp-addfile")+"_visit.png");
				setTimeout(function(){
					target.find("img").attr("src",img_url+target.data("cp-addfile")+".png");
				},100);
				break;
			case "img":	//附影像
				$(".cp-file").data("img",true).attr("accept", "image/*").trigger("click");
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
							// var path = getStickerPath( id );
							var preview = $("#page-compose .cp-sticker-area");
							preview.html("<div class='sticker'><img/></div>");
							setStickerUrl( preview.find("img"), id );

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
								initStickerArea.showHistory( dom.parent() );
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

		var composePage = $("#page-compose");
		var this_compose = composePage.find(".cp-content");
		var videoList = [];
		var imgList = [];
		var file_ori = $(this);
		var imageType = /image.*/;
		var videoType = /video.mp4/;
		var isMp4AlertShown = false;
		$.each(file_ori[0].files,function(i,file){
			if( file.type.match(imageType)){
				imgList.push(file);
			} else if( file.type.match(videoType)){
				videoList.push(file);
			} else if( !isMp4AlertShown && file.type.match(/video.*/) ){
				isMp4AlertShown = true;
				toastShow( $.i18n.getString("COMMON_NOT_MP4") );
			}
		});

		if( imgList.length>0 ){

			composePage.find(".cp-attach-area").show();
			composePage.find(".cp-file-area").show();
			var imageArea = composePage.find(".cp-file-img-area");
			imageArea.html("").show();
			
			var videoArea = this_compose.find(".cp-file-video-area");
			if( videoArea.is(":visible") ){
				videoArea.addClass("topBorder");
			}

			var limit_chk = false;
			// var upload_arr = this_compose.data("upload-arr");

			$.each(imgList,function(i,file){
				if(!file || !file.type) return;
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
				toastShow( $.i18n.getString("COMMON_SEND_PHOTO_LIMIT",9) );
				// return false;
			}

			$.each(this_compose.data("upload-obj"),function(i,file){
				var this_grid =  $('<div class="cp-grid"><div><img/></div><img class="grid-cancel" src="images/common/icon/icon_compose_close.png"/></div>');
				$(".cp-file-img-area").append(this_grid);
				
				//編號 方便刪除
				this_grid.data("file-num",i);

				// if (file.type.match(imageType)) {

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
				// }else{
				// 	this_grid.find("div").html('<span>file not supported</span>');
				// }
			});
		}
		if( videoList.length>0 ){

			var composePage = $("#page-compose");
			var this_compose = composePage.find(".cp-content");

			this_compose.find(".cp-attach-area").show();
			this_compose.find(".cp-file-area").show();
			var videoArea = this_compose.find(".cp-file-video-area");
			videoArea.html("").show();
			if( this_compose.find(".cp-file-img-area").is(":visible") ){
				videoArea.addClass("topBorder");
			}

			var limit_chk = false;
			// var upload_arr = this_compose.data("upload-arr");

			$.each(videoList,function(i,file){
				if(!file||!file.type) return;
				if(Object.keys(this_compose.data("upload-video")).length == 1 ){
					limit_chk = true;
					return false;
				}
				
				//流水號
				var ai = this_compose.data("upload-ai");
				this_compose.data("upload-video")[ai] = file;
				this_compose.data("upload-ai",ai+1)
			});

			if(limit_chk){
				toastShow( $.i18n.getString("COMMON_SEND_VIDEO_LIMIT",1) );
				// return false;
			}

			$.each(this_compose.data("upload-video"),function(i,file){
				var this_grid =  $('<div class="cp-grid"><div><video data-file-num="'+i+'"/></div><img class="grid-cancel" src="images/common/icon/icon_compose_close.png"/></div>');
				
				//編號 方便刪除
				this_grid.data("file-num",i);
				videoArea.append(this_grid);

				// if( !file.type.match(videoType) ){
				// 	this_grid.find("div").html('<span>'+$.i18n.getString("COMMON_NOT_MP4")+'</span>');
				// } else
				if(file.size > 50000000){ //max 50mb
					this_grid.find("div").html('<span>'+$.i18n.getString("COMMON_EXCEED_FILE_SIZE")+'</span>');
				} else {

					//有圖片就push進 compose message list
					if($.inArray(7,this_compose.data("message-list")) < 0){
						this_compose.data("message-list").push(7);

						//附檔區域存在附檔
						this_compose.data("attach",true);
					}
					renderVideoFile(file, videoArea.find('video[data-file-num="'+i+'"]'), function (videoTag) {
						videoTag.parent().addClass("loaded");
						if( videoTag.width() > 100 ){
							videoTag.css("margin-left",-(videoTag.width()-100)*0.5);
						}
					}, function (videoTag) {
						videoTag.parent().addClass("error");
					});
				}
			});
		}

		//每次選擇完檔案 就reset input file
		file_ori.replaceWith( file_ori.val('').clone( true ) );
	});

	$(document).on("dragover",".timeline-dnd,.compose-dnd,.user-info-load-area .me",function(e){
		e.preventDefault();
        e.stopPropagation();
	});
	$(document).on("drop",".timeline-dnd,.compose-dnd,.user-info-load-area .me",function(e){
		e.preventDefault();
        e.stopPropagation();
        $(this).hide();
        
        var target_input = $(this).parents(".st-sub-box").find(".st-reply-message-file");
        if($(this).hasClass("compose-dnd")) target_input = $(".cp-file");
        if($(this).hasClass("me")) {
        	target_input = $(this).find(".user-avatar-bar.me input");
        	$(this).show();
        }

        if(e.originalEvent.dataTransfer){
            if(e.originalEvent.dataTransfer.files.length) {
                /*UPLOAD FILES HERE*/
				target_input[0].files = e.originalEvent.dataTransfer.files;
            }
        }
	});

	$(document).on("dragover",".st-sub-box,#page-compose",function(e){
		var this_target = $(this);
		if(this_target.hasClass("st-sub-box") && !this_target.find(".timeline-dnd").is(":visible")){
			this_target.find(".timeline-dnd").show().css("height",this_target.height());
		}else{
			$(".compose-dnd").show();	
		}
	});

	$(document).on("dragleave",".timeline-dnd,.compose-dnd",function(){
		$(this).hide();
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

			var area = this_grid.parent();
			if( area.hasClass("cp-file-img-area") ){
				//刪除upload arr
				delete this_compose.data("upload-obj")[file_num];

				this_cancel.attr("src","images/common/icon/icon_compose_close.png");
				this_cancel.remove();
				this_grid.hide('fast', function(){ 
					this_grid.remove(); 

					//圖檔區沒東西了 就剔除message list
					if(area.html() == ""){
						area.hide();
						area.siblings(".cp-file-video-area").removeClass("topBorder");
						this_compose.data("message-list").splice($.inArray(6,this_compose.data("message-list")),1);

						composeCheckMessageList();
					}
				});
			} else {
				//刪除upload arr
				delete this_compose.data("upload-video")[file_num];

				this_cancel.attr("src","images/common/icon/icon_compose_close.png");
				this_cancel.remove();
				this_grid.hide('fast', function(){ 
					this_grid.remove(); 

					//圖檔區沒東西了 就剔除message list
					if( area.html() == ""){
						area.hide().removeClass("topBorder");
						this_compose.data("message-list").splice($.inArray(7,this_compose.data("message-list")),1);

						composeCheckMessageList();
					}
				});
			}
		},100);


	});
	
	//compose 回上一頁確認
	$("#page-compose").on("click",".page-back-comfirm",function(e){
		var this_dom = $(this);

		//show comfirm
		popupShowAdjust("",
			$.i18n.getString("COMPOSE_DISCARD"),
			$.i18n.getString("COMMON_OK"),
			$.i18n.getString("COMMON_CANCEL"),
			[function(){
				this_dom.siblings(".page-back").trigger("click");
			},$(this)]
		);
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
		//調整
		$("#page-group-main .gm-content").removeAttr("style");
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
	$(document).on("click",".user-info-load-area",function(e){
		var target = event.target || event.srcElement;
		cns.debug(target);
		target = $(target);
		if( target.hasClass("user-info-load-area") ){
			$(this).hide();
			$(".screen-lock").hide();
		}
		else if( target.hasClass("user") || target.hasClass("rotate.adjust") ){
			var tmp = target.parent();
			if( tmp.length>0 && tmp[0]==this ){
				$(".user-info-close").trigger("mouseup");
			}
		}
	});

	$(document).on("mouseup",".user-info-back",function(e){
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

		e.stopPropagation();
		e.preventDefault();
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
		var thisDom = $(this);

		// 尚未與許更換團體
		if( thisDom.hasClass("sm-group-area") && !thisDom.hasClass("enable") ) return;
		// 聊天室不做清cnt動作
		if( thisDom.data("polling-cnt") === "A3" ) return;
		
		thisDom.find(".sm-count").hide();
		updatePollingCnts(thisDom.find(".sm-count"),thisDom.data("polling-cnt"));
	});	
	
	//如果更換動態卡住...點任何團體共兩次即可解鎖OTL
	$(document).on("click",".sm-group-area:not(.enable)",function(e){
		e.preventDefault();
        e.stopPropagation();
		try{
			var tmp = $(".sm-group-list-area").attr("data-unlock")||0;
			if( tmp>0 ){
				$(".sm-group-list-area").removeAttr("data-unlock");
				groupSwitchEnable();
			} else {
				$(".sm-group-list-area").attr("data-unlock",++tmp);
			}
		} catch(e){
			errorReport(e);
		}
	});

	//polling update cnts
	$(document).on("click",".polling-cnt-cl",function(e){
		$(this).find(".sm-cl-count").hide();
		updatePollingCnts( $(this).find(".sm-cl-count"),$(this).data("polling-cnt"));
	});	

	$(document).on("mouseup",".namecard",function(e){
		e.stopPropagation();
		//temp
		if($(document).data("official") == true) return false;

		$(document).data("namecard-pos",$(window).scrollTop());
		$(window).scrollTop(0);
		// $(".user-info-load-area").css("top",$(window).scrollTop());
		// $(".screen-lock").css("top",$(window).scrollTop());

		//調整
		$("#page-group-main .gm-content").css("overflow","initial");

		//鈴鐺頁面不動作
		if($(this).parents(".al-subbox").length) $(this).parents(".al-subbox").data("stop",true);
		userInfoShow($(this).data("gi"),$(this).data("gu"));
	});

	$(document).on("mouseup",".ab_namecard",function(e){
		e.stopPropagation();
		$(document).data("namecard-pos",$(window).scrollTop());
		$(window).scrollTop(0);
		// $(".user-info-load-area").css("top",$(window).scrollTop());
		// $(".screen-lock").css("top",$(window).scrollTop());

		//調整
		$("#page-group-main .gm-content").css("overflow","initial");

		//鈴鐺頁面不動作
		if($(this).parents(".al-subbox").length) $(this).parents(".al-subbox").data("stop",true);
		AddressBook.userInfoShow($(this).data("gi"),$(this).data("gu"));
	});

	// $(document).on("mouseup",".user-avatar-bar-favorite .fav",function(e){
	// 	clickUserInfoFavorite( $(this) );
	// });

	$(".st-feedbox-area,#page-timeline-detail").on("mouseenter",".attach-download",function(){
		var this_media = $(this);
		var download_img = $('<a href="'+ this_media.find(".download").attr("src") +'" download><img style="position:absolute;top:5px;right:5px;width:50px;opacity:0.9;" src="images/dl.png"/></a>');
		this_media.append(download_img);
		this_media.unbind("mouseleave").mouseleave(function(){download_img.remove()});
	});



	//-----------------------------------  system setting  ----------------------------------- 
	
	// 圖片變更

	// $('.setting-user-avatar').click(function(){
	// 	$('.setting-avatar-file').trigger("click");
	// });

	// //大頭照預覽取消
	//  $('.cancel-btn').click(function(){
 //        $(".user-avatar-confirm").fadeOut();
 //    });

	// //儲存
	 // $('.avatar-save').click(function(){
  //       var reader = new FileReader();

  //       var file_ori = $('.setting-avatar-file'); //圖片來源input file

  //       var image_file = file_ori[0].files[0];//當下選擇的檔案

  //       reader.onload = function(e) {
  //               var img = $(".setting-user-avatar");
  //               img.attr("src",reader.result);
  //       }

  //       reader.readAsDataURL(image_file);
  //       $(".user-avatar-confirm").fadeOut();
  //   });


	// //選擇圖片
	// $('.setting-avatar-file').change(function(){
 //        var file_ori = $(this);
 //        var imageType = /image.*/;

 //        //每次選擇完檔案 就reset input file
 //        // file_ori.replaceWith( file_ori.val('').clone( true ) );
 //        var file = file_ori[0].files[0];

 //        if (file) {
 //            //是否存在圖片
 //            $(".avatar-preview").data("chk",true);

 //            var reader = new FileReader();
 //            reader.onload = function(e) {
 //                var img = $(".user-headshot");

 //                //調整長寬
 //                // img.load(function() {
 //                //  var w = img.width();
 //          //           var h = img.height();
 //    //              mathAvatarPos(img,w,h,120);
 //          //       });
 //                img.attr("src",reader.result);
 //            }
 //            reader.readAsDataURL(file);
 //            $('.user-avatar-confirm').fadeIn();

 //        }else{
 //        	// 沒有圖片的時候
 //            $(".avatar-preview").data("chk",false);
 //        }

 //    });


	// //password設定出現
	// $('.password-popup').click(function(){
	// 	$('.password-change-confirm').fadeIn();
	// });
	// //popup頁面消失

	// $('.password-cancel').click(function(){
	// 	$('.password-change-confirm').fadeOut();
	// 	$('.input-password').val("");
	// });

	//自動換頁
	

	// $('.carousel-time').change(function(){
	// 	 var carousel_time = $(this).val();
	// 	 $.lStorage('_topTimeMs',carousel_time);
		
	// }); 
	
	$(document).on('click','.term-service',function(){
		var policy_url = "https://eimweb.mitake.com.tw/user_agreement.html";
		$('.policy').fadeIn();
		$('.policy-content').find("iframe").attr("src",policy_url);

	});

	$('.right-privacy').click(function(){
		var policy_url = "https://eimweb.mitake.com.tw/privacy_policy.html";
		$('.policy').fadeIn();
		$('.policy-content').find("iframe").attr("src",policy_url);

	});

	$('.policy-content').click(function(){
		$('.policy').fadeOut();
	});

	
	/*
	               ██████╗  ███████╗ ███████╗ ██╗  ██████╗ ██╗  █████╗  ██╗               
	              ██╔═══██╗ ██╔════╝ ██╔════╝ ██║ ██╔════╝ ██║ ██╔══██╗ ██║               
	    █████╗    ██║   ██║ █████╗   █████╗   ██║ ██║      ██║ ███████║ ██║         █████╗
	    ╚════╝    ██║   ██║ ██╔══╝   ██╔══╝   ██║ ██║      ██║ ██╔══██║ ██║         ╚════╝
	              ╚██████╔╝ ██║      ██║      ██║ ╚██████╗ ██║ ██║  ██║ ███████╗          
	               ╚═════╝  ╚═╝      ╚═╝      ╚═╝  ╚═════╝ ╚═╝ ╚═╝  ╚═╝ ╚══════╝          

	*/
	$(document).on("click",".admin .st-official-tab",function(e){
		var type = $(this).data("type");
		switch(type){
			case "about":
				showGroupInfoPage();
				break;
			case "chat":
				// $(".sm-small-area[data-sm-act=chat]").trigger("click");
				break;
			case "setting":
				$(".sm-small-area[data-sm-act=groupSetting]").trigger("click");
				break;
			case "invite":
				$(".contact-add").trigger("click");
				break;
			case "share":
				// cns.debug("share");
				break;
			case "cnt":
				// $(".sm-small-area[data-sm-act=memberslist]").trigger("click");
				break;
		}
	});
	$(document).on("click",".general .st-official-tab",function(e){
		var type = $(this).data("type");
		switch(type){
			case "about":
				showGroupInfoPage();
				break;
			case "chat":
				$(".sm-small-area[data-sm-act=chat]").trigger("click");
				break;
			case "cnt":
				cns.debug("cnt");
				break;
			case "setting":
				$(".sm-small-area[data-sm-act=groupSetting]").trigger("click");
				break;
		}
	});

	$(document).on("click",".st-attach-video.play div",function(e){
		var tmp = $(this).prev('video');
		if( tmp.length>0 ){
			tmp[0].play();
			tmp.attr('controls',true);
		}
		$(this).parent().removeClass("play");
	});

	document.addEventListener('ended', function(e){
	    if($(e.target).is('video')){
	    	var tmp = $(e.target);
			tmp.attr('controls',false);
	        tmp.parent().addClass("play");
	    }
	}, true);

/*
         ███████╗ ██████╗██████╗  ██████╗ ██╗     ██╗     ██████╗  █████╗ ██████╗           
         ██╔════╝██╔════╝██╔══██╗██╔═══██╗██║     ██║     ██╔══██╗██╔══██╗██╔══██╗          
 █████╗  ███████╗██║     ██████╔╝██║   ██║██║     ██║     ██████╔╝███████║██████╔╝    █████╗
 ╚════╝  ╚════██║██║     ██╔══██╗██║   ██║██║     ██║     ██╔══██╗██╔══██║██╔══██╗    ╚════╝
         ███████║╚██████╗██║  ██║╚██████╔╝███████╗███████╗██████╔╝██║  ██║██║  ██║          
         ╚══════╝ ╚═════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚══════╝╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝          

*/

	var lightgraySetting = {
		// styler:"fb",
		cursorcolor:"rgba(210, 210, 210, 0.8)", 
		cursorwidth: '10',
		cursorborderradius: '10px',
		background: 'rgba(255,255,255,0)',
		cursorborder:"",
		boxzoom:false,
		zindex: 999,
		scrollspeed: 90,
		mousescrollstep: 40
		// horizrailenabled: false,
		// ,autohidemode: "leave"
	};
	// $(".gm-content > div:eq(1)").niceScroll( lightgraySetting );
	// $(".contact-rows, .contact-searchResult").niceScroll( lightgraySetting );
	var darkgraySetting = {
		// styler:"fb",
		cursorcolor:"rgba(107, 107, 107,0.8)", 
		cursorwidth: '10',
		cursorborderradius: '10px',
		background: 'rgba(255,255,255,0)',
		cursorborder:"",
		boxzoom:false,
		zindex: 999,
		scrollspeed: 90,
		mousescrollstep: 40
		// horizrailenabled: false,
		// ,autohidemode: "leave"
	};
	// $(".sm-group-list-area").niceScroll( darkgraySetting );

	//timeline 滾到底部取舊資料
	fetchHistoryTimeline = function(){
		cns.debug("fetchHistoryTimeline");

		var currentPage = $(".subpage-timeline");
		if( false == currentPage.is(":visible") ){
			return;
		}
		cns.debug("fetchHistoryTimeline in timeline");

		//取舊資料
		var feed_type = $("#page-group-main").data("navi") || "00";

		//判斷沒資料的元件存在時 就不動作
		if($(".feed-subarea[data-feed=" + feed_type + "]").hasClass("no-data")) return;	
		
		var this_navi = $(".feed-subarea[data-feed=" + feed_type + "]");
		var last_show_event = this_navi.find(".filter-show").last();
		var last_event = this_navi.find(".st-sub-box").last();
		
		if(last_show_event.length){
			if( !this_navi.data("scroll-chk") ){
		    	
		    	//避免重複
		    	this_navi.data("scroll-chk",true);
		    	cns.debug("last event ct:",this_navi.data("last-ct"));
		    	timelineListWrite(this_navi.data("last-ct"));
		    }
		}
	}
	// var niceScrollTmp = $(".gm-content > div:eq(1)").getNiceScroll()[0];
	// niceScrollTmp.onDragToBottom = fetchHistoryTimeline;


	//init sticker
	// initStickerArea.load();
	//on downloading sticker in main window
	$("#send-sync-sticker-signal").off("click").click(function(){
		var sid = $(this).attr("data-sid");
		cns.debug("sending sync sticker signal");
		if( windowList ){
			$.each( windowList, function(ciTmp, windowTmp){
				$(windowTmp.document).find("#recv-sync-sticker-signal").attr("data-sid",sid).click();
			});
		}

	});
	//on downloading sticker in one chat room
	$("#recv-sync-sticker-signal").off("click").click(function(){
		cns.debug("update sticker");
		initStickerArea.syncSticker( $(this).attr("data-sid") );
		$(this).removeAttr("data-sid");
		var senderCi = $(this).attr("data-ci");
		if( senderCi && windowList ){
			$.each( windowList, function(ciTmp, windowTmp){
				if( senderCi == ciTmp) return;
				$(windowTmp.document).find("#recv-sync-sticker-signal").click();
			});
		}
	});

	//update polling cnt when chatroom focus
	$("#recv-chatroom-focus").off("click").click(function(){
		cns.debug("on chatroom focus");
		updatePollingCnts( $(this),"B7" );
	});

	//update chat list
	$("#recv-sync-chat-list").off("click").click(function(){
		var giTmp = $(this).attr("data-gi");
		cns.debug("update chat list ", giTmp);
		if( giTmp && giTmp == gi ){
			if( $(".subpage-chatList").is(":visible") ){
				$('.header-menu .sm-small-area[data-sm-act="chat"]').trigger("click");
			}
		}
	});
	/*
              ████████╗███████╗███████╗████████╗          
              ╚══██╔══╝██╔════╝██╔════╝╚══██╔══╝          
    █████╗       ██║   █████╗  ███████╗   ██║       █████╗
    ╚════╝       ██║   ██╔══╝  ╚════██║   ██║       ╚════╝
                 ██║   ███████╗███████║   ██║             
                 ╚═╝   ╚══════╝╚══════╝   ╚═╝                                               
	*/
	
	$("#page-group-menu .gmi-coachmake").click(function(){
		var cnt = 0;
		return function() {
			cnt++;
			if(cnt > 5) window.periodicallyReloadFlag = true;
		}
	}());



});  