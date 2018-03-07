var ScheduledFeedModal = function(modal) {
    this.modal = modal; 
    this.container = modal.children[0];

    this.modal.querySelector('div.title>span').addEventListener('click', this.close.bind(this));

    Array.from(this.container.querySelectorAll("scheduled-post")).forEach(function(post) {
        post.remove()
    });
};

ScheduledFeedModal.prototype.importData = function (postList) {
    var self = this;
    var groupMemberAllData = QmiGlobal.groups[gi].guAll || {};

    postList.forEach(function (postData, index) {

        var feed = document.createElement('scheduled-post');
        var metaData = postData.meta;
        var authorData = groupMemberAllData[metaData.gu];
        var mainContent = postData.ml[0].c.replaceOriEmojiCode();

        feed.container = self.modal;
        feed.idNumber = postData.ei;
        feed.authorName = authorData.nk || "";
        feed.authorImage = authorData.aut ? authorData.aut : "images/common/others/empty_img_personal_l.png";
        feed.type = getEventTypeText(metaData.tp);
        feed.title = metaData.tt || ""; 
        feed.postTime = metaData.rts;
        feed.audiences = metaData.tu;
        feed.briefContent = mainContent;

        self.container.appendChild(feed);
        self.modal.style.display = 'block';
    });
}

ScheduledFeedModal.prototype.close = function () {
    this.modal.style.display = 'none';
}

var scheduledPost = Object.create(HTMLElement.prototype);
var datetimeModifyPrototype = Object.create(HTMLElement.prototype);
var audienceModifyPrototype = Object.create(HTMLElement.prototype);
var optionsPrototype = Object.create(HTMLElement.prototype);
var menuPrototype = Object.create(HTMLUListElement.prototype);

scheduledPost.attachedCallback  = function () {
    // var menu = document.createElement('scheduled-post-menu');
    var options = document.createElement('scheduled-post-options');
    var datetimeModify = document.createElement('datetime-modify');
    var audienceModify = document.createElement('audience-modify');
    

    this.innerHTML = `
        <div class='header'>
            <div class='left'><img src=${this.authorImage}></div>
            <div class='right'>
                <div class='name'>${this.authorName}</div>
                <div class='type'>
                    <img src='images/compose/compose_box_bticon_post.png'>
                    <label>發布</label>
                    <span>${this.type}</span>
                    <mark class='title'>${this.title}</mark>
                </div>
            </div>
        </div>
        <div class='middle'>${this.briefContent}</div>
        <div class='footer'></div>
    `;

    datetimeModify.setAttribute('currentValue', this.postTime);
    // datetimeModify.setAttribute('max', maxEditTime);
    audienceModify.currentTargets = this.audiences;

    datetimeModify.finish = this.updatePostTime.bind(this);
    datetimeModify.cancel = this.cancelDatetimeEdit.bind(this);
    datetimeModify.checkIsExpired = this.checkIsExpired.bind(this);
    datetimeModify.expiredHandler = this.expiredHandler.bind(this);

    audienceModify.edit = this.editAudiences.bind(this);
    audienceModify.checkIsExpired = this.checkIsExpired.bind(this);
    audienceModify.expiredHandler = this.expiredHandler.bind(this);

    options.publishNow = this.publishNow.bind(this);
    options.deleteFeed = this.delete.bind(this);
    // menu.showDatetimeInput = this.showDatetimeInput.bind(this);
    // menu.editAudiences = this.editAudiences.bind(this);

    this.datetimeModify = datetimeModify;
    this.audienceModify = audienceModify;
    // this.menu = menu;
    this.options = options;

    this.querySelector("div.header>div.right").appendChild(datetimeModify);
    this.querySelector("div.header").appendChild(audienceModify);
    // this.querySelector("div.footer").appendChild(menu);
    this.querySelector("div.footer").appendChild(options);
}

scheduledPost.delete = function () {
    var self = this;
    var postId = this.idNumber;

    popupShowAdjust(
        $.i18n.getString("SCHEDULED_POST_DELETE_CONFIRM"),
        "",
        $.i18n.getString("SCHEDULED_POST_DELETE"),
        $.i18n.getString("COMMON_CANCEL"),
        [function () {
            new QmiAjax({
                apiName: "groups/" + gi + "/timelines/" + ti_feed+ "/present/events/" + postId,
                method: 'delete'
            }).success(function (data) {
                if (self.previousElementSibling.tagName != self.tagName && self.nextElementSibling == null) {
                    self.container.style.display = 'none';
                }

                toastShow(data.rsp_msg);

                timelineSwitch( $("#page-group-main").data("currentAct") || "feeds");

                self.remove();
            })
        }]
    )
}

