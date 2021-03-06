$(document).ready(function(){

    var emailSettingArea = document.getElementById('email-setting');
    var noticeSettingArea = document.getElementById('notification-setting');
    var imgContent = $(".image-content");
    var tabContent = $(".tab-content-r");
    var userContent = $(".userSetting-content");
    var deleteAccountBtn = emailSettingArea.querySelector("div.delete-account>button");

    //系統設定事件
    tabContent.bind('input','.input-password', function (e) {
        passwordValidate(e);
    }).on('click','.password-btn.ready',function(){// 變更密碼
        passwordChange();
            // $(this).removeClass('ready');
    }).on('change','#no-option, #no-option1',function() {// 是否有變更

        var isOnMsgNotice = noticeSettingArea.querySelector('#no-option').checked;
        var isSoundable = noticeSettingArea.querySelector('#no-option1').checked;

        if ((($.lStorage("_sys_notification_switch") !== 1) ^ isOnMsgNotice) || 
            (($.lStorage("_sys_sound_switch") !== 1) ^ isSoundable)) {
            tabContent.find('.notification-btn').addClass('ready');
        } else {
            tabContent.find('.notification-btn').removeClass('ready');
        }
    }).on('click','.notification-btn.ready',function(){// 預設系統通知
            var isNotificationEable = noticeSettingArea.querySelector('#no-option').checked;
            var isSoundEable = noticeSettingArea.querySelector('#no-option1').checked;
            
            console.log(isSoundEable);
            $.lStorage("_sys_notification_switch", isNotificationEable ? 2 : 1);
            $.lStorage("_sys_sound_switch", isSoundEable ? 2 : 1);

            toastShow($.i18n.getString("CHANGE_SUCCESS"));

            $(this).removeClass('ready');

    }).on('change','input[type="radio"][name="group"]',function() {// 是否有變更
        tabContent.find('.default-group-btn').addClass('ready');
        if(tabContent.find('#'+QmiGlobal.auth.dgi).attr('checked')){
            tabContent.find(".default-group-btn").removeClass('ready');
        }
    }).on('click','.default-group-btn.ready',function(){// 預設團體
        defaultGroupSetting();
        $(this).removeClass('ready');
    }).on('change','input[type="radio"][name="second"]',function() {// 是否有變更
        tabContent.find('.carousel-btn').addClass('ready');
        if(tabContent.find("input[value='"+top_timer_ms+"']").attr('checked')){
            tabContent.find(".carousel-btn").removeClass('ready');
        }
    }).on('click','.carousel-btn.ready',function(){// 預設置頂時間
        var carousel_time = $("input[name$='second']:checked").val();
        top_timer_ms = carousel_time;
        toastShow("變更成功");
        $.lStorage('_topTimeMs',carousel_time);
        $(this).removeClass('ready');

        resetTopEventCarousel();
    });

    //變更個人資訊送出
    userContent.on('click','.userSetting-btn.ready',function(){
        userInfoUpdate();
        $(this).removeClass('ready');
    }).on('input','.input-username',function(){
        userContent.find('.userSetting-btn').addClass('ready');
        if(userContent.find(".input-username").val() == QmiGlobal.me.nk){
            userContent.find(".userSetting-btn").removeClass('ready');
        }else if(userContent.find(".input-username").val() == ""){
            userContent.find(".userSetting-btn").removeClass('ready');
        }
    });

    //變更使用者大頭貼
    imgContent.on('click','.user-avatar-img',function(){
        $('.setting-avatar-file').trigger("click");
    }).on('click','.camera-icon',function(){
        $('.setting-avatar-file').trigger("click");
    }).on('change','.setting-avatar-file',function(){// 選擇圖片
        var file_ori = $(this);
        var imageType = /image.*/;
        var file = file_ori[0].files[0];
        //每次選擇完檔案 就reset input file
        //file_ori.replaceWith( file_ori.val('').clone( true ) );              
        if (file.type.match(imageType)) {
            //是否存在圖片
            var reader = new FileReader();
            reader.onload = function(e) {
                $(".user-headshot").attr("src",reader.result);
            }
            reader.readAsDataURL(file);
            avatarPopup();
        } else {
            popupShowAdjust("", $.i18n.getString("COMMON_NOT_IMAGE") );
        }
    });

    deleteAccountBtn.addEventListener('click', function (e) {
        deleteAccount.remind();
    });
});

function avatarPopup() {
    var html =　'<div class="user-avatar-confirm">'+
           '<div class="avatar-content">'+
               '<div class="avatar-preview">'+
                   '<img class="user-headshot" src="">'+
               '</div>'+
               '<div class="avatar-btn-content">'+
                   '<button data-role="none" class="cancel-btn btn-b" data-textid="COMMON_CANCEL"></button>'+
                   '<button data-role="none" class="avatar-save btn-b" data-textid="COMMON_OK"></button>'+
               '</div>'+
            '</div>'+                           
    '</div>';
    
    var imgPopup = $(html);
    imgPopup._i18n();
    $("body").append(imgPopup);
    var userAvatar = $('.user-avatar-confirm');
    userAvatar.fadeIn();
    //儲存圖片
    userAvatar.find('.avatar-save').click(function(){
        //https://ap.qmi.emome.net/apiv1/
        // USAGE: 
        qmiUploadFile({
            urlAjax: {
                apiName: "me/avatar",
                method: "put"
            },
            isPublicApi: true,
            file: userAvatar.find(".user-headshot")[0],
            oriObj: {w: 1280, h: 1280, s: 0.7},
            tmbObj: {w: 480, h: 480, s: 0.6},
            tp: 1 // ;
        }).done(function(data) {
            console.log("finish", data);
            QmiGlobal.me.auo = data.data.ou;
            QmiGlobal.me.aut = data.data.tu;
            $("#userInfo").find(".user-avatar-setting").attr("src",data.data.tu);
            toastShow(data.data.rsp_msg);
        });

        var reader = new FileReader();
        var file_ori = $('.setting-avatar-file');
        var image_file = file_ori[0].files[0];
        reader.onload = function(e) {
            var img = $(".user-avatar-img");
            img.attr("src",reader.result);
        }
        reader.readAsDataURL(image_file);        
        imgPopup.remove();
        userAvatar.fadeOut();
        $('input[type="file"]').val(null);
    });
    //取消
    $('.cancel-btn').click(function(){
        imgPopup.remove();
        userAvatar.fadeOut();
        $('input[type="file"]').val(null);
    });
}

