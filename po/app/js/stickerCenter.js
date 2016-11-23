$.fn.StickerStore = function () {
	var stickerStoreView =  new StickerStoreView();
	stickerStoreView.getLastestPackages();
	// stickerStoreView.setUserStickerOrder()
}

function StickerStoreView() {
	this.currentTab = "sticker-shop";
	this.container = $(this.htmlText);
	this.defaultOrder = [];
	this.orderByUser = [];
	this.latestTime;

	// 切換貼圖示集、未下載和已下載tab
	this.container.find("ul li").off("click").on("click", function (e) {
		this.currentTab = $(e.target).data("href");
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
	}.bind(this));

	this.container.find(".page-home").off("scroll").on("scroll", function (e) {
		var mainPage = e.target;
		// console.log($(mainPage)[0].scrollHeight);
		// console.log($(mainPage).scrollTop())
		if($(mainPage).scrollTop() + $(mainPage).height() > $(mainPage)[0].scrollHeight - 250) {
            this.getLastestPackages(this.latestTime);
        }
	}.bind(this));

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
	}.bind(this));

	this.container.find(".edit-status button.save").off("click").on("click", function (e) {
		this.saveSortByUser();
		this.outEditSortMode();
		console.log(this.orderByUser);
	}.bind(this));

	// this.container.find("ul li")[0].click();
	$("body").append(this.container);
	this.container.fadeIn();
}

StickerStoreView.prototype = {
	htmlText : "<div id='StickerStoreModal'>" +
				  	"<div class='container'>" + 
					  	"<div class='page-header'>" + 
						  "<ul class='tab'>" +
							"<li class='tab-link active' data-href='all-stickers'>貼圖示集</li>" +
							"<li class='tab-link' data-href='non-download-stickers'>未下載</li>" + 
							"<li class='tab-link' data-href='already-download-stickers'>已下載</li>" +
						  "</ul>" +
					  	  "<div class='close'>X</div>" +
						"</div>" +
					   	"<div class='advertisement'></div>" +
					   	"<div class='edit-sort'>編輯排序</div>" +
					   	"<div class='edit-status'>" + 
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
		time = time || "";
		new QmiAjax({
        	apiName: "sticker_packages/latest/?ct=" + time
    	}).then(function (data) {

    		var stickerData = $.parseJSON(data.responseText);
			if (data.status == 200) {

				if (stickerData.spl.length > 0) {
					self.latestTime = stickerData.spl[stickerData.spl.length -1].ct;
				} else {
					self.container.find(".page-home").unbind("scroll");
				}

    			$.each(stickerData.spl, function (i, stickerPackageObj) {
    				var stickerPackage = new StickerPackage(stickerPackageObj);
    				var stickerBlock = stickerPackage.html;
    				
    				stickerBlock.on("click", function (e) {
    					var target = e.target;
    					if (target.tagName == "BUTTON") {
    						if ($(target).hasClass("download")) {
    							stickerPackage.download().then(function () {
    								self.orderByUser.push(stickerPackage.packageId);
    							});
    							
    						} else if ($(target).hasClass("remove")) {
    							stickerPackage.remove();
    							self.orderByUser.splice(self.orderByUser.indexOf(stickerPackage.packageId), 1)
    						}
    					} else {
    						self.container.find(".main-content").hide();
    						self.container.find(".edit-sort").hide();
    						self.showSingleStickerDetail(stickerPackage);
    					}
    				});

    				stickerBlock[0].addEventListener("dragstart", function(dragEvent) {

						var dragTarget;

						if ($(dragEvent.target).hasClass("sticker-package-block")) {
							dragTarget = $(dragEvent.target);
						} else {
							dragTarget = $(dragEvent.target).parents(".sticker-package-block");
						}

						dragEvent.dataTransfer.setData("text", dragTarget.data("spi"));
					});

					stickerBlock[0].addEventListener("drop", function(dropEvent) {
						
						var dropTarget;
						var tempBlock = $("<div>");
						var temp;
						var swapTargetID = dropEvent.dataTransfer.getData("text");
						var swapTarget = self.container.find(".sticker-package-block[data-spi='" + swapTargetID + "']" );

						if ($(dropEvent.target).hasClass("sticker-package-block")) {
							dropTarget = $(dropEvent.target);
						} else {
							dropTarget = $(dropEvent.target).parents(".sticker-package-block");
						}
				
						swapTarget.before(tempBlock);
						dropTarget.before(swapTarget)
						tempBlock.after(dropTarget).remove();

						// console.log(self.orderByUser);
					});

					self.defaultOrder.push(stickerPackageObj.spi);
    				self.container.find(".sticker-shop").append(stickerBlock);
    			});

    		} else {
    			console.log(data.responseText.rsp_msg)		
    		}
    	});
	},

	// 貼圖市集顯示所有貼圖
	showAllStickers : function () {
		this.container.find(".edit-sort").hide();
		this.container.find(".sticker-package-block").show();
		this.container.find(".sticker-package-block.download-done button.remove")
					  .removeClass("remove").addClass("download-done").text("已下載");


		console.log(this.defaultOrder);

		$.each(this.defaultOrder, function (i, stickerID) {
			var stickerPackage = this.container.find(".sticker-package-block[data-spi='" + stickerID + "']");
			this.container.find(".sticker-shop").append(stickerPackage)
		}.bind(this));
	},

	// 顯示未下載的貼圖
	showNoneDownloadStickers : function () {
		this.container.find(".edit-sort").hide();
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
					  .removeAttr("class").addClass("remove").text("刪除");

		$.each(this.orderByUser, function (i, stickerID) {
			var stickerPackage = this.container.find(".sticker-package-block.download-done" + 
				"[data-spi='" + stickerID + "']");
			this.container.find(".sticker-shop").append(stickerPackage)
		}.bind(this));
	},

	// 顯示單一貼圖詳細內容
	showSingleStickerDetail : function (sticker) {
		var stickerDetailView = this.container.find(".sticker-package-detail");

		new QmiAjax({
        	apiName: "sticker_packages/" + sticker.packageId + "/detail"
    	}).then(function (data) {
    		var detailData = $.parseJSON(data.responseText);
    		var stickerListHtml = "";

    		if (data.status == 200) {
    			stickerDetailView.find(".main-sticker")
    							 .html("<img class='main-img'" + "src='" + detailData.l + "'>" +
										"<div class='intro'>" +
											// "<p class='status'>" + status + "</p>" + 
											"<p class='name'>" + detailData.na + "</p>" + 
											"<p class='author'>" + detailData.au + "</p>" + 
										"</div>" + 
										"<button class='" + sticker.html.find("button").attr("class") +"'>" +
											sticker.html.find("button").text() + 
										"</button>");


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

    		stickerDetailView.fadeIn(800);
    	});
	},

	returnHomePage : function () {
		this.container.find(".sticker-package-detail").hide();
		this.container.find(".main-content").fadeIn(800);
		if (this.currentTab == "already-download-stickers") {
			this.container.find(".edit-sort").show();
		}
	},

	close : function () {
		this.container.fadeOut(1000, function() {
			this.container.remove();
			delete this.container;
		}.bind(this));
	},

	intoEditSortMode : function () {
		this.container.find(".edit-sort").hide();
		this.container.find(".edit-status").show();
		this.container.find(".sticker-package-block.download-done").attr("draggable", true);
	},

	outEditSortMode : function () {
		this.container.find(".edit-status").hide();
		this.container.find(".edit-sort").show();
		this.container.find(".sticker-package-block.download-done").attr("draggable", false);
	},

	saveSortByUser : function () {
		this.orderByUser = []
		this.container.find(".sticker-package-block.download-done").each(function (i, elem) {
			this.orderByUser.push(elem.getAttribute("data-spi"));
		}.bind(this));
	}
}

