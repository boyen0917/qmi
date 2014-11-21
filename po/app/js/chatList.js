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
		showNewRoomPage();
	});

	//---- get chat list -----
	//clear old contect
	updateChatList();
}

function updateChatList( extraCallBack ){
	var userData = $.lStorage(ui);
	if( !userData )	return;
	var currentGroup = userData[gi];
	if( !currentGroup )	return;

	//取得聊天室列表
	var api_name = "groups/"+ gi +"/chats";

	var headers = {
	        ui:ui,
	        at:at, 
	        li:lang
	};
	var method = "get";
	var result = ajaxDo(api_name,headers,method,false);
	result.complete(function(data){
		if(data.status == 200){
			var epl = $.parseJSON(data.responseText);
			if(typeof epl != "undefined"){
				var tmp = {};

				//update chat list
				$.each(epl.cl,function(key,newRoom){
					var oriRoom = currentGroup["chatAll"][newRoom.ci];
					if( oriRoom ){
						for( var propertyKey in oriRoom ){
							if( !newRoom.hasOwnProperty(propertyKey) ){
								newRoom[propertyKey] = oriRoom[propertyKey];
							}
						}
					}
					tmp[newRoom.ci] = newRoom;
				});
				currentGroup["chatAll"] = tmp;

				// cns.debug( JSON.stringify(userData) );
		    	$.lStorage(ui, userData);
		    	showChatList();
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
	var groupData = data[gi];
	var chatList = groupData["chatAll"];
	var targetDiv = $(".subpage-chatList .rows");

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
							$.each(groupData.guAll, function(key,mem){
								if( split[i] == key ){
									chatRoomName = mem.nk;
									if( mem.auo ){
										imgSrc = mem.auo;
									}
									return false;
								}
							});
							break;
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

				setLastMsg( gi, room.ci, table );
				targetDiv.append(table);
			}
		});

		setTimeout(sortRoomList, sortRoomListTimeout);
		$.lStorage(ui, data);
	}


	$(".subpage-chatList-row td:nth-child(2)").off("click");
	$(".subpage-chatList-row td:nth-child(2)").on("click", function(){
		// console.debug( $(this).data("id") );
		openChatWindow( $(this).data("id") );
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
			updateChatList();
			toastShow( $.i18n.getString("CHAT_DELETE_CHATROOM_SUCC") );
		} else {
			//delete room fail
			toastShow( $.i18n.getString("CHAT_DELETE_CHATROOM_FAIL") );
		}
	});
}

