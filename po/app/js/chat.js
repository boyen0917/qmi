var ui,		//user id
	g_room,	//chatRoom
	ci,		//chatRoom id
	g_cn,	//聊天室名字
	g_group,//group
	at,		//access token
	g_isEndOfPage = false,	//是否在頁面底端
	g_isEndOfPageTime = 0,	//捲動到底部過多久時間才會把卷到底的按鈕藏起來
	g_needsRolling = false,	//是否要卷到頁面最下方？
	g_msgs = [],			//目前已顯示的訊息ei array
	g_latestDate = new Date(0),		//最新訊息時間(Date)
	g_earliestDate = new Date(),	//最舊訊息時間(Date)
	g_isLoadHistoryMsgNow = false,	//是否正在撈舊訊息
	g_isEndOfHistory = false,	//是否已經沒有舊訊息
	g_extraInputStatus = 0,		//其他輸入目前狀態(0:關閉, 2:sticker)
	pi,		//舊的權限管理機制, 目前一律帶0, permission id for this chat room
	ti_chat,
	isUpdatePermission = false,		//目前權限改成用使用者列表控制//是否需要重新取得permission id
	isGettingPermissionNow = false,	//是否正在取得權限
	isShowUnreadAndReadTime = true,	//部分團體不顯示已未讀時間
	window_focus = true,			//目前視窗是否focus中(node webkit only)
	g_isReadPending = false,		//視窗focus時是否需要送已讀
	g_tu,	//target user list, 帶給server用來做神奇的s3權限管理
	g_isFirstTimeLoading = true,	//是否第一次進聊天室	
	g_currentScrollToDom = null,	//捲動到最上方時會讀取舊訊息, 但視窗應停留在讀取前最後一筆訊息的dom, 用此變數暫存
	lockCurrentFocusInterval,		//讓視窗停留在最後一筆的interval
	lockCurrentFocusIntervalLength = 100;	//讓視窗停留在最後一筆的interval更新時間



