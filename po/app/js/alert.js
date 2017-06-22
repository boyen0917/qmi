var lastAlertCt = 0;
var lastCnt = 0;

$(function(){
	initAlertDB();
	// updateAlert();

	$("#page-group-main .navi-alert").click(function(){
		// $(this).removeClass("new");
		// clearBadgeLabel();

		if($(".alert-area").is(":visible")){
			hideAlertBox();
		}else{
			showAlertBox();
		}
		
	});

	$(".alert-area-cover").click(function(){
		$(".navi-alert").trigger("click");
	});
});

//init global alert db
initAlertDB = function(){
	idb_alert_events = new IDBStore({
    	dbVersion: 2,
    	storeName: 'alert_events',
    	keyPath: 'ei_ntp',
    	autoIncrement: false,
    	indexes: [
    	  { name: 'ei_ntp',keyPath:['ei','ntp']}
    	],
    	onStoreReady: function(){
			if( !$.lStorage("alert_db_updated") ){
				idb_alert_events.clear();
				$.lStorage("alert_db_updated",true);
			}
	      	// showAlertFromDB();
	      	// updateAlert();
			// setInterval(updateAlert,update_alert_interval);
    	}
    });
}

showNewAlertIcon = function( cnt ){
	if( cnt > 0 ){
		//大於0程式icon和鈴鐺旁邊顯示數字
		$(".navi-alert").addClass("new").attr("data-count", cnt);
		setBadgeLabel( cnt.toString() );

		//關閉的話只顯示new icon
		//若鈴鐺已開啟, 程式icon不更新數量, 並直接通知server已讀, 並卷回最上面
		
		if( $(".alert-area").is(":visible") ){ //開啟的話直接更新
			
			$(".alert-area").scrollTop(0);
			// if( typeof(updatePollingCnts)!= 'undefined' ){
			// 	lastCnt = 0;
			// 	updatePollingCnts( $("<div></div>"), "G3" );
			// }
			updateAlert();
		} 
		
	} else {
		$(".navi-alert").removeClass("new");
		clearBadgeLabel();
	}

}

//隱藏通知區
hideAlertBox = function(detail){
	$(".alert").removeClass("alert-visit");
	$(".alert-area-cover").hide();

	if(detail) return false;

	setTimeout(function(){
	    $(".alert").removeClass("alert-click");
	    $(".alert-area").slideUp();
	},100);
}

//show通知區
showAlertBox = function(){
	// if( typeof(updatePollingCnts)!= 'undefined' ){
	// 	lastCnt = 0;
	// 	updatePollingCnts( $("<div></div>"), "G3" );
	// }
    		
	// updateAlert();
	$(".alert").addClass("alert-click");

	$("#view-alert").slideDown().find(".content").scrollTop(0);
	$("#view-alert-cover").show();

	setTimeout(function(){
		$(".alert").addClass("alert-visit");
	},100);
}

//撈ＤＢ通知
showAlertFromDB = function(){

	idb_alert_events.getAll(function(list){
		// cns.debug( JSON.stringify(list) );
		showAlertContent(list);
	},{
        index: "ct",
        keyRange: idb_alert_events.makeKeyRange({
          upper: [new Date().getTime()],
          lower: []
        }),
        limit: 20,
        order: "DESC",
        onEnd: function(result){
            // cns.debug("onEnd:",result);
        },
        onError: function(result){
            // cns.debug("onError:",result);
        }
    });
}

