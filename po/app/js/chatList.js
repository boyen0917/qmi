$(function(){ 
	;
});

setChatList = function(){

	//----- set title -------
	var currentGroup = $.lStorage(ui)[gi];
	var parent = $("#page-group-main").find("div[data-role=header] div[class=header-group-name]");
	if( parent ){
		//set title & sub-title
		var tmp = parent.find("div:first-child");
		if( tmp ){
			tmp.html( $.i18n.getString("chat") );
			if( currentGroup )	tmp.next().html( currentGroup.gn );
		}
		//set add icon
		parent.find("~ div[class=feed-compose]").hide();
		parent.find("~ div[class=chatList-add]").show();
	}
	
	//---- get chat list -----
	//clear old contect
	$(".subpage-chatList .rows").html("");

	var userData = $.lStorage(ui);
	var currentGroup = userData[gi];
	
	if( currentGroup ){

		//try get data
		//if( currentGroup.hasOwnProperty("chatAll") ){
		//	showChatList();
		//} else {

			//取得聊天室列表
		    var api_name = "groups/"+ gi +"/chats";

		    var headers = {
		            ui:ui,
		            at:at, 
		            li:lang
	        };
		    var method = "get";
		    var result = ajaxDo(api_name,headers,method,false);
		    result.complete(function(data){
		    	if(data.status == 200){
					var epl = $.parseJSON(data.responseText);
					if(typeof epl != "undefined"){
						currentGroup["chatAll"] = new Object();

						$.each(epl.cl,function(key,room){
							currentGroup["chatAll"][room.ci] = room;
						});

				    	$.lStorage(ui, userData);
				    	showChatList();
				    }
				}
		    });
		//}
	}	//end of if( currentGroup )
}

function showChatList(){
	var groupData = $.lStorage(ui)[gi];
	var chatList = groupData["chatAll"];
	var targetDiv = $(".subpage-chatList .rows");
	if( targetDiv ){
		var tmp;
		$.each(chatList,function(key,room){
			//目前type0的全體聊天室無用
			if( "0"!=room.tp ){
				var chatRoomName="";
				var imgSrc="";
				if("1"==room.tp){
					imgSrc="images/common/others/empty_img_personal_l.png";
					//eg.cn="M00000DK0FS,M00000DJ00n"
					var split = room.cn.split(",");
					var me = groupData.gu;
					for( var i=0; i<split.length; i++ ){
						if( split[i]!= me ){
							$.each(groupData.guAll, function(key,mem){
								if( split[i] == key ){
									chatRoomName = mem.nk;
									if( mem.auo ){
										imgSrc = mem.auo;
									}
									return false;
								}
							});
							break;
						}
					}
					
				} else {
					chatRoomName = room.cn;
					imgSrc="images/common/others/empty_img_mother_l.png";
				}
				$(this).find(".cp-top-btn").attr("src","images/compose/compose_form_icon_check_none.png");
				tmp = $("<div class='subpage-chatList-row'>"
						+ "<img class='aut st-user-pic' src=" + imgSrc + "></img>" 
						+ "<div class='time'>" + "[last msg time]" + "</div>"
						+ "<div class='name'>" + chatRoomName + "</div>"
						+ "<div class='msg'>" + "[last msg here]" + "</div>"
						+ "<div class='drag'></div>"
					+ "</div>");
				targetDiv.append(tmp);	
			}
		});
	}

	//$(document).on("click",".subpage-chatList-row .pic",function{
	//	$(this,data
	//}....)
}
