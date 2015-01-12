var this_gi;
var this_gai;
var this_ti;
var ui;
var at;
var lang;
var name;
var current_fi;

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

initSingleChatGallery = function( ci, cn ){
	if( null==ci ){
		cns.debug("null ci");
		toastShow( "some error occured." );
		return;
	}
	this_gi = gi;
	this_gai = ci;
	this_ti = ci;
	name = cn;
	current_fi = null;
	$(".al-single .dataDom").trigger("click");
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
		initSingleChatGallery( $(this).data("ci"),$(this).data("cn") );
	});


	var gridArea = $(".al-single main");
	var viewArea = $("#page-view .picArea");
	//trigger loading
	$(".dataDom").off("click").click( function(){
		list = [];
		$("#page-view").hide();
		if( name ){
			$(".title").html(name).show();
		} else {
			$(".title").hide();
		}

		gridArea.html("");
		viewArea.html("");
		cns.debug(ui, at, lang, this_gi, this_gai);

		try{
			getAlbum(this_gi, this_gai).complete( function(data){
				if(data.status == 200){
					var objList =$.parseJSON(data.responseText);

					var row = null;
					var cnt = objList.fl.length;
					viewArea.css("width",(cnt*100)+"%");
					var width = 100.0/cnt;
					$(".al-single .hd-photoCnt").html(cnt);
					if( cnt<=1 ){
						$("#page-view .cnt").hide();
						// $("#page-view .cnt .current").html( 1 );
						$("#page-view .cnt .all").html( cnt );
						
						$("#page-view .rBtn").hide();
						$("#page-view .lBtn").hide();
					} else {
						$("#page-view .cnt").show();
						// $("#page-view .cnt .current").html( 1 );
						$("#page-view .cnt .all").html( cnt );

						$("#page-view .rBtn").show();
						$("#page-view .lBtn").show();
					}
					
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



						//set view
						var viewImg = $("<div class='img loading'><img style='height: 100%;'/></div>");
						viewImg.css("width",width+"%");
						viewImg.data("oriW",width);
						viewImg.data("text",dateString);
						viewImg.find("img").load( function() {
							$(this).data("w",this.naturalWidth);
							$(this).data("h",this.naturalHeight);
						});
						viewArea.append( viewImg );


						//load img
						if( tp>0 ){
							viewImg.attr("data-index", list.length);

							gridImg.find("img").data("index", list.length).load( function(){
								gridImg.removeClass("loading");
								var index = $(this).data("index");
								cns.debug(index);
								if( index>=objList.fl.length ){
									cns.debug("!");
								}
								list[index].s32 = $(this).data("s32");
								if( null!=current_fi && current_fi==obj.fi ){
									gridImg.trigger("click");
								}
								viewArea.find(".img[data-index="+$(this).data("index")+"] img").attr("src",$(this).attr("src"));
							});
							list.push({s32:"", text:dateString});
							getS3fileSP(obj.fi, obj.pi ,gridImg.find("img"), tp);
						}
						container.find(".ct-imgList").append(gridImg);

					}
				}
			});
		} catch(e){
			errorReport(e);
		}
		return;
	});

	$(document).on("click",".al-single .imgGrid",function(){
		if( $(".ct-imgList .img.loading").length>0 ){
			return;
		}

		showGallery( null, null, list, $(this).data("index"), name );
	});

	viewArea.bind("mousewheel", function(e) {
		if(!bIsScrollPage) return;

		var cnt = $(this).data("cnt");
		if( cnt<=1 ) return;
		isCheckPosi = true;
		var data = e.originalEvent;

		var index = $(this).data("index");
		var maxIndex = cnt-1;
		var left = 0;
		var time = new Date().getTime();
		if( time< nextScrollTime ) return;

		if( data.wheelDeltaX!=0 ){
			cns.debug(data.wheelDeltaX, scrollVal, scrollPercent*100);
			scrollVal += data.wheelDeltaX;
			scrollPercent = scrollVal/100;
			left += scrollPercent*100;
			checkTime = new Date().getTime()+500;
		}
		else{
			scrollVal += data.wheelDelta;
			scrollPercent = scrollVal/120;
			left += scrollPercent*100;
			checkTime = new Date().getTime()+300;
		}
		if( (left>0&&0==index) || (left<0&&maxIndex==index) ){
			left=-100*index+left*0.1;

			if( scrollPercent>=1 ){
				moveLeft(false);
				nextScrollTime = time+600;
			} else if( scrollPercent<=-1 ) {
				moveRight(false);
				nextScrollTime = time+600;
			}
		}
		else{
			left=-100*index+left;

			if( scrollPercent>=1 ){
				moveLeft(false);
			} else if( scrollPercent<=-1 ) {
				moveRight(false);
			}
		}

		$(this).css("left", left+"%");
		return false;
	});
});


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
                    target.attr("src",obj.s3);
                    target.data("s32",obj.s32);
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
	if( mineTypeString.indexOf("text")>=0 ) return 0;
	if( mineTypeString.indexOf("image")>=0 ) return 6;
	if( mineTypeString.indexOf("audio")>=0 ) return 8;
	return -1;
}