function guihu(){
    var html = '<div class="guihu-confirm">'+
        '<div class="edit-guihu-content">'+
            '<div class="guihu-title-content">'+
                '<div class="guihu-title"></div>'+
                '<div class="guihu-des"></div>'+
            '</div>'+
            '<div class="guihu-input-content">'+
                '<input type="text" data-role="none" placeholder="E-mail">'+
                '<input type="password" data-role="none" placeholder="Password">'+
            '</div>'+
            '<div class="guihu-btn-content">'+
                '<button class="guihu-cancel-btn btn-b" data-role="none">取消</button>'+
                '<button class="btn-b" data-role="none">確認</button>'+
            '</div>'+
        '</div>'+
    '</div>';
    var guihuPop = $(html);
    $("body").append(guihuPop);
    var editGuihu = $(".guihu-confirm");
    editGuihu.fadeIn();

    $(".guihu-cancel-btn").click(function(){
        guihuPop.remove();
        editGuihu.fadeOut();
    });
    $(".guihu-btn-content").on('click',".add-btn",function(){
        guihuPop.remove();
        editGuihu.fadeOut();
    });
    $(".guihu-btn-content").on('click',".save-btn",function(){
        guihuPop.remove();
        editGuihu.fadeOut();
    });
}

//user Info Setting
userInfoSetting = function(){

    $(".userSetting-btn").removeClass("ready");
    var userInformation = $("#userInformation-page");
    userInformation.find(".user-avatar-img").attr('src',QmiGlobal.me.aut).end()//大頭照
                       .find(".input-username").val(QmiGlobal.me.nk);//first name
}

//取得個人資訊
userInfoGetting = function(){

    var userInfo = $("#userInfo");
    var emptyUserAvt = "images/common/others/empty_img_personal_l.png";
    return new QmiAjax({
        apiName: "me",
        isPublicApi: true
    }).success(function(data){
        QmiGlobal.me = data;
        //左下角個人資料 使用者名稱 手機 頭像
        var account = QmiGlobal.auth.isSso ? data.em: data.pn;

        userInfo.find(".user-name").text(data.nk).end()
                .find(".user-account").text(account).end()
                .find(".user-avatar-setting").attr("src",data.aut);
        if(data.nk === "") userInfo.find(".user-name").html("&nbsp;")
        if(!data.aut){
            userInfo.find(".user-avatar-setting").attr("src",emptyUserAvt);
            QmiGlobal.me.aut = emptyUserAvt;
            QmiGlobal.me.auo = emptyUserAvt;
        }
    }).error(function(e){
        console.debug(e.responseText);
    });
}

//更新使用者名稱
userInfoUpdate = function(){
    
    var username_input = $('.input-username').val();
    new QmiAjax({
        apiName: "me",
        method: "put",
        body: {
            "nk": username_input
        },
        isPublicApi: true
    }).success(function(data){
        toastShow(data.rsp_msg);
        $(".user-name").text(username_input); 
        QmiGlobal.me.nk = username_input;
    }).error(function(e){
        console.debug(e.responseText);
    });
}

//system setting 
systemSetting = function(){

    var this_dgi = $.lStorage("_loginData").dgi;
    var group_data = QmiGlobal.groups;
    var this_goup_data = group_data[gi];
    var notification

    var systemSettingTabs = $("#systemSetting-page ul.system-tab");
    var systemGroup = $("#group-setting");  
    $(".notification-btn,.default-group-btn,.carousel-btn").removeClass("ready");
    //系統設定初始化
    var emailSetting = $("#email-setting");

    new QmiAjax({
        apiName: "me/accounts",
    }).success(function (data) {

        var phone, email;
        var bindEmailBtn = emailSetting.find("div.edit-email-content button");
        if (data.al) {
            data.al.forEach(function(account) {
                if (account.tp == 0) {
                    phone = account.id;
                    emailSetting.find("input[name$='user-edit-phone']").val(account.id);
                } else if (account.tp == 1) {
                    email = account.id;
                }
            });
        }

        if (email) {
            emailSetting.find("input[name$='user-edit-email']").val(email);
            emailSetting.find("div.edit-email-content button").addClass("bind")
                .text($.i18n.getString("SYSTEM_ACCOUNT_SETTING_REMOVE"));
        } else {
            emailSetting.find("input[name$='user-edit-email']").val("");
            emailSetting.find("div.edit-email-content button").removeClass("bind")
                .text($.i18n.getString("SYSTEM_ACCOUNT_SETTING_SET"));
        }


        emailSetting.find("div.edit-phone-content button").off('click').on("click", function (e) {
            if (email) {
                bindAccount.process(false);
            } else {
                toastShow($.i18n.getString('SYSTEM_ACCOUNT_SETTING_SET_EMAIL_TEXT'));
            }
        })

        emailSetting.find("div.edit-email-content button").off('click').on("click", function (e) {
            if (email) {
                bindAccount.remove(email);
            } else {
                bindAccount.process(true);
            }
        })
    })
    
    

    //密碼
    if (QmiGlobal.auth && QmiGlobal.auth.isSso) { // ldap帳號，隱藏修改密碼設定
        systemSettingTabs.children("li[data-tab='password-setting']").hide()
        emailSetting.find("div.delete-account").hide();
    }

    $("#password-setting").find(".input-password").val("");
    
    //預設系統通知
    if ($.lStorage("_sys_notification_switch")) {
        $("#no-option").attr('checked', $.lStorage("_sys_notification_switch") == 2);
    } else {
        $("#no-option").attr('checked', true);
    }

    if ($.lStorage("_sys_sound_switch")) {
        $("#no-option1").attr('checked', $.lStorage("_sys_sound_switch") == 2);
    } else {
        $("#no-option1").attr('checked', true);
    }

    //預設團體
    var me_dgi = QmiGlobal.auth.dgi;
    //預設置頂自動換頁   
    $("#carousel-setting").find("input[value='"+top_timer_ms+"']").attr('checked', true);

    //團體列表
    systemGroup.find('.group-option').remove();

    Object.keys(QmiGlobal.groups).forEach(function(currGi) {
        var currGrpObj = QmiGlobal.groups[currGi];
        var groupOptionHtmlStr = 
            "<div class='group-option'>"+ 
                "<input id='"+ currGi +"' data-role='none' name='group' type='radio' value='"+ currGi +"'>"+ 
                "<label for='"+ currGi +"' class='radiobtn'></label>"+ 
                "<img class='group-pic' data-gi='"+ currGi +"' src='"+ (currGrpObj.aut || QmiGlobal.emptyGrpPicStr) +"'>"+ 
                "<label for='"+ currGi +"' class='radiotext'>"+ currGrpObj.gn._escape() +"</label>"+ 
            "</div>";
        //產生團體列表
        systemGroup.find('.edit-defaultgroup-content').append(groupOptionHtmlStr);
    });

    //勾選預設群組
    systemGroup.find('#'+me_dgi).attr('checked', true);
}

