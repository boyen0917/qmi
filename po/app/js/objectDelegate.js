function ObjectDelegate (option) {

	var self = this;
	var group = QmiGlobal.groups[gi];
    var memberData = group.guAll;
    var guList = Object.keys(memberData) || [];
    var branchData = group.bl;

    var settings = option.settings || {};
    var optionsList = option.objectList;

    option.previousSelect = option.previousSelect || {};

    self.isSelectAll = false;
    self.singleCheck = settings.isSingleCheck;
    this.currentBranch = 'root';
    self.branchMap = {
    	root: {
    		descendants: [],
    		leaves: [],
	        cl: ['all'],
	        cnt: 0,
	        lv: 0,
	        bi: 'root'
    	},
    	all: {
    		descendants: [],
    		leaves: [],
    		cl: [],
    		cnt: 0,
    		lv: 1,
    		bi: 'all',
    		bn: $.i18n.getString('COMMON_ALL_MEMBERS')
    	},
    	fav: {
    		descendants: [],
    		leaves: [],
    		cl: [],
    		cnt: 0,
    		lv: 1,
    		bi: 'fav',
    		bn: $.i18n.getString('COMMON_FAVORIATE')
    	},
    	searchResult: {
    		leaves: [],
	        cl: []
    	}
    };

    self.checkedMembers = option.previousSelect.objects || {};
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
    	var noResult = document.createElement('div');

    	if (optionsList) {
	    	self.selectArea.className = "obj-cell-container";
	    	self.container.appendChild(self.selectArea);
	    	self.branchMap['root'].cl = [];

    		option.objectList.forEach(function(obj) {
    			self.branchMap['root'].leaves.push(obj.id);
    			self.branchMap['root'].descendants.push(obj.id);
    		});

    		self.selectedObjects = {};
    	} else {
    		setBranchTreeData();
    		self.setAvailableList();

			if (!settings.isHiddenPublic || !settings.isHiddenFav) {
				self.createDefaultSelect();
			}

			if (!settings.isHiddenBranch || !settings.isHiddenFav) {
				self.setBranchBlock();
				self.setBranchMenu();
			}

			if (!settings.isHiddenPublic) {
				this.addRowElement({type: 'Public'});
			}

			if (!settings.isHiddenFav) {
				this.addRowElement({type: 'Favorite', data: self.branchMap['fav']});
			}

			if (!settings.isDeselectAll) {
				self.addSelectAllTitle();
			}

			if (self.branchMap['root'].cl.length > 0 || self.branchMap['root'].descendants.length > 0) {
		    	self.selectArea.className = "obj-cell-container";
		    	self.container.appendChild(self.selectArea);
		    }
    	}


    	noResult.textContent = $.i18n.getString("MEMBER_SEARCH_NO_RESULT");
    	noResult.className = "no-result";
    	self.container.appendChild(noResult);

    	self.selectedObjects = self.getSelectedMembers();

    	self.changeBranchView('root');
    }

    function haveChildrenAllChecked(objectNode) {
		return (Object.keys(self.selectedObjects).length == self.branchMap['all'].cnt) 
			// || (objectNode.cnt > 0 && objectNode.descendants.every(function (gu) { 
			// 	return self.selectedObjects.hasOwnProperty(gu) 
			// })) || (objectNode.cnt == 0 && objectNode.cl.length > 0 && objectNode.cl.every(function (bi) { 
			// 	return self.checkedBranches.hasOwnProperty(bi) 
			// }));
	}

	function isAncestorChecked(currentNode) {
		var isChecked = false;

		while (currentNode.pi) {
			if (self.checkedBranches.hasOwnProperty(currentNode.pi)) {
				isChecked = true;
				break;
			}

			currentNode = self.branchMap[currentNode.pi];
		}

		return isChecked;
	}

    self.changeBranchView = function (branchId) {
    	var objectNode = self.branchMap[branchId];
    	var selectAllBlock = self.container.querySelector("div.obj-select-all");
    	var noResult = self.container.querySelector("div.no-result");
		var isMemberSelect = optionsList === undefined;

    	var enterFavoriteView = branchId == 'fav' || group.fbl.hasOwnProperty(branchId);
    	var selectedMemberList = Object.keys(self.selectedObjects).map(function (number) {
			if (isMemberSelect) {
				return {
					id: number,
					avatar: memberData[number].aut || "images/common/others/empty_img_personal_xl.png",
					name: memberData[number].nk
				}
			} else {
				var leafObj = optionsList.find(function(obj) {
					return obj.id === number;
				})
				return {
					id: leafObj.id,
					avatar: leafObj.image,
					name: leafObj.name
				}
			}
		});

    	self.visibleRows = {};
    	self.currentBranch = branchId
		self.selectArea.scrollTop = 0;
		self.isSelectAll = self.branchMap[branchId].leaves.length > 0 || self.branchMap[branchId].cl.length > 0;

		while(self.selectArea.firstChild) {
			self.selectArea.removeChild(self.selectArea.firstChild);
		}

		objectNode.leaves.forEach(function (number) {
			var leafObj;
			var isChecked = self.selectedObjects.hasOwnProperty(number);
	  		var isEnable = !self.selectedObjects.hasOwnProperty(number) || 
	  			Object.getOwnPropertyDescriptor(self.selectedObjects, number).writable;

			if (isMemberSelect) {
				leafObj = memberData[number];
				self.addRowElement({
					type: 'Object',
					data: {
						id: number,
						name: leafObj.nk,
						image: leafObj.aut ? leafObj.aut : "images/common/others/empty_img_personal_xl.png"
					},
					isChecked: isChecked,
					isEnable: isEnable
				});
			} else {
				leafObj = optionsList.find(function(obj) {
					return obj.id == number;
				});

				self.addRowElement({
    				type: 'Object',
					data: leafObj,
					isChecked: isChecked,
					isEnable: isEnable
    			});
			}

			if (!isChecked) self.isSelectAll = false;
		});



		objectNode.cl.forEach(function (branchKey) {
			if (branchKey == 'all') {
				var isChecked = haveChildrenAllChecked(self.branchMap[branchKey]);
			} else {
				var isChecked = self.checkedBranches.hasOwnProperty(branchKey) || 
					// haveChildrenAllChecked(self.branchMap[branchKey]) ||
					isAncestorChecked(self.branchMap[branchKey]);
			}

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
			noResult.style.display = 'none';

			if (self.searchArea) {
				self.searchArea.style.display = 'block';
			}

			if (Object.keys(self.favoriteRow).length > 0) {
				var haveFavMembersChecked = ((self.branchMap['fav'].leaves.length > 0) && 
					(self.branchMap['fav'].leaves.every(function(gu) {
						return self.selectedObjects.hasOwnProperty(gu);
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

			if (selectAllBlock) {
				selectAllBlock.style.display = 'block';
				selectAllBlock.firstElementChild.textContent = $.i18n.getString("COMMON_MEMBER");
			}
		} else if (branchId == 'searchResult') {
			self.defaultSelect.style.display = 'none';

			if (selectAllBlock) {
				selectAllBlock.style.display = 'none';
			}

			if (self.branchMap[branchId].leaves.length == 0 &&
				self.branchMap[branchId].cl.length == 0) {
				noResult.style.display = 'block';
			} else {
				noResult.style.display = 'none';
			}
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

		if (selectAllBlock) {
			selectAllBlock.lastElementChild.textContent = self.isSelectAll ? 
				$.i18n.getString("COMMON_SELECT_NONE") : $.i18n.getString("COMMON_SELECT_ALL");
		}

		if (self.showPreviewArea) {
			self.showPreviewArea(selectedMemberList);
		}
	},

	self.search = function (text) {
		var isMemberSelect = optionsList === undefined;
		self.branchMap.searchResult.leaves = [];
		self.branchMap.searchResult.cl = [];
		text = text.toLowerCase();

		if (text.length > 0) {
			if (isMemberSelect) {
				guList.forEach(function (gu) {
			        var userObj = memberData[gu];
			        
			        if (isValidMember(userObj)) {
			        	if (userObj.nk.toLowerCase().indexOf(text) > -1) {
			        		self.branchMap.searchResult.leaves.push(gu);
			        	}
			        }
			    });

			   	Object.keys(group.bl).forEach(function(bi) {
			   		var branchObj = group.bl[bi];
		        	if (branchObj.bn.toLowerCase().indexOf(text) > -1) {
		        		self.branchMap.searchResult.cl.push(bi);
		        	}
			   	});
			} else {
				optionsList.forEach(function(obj) {
					if (obj.name.toLowerCase().indexOf(text) > -1) {
						self.branchMap.searchResult.leaves.push(obj.id);
					}
				})
			}

		    self.changeBranchView('searchResult');
		} else {
	    	self.changeBranchView('root');
		}
	}

	self.clearSearchResult = self.search.bind(self, "");
	
	self.selectAll = function (e) {
		var self = this;
		var target = e.target;
		var currentNode = self.branchMap[self.currentBranch];

		self.isSelectAll = !self.isSelectAll;

		if (!self.isSelectAll && self.checkedBranches.hasOwnProperty(self.currentBranch)) {
			delete self.checkedBranches[self.currentBranch];
		}

		// branch畫面內的全選或取消全選葉子
		currentNode.descendants.forEach(function (gu) {
			if (self.isSelectAll) {
				if (self.visibleRows.hasOwnProperty(gu) || self.currentBranch == 'root') {
					self.checkedMembers[gu] = memberData[gu].nk;
				}
				
				self.selectedObjects[gu] = memberData[gu].nk;
			} else {
				if (self.visibleRows.hasOwnProperty(gu) || self.currentBranch == 'root') {
					delete self.checkedMembers[gu];
				}
				delete self.selectedObjects[gu];
			}
		})

		// 全體成員畫面取消全選時，之前勾選到branch也要取消
		if (self.currentBranch == 'root' || self.currentBranch == 'all') {
			if (!self.isSelectAll) {
				for (var bi in self.checkedBranches) {
					delete self.checkedBranches[bi];
				}
			}
		}

		// 群組畫面內的全選或取消全選子群組
		currentNode.cl.forEach(function (bi) {
			if (self.isSelectAll) {
				if (self.currentBranch == 'fav') {
					self.checkedFavs[bi] = self.branchMap[bi].bn;
				} else {
					if (bi != 'all') {
						self.checkedBranches[bi] = self.branchMap[bi].bn;
					}
				}

				if (self.visibleRows.hasOwnProperty(bi)) {
					self.visibleRows[bi].check(true);
				}
				
			} else {
				if (self.currentBranch == 'fav') {
					delete self.checkedFavs[bi];
				} else {
					delete self.checkedBranches[bi];
				}

				if (self.visibleRows.hasOwnProperty(bi)) {
					self.visibleRows[bi].check(false);
				}
			}
		});

		// 群組取消全選，上層的父群組也都要取消
		while (currentNode.pi) {
			if (!self.isSelectAll && self.checkedBranches.hasOwnProperty(currentNode.pi)) {
				delete self.checkedBranches[currentNode.pi];

				self.branchMap[currentNode.pi].descendants.forEach(function (gu) {
					if (!self.branchMap[self.currentBranch].descendants.includes(gu)) {
						self.checkedMembers[gu] = memberData[gu].nk;
					}
				});
			}

			currentNode = self.branchMap[currentNode.pi];
		}

		target.textContent = self.isSelectAll ? $.i18n.getString("COMMON_SELECT_NONE") : $.i18n.getString("COMMON_SELECT_ALL");

		self.updateStatus();
	}

	self.cancel = function (memberId) {
		if (self.checkedMembers.hasOwnProperty(memberId)) {
			delete self.checkedMembers[memberId];
		}

		delete self.selectedObjects[memberId];

		// 如所在的群組也已勾選，也將此群組取消
		for (var branchId in self.checkedBranches) {
			if (memberData[memberId].bl.indexOf(branchId) > -1) {
				delete self.checkedBranches[branchId];

				// 取消群組勾選，並紀錄剩下的勾選成員
				self.branchMap[branchId].descendants.forEach(function (gu) {
					if (gu != memberId) {
						self.checkedMembers[gu] = memberData[gu].nk;
					}
				});
			}
		}

		if (self.visibleRows.hasOwnProperty(memberId)) {
			self.visibleRows[memberId].check(false);
		}
		
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
				rowElement.info = obj.data.cl.length > 0 ? ($.i18n.getString("COMPOSE_N_MEMBERS", obj.data.leaves.length) + 
					" " + $.i18n.getString("COMPOSE_N_SUBGROUP", obj.data.cl.length)) : ($.i18n.getString("COMPOSE_N_MEMBERS", obj.data.leaves.length));

				if (obj.data.descendants.length > 0) {
					rowElement.onclick = function (e) {
						self.changeBranchView('fav');
					}
				} 
				
				self.favoriteRow = rowElement;
				break;

			// case "Member":
			// 	rowElement.number = obj.data.gu;
			// 	rowElement.name = obj.data.nk.replaceOriEmojiCode();
			// 	rowElement.imageUrl = obj.data.aut ? obj.data.aut : "images/common/others/empty_img_personal_xl.png";
			// 	rowElement.enable = obj.isEnable;

			// 	self.visibleRows[obj.data.gu] = rowElement;
			// 	break;
			case "Branch":
				rowElement.number = obj.data.bi;
				rowElement.name = obj.data.bn;
				rowElement.imageUrl = 'images/common/others/select_empty_all_photo.png';
				rowElement.expand = true;
				rowElement.info = $.i18n.getString("COMPOSE_N_MEMBERS", obj.data.cnt) + 
					" " + $.i18n.getString("COMPOSE_N_SUBGROUP", obj.data.cl.length);

				// rowElement.parent = obj.parent;
				rowElement.onclick = function (e) {
					self.changeBranchView(obj.data.bi);
				}

				self.visibleRows[obj.data.bi] = rowElement;

				break;
			case "Object":
				rowElement.number = obj.data.id;
				rowElement.name = obj.data.name;
				rowElement.imageUrl = obj.data.image;
				rowElement.info = obj.data.info;
				rowElement.enable = obj.isEnable;
				rowElement.onclick = rowElement.click;

				self.visibleRows[obj.data.id] = rowElement;
				break;
		}

		rowElement.doEventFun = self.checkThisRow.bind(self, rowElement);

		if (obj.type == 'Public' || obj.type == 'Favorite') {
			self.defaultSelect.appendChild(rowElement);

			if (obj.type == 'Favorite' && obj.data.descendants.length == 0) {
				rowElement.hideCheckbox();
			}
 		} else {
			self.selectArea.appendChild(rowElement);
		}
    }

    self.updateBranchMenu = function (branchId) {
		var objectNode = this.branchMap[branchId];
		var dropBtn = this.branchMenu.querySelector("div.drop-button")

		// 更新dropdown menu 按鈕文字
		dropBtn.querySelector("div.branch>div").textContent = objectNode.bn;
		dropBtn.querySelector("div.branch>p").textContent = $.i18n.getString("COMPOSE_N_MEMBERS", objectNode.cnt) + 
					" " + $.i18n.getString("COMPOSE_N_SUBGROUP", objectNode.cl.length);
	},

	self.setBranchMenu = function (isFavBranch) {
		var objectNode = self.branchMap['root'];
		var branchSelect = self.branchMenu.querySelector("div.dropdown-menu ul");

		while(branchSelect.firstChild) {
			branchSelect.removeChild(branchSelect.firstChild);
		}

		if (self.branchMap['fav'].cl.length > 0 || self.branchMap['fav'].leaves.length > 0) {
			makeBranchItem('fav');
			self.branchMap['fav'].cl.forEach(function(branchId) {
				makeBranchItem(branchId);
			});

			objectNode = self.branchMap['root'];
		}
		
		(function recursiveBranch() {
			objectNode.cl.forEach(function(branchId) {
				makeBranchItem(branchId);

				if (objectNode.cl && objectNode.cl.length > 0) {
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
			objectNode = self.branchMap[branchId];
			branchName.textContent = objectNode.bn;
			branchDetail.textContent = $.i18n.getString("COMPOSE_N_MEMBERS", objectNode.cnt) + 
				" " + $.i18n.getString("COMPOSE_N_SUBGROUP", objectNode.cl.length);
			branchLevel.textContent = objectNode.lv;

			branchMeta.className = 'branch';
			branchMeta.appendChild(branchName);
			branchMeta.appendChild(branchDetail);
			branchOption.appendChild(branchMeta);
			branchOption.appendChild(branchLevel);

			if (branchId == self.currentBranch) {
				branchOption.className = 'active'; 
			} else {
				branchOption.onclick = function () {
					self.branchMenu.querySelector('div.drop-button').classList.remove('open');
					self.changeBranchView(branchId);
				}
			}

			branchOption.style.paddingLeft = (15 + (objectNode.lv - 1) * 20) + "px";

			branchSelect.appendChild(branchOption);
		}
	},

    self.setBreadcrumb = function (branchId, targetId) {
    	var self = this;
    	var breadcrumb = self.branchMenu.querySelector("div.breadcrumb ul");
    	var objectNode = self.branchMap[branchId];
    	var ellipsisBtn = null;

    	breadcrumb.style.marginLeft = "0px";

		while(breadcrumb.firstChild) {
			breadcrumb.removeChild(breadcrumb.firstChild);
		}

		breadcrumb.appendChild(createBranchItem(objectNode, false));
		
		while (objectNode.pi) {
			objectNode = self.branchMap[objectNode.pi];
			breadcrumb.appendChild(createBranchItem(objectNode, true));

			if (breadcrumb.offsetWidth > breadcrumb.parentElement.offsetWidth) {
				ellipsisBtn = createBranchItem(objectNode, true, true);
				breadcrumb.insertBefore(ellipsisBtn, breadcrumb.lastChild);
				breadcrumb.removeChild(breadcrumb.lastChild);

				break;
			}
		}

		if (ellipsisBtn != null) {
			var distanceX = ellipsisBtn.getClientRects()[0].left - breadcrumb.getClientRects()[0].left;
			breadcrumb.style.marginLeft = "-" + (distanceX - 10) + "px";
		}

		function createBranchItem (branch, withLink, overflow) {
			var item = document.createElement("li");
			var args = arguments;

			if (withLink) {
				var link = document.createElement('a');

				if (overflow) {
					var moreList = document.createElement('ul');
					var cover = document.createElement('div');

					cover.className = 'cover';
					item.className = "ellipsis";
					item.appendChild(link);

					while (branch) {
						moreList.appendChild(args.callee(branch, true))
						branch = self.branchMap[branch.pi];
					}

					cover.appendChild(moreList);
					item.appendChild(cover)

					link.onclick = function (e) {
						e.stopPropagation();
						cover.style.display = 'block';
					};

					cover.onclick = function (e) {
						cover.style.display = 'none';
					};
				} else {
					link.textContent = branch.bn;
					link.onclick = function (e) {
						e.stopPropagation();
						self.changeBranchView(branch.bi);
					};

					item.appendChild(link);
				}
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
	        		self.branchMap['fav'].leaves.push(gu);
	        		self.branchMap['fav'].descendants.push(gu);
	        	}

	        	if (userObj.fbl.length > 0) {
	        		userObj.fbl.forEach(function(fi) {
	        			if (self.branchMap.hasOwnProperty(fi)) {
	        				self.branchMap[fi].leaves.push(gu);
	        				self.branchMap[fi].descendants.push(gu);
	        			}
	        			if (!self.branchMap['fav'].descendants.includes(gu)) {
	        				self.branchMap['fav'].descendants.push(gu);
	        			}
	        		})
	        	}

	        	if (settings.isHiddenBranch) {
	        		self.branchMap['root'].descendants.push(gu);
	        		self.branchMap['root'].leaves.push(gu);
	        		self.branchMap['root'].cnt = self.branchMap['root'].cnt + 1;
	        		self.branchMap['root'].cl = [];
	        	} else {
	        		if (branchListStr.length > 0) {
			            var branchList = branchListStr.split(",");

			            branchList.forEach(function (fullBranchName) {
			                var branchLevels = fullBranchName.split(".");
			                var realBranchId = branchLevels.slice(-1);

			                branchLevels.forEach(function(branchId) {
			                	if (!self.branchMap[branchId].descendants.includes(gu)) {
			                		self.branchMap[branchId].descendants.push(gu);
			                	}
			                });

			                self.branchMap[realBranchId].leaves.push(gu);
			            });
			        }

			        self.branchMap['root'].descendants.push(gu);
			        self.branchMap['all'].descendants.push(gu);
		        	self.branchMap['all'].leaves.push(gu);
		        	self.branchMap['all'].cnt = self.branchMap['all'].cnt + 1;
	        	}
	        }
	    });
	}

	self.updateStatus = function () {
		var isMemberSelect = optionsList === undefined;
		var selectedMemberList = Object.keys(self.selectedObjects).map(function (number) {
			if (isMemberSelect) {
				return {
					id: number,
					avatar: memberData[number].aut || "images/common/others/empty_img_personal_xl.png",
					name: memberData[number].nk
				}
			} else {
				var leafObj = optionsList.find(function(obj) {
					return obj.id === number;
				})
				return {
					id: leafObj.id,
					avatar: leafObj.image,
					name: leafObj.name
				}
			}
		});

		self.isSelectAll = true;

		var selectAllMembers = selectedMemberList.length == self.branchMap['all'].cnt;
		var selectAllBlock = self.container.querySelector("div.obj-select-all");

		for (var id in self.visibleRows) {
			var rowElement = self.visibleRows[id];

			if (self.branchMap.hasOwnProperty(id)) {
				var branchObj = self.branchMap[id];

				// if (branchObj.cnt == 0) {
					if ((id == 'all' && selectAllMembers) || self.checkedBranches.hasOwnProperty(id)) {
						rowElement.check(true);
					} else  {
						rowElement.check(false);
					}
				// } else {
				// 		// if ((id == 'all' && selectAllMembers) || ) {
				// 	if ((id == 'all' && selectAllMembers) || self.checkedBranches.hasOwnProperty(id)) {
				// 		rowElement.check(true);
				// 	} else {
				// 		rowElement.check(false);
				// 	}
					
				// 	// if (self.checkedBranches.hasOwnProperty(id)) {
				// 	// 	rowElement.check(true);
				// 	// }
				// 	// if (haveChildrenAllChecked(branchObj)) {
				// 	// 	rowElement.check(true);
				// 	// } 
				// 	// else {
				// 	// 	rowElement.check(false);
				// 	// 	if (self.checkedBranches.hasOwnProperty(id)) {
				// 	// 		delete self.checkedBranches[id]
				// 	// 	}
				// 	// }
				// }
			} else {
				if (self.selectedObjects.hasOwnProperty(id)) {
					rowElement.check(true);
				} else  {
					rowElement.check(false);
				}
			}

			if (!rowElement.isChecked) {
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
				self.favoriteRow.check(false);
				self.checkedFavs = {};
			}
		}

		if (selectAllBlock) {
			selectAllBlock.lastElementChild.textContent = self.isSelectAll ? 
				$.i18n.getString("COMMON_SELECT_NONE") : $.i18n.getString("COMMON_SELECT_ALL");
		}
		
		if (self.showPreviewArea) {
			self.showPreviewArea(selectedMemberList);
		}

		// self.setSelectionHeight();

		// console.log(this.checkedMembers);
		// console.log(this.checkedBranches);
		// console.log(this.checkedFavs)
		// console.log(this.selectedObjects);
	}

    var setBranchTreeData = function () {
    	if (!settings.isHiddenBranch) {
    		Object.keys(branchData).forEach(function (id) {
		        var branchObj = branchData[id];
		        self.branchMap[id] = Object.assign({}, branchObj);
		        
		        if (branchObj.lv == 1) {
		            self.branchMap['root'].cl.push(id);
		        };

		        self.branchMap[id].bi = id;
		        self.branchMap[id].descendants = [];
		        self.branchMap[id].leaves = [];
		    });

		    Object.keys(group.fbl).forEach(function(fi) {
				self.branchMap['fav'].cl.push(fi);
				self.branchMap[fi] = {
					descendants: [],
		    		leaves: [],
		    		cl: [],
		    		cnt: group.fbl[fi].cnt,
		    		bi: fi,
		    		bn: group.fbl[fi].fn,
		    		pi: 'fav',
		    		lv: 2
				}
			})
    	}
    };

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

    			branchObj.descendants.forEach(function (gu) {
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
				var branchObj = self.branchMap[branchId];

				branchObj.descendants.forEach(function (gu) {
					if (!selectedMemberMap.hasOwnProperty(gu)) {
						selectedMemberMap[gu] = memberData[gu].nk;
					}
				});
			});

			Object.keys(self.checkedFavs).forEach(function(fi) {
				var favBranch = self.branchMap[fi];

				favBranch.descendants.forEach(function (gu) {
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

    self.setSelectionHeight = function (footerHeight) {
    	var selectionHeight = self.selectArea.offsetHeight;

    	if (typeof footerHeight == 'string') {
    		footerHeight = parseInt(footerHeight.replace("px", "")) > 0 ? parseInt(footerHeight.replace("px", "")) : 0;
    	}

    	if (self.view) {
    		if (selectionHeight != 0) {
    			selectionHeight = self.view.offsetHeight - (self.selectArea.getClientRects()[0].top - 
					self.view.getClientRects()[0].top);
    		}
		}

		if (Object.keys(self.selectedObjects).length > 0 && self.view) {
			selectionHeight = selectionHeight - footerHeight;
		}
		
		self.selectArea.style.maxHeight = "" + selectionHeight + "px";
    }
}

ObjectDelegate.prototype.setBranchBlock = function () {
	// if (this.branchMap['root'].cl.length > 0) {
		var dropdownMenu = document.createElement('div');
		var dropdownButton = document.createElement('div');
		var currentBranch = document.createElement('div');
		var returnButton = document.createElement('img');
		var dropdownList = document.createElement('ul');
		var breadcrumb = document.createElement('div');
		var branchPath = document.createElement('ul');
		var cover = document.createElement('div');

 		currentBranch.className = 'branch';
		currentBranch.appendChild(document.createElement('div'));
		currentBranch.appendChild(document.createElement('p'));

		returnButton.src = "images/post_audience/Close.png"
		returnButton.onclick = this.changeBranchView.bind(this, 'root');

		dropdownButton.className = 'drop-button';
		dropdownButton.appendChild(currentBranch);
		dropdownButton.onclick = function () {
			dropdownButton.classList.add('open');
		};

		dropdownMenu.className = 'dropdown-menu';

		cover.className = 'cover';
		cover.appendChild(dropdownList);
		cover.onclick = function (e) {
			dropdownButton.classList.remove('open');
		};

		dropdownMenu.appendChild(dropdownButton);
		dropdownMenu.appendChild(returnButton);
		dropdownMenu.appendChild(cover);

		breadcrumb.className = 'breadcrumb';
		breadcrumb.appendChild(branchPath);

		this.branchMenu.className = 'branch-list';
		this.branchMenu.appendChild(dropdownMenu);
		this.branchMenu.appendChild(breadcrumb);

		this.container.appendChild(this.branchMenu);
	// }
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
	var group = QmiGlobal.groups[QmiGlobal.currentGi || gi];
	var memberData = group.guAll;
	var currentNode = self.branchMap[self.currentBranch];

	// 葉子
	if (rowType == 'Object') {
		checkedObj = self.checkedMembers;

		// 我的最愛群組裡面的成員有可能會和我的最愛成員部分重複，檢查
		if (self.currentBranch == 'fav') {
			for (var favId in self.checkedFavs) {
				if (self.branchMap[favId].leaves.includes(thisRow.number) && !thisRow.isChecked) {
					self.branchMap[favId].leaves.forEach(function(gu) {
						if (thisRow.number != gu) {
							self.checkedMembers[gu] = memberData[gu].nk;
						}  
					});
					delete self.checkedFavs[favId];
				}
			}
		}

		//成員取消勾選，而成員所在的群組如有被勾選，群組也同時取消勾選 
		for (var branchId in self.checkedBranches) {
			if (memberData[thisRow.number].bl.indexOf(branchId) > -1) {
				if (!thisRow.isChecked) {
					delete self.checkedBranches[branchId];

					// 取消群組勾選，並紀錄剩下的勾選成員
					self.branchMap[branchId].descendants.forEach(function (gu) {
						if (gu != thisRow.number) {
							self.checkedMembers[gu] = memberData[gu].nk;
						}
					});
				}
			}
		}
	} else if (rowType == 'Branch' || rowType == 'Favorite') { // 群組
		var branchObj = self.branchMap[thisRow.number];

		branchObj.descendants.forEach(function (gu) {
			if (thisRow.isChecked) {
				if (thisRow.number == 'all') {
					self.checkedMembers[gu] = memberData[gu].nk;
				} else { // 點選群組，取消過去勾選的子成員
					if (self.checkedMembers.hasOwnProperty(gu)) {
						delete self.checkedMembers[gu];
					}
				}

				self.selectedObjects[gu] = memberData[gu].nk;
			} else {
				if (self.checkedMembers.hasOwnProperty(gu)) {
					delete self.checkedMembers[gu];
				}

				delete self.selectedObjects[gu];
			}
		});

		
		if (rowType == 'Favorite') {
			branchObj.cl.forEach(function (fi) {
				if (thisRow.isChecked) {
					self.checkedFavs[fi] = self.branchMap[fi].bn;
				} else {
					delete self.checkedFavs[fi];
				}
			});

			branchObj.leaves.forEach(function (gu) {
				if (thisRow.isChecked) {
					self.checkedMembers[gu] = memberData[gu].nk;
				} else {
					delete self.checkedMembers[gu];
				}
			});
			
		} else {
			// 我的最愛群組和一般群組
			checkedObj = self.currentBranch === 'fav' ? self.checkedFavs : self.checkedBranches;

			// 此branch被取消勾選，parents群組也要取消勾選
			while (currentNode) {
				if (!thisRow.isChecked && self.checkedBranches.hasOwnProperty(currentNode.bi)) {
					currentNode.descendants.forEach(function (gu) {
						if (!self.branchMap[thisRow.number].descendants.includes(gu)) {
							self.checkedMembers[gu] = memberData[gu].nk;
						}
					});

					delete checkedObj[currentNode.bi];
				}

				currentNode = self.branchMap[currentNode.pi];
			}
		}
	} else if (rowType == 'Public') {
		self.checkedMembers = {};
		self.checkedBranches = {};
		self.checkedFavs = {};
		self.selectedObjects = {};

		Object.keys(self.visibleRows).forEach(function (rowId) {
			// if (rowId != thisRow.number) {
			self.visibleRows[rowId].check(false);
			// }
		});
	}

	if (self.singleCheck) {
		self.checkedMembers = {};
		self.selectedObjects = {};
		self.checkedMembers[thisRow.number] = thisRow.name;
		self.selectedObjects[thisRow.number] = thisRow.name;

		Object.keys(self.visibleRows).forEach(function (rowId) {
			if (rowId != thisRow.number) {
				self.visibleRows[rowId].check(false);
			}
		});
	} else { //複選
		if (thisRow.number != 'all') {
			if (thisRow.isChecked) {
				if (rowType == 'Object') {
					self.selectedObjects[thisRow.number] = thisRow.name;
				}
				checkedObj[thisRow.number] = thisRow.name;
			} else {
				if (rowType == 'Object') {
					delete self.selectedObjects[thisRow.number];
				}
				delete checkedObj[thisRow.number];
			}
		} else {
			// if (thisRow.isChecked) { // 全體成員
				for(branchId in self.checkedBranches) {
					if (Object.getOwnPropertyDescriptor(self.checkedBranches, branchId).writable) {
						delete self.checkedBranches[branchId];
					}
				}
			// }
		}
	}

	this.updateStatus();

	// console.log(this.checkedMembers);
	// console.log(this.checkedBranches);
	// console.log(this.checkedFavs)
	// console.log(this.selectedObjects);
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

	if (this.enable) {
		this.isChecked = !this.isChecked;
		checkBox.classList.toggle('chk');

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