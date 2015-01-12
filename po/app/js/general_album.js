var this_gi;
var this_gai;
var this_ti;
// var ui;
// var at;
// var lang;
var name;

var list = [];
var scrollVal = 0;
var scrollPercent = 0;
var isCheckPosi = false;
var checkTime = 0;
var nextScrollTime = 0;
var bIsScrollPage = true;
var viewInterval = null;

initGallery = function(){
	$(".al-category").hide();
	$(".al-single").hide();
	$(".al-all").fadeIn();
}

initChatGallery = function(){
	var gridTemp = $('<div class="grid" data-type="chatroom">'
        +'<div class="img"><img src="images/icon/icon_chatroom_more_albums_normal.png"/></div>'
        +'<div class="text"></div></div>');
    try{
    	$(".al-category .title").html( $.i18n.getString("CHAT_TITLE") );
	    var userData = $.lStorage(ui);
	    var group = userData[gi];
	    var container = $(".al-category .container");
	    container.html("");
	    for( var ci in group.chatAll ){
    		var grid = gridTemp.clone();
	    	var room = group.chatAll[ci];
	    	if( room.tp==0 ) continue;
			grid.data("ci", ci);
			grid.data("cn", room.cn);
			grid.find(".text").html( room.cn );
			container.append(grid);
	    }
		$(".al-category").fadeIn();
		$(".al-single").hide();
		$(".al-all").fadeOut();
    } catch(e){
    	errorReport(e);
    	toastShow( "some error occured." );
    	return;
    }
}

//GET /groups/{gi}/galleries/{gai}/images
$(document).ready(function(){

	$(document).on("click",".subpage-album .back",function(){
		$(".al-category").fadeOut();
		$(".al-single").fadeOut();
		$(".al-all").fadeIn();
	});
	
	$(document).on("click",".al-all .grid",function(){
		$(".al-all").fadeOut();
		$(".al-category").fadeIn();
		$(".al-single").hide();
		var type = $(this).data("type");
		switch(type){
			case "chatroom":
				initChatGallery();
				break;
		}
	});

	$(document).on("click",".al-category .grid",function(){
		$(".al-all").hide();
		$(".al-category").fadeOut();
		$(".al-single").fadeIn();
		var ci = $(this).data("ci");
		var cn = $(this).data("cn");
		if( null==ci ){
			cns.debug("null ci");
			toastShow( "some error occured." );
			return;
		}
		this_gi = gi;
		this_gai = ci;
		this_ti = ci;
		name = cn;
		initSingleChatGallery();
	});


	//trigger loading
	$(".dataDom").off("click").click( function(){

		var dataDom = $(this);
		if( dataDom.attr("data-gi") ) this_gi = dataDom.attr("data-gi");
		if( dataDom.attr("data-gai") ) this_gai = dataDom.attr("data-gai");
		if( dataDom.attr("data-ti") ) this_ti = dataDom.attr("data-ti");
		if( dataDom.attr("data-name") ) name = dataDom.attr("data-name");

		//group check
		// var groupBtn = $(".sm-group-area[data-gi='"+this_gi+"'");
		// if( !groupBtn.hasClass("active") ){
		// 	groupBtn.trigger("click");
		// 	var waiting = setInterval( function(){
		// 		if( $(".st-filter-lock").length<=0 ){
		// 			clearInterval( waiting );
		// 			$('.sm-small-area[data-sm-act="album"]').trigger("click");
		// 			$(".al-all").hide();
		// 			$(".al-category").hide();
		// 			$(".al-single").show();
		// 		} else {
		// 			cns.debug("waiting..");
		// 		}
		// 	}, 1500);
		// } else{
			$('.sm-small-area[data-sm-act="album"]').trigger("click");
			$(".al-all").hide();
			$(".al-category").hide();
			$(".al-single").show();
		// }
		initSingleChatGallery();
	});

	$(document).on("click",".al-single .imgGrid",function(){
		if( $(".ct-imgList .img.loading").length>0 ){
			return;
		}

		var index = $(this).find("img").data("index");
		cns.debug( index );
		showGallery( null, null, list, index, name );
	});

});