//打ＡＰＩ更新通知
updateAlert = function(isFromLogin){
	var noticeListArr = [],
		noticeDefArr = [],

		publicNoticeAjax = new QmiAjax({
			apiName: "notices",
			isPublicApi: true,
			errhide: true,
			complete: function(data){
				if(data.status !== 200) return;

				try {
					noticeListArr = $.parseJSON(data.responseText).nl;
				} catch(e) {
					// do something..
				}
			}
		});

	// 公雲鈴鐺
	noticeDefArr.push(publicNoticeAjax);

	Object.keys(QmiGlobal.companies).reduce(function(arr, currCi) {
		var companyObj = QmiGlobal.companies[currCi];
		// 公雲鈴鐺不打
		if(companyObj.ctp === 0) return arr;
		if(isFromLoginAndLdapExpired()) return arr;
		return arr.concat([currCi]);
	}, []).forEach(function(companyId){
		var ajaxDef = new QmiAjax({
			apiName: "notices",
			ci: companyId,
			complete: function(data){
				if(data.status !== 200) return;

				try {
					var resultNl = $.parseJSON(data.responseText).nl;

					// 私雲辨識用
					resultNl.ci = companyId;
					noticeListArr.push.apply(noticeListArr,resultNl)
				} catch(e) {
					// do something..
				}
			}
		});
		noticeDefArr.push(ajaxDef);
	});


	$.when.apply($,noticeDefArr).done(function(){

		// idb_alert_events.getAll(function(DBData){

			// var DBDataObj = {};
   //  		for( var i=0; i<DBData.length; i++){
   //  			if( DBData[i].isRead )
   //  				DBDataObj[DBData[i].ei+"_"+DBData[i].ntp] = DBData[i].data;
   //  		}
   //  		console.log(noticeListArr);
			// console.log(DBDataObj)

    		for( var i=0; i<noticeListArr.length; i++){
    			try{
    				//ct_ei_ntp
    				var obj = {
						ei: noticeListArr[i].nd.ei,
						ntp: noticeListArr[i].ntp,
						ei_ntp: noticeListArr[i].nd.ei+"_"+noticeListArr[i].ntp,
						data: noticeListArr[i]
					};
	    			var key = noticeListArr[i].nd.ei+"_"+noticeListArr[i].ntp;
	    			//有已讀紀錄, 且ct相同, 表示為同一筆貼文或回文
	    			// if( DBDataObj.hasOwnProperty(key) ){
	    				// if( DBDataObj[key].nd.ct==noticeListArr[i].nd.ct ){
	    				// if (noticeListArr[i].nd.st == 1) {
	    				// 	obj.isRead = true;
	    				// 	noticeListArr[i].isRead = true;
	    				// }
	    			// }
	    			// ary.push(obj);
	    			idb_alert_events.put(obj);
	    		} catch(e){
	    			errorReport(e);
	    		}
    		}

			showAlertContent(noticeListArr);
		// });
	});

	function isFromLoginAndLdapExpired(companyData) {
        if(!isFromLogin) return false;
        if(!companyData) return false;
        if(companyData.et - (new Date().getTime()) < QmiGlobal.ldapExpireTimer) return true;
        return false;
    }
}

