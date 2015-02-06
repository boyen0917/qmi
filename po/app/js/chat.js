
var ui;		//user id
var g_room;		//chatRoom
var ci;		//chatRoom id
var g_cn;		//聊天室名字
var gi;		//group id
var g_group;	//group
var at;		//access token
var g_isEndOfPage = false;	//是否在頁面底端
var g_isEndOfPageTime = 0;
var g_lastScrollTime = 0;
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
var g_lineHeight = 21;
var pi;	//permission id for this chat room
var ti_chat;
var getHistoryMsgTimeout;
var isUpdatePermission = false;
var isGettingPermission = false;
var isShowUnreadAndReadTime = true;

/*
              ███████╗███████╗████████╗██╗   ██╗██████╗           
              ██╔════╝██╔════╝╚══██╔══╝██║   ██║██╔══██╗          
    █████╗    ███████╗█████╗     ██║   ██║   ██║██████╔╝    █████╗
    ╚════╝    ╚════██║██╔══╝     ██║   ██║   ██║██╔═══╝     ╚════╝
              ███████║███████╗   ██║   ╚██████╔╝██║               
              ╚══════╝╚══════╝   ╚═╝    ╚═════╝ ╚═╝               
                                                                  */
$(document).ready(function(){
	if( window.opener ){
		window.resizeTo( Math.min(450,$(window.opener).width()), window.opener.outerHeight );
	} else {
		window.resizeTo( 450, 800 );
	}
	
	// window.moveTo( window.opener.screenX+20, window.opener.screenY+20 );

	$.changePage("#page-chat");
	
	$(document).off("ajaxSend");

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

	gi = _loginData.gi;
	ui = _loginData.ui;
	at = _loginData.at;
	ci = _loginData.ci;
    var userData = $.lStorage( ui );
    if( !userData ){
    	document.location = "login.html";
    }

    // cns.debug( JSON.stringify(userData) );
    //所有團體列表
    g_group = userData[gi];
    if( null==g_group ) return;
    if( g_group.ad!=1 && true==g_group.isOfficial ){
    	$(".extra").hide();
    }
    isShowUnreadAndReadTime = true;
    if( g_group.set && null!=g_group.set.s8 ){
    	if( g_group.set.s8==1 || g_group.set.s8==3 ){
    		isShowUnreadAndReadTime = false;
    	}
    }
    g_room = g_group["chatAll"][ci];

    //get name
	if( null==g_room.uiName ){
		try{
			if( g_room.tp==1 ){
				var split = g_room.cn.split(",");
				var me = g_group.gu;
				for( var i=0; i<split.length; i++ ){
					if( split[i]!= me ){
						if( g_group.guAll.hasOwnProperty( split[i] ) ){
							var mem = g_group.guAll[ split[i] ];
							g_room.uiName = mem.nk;
							break;
						}
					}
				}
			} else {
				g_room.uiName = g_room.cn;
			}
			$.lStorage( ui, userData );

		} catch(e) {
			cns.debug( e.message );
		}
	}
	g_cn = g_room.uiName ? g_room.uiName : g_group.gn;

	//check member left
	checkMemberLeft();

	gu = g_group.gu;
    ti_chat = ci;

    getPermition();

	//load language
	updateLanguage( lang );

    //header 設定團體名稱
    $("#header .title .text").html( g_cn.replaceOriEmojiCode() );
    $("#header .subTitle").html( g_group.gn.replaceOriEmojiCode() );
    if( null==g_room.memCount ){
    	g_room.memCount = (g_room.memList) ? Object.keys(g_room.memList).length : 0;
    }
    if( g_room.memCount>2 ){
    	$("#header .count").show();
    	$("#header .count").html( "("+g_room.memCount+")" );
    } else {
    	$("#header .count").hide();
    }
    
	//- click "send" to send msg
	var sendBtn = $("#footer .contents .send");
	sendBtn.off("click");
	sendBtn.click( sendChat );
	var input = $("#footer .contents .input");
	// input.autosize({append: "\n"});
	input.off("keydown").off("keypress");
	// input.off("keydown").off("keypress");
	// input.keydown(function(e){
	//     if (e.keyCode == '8' || e.keyCode=='46'){	//backspace or delete
	//     	setTimeout(updateChatContentPosition,50);
	//     }
	// });

	input.keypress(function(e){
	    if (e.keyCode == '13' && !e.altKey){
			sendChat();
	    	// return false;
	    }
	});

	input.off("keydown").keydown( function(){
		setTimeout(updateChatContentPosition,50);
	});
	input.html("");

	$(document).find("title").text(g_cn + " - Qmi");

	$("#chat-toBottom").off("click");
	$("#chat-toBottom").click(scrollToBottom);

	$("#chat-toBottom").off("resize");
	$(window).resize(resizeContent);
	$(".input").data("h", $(".input").innerHeight());

	//other (img only now)
	$(".input-other").off("click").click(function(){
		$(".cp-file").trigger("click");
	});
	$(".cp-file").change(function(e) {
		var file_ori = $(this);
		if(file_ori[0].files.length>9){
			popupShowAdjust("",$.i18n.getString("COMMON_SEND_PHOTO_LIMIT",9) );
			return false;
		}

		var imageType = /image.*/;
		$.each(file_ori[0].files,function(i,file){

			if (file.type.match(imageType)) {
				var this_grid =  showUnsendMsg("", 6);
				
				//編號 方便刪除
				this_grid.data("file-num",i);
				this_grid.data("file",file);

				var reader = new FileReader();
				reader.onload = function(e) {
					var img = this_grid.find("div img");

					//調整長寬
					img.load(function() {
						var w = img.width();
			            var h = img.height();
        				mathAvatarPos(img,w,h,100);
			        });

			        img.attr("src",reader.result);
				}

				reader.readAsDataURL(file);
				sendImage(this_grid);
			}else{
				// this_grid.find("div").html('<span>file not supported</span>');
			}
		});

		//每次選擇完檔案 就reset input file
		file_ori.replaceWith( file_ori.val('').clone( true ) );
	});

	$(".input-emoji").off("click").click(function(){
		if( 0==g_extraSendOpenStatus ){
			g_extraSendOpenStatus = 2;
			$("#footer").animate({bottom:0},'fast');
			// $("#chat-contents").animate({marginBottom:200},'fast');
			updateChatContentPosition();
			$(this).addClass("active");
		} else if(2==g_extraSendOpenStatus){
			g_extraSendOpenStatus = 0;
			$("#footer").animate({bottom:-200},'fast');
			// $("#chat-contents").animate({marginBottom:0},'fast');
			updateChatContentPosition();
			$(this).removeClass("active");
		} else{
			g_extraSendOpenStatus = 2;
			$(this).addClass("active");
		}
		// cns.debug("emoji: ", g_extraSendOpenStatus);
	});
	resizeContent();

	$( window ).scroll( function(){
		if( !$("#page-chat").is(":visible") || $("#page-chat").hasClass("transition") ) return;

		var posi = $(window).scrollTop();
		if(  !g_bIsEndOfHistory && posi <= $("#chat-loading").height()*0.5 ){
			if( false==g_bIsLoadHistoryMsg ){
				getHistoryMsg( false );
			}
			g_isEndOfPage = false;
			return;
		}
		var height = $(window).height();
		var docHeight = $(document).height();
		var isAtBottom = ((posi + height+5) >= docHeight);
		if( g_isEndOfPage != isAtBottom ){
			g_isEndOfPage = isAtBottom;
			g_isEndOfPageTime = new Date().getTime();
			// cns.debug("!");
		}
	});

	// if( g_bIsPolling ){
		$("button.pollingCnt").off("click").click( updateChatCnt );
		$("button.pollingMsg").off("click").click( function(){
			for( var i=0; i<g_msgTmp.length; i++ ){
				var object = g_msgTmp[i];
				if( null!=object && g_msgs.indexOf(object.ei)<0 ){
					showMsg( object );
				}
			}
			sendMsgRead( g_currentDate.getTime() );
			if( isUpdatePermission ) getPermition(true);
		});
		updateChat();
	// }

	var enterTime = new Date();
	//set update contents
	// setInterval(function() {
	//     if( !g_bIsPolling ){
	// 	    updateChat();
	// 	    updateChatCnt();
	//     }
	// }, 1500);

	setInterval(function() {
	    checkPagePosition();
	}, 300);

	initStickerArea.init( $(".stickerArea"), sendSticker);

	//為了阻止網頁跳轉
	$(document).on("dragover","body",function(e){
		e.preventDefault();
	    e.stopPropagation();
	});

	$(document).on("drop","body",function(e){
		//為了阻止網頁跳轉
		e.preventDefault();
        e.stopPropagation();
        
        try{
        	$("#footer input")[0].files = e.originalEvent.dataTransfer.files;
        } catch(e){
        	cns.debug(e);
        }
	});

	//extra functions
	$(".screen-lock").off("click").click(function(){
		var tmp = $("#header .extra-content");
		if( "none"!=tmp.css("display") ){
			$("#header .extra").trigger("click");
		}
	});
	$("#header .extra").off("click").click(function(){
		var tmp = $("#header .extra-content");
		if( "none"==tmp.css("display") ){
			tmp.slideDown();
			$(".screen-lock").fadeIn();
		} else {
			tmp.slideUp();
			$(".screen-lock").fadeOut();
		}
	});
	$(".extra-content .btn:not(.disable)").off("click").click(function(){
		var btn = $(this);
		var type = btn.attr("data-type");
		switch( type ){
			case "exit":
				leaveChatRoom();
				break;
			case "edit": //edit mem
				delMember();
				break;
			case "invite":
				addMember();
				break;
			case "album":
				showAlbum();
				break;
		}
		$("#header .extra-content").hide();
		$(".screen-lock").hide();
	});

	$(document).on('mousedown','.chat-msg-bubble-left, .chat-msg-bubble-right',function(e){
	    $(this).addClass("active");
	});
	$(document).on('blur mouseleave','.chat-msg-bubble-left.active, .chat-msg-bubble-right.active',function(e){
	    $(this).removeClass("active");
	});

    $("#header .title .text, #header .title .count").click( function(){
    	var tmpData = [];
    	for( var gu in g_room.memList ){
    		tmpData.push( {gu:gu} );
    	}
  //   	$(this).data("object_str", tmpData );
		// $(this).data("object_opt", {
		// 	title: $.i18n.getString("COMMON_MEMBER"),
		// 	isShowGroup : false,
		// 	isShowSelf : false,
		// 	isShowAll : false,
		// 	isShowFav : true,
		// 	isSingleSelect : false
		// });

		$("#page-chat").addClass("transition");
		showMemListPage( $("#pagesContainer"), $.i18n.getString("COMMON_MEMBER"), [{title:"",ml:tmpData}], 
			function(){
				cns.debug("on page change done");
			},function( isDone ){
				scrollToBottom();
				setTimeout( function(){
					checkPagePosition();
					$("#page-chat").removeClass("transition");
				}, 500 );
				$("#page-select-object").remove();
				cns.debug("on back from memList");
		});
	});

	$(document).on("click",".chat-cnt", function(){
		showChatReadUnreadList( $(this) );
	});
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
	var staus = (0==g_extraSendOpenStatus);
	if( $(".input").data("h") != $(".input").innerHeight() 
		|| $(".input").data("staus")!=staus ){
		// cns.debug( $(".input").data("h"), $(".input").innerHeight() );
		$(".input").data("h", $(".input").innerHeight() );
		$(".input").data("staus", staus);
		var tmp = staus?200:0;
		var footerHeight = $("#footer").height();
		footerHeight -= tmp;
		$("#chat-contents").stop().animate({marginBottom:footerHeight-40}, 100);
		$("#chat-toBottom").animate({bottom: Math.max(0,footerHeight+10)}, 100 );
		// if( g_isEndOfPage ) scrollToBottom();
	}
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
	// timeTag.addClass( today.customFormat("_#YYYY#_#MM#_#DD#") );
	timeTag.data( "time", today.getTime() );
	timeTag.html( getFormatTimeTag(today) );
	today.setHours(0);
	today.setMinutes(0);
	today.setSeconds(0);
	var lastMsg = $("<div class='lastMsg'></div>");
	lastMsg.data("time", today.getTime() );
	lastMsg.append( timeTag );
	$("#chat-contents").append( lastMsg );
	$("#chat-contents").append( "<div class='tmpMsg'></div>" );
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
	        if( isUpdatePermission ) getPermition(true);
	    
			// sendMsgRead(g_currentDate.getTime());
			
			// if( g_bIsPolling )	updateChat();

	    	if(bIsScrollToTop){
	    		scrollToStart();
	    		g_bIsLoadHistoryMsg = false;
	    	} else {
	    		setTimeout( hideLoading, 1000);
	    	}
	    	updateChatCnt();
	    }

	    if( list.length<20 ){
	    	updateChat( g_lastDate.getTime() );
	    }
    },{
        index: "gi_ci_ct",
        keyRange: g_idb_chat_msgs.makeKeyRange({
	        upper: [gi, ci, g_lastDate.getTime()],
	        lower: [gi, ci]
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

	if( null==getHistoryMsgTimeout ){
		if( g_bIsLoadHistoryMsg ) {
			getHistoryMsgTimeout = setTimeout(function(){
				g_bIsLoadHistoryMsg = false;
				hideLoading();
				getHistoryMsgTimeout = null;
			}, 2000);
		}
	}
}

function hideLoading(){
	if( !$("#page-chat").is(":visible") || $("#page-chat").hasClass("transition") ) return;
	
	var loading = $("#container #chat-loading");
	// firstDom.css("background", "red");
	var tmp = loading.offset();
	if( tmp ){
		var offset = loading.offset().top+loading.height();
		$('html, body').scrollTop( offset );
	}
	g_bIsLoadHistoryMsg = false;
}

function op ( url, type, data, delegate, errorDelegate){
	$.ajax({
	    url: "https://apserver.mitake.com.tw/apiv1" + url,
	    type: type,
	    data: data,
	    dataType: "json",
	    headers: {
			ui: ui,
			at: at,
			li: "TW"
	    },
	    success: delegate,
	    error: function(jqXHR, textStatus, errorThrown) {
		  console.log(textStatus, errorThrown);
		  if( errorDelegate ) errorDelegate();
		}
	});
}

function scrollToStart (){
	$('html, body').stop(false, true).animate({scrollTop:50}, 'fast');
}

function scrollToBottom (){
	// cns.debug( "scrollToBottom", $(document).height()+50  );
	$('html, body').stop(false, true).animate({scrollTop:$(document).height()+50}, 'fast');
	g_isEndOfPage = true;
}

function checkPagePosition (){
	if( !$("#page-chat").is(":visible") || $("#page-chat").hasClass("transition") ) return;

	if( new Date().getTime() > (g_isEndOfPageTime+500) ){
		if( g_isEndOfPage ){
			var posi = $(window).scrollTop();

			var height = $(window).height();
			var docHeight = $(document).height();
			var isAtBottom = ((posi + height+5) >= docHeight);
			if( !isAtBottom )	scrollToBottom();

			$("#chat-toBottom").fadeOut('fast');
		} else{
			$("#chat-toBottom").fadeIn('fast');
		}
	}
	// if( g_isEndOfPage != isAtBottom ){
	// 	// if( !isAtBottom) cns.debug(height, docHeight, (posi + height), docHeight );
	// 	if(g_isEndOfPage) $("#chat-toBottom").fadeOut('fast');
	// 	else $("#chat-toBottom").fadeIn('fast');
	// }
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

function updateChat ( time ){
	var api = "/groups/"+gi+"/chats/"+ci+"/messages";
	if( time ){
		api+="?ct="+time;
	}
	op(api, "GET", "", function(data, status, xhr) {
			//檢查是否需要更新.
	   //  	if( false == g_bIsPolling ){
				// if( data.el.hasOwnProperty("0") ){
				// 	var object = data.el["0"];
				// 	if( g_lastMsgEi==object.ei ){
				// 		return;
				// 	} else {
				// 		g_lastMsgEi=object.ei;
				// 	}
				// }
	   //  	}

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
							gi: gi,
							ci: ci,
							ei: object.ei,
					        ct: object.meta.ct,
					        data: object
					    };
					    //write msg to db
					    try{
							g_idb_chat_msgs.put( node );
					    } catch(e){

					    }
						

						showMsg( object, false );
					}
				}
			}
			if( isUpdatePermission ) getPermition( true );

            //scroll to bottom
			if( g_needsRolling ){
				g_needsRolling = false;
				scrollToBottom();
			}

			if( typeof(time)=='undefined' ){
				sendMsgRead( g_currentDate.getTime() );
			} else {
				if( data.el.length==0 ){
					g_bIsEndOfHistory = true;
					$("#chat-loading").hide();
					$("#chat-nomore").show();
				}
				updateChatCnt();
			}
			
	    }	//end of function
	);	//end of op
}	//end of updateChat

