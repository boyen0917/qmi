ObjectDelegateView = {
	mainPage : "",
	mainContainer : "",
	searchElement : "",
	selectListArea : "",
	allMemberChkbox : {},
	allBranchChxbox : {},
	selectMembers : {},
	selectedBranchs : {},
	selectedFavorites : {},
	selectNum : 0,
	favParentRow : {},
	memberRows : [],
	branchRows : [],
	
	isSelectedAllBranch : false,
	isSelectedAllMember : false,

	init : function(option) {
		this.mainPage = $("#page-object");
		this.mainContainer = this.mainPage.find(".obj-cell-area");
		this.selectNumElement = this.mainPage.find(".header-cp-object span:eq(1)");
		this.searchArea = this.mainPage.find(".obj-selected");
		this.searchInput = this.searchArea.find(".list .search");
		this.selectListArea = this.searchArea.find(".list .text");
		this.clearButton = this.searchArea.find(".clear");
		this.finishButton = this.mainPage.find(".obj-done");
		this.allMemberChkbox = {};
		this.allBranchChxbox = {};
		this.selectMembers = {};
		this.selectedBranchs = {};
		this.favParentRow = {};
		this.memberRows = [];
		this.branchRows = [];
		this.isSelectedAllBranch = false;
		this.isSelectedAllMember = false;
		this.singleCheck = option.singleCheck;
		this.visibleMembers = option.visibleMembers;
		this.searchList = this.visibleMembers;
		this.visibleMemNum = 0;
		this.checkedMems = option.checkedMems || {};
		this.checkedBranches = option.checkedBranches;
		this.selectNumElement.html(Object.keys(this.checkedMems).length);
		this.mainPage.find(".obj-content").show().end()
					 .find(".obj-coach-noMember").hide().end()
					 .find(".obj-done").show();
		this.mainContainer.html("");
		this.bindEvent();
		return this;
	},

	setHeight : function() {
		var padding_top = this.searchArea.outerHeight();
		this.mainContainer.css("padding-top", padding_top)
    					  .css("height", $(window).height() - 57 - padding_top);

    	return this;
	},

	bindEvent : function () {
		this.searchInput.off("input").on("input", this.searchMatchRow.bind(this));
	},

	showNoMember : function() {
		this.mainPage.find(".obj-content").hide().end()
        			 .find(".obj-coach-noMember").show().end()
        			 .find(".obj-done").hide();
	}, 

	addRowElement : function (type, rowData = {}) {
		rowData.isSelectedAll = this.isSelectedAllMember;
		var rowElement = ObjectCell.factory(type, rowData);

		switch (type) {
			case "Favorite" :
				this.favParentRow = rowElement;
				// rowElement.bindEvent(this.toggleFavSubRows.bind(this));
				break;
			case "Member" :
				rowElement.bindEvent(this.checkThisMember.bind(this));
				this.memberRows.push(rowElement);
				break;
			case "ParentBranch" :
				this.branchRows.push(rowElement);
				break;
			case "Branch" :
				this.branchRows.push(rowElement);
				break;
			case "SelectAllTitle" :
				if (rowData.type == "group") {
					rowElement.bindEvent(this.selectAllBranch.bind(this));
					this.allBranchChxbox = rowElement;
				} else {
					rowElement.bindEvent(this.selectAllMember.bind(this));
					this.allMemberChkbox = rowElement;
				}
		}
		// rowElement.bindEvent(this.doSomething.bind(this));
		this.mainContainer.append(rowElement.html);
		if (type == "ParentBranch") this.mainContainer.append("<hr color='#F3F3F3'>");
	},

	makeMemberList : function () {
		var groupAllMembers = QmiGlobal.groups[gi].guAll;
		var loadMemberList = this.visibleMembers.slice(this.visibleMemNum, this.visibleMemNum + 500);
		if (this.visibleMemNum + 500 > this.visibleMembers.length - 1) {
            loadMemberList = this.visibleMembers.slice(this.visibleMemNum);
            this.visibleMemNum = this.visibleMembers.length;
        }
        $.each(loadMemberList, function(i, gu) {
            this.addRowElement("Member", {thisMember : groupAllMembers[gu], isSubRow : false});
        }.bind(this));

        this.visibleMemNum += 500;
	},

	addFavoriteSubRow : function (type, rowData = {}) {
		var rowElement = ObjectCell.factory(type, rowData);
		this.favParentRow.html.find(".obj-cell-arrow").css("display", "inline-block").end()
							  .find(".folder").append(rowElement.html);
	},

	selectAllBranch : function (type, rowData = {}) {
		this.isSelectedAllBranch = !this.isSelectedAllBranch;

		this.branchRows.forEach(function(branchRow) {
			branchRow.checked(this.isSelectedAllBranch);
		}.bind(this));
	},

	selectAllMember : function () {
		this.isSelectedAllMember = !this.isSelectedAllMember;
		// this.checkedMems = this.isSelectedAllMember ?  : {};
		// this.selectNumber = this.isSelectedAllMember ? this.visibleMemNum : 0;

		this.memberRows.forEach(function(memberRow) {
			memberRow.checked(this.isSelectedAllMember);
		}.bind(this));
	},

	checkThisMember : function (thisMemberRow) {
		// console.log(this.checkedMems);
		if (this.singleCheck) {
			this.checkedMems = {};
			this.checkedMems[thisMemberRow.groupUserId] = thisMemberRow.name;
			this.memberRows.forEach(function(memberRow) {
				memberRow.checked(false);
			}.bind(this));
		} else {
			if (thisMemberRow.isChecked) delete this.checkedMems[thisMemberRow.groupUserId];
			else this.checkedMems[thisMemberRow.groupUserId] = thisMemberRow.name;
		}
	},

	searchMatchRow : function (e) {
		var target = $(e.target);
		var searchText = target.html();

		if (searchText.length > 0) {
			this.mainContainer.find(".obj-cell-arrow").addClass("open").end()
							  .find(".folder").show().end()
							  .find(".obj-content").addClass("on-search").end()
							  .find("hr").hide().end()
							  .find(".obj-cell-subTitle-chk").hide();

			this.memberRows.forEach(function(memberRow) {
				// memberRow.remove();
			}.bind(this));

		} else {
			this.mainContainer.find(".obj-cell-arrow").removeClass("open").end()
							  .find(".folder").hide().end()
							  .find(".obj-content").removeClass("on-search").end()
							  .find("hr").show().end()
							  .find(".obj-cell-subTitle-chk").show();
		}
	},

	updateStatus : function () {
		this.selectNumElement.html(Object.keys(this.checkedMems).length);
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
			this.html.find(".img").removeClass("chk");
			this.isChecked = false;
		}
	},

	bindEvent : function (doEvenFun) {
		var objCell = this;
		objCell.html.off("click").on("click", function (){
			doEvenFun(objCell);
			$(this).find(".img").toggleClass("chk");
			objCell.isChecked = !objCell.isChecked;
			ObjectDelegateView.updateStatus();
		});
	},

	remove : function () {
		console.log(this);
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

    return newRow;
}