scheduledPost.publishNow = function () {
    this.updatePostTime(0);
}

scheduledPost.updatePostTime = function (datetime) {
    var self = this;

    new QmiAjax({
        apiName: "groups/" + gi + "/timelines/" + ti_feed+ "/present/events/" + this.idNumber + "/timestamp",
        method: 'put',
        body: {
            ct: datetime
        }
    }).success(function (data) {
        var newDate = new Date(datetime);

        if (datetime == 0) {
            toastShow($.i18n.getString('COMPOSE_POST_SUCCESSED'));
            self.container.style.display = 'none';

            timelineSwitch( $("#page-group-main").data("currentAct") || "feeds");
        } else {
            toastShow(data.rsp_msg);

            getScheduledTimelineList().then(function (posts) {
                if (posts.length == 0) {
                    self.container.style.display = 'none';
                } else {
                    document.querySelector('#page-group-main div.scheduled-post-alert').click();
                }
            });
            // self.datetimeModify.querySelector('div.value').textContent = newDate.customFormat("#YYYY#/#MM#/#DD# #hhh#:#mm#");
            // self.datetimeModify.querySelector('div.value').style.display = 'inline-block';
            // self.datetimeModify.children[1].style.display = 'inline-block';
            // self.datetimeModify.querySelector('div.modify').style.display = 'none';

            // self.datetimeModify.reset(datetime);
        }
    })
}

scheduledPost.editAudiences = function (editBtn) {
    var self = this;
    var currentTargets= self.audiences;
    var groupMemberAll = QmiGlobal.groups[gi].guAll || {};
    var currentAudiences = {};
    var currentBranches = {};
    var currentFavorites = {};

    /*文章存的object_str跟之前(發布對象按鈕、指派管理員、聊天室選擇成員等)不一樣，
        需要轉成可以讓composeObjectShowDelegate吃下*/
    if (currentTargets) {
        if (currentTargets.gul) {
            currentTargets.gul.forEach(function (member) {
                currentAudiences[member.gu] = member.n;
            });
        }

        if (currentTargets.bl) {
            currentTargets.bl.forEach(function (branch) {
                currentBranches[branch.bi] = branch.bn;
            });
        }
    }

    $(editBtn).data("object_str", JSON.stringify(currentAudiences));
    $(editBtn).data("branch_str", JSON.stringify(currentBranches));

    composeObjectShowDelegate($(editBtn), $(editBtn) , {
        isShowBranch: true,
        isShowSelf: true,
        isShowAll: false,
        isShowFav: true,
        isDisableOnAlreadyChecked: true,
    }, function () {
        var newAudiencesData = $.parseJSON($(editBtn).data("object_str")) || {};
        var newBranchData = $.parseJSON($(editBtn).data("branch_str")) || {};
        var newFavoriteData = $.parseJSON($(editBtn).data("favorite_str")) || {};
        var checkedMemberCount = Object.keys(newAudiencesData).length;
        var groupMemberNum = QmiGlobal.groups[gi].cnt;

        var thisGi = self.idNumber.split("_")[0];
        var thisTi = self.idNumber.split("_")[1];
        var newTargets = {
            tu: {}
        };
        var newTargetNameList = [];

        if (Object.keys(newBranchData).length > 0) {
            newTargets.tu.bl = [];
            for (var branchID in newBranchData) {
                if (!currentBranches.hasOwnProperty(branchID)) {
                    newTargetNameList.push(newBranchData[branchID]);
                }

                newTargets.tu.bl.push({
                    bi: branchID,
                    bn: newBranchData[branchID]
                })
            }
        }

        if (Object.keys(newFavoriteData).length > 0) {
            newTargets.tu.fl = [];
            for (var favoriteID in newFavoriteData) {
                if (!currentFavorites.hasOwnProperty(favoriteID)) {
                    newTargetNameList.push(newFavoriteData[favoriteID]);
                }

                newTargets.tu.fl.push(newFavoriteData[favoriteID])
            }
        }

        if (checkedMemberCount > 0) {
            if (checkedMemberCount == groupMemberNum) {
                newTargets = {};
                newTargetNameList.push($.i18n.getString("MEMBER_ALL"));
            } else {
                newTargets.tu.gul = [];
                for (var memberID in newAudiencesData) {
                    if (!currentAudiences.hasOwnProperty(memberID)) {
                        newTargetNameList.push(newAudiencesData[memberID]);
                    }

                    newTargets.tu.gul.push({
                        gu: memberID,
                        n: newAudiencesData[memberID]
                    })
                }
            }
        }

        new QmiAjax({
            apiName: "groups/" + thisGi + "/timelines/" + thisTi + "/present/events/" + self.idNumber + "/permission",
            method: "put",
            body: newTargets
        }).complete(function(data){
            if(data.status == 200){
                var audienceDiv = self.audienceModify.querySelector("div");
                var newTargetsStr = newTargetNameList.join('、');

                if (checkedMemberCount == groupMemberNum) {
                    audienceDiv.textContent = $.i18n.getString("MEMBER_ALL");
                    self.audienceModify.querySelector("span").style.display = 'none';
                } else {
                    audienceDiv.textContent = audienceDiv.textContent + '、' + newTargetsStr;
                    self.audiences = newTargets.tu;
                }
                
                if (newTargetsStr.length > 0) {
                    toastShow($.i18n.getString("FEED_ADD_AUDIENCE") + " : " + newTargetsStr);
                }
                
                timelineSwitch( $("#page-group-main").data("currentAct") || "feeds");
            }
        });
    });
}

