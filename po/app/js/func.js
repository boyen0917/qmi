setGroupInitial = function(new_gi,chk){
    var groupMenuDef = $.Deferred();
    var allDoneDeferred = $.Deferred();

    //設定目前團體
    setThisGroup(new_gi);

    //sidemenu user
    setSmUserData(gi,gu,gn);


    //header 設定團體名稱
    $(".header-group-name div:eq(1)").html(gn);

    // chk是從同意邀請來的 不需要再做 groupMenuListArea
    if(chk === true) 
        groupMenuDef.resolve();
    else
        groupMenuListArea(true).always(function(){ groupMenuDef.resolve(); })
        
    //做團體列表、top event
    $.when(groupMenuDef.promise(),topEvent()).done(function(){

        // 團體ui active
        var defaultGroupDom = $(".sm-group-list-area .sm-group-area[data-gi="+ gi +"]");
        defaultGroupDom.addClass("active");

        try {
            updatePollingCnts(defaultGroupDom.find(".sm-count"),"A5");    
        } catch(e) {
            console.log("initial updatePollingCnts error");
        }
        
        //動態消息
        var tmp = $(".sm-small-area:not(.setting):visible");
    
        // 定時重新整理 為了健康
        if(QmiGlobal.isAppReload === true) {
            var param = QmiGlobal.auth.appReloadObj.param;
            timelineSwitch(param.act, param.reset, param.main, true);// noAppReload = true;

        } else if( tmp.length>0 ){

            $(tmp[0]).addClass("active");
            timelineSwitch( $(tmp[0]).data("sm-act") || "feeds",true);

        } else {
            timelineSwitch("feeds",true);
        }

        allDoneDeferred.resolve();
    });

    return allDoneDeferred.promise();
}

chkBranch = function(){
    // cns.debug("=========================");
    // cns.debug("typeof QmiGlobal.groups[gi].bl:",typeof QmiGlobal.groups[gi].bl);
    // cns.debug("first key",Object.keys(QmiGlobal.groups[gi].bl)[0]);
    // cns.debug("typeof first element",typeof QmiGlobal.groups[gi].bl[Object.keys(QmiGlobal.groups[gi].bl)[0]].lv);
    // cns.debug("=========================");
    if(typeof QmiGlobal.groups[gi].bl == "object"){
        var first_key = Object.keys(QmiGlobal.groups[gi].bl)[0];
        if(typeof first_key != "undefined" && typeof QmiGlobal.groups[gi].bl[first_key].lv == "undefined")
            return true;
    }else{
        return true;
    }

    return false;
}

createGroup = function (group_name,group_desc){
    
    var api_name = "groups";
    var headers = {
        ui: ui,
        at: at,
        li: lang
    };
    var body = {
        gn: group_name,
        gd: group_desc
    }
    var method = "post";
    return ajaxDo(api_name,headers,method,true,body);
}

getMeInvite = function(){
    var api_name = "me/invitations";

    var headers = {
            ui: ui,
            at: at,
            li: lang
                 };
    var method = "get";
    ajaxDo(api_name,headers,method,false).complete(function(data){
        if(data.status !== 200) return;

        var allInvitationsObj =$.parseJSON(data.responseText);
        var allInvArr = allInvitationsObj.gl;
        var allInvitationDef = $.Deferred(); // 私雲邀請deferred
        var clFlag = (function(){
                if(allInvitationsObj.cl === undefined || allInvitationsObj.cl.length === 0)
                    return false;
                else
                    return true;
            }())

        // 有私雲的話 要loop解決 1.token 2.邀請函
        if(clFlag !== false) {
            
            var companyTokenInvDefArr = [],  // 未知的cl token deferred
                clInvitationDefArr = [$.Deferred()]; // 解出各cl有多少團體邀請的deferred ,預設第一個deferred 是為了第二個when

            // 沒token再取token 然後再做 invitation 
            allInvitationsObj.cl.forEach(function(item,i){
                var tempDeferred = $.Deferred();
                companyTokenInvDefArr[i] = $.Deferred();

                // 邀請函回來的一定要cert 幫他加入ctp 1
                item.ctp = 1;

                // 沒有存過的ci 才去取token
                if(QmiGlobal.companies.hasOwnProperty(item.ci) === false)
                    getCompanyToken(item).done(tempDeferred.resolve);
                else
                    tempDeferred.resolve();

                // token 完成
                tempDeferred.done(function(){
                    new QmiAjax({
                        apiName: "me/invitations",
                        ci: item.ci,
                        success: function(data){
                            if(data.gl === undefined || data.gl.length === 0) return;

                            // 把ci補進去團體列表 作為私雲的辨識
                            var companyGroupList = data.gl.map(function(cItem){
                                cItem.ci = item.ci
                                return cItem;
                            });
                            // [obj,obj] -> 不能 concat
                            allInvArr.push.apply(allInvArr,companyGroupList);
                        },
                        complete: function(){
                            // invitation完成
                            companyTokenInvDefArr[i].resolve();
                        }
                    })
                });
            }); 

            // token & invitation 都完成
            $.when.apply($,companyTokenInvDefArr).done(allInvitationDef.resolve);
        } else {
            allInvitationDef.resolve();
        }

        allInvitationDef.done(function(){
            
            $(".gmi-div-area").html("");
            //沒有團體邀請即顯示
            if(allInvArr.length == 0) {
                $(".gmi-coachmake").show();
                return;
            } else {
                $(".gm-invite-area").data("cnt",(allInvArr.length));
                $(".gmi-coachmake").hide();
            }
            

            allInvArr.forEach(function(item){
                $(".gmi-div-area").append($('<div>').load('layout/layout.html .gmi-div',function(){
                    var inviteDom = $(this).find(".gmi-div");
                    inviteDom._i18n();
                    inviteDom.data("invite-data",item);
                    inviteDom.find(".gmi-div-data div:eq(0)").html( $.i18n.getString("GROUP_GROUP_INVITATION", "<span>"+item.gn._escape()+"</span>") );
                    inviteDom.find(".gmi-div-data div:eq(1)").html( $.i18n.getString("GROUP_MEMBERS", "<span>"+item.cnt+"</sapn>") );

                    if(item.aut){
                        inviteDom.find(".gmi-div-avatar .aut").attr("src",item.aut);
                        // this_invite.find(".gmi-div-avatar .auo").attr("src",item.auo);
                        inviteDom.find(".group-pic").data("auo",item.auo);
                        avatarPos(inviteDom.find(".gmi-div-avatar .aut"),70);
                    }

                    inviteDom.find(".gmi-div-desc-area").html(item.gd);

                }));
            }); // end of forEach
        }); // end of companyInvitationDef
    });
}


agreeMeInvite = function(inviteDom){
    //私雲之後再做
    var deferred = $.Deferred(),
        inviteData = inviteDom.data("invite-data");
    
    new QmiAjax({
        apiName: "me/groups",
        ci: inviteData.ci, // 有ci就用cloud的邀請
        method: "post",
        body: {
            id: inviteData.ik,
            tp: inviteData.tp,
            gi: inviteData.gi
        }
    }).complete(function(data){
        if(data.status == 200){
            //polling cnts
            $(".hg-invite .sm-count").html(0).hide();

            groupMenuListArea().done(function(){

                //combo
                getGroupComboInit(inviteData.gi,function(){

                    //若只有一個團體 就去該團體
                    if(Object.keys(QmiGlobal.groups).length == 1) {
                        $.mobile.changePage("#page-group-main");
                        
                        setGroupInitial( Object.keys( QmiGlobal.groups )[0] , true );
                        $("#page-group-menu .page-back").show();
                    } else {
                        toastShow( $.i18n.getString("GROUP_JOIN_SUCC") );    
                    }
                });
                    
            });
            inviteDom.remove();
        }
    });
}

deleteMeInvite = function(this_invite){

    var invite_data = this_invite.data("invite-data");
    var api_name = "me/invitations?ik=" + invite_data.ik + "&tp=" + invite_data.tp + "&gi=" + invite_data.gi;
    var headers = {
            ui: ui,
            at: at,
            li: lang
                 };
    var method = "delete";
    ajaxDo(api_name,headers,method,true).complete(function(data){
        
        if(data.status == 200){
            this_invite.hide('fast', function(){ 
                this_invite.remove();
                if($(".gmi-div").length == 0) {
                    $(".gmi-coachmake").show(); 
                }
            });
        }
    });
}

getUserAvatarName = function (thisGi , thisGu , setName ,setImg){
    //先檢查localStorage[gi].guAll是否存在
    var memberData = QmiGlobal.groups[thisGi].guAll[thisGu],
        aut = auo = nk = "";
        
    try {
        //設定圖片
        if(setImg) setImg.attr("src",memberData.aut || "images/common/others/empty_img_personal_l.png");

        setName.html(memberData.nk.replaceOriEmojiCode());
    } catch(e) {
        errorReport(e);
    }
}

timelineChangeGroup = function (thisGi) {

    $(".official").hide();
    
    //清空畫面
    $(".st-top-event-default").show();
    $(".st-top-event-set").hide();
    $(".feed-subarea").html("");
    $(".sm-small-area.active").removeClass("active");


    var changeDeferred = $.Deferred(),
        comboDeferred = $.Deferred();
        
    // 私雲轉移中
    var timelineDom = $(".gm-content");
    if(QmiGlobal.groups[thisGi].isRefreshing || QmiGlobal.groups[thisGi].isReAuthUILock) {
        // 還是要變換團體名稱 及 currentGi 解除屏蔽時要用
        gi = QmiGlobal.currentGi = thisGi;

        $(".polling-group-name.currentGroup").html(QmiGlobal.groups[thisGi].gn);

        $("#page-group-main .gm-header-right").hide();

        timelineDom.find(".refresh-lock").show().end()
        .find(".gm-content-body").hide();

        if(QmiGlobal.groups[thisGi].isReAuthUILock) timelineDom.find(".refresh-lock > div").hide();
        else timelineDom.find(".refresh-lock > div").show();

        $(".sm-group-area").addClass("enable");

        // 關鈴鐺
        if($(".alert-area-cover").is(":visible") === true) $(".alert-area-cover").trigger("click");
        // 去timeline
        $.mobile.changePage("#page-group-main");

        var companyData = QmiGlobal.companies[(QmiGlobal.companyGiMap[gi] || {}).ci];
        if(companyData)
            QmiGlobal.module.reAuthManually.init({
                companyData: companyData,
                reAuthDef: companyData.reAuthDef
            });

        changeDeferred.resolve();
    } else {
        $("#page-group-main .gm-header-right").show();
        timelineDom
        .find(".refresh-lock").hide().end()
        .find(".gm-header-right").show().end()
        .find(".gm-content-body").show();

        if(Object.keys(QmiGlobal.groups[thisGi].guAll).length == 0)
            getGroupComboInit(thisGi).done( comboDeferred.resolve );
        else
            comboDeferred.resolve();


        comboDeferred.done(function(rspObj){
            if(isUILock()) return;

            //指定gi
            setThisGroup(thisGi);

            //sidemenu name
            setSmUserData(gi,gu,gn);

            //置頂設定
            topEvent().done(function() {
                if (QmiGlobal.groups[thisGi].set && QmiGlobal.groups[thisGi].set.ccc) {
                    onRemoveChatDB(thisGi, QmiGlobal.groups[thisGi].set.ccc);
                }
                //切換團體時, 選目前第一個選項
                var tmp = $(".sm-small-area:visible");
                if( tmp.length>0 ){
                    $(tmp[0]).addClass("active");
                    timelineSwitch( ( $( tmp[0] ).data("sm-act") || "feeds" ),true);
                }else{
                    timelineSwitch("feeds",true);
                }

                changeDeferred.resolve();
            });

            //切換團體時可以寫入新的counts
            pollingCountsWrite();

            function isUILock() {
                if((rspObj || {}).isSuccess === false) return true;
                if(QmiGlobal.groups[thisGi].isRefreshing) return true;
                if(QmiGlobal.groups[thisGi].isReAuthUILock) return true;
                return false;
            }
        })
    }
    return changeDeferred.promise();
}

timelineSwitch = function (act, reset, main, noAppReload){
    // app 重新整理
    if(!noAppReload) QmiGlobal.appReload.do({act: act, reset: reset, main: main});

    var switchDeferred = $.Deferred(),
        page_title = $.i18n.getString("LEFT_FEED"),
        oriAct = $("#page-group-main").data("currentAct");

    $("#page-group-main").data("currentAct",act);
    //reset 
    if(reset) {
        $(".feed-subarea").removeData();
        $("#page-group-main .switch-reset").html("");
    }

    // 關掉筆
    var groupMain = $("#page-group-main");
    var gmHeader = groupMain.find(".gm-header");
    gmHeader.find(".header-icon").hide();
    gmHeader.find(".navi-alert").show();

    // navi的home active
    groupMain.find(".st-filter-area").hide().andSelf()
    .find(".st-filter-list-active").removeClass("st-filter-list-active").end()
    .find("[data-navi=home]").addClass("st-filter-list-active");

    //關閉所有subpage
    groupMain.find(".main-subpage").hide();   

    var gmConHeader = groupMain.find(".gm-content-header");
    gmConHeader.hide();

    switch (act) {
        case "feeds":
            var filterAction = groupMain.find(".st-filter-action");
            filterAction.filter(".st-filter-list-active").removeClass("st-filter-list-active");
            filterAction.filter("[data-navi='announcement']").show();
            filterAction.filter("[data-navi='feedback']").show();
            filterAction.filter("[data-navi='task']").show();
            filterAction.filter("[data-navi='home']").show().addClass("st-filter-list-active");
            filterAction.filter("[data-navi='feed-public']").hide();
            filterAction.filter("[data-navi='feed-post']").hide();
            filterAction.filter("[data-navi='personal-info']").hide();
            filterAction.parent().data("filter", "all");
            $(".subpage-addressBook").hide();

            //顯示新增貼文按鈕
            gmHeader.find(".feed-compose").show();
            groupMain.find(".st-feedbox-area").show();
            groupMain.find(".subpage-timeline").show().scrollTop(0);
            groupMain.find(".st-personal-area").hide();
            
            //polling 數字重寫
            pollingCountsWrite();

            // 使用已隱藏的舊的方式 來做timeline切換
            if( groupMain.find(".st-filter-area").hasClass("st-filter-lock") === false ){
                //將選項存入
                groupMain.data("navi",0);

                timelineListWrite().done(function(result){
                    switchDeferred.resolve({ act: "main"});
                    timelineScrollTop();
                });
            } else switchDeferred.resolve({ act: "main"});
            
          break;
        case "memberslist": 
            switchDeferred.resolve({ act: "memberslist"});
            groupMain.find(".subpage-contact").show();
            
            //藏新增貼文按鈕, 新增聊天室按鈕
            gmHeader.find(".feed-compose").hide();
            gmHeader.find(".chatList-add").hide();
            //如果是管理者的話顯示新增成員鈕
            try{
                var userData = QmiGlobal.groups;
                var groupTmp = userData[gi];
                if( 1==groupTmp.ad ){
                    gmHeader.find(".contact-add").show();
                }
            } catch(e){
                errorReport(e);
            }
            
            page_title = $.i18n.getString("LEFT_MEMBER");

            initContactList();
            break;
        case "addressBook":

            //show page
            groupMain.find(".subpage-addressBook").show();
            //show add btn
            // gmHeader.find(".addressBook-add").show();
            gmHeader.find(".addressBook-refresh").show();
            
            page_title = $.i18n.getString("ADDRESSBOOK_TITLE");

            AddressBook.initAddressBookList();

            switchDeferred.resolve({ act: "addressBook"});
            break;
        case "chat":
            groupMain.find(".subpage-chatList").show();
            
            var chatListDom = $(".subpage-chatList");
            //預設開啟loading, 關閉rows & coachmark
            chatListDom.find(".coachmake").hide();
            chatListDom.find(".rows").html("");
            chatListDom.find(".top-chatList").hide();
            chatListDom.find(".top-chatList .list").html("");

            //offical general 官方帳號非管理員
            if( onClickOfficialGeneralChat(gi) ){
                groupMain.find(".subpage-timeline").show();
                groupMain.data("currentAct",oriAct);
                switch(oriAct){
                    case "feeds":
                    case "feed-post":
                        break;
                    case "feed-public":
                        groupMain.find(".subpage-timeline").show();
                        break;
                    case "memberslist":
                        $(".subpage-contact").show();
                        break;
                    case "album":
                        groupMain.find(".subpage-album").show();
                        break;
                    case "groupSetting":
                        groupMain.find(".subpage-groupSetting").show();
                        break;
                    case "calendar":
                    case "help":
                    case "news":
                    case "user-setting":
                    case "system-setting":
                      break;
                }
            } else {
                page_title = $.i18n.getString("CHAT_TITLE");

                initChatList();

                //顯示新增聊天室按鈕, 藏新增貼文按鈕
                gmHeader.find(".feed-compose").hide();
                gmHeader.find(".chatList-add").show();
                gmHeader.find(".contact-add").hide();

                //$.mobile.changePage("#page-chatroom");
                //groupMain.find("div[data-role=header] h3").html("聊天室");
            }

            switchDeferred.resolve({ act: "chat"});
          break;
        case "calendar":
            switchDeferred.resolve({ act: "calendar"});
          break;
        case "help":
            switchDeferred.resolve({ act: "help"});
          break;
        case "news":
            switchDeferred.resolve({ act: "news"});
          break;
        case "user-setting":
                
            groupMain.find(".subpage-userInformation").show();
            //header
            gmConHeader.show()
            .find("section.system-setting-header").show().end()
            .find("section.ldap-setting-header").hide().end()
            .find(".setting-icon").attr("src","images/avatar.png").end()
            .find(".setting-title").text($.i18n.getString("PERSONAL_INFORMATION"));
            
            userInfoSetting();

            // 個人設定、系統設定都要打開refresh-lock 
            $("#page-group-main .gm-content").find(".refresh-lock").hide().end()
            .find(".gm-header-right").show().end()
            .find(".gm-content-body").show();

            switchDeferred.resolve({ act: "user-setting"});
            break;  
        case "system-setting":
            
            groupMain.find(".subpage-systemSetting").show();
            //header
            gmConHeader.show()
            .find("section.system-setting-header").show().end()
            .find("section.ldap-setting-header").hide().end()
            .find(".setting-icon").attr("src","images/settings.png").end()
            .find(".setting-title").text($.i18n.getString("LEFT_SYSTEM_SETTING"));
            
            // 個人設定、系統設定都要打開refresh-lock 
            $("#page-group-main .gm-content").find(".refresh-lock").hide().end()
            .find(".gm-header-right").show().end()
            .find(".gm-content-body").show();
            
            systemSetting();
            
            switchDeferred.resolve({ act: "system-setting"});
            break;
        case "fileSharing":
            groupMain.find(".subpage-fileSharing").show();
            page_title = $.i18n.getString("GROUPSETTING_TITLE");

            loadScript("js/fileSharing.js").done(function(){

                switchDeferred.resolve({ act: "fileSharing"});


                var fsObj = new window[arguments[0]]();
                
                if(typeof fsObj.ti == "undefined"){
                    alert("這是開發階段 此團體無檔案共享的ti");
                    return false;
                }
                fsObj.getList();
            });
            //initGroupSetting(gi);
            break;  
        case "feed-post":
            var filterAction = groupMain.find(".st-filter-action");
            groupMain.find(".st-navi-area").data("currentHome", "feed-post");
            filterAction.filter(".st-filter-list-active").removeClass("st-filter-list-active");
            filterAction.filter("[data-status='all']").hide();
            filterAction.filter("[data-navi='announcement']").hide();
            filterAction.filter("[data-navi='feedback']").hide();
            filterAction.filter("[data-navi='task']").hide();
            filterAction.filter("[data-navi='feed-public']").hide();
            filterAction.filter("[data-navi='feed-post']").show().addClass("st-filter-list-active");
            
            // $(".st-filter-main span").html( $.i18n.getString("FEED_ALL") );

            //filter all
            var filterArea = groupMain.find(".st-filter-area");
            filterArea.data("filter","all");
            filterArea.children(".st-filter-hide").hide();
            filterArea.scrollLeft(0);

            //點選 全部 的用意是 既可寫入timeline 也可以讓navi回到 "全部" 的樣式
            groupMain.find(".st-navi-subarea[data-st-navi=feed-post]").trigger("click");

            groupMain.find(".st-feedbox-area").show();
            groupMain.find(".subpage-timeline").show();
            groupMain.find(".st-personal-area").hide();

            gmHeader.find(".page-title").html(page_title);

            //顯示新增貼文按鈕, 藏新增聊天室按鈕
            gmHeader.find(".feed-compose").show();

            //polling 數字重寫
            if($.lStorage("_pollingData")) pollingCountsWrite();

            updatePollingCnts( groupMain.find(".sm-small-area[data-sm-act=feeds]").find(".sm-count"), "A1" );
            updatePollingCnts( filterAction.filter("[data-status=all]").find(".sm-count"), "B1" );

            switchDeferred.resolve({ act: "feed-post"});
          break;
        case "feed-public":

            groupMain.find(".st-navi-area").data("currentHome", "feed-public").end()
            .find(".st-filter-action.st-filter-list-active").removeClass("st-filter-list-active").end()
            .find(".st-filter-action[data-status='all']").hide().end()
            .find(".st-filter-action[data-navi='personal-info']").hide().end()
            .find(".st-filter-action[data-navi='announcement']").show().end()
            .find(".st-filter-action[data-navi='feedback']").show().end()
            .find(".st-filter-action[data-navi='task']").show().end()
            .find(".st-filter-action[data-navi='feed-post']").hide().end()
            .find(".st-filter-action[data-navi='feed-public']").show().addClass("st-filter-list-active");

            //filter all
            var filterArea = groupMain.find(".st-filter-area");
            filterArea.data("filter","all");
            filterArea.children(".st-filter-hide.right").show();
            filterArea.children(".st-filter-hide.left").hide();
            filterArea.scrollLeft(0);

            //點選 全部 的用意是 既可寫入timeline 也可以讓navi回到 "全部" 的樣式
            groupMain.find(".st-navi-subarea[data-st-navi=feed-public]").trigger("click");

            groupMain.find(".st-feedbox-area").show();
            groupMain.find(".subpage-timeline").show();
            groupMain.find(".st-personal-area").hide();

            gmHeader.find(".page-title").html(page_title);
            gmHeader.find(".feed-compose").show(); //顯示新增貼文按鈕, 藏新增聊天室按鈕
            
            //polling 數字重寫
            if($.lStorage("_pollingData")) pollingCountsWrite();

            updatePollingCnts( groupMain.find(".sm-small-area[data-sm-act=feeds]").find(".sm-count"), "A1" );
            updatePollingCnts( groupMain.find(".st-filter-action[data-status=all]").find(".sm-count"), "B1" );

            switchDeferred.resolve({ act: "feed-public"});
          break;
        case "album":
            //-- switch sub pages --
            groupMain.find(".subpage-album").show();

            page_title = $.i18n.getString("COMMON_ALBUM");

            initGallery();

            //顯示新增聊天室按鈕, 藏新增貼文按鈕
            gmHeader.find(".feed-compose").hide();
            gmHeader.find(".chatList-add").hide();
            gmHeader.find(".contact-add").hide();

            //$.mobile.changePage("#page-chatroom");
            //groupMain.find("div[data-role=header] h3").html("聊天室");

            switchDeferred.resolve({ act: "album"});
          break;
        case "groupSetting":
            
            groupMain.find(".subpage-groupSetting").show();
            
            //藏新增貼文按鈕, 新增聊天室按鈕
            gmHeader.find(".feed-compose").hide();
            gmHeader.find(".chatList-add").hide();
            
            page_title = $.i18n.getString("GROUPSETTING_TITLE");

            //initGroupSetting(gi);
            switchDeferred.resolve({ act: "groupSetting"});
            break;

        case "system-ldapSetting":
            groupMain.find(".subpage-ldapSetting").show();

            var titleStr = QmiGlobal.auth.isSso ? "ACCOUNT_BINDING_BIND_QMI_ACCOUNT" : "ACCOUNT_BINDING_BINDING_LDAP_ACCOUNT";
            gmConHeader.show()
            .find("section.system-setting-header").hide().end()
            .find("section.ldap-setting-header").html($.i18n.getString(titleStr)).show();


            QmiGlobal.module.ldapSetting.init();


            switchDeferred.resolve({ act: "system-ldapSetting"});
            
            break;
        case "person":
            groupMain.find(".st-filter-area").show();
            groupMain.find(".st-filter-action")
                     .filter(".st-filter-list-active").removeClass("st-filter-list-active").end()
                     .filter("[data-navi='announcement']").show().end()
                     .filter("[data-navi='feedback']").hide().end()
                     .filter("[data-navi='task']").show().end()
                     .filter("[data-navi='home']").show().end()
                     .filter("[data-navi='feed-public']").hide().end()
                     .filter("[data-navi='feed-post']").hide();
                     
            //顯示新增貼文按鈕
            gmHeader.find(".feed-compose").show();

            groupMain.find(".subpage-timeline").show().end()
                     // .find(".st-filter-area").data("filter","all")
                     .children(".st-filter-hide.right").show().end()
                     .children(".st-filter-hide.left").hide().end()
                     .scrollLeft(0);
            break;
    }

    switchDeferred.done(function(result){

        timelineScrollTop();
        groupSwitchEnable();

        //關閉筆功能
        if(groupMain.find(".feed-compose-area").is(":visible")){
            groupMain.find(".feed-compose").trigger("click");
        }

        setOfficialGroup(gi);
    })
        
}

setSmUserData = function (gi,gu,gn){
    // $(".sm-user-area-r div:eq(0)").html(gn);
    $(".sm-user-area-r div").html("");  
    $(".sm-user-area.namecard").data("gu",gu);
    $(".sm-user-area .update-avatar-all").data("update-id",gu);
    //檢查團體是否存在gu all 
    getUserAvatarName(gi,gu,$(".sm-user-area-r div"),$(".sm-user-pic img"));
}


topEventChk = function(){
    topEventApi().complete(function(data){
        if(data.status != 200) return false;

        var top_events_arr = $.parseJSON(data.responseText).el;
        
        $.each(top_events_arr,function(i,val){
            var data_ei = val.ei;
            var chk = false;
            $(".st-top-event").each(function(i,val){
                if($(this).data("data-obj").ei == data_ei) {
                    chk = true;
                    return;
                }
            });

            //new top event
            if(!chk){
                cns.debug("[!!]topEventChk[!!]");
                topEvent();
                return false;
            }
        });
    });
}

topEventApi = function(){
    var api_name = "groups/" + gi + "/timelines/" + ti_feed + "/top_events";
    var headers = {
             "ui":ui,
             "at":at, 
             "li":lang,
                 };

    var method = "get";
    return ajaxDo(api_name,headers,method,false);
}

topEvent = function () {
    var deferred = $.Deferred();
    var top_area = $(
        '<div class="st-top-area">'+
            '<div class="st-top-event-block">'+
                '<div class="st-top-left-arrow st-top-arrow" style="max-width:100px"><div><img src="images/arrow2.png"></div></div>'+
                '<div class="st-top-right-arrow st-top-arrow" style="max-width:100px"><div><img src="images/arrow2.png"></div></div>'+
                '<div class="st-top-event-area">'+
                    '<div class="st-top-event-default">'+
                        '<div>'+$.i18n.getString("FEED_UNTOP_AVAILABLE")+'</div>'+
                    '</div>'+
                    '<div class="st-top-event-set"></div>'+
                    '<div class="st-top-bar-area">'+
                    '<div class="st-top-bar-selector" style="display:"></div>'+
                    '<div class="st-top-bar-case">'+
                    '</div>'+
                    '<div class="st-top-bar-case-click">'+
                    '</div>'+
                '</div>'+
                '</div>'+
            '</div>'+
        '</div>'
    );

    $(".st-top-area-load").html(top_area);

    //取得user name list
    topEventApi().complete(function(data){
        if(data.status == 200){
            var top_events_arr = $.parseJSON(data.responseText).el;
            var top_msg_num = top_events_arr.length;
            if(top_msg_num == 0){
                deferred.resolve();
                return false;
            }
            //default 關閉
            $(".st-top-event-default").hide();

            $.each(top_events_arr,function(i,val) {
                // val.c = val.c.qmiTag(eventObj);
                top_area.find(".st-top-event-set").append($('<div class="st-top-event">').load('layout/layout.html .st-top-event-load',function(){
                    var this_top_event = $(this);
                    var tagRegex = /\/{3};(\w+);\/{3}/g;

                    this_top_event.find(".st-top-event-load")._i18n();
                    this_top_event.data("data-obj",val);
                    this_top_event.data("pos",i);

                    this_top_event.find(".st-top-event-r-ttl span").html(getEventTypeText(val.meta.tp));
                    this_top_event.find(".st-top-event-r-ttl").append(val.meta.tt);
                    
                    if (val.ml.length > 0 && val.ml[0].hasOwnProperty("c")) {
                        var matchTagList = val.ml[0].c.match(tagRegex);

                        // 抓漏網之魚 防止bug
                        (matchTagList || []).forEach(function(tagText) {
                            var tagId = tagText.replace(tagRegex, "$1");
                            if (QmiGlobal.groups[gi].guAll[tagId] === undefined) return;

                            val.ml[0].c = val.ml[0].c.qmiTag({
                                u: tagId,
                                n: QmiGlobal.groups[gi].guAll[tagId].nk
                            });
                        });

                        this_top_event.find(".st-top-event-r-content").html(val.ml[0].c);
                    }

                    //用戶名稱 時間
                    setTopEventUserName(this_top_event,val.meta.gu);

                    var time = new Date(val.meta.ct);
                    var time_format = time.customFormat( "#M#/#D# #CD# #hhh#:#mm#" );
                    this_top_event.find(".st-top-event-r-footer span:eq(1)").html(time_format);

                    //最後一筆 只有一筆就不用做
                    if(i == (top_msg_num-1) && i != 0){
                        setTimeout(function(){
                            topBarMake(top_area,top_msg_num);
                        },500);
                    }

                    //event 
                    this_top_event.click(function(){
                        $.mobile.changePage("#page-timeline-detail", {transition: "slide"});
                        eventDetailShow($(this).data("data-obj").ei);   
                    });
                }));
            });
        }else{
            //發生錯誤 開啓更換團體
            groupSwitchEnable();
        }

        deferred.resolve();
    });

    return deferred.promise();
}

//為了避免gu all還沒取得
setTopEventUserName = function(this_top_event,this_gu){
    var gu_all = QmiGlobal.groups[gi].guAll;
    if(!gu_all[this_gu]) {
        cns.debug("[!]top event gi gu mismatched[!]");
        return false;
    }

    this_top_event.find(".st-top-event-l img").attr("src",gu_all[this_gu].aut).data("update-id",this_gu).parent().stop().animate({
        opacity:1
    },1000);
    this_top_event.find(".st-top-event-r-footer span:eq(0)").html(gu_all[this_gu].nk);
}

topBarMake = function (top_area,top_msg_num,resize) {
    
    //游標 預設位置0
    top_area.find(".st-top-bar-selector").data("pos",0);

    //第一個
    var start_span = $('<span class="blue"></span>');
    top_area.find(".st-top-bar-case").html(start_span);
    start_span.data("pos",0);

    //點擊區放大
    var start_span_click = $('<span></span>');
    top_area.find(".st-top-bar-case-click").html(start_span_click);
    start_span_click.data("pos",0);

    //第一個已經有了 所以-1
    for(i=0;i<top_msg_num-1;i++){
        var this_span = $('<span></span>');
        top_area.find(".st-top-bar-case").append(this_span);
        this_span.data("pos",i+1);

        //點擊區放大
        var this_span_click = $('<span></span>');
        top_area.find(".st-top-bar-case-click").append(this_span_click);
        this_span_click.data("pos",i+1);
    }

    //起始位置
    var selector_pos = (10-top_msg_num)/2*10;
    var first_span = top_area.find(".st-top-bar-case span:eq(0)");

    var start_left = first_span.offset().left;
    var start_top = first_span.offset().top;
    var movement = first_span.width();

    //流程控制 不能連按
    var mfinish = false;

    //點擊區 先解綁定
    top_area.find(".st-top-bar-case-click span").unbind();
    top_area.find(".st-top-bar-case-click span").mouseup(function(){
        var target_pos = $(this).data("pos");
        var target_group = top_area.find(".st-top-bar-case span");
        target_group.removeClass("blue");

        target_group.each(function() {
            if($(this).data('pos') === target_pos ){
                $(this).addClass("blue");
            }
        });

        top_area.find(".st-top-event").animate({'right':target_pos*100 + '%'},500);
    });

    //resize 只重做位置有關的事件就好
    if(resize) return false;

    //左右換頁 
    top_area.find(".st-top-left-arrow, .st-top-right-arrow").show();
    //預設方向
    top_area.find(".st-top-left-arrow").data("direction",false);
    top_area.find(".st-top-right-arrow").data("direction",true);

    //先解綁
    top_area.find(".st-top-left-arrow, .st-top-right-arrow, .st-top-arrow, st-top-event").unbind();
    top_area.find(".st-top-event-block").hover(
        function(){
            top_area.find(".st-top-arrow div img").stop().fadeIn("fast");
        },
        function(){
            top_area.find(".st-top-arrow div img").stop().fadeOut("fast");
        }
    );

    //置頂公告 左右換頁
    top_area.find(".st-top-left-arrow, .st-top-right-arrow").hover(
        function(){
            $(this).stop().animate({
                opacity:1
            },200);
        },
        function(){
            //已經顯示 而且 動畫結束 才能繼續
            $(this).stop().animate({
                opacity:0.3
            },200)
        }
    );

    top_area.find(".st-top-left-arrow, .st-top-right-arrow").mouseup(function(){
        
        var direction = $(this).data("direction");
        var here_pos = top_area.find(".st-top-bar-selector").data("pos");

        var here_pos = top_area.find(".st-top-bar-case span").filter(function() {
            return $(this).hasClass("blue");
        }).data('pos');

        if(direction){
            var target_pos = here_pos+1;
            if(target_pos > top_msg_num-1) target_pos = 0;
        }else{
            var target_pos = here_pos-1;
        }
        
        top_area.find(".st-top-bar-case-click span:eq(" + target_pos + ")").trigger("mouseup");
    });


    //輪播
    var top_timer;

    clearInterval(top_timer);

    top_timer = setInterval(function(){
        top_area.find(".st-top-right-arrow").trigger("mouseup");
    },top_timer_ms);

    //重設輪播
    top_area.find(".st-top-bar-case-click span, .st-top-left-arrow, .st-top-right-arrow").click(function(){
        clearInterval(top_timer);
        top_timer = setInterval(function(){
            top_area.find(".st-top-right-arrow").trigger("mouseup");
            console.log("[!timer!] top_timer2");
        },top_timer_ms);
    });
}


chkEventStatus = function (this_event,etp){
    var this_ei = this_event.data("event-id");
    var event_status = this_event.data("event-status");

    //兩種狀況下 要登記已記錄: event_status不存在 或 event_status存在但 此ei 的 ir、il、ip是false
    if( !event_status || (event_status[this_ei] && !event_status[this_ei][etp])){
        return true;
    }else{
        return false;
    }
}

//取得單一timeline 回覆讚好等狀態
getThisTimelinePart = function (this_event,tp,callback){
    if( this_event.length==0 ){
        cns.debug("no event");
        return;
    }
    var this_ei = this_event.data("event-id");
    var this_gi = this_ei.split("_")[0];
    var this_ti = this_ei.split("_")[1];

    var api_name = "groups/" + this_gi + "/timelines/" + this_ti + "/events/" + this_ei + "/participants2?tp=" + tp;
    var headers = {
        "ui":ui,
        "at":at, 
        "li":lang
    };
    var method = "get";
    var result = ajaxDo(api_name,headers,method,false);
    result.complete(function(data){
        if(data.status == 200 && callback) callback(data);
    });
}

