function MemberSelect (option) {

	var self = this;
	var group = QmiGlobal.groups[gi],
        memberData = group.guAll,
        guList = Object.keys(memberData) || [];
        branchData = group.bl;

    self.branchMap = {
    	root: {
    		gul: [],
	        cl: [],
	        cnt: 0,
	        lv: 0
    	}
    };

    self.checkedMembers = {};
    self.checkedBranches = {};
    self.currentRows = [];

    self.view = option.view
    self.container = option.container;
    self.container.id = "objectDelegate"

    self.defaultSelect = document.createElement('div');
    self.branchMenu = document.createElement('div');
    self.selectArea = document.createElement('div');

    self.changeBranchView = function (branchId) {
    	var isBranchChecked = self.checkedBranches.hasOwnProperty(branchId);
    	self.currentRows = [];
		self.selectArea.scrollTop = 0;

		while(self.selectArea.firstChild) {
			self.selectArea.removeChild(self.selectArea.firstChild);
		}

		self.branchMap[branchId].gul.forEach(function (gu) {
			var memberObj = memberData[gu];
			var isChecked = false;
			if (isBranchChecked) {
				isChecked = true;
			} else {
			 	isChecked = self.checkedMembers.hasOwnProperty(gu);
			}
			console.log("LLFFFSS")
			self.addRowElement("Member", memberObj, isChecked);
		});

		self.branchMap[branchId].cl.forEach(function (branchKey) {
			var isChecked = false;
			if (isBranchChecked) {
				isChecked = true;
			} else {
				isChecked = self.checkedBranches.hasOwnProperty(branchKey);
			}

	    	self.addRowElement("Branch", self.branchMap[branchKey], isChecked);
		});

		if (branchId != 'root') {
			self.setBreadcrumb(branchId);
			self.defaultSelect.style.display = 'none';
			// self.searchArea.style.display = 'none';
			self.branchMenu.style.display = 'block';

		} else {
			self.defaultSelect.style.display = 'block';
			// self.searchArea.style.display = 'block';
			self.branchMenu.style.display = 'none';
		}

		self.updateBranchMenu(branchId);
	},

    self.addRowElement = function (type, rowData, isChecked) {
    	var self = this;
		var rowElement = document.createElement("object-cell-row");
		rowElement.type = type;
		rowElement.enable = true;
		rowElement.isChecked = isChecked;

		switch (type) {
			case "Public":
				rowElement.name = $.i18n.getString("COMMON_SELECT_ALL");
				rowElement.imageUrl = 'images/post_audience/Member-Branch.png';
				rowElement.enable = false;
				self.defaultRow = rowElement;
				break;

			case "Favorite":
				rowElement.name = $.i18n.getString("COMMON_FAVORIATE");
				rowElement.imageUrl = 'images/post_audience/Member-Favorite.png';
				// rowElement.enable = false;
				self.defaultRow = rowElement;
				break;

			case "Member":
				rowElement.number = rowData.gu;
				rowElement.name = rowData.nk.replaceOriEmojiCode();
				rowElement.imageUrl = rowData.aut ? rowData.aut : "images/common/others/empty_img_personal_xl.png";
				rowElement.doEventFun = self.checkThisRow.bind(self, rowElement);
				console.log('QQWWW')
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

		if (type == 'Public' || type == 'Favorite') {
			self.defaultSelect.appendChild(rowElement);
		} else {
			self.selectArea.appendChild(rowElement);
		}
    }

    self.updateBranchMenu = function (branchId) {
		var branchObj = this.branchMap[branchId];
		var dropBtn = this.branchMenu.querySelector("div.drop-button")

		// 更新dropdown menu 按鈕文字
		dropBtn.querySelector("div.branch>div").textContent = branchObj.bn;
		dropBtn.querySelector("div.branch>p").textContent = $.i18n.getString("COMPOSE_N_MEMBERS", branchObj.cnt) + 
					" " + $.i18n.getString("COMPOSE_N_SUBGROUP", branchObj.cl.length);
	},

	self.setBranchMenu = function () {
		var branchObj = self.branchMap['root'];
		var branchSelect = self.branchMenu.querySelector("div.dropdown-menu>ul");

		(function recursiveBranch() {
			branchObj.cl.forEach(function(branchId) {
				var branchOption = document.createElement('li');
				var branchMeta = document.createElement('div');
				var branchName = document.createElement('div');
				var branchDetail = document.createElement('p');
				var branchLevel = document.createElement('div');
				branchObj = self.branchMap[branchId];
				branchName.textContent = branchObj.bn;
				branchDetail.textContent = $.i18n.getString("COMPOSE_N_MEMBERS", branchObj.cnt) + 
					" " + $.i18n.getString("COMPOSE_N_SUBGROUP", branchObj.cl.length);
				branchLevel.textContent = branchObj.lv;

				branchMeta.className = 'branch';
				branchMeta.appendChild(branchName);
				branchMeta.appendChild(branchDetail);
				branchOption.appendChild(branchMeta);
				branchOption.appendChild(branchLevel);

				branchSelect.appendChild(branchOption);

				branchOption.onclick = function () {
					console.log('bye');
				}

				branchOption.style.paddingLeft = (15 + (branchObj.lv - 1) * 20) + "px"; 

				if (branchObj.cl && branchObj.cl.length > 0) {
					recursiveBranch();
				}
			});
		})();
	},

    self.setBreadcrumb = function (branchId) {
    	var self = this;
    	var breadcrumb = self.branchMenu.querySelector("ul.breadcrumb");

		while(breadcrumb.firstChild) {
			breadcrumb.removeChild(breadcrumb.firstChild);
		}

		var branchObj = self.branchMap[branchId];
		breadcrumb.appendChild(createBranchItem(branchObj, false));

		while (branchObj.pi) {
			branchObj = self.branchMap[branchObj.pi];
			breadcrumb.appendChild(createBranchItem(branchObj, true));
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
    }

    self.setAvailableList = function (isHiddenMe) {
		guList.forEach(function (gu) {
	        var userObj = memberData[gu];
	        var branchListStr = userObj.bl || "";
	        
	        if (isValidMember(userObj)) {
	        	if (branchListStr.length > 0) {
		            var branchList = branchListStr.split(",");

		            branchList.forEach(function (fullBranchName) {
		                var branchID = fullBranchName.split(".").pop();

		                if (!self.branchMap[branchID].hasOwnProperty('gul')) {
		                    self.branchMap[branchID].gul = [];
		                }

		                self.branchMap[branchID].gul.push(gu);
		            });

		        } else {
		            self.branchMap['root'].gul.push(gu);
		            self.branchMap['root'].cnt = self.branchMap['root'].cnt + 1;
		        }
	        }

	    });

	    console.log(self.branchMap)

	    if (self.branchMap['root'].cl.length > 0 && self.branchMap['root'].gul.length > 0) {

	    	self.selectArea.className = "obj-cell-container";
	    	self.container.appendChild(self.selectArea);

	    	self.changeBranchView('root');
	    }

	    function isValidMember (memberObj) {
	    	var isOfficialGroupAdmin = group.ntp == 2 && group.ad == 1;

	    	return !(isHiddenMe && memberObj.gu == group.gu) && (memberObj.st == 1)
	    		&& !(isOfficialGroupAdmin && memberData[group.gu].abl == "" && memberObj.ad != 1);
	    }
	}

	self.updateStatus = function () {
		var selectedMembers = Object.keys(self.checkedMembers).map(function (gu) {
			return {
				avatar: memberData[gu].aut || "images/common/others/empty_img_personal_xl.png",
				name: memberData[gu].nk
			}
		})

		Object.keys(self.checkedBranches).forEach(function(branchId) {
			var branchObj = self.branchMap[branchId];
			branchObj.gul.forEach(function (gu) {
				selectedMembers.push({
					avatar: memberData[gu].aut || "images/common/others/empty_img_personal_xl.png",
					name: memberData[gu].nk
				});
			});
		});

		console.log(selectedMembers);
		this.renderSelectionPreview(selectedMembers);
	}

    var setBranchTreeData = (function setBranchTreeData () {
    	Object.keys(branchData).forEach(function (id) {
	        var branchObj = branchData[id];
	        self.branchMap[id] = Object.assign({}, branchObj);
	        
	        if (branchObj.lv == 1) {
	            self.branchMap['root'].cl.push(id);
	        };

	        self.branchMap[id].bi = id;
	        self.branchMap[id].gul = [];
	    });

    })();
}

MemberSelect.prototype.renderTo = function (container) {

}

MemberSelect.prototype.setBranchBlock = function () {
	if (this.branchMap['root'].cl.length > 0) {
		var dropdownMenu = document.createElement('div');
		var dropdownButton = document.createElement('div');
		var currentBranch = document.createElement('div');
		var returnButton = document.createElement('img');
		var dropdownList = document.createElement('ul');
		var breadcrumb = document.createElement('ul');

 		currentBranch.className = 'branch';
		currentBranch.appendChild(document.createElement('div'));
		currentBranch.appendChild(document.createElement('p'));

		returnButton.src = "images/post_audience/Close.png"
		returnButton.onclick = this.changeBranchView.bind(this, 'root');

		dropdownButton.className = 'drop-button';
		dropdownButton.appendChild(currentBranch);
		dropdownButton.onclick = function () {
			dropdownList.classList.toggle('open');
		};

		dropdownMenu.className = 'dropdown-menu';
		dropdownMenu.appendChild(dropdownButton);
		dropdownMenu.appendChild(returnButton);
		dropdownMenu.appendChild(dropdownList);

		breadcrumb.className = 'breadcrumb';

		this.branchMenu.className = 'branch-list';
		this.branchMenu.appendChild(dropdownMenu);
		this.branchMenu.appendChild(breadcrumb);

		this.container.appendChild(this.branchMenu);
	}
}

MemberSelect.prototype.createDefaultSelect = function () {
	this.defaultSelect.className = 'basic-select';
    this.container.appendChild(this.defaultSelect);
}

MemberSelect.prototype.addPublicOption = function () {
	this.addRowElement('Public');
}

MemberSelect.prototype.addFavortiteOption = function () {
	this.addRowElement('Favorite');
}

MemberSelect.prototype.addSelectAllTitle = function (isEnableCheckbox) {
	var element = document.createElement("div");
	var label = document.createElement("label");
	var span = document.createElement("span");

	element.className = "obj-select-all";
	label.textContent = $.i18n.getString("COMMON_MEMBER");
	span.textContent = $.i18n.getString("COMMON_SELECT_ALL");

	span.onclick = this.selectAll;

	element.appendChild(label);
	element.appendChild(span);

	this.container.appendChild(element);
}

MemberSelect.prototype.done = function () {

}

MemberSelect.prototype.previewSelectedMember = function (render) {
	this.renderSelectionPreview = render;
}

MemberSelect.prototype.checkThisRow = function (thisRow) {
	var checkedObj = {};
	var rowType = thisRow.type;

	if (rowType == 'Member') checkedObj = this.checkedMembers;
	else if (rowType == 'Branch') checkedObj = this.checkedBranches;

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

	console.log(this.checkedMembers);
	console.log(this.checkedBranches);
}



var objectCellRow = Object.create(HTMLElement.prototype);

objectCellRow.attachedCallback  = function () {
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