

$(document).ready(function(){
	
	//沒有登入資訊 就導回登入頁面
	if(!$.lStorage("_loginData")){
		
		login("+886956634948","zaq12wsx");
	} else {

		var _loginData = $.lStorage("_loginData");

    	//所有團體列表
    	group_list = _loginData.gl;
		g_ui = _loginData.ui;

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
        		
        	} else {
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
        	//topEvent();

        	//動態消息
        	//timelineListWrite();

        }

        g_userData = $.lStorage(_loginData.ui);

    	//show chatting room test
        getGroupLists();
	}

	//load language
	updateLanguage( lang );

    $(".div").css("overflow", "hidden");
    $(".div").css("position", "fixed");
    $(".button").data( "width", "50");
    $(".button").click( function(){
        console.log("#"+$(this).attr('class'));
        $.mobile.changePage("#"+$(this).attr('value'));
    } );

    $(".side-menu-btn").click(function(){
        $( "#side-menu" ).panel( "open");
    });

    $("#chat-input").keypress(function(e) {
	    var text = $("#chat-input").val();
	    if (e.which == 13 && text.length>0 ) {
		sendChat( text );
		$("#chat-input").val("");
		//alert(text);
	    }
	});
});




//======================================================
var g_userData;
var g_groupDetailArray = new Array();
var g_groupChatRooms = new Array();
var g_bIsChating = false;
var g_gi;
var g_ui;
var g_chatGID;
var g_chatRID;
var eGroupTiType = {
	CHAT:0,
	CALENDER:1,
	TIME_LINE:2
};

function op( url, type, data, delegate){
	var loginData = $.lStorage("_loginData");
	if( loginData ){
		$.ajax({
		    url: "https://apserver.mitake.com.tw/apiv1" + url,
		    type: type,
		    data: data,
		    dataType: "json",
		    headers: {
				ui: g_ui,
				at: loginData.at,
				li: "TW"
		    },
		    success: delegate
		});
	}
}

function login(id, pwd) {
	$.ajax({
	    url: "https://apserver.mitake.com.tw/apiv1/login",
	    type: "POST",
	    data: JSON.stringify({id: id, tp: 0, pw: encrypt(pwd)}),
	    dataType: "json",
	    headers: {
		li: "TW"
	    },
	    success: function(data, status, xhr) {
	    	$.lStorage("_loginData",data);
			ui = data.ui;
			at = data.at;

			g_userData = $.lStorage(ui);
			getGroupLists();
	    }
	});
	//alert( JSON.stringify({id: id, tp: 0, pw: encrypt(pwd)}) );
}

function encrypt(a) {
	var hash = CryptoJS.SHA1(a);
	return hash.toString(CryptoJS.enc.Base64);
}

function getGroupLists() {
// 	op("/groups",
// 	    "GET",
// 	    "",
// 	    function(data, status, xhr) {
// 			$("#main_groupTable").html("");
// 			for( var key in data.gl){
// 			    var tmp = "";
// 			    var group = data.gl[key];
// 			    if( g_userData.hasOwnProperty(group.gi) ){
// 			    	g_userData[group.gi] = group;
// 			    } else {
// 			    	alert("group " + group.gi + " not exist");
// 			    }
			    
// 			    //title
// 			    tmp += "<h1 class='groupBtn demoHeaders' id='" +group.gi+ "'>"+group.gn+"</h1>"
// 				+"<div>"
// 				    + "member count:" + group.cnt + "<br>"
// 				    + "<div id='" +group.gi+ "_memList'></div>"
// 				    + "<div id='" +group.gi+ "_chatList'>!!!!</div>"
// 				+"</div>";
// 			    $("#main_groupTable").append(tmp);
// 			}
// 			/*
// 			$( "#main_groupTable" ).accordion({
// 			    heightStyle: "content"
// 			});
// */
// 			//$("#main_groupTable tr:last").after(row);
			
// 			$(".groupBtn").click(function(){
// 			    getGroupMember( $(this).attr("id") );
// 			});
// 			getGroupMember( data.gl[0].gi );
// 			//$( "#main_groupTable" ).accordion();
// 	    }
// 	);
	$("#main_groupTable").html("");

	var keys = Object.keys(g_userData);
	var tmp = "";
	for( var i=1; i< keys.length; i++ ){
	    var key = keys[i];
	    var group = g_userData[key];
	    
	    //title
	    tmp += "<h1 class='groupBtn demoHeaders' id='" +key+ "'>"+group.gn+"</h1>"
		+"<div>"
		    + "member count:" + group["guAll"].length + "<br>"
		    + "<div id='" + key+ "_memList'></div>"
		    + "<div id='" +key+ "_chatList'>!!!!</div>"
		+"</div>";
	}
	$("#main_groupTable").append(tmp); 
	/*
	$( "#main_groupTable" ).accordion({
	    heightStyle: "content"
	});
*/
	//$("#main_groupTable tr:last").after(row);
	
	$(".groupBtn").click(function(){
	    getGroupMember( $(this).attr("id") );
	});
	g_gi=keys[1];
	getGroupMember( g_gi );
	//$( "#main_groupTable" ).accordion();
}

