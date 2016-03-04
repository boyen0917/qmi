

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
function onReceivePollingChatMsg ( msgs ){
	cns.debug("-----------------------");

	var deferredPoolArr = [];

	//indexed from old to new (api chat is from new to old)


	// 跑兩個回圈 把polling msgs的每一個msg 都存到db
	for( var j = 0; j<msgs.length; j++){
		var data = msgs[j];

		data.cnt = 0;

		// 3/2 brian use when deferred
		var chatRoomGuAllDeferred = $.Deferred();
		deferredPoolArr.push(chatRoomDeferred);

		if( groupTmp.guAll === undefined || 
			0 == Object.keys(groupTmp.guAll).length 
		) {
			setGroupAllUser()
		} else {
			chatRoomGuAllDeferred.resolve();
		}


		// var data = msgs[msgIndex];
		// brian 存每筆訊息
		for( var i=0; i<data.el.length; i++){
			var object = data.el[i];
			object.cn = data.cn;

			// 3/2 brian use when deferred
			var idbMsgPutDeferred = $.Deferred();
			deferredPoolArr.push(idbMsgPutDeferred);

			if(object.hasOwnProperty("meta")){

				//add to db
				var node = {
					gi: data.gi,
					ci: data.ci,
					ei: object.ei,
				    ct: object.meta.ct,
				    data: object
				};

				//目前看起來 不需要每次都去跑 那是不是做個例子測看看
				var tmp = g_idb_chat_msgs.put( node, function(eiTmp){
					// onPollingMsgSaveSucc(msgs, eiTmp, object);
				});

				cns.debug("[updateChatDB]",data.gi,data.ci,object.ei,object.ml[0].c);
			}
		}
	}

	// 更新聊天室
	// $.when.apply($,idbDeferredPoolArr).done(function(){

	// 	var isRoomOpen = false;
	// 	/* 更新聊天室訊息 */
	// 	// showMsg( object, false );
	// 	if( null != windowList ){
	// 		if( windowList.hasOwnProperty(ciTmp) 
	// 			&& null != windowList[ciTmp] 
	// 			&& false==windowList[ciTmp].closed ){
	// 			isRoomOpen = true;

	// 			//brian: cnt應該就是判斷是否為開啟中的聊天室 是怎麼大於等於的...不懂
	// 			if( data.cnt>=data.el.length ){
	// 				windowList[ciTmp].g_msgTmp = data.el;
	// 				$(windowList[ciTmp].document).find("button.pollingMsg").trigger("click");
	// 			}
	// 		} else {
	// 			cns.debug("room ", ciTmp, " not opened");
	// 		}
	// 	}

	// });
}	//end of updateChat

function onPollingMsgSaveSucc(msgs, eiTmp, object){
	// 2/28 知道在幹嘛了 他也覺得不該跑這麼多次 要等全部的put完成 所以這是他的方式

	// brian: 不懂這在幹嘛
	var object;

	// brian: 比對所有put進去得ei是否都有對到polling msgs 有的話就表示全部完成
	// 全部完成就可以做
	for( var j = 0; j<msgs.length; j++){
		var data = msgs[j]; // 代表這次polling 一個聊天室的訊息有多少
		for( var i=0; i<data.el.length; i++){
			object = data.el[i];// 其中一個聊天室的 遍歷的訊息
			if(object.ei==eiTmp){ //如果ei等於 剛put進去db的 這個聊天室的cnt 就 加一
				data.cnt++;
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
		if( windowList.hasOwnProperty(ciTmp) 
			&& null != windowList[ciTmp] 
			&& false==windowList[ciTmp].closed ){
			isRoomOpen = true;

			//brian: cnt應該就是判斷是否為開啟中的聊天室 是怎麼大於等於的...不懂
			if( data.cnt>=data.el.length ){
				windowList[ciTmp].g_msgTmp = data.el;
				$(windowList[ciTmp].document).find("button.pollingMsg").trigger("click");
			}
		} else {
			cns.debug("room ", ciTmp, " not opened");
		}
	}

	/* 更新聊天室列表最後訊息 */ 
	// 其實不用每個都更新 更新最後一個才是
	if( typeof( updateLastMsg ) != 'undefined' ){
		updateLastMsg( giTmp, ciTmp, isRoomOpen, object.ei );
	}
}

function onChatReceiveMsg ( tmp_gi, tmp_ci, tmp_cn, msgs, callback ){
	// cns.debug("-----------------------");
	if( !msgs || msgs.length==0 ){
		if(callback)	callback();
		return;
	}

	//indexed from old to new (api chat is from new to old)
	var cnt = 0;
	for( var i=0; i<msgs.length; i++){
		var object = msgs[i];
		object.cn = tmp_cn || "";
		if(object.hasOwnProperty("meta")){

			//add to db
			var node = {
				gi: tmp_gi,
				ci: tmp_ci,
				ei: object.ei,
			    ct: object.meta.ct,
			    data: object
			};
			//write msg to db
			// if( !g_idb_chat_msgs.get(object.ei) ){
				var tmp = g_idb_chat_msgs.put( node, function(eiTmp){
					cnt++;
					if( cnt==msgs.length ){
						if(callback)	callback();
					}
				});
			// }
			// tmp.onabort = onSucc;
			// tmp.onerror = onSucc;
			// tmp.oncomplete = onSucc;
			// tmp.onsuccess = onSucc;

			// cns.debug("[updateChatDB]",tmp_gi,tmp_ci,object.ei,object.ml[0].c);
		}
	}
}

// function onChatMsgSaveSucc(node){
// 	cns.debug(node.ei);

// 	/* 更新聊天室列表最後訊息 */
// 	if( window.opener 
// 		&& window.opener.updateLastMsg 
// 		&& typeof( window.opener.updateLastMsg ) != 'undefined' ){
// 		window.opener.updateLastMsg( node.gi, node.ci, true, node.ei );
// 	}
// }

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
function onReceivePollingChatCnt ( ccs ){
	var storage = $.lStorage(ui);

	//indexed from old to new (api chat is from new to old)
	for( var ccsIndex=0; ccsIndex<ccs.length; ccsIndex++){
		var data = ccs[ccsIndex];
		var giTmp = data.gi;
		if( null==storage[giTmp] )	storage[giTmp] = {};
		if( null==storage[giTmp].chatAll )	storage[giTmp].chatAll = {};
		if( null==storage[giTmp].chatAll[data.ci] )	storage[giTmp].chatAll[data.ci] = {};

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