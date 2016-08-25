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

	//local測試 預設開啟console
	debug_flag = false;

var default_url = "https://ap.qmi.emome.net/apiv1/";
var base_url = function() {
	switch(true) {
		case match("qawp.qmi.emome.net"):
			return "https://qaap.qmi.emome.net/apiv1/";
			break;
		case match("qmi17.mitake.com.tw"):
			return "https://qmi17.mitake.com.tw/apiv1/";
			break;
		default:
			return "https://ap.qmi.emome.net/apiv1/";
	}
	function match(domain) {
		var regDomain = new RegExp("^https:\/\/"+ domain, 'g');
		return !!window.location.href.match(regDomain);
	}
}();

// 判斷更改網址 不要上到正式版
$(document).ready(function() {
	
	if($.lStorage("_selectedServerUrl") === false || $.lStorage("_selectedServerUrl") === default_url) return;
	base_url = $.lStorage("_selectedServerUrl");
	
	if($("#module-server-selector-url").length === 0) $("body").append(QmiGlobal.module.serverSelector.urlHtml());		
	$("#module-server-selector-url").html(base_url);

	// 更改網址 清db
	if($.lStorage("_lastBaseUrl") !== false && $.lStorage("_lastBaseUrl") !== base_url) resetDB();
	$.lStorage("_lastBaseUrl", base_url);
})


var userLang = navigator.language || navigator.userLanguage;
	userLang = userLang.replace(/-/g,"_").toLowerCase();

