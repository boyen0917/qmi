$.fn.StickerStore = function () {
	console.log("QQQ");
	if ($("#StickerStoreModal").length == 0) {
		var stickerStoreView =  new StickerStoreView();
		stickerStoreView.getLastestPackages();
		stickerStoreView.getSequence();
	}
}

function StickerStoreView() {
	this.currentTab = "sticker-shop";
	this.container = $(this.htmlText);
	this.defaultOrder = [];
	this.orderByUser = [];
	this.isUpdateOrder = false;
	this.isEditMode = false;
	this.latestTime;
	
	// 切換貼圖示集、未下載和已下載tab
	this.container.find("ul li").on("click", function (e) {
		var prevTab = this.container.find("li.active").data("href");
		this.currentTab = $(e.target).data("href");

		if (prevTab != this.currentTab ) {
			this.container.find("li.active").removeClass("active");
			this.container.find(".sticker-shop").show();
			this.container.find(".sticker-package-detail").hide();

			$(e.target).addClass("active");

			switch (this.currentTab) {
				case "all-stickers" : 
					this.showAllStickers();
					break;
				case "non-download-stickers" :
					this.showNoneDownloadStickers();
					break;
				case "already-download-stickers" :
					this.showDoneDownloadStickers();
					break;
			}
		}
	}.bind(this));

	// this.container.find(".page-home").bind("scroll", this.loadMore.bind(this));

	// 關閉貼圖中心事件
	this.container.find(".close").off("click").on("click", function (e) {
		this.close();
	}.bind(this));

	// 從貼圖詳細頁面回到列表頁面
	this.container.find(".return").off("click").on("click", function (e) {
		this.returnHomePage();
	}.bind(this));

	// 已下載頁面點擊編輯排序事件
	this.container.find(".edit-sort").off("click").on("click", function (e) {
		this.intoEditSortMode();
	}.bind(this));

	this.container.find(".edit-status button.cancel").off("click").on("click", function (e) {
		this.outEditSortMode();
		this.rearrange();
	}.bind(this));

	this.container.find(".edit-status button.save").off("click").on("click", function (e) {
		this.saveSortByUser();
		this.outEditSortMode();
		
	}.bind(this));

	// this.container.find("ul li")[0].click();
	$("body").append(this.container);
	this.container.fadeIn();
}

