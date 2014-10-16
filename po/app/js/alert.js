var lastAlertCt = 0;

$(function(){

	initAlertDB();
	// updateAlert();

	$(".navi-alert").click(function(){
		
		$(".navi-alert").removeClass("new");

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
      	showAlertFromDB();
		setInterval(updateAlert,update_alert_interval);
      }
    });
}

//隱藏通知區
hideAlertBox = function(){
	$(".alert").removeClass("alert-visit");
	$(".alert-area-cover").hide();
	setTimeout(function(){
	    $(".alert").removeClass("alert-click");
	    $(".alert-area").slideUp();
	},100);
}

//show通知區
showAlertBox = function(){
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
            console.debug("onEnd:",result);
        },
        onError: function(result){
            console.debug("onError:",result);
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

	    		var lastCt = 0;
				for(var i=0; i<returnData.nl.length; i++){
					var boxData = returnData.nl[i];
	    			var node = {
	    				ei_ntp: boxData.nd.ei+"_"+boxData.ntp,
						ct: boxData.nd.ct,
					    data: boxData
					};
					if( boxData.nd.ct>lastCt ){
						lastCt = boxData.nd.ct;
					}

					idb_alert_events.put(node);
				}

				if( lastCt>lastAlertCt ){
					// cns.debug("showAlertFromDB",lastAlertCt, lastCt);
					lastAlertCt = lastCt;
					if( !$(".alert-area").is(":visible") ){
						$(".navi-alert").addClass("new");
					}
					setTimeout(showAlertFromDB,500);
				}



				// //check "new" mark & update data
				// if( null!=returnData ){
				// 	$.lStorage("_alert",returnData);
				// 	showAlertContent( returnData );
				// }
	    	}
    });
}

//顯示資料
showAlertContent = function(data){
	if( !data ) return;
	// cns.debug("showAlertContent");

	$(".alert-area .content").html("");

	$('<div>').load('layout/alert_subbox.html .al-subbox',function(){
		var userData = $.lStorage(ui);
		if( null == userData )	return;

		for(var i=0; i<data.length; i++){
			var boxData = data[i].data;
			var tmpDiv = $(this).clone();

			$(".alert-area .content").append(tmpDiv);
			group = userData[boxData.gi];
			if( group ){
				//群組名
			    tmp = $(tmpDiv).find(".al-post-group");
			    if( tmp ) tmp.html( group.gn.replaceOriEmojiCode() );
			    cns.debug( htmlFormat(group.gn) );
			}

		    var content;
			if(boxData.ntp==1){
				//xx(發布者 名)
			    tmp = $(tmpDiv).find(".al-post-name");
			    if( tmp ) tmp.html( boxData.nd.opgun.replaceOriEmojiCode() );

				//發佈xx
				content = $(tmpDiv).find(".al-content.post");

				if( group ){
					//發布者 照片
				    var tmp = $(tmpDiv).find(".al-post-img");
				    if( tmp && group.hasOwnProperty("guAll") && group.guAll.hasOwnProperty(boxData.nd.opgu) ){
				    	var auo = group.guAll[boxData.nd.opgu].auo;
				    	if(auo){
				    		tmp.css("background-image","url("+auo+")");
				    	}
				    }
				}

			} else { //回覆
				//xx(及其他xx個人)
			    tmp = $(tmpDiv).find(".al-post-name");
			    if( tmp && boxData.lgun){
			    	tmp.html( boxData.lgun.replaceOriEmojiCode() );
			    	if(boxData.rcnt>1){
			    		tmpDiv.find(".posterDetail").css("display","inline-block");
			    		tmpDiv.find(".otherPosterCnt").html( $.i18n.getString("otherNPeople",boxData.rcnt-1) );
			    	}
			    }

				//"回覆"xxx的xx『xxx』
				content = $(tmpDiv).find(".al-content.response");

				//回覆"xxx"的xx『xxx』
				content.find(".oriPoster").html(
					getPosterText(group, boxData)
				);

				if( group ){
					//發布者 照片
				    var tmp = $(tmpDiv).find(".al-post-img");
				    if( tmp && group.hasOwnProperty("guAll") && group.guAll.hasOwnProperty(boxData.lgu) ){
				    	var auo = group.guAll[boxData.lgu].auo;
				    	if(auo){
				    		tmp.css("background-image","url("+auo+")");
				    	}
				    }
				}
			}

			if( boxData.nd.hasOwnProperty("et") && boxData.nd.et.length>0 ){
				$(content).find(".boxTitle").html( getEventTitleText(boxData.nd.et) ).css("display","inline-block");
			}
				
			$(content).find(".type").html( getEventTypeText(boxData.nd.etp) );
			$(content).find(".icon").attr( "src", getEventTypeIcon(boxData.nd.etp) );


			if(content){
			    content.css("display","block");

			    //並上傳了檔案
			    if( boxData.nd.hasOwnProperty("ml") ){
					for( var j=0; j<boxData.nd.ml.length; j++){
						if( boxData.nd.ml[j].tp!=0 ){
							content.find('.detail').css("display","inline-block");
							break;
						}
					}
			    }
			}

			//內容
		    var extra = $(tmpDiv).find(".al-extra");
			extra.css("display","none");
			if( boxData.nd.hasOwnProperty("ml") ){
				for( var j=0; j<boxData.nd.ml.length; j++){
					if( boxData.nd.ml[j].tp==0 ){
						extra.html( boxData.nd.ml[j].c.replaceOriEmojiCode() );
						extra.css("display","block");
						break;
					}
				}
			}

			//動作時間
		    tmp = $(tmpDiv).find(".al-time .text");
		    if( tmp ) tmp.html(new Date(boxData.nd.ct).toFormatString() );

			tmpDiv.data("gi", boxData.nd.gi);
			tmpDiv.data("ei", boxData.nd.ei);
			$(tmpDiv).click(function(){
				alert( "gi:"+$(this).data("gi")+", ei:"+$(this).data("ei") );
			});

			//取代中文
			tmpDiv.find('.text').each( function(){
				var tmp = $(this).data("textid");
				var text = $(this)._t( tmp );
			});

			// $(".alert-area .content").append(tmpDiv);
		}
	});
}

getPosterText = function(group, data){
	//最後回覆者==自己
	if( data.lgu==data.nd.opgu ){
		return $.i18n.getString("one'sSelf");
	}
	//最後回覆者==你
	if(group && group.gu==data.opgu) return $.i18n.getString("you");
	return data.nd.opgun.replaceOriEmojiCode();
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
			return $.i18n.getString("msgPost");
			break;
		case "1":
			return $.i18n.getString("announcement");
			break;
		case "2":
			return $.i18n.getString("feedback");
			break;
		case "3":
			return $.i18n.getString("work");
			break;
		case "4":
			return $.i18n.getString("vote");
			break;
		case "5":
			return $.i18n.getString("positionCheck");
			break;
		case "6":
			return $.i18n.getString("calender");
			break;
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
		return $.i18n.getString( "formatTitle", data.replaceOriEmojiCode() );
	}
	return "";
}