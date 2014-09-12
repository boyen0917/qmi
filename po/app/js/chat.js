
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
var g_idb_chat_msgs;
var g_msgs = [];
var g_currentDate = new Date(0);
var g_lastDate = new Date();
var g_bIsLoadHistoryMsg = false;

/*
              ███████╗███████╗████████╗██╗   ██╗██████╗           
              ██╔════╝██╔════╝╚══██╔══╝██║   ██║██╔══██╗          
    █████╗    ███████╗█████╗     ██║   ██║   ██║██████╔╝    █████╗
    ╚════╝    ╚════██║██╔══╝     ██║   ██║   ██║██╔═══╝     ╚════╝
              ███████║███████╗   ██║   ╚██████╔╝██║               
              ╚══════╝╚══════╝   ╚═╝    ╚═════╝ ╚═╝               
                                                                  */
$(document).ready(function(){
	
	initDB();

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
	$("#footer .contents .send").off("click");
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

	$("#chat-toBottom").off("click");
	$("#chat-toBottom").click(scrollToBottom);

	$("#chat-toBottom").off("resize");
	$(window).resize(resizeContent);

	resizeContent();
});

/*
              ███████╗██╗   ██╗███╗   ██╗ ██████╗████████╗██╗ ██████╗ ███╗   ██╗          
              ██╔════╝██║   ██║████╗  ██║██╔════╝╚══██╔══╝██║██╔═══██╗████╗  ██║          
    █████╗    █████╗  ██║   ██║██╔██╗ ██║██║        ██║   ██║██║   ██║██╔██╗ ██║    █████╗
    ╚════╝    ██╔══╝  ██║   ██║██║╚██╗██║██║        ██║   ██║██║   ██║██║╚██╗██║    ╚════╝
              ██║     ╚██████╔╝██║ ╚████║╚██████╗   ██║   ██║╚██████╔╝██║ ╚████║          
              ╚═╝      ╚═════╝ ╚═╝  ╚═══╝ ╚═════╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝          
                                                                                          */

function resizeContent(){
	console.debug( $( window ).height(), $("#header").height(), $("#chat-loading").height());
	$("#container").css("min-height", 
		$( window ).height()
		-$("#header").height()
		-$("#footer").height()
		+$("#chat-loading").height()
	);
}

function initDB(){
	g_idb_chat_msgs = new IDBStore({
	    dbVersion: 1,
	    storeName: 'chat_msgs',
	    keyPath: 'ei',
	    indexes: [
	    	{ name: 'ci_ct',keyPath:['ci','ct']},
	    ]
	    ,onStoreReady: function(){
	    	var today=new Date();
	    	$("#chat-contents").html("<div class='firstMsg'></div>");
	    	var timeTag = $("<div class='chat-date-tag'></div>");
	    	timeTag.addClass( today.customFormat("_#YYYY#_#M#_#D#") );
	    	timeTag.html( getFormatTimeTag(today) );
	    	$("#chat-contents").append( timeTag );
	    	$("#chat-contents").append( "<div></div>" );
	    	$("#chat-contents").append( "<div class='lastMsg'></div>" );
	    	getHistoryMsg( false );

			scrollToBottom();
	    }
    });
}

//show history chat contents
function getHistoryMsg ( bIsScrollToTop ){
	g_bIsLoadHistoryMsg = true;
	// console.debug(g_lastDate);
    g_idb_chat_msgs.limit(function(list){
        //console.debug("list:",JSON.stringify(list,null,2));
        if( list.length>0 ){
        	//list is from near to far day
	        for( var i in list){
	        	if( null==list[i] || g_msgs.indexOf(list[i].ct)>=0 ){
					continue;
				} else {
	        		var object = list[i].data;
					showMsg( object, true );
				}
	        }
	    }

		//set update contents
		setInterval(function() {
		    updateChat();
		    checkPagePosition();
		}, 1000);
    	//updateChat();
    	if(bIsScrollToTop)	scrollToStart();
    	g_bIsLoadHistoryMsg = false;
    },{
        index: "ci_ct",
        keyRange: g_idb_chat_msgs.makeKeyRange({
	        upper: [g_ci, g_lastDate.getTime()],
	        lower: [g_ci]
	        // only:18
        }),
        limit: 20,
        order: "DESC",
        onEnd: function(result){
            console.debug("onEnd:",result.ci + " " + result.ct);
        },
        onError: function(result){
            console.debug("onError:",result);
        }
    });
}

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

function scrollToStart(){
	$('html, body').animate({scrollTop:50}, 'fast');
}

function scrollToBottom(){
	$('html, body').animate({scrollTop:$(document).height()}, 'fast');
}

