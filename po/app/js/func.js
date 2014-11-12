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

		$.each($.lStorage("_groupList"),function(i,gl_obj){
			var _uiGroupList = $.lStorage(ui);	
			if(!$.lStorage(ui)[gl_obj.gi]){

				// setGroupAllUser("",gl_obj.gi);
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
    			$.lStorage(ui,_uiGroupList);
			}
		});	
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
        				this_invite.data("invite-data",val);
        				this_invite.find(".gmi-div-data div:eq(0) span").html(val.gn);
        				this_invite.find(".gmi-div-data div:eq(1) span").html(val.cnt);

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
        ajaxDo(api_name,headers,method,true).complete(function(data){
        	if(data.status == 200){
        		var branch_list = $.parseJSON(data.responseText);
        		var new_bl = {};
        		var new_fbl = {};
                var _groupList = $.lStorage(ui);
                var guAll = _groupList[this_gi].guAll;
                cns.debug("guAll:",guAll);

                //branch
        		if(branch_list.bl.length) {
                    //初始化陣列
        			$.each(branch_list.bl,function(i,val){
        				var bp_arr = val.bp.split(".");
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

                    cns.debug("new_bl:",new_bl);
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

    // setGroupListCountMember = function(newBl, bi){
    //     var data = newBl[bi];
    //     var cnt = data.cnt;

    //     if(data.cl && data.cl.length > 0){
    //         for( var i=0; i<data.cl.length; i++ ){
    //             cnt += setGroupListCountMember(newBl, data.cl[i]);
    //         }
    //     }
    //     cns.debug(data.bn, data.lv, data.cnt, cnt);
    //     data.cnt = cnt;
    //     return cnt;
    // }
    

	setGroupAllUser = function(data_arr,this_gi){

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
	            	//設定top event 的user name
	            	data_arr[1].find(".st-top-event-r-footer span:eq(0)").html(new_group_user[data_arr[2]].nk);

	            }else if(data_arr && data_arr[0] == "userInfo"){
                    //設定user info
                    var _groupList = $.lStorage(ui);
                    _groupList[this_gi].guAll[data_arr[1].gu] = data_arr[1];
                    $.lStorage(ui,_groupList);

                }else if(data_arr && data_arr[0] == "eventDetail"){
                    //設定event detail 跨團體
                    cns.debug("hehehhehehee");
                    data_arr[1].trigger("click");

                }else if(data_arr){
	            	getUserName(data_arr[1],data_arr[2],data_arr[3],data_arr[4]);
	            }
			}
		});
	}

	updateGuAll = function(this_gi,new_guAll) {
		var _groupList = $.lStorage(ui);
		//先更新就有資料 但不會取得新成員
		$.each(_groupList[this_gi].guAll,function(i,val){
            if( new_guAll.hasOwnProperty(i) ){
                $.extend(val,new_guAll[i]);
            } else {
                delete _groupList[this_gi].guAll[i];
            }
		});

		//將更新完的資料倒回新的名單 就會有新成員
		$.extend(new_guAll,_groupList[this_gi].guAll);
		_groupList[this_gi].guAll = new_guAll;
        $.lStorage(ui,_groupList);
	}
	

	timelineSwitch = function (act,reset){
		$( "#side-menu" ).panel( "close");

		//reset 
		if(reset) {
			$(".feed-subarea").removeData();
			$("#page-group-main .switch-reset").html("");
		}

		switch (act) {
	        case "feed":
				$(".feed-subarea").hide();
				$(".st-filter-main span").html("全部");
				//filter all
				$(".st-filter-area").data("filter","all");

	        	//點選 全部 的用意是 既可寫入timeline 也可以讓navi回到 "全部" 的樣式
			    $(".st-navi-area .main").trigger("click");

	        	$(".subpage-contact").hide();
	        	$(".subpage-chatList").hide();
	        	$(".subpage-timeline").show();
	        	$("#page-group-main").find("div[data-role=header] h3").html("動態消息");
	        	var parent = $("#page-group-main").find("div[data-role=header] div[class=header-group-name]");
				if( parent ){
					//set add icon
					parent.find("~ div[class=feed-compose]").show();
					parent.find("~ div[class=chatList-add]").hide();
				}
	          break;
	        case "contact": 
	        	$(".subpage-contact").show();
	            $(".subpage-timeline").hide();
	        	$(".subpage-chatList").hide();
	            $( "#side-menu" ).panel( "close");
                var parent = $("#page-group-main").find("div[data-role=header] div[class=header-group-name]");
                if( parent ){
                    //set add icon
                    parent.find("~ div[class=feed-compose]").hide();
                    parent.find("~ div[class=chatList-add]").hide();
                }
	        	initContactList();
	          break;
	        case "chat":
	        	//-- switch sub pages --
	        	$(".subpage-contact").hide();
	        	$(".subpage-timeline").hide();
	        	$(".subpage-chatList").show();
	        	// $( "#side-menu" ).panel( "close");

	        	initChatList();

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
	}

	setSmUserData = function (gi,gu,gn){
		$(".sm-user-area-r div:eq(0)").html(gn);
		$(".sm-user-area-r div:eq(1)").html("");  

        $(".sm-user-area.namecard").data("gu",gu);

		//檢查每個團體是否存在gu all 
		var data_arr = ["getUserName",gi,gu,$(".sm-user-area-r div:eq(1)"),$(".sm-user-pic img")];
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

	topEvent = function (){
		var top_area = $(
			'<div class="st-top-area">'+
				'<div class="st-top-event-block">'+
					'<div class="st-top-left-arrow st-top-arrow"><div><img src="images/arrow2.png"></div></div>'+
					'<div class="st-top-right-arrow st-top-arrow"><div><img src="images/arrow2.png"></div></div>'+
					'<div class="st-top-event-area">'+
						'<div class="st-top-event-default">'+
							'<img src="images/coachmake/logo_timeline_top.png"/>'+
							'<div>目前尚未有任何置頂</div>'+
						'</div>'+
						'<div class="st-top-event-set">'+
						'</div>'+
					'</div>'+
				'</div>'+
				'<div class="st-top-bar-area" style="display:none">'+
					'<div class="st-top-bar-selector" style="display:"></div>'+
					'<div class="st-top-bar-case">'+
					'</div>'+
					'<div class="st-top-bar-case-click">'+
					'</div>'+
				'</div>'+
			'</div>'
		);

		$(".st-top-area-load").html(top_area);

		//不符合就return false
		if(typeof gi == "undefined") return false;

		//取得user name list
		var _groupList = $.lStorage(ui);

		// cns.debug("$.lStorage(ui):",$.lStorage(ui));
		// cns.debug("_groupList[gi].guAll:",_groupList[gi].guAll);

		topEventApi().complete(function(data){
        	cns.debug("topevent data:",data);

        	if(data.status == 200){

        		var top_events_arr = $.parseJSON(data.responseText).el;

        		var top_msg_num = top_events_arr.length;
        		if(top_msg_num == 0){
        			return false;
        		}

        		//default 關閉
        		$(".st-top-event-default").hide();

        		//timeline 六種規格 設定
        		var tl_setting_obj = {
        			1:{
        				name:"公告",
        				src:"images/timeline/timeline_cover_icon_announcement.png"
        			},
        			default:{
        				name:"置頂",
        				src:"images/timeline/timeline_cover_icon_announcement.png"
        			}
        		};
        		$.each(top_events_arr,function(i,val){

        			var event_type = val.meta.tp.substring(1,2);
        			var this_top_obj = tl_setting_obj[event_type];
        			if(typeof this_top_obj == "undefined"){
        				this_top_obj = tl_setting_obj["default"]
        			}

        			top_area.find(".st-top-event-set").append($('<div class="st-top-event">').load('layout/layout.html .st-top-event-load',function(){
        				var this_top_event = $(this);
        				this_top_event.data("data-obj",val);
        				this_top_event.data("pos",i);

        				//圖片及類型
        				this_top_event.find(".st-top-event-l img").attr("src",this_top_obj.src);
        				this_top_event.find(".st-top-event-l div").html(this_top_obj.name);
        				//標題 內容
        				this_top_event.find(".st-top-event-r-ttl").html(val.meta.tt);
        				this_top_event.find(".st-top-event-r-content").html(val.ml[0].c);
        				
        				//用戶名稱 時間
        				//this_top_event.find(".st-top-event-r-footer span:eq(0)").html(gu_all[val.meta.gu].nk);
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
                            cns.debug("hehehe:",$(this).data("data-obj"));
                            $.mobile.changePage("#page-timeline-detail", {transition: "slide"});
                            eventDetailShow($(this).data("data-obj").ei);   
                        });
        			}));
					// return false;
        		});
	        }
        });
	}

	//為了避免gu all還沒取得
	setTopEventUserName = function(this_top_event,this_gu){
		var gu_all = $.lStorage(ui)[gi].guAll;
		if(Object.keys(gu_all).length == 0){
			var data_arr = ["setTopEventUserName",this_top_event,this_gu];
	        setGroupAllUser(data_arr);
	    }else{
	    	this_top_event.find(".st-top-event-r-footer span:eq(0)").html(gu_all[this_gu].nk);
	    }
	}


	topBarMake = function (top_area,top_msg_num,resize) {

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
		top_area.find(".st-top-bar-case").css("width",top_msg_num*10 + "%")
		//st-top-bar-area span 平均寬度在case中
		top_area.find(".st-top-bar-case span").css("width",((1/top_msg_num)*100).toFixed(2) + "%");
		
		//點擊區放大
		top_area.find(".st-top-bar-case-click").css("width",top_msg_num*10 + "%")
		top_area.find(".st-top-bar-case-click span").css("width",((1/top_msg_num)*100).toFixed(2) + "%");

		//出現
		top_area.find(".st-top-bar-area").slideDown("fast");

		//起始位置
		var selector_pos = (10-top_msg_num)/2*10;
		var first_span = top_area.find(".st-top-bar-case span:eq(0)");
		//$("#side-menu").width() 開啓side menu 時的校正
		var start_left = first_span.offset().left - $("#side-menu").width();
		var start_top = first_span.offset().top;
		var movement = first_span.width();

		//流程控制 不能連按
		var mfinish = false;

		/* 游標位置和移動 */
		top_area.find(".st-top-bar-selector").offset({top:start_top,left:start_left + $("#side-menu").width()});
		//movement跟寬度一致
		top_area.find(".st-top-bar-selector").css("width",movement+2);

		//點擊區 位置
		top_area.find(".st-top-bar-case-click").offset({top:(start_top-14),left:start_left});


		//點擊區 先解綁定
		top_area.find(".st-top-bar-case-click span").unbind();
		top_area.find(".st-top-bar-case-click span").mouseup(function(){
			var target_pos = $(this).data("pos");

			top_area.find(".st-top-bar-selector").animate({left: (start_left+movement*target_pos)},function(){
				$(this).data("pos",target_pos);
			});
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
	getThisTimelinePart = function (this_event,target_div,tp){
		var this_ei = this_event.data("event-id");
        var this_gi = this_ei.split("_")[0];
        var this_ti = this_ei.split("_")[1];

		var api_name = "/groups/" + this_gi + "/timelines/" + this_ti + "/events/" + this_ei + "/participants?tp=" + tp;
		var headers = {
            "ui":ui,
			"at":at, 
			"li":lang
		};
		var method = "get";
		var result = ajaxDo(api_name,headers,method,false);
		result.complete(function(data){
			if(data.status == 200){
				var epl = $.parseJSON(data.responseText).epl;
				if(typeof epl != "undefined" && epl.length > 0){
					epl = epl.split(",");
					//存回 陣列
					this_event.data("parti-list",epl);
					//編輯讚好區域
					detailLikeStringMake(this_event);
				}
			}
		});
	}
	
	detailLikeStringMake = function (this_event){
        var this_gi = this_event.data("event-id").split("_")[0];
        
		var epl = this_event.data("parti-list");
		//gu gi 是全域
		var me_pos = $.inArray(gu,epl);
		
		var guAll = $.lStorage(ui)[this_gi].guAll;
        var me_gu = guAll[epl[me_pos]];
		var like_str_arr = [];

        this_event.find(".st-reply-like-area").show();

        switch(true){
        	//陣列空的 隱藏 區域
        	case (epl.length == 0) :
        		like_str_arr[0] = "";
                like_str_arr[1] = "目前沒人按讚";
                break;
            //你 按讚
            case ( typeof me_gu != "undefined" && epl.length == 1 ) :
                like_str_arr[0] = "你";
                like_str_arr[1] = "按讚";
                break;
            //林小花 按讚
            case ( !me_gu && epl.length == 1 ) :
                like_str_arr[0] = guAll[epl[0]].nk;
                like_str_arr[1] = "按讚";
                break;
            //你、林小花 按讚
            case ( typeof me_gu != "undefined" && epl.length == 2 ) :
                like_str_arr[0] = "你、 " + (me_pos ? guAll[epl[0]].nk : guAll[epl[1]].nk);
                like_str_arr[1] = "按讚";
                break;
            //林小花 及其他？個人按讚
            case ( !me_gu && epl.length > 2 ) :
            	like_str_arr[0] = guAll[epl[0]].nk;
                like_str_arr[1] = " 及其他" + (epl.length-1) + "人按讚";
                break;
            //你、林小花 按讚
            case ( typeof me_gu != "undefined" && epl.length > 2 ) :
                like_str_arr[0] = "你、 " + (me_pos ? guAll[epl[0]].nk : guAll[epl[1]].nk);
                like_str_arr[1] = " 及其他" + (epl.length-1) + "人按讚";
                break;
        }
        
        this_event.find(".st-reply-like-area span:eq(0)").html(like_str_arr[0]);
        this_event.find(".st-reply-like-area span:eq(1)").html(like_str_arr[1]);
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

        //已閱讀
        if(!event_status){
            event_status = {};
            event_status[this_ei] = {}
        }

        //已讀亮燈
        if(chkEventStatus(this_event,"ir")){
            this_event.find(".st-sub-box-3 img:eq(2)").attr("src","images/timeline/timeline_feedbox_icon_read_blue.png")    
        }
        
        //製作每個回覆
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
					var user_name = _groupList[this_gi].guAll[el.meta.gu].nk.replaceOriEmojiCode();

                    // namecard
                    this_load.find(".st-user-pic.namecard").data("gi",this_gi);
                    this_load.find(".st-user-pic.namecard").data("gu",el.meta.gu)

                    //大頭照
                    if(_groupList[this_gi].guAll[el.meta.gu].aut){
                        this_load.find(".st-user-pic img").attr("src",_groupList[this_gi].guAll[el.meta.gu].aut);
                        // this_load.find(".st-user-pic img:eq(1)").attr("src",_groupList[this_gi].guAll[el.meta.gu].auo);
                        this_load.find(".st-user-pic.namecard").data("auo",_groupList[this_gi].guAll[el.meta.gu].auo);
                        avatarPos(this_load.find(".st-user-pic img"));
                    }

                    this_load.find(".st-reply-username").html(user_name.replaceOriEmojiCode());
                    
                    //時間
                    // var time = new Date(el.meta.ct);
                    // var time_format = time.customFormat( "#M#/#D# #CD# #hhh#:#mm#" );
                    this_load.find(".st-reply-footer span:eq(0)").html(new Date(el.meta.ct).toFormatString());

                    var ei = el.ei;
                    this_load.data("event-id",ei);

                    //存入event path 之後才可以按讚
                    this_load.data("event-path",this_event.data("event-id") + "." + this_load.data("event-id"));

                    if(el.meta.lct){
                        this_load.find(".st-reply-footer img").show();
                        this_load.find(".st-reply-footer img").attr("src","images/timeline/timeline_feedbox_icon_like.png");
                        this_load.find(".st-reply-footer span:eq(2)").html(el.meta.lct);

                        //此則動態 自己的按贊狀況
                        if(event_status[ei] && event_status[ei].il){
                            this_load.find(".st-reply-footer img").attr("src","images/timeline/timeline_feedbox_icon_like_blue.png");
                            this_load.find(".st-reply-footer span:eq(1)").html("收回讚");
                        }
                    }
                }
            }));    
        }); 
    }


	//動態消息 判斷關閉區域
	timelineDetailClose = function (this_event,tp){

		var detail_data;
		//公告通報任務的detail 線要隱藏 
		var bottom_block = false;
		//this_event.find(".st-box2-bottom-block").hide();
		
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
		this_event.find(".st-reply-area").toggle();
		
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
	        		this_event.find(".st-task-status").html("已完成");
	        		this_event.find(".st-task-status-area img").attr("src","images/common/icon/icon_check_red_l.png");
	        	}else{
	        		//更改工作狀態為 未完成
	        		this_event.find(".st-task-status").html("未完成");
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
				this_ques.find(".st-vote-detail-top span:eq(1)").html("每個人限選取"+ v_val.v +"項");
				
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
					voteResultMake(this_event);
				}
            }));
		});

	}




