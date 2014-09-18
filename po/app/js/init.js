$(function(){

	// ui = "227f07f2-71b7-49b9-b395-e10ca4d8c956";
	// at = "d7ade0c8-ea3f-4592-acc5-c16905eb5197"; 
	// gi = "0e508d9c-90b1-454b-88b0-7f60d054a4bf";

	//api 網址
	// base_url = "https://mapserver.mitake.com.tw/apiv1/";
 	base_url = "https://apserver.mitake.com.tw/apiv1/";
	//base_url = "http://10.1.17.116:8090/apiv1/";

	
	//國碼
	countrycode = "+886";

	//語言
	lang = "zh_TW";
	
	//動態消息的字數限制
	content_limit = 400;
	
	//計算螢幕長寬以維持比例
	proportion = 1.7;

	//上一頁 預設
	$(document).data("page-history",[["login"],["#page-group-menu","團體列表"]]);
	
	//上一頁按鈕不需要記錄
	back_button = false;
	//部分跳頁不需要記錄
	back_exception = false;
	back_hash = false;

	//timeline裏面點擊不做展開收合的區域
	timeline_detail_exception = [
		".st-sub-box-2-content-detail a",
		".st-sub-box-2-more-desc-detail a",
		".st-box2-more-task-area-detail",
		".audio-play",
		".st-sub-box-more-btn",
		".st-more-close",
		".st-user-pic",
		".st-sub-box-more",
		".st-sub-box-2-attach-area"
	];
	
	//timeline內容 判斷不開啓附檔區域的type
	not_attach_type_arr = [0,12,13,14,15];
	
	//顯示loading 圖示 的參數
	load_show = false;

	//特別的
	s_load_show = false;

	//ajax 提示訊息選擇
	ajax_msg = false;
	
	//預設使用者大頭照
	no_pic = "images/common/others/empty_img_personal_xl.png";
	
	//預設使用者大頭照 size
	avatar_size = 60;
	

	//ajax 使用次數
	ajax_count = 0;

	//timeline圖片移動距離
	gallery_movement = 360;

	//發佈計時器
	compose_timer = false;

	//圖片上傳限制
	img_total = 9;

	//附檔區域開啓的type id 
	attach_mtp_arr = [1,6];

	//縮圖寬高
	max_w = 500;
	max_h = 500;
	quality = 0.5;


	//timeline置頂millisecond
	top_timer_ms = 5000;



	// ajax setting

	//ajax用
	myRand = Math.floor((Math.random()*1000)+1);

	$.ajaxSetup ({
		timeout: 30000,
	    // Disable caching of AJAX responses
	    cache: false
	});
	
	$(document).ajaxSend(function() {
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
	});
	

	$(document).ajaxError(function(e, jqxhr, ajaxSettings) {

		$('.ui-loader').hide();
		$(".ajax-screen-lock").hide();

		//ajax逾時
		if(jqxhr.statusText == "timeout"){
			// popupShowAdjust("","網路不穩 請稍後再試",true);
			toastShow("連線逾時");
			return false;
		}
		//logout~
		if(jqxhr.status == 401){
			popupShowAdjust("","驗證失敗 請重新登入",true,false,[reLogin]);
			return false;
		}

		if(window.location.href.match(/webdev.cloud.mitake.com.tw/)) {
    		document.location = "index.html";
    		return false;
    	}

		//ajax 提示訊息選擇 登入頁面錯誤訊息為popup
		if(ajax_msg || window.location.href.match(/index.html/)){
			ajax_msg = false;
			popupShowAdjust("",errorResponse(jqxhr),true);
		}else{
			//預設
			toastShow(errorResponse(jqxhr));	
		}
		
		
		
	});

	//上一頁功能
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

		//timeline頁面
		if(hash == "#page-group-main"){
			//調整團體頭像
			if($(document).data("group-avatar")){
				$(".sm-group-area").each(function(i,val){
					var this_img = $(this).find(".sm-group-area-l img:eq(0)");
					var img = new Image();
					img.onload = function() {
						mathAvatarPos(this_img,this.width,this.height,avatar_size);
					}
					img.src = this_img.attr("src");
				});
				//改完就改回false
				$(document).data("group-avatar",false);
			}
		}
	});

	
	$(".page-back").click(function(){

		//按上一頁不需要記錄歷程
		back_exception = true;
		var t= $(document).data("page-history");

		//目前這頁先移除
		$(document).data("page-history").pop();

		//若上一頁為login 導去login
		if( $(document).data("page-history").last()[0] == "login" ) {
			document.location = "index.html";
		}

		$.mobile.changePage($(document).data("page-history").last()[0], {transition: "slide",reverse: true});
		//cns.debug("last:",$(document).data("page-history").last()[0]);
	});


	errorResponse = function(data){
		if(data.responseText){
			return $.parseJSON(data.responseText).rsp_msg;
		}else{
			cns.debug("errorResponse:",data);
			return "網路連線不穩 請稍後再試";
		}
	}

	

	//debug control 
	setDebug(true);

	function setDebug(isDebug) {
      if (isDebug) {
        window.cns = {
          log: window.console.log.bind(window.console, '%s: %s'),
          error: window.console.error.bind(window.console, 'error: %s'),
          info: window.console.info.bind(window.console, 'info: %s'),
          warn: window.console.warn.bind(window.console, 'warn: %s'),
          debug: window.console.debug.bind(window.console, 'debug: %s')
        };
      } else {
        var __no_op = function() {};

        window.cns = {
          log: __no_op,
          error: __no_op,
          warn: __no_op,
          info: __no_op,
          debug: __no_op
        }
      }
    }

});