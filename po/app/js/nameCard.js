(function(){

	$(document).on("mouseup",".namecard",function(e){
		e.stopPropagation();
		//temp
		if($(document).data("official") == true) return false;

		$(document).data("namecard-pos",$(window).scrollTop());
		$(window).scrollTop(0);
		// $(".user-info-load-area").css("top",$(window).scrollTop());
		// $(".screen-lock").css("top",$(window).scrollTop());

		//調整
		$("#page-group-main .gm-content").css("overflow","initial");

		//鈴鐺頁面不動作
		if($(this).parents(".al-subbox").length) $(this).parents(".al-subbox").data("stop",true);
		userInfoShow($(this).data("gi"),$(this).data("gu"));
	});

	$(document).on("mousedown",".user-info-close",function(){
		$(this).attr("src","images/common/icon/bt_close_activity.png");
	});

	$(document).on("mouseup",".user-info-close",function(){
		//調整
		$("#page-group-main .gm-content").removeAttr("style");
		//歸位
		$(window).scrollTop($(document).data("namecard-pos"));

		//翻面特殊處理
		if($(".user-info-load-area .me").hasClass("adjust")){
			$(".user-info-load-area").addClass("transition1s");
            $(".user-info-load-area").addClass("user-info-flip");
            $(".user-info-load-area .me").removeClass("adjust");
		}

		$("body").removeClass("user-info-adjust");

		//reset
		$(".user-info-load-area > div").html("");

		$(".screen-lock").fadeOut();
		$(this).attr("src","images/common/icon/bt_close_normal.png");
		$(".user-info-load-area").fadeOut("fast",function(){
			$(".user-info-load-area").removeClass("user-info-flip");
			$(".user-info-load-area .user").show();
		});

	});

	$(document).on("click",".user-info-load-area",function(e){
		var target = event.target || event.srcElement;
		cns.debug(target);
		target = $(target);
		if( target.hasClass("user-info-load-area") ){
			$(this).hide();
			$(".screen-lock").hide();
		}
		else if( target.hasClass("user") || target.hasClass("rotate.adjust") ){
			var tmp = target.parent();
			if( tmp.length>0 && tmp[0]==this ){
				$(".user-info-close").trigger("mouseup");
			}
		}
	});

	$(document).on("mouseup",".user-info-back",function(e){
		// $(".me-info-load user-avatar > ")
		$(".user-info-load-area").addClass("user-info-flip");
        $(".user-info-load-area .me").removeClass("adjust");

		setTimeout(function(){
	        $(".user-info-load-area").addClass("transition1s");

			$(".user-info-load-area").removeClass("user-info-flip");

			$(".user-info-load , .me-info-load").stop().animate({
				opacity:0
			},400);
			setTimeout(function(){
				$(".user-info-load-area .me").addClass("backface-visibility");
				$(document).find(".user-info-load-area .user").show();
				$(".user-info-load , .me-info-load").stop().animate({
					opacity:1
				},400);
			},400);
        },100);

		e.stopPropagation();
		e.preventDefault();
	});

	getUserInfo = function(user_info_arr,update_chk,load_show_chk,onAllDone){
	    var load_show_chk = load_show_chk || false;
	    var onAllDone = onAllDone || false;

	    //每操作一組 就踢除 直到結束
	    if(user_info_arr.length > 0){
	        var this_user_info = user_info_arr.last();

	        //if no group data
	        if( !QmiGlobal.groups.hasOwnProperty(this_user_info.gi) ){

	            //無團體的人 被退出過的團體邀請 要直接進入該團體
	            if(Object.keys(QmiGlobal.groups).length === 1){

	                groupMenuListArea().done(function(){
	                    $.mobile.changePage("#page-group-main");
	                    timelineSwitch("feeds", true);
	                });

	            } else {
	                cns.debug("[getUserInfo] no group data, getting..",this_user_info.gi);
	                getGroupCombo(this_user_info.gi, function(){
	                    getUserInfo(user_info_arr, update_chk, load_show_chk,onAllDone);
	                });
	                return;
	            }
	        }
	        
	        if(this_user_info.isNewMem==null) this_user_info.isNewMem = false; 
	        var api_name = "groups/" + this_user_info.gi + "/users/" + this_user_info.gu;
	        var headers = {
	                 "ui":ui,
	                 "at":at,
	                 "li":"zh_TW",
	        };
	        var method = "get";
	                         
	        ajaxDo(api_name,headers,method,load_show_chk,false,false,true).complete(function(data){
	            cns.debug("user info result",data);
	            if(data.status == 200){

	                var user_data = $.parseJSON(data.responseText);

	                //新成員, 三天後失效
	                if( this_user_info.isNewMem ){
	                    var newMemList = $.lStorage("_newMemList");
	                    if( !newMemList ) newMemList = {};
	                    if( false==newMemList.hasOwnProperty(this_user_info.gi) ){
	                        newMemList[this_user_info.gi] = {};
	                    }
	                    newMemList[this_user_info.gi][this_user_info.gu] = new Date().getTime()+(86400000*3);
	                    $.lStorage("_newMemList", newMemList);

	                }

	                //存local storage
	                var _groupList = QmiGlobal.groups;
	                        
	                try{
	                    if( _groupList[this_user_info.gi].guAll && Object.keys(_groupList[this_user_info.gi].guAll).length > 0){
	                        cns.debug("guall content exist");
	                        var userTmp = _groupList[this_user_info.gi].guAll[this_user_info.gu];
	                        //user全部資料竟然不含fav...?!用extend的比較保險
	                        _groupList[this_user_info.gi].guAll[this_user_info.gu] = $.extend(userTmp, user_data);
	                
	                        //有取資料但是沒有存...?!
	                        // *--* $.lStorage(ui, _groupList);

	                        //更新所有照片、名字 this_gi , this_gu , set_name ,set_img
	                        if(update_chk){
	                            updateAllAvatarName(this_user_info.gi,this_user_info.gu);
	                        }
	                    }else{
	                        cns.debug("[!!!] getUserInfo: no guAll");
	                        var data_arr = ["userInfo",user_data];
	                        setGroupAllUser(data_arr,this_user_info.gi);
	                    }

	                    // remove from inviting list
	                    if( this_user_info.isNewMem ){
	                        var invitingList = _groupList[this_user_info.gi].inviteGuAll;
	                        if( invitingList ){
	                            $.each(invitingList, function(guTmp, mem){
	                                if( guTmp == this_user_info.gu ){
	                                    delete invitingList[this_user_info.gu];
	                                    // *--* $.lStorage(ui, _groupList);
	                                    //redraw #page-contact-addmem .ca-content-area
	                                    if( typeof(updateInvitePending)=="function" ){
	                                        updateInvitePending();
	                                    }
	                                    return false;
	                                }
	                            });
	                        }
	                    }

	                    user_data.gn = _groupList[this_user_info.gi].gn || "";
	                    if( this_user_info.onGetMemData ) this_user_info.onGetMemData(this_user_info.gi, user_data);
	                    user_info_arr.pop();
	                    
	                    //等於0 就不用再遞迴
	                    if(user_info_arr.length == 0){
	                        if(onAllDone) onAllDone(user_data);
	                    }else{//繼續遞迴
	                        getUserInfo(user_info_arr, update_chk, load_show_chk,onAllDone);
	                    }
	                } catch(e){
	                    errorReport(e);
	                }
	            //失敗就離開遞迴
	            }else{ 
	                if(onAllDone) onAllDone(false);
	            }
	        });
	    }
	}

	getMultipleUserInfo = function(user_info_arr,update_chk,load_show_chk,onAllDone){
		var new_user_info_obj = {};
	    var new_user_info_arr = [];
	    
	    for( var i=0; i<user_info_arr.length; i++){
	        var tmpObj = user_info_arr[i];
	        new_user_info_obj[tmpObj.gu] = tmpObj;
	        if(QmiGlobal.groups.hasOwnProperty(tmpObj.gi) ){
	            new_user_info_arr.push({
	                gu: tmpObj.gu,
	                gi: tmpObj.gi
	            });
	        }
	    }
	    if(new_user_info_arr.length === 0) return;

	    var load_show_chk = load_show_chk || false;
	    var onAllDone = onAllDone || false;

	    var api_name = "sys/group_users";
	    
	    var headers = {
	             "ui":ui,
	             "at":at,
	             "li":lang
	    };
	    var method = "post";
	    var body = {
	        gul:new_user_info_arr
	    }

	    ajaxDo(api_name,headers,method,load_show_chk,body,false,true).complete(function(data){
	        if(data.status == 200){

	            try{
	                var user_data_object = $.parseJSON(data.responseText);

	                //新成員, 三天後失效
	                var invalidTime = new Date().getTime()+(86400000*3);
	                $.each(user_data_object.gul, function(index,user_data){
	                    if( false==new_user_info_obj.hasOwnProperty(user_data.gu) ){
	                        cns.debug("[getMultipleUserInfo] get ?? gu", user_data.gu);
	                        return;
	                    }
	                    var this_user_info = new_user_info_obj[user_data.gu];
	                    if( null==this_user_info ){
	                        cns.debug("[getMultipleUserInfo] null this_user_info", user_data.gu);
	                        return;
	                    }
	                    //新成員, 三天後失效
	                    if( this_user_info.isNewMem ){
	                        var newMemList = $.lStorage("_newMemList");
	                        if( !newMemList ) newMemList = {};
	                        if( false==newMemList.hasOwnProperty(this_user_info.gi) ){
	                            newMemList[this_user_info.gi] = {};
	                        }
	                        newMemList[this_user_info.gi][this_user_info.gu] = invalidTime;
	                        $.lStorage("_newMemList", newMemList);
	                    }
	                    
	                    //應該不會有沒有的情況
	                    var thisGroupMap = QmiGlobal.groups[this_user_info.gi];

	                    if( Object.keys(thisGroupMap.guAll).length > 0){
	                        cns.debug("guall content exist");
	                        //新加入成員
	                        if( thisGroupMap.guAll.hasOwnProperty(this_user_info.gu) === false ) {
	                            thisGroupMap.guAll[this_user_info.gu] = user_data;
	                        } else {
	                            //user全部資料竟然不含fav...?!用extend的比較保險
	                            $.extend(thisGroupMap.guAll[this_user_info.gu], user_data);    
	                        }
	                        
	                
	                        //更新所有照片、名字 this_gi , this_gu , set_name ,set_img
	                        if(update_chk){
	                            updateAllAvatarName(this_user_info.gi,this_user_info.gu);
	                        }
	                    }

	                    user_data.gn = thisGroupMap.gn || "";
	                    if( this_user_info.onGetMemData ) this_user_info.onGetMemData(this_user_info.gi, user_data);
	                });

	                onAllDone(true);

	            } catch(e){
	                errorReport(e);
	            }
	        //失敗就離開遞迴
	        }else{ 
	            if(onAllDone) onAllDone(false);
	        }
	    });
	}

	updateAllAvatarName = function(this_gi,this_gu,name,img){
	    $(".update-avatar-all").filter(function(){
	        if($(this).data("update-id") == this_gu){
	            getUserAvatarName(this_gi,this_gu,$(this).parents(".update-parent-all").find(".update-name-all"),$(this));
	        }
	    });
	}

	userInfoShow = function(this_gi,this_gu){
    
	    if(!this_gu) return false;
	    var this_gi = this_gi || gi;

	    $(".screen-lock").show();
	    $(".user-info-load-area").fadeIn("fast");
	    $(".user-info-load-area .user").load('layout/layout.html .user-info-load',function(){
	        var this_info = $(this).find(".user-info-load");
	        this_info._i18n();
	        //為了美觀
	        this_info.find(".user-avatar-bar").hide();

	        if(this_gu == gu){
	            //css 調整
	            $(".user-info-load-area .me").addClass("me-rotate");
	            $(".user-info-load-area .me").addClass("backface-visibility");
	            this_info.find(".action-chat").hide();
	            $(".user-avatar-bar-favorite").hide();
	            
	        }else{
	            //css 調整
	            $(".user-info-load-area .me").removeClass("me-rotate");
	            $(".user-info-load-area .me").removeClass("backface-visibility");
	            this_info.find(".action-edit").hide();
	            this_info.find(".action-chat").off("click").click( function(){
	            	//結束關閉
	            	this_info.find(".user-info-close").trigger("mouseup");
	                if(window.mainPageObj !== undefined) {
	                    mainPageObj.createChat(this_gi,this_gu);

	                    return;
	                }
	                requestNewChatRoomApi(this_gi, "", [{gu:this_gu}], function(data){
	                });
	            });
	            $(".user-avatar-bar-favorite").show();

	            //如果為admin, 顯示刪除成員按鈕
	            var _groupList = QmiGlobal.groups;
	            if( _groupList.hasOwnProperty(this_gi) && _groupList[this_gi].ad==1 ){
	                this_info.find(".user-info-delete").show();
	            }
	        }

	        getUserInfo([{gi:this_gi,gu:this_gu,isNewMem:false}],false,false,function(user_data){
	            if(user_data){
	                $("body").addClass("user-info-adjust");
	                //為了美觀
	                this_info.find(".user-avatar-bar").show();

	                this_info.data("this-info-gu",this_gu);
	                this_info.data("this-info-gi",this_gi);

	                //頭像
	                if(user_data.aut){
	                    this_info.find(".user-avatar .user-pic").attr("src",user_data.auo);
	                    this_info.find(".user-avatar").data("auo",user_data.auo);

	                    //400存在css media min-width中 
	                    userInfoAvatarPos($(".user-avatar .user-pic"));
	                }

	                //get user info 已存過, 不再重存
	                //存local storage
	                var _groupList = QmiGlobal.groups;
	                var userTmp = _groupList[this_gi].guAll[this_gu];
	                
	                if( true==userTmp.fav ){
	                    $(".user-avatar-bar-favorite .active").show();
	                } else if( false==userTmp.fav ){
	                    $(".user-avatar-bar-favorite .deactive").show();
	                }

	                // // *--* $.lStorage(ui,_groupList);

	                var isMe = (this_gu == _groupList[this_gi].gu);
	                if(isMe) meInfoShow(user_data);

	                userInfoDataShow(this_gi,this_info,user_data,(1==_groupList[this_gi].ad) );
	                userInfoEvent(this_info);
	            }else{
	                this_info.data("avatar-chk",false);
	                $(".screen-lock").fadeOut("fast");
	                this_info.fadeOut("fast");
	            }
	        });
	    });
	}

	userInfoDataShow = function(this_gi,this_info,user_data, isAdmin, me) {
	    cns.debug("user_data",user_data);
	    this_info.data("gu",user_data.gu);
	    if( user_data.st==2 ){
	        this_info.find(".user-info-list-area").hide();
	        this_info.find(".user-info-leave-area").show();
	        this_info.find(".user-info-delete").hide();
	        this_info.find(".fav").hide();
	    } else {
	        this_info.find(".user-info-list-area").show();
	        this_info.find(".user-info-leave-area").hide();
	    }

	    var this_gi = this_gi || gi;

	    var method = "html";
	    if(me){
	        method = "val";
	    }

	    var avatar_bar_arr = ["nk","sl","bd","bl","ti"];
	    var img_arr = ["em","pn","pn1","ext","mv"];
	    var selector;

	    for( item in user_data){
	        if(user_data[item].length > 0){
	            if(item == "bd" && me){
	                user_data[item] = user_data[item].substring(0,4) + "/" + user_data[item].substring(4,6) + "/" + user_data[item].substring(6);
	            }

	            if($.inArray(item,avatar_bar_arr) >= 0) {
	                selector = this_info.find(".user-avatar-bar");
	            }else{
	                selector = this_info.find(".user-info-list");
	            }

	            if(!me && item == "bd") {
	                user_data.bd = user_data.bd.substring(4,6) + "." + user_data.bd.substring(6,8);
	                method = "append";
	            }

	            if(item == "bl"){
	                try{
	                    var bi_arr = user_data.bl.split(",")[0].split(".");
	                    var bn = "";
	                    var branch_list = QmiGlobal.groups[this_gi].bl;
	                    var test = selector.find(".bl");
	                    test.show();
	                    test = test[0];
	                    // $(test).css("font-family", selector.find(".bl").css("font-family") );
	                    // $(test).css("font-size", "12px" );
	                    // $(test).css("line-height", "12px" );
	                    var isClipped = false;
	                    for( var i=bi_arr.length-1; i>=0; i-- ){
	                        var bi = bi_arr[i];
	                        bn = branch_list[bi].bn+"-"+bn;
	                        test.innerHTML = bn;
	                        // cns.debug(test.offsetHeight);
	                        if( test.offsetHeight>42 ){
	                            bn = bn.substring(0,bn.length-1)+"......";
	                            test.innerHTML = bn;
	                            while( test.offsetHeight>40 ){
	                                // cns.debug("!", test.offsetHeight);
	                                bn = bn.substring(1,bn.length);
	                                test.innerHTML = bn;
	                            }
	                            bn = "..."+bn.substring(0,bn.length-6);
	                            isClipped = true;
	                            break;
	                        }
	                    }
	                    if( false==isClipped && bn.length>0 ){
	                        user_data.bl = bn.substring(0,bn.length-1);
	                    } else{
	                        user_data.bl = bn;
	                    }
	                    // cns.debug(bn);
	                    // cns.debug(user_data.bl);
	                    
	                } catch(e) {
	                    errorReport(e);
	                    continue;
	                }
	            }

	            selector.find("."+item)[method](user_data[item]).show();



	            if(!me && $.inArray(item,img_arr) >= 0) {
	                var this_img = selector.find("img."+item);
	                this_img.attr("src","images/icon/bt_" + this_img.data("name") + "_normal.png");
	            }
	        }
	    }

	    var nkTmp = this_info.find(".user-avatar-bar .nk").html();
	    if( nkTmp && nkTmp.length>0 ) this_info.find(".user-avatar-bar .nk").html( nkTmp.replaceOriEmojiCode() );

	    if(!isAdmin){
	        if(user_data.mkp) this_info.find(".user-info-list .pn").html("******");
	        if(user_data.mke) this_info.find(".user-info-list .em").html("******");
	        if(user_data.mkb) {
	            this_info.find(".user-avatar-bar .bd").hide();
	            this_info.find(".user-info-list .bd").html("******");   
	        }else{
	            this_info.find(".user-avatar-bar .user-name").addClass("hidden");
	        }
	    } else{
	        this_info.find(".user-avatar-bar .user-name").addClass("hidden");
	    }


	    if( user_data.st==2 ){
	        this_info.find(".action, .sl, .bd, .bl").hide();
	    }
	}

	meInfoShow = function(user_data){
	    var this_gi = gi;
	    var this_gu = gu;

	    $(".screen-lock").show();
	    $(".user-info-load-area").fadeIn("fast");
	    $(".user-info-load-area").addClass("transition1s");
	    $(".user-info-load-area .me").load('layout/layout.html .me-info-load',function(){
	        var this_info = $(this).find(".me-info-load");
	        this_info._i18n();

	        //團體頭像
	        this_info.find(".group-avatar img").attr("src",QmiGlobal.groups[gi].aut);
	        avatarPos(this_info.find(".group-avatar img"),60);

	        //團體名稱
	        this_info.find(".group-name").html(QmiGlobal.groups[gi].gn._escape());

	        //頭像
	        if(user_data.aut){
	            this_info.find(".user-avatar.me > img").attr("src",user_data.auo);
	            this_info.find(".user-avatar").data("auo",user_data.auo);

	            //400存在css media min-width中 
	            userInfoAvatarPos(this_info.find(".user-avatar.me > img"));
	            // $(".user-avatar .default").removeClass("default");
	        }

	        // this_info.find(".user-info-list input").val("暫無資料");
	        for( item in user_data){
	            if(user_data[item]){
	                // if(item == "bd"){
	                //     user_data[item] = user_data[item].substring(0,4) + "/" + user_data[item].substring(4,6) + "/" + user_data[item].substring(6);
	    //          }
	                this_info.find(".user-info-list ." + item).val(user_data[item]);
	            }
	        }

	        var keys = {
	            mkp: "pn1",
	            mke: "em",
	            mkb: "bd"
	        };
	        $.each( keys, function(key, obj){
	            var input = this_info.find(".user-info-list ."+obj);
	            var statusText = this_info.find(".me-info-status."+obj+" .status-text")
	            input.data("ori", input.val() );
	            if( user_data[key] ){
	                input.val("******");
	                statusText.text( $.i18n.getString("COMMON_PRIVATE") ).data("val", true);
	            } else {
	                statusText.text( $.i18n.getString("COMMON_PUBLIC") ).data("val", false);
	            }
	        });

	        userInfoEvent(this_info,true);

	        // this_info.data("avatar-chk",false);
	        // $(".screen-lock").fadeOut("fast");
	        // this_info.fadeOut("fast");

	        // if(callback) callback(false);
	    });
	}

	userInfoEvent = function(this_info,me){
	    
	    this_info.unbind();
	    
	    this_info.find(".user-avatar").click(function(){
	        var this_src = $(this).find(".user-pic").attr("src");
	        if(!this_src) return false;

	        var img = new Image();
	        img.onload = function() {
	            var min_size = 500;
	            var this_width = this_height = 500;

	            //寬方形
	            var style = "width";
	            var add_class = "before1";
	            //高方形
	            if(this.width < this.height){
	                style = "height";
	                add_class = "before2";
	            }

	            if(this.width > 500) this_width = this.width;
	            if(this.height > 500) this_height = this.height;

	            var img_show = window.open("layout/img_show.html", "", "width=" + this_width + ", height=" + this_height);
	            var this_src = this.src;
	            $(img_show.document).ready(function(){
	                setTimeout(function(){
	                    var this_img = $(img_show.document).find("img.gallery");
	                    this_img.css(style,"100%");
	                    this_img.parent().addClass(add_class);
	                    this_img.attr("src",this_src);
	                },300);
	            });
	        }
	        img.src = this_src;
	    }); 


	    this_info.find(".user-avatar-bar:not(.me)").click(function(e){
	        e.stopPropagation();
	    });

	    if(me){

	        this_info.find(".user-avatar.me").click(function(){
	            this_info.find(".user-avatar-upload").trigger("click");
	        });

	        // this_info.find(".user-avatar-bar.me .upload").click(function(){
	        //  this_info.find(".user-avatar-upload").trigger("click");
	        // });

	        //檔案上傳
	        this_info.find(".user-avatar-upload").change(function() {
	            var imageType = /image.*/;
	            var file = $(this)[0].files[0];
	            if( !file ) return;
	            if (file.type.match(imageType)) {
	                var reader = new FileReader();
	                reader.onload = function(e) {
	                    //reset
	                    $(".user-avatar.me > img").remove();
	                    var new_img = $("<img style='opacity:1' src=\"images/common/others/empty_img_personal_xl.png\"/>")
	                    $(".user-avatar.me").prepend(new_img);

	                    var img = $(".user-avatar.me > img");
	                    //調整長寬
	                    userInfoAvatarPos(img);
	                    img.attr("src",reader.result);
	                    
	                    //有更動即可按確定
	                    // this_info.find(".user-info-submit").addClass("user-info-submit-ready");

	                    //記錄更動
	                    // this_info.data("avatar-chk",true);
	                    s_load_show = true;

	                    // var ori_arr = [1280,1280,0.7];
	                    // var tmb_arr = [120,120,0.6];
	                    // var file = this_info.find(".user-avatar-upload")[0].files[0];
	                    // var api_name = "groups/"+gi+"/users/"+gu+"/avatar";

	                    qmiUploadFile({
	                        thisGi: gi,
	                        // thisTi: thisTi,
	                        urlAjax: {
	                            apiName: "groups/"+gi+"/users/"+gu+"/avatar",
	                            method: "put"
	                        },
	                        tp: 1,
	                        file: img[0],
	                        oriObj: {w: 1280, h: 1280, s: 0.7},
	                        tmbObj: {w: 120, h: 120, s: 0.6} // ;
	                    }).done(function(data) {
	                        // 關閉load 圖示
	                        console.log("finish", data);
	                        s_load_show = false;
	                        if(data.isSuccess === true) {
	                            //重置團體頭像、名稱的參數
	                            getGroupComboInit(gi).done(function(){
	                                toastShow( $.i18n.getString("USER_PROFILE_UPDATE_SUCC") );    
	                                updateAllAvatarName(gi,gu);
	                            });
	                        } else QmiGlobal.ajaxLoadingUI.hide();
	                    });
	                }
	                reader.readAsDataURL(file);
	            }else{
	                //clear input file
	                var this_file = $(this);
	                this_file.replaceWith( this_file = this_file.clone( true ) );

	                //警語
	                popupShowAdjust("", $.i18n.getString("COMMON_NOT_IMAGE") );
	            }
	        });
	        
	        //資料開放設定
	        this_info.find(".me-info-status").click(function(){
	            $(this).parent().siblings(".me-info-status-switch").toggle();
	        });
	        this_info.find(".me-info-status-switch div").click(function(){
	            var isPrivate = $(this).data("type")=="private";
	            var parentDom = $(this).parent();
	            var type = parentDom.data("type");

	            var input = this_info.find(".user-info-list ."+type);
	            var statusText = this_info.find(".me-info-status."+type+" .status-text")

	            var oriIsPrivate = statusText.data("val");
	            cns.debug(isPrivate, oriIsPrivate, type);
	            if( oriIsPrivate!=isPrivate ){
	                if( isPrivate ){
	                    input.val("******");
	                    statusText.text( $.i18n.getString("COMMON_PRIVATE") ).data("val", true);
	                } else {
	                    input.val( input.data("ori") );
	                    statusText.text( $.i18n.getString("COMMON_PUBLIC") ).data("val", false);
	                }
	                //有更動即可按確定
	                this_info.find(".user-info-submit").addClass("user-info-submit-ready");
	            }
	            
	            parentDom.hide();
	        });

	        this_info.find(".user-info-list input").bind("input",function(){
	            //有更動即可按確定
	            this_info.find(".user-info-submit").addClass("user-info-submit-ready");
	        });

	        //更改資料 送出
	        $(document).off("click",".user-info-submit-ready");
	        $(document).on("click",".user-info-submit-ready",function(){
	            userInfoSend(this_info);
	            //結束關閉
	            this_info.find(".user-info-close").trigger("mouseup");
	        });
	    }else{
	        this_info.find(".action-edit").click(function(){
	            $(".user-info-load-area").addClass("user-info-flip");
	            $(".user-info-load , .me-info-load").stop().animate({
	                opacity:0
	            },400);

	            setTimeout(function(){
	                $(".user-info-load-area .me").removeClass("backface-visibility");
	                $(document).find(".user-info-load-area .user").hide();
	                $(".user-info-load , .me-info-load").stop().animate({
	                    opacity:1
	                },400);
	            },400);

	            setTimeout(function(){
	                $(".user-info-load-area").removeClass("transition1s");
	                $(".user-info-load-area").removeClass("user-info-flip");
	                $(".user-info-load-area .me").addClass("adjust");
	            },1000);
	        });

	        //刪除成員
	        this_info.find(".user-info-delete").click(function(){
	            popupShowAdjust(
	                $.i18n.getString("USER_PROFILE_DELETE_MEMBER_CONFIRM"),
	                $.i18n.getString("USER_PROFILE_DELETE_MEMBER_DESC"),
	                $.i18n.getString("COMMON_OK"),
	                $.i18n.getString("COMMON_CANCEL"),[function(){
	                    userInfoDelete(this_info);
	            },null]);
	        });
	    }


	    //click fav
	    this_info.find(".user-avatar-bar-favorite .fav").mouseup(function(){
	        clickUserInfoFavorite( $(this) );
	    });

	    //個人主頁
	    this_info.find(".action-main").off("click").click( function(){
	        if(window.mainPageObj !== undefined) {
	            mainPageObj.userTimeline(this_info.data("this-info-gi"),this_info);

	            return;
	        }
	        personalHomePage(this_info);
	        $.mobile.changePage("#page-group-main");
	        timelineSwitch("feeds",false,true,true);
	    });
	}
	//切換至個人主頁
	personalHomePage = function(this_info){
	        var groupMainDom = $("#page-group-main");
	        
	        //滾動至最上
	        timelineScrollTop();

	        var this_gu = this_info.data("this-info-gu");
	        var this_gi = this_info.data("this-info-gi");
	        var emptyAut = "images/common/others/empty_img_all_l.png";
	        //結束關閉
	        this_info.find(".user-info-close").trigger("mouseup");
	        //主頁背景
	        var userDom = groupMainDom.find(".gm-user-main-area");
	        userDom.fadeIn("fast",function(){
	            var _thisGroupList = QmiGlobal.groups[this_gi];
	            userDom.find(".background").css("background","url(" + _thisGroupList.guAll[this_gu].auo + ")");
	            userDom.find(".name").html(_thisGroupList.guAll[this_gu].nk);
	            userDom.find(".group .pic").css("background","url(" + _thisGroupList.aut + ")");
	            userDom.find(".group .name").html(_thisGroupList.gn._escape());
	            if(!_thisGroupList.aut){
	                userDom.find(".group .pic").css("background","url(" + emptyAut + ")");
	            }
	        });

	        if($(".alert-area").is(":visible")){
	            $(".alert").removeClass("alert-visit");
	            $(".alert-area-cover").hide();
	            $(".alert").removeClass("alert-click");
	            $(".alert-area").hide();
	        }

	        //不隱藏header
	        $(".user-main-toggle:not(.gm-header)").hide();
	        $(".gm-user-main-area").show();
	        $(".st-feedbox-area").hide();
	        $(".sm-small-area.active").removeClass("active");

	        setTimeout(function(){
	            //滾動至最上
	            timelineScrollTop();

	            groupMainDom.find(".st-feedbox-area div[data-feed=main]").html("");
	            groupMainDom.find(".st-feedbox-area").show();
	            groupMainDom.find(".feed-subarea").hide();
	            groupMainDom.find(".st-filter-area").data("filter","all").hide();
	            
	            groupMainDom
	            .data("main-gu",this_gu)
	            .data("main-gi",this_gi)
	            .data("navi","main");
	            
	            timelineListWrite();
	        },500);
	}

	userInfoSend = function(this_info){
	    var new_name = this_info.find(".user-info-list .nk").val().trim().replace(/( +)/g," ").replace(/[&\|\\\\:\/!*^%$#@\-]/g,"");
	    if(new_name == ""){
	        toastShow( $.i18n.getString("USER_PROFILE_EMPTY_NAME") );
	        return false;
	    }
	    
	    // load show
	    s_load_show = true;
	    var api_name = "groups/"+gi+"/users/"+gu;
	    var headers = {
	         "ui":ui,
	         "at":at, 
	         "li":lang
	    };

	    var body = {
	      nk: new_name, // Nickname
	      sl: this_info.find(".user-info-list .sl").val(), // Slogan
	      mke: this_info.find(".me-info-status.em .status-text").data("val"),
	      mkp: this_info.find(".me-info-status.pn1 .status-text").data("val"),
	      mkb: this_info.find(".me-info-status.bd .status-text").data("val"),
	      pn2: QmiGlobal.groups[gi].guAll[gu].pn2,
	      ext: this_info.find(".user-info-list .et").val(),
	      ti: this_info.find(".user-info-list .ti").val(),
	      mv: this_info.find(".user-info-list .mv").val(),
	      em: this_info.find(".user-info-list .em").val()
	    }

	    var method = "put";
	    ajaxDo(api_name,headers,method,false,body).complete(function(data){
	        s_load_show = false;
	        //重置團體頭像、名稱的參數
	        if(data.status == 200){
	            //重置團體頭像、名稱 失敗也要重置
	            var _groupList = QmiGlobal.groups;
	            _groupList[gi].guAll[gu].nk = body.nk;
	            _groupList[gi].guAll[gu].sl = body.sl;
	            // *--* $.lStorage(ui,_groupList);

	 //         if(this_info.data("avatar-chk")){
	 //             var ori_arr = [1280,1280,0.7];
	                // var tmb_arr = [120,120,0.6];
	                // var file = this_info.find(".user-avatar-upload")[0].files[0];
	                // var api_name = "groups/"+gi+"/users/"+gu+"/avatar";

	                // uploadToS3(file,api_name,ori_arr,tmb_arr,function(chk){
	 //                    // 關閉load 圖示
	 //                    s_load_show = false;
	    
	    //              if(chk) {
	    //                  //重置團體頭像、名稱的參數
	 //                        getGroupCombo(gi,function(){
	 //                            //結束關閉
	 //                            this_info.find(".user-info-close").trigger("mouseup");
	 //                            toastShow( $.i18n.getString("USER_PROFILE_UPDATE_SUCC") );    
	 //                            updateAllAvatarName(gi,gu);    
	 //                        });
	    //              }else{
	 //                        $('.ui-loader').hide();
	 //                        $(".ajax-screen-lock").hide();

	 //                        //結束關閉
	 //                        this_info.find(".user-info-close").trigger("mouseup");
	 //                    }
	    //          });
	 //         }else{
	                // 關閉load 圖示
	                s_load_show = false;
	                
	                // 關閉load 圖示
	                QmiGlobal.ajaxLoadingUI.hide();

	                //重置團體頭像、名稱的參數
	                getGroupCombo(gi,function(){
	                    updateAllAvatarName(gi,gu);    
	                    toastShow( $.i18n.getString("USER_PROFILE_UPDATE_SUCC") );
	                });

	                //結束關閉
	                this_info.find(".user-info-close").trigger("mouseup");
	            // }
	        }
	    });
	}

	userInfoDelete = function(this_info){
	    var this_gu = this_info.data("gu");
	    if(!this_gu){
	        // toastShow( $.i18n.getString("USER_PROFILE_EMPTY_NAME") );
	        cns.debug("userInfoDelete no gu");
	        return false;
	    }

	    // load show
	    var api_name = "groups/"+gi+"/users/"+this_gu+"/status";
	    var headers = {
	            ui: ui,
	            at: at,
	            li: lang
	                 };
	    var method = "put";
	    var body = { st: 2 };
	    
	    ajaxDo(api_name,headers,method,true,body).complete(function(data){
	        s_load_show = false;
	        
	        // 關閉load 圖示
	        QmiGlobal.ajaxLoadingUI.hide();
	        //重置團體頭像、名稱的參數
	        if(data.status == 200){
	            //重置團體頭像、名稱 失敗也要重置
	            var _groupList = QmiGlobal.groups;
	            _groupList[gi].guAll[this_gu].st = 2;
	            // *--* $.lStorage(ui,_groupList);

	            if( $(".subpage-contact").length>0 ){
	                initContactData();
	                initContactList();
	            }

	            //結束關閉
	            this_info.find(".user-info-close").trigger("mouseup");
	        } else {
	            toastShow( $.i18n.getString("COMMON_CHECK_NETWORK") );
	        }
	    });
	}

	//這也可以合併..avatarPos
	userInfoAvatarPos = function(img){
	    //魔術數字 是個人資料的長寬比例400/250 小於這個比例 就要以寬為長邊
	    var magic_number = 1.6;
	    //偵測長寬
	    var user_info_width = $(".user-info-load-area .width-chk").width() || 400;
	    //調整長寬
	    img.load(function() {

	        //高為長邊
	        if((this.width / this.height) > magic_number){
	            img.css("height",250);
	            img.css("margin-left",((img.width()-user_info_width)/2)* -1);
	            img.css("opacity",0);
	        }else{
	        //寬為長邊
	            img.css("width",user_info_width);
	            img.css("margin-top",((img.height()-250)/2)* -1);
	            img.css("opacity",0);
	        }

	        img.stop().animate({
	            opacity:1
	        },300);
	    });
	}

	clickUserInfoFavorite = function( this_fav ){
	    var this_info = this_fav.parents(".user-info-load");
	    var this_gu = this_info.data("this-info-gu");
	    var this_gi = this_info.data("this-info-gi");
	    
	    if( null==this_gu || null==this_gi ) return;

	    var result;
	    var succFav;
	    if( this_fav.hasClass("active") ){
	        result = updateUserFavoriteStatusApi(this_gi, null, [this_gu] );
	        succFav = false;
	    } else {
	        result = updateUserFavoriteStatusApi(this_gi, [this_gu], null );
	        succFav = true;
	    }
	    result.complete(function(data){
	        if(data.status == 200){
	            //update user fav
	            var tmp = QmiGlobal.groups;
	            if( tmp.hasOwnProperty(this_gi) ){
	                if( tmp[this_gi].guAll && tmp[this_gi].guAll.hasOwnProperty(this_gu) ){
	                    tmp[this_gi].guAll[this_gu].fav = succFav;
	                    if(succFav){
	                        this_fav.parent().find(".active").show();
	                        this_fav.parent().find(".deactive").hide();
	                    } else {
	                        if( tmp[this_gi].favCnt<0 ) tmp[this_gi].favCnt = 0;
	                        this_fav.parent().find(".active").hide();
	                        this_fav.parent().find(".deactive").show();
	                    }
	                    // *--* $.lStorage(ui, tmp);

	                    updateFavoriteMember(this_gi);
	                }
	            }
	        }
	    });
	}

	updateFavoriteMember = function(this_gi){
	    try{
	        var _groupList = QmiGlobal.groups;
	        var guAll = _groupList[this_gi].guAll;
	        var favCnt = 0;
	        $.each(guAll,function(i,val){
	            if(null==val || val.st!=1 ) return;
	            //fav cnt
	            if( true==val.fav ) favCnt++;
	        });
	        _groupList[this_gi].favCnt = favCnt;
	        // *--* $.lStorage(ui, _groupList);

	        if( this_gi==gi ){
	            updateContactFavorite();
	        }
	    } catch(e){
	        errorReport(e);
	    }
	}

	updateUserFavoriteStatusApi = function( this_gi, al, dl ){
	    //PUT groups/G000006s00q/favorite_users
	    var api_name = "groups/" + this_gi + "/favorite_users";
	    var headers = {
	        "ui":ui,
	        "at":at, 
	        "li":lang
	    };
	    var body = {};
	    if( null!=al ) body.al = al;
	    if( null!=dl ) body.dl = dl;

	    var method = "put";
	    return ajaxDo(api_name,headers,method,true,body);
	}

}())