passwordValidate = function (e) {
    var pwSetting = $("#password-setting");
    var inputTarget = $(e.target);
    var notAllEmpty = true;
    var newPwdIsValid = true;

    pwSetting.find(".input-password").each(function(i,val){
        if($(this).val() == ""){
            notAllEmpty = false;
        }
    });

    switch (inputTarget.attr("name")) {
        case "n-password" :
            console.log(inputTarget);
            console.log(inputTarget.siblings("input[name='v-password']"));
            if (inputTarget.val().length < 8 && inputTarget.siblings("input[name='v-password']").length < 8) {
                newPwdIsValid = false;
            }
            break;

        case "v-password" :
            if (inputTarget.val().length < 8 && inputTarget.siblings("input[name='n-password']").length < 8) {
                newPwdIsValid = false;
            }
            break;
    }

    if (notAllEmpty && newPwdIsValid) {
        pwSetting.find('.password-btn').addClass('ready');
    } else {
        pwSetting.find('.password-btn').removeClass('ready');
    }
}

// 變更密碼
passwordChange = function(){
        //$("input[name$='user-edit-o-password']").val()
        var pwSetting = $("#password-setting");
        var authData = QmiGlobal.auth;
        // var deferred = $.Deferred();
        var oldPassword = pwSetting.find("input[name$='o-password']").val(),
            firstNewPassword = pwSetting.find("input[name$='n-password']").val(),
            secondNewPassword = pwSetting.find("input[name$='v-password']").val()

        //驗證前後新密碼是否一致
        if (firstNewPassword == secondNewPassword) {
            // 企業帳號改密碼
            if (authData && authData.isSso && authData.rsp_code === 105) {
                new QmiAjax({
                    url: "https://" + authData.url + "/apiv1/company_accounts/" + authData.ci + "/users/password",
                    method: "put",
                    body: {
                        id: authData.id,
                        dn: QmiGlobal.device,
                        op: QmiGlobal.aesCrypto.enc(oldPassword, (authData.id + "_" + QmiGlobal.device).substring(0, 16)),
                        np: QmiGlobal.aesCrypto.enc(firstNewPassword, (authData.id + "_" + QmiGlobal.device).substring(0, 16)),
                    }
                }).done(function(rspData) {
                    if (rspData.status == 200) {
                        QmiGlobal.PopupDialog.close();
                        toastShow($.i18n.getString("ENTERPRISE_ACCOUNT_CHANGE_PASSWORD_SUCCESS"));
                        pwSetting.find(".input-password").val("");
                        pwSetting.find('.password-btn').removeClass('ready');
                    }
                });

            } else { // 一般帳號改密碼
                var user_login = $.lStorage("_loginData");

                new QmiAjax({
                    apiName : "me/password/auth",
                    body : JSON.stringify({
                        "pw" : toSha1Encode(oldPassword)
                    }),
                    method: "post",
                    isPublicApi: true
                }).success(function(password_data) {

                    new QmiAjax({
                        apiName : "me/password",
                        body : JSON.stringify({
                            "op" : toSha1Encode(pwSetting.find("input[name$='o-password']").val()),
                            "up" : toSha1Encode(pwSetting.find("input[name$='n-password']").val())
                        }),
                        method : "put",
                        isPublicApi: true
                    }).success(function(verify_data) {
                        toastShow(verify_data.rsp_msg);
                        QmiGlobal.auth.at = verify_data.at;
                        at = verify_data.at;
                        user_login.at = verify_data.at;
                        $.lStorage("_loginData", user_login);
                        pwSetting.find(".input-password").val("");
                        pwSetting.find('.password-btn').removeClass('ready');
                    }).error(function(e) {
                        popupShowAdjust(e.rsp_msg);
                    });
                }).error(function(e){
                    // popupShowAdjust("原密碼有誤", "" ,true);
                    console.debug(e.responseText);
                });
            }
        } else {
            popupShowAdjust($.i18n.getString("ENTERPRISE_ACCOUNT_SET_PASSWORD_NOT_MATCH"), "" , true);
            pwSetting.find("input[name$='v-password']").val("");
            pwSetting.find('.password-btn').removeClass('ready');
        }
}//密碼更新

//更新預設團體
defaultGroupSetting = function(){
    var new_dgi = $("input[name$='group']:checked").val()
    new QmiAjax({
        apiName : "groups/"+new_dgi+"/default",
        isPublicApi: true,
        method: "put"
    }).success(function(data){

        toastShow(data.rsp_msg);

        QmiGlobal.auth.dgi = new_dgi;
        var user_login = $.lStorage("_loginData");
        user_login.dgi = new_dgi;//變更的預設團體id
        $.lStorage('_loginData',user_login);//上傳local storage

    }).error(function(e){
        popupShowAdjust("error");
    });
}



