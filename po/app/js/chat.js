
var g_ui;		//user id
var g_room;		//chatRoom
var g_ci;		//chatRoom id
var g_cn;		//聊天室名字
var g_gi;		//group id
var g_group;	//group
var g_at;		//access token
var eGroupTiType = {
	"CHAT":0,
	"CALENDER":1,
	"TIME_LINE":2
};
var g_isEndOfPage = false;	//是否在頁面底端
var g_needsRolling = false;	//是否要卷到頁面最下方？
var g_lastMsgEi=0;

/*
              ███████╗███████╗████████╗██╗   ██╗██████╗           
              ██╔════╝██╔════╝╚══██╔══╝██║   ██║██╔══██╗          
    █████╗    ███████╗█████╗     ██║   ██║   ██║██████╔╝    █████╗
    ╚════╝    ╚════██║██╔══╝     ██║   ██║   ██║██╔═══╝     ╚════╝
              ███████║███████╗   ██║   ╚██████╔╝██║               
              ╚══════╝╚══════╝   ╚═╝    ╚═════╝ ╚═╝               
                                                                  */

$(document).ready(function(){
	
	//沒有登入資訊 就導回登入頁面
	if( !$.lStorage("_chatRoom") ){
		document.location = "login.html";
	}

	var _loginData = $.lStorage("_chatRoom");

	g_gi = _loginData.gi;
	g_ui = _loginData.ui;
	g_at = _loginData.at;
	g_ci = _loginData.ci;
    var userData = $.lStorage( g_ui );
    if( !userData ){
    	document.location = "login.html";
    }

    //所有團體列表
    g_group = userData[g_gi];
    g_room = g_group["chatAll"][g_ci];
	g_cn = g_room.uiName;

	eGroupTiType["CHAT"] = g_group["ti_chat"];
	eGroupTiType["CALENDER"] = g_group["ti_cal"];
	eGroupTiType["TIME_LINE"] = g_group["ti_feed"];

    gu = g_group.gu;
    ti_cal = g_group.ti_cal;
    ti_feed = g_group.ti_feed;
    ti_chat = g_group.ti_chat;

	//load language
	updateLanguage( lang );

    //header 設定團體名稱
    $("#header .title").html(g_cn);

    
	//- click "send" to send msg
	$("#footer .contents .send").click( function(){
		var inputDom = $("#footer .contents .input");
		var text = inputDom.html();
	    if (text.length>0 ) {
	    	var tmp = text.replace(/<br>/g,"\n");
			sendChat( tmp );
			inputDom.html("");
	    }
	});

	$(document).find("title").text(g_cn + "-Project O");

	showChat();
});

setInterval(function() {
    showChat();
}, 1000);

$(window).scroll(function() {
   g_isEndOfPage = ($(window).scrollTop() + $(window).height() == $(document).height());
});
/*
              ███████╗██╗   ██╗███╗   ██╗ ██████╗████████╗██╗ ██████╗ ███╗   ██╗          
              ██╔════╝██║   ██║████╗  ██║██╔════╝╚══██╔══╝██║██╔═══██╗████╗  ██║          
    █████╗    █████╗  ██║   ██║██╔██╗ ██║██║        ██║   ██║██║   ██║██╔██╗ ██║    █████╗
    ╚════╝    ██╔══╝  ██║   ██║██║╚██╗██║██║        ██║   ██║██║   ██║██║╚██╗██║    ╚════╝
              ██║     ╚██████╔╝██║ ╚████║╚██████╗   ██║   ██║╚██████╔╝██║ ╚████║          
              ╚═╝      ╚═════╝ ╚═╝  ╚═══╝ ╚═════╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝          
                                                                                          */

function op( url, type, data, delegate){
	$.ajax({
	    url: "https://apserver.mitake.com.tw/apiv1" + url,
	    type: type,
	    data: data,
	    dataType: "json",
	    headers: {
			ui: g_ui,
			at: g_at,
			li: "TW"
	    },
	    success: delegate,
	    error: function(jqXHR, textStatus, errorThrown) {
		  console.log(textStatus, errorThrown);
		}
	});
}

function getGroupMemberFromData( g_uid ){
	if(!g_group["guAll"][g_uid])	return null;

	return g_group["guAll"][g_uid];
}

function getChatMem(groupUID){
	return getGroupMemberFromData(groupUID);
}