//取得單一timeline 回覆讚好等狀態
getThisTimelineResponsePart = function (this_event,tp,callback){
    if( this_event.length==0 ){
        cns.debug("no event");
        return;
    }
    var this_ei = this_event.data("event-id");
    var this_ep = this_event.data("event-path");
    var this_gi = this_ei.split("_")[0];
    var this_ti = this_ei.split("_")[1];

    var api_name = "groups/" + this_gi + "/timelines/" + this_ti + "/events/" + this_ep + "/participants2?tp=" + tp;
    var headers = {
        "ui":ui,
        "at":at, 
        "li":lang
    };
    var method = "get";
    var result = ajaxDo(api_name,headers,method,false);
    result.complete(function(data){
        if(data.status == 200 && callback) callback(data);
    });
}

detailLikeStringMake = function (this_event){
    var this_gi = this_event.data("event-id").split("_")[0];
    var epl = this_event.data("parti-list");

    //gu gi 是全域
    var group = QmiGlobal.groups[this_gi];
    var me_pos = $.inArray(group.gu,epl);
    var guAll = group.guAll;
    
    var isMe = me_pos < 0 ? false : true;
    
    var like_str = "";

    this_event.find(".st-reply-like-area").show();

    try{
        switch(true){
            //陣列空的 隱藏 區域
            case (epl.length == 0) :
                like_str = $.i18n.getString("FEED_BE_FIRST_LIKE");
                break;
            //你 按讚
            case ( isMe === true && epl.length == 1) :
                like_str = $.i18n.getString("FEED_CLICK_LIKE_SELF", $.i18n.getString("COMMON_YOU") );
                break;
            //林小花 按讚
            case ( epl.length == 1 ):
                var epl0 = ( guAll.hasOwnProperty(epl[0]) && guAll[epl[0]] && guAll[epl[0]].nk ) ? guAll[epl[0]].nk.replaceOriEmojiCode() : "";
                like_str = $.i18n.getString("FEED_CLICK_LIKE", epl0 );
                break;

            //你、林小花 按讚
            case ( epl.length == 2 ):
                var epl0 = ( guAll.hasOwnProperty(epl[0]) && guAll[epl[0]] && guAll[epl[0]].nk ) ? guAll[epl[0]].nk.replaceOriEmojiCode() : "";
                var epl1 = ( guAll.hasOwnProperty(epl[1]) && guAll[epl[1]] && guAll[epl[1]].nk ) ? guAll[epl[1]].nk.replaceOriEmojiCode() : "";
                if( isMe === true ){
                    like_str = $.i18n.getString("FEED_CLICK_LIKE_2PEOPLE", 
                        $.i18n.getString("COMMON_YOU"), 
                        (me_pos ? epl0 : epl1) 
                    );
                } else {
                    like_str = $.i18n.getString("FEED_CLICK_LIKE_2PEOPLE", 
                        epl0, epl1 );
                }
                break;

            //林小花 及其他？個人按讚
            case ( epl.length > 2 ) :
                if( isMe === true ){
                    if( 0==me_pos ){
                        var epl1 = ( guAll.hasOwnProperty(epl[1]) && guAll[epl[1]] && guAll[epl[1]].nk ) ? guAll[epl[1]].nk.replaceOriEmojiCode() : "";
                        like_str = $.i18n.getString("FEED_YOU_AND_3PEOPLE_LIKE", $.i18n.getString("COMMON_YOU"), epl1, (epl.length-2) );
                    } else {
                        var epl0 = ( guAll.hasOwnProperty(epl[0]) && guAll[epl[0]] && guAll[epl[0]].nk ) ? guAll[epl[0]].nk.replaceOriEmojiCode() : "";
                        like_str = $.i18n.getString("FEED_YOU_AND_3PEOPLE_LIKE", $.i18n.getString("COMMON_YOU"), epl0, (epl.length-2) );
                    }
                } else {
                    var epl0 = ( guAll.hasOwnProperty(epl[0]) && guAll[epl[0]] && guAll[epl[0]].nk ) ? guAll[epl[0]].nk.replaceOriEmojiCode() : "";
                    like_str = $.i18n.getString("FEED_3PEOPLE_LIKE", epl0, (epl.length-1) );
                }
                break;
        }
    } catch(e){
        errorReport(e);
    }
    
    this_event.find(".st-reply-like-area span:eq(0)").html( like_str );
    this_event.find(".st-reply-like-area span:eq(1)").html( "" ).hide();
}


getEventDetail = function(this_ei){
    var this_gi = this_ei.split("_")[0];
    var this_ti = this_ei.split("_")[1];

    //單一動態詳細內容
    var api_name = "groups/" + this_gi + "/timelines/" + this_ti + "/events/" + this_ei;
    var headers = {
            "ui":ui,
            "at":at, 
            "li":lang
                };
    var method = "get";
    return ajaxDo(api_name,headers,method,false);

}



setOfficialGroup = function( this_gi ){
    var groupData;
    try{
        groupData = QmiGlobal.groups[this_gi];
    } catch(e){
        // cns.debug("[!] updateTab:" + e.message );
        errorReport(e);
        return;
    }

    try{
        //set tab
        $(".header-menu").parent().show();

        if( groupData.ntp !== 2 ){

            //temp
            $(document).data("official",false);
            
            //set filters
            $(".st-filter-area").show();

            $(".official").hide();

            $(".st-feedbox-area").removeClass("official-admin-adjust");
            $(".sm-small-area[data-sm-act=chat]").removeClass("official-general");
            return;
        }

        //set filters
        $(".st-filter-area").hide();

        //temp
        $(document).data("official",true);
        $("#page-group-main .header-menu [data-sm-act]:not([data-sm-act=feeds])").hide();
        //$(".feed-compose.header-icon._2").hide();

        //admin
        if( groupData.ad==1 ){
            $(".official.admin").show();
            $(".official.general").hide();
            $(".st-feedbox-area").addClass("official-admin-adjust");
            $(".sm-small-area[data-sm-act=chat]").removeClass("official-general");
        } else{

            $(".feed-compose").hide();
            $(".official.admin").hide();
            $(".official.general").show();
            $(".st-feedbox-area").removeClass("official-admin-adjust");
            $(".sm-small-area[data-sm-act=chat]").addClass("official-general");
        }
        $(".st-official-tab[data-type=cnt] .text").html( $.i18n.getString("OFFICIAL_N_FOLLOWER","<span class='cnt'>"+groupData.cnt+"</span>") );
    } catch(e){
        errorReport(e);
    }
}

onClickOfficialGeneralChat = function( this_gi ){
    try{
        var groupData = QmiGlobal.groups[this_gi] || {};
        if( groupData.ntp === 2 && groupData.ad!=1 ){
            if( null!=groupData.chatAll ){
                for( var ci in groupData.chatAll ){
                    var room = groupData.chatAll[ci];
                    if( room.tp==2 ){
                        openChatWindow ( this_gi, ci );
                        return true;
                    }
                }
            }
        }
        return false;
    } catch(e){
        errorReport(e);
    }
    return false;
}

/*

########  ######## ########  ##       ##    ##    ########  ######## ########    ###    #### ##       
##     ## ##       ##     ## ##        ##  ##     ##     ## ##          ##      ## ##    ##  ##       
##     ## ##       ##     ## ##         ####      ##     ## ##          ##     ##   ##   ##  ##       
########  ######   ########  ##          ##       ##     ## ######      ##    ##     ##  ##  ##       
##   ##   ##       ##        ##          ##       ##     ## ##          ##    #########  ##  ##       
##    ##  ##       ##        ##          ##       ##     ## ##          ##    ##     ##  ##  ##       
##     ## ######## ##        ########    ##       ########  ########    ##    ##     ## #### ######## 

*/


eventContentDetail = function(this_event,e_data){
    //此則timeline種類
    var tp = this_event.data("timeline-tp");

    //計算投票的回文人次
    var count = 0;

    cns.debug("==================== 詳細內容 ================================");
    cns.debug(JSON.stringify(e_data,null,2));
    
    //單一動態詳細內容 根據此則timeline類型 設定並開關區域
    //event種類 不同 讀取不同layout
    switch(tp){
     case 0:
         break;
     case 1:
         break;
     case 2:
         break;
     case 3:
         //工作
         this_event.find(".st-box2-more-task-area").hide();
         this_event.find(".st-box2-more-task-area-detail").show();
         //開啟工作細節
         this_event.find(".st-task-work-detail").show();

         if(this_event.data("task-over")) break;
         break;
     case 4:
         this_event.find(".st-box2-more-task-area").hide();
         this_event.find(".st-box2-more-task-area-detail").show();
         //開啟投票細節
         this_event.find(".st-task-vote-detail").show();
            
         if(this_event.data("task-over")) break;
         //判斷有無投票過 顯示送出 已送出 已結束等等
         var event_status = this_event.data("event-status");
         if(event_status && event_status.ik){
             this_event.find(".st-vote-send").html( $.i18n.getString("FEED_ALREADY_VOTED") );
             this_event.find(".st-vote-send").removeClass(".st-vote-send-blue");
         }
         break;
     case 5:
            this_event.find(".st-task-locate-detail").show();
            this_event.find(".st-locate-status").off("click").on("click", function (e) {
                new QmiGlobal.MemberLocateModal(e_data, this_event);
            });
         break;
     case 6:
         break;
    };

    //讚留言閱讀 任務會影響回文數 
    this_event.find(".st-sub-box-3 div:eq(0)").html(e_data[0].meta.lct);
    // this_event.find(".st-sub-box-3 div:eq(1)").html(e_data[0].meta.pct);
    this_event.find(".st-sub-box-3 div:eq(2)").html(e_data[0].meta.rct);
}

     


//回覆 detail timeline message內容
detailTimelineContentMake = function (this_event, e_data, reply_chk, triggerDetailBox){

    var this_gi = this_event.data("event-id").split("_")[0];
    var this_ei = this_event.data("event-id");
    

    //event 自己的閱讀回覆讚好狀態
    var event_status = this_event.data("event-status");

    var deferTasks = [];

    // 存完成定位的成員
    var taskFinisherData = [];


    //event path
    this_event.data("event-path",this_ei);

    //已讀亮燈
    this_event.find(".st-sub-box-3 img:eq(2)").attr("src","images/icon/icon_view_activity.png")
    
    //製作每個回覆
    var okCnt = 0;

    $.each(e_data,function(el_i,el){
        //0是發文 不重複製作
        // if(el_i == 0) return ;

        var deferred = $.Deferred();
        var without_message = false;
        var reply_content;
        var ml_arr = [];
        var mainReplyText;

        deferTasks.push(deferred);
        this_event.find(".st-reply-all-content-area").append($('<div>').load('layout/timeline_event.html?v2.0.0.4 .st-reply-content-area', function(){
            var this_load = $(this).find(".st-reply-content-area");
            var this_content = this_load.find(".st-reply-content");
            var fileArea = this_load.find(".file");

            var targetTu = null;
            if(el.meta){
                targetTu = {
                    tu: el.meta.tu,
                    pu: el.meta.gu
                };
            }
            $.each(el.ml,function(i,val){
                //event種類 不同 讀取不同layout
                switch(val.tp){
                    case 0:
                        this_content.find(".replyMsg").html(htmlFormat(val.c));
                        mainReplyText = this_content.find(".replyMsg").html();
                        break;
                    case 1:
                        break;
                    case 5:
                        var stickerDom = this_content.find(".sticker");
                        stickerDom.show();
                        setStickerUrl(stickerDom, val.c);
                        break;
                    case 6:
                        this_content.find(".au-area").show();
                        getS3file(val,this_content,val.tp,280,targetTu);
                        break;
                    case 7://影片
                        this_content.find(".video-area").addClass("play");
                        getS3file(val,this_content.find("video"),val.tp,280,targetTu);
                        break;
                    case 8://聲音
                        getS3file(val,this_content.find("audio"),val.tp,280,targetTu);
                        break;
                    case 9:
                        //without_message = true;
                        break;
                    case 12:
                        if(reply_chk) break;

                        //製作工作內容
                        workContentMake(this_event,val.li);
                        break;
                    case 13:

                        without_message = true;

                        if(reply_chk) break;

                        //工作回覆
                        this_event.find(".st-work-option").each(function(ml_i,ml_val){
                            var this_work = $(this);
                            if(this_work.data("item-index") == val.k ){
                                if(val.a){
                                    if(this_work.data("mine")) this_work.addClass("work-mine-finished");
                                    this_work.data("work-status",true);
                                    this_work.addClass("st-work-option-gray");
                                    this_work.find(".st-work-option-tu img").attr("src","images/common/icon/icon_work_member_lightgray.png");
                                    this_work.find("img:eq(0)").attr("src","images/common/icon/icon_check_red_l.png");
                                }else{
                                    if(this_work.data("mine")) this_work.removeClass("work-mine-finished");
                                    this_work.data("work-status",false);
                                    this_work.removeClass("st-work-option-gray");
                                    this_work.find(".st-work-option-tu img").attr("src","images/common/icon/icon_work_member_gray.png");
                                    this_work.find("img:eq(0)").attr("src","images/common/icon/icon_check_round_white.png");
                                }
                            }
                        });
                        break;
                    case 14:
                        if(reply_chk) break;

                        //投票內容 照理說要做投票表格 但因為是非同步 因此先做的話 會無法更改資料
                        voteContentMake(this_event,val);
                        //without_message = true;
                        break;
                    case 15:

                        //投票回覆 不用製作留言
                        without_message = true;
                        //計算投票次數
                        //st-vote-ques-area

                        var vr_obj = this_event.data("vote-result");
                        // 寫入 => gu不存在 或 時間 大於 記錄過的時間)
                        if(!(vr_obj[el.meta.gu] && el.meta.ct < vr_obj[el.meta.gu].time )){
                            
                            vr_obj[el.meta.gu] = {};
                            vr_obj[el.meta.gu].time = el.meta.ct;
                            vr_obj[el.meta.gu].li = val.li;
                        }

                        //存回
                        this_event.data("vote-result",vr_obj);

                        return false;
                        break;
                    case 17:
                        var reportedNumber = el.meta.tct;
                        this_event.find(".st-locate-status").show();
                        this_event.find(".location-reported-number").html(reportedNumber);
                        if (targetTu.tu) {
                            this_event.find(".all-number").html(targetTu.tu.gul.length);
                        } else {
                            this_event.find(".all-number").html(QmiGlobal.groups[this_gi].cnt);
                        }
                        break;
                    case 18:
                        without_message = true;
                        this_event.find(".my-report-address").html(val.a);
                        try {
                            this_event.find(".st-google-map").show();
                            this_event.find(".st-google-map").tinyMap({
                                 center: {x: val.lat, y: val.lng},
                                 zoomControl: 0,
                                 mapTypeControl: 0,
                                 scaleControl: 0,
                                 scrollwheel: 0,
                                 zoom: 16,
                                 marker: [
                                     {addr: [val.lat, val.lng], text: val.a}
                                 ]
                            });
                            
                        } catch(e) {
                            var amapNumber = "amap-" + new Date().getRandomString();
                            this_event.find(".st-google-map").hide();
                            this_event.find(".st-gausai-map").show().attr("id",amapNumber);
                            var mapObj = new AMap.Map(amapNumber,{
                                rotateEnable:false,
                                dragEnable:true,
                                zoomEnable:false,
                                //二维地图显示视口
                                view: new AMap.View2D({
                                    center:new AMap.LngLat(val.lng,val.lat),//地图中心点
                                    zoom:15 //地图显示的缩放级别
                                })
                            });

                            var marker=new AMap.Marker({                    
                                position:new AMap.LngLat(val.lng,val.lat)  
                            });  
                            marker.setMap(mapObj);
                        }
                        
                        taskFinisherData.push(el);

                        break;
                    case 21:
                        if (typeof(mainReplyText) == 'string' && mainReplyText) {
                            mainReplyText = mainReplyText.qmiTag(val);
                        }
                        break;
                    case 26:
                        getS3fileBackground(val, fileArea, 26, null , function(data){
                            var fileName = val.fn.split(".")[0];
                            var format = val.fn.split(".").pop();
                            if (fileName.length > 15) {
                                fileName = fileName.substring(0, 15) + "....";
                            }
                            var linkElement = document.createElement("a");
                            var fileIcon = document.createElement("img");
                            var fileNameNode = document.createTextNode(fileName + " - " + format);
                            var fileSizeSpan = document.createElement("span");
                            var downloadIcon = document.createElement("div")   
                            fileIcon.src = 'images/fileSharing/' + getMatchIcon(val.fn);
                            fileSizeSpan.textContent = val.si ? val.si.toFileSize() : "0 bytes";
                            linkElement.className = 'attach-file';
                            downloadIcon.className = 'download-icon'
                            linkElement.download = val.fn;
                            linkElement.href = data.s3;
                            linkElement.appendChild(fileIcon);
                            linkElement.appendChild(fileNameNode);
                            linkElement.appendChild(fileSizeSpan);
                            linkElement.appendChild(downloadIcon);
                            fileArea.append(linkElement);
                        });
                        break;
                }
            });

            var tagRegex = /\/{3};(\w+);\/{3}/g;

            if (mainReplyText) {
                var matchTagList = mainReplyText.match(tagRegex);

                if (matchTagList != null) {
                    $.each(matchTagList, function(index, tagText){
                        var tagMemberID = tagText.replace(tagRegex, "$1");
                        var memberList = QmiGlobal.groups[gi].guAll;
                        if (memberList[tagMemberID]) {
                            var tagObj = {
                                u: tagMemberID,
                                n: memberList[tagMemberID].nk
                            }
                            mainReplyText = mainReplyText.qmiTag(tagObj);
                        }
                    });
                }
                this_content.find(".replyMsg").html(mainReplyText);
            }
            
            this_content.find("b").bind("click", function(e) {
                userInfoShow(this_gi, $(e.target).attr("name"));
            });

            //已有的留言就不製作
            var reply_duplicate = false;
            if(reply_chk){
                var tests = this_event.find(".st-reply-content-area").filter(function() {
                    return $(this).data('event-id') === el.ei;
                });
                if(tests.length > 0)
                    reply_duplicate = true;
            }

            
            //部分tp狀態為樓主的話 或狀態為不需製作留言 就離開
            if(without_message || el.meta.del || (el.meta.tp.substring(0,1)*1 == 0) || reply_duplicate){
                this_load.parent().remove();
            }else{

                //製作留言
                var isError = false;
                var _groupList = QmiGlobal.groups;
                try{
                    var user_name = _groupList[this_gi].guAll[el.meta.gu].nk.replaceOriEmojiCode();
                    
                    //大頭照
                    if(_groupList[this_gi].guAll[el.meta.gu].aut){
                        this_load.find(".st-user-pic img").attr("src",_groupList[this_gi].guAll[el.meta.gu].aut);
                        // this_load.find(".st-user-pic img:eq(1)").attr("src",_groupList[this_gi].guAll[el.meta.gu].auo);
                        this_load.find(".st-user-pic.namecard").data("auo",_groupList[this_gi].guAll[el.meta.gu].auo);

                        //update all
                        this_load.find(".update-avatar-all").data("update-id",el.meta.gu);
                        avatarPos(this_load.find(".st-user-pic img"));
                    }
                } catch(e) {
                    errorReport(e);
                    this_load.parent().remove();
                    isError = true;
                    cns.debug("get unknown reply user", this_gi, el.meta.gu);
                }
                

                if( !isError ){
                    // namecard
                    this_load.find(".st-user-pic.namecard").data("gi",this_gi);
                    this_load.find(".st-user-pic.namecard").data("gu",el.meta.gu)

                    

                    this_load.find(".st-reply-username").html(user_name.replaceOriEmojiCode());
                    
                    //時間
                    this_load.find(".st-reply-footer-time").html(new Date(el.meta.ct).toFormatString()).data("ct",el.meta.ct);

                    this_load.data("event-val",el);

                    var ei = el.ei;
                    this_load.data("event-id",ei);

                    //存入event path 之後才可以按讚
                    this_load.data("event-path",this_event.data("event-id") + "." + this_load.data("event-id"));
                    if(el.meta.lct){
                        this_load.find(".st-reply-footer img").show();
                        this_load.find(".st-reply-footer img").attr("src","images/timeline/timeline_feedbox_icon_like.png");
                        this_load.find(".st-reply-footer span:eq(2)").html(el.meta.lct);

                        //此則動態 自己的按贊狀況
                        if(el.meta.il){
                            this_load.find(".st-reply-footer img").attr("src","images/icon/icon_like1_activity.png");
                            var likeDom = this_load.find(".st-reply-footer span:eq(1)");
                            likeDom.html( $.i18n.getString("FEED_UNLIKE") );
                            likeDom.removeAttr("data-textid");
                            likeDom.data("like", true);
                        }
                    }
                }
            }
            okCnt++;
            if( okCnt==e_data.length-1 ){
                this_event.find(".st-reply-all-content-area").slideDown().data("show",true);
            }

            this_event._i18n();

            var tmpData = getGroupCompetence(this_gi);
            if( false==tmpData.isAdmin && true==tmpData.isOfficial ){
                // this_event.find(".st-read").hide();
                this_event.find(".namecard").removeClass("namecard");
            }

            deferred.resolve();
        }));
        
    });

    this_event.data("taskFinisherData", taskFinisherData);
    $.when.apply($, deferTasks).then(function () {
        if(triggerDetailBox !== undefined) triggerDetailBox.data("trigger", true);
    });
}


//動態消息 判斷關閉區域
timelineDetailClose = function (this_event,tp, triggerDetailBox){

    var detail_data;
    //公告通報任務的detail 線要隱藏 
    var bottom_block = false;
    
    switch(tp){
        case 0:
            
            break;
        case 1:
            break;
        case 2:
            break;
        case 3:
            //bottom_block = true;
            detail_data = ".st-box2-more-task-area";
            break;
        case 4:
            //bottom_block = true;
            detail_data = ".st-box2-more-task-area";
            
            break;
        case 5:
            //bottom_block = true;
            detail_data = ".st-box2-more-task-area";
            // this_event.find(detail_data).toggle();
            // this_event.find(detail_data + "-detail").toggle();
            break;
    }

    //判斷detail區塊開啟或關閉 以及 若曾經開啟過 就不做後續的api
    //一般的開關區域
    var conten_div = ".st-sub-box-2-content";
    if(this_event.find(".st-box2-more-desc").html()){
        conten_div = ".st-box2-more-desc";
    }
    //一般區域開關
    this_event.find(conten_div).toggleClass("line-clamp");
    // this_event.find(conten_div + "-detail").toggle();   
    //detail區域開關
    this_event.find(detail_data).toggle();
    this_event.find(detail_data + "-detail").toggle();
    
    //開啟留言區域
    if( this_event.find(".st-reply-all-content-area").data("show") == true ){
        triggerDetailBox.data("trigger", false);
        this_event.find(".st-reply-all-content-area").slideUp("",function(){
            $(this).html("");
            this_event.find(".st-reply-like-area").toggle();
            triggerDetailBox.data("trigger", true);
       }).data("show",false);
    }else{
        this_event.find(".st-reply-like-area").toggle();
    }
    
    //設定動態消息detail開關
    if(!this_event.data("detail-content")){
        //表示沒填入過detail內容 即設定為有資料 下次就不重複做資料
        this_event.data("detail-content",true);
        return true;
    }else{
        //表示有detail內容了 不動作
        this_event.data("detail-content",false);
        return false;
    }
}

workContentMake = function (this_event,li){
    //自己的工作放在最前面
    var rest_li = [];
    var me_arr = [];
    var _groupList = QmiGlobal.groups;
    var thisGi = this_event.data("event-id").split("_")[0];
    var thisGu = _groupList[thisGi].me;
    $.each(li,function(i,val){
        var temp_arr = val.u.split(",");

        if($.inArray(thisGu, temp_arr) >= 0){
            val.m = true;
            me_arr.push(val);
        }else{
            rest_li.push(val);
        }
    });
    var new_li = me_arr.concat(rest_li);
    //重置
    this_event.find(".st-task-work-detail").html("");
    cns.debug("new_li:",new_li);
    $.each(new_li,function(i,val){
        var this_work = $('<div class="st-work-option" data-item-index="' + val.k 
            + '"><img class="check" src="images/common/icon/icon_check_round_white.png"><span>' 
            + val.d + '</span><div class="st-work-option-tu"><img src="images/common/icon/icon_work_member_gray.png"/><span>' 
            + _groupList[thisGi].guAll[val.u].nk + '</span></div></div>');
        this_event.find(".st-task-work-detail").append(this_work);
        if(val.m) {
            this_work.data("mine",true);
            this_work.addClass("work-mine-chk");
        };
    });

    //綁定工作事件
    bindWorkEvent(this_event);
}



bindWorkEvent = function (this_event){
    this_event.find(".st-work-option").click(function(){
        var this_work = $(this);
        var fin = false;
        var mine_total = this_event.find(".work-mine-chk").length;
        var mine_finished_total = this_event.find(".work-mine-finished").length;
        var tiFeed = this_event.data("event-id").split("_")[1];
        var thisGi = this_event.data("event-id").split("_")[0];

        //不是自己的工作 或是結束時間到了 就不能點選
        if(!this_work.data("mine") || this_event.data("task-over")) return false;

        if(this_work.data("work-status")){
            var work_status = false;
        }else{
            var work_status = true;

            //表示最後一個工作也要完成了
            if(mine_finished_total == mine_total-1) fin = true;
        }

        var api_name = "groups/" + thisGi + "/timelines/" + tiFeed + "/events?ep=" + this_event.data("event-id");

        var headers = {
                 "ui":ui,
                 "at":at, 
                 "li":lang,
                     };
        var method = "post";

        var body = {
              "meta":
              {
                "lv":"1",
                "tp":"13",
                "fin":fin
              },
              "ml":
              [
                {
                  "tp": 13,
                  "k": this_work.data("item-index"),
                  "a": work_status
                }
              ]
            }
        var result = ajaxDo(api_name,headers,method,true,body);
        result.complete(function(data){
            if(work_status){
                if(this_work.data("mine")) this_work.addClass("work-mine-finished");
                this_work.addClass("st-work-option-gray");
                this_work.find(".st-work-option-tu img").attr("src","images/common/icon/icon_work_member_lightgray.png");
                this_work.find("img:eq(0)").attr("src","images/common/icon/icon_check_red_l.png");
            }else{
                if(this_work.data("mine")) this_work.removeClass("work-mine-finished");
                this_work.removeClass("st-work-option-gray");
                this_work.find(".st-work-option-tu img").attr("src","images/common/icon/icon_work_member_gray.png");
                this_work.find("img:eq(0)").attr("src","images/common/icon/icon_check_round_white.png");
            }

            //更改工作狀態為 已完成
            if(fin) {
                this_event.find(".st-task-status").html( $.i18n.getString("FEED_FINISHED") );
                this_event.find(".st-task-status-area img").attr("src","images/common/icon/icon_check_red_l.png");
            }else{
                //更改工作狀態為 未完成
                this_event.find(".st-task-status").html( $.i18n.getString("FEED_UNFINISHED") );
                this_event.find(".st-task-status-area img").attr("src","images/common/icon/icon_check_lightblue_l.png");
            }

            //存回
            this_work.data("work-status",work_status);
        });
    })
}

voteContentMake = function (this_event,vote_obj){
    var li = vote_obj.li;
    $.each(li,function(v_i,v_val){
        this_event.find(".st-vote-all-ques-area").append($('<div class="st-vote-ques-area-div">').load('layout/timeline_event.html?v2.0.0.4 .st-vote-ques-area',function(){
            var this_ques = $(this).find(".st-vote-ques-area");
            
            //設定題目的編號
            this_ques.data("ques-index",v_val.k);

            // 單選是圈圈
            var tick_img = "images/common/icon/icon_check_red_round.png";
            //複選是勾勾
            if(v_val.v > 1){
                tick_img = "images/common/icon/icon_check_red.png";
            }
            
            this_ques.data("vote-multi",v_val.v);
            this_ques.data("tick-img",tick_img);

            this_ques.find(".st-vote-detail-top span:eq(0)").html(v_i+1);
            var szVote = "";
            if( 1==v_val.v ){
                szVote = $.i18n.getString("FEED_VOTE_LIMIT_1");
            } else {
                szVote = $.i18n.getString("FEED_VOTE_LIMIT_N", v_val.v );
            }
            this_ques.find(".st-vote-detail-top span:eq(1)").html(szVote);
            
            if(v_val.t){
                this_ques.find(".st-vote-detail-desc").show();
                this_ques.find(".st-vote-detail-desc").html(v_val.t);
            }

            $.each(v_val.i,function(i_i,i_val){
                this_ques.append(
                    '<div class="st-vote-detail-option" data-item-index="' + i_val.k + '">' +
                        '<img class="check vote-do" src="images/common/icon/icon_check_round_white.png"/>' +
                        '<span class="vote-do">' + i_val.o + '</span>' +
                        '<img class="more vote-set" src="images/common/icon/icon_arrow_next.png">' +
                        '<span class="cnt vote-set">' + 0 + '</span>' +
                        '<div class="clear-both"></div>' +
                    '</div>'
                );

                //設定複選投票數為 0
                this_ques.data("multi-count",0);
            });

            //load結束 根據投票類型做限制 以及 製作投票結果呈現
            if(v_i == li.length - 1){
                voteTypeSetting(this_event,vote_obj);
                setTimeout(function(){
                    voteResultMake(this_event);
                },500);
            }
        }));
    });

}

voteTypeSetting = function (this_event,vote_obj){

    //寫入類型
    var vote_type = $.i18n.getString("FEED_VOTE_GENERAL");
    if(vote_obj.lv == 1) vote_type = $.i18n.getString("FEED_VOTE_PUBLIC");
    if(vote_obj.lv == 2) vote_type = $.i18n.getString("FEED_VOTE_ANONYMOUS");
    this_event.find(".st-task-vote-detail-count span.vote-type").html(vote_type);


    //非發文者 會受投票類型限制
    if(this_event.data("event-val").meta.gu == gu) return false;

    var cnt_close = true,member_close = true;
    //現在時間 大於 結束時間
    if(new Date().getTime() > vote_obj.e){
        if(vote_obj.lv == 2) member_close = false;
    }else{
        //投票進行中 只有公開模式都是開啓
        if(vote_obj.lv != 1){
            cnt_close = false,member_close = false;
        }
    }

    if(cnt_close == false) this_event.find(".st-vote-detail-option .cnt").hide();
    if(member_close == false) this_event.find(".st-vote-detail-option .more").hide();

}

voteResultMake = function (this_event){
    var vote_obj = this_event.data("vote-result");
    var all_ques = this_event.find(".st-vote-ques-area");
    var thisGi = this_event.data("event-id").split("_")[0],
        thisGu = QmiGlobal.groups[thisGi].me;
    //設定投票人數
    this_event.find(".st-task-vote-detail-count").show();
    this_event.find(".st-task-vote-detail-count span:first").html(Object.keys(vote_obj).length + "人已投票");

    //預設opt 為全部都沒選 fasle
    this_event.find(".st-vote-detail-option").data("vote-chk",false);

    //根據每個答案的gu
    $.each(vote_obj,function(ans_gu,ans_val){
        //每個gu的答案 有多個題目
        $.each(ans_val.li,function(k_i,k_val){
            //畫面上的每個題目
            $.each(all_ques,function(ques_i,ques_val){
                var this_ques = $(this);
                //題目的編號 和 答案的編號相同 而且 有投票的內容(可能 "i": [])
                if(k_val.k == this_ques.data("ques-index") && k_val.i.length > 0){
                    //答案的多個投票
                    $.each(k_val.i,function(i_i,i_val){
                        //最後一個 每個選項的k
                        $.each(this_ques.find(".st-vote-detail-option"),function(opt_i,opt_val){
                            var this_opt = $(this);
                            if(this_opt.data("item-index") == i_val.k){
                                var count = this_opt.find("span:eq(1)").html();
                                this_opt.find("span:eq(1)").html(count*1+1);

                                //將gu記錄起來
                                var member_list = this_opt.data("member-list") || [];
                                member_list.push({gu:ans_gu,rt:ans_val.time});
                                this_opt.data("member-list",member_list);
                                
                                //自己投的 要打勾
                                if(ans_gu == thisGu){
                                    //已投過票數加一
                                    var n = this_ques.data("multi-count")*1;
                                    this_ques.data("multi-count",n+1)
                                    this_opt.data("vote-chk",true);
                                    this_opt.find("img.check").attr("src",this_ques.data("tick-img"));
                                }
                            }
                        });//最後一個 每個選項的k
                    });//答案的多個投票
                }//題目的編號
            });//每個題目 
        });//答案的多個題目
    });

    //綁定投票事件
    setTimeout(function(){
        bindVoteEvent(this_event);
    },100);
}

