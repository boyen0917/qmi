// $(function(){ 
// });

var windowList = new Object();
var sortRoomListTimeout = 700;

/**
@brief
	initial chat list page
	request chat list data & save to local storage
**/
initChatList = function(){

	//----- set title -------
	var currentGroup = $.lStorage(ui)[gi];
	// var parent = $("#page-group-main").find(".gm-header");
	// if( parent ){
		//set title & sub-title
		// var tmp = parent.find(".page-title");
		// if( tmp ){
		// 	tmp.html( $.i18n.getString("CHAT_TITLE") );
		// 	if( currentGroup )	tmp.next().html( currentGroup.gn );
		// }
		//set add icon
		// parent.find(".feed-compose").hide();
		// parent.find(".chatList-add").show();
	// }
	
	//set add member button
	$(".chatList-add").off("click");
	$(".chatList-add").on("click", function(){
		$(".chatList-add").data("object_str","");
		showNewRoomPage();
	});

	//---- get chat list -----
	//clear old contect
	updateChatList(gi);
}

function updateChatList( giTmp, extraCallBack ){
	var userData = $.lStorage(ui);
	if( !userData )	return;
	var currentGroup = userData[giTmp];
	if( !currentGroup )	return;

	//取得聊天室列表
	var api_name = "groups/"+ giTmp +"/chats";

	var headers = {
	        ui:ui,
	        at:at, 
	        li:lang
	};
	var method = "get";
	var result = ajaxDo(api_name,headers,method,false);
	result.complete(function(data){
		if(data.status == 200){
			try{
				var epl = $.parseJSON(data.responseText);
				if(typeof epl != "undefined"){
					//update chat list
					var tmp = {};
					if( !currentGroup.hasOwnProperty("chatAll") ){
						$.each(epl.cl,function(key,newRoom){
							tmp[newRoom.ci] = newRoom;
						});
						currentGroup.chatAll = tmp;
					} else {
						$.each(epl.cl,function(key,newRoom){
							if( currentGroup["chatAll"].hasOwnProperty(newRoom.ci) ){
								var oriRoom = currentGroup["chatAll"][newRoom.ci];
								for( var propertyKey in oriRoom ){
									if( !newRoom.hasOwnProperty(propertyKey) ){
										newRoom[propertyKey] = oriRoom[propertyKey];
									}
								}
							}
							tmp[newRoom.ci] = newRoom;
						});
						currentGroup.chatAll = tmp;
					}

					// cns.debug( JSON.stringify(userData) );
			    	$.lStorage(ui, userData);
			    	if( gi==giTmp ) showChatList();
			    }
			} catch (e){
				cns.debug(e.message);
			}
		}
		if(extraCallBack)	extraCallBack();
	});
}

