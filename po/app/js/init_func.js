$(function(){

    groupListToLStorage = function(groupList,isAdd){
        var groups = QmiGlobal.groups,
            tmpGroupList = [];

        $.each(groupList,function(i,gl_obj){
            tmpGroupList.push(gl_obj.gi);

            if( groups.hasOwnProperty(gl_obj.gi) === false ){
                gl_obj.guAll = {};
                gl_obj.gu = gl_obj.me;

                $.each(gl_obj.tl,function(i,val){
                    switch(val.tp){
                        case 1:
                            gl_obj.ti_cal = val.ti;
                            break;
                        case 2:
                            gl_obj.ti_feed = val.ti;
                            break;
                        case 3:
                            gl_obj.ti_chat = val.ti;
                            break;
                        case 4:
                            gl_obj.ti_file = val.ti;
                            break;
                    }
                });
                groups[gl_obj.gi] = gl_obj;
            } else {
                $.extend(groups[gl_obj.gi],gl_obj)
            }
        }); 

        // 私雲移轉 屬於額外添加團體
        if(isAdd === true) return;

        // 剔除不存在的團體
        for(giKey in groups){
            if(tmpGroupList.indexOf(giKey) === -1){
                cns.debug("delete group",groups[giKey])
                delete groups[giKey];
            }
        }
    }


    getGroupComboInit = function(thisGi,callback){
        var 
        thisGi = thisGi || gi,
        comboDeferred = $.Deferred();

        new QmiAjax({
            apiName: "groups/" + thisGi + "?tp=1" // tp1才能取得退出的成員
        }).complete(function(data){
            if(data.status == 200){
                var comboData = $.parseJSON(data.responseText);

                // QmiGlobal.groups -> QmiGlobal.groups 
                // thisGi 不存在list中 重新加入 做tl hash-map
                // if( QmiGlobal.groups.hasOwnProperty(thisGi) === false ) {
                //     QmiGlobal.groups[comboData.gi] = comboData;
                //     groupListToLStorage( [ comboData ] );
                // }

                var 
                groupData = QmiGlobal.groups[thisGi],
                ignoreKeys = ["ul","fl","bl","fbl","tl"],
                inviteGuAll = {};

                // 單一團體資訊的部分key 另外處理成hash-map
                for( var key in comboData ){
                    // ignore
                    if( ignoreKeys.indexOf(key) < 0 ) {
                        groupData[key] = comboData[key];    
                    } else {
                        delete groupData[key];
                    }
                }

                // 製作guAll hash-map & inviteGuAll
                for( var key in comboData.ul ){
                    var thisGuObj = comboData.ul[key];
                    //用在contact.js 不知道為何
                    if( thisGuObj.st === 0) inviteGuAll[thisGuObj.gu] = thisGuObj;

                    if(thisGuObj.nk !== undefined)
                        thisGuObj.nk = thisGuObj.nk._escape();

                    groupData.guAll[thisGuObj.gu] = thisGuObj;
                }
                groupData.inviteGuAll = inviteGuAll;

                //官方帳號設定
                initOfficialGroup( thisGi );

                //初始化 重組群組資訊
                setBranchList( thisGi , {
                    bl:  comboData.bl,
                    fbl: comboData.fbl
                });

                //設定功能選單
                setTabList(thisGi);

                if(callback) callback();

                comboDeferred.resolve({
                    status: true,
                    thisGi: thisGi,
                    data: data
                });

            }else{    
                comboDeferred.resolve({
                    status: false,
                    thisGi: thisGi,
                    data: data
                });

                //好像不該在這
                groupSwitchEnable();
            }
        });

        return comboDeferred.promise();
    }

    getGroupCombo = function(this_gi,callback,chk){
        var this_gi = this_gi || gi;
        // var err_show = err_show || false;
        // var api_name = "groups/" + this_gi;
        // if( tp ) api_name = api_name +"?tp=" +tp;
        // var headers = {
        //     "ui":ui,
        //     "at":at,
        //     "li":lang
        // };
        // var method = "get";
        // getGroupData(this_gi,false,1,true)
        new QmiAjax({
            apiName: "groups/" + this_gi,
        }).complete(function(data){
            if(data.status == 200){
                var groupData = $.parseJSON(data.responseText);

                //切換團體時, 若原團體A1有cnt, 新團體A1無cnt, A1的cnt會留著
                clearGroupPollingCnt();

                //取得單一團體的所有詳細內容 更新到local storage
                //更新團體資訊
                setGroupAttributes( this_gi, groupData );

                initOfficialGroup( this_gi );

                //更新user info
                setGroupUser( this_gi, groupData );

                //設定群組資訊
                setBranchList(this_gi, groupData);
                //設定功能選單
                setTabList(this_gi, groupData);

                if(callback) callback();
            }else{
                //發生錯誤 以第一個團體為預設
                if(
                    QmiGlobal.groups[0]     !== undefined && 
                    QmiGlobal.groups[0].gi  !== undefined && 
                    chk                   !== true 
                ) {

                    QmiGlobal.auth.dgi = QmiGlobal.groups[0].gi;

                    //帶true表示只再做一次
                    getGroupCombo(QmiGlobal.groups[0].gi,callback,true);

                } else {
                    groupSwitchEnable();    
                }
            }
        });
    }

    setGroupUser = function( this_gi, data ){
        var data_group_user = data.ul;
        var new_group_user = {};
        $.each(data_group_user,function(i,val){
            //將gu設成key 方便選取
            new_group_user[val.gu] = val;
        });

        //成員列表存入local storage
        updateGuAll(this_gi,new_group_user);
    }

    updateGuAll = function(this_gi,new_guAll) {
        var _groupList = QmiGlobal.groups;
        //先更新舊有資料 但不會取得新成員
        if(_groupList[this_gi].guAll){
            $.each(_groupList[this_gi].guAll,function(i,val){
                if( new_guAll.hasOwnProperty(i) ){
                    $.extend(val,new_guAll[i]);
                } else {
                    delete _groupList[this_gi].guAll[i];
                }
            });
        }

        //將更新完的資料倒回新的名單 就會有新成員
        $.extend(new_guAll,_groupList[this_gi].guAll);

        var inviteGuAll = {};
        //狀態0為未加入, 從清單剔除掉
        $.each(new_guAll,function(i,val){
            if( new_guAll[i].st==0 ){
                inviteGuAll[i] = new_guAll[i];
                delete new_guAll[i];
            }
        });
        _groupList[this_gi].inviteGuAll = inviteGuAll;
        _groupList[this_gi].guAll = new_guAll;
        // *--* $.lStorage(ui,_groupList);
    }

    setTabList = function(thisGi, qmiGroupData){
        var qmiGroupData = qmiGroupData || QmiGlobal.groups[thisGi];

        //如果tp為c,d開頭為官方團體
        if( true==qmiGroupData.isOfficial ){
            qmiGroupData.set.tab = [
                { "tp": 0, "sw": false },
                { "tp": 1, "sw": false },
                { "tp": 2, "sw": true },
                { "tp": 3, "sw": true },
                { "tp": 4, "sw": false },
                { "tp": 5, "sw": false },
                { "tp": 6, "sw": false },
                { "tp": 7, "sw": true },
                { "tp": 8, "sw": false },
                { "tp": 9, "sw": false }
            ];
            if( qmiGroupData.ad==1 )
                qmiGroupData.set.tab[6].sw = true;
        }

    }


    setThisGroup = function(thisGi){
        try{
            var groupData = QmiGlobal.groups[thisGi];
            
            QmiGlobal.currentGi = thisGi;
            gi = thisGi;
            gu = groupData.me;
            gn = groupData.gn._escape();

            ti_cal = groupData.ti_cal;
            ti_feed = groupData.ti_feed;
            ti_chat = groupData.ti_chat;
            
            //設定左側選單 gu
            $(".sm-user-area.namecard").data("gu",gu);
            
            //header 設定團體名稱
            $(".header-group-name div:eq(1)").html(gn);

            //清除timeline無資料旗標
            $(".feed-subarea.no-data").removeClass("no-data");

            //替換該團體的畫面 做完做updateTab
            updateGroupAllInfoDom( thisGi );

        } catch(e){
            errorReport(e);
            return;
        }
    };

    updateTab = function(thisGi){
        var groupData = QmiGlobal.groups[thisGi];
        try{
            var tabHtml = '<div class="sm-small-area"><div class="sm-small-area-r"></div></div>';

            //set tabs
            var menu = $(".header-menu").html("");
            menu.parent().hide();
            
            for( i=0;i<groupData.set.tab.length;i++ ){
                var tabObj = groupData.set.tab[i];
                //switch off
                if( tabObj.sw === false || typeof initTabMap[tabObj.tp] === "undefined") continue;
                
                var tabDom = $(tabHtml);
                tabDom.attr("data-sm-act",initTabMap[tabObj.tp].act);
                //tab 對照表 init.js
                //initTabMap
                if(initTabMap[tabObj.tp].hasOwnProperty("class")){
                    for(j=0;j<initTabMap[tabObj.tp].class.length;j++){
                        tabDom.addClass(initTabMap[tabObj.tp].class[j]);    
                    }
                    tabDom.attr("data-polling-cnt",initTabMap[tabObj.tp].pollingType)
                    .append('<div class="sm-count" style="display:none;"></div>');
                }
                menu.append( tabDom );

                //set name
                var nameDom = tabDom.find(".sm-small-area-r");
                if( tabObj.nm && tabObj.nm.length>0 ){
                    nameDom.html( tabObj.nm );
                } else {
                    nameDom.html( $.i18n.getString(initTabMap[tabObj.tp].textId) );
                }
            }

            // if (groupData.isOfficial) {
            //     menu.hide();
            // }
        } catch(e){
            errorReport(e);
        }

        //檢查團體設定裡有沒有開放的設定, 都沒有隱藏設定tab
        if( false==initGroupSetting(thisGi) ){
            dom = menu.find(".sm-small-area[data-sm-act=groupSetting]");
            dom.hide();
        }

        //set pen
        try{
            var penHtml = '<div class="fc-area-subbox"><img class="fc-icon-size"/><div name="func-name"></div></div>';
            //set pen
            var menu = $(".feed-compose-area").html("");
            var isPostData = false;
            for( var i in groupData.set.pen ){
                var penObj = groupData.set.pen[i];
                //switch關閉或是init沒設定這個tp 就跳過
                if(penObj.switch === false || typeof initPenMap[penObj.tp] === "undefined") continue;
                var penDom = $(penHtml);

                if(penObj.tp == 5) isPostData = true;

                //fc-box & 圖片
                penDom.attr("data-fc-box",initPenMap[penObj.tp].fcBox)
                .find("img").attr("src","images/icon/icon_compose_" + initPenMap[penObj.tp].imgNm + ".png");

                menu.append( penDom );
                penDom.addClass("active");
                //set name
                var nameDom = penDom.find("div[name=func-name]");
                if( penObj.nm && penObj.nm.length>0 ){
                    nameDom.html( penObj.nm );
                } else {
                    nameDom.html( $.i18n.getString(initPenMap[penObj.tp].textId) );
                }
            }
            //如果沒有筆資料預設打開
            if( false==isPostData ){
                dom = menu.find(".fc-area-subbox[data-fc-box=post]");
                dom.detach();
                menu.append( dom );
                dom.addClass("active");
            }
        } catch(e){
            //cns.debug("[!] setTabList(set pen): " + e.message);
            errorReport(e);
        }
    }

    initGroupSetting = function(this_gi){
        // 如果是管理者的話顯示額外設定
        try{
            var userData = QmiGlobal.groups;
            var group = userData[this_gi];
            var hide = 0;
            if( 1==group.ad ){
                $(".gs-row[data-type=permission]").show();
                $(".gs-row[data-type=info]").show();
            } else {
                $(".gs-row[data-type=permission]").hide();
                $(".gs-row[data-type=info]").hide();
                hide+=2;
            }

            //離開團體開關
            //據說是其他平台還沒實作, 取消此規則**目前僅免費團體及官方帳號可自由退出**
            // if( group.tp=="A1" || group.tp.indexOf("C")==0 ){
                if( group.set && (group.set.s11==0 || group.set.s11==2) ){
                    $(".gs-leave").show();
                } else{
                    $(".gs-leave").hide();
                    hide+=1;
                }
            // } else {
            //     $(".gs-leave").hide();
            //     hide+=1;
            // }

            if( hide>=3 ){
                return false;
            }
            return true;
        } catch(e){
            errorReport(e);
        }
    }

    initOfficialGroup = function( thisGi ){
        try{
            var groupData = QmiGlobal.groups[thisGi];
        } catch(e){
            // cns.debug("[!] updateTab:" + e.message );
            errorReport(e);
            return;
        }

        try{
            //如果tp為c,d開頭為官方團體
            var tp = groupData.tp.toLowerCase();
            groupData.isOfficial = ( tp.indexOf('c')==0 || tp.indexOf('d')==0 );
            
            //如果非admin, 沒有聊天室的話隨便找個admin預建聊天室
            if( groupData.isOfficial && groupData.ad!=1 ){
                updateChatList(thisGi, function(){
                    //remove illegal chat rooms
                    try {
                        if (groupData.chatAll && Object.keys(groupData.chatAll).length > 1) {
                            $.each(groupData.chatAll, function (key, obj) {
                                if (obj && obj.tp == 1) {
                                    if (obj.other 
                                        && groupData.guAll.hasOwnProperty(obj.other)
                                        && 1 != groupData.guAll[obj.other].ad ) {
                                        delete groupData.chatAll[key];
                                        leaveRoomAPI(key);
                                    }
                                }
                            });
                        }
                    } catch(e){
                        errorReport(e);
                    }

                    if( null==groupData.chatAll || Object.keys(groupData.chatAll).length<=1 ){
                        var target;
                        //find an admin
                        for( var gu in groupData.guAll){
                            var mem = groupData.guAll[gu];
                            if( mem.ad==1 ){
                                target = mem;
                                break;
                            }
                        }
                        if( null!= target ) {
                            cns.debug("[initOfficialGroup] create an official chat", thisGi, target.nk, target.gu);
                            requestNewChatRoomApi(thisGi, target.nk, [{gu: target.gu}], null, null, false);
                        }
                        else cns.debug("[initOfficialGroup] has no admin in official group", thisGi);
                    }
                });
            }
        } catch(e){
            errorReport(e);
        }
    }

    function leaveRoomAPI(ciTmp, callback) {
        var apiName = "groups/" + gi + "/chats/" + ciTmp + "/users";
        var headers = {
            ui:ui,
            at:at,
            li:lang
        };
        var result = ajaxDo(apiName, headers, 'delete',true,null, null, true);
        result.error(function(jqXHR, textStatus, errorThrown) {
            cns.debug(1);
            return;
        });
        result.complete( function(data) {
            if (data.status == 200) {
                var result = $.parseJSON(data.responseText);
                if (callback) callback(result);
            }
        });
    }

    clearGroupPollingCnt = function(){
        var keys = ["A1","A2","A3","A4"];//,"B1","B2","B3","B4"
        for( var i=0; i<keys.length; i++ ){
            var key = keys[i];
            $(".polling-cnt[data-polling-cnt="+key+"] .sm-count").hide();
        }
    }
});