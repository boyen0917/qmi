$(function(){

    groupListToLStorage = function(){
        var _uiGroupList = $.lStorage(ui) || {};

        $.each($.lStorage("_groupList"),function(i,gl_obj){
            if(!$.lStorage(ui)[gl_obj.gi]){
                gl_obj.guAll = {};
                gl_obj.gu = gl_obj.me;

                $.each(gl_obj.tl,function(i,val){
                    if(val.tp == 1){
                        gl_obj.ti_cal = val.ti;
                    }else if(val.tp == 2){
                        gl_obj.ti_feed = val.ti;
                    }else{
                        gl_obj.ti_chat = val.ti;
                    }
                });
                _uiGroupList[gl_obj.gi] = gl_obj;
            } else {
                $.extend(_uiGroupList[gl_obj.gi],gl_obj)
            }
        }); 
        $.lStorage(ui,_uiGroupList);
    }

    getGroupCombo = function(this_gi,callback){
        var this_gi = this_gi || gi;
        getGroupData(this_gi,false,1).complete(function(data){
            if(data.status == 200){
                var groupData = $.parseJSON(data.responseText);
                //取得單一團體的所有詳細內容 更新到local storage
                //更新團體資訊
                setGroupAttributes( this_gi, groupData );
                //更新user info
                setGroupUser( this_gi, groupData );

                //設定群組資訊
                setBranchList(this_gi, groupData);
                //設定功能選單
                setTabList(this_gi, groupData);

                if(callback) callback();
            }else{
                //發生錯誤 開啓更換團體
                groupSwitchEnable();
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
        var _groupList = $.lStorage(ui);
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

        //狀態0為未加入, 從清單剔除掉
        $.each(new_guAll,function(i,val){
            if( new_guAll[i].st==0 ){
                delete new_guAll[i];
            }
        });

        _groupList[this_gi].guAll = new_guAll;
        $.lStorage(ui,_groupList);
    }

    setTabList = function(this_gi, groupData){
        var isDataMissing = false;
        if( null==groupData || null==groupData.set ) isDataMissing = true;

        //save data
        var userData = $.lStorage(ui);
        var group = userData[this_gi];
        //如果tp為c,d開頭為官方團體
        if( true==group.isOfficial ){
            group.tab = [
                { "tp": 0, "sw": false },
                { "tp": 1, "sw": false },
                { "tp": 2, "sw": true },
                { "tp": 3, "sw": true },
                { "tp": 4, "sw": false },
                { "tp": 5, "sw": false },
                { "tp": 6, "sw": false },
                { "tp": 7, "sw": true }
            ];
            // group.pen = [
            //     { "tp": 0, "sw": true },
            //     { "tp": 1, "sw": true },
            //     { "tp": 2, "sw": true },
            //     { "tp": 3, "sw": true },
            //     { "tp": 4, "sw": true }
            // ];
        } else{


            if( !isDataMissing && groupData.set.tab ){
                group.tab = groupData.set.tab;
            } else {
                group.tab = [
                    { "tp": 0, "sw": false },
                    { "tp": 1, "sw": false },
                    { "tp": 2, "sw": true },
                    { "tp": 3, "sw": true },
                    { "tp": 4, "sw": false },
                    { "tp": 5, "sw": false },
                    { "tp": 6, "sw": true },
                    { "tp": 7, "sw": true }
                ];
            }
        }

        if( !isDataMissing && groupData.set.pen ){
            group.pen = groupData.set.pen;
        } else {
            group.pen = [
                { "tp": 0, "sw": true },
                { "tp": 1, "sw": true },
                { "tp": 2, "sw": true },
                { "tp": 3, "sw": true },
                { "tp": 4, "sw": true }
            ];
        }

        $.lStorage(ui, userData);

        updateTab( this_gi );
    }


    setThisGroup = function(this_gi){
        try{
            var gl = $.lStorage(ui)[this_gi];
            
            gi = this_gi;
            gu = gl.me;
            gn = htmlFormat(gl.gn);

            ti_cal = gl.ti_cal;
            ti_feed = gl.ti_feed;
            ti_chat = gl.ti_chat;
            
            //設定左側選單 gu
            $(".sm-user-area.namecard").data("gu",gu);
            
            //header 設定團體名稱
            $(".header-group-name div:eq(1)").html(gn);

            //替換該團體的畫面
            updateGroupAllInfoDom( this_gi );

        } catch(e){
            errorReport(e);
            return;
        }
    };

    updateTab = function(this_gi){
        var groupData;
        try{
            groupData = $.lStorage(ui)[this_gi];
        } catch(e){
            // cns.debug("[!] updateTab:" + e.message );
            errorReport(e);
            return;
        }

        try{
            //set tabs
            var menu = $(".header-menu");
            menu.find(".sm-small-area").hide();
            for( var i in groupData.tab ){
                var obj = groupData.tab[i];
                var dom = null;
                switch( obj.tp ){
                    case 0: //團體動態
                        dom = menu.find(".sm-small-area[data-sm-act=feed-public]");
                        break;
                    case 1: //成員動態
                        dom = menu.find(".sm-small-area[data-sm-act=feed-post]");
                        break;
                    case 2: //動態消息
                        dom = menu.find(".sm-small-area[data-sm-act=feeds]");
                        break;
                    case 3: //聊天室
                        dom = menu.find(".sm-small-area[data-sm-act=chat]");
                        break;
                    case 4: //行事曆
                        break;
                    case 5: //相簿
                        break;
                    case 6: //成員列表
                        dom = menu.find(".sm-small-area[data-sm-act=memberslist]");
                        break;
                    case 7: //團體設定
                        dom = menu.find(".sm-small-area[data-sm-act=groupSetting]");
                        break;
                }
                if( dom ){
                    //switch
                    if( obj.sw ) {
                        dom.detach();
                        menu.append( dom );
                        dom.show();
                        //set name
                        var nameDom = dom.find(".sm-small-area-r");
                        if( obj.nm && obj.nm.length>0 ){
                            nameDom.html( obj.nm );
                        } else {
                            nameDom.html( $.i18n.getString(nameDom.attr("data-textid")) );
                        }
                    }
                    // else {
                    //     dom.hide();
                    // }
                }
            }
        } catch(e){
            errorReport(e);
            //cns.debug("[!] setTabList(set tab): " + e.message);
        }

        //暫時先將相簿tab show出來
        // dom = menu.find(".sm-small-area[data-sm-act=album]");
        // dom.detach();
        // menu.append( dom );
        // dom.show();

        //檢查團體設定裡有沒有開放的設定, 都沒有隱藏設定tab
        if( false==initGroupSetting(this_gi) ){
            dom = menu.find(".sm-small-area[data-sm-act=groupSetting]");
            dom.hide();
        }

        //set pen
        try{
            //set tabs
            var menu = $(".feed-compose-area");
            menu.find(".fc-area-subbox").removeClass("active");
            var isPostData = false;
            for( var i in groupData.pen ){
                var obj = groupData.pen[i];
                var dom = null;
                switch( obj.tp ){
                    case 0: //公告
                        dom = menu.find(".fc-area-subbox[data-fc-box=announcement]");
                        break;
                    case 1: //通報
                        dom = menu.find(".fc-area-subbox[data-fc-box=feedback]");
                        break;
                    case 2: //工作
                        dom = menu.find(".fc-area-subbox[data-fc-box=work]");
                        break;
                    case 3: //投票
                        dom = menu.find(".fc-area-subbox[data-fc-box=vote]");
                        break;
                    case 4: //成員定位
                        dom = menu.find(".fc-area-subbox[data-fc-box=check]");

                        //成員定位尚未有功能, 有顯示的話先disabled掉
                        dom.addClass("disabled");
                        break;
                    case 5: //貼文
                        dom = menu.find(".fc-area-subbox[data-fc-box=post]");
                        isPostData = true;
                        break;
                }
                if( dom ){
                    //switch
                    if( obj.sw ) {
                        dom.detach();
                        menu.append( dom );
                        dom.addClass("active");
                        //set name
                        var nameDom = dom.find("div");
                        if( obj.nm && obj.nm.length>0 ){
                            nameDom.html( obj.nm );
                        } else {
                            nameDom.html( $.i18n.getString(nameDom.attr("data-textid")) );
                        }
                    }
                    // else {
                    //     dom.hide();
                    // }
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
            var userData = $.lStorage(ui);
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
            //目前僅免費團體可自由退出
            if( group.tp=="A1" ){
                if( group.set.s11==0 || group.set.s11==2 ){
                    $(".gs-leave").show();
                } else{
                    $(".gs-leave").hide();
                    hide+=1;
                }
            } else {
                $(".gs-leave").hide();
                hide+=1;
            }

            if( hide>=3 ){
                return false;
            }
            return true;
        } catch(e){
            errorReport(e);
        }
    }

    initOfficialGroup = function( this_gi ){
        var userData;
        var groupData;
        try{
            userData = $.lStorage(ui);
            groupData = userData[this_gi];
        } catch(e){
            // cns.debug("[!] updateTab:" + e.message );
            errorReport(e);
            return;
        }

        try{
            //如果tp為c,d開頭為官方團體
            var tp = groupData.tp.toLowerCase();
            groupData.isOfficial = ( tp.indexOf('c')==0 || tp.indexOf('d')==0 );
            $.lStorage(ui,userData);
            
            //如果非admin, 沒有聊天室的話隨便找個admin預建聊天室
            if( groupData.isOfficial && groupData.ad!=1 ){
                updateChatList(this_gi, function(){
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
                        requestNewChatRoomApi(this_gi, target.nk, [{gu:target.gu}], null, null, false);
                    }
                });
            }
        } catch(e){
            errorReport(e);
        }
    }
});