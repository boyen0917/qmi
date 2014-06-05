$(function(){  

	getUserName = function (gi , gu , target ,set_img ,polling){
        //先檢查localStorage[gi].guAll是否存在
        var _groupList = $.lStorage(ui);
        if(_groupList[gi].guAll && !polling){
        	//設定圖片
        	if(set_img){
        		
        		//調整圖片位置
        		if(_groupList[gi].guAll[gu].au){
        			set_img.attr("src",_groupList[gi].guAll[gu].au);
        			avatarPos(set_img);
        		}else{
        			set_img.removeAttr( 'style' );
        			set_img.attr("src",no_pic);
        			set_img.attr("width",avatar_size);
        		}
        	}
        	
            target.html(_groupList[gi].guAll[gu].n);
            return;
        }
        
        //沒有才call api
        var api_name = "groups/"+ gi +"/users";
        var headers = {
            "ui":ui,
            "at":at,
            "li":"zh_TW",
        };
        var method = "get";
        var result = ajaxDo(api_name,headers,method,true);
        result.complete(function(data){
            data_group_user = $.parseJSON(data.responseText).ul;
            var new_group_user = {};
            
            $.each(data_group_user,function(i,val){
                //將gu設成key 方便選取
                new_group_user[val.gu] = val;
            });
            //設定圖片
            if(set_img){
        		//調整圖片位置
        		if(new_group_user[gu].au){
        			set_img.attr("src",new_group_user[gu].au);
        			avatarPos(set_img);
        		}else{
        			set_img.removeAttr( 'style' );
        			set_img.attr("src",no_pic);
        			set_img.attr("width",avatar_size);
        		}
        	}
            //成員姓名寫入目標
            target.html(new_group_user[gu].n);
            //成員列表存入local storage
            _groupList[gi].guAll = new_group_user;
            $.lStorage(ui,_groupList);
        });
    }
	
	
	//調整個人頭像
	avatarPos = function (img,x){
		img.load(function() {
            var w = img.width();
            var h = img.height();
            
	        if(!x){
	        	x = avatar_size;
	        }

            mathAvatarPos(img,w,h,x);
        });
	}
	
	mathAvatarPos = function (img,w,h,x,limit){
		//設最大值 若小於此值 就用原尺寸
		if(limit){
			w < limit ? x = w : x = limit ;
		}
		
        if(w == 0 || h == 0) return false;
        
        
        img.removeAttr( 'style' );
        if(w <= h){
        	img.attr("width",x);
            var p = ((h/(w/x))-x)/2*(-1);
            img.css("margin-top",p +"px");
        }else{
        	img.attr("height",x);
        	var p = ((w/(h/x))-x)/2*(-1);
        	img.css("margin-left",p +"px");
        }
	}

	mainActionSwitch = function (act){
		switch (act) {
	        case "feed":
	        	timelineListWrite();
	        	$(".subpage-contact").hide();
	        	$(".subpage-timeline").show();
	        	$( "#side-menu" ).panel( "close");
	        	$("#page-group-main").find("div[data-role=header] h3").html("動態消息");
	          break;
	        case "contact": 
	        	$(".subpage-contact").show();
	            $(".subpage-timeline").hide();
	            $( "#side-menu" ).panel( "close");
	            $("#page-group-main").find("div[data-role=header] h3").html("聯絡人");
	          break;
	        case "chat":
	        	$.mobile.changePage("#page-chatroom");
	        	$("#page-group-main").find("div[data-role=header] h3").html("聊天室");
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

	getTlByGroup = function (gi){
		$.each(group_list,function(i,val){
			if(val.gi == gi){
				return val.tl;
			}
		});
	}
	
	setSmUserData = function (gi,gu,gn){
		$(".sm-user-area-r div:eq(0)").html(gn);
		$(".sm-user-area-r div:eq(1)").html("");
		
		//最後面帶個1 代表換團體時 重新更新 group all user 名單
		getUserName(gi,gu,$(".sm-user-area-r div:eq(1)"),$(".sm-user-pic img"),1);
	}

	chkEventStatus = function (this_event,etp){
		var this_ei = this_event.data("event-id");
		var event_status = this_event.data("event-status");

		//兩種狀況下 要登記已記錄: event_status不存在 或 event_status存在但 此ei 的 ir、il、ip是false
		if( event_status[this_ei] && !event_status[this_ei][etp]){
			return true;
		}else{
			return false;
		}
		
	}


/*

######## ##     ## ######## ##    ## ######## 
##       ##     ## ##       ###   ##    ##    
##       ##     ## ##       ####  ##    ##       
######   ##     ## ######   ## ## ##    ##     
##        ##   ##  ##       ##  ####    ##    
##         ## ##   ##       ##   ###    ##    
########    ###    ######## ##    ##    ##    


########     ###    ########  ######## ####  ######  #### ########     ###    ##    ## ########  ######  
##     ##   ## ##   ##     ##    ##     ##  ##    ##  ##  ##     ##   ## ##   ###   ##    ##    ##    ## 
##     ##  ##   ##  ##     ##    ##     ##  ##        ##  ##     ##  ##   ##  ####  ##    ##    ##       
########  ##     ## ########     ##     ##  ##        ##  ########  ##     ## ## ## ##    ##     ######  
##        ######### ##   ##      ##     ##  ##        ##  ##        ######### ##  ####    ##          ## 
##        ##     ## ##    ##     ##     ##  ##    ##  ##  ##        ##     ## ##   ###    ##    ##    ## 
##        ##     ## ##     ##    ##    ####  ######  #### ##        ##     ## ##    ##    ##     ######  


*/


	
	//取得單一timeline 回覆讚好等狀態
	getThisTimelinePart = function (this_event,target_div,tp){
		var ei = this_event.data("event-id");
		console.debug("有吧!!!!!!!!!!!2");
		var api_name = "/groups/" + gi + "/timelines/" + ti_feed + "/events/" + ei + "/participants?tp=" + tp;
		var headers = {
            "ui":ui,
			"at":at, 
			"li":"zh_TW"
			            };
			var method = "get";
			var result = ajaxDo(api_name,headers,method,false);
			result.complete(function(data){
				var epl = $.parseJSON(data.responseText).epl;
				if(typeof epl != "undefined" && epl.length > 0){
					epl = epl.split(",");
					//存回 陣列
					this_event.data("parti-list",epl);
					console.debug("有吧!!!!!!!!!!!3");
					//編輯讚好區域
					detailLikeStringMake(this_event);
				}
				
			});
	}
	
	detailLikeStringMake = function (this_event){
		var epl = this_event.data("parti-list");

		//gu gi 是全域
		var me_pos = $.inArray(gu,epl);
		
		var guAll = $.lStorage(ui)[gi].guAll;
        var me_gu = guAll[epl[me_pos]];
		var like_str;

        this_event.find(".st-reply-like-area").show();

        switch(true){
        	//陣列空的 隱藏 區域
        	case (epl.length == 0) :
                like_str = "目前沒人按讚";
                break;
            //你 按讚
            case ( typeof me_gu != "undefined" && epl.length == 1 ) :
                like_str = "你" + " 按讚";
                break;
            //林小花 按讚
            case ( !me_gu && epl.length == 1 ) :
                like_str = guAll[epl[0]].n + " 按讚";
                break;
            //你、林小花 按讚
            case ( typeof me_gu != "undefined" && epl.length == 2 ) :
                like_str = "你、 " + (me_pos ? guAll[epl[0]].n : guAll[epl[1]].n) + " 按讚";
                break;
            //林小花、陳小鳥 按讚
            case ( !me_gu && epl.length == 2 ) :
                like_str = guAll[epl[0]].n + "、 " + guAll[epl[1]].n + " 按讚";
                break;
            //你、林小花、陳小鳥 按讚
            case ( typeof me_gu != "undefined" && epl.length == 3 ) :
                like_str =  "你、 " + (me_pos ? guAll[epl[0]].n : guAll[epl[1]].n) + "、 " + (me_pos ? guAll[epl[1]].n : guAll[epl[2]].n) + " 按讚";
                break;
            //林小花、陳小鳥 及其他？個人按讚
            case ( !me_gu && epl.length > 2 ) :
            	like_str =  guAll[epl[0]].n + "、 " + guAll[epl[1]].n + " 及其他" + (epl.length-2) + "人按讚";
                break;
            //你、林小花、陳小鳥 及其他？個人按讚
            case ( typeof me_gu != "undefined" && epl.length > 3 ) :
                like_str =  "你、 " + (me_pos ? guAll[epl[0]].n : guAll[epl[1]].n) + "、 " + (me_pos ? guAll[epl[1]].n : guAll[epl[2]].n) + " 及其他 " + (epl.length-3) + " 人按讚";
                break;
        }
        
        this_event.find(".st-reply-like-area span").html(like_str);
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
	replyDetailTimelineContentMake = function (this_event,e_data){
		//event 自己的閱讀回覆讚好狀態
    	var event_status = this_event.data("event-status");

    	//event id
    	var this_ei = this_event.data("event-id");

    	//event path
		this_event.data("event-path",this_ei);

    	//已閱讀
		if(!event_status[this_ei]){
			event_status[this_ei] = {};
		}

		//沒閱讀過 就判斷閱讀
		var read_chk = chkEventStatus(this_event,"ir");
		if(read_chk){
			//回傳已觀看
			var target_obj = {};
			target_obj.selector = this_event;
			target_obj.act = "read";
			target_obj.order = 2;

			//已讀存回
			event_status[this_ei].ir = true;
			target_obj.status = event_status;
			putEventStatus(target_obj,0,1);
		}
		
		//製作每個回覆

		//製作前先清空
		this_event.find(".st-reply-content-area").parent().remove();

		$.each(e_data,function(el_i,el){
			console.log("====================回覆============================================================================");
			console.log(el);

			var without_message = false;
			var reply_content;

			$.each(el.ml,function(i,val){

				//有附檔 開啟附檔區域 not_attach_type_arr是判斷不開啟附檔 設定在init.js
				if($.inArray(val.tp,not_attach_type_arr) < 0 && !this_event.find(".st-sub-box-2-attach-area").is(":visible")){
					this_event.find(".st-sub-box-2-attach-area").show();
				}

				console.log("========================");
				console.log(JSON.stringify(val,null,2));
				
				//所有狀態的c 都做format?(url、entities)
				if(val.c){
					reply_content = htmlFormat(val.c);
				}

				//event種類 不同 讀取不同layout
				switch(val.tp){
					case 0:
						//更改網址成連結 只設定狀態是貼文的才做format?
						// if(val.c){
						// 	reply_content = urlFormat(val.c);
						// }
						break;
					case 1:
						break;
					case 2:
						break;
					case 3:
						break;
					case 9:
						//without_message = true;
						break;
					case 14:
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
						console.log(el);
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
				}
			});

			//製作留言

    		//部分tp狀態為樓主的話 或狀態為不需製作留言 就離開
			if(without_message || (el.meta.tp.substring(0,1)*1 == 0)) return;

			this_event.find(".st-reply-area").append($('<div>').load('layout/layout.html .st-reply-content-area',function(){
				var _groupList = $.lStorage(ui);
				var user_name = _groupList[gi].guAll[el.meta.gu].n;
				var this_load = $(this).find(".st-reply-content-area");

				//大頭照
				if(_groupList[gi].guAll[el.meta.gu].au){
        			this_load.find(".st-user-pic img").attr("src",_groupList[gi].guAll[el.meta.gu].au);
        			avatarPos(this_load.find(".st-user-pic img"));
        		}
				
				var time = new Date(el.meta.ct);
	    		var time_format = time.customFormat( "#MM#/#DD# #CD# #hhh#:#mm#" );
	    		

				this_load.find(".st-reply-username").html(user_name + el.ei);
				this_load.find(".st-reply-content").html(reply_content);
				this_load.find(".st-reply-footer span:eq(0)").html(time_format);

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
				break;
			case 4:
				//bottom_block = true;
				detail_data = ".st-box2-more-task-area";
				
				break;
			case 5:
				break;
			case 6:
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
		
		//功能的線 隱藏
		// if(bottom_block){
		// 	this_event.find(".st-box2-bottom-block").toggle();
		// }
		
		//開啟留言區域
		this_event.find(".st-reply-area").toggle();
		
		//設定動態消息detail開關
		if(!this_event.data("detail-content")){
			//表示沒填入過detail內容 即設定為有資料 下次就不重複做資料
			this_event.data("detail-content",true);
			return true;
		}else{
			//表示有detail內容了 不動作
			return false;
		}
		
		
	}
	


	voteContentMake = function (this_event,li){

		$.each(li,function(v_i,v_val){


			this_event.find(".st-vote-send").before($('<div class="st-vote-ques-area-div">').load('layout/layout.html .st-vote-ques-area',function(){
				var this_ques = $(this).find(".st-vote-ques-area");
				
				//設定題目的編號
				this_ques.data("ques-index",v_val.k);



				// 單選是圈圈
        		var tick_img = "images/common/icon_check_red_round.png";
        		//複選是勾勾
	        	if(v_val.v > 1){
	        		tick_img = "images/common/icon_check_red.png";
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
					        '<img src="images/common/icon_check_round_white.png"/>' +
					        '<span>' + i_val.o + '</span>' +
					        '<span>' + 0 + '</span>' +
					    '</div>'
					);

					//設定複選投票數為 0
		        	this_ques.data("multi-count",0);

					//調整圈圈高度
					// setTimeout(function(){
					// 	var center_pos = mathAlignCenter(this_ques.find(".st-vote-detail-option").height(),this_ques.find(".st-vote-detail-option img").height());
					// 	this_ques.find(".st-vote-detail-option img").css("top",center_pos + "px");
					// },100);
					
					
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
		console.log("votevotevotevote");
		console.log(JSON.stringify(vote_obj,null,2));

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
		
		this_event.find(".st-vote-ques-area-div").click(function(){
			console.debug("按到題目了:",$(this));

		});		

		this_event.find(".st-vote-detail-option").click(function(){
			console.debug("進來");
			//時間到 不給點
			if(this_event.data("task-over")){
				console.debug("時間到");
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

				console.debug("復選");
				//復選的情況就要判斷該選項是否已選擇
				if(this_opt.data("vote-chk")){
					this_opt.data("vote-chk",false);
					this_opt.find("img").attr("src","images/common/icon_check_round_white.png");

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
				console.debug("單選");
				//找出點選的那一項要減一
				$.each(this_ques.find(".st-vote-detail-option"),function(i,val){
					if($(this).data("vote-chk")){
						console.debug("here");
						//找出點選的那一項的vote-chk 變false
						$(this).data("vote-chk",false);
						//找出點選的那一項 變成白圈圈
						$(this).find("img").attr("src","images/common/icon_check_round_white.png");

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

				//有一題沒投 就不玩啦
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
				popupShowAdjust("第" + vote_chk_index +" 題尚未完成投票");
				return false;
			}


			var body = {
				"meta" : {
					"lv" : 1,
					"tp" : "14"
				},
				"ml" : [reply_obj]
			};
			console.debug("reply body:",body);
			var api_name = "groups/" + gi + "/timelines/" + ti_feed + "/events?ep=" + this_event.data("event-id");

	        var headers = {
	                 "ui":ui,
	                 "at":at, 
	                 "li":"zh_TW",
	                     };


	        var method = "post";
	        var result = ajaxDo(api_name,headers,method,true,body);
	        result.complete(function(data){

	        	//重新讀取detail
	        	popupShowAdjust("回覆成功");
	        	this_event.find(".st-vote-send").removeClass("st-vote-send-blue");
	        	//客製化 按了確定之後再重讀取
	        	$(".popup-close").bind("reload",function(){
	        		//重設任務完成狀態
	        		setEventStatus(this_event);

	        		//重設完整的detail
					this_event.data("detail-content",false);
		    		this_event.find(".st-vote-ques-area-div").remove();
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
			this_compose.css("min-height",$(window).height());
			//this_compose.find(".cp-content-height-adj").css("min-height",$(window).height()+800);
			console.debug("pos:",this_compose.find(".cp-content-height-adj").offset());
			this_compose.data("message-list",[0]);

			// this_compose.find('.cp-textarea-desc, .cp-vote-area textarea').autosize({append: "\n"});


			var show_area,title,show_date;

			switch (compose_title) {
		        case "post":
		        	ctp = 0;
		        	//close_area = ".cp-content-title , .cp-content-apt , .cp-content-top";
		        	break;
		        case "announcement": 
		        	ctp = 1;
		        	show_area = ".cp-content-title , .cp-content-apt , .cp-content-top";
		        	break;
		        case "feedback":
		            ctp = 2;
		        	break;
		        case "work":
		        	ctp = 3;
		          	break;
		        case "vote":
		        	ctp = 4;
		        	show_area = ".cp-content-title,.cp-vote-area,.cp-content-addcal,.cp-content-first,.cp-time-area";

		        	//預設題目數為0
		        	this_compose.data("ques-total",0);

		        	show_date = true;

		        	composeVoteQuesMake(this_compose);
		        	composeVoteEvent(this_compose);
		          	break;
		        case "check":
		        	ctp = 5;
		          	break;
		    }


			//狀態編號
			this_compose.data("compose-tp",ctp);
			//message list 宣告為空陣列

			this_compose.find(show_area).show();


			//共同綁定事件
			//打勾
			this_compose.find(".cp-top-btn").click(function(){
				if($(this).data("cp-top")){
					$(this).attr("src","images/compose/compose_form_icon_check_none.png");
					$(this).data("cp-top",false);
				}else{
					$(this).attr("src","images/compose/compose_form_icon_check.png");
					$(this).data("cp-top",true);
				}
			});

			//url parse
			this_compose.find('.cp-textarea-desc').bind('input',function(){
				//有東西就不作了
				if(this_compose.find(".cp-ta-yql").is(":visible")) return false;

				//先將換行符號換成<br/>加空格 再以空格切出陣列
				var url_chk = this_compose.find('.cp-textarea-desc').val().replace(/\n|\r/g," <br/> ").split(' ');
				
				$.each(url_chk,function(i,val){
					if(val.substring(0, 7) == 'http://' || val.substring(0, 8) == 'https://'){
						if(val.match(/youtube.com|youtu.be/)){
							getLinkYoutube(this_compose,val);
						}else{
							getLinkMeta(this_compose,val);
						}
						return false;
					}else{
			            //暫時
			            this_compose.find(".cp-attach-area").hide();
						this_compose.find(".cp-ta-yql").hide();
					}
				});
			});

			if(show_date){
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
				            	composeDatetimepickerFormat(this_compose,"end");
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
		            	composeDatetimepickerFormat(this_compose,"start");
		            }
		        });
				//初始化 datetimepicker
		        this_compose.find("input.cp-datetimepicker-end").datetimepicker({
		        	startDate:'+1970/01/02',
		            minDate: 0  ,
		            format:'unixtime',
		            onChangeDateTime: function(dateText) {
		            	composeDatetimepickerFormat(this_compose,"end");
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
		}));
	}

	composeDatetimepickerFormat = function(this_compose,type){
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

				console.debug("opt total:",this_ques.data("opt-total"));

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
					console.debug("圖示關閉");
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
		console.debug("vote obj k-1!:",ml_obj);
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
		var ml = this_compose.data("message-list");
		var body = {
			"meta" : {
				"lv" : 1,
				"tp" : "0" + ctp
			},
			"ml" : []
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
				break;
			//通報
			case 2:
				break;
			//任務 工作
			case 3:
				break;
			//任務 投票
			case 4:

				body.meta.tt = this_compose.data("compose-title");

				empty_chk = composeVoteObjMake(this_compose,body);

				empty_msg = "投票內容不完整！";
				console.debug("body:",JSON.stringify(body,null,2));
				console.debug("compose data :",this_compose.data());
				break;
			//任務 定點回報
			case 5:
				break;
		}

		//有空值就跳出
		if(empty_chk) { 
			popupShowAdjust(empty_msg);
			return false;
		}

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
					console.log("url_content");
					console.log(url_content);
					obj.c = url_content.url
					obj.t = url_content.title;
					obj.d = url_content.description;
					obj.i = url_content.img;
					break;
				//影片網站url
				case 2:
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
			}


			//會有順序問題 因為ios只會照ml順序排 所以必須設定順序
			if(is_push) body.ml.push(obj);
		});

// 		console.log(body);
// return false;
		var api_name = "groups/" + gi + "/timelines/" + ti_feed + "/events";

        var headers = {
                 "ui":ui,
                 "at":at, 
                 "li":"zh_TW",
                     };


        var method = "post";
        console.log(api_name);
        console.log(body);
        var result = ajaxDo(api_name,headers,method,true,body);
        result.success(function(data){
        	popupShowAdjust("發佈成功");
        	timelineListWrite();
	        popupAfterChangePage("#page-group-main");
        });
        // result.success(function(data){
        // 	rsp_code = $.parseJSON(data.responseText).rsp_code;
        // 	console.log(rsp_code);
        // 	console.log(data);
        // 	// popupShowAdjust("發佈成功");
        // 	// timelineListWrite();
	       //  // popupAfterChangePage("#page-group-main");
        // });

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



	//ajax
	ajaxDo = function (api_name,headers,method,load_show_chk,body){
		//設定是否顯示 loading 圖示
		load_show = load_show_chk;
		
	    //console.log(api_url);
	    var api_url = base_url + api_name;
	    var myRand = Math.floor((Math.random()*1000)+1);

	    if(body){
	        body = JSON.stringify(body);
	    }
	    
	    var result = $.ajax ({
            url: api_url,
            type: method,
            headers:headers,
            data:body
        });
	    
	    return result;
	}
	
	groupMenuListArea = function (permission){
	    var api_name = "groups";
	    var headers = {
	        "ui":ui,
	        "at":at,
	        "li":"zh_TW"
	    };
	    var method = "get";
	    	
    	var result = ajaxDo(api_name,headers,method,false);
	    result.complete(function(data){
	    	
	    	$(".sm-group-list-area").html("");
	    	$(".sm-group-list-area-add").html("");
	    	//chk是開關按鈕ui變化的檢查
	    	var tmp_selector,count,chk;
	    	group_list = $.parseJSON(data.responseText).gl;
	    	
	        //每次讀取timeline時 順便重新設定permission
	    	if(permission){
	    		permissionControl(group_list);
	    	}
			
			var total = group_list.length;	
	        $.each(group_list,function(i,val){
	        	if(i < 2){
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
	        	
	            $(tmp_selector).append(
	           		'<div class="sm-group-area" data-gi="' + decodeURI(val.gi) + '" data-gu="' + decodeURI(val.me) + '" ' + chk + '>' +
	           	        '<div class="sm-group-area-l">' +
	           	            '<img src="images/no_pic_g.png">' +
	           	        '</div>' +
	           	        '<div class="sm-group-area-r">' + decodeURI(val.gn) + '</div>' +
	           	        '<div class="sm-count" style="display:none"></div>' +
	           	    '</div>'
	     	    );
	        });
	        if(group_list.length > 2){
	        	$(".sm-group-switch").show();
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
	timelineListWrite = function (){
		//先做權限設定
		groupMenuListArea(true);

	    //製作timeline
	    var api_name = "groups/"+ gi +"/timelines/"+ ti_feed +"/events";
	    var headers = {
	            "ui":ui,
	            "at":at, 
	            "li":"zh_TW"
	                };
	    var method = "get";
	    var result = ajaxDo(api_name,headers,method,true);
	    result.complete(function(data){
	        var timeline_list = $.parseJSON(data.responseText).el;
	        
	        var content,box_content,youtube_code,prelink_pic,prelink_title,prelink_desc;
	        $(".st-feedbox-area").html('');
	        $.each(timeline_list,function(i,val){
	        	console.log(JSON.stringify(val, null, 2));
	        	
	        	var tp = val.meta.tp.substring(1,2)*1;
	        	$('.st-feedbox-area').append($('<div>').load('layout/layout.html .st-sub-box',function(){
	        		var this_event = $(this).find(".st-sub-box");
	        		
	        		//記錄timeline種類
	        		this_event.data("timeline-tp",tp);
	        		this_event.data("group-id",gi);
	        		this_event.data("timeline-id",ti_feed);
	        		this_event.data("event-id",val.ei);
					this_event.data("parti-list",[]);

	        		//時間 名字
	        		getUserName(gi , val.meta.gu , this_event.find(".st-sub-name") , this_event.find(".st-sub-box-1 .st-user-pic img"));
	        		var time = new Date(val.meta.ct);
	        		var time_format = time.customFormat( "#MM#/#DD# #CD# #hhh#:#mm#" );
	        		$(this).find(".st-sub-time").html(time_format);
	        		
	        		//發佈對象
	        		this_event.find(".st-sub-box-1-footer").html(val.ei + "  " + val.meta.tp);
	        		
	        		//讚留言閱讀
	        		this_event.find(".st-sub-box-3 div:eq(0)").html(val.meta.lct);
	        		this_event.find(".st-sub-box-3 div:eq(1)").html(val.meta.pct);
	        		this_event.find(".st-sub-box-3 div:eq(2)").html(val.meta.rct);



/*


		######## ##     ## ######## ##    ## ########        ######  ########    ###    ######## ##     ##  ######  
		##       ##     ## ##       ###   ##    ##          ##    ##    ##      ## ##      ##    ##     ## ##    ## 
		##       ##     ## ##       ####  ##    ##          ##          ##     ##   ##     ##    ##     ## ##       
		######   ##     ## ######   ## ## ##    ##           ######     ##    ##     ##    ##    ##     ##  ######  
		##        ##   ##  ##       ##  ####    ##                ##    ##    #########    ##    ##     ##       ## 
		##         ## ##   ##       ##   ###    ##          ##    ##    ##    ##     ##    ##    ##     ## ##    ## 
		########    ###    ######## ##    ##    ##           ######     ##    ##     ##    ##     #######   ######  


*/

					setEventStatus(this_event);
					

	        		var category;
	        		
	        		switch(tp){
	        			//貼文
	        			case 0:
	        				this_event.find(".st-sub-box-2-more").hide();
	        				break;
	        			//公告
	        			case 1:
	        				category = "公告";

	        				// //隱藏線
	        				// this_event.find(".st-box2-bottom-block").show();
	        				//this_event.find(".st-box2-more-title").html(val.meta.tt);
	        				
//	        				this_event.find(".st-attach-audio").show();
//	        				
//	        				this_event.find("audio").on('timeupdate', function() {
//	        					this_event.find('input[type="range"]').val(($(this).get(0).currentTime / $(this).get(0).duration)*100);
//	        					this_event.find('input[type="range"]').css('background-image',
//	        			                '-webkit-gradient(linear, left top, right top, '
//	        			                + 'color-stop(' + ((($(this).get(0).currentTime / $(this).get(0).duration)<0.5)?(($(this).get(0).currentTime / $(this).get(0).duration)+0.02):($(this).get(0).currentTime / $(this).get(0).duration)) + ', rgb(95,212,226)), '
//	        			                + 'color-stop(' + ((($(this).get(0).currentTime / $(this).get(0).duration)<0.5)?(($(this).get(0).currentTime / $(this).get(0).duration)+0.02):($(this).get(0).currentTime / $(this).get(0).duration)) + ', rgb(197,203,207))'
//	        			                + ')'
//	        			                );
//	        					this_event.find(".audio-progress div:nth-child(1)").html(secondsToTime(Math.floor($(this).get(0).currentTime)));
//	        					this_event.find(".audio-progress div:nth-child(3)").html(secondsToTime(Math.floor($(this).get(0).duration)));
//	        				});
	        				
	        				break;
	        			//通報
	        			case 2:
	        				this_event.find(".st-box2-more-category").addClass("st-box2-more-category-fb");
	        				category = "通報";
	        	//			this_event.find(".st-feedback-box").click(function(){
	        	//				$(".st-feedback-box").data("fb-tick",0);
	        	//				$(".st-feedback-box-content img").hide();
	        	//				$(this).find("img").show();
	        	//				$(this).data("fb-tick",1);
	        	//				console.log($(".st-feedback-box:nth-child(1)").data("fb-tick"));
	        	//				console.log($(".st-feedback-box:nth-child(2)").data("fb-tick"));
	        	//			});
	        				
	        				break;
	        			case 3:
	        				this_event.find(".st-box2-more-category").addClass("st-box2-more-category-task");
	        				category = "任務<img src=\"images/task/timeline_task_icon_task_work.png\"> <span>工作</span>";
	        				
	        				//任務狀態
	        				this_event.find(".st-box2-more-task-area").show();
	        				this_event.find(".st-box2-more-time").show();

	        				//任務預設的文字
	        				this_event.find(".st-task-status").html("未完成");
	        				
	        				break;
	        			case 4://投票
	        				this_event.find(".st-box2-more-category").addClass("st-box2-more-category-task");
	        				category = "任務<img src=\"images/task/timeline_task_icon_task_vote.png\"> <span>投票</span>";
	        				
	        				//任務狀態
	        				this_event.find(".st-box2-more-task-area").show();
	        				this_event.find(".st-box2-more-time").show();
	        				this_event.find(".st-task-vote").show();

	        				//投票結果obj
	        				this_event.data("vote-result",{});

	        				//任務預設的文字
	        				this_event.find(".st-task-status").html("未投票");
	        				break;
	        			case 5:
	        				this_event.find(".st-box2-more-category").addClass("st-box2-more-category-task");
	        				category = "任務<img src=\"images/task/timeline_task_icon_task_checkin.png\"> <span>定點回報</span>";
	        				
	        				//任務狀態
	        				this_event.find(".st-box2-more-task-area").show();
	        				this_event.find(".st-box2-more-time").show();

	        				//任務預設的文字
	        				this_event.find(".st-task-status").html("未回報");
	        				break;
	        		};
	        		
	        		//0:普通貼文 共用區
	        		if(tp != 0){
	        			this_event.find(".st-box2-more-category").html(category);
		        		this_event.find(".st-box2-more-title").html(val.meta.tt);
	        		}
	        		
	        		//tp = 0 是普通貼文 在content區填內容 其餘都在more desc填
	        		var target_div = ".st-box2-more-desc";
	        		if(tp == "0"){
	        			target_div = ".st-sub-box-2-content";
	        		}
	        		
	        		//timeline message內容
    				timelineContentMake(this_event,target_div,val.ml);
	        		
	        		var timer = 600;
	        		if(i == 0){
	        			timer = 300;
	        		}
	        		setTimeout(function(){
	        			this_event.css("opacity",1);
	        		},timer);
	        		
	        		
	        	}));
	        });
	    });
	}

	setEventStatus = function(this_event){
		//這邊是timeline list 要call這個api判斷 自己有沒有讚過這一串系列文 
		var this_ei = this_event.data("event-id");

		var api_name = "groups/" + gi + "/timelines/" + ti_feed + "/events_status?ep=" + this_ei;
        var headers = {
                "ui":ui,
                "at":at, 
                "li":"zh_TW"
                    };
        var method = "get";
        
        var result = ajaxDo(api_name,headers,method,true);
    	result.complete(function(data){
    		var s_data = $.parseJSON(data.responseText).el;
    		//將此則動態的按讚狀態寫入data中
			//轉換array 成json object 減少回圈使用
			var s_obj = {};
			if(s_data.length > 0){
				
				$.each(s_data,function(i,val){
					s_obj[val.ei] = val;
				});

        		//判斷自己有無 : 
        		//按讚
        		if(s_obj[this_ei].il){
    				this_event.find(".st-sub-box-3 img:eq(0)").attr("src","images/timeline/timeline_feedbox_icon_like_blue.png");
					this_event.find(".st-sub-box-4 .st-like-btn").html("收回讚");
	    		}
    			//回覆
	    		if(s_obj[this_ei].ip)
	    				this_event.find(".st-sub-box-3 img:eq(1)").attr("src","images/timeline/timeline_feedbox_icon_chat_blue.png");
	    				
    			//閱讀
	    		if(s_obj[this_ei].ir)
	    				this_event.find(".st-sub-box-3 img:eq(2)").attr("src","images/timeline/timeline_feedbox_icon_read_blue.png");
				
	    		//任務完成
	    		if(s_obj[this_ei].ik){
	    			var tp = this_event.data("timeline-tp");
	    			var task_str;
	    			console.debug("投票id",this_event.data("timeline-tp"));
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
	    			
	    			this_event.find(".st-task-vote img").attr("src","images/common/icon_check_red_l.png");
					this_event.find(".st-task-status").html(task_str);
	    		}

			}

			//存回
			this_event.data("event-status",s_obj);
    	});
	}
	
	mathAlignCenter = function (outer,inner){
		return (outer-inner)/2;
	}
	
	//拆成detail及timeline list版 並做 html entities 和 url a tag
	timelineContentFormat = function (c,limit,ei){
		console.log("~~~~~~~~~~~~~~~~~~~~~~~~~");
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

	htmlFormat = function (str){
        str = str.replace(/\n/g," \n ").split(" ");
        $.each(str,function(i,val){
            if(val.substring(0, 7) == 'http://' || val.substring(0, 8) == 'https://'){
                encode_val = "<a href=\"" + encodeHtmlEntity(val) + "\" target=\"_blank\">" + encodeHtmlEntity(val) + "</a>";
            }else{
                encode_val = encodeHtmlEntity(val);
            }
            if(encode_val) str.splice(i,1,encode_val);
        });

        return str.join(" ");

    }

	urlFormat2 = function (str){
        str = str.replace(/\n|\r/g," <br/> ").split(" ");
        $.each(str,function(i,val){
        	if(val.substring(0, 7) == 'http://' || val.substring(0, 8) == 'https://'){
                str.splice(i,1,"<a href=\"" + val + "\" target=\"_blank\">" + val + "</a>");
            }
        });

    	return str.join(" ");

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
		
		//結束時間檢查
		var end_time_chk = false;

		//需要記共有幾張圖片
		var gallery_arr = [];

		$.each(ml,function(i,val){
			//有附檔 開啟附檔區域 not_attach_type_arr是判斷不開啟附檔 設定在init.js
			if($.inArray(val.tp,not_attach_type_arr) < 0 && !this_event.find(".st-sub-box-2-attach-area").is(":visible")){
				this_event.find(".st-sub-box-2-attach-area").show();
			}
			
			//更改網址成連結 
			var c = timelineContentFormat(val.c,content_limit);
			//內容格式
			switch(val.tp){
				case 0://文字
					this_event.find(target_div).show();
					this_event.find(target_div).html(c[0]);
					this_event.find(target_div + "-detail").html(c[1]);
					break;
				case 1://網址 寫在附檔區域中
					this_event.find(".st-attach-url").show();
					this_event.find(".st-attach-url-img img").attr("src",val.i);
					
					//圖片滿版
					var w = this_event.find(".st-attach-url-img img").width();
					var h = this_event.find(".st-attach-url-img img").height();
					mathAvatarPos(this_event.find(".st-attach-url-img img"),w,h,0,360);
					
					this_event.find(".st-attach-url-title").html(val.t);
					this_event.find(".st-attach-url-desc").html(val.d);
					break;
				case 2:
					this_event.find(".st-attach-url").show();
					this_event.find(".st-attach-url-img img").attr("src",val.i);
					this_event.find(".st-attach-url-img img").css("width","100%");
					
					//圖片滿版
					var w = this_event.find(".st-attach-url-img img").width();
					var h = this_event.find(".st-attach-url-img img").height();
					mathAvatarPos(this_event.find(".st-attach-url-img img"),w,h,0,360);
					
					this_event.find(".st-attach-url-title").html(val.t);
					this_event.find(".st-attach-url-desc").html(val.d);
					break;
				case 3:
					this_event.find(".st-attach-url").show();
					this_event.find(".st-attach-url-title").hide();
					this_event.find(".st-attach-url-desc").hide();
					
					this_event.find(".st-attach-url-img img").attr("src",val.c);
					
					//圖片滿版
					var w = this_event.find(".st-attach-url-img img").width();
					var h = this_event.find(".st-attach-url-img img").height();
					mathAvatarPos(this_event.find(".st-attach-url-img img"),w,h,0,360);
					break;
				case 4:
					break;
				case 6://圖片
					this_event.find(".st-attach-img").show();
					//.st-attach-img-arrow-l,.st-attach-img-arrow-r

					//必須要知道總共有幾張圖片
					gallery_arr.push(val);

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
				case 14:
					end_time_chk = true;
					break;
			};
			
			//需要填入結束時間 以及 結束時間存在 就填入
			if(end_time_chk && val.e){
				
    			var time = new Date(val.e);
        		var time_format = time.customFormat( "#MM#/#DD# #CD# #hhh#:#mm#" );


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
		});

		//若有圖片 則呼叫函式處理
		if(gallery_arr.length > 0) timelineGalleryMake(this_event,gallery_arr);
	}



	timelineGalleryMake = function (this_event,gallery_arr){
		// console.debug(this_event.data("event-id")+"  "+"gallery:",gallery_arr);
		// console.debug("gallery length:",gallery_arr.length);

		var this_gallery = this_event.find(".st-attach-img");
		//記錄圖片張數 以計算位移
 		this_gallery.data("gallery-cnt",0);

 		//檢查移動是否完成
 		this_gallery.data("gallery-move-chk",true);

		$.each(gallery_arr,function(i,val){

			//getS3file(val.c);

			var this_img = $(
				'<div class="st-slide-img">' +
	            	'<img src="images/loading.gif" style="width:30px;position: relative;top: 130px;"/>' +
	            '</div>' +
	            '<span class="st-img-gap"></span>'
			);
			this_event.find(".st-attach-img-area").prepend(this_img);

			getS3file(val,gi,this_img,6);
	            
		});
		
		//gallery 移動事件
		var this_gallery = this_event.find(".st-attach-img");
		this_gallery.mouseover(function(){
			if(gallery_arr.length > 1){
				this_gallery.find(".st-attach-img-arrow-l, .st-attach-img-arrow-r").show();
			}
		});

		this_gallery.mouseout(function(){
			this_gallery.find(".st-attach-img-arrow-l, .st-attach-img-arrow-r").hide();
		});
		
		this_gallery.find(".st-attach-img-arrow-r").click(function(){

			//判斷可否移動
			if(this_gallery.data("gallery-move-chk")){
				this_gallery.data("gallery-move-chk",false);
			}else{
				return false;
			}

			var gallery_cnt = this_gallery.data("gallery-cnt");//gallery_movement
			gallery_cnt += 1;
			
			//右移 若超過總共張數 就左移到第一張
			if(gallery_cnt >= gallery_arr.length){
				gallery_cnt = 0;
				var movement = {'left':'+=' + gallery_movement*(gallery_arr.length-1) + 'px'};
			}else{
				var movement = {'left':'-=' + gallery_movement + 'px'};
			}

			//開始移動
			this_gallery.find(".st-slide-img").animate(movement,function(){
				this_gallery.data("gallery-cnt",gallery_cnt);
				this_gallery.data("gallery-move-chk",true);
			});
		});

		this_gallery.find(".st-attach-img-arrow-l").click(function(){

			//判斷可否移動
			if(this_gallery.data("gallery-move-chk")){
				this_gallery.data("gallery-move-chk",false);
			}else{
				return false;
			}

			var gallery_cnt = this_gallery.data("gallery-cnt");//gallery_movement
			gallery_cnt -= 1;
			
			//左移 若小於第一張 就右移到最後一張
			if(gallery_cnt < 0){
				gallery_cnt = gallery_arr.length-1;
				var movement = {'left':'-=' + gallery_movement*(gallery_arr.length-1) + 'px'};
			}else{
				var movement = {'left':'+=' + gallery_movement + 'px'};
			}

			//移動
			this_gallery.find(".st-slide-img").animate(movement,function(){
				this_gallery.data("gallery-cnt",gallery_cnt);
				this_gallery.data("gallery-move-chk",true);
			});
		});

	}

	getS3file = function(file_obj,gi,target,tp){
		var api_name = "groups/" + gi + "/files/" + file_obj.c + "?pi=" + file_obj.p;

        var headers = {
                 "ui":ui,
                 "at":at, 
                 "li":"zh_TW",
                     };
        var method = "get";

        var result = ajaxDo(api_name,headers,method,true);
		result.complete(function(data){
			var obj =$.parseJSON(data.responseText);
			if(obj.rsp_code != 0) return false;

			if(target && tp){
				switch(tp){
					case 6://圖片
						var img = target.find("img");
						img.load(function() {

							//重設 style
							target.find("img").removeAttr("style");

							var w = img.width();
				            var h = img.height();
            
            				mathAvatarPos(img,w,h,350);
				        });

						target.find("img").attr("src",obj.s3);
						
						break;
				}
			}else{
				return obj.s3;
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




######## ##     ## ######## ##    ## ########     ######  ########    ###    ######## ##     ##  ######  
##       ##     ## ##       ###   ##    ##       ##    ##    ##      ## ##      ##    ##     ## ##    ## 
##       ##     ## ##       ####  ##    ##       ##          ##     ##   ##     ##    ##     ## ##       
######   ##     ## ######   ## ## ##    ##        ######     ##    ##     ##    ##    ##     ##  ######  
##        ##   ##  ##       ##  ####    ##             ##    ##    #########    ##    ##     ##       ## 
##         ## ##   ##       ##   ###    ##       ##    ##    ##    ##     ##    ##    ##     ## ##    ## 
########    ###    ######## ##    ##    ##        ######     ##    ##     ##    ##     #######   ######  

*/


	putEventStatus = function (target_obj,etp,est){
		var this_event = target_obj.selector;
		var act = target_obj.act;
		var order = target_obj.order;
		var event_status = target_obj.status;

		var api_name = "groups/" + gi + "/timelines/" + ti_feed + "/events/" + this_event.data("event-path");
        // etp: 0(讀取),1(按讚),2(按X),3(按訂閱),4(按置頂),6(是否有行事曆)
        // est: 0(取消),1(執行)
        var headers = {
                 "ui":ui,
                 "at":at, 
                 "li":"zh_TW",
                 "etp":etp,
                 "est":est
                     };
         var method = "put";
                         
        var result = ajaxDo(api_name,headers,method,false);
        result.complete(function(data){
        	var d =$.parseJSON(data.responseText);

        	//做timeline樓主的回覆狀態
        	if(d.rsp_code == 0){
        		//timeline 外層
        		if(event_status){
	        		var count_selector = this_event.find(".st-sub-box-3 div:eq(" + order + ")");
	        		var img_selector = this_event.find(".st-sub-box-3 img:eq(" + order + ")");

	        		//0:取消 1:執行
		        	if(est){
		        		img_selector.attr("src","images/timeline/timeline_feedbox_icon_" + act + "_blue.png")
		        		count_selector.html(count_selector.html()*1+1);
		        	}else{
		        		img_selector.attr("src","images/timeline/timeline_feedbox_icon_" + act + ".png")
		        		count_selector.html(count_selector.html()*1-1);
		        	}

		        	//api成功才存回
			        this_event.data("event-status",event_status);

	        	}else{
	        		//回覆按讚
	        		if(est){
						this_event.find(".st-reply-footer img").attr("src","images/timeline/timeline_feedbox_icon_like_blue.png");
						this_event.find(".st-reply-footer span:eq(1)").html("收回讚");

						var count = this_event.find(".st-reply-footer span:eq(2)").html()*1+1;
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

	        }
        });
        
	}
	//parse 網址
	getLinkMeta = function (this_event,url) {

		// clearTimeout(activityTimeout);
		// activityTimeout = setTimeout(function(){
			var q = 'http://query.yahooapis.com/v1/public/yql?q=' + encodeURIComponent('select * from html where url="' + url + '" and xpath="//img|//title|//head/meta[@property=\'og:image\' or @property=\'og:title\' or @property=\'og:description\' or @name=\'description\' ]" and compat="html5"' ) + '&format=json&callback=?';
			console.debug("url:",q);
			$.ajax({
		        type: 'GET',
		        url: q, 
		        dataType: 'jsonp',
		        success: function(data, textStatus) {
		            var result = {};
		            var tmp_img,tmp_desc;

		            //預設標題
		            if(data.query.results && data.query.results.title){
		            	result.title = data.query.results.title;
		            }
		            console.debug("data:",data.query);
		            //從meta取網址標題 大綱和圖片
		            if(data.query.results && data.query.results.meta){
		            	console.debug("meta:",data.query.results.meta);
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
                        result.description = tmp_desc;
                    }

		            //如果meta圖片存在 並檢查是否圖太小 太小或沒圖的話就從網頁裡的img tag裡面隨便找一張
					if(!result.img){
						//預設圖片 隨便找一張img tag
			            if(data.query.results && data.query.results.img){
		            		$.each(data.query.results.img,function(i,val){
		                        if (val.src && val.src.substring(0, 4) == 'http' && val.src.match(/\.jpg|\.png/)) {

		                            var img = new Image();
									img.onload = function() {
										if((this.width*this.height) > 10000){
											console.log(val.src);
											result.img = val.src;
											$(".cp-yql-img").html("<img src='" + result.img + "'/>"); 
											//return false; 
										}
									}
									img.src = val.src;
		                        }
		                    });
		            	}
					}

	            	if(result.title){
	        			$(".cp-attach-area").show();
						$(".cp-yql-title").html(result.title);
						$(".cp-yql-desc").html(result.description);
						if(result.img) $(".cp-yql-img").html("<img src='" + result.img + "'/>");  
						$(".cp-ta-yql").fadeIn();
					}

	            	this_event.data("message-list").push(1);

	            	result.url = url;
	            	this_event.data("url-content",result);
	    	    }
	    	});
		// });
	}
	
	//parse Youtube
	getLinkYoutube = function (url) {
		clearTimeout(activityTimeout);
		activityTimeout = setTimeout(function(){
				$(".cp-yql-img").html("");
			  	var strpos,result={};
			  	if(url.match(/\?v=/)){
			  		if(url.match(/youtube.com/)){
						strpos = url.indexOf("?v=")+3;
					}else{
						strpos = url.indexOf("youtu.be")+9;
					}
					var youtube_code = url.substring(strpos,strpos+11);
					console.log(youtube_code);
					if(youtube_code.length < 11 || youtube_code.match(/\&/)){
						post_tmp_url = '';
						$(".cp-ta-yql").hide();
						getLinkMeta(url);
						return false;
					}else{
						console.log(youtube_code.length);
					}
					
					$(".cp-yql-title").html("");
					$(".cp-yql-desc").html("");
					$(".cp-yql-img").html(
						'<iframe width="320" height="280" src="//www.youtube.com/embed/'+ youtube_code +'" frameborder="0" allowfullscreen></iframe>'
					);  
					$(".cp-ta-yql").fadeIn();
			  	}else{
			  		post_tmp_url = '';
			  		$(".cp-ta-yql").hide();
			  		getLinkMeta(url);
			  	}
		},1000);
	}


	replySend = function(this_msg){

		var body = {
				"meta" : {
					"lv" : 1,
					"tp" : "10"
				},
				"ml" : [
					{
						"c": this_msg.data("msg-content"),
						"tp": 0
					}
				]
			};

			var api_name = "groups/" + gi + "/timelines/" + ti_feed + "/events?ep=" + this_msg.data("event-id");

	        var headers = {
	                 "ui":ui,
	                 "at":at, 
	                 "li":"zh_TW",
	                     };


	        var method = "post";
	        var result = ajaxDo(api_name,headers,method,true,body);
	        result.complete(function(data){

	        	//重新讀取detail
	        	popupShowAdjust("回覆成功");
	        	//客製化 按了確定之後再重讀取
	        	$(".popup-close").bind("reply",function(){
	        		var this_event;

	        		$(".st-sub-box").each(function(){
	        			this_event = $(this);
						return false;
					});

					if(!this_event) return false;

	        		//重設任務完成狀態
	        		setEventStatus(this_event);

	        		//重設完整的detail
					this_event.data("detail-content",false);
		    		this_event.find(".st-vote-ques-area-div").remove();
		    		// timelineDetailClose toggle負負得正
		    		this_event.find(".st-reply-area").hide();


		      		this_event.find(".st-sub-box-1").trigger("click");
					$(".popup-close").unbind("reply");
				});

				$(".popup-close").click(function(){
					$(this).trigger("reply");
				});
	        });
	}

	reloadDetail = function(){

	};

	    
	  //計算彈出對話框置中
	popupShowAdjust = function (desc,cancel){
		if(!cancel){
			$(".popup-close-cancel").hide();
		}
		
		$(".popup-frame").css("margin-left",0);
	    if(desc){
	        $('.popup-text').html(desc);
	    }
	    $(".popup-screen").show();
	    $(".popup").show();
	    $(".popup-frame").css("margin-left",($(document).width() - $(".popup-frame").width())/2-15);
	    
	}
	
	popupAfterChangePage = function (dest){
		$(".popup-close").bind("pageChange",function(){
			$.mobile.changePage(dest);
			$(".popup-close").unbind("pageChange");
		});
	}
	
	//sha1 and base64 encode
	toSha1Encode = function (string){
		var hash = CryptoJS.SHA1(string);
	    var toBase64 = hash.toString(CryptoJS.enc.Base64);
	    return toBase64;
	}
	
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
	
	//秒數轉成時分秒
	secondsToTime = function (secs)
	{
	    var s_hours = Math.floor(secs / (60 * 60));
	
	    var divisor_for_minutes = secs % (60 * 60);
	    var s_minutes = Math.floor(divisor_for_minutes / 60);
	
	    var divisor_for_seconds = divisor_for_minutes % 60;
	    var s_seconds = Math.ceil(divisor_for_seconds);
	    return s_minutes + ":" + ((s_seconds < 10)?("0" + s_seconds):(s_seconds));
	}

	//轉換html符號
	var encodeHtmlEntity = function(str) {
        if(!str) return false;

        var escape_list = {"10":"<br/>"};
        var buf = [];
        for (var i=str.length-1;i>=0;i--) {
            var char_code = str[i].charCodeAt();
            if(escape_list[char_code]){
                buf.unshift(escape_list[char_code]);
            }else{
                buf.unshift(['&#', char_code, ';'].join(''));
            }
         }
      return buf.join('');
    };

    function decodeHTMLEntities(str) {
		return str.replace(/&#(d+);/g, function(match, dec) {
			return String.fromCharCode(dec);
		});
	};
	
});