/**
@brief
	show chat list data from local storage
**/
function showChatList(){
	$(".subpage-chatList .rows").html("");
	var data = $.lStorage(ui);
	if( null==data ) return;
	var groupData = data[gi];
	if( null==groupData ) return;
	var chatList = groupData.chatAll;
	if( null==chatList ) return;
	var targetDiv = $(".subpage-chatList .rows");

	if( Object.keys(chatList).length<=1 ){
		targetDiv.hide();
		$(".subpage-chatList .coachmake").show();
		return;
	}
	targetDiv.show();
	$(".subpage-chatList .coachmake").hide();

	if( targetDiv ){
		var tmp;
		$.each(chatList,function(key,room){
			//目前type0的全體聊天室無用
			if( "0"!=room.tp ){
				var chatRoomName="";
				var imgSrc="";
				if("1"==room.tp){
					imgSrc="images/common/others/empty_img_personal_l.png";
					//eg.cn="M00000DK0FS,M00000DJ00n"
					var split = room.cn.split(",");
					var me = groupData.gu;
					for( var i=0; i<split.length; i++ ){
						if( split[i]!= me ){
							if( groupData.guAll.hasOwnProperty( split[i] ) ){
								var mem = groupData.guAll[ split[i] ];
								chatRoomName = mem.nk;
								if( mem.auo ){
									imgSrc = mem.auo;
								}
								break;
							}
						}
					}
					
				} else {
					chatRoomName = room.cn;
					imgSrc="images/common/others/empty_img_mother_l.png";
				}

				room["uiName"]=chatRoomName;
				$(this).find(".cp-top-btn").attr("src","images/compose/compose_form_icon_check_none.png");
				var table = $("<table class='subpage-chatList-row' data-rid='"+room.ci+"' style='width:100%'></table>");
				$(table).data("time", 0);
				
				var row = $("<tr></tr>");
				table.append(row);
				var td = $("<td></td>");
				td.append("<img class='aut st-user-pic' src=" + imgSrc + "></img>");
				row.append(td);

				td = $("<td data-id='"+room.ci+"'></td>");
				td.append("<div class='name'>" + chatRoomName.replaceOriEmojiCode() + "</div>");
				var lastMsg = $("<div class='msg'></div>");
				td.append(lastMsg);
				row.append(td);

				td = $("<td align='right'></td>");
				var lastTime = $("<div class='time'></div>");
				td.append(lastTime);
				td.append("<div class='cnt'></div>");
				td.append("<div class='drag'></div>");
				row.append(td);

				setLastMsg( gi, room.ci, table, false );
				targetDiv.append(table);
			}
		});

		setTimeout(sortRoomList, sortRoomListTimeout);
		$.lStorage(ui, data);
	}


	$(".subpage-chatList-row td:nth-child(2)").off("click");
	$(".subpage-chatList-row td:nth-child(2)").on("click", function(){
		// console.debug( $(this).data("id") );
		openChatWindow( gi, $(this).data("id") );
	});

	$(".subpage-chatList-row .drag").off("click");
	$(".subpage-chatList-row .drag").on("click", function(){
		var memtd = $(this).parent().prev();
		var group_name = memtd.find(".name").html();
		popupShowAdjust(
			$.i18n.getString("CHAT_DELETE_CHATROOM"),
			$.i18n.getString("CHAT_CONFIRM_DELETE_CHATROOM", group_name),
			true,
			true,
			[deleteRoom,memtd]
		);
		// var table = $(this).parent().parent().parent();
		// table.css("width","110%");
		// table.animate({margin:"-10%"}, 'fast');
		// $(".subpage-chatList-row td:nth-child(4)")
		// $(this).show('fast');
		// $(this).animate({width:"20%"},'fast');
	});

	$(".update").off("click").click(function(){
		// console.debug( $(this).data("gi"), $(this).data("ci"));
		// console.debug( $(this).attr("data-gi"), $(this).attr("data-ci"));
		updateLastMsg( $(this).attr("data-gi"), $(this).attr("data-ci") );
	});
}

function deleteRoom ( deleteRow ){
	var ci = deleteRow.data("id");
	var api_name = "groups/"+ gi +"/chats/"+ci;

	var headers = {
	        ui:ui,
	        at:at, 
	        li:lang
	};
	var method = "delete";
	var result = ajaxDo(api_name,headers,method,false);
	result.complete(function(data){
		if(data.status == 200){
			//delete room succ
			updateChatList(gi);
			toastShow( $.i18n.getString("CHAT_DELETE_CHATROOM_SUCC") );
		} else {
			//delete room fail
			toastShow( $.i18n.getString("CHAT_DELETE_CHATROOM_FAIL") );
		}
	});
}

function openChatWindow ( giTmp, ci ){
	clearChatListCnt( giTmp, ci );
	if( windowList.hasOwnProperty(ci) && null != windowList[ci] && false==windowList[ci].closed ){
		windowList[ci].focus();
	} else {
		var data= new Object();
		data["gi"]=giTmp;
		data["ci"]=ci;
		data["ui"]=ui;
		data["at"]=at;
		//data["cn"]=$(this).data("name");
		$.lStorage( "_chatRoom", data );
		//document.location = "chat.html";
		windowList[ci] = window.open("chat.html", "_blank", "width=400, height=600");
	}
}

function updateLastMsg(giTmp, ciTmp, isRoomOpen ){
	var table = $(".subpage-chatList-row[data-rid='"+ciTmp+"']");
	setLastMsg( giTmp, ciTmp, table, true, isRoomOpen );
	setTimeout(sortRoomList, sortRoomListTimeout);
}
function clearChatListCnt( giTmp, ciTmp ){
	var userData = $.lStorage(ui);
	g_group = userData[giTmp];
	g_room = g_group["chatAll"][ciTmp];
	g_room.unreadCnt = 0;
	$.lStorage(ui, userData);
	$(".subpage-chatList-row[data-rid='"+ciTmp+"'] .cnt").html("");
}

