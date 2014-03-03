$(function(){
	var wsUri = "ws://echo.websocket.org/";
    
    websocket = new WebSocket(wsUri);
    websocket.onopen = function()
    {
    	$("#input1").attr("readonly",false);
    	$("#input2").attr("readonly",false);
    	websocket.send($("#input1").val());
    };
    websocket.onmessage = function(e) {
		$("#test2").append(e.data);
    }
});
