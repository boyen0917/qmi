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

			// 當前團體開啟頁面黑屏
			if(actionData.isReAuthUILock && cgi === QmiGlobal.currentGi)
				$("#page-group-main .gm-content > .refresh-lock").show();
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
		return QmiGlobal.eventDispatcher.viewMap[viewId].elemArr;
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
    			elemArr: self.view.find("span.cancel"), 
    			eventArr: ["click"],
    		}, {
    			veId: "submit", 
    			elemArr: self.view.find("span.submit"), 
    			eventArr: ["click"],
    		}, {
    			veId: "input", 
    			elemArr: self.view.find("div.input-wrap input"), 
    			eventArr: ["input"],
    		}
    	], self, true);

    	return self.reAuthDef.promise();
    },

    // custom event
	handleEvent: function() {
		var self = this;
		var temp = event.type.split(":"+self.id).join("").split(":");
		temp.pop();
		var eventCase = temp.join(":");
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
			    pw: QmiGlobal.aesCrypto.enc(self.ssoPw, (self.ssoId +"_"+ QmiGlobal.device).substring(0,16)),
			    // 2018/1/17 流程有誤 暫時先在這改
			    // single sign on 就使用QmiGlobal.auth.at
			    at: QmiGlobal.auth.isSso ? QmiGlobal.auth.at : cData.nowAt
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

			// 2018/1/17 流程有誤 暫時先在這改
		    // single sign on 要更新QmiGlobal.auth.at
			if(QmiGlobal.auth.isSso) {
				QmiGlobal.auth.at = newAuth.at;
				QmiGlobal.auth.et = newAuth.et;
			}


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

	// 系統公告需要紅點提示
	redSpot: {},

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
    	
    	QmiGlobal.eventDispatcher.subscriber([{
    			veId: "close", 
    			elemArr: self.view, 
    			eventArr: ["click"],
    		}, {
    			veId: "ldapSetting", 
    			elemArr: self.view.find("[data-sm-act=system-ldapSetting]"), 
    			eventArr: ["click"]
    		}, {
    			veId: "annoucement", 
    			elemArr: self.view.find("div[view=announcement]"), 
    			eventArr: ["click"],
    		}, {
    			veId: "logout", 
    			elemArr: self.view.find("div.system-logout"), 
    			eventArr: ["click"],
    	}], self, true);
    },

    handleEvent: function() {
    	var self = this;
		var temp = event.type.split(":"+self.id).join("").split(":");
		temp.pop();
		var eventCase = temp.join(":");
		switch(eventCase) {
			case "click:close":
				$("#userInfo .sm-person-area-r").find("img").toggle();
				break;

			case "click:annoucement":
				self.redSpot.announcement = false;
				self.view.find("div[view=announcement]").removeClass("red-spot");
				$("#userInfo").removeClass("red-spot");

				QmiGlobal.module.systemAnnouncement.init();
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
    	var self = this;
    	return '<div class="sm-person-info">'
        + 	'<div class="sm-info-hr" data-textid="LOGIN_SAVE_ACCOUNT_TITLE"></div>'
        + 	'<div data-sm-act="user-setting" class="sm-info sm-small-area" data-textid="PERSONAL_INFORMATION"></div>'
        + 	'<div class="line"></div>'
        + 	'<div class="sm-info-hr" data-textid="SYSTEM"></div>'
        + 	'<div data-sm-act="system-setting" class="sm-info sm-small-area" data-textid="LEFT_SYSTEM_SETTING"></div>'
        + 	'<div data-sm-act="system-ldapSetting" class="sm-info sm-small-area" data-textid="'+ (QmiGlobal.auth.isSso ? "ACCOUNT_BINDING_BIND_QMI_ACCOUNT" : "ACCOUNT_BINDING_BINDING_LDAP_ACCOUNT" )+'"></div>'
        	// data-sm-act 會觸發 timelineswitch
        + 	'<div view="announcement" class="sm-info '+ function() {
        		if(self.redSpot.announcement) return "red-spot";
        		else return "";
        	}() +'" data-textid="SYSTEM_ANNOUNCEMENT_ANNOUNCEMENT"></div>'
        + 	'<div class="sm-info system-logout" data-textid="SETTING_LOGOUT"></div>'
        + '</div>';
    }
}


QmiGlobal.module.systemAnnouncement = new QmiGlobal.ModuleConstructor({
	id: "system-annoucement",

	init: function() {
		var self = this;
		self.setHtmlStr();
		self.view = $(self.html.frame);

		$("body").append(self.view);
    	self.view.fadeIn(100);

    	self.renderNoticesList();

		QmiGlobal.eventDispatcher.subscriber([{
    			veId: "close", 
    			elemArr: self.view.find("> header > *"), 
    			eventArr: ["click"]
    		}
		], self);    	
	},

	renderNoticesList: function() {
		var self = this;

		self.api.getNoticesTp1().complete(function(rspData) {
	        if(rspData.status !== 200) return;
	        try {
	        	var noticesData = JSON.parse(rspData.responseText);
	        } catch(e) {return}


	        var bodyDom = self.view.find("section.body");
	        var veArr = [];
	        noticesData.nl = noticesData.nl || [];
	        if(noticesData.nl.length === 0) {
	        	bodyDom.find("div.empty").show();
	        	return;
	        }

	        noticesData.nl.forEach(function(item, i) {
	        	var dom = $(self.html.announcement);
	        	if(isIllegalDataFormat(item)) return null;

	        	dom.find("span.time").text(new Date(item.nd.ct).toFormatString())
	        	dom.find("section.title").text(item.oet);
	        	dom.find("section.content").text(item.nd.ml[0].c);
	        	
	        	bodyDom.append(dom);

	        	var oriHeight = dom.find("section.content").height();
	        	if(oriHeight <= 40) return;

	        	// read more
	        	dom.find("section.content").addClass("collapse").addClass("animate-height");
	        	var moreDom = dom.find("> footer");
	        	moreDom.show();

	        	veArr.push({
	        		veId: "more", 
	    			elemArr: moreDom, 
	    			eventArr: ["click"],
	    			data: {dom: dom, oriHeight: oriHeight}
	        	})
	        });
	        QmiGlobal.eventDispatcher.subscriber(veArr, self);
		});

		function isIllegalDataFormat(data) {
			if(!(data instanceof Object)) return true;
			if(!(data.nd instanceof Object)) return true;
			if(!(data.nd.ml instanceof Array)) return true;
			if(!(data.nd.ml[0] instanceof Object)) return true;
			return false;
		}
	},

	clickMore: function(event) {
		var dom = event.data.dom;
		dom.find("section.content")
		.removeClass("collapse")
		.css("height", event.data.oriHeight);

		dom.find("> footer").fadeOut("fast");
	},

	clickClose: function() {
		this.close();
	},

	close: function() {
		var self = this;
		self.view.fadeOut("fast", function() {
			QmiGlobal.eventDispatcher.cleaner(self.id);
			self.view.remove();
		});
	},

	clickInitAnnoucement: function() {
    },

    setHtmlStr: function() {
		this.html = {
    		frame: `<section id="system-annoucement">
		    		<header>
		    			<img src="images/navi/navi_icon_back.png">
		    			<span>${$.i18n.getString("SYSTEM_ANNOUNCEMENT_ANNOUNCEMENT")}</span>
		    		</header>
		    		<section class="body"><div class="empty">
		    			<img src="images/Qmi_Logo_Empty.png">
		    			<div>${$.i18n.getString("SYSTEM_ANNOUNCEMENT_EMPTY")}</div>
		    		</div></section>
		    	</section>`,

	    	announcement: `
	    		<section class="announcement">
					<header>
						<span>Qmi ${$.i18n.getString("SYSTEM_ANNOUNCEMENT_ANNOUNCEMENT")}</span>
						<span class="time"></span>
					</header>
					<section class="title"></section>
					<section class="content"></section>
					<footer>${$.i18n.getString("INTERGRATIONS_READMORE")}</footer>
				</section>`
		}
    },

	api: {
		getNoticesTp1: function() {
			return new QmiAjax({
				apiName: "notices?tp=1",
				isPublicApi: true,
			});
		}
	}
});