StickerStoreView.prototype = {
	htmlText : "<div id='StickerStoreModal'>" +
					"<div class='close-area'>" + 
						"<img class='close' src='images/sticker_center/symbols-qicon_cancle.png'>" +
					"</div>" + 
				  	"<div class='container'>" + 
					  	"<div class='page-header'>" + 
						  "<ul class='tab'>" +
							"<li class='tab-link active' data-href='all-stickers'>貼圖市集</li>" +
							"<li class='tab-link' data-href='non-download-stickers'>未下載</li>" + 
							"<li class='tab-link' data-href='already-download-stickers'>已下載</li>" +
						  "</ul>" +
						"</div>" +
					   	"<div class='advertisement'></div>" +
					   	"<div class='edit edit-sort'>編輯排序</div>" +
					   	"<div class='edit edit-status'>" + 
					   		"<button class='cancel'>取消</button>" + 
					   		"<button class='save'>儲存 </button>" + 
					   	"</div>" +
						"<div class='page-home'>" + 
						  "<div class='main-content sticker-shop'></div>" +
						  // "<div class='tab-content non-download-sticker'></div>" +
						  // "<div class='tab-content download-sticker'></div>" +
						  "<div class='sticker-package-detail'>" + 
						    "<div class='return'>返回</div>" +
						    "<div class='main-sticker'></div>" + 
						    "<div class='sticker-img-list'></div>" +
						  "<div>" +
					    "</div>" +
					  "</div>" +
					"</div>" +
				"</div>",

	// 取得最近15包貼圖套件，並加在貼圖中心畫面上
	getLastestPackages : function (time) {
		var self = this;
		var loadDeferred = $.Deferred();
		time = time || "";
		new QmiAjax({
        	apiName: "sticker_packages/latest/?ct=" + time
    	}).then(function (data) {

    		var stickerData = $.parseJSON(data.responseText);
			if (data.status == 200) {

				if (stickerData.spl.length > 0) {
					self.latestTime = stickerData.spl[stickerData.spl.length -1].ct;
					self.getLastestPackages(self.latestTime);
				} 

    			$.each(stickerData.spl, function (i, stickerPackageObj) {
    				var stickerPackage = new StickerPackage(stickerPackageObj);
    				
    				var newSticker = self.bindEvent(stickerPackage)
    				
					self.defaultOrder.push(stickerPackageObj.spi);
    				self.container.find(".sticker-shop").append(newSticker);

    				loadDeferred.resolve();
    			});

    		} else {
    			console.log(data.responseText.rsp_msg)		
    		}
    	});

    	return loadDeferred.promise();
	},

	getSequence : function () {
		var selfSticker = $.lStorage("_sticker") || {};
		for (var stickerID in selfSticker) this.orderByUser.push(stickerID);
	},

	bindEvent : function (stickerPackage) {
		var self = this;
    	var stickerBlock = stickerPackage.html;
    	var dragStartPosY;

		stickerBlock.on("click", function (e) {
			var target = e.target;
			if (target.tagName == "BUTTON") {
				if ($(target).hasClass("download")) {
					stickerPackage.download().then(function () {
						self.orderByUser.push(stickerPackage.packageId);
						stickerPackage.saveDataToLocal();
						if (self.currentTab == 'non-download-stickers') {
							stickerPackage.html.hide();
						}
					});
					
				} else if ($(target).hasClass("remove")) {
					stickerPackage.remove().then(function () {
						stickerPackage.removeLocalData();
						self.orderByUser.splice(self.orderByUser.indexOf(stickerPackage.packageId), 1)
					});
				}
			} else {
				if (!self.isEditMode) {
					self.container.find(".main-content").hide();
					self.container.find(".edit-sort").hide();
					self.showSingleStickerDetail(stickerPackage);
				}
			}
		});

		stickerBlock[0].addEventListener("dragstart", function(dragEvent) {
			dragStartPosY = dragEvent.pageY;
			var dragTarget;
			if ($(dragEvent.target).hasClass("sticker-package-block")) {
				dragTarget = $(dragEvent.target);
			} else {
				dragTarget = $(dragEvent.target).parents(".sticker-package-block");
			}

			dragEvent.dataTransfer.setData("text", dragTarget.data("spi"));
		});

		stickerBlock[0].addEventListener("drag", function(event) {
		    $(".page-home").scrollTop($(".page-home").scrollTop() + (event.pageY - dragStartPosY) - 100);
		});

		stickerBlock[0].addEventListener("drop", function(dropEvent) {
			var dropTarget;
			var tempBlock = $("<div>");
			var temp;
			var swapTargetID = dropEvent.dataTransfer.getData("text");
			var swapTarget = self.container.find(".sticker-package-block[data-spi='" 
				+ swapTargetID + "']" );

			if ($(dropEvent.target).hasClass("sticker-package-block")) {
				dropTarget = $(dropEvent.target);
			} else {
				dropTarget = $(dropEvent.target).parents(".sticker-package-block");
			}

			if (dropTarget.data("spi") != swapTargetID) self.isUpdateOrder = true;
	
			swapTarget.before(tempBlock);
			dropTarget.before(swapTarget)
			tempBlock.after(dropTarget).remove();
		});

		return stickerBlock;
	},

	loadMore : function (e) {
		var mainPage = e.target;
		if($(mainPage).scrollTop() + $(mainPage).height() > $(mainPage)[0].scrollHeight - 100) {
			$(mainPage).css("overflow", "hidden");
            this.getLastestPackages(this.latestTime).done(function () {
            	$(mainPage).css("overflow", "auto");
            });
        }
	},

	// 貼圖市集顯示所有貼圖
	showAllStickers : function () {
		this.container.find(".edit").hide();
		this.container.find(".sticker-package-block").show();
		// this.container.find(".sticker-package-block.download-done").attr("draggable", false);
		this.container.find(".sticker-package-block.download-done button.remove")
					  .removeClass("remove").addClass("download-done")

		$.each(this.defaultOrder, function (i, stickerID) {
			var stickerPackage = this.container.find(".sticker-package-block[data-spi='" + stickerID + "']");
			this.container.find(".sticker-shop").append(stickerPackage)
		}.bind(this));
	},

	// 顯示未下載的貼圖
	showNoneDownloadStickers : function () {
		this.container.find(".edit").hide();
		this.container.find(".sticker-package-block.download-done").hide();
		this.container.find(".sticker-package-block.download-none").show();
	},

	// 顯示已下載的貼圖
	showDoneDownloadStickers : function () {
		if (this.container.find(".sticker-package-block.download-done").length > 1) {
			this.container.find(".edit-sort").show();
		}
		this.container.find(".edit-status").hide();
		this.container.find(".sticker-package-block.download-none").hide();
		this.container.find(".sticker-package-block.download-done").show();
		this.container.find(".sticker-package-block.download-done button")
					  .removeAttr("class").addClass("remove");

		this.rearrange();
	},

	// 顯示單一貼圖詳細內容
	showSingleStickerDetail : function (sticker) {
		// this.container.find(".page-home").unbind("scroll");
		var stickerDetailView = this.container.find(".sticker-package-detail");
		var self = this;

		new QmiAjax({
        	apiName: "sticker_packages/" + sticker.packageId + "/detail"
    	}).then(function (data) {
    		var detailData = $.parseJSON(data.responseText);
    		var stickerListHtml = "";

    		if (data.status == 200) {
    			stickerDetailView.find(".main-sticker")
    							 .html("<img class='main-img'" + "src='" + detailData.l + "'>" +
										"<div class='intro'>" +
											"<p class='name'>" + detailData.na + "</p>" + 
											"<p class='author'>" + detailData.au + "</p>" + 
										"</div>" + 
										"<button class='" + sticker.html.find("button").attr("class") + "' >" +
											sticker.html.find("button").text() + 
										"</button>");

 				stickerDetailView.find("button").off("click").on("click", function (e) {
 					console.log(e.target);
 					switch ($(e.target).attr("class")) {
 						case "download" :
 							sticker.download().then(function () {
 								$(e.target).removeClass("download")
										   .addClass("download-done")
										   
 								sticker.saveDataToLocal();
 								if (self.currentTab == 'non-download-stickers') {
									sticker.html.hide();
								}
 							});

 							break;

 						case "remove" :
 							sticker.remove().then(function () {
 								$(e.target).removeClass("remove")
										   .addClass("download")
										   
 								sticker.removeLocalData();
 								self.orderByUser.splice(self.orderByUser.indexOf(sticker.packageId), 1);
 								self.returnHomePage();

 								toastShow("刪除成功");
 							});
 							break;
 					}
 				});

    			stickerListHtml = $.map(detailData.sl, function (stickerObj) {
	        		return "<div class='img-content'><img src='" + stickerObj.sou + "'></div>";
	    		}).join("\n");

    			stickerDetailView.find(".sticker-img-list").html(stickerListHtml);

    			stickerDetailView.find(".sticker-img-list img").on("click", function () {
    				stickerDetailView.find(".sticker-img-list img.enlarge").removeClass("enlarge");
    				stickerDetailView.find(".sticker-img-list img").addClass("reduce-opacity")
    				$(this).removeClass("reduce-opacity").addClass("enlarge");
    			});

    		} else {
    			console.log(data.responseText.rsp_msg);
    		}

    		stickerDetailView.fadeIn(500);
    	});
	},

	returnHomePage : function () {
		// if (this.ableLoadMoreStricker) this.container.find(".page-home").bind("scroll", this.loadMore.bind(this));
		this.container.find(".sticker-package-detail").hide();
		this.container.find(".main-content").fadeIn(500);
		if (this.currentTab == "already-download-stickers" && this.orderByUser.length > 1) {
			this.container.find(".edit-sort").show();
		}
	},

	close : function () {
		var self = this;
		if (self.isUpdateOrder) {
			popupShowAdjust("尚未儲存排序，是否關閉?", "", "是", "否",
				[function () {
					self.container.fadeOut(300, function() {
						self.container.remove();
						delete self.container;
					});
				}]
			);
		} else {
			self.container.fadeOut(300, function() {
				self.container.remove();
				delete self.container;
			});
		}
	},

	intoEditSortMode : function () {

		this.isEditMode = true;
		this.container.find(".edit-sort").hide();
		this.container.find(".edit-status").show();
		// this.container.find(".sticker-package-block.download-done").bind("dragstart");
		this.container.find(".sticker-package-block.download-done").attr("draggable", true);
		this.container.find(".sticker-package-block.download-done").on("click", this.preventClick);
		this.container.find(".sticker-package-block.download-done button")
					  .removeClass("remove").addClass("edit-move");
		$(this.container.find("li.tab-link")[0]).addClass("disabled");
		$(this.container.find("li.tab-link")[1]).addClass("disabled");
	},

	outEditSortMode : function () {
		this.isEditMode = false;
		this.isUpdateOrder = false;
		this.container.find(".edit-status").hide();
		this.container.find(".edit-sort").show();
		this.container.find(".sticker-package-block.download-done").attr("draggable", false);
		this.container.find(".sticker-package-block.download-done").off("click", this.preventClick);
		this.container.find(".sticker-package-block.download-done button")
					  .removeClass("edit-move").addClass("remove");
		$(this.container.find("li.tab-link")[0]).removeClass("disabled");
		$(this.container.find("li.tab-link")[1]).removeClass("disabled");
	},

	saveSortByUser : function () {
		var selfSticker = $.lStorage("_sticker") || {};
		var orderOfSticker = {} 
		this.orderByUser = []
		this.container.find(".sticker-package-block.download-done").each(function (i, elem) {
			orderOfSticker[elem.getAttribute("data-spi")] = selfSticker[elem.getAttribute("data-spi")]
			this.orderByUser.push(elem.getAttribute("data-spi"));
		}.bind(this));

		$.lStorage("_sticker", orderOfSticker);
	},

	rearrange : function () {
		$.each(this.orderByUser, function (i, stickerID) {
			var stickerPackage = this.container.find(".sticker-package-block.download-done" + 
				"[data-spi='" + stickerID + "']");
			this.container.find(".sticker-shop").append(stickerPackage)
		}.bind(this));
	},

	preventClick : function () {
		console.log("eeee");
		return false;
	}
}

