

var initStickerArea= {
	path: "sticker/",
	jsonPath: "sticker/stickerArea.json",
	dict: null,
	init: function( dom, onSelect ){
		
		var thisTmp = this;
		dom.data("callback",onSelect);

		//------ top ---------
		var imgArea = $("<div class='imgArea'></div>");
	    // var div = $("<div class='left'></div>");
	    // imgArea.append(div);
	    dom.append(imgArea);

	    //left
	    var btnLeftBtn = $("<div class='left'></div>");
	    btnLeftBtn.off("click").click(function(){
	    	var currentTp = $(dom).find(".mid").data("type");
	    	var tmp = $(dom).find(".mid .group."+currentTp);
	    	var currentPg = tmp.data("index");
	    	var maxPg = tmp.data("cnt");
	    	if( currentPg >0 ){
	    		currentPg--;
	    	} else	currentPg = Math.max(0,maxPg-1);
	    	if( currentPg != tmp.data("index") ){
		    	tmp.data("index", currentPg);
		    	tmp.animate( {marginLeft:"-"+(100*currentPg)+"%"}, 'fast' );
	    	}
	    	thisTmp.updatePageInfo( dom );
	    });
	    imgArea.append(btnLeftBtn);

	    //center
	    var imgContent = $("<span class='mid'></span>");
	    imgArea.append(imgContent);
	    
	    //right
	    var btnRightBtn = $("<div class='right'></div>");
	    btnRightBtn.off("click").click(function(){
	    	var currentTp = $(dom).find(".mid").data("type");
	    	var tmp = $(dom).find(".mid .group."+currentTp);
	    	var currentPg = tmp.data("index");
	    	var maxPg = tmp.data("cnt");
	    	if( currentPg < (maxPg-1) ){
	    		currentPg++;
	    	} else	currentPg = 0;
	    	if( currentPg != tmp.data("index") ){
		    	tmp.data("index", currentPg);
		    	tmp.animate( {marginLeft:"-"+(100*currentPg)+"%"}, 'fast' );
		    }
	    	thisTmp.updatePageInfo( dom );
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
	    dom.append(catagory);
	    thisTmp.updateHistory( dom );

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

	    		thisTmp.showImg(dom, key, obj.pic );
	    	}
	    	$(dom).find(".cata").off("click").click( function(){
	    		var type = $(this).data("type");
	    		cns.debug( type );
	    		$(dom).find(".mid").data("type", type);

	    		//active/deactive sticker group
	    		var tmp = $(dom).find(".mid .group:not(."+type+")");
	    		tmp.css("display","none");
	    		tmp = $(dom).find(".mid .group."+type);
	    		tmp.css("display","");

	    		//active/deactive catagory
	    		tmp = $(dom).find(".cata.active").removeClass("active");
	    		$(this).addClass("active");

	    		//$(".mid .group:not([data-type='"+type+"'])").css("visibility","hidden");
	    		//$(".mid .group[data-type='"+type+"']").css("visibility","visible");
	    		thisTmp.updatePageInfo( dom );
	    	});
	    	$(dom).find(".cata:eq(1)").trigger("click");
	    });
	},
	showImg: function(dom, type, arImgId, path){
		var imgPath = this.path+type+"/{0}.png";
		var imgContent = $(dom).find(".mid");
		var content = $(dom).find(".mid .group."+type);
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
	    $(dom).find(".page .row img").off("click").click( function(){
	    	var id = $(this).data("id");
	    	cns.debug( id );

	    	var userData = $.lStorage("sticker");
	    	if( !userData ){
	    		userData = [];
	    	} else {
	    		for(var i=0; i<userData.length; i++){
	    			if( userData[i].id==id ){
			    		delete userData[i];
			    		userData.splice(i, 1);
	    				break;
	    			}
	    		}
	    	}
	    	userData.push( {"id":id, "src":$(this).attr("src")} );
	    	$.lStorage("sticker", userData);
	    	thisTmp.updateHistory( dom );

	    	var callback = dom.data("callback");
	    	if( null != callback ) callback(id);
	    });
	},
	updateHistory: function(dom){
	    var userData = $.lStorage("sticker");
	    if( null != userData ){
	    	var values = [];
	    	var keys = [];
	    	for(var i=userData.length-1; i>=0; i--){
	    		var obj = userData[i];
	    		keys.push(obj.id);
	    		values.push(obj.src);
	    	}
	    	if( keys.length>0 ){
				this.showImg( dom, "history", keys, values );
			}
	    }
	},
	updatePageInfo: function( dom ){
	    var currentTp = $(dom).find(".mid").data("type");
	    if( null == currentTp )	return;

	    var tmp = $(dom).find(".mid .group."+currentTp);
	    var maxPg = tmp.data("cnt");

	    //update page dots
	    if( currentTp != $(dom).find(".pageArea").data("type") ){
	    	$(dom).find(".pageArea").html("");
	    	$(dom).find(".pageArea").data("type", currentTp);
	    	if(maxPg<=1) return;

	    	for(var i=0; i<maxPg; i++){
	    		$(dom).find(".pageArea").append("<label class='dot'></label>");
	    	}
	    } else {
	    	if(maxPg<=1) return;
	    	$(dom).find(".pageArea").find(".dot.active").removeClass("active");
	    }

	    var tmp = $(dom).find(".mid .group."+currentTp);
	    var currentPg = tmp.data("index");
	    $(dom).find(".pageArea").find(".dot:eq("+currentPg+")").addClass("active");
	},
	load: function(callback) {
		var thisTmp = this;
		if( null==thisTmp.dict ){
			$.get(this.jsonPath,function(load_dict){
		        if (thisTmp.dict !== null) {
		        	$.extend(thisTmp.dict, load_dict);
		        } else {
		        	thisTmp.dict = load_dict;
		        }
		        // cns.debug(thisTmp.dict);
		        callback();
		    });
		} else {
			callback();
		}
	}
};