scheduledPost.cancelDatetimeEdit = function () {
    this.options.style.display = 'block';
    this.datetimeModify.previousElementSibling.style.display = 'block';
    this.datetimeModify.style.display = 'none';
}

scheduledPost.checkIsExpired = function () {
    // console.log()
    return this.postTime < (new Date()).getTime();
}

scheduledPost.expiredHandler = function () {
    var self = this;
    popupShowAdjust(
        $.i18n.getString("SCHEDULED_POST_HAS_BEEN_PUBLISHED"),
        "",
        $.i18n.getString("ACCOUNT_BINDING_DONE"),
        false,
        [function () {
            self.container.style.display = 'none';
            timelineSwitch( $("#page-group-main").data("currentAct") || "feeds");
        }]
    )
}

datetimeModifyPrototype.attachedCallback = function () {
    var datetimeText = document.createElement('div');
    var datetimeInput = document.createElement('input');
    var modifyBlock = document.createElement('div');
    var confirmDiv = document.createElement('div');
    var editSpan = document.createElement('span');
    var doneSpan = document.createElement('span');
    var cancelSpan = document.createElement('span');
    var currentTime = parseInt(this.getAttribute('currentValue'));

    datetimeText.textContent = new Date(currentTime).customFormat("#YYYY#/#MM#/#DD# #hhh#:#mm#");

    this.datetimeInput = datetimeInput;
    datetimeInput.type = "datetime-local";
    datetimeInput.required = true;

    datetimeInput.addEventListener('change', function (e) {
        var target = e.target;
        var validityState = target.validity;

        if (!validityState.valid) {
            datetimeInput.value = target.min;
        }
    })

    editSpan.textContent = $.i18n.getString('SCHEDULED_POST_EDIT');
    doneSpan.textContent = $.i18n.getString('SCHEDULED_POST_DONE');
    cancelSpan.textContent = $.i18n.getString('COMMON_CANCEL');

    datetimeText.className = 'value'
    modifyBlock.className = 'modify';

    editSpan.addEventListener('click', function (e) {
        var defaultTime = new Date(currentTime).customFormat("#YYYY#-#MM#-#DD#T#hhh#:#mm#")
        var minEditTime = new Date().customFormat("#YYYY#-#MM#-#DD#T#hhh#:#mm#");
        var maxEditTime = new Date(currentTime + 20 * 3600 * 24 * 365 * 1000).customFormat("#YYYY#-#MM#-#DD#T#hhh#:#mm#");

        if (this.checkIsExpired()) {
            this.expiredHandler();
        } else {
            datetimeInput.setAttribute("min", minEditTime);
            datetimeInput.setAttribute("max", maxEditTime);

            // 第一次點選顯示預約時間
            if (datetimeInput.value == "") {
                datetimeInput.setAttribute("value", defaultTime);
            }

            editSpan.style.display = 'none';
            datetimeText.style.display = 'none';
            modifyBlock.style.display = 'block';
        }
    }.bind(this));

    doneSpan.addEventListener('click', function (e) {
        var editTimeStr = datetimeInput.value;
        var [fullDate, time] = editTimeStr.split("T");
        var [year, month, date] = fullDate.split("-");
        var [hour, minute] = time.split(":");
        var newDate = new Date();

        newDate.setFullYear(year);
        newDate.setMonth(month - 1);
        newDate.setDate(date);
        newDate.setHours(hour);
        newDate.setMinutes(minute);

        this.finish(newDate.getTime());
    }.bind(this));

    // cancelSpan.addEventListener('click', this.cancel);
    cancelSpan.addEventListener('click', function (e) {
        editSpan.style.display = 'inline-block';
        datetimeText.style.display = 'inline-block';
        modifyBlock.style.display = 'none'
        // datetimeInput.setAttribute("value", datetimeInput.getAttribute('min'));
    });

    confirmDiv.appendChild(cancelSpan);
    confirmDiv.appendChild(doneSpan);
    modifyBlock.appendChild(datetimeInput);
    modifyBlock.appendChild(confirmDiv);

    this.appendChild(datetimeText);
    this.appendChild(editSpan);
    this.appendChild(modifyBlock)
}

