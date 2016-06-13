
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

    //default-group information
    var api_name = "groups";//url
    var headers = {
        "ui":ui,
        "at":at, 
        "li":lang,
    };

    var method = "get";
    ajaxDo(api_name,headers,method,false).success(function(test_data){
        console.debug("this-is-me",$.lStorage("_loginData"));
        $('.group-select').empty();
        
        console.debug(this_dgi);
      
        for(i=0 ;i<test_data.gl.length; i++){
            var cr = $("<option value="+test_data.gl[i].gi+">"+test_data.gl[i].gn+"</option>");
            $('.group-select').append(cr);
            $('.group-select').val(this_dgi);
        }
        
        
    }).error(function(e){
        alert("error");
    });

    //user-data-information

    var api_name2 = "me";//url
    var headers = {
        "ui":ui,
        "at":at, 
        "li":lang,
    };

    var method = "get";
    ajaxDo(api_name2,headers,method,false).success(function(data){
        console.debug("data",data);
        $(".setting-user-avatar").attr('src',data.auo);//大頭照
        $(".input-username").val(data.nk);//first name

     
    }).error(function(e){
        alert("error");
    });

    $('.version-information').text($.lStorage('_ver').ver);//系統資訊顯示
}


// password送出
$('.password-submit').click(function(){
    password_change_setting();
});


// 變更密碼
password_change_setting = function(){

        var fill = true;//空值判定
        var old_password = {
            "pw":toSha1Encode($(".old-password").val())
        };
        var verify_password = {
             "op":toSha1Encode($(".old-password").val()),
             "up":toSha1Encode($(".new-password").val())
        };
        $(".input-password").each(
            function(i,val){
                if($(this).val() == "" || $(this).val() == $(this).attr("placeholder")){
                    fill = false;
                    popupShowAdjust("欄位不能有空", "失敗" ,true);
                    return false;
                }
        });//欄位空直確認
        
        if(fill == true)
        {
            $.ajax({
                url:base_url+"me/password/auth",
                headers:{
                    "li":lang,
                    "at":at,
                    "ui":ui
                },
                data:JSON.stringify(old_password),
                type:"post",
                success:function(password_data){
                    
                    
                    if($(".new-password").val().length < 3){
                    
                        popupShowAdjust("新密碼請輸入至少三個字", "失敗" ,true);
                        return false;
                    }
                    else if($('.new-password').val() == $('.verify-password').val())
                    {
                        $.ajax({
                            url:base_url+"me/password",
                            headers:{
                            "li":lang,
                            "at":at,
                            "ui":ui
                            },
                            type:"put",
                            data:JSON.stringify(verify_password),
                            success:function(verify_data){
                                toastShow("發送成功");
                                console.debug(verify_data);
                                 at = verify_data.at;
                                 
                            },
                            error:function(e){
                                alert("error");
                            }
                        });//ajax密碼變更
                        $('.password-change-confirm').fadeOut();
                        

                    }
                    else
                    {
                        popupShowAdjust("請再輸一次新密碼", "失敗" ,true);
                        $('.verify-password').val("");

                    }
                },
                error:function(e){
                    popupShowAdjust("原密碼有誤", "失敗" ,true);
                    console.debug(e.responseText);
                }
            });
        }//空值判定
}//密碼更新


// 系統設定（使用者名稱跟預設團體變更送出）


$('.system-setting-submit').click(function(){
    // toastShow("發送成功");
    // popupShowAdjust("", "失敗" ,true);

    var username_input = $('.input-username').val();
    
    if(username_input == ""){
        alert('姓名輸入框不可為空');
    }
    else{
        var body = {
            "fn":$.lStorage('_loginData').fn,
            "ln":$.lStorage('_loginData').ln,
            "nk":username_input,
            "bd":$.lStorage('_loginData').bd
        };

        headers = {
            "li":lang,
            "at":at,
            "ui":ui
        };

        ajaxDo("me",headers,"put",false,body)
        .complete(function(user_data){
            //success
            console.debug('user_data',user_data);
            var new_dgi = $('.group-select option:checked').val();

            console.debug(new_dgi);
            $.ajax({
                url:base_url+"groups/"+new_dgi+"/default",
                headers:{
                    "li":lang,
                    "at":at,
                    "ui":ui
                },
                type:"putj",
                complete:function(e){
                    toastShow("發送成功");

                    var user_login = $.lStorage("_loginData");
                    user_login.dgi = new_dgi;//變更的預設團體id
                    $.lStorage('_loginData',user_login);//上傳local storage
                }
            });//顯示預設團體
        });

        //自動換頁
         var carousel_time = $('.carousel-time').val();
         $.lStorage('_topTimeMs',carousel_time);

     }//使用者姓名空值判定
});