String.prototype._escape = function(){
    return this.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

String.prototype.qmiTag = function (tagMember) {
	var findText = "///;" + tagMember.u + ";///";
	var markTag = "<b name='" + tagMember.u + "'>" + tagMember.n + "</b>";
	return this.replace("///;" + tagMember.u + ";///", "<b name='" + tagMember.u + "'>" + tagMember.n + "</b>");
}

Number.prototype.toFileSize = function () {
	var unitIndex = Math.floor( Math.log(this) / Math.log(1024) );
    return (this / Math.pow(1024, unitIndex)).toFixed(2) + ' ' 
    	+ ['B', 'kB', 'MB', 'GB', 'TB'][unitIndex];
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

	//設置聊天訊息預覽
	set_notification = $.lStorage("_setnoti") || true,
	//timeline置頂millisecond
	top_timer_ms = $.lStorage("_topTimeMs") || 5000,
	//top_timer_ms = 5000;

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

	ldapClouds: {}, // ldap雲資訊

	windowListCiMap: {},

	module: {}, // 模組

	reAuthLockDef: {},

	rspCode401: false,

	// 聊天室 auth
	auth: {},
	me: {},
	getObjectFirstItem: function(obj,last) {
		if(last === true){
			return obj[Object.keys(obj)[Object.keys(obj).length-1]];
		} else 	{
			return obj[Object.keys(obj)[0]];
		}
	},

	viewMap: {} // cloud reload

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
	// body and method
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


	//before send ; SSO 不開啟loader ui
	if((args.isLoadingShow === true || s_load_show === true)
		&& args.isSso !== true
	) {
		$(".ajax-screen-lock").show();
		$('.ui-loader').css("display","block");
	}
	
	// 執行前 先看reAuth lock沒  若是SSO reAuth 就直接執行
	if(args.isSsoReAuth === true) ajaxExecute({isSuccess: true})
	else $.when(QmiGlobal.reAuthLockDef).done(function(){
		self.expireChk({
			url: newArgs.url,
			noAuth: args.noAuth,
			cloudData: cloudData
		}).done(ajaxExecute)
	})

	function ajaxExecute(chk) {
		// 發生錯誤
		if(chk.isSuccess === false) {
			ajaxDeferred.reject(chk.data);
			return;
		}
		// 有經過reAuth 更新headers
		// setHeaders: outerArgs,cloudData
		newArgs.headers = self.setHeaders(args, cloudData);

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
					$.when(QmiGlobal.reAuthLockDef).done(function(){
						self.reAuth(cloudData).done(reAuthDefChain.resolve);
					});


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
	}

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
        	try {
        		var responseObj = JSON.parse(completeData.responseText);
        		responseObj.newArgs = newArgs;
        		successCB(responseObj);
        	} catch(e) {
        		console.log("ajax done catch error", e);
        		if(errorCB instanceof Function) {
        			completeData.errMsg = "parse error";
        			errorCB(completeData);
        		}
        		return;
        	}
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
		// 重新取得私雲
		args.cloudData = QmiGlobal.clouds[(args.cloudData || {}).ci];

		// 執行前 先檢查是否接近過期時間 先替換token
		var nowEt = (args.cloudData === undefined) ? QmiGlobal.auth.et : args.cloudData.et,
			deferred = $.Deferred(),

			// tp1 是需要輸入密碼的私雲 expire時間直接就是私雲提供的時間 et
			isExpired = function() {
				// tp1 是需要輸入密碼的私雲 expire時間直接就是私雲提供的時間 et
				if((args.cloudData || {}).tp === 1) return args.cloudData.et - (new Date().getTime()) < 0;
				// 過期檢查 提前幾天檢查
				else return nowEt - (new Date().getTime()) < this.expireTimer
			}.call(this);

		if(args.noAuth === true) {
			// 不用auth
			deferred.resolve({isSuccess: true});

		} else if(isExpired) {
			console.log("token Expire!!!");
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


		// 先檢查是否按取消
		try { if(QmiGlobal.clouds[cloudData.ci].isReAuthCancel === true) {
			deferred.resolve({
				isSuccess: false,
				isSso: true,
				isReAuth: true,
				data: {isCancel: true}
			})

			return deferred.promise();
		}} catch(e) {}// do nothing 

		// auth lock
		cns.log("reAuth starts", apiName);
		
		// reAuth Lock 設定前先解除之前的pending
		// if(QmiGlobal.reAuthLockDef.then instanceof Function) QmiGlobal.reAuthLockDef.resolve();
		QmiGlobal.reAuthLockDef = $.Deferred();

		// 需要輸入密碼
		if((cloudData || {}).tp === 1) {
			// console.log("此私雲需要輸入密碼");
			// 把這私雲的所有團體 加上lock
			QmiGlobal.module.reAuthUILock.lock(cloudData);

			QmiGlobal.module.reAuthManually.init({
				reAuthDef: deferred,
				cloudData: cloudData
			});

		} else {

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
			    	cns.log("reAuth done and unlock", apiName);
			    	QmiGlobal.reAuthLockDef.resolve();
			    }
			}) // end of reAuth ajax

		}
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

		//不做錯誤顯示 polling也不顯示 isCancel 手動輸入密碼的私雲重新頁面 按取消就不顯示錯誤訊息
		if(ajaxArgs.errHide || ajaxArgs.noErr || isPolling || errData.isCancel === true) return false;

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

			QmiGlobal.rspCode401 = true;
			popupShowAdjust("", $.i18n.getString("LOGIN_AUTO_LOGIN_FAIL"),true,false,[reLogin]);	//驗證失敗 請重新登入
			return;
		}
		//ajax 提示訊息選擇 登入頁面錯誤訊息為popup
		if(args.ajaxMsg === true){
			ajax_msg = false;
			popupShowAdjust("",errorResponse(errData),true);
		}else{
			//預設
			toastShow(errorResponse(errData));
		}
	},

	onComplete: function(data){
		
		if(s_load_show === false) {
			$('.ui-loader').hide();
			$(".ajax-screen-lock").hide();
		}

	}

} // end of QmiAjax

QmiGlobal.module.reAuthUILock = {
	currDataObj: {},
	lock: function(cloudData) {
		var groupListArea = $("#page-group-main .sm-group-list-area");
		Object.keys(QmiGlobal.cloudGiMap).forEach(function(cgi) {
			if(QmiGlobal.cloudGiMap[cgi].ci !== cloudData.ci) return;
			QmiGlobal.groups[cgi].isReAuthUILock = true;

			var groupDom = groupListArea.find(".sm-group-area[data-gi="+cgi+"]");
			groupDom.find(".sm-group-area-l").addClass("auth-lock").end()
			.find("span.auth-lock-text").show();
 		});
	},
	unlock: function(cloudData) {
		var groupListArea = $("#page-group-main .sm-group-list-area");
		Object.keys(QmiGlobal.cloudGiMap).forEach(function(cgi) {
			if(QmiGlobal.cloudGiMap[cgi].ci !== cloudData.ci) return;
			QmiGlobal.groups[cgi].isReAuthUILock = false;

			var groupDom = groupListArea.find(".sm-group-area[data-gi="+cgi+"]");
			groupDom.find(".sm-group-area-l").removeClass("auth-lock").end()
			.find("span.auth-lock-text").hide();
 		});
	}
}

