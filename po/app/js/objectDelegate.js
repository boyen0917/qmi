ObjectDelegate = {
	defaultRow: {},
	
	init : function(option) {
		this.mainPage = option.mainPage;
		this.finishButton = option.headerBtn;
		// this.selectNumElement = option.selectNumElement;
		this.searchArea = this.mainPage.querySelector("div.search");
		this.basicSelect = this.mainPage.querySelector("div.obj-cell-area>div.basic-select");
		this.branchMenu = this.mainPage.querySelector("div.branchList");
		this.mainContainer = this.mainPage.querySelector("div.obj-cell-container");
		this.selectAllBtn = this.mainPage.querySelector("div.obj-cell-area>div.obj-select-all>span");
		this.breadcrumb = this.branchMenu.querySelector("ul.breadcrumb");
		this.closeBtn = this.branchMenu.querySelector("div.dropdown-menu>button")
		
		

		// this.loadingCircle = this.mainPage.find(".bottom");
		
		// this.searchInput = this.searchArea.find("input");
		// this.selectListArea = this.searchArea.find(".list .text");
		// this.clearButton = this.searchArea.find("span");
		// this.pageBackButton = this.mainPage.find(".page-back");

		this.currentBranch = 'root';
		this.allMemberChkbox = {};
		this.allBranchChxbox = {};
		// this.defaultRow = {};
		this.favParentRow = {};
		this.favMemberRows = [];
		this.favBranchRows = [];
		this.memberRows = [];
		this.branchRows = [];
		this.currentRows = [];
		this.isSelectedAllBranch = false;
		this.isSelectAll = false;
		this.isSelectedAllMember = false;

		this.group = QmiGlobal.groups[gi];
		this.memberList = $.extend(true, {}, this.group.guAll);
		
		this.compose = option.thisCompose;
		this.composeObj = option.thisComposeObj;
		this.onDone = option.onDone;
		this.isBack = option.isBack;
		this.singleCheck = option.singleCheck;
		this.visibleMembers = option.visibleMembers;
		this.visibleMemNum = 0;
		this.minSelectNum = option.minSelectNum;
		this.checkedMems = option.checkedMems;
		this.treeData = option.treeData;
		// this.newAddMems = {};
		this.oriCheckedMems = Object.assign({}, option.checkedMems);
		this.checkedBranches = option.checkedBranches || {};
		this.checkedFavorites = option.checkedFavorites || {};
		this.isDisableOnAlreadyChecked = option.isDisableOnAlreadyChecked;

		this.matchList = this.visibleMembers;

		this.bindEvent();
		this.setDefaultOptions();
		this.changeBranchView('root');
		this.setBranchMenu();
		this.updateStatus();

		return this;
	},

	setBranchMenu: function () {
		var self = this;
		var branchObj = self.treeData['root'];
		var branchOptions = self.branchMenu.querySelector("ul");

		(function recursiveBranch() {
			branchObj.cl.forEach(function(branchId) {
				branchObj = self.treeData[branchId]

				if (branchObj.cl && branchObj.cl.length > 0) {
					recursiveBranch();
				}
			});
		})();
	},

	setBreadcrumb: function () {
		var self = this;
		self.clearBreadcrumb();

		var branchObj = self.treeData[self.currentBranch];

		// var item = document.createElement("li");
		// item.textContent = branchObj.bn;
		var item = createBranchItem(branchObj, false);

		self.breadcrumb.appendChild(item);

		while (branchObj.pi) {
			branchObj = self.treeData[branchObj.pi];

			var item = createBranchItem(branchObj, true);

			self.breadcrumb.appendChild(item);
		}

		function createBranchItem (branch, withLink) {
			var item = document.createElement("li");

			if (withLink) {
				var link = document.createElement('a');
				link.textContent = branch.bn;
				link.onclick = function (e) {
					e.stopPropagation();
					self.changeBranchView(branch.bi);
				};

				item.appendChild(link);
			} else {
				item.textContent = branch.bn;
			}

			return item;
		} 
	},

	clearBreadcrumb: function () {
		while(this.breadcrumb.firstChild) {
			this.breadcrumb.removeChild(this.breadcrumb.firstChild);
		}
	},

	resetView: function () {

		while(this.mainContainer.firstChild) {
			this.mainContainer.removeChild(this.mainContainer.firstChild);
		}
	},

	setDefaultOptions : function () {

		if (Object.keys(this.defaultRow).length == 0) {
			this.addRowElement("Default");
		}
		// this.addFavoriteSubRow("FavBranch", {thisFavBranchObj : fbObj, isSubRow : true});
	},

	changeBranchView : function (branchId) {
		console.log(branchId)
		var self = this;
		var isBranchChecked = self.checkedBranches.hasOwnProperty(branchId);

		self.resetView();
		self.currentBranch = branchId;
		self.currentRows = [];


		self.treeData[branchId].gul.forEach(function (gu) {
			var memberObj = self.memberList[gu];
			var isChecked = false;
			if (isBranchChecked) {
				isChecked = true;
			} else {
			 	isChecked = self.checkedMems.hasOwnProperty(gu);
			}

			self.addRowElement("Member", memberObj, isChecked);
		});

		self.treeData[branchId].cl.forEach(function (branchKey) {
			var isChecked = false;
			if (isBranchChecked) {
				isChecked = true;
			} else {
				isChecked = self.checkedBranches.hasOwnProperty(branchKey);
			}

        	self.addRowElement("Branch", self.treeData[branchKey], isChecked);
		});

		if (branchId != 'root') {
			self.setBreadcrumb();
			self.basicSelect.style.display = 'none';
			self.searchArea.style.display = 'none';
			self.branchMenu.style.display = 'block';

			self.updateBranchMenuStatus();
		} else {
			self.basicSelect.style.display = 'block';
			self.searchArea.style.display = 'block';
			self.branchMenu.style.display = 'none';
		}

		self.selectAllBtn.previousElementSibling.textContent = (branchId == 'root') 
			? $.i18n.getString('COMMON_MEMBER') : self.treeData[branchId].bn;
	},

	updateBranchMenuStatus : function () {
		var branchObj = this.treeData[this.currentBranch];

		// 更新dropdown menu 按鈕文字
		this.branchMenu.querySelector("div.current-branch>div").textContent = branchObj.bn;
		this.branchMenu.querySelector("div.current-branch>p").textContent = $.i18n.getString("COMPOSE_N_MEMBERS", branchObj.cnt) + 
					" " + $.i18n.getString("COMPOSE_N_SUBGROUP", branchObj.cl.length);
	},

	setHeight : function() {
		var paddingTop = this.searchArea.outerHeight();
		this.mainContainer.parent().css("height", $(window).height() - 57 - paddingTop);

    	return this;
	},

	bindEvent : function () {
		this.closeBtn.removeEventListener('click', this.onBackToHome);
		this.onBackToHome = this.onBackToHome.bind(this);
		this.closeBtn.addEventListener('click', this.onBackToHome);
		 
		this.selectAllBtn.removeEventListener('click', this.onSelectAll);
		this.onSelectAll = this.selectAll.bind(this);
		this.selectAllBtn.addEventListener('click', this.onSelectAll);


		// var selectAll = this.selectAll.bind(this);
		// this.selectAllBtn.removeEventListener('click', this.selectAll.bind(this))
		// this.selectAllBtn.addEventListener('click', this.selectAll.bind(this));
		// this.mainContainer.parent().off("scroll").on("scroll", this.loadMoreMemRow.bind(this));
		// this.searchInput.off("input").on("input", this.searchMatchRow.bind(this));
		// this.searchArea.off("click").on("click", this.focusSearchArea.bind(this));
		// this.finishButton.off("click").on("click", this.clickDone.bind(this));
		// this.clearButton.off("click").on("click", this.clearAllCheckRows.bind(this));
		// this.selectListArea.off("click").on("click", "span", this.searchCheckedRow.bind(this));
		// this.searchArea.children(".list").off("scroll").on("scroll", this.loadMoreMemLabels.bind(this));
	},

	// setEventHandler: function () {
	// 	this.selectAllBtn.removeEventListener('click', this.onSelectAll);
	// }

	onBackToHome : function () {
		this.changeBranchView('root');
	},

	selectAll : function () {
		console.log('selectall')
		var self = this;
		self.currentRows.forEach(function(row) {
			row.check(!self.isSelectAll);
		});

		self.isSelectAll = !self.isSelectAll;
		self.selectAllBtn.textContent = self.isSelectAll ? 
			$.i18n.getString("COMMON_SELECT_NONE") : $.i18n.getString("COMMON_SELECT_ALL");

		if (self.isSelectAll) {

		}
	},

	focusSearchArea : function () {
		this.searchInput.focus();
	},

	clickDone : function (e) {
		if ($(e.target).hasClass("disable")) return;

		var checkedMemNum = Object.keys(this.checkedMems).length;
		var checkedBranchNum = Object.keys(this.checkedBranches).length + Object.keys(this.checkedFavorites).length;
		if (this.composeObj.parent().hasClass("cp-work-item")) {
			var target = $(".cp-work-item-object span:eq(" + this.composeObj.parents(".cp-work-item").data("work-index") + ")");
			var objText = $.i18n.getString("COMPOSE_ASSIGN");
			if (checkedMemNum > 0) {
				target.css("color", "red");
				objText = this.checkedMems[Object.keys(this.checkedMems)[0]];
			} else {
				target.removeAttr("style");
			}

			target.html(objText);
			this.composeObj.data("object_str", JSON.stringify(this.checkedMems));
		} else {
			if(checkedMemNum > 0 && checkedBranchNum == 0) {  //無群組有選人
                this.composeObj.find("span").html( $.i18n.getString("GROUP_MEMBERS", checkedMemNum));
            } else if (checkedMemNum == 0 && checkedBranchNum > 0) { //有群組無選人
            	this.composeObj.find("span").html( $.i18n.getString("GROUP_COUNTS", checkedBranchNum));
            } else if (checkedMemNum > 0 && checkedBranchNum > 0) { //有群組有選人
            	this.composeObj.find("span").html( $.i18n.getString("GROUP_COUNTS", checkedBranchNum) 
            		+ $.i18n.getString("GROUP_AND") + $.i18n.getString("GROUP_MEMBERS", checkedMemNum));
            } else {
            	this.composeObj.find("span").html("");
            }

            this.compose.data("object_str", JSON.stringify(this.checkedMems));
            this.compose.data("branch_str", JSON.stringify(this.checkedBranches));
            this.compose.data("favorite_str", JSON.stringify(this.checkedFavorites));
		}

		if (this.isBack) this.pageBackButton.trigger("click");
		if (this.onDone) this.onDone(true);
	},

	loadMoreMemRow : function (e) {
		var container = $(e.target);
		var topAreaHeight = this.searchArea.outerHeight() + 58;
		if (container.scrollTop() + container.height() > container[0].scrollHeight - topAreaHeight) {
		    if (this.visibleMemNum < this.matchList.length) {

		    	setTimeout(function() {
					this.makeMemberList();
				}.bind(this), 500);
		    }
		}
	},

	showNoMember : function() {
		this.mainPage.find(".obj-content").hide().end()
        			 .find(".obj-coach-noMember").show().end();

        this.finishButton.hide();
	}, 

	searchCheckedRow : function(e) {
		e.stopPropagation();

		var searchTag = $(e.target);
		if (searchTag.text() != $.i18n.getString("COMMON_ALL_MEMBERS")) {
			this.searchInput.html(searchTag.text()).trigger("input");
		}
	}, 

	addRowElement : function (type, rowData, isChecked) {
		var self = this;
		var rowElement = document.createElement("object-cell-row");
		rowElement.type = type;
		rowElement.enable = true;
		rowElement.isChecked = isChecked;

		switch (type) {
			case "Default":
				rowElement.name = $.i18n.getString("COMMON_SELECT_ALL");
				rowElement.imageUrl = 'images/common/others/select_empty_all_photo.png';
				rowElement.enable = false;
				self.defaultRow = rowElement;
				break;
			case "Member":
				rowElement.number = rowData.gu;
				rowElement.name = rowData.nk.replaceOriEmojiCode();
				rowElement.imageUrl = rowData.aut ? rowData.aut : "images/common/others/empty_img_personal_xl.png";
				rowElement.doEventFun = self.checkThisRow.bind(self, rowElement);
				
				self.currentRows.push(rowElement);
				break;
			case "Branch":
				rowElement.number = rowData.bi;
				rowElement.name = rowData.bn;
				rowElement.imageUrl = 'images/common/others/select_empty_all_photo.png';
				rowElement.expand = true;
				rowElement.info = $.i18n.getString("COMPOSE_N_MEMBERS", rowData.cnt) + 
					" " + $.i18n.getString("COMPOSE_N_SUBGROUP", rowData.cl.length);

				rowElement.doEventFun = self.checkThisRow.bind(self, rowElement);
				rowElement.onclick = function (e) {
					self.changeBranchView(rowData.bi);
				}

				self.currentRows.push(rowElement);

				break;
		}

		if (type == 'Default') {
			this.basicSelect.appendChild(rowElement)
		} else {
			this.mainContainer.appendChild(rowElement);
		}
		// rowData = rowData || {};
		// rowData.isSelectedAll = this.isSelectedAllMember;
		// var rowElement = ObjectCell.factory(type, rowData);

		// switch (type) {
		// 	case "Default" :
		// 		this.defaultRow = rowElement;
		// 		// rowElement.bindEvent(this.clearAllCheckRows.bind(this));
		// 		break;
		// 	case "Favorite" :
		// 		this.favParentRow = rowElement;
		// 		rowElement.bindEvent(this.toggleFavSubRows.bind(this));
		// 		break;
		// 	case "Member" :
		// 		rowElement.bindEvent(this.checkThisMember.bind(this));
		// 		this.memberRows.push(rowElement);
		// 		break;
		// 	case "ParentBranch" :
		// 		rowElement.bindEvent(this.selectChildBranch.bind(this));
		// 		this.branchRows.push(rowElement);
		// 		break;
		// 	case "ChildBranch" :
		// 		rowElement.bindEvent(this.checkThisBranch.bind(this));
		// 		this.branchRows.push(rowElement);
		// 		break;
		// 	case "SelectAllTitle" :
		// 		// console.log(rowElement)
		// 		// console.log(rowData.type)
		// 		if (rowData.type == "group") {
		// 			rowElement.bindEvent(this.selectAllBranch.bind(this));
		// 			this.allBranchChxbox = rowElement;
		// 		} else {
		// 			rowElement.bindEvent(this.selectAllMember.bind(this));
		// 			this.allMemberChkbox = rowElement;
		// 		}
		// }

		// // rowElement.bindEvent(this.doSomething.bind(this));
		// if (type == "ParentBranch") this.mainContainer.append("<hr color='#F3F3F3'>");
	},

	makeMemberList : function () {
		var loadMemberList = this.matchList.slice(this.visibleMemNum, this.visibleMemNum + 500);
		var checkedObjNum = Object.keys(this.checkedMems).length;
		// 剩餘未顯示的成員不到500人
		if (this.visibleMemNum + 500 > this.matchList.length - 1) {
            loadMemberList = this.matchList.slice(this.visibleMemNum);
            this.visibleMemNum = this.matchList.length;
            this.loadingCircle.hide();
        } else {
        	this.visibleMemNum += 500;
        	this.loadingCircle.show();
        }

        $.each(loadMemberList, function(i, gu) {
        	var memberObj = this.groupAllMembers[gu];
        	if (checkedObjNum > 0) {
	         	if (this.checkedMems[memberObj.gu] != undefined) {
	         		memberObj.chk = true;

	         		// 不是新增對象的情境，或者是新增對象但是預設沒有被選
	         		memberObj.enable = !this.isDisableOnAlreadyChecked || 
	         			(this.isDisableOnAlreadyChecked && !this.oriCheckedMems.hasOwnProperty(memberObj.gu));
	         	} else {
	         		memberObj.chk = false;
	         		memberObj.enable = true;
	         	}
        	} else {
        		memberObj.enable = true;
        	}

            this.addRowElement("Member", {thisMember : memberObj, isSubRow : false});
        }.bind(this));
	},

	addFavoriteSubRow : function (type, rowData) {
		rowData = rowData || {};
		rowData.isSelectedAll = this.isSelectedAllMember;

		var rowElement = ObjectCell.factory(type, rowData);
		switch (type) {
			case "Member" :
				// if (Object.keys(this.checkedMems).length) {
		  //      		if (this.checkedMems[rowElement.id] != undefined) rowElement.checked(true);
		  //   	}
				rowElement.bindEvent(this.checkThisMember.bind(this));
				this.favMemberRows.push(rowElement);
				break;
			case "FavBranch" :
				if (Object.keys(this.checkedFavorites).length) {
					if (this.checkedMems[rowElement.id] != undefined) rowElement.checked(true);
				}
				rowElement.bindEvent(this.checkFavoriteBranch.bind(this))
				this.favBranchRows.push(rowElement);
				break;
		}

		this.favParentRow.html.find(".obj-cell-arrow").css("display", "inline-block").end()
							  .find(".folder").append(rowElement.html);
	},

	selectAllBranch : function () {
		this.isSelectedAllBranch = !this.isSelectedAllBranch;
		this.checkedBranches = {};

		this.branchRows.forEach(function(branchRow) {
			branchRow.checked(this.isSelectedAllBranch);
			if (this.isSelectedAllBranch) this.checkedBranches[branchRow.id] = branchRow.name;
		}.bind(this));
	},

	selectAllMember : function () {
		console.log('fffff')
		this.isSelectedAllMember = !this.isSelectedAllMember;
		this.checkedMems = {};

		this.favMemberRows.forEach(function (memberRow) {
			memberRow.checked(this.isSelectedAllMember);
		}.bind(this));

		this.visibleMembers.forEach(function(memberKey) {
			this.groupAllMembers[memberKey].chk = this.isSelectedAllMember;
			if (this.isSelectedAllMember) this.checkedMems[memberKey] = this.groupAllMembers[memberKey].nk;
		}.bind(this));

		this.memberRows.forEach(function(memberRow) {
			if (!memberRow.enable) this.checkedMems[memberRow.id] = memberRow.name;
			memberRow.checked(this.isSelectedAllMember);
		}.bind(this));
	},

	selectChildBranch : function (parentBranchRow) {
		if (parentBranchRow.isChecked) delete this.checkedBranches[parentBranchRow.id];
		else this.checkedBranches[parentBranchRow.id] = parentBranchRow.name;
		
		parentBranchRow.childBranch.forEach(function (childBranchRow) {
			if (parentBranchRow.isChecked) {
				delete this.checkedBranches[childBranchRow.id];
				childBranchRow.checked(false);
			} else {
				this.checkedBranches[childBranchRow.id] = childBranchRow.name;
				childBranchRow.checked(true);
			}
		}.bind(this));
	},

	toggleFavSubRows : function () {
		var isChecked = !this.favParentRow.isChecked;

		this.favBranchRows.forEach(function(favBranchRow) {
			this.checkFavoriteBranch(favBranchRow);
			favBranchRow.checked(isChecked);
		}.bind(this));

		this.favMemberRows.forEach(function(facMemberRow) {
			if (isChecked) this.checkedMems[facMemberRow.id] = facMemberRow.name;
			else delete this.checkedMems[facMemberRow.id];
			this.memberRows.forEach(function (memberRow) {
				if (memberRow.id == facMemberRow.id) memberRow.checked(isChecked);
			});
			this.groupAllMembers[facMemberRow.id].chk = isChecked;
			facMemberRow.checked(isChecked);
		}.bind(this));
	},

	// 預設全選
	clearAllCheckRows : function () {
		var allRow = [].concat(this.memberRows, this.branchRows, this.favBranchRows, this.favMemberRows);

		this.checkedMems = {};
		this.checkedBranches = {};
		this.checkedFavorites = {};
		this.isSelectedAllMember = false;
		this.isSelectedAllBranch = false;

		allRow.forEach(function(row) {
			console.log(this)
			if (!row.enable) {
				this.checkedMems[row.id] = row.name;
			} else {
				row.checked(false);
			}
		}.bind(this));

		this.updateStatus();
	},

	checkFavoriteBranch : function (thisFavBranchRow) {
		if (thisFavBranchRow.isChecked) delete this.checkedFavorites[thisFavBranchRow.id];
		else this.checkedFavorites[thisFavBranchRow.id] = thisFavBranchRow.name;
	},

	checkThisBranch : function (thisBranchRow) {
		if (thisBranchRow.isChecked) delete this.checkedBranches[thisBranchRow.id];
		else this.checkedBranches[thisBranchRow.id] = thisBranchRow.name;
	},

	checkThisRow : function (thisRow) {
		var checkedObj = {};
		var rowType = thisRow.type;

		if (rowType == 'Member') checkedObj = this.checkedMems;
		else if (rowType == 'Branch') checkedObj = this.checkedBranches;

		console.log(checkedObj)
		// else if (rowType == 'Branch') checkedObj = self.checkedBranches;
		// 點了我的最愛或是一般，會影響彼此，故檢查點選的成員是一般還是我的最愛，找出被影響的成員欄位
		// var relatedMemRows = (thisMemberRow.isSubRow) ? this.memberRows : this.favMemberRows;

		// // 單選其他，取消其他勾選
		if (this.singleCheck) {
			checkedObj = {};
			checkedObj[thisRow.number] = thisRow.name;
			this.currentRows.forEach(function(row) {
				row.check(false);
			}.bind(this));
		} else { //複選
			if (thisRow.isChecked) checkedObj[thisRow.number] = thisRow.name;
			else delete checkedObj[thisRow.number];
		}

		this.updateStatus();

		// relatedMemRows.forEach(function (memberRow) {
		// 	if (memberRow.id == thisMemberRow.id) memberRow.checked(!thisMemberRow.isChecked);
		// });
		
		// this.groupAllMembers[thisMemberRow.id].chk = !thisMemberRow.isChecked;
		// if (!$.isEmptyObject(this.defaultRow)) this.defaultRow.checked(false);
	},

	deleteAllMemRows : function () {
		this.memberRows.forEach(function(memberRow) {
			memberRow.remove();
		}.bind(this));

		this.memberRows = [];
	},

	searchMatchRow : function (e) {
		var target = $(e.target);
		var searchText = target.val().toLowerCase();
		console.log(searchText)
		this.visibleMemNum = 0;
		if (searchText.length > 0) {
			this.matchList = [];
			this.mainPage.find(".obj-content").addClass("on-search");
			this.mainContainer.find(".obj-cell-arrow").addClass("open").end()
							  .find(".folder").show().end()
							  // .find(".obj-content").addClass("on-search").end()
							  .find("hr").hide().end()
							  .find(".obj-cell-subTitle-chk").hide();

			if (Object.keys(this.favParentRow).length > 0) this.favParentRow.html.hide();

			//搜尋符合的群組
			this.branchRows.forEach(function(row) {
				if (row.name.toLowerCase().indexOf(searchText) > -1) row.html.show();
				else row.html.hide();
			});

			this.visibleMembers.forEach(function(memId) {
				var memberData = this.groupAllMembers[memId];
				if (memberData.nk.toLowerCase().indexOf(searchText) > -1
					|| memberData.bn.toLowerCase().indexOf(searchText) > -1) {
					this.matchList.push(memId);
				}
			}.bind(this));

		} else {
			this.matchList = this.visibleMembers;

			this.mainPage.find(".obj-content").removeClass("on-search");
			this.mainContainer.find(".obj-cell-arrow").removeClass("open").end()
							  .find(".folder").hide().end()
							  // .find(".obj-content").removeClass("on-search").end()
							  .find("hr").show().end()
							  .find(".obj-cell-subTitle-chk").show();

			if (Object.keys(this.favParentRow).length > 0) this.favParentRow.html.show();

			this.branchRows.forEach(function(row) {
				row.html.show();
			});
		}

		this.deleteAllMemRows();
		this.makeMemberList();
	},


	updateStatus : function () {
		var isEveryRowChecked = this.currentRows.every(row => row.isChecked);
		var selectNum = Object.keys(this.checkedMems).length + Object.keys(this.checkedBranches).length
			+ Object.keys(this.checkedFavorites).length;

		this.isSelectAll = isEveryRowChecked;
		this.selectAllBtn.textContent = this.isSelectAll ? 
			$.i18n.getString("COMMON_SELECT_NONE") : $.i18n.getString("COMMON_SELECT_ALL");

		
		console.log(selectNum)
		if (Object.keys(this.defaultRow).length > 0) {
			console.log('eeddef')
			if (selectNum > 0) this.defaultRow.check(false);
			else this.defaultRow.check(true);
		}

		console.log(this.checkedMems);
		console.log(this.checkedBranches);
	},
	// updateStatus : function () {
	// 	var allFavRow = [].concat(this.favMemberRows, this.favBranchRows);
	// 	var totalNum = Object.keys(this.checkedMems).length + Object.keys(this.checkedBranches).length
	// 		+ Object.keys(this.checkedFavorites).length;

	// 	var allCheckRowData = Object.assign({}, this.checkedFavorites, this.checkedBranches);

	// 	// 檢查我的最愛欄位底下子欄位是否全部都有勾選
	// 	var isAllFavRowChecked = allFavRow.every(function (favRow) {
	// 		return favRow.isChecked;
	// 	});

	// 	this.selectListArea.find("span").remove();

	// 	// 超過最少點取數量，才能按完成或下一步
	// 	if (totalNum >= this.minSelectNum) this.finishButton.removeClass("disable");
	// 	else this.finishButton.addClass("disable");

	// 	// 預設全選判斷
	// 	if (!$.isEmptyObject(this.defaultRow)) {
	// 		if (totalNum > 0) this.defaultRow.checked(false);
	// 		else this.defaultRow.checked(true);
	// 	}

	// 	// 如有顯示我的最愛區塊，更新我的最愛欄位是否要勾選
	// 	if (!$.isEmptyObject(this.favParentRow)) {
	// 		if (isAllFavRowChecked) {
	// 			this.favParentRow.html.find(".subgroup-parent .img").addClass("chk");
	// 			this.favParentRow.isChecked = true;
	// 		} else {
	// 			this.favParentRow.html.find(".subgroup-parent .img").removeClass("chk");
	// 			this.favParentRow.isChecked = false;
	// 		}
	// 	}

	// 	// 判斷被勾選的群組數量是否等於全體群組數量，有則全選鍵勾選
	// 	if (!$.isEmptyObject(this.allBranchChxbox)) {
	// 		if (Object.keys(this.checkedBranches).length == this.branchRows.length) {
	// 			this.isSelectedAllBranch = true;
	// 			this.allBranchChxbox.html.find(".img").addClass("chk");
	// 		} else {
	// 			this.isSelectedAllBranch = false;
	// 			this.allBranchChxbox.html.find(".img").removeClass("chk");
	// 		}
	// 	}

	// 	// 判斷被勾選的成員數量是否等於全體成員數量，有則全選鍵勾選
	// 	if (Object.keys(this.checkedMems).length == this.visibleMembers.length) {
	// 		this.isSelectedAllMember = true;
	// 		this.allMemberChkbox.html.find(".img").addClass("chk");
	// 	} else {
	// 		this.isSelectedAllMember = false;
	// 		this.allMemberChkbox.html.find(".img").removeClass("chk");
	// 	}

	// 	if (Object.keys(this.checkedMems).length == this.visibleMembers.length) {
	// 		this.selectListArea.append("<span>" + $.i18n.getString("COMMON_ALL_MEMBERS") + "</span>");
	// 	} else {
	// 		// 搜尋列加上選擇對象的Tag
	// 		$.each(allCheckRowData, function (key, rowName) {
	// 			this.selectListArea.append("<span>" + rowName.replaceOriEmojiCode() + "</span>");
	// 		}.bind(this));

	// 		if(Object.keys(this.checkedMems).length > 0) this.makeMemLabels();
	// 	}
	
	// 	if (this.mainPage.find(".obj-content").hasClass("on-search")) {
	// 		this.searchInput.val("").trigger("input").focus();
	// 	}

	// 	this.setHeight();
	// },

	makeMemLabels : function () {
		var curLabelNum = this.selectListArea.find("span.mem").length;
		if (curLabelNum + 1000 > Object.keys(this.checkedMems).length) {
			var loadLabelList = Object.keys(this.checkedMems).slice(curLabelNum); 
		} else {
			var loadLabelList = Object.keys(this.checkedMems).slice(curLabelNum, curLabelNum + 1000);
		}

		// 搜尋列加上選擇對象的Tag
		$.each(loadLabelList, function (index, memId) {
			this.selectListArea.append("<span class='mem'>" + this.checkedMems[memId].replaceOriEmojiCode() + "</span>");
		}.bind(this));
	},

	loadMoreMemLabels : function (e) {
		var container = $(e.target);
		
		if (container.scrollTop() + container.height() >= container[0].scrollHeight) {
		    var curLabelNum = this.selectListArea.find("span.mem").length;
		    if (curLabelNum < Object.keys(this.checkedMems).length && curLabelNum >= 1000) {
		    	setTimeout(function() {
		    		this.makeMemLabels();	
		    	}.bind(this));
		    }
		}
	}

}

