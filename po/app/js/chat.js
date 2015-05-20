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
var g_lastMsgEi = 0;
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
var window_focus = true;
var g_isReadPending = false;
var g_tu;
var g_firstLoadingProcess = 1;
var g_currentScrollToDom = null;

/*
 ███████╗███████╗████████╗██╗   ██╗██████╗
 ██╔════╝██╔════╝╚══██╔══╝██║   ██║██╔══██╗
 █████╗    ███████╗█████╗     ██║   ██║   ██║██████╔╝    █████╗
 ╚════╝    ╚════██║██╔══╝     ██║   ██║   ██║██╔═══╝     ╚════╝
 ███████║███████╗   ██║   ╚██████╔╝██║
 ╚══════╝╚══════╝   ╚═╝    ╚═════╝ ╚═╝
 */
$(document).ready(function () {
	try {
		var gui = require('nw.gui');
		var win = gui.Window.get();
		win.width = 450;
	} catch (e) {
		cns.debug("not node-webkit");
		if (window.opener) {
			window.resizeTo(Math.min(450, $(window.opener).width()), window.opener.outerHeight);
		} else {
			window.resizeTo(450, 800);
		}
	}

	// window.moveTo( window.opener.screenX+20, window.opener.screenY+20 );

	$.changePage("#page-chat");

	$(".page-back").off("click");
	$(document).off("ajaxSend");

	g_oriFooterHeight = $("#footer").height();
	// $(".title").click(function(){
	// 	updateChat();
	// });

	//沒有登入資訊 就導回登入頁面
	if (!$.lStorage("_chatRoom")) {
		document.location = "login.html";
	}

	var _loginData = $.lStorage("_chatRoom");

	gi = _loginData.gi;
	ui = _loginData.ui;
	at = _loginData.at;
	ci = _loginData.ci;

	var page = $("#page-chat");
	page.attr("data-gi", gi);
	page.attr("data-ci", ci);

	var userData = $.userStorage();
	if (!userData) {
		document.location = "login.html";
	}

	// cns.debug( JSON.stringify(userData) );
	//所有團體列表
	g_group = userData[gi];
	if (null == g_group) return;
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

	//get name
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

	//load language
	updateLanguage(lang);

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
	sendBtn.click(sendChat);
	var input = $("#footer .contents .input");
	// input.autosize({append: "\n"});
	input.off("keydown").off("keypress");
	// input.off("keydown").off("keypress");
	// input.keydown(function(e){
	//     if (e.keyCode == '8' || e.keyCode=='46'){	//backspace or delete
	//     	setTimeout(updateChatContentPosition,50);
	//     }
	// });

	input.keypress(function (e) {
		if (e.keyCode == '13' && !e.altKey) {
			sendChat();
			// return false;
		}
	});

	input.off("keydown").keydown(function () {
		setTimeout(updateChatContentPosition, 50);
	});
	input.html("");

	$(document).find("title").text(g_cn + " - Qmi");

	$("#chat-toBottom").off("click");
	$("#chat-toBottom").click(scrollToBottom);

	$("#chat-toBottom").off("resize");
	// $(window).resize(resizeContent);
	$(".input").data("h", $(".input").innerHeight());

	//other (img only now)
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
				sendImage(this_grid);
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
					sendVideo(this_grid);
				}, function (videoTag) {
					var parent = videoTag.parents(".msg-video");
					parent.addClass("error");
					parent.find(".download").remove();
				});
			} else {
				// this_grid.find("div").html('<span>file not supported</span>');
				popupShowAdjust("",
					$.i18n.getString("COMMON_NOT_MP4"),
					$.i18n.getString("COMMON_OK")
				);
			}
		});

		//每次選擇完檔案 就reset input file
		file_ori.replaceWith(file_ori.val('').clone(true));
	});

	$(".input-emoji").off("click").click(function () {
		if (0 == g_extraSendOpenStatus) {
			g_extraSendOpenStatus = 2;
			$("#footer").animate({bottom: 0}, 'fast');
			// $("#chat-contents").animate({marginBottom:200},'fast');
			updateChatContentPosition();
			$(this).addClass("active");
		} else if (2 == g_extraSendOpenStatus) {
			g_extraSendOpenStatus = 0;
			$("#footer").animate({bottom: -205}, 'fast');
			// $("#chat-contents").animate({marginBottom:0},'fast');
			updateChatContentPosition();
			$(this).removeClass("active");
		} else {
			g_extraSendOpenStatus = 2;
			$(this).addClass("active");
		}
		// cns.debug("emoji: ", g_extraSendOpenStatus);
	});
	// resizeContent();

	$("#container").on("mousewheel", onScrollContainer);
	$("#container").scroll(onScrollContainer);
	$("html, body").scroll(onScrollBody);

	$("button.pollingCnt").off("click").click(updateChatCnt);
	$("button.pollingMsg").off("click").click(function () {
		updateChat(g_room.lastCt, true);
	});

	var enterTime = new Date();

	setInterval(function () {
		checkPagePosition();
	}, 300);

	//init sticker
	initStickerArea.init($(".stickerArea"), sendSticker);

	//set sticker sync events
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

	$(document).on('mousedown', '.chat-msg-bubble-left, .chat-msg-bubble-right', function (e) {
		$(this).addClass("active");
	});
	$(document).on('blur mouseleave', '.chat-msg-bubble-left.active, .chat-msg-bubble-right.active', function (e) {
		$(this).removeClass("active");
	});

	$("#header .title .text, #header .title .count").click(function () {
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
		showMemListPage($("#pagesContainer"), $.i18n.getString("COMMON_MEMBER"), [{title: "", ml: tmpData}],
			function () {
				cns.debug("on page change done");
			}, function (isDone) {
				// scrollToBottom();
				setTimeout(function () {
					checkPagePosition();
					$("#page-chat").removeClass("transition");
				}, 500);
				$("#page-select-object").remove();
				cns.debug("on back from memList");
			});
	});

	$(document).on("click", ".chat-cnt", function () {
		showChatReadUnreadList($(this));
	});

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
			}
			;

		window.frame.on("focus", windowFocusHandler);
		window.frame.on("blur", windowBlurHandler);
		window.addEventListener("focus", windowFocusHandler);
		window.addEventListener("blur", windowBlurHandler);
	} catch (e) {
		cns.debug("windows focus detection not work");
	}

	$(document).on("click", ".msg-video.loaded:not(.playing)", function () {
		var thisTag = $(this);
		var videoTag = thisTag.find("video");
		if (videoTag.length > 0) {
			var header = $("#header");
			header.slideUp();
			var footer = $("#footer");
			footer.animate({bottom: "-255px"});
			var containerTmp = $("#container");
			var oriOffset = containerTmp.scrollTop();
			containerTmp.css("top", "0").css("height", "100%");
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

				containerTmp.css("top", "65px").css("height", "-webkit-calc( 100vh - 116px )").scrollTop(oriOffset);
				// containerTmp.animate({top:"65px",height:"-=116"},function(){
				// 	containerTmp.css("height","-webkit-calc( 100vh - 116px )");
				// 	containerTmp.scrollTop(oriOffset);
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


	//apply nicescroll
	var container = $("#container");
	container.niceScroll({
		// styler:"fb",
		cursorcolor: "rgba(210, 210, 210, 0.8)",
		cursorwidth: '8',
		cursorborderradius: '10px',
		background: 'rgba(255,255,255,0)',
		cursorborder: "",
		boxzoom: false
		// zindex: 999
		// horizrailenabled: false,
		// ,autohidemode: "leave"
	});
	var niceScrollTmp = container.getNiceScroll()[0];
	niceScrollTmp.onDragToTop = onDragContainer;

	updateChat(null,true);
	sendMsgRead(new Date().getTime())
});

/*
 ███████╗██╗   ██╗███╗   ██╗ ██████╗████████╗██╗ ██████╗ ███╗   ██╗
 ██╔════╝██║   ██║████╗  ██║██╔════╝╚══██╔══╝██║██╔═══██╗████╗  ██║
 █████╗    █████╗  ██║   ██║██╔██╗ ██║██║        ██║   ██║██║   ██║██╔██╗ ██║    █████╗
 ╚════╝    ██╔══╝  ██║   ██║██║╚██╗██║██║        ██║   ██║██║   ██║██║╚██╗██║    ╚════╝
 ██║     ╚██████╔╝██║ ╚████║╚██████╗   ██║   ██║╚██████╔╝██║ ╚████║
 ╚═╝      ╚═════╝ ╚═╝  ╚═══╝ ╚═════╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝
 */

function updateChatContentPosition() {
	var staus = (0 == g_extraSendOpenStatus);
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
		// if( g_isEndOfPage ) scrollToBottom();
	}
}