bindVoteEvent = function (this_event){

    this_event.find(".st-vote-detail-option .vote-do").click(function(){
        //時間到 不給點
        if(this_event.data("task-over")){
            return false;
        }
        
        var this_opt = $(this).parent();
        var this_ques = this_opt.parent();
        var ml_minus_chk = false;

        //復選的已選計數 單選也用來判斷有無投票
        var vote_cnt = this_ques.data("multi-count");
        var vote_chk = false;

        //複選
        if(this_ques.data("vote-multi") > 1){
            //該選項的總計數
            var opt_cnt = this_opt.find("span:eq(1)").html()*1;

            //復選的情況就要判斷該選項是否已選擇
            if(this_opt.data("vote-chk")){
                this_opt.data("vote-chk",false);
                this_opt.find("img.check").attr("src","images/common/icon/icon_check_round_white.png");

                //該項總計減一
                
                opt_cnt -= 1;

                //減一 統計複選票數 才能計算是否達複選上限
                this_ques.data("multi-count",vote_cnt-1);

                //將自己的gu從ml剔除
                var member_list = this_opt.data("member-list") || [];
                if(member_list.length > 0){
                    for(var i in member_list){
                        if(member_list[i].gu == gu) member_list.splice(i, 1);
                    }
                }

            //沒選變已選 投票數未達上限
            }else if(vote_cnt <  this_ques.data("vote-multi")){

                this_opt.data("vote-chk",true);

                //加一 統計複選票數 才能計算是否達複選上限
                this_ques.data("multi-count",vote_cnt+1);

                //該項總計加一
                opt_cnt += 1;

                //member_list也加上自己
                var member_list = this_opt.data("member-list") || [];
                member_list.push({gu:gu,rt:new Date().getTime()});
                this_opt.data("member-list",member_list);

                //複選 這時要變勾勾
                this_opt.find("img.check").attr("src",this_ques.data("tick-img"));
            }

        //單選
        }else{
            //找出點選的那一項要減一
            $.each(this_ques.find(".st-vote-detail-option"),function(i,val){
                if($(this).data("vote-chk")){
                    //找出點選的那一項的vote-chk 變false
                    $(this).data("vote-chk",false);
                    //找出點選的那一項 變成白圈圈
                    $(this).find("img.check").attr("src","images/common/icon/icon_check_round_white.png");

                    //該項總計減一
                    var this_cnt = $(this).find("span:eq(1)").html()*1;
                    $(this).find("span:eq(1)").html(this_cnt-1);

                    //將自己的gu從ml剔除
                    var member_list = $(this).data("member-list") || [];
                    if(member_list.length > 0){
                        for(var i in member_list){
                            if(member_list[i].gu == gu) member_list.splice(i, 1);
                        }
                    }
                }
            });
            

            //該選項的總計數
            var opt_cnt = this_opt.find("span:eq(1)").html()*1;
            this_opt.data("vote-chk",true);

            //單選 選到的直接是圈圈
            this_opt.find("img.check").attr("src",this_ques.data("tick-img"));

            //該項總計加一
            opt_cnt += 1;

            //member_list也加上自己
            var member_list = this_opt.data("member-list") || [];
            member_list.push({gu:gu,rt:new Date().getTime()});
            this_opt.data("member-list",member_list);

            //加一 計算是否有投票
            if(vote_cnt == 0)
                this_ques.data("multi-count",vote_cnt+1);
        }

        //單選復選都加一 更改票數
        this_opt.find("span:eq(1)").html(opt_cnt);

        //選了之後變更送出顏色
        if(!this_event.find(".st-vote-send").hasClass("st-vote-send-blue")){
            this_event.find(".st-vote-send").addClass("st-vote-send-blue");
            this_event.find(".st-vote-send").html( $.i18n.getString("COMMON_SUBMIT") );
        }
    });
    
    //綁過不要再綁 會重複執行
    if(this_event.data("vote-bind-chk")) return false;

    //送出
    this_event.find(".st-vote-send").click(function(){

        //綁過不要再綁 會重複執行
        this_event.data("vote-bind-chk",true);


        var thisTimelineID = this_event.data("event-id").split("_")[1];
        var thisGroup = this_event.data("event-id").split("_")[0];

        //沒藍色表示不給送出
        if(!$(this).hasClass("st-vote-send-blue")){
            return false;
        }

        this_event.find(".st-vote-send").removeClass("st-vote-send-blue");

        var reply_obj = {};
        reply_obj.li = [];
        reply_obj.tp = 15;

        //檢查是否每一題有投票 預設他都有投 人性本善
        var vote_chk = false;
        var vote_chk_index;

        $.each(this_event.find(".st-vote-ques-area"),function(i,val){
            var this_ques = $(this);

            //有一題沒投 就跳出
            if(this_ques.data("multi-count") == 0){
                vote_chk = true;
                vote_chk_index = this_ques.find(".st-vote-detail-top span:eq(0)").html();
                return false;
            }

            var ques_obj = {};
            ques_obj.k = this_ques.data("ques-index");
            ques_obj.i = [];

            $.each($(this).find(".st-vote-detail-option"),function(i,val){
                var this_opt = $(this);

                if(this_opt.data("vote-chk")){
                    var item_obj = {};
                    item_obj.k = this_opt.data("item-index");

                    ques_obj.i.push(item_obj);
                }

            });

            reply_obj.li.push(ques_obj);
        });
        
        if(vote_chk){
            // popupShowAdjust("","第" + vote_chk_index +" 題尚未完成投票");
            popupShowAdjust("", $.i18n.getString("FEED_VOTE_LIMIT") );
            return false;
        }

        var body = {
            "meta" : {
                "lv" : 1,
                "tp" : "14"
            },
            "ml" : [reply_obj]
        };


        var api_name = "groups/" + thisGroup + "/timelines/" + thisTimelineID + "/events?ep=" 
            + this_event.data("event-id");

        var headers = {
                 "ui":ui,
                 "at":at, 
                 "li":lang,
                     };


        var method = "post";
        ajaxDo(api_name,headers,method,false,body).complete(function(data){
            if( 200==data.status ){
                //重新讀取detail
                // popupShowAdjust("","回覆成功");
                toastShow( $.i18n.getString("FEED_VOTE_SENDED") );
                
                //客製化 按了確定之後再重讀取
                $(".popup-close").bind("reload",function(){
                    //重設任務完成狀態
                    eventStatusWrite(this_event);

                    //重設完整的detail
                    this_event.data("detail-content",false);
                    this_event.find(".st-vote-all-ques-area").html("");
                    // timelineDetailClose toggle負負得正
                    this_event.find(".st-reply-area").hide();

                    this_event.data("switch-chk",false);

                    this_event.find(".st-sub-box-1").trigger("click");
                    $(".popup-close").unbind("reload");
                });
            } else {
                toastShow( $.i18n.getString("FEED_VOTE_FAILED") );
            }
        });
    });

    this_event.find(".st-vote-detail-option .more").click(function(){

        var this_opt = $(this).parent();
        var this_ques = this_opt.parent();

        if(this_opt.data("member-list").length == 0) return false;

        var title = this_ques.find(".st-vote-detail-desc").html() + " - " + this_opt.find(".vote-do:not(.check)").html();
        var list = [ {title:title,ml:this_opt.data("member-list")} ];

        var this_ei = this_event.data("event-id");
        var this_gi = this_ei.split("_")[0];
        cns.debug("list",list);
        showObjectTabShow(this_gi, title, list);
    });
}