function ObjectCell () {};

ObjectCell.prototype = {
	click : function () {
		this.html.find(".img").toggleClass("chk");
		this.isChecked = !this.isChecked;
	},

	checked : function (isCheckedAll) {
		if (isCheckedAll) {
			this.html.find(".img").addClass("chk");
			this.isChecked = true;
		} else {
			if (this.enable) {
				this.html.find(".img").removeClass("chk");
				this.isChecked = false;
			} 
		}
	},

	bindEvent : function (doEvenFun) {
		var objCell = this;
		var rowType = objCell.type;
		var bindElement;

		if (rowType == "SelectAllTitle") {
			bindElement = objCell.html.find("span");
		} else if (rowType == "ParentBranch" || rowType == "Favorite") {
			bindElement = objCell.html.find(".subgroup-parent");
		} else {
			bindElement = objCell.html;
		}

		if (objCell.enable) {
			bindElement.off("click").on("click", function (e) {
				e.stopPropagation();

				doEvenFun(objCell);
				if (!objCell.isDefault) {
					$(this).find(".img").toggleClass("chk");
					objCell.isChecked = !objCell.isChecked;
					ObjectDelegateView.updateStatus();
				}

				if (rowType == "SelectAllTitle") {
					bindElement.text(objCell.isChecked ? 
						$.i18n.getString("COMMON_SELECT_NONE") : $.i18n.getString("COMMON_SELECT_ALL"))
				}
			});
		} else {
			bindElement.off("click").on("click", function (e) {
				toastShow($.i18n.getString("ADD_AUDIENCE_CANT_UNCHECK"));
			});
		}
	},

	remove : function () {
		this.html.remove();
	}
}