function resizeContent() {
	var tmp = (0 == g_extraSendOpenStatus) ? 200 : 0;
	// cns.debug( $( window ).height(), $("#header").height(), $("#chat-loading").height());
	$("#container").css("min-height",
		$(window).height()
		- $("#header").height()
		- ($("#footer").height() - tmp)
		+ $("#chat-loading").height()
	);
}

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
	// getHistoryMsg( false );

	scrollToBottom();

	// updateChat(g_room.lastCt, true);
}

//show history chat contents
function getHistoryMsg(bIsScrollToTop) {
	if (g_bIsLoadHistoryMsg) {
		cns.debug("!");
		return;
	}
	var container = $("#container");
	// $("#container").off("scroll");
	g_bIsLoadHistoryMsg = true;

	$("#chat-loading-grayArea").hide();
	$("#chat-loading").show();
	console.debug("----- getHistoryMsg", bIsScrollToTop, " ------");
	g_idb_chat_msgs.limit(function (list) {
		var firstDayDiv = $("#chat-contents .chat-date-tag");
		// firstDayDiv = $(firstDayDiv[0]).next();
		// if(firstDayDiv.length>0){
		// 	firstDayDiv.before("<div>not read</div>");
		// 	firstDayDiv = firstDayDiv.prev();
		// }
		var scrollToDiv = (firstDayDiv.length > 0 ) ? firstDayDiv[0] : null;
		var currentFirstDiv = (scrollToDiv) ? $(scrollToDiv).next().children("div:eq(0)")[0] : null;

		//add red border to fist dom to test current position
		// $(".sdfsfg").removeClass("sdfsfg").css("border", "");
		// currentFirstDiv.addClass("sdfsfg").css("border", "1px solid red");

		//cns.debug("list:",JSON.stringify(list,null,2));
		if (list.length > 0) {
			//list is from near to far day
			for (var i in list) {
				if (null == list[i] || null == list[i].ei || g_msgs.indexOf(list[i].ei) >= 0) {
					continue;
				} else {
					var object = list[i].data;
					showMsg(object, null);
					// if(currentFirstDiv){
					// 	currentFirstDiv.scrollIntoView();
					// 	// $("#chat-contents").scrollTop( $("#chat-contents").scrollTop()+50 );
					// }
				}
			}
			if (isUpdatePermission) getPermition(true);

			// sendMsgRead(g_currentDate.getTime());


			if (bIsScrollToTop) {
				// container.scroll( onScrollContainer );
				g_bIsLoadHistoryMsg = false;
				console.debug("---- end loading -----");
			} else {
				// setTimeout( hideLoading, 1000);
			}
			updateChatCnt();
		}


		if (0 == g_firstLoadingProcess) {
			if (list.length < 20) {
				//not enough history in db, fetch from server
				updateChat(g_lastDate.getTime(), false, currentFirstDiv);
			} else {
				setTimeout(function () {
					g_bIsLoadHistoryMsg = false;
					//end loading history, hide loading & scroll to last dom we were at
					hideLoading($(currentFirstDiv));
				}, 200);
			}
		} else {
			g_bIsLoadHistoryMsg = false;
			//first time loading finished,
			// scroll to bottom
			scrollToBottom();

			$("#chat-loading").hide();
			$("#chat-loading-grayArea").show();
			if (g_firstLoadingProcess > 0) g_firstLoadingProcess--;
		}
		console.debug("---- end loading -----");
	}, {
		index: "gi_ci_ct",
		keyRange: g_idb_chat_msgs.makeKeyRange({
			upper: [gi, ci, g_lastDate.getTime()],
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

	// if( null==getHistoryMsgTimeout ){
	// 	if( g_bIsLoadHistoryMsg ) {
	// 		getHistoryMsgTimeout = setTimeout(function(){
	// 			g_bIsLoadHistoryMsg = false;
	// 			hideLoading();
	// 			getHistoryMsgTimeout = null;
	// 		}, 2000);
	// 	}
	// }
}

function hideLoading(targetScrollTo) {
	if (!$("#page-chat").is(":visible")
		|| $("#page-chat").hasClass("transition")
		|| g_bIsEndOfHistory) return;

	cns.debug("-- hideLoading start --");
	$("#chat-loading").stop().fadeOut(function () {
		if (false == g_bIsEndOfHistory) {
			$("#chat-loading-grayArea").show();
		}
		// if( targetScrollTo) targetScrollTo = targetScrollTo.prev();
		if (targetScrollTo && targetScrollTo.length > 0) {
			targetScrollTo[0].scrollIntoView();
			g_currentScrollToDom = targetScrollTo[0];
		} else {
			var container = $("#container");
			var loading = container.children("#chat-loading");
			var posi = container.scrollTop();
			if (posi <= loading.height()) {
				var content = $("#chat-contents");
				// if( content.length>0 ){
				// 	content[0].scrollIntoView();
				// }
				container.scrollTop(content.offset().top);
			}
		}
		cns.debug("-- hideLoading end --");
	});
	// // firstDom.css("background", "red");
	// var tmp = loading.offset();
	// if( tmp ){
	// 	var offset = loading.offset().top+loading.height();
	// 	$('html, body').scrollTop( offset );
	// }
	// g_bIsLoadHistoryMsg = false;

}

function op(url, type, data, delegate, errorDelegate) {
	var result = ajaxDo(url, {
		ui: ui,
		at: at,
		li: lang
	}, type, false, data);
	result.error(function (jqXHR, textStatus, errorThrown) {
		console.log(textStatus, errorThrown);
		if (errorDelegate) errorDelegate();
	});
	result.success(function (data, status, xhr) {
		if (delegate) delegate(data, status, xhr);
	});
	return result;
	// $.ajax({
	// 	// url: "https://caprivateeim.mitake.com.tw/apiv1" + url,
	//     url: "https://ap.qmi.emome.net/apiv1" + url,
	//     type: type,
	//     data: data,
	//     dataType: "json",
	//     headers: {
	// 		ui: ui,
	// 		at: at,
	// 		li: "TW"
	//     },
	//     success: delegate,
	//     error: function(jqXHR, textStatus, errorThrown) {
	// 	  console.log(textStatus, errorThrown);
	// 	  if( errorDelegate ) errorDelegate();
	// 	}
	// });
}

function scrollToStart() {
	$('#container').stop(false, true).animate({scrollTop: 50}, 'fast');
}

function scrollToBottom() {
	// cns.debug( "scrollToBottom", $(document).height()+50  );
	$('#container').stop(false, true).animate({scrollTop: $("#chat-contents").height() + 50}, 'fast');
	g_isEndOfPage = true;
}

function checkPagePosition() {
	if (!$("#page-chat").is(":visible") || $("#page-chat").hasClass("transition")) return;

	var currentTime = new Date().getTime();
	if (currentTime >= g_isEndOfPageTime) {
		// if( g_isEndOfPage ){
		// 	var container = $('#container');
		// 	if( container.length>0 ){
		// 		var posi = container.scrollTop();

		// 		var height = container.height();
		// 		var docHeight = container[0].scrollHeight;
		// 		var isAtBottom = ((posi + height+5) >= docHeight);
		// 		// if( !isAtBottom )	scrollToBottom();

		// 		$("#chat-toBottom").fadeOut('fast');
		// 	}
		// } else{
		// 	$("#chat-toBottom").fadeIn('fast');
		// }

		var container = $('#container');
		if (container.length > 0) {
			var posi = container.scrollTop();
			var height = container.height();
			var docHeight = container[0].scrollHeight;
			var isAtBottom = ((posi + height + 35) >= docHeight);
			// cns.debug(isAtBottom, posi, height, docHeight);
			// if( !isAtBottom )	scrollToBottom();

			if (isAtBottom) $("#chat-toBottom").fadeOut('fast');
			else $("#chat-toBottom").fadeIn('fast');
			g_isEndOfPage = isAtBottom;
		}
		g_isEndOfPageTime = currentTime + 1000;
	}
	// if( g_isEndOfPage != isAtBottom ){
	// 	// if( !isAtBottom) cns.debug(height, docHeight, (posi + height), docHeight );
	// 	if(g_isEndOfPage) $("#chat-toBottom").fadeOut('fast');
	// 	else $("#chat-toBottom").fadeIn('fast');
	// }
}

function getGroupMemberFromData(g_uid) {
	if (!g_group["guAll"][g_uid])    return null;

	return g_group["guAll"][g_uid];
}

function getChatMem(groupUID) {
	return getGroupMemberFromData(groupUID);
}

function getChatMemName(groupUID) {
	var mem = getGroupMemberFromData(groupUID);
	if (null == mem)   return "unknown";
	return mem.nk;
}

function updateChat(time, isGetNewer, firstScrollDom) {
	console.debug("-------- updateChat", isGetNewer, time, " ---------");
	var api = "groups/" + gi + "/chats/" + ci + "/messages";
	if (time) {
		api += "?ct=" + time;
		if (null != isGetNewer) {
			if (true == isGetNewer) api += "&d=true";
			else api += "&d=false";
		}
	}

	var scrollToDom = ( false == isGetNewer && null != firstScrollDom && firstScrollDom.length > 0 ) ? firstScrollDom[0] : null;

	console.debug(api);
	op(api, "GET", "", function (data, status, xhr) {
			var userData = $.userStorage();
			g_group = userData[gi];
			g_room = g_group["chatAll"][ci];
			if (null == g_room.lastCt) g_room.lastCt = 0;
			var isEndOfPageTmp = g_isEndOfPage;
			for (var i = (data.el.length - 1); i >= 0; i--) {
				var object = data.el[i];
				if (object.hasOwnProperty("meta")) {

					if (object.meta.ct > g_room.lastCt) {
						g_room.lastCt = object.meta.ct;
						console.debug(object.meta.ct); //, new Date(object.meta.ct)
					}
					//showMsg(container, data.el[key], time);

					//pass shown msgs
					if (g_msgs.indexOf(object.ei) >= 0) {
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
						try {
							g_idb_chat_msgs.put(node);
						} catch (e) {

						}


						showMsg(object);
						if (scrollToDom) scrollToDom.scrollIntoView();
						// isUpdateFinish = false;
					}
				}
			}
			$.userStorage(userData);

			if (isUpdatePermission) getPermition(true);

			//getting new msg
			if (isGetNewer || null == time) {

				//update finished
				if (data.el.length <= 1) {
					//if first enter
					if (1 >= g_firstLoadingProcess) {
						//if server only response 'few' msg
						// & no time specified, there might be history msgs
						if (g_msgs.length < 20 && null != time && false == g_bIsEndOfHistory) getHistoryMsg();
						else {
							if (g_firstLoadingProcess > 0) g_firstLoadingProcess--;
							console.debug("----- finished new ", data.el.length, isGetNewer, " -----");
							//the few msgs r all msgs in this chatroom
							//first time in, so scroll to bottom
							scrollToBottom();
							//hide loading
							if (false == g_bIsEndOfHistory) {
								$("#chat-loading").hide();
								$("#chat-loading-grayArea").show();
							}
							sendMsgRead();
						}
					} else { //not first time in
						//just scroll to bottom if we were at bottom
						sendMsgRead();
						if (isEndOfPageTmp) scrollToBottom();
					}
				} else { //update not finish
					console.debug("----- not finished new ", data.el.length, " -----");
					updateChat(g_room.lastCt, isGetNewer);
				}
			} else { //getting old msgs
				console.debug("----- finished old ", data.el.length, isGetNewer, " -----");

				setTimeout(function () {
					g_bIsLoadHistoryMsg = false;
					//no more history
					if (1 >= data.el.length) {
						g_bIsEndOfHistory = true;
						$("#chat-loading-grayArea").hide();
						$("#chat-loading").hide();
						$("#chat-nomore").show();
						// $("#chat-loading").fadeOut( function(){
						// $("#chat-nomore").show();
						// });
						// $("#chat-loading-grayArea").hide();
						// $('#container').scrollTop(0);
					} else {
						//scroll to the last dom we were at
						hideLoading(firstScrollDom);
					}
				}, 500);


				updateChatCnt();
			}

		},	//end of onsucc function
		function () {
			if (false == isGetNewer) {
				popupShowAdjust("", $.i18n.getString("COMMON_CHECK_NETWORK"));
				hideLoading();
			}
		}	//end of onerror function
	);	//end of op
}	//end of updateChat

function updateChatCnt() {
	var userData = $.userStorage();
	// cns.debug( JSON.stringify(userData) );
	g_group = userData[gi];
	g_room = g_group["chatAll"][ci];


	if (null == g_room || null == g_room.cnt || length <= 0) return;

	var length = Object.keys(g_room.cnt).length;
	var list = g_room.cnt;
	// cns.debug("list:",JSON.stringify(list,null,2));
	var index = length - 1;
	var data = list[index];
	var cnt = data.cnt;
	var elements = $(".chat-cnt");
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

	//scroll to bottom
	if (g_needsRolling) {
		g_needsRolling = false;
		scrollToBottom();
	}
}

function getFormatTimeTag(date) {
	return date.customFormat("#YYYY#/#M#/#D# #CD# #DDD#");
}

function getFormatMsgTimeTag(date) {
	return date.customFormat("#hhh#:#mm#");
}

function showMsg(object, bIsTmpSend) {
	if (null == object) return;
	bIsTmpSend = bIsTmpSend || false;

	g_msgs.push(object.ei);
	//cns.debug("list:",JSON.stringify(object,null,2));

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
				cns.debug($(allTimeTag[i]).data("time"));
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
		// if(time.getTime()<g_lastDate){
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

	if (time.getTime() < g_lastDate) {
		g_lastDate = time;
	}
	if (time.getTime() > g_currentDate) {
		g_currentDate = time;
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

	g_msgsByTime[object.meta.ct] = div;


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
					popupShowAdjust("", $.i18n.getString("CHAT_FAIL_SENDING_MSG"), true, true, [sendInput, container]);
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
		var mem = getChatMem(object.meta.gu)

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
			showMap(msgData, msgDiv);
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

	return container;
}

function showMap(msgData, container) {
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
	//write msg to db
	g_idb_chat_msgs.put(node);
	var dom = showMsg(newData);
	return dom;
}

function sendInput(dom) {
	dom.find(".chat-msg-load-error").removeClass("chat-msg-load-error").addClass("chat-msg-load");
	var tmpData = dom.data("data");
	if (null == tmpData)    return;
	try {

		switch (tmpData.ml[0].tp) {
			case 0: //text
			case 5: //sticker
				sendText(dom);
				break;
			case 6: //img
				sendImage(dom);
				break;
			case 7: //video
				sendVideo(dom);
				break;
		}
	} catch (e) {
		errorReport(e);
		dom.find(".chat-msg-load").removeClass("chat-msg-load").addClass("chat-msg-load-error");
	}
}

function sendText(dom) {
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
			//delete old data
			g_idb_chat_msgs.remove(tmpData.ei);
			dom.remove();

			// cns.debug("recv", dd.ct, new Date(dd.ct));
			//add new data to db & show
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
			g_idb_chat_msgs.put(node);

			showMsg(newData);

			// if( g_isEndOfPage ) scrollToBottom();
			// scrollToBottom();

			if (parent && false == parent.closed) {
				var tmp = $(opener.document).find(".subpage-chatList .update");
				if (tmp && tmp.length > 0) {
					tmp.attr("data-gi", gi);
					tmp.attr("data-ci", ci);
					tmp.trigger("click");
				}
			}
		},
		function () {
			dom.find(".chat-msg-load").removeClass("chat-msg-load").addClass("chat-msg-load-error");
			// if( g_isEndOfPage ) scrollToBottom();
			// scrollToBottom();
		}
	);
}

function sendImage(dom) {
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

	// if( ""!=tmpData.ml[0].c ){
	// 	sendText(dom);
	// } else {
	var ori_arr = [1280, 1280, 0.9];
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
			g_idb_chat_msgs.put(node);

			dom.data("data", tmpData);

			sendText(dom);
		} else {
			dom.find(".chat-msg-load").removeClass("chat-msg-load").addClass("chat-msg-load-error");
			// if( g_isEndOfPage ) scrollToBottom();
		}
	});
	// }
}
function sendVideo(dom) {
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

	// if( ""!=tmpData.ml[0].c ){
	// 	sendText(dom);
	// } else {
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
			g_idb_chat_msgs.put(node);

			dom.data("data", tmpData);

			sendText(dom);
		} else {
			dom.find(".chat-msg-load").removeClass("chat-msg-load").addClass("chat-msg-load-error");
			// if( g_isEndOfPage ) scrollToBottom();
		}
	});
	// }
}

