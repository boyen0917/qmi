$(function(){

	// ui = "227f07f2-71b7-49b9-b395-e10ca4d8c956";
	// at = "d7ade0c8-ea3f-4592-acc5-c16905eb5197"; 
	// gi = "0e508d9c-90b1-454b-88b0-7f60d054a4bf";

	//api 網址
	//base_url = "https://mapserver.mitake.com.tw/apiv1/";
 	base_url = "https://apserver.mitake.com.tw/apiv1/";
	//base_url = "http://10.1.17.116:8090/apiv1/";

	//傳送逾時
	ajax_timeout = 20000;

	//ajax用
	myRand = Math.floor((Math.random()*1000)+1);
	
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
	
	//預設使用者大頭照
	no_pic = "images/common/others/empty_img_personal_xl.png";
	
	//預設使用者大頭照 size
	avatar_size = 60;
	
	//記錄timeline種類
//	this_event.find(".st-sub-box").data("timeline-tp",tp);
//	this_event.find(".st-sub-box").data("groud-id",gi);
//	this_event.find(".st-sub-box").data("timeline-id",ti_feed);
//	this_event.find(".st-sub-box").data("event-id",val.ei);
	

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