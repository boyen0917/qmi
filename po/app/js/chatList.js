// $(function(){ 
// });
var groupChat;
var windowList = {};
var sortRoomListTimeout = 700;
var namecardCreateRoom = false;
$(document).ready(function(){
	//add new chat done, refresh list
	$(".chatList-add-done").on("click", function(){
		var this_dom = $(this);
		var giTmp = this_dom.attr("data-gi");
		var ciTmp = this_dom.attr("data-ci");
		if( gi == giTmp ){
			updateChatList(gi, function(){
				openChatWindow( giTmp, ciTmp );
			});
		} else {
			openChatWindow( giTmp, ciTmp );
		}
		// $(".chatList-add").data("object_str", $(this).attr("data-object_str") );
		// $(".chatList-add").data("favorite_str", $(this).attr("data-favorite_str") );
		// onShowNewRoomPageDone();
	});
	$(document).on("click",".newChatDetail-header",function(){
		var tmp = $(this).next();
		// if( false==tmp.is(":visible") ){
		// 	$(this).
		// }
		$(this).toggleClass("hide");
		tmp.slideToggle();
	});
});
/**
@brief
	initial chat list page
	request chat list data & save to local storage
**/
initChatList = function(){

	//----- set title -------
	var currentGroup = QmiGlobal.groups[gi];
	//set add member button
	$(".chatList-add").off("click");
	$(".chatList-add").on("click", function(){
		$(".chatList-add").data("object_str","");
		if(currentGroup.ntp === 2) $(".chatList-add").data("offical","add");
		showNewRoomPage();
	});
	
	//---- get chat list -----
	//clear old contect
	updateChatList(gi);
}

function getChatListApi(giTmp) {
	var deferred = $.Deferred();

	var currentGroup = QmiGlobal.groups[giTmp];

	new QmiAjax({
        apiName: "groups/"+ giTmp +"/chats",
    }).success(function(rspData) {
		var chatRoomListArr = (rspData || {cl: []}).cl;
		//update chat list
		var tmpChatAllObj = {};
		var isCheckOri = ( currentGroup.hasOwnProperty("chatAll") );
		var list = [];
		var putDefPoolArr = [];
		$.each(chatRoomListArr, function(key,newRoom){
			if(Object.keys(newRoom.cm || {}).length > 0) {
				var def = $.Deferred();
				var roomObj = {
					gi: giTmp,
					ci: newRoom.ci,
					ei: newRoom.cm.ei,
				    ct: newRoom.cm.meta.ct,
				    data: newRoom.cm
				};

				list.push(roomObj);
				putDefPoolArr.push(def)
				// db
				g_idb_chat_msgs.put(roomObj, def.resolve);
			}

			var chatAllChk = currentGroup.chatAll && currentGroup.chatAll.hasOwnProperty(newRoom.ci);
			if(chatAllChk){
				var oriRoom = currentGroup.chatAll[newRoom.ci];
				for( var propertyKey in oriRoom ){
					if( !newRoom.hasOwnProperty(propertyKey) )
						newRoom[propertyKey] = oriRoom[propertyKey];
				}
			}

			//init name
			if( null==newRoom.cn ){
				newRoom.cn = "";
				newRoom.nk = "";
			} else if("1"==newRoom.tp){
				try{
					var split = newRoom.cn.split(",");
					var me = currentGroup.gu;
					newRoom.memList = {};
					for( var i=0; i<split.length; i++ ){
						newRoom.memList[ split[i] ] = {gu:split[i]};
						if( split[i]!= me ){
							if( currentGroup.guAll.hasOwnProperty( split[i] ) ){
								var mem = currentGroup.guAll[ split[i] ];
								newRoom.nk = mem.nk;
								newRoom.other = split[i];
							}
						}
					}
				} catch(e){
					errorReport(e);
					newRoom.cn = "";
				}
			} else{
				newRoom.nk = newRoom.cn;
			}

			tmpChatAllObj[newRoom.ci] = newRoom;

			// 更新聊天室視窗資料;
			if (windowList.hasOwnProperty([newRoom.ci])
				&& typeof(windowList[newRoom.ci]) === "object") {
				windowList[newRoom.ci].g_room = newRoom;
			}
		});

		currentGroup.chatAll = tmpChatAllObj;

		$.when.apply($, putDefPoolArr).done(function() {
			deferred.resolve({isSuccess: true, roomArr: list});
		})
	}).error(function(errData) {
		deferred.reject({isSuccess: false, roomArr: []});
	});

	return deferred.promise();
}

