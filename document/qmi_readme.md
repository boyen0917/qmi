#開發要點#

對apserver.mitake.com.tw發起 https request 請改用以下function

```
function xHttpsRequest(hostname, path, port, method, headers, body, successCallback, errorCallback);
```

##說明##

```
hostname
    主機 hostname, EX: apserver.mitake.com.tw
path
    resource path, EX: /apiv1/sys/version
port
    連接阜, EX: 443
method
    EX: "GET", "POST"
headers
    HTTP request header, in array format. EX:{al:"1", cl:"ccc"}
body
    HTTP request body content, 如果不需要則帶 "" or undefined.
successCallback
    當成功時候（不論200, 404）的callback, 帶入參數分別為 data, statusCode, Response 三個。
    Response本體請參考(http://nodejs.org/api/http.html#http_http_incomingmessage)
    EX: function(data, status, resp){};
errorCallback
    當發生驗證失敗時的callback, 帶入參數為 erorrMessage object. EX: function(e){};
```

##範例##

```
function successC(data, statusCode){
if (statusCode == 200)
    console.log(data);
}

function errorC(e){
    return false;
}

xHttpsRequest("apserver.mitake.com.tw", "/", 443, "GET", {}, undefined, successC, errorC);
```

#VERY VERY VERY Important Note#

1. 看到** XMLHttpRequest cannot load chrome-extension://fmfcbgogabcbclcofgocippekhfcmgfj/cast_sender.js. Cross origin requests are only supported for HTTP. **錯誤是正常的，因為這是MIT License專案，而關於mp4, mp3, h.264/5的codec(ffmpeg)是GPL授權，所以無法支援這些格式的影音，只支援ogg, webM。
2. nodejs function只支援網域 *.mitake.com.tw & localhost, 其他網域無法使用nodejs、 xHttpsRequest function.
3. xHttpsRequest function 只支援對apserver.mitake.com.tw進行 https 連線。
4. Debug版 for Debug 用， Release版是不包含允許localhost網域操作nodejs及xHttpRequest function，沒有toolbar。
5. ##一定要看，不看會後悔！！##



# 送出通知 ##

```Javascript
function riseNotification (icon, title, description, onClickCallback);
```

## 說明 ###
icon
圖片網址, 若為undefined則顯示預設圖片
title
通知標題，必要
description
通知內容，必要
onClickCallback
通知點選後觸發事件，若無事件則為undefined

## 範例 ###
```Javascript
riseNotification(undefined, "Title", "description", undefined);
```
