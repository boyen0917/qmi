var ui;
var at;
var gi;
var countrycode = "+886";	//國碼
var lang = "en_US";			//語言
var debug_flag = false;		//local測試 預設開啟console
var clearChatTimer;
var default_url = "https://ap.qmi.emome.net/";
var back_exception = false;	//部分跳頁不需要記錄

var userLang = navigator.language || navigator.userLanguage;
userLang = userLang.replace(/-/g,"_").toLowerCase();

if( 0 == userLang.indexOf("zh") ) {
	if( userLang=="zh_cn" ) lang = "zh_CN";
	else lang = "zh_TW";	
}

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

var base_url = "https://apserver.mitake.com.tw/";

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
];

//timeline內容 判斷不開啓附檔區域的type ;1是網址 但要另外判斷
var not_attach_type_arr = [0,1,12,13,14,15];
	
var load_show = false;		//顯示loading 圖示 的參數
var s_load_show = false;	//特別的
var compose_timer = false;	//發佈計時器
var max_w = 500; 			//縮圖寬高
var max_h = 500;			//縮圖寬高
var quality = 0.5;			//縮圖寬高

//設置聊天訊息預覽
var set_notification = $.lStorage("_setnoti") || true;

//timeline置頂millisecond
var top_timer_ms = $.lStorage("_topTimeMs") || 5000;

var polling_interval = 5000;			//polling間距


//tab對照表
var initTabMap = {
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
};