datetimeModifyPrototype.reset = function (currentTime) {
    var minEditTime = new Date(currentTime).customFormat("#YYYY#-#MM#-#DD#T#hhh#:#mm#");
    var maxEditTime = new Date(currentTime + 20 * 3600 * 24 * 365 * 1000).customFormat("#YYYY#-#MM#-#DD#T#hhh#:#mm#");
    
    this.datetimeInput.setAttribute("min", minEditTime);
    this.datetimeInput.setAttribute("max", maxEditTime);
    this.datetimeInput.setAttribute("value", minEditTime);
    this.datetimeInput.value = minEditTime;
}

audienceModifyPrototype.attachedCallback = function () {
    var icon = document.createElement("img");
    var value = document.createElement("div");
    var editSpan = document.createElement('span');

    icon.src = "images/icon/icon_object.png";

    value.textContent = this.currentTargets ? targetListToString(this.currentTargets) : $.i18n.getString('MEMBER_ALL')
    editSpan.textContent = $.i18n.getString("SCHEDULED_POST_EDIT");

    editSpan.addEventListener('click', function (e) {

        if (this.checkIsExpired()) {
            this.expiredHandler();
        } else {
            this.edit(e.target);
        }
    }.bind(this));

    this.appendChild(icon);
    this.appendChild(value);

    if (this.currentTargets) {
        this.appendChild(editSpan);
    }
}

optionsPrototype.attachedCallback = function () {
    var deleteBtn = document.createElement('button');
    var modifyBtn = document.createElement('button');

    deleteBtn.className = 'delete';
    modifyBtn.className = 'modify';

    deleteBtn.textContent = $.i18n.getString('SCHEDULED_POST_DELETE');
    modifyBtn.textContent = $.i18n.getString('SCHEDULED_POST_POST_NOW');

    modifyBtn.addEventListener('click', this.publishNow)
    deleteBtn.addEventListener('click', this.deleteFeed)

    this.appendChild(deleteBtn);
    this.appendChild(modifyBtn);
}

menuPrototype.attachedCallback = function () {
    var editAudienceItem = document.createElement('li'); 
    var editScheduleItem = document.createElement('li');
    var cancelItem = document.createElement('li');

    editAudienceItem.textContent = $.i18n.getString('SCHEDULED_POST_EDIT_AUDIENCE');
    editScheduleItem.textContent = $.i18n.getString('SCHEDULED_POST_EDIT_SCHEDULED_TIME');
    cancelItem.textContent = $.i18n.getString('COMMON_CANCEL');

    editAudienceItem.addEventListener('click', function (e) {
        this.editAudiences(e.target)
    }.bind(this));
    editScheduleItem.addEventListener('click', this.showDatetimeInput);
    cancelItem.addEventListener('click', e => {
        var editPostMenu = this;
        var editBtn = this.nextElementSibling.children[1];

        editBtn.classList.remove('expand');

        this.classList.add('hide');
    });

    this.classList.add('hide');

    this.appendChild(editAudienceItem);
    this.appendChild(editScheduleItem);
    this.appendChild(cancelItem);
}


document.registerElement('scheduled-post', {
    prototype: scheduledPost
});

document.registerElement('datetime-modify', {
    prototype: datetimeModifyPrototype
});

document.registerElement('audience-modify', {
    prototype: audienceModifyPrototype
});

document.registerElement('scheduled-post-options', {
    prototype: optionsPrototype
});

document.registerElement('scheduled-post-menu', {
    prototype: menuPrototype
});