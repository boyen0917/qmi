
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
var g_msgs = [];
var g_msgsByTime = new Object();
var g_currentDate = new Date(0);
var g_lastDate = new Date();
var g_bIsLoadHistoryMsg = false;
var g_bIsEndOfHistory = false;
var g_msgTmp;
var g_oriFooterHeight;
var g_extraSendOpenStatus = 0;

/*
              ███████╗███████╗████████╗██╗   ██╗██████╗           
              ██╔════╝██╔════╝╚══██╔══╝██║   ██║██╔══██╗          
    █████╗    ███████╗█████╗     ██║   ██║   ██║██████╔╝    █████╗
    ╚════╝    ╚════██║██╔══╝     ██║   ██║   ██║██╔═══╝     ╚════╝
              ███████║███████╗   ██║   ╚██████╔╝██║               
              ╚══════╝╚══════╝   ╚═╝    ╚═════╝ ╚═╝               
                                                                  */
$(document).ready(function(){
	g_oriFooterHeight = $("#footer").height();
	// $(".title").click(function(){
	// 	updateChat();
	// });


	initChatDB( onChatDBInit);
	initChatCntDB( );

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
    $("#header .subTitle").html(g_group.gn);
    
	//- click "send" to send msg
	var sendBtn = $("#footer .contents .send");
	sendBtn.off("click");
	sendBtn.click( sendChat );
	var input = $("#footer .contents .input");
	// input.autosize({append: "\n"});
	input.off("keydown").off("keypress");
	input.keydown(function(e){
	    if (e.keyCode == '8' || e.keyCode=='46'){	//backspace or delete
	    	setTimeout(updateChatContentPosition,50);
	    }
	});

	input.keypress(function(e){
	    if (e.keyCode == '13' && !e.altKey){
			sendChat();
	    	// return false;
	    }
	    setTimeout(updateChatContentPosition,50);
	});

	$(document).find("title").text(g_cn + "-Project O");

	$("#chat-toBottom").off("click");
	$("#chat-toBottom").click(scrollToBottom);

	$("#chat-toBottom").off("resize");
	$(window).resize(resizeContent);

	$(".input-other").off("click").click(function(){
		if( 0==g_extraSendOpenStatus ){
			g_extraSendOpenStatus = 1;
			$("#footer").animate({bottom:0},'fast');
			$("#chat-contents").animate({marginBottom:200},'fast');
			updateChatContentPosition();
		} else if(1==g_extraSendOpenStatus){
			g_extraSendOpenStatus = 0;
			$("#footer").animate({bottom:-200},'fast');
			$("#chat-contents").animate({marginBottom:0},'fast');
			updateChatContentPosition();
		} else{
			g_extraSendOpenStatus = 1;
		}
		// cns.debug("other: ",g_extraSendOpenStatus);
	});
	$(".input-emoji").off("click").click(function(){
		if( 0==g_extraSendOpenStatus ){
			g_extraSendOpenStatus = 2;
			$("#footer").animate({bottom:0},'fast');
			$("#chat-contents").animate({marginBottom:200},'fast');
			updateChatContentPosition();
		} else if(2==g_extraSendOpenStatus){
			g_extraSendOpenStatus = 0;
			$("#footer").animate({bottom:-200},'fast');
			$("#chat-contents").animate({marginBottom:0},'fast');
			updateChatContentPosition();
		} else{
			g_extraSendOpenStatus = 2;
		}
		// cns.debug("emoji: ", g_extraSendOpenStatus);
	});
	resizeContent();

	if( g_bIsPolling ){
		$("button.pollingCnt").off("click").click( updateChatCnt );
		$("button.pollingMsg").off("click").click( function(){
			for( var i=0; i<g_msgTmp.length; i++ ){
				var object = g_msgTmp[i];
				if( null!=object && g_msgs.indexOf(object.ei)<0 ){
					showMsg( object );
				}
			}
			op("/groups/"+g_gi+"/chats/"+g_ci+"/messages_read"
			    ,"PUT",
			    JSON.stringify({lt:g_currentDate.getTime()}),
			    null
			);
		});
		updateChat();
	}

	//set update contents
	setInterval(function() {
	    checkPagePosition();
	    if( !g_bIsPolling ){
		    updateChat();
		    updateChatCnt();
	    }
	}, 1500);

	initStickerArea.init( $(".stickerArea"), g_ui, sendSticker);
});

