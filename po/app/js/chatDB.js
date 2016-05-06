

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
	//indexed from old to new (api chat is from new to old)

	// 跑兩個回圈 把polling msgs的每一個msg 都存到db
	msgs.forEach( function(roomObj){
		roomObj.cnt = 0;

		var 
		thisGi = roomObj.gi,
		thisCi = roomObj.ci;
		// brian 存每筆訊息
		roomObj.el.forEach( function(msgObj,i){
			msgObj.cn = roomObj.cn;

			if(msgObj.hasOwnProperty("meta")){

				//add to db
				var 
				idbMsgPutDeferred = $.Deferred(),

				node = {
					gi: thisGi,
					ci: thisCi,
					ei: msgObj.ei,
				    ct: msgObj.meta.ct,
				    data: msgObj
				};

				//目前看起來 不需要每次都去跑 那是不是做個例子測看看
				g_idb_chat_msgs.put( node, function(eiTmp){
					//是最後一筆 才更新開啟的聊天室 及 聊天列表的最後一筆
					if( i === this.total-1 ) {
						var isRoomOpen = false;

						if( windowList.hasOwnProperty(thisCi) 	&&
							windowList[thisCi].closed === false
						) {
							//更新打開的聊天室
							isRoomOpen = true;
							// windowList[thisCi].g_msgTmp = data.el;
							$(windowList[thisCi].document).find("button.pollingMsg").trigger("click");
						}
						
						updateLastMsg( this.gi, this.ci, isRoomOpen, this.ei );	
					}
				}.bind({
					total: roomObj.el.length,
					index: i,
					gi: thisGi,
					ci: thisCi,
					ei: msgObj.ei
				}));
			}
		})
	})
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
	var isRoomOpen = false;
	/* 更新聊天室訊息 */
	// showMsg( object, false );
	if( null != windowList ){
		if( windowList.hasOwnProperty(ciTmp) 
			&& null != windowList[ciTmp] 
			&& false==windowList[ciTmp].closed ){
			isRoomOpen = true;

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
	var storage = QmiGlobal.groups;

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
	// cns.debug( JSON.stringify(QmiGlobal.groups) );


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