function getGroupMember( id ){
	/*
	op("/groups/"+id+"/users",
	    "GET",
	    "",
	    function(data, status, xhr) {
			var tmp = "<p>Members<br>";
			for( var key in data.ul ){
			    var mem = data.ul[key];
			    if(!g_groupDetailArray[ id ])
				g_groupDetailArray[ id ] = new Array();
			    g_groupDetailArray[ id ][mem.gu] = mem;
			    tmp += "<button>"+mem.nk+"</button>";
			}
			getChatList( id );
			$("#"+id+"_memList").html(tmp+"</p>");
			
			//$( "#main_groupTable" ).accordion();
	    }
	);
*/
	var tmp = "<p>Members<br>";
	for( var key in g_userData[id]["guAll"] ){
	    var mem = g_userData[id]["guAll"][key];
	    tmp += "<button>"+mem.nk+"</button>";
	}
	getChatList( id );
	$("#"+id+"_memList").html(tmp+"</p>");
}

function getGroupMemberFromData( gid, g_uid){
	if(!g_userData[gid]["guAll"][g_uid])	return null;

	return g_userData[ gid ]["guAll"][g_uid];
}

function getChatList( id ){
	op("/groups/"+id+"/chats",
	    "GET",
	    "",
	    function(data, status, xhr) {
			var tmp = "<p>Chat Lists<br>";
			if( !g_userData[id].hasOwnProperty("chatAll") ){
				g_userData[id]["chatAll"] = new Array();
			}
				    
			for( var key in data.cl ){
			    var room = data.cl[key];
			    switch( room.tp ){
				case 0:{    //group default
					//alert("get all group room");
					break;
				} case 1:{    //one to one
				    var memIDs = room.cn.split(",");
				    var nameString = "";
				    for(var key in memIDs ){
						var mem = getGroupMemberFromData(id, memIDs[key]);
						if( null == mem ){
						    //nameString += memIDs[key];
						} else{
						    if(mem.gu != g_userData[id].me ){
								nameString += mem.nk + ", ";
						    }
						}
				    }
				    g_userData[id]["chatAll"][room.ci] = room;

				    tmp += "<button class='roomBtn'id='"+room.ci+"'>"+nameString+"</button>";
				    break;
				} case 2:{  //one to multiple
					g_groupChatRooms[room.ci] = room;

				    tmp += "<button class='roomBtn' id='"+room.ci +"'>"+room.cn+"</button>";
				    break;
				} default:{
					//alert("room type unknown:"+room.tp);
				    break;
				}
			    }
			}

			tmp+="</p>";
			$("#" + id+ "_chatList").html(tmp);
			
			$(".roomBtn").click(function(){
			    enterChatRoom(id, $(this).attr("id"), $(this).text() );
			    showChat();
			});
			//$("#main_groupRooms").removeClass("hid");
		
			$.lStorage(g_ui, g_userData);
	    }
	);
}

function enterChatRoom(gid, rid, name){
	g_bIsChating = true;
	g_chatGID = gid;
	g_chatRID = rid;
	var tmp=g_groupChatRooms[g_chatRID];
	if(g_groupChatRooms[g_chatRID]){
		g_chatName = name+"("+")";
	} else {
		g_chatName = $.i18n.getString("chat-title");
	}

	$("#msgDiv").removeClass("hid");
	$(".page-title").text(g_chatName);
	$(".page-title").append("<div class='text' >");
}