/*

##     ##  #######  ######## ########       ########  ########  ######  ##     ## ##       ######## 
##     ## ##     ##    ##    ##             ##     ## ##       ##    ## ##     ## ##          ##    
##     ## ##     ##    ##    ##             ##     ## ##       ##       ##     ## ##          ##    
##     ## ##     ##    ##    ######         ########  ######    ######  ##     ## ##          ##    
 ##   ##  ##     ##    ##    ##             ##   ##   ##             ## ##     ## ##          ##    
  ## ##   ##     ##    ##    ##             ##    ##  ##       ##    ## ##     ## ##          ##    
   ###     #######     ##    ########       ##     ## ########  ######   #######  ########    ##    


*/



	voteResultMake = function (this_event){
		
		var vote_obj = this_event.data("vote-result");
		var all_ques = this_event.find(".st-vote-ques-area");
		cns.debug("votevotevotevote");
		cns.debug(JSON.stringify(vote_obj,null,2));

		//設定投票人數
	    this_event.find(".st-task-vote-detail-count span").html(Object.keys(vote_obj).length + "人已投票");


		//預設opt 為全部都沒選 fasle
		this_event.find(".st-vote-detail-option").data("vote-chk",false);

    	//根據每個答案的gu  
        $.each(vote_obj,function(ans_gu,ans_val){
        	//li:[{},{}] time:14001646...

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
		bindVoteEvent(this_event);
	}

	bindVoteEvent = function (this_event){
		
		// this_event.find(".st-vote-ques-area-div").click(function(){
		// 	cns.debug("按到題目了:",$(this));
		// });		

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
				this_event.find(".st-vote-send").html("送出");
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
				popupShowAdjust("","第" + vote_chk_index +" 題尚未完成投票");
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

	        	//重新讀取detail
	        	// popupShowAdjust("","回覆成功");
	        	toastShow("回覆成功");
	        	this_event.find(".st-vote-send").removeClass("st-vote-send-blue");
	        	//客製化 按了確定之後再重讀取
	        	$(".popup-close").bind("reload",function(){
	        		//重設任務完成狀態
	        		setEventStatus(this_event);

	        		//重設完整的detail
					this_event.data("detail-content",false);
		    		this_event.find(".st-vote-all-ques-area").html("");
		    		// timelineDetailClose toggle負負得正
		    		this_event.find(".st-reply-area").hide();

		    		this_event.data("switch-chk",false);

		      		this_event.find(".st-sub-box-1").trigger("click");
					$(".popup-close").unbind("reload");
				});
	        });
		});
	}


	composeContentMake = function (compose_title){

		//開始讀取
		$('.cp-content-load').html($('<div>').load('layout/compose.html .cp-content',function(){

			var this_compose = $(this).find(".cp-content");

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
		        	show_area = ".cp-content-title,.cp-content-object, .cp-content-object ,.cp-vote-area,.cp-content-addcal,.cp-content-first,.cp-time-area";

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
						if(val.match(/youtube.com|youtu.be/)){
							getLinkYoutube(this_compose,val);
						}else{
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
                '<div class="obj-cell-user-pic"><img src="images/common/others/empty_img_mother_l.png" style="width:60px"/></div>' +
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
                '<div class="obj-cell-user-pic"><img src="images/common/others/empty_img_mother_l.png" style="width:60px"/></div>' +
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
                                '<div class="obj-user-name">' + gu_obj.nk + '</div>' +
                                // '<div class="obj-user-title">雲端事業群。經理</div>' +
                        '</div>'
                    );
                    var object_img = this_obj.find(".obj-cell-user-pic img");
                    if(gu_obj.aut) {
                        object_img.attr("src",gu_obj.aut);
                        //object_img.removeAttr("style");
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
                        '<div class="obj-cell-user-pic"><img src="images/common/others/empty_img_mother_l.png" style="width:60px"/></div>' +
                        '<div class="obj-cell-subgroup-data">' + 
                            '<div class="obj-user-name">' + bl_obj.bn + '</div></div>');
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
                        '<div class="obj-user-name">' + gu_obj.nk + '</div>' +
                        // '<div class="obj-user-title">雲端事業群。經理</div>' +
                '</div>'
            );
            var object_img = this_obj.find(".obj-cell-user-pic img");
            if(gu_obj.aut) {
                object_img.attr("src",gu_obj.aut);
                //object_img.removeAttr("style");
                avatarPos(object_img);
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

                $(".obj-selected div:eq(1)").html("<span>" + this_cell.data("gu-name") + "</span>");
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

        $(".obj-selected div:nth-child(3)").off("click").click( selectTargetAll );

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
                    $(".cp-content-object span").html(obj_length + "位成員");
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
        
        $(".obj-selected div:eq(1)").html("");
        //寫入到選擇區域
        if( null != branch ){
            len += Object.keys(branch).length;
            $.each(branch,function(i,val){
                $(".obj-selected div:eq(1)").append(val+"   ");
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
                $(".obj-selected div:eq(1)").append(val+"   ");
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
		    	'<div class="obj-cell-user-pic namecard"><img src="images/common/others/empty_img_mother_l.png" style="width:60px"/></div>' +
		    	'<div class="obj-cell-subgroup-data">' + 
		        	'<div class="obj-user-name">' + data.bn + '</div>' +
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
    	this_work_area.find('.cp-work-item textarea').attr("placeholder","請輸入工作項目");

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
    		this_work.find('textarea').attr("placeholder","請輸入工作項目");

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
		

		// if(compose_content){
		// 	var c = {
		// 		"tp" : 0,
		// 		"c" : compose_content
		// 	} 
		// 	body.ml.push(c);
		// }

		//"lv": 0(使用者)、1(團體)、2(團體使用者)、3(群組),
        //"tp": [0](0=樓主,1=回覆訊息)、[1](0=訊息,1=公告,2=通報專區,3=任務-工作,4=任務-投票,5=任務-定點回報,6=行事曆)
        

        //普通貼文 內容也是普通貼文
//       var body = {
//	                 "meta":
//	                 {
//	                   "lv": 1,
//	                   "tp": "00"
//	                 },
//	                 "ml":
//	                 [
//	                   {
//	                     "tp": 0,
//	                     "c": ap_content
//	                   }
//	                 ]
//	               };
		
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
						empty_msg = "分派對象尚未完成";
						return false;
					}

					//工作內容檢查
					if(!this_work.find("textarea").val()){
						empty_chk = true;
						empty_msg = "工作內容尚未完成";
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

				empty_smsg = "投票內容不完整！";
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
		// cns.debug("obj:",JSON.stringify(gul_arr,null,2));
		 // return false;
		//網址

		// "ei": "Event-340",
		//   "meta": {
		//     "lv": 1,
		//     "tp": "00",
		//     "gu": "1f757109-3ecb-48cd-92f7-52bd3af991b2",
		//     "ct": 1400693543526,
		//     "rct": 4,
		//     "fct": 0,
		//     "lct": 3,
		//     "pct": 0,
		//     "top": false,
		//     "cal": false
		//   },
		//   "ml": [
		//     {
		//       "c": "http://techorange.com/2014/05/20/why-vc-firms-are-snapping-up-designers/",
		//       "tp": 0
		//     },
		//     {
		//       "c": "http://techorange.com/2014/05/20/why-vc-firms-are-snapping-up-designers/",
		//       "d": "Kleiner, Perkins, Caufield & Byers 是世界上最凸出的創投公司之一，它們有一個設計師，而 Google Ventures 則有五位。這些設計好夥伴漸漸的在創投公司中擔任重要的角色，他們幫忙管理、選擇公司的投資。 舉例來說，Irene Au 是前 Google ...",
		//       "i": "https://farm2.staticflickr.com/1417/5132239581_2033c68dbd_z.jpg",
		//       "t": "  設計師是新一代大神：矽谷創投投資前得先問設計師的意見",
		//       "tp": 1
		//     }
		//   ]

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
					if(this_compose.data("object_str")){
						$.each(this_compose.data("upload-obj"),function(i,file){
							getFilePermissionId(this_compose.data("object_str")).complete(function(data){
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

		// cns.debug("body:",JSON.stringify(body,null,2));
		// return false;

		//
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
        	topEventChk();
        	timelineSwitch("feed");
        	toastShow("發佈成功");
        });
	};

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
		
		//存回
		$.lStorage(ui,_groupList);
		
		setSmUserData(gi,gu,gn);

		//置頂設定
		topEvent();
	};
	
	groupMenuListArea = function (new_gi,invite){
	   
    	getGroupList().complete(function(data){
	    	if(data.status != 200) return false;

	    	$(".sm-group-list-area").html("");
	    	$(".sm-group-list-area-add").html("");
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

	        	if(i < 5){
	        		tmp_selector = ".sm-group-list-area";
	        	}else{
	        		tmp_selector = ".sm-group-list-area-add";
	        	}
	        	
	        	//開關按鈕ui變化
	            if(i == 1 || total == 1){
	                chk = "data-switch-chk=\"check\"";
	            }
	            if(i == total-1 ){
	                chk = "data-switch-chk=\"check2\"";
	            }
	        	
	        	var glt_img = "images/common/others/empty_img_all_l.png";
	        	var glo_img = "images/common/others/empty_img_all_l.png";
	            if(val.aut) {
	            	glt_img = val.aut;
	            	glo_img = val.auo;
	            }

	            var this_group = $(
	           		'<div class="sm-group-area polling-cnt" data-gi="' + val.gi + '" data-polling-cnt="A5" data-gu="' + val.me + '" ' + chk + '>' +
	           			'<img class="sm-icon-host" src="images/side_menu/icon_host.png"/>' +
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

	        //將限制取消 就可以取得真正的長度
        	$(".sm-group-list-area-add").removeAttr("style");

        	//新增團體 要重寫團體列表 調整團體頭像
	        //為了調整團體頭像 必須用高度加overflow方式來做其餘團體開合 避免用toggle造成的display none 那會不能計算圖的長寬
	        var resize_height = $(".sm-group-list-area-add").height();

	        //新增團體 以及隱藏團體區已經有資料 才要增加高
        	if(new_gi && $(".sm-group-list-area-add").html()) {
        		resize_height = $(".sm-group-list-area-add").data("height") + $(".sm-group-area").height()+1;
        	}

        	$(".sm-group-list-area-add").data("height",resize_height);	
	        //歸零 表示為關閉狀態
	        $(".sm-group-list-area-add").css("height",0);

	        //new gi 表示新增團體 完成後跳訊息
	        if(new_gi) {
	        	//創建團體結束 取消強制開啓loading 圖示
	        	s_load_show = false;

	        	if(invite){
	        		toastShow("恭喜您成功加入團體！");
	        	}else{
	        		toastShow("團體建立成功");
	        		$.mobile.changePage("#page-group-main");
	        		timelineSwitch("feed");
	        	}
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


		var event_tp = $("#page-group-main").data("navi") || "00";
		// cns.debug("put this_gi:",this_gi);
	    //製作timeline
	    var api_name = "groups/"+ this_gi +"/timelines/"+ this_ti +"/events";
	    if(ct_timer){
	    	api_name = api_name + "?ct=" + ct_timer;
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
	    		$(".feed-subarea[data-feed=" + event_tp + "]").append("<p class='no-data'></p>");
	        	//關閉timeline loading 開啟沒資料圖示
	        	setTimeout(function(){
	        		$(".st-feedbox-area-bottom > img").hide();
    				$(".st-feedbox-area-bottom > div").show();
	        	},2000);
	        	return false;
	    	}

	    	// cns.debug("timeline_list.length:",timeline_list.length);
	    	//存db 先刪後存 因為刪除事件是不回傳的
	    	//刪db
	    	// timeline_list
	    	// cns.debug("remove timeline_list:",timeline_list);
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
				// return false;

		    	if(polling_arr.length == 0){
		    		// cns.debug("??");
			    	//資料個數少於這個數量 表示沒東西了
			        if(timeline_list.length < 10){
			        	//沒資料的確認 加入no data 
			    		$(".feed-subarea[data-feed=" + event_tp + "]").append("<p class='no-data'></p>");
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
                        cns.debug("events from db:",this_navi.find(".st-sub-box[data-idb=true]"));
                        this_navi.find(".st-sub-box[data-idb=true]").remove();

                        
		    			timelineBlockMake($(this).find(".st-sub-box"),timeline_list,is_top);
			    	});
		    	}
	    	});
	    	// return false;
		    	
	            
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
            var ori_selector = $(".feed-subarea[data-feed=" + event_tp + "]");
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

                //寫入最舊的一筆時間 11/12 改成每次list的最後一筆
                // if(!selector.data("last-ct") || (selector.data("last-ct") && selector.data("last-ct") > val.meta.ct)){
                //     selector.data("last-ct",val.meta.ct);
                // }

                //讀完就可重新滾動撈取舊資料 setTimeOut避免還沒寫入時就重新撈取
                setTimeout(function(){
                    cns.debug("scroll-chk false");
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
                    setEventStatus(this_event,$(".st-filter-area").data("filter"));
                }
                this_event = this_event_temp.clone();
            }

            var tp = val.meta.tp.substring(1,2)*1;


            //detail 不需要
            if(!detail){
                //寫新event(等同下拉更新) 判斷有無第一個event 且 時間大於此event的ct
                if(top_subbox.length && val.meta.ct > top_subbox.data("ct")){
                    this_event.find(".st-sub-time").append("n");
                    //表示這是目前timeline沒有的事件
                    method = "before";
                    selector = top_subbox;
                }
            }

            //寫入
            selector[method](this_event);

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
                    this_event.find(".st-message").trigger("click");
                    //取消 detail關閉功能
                    this_event.data("detail-page",true);
                },100);
                    
            }

            //-------------------------------------------------------------------
            // 判斷是否有gu all
            var data_arr = ["timelineUserName",val.ei.split("_")[0] , val.meta.gu , this_event.find(".st-sub-name") , this_event.find(".st-sub-box-1 .st-user-pic img")];
            chkGroupAllUser(data_arr);

            // var time = new Date(val.meta.ct);
            // var time_format = time.customFormat( "#M#/#D# #CD# #hhh#:#mm#" );
            this_event.find(".st-sub-time").append(new Date(val.meta.ct).toFormatString());
            this_event.find(".st-sub-time").append(val.meta.ct);

            //發佈對象
            var tu_str = "所有人";
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
            this_event.find(".st-sub-box-1-footer").append(tu_str); 
            
            //讚留言閱讀
            this_event.find(".st-sub-box-3 div:eq(0)").html(val.meta.lct);
            this_event.find(".st-sub-box-3 div:eq(1)").html(val.meta.pct);
            this_event.find(".st-sub-box-3 div:eq(2)").html(val.meta.rct);

            var category;
            var title = "貼文";
            switch(tp){
                //貼文
                case 0:
                    this_event.find(".st-sub-box-2-more").hide();
                    break;
                //公告
                case 1:
                    category = title = "公告";
                    break;
                //通報
                case 2:
                    this_event.find(".st-box2-more-category").addClass("st-box2-more-category-fb");
                    category = title = "通報";
                    
                    break;
                case 3:
                    this_event.find(".st-box2-more-category").addClass("st-box2-more-category-task");
                    category = "任務<img src=\"images/task/timeline_task_icon_task_work.png\"> <span>工作</span>";
                    title = "工作";

                    //任務狀態
                    this_event.find(".st-box2-more-task-area").show();
                    this_event.find(".st-box2-more-time").show();
                    this_event.find(".st-task-status-area").show();

                    //任務預設的文字
                    this_event.find(".st-task-status").html("未完成");
                    break;
                case 4://投票
                    this_event.find(".st-box2-more-category").addClass("st-box2-more-category-task");
                    category = "任務<img src=\"images/task/timeline_task_icon_task_vote.png\"> <span>投票</span>";
                    title = "投票";
                    //任務狀態
                    this_event.find(".st-box2-more-task-area").show();
                    this_event.find(".st-box2-more-time").show();
                    this_event.find(".st-task-status-area").show();

                    //投票結果obj
                    this_event.data("vote-result",{});

                    //任務預設的文字
                    this_event.find(".st-task-status").html("未投票");
                    break;
                case 5://地點回報
                    this_event.find(".st-box2-more-category").addClass("st-box2-more-category-task");
                    category = "任務<img src=\"images/task/timeline_task_icon_task_checkin.png\"> <span>定點回報</span>";
                    title = "定點回報";
                    //任務狀態
                    this_event.find(".st-box2-more-task-area").show();
                    this_event.find(".st-box2-more-time").show();
                    this_event.find(".st-task-status-area").show();
                    //任務預設的文字
                    this_event.find(".st-task-status").html("暫未開放");
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
            setEventStatus(this_event,$(".st-filter-area").data("filter"));

            //timeline message內容
            timelineContentMake(this_event,target_div,val.ml);
                
        });
    }

	timelineListWrite = function (ct_timer,is_top){
        // var ct_timer = ct_timer || "1415721551557";
		//判斷有內容 就不重寫timeline -> 不是下拉 有load chk 就 return
    	if(!ct_timer && !is_top){
    		var event_tp = $("#page-group-main").data("navi") || "00";
    		var selector = $(".feed-subarea[data-feed=" + event_tp + "]");

    		if(selector.find(".load-chk").length){
    			//隱藏其他類別
				$(".feed-subarea").hide();
				selector.show();
	    		return false;
    		}else{
    			//load_chk 避免沒資料的
	    		selector.append("<p class='load-chk'></p>");
    		}
    	}

    	// cns.debug("ct_timer:",ct_timer);

		var idb_timer = ct_timer || 9999999999999;
		//取得server最新資訊 更新資料庫
		// cns.debug("timeline ct_timer:",ct_timer);
		idbPutTimelineEvent(ct_timer,is_top);

		//下拉更新就不需要資料庫了
		if(is_top) return false;
		// return false;

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
	    	// cns.debug("limit:",timeline_list.length);
	    	//寫timeline
	    	load_show = false;
	    	$('<div>').load('layout/timeline_event.html .st-sub-box',function(){
                cns.debug("idb event!");
                $(this).find(".st-sub-box").attr("data-idb",true);
    			timelineBlockMake($(this).find(".st-sub-box"),timeline_list,false,false);
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

	eventStatusWrite = function(this_event,this_es_obj,filter){
		//將此則動態的按讚狀態寫入data中
		if(!this_es_obj) return false;

		//按讚
		if(this_es_obj.il){
			this_event.find(".st-sub-box-3 img:eq(0)").attr("src","images/timeline/timeline_feedbox_icon_like_blue.png");
			this_event.find(".st-sub-box-4 .st-like-btn").html("收回讚");
		}
		//回覆
		if(this_es_obj.ip)
				this_event.find(".st-sub-box-3 img:eq(1)").attr("src","images/timeline/timeline_feedbox_icon_chat_blue.png");
				
		//閱讀
		if(this_es_obj.ir)
				this_event.find(".st-sub-box-3 img:eq(2)").attr("src","images/timeline/timeline_feedbox_icon_read_blue.png");
		
		//任務完成
		if(this_es_obj.ik){
			var tp = this_event.data("timeline-tp");
			var task_str;
			switch(tp){
				case 3:
					task_str = "已完成";
					break;
				case 4:
					task_str = "已投票";
					break;
				case 5:
					task_str = "已回報";
					break;
			}
			
			this_event.find(".st-task-status-area img").attr("src","images/common/icon/icon_check_red_l.png");
			this_event.find(".st-task-status").html(task_str);
		}
	}

	setEventStatus = function(this_event,filter){
		//先用idb寫 再去向server要
		var ei_val = this_event.data("event-val");
		if(ei_val.status && ei_val.status[ei_val.ei]){
			eventStatusWrite(this_event,ei_val.status[ei_val.ei],filter);
		}

		eventFilter(this_event,filter);

		//這邊是timeline list 要call這個api判斷 自己有沒有讚過這一串系列文 
		var this_ei = this_event.data("event-id");
        var this_gi = this_ei.split("_")[0];
        var this_ti = this_ei.split("_")[1];

		var api_name = "groups/" + this_gi + "/timelines/" + this_ti + "/events_status?ep=" + this_ei;
        var headers = {
            "ui":ui,
            "at":at, 
            "li":lang
		};
        var method = "get";
        
        ajaxDo(api_name,headers,method,false).complete(function(data){
    		if(data.status == 200){
                
    			var s_data = $.parseJSON(data.responseText).el;
    			var es_obj = {}

	    		if(s_data.length != 0){
					$.each(s_data,function(i,val){
						es_obj[val.ei] = val;
					});
	    		}else{
	    			es_obj[this_ei] = {};
	    		}

	    		//存入data
				this_event.data("event-status",es_obj);

				//存入idb
	    		ei_val.status = es_obj;

	    		idb_timeline_events.put(ei_val,function(){
	    			// 存完後改資料
	    			eventStatusWrite(this_event,es_obj[this_ei],filter);
	    		});
    		}

    		//filter
			eventFilter(this_event,filter);
    	});
	}

	eventFilter = function(this_event,filter){
		var filter = filter || "all";

		//先關再開
		this_event.hide();
		var event_id = this_event.data("event-id");
		var event_status = this_event.data("event-status");
		
		//用以判斷下拉更新
		this_event.removeClass("filter-show");
		var show_chk = false;

		if(filter == "all"){
			show_chk = true;
		}else if(filter == "read"){
			cns.debug("this_event data:",this_event.data());
			if(event_status && event_status[event_id] && event_status[event_id].ir) show_chk = true;
		}else{
			if(!event_status || !event_status[event_id] || (event_status[event_id] && !event_status[event_id].ir)) show_chk = true;
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
		var audio_arr = [];

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
                            window.open(val.c);
                        });
                    }

                    if(!val.d && !val.i && !val.t) return false;

					this_event.find(".st-attach-url").show();
					this_event.find(".st-sub-box-2-attach-area").show();

					if(val.i) {
						this_event.find(".st-attach-url-img").show();
						this_event.find(".st-attach-url-img img").attr("src",val.i);
					}
					
					//圖片滿版
					// var w = this_event.find(".st-attach-url-img img").width();
					// var h = this_event.find(".st-attach-url-img img").height();
					// mathAvatarPos(this_event.find(".st-attach-url-img img"),w,h,0,360);
					
					this_event.find(".st-attach-url-title").html(val.t);
					this_event.find(".st-attach-url-desc").html(val.d);

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
						
						//圖片滿版
						// var w = this_event.find(".st-attach-url-img img").width();
						// var h = this_event.find(".st-attach-url-img img").height();
						// mathAvatarPos(this_event.find(".st-attach-url-img img"),w,h,0,360);
						
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
	        			this_event.find(".st-task-status").html("已結束");
	        			this_event.find(".st-vote-send").html("已結束");
	        			this_event.data("task-over",true);
	        		}
	    		}else{
	    			var time_format = "無結束時間";
	    		}
				this_event.find(".st-box2-more-time span").html(time_format);
			} 
		});

		//若有圖片 則呼叫函式處理
		if(gallery_arr.length > 0) timelineGalleryMake(this_event,gallery_arr);
		if(audio_arr.length > 0) timelineAudioMake(this_event,audio_arr);
	}

	timelineAudioMake = function (this_event,audio_arr){
 		var file_obj = audio_arr[0];
		$.each(audio_arr,function(i,val){
			//getS3file(val.c);

			var this_audio = $(
				'<audio src="test" controls></audio>'
			);
			this_event.find(".st-attach-audio").prepend(this_audio);
			getS3file(val,this_audio,8);
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
                var this_img = $('<img class="st-slide-img"/>');
                if( i==0 ){
                    left.append(this_img);
                }
                else{
                    right.append(this_img);
                }

                getS3fileBackground(val,this_img,6,function(data){
                    gallery_arr[i].s3 = data.s3;
                    gallery_arr[i].s32 = data.s32;
                });
                if( i>=4 ) return false;
            });
        } else {
            left.addClass("cnt_"+2);
            right.addClass( "cnt_"+(count-2) );
            $.each(gallery_arr,function(i,val){
                var this_img = $('<div class="st-slide-img"/>');

                if( i<2 ){
                    left.append(this_img);
                }
                else{
                    right.append(this_img);
                }

                getS3fileBackground(val,this_img,6,function(data){
                    gallery_arr[i].s3 = data.s3;
                    gallery_arr[i].s32 = data.s32;
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
			
            var gallery = $(document).data("gallery");
            if( null != gallery && false==gallery.closed){
                gallery.focus();
                gallery.ui = ui;
                gallery.at = at;
                gallery.lang = lang;
                gallery.this_ei = this_ei;
                gallery.this_gi = this_gi;
                gallery.this_ti = this_ti;
                gallery.list = gallery_arr;
                var dataDom = $(gallery.document).find(".dataDom");
                dataDom.click();
            } else {
                gallery = window.open("layout/general_gallery.html", "", "width=480, height=730");
                $(document).data("gallery", gallery);
                $(gallery.document).ready(function(){
                    setTimeout(function(){
                        gallery.ui = ui;
                        gallery.at = at;
                        gallery.lang = lang;
                        gallery.this_ei = this_ei;
                        gallery.this_gi = this_gi;
                        gallery.this_ti = this_ti;
                        gallery.list = gallery_arr;
                        var dataDom = $(gallery.document).find(".dataDom");
                        dataDom.click();
                    },500);
                });
            }

			// var gallery_str = "";
			// this_img_area.find(".st-slide-img").each(function(i,val){
			// 	var img_url = $(this).find("img:eq(1)").attr("src") ;
			// 	gallery_str += '<li data-thumb="' + img_url + '"><img src="' + img_url + '" /></li>';
			// });

			// var this_s32 = this_img_area.find(".st-slide-img:eq(" + this_gallery.data("gallery-cnt") + ") img:eq(1)").attr("src");

			// var img = new Image();
			// img.onload = function() {
			// 	var gallery = window.open("flexslider/index.html", "", "width=" + this.width + ", height=" + this.height);
	  //   		$(gallery.document).ready(function(){
	  //   			setTimeout(function(){
	  //   				var this_slide = $(gallery.document).find(".slides");
	  //   				this_slide.html(gallery_str);
	  //   				$(gallery.document).find("input").val(this_gallery.data("gallery-cnt"));
	  //   				$(gallery.document).find("button").trigger("click");
	  //   			},300);
	  //   		});
			// }
			// img.src = this_s32;
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
            
            				mathAvatarPos(img,w,h,size);
				        });
						//小圖
						target.find("img.aut").attr("src",obj.s3);
						//大圖
						target.find("img.auo").attr("src",obj.s32).hide();
						break;
					case 8://聲音
						target.attr("src",obj.s3);
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
			popupShowAdjust("","第" + this_compose.data("uploaded-err").sort().join("、") + "個檔案上傳失敗 請重新上傳");
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
											popupShowAdjust("","第" + this_compose.data("uploaded-err").sort().join("、") + "個檔案上傳失敗 請重新上傳",true);
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


	putEventStatus = function (target_obj,etp,est){
		var this_event = target_obj.selector;
		var act = target_obj.act;
		var order = target_obj.order;
		var event_status = target_obj.status;
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
                         cns.debug("headers:",headers);
        ajaxDo(api_name,headers,method,false).complete(function(data){
        	var d =$.parseJSON(data.responseText);

        	//做timeline樓主的回覆狀態
        	if(data.status == 200){
        		//timeline 外層
        		if(!target_obj.reply){
	        		var count_selector = this_event.find(".st-sub-box-3 div:eq(" + order + ")");
	        		var img_selector = this_event.find(".st-sub-box-3 img:eq(" + order + ")");

	        		//0:取消 1:執行
		        	if(est){
		        		img_selector.attr("src","images/timeline/timeline_feedbox_icon_" + act + "_blue.png")
		        		count_selector.html(count_selector.html()*1+1);

		        		if(etp == 1) this_event.find(".st-like-btn").html("收回讚");

		        		this_status = true;
		        	}else{
		        		img_selector.attr("src","images/timeline/timeline_feedbox_icon_" + act + ".png")
		        		count_selector.html(count_selector.html()*1-1);

		        		if(etp == 1) this_event.find(".st-like-btn").html("讚");
		        	}

	        	}else{
	        		//回覆按讚
	        		if(est){
						this_event.find(".st-reply-footer img").attr("src","images/timeline/timeline_feedbox_icon_like_blue.png");
						this_event.find(".st-reply-footer span:eq(1)").html("收回讚");

						var count = this_event.find(".st-reply-footer span:eq(2)").html()*1+1;

						this_status = true;
	        		}else{
	        			this_event.find(".st-reply-footer img").attr("src","images/timeline/timeline_feedbox_icon_like.png");
						this_event.find(".st-reply-footer span:eq(1)").html("讚");

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

	        	if(!event_status[this_ei]) event_status[this_ei] = {};

	        	//api成功才存回
	        	switch(etp){
	        		case 0:
	        			event_status[this_ei].ir = this_status;
	        			break;
	        		case 1://讚
	        			event_status[this_ei].il = this_status;
	        			break;
	        	}
	        	
		        this_event.data("event-status",event_status);

	        }
        });
        
	}
	//parse 網址
	getLinkMeta = function (this_compose,url) {

		var q = 'http://query.yahooapis.com/v1/public/yql?q=' + encodeURIComponent('select * from html where url="' + url + '" and xpath="//img|//title|//head/meta[@property=\'og:image\' or @property=\'og:title\' or @property=\'og:description\' or @name=\'description\' ]" and compat="html5"' ) + '&format=json&callback=?';
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
		if(url.match(/\?v=/)){

	  		if(url.match(/youtube.com/)){
				var strpos = url.indexOf("?v=")+3;
			}else{
				var strpos = url.indexOf("youtu.be")+9;
			}

			var youtube_code = url.substring(strpos,strpos+11);
			if(youtube_code.length < 11 || youtube_code.match(/\&/)){
				return false;
			}else{
				return youtube_code;
			}
		}else{
			return false;
		}
	}
	
	//parse Youtube
	getLinkYoutube = function (this_compose,url) {
		if(activityTimeout) clearTimeout(activityTimeout);
		cns.debug("url:",url);
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
			                cns.debug(result);
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

		var body = {
			"meta" : {
				"lv" : 1,
				"tp" : "10"
			},
			"ml" : [
				{
					"c": this_event.find(".st-reply-message-textarea textarea").val(),
					"tp": 0
				}
			]
		};

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
        	// popupShowAdjust("","回覆成功");

            this_event.find(".st-reply-message-send").data("reply-chk",false);

        	setTimeout(function(){
				replyReload(this_event);
        	},400);

        });
	}

	replyReload = function(this_event){

		//重置
		this_event.find(".st-reply-message-textarea textarea").val("");

		//重設任務完成狀態
		setEventStatus(this_event);

        //單一動態詳細內容
        getEventDetail(this_event.data("event-id")).complete(function(data){
            if(data.status == 200)
                detailTimelineContentMake(this_event,$.parseJSON(data.responseText).el,true);
        });

		//重設完整的detail
		// this_event.data("detail-content",false);
		// this_event.find(".st-vote-ques-area-div").remove();
		// // timelineDetailClose toggle負負得正
		// this_event.find(".st-reply-area").hide();

		// this_event.data("switch-chk",false);

        // this_event.find(".st-sub-box-1").trigger("detailShow");
	};

	
	
	//timeline more
	zoomOut = function (target)
	{
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

    	var api_name = "/sys/polling?pt=" + polling_time;

        var headers = {
                 "ui":ui,
                 "at":at, 
                 "li":lang,
                     };
        var method = "get";
        ajaxDo(api_name,headers,method,false,false,false,true).complete(function(data){

        	if(data.status == 200){
        		var new_pollingData = $.parseJSON(data.responseText);
                cns.debug("pollingData time:",new_pollingData.ts.pt);
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

        	}
        });
    }

    pollingCountsWrite = function(polling_data){
    	var cnts = polling_data.cnts;
    	var gcnts = polling_data.gcnts;

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
	    			$(".sm-group-area[data-gi=" + val.gi + "]").find(".sm-count").html(countsFormat(val.A5)).show();
	    		}
	    	});
    	}

    	if(gcnts.G1 > 0){
    		$(".sm-group-cj-btn span").html(gcnts.G1).show();
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
	    					cns.debug("polling update timeline");
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
	    		getUserInfo(user_info_arr,function(chk){
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
    	var api_name = "/sys/counts";
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
        	cns.debug("update complete:",data);
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
    getUserInfo = function(user_info_arr,callback){
    	var callback = callback || false;

		//每操作一組 就踢除 直到結束
		if(user_info_arr.length > 0){
			var this_user_info = user_info_arr.last();
            var api_name = "/groups/" + this_user_info.gi + "/users/" + this_user_info.gu;
            cns.debug("here?");
	        var headers = {
	                 "ui":ui,
	                 "at":at,
	                 "li":"zh_TW",
			};
	        var method = "get";
	                         
	        ajaxDo(api_name,headers,method,true,false,false,true).complete(function(data){
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
	        			getUserInfo(user_info_arr,callback);
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
    		//為了美觀
			this_info.find(".user-avatar-bar").hide();

            if(this_gu == gu){
                //css 調整
                $(".user-info-load-area .me").addClass("me-rotate");
                this_info.find(".action-chat").hide();
                
            }else{
                //css 調整
                $(".user-info-load-area .me").removeClass("me-rotate");
                this_info.find(".action-edit").hide();
            }

    		getUserInfo([{gi:this_gi,gu:this_gu}],function(user_data){
	    			
    			if(user_data){
                    $("body").addClass("user-info-adjust");

    				//為了美觀
    				this_info.find(".user-avatar-bar").show();

			    	//頭像
	        		if(user_data.aut){
	        			$(".user-avatar .user-pic").attr("src",user_data.auo);
	        			$(".user-avatar").data("auo",user_data.auo);

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
                    cns.debug("user_data",user_data);
					user_data.bd = user_data.bd.substring(4,6) + "." + user_data.bd.substring(6,8);
					method = "append";
				}

				if(item == "bl"){
					var bi = user_data.bl.split(".").last();
					user_data.bl = $.lStorage(ui)[this_gi].bl[bi].bn;
				}

				selector.find("."+item)[method](user_data[item]).show();

				if(!me && $.inArray(item,img_arr) >= 0) {
					var this_img = selector.find("img."+item);
					this_img.attr("src","images/icon/bt_" + this_img.data("name") + "_normal.png");
				}
			}
		}

		if(user_data.mkp) this_info.find(".user-info-list .pn").val("******");
		if(user_data.mke) this_info.find(".user-info-list .em").val("******");
		if(user_data.mkb) {
			this_info.find(".user-avatar-bar .bd").hide();
			this_info.find(".user-info-list .bd").val("******");	
		}

    }

    meInfoShow = function(user_data){
    	var this_gi = gi;
    	var this_gu = gu;

    	$(".screen-lock").show();
    	$(".user-info-load-area").fadeIn("fast");
    	$(".user-info-load-area .me").load('layout/layout.html .me-info-load',function(){
    		var this_info = $(this).find(".me-info-load");

    		//團體頭像
    		this_info.find(".group-avatar img").attr("src",$.lStorage(ui)[gi].aut);
    		avatarPos(this_info.find(".group-avatar img"),60);

    		//團體名稱
    		this_info.find(".group-name").html($.lStorage(ui)[gi].gn);

    		//頭像
    		if(user_data.aut){
    			$(".user-avatar .default").attr("src",user_data.auo);
    			$(".user-avatar").data("auo",user_data.auo);

    			//400存在css media min-width中 
    			userInfoAvatarPos(this_info.find(".user-avatar > img"));
    			$(".user-avatar .default").removeClass("default");
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
			img.src = $(this).find(".user-pic").attr("src");
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
					popupShowAdjust("","檔案格式必須為圖檔");
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
	    			$(document).find(".user-info-load-area .user").hide();
	    			$(".user-info-load , .me-info-load").stop().animate({
						opacity:1
					},400);
	    		},400);
	    	});
    	}

	    	
    }

    userInfoSend = function(this_info){
    	var new_name = this_info.find(".user-info-list .nk").val().trim().replace(/( +)/g," ").replace(/[&\|\\\\:\/!*^%$#@\-]/g,"");
    	if(new_name == ""){
    		toastShow("姓名不能為空值");
    		return false;
    	}
    	
    	// load show
    	s_load_show = true;
		var api_name = "/groups/"+gi+"/users/"+gu;
        var headers = {
             "ui":ui,
             "at":at, 
             "li":lang
        };

        var body = {
		  nk: new_name, // Nickname
		  sl: this_info.find(".user-info-list .sl").val() // Slogan
		}
		cns.debug("before info send this_info data:",this_info.data());
        var method = "put";
        ajaxDo(api_name,headers,method,false,body).complete(function(data){
        	cns.debug("after info send this_info data:",this_info.data());
        	//重置團體頭像、名稱的參數
			var data_arr = ["getUserName",gi,gu,$(".sm-user-area-r div:eq(1)"),$(".sm-user-pic img")];

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
					var api_name = "/groups/"+gi+"/users/"+gu+"/avatar";
					
					uploadToS3(file,api_name,ori_arr,tmb_arr,function(chk){
    					// 關閉load 圖示
        				s_load_show = false;
        				$('.ui-loader').hide();
						$(".ajax-screen-lock").hide();
						$(".sm-user-area-r div:eq(1)").html(body.nk);

    					if(chk) {
    						//重置團體頭像、名稱的參數
							var data_arr = ["getUserName",gi,gu,$(".sm-user-area-r div:eq(1)"),$(".sm-user-pic img")];
	    					setGroupAllUser(data_arr);

    						toastShow("更新成功!");
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

        			toastShow("更新成功");
        			$(".sm-user-area-r div:eq(1)").html(body.nk);

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


    //============================================================

    getLoginDataForTest = function(){
    	//暫時
		var api_name = "login";
        var headers = {
            li:lang
        };
        var body = {
            id: "+886980922917",
            tp: 1,
            pw:toSha1Encode("111111")
        };
        var method = "post";
        ajaxDo(api_name,headers,method,false,body).complete(function(data){
        	if(data.status == 200){
        		var login_result = $.parseJSON(data.responseText);
        		$.lStorage("_loginData",login_result);

        		ui = login_result.ui;
				at = login_result.at;
				cns.debug("ui:",ui,"at:",at);
        		//附上group list
        		getGroupList().complete(function(data){
        			if(data.status == 200){
        				if($.parseJSON(data.responseText).gl && $.parseJSON(data.responseText).gl.length > 0){
        					//有group
        					$.lStorage("_groupList",$.parseJSON(data.responseText).gl);
        					location.reload();
        				}else{
        					//沒group
        					document.location = "main.html#page-group-menu";
        				}
        			}else{
        				//取得group list 失敗
        			}
        		});
        	}
        });
    };

    eventDetailShow = function(this_ei){
        var this_gi = this_ei.split("_")[0];
        $('<div>').load('layout/timeline_event.html .st-sub-box',function(){
            var this_event = $(this).find(".st-sub-box");
            $(".timeline-detail").html(this_event).hide();
            //單一動態詳細內容
            getEventDetail(this_ei).complete(function(data){
                if(data.status == 200){
                    timelineBlockMake(this_event,[$.parseJSON(data.responseText).el[0]],false,true) ;
                }
            });
        });
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