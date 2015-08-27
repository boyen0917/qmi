# getChatS3file(target, file_c, tp, ti, tu)
* brief: 取得s3檔案及將內容帶入目標dom
* param:
	* target: 要顯示這個檔案的dom
	* file_c: 檔名
	* tp: 檔案type(6圖, 7影片, 8audio)
	* ti: 聊天室timeline id (=ci)
	* (deprecated)tu: 目前聊天室已不需要帶了....神奇的target user列表, 用來取代舊的permition id作檔案權限管理用, server會拿這份列表去產pi取檔案給你
	* eg: 

		```
		var this_audio = $("<audio class='msg-audio' src='test' controls></audio>");
		getChatS3file(this_audio, msgData.c, msgData.tp, ti_chat);
		```

# getPermition(isReget)
* brief: 取得聊天室權限, 舊版是取pi, 新版改成取得聊天室成員列表
* param:
	* isReget: 若已取過是否要再取一次

# sendMsgRead(msTime)
* brief: 更新聊天室已讀時間
* param:
	* msTime: 已讀時間

# leaveRoomAPI(ci, callback)
* brief: 離開聊天室API
* param:
	* ci: 聊天室id
	* callback(rsp): 完成callback
		* rsp: response text obj 

# editMemInRoomAPI(ci, sendData, callback)
* brief: 編輯聊天室成員API
* param:
	* ci: 聊天室id
	* sendData: 要新增或刪除的成員gu清單
	* callback(rsp): 完成callback
		* rsp: response text obj 
	* eg:

		```
		//取得已讀
		var sendData = {
		  "add":{
			  "gul": [
			    { "gu": "M00000DK0FS", "rt":  }, ...
			  ]
		  }, "del":{
			  "gul": [
			    { "gu": "M00000M707J", "rt": 1440495162788 }, ...
			  ]
		  }
		};
		editMemInRoomAPI('T00002ac07i', sendData, function(data){
			// data = {"mc":3,"rsp_code":0,"rsp_msg":"OK"}; //object, mc=current mem cnt
		});
		```

# getChatReadUnreadApi(gi, ci, rt, tp)
* brief: 取得已讀數＆時間的api
* param:
	* gi: 團體id
	* ci: 聊天室id
	* rt: 要查詢的時間
	* tp: Read type (1: 已讀, 2:未讀)
	* eg:

		```
		//取得已讀
		getChatReadUnreadApi('G000006s00q', 'T00002ac07i', 1440471452981, 1).complete(function(data){
			var parseData = $.parseJSON(data.responseText);
			/* 已讀內容, 未讀也差不多
			{
			  "gul": [
			    {
			      "gu": "M00000DK0FS",
			      "rt": 1440495096495
			    },
			    {
			      "gu": "M00000M707J",
			      "rt": 1440495162788
			    }
			  ],
			  "rsp_code": 0,
			  "rsp_msg": "OK"
			} */
		});
		```