function StickerPackage (data) {
	var selfSticker = $.lStorage("_sticker");
	var status = (data.n == 1) ? "New" : "";
	var swapTarget;

	this.packageId = data.spi;
	this.html = $("<div class='sticker-package-block' data-spi='" + data.spi + "'>" +
					"<img src= '" + data.l + "'>" + 
					"<div class='intro'>" +
						"<p class='status'>" + status + "</p>" + 
						"<p class='name'>" + data.na + "</p>" + 
						"<p class='author'>" + data.au + "</p>" + 
						"<progress class='download-progress' value='0' ></progress>" +
					"</div>" + 
					"<button></button>" +
				"</div>");


	if (typeof(selfSticker) == "object" && selfSticker.hasOwnProperty(data.spi)) {
		this.html.addClass("download-done");
		this.html.find("button").attr("class", "download-done").text("已下載");
	} else {
		this.html.addClass("download-none");
		this.html.find("button").attr("class", "download").text("下載");
	} 
}

StickerPackage.prototype = {
	download : function () {
		var self = this;
		var stickerBlock = self.html;
		var deferred = $.Deferred();

		stickerBlock.find("progress").css("visibility", "visible");

		var ajaxArgs = {
			url: base_url + "sticker_packages/" + self.packageId + "/download",
			
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
				stickerBlock.find("button").removeClass("download")
										   .addClass("download-done")
										   .text("已下載");

				setTimeout( function() {
					stickerBlock.find("progress").css("visibility", "hidden"); 
				}, 500);

				deferred.resolve();
			}
		});

		return deferred.promise();
	},

	remove : function () {
		var self = this;
		var stickerBlock = self.html;

		stickerBlock.find("progress").css("visibility", "visible");

		var ajaxArgs = {
			url: base_url + "me/sticker_packages/" + self.packageId,
			
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
										   .text("下載");

				setTimeout( function () {
					stickerBlock.find("progress").css("visibility", "hidden"); 
				}, 500);
			}
		});
	},

	switchDoneStatus : function () {
		this.html.removeClass("download-none");
		this.html.addClass("download-done");
		this.html.hide();
	},

	swtichNoneStatus : function () {
		this.html.removeClass("download-done");
		this.html.addClass("download-none");
		this.html.hide();
	},
}