ObjectCell.factory = function (type, rowData) {
	var constr = type, 
		newRow;

	if (typeof ObjectCell[constr] !== 'function'){
        throw {
            name: 'Error',
            message: constr + ' does not exist'
        };
    }

    ObjectCell[constr].prototype = new ObjectCell(type);
    newRow = new ObjectCell[constr](rowData);

    newRow.type = type;

    return newRow;
}

ObjectCell.Default = function (rowData) {
	this.html = `
		<div class='obj-cell all'>
			<div class='obj-cell-chk'>
				<div class='img " + ${(rowData.isAnyObjChecked) ? "" : "chk"} ></div>
			</div>
			<div class='obj-cell-user-pic'>
				<img src='images/common/others/select_empty_all_photo.png' />
			</div>
			<div class='obj-cell-subgroup-data'>
				<div class='obj-user-name'>${$.i18n.getString("COMMON_SELECT_ALL")}</div>
			</div>
		</div>
	`	
	// this.html = $("<div class='obj-cell all'><div class='obj-cell-chk'><div class='img " + ((rowData.isAnyObjChecked) ? "" : "chk") 
	// 	+ "'></div></div><div class='obj-cell-user-pic'><img src='images/common/others/select_empty_all_photo.png' " 
	// 	+ "/></div><div class='obj-cell-subgroup-data'><div class='obj-user-name'>" 
 //        + $.i18n.getString("COMMON_SELECT_ALL") + '</div></div>');
	this.isSelectAll = false;
	this.isChecked = true;
	this.isDefault = true;

	this.enable = true;
}

