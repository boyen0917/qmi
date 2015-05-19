

// var g_bIsPolling = true;

/*
                                ███╗   ███╗███████╗ ██████╗                             
                                ████╗ ████║██╔════╝██╔════╝                             
    █████╗█████╗█████╗█████╗    ██╔████╔██║███████╗██║  ███╗    █████╗█████╗█████╗█████╗
    ╚════╝╚════╝╚════╝╚════╝    ██║╚██╔╝██║╚════██║██║   ██║    ╚════╝╚════╝╚════╝╚════╝
                                ██║ ╚═╝ ██║███████║╚██████╔╝                            
                                ╚═╝     ╚═╝╚══════╝ ╚═════╝                             
                                                                                        */

var g_idb_chat_msgs;	//訊息idb
function initChatDB( onReady ){
	if( null == g_idb_chat_msgs ){
		g_idb_chat_msgs = new IDBStore({
		    dbVersion: 2,
		    storeName: 'chat_msgs',
		    keyPath: 'ei',
		    indexes: [
		    	{ name: 'gi_ci_ct',keyPath:['gi','ci','ct']},
		    ]
		    ,onStoreReady: onReady
	    });
	}
}
function updateChatDB ( msgs ){
  console.debug("-----------------------");
	//indexed from old to new (api chat is from new to old)
	for( var j = 0; j<msgs.length; j++){
		var data = msgs[j];

		// var data = msgs[msgIndex];
		for( var i=0; i<data.el.length; i++){
			var object = data.el[i];
			object.cn = data.cn;
			if(object.hasOwnProperty("meta")){

				//add to db
				var node = {
					gi: data.gi,
					ci: data.ci,
					ei: object.ei,
				    ct: object.meta.ct,
				    data: object
				};
				//write msg to db
				var tmp = g_idb_chat_msgs.put( node, function(ei){
					onSucc(msgs, ei, object);
				});
				// tmp.onabort = onSucc;
				// tmp.onerror = onSucc;
				// tmp.oncomplete = onSucc;
				// tmp.onsuccess = onSucc;

				cns.debug("[updateChatDB]",data.gi,data.ci,object.ei,object.ml[0].c);
			}
		}
	}
}	//end of updateChat

function onSucc(msgs, eiTmp, object){
	var object;
	for( var j = 0; j<msgs.length; j++){
		var data = msgs[j];
		for( var i=0; i<data.el.length; i++){
			object = data.el[i];
			if(object.ei==eiTmp){
				break;
			}
		}
	}
	if(!object){
		cns.debug("ei no match", ei);
		return;
	}
	var giTmp = data.gi;
	var ciTmp = data.ci;
	cns.debug(object.ei);
	var isRoomOpen = false;
	/* 更新聊天室訊息 */
	// showMsg( object, false );
	if( null != windowList ){
		if( windowList.hasOwnProperty(giTmp) 
			&& null != windowList[giTmp] 
			&& false==windowList[giTmp].closed ){
			isRoomOpen = true;
			windowList[ciTmp].g_msgTmp = data.el;
			$(windowList[ciTmp].document).find("button.pollingMsg").attr("data-ei",object.ei).trigger("click");
		} else {
			cns.debug("room ", ciTmp, " not opened");
		}
	}

	/* 更新聊天室列表最後訊息 */
	if( typeof( updateLastMsg ) != 'undefined' ){
		updateLastMsg( giTmp, ciTmp, isRoomOpen, object.ei );
	}
}

/*
              ███╗   ███╗███████╗ ██████╗      ██████╗ ██████╗ ██╗   ██╗███╗   ██╗████████╗          
              ████╗ ████║██╔════╝██╔════╝     ██╔════╝██╔═══██╗██║   ██║████╗  ██║╚══██╔══╝          
    █████╗    ██╔████╔██║███████╗██║  ███╗    ██║     ██║   ██║██║   ██║██╔██╗ ██║   ██║       █████╗
    ╚════╝    ██║╚██╔╝██║╚════██║██║   ██║    ██║     ██║   ██║██║   ██║██║╚██╗██║   ██║       ╚════╝
              ██║ ╚═╝ ██║███████║╚██████╔╝    ╚██████╗╚██████╔╝╚██████╔╝██║ ╚████║   ██║             
              ╚═╝     ╚═╝╚══════╝ ╚═════╝      ╚═════╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═══╝   ╚═╝             
                                                                                                     */

var g_idb_chat_cnts;	//訊息未讀數idb
/*
init chat cnt db
*/
function initChatCntDB ( onReady ){
	// if( null == g_idb_chat_cnts ){
	// 	g_idb_chat_cnts = new IDBStore({
	// 	    dbVersion: 1,
	// 	    storeName: 'chat_cnts',
	// 	    keyPath: 'ts', 
	// 	    indexes: [
	// 	    	{ name: 'gi_ci_ts',keyPath:['gi','ci','ts']},
	// 	    ]
	// 	    ,onStoreReady: onReady
	//     });
	// }
	if(onReady) onReady();
}

/* save chat cnt into db */
function updateChatCnt ( ccs ){
	var storage = $.lStorage(ui);

	//indexed from old to new (api chat is from new to old)
	for( var ccsIndex=0; ccsIndex<ccs.length; ccsIndex++){
		var data = ccs[ccsIndex];
		var giTmp = data.gi;
		if( null==storage[giTmp] )	storage[giTmp] = new Object();
		if( null==storage[giTmp].chatAll )	storage[giTmp].chatAll = new Object();
		if( null==storage[giTmp].chatAll[data.ci] )	storage[giTmp].chatAll[data.ci] = new Object();

		// data.cc.sort(function(a,b){
		// 	if(a.key >= b.key )	return 1;
		// 	return -1;
		// });

		var cntContent = new Object();
		for( var i=0; i<data.cc.length; i++){
			// cns.debug( data.cc[i].ts, data.cc[i].cnt );
			cntContent[i] = data.cc[i];
		}
		
		storage[giTmp].chatAll[data.ci].cnt = cntContent;
	}
	$.lStorage(ui, storage);
	// cns.debug( JSON.stringify($.lStorage(ui)) );


	if( typeof(windowList)!='undefined' && null != windowList ){
		for( var ccsIndex=0; ccsIndex<ccs.length; ccsIndex++){
			var data = ccs[ccsIndex];
			if( null != windowList[data.ci] 
				&& false==windowList[data.ci].closed ){
				$(windowList[data.ci].document).find("button.pollingCnt").trigger("click");
			}
		}
	}
}