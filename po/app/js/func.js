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


	// function detailLikeStringMake(this_event){
	// 	var epl = this_event.data("parti-list");

	// 	//gu gi 是全域
	// 	var me_pos = $.inArray(gu,epl);
		
	// 	var guAll = $.lStorage(ui)[gi].guAll;
 //        var me_gu = guAll[epl[me_pos]];
	// 	var like_str;

 //        this_event.find(".st-reply-like-area").show();
 //        switch(true){
 //        	//陣列空的 隱藏 區域
 //        	case (epl.length == 0) :
 //                this_event.find(".st-reply-like-area").hide();
 //                break;
 //            //你 按讚
 //            case ( typeof me_gu != "undefined" && epl.length == 1 ) :
 //                like_str = "你" + " 按讚";
 //                break;
 //            //林小花 按讚
 //            case ( !me_gu && epl.length == 1 ) :
 //                like_str = guAll[epl[0]].n + " 按讚";
 //                break;
 //            //你、林小花 按讚
 //            case ( typeof me_gu != "undefined" && epl.length == 2 ) :
 //                like_str = "你、 " + (me_pos ? guAll[epl[0]].n : guAll[epl[1]].n) + " 按讚";
 //                break;
 //            //林小花、陳小鳥 按讚
 //            case ( !me_gu && epl.length == 2 ) :
 //                like_str = guAll[epl[0]].n + "、 " + guAll[epl[1]].n + " 按讚";
 //                break;
 //            //你、林小花 及其他？個人按讚
 //            case ( typeof me_gu != "undefined" && epl.length > 2 ) :
 //                like_str =  "你、 " + (me_pos ? guAll[epl[0]].n : guAll[epl[1]].n) + " 及其他 " + (epl.length-2) + " 人按讚";
 //                break;
 //            //林小花、陳小鳥 及其他？個人按讚
 //            case ( !me_gu && epl.length > 2 ) :
 //            	like_str =  guAll[epl[0]].n + "、 " + guAll[epl[1]].n + " 及其他" + (epl.length-2) + "人按讚";
 //                break;
 //        }
        
 //        this_event.find(".st-reply-like-area span").html(like_str);
	// }

	
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
				
				//event種類 不同 讀取不同layout
				switch(val.tp){
					case 0:
						//更改網址成連結
						if(val.c){
							reply_content = urlFormat(val.c);
						}
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


			this_event.find(".st-vote-send").before($('<div>').load('layout/layout.html .st-vote-ques-area',function(){
				var this_ques = $(this);
				
				//設定題目的編號
				this_ques.find(".st-vote-ques-area").data("ques-index",v_val.k);



				// 單選是圈圈
        		var tick_img = "images/common/icon_check_red_round.png";
        		//複選是勾勾
	        	if(v_val.v > 1){
	        		tick_img = "images/common/icon_check_red.png";
				}
				//
				this_ques.find(".st-vote-ques-area").data("vote-multi",v_val.v);
				this_ques.find(".st-vote-ques-area").data("tick-img",tick_img);

				this_ques.find(".st-vote-detail-top span:eq(0)").html(v_i+1);
				this_ques.find(".st-vote-detail-top span:eq(1)").html("每個人限選取"+ v_val.v +"項");
				
				if(v_val.t){
					this_ques.find(".st-vote-detail-desc").show();
					this_ques.find(".st-vote-detail-desc").html(v_val.t);
				}

				$.each(v_val.i,function(i_i,i_val){
					this_ques.find(".st-vote-ques-area").append(
						'<div class="st-vote-detail-option" data-item-index="' + i_val.k + '">' +
					        '<img src="images/common/icon_check_round_white.png"/>' +
					        '<span>' + i_val.o + '</span>' +
					        '<span>' + 0 + '</span>' +
					    '</div>'
					);
					
					setTimeout(function(){
						var center_pos = mathAlignCenter(this_ques.find(".st-vote-detail-option").height(),this_ques.find(".st-vote-detail-option img").height());
						this_ques.find(".st-vote-detail-option img").css("top",center_pos + "px");
					},100);
					
					
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
		console.log(vote_obj);
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

		        	//設定複選投票數為 0
		        	this_ques.data("multi-count",0);

            		//題目的編號 和 答案的編號相同 而且 有投票的內容(可能 "i": [])
            		if(k_val.k == this_ques.data("ques-index") && k_val.i){
            			//答案的多個投票
	            		$.each(k_val.i,function(i_i,i_val){

	            			//最後一個 每個選項的k
	            			$.each(this_ques.find(".st-vote-detail-option"),function(opt_i,opt_val){
	            				var this_option = $(this);
	    						if($(this).data("item-index") == i_val.k){
	    							var count = $(this).find("span:eq(1)").html();
	    							$(this).find("span:eq(1)").html(count*1+1);
	    							
	    							//自己投的 要打勾
					            	if(ans_gu == gu){
					            		$(this).data("vote-chk",true);
					            		$(this).find("img").attr("src",this_ques.data("tick-img"));
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
		this_event.find(".st-vote-detail-option").click(function(){

			var this_ques = $(this).parent();
			var this_opt = $(this);

			//該選項的總計數 單選復選都適用
			var opt_cnt = this_opt.find("span:eq(1)").html()*1;
			//複選
			if(this_ques.data("vote-multi") > 1){

				//復選的已選計數
				var cnt = this_ques.data("multi-count");
				//復選的情況就要判斷該選項是否已選擇
				if(this_opt.data("vote-chk")){
					this_opt.data("vote-chk",false);
					this_opt.find("img").attr("src","images/common/icon_check_round_white.png");

					//該項總計減一
					
					opt_cnt -= 1;

					//減一 統計複選票數 才能計算是否達複選上限
					this_ques.data("multi-count",cnt-1);

				//沒選變已選 投票數未達上限
				}else if(cnt <  this_ques.data("vote-multi")){

					this_opt.data("vote-chk",true);
					this_opt.find("img").attr("src",this_ques.data("tick-img"));

					//加一 統計複選票數 才能計算是否達複選上限
					this_ques.data("multi-count",cnt+1);

					//該項總計加一
					opt_cnt += 1;
				}

			//單選
			}else{
				//找出點選的那一項要減一
				$.each(this_ques.find(".st-vote-detail-option"),function(i,val){
					if($(this).data("vote-chk")){
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

				this_opt.data("vote-chk",true);
				this_opt.find("img").attr("src",this_ques.data("tick-img"));


				//該項總計加一
				opt_cnt += 1;
			}

			//單選復選都加一 更改票數
			this_opt.find("span:eq(1)").html(opt_cnt);
		})
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

	composeSend = function (this_event){

		var ctp = this_event.data("compose-tp");
		var compose_content = this_event.data("compose-content");
		var ml = this_event.data("message-list");
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
		switch(ctp){
			//普通貼文
			case 0:
				break;
			//公告
			case 1:
				body.meta.tt = this_event.data("compose-title");
				break;
			//通報
			case 2:
				break;
			//任務 工作
			case 3:
				break;
			//任務 投票
			case 4:
				break;
			//任務 定點回報
			case 5:
				break;
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
		$.each(ml,function(i,mtp){
			var obj = {};

			switch(mtp){
				//普通貼文
				case 0:
					obj.c = compose_content;
					break;
				//一般網站url
				case 1:
					var url_content = this_event.data("url-content");
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

			obj.tp = mtp;

			body.ml.push(obj);
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
	    	
	        //每次讀取timeline時 順便重新設定permission  後面不做了
	    	if(permission){
	    		permissionControl(group_list);
	    		return false;
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
	        		this_event.find(".st-sub-box-1-footer").html(val.ei + "  " + val.meta.tp);
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

					

		        	//這邊是timeline list 要call這個api判斷 自己有沒有讚過這一串系列文 
					var api_name = "groups/" + gi + "/timelines/" + ti_feed + "/events_status?ep=" + val.ei;
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
			        		if(s_obj[val.ei].il){
		        				this_event.find(".st-sub-box-3 img:eq(0)").attr("src","images/timeline/timeline_feedbox_icon_like_blue.png");
								this_event.find(".st-sub-box-4 .st-like-btn").html("收回讚");
				    		}
			    			//回覆
				    		if(s_obj[val.ei].ip)
				    				this_event.find(".st-sub-box-3 img:eq(1)").attr("src","images/timeline/timeline_feedbox_icon_chat_blue.png");
				    				
			    			//閱讀
				    		if(s_obj[val.ei].ir)
				    				this_event.find(".st-sub-box-3 img:eq(2)").attr("src","images/timeline/timeline_feedbox_icon_read_blue.png");
		    				
						}

						//存回
						this_event.data("event-status",s_obj);
			    	});
	        		
	        		
	        		var category;
	        		
	        		switch(tp){
	        			//貼文
	        			case 0:
	        				//$(this).find(".st-sub-box-2").html(box_content);
	        	    		//不知道要幹嘛
	        				//$(this).find(".st-sub-box-2").attr("data-st-cnt",i);
	        				this_event.find(".st-sub-box-2-more").hide();
	        				//timeline內容
	        				
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
	        				break;
	        			case 5:
	        				this_event.find(".st-box2-more-category").addClass("st-box2-more-category-task");
	        				category = "任務<img src=\"images/task/timeline_task_icon_task_checkin.png\"> <span>定點回報</span>";
	        				
	        				//任務狀態
	        				this_event.find(".st-box2-more-task-area").show();
	        				this_event.find(".st-box2-more-time").show();
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
	
	mathAlignCenter = function (outer,inner){
		return (outer-inner)/2;
	}
	
	//目前是先做url判斷
	timelineContentFormat = function (c,limit,ei){

		if(!c){
			return false;
		}
		
		
		var result_str = [];
		result_str[0] = c.substring(0,limit).split(" ");
		result_str[1] = c
		
		for(n=0;n<2;n++){
			if(n == 0){
				result_str[n] = c.substring(0,limit);
			}else{
				result_str[n] = c;
			}

			result_str[n] = urlFormat(result_str[n]);
	    	
		}
		
		if(c.length > limit){
			result_str[0] += "...";
		}

    	return result_str;
	}

	urlFormat = function (str){
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
				case 5:
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
			};
			
			//結束時間存在 就填入
			if(val.e){
				
    			var time = new Date(val.e);
        		var time_format = time.customFormat( "#MM#/#DD# #CD# #hhh#:#mm#" );
    		}else{
    			var time_format = "無結束時間";
    		}
			this_event.find(".st-box2-more-time span").html(time_format);
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
	        		console.log(": reply :");
	        		console.log("est : " + est);
	        		console.log("this_event : ");
	        		console.log(this_event);
	        		if(this_event.find(".st-reply-footer img").is(":visible")){
	        			console.log("has img : yes");
	        		}else{
	        			console.log("has img : nope");
	        		}
	        		console.log("ori count : " + this_event.find(".st-reply-footer span:eq(2)").html());
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
		            
		            //從meta取網址標題 大綱和圖片
		            if(data.query.results && data.query.results.meta){
		            	$.each(data.query.results.meta, function(key, val){
		                    if (val.content) {

		                    	// title
		                    	if (val.property.match(/og:title/i)) {
		                            result.title = val.content;
		                        }
		                    	
		                        // description
		                        if (val.property.match(/og:description/i)) {
		                            result.description = val.content;
		                        }

		                        if (val.name && val.name.match(/description/i)) {
		                            tmp_desc = val.content;
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
	
});