composeContentMake = function (compose_title){
    
    //開始讀取
    $('.cp-content-load').html($('<div>').load('layout/compose.html .cp-content',function(){

        var this_compose = $(this).find(".cp-content");
        var ctp = 0;
        this_compose._i18n();

        //設定 重複送出檢查
        this_compose.data("send-chk",true);

        this_compose.css("min-height",$(window).height());
        //發文類型陣列以及檢查附檔存在
        this_compose.data("message-list",[0]);

        //圖片上傳物件及流水號
        this_compose.data("upload-obj",{});
        this_compose.data("upload-video",{});
        this_compose.data("upload-file",{});
        this_compose.data("upload-ai",0);
        this_compose.data("body",{});

        //發文附件順序物件
        this_compose.data("ml-order-obj",{});

        //附檔區域是否存在檔案 用來判斷開關
        this_compose.data("attach",false);

        this_compose.find('.cp-textarea-desc, .cp-vote-area textarea').autosize({append: "\n"});

        var show_area,title,init_datetimepicker;

        //clear sticker
        var stickerArea = $("#page-compose .stickerArea");
        if( true == stickerArea.data("open") ){
            var stickerIcon = $("#page-compose .cp-addfile[data-cp-addfile='sticker']");
            stickerIcon.trigger("click");
        }
        stickerArea.html("");
        stickerArea.data("isCreate", null);

        //set type to adjust content area css height
        this_compose.attr("data-type", compose_title);

        switch (compose_title) {
            case "post":
                ctp = 0;
                show_area = ".cp-content-object";
                break;
            case "announcement": 
                ctp = 1;
                show_area = ".cp-content-title ,.cp-content-object, .cp-content-apt , .cp-content-top";
                break;
            case "feedback":
                ctp = 2;
                show_area = ".cp-content-title ,.cp-content-object, .cp-content-apt";
                break;
            case "work"://cp-work-area
                ctp = 3;
                show_area = ".cp-content-title ,.cp-work-area,.cp-content-addcal,.cp-time-area";
                composeWorkEvent(this_compose);
                
                init_datetimepicker = true;

                break;
            case "vote":
                ctp = 4;
                show_area = ".cp-content-title,.cp-content-object, .cp-content-object ,.cp-vote-area,.cp-vote-type-area,.cp-content-addcal,.cp-time-area";  //.cp-content-first,

                //預設題目數為0
                this_compose.data("ques-total",0);

                init_datetimepicker = true;

                composeVoteQuesMake(this_compose);
                composeVoteEvent(this_compose);
                
                break;
            case "check":
                ctp = 5;
                show_area = ".cp-content-title,.cp-content-object, .cp-content-object ,.cp-content-addcal,.cp-time-area";  //.cp-content-first,

                init_datetimepicker = true;
                break;
        }

        //watermark
        setWatermark({dom: this_compose, ctp: ctp});
        

        //發佈對象
        composeObjectShow(this_compose);

        //狀態編號
        this_compose.data("compose-tp",ctp);
        //message list 宣告為空陣列

        this_compose.find(show_area).show();

        //共同綁定事件
        //打勾
        //置頂
        this_compose.find(".cp-content-top").click(function(){
            if(this_compose.data("cp-top")){
                $(this).find(".cp-top-btn").attr("src","images/compose/compose_form_icon_check_none.png");
                this_compose.data("cp-top",false);
            }else{
                $(this).find(".cp-top-btn").attr("src","images/compose/compose_form_icon_check.png");
                this_compose.data("cp-top",true);
            }
        });
        

        //url parse
        this_compose.find('.highlight-container').bind('input',function(){
            //有東西就不作了
            var inputText = $(this).text();
            if(this_compose.data("url-chk")) return false;
            //先將換行符號換成<br/>加空格 再以空格切出陣列
            var url_chk = inputText.replace(/\n|\r/g,"|<br/>|").split('|');
            var regexUrl = /^(((http|https):\/\/)|(www\.))+[-a-zA-Z0-9:%_\+.~#?&//=]+\s$/;
            var regexWrap = /(((http|https):\/\/)|(www\.))+[-a-zA-Z0-9:%_\+.~#?&//=]+(\n|\r){2}$/;
            
            if(inputText.match(regexWrap)){
                var result = regexWrap.exec(inputText);
                this_compose.data("parse-waiting",true).data("url-chk",true);
                if(!this_compose.data("parse-resend")) $(".cp-attach-area").show().find(".url-loading").css("display","block");
                getLinkMeta(this_compose,result[0]);
            }

            $.each(url_chk,function(i,val){
                if(val.match(regexUrl)){
                    this_compose.data("parse-waiting",true).data("url-chk",true);
                    if(!this_compose.data("parse-resend")) $(".cp-attach-area").show().find(".url-loading").css("display","block");
                    getLinkMeta(this_compose,val);
                }
            });
        });

        this_compose.find('.highlight-container').bind('paste',function(e){
            e.preventDefault();
            //先將換行符號換成<br/>加| 再以|切出陣列
            var url_chk = e.originalEvent.clipboardData.getData('text').replace(/\n|\r/g,"|<br/>|").split('|');
            var regexUrl = /^(((http|https):\/\/)|(www\.))+[-a-zA-Z0-9:%_\+.~#?&//=]+/;
            $.each(url_chk,function(i,val){
                if(val.match(regexUrl)){
                    if(!this_compose.data("url-chk")){
                        //送出判斷 等到網址內容取得成功 再送出
                        this_compose.data("parse-waiting",true).data("url-chk",true);
                        if(!this_compose.data("parse-resend")) $(".cp-attach-area").show().find(".url-loading").css("display","block");
                        getLinkMeta(this_compose,val);
                    }
                }
            });
        });

        this_compose.find('.highlight-container').bind('keydown',function(e){
            var thisTextArea = $(this);
            var selectionObj = window.getSelection();
            var cursorPosition = getCaretPosition();
            var currentNode = window.getSelection().anchorNode;
            var parentNode = currentNode.parentNode;

            if (e.keyCode == 8 || e.keyCode == 46) {
                if (parentNode.nodeName == "MARK") {
                    var markMemberID = $(parentNode).attr("id");
                    var memberName = $(parentNode).attr("name");
                    if (cursorPosition > 0 && parentNode.innerHTML == memberName) {
                        
                        thisTextArea.get(0).removeChild(parentNode);
                        thisTextArea.data("memberList")[markMemberID] = thisTextArea.data("markMembers")[markMemberID];
                        delete thisTextArea.data("markMembers")[markMemberID];
                    }
                }
            } else if (e.keyCode == 13) {
                if (parentNode.nodeName == "MARK" && selectionObj.focusOffset == 0) {
                    currentNode.parentElement.insertAdjacentHTML( 'beforeBegin', '\n' );
                    return false;
                }
            }
        });

        this_compose.find('.highlight-container').bind('keyup mouseup', function(e) {
            var thisTextArea = $(this);
            var element = thisTextArea.get(0);
            var pureText = thisTextArea.text();
            var htmlText = thisTextArea.html();
            var replyDom = thisTextArea.parent();
            var cursorPosition = getCaretPosition();
            var preTextOfCursor = htmlText.substring(0, cursorPosition);
            var selectionObj = window.getSelection();
            var tagElements = "";
            
            delUncompleteMark(thisTextArea, cursorPosition);

            if ( !thisTextArea.data("memberList")
              && !thisTextArea.data("markMembers")) {
                thisTextArea.data("memberList", $.extend({}, QmiGlobal.groups[gi].guAll));
                thisTextArea.data("markMembers", {});
            }

            if (!htmlText) {
                thisTextArea.data("memberList", $.extend({}, QmiGlobal.groups[gi].guAll));
                thisTextArea.data("markMembers", {});
            }

            replyDom.find(".tag-list").remove();
            replyDom.find(".tag-members-container").hide();

            // 判斷caret前面的字串是否包含@ 
            if (preTextOfCursor.lastIndexOf("@") >= 0) {

                // 紀錄 @ 在字串的位置
                var lastMarkPosition = preTextOfCursor.lastIndexOf("@");
                // 取得 @ 到游標 之間的字串 
                var markText = preTextOfCursor.substring(lastMarkPosition + 1, cursorPosition);

                // cursor 滑鼠標誌的位置在最尾端， 或者cursor後面字串為空白
                if ((cursorPosition == htmlText.length) || (htmlText[cursorPosition].match(/\s/g)) ||
                    (htmlText.substring(cursorPosition, cursorPosition + 4)) == "<br>") {
                    var memberslist = thisTextArea.data("memberList");
                    for (var key in memberslist) {
                        var memberObj = memberslist[key];
                        if (memberObj.st == 1) {
                            var memberMugshot = memberObj.aut || "images/common/others/empty_img_personal.png";
                            var memberName = memberObj.nk ;
                            var re = new RegExp(markText, "gi");
                            if (memberName && markText && memberName.search(re) >= 0) {
                                tagElements += "<li id='" + key + "'><img src='" + memberMugshot + 
                                    "' class='member-mugshot'/>" + memberName + "</li>";
                            }
                        }
                    }
                }

                // 打開選取成員的選單
                if (tagElements.length) {
                    replyDom.find(".tag-members-container").prepend($("<ul/>", {
                        "class": "tag-list",
                        html: tagElements
                    })).show();

                    // 點選其中之一成員的動作
                    $(".tag-list").find("li").bind("click", function(e) {

                        if ($(e.target).is("li")) {
                            var memberID = e.target.id;
                        } else {
                            var memberID = ($(e.target).parent().attr("id"));
                        }
                        
                        var memberName = (thisTextArea.data("memberList")[memberID]).nk;
                        var mugshot = (thisTextArea.data("memberList")[memberID]).aut || 
                            "images/common/others/empty_img_personal.png";

                        //替換at加後面的字串為此成員的名字
                        var replaceText = preTextOfCursor.substring(0, lastMarkPosition) 
                            + preTextOfCursor.substring(lastMarkPosition, cursorPosition).replace("@" 
                                + markText, " <mark id='" + memberID + "' name='" + memberName + "'>" 
                                + memberName + "</mark> ")
                            + htmlText.substring(cursorPosition, htmlText.length);

                        thisTextArea.html(replaceText);
                        thisTextArea.data("markMembers")[memberID] = {
                            id : memberID,
                            nk : memberName,
                            aut: mugshot,
                            st: 1,
                        };

                        // 刪除成員列表選單的成員
                        delete thisTextArea.data("memberList")[memberID];
                        replyDom.find(".tag-members-container").hide();

                        // 設定選取完後游標位置
                        var range = document.createRange();
                        var markNode = thisTextArea.find("mark[name='" + memberName + "']");
                        range.setStart(markNode[0].nextSibling, 1);
                        selectionObj.removeAllRanges();
                        selectionObj.addRange(range);
                    });
                }
            }
        });

        this_compose.find('.highlight-container').bind('focusout', function(e){
            var replyDom = $(this).parent();
            if (replyDom.find(".tag-members-container:hover").length == 0) {
                replyDom.find(".tag-members-container").hide();
            }
        })


        //datetimepicker
        if(init_datetimepicker){
            setDateTimePicker(this_compose);
        }
    }));

    function setWatermark(argObj) {
        var composeDom = argObj.dom;
        if(QmiGlobal.groups[QmiGlobal.currentGi].ptp === 1) composeDom.find(".cp-content-watermark").show();
        else return;

        //浮水印
        composeDom.find(".cp-content-watermark").click(function(){
            if(composeDom.data("cp-watermark")){
                $(this).find(".cp-watermark-btn").attr("src","images/compose/compose_form_icon_check_none.png");
                composeDom.data("cp-watermark",false);
            }else{
                $(this).find(".cp-watermark-btn").attr("src","images/compose/compose_form_icon_check.png");
                composeDom.data("cp-watermark",true);
            }
        });

        // 浮水印顯示狀況
        var swTp = QmiGlobal.groups[QmiGlobal.currentGi].newData.sw.wa[argObj.ctp];
        switch(swTp) {
            case 1: // 強制開啟
                composeDom.find(".cp-content-watermark").click();
                composeDom.find(".cp-content-watermark").unbind("click").click(function() {
                    toastShow($.i18n.getString("WEBONLY_WATERMARK_FORCED"));
                });
                break;
            case 2: // 預設開啟
                composeDom.find(".cp-content-watermark").click();
                break;
        }
    }
}

composeObjectShow = function(this_compose){

    //避免重複綁定事件 先解除
    $(document).off('click', '.cp-content-object ,.cp-work-item-object');
    $(document).on("click",".cp-content-object ,.cp-work-item-object", function(){
        composeObjectShowDelegate( this_compose, $(this) );
    });
}

composeObjectShowDelegate = function( thisCompose, thisComposeObj, option, onDone ){
    var objectDelegateView = ObjectDelegateView;
    var objData, branchData, favoriteData;
    var isShowBranch = false;
    var isShowSelf = false;
    var isShowAll = true;
    var isShowFav = true;
    var isShowFavBranch = true;
    var isBack = true;
    var isShowLeftMem = false;
    var isForWork = thisComposeObj.parent().hasClass("cp-work-item");

    var group = QmiGlobal.groups[gi],
        guAll = group.guAll,
        bl = group.bl,
        fbl = group.fbl,
        guList = Object.keys(guAll) || [];


    $.mobile.changePage("#page-object", {transition: "slide"});

    //工作
    if ( null== option ) {
        if(thisComposeObj.parent().hasClass("cp-work-item")) {
            //工作發佈對象
            isShowBranch = false;
            isShowSelf = true;
            isShowAll = false;
            isShowFav = false;
            isShowFavBranch = false;
        } else {
            //其餘發佈對象
            isShowBranch = true;
            isShowSelf = true;
        }
    } else {
        isShowBranch = (null==option.isShowBranch) ? isShowBranch: option.isShowBranch;
        isShowSelf = (null==option.isShowSelf) ? isShowSelf : option.isShowSelf;
        isShowAll = (null==option.isShowAll) ? isShowAll : option.isShowAll;
        isShowFav = (null==option.isShowFav) ? isShowFav : option.isShowFav;
        isShowFavBranch = (null==option.isShowFavBranch) ? isShowFavBranch : option.isShowFavBranch;
        isBack = (null==option.isBack) ? isBack : option.isBack;
        isShowLeftMem = (null==option.isShowLeftMem) ? isShowLeftMem : option.isShowLeftMem;
    }

    if (thisComposeObj.parent().hasClass("cp-work-item")) {
        objData = $.parseJSON(thisComposeObj.data("object_str")) || {};
    } else {
        objData = $.parseJSON(thisCompose.data("object_str")) || {};
        branchData = $.parseJSON(thisCompose.data("branch_str")); 
        favoriteData = $.parseJSON(thisCompose.data("favorite_str")); 
    }

    var visibleMemList = guList.filter(function(gu) {
        var userObj = guAll[gu];
        if( !isShowSelf && gu == group.gu ) return false; 
        if( !isShowLeftMem && userObj.st != 1 ) return false;
        if( group.ntp === 2 && thisCompose.data("offical") === "add" && guAll[group.gu].abl == "" && userObj.ad != 1) return false;
        var branchID = userObj.bl;
        var extraContent = "";

        // if (objData.hasOwnProperty(gu)) userObj.chk = true;
        // else userObj.chk = false;

        if( branchID && branchID.length > 0 ){
            var branchPath = branchID.split(".");
            if( branchPath && branchPath.length > 0 ){
                branchID = branchPath[branchPath.length-1];
                if( bl.hasOwnProperty(branchID) ){
                    extraContent = bl[branchID].bn;
                }
            }
        }

        userObj.bn = extraContent;

        return true;
    });

    var viewOption = {
        mainPage : $("#page-object"),
        headerBtn : $("#page-object").find(".obj-done"),
        selectNumElement : $("#page-object").find(".header-cp-object span:eq(1)"),
        thisCompose : thisCompose,
        thisComposeObj : thisComposeObj,
        onDone : onDone,
        isBack : isBack,
        singleCheck : (group.ntp === 2 && thisCompose.data("offical")==="add") || isForWork,
        visibleMembers : visibleMemList,
        checkedMems : objData,
        checkedBranches : branchData,
        checkedFavorites : favoriteData,
        minSelectNum : 0,
    }

    objectDelegateView.init(viewOption).setHeight();

    //no one to select, show coachmark & return
    if ((isShowSelf && group.cnt <= 0) || ( !isShowSelf && group.cnt <= 1) ) {
        objectDelegateView.showNoMember();
        return;
    } 

    //----- 全選 ------
    if( isShowAll ) objectDelegateView.addRowElement("Default", {isObjExist : (Object.keys(objData).length > 0) ? true : false });

    //----- 我的最愛 ------
    if( isShowFav && (group.favCnt > 0 || Object.keys(fbl).length > 0)){
        objectDelegateView.addRowElement("Favorite");

        visibleMemList.forEach(function(gu) {
            var guObj = guAll[gu];
            if (guObj.fav) {
                objectDelegateView.addFavoriteSubRow("Member", {thisMember : guObj, isSubRow : true});
            }
        });        

        if( isShowFavBranch ){
            for( var fi in fbl ){
                var fbObj = fbl[fi];
                fbObj.fi = fi;
                fbObj.chk = false;
                if (favoriteData && Object.keys(favoriteData).length) {
                    if (favoriteData[fi] != undefined ) fbObj.chk = true;
                }
                objectDelegateView.addFavoriteSubRow("FavBranch", {thisFavBranchObj : fbObj, isSubRow : true});
            }
        }
    }

    //----- 團體列表 ------
    if( bl && isShowBranch && Object.keys(bl).length > 0 ) {
        var parentBranches = [];
        objectDelegateView.addRowElement("SelectAllTitle", {type : "group", isDisplayedChkbox : true});

        //團體rows
        $.each(bl, function(key, branchObj){

            branchObj.chk = false;
            branchObj.bi = key;
            if (branchData && Object.keys(branchData).length) {
                if (branchData[key] != undefined ) branchObj.chk = true;
            }

            //第一層顯示開關
            if (1 == branchObj.lv) {
                parentBranches.push(key);
            }
        });

        parentBranches.forEach(function (branchKey) {
            objectDelegateView.addRowElement("ParentBranch", {thisBranch : bl[branchKey], bl: bl});
        });
    }
    
    
    //----- 加入成員列表 ------

    if(!thisComposeObj.parent().hasClass("cp-work-item") && thisCompose.data("offical") !=="add") {
        objectDelegateView.addRowElement("SelectAllTitle", {type : "mem", isDisplayedChkbox : true});
    }
    else objectDelegateView.addRowElement("SelectAllTitle", {type: "mem", isDisplayedChkbox : false});


    objectDelegateView.makeMemberList();

    objectDelegateView.updateStatus();
}

updateSelectedObj = function() {
    var len = 0;
    var cnt = 0;
    var branch = $(".obj-content").data("selected-branch");
    var mem = $(".obj-content").data("selected-obj");
    var fbl = $(".obj-content").data("selected-fav");
    
    $(".obj-selected .list .text").html("");
    //寫入到選擇區域
    if( null != branch ){
        len += Object.keys(branch).length;
        $.each(branch,function(i,val){
            $(".obj-selected .list .text").append("<span>"+val.replaceOriEmojiCode()+"</span>");
        });

        var bAllSelect = true;
        $(".obj-cell.branch").each(function(){
            if( !$(this).data("chk") ){
                bAllSelect = false;
                return false;
            }
        });
        var all = $(".obj-cell-subTitle.group");
        if( bAllSelect ){
            //群組全選
            all.data("chk", true );
            all.find(".img").addClass("chk");
        } else {
            //清除群組全選
            all.data("chk", false );
            all.find(".img").removeClass("chk");
        }
    }

    if( null != mem ){
        //check me
        var meGu = $(".obj-cell.self").data("gu");
        if( true==$(".obj-cell.mem[data-gu="+meGu+"]").data("chk") ){
            $(".obj-cell.self").data("chk",true);
            $(".obj-cell.self").find(".img").addClass("chk");
        } else {
            $(".obj-cell.self").data("chk",false);
            $(".obj-cell.self").find(".img").removeClass("chk");
        }
        

        len += Object.keys(mem).length;
        // $.each(mem,function(i,val){
        //     $(".obj-selected .list .text").append("<span>"+val.replaceOriEmojiCode()+"</span>");
        // });

        var bAllSelect = true;
        $(".obj-cell.mem").each(function(){
            if( !$(this).data("chk") ){
                bAllSelect = false;
                return false;
            }
        });
        // var all = $(".obj-cell-subTitle.mem");
        // if( bAllSelect ){
        //     //群組全選
        //     all.data("chk", true );
        //     all.find(".img").addClass("chk");
        // } else {
        //     //清除群組全選
        //     all.data("chk", false );
        //     all.find(".img").removeClass("chk");
        // }
    }

    if( null != fbl ){
        len += Object.keys(fbl).length;
        $.each(fbl,function(i,val){
            $(".obj-selected .list .text").append("<span>"+val.replaceOriEmojiCode()+"</span>");
        });
        var bAllSelect = true;
        $(".subgroup-row.fav-parent div:nth-child(2) .obj-cell").each(function(){
            if( !$(this).data("chk") ){
                bAllSelect = false;
                return false;
            }
        });
        var all = $(".obj-cell.fav");
        if( bAllSelect ){
            //最愛全選
            all.data("chk", true );
            all.find(".img").addClass("chk");
        } else {
            //清除最愛全選
            all.data("chk", false );
            all.find(".img").removeClass("chk");
        }
    }
    // $(".obj-cell-area").css("padding-top",($(".obj-selected div:eq(1)").height()+20)+"px");
    // cns.debug("$(window).height():",$(window).height());
    //更改標題
    $(".header-cp-object span:eq(1)").html(len);

    //重設高
    var padding_top = $(".obj-selected").outerHeight();
    $(".obj-cell-area").css("padding-top",padding_top);
    $(".obj-cell-area").css("height",$(window).height()-57-padding_top);
}

createChild = function( bl, parent, bl_obj ){
    var tmp = $("<div></div>");
    if( 1==bl_obj.lv ) tmp.css("display","none");
    for( var i=0; i<bl_obj.cl.length; i++ ){
        var key = bl_obj.cl[i];
        var data = bl[key];

        //目前除了第一層外所有階層都同級
        // var content = $("<div class='obj-cell branch _"+data.lv+"' data-bl='"+key+"' data-bl-name='"+data.bn+"'>"+
        var content = $("<div class='obj-cell branch _2' data-bl='"+key+"' data-bl-name='"+data.bn+"'>"+
            '<div class="obj-cell-chk"><div class="img"></div></div>' +
            // '<div class="obj-cell-user-pic namecard"><img src="images/common/others/select_empty_group_photo.png" style="width:60px"/></div>' +
            '<div class="obj-cell-user-pic namecard"><img src="images/common/others/select_empty_all_photo.png" style="width:60px"/></div>' +
            '<div class="obj-cell-subgroup-data">' + 
                '<div class="obj-user-name">' + data.bn.replaceOriEmojiCode() + '</div>' +
            '</div>'
        );

        // content.css("padding-left", (data.lv-1)*20+"px;");
        // content.css("background", ;

        tmp.append( content );
        if( data.cl.length>0 ) createChild(bl, tmp, data );
    }
    
    parent.append(tmp);
}

clearMeAndAllSelect = function(){
    //deselect self & all
    var speSelect = $(".obj-cell.self, .obj-cell.all");
    speSelect.each( function(){
        if( $(this).data("chk") ){
            $(this).data("chk", false );
            $(this).find(".img").removeClass("chk");
            //clear data
            $(".obj-content").data("selected-branch",{});
            $(".obj-content").data("selected-obj",{});
        }
    });
}
clearMemAndBranchAll = function(){
    //deselect "select all" of branch & mem
    $(".obj-cell-subTitle").each( function(){
        if( $(this).data("chk") ){
            $(this).data("chk", false );
            $(this).find(".img").removeClass("chk");
        }
    });
}

selectTargetAll = function(){
    clearMeAndAllSelect();
    clearMemAndBranchAll();
    $(".obj-cell.all").data("chk",true);
    $(".obj-cell.all").find(".img").addClass("chk");
    //clear data
    $(".obj-content").data("selected-branch",{});
    $(".obj-content").data("selected-obj",{});
    $(".obj-content").data("selected-fav",{});
    
    //deselect group&mem "select all"
    $(".obj-cell-subTitle").data("chk",false);
    //deselect all branch
    $(".obj-cell-area").find(".obj-cell.branch").each(function(){
        var this_cell = $(this);
        this_cell.data("chk",false);
        this_cell.find(".obj-cell-chk .img").removeClass("chk");
    });
    //deselect all mem
    $(".obj-cell-area").find(".obj-cell.mem").each(function(){
        var this_cell = $(this);
        this_cell.data("chk",false);
        this_cell.find(".obj-cell-chk .img").removeClass("chk");
    });
    //deselect all mem
    $(".obj-cell-area").find(".obj-cell.fav").each(function(){
        var this_cell = $(this);
        this_cell.data("chk",false);
        this_cell.find(".obj-cell-chk .img").removeClass("chk");
    });
    //deselect all mem
    $(".obj-cell-area").find(".obj-cell.fav-branch").each(function(){
        var this_cell = $(this);
        this_cell.data("chk",false);
        this_cell.find(".obj-cell-chk .img").removeClass("chk");
    });
    updateSelectedObj();
}

getMemObjectRow = function( gu_obj, bl ){
    var this_obj = $(
        '<div class="obj-cell mem" data-gu="'+gu_obj.gu+'">' +
           '<div class="obj-cell-chk"><div class="img"></div></div>' +
           '<div class="obj-cell-user-pic namecard"><img src="images/common/others/empty_img_personal_xl.png" style="width:60px"/></div>' +
           '<div class="obj-cell-user-data">' + 
                '<div class="obj-user-name">' + gu_obj.nk.replaceOriEmojiCode() + '</div>' +
                '<div class="obj-user-title"></div>' +
        '</div>'
    );

    //get extra content (bl name or em)
    var branchID = gu_obj.bl;
    var extraContent = "";  //gu_obj.em;
    if( branchID && branchID.length>0 ){
        var branchPath = branchID.split(".");
        if( branchPath && branchPath.length>0 ){
            branchID = branchPath[branchPath.length-1];
            if( bl.hasOwnProperty(branchID) ){
                extraContent = bl[branchID].bn;
            }
        }
    }
    if(extraContent && extraContent.length>0){
        this_obj.find(".obj-cell-user-data").addClass("extra");
        this_obj.find(".obj-user-title").html( extraContent );
    }

    var object_img = this_obj.find(".obj-cell-user-pic img");
    if(gu_obj.aut) {
        object_img.attr("src",gu_obj.aut);
        avatarPos(object_img);
    }

    this_obj.data("gu",gu_obj.gu);
    this_obj.find(".obj-cell-user-pic.namecard").data("gu",gu_obj.gu);
    this_obj.data("gu-name",gu_obj.nk);

    return this_obj;
}

timelineObjectTabShowDelegate = function( this_event, type, onDone ){
    var list = [];
    var title = "";
    var this_ei = this_event.data("event-id");
    var this_gi = this_ei.split("_")[0];

    //(0=讀取, 1=按讚, 2=按X, 3=按訂閱, 4=按置頂, 7=按任務, 9 = 未讀取)
    switch( type ){
        case 0:
        case 9:
            //s9=1or3無法看已未讀列表
            var isShowUnreadAndTime = false;
            var targetUsers = {};
            var groupAllMembers = QmiGlobal.groups[this_gi].guAll || {};
            if( (QmiGlobal.groups[this_gi] || {}).ptp === 1) isShowUnreadAndTime = true;

            var isReady = false;
            //get read
            list.push( {title:$.i18n.getString("FEED_READ"), ml: null});
            getThisTimelinePart( this_event, 0, function (data) {
                try{
                    var parseData = $.parseJSON( data.responseText ).epl;
                    if( false==isShowUnreadAndTime ){
                        for( var i=0; i<parseData.length; i++ ){
                            delete parseData[i].rt;
                        }
                    }
                    list[0].ml = parseData;

                    // 有發布對象的話
                    if (this_event.data("object_str")) {
                        var objectData = $.parseJSON(this_event.data("object_str"));

                        // 發布對象是部門, 找出部門的成員
                        if (objectData.bl) {
                            $.each(groupAllMembers, function (id, member) {
                                objectData.bl.forEach(function (obj) {
                                    if (member.st > 0 && member.bl.indexOf(obj.bi) > -1) {
                                        targetUsers[id] = member;
                                    }
                                });
                            });
                        }
                        // 發布對象是成員 
                        if (objectData.gul) {
                            objectData.gul.forEach(function (obj) {
                                if (!targetUsers.hasOwnProperty(obj.gu) 
                                    && groupAllMembers.hasOwnProperty(obj.gu)) {
                                    targetUsers[obj.gu] = groupAllMembers[obj.gu];
                                }
                            });
                        }
                    } else { //發布對象是全部 
                        targetUsers = groupAllMembers;
                    }

                    if (isShowUnreadAndTime) {
                        list.push({title: $.i18n.getString("FEED_UNREAD"), ml: null});
                        list[1].ml = getUnreadUserList(targetUsers, parseData, this_gi);
                    } else {
                        list.push({title:$.i18n.getString("FEED_UNREAD"), clickable:false});
                    }
                    // if(isReady){
                    showObjectTabShow(this_gi, title, list, onDone);
                    // } else {
                    //     isReady = true;
                    // }
                } catch(e) {
                    errorReport(e);
                }
            });

            break;
        case 1:
            var isShowNamecard = true;
            try{
                var group = QmiGlobal.groups[this_gi];
                if( group.ntp === 2 && 1!=group.ad ){
                    isShowNamecard = false;
                }
            } catch(e){
                errorReport(e);
                return;
            }
            var epl = this_event.data("parti-like");
            if( null==epl || epl.length==0 ){
                cns.debug("null epl:", epl);
                return;
            }
            title = $.i18n.getString("FEED_LIKE")+"("+epl.length+")";
            list.push( {title:"",ml:epl} );
            if( list.length>0 ) showObjectTabShow(this_gi, title, list, onDone, isShowNamecard);
            break;
    }
}

timelineShowResponseLikeDelegate = function( this_event, type, onDone ){
    var list = [];
    var title = "";

    //(0=讀取, 1=按讚, 2=按X, 3=按訂閱, 4=按置頂, 7=按任務, 9 = 未讀取)
    // switch( type ){
    //     case 0:
    //         break;
    //     case 1:
            getThisTimelineResponsePart( this_event,type, function(data){
                if( data.status==200 ){
                    try{
                        var this_ei = this_event.data("event-id");
                        var this_gi = this_ei.split("_")[0];
                        
                        var obj = $.parseJSON( data.responseText );
                        list.push( {title:"",ml:obj.epl} );
                        title = $.i18n.getString("FEED_LIKE")+"("+obj.epl.length+")";
                        if( list.length>0 ) showObjectTabShow(this_gi, title, list, onDone);
                    } catch(e){
                        errorReport(e);
                    }
                }
            });
    //         break;
    // }
}

showObjectTabShow = function( giTmp, title, list, onDone, isShowNamecard ){
    var page = $("#page-tab-object");
    if( null== isShowNamecard ) isShowNamecard = true;

    //title
    page.find(".header-cp-object").html(title ? title : "");

    //tabs
    var length = list.length;
    var tabArea = page.find(".tabObj-tab-area");
    var cellArea = $("#page-tab-object .tabObj-cell-area");
    tabArea.html("");
    var width = (100.0/list.length)+"%";

    var cnt = 0;
    $.each( list, function(index, object){
        var tab = $("<div class='tab'></div>");
        tab.data("id", index);
        tab.data("obj", object);
        tab.css("width",width);
        var tmp = "<div>" + ((object.title&&object.title.length>0)?object.title:" ") +"</div>";
        tab.html( tmp );
        tab.data("clickable", (null==object.clickable)?true:(object.clickable) );
        tabArea.append(tab);
        cnt++;
    });

    if( cnt<=1 ){
        tabArea.hide();
        cellArea.addClass("noTitle");
    } else {
        tabArea.show();
        cellArea.removeClass("noTitle");
    }

    //generate page when click
    tabArea.next().html("");
    page.find(".tab").click(function() {
        var tab = $(this);

        if ( false==tab.data("clickable") ) {
            popupShowAdjust( $.i18n.getString("COMMON_PAID_FEATURE_TITLE"), $.i18n.getString("COMMON_PAID_FEATURE_CONTENT") );
            return;
        }

        $(window).scrollTop(0);
        $("body").addClass("user-info-adjust");
        setTimeout(function(){
            $("body").removeClass("user-info-adjust");
        }, 100);

        var index = tab.data("id");
        var cell = cellArea.find("._"+index);
        var listData = tab.data("obj").ml;
        var guAll = QmiGlobal.groups[giTmp].guAll;
        var bl = QmiGlobal.groups[giTmp].bl;


        $("#page-tab-object .tab").removeClass("current");
        tab.addClass("current");

        var makeMemberList = function () {
            var currentMembum = cellArea.find("._" + index + " .obj-cell").length;
            var loadMemList = listData.slice(currentMembum, currentMembum + 100);

            if (currentMembum + 100 > listData.length - 1)
                loadMemList = listData.slice(currentMembum);

            loadMemList.forEach(function (member) {
                var gu = member.gu;
                var rt = member.rt;
                var mem = guAll[gu];
                if(!mem) return;
                var this_obj = $(
                    '<div class="obj-cell mem" data-gu="'+gu+'">' +
                        '<div class="obj-cell-user-pic"><img src="images/common/others/empty_img_personal_xl.png" style="width:60px"/></div>' +
                        '<div class="obj-cell-time"></div>' +
                        '<div class="obj-cell-user-data">' + 
                            '<div class="obj-user-name">' + mem.nk.replaceOriEmojiCode() + '</div>' +
                            '<div class="obj-user-title"></div>' +
                    '</div>'
                );
                if( isShowNamecard ) this_obj.find(".obj-cell-user-pic").addClass("namecard").data("gi",giTmp);

                var branchID = mem.bl;
                var extraContent = "";  //mem.em;
                if( branchID && branchID.length > 0 ){
                    var branchPath = branchID.split(".");
                    if( branchPath && branchPath.length > 0 ){
                        branchID = branchPath[branchPath.length-1];
                        if( bl.hasOwnProperty(branchID) ){
                            extraContent = bl[branchID].bn;
                        }
                    }
                }
                if(extraContent && extraContent.length>0){
                    this_obj.find(".obj-cell-user-data").addClass("extra");
                    this_obj.find(".obj-user-title").html( extraContent );
                }

                var object_img = this_obj.find(".obj-cell-user-pic img");
                if(mem.aut) {
                    object_img.attr("src",mem.aut);
                    //object_img.removeAttr("style");
                    // avatarPos(object_img);
                }
                if( rt ) {
                    this_obj.find(".obj-cell-time").html( new Date(rt).toFormatString() );
                }
                this_obj.find(".obj-cell-user-pic.namecard").data("gu",mem.gu);

                this_obj.data("gu",mem.gu);
                this_obj.data("gu-name",mem.nk);
                cellArea.find("._"+index).append(this_obj);
            });
        }

        if( cell.length<=0 ){
            cell = $("<div class='obj-cell-page _"+index+"'></div>");
            cellArea.append( cell );

            makeMemberList();
        }
        
        page.find(".obj-cell-page.current").hide().removeClass("current");
        cell.show().addClass("current");

        page.find(".obj-cell-page.current").off("scroll").on("scroll", function (e) {
            var container = $(e.target);
            if (container.scrollTop() + container.height() > container[0].scrollHeight - 20) {
                if (container.find(" .obj-cell").length < listData.length) {
                    makeMemberList();
                }
            }
        });
    }); 
    tabArea.find(".tab:nth-child(1)").trigger("click");

    $.mobile.changePage("#page-tab-object", {transition: "slide"});
}

setDateTimePicker = function(this_compose){
    //設定現在時間
    var time = new Date();
    var time_format = time.customFormat( "#MM#月#DD#日,#CD#,#hhh#:#mm#" );
    var time_format_arr = time_format.split(",");
    this_compose.find(".cp-setdate-l .cp-setdate-date").html(time_format_arr[0]);
    this_compose.find(".cp-setdate-l .cp-setdate-week").html(time_format_arr[1]);
    this_compose.find(".cp-setdate-l .cp-setdate-time").html(time_format_arr[2]);

    //設定明天時間new Date().getTime() + 24 * 60 * 60 * 1000;
    var tomorrow_time = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
    var tomorrow_time_format = tomorrow_time.customFormat( "#MM#月#DD#日,#CD#,#hhh#:#mm#" );
    var tomorrow_time_format_arr = tomorrow_time_format.split(",");
    this_compose.find(".cp-setdate-r .cp-setdate-date").html(tomorrow_time_format_arr[0]);
    this_compose.find(".cp-setdate-r .cp-setdate-week").html(tomorrow_time_format_arr[1]);
    this_compose.find(".cp-setdate-r .cp-setdate-time").html(tomorrow_time_format_arr[2]);

    //現在時間預設為今天的unixtime * 1000
    var milliseconds = (new Date).getTime();
    var unixtime = Math.round(milliseconds/1000);       

    this_compose.data("start-timestamp",unixtime * 1000);

    //結束時間預設為明天的unixtime * 1000
    var tomorrow_milliseconds = (new Date).getTime() + 24 * 60 * 60 * 1000;
    var tomorrow_unixtime = Math.round(tomorrow_milliseconds/1000);     

    this_compose.data("end-timestamp",tomorrow_unixtime * 1000);

    //指定開始時間
    this_compose.find(".cp-setdate-chk").click(function(){
        var start_time_chk = this_compose.data("start-time-chk");

        //若是關閉開始時間 則將開始日期改為今天 以及 將結束時間的minDate設定為今天
        if(start_time_chk){
            $(this).find("img").attr("src","images/common/icon/icon_check_gray.png");
            $(this).find("span").removeClass("cp-start-time-text");

            this_compose.data("start-time-chk",false);

            //關閉開始時間 同時將開始日期改為今天

            //設定現在時間
            var time = new Date();
            var time_format = time.customFormat( "#MM#月#DD#日,#CD#,#hhh#:#mm#" );
            var time_format_arr = time_format.split(",");
            this_compose.find(".cp-setdate-l .cp-setdate-date").html(time_format_arr[0]);
            this_compose.find(".cp-setdate-l .cp-setdate-week").html(time_format_arr[1]);
            this_compose.find(".cp-setdate-l .cp-setdate-time").html(time_format_arr[2]);

            var start_input = this_compose.find("input.cp-datetimepicker-start");
            var end_input = this_compose.find("input.cp-datetimepicker-end");

            //現在時間的unixtime
            var milliseconds = (new Date).getTime();
            var unixtime = Math.round(milliseconds/1000);
            
            //設定 datetimepicker
            start_input.datetimepicker({
                minDate: 0,
                format:'unixtime',
                value: unixtime
            });

            //開始日期改為今天 記錄在this compose data
            this_compose.data("start-timestamp",unixtime * 1000);

            //設定 datetimepicker 前 先destroy 才不會錯亂
            var end_input_val = end_input.val()*1;

            end_input.datetimepicker("destroy");

            //初始化 datetimepicker
            this_compose.find("input.cp-datetimepicker-end").datetimepicker({
                minDate: 0  ,
                format:'unixtime',
                value:end_input_val,
                onChangeDateTime: function() {
                    onChangeDateTime(this_compose,"end");
                }
            });
        }else{
            //開啟開始時間
            $(this).find("img").attr("src","images/common/icon/icon_check_gray_check.png");
            $(this).find("span").addClass("cp-start-time-text");

            this_compose.data("start-time-chk",true);
        }

        this_compose.find(".cp-setdate-l-2 .cp-setdate-start-text").toggle();
        this_compose.find(".cp-setdate-l-2 .cp-setdate-content").toggle();
        
    });

    //初始化 datetimepicker
    this_compose.find("input.cp-datetimepicker-start").datetimepicker({
        minDate: 0  ,
        format:'unixtime',
        onChangeDateTime: function() {
            onChangeDateTime(this_compose,"start");
        }
    });
    //初始化 datetimepicker
    this_compose.find("input.cp-datetimepicker-end").datetimepicker({
        startDate:'+1970/01/01',
        minDate:'-1969/12/31'  ,
        // minTime: (new Date().getHours()+1)+':00:00',
        format:'unixtime',
        onChangeDateTime: function() {
            onChangeDateTime(this_compose,"end");
        }
    });

    //點擊開啟 datetimepicker
    this_compose.find(".cp-setdate-l").click(function(){
        var start_time_chk = this_compose.data("start-time-chk");
        if(!start_time_chk) return false;
        this_compose.find("input.cp-datetimepicker-start").datetimepicker("show");
    });

    //點擊開啟 datetimepicker
    this_compose.find(".cp-setdate-r").click(function(){
        this_compose.find("input.cp-datetimepicker-end").datetimepicker("show");
    });
}

onChangeDateTime = function(this_compose,type){
    var this_input = this_compose.find("input.cp-datetimepicker-" + type);

    //未選時間 就跳出
    if(!this_input.val()) return false;

    var time = new Date(this_input.val()*1000);
    var time_format = time.customFormat( "#MM#月#DD#日,#CD#,#hhh#:00" );
    var time_format_arr = time_format.split(",");

    if(type == "start"){
        //記錄在thit_compose data
        this_compose.data("start-timestamp",this_input.val()*1000);

        //如果開始時間大於結束時間 就將結束時間改為開始時間
        var timestamp_start = this_input.val()*1;
        var end_input = this_compose.find("input.cp-datetimepicker-end");
        var timestamp_end = end_input.val()*1;
        if(timestamp_start > timestamp_end){
            //因為更改到結束時間 所以也要記錄在this_compose data中
            this_compose.data("end-timestamp",this_input.val()*1000);               

            //設定 datetimepicker 前 先destroy 結果還是錯亂 
            end_input.datetimepicker({
                minDate: time.customFormat( "#YYYY#/#M#/#D#" ),
                value: timestamp_start
            });

            this_compose.find(".cp-setdate-r .cp-setdate-date").html(time_format_arr[0]);
            this_compose.find(".cp-setdate-r .cp-setdate-week").html(time_format_arr[1]);
            this_compose.find(".cp-setdate-r .cp-setdate-time").html(time_format_arr[2]);

        }

        //更改結束時間的mindate為開始時間
        end_input.datetimepicker({
            minDate: time.customFormat( "#YYYY#/#M#/#D#" )
        });

        var target = this_compose.find(".cp-setdate-l");
    }else{

        //記錄在this_compose data
        this_compose.data("end-timestamp",this_input.val()*1000);   

        var target = this_compose.find(".cp-setdate-r");
    }
    
    target.find(".cp-setdate-date").html(time_format_arr[0]);
    target.find(".cp-setdate-week").html(time_format_arr[1]);
    target.find(".cp-setdate-time").html(time_format_arr[2]);
}



composeWorkEvent = function(this_compose){
    var this_work_area = this_compose.find(".cp-work-area");
    this_work_area.find('.cp-work-item textarea').autosize({append: "\n"});
    this_work_area.find('.cp-work-item textarea').attr("placeholder",$.i18n.getString("COMPOSE_TASK_DESC_EMPTY") );

    this_work_area.find(".cp-work-add-item").click(function(){
        var this_work_index = this_compose.find(".cp-work-item").length;
        var this_work = $(
            '<div class="cp-work-item" data-work-index="' + this_work_index + '">' +
                '<img src="images/common/icon/icon_compose_close.png"/>' +
                '<span>' + (this_work_index+1) + '</span>' +
                '<textarea class="cp-opt-textarea textarea-animated cp-work-empty-chk" placeholder="" data-role="none"></textarea>' +
                '<div class="cp-work-item-object">' +
                    '<span>分派對象</span>' +
                    '<img src="images/ap_box_arrow.png"/>' +
                '</div>' +
            '</div>'
        );

        $(this).before(this_work);
        this_work.find('textarea').autosize({append: "\n"});
        this_work.find('textarea').attr("placeholder",$.i18n.getString("COMPOSE_TASK_DESC_EMPTY"));

        //增加就是要秀出刪除按鈕
        this_work_area.find(".cp-work-item > img").show();
    });

    $(document).on("click",".cp-work-item > img",function(){

        $(this).parent().hide("fast",function(){

            $(this).remove();
            var work_item_cnt = this_compose.find(".cp-work-item").length;
            //剩下兩題就關閉刪除按鈕
            if(work_item_cnt <= 1){
                this_work_area.find(".cp-work-item > img").hide();
            }

            for(i=0;i<work_item_cnt;i++){
                this_work_area.find(".cp-work-item:eq(" + i + ") > span").html(i+1);
                this_work_area.find(".cp-work-item:eq(" + i + ")").attr("data-work-index",i);
            }
        });
        
    });

}

composeVoteQuesMake = function(this_compose){
    
    //讀取投票題目
    this_compose.find('.cp-vote-area').append($('<div>').load('layout/compose.html .cp-vote-ques-area',function(){
        var this_ques = $(this).find('.cp-vote-ques-area');
        this_ques._i18n();

        //設定
        //投票題目數加一
        var ques_total = this_compose.data("ques-total");
        ques_total += 1;
        this_compose.data("ques-total",ques_total);

        //投票題目超過1 就增加刪除符號
        if(ques_total > 1){
            this_compose.find(".cp-vote-ques-title img:eq(0)").show();
            this_ques.find(".cp-vote-ques-title img:eq(0)").show();
        }

        //題目編號
        this_ques.find(".cp-vote-ques-title span").html(ques_total);

        //初始值是2個投票項目
        this_ques.data("opt-total",2);

        //可投票數
        this_ques.data("vote-count",1);

        //做投票項目的刪除圖案的記號
        this_ques.data("opts-delete",false);
        
        //主題的筆消失
        this_ques.find(".cp-vq-textarea-title").bind("input",function(){
            if($(this).val()){
                this_ques.find(".cp-vote-ques-title img:eq(1)").css("opacity",0);
            }else{
                this_ques.find(".cp-vote-ques-title img:eq(1)").css("opacity",1);
            }
        });
        
        this_ques.find('textarea').autosize({append: "\n"});



        //新增一個投票項目
        this_ques.find(".cp-vote-add-opt").click(function(){

            var opt_total = this_ques.data("opt-total");
            cns.debug("opt total:",this_ques.data("opt-total"));

            opt_total += 1;
            //存回
            this_ques.data("opt-total",opt_total);
            $(this).before(
                '<div class="cp-vote-opt cp-new-opt-' + opt_total + ' ">' +
                    '<img src="images/common/icon/icon_compose_close.png" style="display:block"/>' +
                    '<span>' + opt_total + '</span>' +
                    '<textarea class="cp-opt-textarea textarea-animated cp-vote-empty-chk" placeholder="投票項目" data-role="none"></textarea>' +
                '</div>'
            );

            if(!this_ques.data("opts-delete")){
                this_ques.find(".cp-vote-opt img").show();
                this_ques.data("opts-delete",true);
            }

            this_ques.find('.cp-new-opt-' + opt_total + ' textarea').autosize({append: "\n"})
        });

        

        //刪除題目
        this_ques.find(".cp-vote-ques-title img:eq(0)").click(function(){

            //投票題目數減一
            var ques_total = this_compose.data("ques-total");

            //最低限度是1 基本上不會用到這個 因為1 的話會沒有圖給user按
            if(ques_total == 1) return false;

            ques_total -= 1;

            //存回
            this_compose.data("ques-total",ques_total);

            //刪除題目
            this_ques.hide("slow", function(){ 

                $(this).remove();
                    //重新編號
                this_compose.find(".cp-vote-ques-area").each(function(i,val){
                    $(this).find(".cp-vote-ques-title span").html(i+1);
                });
            });

            //刪除後等於1 關閉按鈕
            if(ques_total == 1){
                this_compose.find(".cp-vote-ques-title img:eq(0)").hide()
            }
        });

    }));
}

composeVoteEvent = function(this_compose){
    //選擇投票類型
    this_compose.find(".cp-vote-type").click(function(){
        this_compose.find(".cp-vote-type").data("chk",false);
        this_compose.find(".cp-vote-type .tick img").attr("src","images/common/icon/icon_check_gray.png");

        $(this).data("chk",true);
        $(this).find(".tick img").attr("src","images/common/icon/icon_check_gray_check.png");

        this_compose.data("vote-type",$(this).data("vote-type"));
    });

    //刪除一個投票項目
    $(document).off("click",".cp-vote-opt img").on("click",".cp-vote-opt img",function(){
        var this_ques = $(this).parents(".cp-vote-ques-area");
        var this_opt = $(this).parent();

        var opt_total = this_ques.data("opt-total");
        opt_total -= 1;

        //存回
        this_ques.data("opt-total",opt_total);

        this_opt.hide("slow", function(){ 

            $(this).remove();

            for(i=0;i<opt_total;i++){
                this_ques.find(".cp-vote-opt:eq(" + i + ") span").html(i+1);
            }
            
        });

        //連動影響最高可投票數
        var vote_count = this_ques.data("vote-count");
        if(vote_count >= opt_total ){
            vote_count = opt_total-1;

            this_ques.find(".cp-vote-count div:eq(0)").html(vote_count);
            //存回
            this_ques.data("vote-count",vote_count);
        }

        //等於2表示回到最低值 關閉刪除選項
        if(opt_total == 2){
            this_ques.find(".cp-vote-opt img").hide();
            this_ques.data("opts-delete",false);
            return false;
        }
        
    });
    cns.debug("go");
    //可投票數加減1
    $(document).off("click",".cp-vote-pm").on("click",".cp-vote-pm",function(){

        var this_ques = $(this).parents(".cp-vote-ques-area");
        var vote_count = this_ques.data("vote-count");
        var this_btn = $(this);

        if(this_btn.hasClass("cp-vote-minus")){
            //最小數為1
            if(vote_count == 1) return false;

            vote_count -= 1;

            var pm_str = "minus";
        }else{
            //最大數是選項數-1
            var opt_total = this_ques.data("opt-total");
            opt_total -= 1;

            if(vote_count == opt_total) return false;

            vote_count += 1;

            var pm_str = "plus";
        }
            
        var img_clk = "images/compose/vote/compose_post_vote_bt_" + pm_str;

        this_btn.find("img").attr("src",img_clk + "_click.png");
        setTimeout(function(){
            this_btn.find("img").attr("src",img_clk + ".png");
        },100);

        //存回
        this_ques.data("vote-count",vote_count);
        this_ques.find(".cp-vote-count div:eq(0)").html(vote_count);

    });


    //新增題目
    this_compose.find(".cp-vote-add-ques").click(function(){
        composeVoteQuesMake(this_compose);
    });

}

composeVoteObjMake = function(this_compose,body){

    //檢查項目使否都有填寫
    var empty_chk = false;
    this_compose.find(".cp-vote-empty-chk").each(function(){
        if(!$(this).val()){
            empty_chk = true;
            return false;
        }
    });
    //有空值 跳出
    if(empty_chk) return true;


    var ml_obj = {
        "li" : [],
        "b": this_compose.data("start-timestamp"),
        "e": this_compose.data("end-timestamp"),
        "tp": 14,
        "lv": this_compose.data("vote-type")
    }

    //投票題目數
    var ques_total = this_compose.data("ques-total");
    
    this_compose.find(".cp-vote-ques-area").each(function(){
        var this_ques = $(this);

        //可投票數 
        var vote_count = this_ques.data("vote-count");
        //投票題目obj
        var ques_obj = {
          "k": this_ques.find(".cp-vote-ques-title span").html()*1-1,
          "t": this_ques.find("textarea").val(),
          "v": this_ques.data("vote-count"),
          "i": []
        };
        //每個投票選項
        this_ques.find(".cp-vote-opt").each(function(){
            var this_opt = $(this);
            //投票選項obj
            var opt_obj = {
                "k": this_opt.find("span").html()*1-1,
                "o": this_opt.find(".cp-opt-textarea").val()
            };

            ques_obj.i.push(opt_obj);
        });

        ml_obj.li.push(ques_obj);
    });
    body.ml.push(ml_obj);
}

/*

######   #######  ##     ## ########   #######   ######  ########        ######  ######## ##    ## ########  
##    ## ##     ## ###   ### ##     ## ##     ## ##    ## ##             ##    ## ##       ###   ## ##     ## 
##       ##     ## #### #### ##     ## ##     ## ##       ##             ##       ##       ####  ## ##     ## 
##       ##     ## ## ### ## ########  ##     ##  ######  ######          ######  ######   ## ## ## ##     ## 
##       ##     ## ##     ## ##        ##     ##       ## ##                   ## ##       ##  #### ##     ## 
##    ## ##     ## ##     ## ##        ##     ## ##    ## ##             ##    ## ##       ##   ### ##     ## 
######   #######  ##     ## ##         #######   ######  ########        ######  ######## ##    ## ########  


*/

composeSend = function (this_compose){
    
    var ctp = this_compose.data("compose-tp");
    var composeContent = this_compose.data("compose-content").replace(/<br\s*\/?>/g,"\n");
    var tagMembers = this_compose.find(".cp-content-highlight").data("markMembers");
    var ml = this_compose.data("message-list").unique();
    var tmpElement = document.createElement("div");
    var body = {
            meta : {
                lv : 1,
                tp : "0" + ctp
            },
            ml : []
        };
    
    //欄位是否填寫 檢查
    var empty_chk = false;
    var empty_msg;


    if (Object.keys(tagMembers).length) {
        for (var tagID in tagMembers) {
            body.ml.push({
                "u": tagID,
                "n": tagMembers[tagID].nk,
                "tp": 21
            });
            composeContent = composeContent.replace('<mark id="' + tagID + '" name="' 
                + tagMembers[tagID].nk + '">' + tagMembers[tagID].nk + "</mark>", "///;" 
                + tagID + ";///");
        }
    
    }

    tmpElement.innerHTML = composeContent;

    //任務 投票之類的 因為是可預測的 又是單一的ml 就在這邊處理
    switch(ctp){
        //普通貼文
        case 0:
            break;
        //公告
        case 1:
            body.meta.tt = this_compose.data("compose-title");

            //公告置頂
            if(this_compose.data("cp-top")){
                body.meta.top = true;
            }

            break;
        //通報
        case 2:
            body.meta.tt = this_compose.data("compose-title");
            break;
        //任務 工作
        case 3:
            //發佈對象
            var obj_arr = [];
            var gul_arr = [];
            //設定標題
            body.meta.tt = this_compose.data("compose-title");

            this_compose.find(".cp-work-item-object").each(function(i,val){
                var this_work = $(this).parent();
                var parsed_obj = {};
                if($(this).data("object_str")){
                    parsed_obj = $.parseJSON($(this).data("object_str"));
                }

                //分派對象檢查
                if(!$(this).data("object_str") || Object.keys(parsed_obj).length == 0){
                    empty_chk = true;
                    empty_msg = $.i18n.getString("COMPOSE_TASK_OWNER_EMPTY");
                    return false;
                }

                //工作內容檢查
                if(!this_work.find("textarea").val()){
                    empty_chk = true;
                    empty_msg = $.i18n.getString("COMPOSE_TASK_DESC_EMPTY");
                    return false;
                }

                var temp_obj = {//
                    u:Object.keys(parsed_obj).join(','),
                    k:this_work.data("work-index"),
                    d:this_work.find("textarea").val()
                };

                obj_arr.push(temp_obj);

                $.each(parsed_obj,function(i,val){
                    var temp_obj = {
                        gu : i,
                        n : val
                    };
                    gul_arr.push(temp_obj);
                });
            });

            var me_gu_obj = {
                gu : gu,
                n : QmiGlobal.groups[gi].guAll[gu].nk
            };
            gul_arr.push(me_gu_obj);

            body.meta.tu = {
                gul : gul_arr
            };

            if(empty_chk) break;
            
            var ml_obj = {
                li : [],
                b : this_compose.data("start-timestamp"),
                e : this_compose.data("end-timestamp"),
                tp : 12
            }
            ml_obj.li = obj_arr;
            body.ml.push(ml_obj);

            break;
        //任務 投票
        case 4:
            body.meta.tt = this_compose.data("compose-title");
            empty_chk = composeVoteObjMake(this_compose,body);

            empty_msg = $.i18n.getString("COMPOSE_VOTE_EMPTY");
            /* ----- TODO --------
            依照空的欄位回應相對的警告訊息(eg.no title/ no option, etc.)
            ----------------------*/
            break;
        //任務 定點回報
        case 5:
            body.meta.tt = this_compose.data("compose-title");
            var ml_obj = {
                b : this_compose.data("start-timestamp"),
                e : this_compose.data("end-timestamp"),
                li: lang,
                lng: 0,
                lat: 0,
                r: 0,
                b : this_compose.data("start-timestamp"),
                e : this_compose.data("end-timestamp"),
                tp: 17
            }
            body.ml.push(ml_obj);
            break;
    }

    //加入發佈對象 工作需要特別處理
    if(ctp != 3){
        //空值表示 發佈全體

        var tu = {};
        if(this_compose.data("object_str")){
            var object_obj = $.parseJSON(this_compose.data("object_str"));
            if(Object.keys(object_obj).length){
                var gul_arr = [];
                $.each(object_obj,function(i,val){
                    var temp_obj = {
                        gu : i,
                        n : val
                    };
                    gul_arr.push(temp_obj);
                });
                tu.gul=gul_arr;
            }
        }
        //branch
        if(this_compose.data("branch_str")){
            var object_obj = $.parseJSON(this_compose.data("branch_str"));
            if(Object.keys(object_obj).length){
                var bl_arr = [];
                $.each(object_obj,function(i,val){
                    var temp_obj = {
                        bi : i,
                        bn : val
                    };
                    bl_arr.push(temp_obj);
                });
                tu.bl=bl_arr;
            }
        }
        //fbl
        if(this_compose.data("favorite_str")){
            var object_obj = $.parseJSON(this_compose.data("favorite_str"));
            if(Object.keys(object_obj).length){
                tu.fl=Object.keys(object_obj);
            }
        }

        body.meta.tu = {
            gul : gul_arr
        };
        if( Object.keys(tu).length>0 ){
            body.meta.tu = tu;
        } else{
            delete body.meta.tu;    
        }
    }
    
    //有空值就跳出
    if(empty_chk) { 
        popupShowAdjust("",empty_msg,true);
        return false;
    }
    

    // 內容狀態 會有很多ml內容組成

    // 若有副件要上傳取得permission id
    var isWaitingPermission = false; //(this_compose.data("object_str") || this_compose.data("branch_str") );
    var sendingFileData = [];

    // 檔案上傳 統一處理
    var uploadDefArr = [];
    var uploadAllDoneDef = $.Deferred();
    var uploadUrl = "groups/" + gi + "/files";
    var uploadTotalCnt = 0;
    var composeProgressBar = new ProgressBarCntr(function() {
        var self = this;
        if(self.filesCnt.get() === 0) return;

        $("#compose-progressbar").remove();
        self.barDom.set($("<section>", {
            id: "compose-progressbar",
            style: "display: block",
            html: "<div class='container'><div class='title'>"+ $.i18n.getString("FILESHARING_UPLOADING") +"</div><div class='bar'></div>" + 
                    "<button>"+ $.i18n.getString("COMMON_CANCEL") +"</button>" + 
                    "<div class='cnt'><span class='curr' num='0'></span> / <span class='total'>"+ uploadTotalCnt +"</span></div></div>"
        }));


        $("body").append(self.barDom.get());

        self.barDom.get().find("button").click(function() {
            uploadDefArr.forEach(function(item) {
                item.reject();
            })
        })
    });

    composeProgressBar.onChange = function(pct) {
        var self = composeProgressBar;
        self.barDom.get().find(".bar").css("width", (Math.floor((pct || 0)*(100-self.basePct.get())/100)+self.basePct.get()-1.5)+"%");
    };
    
    var isVdoExist = false;

    //貼文內容的類型 網址 附檔之類的 
    $.each(ml,function(i,mtp){
        var obj = {tp:mtp};
        var is_push = true;
        switch(mtp){
            //普通貼文
            case 0:
                obj.c = tmpElement.textContent;

                is_push = false;
                body.ml.unshift(obj);

                break;
            //一般網站url
            case 1:
                var url_content = this_compose.data("url-content");
                obj.c = url_content.url
                obj.t = url_content.title;
                obj.d = url_content.description;
                obj.i = url_content.img;
                break;
            //影片網站url
            case 2:
                var url_content = this_compose.data("url-content");
                obj.c = url_content.url
                obj.t = url_content.title;
                obj.d = url_content.description;
                obj.i = url_content.img;
                break;
            //圖片url
            case 3:
                break;
            //影片url
            case 4:
                break;
            //貼圖
            case 5:
                var sticker = this_compose.data("stickerID");
                if(sticker){
                    obj.c = sticker;
                } else {
                    is_push = false;
                }
                break;
            // 圖檔
            case 6:
                is_push = false;

                //浮水印
                if(this_compose.data("cp-watermark")){
                    var ml_obj = {
                        wm: 1,
                        ar: -1,
                        tp: 27
                    }
                    body.ml.push(ml_obj);
                }

                Object.keys(this_compose.data("upload-obj") || {}).forEach(function(key) {
                    uploadTotalCnt++;

                    var tmpDef = $.Deferred();
                    uploadDefArr.push(tmpDef);
                    qmiUploadFile({
                        urlAjax: {
                            apiName: uploadUrl,
                            method: "post",
                            body: {
                                tp: 1,
                                ti: ti_feed,
                                pi: 0
                            }
                        },
                        tp: 1,
                        hasFi: true,
                        file: this_compose.data("upload-obj")[key].elem,
                        fileName: this_compose.data("upload-obj")[key].file.name,
                        oriObj: {w: 1280, h: 1280, s: 0.7},
                        tmbObj: {w: 480, h: 480, s: 0.6},
                        progressBar: composeProgressBar
                    }).done(function(resObj) {
                        composeProgressBar.add();
                        tmpDef.resolve(resObj);

                        if(resObj.isSuccess === false) return;

                        body.ml.push({
                            c: resObj.data.fi,
                            p: 0,
                            tp: 6
                        });
                    });
                });
                    
                break;
            // 影片
            case 7:
                is_push = false;
                isVdoExist = true;
                Object.keys(this_compose.data("upload-video") || {}).forEach(function(key) {
                    uploadTotalCnt++;

                    var tmpDef = $.Deferred();
                    uploadDefArr.push(tmpDef);
                    qmiUploadFile({
                        urlAjax: {
                            apiName: uploadUrl,
                            method: "post",
                            body: {
                                tp: 2,
                                ti: ti_feed,
                                pi: 0
                            }
                        },
                        tp: 2,
                        hasFi: true,
                        file: this_compose.data("upload-video")[key],
                        fileName: this_compose.data("upload-video")[key].name,
                        oriObj: {w: 1280, h: 1280, s: 0.9},
                        setAbortFfmpegCmdEvent : function (ffmpegCmd) {
                            $("#compose-progressbar button").off("click").on("click", function(e) {
                                ffmpegCmd.kill();
                                composeProgressBar.close();
                            });
                        },
                        progressBar: composeProgressBar,
                    }).done(function(resObj) {
                        composeProgressBar.add();
                        tmpDef.resolve(resObj);

                        if(resObj.isSuccess === false) return;

                        body.ml.push({
                            c: resObj.data.fi,
                            p: 0,
                            tp: 7
                        });
                    });
                });
                    
                break;
            case 26:
                is_push = false;
                // 檔案上傳
                Object.keys(this_compose.data("upload-file") || {}).forEach(function(key) {
                    uploadTotalCnt++;

                    var tmpDef = $.Deferred();
                    uploadDefArr.push(tmpDef);
                    qmiUploadFile({
                        urlAjax: {
                            apiName: uploadUrl,
                            method: "post",
                            body: {
                                tp: 0,
                                ti: ti_feed,
                                pi: 0
                            }
                        },
                        tp: 0,
                        hasFi: true,
                        file: this_compose.data("upload-file")[key],
                        fileName: this_compose.data("upload-file")[key].name,
                        oriObj: {w: 1280, h: 1280, s: 0.9},
                        progressBar: composeProgressBar
                    }).done(function(resObj) {
                        composeProgressBar.add();
                        tmpDef.resolve(resObj);

                        if(resObj.isSuccess === true) {
                            body.ml.push({
                                ftp: 0,
                                fi: resObj.data.fi,
                                fn: resObj.data.file.name,
                                si: resObj.data.file.size,
                                tp: 26
                            });
                        }
                    });
                });
                break;
        }

        //會有順序問題 因為ios只會照ml順序排 所以必須設定順序
        if(is_push) body.ml.push(obj);
    });
    
    composeProgressBar.filesCnt.set(uploadTotalCnt);
    if(!isVdoExist) composeProgressBar.vdoCompressDefer.resolve(false);

    // 進度條
    composeProgressBar.init();

    $.when.apply($, uploadDefArr).done(function() {
        // 有一個失敗就不傳
        var errFileNameArr = [];
        Array.prototype.forEach.call(arguments, function(resObj) {
            if(resObj.isSuccess === false) errFileNameArr.push(resObj.errFileName)
        });

        setTimeout(function() {
            composeProgressBar.close(); 
            if(errFileNameArr.length > 0) {
                new QmiGlobal.popup({
                    title: $.i18n.getString("COMMON_UPLOAD_FAIL"),
                    desc: errFileNameArr.slice(0,2).join("<br/>"),
                    confirm: true
                })
                return;
            }

            composeSendApi(body);
        }, 1000);
    // 取消
    }).fail(function() {
        composeProgressBar.close();
    })

    
}


composeSendApi = function(body){
    var api_name = "groups/" + gi + "/timelines/" + ti_feed + "/events";

    var headers = {
             "ui":ui,
             "at":at, 
             "li":lang,
                 };

    var method = "post";
    var result = ajaxDo(api_name,headers,method,true,body);
    result.complete(function(data){

        if(data.status == 200){
            $.mobile.changePage("#page-group-main");

            //檢查置頂
            topEventChk();
            timelineSwitch( $("#page-group-main").data("currentAct") || "feeds");
            toastShow( $.i18n.getString("COMPOSE_POST_SUCCESSED") );
        }else{
            setTimeout(function(){
                $(document).find(".cp-content").data("send-chk",true);
            }, 2000);
        }
    });
};

composeCheckMessageList = function(){
    var this_compose = $(document).find(".cp-content");
    //圖檔刪光了 而且附檔區域沒有其他東西 就關閉附檔區域
    var chk = false;
    var dataList = this_compose.data("message-list");
    if( null==dataList ) return;
    // cns.debug( JSON.stringify(dataList) );
    $.each(dataList,function(i,val){
        //只要有不是普通內文的就不關附檔區
        if( val > 0){
            chk = true;
            return false;
        }
    });

    if(!chk){
        this_compose.find(".cp-attach-area").fadeOut();
    }
}
/*


###          ##    ###    ##     ##       ########   #######  
## ##         ##   ## ##    ##   ##        ##     ## ##     ## 
##   ##        ##  ##   ##    ## ##         ##     ## ##     ## 
##     ##       ## ##     ##    ###          ##     ## ##     ## 
######### ##    ## #########   ## ##         ##     ## ##     ## 
##     ## ##    ## ##     ##  ##   ##        ##     ## ##     ## 
##     ##  ######  ##     ## ##     ##       ########   #######  


*/

setSidemenuHeader = function (new_gi){
    
    //左側選單主題區域
    var this_gi = new_gi || gi;
    var pic_num = this_gi.substring(this_gi.length-1,this_gi.length).charCodeAt()%10;
    $(".sm-header").css("background","url(images/common/cover/sidemeun_cover0" + pic_num + ".png)")

    var _groupList = QmiGlobal.groups;

    $(".sm-group-pic").css("background","url(" + _groupList[this_gi].aut + ")").stop().animate({
        opacity:1
    },1000);
    // $(".sm-group-name").html(_groupList[this_gi].gn);
}

groupMenuListArea = function (noApi){
    var noApiDeferred = $.Deferred();
    var deferred = $.Deferred();

    if(noApi) noApiDeferred.resolve();
    else getGroupList().done(noApiDeferred.resolve);

    noApiDeferred.done(function(data){
        //管理者圖示
        var icon_host = "<img src='images/sidemenu/icon_host.png'/>",
            listArea = $(".sm-group-list-area").html("");
            listArea.append($('<div class="sm-hr sm-general-group">'+$.i18n.getString("GENERAL_GROUP")+'</div>'));
            listArea.append($('<div class="sm-hr sm-offical-group">'+$.i18n.getString("OFFICAL_GROUP")+'</div>'));
            listArea.append($('<div class="sm-footer"></div>'));
        $.each(QmiGlobal.groups, addSideMenuGroupUI.bind(listArea));

        if(Object.keys( QmiGlobal.groups ).length > 2) $(".sm-group-switch").show();

        if (Object.keys( QmiGlobal.groups ).length == 1) {
            $(".no-group-lock").hide();
            $.mobile.changePage("#page-group-main");

            $("#page-group-menu .page-back").show();

            setGroupInitial(Object.keys(QmiGlobal.groups)[0], true);
        }   

        // 判斷無官方帳號團體就關閉標題
        (function() {
            var hasOfficialGroup = false;
            Object.keys(QmiGlobal.groups).forEach(function(tempGi) {
                if(QmiGlobal.groups[tempGi].ntp === 2) hasOfficialGroup = true;
            });
            if(!hasOfficialGroup) listArea.find(".sm-offical-group").hide();
        }())
        
        //設定調整團體頭像
        $(document).data("group-avatar",true);

        deferred.resolve({ status: true });
    });   
    
    return deferred.promise();
}


addSideMenuGroupUI = function(key,groupObj){
    var listArea = this,
        glt_img = "images/common/others/empty_img_all_l.png",
        glo_img = "images/common/others/empty_img_all_l.png";

    if(groupObj.aut) {
        glt_img = groupObj.aut;
        glo_img = groupObj.auo;
    }

    var data_gi_str = 'data-gi="' + groupObj.gi + '" ';
    var this_group = $(
        '<div class="sm-group-area polling-cnt enable" ' + data_gi_str + ' data-polling-cnt="A5" data-gu="' + groupObj.me + '">' +
            '<img class="sm-icon-host" src="images/icon/icon_admin.png"/>' +
            '<div class="sm-group-area-l group-pic">' +
                '<img class="aut polling-group-pic-t" src="' + glt_img + '" ' + data_gi_str + '>' +
            '</div>' +
            '<div class="sm-group-area-r polling-group-name sm-group-content-style" '+ data_gi_str+'>' + 
            '   <div>' + groupObj.gn._escape() + '</div>' + 
            '   <div>' + $.i18n.getString("COMPOSE_N_MEMBERS", groupObj.cnt ) + '</div>' + 
            '</div>' +
            '<div class="sm-count" style="display:none"></div>' +
            '<span class="auth-lock-text">認證過期</span>' +
        '</div>'
    );

    this_group.find(".group-pic").data("auo",glo_img);
    //判斷官方團體一般團體
    if(groupObj.ntp === 2)
        $(".sm-footer").before(this_group);
    else
        $(".sm-offical-group").before(this_group);

    //管理者圖示
    if(groupObj.ad != 1) this_group.find(".sm-icon-host").hide();
}

permissionControl = function(group_list){
    //目前已知是開啓公告和團體中 邀請成員的功能
    $(".fc-area-subbox[data-fc-box=announcement]").hide();

    $.each(group_list,function(i,val){
        if(val.gi == gi){

            switch(val.ad){
                //看不到任何成員，只看得到管理者
                case 0:
                    break;
                //擁有管理團體的權限
                case 1:
                    //目前已知是開啓公告和團體中 邀請成員的功能
                    $(".fc-area-subbox[data-fc-box=announcement]").show();
                    break;

                //可以看到整個團體的成員
                case 2:
                    break;

                //可以看到使用者該層及下層成員
                case 3:
                    break;
                //僅能看到使用者該層成員
                case 4:
                    break;
            }
        }
    });
}

/*


######## ##     ## ##    ##  ######  ######## ####  #######  ##    ##        ##  
##       ##     ## ###   ## ##    ##    ##     ##  ##     ## ###   ##       #### 
##       ##     ## ####  ## ##          ##     ##  ##     ## ####  ##        ##  
######   ##     ## ## ## ## ##          ##     ##  ##     ## ## ## ##            
##       ##     ## ##  #### ##          ##     ##  ##     ## ##  ####        ##  
##       ##     ## ##   ### ##    ##    ##     ##  ##     ## ##   ###       #### 
##        #######  ##    ##  ######     ##    ####  #######  ##    ##        ##  




######## #### ##     ## ######## ##       #### ##    ## ########       ##       ####  ######  ######## 
##     ##  ###   ### ##       ##        ##  ###   ## ##             ##        ##  ##    ##    ##    
##     ##  #### #### ##       ##        ##  ####  ## ##             ##        ##  ##          ##    
##     ##  ## ### ## ######   ##        ##  ## ## ## ######         ##        ##   ######     ##    
##     ##  ##     ## ##       ##        ##  ##  #### ##             ##        ##        ##    ##    
##     ##  ##     ## ##       ##        ##  ##   ### ##             ##        ##  ##    ##    ##    
##    #### ##     ## ######## ######## #### ##    ## ########       ######## ####  ######     ##    

*/  

//動態消息列表
//先從資料庫拉資料 另外也同時從server拉資料存資料庫 再重寫
idbPutTimelineEvent = function (ct_timer,is_top,polling_arr){
    var 
    polling_arr = polling_arr || [],
    this_gi = polling_arr[0] || gi,
    this_ti = polling_arr[1] || ti_feed,
    main_gu = $("#page-group-main").data("main-gu"),

    deferred = $.Deferred();
    if(main_gu){
        this_gi = $("#page-group-main").data("main-gi");
        this_ti = QmiGlobal.groups[this_gi].ti_feed;
    }

    var event_tp = $("#page-group-main").data("navi") || "00";
    //製作timeline
    var api_name = "groups/"+ this_gi +"/timelines/"+ this_ti +"/events";
    if(ct_timer){
        api_name = api_name + "?ct=" + ct_timer;
    }

    if(main_gu){
        // event_tp = "00";
        if(api_name.match(/\?/)){
            api_name = api_name + "&gu=" + main_gu;
        }else{
            api_name = api_name + "?gu=" + main_gu;
        }
    }

    var headers = {
            ui:ui,
            at:at, 
            li:lang,
            tp: ("0" + event_tp).slice(-2)
    };
    var method = "get";
    var result = ajaxDo(api_name,headers,method,false);
    result.complete(function(data){
        var feedboxAreaBottom = $(".st-feedbox-area-bottom");
        
        //---------- TODO -----------
        //  隱藏底部更新ui
        //---------------------------
        //更新時間
        timelineUpdateTime();

        if(data.status != 200){
            deferred.resolve({
                desc:"http statusCode: "+ data.status,
                status: false,
                others: data
            });

            // groupSwitchEnable();
            return false;
        }

        var timeline_list = $.parseJSON(data.responseText).el;
        //沒資料 後面就什麼都不用了
        if( timeline_list.length == 0 ) {
            $(".feed-subarea[data-feed=" + event_tp + "]").addClass("no-data");
            //開啟更換團體
            // groupSwitchEnable();
            //關閉timeline loading 開啟沒資料圖示
            setTimeout(function(){
                feedboxAreaBottom.children("img").hide();
                feedboxAreaBottom.children("div").show();
            },2000);

            deferred.resolve({
                desc:"no events",
                status: true
            });

            
        } else {
            //transform gi to private gi
            for( var i=0; i<timeline_list.length; i++ ){
                //ei:"G000000109N_T00000020BF_E000000107H"
                var split = timeline_list[i].ei.split("_");
                split[0] = this_gi;
                timeline_list[i].ei = split.join("_");
            }

            if(main_gu){

                //資料個數少於這個數量 表示沒東西了
                if(timeline_list.length < 10){
                    //沒資料的確認 加入no data 
                    $(".feed-subarea[data-feed=" + event_tp + "]").addClass("no-data");
                    //關閉timeline loading 開啟沒資料圖示
                    setTimeout(function(){
                        $(".st-feedbox-area-bottom > img").hide();
                        $(".st-feedbox-area-bottom > div").show();
                    },2000);
                }
                else{
                    //開啟timeline loading 關閉沒資料圖示 下拉更新除外
                    $(".st-feedbox-area-bottom > img").show();
                    $(".st-feedbox-area-bottom > div").hide();
                }

                $('<div>').load('layout/timeline_event.html .st-sub-box',function(){
                    timelineBlockMake($(this).find(".st-sub-box"),timeline_list,is_top,null,this_gi);

                    $(".st-filter-area").removeClass("st-filter-lock");
                    deferred.resolve({
                        desc:"main_gu exists",
                        status: true
                    });
                });
            } else {
            // 移除idb
            // idbRemoveTimelineEvent(timeline_list,ct_timer,polling_arr,function(){
                $(".st-filter-area").removeClass("st-filter-lock");
                //點選其他類別 會導致timeline寫入順序錯亂 因此暫時不存db
                // if(event_tp == "00"){
                //  //存db           
             //        $.each(timeline_list,function(i,val){
             //            val.ct = val.meta.ct;
             //            val.gi = this_gi ;
             //            val.tp = val.meta.tp ;

             //            var tp = val.meta.tp.substring(1,2)*1;
             //            //為了idb
             //            if(tp > 2){
             //             val.tp = "03" ;
             //            }
             //            idb_timeline_events.put(val);
             //        });
                // }

                if(polling_arr.length == 0){

                    //資料個數少於這個數量 表示沒東西了
                    if(timeline_list.length < 10){
                        //沒資料的確認 加入no data 
                        $(".feed-subarea[data-feed=" + event_tp + "]").addClass("no-data");
                        //關閉timeline loading 開啟沒資料圖示
                        setTimeout(function(){
                            $(".st-feedbox-area-bottom > img").hide();
                            $(".st-feedbox-area-bottom > div").show();
                        },2000);
                    }else{
                        //開啟timeline loading 關閉沒資料圖示 下拉更新除外
                        $(".st-feedbox-area-bottom > img").show();
                        $(".st-feedbox-area-bottom > div").hide();
                    }

                    //存完後改timeline 
                    $('<div>').load('layout/timeline_event.html .st-sub-box',function(){
                        //更新事件完成後 把原本db拉出來的event刪除 避免影響
                        var feed_type = $("#page-group-main").data("navi") || "00";
                        var this_navi = $(".feed-subarea[data-feed=" + feed_type + "]");
                        this_navi.find(".st-sub-box[data-idb=true]").remove();

                        timelineBlockMake($(this).find(".st-sub-box"),timeline_list,is_top,null,this_gi);
                        deferred.resolve({
                            desc:"main_gu exists",
                            status: true
                        });
                    });
                }
            // });
            }
        }
    });

    return deferred.promise();
}

idbRemoveTimelineEvent = function(timeline_list,ct_timer,polling_arr,callback){
    var polling_arr = polling_arr || [];
    var this_gi = polling_arr[0] || gi;

    var ct_timer = ct_timer || 9999999999999;
    
    var event_tp = $("#page-group-main").data("navi") || "00";
    var ei_arr = [];

    for(obj in timeline_list){
        ei_arr.push(timeline_list[obj].ei);
    }

    //判斷類別
    var idb_index,idb_keyRange;
    if(!event_tp || event_tp == "00"){
        idb_index = "gi_ct";
        idb_keyRange = idb_timeline_events.makeKeyRange({
          upper: [this_gi,ct_timer],
          lower: [this_gi,timeline_list.last().meta.ct]
        });
    }else{
        idb_index = "gi_tp_ct";
        var last_ct = 0;
        if(timeline_list.last()) last_ct = timeline_list.last().meta.ct;
        idb_keyRange = idb_timeline_events.makeKeyRange({
          upper: [this_gi,event_tp,ct_timer],
          lower: [this_gi,event_tp,last_ct]
        })
    }

    // cns.debug("remove idb_keyRange:",idb_keyRange);
    //刪掉server回傳的最後一筆和ct_timer之間的資料
    idb_timeline_events.iterate(function(item){
        //刪db 第一篇不用刪
        if(item.ct != ct_timer){
            idb_timeline_events.remove(item.ei);

            //刪ui裡面被刪除的event
            //不分type就是要一起刪
            
            if($.inArray(item.ei,ei_arr) == -1){
                var this_event = $(".feed-subarea").find("[data-event-id="+ item.ei +"]");
                this_event.remove();
            }
        }
    },{
        index: idb_index,
        keyRange: idb_keyRange,
        order: "DESC",
        onEnd: function(result){
            //結束後 呼叫callback
            callback();
        },
        onError: function(result){
            cns.debug("remove onError:",result);
        }
    });
}

timelineBlockMake = function(this_event_temp,timeline_list,is_top,detail,this_gi){
    if(!detail){
        var event_tp = ("0" + $("#page-group-main").data("navi")).slice(-2) || "00";
        if($("#page-group-main").data("main-gu")){
            var tmp = ".feed-subarea[data-feed=main]";
            var ori_selector = $(".feed-subarea[data-feed=main]");

        } else {
            var tmp = ".feed-subarea[data-feed=" + event_tp + "]";
            var ori_selector = $(".feed-subarea[data-feed=" + event_tp + "]");
        }
        var top_subbox = ori_selector.find(".st-sub-box:eq(0)");

        var total_cnt = timeline_list.length;

        //就隱藏其他類別 開啓當下類別
        $(".feed-subarea").hide();
        ori_selector.show();

        ori_selector.data("last-ct",timeline_list.last().meta.ct);
    }

    //檢查非同步timeline是否有清空
    if( this_gi ){
        if( this_gi!=gi ){
            ori_selector.html("");
        }
    }


    var this_event = this_event_temp;
    var selector = $(".timeline-detail");
    var method = "html";
    var visibleEventCnt = 0;
    //製作timeline
    $.each(timeline_list,function(i,val){
        if(null==val) return;
        var content,box_content,youtube_code,prelink_pic,prelink_title,prelink_desc;
        //detail 不需要
        if(!detail){
            method = "append";
            //reset selector
            selector = ori_selector;

            //讀完就可重新滾動撈取舊資料 setTimeOut避免還沒寫入時就重新撈取
            setTimeout(function(){
                selector.data("scroll-chk",false);
            },1000);

            var close_chk = false;

            //判斷是否為更新事件
            this_event = selector.find("[data-event-id="+ val.ei +"]");
            if(this_event.length){
                //如果是更新事件 目前只重改按讚狀態 其餘以後再說
                this_event.find(".st-sub-box-3 div:eq(0)").html(val.meta.lct);
                this_event.find(".st-sub-box-3 div:eq(1)").html(val.meta.pct);
                this_event.find(".st-sub-box-3 div:eq(2)").html(val.meta.rct);
                //event status
                this_event.data("event-val",val);

                eventStatusWrite(this_event);

                //已經存在的文章還是要檢查filter
                eventFilter(this_event,$(".st-filter-area").data("filter"),val.meta);

                if( this_event.hasClass("filter-show") ){
                    visibleEventCnt++;
                }
                return;
            }

            this_event = this_event_temp.clone();

            //寫新event(等同下拉更新) 判斷有無第一個event 且 時間大於此event的ct
            if(top_subbox.length && val.meta.ct > top_subbox.data("ct")){
                //表示這是目前timeline沒有的事件
                method = "before";
                selector = top_subbox;
            }
        }

        //寫入
        // QmiGlobal.timelineTestObj.push({
        //     selector: selector,
        //     method: method,
        //     event: this_event
        // })
        selector[method](this_event);

        //調整留言欄
        // this_event.find(".st-reply-message-textarea").css("width",$(window).width()- (this_event.hasClass("detail") ? 200 : 450));

        var tp = val.meta.tp.substring(1,2)*1;

        //autosize textarea
        this_event
        .find('.st-reply-message-textarea textarea').autosize({append: "\n"}).end()
        .attr("data-event-id",val.ei)//記錄timeline種類
        .data("event-val",val)
        .data("timeline-tp",tp)
        .data("parti-list",[])
        .data("ct",val.meta.ct)

        //名片使用
        .find(".st-user-pic.namecard").data("gi",val.ei.split("_")[0]).end()
        .find(".st-user-pic.namecard").data("gu",val.meta.gu);

        if(detail){
            $(".timeline-detail").fadeIn("fast");

            //等待元素就位
            setTimeout(function(){
                this_event.find(".st-sub-box-1").trigger("detailShow");
                //取消 detail關閉功能
                this_event.data("detail-page",true);
            },100);
                
        }

        //-------------------------------------------------------------------

        //為了更新用
        this_event.find(".st-sub-name label").data("update-id",val.meta.gu);
        this_event.find(".st-sub-box-1 .st-user-pic img").data("update-id",val.meta.gu);
        // 頭像、姓名
        getUserAvatarName(val.ei.split("_")[0] , val.meta.gu , this_event.find(".st-sub-name label") , this_event.find(".st-sub-box-1 .st-user-pic img"));

        this_event.find(".st-sub-time").append('<label class="text">'+new Date(val.meta.ct).toFormatString()+'</label>');
        // this_event.find(".st-sub-time").append(val.meta.ct);

        //發佈對象
        var tu_str = $.i18n.getString("MEMBER_ALL");    //所有人
        this_event.data("object_str", JSON.stringify(val.meta.tu) );
        if(val.meta.tu){
            //用來過濾重複gu
            var gu_chk_arr = [];
            var bi_chk_arr = [];
            var tu_arr = [];

            if(val.meta.tu.gul){
                $.each(val.meta.tu.gul,function(gu_i,gu_obj){
                    if($.inArray(gu_obj.gu,gu_chk_arr) < 0 ){
                        tu_arr.push(gu_obj.n);
                        gu_chk_arr.push(gu_obj.gu); 
                    }
                });
            }
            if(val.meta.tu.bl){
                $.each(val.meta.tu.bl,function(gu_i,bi_obj){
                    if($.inArray(bi_obj.gu,bi_chk_arr) < 0 ){
                        tu_arr.push(bi_obj.bn);
                        bi_chk_arr.push(bi_obj.bi); 
                    }
                });
            }
            tu_str = tu_arr.join("、");
        }
        this_event.find(".st-sub-box-1-footer").append(tu_str.replaceOriEmojiCode()); 
        
        //讚留言閱讀
        this_event.find(".st-sub-box-3 div:eq(0)").html(val.meta.lct);
        this_event.find(".st-sub-box-3 div:eq(1)").html(val.meta.pct);
        this_event.find(".st-sub-box-3 div:eq(2)").html(val.meta.rct);

        var category;
        var title = $.i18n.getString("FEED_POST");
        switch(tp){
            //貼文
            case 0:
                this_event.find(".st-sub-box-2-more").hide();
                break;
            //公告
            case 1:
                category = title = $.i18n.getString("FEED_BULLETIN");
                 
                break;
            //通報
            case 2:
                this_event.find(".st-box2-more-category").addClass("st-box2-more-category-fb");
                category = title =  $.i18n.getString("FEED_REPORT");
                
                break;
            case 3:
                this_event.find(".st-box2-more-category").addClass("st-box2-more-category-task");
                category = $.i18n.getString("FEED_TASK");
                title = $.i18n.getString("FEED_TASK");

                //任務狀態
                this_event.find(".st-box2-more-task-area").show();
                this_event.find(".st-box2-more-time").show();
                this_event.find(".st-task-status-area").show();

                //任務預設的文字
                this_event.find(".st-task-status").html( $.i18n.getString("FEED_UNFINISHED") );
                break;
            case 4://投票
                this_event.find(".st-box2-more-category").addClass("st-box2-more-category-vote");
                category = $.i18n.getString("FEED_VOTE");
                title = $.i18n.getString("FEED_VOTE");
                //任務狀態
                this_event.find(".st-box2-more-task-area").show();
                this_event.find(".st-box2-more-time").show();
                this_event.find(".st-task-status-area").show();

                //投票結果obj
                this_event.data("vote-result",{});

                //任務預設的文字
                this_event.find(".st-task-status").html( $.i18n.getString("FEED_NOT_VOTED") );
                break;
            case 5://地點回報
                this_event.find(".st-box2-more-category").addClass("st-box2-more-category-location");
                category = $.i18n.getString("FEED_LOCATION");
                title = $.i18n.getString("FEED_LOCATION");
                //任務狀態
                this_event.find(".st-box2-more-task-area").show();
                this_event.find(".st-box2-more-time").show();
                this_event.find(".st-task-status-area").show();
                //任務預設的文字
                this_event.find(".st-task-status").html( $.i18n.getString("FEED_NOT_REPORTED") ); //FEED_NOT_REPORTED
                break;
        };

        if(detail){
            $(".detail-title").html(title);
        }
    
        //0:普通貼文 共用區
        if(tp != 0){
            this_event.find(".st-box2-more-category").html(category);
            if(val.meta.tt){
                this_event.find(".st-box2-more-title").html( val.meta.tt.replaceOriEmojiCode() );
            }
        }

        // 公告禁止按讚留言 0:全開 1:能讚不留 2:不讚能留 3:全關
        (function() {
            var thisEventGi = this_event.data("event-id").split("_")[0];
            var ann_on_off = QmiGlobal.groups[thisEventGi].set.s24;

            if(tp == 1){
                if(ann_on_off == 1){
                    this_event.find(".st-reply-message-area").hide();
                    this_event.find(".st-sub-box-3").append("<div class='off-reply'></div>");
                } else if(ann_on_off == 2){
                    this_event.find(".st-sub-box-3").append("<div class='off-like'></div>");
                } else if(ann_on_off == 3){
                   this_event.find(".st-reply-message-area").hide();
                   this_event.find(".st-sub-box-3").append("<div class='off-like'></div>");
                   this_event.find(".st-sub-box-3").append("<div class='off-reply'></div>");
                }
            }
            this_event.find(".st-sub-box-3 .off-like").click(function(){
                popupShowAdjust("公告暫不開放按讚","",true);
            });
            this_event.find(".st-sub-box-3 .off-reply").click(function(){
                popupShowAdjust("公告暫不開放留言","",true);
            });
        })()


        
        //tp = 0 是普通貼文 在content區填內容 其餘都在more desc填
        var target_div = ".st-box2-more-desc";
        if(tp == "0"){
            target_div = ".st-sub-box-2-content";
        }

        //event status
        eventStatusWrite(this_event);

        //detail 不做filter
        if(!detail) eventFilter(this_event,$(".st-filter-area").data("filter"),val.meta);
        if( this_event.hasClass("filter-show") ){
            visibleEventCnt++;
        }

        //timeline message內容
        var tuTmp =null;
        if( val.meta.tu ){
            tuTmp = {};
            tuTmp.tu =  val.meta.tu;
            tuTmp.pu = val.meta.gu
        }
        timelineContentMake(this_event,target_div,val.ml,false,tuTmp);
    });

    showFeedboxNoContent( (visibleEventCnt>0) );
}

timelineListWrite = function (ct_timer,is_top){
    var deferred = $.Deferred();

    // $(".st-filter-area").addClass("st-filter-lock");
    //判斷有內容 就不重寫timeline -> 不是下拉 有load chk 就 return
    if(!ct_timer && !is_top){
        var event_tp = "0" + $("#page-group-main").data("navi") || "00";
        var selector = $(".feed-subarea[data-feed=" + event_tp + "]");

        //隱藏其他類別
        $(".feed-subarea").hide();

        if (!$("#page-group-main").data("main-gu")) selector.show();
        //load_chk 避免沒資料的
        selector.append("<p class='load-chk'></p>");
    }

    var idb_timer = ct_timer - 1 || 9999999999999;
    //取得server最新資訊 更新資料庫
    idbPutTimelineEvent(ct_timer,is_top).done( deferred.resolve );

    return deferred.promise();
    // // 下拉更新 和 個人主頁 就不需要資料庫了
    // if(is_top || $("#page-group-main").data("main-gu")) return false;

    //判斷類別
    // var idb_index,idb_keyRange;
    // if(!event_tp || event_tp == "00"){
    //  idb_index = "gi_ct";
    //  idb_keyRange = idb_timeline_events.makeKeyRange({
//             upper: [gi,idb_timer],
//             lower: [gi]
//           });
    // }else{
    //  idb_index = "gi_tp_ct";
    //  idb_keyRange = idb_timeline_events.makeKeyRange({
//             upper: [gi,event_tp,idb_timer],
//             lower: [gi,event_tp]
//           })
    // }

    //同時先將資料庫資料取出先寫上
    // idb_timeline_events.limit(function(timeline_list){
 //        if(timeline_list.length == 0) return false;
    //  //寫timeline
    //  load_show = false;
    //  $('<div>').load('layout/timeline_event.html .st-sub-box',function(){
 //            $(this).find(".st-sub-box").attr("data-idb",true);
    //      timelineBlockMake($(this).find(".st-sub-box"),timeline_list);
    //  });
    // },{
 //        index: idb_index,
 //        keyRange: idb_keyRange,
 //        limit: 20,
 //        order: "DESC",
 //        onEnd: function(result){
 //            cns.debug("onEnd:",result);
 //        },
 //        onError: function(result){
 //            cns.debug("onError:",result);
 //        }
 //    });
}

eventStatusWrite = function(this_event,this_es_obj){
    var event_status = this_event.data("event-val");
    if( null== event_status ) return;

    var this_ei = this_event.data("event-id");
    var this_gi = this_ei.split("_")[0];

    var isAdmin = false;
    var isMyPost = false;
    try{
        var groupTmp = QmiGlobal.groups[this_gi];
        var meTmp = groupTmp.guAll[ groupTmp.gu ];
        isAdmin = (meTmp.ad==1);
        isMyPost = (event_status.meta.gu==groupTmp.gu);
    } catch(e){
        errorReport(e);
    }
    var this_es_obj = this_event.data("event-val").meta;

    //按讚
    if(this_es_obj.il){
        this_event.find(".st-sub-box-3 img:eq(0)").attr("src","images/icon/icon_like1_activity.png");
        this_event.find(".st-sub-box-4 .st-like-btn").html( $.i18n.getString("FEED_UNLIKE") );
    }
    //回覆
    if(this_es_obj.ip)
            this_event.find(".st-sub-box-3 img:eq(1)").attr("src","images/icon/icon_meg_activity.png");
            
    //閱讀
    if(this_es_obj.ir)
            this_event.find(".st-sub-box-3 img:eq(2)").attr("src","images/icon/icon_view_activity.png");
    
    //任務完成
    if(this_es_obj.ik){
        var tp = this_event.data("timeline-tp");
        var task_str;
        switch(tp){
            case 3:
                task_str = $.i18n.getString("FEED_FINISHED"); //"已完成";
                break;
            case 4:
                task_str = $.i18n.getString("FEED_ALREADY_VOTED"); //"已投票";
                break;
            case 5:
                task_str = $.i18n.getString("FEED_REPORTED"); //"已回報";
                break;
        }
        
        this_event.find(".st-task-status-area img").attr("src","images/common/icon/icon_check_red_l.png");
        this_event.find(".st-task-status").html(task_str);
    }

    //訂閱
    if( true==this_es_obj.is ){
        this_event.find(".st-sub-subscribe").show();
        this_event.find(".st-sub-box-more .st-sub-box-more-box[data-st-more='subscribe'] div").html( $.i18n.getString("FEED_UNSUBSCRIBE") );
    } else {
        this_event.find(".st-sub-subscribe").hide();
        this_event.find(".st-sub-box-more .st-sub-box-more-box[data-st-more='subscribe'] div").html( $.i18n.getString("FEED_SUBSCRIBE") );
    }

    //置頂(一般貼文不能置頂)
    if( this_es_obj.tp=='00' || false==isAdmin ){
        this_event.find(".st-sub-box-more .st-sub-box-more-box[data-st-more='top']").addClass("deactive");
        this_event.find(".st-sub-box-more .st-sub-box-more-box[data-st-more='top'] div").html( $.i18n.getString("FEED_TOP") );
    } else{
        this_event.find(".st-sub-box-more .st-sub-box-more-box[data-st-more='top']").removeClass("deactive");
        if( true==this_es_obj.top && this_es_obj.tp!='00' ){
                this_event.find(".st-sub-box-more .st-sub-box-more-box[data-st-more='top'] div").html( $.i18n.getString("FEED_REMOVE_TOP") );
        } else {
                this_event.find(".st-sub-box-more .st-sub-box-more-box[data-st-more='top'] div").html( $.i18n.getString("FEED_TOP") );
        }
    }

    //刪除
    if( isAdmin || isMyPost){
        this_event.find(".st-sub-box-more .st-sub-box-more-box[data-st-more='del']").removeClass("deactive");
    } else {
        this_event.find(".st-sub-box-more .st-sub-box-more-box[data-st-more='del']").addClass("deactive");
    }
}

eventFilter = function(this_event,filter) {
    var filter = filter || "all";
    
    if(filter == "navi"){
        filter = "all";
    }

    //先關再開
    this_event.hide();
    var event_id = this_event.data("event-id");
    var event_status = this_event.data("event-val").meta;
    
    //用以判斷下拉更新
    this_event.removeClass("filter-show");
    var show_chk = false;

    switch( filter ){
        case "all":
            show_chk = true;
            break;
        case "read":
            if(event_status.ir) show_chk = true;
            break;
        case "unread":
            if(!event_status.ir) show_chk = true;
            break;
        case "subscribe":
            if(event_status.is) show_chk = true;
            break;
    }

    //用以判斷下拉更新
    if(show_chk){
        this_event.addClass("filter-show");
        this_event.show();
    }
}

timelineTopRefresh = function(){
    $(".st-navi-area").addClass("st-navi-fixed");
    $(".st-top-area-load").addClass("mt");
    $(".st-refresh-top").slideDown("fast");
    setTimeout(function(){
        $(".st-refresh-top img").show();
        $(".st-refresh-top span").show();
    },500);

    timelineListWrite("",true);

    //置頂設定
    // topEvent();
}

groupSwitchEnable = function() {
    $(".st-filter-area").removeClass("st-filter-lock");
    $(".sm-group-area").addClass("enable");
}

mathAlignCenter = function (outer,inner){
    return (outer-inner)/2;
}

//拆成detail及timeline list版 並做 html entities 和 url a tag
timelineContentFormat = function (c,limit,ei){
    if(!c) return "";

    var result_str = [];
    
    for(n=0;n<2;n++){
        if(n == 0){
            result_str[n] = c.substring(0,limit);
        }else{
            result_str[n] = c;
        }

        result_str[n] = htmlFormat(result_str[n]);
    }
    
    if(c.length > limit){
        result_str[0] += "...";
    }
    return result_str;
}




/*

######## ##     ## ##    ##  ######  ######## ####  #######  ##    ##        ##  
##       ##     ## ###   ## ##    ##    ##     ##  ##     ## ###   ##       #### 
##       ##     ## ####  ## ##          ##     ##  ##     ## ####  ##        ##  
######   ##     ## ## ## ## ##          ##     ##  ##     ## ## ## ##            
##       ##     ## ##  #### ##          ##     ##  ##     ## ##  ####        ##  
##       ##     ## ##   ### ##    ##    ##     ##  ##     ## ##   ###       #### 
##        #######  ##    ##  ######     ##    ####  #######  ##    ##        ##  





######## #### ##     ## ######## #### ##       ##    ## ######## 
##     ##  ###   ### ##        ##  ##       ###   ## ##       
##     ##  #### #### ##        ##  ##       ####  ## ##       
##     ##  ## ### ## ######    ##  ##       ## ## ## ######   
##     ##  ##     ## ##        ##  ##       ##  #### ##       
##     ##  ##     ## ##        ##  ##       ##   ### ##       
##    #### ##     ## ######## #### ######## ##    ## ######## 


     ######   #######  ##    ## ######## ######## ##    ## ######## 
    ##    ## ##     ## ###   ##    ##    ##       ###   ##    ##    
    ##       ##     ## ####  ##    ##    ##       ####  ##    ##    
    ##       ##     ## ## ## ##    ##    ######   ## ## ##    ##    
    ##       ##     ## ##  ####    ##    ##       ##  ####    ##    
    ##    ## ##     ## ##   ###    ##    ##       ##   ###    ##    
     ######   #######  ##    ##    ##    ######## ##    ##    ##    
*/



timelineContentMake = function (this_event,target_div,ml,is_detail, tu){
    //需要記共有幾張圖片
    var gallery_arr = [], audio_arr = [], video_arr = [],
        isApplyWatermark = false,
        watermarkText = "--- ---";
        fileNum = 0;

    $.each(ml,function(i,val){
        //結束時間檢查
        var end_time_chk = false;

        //有附檔 開啟附檔區域 not_attach_type_arr是判斷不開啟附檔 設定在init.js
        if($.inArray(val.tp,not_attach_type_arr) < 0 && !this_event.find(".st-sub-box-2-attach-area").is(":visible")){
            this_event.find(".st-sub-box-2-attach-area").show();
        }
        //內容格式
        switch(val.tp){
            case 0://文字
                if(!val.c) break;
                //更改網址成連結 
                val.c = htmlFormat(val.c);
                if(this_event.data("event-id") === "G00002F00Eb_T0000GQG0Er_E000000C0G1")
                    window.vc = val.c;

                (function() {
                    var tagRegex = /\/{3};(\w+);\/{3}/g,
                        matchTagList = val.c.match(tagRegex);

                    // 先檢查有無21 進行替換一次
                    ml.forEach(function(eventObj) { 
                        if(eventObj.tp == 21) val.c = val.c.qmiTag(eventObj);
                    });

                    // 抓漏網之魚 防止bug
                    (matchTagList || []).forEach(function(tagText) {
                        var tagId = tagText.replace(tagRegex, "$1");
                        if (QmiGlobal.groups[gi].guAll[tagId] === undefined) return;

                        val.c = val.c.qmiTag({
                            u: tagId,
                            n: QmiGlobal.groups[gi].guAll[tagId].nk
                        });
                    });
                }());
                
                this_event.find(target_div).html(val.c).show();

                break;
            case 1://網址 寫在附檔區域中
                if(val.c){
                    this_event.find(".st-attach-url").click(function(){
                        try{
                            this_event.find(".st-sub-box-2-attach-area a")[0].click();
                        } catch(e) {
                            errorReport(e);
                        }
                    });
                }

                if(!val.d && !val.i && !val.t) return false;

                this_event.find(".st-attach-url").show();
                this_event.find(".st-sub-box-2-attach-area").show();

                if(val.i) {
                    this_event.find(".st-attach-url-img").show();
                    this_event.find(".st-attach-url-img img").attr("src",val.i).load(function(){
                        if($(this)[0].naturalWidth < 480 && $(this)[0].naturalHeight < 200){
                            $(this).css("object-fit","contain");
                        }
                    }).error(function(){
                        //$(this).attr("src","images/common/icon/icon_noPhoto.png");
                        $(this).parent().remove();
                    });
                }
                this_event.find(".st-attach-url-title").html(val.t);
                this_event.find(".st-attach-url-desc").html(val.d);
                if(val.c.substring(0, 4) == 'www.'){
                    val.c = "http://"+val.c;
                }
                this_event.find(".st-attach-url-link").attr("href", val.c);

                break;
            case 2:
                this_event.find(".st-attach-url").show();
                var imgTmp = this_event.find(".st-attach-url-img img");
                imgTmp.attr("src",val.i);
                imgTmp.css("width","100%");
                imgTmp.error( function(){
                    $(this).attr("src","images/common/icon/icon_noPhoto.png");
                });

                var youtube_code = getYoutubeCode(val.c);
                if(youtube_code){
                    this_event.find(".st-attach-youtube").show();
                    this_event.find(".st-attach-youtube").html(
                        '<iframe width="100%" height="100%" src="//www.youtube.com/embed/'+ youtube_code +'" frameborder="0" allowfullscreen></iframe>'
                    );
                }else{
                    var imgTmp = this_event.find(".st-attach-url-img");
                    imgTmp.show();
                    imgTmp.attr("src",val.i);
                    imgTmp.error( function(){
                        $(this).attr("src","images/common/icon/icon_noPhoto.png");
                    });
                    
                    this_event.find(".st-attach-url").click(function(){
                        window.open(val.c);
                    });
                }
                
                
                this_event.find(".st-attach-url-title").html(val.t);
                this_event.find(".st-attach-url-desc").html(val.d);
                break;
            case 3:
                this_event.find(".st-attach-url").show();

                this_event.find(".st-attach-url-title").hide();
                this_event.find(".st-attach-url-desc").hide();
                
                var imgTmp = this_event.find(".st-attach-url-img").show().find("img");
                imgTmp.show();
                imgTmp.attr("src",val.c);
                imgTmp.error( function(){
                    $(this).attr("src","images/common/icon/icon_noPhoto.png");
                });
                
                //圖片滿版
                var w = this_event.find(".st-attach-url-img img").width();
                var h = this_event.find(".st-attach-url-img img").height();
                // mathAvatarPos(this_event.find(".st-attach-url-img img"),w,h,0,360);
                break;
            case 5:
                // var sticker_path = "sticker/" + val.c.split("_")[1] + "/" + val.c + ".png";
                this_event.find(".st-attach-sticker").show();
                // this_event.find(".st-attach-sticker img").attr("src",sticker_path);
                initStickerArea.setStickerSrc(this_event.find(".st-attach-sticker img"),val.c);
                break;
            case 6://圖片
                this_event.find(".st-attach-img").show();
                //.st-attach-img-arrow-l,.st-attach-img-arrow-r

                //必須要知道總共有幾張圖片
                gallery_arr.push(val);

                break;
            case 7://影片
                this_event.find(".st-attach-video").show().addClass("attach-download");
                //總共有幾個聲音
                video_arr.push(val);
                break;
            case 8://聲音
                this_event.find(".st-attach-audio").show();
                //總共有幾個聲音
                audio_arr.push(val);
                break;
            case 9:
                try {
                    this_event.find(".st-attach-google-map").show();
                    this_event.find(".st-attach-google-map").tinyMap({
                         center: {x: val.lat, y: val.lng},
                         zoomControl: 0,
                         mapTypeControl: 0,
                         scaleControl: 0,
                         scrollwheel: 0,
                         zoom: 16,
                         marker: [
                             {addr: [val.lat, val.lng], text: val.a}
                         ]
                    });
                    
                } catch(e) {
                    try {
                        cns.debug("google 失敗 換高德上",val.lat+":"+val.lng);
                        this_event.find(".st-attach-google-map").hide();
                        this_event.find(".st-attach-amap-map").show();
                        var id_str = "amap-" + new Date().getRandomString();
                        // 寫地址
                        if(val.a.length) this_event.find(".map-addr").text(val.a).show();

                        this_event.find(".st-attach-amap-map").attr("id",id_str);
                        var mapObj = new AMap.Map(id_str,{
                            rotateEnable:false,
                            dragEnable:true,
                            zoomEnable:false,
                            //二维地图显示视口
                            view: new AMap.View2D({
                                center:new AMap.LngLat(val.lng,val.lat),//地图中心点
                                zoom:15 //地图显示的缩放级别
                            })
                        });

                        var marker=new AMap.Marker({                    
                            position:new AMap.LngLat(val.lng,val.lat)  
                        });  
                        marker.setMap(mapObj);
                    } catch( e ) {
                        cns.debug("高德失敗");

                    }
                }
                    
                break;
            case 12:
                end_time_chk = true;
                break;
            case 14:
                end_time_chk = true;
                break;
            case 17:
                end_time_chk = true;
                break;
            case 21:
                // 為避免bug 直接在0 取代
                // if (typeof(mainContext) == 'string' && mainContext) {
                //     mainContext = mainContext.qmiTag(val);
                // }
                break;
            case 26:
                this_event.find(".st-attach-file").show();
                getS3fileBackground(val, this_event.find(".st-attach-file"), 26, null, function(data){
                    var fileName = (val.fn.length > 15) ? (val.fn.substring(0, 15) + "....") : val.fn;
                    var format = val.fn.split(".").pop();
                    var linkElement = document.createElement("a");
                    var fileIcon = document.createElement("img");
                    var fileNameNode = document.createTextNode(fileName + " - " + format);
                    var fileSizeSpan = document.createElement("span");  
                    fileIcon.src = 'images/fileSharing/' + getMatchIcon(val.fn);
                    fileSizeSpan.textContent = val.si ? val.si.toFileSize() : "0 bytes";
                    linkElement.className = 'attach-file';
                    linkElement.download = val.fn;
                    linkElement.href = data.s3;
                    linkElement.appendChild(fileIcon);
                    linkElement.appendChild(fileNameNode);
                    linkElement.appendChild(fileSizeSpan);
                    this_event.find(".attach-file-list").append(linkElement);
                });
                fileNum += 1;
                break;
            case 27:
                if( false==isApplyWatermark && 1==val.wm ){
                    try{
                        var this_ei = this_event.data("event-id");
                        var this_gi = this_ei.split("_")[0];
                        // var this_gu = this_event.data("this_gu", val.meta.gu);
                        //get poster name
                        var groupData = QmiGlobal.groups[this_gi];
                        var name = groupData.guAll[groupData.gu].nk;
                        var groupName = groupData.gn;
                        watermarkText = groupName + " " + name;
                        isApplyWatermark = true;
                    }catch(e){
                        errorReport(e);
                    }
                }
                break;
        };


        this_event.find("b").off("click").on("click", function(e) {
            var groupId = this_event.data("event-id").split("_")[0] || gi;
            userInfoShow(groupId, $(e.target).attr("name"));
        });
        
        //需要填入結束時間 以及 結束時間存在 就填入
        if(end_time_chk){
            if(val.e){
                var time = new Date(val.e);
                var time_format = time.customFormat( "#M#/#D# #CD# #hhh#:#mm#" );

                var d = new Date();
                if(val.e < d.getTime()){
                    this_event.find(".st-task-status").html( $.i18n.getString("FEED_CLOSED") ); //"已結束";
                    this_event.find(".st-vote-send").html( $.i18n.getString("FEED_CLOSED") ); //"已結束";
                    // this_event.find(".st-location-send").html( $.i18n.getString("FEED_CLOSED") ); //"已結束";
                    this_event.data("task-over",true);
                }else{
                    this_event.find(".st-vote-send").html( $.i18n.getString("COMMON_SUBMIT") ); //"送出" 
                    // this_event.find(".st-location-send").html( $.i18n.getString("COMMON_SUBMIT") ); //"送出"
                }
            }else{
                var time_format = $.i18n.getString("FEED_CLOSE_TIME_NO_LIMIT"); //"無結束時間";
            }
            this_event.find(".st-box2-more-time span").html(time_format);
        } 
    });

    //若有圖片 則呼叫函式處理
    if (gallery_arr.length > 0) timelineGalleryMake(this_event,gallery_arr, isApplyWatermark, watermarkText, tu);
    if (audio_arr.length > 0) timelineAudioMake(this_event,audio_arr);
    if (video_arr.length > 0) timelineVideoMake(this_event,video_arr);
    if (fileNum > 0) timelineFileMake(this_event, fileNum);

    this_event._i18n();


    var tmpData = getGroupCompetence(gi);
    if( false==tmpData.isAdmin && true==tmpData.isOfficial ){
        this_event.find(".st-read").hide();
        this_event.find(".namecard").removeClass("namecard");
    }
}


timelineAudioMake = function (this_event,audio_arr){
    $.each(audio_arr,function(i,val){
        var this_audio = $(
            '<audio controls></audio>'
        );
        this_event.find(".st-attach-audio").prepend(this_audio);
        getS3file(val,this_audio,8);
    });
}

timelineVideoMake = function (this_event,video_arr){
    $.each(video_arr,function(i,val){
        var this_video = $(
            '<video class="download" preload="none"></video>'
        );
        this_event.find(".st-attach-video").prepend(this_video);
        getS3file(val,this_video,7);
        //影片只能有一個, 做完收工
        return false;
    });
}

timelineFileMake = function(thisEvent, fileNum) {

    var expandDiv = thisEvent.find(".st-attach-file").children(".header");
    var allDownLoadDiv = thisEvent.find(".st-attach-file").children(".footer");
    var fileListDiv = thisEvent.find(".st-attach-file").children(".attach-file-list");

    allDownLoadDiv.hide();

    if (fileNum == 1) {
        expandDiv.hide();
    } else {
        fileListDiv.hide();
        expandDiv.append(document.createTextNode(" ( " + fileNum + " )"));

        expandDiv.bind("click", function(e) {
            fileListDiv.fadeToggle();
            allDownLoadDiv.fadeToggle();
            $(this).toggleClass("hidden");
        });

        allDownLoadDiv.bind("click", function(e) {
            var fileLinks = fileListDiv.find("a");
            var fileIndex = 0;
            e.preventDefault();

            try {
                var https = require('https'),
                    fs = require('fs'),
                    path = require('path')
                    __dirname = path.dirname(process.execPath);

                var downloadFile = function(callback){
                    if(fileIndex < fileLinks.length) {
                        var fileLink = fileLinks[fileIndex];
                        var file = fs.createWriteStream(__dirname + "/" + fileLink["download"]);
                        var request = https.get(fileLink["href"], function(response) {
                            response.pipe(file);
                            fileIndex += 1;
                            downloadFile(callback);
                        });
                    } else {
                        callback();
                    }
                }

                downloadFile(function() {
                    console.log("download finishes");
                });
            } catch(e){
                $.each(fileLinks, function(i, fileLink) {
                    fileLink.click();
                });
            }
           

            

            // var file = fs.createWriteStream("C:/Users/sam/AppData/Local/Qmi/Downloads/33455.jpg");
            // var request = https.get("https://project-o.s3.hicloud.net.tw/groups/G00002Aa0GQ/0/5ff373ff-a42a-4183-ba59-3bdd1cbc1bf6_o?Expires=1785494657&AWSAccessKeyId=SE41NTAxNDgyNDE0MjI2MDE4Mjg5MjM&Signature=%2FuvyHosaMg3Q5wuh16Y4hTZp1lA%3D", function(response) {
            //   response.pipe(file);
            // });
            // $.each(fileLinks, function(i, fileLink) {
                
                
            //     // fileLink.click();
            // });

            
        });
    }
}


timelineGalleryMake = function (this_event,gallery_arr,isApplyWatermark,watermarkText, tu){
    // cns.debug(this_event.data("event-id")+"  "+"gallery:",gallery_arr);
    // cns.debug("gallery length:",gallery_arr.length);

    var this_gallery = this_event.find(".st-attach-img");

    //檢查移動是否完成
    var count = Math.min(5,Object.keys(gallery_arr).length);
    var container = this_event.find(".st-attach-img-area");
    var left = container.find("td:nth-child(1)");
    var right = left.next();
    if( count<=0 ) return;
    if( count==1 ){
        left.css("width","100%");
    } else {
        left.css("width","50%");
    }

    if( count<5 ){
        left.addClass("cnt_"+1);
        right.addClass( "cnt_"+(count-1) );
        // var leftHeight = height;
        $.each(gallery_arr,function(i,val){
            var this_img = $('<span class="st-slide-img"/>');
            if( i==0 ){
                left.append(this_img);
            }
            else{
                right.append(this_img);
            }

            if( isApplyWatermark ){
                getS3fileBackgroundWatermark(val,this_img, 6, watermarkText, tu, function(data){
                    gallery_arr[i].s3 = data.s3;
                    gallery_arr[i].s32 = data.s32;
                    // this_img.addClass("loaded");
                });
            } else {
                getS3fileBackground(val,this_img,6,tu, function(data){
                    gallery_arr[i].s3 = data.s3;
                    gallery_arr[i].s32 = data.s32;
                    this_img.addClass("loaded");
                });
            }
            if( i>=4 ) return false;
        });
    } else {
        left.addClass("cnt_"+2);
        right.addClass( "cnt_"+(count-2) );
        $.each(gallery_arr,function(i,val){
            var this_img = $('<span class="st-slide-img"/>');

            if( i<2 ){
                left.append(this_img);
            }
            else{
                if (i == 4) {
                    if (Object.keys(gallery_arr).length > 5) {
                        this_img.html("<h1>+ " + (Object.keys(gallery_arr).length - 5).toString() + "</h1>");
                    }
                }
                right.append(this_img);
            }

            if( isApplyWatermark ){
                getS3fileBackgroundWatermark(val,this_img, 6, watermarkText, tu, function(data){
                    gallery_arr[i].s3 = data.s3;
                    gallery_arr[i].s32 = data.s32;
                    // this_img.addClass("loaded");
                });
            } else {
                getS3fileBackground(val,this_img,6,tu, function(data){
                    gallery_arr[i].s3 = data.s3;
                    gallery_arr[i].s32 = data.s32;
                    this_img.addClass("loaded");
                });
            } 
            if( i>=4 ) return false;
        });
    }

    //記錄圖片張數 以計算位移
    this_gallery.attr("cnt",count);

    //點選開啟圖庫
    this_gallery.find(".st-attach-img-area").click(function(e){
        // var targetImg = e.target.style.backgroundImage;
        var targetImg = e.target;
        if (targetImg.tagName === "H1") {
            targetImg = e.target.parentElement;
        }

        var imageList = Array.prototype.slice.call(this_event[0].getElementsByClassName("st-slide-img"), 0);
        var targetImgIndex = imageList.indexOf(targetImg);
      
        var this_img_area = $(this);
        var this_ei = this_img_area.parents(".st-sub-box").data("event-id");
        var this_gi = this_ei.split("_")[0];
        var this_ti = this_ei.split("_")[1];
        // showGallery( this_gi, this_ti, gallery_arr, null, null, isApplyWatermark, watermarkText );
        // showGallery(this_ti, gallery_arr, targetImgIndex, isApplyWatermark, watermarkText);

        new QmiGlobal.gallery({
            gi: this_gi,
            photoList: gallery_arr,
            currentImage : targetImgIndex,
            isApplyWatermark : isApplyWatermark,
            watermarkText : watermarkText
        })
    });
}


getS3file = function(file_obj,target,tp,size, tu){
    var this_ei = target.parents(".st-sub-box").data("event-id");
    var this_gi = this_ei.split("_")[0];
    var this_ti = this_ei.split("_")[1];

    //default
    size = size || 350;
    var api_name = "groups/" + this_gi + "/timelines/" + this_ti + "/files/" + file_obj.c + "/dl";
    var headers = {
             "ui":ui,
             "at":at, 
             "li":lang,
                 };
    var method = "post";
    var result = ajaxDo(api_name,headers,method,false, tu,false,true);
    result.complete(function(data){
        if(data.status != 200) return false;

        var obj =$.parseJSON(data.responseText);
        obj.api_name = api_name;
        if(target && tp){
            switch(tp){
                case 6://圖片
                    var img = target.find("img.aut");
                    img.load(function() {
                        //重設 style
                        img.removeAttr("style");
                        var w = img.width();
                        var h = img.height();
                        // mathAvatarPos(img,w,h,size);
                    });
                    //小圖
                    target.find("img.aut").attr("src",obj.s3);
                    //大圖
                    //target.find("img.auo").attr("src",obj.s32).hide();
                    target.find("img.auo").data("src",obj.s32).hide();
                    break;
                case 7://影片
                    target.attr("src",obj.s32).show();
                    break;
                case 8://聲音
                    // target.find("source").attr("src",obj.s3);
                    target.html('<source type="audio/mp4" yo src="'+ obj.s3 +'">').show();
                    break;
            }
        }else{
            return obj.s3;
        }
    });
}

getS3fileBackground = function(file_obj,target,tp, tu, callback){
    var this_ei = target.parents(".st-sub-box").data("event-id");
    var this_gi = this_ei.split("_")[0];
    var this_ti = this_ei.split("_")[1];
    var fileId = file_obj.c || file_obj.fi;

    //default
    var api_name = "groups/" + this_gi + "/timelines/" + this_ti + "/files/" + fileId + "/dl";
    var headers = {
             "ui":ui,
             "at":at, 
             "li":lang,
                 };
    var method = "post";
    var result = ajaxDo(api_name,headers,method,false, tu, false, true);
    result.complete(function(data){
        if(data.status != 200) return false;

        var obj =$.parseJSON(data.responseText);
        obj.api_name = api_name;
        if(target && tp){
            switch(tp){
                case 6://圖片
                    //小圖
                    target.attr("s3bg",obj.s32);
                    target.css("background-image","url('"+obj.s32+"')");
                    //大圖
                    target.data("auo",obj.s32);
                    break;
                case 8://聲音
                    target.attr("src",obj.s3);
                    break;
                // case 26://檔案
                //     var linkElement = document.createElement("a");
                //     var fileIcon = document.createElement("img");
                //     var fileNameNode = document.createTextNode(file_obj.fn);   
                //     fileIcon.src = 'images/timeline/otherfile_icon.png';
                //     linkElement.className = 'attach-file';
                //     linkElement.download = file_obj.fn;
                //     linkElement.href = obj.s3;
                //     linkElement.appendChild(fileIcon);
                //     linkElement.appendChild(fileNameNode);
                //     target.append(linkElement);
                    
                    break;
            }
            var image = new Image();
            $(image).error(function() {
                target.css("background-image","");
                target.addClass("loadError");
            });
            $(image).attr("src", obj.s32);
        }else{
            return obj.s3;
        }
        if( callback ) callback(obj);
    });
}

getS3fileBackgroundWatermark = function(file_obj,target,tp, text, tu, callback){
    var this_ei = target.parents(".st-sub-box").data("event-id");
    var this_gi = this_ei.split("_")[0];
    var this_ti = this_ei.split("_")[1];

    //default
    var api_name = "groups/" + this_gi + "/timelines/" + this_ti + "/files/" + file_obj.c + "/dl";
    var headers = {
             "ui":ui,
             "at":at, 
             "li":lang,
                 };
    var method = "post";
    var result = ajaxDo(api_name,headers,method,false,tu, false, true);
    result.complete(function(data){
        if(data.status != 200){
            target.addClass("loadError");
            return false;
        }

        var obj =$.parseJSON(data.responseText);
        obj.api_name = api_name;
        if(target && tp){
            if(6==tp){
                getWatermarkImage(text, obj.s32, 1, function(imgUrl){
                    // alert(imgUrl);
                    target.css("background-image","url("+imgUrl+")");
                    target.addClass("loaded");
                    target.data("auo",imgUrl);
                    obj.s32 = imgUrl;
                    obj.s3 = imgUrl;
                    if( callback ) callback(obj);
                });
            }
        }else{
            return obj.s3;
        }
    });
}

uploadErrorCnt = function(this_compose,file_num,total){
    //上傳編號加一
    var num = this_compose.data("uploaded-num");
    this_compose.data("uploaded-num",num += 1);

    this_compose.data("uploaded-err").push(file_num+1);

    //檢查是否是最後一個上傳的檔案 若是的話 再檢查是否顯示上傳失敗訊息
    if(this_compose.data("uploaded-num") == total){
        //loading icon off
        s_load_show = false;
        $('.ui-loader').hide();
        // $(document).trigger("click");
        //只會有失敗
        clearTimeout(compose_timer);
        popupShowAdjust("",$.i18n.getString("COMMON_UPLOAD_FAIL") ); //"第" + this_compose.data("uploaded-err").sort().join("、") + "個檔案上傳失敗 請重新上傳")
    };
}

uploadImg = function(file,imageType,file_num,total,cp_tp,permission_id, isApplyWatermark){
    var this_compose = $(document).find(".cp-content");
    
    //判斷是否符合上傳檔案格式
    if(!file.type.match(imageType)){
        //上傳編號加一
        var num = this_compose.data("uploaded-num");
        this_compose.data("uploaded-num",num += 1);
        return false;
    }

    //縮圖 先做縮圖 因為要一起做commit 的 md 
    var reader = new FileReader();
    reader.onloadend = function() {
        var tempImg = new Image();
        tempImg.src = reader.result;
        tempImg.onload = function() {

            //大小圖都要縮圖
            var o_obj = imgResizeByCanvas(this,0,0,1280,1280,0.7);
            var t_obj = imgResizeByCanvas(this,0,0,480,480,0.6);

            cns.debug("o_obj:",o_obj);
            cns.debug("t_obj:",t_obj);
            //compose tp to upload file tp
            getS3UploadUrl(gi, ti_feed,1,permission_id,isApplyWatermark).complete(function(data){
                var s3url_result = $.parseJSON(data.responseText);
                if(data.status == 200){
                    var fi = s3url_result.fi;
                    var s3_url = s3url_result.s3;
                    var s32_url = s3url_result.s32;

                    //傳大圖
                    uploadImgToS3(s32_url,o_obj.blob).complete(function(data){
                    if(data.status == 200){

                        //傳小圖
                        uploadImgToS3(s3_url,t_obj.blob).complete(function(data){

                        if(data.status == 200){
                            var tempW = this.width;
                            var tempH = this.height;
                            
                            //mime type
                            var md = {};
                            md.w = o_obj.w;
                            md.h = o_obj.h;
                            uploadCommit(gi, fi,ti_feed,permission_id,1,file.type,o_obj.blob.size,md).complete(function(data){

                                var commit_result = $.parseJSON(data.responseText);

                                //上傳編號加一
                                var num = this_compose.data("uploaded-num");
                                this_compose.data("uploaded-num",num += 1);

                                //commit 成功或失敗
                                if(data.status != 200){
                                    this_compose.data("uploaded-err").push(file_num+1);
                                }else{

                                    var img_arr = [fi,permission_id,file.name];
                                    this_compose.data("img-compose-arr")[file_num] = img_arr;
                                }
                                
                                checkIsUploadFinished( this_compose );
                            });
                        }else{
                            //傳小圖失敗
                            uploadErrorCnt(this_compose,file_num,total);
                            return false;
                        }});

                    }else{
                        //傳大圖失敗
                        uploadErrorCnt(this_compose,file_num,total);
                        return false;
                    }});
                }else{
                    //取得上傳網址
                    return false;
                }
            });
        }
    }
    reader.readAsDataURL(file);
}

function uploadVideo( file, video, file_num, total, cp_tp, pi) {
    // var file = dom.data("file");
    // var video = dom.find("video");

    // if( ""!=tmpData.ml[0].c ){
    //  sendText(dom);
    // } else {
    var ori_arr = [1280, 1280, 0.9];
    var tmb_arr = [160, 160, 0.4];

    // dom.find(".chat-msg-load-error").removeClass("chat-msg-load-error").addClass("chat-msg-load");

    uploadGroupVideo(gi, file, video, ti_feed, 0, ori_arr, tmb_arr, pi, function (data) {

        //上傳編號加一
        var this_compose = $(document).find(".cp-content");
        var num = this_compose.data("uploaded-vid-num");
        this_compose.data("uploaded-vid-num",num += 1);

        if (data) {
            // var data = {
            //     fi:fi,
            //     s3:s3_url,
            //     s32:s32_url
            // }
            var img_arr = [data.fi,pi,file.name];
            this_compose.data("video-compose-arr")[file_num] = img_arr;
        } else {
            this_compose.data("uploaded-vid-err").push(file_num+1);
            //傳小圖失敗
            uploadErrorCnt(this_compose,file_num,total);
            return false;
        }

        checkIsUploadFinished( this_compose );
    });
    // }
}

checkIsUploadFinished = function(this_compose){
    var vidError = this_compose.data("uploaded-vid-err")
        , imgError = this_compose.data("uploaded-err");
    cns.debug( this_compose.data("uploaded-vid-num")
        ,this_compose.data("uploaded-vid-total")
        ,this_compose.data("uploaded-num")
        ,this_compose.data("uploaded-total"));

    //判斷是否為最後一個上傳檔案
    //檢查是否是最後一個上傳的檔案 若是的話 再檢查是否顯示上傳失敗訊息
    if(this_compose.data("uploaded-vid-num") == this_compose.data("uploaded-vid-total")
        && this_compose.data("uploaded-num") == this_compose.data("uploaded-total") ){
        //loading icon off
        s_load_show = false;
        $('.ui-loader').hide();
        // $(document).trigger("click");

        if( (vidError&&vidError.length > 0)||(imgError&&imgError.length>0) ){
            popupShowAdjust("", $.i18n.getString("COMMON_UPLOAD_FAIL"),true); //"第" + vidError.sort().join("、") + "個檔案上傳失敗 請重新上傳"
        } else {

            clearTimeout(compose_timer);

            var body = this_compose.data("body");
            if( this_compose.data("video-compose-arr") ){
                $.each(this_compose.data("video-compose-arr"),function(i,val){
                    if(val){
                        var obj = {};
                        obj.tp = 7;
                        obj.c = val[0];
                        obj.p = val[1];
                        body.ml.push(obj);
                    }
                });
            }
            if( this_compose.data("img-compose-arr") ){
                $.each(this_compose.data("img-compose-arr"),function(i,val){
                    if(val){
                        var obj = {};
                        obj.tp = 6;
                        obj.c = val[0];
                        obj.p = val[1];
                        body.ml.push(obj);
                    }
                });
            }
            composeSendApi(this_compose.data("body"));
        }
    }
}


putEventStatus = function (target_obj,etp,est,callback){
    var this_event = target_obj.selector;
    var event_val = this_event.data("event-val");
    var act = target_obj.act;
    var order = target_obj.order;
    var this_ei = this_event.data("event-id");
    var this_gi = this_ei.split("_")[0];
    var this_ti = this_ei.split("_")[1];
    var this_status = false;

    var api_name = "groups/" + this_gi + "/timelines/" + this_ti + "/events/" + this_event.data("event-path");
    // etp: 0(讀取),1(按讚),2(按X),3(按訂閱),4(按置頂),6(是否有行事曆)
    // est: 0(取消),1(執行)
    var headers = {
         "ui":ui,
         "at":at, 
         "li":lang,
         "etp":etp,
         "est":est
    };
    var method = "put";
    ajaxDo(api_name,headers,method,false).complete(function(data){
        //做timeline樓主的回覆狀態
        if(data.status == 200){
            //解鎖
            this_event.data("like-lock",false);

            var d =$.parseJSON(data.responseText);
            var gu = QmiGlobal.groups[this_gi].gu;
            //timeline 外層
            if(!target_obj.reply){
                var count_selector = this_event.find(".st-sub-box-3 div:eq(" + order + ")");
                var img_selector = this_event.find(".st-sub-box-3 img:eq(" + order + ")");

                //按讚區域
                var parti_list = this_event.data("parti-list");

                //0:取消 1:執行
                if(est){
                    img_selector.attr("src","images/icon/icon_" + act + "_activity.png")
                    count_selector.html(count_selector.html()*1+1);
                    this_status = true;

                    //按讚區域 改寫陣列
                    parti_list.push(gu);
                }else{
                    img_selector.attr("src","images/icon/icon_" + act + "_normal.png")
                    count_selector.html(count_selector.html()*1-1);

                    //按讚區域 改寫陣列
                    var i = $.inArray(gu,parti_list);
                    parti_list.splice(i,1);
                }

                //存回
                this_event.data("parti-list",parti_list);

                //記錄在data中 讓按讚列表可使用
                var parti_like_arr = this_event.data("parti-like");
                if(this_event.find(".st-reply-like-area").is(":visible") && parti_like_arr){
                    if(est){
                        parti_like_arr.unshift({gu:gu,rt:new Date().getTime()});
                    }else{
                        $.each(parti_like_arr,function(i,val){
                            if(val && val.gu == gu) {
                                parti_like_arr.splice(i,1);
                                return false;
                            }
                        });
                    }
                } 

            }else{
                //回覆按讚
                if(est){
                    this_event.find(".st-reply-footer img").attr("src","images/icon/icon_like1_activity.png");
                    var likeDom = this_event.find(".st-reply-footer span:eq(1)");
                    likeDom.html( $.i18n.getString("FEED_UNLIKE") );
                    likeDom.data("like", true);

                    var count = this_event.find(".st-reply-footer span:eq(2)").html()*1+1;

                    this_status = true;
                }else{
                    this_event.find(".st-reply-footer img").attr("src","images/icon/icon_like1_normal.png");
                    var likeDom = this_event.find(".st-reply-footer span:eq(1)");
                    likeDom.html( $.i18n.getString("FEED_LIKE") );
                    likeDom.data("like", false);

                    var count = this_event.find(".st-reply-footer span:eq(2)").html()*1-1;
                }

                this_event.find(".st-reply-footer span:eq(2)").html(count);

                if(count == 0){
                    this_event.find(".st-reply-footer img").hide();
                    this_event.find(".st-reply-footer span:eq(2)").hide();
                }else{
                    this_event.find(".st-reply-footer img").show();
                    this_event.find(".st-reply-footer span:eq(2)").show();
                }

            }

            //api成功才存回
            switch(etp){
                case 0:
                    event_val.meta.ir = this_status;
                    break;
                case 1://讚
                    event_val.meta.il = this_status;
                    break;
            }
            
            this_event.data("event-val",event_val);

            //按讚列表
            if(callback) callback(true);
        }
    });
    
}


//parse 網址
getLinkMeta = function (this_compose,url) {
    var parseUrl = window.parseUrl || null,
        // 超過時間就不做 不然會被靠北
        timeLimit = 5000,//ms
        deferred = $.Deferred();

    if(parseUrl === null)
        deferred.reject({
            msg: '非桌機版'
        });
    else
        parseUrl( url, deferred.resolve);

    var timer = setTimeout(function() {
        deferred.reject({
            msg: 'timeout'
        })
    }, timeLimit);

    deferred.done(function(err, data){

        var result = {};
        var tmp_img,tmp_desc;

        var yqlHtml = $(".cp-ta-yql").html();

        //loading圖示隱藏
        $(".cp-attach-area .url-loading").hide();

        //error存在 或 result null 就跳出
        if( err ) {
            //沒內容也算結束吧 讓它可以送出 
            this_compose.data("parse-waiting",false).data("url-chk",false);
            toastShow( $.i18n.getString("COMPOSE_PARSE_ERROR") );
            return false;
        } else if(data.title && data.title.length==0 && data.description && data.description.length==0 && data.image && data.image.url.length==0){
            this_compose.data("parse-waiting",false).data("url-chk",false);
            return false;
        }
        
        //title
        if( Array.isArray(data.title) ){
            if( data.title.length>0 ){
                result.title = data.title[0];
            }
        } else {
            result.title = data.title || data.site_name;
        }
        //description
        if( Array.isArray(data.description) ){
            if( data.description.length>0 ){
                result.description = data.description[0];
            }
        } else {
            result.description = data.description;
        }
        //image
        if( data.image && data.image.url ){
            if( Array.isArray(data.image.url) ){
                if(data.image.url.length>0){
                    result.img = rel_to_abs(data.image.url[0]);       
                }
            } else {
                result.img = rel_to_abs(data.image.url);
            }
        }

        cns.debug(result.title, result.description, result.img );

        if(url.match(/youtube.com|youtu.be|m.youtube.com/)){
            this_compose.data("message-list").push(2);
            var tmp = getYoutubeThumbnail( url );
            if(tmp) result.img = tmp;
        }else{
            this_compose.data("message-list").push(1);
        }

        if(result.title || result.description || result.img){
            //按送出重新截取網站內容 不用顯示在畫面
            if(this_compose.data("parse-resend")) {
                this_compose.data("parse-resend",false);
                $(".cp-post").trigger("click");
            }else{
                cns.debug("url:",result);
                if(result.title) $(".cp-yql-title").html(result.title);
                if(result.description) $(".cp-yql-desc").html(result.description.substring(0,200));
                if(result.img){
                    var img = $("<img src='" + result.img + "'/>");
                    $(".cp-yql-img").show().append(img);
                    img.error( function(){
                        $(this).parent().hide();
                        $(this).remove();
                        cns.debug("img preview failed.");
                    });
                }
                $(".cp-ta-yql").fadeIn();
            }
        }

        if(data.url) {
            result.url = data.url
        } else {
            result.url = url;
        }
        
        this_compose.data("url-content",result);

        //網址讀取結束
        this_compose.data("parse-waiting",false);

        //關閉副檔區
        composeCheckMessageList();
        
        //關閉事件
        $(".cp-ta-yql > img").off().click(function(){

            $(".cp-ta-yql").html(yqlHtml).fadeOut();
            this_compose.data("url-chk",false).data("url-content",false);

            //message list pop
            var mlArr = this_compose.data("message-list");
            for(key in mlArr){
                if(mlArr[key] == 1 || mlArr[key] == 2){
                    mlArr.splice(key,1);
                }
            }

            this_compose.data("message-list",mlArr);

            //判斷關閉副檔區
            composeCheckMessageList();
        });
        
    }).fail(function(errData){
        cns.debug("fail", errData);

        //網址讀取結束
        this_compose.data("parse-waiting",false).data("url-chk",false);
        // this_compose.data("parse-error",true);
        this_compose.data("parse-resend",false);

        $(".cp-attach-area .url-loading").hide();

        composeCheckMessageList();
    });
}

getJsonFromUrl = function(url) {
    var result = {};
    var query = url.split("?");
    if( query && query.length>1 && query[1] ){
        query[1].split("&").forEach(function(part) {
            var item = part.split("=");
            cns.debug(part, item[0]);
            result[item[0]] = decodeURIComponent(item[1]);
        });
    }
    return result;
}

getYoutubeThumbnail = function(url){
    var data = getJsonFromUrl( url );
    if( data.hasOwnProperty("v") ){
        return 'http://img.youtube.com/vi/'+data["v"]+'/0.jpg';
    }
    return null;
}

getYoutubeCode = function(url){
    if(url.match(/youtube.com/)){
        if(url.indexOf("?v=") >= 0) {
            var strpos = url.indexOf("?v=")+3;
        } else if(url.indexOf("&v=") >= 0) {
            var strpos = url.indexOf("&v=")+3;
        }else{
            cns.debug("youtube code not find");
            return false;
        }
        
    }else if(url.match(/\/\/youtu.be/)){
        var strpos = url.indexOf("youtu.be")+9;
    }

    var youtube_code = url.substring(strpos,strpos+11);
    if(youtube_code.length < 11 || youtube_code.match(/\&/)){
        return false;
    }else{
        return youtube_code;
    }
}

//parse Youtube
getLinkYoutube = function (this_compose,url) {
    s_load_show = true;
    if(activityTimeout) clearTimeout(activityTimeout);
    var activityTimeout = setTimeout(function(){
        $(".cp-yql-img").html("");
        var result={};
        var youtube_code = getYoutubeCode(url);
        cns.debug("youtube_code",youtube_code);
        if(youtube_code){
            load_show = false;
            $.ajax ({
                url: "https://gdata.youtube.com/feeds/api/videos/" + youtube_code + "?v=2&prettyprint=true&alt=jsonc",
                timeout: 5000,
                complete: function(){
                    s_load_show = false;
                    QmiGlobal.ajaxLoadingUI.hide();
                    
                    //loading圖示隱藏
                    $(".cp-attach-area .url-loading").hide();
                    //網址讀取結束
                    this_compose.data("parse-waiting",false);
                },
                success: function(result){
                    if(this_compose.data("parse-resend")) {
                        this_compose.data("parse-resend",false);
                        $(".cp-post").trigger("click");
                    }else{
                        $(".cp-attach-area").show();
                        $(".cp-yql-title").html(result.data.title);
                        $(".cp-yql-desc").html(result.data.description);
                        $(".cp-yql-img").show().html("<img src='" + result.data.thumbnail.hqDefault + "'/>");
                        $(".cp-ta-yql").fadeIn();
                    }

                    var url_content = {
                        c: url,
                        t: result.data.title,
                        d: result.data.description,
                        i: result.data.thumbnail.hqDefault,
                        v: ""
                    }
                    this_compose.data("url-content",url_content);
                    this_compose.data("message-list").push(2);
                },
                error: function(jqXHR,textStatus,errorThrown ){
                    // this_compose.data("parse-error",true);
                    this_compose.data("parse-resend",false);
                    //錯誤訊息
                    // toastShow( $.i18n.getString("COMPOSE_PARSE_ERROR") );
                    //判斷關閉副檔區
                    composeCheckMessageList();
                }   
            });  
        }else{
            post_tmp_url = '';
            $(".cp-ta-yql").hide();
            getLinkMeta(this_compose,url);
        }
    },1000);
}


replySend = function(thisEvent){
    var thisEi = thisEvent.data("event-id");
    var thisGi = thisEi.split("_")[0];
    var thisTi = thisEi.split("_")[1];
    var uploadDef = $.Deferred();
    var isWaiting = false;
    var isVdoChk = false;
    var eventTp, fileBody;
    var imgArea = thisEvent.find(".st-reply-message-img");
    var replyFile = imgArea.data("file");
    var replyProgressBar = new ProgressBarCntr(function(){
        var self = this;

        var elem = thisEvent.find(".st-reply-message-area");
        elem.data("cancelupload",false)
        .find(".file-load").remove().end()
        .find('.st-reply-message-img').hide();
        

        self.barDom.set($('<div class="file-load">'
        + '<div class="file-content" percent="0%">'
          + '<div class="load-progress"><div class="bar"></div></div>'
          + '<div class="load-cancel">取消</div>'
        + '</div></div>'));

        elem.prepend(self.barDom.get());

        self.barDom.get().find(".load-cancel").click(function(){
            elem.find('.st-reply-message-img').show();
            self.barDom.get().remove();
            elem.data("cancelupload",true);
            uploadXhr.abort();
        });
    });

    replyProgressBar.onChange = function(pct) {
        var barDom = replyProgressBar.barDom.get();
        barDom.find(".bar").css("width", pct);
        barDom.find('.file-content').attr("percent", pct +"%");
    };

    replyProgressBar.init();

    var body = {meta: {lv : 1, tp: "10"}, ml: []};

    var object_obj = thisEvent.data("object_str");
    if( object_obj ){
        object_obj = $.parseJSON( object_obj );
        body.meta.tu = object_obj;
    }
    var text = thisEvent.find(".st-reply-highlight-container").html()
                         // .replace(/<br\s*\/?>/g,"\n").replace(/&lt;/g,'<').replace(/&gt;/g,'>');
    var tagMembers = thisEvent.find(".st-reply-highlight-container").data("markMembers");
    var tmpElement = document.createElement("div");

    if (tagMembers && Object.keys(tagMembers).length) {
        
        for (var tagID in tagMembers) {
            body.ml.push({
                "u": tagID,
                "n": tagMembers[tagID].nk,
                "tp": 21
            });
            text = text.replace('<mark id="' + tagID + '" name="' + tagMembers[tagID].nk + '">' 
                    + tagMembers[tagID].nk + "</mark>", "///;" + tagID + ";///");
        }
    }

    tmpElement.innerHTML = text;

    body.ml.unshift({
        "c": tmpElement.textContent,
        "tp": 0
    });

    var fileType = imgArea.data("type");

    switch( fileType ){
        case undefined: // 文字
            eventTp = 0;
            uploadDef.resolve({isSuccess: true});
            break;
        case 5: //sticker
            var sticker = imgArea.data("id");
            if( sticker ){
                body.ml.push({
                    "c": sticker,
                    "tp": 5
                });
            }

            uploadDef.resolve({isSuccess: true});
            break;
        case "image": //img
            eventTp = 6;
            //發佈上傳檢查
            upload_chk = true;

            var pi = "0";

            fileBody = {
                fiKey: "c",
                p: 0,
                tp: eventTp
            };

            qmiUploadFile({
                urlAjax: {
                    apiName: "groups/" + thisGi + "/files",
                    method: "post",
                    body: {
                        tp: 1,
                        ti: thisTi,
                        pi: 0,
                        wm: 0,
                    }
                },
                tp: 1,
                hasFi: true,
                file: thisEvent.find(".st-reply-message-img img")[0],
                oriObj: {w: 1280, h: 1280, s: 0.7},
                tmbObj: {w: 480, h: 480, s: 0.6}, // ;
                progressBar: replyProgressBar
            }).done(uploadDef.resolve);
            break;
        case "video": 
            isWaiting = true;
            isVdoChk = true;
            //發佈上傳檢查
            upload_chk = true;

            eventTp = 7;

            fileBody = {
                fiKey: "c",
                p: 0,
                tp: eventTp
            };

            qmiUploadFile({
                urlAjax: {
                    apiName: "groups/" + thisGi + "/files",
                    method: "post",
                    body: {
                        tp: 2,
                        ti: thisTi,
                        pi: 0,
                        wm: 0,
                    }
                },
                tp: 2,
                hasFi: true,
                file: replyFile,
                oriObj: {w: 1280, h: 1280, s: 0.9},
                progressBar: replyProgressBar,
                setAbortFfmpegCmdEvent : function (ffmpegCmd) {
                    $(".load-cancel").off("click").on("click", function(e) {
                        thisEvent.find(".st-reply-message-send").data("reply-chk",false);

                        messageArea.find('.st-reply-message-img').show();
                        messageArea.find(".file-load").remove();
                        messageArea.data("cancelupload", true);

                        ffmpegCmd.kill();
                    });
                },
                updateCompressionProgress: function (percent) {
                    $(".load-bar").css("width", percent + '%');
                    $(".file-content").attr("percent", percent + '%');
                },
            }).done(uploadDef.resolve)

            break;

        case "file": // 檔案上傳
            eventTp = 26;
            //發佈上傳檢查
            upload_chk = true;

            fileBody = {
                ftp: 0,
                fiKey: "fi",
                fn: replyFile.name,
                si: replyFile.size,
                tp: 26
            }

            qmiUploadFile({
                urlAjax: {
                    apiName: "groups/" + thisGi + "/files",
                    method: "post",
                    body: {
                        tp: 0,
                        ti: thisTi,
                        pi: 0,
                        wm: 0,
                    }
                },
                tp: 0,
                hasFi: true,
                file: replyFile,
                oriObj: {w: 1280, h: 1280, s: 0.9},
                progressBar: replyProgressBar
            }).done(uploadDef.resolve)
            break;
    }

    if(!isVdoChk) replyProgressBar.vdoCompressDefer.resolve(false);

    uploadDef.done(function(rspObj) {
        $(".file-load").remove();

        //if fail uploading
        if(rspObj.isSuccess === false){
            if(!messageArea.data("cancelupload")){
                toastShow( $.i18n.getString("COMMON_UPLOAD_FAIL") );
            }
            //loading icon off
            s_load_show = false;
            QmiGlobal.ajaxLoadingUI.hide();
            //set sending flag false
            thisEvent.find(".st-reply-message-send").data("reply-chk",false);
            return;

        } else if(rspObj.data !== undefined) {
            imgArea.show();
            fileBody[fileBody.fiKey] = rspObj.data.fi;
            body.ml.push(fileBody);
        }
        replyApi( thisEvent, thisGi, thisTi, thisEi, body );
    })
}

ProgressBarCntr = function(init) {
    var self = this;
    var vdoCompressDefer = $.Deferred();
    var basePct = 0;
    var currCnt = 0;
    var multiUploadProgress = {
        map: {}, length: 0,
        getTotal: function() {
            var self = this;
            return Object.keys(self.map).reduce(function(total, currId) {
                return total += self.map[currId].total;
            }, 0);
        }
    };
    
    self.init = init;

    self.filesCnt = function() {
        var cnt = 0;
        return {
            get: function() {return cnt;},
            set: function(n) {cnt = n;}
        }
    }();

    self.barDom = function() {
        var barDom = 0;
        return {
            get: function() {return barDom;},
            set: function(dom) {barDom = dom;}
        }
    }();

    self.basePct = function() {
        var basePct = 0;
        return {
            get: function() {return basePct;},
            set: function(pct) {basePct = pct;}
        }
    }();

    self.vdoCompressDefer = vdoCompressDefer;

    self.xhr = function () {
        var xhrId = new Date().getTime();
        var uploadXhr = new window.XMLHttpRequest();
        uploadXhr.upload.addEventListener("progress", function(evt){
            multiUploadProgress.map[xhrId] = multiUploadProgress.map[xhrId] || {};
            multiUploadProgress.map[xhrId].total = evt.total;
            // 先等壓縮結束
            vdoCompressDefer.done(function(isVdoUploaded) {
                if(isVdoUploaded)
                    self.basePct.set(QmiGlobal.vdoCompressBasePct);
                
                setTimeout(function() {
                    var diff = evt.loaded - (multiUploadProgress.map[xhrId].loaded || 0);
                    if(diff < 0) return;
                    multiUploadProgress.length += diff;
                    multiUploadProgress.map[xhrId].loaded = evt.loaded;
                    var pct = getPct(multiUploadProgress.length / multiUploadProgress.getTotal());
                    setProgressBarLength(pct);
                }, 500);
            });
                
        }, false);
        return uploadXhr;

        function getPct(pct) {
            return Math.floor(pct*100)
        }
    };

    self.set = setProgressBarLength;

    self.add = function() {
        if(self.filesCnt.get() === 0) return;
        currCnt++;
        // 先等壓縮結束
        setTimeout(function() {
            self.barDom.get().find("span.curr").attr("num", currCnt);
        }, Math.random()*100 * 5);
    };

    self.close = function() {
        if(self.filesCnt.get() === 0) return;
        $("#compose-progressbar").remove();
    };

    function setProgressBarLength(pct) {
        if(typeof self.onChange === "function")
            self.onChange(pct);
        else
            self.barDom.get().find(".bar").css("width", (Math.floor((pct || 0)*(100-self.basePct.get())/100)+self.basePct.get())+"%");
    }
}



replyApi = function(this_event, this_gi, this_ti, this_ei, body){
    s_load_show = false;
    var api_name = "groups/" + this_gi + "/timelines/" + this_ti + "/events?ep=" + this_ei;

    var headers = {
             "ui":ui,
             "at":at, 
             "li":lang,
                 };

    var method = "post";
    var result = ajaxDo(api_name,headers,method,false,body);
    result.complete(function(data){
        //重新讀取detail
        var this_textarea = this_event.find(".st-reply-message-textarea textarea");
        this_textarea.val("").parent().addClass("adjust").removeClass("textarea-animated");

        //重置 清除附檔區
        this_event.find(".st-reply-message-textarea textarea").val("").end()
        .find(".st-reply-message-img").removeData().html("");

        setTimeout(function(){
            this_event.find(".st-reply-message-send").data("reply-chk",false);
            clearReplyDomData(this_event);
            if(this_event.find(".st-reply-all-content-area").is(":visible")) {
                replyReload(this_event);
            }else{
                if(this_event.find(".st-reply-message-img").is(":visible"))this_event.find(".st-reply-message-img").html("");
                if(this_event.find(".stickerArea").is(":visible")) this_event.find(".stickerArea").hide();
                this_event.find(".st-sub-box-2").trigger("detailShow");
            }
            this_event.find(".st-reply-highlight-container").empty();
            this_event.find(".st-reply-highlight-container")
                      .data("memberList", $.extend({}, QmiGlobal.groups[gi].guAll));
            this_event.find(".st-reply-highlight-container").data("markMembers", {});
        },400);
    });

}

replyReload = function(this_event){

    //把sticker欄收起來
    var stickerIcon = this_event.find(".st-reply-message-sticker");
    if( true==stickerIcon.data("open") ){
        stickerIcon.trigger("click");
    }

    //重設任務完成狀態
    eventStatusWrite(this_event);

    //開啓讚好及留言區塊
    if( true == this_event.find(".st-reply-all-content-area").data("show") ){
        this_event.find(".st-reply-all-content-area").data("show",false);
    }
    this_event.find(".st-reply-like-area").show();

    //單一動態詳細內容
    getEventDetail(this_event.data("event-id")).complete(function(data){
        if(data.status == 200){
            var e_data = $.parseJSON(data.responseText).el;
            detailTimelineContentMake(this_event,e_data,true);
        }
    });
};

clearReplyDomData = function(this_event) {
    //重置
    this_event.find(".st-reply-message-textarea textarea").val("");
    this_event.find(".st-reply-message-img").data("id",null);
    // this_event.find(".st-reply-message-img").data("type",null);
    this_event.find(".st-reply-message-img").data("file",null);
    this_event.find(".st-reply-message-img").html("");  //清掉sticker預覽
}

//timeline more
zoomOut = function (target) {
    target.css("zoom",(zoom_out_cnt/100));
    if(zoom_out_cnt < 100){
        zoom_out_cnt+=4;
        setTimeout(function(){
            zoomOut(target);
        }, 1);
    }
}

zoomIn = function (target)
{
    target.css("zoom",(zoom_in_cnt/100));
    if(zoom_in_cnt > 10){
        zoom_in_cnt-=5;
        setTimeout(function(){
            zoomIn(target);
        }, 1);
    }else{
        target.hide();
    }
}


getGroupList = function(isFromLogin){
    var groupsDeferred = $.Deferred();

    new QmiAjax({
        apiName: "groups",
        apiVer: "apiv2",
        isPublicApi: true
    }).success(function(apiData){
        var allGroupList = apiData.gl || [],
            cloudCompanyArr = (apiData.ccl || []),
            companyListArr = (apiData.cl || []),
            clTokenDefArr = [],
            allGlDeferred = $.Deferred();

        // cloud & company map
        (apiData.ccl || []).forEach(function(item) {
            QmiGlobal.cloudCompanyMap[item.cdi] = item;
        });

        // 加入ldap團體列表
        (apiData.ol || []).forEach(function(ldapObj) {
            QmiGlobal.ldapCompanies[ldapObj.ci] = ldapObj;
            companyListArr[companyListArr.length] = ldapObj;
        });

        if(companyListArr.length !== 0) {
            
            clTokenDefArr = companyListArr.reduce(function(defArr,item){
                defArr.push( getCompanyToken(item));
                return defArr;
            }, []);

            $.when.apply($,clTokenDefArr).done(function(){

                var companyGlDefArr = [];
                // 取得每個私雲得團體列表
                companyListArr.forEach(function(companyData){
                    // 登入時若發現ldap過期 不跳出密碼輸入
                    if(isFromLoginAndLdapExpired(companyData)) {
                        addCompanyReLoadView(companyData);
                        return;
                    }
                    companyGlDefArr.push(getCompanyGroup(companyData,allGroupList));
                })

                // 取得完成
                $.when.apply($,companyGlDefArr).done(allGlDeferred.resolve);

            }) // clTokenDefArr done
        } else {
            allGlDeferred.resolve();
        }// end of if(apiData.cl exist)

        allGlDeferred.done(function(){
            //將group list 更新到 lstorage ui
            groupListToLStorage(allGroupList);
            groupsDeferred.resolve({isSuccess: true, gl: allGroupList});
        });
    }).error(function(rspData) {
        groupsDeferred.resolve({isSuccess: false, data: rspData});
    })

    return groupsDeferred.promise();

    function isFromLoginAndLdapExpired(companyData) {
        if(!isFromLogin) return false;
        if(!companyData) return false;
        if(companyData.et - (new Date().getTime()) < QmiGlobal.ldapExpireTimer) return true;
        return false;
    }
}

getCompanyGroup = function(companyData, allGroupList) {
    var deferred = $.Deferred();

    if(companyData.nowAt === undefined) {
        deferred.resolve({isSuccess: false});
    } else {
        new QmiAjax({
            apiName: "companies/"+ companyData.ci +"/groups",
            ci: companyData.ci
        }).success(function(data){
            (data.gl || []).forEach(function(groupObj){
                // 加入私雲gi 對照表
                QmiGlobal.companyGiMap[groupObj.gi] = {
                    ci: companyData.ci,
                    cl: companyData.cl
                }
                if(allGroupList !== undefined) allGroupList.push(groupObj)
            });

            deferred.resolve({
                isSuccess: true,
                companyGl: data.gl || []
            });
        }).error(function(errData) {
            deferred.resolve({isSuccess:false, data: errData});
        });
    }

    return deferred.promise();
}

getCompanyToken = function(companyData, optionsObj){
    var tokenDeferred = $.Deferred();
    var optionsObj = optionsObj || {};
    var isRedo = optionsObj.isRedo;
    var isCompanyRefresh = optionsObj.isCompanyRefresh;
    
    // 若原本就有 companyData.reAuthDef pending 要等它完成
    $.when($, companyData.reAuthDef).done(function() {
        companyData.reAuthDef = $.Deferred();
        var ctDeferred = companyData.reAuthDef;

        // 直接做cert
        if(optionsObj.isDoCert) {
            doCert(ctDeferred);
        // 需要輸入密碼
        } else if(companyData.passwordTp === 1) {
            QmiGlobal.module.reAuthUILock.lock(companyData);

            QmiGlobal.module.reAuthManually.init({
                reAuthDef: ctDeferred,
                companyData: companyData
            });
        // ctp為 是否需要做cert 的判斷 1是要 0是不要 -> 公雲的company不需要cert
        } else if(companyData.ctp === 0) {
            setCompanyData(companyData, {
                at: QmiGlobal.auth.at,
                et: QmiGlobal.auth.et,
                tp: QmiGlobal.auth.passwordTp ? QmiGlobal.auth.passwordTp : QmiGlobal.auth.at
            })
            ctDeferred.resolve(true);
        } else if(companyData.ctp === undefined) {
            ctDeferred.resolve(false);   

        } else doCert(ctDeferred);

        ctDeferred.done(function(isSuccess) {
            var method = "lock";
            if(isSuccess instanceof Object) isSuccess = isSuccess.isSuccess;
            if(isSuccess) method = "unlock";

            QmiGlobal.module.reAuthUILock[method](companyData);
            tokenDeferred.resolve(isSuccess);
        });
    });

    return tokenDeferred.promise();

    function doCert(ctDeferred) {
        $.ajax({
            url: "https://" + companyData.cl + "/apiv2/cert",
            headers: { li: lang },
            data: JSON.stringify({
                ui: companyData.ui , // private user id
                key: companyData.key,
                tp: 1,  // device type
                dn: QmiGlobal.device,  // device name
                ci: companyData.ci,
                cdi: companyData.cdi
            }),
            type: "post"
        }).success(function(apiData){
            // http status 200:
            // rsp code 406 為驗證的 Key 被串改…
            // rsp code 401 為驗證的內容與請求者不符
            // rsp code 418 Expired Time 逾時
            switch ( apiData.rsp_code ){
                case 200: //成功 繼續下一步
                    // 存入 QmiGlobal.companies
                    setCompanyData(companyData, apiData);
                    ctDeferred.resolve(true);
                    break;
                case 418: // key 過期
                    // 已經重做過了 不再繼續
                    if(isRedo) {
                        ctDeferred.resolve(false);
                        break;
                    }
                    // 重新取key
                    // {il: [{ci:xx,ui:xx},{ci:xx,ui:xx}]}
                    getCompanyKey({ il: [{
                        cdi: companyData.cdi,
                        ci: companyData.ci,
                        ui: companyData.ui
                    }]}).done(function(rspObj){
                        if(rspObj.isSuccess === true) {
                            companyData.key = rspObj.key;
                            getCompanyToken(companyData, {isRedo: true}).done(ctDeferred.resolve);
                        } else ctDeferred.resolve(false);
                    })
                    break;
                // break;
                default: // ?
                    ctDeferred.resolve(false);
            }
        }).error(function(errData){
            if(isCompanyRefresh) addCompanyReLoadView(companyData);
            ctDeferred.resolve(false);
        });
    }

    function setCompanyData(companyData, authData) {
        
        // 設定這次的私雲token
        companyData.nowAt = authData.at;
        companyData.et = authData.et;
        // 驗證形式
        companyData.passwordTp = authData.tp;

        if(QmiGlobal.auth.isSso) 
            companyData.id = QmiGlobal.auth.id;

        // 存入 QmiGlobal.companies
        QmiGlobal.companies[companyData.ci] = companyData;
    }
}

// 重新取得私雲key
getCompanyKey = function(companiesKeyObj){
    var deferred = $.Deferred();

    new QmiAjax({
        apiName: "key",
        apiVer: "apiv2",
        isPublicApi: true,
        body: companiesKeyObj,
        method: "post",
        noErr: true,
        error: function(){
            deferred.resolve({isSuccess: false});
        },
        success: function(data){
            deferred.resolve({isSuccess: true, key: data.il[0].key});
        }
    });
    return deferred.promise();
}


addCompanyReLoadView = function(companyData) {
    if(QmiGlobal.viewMap.hasOwnProperty("refresh_" + companyData.ci) === false) {
         var refreshDom = $('<div class="refresh-item">' +
            '<div>' + companyData.cn + '</div>' +
            '<div>' + $.i18n.getString("REFRESH_TEXT") + '</div>' +
        '<img src="images/refresh01.png"></div>');

        QmiGlobal.viewMap["refresh_" + companyData.ci] = { dom: refreshDom }

        $(".sm-group-list-area-refresh").show().append(refreshDom);

        refreshDom.click(function() {
            companyLoad({
                refreshDom: refreshDom,
                companyData: companyData
            })
        });
    }
}


companyLoad = function(loadData){
    var refreshDom = loadData.refreshDom,
        companyData = loadData.companyData,
        groupCnts = Object.keys(QmiGlobal.groups).length,
        companyLoadDeferred = $.Deferred();

    var isCompanyRefresh = !!refreshDom || !!loadData.isCompanyRefresh;

    if(refreshDom) {
        if(refreshDom.find("img").hasClass("rotate")) return;
        refreshDom.find("img").addClass("rotate");
    }

    getCompanyToken(companyData, {isDoCert: loadData.isDoCert || false}).done(function(isSuccess){
        var tokenDeferred = $.Deferred();
        if(isSuccess === true) {

            getCompanyGroup(companyData).done(function(data) {
                if(data.isSuccess) {
                    // 先找出 新的gi
                    var newGiArr = data.companyGl.reduce(function(arr, currObj){
                        if(QmiGlobal.groups.hasOwnProperty(currObj.gi) === false) arr.push(currObj.gi);
                        return arr;
                    },[])

                    // 將group list 更新到 Global
                    groupListToLStorage(data.companyGl, true);

                    // 打combo更新
                    var comboDefArr = [];
                    data.companyGl.forEach(function(cObj){
                        comboDefArr.push(getGroupComboInit(cObj.gi));
                    });

                    // 等待combo全部完成
                    $.when.apply($,comboDefArr).done(function() {
                        var fail = false;
                        // 全部都成功
                        Array.prototype.forEach.call(arguments,function(item) {
                            if(item.status === false) fail = true;
                        });

                        // 加入reDoPolling 重新打私雲polling做initial
                        QmiGlobal.reDoCompanyPollingMap[companyData.ci] = {
                            pm: {ci: companyData.ci, pt: 9999999999999}
                        }

                        // 全部都成功 才解除私雲移轉
                        if(fail === false) {
                            // 刪除屏蔽ui
                            var companyRefreshViewObj = QmiGlobal.viewMap["refresh_" + companyData.ci];
                            if(companyRefreshViewObj !== undefined) {
                                setTimeout(function() { 
                                    (companyRefreshViewObj.dom || $.fn).remove();
                                    delete companyRefreshViewObj;
                                },1000);
                                setTimeout(function() { toastShow($.i18n.getString("REFRESH_ALERT_SUCCESS"))},500)
                            }
                                
                            Array.prototype.forEach.call(arguments,function(item) {
                                // 判斷是否為新團體
                                // 解除屏蔽標記
                                QmiGlobal.groups[item.thisGi].isRefreshing = false;

                                // sidemenu 新增團體
                                if(newGiArr.indexOf(item.thisGi) >= 0) addSideMenuGroupUI.call($(".sm-group-list-area"), 0, JSON.parse(item.data.responseText));
                            })

                            tokenDeferred.resolve(true);
                        // 某個combo失敗
                        } else tokenDeferred.resolve(false);
                    });
                // 私雲團體列表失敗
                } else tokenDeferred.resolve(false);
            });
        // 私雲token取得失敗
        } else tokenDeferred.resolve(false);

        tokenDeferred.done(function(isSuccess){
            if(isSuccess === false) {
                if(refreshDom !== undefined) {
                    setTimeout(function() { refreshDom.find("img").removeClass("rotate")},1000);
                    setTimeout(function() { toastShow($.i18n.getString("REFRESH_TEXT"))},500);
                } else {
                    // 表示取得私雲失敗 加入重讀取UI
                    if(isCompanyRefresh) addCompanyReLoadView(companyData);
                }

                companyLoadDeferred.resolve({isSuccess: false});
                return;
            }

            // 現在團體 要開啟    
            if($(".refresh-lock").is(":visible") === true) timelineChangeGroup(gi); 

            // 無團體 在建立團體頁面
            if(groupCnts === 0 && $("#page-group-menu").is(":visible")) {
                // 無團體狀態 跳出alert
                new QmiGlobal.popup({
                    title: $.i18n.getString("REFRESH_ALERT_SUCCESS"),
                    desc: $.i18n.getString("REFRESH_ALERT_CONFIRM"),
                    confirm: true,
                    cancel: true,
                    action: [function(){
                        $.mobile.changePage("#page-group-main");

                        // 找出第一個私雲團體即可
                        gi = function() {
                            var chk = false, firstGi;
                            Object.keys(QmiGlobal.companyGiMap).forEach(function(cgi) {
                                // 找到第一個私雲團體即可
                                if(QmiGlobal.companyGiMap[cgi].ci === companyData.ci
                                    && chk === false) {
                                    chk = true;
                                    firstGi = cgi;
                                }
                            });
                            return firstGi;
                        }();

                        if(gi !== undefined) {
                            timelineChangeGroup(gi);
                        } else {
                            new QmiGlobal.popup({
                                desc: $.i18n.getString("COMMON_UNKNOWN_ERROR"),
                                confirm: true
                            })

                        };
                    }] // Qmi popup 結束
                });

            }; // 無團體 在建立團體頁面 結束
            companyLoadDeferred.resolve({isSuccess: true});
        }); // tokenDeferred 結束
    }); // getCompanyToken 結束

    return companyLoadDeferred.promise();
}


polling = function(){ 
    // 重整檢查
    QmiGlobal.appReload.chk();

    // 開啓polling檢查機制
    if(window.QmiPollingChk.flag === false) window.QmiPollingChk.flag = true;

    if(!$.lStorage("_pollingData")) 
        $.lStorage("_pollingData",{cnts: {},ts: {pt: new Date().getTime()}})

    var pollingDeferred = $.Deferred(),
        localPollingData = $.lStorage("_pollingData"),
        publicPollingTime = localPollingData.ts.pt;

    new QmiAjax({
        apiName: "sys/polling?pt=" + publicPollingTime,
        isPublicApi: true
    }).complete(function(data){
        if(data.status == 200){
            var newPollingData = $.parseJSON(data.responseText);
            newPollingData.publicPollingTime = publicPollingTime;

            // 合併私雲polling 而且每個私雲polling 都要有自己的時間
            combineCompanyPolling(newPollingData).done(function(pollingObj){

                var newPollingData = pollingObj.newPollingData,
                    tmp_cnts = newPollingData.cnts || [];

                // new_pollingData.cnts = {};
                newPollingData.cnts = localPollingData.cnts || [];
                //cnts 做合併
                $.each(tmp_cnts,function(i,val){
                    var tmp_gi_obj = $.extend(localPollingData.cnts[val.gi],val);
                    newPollingData.cnts[val.gi] = tmp_gi_obj;
                });

                //gcnts 做合併
                newPollingData.gcnts = $.extend( (localPollingData.gcnts || {}), (newPollingData.gcnts || {}) );

                //暫存
                if(!$.lStorage("_tmpPollingData"))
                    $.lStorage("_tmpPollingData",newPollingData);

                //寫入數字
                pollingCountsWrite(newPollingData);
                
                //cmds api
                pollingCmds(newPollingData).done(function(){
                    pollingDeferred.resolve({
                        name: "success",
                        status: true,
                        interval: polling_interval
                    });
                });
            }); // 合併私雲polling

        }else if(data.status == 401){
            //錯誤處理
            pollingDeferred.resolve({
                name: "else401",
                status: false,
                stop: true
            });

            localStorage.removeItem("_loginData");
            popupShowAdjust("",$.i18n.getString("WEBONLY_LOGOUT_BY_ANOTHER_DEVICE"),true,false,[reLogin]);
            return false;
        }else{
            cns.debug("polling err:",data);
            //失敗就少打
            pollingDeferred.resolve({
                name: "else",
                status: false,
                interval: polling_interval*2
            });
            return false;
        }
    });

    pollingDeferred.done(function(resultObj){
        // 表示polling有在更新
        window.QmiPollingChk.cnt++;

        if ( QmiGlobal.pollingOff === true || resultObj.stop === true) {
            // do nothing
        } else {
            setTimeout(function(){
                polling();
            }, resultObj.interval);
        }
    });
    return pollingDeferred;
}

combineCompanyPolling = function(newPollingData){
    var combineDeferred = $.Deferred(),
        companyPollingDefArr = [];

    getPollingArr().forEach(function(item){

        // 設定這個私雲的pollingTime
        var companyPollingDef = $.Deferred();
        new QmiAjax({
            apiName: "sys/polling?pt=" + item.pm.pt,
            isPolling: true,
            ci: item.pm.ci
        }).success(function(data){
            
            companyPollingDef.resolve({
                ci: item.pm.ci,
                data: data,
                isSuccess: true
            });

            // 成功而且時間不再前進 就清除pollingTime
            var reDoObj = QmiGlobal.reDoCompanyPollingMap[item.pm.ci];
            if(reDoObj && reDoObj.pm.pt === data.ts.pt)
                delete QmiGlobal.reDoCompanyPollingMap[item.pm.ci];
            // 9999999999999 是第一次登入所帶入 不存
            else if(item.pm.pt !== 9999999999999) {
                item.pm.pt = data.ts.pt;
                QmiGlobal.reDoCompanyPollingMap[item.pm.ci] = item;
            }

        }).error(function(data){
            // 失敗就存起來下次繼續打
            QmiGlobal.reDoCompanyPollingMap[item.pm.ci] = item;

            companyPollingDef.resolve({
                ci: item.pm.ci,
                data: data,
                isSuccess: false
            });
        });
        companyPollingDefArr.push(companyPollingDef) // new QmiAjax ; companyPollingDefArr.push
    });

    $.when.apply($,companyPollingDefArr).done(function(){
        // 設定arguments(array-like object)
        Array.prototype.forEach.call(arguments,function(item){
            if(item.isSuccess === false) return;

            var apiData = item.data;

            // 把私雲的這些項目加到公雲 統一處理
            ["cnts", "cmds", "msgs", "ccs"].forEach(function(key){
                newPollingData[key] = (newPollingData[key] || []).concat((apiData[key] || []));
            });

            // gcnts 是公雲才有 不處理
        })
        // 每個私雲的polling時間都更新完成 return 物件
        combineDeferred.resolve({
            newPollingData: newPollingData
        });
    })
    return combineDeferred.promise();


    function getPollingArr() {
        // 第一次polling需要打全部的私雲
        if(QmiGlobal.isFirstPolling) {
            QmiGlobal.isFirstPolling = false; // disable
            return Object.keys(QmiGlobal.companies).reduce(function(arr, currCi) {
                // 公雲company不打
                if(QmiGlobal.companies[currCi].ctp === 0) return arr;
                // ldap初次登入若過期不打
                if(!isLdapAndTokenExpired(currCi)) {
                    arr.push({
                        pm:{ci: currCi, pt: 9999999999999}
                    });
                }
                return arr;
            }, []);

            function isLdapAndTokenExpired(currCi) {
                var cpnObj = QmiGlobal.companies[currCi] || {};
                if(cpnObj.passwordTp !== 1) return false;
                if((cpnObj.et - (new Date().getTime())) < QmiGlobal.ldapExpireTimer) return true;
                return false;
            }
        } else {

            // 先將私雲polling加進來
            var newCmdsArr = newPollingData.cmds.filter(function(item){
                // 有存過的ci 才去取polling
                return  (item.tp === 51 && QmiGlobal.companies.hasOwnProperty(item.pm.ci) === true);
            })

            // 加入需要重打的polling ; reDoCompanyPollingMap存有要重打的私雲資訊 
            // 把他轉成array再加入不重複的新的polling 51
            return Object.keys(QmiGlobal.reDoCompanyPollingMap).map(function(thisCi) {
                return QmiGlobal.reDoCompanyPollingMap[thisCi];
            }).concat(newCmdsArr.reduce(function(arr, cmdObj) {
                if(!QmiGlobal.reDoCompanyPollingMap[cmdObj.pm.ci]) arr.push(cmdObj)
                return arr;
            }, []));
        }
    }
}


pollingCountsWrite = function(pollingData, aa){
    var pollingData = pollingData || $.lStorage("_pollingData");
    var cntsAllObj  = pollingData.cnts || {};
    var gcnts       = pollingData.gcnts || { G1: 0, G3: 0 };
    var groupsData  = QmiGlobal.groups;
    var appBadgeNumber = 0;
    var sort_arr = []; //排序用
    // var getNoticesDefer = $.Deferred();

    // 先將當前團體的 cnts 更新在 ui 中
    if( cntsAllObj.hasOwnProperty( gi ) === true ) {
        var thisCntObj = cntsAllObj[gi];

        ["A1", "A2", "A4"].forEach(function(key){
            var smCountA = $(".polling-cnt[data-polling-cnt="+ key +"] .sm-count").hide();

            if ( thisCntObj.hasOwnProperty(key) === true && thisCntObj[key] > 0 ) {

                if (key == "A1") {
                    smCountA.show()
                    .html(countsFormat(thisCntObj[key], smCountA))
                    .data("gi",gi);
                } else {
                    // 部分動態tab 如果是active 消除cnts
                    if( smCountA.parent().hasClass("active") === true){
                        updatePollingCnts( smCountA, key );
                    } else {
                        smCountA.show()
                        .html(countsFormat(thisCntObj[key], smCountA))
                        .data("gi",gi);
                    }
                }
            }
        });

        // 有cl 就更新 聊天室列表的cnt
        if( thisCntObj.hasOwnProperty("cl") === false ) thisCntObj.cl = [] ;

        var countA3 = 0; // 聊天室tab的cnt用加的
        thisCntObj.cl.forEach(function(obj){
            var tmpDiv = $(".sm-cl-count[data-ci=" + obj.ci + "]").hide();
            if (obj.B7 > 0) {
                // 正開啟的聊天室 不要秀cnt 然後put b7
                if( windowList.hasOwnProperty( obj.ci ) && windowList[obj.ci].closed === false ) {
                    updatePollingCnts( $("div.polling-cnt-cl[data-ci="+ obj.ci +"]").find(".sm-cl-count"),"B7");
                } else {
                    tmpDiv.html(countsFormat(obj.B7, tmpDiv)).show();    
                }

                countA3 += obj.B7;
            }
        })

        var countA3Dom = $(".polling-cnt[data-polling-cnt=A3] .sm-count");
        if(countA3 > 0) 
            countA3Dom.html(countsFormat(countA3, countA3Dom)).show();
        else
            countA3Dom.hide();
    }

    // idb_alert_events.getAll(function(noticeList){
    //     getNoticesDefer.resolve(noticeList);
    // })

    // getNoticesDefer.done(function(noticeList) {
        // 再將此次polling cnts 填入 QmiGlobal.groups的chatAll[ci].cnt 以便setLastMsg時 有unReadCnt數字
        Object.keys(cntsAllObj).forEach(function(thisGi){
            var thisCntObj = cntsAllObj[thisGi],
            thisQmiGroupObj = groupsData[thisGi],
            groupBadgeNumber = 0;

            var dom = $(".sm-group-area[data-gi=" + thisGi + "]").find(".sm-count").hide();

            // 移轉 隱藏polling
            if((QmiGlobal.groups[thisGi] || {}).isRefreshing === true) return;

            if ( thisCntObj.A2 > 0 || thisCntObj.A5 > 0) {
                groupBadgeNumber = ((thisCntObj.A2) ? thisCntObj.A2 : 0) 
                    + ((thisCntObj.A5) ? thisCntObj.A5 : 0);

                sort_arr.push([thisGi,thisCntObj.A5]);
                dom.html(countsFormat(groupBadgeNumber, dom)).show();

                appBadgeNumber += groupBadgeNumber;
            }

            // 無cl 或 未有此gi 就不做
            if( thisCntObj.hasOwnProperty("cl") === false ||
                thisQmiGroupObj === undefined ||
                thisQmiGroupObj.hasOwnProperty("chatAll") === false 
            ) return ;

            thisCntObj.cl.forEach(function(clObj){
                if( thisQmiGroupObj.chatAll.hasOwnProperty( clObj.ci ) === true ) 
                    thisQmiGroupObj.chatAll[ clObj.ci ].unreadCnt = clObj.B7
            })

        })

        //排序
        sort_arr.sort(function(a, b) {return a[1] - b[1]});
        sort_arr.forEach(function(obj){
            var sortedGroup = $(".sm-group-list-area .sm-group-area[data-gi="+ obj[0] +"]")
            sortedGroup.detach();

            // 官方帳號判斷
            try {
                if(QmiGlobal.groups[obj[0]].ntp === 2)
                    var targetDom = $(".sm-offical-group");
                else
                    var targetDom = $(".sm-general-group");

                targetDom.after(sortedGroup);
            } catch(e) { /* do nothing */}
        })
    // });
    


    //邀請 若是在團體邀請頁面時 則不寫入
    if(gcnts.G1 > 0){
        $(".hg-invite .sm-count").html(gcnts.G1).show();
    }
    if(gcnts.G2 > 0){
        //最新消息
    }
    if(gcnts.G3 > 0){
        //鈴鐺
        if( typeof(showNewAlertIcon)!='undefined' ) showNewAlertIcon( gcnts.G3 );
    }

    if (appBadgeNumber > 0) setBadgeLabel(appBadgeNumber.toString());
    else clearBadgeLabel();
        
}

//polling 事件 newPollingData
pollingCmds = function(newPollingData){
    var newCmdsArr = [];
    var user_info_arr = [];// 存tp4,5,6
    var leavedGiArr = []; // tp6 gu == me 自己離開團體
    var branch_info_arr = [];
    var isUpdateMemPage = false;
    var onGetMemDataCallback = null;
    var comboDeferredPoolArr = [];
    var pollingDeferredPoolArr = [
            $.Deferred(),   // tp4,5,6 更新成員資訊
            $.Deferred(),   // branchlist 更新
            $.Deferred()    // cmdsArrangement
        ];

    var allCmdsDoneDeferred = $.Deferred();

        // 是否先取得團體列表的deferred
    var groupListDeferred = $.Deferred();

    // 先分類 取各組的最後一筆即可
    cmdsArrangement().done(function(){
        // 需要打combo的情況
        newPollingData.cmds.sort(function(a, b) {
            return a.ct - b.ct;
        }).forEach(function(item, i, arr){ // 後面有 bind([]) 用this來判斷是否重複

            var comboDeferred = $.Deferred();
            var insideDeferred = $.Deferred();

            // 如果是自己被踢出團體了 不能打combo
            // 自己被踢出團體 加到leavedGiArr 會合併到exceptArr
            // 必須一個一個去判斷 所以擺第一個
            // 直接先做離開團體
            if( item.tp === 6 
                && item.pm.gu === (QmiGlobal.groups[item.pm.gi] || {}).me){
                pollingLeaveGroup(item.pm.gi);
                leavedGiArr.push(item.pm.gi);
                insideDeferred.resolve(false);  
            }

            // 不重複的gi)
            else if(this.indexOf(item.pm.gi) >= 0) insideDeferred.resolve(false);
            
            // item.tp = 6 會這樣
            else if(QmiGlobal.groups[(item.pm || {}).gi] === undefined) {
                insideDeferred.resolve(false);
            }
            
            // 更新group info 強制打
            else if( item.tp === 10 ){
                insideDeferred.resolve(true);    
            }
            // 不重複的gi & 沒guAll
            else if ( 
                item.tp !== 11                  &&  // 上面做過了
                item.pm.gi !== undefined        &&  // tp 3 是告知有邀請 會沒有tp
                ( QmiGlobal.groups[item.pm.gi] === undefined || Object.keys( QmiGlobal.groups[item.pm.gi].guAll ).length === 0 )
            ){
                insideDeferred.resolve(true);
            } 
            //有人加入或退出團體(因為當前團體)
            else if ( item.tp === 6 || item.tp === 5 || item.tp === 4){
                insideDeferred.resolve(true);  
            } 
            // 不用做combo
            else insideDeferred.resolve(false);

            insideDeferred.done(function(status){
                if( status === false ) return;
                comboDeferredPoolArr.push(comboDeferred);
                getGroupComboInit(item.pm.gi).done(function(result){
                    if(leavedGiArr.indexOf(item.pm.gi) < 0) leavedGiArr.push(item.pm.gi);
                    comboDeferred.resolve(result);
                });
            })
            this.push(item.pm.gi);
        }.bind([]))

        $.when.apply($, comboDeferredPoolArr).done(function(){
            var pollingDataTmp = $.lStorage("_pollingData");
            var currentPollingCt = 9999999999999;
            var isShowNotification = true;
            var newGroupArr = [];
            var cmdEachDefArr = [];
            var isDoUpdateAlert = false;

            if(pollingDataTmp) currentPollingCt = pollingDataTmp.ts.pt;

            //判斷聊天訊息預覽開關
            if($.lStorage("_setnoti")==100 || set_notification == true)
                isShowNotification = true;
            else if($.lStorage("_setnoti")==300 || set_notification == false)
                isShowNotification = false;

            if( (currentPollingCt+300000) < login_time )
                isShowNotification = false;

            // 等等要剔除這次打過combo的tp4,5,6 避免重複api -> arguments是array-like Object
            var exceptArr = Array.prototype.map.call(arguments,function(item) {return item.thisGi; });

            newPollingData.cmds.forEach(function(item){
                // 首先判斷如果有離開團體 就不要做了
                // tp = 6 還是要做 才會有離開團體的動作
                if(leavedGiArr.indexOf(item.pm.gi) >= 0 && item.tp !== 6) return;

                // 剛做過的4, 5, 6
                if((item.tp == 4 || item.tp == 5 || item.tp == 6) 
                && exceptArr.indexOf(item.pm.gi) >= 0) return;

                switch(item.tp){
                    case 1://timeline list
                        if(item.pm.gi == gi && window.location.hash == "#page-group-main") {
                            polling_arr = false;
                            idbPutTimelineEvent("",false,polling_arr);
                        }

                        // 做一次
                        if(isDoUpdateAlert === false) {
                            isDoUpdateAlert = true;    
                            updateAlert();
                        }
                        
                        break;
                    case 3://invite
                        if( $("#page-group-menu").is(":visible") && false==$("#page-group-main").is(":visible"))
                            $(".hg-invite").trigger("click");
                        
                        try{
                            if( isShowNotification ){
                                riseNotification (null, QmiGlobal.title, $.i18n.getString("GROUP_RECEIVE_INVITATION"), function(){
                                    $(".hg-invite").trigger("click");
                                });
                            }
                        } catch(e) {cns.debug( e.message )}
                        break;
                    case 4: //someone join

                        item.pm.isNewMem = true;
                        updateSideMenuContent(item.pm.gi);

                        item.pm.onGetMemData = function(thisGi, memData){
                            // 官方帳號不顯示
                            try{
                                if( isShowNotification 
                                    && QmiGlobal.groups[thisGi].ntp !== 2
                                ){
                                    var title = QmiGlobal.groups[thisGi].gn || QmiGlobal.title;

                                    if (memData.gu == QmiGlobal.groups[thisGi].me) {
                                        toastShow($.i18n.getString("GROUP_X_JOIN_GROUP", $.i18n.getString("COMMON_YOU")) + title);
                                    } else {
                                        riseNotification( null, title, 
                                            $.i18n.getString("GROUP_X_JOIN_GROUP", memData.nk), 
                                            function(){
                                                if( gi==thisGi ){
                                                    $(".sm-small-area[data-sm-act=memberslist]").trigger("click");
                                                } else {
                                                    $(".sm-group-area[data-gi="+thisGi+"]").trigger("click");
                                                }
                                            }
                                        );
                                    }
                                }
                            } catch(e){
                                errorReport(e);
                            }
                        }
                        user_info_arr.push( item.pm );

                        if( gi == item.pm.gi ) isUpdateMemPage = true;
                        break;
                    case 5://edit user info
                        user_info_arr.push( item.pm );

                        updateSideMenuContent(item.pm.gi);
                        
                        if( gi == item.pm.gi ) isUpdateMemPage = true;
                        break;
                    case 6://delete user info
                        
                        if(QmiGlobal.groups[item.pm.gi]) {
                            $.each(windowList, function(index, val) {
                                if(!windowList[index].closed && val.g_room.memList[item.pm.gu]) {
                                    if(val.g_room.tp == 1) {
                                        windowList[index].popupShowAdjust('',$.i18n.getString("CHAT_SOMEONE_LEAVE_GROUP", (QmiGlobal.groups[item.pm.gi].guAll[item.pm.gu].nk || "").replaceOriEmojiCode()),true,false,[function(){
                                            windowList[val.ci].close();
                                        }]);
                                    }else {
                                        windowList[val.ci].popupShowAdjust('',$.i18n.getString("CHAT_SOMEONE_LEAVE_GROUP", (QmiGlobal.groups[item.pm.gi].guAll[item.pm.gu].nk || "").replaceOriEmojiCode()),true,false);
                                    }
                                    updateChatList(item.pm.gi);
                                }
                            });
                        }

                        updateSideMenuContent(item.pm.gi);

                        item.pm.onGetMemData = function(thisGi, memData){
                            try{
                                if( isShowNotification ){
                                    var title = QmiGlobal.groups[thisGi].gn || QmiGlobal.title;
                                    riseNotification( null, title, $.i18n.getString("GROUP_X_LEAVE_GROUP", memData.nk), function(){
                                        if( gi==thisGi ){
                                            $(".sm-small-area[data-sm-act=memberslist]").trigger("click");
                                        } else {
                                            $(".sm-group-area[data-gi="+thisGi+"]").trigger("click");
                                        }
                                    });
                                }
                            } catch(e){errorReport(e);}
                        }
                        if( gi == item.pm.gi ) isUpdateMemPage = true;
                        break;
                    case 7://branch edit
                        if( item.pm.gi !== undefined ) branch_info_arr.push( item.pm );
                        break;
                    case 10://group info edit
                        // 上面打過combo 更新過了
                        if( gi == item.pm.gi ){
                            var tmp = $(".sm-small-area:visible");
                            var grouptmp = $(".sm-group-area[data-gi="+gi+"]");
                            grouptmp.trigger("click");
                            if(tmp.length>0) $(tmp[0]).trigger("click");
                        }
                        break;
                    case 11://create group
                        newGroupArr.push(item.pm.gi);
                        break;
                    case 12://delete group
                        removeGroup( item.pm.gi );
                        break;
                    case 41://聊天室邀請或踢除別人
                        updateChatList(item.pm.gi);
                        break;
                    case 45://被別人踢出聊天室
                        if(windowList[item.pm.ti] && !windowList[item.pm.ti].closed)
                            windowList[item.pm.ti].close();

                        updateChatList(item.pm.gi);
                        break;    

                    case 52:
                        QmiGlobal.groups[item.pm.gi].set.ccc = item.pm.gcc;
                        if (item.pm.gcc > 0) {
                            onRemoveChatDB(item.pm.gi, item.pm.gcc);
                        }
                        break;

                    case 53: // 歸戶 有新ldap company加入 提供ldap資訊
                        var newData = (item.pm || {}).o_info;
                        if(!newData) break;

                        var cmd53Def = $.Deferred();
                        var companyData;
                        cmdEachDefArr.push(cmd53Def);
                        
                        if(QmiGlobal.companies[newData.ci]) {
                            companyData = QmiGlobal.companies[newData.ci];
                            companyData.passwordTp = newData.tp;

                            // 已經存在 重新取key 避免中間再次綁過 token會失效
                            getCompanyKey({ il: [{
                                cdi: companyData.cdi,
                                ci: companyData.ci,
                                ui: companyData.ui
                            }]}).done(function(rspObj){
                                if(rspObj.isSuccess === true) {
                                    companyData.key = rspObj.key;
                                    getCompanyToken(companyData, {isRedo: true, isDoCert: true})
                                    .done(cmd53Def.resolve);
                                } else {
                                    QmiGlobal.module.reAuthUILock.lock(companyData)
                                    cmd53Def.resolve();
                                }
                            })
                        } else {
                            companyData = newData;
                            companyData.passwordTp = newData.tp;
                            companyLoad({companyData: companyData, isCompanyRefresh: true, isDoCert: true}).done(function() {
                                cmd53Def.resolve()
                            });
                        }
                        break;

                    case 54: // 私雲移轉 團體ui屏蔽
                        (item.pm.gl || []).forEach(function(thisGi){
                            (QmiGlobal.groups[thisGi] || []).isRefreshing = true;

                            // 現在團體 要關閉
                            if(thisGi === QmiGlobal.currentGi) timelineChangeGroup(thisGi); 

                            // 關閉移轉團體所有聊天室
                            (QmiGlobal.windowListCiMap[thisGi] || []).forEach(function(thisCi){
                                windowList[thisCi].close();
                            })
                        })
                        break;

                    case 55: // 私雲移轉結束 驗證、團體combo後ui屏蔽開啓
                        // getCompanyToken cl ui key ci
                        // 注意 這裡沒有使用到polling給的gl 預期他會跟54成對 若沒有就會有錯
                        companyLoad({companyData: item.pm.c_info, isCompanyRefresh: true})
                        break;

                    case 56: // ldap 解除綁定
                        removeCompany(item.pm);
                        break;

                    case 57: // ldap 變更驗證形式及期限 都強制做一次cert
                        var newData = item.pm || {};
                        var companyData = QmiGlobal.companies[newData.ci];
                        if(!companyData) break;

                        var cmd57Def = $.Deferred();
                        cmdEachDefArr.push(cmd57Def);

                        companyData.passwordTp = newData.tp;
                        getCompanyToken(companyData).done(function() {
                            cmd57Def.resolve();
                        });
                        break;

                    case 58:
                        var pollingData = item.pm || {};
                        resetCompanyAccountPassword({
                            id: pollingData.id, 
                            ci: pollingData.ci,
                            url: $.lStorage("_loginData").url,
                        });
                        break;

                    case 60:
                        if (QmiGlobal.auth.isSso) {
                            new QmiGlobal.popup({
                                desc: (item.pm || {}).msg,
                                confirm: true,
                                action: [reLogin]
                            });
                            return;
                        }
                        break;
                    case 61:

                        break;
                }

            }); // end of newPollingData.cmds forEach 

            //將tp4,5,6 的user info都更新完 再更新polling時間
            if(user_info_arr.length > 0){
                getMultipleUserInfo(user_info_arr, true, false, function(isSucc){
                    if(isUpdateMemPage ) updateBranchMemberCnt(gi);
                    pollingDeferredPoolArr[0].resolve();
                });
            } else pollingDeferredPoolArr[0].resolve();

            var branchDeferredPoolArr = [];
            branch_info_arr.forEach(function(item){
                var branchDeferred = $.Deferred();
                if( this.indexOf(item.gi) < 0 ) {
                    updateBranchList( item.gi,function(giTmp){
                        if( giTmp === gi ) updateContactBranchList();
                        branchDeferred.resolve();
                    });
                } else {
                    branchDeferred.resolve();
                }

                branchDeferredPoolArr.push(branchDeferred);
                this.push(item.gi);
            }.bind([]));
            $.when.apply($, branchDeferredPoolArr).done(pollingDeferredPoolArr[1].resolve);

            // pollingCmds forEach deferred done
            $.when.apply($, cmdEachDefArr).done(pollingDeferredPoolArr[2].resolve);
        }) // comboDeferredPoolArr deferred done
    }) // cmdsArrangement deferred done

    // 全部 cmds 處理完
    $.when.apply($, pollingDeferredPoolArr).done(function(){
        pollingUpdate(newPollingData);
        allCmdsDoneDeferred.resolve();
    })

    return allCmdsDoneDeferred.promise();

    function cmdsArrangement() {
        var arrangementDef = $.Deferred();
        var groupListUpdateFlag = false; // tp 4,11 表示有新的gi 就先做groups

        // cmds 分組 需要取最後一個 其餘捨棄
        var cmdsClassifyArr = [
            {tp: [4, 6],    idFlag: "gu"}, // 加入、退出成員 同一gu取最後一個
            {tp: [53, 56],  idFlag: "ci"}, // company加入退出 並根據ci分類
            {tp: [57],      idFlag: "ci"} // company更改驗證tp 並根據ci分類
        ].map(function(item) {
                item.tempObj = {}; // 預設存儲物件
                return item;
        });

        newPollingData.cmds = newPollingData.cmds.reduce(function(arr, item) {
            item.pm = item.pm || {};
            var passFlag = true; 

            // tp11 是新團體 或 gi不在 現有列表中 就要統一做一次取得團體列表
            if(item.tp === 11 || isGiNotExist(item.pm.gi))
                groupListUpdateFlag = true;

            // 取各組的ct最大值
            cmdsClassifyArr.forEach(function(ccObj) {
                ccObj.tp.forEach(function(cctp) {
                    if(item.tp !== cctp) return;
                    passFlag = false; // 把存在cmdsClassifyArr的所有tp先挑除
                    
                    // 需要根據id再分類
                    var key = "only";
                    if(item.pm[ccObj.idFlag]) key = ccObj.idFlag;

                    var thisTempObj = ccObj.tempObj[item.pm[key]] || {ct: 0};
                    ccObj.tempObj[item.pm[key]] = thisTempObj.ct > item.ct ? thisTempObj : item;
                })
            });
             // 把存在cmdsClassifyArr的所有tp先挑除
            if(passFlag) arr.push(item); 
            return arr;
        }, []);
        
        cmdsClassifyArr.forEach(function(ccObj) {
            Object.keys(ccObj.tempObj).forEach(function(key) {
                newPollingData.cmds.push(ccObj.tempObj[key]);  
            })
        });
        
        if(groupListUpdateFlag) 
            groupMenuListArea().done(arrangementDef.resolve);
        else 
            arrangementDef.resolve();

        return arrangementDef.promise();
    }

    function isGiNotExist(thisGi) {
        if(!thisGi) return false;
        if(QmiGlobal.groups[thisGi]) return false;
        return true;
    }

    function pollingLeaveGroup(thisGi) {
        removeGroup(thisGi);
        (QmiGlobal.windowListCiMap[thisGi] || []).forEach(function(thisCi){
            if(windowList[thisCi].closed) return;
            windowList[thisCi].popupShowAdjust('',$.i18n.getString("GROUPSETTING_LEAVE_GROUP"),true,false,[function(){
                windowList[thisCi].close();
            }]);
        })
    }
}


pollingUpdate = function(newPollingData){
    
    //更新polling時間
    $.lStorage("_pollingData",$.lStorage("_tmpPollingData"));
    localStorage.removeItem("_tmpPollingData");

    //更新聊天內容
    if(newPollingData.msgs && newPollingData.msgs.length>0){
        setTimeout(sortRoomList, 100);
        onReceivePollingChatMsg(newPollingData.msgs);
    }

    //更新聊天已讀未讀時間
    if(newPollingData.ccs && newPollingData.ccs.length>0){
        onReceivePollingChatCnt(newPollingData.ccs);
    }
}

countsFormat = function(num, badgeDom){
    badgeDom.removeClass("over99");
    var newNum = num;
    if(num > 99) {
        badgeDom.addClass("over99");
        newNum = "99+"
    }
    return newNum;
}

updatePollingCnts = function(countDom,cntType){

    var thisGi = countDom.data("gi") || gi,
        isPublicApi = false,
        body = {
            cnts: [],
            gcnts: {}
        };

    if(cntType.substring(0,1) == "G"){
        body.gcnts[cntType] = 0;
        isPublicApi = true; // g 都打公雲
    }else{
        body.cnts[0] = { gi: thisGi };

        if( countDom.hasClass("sm-cl-count") ){
            body.cnts[0].cl = [];

            var obj = {},
                ciTmp = countDom.data("ci");

            if( ciTmp === undefined ) return;

            obj[cntType] = 0;
            obj.ci = ciTmp;
            body.cnts[0].cl.push(obj);
        } else {
            body.cnts[0][cntType] = 0;
        }
    }

    new QmiAjax({
        apiName: "sys/counts",
        method: "put",
        body: body,
        isPublicApi: isPublicApi
    }).complete(function(data){
        if(data.status == 200){
            // 把local cnts 清掉
            try {
                var tempPollingData = $.lStorage("_pollingData");

                // gcnts
                if(cntType.substring(0,1) == "G"){
                    tempPollingData.gcnts[cntType] = 0;

                    $.lStorage("_pollingData",tempPollingData);
                    return;
                }

                if(typeof ciTmp === "undefined") {

                    tempPollingData.cnts[thisGi][cntType] = 0;

                } else if(tempPollingData.cnts[thisGi].cl !== undefined) {
                    tempPollingData.cnts[thisGi].cl.forEach(function(item){
                        if(item.ci === ciTmp) item[cntType] = 0;
                    })
                }
                
                $.lStorage("_pollingData",tempPollingData);
            } catch(e) {
                // do something..
            }
        }
    });
}

updateBranchMemberCnt = function(this_gi){
    try{
        var _groupList = QmiGlobal.groups;
        var guAll = _groupList[this_gi].guAll;
        var bl = _groupList[this_gi].bl;
        for( var biTmp in bl ){
            //每個群組走過一次所有成員, 只要含有這個群組ＩＤ數量就加一..
            var cnt=0;
            for( var id in guAll ){
                var mem = guAll[id];
                if( mem && mem.st==1 && mem.bl.indexOf(biTmp)>=0 ){
                    cnt++;
                }
            }
            bl[biTmp].cnt = cnt;
        }
        _groupList[this_gi].bl = bl;
        // *--* $.lStorage(ui, _groupList);

        if( this_gi==gi && $(".subpage-contact").length>0 ){
            initContactList();
        }
    } catch(e){
        errorReport(e);
    }
}

updateAddressbookFavoriteStatusApi = function( this_gi, al, dl ){
    //PUT groups/G000006s00q/favorite_users
    var api_name = "groups/" + this_gi + "/contacts/favorites";
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

eventDetailShow = function(thisEi){
    var deferred = $.Deferred();

    $('<div>').load('layout/timeline_event.html .st-sub-box',function(){
        var thisEvent = $(this).find(".st-sub-box");
        thisEvent.addClass("detail");
        $(".timeline-detail").html(thisEvent).hide();
        
        //單一動態詳細內容
        var thisGi = thisEi.split("_")[0];
        var thisTi = thisEi.split("_")[1];

        new QmiAjax({
            apiName: "groups/" + thisGi + "/timelines/" + thisTi + "/events/" + thisEi
        }).complete(function(data){
            if(data.status == 200){
                var data_obj = $.parseJSON(data.responseText);
                try{
                    if(data_obj.el[0].meta.del== true) {
                        new QmiGlobal.popup({
                            title: $.i18n.getString("FEED_EVENT_DELETED"),
                            desc: "", // 增加ui空間 美觀
                            confirm: $.i18n.getString("COMMON_OK")
                        })
                    } else {
                        $.mobile.changePage("#page-timeline-detail", {transition: "slide"});
                        timelineBlockMake(thisEvent,[data_obj.el[0]],false,true);
                    }
                } catch(e){
                    errorReport(e);
                    deferred.resolve({isSuccess: false,data: data});
                }
            } else {
                deferred.resolve({isSuccess: false,data: data});
            }
            
        });
    });

    return deferred.promise();
}

timelineMainClose = function(){
    $("#page-group-main").data("main-gu",false);
    $(".gm-user-main-area").hide();
    $(".st-feedbox-area div[data-feed=main]").html("");
    $(".user-main-toggle").show();
}

timelineScrollTop = function(){
    $(".gm-content").scrollTop(0);
    $(".st-filter-area").removeClass("fixed");
}

timelineEditStatus = function( this_event, type, callback ){
    var event_status = this_event.data("event-val");

    var this_ei = this_event.data("event-id");
    var this_gi = this_ei.split("_")[0];
    var this_ti = this_ei.split("_")[1];

    try{
        var act = 0;
        var typeName = "";
        switch( type ){
            case 3:
                typeName = "is";
                break;
            case 8:
                typeName = "top";
                break;
        }

        if( typeName.length>0 ) {
            if( true==event_status.meta[typeName] ){
                act = 0;
                event_status.meta[typeName] = false;
            }
            else{
                act = 1;
                event_status.meta[typeName] = true;
            }
        }

        // var length = $(".st-top-event-set").children().length;
        // if( type==8 && act==1 && length && length>=9 ){
        //     popupShowAdjust(title,desc,confirm,cancel,callback);
        // } else {
            timelineEditStatusApi( this_gi, this_ti, this_ei, "put", type, act, function(data){
                if(data.status == 200 && callback){
                    this_event.data("event-val", event_status);
                    eventStatusWrite(this_event);

                    if( 8==type ){
                        topEvent();
                    }
                    callback(data);
                }
            });
        // }


    } catch(e){
        errorReport(e);
    }
}

timelineEditStatusApi = function(this_gi, this_ti, this_ei, method, type, act, callback ){
    var api_name = "groups/" + this_gi + "/timelines/" + this_ti + "/events/" + this_ei;
    var headers = {
        "ui":ui,
        "at":at, 
        "li":lang,
        "etp": type,    //0(讀取),1(按讚),2(按X),3(按訂閱),4(蒐藏),6(是否有行事曆),8(置頂)
        "est": act      //0(取消),1(執行)
    };
    var result = ajaxDo(api_name,headers,method,false);
    result.complete(function(data){
        if(callback)    callback(data);
    });
}

timelineDeleteEvent = function( this_event, callback ){
    var this_ei = this_event.data("event-id");
    var this_gi = this_ei.split("_")[0];
    var this_ti = this_ei.split("_")[1];

    try{
        var api_name = "groups/" + this_gi + "/timelines/" + this_ti + "/events/" + this_ei;
        var headers = {
            "ui":ui,
            "at":at, 
            "li":lang
        };
        var result = ajaxDo(api_name,headers,"delete",false);
        result.complete(function(data){
            if(data.status == 200 && callback){
                var detailPage = this_event.parents("#page-timeline-detail");
                if( detailPage.length>0 ){
                    detailPage.find(".page-back").trigger("click");
                    $("#page-group-main .st-feedbox-area .st-sub-box[data-event-id='"+this_ei+"']").remove();
                } else {
                    this_event.remove();
                }
                idb_timeline_events.remove(this_ei);
                topEvent();
                callback(data);
            }
        });
    } catch(e){
        errorReport(e);
    }
}

timelineUpdateTime = function(){
    var page = $("#page-group-main");
    $.each( page.find(".st-sub-box:visible"), function(index,domTmp){
        var this_event = $(domTmp);
        var ct = this_event.data("ct");
        this_event.find(".st-sub-time .text").html('<label class="text">'+new Date(ct).toFormatString()+'</label>');

        //回文
        var timeList = this_event.find(".st-reply-all-content-area:visible").find(".st-reply-footer-time");
        $.each( timeList, function(replyIndex, timeTmp){
            var time = $(timeTmp);
            ct = time.data("ct");
            time.html(new Date(ct).toFormatString());
        });
    });
}

timelineUpdateAvatar = function(this_gu){

}

clearCreateGroupPage = function(){
    var area = $("#page-group-menu .gm-create-area");
    area.find(".gmc-avatar").data("chk", false );
    area.find(".gmc-avatar-wrap img").attr("src", "images/icon/icon_build_photo.png");
    area.find(".gmc-name input").val("");
    area.find(".gmc-desc textarea").val("");
    var file = area.find(".gmc-file");
    file.replaceWith( file.clone(true) );
}

showFeedboxNoContent = function( isShow ){
    if( isShow ){
        $(".st-feebox-area-no-content").hide();
    } else {
        $(".st-feebox-area-no-content").removeClass("disabled");
        // $(".gm-content > div:eq(1)").getNiceScroll(0).doScrollTop(0, 500);
    }
}

goToGroupMenu = function(){
    $("#page-group-menu").data("type","create");
    $(".gm-create").trigger("click");
    clearCreateGroupPage();

    if(Object.keys(QmiGlobal.groups).length > 0)
        $("#page-group-menu .page-back").show();
    else
        $("#page-group-menu .page-back").hide();
    
    $.mobile.changePage("#page-group-menu");
}

function removeCompany(companyData) {
    Object.keys(QmiGlobal.companyGiMap).forEach(function(thisGi) {
        if(QmiGlobal.companyGiMap[thisGi].ci === companyData.ci) removeGroup(thisGi, true);
    });
    delete QmiGlobal.companies[companyData.ci];
}

// 啟動timer, 每天半夜12點去每個團體檢查和刪除indexDB內的聊天訊息
function activateClearChatsTimer(){
    var counter = -1;
    var now = new Date();
    var dueTime = new Date();
    // dueTime.setDate(dueTime.getDay() + 2);
    dueTime.setHours(00);
    dueTime.setMinutes(00);
    dueTime.setSeconds(00);

    if (dueTime - now > 0) {
        counter = dueTime - now;
    } else {
        counter = dueTime - now + 86400000;
    }
    var allGroupData = QmiGlobal.groups;
    $.each(allGroupData, function (groupID, groupData){
        if (groupData.set && groupData.set.ccc) {
            onRemoveChatDB(groupID, groupData.set.ccc);
        }
    });
    clearChatTimer = setTimeout(activateClearChatsTimer, counter);
};


function resetCompanyAccountPassword(ssoData) {
    var time = new Date();
    time.setDate(time.getDate() - 30);

    QmiGlobal.PopupDialog.create({
        header: "<div class='alert'><img src='images/registration/symbols-icon_warning_ldap.png'>"
            + "<h2>" + $.i18n.getString("ENTERPRISE_ACCOUNT_SECURITY_NOTICE") + "</h2><p>" 
            + $.i18n.getString("ENTERPRISE_ACCOUNT_LAST_TIME") + "</p><p>" + time.getFullYear() + "." 
            + ("0" + (time.getMonth() + 1)).slice(-2) + "." + ("0" + time.getDate()).slice(-2) + "</p><p>"
            + $.i18n.getString("ENTERPRISE_ACCOUNT_REMIND") +"</p></div>",

        input: [{
            type: "password",
            className: "input-password old-password",
            hint: "ENTERPRISE_ACCOUNT_SET_ORIGIN_PASSWORD",
            maxLength : 30,
            eventType: "input",
            eventFun: function (e) {
                checkPasswordAreMatch(e, "update");
            }
        },{
            type: "password",
            className: "input-password new-password",
            hint: "ENTERPRISE_ACCOUNT_SET_PASSWORD",
            maxLength : 10,
            eventType: "input",
            eventFun: function (e) {
                checkPasswordAreMatch(e, "update");
            }
        },{
            type: "password",
            className: "input-password new-password-again",
            hint: "ENTERPRISE_ACCOUNT_SET_PASSWORD_AGAIN",
            maxLength : 10,
            eventType: "input",
            eventFun: function (e) {
                checkPasswordAreMatch(e, "update");
            }
        }],
        errMsg: {
            text: "ENTERPRISE_ACCOUNT_SET_PASSWORD_NOT_MATCH",
            className: "error-message"
        },
        buttons: {
            cancel: {
                text : "ENTERPRISE_ACCOUNT_IGNORE",
                className: "ignore",
                eventType : "click",
                eventFun : function (callback) {
                    QmiGlobal.PopupDialog.close();
                }
            },
            confirm: {
                text : "ENTERPRISE_ACCOUNT_CHANGE_PASSWORD",
                className: "update",
                eventType : "click",
                eventFun : function (callback) {
                    var dialog = $("#popupDialog");

                    if ($(this).hasClass("enable")) {
                        var oldPassword = dialog.find(".old-password input").val();
                        var firstNewPassword = dialog.find(".new-password input").val();
                        var secondNewPassword = dialog.find(".new-password-again input").val();

                        if (firstNewPassword !== secondNewPassword) {
                            dialog.find(".error-message").css("opacity", 1);
                        } else {
                            dialog.find(".error-message").css("opacity", 0);
                            new QmiAjax({
                                url: "https://" + ssoData.url + "/apiv1/company_accounts/" + ssoData.ci + "/users/password",
                                method: "put",
                                body: {
                                    id: ssoData.id,
                                    dn: QmiGlobal.device,
                                    op: QmiGlobal.aesCrypto.enc(oldPassword, (ssoData.id + "_" + QmiGlobal.device).substring(0, 16)),
                                    np: QmiGlobal.aesCrypto.enc(firstNewPassword, (ssoData.id + "_" + QmiGlobal.device).substring(0, 16)),
                                }
                            }).done(function(rspData) {
                                if (rspData.status == 200) {
                                    QmiGlobal.PopupDialog.close();
                                    toastShow($.i18n.getString("ENTERPRISE_ACCOUNT_CHANGE_PASSWORD_SUCCESS"));
                                }
                            });
                        }
                    }
                }
            }
        }
    }).open();
}

function clickTimelineTab(argObj) {
    $(".sm-group-list-area").removeAttr("data-unlock");
    var action = argObj.action

    if($(".st-filter-area").hasClass("st-filter-lock")) return;
    //滾動至最上面
    timelineScrollTop();
    //取消主頁
    timelineMainClose();

    timelineSwitch(action);

    $(".sm-small-area.active").removeClass("active");
    if(!argObj.tabDom) return;
    argObj.tabDom.addClass("active").addClass("sm-click-bg");
}

/*
          ███████╗████████╗ ██████╗ ██████╗  █████╗  ██████╗ ███████╗          
          ██╔════╝╚══██╔══╝██╔═══██╗██╔══██╗██╔══██╗██╔════╝ ██╔════╝          
█████╗    ███████╗   ██║   ██║   ██║██████╔╝███████║██║  ███╗█████╗      █████╗
╚════╝    ╚════██║   ██║   ██║   ██║██╔══██╗██╔══██║██║   ██║██╔══╝      ╚════╝
          ███████║   ██║   ╚██████╔╝██║  ██║██║  ██║╚██████╔╝███████╗          
          ╚══════╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝          

*/

$.userStorage = function(value) {
    if(value){
        QmiGlobal.groups = value;
    }else{
        return QmiGlobal.groups;
    }
}
