$(function(){  

	//load language
	updateLanguage( lang );

	var refreshChk = false;

	$(".page-group-name").click(function(){
		$(".cp-post").trigger("click");
	});


	$(".feed-subarea ").bind('mousewheel DOMMouseScroll', function(){
		//取舊資料
		var feed_type = $("#page-group-main").data("navi");
		// 全部、公告、投票編號都是長度為2，但個人主頁卻是4
		if (feed_type != "main") {
			feed_type = ("0" + feed_type).slice(-2) || "00";
		}
		// var feed_type = ("0" + $("#page-group-main").data("navi")).slice(-2) || "00";
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
				console.log("CCCCC@@222");
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
	        	} else {
	        		s_load_show = false;
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
		
		QmiGlobal.module.systemPopup.init();
		
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
	$(document).on("click",".sm-small-area", function() {
		clickTimelineTab({
			tabDom: $(this),
			action: $(this).data("sm-act")
		});
	});
	// $(document).on("click",".sm-small-area",function(){

	// 	$(".sm-group-list-area").removeAttr("data-unlock");
	// 	var target = $(this);

	// 	if($(".st-filter-area").hasClass("st-filter-lock")) return;
	// 	//滾動至最上面
	// 	timelineScrollTop();

	// 	//取消主頁
	// 	timelineMainClose();

	// 	//check pens
	// 	//如果該tab的筆功能都沒開的話, 直接把筆hide起來
	// 	var act = target.data("sm-act");
	// 	var menu = $(".feed-compose-area");
	// 	var composeDom = $(".feed-compose");
	// 	composeDom.show();
	// 	switch( act ){
	// 		case "feed-post": //貼文only
	// 			if( menu.find(".fc-area-subbox.active[data-fc-box=post]").length<=0 )
	// 				composeDom.hide();
	// 			break;
	// 		case "feed-public": //團體動態, 貼文不開
	// 			if( menu.find(".fc-area-subbox.active:not([data-fc-box=post])").length<=0 )
	// 				composeDom.hide();
	// 			break;
	// 		default: //一般&其他?, 筆有的都開
	// 			if( menu.find(".fc-area-subbox.active").length<=0 )
	// 				composeDom.hide();
	// 			break;
	// 	}

	// 	$(".sm-small-area.active").removeClass("active");
	// 	timelineSwitch(target.data("sm-act"));
	// 	$(this).addClass("active");

	// 	target.addClass("sm-click-bg");
	// });
	
	//更換團體 sm-group-area有兩個地方有綁定事件
	$(document).on("click",".sm-group-area.enable",function(){
		var self = this;
		$(".sm-group-area").removeClass("active").removeClass("enable");
		//取消主頁
		timelineMainClose();
		
		//指定gi
		timelineChangeGroup($(this).attr("data-gi")).done(function(){

			//滾動至最上面
			timelineScrollTop();

			// 保險起見再active一次
			$(self).addClass("active");
			// 移轉 
			var groupObj = QmiGlobal.groups[$(this).attr("data-gi")];
        	if(groupObj.isRefreshing || groupObj.isReAuthUILock) return;

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

		new QmiGlobal.gallery({
            photoList: [{s32:this_s32}],
            currentImage : 0,
            // isApplyWatermark : isApplyWatermark,
            // watermarkText : watermarkText
        })
        // showGallery( null, null, [{s32:this_s32}] );
        // showGallery( null, [{s32:this_s32}], 0);
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
		tmp.removeData("type");
		tmp.removeData("id");
		tmp.removeData("file");
	});

	$(document).on('click','.st-reply-message-img .file-cancel',function(){
		var tmp = $(this).parent().parent();
		tmp.html("");
		cns.debug( tmp.data("type") );
		tmp.removeData("type");
		tmp.removeData("id");
		tmp.removeData("file");
		cns.debug( tmp.data("type") );
	});

	//圖片
	$(document).on('click','.st-reply-message-attach',function(){
		var stickerIcon = $(this).siblings(".st-reply-message-sticker");
		var stickerArea = stickerIcon.parents(".st-sub-box").find(".stickerArea");
		if( "t"==stickerIcon.attr("data-open") ){
			stickerIcon.attr("data-open", "");
			stickerArea.hide();
			stickerIcon.attr("src", "images/chatroom/chat_textbar_icon_emoticon.png");
		} 
		$(this).siblings(".st-reply-message-file").trigger("click");
	});

	//圖片檔案處理
	$(document).on('change','.st-reply-message-file',function(e){
		var file = $(this)[0].files[0];
		if(file.size > 200 * 1024 * 1024){ //max 200mb
			toastShow($.i18n.getString("COMMON_EXCEED_FILE_SIZE"));
			return;
		}

		var deferred = $.Deferred(),
			inputFile = $(this),
			matchArr = ["image", "video"],
			vdoDefaultFlag = false,

			fileType = matchArr.find(function(tp){
				return file.type.match(new RegExp(tp, "g")) instanceof Array;
			}),
			fileURL = URL.createObjectURL(file);
		
		console.log(file.name);

		switch(fileType) {
			case "image":
				deferred.resolve(fileURL);
				break;

			case "video":
				getVideoImgUrl(file).done(function(vdoUrl) {
					// 判斷有無圖片
					var img = document.createElement("img");
					img.src = vdoUrl;
					img.onerror = function() { 
						vdoDefaultFlag = true;
						deferred.resolve("images/vdo_default.png");
					}
					img.onload = function() { deferred.resolve(vdoUrl) }

				})				
				break;

			default:
				fileType = "file";
				fileURL = "images/file_icon.png";
				deferred.resolve(fileURL);
		}

		deferred.done(function(dataUrl) {
			var previewInput = "<div class='img'><img "+ (vdoDefaultFlag ? "class='vdo-default'" : "")  +" src='" + dataUrl + "'/></div>";

			if (fileType == "file") {
				var fileName = file.name.split(".")[0];
				var fileIcon = getMatchIcon(file.name);
                var format = file.name.split(".")[1];
                if (fileName.length > 15) {
                    fileName = fileName.substring(0, 15) + "....";
                }
				previewInput = "<div class='attach-file'><img class='file-icon'" 
					+ "src='images/fileSharing/" + fileIcon+ "' >" + (fileName + " - " + format) 
					+ "<span>" + file.size.toFileSize() + "</span>"
					+ "<img class='file-cancel' src='images/common/icon/icon_compose_close.png'></div>";
			}

			inputFile.parent().find(".st-reply-message-img")
			.data("file",file).data("type", fileType)
			.html(previewInput);

			//每次選擇完檔案 就reset input file
			inputFile.replaceWith( inputFile.val('').clone( true ) );
		});

		
	});
	


	//留言ui調整
	$(document).on("input mouseup",".st-reply-highlight-container",function(e){
		var thisTextArea = $(this);

		if(thisTextArea.height() > 40 && thisTextArea.parent().hasClass("adjust")) {
			thisTextArea.parent().removeClass("adjust");
			thisTextArea.addClass("textarea-animated");
			return false;
		}

		if(!thisTextArea.html()){
			thisTextArea.parent().addClass("adjust");
			thisTextArea.removeClass("textarea-animated");
			return false;
		}

		setTimeout(function(){
			if (thisTextArea.height() < 40 && !thisTextArea.parent().hasClass("adjust")) {
				thisTextArea.parent().addClass("adjust");
				thisTextArea.removeClass("textarea-animated");
			}
		},201);
	});

	$(document).on('keydown', ".st-reply-highlight-container", function(e){

        var thisTextArea = $(this);
        var selectionObj = window.getSelection();
        var cursorPosition = getCaretPosition();
        var currentNode = window.getSelection().anchorNode;
        var parentNode = currentNode.parentNode;
        var selectedText = selectionObj.toString();

        
    	if (e.keyCode == 8 || e.keyCode == 46) {
    		if (selectedText) {
    	// 		var range = selectionObj.getRangeAt(0);
    	// 		var selectedMarkNodes = getSelectedMarkNodes(range);
    	// 		$.each(selectedMarkNodes, function(i, node) {
    	// 			var markMemberID = $(node).attr("id");
     //            	var memberName = $(node).attr("name");

    	// 			thisTextArea.data("memberList")[markMemberID] = {
					// 	nk: memberName,
					// 	aut: thisTextArea.data("markMembers")[markMemberID].mugshot,
					// };
					// delete thisTextArea.data("markMembers")[markMemberID];
    	// 		});
    		} else {
    			// 在mark元素內，如果偵測退後鍵和delete鍵，將整個元件刪除
    			if (parentNode.nodeName == "MARK") {
	            	var markMemberID = $(parentNode).attr("id");
	                var memberName = $(parentNode).attr("name");
	            	if (cursorPosition > 0 && parentNode.innerHTML == memberName) {
	            		thisTextArea.get(0).removeChild(parentNode);

		                thisTextArea.data("memberList")[markMemberID] = {
							nk: memberName,
							aut: thisTextArea.data("markMembers")[markMemberID].mugshot,
						};
		                delete thisTextArea.data("markMembers")[markMemberID];
	            	} 
	            }
    		}
        } else if (e.keyCode == 13) {
        	if (parentNode.nodeName == "MARK" && selectionObj.focusOffset == 0) {
        		currentNode.parentElement.insertAdjacentHTML( 'beforeBegin', '\n' );
        		return false;
        	}
        }
    });

    $(document).on('keyup mouseup', ".st-reply-highlight-container", function(e){
    	var thisTextArea = $(this);
        var element = thisTextArea.get(0);
        var pureText = thisTextArea.text();
        var htmlText = thisTextArea.html();
        var replyDom = thisTextArea.parent();
        var cursorPosition = getCaretPosition();
        var preTextOfCursor = htmlText.substring(0, cursorPosition);
        var selectionObj = window.getSelection();
        var currentNode = selectionObj.anchorNode;
        var lastMarkPosition, tagElements = "";

        delUncompleteMark(thisTextArea, cursorPosition);

        if ( !thisTextArea.data("memberList")
          && !thisTextArea.data("markMembers")) {
            thisTextArea.data("memberList", $.extend({}, QmiGlobal.groups[gi].guAll));
            thisTextArea.data("markMembers", {});
        }

        if (! htmlText) {
        	thisTextArea.data("memberList", $.extend({}, QmiGlobal.groups[gi].guAll));
            thisTextArea.data("markMembers", {});
        }

    //     if (currentNode.parentNode.nodeName == "MARK") {
    //         var parentNode = currentNode.parentNode
    //         var tagName = $(parentNode).attr("name");
    //         var tagId = $(parentNode).attr("id");
    //         var range = document.createRange();

    //         // 假如mark內容的文字被改變，就unwrap變成純text
    //         if (currentNode.textContent.replace(/\n/g, "") != tagName ) {
    //         	$(currentNode).unwrap();

    //             thisTextArea.data("memberList")[tagId] = {
				// 	nk: tagName,
				// 	aut: thisTextArea.data("markMembers")[tagId].mugshot,
				// };

    //             delete thisTextArea.data("markMembers")[tagId];
                
    //             //上一個sibling元素里內容是換行字，游標設定在自己元素裡的第1個字
    //             if (currentNode.previousSibling.textContent == "\n") {
    //                 range.setStart(currentNode, 0);
    //             } else {
    //             	// 游標設定在當初focus的位置
    //             	range.setStart(currentNode, cursorPosition);
    //             }
    //             range.collapse(true);
    //             selectionObj.removeAllRanges();
    //             selectionObj.addRange(range);
    //         } 
    //     }

        replyDom.find(".tag-list").remove();
        replyDom.find(".tag-members-container").hide();

        // 判斷caret前面的字串是否包含@ 
        if (preTextOfCursor.lastIndexOf("@") >= 0) {

            // 紀錄 @ 在字串的位置
           	lastMarkPosition = preTextOfCursor.lastIndexOf("@");
            // 取得 @ 到游標 之間的字串 
            var markText = preTextOfCursor.substring(lastMarkPosition + 1, cursorPosition);

            // cursor 滑鼠標誌的位置在最尾端， 或者cursor後面字串為空白
            if ((cursorPosition == htmlText.length) || (htmlText[cursorPosition].match(/\s/g)) ||
                (htmlText.substring(cursorPosition, cursorPosition + 4)) == "<br>") {
                var memberslist = thisTextArea.data("memberList");

                for (var memberID in memberslist) {
                    var memberMugshot = memberslist[memberID].aut || "images/common/others/empty_img_personal.png";
                    var memberName = memberslist[memberID].nk ;
                    var re = new RegExp(markText, "gi");
                    if (memberName && markText && memberName.search(re) >= 0) {
                        tagElements += "<li id='" + memberID + "'><a><img src='" + memberMugshot + 
                            "' class='member-mugshot'/>" + memberName + "</a></li>";
                    }
                }
            }

            // 打開選取成員的選單
            if (tagElements.length) {
                replyDom.find(".tag-members-container").prepend($("<ul/>", {
                    "class": "tag-list",
                    html: tagElements
                })).show();

                // 點選其中之一成員的動作
                $(".tag-list").find("li").bind("click", function(e) {

                    if ($(e.target).is("li")) {
                        var memberID = e.target.id;
                    } else {
                        var memberID = ($(e.target).parent().attr("id"));
                    }
                    
                    var memberName = (thisTextArea.data("memberList")[memberID]).nk;
                    var mugshot = (thisTextArea.data("memberList")[memberID]).aut || 
                        "images/common/others/empty_img_personal.png";

                    //替換at加後面的字串為此成員的名字
                    var replaceText = preTextOfCursor.substring(0, lastMarkPosition) 
                        + preTextOfCursor.substring(lastMarkPosition, cursorPosition).replace("@" 
                            + markText, " <mark id='" + memberID + "' name='" + memberName + "'>" 
                            + memberName + "</mark> ")
                        + htmlText.substring(cursorPosition, htmlText.length);

                    thisTextArea.html(replaceText);
                    thisTextArea.data("markMembers")[memberID] = {
                        id : memberID,
                        name : memberName,
                        mugshot: mugshot,
                    };

                    // 刪除成員列表選單的成員
                    delete thisTextArea.data("memberList")[memberID];
                    replyDom.find(".tag-members-container").hide();

                    // 設定選取完後游標位置
                    var range = document.createRange();
                    var node = thisTextArea.find("mark[name='" + memberName + "']");
                    range.setStart(node[0].nextSibling, 1);
                    selectionObj.removeAllRanges();
                    selectionObj.addRange(range);
                });
            }
        }
    });

	$(document).on('focusout', ".st-reply-highlight-container", function(e){
		var replyDom = $(this).parent();
		if (replyDom.find(".tag-members-container:hover").length == 0) {
			replyDom.find(".tag-members-container").hide();
		}
	})

	// 偵測貼上事件 避免html 換成text文本
	$(document).on("paste",".st-reply-highlight-container",function(e){
		e.preventDefault();
		document.execCommand('insertHTML', false, e.originalEvent.clipboardData.getData('text')._escape());
	})

	//留言送出
	$(document).on('click','.st-reply-message-send',function(){
		console.log("reply_send");
		console.log($(this).data("reply-chk"));
		var this_event = $(this).parents(".st-sub-box");
		var text = this_event.find(".st-reply-highlight-container").text();
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
					// var data = this_event.data("event-val");
			        var text = null;
			        try{
						// text = data.ml[0].c;
			        	text = this_event.find(".st-sub-box-2-content")[0].innerText || this_event.find(".st-box2-more-title")[0].innerText + "\n"+ this_event.find(".st-box2-more-desc")[0].innerText;
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
	$(document).on("mousedown",".st-sub-box-1, .st-sub-box-2, .st-sub-box-3",function(e){
		var this_event = $(this);
		if (this_event.data("trigger") === undefined){
			this_event.data("trigger",true);
		}
		// this_event.data("trigger",true);
		// setTimeout(function(){
		// 	this_event.data("trigger",false);
		// },100);
	});

	$(document).on("mouseup",".st-sub-box-1, .st-sub-box-2",function(e){
		if($(this).data("trigger")) $(this).trigger("detailShow");
	});

	$(document).on("mouseup", ".st-response", function(e){
		
		if($(this).parent().data("trigger")) $(this).parent().trigger("detailShow");
	});

	//detail view
	$(document).on("detailShow",".st-sub-box-1, .st-sub-box-2, .st-sub-box-3", function(e){
		var triggerDetailBox = $(this);
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
		var detail_chk = timelineDetailClose(this_event,tp, triggerDetailBox);


		//重置
		if(!detail_chk){
			this_event.find(".st-vote-all-ques-area").html("");
			return false;
		}

		triggerDetailBox.data("trigger", false);
		
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
			detailTimelineContentMake(this_event, e_data, null, triggerDetailBox);

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
 			
		this_compose.data("compose-content",$('.cp-content-highlight').html().replace(/&lt;/g,'<').replace(/&gt;/g,'>'));
		this_compose.data("compose-title",$('.cp-textarea-title').val());

		var ctp = this_compose.data("compose-tp");
		var empty_chk = true;

		//錯誤訊息
		var error_msg_arr = [];
		error_msg_arr[".cp-textarea-title"] = $.i18n.getString("COMPOSE_TITLE_EMPTY");
		error_msg_arr[".cp-content-highlight"] = $.i18n.getString("COMPOSE_DESCRIPTION_EMPTY");

		var chkArr = [".cp-content-highlight"];

		//判斷欄位是否填寫
		switch(ctp){
			case 0://普通貼文
				break;
			case 1://公告
				chkArr.push(".cp-textarea-title");
				break;
			case 2://通報
				break;
			case 3://任務 工作
				chkArr.push(".cp-textarea-title");
				break;
			case 4://任務 投票
				chkArr.push(".cp-textarea-title");
				break;
			case 5://任務 定點回報
				chkArr.push(".cp-textarea-title");
				break;
		}

 		$.each(chkArr,function(i,chkStr){
 			var checkFieldText = $(chkStr).val() || $(chkStr).text();
 			//有一個不存在就跳錯誤訊息
 			if(!checkFieldText){
 				empty_chk = false;
 				popupShowAdjust("",error_msg_arr[chkStr],true);

 				this_compose.data("send-chk",true);

 				return false;
 			}
 		});
		if(empty_chk) composeSend(this_compose);   
	});

	// 偵測貼上事件 避免html 換成text文本
	$("#page-compose").on("paste", ".cp-content-highlight", function(e){
		e.preventDefault();
		document.execCommand('insertHTML', false, e.originalEvent.clipboardData.getData('text')._escape());
	})

	// 8-2-16 阻止拖拉橫移
	$(".subpage-timeline.main-subpage").on("scroll", function(){
		$(this).scrollLeft(0)
	})

	
	//貼文-下方附檔功能bar
	$(".cp-addfile").click(function(){
		var img_url = "images/compose/compose_form_addfile_";
		var target = $(this);

		// var this_compose = $(document).find(".cp-content");
		var add_type = target.data("cp-addfile");
		switch(add_type){

			case "video":
				$(".cp-file").attr("accept", "video/mp4").trigger("click");
				break;
			case "img":	//附影像
				$(".cp-file").attr("accept", "image/*").trigger("click");
				break;

			case "file":	//附影像
				$(".cp-file").data("file",true).attr("accept", false).trigger("click");
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

		var composePage = $("#page-compose"),
			this_compose = composePage.find(".cp-content"),
			videoList = [],
			imgList = [],
			fileList = [],
			file_ori = $(this),
			imageType = /image.*/,
			videoType = /video.mp4/,
			isMp4AlertShown = false;

		// 預設各個副檔案的title
		if(composePage.find(".cp-file-img-area").attr("type") === undefined) {
			composePage.find(".cp-file-area > div").each(function(i, item) {
				$(item).attr("type", $.i18n.getString("COMPOSE_FOOTER_" + $(item).attr("name")));
			})
		} 
			

		$.each(file_ori[0].files,function(i,file){
			// 點擊迴紋針上傳 直接push進fileList
			if(file_ori.data("file") === true) {
				fileList.push(file);
				return;
			}

			if( file.type.match(imageType)){
				imgList.push(file);
			} else if( file.type.match(videoType)){
				videoList.push(file);
			} else if( !isMp4AlertShown && file.type.match(/video.*/)){
				isMp4AlertShown = true;
				toastShow( $.i18n.getString("COMMON_NOT_MP4") );
			} else {
				// 上傳檔案
				fileList.push(file)
			}
		});

		file_ori.data("file", false);

		if( imgList.length>0 ){

			composePage.find(".cp-attach-area").show();
			composePage.find(".cp-file-area").show();
			var imageArea = composePage.find(".cp-file-img-area");
			imageArea.html("").show();
			
			$.each(imgList,function(i,file){
				if(!file || !file.type) return;
				//流水號
				var ai = this_compose.data("upload-ai");
				this_compose.data("upload-obj")[ai] = {file: file};
				this_compose.data("upload-ai",ai+1)
			});
			
			$.each(this_compose.data("upload-obj"),function(i, obj){
				var this_grid =  $('<div class="cp-grid"><div><img/></div><img class="grid-cancel" src="images/common/icon/icon_compose_close.png"/></div>');
				$(".cp-file-img-area").append(this_grid);

				//編號 方便刪除
				this_grid.data("file-num",i);

				
				// 存回
				var elem = this_grid.find("div img");
				this_compose.data("upload-obj")[i] = {
					file: obj.file,
					elem: elem[0]
				}

				//有圖片就push進 compose message list
				if($.inArray(6,this_compose.data("message-list")) < 0){
					this_compose.data("message-list").push(6);

					//附檔區域存在附檔
					this_compose.data("attach",true);
				}

				var reader = new FileReader();
				reader.onload = function(e) {
			        elem.attr("src",reader.result);
				}
				reader.readAsDataURL(obj.file);	
			});
		}

		if( videoList.length>0 ){

			var composePage = $("#page-compose");
			var this_compose = composePage.find(".cp-content");
			var videoArea = this_compose.find(".cp-file-video-area");

			var limit_chk = false;
			// var upload_arr = this_compose.data("upload-arr");

			if(videoList.length > 1) {
				toastShow( $.i18n.getString("COMMON_SEND_VIDEO_LIMIT",1) );
			} else {
				var file = videoList[0];

				if(file.size > 200 * 1024 * 1024){ //max 200mb
					toastShow($.i18n.getString("COMMON_EXCEED_FILE_SIZE"));
				} else {
					//流水號
					var ai = this_compose.data("upload-ai");
					this_compose.data("upload-ai",ai+1);
					if(Object.keys(this_compose.data("upload-video")).length > 0){	//代表已經有影片了
						ai = Object.keys(this_compose.data("upload-video"))[0];	//影片的ai編號
					}
					this_compose.data("upload-video")[ai] = file;
					
					this_compose.find(".cp-attach-area").show();
					this_compose.find(".cp-file-area").show();
					videoArea.html("").show();
					var this_grid =  $('<div class="cp-grid"><div><img class="vdo-poster"></div><img class="grid-cancel" src="images/common/icon/icon_compose_close.png"/></div>');
				
					//編號 方便刪除
					this_grid.data("file-num", ai);
					videoArea.append(this_grid);

					//有圖片就push進 compose message list
					if($.inArray(7,this_compose.data("message-list")) < 0){
						this_compose.data("message-list").push(7);
						//附檔區域存在附檔
						this_compose.data("attach",true);
					}

					getVideoImgUrl(file).done(function(vdoUrl) {
						// 判斷有無圖片
						var img = videoArea.find('.vdo-poster')[0];
						img.src = vdoUrl;
						img.onerror = function() { 
							img.src = "images/vdo_default.png";
						}
					})
				}

			}
		}

		if( fileList.length>0 ){
			console.log("yo",fileList);
			composePage.find(".cp-attach-area").show();
			composePage.find(".cp-file-area").show();
			var fileArea = composePage.find(".cp-file-else-area");
			fileArea.show();

			var fileContentArea = fileArea.find(".content");
			fileContentArea.html("");
			
			$.each(fileList,function(i,file){
				if(!file) return;
				//流水號
				var ai = this_compose.data("upload-ai");
				this_compose.data("upload-file")[ai] = file;
				this_compose.data("upload-ai",ai+1)
			});

			$.each(this_compose.data("upload-file"),function(i,file){
				var fileRow =  $('<div class="file-row">' +
                    '    <img src="images/fileSharing/' + getMatchIcon(file.name) + '">' +
                    '    <span>'+ file.name +'</span>' +
                    '    <span>'+ fileSizeTransfer(file.size) +'</span>' +
                    '    <img class="grid-cancel" src="images/common/icon/icon_compose_close.png">' +
                    '</div>');

				fileContentArea.append(fileRow);
				
				//編號 方便刪除
				fileRow.data("file-num",i);

				//有圖片就push進 compose message list
				if($.inArray(26, this_compose.data("message-list")) < 0){
					this_compose.data("message-list").push(26);
					//附檔區域存在附檔
					this_compose.data("attach",true);
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
        if($(this).hasClass("compose-dnd")) {
        	target_input = $(".cp-file");
        	target_input.data("file", false);
        }
        if($(this).hasClass("me")) {
        	target_input = $(this).find(".user-avatar-bar.me input");
        	$(this).show();
        }
        
        /*UPLOAD FILES HERE*/
        if(!e.originalEvent.dataTransfer) return;
        if((e.originalEvent.dataTransfer.files || []).length === 0) return;
        
		target_input[0].files = e.originalEvent.dataTransfer.files;
	});

	$(document).on("dragover", ".st-sub-box, #page-compose", function() {
		var this_target = $(this);

		// 自動偵測解除dnd藍色背景
		this_target.off("mouseleave").mouseleave(function() {
			this_target.find(".timeline-dnd").hide();
		});

		if(this_target.hasClass("st-sub-box") && !this_target.find(".timeline-dnd").is(":visible"))
			this_target.find(".timeline-dnd").show().css("height",this_target.height()+5);
		else
			$(".compose-dnd").show();	
	});

	$(document).on("dragleave",".timeline-dnd, .compose-dnd",function(){
		$(this).off("mouseleave").hide();
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

	$(document).on("click",".cp-file-area .grid-cancel",function(e){
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
				this_grid.hide("fast", function(){ 
					this_grid.remove(); 

					//圖檔區沒東西了 就剔除message list
					if(area.html() == ""){
						area.hide();
						this_compose.data("message-list").splice($.inArray(6,this_compose.data("message-list")),1);
						composeCheckMessageList();
					}
				});
			} else if(area.hasClass("cp-file-video-area")) {
				//刪除upload arr
				delete this_compose.data("upload-video")[file_num];

				this_cancel.attr("src","images/common/icon/icon_compose_close.png");
				this_cancel.remove();
				this_grid.hide('fast', function(){ 
					this_grid.remove(); 

					//圖檔區沒東西了 就剔除message list
					if( area.html() == ""){
						area.hide();
						this_compose.data("message-list").splice($.inArray(7,this_compose.data("message-list")),1);
						composeCheckMessageList();
					}
				});
			} else {
				//刪除upload arr
				delete this_compose.data("upload-file")[file_num];

				this_cancel.attr("src","images/common/icon/icon_compose_close.png");
				this_cancel.remove();
				this_grid.hide('fast', function(){ 
					this_grid.remove(); 

					//圖檔區沒東西了 就剔除message list
					if( area.html() == ""){
						area.parent().hide();
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
				clickTimelineTab({action: "chat"});
				// $(".sm-small-area[data-sm-act=chat]").trigger("click");
				break;
			case "setting":
				clickTimelineTab({action: "groupSetting"});
				// $(".sm-small-area[data-sm-act=groupSetting]").trigger("click");
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
				clickTimelineTab({action: "chat"});
				// $(".sm-small-area[data-sm-act=chat]").trigger("click");
				break;
			case "cnt":
				cns.debug("cnt");
				break;
			case "setting":
				clickTimelineTab({action: "groupSetting"});
				// $(".sm-small-area[data-sm-act=groupSetting]").trigger("click");
				break;
		}
	});

	$(document).on("click",".st-attach-video.play div,.video-area.play div",function(e){
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
