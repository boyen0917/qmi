var ui,
	at,
	//國碼
	countrycode = "+886",

	gi,

	//語言
	lang = "en_US",

	//local測試 預設開啟console
	debug_flag = false,

	clearChatTimer,

	
	//HiCloud
 	base_url = "https://apserver.mitake.com.tw/apiv1/";

 	// // container riseNotification 一旦換網址就沒了

var userLang = navigator.language || navigator.userLanguage; 
	userLang = userLang.replace(/-/g,"_").toLowerCase();


String.prototype._escape = function(){
    return this.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

String.prototype.qmiTag = function (tagMember) {
	var findText = "///;" + tagMember.u + ";///";
	var markTag = "<b name='" + tagMember.u + "'>" + tagMember.n + "</b>";

	return this.replace(findText, markTag);
}


if( 0==userLang.indexOf("zh") ){
	if( userLang=="zh_cn" ){
		lang = "zh_CN";
	} else {
		lang = "zh_TW";
	}
}

	//動態消息的字數限制
var content_limit = 400,

	//計算螢幕長寬以維持比例
	proportion = 1.7,

	//上一頁按鈕不需要記錄
	back_button = false,
	//部分跳頁不需要記錄
	back_exception = false,
	back_hash = false;


//上一頁 預設
// $(document).data("page-history",[["login"],["#page-group-menu","團體列表"]]);
$(document).data("page-history",[["",""]]);



//登入時間
if( window.parent && window.parent.login_time ){
	login_time = window.parent.login_time;
} else {
	login_time = new Date().getTime();
}

	
	//timeline裏面點擊不做展開收合的區域
var timeline_detail_exception = [
		".st-sub-box-2-content-detail a",
		".st-sub-box-2-more-desc-detail a",
		".st-box2-more-task-area-detail",
		".audio-play",
		".st-sub-box-more-btn",
		".st-more-close",
		".st-user-pic",
		".st-sub-box-more",
		".st-sub-box-2-attach-area"
	],

	//timeline內容 判斷不開啓附檔區域的type ;1是網址 但要另外判斷
	not_attach_type_arr = [0,1,12,13,14,15],

	//顯示loading 圖示 的參數
	load_show = false,

	//特別的
	s_load_show = false,

	//ajax 提示訊息選擇
	ajax_msg = false,

	//預設使用者大頭照
	no_pic = "images/common/others/empty_img_personal_xl.png",

	//預設使用者大頭照 size
	avatar_size = 60,

	//ajax 使用次數
	ajax_count = 0,

	//timeline圖片移動距離
	gallery_movement = 360,

	//發佈計時器
	compose_timer = false,

	//圖片上傳限制
	img_total = 9,

	//附檔區域開啓的type id 
	attach_mtp_arr = [1,6],

	//縮圖寬高
	max_w = 500,
	max_h = 500,
	quality = 0.5,


	//timeline置頂millisecond
	top_timer_ms = $.lStorage("_topTimeMs") || 5000;


	//polling間距
	polling_interval = 5000,

	//更新鈴鐺間距
	update_alert_interval = 10000,

	//tab對照表
	initTabMap = {
		0:{	
			act: "feed-public",
			textId: "LEFT_FEED_GROUP"
		},
		1:{	
			act: "feed-post",
			textId: "LEFT_FEED_MEMBER"
		},
		2:{	
			act: "feeds",
			textId: "LEFT_FEED",
			class: ["polling-cnt","polling-local"],
			pollingType: "A1"
		},
		3:{	
			act: "chat",
			textId: "LEFT_CHAT",
			class: ["polling-cnt","polling-local"],
			pollingType: "A3"
		},
		6:{	
			act: "memberslist",
			textId: "LEFT_MEMBER",
			class: ["polling-cnt","polling-local"],
			pollingType: "A2"
		},
		7:{	
			act: "groupSetting",
			textId: "GROUPSETTING_TITLE"
		},
		9:{	
			act: "addressBook",
			textId: "ADDRESSBOOK_TITLE"
		}
		,
		10:{	
			act: "fileSharing",
			textId: "FILESHARING_TITLE"
		}
	},

	//pen對照表
	initPenMap = {
		0:{	
			fcBox: "announcement",
			textId: "FEED_BULLETIN",
			imgNm: "bulletin"
		},
		1:{	
			fcBox: "feedback",
			textId: "FEED_REPORT",
			imgNm: "report"
		},
		2:{	
			fcBox: "work",
			textId: "FEED_TASK",
			imgNm: "task"
		},
		3:{	
			fcBox: "vote",
			textId: "FEED_VOTE",
			imgNm: "vote"
		},
		4:{	
			fcBox: "check",
			textId: "FEED_LOCATION",
			imgNm: "location"
		},
		5:{	
			fcBox: "post",
			textId: "FEED_POST",
			imgNm: "post"
		}
	};


window.QmiGlobal = {
	// 之後取代 ui, at, gi, ... etc
	currentGi: "",

	device: navigator.userAgent.substring(navigator.userAgent.indexOf("(")+1,navigator.userAgent.indexOf(")")),

	groups: {}, // 全部的公私雲團體資料 QmiGlobal.groups 
	clouds: {}, // 全部的私雲資料
	cloudGiMap: {},

	windowListCiMap: {},


	// 聊天室 auth
	auth: {},

	getObjectFirstItem: function(obj,last) {
		if(last === true){ 
			return obj[Object.keys(obj)[Object.keys(obj).length-1]];
		} else 	{
			return obj[Object.keys(obj)[0]];
		}
	},


	viewMap: {}
	
};

// polling異常監控
window.QmiPollingChk = {

	flag: false, // 聊天室不開啓

	cnt: 0, // 表示有在更新

	// 5分鐘檢查一次polling死了沒
	interval: setInterval(function() {
		//  聊天室不開啓
		if(window.QmiPollingChk.flag === false) return;

		var oriNum = window.QmiPollingChk.cnt;

		// 檢查 100秒內的cnt有沒有異常增加
		setTimeout(function(){
			var diff = window.QmiPollingChk.cnt - oriNum;

			// 嚴格來說 超過25次就不正常 30秒後重啟polling
			// 沒增加表示停了 也重啟
			if(diff > 25 || diff === 0) {
				console.log("polling異常 30秒後重啟");

				QmiGlobal.pollingOff = true;
				setTimeout(function(){
					console.log("30秒 重啟");
					QmiGlobal.pollingOff = false;
					polling();
				}, 30000);
			}
		}, 100000);
	}, 300000)
}

window.QmiAjax = function(args){

	var self = this,
		ajaxDeferred = $.Deferred(),

		// 判斷私雲api 
		cloudData = (function(){
		
			// 有指定url 加上不要私雲 最優先 ex: 公雲polling
			if(args.isPublicApi === true) 
				return undefined;

			// 有指定ci 直接給他私雲
			if(args.ci !== undefined) 
				return QmiGlobal.clouds[args.ci];

			// 判斷apiName有無包含私雲gi 有的話就給他私雲 
			if(args.apiName !== undefined){
				// 排除有網址有？的狀況
				var apiGi = args.apiName.split("?")[0].split("/").find(function(item){
					return QmiGlobal.groups.hasOwnProperty(item)
				});

				// api 包含 group id 而且 在私雲內 回傳私雲 否則回傳undefined 不往下做
				if(apiGi !== undefined) 
					return QmiGlobal.cloudGiMap.hasOwnProperty(apiGi) ? QmiGlobal.clouds[ QmiGlobal.cloudGiMap[apiGi].ci ] : undefined;
			}

			// 最後判斷 現在團體是私雲團體 就做私雲
			if(QmiGlobal.cloudGiMap[gi] !== undefined)
				return QmiGlobal.clouds[ QmiGlobal.cloudGiMap[gi].ci ];

		}()),

		newArgs = {
			url: (function(){
				// 指定url 
				if(args.url !== undefined) return args.url;

				// undefined 表示 不符合私雲條件 給公雲
				if(cloudData === undefined)
					return base_url + args.apiName;
				else
					return "https://" + cloudData.cl + "/apiv1/" + args.apiName;
			}()),
			// setHeaders: outerArgs,cloudData
			headers: self.setHeaders(args, cloudData),

			// timeout: 30000,

			type: (args.method  || args.type) || "get"
		};
	// end of var

	// 不是get 再加入body
	if(newArgs.type !== "get") newArgs.data = (typeof args.body === "string") ? args.body : JSON.stringify(args.body);

	// 將args帶來的多的參數補進去newArgs
	Object.keys(args).forEach(function(argsKey){
		if(newArgs.hasOwnProperty(argsKey) === false)
			newArgs[argsKey] = args[argsKey];
	});


	//before send
	if(args.isLoadingShow === true) {
		$(".ajax-screen-lock").show();
		$('.ui-loader').css("display","block");
	} 

	// 執行前 先看reAuth lock沒
	var reAuthTimer = setInterval(function reAuthInterval(){
		// locked! return!
		if(self.authLock.chk() === true) {
			cns.log("reAuth lock!");
			return reAuthInterval;
		} else {
			// 檢查是否接近過期時間 先替換token
			// ajaxArgs,cloudData

			self.expireChk({
				url: newArgs.url,
				noAuth: args.noAuth,
				cloudData: cloudData
			}).done(function(chk){
				// 發生錯誤
				if(chk.isSuccess === false) {
					ajaxDeferred.reject(chk.data);
					return;
				}
				// 有經過reAuth 更新headers
				// setHeaders: outerArgs,cloudData
				newArgs.headers = self.setHeaders(args, cloudData);

				// 印bug
				if(args.debug === true) cns.debug("newArgs", newArgs);

				// 執行
				$.ajax(newArgs).complete(function(apiData){
					// deferred chain -> 這邊可以省略 也可精簡 之後做 用一個deferred做reauth跟重新執行ajax
					// 1. 判斷是否reAuth
					// 2. reAuth之後重做原本的ajax
					// 3. 回到原本ajax的判斷
					(function(){
						// 1. 判斷是否reAuth
						var rspCode = function(){
								try {
									return JSON.parse(apiData.responseText).rsp_code;
								} catch(e) {
									return 999; // unexpected syntax, parse error
								}
							}(),
							reAuthDefChain = MyDeferred();

						// reAuth: token過期
						if( apiData.status === 401 
							&& rspCode === 601
							&& args.noAuth !== true
						) {
							// 執行前 先看reAuth lock沒
							var reAuthTimer2 = setInterval(function reAuthInterval2(){
								if(self.authLock.chk() === true) {
									cns.log("reAuth lock 2!");
									return reAuthInterval2;
								} else {
									self.reAuth(cloudData).done(reAuthDefChain.resolve);
									clearInterval(reAuthTimer2);
								}
							}(),500);
							

						} else {
							reAuthDefChain.resolve({
								isReAuth: false,
								isSuccess: true,
								data: apiData
							});
						}

						return reAuthDefChain;
					})().then(function(resultObj){
						// 2. reAuth之後重做原本的ajax

						var reAuthDefChain = MyDeferred();

						if(resultObj.isReAuth === false) {
							// 不用reAuth 直接進行
							reAuthDefChain.resolve(resultObj);

						} else if(resultObj.isSuccess === true){

							// 重新取得token成功 換掉at後 重新做ajax

							// setHeaders: outerArgs,cloudData
							newArgs.headers = self.setHeaders(args, cloudData);
						
							$.ajax(newArgs).complete(function(newData){
								reAuthDefChain.resolve({
									isSuccess: true,
									data: newData
								});
							})

						} else {
							// auth 再度發生錯誤 就傳入self.reAuth的錯誤內容
							reAuthDefChain.resolve(resultObj);
						}

						return reAuthDefChain;
					}).then(function(reAuthObj){
						// 3. 做原本ajax的判斷

						var completeData = reAuthObj.data;
						completeData.ajaxArgs = newArgs;

						// reAuth失敗 或 ajax 失敗
						if(reAuthObj.isSuccess === false || completeData.status !== 200) {
							// 回傳失敗
							ajaxDeferred.reject(completeData);
							return;
						} 

						ajaxDeferred.resolve(completeData);
					}) // end of reAuthDef 
				})// end of ajax 
			})// end of expireChk 

			clearInterval(reAuthTimer);
		} // authLock chk
	}(),500) // end of interval function

	var completeCB,successCB,errorCB;

	// 先搜集好callback 如果有呼叫 deferred完成後就執行
	ajaxDeferred.promise().complete = function(cb) {
		completeCB = cb;
		return ajaxDeferred.promise();
	};

    ajaxDeferred.promise().success = function(cb) {
        successCB = cb;
        return ajaxDeferred.promise();
    };

	ajaxDeferred.promise().error = function(cb) {
		errorCB = cb;
		return ajaxDeferred.promise();
	};
	
	// complete來這裡
	ajaxDeferred.always(function(completeData){
		self.onComplete(completeData);

		if(completeCB instanceof Function) completeCB(completeData);
	});

	// success 來這裡
	ajaxDeferred.done(function(completeData){

        if(successCB instanceof Function) {
        	var responseObj = JSON.parse(completeData.responseText);
    		responseObj.newArgs = newArgs;

        	successCB(responseObj);
        }
    })

	ajaxDeferred.fail(function(completeData) {

		completeData.newArgs = newArgs;

		self.onError(completeData);
		if(errorCB instanceof Function) errorCB(completeData);
	});


	return ajaxDeferred.promise();
}

QmiAjax.prototype = {
	expireTimer: 432000 * 1000, // ms, 五天  

	authLock: (function(){
		var isLock = false;
		var intervalTimer;

		//安全機制 3秒後改回false 避免reAuth裡的interval無限打
		function unlock(){
			clearInterval(intervalTimer);
			intervalTimer = setInterval(function(){
				isLock = false;
				clearInterval(intervalTimer);
			},3000);
		}

		return {
			set: function(status){
				isLock = status;
				unlock();
			},
			chk: function() {
				return isLock;
			}
		}
	})(),

	// 初始設定 以及 reAuth 會用到
	setHeaders: function(outerArgs,cloudData){
		// 指定headers 
		if(outerArgs.specifiedHeaders !== undefined) return outerArgs.specifiedHeaders;

		var newHeaders = {};

		// 先 extend 外部參數值
		if(outerArgs.headers !== undefined) {
			$.extend(newHeaders, outerArgs.headers);
		}

		// 預設公雲ui,at
		newHeaders.ui = QmiGlobal.auth.ui;
		newHeaders.at = QmiGlobal.auth.at;
		newHeaders.li = lang;

		// 做私雲判斷
		if(cloudData !== undefined) {
			newHeaders.uui = newHeaders.ui;
			newHeaders.uat = newHeaders.at;
			newHeaders.ui = cloudData.ui;
			newHeaders.at = cloudData.nowAt;
		}

		return newHeaders;
	},

	expireChk: function(args) {
		// 執行前 先檢查是否接近過期時間 先替換token
		var nowEt = (args.cloudData === undefined) ? QmiGlobal.auth.et : args.cloudData.et,
			deferred = $.Deferred();

		if(args.noAuth === true) {
			// 不用auth
			deferred.resolve({isSuccess: true});

		} else if(nowEt - (new Date().getTime()) < this.expireTimer) {
			// reAuth
			this.reAuth(args.cloudData).done(deferred.resolve);

		} else {
			// 還沒過期
			deferred.resolve({isSuccess: true});
		}
		return deferred.promise();
	},

	reAuth: function(cloudData){
		var self = this,
			deferred = $.Deferred();

		// auth lock
		cns.log("reAuth starts");
		self.authLock.set(true);

		$.ajax({
		    url: (function(){
				if(cloudData === undefined) {
					return base_url + "auth";
				} else {
					return "https://" + cloudData.cl + "/apiv1/auth";
				}
			})(),

		    headers: self.setHeaders({},cloudData),
		    type: "put",
		    error: function(errData){
		        cns.debug("reAuth error",errData);
		        deferred.resolve({
		        	isSuccess: false,
		        	data: errData,
		        	isReAuth: true
		        });
		    },

		    success: function(apiData){
		    	// 重新設定at
		    	if(
		    		cloudData !== undefined 
		    		&& QmiGlobal.clouds[cloudData.ci] !== undefined
		    	) {
		    		// 私雲
		    		QmiGlobal.clouds[cloudData.ci].nowAt = at = apiData.at;
		    		QmiGlobal.clouds[cloudData.ci].et = apiData.et;
		    	} else {
		    		// 公雲
		    		QmiGlobal.auth.at = at = apiData.at;
		    		QmiGlobal.auth.et = apiData.et;
		    	}
		        
		        deferred.resolve({
		        	isSuccess: true,
		        	data: apiData,
		        	isReAuth: true
		        });
		    },
		    complete: function(){
		    	cns.log("reAuth done and unlock");
		    	self.authLock.set(false);
		    }
		}) // end of reAuth ajax
		
		return deferred.promise();
	},

	onError: function(errData){
		var ajaxArgs = errData.newArgs,
			isPolling = function(){
				return (errData.newArgs.url.match(/sys\/polling/) instanceof Array)
			}();

		s_load_show = false;

		//polling錯誤不關閉 為了url parse
		if(isPolling === false){
			$('.ui-loader').hide();
			$(".ajax-screen-lock").hide();
		}
			
		//不做錯誤顯示 polling也不顯示
		if(ajaxArgs.errHide || isPolling === true) return false;

		//ajax逾時
		if(errData.statusText == "timeout"){
			// popupShowAdjust("","網路不穩 請稍後再試",true);
			toastShow( $.i18n.getString("COMMON_TIMEOUT_ALERT") );
			return false;
		}

		//logout~
		if(errData.status == 401){
			// 聊天室關閉
			if(window.location.href.match(/po\/app\/chat.html/)) window.close();

			resetDB();
			popupShowAdjust("", $.i18n.getString("LOGIN_AUTO_LOGIN_FAIL"),true,false,[reLogin]);	//驗證失敗 請重新登入

			return;
		}

		//ajax 提示訊息選擇 登入頁面錯誤訊息為popup
		//eim 登入網址沒有index.html
		if(args.ajaxMsg === true || !window.location.href.match(/.html/) || window.location.href.match(/index.html/)){
			ajax_msg = false;
			popupShowAdjust("",errorResponse(errData),true);
		}else{
			//預設
			toastShow(errorResponse(errData));	
		}
	},
		
	onComplete: function(data){
		// 舊的有在用 新的不再用
		if(s_load_show === false) {
			$('.ui-loader').hide();
			$(".ajax-screen-lock").hide();
		}

	}

}

//title

g_Qmi_title = "Qmi";
$("title").html(g_Qmi_title);

MyDeferred = function  () {
  var myResolve;
  var myPromise = new Promise(function(resolve, reject){
    myResolve = resolve;
  });

  myPromise.resolve = myResolve;
  return myPromise;
}




//上一頁功能
$(document).on("pagebeforeshow",function(event,ui){
	var hash = window.location.hash;

	//部分跳頁及上一頁按鈕不需要記錄歷程
	if(back_exception){
		back_exception = false;
		return false;
	}

	//ignore same hash continuously
	if(hash === $(document).data("page-history").last()[0]) return;

	var page_title = $(hash + " .page-title").html();
	var page_arr = [hash,page_title];

	$(document).data("page-history").push(page_arr);

	//timeline頁面
	if(hash == "#page-group-main"){
		//調整團體頭像
		if($(document).data("group-avatar")){
			$(".sm-group-area").each(function(i,val){
				var this_img = $(this).find(".sm-group-area-l img:eq(0)");
				var img = new Image();
				//改使用css自動調整大小位置 2014.11.20 glorialin
				// img.onload = function() {
				// 	mathAvatarPos(this_img,this.width,this.height,avatar_size);
				// }
				img.src = this_img.attr("src");
			});
			//改完就改回false
			$(document).data("group-avatar",false);
		}
	}
});


$(document).on("click",".page-back",function(){

	if( window.location.href.match(/chat.html/) !== null ) return false;

	if( this.hasAttribute("customize") ) return false;

	//按上一頁不需要記錄歷程
	back_exception = true;
	var t= $(document).data("page-history");

	//目前這頁先移除
	$(document).data("page-history").pop();

	//若上一頁為login 導去login
	if( $(document).data("page-history").last()[0] == "login" ) {
		document.location = "index.html";
	}

	$.mobile.changePage($(document).data("page-history").last()[0], {transition: "slide",reverse: true});
	//cns.debug("last:",$(document).data("page-history").last()[0]);
});


//for node-webkit app to open systems browser
$(document).on("click","a",function(e){
	if(!$(this).is("[download]")){
		var isNode = (typeof(require) != "undefined");
		cns.debug( isNode );
		if( isNode ){
            var gui = require('nw.gui');
            gui.Shell.openExternal($(this).attr("href"));
			return false;        	
        }
	}
});


errorResponse = function(data){
	try{
		if(data && data.responseText && data.responseText.length>0 ){
			return $.parseJSON(data.responseText).rsp_msg;
		}else{
			cns.debug("errorResponse:",data);
			return $.i18n.getString("COMMON_CHECK_NETWORK");
		}
	} catch(e){
		cns.debug("catch error", {e:e,data:data} );
		return $.i18n.getString("COMMON_UNKNOWN_ERROR");
	}
}

//debug control 
setDebug(debug_flag);

function setDebug(isDebug) {
  if (isDebug) {
    window.cns = {
      log: window.console.log.bind(window.console, '%s: %s'),
      error: window.console.error.bind(window.console, 'error: %s'),
      info: window.console.info.bind(window.console, 'info: %s'),
      warn: window.console.warn.bind(window.console, 'warn: %s'),
      debug: window.console.debug.bind(window.console, 'debug: %s')
    };
  } else {
    var __no_op = function() {};

    window.cns = {
      log: __no_op,
      error: __no_op,
      warn: __no_op,
      info: __no_op,
      debug: __no_op
    }
  }
}
