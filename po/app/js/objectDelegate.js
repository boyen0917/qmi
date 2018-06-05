function ObjectDelegate (option) {

	var self = this;
	var group = QmiGlobal.groups[gi],
        memberData = group.guAll,
        guList = Object.keys(memberData) || [];
        branchData = group.bl;

    var settings = option.settings || {};

    self.isSelectAll = false;
    this.currentBranch = 'root';
    self.branchMap = {
    	root: {
    		gul: [],
    		visibleGul: [],
	        cl: ['all'],
	        cnt: 0,
	        lv: 0
    	},
    	all: {
    		gul: [],
    		visibleGul: [],
    		cl: [],
    		cnt: 0,
    		lv: 1,
    		bi: 'all',
    		bn: $.i18n.getString('COMMON_ALL_MEMBERS')
    	},
    	fav: {
    		gul: [],
    		visibleGul: [],
    		cl: [],
    		cnt: 0,
    		lv: 1,
    		bi: 'fav',
    		bn: $.i18n.getString('COMMON_FAVORIATE')
    	},
    	searchResult: {
    		visibleGul: [],
	        cl: []
    	}
    };

    self.checkedMembers = option.previousSelect.members || {};
    self.checkedBranches = option.previousSelect.branches || {};
    self.checkedFavs = option.previousSelect.favorites || {};

    self.publicRow = {};
    self.favoriteRow = {};
    self.visibleRows = {};

    self.view = option.view
    self.container = option.container;
    self.container.id = "objectDelegate";
    self.searchArea = option.searchArea;

    self.defaultSelect = document.createElement('div');
    self.branchMenu = document.createElement('div');
    self.selectArea = document.createElement('div');

    self.init = function () {
		self.setAvailableList();
    	self.setBranchBlock();
		self.setBranchMenu();

		if (!settings.isHiddenPublic || !settings.isHiddenFav) {
			self.createDefaultSelect();
		}

		if (!settings.isHiddenPublic) {
			this.addRowElement({type: 'Public'});
		}

		if (!settings.isHiddenFav) {
			this.addRowElement({type: 'Favorite', data: self.branchMap['fav']});
		}

		self.addSelectAllTitle();

		if (self.branchMap['root'].cl.length > 0 || self.branchMap['root'].gul.length > 0) {
	    	self.selectArea.className = "obj-cell-container";
	    	self.container.appendChild(self.selectArea);
	    }
    	
		self.selectedMembers = self.getSelectedMembers();
		self.changeBranchView('root');
    }

    function haveChildrenAllChecked(branchObj) {
		return (Object.keys(self.selectedMembers).length == self.branchMap['all'].cnt) 
			|| (branchObj.cnt > 0 && branchObj.gul.every(function (gu) { 
				return self.selectedMembers.hasOwnProperty(gu) 
			}));
	}

    self.changeBranchView = function (branchId) {
    	var branchObj = self.branchMap[branchId];
    	var selectAllBlock = self.container.querySelector("div.obj-select-all");
    	var enterFavoriteView = branchId == 'fav' || group.fbl.hasOwnProperty(branchId); 

    	self.visibleRows = {};
    	self.currentBranch = branchId
		self.selectArea.scrollTop = 0;
		self.isSelectAll = self.branchMap[branchId].visibleGul > 0 || self.branchMap[branchId].cl > 0

		while(self.selectArea.firstChild) {
			self.selectArea.removeChild(self.selectArea.firstChild);
		}

		self.branchMap[branchId].visibleGul.forEach(function (gu) {
			var memberObj = memberData[gu];
			var isChecked = self.selectedMembers.hasOwnProperty(gu);
	  		var isEnable = !self.selectedMembers.hasOwnProperty(gu) || 
	  			Object.getOwnPropertyDescriptor(self.selectedMembers, gu).writable;

			self.addRowElement({
				type: 'Member',
				data: memberObj,
				isChecked: isChecked,
				parent: branchId,
				isEnable: isEnable
			});

			if (!isChecked) self.isSelectAll = false;
		});

		self.branchMap[branchId].cl.forEach(function (branchKey) {
			var isChecked = self.checkedBranches.hasOwnProperty(branchKey) || 
				haveChildrenAllChecked(self.branchMap[branchKey]);

			self.addRowElement({
				type: 'Branch',
				data: self.branchMap[branchKey],
				isChecked: isChecked,
				parent: branchId
			});

			if (!isChecked) self.isSelectAll = false;
		});

		if (branchId == 'root') {
			self.defaultSelect.style.display = 'block';
			self.branchMenu.style.display = 'none';

			if (self.searchArea) {
				self.searchArea.style.display = 'block';
			}

			selectAllBlock.style.display = 'block';

			if (Object.keys(self.favoriteRow).length > 0) {
				var haveFavMembersChecked = ((self.branchMap['fav'].visibleGul.length > 0) && 
					(self.branchMap['fav'].visibleGul.every(function(gu) {
						return self.selectedMembers.hasOwnProperty(gu);
					}))
				);

				var haveFvaBranchesChecked = ((self.branchMap['fav'].cl.length > 0) && 
					(self.branchMap['fav'].cl.every(function(fi) {
						return self.checkedFavs.hasOwnProperty(fi);
					}))
				);

				if (haveFavMembersChecked && haveFvaBranchesChecked) {
					self.favoriteRow.check(true);
				}
			}

			selectAllBlock.firstElementChild.textContent = $.i18n.getString("COMMON_MEMBER");
		} else if (branchId == 'searchResult') {
			self.defaultSelect.style.display = 'none';
			selectAllBlock.style.display = 'none';
		} else {
			self.setBreadcrumb(branchId);
			self.setBranchMenu(enterFavoriteView);
			self.defaultSelect.style.display = 'none';
			self.branchMenu.style.display = 'block';

			if (self.searchArea) {
				self.searchArea.style.display = 'none';
			}

			self.updateBranchMenu(branchId);

			selectAllBlock.firstElementChild.textContent = self.branchMap[branchId].bn;
		}

		selectAllBlock.lastElementChild.textContent = self.isSelectAll ? 
			$.i18n.getString("COMMON_SELECT_NONE") : $.i18n.getString("COMMON_SELECT_ALL");
	},

	self.search = function (text) {
		self.branchMap.searchResult.visibleGul = [];
		self.branchMap.searchResult.cl = [];

		if (text.length > 0) {
			guList.forEach(function (gu) {
		        var userObj = memberData[gu];
		        
		        if (isValidMember(userObj)) {
		        	if (userObj.nk.toLowerCase().indexOf(text) > -1) {
		        		self.branchMap.searchResult.visibleGul.push(gu);
		        	}
		        }
		    });

		   	Object.keys(group.bl).forEach(function(bi) {
		   		var branchObj = group.bl[bi];
	        	if (branchObj.bn.toLowerCase().indexOf(text) > -1) {
	        		self.branchMap.searchResult.cl.push(bi);
	        	}
		   	});

		    self.changeBranchView('searchResult');
		} else {
	    	self.changeBranchView('root');
		}
	}

	self.clearSearchResult = self.search.bind(self, "");
	
	self.selectAll = function (e) {
		var self = this;
		var target = e.target;

		self.isSelectAll = !self.isSelectAll;

		self.branchMap[self.currentBranch].gul.forEach(function (gu) {
			if (self.isSelectAll) {
				self.checkedMembers[gu] = memberData[gu].nk;
				self.selectedMembers[gu] = memberData[gu].nk;
			} else {
				delete self.checkedMembers[gu];
				delete self.selectedMembers[gu];
			}
		})

		// self.branchMap[self.currentBranch].cl.forEach(function (bi) {
		// 	if (self.isSelectAll) {
		// 		self.checkedBranches[bi] = self.branchMap[bi].bn;
		// 		// self.selectedMembers[gu] = memberData[gu].nk;
		// 	} else {
		// 		delete self.checkedBranches[bi];
		// 	}
		// })

		target.textContent = self.isSelectAll ? $.i18n.getString("COMMON_SELECT_NONE") : $.i18n.getString("COMMON_SELECT_ALL");

		self.updateStatus();
		console.log(self.checkedMembers);
		console.log(self.checkedBranches);
		console.log(self.selectedMembers)
	}

	self.cancel = function (memberId) {
		// if (!settings.isDisableOnAlreadyChecked) {
		if (self.checkedMembers.hasOwnProperty(memberId)) {
			delete self.checkedMembers[memberId];
		}

		delete self.selectedMembers[memberId];


		if (self.visibleRows.hasOwnProperty(memberId)) {
			self.visibleRows[memberId].check(false);
		}
		// }
		
		self.updateStatus();
	} 

    self.addRowElement = function (obj) {
    	var self = this;
		var rowElement = document.createElement("object-cell-row");
		rowElement.type = obj.type;
		rowElement.enable = true;
		rowElement.isChecked = obj.isChecked;

		switch (obj.type) {
			case "Public":
				rowElement.name = $.i18n.getString("COMMON_SELECT_ALL");
				rowElement.imageUrl = 'images/post_audience/Member-Branch.png';
				self.publicRow = rowElement
				break;

			case "Favorite":
				rowElement.number = 'fav';
				rowElement.name = $.i18n.getString("COMMON_FAVORIATE");
				rowElement.imageUrl = 'images/post_audience/Member-Favorite.png';
				rowElement.info = obj.data.cl.length > 0 ? ($.i18n.getString("COMPOSE_N_MEMBERS", obj.data.visibleGul.length) + 
					" " + $.i18n.getString("COMPOSE_N_SUBGROUP", obj.data.cl.length)) : ($.i18n.getString("COMPOSE_N_MEMBERS", obj.data.visibleGul.length));
				rowElement.doEventFun = self.checkThisRow.bind(self, rowElement);

				if (obj.data.gul.length > 0) {
					rowElement.onclick = function (e) {
						self.changeBranchView('fav');
					}
				} 
				
				self.favoriteRow = rowElement;
				break;

			case "Member":
				rowElement.number = obj.data.gu;
				rowElement.name = obj.data.nk.replaceOriEmojiCode();
				rowElement.imageUrl = obj.data.aut ? obj.data.aut : "images/common/others/empty_img_personal_xl.png";
				rowElement.doEventFun = self.checkThisRow.bind(self, rowElement);
				// console.log(settings.isDisableOnAlreadyChecked)
				rowElement.enable = obj.isEnable;
				// rowElement.enable = !settings.isDisableOnAlreadyChecked || 
	   //       		(settings.isDisableOnAlreadyChecked && !self.checkedOriMembers.hasOwnProperty(obj.data.gu));
				// rowElement.parent = obj.parent;
				self.visibleRows[obj.data.gu] = rowElement;
				break;
			case "Branch":
				rowElement.number = obj.data.bi;
				rowElement.name = obj.data.bn;
				rowElement.imageUrl = 'images/common/others/select_empty_all_photo.png';
				rowElement.expand = true;
				rowElement.info = $.i18n.getString("COMPOSE_N_MEMBERS", obj.data.cnt) + 
					" " + $.i18n.getString("COMPOSE_N_SUBGROUP", obj.data.cl.length);

				rowElement.doEventFun = self.checkThisRow.bind(self, rowElement);
				// rowElement.parent = obj.parent;
				rowElement.onclick = function (e) {
					self.changeBranchView(obj.data.bi);
				}

				self.visibleRows[obj.data.bi] = rowElement;

				break;
		}

		if (obj.type == 'Public' || obj.type == 'Favorite') {
			self.defaultSelect.appendChild(rowElement);

			if (obj.type == 'Favorite' && obj.data.gul.length == 0) {
				rowElement.hideCheckbox();
			}
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

	self.setBranchMenu = function (isFavBranch) {
		var branchObj = isFavBranch ? self.branchMap['fav'] : self.branchMap['root'];
		var branchSelect = self.branchMenu.querySelector("div.dropdown-menu>ul");

		while(branchSelect.firstChild) {
			branchSelect.removeChild(branchSelect.firstChild);
		}

		if (isFavBranch) {
			makeBranchItem('fav');
		}

		(function recursiveBranch() {
			branchObj.cl.forEach(function(branchId) {
				makeBranchItem(branchId);

				if (branchObj.cl && branchObj.cl.length > 0) {
					recursiveBranch();
				}
			});
		})();

		function makeBranchItem (branchId) {
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
			branchOption.onclick = function () {
				// console.log(branchObj.bi);
				self.branchMenu.querySelector('div.drop-button').classList.remove('open');
				self.changeBranchView(branchId);
			}

			branchOption.style.paddingLeft = (15 + (branchObj.lv - 1) * 20) + "px";

			branchSelect.appendChild(branchOption);
		}
	},

    self.setBreadcrumb = function (branchId) {
    	var self = this;
    	var breadcrumb = self.branchMenu.querySelector("div.breadcrumb ul");
    	var leftArrow = null;
    	var rightArrow = null;

		while(breadcrumb.firstChild) {
			breadcrumb.removeChild(breadcrumb.firstChild);
		}

		var branchObj = self.branchMap[branchId];

		// if (overflow) {
		// 	breadcrumb.appendChild(createBranchItem(branchObj, true, 'right'));
		// } else {
			breadcrumb.appendChild(createBranchItem(branchObj, false));
		// }
		
		while (branchObj.pi) {
			branchObj = self.branchMap[branchObj.pi];
			breadcrumb.appendChild(createBranchItem(branchObj, true));

			// if (breadcrumb.offsetWidth > breadcrumb.parentElement.offsetWidth) {
			// 	if (leftArrow == null) {
			// 		leftArrow = createBranchItem(branchObj, true, 'left');
			// 		breadcrumb.insertBefore(leftArrow, breadcrumb.lastChild);
			// 	}
			// }
		}

		// if (leftArrow != null) {
		// 	var distanceX = leftArrow.getClientRects()[0].left - breadcrumb.getClientRects()[0].left;
			
		// 	console.log(distanceX);
		// 	breadcrumb.style.marginLeft = "-" + distanceX + "px";
		// }

		function createBranchItem (branch, withLink, direction) {
			var item = document.createElement("li");

			if (withLink) {
				var link = document.createElement('a');

				if (direction) {
					if (direction == "left") {
						item.className = "slide-left";
					} else {
						item.className = "slide-right";
						link.textContent = branch.bn;
					}
					
					link.onclick = function (e) {
						e.stopPropagation();

						// var currentBranch;
						// var distance = 0;
						// var breadcrumbWidth = 
						
						// if (breadcrumb.querySelector("li.slide-left") != null) {
						// 	currentBranch = breadcrumb.querySelector("li.slide-left").previousElementSibling;
						// 	distance = link.getClientRects()[0].left - breadcrumb.getClientRects()[0].left;
						// 	breadcrumb.removeChild(breadcrumb.querySelector("li.slide-left"));

						// 	while (currentBranch.nextElementSibling) {
								 
						// 	}
						// }

						// if (breadcrumb.querySelector("li.slide-right") != null) {
						// 	breadcrumb.removeChild(breadcrumb.querySelector("li.slide-right"))
						// }

						// while

						// if ()
						


						// console.log(branch.bn);
						// e.stopPropagation();
						// self.setBreadcrumb(branch.bi)
					};

				} else {
					link.textContent = branch.bn;
					link.onclick = function (e) {
						e.stopPropagation();
						self.changeBranchView(branch.bi);
					};
				}
				
				item.appendChild(link);
			} else {
				item.textContent = branch.bn;
			}

			return item;
		} 
    }

    self.setAvailableList = function () {
		guList.forEach(function (gu) {
	        var userObj = memberData[gu];
	        var branchListStr = userObj.bl || "";
	        
	        if (isValidMember(userObj)) {
	        	if (userObj.fav) {
	        		self.branchMap['fav'].visibleGul.push(gu);
	        		self.branchMap['fav'].gul.push(gu);
	        	}

	        	if (userObj.fbl.length > 0) {
	        		userObj.fbl.forEach(function(fi){
	        			self.branchMap[fi].visibleGul.push(gu);
	        			self.branchMap[fi].gul.push(gu);
	        			if (!self.branchMap['fav'].gul.includes(gu)) {
	        				self.branchMap['fav'].gul.push(gu);
	        			}
	        		})
	        	}

	        	if (settings.isHiddenBranch) {
	        		self.branchMap['root'].gul.push(gu);
	        		self.branchMap['root'].cnt = self.branchMap['root'].cnt + 1;
	        	} else {
	        		if (branchListStr.length > 0) {
			            var branchList = branchListStr.split(",");

			            branchList.forEach(function (fullBranchName) {
			                var branchLevels = fullBranchName.split(".");
			                var realBranchId = branchLevels.slice(-1);

			                branchLevels.forEach(function(branchId) {
			                	if (!self.branchMap[branchId].gul.includes(gu)) {
			                		self.branchMap[branchId].gul.push(gu);
			                	}
			                });

			                self.branchMap[realBranchId].visibleGul.push(gu);
			            });
			        }

			        self.branchMap['root'].gul.push(gu);
			        self.branchMap['all'].gul.push(gu);
			        self.branchMap['all'].visibleGul.push(gu);
			        self.branchMap['all'].cnt = self.branchMap['all'].cnt + 1;
	        	}
	        }
	    });
	}

	self.updateStatus = function () {
		var selectedMemberList = Object.keys(self.selectedMembers).map(function (gu) {
			return {
				id: gu,
				avatar: memberData[gu].aut || "images/common/others/empty_img_personal_xl.png",
				name: memberData[gu].nk
			}
		});

		self.isSelectAll = true;

		var selectAllMembers = selectedMemberList.length == self.branchMap['all'].cnt;
		var selectAllBlock = self.container.querySelector("div.obj-select-all");

		for (var id in self.visibleRows) {
			var rowElement = self.visibleRows[id];

			if (self.branchMap.hasOwnProperty(id)) {
				var branchObj = self.branchMap[id];

				if (branchObj.cnt == 0) {
					if (selectAllMembers) {
						rowElement.check(true);
					} else if (self.checkedBranches.hasOwnProperty(id)) {
						rowElement.check(true);
					} else if (selectedMemberList.length == 0 && !self.checkedBranches.hasOwnProperty(id)) {
						rowElement.check(false);
					}
				} else {
					if (haveChildrenAllChecked(branchObj)) {
						rowElement.check(true);
					} else {
						rowElement.check(false);
					}
				}
				// if (haveChildrenAllChecked(branchObj)) {
				// 	if (isSellctAll || branchObj.cnt > 0) {
				// 		rowElement.check(true);
				// 	}
				// } else {
				// 	if (selectedMemberList.length == 0 || branchObj.cnt > 0) {
				// 		rowElement.check(false);
				// 	}
				// 	// if (!(isSellctAll && branchObj.cnt == 0) || branchObj.cnt > 0) {
				// 	// // if (selectedMemberList.length == 0 || branchObj.cnt > 0) {
				// 	// // 	// console.log(rowElement.name);
				// 	// 	rowElement.check(false);

				// 	// 	if (self.checkedBranches.hasOwnProperty(id)) {
				// 	// 		delete self.checkedBranches[id];
				// 	// 	}
				// 	// }
				// }

				// console.log(rowElement.isChecked)

				// rowElement.enable = !haveChildrenAllChecked || self.branchMap[id].cnt > 0;
				// rowElement.enable = !(isSellctAll && branchObj.cnt == 0)
				// console.log(rowElement.enable)
			} else {
				if (self.selectedMembers.hasOwnProperty(id)) {
					rowElement.check(true);
				} else  {
					rowElement.check(false);
				}
			}

			if (!rowElement.isChecked) {
				console.log(rowElement.name)
				self.isSelectAll = false;
			}
		}

		if (typeof self.publicRow.check === 'function') {
			if (selectedMemberList.length > 0) {
				self.publicRow.enable = true;
				self.publicRow.check(false);
			} else {
				self.publicRow.check(true);
				self.publicRow.enable = false;
			}
		}

		selectAllBlock.lastElementChild.textContent = self.isSelectAll ? 
			$.i18n.getString("COMMON_SELECT_NONE") : $.i18n.getString("COMMON_SELECT_ALL");

		if (self.showPreviewArea) {
			self.showPreviewArea(selectedMemberList);
		}
	}

    var setBranchTreeData = (function () {
		Object.keys(group.fbl).forEach(function(fi) {
			self.branchMap['fav'].cl.push(fi);
			self.branchMap[fi] = {
				gul: [],
	    		visibleGul: [],
	    		cl: [],
	    		cnt: group.fbl[fi].cnt,
	    		bi: fi,
	    		bn: group.fbl[fi].fn,
	    		lv: 2
			}
		})

    	if (!settings.isHiddenBranch) {
    		Object.keys(branchData).forEach(function (id) {
		        var branchObj = branchData[id];
		        self.branchMap[id] = Object.assign({}, branchObj);
		        
		        if (branchObj.lv == 1) {
		            self.branchMap['root'].cl.push(id);
		        };

		        self.branchMap[id].bi = id;
		        self.branchMap[id].gul = [];
		        self.branchMap[id].visibleGul = [];
		    });
    	}
    })();

    self.getSelectedMembers = function () {
    	var selectedMemberMap = {};

    	if (settings.isDisableOnAlreadyChecked) {
    		for (var gu in self.checkedMembers) {
    			Object.defineProperty(selectedMemberMap, gu, {
					value: self.checkedMembers[gu],
					writable: false,
					enumerable: true
				});
    		}

    		for (var branchId in self.checkedBranches) {
    			var branchObj = self.branchMap[branchId];

    			branchObj.gul.forEach(function (gu) {
					if (!selectedMemberMap.hasOwnProperty(gu)) {
						Object.defineProperty(selectedMemberMap, gu, {
							value: memberData[gu].nk,
							writable: false,
							enumerable: true
						});
					}
				});
    			
    		}
    	} else {
    		selectedMemberMap = Object.assign({}, self.checkedMembers);

    		Object.keys(self.checkedBranches).forEach(function(branchId) {
	    		console.log(branchId)
				var branchObj = self.branchMap[branchId];

				branchObj.gul.forEach(function (gu) {
					if (!selectedMemberMap.hasOwnProperty(gu)) {
						selectedMemberMap[gu] = memberData[gu].nk;
					}
				});
			});

			Object.keys(self.checkedFavs).forEach(function(fi) {
				var favBranch = self.branchMap[fi];

				favBranch.gul.forEach(function (gu) {
					if (!selectedMemberMap.hasOwnProperty(gu)) {
						selectedMemberMap[gu] = memberData[gu].nk;
					}
				});
			});
    	}

		return selectedMemberMap;
    }

    function isValidMember(memberObj) {
    	var isOfficialGroupAdmin = group.ntp == 2 && group.ad == 1;

    	return !(settings.isHiddenSelf && memberObj.gu == group.gu) && (memberObj.st == 1)
    		&& !(isOfficialGroupAdmin && memberData[group.gu].abl == "" && memberObj.ad != 1);
    }
}

ObjectDelegate.prototype.setBranchBlock = function () {
	if (this.branchMap['root'].cl.length > 0) {
		var dropdownMenu = document.createElement('div');
		var dropdownButton = document.createElement('div');
		var currentBranch = document.createElement('div');
		var returnButton = document.createElement('img');
		var dropdownList = document.createElement('ul');
		var breadcrumb = document.createElement('div');
		var branchPath = document.createElement('ul');

 		currentBranch.className = 'branch';
		currentBranch.appendChild(document.createElement('div'));
		currentBranch.appendChild(document.createElement('p'));

		returnButton.src = "images/post_audience/Close.png"
		returnButton.onclick = this.changeBranchView.bind(this, 'root');

		dropdownButton.className = 'drop-button';
		dropdownButton.appendChild(currentBranch);
		dropdownButton.onclick = function () {
			dropdownButton.classList.toggle('open');
		};

		dropdownMenu.className = 'dropdown-menu';
		dropdownMenu.appendChild(dropdownButton);
		dropdownMenu.appendChild(returnButton);
		dropdownMenu.appendChild(dropdownList);

		breadcrumb.className = 'breadcrumb';
		breadcrumb.appendChild(branchPath);

		this.branchMenu.className = 'branch-list';
		this.branchMenu.appendChild(dropdownMenu);
		this.branchMenu.appendChild(breadcrumb);

		this.container.appendChild(this.branchMenu);
	}
}

ObjectDelegate.prototype.createDefaultSelect = function () {
	this.defaultSelect.className = 'basic-select';
    this.container.appendChild(this.defaultSelect);
}

ObjectDelegate.prototype.addSelectAllTitle = function (isDisableCheckbox) {
	var element = document.createElement("div");
	var label = document.createElement("label");
	var span = document.createElement("span");

	element.className = "obj-select-all";
	label.textContent = $.i18n.getString("COMMON_MEMBER");
	span.textContent = $.i18n.getString("COMMON_SELECT_ALL");

	span.onclick = this.selectAll.bind(this);

	element.appendChild(label);
	element.appendChild(span);

	this.container.appendChild(element);
}


ObjectDelegate.prototype.done = function () {

}

ObjectDelegate.prototype.setPreviewArea = function (showPreviewArea) {
	this.showPreviewArea = showPreviewArea;

	this.updateStatus();
}

ObjectDelegate.prototype.checkThisRow = function (thisRow) {
	var self = this;
	var checkedObj = {};
	var rowType = thisRow.type;
	var group = QmiGlobal.groups[QmiGlobal.currentGi];
	var memberData = group.guAll;

	if (rowType == 'Member') {
		checkedObj = self.checkedMembers;

		for (var branchId in self.checkedBranches) {
			if (memberData[thisRow.number].bl.indexOf(branchId) > -1) {
				if (!thisRow.isChecked) {
					delete self.checkedBranches[branchId];
				}
			}
		}
	} else if (rowType == 'Branch' || rowType == 'Favorite') {
		var branchObj = self.branchMap[thisRow.number];

		branchObj.gul.forEach(function (gu) {
			if (thisRow.isChecked) {
				if (thisRow.number == 'all') {
					self.checkedMembers[gu] = memberData[gu].nk;
				}
				self.selectedMembers[gu] = memberData[gu].nk;
			} else {
				if (self.checkedMembers.hasOwnProperty(gu)) {
					delete self.checkedMembers[gu];
				}

				delete self.selectedMembers[gu];
			}
		});

		// 我的最愛
		if (rowType == 'Favorite') {
			branchObj.visibleGul.forEach(function (gu) {
				if (thisRow.isChecked) {
					self.checkedMembers[gu] = memberData[gu].nk;
				} else {
					delete self.checkedMembers[gu];
				}
			});

			branchObj.cl.forEach(function (fi) {
				self.checkedFavs[fi] = self.branchMap[fi].bn;
			});
		} else { //我的最愛群組和一般群組
			checkedObj = group.fbl.hasOwnProperty(thisRow.number) ? self.checkedFavs : self.checkedBranches;
		}
	} 

	if (self.singleCheck) {
		this.visibleRows.forEach(function(row) {
			row.check(false);
		}.bind(self));
	} else { //複選
		if (thisRow.number != 'all') {
			if (thisRow.isChecked) {
				if (rowType == 'Member') {
					self.selectedMembers[thisRow.number] = thisRow.name;
				}
				checkedObj[thisRow.number] = thisRow.name;
			} else {
				if (rowType == 'Member') {
					delete self.selectedMembers[thisRow.number];
				}
				delete checkedObj[thisRow.number];
			}
		} else {
			if (thisRow.isChecked) {
				for(branchId in self.checkedBranches) {
					if (Object.getOwnPropertyDescriptor(self.checkedBranches, branchId).writable) {
						delete self.checkedBranches[branchId];
					}
				}
			}
		}
	}

	this.updateStatus();

	console.log(this.checkedMembers);
	console.log(this.checkedBranches);
	console.log(this.checkedFavs)
	console.log(this.selectedMembers);
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

    console.log(this.enable)
    if (this.enable) {
    	this.querySelector('div.obj-cell-chk>div.img').addEventListener('click', this.click.bind(this));
    }
}

objectCellRow.click = function (e) {
	e.stopPropagation();

	var checkBox = e.target;

	if (this.enable) {
		this.isChecked = !this.isChecked;
		checkBox.classList.toggle('chk');

		console.log(this.isChecked)

		if (this.doEventFun) {
			this.doEventFun()
		}
	}
}

objectCellRow.hideCheckbox = function (e) {
	this.querySelector('div.obj-cell-chk').style.visibility = 'hidden';
}

objectCellRow.check = function (isChecked) {
	var checkBox = this.querySelector('div.obj-cell-chk>div.img');

	if (this.enable) {
		if (isChecked) {
			checkBox.classList.add('chk');
		} else {
			checkBox.classList.remove('chk');
		}

		this.isChecked = isChecked;
	}
}

document.registerElement('object-cell-row', {
    prototype: objectCellRow
});