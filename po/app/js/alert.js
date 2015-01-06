var lastAlertCt = 0;
var lastCnt = 0;

$(function(){
	initAlertDB();
	// updateAlert();

	$(".navi-alert").click(function(){
		$(".navi-alert").removeClass("new");

		//nodeJS用, show程式小icon上面的數字
		try{
			require('nw.gui').Window.get().setBadgeLabel("");
		}catch(e){
			cns.debug(e);	//必加, 一般瀏覽器require not defined
		}

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
      dbVersion: 1,
      storeName: 'alert_events',
      keyPath: 'ei_ntp',
      indexes: [
        { name: 'ct',keyPath:['ct']}
      ],
      onStoreReady: function(){
      	// showAlertFromDB();
      	updateAlert();
		// setInterval(updateAlert,update_alert_interval);
      }
    });
}

showNewAlertIcon = function( cnt ){
	if( cnt != lastCnt ){

		lastCnt = cnt;

		//關閉的話只顯示new icon
		//若鈴鐺已開啟, 程式icon不更新數量, 並直接通知server已讀, 並卷回最上面
		if( !$(".alert-area").is(":visible") ){
			$(".navi-alert").addClass("new");

			//nodeJS用, show程式小icon上面的數字
			try{
				require('nw.gui').Window.get().setBadgeLabel( cnt.toString() );
			}catch(e){
				// cns.debug(e);	//必加, 一般瀏覽器require not defined
			}
		} else { //開啟的話直接更新
			$(".alert-area").scrollTop(0);
			if( typeof(updatePollingCnts)!= 'undefined' ){
				lastCnt = 0;
				updatePollingCnts( $("<div></div>"), "G3" );
			}
			updateAlert();
		}
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
	if( typeof(updatePollingCnts)!= 'undefined' ){
		lastCnt = 0;
		updatePollingCnts( $("<div></div>"), "G3" );
	}
    		
	updateAlert();
	$(".alert").addClass("alert-click");
	$(".alert-area").slideDown();
	$(".alert-area-cover").show();
	setTimeout(function(){
		$(".alert").addClass("alert-visit");
	},100);
}

//撈ＤＢ通知
showAlertFromDB = function(){

	idb_alert_events.limit(function(list){
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
            // console.debug("onEnd:",result);
        },
        onError: function(result){
            // console.debug("onError:",result);
        }
    });
}

//打ＡＰＩ更新通知
updateAlert = function(){
	if (typeof ui === 'undefined') return;
	
	ajaxDo("/notices", {
	    "ui":ui,
	    "at":at, 
	    "li":lang,
	    }, "get", false, null).complete(function(data){
	    	if( data.status==200){

	    		var returnData = $.parseJSON(data.responseText);

	    		showAlertContent(returnData.nl);

	   //  		var lastCt = 0;
				// for(var i=0; i<returnData.nl.length; i++){
				// 	var boxData = returnData.nl[i];

				// 	//預防舊版的打進來
				// 	if( !boxData || !boxData.hasOwnProperty("nd") ) return;
	    			
	   //  			var node = {
	   //  				ei_ntp: boxData.nd.ei+"_"+boxData.ntp,
				// 		ct: boxData.nd.ct,
				// 	    data: boxData
				// 	};
				// 	if( boxData.nd.ct>lastCt ){
				// 		lastCt = boxData.nd.ct;
				// 	}

				// 	idb_alert_events.put(node);
				// }

				// if( lastCt>lastAlertCt ){
				// 	// cns.debug("showAlertFromDB",lastAlertCt, lastCt);
				// 	lastAlertCt = lastCt;
				// 	setTimeout(showAlertFromDB,500);
				// }

				// // //check "new" mark & update data
				// // if( null!=returnData ){
				// // 	$.lStorage("_alert",returnData);
				// // 	showAlertContent( returnData );
				// // }
	    	}
    });
}

//顯示資料
showAlertContent = function(data){
	if( !data ) return;
	// cns.debug("showAlertContent");

	// $(".alert-area .content").hide('fast');
	$('<div>').load('layout/alert_subbox.html .al-subbox',function(){
		// var tmpContainer = $("<div></div>");
		var tmpContainer = $(".alert-area .content");
		tmpContainer.html("");
		var userData = $.lStorage(ui);
		if( null == userData )	return;

		for(var i=0; i<data.length; i++){
			//預防舊的ＡＰＩ
			if( !data[i].hasOwnProperty("nd") ) continue;

			var boxData = data[i];


			/* ----------- TODO: 檢查是否已show過 ------------ */

			var tmpDiv = $(this).clone();

			tmpContainer.append(tmpDiv);
			group = userData[boxData.gi];
			if( group ){
				//群組名
			    tmp = $(tmpDiv).find(".al-post-group");
			    if( tmp ) tmp.html( group.gn.replaceOriEmojiCode() );
			    // cns.debug( htmlFormat(group.gn) );
			}

		    var content;
			if(boxData.ntp==1){
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

			} else { //回覆
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
			}

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
				for( var j=0; j<boxData.nd.ml.length; j++){
					if( boxData.nd.ml[j].tp==0 && boxData.nd.ml[j].c.length>0 ){
						extra.html( boxData.nd.ml[j].c.replaceOriEmojiCode() );
						extra.css("display","");
						break;
					}
				}
			}

			//動作時間
		    tmp = $(tmpDiv).find(".al-time .text");
		    if( tmp ) tmp.html(new Date(boxData.nd.ct).toFormatString() );

			tmpDiv.data("gi", boxData.gi);
			tmpDiv.data("ei", boxData.nd.ei);
			tmpDiv.click(function(){
				if($(this).find(".al-subbox").data("stop")) {
					$(this).find(".al-subbox").data("stop",false);
					return false;	
				} 

				var this_gi = $(this).data("gi");
				var this_ei = $(this).data("ei");
				
				if( null==this_gi || null==this_ei ) return;

				var group = $.lStorage(ui)[this_gi];
				if( null==group ) return;

				if( null==group.guAll || Object.keys(group.guAll).length == 0){
					cns.debug("no guall",this_gi);
					var data_arr = ["eventDetail",$(this)];
		        	setGroupAllUser(data_arr,this_gi);
		        	return false;
		        }

				hideAlertBox(true);

				$(".alert").removeClass("alert-click");
	    		$(".alert-area").slideUp("fast",function(){
	    			setTimeout(function(){
		    			$.mobile.changePage("#page-timeline-detail", {transition: "slide"});
						eventDetailShow(this_ei);	
					},100);
	    		});
			});

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