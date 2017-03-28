
QmiGlobal.module.reAuthUILock = {
	lock: function(companyData) {
		if(!companyData) return;
		companyData.isReAuthCancel = true;
		this.action({
			isReAuthUILock: true,
			companyData: companyData,
			classStatus: "addClass",
			textStatus: "show"
		});
	},
	unlock: function(companyData) {
		if(!companyData) return;
		companyData.isReAuthCancel = false;
		this.action({
			isReAuthUILock: false,
			companyData: companyData,
			classStatus: "removeClass",
			textStatus: "hide"
		});
	},
	action: function(actionData) {
		var companyData = actionData.companyData;
		var groupListArea = $("#page-group-main .sm-group-list-area");
		Object.keys(QmiGlobal.companyGiMap).forEach(function(cgi) {
			if(QmiGlobal.companyGiMap[cgi].ci !== companyData.ci) return;
			if(!QmiGlobal.groups[cgi]) return; // 還未取得團體
			QmiGlobal.groups[cgi].isReAuthUILock = actionData.isReAuthUILock;

			var groupDom = groupListArea.find(".sm-group-area[data-gi="+cgi+"]");
			groupDom.find(".sm-group-area-l")[actionData.classStatus]("auth-lock").end()
			.find("span.auth-lock-text")[actionData.textStatus]();
 		});
	}
}