function checkPagePosition(){
	var posi = $(window).scrollTop();
	if( posi <= 0 ){
		if( false==g_bIsLoadHistoryMsg ){
			getHistoryMsg( true );
		}
		g_isEndOfPage = false;
		return;
	}

	var height = $(window).height();
	var docHeight = $(document).height();
	var isAtBottom = ((posi + height) >= docHeight);
	if( g_isEndOfPage != isAtBottom ){
		g_isEndOfPage = isAtBottom;
		if(g_isEndOfPage) $("#chat-toBottom").fadeOut('fast');
		else $("#chat-toBottom").fadeIn('fast');
	}
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
function updateChat (){
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

	        $("#chat-contents .lastMsg").removeClass("chat-date-tag");
	        $("#chat-contents .lastMsg").html("");

			for( var i=(data.el.length-1); i>=0; i--){
				var object = data.el[i];
				if(object.hasOwnProperty("meta")){
					//showMsg(container, data.el[key], time);

					if( g_msgs.indexOf(object.meta.ct)>=0 ){
						continue;
					} else {
						//add to db
						var node = {
							ei: object.ei,
							ci: g_ci,
					        ct: object.meta.ct,
					        data: object
					    };
					    //register msg loaded
						g_idb_chat_msgs.put( node );
					}

					showMsg( object, false );
				}
			}

            //scroll to bottom
			if( g_needsRolling ){
				g_needsRolling = false;
				scrollToBottom();
			} else if(g_isEndOfPage){
				scrollToBottom();
			}
			
	    }	//end of function
	);	//end of op
}	//end of updateChat

function getFormatTimeTag( date ){
	return date.customFormat( "#YYYY#/#M#/#D# #CD# #DDD#" );
}

function showMsg(object, bIsFront){
	if( null == object ) return;

	g_msgs.push(object.meta.ct);

	//console.debug("list:",JSON.stringify(object,null,2));

	var container = $("<div></div>");
	var time = new Date(object.meta.ct);
	var szSearch = "#chat-contents ."+time.customFormat("_#YYYY#_#M#_#D#");
	var div = $( szSearch );

	if( div.length>0 && div.next().length>0 ){
		div = div.next();
	} else {
		var timeTag = $("<div class='chat-date-tag'></div>");
		timeTag.addClass(time.customFormat("_#YYYY#_#M#_#D#"));
		timeTag.html( getFormatTimeTag(time) );
		if(time.getTime()<g_lastDate){
			$("#chat-contents .firstMsg").after(timeTag);
		} else {
			$("#chat-contents .lastMsg").before(timeTag);
		}
		div = $("<div></div>");
		timeTag.after(div);
	}

	if(time.getTime()<g_lastDate){
		g_lastDate = time;
	}
	if(time.getTime()>g_currentDate){
		g_currentDate = time;
	}

	if(bIsFront){
		div.prepend(container);
	} else {
		div.append(container);
	}

	//msg
	var msgData = object.ml[0];
	var msgDiv;
	var isMe = ( object.meta.gu == g_group.gu );
	//is me?
	if( isMe ){
		//right align
		//time +(msg)
		var div = $("<div class='chat-msg-right'></div>");
		container.append(div);

		div.append( $("<div class='chat-msg-time'>" + time.customFormat( "#hhh#:#mm#" ) + "</div>") );
		msgDiv = $("<div></div>");
		div.append(msgDiv);
	} else{
		//left align
		var mem = getChatMem(object.meta.gu)

		var div = $("<div class='chat-msg-left'></div>");
		container.append(div);

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
		subDiv.append("<div class='chat-msg-time'>" + time.customFormat( "#hh#:#mm#" ) + "</div>");	//time
		div.append(subDiv);	//right
	}

	// console.debug( g_lastDate, time.customFormat( "#M#/#D# #hh#:#mm#" ), msgData.c);

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
			var pic = $("<img style='width:150px;height:200px;'>");
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

						// if(g_isEndOfPage){
						// 	scrollToBottom();
						// }
			        });
			        
					//小圖
					img.attr("src",obj.s3);
					//點擊跳出大圖
					img.click( function(){
						var imgO = new Image();
						var gallery_str = "<img src=" + obj.s32 + " />";
						imgO.onload = function() {
							var gallery = window.open("layout/chat_gallery.html", "", "width=" + (this.width+30) + ", height=" + (this.height+25));
					    	$(gallery.document).ready(function(){
								setTimeout(function(){
									var this_slide = $(gallery.document).find(".pic");
									this_slide.html( gallery_str );
								},300);
							});
					    }
						imgO.src = obj.s32;
					});
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