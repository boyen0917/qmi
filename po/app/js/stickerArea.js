/* 
下載及歷史有改變時會trigger $("#send-sync-sticker-signal")
*/

var initStickerArea= {
	isUpdated: false,
	path: "sticker/",
	jsonPath: "sticker/stickerArea.json",
	// dict: null,
	splDict: null,
	domList: [],
	loadStash:[],
	isInit: false,
	init: function( dom, onSelect ){
		var thisTmp = this;
		thisTmp.domList.push(dom);
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
	    	thisTmp.showPageCount( dom );
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
	    	thisTmp.showPageCount( dom );
	    });
	    imgArea.append(btnRightBtn);

	    //------- mid ---------
	    var pageArea = $("<div class='pageArea'></div>");
	    dom.append(pageArea);

	    //----- botoom -------
	    //history stickers
	    var catagoryContainer = $("<div class='catagory'></div>");
	    catagoryContainer.append("<div class='cataBtn left'></div>");
	    var catagory = $("<div class='content'></div>");
	    var cataHistoryBtn = $("<div class='cata history'></div>");
	    cataHistoryBtn.data("type", "history" );
	    cataHistoryBtn.data("cnt", 0);
	    catagory.append(cataHistoryBtn);
	    catagoryContainer.append(catagory);

	    catagoryContainer.append("<div class='cataBtn right'></div>");

	    dom.append(catagoryContainer);
	    thisTmp.showHistory( dom );

	    catagoryContainer.find(".cataBtn").click(function(){
	    	var thisDom = $(this);
	    	var cata = thisDom.parent().find(".content");
	    	var currentScrollLeft = cata.scrollLeft();
	    	if( thisDom.hasClass("right") ){
	    		cata.animate( { scrollLeft: currentScrollLeft+cata.width() }, 800);
	    	} else {
	    		cata.animate( { scrollLeft: currentScrollLeft-cata.width() }, 800);
	    	}
	    });
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
	    		thisTmp.showPageCount( dom );
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
			singleStickerObject = dataObj.list;
			var arImgCnt = Object.keys(singleStickerObject).length;
			content.html("");
			// var imgPath = thisTmp.path+type+"/{0}.png";
			var pageCnt = Math.ceil(arImgCnt/8);

		    var iRowCnt = 0;
		    var width = Math.floor((1/pageCnt)*100);
			var div = null;
		    var subDiv1 = null;
		    var subDiv2 = null;
			content.css("width",pageCnt*100+"%");
			content.data("cnt",pageCnt);
			var i =0;
			$.each( singleStickerObject, function(key, obj){
		    // for(var i=0; i<arImgCnt; i++){
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
		    		// st = $("<img src="+imgPath.format(singleStickerObject[i])+">");
		    	// }
		    	st = $("<img src="+obj.sou+">");
		    	st.data( "id", key );
		    	imgDiv.append(st);
		    	if( i%8<4 ){
					subDiv1.append(imgDiv);
		    	} else{
					subDiv2.append(imgDiv);
		    	}
		    	i++;
		    });

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
		    	thisTmp.showHistory( dom );

		    	$("#send-sync-sticker-signal").click();
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
					// dataObj = thisTmp.splDict[type];
					// thisTmp.showImg(dom, type, dataObj, path);
					// thisTmp.showPageCount(dom);
				});
			});
		}
	},
	showHistory: function(dom){
	    var userData = $.lStorage("_stickerHistory");
	    try{
		    if( null != userData ){
		    	var object = {
		    		isDownload: true,
		    		list:{},
		    		spi:"history"
		    	};
		    	if( userData.length>0 ){
			    	for(var i=userData.length-1; i>=0; i--){
			    		var obj = userData[i];
			    		object.list[obj.id] = {sid:obj.id, sou:obj.src};
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
	showPageCount: function( dom ){
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
	    	if( callback ) callback();
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
	        		var newList = {};
	        		for( var i=0; i<cnt; i++ ){
	        			var tmpNewSpiDetail = obj.spl[i];
	        			newList[tmpNewSpiDetail.spi] = tmpNewSpiDetail;

	        			if( thisTmp.splDict.hasOwnProperty(tmpNewSpiDetail.spi) ){
	        				var tmpSpiDetail = thisTmp.splDict[tmpNewSpiDetail.spi];
	        				
	        				tmpSpiDetail = $.extend( tmpSpiDetail, newList[tmpNewSpiDetail.spi] );
	        				
	        				//update downloaded stickers
	        				if( true==tmpSpiDetail.isDownload && tmpSpiDetail.ut<tmpNewSpiDetail.ut ){
	        					thisTmp.getStickerDetailApi(tmpSpiDetail.spi).complete(function(detailDataTmp){
	        						if(detailDataTmp.status == 200){
	        							var detailData = $.parseJSON(detailDataTmp.responseText);
	        							
	        							// thisTmp.splDict[tmpNewSpiDetail.spi].sl = $.extend(thisTmp.splDict[tmpNewSpiDetail.spi].sl, detailData);

		        						tmpSpiDetail.list = {};
		        						var oriList = detailData;
		        						for(var j=0; j<oriList.length; j++){
		        							tmpSpiDetail.list[oriList[j].sid] = oriList[j];
		        						}
		        						if( null!=tmpSpiDetail.sl ){
		        							delete tmpSpiDetail.sl;
		        						}
	        						}
	        						newList[tmpNewSpiDetail.spi] = tmpSpiDetail;
	        						currentCnt++;
	        						if( cnt==currentCnt ){
	        							thisTmp.onInitSucc( newList, callback );
	        						}
	        					});
	        				} else {
	        					currentCnt++;
	        					//將array改存為object, 方便查詢
	        					if( null!=tmpSpiDetail.sl && null==tmpSpiDetail.list ){
	        						tmpSpiDetail.list = {};
	        						var oriList = thisTmp.splDict[tmpNewSpiDetail.spi].sl;
	        						for(var j=0; j<oriList.length; j++){
	        							tmpSpiDetail.list[oriList[j].sid] = oriList[j];
	        						}
	        						delete tmpSpiDetail.sl;
	        					}
	        					newList[tmpNewSpiDetail.spi] = tmpSpiDetail;
	        				}

	        				// thisTmp.splDict[tmpNewSpiDetail.spi] = $.extend(thisTmp.splDict[tmpNewSpiDetail.spi], tmpNewSpiDetail);
	        			} else {
	        				currentCnt++;
	        				// thisTmp.splDict[tmpNewSpiDetail.spi] = tmpNewSpiDetail;
	        			}

	        			if( cnt==currentCnt ){
	        				thisTmp.onInitSucc( newList, callback );
	        			}
	        		}
		    		// $.lStorage("_sticker", thisTmp.splDict);
	        	}
	        });
	    } catch(e){
	    	errorReport(e);
	    	if( callback() ) callback();
	    }
	},
	onInitSucc: function( newList, callback){
		var thisTmp = this;
		thisTmp.isInit = true;
	    thisTmp.splDict = newList;
	    $.lStorage("_sticker",thisTmp.splDict);
	    if( null!=callback )	callback();
		if( thisTmp.loadStash.length>0 ){
			for( var i=0; i<thisTmp.loadStash.length; i++ ){
				var obj = thisTmp.loadStash[i];
				getStickerPath(obj.sid,obj.callback);
			}
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
	getSingleStickerPathApi: function(sid) {
		var thisTmp = this;
		var api_name = "stickers/"+sid;
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
		    		// if( null!=thisTmp.splDict[spi].sl ){
		    		// 	thisTmp.splDict[spi].sl.extend(detailData.sl);
		    		// } else {
		    		// 	thisTmp.splDict[spi].sl = detailData.sl;
		    		// }
		    		if( null==thisTmp.splDict[spi].list ){
		    			thisTmp.splDict[spi].list = {};
		    		}
		    		for( var i=0; i<detailData.sl.length; i++ ){
		    			thisTmp.splDict[spi].list[detailData.sl[i].sid] = detailData.sl[i];
		    		}

		    		thisTmp.splDict[spi].isDownload = true;
		    		$.lStorage("_sticker", thisTmp.splDict);
		    		thisTmp.updateTypeInDomList( spi );
		    		$("#send-sync-sticker-signal").click();
		    	} catch(e){
		    		errorReport(e);
		    		if( callback ) callback();
		    	}
	    	}
	    	if( callback ) callback();
	    });
	},
	updateTypeInDomList : function( type ){
		var thisTmp = this;
		var dataObj = thisTmp.splDict[type];
		for( var i=thisTmp.domList.length-1;i>=0; i-- ){
			if( null==thisTmp.domList[i] || thisTmp.domList[i].length==0 ){
				thisTmp.domList.splice(i,1);
			} else {
				thisTmp.showImg(thisTmp.domList[i], type, dataObj);
				thisTmp.showPageCount(thisTmp.domList[i]);
			}
		}
	},
	getStickerPath: function(sid, callback){
		var thisTmp = this;
		if( false==thisTmp.isInit){
			thisTmp.loadStash.push({sid:sid,callback:callback});
			return;
		}
		try{
			if( thisTmp.isUpdated ){

				var spi;
				//針對某一版貼圖名稱無st_
				if( -1==sid.indexOf("st_") ){
					spi = sid.split("_")[0];
				} else {
					spi = sid.split("_")[1];
				}

				if( null!=thisTmp.splDict[spi].list && thisTmp.splDict[spi].list.hasOwnProperty(sid) ){
					callback(thisTmp.splDict[spi].list[sid].sou);
				} else {
					if( null==thisTmp.splDict[spi].list ){
						thisTmp.splDict[spi].list = {};
					}
					thisTmp.getSingleStickerPathApi(sid).complete( function(data){
						if( data.status==200 ){
							var detailData = $.parseJSON(data.responseText);
							if( !thisTmp.splDict.hasOwnProperty(spi) ){
								thisTmp.splDict[spi] = {
									list: {}
								};
							} else if( !thisTmp.splDict[spi].list ){
								thisTmp.splDict[spi].list = {};
							}
							thisTmp.splDict[spi].list[sid] = {
								sid: sid,
								sou: detailData.sou,
								stu: detailData.stu
							};

							callback(thisTmp.splDict[spi].list[sid].sou);
							$.lStorage("_sticker",thisTmp.splDict);
						} else {
							callback("");
						}
					});
				}
			} else {
				thisTmp.load( function(){
					thisTmp.isUpdated = true;
					thisTmp.getStickerPath(sid, callback);
				});
			}
		} catch(e){
			errorReport(e);
		}
	},
	setStickerSrc: function(dom, sid){
		this.getStickerPath(sid, function(path){
			dom.attr("src",path);
		});
	},
	syncSticker: function(){
		var thisTmp = this;
		//no any dom yet, return
		if( !thisTmp.domList || thisTmp.domList.length<=0 ) return;

		var domLength = thisTmp.domList.length;

		//sync history
	    var history = $.lStorage("_stickerHistory");
		if( history ){
		    try{
		    	var object = {
		    		isDownload: true,
		    		list:{},
		    		spi:"history"
		    	};
		    	for(var i=history.length-1; i>=0; i--){
			    		var obj = history[i];
			    		object.list[obj.id] = {sid:obj.id, sou:obj.src};
			    }
				for( var i=0; i<domLength; i++ ){
					var tmpDom = thisTmp.domList[i];
					thisTmp.showImg( tmpDom, "history", object );
				}
			} catch(e){
				errorReport(e);
			}
		}

		//sync downloaded
	    var newStickerData = $.lStorage("_sticker");
		if( newStickerData ){
		    try{
		    	$.each( thisTmp.splDict, function(sid, obj){
		    		if( !newStickerData.hasOwnProperty(sid)
		    			|| !newStickerData[sid] || sid=="history") return;

		    		if( obj.isDownload != newStickerData[sid].isDownload ){
		    			thisTmp.splDict[sid] = newStickerData[sid];
						for( var i=0; i<domLength; i++ ){
							var tmpDom = thisTmp.domList[i];
							thisTmp.showImg( tmpDom, sid, thisTmp.splDict[sid] );
						}
		    		}
		    	});
			} catch(e){
				errorReport(e);
			}
		}
	}
};