// ldap
QmiGlobal.module.ldapSetting = {
    id: "view-ldap-setting",

    currPage: "ldap-list",

    init: function() {
        var self = this;

        self.view = $("<section>", {
            id: self.id,
            class: "subpage-ldapSetting main-subpage",
            html: self.html()
        });

        // 防止 reAuthUILock
        $("#page-group-main .gm-content").find(".refresh-lock").hide().end()
        .find(".gm-header-right").show().end()
        .find(".gm-content-body").show();


        if($("#view-ldap-setting").length !== 0) $("#view-ldap-setting").remove();
        $("#page-group-main .subpage-ldapSetting").append(self.view);

        self.currPage = "ldap-list";
        self.getList().done(function() {
            QmiGlobal.eventDispatcher.subscriber([
                {
                    veId: "goto", 
                    elemArr: self.view.find("[target]"), 
                    eventArr: ["click"]
                },{
                    veId: "create-ready", 
                    elemArr: self.view.find(".ldap-edit .input-block input"), 
                    eventArr: ["input"],
                },{
                    veId: "create-submit", 
                    elemArr: self.view.find(".ldap-edit button.submit"), 
                    eventArr: ["click"],
                },{
                    veId: "create-cancel", 
                    elemArr: self.view.find(".ldap-edit button.cancel"), 
                    eventArr: ["click"],
                },{
                    veId: "list-action", 
                    elemArr: self.view.find(".ldap-list .list"), 
                    eventArr: ["click"],
                }
            ], self, true);
        });
        
    },

    handleEvent: function() {
        var self = this;
        var targetDom = $(event.detail.elem);

        // event.type -> click:view-auth-manually-submit
        var eventTpArr = event.type.split(":");
        switch(`${eventTpArr[0]}:${eventTpArr[2]}`) {
            case "click:goto":
                var pageName = targetDom.attr("target");

                // sso登入 不去綁定帳號頁面
                if(QmiGlobal.auth.isSso && pageName === "ldap-edit") return;

                if(pageName === "ldap-edit") {
                    self.clearForm();
                    self.view.find(".ldap-edit").attr("ldap-type", "add");
                }
                self.changePage(pageName);
                break;
            case "input:create-ready":
                var chk = false;
                self.view.find(".ldap-edit input").each(function(i, elem) {
                    if(elem.value === "") chk = true;
                })
                var submitElem = self.view.find(".ldap-edit button.submit");
                if(chk === false) submitElem.addClass("ready");
                else submitElem.removeClass("ready")

                break;

            case "click:create-submit":
                if(targetDom.hasClass("ready") === false) return;

                self.inputAccount = self.view.find(".ldap-edit .input-block.email input").val();
                self.inputPassword = self.view.find(".ldap-edit .input-block.password input").val();

                var method = self.view.find(".ldap-edit").attr("ldap-type");
                self[method]();

                break;

            case "click:create-cancel":
                self.changePage("ldap-list");

                break;

            // 解除綁定
            case "click:list-action":
                var targetDom = $(event.detail.target),
                    accountDom = targetDom.parent();

                self.clearForm();

                // 重新驗證
                if( (accountDom.hasClass("expired") || targetDom.hasClass("expired"))
                    && targetDom.hasClass("unbind-img") === false
                ) {
                    self.view.find(".ldap-edit").attr("ldap-type", "check")
                    .find(".input-block.email input").val((accountDom.data("company-data") || targetDom.data("company-data")).id);

                    self.changePage("ldap-edit");

                // 點選刪除
                } else if(targetDom.hasClass("unbind-img")) {
                    self.view.find(".ldap-edit").attr("ldap-type", "delete")
                    .find("div.input-block.email input").val(accountDom.data("company-data").id);

                    if(QmiGlobal.auth.isSso)
                        self.view.find("section.ldap-edit div.title.two").attr("pi", accountDom.data("company-data").pi);

                    self.changePage("ldap-edit");
                }
                break;
        }
    },

    getList: function(isReload) {
        var self = this;
        var getListDef = $.Deferred();

        if(self.currPage !== "ldap-list") return;

        self.view.find(".ldap-list .index[has-data]").hide();

        // 取得列表
        new QmiAjax({
            apiName: "me/sso",
            noErr: true,
            isPublicApi: true,
        }).success(function(rspObj) {
            var ldapList = rspObj.cl || [];
            var expireObj = {};

            if(rspObj.tp === 2) expireObj = self.expireChk(ldapList);
            if(rspObj.tp === 1) {
                self.view.find(".ldap-add").hide();
                ldapList = [rspObj];
            } else self.view.find(".ldap-add").show();

            var container = self.view.find(".ldap-list .list");
            container.html("");

            ldapList.forEach(function(item) {
                var account = $("<div "+ (expireObj[item.ci] ? "class='expired'" : "") +" err-msg='"+ $.i18n.getString("ACCOUNT_BINDING_AUTHORIZATION_EXPIRED") +"'>"
                     + "<span>"+ (QmiGlobal.auth.isSso ? item.pi : item.id) +"</span><span class='unbind-img'></span>"
                     + "</div>");

                container.append(account);
                account.data("company-data", item);
            });
            self.view.find(".ldap-list .index[has-data="+ !!ldapList.length +"]").show();

        }).error(function(errData) {
            console.log("get list error", errData);
        }).complete(getListDef.resolve);

        return getListDef.promise();
    },

    expireChk: function(ldapList) {
        var self = this;
        var expireObj = {};

        ldapList.forEach(function(ldapData) {
            var companyData = QmiGlobal.companies[ldapData.ci];
            if(companyData === undefined) return;
            // 判斷過期;
            if(companyData.et - (new Date().getTime()) < 0) {
                expireObj[companyData.ci] = true;
                // 順便做lock
                QmiGlobal.module.reAuthUILock.lock(companyData);
            }
        });
        return expireObj;
    },

    add: function() {
        var self = this;
        var ssoAccount = self.inputAccount;
        var ssoPassword = self.inputPassword;
        var ssoData;
        var msgShowDef = $.Deferred();
        var submitCompleteDef = $.Deferred();

        self.view.addClass("cover");

        var chainDef = MyDeferred();

        // step 1
        new QmiAjax({
            apiName: "me/sso/step1",
            isPublicApi: true,
            errHide: true,
            method: "post",
            body: {id: ssoAccount}
        }).done(function(rspData) {
            try {
                var rspObj = JSON.parse(rspData.responseText);
                switch(rspObj.tp) {
                    case 1: // 已被綁定 詢問後繼續綁定
                        new QmiGlobal.popup({
                            desc: rspObj.rsp_msg,
                            cancel: true,
                            confirm: true
                        }).done(function(isConfirm) {
                            if(!isConfirm) return;
                            chainDef.resolve(rspObj);
                        });
                        break;
                    case 2: // 可以綁定
                        chainDef.resolve(rspObj); 
                        break;
                    default: // 驗證失敗？
                        submitCompleteDef.reject(errObjInit(rspData, "not valid user"));
                        chainDef.resolve(); // step2 會 catch error
                }
            } catch(e) {
                chainDef.reject(errObjInit(errData, "step1 parse error"));
            }

        }).fail(chainDef.reject);

        chainDef.then(function(rspData) {
            var chainDef2 = MyDeferred();

            var password = QmiGlobal.aesCrypto.enc(
                ssoPassword, 
                ssoAccount.substring(0,16)
            );

            ssoData = rspData;

            new QmiAjax({
                url: "https://" + ssoData.url + "/apiv1/me/sso/step2",
                specifiedHeaders: {li: lang},
                errHide: true,
                method: "post",
                body: {
                    id: ssoAccount,
                    dn: QmiGlobal.device,
                    pw: password,
                    ci: ssoData.ci,
                    cdi: ssoData.cdi
                }
            }).done(function(rspData) {
                try {
                    chainDef2.resolve(JSON.parse(rspData.responseText));
                } catch(e) {
                    chainDef2.reject(errObjInit(rspData, "step2 parse error"));
                }
            }).fail(chainDef2.reject);

            return chainDef2;

        // step1 error 
        }, function(errData) {submitCompleteDef.reject(errObjInit(errData, "step1 error"))})
        .then(function(step2Data) {
            if(step2Data === undefined || step2Data.key === undefined) {
                submitCompleteDef.reject(errObjInit({
                    responseText: JSON.stringify(step2Data)
                }));
                return;
            }
            // step3
            new QmiAjax({
                apiName: "me/sso/step3",
                isPublicApi: true,
                errHide: true,
                method: "post",
                body: {
                    id: ssoAccount,
                    key: step2Data.key,
                    ci: ssoData.ci,
                    cdi: ssoData.cdi
                }
            }).done(function(rspData) {
                try {
                    submitCompleteDef.resolve(JSON.parse(rspData.responseText));
                } catch(e) {
                    submitCompleteDef.reject(errObjInit(errData, "step3 parse error"));
                }
            }).fail(function(errData) {
                submitCompleteDef.reject(errObjInit(errData, "step3 error"))
            });

        // step2 error
        }, function(errData) {submitCompleteDef.reject(errObjInit(errData, "step2 error"))})

        var resultMsg = "";

        submitCompleteDef.done(function(rspObj) {
                
            msgShowDef.done(function(){
                // 更新團體列表
                self.changePage("ldap-list");
                groupMenuListArea();
                toastShow(rspObj.rsp_msg)
            });
            

        }).fail(function(failData) {
            try {
                var errMsg = JSON.parse(failData.errData.responseText).rsp_msg;
            } catch(e) {
                var errMsg = $.i18n.getString("COMMON_UNKNOWN_ERROR");
            }

            self.clearForm();
            msgShowDef.done(function(){toastShow(errMsg)});
        }).always(function() {
            setTimeout(function() {
                msgShowDef.resolve();
                self.view.removeClass("cover");
            }, 1000);
        });

        function errObjInit(errData, msg) {
            return {
                isSuccess: false,
                errData: errData,
                msg: msg
            }
        }
    },

    check: function() {
        var self = this;
        var msgShowDef = $.Deferred();

        var self = this, ldapCi;
        // 判斷帳號是否存在ldapCompanies中
        Object.keys(QmiGlobal.ldapCompanies).forEach(function(thisCi) {
            if(QmiGlobal.ldapCompanies[thisCi].id === self.inputAccount) ldapCi = thisCi;
        });

        var ldapData = QmiGlobal.ldapCompanies[ldapCi];

        self.view.addClass("cover");

        new QmiAjax({
            url: "https://"+ ldapData.cl +"/apiv1/sso/"+ ldapData.ci +"/auth",
            specifiedHeaders: {li: lang},
            method: "put",
            errHide: true,
            body: {
                id: self.inputAccount,
                dn: QmiGlobal.device,
                pw: QmiGlobal.aesCrypto.enc(self.inputPassword, self.inputAccount.substring(0,16))
            }
        }).success(function(authObj) {
            console.log("success", authObj);
            // 設定新at , et
            QmiGlobal.companies[ldapData.ci].at = authObj.at;
            QmiGlobal.companies[ldapData.ci].et = authObj.et;

            QmiGlobal.module.reAuthUILock.unlock(ldapData);

            msgShowDef.done(function(){
                self.changePage("ldap-list");

                self.view.removeClass("cover");
                toastShow(authObj.rsp_msg);
            });

        }).error(function(rspData) {
            console.log("error", rspObj);
            try {
                var errMsg = JSON.parse(rspData.errData.responseText).rsp_msg;
            } catch(e) {
                var errMsg = $.i18n.getString("COMMON_UNKNOWN_ERROR");
            }

            msgShowDef.done(function(){
                toastShow(errMsg);
                self.view.removeClass("cover");
            });

        }).complete(function() {
            setTimeout(function() {
                msgShowDef.resolve();
            }, 1000);
        })

    },

    delete: function() {
        var self = this;
        var ldapCi;
        var ldapData;
        // 判斷帳號是否存在ldapCompanies中
        if(QmiGlobal.auth.isSso) {
            ldapData = QmiGlobal.companies[Object.keys(QmiGlobal.companies)[0]];
        } else {
            Object.keys(QmiGlobal.ldapCompanies).forEach(function(thisCi) {
                if(QmiGlobal.ldapCompanies[thisCi].id === self.inputAccount) ldapCi = thisCi;
            });
            ldapData = QmiGlobal.ldapCompanies[ldapCi];
        }
            
        var msgShowDef = $.Deferred();
        self.view.addClass("cover");

        if(!QmiGlobal.isDefResolved(QmiGlobal.companies[ldapCi].reAuthDef))
            QmiGlobal.companies[ldapCi].reAuthDef.resolve({isSuccess: false})

        new QmiAjax({
            url: "https://" + ldapData.cl + "/apiv1/me/sso/",
            specifiedHeaders: {
                li: lang,
                uui: QmiGlobal.auth.ui,
                uat: QmiGlobal.auth.at,
                ui: ldapData.ui,
                at: ldapData.nowAt
            },
            errHide: true,
            method: "put",
            body: {
                id: self.inputAccount,
                pw: QmiGlobal.aesCrypto.enc(
                    self.inputPassword, 
                    self.inputAccount.substring(0,16)
                ),
                dn: QmiGlobal.device,
                ci: ldapData.ci,
                cdi: ldapData.cdi
            }
        }).success(function(rspObj) {
            msgShowDef.done(function(){
                // 更新團體列表
                self.changePage("ldap-list");
                groupMenuListArea().done(function() {

                    if(Object.keys(QmiGlobal.groups).length === 0) {
                        gi === null;
                        $.mobile.changePage("#page-group-menu");

                    // 當前團體不存在了 去預設團體或第一團體
                    } else if(QmiGlobal.groups[gi] === undefined) {
                        var toGi = QmiGlobal.dgi;
                        if(QmiGlobal.groups[toGi] === undefined || toGi === undefined) toGi = Object.keys(QmiGlobal.groups)[0];

                        timelineChangeGroup(toGi);
                    }
                    
                    self.view.removeClass("cover");
                    toastShow(rspObj.rsp_msg);
                });
                
            });
            
        }).error(function(errData) {
            try {
                var errMsg = JSON.parse(errData.responseText).rsp_msg;
            } catch(e) {
                var errMsg = $.i18n.getString("COMMON_UNKNOWN_ERROR");
            }

            msgShowDef.done(function(){
                toastShow(errMsg);
                self.view.removeClass("cover");
            });
        }).complete(function() {
            setTimeout(function() {
                msgShowDef.resolve();
            }, 1000);
        })
    },

    clearForm: function() {
        var self = this;
        self.view.find(".ldap-edit .input-block.email input").val("");
        self.view.find(".ldap-edit .input-block.password input").val("");

        self.inputAccount = "";
        self.inputPassword = "";

        self.view.find(".ldap-edit button.submit").removeClass("ready")

        if(QmiGlobal.auth.isSso) 
            self.view.find("section.ldap-edit div.title.two").attr("pi", "");
    },

    changePage: function(pageName) {
        var self = this;
        self.currPage = pageName;

        switch(pageName) {
            case "ldap-list":
                self.getList();
                break;
            case "ldap-edit":
                // title                
                var editPageDom = self.view.find(".ldap-edit");
                editPageDom.find(".title.one").attr("style", "display:none").end()
                .find(".title.one."+editPageDom.attr("ldap-type")).attr("style", "display:block");
                break;
        }

        self.view.find("[role=page]").hide().end()
        .find("." + pageName + "[role=page]").fadeIn(100);
    },

    strMap: {
        // 0 是公雲; 1是 sso
        add: ["ACCOUNT_BINDING_BINDING_LDAP_ACCOUNT", "ACCOUNT_BINDING_BIND_QMI_ACCOUNT"],
        noData1: ["ACCOUNT_BINDING_PRESS_TO_BIND_LDAP_ACCOUNT", "WEBONLY_ACCOUNT_BINDING_SSO_NODATA1"],
        noData2: ["WEBONLY_ACCOUNT_BINDING_NEW_ACCOUNT", "WEBONLY_ACCOUNT_BINDING_SSO_NODATA2"],
        write: function(type) {
            return $.i18n.getString(this[type][+(QmiGlobal.auth.isSso || false)]);
        }
    },

    html: function() {
        return "<section class='content'>"
        + "<section class='ldap-list' role='page'>"
        + "    <div class='ldap-add' target='ldap-edit'>+ "+ this.strMap.write("add") +"</div>"
        + "    <div class='no-data index' target='ldap-edit' has-data='false'><div>"+ this.strMap.write("noData1") +"</div><div>"+ this.strMap.write("noData2") +"</div></div>"
        + "    <div class='list index' has-data='true'></div>"
        + "</section>"
        + "<section class='ldap-edit' role='page' ldap-type='add'>"
        + "    <section class='icon-shield'></section>"
        + "    <div class='title one add' content='"+ $.i18n.getString("ACCOUNT_BINDING_BINDING_LDAP_ACCOUNT") +"'></div>"
        + "    <div class='title one check' content='"+ $.i18n.getString("ACCOUNT_BINDING_ACCOUNT_RECERTIFICATION") +"'></div>"
        + "    <div class='title one delete' content='"+ $.i18n.getString("ACCOUNT_BINDING_DISCONNECT_ACCOUNT") +"'></div>"
        +   (function() {
                var string = "ACCOUNT_BINDING_ENTER_ACCOUNT_PASSWORD";
                if(QmiGlobal.auth.isSso) string = "ACCOUNT_BINDING_DISCONNECT_QMI_ACCOUNT_CONFIRM";
                
                return "<div class='title two' content='"+ $.i18n.getString(string) +"'></div>";
            })()
        + "    <section class='edit-form'>"
        + "    <div class='input-block email'><input placeholder='email'></div>"
        + "    <div class='input-block password'><input placeholder='password' type='password'></div>"
        + "    <div class='submit-block'>"
        + "    <button class='cancel'>"+ $.i18n.getString("ACCOUNT_BINDING_CANCEL") +"</button>"
        + "    <button class='submit'>"+ $.i18n.getString("ACCOUNT_BINDING_DONE") +"</button></div>"
        + "</section></section>";
    }
}