function leaveCharRoom(){
g_bIsChating = false;
$("#msg").addClass("hid"); 
}

function getChatMemName(groupUID){
var mem = getGroupMemberFromData(g_chatGID, groupUID);
if( null == mem )   return "unknown";
return mem.nk;
}

function showChat(){
//alert("/groups/"+g_chatGID+"/chats/"+g_chatRID+"/messages");
op("/groups/"+g_chatGID+"/chats/"+g_chatRID+"/messages",
    "GET",
    "",
    function(data, status, xhr) {
		var tmp = "";
		var currentDate = new Date();
		var year = currentDate.getFullYear();	//4 digits
		var month = currentDate.getMonth(); //0-11
		var date = currentDate.getDate(); //1-31
/*
		var val = ($(this).val() - $(this).attr('min')) / ($(this).attr('max') - $(this).attr('min'));
	    $(this).css('background-image',
	                '-webkit-gradient(linear, left top, right top, '
	                + 'color-stop(' + (val+0.02) + ', rgb(95,212,226)), '
	                + 'color-stop(' + (val+0.02) + ', rgb(197,203,207))'
	                + ')'
	                );
*/
		for( var key in data.el){
			var object = data.el[key];
			if(object.hasOwnProperty("meta")){
				//time
				var time = new Date(object.meta.ct);
				
				//another day?
				if( (time.getFullYear() < year) || (time.getMonth()<month) || time.getDate()<date ){
					tmp = "<div class='chat-date-tag'>" + currentDate.customFormat( "#YYYY#/#M#/#D# #CD# #DDD#" )+"</div>"+tmp;
					currentDate = time;
					year = currentDate.getFullYear();	//4 digits
					month = currentDate.getMonth(); //0-11
					date = currentDate.getDate(); //1-31
				}

				//msg
				var msgData = data.el[key].ml[0];
				//is me?
				if( object.meta.gu == g_userData[g_chatGID].me ){
					//right align
					//time +(msg)
					tmp = "<div class='chat-msg-right'><div class='chat-msg-time'>" + time.customFormat( "#hhh#:#mm#" ) + "</div>" 
						+ "<div class='chat-msg-bubble-right'>" + getChatMemName(object.meta.gu) + ":  " + msgData.c+"</div></div></br>" 
						+ tmp;
				} else{
					//left align
					//(photo)(msg)time

					tmp = "<div class='chat-msg-left'><img class='aut'></img><img class='auo'></img>"
						+ "<div class='chat-msg-bubble-left'>" + getChatMemName(object.meta.gu) + ":  " + msgData.c+"</div>" 
						+ "<div class='chat-msg-time'>" + time.customFormat( "#hhh#:#mm#" ) + "</div></div></br>" 
						+ tmp;
				}
			}
		}
		$("#chat-contents").html("<div class='margin' style='text-align: center;'>"+g_chatName+"</div>" + tmp);
    }
);
}

function getChatContent(data){
	var this_img = $(
				'<div class="st-slide-img">' +
	            	'<img class="aut" src="images/loading.gif" style="width:30px;position: relative;top: 130px;"/>' +
	            	'<img class="auo" src="" style="display:none"/>' +
	            '</div>' +
	            '<span class="st-img-gap"></span>'
			);
			this_event.find(".st-attach-img-area .st-img-gap-last").before(this_img);

			getS3file(val,this_img,6);
}

function sendChat(msg){
op("/groups/"+g_chatGID+"/chats/"+g_chatRID+"/messages",
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
		for( var key in data.ul ){
		    var mem = data.ul[key];
		    if(!g_groupDetailArray[ g_chatRID ])
			g_groupDetailArray[ g_chatRID ] = new Array();
		    g_groupDetailArray[ g_chatRID ][mem.gu] = mem;
		}
    }
);
}

setInterval(function() {
    if (g_bIsChating) {
	    showChat();
    }
}, 1000);

function getFilePath(file_obj, target, tp, size, ti){
		//default
		size = size || 350;
		cns.debug("size:",size);
		var api_name = "groups/" + gi + "/files/" + file_obj.c + "?pi=" + file_obj.p + "&ti=" + ti;
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
//==================================================