function updateChatList( giTmp, extraCallBack ){
	if(!QmiGlobal.groups[giTmp]) return;

	//取得聊天室列表api
	getChatListApi(giTmp).done(function(rspObj) {
		if(gi !== giTmp && !namecardCreateRoom) return;

		var chatListDom = $(".subpage-chatList");
		chatListDom.find(".loading").hide();


		var groupData = QmiGlobal.groups[giTmp];
		if( null==groupData ) return;
		var chatList = groupData.chatAll;
		if( null==chatList ) return;
		var roomsCnt = 0;
		$.each(chatList, function(index, val) {
			if(val.st === undefined){
				roomsCnt = Object.keys(chatList).length;
				return false;
			}
			else if(val.st == 0){
				roomsCnt ++;
			}
		});

		if(rspObj.isSuccess && rspObj.roomArr.length > 0 && roomsCnt > 0) 
			showChatList();
		else if(rspObj.isSuccess && roomsCnt > 1) {
			showChatList();
		} else {
			chatListDom.find("rows").hide().end()
			.find(".coachmake").fadeIn();

			if($("#page-group-main").data("currentAct") === "chat"){
				$("#page-group-main .subpage-chatList").show();
			}
		}

		if(extraCallBack)	extraCallBack();
	})
}

/**
@brief
	show chat list data from local storage
**/
function showChatList(){
	var groupData = QmiGlobal.groups[gi];
	if( null==groupData ) return;
	var chatList = groupData.chatAll;
	if( null==chatList ) return;

	var deferredPoolArr = [],
		targetDiv = $(".subpage-chatList .rows");
		topChatListDiv = $(".top-chatList .list");
	
	targetDiv.html("");
	topChatListDiv.html("");
	targetDiv.show();
	$(".subpage-chatList .coachmake").hide();

	if( targetDiv ){
		var tmp;
		$.each(chatList,function(key,room){
				//目前type0的全體聊天室無用 st=1為廢棄聊天室 不顯示在列表
			if( "0"!=room.tp){

				//全部做完 再做sort
				var deferred = $.Deferred();
				deferredPoolArr.push(deferred);

				var chatRoomName=room.nk||"";
				var imgSrc="";
				if("1"==room.tp){
					imgSrc="images/common/others/empty_img_personal_l.png";
					//eg.cn="M00000DK0FS,M00000DJ00n"
					var guTmp = room.other;
					if( groupData.guAll.hasOwnProperty( guTmp ) ){
						var mem = groupData.guAll[ guTmp ];
						if( mem.auo ){
							imgSrc = mem.auo;
						}
					}
					
				} else {
					imgSrc= room.cat || "images/common/others/empty_img_mother_l.png";
				}

				room["uiName"]=chatRoomName;
				$(this).find(".cp-top-btn").attr("src","images/compose/compose_form_icon_check_none.png");
				var table = $("<div class='subpage-chatList-row polling-cnt-cl' data-rid='"+room.ci+"' style='width:100%' data-polling-cnt='B7' data-ci='"+room.ci+"'></div>");
				$(table).data("time", 0);
				
				var row = $("<div class='tr'></div>");
				table.append(row);
				var td = $("<div class='td'></div>");
				td.append("<img class='aut st-user-pic' src=" + imgSrc + "></img>");
				if("1"==room.tp){
					td.find("img").data("gi",gi).data("gu",guTmp).addClass("namecard");
				}
				row.append(td);

				td = $("<div class='td' data-id='"+room.ci+"'></div>");

				//官方帳號聊天室名字修改
				if(groupData.ntp === 2){
					if(groupData.ad == 1){
						if(room.tp == 1){
							var roomName = chatRoomName.replaceOriEmojiCode();
						}else if(room.tp == 2 && room["uiName"] == groupData.me || groupData.guAll[chatRoomName]=== undefined){
							var roomName = groupData.gn.replaceOriEmojiCode();
						}else{
							var roomName = groupData.guAll[chatRoomName].nk.replaceOriEmojiCode();
						}
					}
				}else{
					var roomName = chatRoomName.replaceOriEmojiCode();
				}

				if( room.hasOwnProperty("cpc") === true && room.cpc >= 2)
					roomName +=  " (" + room.cpc + ") ";


				td.append("<div class='name'>" + roomName + "</div>");

				var lastMsg = $("<div class='msg'></div>");
				td.append(lastMsg);
				row.append(td);

				td = $("<div class='td' align='right'></div>");
				var lastTime = $("<div class='time'></div>");
				td.append(lastTime);
				td.append("<div class='cnt sm-cl-count' data-gi='"+gi+"' data-ci='"+room.ci+"'></div>");
				td.append("<div class='drag'></div>");
				row.append(td);

				if (room.it) {
					topChatListDiv.append(table);
				} else {
					targetDiv.append(table);
				}

				//全部做完 再做sort
				setLastMsg( gi, room.ci, table, false ).done(deferred.resolve);
			}
		});
	
		$.when.apply($,deferredPoolArr).done(function(){
			if (topChatListDiv.find(".subpage-chatList-row").length) {
				$(".top-chatList").show();
			}
			// targetDiv.show();
			sortRoomList();

			var groupsClCnts = $.lStorage("_pollingData").cnts;
			if(groupsClCnts[gi].hasOwnProperty("cl")){
				groupsClCnts[gi].cl.forEach(function(obj){
					var tmpDiv = $(".sm-cl-count[data-ci=" + obj.ci + "]").hide();
					if(obj.B7 > 0){
						tmpDiv.html(countsFormat(obj.B7, tmpDiv)).show();
					}
				});
			}

			// 預防在別頁顯示聊天室列表畫面
			if ($("#page-group-main .sm-small-area.active").data("sm-act") == "chat") {
				$("#page-group-main .subpage-chatList").show();
			}
		})
	}

	$(".subpage-chatList-row .td:nth-child(2)").off("click");
	$(".subpage-chatList-row .td:nth-child(2)").on("click", function(){
		// cns.debug( $(this).data("id") );
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
		// cns.debug( $(this).data("gi"), $(this).data("ci"));
		// cns.debug( $(this).attr("data-gi"), $(this).attr("data-ci"));
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
			windowList[ci].close();
		} else {
			//delete room fail
			toastShow( $.i18n.getString("CHAT_DELETE_CHATROOM_FAIL") );
		}
	});
}

