

var initStickerArea= {
	path: "sticker/",
	jsonPath: "sticker/stickerArea",
	dict: null,
	ui:null,
	callback: null,
	init: function( dom, ui, onSelect ){
		var thisTmp = this;
		thisTmp.ui = ui;
		thisTmp.callback = onSelect;

		//------ top ---------
		var imgArea = $("<div class='imgArea'></div>");
	    // var div = $("<div class='left'></div>");
	    // imgArea.append(div);
	    dom.append(imgArea);

	    //left
	    var btnLeftBtn = $("<div class='left'></div>");
	    btnLeftBtn.off("click").click(function(){
	    	var currentTp = $(".mid").data("type");
	    	var tmp = $(".mid .group."+currentTp);
	    	var currentPg = tmp.data("index");
	    	var maxPg = tmp.data("cnt");
	    	if( currentPg >0 ){
	    		currentPg--;
	    	} else	currentPg = Math.max(0,maxPg-1);
	    	if( currentPg != tmp.data("index") ){
		    	tmp.data("index", currentPg);
		    	tmp.animate( {marginLeft:"-"+(100*currentPg)+"%"}, 'fast' );
	    	}
	    	thisTmp.updatePageInfo();
	    });
	    imgArea.append(btnLeftBtn);

	    //center
	    var imgContent = $("<span class='mid'></span>");
	    imgArea.append(imgContent);
	    
	    //right
	    var btnRightBtn = $("<div class='right'></div>");
	    btnRightBtn.off("click").click(function(){
	    	var currentTp = $(".mid").data("type");
	    	var tmp = $(".mid .group."+currentTp);
	    	var currentPg = tmp.data("index");
	    	var maxPg = tmp.data("cnt");
	    	if( currentPg < (maxPg-1) ){
	    		currentPg++;
	    	} else	currentPg = 0;
	    	if( currentPg != tmp.data("index") ){
		    	tmp.data("index", currentPg);
		    	tmp.animate( {marginLeft:"-"+(100*currentPg)+"%"}, 'fast' );
		    }
	    	thisTmp.updatePageInfo();
	    });
	    imgArea.append(btnRightBtn);

	    //------- mid ---------
	    var pageArea = $("<div class='pageArea'></div>");
	    dom.append(pageArea);

	    //----- botoom -------
	    //history stickers
	    var catagory = $("<div class='catagory'></div>");
	    var cataHistoryBtn = $("<div class='cata history'></div>");
	    cataHistoryBtn.data("type", "history" );
	    cataHistoryBtn.data("cnt", 0);
	    catagory.append(cataHistoryBtn);
	    thisTmp.updateHistory();
	    dom.append(catagory);
	    thisTmp.updateHistory();

	    thisTmp.load( function(){
	    	for( var key in thisTmp.dict ){
	    		var obj = thisTmp.dict[key];
	    		var cataBtn = $("<div class='cata'></div>");
	    		var imgPath = thisTmp.path+key+"/{0}.png";
	    		var img = $("<img/>");
	    		img.attr("src", imgPath.format(obj.icon) );
	    		cataBtn.append(img);
	    		cataBtn.data("type", key );
	    		catagory.append(cataBtn);

	    		thisTmp.showImg(key, obj.pic);
	    	}
	    	$(".cata").off("click").click( function(){
	    		var type = $(this).data("type");
	    		cns.debug( type );
	    		$(".mid").data("type", type);

	    		//active/deactive sticker group
	    		var tmp = $(".mid .group:not(."+type+")");
	    		tmp.css("display","none");
	    		tmp = $(".mid .group."+type);
	    		tmp.css("display","");

	    		//active/deactive catagory
	    		tmp = $(".cata.active").removeClass("active");
	    		$(this).addClass("active");

	    		//$(".mid .group:not([data-type='"+type+"'])").css("visibility","hidden");
	    		//$(".mid .group[data-type='"+type+"']").css("visibility","visible");
	    		thisTmp.updatePageInfo();
	    	});
	    	$(".cata:eq(1)").trigger("click");
	    });
	},
	showImg: function(type, arImgId, path){
		var imgPath = this.path+type+"/{0}.png";
		var imgContent = $(".mid");
		var content = $(".mid .group."+type);
		var pageCnt = Math.ceil(arImgId.length/8);

		if( null==content || content.length <= 0 ){
		    content = $("<div class='group'></div>");
		    content.css("display","none");
		    content.css("left","0");
		    content.data("index",0);
		    content.addClass(type);
		    imgContent.append(content);
		} else {
			content.html("");
		}
		content.css("width",pageCnt*100+"%");
		content.data("cnt",pageCnt);

	    var iRowCnt = 0;
	    var width = Math.floor((1/pageCnt)*100);
		var div = null;
	    var subDiv1 = null;
	    var subDiv2 = null;
	    for(var i=0; i<arImgId.length; i++){
	    	if( i%8==0 ){
				div = $("<div class='page'></div>");
				div.css("width", width+"%");
				content.append(div);
				
				var last = div.find(".up:last");
				subDiv1 = $("<div class='row up'></div>");
				if( last.length>0 )	last.after(subDiv1);
				else	div.append(subDiv1);
				
				last = div.find(".down:last");
				subDiv2 = $("<div class='row down'></div>");
				if( last.length>0 )	last.after(subDiv2);
				else	div.append(subDiv2);
	    	}

	    	var imgDiv = $("<div></div>");
	    	var st = null;
	    	if(path){
	    		st = $("<img src="+path[i]+">");
	    	} else{
	    		st = $("<img src="+imgPath.format(arImgId[i])+">");
	    	}
	    	st.data( "id", arImgId[i] );
	    	imgDiv.append(st);
	    	if( i%8<4 ){
				subDiv1.append(imgDiv);
	    	} else{
				subDiv2.append(imgDiv);
	    	}
	    }

	    var thisTmp = this;
	    $(".page .row img").off("click").click( function(){
	    	var id = $(this).data("id");
	    	cns.debug( id );

	    	var userData = $.lStorage(thisTmp.ui);
	    	if( false == userData.hasOwnProperty("sticker") ){
	    		userData.sticker = new Object();
	    	}
	    	if( userData.sticker.hasOwnProperty(id) ){
	    		delete userData.sticker[id];
	    	}

	    	userData.sticker[id] = $(this).attr("src");
	    	$.lStorage(thisTmp.ui, userData);
	    	thisTmp.updateHistory();

	    	if( null != thisTmp.callback ) thisTmp.callback(id);
	    });
	},
	updateHistory: function(){
	    var userData = $.lStorage(this.ui);
	    if( userData.hasOwnProperty("sticker") ){
	    	var values = [];
	    	var keys = [];
	    	for(var key in userData.sticker){
	    		keys.unshift(key);
	    		values.unshift(userData.sticker[key]);
	    	}
	    	if( keys.length>0 ){
				this.showImg("history", keys, values );
			}
	    }
	},
	updatePageInfo: function(){
	    var currentTp = $(".mid").data("type");
	    if( null == currentTp )	return;

	    var tmp = $(".mid .group."+currentTp);
	    var maxPg = tmp.data("cnt");

	    //update page dots
	    if( currentTp != $(".pageArea").data("type") ){
	    	$(".pageArea").html("");
	    	$(".pageArea").data("type", currentTp);
	    	if(maxPg<=1) return;

	    	for(var i=0; i<maxPg; i++){
	    		$(".pageArea").append("<label class='dot'></label>");
	    	}
	    } else {
	    	if(maxPg<=1) return;
	    	$(".pageArea").find(".dot.active").removeClass("active");
	    }

	    var tmp = $(".mid .group."+currentTp);
	    var currentPg = tmp.data("index");
	    $(".pageArea").find(".dot:eq("+currentPg+")").addClass("active");
	},
	load: function(callback) {
		var thisTmp = this;
		$.get(this.jsonPath,function(load_dict){
	        if (thisTmp.dict !== null) {
	        	$.extend(thisTmp.dict, load_dict);
	        } else {
	        	thisTmp.dict = load_dict;
	        }
	        // cns.debug(thisTmp.dict);
	        callback();
	    });
	}
};

