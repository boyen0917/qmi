$(function(){
	//api 網址
	base_url = "https://apserver.mitake.com.tw/apiv1/";
	//var base_url = "http://10.1.17.116:8090/apiv1/";
	//ajax用
	myRand = Math.floor((Math.random()*1000)+1);
	
	//國碼
	country_code = "+886";
	
	//動態消息的字數限制
	content_limit = 400;
	
	//計算螢幕長寬以維持比例
	proportion = 1.7;
	
	//timeline裏面點擊不做展開收合的區域
	timeline_detail_exception = [
		".st-sub-box-2-content-detail a",
		".st-sub-box-2-more-desc-detail a",
		".st-task-vote-detail",
		".audio-play",
		".st-sub-box-more-btn",
		".st-more-close",
		".st-user-pic",
		".st-sub-box-more",
		".st-sub-box-2-attach-area"
	];
	
	//timeline內容 判斷不開啓附檔區域的type
	not_attach_type_arr = [0,14,15];
	
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
	
});