//-----------------------------------------



QmiGlobal.eventDispatcher = {

	viewMap: {},

	handleEvent: function() {
		// 防連點 start
		var closureObj = {};
		return function(event) {
			//禁止連點
			if(preventMultiClick(event) === false) return;

			var self = this;

			Object.keys(self.viewMap).forEach(function(viewId) {
				// event currentTarget -> event綁定的對象

				// jqElem 是arr 每個elem都比對
				var jqElem = self.viewMap[viewId].jqElem, length = jqElem.length;
				for(var i=0; i<length; i++) {
					if(event.currentTarget === jqElem[i]) {
						window.dispatchEvent(new CustomEvent(event.type+ ":" +viewId, {detail: {elem: event.currentTarget, data: (self.viewMap[viewId].data || {})[event.type], target: event.target}}));
						return;
					}
				}
			});
		}

		function preventMultiClick(event) {
			// event.stopPropagation();
			//禁止連點
			if(closureObj.lastView === event.target && new Date().getTime() - closureObj.lastClickTime < 1000) return false;
			// 記錄連點資訊
			if(event.type === "click") closureObj.lastView = event.target, closureObj.lastClickTime = new Date().getTime();
			return true;
		}
	}(),

	subscriber: function(veArr, handler, isClean) {
		var self = this;

		// 清除已存在的view
		if(isClean) self.cleaner(handler.id);

		veArr.forEach(function(veObj) {
			var viewId = handler.id+":"+veObj.veId;
			self.viewMap[viewId] = veObj;
			veObj.eventArr.forEach(function(eventType) {
				// jqElem 是arr 每個elem都掛上事件監聽
				Array.prototype.forEach.call(veObj.jqElem, function(elem) {
					elem.addEventListener(eventType, self);
				});
				window.addEventListener(eventType+":"+viewId, handler);
			});
		})
	},

	cleaner: function(moduleId) {
		var self = this;

		Object.keys(self.viewMap).forEach(function(viewId) {
			if(viewId.split(":")[0] === moduleId) {
				delete self.viewMap[viewId];

				// remove event listener
				// window.removeEventListener("click:view-ldap-setting:list-delete", QmiGlobal.module.ldapSetting)
			}

			
		})
	}
}