var deleteAccount = {
    remind: function () {
        QmiGlobal.PopupDialog.create({
            className: 'remind-before-delete',
            header: $.i18n.getString('ACCOUNT_MANAGEMENT_REMIND'),
            content: [{
                    tagName: 'div',
                    text: $.i18n.getString('ACCOUNT_MANAGEMENT_DELETE_ACCOUNT_WARNING'),
                    attributes: {
                        class: lang == "en_US" ? "main multi-line" : "main"
                    }
                }, {
                    tagName: 'div',
                    attributes: {
                        class: "more"
                    },
                    children: [
                        {
                            tagName: 'p',
                            text: $.i18n.getString('ACCOUNT_MANAGEMENT_DELETE_ACCOUNT_DETAIL'),
                        }, {
                            tagName: 'span',
                            text: $.i18n.getString('ACCOUNT_MANAGEMENT_DELETE_ACCOUNT_USER_AGREEMENT'),
                            eventType: 'click',
                            eventHandler: function (e) {
                                e.preventDefault();
                                window.open("user_agreement.html", "" , "width=600, height=600");
                            }
                        }, {
                            tagName: 'text',
                            text: " "+ $.i18n.getString('ACCOUNT_MANAGEMENT_DELETE_ACCOUNT_AND') + " ",
                        }, {
                            tagName: 'span',
                            text: $.i18n.getString('ACCOUNT_MANAGEMENT_DELETE_ACCOUNT_PRIVACY_POLICY'),
                            eventType: 'click',
                            eventHandler: function (e) {
                                e.preventDefault();
                                window.open("privacy_policy.html", "" , "width=600, height=600");
                            }
                        }
                    ]
                }
            ],
            footer: [
                {
                    tagName: 'button',
                    text: $.i18n.getString('ACCOUNT_MANAGEMENT_CANCEL'),
                    eventType: 'click',
                    eventHandler: function (e) {
                        QmiGlobal.PopupDialog.close();
                    }
                }, {
                    tagName: 'button',
                    text: $.i18n.getString('COMMON_DELETE'),
                    attributes: {
                        class: 'delete'
                    },
                    eventType: 'click',
                    eventHandler: function (e) {
                        QmiGlobal.PopupDialog.close().then(function () {
                            deleteAccount.enterPassword();
                        });
                    }
                }
            ]
        }).open();
    },

    enterPassword: function () {
        QmiGlobal.PopupDialog.create({
            className: 'enter-password',
            header: $.i18n.getString('ACCOUNT_MANAGEMENT_ENTER_PASSWORD'),
            content: [
                {
                    tagName: 'input',
                    attributes: {
                        type: 'password',
                        placeholder: $.i18n.getString('ACCOUNT_BINDING_PASSWORD')
                    }
                }
            ],

            footer: [
                {
                    tagName: 'button',
                    text: $.i18n.getString('ACCOUNT_MANAGEMENT_CANCEL'),
                    eventType: 'click',
                    eventHandler: function (e) {
                        QmiGlobal.PopupDialog.close();
                    }
                }, {
                    tagName: 'button',
                    text: $.i18n.getString('ACCOUNT_MANAGEMENT_DONE'),
                    eventType: 'click',
                    eventHandler: function (e) {
                        var dialog = document.querySelector("#popupDialog>div.container>div.enter-password");
                        var passwordValue = dialog.querySelector('div.content>input').value
                        
                        new QmiAjax({
                            apiName: "me/accounts/destroy/step1",
                            method: "post",
                            body: {
                                pw: toSha1Encode(passwordValue)
                            }
                        }).complete(function (data) {
                            var result = $.parseJSON(data.responseText)
                            if (data.status == 200) {
                                toastShow(result.rsp_msg);
                                QmiGlobal.PopupDialog.close().then(function () {
                                    deleteAccount.verifyCode(result.key);
                                });
                            }
                        });
                    }
                }
            ]
        }).open();
    },

    verifyCode: function (resendKey) {
        QmiGlobal.PopupDialog.create({
            className: 'verification-code',
            header: $.i18n.getString('ACCOUNT_MANAGEMENT_VERIFICATION_CODE'),
            content: [
                {
                    tagName: 'div',
                    text: $.i18n.getString('ACCOUNT_MANAGEMENT_VERIFICATION_CODE_SENT') + QmiGlobal.me.pn
                }, {
                    tagName: 'input',
                    attributes: {
                        type: 'text',
                        placeholder: $.i18n.getString('ACCOUNT_MANAGEMENT_VERIFICATION_CODE_ENTER'),
                        maxlength: 6
                    }
                }, {
                    tagName: 'p',
                    text: $.i18n.getString('ACCOUNT_MANAGEMENT_DIDNT_RECEIVE')
                }, {
                    tagName: 'span',
                    text: $.i18n.getString('ACCOUNT_MANAGEMENT_RESEND'),
                    eventType: 'click',
                    eventHandler: function (e) {
                        new QmiAjax({
                            apiName: "me/accounts/destroy/resend",
                            method: "post",
                            body: {
                                key: resendKey
                            }
                        }).complete(function (data) {
                            var result = $.parseJSON(data.responseText)
                            if (data.status == 200) {
                                resendKey = result.key;
                                toastShow(result.rsp_msg);
                            }
                        });
                    }
                }
            ],

            footer: [
                {
                    tagName: 'button',
                    text: $.i18n.getString('ACCOUNT_MANAGEMENT_CANCEL'),
                    eventType: 'click',
                    eventHandler: function (e) {
                        QmiGlobal.PopupDialog.close();
                    }
                }, {
                    tagName: 'button',
                    text: $.i18n.getString('ACCOUNT_MANAGEMENT_DONE'),
                    eventType: 'click',
                    eventHandler: function (e) {
                        var dialog = document.querySelector("#popupDialog>div.container>div.verification-code");
                        var verificationCode = dialog.querySelector('div.content>input').value
                        
                        new QmiAjax({
                            apiName: "me/accounts/destroy/step2",
                            method: "post",
                            body: {
                                vc: verificationCode
                            }
                        }).complete(function (data) {
                            var result = $.parseJSON(data.responseText)
                            if (data.status == 200) {
                                QmiGlobal.PopupDialog.close().then(function () {
                                    deleteAccount.done();
                                });
                            }
                        });
                    }
                }
            ]
        }).open();
    },

    done: function () {
        QmiGlobal.PopupDialog.create({
            className: 'account-removed',
            header: $.i18n.getString('ACCOUNT_MANAGEMENT_DELETED_CONFIRMATION'),
            footer: [
                {
                    tagName: 'button',
                    text: $.i18n.getString('ACCOUNT_MANAGEMENT_DONE'),
                    eventType: 'click',
                    eventHandler: reLogin
                }
            ]
        }).open();
    }
}