function getChatMemName(groupUID){
	var mem = getGroupMemberFromData(groupUID);
	if( null == mem )   return "unknown";
	return mem.nk;
}
function showChat(){
	op("/groups/"+g_gi+"/chats/"+g_ci+"/messages",
	    "GET",
	    "",
	    function(data, status, xhr) {
			//檢查是否需要更新.
			if( data.el.hasOwnProperty("0") ){
				var object = data.el["0"];
				if( g_lastMsgEi==object.ei ){
					return;
				} else {
					g_lastMsgEi=object.ei;
				}
			}

			var tmp = "";
			var currentDate = new Date();
			var year = currentDate.getFullYear();	//4 digits
			var month = currentDate.getMonth(); //0-11
			var date = currentDate.getDate(); //1-31

			var container = $("#chat-contents").html("");
			var time;

			for( var key in data.el){
				var object = data.el[key];
				if(object.hasOwnProperty("meta")){
					//time
					var time = new Date(object.meta.ct);
					
					//another day?
					if( (time.getFullYear() < year) || (time.getMonth()<month) || time.getDate()<date ){
						tmp = "<div class='chat-date-tag'>" + currentDate.customFormat( "#YYYY#/#M#/#D# #CD# #DDD#" )+"</div>";
						currentDate = time;
						year = currentDate.getFullYear();	//4 digits
						month = currentDate.getMonth(); //0-11
						date = currentDate.getDate(); //1-31
						container.prepend(tmp);
					}

					showMsg(container, data.el[key], time);
				}
			}

			tmp = "<div class='chat-date-tag'>" + currentDate.customFormat( "#YYYY#/#M#/#D# #CD# #DDD#" )+"</div>";
			currentDate = time;
			year = currentDate.getFullYear();	//4 digits
			month = currentDate.getMonth(); //0-11
			date = currentDate.getDate(); //1-31
			container.prepend(tmp);

			if( g_needsRolling ){
				g_needsRolling = false;
				$('html, body').animate({scrollTop: $(document).height()}, 0);
			} else if(g_isEndOfPage){
				$('html, body').animate({scrollTop: $(document).height()}, 0);
			}
	    }
	);
}

function showMsg(container, object, time){
	//msg
	var msgData = object.ml[0];
	var msgDiv;
	var isMe = ( object.meta.gu == g_group.gu );
	//is me?
	if( isMe ){
		//right align
		//time +(msg)
		var div = $("<div class='chat-msg-right'></div>");
		container.prepend(div);

		div.append( $("<div class='chat-msg-time'>" + time.customFormat( "#hhh#:#mm#" ) + "</div>") );
		msgDiv = $("<div></div>");
		div.append(msgDiv);
	} else{
		//left align
		var mem = getChatMem(object.meta.gu)

		var div = $("<div class='chat-msg-left'></div>");
		container.prepend(div);

		//left
		var pic = $("<img class='aut'></img>");	//left pic (auo for large pic)
		if(mem.aut && mem.aut.length>0){
			pic.attr("src", mem.aut);
		} else {
			pic.attr("src", "images/common/others/empty_img_personal_l.png");
		}
		div.append(pic);
		
		//right
		var subDiv = $("<div></div>");
		subDiv.append("<div class='name'>"+ mem.nk +"</div>");	//name
		msgDiv = $("<div></div>");
		subDiv.append(msgDiv);	//msg
		subDiv.append("<div class='chat-msg-time'>" + time.customFormat( "#hhh#:#mm#" ) + "</div>");	//time
		div.append(subDiv);	//right
	}

	switch(msgData.tp){
		case 0: //text or other msg
			if(isMe){
				msgDiv.addClass('chat-msg-bubble-right');
			} else {
				msgDiv.addClass('chat-msg-bubble-left');
			}
			msgDiv.html( htmlFormat(msgData.c) );
			break;
		case 6:
			if(isMe){
				msgDiv.addClass('chat-msg-pic-right');
			} else {
				msgDiv.addClass('chat-msg-pic-left');
			}
			var pic = $("<img>");
			msgDiv.append(pic);
			getS3file(msgDiv, msgData.c, msgData.p, msgData.tp, g_ci, 120);
			break;
		default: //text or other msg
			//alert("!"+msgData.tp);
			break;
	}
}

function sendChat(msg){
	op("/groups/"+g_gi+"/chats/"+g_ci+"/messages",
	    "POST",
	    JSON.stringify(
		    {
			meta:{
			  lv: 2,
			  tp: 3
			},
			ml:[
			    {tp: 0,
			    c: msg
			  }
			]
		    }),
	    function(data, status, xhr) {
			g_needsRolling = true;
	    }
	);
}

getS3file = function(target, file_c, file_p, tp, ti, size){
	//default
	size = size || 350;
	cns.debug("size:",size);
	//var api_name = "groups/" + g_gi + "/files/" + file_c + "?pi=" + file_p + "&ti=" + eGroupTiType[serviceTp];
    var api_name = "groups/" + g_gi + "/files/" + file_c + "?pi=" + file_p +"&ti=" + ti;
    var headers = {
             "ui":g_ui,
             "at":g_at, 
             "li":lang,
                 };
    var method = "get";
    var result = ajaxDo(api_name,headers,method,true);
	result.complete(function(data){
		if(data.status != 200) return false;

		var obj =$.parseJSON(data.responseText);
		obj.api_name = api_name;
		if(target && tp){
			switch(tp){
				case 6://圖片
					var img = target.find("img");
					img.load(function() {

						var w = img.width();
			            var h = img.height();
        
        				mathAvatarPos(img,w,h,size);
						//重設 style
						img.removeAttr("style");

						if(g_isEndOfPage){
							$('html, body').animate({scrollTop: $(document).height()}, 0);
						}
			        });
					//小圖
					target.find("img").attr("src",obj.s3);
					break;
				case 8://聲音
					target.attr("src",obj.s3);
					break;
			}
		}else{
			return obj.s3;
		}
	});
}