/*
              ███████╗██╗   ██╗███╗   ██╗ ██████╗████████╗██╗ ██████╗ ███╗   ██╗          
              ██╔════╝██║   ██║████╗  ██║██╔════╝╚══██╔══╝██║██╔═══██╗████╗  ██║          
    █████╗    █████╗  ██║   ██║██╔██╗ ██║██║        ██║   ██║██║   ██║██╔██╗ ██║    █████╗
    ╚════╝    ██╔══╝  ██║   ██║██║╚██╗██║██║        ██║   ██║██║   ██║██║╚██╗██║    ╚════╝
              ██║     ╚██████╔╝██║ ╚████║╚██████╗   ██║   ██║╚██████╔╝██║ ╚████║          
              ╚═╝      ╚═════╝ ╚═╝  ╚═══╝ ╚═════╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝          
                                                                                          */

function updateChatContentPosition (){
	var tmp = (0==g_extraSendOpenStatus)?200:0;
	var footerHeight = $("#footer").height();
	footerHeight -= tmp;
	$("#chat-contents").animate({MarginBottom:Math.max(0,footerHeight-45)}, 100);
	if( g_isEndOfPage ) scrollToBottom();
	$("#chat-toBottom").animate({bottom: Math.max(0,footerHeight+10)}, 100 );
}

function resizeContent (){
	var tmp = (0==g_extraSendOpenStatus)?200:0;
	// cns.debug( $( window ).height(), $("#header").height(), $("#chat-loading").height());
	$("#container").css("min-height", 
		$( window ).height()
		-$("#header").height()
		-($("#footer").height()-tmp)
		+$("#chat-loading").height()
	);
}

function onChatDBInit(){
	var today=new Date();
	$("#chat-contents").html("<div class='firstMsg'></div>");
	var timeTag = $("<div class='chat-date-tag'></div>");
	timeTag.addClass( today.customFormat("_#YYYY#_#M#_#D#") );
	timeTag.html( getFormatTimeTag(today) );
	today.setHours(0);
	today.setMinutes(0);
	today.setSeconds(0);
	var lastMsg = $("<div class='lastMsg'></div>");
	lastMsg.data("time", today.getTime() );
	lastMsg.append( timeTag );
	$("#chat-contents").append( lastMsg );
	getHistoryMsg( false );

	scrollToBottom();
}

//show history chat contents
function getHistoryMsg ( bIsScrollToTop ){
	g_bIsLoadHistoryMsg = true;
	// cns.debug(g_lastDate);
    g_idb_chat_msgs.limit(function(list){
        //cns.debug("list:",JSON.stringify(list,null,2));
        if( list.length>0 ){
        	//list is from near to far day
	        for( var i in list){
	        	if( null==list[i] || g_msgs.indexOf(list[i].ei)>=0 ){
					continue;
				} else {
	        		var object = list[i].data;
					showMsg( object, true );
				}
	        }
	    
		    op("/groups/"+g_gi+"/chats/"+g_ci+"/messages_read"
			    ,"PUT",
			    JSON.stringify({lt:g_currentDate.getTime()}),
			    null
			);
			
			if( g_bIsPolling )	updateChat();

	    	if(bIsScrollToTop)	scrollToStart();
	    	g_bIsLoadHistoryMsg = false;
	    }
    },{
        index: "gi_ci_ct",
        keyRange: g_idb_chat_msgs.makeKeyRange({
	        upper: [g_gi, g_ci, g_lastDate.getTime()],
	        lower: [g_gi, g_ci]
	        // only:18
        }),
        limit: 20,
        order: "DESC",
        onEnd: function(result){
            cns.debug("onEnd:",result.ci + " " + result.ct);
        },
        onError: function(result){
            cns.debug("onError:",result);
        }
    });
}