function openChatWindow ( giTmp, ci ){

	var chatListDiv = $(".subpage-chatList");
	var topListDom = $(".top-chatList");
	clearChatListCnt( giTmp, ci );
	if( windowList.hasOwnProperty(ci) && null != windowList[ci] && false==windowList[ci].closed ){
		// windowList[ci].focus();
	} else {
		var data= {
			gi: giTmp,
			ci: ci,
			ui: ui,
			at: at
		};

		QmiGlobal.windowListCiMap[gi] = QmiGlobal.windowListCiMap[gi] || [];
		QmiGlobal.windowListCiMap[gi].push(ci);

		$.lStorage( "_chatRoom", data );

		if($.lStorage("groupChat"))
			windowList[ci] = window.open("", ci , "width=400, height=600");
		else
			windowList[ci] = window.open("chat.html?v2.0.0.8", ci , "width=400, height=600");
		
		windowList[ci].chatAuthData = {
			gi: 		window.gi,
			auth: 		window.QmiGlobal.auth,
			groups: 	window.QmiGlobal.groups,
			companies: 	window.QmiGlobal.companies,
			companyGiMap: window.QmiGlobal.companyGiMap,
		};

		windowList[ci].mainPageObj = {
			//聊天室個人名片聊天
			createChat: function(thisGi,thisGu) {
				namecardCreateRoom = true;
				requestNewChatRoomApi( thisGi, "", [{gu:thisGu}]);
			},
			
			//聊天室個人名片切換至個人主頁
			userTimeline: function(thisGi,thisInfo) {
				$(".sm-group-area").removeClass("active").removeClass("enable");
				$(".sm-group-area[data-gi='"+thisGi+"']").addClass("active");
				timelineChangeGroup(thisGi).done(function() {
					personalHomePage(thisInfo);
				});
			}
		}

		windowList[ci].chatList = {
			roomAddTop : function (chatroomId) {
				var chatroomDom = chatListDiv.find("[data-rid='" + chatroomId +"']");
				topListDom.find(".list").append(chatroomDom);
				topListDom.show();
			},
			roomDeleteTop : function (chatroomId) {
				var unTopListDom = chatListDiv.find(".rows");
				var chatroomDom = topListDom.find("[data-rid='" + chatroomId +"']");
				chatroomDom.appendTo(unTopListDom);

				if (topListDom.find(".subpage-chatList-row").length == 0) {
					topListDom.hide();
				}
			},
			roomRename : function (chatroomId, newName) {
				var chatroomDom = chatListDiv.find("[data-rid='" + chatroomId +"']");
				var numberOfRoomMember = QmiGlobal.groups[gi].chatAll[chatroomId].cpc;
				chatroomDom.find(".name").html(newName + " (" + numberOfRoomMember + ")");
			},
			roomUpdatePhoto : function (chatroomId, newImgUrl) {
				var chatroomDom = chatListDiv.find("[data-rid='" + chatroomId +"']");
				chatroomDom.find("img").attr("src", newImgUrl);
			},

			roomUpdateNumberOfMember : function (chatroomId, number) {
				var chatroomDom = chatListDiv.find("[data-rid='" + chatroomId +"']");
				var roomName = QmiGlobal.groups[gi].chatAll[chatroomId].cn;
				chatroomDom.find(".name").html(roomName + " (" + number + ")");
			}
		}

		windowList[ci].openStickerShop = function () {
			$.fn.StickerStore();
			return;
		}

		//$.lStorage( "_chatAuthData", windowList[ci].chatAuthData );
		//$.lStorage( "_chatList", windowList[ci].chatList);
		//$.lStorage("groupci" , JSON.stringify(ci));

	}
	windowList[ci].focus();
}