$(function(){
	//load language
	updateLanguage(lang);

	//驗證失敗 請重新登入
	if(window.chatAuthData === undefined || window.chatAuthData.auth === undefined) {
		
		myWait(function(){
			return $.i18n.dict;	
		},null).done(function(){
			new QmiGlobal.popup({
				desc: $.i18n.getString("LOGIN_AUTO_LOGIN_FAIL"),
				confirm: true,
				action: [function(){
					if(window.opener === null) 
						reLogin();
					else
						window.close();
				}]
			});
		})

		return;
	}

	// 接收 主畫面的auth
	QmiGlobal.auth = window.chatAuthData.auth;
	QmiGlobal.groups = window.chatAuthData.groups;
	QmiGlobal.clouds = window.chatAuthData.clouds;
	QmiGlobal.cloudGiMap = window.chatAuthData.cloudGiMap;


	/**
	              ███████╗███████╗████████╗██╗   ██╗██████╗           
	              ██╔════╝██╔════╝╚══██╔══╝██║   ██║██╔══██╗          
	    █████╗    ███████╗█████╗     ██║   ██║   ██║██████╔╝    █████╗
	    ╚════╝    ╚════██║██╔══╝     ██║   ██║   ██║██╔═══╝     ╚════╝
	              ███████║███████╗   ██║   ╚██████╔╝██║               
	              ╚══════╝╚══════╝   ╚═╝    ╚═════╝ ╚═╝               
	                                                                  
	 */




	// 聊天室token 處理 暫時
	// QmiGlobal = window.opener.QmiGlobal;


	$(document).ready(function () {
		var winCloseDeferred = $.Deferred();

		//都ok的話 就不關嗎？
		winCloseDeferred.done(function(chk){
			if(chk === false) return;

			popupShowAdjust("", $.i18n.getString("LOGIN_AUTO_LOGIN_FAIL", 9),true,false,[function(){
				window.close();
			}]);
		});
		

		//resize chat window to slim window
		try {
			//resize node webkit window
			var gui = require('nw.gui');
			var win = gui.Window.get();
			win.width = 450;
			if( window.opener ){
				win.height = Math.min(800, window.opener.outerHeight);
			}
		} catch (e) {
			//resize explore window
			cns.debug("not node-webkit");
			if (window.opener) {
				window.resizeTo(Math.min(450, $(window.opener).width()), window.opener.outerHeight);
			} else {
				window.resizeTo(450, 800);
			}
		}

		// window.moveTo( window.opener.screenX+20, window.opener.screenY+20 );

		//set to chat page 必須
		$.changePage("#page-chat");

		//reset events
		$(document).off("ajaxSend");

		//沒有登入資訊 就導回登入頁面
		if (!$.lStorage("_chatRoom")) {
			//document.location = "login.html";
			//show warning & close window
			myWait(function(){
				return $.i18n.dict;	
			},null).done(function(){
				winCloseDeferred.resolve(true);
			})
		}

		var _loginData = $.lStorage("_chatRoom");

		gi = _loginData.gi;
		ui = _loginData.ui;
		at = _loginData.at;
		ci = _loginData.ci;

		var page = $("#page-chat");
		page.attr("data-gi", gi);
		page.attr("data-ci", ci);

		var userData = $.userStorage() || {};

		// cns.debug( JSON.stringify(userData) );
		//所有團體列表
		g_group = userData[gi];
		if (null == g_group) {
			winCloseDeferred.resolve(true);
			return;
		}

		if (g_group.ad != 1 && true == g_group.isOfficial) {
			$(".extra").hide();
		}
		isShowUnreadAndReadTime = true;
		if (g_group.set && null != g_group.set.s8) {
			if (g_group.set.s8 == 1 || g_group.set.s8 == 3) {
				isShowUnreadAndReadTime = false;
			}
		}
		g_room = g_group["chatAll"][ci];

		initChatDB(onChatDBInit);
		initChatCntDB();

		//get name 聊天室名稱
		if (null == g_room.uiName) {
			try {
				if (g_room.tp == 1) {
					var split = g_room.cn.split(",");
					var me = g_group.gu;
					for (var i = 0; i < split.length; i++) {
						if (split[i] != me) {
							if (g_group.guAll.hasOwnProperty(split[i])) {
								var mem = g_group.guAll[split[i]];
								g_room.uiName = mem.nk;
								break;
							}
						}
					}
				} else {
					g_room.uiName = g_room.cn;
				}
				$.userStorage(userData);

			} catch (e) {
				cns.debug(e.message);
			}
		}

		g_cn = g_room.uiName ? g_room.uiName : g_group.gn;

		//check member left
		checkMemberLeft();

		gu = g_group.gu;
		ti_chat = ci;

		getPermition();

		//header 設定團體名稱
		$("#header .title .text").html(g_cn.replaceOriEmojiCode());
		$("#header .subTitle").html(g_group.gn.replaceOriEmojiCode());

		var tmpMemCount = (g_room.memList) ? Object.keys(g_room.memList).length : 0;
		if (tmpMemCount != g_room.memCount) {
			cns.debug("mem count not fit, updated.");
			g_room.memCount = tmpMemCount;
			$.userStorage(userData);
		}

		if (g_room.memCount > 2) {
			$("#header .count").show();
			$("#header .count").html("(" + g_room.memCount + ")");
		} else {
			$("#header .count").hide();
			$(".extra-content .btn[data-type=edit]").hide();
			$(".extra-content .btn[data-type=exit]").hide();
		}

		//- click "send" to send msg
		var sendBtn = $("#footer .contents .send");
		sendBtn.off("click");
		sendBtn.click(onClickSendChat);
		var input = $("#footer .contents .input");
		// input.autosize({append: "\n"});
		input.off("keydown").off("keypress");
		// input.off("keydown").off("keypress");
		// input.keydown(function(e){
		//     if (e.keyCode == '8' || e.keyCode=='46'){	//backspace or delete
		//     	setTimeout(updateChatContentPosition,50);
		//     }
		// });

		//press enter to send text
		input.keypress(function (e) {
			if (e.keyCode == '13' && !e.shiftKey) {
				// 讓 enter 不會換行
				e.preventDefault();
				onClickSendChat();
			}
		});

		//adjust typing area height
		input.off("keydown").keydown(function (e) {
			setTimeout(updateChatContentPosition, 50);
		});

		$(".input").data("h", $(".input").innerHeight());

		//set window title
		$(document).find("title").text(g_cn + " - Qmi");

		//scroll to bottom when click the to-bottom button
		$("#chat-toBottom").off("click");
		$("#chat-toBottom").click(scrollToBottom);

		$("#chat-toBottom").off("resize");
		// $(window).resize(resizeContent);

		//file input event
		$(".input-other").off("click").click(function () {
			$(".cp-file").trigger("click");
		});
		$(".cp-file").change(function (e) {
			var file_ori = $(this);
			if (file_ori[0].files.length > 9) {
				popupShowAdjust("", $.i18n.getString("COMMON_SEND_PHOTO_LIMIT", 9));
				return false;
			}

			var imageType = /image.*/;
			var videoType = /video.mp4/;
			$.each(file_ori[0].files, function (i, file) {

				if (file.type.match(imageType)) {
					var this_grid = showUnsendMsg("", 6);
					scrollToBottom();

					//編號 方便刪除
					this_grid.data("file-num", i);
					this_grid.data("file", file);

					var reader = new FileReader();
					reader.onload = function (e) {
						var img = this_grid.find("div img");

						//調整長寬
						img.load(function () {
							var w = img.width();
							var h = img.height();
							mathAvatarPos(img, w, h, 100);
						});

						img.attr("src", reader.result);
					}

					reader.readAsDataURL(file);
					sendMsgImage(this_grid);
				} else if (file.type.match(videoType)) {
					var this_grid = showUnsendMsg("", 7);
					scrollToBottom();

					//編號 方便刪除
					this_grid.data("file-num", i);
					this_grid.data("file", file);

					renderVideoFile(file, this_grid.find("div video"), function (videoTag) {
						var parent = videoTag.parents(".msg-video");
						parent.addClass("loaded");
						parent.find(".length").html(secondsToTime(videoTag[0].duration));
						parent.find(".download").remove();
						sendMsgVideo(this_grid);
					}, function (videoTag) {
						var parent = videoTag.parents(".msg-video");
						parent.addClass("error");
						parent.find(".download").remove();
					});
				} else {
					// this_grid.find("div").html('<span>file not supported</span>');
					popupShowAdjust("",
						$.i18n.getString("COMMON_NOT_MP4_NOR_IMAGE"),
						$.i18n.getString("COMMON_OK")
					);
				}
			});

			//每次選擇完檔案 就reset input file
			file_ori.replaceWith(file_ori.val('').clone(true));
		});

		//emoji input event
		$(".input-emoji").off("click").click(function () {
			if (0 == g_extraInputStatus) {
				g_extraInputStatus = 2;
				$("#footer").animate({bottom: 0}, 'fast');
				// $("#chat-contents").animate({marginBottom:200},'fast');
				updateChatContentPosition();
				$(this).addClass("active");
			} else if (2 == g_extraInputStatus) {
				g_extraInputStatus = 0;
				$("#footer").animate({bottom: -205}, 'fast');
				// $("#chat-contents").animate({marginBottom:0},'fast');
				updateChatContentPosition();
				$(this).removeClass("active");
			} else {
				g_extraInputStatus = 2;
				$(this).addClass("active");
			}
			// cns.debug("emoji: ", g_extraInputStatus);
		});
		// resizeContent();

		//load msg when scroll to top
		g_container = $("#container");
		// g_container.on("mousewheel", onScrollContainer);
		g_container.scroll(onScrollContainer);
		$("html, body").scroll(onScrollBody);

		//pseudo button to receive polling data
		$("button.pollingCnt").off("click").click(showChatCnt);
		$("button.pollingMsg").off("click").click(function () {
			updateChat(g_room.lastCt, true);
		});

		var enterTime = new Date();

		//check if showing scroll-to-bottom button or not
		setInterval(function () {
			checkPagePosition();
		}, 300);

		//init sticker area
		initStickerArea.init($(".stickerArea"), sendSticker);

		//sticker change sync events
		$("#send-sync-sticker-signal").off("click").click(function () {
			cns.debug("sending sync sticker signal");
			if (window.opener) {
				var dom = $(window.opener.document).find("#recv-sync-sticker-signal");
				cns.debug(ci);
				dom.attr("data-ci", ci);
				var sid = $(this).attr("data-sid");
				if(sid) dom.attr("data-sid", sid);
				dom.click();
			}

		});
		$("#recv-sync-sticker-signal").off("click").click(function () {
			cns.debug("update sticker");
			initStickerArea.syncSticker( $(this).attr("data-sid") );
			$(this).removeAttr("data-sid");
		});

		//檔案上傳
		//為了阻止網頁跳轉
		$(document).on("dragover", "body", function (e) {
			e.preventDefault();
			e.stopPropagation();
		});
		$(document).on("drop", "body", function (e) {
			//為了阻止網頁跳轉
			e.preventDefault();
			e.stopPropagation();

			try {
				$("#footer input")[0].files = e.originalEvent.dataTransfer.files;
			} catch (e) {
				cns.debug(e);
			}
		});

		//extra functions
		$(".screen-lock").off("click").click(function () {
			var tmp = $("#header .extra-content");
			if ("none" != tmp.css("display")) {
				$("#header .extra").trigger("click");
			}
		});
		$("#header .extra").off("click").click(function () {
			var tmp = $("#header .extra-content");
			if ("none" == tmp.css("display")) {
				tmp.slideDown();
				$(".screen-lock").fadeIn();
			} else {
				tmp.slideUp();
				$(".screen-lock").fadeOut();
			}
		});
		$(".extra-content .btn:not(.disable)").off("click").click(function () {
			var btn = $(this);
			var type = btn.attr("data-type");
			switch (type) {
				case "exit":
					leaveChatRoom();
					break;
				case "edit": //edit mem
					// editMember();
					//go to edit preview page
					showEditRoomPage();
					break;
				case "invite":
					inviteMember();
					break;
				case "album":
					showAlbum();
					break;
			}
			$("#header .extra-content").hide();
			$(".screen-lock").hide();
		});

		$(document).on('mousedown', '.chat-msg-bubble-left, .chat-msg-bubble-right', function (e) {
			$(this).addClass("active");
		});
		$(document).on('blur mouseleave', '.chat-msg-bubble-left.active, .chat-msg-bubble-right.active', function (e) {
			$(this).removeClass("active");
		});

		//點擊標題顯示聊天室成員
		$("#header .title .text, #header .title .count").click(function () {
			//防止連按
			if(window.actChk === true) return false;
			window.actChk = true;

			//if extra panel is open, close it
			var extra = $("#header .extra-content");
			if ("none" != extra.css("display")) {
				extra.slideUp();
				$(".screen-lock").fadeOut();
			}

			var tmpData = [];
			for (var gu in g_room.memList) {
				tmpData.push({gu: gu});
			}

			$("#page-chat").addClass("transition");
			showMemListPage($("#pagesContainer"), $.i18n.getString("COMMON_MEMBER"), [{title: "", ml: tmpData}],
				function () {
					cns.debug("on page change done");
				}, function (isDone) {
					window.actChk = false;

					// scrollToBottom();
					setTimeout(function () {
						checkPagePosition();
						$("#page-chat").removeClass("transition");
					}, 500);
					$("#page-select-object").remove();
					cns.debug("on back from memList");
				}
			);
		});

		//點擊已讀數顯示已未讀成員及時間
		$(document).on("click", ".chat-cnt", function () {
			showChatReadUnreadList($(this));
		});

		//視窗focus的時候送更新已讀時間(node.js only)
		try {
			window.frame = require("nw.gui").Window.get();
			window.frame.isFocused = true;
			window_focus = true;

			var windowFocusHandler = function () {
					if (window && window.frame) {
						window.frame.isFocused = true;
						window_focus = true;
					}
					// $("#header .text").css("color","orange");
					if (g_isReadPending) {
						g_isReadPending = false;
						sendMsgRead();
					}
					if( window.opener ){
						var dom = $(window.opener.document).find("#recv-chatroom-focus");
						dom.attr("data-gi", gi);
						dom.attr("data-ci", ci);
						dom.trigger("click");
					}
				}
				, windowBlurHandler = function () {
					if (window && window.frame) {
						window.frame.isFocused = false;
						window_focus = false;
					}
					// $("#header .text").css("color","white");
				};

			window.frame.on("focus", windowFocusHandler);
			window.frame.on("blur", windowBlurHandler);
			window.addEventListener("focus", windowFocusHandler);
			window.addEventListener("blur", windowBlurHandler);
		} catch (e) {
			cns.debug("windows focus detection not work");
		}

		//點擊非播放中的影片開始播放
		$(document).on("click", ".msg-video.loaded:not(.playing)", function () {
			var thisTag = $(this);
			var videoTag = thisTag.find("video");
			if (videoTag.length > 0) {
				var header = $("#header");
				header.slideUp();
				var footer = $("#footer");
				footer.animate({bottom: "-255px"});
				var oriOffset = g_container.scrollTop();
				g_container.css("top", "0").css("height", "100%");
				thisTag.addClass("playing");
				// thisTag.append("<div class='stopBtn'></div>");
				videoTag.prop("controls", true);
				var video = videoTag[0];
				video.currentTime = 0;
				video.play();
				video.onended = function () {
					$(this).prop("controls", false);
					$(this).parents(".msg-video").removeClass("playing");
					header.slideDown();
					footer.animate({bottom: "-205px"});

					g_container.css("top", "65px").css("height", "-webkit-calc( 100vh - 116px )").scrollTop(oriOffset);
					// g_container.animate({top:"65px",height:"-=116"},function(){
					// 	g_container.css("height","-webkit-calc( 100vh - 116px )");
					// 	g_container.scrollTop(oriOffset);
					// });
				}
				video.onpause = function () {
					$(this).parents(".msg-video").addClass("pause");
				}
				video.onplay = function () {
					$(this).parents(".msg-video").removeClass("pause");
				}
			}
		});
		// $(document).on("click",".msg-video.playing .stopBtn", function(){
		// 	var thisTag = $(this);
		// 	var parent = thisTag.parent();
		// 	var videoTag = parent.find("video");
		// 	if( videoTag.length>0 ){
		// 		parent.removeClass("playing");
		// 		videoTag.prop("controls",false);
		// 		var video = videoTag[0];
		//          	video.pause();
		//          	video.currentTime = video.duration-0.1;
		// 	}
		// 	thisTag.remove();
		// });

		//點擊播放中的影片結束播放
		$(document).on("click", ".msg-video.loaded.playing", function () {
			var thisTag = $(this);
			var videoTag = thisTag.find("video");
			if (videoTag.length > 0) {
				thisTag.removeClass("playing");
				// videoTag.prop("controls",false);
				var video = videoTag[0];
				video.pause();
				video.currentTime = video.duration - 0.1;
				video.onended();
			}
		});

		registerEditRoomEvent();

		//apply nicescroll
		var container = $("#container");

		updateChat();
		sendMsgRead(new Date().getTime())
	});

/**
              ███████╗██╗   ██╗███╗   ██╗ ██████╗████████╗██╗ ██████╗ ███╗   ██╗          
              ██╔════╝██║   ██║████╗  ██║██╔════╝╚══██╔══╝██║██╔═══██╗████╗  ██║          
    █████╗    █████╗  ██║   ██║██╔██╗ ██║██║        ██║   ██║██║   ██║██╔██╗ ██║    █████╗
    ╚════╝    ██╔══╝  ██║   ██║██║╚██╗██║██║        ██║   ██║██║   ██║██║╚██╗██║    ╚════╝
              ██║     ╚██████╔╝██║ ╚████║╚██████╗   ██║   ██║╚██████╔╝██║ ╚████║          
              ╚═╝      ╚═════╝ ╚═╝  ╚═══╝ ╚═════╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝          
**/

/**
檢查目前位置, 離開底部時顯示回到底部button
**/
function updateChatContentPosition() {
	var staus = (0 == g_extraInputStatus);
	if ($(".input").data("h") != $(".input").innerHeight()
		|| $(".input").data("staus") != staus) {
		// cns.debug( $(".input").data("h"), $(".input").innerHeight() );
		$(".input").data("h", $(".input").innerHeight());
		$(".input").data("staus", staus);
		var tmp = staus ? 200 : 0;
		var footerHeight = $("#footer").height();
		footerHeight -= tmp;
		$("#chat-contents").stop().animate({marginBottom: footerHeight - 40}, 100);
		$("#chat-toBottom").animate({bottom: Math.max(0, footerHeight + 10)}, 100);
	}
}

/**
高度改變時調整內容高度
**/
function resizeContent() {
	var tmp = (0 == g_extraInputStatus) ? 200 : 0;
	// cns.debug( $( window ).height(), $("#header").height(), $("#chat-loading").height());
	$("#container").css("min-height",
		$(window).height()
		- $("#header").height()
		- ($("#footer").height() - tmp)
		+ $("#chat-loading").height()
	);
}

/**
聊天室DB初始化完成後callback
**/
function onChatDBInit() {
	console.debug("-------- onChatDBInit ---------");
	var today = new Date();
	$("#chat-contents").html("<div class='firstMsg'></div>");
	var timeTag = $("<div class='chat-date-tag'></div>");
	// timeTag.addClass( today.customFormat("_#YYYY#_#MM#_#DD#") );
	timeTag.data("time", today.getTime());
	timeTag.html(getFormatTimeTag(today));
	today.setHours(0);
	today.setMinutes(0);
	today.setSeconds(0);
	var lastMsg = $("<div class='lastMsg'></div>");
	lastMsg.data("time", today.getTime());
	lastMsg.append(timeTag);
	$("#chat-contents").append(lastMsg);
	$("#chat-contents").append("<div class='tmpMsg'></div>");
	getHistoryMsg( false );

	scrollToBottom();

	// var onItem = function (item) {
 //  		// console.log('got item:', item.ct);

 //  		var date = new Date().getTime();
 //  		var onsuccess = function(result){
	// 		if(result !== false){
	// 		    console.log('deletion successful!');
	// 		}
	// 	}
	// 	var onerror = function(error){
	// 	  	console.log('Oh noes, sth went wrong!', error);
	// 	}
 //  		if(date > item.ct) {
 //  			console.log(new Date(item.ct));
 //  			// g_idb_chat_msgs.remove(item.ei, onsuccess, onerror)
 //  		}
	// };

	// var onEnd = function (item) {
 //  		console.log('All done.');
	// };


	// g_idb_chat_msgs.iterate(onItem, {
	// 	index: 'gi_ci_ct',
	// 	filterDuplicates: true,
	// 	onEnd: onEnd
	// });

}



/**
show history chat contents
**/
function getHistoryMsg(bIsScrollToTop) {
	if (g_isLoadHistoryMsgNow) {
		cns.debug("!");
		return;
	}
	var container = $("#container");
	// $("#container").off("scroll");

	g_isLoadHistoryMsgNow = true;
	// cns.debug("g_isLoadHistoryMsgNow",g_isLoadHistoryMsgNow);
	$("#chat-loading-grayArea").hide();
	$("#chat-loading").show();
	cns.debug("----- getHistoryMsg", bIsScrollToTop, " ------");
	g_idb_chat_msgs.limit(function (list) {
		var firstDayDiv = $("#chat-contents .chat-date-tag");
		var scrollToDiv = (firstDayDiv.length > 0 ) ? firstDayDiv[0] : null;
		setCurrentFocus( (scrollToDiv) ? $(scrollToDiv).next().children("div:eq(0)")[0] : null );
		
		//add red border to fist dom to test current position
		// $(".sdfsfg").removeClass("sdfsfg").css("border", "");
		// g_currentScrollToDom.addClass("sdfsfg").css("border", "1px solid red");

		//cns.debug("list:",JSON.stringify(list,null,2));
		if (list.length > 0) {
			//list is from near to far day
			for (var i in list) {
				if (null == list[i] || null == list[i].ei || g_msgs.indexOf(list[i].ei) >= 0) {
					continue;
				} else {
					var object = list[i].data;
					showMsg(object, null);
				}
			}
			if (isUpdatePermission) getPermition(true);


			if (bIsScrollToTop) {
				g_isLoadHistoryMsgNow = false;
			} else {

			}
			showChatCnt();
		}

		if (true==g_isFirstTimeLoading) {
			g_isLoadHistoryMsgNow = false;
			//first time loading finished,
			// scroll to bottom
			scrollToBottom( 0 );

			$("#chat-loading").hide();
			$("#chat-loading-grayArea").show();
			g_isFirstTimeLoading=false;
			// g_container.getNiceScroll()[0].wheelprevented = false;
		} else {

			//舊訊息從local撈 如果小於 就去server取
			if (list.length < 20) {
				updateChat(g_earliestDate.getTime(), false, g_currentScrollToDom);
			} else {
				g_isLoadHistoryMsgNow = false;
				hideLoading();
			}
		}
		// // cns.debug("---- end loading -----");
	}, {
		index: "gi_ci_ct",
		keyRange: g_idb_chat_msgs.makeKeyRange({
			upper: [gi, ci, g_earliestDate.getTime()],
			lower: [gi, ci]
			// only:18
		}),
		limit: 20,
		order: "DESC",
		onEnd: function (result) {
			cns.debug("onEnd:", result.ci + " " + result.ct);
		},
		onError: function (result) {
			cns.debug("onError:", result);
		}
	});

}
/**
紀錄讀取歷史訊息時, 目前最上方的dom
**/
function setCurrentFocus(dom){
	if( dom ){
		g_currentScrollToDom = dom;
		// cns.debug("---- start lockCurrentFocusInterval -----",g_currentScrollToDom);
		// lockCurrentFocusInterval = setInterval( function(){
			// g_currentScrollToDom.scrollIntoView();
		// }, lockCurrentFocusIntervalLength );
		// g_container.getNiceScroll()[0].wheelprevented = true;
	}
}
/**
隱藏讀取轉轉轉
**/
function hideLoading() {
	if (!$("#page-chat").is(":visible")
		|| $("#page-chat").hasClass("transition")
		|| g_isEndOfHistory) return;

	cns.debug("-- hideLoading start --", g_currentScrollToDom);
	if (g_currentScrollToDom) {
		if (false == g_isEndOfHistory) {
			$("#chat-loading-grayArea").show();
		}
		$("#chat-loading").hide();
		g_currentScrollToDom.scrollIntoView({behavior: "smooth"});
		g_currentScrollToDom = null;
		// g_container.getNiceScroll()[0].wheelprevented = false;
		// clearInterval( lockCurrentFocusInterval );

		// cns.debug("---- end lockCurrentFocusInterval -----");

	} else {
		$("#chat-loading").stop().fadeOut(function () {
			if (false == g_isEndOfHistory) {
				$("#chat-loading-grayArea").show();
			}
			var loading = g_container.children("#chat-loading");
			var posi = g_container.scrollTop();
			if (posi <= loading.height()) {
				var content = $("#chat-contents");
				// if( content.length>0 ){
				// 	content[0].scrollIntoView();
				// }
				g_container.scrollTop(content.offset().top);
			}
		});
	}

}

/**
統一ajax function
**/
function op(url, type, data, delegate, errorDelegate) {
	var result = ajaxDo(url, {
		ui: ui,
		at: at,
		li: lang
	}, type, false, data);
	result.error(function (jqXHR, textStatus, errorThrown) {
		// // cns.log(textStatus, errorThrown);
		if (errorDelegate) errorDelegate();
	});
	result.success(function (data, status, xhr) {
		if (delegate) delegate(data, status, xhr);
	});
	
	return result;
}

/**
捲動到頂
**/
function scrollToStart() {
	if( !g_container ) g_container = $("#container");
	g_container.stop(false, true).animate({scrollTop: 50}, 'fast');
	// cns.debug(" -- scrollToBottom");
}

/**
捲動到底
**/
function scrollToBottom( milisecond ) {
	if( !g_container ) g_container = $("#container");
	if( milisecond === undefined ) milisecond = 0;

	g_container.stop(false, true).animate({scrollTop: $("#chat-contents").height()}, milisecond);
	g_isEndOfPage = true;
	// cns.debug(" -- scrollToBottom");
}

/**
檢查捲動位置
**/
function checkPagePosition() {
	if (!$("#page-chat").is(":visible") || $("#page-chat").hasClass("transition")) return;

	var currentTime = new Date().getTime();
	if (currentTime >= g_isEndOfPageTime) {
		if (g_container.length > 0) {
			var posi = g_container.scrollTop();
			var height = g_container.height();
			var docHeight = g_container[0].scrollHeight;
			var isAtBottom = ((posi + height + 35) >= docHeight);
			// cns.debug(isAtBottom, posi, height, docHeight);

			if (isAtBottom) $("#chat-toBottom").fadeOut('fast');
			else $("#chat-toBottom").fadeIn('fast');
			g_isEndOfPage = isAtBottom;
		}
		g_isEndOfPageTime = currentTime + 1000;
	}
}

function getMemberData(groupUI) {
	if (!g_group["guAll"][groupUI])    return null;

	return g_group["guAll"][groupUI];
}

function getMemberName(groupUI) {
	var mem = getMemberData(groupUI);
	if (null == mem)   return "unknown";
	return mem.nk;
}

function updateChat(time, isGetNewer) {
	var api = "groups/" + gi + "/chats/" + ci + "/messages";
	if (time) {
		api += "?ct=" + time;
		if (true == isGetNewer) 
			api += "&d=true";
		else 
			api += "&d=false";
	}

	op(api, "GET", "", function (data, status, xhr) {
			g_group = $.userStorage()[gi];
			g_room = g_group["chatAll"][ci];
			if (null == g_room.lastCt){
				g_room.lastCt = 0;
			}

			onChatReceiveMsg( gi, ci, g_room.uiName, data.el, function(){
				var isEndOfPageTmp = g_isEndOfPage;
				for (var i = (data.el.length - 1); i >= 0; i--) {
					var object = data.el[i];
					if (object.hasOwnProperty("meta")) {

						if (object.meta.ct > g_room.lastCt) g_room.lastCt = object.meta.ct;

						//pass shown msgs
						if (g_msgs.indexOf(object.ei) < 0) showMsg(object);
					}
				}

				if (isUpdatePermission) getPermition(true);

				// isGetNewer 取時間點舊到新的訊息 只有polling需要 
				if (isGetNewer) {

					// 繼續取新訊息
					if (data.el.length > 10) updateChat(g_room.lastCt, true);

					sendMsgRead();

					if (isEndOfPageTmp) scrollToBottom();

				} else { 

					//getting old msgs
					if( time !== undefined ) {
						g_isLoadHistoryMsgNow = false;

						//no more history
						if (1 >= data.el.length) 
							noMoreHistoryMsg();
						else
							hideLoading();

					} else {
						// 第一次進入 滾動至底
						if (true==g_isFirstTimeLoading) {
							g_isFirstTimeLoading=false;
							
							//hide loading
							if (false == g_isEndOfHistory) {
								$("#chat-loading").hide();
								$("#chat-loading-grayArea").show();
							}

							//no more history
							if (1 >= data.el.length) noMoreHistoryMsg();

							scrollToBottom();
						} 

						sendMsgRead();
					}

					showChatCnt();
				}
			});
		}, function () {
				if (false == isGetNewer) {
					popupShowAdjust("", $.i18n.getString("COMMON_CHECK_NETWORK"));
					hideLoading();
				}
			}	//end of onerror function
	);	//end of op
}	//end of updateChat

/**
顯示已讀數
**/
function showChatCnt() {
	// cns.debug( JSON.stringify(userData) );
	if( g_group == undefined ){
		g_group = $.userStorage()[gi];
		//登出
		if(g_group === undefined) window.close();
		g_room = g_group["chatAll"][ci];
	}
		

	if (null == g_room || null == g_room.cnt ) return;

	var 
	list = g_room.cnt,
	index = Object.keys(g_room.cnt).length - 1,
	data = list[index],
	cnt = data.cnt,
	elements = $(".chat-cnt");

	for (var i = 0; i < elements.length; i++) {
		var dom = $(elements[i]);
		if (dom.parents(".sys-msg").length > 0)    continue;
		var time = dom.data("t");

		while (data.ts < time && index >= 0) {
			index--;
			if (index >= 0) {
				//dom.css("background", "red");
				data = list[index];
			}
			cnt = data.cnt;
		}

		if (cnt > 0) {
			if (1 == g_room.tp) dom.html($.i18n.getString("CHAT_READ"));
			else dom.html($.i18n.getString("CHAT_N_READ", cnt));
		} else {
			dom.html("");
		}

		while (data.ts == time && index >= 0) {
			index--;
			if (index >= 0) {
				//dom.css("background", "red");
				data = list[index];
			}
			cnt = data.cnt;
		}
	}
}

function getFormatTimeTag(date) {
	return date.customFormat("#YYYY#/#M#/#D# #CD# #DDD#");
}

function getFormatMsgTimeTag(date) {
	return date.customFormat("#hhh#:#mm#");
}

/**
show msg content
**/
function showMsg(object, bIsTmpSend) {
	if (null == object) return;
	bIsTmpSend = bIsTmpSend || false;

	g_msgs.push(object.ei);
	// cns.debug("list:",JSON.stringify(object,null,2));

	var time = new Date(object.meta.ct);
	var container = $("<div class='chat-msg'></div>");
	container.data("time", object.meta.ct);
	var szSearch = "#chat-contents ." + time.customFormat("_#YYYY#_#MM#_#DD#");
	var div = $(szSearch);

	if (div.length > 0 && div.next().length > 0) {
		div = div.next();
	} else {
		var timeTag = $("<div class='chat-date-tag'></div>");
		timeTag.addClass(time.customFormat("_#YYYY#_#MM#_#DD#"));
		timeTag.html(getFormatTimeTag(time));
		timeTag.data("time", time.getTime());

		var allTimeTag = $("#chat-contents .chat-date-tag");
		if (1 < allTimeTag.length) {
			var bIsAdd = false;
			for (var i = 0; i < allTimeTag.length - 1; i++) {
				// cns.debug($(allTimeTag[i]).data("time"));
				// cns.debug( time.getTime(), time.toString() );

				if ($(allTimeTag[i]).data("time") > time.getTime()) {
					// cns.debug("1", time);
					$(allTimeTag[i]).before(timeTag);
					bIsAdd = true;
					break;
				}
			}
			if (!bIsAdd) {
				$("#chat-contents .lastMsg").before(timeTag);
				// cns.debug("2", time);
			}
		} else {
			$("#chat-contents .lastMsg").before(timeTag);
			// cns.debug("3", time);
		}
		// if(time.getTime()<g_earliestDate){
		// 	$("#chat-contents .firstMsg").after(timeTag);
		// } else {
		// 	$("#chat-contents .lastMsg").before(timeTag);
		// }
		div = $("<div></div>");
		timeTag.after(div);

		var lastTime = new Date($("#chat-contents .lastMsg").data("time"));
		if (time.getTime() >= lastTime.getTime()) {
			$("#chat-contents .lastMsg .chat-date-tag").css("display", "none");
		}
	}

	if (time.getTime() < g_earliestDate) {
		g_earliestDate = time;
	}
	if (time.getTime() > g_latestDate) {
		g_latestDate = time;
	}

	var msgList = div.find(">div");
	if (msgList.length > 0) {
		var bIsAdd = false;
		var i = 0;
		var ctTmp = time.getTime();
		for (; i < msgList.length; i++) {
			if (ctTmp <= $(msgList[i]).data("time")) {
				//若已為開頭, 或上方時間小於this
				if (i == 0 || ctTmp >= $(msgList[i-1]).data("time") ) {
					$(msgList[i]).before(container);
					bIsAdd = true;
					break;
				 }
			}
		}
		if (!bIsAdd) {
			$(msgList[i - 1]).after(container);
		}
	} else {
		div.append(container);
	}


	//msg
	var time = new Date(object.meta.ct);
	if (null == object.ml || object.ml.length <= 0) return;
	var msgData = object.ml[0];
	var msgDiv;
	var isMe = ( object.meta.gu == g_group.gu );
	var unSend = object.hasOwnProperty("notSend");

	//is me?
	if (isMe) {
		//right align
		//time +(msg)
		div = $("<div class='chat-msg-right'></div>");
		container.append(div);

		var table = $("<table></table>");
		table.append($("<tr><td><div class='chat-cnt' data-t='" + time.getTime() + "'></div></td></tr>"));
		var tr = $("<tr></tr>");
		var td = $("<td></td>");
		if (unSend) {
			container.data("data", object);
			var status = $("<div></div>");
			table.find(".chat-cnt").hide();
			if (bIsTmpSend) {
				status.addClass('chat-msg-load');
			}
			else  status.addClass('chat-msg-load-error');
			status.click(function () {
				if ($(this).hasClass("chat-msg-load-error")) {
					popupShowAdjust("", $.i18n.getString("CHAT_FAIL_SENDING_MSG"), true, true, [sendChat, container]);
					$(".popup-confirm").html($.i18n.getString("CHAT_RESEND"));
					$(".popup-cancel").html($.i18n.getString("COMMON_DELETE"));
					$(".popup-cancel").off("click").click(function () {
						var data = container.data("data");
						if (data) {
							g_idb_chat_msgs.remove(data.ei);
						}
						container.hide('slow', function () {
							container.remove();
						});
						$(".popup-screen").hide();
						$(".popup").hide();
					});
					$(".popup-screen").off("click").click(function () {
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

		div.append(table);

		msgDiv = $("<div></div>");
		div.append(msgDiv);
	} else {
		//left align
		var mem = getMemberData(object.meta.gu)

		div = $("<div class='chat-msg-left'></div>");
		container.append(div);

		//left
		var pic = $("<img class='aut'/>");	//left pic (auo for large pic)
		if (mem.aut && mem.aut.length > 0) {
			pic.attr("src", mem.aut);
		} else {
			pic.attr("src", "images/common/others/empty_img_personal_l.png");
		}
		div.append(pic);

		//right
		var subDiv = $("<div class='group'></div>");
		subDiv.append("<div class='name'>" + mem.nk.replaceOriEmojiCode() + "</div>");	//name
		msgDiv = $("<div class='msg-content'></div>");
		subDiv.append(msgDiv);	//msg

		table = $("<table></table>");
		table.append( "<tr><td></td></tr>" );
		table.append( "<tr><td><div class='chat-msg-time'>" + getFormatMsgTimeTag(time) + "</div></td></tr>" );
		subDiv.append(table);

		div.append(subDiv);	//right
	}

	switch (msgData.tp) {
		case 0: //text or other msg
			if (isMe) {
				msgDiv.addClass('chat-msg-bubble-right');
			} else {
				msgDiv.addClass('chat-msg-bubble-left');
			}
			msgDiv.html(htmlFormat(msgData.c));
			break;
		case 5:
			msgDiv.addClass("msg-sticker");
			if (isMe) {
				msgDiv.addClass('right');
			} else {
				msgDiv.addClass('left');
			}
			var pic = $("<img>");
			setStickerUrl(pic, msgData.c);
			// var sticker_path = "sticker/" + msgData.c.split("_")[1] + "/" + msgData.c + ".png";
			// pic.attr("src",sticker_path);
			msgDiv.append(pic);
			break;
		case 6:
			if (isMe) {
				msgDiv.addClass('chat-msg-container-right');
			} else {
				msgDiv.addClass('chat-msg-container-left');
			}
			var pic = $("<img class='msg-img' style='width:150px;'>");
			msgDiv.append(pic);
			getChatS3file(msgDiv, msgData.c, msgData.tp, ti_chat);
			break;
		case 7:
			if (isMe) {
				msgDiv.addClass('chat-msg-container-right');
			} else {
				msgDiv.addClass('chat-msg-container-left');
			}
			var video = $("<div class='msg-video'><div class='videoContainer'><video><source type='video/mp4'></video></div><a class='download' download><img src='images/dl.png'/></a><div class='info'><div class='play'></div><div class='length'></div></div></div>");
			msgDiv.append(video);
			getChatS3file(msgDiv, msgData.c, msgData.tp, ti_chat);
			break;
		case 8: //audio
			if (isMe) {
				msgDiv.addClass('chat-msg-bubble-right');
			} else {
				msgDiv.addClass('chat-msg-bubble-left');
			}
			var this_audio = $(
				"<audio class='msg-audio' src='test' controls></audio>"
			);
			msgDiv.append(this_audio);
			getChatS3file(this_audio, msgData.c, msgData.tp, ti_chat);
			break;
		case 9: //map
			if (isMe) {
				msgDiv.addClass('chat-msg-bubble-right');
			} else {
				msgDiv.addClass('chat-msg-bubble-left');
			}
			showMsgMap(msgData, msgDiv);
			break;
		case 22: //mem join/leave
			msgDiv.addClass('content');
			var textTmp = "";
			try {
				var memTmp = g_group.guAll[msgData.t];
				if (1 == msgData.a) {
					if (null == g_room.memList || g_room.memList.hasOwnProperty(memTmp.gu)) {
						isUpdatePermission = true;
					}
					textTmp = $.i18n.getString("CHAT_SOMEONE_LEAVE", memTmp.nk);
				} else {
					if (null == g_room.memList || !g_room.memList.hasOwnProperty(memTmp.gu)) {
						isUpdatePermission = true;
					}
					textTmp = $.i18n.getString("CHAT_SOMEONE_JOIN", memTmp.nk);
				}

			} catch (e) {
				errorReport(e);
			}
			msgDiv.html(htmlFormat(textTmp));
			if (isMe) msgDiv.parent().removeClass("chat-msg-right").addClass("sys-msg");
			else {
				var newParent = msgDiv.parent().parent().parent();
				newParent.find(".chat-msg-left").remove();
				var child = msgDiv.parent().detach();
				child.addClass("sys-msg");
				child.find(".name").remove();
				child.append(child.find(".msg-content").detach());
				newParent.append(child);
			}
			break;
		case 23: //voip
			if (isMe) {
				msgDiv.parent().removeClass("chat-msg-right").addClass("sys-msg");
				msgDiv.html("You've made a VOIP call.");
			} else {
				var newParent = msgDiv.parent().parent().parent();
				newParent.find(".chat-msg-left").remove();
				var child = msgDiv.parent().detach();
				child.addClass("sys-msg");
				child.find(".name").remove();
				child.append(child.find(".msg-content").detach());
				newParent.append(child);

				msgDiv.html("You've missed a VOIP call, download Qmi on phone to receive it.");
			}
			break;
		default: //text or other msg
			if (isMe) {
				msgDiv.addClass('chat-msg-bubble-right');
			} else {
				msgDiv.addClass('chat-msg-bubble-left');
			}
			msgDiv.html("&nbsp");
			// msgDiv.html( msgData.tp+"<br/>"+msgData.c );
			break;
	}
	cns.debug("showMsg finished");
	return container;
}

function showMsgMap(msgData, container) {
	var mapDiv = $("<div class='msg-map'></div>");
	mapDiv.append("<div class='img'></div>");
	mapDiv.append("<div class='text'>" + msgData.a + "</div>");
	mapDiv.click(function () {
		var gallery = window.open("layout/mapPreview.html", "", "width=800, height=800");
		$(gallery.document).ready(function () {
			setTimeout(function () {
				gallery.msgData = msgData;
				$(gallery.document).find("#dataDom").trigger("click");
			}, 1500);
		});
	});
	container.append(mapDiv);
}

function showUnsendMsg(c, tp) {
	var eiTmp = "{0}_{1}_{2}".format( randomHash(11), randomHash(11), randomHash(11));
	var time = new Date().getTime();
	var newData = {
		ei: eiTmp,
		meta: {
			ct: time,
			gu: g_group.gu
		},
		ml: [
			{
				c: c,
				tp: tp
			}
		],
		notSend: true
	};
	var node = {
		gi: gi,
		ci: ci,
		ei: eiTmp,
		ct: time,
		data: newData
	};
	//write msg to db with pseudo id
	var dom = showMsg(newData);
	g_idb_chat_msgs.put(node);
	return dom;
}

function sendChat(dom) {
	dom.find(".chat-msg-load-error").removeClass("chat-msg-load-error").addClass("chat-msg-load");
	var tmpData = dom.data("data");
	if (null == tmpData)    return;
	try {

		switch (tmpData.ml[0].tp) {
			case 0: //text
			case 5: //sticker
				sendMsgText(dom);
				break;
			case 6: //img
				sendMsgImage(dom);
				break;
			case 7: //video
				sendMsgVideo(dom);
				break;
		}
	} catch (e) {
		errorReport(e);
		dom.find(".chat-msg-load").removeClass("chat-msg-load").addClass("chat-msg-load-error");
	}
}

function sendMsgText(dom) {
	var tmpData = dom.data("data");
	cns.debug("send");	//, new Date(tmpData.meta.ct), new Date(tmpData.meta.ct)
	var sendData = {
		meta: {
			lv: 2,
			tp: 3
		},
		ml: tmpData.ml
	};

	scrollToBottom();
	op("groups/" + gi + "/chats/" + ci + "/messages",
		"POST",
		sendData,
		function (dd, status, xhr) {
			//delete tmp sending data & msg dom
			g_idb_chat_msgs.remove(tmpData.ei);
			dom.css("opacity",0)

			// cns.debug("recv", dd.ct, new Date(dd.ct));
			//get new ei & show new msg dom
			var newData = {
				ei: dd.ei,
				meta: {
					gu: g_group.gu,
					ct: dd.ct
				},
				ml: tmpData.ml
			};

			var node = {
				gi: gi,
				ci: ci,
				ei: dd.ei,
				ct: dd.ct,
				data: newData
			};

			g_idb_chat_msgs.put(node, function(){
				showMsg(newData);
				dom.remove();
				if( g_isEndOfPage === true ) scrollToBottom();
			});

		},
		function () {
			dom.find(".chat-msg-load").removeClass("chat-msg-load").addClass("chat-msg-load-error");
		}
	);
}

	function sendMsgImage(dom) {
		var file = dom.data("file");
		var tmpData = dom.data("data");
		if (null == file) {
			setTimeout(function () {
				popupShowAdjust("",
					$.i18n.getString("CHAT_UPLOAD_FILE_MISSING"),
					$.i18n.getString("COMMON_OK"),
					"", [function () { //on ok
						g_idb_chat_msgs.remove(tmpData.ei);
						dom.hide('slow', function () {
							dom.remove();
						});
					}]
				);
			}, 500);
			return;
		}

		var ori_arr = [1280, 1280, 0.7];
		var tmb_arr = [160, 160, 0.4];

		dom.find(".chat-msg-load-error").removeClass("chat-msg-load-error").addClass("chat-msg-load");

		uploadGroupImage(gi, file, ti_chat, 0, ori_arr, tmb_arr, pi, function (data) {
			if (data) {
				//delete old data
				g_idb_chat_msgs.remove(tmpData.ei);

				tmpData.ml[0].c = data.fi;
				tmpData.ml[0].p = pi;
				//add new data to db & show
				var newData = {
					ei: tmpData.ei,
					meta: {
						gu: g_group.gu,
						ct: tmpData.ct
					},
					ml: [
						{
							tp: tmpData.ml[0].tp,
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
				dom.data("data", tmpData);
				//update db
				g_idb_chat_msgs.put(node, function(){
					sendMsgText(dom);
				});
			} else {
				dom.find(".chat-msg-load").removeClass("chat-msg-load").addClass("chat-msg-load-error");
			}
		});
		// }
	}
	function sendMsgVideo(dom) {
		var file = dom.data("file");
		var tmpData = dom.data("data");
		if (null == file) {
			setTimeout(function () {
				popupShowAdjust("",
					$.i18n.getString("CHAT_UPLOAD_FILE_MISSING"),
					$.i18n.getString("COMMON_OK"),
					"", [function () { //on ok
						g_idb_chat_msgs.remove(tmpData.ei);
						dom.hide('slow', function () {
							dom.remove();
						});
					}]
				);
			}, 500);
			return;
		}
		var video = dom.find("video");

		var ori_arr = [1280, 1280, 0.9];
		var tmb_arr = [160, 160, 0.4];

		dom.find(".chat-msg-load-error").removeClass("chat-msg-load-error").addClass("chat-msg-load");

		uploadGroupVideo(gi, file, video, ti_chat, 0, ori_arr, tmb_arr, pi, function (data) {
			if (data) {
				//delete old data
				g_idb_chat_msgs.remove(tmpData.ei);

				tmpData.ml[0].c = data.fi;
				tmpData.ml[0].p = pi;
				//add new data to db & show
				var newData = {
					ei: tmpData.ei,
					meta: {
						gu: g_group.gu,
						ct: tmpData.ct
					},
					ml: [
						{
							tp: tmpData.ml[0].tp,
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
				dom.data("data", tmpData);
				//update db
				g_idb_chat_msgs.put(node, function(){
					sendMsgText(dom);
				});
			} else {
				dom.find(".chat-msg-load").removeClass("chat-msg-load").addClass("chat-msg-load-error");
			}
		});
		// }
	}

	/**
	處理按下送出或enter送出事件
	**/
	function onClickSendChat() {
		var inputDom = $("#footer .contents .input");
		// var text = inputDom.val();
		var text = inputDom[0].innerText;
		inputDom.html("");
		if (text.length <= 0) return;
		updateChatContentPosition();

		// updateChatContentPosition();

		var msg = text.replace(/<br>/g, "\n");
		// inputDom.val("").trigger('autosize.resize');

		var dom = showUnsendMsg(msg, 0);
		sendChat(dom);
	}

	/**
	處理點下sticker圖事件
	**/
	sendSticker = function (id) {
		if (id.length <= 0) return;

		var dom = showUnsendMsg(id, 5);
		sendChat(dom);

		$(".input-emoji.active").trigger("click")
	}

	/**
	* brief: 取得s3檔案及將內容帶入目標dom
	* param:
		* target: 要顯示這個檔案的dom
		* file_c: 檔名
		* tp: 檔案type(6圖, 7影片, 8audio)
		* ti: 聊天室timeline id (=ci)
		* (deprecated)tu: 目前聊天室已不需要帶了....神奇的target user列表, 用來取代舊的permition id作檔案權限管理用, server會拿這份列表去產pi取檔案給你
		* eg: 

			```
			var this_audio = $("<audio class='msg-audio' src='test' controls></audio>");
			getChatS3file(this_audio, msgData.c, msgData.tp, ti_chat);
			```
	**/
	getChatS3file = function (target, file_c, tp, this_ti, this_tu) {
		this_ti = this_ti || ti;
		if (!file_c || file_c.length == 0) {
			cns.debug("null file,", "file_c:", file_c, "tp", tp
				, "this_ti:", this_ti, "g_tu", g_tu);
			return;
		}
		//default
		var api_name = "groups/" + gi + "/chats/" + this_ti + "/files/" + file_c + "/dl";
		var headers = {
			"ui": ui,
			"at": at,
			"li": lang
		};
		var method = "post";
		var body = null;
		if (null != this_tu) {
			body = {
				tu: this_tu
			};
		}

		var result = ajaxDo(api_name, headers, method, false, body);
		result.complete(function (data) {
			if (data.status != 200) return false;

			var obj = $.parseJSON(data.responseText);
			obj.api_name = api_name;
			if (target && tp) {
				switch (tp) {
					case 6://圖片
						var img = target.find("img");
						img.load(function () {

							var w = img.width();
							var h = img.height();

							//重設 style
							img.removeAttr("style");
							img.css("background-image", "none");

						});

						//小圖
						img.attr("src", obj.s3);
						//點擊跳出大圖
						img.click(function () {
							showGallery(null, null, [{s32: obj.s32}]);
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
					case 7://video
						renderVideoUrl(obj.s32, target.find("video"), function (videoTag) {
							var parent = videoTag.parents(".msg-video");
							parent.addClass("loaded");
							parent.find(".length").html(secondsToTime(videoTag[0].duration));
							parent.find(".download").attr("href", videoTag.attr("src"));
						}, function (videoTag) {
							var parent = videoTag.parents(".msg-video");
							parent.addClass("error");
							parent.find(".download").remove();
						});
						break;
					case 8://聲音
						target.attr("src", obj.s3);
						break;
				}
			} else {
				return obj.s3;
			}
		});
	}

	/**
	* brief: 取得聊天室權限, 舊版是取pi, 新版改成取得聊天室成員列表
	* param:
		* isReget: 若已取過是否要再取一次
	**/
	function getPermition(isReget) {
		//目前已不使用pi管理權限
		//若沒有聊天室權限, 重新取得
		if (true == isReget || !g_room.hasOwnProperty("memList") || !g_room.hasOwnProperty("pi") || g_room.pi.length <= 0) {
			try {
				isUpdatePermission = false;
				if (isGettingPermissionNow) return;
				isGettingPermissionNow = true;
				//取得成員列表
				//GET /groups/{gi}/chats/{ci}/users
				op("groups/" + gi + "/chats/" + ci + "/users",
					"get", null, function (data, status, xhr) {
						//取得權限
						var sendData = {
							ti: ti_chat,
							tu: {gul: data.ul}
						};
						var userData = $.userStorage();
						g_room = userData[gi].chatAll[ci];
						g_room.memList = {};
						for (var i = 0; i < data.ul.length; i++) {
							g_room.memList[data.ul[i].gu] = data.ul[i];
						}
						g_room.memCount = data.ul.length;
						if (g_room.cpc !== undefined) {
							$("#header .count").show();
							$("#header .count").html("(" + g_room.cpc + ")");
							$(".extra-content .btn[data-type=edit]").show();
							$(".extra-content .btn[data-type=exit]").show();
						} else {
							$("#header .count").hide();
							$(".extra-content .btn[data-type=edit]").hide();
							$(".extra-content .btn[data-type=exit]").hide();
						}
						$.userStorage(userData);

						checkMemberLeft();

						// -- set pi to 0 ----
						// op("/groups/"+gi+"/permissions", "post",
						// 	JSON.stringify(sendData), function(pData, status, xhr){
						isGettingPermissionNow = false;
						// cns.debug( JSON.stringify(pData) );

						// pi = pData.pi;
						pi = 0;
						userData = $.userStorage();
						g_group = userData[gi];
						g_room = g_group["chatAll"][ci];
						g_room.pi = pi;
						g_room.tu = g_tu;
						g_room.uiName = g_cn;
						g_tu = data.ul;
						$.userStorage(userData);
						// 	},
						// 	null
						// );
						if( $("#page-edit-preview").is(":visible") ){
							updateEditRoomPage();
						}
					},
					null
				);
			} catch (e) {
				cns.debug("[!]" + e.message);
				isGettingPermissionNow = false;
			}
		} else {
			//set pi to 0
			pi = 0;
			// pi = g_room.pi;

			g_tu = g_room.tu;
		}
	}

	/**
	* brief: 更新聊天室已讀時間
	* param:
		* msTime: 已讀時間
	**/
	function sendMsgRead(msTime) {
		msTime = g_room.lastCt || msTime;
		if (null == msTime) return;
		if (false == window_focus) {
			g_isReadPending = true;
			cns.debug("[sendMsgRead]not focus");
			return;
		}

		op("groups/" + gi + "/chats/" + ci + "/messages_read"
			, "PUT",
			{lt: msTime},
			null
		);
	}

	/**
	顯示離開聊天室確認視窗
	**/
	function leaveChatRoom() {
		cns.debug("leaveChatRoom");

		popupShowAdjust($.i18n.getString("CHAT_LEAVE"),
			$.i18n.getString("CHAT_LEAVE_CONFIRM"),
			$.i18n.getString("COMMON_OK"),
			$.i18n.getString("COMMON_CANCEL"), [function () { //on ok
				leaveRoomAPI(ci, function () {
					var userData = $.userStorage();

					g_group = userData[gi];
					delete g_group.chatAll[ci];

					$.userStorage(userData);
					$('.sm-small-area[data-sm-act="chat"]', window.opener.document).trigger("click");
					window.close();
				});
			}]
		);
	}

	/**
	* brief: 離開聊天室API
	* param:
		* ci: 聊天室id
		* callback(rsp): 完成callback
			* rsp: response text obj 
	**/

	function leaveRoomAPI(ciTmp, callback) {
		op("groups/" + gi + "/chats/" + ciTmp + "/users", 'delete',
			null, function (pData, status, xhr) {
				cns.debug(status, JSON.stringify(pData));
				if (callback) callback(pData);
			},
			null
		);
	}


	/**
	* brief: 編輯聊天室成員API
	* param:
		* ci: 聊天室id
		* callback(rsp): 完成callback
			* rsp: response text obj 
		* eg:

			```
			//取得已讀
			var sendData = {
			  "add":{
				  "gul": [
				    { "gu": "M00000DK0FS", "rt":  }, ...
				  ]
			  }, "del":{
				  "gul": [
				    { "gu": "M00000M707J", "rt": 1440495162788 }, ...
				  ]
			  }
			};
			editMemInRoomAPI('T00002ac07i', sendData, function(data){
				// data = {"mc":3,"rsp_code":0,"rsp_msg":"OK"}; //object, mc=current mem cnt
			});
			```
	**/
	function editMemInRoomAPI(ciTmp, sendData, callback) {
		op("groups/" + gi + "/chats/" + ciTmp, "put",
			sendData, function (pData, status, xhr) {
				cns.debug(status, JSON.stringify(pData));
				if (callback) callback(pData);
			},
			null
		);
	}

	/**
	顯示編輯預覽頁面
	**/
	function showEditRoomPage(){
		$.changePage("#page-edit-preview", function () {
			cns.debug("on page loaded");
		}, function () {
			cns.debug("on done");
		});
		updateEditRoomPage();
	}

	/**
	更新編輯預覽頁面內容
	**/
	function updateEditRoomPage(){
		var page = $("#page-edit-preview");
		//init
		// var container = page.find(".newChatDetail-content.mem");
		var input = page.find(".newChatDetail table .input");
		//set current group name
		input.val( g_cn ).data("oriName",g_cn);

		//set current mem
		updateEditRoomMember(g_room.memList);

		//img
		if(g_room.cat){
			page.find(".newChatDetail .img img").attr("src", g_room.cat);
		}
		
		page.find(".edit-nextStep").removeClass("ready");
		page.find(".newChatDetail .img img").removeData("file");
		//bind event
		// var tmp = $.i18n.getString(input.data("textid"));
		// input.attr("placeholder", tmp);
		// input.off("change");
		// input.keyup(function () {
		// 	var text = $(this).val();
		// 	count.html((20 - text.length) + "/" + $(this).attr("maxlength"));
		// });
	}
	function updateEditRoomMember( memList ){
		var container = $("#page-edit-preview .newChatDetail-content.mem");
		container.html("");
		$.each( memList , function(key, memTmp){
			var mem = g_group.guAll[key];
			var memDiv = $("<div class='row mem'></div>");
			if (mem.auo) {
				memDiv.append("<img class='namecard' src='" + mem.auo + "'>");
				memDiv.find("img").data("gu", key);
				memDiv.find("img").data("gi", gi);
			} else {
				memDiv.append("<img src='images/common/others/empty_img_personal_l.png'>");
			}
			memDiv.append("<span>" + mem.nk.replaceOriEmojiCode() + "</span>");
			container.append(memDiv);
		});
	}

	/**
	註冊編輯成員預覽頁面事件
	**/
	function registerEditRoomEvent(){
		var page = $("#page-edit-preview");
		
		//修改成員
		page.find(".preview-add").off("click").click( editMember );

		//修改聊天室圖片
		page.find(".newChatDetail .img").off("click").click( function(){
			page.find(".newChatDetail .file").trigger("click");
		});
		page.find(".newChatDetail .file").change( onEditRoomFileChange );

		//完成
		page.find(".edit-nextStep").off("click").click( onComfirmEditRoom );

		//back confirm
	    page.find('.page-back').off("click").click( function(e){
	    	if( page.find(".edit-nextStep").hasClass("ready") ){
		    	e.preventDefault();
		    	e.stopPropagation();

		    	popupShowAdjust("",
					$.i18n.getString("FEED_CONFIRM_DISCARD"),
					$.i18n.getString("COMMON_OK"),
	                $.i18n.getString("COMMON_CANCEL"),[function(){
	                    $.popPage(false);
	            	},null]
	            );
		        
		    }
	    });

	    //name input event
	    page.find(".newChatDetail table .input").keyup( function(){
	    	var comfirmDom = page.find(".edit-nextStep");
	    	var input = $(this);
	    	var val = input.val();
	    	if( val != input.data("oriName") ){
	    		if(!val || val.length==0 ){
	    			comfirmDom.data("nameEdited",false);
	    		} else {
	    			comfirmDom.data("nameEdited",true);
	    		}
	    	} else{
	    		comfirmDom.removeData("nameEdited");
	    	}
	    	checkIsReady();
	    });
	}

	/**
	修改聊天室圖片
	**/
	function onEditRoomFileChange(e) {
		var input = $(this);
		if (input.length>0 && input[0].files && input[0].files[0]) {
			var imageType = /image.*/;
			if (input[0].files[0].type.match(imageType)) {
			    var reader = new FileReader();

			    reader.onload = function (e) {
					var page = $("#page-edit-preview");
					var dom = page.find(".newChatDetail .img img");
			        dom.attr('src', e.target.result);
			    	dom.data("file", input[0].files[0] );
			    	input.replaceWith(input.val('').clone(true));
			    	checkIsReady();
			    }

			    reader.readAsDataURL(input[0].files[0]);
			} else {
				popupShowAdjust("",
					$.i18n.getString("COMMON_NOT_IMAGE"),
					$.i18n.getString("COMMON_OK")
				);
				input.replaceWith(input.val('').clone(true));
			}
		} else {
			input.replaceWith(input.val('').clone(true));
		}
	}

	/**
	完成修改聊天室, 送出資料
	**/
	function onComfirmEditRoom(e){
		var comfirmDom = $(this);
		if( !comfirmDom.hasClass("ready") ) return;
		var isReady = false;

		//update avatar
		var page = $("#page-edit-preview");
		var imgDom = page.find(".newChatDetail .img img");
		var file = imgDom.data("file");
		if(file){
			var ori_arr = [1280, 1280, 0.7];
			var tmb_arr = [160, 160, 0.4];
			uploadChatAvatar(gi, file, ti_chat, 0, ori_arr, tmb_arr, pi, function (data) {
				if (data) {
					g_room.cat = data.tu;
					g_room.cao = data.ou;
					imgDom.removeData("file").attr("src", g_room.cat);
					checkIsSendEditDone(isReady);
					isReady = true;
				} else {
					popupShowAdjust("", $.i18n.getString("COMMON_CHECK_NETWORK"));
				}
			});
		} else {
			isReady = true;
		}

		//update name & mem
		if( comfirmDom.data("memEdited") || comfirmDom.data("nameEdited") ){
			var btn = $(".extra-content .btn[data-type='edit']");
			var memListString = btn.data("object_str");
			var data = {};
			data.cn = page.find(".newChatDetail table .input").val();
			var isSendMem = false;
			try {
				cns.debug(memListString);
				var memList = $.parseJSON(memListString);
				memList[g_group.gu] = g_group.guAll[g_group.gu].nk;
				var addList = [];
				var removeList = [];
				for (var guTmp in memList) {
					if (!g_room.memList.hasOwnProperty(guTmp)) {
						addList.push(guTmp);
					}
				}
				for (var guTmp in g_room.memList) {
					if (!memList.hasOwnProperty(guTmp)) {
						removeList.push(guTmp);
					}
				}
				if (addList.length > 0) {
					data.add = {gul:addList};
					isSendMem = true;
				}

				if (removeList.length > 0) {
					data.del = {gul:removeList};
					isSendMem = true;
				}
			} catch (e) {
				cns.debug("[!]" + e.message);
			}
			editMemInRoomAPI(ci, data, function (dataTmp) {
				g_cn = data.cn;
				$("#page-chat #header .title .text").html(g_cn.replaceOriEmojiCode());
				checkIsSendEditDone(isReady);
				isReady = true;
				getPermition(true);
				updateChat();
			});
		} else {
			isReady = true;
		}
	}

	/**
	是否所有編輯都完成
	**/
	function checkIsReady(){

		var page = $("#page-edit-preview");
		var comfirmDom = page.find(".edit-nextStep");
		var input = page.find(".newChatDetail table .input").val();
	    
	    var isSet = false;
	    if( input || comfirmDom.data("memEdited")
	    	|| page.find(".newChatDetail .img img").data("file") ){
	    	//團體名false表示有修改, 但內容為空
	    	if( false!=input ){
	    		comfirmDom.addClass("ready");
	    		return;
	    	}
	    }
	    comfirmDom.removeClass("ready");
	}

	/**
	是否所有編輯都完成
	**/
	function checkIsSendEditDone(isReady){
		if( !isReady ) return;

		var comfirmDom = $("#page-edit-preview").find(".edit-nextStep");
		comfirmDom.removeClass("ready");
		comfirmDom.removeData("memEdited");
		comfirmDom.removeData("nameEdited");
		popupShowAdjust("", $.i18n.getString("USER_PROFILE_UPDATE_SUCC"));
		//$.popPage();

		//叫主視窗更新聊天室列表
		if (window.opener) {
			var dom = $(window.opener.document).find("#recv-sync-chat-list");
			dom.attr("data-gi",gi);
			dom.trigger("click");
		}
	}

	/**
	顯示編輯成員頁面
	**/
	function editMember() {
		cns.debug("editMember");

		try {
			var btn = $(".extra-content .btn[data-type='edit']");
			var tmpList = {};
			for (var gu in g_room.memList) {
				tmpList[gu] = g_group.guAll[gu].nk;
			}

			btn.data("exclude_str", JSON.stringify([g_group.gu]));
			btn.data("object_str", JSON.stringify(tmpList));
			btn.data("object_opt", {
				isShowBranch: false,
				isShowSelf: false,
				isShowAll: false,
				isShowFav: false,
				isSingleSelect: false,
				min_count: 1
			});


			$("#page-chat").addClass("transition");
			showSelectMemPage($("#pagesContainer"), btn, function () {
				}, function (isDone) {
					if (isDone) {
						try {
							var memListString = btn.data("object_str");
							cns.debug(memListString);
							var memList = $.parseJSON(memListString);
							memList[g_group.gu] = g_group.guAll[g_group.gu].nk;
							var newMemlist = {};
							for (var guTmp in memList) {
								if( g_group.guAll.hasOwnProperty(guTmp) ){
									newMemlist[guTmp] = g_group.guAll[guTmp];
								}
							}
							updateEditRoomMember( newMemlist );
							$("#page-edit-preview .edit-nextStep").data("memEdited", true);
							checkIsReady();
						} catch(e){
							errorReport(e);
						}
						
					}
					setTimeout(function () {
						// checkPagePosition();
						$("#page-chat").removeClass("transition");
					}, 500);
					$("#page-select-object").remove();
				}
			);
		} catch (e) {
			cns.debug(e.message);
		}
	}

	/**
	顯示邀請成員頁面
	**/
	function inviteMember() {
		cns.debug("inviteMember");

		try {
			var btn = $(".extra-content .btn[data-type='invite']");

			var tmpList = [];
			for (var gu in g_room.memList) {
				tmpList.push(gu);
			}
			btn.data("exclude_str", JSON.stringify(tmpList));
			btn.data("object_str", "");
			btn.data("object_opt", {
				isShowBranch: false,
				isShowSelf: false,
				isShowAll: false,
				isShowFav: true,
				isSingleSelect: false,
				min_count: 1
			});

			$("#page-chat").addClass("transition");
			showSelectMemPage($("#pagesContainer"), btn, function () {
					// $("#page-chat").removeClass("transition");
				}, function (isDone) {
					// scrollToBottom();
					if (isDone) {
						//on select done
						// send add mem to room api
						var memListString = btn.data("object_str");
						//單人聊天室的話變成創新聊天室流程
						if (g_room.tp == 1) {
							try {
								var list = $.parseJSON(memListString);
								for (var gu in g_room.memList) {
									list[gu] = g_group.guAll[gu].nk;
								}
								// if( window.opener && gi==window.opener.gi ){
								// 	var parent = $(window.opener.document);
								// 	var tmp = parent.find(".chatList-add-done");
								// 	tmp.attr("data-object_str",JSON.stringify(list) );
								// 	tmp.attr("data-favorite_str","{}");
								// 	parent.find(".chatList-add-done").trigger("click");
								// 	$(window.opener)[0].focus();
								// }
								showCreateMultipleChatPage(list, {});
							} catch (e) {
								errorReport(e);
							}
							return;
						}


						//多人直接加進來
						try {
							cns.debug(memListString);
							var memList = $.parseJSON(memListString);
							var newList = [];
							for (var guTmp in memList) {
								newList.push( guTmp);
							}
							editMemInRoomAPI(ci, {add:{gul:newList}}, function (data) {
								// if( data.status==200){
								getPermition(true);
								updateChat();
								// }
							});
						} catch (e) {
							cns.debug(e.message);
						}
					}
					// scrollToBottom();
					setTimeout(function () {
						// checkPagePosition();
						$("#page-chat").removeClass("transition");
					}, 500);
					$("#page-select-object").remove();
				}, true
			);
		} catch (e) {
			errorReport(e);
		}
	}

	/**
	顯示相簿(顯示在主頁面)
	**/
	function showAlbum() {
		showAlbumPage(gi, ci, ci, g_cn);
	}

	/**
	檢查聊天室成員是否已退團
	**/
	function checkMemberLeft() {
		try {
			if (g_room.tp == 1 && null != g_room.memList) {
				for (var guTmp in g_room.memList) {
					if (guTmp != g_group.gu) {
						if (g_group.guAll.hasOwnProperty(guTmp)) {
							var mem = g_group.guAll[guTmp];
							if (mem.st == 2) {
								$("#footer").hide();
								$("#chat-leaveGroup").html(
									$.i18n.getString("CHAT_SOMEONE_LEAVE_GROUP", (mem.nk || "").replaceOriEmojiCode())
								).show();
								return;
							}
							break;
						}
					}
				}
			}
		} catch (e) {
			errorReport(e);
		}

		$("#footer").show();
		$("#chat-leaveGroup").hide();
	}

	/**
	滑鼠捲到頂部取舊訊息
	**/
	function onScrollContainer(e) {

		if (!$("#page-chat").is(":visible") || $("#page-chat").hasClass("transition")) return;

		//cns.debug("wwww",g_container.scrollTop());

		var posi = $(this).scrollTop();
		if (g_isLoadHistoryMsgNow) {
		// 	// if(g_currentScrollToDom) g_currentScrollToDom.scrollIntoView();
		// 	// cns.debug("scroll blocking ", posi, g_container.getNiceScroll()[0].wheelprevented);
			e.stopPropagation();
			e.preventDefault();
			return;
		}
		if ( !g_isEndOfHistory && posi <= $("#chat-loading").outerHeight() * 0.5) {
			// cns.debug("!oooooooooops",g_container.scrollTop());
			getHistoryMsg(false);
			// g_isEndOfPage = false;
			return;
		}

	}
	/* 拉bar捲到頂部取舊訊息 */
	function onDragContainer() {
		if (!g_isEndOfHistory) getHistoryMsg(false);
	}
	/* 若在取舊訊息時禁止捲動 */
	function onScrollBody(e) {
		if (g_isLoadHistoryMsgNow) {
			cns.debug("prevent!");
			e.stopPropagation();
			e.preventDefault();
			return;
		}
	}

	/**
	              ██████╗ ███████╗ █████╗ ██████╗     ██╗     ██╗███████╗████████╗          
	              ██╔══██╗██╔════╝██╔══██╗██╔══██╗    ██║     ██║██╔════╝╚══██╔══╝          
	    █████╗    ██████╔╝█████╗  ███████║██║  ██║    ██║     ██║███████╗   ██║       █████╗
	    ╚════╝    ██╔══██╗██╔══╝  ██╔══██║██║  ██║    ██║     ██║╚════██║   ██║       ╚════╝
	              ██║  ██║███████╗██║  ██║██████╔╝    ███████╗██║███████║   ██║             
	              ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═════╝     ╚══════╝╚═╝╚══════╝   ╚═╝             
	                                                                                        
	**/

	/**
	* brief: 取得某時間已讀成員清單
	* param:
		* this_gi: 團體id
		* this_ci: 聊天室id
		* this_rt: 要查詢的時間
		* this_tp: Read type (1: 已讀, 2:未讀)
	* eg

	**/
	getChatReadUnreadApi = function (this_gi, this_ci, this_rt, this_tp) {
		//GET /groups/{gi}/chats/{ci}/messages_read?rt=<timestamp>&tp=<read_type>
		//tp: Read type (1: 已讀, 2:未讀)
		//rt: Read Timestamp
		var api_name = "groups/" + this_gi + "/chats/" + this_ci + "/messages_read?rt=" + this_rt + "&tp=" + this_tp;
		var headers = {
			"ui": ui,
			"at": at,
			"li": lang
		};
		var method = "get";
		return result = ajaxDo(api_name, headers, method, true);
	}

	/**
	* brief: 取得已讀數＆時間的api
	* param:
		* this_gi:
		* this_ci:
		* this_rt:
		* this_tp:
		* eg:

			```
			//取得已讀
			getChatReadUnreadApi('G000006s00q', 'T00002ac07i', 1440471452981, 1).complete(function(data){
				var parseData = $.parseJSON(data.responseText);
				// 已讀內容, 未讀也差不多
				// { "gul": [
				//     { "gu": "M00000DK0FS", "rt": 1440495096495 },
				//     { "gu": "M00000M707J", "rt": 1440495162788 }
				//   ],
				//   "rsp_code": 0,
				//   "rsp_msg": "OK"
				// }
			}
			```
	**/
	showChatReadUnreadList = function (cntDom) {
		var chat = $("#page-chat");
		if (chat.hasClass("loadRead")) {
			return;
		}

		chat.addClass("transition").addClass("loadRead");
		$(".screen-lock").show();

		var onPageLoad = function () {
			chat.removeClass("loadRead");
			$(".screen-lock").hide();
		};
		var onDone = function (isDone) {
			// scrollToBottom();
			$("#page-chat").removeClass("transition");
			// scrollToBottom();
			setTimeout(function () {
				// checkPagePosition();
			}, 200);
			$("#page-tab-object").remove();
			cns.debug("on back from showChatReadUnreadList");
		};

		var rt = cntDom.data("t");
		var dataReadyCnt = 0;
		var isPageReady = false;
		var list = [];
		var title = "";

		//get read
		list.push({title: $.i18n.getString("FEED_READ"), ml: null});
		getChatReadUnreadApi(gi, ci, rt, 1).complete(function (data) {
			try {
				var parseData = $.parseJSON(data.responseText).gul;
				if (false == isShowUnreadAndReadTime) {
					for (var i = 0; i < parseData.length; i++) {
						delete parseData[i].rt;
					}
				}
				list[0].ml = parseData;
				dataReadyCnt++;
				if (isPageReady && dataReadyCnt > 1) {
					$(".screen-lock").hide();
					showObjectTabShow(gi, title, list, onPageLoad, onDone);
				}
			} catch (e) {
				errorReport(e);
				chat.removeClass("loadRead");
				$(".screen-lock").hide();
			}
		});

		//get unread
		if (isShowUnreadAndReadTime) {
			list.push({title: $.i18n.getString("FEED_UNREAD"), ml: null});


			getChatReadUnreadApi(gi, ci, rt, 2).complete(function (data) {
				if (data.status != 200) return false;
				try {
					list[1].ml = $.parseJSON(data.responseText).gul;

					dataReadyCnt++;
					if (isPageReady && dataReadyCnt > 1) {
						$(".screen-lock").hide();
						showObjectTabShow(gi, title, list, onPageLoad, onDone);
					}
				} catch (e) {
					errorReport(e);
					chat.removeClass("loadRead");
					$(".screen-lock").hide();
				}
			});
		} else {
			list.push({title: $.i18n.getString("FEED_UNREAD"), clickable: false});
			dataReadyCnt++;
			if (isPageReady && dataReadyCnt > 1) {
				$(".screen-lock").hide();
				showObjectTabShow(gi, title, list, onPageLoad, onDone);
			}
		}
		loadObjectTabPage($("#pagesContainer"), function () {
			isPageReady = true;
			if (dataReadyCnt > 1) {
				$(".screen-lock").hide();
				showObjectTabShow(gi, title, list, null, onDone);
			}
		});
	}

	/**
	顯示從單人變多人的編輯頁面(取得內容)
	**/
	function showCreateMultipleChatPage(newChatMemList, newChatFavList) {
		$("#page-chat").addClass("transition");
		try {
			if (newChatMemList.hasOwnProperty(g_group.gu)) {
				delete newChatMemList[g_group.gu];
			}
			g_newChatMemList = Object.keys(newChatMemList);

			if (null == newChatFavList) g_newChatFavList = [];
			else g_newChatFavList = Object.keys(newChatFavList);

			showCreateMultipleChatPageContent(newChatMemList, newChatFavList);
		} catch (e) {
			cns.debug("[!]showNewRoomPage", e.message);
			errorReport(e);
		}
	}

	/**
	顯示從單人變多人的編輯頁面(顯示內容)
	**/
	function showCreateMultipleChatPageContent() {

		//no mem
		if (g_newChatMemList.length == 0 && g_newChatFavList.length == 0) {
			alert($.i18n.getString("CHAT_CHATROOM_MEMBER_EMPTY"));
			return;
		}

		//only 1 mem
		if (g_newChatMemList.length == 1 && g_newChatFavList.length == 0) {
			var gu = g_newChatMemList[0];

			//is same room exist
			var currentGroup = g_group;
			for (var ci in currentGroup.chatAll) {
				var room = currentGroup.chatAll[ci];
				if (1 == room.tp) {
					//room exist
					if (room.cn.indexOf(gu) >= 0) {
						openChatWindow(gi, room.ci);
						// $.mobile.changePage("#page-group-main");
						return;
					}
				}
			}
			requestNewChatRoom();
			return;
		}

		// $.mobile.changePage("#page-newChatDetail");
		var container = $(".newChatMemberContainer");
		$.changePage("#page-newChatDetail", function () {
			cns.debug("on page loaded");
		}, function () {
			cns.debug("on done");
		});

		//init
		var container = $(".newChatDetail-content.mem");
		var input = $(".newChatDetail table .input");
		var count = $(".newChatDetail table .count");
		input.val("");
		count.html("0/" + input.attr("maxlength"));
		container.html("");

		//load data
		var currentGroup = g_group;
		for (var i = 0; i < g_newChatMemList.length; i++) {
			var mem = currentGroup.guAll[g_newChatMemList[i]];
			var memDiv = $("<div class='row mem'></div>");
			if (mem.auo) {
				memDiv.append("<img class='namecard' src='" + mem.auo + "'>");
				memDiv.find("img").data("gu", g_newChatMemList[i]);
				memDiv.find("img").data("gi", gi);
			} else {
				memDiv.append("<img src='images/common/others/empty_img_personal_l.png'>");
			}
			memDiv.append("<span>" + mem.nk.replaceOriEmojiCode() + "</span>");
			container.append(memDiv);
		}

		// favorite
		container = $(".newChatDetail-content.fav");
		container.html("");
		for (var i = 0; i < g_newChatFavList.length; i++) {
			var fav = currentGroup.fbl[g_newChatFavList[i]];
			var favDiv = $("<div class='row fav'></div>");
			favDiv.append("<img src='images/common/others/select_empty_all_photo.png'>");
			favDiv.append("<span>" + fav.fn.replaceOriEmojiCode() + "</span>");
			container.append(favDiv);
		}

		//bind event
		var tmp = $.i18n.getString(input.data("textid"));
		input.attr("placeholder", tmp);
		input.off("change");
		input.keyup(function () {
			var text = $(this).val();
			count.html((20 - text.length) + "/" + $(this).attr("maxlength"));
		});

		$(".newChatDetail-nextStep").off("click");
		$(".newChatDetail-nextStep").click(requestNewChatRoom_chatroom);
	}

	/* 取得新聊天室(呼叫主畫面處理) */
	function requestNewChatRoom_chatroom() {
		var text = $(".newChatDetail table .input").val();
		var arr = [];
		var me = g_group.gu;
		for (var i = 0; i < g_newChatMemList.length; i++) {
			if (g_newChatMemList[i] != me) {
				arr.push({gu: g_newChatMemList[i]});
			}
		}

		var isSingleChat = (arr.length == 1);
		// cns.debug( text );
		if (!isSingleChat && (!text || text.length == 0)) {
			alert($.i18n.getString("CHAT_CHATROOM_NAME_EMPTY"));
			return;
		}

		if (window.opener) {
			window.opener.requestNewChatRoomApi(gi, text, arr, g_newChatFavList, function (data) {
				var page = $("#page-chat");
				gi = page.attr("data-gi");

				
					// var parent = $(window.opener.document);
					// var tmp = parent.find(".chatList-add-done");
					// tmp.attr("data-gi", gi);
					// tmp.attr("data-ci", data.ci);
					// tmp.trigger("click");
					// $(window.opener)[0].focus();

				gi = page.attr("data-gi");
				ci = page.attr("data-ci");
				var userData = $.userStorage();
				g_group = userData[gi];
				g_room = g_group["chatAll"][ci];
			}, true);
		}
		$.popAllPage();
	}

	/**
	upload chat avatar 
	**/
	getChatAvatarUploadUrl = function(){
		var api_name = "groups/" + gi + "/chats/" + ci + "/avatar";
	    var headers = {
	             "ui":ui,
	             "at":at, 
	             "li":lang
	                 };
	    var method = "put";
	    return ajaxDo(api_name,headers,method,false,null);
	};

	uploadChatAvatarCommit = function(fi,si){
		var api_name = "groups/" + gi + "/chats/" + ci + "/avatar/commit";
	    var headers = {
	             "ui":ui,
	             "at":at, 
	             "li":lang
	                 };
	    var method = "put";

	    var body = {
			fi: fi,
			si: si
		};
	    return ajaxDo(api_name,headers,method,false,body);
	}
	/**
	不知道為什麼這不跟一般團體用同一個取得上傳網址的ＡＰＩ...只好fork一份出來＝＝
	**/
	uploadChatAvatar = function(this_gi, file, ti, permission_id, ori_arr, tmb_arr, pi, callback){
		
		var reader = new FileReader();
		reader.onloadend = function() {
			var tempImg = new Image();
		    tempImg.src = reader.result;
		    tempImg.onload = function(){
		        var o_obj = imgResizeByCanvas(this,0,0,ori_arr[0],ori_arr[1],ori_arr[2]);
		        var t_obj = imgResizeByCanvas(this,0,0,tmb_arr[0],tmb_arr[1],tmb_arr[2]);

				getChatAvatarUploadUrl(this_gi, ti, 1, pi).complete(function(data){
		    		cns.debug("!");
		    	
					if(data.status == 200){
						var s3url_result = $.parseJSON(data.responseText);
						var fi = s3url_result.fi;
				    	var s3_url = s3url_result.tu;
				    	var s32_url = s3url_result.ou;

				    	//傳大圖
				    	uploadImgToS3(s32_url,o_obj.blob).complete(function(data){
				    		if(data.status == 200){

				    			//傳小圖 已經縮好囉
					    		uploadImgToS3(s3_url,t_obj.blob).complete(function(data){

					        		if(data.status == 200){
					        			var tempW = this.width;
										var tempH = this.height;
										
										//mime type
										var md = {};
					        			md.w = o_obj.w;
					        			md.h = o_obj.h;

					        			uploadChatAvatarCommit(fi, o_obj.blob.size).complete(function(data){
					        				if(data.status == 200){
						        				var commit_result = $.parseJSON(data.responseText);

						        				var data = {
						        					fi:fi,
						        					tu:commit_result.tu,
						        					ou:commit_result.ou
						        				}
							                	if(callback) callback(data);
							                } else {
							                	if(callback) callback();
							                }
						                	return;
					        			}); //end of uploadCommit

					        		} else {
										if(callback)	callback();
									} //end of small uploadImgToS3 200
					    		}); //end of small uploadImgToS3

				    		} else {
								if(callback)	callback();
							} //end of big uploadImgToS3 200
			        	}); //end of big uploadImgToS3
					
					} else{
						if(callback)	callback();
					} //end of getUrl 200
				}); //end of getUrl
			}
		}
		reader.readAsDataURL(file);
	}

	function noMoreHistoryMsg() {
		g_isEndOfHistory = true;
		$("#chat-loading-grayArea").hide();
		$("#chat-loading").hide();
		$("#chat-nomore").show();
	}


	/**
	              ███████╗████████╗ ██████╗ ██████╗  █████╗  ██████╗ ███████╗          
	              ██╔════╝╚══██╔══╝██╔═══██╗██╔══██╗██╔══██╗██╔════╝ ██╔════╝          
	    █████╗    ███████╗   ██║   ██║   ██║██████╔╝███████║██║  ███╗█████╗      █████╗
	    ╚════╝    ╚════██║   ██║   ██║   ██║██╔══██╗██╔══██║██║   ██║██╔══╝      ╚════╝
	              ███████║   ██║   ╚██████╔╝██║  ██║██║  ██║╚██████╔╝███████╗          
	              ╚══════╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝          
	                                                                                   
	 */

	$.userStorage = function (value) {
		if (value) {
			window.opener.QmiGlobal.groups = value;
		} else {
			return window.opener.QmiGlobal.groups;
		}
	};

})
