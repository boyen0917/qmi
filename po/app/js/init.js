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

var default_url = "https://ap.qmi.emome.net/";
var base_url = function() {
	switch(true) {
		case match("qawp.qmi.emome.net"):
			return "https://qaap.qmi.emome.net/";
			break;
		case match("qmi17.mitake.com.tw"):
			return "https://qmi17.mitake.com.tw/";
			break;
		default:
			return "https://ap.qmi.emome.net/";
	}
	function match(domain) {
		var regDomain = new RegExp("^https:\/\/"+ domain, 'g');
		return !!window.location.href.match(regDomain);
	}
}();

var base_url = "https://qmi17.mitake.com.tw/";


$(document).ready(function() {
	try { QmiGlobal.init(); } 
	catch(e) { cns.log("QmiGlobal.init error") }
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
	// document ready below
	initReady: function() {
		// App update version onfocus
		appOnFocusEvent();
	},

	// 之後取代 ui, at, gi, ... etc
	currentGi: "",

	device: navigator.userAgent.substring(navigator.userAgent.indexOf("(")+1,navigator.userAgent.indexOf(")")) || navigator.userAgent,

	groups: {}, // 全部的公私雲團體資料 QmiGlobal.groups
	companies: {}, // 全部的company資料
	companyGiMap: {},
	cloudCompanyMap: {}, // ldap雲資訊
	ldapCompanies: {}, // ldap雲資訊
	windowListCiMap: {},
	module: {}, // 模組
	rspCode401: false,


	ajaxExpireTimer: 5 * 86400 * 1000, // ms, 五天
	ldapExpireTimer: 1 * 86400 * 1000, // ms, 一天

	// 聊天室 auth
	auth: {},
	me: {},

	// after document ready
	init: function() { 
		//設定語言, 還沒登入先用瀏覽器的語言設定
		updateLanguage(lang);
		onCheckVersionDone();

		// window.onfocus = function() {
		// 	console.log("ggg");
		// 	if(QmiGlobal.isOnfocusAlreadyExist) return;
		// 	QmiGlobal.isOnfocusAlreadyExist = true;

		// 	alert("shit");
		// };


		// // 測試環境 選擇server
		// QmiGlobal.module.serverSelector.showCurrUrl();
	},

	getObjectFirstItem: function(obj,last) {
		if(last === true){
			return obj[Object.keys(obj)[Object.keys(obj).length-1]];
		} else 	{
			return obj[Object.keys(obj)[0]];
		}
	},

	viewMap: {}, // cloud reload

	authCode: function() {
		var rspCode, level = 1;
		return {
			set: function(code) {
				rspCode = code;
			},
			get: function(code) {
				return rspCode;
			},
			setLevel: function(lv) {
				level = lv;
			},
			getLevel: function() {
				return level;
			}
		}
	}(),

	ajaxLoadingUI: {
		show: function() {
			$('.ui-loader').show();
			$(".ajax-screen-lock").show();
		},
		hide: function() {
			$('.ui-loader').hide();
			$(".ajax-screen-lock").hide();
		}
	},

	isCompanyLoaded: function(thisCi) {
		var chkArr = Object.keys(QmiGlobal.companyGiMap).reduce(function(arr, currGi) {
			if(QmiGlobal.companyGiMap[currGi].ci === thisCi) arr.push(currGi)
			return arr;
		}, []);

		return !!chkArr.length;
	},

	getActivedUserNum: function(thisGi) {
		if(!QmiGlobal.groups[thisGi]) return 0;
		return Object.keys((QmiGlobal.groups[thisGi].guAll || {})).reduce(function(total, currGi) {
			if(QmiGlobal.groups[thisGi].guAll[currGi].st === 1) total++;
			return total;
		}, 0);
	},

	chainDeferred: function(firstDef) {
		var thenDefArr = [firstDef];
		return {
			then: function(argFun) {
				var thisDeferred = $.Deferred();
				var currDefIndex = thenDefArr.length;
				var lastDefIndex = currDefIndex - 1;
				thenDefArr[currDefIndex] = thisDeferred;
				$.when(thenDefArr[lastDefIndex]).done(function(rspData) {
					if(!argFun instanceof Function) return;
					var argFunResult = argFun(rspData);
					if(argFunResult instanceof Object) 
						(argFunResult.done || function() {})(thisDeferred.resolve);
				});
				return this;
			}
		}
	},

	isDefResolved: function(def) {
        if(!def) return true;
        if(!def.state instanceof Function) return true;
        if(def.state() !== "pending") return true;
        return false;
    },
	
	appReload: function() {
	    var flag = false;
	    var periodTime = 8 * 60 * 60 * 1000; // 每8小時reload一次
	    // 計算重新讀取頁面的時間
	    if($.lStorage("_periodicallyReloadTimer") === false) setTimer();

	    return {
	        chk: function() {
	            if(new Date().getTime() - $.lStorage("_periodicallyReloadTimer") > periodTime) {
	                flag = true;
	            }
	        },

	        do: function(argsObj) {
	            if(!argsObj) return;
	            if(flag === false && !argsObj.isReloadDirectly) return;

	            var wl = {};
	            $.each(windowList,function(key,value){try {
	                if(value.closed) return;
	                wl[value.gi] = wl[value.gi] || {};
	                wl[value.gi][key] = QmiGlobal.groups[value.gi].chatAll[value.ci];
	            } catch(e) {}});

	            // 設定當前gi
	            QmiGlobal.auth.appReloadObj = {
	                gi: QmiGlobal.currentGi,
	                param: argsObj
	            };

	            $.lStorage("groupChat", wl);
	            $.lStorage("_appReloadAuth", QmiGlobal.auth);
	            setTimer();
	            
	            location.reload();
	        }
	    }

	    function setTimer(){
	        $.lStorage("_periodicallyReloadTimer", new Date().getTime());
	    }
	}()
};

$(document).ready(QmiGlobal.initReady);

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
	var self = this;

	// api版本 預設apiv1
	self.apiVer = args.apiVer || "apiv1";

	var	ajaxDeferred = $.Deferred(),

		// 判斷私雲api
		companyData = (function(){

			// 有指定url 加上不要私雲 最優先 ex: 公雲polling
			if(args.isPublicApi === true)
				return undefined;

			// 有指定ci 直接給他私雲
			if(args.ci !== undefined)
				return QmiGlobal.companies[args.ci];

			// 判斷apiName有無包含私雲gi 有的話就給他私雲
			if(args.apiName !== undefined){
				// 排除有網址有？的狀況
				var apiGi = args.apiName.split("?")[0].split("/").find(function(item){
					return QmiGlobal.groups.hasOwnProperty(item)
				});

				// api 包含 group id 而且 在私雲內 回傳私雲 否則回傳undefined 不往下做
				if(apiGi !== undefined)
					return QmiGlobal.companyGiMap.hasOwnProperty(apiGi) ? QmiGlobal.companies[ QmiGlobal.companyGiMap[apiGi].ci ] : undefined;
			}

			// 最後判斷 現在團體是私雲團體 就做私雲
			if(QmiGlobal.companyGiMap[gi] !== undefined)
				return QmiGlobal.companies[ QmiGlobal.companyGiMap[gi].ci ];

		}()),

		newArgs = {
			url: (function(){
				// 指定url
				if(args.url) return args.url;

				// undefined 表示 不符合私雲條件 給公雲
				if(companyData)
					return "https://" + companyData.cl +"/"+ self.apiVer +"/"+ args.apiName;
				else
					return base_url + self.apiVer +"/"+ args.apiName;
			}()),
			// setHeaders: outerArgs,companyData
			headers: self.setHeaders(args, companyData),

			// timeout: 30000,

			type: (args.method  || args.type) || "get"
		};
	// end of var

	// 判斷companyData ctp === 0 要替換公雲at給他
	if((companyData || {}).ctp === 0) {
		companyData.nowAt = QmiGlobal.auth.at;
		companyData.et = 9999999999999;
	}

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


	// 各個私雲都有各自reAuthDeferred
	var reAuthDeferred = (companyData || {}).reAuthDef;
	
	// 執行前 先看reAuth lock沒  若是SSO reAuth 就直接執行
	if(args.isSsoReAuth === true) ajaxExecute({isSuccess: true})
	else $.when(reAuthDeferred).done(function(){
		self.expireChk({
			url: newArgs.url,
			noAuth: args.noAuth,
			companyData: companyData
		}).done(ajaxExecute)
	})

	function ajaxExecute(chk) {
		// 發生錯誤
		if(chk.isSuccess === false) {
			ajaxDeferred.reject({
				status: 9999,
				isSuccess: false,
				data: chk.data,
				isCancel: chk.isCancel
			});
			return;
		}

		// 有經過reAuth 更新headers
		// setHeaders: outerArgs,companyData
		newArgs.headers = self.setHeaders(args, companyData);

		// 執行
		$.ajax(newArgs).complete(function(rspData){
			// deferred chain -> 這邊可以省略 也可精簡 之後做 用一個deferred做reauth跟重新執行ajax
			// 1. 判斷是否reAuth
			// 2. reAuth之後重做原本的ajax
			// 3. 回到原本ajax的判斷

			if(QmiGlobal.authCode.get()) {
				rspData.status = 401;
				rspData.responseText = JSON.stringify({
					rsp_code: QmiGlobal.authCode.get()
				})
			}

			(function(){
				var reAuthDefChain = MyDeferred();
				// reAuth: token過期
				if( rspData.status === 401
					&& args.noAuth !== true
				) {
					// 執行前 先看reAuth lock沒
					$.when(reAuthDeferred).done(function(){
						self.reAuth(companyData, rspData).done(reAuthDefChain.resolve);
					});
				} else {
					reAuthDefChain.resolve({
						isReAuth: false,
						isSuccess: true,
						data: rspData
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
					// setHeaders: outerArgs,companyData
					newArgs.headers = self.setHeaders(args, companyData);

					$.ajax(newArgs).complete(function(newData){
						reAuthDefChain.resolve({
							isSuccess: true,
							data: newData
						});
					})
				} else {
					// auth 再度發生錯誤 就傳入self.reAuth的錯誤內容
					reAuthDefChain.resolve(resultObj);
					// auth 再度發生錯誤 關閉company所屬團體的ui
					if(companyData) QmiGlobal.module.reAuthUILock.lock(companyData);
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
	setHeaders: function(outerArgs,companyData){
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
		if(companyData !== undefined) {
			newHeaders.uui = newHeaders.ui;
			newHeaders.uat = newHeaders.at;
			newHeaders.ui = companyData.ui;
			newHeaders.at = companyData !== QmiGlobal.auth ? companyData.nowAt : companyData.at;
		}

		return newHeaders;
	},

	expireChk: function(args) {
		// 重新取得私雲
		args.companyData = QmiGlobal.companies[(args.companyData || {}).ci];

		// 執行前 先檢查是否接近過期時間 先替換token
		var nowEt = (args.companyData === undefined) ? QmiGlobal.auth.et : args.companyData.et;
		var deferred = $.Deferred();

		if(args.noAuth === true) {
			// 不用auth
			deferred.resolve({isSuccess: true});

		} else if(isExpired()) {
			console.log("token Expire!!!");
			// reAuth
			this.reAuth(args.companyData).done(deferred.resolve);

		} else {
			// 還沒過期
			deferred.resolve({isSuccess: true});
		}
		return deferred.promise();

			

		function isExpired() {
			var currTime = new Date().getTime();
			// tp1 是需要輸入密碼的私雲 expire時間直接就是私雲提供的時間 et
			if(isLdapCompanyOrSSOLogin()) return (nowEt - currTime) < QmiGlobal.ldapExpireTimer;
			// 過期檢查 提前幾天檢查
			else return (nowEt - currTime) < QmiGlobal.ajaxExpireTimer;

			function isLdapCompanyOrSSOLogin() {
				// ldap company
				if((args.companyData || {}).passwordTp === 1) return true;
				if(QmiGlobal.auth.isSso)  return true;
				return false; 
			} 
		}
	},

	reAuth: function(companyData, rspData){
		var self = this,
			deferred = $.Deferred();

		companyData = companyData || QmiGlobal.auth;

		// reAuth Lock 如果已經是deferred 就不重新指定
		if(QmiGlobal.isDefResolved(companyData.reAuthDef)) 
        	companyData.reAuthDef = $.Deferred();

		// 如果有帶rspData 表示et沒過期 打了api卻回傳401
		self.doAuth(companyData, rspData).done(deferred.resolve);

		// reAuth結束
		deferred.done(companyData.reAuthDef.resolve)
		return deferred.promise();
	},

	doAuth: function(companyData, rspData) {
		var self = this;
		var deferred = $.Deferred();

		
		var rspObj = function() {
			try {
				if(rspData)
					return JSON.parse(rspData.responseText);
				else
					return {rsp_code: 9999};
			} catch(e) {
				return {rsp_code: 999, rsp_msg: "parse error"};
			}
		}();

		var rspCode = rspObj.rsp_code;

		// 601: 公雲Token過期, 使用Put /auth進行重新驗證取的新的Token, 如果驗證失敗則請重新登入 
		// 602: 公雲Token錯誤, 根據之前的流程, 將強制登入app
		// 603: 私雲Token過期, 使用Put /auth進行重新驗證取的新的Token, 如果驗證失敗則請重新拉取/groups取的新的key進行私雲驗證登入
		// 604: 私雲Token錯誤, 請重新拉取/groups取的新的key進行私雲驗證登入
		// 605: 公雲上的SSO帳號需要重新驗證, 不可使用Put /auth取得新的Token, 僅能使用Put /sso/auth重新進行LDAP密碼驗證
		// 606: 私雲上的SSO帳號需要重新驗證, 不可使用Put /auth取得新的Token, 僅能使用Put /sso/auth重新進行LDAP密碼驗證

		switch(rspCode) {
			case 601: // 公雲Token過期, 使用Put /auth進行重新驗證取的新的Token, 如果驗證失敗則請重新登入 
				authUpdate();
				break;
			case 602: // 公雲Token錯誤, 根據之前的流程, 將強制登出
				new QmiGlobal.popup({
					desc: rspObj.rsp_msg,
					confirm: true,
					action: [logout]
				});

				deferred.resolve({
                	isSuccess: false,
                	data: rspData,
	        		isReAuth: true
                });
				break;
			case 603: // 私雲Token過期, 使用Put /auth進行重新驗證取的新的Token, 如果驗證失敗則請重新拉取/groups取的新的key進行私雲驗證登入
				authUpdate();
				break;
			case 604: // token 驗證失敗 一般私雲重新取key 做cert
				authCompanyKey();
				break;
			case 605: // 公雲上的SSO帳號需要重新驗證, 不可使用Put /auth取得新的Token, 僅能使用Put /sso/auth重新進行LDAP密碼驗證
				authUpdate();
				break;
			case 606: // 私雲上的SSO帳號需要重新驗證, 不可使用Put /auth取得新的Token, 僅能使用Put /sso/auth重新進行LDAP密碼驗證
				authUpdate();
				break;
			case 607:
				QmiGlobal.module.reAuthUILock.lock(companyData);
				break;
			case 608:
				QmiGlobal.module.reAuthUILock.lock(companyData);
				break;
			case 9999:
				// 沒帶rspCode 表示是expire time過期
				authUpdate();
				break;
			default:
				deferred.resolve({
                	isSuccess: false,
	        		isReAuth: true
                });
		}

		function authUpdate() {
			// 需要輸入密碼
			if((companyData || {}).passwordTp === 1) 
				authUpdateManually();
			else 
				authUpdateAutomatically();
			
		}

		function authUpdateAutomatically() { 
			self.autoUpdateAuth(companyData).done(deferred.resolve);
		}

		function authUpdateManually() { 
			QmiGlobal.module.reAuthUILock.lock(companyData);
			QmiGlobal.module.reAuthManually.init({
				reAuthDef: deferred,
				companyData: companyData
			});
		}

		function authCompanyKey() {
			getCompanyKey({ il: [{
                cdi: companyData.cdi,
                ci: companyData.ci,
                ui: companyData.ui
            }]}).done(function(rspObj){
                if(rspObj.isSuccess === true) {
                	companyData.key = rspObj.key;
                    getCompanyToken(companyData,true).done(function(isSuccess) {
                    	deferred.resolve({
                    		isSuccess: isSuccess,
			        		isReAuth: true
                    	})
                    });
                } else deferred.resolve({
                	isSuccess: false,
                	data: rspObj,
                	msg: "get company's token fail",
	        		isReAuth: true
                });
            })
		}

		return deferred.promise();
	},


	autoUpdateAuth: function(companyData) {
		var self = this;
		var deferred = $.Deferred();

		$.ajax({
		    url: (function(){
				if(companyData.cl === undefined) {
					return base_url + "apiv1/auth";
				} else {
					return "https://" + companyData.cl + "/apiv1/auth";
				}
			})(),

		    headers: self.setHeaders({},companyData),
		    type: "put",
		    error: function(errData){

		    	// et過期 自動更新 但要強制驗證:
		    	// do something

		        deferred.resolve({
		        	isSuccess: false,
		        	data: errData,
		        	isReAuth: true
		        });
		    },

		    success: function(apiData){
		    	// 重新設定at
		    	if(
		    		companyData !== QmiGlobal.auth
		    		&& QmiGlobal.companies[companyData.ci] !== undefined
		    	) {
		    		// 私雲
		    		QmiGlobal.companies[companyData.ci].nowAt = apiData.at;
		    		QmiGlobal.companies[companyData.ci].et = apiData.et;
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
			QmiGlobal.ajaxLoadingUI.hide();
		}

		//不做錯誤顯示 polling也不顯示 isCancel 手動輸入密碼的私雲重新頁面 按取消就不顯示錯誤訊息
		if(ajaxArgs.errHide || ajaxArgs.noErr || isPolling || errData.isCancel === true) return;

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
		
		if(s_load_show === false) QmiGlobal.ajaxLoadingUI.hide();

	}

} // end of QmiAjax



MyDeferred = function() {
  var myResolve, myReject;
  var myPromise = new Promise(function(resolve, reject){
    myResolve = resolve;
    myReject = reject;
  });

  myPromise.resolve = myResolve;
  myPromise.reject = myReject;
  return myPromise;
}

function appOnFocusEvent() {try {
	var appGUI = require('nw.gui');
	var appWindow = appGUI.Window.get();

	appWindow.on("focus", function() {
		QmiGlobal.module.appVesion.init();
	});

} catch(e) {errorReport(e);}}



// 選擇server
$(document).on("click", "#container_version", function() {
	var cnts = 0;
	return function() {
		if(cnts === 0) setTimeout(function() {cnts = 0;}, 1000);
		cnts++;
		if(cnts < 5) return;
		var promt = prompt('輸入密碼');
		if( promt === "86136982") QmiGlobal.module.serverSelector.init();
		else return;
}}());

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