ObjectCell.Favorite = function () {
	this.html = $("<div class='subgroup-row fav-parent'><div class='subgroup-parent'>"
		+ "<div class='obj-cell fav'><div class='obj-cell-chk'><div class='img'></div></div>" 
		+ "<div class='obj-cell-user-pic'><img src='images/common/others/empty_img_favor.png' />"
		+ "</div><div class='obj-cell-subgroup-data'><div class='obj-user-name'>" + $.i18n.getString("COMMON_FAVORIATE") 
		+ "</div></div></div><div class='obj-cell-arrow'></div></div><div class='folder'></div></div>");

	this.isSelectAll = false;
	this.isFavorite = true;
	this.html.find(".obj-cell-arrow").off("click").click( function(e) {
		e.preventDefault();
		e.stopPropagation();
        $(this).toggleClass("open");
        $(this).parent().next().toggle();
    });
	this.isChecked = false;
	this.enable = true;
}

ObjectCell.ParentBranch = function (rowData) {
	var self = this;
	var thisBranch = rowData.thisBranch;
	var allBranchData = rowData.bl;
	self.name = thisBranch.bn.replaceOriEmojiCode();
	self.id = thisBranch.bi;
	self.html = $("<div class='subgroup-row'><div class='subgroup-parent'>"
		+ "<div class='obj-cell subgroup branch' data-bl='" + thisBranch.bi + "'>"
		+ "<div class='obj-cell-chk'><div class='img " + ((thisBranch.chk) ? "chk" : "") + "'></div></div>" 
		+ "<div class='obj-cell-user-pic'><img src='images/common/others/select_empty_all_photo.png' />"
		+ "</div><div class='obj-cell-subgroup-data'><div class='obj-user-name'>" + this.name 
		+ "</div></div></div><div class='obj-cell-arrow'></div></div><div class='folder'></div></div>");
	self.isSelectAll = false;
	self.childBranch = [];
	self.enable = thisBranch.enable;

	self.html.find(".obj-cell-arrow").off("click").click(function(e) {
		e.stopPropagation();
		
        var dom = $(this).parent().next();
        $(this).toggleClass("open");
        if ($(this).hasClass("open")) dom.slideDown();
        else dom.slideUp();
    });

    if (thisBranch.cl.length > 0) {
    	this.html.find(".obj-cell-arrow").css("display", "inline-block");
        recursive(thisBranch.cl);
	}

	self.isChecked = thisBranch.chk;

	function recursive(cldArr) {
		cldArr.forEach(function(bi) {
			if(allBranchData[bi].cl.length > 0) recursive(allBranchData[bi].cl);
			setChildBranch(bi);
		})
	}

	function setChildBranch(branchID) {
        var branchData = allBranchData[branchID];
		var childBranchRow = ObjectCell.factory("ChildBranch", {thisBranch: branchData, isSubRow : true});
		childBranchRow.parent = self;
		self.childBranch.push(childBranchRow);
		ObjectDelegateView.branchRows.push(childBranchRow);
		childBranchRow.bindEvent(ObjectDelegateView.checkThisBranch.bind(ObjectDelegateView));
		self.html.find(".folder").append(childBranchRow.html);
    }
}