// reAuthManuallyUI
QmiGlobal.module.reAuthManually = {

	isExist: false,

	id: "view-auth-manually",

	hasAjaxLoad: false,

	reAuthDef: {}, // QmiAjax裡面的reAuth deferred 還在等待完成

	getView: function(veId) {
		var viewId = this.id +":"+ veId;
		return QmiGlobal.eventDispatcher.viewMap[viewId].jqElem;
	},

	init: function(argObj) {
    	var self = this;

    	// 關閉原本的ajax load 圖示
    	if($(".ajax-screen-lock").is(":visible")) {
    		self.hasAjaxLoad = true;
    		QmiGlobal.ajaxLoadingUI.hide();
    	}

    	self.reAuthDef = argObj.reAuthDef || $.Deferred();
    	self.companyData = argObj.companyData;

    	if(!self.companyData) {
    		console.error("reAuthManually格式錯誤");
    		return;
    	} else if(self.isExist) return;

    	$("#" + self.id).remove();

    	self.view = $("<section>", {
	        id: self.id,
	        html: self.html()
	    });

    	$("body").append(self.view);
    	self.view.fadeIn(100);

    	self.isExist = true;

    	QmiGlobal.eventDispatcher.subscriber([
    		{
    			veId: "cancel", 
    			jqElem: self.view.find("span.cancel"), 
    			eventArr: ["click"],
    		}, {
    			veId: "submit", 
    			jqElem: self.view.find("span.submit"), 
    			eventArr: ["click"],
    		}, {
    			veId: "input", 
    			jqElem: self.view.find("div.input-wrap input"), 
    			eventArr: ["input"],
    		}
    	], self, true);

    	return self.reAuthDef.promise();
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
					(QmiGlobal.companies[self.companyData.ci] || {}).isReAuthCancel = true;
					
					// 取消api
					self.reAuthDef.resolve({
						isSuccess: false,
						isCancel: true
					})

					// 要再點一次timelineChangeGroup 做lock的ui顯示
					timelineChangeGroup(gi)
				}
				// reAuthDef from QmiAjax 
				// self.reAuthDef.resolve({
				// 	isSuccess: false,
				// 	isSso: true,
				// 	isReAuth: true,
				// 	data: {isCancel: true}
				// })
				self.remove();
				break;

			case "input:input":
				var submitDom = self.view.find("div.action span[viewid=submit]");
	    		self.ssoId = self.getView("input")[0].value;
	    		self.ssoPw = self.getView("input")[1].value;

		    	if(self.ssoId === "" || self.ssoPw === "") {
		    		submitDom.removeClass("ready");
		    		return;
		    	} else submitDom.addClass("ready");

				break;
		}
	},

	html: function() {
		return "<div class='container '>"
		+ "<section class='icon-shield'></section>"
		+ "<div class='title1'>" + $.i18n.getString("ACCOUNT_BINDING_ACCOUNT_RECERTIFICATION") + "</div>"
		+ "<div class='title2'>" + $.i18n.getString("ACCOUNT_BINDING_ENTER_LDAP_PASSWORD") + "</div>"
        + "<div class='input-wrap email'><input viewId='email' class='email' value=\""+ this.companyData.id +"\" readonly ></div>"
        + "<div class='input-wrap password'><input viewId='password' class='password' type='password' placeholder='"+ $.i18n.getString("ACCOUNT_BINDING_PASSWORD") +"'></div>"
        + "<div class='action'>"
        + "<span class='cancel' viewId='cancel'>" + $.i18n.getString("ACCOUNT_BINDING_CANCEL") + "</span>"
        + "<span class='submit' viewId='submit'>" + $.i18n.getString("ACCOUNT_BINDING_DONE") + "</span>"
        + "</div>";
    },

    submit: function() {
    	var self = this,
    		submitDom = self.getView("submit"),
    		cData = self.companyData;

    	if(submitDom.hasClass("ready") === false) return;

    	QmiGlobal.companies[self.companyData.ci].isReAuthCancel = false;

    	self.view.find(".container").addClass("loading");

    	// 這邊如果用QmiAjax 會因為reAuthDef pending而無法執行
    	$.ajax({
			url: "https://"+ cData.cl +"/apiv1/sso/clouds/"+ cData.cdi +"/companies/"+ cData.ci +"/auth",
			ci: cData.ci,
			headers: {li: lang},
			data: JSON.stringify({
				id: self.ssoId,
			    dn: QmiGlobal.device,
			    pw: QmiGlobal.aesCrypto.enc(self.ssoPw, self.ssoId.substring(0,16)),
			    at: cData.nowAt
			}),
			type: "put",
		}).complete(function(data){
			var newAuth = false;
			try {
				var newAuth = JSON.parse(data.responseText);
			} catch(e) {}

			if(data.status !== 200 || newAuth === false) {
				self.view.find(".container").removeClass("loading");
				self.getView("input")[1].value = "";
				toastShow(newAuth.rsp_msg);

				return;
			}

			// 設定新at , et
			QmiGlobal.companies[cData.ci].at = newAuth.at;
			QmiGlobal.companies[cData.ci].et = newAuth.et;

			// 先解company reAuthDef
			self.reAuthDef.resolve({
				isSuccess: true,
				isSso: true,
				isReAuth: true
			});

			if(!QmiGlobal.isCompanyLoaded(cData.ci)) {
				closeUI();
				return;
			}

			// 重新取得所有團體
			QmiGlobal.chainDeferred(getCompanyGroup(cData)).then(function() {
				return function() {
					return getMultiGroupCombo(Object.keys(QmiGlobal.companyGiMap).reduce(function(arr, currGi) {
						if(QmiGlobal.companyGiMap[currGi].ci === cData.ci) arr.push(currGi);
						return arr;
					}, []), true); // 第二參數 是要更新左側選單資訊
				}
			}()).then(closeUI); // end of chainDeferred

		});

		function closeUI() {
			QmiGlobal.module.reAuthUILock.unlock(self.companyData);
			// reAuth 結束
			setTimeout(function() {
				self.view.find(".container").attr("msg", $.i18n.getString("WEBONLY_AUTH_SUCCESS"));
			}, 300)
			// reAuth 結束
			setTimeout(function() {
				self.remove();
				// 重新執行timelineChangeGroup 讓畫面開啟
				timelineChangeGroup(gi);
			}, 500);
		}
    },

    remove: function() {
    	var self = this;
    	self.isExist = false;
    	self.view.fadeOut(100, function() { self.view.remove()});
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

    	// 防止loading覆蓋
    	QmiGlobal.ajaxLoadingUI.hide();
    	
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
				break;

			case "click:ldapSetting":
				// func.js  timelineSwitch  system-ldap-setting
				// QmiGlobal.ldapSetting.init();
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
		self.view.remove();
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


QmiGlobal.module.appVersion = {

	init: function(isUserClick) {
		var self = this;
		var deferred = $.Deferred();

		// 非桌機版
		if(QmiGlobal.nwGui === null) {
			deferred.resolve();
			return deferred.promise();
		}

		// 點選檢查更新 要跳過不更新的判斷
		self.isUserClick = isUserClick;

		// 綁定事件
		$("#app-version").off().click(function() {
			self.init(true);
		});

		// 不需要執行的判斷
		if(isNoNeedToCheckAndUpdate()) return;
		
		if(isUserClick) self.loadingUI.on();
		self.apiSysVersion().success(function(rspData) {
    		
    		self.data = rspData;

    		// 檢查Web版本 版本相同 不更新
    		if(QmiGlobal.appVer === rspData.av) rspData.ut = 2;

    		// 檢查桌機版本 先確認有url 再判斷下載網址
    		var isDeskTopOldVersion = false;
    		try {
    			if(rspData.uu !== "null") {
					// < 0 表示舊版本 要提示下載
					if(self.compare(QmiGlobal.nwVer, rspData.av) < 0) {
						isDeskTopOldVersion = true;
					}
	    		}
    		} catch(e) {};

    		// 設定版本更新類別
    		self.switchStr = "" + rspData.ut + +isDeskTopOldVersion;
    		
    		// 感覺比較好
    		if(isUserClick)
	    		setTimeout(function() {
	    			self.update();
	    		}, 300)
	    	else
	    		self.update();

		}).error(function(rspData) {
			console.log("err", rspData);
		}).complete(function() {
			if(isUserClick) self.loadingUI.off();
			deferred.resolve();
		});

		return deferred.promise();

		function isDownloaded() {
			// 預設最小值
			QmiGlobal.getAppWin().qmiData.downloadTimer = QmiGlobal.getAppWin().qmiData.downloadTimer || 0;
			if(self.isUserClick) return false;

			// 超過一天 就顯示download
			if(new Date().getTime() - QmiGlobal.getAppWin().qmiData.downloadTimer > (24 * 60 * 60 * 1000)) {
				return false;
			}
			return true;
		}

		function isNoNeedToCheckAndUpdate() {
			// 聊天室不需要
			if(QmiGlobal.isChatRoom) return true;

			// 已點選過下載
			if(isDownloaded()) return true;

			// 正在執行中
			if(self.loadingUI.isLoading()) return true;

			return false;
		}
	},

	loadingUI: function() {
		var isLoading = false;
		return {
			on: function() {
				isLoading = true;
				$("#app-version").append("<div class=\"loading\"><img src=\"images/loading2.gif\"></div>")
			},
			off: function() {
				setTimeout(function() {
					isLoading = false;
					$("#app-version div.loading").remove();
				}, 1000);
			},
			isLoading: function() {return isLoading;}
		}
	}(),

	
	update: function() {
		var self = this;

		switch(self.switchStr) {
			case "00": // 手動更新 桌機無更新
				// 文案：「有新版本，將自動更新資料。」
				// 按鈕：「確定」
				// 規格：情境一只能選擇「確定」，並自動更新網頁資料。
				new QmiGlobal.popup({
					desc: $.i18n.getString("WEBONLY_APPVERSION_00"),
					confirm: true,
					action: [reload]
				});	

				// self.updateOptional();
				break;
			case "01": // 手動更新 桌機有更新 
				// 文案：「有新版本安裝程式，是否下載安裝？」
				// 按鈕：「下載」、「取消」
				// 規格：
				// 「下載」 => 自動下載新的安裝檔，客戶自行決定是否點擊安裝。
				// 「取消」 => 取消則下次檢查更新時重新詢問是否下載。

				// 桌機版要有正確版號
				new QmiGlobal.popup({
					desc: $.i18n.getString("WEBONLY_APPVERSION_01"),
					confirm: true,
					cancel: true,
					action: [nwDownload.bind(self, true)],
					cancelAction: function() {
						setDownloadTimer();
						QmiGlobal.appReload.do({act: "feeds", isReloadDirectly: true});
					}
				});
				break;
			case "10": // 強制更新 桌機無更新
				// 文案：「有新版本，將自動更新資料。」
				// 按鈕：「確定」
				// 規格：情境一只能選擇「確定」，並自動更新網頁資料。
				new QmiGlobal.popup({
					desc: $.i18n.getString("WEBONLY_APPVERSION_00"),
					confirm: true,
					action: [reload]
				});

				break;
			case "11" : // 強制更新 桌機有更新
				// 文案：「有新版本安裝程式，下載後請重新安裝。」
				// 按鈕：「下載」
				// 規格：
				// 「下載」 => 自動下載新的安裝檔，客戶自行決定是否點擊安裝，若無安裝，下次登入仍會跳出強制下載頁面無法使用。

				new QmiGlobal.popup({
					desc: $.i18n.getString("WEBONLY_APPVERSION_01"),
					confirm: true,
					action: [nwDownload.bind(self, true)]
				});

				break;
			case "21":

				// 桌機版需要更新
				new QmiGlobal.popup({
					desc: $.i18n.getString("WEBONLY_APPVERSION_01"),
					confirm: true,
					cancel: true,
					action: [nwDownload],
					cancelAction: function() {
						setDownloadTimer();
					}
				});
				break;
			default: 
				if(!self.loadingUI.isLoading()) return;
				setTimeout(function() {
					toastShow($.i18n.getString("WEBONLY_IS_LATEST_VERSION"));
				}, 1000);
				break;
		}

		function reload() {
			setDownloadTimer();
			QmiGlobal.appReload.do({act: "feeds", isReloadDirectly: true});
		}

		function nwDownload(isReload) {
			setDownloadTimer();
			var filename = "mac";
			// windows
			if(process.execPath.indexOf("C:\\") === 0) filename = "win";

			var link=document.createElement('a');
		   	document.body.appendChild(link);
		   	link.href= self.data.uu + "/"+ filename +".zip";
		   	link.click();
		   	document.body.removeChild(link);

		   	if(isReload) setTimeout(reload, 1000);
		}

		function setDownloadTimer() {
			QmiGlobal.getAppWin().qmiData.downloadTimer = new Date().getTime();
		}
	},

	apiSysVersion: function() {
		return new QmiAjax({
    		apiName: "sys/version",
    		timeout: 5000,
    		isPublic: true,
    		noAuth: true,
    		specifiedHeaders: {
    			os: 2,
				tp: 0,
				av: QmiGlobal.appVer || "1.0.0",
				li: lang
			},
    		method: "get",
    		errHide: true
    	});
	},

	compare: function(a, b) {
		if(!a || !b) return 0;
	    if (a === b) return 0;

	    var a_components = a.split(".");
	    var b_components = b.split(".");

	    var len = Math.min(a_components.length, b_components.length);

	    // loop while the components are equal
	    for (var i = 0; i < len; i++) {
	        // A bigger than B
	        if (parseInt(a_components[i]) > parseInt(b_components[i])) return 1;
	        // B bigger than A
	        if (parseInt(a_components[i]) < parseInt(b_components[i])) return -1;
	    }

	    // If one's a prefix of the other, the longer one is greater.
	    if (a_components.length > b_components.length) return 1;
	    if (a_components.length < b_components.length) return -1;
	    return 0; // Otherwise they are the same. 
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

				newUrl += "/";
				base_url = newUrl;
				if(newUrl === default_url) {
					$("#module-server-selector-url").html("");
					localStorage.removeItem("_selectedServerUrl");
				} else {
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