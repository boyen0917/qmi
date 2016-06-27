//system setting 系統設定 個人跟團體資料顯示
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
    //預設群組
    var me_dgi = QmiGlobal.auth.dgi;
    //預設置頂自動換頁   

    $("#carousel-setting").find("input[value='"+top_timer_ms+"']").attr('checked', true);
    var emptyAut = "images/common/others/empty_img_all_l.png";
    //$('input[name=second]:first').attr('checked', true);
    //$("input[name$='group']").attr("checked",me_de_gr);
    //default-group information
    new QmiAjax({
        apiName: "groups"
    }).success(function(test_data){
        
        //console.debug("this-is-me",$.lStorage("_loginData"));
        //$('.group-select').empty();
        systemGroup.find('.group-option').remove();
        //console.debug(this_dgi);
        for(i=0 ;i<test_data.gl.length; i++){    
            //var dr = $("<option value="+test_data.gl[i].gi+">"+test_data.gl[i].gn+"</option>");
            //產生團體列表
            var cr = $("<div class='group-option'><input id='"+test_data.gl[i].gi+"' data-role='none' name='group' type='radio' value='"+test_data.gl[i].gi+"'><label for='"+test_data.gl[i].gi+"' class='radiobtn'></label><img class='group-pic' data-gi='"+test_data.gl[i].gi+"' src='"+test_data.gl[i].aut+"'><label for='"+test_data.gl[i].gi+"' class='radiotext'>"+test_data.gl[i].gn+"</label></div>");
            systemGroup.find('.edit-defaultgroup-content').append(cr);
            //判斷團體縮圖 如果沒有設定預設
            if(!test_data.gl[i].aut){
                $(".group-pic[data-gi='"+test_data.gl[i].gi+"']").attr("src", emptyAut);
            }
            //$('.group-select').append(dr);
            //$('.group-select').val(this_dgi);
        } 
        //勾選預設群組
        systemGroup.find('#'+me_dgi).attr('checked', true);   

    }).error(function(e){
        alert("error");
    });

    // var api_name = "groups";//url
    // var headers = {
    //     "ui":ui,
    //     "at":at, 
    //     "li":lang,
    // };
    // var method = "get";
    // ajaxDo(api_name,headers,method,false).success(function(test_data){
    //     console.debug("this-is-me",$.lStorage("_loginData"));
    //     $('.group-select').empty();   
    //     console.debug(this_dgi);
    //     for(i=0 ;i<test_data.gl.length; i++){
    //         var cr = $("<option value="+test_data.gl[i].gi+">"+test_data.gl[i].gn+"</option>");
    //         $('.group-select').append(cr);
    //         $('.group-select').val(this_dgi);
    //     }
    // }).error(function(e){
    //     alert("error");
    // });

    //user-data-information
    // var api_name2 = "me";//url
    // var headers = {
    //     "ui":ui,
    //     "at":at, 
    //     "li":lang,
    // };
    // var method = "get";
    // ajaxDo(api_name2,headers,method,false).success(function(data){
    //     console.debug("data",data);
    //     $(".setting-user-avatar").attr('src',data.auo);//大頭照
    //     $(".input-username").val(data.nk);//first name    
    // }).error(function(e){
    //     alert("error");
    // });

    //$('.version-information').text($.lStorage('_ver').ver);//系統資訊顯示
}

//取得個人資訊*
userInfoGetting = function(){

    var userInfo = $("#userInfo");
    var userInformation = $("#userInformation-page");
    var emailSetting = $("#email-setting");

    new QmiAjax({
        apiName: "me"
    }).success(function(data){
        console.debug("data",data);

        userInformation.find(".user-avatar-img").attr('src',data.auo).end()//大頭照
                        .find(".input-username").val(data.nk);//first name

        userInfo.find(".user-name").text(data.nk).end()
                    .find(".user-phone").text(data.pn).end()
                    .find(".user-avatar-setting").attr("src",data.aut);

        emailSetting.find("input[name$='user-edit-phone']").val(data.pn);
        
    }).error(function(e){
        alert("error");
    });
}

$(document).ready(function(){
    //使用者資料修改

    var btnContent = $(".btn-content");
    var imgContent = $(".image-content");

    $('.userSetting-btn').click(function(){
        userInfoUpdate();
    });
    // password送出
    btnContent.find('.password-btn').click(function(){
        passwordChange(); 
    });
    btnContent.find('.default-group-btn').click(function(){
        defaultGroupSetting();
    });
    btnContent.find('.carousel-btn').click(function(){
        //alert(top_timer_ms);
        
        //var carousel_time = $("input[name$='second']:checked").val();
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

        //每次選擇完檔案 就reset input file
        //file_ori.replaceWith( file_ori.val('').clone( true ) );
        var file = file_ori[0].files[0];
        
        if (file.type.match(imageType)) {
            //是否存在圖片
                var reader = new FileReader();
                reader.onload = function(e) {
                var img = $(".user-headshot");
                //調整長寬
                //img.load(function() {
                //var w = img.width();
                //var h = img.height();
                //mathAvatarPos(img,w,h,120);
                //});
                // uploadToS3(file,"/me/avatar",ori_arr,tmb_arr,function(chk){
                // });
                img.attr("src",reader.result);
            }
            reader.readAsDataURL(file);
            QmiGlobal.avatarPopup.init();
            
        } else {
            popupShowAdjust("", $.i18n.getString("COMMON_NOT_IMAGE") );
        }
    });
});