// 全選欄位
ObjectCell.SelectAllTitle = function (rowData) {
	var titleText = "";

	switch (rowData.type) {
		case "group" :
			titleText = $.i18n.getString("COMPOSE_SUBGROUP");
			break;
		case "mem" :
			titleText = $.i18n.getString("COMMON_MEMBER");
			break;
	}

	this.isSelectAll = true;

	this.html = $(`<div class='obj-select-all ${rowData.type}' >
		<label>${titleText}</label>
		<span>${$.i18n.getString("COMMON_SELECT_ALL")}</span>
	</div>`);

	this.isChecked = false;

	this.enable = true;
}

ObjectCell.FavBranch = function (rowData) {
	var favBranchData = rowData.thisFavBranchObj;
	this.isSelectAll = false;
	this.id = favBranchData.fi;
	this.name = favBranchData.fn.replaceOriEmojiCode();
	this.html = $('<div class="obj-cell ' + ((rowData.isSubRow) ? "_2" : "") + ' fav-branch" data-gu="' + 
		   favBranchData.fi + '"><div class="obj-cell-chk"><div class="img ' + ((favBranchData.chk) ? "chk" : "") +
		   '"></div></div><div class="obj-cell-user-pic"><img src="images/common/others/select_empty_all_photo.png" /></div>' +
           '<div class="obj-cell-subgroup-data">' + 
               	'<div class="obj-user-name">' + favBranchData.fn.replaceOriEmojiCode() + '</div>' +
                '<div class="obj-user-title"></div></div>' +
        '</div>');

	this.isChecked = favBranchData.chk;
	this.enable = true;
}