function sendChat() {
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
	sendInput(dom);
}

sendSticker = function (id) {
	if (id.length <= 0) return;

	var dom = showUnsendMsg(id, 5);
	sendInput(dom);
}

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

	var result = ajaxDo(api_name, headers, method, true, body);
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

						// if(g_isEndOfPage){
						// 	scrollToBottom();
						// }
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

function getPermition(isReget) {
	//若沒有聊天室權限, 重新取得
	if (true == isReget || !g_room.hasOwnProperty("memList") || !g_room.hasOwnProperty("pi") || g_room.pi.length <= 0) {
		try {
			isUpdatePermission = false;
			if (isGettingPermission) return;
			isGettingPermission = true;
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
					if (g_room.memCount > 2) {
						$("#header .count").show();
						$("#header .count").html("(" + g_room.memCount + ")");
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
					isGettingPermission = false;
					// cns.debug( JSON.stringify(pData) );

					// pi = pData.pi;
					pi = 0;
					userData = $.userStorage();
					g_group = userData[gi];
					g_room = g_group["chatAll"][ci];
					g_room.pi = pi;
					g_room.tu = g_tu;
					g_tu = data.ul;
					$.userStorage(userData);
					// 	},
					// 	null
					// );
				},
				null
			);
		} catch (e) {
			cns.debug("[!]" + e.message);
			isGettingPermission = false;
		}
	} else {
		//set pi to 0
		pi = 0;
		// pi = g_room.pi;

		g_tu = g_room.tu;
	}
}

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