//更新使用者名稱
userInfoUpdate = function(){
    var username_input = $('.input-username').val();
    if(username_input == ""){
        alert('姓名輸入框不可為空');
    }
    new QmiAjax({
        apiName: "me",
        method: "put",
        body: {
            "nk": username_input
        }
    }).success(function(data){
        $(".user-name").text(username_input);
        toastShow(data.rsp_msg);
    });
}

// 變更密碼
passwordChange = function(){
        //$("input[name$='user-edit-o-password']").val()
        var pwSetting = $("#password-setting");
        var fill = true;//空值判定

        var old_password = {
            "pw":toSha1Encode(pwSetting.find("input[name$='o-password']").val())
        };
        var verify_password = {
             "op":toSha1Encode(pwSetting.find("input[name$='o-password']").val()),
             "up":toSha1Encode(pwSetting.find("input[name$='n-password']").val())
        };

        pwSetting.find(".input-password").each(function(i,val){
                if($(this).val() == ""){
                    fill = false;
                    popupShowAdjust("欄位不能有空", "" ,true);
                    return false;
                }
        });
        //欄位空值判斷
        if(fill == true)
        {
            //驗證密碼是否正確
            new QmiAjax({
                apiName : "me/password/auth",
                body : JSON.stringify(old_password),
                method: "post"
            }).success(function(password_data){
                if (pwSetting.find("input[name$='n-password']").val().length < 6){ 
                        popupShowAdjust("新密碼請輸入至少六個字", "" ,true);
                        return false;
                }　else {
                    if (pwSetting.find("input[name$='n-password']").val() == pwSetting.find("input[name$='v-password']").val()){
                        new QmiAjax({
                            apiName : "me/password",
                            body : JSON.stringify(verify_password),
                            method : "put"
                        }).success(function(verify_data){
                            toastShow(verify_data.rsp_msg);
                            console.debug(verify_data);
                            at = verify_data.at;
                        }).error(function(e){
                            popupShowAdjust(e.rsp_msg);
                        });
                    } else {
                        popupShowAdjust("兩次密碼不符 請再輸入一次", "" ,true);
                        pwSetting.find("input[name$='v-password']").val("");
                    }
                }
            }).error(function(e){
                    popupShowAdjust("原密碼有誤", "" ,true);
                    console.debug(e.responseText);
            });
            // $.ajax({
            //     url:base_url+"me/password/auth",
            //     headers:{
            //         "li":lang,
            //         "at":at,
            //         "ui":ui
            //     },
            //     data:JSON.stringify(old_password),
            //     type:"post",
            //     success:function(password_data){
                                    
            //         if($("input[name$='user-edit-n-password']").val().length < 3){
                    
            //             popupShowAdjust("新密碼請輸入至少三個字", "失敗" ,true);
            //             return false;
            //         }
            //         else if($("input[name$='user-edit-n-password']").val() == $("input[name$='user-edit-v-password']").val())
            //         {
            //             $.ajax({
            //                 url:base_url+"me/password",
            //                 headers:{
            //                 "li":lang,
            //                 "at":at,
            //                 "ui":ui
            //                 },
            //                 type:"put",
            //                 data:JSON.stringify(verify_password),
            //                 success:function(verify_data){
            //                     toastShow("發送成功");
            //                     console.debug(verify_data);
            //                      at = verify_data.at;
                                 
            //                 },
            //                 error:function(e){
            //                     alert("error");
            //                 }
            //             });//ajax密碼變更
            //         }
            //         else
            //         {
            //             popupShowAdjust("請再輸一次新密碼", "失敗" ,true);
            //             $("input[name$='user-edit-v-password']").val("");
            //         }
            //     },
            //     error:function(e){
            //         popupShowAdjust("原密碼有誤", "失敗" ,true);
            //         console.debug(e.responseText);
            //     }
            // });
        }//空值判定
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

// 系統設定（使用者名稱跟預設團體變更送出）
// $('.system-setting-submit').click(function(){
//     // toastShow("發送成功");
//     // popupShowAdjust("", "失敗" ,true);

//     var username_input = $('.input-username').val();
    
//     if(username_input == ""){
//         alert('姓名輸入框不可為空');
//     }
//     else{
//         var body = {
//             "fn":$.lStorage('_loginData').fn,
//             "ln":$.lStorage('_loginData').ln,
//             "nk":username_input,
//             "bd":$.lStorage('_loginData').bd
//         };

//         headers = {
//             "li":lang,
//             "at":at,
//             "ui":ui
//         };

//         ajaxDo("me",headers,"put",false,body)
//         .complete(function(user_data){
//             //success
//             console.debug('user_data',user_data);
//             var new_dgi = $('.group-select option:checked').val();

//             console.debug(new_dgi);
//             $.ajax({
//                 url:base_url+"groups/"+new_dgi+"/default",
//                 headers:{
//                     "li":lang,
//                     "at":at,
//                     "ui":ui
//                 },
//                 type:"put",
//                 complete:function(e){
//                     toastShow("發送成功");

//                     var user_login = $.lStorage("_loginData");
//                     user_login.dgi = new_dgi;//變更的預設團體id
//                     $.lStorage('_loginData',user_login);//上傳local storage
//                 }
//             });//顯示預設團體
//         });

//         //自動換頁
//          var carousel_time = $('.carousel-time').val();
//          $.lStorage('_topTimeMs',carousel_time);

//      }//使用者姓名空值判定
// });