ObjectCell.ChildBranch = function (rowData) {
	var thisBranch = rowData.thisBranch;
	this.id = thisBranch.bi;
	this.name = thisBranch.bn.replaceOriEmojiCode();
	this.html = $('<div class="obj-cell ' + ((rowData.isSubRow) ? "_2" : "") + ' branch" data-bl="' + 
		   thisBranch.bi + '"><div class="obj-cell-chk"><div class="img ' + ((thisBranch.chk) ? "chk" : "") + '"></div></div>' +
           '<div class="obj-cell-user-pic"><img src="images/common/others/select_empty_all_photo.png" ></div>' +
           '<div class="obj-cell-subgroup-data">' + 
               	'<div class="obj-user-name">' + thisBranch.bn.replaceOriEmojiCode() + '</div>' +
                '<div class="obj-user-title"></div></div>' +
        '</div>');
	this.isSelectAll = false;
	this.isChecked = thisBranch.chk;
	this.enable = thisBranch.enable;
}

ObjectCell.Member = function (rowData) {
	var thisMember = rowData.thisMember;
	var memberImg = (thisMember.aut) ? thisMember.aut : "images/common/others/empty_img_personal_xl.png";
	var addChkWord = (thisMember.chk || rowData.isSelectedAll) ? "chk" : "";
	// var isDisableOnAlreadyChecked = ObjectDelegateView.isDisableOnAlreadyChecked
	this.id = thisMember.gu;
	this.name = thisMember.nk.replaceOriEmojiCode();
	this.html = $('<div class="obj-cell ' + ((rowData.isSubRow) ? "_2" : "") + ' mem" data-gu="' + thisMember.gu+'">' +
           '<div class="obj-cell-chk"><div class="img ' + addChkWord + '"></div></div>' +
           '<div class="obj-cell-user-pic namecard" data-gu="' + thisMember.gu + '">' + 
           	    '<img src="' + memberImg + '" /></div>' +
           '<div class="obj-cell-user-data ' + ((thisMember.bn && thisMember.bn.length > 0) ? "extra" : "") +'">' + 
                '<div class="obj-user-name">' + this.name + '</div>' +
                '<div class="obj-user-title">' + ((thisMember.bn) ? thisMember.bn : "") + '</div>' +
        '</div>');
	this.isSubRow = rowData.isSubRow;
	this.isSelectAll = false;
	this.isChecked = (thisMember.chk || rowData.isSelectedAll);
	this.enable = thisMember.enable;
}