//pen對照表
var initPenMap = {
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

// 判斷更改網址 不要上到正式版
$(document).ready(function() {
	if($.lStorage("_selectedServerUrl") === false || $.lStorage("_selectedServerUrl") === default_url) return;
	base_url = $.lStorage("_selectedServerUrl");
	
	if($("#module-server-selector-url").length === 0) $("body").append(QmiGlobal.module.serverSelector.urlHtml());		
	$("#module-server-selector-url").html(base_url);

	// 更改網址 清db
	if($.lStorage("_lastBaseUrl") !== false && $.lStorage("_lastBaseUrl") !== base_url) resetDB();
	$.lStorage("_lastBaseUrl", base_url);
});

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


//上一頁 預設
$(document).data("page-history",[["",""]]);

//登入時間
if( window.parent && window.parent.login_time ){
	login_time = window.parent.login_time;
} else {
	login_time = new Date().getTime();
}


window.QmiGlobal = {

	// 這是web版號 另有桌機版號 module.js deskTopVersion
	// 多加一個條件: 若桌機版號大於web版號 以桌機版號為主
	// initReady裡面做調整
	appVer: "1.8.0.4",

	// 檢查是否為聊天室
	isChatRoom: !!window.location.href.match(/po\/app\/chat.html/),

	// 桌機版設定
	nwGui: function() {
		try {
			return require('nw.gui')
		} catch(e) {
			console.error("非桌機版")
			return null;
		};
	}(),

	// app的資料的預設值
	defaultAppQmiData: {
		listenerMap: {
			onFocus: function() {
				QmiGlobal.module.appVersion.init()
			}
		}
	},

	getAppWin: function() {
		if(QmiGlobal.nwGui === null) return {};
		return QmiGlobal.nwGui.Window.get();
	},


	nwVer: function() {
		try {
			return require("nw.gui").App.manifest.version;
		} catch(e) {return "web"}
	}(),

	// 在下方 document ready之後 initReady
	initReady: function() {
		var initDefArr = [
    		updateLanguage()
		];

		$.when.apply($, initDefArr).done(function() {

			// 若桌機版號大於web版號 以桌機版號為主
			setVersion();

			// nwjs的變數
			QmiGlobal.getAppWin().qmiData = QmiGlobal.getAppWin().qmiData || QmiGlobal.defaultAppQmiData;
			setAppOnFocusEvent(true);

			// 寫入版本號
			$("#app-version").attr("ver-chk", $.i18n.getString("WEBONLY_VERSION_CHK"));
			$("#app-version").attr("version", QmiGlobal.appVer);

			//設定語言, 還沒登入先用瀏覽器的語言設定
			// updateLanguage(lang);

			// 初始動作 registration
			appInitial();

			// // 測試環境 選擇server
			// QmiGlobal.module.serverSelector.showCurrUrl();
		});

		function setAppOnFocusEvent(isExec) {
			try {
				QmiGlobal.getAppWin().removeListener("focus", QmiGlobal.getAppWin().qmiData.listenerMap.onFocus);
				QmiGlobal.getAppWin().qmiData.listenerMap.onFocus = QmiGlobal.defaultAppQmiData.listenerMap.onFocus;
				QmiGlobal.getAppWin().on("focus", QmiGlobal.getAppWin().qmiData.listenerMap.onFocus);

				if(isExec) QmiGlobal.module.appVersion.init();
			} catch(e) {errorReport(e)}
		}

		function setVersion() {
			// 登入頁顯示桌機版號
			$("#container_version").text(QmiGlobal.nwVer +"("+ QmiGlobal.appVer + ")");

			// 不等於1 表示桌機版號沒有大於web版號 不做事
			if(QmiGlobal.module.appVersion.compare(QmiGlobal.nwVer, QmiGlobal.appVer) !== 1) return;

			// 桌機版號 指定給 web版號
			QmiGlobal.appVer = QmiGlobal.nwVer;
		}
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
	method: {}, // 公用函數
	rspCode401: false,

	ajaxExpireTimer: 5 * 86400 * 1000, // ms, 五天
	ldapExpireTimer: 1 * 86400 * 1000, // ms, 一天

	isFirstPolling: true, // 第一次polling要打所有私雲
	reDoCompanyPollingMap: {}, // 需要重打的私雲polling資訊 {ci:xx, pt:xx}, ...

	auth: {},
	me: {},

	emptyGrpPicStr: "images/common/others/empty_img_all_l.png",
	emptyUsrPicStr: "images/common/others/empty_img_personal_l.png",

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
	            if(!QmiGlobal.auth.at) {
	            	location.reload();
	            	return;
	            }

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
	            
	            // location.reload();
	            clearCache();
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
			companyData: companyData,
			isPolling: args.isPolling
		}).done(ajaxExecute)
	})

	function ajaxExecute(chk) {
		// 發生錯誤
		if(chk.isSuccess === false) {
			// setTimeout是讓 ajaxDeferred.promise.success、error 先觸發
			setTimeout(function() {
				ajaxDeferred.reject({
					status: 9999,
					isSuccess: false,
					data: chk.data,
					isCancel: chk.isCancel
				});
			}, 100);
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

			if(isPollingAndLdapCanceled()) 
				deferred.resolve({
					isSuccess: false,
					isCancel: true
				})
			else 
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

		function isPollingAndLdapCanceled() {
			if(!args.companyData) return false;
			if(!args.isPolling) return false;
			if(args.companyData.isReAuthCancel) return true;
			return false;
		}
	},

	reAuth: function(companyData, rspData){
		var self = this;
		var deferred = $.Deferred();
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
				if(QmiGlobal.auth.isSso) {
					new QmiGlobal.popup({
						desc: $.i18n.getString("WEBONLY_LOGOUT_BY_ANOTHER_DEVICE"),
						confirm: true,
						action: [reLogin]
					});
					return;
				}
				authUpdate();
				break;
			case 606: // 私雲上的SSO帳號需要重新驗證, 不可使用Put /auth取得新的Token, 僅能使用Put /sso/auth重新進行LDAP密碼驗證
				if(QmiGlobal.auth.isSso) {
					new QmiGlobal.popup({
						desc: $.i18n.getString("WEBONLY_LOGOUT_BY_ANOTHER_DEVICE"),
						confirm: true,
						action: [reLogin]
					});
					return;
				}
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
			if(QmiGlobal.isChatRoom) window.close();

			QmiGlobal.rspCode401 = true;
			popupShowAdjust("", $.i18n.getString("LOGIN_AUTO_LOGIN_FAIL"),true,false,[reLogin]);	//驗證失敗 請重新登入
			return;
		}
		//ajax 提示訊息選擇 登入頁面錯誤訊息為popup
		if(args.ajaxMsg === true){
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

// 開關、浮水印檢查
QmiGlobal.method.isSettingAllowed = function(argObj) {
	var type = argObj.tp;
	var typeArr = ["li", "re", "wa"];
	var swObj = QmiGlobal.groups[argObj.gi].newData.sw;
	var result = true;

	switch(argObj.tp) {
		case 2:
			result = 3;
			break;
		default:
			result = !!+swObj[typeArr[argObj.tp]][argObj.eventTp.substring(1)];
	}

	if(result === false) toastShow($.i18n.getString("WEBONLY_FORBIDDEN_FEATURE"));
	return result;
}	



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



// 選擇server
$(document).on("click", "#container_version", function() {
	var cnts = 0;
	return function() {
		if(cnts === 0) setTimeout(function() {cnts = 0;}, 1000);
		cnts++;
		if(cnts < 5) return;
		QmiGlobal.module.serverSelector.init();
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
	// chatroom自己有判斷
	if(QmiGlobal.isChatRoom) return;

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