function updateLastMsg(giTmp, ciTmp, isRoomOpen, eiTmp ){
	var 
	deferred = $.Deferred(),
	table = $(".subpage-chatList-row[data-rid='"+ciTmp+"']");

	setLastMsg( giTmp, ciTmp, table, true, isRoomOpen, eiTmp ).done(deferred.resolve);
	
	return deferred.promise();
}
function clearChatListCnt( giTmp, ciTmp ){
	var userData = QmiGlobal.groups;
	var groupTmp = userData[giTmp];
	if (!groupTmp.hasOwnProperty('chatAll')) {
		groupTmp['chatAll'] = {};
		groupTmp['chatAll'][ciTmp] = {};
	}
	var roomTmp = groupTmp["chatAll"][ciTmp];
	roomTmp.unreadCnt = 0;
	$(".subpage-chatList-row[data-rid='"+ciTmp+"'] .cnt").html("");
}

function setLastMsg( giTmp, ciTmp, table, isShowAlert, isRoomOpen, eiTmp ){
	var deferred = $.Deferred();
	var groupTmp = QmiGlobal.groups[giTmp] || {};

	if( null==isRoomOpen ) isRoomOpen = false;

	
	if( groupTmp.guAll && Object.keys(groupTmp.guAll).length != 0){

		getDBMsg(giTmp, ciTmp, table, isShowAlert, isRoomOpen, eiTmp ).done(deferred.resolve);
	} else {

		deferred.resolve();
	}

	return deferred.promise();
		
}

