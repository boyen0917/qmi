(function(){

	$(document).on("mouseup",".namecard",function(e) { 
		e.stopPropagation();
		
		var userData = QmiGlobal.groups[gi].guAll[$(this).data("gu")] || {};

		if($(document).data("official") == true) return false;

		$(document).data("namecard-pos",$(window).scrollTop());
		$(window).scrollTop(0);
		// $(".user-info-load-area").css("top",$(window).scrollTop());
		// $(".screen-lock").css("top",$(window).scrollTop());

		//調整
		$("#page-group-main .gm-content").css("overflow","initial");

		//鈴鐺頁面不動作
		if($(this).parents(".al-subbox").length) $(this).parents(".al-subbox").data("stop",true);
		if (userData.ad > 0 && userData.st > 0) { 
			userInfoShow($(this).data("gi"), $(this).data("gu"));
		}
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
	                    timelineSwitch("feed", true);
	                });

	            } else {
	                cns.debug("[getUserInfo] no group data, getting..",this_user_info.gi);
	                getGroupComboInit(this_user_info.gi, function(){
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

	// Date   : 2017/8/8
	// Author : Brian
	// Msg    : pollingCmds 一次取得複數成員更新
	getMultipleUserInfo = function(itemArr, updateChk, loadShowChk, onAllDone){
	    onAllDone = onAllDone || function() {};
	    var deferred = $.Deferred();
	    var isSucc = false;
	    var rspUserArr = [];
	    var ciApiMap = {};
	    var itemMap = itemArr.reduce(function(map, curr) {
	        if(!QmiGlobal.groups[curr.gi]) return;
	            
	        // 私雲
	        (function() {
	            var map = QmiGlobal.companyGiMap[curr.gi] || {ci: "public"};

	            ciApiMap[map.ci] = ciApiMap[map.ci] || [];
	            ciApiMap[map.ci].push(curr);
	        }())

	        map[curr.gu] = curr;
	        return map;
	    }, {});

	    $.when.apply($, Object.keys(ciApiMap).map(function(currCi) {
	        var deferred = $.Deferred();
	        var apiCi = currCi === "public"
	            ? null
	            : currCi;

	        new QmiAjax({
	            apiName: "sys/group_users",
	            method: "post",
	            ci: apiCi,
	            body: {gul: ciApiMap[currCi]}
	        }).complete(function(rawData) {
	            try {
	                rspUserArr.concat($.parseJSON(rawData.responseText).gul);
	            } catch(e) {}

	            deferred.resolve();
	        });
	        return deferred.promise();
	    })).done(function() {

	        var invalidTime = new Date().getTime()+(86400000*3);
	        $.each(rspUserArr, function(i, user){

	            // polling 會加method進去 所以要用這個
	            var currItem = itemMap[user.gu];

	            // polling tp=4 會加入isNewMem = true  三天後失效
	            if(currItem.isNewMem){
	                var newMemList = $.lStorage("_newMemList") || {};
	                newMemList[user.gi] = newMemList[user.gi] || {};
	                newMemList[user.gi][user.gu] = invalidTime;
	                $.lStorage("_newMemList", newMemList);
	            }
	            
	            // 應該不會有沒有的情況
	            var groupData = QmiGlobal.groups[user.gi];

	            if(Object.keys(groupData.guAll).length > 0){
	                groupData.guAll[user.gu] = user;
	                //更新所有照片、名字 this_gi , this_gu , set_name ,set_img
	                if(updateChk) updateAllAvatarName(user.gi, user.gu);
	            }

	            if(currItem.onGetMemData) currItem.onGetMemData(user.gi, user);
	        });

	        deferred.resolve(true);
	    });
	    
	    deferred.done(onAllDone);
	    return;
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
	                userInfoEvent(this_info, user_data);
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
	    var avatar_bar_arr = ["nk", "sl", "bd", "bl", "ti"];
	    var img_arr = ["em", "pn", "pn1", "ext", "mv", "spn", "spn2"];
	    var selector;
	    for( item in user_data){
            var method = "html";
            if (me) method = "val";

	        if (user_data[item].length > 0) {
	            if (item == "bd" && me) {
	                user_data[item] = user_data[item].substring(0,4) + "/" + user_data[item].substring(4,6) + "/" + user_data[item].substring(6);
	            }

	            if ($.inArray(item,avatar_bar_arr) >= 0) {
	                selector = this_info.find(".user-avatar-bar");
	            } else {
	                selector = this_info.find(".user-info-list");
	            }

	            if (!me && item == "bd") {
	                user_data.bd = user_data.bd.substring(4,6) + "." + user_data.bd.substring(6,8);
	                
	                method = "append";
	            }

	            if (item == "bl") {
	                try{
	                	var bn = "";
	                	var branchList = QmiGlobal.groups[this_gi].bl;
	                	var bnList = [];
	                	var test = selector.find(".bl");
	                	var isClipped = false;
	                	
	                    var isBranchNameExist = function (bi) {
                			return branchList[bi] && branchList[bi].bn.length > 0
                		}

                		test.show();
	                    test = test[0];
	                	
	                	var multiBranchName = user_data.bl.split(",").reduce(function (BnList, multiBi) {
	                		var singleBranchName = multiBi.split(".").reduce(function(arr, singleBi) {
	                			if (isBranchNameExist(singleBi)) {
	                				arr.push(branchList[singleBi].bn)
	                			}
	                			return arr;
	                		}, []).join("-");

	                		if (singleBranchName.length > 0) {
	                			BnList.push(singleBranchName);
	                		}
	                		console.log(singleBranchName)
	                		return BnList;
	                	}, []).join("\n");

	                	test.innerHTML = multiBranchName;

	                    user_data.bl = multiBranchName;
	                    cns.debug(multiBranchName);
	                    cns.debug(user_data.bl);
	                    
	                } catch(e) {
	                    errorReport(e);
	                    continue;
	                }
	            }

	            if (item == "nk") {
	                selector.find("."+item)[method]((
	                    (user_data.nk2 && user_data.nk2.length > 0) 
	                        ? user_data[item] + " (" + user_data.nk2 + ")" 
	                        : user_data[item] ))
	            } else {
	                selector.find("."+item)[method](user_data[item]).show();
	            }

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
	            // this_info.find(".user-avatar-bar .bd").hide();
	            // this_info.find(".user-info-list .bd").html("******");   
	        }else{
	            this_info.find(".user-avatar-bar .user-name").addClass("hidden");
	        }
	    } else {
	        this_info.find(".user-avatar-bar .user-name").addClass("hidden");
	    }

	    if (user_data.st == 2) {
	        this_info.find(".action, .sl, .bd, .bl").hide();
	    }
	}

	meInfoShow = function(user_data) {
	    var this_gi = gi;
	    var this_gu = gu;

	    var groupSettingData = QmiGlobal.groups[this_gi].set || {};
	    var modifyNameSwitch = (groupSettingData.bss || []).find(function(obj) {
	        return obj.no == 0;
	    });

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

	        if (modifyNameSwitch && modifyNameSwitch.st != 2) {
	            this_info.find(".user-info-list input.nk").prop('disabled', true);
	        }

	        for( item in user_data){
	            if(user_data[item]){
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

	        userInfoEvent(this_info, user_data, true);

	        // this_info.data("avatar-chk",false);
	        // $(".screen-lock").fadeOut("fast");
	        // this_info.fadeOut("fast");

	        // if(callback) callback(false);
	    });
	}

	userInfoEvent = function(thisInfo, userData, me){
	    thisInfo.unbind();
	    
	    thisInfo.find(".user-avatar").click(function(){
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


	    thisInfo.find(".user-avatar-bar:not(.me)").click(function(e){
	        e.stopPropagation();
	    });

	    if(me){

	        thisInfo.find(".user-avatar.me").click(function(){
	            thisInfo.find(".user-avatar-upload").trigger("click");
	        });

	        // this_info.find(".user-avatar-bar.me .upload").click(function(){
	        //  this_info.find(".user-avatar-upload").trigger("click");
	        // });

	        //檔案上傳
	        thisInfo.find(".user-avatar-upload").change(function() {
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
	        thisInfo.find(".me-info-status").click(function(){
	            $(this).parent().siblings(".me-info-status-switch").toggle();
	        });
	        thisInfo.find(".me-info-status-switch div").click(function(){
	            var isPrivate = $(this).data("type")=="private";
	            var parentDom = $(this).parent();
	            var type = parentDom.data("type");

	            var input = thisInfo.find(".user-info-list ."+type);
	            var statusText = thisInfo.find(".me-info-status."+type+" .status-text")

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
	                thisInfo.find(".user-info-submit").addClass("user-info-submit-ready");
	            }
	            
	            parentDom.hide();
	        });

	        thisInfo.find(".user-info-list input").bind("input",function(){
	            //有更動即可按確定
	            thisInfo.find(".user-info-submit").addClass("user-info-submit-ready");
	        });

	        //更改資料 送出
	        $(document).off("click",".user-info-submit-ready");
	        $(document).on("click",".user-info-submit-ready",function(){
	            userInfoSend(thisInfo);
	            //結束關閉
	            thisInfo.find(".user-info-close").trigger("mouseup");
	        });
	    }else{
	        thisInfo.find(".action-edit").click(function(){
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
	        thisInfo.find(".user-info-delete").click(function(){
	            popupShowAdjust(
	                $.i18n.getString("USER_PROFILE_DELETE_MEMBER_CONFIRM"),
	                $.i18n.getString("USER_PROFILE_DELETE_MEMBER_DESC"),
	                $.i18n.getString("COMMON_OK"),
	                $.i18n.getString("COMMON_CANCEL"),[function(){
	                    userInfoDelete(thisInfo);
	            },null]);
	        });
	    }


	    //click fav
	    thisInfo.find(".user-avatar-bar-favorite .fav").mouseup(function(){
	        clickUserInfoFavorite( $(this) );
	    });

	    //個人主頁
	    thisInfo.find(".action-main").off("click").click( function(){
	        if(window.mainPageObj !== undefined) {
	            mainPageObj.userTimeline(thisInfo.data("this-info-gi"),thisInfo);
	            return;
	        }
	        personalHomePage(thisInfo, userData);
	        $.mobile.changePage("#page-group-main");
	        timelineSwitch("person",false,true,true);
	    });
	}
	//切換至個人主頁
	personalHomePage = function(thisInfo, userData) {
	    var groupMainDom = $("#page-group-main");
	    console.log(userData);
	    
	    //滾動至最上
	    timelineScrollTop();

	    var this_gu = thisInfo.data("this-info-gu");
	    var this_gi = thisInfo.data("this-info-gi");

	    var emptyAut = "images/common/others/empty_img_all_l.png";
	    //結束關閉
	    thisInfo.find(".user-info-close").trigger("mouseup");
	    //主頁背景
	    var userDom = groupMainDom.find(".gm-user-main-area");
	    var userIsAdmin = (QmiGlobal.groups[gi].ad == 1) ? true : false;
	    var userInfoArea = groupMainDom.find(".st-personal-area");
	    var userBranch = (userData.bl && userData.bl != "") ? userData.bl : "";
	    var userTitle = (userData.ti && userData.ti != "") ? userData.ti : "";
	    // var userJobTitle = ((userBranch + userTitle).length > 0) ? (userBranch + "<br>" + userTitle) : $.i18n.getString("USER_PROFILE_NO_DATA");
	    var userBirth = (userData.bd && userData.bd != "") ? userData.bd : $.i18n.getString("USER_PROFILE_NO_DATA");
	    var userEmail = (userData.em && userData.em != "") ? userData.em : $.i18n.getString("USER_PROFILE_NO_DATA");
	    var extension = (userData.ext && userData.ext != "") ? userData.ext : $.i18n.getString("USER_PROFILE_NO_DATA");
	    var userMobile = (userData.pn1 && userData.pn1 != "") ? userData.pn1 : $.i18n.getString("USER_PROFILE_NO_DATA");
	    var mvpn = (userData.mv && userData.mv != "") ? userData.mv : $.i18n.getString("USER_PROFILE_NO_DATA");
	    var sipMobile = (userData.spn && userData.spn != "") ? userData.spn : $.i18n.getString("USER_PROFILE_NO_DATA");
	    var sipDesktop = (userData.spn2 && userData.spn2 != "") ? userData.spn2 : $.i18n.getString("USER_PROFILE_NO_DATA");

	    userBirth = (userIsAdmin || !userData.mkb || gu == this_gu) ? userBirth : "******";
	    userEmail = (userIsAdmin || !userData.mke || gu == this_gu) ? userEmail : "******";
	    userMobile = (userIsAdmin || !userData.mkp || gu == this_gu) ? userMobile 
	        + "<p>" + $.i18n.getString("USER_PROFILE_PHONE") + "</p>"  : "******";

	    userDom.fadeIn("fast",function(){
	        var _thisGroupList = QmiGlobal.groups[this_gi];
	        var type;
	        var isFavUser = QmiGlobal.groups[this_gi].guAll[this_gu].fav;
	        var groupSettingData = QmiGlobal.groups[this_gi].set || {};
	        var modifyNameSwitch = (groupSettingData.bss || []).find(function(obj) {
	            return obj.no == 0;
	        });

	        $(this).find(".background").removeClass("me").find("img")
	               .attr("src", userData.put || "images/common/others/timeline_kv1_android.png").end().end()
	               .find(".user h3").text(getFullName(userData)).end()
	               .find(".user .edit-full-name").hide().end()
	               .find(".user .edit-pen").hide().end()
	               .find(".edit-decision").css("visibility", "hidden").end()
	               .find(".user .user-pic").removeClass("me").end()
	               .find(".user .pic").attr("src", userData.auo || "images/common/others/empty_img_personal_xl.png").end()
	               .find(".user .slogan").text(userData.sl).end()
	               .find(".user .interaction").show().end()
	               .find(".interaction .favorite").attr("src", isFavUser ? "images/namecard/qicon_favorite_actived.png" : "images/namecard/qicon_favorite.png")
	               .find(".onoffswitch").hide();

	        if (gu == this_gu) {
	            $(this).find(".background").addClass("me").end()
	                   .find(".user input.name").prop("disabled", true).end()
	                   .find(".user .edit-pen").show().end()
	                   .find(".user .user-pic").addClass("me").end()
	                   // .find(".user .slogan").addClass("me").end()
	                   .find(".user .interaction").hide().end()
	                   .find(".onoffswitch").show();
	        }

	        $(this).find(".background").off("click").on("click", function () {
	            if ($(this).hasClass("me")) {
	                $(this).siblings(".setting-user-image").trigger("click");
	                type = "cover";
	            }
	        });

	        $(this).find(".user-pic").off("click").on("click", function () {
	            if ($(this).hasClass("me")) {
	                userDom.find(".setting-user-image").trigger("click");
	                type = "avatar";
	            }
	        });

	        $(this).find(".user .edit-pen").off("click").on("click", function (e) {
	            $(this).find(".user .edit-full-name").show().end()
	                .find(".user input.name").val(userData.nk).end()
	                .find(".user input.nickname").val(userData.nk2).end()
	                .find(".user h3").hide();

	            if (modifyNameSwitch && modifyNameSwitch.st == 2) {
	                $(this).find(".user input.name").prop("disabled", false).focus();
	            } else {
	                $(this).find(".user input.nickname").focus();
	            }

	            $(this).find(".user .slogan").addClass("me").attr("contentEditable", true).end()
	                   .find(".user .edit-decision").css("visibility", "visible");
	            
	            $(e.target).hide();

	        }.bind(this));

	        $(this).find(".edit-decision .save").off("click").on("click", function (e) {
	            var userObj = {
	                gu : userData.gu,
	                info : {
	                    nk : userDom.find(".user input.name").val(),
	                    nk2 : userDom.find(".user input.nickname").val(),
	                    sl : userDom.find(".user .slogan").text(),
	                    mkb : userData.mkb,
	                    mke : userData.mke,
	                    mkp : userData.mkp,
	                }
	            };

	            updateUserInfo(userObj).done(function (completeMsg) {
	                userDom.find(".user h3").html(getFullName(userObj.info)).show().end()
	                       .find(".user .edit-full-name").hide().end()
	                       .find(".user .slogan").removeClass("me").attr("contentEditable", false).end()
	                       .find(".user .edit-decision").css("visibility", "hidden").end()
	                       .find(".user .edit-pen").show();

	                userData.nk = userObj.info.nk;
	                userData.nk2 = userObj.info.nk2;

	                toastShow(completeMsg);
	            }).fail(function (failMsg) {
	                toastShow(failMsg);
	            });
	        });

	        $(this).find(".edit-decision .cancel").off("click").on("click", function () {
	            $(this).find(".user h3").html(getFullName(userData)).show().end()
	                   .find(".user .edit-full-name").hide().end()
	                   .find(".user .slogan").removeClass("me").attr("contentEditable", false).html(userData.sl).end()
	                   .find(".user .edit-decision").css("visibility", "hidden").end()
	                   .find(".user .edit-pen").show();
	        }.bind(this));

	        $(this).find(".setting-user-image").off("change").on("change", function () {
	            var inputFile = $(this);
	            var file = inputFile[0].files[0];
	            var reader = new FileReader();
	            var apiName = "groups/" + gi + "/users/" + this_gu + "/page";

	            if (type == "cover") {
	                var imageElement = userDom.find(".background img");
	            } else {
	                var imageElement = userDom.find(".user-pic img");
	                apiName = "groups/" + gi + "/users/" + this_gu + "/avatar";
	            }
	            reader.onload = function(e) {
	                imageElement.attr("src",reader.result);
	            }
	            reader.readAsDataURL(file);
	            qmiUploadFile({
	                urlAjax: {
	                    apiName: apiName,
	                    method: "put"
	                },
	                isPublicApi: true,
	                file: imageElement[0],
	                oriObj: {w: 1280, h: 1280, s: 0.7},
	                tmbObj: {w: 480, h: 480, s: 0.6},
	                tp: 1 // ;
	            }).done(function(resObj) {
	                if (resObj.isSuccess) toastShow($.i18n.getString("USER_PROFILE_UPDATE_SUCC"));
	                else toastShow($.i18n.getString("COMMON_UPLOAD_FAIL"));
	            });
	        });

	        $(this).find(".interaction .chat").off("click").on("click", function () {
	            requestNewChatRoomApi( this_gi, "", [{gu:this_gu}], function(data){
	            });
	        });

	        $(this).find(".interaction .favorite").off("click").on("click", function () {
	            var isFav = QmiGlobal.groups[gi].guAll[this_gu].fav;
	            var favIcon = $(this);
	            var ajaxData = {
	                apiName : "/groups/" + gi + "/favorite_users/",
	                method : "put",
	                isPublicApi : true,
	                body : {}
	            };

	            if (!isFav) ajaxData.body.al = [this_gu];
	            else ajaxData.body.dl = [this_gu];

	            new QmiAjax(ajaxData).complete(function (data) {
	                if (data.status == 200) {
	                    QmiGlobal.groups[gi].guAll[this_gu].fav = !isFav;
	                    favIcon.attr("src", !isFav ? "images/namecard/qicon_favorite_actived.png" : "images/namecard/qicon_favorite.png")
	                }
	                toastShow($.parseJSON(data.responseText).rsp_msg);
	            });
	        });
	    });

	    if ((userBranch + userTitle).length > 0) {
	        if (userBranch.length == 0) {
	            userInfoArea.find(".job-title").html(userTitle);
	        } else {
	            userInfoArea.find(".job-title").html(userBranch + "<br>" + userTitle);
	        }
	    } else {
	        userInfoArea.find(".job-title").html($.i18n.getString("USER_PROFILE_NO_DATA"));
	    }

	    userInfoArea.find(".birth").html(userBirth).end()
	                .find(".email").html(userEmail).end()
	                .find(".phone").html(extension + "<p>" + $.i18n.getString("USER_PROFILE_EXTENSION") + "</p>").end()
	                .find(".mobile").html(userMobile).end()
	                .find(".mvpn").html(mvpn + "<p>" + $.i18n.getString("USER_PROFILE_MVPN") + "</p>").end()
	                .find(".sip-mobile").html(sipMobile + "<p>" + $.i18n.getString("USER_PROFILE_SIP_NUMBER1") + "</p>").end()
	                .find(".sip-desktop").html(sipDesktop + "<p>" + $.i18n.getString("USER_PROFILE_SIP_NUMBER2") + "</p>").end()
	                .find(".onoffswitch").hide();

	    if (gu == this_gu) {
	        userInfoArea.find(".onoffswitch").show().end()
	                    .find("#birthOnOff").attr("checked", !userData.mkb).end()
	                    .find("#emailOnOff").attr("checked", !userData.mke).end()
	                    .find("#mobileOnOff").attr("checked", !userData.mkp);

	        userInfoArea.find('.onoffswitch input[type=checkbox]').off('change').on('change', function(e) {

	            var userObj = {
	                gu : userData.gu,
	                info : {
	                    nk : userData.nk,
	                    sl : userData.sl,
	                    mkb : userData.mkb,
	                    mke : userData.mke,
	                    mkp : userData.mkp,
	                }
	            };
	            var switchName = e.target.id;

	            switch (switchName) {
	                case "birthOnOff":
	                    userObj.info.mkb = !$(this).is(':checked');
	                    break;
	                case "emailOnOff":
	                    userObj.info.mke = !$(this).is(':checked');
	                    break;
	                case "mobileOnOff":
	                    userObj.info.mkp = !$(this).is(':checked');
	                    break;
	            }
	            
	            updateUserInfo(userObj).done(function (completeMsg) {
	                toastShow(completeMsg);
	            }).fail(function (failMsg) {
	                toastShow(failMsg);
	            });
	        });
	    }

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
	        // groupMainDom.find(".st-feedbox-area").hide();
	        groupMainDom.find(".feed-subarea").hide();
	        groupMainDom.find(".st-filter-action").filter("[data-navi='personal-info']")
	                    .show().addClass("st-filter-list-active");
	        // groupMainDom.find(".st-filter-area").data("filter","all");
	        userInfoArea.show();
	        groupMainDom
	        .data("main-gu",this_gu)
	        .data("main-gi",this_gi)
	        .data("navi","main");
	        
	        console.log($("#page-group-main").data("navi"));
	        console.log(groupMainDom.data("navi"));
	        // timelineListWrite();
	    },500);
	}

	updateUserInfo = function (userObj) {
	    var ajaxData = {
	        apiName : "/groups/" + gi + "/users/" + userObj.gu,
	        method : "put",
	        isPublicApi : true,
	        body : userObj.info
	    };

	    var deferred = $.Deferred();

	    new QmiAjax(ajaxData).complete(function (data) {
	        if (data.status == 200) deferred.resolve($.parseJSON(data.responseText).rsp_msg);
	        else deferred.reject($.i18n.getString("COMMON_UPLOAD_FAIL"));
	    });

	    return deferred.promise();
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
	      nk: new_name, // name
	      nk2: this_info.find(".user-info-list .nk2").val(), //nickname
	      sl: this_info.find(".user-info-list .sl").val(), // Slogan
	      mke: this_info.find(".me-info-status.em .status-text").data("val"),
	      mkp: this_info.find(".me-info-status.pn1 .status-text").data("val"),
	      mkb: this_info.find(".me-info-status.bd .status-text").data("val"),
	      pn2: QmiGlobal.groups[gi].guAll[gu].pn2,
	      ext: this_info.find(".user-info-list .et").val(),
	      ti: this_info.find(".user-info-list .ti").val(),
	      mv: this_info.find(".user-info-list .mv").val(),
	      // em: this_info.find(".user-info-list .em").val() //無法進行修改E-Mail，先不送
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

	            // 關閉load 圖示
	            s_load_show = false;
	            
	            // 關閉load 圖示
	            QmiGlobal.ajaxLoadingUI.hide();

	            //重置團體頭像、名稱的參數
	            getGroupComboInit(gi,function(){
	                updateAllAvatarName(gi,gu);    
	                toastShow( $.i18n.getString("USER_PROFILE_UPDATE_SUCC") );
	            });

	            //結束關閉
	            this_info.find(".user-info-close").trigger("mouseup");
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