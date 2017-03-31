$(document).ready(function(){

    var imgContent = $(".image-content");
    var tabContent = $(".tab-content-r");
    var userContent = $(".userSetting-content");

    //系統設定事件
    tabContent.bind('input','.input-password', function (e) {
        passwordValidate(e);
    }).on('click','.password-btn.ready',function(){// 變更密碼
            passwordChange();
            $(this).removeClass('ready');
    }).on('change','#no-option1',function() {// 是否有變更
        tabContent.find('.notification-btn').toggleClass('ready');
    }).on('click','.notification-btn.ready',function(){// 預設系統通知
            if ($('#no-option1').is(":checked")) {
                set_notification = true;
                $.lStorage("_setnoti","100");
            } else {
                set_notification = false;
                $.lStorage("_setnoti","300");
            }
            toastShow("變更成功");
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
    var group_data = $.lStorage(ui);
    var this_goup_data = group_data[gi];
    //gi 現在團體id
    //gu 現在團體 你自己的id
    //ui 
    //at

    var systemGroup = $("#group-setting");
    $(".notification-btn,.default-group-btn,.carousel-btn").removeClass("ready");
    //系統設定初始化
    var emailSetting = $("#email-setting");
    emailSetting.find("input[name$='user-edit-phone']").val(QmiGlobal.me.pn);
    emailSetting.find("input[name$='user-edit-email']").val(QmiGlobal.me.em);
    //密碼
    $("#password-setting").find(".input-password").val("");
    //預設系統通知
    if($.lStorage("_setnoti")==100){
        set_notification = true;
    }else if($.lStorage("_setnoti")==300){
        set_notification = false;
    }
    $("#no-option1").attr('checked', set_notification);
    //預設團體
    var me_dgi = QmiGlobal.auth.dgi;
    //預設置頂自動換頁   
    $("#carousel-setting").find("input[value='"+top_timer_ms+"']").attr('checked', true);
    //預設團體圖片
    var emptyAut = "images/common/others/empty_img_all_l.png";

    //團體列表
    systemGroup.find('.group-option').remove();
    //公私雲團體
    var groupid = Object.keys(group_data);
    //私雲團體
    var prigroupid = Object.keys(QmiGlobal.companyGiMap).reduce(function(arr, currGi) {
        var currCi = (QmiGlobal.companyGiMap[currGi] || {}).ci;
        if((QmiGlobal.companies[currCi] || {}).ctp === 0) return arr;
        return arr.concat([currGi]);
    }, []);
    for(var i = 0 ;i < groupid.length; i++){    
        //產生團體列表
        var cr = $("<div class='group-option'><input id='"+ groupid[i] +"' data-role='none' name='group' type='radio' value='"+ groupid[i] +"'><label for='"+ groupid[i] +"' class='radiobtn'></label><img class='group-pic' data-gi='"+ groupid[i] +"' src='"+ group_data[groupid[i]].aut +"'><label for='"+ groupid[i] +"' class='radiotext'>"+ group_data[groupid[i]].gn._escape() +"</label></div>");
        systemGroup.find('.edit-defaultgroup-content').append(cr);
        //判斷團體縮圖 如果沒有設定預設圖片
        if(!group_data[groupid[i]].aut){
            $(".group-pic[data-gi='"+ groupid[i] +"']").attr("src", emptyAut);
        }
    } 
    //移除私雲團體
    for(var j = 0;j < prigroupid.length;j++){
        systemGroup.find('#'+prigroupid[j]).parent().remove();
    }   
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
        // var fill = true;//空值判定

        var old_password = {
            "pw" : toSha1Encode(pwSetting.find("input[name$='o-password']").val())
        };
        var verify_password = {
             "op" : toSha1Encode(pwSetting.find("input[name$='o-password']").val()),
             "up" : toSha1Encode(pwSetting.find("input[name$='n-password']").val())
        };

        //驗證密碼是否正確
        new QmiAjax({
            apiName : "me/password/auth",
            body : JSON.stringify(old_password),
            method: "post",
            isPublicApi: true
        }).success(function(password_data){
            if (pwSetting.find("input[name$='n-password']").val() == pwSetting.find("input[name$='v-password']").val()){
                new QmiAjax({
                    apiName : "me/password",
                    body : JSON.stringify(verify_password),
                    method : "put",
                    isPublicApi: true
                }).success(function(verify_data){
                    toastShow(verify_data.rsp_msg);
                    //console.debug(verify_data);
                    QmiGlobal.auth.at = verify_data.at;
                    at = verify_data.at;
                    var user_login = $.lStorage("_loginData");
                    user_login.at = verify_data.at;
                    $.lStorage("_loginData",user_login);
                    pwSetting.find(".input-password").val("");
                    pwSetting.find('.password-btn').removeClass('ready');
                }).error(function(e){
                    popupShowAdjust(e.rsp_msg);
                });
            } else {
                popupShowAdjust("兩次密碼不符 請再輸入一次", "" ,true);
                pwSetting.find("input[name$='v-password']").val("");
                pwSetting.find('.password-btn').removeClass('ready');
                //$.i18n.getString("LOGIN_FORGETPASSWD_NOT_MATCH")
            }
            // }
        }).error(function(e){
                popupShowAdjust("原密碼有誤", "" ,true);
                console.debug(e.responseText);
        });
    // }//空值判定
}//密碼更新

//更新預設團體
defaultGroupSetting = function(){
    var new_dgi = $("input[name$='group']:checked").val()
    new QmiAjax({
        apiName : "groups/"+new_dgi+"/default",
        type: "put"
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
                    jqElem: self.view.find("[target]"), 
                    eventArr: ["click"]
                },{
                    veId: "create-ready", 
                    jqElem: self.view.find(".ldap-edit .input-block input"), 
                    eventArr: ["input"],
                },{
                    veId: "create-submit", 
                    jqElem: self.view.find(".ldap-edit button.submit"), 
                    eventArr: ["click"],
                },{
                    veId: "create-cancel", 
                    jqElem: self.view.find(".ldap-edit button.cancel"), 
                    eventArr: ["click"],
                },{
                    veId: "list-action", 
                    jqElem: self.view.find(".ldap-list .list"), 
                    eventArr: ["click"],
                }
            ], self, true);
        });
        
    },

    handleEvent: function() {
        var self = this;
        var targetDom = $(event.detail.elem);

        // event.type -> click:view-auth-manually-submit
        var eventCase = event.type.split(":"+self.id).join("");
        switch(eventCase) {
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
        var self = this,
            ssoAccount = self.inputAccount,
            ssoPassword = self.inputPassword,
            ssoData,
            msgShowDef = $.Deferred(),
            submitCompleteDef = $.Deferred();

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
        var self = this, ldapCi;
        // 判斷帳號是否存在ldapCompanies中
        if(QmiGlobal.auth.isSso) {
            var ldapData = QmiGlobal.companies[Object.keys(QmiGlobal.companies)[0]];
        } else {
            Object.keys(QmiGlobal.ldapCompanies).forEach(function(thisCi) {
                if(QmiGlobal.ldapCompanies[thisCi].id === self.inputAccount) ldapCi = thisCi;
            });
            var ldapData = QmiGlobal.ldapCompanies[ldapCi];
        }
            
        // if(ldapCi === undefined) {
        //     toastShow(desc)
        // }
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
        add: ["ACCOUNT_BINDING_BINDING_NEW_ACCOUNT", "ACCOUNT_BINDING_BIND_QMI_ACCOUNT"],
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
        + "    <div class='title one add' content='"+ $.i18n.getString("ACCOUNT_BINDING_BINDING_NEW_ACCOUNT") +"'></div>"
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