QmiGlobal.module.appVersion = {

	apiTimer: 0, // 短時間內不重打 紀錄上次打的時間 
	apiInterval: 60 * 60 * 1000, // 暫訂一小時一次

	versionOsMap: {
		2: {nm: "Qmi", os: 2, av: QmiGlobal.appVer},
		4: {nm: "NodeWebkit", os: 4, av: QmiGlobal.nwVer}},

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
		self.apiSysVersion().done(function(resultObj) {
			var nmArr = ["app", "nw"];
    		var versionObj = Object.keys(self.versionOsMap).reduce(function(obj, osTp, i) {
    			obj[nmArr[i]] = resultObj[osTp] || {};
    			return obj;
    		}, {});


    		self.appVer = versionObj.app || {};
    		self.nwVer = versionObj.nw || {};

    		var appVerStr = self.appVer.ut;

    		// 檢查Web版本 版本相同 不更新
    		if(QmiGlobal.appVer === self.appVer.av) appVerStr = 2;

    		// 檢查桌機版本 先確認有url 再判斷下載網址
    		var isDeskTopOldVersion = false;
    		try {
    			if(self.nwVer.uu !== "null") {
					// < 0 表示舊版本 要提示下載
					if(self.compare(QmiGlobal.nwVer, self.nwVer.av) < 0) {
						isDeskTopOldVersion = true;
					}
	    		}
    		} catch(e) {};

    		// 設定版本更新類別
    		self.switchStr = "" + appVerStr + (+isDeskTopOldVersion);

    		// 要有三組數字
    		// 已更新至最新版本
    		// 系統設定要有2組
    		
    		// 感覺比較好
    		if(isUserClick)
	    		setTimeout(function() {
	    			self.update();
	    		}, 300)
	    	else
	    		self.update();

		}).fail(function(rspData) {
			console.log("err", rspData);
		}).always(function() {
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
			// 直接點選 
			if(self.isUserClick) return false;

			// 聊天室不需要
			if(QmiGlobal.isChatRoom) return true;

			// 已點選過下載
			if(isDownloaded()) return true;

			// 短時間內不重打
			if(isWithinApiInterval()) return true;

			// 正在執行中
			if(self.loadingUI.isLoading()) return true;

			return false;
		}

		function isWithinApiInterval() {
			var currTime = new Date().getTime();
			if(currTime - self.apiTimer < self.apiInterval) return true;
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
					desc: $.i18n.getString("WEBONLY_APPVERSION_02"),
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
					desc: $.i18n.getString("WEBONLY_APPVERSION_02"),
					confirm: true,
					action: [nwDownload.bind(self, true)]
				});

				break;
			case "21":

				// 桌機版需要更新
				new QmiGlobal.popup({
					desc: $.i18n.getString("WEBONLY_APPVERSION_02"),
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
			// default mac
			var filename = "mac";
			// windows
			if(process.execPath.indexOf("C:\\") === 0) filename = "win";

			var link=document.createElement('a');
		   	document.body.appendChild(link);
		   	link.href= self.nwVer.uu + "/"+ filename +".zip";
		   	link.click();
		   	document.body.removeChild(link);

		   	if(isReload) setTimeout(reload, 1000);
		}

		function setDownloadTimer() {
			QmiGlobal.getAppWin().qmiData.downloadTimer = new Date().getTime();
		}
	},

	apiSysVersion: function() {
		var self = this;
		var apiDeferred = $.Deferred();
		var resultObj = {};
		$.when.apply($, Object.keys(self.versionOsMap).map(function(osTp) {
			var deferred = $.Deferred();
			
			new QmiAjax({
	    		apiName: "sys/version",
	    		timeout: 5000,
	    		isPublicApi: true,
	    		noAuth: true,
	    		specifiedHeaders: {
	    			os: osTp,
					tp: 0,
					av: self.versionOsMap[osTp].av || "1.0.0",
					li: lang,
					
				},
	    		method: "get",
	    		errHide: true
	    	}).success(function(rspData) {
	    		resultObj[osTp] = rspData;
	    		deferred.resolve();
	    	})
	    	.fail(function(errData) {
	    		resultObj[osTp] = {isSuccess: false, msg: function() {
	    			try {
	    				return JSON.parse(errData.responseText).rsp_msg;
	    			} catch(e) {return $.i18n.getString("COMMON_UNKNOWN_ERROR")}
	    		}()};
	    		deferred.resolve();
	    	});

	    	return deferred.promise();
		})).done(function() {
			self.apiTimer = new Date().getTime();
			apiDeferred.resolve(resultObj);
		});

		return apiDeferred.promise();
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
			if($(liDom).find("> div:last-child").text() + "/" === base_url) {
				chk = true;
				$(liDom).addClass("selected").addClass("active");
			}
		});

		if(chk === false) self.view.find("li:last-child").addClass("selected").addClass("active").find("input").val(base_url.split("/apiv1")[0]);

		QmiGlobal.eventDispatcher.subscriber([{
    			veId: "item", 
    			elemArr: self.view.find("li"), 
    			eventArr: ["click"]
    		},{
    			veId: "submit", 
    			elemArr: self.view.find("button"), 
    			eventArr: ["click"]
    		}
		], self, true);
	},

	handleEvent: function() {
		var self = this;
		var thisElem = event.detail.elem;
		var temp = event.type.split(":"+self.id).join("").split(":");
		temp.pop();
		var eventCase = temp.join(":");
		switch(eventCase) {
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

				// 改完刪資料庫
				resetDB();
				
				newUrl += "/";
				base_url = newUrl;
				// if(newUrl === default_url) {
				// 	$("#module-server-selector-url").html("");
				// 	localStorage.removeItem("_selectedServerUrl");
				// } else {
					$.lStorage("_selectedServerUrl", newUrl);
				// }

				

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
					"qmi17$https://qmi17.mitake.com.tw",
					"自訂$<input placeholder='輸入網址'>"
				].reduce(function(str, curr) {
					return str += "<li><div>"+ curr.split("$")[0] +"</div><div>"+ curr.split("$")[1] + "</div></>";
				}, "");
			})() +"</ul>"
			+ "<div><button>"+ $.i18n.getString("COMMON_OK") +"</button></div>"
		+ "</section></section>"
	},
	urlHtml: function() {return "<div id='module-server-selector-url'></div>"}
};