function getDBMsg( giTmp, ciTmp, table, isShowAlert, isRoomOpen, eiTmp ){
	var 
	deferred = $.Deferred(),
	groupData = QmiGlobal.groups[giTmp],
	index, key;

	if( eiTmp ){
		g_idb_chat_msgs.get(eiTmp, function(dataTmp){
			var object = dataTmp.data;
			try{
				if( groupData.gi != giTmp ){
					cns.debug("incoming chat msg is not currentGroup");
				}
				setLastMsgContent( giTmp, ciTmp, table, object, isShowAlert, isRoomOpen );
			    
			    deferred.resolve();

			} catch(e){
				errorReport(e);
			}
		});
	} else {
		index = "gi_ci_ct";
		key = new Date().getTime();

		g_idb_chat_msgs.limit(function(list){
			try{
				if( groupData.gi != giTmp ){
					cns.debug("incoming chat msg is not currentGroup");
				}
				// var roomTmp = groupData.chatAll[ciTmp];
			    if( list.length>0 ){
			    	if( null!=list[0] ){
			        	var object = list[0].data;
			        	setLastMsgContent( giTmp, ciTmp, table, object, isShowAlert, isRoomOpen );
			    	}
			    } else {
			    	// cns.debug( "[setLastMsg] no list 2", giTmp, ciTmp );
			    }
			} catch(e){
				errorReport(e);
			}

			deferred.resolve();

		},{
		    index: index,
		    keyRange: g_idb_chat_msgs.makeKeyRange({
		        upper: [giTmp, ciTmp, key],
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

	return deferred.promise();
}

function setLastMsgContent( giTmp, ciTmp, table, data, isShowAlert, isRoomOpen ){
	if( null==data || ""==data ){
		cns.debug("[setLastMsgContent] null data");
		return;
	}

	var userData = QmiGlobal.groups;
	var groupData = userData[giTmp];
	if( null==groupData ){
		cns.debug("[setLastMsgContent] no groupData");
		return;
	}
	var cnt;
	if( groupData.chatAll && groupData.chatAll.hasOwnProperty(ciTmp) ){
		var room = groupData.chatAll[ciTmp];
		cnt = room.unreadCnt||0;
		// return;
	}
	if( !groupData.guAll ) {
		cns.debug("[setLastMsgContent] no guAll data or ");
		return;
	}

	if ( !groupData.guAll.hasOwnProperty(data.meta.gu) ){
		cns.debug("[setLastMsgContent] "+data.meta.gu+ "does not exist");
		return;	
	}

	setLastMsgContentPart2( giTmp, ciTmp, table, data, isShowAlert, isRoomOpen, groupData, cnt);
}

function setLastMsgContentPart2( giTmp, ciTmp, table, data, isShowAlert, isRoomOpen, groupData, unreadCnt ){
	var 
	text = "",
	mem = groupData.guAll[data.meta.gu];

	if( null==mem ){
		cns.debug("[setLastMsgContentPart2] mem null");
		return;
	}
	var name = mem.nk;
	if( null==data.ml || data.ml.length<=0 ){
		// cns.debug("[setLastMsgContentPart2] data.ml null");
		return;
	}
	var isMe = (data.meta.gu==groupData.gu);
	if( isMe ){
		name = $.i18n.getString("COMMON_YOU");
	}

	switch( data.ml[0].tp ){
		case 5: //sticker
			text = $.i18n.getString("CHAT_SOMEONE_SEND_STICKER", name);
			break; 
		case 6: //pic
			text = $.i18n.getString("CHAT_SOMEONE_SEND_PHOTO", name);
			break;
		case 7: //video
			text = $.i18n.getString("CHAT_SOMEONE_SEND_VIDEO", name);
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
		case 23: //sip?void
			if(isMe){
				text = $.i18n.getString("CHAT_VOIP_MAKE_CALL" );
			} else {
				text = $.i18n.getString("CHAT_VOIP_GET_CALL", name );
			}
			break;
		case 26:
			text = $.i18n.getString("CHAT_SOMEONE_SEND_FILE", name);
			break;
		case 231: //群組通話
			if(isMe){
				text = $.i18n.getString("CHAT_GROUP_VOIP_MAKE_CALL" );
			} else {
				text = $.i18n.getString("CHAT_GROUP_VOIP_GET_CALL", name );
			}
			break;
		default:
			try{
				text = (data.ml[0].c&&data.ml[0].c.length>0)?data.ml[0].c:"";
			} catch(e){
				cns.debug( e.message );
			}
			break;
	}

	// 當前團體 更新聊天室列表頁面by trigger ; 更新個別聊天室的未讀badge
	if( gi==giTmp ){
		if(table.length>0){
			table.data("time", data.meta.ct);
			var msgDom = table.find(".msg");
			var timeDom = table.find(".time");

			if(msgDom)	msgDom.html( text._escape().replaceOriEmojiCode() );
			// cns.debug( new Date(data.meta.ct).toFormatString() );
			if(timeDom)	timeDom.html( new Date(data.meta.ct).toFormatString(false) );
			if( false==isRoomOpen ){
				var cntDom = table.find(".cnt");
				if(cntDom){
					var cntText = "";
					if( unreadCnt>99 ){
						cntText = "99+";
						cntDom.html(cntText).show();
					} else if(unreadCnt>0){
						cntText = unreadCnt;
						cntDom.html(cntText).show();
					} else {
						cntDom.hide();
					}
				}
			}
		} else if( $(".subpage-chatList").is(":visible") ){
			$('.sm-small-area[data-sm-act="chat"]').trigger("click");
		}
	}
	//判斷聊天訊息預覽開關
	if($.lStorage("_setnoti")==100 || set_notification == true){
        set_notification = true;
    } else if($.lStorage("_setnoti")==300 || set_notification == false){
        set_notification = false;
    }
	if( !isMe && isShowAlert && set_notification){
		try{
			cns.debug( groupData.gn.parseHtmlString()+" - "+mem.nk, text );
			var cnTmp = data.cn||"";
			if( data.meta.ct>=login_time){
				
				try {QmiGlobal.showNotification ({
					title: mem.nk+" ("+groupData.gn.parseHtmlString()+" - "+cnTmp.parseHtmlString()+")",
					text: text,
					gi: giTmp,
					ci: ciTmp,
					callback: function(){
						openChatWindow( giTmp, ciTmp );
					}});
				} catch(e) {
					console.log("123232", e);
					// 原始
					riseNotification (null, mem.nk+" ("+groupData.gn.parseHtmlString()+" - "+cnTmp.parseHtmlString()+")", text, function(){
						openChatWindow( giTmp, ciTmp );
					});
				}
			}
		} catch(e) {
			cns.debug( e.message );
		}
	}
}

function sortRoomList(){

	var chatListDom = $("#page-group-main");
	chatListDom.find('.subpage-chatList-row').each(function(){
		var ct = $(this).data("time");
		if( ct > 0 ){
			$(this).find(".time").html( new Date(ct).toFormatString() );
		}
	});

	chatListDom.find('.top-chatList .list').each(function(){
	    var $this = $(this);
	    var tmp = $this.find('.subpage-chatList-row').get().sort(function(a, b) {
	        return $(b).data('time') - $(a).data('time');
	    });
	    $this.append(tmp);
	});

	chatListDom.find('.subpage-chatList .rows').each(function(){
	    var $this = $(this);
	    var tmp = $this.find('.subpage-chatList-row').get().sort(function(a, b) {
	        return $(b).data('time') - $(a).data('time');
	    });
	    $this.append(tmp);
	});
}

function parseRoomName(groupData, room){
	try{
		if( room.tp==1 ){
			var split = room.cn.split(",");
			var me = groupData.gu;
			for( var i=0; i<split.length; i++ ){
				room.memList[ split[i] ] = {gu:split[i]};
				if( split[i]!= me ){
					if( groupData.guAll.hasOwnProperty( split[i] ) ){
						var mem = groupData.guAll[ split[i] ];
						return mem.nk || "";
					}
				}
			}
			return 
		}
		return room.cn || "";
	} catch(e){
		errorReport(e);
	}
	return "";
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
var g_newChatFavList;
var g_memCount;

function showNewRoomPage(){
	composeObjectShowDelegate( $(".chatList-add"), $(".chatList-add"), {
		isShowBranch : false,
        isShowSelf : false,
        isShowAll : false,
        isShowFav : true,
        isShowFavBranch : true,
        isBack: false
	}, onShowNewRoomPageDone);
}

function onShowNewRoomPageDone(){
	try{
		var data = $.parseJSON( $(".chatList-add").data("object_str") );
		var currentGroup = QmiGlobal.groups[gi];
		if( data.hasOwnProperty(currentGroup.gu) ){
			delete data[currentGroup.gu];
		}
		g_newChatMemList = Object.keys(data);

		data = $.parseJSON( $(".chatList-add").data("favorite_str") );
		if( null==data ) g_newChatFavList = [];
		else g_newChatFavList = Object.keys(data);

		showNewRoomDetailPage();
	} catch(e){
		cns.debug( "[!]showNewRoomPage", e.message );
		errorReport(e);
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
	if( g_newChatMemList.length==0 && g_newChatFavList.length==0 ){
		alert( $.i18n.getString("CHAT_CHATROOM_MEMBER_EMPTY") );
		return;
	}

	//only 1 mem
	if( g_newChatMemList.length==1 && g_newChatFavList.length==0 ){
		var gu = g_newChatMemList[0];
		//is same room exist
		var currentGroup = QmiGlobal.groups[gi];
		for( var ci in currentGroup.chatAll ){
			var room = currentGroup.chatAll[ci];
			if(1==room.tp){
				//room exist	st=0 沒廢棄聊天室
				if( room.cn.indexOf(gu)>=0 && room.st==0){
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
	var container = $(".newChatDetail-content.mem");
	var input = $(".newChatDetail table .input");
	var count = $(".newChatDetail table .count");
	input.val("");
	count.html( "0/"+input.attr("maxlength") );
	container.html("");

	//load data
	var currentGroup = QmiGlobal.groups[gi];
	for( var i=0; i<g_newChatMemList.length; i++ ){
		var mem = currentGroup.guAll[ g_newChatMemList[i] ];
		var memDiv = $("<div class='row mem'></div>");
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

	// favorite
	container = $(".newChatDetail-content.fav");
	container.html("");
	for( var i=0; i<g_newChatFavList.length; i++ ){
		var fav = currentGroup.fbl[ g_newChatFavList[i] ];
		var favDiv = $("<div class='row fav'></div>");
		favDiv.append("<img src='images/common/others/select_empty_all_photo.png'>");
		favDiv.append("<span>"+fav.fn.replaceOriEmojiCode()+"</span>");
		container.append(favDiv);
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
	var data = QmiGlobal.groups;
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

	requestNewChatRoomApi( gi, text, arr, g_newChatFavList, function(data){
    	$.mobile.changePage("#page-group-main");
    });

}

function requestNewChatRoomApi(giTmp, cnTmp, gul, fl, callback, isOpenRoom){
	if( null==isOpenRoom ) isOpenRoom = true;
	var api_name = "groups/"+giTmp+"/chats";

    var headers = {
        ui: ui,
        at: at,
        li: lang
    };
    var body = {
        cn: cnTmp
    };

    if( null!=gul ) body.gul = gul;
    if( null!=fl ) body.fl = fl;

    // cns.debug( JSON.stringify(body) );
    var method = "post";
    ajaxDo(api_name,headers,method,false,body).complete( function(data){
    	if(data.status == 200){
    		var result = $.parseJSON(data.responseText);
    		// cns.debug(result);
    		updateChatList( giTmp, function(){
    			namecardCreateRoom = false;
    			if(result.ci){
    				//還沒有聊過天的話server聊天室列表不會有這個聊天室
    				var userData = $.lStorage( ui );
				    var groupTmp = userData[giTmp];
				    if( null==groupTmp ) return;
					var me = groupTmp.gu;
				    if( null==groupTmp["chatAll"][result.ci] ){
				    	groupTmp["chatAll"][result.ci] = {
				    		ci: result.ci,
				    	};
				    	var isSingleChat = (gul.length == 1);
				    	if( isSingleChat ){
				    		var memGu = gul[0].gu;
				    		groupTmp["chatAll"][result.ci].tp = 1;
				    		groupTmp["chatAll"][result.ci].cn = me+","+memGu;
				    		var mem = groupTmp["guAll"][memGu];
				    		if( mem ) groupTmp["chatAll"][result.ci].uiName = mem.nk;
				    		else groupTmp["chatAll"][result.ci].uiName = "";
				    		
				    	} else {
				    		groupTmp["chatAll"][result.ci].tp = 2;
				    		groupTmp["chatAll"][result.ci].cn = text;
				    		groupTmp["chatAll"][result.ci].uiName = text;
				    	}
					    	$.lStorage( ui, userData );
				    }
				    //打開聊天室
				    if( isOpenRoom ){
		    			setTimeout( function(){
		    				openChatWindow( giTmp, result.ci );
		    			},300);
		    		}
			    }
    			if(callback) callback( result );
    		});
    		// //api上面寫這個可能是批次新增用的..?!
    		// for( var i in result.cl ){
    		// 	var ci = result.cl[i].ci;
    		// 	openChatWindow( ci );
    		// }
    	} else {
    		if(callback) callback( null );
    	}
    })
}