// reAuthManuallyUI
QmiGlobal.module.reAuthManually = {

	isExist: false,

	id: "view-auth-manually",

	hasAjaxLoad: false,

	reAuthDef: {}, // QmiAjax裡面的reAuth deferred 還在等待完成

	init: function(argObj) {
    	var self = this;

    	// 關閉原本的ajax load 圖示
    	if($(".ajax-screen-lock").is(":visible")) {
    		self.hasAjaxLoad = true;
    		$(".ajax-screen-lock").hide();
			$('.ui-loader').hide();
    	}

    	self.reAuthDef = argObj.reAuthDef;
    	self.cloudData = argObj.cloudData;

    	$("#" + self.id).remove();

    	self.view = $("<section>", {
	        id: self.id,
	        html: self.html()
	    });

    	$("body").append(self.view);
    	self.view.fadeIn(100);

    	QmiGlobal.eventDispatcher.subscriber([
    		{
    			veId: "cancel", 
    			jqElem: self.view.find("span.cancel"), 
    			eventArr: ["click"],
    		}, {
    			veId: "submit", 
    			jqElem: self.view.find("span.submit"), 
    			eventArr: ["click"],
    		}
    	], self, true);
    },

    // custom event
	handleEvent: function() {
		var self = this;
		// event.type -> click:view-auth-manually-submit
		var eventCase = event.type.split(":"+self.id).join("");
		switch(eventCase) {
			case "click:submit":
				self.submit();
				break;

			case "click:cancel":
				// sso 用戶敢按取消就登出
				if(QmiGlobal.auth.isSso) {
					logout();
				} else {
					// 打開timeline lock
					// 從QmiAjax的reAuth 做 lock了
					// 在私雲加入cancel chk 讓其他api停止動作
					QmiGlobal.clouds[self.cloudData.ci].isReAuthCancel = true;
					// 避免重複顯示認證頁面 3秒後解開 但要注意polling是否觸發認證畫面
					console.log("計算兩秒");
					setTimeout(function() {console.log("解開");QmiGlobal.clouds[self.cloudData.ci].isReAuthCancel = false}, 2000);
					
					// 所以要再點一次timelineChangeGroup 做lock的ui顯示
					timelineChangeGroup(gi)
				}
				// reAuthDef from QmiAjax 
				self.reAuthDef.resolve({
					isSuccess: false,
					isSso: true,
					isReAuth: true,
					data: {isCancel: true}
				})
				self.remove();
				break;
		}
	},

	html: function() {
		return "<div class='container '>"
		+ "<section class='icon-shield'></section>"
		+ "<div class='title1'>" + $.i18n.getString("ACCOUNT_BINDING_ACCOUNT_RECERTIFICATION") + "</div>"
		+ "<div class='title2'>" + $.i18n.getString("ACCOUNT_BINDING_ENTER_LDAP_PASSWORD") + "</div>"
        + "<div class='input-wrap email'><input viewId='email' class='email' placeholder='"+ $.i18n.getString("ACCOUNT_BINDING_EMAIL") +"'></div>"
        + "<div class='input-wrap password'><input viewId='password' class='password' type='password' placeholder='"+ $.i18n.getString("ACCOUNT_BINDING_PASSWORD") +"'></div>"
        + "<div class='action'>"
        + "<span class='cancel' viewId='cancel'>" + $.i18n.getString("ACCOUNT_BINDING_CANCEL") + "</span>"
        + "<span class='submit' viewId='submit'>" + $.i18n.getString("ACCOUNT_BINDING_DONE") + "</span>"
        + "</div>";
    },

    submit: function() {
    	var self = this,
    		ssoId = self.view.find("input.email").val(),
    		ssoPw = self.view.find("input.password").val(),
    		cData = self.cloudData;

    	if(ssoId === "" || ssoPw === "") return;

    	self.view.find(".container").addClass("loading");

    	$.ajax({
			url: "https://"+ cData.cl +"/apiv1/sso/"+ cData.ci +"/auth",
			headers: {li: lang},
			data: JSON.stringify({
				id: self.view.find("input.email").val(),
			    dn: QmiGlobal.device,
			    pw: QmiGlobal.aesCrypto.enc(self.view.find("input.password").val(), self.view.find("input.email").val().substring(0,16)),
			}),
			type: "put",
		}).complete(function(data){

			try {
				var newAuth = JSON.parse(data.responseText);
			} catch(e) {
				var newAuth = false;
			}

			if(data.status !== 200 || newAuth === false) {

				self.view.find(".container").removeClass("loading").end()
				.find("input.email").val("").end()
				.find("input.password").val("");

				toastShow($.i18n.getString("LOGIN_AUTO_LOGIN_FAIL"));
			} else {
				// 設定新at , et
				QmiGlobal.clouds[cData.ci].at = newAuth.at;
				QmiGlobal.clouds[cData.ci].et = newAuth.et;

				QmiGlobal.module.reAuthUILock.unlock(self.cloudData);

				// 重新執行timelineChangeGroup 讓畫面開啟
				timelineChangeGroup(gi);

				// reAuth 結束
				setTimeout(function() {
					self.view.find(".container").attr("msg", $.i18n.getString("WEBONLY_AUTH_SUCCESS"));
				}, 1000)
				

				// reAuth 結束
				setTimeout(function() {
					self.remove();
					self.reAuthDef.resolve({
						isSuccess: true,
						isSso: true,
						isReAuth: true
					})
				}, 1500);
			}
		})
    },

    remove: function() {
    	var self = this;
    	self.view.fadeOut(100, function() { self.view.remove()});
    	// 解除lock
    	QmiGlobal.reAuthLockDef.resolve();
    },
}