function updateChatCnt (){
	var userData = $.lStorage(ui);
	// cns.debug( JSON.stringify(userData) );
    g_group = userData[gi];
    g_room = g_group["chatAll"][ci];


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
		if( dom.parents(".sys-msg").length>0 )	continue;
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
			if( 1==g_room.tp ) dom.html( $.i18n.getString("CHAT_READ") );
			else dom.html( $.i18n.getString("CHAT_N_READ", cnt) );
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
	}
}

function getFormatTimeTag ( date ){
	return date.customFormat( "#YYYY#/#M#/#D# #CD# #DDD#" );
}

function getFormatMsgTimeTag ( date ){
	return date.customFormat( "#hhh#:#mm#" );
}

function showMsg (object, bIsFront, bIsTmpSend){
	if( null == object ) return;

	g_msgs.push(object.ei);
	//cns.debug("list:",JSON.stringify(object,null,2));

	var time = new Date(object.meta.ct);
	var container = $("<div></div>");
	container.data("time", time);
	// cns.debug( bIsFront, time, object.notSend, object.ml[0].c );
	var szSearch = "#chat-contents ."+time.customFormat("_#YYYY#_#MM#_#DD#");
	var div = $( szSearch );

	if( div.length>0 && div.next().length>0 ){
		div = div.next();
	} else {
		var timeTag = $("<div class='chat-date-tag'></div>");
		timeTag.addClass(time.customFormat("_#YYYY#_#MM#_#DD#"));
		timeTag.html( getFormatTimeTag(time) );
		timeTag.data( "time", time.getTime() );

		var allTimeTag = $("#chat-contents .chat-date-tag");
		if( 1 < allTimeTag.length ){
			var bIsAdd = false;
			for( var i=0; i<allTimeTag.length-1; i++){
				cns.debug( $(allTimeTag[i]).data("time") );
				cns.debug( time.getTime() );

				if( $(allTimeTag[i]).data("time") > time.getTime() ){
					cns.debug("1", time);
					$(allTimeTag[i]).before(timeTag);
					bIsAdd = true;
					break;
				}
			}
			if(!bIsAdd){
				$("#chat-contents .lastMsg").before(timeTag);
					cns.debug("2", time);
			}
		} else{
			$("#chat-contents .lastMsg").before(timeTag);
					cns.debug("3", time);
		}
		// if(time.getTime()<g_lastDate){
		// 	$("#chat-contents .firstMsg").after(timeTag);
		// } else {
		// 	$("#chat-contents .lastMsg").before(timeTag);
		// }
		div = $("<div></div>");
		timeTag.after(div);

		var lastTime = new Date( $("#chat-contents .lastMsg").data("time") );
		if( time.getTime() >= lastTime.getTime() ){
			$("#chat-contents .lastMsg .chat-date-tag").css("display","none");
		}
	}

	if(time.getTime()<g_lastDate){
		g_lastDate = time;
	}
	if(time.getTime()>g_currentDate){
		g_currentDate = time;
	}

	var msgList = div.find(">div");
	if( msgList.length > 0 ){
		var bIsAdd = false;
		var i=0;
		
		for(; i<msgList.length; i++){
			if( time<=$(msgList[i]).data("time") ){
				//若已為開頭, 或上方時間小於this
				if( i==0 || time>=$(msgList[i-1]).data("time") ){
					$(msgList[i]).before(container);
					bIsAdd = true;
					break;
				}
			}
		}
		if(!bIsAdd){
			$(msgList[i-1]).after(container);
		}
	} else {
		div.append(container);
	}

	g_msgsByTime[object.meta.ct] = div;

	
	//msg
	var time = new Date(object.meta.ct);
	if( null==object.ml || object.ml.length<=0 ) return;
	var msgData = object.ml[0];
	var msgDiv;
	var isMe = ( object.meta.gu == g_group.gu );
	var unSend = object.hasOwnProperty("notSend");

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
		if( unSend ){
			container.data("data", object);
			var status = $("<div></div>");
			if( bIsTmpSend ) status.addClass('chat-msg-load');
			else  status.addClass('chat-msg-load-error');
			status.click(function(){
				if( $(this).hasClass("chat-msg-load-error") ){
					popupShowAdjust( "",$.i18n.getString("CHAT_FAIL_SENDING_MSG"),true, true, [sendInput,container] );
					$(".popup-confirm").html( $.i18n.getString("CHAT_RESEND") );
					$(".popup-cancel").html( $.i18n.getString("COMMON_DELETE") );
					$(".popup-cancel").off("click").click(function(){
						container.hide('slow',function(){
							container.remove();
						});
						$(".popup-screen").hide();
			    		$(".popup").hide();
					});
					$(".popup-screen").off("click").click(function(){
						$(".popup-screen").hide();
			    		$(".popup").hide();
					});
				}
			});
			td.append(status);
		} else {
			td.append("<div></div>");
		}
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
		subDiv.append("<div class='name'>"+ mem.nk.replaceOriEmojiCode() +"</div>");	//name
		msgDiv = $("<div class='msg-content'></div>");
		subDiv.append(msgDiv);	//msg

		var table = $("<table></table>");
		table.append( $("<tr><td></td></tr>") );
		table.append( $("<tr><td><div class='chat-msg-time'>" + getFormatMsgTimeTag(time) + "</div></td></tr>") );
		subDiv.append( table );

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
			getS3file(msgDiv, msgData.c, msgData.p, msgData.tp, ti_chat, 120);
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
			getS3file(this_audio, msgData.c, msgData.p, msgData.tp, ti_chat);
			break; 
		case 9: //map
			if(isMe){
				msgDiv.addClass('chat-msg-bubble-right');
			} else {
				msgDiv.addClass('chat-msg-bubble-left');
			}
			showMap(msgData, msgDiv);
			break; 
		case 22: //mem join/leave
			msgDiv.addClass('content');
			var textTmp = "";
			try{
				var memTmp = g_group.guAll[msgData.t];
				if(1==msgData.a){
					if( null==g_room.memList || g_room.memList.hasOwnProperty(memTmp.gu) ){
						isUpdatePermission = true;
					}
					textTmp = $.i18n.getString("CHAT_SOMEONE_LEAVE", memTmp.nk );
				} else {
					if( null==g_room.memList || !g_room.memList.hasOwnProperty(memTmp.gu) ){
						isUpdatePermission = true;
					}
					textTmp = $.i18n.getString("CHAT_SOMEONE_JOIN", memTmp.nk );
				}

			} catch(e){
				errorReport( e );
			}
			msgDiv.html( htmlFormat(textTmp) );
			if( isMe ) msgDiv.parent().removeClass("chat-msg-right").addClass("sys-msg");
			else{
				var newParent = msgDiv.parent().parent().parent();
				newParent.find(".chat-msg-left").remove();
				var child = msgDiv.parent().detach();
				child.addClass("sys-msg");
				child.find(".name").remove();
				child.append( child.find(".msg-content").detach() );
				newParent.append( child );
			}
			break;
		case 23: //voip
			if(isMe){
				msgDiv.parent().removeClass("chat-msg-right").addClass("sys-msg");
				msgDiv.html( "You've made a VOIP call." );
			} else {
				var newParent = msgDiv.parent().parent().parent();
				newParent.find(".chat-msg-left").remove();
				var child = msgDiv.parent().detach();
				child.addClass("sys-msg");
				child.find(".name").remove();
				child.append( child.find(".msg-content").detach() );
				newParent.append( child );

				msgDiv.html( "You've missed a VOIP call, download Qmi on phone to receive it." );
			}
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

	return container;
}

