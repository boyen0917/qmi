/* ----- TODO -------
 不同頁面按下載/選擇貼圖時應共同更新
-------- TODO -------*/

var initStickerArea= {
	isUpdated: false,
	path: "sticker/",
	jsonPath: "sticker/stickerArea.json",
	// dict: null,
	splDict: null,
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

	    var callbackTmp = function(){
	    	thisTmp.isUpdated = true;
	    	for( var key in thisTmp.splDict ){
	    		var obj = thisTmp.splDict[key];
	    		var cataBtn = $("<div class='cata'></div>");
	    		// var imgPath = thisTmp.path+key+"/{0}.png";
	    		var img = $("<img/>");
	    		img.attr("src", obj.l );
	    		cataBtn.append(img);
	    		cataBtn.data("type", key );
	    		catagory.append(cataBtn);

	    		// var localObj = thisTmp.dict[key];
	    		thisTmp.showImg(dom, key, obj );
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
	    };

		if( thisTmp.isUpdated ) callbackTmp();
	    else thisTmp.load( callbackTmp );
	},
	showImg: function(dom, type, dataObj, path){
		var thisTmp = this;
		var content = $(dom).find(".mid .group."+type);
		if( null==content || content.length <= 0 ){
		    content = $("<div class='group'></div>");
		    content.css("display","none");
		    content.css("left","0");
		    content.data("index",0);
		    content.addClass(type);
			var imgContent = $(dom).find(".mid");
		    imgContent.append(content);
		}

		if( true==dataObj.isDownload ){
			arImgId = dataObj.sl;
			content.html("");
			// var imgPath = thisTmp.path+type+"/{0}.png";
			var pageCnt = Math.ceil(arImgId.length/8);

		    var iRowCnt = 0;
		    var width = Math.floor((1/pageCnt)*100);
			var div = null;
		    var subDiv1 = null;
		    var subDiv2 = null;
			content.css("width",pageCnt*100+"%");
			content.data("cnt",pageCnt);
		    for(var i=0; i<arImgId.length; i++){
		    	if( i%8==0 ){
					div = $("<div class='page'></div>");
					div.css("width", width+"%");
					
					var last = div.find(".up:last");
					subDiv1 = $("<div class='row up'></div>");
					if( last.length>0 )	last.after(subDiv1);
					else	div.append(subDiv1);
					
					last = div.find(".down:last");
					subDiv2 = $("<div class='row down'></div>");
					if( last.length>0 )	last.after(subDiv2);
					else	div.append(subDiv2);
					content.append(div);
		    	}

		    	var imgDiv = $("<div></div>");
		    	var st = null;
		    	// if(path){
		    	// 	st = $("<img src="+path[i]+">");
		    	// } else{
		    		// st = $("<img src="+imgPath.format(arImgId[i])+">");
		    	// }
		    	st = $("<img src="+arImgId[i].sou+">");
		    	st.data( "id", arImgId[i].sid );
		    	imgDiv.append(st);
		    	if( i%8<4 ){
					subDiv1.append(imgDiv);
		    	} else{
					subDiv2.append(imgDiv);
		    	}
		    }

		    $(dom).find(".page .row img").off("click").click( function(){
		    	var thisDom = $(this);
		    	var id = thisDom.data("id");
		    	cns.debug( id );

		    	var userData = $.lStorage("_stickerHistory");
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
		    	userData.push( {"id":id, "src":thisDom.attr("src")} );
		    	$.lStorage("_stickerHistory", userData);
		    	thisTmp.updateHistory( dom );

		    	var callback = dom.data("callback");
		    	if( null != callback ) callback(id);
		    });
		} else {
			var downloadDom = $("<div class='downloadArea'></div>");

			var info = $("<div class='info'></div>");
			var left = $("<div class='left'></div>");
			left.append("<img src='"+dataObj.l+"'/>");
			info.append(left);

			var right = $("<div class='right'></div>");
			right.append("<div class='name'>"+dataObj.na+"</div>");
			right.append("<div class='price'>"+$.i18n.getString("COMMON_FREE")+"</div>");
			info.append(right);
			downloadDom.append(info);

			downloadDom.append("<div class='download'>"+$.i18n.getString("COMMON_DOWNLOAD")+"</div>");
			content.append(downloadDom);
			
			downloadDom.find(".download").click( function(){
				thisTmp.downloadSticker(type, function(){
					dataObj = thisTmp.splDict[type];
					thisTmp.showImg(dom, type, dataObj, path);
					thisTmp.updatePageInfo(dom);
				});
			});
		}
	},
	updateHistory: function(dom){
	    var userData = $.lStorage("_stickerHistory");
	    try{
		    if( null != userData ){
		    	var object = {
		    		isDownload: true,
		    		sl:[],
		    		spi:history
		    	};
		    	if( userData.length>0 ){
			    	for(var i=userData.length-1; i>=0; i--){
			    		var obj = userData[i];
			    		object.sl.push({sid:obj.id, sou:obj.src});
			    		// keys.push(obj.id);
			    		// values.push(obj.src);
			    	}
					this.showImg( dom, "history", object );
				}
		    }
		} catch(e){
			errorReport(e);
		}
	},
	updatePageInfo: function( dom ){
		var domTmp = $(dom);
	    var currentTp = domTmp.find(".mid").data("type");
	    if( null == currentTp )	return;

	    var tmp = domTmp.find(".mid .group."+currentTp);
	    var maxPg = tmp.data("cnt");

		if( tmp.find(".downloadArea").length>0 || maxPg<=1 ){
			domTmp.children(".pageArea").css("opacity",0);
			domTmp.children(".imgArea").children(".left, .right").css("opacity",0);
			return;
		}
		domTmp.children(".pageArea").css("opacity",1);
		domTmp.children(".imgArea").children(".left, .right").css("opacity",1);


	    //update page dots
	    if( currentTp != domTmp.find(".pageArea").data("type") ){
	    	domTmp.find(".pageArea").html("");
	    	domTmp.find(".pageArea").data("type", currentTp);
	    	if(maxPg<=1) return;

	    	for(var i=0; i<maxPg; i++){
	    		domTmp.find(".pageArea").append("<label class='dot'></label>");
	    	}
	    } else {
	    	if(maxPg<=1) return;
	    	domTmp.find(".pageArea").find(".dot.active").removeClass("active");
	    }

	    var tmp = domTmp.find(".mid .group."+currentTp);
	    var currentPg = tmp.data("index");
	    domTmp.find(".pageArea").find(".dot:eq("+currentPg+")").addClass("active");
	},
	load: function(callback) {
		var thisTmp = this;
		thisTmp.initStickerList( function(){
	    	$.lStorage("_sticker", thisTmp.splDict);
	    	if( callback() ) callback();
	    });

		// if( null==thisTmp.dict ){
		// 	$.get(thisTmp.jsonPath,function(load_dict){
		//         if (thisTmp.dict !== null) {
		//         	$.extend(thisTmp.dict, load_dict);
		//         } else {
		//         	thisTmp.dict = load_dict;
		//         }
		//         cns.debug(thisTmp.dict);
		//         callback();
		//     });
		// } else {
		// 	callback();
		// }
	},
	initStickerList: function( callback ){
		try{
			var thisTmp = this;
			thisTmp.getStickerListApi().complete(function(data){
	        	if(data.status == 200){
	        		var obj =$.parseJSON(data.responseText);

	        		thisTmp.splDict = $.lStorage("_sticker") || {};
	        		var currentCnt = 0;
	        		var cnt = obj.spl.length;
	        		for( var i=0; i<cnt; i++ ){
	        			var tmpObj = obj.spl[i];
	        			if( thisTmp.splDict.hasOwnProperty(tmpObj.spi) ){
	        				var tmpOriObj = thisTmp.splDict[tmpObj.spi];
	        				//update downloaded stickers
	        				if( true==tmpOriObj.isDownload && tmpOriObj.ut<tmpObj.ut ){
	        					thisTmp.getStickerDetailApi(tmpOriObj.spi).complete(function(detailDataTmp){
	        						if(detailDataTmp.status == 200){
	        							var detailData = $.parseJSON(detailDataTmp.responseText);
	        							thisTmp.splDict[tmpObj.spi].sl = $.extend(thisTmp.splDict[tmpObj.spi].sl, detailData);
	        						}
	        						currentCnt++;
	        						if( cnt==currentCnt ){
	        							if( callback() ) callback();
	        						}
	        					});
	        				} else {
	        					currentCnt++;
	        				}
	        				thisTmp.splDict[tmpObj.spi] = $.extend(thisTmp.splDict[tmpObj.spi], tmpObj);
	        			} else {
	        				currentCnt++;
	        				thisTmp.splDict[tmpObj.spi] = tmpObj;
	        			}

	        			if( cnt==currentCnt ){
	        				if( callback() ) callback();
	        			}
	        		}
	        	}
	        });
	    } catch(e){
	    	errorReport(e);
	    	if( callback() ) callback();
	    }
	},
	getStickerListApi: function(){
		var thisTmp = this;
		var api_name = "sticker_packages";
        var headers = {
                 "ui":ui,
                 "at":at, 
                 "li":lang,
                     };
        var method = "get";

        return ajaxDo(api_name,headers,method,false,null);
	},
	getStickerDetailApi: function(spi) {
		var thisTmp = this;
		var api_name = "sticker_packages/"+spi;
        var headers = {
                 "ui":ui,
                 "at":at, 
                 "li":lang,
                     };
        var method = "get";

        return ajaxDo(api_name,headers,method,false,null);
	},
	downloadSticker: function(spi, callback){
		var thisTmp = this;
		thisTmp.getStickerDetailApi(spi).complete(function(data){
	    	if(data.status == 200){
	    		try{
		    		var detailData = $.parseJSON(data.responseText);
		    		if( null!=thisTmp.splDict[spi].sl ){
		    			thisTmp.splDict[spi].sl.extend(detailData.sl);
		    		} else {
		    			thisTmp.splDict[spi].sl = detailData.sl;
		    		}
		    		thisTmp.splDict[spi].isDownload = true;
		    		$.lStorage("_sticker", thisTmp.splDict);
		    	} catch(e){
		    		errorReport(e);
		    	}
	    	}
	    	if( callback ) callback();
	    });
	}
};