//顯示資料
showAlertContent = function(data){
	if(!data||data.length==0){
		$(".alert-area .content").html("<div class='no-msg'>"+ $.i18n.getString("NOTICES_NOMSG_WEB") +"</div>");
		return;
	}
	// cns.debug("showAlertContent");

	// $(".alert-area .content").hide('fast');
	$('<div>').load('layout/alert_subbox.html .al-subbox',function(){
		// var tmpContainer = $("<div></div>");
		var tmpContainer = $(".alert-area .content");
		tmpContainer.html("");
		var userData = QmiGlobal.groups;
		if( null == userData )	return;

		for(var i=0; i<data.length; i++){

			var boxData = data[i];


			/* ----------- TODO: 檢查是否已show過 ------------ */

			var tmpDiv = $(this).clone();

			if( boxData.nd && boxData.nd.st == 1){
				tmpDiv.find(".al-subbox").addClass("isRead");
			}

		    var content;

		    if( boxData.ntp==30 ){

				//團體頭像
				var tmp = $(tmpDiv).find(".al-post-img.namecard");
				if(boxData.gat){
					tmp.css("background-image","url("+boxData.gat+")");
				} else {
					tmp.css("background-image","url(images/common/others/empty_img_all_l.png)");
				}

				tmp = $(tmpDiv).find(".al-post-group");
				if( tmp ) tmp.html( boxData.gn.replaceOriEmojiCode() );

				//邀請者名稱
				tmp = $(tmpDiv).find(".al-post-name");
				if( tmp ) tmp.html( boxData.in.replaceOriEmojiCode() );

				//title
				content = $(tmpDiv).find(".al-content.invite");
				content.show();

				//time
			    tmp = $(tmpDiv).find(".al-time .text");
			    if( tmp ) tmp.html(new Date(boxData.it).toFormatString() );

				//內容
				var extra = $(tmpDiv).find(".al-extra");
				extra.html(boxData.im).show();

		    } else {
				//預防舊的ＡＰＩ
				if( !data[i].hasOwnProperty("nd") ) continue;

				group = userData[boxData.gi];
				if( null==group ) continue;

				//群組名
				tmp = $(tmpDiv).find(".al-post-group");
				if( tmp ) tmp.html( group.gn._escape().replaceOriEmojiCode() );


				switch (boxData.ntp) {
					//貼文
			    	case 1:
			    		//xx(發布者 名)
					    tmp = $(tmpDiv).find(".al-post-name");
					    if( tmp ) tmp.html( boxData.gun.replaceOriEmojiCode() );

						//發佈xx
						content = $(tmpDiv).find(".al-content.post");

						if( group ){
							//發布者 照片
						    var tmp = $(tmpDiv).find(".al-post-img.namecard");
						    if( tmp && group.hasOwnProperty("guAll") && group.guAll.hasOwnProperty(boxData.gu) ){
						    	var auo = group.guAll[boxData.gu].auo;
						    	if(auo){
						    		tmp.css("background-image","url("+auo+")");
						    	}
						    }
						}

			    		break;
			    	case 2:
			    		//xx(及其他xx個人)
					    tmp = $(tmpDiv).find(".al-post-name");
					    if( tmp && boxData.gun){
					    	tmp.html( boxData.gun.replaceOriEmojiCode() );
					    	if(boxData.rcnt>1){
					    		$(tmpDiv).find(".posterDetail").css("display","inline-block");
					    		$(tmpDiv).find(".otherPosterCnt").html( $.i18n.getString("NOTICES_RESPONSER_NUM",boxData.rcnt-1) );
					    	}
					    }

						//"回覆"xxx的xx『xxx』
						content = $(tmpDiv).find(".al-content.response");

						//回覆"xxx的"xx『xxx』
						content.find(".oriPoster").html(
							textSomeonesHtmlFormat( getPosterText(group, boxData) )
						);

						//發布者 照片
						var tmp = $(tmpDiv).find(".al-post-img");
						if( tmp ){
							if( boxData.aurl ){
								tmp.css("background-image","url("+boxData.aurl+")");
							} else if( group && group.hasOwnProperty("guAll") && group.guAll.hasOwnProperty(boxData.gu) ){
								var auo = group.guAll[boxData.gu].auo;
								if(auo){
									tmp.css("background-image","url("+auo+")");
								}
							}
						}

			    		break;

			    	case 3:
			    		console.log(boxData)
			    		//xx(及其他xx個人)
					    tmp = $(tmpDiv).find(".al-post-name");
					    if( tmp && group.guAll && group.guAll[boxData.gu]){
					    	tmp.html(group.guAll[boxData.gu].nk.replaceOriEmojiCode() );
					    }

					    //發佈 tag
					    if (boxData.nd.etp == "10") {
					    	content = $(tmpDiv).find(".al-content.response");
					    } else {
							content = $(tmpDiv).find(".al-content.post");
					    }

					    content.find(".mention-text").show();
						

						// //回覆"xxx的"xx『xxx』
						// content.find(".oriPoster").html(
						// 	textSomeonesHtmlFormat( getPosterText(group, boxData) )
						// );

						//發布者 照片
						var tmp = $(tmpDiv).find(".al-post-img");
						if( tmp ){
							if( boxData.aurl ){
								tmp.css("background-image","url("+boxData.aurl+")");
							} else if( group && group.hasOwnProperty("guAll") && group.guAll.hasOwnProperty(boxData.gu) ){
								var auo = group.guAll[boxData.gu].auo;
								if(auo){
									tmp.css("background-image","url("+auo+")");
								}
							}
						}
			    		break;

			    }

				// if(boxData.ntp==1){ //貼文
				// 	//xx(發布者 名)
				//     tmp = $(tmpDiv).find(".al-post-name");
				//     if( tmp ) tmp.html( boxData.gun.replaceOriEmojiCode() );

				// 	//發佈xx
				// 	content = $(tmpDiv).find(".al-content.post");

				// 	if( group ){
				// 		//發布者 照片
				// 	    var tmp = $(tmpDiv).find(".al-post-img.namecard");
				// 	    if( tmp && group.hasOwnProperty("guAll") && group.guAll.hasOwnProperty(boxData.gu) ){
				// 	    	var auo = group.guAll[boxData.gu].auo;
				// 	    	if(auo){
				// 	    		tmp.css("background-image","url("+auo+")");
				// 	    	}
				// 	    }
				// 	}

				// } else { //回覆
				// 	//xx(及其他xx個人)
				//     tmp = $(tmpDiv).find(".al-post-name");
				//     if( tmp && boxData.gun){
				//     	tmp.html( boxData.gun.replaceOriEmojiCode() );
				//     	if(boxData.rcnt>1){
				//     		$(tmpDiv).find(".posterDetail").css("display","inline-block");
				//     		$(tmpDiv).find(".otherPosterCnt").html( $.i18n.getString("NOTICES_RESPONSER_NUM",boxData.rcnt-1) );
				//     	}
				//     }

				// 	//"回覆"xxx的xx『xxx』
				// 	content = $(tmpDiv).find(".al-content.response");

				// 	//回覆"xxx的"xx『xxx』
				// 	content.find(".oriPoster").html(
				// 		textSomeonesHtmlFormat( getPosterText(group, boxData) )
				// 	);

				// 	//發布者 照片
				// 	var tmp = $(tmpDiv).find(".al-post-img");
				// 	if( tmp ){
				// 		if( boxData.aurl ){
				// 			tmp.css("background-image","url("+boxData.aurl+")");
				// 		} else if( group && group.hasOwnProperty("guAll") && group.guAll.hasOwnProperty(boxData.gu) ){
				// 			var auo = group.guAll[boxData.gu].auo;
				// 			if(auo){
				// 				tmp.css("background-image","url("+auo+")");
				// 			}
				// 		}
				// 	}
				// }

				// if(boxData.ntp==1){ //貼文
				// 	//xx(發布者 名)
				//     tmp = $(tmpDiv).find(".al-post-name");
				//     if( tmp ) tmp.html( boxData.gun.replaceOriEmojiCode() );

				// 	//發佈xx
				// 	content = $(tmpDiv).find(".al-content.post");

				// 	if( group ){
				// 		//發布者 照片
				// 	    var tmp = $(tmpDiv).find(".al-post-img.namecard");
				// 	    if( tmp && group.hasOwnProperty("guAll") && group.guAll.hasOwnProperty(boxData.gu) ){
				// 	    	var auo = group.guAll[boxData.gu].auo;
				// 	    	if(auo){
				// 	    		tmp.css("background-image","url("+auo+")");
				// 	    	}
				// 	    }
				// 	}

				// } else { //回覆
				// 	//xx(及其他xx個人)
				//     tmp = $(tmpDiv).find(".al-post-name");
				//     if( tmp && boxData.gun){
				//     	tmp.html( boxData.gun.replaceOriEmojiCode() );
				//     	if(boxData.rcnt>1){
				//     		$(tmpDiv).find(".posterDetail").css("display","inline-block");
				//     		$(tmpDiv).find(".otherPosterCnt").html( $.i18n.getString("NOTICES_RESPONSER_NUM",boxData.rcnt-1) );
				//     	}
				//     }

				// 	//"回覆"xxx的xx『xxx』
				// 	content = $(tmpDiv).find(".al-content.response");

				// 	//回覆"xxx的"xx『xxx』
				// 	content.find(".oriPoster").html(
				// 		textSomeonesHtmlFormat( getPosterText(group, boxData) )
				// 	);

				// 	//發布者 照片
				// 	var tmp = $(tmpDiv).find(".al-post-img");
				// 	if( tmp ){
				// 		if( boxData.aurl ){
				// 			tmp.css("background-image","url("+boxData.aurl+")");
				// 		} else if( group && group.hasOwnProperty("guAll") && group.guAll.hasOwnProperty(boxData.gu) ){
				// 			var auo = group.guAll[boxData.gu].auo;
				// 			if(auo){
				// 				tmp.css("background-image","url("+auo+")");
				// 			}
				// 		}
				// 	}
				// }

				//event title
				if( boxData.nd.hasOwnProperty("et") && boxData.nd.et.length>0 ){
					$(content).find(".boxTitle").html( getEventTitleText(boxData.nd.et) ).css("display","inline-block");
				}
				
				//event type
				$(content).find(".type").html( getEventTypeText(boxData.nd.etp) );
				$(content).find(".icon").attr( "src", getEventTypeIcon(boxData.nd.etp) );


				if(content){
				    content.css("display","block");

				    //並上傳了檔案
				  //   if( boxData.nd.hasOwnProperty("ml") ){
						// for( var j=0; j<boxData.nd.ml.length; j++){
						// 	if( boxData.nd.ml[j].tp!=0 ){
						// 		setDetailAct( content );
						// 		break;
						// 	}
						// }
				  //   }
				}

				//內容
			    var extra = $(tmpDiv).find(".al-extra");
				extra.css("display","none");
				if( boxData.nd.hasOwnProperty("ml") ){
					var mainContext;
					for( var j=0; j<boxData.nd.ml.length; j++){
						if( boxData.nd.ml[j].tp == 0 && boxData.nd.ml[j].c.length ){
							mainContext = boxData.nd.ml[j].c.replaceOriEmojiCode();
							extra.html( boxData.nd.ml[j].c.replaceOriEmojiCode() );
							extra.css("display","");
							// break;
						} else if (boxData.nd.ml[j].tp == 21) {
							if (typeof(mainContext) == 'string' && mainContext) {
								mainContext = mainContext.qmiTag(boxData.nd.ml[j]);
							}
						}
						extra.html(mainContext);
					}
				}

				tmpDiv.data("gi", boxData.gi);
				tmpDiv.data("ei", boxData.nd.ei);
				tmpDiv.data("ntp", boxData.ntp);
				tmpDiv.click(function(){
					if($(this).find(".al-subbox").data("stop")) {
						$(this).find(".al-subbox").data("stop",false);
						return false;	
					} 

					$(this).find(".al-subbox").addClass("isRead");

					var this_gi = $(this).data("gi");
					var this_ei = $(this).data("ei");
					var this_ntp = $(this).data("ntp");
					// var DBKey = this_ei+"_"+this_ntp;
					// idb_alert_events.get(DBKey, function(data){
					// 	if(!data){
					// 		cns.debug("error");
					// 		return;
					// 	}
					// 	data.isRead = true;
					// 	idb_alert_events.put(data);
					// }, function(data){
					// 	cns.debug(data);
					// });

					if( null==this_gi || null==this_ei ) return;

					var group = QmiGlobal.groups[this_gi];
					if( null==group ) return;

					if( null==group.guAll || Object.keys(group.guAll).length == 0){
						cns.debug("no guall",this_gi);
						var this_alert = $(this);
			        	getGroupComboInit(this_gi).done(function(){
			        		this_alert.trigger("click");
			        	});
			        	return false;
			        }

					hideAlertBox(true);

					$(".alert").removeClass("alert-click");
		    		$(".alert-area").slideUp("fast",function(){
						eventDetailShow(this_ei).done(function(resultObj){
							if(resultObj.isSuccess === false) {
								new QmiGlobal.popup({
									title: $.i18n.getString("USER_PROFILE_NO_DATA"),
									desc: ""
								})
							}
						});	
		    		});
				});

				//動作時間
			    tmp = $(tmpDiv).find(".al-time .text");
			    if( tmp ) tmp.html(new Date(boxData.nd.ct).toFormatString() );
			}

			tmpContainer.append(tmpDiv);

			//取代中文
			tmpDiv._i18n();

			//個人名片
			$(tmpDiv).find(".al-post-img.namecard").data("gu",boxData.gu);
			$(tmpDiv).find(".al-post-img.namecard").data("gi",boxData.gi);

			// $(".alert-area .content").append(tmpDiv);
		}
	});
}