function setLastMsg( giTmp, ciTmp, table, isShowAlert, isRoomOpen ){
	if( null==isRoomOpen ) isRoomOpen = false;
	// if( gi!=giTmp ) return;
	// if(!table) return;

	g_idb_chat_msgs.limit(function(list){
	    if( list.length>0 ){
	    	if( null!=list[0] ){
	        	var object = list[0].data;
	        	setLastMsgContent( giTmp, ciTmp, table, object, isShowAlert, isRoomOpen );
	    	}
	    }
	},{
	    index: "gi_ci_ct",
	    keyRange: g_idb_chat_msgs.makeKeyRange({
	        upper: [giTmp, ciTmp, new Date().getTime()],
	        lower: [giTmp, ciTmp]
	        // only:18
	    }),
	    limit: 1,
	    order: "DESC",
	    onEnd: function(result){
	        cns.debug("setLastMsg end:",result.ci + " " + result.ct);
	    },
	    onError: function(result){
	        cns.debug("[!] setLastMsg error:",result);
	    }
	});
}

function setLastMsgContent( giTmp, ciTmp, table, data, isShowAlert, isRoomOpen ){
	var userData = $.lStorage(ui);
	var groupData = userData[giTmp];
	if( null==groupData || null==groupData.chatAll ) return;
	if( !groupData.chatAll.hasOwnProperty(ciTmp) ) return;
	var room = groupData.chatAll[ciTmp];
	if( null==room ){
		cns.debug("null room, ci:", ciTmp);
		return;
	}

	/* ----- TODO ------ 
	 當團體還沒點過時guAll為空內容
	   ----- TODO ------ */
	if( !groupData.guAll.hasOwnProperty(data.meta.gu) ){
		getGroupData(giTmp,false).complete(function(data){
			if(data.status == 200){
                var groupData = $.parseJSON(data.responseText);
                setGroupAllUser( giTmp, groupData );



                //按照邏輯 取得群組名單之後 就來設定群組資訊
                setBranchList(giTmp, groupData, function(){
					if( isReady ){
						setLastMsgContentPart2( giTmp, ciTmp, table, data, isShowAlert, isRoomOpen, groupData, room);
					}
					isReady = true;
				});
				//update chatList
				updateChatList( giTmp, function(){
					if( isReady ){
						setLastMsgContentPart2( giTmp, ciTmp, table, data, isShowAlert, isRoomOpen, groupData, room);
					}
					isReady = true;
				});



			}
		}, null);

	} else {
		setLastMsgContentPart2( giTmp, ciTmp, table, data, isShowAlert, isRoomOpen, groupData, room);
	}
}

function setLastMsgContentPart2( giTmp, ciTmp, table, data, isShowAlert, isRoomOpen, groupData, room ){
	var unreadCnt = room.unreadCnt;
	var text = "";
	var mem = groupData.guAll[data.meta.gu];
	if( null==mem ) return;
	var name = mem.nk;
	if( null==data.ml || data.ml.length<=0 ) return;

	switch( data.ml[0].tp ){
		case 5: //sticker
			text = $.i18n.getString("CHAT_SOMEONE_SEND_STICKER", name);
			break; 
		case 6: //pic
			text = $.i18n.getString("CHAT_SOMEONE_SEND_PHOTO", name);
			break;
		case 8: //audio
			text = $.i18n.getString("CHAT_SOMEONE_SEND_VOICE", name);
			break; 
		case 9: //map
			text = $.i18n.getString("CHAT_SOMEONE_SEND_LOCATION", name);
			break;
		case 22: //sys
			var actMemName = "unknown";
			if( data.ml[0].t && groupData.guAll.hasOwnProperty(data.ml[0].t) ){
				var actMem = groupData.guAll[data.ml[0].t];
				if( actMem ) actMemName = actMem.nk;
			}
			if( null==mem ) return;
			if(1==data.ml[0].a){
				text = $.i18n.getString("CHAT_SOMEONE_LEAVE", actMemName );
			} else {
				text = $.i18n.getString("CHAT_SOMEONE_JOIN", actMemName );
			}
			break;
		//---------- TODO ------------
		// case 23: //sip?void
		// 	if(1==data.ml[0].a){
		// 		text = $.i18n.getString("CHAT_SOMEONE_LEAVE", name );
		// 	} else {
		// 		text = $.i18n.getString("CHAT_SOMEONE_JOIN", name );
		// 	}
		// 	break;
		//---------- TODO ------------
		default:
			try{
				text = (data.ml[0].c&&data.ml[0].c.length>0)?data.ml[0].c:"";
			} catch(e){
				cns.debug( e.message );
			}
			break;
	}

	if( gi==giTmp ){
		if(table.length>0){
			table.data("time", data.meta.ct);
			var msgDom = table.find(".msg");
			var timeDom = table.find(".time");

			if(msgDom)	msgDom.html( text.replaceOriEmojiCode() );
			// cns.debug( new Date(data.meta.ct).toFormatString() );
			if(timeDom)	timeDom.html( new Date(data.meta.ct).toFormatString() );
			if( false==isRoomOpen ){
				var cntDom = table.find(".cnt");
				if(cntDom){
					var cntText = "";
					if( unreadCnt>99 ){
						cntText = "99+"
					} else if(unreadCnt&&unreadCnt>0){
						cntText = unreadCnt;
					}
					cntDom.html(cntText);
				}
			}
		} else {
			$('.sm-small-area[data-sm-act="chat"]').trigger("click");
		}
	}
	
	if( groupData.gu!=mem.gu && isShowAlert ){
		try{
			cns.debug( groupData.gn.parseHtmlString()+" - "+mem.nk, text );
			riseNotification (null, mem.nk+" ("+groupData.gn.parseHtmlString()+" - "+room.cn.parseHtmlString()+")", text, function(){
				cns.debug(ciTmp);
				openChatWindow( giTmp, ciTmp );
			});
		} catch(e) {
			cns.debug( e.message );
		}
	}
}

