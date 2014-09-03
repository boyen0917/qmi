
var g_ui;		//user id
var g_room;		//chatRoom
var g_ci;		//chatRoom id
var g_cn;		//聊天室名字
var g_gi;		//group id
var g_group;	//group
var g_at;		//access token
var eGroupTiType = {
	CHAT:0,
	CALENDER:1,
	TIME_LINE:2
};
var g_isEndOfPage = false;	//是否在頁面底端
var g_needsRolling = true;	//是否要卷到頁面最下方？

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

    //所有團體列表
    g_group = userData[g_gi];
    g_room = g_group["chatAll"][g_ci];
	g_cn = g_room.uiName;

    if( !userData ){
    	document.location = "login.html";
    }

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

					//msg
					var msgData = data.el[key].ml[0];
					//is me?
					if( object.meta.gu == g_group.gu ){
						//right align
						//time +(msg)
						tmp = "<div class='chat-msg-right'><div class='chat-msg-time'>" + time.customFormat( "#hhh#:#mm#" ) + "</div>" 
							+ "<div class='chat-msg-bubble-right'>" + htmlFormat(msgData.c)+"</div></div>";
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
						subDiv.append("<div class='chat-msg-bubble-left'>" + htmlFormat(msgData.c)+"</div>");	//msg
						subDiv.append("<div class='chat-msg-time'>" + time.customFormat( "#hhh#:#mm#" ) + "</div>");	//time
						div.append(subDiv);	//right
					}
				}
			}

			tmp = "<div class='chat-date-tag'>" + currentDate.customFormat( "#YYYY#/#M#/#D# #CD# #DDD#" )+"</div>"+tmp;
			currentDate = time;
			year = currentDate.getFullYear();	//4 digits
			month = currentDate.getMonth(); //0-11
			date = currentDate.getDate(); //1-31
			container.prepend(tmp);

			if( g_needsRolling ){
				g_needsRolling = false;
				$('html, body').animate({scrollTop: $(document).height()}, 0);
			} else if(g_isEndOfPage)	$('html, body').animate({scrollTop: $(document).height()}, 0);
	    }
	);
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

getS3file = function(file_obj,target,tp,size){
		//default
		size = size || 350;
		cns.debug("size:",size);
		var api_name = "groups/" + g_gi + "/files/" + file_obj.c + "?pi=" + file_obj.p + "&ti=" + ti_feed;
        var headers = {
                 "ui":ui,
                 "at":at, 
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
						var img = target.find("img.aut");
						img.load(function() {
							//重設 style
							img.removeAttr("style");

							var w = img.width();
				            var h = img.height();
            
            				mathAvatarPos(img,w,h,size);
				        });
						//小圖
						target.find("img.aut").attr("src",obj.s3);
						//大圖
						target.find("img.auo").attr("src",obj.s32).hide();
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