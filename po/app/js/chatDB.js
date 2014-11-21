

var g_bIsPolling = true;

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
function updateChat ( msgs ){
	//indexed from old to new (api chat is from new to old)
	$.each( msgs, function(msgIndex, data){

		// var data = msgs[msgIndex];
		for( var i=0; i<data.el.length; i++){
			var object = data.el[i];
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
				g_idb_chat_msgs.put( node );
			}
		}

		setTimeout( function(){
			var isRoomOpen = false;
			/* 更新聊天室訊息 */
			// showMsg( object, false );
			if( null != windowList ){
				if( windowList.hasOwnProperty(data.ci) 
					&& null != windowList[data.ci] 
					&& false==windowList[data.ci].closed ){
					isRoomOpen = true;
					windowList[data.ci].g_msgTmp = data.el;
					$(windowList[data.ci].document).find("button.pollingMsg").trigger("click");
				}
			}

			//add unread cnt
			if( !isRoomOpen ){
				var unreadCnt = data.el.length;
				try{
					var userData = $.lStorage(ui);
					g_group = userData[data.gi];
					g_room = g_group["chatAll"][data.ci];
					unreadCnt = ( (g_room.unreadCnt)?g_room.unreadCnt:0 )+unreadCnt;
					g_room.unreadCnt = unreadCnt;
					$.lStorage(ui, userData);
				} catch(e){
					cns.debug(e);
				}
			}

			/* 更新聊天室列表最後訊息 */
			if( typeof( updateLastMsg ) != 'undefined' ){
				updateLastMsg( data.gi, data.ci, isRoomOpen );
			}

		}, 300 );
	});
}	//end of updateChat

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
	if( null == g_idb_chat_cnts ){
		g_idb_chat_cnts = new IDBStore({
		    dbVersion: 1,
		    storeName: 'chat_cnts',
		    keyPath: 'ts', 
		    indexes: [
		    	{ name: 'gi_ci_ts',keyPath:['gi','ci','ts']},
		    ]
		    ,onStoreReady: onReady
	    });
	}
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