var bindAccount = {
    verifyPassword: function (isEmail) {
        var self = this;
        return new Promise(function(resolve, reject) {
            openPopupDialog(
                'account-setting',
                $.i18n.getString('SYSTEM_ACCOUNT_SETTING_SET_CHECK_PW'),
                [{
                    tagName: 'input',
                    attributes: {
                        type: 'password',
                        placeholder: $.i18n.getString('ACCOUNT_BINDING_PASSWORD')
                    }
                }],
                $.i18n.getString('ACCOUNT_BINDING_DONE'),
                function (e) {
                    var dialog = document.querySelector("#popupDialog>div.container>div.account-setting");
                    var passwordValue = dialog.querySelector('div.content>input').value;
                    
                    new QmiAjax({
                        apiName: "me/password/auth",
                        method: "post",
                        body: {
                            pw: toSha1Encode(passwordValue)
                        }
                    }).complete(function (data) {
                        var result = $.parseJSON(data.responseText)
                        if (data.status == 200) {
                            QmiGlobal.PopupDialog.close().then(function () {
                                resolve({
                                    pw: passwordValue
                                })
                            });
                        }
                    });
                }, reject
            )
        });
    },
    enterAccount: function (isEmail, passwordValue) {
        var self = this;
        console.log(isEmail)
        return new Promise(function(resolve, reject) {
            var countryCodeSelect = document.createElement('select-box');
            var countryCodeMenu = document.querySelector('select[name="Country Code"]');
            countryCodeSelect.importOptions(Array.prototype.map.call(countryCodeMenu, function(countryCodeItem) {
                return {
                    text: $.i18n.getString(countryCodeItem.getAttribute('data-textid')),
                    value: countryCodeItem.getAttribute('data-code')
                }
            }));

            var content = [{
                tagName: 'input',
                attributes: {
                    type: 'text',
                    placeholder: isEmail ? $.i18n.getString('SYSTEM_SET_EMAIL_HINT') : $.i18n.getString('SYSTEM_CHANGE_PHONE_HINT'),
                }
            }];

            if (!isEmail) {
                content.unshift(countryCodeSelect)
            }

            openPopupDialog(
                'account-setting',
                isEmail ? $.i18n.getString('SYSTEM_SET_EMAIL') : $.i18n.getString('SYSTEM_CHANGE_PHONE'),
                content,
                $.i18n.getString('COMMON_NEXT'),
                function (e) {
                    var dialog = document.querySelector("#popupDialog>div.container>div.account-setting");
                    var accountValue = dialog.querySelector('div.content>input').value;
                    var countrycode;

                    if (!isEmail) {
                        countrycode = dialog.querySelector('select-box').getValue();
                    }

                    QmiGlobal.PopupDialog.close().then(function () {
                        resolve({
                            id: accountValue,
                            pw: passwordValue,
                            countrycode: countrycode
                        })
                    });
                }, reject
            )
        });
    },
    sendVeriticationCode : function (isEmail, accountId, password, countrycode, authObj) {
        var self = this;

        return new Promise(function(resolve, reject) {
            openPopupDialog('account-setting',
                isEmail ? $.i18n.getString('SYSTEM_SET_EMAIL_CHECK_EMAIL') : $.i18n.getString('SYSTEM_VERIFICATION_CHECK_PHONE'),
                [{
                    tagName: 'div',
                    text: countrycode ? $.i18n.getString('SYSTEM_SET_EMAIL_SET_EMAIL') + "(" + countrycode + ") " + accountId : 
                        $.i18n.getString('SYSTEM_SET_EMAIL_SET_EMAIL') + accountId
                }],
                $.i18n.getString('ACCOUNT_MANAGEMENT_DONE'),
                function (e) {
                    var dialog = document.querySelector("#popupDialog>div.container>div.account-setting");
                    var data = {
                        id: countrycode ? countrycode + accountId : accountId,
                    }

                    if (authObj !== undefined) {
                        data.key = authObj.key;
                        data.ui = authObj.ui;
                    } else {
                        data.pw = toSha1Encode(password);
                    }
                        
                    new QmiAjax({
                        apiName: authObj === undefined ? "me/accounts" : "me/accounts/force",
                        method: "post",
                        body: data
                    }).complete(function (data) {
                        var result = $.parseJSON(data.responseText)
                        if (data.status == 200) {
                            QmiGlobal.PopupDialog.close().then(function () {
                                toastShow($.i18n.getString("SYSTEM_ACCOUNT_SETTING_SEND_CODE_SUCCESS"));

                                resolve({
                                    id: accountId,
                                    pw: password,
                                    countrycode: countrycode
                                });
                            });
                        } else {
                            reject();
                        }
                    });
                }, reject
            )
        })
    },
    verifyCode: function (isEmail, accountId, password, countrycode, authObj) {
        var emailSetting = $("#email-setting");

        return new Promise(function(resolve, reject) {
            openPopupDialog('verification-code',
                isEmail ? $.i18n.getString('SYSTEM_SET_EMAIL_CHECK_EMAIL') : $.i18n.getString('SYSTEM_VERIFICATION_CHECK_PHONE'),
                [{  
                    tagName: 'p',
                    text: countrycode ? $.i18n.getString('SYSTEM_VERIFICATION_EMAIL_TEXT') + "\n" + "(" + countrycode + ") " + accountId :
                        $.i18n.getString('SYSTEM_VERIFICATION_EMAIL_TEXT') + "\n" + accountId
                }, {
                    tagName: 'input',
                    attributes: {
                        type: 'text',
                        placeholder: $.i18n.getString('REGISTER_AUTH_ENTER_CODE'),
                        maxlength: 6
                    }
                }, {
                    tagName: 'span',
                    text: $.i18n.getString('REGISTER_AUTH_RESEND_CODE'),
                    eventType: 'click',
                    eventHandler: function (e) {
                        var data = {
                            id: countrycode ? countrycode + accountId : accountId,
                        }

                        if (authObj !== undefined) {
                            data.key = authObj.key;
                            data.ui = authObj.ui;
                        } else {
                            data.pw = toSha1Encode(password);
                        }

                        new QmiAjax({
                            apiName: authObj === undefined ? "me/accounts" : "me/accounts/force",
                            method: "post",
                            body: data
                        }).complete(function (data) {
                            var result = $.parseJSON(data.responseText);

                            if (data.status == 200) {
                               toastShow($.i18n.getString("SYSTEM_ACCOUNT_SETTING_SEND_CODE_SUCCESS"));
                            }
                        });
                    }
                }], $.i18n.getString('ACCOUNT_MANAGEMENT_DONE'),
                function (e) {
                    var dialog = document.querySelector("#popupDialog>div.container>div.verification-code");
                    var code = dialog.querySelector('div.content>input').value;
                    var data = {
                        vc: code
                    };

                    if (authObj) {
                        data.ui = authObj.ui;
                        data.key = authObj.key;
                        data.id = countrycode + accountId;
                    }
                    new QmiAjax({
                        apiName: authObj === undefined ? "me/accounts/" + accountId + "/auth" : "me/accounts/force/auth",
                        method: "post",
                        body: data
                    }).complete(function (data) {
                        var result = $.parseJSON(data.responseText)
                        if (data.status == 200) {
                            QmiGlobal.PopupDialog.close().then(function () {
                                if (authObj) {
                                    QmiGlobal.auth = result;
                                } else {
                                    toastShow(result.rsp_msg);
                                    systemSetting();
                                }

                                resolve()
                            });
                        }
                    });
                }, reject
            )
        });
    },
    force: function (authObj) {
        var self = this;

        return new Promise(function(resolve, reject) {
            self.enterAccount(false).then(function (data) {
                return self.sendVeriticationCode(false, data.id, data.pw, data.countrycode, authObj);
            }, reject).then(function (data) {
                return self.verifyCode(false, data.id, data.pw, data.countrycode, authObj)
            }, reject).then(resolve, reject)
        });
    },
    remove: function (accountId) {
        var emailSetting = $("#email-setting");
        openPopupDialog('account-setting', "",
            [{
                tagName: 'div',
                text: $.i18n.getString('SYSTEM_ACCOUNT_SETTING_REMOVE_SETTING') + accountId
            }], $.i18n.getString('COMMON_OK'),
            function (e) {
                new QmiAjax({
                    apiName: "me/accounts/" + accountId,
                    method: "delete",
                }).complete(function (data) {
                    var result = $.parseJSON(data.responseText)
                    if (data.status == 200) {
                        QmiGlobal.PopupDialog.close().then(function () {
                            toastShow(result.rsp_msg);
                            systemSetting();
                        });
                    }
                });
            }
        )
    },
    process: function (isEmail) {
        var self = this;
        console.log(isEmail)
        self.verifyPassword(isEmail).then(function (data) {
            return self.enterAccount(isEmail, data.pw);
        }).then(function (data) {
            return self.sendVeriticationCode(isEmail, data.id, data.pw, data.countrycode);
        }).then(function (data) {
            return self.verifyCode(isEmail, data.id, data.pw, data.countrycode)
        });
    }
}
function openPopupDialog (className, header, content, confirmText, confirmCallBack, cancelCallback) {
    var dialogData = {
        className: className,
        header: header,
        content: content,
        footer: [
            {
                tagName: 'button',
                text: $.i18n.getString('ACCOUNT_MANAGEMENT_CANCEL'),
                eventType: 'click',
                eventHandler: function (e) {
                    QmiGlobal.PopupDialog.close();
                    if (cancelCallback) {
                        cancelCallback()
                    }
                }
            }, {
                tagName: 'button',
                text: confirmText,
                eventType: 'click',
                eventHandler: confirmCallBack
            }
        ]
    }

    QmiGlobal.PopupDialog.create(dialogData).open();
}
