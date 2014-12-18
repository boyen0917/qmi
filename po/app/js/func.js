$(function(){

	setDefaultGroup = function(){

		//上次點選團體
		if($.lStorage(ui)){
			var _uiGroupList = $.lStorage(ui);
    		var default_gi = _uiGroupList.default_gi;
    		var default_group = _uiGroupList[default_gi];
    		
    		gi = default_gi;
    		gu = default_group.gu;
    		gn = default_group.gn;
    		ti_cal = default_group.ti_cal;
    		ti_feed = default_group.ti_feed;
    		ti_chat = default_group.ti_chat;
    	}else{
    		//預設團體暫定為第一個團體？
            if(!$.lStorage("_groupList") || $.lStorage("_groupList").length == 0) return false;

        	var default_group = $.lStorage("_groupList")[0];

        	$.each(default_group.tl,function(i,val){
        		if(val.tp == 1){
        			ti_cal = val.ti;
        		}else if(val.tp == 2){
        			ti_feed = val.ti;
        		}else{
        			ti_chat = val.ti;
        		}
        	});
        	
        	gi = default_group.gi;
    		gu = default_group.me;
    		gn = default_group.gn;

    		//存入localstorage
    		var _groupList = {"default_gi":gi};
    		$.lStorage(ui,_groupList);
    	}
	}

	setGroupList = function(){
        var test1 = $.lStorage("_groupList");
        var test2 = $.lStorage(ui);
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
			}
		});	
        $.lStorage(ui,_uiGroupList);
	}

	logout = function(){
		var api_name = "logout";
        var headers = {
            ui: ui,
            at: at,
            li: lang
        };
        var method = "delete";

        ajaxDo(api_name,headers,method,true).complete(function(data){
        	localStorage.removeItem("_loginAutoChk");
            localStorage.removeItem("_loginData");
        	document.location = "index.html";
        });
	}

    chkBranch = function(){
        // cns.debug("=========================");
        // cns.debug("typeof $.lStorage(ui)[gi].bl:",typeof $.lStorage(ui)[gi].bl);
        // cns.debug("first key",Object.keys($.lStorage(ui)[gi].bl)[0]);
        // cns.debug("typeof first element",typeof $.lStorage(ui)[gi].bl[Object.keys($.lStorage(ui)[gi].bl)[0]].lv);
        // cns.debug("=========================");
        if(typeof $.lStorage(ui)[gi].bl == "object"){
            var first_key = Object.keys($.lStorage(ui)[gi].bl)[0];
            if(typeof first_key != "undefined" && typeof $.lStorage(ui)[gi].bl[first_key].lv == "undefined")
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
        ajaxDo(api_name,headers,method,true).complete(function(data){
        	if(data.status == 200){
        		var invite_result =$.parseJSON(data.responseText);
        		//沒有團體邀請即顯示
        		if(invite_result.gl.length == 0) {
        			$(".gmi-coachmake").show();
        			return false;
        		}else{
        			$(".gm-invite-area").data("cnt",invite_result.gl.length);
        		}

        		$(".gmi-coachmake").hide();
        		$(".gmi-div-area").html("");
        		$.each(invite_result.gl,function(i,val){
        			$(".gmi-div-area").append($('<div>').load('layout/layout.html .gmi-div',function(){
        				var this_invite = $(this).find(".gmi-div");
                        this_invite._i18n();
        				this_invite.data("invite-data",val);
        				this_invite.find(".gmi-div-data div:eq(0)").html( $.i18n.getString("GROUP_GROUP_INVITATION", "<span>"+val.gn+"</span>") );
        				this_invite.find(".gmi-div-data div:eq(1)").html( $.i18n.getString("GROUP_MEMBERS", "<span>"+val.cnt+"</sapn>") );

        				if(val.aut){
        					this_invite.find(".gmi-div-avatar .aut").attr("src",val.aut);
        					// this_invite.find(".gmi-div-avatar .auo").attr("src",val.auo);
        					this_invite.find(".group-pic").data("auo",val.auo);
        					avatarPos(this_invite.find(".gmi-div-avatar .aut"),70);
        				}

        				this_invite.find(".gmi-div-desc-area").html(val.gd);

        			}));
        		});
        	}
        });
	}

	agreeMeInvite = function(this_invite){
		var invite_data = this_invite.data("invite-data");
		var api_name = "me/groups";
        var headers = {
                ui: ui,
	            at: at,
	            li: lang
                     };
        var method = "post";
        var body = {
                  id: invite_data.ik,
                  tp: invite_data.tp,
                  gi: invite_data.gi
                  
                }
        
        ajaxDo(api_name,headers,method,true,body).complete(function(data){
        	if(data.status == 200){
        		groupMenuListArea(invite_data.gi,true);
        		this_invite.remove();
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

	getUserName = function (target_gi , target_gu , set_name ,set_img){
        //先檢查localStorage[gi].guAll是否存在
        var _groupList = $.lStorage(ui);
        var aut = "",auo = "",nk = "";

        //可能會沒有會員資訊
        if(_groupList[target_gi].guAll[target_gu]){
        	aut = _groupList[target_gi].guAll[target_gu].aut;
        	auo = _groupList[target_gi].guAll[target_gu].auo;
        	nk = _groupList[target_gi].guAll[target_gu].nk.replaceOriEmojiCode();
        }

    	//設定圖片
    	if(set_img){
    		//調整圖片位置
    		set_img.attr("src",aut);
    		if(aut){
    			set_img.attr("src",aut);
    			// set_img.parents(".namecard").data("auo",auo);
    			avatarPos(set_img);
        	}else{
        		set_img.attr("src","images/common/others/empty_img_personal_l.png");
        	}
    	}
    	
        set_name.html(nk);
    }
	
	setBranchList = function(this_gi){
		var this_gi = this_gi || gi;

    	//取得團體列表
        var api_name = "groups/" + this_gi + "/branches";
        var headers = {
            "ui":ui,
            "at":at,
            "li":lang
        };

        var method = "get";
        ajaxDo(api_name,headers,method,false).complete(function(data){
        	if(data.status == 200){

        		var branch_list = $.parseJSON(data.responseText);
        		var new_bl = {};
        		var new_fbl = {};
                var _groupList = $.lStorage(ui);
                var guAll = _groupList[this_gi].guAll;

                //branch
        		if(branch_list.bl.length) {
                    //初始化陣列
        			$.each(branch_list.bl,function(i,val){
                        if( null==val.bp|| val.bp.length==0 ) return;

                        var bp_arr = val.bp.replace(/^\./, '').split(".");
                        var pi = "";
                        if(bp_arr.length > 1){
                            pi = bp_arr[bp_arr.length-2]
                        }
        				new_bl[bp_arr.last()] = {
        					lv: bp_arr.length,
        					bn: val.bn,
        					cl: [],
                            cnt: 0,
                            pi: pi,
        					bp_arr: bp_arr
        				};
        				
	        		});

                    //建立子群組
	        		$.each(new_bl,function(i,val){
        				if(val.lv > 1){
        					var parent = val.bp_arr[val.bp_arr.length-2];
        					if(new_bl[parent]) new_bl[parent].cl.push(i);
        				}
        				delete val.bp_arr;
	        		});
                    
                    //計算人數
                    //*NOTE*
                    // 同一人可能隸屬于多個群組, 若兩個子群組有同一人,
                    // 母群組應該只能算一人, 普通加法不成立...
                    for( var biTmp in new_bl ){
                        //每個群組走過一次所有成員, 只要含有這個群組ＩＤ數量就加一..
                        var cnt=0;
                        for( var id in guAll ){
                            var mem = guAll[id];
                            if( mem.bl.indexOf(biTmp)>=0 ){
                                cnt++;
                            }
                        }
                        new_bl[biTmp].cnt = cnt;
                    }
        		}

                //fav branch
        		if(branch_list.fbl.length) {
        			$.each(branch_list.fbl,function(i,val){
	        			new_fbl[val.fi] = {fn:val.fn, cnt:0};
	        		});
        		}

                //計算人數
                var favCnt = 0;
                $.each(guAll,function(i,val){
                    //fi mem cnt
                    if( val.fbl && val.fbl.length>0 ){
                        for(var i=0; i<val.fbl.length; i++){
                            var fi = val.fbl[i];
                            if(new_fbl[fi]) new_fbl[fi].cnt++;
                        }
                    }

                    //fav cnt
                    if( true==val.fav ) favCnt++;
                });

                _groupList[this_gi].favCnt = favCnt;
            	_groupList[this_gi].bl = new_bl;
            	_groupList[this_gi].fbl = new_fbl;
            	$.lStorage(ui,_groupList);
        	}
        });
    }
    

	setGroupAllUser = function(data_arr,this_gi,callback){
		var this_gi = this_gi || gi;
		getGroupAllUser(this_gi,false).complete(function(data){
			if(data.status == 200){
				data_group_user = $.parseJSON(data.responseText).ul;
	            var new_group_user = {};
	            $.each(data_group_user,function(i,val){
	                //將gu設成key 方便選取
	                new_group_user[val.gu] = val;
	            });

	            //成員列表存入local storage
	            updateGuAll(this_gi,new_group_user);
                //按照邏輯 取得群組名單之後 就來設定群組資訊
                setBranchList(this_gi);
	            
	            if(data_arr && data_arr[0] == "setTopEventUserName"){
	            	//設定top event 的user name 及頭像
                    data_arr[1].find(".st-top-event-l img").attr("src",$.lStorage(ui)[this_gi].guAll[data_arr[2]].aut).parent().stop().animate({
                        opacity:1
                    },1000);
	            	data_arr[1].find(".st-top-event-r-footer span:eq(0)").html(new_group_user[data_arr[2]].nk);

	            }else if(data_arr && data_arr[0] == "userInfo"){
                    //設定user info
                    var _groupList = $.lStorage(ui);
                    _groupList[this_gi].guAll[data_arr[1].gu] = data_arr[1];
                    $.lStorage(ui,_groupList);

                }else if(data_arr && data_arr[0] == "eventDetail"){
                    //設定event detail 跨團體
                    data_arr[1].trigger("click");

                }else if(data_arr){
	            	getUserName(data_arr[1],data_arr[2],data_arr[3],data_arr[4]);
	            }
                if(callback) callback();
			}else{
                //發生錯誤 開啓更換團體
                cns.debug("fun394 enable囉:",this_gi + " : " + data_arr[2]);
                $(".sm-group-area").addClass("enable");
            }
		});
	}

	updateGuAll = function(this_gi,new_guAll) {
		var _groupList = $.lStorage(ui);
		//先更新就有資料 但不會取得新成員
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
		_groupList[this_gi].guAll = new_guAll;
        $.lStorage(ui,_groupList);
	}
	

	timelineSwitch = function (act,reset,main){
		//reset 
		if(reset) {
			$(".feed-subarea").removeData();
			$("#page-group-main .switch-reset").html("");
		}

        var page_title = $.i18n.getString("LEFT_FEED");

		switch (act) {
	        case "feeds":
				$(".feed-subarea").hide();
                $(".st-filter-main span").html( $.i18n.getString("FEED_ALL") );

				//filter all
				$(".st-filter-area").data("filter","all");

	        	//點選 全部 的用意是 既可寫入timeline 也可以讓navi回到 "全部" 的樣式
                if(!main)
                    $(".st-navi-area .main").trigger("click");

	        	$(".subpage-contact").hide();
	        	$(".subpage-chatList").hide();
	        	$(".subpage-timeline").show();
	        	$("#page-group-main").find(".gm-header .page-title").html(page_title);

                //顯示新增貼文按鈕, 藏新增聊天室按鈕
                $("#page-group-main").find(".gm-header .feed-compose").show();
                $("#page-group-main").find(".gm-header .chatList-add").hide();
                $("#page-group-main").find(".gm-header .contact-add").hide();

                //polling 數字重寫
                if($.lStorage("_pollingData"))
                    pollingCountsWrite();

	          break;
	        case "memberslist": 
	        	$(".subpage-contact").show();
	            $(".subpage-timeline").hide();
	        	$(".subpage-chatList").hide();
	            $( "#side-menu" ).panel( "close");
                
                //藏新增貼文按鈕, 新增聊天室按鈕
                $("#page-group-main").find(".gm-header .feed-compose").hide();
                $("#page-group-main").find(".gm-header .chatList-add").hide();
                //如果是管理者的話顯示新增成員鈕
                try{
                    var userData = $.lStorage(ui);
                    var me_gu = userData[gi].gu;
                    if( 1==userData[gi].guAll[gu].ad ){
                        $("#page-group-main").find(".gm-header .contact-add").show();
                    }
                } catch(e){
                    cns.debug( e );
                }
                
                page_title = $.i18n.getString("LEFT_MEMBER");

	        	initContactList();
	          break;
	        case "chat":
	        	//-- switch sub pages --
	        	$(".subpage-contact").hide();
	        	$(".subpage-timeline").hide();
	        	$(".subpage-chatList").show();
	        	// $( "#side-menu" ).panel( "close");

                page_title = $.i18n.getString("CHAT_TITLE");

	        	initChatList();

                //顯示新增聊天室按鈕, 藏新增貼文按鈕
                $("#page-group-main").find(".gm-header .feed-compose").hide();
                $("#page-group-main").find(".gm-header .chatList-add").show();
                $("#page-group-main").find(".gm-header .contact-add").hide();

	        	//$.mobile.changePage("#page-chatroom");
	        	//$("#page-group-main").find("div[data-role=header] h3").html("聊天室");
	          break;
	        case "calendar":
	          break;
	        case "help":
	          break;
	        case "news":
	          break;
	        case "setting":
	          break;
	    }

        $("#page-group-main").find(".gm-header .page-title").html(page_title);
	}

	setSmUserData = function (gi,gu,gn){
		// $(".sm-user-area-r div:eq(0)").html(gn);
		$(".sm-user-area-r div").html("");  

        $(".sm-user-area.namecard").data("gu",gu);

		//檢查每個團體是否存在gu all 
		var data_arr = ["getUserName",gi,gu,$(".sm-user-area-r div"),$(".sm-user-pic img")];
		chkGroupAllUser(data_arr);
	}

	chkGroupAllUser = function(data_arr){
		//只用在 sidemenu 及 timelineblockmake 的檢查
		//先檢查localStorage[gi].guAll是否存在
        if(Object.keys($.lStorage(ui)[gi].guAll).length == 0){
        	setGroupAllUser(data_arr);
        }else{
        	getUserName(data_arr[1],data_arr[2],data_arr[3],data_arr[4]);
        }
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

	topEvent = function (callback){
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
		var _groupList = $.lStorage(ui);
		topEventApi().complete(function(data){
            //不管是不是200 執行callback
            if(callback) {
                callback();   
            }

        	if(data.status == 200){
        		var top_events_arr = $.parseJSON(data.responseText).el;
        		var top_msg_num = top_events_arr.length;
        		if(top_msg_num == 0){
        			return false;
        		}
        		//default 關閉
        		$(".st-top-event-default").hide();

        		$.each(top_events_arr,function(i,val){
        			top_area.find(".st-top-event-set").append($('<div class="st-top-event">').load('layout/layout.html .st-top-event-load',function(){
        				var this_top_event = $(this);
                        this_top_event.find(".st-top-event-load")._i18n();
        				this_top_event.data("data-obj",val);
        				this_top_event.data("pos",i);

                        var ttl_tp = $.i18n.getString("FEED_TASK");
        				//標題 內容
                        switch(val.meta.tp){
                            case "00":
                                ttl_tp = $.i18n.getString("FEED_POST");
                                break;
                            case "01":
                                ttl_tp = $.i18n.getString("FEED_BULLETIN");
                                break;
                            case "02":
                                ttl_tp = $.i18n.getString("FEED_REPORT");
                                break;
                        }

                        this_top_event.find(".st-top-event-r-ttl span").html(ttl_tp);
        				this_top_event.find(".st-top-event-r-ttl").append(val.meta.tt);
        				this_top_event.find(".st-top-event-r-content").html(val.ml[0].c);

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
                $(".sm-group-area").addClass("enable");
            }
        });
	}

	//為了避免gu all還沒取得
	setTopEventUserName = function(this_top_event,this_gu){
		var gu_all = $.lStorage(ui)[gi].guAll;
        if(!gu_all[this_gu]) {
            cns.debug("[!]top event gi gu mismatched[!]");
            return false;
        }

		this_top_event.find(".st-top-event-l img").attr("src",gu_all[this_gu].aut).parent().stop().animate({
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
        var top_timer = setInterval();

        clearInterval(top_timer);

        top_timer = setInterval(function(){
            top_area.find(".st-top-right-arrow").trigger("mouseup");
        },top_timer_ms);

        //重設輪播
        top_area.find(".st-top-bar-case-click span, .st-top-left-arrow, .st-top-right-arrow").click(function(){
            clearInterval(top_timer);
            top_timer = setInterval(function(){
                top_area.find(".st-top-right-arrow").trigger("mouseup");
            },top_timer_ms);
        });
    }


	topBarMake_bak = function (top_area,top_msg_num,resize) {

		//顏色設定
		var color = ["#ededed","#dddddd","#d1d0d0","#b7b7b7","#9d9d9d","#878787","#6b6b6b","#474747"];

		//游標 預設位置0
		top_area.find(".st-top-bar-selector").data("pos",0);

		//第一個 左邊圓角 背景白色
		var start_span = $('<span style="background:#fff;border-radius:7px 0 0 7px;"></span>');
		top_area.find(".st-top-bar-case").html(start_span);
		start_span.data("pos",0);

		//點擊區放大
		var start_span_click = $('<span></span>');
		top_area.find(".st-top-bar-case-click").html(start_span_click);
		start_span_click.data("pos",0);

		//第一個已經有了 所以-1
		for(i=0;i<top_msg_num-1;i++){
			var this_span = $('<span style="background:' + color[i] + ';"></span>');
			top_area.find(".st-top-bar-case").append(this_span);
			this_span.data("pos",i+1);

			//點擊區放大
			var this_span_click = $('<span></span>');
			top_area.find(".st-top-bar-case-click").append(this_span_click);
			this_span_click.data("pos",i+1);
		}

		top_area.find(".st-top-bar-case span").last().addClass("st-r-radius");		

		//st-top-bar-case 幾個就是幾十趴
		top_area.find(".st-top-bar-case,.st-top-bar-case-click").css("width",top_msg_num*10 + "%")
		//st-top-bar-area span 平均寬度在case中
		// top_area.find(".st-top-bar-case span,.st-top-bar-case-click span").css("width",((1/top_msg_num)*100).toFixed(2) + "%");
        top_area.find(".st-top-bar-case span,.st-top-bar-case-click span").css("width",Math.floor((1/top_msg_num)*10000)/100 + "%");
		
		//點擊區放大
		// top_area.find(".st-top-bar-case-click").css("width",top_msg_num*10 + "%")
		// top_area.find(".st-top-bar-case-click span").css("width",((1/top_msg_num)*100).toFixed(2) + "%");

		//出現
		top_area.find(".st-top-bar-area").slideDown("fast");

		//起始位置
		var selector_pos = (10-top_msg_num)/2*10;
		var first_span = top_area.find(".st-top-bar-case span:eq(0)");
		//$("#side-menu").width() 開啓side menu 時的校正
		// var start_left = first_span.offset().left - $("#side-menu").width();
        var start_left = first_span.offset().left;
		var start_top = first_span.offset().top;
		var movement = first_span.width();

		//流程控制 不能連按
		var mfinish = false;

		//點擊區 位置
		top_area.find(".st-top-bar-case-click").offset({top:(start_top-14),left:111});


		//點擊區 先解綁定
		top_area.find(".st-top-bar-case-click span").unbind();
		top_area.find(".st-top-bar-case-click span").mouseup(function(){
			var target_pos = $(this).data("pos");



			top_area.find(".st-top-event").animate({'right':target_pos*100 + '%'});
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
			if(direction){
				var target_pos = here_pos+1;
				if(target_pos > top_msg_num-1) target_pos = 0;
			}else{
				var target_pos = here_pos-1;
			}
			
			top_area.find(".st-top-bar-case-click span:eq(" + target_pos + ")").trigger("mouseup");
		});


		//輪播
		var top_timer = setInterval();

		clearInterval(top_timer);

		top_timer = setInterval(function(){
			top_area.find(".st-top-right-arrow").trigger("mouseup");
		},top_timer_ms);

		//重設輪播
		top_area.find(".st-top-bar-case-click span, .st-top-left-arrow, .st-top-right-arrow").click(function(){
			clearInterval(top_timer);
			top_timer = setInterval(function(){
				top_area.find(".st-top-right-arrow").trigger("mouseup");
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
		var me_pos = $.inArray(gu,epl);
		var guAll = $.lStorage(ui)[this_gi].guAll;
        var me_gu = guAll[epl[me_pos]];
		var like_str = "";

        this_event.find(".st-reply-like-area").show();

        try{
            switch(true){
                //陣列空的 隱藏 區域
                case (epl.length == 0) :
                    like_str = $.i18n.getString("FEED_BE_FIRST_LIKE");
                    break;
                //你 按讚
                case ( typeof me_gu != "undefined" && epl.length == 1 ) :
                    like_str = $.i18n.getString("FEED_CLICK_LIKE_SELF", $.i18n.getString("COMMON_YOU") );
                    break;
                //林小花 按讚
                case ( !me_gu && epl.length == 1 ) :
                    like_str = $.i18n.getString("FEED_CLICK_LIKE", guAll[epl[0]].nk.replaceOriEmojiCode() );
                    break;
                //你、林小花 按讚
                case ( epl.length == 2 ) :
                    if( typeof me_gu == "undefined" ){
                        like_str = $.i18n.getString("FEED_CLICK_LIKE_2PEOPLE", 
                            guAll[epl[0]].nk.replaceOriEmojiCode(), 
                            guAll[epl[1]].nk.replaceOriEmojiCode() );
                    } else {
                        like_str = $.i18n.getString("FEED_CLICK_LIKE_2PEOPLE", 
                            $.i18n.getString("COMMON_YOU"), 
                            (me_pos ? guAll[epl[0]].nk.replaceOriEmojiCode() : guAll[epl[1]].nk.replaceOriEmojiCode()) 
                        );
                    }
                    break;
                //林小花 及其他？個人按讚
                case ( epl.length > 2 ) :
                    if( typeof me_gu == "undefined" ){
                        like_str = $.i18n.getString("FEED_3PEOPLE_LIKE", guAll[epl[0]].nk.replaceOriEmojiCode(), (epl.length-1) );
                    } else {
                        if( 0==me_pos ){
                            like_str = $.i18n.getString("FEED_YOU_AND_3PEOPLE_LIKE", $.i18n.getString("COMMON_YOU"), guAll[epl[1]].nk.replaceOriEmojiCode(), (epl.length-2) );
                        } else {
                            like_str = $.i18n.getString("FEED_YOU_AND_3PEOPLE_LIKE", $.i18n.getString("COMMON_YOU"), guAll[epl[0]].nk.replaceOriEmojiCode(), (epl.length-2) );
                        }
                    }
                    break;
            }
        } catch(e){
            cns.debug( e );
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
             break;
         case 6:
             break;
        };

        //讚留言閱讀
        this_event.find(".st-sub-box-3 div:eq(0)").html(e_data[0].meta.lct);
        this_event.find(".st-sub-box-3 div:eq(1)").html(e_data[0].meta.pct);
        this_event.find(".st-sub-box-3 div:eq(2)").html(e_data[0].meta.rct);
    }

         


	//回覆 detail timeline message內容
    detailTimelineContentMake = function (this_event,e_data,reply_chk){
        var this_gi = this_event.data("event-id").split("_")[0];
        var this_ei = this_event.data("event-id");

        //event 自己的閱讀回覆讚好狀態
        var event_status = this_event.data("event-status");


        //event path
        this_event.data("event-path",this_ei);

        //更新數字
        this_event.find(".st-sub-box-3 div:eq(0)").html(e_data[0].meta.lct);
        this_event.find(".st-sub-box-3 div:eq(1)").html(e_data[0].meta.pct);
        this_event.find(".st-sub-box-3 div:eq(2)").html(e_data[0].meta.rct);

        //已讀亮燈
        this_event.find(".st-sub-box-3 img:eq(2)").attr("src","images/icon/icon_view_activity.png")
        
        //製作每個回覆
        var okCnt = 0;
        $.each(e_data,function(el_i,el){
            cns.debug("====================回覆============================================================================");
            cns.debug("el",el);

            var without_message = false;
            var reply_content;
            var ml_arr = [];
            
            this_event.find(".st-reply-all-content-area").append($('<div>').load('layout/timeline_event.html .st-reply-content-area',function(){
                var this_load = $(this).find(".st-reply-content-area");
                var this_content = this_load.find(".st-reply-content");

                $.each(el.ml,function(i,val){

                    cns.debug("========================");
                    cns.debug(JSON.stringify(val,null,2));
                    
                    //event種類 不同 讀取不同layout
                    switch(val.tp){
                        case 0:
                            this_content.prepend(htmlFormat(val.c));
                            break;
                        case 1:
                            break;
                        case 5:
                            var sticker_path = "sticker/" + val.c.split("_")[1] + "/" + val.c + ".png";
                            this_content.find(".sticker").attr("src",sticker_path).show();
                            break;
                        case 6:
                            this_content.find(".au-area").show();
                            getS3file(val,this_content,val.tp,280);
                            break;
                        case 7://影片
                            getS3file(val,this_content.find("video"),val.tp,280);
                            break;
                        case 8://聲音
                            getS3file(val,this_content.find("audio"),val.tp,280);
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

                            without_message = true;

                            break;
                        case 14:
                            if(reply_chk) break;

                            //投票內容 照理說要做投票表格 但因為是非同步 因此先做的話 會無法更改資料
                            voteContentMake(this_event,val.li);
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
                        case 18:

                            without_message = true;
                            break;
                    }
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
					var _groupList = $.lStorage(ui);
                    try{
                        var user_name = _groupList[this_gi].guAll[el.meta.gu].nk.replaceOriEmojiCode();
                        //大頭照
                        if(_groupList[this_gi].guAll[el.meta.gu].aut){
                            this_load.find(".st-user-pic img").attr("src",_groupList[this_gi].guAll[el.meta.gu].aut);
                            // this_load.find(".st-user-pic img:eq(1)").attr("src",_groupList[this_gi].guAll[el.meta.gu].auo);
                            this_load.find(".st-user-pic.namecard").data("auo",_groupList[this_gi].guAll[el.meta.gu].auo);
                            avatarPos(this_load.find(".st-user-pic img"));
                        }
                    } catch(e) {
                        this_load.remove();
                        okCnt++;
                        return;
                    }
					

                    // namecard
                    this_load.find(".st-user-pic.namecard").data("gi",this_gi);
                    this_load.find(".st-user-pic.namecard").data("gu",el.meta.gu)

                    

                    this_load.find(".st-reply-username").html(user_name.replaceOriEmojiCode());
                    
                    //時間
                    this_load.find(".st-reply-footer span:eq(0)").html(new Date(el.meta.ct).toFormatString());

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
                            this_load.find(".st-reply-footer img").attr("src","images/timeline/timeline_feedbox_icon_like_blue.png");
                            this_load.find(".st-reply-footer span:eq(1)").html( $.i18n.getString("FEED_UNLIKE") );
                            this_load.find(".st-reply-footer span:eq(1)").removeAttr("data-textid");
                        }
                    }
                }
                okCnt++;
                if( okCnt==e_data.length ){
                    this_event.find(".st-reply-all-content-area").slideDown().data("show",true);
                }

                this_event._i18n();
            }));    
        }); 
    }


	//動態消息 判斷關閉區域
	timelineDetailClose = function (this_event,tp){

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
				this_event.find(detail_data).toggle();
				this_event.find(detail_data + "-detail").toggle();
				break;
		}

		//判斷detail區塊開啟或關閉 以及 若曾經開啟過 就不做後續的api
		//一般的開關區域
		var conten_div = ".st-sub-box-2-content";
		if(this_event.find(".st-box2-more-desc").html()){
			conten_div = ".st-box2-more-desc";
		}
		//一般區域開關
		this_event.find(conten_div).toggle();
		this_event.find(conten_div + "-detail").toggle();	
		//detail區域開關
		this_event.find(detail_data).toggle();
		this_event.find(detail_data + "-detail").toggle();
		
		//開啟留言區域
        if( this_event.find(".st-reply-all-content-area").data("show")==true ){
	       this_event.find(".st-reply-all-content-area").slideUp("",function(){
                $(this).html("");
                this_event.find(".st-reply-like-area").toggle();
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
		$.each(li,function(i,val){
			var temp_arr = val.u.split(",");

			if($.inArray(gu,temp_arr) >= 0){
				val.m = true;
				me_arr.push(val);
			}else{
				rest_li.push(val);
			}
		});
		var new_li = me_arr.concat(rest_li);
		var _groupList = $.lStorage(ui);
		//重置
		this_event.find(".st-task-work-detail").html("");
		cns.debug("new_li:",new_li);
		$.each(new_li,function(i,val){
			var this_work = $('<div class="st-work-option" data-item-index="' + val.k + '"><img src="images/common/icon/icon_check_round_white.png"><span>' + val.d + '</span><div class="st-work-option-tu"><img src="images/common/icon/icon_work_member_gray.png"/><span>' + _groupList[gi].guAll[val.u].nk + '</span></div></div>');
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

			//不是自己的工作 或是結束時間到了 就不能點選
			if(!this_work.data("mine") || this_event.data("task-over")) return false;

			if(this_work.data("work-status")){
				var work_status = false;
			}else{
				var work_status = true;

				//表示最後一個工作也要完成了
				if(mine_finished_total == mine_total-1) fin = true;
			}

			var api_name = "groups/" + gi + "/timelines/" + ti_feed + "/events?ep=" + this_event.data("event-id");

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

	voteContentMake = function (this_event,li){
		$.each(li,function(v_i,v_val){
			this_event.find(".st-vote-all-ques-area").append($('<div class="st-vote-ques-area-div">').load('layout/timeline_event.html .st-vote-ques-area',function(){
				var this_ques = $(this).find(".st-vote-ques-area");
				
				//設定題目的編號
				this_ques.data("ques-index",v_val.k);

				// 單選是圈圈
        		var tick_img = "images/common/icon/icon_check_red_round.png";
        		//複選是勾勾
	        	if(v_val.v > 1){
	        		tick_img = "images/common/icon/icon_check_red.png";
				}
				//
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
					        '<img src="images/common/icon/icon_check_round_white.png"/>' +
					        '<span>' + i_val.o + '</span>' +
					        '<span>' + 0 + '</span>' +
					    '</div>'
					);

					//設定複選投票數為 0
		        	this_ques.data("multi-count",0);
				});
				
				//load結束 呼叫function 製作投票結果呈現
				if(v_i == li.length - 1){
                    setTimeout(function(){
                        voteResultMake(this_event);
                    },500);
					
				}
            }));
		});

	}

	voteResultMake = function (this_event){
		
		var vote_obj = this_event.data("vote-result");
		var all_ques = this_event.find(".st-vote-ques-area");
		//設定投票人數
	    this_event.find(".st-task-vote-detail-count span").html(Object.keys(vote_obj).length + "人已投票");
		//預設opt 為全部都沒選 fasle
		this_event.find(".st-vote-detail-option").data("vote-chk",false);

    	//根據每個答案的gu  
        $.each(vote_obj,function(ans_gu,ans_val){
        	//答案的多個題目
        	$.each(ans_val.li,function(k_i,k_val){
        		//每個題目
		        $.each(all_ques,function(ques_i,ques_val){
		        	var this_ques = $(this);
            		//題目的編號 和 答案的編號相同 而且 有投票的內容(可能 "i": [])
            		if(k_val.k == this_ques.data("ques-index") && k_val.i){
            			//答案的多個投票
	            		$.each(k_val.i,function(i_i,i_val){

	            			//最後一個 每個選項的k
	            			$.each(this_ques.find(".st-vote-detail-option"),function(opt_i,opt_val){
	            				var this_opt = $(this);
	    						if(this_opt.data("item-index") == i_val.k){
	    							var count = this_opt.find("span:eq(1)").html();
	    							this_opt.find("span:eq(1)").html(count*1+1);
	    							
	    							//自己投的 要打勾
					            	if(ans_gu == gu){
					            		//已投過票數加一
					            		var n = this_ques.data("multi-count")*1;
					            		this_ques.data("multi-count",n+1)
					            		this_opt.data("vote-chk",true);
					            		this_opt.find("img").attr("src",this_ques.data("tick-img"));
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
		this_event.find(".st-vote-detail-option").click(function(){
			cns.debug("進來");
			//時間到 不給點
			if(this_event.data("task-over")){
				cns.debug("時間到");
				return false;
			}

			var this_ques = $(this).parent();
			var this_opt = $(this);

			//復選的已選計數 單選也用來判斷有無投票
			var vote_cnt = this_ques.data("multi-count");
			var vote_chk = false;

			//複選
			if(this_ques.data("vote-multi") > 1){
				//該選項的總計數
				var opt_cnt = this_opt.find("span:eq(1)").html()*1;

				cns.debug("復選");
				//復選的情況就要判斷該選項是否已選擇
				if(this_opt.data("vote-chk")){
					this_opt.data("vote-chk",false);
					this_opt.find("img").attr("src","images/common/icon/icon_check_round_white.png");

					//該項總計減一
					
					opt_cnt -= 1;

					//減一 統計複選票數 才能計算是否達複選上限
					this_ques.data("multi-count",vote_cnt-1);

				//沒選變已選 投票數未達上限
				}else if(vote_cnt <  this_ques.data("vote-multi")){

					this_opt.data("vote-chk",true);

					//加一 統計複選票數 才能計算是否達複選上限
					this_ques.data("multi-count",vote_cnt+1);

					//該項總計加一
					opt_cnt += 1;

					//複選 這時要變勾勾
					this_opt.find("img").attr("src",this_ques.data("tick-img"));
				}

			//單選
			}else{
				cns.debug("單選");
				//找出點選的那一項要減一
				$.each(this_ques.find(".st-vote-detail-option"),function(i,val){
					if($(this).data("vote-chk")){
						cns.debug("here");
						//找出點選的那一項的vote-chk 變false
						$(this).data("vote-chk",false);
						//找出點選的那一項 變成白圈圈
						$(this).find("img").attr("src","images/common/icon/icon_check_round_white.png");

						//該項總計減一
						var this_cnt = $(this).find("span:eq(1)").html()*1;
						//更改票數
						$(this).find("span:eq(1)").html(this_cnt-1);
					}
				});

				//該選項的總計數
				var opt_cnt = this_opt.find("span:eq(1)").html()*1;

				this_opt.data("vote-chk",true);

				//單選 選到的直接是圈圈
				this_opt.find("img").attr("src",this_ques.data("tick-img"));


				//該項總計加一
				opt_cnt += 1;

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

			//沒藍色表示不給送出
			if(!$(this).hasClass("st-vote-send-blue")){
				return false;
			}

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
			var api_name = "groups/" + gi + "/timelines/" + ti_feed + "/events?ep=" + this_event.data("event-id");

	        var headers = {
	                 "ui":ui,
	                 "at":at, 
	                 "li":lang,
	                     };


	        var method = "post";
	        ajaxDo(api_name,headers,method,true,body).complete(function(data){
                if( 200==data.status ){
                    //重新讀取detail
                    // popupShowAdjust("","回覆成功");
                    toastShow( $.i18n.getString("FEED_VOTE_SENDED") );
                    this_event.find(".st-vote-send").removeClass("st-vote-send-blue");
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
	}


	composeContentMake = function (compose_title){

		//開始讀取
		$('.cp-content-load').html($('<div>').load('layout/compose.html .cp-content',function(){

			var this_compose = $(this).find(".cp-content");
            this_compose._i18n();

			//設定 重複送出檢查
			this_compose.data("send-chk",true);

			this_compose.css("min-height",$(window).height());
			//發文類型陣列以及檢查附檔存在
			this_compose.data("message-list",[0]);

			//圖片上傳物件及流水號
			this_compose.data("upload-obj",{});
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
		            show_area = ".cp-content-title ,.cp-content-object, .cp-content-apt , .cp-content-top";

		        	break;
		        case "work"://cp-work-area
		        	ctp = 3;
		        	show_area = ".cp-content-title ,.cp-work-area,.cp-content-addcal,.cp-time-area";
		        	composeWorkEvent(this_compose);
		        	
		        	init_datetimepicker = true;

		          	break;
		        case "vote":
		        	ctp = 4;
		        	show_area = ".cp-content-title,.cp-content-object, .cp-content-object ,.cp-vote-area,.cp-content-addcal,.cp-time-area";  //.cp-content-first,

		        	//預設題目數為0
		        	this_compose.data("ques-total",0);

		        	init_datetimepicker = true;

		        	composeVoteQuesMake(this_compose);
		        	composeVoteEvent(this_compose);
		        	
		          	break;
		        case "check":
		        	ctp = 5;
		          	break;
		    }

		    //發佈對象
		    composeObjectShow(this_compose);

			//狀態編號
			this_compose.data("compose-tp",ctp);
			//message list 宣告為空陣列

			this_compose.find(show_area).show();

			//共同綁定事件
			//打勾
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
			this_compose.find('.cp-textarea-desc').bind('input',function(){
				//有東西就不作了
				if(this_compose.data("url-chk")) return false;

				//先將換行符號換成<br/>加空格 再以空格切出陣列
				var url_chk = this_compose.find('.cp-textarea-desc').val().replace(/\n|\r/g," <br/> ").split(' ');
				
				$.each(url_chk,function(i,val){
					if(val.substring(0, 7) == 'http://' || val.substring(0, 8) == 'https://'){
						this_compose.data("url-chk",true);
						if(val.match(/youtube.com|youtu.be|m.youtube.com/)){
                            cns.debug("qqq");
							getLinkYoutube(this_compose,val);
						}else{
                            cns.debug("www");
							getLinkMeta(this_compose,val);
						}
						return false;
					}else{
			            //暫時
			   			//this_compose.find(".cp-attach-area").hide();
						// this_compose.find(".cp-ta-yql").hide();
					}
				});
			});

			//datetimepicker
			if(init_datetimepicker){
				setDateTimePicker(this_compose);
			}
		}));
	}


	getGroupAllUser = function(this_gi,ajax_load,err_show){
		var err_show = err_show || false;
		var api_name = "groups/" + this_gi + "/users";
        var headers = {
            "ui":ui,
            "at":at,
            "li":lang,
        };
        var method = "get";
        return ajaxDo(api_name,headers,method,ajax_load,false,false,err_show);
	}

	composeObjectShow = function(this_compose){

		//避免重複綁定事件 先解除
        $(document).off('click', '.cp-content-object ,.cp-work-item-object');
    	$(document).on("click",".cp-content-object ,.cp-work-item-object", function(){
            composeObjectShowDelegate( this_compose, $(this) );
        });
	}

    composeObjectShowDelegate = function( this_compose, this_compose_obj, option, onDone ){
        $(".header-cp-object span:eq(1)").html(0);

        //設定高
        var padding_top = $(".obj-selected").outerHeight();
        $(".obj-cell-area").css("padding-top",padding_top);
        $(".obj-cell-area").css("height",$(window).height()-57-padding_top);

        // var this_compose_obj = $(this);
        $.mobile.changePage("#page-object", {transition: "slide"});

        var guAll = $.lStorage(ui)[gi].guAll;
        var bl = $.lStorage(ui)[gi].bl;

        $(".obj-cell-area").html("");

        //工作
        var obj_data;
        var isShowGroup = false;
        var isShowSelf = false;
        var isShowAll = true;
        var isShowFav = true;
        if( null== option ){
            if(this_compose_obj.parent().hasClass("cp-work-item")){
                //工作發佈對象
                isShowGroup = false;
                isShowSelf = false;
            }else{
                //其餘發佈對象
                isShowGroup = true;
                isShowSelf = true;
            }
        } else {
            isShowGroup = (null==option.isShowGroup) ? isShowGroup: option.isShowGroup;
            isShowSelf = (null==option.isShowSelf) ? isShowSelf : option.isShowSelf;
            isShowAll = (null==option.isShowAll) ? isShowAll : option.isShowAll;
            isShowFav = (null==option.isShowFav) ? isShowFav : option.isShowFav;
        }

        if(this_compose_obj.parent().hasClass("cp-work-item")){
            obj_data = this_compose_obj.data("object_str");
        }else{
            obj_data = this_compose.data("object_str");
        }

        $(".obj-content").data("selected-branch",{});
        $(".obj-content").data("selected-obj",{});
        updateSelectedObj();
        
        //----- 自己 -------
        if( isShowSelf ){
            var cell = $("<div class='obj-cell self'>"+
                '<div class="obj-cell-chk"><div class="img"></div></div>' +
                '<div class="obj-cell-user-pic"><img src="images/common/others/select_empty_personal_photo.png" style="width:60px"/></div>' +
                '<div class="obj-cell-subgroup-data">' + 
                    '<div class="obj-user-name">' + $.i18n.getString("COMMON_SELF") + '</div></div>');
            $(".obj-cell-area").append(cell);
            cell.off("click").click( function(){
                clearMeAndAllSelect();
                clearMemAndBranchAll();
                if( !$(this).data("chk") ){
                    $(this).data("chk",true);
                    $(this).find(".img").addClass("chk");
                    //set only me select
                    var guTmp = $.lStorage(ui)[gi].gu;
                    var gn = $.lStorage(ui)[gi].guAll[gu].nk;
                    var obj = {};
                    obj[guTmp] = gn;
                    $(".obj-content").data("selected-branch",{});
                    $(".obj-content").data("selected-obj",obj);
                    
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
                }
                updateSelectedObj();
            });
        }

        //----- 全選 ------
        if( isShowAll ){
            var cell = $("<div class='obj-cell all'>"+
                '<div class="obj-cell-chk"><div class="img"></div></div>' +
                '<div class="obj-cell-user-pic"><img src="images/common/others/select_empty_all_photo.png" style="width:60px"/></div>' +
                '<div class="obj-cell-subgroup-data">' + 
                    '<div class="obj-user-name">' + $.i18n.getString("COMMON_SELECT_ALL") + '</div></div>');
            $(".obj-cell-area").append(cell);
            cell.data("chk",true);
            cell.find(".img").addClass("chk");
            cell.off("click").click( selectTargetAll );
        }

        //----- 我的最愛 ------
        if( isShowFav ){
            var tmp = $("<div class='subgroup-row'></div>");
            var innerTmp = $("<div class='subgroup-parent'></div>");
            var firststCell = $("<div class='obj-cell fav'>"+
                '<div class="obj-cell-chk"></div>' +
                '<div class="obj-cell-user-pic"><img src="images/common/others/empty_img_favor.png" style="width:60px"/></div>' +
                '<div class="obj-cell-subgroup-data">' + 
                    '<div class="obj-user-name">' + $.i18n.getString("COMMON_FAVORIATE") + '</div></div>');
            innerTmp.html(firststCell);
            innerTmp.append('<div class="obj-cell-arrow"></div>');
            
            var memfold = $("<div></div>");
            memfold.css("display","none")
            $.each(guAll,function(i,gu_obj){
                if( gu_obj.fav==true ){
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
                    memfold.append(this_obj);
                }
            });
            tmp.append( innerTmp );
            tmp.append( memfold );
            $(".obj-cell-area").append(tmp);
            
            tmp.find(".obj-cell.fav").off("click").click( function(){
                $(this).next().toggleClass("open");
                $(this).parent().next().toggle();
            });
        }

        //----- 團體列表 ------
        if( bl&&isShowGroup&&Object.keys(bl).length>0 ){
            $(".obj-content").data("selected-branch",{});
            //標題bar
            var memSubTitle = $("<div class='obj-cell-subTitle group' data-chk='false'></div>");
            memSubTitle.append( '<div class="obj-cell-subTitle-chk">'+
                '<div class="img"></div>'+
                '<div class="select">'+$.i18n.getString("COMMON_SELECT_ALL")+'</div></div>' );
            memSubTitle.append( "<div class='text'>"+$.i18n.getString("COMPOSE_SUBGROUP")+"</div>" );
            $(".obj-cell-area").append(memSubTitle);

            //團體rows
            $.each(bl,function(key,bl_obj){
                //第一層顯示開關
                if(1==bl_obj.lv){
                    var tmp = $("<div class='subgroup-row'></div>");
                    var innerTmp = $("<div class='subgroup-parent'></div>");
                    var firststCell = $("<div class='obj-cell subgroup branch' data-bl='"+key+"' data-bl-name='"+bl_obj.bn+"'>"+
                        '<div class="obj-cell-chk"><div class="img"></div></div>' +
                        // '<div class="obj-cell-user-pic"><img src="images/common/others/select_empty_group_photo.png" style="width:60px"/></div>' +
                        '<div class="obj-cell-user-pic"><img src="images/common/others/select_empty_all_photo.png" style="width:60px"/></div>' +
                        '<div class="obj-cell-subgroup-data">' + 
                            '<div class="obj-user-name">' + bl_obj.bn.replaceOriEmojiCode() + '</div></div>');
                    firststCell.data( "bl-name", bl_obj.bn );
                    firststCell.data( "bl", key );
                    innerTmp.html(firststCell);
                    // tmp.data("bi",key);
                    tmp.html( innerTmp );
                    if(bl_obj.cl.length>0){
                        innerTmp.append('<div class="obj-cell-arrow"></div>');
                        createChild( bl, tmp, bl_obj );
                    }
                    $(".obj-cell-area").append(tmp);
                    $(".obj-cell-area").append('<hr color="#F3F3F3">');
                }
            });

            $(".obj-cell-area").find(".obj-cell-arrow").off("click").click( function(){

                var dom = $(this).parent().next();
                if( $(this).hasClass("open") ){
                    $(this).removeClass("open");
                    dom.slideUp();
                } else {
                    $(this).addClass("open");
                    dom.slideDown();
                }
            });


            //branch全選
            memSubTitle.off("click").click( function(){
                clearMeAndAllSelect();

                if( $(this).data("chk") ){
                    $(this).data("chk", false );
                    $(this).find(".img").removeClass("chk");

                    //deselect all
                    $(".obj-cell-area").find(".obj-cell.branch").each(function(){
                        var this_cell = $(this);
                        this_cell.data("chk",false);
                        this_cell.find(".obj-cell-chk .img").removeClass("chk");
                    });

                    //存回
                    $(".obj-content").data("selected-branch",{});
                } else {
                    $(this).data("chk", true );
                    $(this).find(".img").addClass("chk");

                    //select all mem
                    var selected_obj = {};
                    $(".obj-cell-area").find(".obj-cell.branch").each(function(){
                        var this_cell = $(this);
                        this_cell.data("chk",true);
                        this_cell.find(".obj-cell-chk .img").addClass("chk");

                        if( this_cell.data("bl-name") ){
                            selected_obj[this_cell.data("bl")] = this_cell.data("bl-name");
                        }
                    });

                    //存回
                    $(".obj-content").data("selected-branch",selected_obj);
                }

                updateSelectedObj();
            });
        }


        //----- 加入成員列表 ------
        
        //標題bar
        var memSubTitle = $("<div class='obj-cell-subTitle mem'></div>");
        if( isShowGroup ){ //show群組的話show全選圈圈
            memSubTitle.append( '<div class="obj-cell-subTitle-chk">'+
                '<div class="img"></div>'+
                '<div class="select">'+$.i18n.getString("COMMON_SELECT_ALL")+'</div></div>' );
        }
        memSubTitle.append( "<div class='text'>"+$.i18n.getString("COMMON_MEMBER")+"</div>" );
        $(".obj-cell-area").append(memSubTitle);
        
        //mem全選
        memSubTitle.click( function(){
            clearMeAndAllSelect();

            if( $(this).data("chk") ){
                $(this).data("chk", false );
                $(this).find(".img").removeClass("chk");

                //deselect all
                $(".obj-cell-area").find(".obj-cell.mem").each(function(){
                    var this_cell = $(this);
                    this_cell.data("chk",false);
                    this_cell.find(".obj-cell-chk .img").removeClass("chk");
                });

                //存回
                $(".obj-content").data("selected-obj",{});
            } else {
                $(this).data("chk", true );
                $(this).find(".img").addClass("chk");

                //select all mem
                var selected_obj = {};
                $(".obj-cell-area").find(".obj-cell.mem").each(function(){
                    var this_cell = $(this);
                    this_cell.data("chk",true);
                    this_cell.find(".obj-cell-chk .img").addClass("chk");
                    
                    if( this_cell.data("gu-name") ){
                        selected_obj[this_cell.data("gu")] = this_cell.data("gu-name");
                    }
                });

                //存回
                $(".obj-content").data("selected-obj",selected_obj);
            }

            updateSelectedObj();
        });

        //成員rows
        $.each(guAll,function(i,gu_obj){
            var this_obj = $(
                '<div class="obj-cell mem" data-gu="'+gu_obj.gu+'">' +
                   '<div class="obj-cell-chk"><div class="img"></div></div>' +
                   '<div class="obj-cell-user-pic namecard"><img src="images/common/others/empty_img_personal_xl.png" style="width:60px"/></div>' +
                   '<div class="obj-cell-user-data">' + 
                        '<div class="obj-user-name">' + gu_obj.nk.replaceOriEmojiCode() + '</div>' +
                        '<div class="obj-user-title"></div>' +
                '</div>'
            );
            var object_img = this_obj.find(".obj-cell-user-pic img");
            if(gu_obj.aut) {
                object_img.attr("src",gu_obj.aut);
                //object_img.removeAttr("style");
                avatarPos(object_img);
            }

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

            this_obj.data("gu",gu_obj.gu);
            this_obj.find(".obj-cell-user-pic.namecard").data("gu",gu_obj.gu);
            this_obj.data("gu-name",gu_obj.nk);
            $(".obj-cell-area").append(this_obj);
        });

        //已經有內容 就製作已選的樣式
        console.debug("obj_data:",obj_data);
        if(obj_data){
            obj_data = $.parseJSON(obj_data);
            if(Object.keys(obj_data).length){
                $(".obj-content").data("selected-obj",obj_data);
                $(document).find(".obj-cell").each(function(i,val){
                    var this_cell = $(this);
                    //有被選擇過 存在obj_data中
                    if($.inArray(this_cell.data("gu"),Object.keys(obj_data)) >= 0){
                        this_cell.data("chk",true);
                        this_cell.find(".obj-cell-chk .img").addClass("chk");
                        // this_cell.find(".obj-cell-chk img").attr("src","images/common/icon/icon_check_round_check.png");
                        // this_cell.find(".img").addClass("chk");
                    }else{
                        this_cell.data("chk",false);
                        this_cell.find(".obj-cell-chk .img").removeClass("chk");
                        // this_cell.find(".obj-cell-chk img").attr("src","images/common/icon/icon_check_round.png");
                        // this_cell.find(".img").removeClass("chk");
                    }
                });

                updateSelectedObj();
            }
                
        }else{
            //reset
            $(".obj-content").data("selected-obj",{});  
        }

        //避免重複綁定事件 先解除
        $(document).off('click', '.obj-cell.mem');
        $(document).on("click",".obj-cell.mem",function(){
            clearMeAndAllSelect();
            
            var search = ".obj-cell.mem[data-gu="+$(this).data("gu")+"]";
            var this_cell = $(search);
            if( this_cell.length==0 ){
                this_cell = $(this);
            }
            var selected_obj = $(".obj-content").data("selected-obj");
            // cns.debug("selected_obj:",selected_obj);
            
            //工作是單選
            if(this_compose_obj.parent().hasClass("cp-work-item")){
                cns.debug("work");
                //全部清除
                // $(document).find(".obj-cell-chk img").attr("src","images/common/icon/icon_check_round.png");
                $(document).find(".obj-cell-chk").data("chk",false);
                $(document).find(".obj-cell-chk .img").removeClass("chk");

                this_cell.data("chk",true);
                this_cell.find(".obj-cell-chk .img").addClass("chk");
                // this_cell.find(".obj-cell-chk img").attr("src","images/common/icon/icon_check_round_check.png");

                $(".obj-selected .list").html("<span>" + this_cell.data("gu-name") + "</span>");
                //重置
                selected_obj ={};
                selected_obj[this_cell.data("gu")] = this_cell.data("gu-name");
            }else{
                //其餘發佈對象是復選
                //是否點選
                if(this_cell.data("chk")){
                    this_cell.data("chk",false);
                    this_cell.find(".obj-cell-chk .img").removeClass("chk");
                    // this_cell.find(".obj-cell-chk img").attr("src","images/common/icon/icon_check_round.png");
                    
                    delete selected_obj[this_cell.data("gu")];
                    
                }else{
                    this_cell.data("chk",true);
                    this_cell.find(".obj-cell-chk .img").addClass("chk");
                    // this_cell.find(".obj-cell-chk img").attr("src","images/common/icon/icon_check_round_check.png");
                    
                    if( this_cell.data("gu-name") ){
                        selected_obj[this_cell.data("gu")] = this_cell.data("gu-name");
                    }
                }
            }

            //存回
            $(".obj-content").data("selected-obj",selected_obj);

            updateSelectedObj();
        });

        $(document).off('click', '.obj-cell.branch:not(.subgroup)');
        $(document).on("click",".obj-cell.branch:not(.subgroup)",function(){
            clearMeAndAllSelect();

            var this_cell = $(this);
            var selected_obj = $(".obj-content").data("selected-branch");
            // cns.debug("selected_obj:",selected_obj);
            
            //其餘發佈對象是復選
            //是否點選
            if(this_cell.data("chk")){
                this_cell.data("chk",false);
                this_cell.find(".obj-cell-chk .img").removeClass("chk");
                // this_cell.find(".obj-cell-chk img").attr("src","images/common/icon/icon_check_round.png");
                
                delete selected_obj[this_cell.data("bl")];
                
            }else{
                this_cell.data("chk",true);
                this_cell.find(".obj-cell-chk .img").addClass("chk");
                // this_cell.find(".obj-cell-chk img").attr("src","images/common/icon/icon_check_round_check.png");
                
                if( this_cell.data("bl-name") ){
                    selected_obj[this_cell.data("bl")] = this_cell.data("bl-name");
                }
            }

            //存回
            $(".obj-content").data("selected-branch",selected_obj);

            updateSelectedObj();
        });

        $(document).off('click', '.obj-cell.subgroup');
        $(document).on("click",".obj-cell.subgroup",function(){
            clearMeAndAllSelect();

            var this_cell = $(this);
            var selected_obj = $(".obj-content").data("selected-branch");
            // cns.debug("selected_obj:",selected_obj);

            //其餘發佈對象是復選
            //是否點選
            if(this_cell.data("chk")){
                this_cell.data("chk",false);
                this_cell.find(".obj-cell-chk .img").removeClass("chk");
                // this_cell.find(".obj-cell-chk img").attr("src","images/common/icon/icon_check_round.png");
                
                delete selected_obj[this_cell.data("bl")];

                //deselect sub-branches if all sub r selected
                var sublist = this_cell.parent().next().find(".obj-cell.branch");
                var allChkTrue = true;
                sublist.each( function(){
                    if( !$(this).data("chk") ){
                        allChkTrue = false;
                        return false;
                    }
                });
                if( allChkTrue ){
                    sublist.each( function(){
                        $(this).data("chk",false);
                        $(this).find(".obj-cell-chk .img").removeClass("chk");
                        delete selected_obj[$(this).data("bl")];
                    });
                }
            }else{
                this_cell.data("chk",true);
                this_cell.find(".obj-cell-chk .img").addClass("chk");
                // this_cell.find(".obj-cell-chk img").attr("src","images/common/icon/icon_check_round_check.png");
                
                if( this_cell.data("bl-name") ){
                    selected_obj[this_cell.data("bl")] = this_cell.data("bl-name");
                }

                //select sub-branches if all sub r not selected
                var sublist = this_cell.parent().next().find(".obj-cell.branch");
                var allChkFalse = true;
                sublist.each( function(){
                    if( true == $(this).data("chk") ){
                        allChkFalse = false;
                        return false;
                    }
                });
                if( allChkFalse ){
                    sublist.each( function(){
                        $(this).data("chk",true);
                        $(this).find(".obj-cell-chk .img").addClass("chk");
                        if( $(this).data("bl-name") ){
                            selected_obj[$(this).data("bl")] = $(this).data("bl-name");
                        }
                    });
                }
            }

            //存回
            $(".obj-content").data("selected-branch",selected_obj);

            updateSelectedObj();
        });

        $(".obj-selected .clear").off("click").click( selectTargetAll );

        //避免重複
        $(".obj-done").unbind("click");
        $(".obj-done").click(function(){

            var obj_length = Object.keys($(".obj-content").data("selected-obj")).length
                +Object.keys($(".obj-content").data("selected-branch")).length;

            //工作
            if(this_compose_obj.parent().hasClass("cp-work-item")){
                var target = ".cp-work-item-object span:eq(" + this_compose_obj.parents(".cp-work-item").data("work-index") + ")";
                var selected_obj = $(".obj-content").data("selected-obj");
                var obj_str = "分派對象";
                if(obj_length){
                    var key = Object.keys(selected_obj)[0];
                    obj_str = selected_obj[key];
                    $(target).css("color","red");
                }else{
                    $(target).removeAttr("style");
                }
                $(target).html(obj_str);

                //製作發佈對象list 轉換成str 避免call by reference
                var obj_str = JSON.stringify(selected_obj);
                this_compose_obj.data("object_str",obj_str);
            }else{
                //其餘發佈對象
                if(obj_length != 0){
                    $(".cp-content-object span").html( $.i18n.getString("GROUP_MEMBERS",obj_length) );
                }else{
                    $(".cp-content-object span").html("");
                }
                
                //製作發佈對象list 轉換成str 避免call by reference
                var obj_str = JSON.stringify($(".obj-content").data("selected-obj"));
                this_compose.data("object_str",obj_str);
                var branch_str = JSON.stringify($(".obj-content").data("selected-branch"));
                this_compose.data("branch_str",branch_str);
            }

            //回上一頁
            $(".obj-done").parent().find(".page-back").trigger("click");
            if( onDone ) onDone();
        });
    }

    updateSelectedObj = function(){
        var len = 0;
        var cnt = 0;
        var branch = $(".obj-content").data("selected-branch");
        var mem = $(".obj-content").data("selected-obj");
        
        $(".obj-selected .list").html("");
        //寫入到選擇區域
        if( null != branch ){
            len += Object.keys(branch).length;
            $.each(branch,function(i,val){
                $(".obj-selected .list").append(val.replaceOriEmojiCode()+"   ");
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
            len += Object.keys(mem).length;
            $.each(mem,function(i,val){
                $(".obj-selected .list").append(val.replaceOriEmojiCode()+"   ");
            });

            var bAllSelect = true;
            $(".obj-cell.mem").each(function(){
                if( !$(this).data("chk") ){
                    bAllSelect = false;
                    return false;
                }
            });
            var all = $(".obj-cell-subTitle.mem");
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
        updateSelectedObj();
    }

    timelineObjectTabShowDelegate = function( this_event, type, onDone ){
        var list = [];
        var title = "";

        //(0=讀取, 1=按讚, 2=按X, 3=按訂閱, 4=按置頂, 7=按任務, 9 = 未讀取)
        switch( type ){
            case 0:
                var isReady = false;
                //get read
                list.push( {title:$.i18n.getString("FEED_READ"),ml:null} );
                getThisTimelinePart( this_event, 0,function(data){
                    try{
                        list[0].ml = $.parseJSON( data.responseText ).epl;
                        if(isReady){
                            showObjectTabShow(title, list, onDone);
                        } else {
                            isReady = true;
                        }
                    } catch(e) {
                        cns.debug( e );
                    }
                });
                //get unread
                list.push( {title:$.i18n.getString("FEED_UNREAD"),ml:null} );
                getThisTimelinePart( this_event, 9,function(data){
                    try{
                        list[1].ml = $.parseJSON( data.responseText ).epl;
                        if(isReady){
                            showObjectTabShow(title, list, onDone);
                        } else {
                            isReady = true;
                        }
                    } catch(e) {
                        cns.debug( e );
                    }
                });
                break;
            case 1:
                var epl = this_event.data("parti-like");
                if( null==epl || epl.length==0 ){
                    cns.debug("null epl:", epl);
                    return;
                }
                title = $.i18n.getString("FEED_LIKE")+"("+epl.length+")";
                list.push( {title:"",ml:epl} );
                if( list.length>0 ) showObjectTabShow(title, list, onDone);
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
                            var obj = $.parseJSON( data.responseText );
                            list.push( {title:"",ml:obj.epl} );
                            title = $.i18n.getString("FEED_LIKE")+"("+obj.epl.length+")";
                        } catch(e){

                        }
                    }
                    if( list.length>0 ) showObjectTabShow(title, list, onDone);
                });
        //         break;
        // }
    }

    showObjectTabShow = function( title, list, onDone ){
        var page = $("#page-tab-object");

        //title
        page.find(".header-cp-object").html( title?title:"" );

        //tabs
        var length = list.length;
        var tabArea = page.find(".tabObj-tab-area");
        var cellArea = $("#page-tab-object .tabObj-cell-area");
        tabArea.html("");
        var width = (100.0/list.length)+"%";
        $.each( list, function(index, object){
            var tab = $("<div class='tab'></div>");
            tab.data("id", index);
            tab.data("obj", object);
            tab.css("width",width);
            var tmp = "<div>" + ((object.title&&object.title.length>0)?object.title:" ") +"</div>";
            tab.html( tmp );
            tabArea.append(tab);
        });
        if( list.length<=1 ){
            tabArea.hide();
            cellArea.addClass("noTitle");
        } else {
            tabArea.show();
            cellArea.removeClass("noTitle");
        }

        //generate page when click
        tabArea.next().html("");
        $(document).find("#page-tab-object .tab").click(function(){
            $(window).scrollTop(0);
            $("body").addClass("user-info-adjust");
            setTimeout(function(){
                $("body").removeClass("user-info-adjust");
            },100);

            var tab = $(this);
            var index = tab.data("id");
            var cell = cellArea.find("._"+index);

            $("#page-tab-object .tab").removeClass("current");
            tab.addClass("current");

            if( cell.length<=0 ){
                var data = tab.data("obj");
                cell = $("<div class='obj-cell-page _"+index+"'></div>");
                cellArea.append( cell );

                //gen mem
                var guAll = $.lStorage(ui)[gi].guAll;
                var bl = $.lStorage(ui)[gi].bl;
                for(var i=0;i<data.ml.length; i++ ){
                    var gu = data.ml[i].gu;
                    var rt = data.ml[i].rt;
                    if( !gu ) continue;
                    if( !guAll.hasOwnProperty(gu) ) continue;
                    var mem = guAll[gu];
                    var this_obj = $(
                        '<div class="obj-cell mem" data-gu="'+gu+'">' +
                            '<div class="obj-cell-user-pic namecard"><img src="images/common/others/empty_img_personal_xl.png" style="width:60px"/></div>' +
                            '<div class="obj-cell-time"></div>' +
                            '<div class="obj-cell-user-data">' + 
                                '<div class="obj-user-name">' + mem.nk.replaceOriEmojiCode() + '</div>' +
                                '<div class="obj-user-title"></div>' +
                        '</div>'
                    );

                    var branchID = mem.bl;
                    var extraContent = "";  //mem.em;
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
                    cell.append(this_obj);
                }
            }
            $("#page-tab-object .obj-cell-page.current").hide().removeClass("current");
            cell.show().addClass("current");
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
        	startDate:'+1970/01/02',
            minDate: 0  ,
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

				this_ques.find('.cp-new-opt-' + opt_total + ' textarea').autosize({append: "\n"});
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
		//刪除一個投票項目
		$(document).on("click",".cp-vote-opt img",function(){
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
			//this_opt.remove();

			


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

		//可投票數加減1
		$(document).on("click",".cp-vote-pm",function(){

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
			"tp": 14
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
		var compose_content = this_compose.data("compose-content");
		var ml = this_compose.data("message-list").unique();

		//發佈上傳檢查
		var upload_chk = false;
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
					n : $.lStorage(ui)[gi].guAll[gu].nk
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

		//這邊的概念是 貼文可能會有網址 附檔之類的 有這些東西 就用這個迴圈去加出來
		//但像是任務 投票之類的 因為是可預測的 又是單一的ml 就在上面那邊解決
		$.each(ml,function(i,mtp){
			var obj = {"tp":mtp};
			var is_push = true;
			switch(mtp){
				//普通貼文
				case 0:
					obj.c = compose_content;

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
					obj.c = url_content.c
					obj.t = url_content.t;
					obj.d = url_content.d;
					obj.i = url_content.i;
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
				//圖片上傳
				case 6:
					//上傳檔案有自己的玩法
					is_push = false;

					//上傳類型
					var imageType = /image.*/;

					//發佈上傳檢查
					upload_chk = true;
					var total = Object.keys(this_compose.data("upload-obj")).length;

					var cnt = 0
					//每次上傳都歸零
					this_compose.data("uploaded-num",0);
					this_compose.data("uploaded-err",[]);
					this_compose.data("img-compose-arr",[]);

					//開啟loading icon
			        s_load_show = true;

					//先做permission id 
					cns.debug("object str:",this_compose.data("object_str"));
					// var object_obj = $.parseJSON(this_compose.data("object_str"));
					if(this_compose.data("object_str") || this_compose.data("branch_str") ){
						$.each(this_compose.data("upload-obj"),function(i,file){
                            cns.debug(this_compose.data("object_str"), this_compose.data("branch_str"))
							getFilePermissionIdWithTarget(this_compose.data("object_str"), this_compose.data("branch_str")).complete(function(data){
								var pi_result = $.parseJSON(data.responseText);
								if(data.status == 200){
									uploadImg(file,imageType,cnt,total,6,pi_result.pi);		
									cnt++;
								}
							});
						});							
							
					}else{
						$.each(this_compose.data("upload-obj"),function(i,file){
							uploadImg(file,imageType,cnt,total,6,0);
							cnt++;
						});
					}
					this_compose.data("body",body);
					break;
			}

			//會有順序問題 因為ios只會照ml順序排 所以必須設定順序
			if(is_push) body.ml.push(obj);
		});

		if(!upload_chk){
			composeSendApi(body);
		}
		
		cns.debug("good job",body);
		// return false;
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
        result.success(function(data){
        	$.mobile.changePage("#page-group-main");

        	//檢查置頂
            polling();
        	topEventChk();
        	timelineSwitch("feeds");
        	toastShow( $.i18n.getString("COMPOSE_POST_SUCCESSED") );
        });
	};

    composeCheckMessageList = function(){
        var this_compose = $(document).find(".cp-content");
        //圖檔刪光了 而且附檔區域沒有其他東西 就關閉附檔區域
        var chk = false;
        var dataList = this_compose.data("message-list");
        if( null==dataList ) return;
        cns.debug( JSON.stringify(dataList) );
        $.each(dataList,function(i,val){
            //只要有不是普通內文的就不關附檔區
            if( val > 0){
                chk = true;
                return false;
            }
        });

        if(!chk){
            this_compose.find(".cp-attach-area").hide('fast');
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


	setThisGroup = function(new_gi,gl){
		//新的gi 在新的所有團體列表
		if(!gl){
			var gl;
			$.each($.lStorage("_groupList"),function(g_i,g_val){
				if(g_val.gi == new_gi){
					gl = g_val;
				}
			});
			cns.debug("gl !:",gl);
		}else{
			cns.debug("gl:",gl);	
		}

		gi = new_gi;
		gu = gl.me;
		gn = htmlFormat(gl.gn);

		//設定左側選單 gu
		$(".sm-user-area.namecard").data("gu",gu);
		
		//header 設定團體名稱
    	$(".header-group-name div:eq(1)").html(gn);

		$.each(gl.tl,function(t_i,t_val){
			if(t_val.tp == 1){
    			ti_cal = t_val.ti;
    		}else if(t_val.tp == 2){
    			ti_feed = t_val.ti;
    		}else{
    			ti_chat = t_val.ti;
    		}
		});

		//點選團體 記錄在localstorage 以便下次登入預設
		var _groupList = {};

		//若沒有_groupList 表示為第一次使用
		if($.lStorage(ui)){
			_groupList = $.lStorage(ui);
		}

		if(typeof(_groupList[gi]) == "undefined"){
			_groupList[gi] = {};
    	}

		//更新預設團體gi
		_groupList.default_gi = gi;
		_groupList[gi].gu = gu;
		_groupList[gi].gn = gn;
		_groupList[gi].ti_cal = ti_cal;
		_groupList[gi].ti_feed = ti_feed;
		_groupList[gi].ti_chat = ti_chat;
        _groupList[gi].guall = {};
		//存回
		$.lStorage(ui,_groupList);
	};

    setSidemenuHeader = function (new_gi){
        
        //左側選單主題區域
        var this_gi = new_gi || gi;
        var pic_num = this_gi.substring(this_gi.length-1,this_gi.length).charCodeAt()%10;
        $(".sm-header").css("background","url(images/common/cover/sidemeun_cover0" + pic_num + ".png)")

        var _groupList = $.lStorage(ui);

        $(".sm-group-pic").css("background","url(" + _groupList[this_gi].aut + ")").stop().animate({
            opacity:1
        },1000);
        $(".sm-group-name").html(_groupList[this_gi].gn);
    }
	
	groupMenuListArea = function (new_gi,invite){
        
        if(!new_gi){
            setSidemenuHeader(new_gi);  
        } else {
            s_load_show = true;    
        }
        
    	getGroupList().complete(function(data){
            s_load_show = false;
	    	if(data.status != 200) return false;

	    	$(".sm-group-list-area").html("");
	    	// $(".sm-group-list-area-add").html("");
	    	//chk是開關按鈕ui變化的檢查
	    	var tmp_selector,count,chk;
	    	var group_list = $.parseJSON(data.responseText).gl;

	    	$.lStorage("_groupList",group_list);
	    	setGroupList();

	    	//管理者圖示
	    	var icon_host = "<img src='images/sidemenu/icon_host.png'/>";

			var total = group_list.length;
			// cns.debug("group list:",group_list);
	        $.each(group_list,function(i,val){

	        	//新建團體專用 記錄新增團體的資訊 用以跳轉
	        	if(new_gi && new_gi == val.gi && !invite){
	        		setThisGroup(new_gi,val);
	        	}

                tmp_selector = ".sm-group-list-area";
	        	
	        	var glt_img = "images/common/others/empty_img_all_l.png";
	        	var glo_img = "images/common/others/empty_img_all_l.png";
	            if(val.aut) {
	            	glt_img = val.aut;
	            	glo_img = val.auo;
	            }

	            var this_group = $(
	           		'<div class="sm-group-area polling-cnt enable" data-gi="' + val.gi + '" data-polling-cnt="A5" data-gu="' + val.me + '" ' + chk + '>' +
	           			'<img class="sm-icon-host" src="images/icon/icon_admin.png"/>' +
	           	        '<div class="sm-group-area-l group-pic">' +
	           	            '<img class="aut" src="' + glt_img + '">' +
	           	        '</div>' +
	           	        '<div class="sm-group-area-r">' + htmlFormat(val.gn) + '</div>' +
	           	        '<div class="sm-count" style="display:none"></div>' +
	           	    '</div>'
	     	    );

	     	    this_group.find(".group-pic").data("auo",glo_img)
	     	    $(tmp_selector).append(this_group);

	     	    //管理者圖示
	     	    if(val.ad != 1) {
	     	    	this_group.find(".sm-icon-host").hide();
	     	    }

	     	    var img = this_group.find(".sm-group-area-l img:eq(0)");
				avatarPos(img);
	        });

	        if(group_list.length > 2){
	        	$(".sm-group-switch").show();
	        }

			//設定調整團體頭像
    		$(document).data("group-avatar",true);

	        //new gi 表示新增團體 完成後跳訊息
	        if(new_gi) {
	        	//創建團體結束 取消強制開啓loading 圖示
	        	s_load_show = false;

                //加入gu all
                setGroupAllUser(false,new_gi,function(){
                    if(invite){
                        toastShow( $.i18n.getString("GROUP_JOIN_SUCC") );
                    }else{

                        toastShow( $.i18n.getString("FEED_GROUP_CREATED") );
                        $.mobile.changePage("#page-group-main");
                        timelineSwitch("feeds");

                        setSidemenuHeader(new_gi);
                    }
                });
	        }
	    });
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
		var polling_arr = polling_arr || [];
		var this_gi = polling_arr[0] || gi;
		var this_ti = polling_arr[1] || ti_feed;
        var main_gu = $("#page-group-main").data("main-gu");

        if(main_gu){
            this_gi = $("#page-group-main").data("main-gi");
            this_ti = $.lStorage(ui)[this_gi].tl[1].ti;
        }

		var event_tp = $("#page-group-main").data("navi") || "00";
	    //製作timeline
	    var api_name = "groups/"+ this_gi +"/timelines/"+ this_ti +"/events";
	    if(ct_timer){
	    	api_name = api_name + "?ct=" + ct_timer;
	    }

        if(main_gu){
            event_tp = "00";
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
	            tp: event_tp
        };
	    var method = "get";
	    var result = ajaxDo(api_name,headers,method,false);
	    result.complete(function(data){
	    	//關閉下拉更新的ui
	    	if(is_top){
				setTimeout(function(){
					$(".st-navi-area").removeClass("st-navi-fixed");
					$(".st-top-area-load").removeClass("mt");
					$(".st-refresh-top").slideUp("fast");
					$(".st-refresh-top img").hide();
					$(".st-refresh-top span").hide();
					$(".st-navi-area").data("scroll-chk",false);
				},1000);
	    	}
	    	
	    	if(data.status != 200) return false;

	    	var timeline_list = $.parseJSON(data.responseText).el;
	    	//沒資料 後面就什麼都不用了
	    	if( timeline_list.length == 0 ) {
	    		$(".feed-subarea[data-feed=" + event_tp + "]").addClass("no-data");
	        	//關閉timeline loading 開啟沒資料圖示
	        	setTimeout(function(){
	        		$(".st-feedbox-area-bottom > img").hide();
    				$(".st-feedbox-area-bottom > div").show();
	        	},2000);
	        	return false;
	    	}

            if(main_gu){
                $('<div>').load('layout/timeline_event.html .st-sub-box',function(){
                    timelineBlockMake($(this).find(".st-sub-box"),timeline_list,is_top);
                });
                return false;
            }

	    	idbRemoveTimelineEvent(timeline_list,ct_timer,polling_arr,function(){
	    		//點選其他類別 會導致timeline寫入順序錯亂 因此暫時不存db
		    	if(event_tp == "00"){
		    		//存db	    	
		            $.each(timeline_list,function(i,val){
		                val.ct = val.meta.ct;
		                val.gi = this_gi ;
		                val.tp = val.meta.tp ;

		                var tp = val.meta.tp.substring(1,2)*1;
		                //為了idb
		                if(tp > 2){
		                	val.tp = "03" ;
		                }
		                idb_timeline_events.put(val);
		            });
		    	}

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

		    			timelineBlockMake($(this).find(".st-sub-box"),timeline_list,is_top);
			    	});
		    	}
	    	});
	    });
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
                console.debug("remove onError:",result);
            }
        });
	}

    timelineBlockMake = function(this_event_temp,timeline_list,is_top,detail){

        if(!detail){
            var event_tp = $("#page-group-main").data("navi") || "00";

            if($("#page-group-main").data("main-gu")){
                var ori_selector = $(".feed-subarea[data-feed=main]");
            }else{
                var ori_selector = $(".feed-subarea[data-feed=" + event_tp + "]");
            }
            var top_subbox = ori_selector.find(".st-sub-box:eq(0)");

            var total_cnt = timeline_list.length;

            //就隱藏其他類別 開啓當下類別
            $(".feed-subarea").hide();
            ori_selector.show();

            ori_selector.data("last-ct",timeline_list.last().meta.ct);
        }
        
        var this_event = this_event_temp;
        var selector = $(".timeline-detail");
        var method = "html";

        //製作timeline
        $.each(timeline_list,function(i,val){
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
                    return;
                }

                this_event = this_event_temp.clone();
            }

            var tp = val.meta.tp.substring(1,2)*1;

            //detail 不需要
            if(!detail){
                //寫新event(等同下拉更新) 判斷有無第一個event 且 時間大於此event的ct
                if(top_subbox.length && val.meta.ct > top_subbox.data("ct")){
                    //表示這是目前timeline沒有的事件
                    method = "before";
                    selector = top_subbox;
                }
            }

            //寫入
            selector[method](this_event);

            //調整留言欄
            this_event.find(".st-reply-message-textarea").css("width",$(window).width()- (this_event.hasClass("detail") ? 200 : 450));

            //autosize textarea
            this_event.find('.st-reply-message-textarea textarea').autosize({append: "\n"});

            //記錄timeline種類
            this_event.attr("data-event-id",val.ei);
            this_event.data("event-val",val);
            this_event.data("timeline-tp",tp);
            this_event.data("parti-list",[]);
            this_event.data("ct",val.meta.ct);

            //名片使用
            this_event.find(".st-user-pic.namecard").data("gi",val.ei.split("_")[0]);
            this_event.find(".st-user-pic.namecard").data("gu",val.meta.gu);

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
            // 判斷是否有gu all
            var data_arr = ["timelineUserName",val.ei.split("_")[0] , val.meta.gu , this_event.find(".st-sub-name label") , this_event.find(".st-sub-box-1 .st-user-pic img")];
            chkGroupAllUser(data_arr);

            this_event.find(".st-sub-time").append(new Date(val.meta.ct).toFormatString());
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
                    category = $.i18n.getString("FEED_MISSION")+"<img src=\"images/task/timeline_task_icon_task_work.png\"> <span>"+$.i18n.getString("FEED_TASK")+"</span>";
                    title = $.i18n.getString("FEED_TASK");

                    //任務狀態
                    this_event.find(".st-box2-more-task-area").show();
                    this_event.find(".st-box2-more-time").show();
                    this_event.find(".st-task-status-area").show();

                    //任務預設的文字
                    this_event.find(".st-task-status").html( $.i18n.getString("FEED_UNFINISHED") );
                    break;
                case 4://投票
                    this_event.find(".st-box2-more-category").addClass("st-box2-more-category-task");
                    category = $.i18n.getString("FEED_MISSION")+"<img src=\"images/task/timeline_task_icon_task_vote.png\"> <span>"+$.i18n.getString("FEED_VOTE")+"</span>";
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
                    this_event.find(".st-box2-more-category").addClass("st-box2-more-category-task");
                    category = $.i18n.getString("FEED_MISSION")+"<img src=\"images/task/timeline_task_icon_task_checkin.png\"> <span>"+$.i18n.getString("FEED_LOCATION")+"</span>";
                    title = $.i18n.getString("FEED_LOCATION");
                    //任務狀態
                    this_event.find(".st-box2-more-task-area").show();
                    this_event.find(".st-box2-more-time").show();
                    this_event.find(".st-task-status-area").show();
                    //任務預設的文字
                    this_event.find(".st-task-status").html( $.i18n.getString("COMMON_CONSTRUCTION") ); //FEED_NOT_REPORTED
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
            
            //tp = 0 是普通貼文 在content區填內容 其餘都在more desc填
            var target_div = ".st-box2-more-desc";
            if(tp == "0"){
                target_div = ".st-sub-box-2-content";
            }

            //event status
            eventStatusWrite(this_event);

            //detail 不做filter
            if(!detail) eventFilter(this_event,$(".st-filter-area").data("filter"),val.meta);

            //timeline message內容
            timelineContentMake(this_event,target_div,val.ml);
                
        });
    }

	timelineListWrite = function (ct_timer,is_top){
		//判斷有內容 就不重寫timeline -> 不是下拉 有load chk 就 return
    	if(!ct_timer && !is_top){
    		var event_tp = $("#page-group-main").data("navi") || "00";
    		var selector = $(".feed-subarea[data-feed=" + event_tp + "]");

            //隱藏其他類別
            $(".feed-subarea").hide();
            selector.show();
            //load_chk 避免沒資料的
            selector.append("<p class='load-chk'></p>");
    	}

		var idb_timer = ct_timer - 1 || 9999999999999;
		//取得server最新資訊 更新資料庫
		idbPutTimelineEvent(ct_timer,is_top);

		//下拉更新 和 個人主頁 就不需要資料庫了
		if(is_top || $("#page-group-main").data("main-gu")) return false;

		//判斷類別
		var idb_index,idb_keyRange;
		if(!event_tp || event_tp == "00"){
			idb_index = "gi_ct";
			idb_keyRange = idb_timeline_events.makeKeyRange({
              upper: [gi,idb_timer],
              lower: [gi]
            });
		}else{
			idb_index = "gi_tp_ct";
			idb_keyRange = idb_timeline_events.makeKeyRange({
              upper: [gi,event_tp,idb_timer],
              lower: [gi,event_tp]
            })
		}

    	//同時先將資料庫資料取出先寫上
	    idb_timeline_events.limit(function(timeline_list){
            if(timeline_list.length == 0) return false;

	    	//寫timeline
	    	load_show = false;
	    	$('<div>').load('layout/timeline_event.html .st-sub-box',function(){
                $(this).find(".st-sub-box").attr("data-idb",true);
    			timelineBlockMake($(this).find(".st-sub-box"),timeline_list);
	    	});
	    },{
            index: idb_index,
            keyRange: idb_keyRange,
            limit: 20,
            order: "DESC",
            onEnd: function(result){
                console.debug("onEnd:",result);
            },
            onError: function(result){
                console.debug("onError:",result);
            }
        });
	}

	eventStatusWrite = function(this_event,this_es_obj){
        var event_status = this_event.data("event-val");
        var this_ei = this_event.data("event-id");
        var this_gi = this_ei.split("_")[0];

        var isAdmin = false;
        var isMyPost = false;
        try{
            var groupTmp = $.lStorage(ui)[this_gi];
            var meTmp = groupTmp.guAll[ groupTmp.gu ];
            isAdmin = (meTmp.ad==1);
            isMyPost = (event_status.meta.gu==groupTmp.gu);
        } catch(e){
            cns.debug(e);
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

	eventFilter = function(this_event,filter){
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

		if(filter == "all"){
			show_chk = true;
		}else if(filter == "read"){
			if(event_status.ir) show_chk = true;
		}else{
			if(!event_status.ir) show_chk = true;
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

	mathAlignCenter = function (outer,inner){
		return (outer-inner)/2;
	}
	
	//拆成detail及timeline list版 並做 html entities 和 url a tag
	timelineContentFormat = function (c,limit,ei){
		if(!c){
			return false;
		}

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


	
	timelineContentMake = function (this_event,target_div,ml,is_detail){
		
		//需要記共有幾張圖片
		var gallery_arr = [];
		var audio_arr = [],video_arr = [];

		$.each(ml,function(i,val){
			//結束時間檢查
			var end_time_chk = false;

			//有附檔 開啟附檔區域 not_attach_type_arr是判斷不開啟附檔 設定在init.js
			if($.inArray(val.tp,not_attach_type_arr) < 0 && !this_event.find(".st-sub-box-2-attach-area").is(":visible")){
				this_event.find(".st-sub-box-2-attach-area").show();
			}
			
			//更改網址成連結 
			var c = timelineContentFormat(val.c,content_limit);
			//內容格式
			switch(val.tp){
				case 0://文字
					if(!val.c) break;
					this_event.find(target_div).show();
					this_event.find(target_div).html( c[0].replaceEmoji() );
					this_event.find(target_div + "-detail").html(c[1]);
					break;
				case 1://網址 寫在附檔區域中
                    if(val.c){
                        this_event.find(".st-attach-url").click(function(){
                            try{
                                this_event.find(".st-sub-box-2-attach-area a")[0].click();
                            } catch(e) {
                                cns.debug(e);
                            }
                        });
                    }

                    if(!val.d && !val.i && !val.t) return false;

					this_event.find(".st-attach-url").show();
					this_event.find(".st-sub-box-2-attach-area").show();

					if(val.i) {
						this_event.find(".st-attach-url-img").show();
						this_event.find(".st-attach-url-img img").attr("src",val.i);
					}
					this_event.find(".st-attach-url-title").html(val.t);
					this_event.find(".st-attach-url-desc").html(val.d);
                    this_event.find(".st-attach-url-link").attr("href", val.c);

					break;
				case 2:
					this_event.find(".st-attach-url").show();
					this_event.find(".st-attach-url-img img").attr("src",val.i);
					this_event.find(".st-attach-url-img img").css("width","100%");

					var youtube_code = getYoutubeCode(val.c);
					if(youtube_code){
						this_event.find(".st-attach-youtube").show();
						this_event.find(".st-attach-youtube").html(
							'<iframe width="320" height="280" src="//www.youtube.com/embed/'+ youtube_code +'" frameborder="0" allowfullscreen></iframe>'
						);
					}else{
						this_event.find(".st-attach-url-img").show();
						this_event.find(".st-attach-url-img img").attr("src",val.i);
						
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
					
					this_event.find(".st-attach-url-img").show();
					this_event.find(".st-attach-url-img img").attr("src",val.c);
					
					//圖片滿版
					var w = this_event.find(".st-attach-url-img img").width();
					var h = this_event.find(".st-attach-url-img img").height();
					mathAvatarPos(this_event.find(".st-attach-url-img img"),w,h,0,360);
					break;
				case 5:
					var sticker_path = "sticker/" + val.c.split("_")[1] + "/" + val.c + ".png";
					this_event.find(".st-attach-sticker").show();
					this_event.find(".st-attach-sticker img").attr("src",sticker_path);
					break;
				case 6://圖片
					this_event.find(".st-attach-img").show();
					//.st-attach-img-arrow-l,.st-attach-img-arrow-r

					//必須要知道總共有幾張圖片
					gallery_arr.push(val);

					break;
                case 7://影片
                    this_event.find(".st-attach-video").show();
                    //總共有幾個聲音
                    video_arr.push(val);
                    break;
				case 8://聲音
					this_event.find(".st-attach-audio").show();
					//總共有幾個聲音
					audio_arr.push(val);
					break;
				case 9:
					this_event.find(".st-attach-map").show();
					
					this_event.find(".st-attach-map").tinyMap({
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
					break;
				case 12:
					end_time_chk = true;
					break;
				case 14:
					end_time_chk = true;
					break;
			};
			
			//需要填入結束時間 以及 結束時間存在 就填入
			if(end_time_chk){
				if(val.e){
	    			var time = new Date(val.e);
	        		var time_format = time.customFormat( "#M#/#D# #CD# #hhh#:#mm#" );

	        		var d = new Date();
	        		if(val.e < d.getTime()){
	        			this_event.find(".st-task-status").html( $.i18n.getString("FEED_CLOSED") ); //"已結束");
	        			this_event.find(".st-vote-send").html( $.i18n.getString("FEED_CLOSED") ); //"已結束");
	        			this_event.data("task-over",true);
	        		}
	    		}else{
	    			var time_format = $.i18n.getString("FEED_CLOSE_TIME_NO_LIMIT"); //"無結束時間";
	    		}
				this_event.find(".st-box2-more-time span").html(time_format);
			} 
		});

		//若有圖片 則呼叫函式處理
		if(gallery_arr.length > 0) timelineGalleryMake(this_event,gallery_arr);
		if(audio_arr.length > 0) timelineAudioMake(this_event,audio_arr);
        if(video_arr.length > 0) timelineVideoMake(this_event,video_arr);

        this_event._i18n();
	}

	timelineAudioMake = function (this_event,audio_arr){
		$.each(audio_arr,function(i,val){
			var this_audio = $(
				'<audio controls><source type="audio/mp4"></audio>'
			);
			this_event.find(".st-attach-audio").prepend(this_audio);
			getS3file(val,this_audio,8);
		});
	}

    timelineVideoMake = function (this_event,video_arr){
        $.each(video_arr,function(i,val){
            var this_video = $(
                '<video controls></video>'
            );
            this_event.find(".st-attach-video").prepend(this_video);
            getS3file(val,this_video,7);
        });
    }

	timelineGalleryMake = function (this_event,gallery_arr){
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

                getS3fileBackground(val,this_img,6,function(data){
                    gallery_arr[i].s3 = data.s3;
                    gallery_arr[i].s32 = data.s32;
                    this_img.addClass("loaded");
                });
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
                    right.append(this_img);
                }

                getS3fileBackground(val,this_img,6,function(data){
                    gallery_arr[i].s3 = data.s3;
                    gallery_arr[i].s32 = data.s32;
                    this_img.addClass("loaded");
                });
                if( i>=4 ) return false;
            });
        }

        //記錄圖片張數 以計算位移
        this_gallery.attr("cnt",count);

		//點選開啟圖庫
		this_gallery.find(".st-attach-img-area").click(function(e){
			e.stopPropagation();
			var this_img_area = $(this);
            var this_ei = this_img_area.parents(".st-sub-box").data("event-id");
            var this_gi = this_ei.split("_")[0];
            var this_ti = this_ei.split("_")[1];
            showGallery( this_gi, this_ti, gallery_arr );
		});
	}

	getS3file = function(file_obj,target,tp,size){
        var this_ei = target.parents(".st-sub-box").data("event-id");
        var this_gi = this_ei.split("_")[0];
        var this_ti = this_ei.split("_")[1];

		//default
		size = size || 350;
		var api_name = "groups/" + this_gi + "/files/" + file_obj.c + "?pi=" + file_obj.p + "&ti=" + this_ti;
        var headers = {
                 "ui":ui,
                 "at":at, 
                 "li":lang,
                     };
        var method = "get";
        var result = ajaxDo(api_name,headers,method,false);
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
						target.find("img.auo").attr("src",obj.s32).hide();
						break;
                    case 7://影片
                        target.attr("src",obj.s32).show();
                        break;
					case 8://聲音
						target.find("source").attr("src",obj.s3).show();
						break;
				}
			}else{
				return obj.s3;
			}
		});
	}

    getS3fileBackground = function(file_obj,target,tp, callback){
        var this_ei = target.parents(".st-sub-box").data("event-id");
        var this_gi = this_ei.split("_")[0];
        var this_ti = this_ei.split("_")[1];

        //default
        var api_name = "groups/" + this_gi + "/files/" + file_obj.c + "?pi=" + file_obj.p + "&ti=" + this_ti;
        var headers = {
                 "ui":ui,
                 "at":at, 
                 "li":lang,
                     };
        var method = "get";
        var result = ajaxDo(api_name,headers,method,false);
        result.complete(function(data){
            if(data.status != 200) return false;

            var obj =$.parseJSON(data.responseText);
            obj.api_name = api_name;
            if(target && tp){
                switch(tp){
                    case 6://圖片
                        //小圖
                        target.css("background-image","url("+obj.s3+")");
                        //大圖
                        target.data("auo",obj.s32);
                        break;
                    case 8://聲音
                        target.attr("src",obj.s3);
                        break;
                }
            }else{
                return obj.s3;
            }
            if( callback ) callback(obj);
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

	uploadImg = function(file,imageType,file_num,total,cp_tp,permission_id){
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
				getS3UploadUrl(ti_feed,1,permission_id).complete(function(data){
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
		        				uploadCommit(fi,ti_feed,permission_id,1,file.type,o_obj.blob.size,md).complete(function(data){

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

			                    	//判斷是否為最後一個上傳檔案
			                    	//檢查是否是最後一個上傳的檔案 若是的話 再檢查是否顯示上傳失敗訊息
									if(this_compose.data("uploaded-num") == total){
										//loading icon off
			        					s_load_show = false;
			        					$('.ui-loader').hide();
										// $(document).trigger("click");

										if(this_compose.data("uploaded-err").length > 0){
											popupShowAdjust("", $.i18n.getString("COMMON_UPLOAD_FAIL"),true); //"第" + this_compose.data("uploaded-err").sort().join("、") + "個檔案上傳失敗 請重新上傳"
										}else{
											clearTimeout(compose_timer);

											var body = this_compose.data("body");
											$.each(this_compose.data("img-compose-arr"),function(i,val){
												if(val){
													var obj = {};
													obj.tp = cp_tp;
													obj.c = val[0];
													obj.p = val[1];
													body.ml.push(obj);
												}
											});
											composeSendApi(this_compose.data("body"));	
										}
									}
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
						this_event.find(".st-reply-footer span:eq(1)").html( $.i18n.getString("FEED_UNLIKE") );

						var count = this_event.find(".st-reply-footer span:eq(2)").html()*1+1;

						this_status = true;
	        		}else{
	        			this_event.find(".st-reply-footer img").attr("src","images/icon/icon_like1_normal.png");
						this_event.find(".st-reply-footer span:eq(1)").html( $.i18n.getString("FEED_LIKE") );

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

		var q = 'https://query.yahooapis.com/v1/public/yql?q=' + encodeURIComponent('select * from html where url="' + url + '" and xpath="//img|//title|//head/meta[@property=\'og:image\' or @property=\'og:title\' or @property=\'og:description\' or @name=\'description\' ]" and compat="html5"' ) + '&format=json&callback=?';
		cns.debug("url:",q);
		$.ajax({
	        type: 'GET',
	        url: q, 
	        dataType: 'jsonp',
	        success: function(data, textStatus) {
	            var result = {};
	            var tmp_img,tmp_desc;
	            cns.debug("data:",data);

	            //error存在 就跳出
	            if(data.error) return false;
	            //預設標題
	            if(data.query.results && data.query.results.title){
	            	result.title = data.query.results.title;
	            }
	            cns.debug("data:",data.query);
	            //從meta取網址標題 大綱和圖片
	            if(data.query.results && data.query.results.meta){
	            	cns.debug("meta:",data.query.results.meta);
	            	$.each(data.query.results.meta, function(key, val){
	                    if (val.property) {

	                    	// title
	                    	if (val.property.match(/og:title/i)) {
	                            result.title = val.content;
	                        }
	                    	
	                        // description
	                        if (val.property.match(/og:description/i)) {
	                            result.description = val.content;
	                        }

	                        // img
	                        if (val.property.match(/og:image/i)) {
	                            result.img = val.content;
	                        }

	                        // 取圖片
	                        // if ((val.content.substring(0, 7) == 'http://'||val.content.substring(0, 2) == '//') && val.content.match(/\.jpg|\.png/)) {
	                        //     if (val.content != 'undefined') {
	                        //     	if(val.content.substring(0, 2) == '//'){
	                        //     		val.content = "http://" + val.content.substring(2);
	                        //     	}
	                        //     	result.img = val.content;
	                        //     }
	                        // }
	                    }

	                    if (val.name && val.name.match(/description/i)) {
                            tmp_desc = val.content;
                        }
	                });
	            }
		            

				if (!result.description) {
                    result.description = result.title;
                }

	            //如果meta圖片存在 並檢查是否圖太小 太小或沒圖的話就從網頁裡的img tag裡面隨便找一張
				if(!result.img){
					//預設圖片 隨便找一張img tag
		            if(data.query.results && data.query.results.img){
	            		$.each(data.query.results.img,function(i,val){
	                        if (val.src && val.src.match(/\.jpg|\.png/)) {
	                        	var temp_img = val.src;
	                        	if(val.src.substring(0, 4) != 'http'){
	                        		temp_img = url + temp_img;
	                        	}
	                        	result.img = temp_img;
	                        	return false;

	                        }
	                    });
	            	}
				}

            	if(result.title){
            		cns.debug("url:",result);
        			$(".cp-attach-area").show();
					$(".cp-yql-title").html(result.title);
					$(".cp-yql-desc").html(result.description.substring(0,200));
					if(result.img) $(".cp-yql-img").html("<img src='" + result.img + "'/>");  
					$(".cp-ta-yql").fadeIn();

				}

            	this_compose.data("message-list").push(1);

            	result.url = url;
            	this_compose.data("url-content",result);
    	    }
    	});
	}

	getYoutubeCode = function(url){
  		if(url.match(/youtube.com/)){
			var strpos = url.indexOf("?v=")+3;
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
		if(activityTimeout) clearTimeout(activityTimeout);
		var activityTimeout = setTimeout(function(){
			$(".cp-yql-img").html("");
		  	var result={};
		  	var youtube_code = getYoutubeCode(url);

		  	if(youtube_code){
		  		load_show = false;
				$.ajax ({
		            url: "http://gdata.youtube.com/feeds/api/videos/" + youtube_code + "?v=2&prettyprint=true&alt=jsonc",
		            complete: function(data){
		            	var result = $.parseJSON(data.responseText);
		                $(".cp-attach-area").show();
						$(".cp-yql-title").html(result.data.title);
						$(".cp-yql-desc").html(result.data.description);
						$(".cp-yql-img").html("<img src='" + result.data.thumbnail.hqDefault + "'/>");
						$(".cp-ta-yql").fadeIn();

						var url_content = {
							c: url,
							t: result.data.title,
							d: result.data.description,
							i: result.data.thumbnail.hqDefault,
							v: ""
						}
						this_compose.data("url-content",url_content);
						this_compose.data("message-list").push(2);
		            }   
		        });  
		  	}else{
		  		post_tmp_url = '';
		  		$(".cp-ta-yql").hide();
		  		getLinkMeta(this_compose,url);
		  	}
		},1000);
	}


	replySend = function(this_event){
        var this_ei = this_event.data("event-id");
        var this_gi = this_ei.split("_")[0];
        var this_ti = this_ei.split("_")[1];
        var isWaiting = false;

		var body = {
			"meta" : {
				"lv" : 1,
				"tp" : "10"
			},
			"ml" : []
		};

        var text = this_event.find(".st-reply-message-textarea textarea").val();
        if( text ){
            body.ml.push({
                "c": text,
                "tp": 0
            });
        }
        var imgArea = this_event.find(".st-reply-message-img");
        var imgType = imgArea.data("type");
        switch( imgType ){
            case 5: //sticker
                var sticker = imgArea.data("id");
                if( sticker ){
                    body.ml.push({
                        "c": sticker,
                        "tp": 5
                    });
                }
                break;
            case 6: //img
                isWaiting = true;
                var file = this_event.find(".st-reply-message-img").data("file");
                if( file ){

                    var ori_arr = [1280,1280,0.9];
                    var tmb_arr = [160,160,0.4];
                    //上傳類型
                    var imageType = /image.*/;

                    //發佈上傳檢查
                    upload_chk = true;
                    
                    //開啟loading icon
                    s_load_show = true;

                    //先做permission id 
                    cns.debug("object str:",this_event.data("object_str"));
                    // var object_obj = $.parseJSON(this_compose.data("object_str"));
                    if( this_event.data("object_str") ){
                        var obj = $.parseJSON( this_event.data("object_str") );
                        getFilePermissionId(obj).complete( function(result){
                            if( result.status==200 ){
                                try{
                                    var pi = $.parseJSON(result.responseText).pi;

                                    uploadGroupImage(file, this_ti, null, ori_arr, tmb_arr, pi, function(data){
                                        body.ml.push({
                                            "c": data.fi,
                                            "p": pi,
                                            "tp": 6
                                        });
                                        sendReply( this_event, this_gi, this_ti, this_ei, body );
                                    });
                                } catch( e ){
                                    cns.debug(e);
                                }
                            }
                        });
                    }else{
                        var pi = "0";
                        uploadGroupImage(file, this_ti, null, ori_arr, tmb_arr, pi, function(data){
                            body.ml.push({
                                "c": data.fi,
                                "p": pi,
                                "tp": 6
                            });
                            replyApi( this_event, this_gi, this_ti, this_ei, body );
                        });
                    }
                }
                break;
        }
        if( !isWaiting ){
            replyApi( this_event, this_gi, this_ti, this_ei, body );
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
            this_event.find(".st-reply-message-send").data("reply-chk",false);
            var this_textarea = this_event.find(".st-reply-message-textarea textarea");
            this_textarea.val("").parent().addClass("adjust").removeClass("textarea-animated");

            setTimeout(function(){
                if(this_event.find(".st-reply-all-content-area").is(":visible")) {
                    replyReload(this_event);
                }else{
                    if(this_event.find(".st-reply-message-img").is(":visible"))this_event.find(".st-reply-message-img").html("");
                    if(this_event.find(".stickerArea").is(":visible")) this_event.find(".stickerArea").hide();
                    this_event.find(".st-sub-box-2").trigger("detailShow");
                }
            },400);
        });
    }

	replyReload = function(this_event){

		//重置
		this_event.find(".st-reply-message-textarea textarea").val("");
        this_event.find(".st-reply-message-img").data("id",null);
        this_event.find(".st-reply-message-img").data("type",null);
        this_event.find(".st-reply-message-img").data("file",null);
        this_event.find(".st-reply-message-img").html("");  //清掉sticker預覽
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
	
    getGroupList = function(){
    	//取得團體列表
        var api_name = "groups";
        var headers = {
            "ui":ui,
            "at":at,
            "li":lang
        };
        var method = "get";
        return ajaxDo(api_name,headers,method,false);
    }

    polling = function(){
    	if(!$.lStorage("_pollingData")){
    		$.lStorage("_pollingData",{cnts:{},ts:{pt: new Date().getTime()}})
    	}
    	var local_pollingData = $.lStorage("_pollingData");
    	var polling_time = local_pollingData.ts.pt;
    	// var polling_timer = new Date().getTime();

    	var api_name = "sys/polling?pt=" + polling_time;

        var headers = {
                 "ui":ui,
                 "at":at, 
                 "li":lang,
                     };
        var method = "get";
        ajaxDo(api_name,headers,method,false,false,false,true).complete(function(data){

        	if(data.status == 200){
        		var new_pollingData = $.parseJSON(data.responseText);
                var tmp_cnts = new_pollingData.cnts;
                // new_pollingData.cnts = {};
                new_pollingData.cnts = local_pollingData.cnts;
                //cnts 做合併
                $.each(tmp_cnts,function(i,val){
                	var tmp_gi_obj = $.extend(local_pollingData.cnts[val.gi],val);
                    new_pollingData.cnts[val.gi] = tmp_gi_obj;
                });

                //gcnts 做合併
                new_pollingData.gcnts = $.extend(local_pollingData.gcnts,new_pollingData.gcnts);

                //暫存
                if(!$.lStorage("_tmpPollingData"))
                	$.lStorage("_tmpPollingData",new_pollingData);

                //寫入數字
		        pollingCountsWrite(new_pollingData);

		        //cmds api
		        pollingCmds(new_pollingData.cmds,new_pollingData.msgs,new_pollingData.ccs);

        	}else if(data.status == 401){
                //錯誤處理
                popupShowAdjust("",$.i18n.getString("LOGIN_AUTO_LOGIN_FAIL"),true,false,[reLogin]);
                clearInterval(pc);
                return false;
            }
        });
    }

    pollingCountsWrite = function(polling_data){
        var polling_data = polling_data || $.lStorage("_pollingData");
    	var cnts = polling_data.cnts;
    	var gcnts = polling_data.gcnts;

        //排序用
        var sort_arr = [];

    	if(cnts){
    		$.each(cnts,function(i,val){
	    		//是否為當下團體
	    		if(gi == val.gi){
	    			if(val.A1 > 0){
	    				$(".sm-small-area[data-sm-act=feed]").find(".sm-count").html(countsFormat(val.A1)).show();
	    			}
	    			if(val.A2 > 0){
	    				// $(".sm-small-area[data-sm-act=chat]").find(".sm-count").html(countsFormat(val.A2)).show();
	    			}
	    			if(val.A3 > 0){
	    				$(".sm-small-area[data-sm-act=chat]").find(".sm-count").html(countsFormat(val.A3)).show();
	    			}
	    			if(val.A4 > 0){
	    				// $(".sm-small-area[data-sm-act=]").find(".sm-count").html(countsFormat(val.A4)).show();
	    			}
	    		}

	    		if(val.A5 > 0){

                    sort_arr.push([val.gi,val.A5]);
	    			$(".sm-group-area[data-gi=" + val.gi + "]").find(".sm-count").html(countsFormat(val.A5)).show();
	    		}
	    	});

            //排序
            sort_arr.sort(function(a, b) {return a[1] - b[1]});
            
            for(i=0;i<sort_arr.length;i++){
                var this_group = $(".sm-group-list-area .sm-group-area[data-gi="+ sort_arr[i][0] +"]")
                var this_group_clone = this_group.clone();
                $(".sm-group-list-area").prepend(this_group_clone);
                this_group.remove();
            }
    	}

        if(!gcnts) return false;

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
    	
	    	
    }

    //目前不管timeline event 有無更新 只確認user list完成 就
    pollingCmds = function(cmds,msgs,ccs){
    	var user_info_arr = [];

    	if(cmds){
    		$.each(cmds,function(i,val){
	    		cns.debug("val.pm.gi:",val.pm.gi);
	    		switch(val.tp){
	    			case 1://timeline list
                        // 因為現在polling邏輯有問題 暫時關閉timeline 更新
	    				// var polling_arr = [val.pm.gi,val.pm.ti];
	    				
	    				if(val.pm.gi == gi && window.location.hash == "#page-group-main") {
	    					polling_arr = false;

                            idbPutTimelineEvent("",false,polling_arr);
	    				}

	    				// idbPutTimelineEvent("",false,polling_arr);
	    				break;
	    			case 4://新增gu

	    			case 5://新增gu user info
	    				user_info_arr.push(val.pm);
	    				break;
	    		}
	    	});

	    	//將tp4 tp5 的user info都更新完 再更新polling時間
	    	if(user_info_arr.length > 0){
	    		getUserInfo(user_info_arr,false,function(chk){
	    			if(chk){
	    				//更新polling
	    				pollingUpdate(msgs,ccs);
	    			}
	    		});
	    	}else{
	    		pollingUpdate(msgs,ccs);
	    	}
    	}else{
    		//沒有cmds 更新polling
    		pollingUpdate(msgs,ccs);
    	}
    }

    pollingUpdate = function(msgs,ccs){
		
		//更新polling時間
    	$.lStorage("_pollingData",$.lStorage("_tmpPollingData"));
		localStorage.removeItem("_tmpPollingData");

		//更新聊天內容
		if(msgs && msgs.length>0){
    		updateChat(msgs);
    	}

    	//更新聊天已讀未讀時間
    	if(ccs && ccs.length>0){
			updateChatCnt(ccs);
    	}
    }

    countsFormat = function(num){
    	return num > 99 ? "99+" : num;
    }

    updatePollingCnts = function(this_count,cnt_type){
    	var api_name = "sys/counts";
    	var body = {
    		cnts: [],
    		gcnts: {}
    	};

    	if(cnt_type.substring(0,1) == "G"){
			body.gcnts[cnt_type] = 0;
    	}else{
    		body.cnts[0] = {
    			gi: gi
    		};
    		body.cnts[0][cnt_type] = 0;
    	}
    	// return false;
        var headers = {
                 "ui":ui,
                 "at":at, 
                 "li":lang,
                     };
        var method = "put";
        ajaxDo(api_name,headers,method,false,body).complete(function(data){
        	if(data.status == 200){
        		this_count.hide();
        	}
        });
    }

    pollingInterval = function(show_msg){
    	if(!$(document).data("polling-chk")){
			pc = setInterval(function(){
				polling();	
			},polling_interval);
			$(document).data("polling-chk",true);
			if(show_msg) toastShow("開啓polling");
		}else{
			$(document).data("polling-chk",false);
			if(show_msg) toastShow("關閉polling");
			clearInterval(pc);
		}
    }

    

    //====================================================
    getUserInfo = function(user_info_arr,load_show_chk,callback){
        var load_show_chk = load_show_chk || false;
    	var callback = callback || false;

		//每操作一組 就踢除 直到結束
		if(user_info_arr.length > 0){
			var this_user_info = user_info_arr.last();
            var api_name = "groups/" + this_user_info.gi + "/users/" + this_user_info.gu;
            
	        var headers = {
	                 "ui":ui,
	                 "at":at,
	                 "li":"zh_TW",
			};
	        var method = "get";
	                         
	        ajaxDo(api_name,headers,method,load_show_chk,false,false,true).complete(function(data){
	        	if(data.status == 200){

	        		var user_data = $.parseJSON(data.responseText);

	        		//存local storage
	        		var _groupList = $.lStorage(ui);

	        		// 沒gu all就順便去撈 
	        		if(Object.keys(_groupList[this_user_info.gi].guAll).length > 0){
	        			cns.debug("guall content exist");
	        			_groupList[this_user_info.gi].guAll[this_user_info.gu] = user_data;
	        		}else{
	        			cns.debug("no guall content");
	            		var data_arr = ["userInfo",user_data];
	        			setGroupAllUser(data_arr,this_user_info.gi);
	        		}

	        		user_info_arr.pop();
	        		//等於0 就不用再遞迴
	        		if(user_info_arr.length == 0){
						if(callback) callback(user_data);
	        		}else{//繼續遞迴
	        			getUserInfo(user_info_arr,load_show_chk,callback);
	        		}

	        	//失敗就離開遞迴
	        	}else{ 
	        		if(callback) callback(false);
	        	}
	        });
		}
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
                
            }else{
                //css 調整
                $(".user-info-load-area .me").removeClass("me-rotate");
                $(".user-info-load-area .me").removeClass("backface-visibility");
                this_info.find(".action-edit").hide();
                this_info.find(".action-chat").off("click").click( function(){
                    requestNewChatRoomApi(this_gi, "", [{gu:this_gu}], function(data){
                    });
                });
            }

    		getUserInfo([{gi:this_gi,gu:this_gu}],false,function(user_data){
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

	        		//存local storage
	        		var _groupList = $.lStorage(ui);
	        		_groupList[this_gi].guAll[this_gu] = user_data;
	        		$.lStorage(ui,_groupList);

                    if(this_gu == gu) meInfoShow(user_data);

	        		userInfoDataShow(this_gi,this_info,user_data);
	        		userInfoEvent(this_info);
	        	}else{
		    		this_info.data("avatar-chk",false);
	        		$(".screen-lock").fadeOut("fast");
	        		this_info.fadeOut("fast");
	        	}
            });
    	});
    }

    userInfoDataShow = function(this_gi,this_info,user_data,me) {
            cns.debug("user_data",user_data);
    	var this_gi = this_gi || gi;

    	var method = "html";
    	if(me){
    		method = "val";
    	}

    	var avatar_bar_arr = ["nk","sl","bd","bl"];
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
                        var bi = user_data.bl.split(",")[0].split(".").last();
                        var bn = $.lStorage(ui)[this_gi].bl[bi].bn;
                        user_data.bl = bn;
                    } catch(e) {
                       return;
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

		if(user_data.mkp) this_info.find(".user-info-list .pn").val("******");
		if(user_data.mke) this_info.find(".user-info-list .em").val("******");
		if(user_data.mkb) {
			this_info.find(".user-avatar-bar .bd").hide();
			this_info.find(".user-info-list .bd").val("******");	
		}else{
            this_info.find(".user-avatar-bar .user-name").addClass("hidden");
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
    		this_info.find(".group-avatar img").attr("src",$.lStorage(ui)[gi].aut);
    		avatarPos(this_info.find(".group-avatar img"),60);

    		//團體名稱
    		this_info.find(".group-name").html($.lStorage(ui)[gi].gn);

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
    				if(item == "bd"){
				        user_data[item] = user_data[item].substring(0,4) + "/" + user_data[item].substring(4,6) + "/" + user_data[item].substring(6);
        			}
        			this_info.find(".user-info-list ." + item).val(user_data[item]);
    			}
    		}

    		if(user_data.mkp) this_info.find(".user-info-list .pn1").val("******");
    		if(user_data.mke) this_info.find(".user-info-list .em").val("******");
    		if(user_data.mkb) this_info.find(".user-info-list .bd").val("******");

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

    	this_info.find(".user-avatar-bar").click(function(e){
    		e.stopPropagation();
    	});

    	if(me){

	    	this_info.find(".user-avatar-bar.me .upload").click(function(){
	    		this_info.find(".user-avatar-bar.me input").trigger("click");
	    	});

	    	//檔案上傳
	    	this_info.find(".user-avatar-bar.me input").change(function() {

	    		var imageType = /image.*/;
		    	var file = $(this)[0].files[0];
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
				        this_info.find(".user-info-submit").addClass("user-info-submit-ready");

				        //記錄更動
				        this_info.data("avatar-chk",true);
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

	    	this_info.find(".user-info-list input").bind("input",function(){
	    		//有更動即可按確定
		        this_info.find(".user-info-submit").addClass("user-info-submit-ready");
	    	});

	    	//更改資料 送出
	    	$(document).off("click",".user-info-submit-ready");
			$(document).on("click",".user-info-submit-ready",function(){
	    		userInfoSend(this_info);
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
    	}

        //主頁
        this_info.find(".action-main").off("click").click( function(){
            $.mobile.changePage("#page-group-main");
            timelineSwitch("feeds",false,true);

            //滾動至最上
            timelineScrollTop();

            var this_gu = this_info.data("this-info-gu");
            var this_gi = this_info.data("this-info-gi");
            //結束關閉
            this_info.find(".user-info-close").trigger("mouseup");
            //主頁背景
            $(".gm-user-main-area").fadeIn("fast",function(){
                var _thisGroupList = $.lStorage(ui)[this_gi];
                $(".gm-user-main-area .background").css("background","url(" + _thisGroupList.guAll[this_gu].auo + ")");
                $(".gm-user-main-area .name").html(_thisGroupList.guAll[this_gu].nk);
                $(".gm-user-main-area .group .pic").css("background","url(" + _thisGroupList.aut + ")");
                $(".gm-user-main-area .group .name").html(_thisGroupList.gn);
            });

            if($(".alert-area").is(":visible")){
                $(".alert").removeClass("alert-visit");
                $(".alert-area-cover").hide();
                $(".alert").removeClass("alert-click");
                $(".alert-area").hide();
            }

            $(".user-main-toggle").hide();
            $(".gm-user-main-area").show();
            $(".st-feedbox-area").hide();

            setTimeout(function(){
                //滾動至最上
                timelineScrollTop();

                $(".st-feedbox-area div[data-feed=main]").html("");
                $(".st-feedbox-area").show();
                $(".feed-subarea").hide();
                $("#page-group-main").data("main-gu",this_gu);
                $("#page-group-main").data("main-gi",this_gi);
                $("#page-group-main").data("navi","main");
                $(".st-filter-area").data("filter","all");
                timelineListWrite();
            },200);
        });
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
		  sl: this_info.find(".user-info-list .sl").val() // Slogan
		}

        var method = "put";
        ajaxDo(api_name,headers,method,false,body).complete(function(data){
        	//重置團體頭像、名稱的參數
			var data_arr = ["getUserName",gi,gu,$(".sm-user-area-r div"),$(".sm-user-pic img")];

        	if(data.status == 200){

        		//重置團體頭像、名稱 失敗也要重置
        		var _groupList = $.lStorage(ui);
        		_groupList[gi].guAll[gu].nk = body.nk;
        		_groupList[gi].guAll[gu].sl = body.sl;
        		$.lStorage(ui,_groupList);

        		
        		if(this_info.data("avatar-chk")){
        			var ori_arr = [1280,1280,0.7];
					var tmb_arr = [120,120,0.6];
					var file = this_info.find(".user-avatar-bar input")[0].files[0];
					var api_name = "groups/"+gi+"/users/"+gu+"/avatar";
					
					uploadToS3(file,api_name,ori_arr,tmb_arr,function(chk){
    					// 關閉load 圖示
        				s_load_show = false;
        				$('.ui-loader').hide();
						$(".ajax-screen-lock").hide();
						$(".sm-user-area-r div").html(body.nk);

    					if(chk) {
    						//重置團體頭像、名稱的參數
							var data_arr = ["getUserName",gi,gu,$(".sm-user-area-r div"),$(".sm-user-pic img")];
	    					setGroupAllUser(data_arr);

    						toastShow( $.i18n.getString("USER_PROFILE_UPDATE_SUCC") );
    					}

    					//結束關閉
        				this_info.find(".user-info-close").trigger("mouseup");
    				});
        		}else{
        			// 關閉load 圖示
        			s_load_show = false;
        			
        			// 關閉load 圖示
        			$('.ui-loader').hide();
					$(".ajax-screen-lock").hide();

        			toastShow( $.i18n.getString("USER_PROFILE_UPDATE_SUCC") );
        			$(".sm-user-area-r div").html(body.nk);

        			//結束關閉
        			this_info.find(".user-info-close").trigger("mouseup");
        		}
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

    eventDetailShow = function(this_ei){
        var this_gi = this_ei.split("_")[0];
        $('<div>').load('layout/timeline_event.html .st-sub-box',function(){
            var this_event = $(this).find(".st-sub-box");
            this_event.addClass("detail");
            $(".timeline-detail").html(this_event).hide();
            //單一動態詳細內容
            getEventDetail(this_ei).complete(function(data){
                if(data.status == 200){
                    var data_obj = $.parseJSON(data.responseText);
                    try{
                        if( data_obj.el[0].meta.del== true ){
                            popupShowAdjust($.i18n.getString("FEED_EVENT_DELETED"),"","COMMON_OK","");
                            $("#page-timeline-detail .page-back").trigger("click");
                        } else timelineBlockMake(this_event,[data_obj.el[0]],false,true);
                    } catch(e){
                        cns.debug(e);
                    }
                }
            });
        });
    }

    timelineMainClose = function(){
        $("#page-group-main").data("main-gu",false);
        $(".user-main-toggle").show();
        $(".gm-user-main-area").hide();
        $(".st-feedbox-area div[data-feed=main]").html("");
    }

    timelineScrollTop = function(){
        $(".gm-frame").removeClass("scrolltop");
        setTimeout(function(){
            $(".gm-frame").addClass("scrolltop");
        },100);
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
            cns.debug(e);
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
            cns.debug(e);
        }
    }

    //反過來 點選四次 關閉
    supriseKey = function(){
    	var suprise = $(document).data("suprise") || 0;
		if(suprise < 100){
			if(suprise != 0 || suprise == 3) clearTimeout(suprise_timer);

			if(suprise == 3){
				$(document).data("suprise",100);
				pollingInterval(true);
				return false;
			}
			suprise++;
			$(document).data("suprise",suprise);

			
			suprise_timer = setTimeout(function(){
				$(document).data("suprise",0);
			},300);
		}else{
			pollingInterval(true);
		}
    };

});