function leaveRoomAPI(ciTmp, callback) {
	op("groups/" + gi + "/chats/" + ciTmp + "/users", 'delete',
		null, function (pData, status, xhr) {
			cns.debug(status, JSON.stringify(pData));
			if (callback) callback(pData);
		},
		null
	);
}

function editMemInRoomAPI(ciTmp, method, list, callback) {
	var sendData = {ul: list};
	op("groups/" + gi + "/chats/" + ciTmp + "/users", method,
		sendData, function (pData, status, xhr) {
			cns.debug(status, JSON.stringify(pData));
			if (callback) callback(pData);
		},
		null
	);
}

function delMember() {
	cns.debug("delMember");

	try {
		var btn = $(".extra-content .btn[data-type='edit']");
		var tmpList = {};
		for (var gu in g_room.memList) {
			tmpList[gu] = g_group.guAll[gu].nk;
		}

		btn.data("exclude_str", JSON.stringify([g_group.gu]));
		btn.data("object_str", JSON.stringify(tmpList));
		btn.data("object_opt", {
			isShowGroup: false,
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

					// scrollToBottom();
					var memListString = btn.data("object_str");
					//on select done
					// send add mem to room api
					try {
						cns.debug(memListString);
						var memList = $.parseJSON(memListString);
						memList[g_group.gu] = g_group.guAll[g_group.gu].nk;
						var addList = [];
						var removeList = [];
						for (var guTmp in memList) {
							if (!g_room.memList.hasOwnProperty(guTmp)) {
								addList.push({gu: guTmp});
							}
						}
						for (var guTmp in g_room.memList) {
							if (!memList.hasOwnProperty(guTmp)) {
								removeList.push({gu: guTmp});
							}
						}
						var isSend = false;
						if (addList.length > 0) {
							editMemInRoomAPI(ci, "post", addList, function (data) {
								if (isSend) {
									getPermition(true);
									updateChat();
								}
								isSend = true;
							});
						} else {
							isSend = true;
						}
						if (removeList.length > 0) {
							editMemInRoomAPI(ci, "put", removeList, function (data) {
								if (isSend) {
									getPermition(true);
									updateChat();
								}
								isSend = true;
							});
						} else {
							isSend = true;
						}
					} catch (e) {
						cns.debug("[!]" + e.message);
					}
				}
				// scrollToBottom();
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

function addMember() {
	cns.debug("addMember");

	try {
		var btn = $(".extra-content .btn[data-type='invite']");

		var tmpList = [];
		for (var gu in g_room.memList) {
			tmpList.push(gu);
		}
		btn.data("exclude_str", JSON.stringify(tmpList));
		btn.data("object_str", "");
		btn.data("object_opt", {
			isShowGroup: false,
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
							showCreateMultipleChatPage_chatroom(list, {});
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
							newList.push({gu: guTmp});
						}
						editMemInRoomAPI(ci, "post", newList, function (data) {
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
			}, false
		);
	} catch (e) {
		errorReport(e);
	}
}

function showAlbum() {
	showAlbumPage(gi, ci, ci, g_cn);
}

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

function onScrollContainer(e) {
	if (!$("#page-chat").is(":visible") || $("#page-chat").hasClass("transition")) return;

	// cns.debug(e.originalEvent.wheelDelta);
	var posi = $(this).scrollTop();
	if (g_bIsLoadHistoryMsg) {
		cns.debug("scroll blocking ", posi);
		e.stopPropagation();
		e.preventDefault();
		return;
	}
	if (!g_bIsEndOfHistory && posi <= $("#chat-loading").outerHeight() * 0.5) {
		// cns.debug("!");
		getHistoryMsg(false);
		// g_isEndOfPage = false;
		return;
	}
	var height = $(window).height();
	var docHeight = $(document).height();
	var isAtBottom = ((posi + height + 5) >= docHeight);
	// if( g_isEndOfPage != isAtBottom ){
	// 	g_isEndOfPage = isAtBottom;
	// 	g_isEndOfPageTime = new Date().getTime();
	// 	// cns.debug("!");
	// }
}
function onDragContainer() {
	if (!g_bIsEndOfHistory) getHistoryMsg(false);
}
function onScrollBody(e) {
	if (g_bIsLoadHistoryMsg) {
		cns.debug("prevent!");
		e.stopPropagation();
		e.preventDefault();
		return;
	}
}

/*
              ██████╗ ███████╗ █████╗ ██████╗     ██╗     ██╗███████╗████████╗          
              ██╔══██╗██╔════╝██╔══██╗██╔══██╗    ██║     ██║██╔════╝╚══██╔══╝          
    █████╗    ██████╔╝█████╗  ███████║██║  ██║    ██║     ██║███████╗   ██║       █████╗
    ╚════╝    ██╔══██╗██╔══╝  ██╔══██║██║  ██║    ██║     ██║╚════██║   ██║       ╚════╝
              ██║  ██║███████╗██║  ██║██████╔╝    ███████╗██║███████║   ██║             
              ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═════╝     ╚══════╝╚═╝╚══════╝   ╚═╝             
                                                                                        
*/

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
		// if( false== g_bIsLoadHistoryMsg){
		// 	hideLoading();
		// }
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


function showCreateMultipleChatPage_chatroom(newChatMemList, newChatFavList) {
	$("#page-chat").addClass("transition");
	try {
		if (newChatMemList.hasOwnProperty(g_group.gu)) {
			delete newChatMemList[g_group.gu];
		}
		g_newChatMemList = Object.keys(newChatMemList);

		if (null == newChatFavList) g_newChatFavList = [];
		else g_newChatFavList = Object.keys(newChatFavList);

		showNewRoomDetailPage_chatroom(newChatMemList, newChatFavList);
	} catch (e) {
		cns.debug("[!]showNewRoomPage", e.message);
		errorReport(e);
	}
}

function showNewRoomDetailPage_chatroom() {

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

	requestNewChatRoomApi(gi, text, arr, g_newChatFavList, function (data) {
		var page = $("#page-chat");
		gi = page.attr("data-gi");

		if (window.opener) {
			var parent = $(window.opener.document);
			var tmp = parent.find(".chatList-add-done");
			tmp.attr("data-gi", gi);
			tmp.attr("data-ci", data.ci);
			tmp.trigger("click");
			// $(window.opener)[0].focus();
		}
		gi = page.attr("data-gi");
		ci = page.attr("data-ci");
		var userData = $.userStorage();
		g_group = userData[gi];
		g_room = g_group["chatAll"][ci];
	}, false);
	$.popAllPage();
}


/*
 ███████╗████████╗ ██████╗ ██████╗  █████╗  ██████╗ ███████╗
 ██╔════╝╚══██╔══╝██╔═══██╗██╔══██╗██╔══██╗██╔════╝ ██╔════╝
 █████╗    ███████╗   ██║   ██║   ██║██████╔╝███████║██║  ███╗█████╗      █████╗
 ╚════╝    ╚════██║   ██║   ██║   ██║██╔══██╗██╔══██║██║   ██║██╔══╝      ╚════╝
 ███████║   ██║   ╚██████╔╝██║  ██║██║  ██║╚██████╔╝███████╗
 ╚══════╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝

 */

$.userStorage = function (value) {
	if (value) {
		window.opener.g_uiData = value;
	} else {
		return window.opener.g_uiData;
	}
};