function sortRoomList(){
	$('.subpage-chatList-row').each(function(){
		var ct = $(this).data("time");
		if( ct > 0 ){
			$(this).find(".time").html( new Date(ct).toFormatString() );
		}
	});

	$('.rows').each(function(){
	    var $this = $(this);
	    $this.append($this.find('.subpage-chatList-row').get().sort(function(a, b) {
	        return $(b).data('time') - $(a).data('time');
	    }));
	});
}
/*
              ███╗   ██╗███████╗██╗    ██╗     ██████╗██╗  ██╗ █████╗ ████████╗          
              ████╗  ██║██╔════╝██║    ██║    ██╔════╝██║  ██║██╔══██╗╚══██╔══╝          
    █████╗    ██╔██╗ ██║█████╗  ██║ █╗ ██║    ██║     ███████║███████║   ██║       █████╗
    ╚════╝    ██║╚██╗██║██╔══╝  ██║███╗██║    ██║     ██╔══██║██╔══██║   ██║       ╚════╝
              ██║ ╚████║███████╗╚███╔███╔╝    ╚██████╗██║  ██║██║  ██║   ██║             
              ╚═╝  ╚═══╝╚══════╝ ╚══╝╚══╝      ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝             
                                                                                         */

var g_newChatMemList;
var g_memCount;

function showNewRoomPage(){
	composeObjectShowDelegate( $(".chatList-add"), $(".chatList-add"), {
		isShowGroup : false,
        isShowSelf : false,
        isShowAll : true,
        isShowFav : true,
        isShowFavBranch : false
	}, function(){
		try{
			var data = $.parseJSON( $(".chatList-add").data("object_str") );
			var currentGroup = $.lStorage(ui)[gi];
			if( data.hasOwnProperty(currentGroup.gu) ){
				delete data[currentGroup.gu];
			}
			g_newChatMemList = Object.keys(data);
			showNewRoomDetailPage();
		} catch(e){
			cns.debug( "[!]showNewRoomPage", e.message );
		}
	});
}

function toggleSelectAll( bIsSelect ){
	if( "page-newChat" != $.mobile.activePage.attr('id') ) return;

	if( bIsSelect ){
	    $(".newChat-content .mem .checkbox").each( function(){
	    	$(this).attr("check", "true");
	    	addMember( $(this).data("memid"), $(this).data("memname") );
	    });
	} else {
	    $(".newChat-content .mem .checkbox").attr("check", "false");
	    $(".newChat-list .addMemList").html("");
	    g_newChatMemList=[];
	}
}

/*
              ██████╗ ███████╗████████╗ █████╗ ██╗██╗               
              ██╔══██╗██╔════╝╚══██╔══╝██╔══██╗██║██║               
    █████╗    ██║  ██║█████╗     ██║   ███████║██║██║         █████╗
    ╚════╝    ██║  ██║██╔══╝     ██║   ██╔══██║██║██║         ╚════╝
              ██████╔╝███████╗   ██║   ██║  ██║██║███████╗          
              ╚═════╝ ╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝╚══════╝          
                                                                    */