getPosterText = function(group, data){
	//最後回覆者==自己
	if( data.gu==data.ogu ){
		return $.i18n.getString("COMMON_SELF");
	}
	//最後回覆者==你
	if(group && group.gu==data.ogu) return $.i18n.getString("COMMON_YOU");
	return (data.ogun) ? data.ogun.replaceOriEmojiCode() : "unknown";
}

// getTimelineEvent = function( ei, dom, callback ){
// 	idb_timeline_events.get(ei, function(data){
// 		cns.debug(ei);
// 		callback(data, dom);
// 	}, function(data){
// 		cns.debug(ei);
// 		callback(null, ei);
// 	});
// }

getEventTypeText = function(data){
	switch(data.substring(1,2)){
		//(0=訊息,1=公告,2=通報專區,3=任務-工作,4=任務-投票,5=任務-定點回報,6=行事曆)
		case "0":
			return $.i18n.getString("FEED_POST");
			break;
		case "1":
			return $.i18n.getString("FEED_BULLETIN");
			break;
		case "2":
			return $.i18n.getString("FEED_REPORT");
			break;
		case "3":
			return $.i18n.getString("FEED_TASK");
			break;
		case "4":
			return $.i18n.getString("FEED_VOTE");
			break;
		case "5":
			return $.i18n.getString("FEED_LOCATION");
			break;
		// case "6":
		// 	return $.i18n.getString("calender");
		// 	break;
	}
	return "[type "+data+"]";
}