function initSingleChatGallery( ci, cn ){
	var gridArea = $(".al-single main");
	list = [];
	if( name ){
		$(".title").html(name).show();
	} else {
		$(".title").hide();
	}

	gridArea.html("");
	cns.debug(ui, at, lang, this_gi, this_gai);

	try{
		getAlbum(this_gi, this_gai).complete( function(data){
			if(data.status == 200){
				var objList =$.parseJSON(data.responseText);

				var cnt = objList.fl.length;
				$(".al-single .hd-photoCnt").html(cnt);
				
				for( var i=0; i<objList.fl.length; i++){
					var obj = objList.fl[i];

					//set grid
					var time = new Date(obj.ct);
					var dateClass = time.customFormat("_#YYYY#_#MM#_#DD#");
					var dateString = time.customFormat("#YYYY#/#MM#/#DD#");
					var container = $("."+dateClass);
					if( container.length<=0 ){
						container = $("<div class='container "+dateClass+"'></div>");

						var infoBar = $("<div class='ct-info'></div>");
						infoBar.append("<div class='date'>"+ dateString+"</div>");
						infoBar.append("<div class='cnt'></div>");
						infoBar.append("<img class='img' src='images/icon/icon_album_single.png'/>");
						container.append( infoBar );

						container.append("<div class='ct-imgList'></div>");
						gridArea.append(container);
					}

					var cnt = container.find("img").length-1;
					container.find(".cnt").html(cnt+1);
					// cns.debug(i, dateClass, cnt);

					var gridImg = $("<div class='imgGrid'><img/></div>");
					var tp = minetypeToTypeID(obj.mt);



					//load img
					if( tp>0 ){
						var imgDom = gridImg.find("img");
						imgDom.data("index", list.length);
						imgDom.attr("src",obj.th);
						cns.debug(list.length, obj.th);
						// imgDom.load( function(){
						// 	$(this).parent().removeClass("loading");
						// 	var index = $(this).data("index");
						// 	if( index>=objList.fl.length ){
						// 		cns.debug("!");
						// 	}
						// 	list[index].s32 = $(this).data("s32");
						// 	if( null!=this_ti && this_ti==obj.fi ){
						// 		$(this).parent().trigger("click");
						// 	}
						// });
						list.push({s32:"", text:dateString});
						getS3fileSP(obj.fi, obj.pi ,imgDom, tp);
					}
					container.find(".ct-imgList").append(gridImg);

				}
			}
		});
	} catch(e){
		errorReport(e);
	}
	return;
}

function getS3fileSP(fi, pi, target, tp){
    //default
    var api_name = "groups/" + this_gi + "/files/" + fi + "?pi=" + pi + "&ti=" + this_ti;
    var headers = {
             "ui":ui,
             "at":at, 
             "li":lang,
        };
    var method = "get";
    var result = ajaxDo(api_name,headers,method,false);
    result.complete(function(data){
        if(data.status != 200) return false;

        var obj =$.parseJSON(data.responseText);
        obj.api_name = api_name;
        if(target && tp){
            switch(tp){
                case 6://圖片
                    //小圖
                    // target.css("background-image","url("+obj.s32+")");
                    // target.data("s3",obj.s3);
                    // target.data("s32",obj.s32);
                    var index = target.data("index");
                    if( index>=0 && index<list.length ){
                    	list[index].s32 = obj.s32;
                    }
                    break;
                case 8://聲音
                    target.attr("src",obj.s3);
                    break;
            }
        }else{
            return obj.s3;
        }
    });
}

minetypeToTypeID = function(mineTypeString){
	if( null==mineTypeString ) return -1;
	mineTypeString = mineTypeString.toLowerCase();
	if( mineTypeString.indexOf("text")>=0 ) return 0;
	if( mineTypeString.indexOf("image")>=0 ) return 6;
	if( mineTypeString.indexOf("audio")>=0 ) return 8;
	return -1;
}