function StickerPackage (data) {
	var selfSticker = $.lStorage("_sticker") || {};
	var status = (data.n == 1) ? "New" : "";
	var swapTarget;

	this.packageId = data.spi;
	this.mainStickerUrl = data.l;
	this.name = data.na;
	this.author = data.au;
	this.stickerList = [];
	this.html = $("<div class='sticker-package-block' data-spi='" + data.spi + "' >" + 
					"<img src= '" + data.l + "' draggable=false>" + 
					"<div class='intro'>" +
						"<p class='status'>" + status + "</p>" + 
						"<p class='name'>" + data.na + "</p>" + 
						"<p class='author'>" + data.au + "</p>" + 
						"<progress class='download-progress' value='0' ></progress>" +
					"</div>" + 
					"<button></button>" +
				"</div>");

	if (typeof(selfSticker) == "object" 
		&& selfSticker.hasOwnProperty(data.spi)
		&& selfSticker[data.spi].list) {
		this.html.addClass("download-done");
		this.html.find("button").attr("class", "download-done");
	} else {
		this.html.addClass("download-none");
		this.html.find("button").attr("class", "download");
	} 
}

StickerPackage.prototype = {
	download : function () {
		var self = this;
		var stickerBlock = self.html;
		var deferred = $.Deferred();

		stickerBlock.find("progress").css("visibility", "visible");

		var ajaxArgs = {
			url: base_url + "apiv1/sticker_packages/" + self.packageId + "/download",
			
			headers : {
				ui : ui,
				at : at,
				li : lang,
			},
			type: 'POST',
			xhrFields: {
                onprogress: function (evt) {
                    if (evt.lengthComputable) {
			        	stickerBlock.find("progress").attr("max", evt.total).attr("value", evt.loaded);
			      	}
                }
            },
		}

		$.ajax(ajaxArgs).complete(function(data) {
			var downloadData = $.parseJSON(data.responseText);

			if (data.status == 200) {
				self.switchDoneStatus();
				stickerBlock.find("button").removeClass("download").addClass("download-done")
				self.stickerList = downloadData.sl;

				deferred.resolve();
			} else {
				toastShow($.i18n.getString("REFRESH_RELOAD"));
			}
			setTimeout( function() {
				stickerBlock.find("progress").css("visibility", "hidden"); 
			}, 500);
		});

		return deferred.promise();
	},

	remove : function () {
		var self = this;
		var stickerBlock = self.html;
		var deferred = $.Deferred();

		stickerBlock.find("progress").css("visibility", "visible");

		var ajaxArgs = {
			url: base_url + "apiv1/me/sticker_packages/" + self.packageId,
			
			headers : {
				ui : ui,
				at : at,
				li : lang,
			},
			type: 'DELETE',
			xhrFields: {
                onprogress: function (evt) {
                    if (evt.lengthComputable) {
			        	stickerBlock.find("progress")
			        				.attr("max", evt.total)
			        				.attr("value", evt.loaded);
			      	}
                }
            },
		}

		$.ajax(ajaxArgs).complete(function(data) {
			if (data.status == 200) {
				self.swtichNoneStatus();
				stickerBlock.find("button").removeClass("remove")
										   .addClass("download")

				setTimeout( function () {
					stickerBlock.find("progress").css("visibility", "hidden"); 
				}, 500);

				self.stickerList = [];

				deferred.resolve();
			}
		});

		return deferred.promise();
	},

	switchDoneStatus : function () {
		this.html.removeClass("download-none");
		this.html.addClass("download-done");
	},

	swtichNoneStatus : function () {
		this.html.removeClass("download-done");
		this.html.addClass("download-none");
		this.html.hide();
	},

	saveDataToLocal : function () {
		var stickerPackList = $.lStorage("_sticker") || {};

		stickerPackList[this.packageId] = {
			list : this.stickerList,
			au : this.author,
			na : this.name,
			spi : this.packageId,
			l : this.mainStickerUrl
		}

		$.lStorage("_sticker", stickerPackList)
	},

	removeLocalData : function () {
		var stickerPackList = $.lStorage("_sticker") || {};

		delete stickerPackList[this.packageId];
		if (Object.keys(stickerPackList).length == 0) $.lStorage("_stickerHistory", [])
		$.lStorage("_sticker", stickerPackList)
	}
}