QmiGlobal.module.systemPopup = {
	id: "view-system-popup",

    init : function(){
    	var self = this;

    	self.view = $("<section>", {
	        id: self.id,
	        html: self.html()
	    });

	    self.view._i18n();

    	$("body").append(self.view);
    	self.view.fadeIn(100);
    	
    	QmiGlobal.eventDispatcher.subscriber([
    		{
    			veId: "close", 
    			jqElem: self.view, 
    			eventArr: ["click"],
    		}, {
    			veId: "ldapSetting", 
    			jqElem: self.view.find("[data-sm-act=system-ldapSetting]"), 
    			eventArr: ["click"],
    		}, {
    			veId: "logout", 
    			jqElem: self.view.find("div.system-logout"), 
    			eventArr: ["click"],
    		}
    	], self, true);
    },

    handleEvent: function() {
    	var self = this;
		// event.type -> click:view-auth-manually-submit
		var eventCase = event.type.split(":"+self.id).join("");
		switch(eventCase) {
			case "click:close":
				$("#userInfo .sm-person-area-r").find("img").toggle();
    			self.view.remove();
				break;

			case "click:ldapSetting":
				// func.js  timelineSwitch  system-ldap-setting
				// QmiGlobal.ldapSetting.init();

    			self.view.remove();
				break;

			case "click:logout":
				new QmiGlobal.popup({
					desc: $.i18n.getString("SETTING_DO_LOGOUT"),
					confirm: true,
					cancel: true,
					action: [logout]
				});
				break;
		}
    },

    html: function() {
    	return '<div class="sm-person-info">'
        + 	'<div class="sm-info-hr" data-textid="LOGIN_SAVE_ACCOUNT_TITLE"></div>'
        + 	'<div data-sm-act="user-setting" class="sm-info sm-small-area" data-textid="PERSONAL_INFORMATION"></div>'
        + 	'<div class="line"></div>'
        + 	'<div class="sm-info-hr" data-textid="SYSTEM"></div>'
        + 	'<div data-sm-act="system-setting" class="sm-info sm-small-area" data-textid="LEFT_SYSTEM_SETTING"></div>'
        + 	'<div data-sm-act="system-ldapSetting" class="sm-info sm-small-area" data-textid="'+ (QmiGlobal.auth.isSso ? "ACCOUNT_BINDING_BIND_QMI_ACCOUNT" : "ACCOUNT_BINDING_BINDING_NEW_ACCOUNT" )+'"></div>'
        + 	'<div class="sm-info system-logout" data-textid="SETTING_LOGOUT"></div>'
        + '</div>';
    }
}


MyDeferred = function  () {
  var myResolve, myReject;
  var myPromise = new Promise(function(resolve, reject){
    myResolve = resolve;
    myReject = reject;
  });

  myPromise.resolve = myResolve;
  myPromise.reject = myReject;
  return myPromise;
}


// ----------- Module ---------------

QmiGlobal.eventDispatcher = {

	viewMap: {},

	handleEvent: function() {
		// 防連點 start
		var closureObj = {};
		return function(event) {
			//禁止連點
			if(preventMultiClick(event) === false) return;

			var self = this;

			Object.keys(self.viewMap).forEach(function(viewId) {
				// event currentTarget -> event綁定的對象

				// jqElem 是arr 每個elem都比對
				var jqElem = self.viewMap[viewId].jqElem, length = jqElem.length;
				for(var i=0; i<length; i++) {
					if(event.currentTarget === jqElem[i]) {
						window.dispatchEvent(new CustomEvent(event.type+ ":" +viewId, {detail: {elem: event.currentTarget, data: (self.viewMap[viewId].data || {})[event.type], target: event.target}}));
						return;
					}
				}
			});
		}

		function preventMultiClick(event) {
			// event.stopPropagation();
			//禁止連點
			if(closureObj.lastView === event.target && new Date().getTime() - closureObj.lastClickTime < 1000) return false;
			// 記錄連點資訊
			if(event.type === "click") closureObj.lastView = event.target, closureObj.lastClickTime = new Date().getTime();
			return true;
		}
	}(),

	subscriber: function(veArr, handler, isClean) {
		var self = this;

		// 清除已存在的view
		if(isClean) self.cleaner(handler.id);

		veArr.forEach(function(veObj) {
			var viewId = handler.id+":"+veObj.veId;
			self.viewMap[viewId] = veObj;
			veObj.eventArr.forEach(function(eventType) {
				// jqElem 是arr 每個elem都掛上事件監聽
				Array.prototype.forEach.call(veObj.jqElem, function(elem) {
					elem.addEventListener(eventType, self);
				});
				window.addEventListener(eventType+":"+viewId, handler);
			});
		})
	},

	cleaner: function(moduleId) {
		var self = this;

		Object.keys(self.viewMap).forEach(function(viewId) {
			if(viewId.split(":")[0] === moduleId) {
				delete self.viewMap[viewId];

				// remove event listener
				// window.removeEventListener("click:view-ldap-setting:list-delete", QmiGlobal.module.ldapSetting)
			}

			
		})
	}
}

