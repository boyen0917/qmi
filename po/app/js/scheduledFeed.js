var ScheduledFeed = function(modal) {
    this.modal = modal; 
    this.container = modal.children[0];  
};

ScheduledFeed.prototype.importData = function (postList) {
    console.log(this.container)
    var self = this;
    var groupMemberAllData = QmiGlobal.groups[gi].guAll || {};
    console.log(postList);
    postList.forEach(function (postData, index) {

        var feed = document.createElement('scheduled-post');
        var metaData = postData.meta;
        var authorData = groupMemberAllData[metaData.gu];
        var mainContent = postData.ml[0].c.replaceOriEmojiCode()

        feed.idNumber = postData.ei;
        feed.authorName = authorData.nk || "";
        feed.authorImage = authorData.aut ? authorData.aut : "images/common/others/empty_img_personal_l.png";
        feed.type = getEventTypeText(metaData.tp);
        feed.title = metaData.tt || ""; 
        feed.postTime = metaData.rts;
        feed.briefContent = mainContent;
        // feed.setAttribute("authorName", postData.name);
        // console.log(feed.getAttribute("class"))
        self.container.appendChild(feed);
        self.modal.style.display = 'block';
        // var feed = new Feed(postData);
        // var element = feed.create(index);

        // feed.editBtn.addEventListener('click', feed.toggleMenu);

        // element.querySelector("button.modify").addEventListener('click', feed.toggleMenu);

        // console.log(element)
    });
}


var scheduledPostPrototype = Object.create(HTMLElement.prototype);
var datetimeModifyPrototype = Object.create(HTMLElement.prototype);
var optionsPrototype = Object.create(HTMLElement.prototype);
var menuPrototype = Object.create(HTMLUListElement.prototype);

scheduledPostPrototype.attachedCallback  = function () {
    var menu = document.createElement('scheduled-post-menu');
    var options = document.createElement('scheduled-post-options');
    var datetimeModify = document.createElement('datetime-modify');
    var formatTime = new Date(this.postTime).customFormat("#YYYY#/#MM#/#DD# #hhh#:#mm#");
    var minEditTime = new Date(this.postTime + 15 * 60 * 1000).customFormat("#YYYY#-#MM#-#DD#T#hhh#:#mm#");
    var maxEditTime = new Date(this.postTime + 20 * 3600 * 24 * 365 * 1000).customFormat("#YYYY#-#MM#-#DD#T#hhh#:#mm#");

    this.innerHTML = `
        <div class='header'>
            <div class='left'><img src=${this.authorImage}></div>
            <div class='right'>
                <div class='name'>${this.authorName}</div>
                <div class='type'>
                    <img src='http://localhost:8081/devClearChats/po/app/images/compose/compose_box_bticon_post.png'>
                    <label>發布</label>
                    <span>${this.type}</span>
                    <mark class='title'>${this.title}</mark>
                </div>
                <div class='datetime'>
                    <div class='value'>${formatTime}</div>   
                </div>
            </div>
        </div>
        <div class='middle'>${this.briefContent}</div>
        <div class='footer'></div>
    `;

    datetimeModify.setAttribute('min', minEditTime);
    datetimeModify.setAttribute('max', maxEditTime);

    datetimeModify.finish = this.updatePostTime.bind(this);
    datetimeModify.cancel = this.cancelDatetimeEdit.bind(this);
    options.deleteFeed = this.delete.bind(this);
    menu.showDatetimeInput = this.showDatetimeInput.bind(this);
    menu.publishNow = this.publishNow.bind(this);

    this.datetimeModify = datetimeModify;
    this.menu = menu;
    this.options = options;

    this.querySelector("div.datetime").appendChild(datetimeModify);
    this.querySelector("div.footer").appendChild(menu);
    this.querySelector("div.footer").appendChild(options);
}

scheduledPostPrototype.delete = function () {
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
                toastShow(data.rsp_msg);
                self.remove();
            })
        }]
    )
}

scheduledPostPrototype.publishNow = function () {
    this.updatePostTime(0);
}

scheduledPostPrototype.showDatetimeInput = function () {
    this.datetimeModify.style.display = 'block';
    this.datetimeModify.previousElementSibling.style.display = 'none';
    this.menu.classList.add('hide');
    // this.menu.style.display = 'none'
    this.options.style.display = 'none'
}

scheduledPostPrototype.updatePostTime = function (datetime) {
    var self = this;

    new QmiAjax({
        apiName: "groups/" + gi + "/timelines/" + ti_feed+ "/present/events/" + this.idNumber + "/timestamp",
        method: 'put',
        body: {
            ct: datetime
        }
    }).success(function (data) {
        toastShow(data.rsp_msg);

        self.datetimeModify.previousElementSibling.textContent = newDate.customFormat("#YYYY#/#MM#/#DD# #hhh#:#mm#");
        self.cancelDatetimeEdit();
    })
}

scheduledPostPrototype.cancelDatetimeEdit = function () {
    this.options.style.display = 'block';
    this.datetimeModify.previousElementSibling.style.display = 'block';
    this.datetimeModify.style.display = 'none';
}

datetimeModifyPrototype.attachedCallback = function () {
    var datetimeInput = document.createElement('input');
    var confirmDiv = document.createElement('div');
    var editSpan = document.createElement('span');
    var cancelSpan = document.createElement('span');

    datetimeInput.type = "datetime-local";
    datetimeInput.required = true;
    datetimeInput.setAttribute("min", this.getAttribute('min'));
    datetimeInput.setAttribute("max", this.getAttribute('max'));
    datetimeInput.setAttribute("value", this.getAttribute('min'));

    datetimeInput.addEventListener('change', function (e) {
        var target = e.target;
        var validityState = target.validity;

        if (!validityState.valid) {
            datetimeInput.value = target.defaultValue;
        }
    })

    editSpan.textContent = $.i18n.getString('SCHEDULED_POST_EDIT');
    cancelSpan.textContent = $.i18n.getString('COMMON_CANCEL');

    // editSpan.addEventListener('click', this.finish.bind(null, endTime));
    editSpan.addEventListener('click', function (e) {
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

    cancelSpan.addEventListener('click', this.cancel);

    confirmDiv.appendChild(editSpan);
    confirmDiv.appendChild(cancelSpan);
    this.appendChild(datetimeInput);
    this.appendChild(confirmDiv);
}

optionsPrototype.attachedCallback = function () {
    var deleteBtn = document.createElement('button');
    var modifyBtn = document.createElement('button');

    deleteBtn.className = 'delete';
    modifyBtn.className = 'modify';

    deleteBtn.textContent = $.i18n.getString('SCHEDULED_POST_DELETE');
    modifyBtn.textContent = $.i18n.getString('SCHEDULED_POST_EDIT');

    modifyBtn.addEventListener('click', e => {
        var editPostMenu = this.previousElementSibling;
        var target = e.target;

        if (target.classList.contains("expand")) {
            target.classList.remove("expand")
        } else {
            target.classList.add("expand")
        }

        editPostMenu.classList.toggle('hide');
    })

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

    editAudienceItem.addEventListener('click', this.publishNow);
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
    prototype: scheduledPostPrototype
});

document.registerElement('datetime-modify', {
    prototype: datetimeModifyPrototype
});

document.registerElement('scheduled-post-options', {
    prototype: optionsPrototype
});

document.registerElement('scheduled-post-menu', {
    prototype: menuPrototype
});