function showMap (msgData, container){
	var mapDiv = $("<div class='msg-map'></div>");
	mapDiv.append("<div class='img'></div>" );
	mapDiv.append("<div class='text'>" + msgData.a + "</div>");
	mapDiv.click(function(){
		var gallery = window.open("", "", "width=800, height=800");
		$(gallery.document).ready(function(){
				var body = $(gallery.document).find("body");
				body.css("background","black");
				body.css( "overflow", "hidden" );
				body.css( "padding", "0" );
				var this_slide = $("<div></div>");
				this_slide.css( "margin", "-8px" );
				this_slide.css("width","800px");
				this_slide.css("height","800px");
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
	container.append(mapDiv);
}

function showUnsendMsg (c,tp){
	var eiTmp = "{0}_{1}_{2}".format(randomHash(11),randomHash(11),randomHash(11) );
	var time = new Date().getTime();
	var newData = {
		ei:eiTmp,
		meta:{
			ct:time,
			gu:g_group.gu
		},
		ml:[
			{
				c:c,
				tp:tp
			}
		],
		notSend:true
	};
	var node = {
		gi: gi,
		ci: ci,
		ei: eiTmp,
	    ct: time,
	    data: newData
	};
	//write msg to db
	g_idb_chat_msgs.put( node );
	var dom = showMsg( newData );
	return dom;
}

function sendInput ( dom ){
	dom.find(".chat-msg-load-error").removeClass("chat-msg-load-error").addClass("chat-msg-load");
	var tmpData = dom.data("data");
	if( null == tmpData )	return;
	cns.debug("send", new Date(tmpData.meta.ct), new Date(tmpData.meta.ct) );
	var sendData = {
		meta:{
		  lv: 2,
		  tp: 3
		},
		ml:tmpData.ml
	};

	op("/groups/"+gi+"/chats/"+ci+"/messages",
	    "POST",
	    JSON.stringify(sendData),
		function(dd, status, xhr) {
			//delete old data
	    	g_idb_chat_msgs.remove(tmpData.ei);
			dom.remove();

			// cns.debug("recv", dd.ct, new Date(dd.ct));
			//add new data to db & show
			var newData = {
				ei:dd.ei,
				meta:{
					gu: g_group.gu,
					ct: dd.ct
				},
				ml:tmpData.ml
			};

			var node = {
				gi: gi,
				ci: ci,
				ei: dd.ei,
			    ct: dd.ct,
			    data: newData
			};
			g_idb_chat_msgs.put( node );
			
			showMsg(newData, false);

			// if( g_isEndOfPage ) scrollToBottom();
			scrollToBottom();

			if( parent && false==parent.closed ){
				var tmp = $(opener.document).find(".subpage-chatList .update");
				if( tmp && tmp.length > 0){
					tmp.attr("data-gi", gi);
					tmp.attr("data-ci", ci);
					tmp.trigger("click");
				}
			}
	    },
	    function(){
	    	dom.find(".chat-msg-load").removeClass("chat-msg-load").addClass("chat-msg-load-error");
			// if( g_isEndOfPage ) scrollToBottom();
			scrollToBottom();
	    }
	);
}

function sendImage( dom ){
	var file = dom.data("file");

	var tmpData = dom.data("data");
	if( ""!=tmpData.ml[0].c ){
		sendInput(dom);
	} else {
		var ori_arr = [1280,1280,0.9];
		var tmb_arr = [160,160,0.4];
		
		dom.find(".chat-msg-load-error").removeClass("chat-msg-load-error").addClass("chat-msg-load");

		uploadGroupImage(gi,file,ti_chat, 0, ori_arr,tmb_arr, pi, function(data){
			if( data ){
				//delete old data
			    g_idb_chat_msgs.remove(tmpData.ei);

			    tmpData.ml[0].c = data.fi;
			    tmpData.ml[0].p = pi;
				//add new data to db & show
				var newData = {
					ei:tmpData.ei,
					meta:{
						gu: g_group.gu,
						ct: tmpData.ct
					},
					ml:[
						{tp: tmpData.ml[0].tp,
			    		c: data.fi,
			    		p: pi
			  			}
					],
					notSend: true
				};

				var node = {
					gi: gi,
					ci: ci,
					ei: newData.ei,
				    ct: newData.ct,
				    data: newData
				};
				g_idb_chat_msgs.put( node );
				
				dom.data("data",tmpData);

				sendInput(dom);
			} else {
				dom.find(".chat-msg-load").removeClass("chat-msg-load").addClass("chat-msg-load-error");
				// if( g_isEndOfPage ) scrollToBottom();
			}
		});
	}
}

function sendChat (){
	var inputDom = $("#footer .contents .input");
	// var text = inputDom.val();
	var text = inputDom[0].innerText;
	inputDom.html("");
	if (text.length<=0 ) return;
	updateChatContentPosition();

	// updateChatContentPosition();

	var msg = text.replace(/<br>/g,"\n");
	// inputDom.val("").trigger('autosize.resize');
	
	var dom = showUnsendMsg(msg, 0);
	scrollToBottom();
	sendInput( dom );
}

sendSticker = function( id ){
	if (id.length<=0 ) return;
	
	var dom = showUnsendMsg(id, 5);
	sendInput( dom );
}

getS3file = function(target, file_c, file_p, tp, ti, size){
	if( !file_c || file_c.length==0 || null==file_p ){
		cns.debug("null file,", "file_c:", file_c
			, "file_p:", file_p, "tp:", tp, "ti:", ti, "size:", size);
		return;
	}
	//default
	size = size || 350;
	cns.debug("size:",size);
	var api_name = "groups/" + gi + "/files/" + file_c + "?pi=" + file_p +"&ti=" + ti;
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
						showGallery( null, null, [{s32:obj.s32}] );
					// 	var imgO = new Image();
					// 	var gallery_str = "<img src=" + obj.s32 + " />";
					// 	imgO.onload = function() {
					// 		var gallery = window.open("layout/chat_gallery.html", "", "width=" + (this.width+30) + ", height=" + (this.height+25));
					//     	$(gallery.document).ready(function(){
					// 			setTimeout(function(){
					// 				var this_slide = $(gallery.document).find(".pic");
					// 				this_slide.html( gallery_str );
					// 			},300);
					// 		});
					//     }
					// 	imgO.src = obj.s32;
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

function getPermition( isReget ){
	//若沒有聊天室權限, 重新取得
    if( true==isReget || !g_room.hasOwnProperty("memList") || !g_room.hasOwnProperty("pi") || g_room.pi.length<=0){
    	try{
        	isUpdatePermission = false;
        	if( isGettingPermission ) return;
        	isGettingPermission = true;
	    	//取得成員列表
	    	//GET /groups/{gi}/chats/{ci}/users
	    	op("/groups/"+gi+"/chats/"+ci+"/users", 
	    		"get", null, function(data, status, xhr){
			    	//取得權限
			    	var sendData = {
			    		ti:ti_chat,
			    		tu:{gul:data.ul}
			    	};
					var userData = $.lStorage( ui );
					g_room = userData[gi].chatAll[ci];
					g_room.memList = {};
					for( var i=0; i<data.ul.length; i++){
						g_room.memList[data.ul[i].gu] = data.ul[i];
					}
					g_room.memCount = data.ul.length;
					if( g_room.memCount>2 ){
				    	$("#header .count").show();
				    	$("#header .count").html( "("+g_room.memCount+")" );
				    } else {
				    	$("#header .count").hide();
				    }
					$.lStorage( ui, userData );

					checkMemberLeft();

			    	op("/groups/"+gi+"/permissions", "post", 
			    		JSON.stringify(sendData), function(pData, status, xhr){
        					isGettingPermission = false;
			    			cns.debug( JSON.stringify(pData) );

			    			pi = pData.pi;
			    			userData = $.lStorage( ui );
						    g_group = userData[gi];
						    g_room = g_group["chatAll"][ci];
						    g_room.pi = pi;
						    $.lStorage( ui, userData );
			    		}, 
			    		null
			    	);
		    	},
		    	null
	    	);
    	} catch(e){
    		cns.debug( "[!]"+e.message );
        	isGettingPermission = false;
    	}
    } else {
    	pi = g_room.pi;
    }
}

function sendMsgRead( msTime ){
	op("/groups/"+gi+"/chats/"+ci+"/messages_read"
	    ,"PUT",
	    JSON.stringify({lt:msTime}),
	    null
	);
}

function leaveChatRoom(){
	cns.debug("leaveChatRoom");

	popupShowAdjust( $.i18n.getString("CHAT_LEAVE"), 
		$.i18n.getString("CHAT_LEAVE_CONFIRM"), 
		$.i18n.getString("COMMON_OK"),
		$.i18n.getString("COMMON_CANCEL"), [function(){ //on ok
			editMemInRoomAPI( ci, "put", [{gu:g_group.gu}], function(){
				var userData = $.lStorage(ui);
				g_group = userData[gi];
				delete g_group.chatAll[ci];
				$.lStorage(ui, userData);
				$('.sm-small-area[data-sm-act="chat"]', window.opener.document).trigger("click");
				window.close();
			});
		}]
	);
}

function editMemInRoomAPI(ciTmp, method, list, callback){
	var sendData = {ul: list};
	op("/groups/"+gi+"/chats/"+ciTmp+"/users", method, 
		JSON.stringify(sendData), function(pData, status, xhr){
			cns.debug( status, JSON.stringify(pData) );
			if( callback ) callback(pData);
		}, 
		null
	);
}

function delMember(){
	cns.debug("delMember");

	try{
		var btn = $(".extra-content .btn[data-type='edit']");
		var tmpList = {};
		for( var gu in g_room.memList ){
			tmpList[gu] = g_group.guAll[gu].nk;
		}

		btn.data("exclude_str", JSON.stringify( [g_group.gu] ) );
		btn.data("object_str", JSON.stringify( tmpList ) );
		btn.data("object_opt", {
			isShowGroup : false,
			isShowSelf : false,
			isShowAll : false,
			isShowFav : false,
			isSingleSelect : false,
			min_count: 1
		});
		

		$("#page-chat").addClass("transition");
		showSelectMemPage( $("#pagesContainer"), btn, function(){
			}, function(isDone){
				if( isDone ){

					scrollToBottom();
					var memListString = btn.data("object_str");
					//on select done
					// send add mem to room api
					try{
						cns.debug( memListString );
						var memList = $.parseJSON( memListString );
						memList[g_group.gu] = g_group.guAll[g_group.gu].nk;
						var addList = [];
						var removeList = [];
						for( var guTmp in memList ){
							if( !g_room.memList.hasOwnProperty(guTmp) ){
								addList.push( {gu:guTmp} );
							}
						}
						for( var guTmp in g_room.memList ){
							if( !memList.hasOwnProperty(guTmp) ){
								removeList.push( {gu:guTmp} );
							}
						}
						var isSend = false;
						if( addList.length>0 ){
							editMemInRoomAPI( ci, "post", addList, function(data){
								if( isSend ){
									getPermition( true );
									updateChat();
								}
								isSend = true;
							});
						} else {
							isSend = true;
						}
						if( removeList.length>0 ){
							editMemInRoomAPI( ci, "put", removeList, function(data){
								if( isSend ){
									getPermition( true );
									updateChat();
								}
								isSend = true;
							});
						} else {
							isSend = true;
						}
					} catch(e){
						cns.debug("[!]"+e.message);
					}
				}
				scrollToBottom();
				setTimeout( function(){
					checkPagePosition();
					$("#page-chat").removeClass("transition");
				}, 500 );
				$("#page-select-object").remove();
			}
		);
	} catch(e){
		cns.debug(e.message);
	}
}

function addMember(){
	cns.debug("addMember");

	try{
		var btn = $(".extra-content .btn[data-type='invite']");
		
		var tmpList = [];
		for( var gu in g_room.memList ){
			tmpList.push( gu );
		}
		btn.data("exclude_str", JSON.stringify(tmpList) );
		btn.data("object_str", "" );
		btn.data("object_opt", {
			isShowGroup : false,
			isShowSelf : false,
			isShowAll : false,
			isShowFav : true,
			isSingleSelect : false,
			min_count: 1
		});

		$("#page-chat").addClass("transition");
		showSelectMemPage( $("#pagesContainer"), btn, function(){
				// $("#page-chat").removeClass("transition");
			}, function( isDone ){
				scrollToBottom();
				if(isDone){
					//on select done
					// send add mem to room api
					var memListString = btn.data("object_str");
					//單人聊天室的話變成創新聊天室流程
					if( g_room.tp==1 ){
						var list = $.parseJSON(memListString);
						for( var gu in g_room.memList ){
							list[gu] = g_group.guAll[gu].nk;
						}
						var parent = $(window.opener.document);
						parent.find(".chatList-add-done").attr("data-object_str",JSON.stringify(list) );
						parent.find(".chatList-add-done").trigger("click");
						return;
					}


					//多人直接加進來
					try{
						cns.debug( memListString );
						var memList = $.parseJSON( memListString );
						var newList = [];
						for( var guTmp in memList ){
							newList.push( {gu:guTmp} );
						}
						editMemInRoomAPI( ci, "post", newList, function(data){
							// if( data.status==200){
								getPermition( true );
								updateChat();
							// }
						});
					} catch(e){
						cns.debug(e.message);
					}
				}
				scrollToBottom();
				setTimeout( function(){
					checkPagePosition();
					$("#page-chat").removeClass("transition");
				}, 500 );
				$("#page-select-object").remove();
			}
		);
	} catch(e){
		errorReport(e);
	}
}

function showAlbum(){
	showAlbumPage( gi, ci, ci, g_cn);
}

function checkMemberLeft(){
	try{
		if( g_room.tp==1 && null!=g_room.memList ){
			for( var guTmp in g_room.memList ){
				if( guTmp!=g_group.gu ){
					if( g_group.guAll.hasOwnProperty( guTmp ) ){
						var mem = g_group.guAll[ guTmp ];
						if(mem.st==2){
							$("#footer").hide();
							$("#chat-leaveGroup").html(
								$.i18n.getString("CHAT_SOMEONE_LEAVE_GROUP",(mem.nk||"").replaceOriEmojiCode())
							).show();
							return;
						}
						break;
					}
				}
			}
		}
	} catch(e){
		errorReport(e);
	}

	$("#footer").show();
	$("#chat-leaveGroup").hide();
}

/*
              ██████╗ ███████╗ █████╗ ██████╗     ██╗     ██╗███████╗████████╗          
              ██╔══██╗██╔════╝██╔══██╗██╔══██╗    ██║     ██║██╔════╝╚══██╔══╝          
    █████╗    ██████╔╝█████╗  ███████║██║  ██║    ██║     ██║███████╗   ██║       █████╗
    ╚════╝    ██╔══██╗██╔══╝  ██╔══██║██║  ██║    ██║     ██║╚════██║   ██║       ╚════╝
              ██║  ██║███████╗██║  ██║██████╔╝    ███████╗██║███████║   ██║             
              ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═════╝     ╚══════╝╚═╝╚══════╝   ╚═╝             
                                                                                        
*/

getChatReadUnreadApi = function( this_gi, this_ci, this_rt, this_tp ){
    //GET /groups/{gi}/chats/{ci}/messages_read?rt=<timestamp>&tp=<read_type>
    //tp: Read type (1: 已讀, 2:未讀)
    //rt: Read Timestamp
    var api_name = "groups/" + this_gi + "/chats/" + this_ci + "/messages_read?rt=" + this_rt +"&tp=" + this_tp;
    var headers = {
             "ui":ui,
             "at":at, 
             "li":lang,
                 };
    var method = "get";
    return result = ajaxDo(api_name,headers,method,true);
}

showChatReadUnreadList = function( cntDom ){
	var chat = $("#page-chat");
	if( chat.hasClass("loadRead") ){
		return;
	}
	
	chat.addClass("transition").addClass("loadRead");
	$(".screen-lock").show();
	
	var onPageLoad = function(){
		chat.removeClass("loadRead");
		$(".screen-lock").hide();
	};
	var onDone = function( isDone ){
		// scrollToBottom();
		setTimeout( function(){
			checkPagePosition();
			$("#page-chat").removeClass("transition");
		}, 200 );
		$("#page-tab-object").remove();
		cns.debug("on back from showChatReadUnreadList");
	};

	var rt = cntDom.data("t");
    var dataReadyCnt = 0;
    var isPageReady = false;
    var list = [];
    var title = "";

    //get read
    list.push( {title:$.i18n.getString("FEED_READ"),ml:null} );
    getChatReadUnreadApi(gi,ci,rt, 1).complete(function(data){
        try{
            var parseData = $.parseJSON( data.responseText ).gul;
            if( false==isShowUnreadAndReadTime ){
                for( var i=0; i<parseData.length; i++ ){
                    delete parseData[i].rt;
                }
            }
            list[0].ml = parseData;
            dataReadyCnt++;
            if( isPageReady && dataReadyCnt>1){
                showObjectTabShow( gi, title, list, onPageLoad, onDone);
            }
        } catch(e) {
            errorReport(e);
            chat.removeClass("loadRead");
			$(".screen-lock").hide();
        }
    });

    //get unread
    if( isShowUnreadAndReadTime ){
        list.push( {title:$.i18n.getString("FEED_UNREAD"),ml:null} );


        getChatReadUnreadApi(gi,ci,rt, 2).complete(function(data){
            if(data.status != 200) return false;
            try{
                list[1].ml = $.parseJSON( data.responseText ).gul;

                dataReadyCnt++;
	            if( isPageReady && dataReadyCnt>1){
	                showObjectTabShow(gi, title, list, onPageLoad, onDone);
	            }
            } catch(e) {
                errorReport(e);
	            chat.removeClass("loadRead");
				$(".screen-lock").hide();
            }
        });
    } else {
        list.push( {title:$.i18n.getString("FEED_UNREAD"),clickable:false} );
        dataReadyCnt++;
        if( isPageReady && dataReadyCnt>1){
            showObjectTabShow(gi, title, list, onPageLoad, onDone);
        }
    }
    loadObjectTabPage( $("#pagesContainer"), function(){
    	isPageReady = true;
    	if(dataReadyCnt>1){
            showObjectTabShow(gi, title, list, null, onDone);
        }
    });
}