function showNewRoomDetailPage(){

	//no mem
	if( g_newChatMemList.length==0 ){
		alert( $.i18n.getString("CHAT_CHATROOM_NAME_EMPTY") );
		return;
	}

	//only 1 mem
	if( g_newChatMemList.length==1 ){
		var gu = g_newChatMemList[0];

		//is same room exist
		var currentGroup = $.lStorage(ui)[gi];
		for( var ci in currentGroup.chatAll ){
			var room = currentGroup.chatAll[ci];
			if(1==room.tp){
				//room exist
				if( room.cn.indexOf(gu)>=0 ){
					openChatWindow( gi, room.ci );
    				$.mobile.changePage("#page-group-main");
					return;
				}
			}
		}
		requestNewChatRoom();
		return;
	}

	$.mobile.changePage("#page-newChatDetail");

	//init
	var container = $(".newChatDetail-content");
	var input = $(".newChatDetail table .input");
	var count = $(".newChatDetail table .count");
	input.val("");
	count.html( "0/"+input.attr("maxlength") );
	container.html("");

	//load data
	var currentGroup = $.lStorage(ui)[gi];
	for( var i=0; i<g_newChatMemList.length; i++ ){
		var mem = currentGroup.guAll[ g_newChatMemList[i] ];
		var memDiv = $("<div class='mem'></div>");
		if(mem.auo){
			memDiv.append("<img class='namecard' src='"+mem.auo+"'>");
			memDiv.find("img").data("gu", g_newChatMemList[i]);
			memDiv.find("img").data("gi", gi);
		} else {
			memDiv.append("<img src='images/common/others/empty_img_personal_l.png'>");
		}
		memDiv.append("<span>"+mem.nk.replaceOriEmojiCode()+"</span>");
		container.append(memDiv);
	}

	//bind event
	var tmp = $.i18n.getString( input.data("textid") );
	input.attr("placeholder", tmp );
	input.off( "change" );
	input.keyup( function(){
		var text = $(this).val();
		count.html( (20-text.length)+"/"+$(this).attr("maxlength") );
	});

	$(".newChatDetail-nextStep").off( "click" );
	$(".newChatDetail-nextStep").click( requestNewChatRoom );
}


function requestNewChatRoom(){
	var text = $(".newChatDetail table .input").val();
	var arr = [];
	var data = $.lStorage(ui);
	var groupData = data[gi];
	var me = groupData.gu;
	for( var i=0; i<g_newChatMemList.length; i++ ){
		if( g_newChatMemList[i]!=me ){
			arr.push( {gu:g_newChatMemList[i]} );
		}
	}

	var isSingleChat = (arr.length == 1);
	// cns.debug( text );
	if( !isSingleChat && (!text || text.length==0) ){
		alert( $.i18n.getString("CHAT_CHATROOM_NAME_EMPTY") );
		return;
	}

	requestNewChatRoomApi( gi, text, arr, function(data){
    	$.mobile.changePage("#page-group-main");
    });

}

function requestNewChatRoomApi(giTmp, cnTmp, arr, callback){
	var api_name = "/groups/"+giTmp+"/chats";

    var headers = {
        ui: ui,
        at: at,
        li: lang
    };
    var body = {
        cn: cnTmp,
        gul: arr
    };

    // cns.debug( JSON.stringify(body) );
    var method = "post";
    ajaxDo(api_name,headers,method,true,body).complete( function(data){
    	if(data.status == 200){
    		var result = $.parseJSON(data.responseText);
    		// cns.debug(result);
    		updateChatList( giTmp, function(){
    			if(result.ci){
    				//還沒有聊過天的話server聊天室列表不會有這個聊天室
    				var userData = $.lStorage( ui );
				    g_group = userData[giTmp];
				    if( null==g_group["chatAll"][result.ci] ){
				    	g_group["chatAll"][result.ci] = {
				    		ci: result.ci,
				    	};
				    	if( isSingleChat ){
				    		var memGu = arr[0].gu;
				    		g_group["chatAll"][result.ci].tp = 1;
				    		g_group["chatAll"][result.ci].cn = me+","+memGu;
				    		var mem = g_group["guAll"][memGu];
				    		if( mem ) g_group["chatAll"][result.ci].uiName = mem.nk;
				    		else g_group["chatAll"][result.ci].uiName = "";
				    		
				    	} else {
				    		g_group["chatAll"][result.ci].tp = 2;
				    		g_group["chatAll"][result.ci].cn = text;
				    		g_group["chatAll"][result.ci].uiName = text;
				    	}
				    	$.lStorage( ui, userData );
				    }

				    //打開聊天室
	    			setTimeout( function(){
	    				openChatWindow( giTmp, result.ci );
	    			},300);
			    }
    			callback( result );
    		});
    		// //api上面寫這個可能是批次新增用的..?!
    		// for( var i in result.cl ){
    		// 	var ci = result.cl[i].ci;
    		// 	openChatWindow( ci );
    		// }
    	} else {
    		callback( null );
    	}
    })
}