QmiGlobal.module.serverSelector = {
	id: "view-server-selector",

	init: function() {
		var self = this;

		if($("#module-server-selector").length !== 0) $("#module-server-selector").remove();
		$("body").append(self.html())

		self.view = $("#module-server-selector");

		var chk = false
		$.each(self.view.find("li"), function(i,liDom) {
			if($(liDom).find("> div:last-child").text() + "/apiv1/" === base_url) {
				chk = true;
				$(liDom).addClass("selected").addClass("active");
			}
		});

		if(chk === false) self.view.find("li:last-child").addClass("selected").addClass("active").find("input").val(base_url.split("/apiv1")[0]);

		QmiGlobal.eventDispatcher.subscriber([
			{
    			veId: "item", 
    			jqElem: self.view.find("li"), 
    			eventArr: ["click"]
    		},{
    			veId: "submit", 
    			jqElem: self.view.find("button"), 
    			eventArr: ["click"]
    		}
		], self, true);
	},

	handleEvent: function() {
		var self = this;
		var thisElem = event.detail.elem;
		switch(event.type.split(":"+self.id).join("")) {
			case "click:item":
				self.view.find("li").removeClass("active");
				$(thisElem).addClass("active");
				break;
			case "click:submit":

				if($("#module-server-selector-url").length === 0) $("body").append(self.urlHtml());
				
				var newUrl = self.view.find("li.active > div:last-child").html();
				var inputDom = self.view.find("li.active input");
				if(inputDom.length > 0) newUrl = inputDom.val() === "" ? default_url : inputDom.val();

				$("#module-server-selector-url").html(newUrl);

				newUrl += "/apiv1/";
				base_url = newUrl;
				if(newUrl === default_url) {
					console.log("456");
					$("#module-server-selector-url").html("");
					localStorage.removeItem("_selectedServerUrl");
				} else {
					console.log("123");
					$.lStorage("_selectedServerUrl", newUrl);
				}

				// 改完刪資料庫
				resetDB();

				self.remove();
				break;
		}
	},

	remove: function() {
		this.view.remove();
	},

	html: function() {
		return "<section id='module-server-selector'>"
		+ "<section>"
		+ "<ul>"+ (function() {
				return [
					"正式環境$https://ap.qmi.emome.net",
					"QA$https://qaap.qmi.emome.net",
					"AWS$https://apserver.mitake.com.tw",
					"TEST$https://qmi17.mitake.com.tw",
					"自訂$<input placeholder='輸入網址'>"
				].reduce(function(str, curr) {
					return str += "<li><div>"+ curr.split("$")[0] +"</div><div>"+ curr.split("$")[1] + "</div></>";
				}, "");
			})() +"</ul>"
			+ "<div><button>"+ $.i18n.getString("COMMON_OK") +"</button></div>"
		+ "</section></section>"
	},
	urlHtml: function() {return "<div id='module-server-selector-url'></div>"}
}

// 選擇server
$(document).on("click", "#container_version", function() {
	var cnts = 0;
	return function() {
		if(cnts === 0) setTimeout(function() {cnts = 0;}, 1000);
		cnts++;
		if(cnts < 5) return;
		if(prompt('輸入密碼') === "86136982") QmiGlobal.module.serverSelector.init();
		else alert("錯誤");}
}());


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
  if (true) {
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