ObjectCell.ClearAll = function () {
	this.html = $("<div class='obj-cell all'><div class='obj-cell-chk'><div class='img chk'></div></div>" 
		+ '<div class="obj-cell-user-pic"><img src="images/common/others/select_empty_all_photo.png" ' 
		+ 'style="width:60px"/></div><div class="obj-cell-subgroup-data"><div class="obj-user-name">' 
        + $.i18n.getString("COMMON_SELECT_ALL") + '</div></div>');

	this.isChecked = true;
}

ObjectCell.Favorite = function () {
	this.html = $("<div class='subgroup-row fav-parent'><div class='subgroup-parent'>"
		+ "<div class='obj-cell fav'><div class='obj-cell-chk'><div class='img'></div></div>" 
		+ "<div class='obj-cell-user-pic'><img src='images/common/others/empty_img_favor.png' style='width:60px'/>"
		+ "</div><div class='obj-cell-subgroup-data'><div class='obj-user-name'>" + $.i18n.getString("COMMON_FAVORIATE") 
		+ "</div></div></div><div class='obj-cell-arrow'></div></div><div class='folder'></div></div>");

	this.html.find(".obj-cell-arrow").off("click").click( function(e){
        $(this).toggleClass("open");
        $(this).parent().next().toggle();
    });
	this.isChecked = false;
}

