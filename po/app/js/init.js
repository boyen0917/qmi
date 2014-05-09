$(function(){
	console.log(111);
	//api 網址
	base_url = "https://apserver.mitake.com.tw/apiv1/";
	//var base_url = "http://10.1.17.116:8090/apiv1/";
	//ajax用
	myRand = Math.floor((Math.random()*1000)+1);
	
	//國碼
	country_code = "+886";
	
	//動態消息的字數限制
	content_limit = 10;
	
	//計算螢幕長寬以維持比例
	proportion = 1.7;
	
});