/*
api打回來的是以ct開始的訊息....
但每次只會送20筆, 怎麼知道要reverse多少時間回去？？？
暫時先不處理, 之後再問問其他人怎做
*/
function updateHistoryMsg(){
	op("/groups/"+g_gi+"/chats/"+g_ci+"/messages?"+(g_lastDate.getTime()-2000),
	    "GET",
	    "",
	    function(data, status, xhr) {

	        for( var i=(data.el.length-1); i>=0; i--){
				var object = data.el[i];
				if(object.hasOwnProperty("meta")){

					//pass shown msgs
					if( g_msgs.indexOf(object.ei)>=0 ){
						continue;
					} else {
						//add to db
						var node = {
							gi: g_gi,
							ci: g_ci,
							ei: object.ei,
					        ct: object.meta.ct,
					        data: object
					    };
					    //write msg to db
						g_idb_chat_msgs.put( node );

						showMsg( object, true );
					}
				}
			}

	    	scrollToStart();
	    	g_bIsLoadHistoryMsg = false;

	    }	//end of function
	);	//end of op
}	//end of updateChat

function op ( url, type, data, delegate){
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

function scrollToStart (){
	$('html, body').animate({scrollTop:50}, 'fast');
}

function scrollToBottom (){
	$('html, body').animate({scrollTop:$(document).height()}, 'fast');
}

function checkPagePosition (){
	var posi = $(window).scrollTop();
	if( posi <= 0 ){
		if( false==g_bIsLoadHistoryMsg ){
			if( !g_bIsEndOfHistory )	getHistoryMsg( true );
			else updateHistoryMsg();
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

function getGroupMemberFromData ( g_uid ){
	if(!g_group["guAll"][g_uid])	return null;

	return g_group["guAll"][g_uid];
}

function getChatMem (groupUID){
	return getGroupMemberFromData(groupUID);
}

function getChatMemName (groupUID){
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
	    	if( false == g_bIsPolling ){
				if( data.el.hasOwnProperty("0") ){
					var object = data.el["0"];
					if( g_lastMsgEi==object.ei ){
						return;
					} else {
						g_lastMsgEi=object.ei;
					}
				}
	    	}

	        for( var i=(data.el.length-1); i>=0; i--){
				var object = data.el[i];
				if(object.hasOwnProperty("meta")){
					//showMsg(container, data.el[key], time);

					//pass shown msgs
					if( g_msgs.indexOf(object.ei)>=0 ){
						continue;
					} else {
						//add to db
						var node = {
							gi: g_gi,
							ci: g_ci,
							ei: object.ei,
					        ct: object.meta.ct,
					        data: object
					    };
					    //write msg to db
						g_idb_chat_msgs.put( node );

						showMsg( object, false );
					}
				}
			}

            //scroll to bottom
			if( g_needsRolling ){
				g_needsRolling = false;
				scrollToBottom();
			} else if(g_isEndOfPage){
				scrollToBottom();
			}

			//groups/G000006s00q/chats/T000011m0Fj/messages_read
			//update read cnt
		    op("/groups/"+g_gi+"/chats/"+g_ci+"/messages_read"
			    ,"PUT",
			    JSON.stringify({lt:g_currentDate.getTime()}),
			    null
			);
			
	    }	//end of function
	);	//end of op
}	//end of updateChat

function updateChatCnt (){
	var userData = $.lStorage(g_ui);
	// cns.debug( JSON.stringify(userData) );
    g_group = userData[g_gi];
    g_room = g_group["chatAll"][g_ci];


	if( null == g_room || null==g_room.cnt || length<=0 ) return;

    var length = Object.keys(g_room.cnt).length;
	var list = g_room.cnt;
    // cns.debug("list:",JSON.stringify(list,null,2));
    var index=length-1;
	var data = list[index];
	var cnt = data.cnt;
	var elements = $(".chat-cnt");
	for( var i=0; i<elements.length; i++ ){
		var dom = $(elements[i]);
		var time = dom.data("t");

		while(data.ts<time && index>=0 ){
			index--;
			if(index>=0){
				//dom.css("background", "red");
				data = list[index];
			}
			cnt = data.cnt;
	    }

		if(cnt>0){
			if( 1==g_room.tp ) dom.html("已讀");
			else dom.html("已讀"+cnt);
		} else {
			dom.html("");
		}

		while(data.ts==time && index>=0 ){
			index--;
			if(index>=0){
				//dom.css("background", "red");
				data = list[index];
			}
			cnt = data.cnt;
	    }
	}

    //scroll to bottom
	if( g_needsRolling ){
		g_needsRolling = false;
		scrollToBottom();
	} else if(g_isEndOfPage){
		scrollToBottom();
	}
}

function getFormatTimeTag ( date ){
	return date.customFormat( "#YYYY#/#M#/#D# #CD# #DDD#" );
}

function getFormatMsgTimeTag ( date ){
	return date.customFormat( "#hh#:#mm#" );
}

function showMsg (object, bIsFront){
	if( null == object ) return;

	g_msgs.push(object.ei);
	//cns.debug("list:",JSON.stringify(object,null,2));

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

		var lastTime = new Date( $("#chat-contents .lastMsg").data("time") );
		if( time.getTime() >= lastTime.getTime() ){
			$("#chat-contents .lastMsg").html("");
		}
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
		div = $("<div class='chat-msg-right'></div>");
		container.append(div);

		var table = $("<table></table>");
		table.append( $("<tr><td><div class='chat-cnt' data-t='"+time.getTime()+"'></div></td></tr>") );
		var tr = $("<tr></tr>");
		var td = $("<td></td>");
		td.append("<div></div>");	// class='chat-msg-load'
		td.append("<div class='chat-msg-time'>" + getFormatMsgTimeTag(time) + "</div>");
		tr.append(td);
		table.append(tr);

		div.append( table );

		msgDiv = $("<div></div>");
		div.append(msgDiv);
	} else{
		//left align
		var mem = getChatMem(object.meta.gu)

		div = $("<div class='chat-msg-left'></div>");
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
		var subDiv = $("<div class='group'></div>");
		subDiv.append("<div class='name'>"+ mem.nk +"</div>");	//name
		msgDiv = $("<div class='msg-content'></div>");
		subDiv.append(msgDiv);	//msg

		var table = $("<table></table>");
		table.append( $("<tr><td></td></tr>") );
		table.append( $("<tr><td><div class='chat-msg-time'>" + getFormatMsgTimeTag(time) + "</div></td></tr>") );
		subDiv.append( table );

		div.append(subDiv);	//right
	}
	g_msgsByTime[object.meta.ct] = div;


	// s( g_lastDate, time.customFormat( "#M#/#D# #hh#:#mm#" ), msgData.c);

	switch(msgData.tp){
		case 0: //text or other msg
			if(isMe){
				msgDiv.addClass('chat-msg-bubble-right');
			} else {
				msgDiv.addClass('chat-msg-bubble-left');
			}
			msgDiv.html( htmlFormat(msgData.c) );
			break;
		case 5:
			msgDiv.addClass("msg-sticker");
			if(isMe){
				msgDiv.addClass('right');
			} else {
				msgDiv.addClass('left');
			}
			var pic = $("<img>");
			var sticker_path = "sticker/" + msgData.c.split("_")[1] + "/" + msgData.c + ".png";
			pic.attr("src",sticker_path);
			msgDiv.append(pic);
			break;
		case 6:
			if(isMe){
				msgDiv.addClass('chat-msg-container-right');
			} else {
				msgDiv.addClass('chat-msg-container-left');
			}
			var pic = $("<img class='msg-img' style='width:150px;height:200px;'>");
			msgDiv.append(pic);
			getS3file(msgDiv, msgData.c, msgData.p, msgData.tp, g_ci, 120);
			break;
		case 8: //audio
			if(isMe){
				msgDiv.addClass('chat-msg-bubble-right');
			} else {
				msgDiv.addClass('chat-msg-bubble-left');
			}
			var this_audio = $(
				"<audio class='msg-audio' src='test' controls></audio>"
			);
			msgDiv.append( this_audio );
			getS3file(this_audio, msgData.c, msgData.p, msgData.tp, g_ci);
			break; 
		case 9: //map
			if(isMe){
				msgDiv.addClass('chat-msg-bubble-right');
			} else {
				msgDiv.addClass('chat-msg-bubble-left');
			}
			var mapDiv = $("<div class='msg-map'></div>");
			mapDiv.append("<div class='img'></div>" );
			mapDiv.append("<div class='text'>" + msgData.a + "</div>");
			// mapDiv.tinyMap({
			// 	 center: {x: msgData.lat, y: msgData.lng},
			// 	 panControl: 0,
			// 	 infoWindowAutoClose: 0,
			// 	 streetViewControl: 0,
			// 	 zoomControl: 1,
			// 	 mapTypeControl: 0,
			// 	 scaleControl: 0,
			// 	 scrollwheel: 0,
			// 	 zoom: 16,
			// 	 marker: [
	  //   	         {addr: [msgData.lat, msgData.lng], text: msgData.a}
			// 	 ]
			// });
			mapDiv.click(function(){
				var gallery = window.open("", "", "width=800, height=600");
				$(gallery.document).ready(function(){
						var body = $(gallery.document).find("body");
						body.css("background","black");
						body.css( "overflow", "hidden" );
						body.css( "padding", "0" );
						var this_slide = $("<div></div>");
						this_slide.css( "margin", "-8px" );
						this_slide.css("width","800px");
						this_slide.css("height","600px");
						body.append( this_slide );
					setTimeout(function(){
						this_slide.tinyMap({
							 center: {x: msgData.lat, y: msgData.lng},
							 // zoomControl: 0,
							 mapTypeControl: 0,
							 // scaleControl: 0,
							 scrollwheel: 0,
							 zoom: 16,
							 marker: [
				    	         {addr: [msgData.lat, msgData.lng], text: msgData.a}
							 ]
						});
					},300);
				});
			});
			msgDiv.append(mapDiv);
			break; 
		default: //text or other msg
			if(isMe){
				msgDiv.addClass('chat-msg-bubble-right');
			} else {
				msgDiv.addClass('chat-msg-bubble-left');
			}
			msgDiv.html( "&nbsp" );
			// msgDiv.html( msgData.tp+"<br/>"+msgData.c );
			break;
	}
}

function sendChat (){
	var inputDom = $("#footer .contents .input");
	// var text = inputDom.val();
	var text = inputDom[0].innerText;
	if (text.length<=0 ) return;

	var msg = text.replace(/<br>/g,"\n");
	// inputDom.val("").trigger('autosize.resize');
	inputDom[0].innerText = "";
	
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
			if(g_bIsPolling){
				updateChat();
			}
			g_needsRolling = true;
	    }
	);
}

sendSticker = function( id ){
	if (id.length<=0 ) return;
	
	op("/groups/"+g_gi+"/chats/"+g_ci+"/messages",
	    "POST",
	    JSON.stringify(
		    {
			meta:{
			  lv: 2,
			  tp: 3
			},
			ml:[
			    {tp: 5,
			    c: id
			  }
			]
		    }),
	    function(data, status, xhr) {
			if(g_bIsPolling){
				updateChat();
			}
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