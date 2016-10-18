$(document).ready(function(){
    
    var btnContent = $(".btn-content");
    var imgContent = $(".image-content");
    var tabContent = $(".tab-content-r");
    

    $('.userSetting-btn').click(function(){
        userInfoUpdate();
    });

    tabContent.find('.input-password').bind('input', function (e) {
        passwordValidate(e);
    });

    // password送出
    btnContent.find('.password-btn').click(function(){
        if ($(this).hasClass("ready")) {
            passwordChange(); 
        };
    });
    // 預設系統通知
    btnContent.find('.notification-btn').click(function(){
        if ($('#no-option1').is(":checked"))
        {
            set_notification = true;
            $.lStorage("_setnoti","100");
        }else{
            set_notification = false;
            $.lStorage("_setnoti","300");
        }
        toastShow("變更成功");
    });
    // 預設團體送出
    btnContent.find('.default-group-btn').click(function(){
        defaultGroupSetting();
    });
    //預設置頂時間送出
    btnContent.find('.carousel-btn').click(function(){
        var carousel_time = $("input[name$='second']:checked").val();
        top_timer_ms = carousel_time;
        toastShow("變更成功");
        $.lStorage('_topTimeMs',carousel_time);
    });
    //變更使用者大頭貼
    imgContent.find('.user-avatar-img').click(function(){
        $('.setting-avatar-file').trigger("click");
    });
    imgContent.find('.camera-icon').click(function(){
        $('.setting-avatar-file').trigger("click");
    });
    //選擇圖片
    imgContent.find('.setting-avatar-file').change(function(){

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

    // $(".guihu-add").click(function() {
    //     QmiGlobal.guihu.init();
    //     $(".guihu-title").text($.i18n.getString("ADD_LDAP"));
    //     $(".guihu-des").text($.i18n.getString("ADD_LDAP_DES"));
    //     $(".guihu-btn-content").find("button:nth-child(2)").addClass("add-btn");
    // });
    // $(".guihu-cancel").click(function(){
    //     QmiGlobal.guihu.init();
    //     $(".guihu-title").text($.i18n.getString("REMOVE_LDAP"));
    //     $(".guihu-des").text($.i18n.getString("REMOVE_LDAP_DES"));
    //     $(".guihu-btn-content").find("button:nth-child(2)").addClass("save-btn");
    // });

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
    var userInformation = $("#userInformation-page");
    
    userInformation.find(".user-avatar-img").attr('src',QmiGlobal.me.aut).end()//大頭照
                       .find(".input-username").val(QmiGlobal.me.nk);//first name
    
}
//取得個人資訊
userInfoGetting = function(){
    var userInfo = $("#userInfo");
    var emptyUserAvt = "images/common/others/empty_img_personal_l.png";
    new QmiAjax({
        apiName: "me",
        isPublicApi: true
    }).success(function(data){
        QmiGlobal.me = data;
        //左下角個人資料 使用者名稱 手機 頭像

        userInfo.find(".user-name").text(data.nk).end()
                .find(".user-phone").text(data.pn).end()
                .find(".user-avatar-setting").attr("src",data.aut);
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
    if(username_input == ""){
        alert('姓名輸入框不可為空');
    }else {
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
}

//system setting 
systemSetting = function(){

    var this_dgi = $.lStorage("_loginData").dgi;
    console.debug("this_dgi",this_dgi);

    var group_data = $.lStorage(ui);
    console.debug("group_data",group_data);

    var this_goup_data = group_data[gi];
    console.debug("this_goup_data",this_goup_data);

    //gi 現在團體id
    //gu 現在團體 你自己的id
    //ui 
    //at

    var systemGroup = $("#group-setting");

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
    var prigroupid = Object.keys(QmiGlobal.cloudGiMap);
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

    // new QmiAjax({
    //     apiName: "groups",
    //     isPublicApi: true
    // }).success(function(test_data){    

    //     systemGroup.find('.group-option').remove();

    //     for(i=0 ;i<test_data.gl.length; i++){    
    //         //產生團體列表
    //         var cr = $("<div class='group-option'><input id='"+test_data.gl[i].gi+"' data-role='none' name='group' type='radio' value='"+test_data.gl[i].gi+"'><label for='"+test_data.gl[i].gi+"' class='radiobtn'></label><img class='group-pic' data-gi='"+test_data.gl[i].gi+"' src='"+test_data.gl[i].aut+"'><label for='"+test_data.gl[i].gi+"' class='radiotext'>"+test_data.gl[i].gn._escape()+"</label></div>");
    //         systemGroup.find('.edit-defaultgroup-content').append(cr);
    //         //判斷團體縮圖 如果沒有設定預設圖片
    //         if(!test_data.gl[i].aut){
    //             $(".group-pic[data-gi='"+test_data.gl[i].gi+"']").attr("src", emptyAut);
    //         }
    //     } 
    //     //勾選預設群組
    //     systemGroup.find('#'+me_dgi).attr('checked', true);   

    // }).error(function(e){
    //     console.debug(e.responseText);
    // });

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

        // pwSetting.find(".input-password").each(function(i,val){
        //         if($(this).val() == ""){
        //             fill = false;
        //             popupShowAdjust("欄位不能有空", "" ,true);
        //             return false;
        //         }
        // });
        //欄位空值判斷
        // if(fill == true)
        // {

        //驗證密碼是否正確
        new QmiAjax({
            apiName : "me/password/auth",
            body : JSON.stringify(old_password),
            method: "post",
            isPublicApi: true
        }).success(function(password_data){
            // if (pwSetting.find("input[name$='n-password']").val().length < 8){ 
            //         popupShowAdjust("新密碼請輸入至少八個字", "" ,true);
            //         return false;
            // }　else {
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
    //alert($("input[name$='group']:checked").val());
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
        alert("error");
    });
}