ObjectCell.ParentBranch = function (rowData) {
	var thisBranch = rowData.thisBranch;
	var allBranchData = rowData.bl;
	this.name = thisBranch.bn.replaceOriEmojiCode();
	this.bi = thisBranch.bi;
	this.html = $("<div class='subgroup-row'><div class='subgroup-parent'>"
		+ "<div class='obj-cell subgroup branch' data-bl='" + thisBranch.bi + "'>"
		+ "<div class='obj-cell-chk'><div class='img'></div></div>" 
		+ "<div class='obj-cell-user-pic'><img src='images/common/others/select_empty_all_photo.png' style='width:60px'/>"
		+ "</div><div class='obj-cell-subgroup-data'><div class='obj-user-name'>" + this.name 
		+ "</div></div></div><div class='obj-cell-arrow'></div></div><div class='folder'></div></div>");

	this.html.find(".obj-cell-arrow").off("click").click(function(e) {
        var dom = $(this).parent().next();
        $(this).toggleClass("open");
        if ($(this).hasClass("open")) dom.slideDown();
        else dom.slideUp();
    });

    if (thisBranch.cl.length > 0) {
    	this.html.find(".obj-cell-arrow").css("display", "inline-block");
    	thisBranch.cl.forEach(function (branchID) {
            var branchData = allBranchData[branchID];
            branchData.bi = branchID;
    		var childBranch = ObjectCell.factory("ChildBranch", {thisBranch: branchData, isSubRow : true});
    		this.html.find(".folder").append(childBranch.html);
            // objectDelegateView.addSubBranchRow("ChildBranch", {thisBranch: branchData, parentID: this.bl});
        }.bind(this));
	}
}

// 全選欄位
ObjectCell.SelectAllTitle = function (rowData) {
	var titleText = "";
	var objCellHtml = (rowData.isDisplayedChkbox) ? ("<div class='obj-cell-subTitle-chk'><div class='img'></div>"
		+ "<div class='select'>" + $.i18n.getString("COMMON_SELECT_ALL") + "</div></div>") : ""

	switch (rowData.type) {
		case "group" :
			titleText = $.i18n.getString("COMPOSE_SUBGROUP");
			break;
		case "mem" :
			titleText = $.i18n.getString("COMMON_MEMBER");
			break;
	}

	this.html = $("<div class='obj-cell-subTitle " + rowData.type + "' data-chk='false'>"
		+  objCellHtml + "<div class='text'>" + titleText + "</div></div>");

	this.isChecked = false;
}

ObjectCell.FavBranch = function (rowData) {
	var favBranchData = rowData.thisFavBranchObj;
	this.html = $('<div class="obj-cell ' + ((rowData.isSubRow) ? "_2" : "") + ' fav-branch" data-gu="' + 
		   favBranchData.fi + '"><div class="obj-cell-chk"><div class="img"></div></div>' +
           '<div class="obj-cell-user-pic"><img src="images/common/others/select_empty_all_photo.png" style="width:60px"/></div>' +
           '<div class="obj-cell-subgroup-data">' + 
               	'<div class="obj-user-name">' + favBranchData.fn.replaceOriEmojiCode() + '</div>' +
                '<div class="obj-user-title"></div></div>' +
        '</div>');
}

ObjectCell.ChildBranch = function (rowData) {
	var thisBranch = rowData.thisBranch;
	this.bi = thisBranch.bi;
	this.html = $('<div class="obj-cell ' + ((rowData.isSubRow) ? "_2" : "") + ' branch" data-bl="' + 
		   thisBranch.bi + '"><div class="obj-cell-chk"><div class="img"></div></div>' +
           '<div class="obj-cell-user-pic"><img src="images/common/others/select_empty_all_photo.png" style="width:60px"/></div>' +
           '<div class="obj-cell-subgroup-data">' + 
               	'<div class="obj-user-name">' + thisBranch.bn.replaceOriEmojiCode() + '</div>' +
                '<div class="obj-user-title"></div></div>' +
        '</div>');
}

ObjectCell.Member = function (rowData) {
	var thisMember = rowData.thisMember;
	var memberImg = (thisMember.aut) ? thisMember.aut : "images/common/others/empty_img_personal_xl.png";
	var addChkWord = (thisMember.chk || rowData.isSelectedAll) ? "chk" : "";
	this.groupUserId = thisMember.gu;
	this.name = thisMember.nk.replaceOriEmojiCode();
	this.html = $('<div class="obj-cell ' + ((rowData.isSubRow) ? "_2" : "") + ' mem" data-gu="' + thisMember.gu+'">' +
           '<div class="obj-cell-chk"><div class="img ' + addChkWord + '"></div></div>' +
           '<div class="obj-cell-user-pic namecard" data-gu="' + thisMember.gu + '">' + 
           	    '<img src="' + memberImg + '" style="width:60px"/></div>' +
           '<div class="obj-cell-user-data ' + ((thisMember.bn && thisMember.bn.length > 0) ? "extra" : "") +'">' + 
                '<div class="obj-user-name">' + this.name + '</div>' +
                '<div class="obj-user-title">' + ((thisMember.bn) ? thisMember.bn : "") + '</div>' +
        '</div>');

	this.isChecked = false;
}