QmiGlobal.eventDispatcher = {

	viewMap: {},

	handleEvent: function() {
		// 防連點 start
		var closureObj = {};
		return function(event) {
			//禁止連點
			if(preventMultiClick(event) === false) return;

			var self = this;
			// event currentTarget -> event綁定的對象
			var viewId = event.currentTarget.dataset.veId;
			// elemArr 是arr 每個elem都比對
			var elemArr = self.viewMap[viewId].elemArr, length = elemArr.length;
			for(var i=0; i<length; i++) {
				if(event.currentTarget === elemArr[i]) {
					window.dispatchEvent(new CustomEvent(event.type+ ":" +viewId, {detail: {elem: event.currentTarget, data: (self.viewMap[viewId].data || {}), target: event.target, originalEvent: event}}));
					return;
				// // 清理沒用到的 但要注意如何定義沒用到？ 例如jquery 的 detach
				// } else if(document.contains(elemArr[i])){
				}
			}
		}

		function removeViewEvent() {

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
			var viewId = handler.id+":"+ veObj.veId +":"+ QmiGlobal.getUID();
			self.viewMap[viewId] = veObj;
			veObj.eventArr.forEach(function(eventType) {
				// elemArr 是arr 每個elem都掛上事件監聽
				Array.prototype.forEach.call(veObj.elemArr, function(elem) {
					// 編號
					elem.dataset.veId = viewId;
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


QmiGlobal.module.webview = new QmiGlobal.ModuleConstructor({

	id: "module-webview",

	rowLimit: 5,

	init: function() {
		var self = this;
		var containerDom = $("#subpage-webview").empty();
		self.getWebview().done(function(rspData) {
			try {
				var webviewList = JSON.parse(rspData.responseText).wl
			} catch(e) {noData(); return;}

			(webviewList || []).forEach(function(item, i) {
				var dom = $(self.html.row);
				dom.find("span").text(item.name);

				QmiGlobal.eventDispatcher.subscriber([{
	    			veId: "linkHeader", 
	    			elemArr: dom, 
	    			eventArr: ["click"],
	    			data: item
	    		}], self);

				containerDom.append(dom);
			});
			
		}).fail(noData);

		function noData(errData) {
			containerDom.html($.i18n.getString("USER_PROFILE_NO_DATA"))
		}
	},

	clickLinkHeader: function(args) {
		var linkEl = document.createElement("a");
		document.body.appendChild(linkEl);
	   	linkEl.href= args.data.url;
	   	linkEl.click();
	   	document.body.removeChild(linkEl);
	},

	getWebview: function() {
		return new QmiAjax({
			apiName: "groups/"+ QmiGlobal.currentGi +"/webview",
			noErr: true
		})
	},


	html: {
		row: "<section><img src=\"images/common/icon/link.png\"><span></span></section>"
	}
});


QmiGlobal.module.chatMsgForward = new QmiGlobal.ModuleConstructor({

	id: "chatMsgForward",

	limit: {
		msg: 100,
		des: 50,
	},

	listArr: [
		{id: "copy", textid: "FEED_COPY"},
		{id: "forward", textid: "WEBONLY_CHAT_FORWARD"}
	],

	init: function() {
		var self = this;
		self.chatContentDom = $("#chat-contents");

		self.data = self.initData();

		$("#chat-contents > footer > ul")
		.find("> li.cancel").text($.i18n.getString("COMMON_CANCEL")).end()
		.find("> li.forward > span.text").text($.i18n.getString("WEBONLY_CHAT_FORWARD"));
		
		QmiGlobal.eventDispatcher.subscriber([{
			veId: "forwardOperation", 
			elemArr: self.chatContentDom, 
			eventArr: ["click", "contextmenu"]
		}, {
			veId: "cancelForwardUI", 
			elemArr: self.chatContentDom.find("> footer > ul > li.cancel"), 
			eventArr: ["click"]
		}, {
			veId: "showMemberView", 
			elemArr: self.chatContentDom.find("> footer > ul > li.forward"), 
			eventArr: ["click"]
		}], self);
	},

	menuInit: function(container) {
		if(!container) return;
		var menuDom = container.find("> ul.msg-menu");
		if(!menuDom.length) {
			menuDom = this.createMenuDom(container);
			container.append(menuDom);
		} else {
			menuDom = container.find("> ul.msg-menu");
			menuDom.show();
		}
		container.css("-webkit-user-select", "none");
		var chatMsgDom = container;
		container.mouseleave(function() {
			container.unbind("mouseleave");
			container.css("-webkit-user-select", "initial");
			menuDom.hide();
		});

	},

	createMenuDom: function(container) {
		var self = this;
		var isLeft = function() {
			if(container.find(".menu-right").length) return false;
			return true;
		}();

		return $("<ul>", {
			class: "msg-menu"+ function() {
				if(!isLeft) return " right";
				return "";
			}(),
			style: function() {
				var msgDom = container.find(".menu-target");
				if(isLeft) 
					return "left: "+ (msgDom.width() + 20);
				else 
					return "right: "+ (msgDom.width() - 40);
			}() +"px;",
			html: self.listArr.map(function(item, i) {
				var liDom = $("<li>", {
					class: i ? "" : "copy",
					html: $.i18n.getString(item.textid)
				});

				QmiGlobal.eventDispatcher.subscriber([{
	    			veId: item.id, 
	    			elemArr: liDom, 
	    			eventArr: ["click"],
	    			data: {container: container}
	    		}], self);

				return liDom;
			})
		});
	},

	clickForwardOperation: function(event) {
		var self = this;
		var targetDom = $(event.evt.target);
		var forwardMsgMap = self.data.get("forwardMsgMap") || {};

		if(isNotForwardMode()) return;

		var msgDom = targetDom.parent();

		var msgData = msgDom.data("msgData");
		if(msgDom.hasClass("selected")) {
			msgDom.removeClass("selected");
			delete forwardMsgMap[msgData.ei];

		// 超過轉傳限制
		} else if(Object.keys(forwardMsgMap).length >= self.limit.msg) {
			toastShow($.i18n.getString("CHATROOM_FORWARD_MAXIMUM_SELECTION", self.limit.msg));
			return;
		} else {
			msgDom.addClass("selected");
			forwardMsgMap[msgData.ei] = msgData;
		}

		self.data.set("forwardMsgMap", forwardMsgMap);

		// 寫入數字
		var selectedNum = Object.keys(forwardMsgMap).length || 0;
		var forwardDom = $("#chat-contents > footer > ul > li.forward").removeClass("is-none");
		forwardDom.find("> span.num").text(` (${selectedNum})`);
		if(selectedNum === 0) 
			forwardDom.addClass("is-none");


		function isNotForwardMode() {
			if(!self.chatContentDom.hasClass("forward")) return true;
			if(!targetDom.hasClass("cover")) return true;
			return false;
		}
	},

	contextmenuForwardOperation: function(event) {
		var self = this;
		var targetDom = $(event.evt.target);

		if(isNotTarget()) return;

		event.evt.stopPropagation();
		event.evt.preventDefault();

		QmiGlobal.getAppWin().focus();

		self.menuInit(targetDom.parents(".chat-msg"));

		function isNotTarget() {
			if(targetDom.parents(".is-sys-msg").length) return true;
			if(targetDom.hasClass("menu-target")) return false;
			if(targetDom.parents(".menu-target").length) return false;
			return true;
		}
	},

	clickCopy: function(event) {
		event.data.container.trigger("mouseleave");
		var el = document.createElement('textarea');
		el.value = event.dom.parents("div.chat-msg").find(".chat-msg-bubble-right, .chat-msg-bubble-left").text();
		document.body.appendChild(el);
		el.select();
		if(document.execCommand('copy'))
			toastShow($.i18n.getString("FEED_COPY_CONTENT_SUCC"), true);
		else 
			toastShow($.i18n.getString("WEBONLY_COPY_FAIL"), true);

		document.body.removeChild(el);

	},

	clickForward: function(event) {
		event.data.container.trigger("mouseleave");
		this.chatContentDom.addClass("forward")
		.find("> footer").show().end()
		.find("div.chat-msg").removeClass("selected");

		// 選擇該成員
		event.data.container.find("> div.cover").trigger("click");

		$("#footer").css("z-index", "-1");
	},

	clickCancelForwardUI: function() {
		this.chatContentDom.removeClass("forward")
		.find("> footer").hide();

		// 清空訊息
		this.data.set("forwardMsgMap", {});

		$("#footer").css("z-index", "initial");
	},

	clickShowMemberView: function() {
		if(Object.keys(this.data.get("forwardMsgMap") || {}).length === 0) return;
		this.memberViewInit();
	},

	// 關閉並移除所有欄位
	clickMlCancel: function() {
		var self = this;
		var pageView = self.data.get("forwardMemberPageView");
		// 搜尋清除
		pageView.dom.find("> section.search img.clear").trigger("click");

		pageView.pageRemove();

		// 成員列表移除
		this.memComponent.container.remove();

		// 關閉轉傳
		this.clickCancelForwardUI();
	},

	clickMlSubmit: function() {
		var self = this;
		var postData = {
			eil: Object.keys(self.data.get("forwardMsgMap")),
			cl: [], gul: []
		};

		[{nm: "cl", key: "chatComponent"}, {nm: "gul", key: "memComponent"}]
		.forEach(function(item) {
		 	var listArr = Object.keys(self[item.key].getSelectedMembers());
		 	if(listArr.length)
		 		postData[item.nm] = Object.keys(self[item.key].getSelectedMembers());
		 	else 
		 		delete postData[item.nm]
		});

		// 沒有勾選 不送出
		if(!postData.cl && !postData.gul) return;

		self.loadingUI.on();
		self.api.postMsgTransfer({
			gi: gi,
			ci: ci,
			body: postData
		}).done(function(rspData) {
			setTimeout(function() {
				toastShow($.i18n.getString("WEBONLY_FORWARD_SUCCESSED"));
				self.clickMlCancel();
				self.clickCancelForwardUI();
			}, 500);
		}).fail(function(errData) {
			var msg = $.i18n.getString("COMMON_UNKNOWN_ERROR");
			try {
				msg = JSON.parse(errData.responseText).rsp_msg;
			} catch(e) {}

			setTimeout(function() {
				toastShow(msg);
			}, 500);
		}).always(function() {
			self.loadingUI.off();
		})
	},

	clickMlTabSwitch: function(event) {
		
		if(event.dom.hasClass("active")) return;

		var mlContainerDom = this.data.get("forwardMemberPageView").dom;
		var tp = event.dom.attr("tp");
		var footerDom = mlContainerDom.find("> footer");

		// 預設隱藏及消除active
		event.dom.parent().find("> span").removeClass("active");
		mlContainerDom.find("> section.body > section").hide();

		event.dom.addClass("active");
		mlContainerDom.find(`> section.body > section[tp=${tp}]`).show();

		if (tp == 'member') {
			this.memComponent.setSelectionHeight(footerDom.css("height"));
		} else {
			this.chatComponent.setSelectionHeight(footerDom.css("height"));
		}
	},

	inputMlSearch: function(event) {
		var self = this;
		var searchStr = event.dom.val().trim();
		self.data.set("searchStr", searchStr);

		var clearBtn = event.dom.siblings("img.clear");

		if(searchStr.length === 0) {
			clearBtn.hide();
			self.memComponent.clearSearchResult();
			self.chatComponent.clearSearchResult();
		} else {
			clearBtn.show()
			self.memComponent.search(searchStr);
			self.chatComponent.search(searchStr);
		}
	},

	clickMlSearchClear: function(event) {
		event.dom.siblings("input").val("");
		this.data.get("forwardMemberPageView").dom.find("> section.search input")[0].dispatchEvent(new Event('input'))
	},

	clickMlSelectedCancel: function(event) {
		event.dom.remove();
		event.data.component.cancel(event.data.id);
	},

	api: {
		postMsgTransfer: function(args) {
			return new QmiAjax({
				apiName: `groups/${args.gi}/chats/${args.ci}/msg_transfer`,
				method: "post",
				body: JSON.stringify(args.body),
				noErr: true
			});
		}
	},


	memberViewInit: function() {
		var self = this;
		var pageView = new QmiGlobal.UI.pageView({
			id: "pageview-forward-member",
			contentDom: $(self.html.getMemberList().trim())
		});

		self.data.set("forwardMemberPageView", pageView);

		pageView.pageShow();

		var mlContainerDom = pageView.dom;

		mlContainerDom.find("> section.search input").attr("placeholder", $.i18n.getString("INVITE_SEARCH"));

		self.loadingUI = new QmiGlobal.module.LoadingUIConstructor({
    		dom: mlContainerDom,
    		imgSrc: "images/loading.gif",
    		imgCss: {top: "50%"},
    		delay: 1000
    	});

    	self.data.set("memChatConsistMap", {});

		// 成員
		self.initMemComponent();
		
		// 聊天室
		self.initChatComponent();

		QmiGlobal.eventDispatcher.subscriber([{
			veId: "mlCancel", 
			elemArr: mlContainerDom.find("> header > button.cancel"), 
			eventArr: ["click"]
		}, {
			veId: "mlSubmit", 
			elemArr: mlContainerDom.find("> header > button.submit"), 
			eventArr: ["click"]
		}, {
			veId: "mlTabSwitch", 
			elemArr: mlContainerDom.find("> section.tab > span"), 
			eventArr: ["click"]
		}, {
			veId: "mlSearch", 
			elemArr: mlContainerDom.find("> section.search input"), 
			eventArr: ["input"]
		}, {
			veId: "mlSearchClear", 
			elemArr: mlContainerDom.find("> section.search img.clear"), 
			eventArr: ["click"]
		}], self);

		mlContainerDom.find("> section.tab > span:first-child").trigger("click");
	},

	initMemComponent: function() {
		var self = this;
		var forwardMemberDom = self.data.get("forwardMemberPageView").dom;
		var memChatConsistMap = self.data.get("memChatConsistMap");
		self.memComponent = new ObjectDelegate({
			view: forwardMemberDom[0],
			container: forwardMemberDom[0].querySelector("section.body > section[tp=member]"),
			settings: {isHiddenSelf: true},
			objectList: Object.keys(QmiGlobal.groups[gi].guAll || {}).reduce(function(arr, currGu) {
				var currObj = QmiGlobal.groups[gi].guAll[currGu];
				// 成員非啟用中或自己 不顯示
				if(currObj.st !== 1 || currGu === gu) return arr;

				return arr.concat([{
					id: currGu,
					name: currObj.nk,
					image: currObj.aut,
				}]);
			}, [])
		});

		self.memComponent.init();

		self.memComponent.setPreviewArea(function(selectedArr) {
			self.makeForwardUIConsist({arr: selectedArr, tp: 0});
			self.data.set("memSelectedArr", selectedArr);

			// 增加mem、chat判斷
			var chatArr = self.data.get("chatSelectedArr") || [];
			var memArr = selectedArr.map(function(item) {
				item.isMem = true;
				return item;
			});

			// 按鈕顏色
			var btnDom = self.data.get("forwardMemberPageView").dom.find("> header > button.submit");
			if(selectedArr.length > 0) 
				btnDom.removeClass("is-gray");
			else
				btnDom.addClass("is-gray");


			var allSelectedArr = memArr.concat(chatArr);

			self.makeSelectedMemberUI(allSelectedArr);
			self.memComponent.setSelectionHeight(self.data.get("footerHeight") +"px");

			if(allSelectedArr.length > self.limit.des) {
				self.memComponent.cancel(selectedArr[selectedArr.length-1].id);
				toastShow($.i18n.getString("CHATROOM_FORWARD_MAXIMUM_DESTINATION", self.limit.des));
			}
		});
	},

	initChatComponent: function() {
		var self = this;
		var forwardMemberDom = self.data.get("forwardMemberPageView").dom;
		var currGroupData = QmiGlobal.groups[gi];
		var memChatConsistMap = self.data.get("memChatConsistMap");
		self.chatComponent = new ObjectDelegate({
			view: forwardMemberDom[0],
			container: forwardMemberDom[0].querySelector("section.body > section[tp=chatroom]"),
			objectList: Object.keys(currGroupData.chatAll || {}).reduce(function(arr, currCi) {
				var roomData = currGroupData.chatAll[currCi];
				// 聊天室名稱若是2 則不顯示人數
				var isNoNum = false;

				if(roomData.tp === 1) {
					// 單一聊天室需要連動轉傳成員
					memChatConsistMap[roomData.other] = currCi;
					memChatConsistMap[currCi] = roomData.other;

					isNoNum = true;
				} else if(!roomData.cpc || roomData.cpc === 2) {
					isNoNum = true;
				}


				// 停用聊天室不顯示
				if(roomData.tp === 0) return arr;
				return arr.concat([{
					id: currCi,
					name: `${roomData.nk} ${isNoNum ? `` : `(${roomData.cpc})`}`,
					image: function() {
						var defaultImgStr = "images/common/others/empty_img_mother_l.png";
						try {
							if(roomData.tp === 1)
								return currGroupData.guAll[roomData.other].aut || defaultImgStr;
							else 
								return roomData.cat || defaultImgStr;
						} catch(e) {return defaultImgStr;}
					}()
				}]);
			}, [])
		});

		self.data.set("memChatConsistMap", memChatConsistMap);

		self.chatComponent.init();

		self.chatComponent.setPreviewArea(function(selectedArr) {
			self.makeForwardUIConsist({arr: selectedArr, tp: 1});

			self.data.set("chatSelectedArr", selectedArr);

			// 增加mem、chat判斷
			var memArr = (self.data.get("memSelectedArr") || []).map(function(item) {
				item.isMem = true;
				return item;
			});

			// 按鈕顏色
			var btnDom = self.data.get("forwardMemberPageView").dom.find("> header > button.submit");
			if(selectedArr.length > 0) 
				btnDom.removeClass("is-gray");
			else
				btnDom.addClass("is-gray");

			var allSelectedArr = memArr.concat(selectedArr);

			self.makeSelectedMemberUI(allSelectedArr);
			self.chatComponent.setSelectionHeight(self.data.get("footerHeight") +"px");

			if(allSelectedArr.length > self.limit.des) {
				self.chatComponent.cancel(selectedArr[selectedArr.length-1].id);
				toastShow($.i18n.getString("CHATROOM_FORWARD_MAXIMUM_DESTINATION", self.limit.des));
			}
		});
	},

	// 轉傳單一聊天室與成員連動
	makeForwardUIConsist: function(args) {
		var self = this;
		var strArr = ["mem", "chat"];
		var lastArr = self.data.get(`${strArr[args.tp]}SelectedArr`) || [];
		var newId = null;
		// lastArr長度小於現在 就是新增
		if(lastArr.length < args.arr.length) {
			// 新增就要去搜尋聊天室列表有無單一聊天室 要連動
			newId = (args.arr[args.arr.length-1] || {}).id;
			var mapId = self.data.get("memChatConsistMap")[newId];
			if(mapId) self[`${strArr[+!args.tp]}Component`].visibleRows[mapId].check(true);

		// 反之就是取消
		} else {

		}
	},

	makeSelectedMemberUI: function(selectedArr) {
		var self = this;
		var veArr = [];
		var footerHeight = 203;
		var footerDom = self.data.get("forwardMemberPageView").dom.find("> footer");
		footerDom.find("> div.ttl > span:first-child").html(selectedArr.length);

		if(selectedArr.length === 0) {
			footerHeight = 0;
		} else if(selectedArr.length <= 5) {
			footerHeight = 120;
		}

		footerDom.css("height", footerHeight +"px");

		// 儲存
		self.data.set("footerHeight", footerHeight);
		self.data.set("currSelectedLength", selectedArr.length);

		footerDom.find("section.body").empty().html(selectedArr.map(function(item) {
			var dom = $("<span>", {
				class: "item",
				html: `<img src="${item.avatar || "images/common/others/empty_img_personal_xl.png"}"><div>${item.name}</div>`
			});

			veArr.push({
				veId: "mlSelectedCancel", 
				elemArr: dom, 
				eventArr: ["click"],
				data: {id: item.id, component: item.isMem ? self.memComponent : self.chatComponent}
			})
			return dom;
		}));

		QmiGlobal.eventDispatcher.subscriber(veArr, self);
	},


	html: {
		getMemberList: function() {
			return `<header><button class="cancel">${$.i18n.getString("COMMON_CANCEL")}</button>
					<span class="ttl">${$.i18n.getString("WEBONLY_CHAT_FORWARD")}</span>
					<button class="submit is-gray">${$.i18n.getString("CHAT_SEND")}</button></header>
				<section class="search">
					<div><img src="images/fileSharing/search_icon.png">
					<input><img class="clear" src="images/common/temp/icon_search_clean.png"></div></section>
				<section class="tab">
					<span tp="chatroom">${$.i18n.getString("CHATROOM_CHAT")}</span>
					<span tp="member">${$.i18n.getString("COMMON_MEMBER")}</span></section>
				<section class="body"><section tp="chatroom"></section>
					<section tp="member"></section></section>
				<footer><div class="ttl"><span></span><span>${$.i18n.getString("CHATROOM_SELECTED")}</span></div>
					<section class="body"></section></footer>
				<div class="loading"><img src="images/loading.gif></div>`;
		}
	}
});

QmiGlobal.module.chatEditView = new QmiGlobal.ModuleConstructor({

	id: "chatEditView",

	init: function(args) {
		var self = this;
		if(self.pageView) {
			self.pageView.pageShow();
			return;
		}

		var veArr = [];
		self.data = self.initData();
		self.data.set("args", args);

		self.pageView = new QmiGlobal.UI.pageView({
			id: "pageview-chat-edit",
			contentDom: $(self.html.getMainDom())
		});

		self.pageView.pageShow();

		self.containerDom = self.pageView.dom;
		
		self.reset();

		// 修改聊天室頭像、名稱loadingUI
		var editBtnDom = self.containerDom.find("> header > button:last-child");
		self.data.set("editLoadingUI", new QmiGlobal.module.LoadingUIConstructor({
    		dom: editBtnDom,
			bgCss: {top: "-3px", background: "white"},
			imgCss: {top:"18px", width: "20px"},
    		delay: 500
    	}));

		self.containerDom.find("> div.ce-row.switch > span.slider").each(function(i, elm) {
			var dom = $(elm);
			var tp = dom.parent().attr("tp");
			QmiGlobal.UI.slider.init({containerDom: dom, isChecked: g_room[tp], isDisabled: true});

			veArr.push({
				veId: "slider", 
				elemArr: dom, 
				eventArr: ["click"],
				data: {tp: tp, loadingUI: new QmiGlobal.module.LoadingUIConstructor({
		    		dom: dom,
					bgCss: {background: "white"},
					imgCss: {top: "3px", width: "15px"},
					delay: 1000
		    	})}
			});
		});

		self.makeMemberList();

		QmiGlobal.eventDispatcher.subscriber(veArr.concat([{
			veId: "closeView", 
			elemArr: self.containerDom.find("> header > button.back"), 
			eventArr: ["click"]
		}, {
			veId: "edit", 
			elemArr: editBtnDom,
			eventArr: ["click"]
		}, {
			veId: "avatarIcon", 
			elemArr: self.containerDom.find("> div.group-info > span.avatar"), 
			eventArr: ["click"]
		}, {
			veId: "chatroomAvatar", 
			elemArr: self.containerDom.find("input#chatroom-avatar"), 
			eventArr: ["change"]
		}, {
			veId: "showAssignAdmPage", 
			elemArr: self.containerDom.find("> div[tp=assign]"), 
			eventArr: ["click"]
		}, {
			veId: "showInviteMemberPage", 
			elemArr: self.containerDom.find("> div[tp=invite]"), 
			eventArr: ["click"]
		}, {
			veId: "showLeaveChatroomDialog", 
			elemArr: self.containerDom.find("> div.leave"), 
			eventArr: ["click"]
		}]), self);
	},

	makeMemberList: function() {
		var self = this;
		var veArr = [];
		var allGuMap = QmiGlobal.groups[gi].guAll || {};
		self.containerDom.find("section.member-list").empty().append(Object.keys(g_room.memList).map(function(currGu) {
			var memData = allGuMap[currGu];
			var memDom = self.html.getMemberRowDom({
				isMe: currGu === gu ? "is-me" : "",
				isAdm: !!g_room.memList[currGu].ad,
				nk: memData.nk,
				aut: memData.aut
			});

			veArr.push({
				veId: "showRemoveMemberDialog", 
    			elemArr: memDom.find("button.remove-member"), 
    			eventArr: ["click"],
    			data: memData
			});
			return memDom;
		}));

		QmiGlobal.eventDispatcher.subscriber(veArr, self)
	},

	reset: function() {
		var self = this;

		// adm
		if(g_room.memList[gu].ad === 0)
			$("#pageview-chat-edit").addClass("is-not-adm");

		// 是否可邀請成員
		var inviteRowDom = self.containerDom.find("div.ce-row[tp=invite]").show();
		if(g_room.is !== true && g_room.memList[gu].ad === 0)
			inviteRowDom.hide();

		// 團體頭像
		self.containerDom.find("> div.group-info > span.avatar > img").attr("src", g_room.cat || "images/contact/contact_group_default_box_apt.png");

		// 團體名稱
		self.containerDom.find("> div.group-info > span.name > span").text(g_room.cn);
		self.containerDom.find("> div.group-info > span.name > input").val(g_room.cn);

		// 成員數量
		self.containerDom.find("> div.member-ttl").attr("cnt", g_room.cpc);

		self.containerDom.removeClass("is-editing");
		self.data.set("isEditing", false);
		self.data.set("isAvatarChanged", false);
	},

	clickShowRemoveMemberDialog: function(event) {
		var self = this;
		var memData = event.data;

		// 不刪除自己
		if(memData.gu === gu) return;

		var removeMemberDialog = QmiGlobal.PopupDialog.create({
	        className: "qmi-ui-dialog",
	        content: [{
                tagName: "section",
                attributes: {class: "body"},
                text: $.i18n.getString("CHATROOM_REMOVE_CONFIRM", memData.nk)}],
			footer: [{
                tagName: "button",
                text: $.i18n.getString("COMMON_OK"),
                attributes: {class: "submit"}
            }, {
            	tagName: "button",
                text: $.i18n.getString("COMMON_CANCEL"),
                attributes: {class: "cancel"}}]
		});

		removeMemberDialog.open();

		var dialogDom = removeMemberDialog.container;

		self.data.set("dialogRemoveMemberLoadingUI", new QmiGlobal.module.LoadingUIConstructor({
    		dom: dialogDom.find("div.qmi-ui-dialog"),
    		bgCss: {background: "white", "border-radius": "10px"},
    		imgCss: {top: "30px"},
    		delay: 500
    	}));

		QmiGlobal.eventDispatcher.subscriber([{
			veId: "submitRemoveMember", 
			elemArr: dialogDom.find("div.footer > button.submit"), 
			eventArr: ["click"],
			data: {memData: memData, currDom: event.dom.parent()}
		}, {
			veId: "closeRemoveMember", 
			elemArr: dialogDom.find("div.footer > button.cancel"), 
			eventArr: ["click"]
		}], self);

		self.data.set("removeMemberDialog", removeMemberDialog);
	},

	clickSubmitRemoveMember: function(event) {
		var self = this;
		var submitData = event.data;
		var removeMemberDialog = self.data.get("removeMemberDialog");

		self.data.get("dialogRemoveMemberLoadingUI").on();

		setTimeout(function() {
			self.api.putRemoveMember(submitData.memData).done(function(rspData) {
				submitData.currDom.fadeOut("fast", function() {
					$(this).remove();
				});

				updateChat().done(function() {
					self.reset();
					window.chatAuthData.mathodMap.initChatList();	
				});
				
				toastShow($.i18n.getString("CHATROOM_SOMEONE_LEFT_CHATROOM_TOAST", submitData.memData.nk), true);
			}).fail(function(errData) {
				var errStr = $.i18n.getString("WEBONLY_FAILED");
				try {
					errStr = JSON.parse(errData.responseText).rsp_msg;
				} catch(e) {}
				toastShow(errStr, true);

			}).always(function() {
				removeMemberDialog.close();
			});
		}, 500);

	},

	clickCloseRemoveMember: function() {
		this.data.get("removeMemberDialog").close();
	},

	clickShowLeaveChatroomDialog: function() {
		var self = this;
		var leaveChatroomDialog = QmiGlobal.PopupDialog.create({
	        className: "qmi-ui-dialog",
	        content: [{
                tagName: "section",
                attributes: {class: "body"},
                text: $.i18n.getString("CHAT_LEAVE_CONFIRM")}],
			footer: [{
                tagName: "button",
                text: $.i18n.getString("COMMON_OK"),
                attributes: {class: "submit"}
            }, {
            	tagName: "button",
                text: $.i18n.getString("COMMON_CANCEL"),
                attributes: {class: "cancel"}}]
		});

		leaveChatroomDialog.open();

		var dialogDom = leaveChatroomDialog.container;

		self.data.set("dialogLeaveChatroomLoadingUI", new QmiGlobal.module.LoadingUIConstructor({
    		dom: dialogDom.find("div.qmi-ui-dialog"),
    		bgCss: {background: "white"},
    		imgCss: {top: "30px"},
    		delay: 500
    	}));

		QmiGlobal.eventDispatcher.subscriber([{
			veId: "submitLeaveChatroom", 
			elemArr: dialogDom.find("div.footer > button.submit"), 
			eventArr: ["click"]
		}, {
			veId: "closeLeaveChatroom", 
			elemArr: dialogDom.find("div.footer > button.cancel"), 
			eventArr: ["click"]
		}], self);

		self.data.set("leaveChatroomDialog", leaveChatroomDialog);
	},

	clickSubmitLeaveChatroom: function() {
		var self = this;
		var loadingUI = self.data.get("dialogLeaveChatroomLoadingUI");
		loadingUI.on();
		setTimeout(function() {
			self.api.deleteLeaveChatroom().done(function(rspData) {
				popupShowAdjust("", $.i18n.getString("USER_PROFILE_LEAVE"), true, false, [function() {
					try {
						window.chatAuthData.mathodMap.initChatList();
					} catch(e) {}
					window.close();
				}]);
			}).fail(function(errData) {
				var errStr = $.i18n.getString("WEBONLY_FAILED");
				try {
					errStr = JSON.parse(errData.responseText).rsp_msg;
				} catch(e) {}
				toastShow(errStr, true);

				loadingUI.off();
			});
		}, 500);
	},

	clickCloseLeaveChatroom: function() {
		this.data.get("leaveChatroomDialog").close();
	},

	clickAvatarIcon: function(event) {
		var self = this;
		if(!self.data.get("isEditing")) return;

		this.containerDom.find("input#chatroom-avatar").trigger("click");
	},

	changeChatroomAvatar: function(event) {
		var self = this;
		if(!self.data.get("isEditing")) return;

		var inputDom = event.dom;
		var avatarDom = self.containerDom.find("> div.group-info > span.avatar > img");
		if (!inputDom.length || !inputDom[0].files || !inputDom[0].files[0]) return;

		var imageType = /image.*/;
		if (inputDom[0].files[0].type.match(imageType)) {
		    var reader = new FileReader();

		    reader.onload = function (e) {
		        avatarDom.attr("src", e.target.result);
		        self.data.set("isAvatarChanged", true);
		    }
		    reader.readAsDataURL(inputDom[0].files[0]);
		} else {
			toastShow($.i18n.getString("COMMON_NOT_IMAGE"), true);
			inputDom.replaceWith(inputDom.val('').clone(true));
		}
	},

	clickShowAssignAdmPage: function(event) {
		var self = this;
		var assignPageView = new QmiGlobal.UI.pageView({
			id: "module-chatroom-assignAdm",
			contentDom: $(self.html.getAssignDom())
		});

		assignPageView.pageShow();

		// 修改聊天室管理員loadingUI
    	self.data.set("assignAdmLoadingUI", new QmiGlobal.module.LoadingUIConstructor({
    		dom: assignPageView.dom,
			bgCss: {background: "rgba(190, 190, 190, 0.6)", "z-index": 1},
			imgCss: {top:"30vh", width: "30px"},
			imgSrc: "images/loading.gif",
    		delay: 500
    	}));

		QmiGlobal.eventDispatcher.subscriber([{
			veId: "closeAssignView", 
			elemArr: assignPageView.dom.find("> header > button.back"), 
			eventArr: ["click"]
		}, {
			veId: "submitAssignView", 
			elemArr: assignPageView.dom.find("> header > button.submit"), 
			eventArr: ["click"]
		}], self);

		var memArr = [];
		var memMap = Object.keys(g_room.memList || {}).reduce(function(obj, currGu) {
			var currData = g_group.guAll[currGu];
			if(!currData) return obj;

			memArr.push({
				id: currGu,
                name: currData.nk,
                image: currData.aut,
            });

			if(g_room.memList[currGu].ad !== 1) return obj;
			
			obj[currGu] = currData;
			return obj;
		}, {});

		var assignODComponent = new ObjectDelegate({
			container: assignPageView.dom.find("> section.body")[0],
			objectList: memArr,
			previousSelect: {objects: memMap}
		});

		assignODComponent.init();

		self.data.set("assignPageView", assignPageView);
		self.data.set("assignODComponent", assignODComponent);
	},

	clickCloseAssignView: function() {
		this.data.get("assignPageView").pageRemove();
	},

	clickSubmitAssignView: function() {
		var self = this;
		var selectedMap = self.data.get("assignODComponent").getSelectedMembers();
		var ajaxData = Object.keys(g_room.memList).reduce(function(data, currGu) {
			var memMap = g_room.memList[currGu];
			// 此人為admin 但此人沒被選中 表示取消
			if(memMap.ad === 1 && !selectedMap[currGu])
				data.dl.push(currGu);
			// 此人非admin 但此人被選中 表示選取
			else if(memMap.ad !== 1 && selectedMap[currGu])
				data.el.push(currGu);

			return data;
		}, {el: [], dl: []});

		// 沒有動作 返回
		if(ajaxData.dl.length === 0 && ajaxData.el.length === 0) return;

		var loadingUI = self.data.get("assignAdmLoadingUI");
		loadingUI.on();
		setTimeout(function() {
			self.api.putAdministrators(ajaxData).done(function(rspData) {
				
				updateChat().done(function() {
					// 移除assignPageView
					self.data.get("assignPageView").pageRemove();
					// 重新做聊天室成員列表
					self.makeMemberList();

					self.reset();

					toastShow($.i18n.getString("CHATROOM_ASSIGN_ADMIN") +" "+ $.i18n.getString("COMMON_DONE"));	
				});
				
			}).fail(function(errData) {
				var errStr = $.i18n.getString("WEBONLY_FAILED");
				try {
					errStr = JSON.parse(errData.responseText).rsp_msg;
				} catch(e) {}
				toastShow(errStr, true);

				loadingUI.off();
			});
		}, 500);
	},

	clickShowInviteMemberPage: function(event) {
		var self = this;
		var veArr = [];
		var invitePageView = new QmiGlobal.UI.pageView({
			id: "module-chatroom-invite",
			contentDom: $(self.html.getInviteDom())
		});

		invitePageView.pageShow();

		// 修改聊天室管理員loadingUI
    	self.data.set("inviteLoadingUI", new QmiGlobal.module.LoadingUIConstructor({
    		dom: invitePageView.dom,
			bgCss: {background: "rgba(190, 190, 190, 0.6)", "z-index": 1},
			imgCss: {top:"30vh", width: "30px"},
			imgSrc: "images/loading.gif",
    		delay: 500
    	}));

		QmiGlobal.eventDispatcher.subscriber([{
			veId: "closeInviteView", 
			elemArr: invitePageView.dom.find("> header > button.back"), 
			eventArr: ["click"]
		}, {
			veId: "submitInviteView", 
			elemArr: invitePageView.dom.find("> header > button.submit"), 
			eventArr: ["click"]
		}], self);

		var memArr = Object.keys(g_group.guAll || {}).reduce(function(arr, currGu) {
			var currData = g_group.guAll[currGu] || {};
			if(currData.st !== 1) return arr;
			// 剔除已存在成員
			if(g_room.memList[currGu]) return arr;

			arr.push({
				id: currGu,
                name: currData.nk,
                image: currData.aut,
            });

			return arr;
		}, []);

		var inviteODComponent = new ObjectDelegate({
			container: invitePageView.dom.find("> section.body")[0],
			objectList: memArr
		});

		inviteODComponent.init();

		self.data.set("invitePageView", invitePageView);
		self.data.set("inviteODComponent", inviteODComponent);
	},

	clickCloseInviteView: function() {
		this.data.get("invitePageView").pageRemove();
	},

	clickSubmitInviteView: function() {
		var self = this;
		var selectedMap = self.data.get("inviteODComponent").getSelectedMembers();

		// 沒有動作 返回
		if(Object.keys(selectedMap).length === 0) return;

		var loadingUI = self.data.get("inviteLoadingUI");
		loadingUI.on();
		setTimeout(function() {
			self.api.postInviteUsers(Object.keys(selectedMap).reduce(function(data, currGu) {
				data.ul.push({gu: currGu});
				return data;
			}, {ul: []})).done(function(rspData) {
				
				updateChat().done(function() {
					// 移除invitePageView
					self.data.get("invitePageView").pageRemove();
					// 重新做聊天室成員列表
					self.makeMemberList();

					self.reset();

					toastShow($.i18n.getString("CHATROOM_INVITE_MEMBER") +" "+ $.i18n.getString("COMMON_DONE"));	
				});
				
			}).fail(function(errData) {
				var errStr = $.i18n.getString("WEBONLY_FAILED");
				try {
					errStr = JSON.parse(errData.responseText).rsp_msg;
				} catch(e) {}
				toastShow(errStr, true);

				loadingUI.off();
			});
		}, 500);
	},

	clickEdit: function(event) {
		var self = this;
		if(self.containerDom.hasClass("is-editing")) {
			self.submitAvatarAndName().done(function() {
				self.containerDom.removeClass("is-editing")
				self.data.set("isEditing", false);
			});
		} else {
			self.containerDom.addClass("is-editing")
			self.data.set("isEditing", true);
		}
	},

	submitAvatarAndName: function() {
		var deferred = $.Deferred();
		var self = this;
		var newCn = self.containerDom.find("> div.group-info > span.name > input").val().trim();
		var msgStr = "";

		var defArr = [];
		if(newCn !== g_room.cn) 
			defArr.push(defAction({i18nStr: "FILESHARING_RENAME", def: self.editChatroomName(newCn)}))

		if(self.data.get("isAvatarChanged")) {
			try {
				var fileObj = self.containerDom.find("#chatroom-avatar")[0].files[0];
				var oriArr = [1280, 1280, 0.7];
				var tmbArr = [160, 160, 0.4];
				defArr.push(defAction({i18nStr: "FILESHARING_UPLOAD_FILE", def: self.data.get("args").uploadChatAvatar(g_room.gi, fileObj, g_room.ci, 0, oriArr, tmbArr, pi).done(function(rspData) {
					g_room.cat = rspData.tu;
					g_room.cao = rspData.ou;
				})}));

			} catch(e) {
				defArr.push(defAction({i18nStr: "FILESHARING_UPLOAD_FILE", def: $.Deferred().reject()}))
				console.log("chatroom upload avatar failed", e);
			}
		}

		if(defArr.length === 0) {
			deferred.resolve();
			return deferred.promise();
		}

		var loadingUI = self.data.get("editLoadingUI");
		loadingUI.on();

		setTimeout(function() {
			$.when.apply($, defArr).done(function() {
				loadingUI.off();
				self.reset();
				
				var resultArr = arguments;
				var biStr = "";
				var resultMsgArr = [];
				Array.prototype.forEach.call(arguments, function(item) {
					var resultStr = $.i18n.getString(item.i18nStr);
					if(item.isSuccess) {
						resultStr += " "+ $.i18n.getString("WEBONLY_SUCCESSED"); 
					} else {
						resultStr += " "+ $.i18n.getString("WEBONLY_FAILED"); 
					}

					resultMsgArr.push(resultStr);
				});

				toastShow(resultMsgArr.join(" ; "), true)
				deferred.resolve();
			});

		}, 1000);

		return deferred.promise();
		
		function defAction(args) {
			var deferred = $.Deferred();
			args.def.done(function(rspData) {
				deferred.resolve({isSuccess: true, i18nStr: args.i18nStr, rspData: rspData});
			}).fail(function(errData) {
				deferred.resolve({isSuccess: false, i18nStr: args.i18nStr, rspData: errData})
			});
			return deferred.promise();
		}
	},

	editChatroomName: function(newCn) {
		var deferred = $.Deferred();
		var self = this;
		return self.api.putChatroomName(newCn).done(function(rspData) {
			g_room.cn = newCn;
			// 改聊天室主畫面標題
			$("#header > div.title > span.text").text(newCn)
		});
	},
	
	clickCloseView: function() {
		this.reset();
		this.pageView.pageRemove();
	},

	clickSlider: function(event) {
		var self = this;
		var tp = event.data.tp;
		var loadingUI = event.data.loadingUI;

		loadingUI.on();

		var newVal = !g_room[tp];
		if(tp === "it") newVal = +newVal

		self.api.putChatroomAttrMap({
			tp: tp, val: newVal
		}).done(function() {
			g_room[tp] =  newVal;

			switch(tp) {
				case "cs":
					break;
				case "it":
					try {
						window.chatAuthData.mathodMap.initChatList();
					} catch(e) {}
					break;
				case "is":
					break;
			}

			event.dom.find("input").prop("checked", !!newVal);
			toastShow($.i18n.getString("USER_PROFILE_UPDATE_SUCC"), true);
		}).fail(function(errData) {
			var errStr = $.i18n.getString("WEBONLY_FAILED");
			try {
				errStr = JSON.parse(errData.responseText).rsp_msg;
			} catch(e) {}
			toastShow(errStr, true);
		}).always(function() {
			loadingUI.off();
		});
		
	},

	html: {
		getMainDom: function() {
			return $(`<header>
					<button class="back"><div></div></button>
					<span>${$.i18n.getString("OFFICIAL_SETTING")}</span>
					<button class="edit"><img class="edit" src="images/chatroom/setting-done.png">
						<img src="images/post_audience/Done.png"></button>
				</header>
				<div class="group-info">
					<span class="avatar"><img></span>
					<span class="name"><span class="ellipsis"></span><input></span>
					<input id="chatroom-avatar" type="file" style="display: none;"></div>
				<div class="ce-row switch" tp="cs"><span>${$.i18n.getString("SYSTEM_SET")}</span><span class="slider"></span></div>
				<div class="ce-row switch" tp="is"><span>${$.i18n.getString("CHATROOM_ANYONE_CAN_INVITE")}</span><span class="slider"></span></div>
				<div class="ce-row switch" tp="it"><span>${$.i18n.getString("CHATROOM_TOP")}</span><span class="slider"></span></div>
				<div tp="assign" class="ce-row arrow"><span>${$.i18n.getString("CHATROOM_ASSIGN_ADMIN")}</span></div>
				
				<div class="member-ttl" cnt="0">${$.i18n.getString("COMMON_MEMBER")}</div>
				<div tp="invite" class="ce-row arrow"><img src="images/chatroom/setting-user-plus.png"><span>${$.i18n.getString("CHATROOM_INVITE_MEMBER")}</span></div>
				<section class="member-list"></section>

				<div class="leave">${$.i18n.getString("CHATROOM_LEAVE_CHATROOM")}</div>`);
		},

		getAssignDom: function() {
			return $(`<header><button class="back"><div></div></button>
				<span>${$.i18n.getString("CHATROOM_ASSIGN_ADMIN")}</span>
				<button class="submit">${$.i18n.getString("COMMON_SUBMIT")}</button></header>
			<section class="body"></section>`);
		},

		getInviteDom: function() {
			return $(`<header><button class="back"><div></div></button>
				<span>${$.i18n.getString("CHATROOM_INVITE_MEMBER")}</span>
				<button class="submit">${$.i18n.getString("COMMON_SUBMIT")}</button></header>
			<section class="body"></section>`);
		},

		getMemberRowDom: function(args) {
			var admStr = args.isAdm ? `is-adm="${$.i18n.getString("WEBONLY_CHATROOM_ADMIN")}"` : ``;
			return $(`<div class="ce-row member ${args.isMe}" ${admStr}>
				<button class="remove-member"></button>
				<span class="avatar"><img src="${args.aut}"></span>
				<span class="ellipsis">${args.nk}</span></div>`);
		}
	},

	api: {

		postInviteUsers: function(args) {
			return this.sender({
		        apiName: `groups/${gi}/chats/${g_room.ci}/users`,
		        method: "post",
		        body: args
		    });
		},

		putAdministrators: function(args) {
			return this.sender({
		        apiName: `groups/${gi}/chats/${g_room.ci}/administrators`,
		        method: "put",
		        body: args
		    });
		},

		putChatroomAttrMap: function(args) {
			var map = {cs: "notification", it: "top", is: "invite"};
			var ajaxAttr = "headers";
			if(args.tp === "cs") ajaxAttr = "body";

			return this.sender({
				apiName: `groups/${gi}/chats/${g_room.ci}/${map[args.tp]}`,
				[ajaxAttr]: {[args.tp]: args.val},
				method: "put"
			});
		},

		putChatroomName: function(cn) {
			return this.sender({
		        apiName: "groups/" +gi + "/chats/" + ci,
		        method: "put",
		        body: {cn: cn},
		    })
		},

		deleteLeaveChatroom: function() {
			return this.sender({
		        apiName: `groups/${gi}/chats/${g_room.ci}/users`,
		        method: "delete",
		        body: {gu: gu}
		    });
		},

		putRemoveMember: function(args) {
			return this.sender({
		        apiName: `groups/${gi}/chats/${g_room.ci}/users`,
		        method: "put",
		        body: {del: {gul: [args.gu]}}
		    });
		},

		sender: function(args) {
			if(!args.hasOwnProperty("noErr"))
				args.noErr = true;
			return new QmiAjax(args);
		}
	}
});


QmiGlobal.module.LoadingUIConstructor = function(args) {
	var isActivate = false;
	this.containerDom = args.dom;
	this.init(args);

	this.on = function() {
		isActivate = true;
		this.loadingDom.show();
		if(args.on) args.on();
	};

	this.off = function() {
		var self = this;
		isActivate = false;

		setTimeout(function() {
			self.loadingDom.hide();
			if(args.off) args.off();
		}, args.delay || 0);
			
	};

	this.stat = function() {return isActivate;}
};

QmiGlobal.module.LoadingUIConstructor.prototype = {
	defaultBgCss: {
		display: "none", 
		position: "absolute",
		width: "100%", 
		height: "100%",
		top: 0, left: 0,
		"text-align": "center",
		background: "rgba(180,180,180,0.7)"
	},

	defaultImgCss: {width: "30px", position: "relative"},

	init: function(args) {
		var self = this;
		if(self.loadingDom) self.loadingDom.remove();

		self.loadingDom = $("<div>", {
			css: self.getStyle(self.defaultBgCss, (args.bgCss || {})),
			html: $("<img>", {
				src: args.imgSrc || "images/loading2.gif",
				css: self.getStyle(self.defaultImgCss, (args.imgCss || {}))
			})
		});

		self.containerDom.append(self.loadingDom);
	},

	getStyle: function(defaultCss, customCss) {
		var self = this;
		var tempObj = Object.keys(defaultCss).reduce(function(cssObj, currKey) {
			cssObj[currKey] = customCss.hasOwnProperty(currKey) ? customCss[currKey] : defaultCss[currKey];
			return cssObj;
		}, {});

		return Object.keys(customCss).reduce(function(cssObj, currKey) {
			if(!defaultCss.hasOwnProperty(currKey)) tempObj[currKey] = customCss[currKey];
			return tempObj;
		}, tempObj);
	}
}


QmiGlobal.UI = {

	slider: new QmiGlobal.ModuleConstructor({

		id: "ui-slider",

		init: function(args) {
			var sliderDom = this.getHtml(args);
			args.containerDom.empty().html(sliderDom);
		},

		getHtml: function(args) {
			return `<label class="qmi-ui-slider">
				<input type="checkbox" ${args.isChecked ? "checked" : ""} ${args.isDisabled ? "disabled" : ""}><span></span></label>`
		}
	}),

	pageView: function(args) {
		var self = this;
		if(!args.id) {
			console.error("Attribute ID is required");
			return;
		}

		$(`#${args.id}`).remove();

		self.data = self.initData();
		self.parentDom = args.parent || $("body");
		self.dom = self.createDom(args);

		self.parentDom.append(self.dom);

	}
}

QmiGlobal.UI.pageView.prototype = new QmiGlobal.ModuleConstructor({
	id: "page-view",

	createDom: function(args) {
		var self = this;
		return $("<section>", {
			id: args.id,
			class: "qmi-ui-page-view",
			html: args.contentDom
		});
	},

	pageShow: function() {
		var self = this;
		self.dom.show();
		setTimeout(function() {self.dom.css({right: 0})}, 10);
	},

	pageClose: function() {
		var deferred = $.Deferred();
		var self = this;
		self.dom.attr("style", "display: block")
		setTimeout(function() {
			self.dom.hide();
			deferred.resolve();
		}, 100);

		return deferred.promise();
	},

	pageRemove: function() {
		var self = this;
		self.pageClose().done(function() {
			self.dom.remove();
		});
	}
});