function openChatWindow ( ci ){
	clearChatListCnt( gi, ci );
	if( windowList.hasOwnProperty(ci) && null != windowList[ci] && false==windowList[ci].closed ){
		windowList[ci].focus();
	} else {
		var data= new Object();
		data["gi"]=gi;
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
	setLastMsg( giTmp, ciTmp, table, isRoomOpen );
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

function setLastMsg( giTmp, ciTmp, table, isRoomOpen ){
	if( null==isRoomOpen ) isRoomOpen = false;
	// if( gi!=giTmp ) return;
	// if(!table) return;

	g_idb_chat_msgs.limit(function(list){
	    if( list.length>0 ){
	    	if( null!=list[0] ){
	        	var object = list[0].data;
	        	setLastMsgContent( ciTmp, table, object, isRoomOpen );
	    	}
	    }
	},{
	    index: "gi_ci_ct",
	    keyRange: g_idb_chat_msgs.makeKeyRange({
	        upper: [gi, ciTmp, new Date().getTime()],
	        lower: [gi, ciTmp]
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

function setLastMsgContent( ciTmp, table, data, isRoomOpen ){
	var userData = $.lStorage(ui);
	var groupData = userData[gi];
	var room = groupData.chatAll[ciTmp];
	var unreadCnt = room.unreadCnt;
	var text = "";
	var mem = groupData.guAll[data.meta.gu];
	if( null==mem ) return;
	var name = mem.nk;
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
		default:
			text = (data.ml[0].c&&data.ml[0].c.length>0)?data.ml[0].c:"";
			break;
	}

	if(table){
		table.data("time", data.meta.ct);
		var msgDom = table.find(".msg");
		var timeDom = table.find(".time");

		if(msgDom)	msgDom.html( text.replaceOriEmojiCode() );
		// cns.debug( new Date(data.meta.ct).toFormatString() );
		if(timeDom)	timeDom.html( new Date(data.meta.ct).toFormatString() );
		if( false ==isRoomOpen ){
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
	}
	
	// if( false == isRoomOpen ){
		try{
			cns.debug( groupData.gn.parseHtmlString()+" - "+mem.nk, text );
			riseNotification (null, groupData.gn.parseHtmlString()+" - "+mem.nk, text, function(){
				cns.debug(ciTmp); 
			});
		} catch(e) {
			cns.debug( e );
		}
	// }
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
	g_newChatMemList = [];
	$.mobile.changePage("#page-newChat");

	//init
	var container = $(".newChat-content");
	container.html("");
	$(".addMemList").html("");
	$(".newChat-checkbox-gray").removeClass("checked");

	//show data
	var currentGroup = $.lStorage(ui)[gi];
	g_memCount = 0;
	for( var guid in currentGroup.guAll ){
		if( guid== currentGroup.gu ) continue;

		var mem = currentGroup.guAll[guid];
		var memDiv = $("<div class='mem'></div>");
		memDiv.append("<div class='checkbox' data-memid='"+guid+"' data-memname='"+mem.nk+"' check='false'></div>");
		if(mem.auo){
			memDiv.append("<img src='"+mem.auo+"'>");
		} else {
			memDiv.append("<img src='images/common/others/empty_img_personal_l.png'>");
		}
		memDiv.append("<span>"+mem.nk.replaceOriEmojiCode()+"</span>");
		container.append(memDiv);
		g_memCount++;
	}

	//bind event
	$(".newChat-checkbox-gray").off("click");
	$(".newChat-checkbox-gray").click(function(){
	    if( $(this).hasClass("checked") ){
	    	$(this).removeClass("checked");
	    	toggleSelectAll(false);
	    } else {
	    	$(this).addClass("checked");
	    	toggleSelectAll(true);
	    }
	});


	$(".newChat-content .mem .checkbox").off("click");
	$(".newChat-content .mem .checkbox").click(function(){
		// cns.debug($(this).attr("check"));
	    if( "false"==$(this).attr("check") ){
	    	$(this).attr("check", "true");
	    	addMember( $(this).data("memid"), $(this).data("memname") );
	    } else {
	    	$(this).attr("check", "false");
	    	removeMember( $(this).data("memid") );
	    }
	});

	$(".newChat-nextStep").off("click");
	$(".newChat-nextStep").click( showNewRoomDetailPage );
}

function addMember( memId, memName ){
	if( g_newChatMemList.indexOf(memId)<0 ){
		g_newChatMemList.push(memId);
		var span = $("<span data-memid='"+memId+"'>"+memName.replaceOriEmojiCode()+"</span>");
		$(".newChat-list .addMemList").append(span);
		if( g_newChatMemList.length >= g_memCount ){
			$(".newChat-checkbox-gray").addClass("checked");
		}
	}
}

function removeMember( memId ){
	var index = g_newChatMemList.indexOf(memId);
	if( index>=0 ){
		g_newChatMemList.splice(index, 1);
		$(".newChat-list .addMemList span[data-memid='"+memId+"'").remove();
		
		if( g_newChatMemList.length < g_memCount ){
			$(".newChat-checkbox-gray").removeClass("checked");
		}
	}
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
					openChatWindow( room.ci );
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
			memDiv.append("<img src='"+mem.auo+"'>");
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

	var api_name = "/groups/"+gi+"/chats";

    var headers = {
        ui: ui,
        at: at,
        li: lang
    };
    var body = {
        cn: text,
        gul: arr
    };

    // cns.debug( JSON.stringify(body) );
    var method = "post";
    ajaxDo(api_name,headers,method,true,body).complete(function(data){
    	if(data.status == 200){
    		var result = $.parseJSON(data.responseText);
    		// cns.debug(result);
    		$.mobile.changePage("#page-group-main");
    		updateChatList( function(){
    			if(result.ci){

    				//還沒有聊過天的話server聊天室列表不會有這個聊天室
    				var userData = $.lStorage( ui );
				    g_group = userData[gi];
				    if( null==g_group["chatAll"][result.ci] ){
				    	g_group["chatAll"][result.ci] = {
				    		ci: result.ci,
				    	};
				    	if( isSingleChat ){
				    		var memGu = arr[0].gu;
				    		g_group["chatAll"][result.ci].tp = 1;
				    		g_group["chatAll"][result.ci].cn = me+","+memGu;
				    		var mem = g_group["guAll"][memGu];
				    		if( mem )	g_group["chatAll"][result.ci].uiName = mem.nk;
				    		else	g_group["chatAll"][result.ci].uiName = "";
				    		
				    	} else {
				    		g_group["chatAll"][result.ci].tp = 2;
				    		g_group["chatAll"][result.ci].cn = text;
				    		g_group["chatAll"][result.ci].uiName = text;
				    	}
				    	$.lStorage( ui, userData );
				    }

				    //打開聊天室
	    			setTimeout( function(){
	    				openChatWindow( result.ci );
	    			},300);
			    }
    		});
    		// //api上面寫這個可能是批次新增用的..?!
    		// for( var i in result.cl ){
    		// 	var ci = result.cl[i].ci;
    		// 	openChatWindow( ci );
    		// }
    	}
    });

}