getEventTypeIcon = function(data){
	switch(data.substring(1,2)){
		//(0=訊息,1=公告,2=通報專區,3=任務-工作,4=任務-投票,5=任務-定點回報,6=行事曆)
		case "0":
			return "images/compose/compose_box_bticon_post.png";
			break;
		case "1":
			return "images/compose/compose_box_bticon_announcement.png";
			break;
		case "2":
			return "images/compose/compose_box_bticon_feedback.png";
			break;
		case "3":
			return "images/compose/compose_box_bticon_work.png";
			break;
		case "4":
			return "images/compose/compose_box_bticon_vote.png";
			break;
		case "5":
			return "images/compose/compose_box_bticon_check.png";
			break;
		case "6":
			return "images/compose/compose_box_bticon_post.png";
			break;
	}
	return "";
}

getEventTitleText = function(data){
	if( data ){
		return "『"+data.replaceOriEmojiCode()+"』";
	}
	return "";
}

setDetailAct = function( dom ){
	dom.find('.detail').css("display","inline-block");
	var tmp = dom.find('.sendFile');
	if( tmp ){
		// cns.debug( textAndHtmlFormat( $.i18n.getString("NOTICES_UPLOAD_FILE") ) );
		tmp.html( "<label class='and'>並</label>上傳了檔案" );
	};
}