var objectCellRow = Object.create(HTMLElement.prototype);

objectCellRow.attachedCallback  = function () {
	// this.isChecked = false;
    this.innerHTML = `
		<div class='obj-cell-chk'>
			<div class='img ${this.isChecked ? "chk" : ""}'></div>
		</div>
		<div class="obj-cell-user-pic namecard" data-gu="">
			<img src="${this.imageUrl || 'images/common/others/empty_img_personal_xl.png'}" />
		</div>
		<div class='obj-cell-user-data'>
			<div class="obj-user-name">${this.name}</div>
			<div class="obj-user-title">
				${this.info ? this.info : ""}
			</div>
		</div>
		${this.expand ? "<div class='obj-cell-arrow'></div>" : ""}
    `;

    if (this.enable) {
    	this.querySelector('div.obj-cell-chk>div.img').addEventListener('click', this.click.bind(this));
    }
}

objectCellRow.click = function (e) {
	e.stopPropagation();

	var checkBox = e.target;
	this.isChecked = !this.isChecked;


	if (this.doEventFun) {
		this.doEventFun()
	}

	checkBox.classList.toggle('chk');
}

objectCellRow.check = function (isChecked) {
	var checkBox = this.querySelector('div.obj-cell-chk>div.img');

	if (isChecked) {
		checkBox.classList.add('chk');
	} else {
		checkBox.classList.remove('chk');
	}

	this.isChecked = isChecked;
}

document.registerElement('object-cell-row', {
    prototype: objectCellRow
});