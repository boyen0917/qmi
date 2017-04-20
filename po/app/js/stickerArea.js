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
	init: function( dom, onSelect, clickShopFun){
		var thisTmp = this;
		thisTmp.domList.push(dom);
		dom.data("callback",onSelect);
		dom.html("");
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

	    	var stickerSetDom = $("<div class='sticker-shop'></div>");

	    	stickerSetDom.off("click").on("click", function () {

	    		// 點擊貼圖中心icon的後續動作
	    		if (clickShopFun) clickShopFun();

	    		// 視窗不是聊天室，就不要在此視窗打開貼圖中心
	    		if (!window.ci) stickerSetDom.StickerStore();
	    		// dom.siblings(".st-reply-message-area")
	    		//    .find("img.st-reply-message-sticker")
	    		//    .trigger("click");
	    	});

	    	thisTmp.splDict = $.lStorage("_sticker") || {};
	    	thisTmp.isUpdated = true;
	    	for( var key in thisTmp.splDict ){
	    		var obj = thisTmp.splDict[key];
	    		var cataBtn = $("<div class='cata'></div>");
	    		// var imgPath = thisTmp.path+key+"/{0}.png";
	    		var img = $("<img/>");

	    		if (obj.hasOwnProperty("list")) {
	    			img.attr("src", obj.l );
		    		cataBtn.append(img);
		    		cataBtn.data("type", key );
		    		catagory.append(cataBtn);

		    		// var localObj = thisTmp.dict[key];
		    		thisTmp.showImg(dom, key, obj );
	    		}
	    		
	    	}

	    	catagory.append(stickerSetDom);

	    	$(dom).find(".cata").off("click").click( function(){
	    		var type = $(this).data("type");
	    		var stickerData;
	    		if (type == "history") {
	    			stickerData = $.lStorage("_stickerHistory");
	    		} else if ($.lStorage("_sticker").hasOwnProperty(type)){
	    			stickerData = $.lStorage("_sticker")[type].list;
	    		}

	    		if (Array.isArray(stickerData) && stickerData.length > 8) {
	    			$(dom).find(".imgArea .left").show();
	    			$(dom).find(".imgArea .right").show();
	    		} else {
	    			$(dom).find(".imgArea .left").hide();
	    			$(dom).find(".imgArea .right").hide();
	    		}
	    		
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
		console.log(dataObj)
		var thisTmp = this;
		var content = $(dom).find(".mid .group."+type);
		if( null==content || content.length <= 0 ){
		    content = $("<div class='group'></div>");
		    if( !$(dom).find(".cata.active").hasClass(type) ){
				content.css("display","none");
		    }
		    content.css("left","0");
		    content.data("index",0);
		    content.data("cata-type", type);
		    content.addClass(type);
			var imgContent = $(dom).find(".mid");
		    imgContent.append(content);
		}
		// console.log(dataObj);
		// if( true==dataObj.isDownload && dataObj.list && Object.keys(dataObj.list).length>0 ){
		if(dataObj.list && Object.keys(dataObj.list).length > 0 ){
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
		    	st = $("<img class='stImg' src="+obj.sou+">");
		    	st.data( "id", obj.sid );
		    	st.error( function(){
					$(this).addClass("error");
					$(this).attr("src", "images/chatroom/chat_chatroom_icon_nosent.png");
				});
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
		    	var type = thisDom.parents(".group").data("cata-type");
		    	if( thisDom.hasClass("error") ){
		    		thisTmp.downloadSticker(type, function(spi){
					// thisTmp.getStickerDetailApi(type).complete(function(detailDataTmp){
		   //      		if(detailDataTmp.status == 200){
		   //      			var detailData = $.parseJSON(detailDataTmp.responseText);
		   //      			if(detailData &&detailData.sl) detailData = detailData.sl;
		   //      			if( !thisTmp.splDict[type] ) thisTmp.splDict[type] = {};
			  //       		thisTmp.splDict[type].list = {};
		   //      			for(var j=0; j<detailData.length; j++){
		   //      				thisTmp.splDict[type].list[detailData[j].sid] = detailData[j];
		   //      			}
		   //      			$.lStorage("_sticker",thisTmp.splDict);

		   //      			//redraw
		   //      			thisTmp.showImg(dom, type, thisTmp.splDict[type] );

		        			//sync
		    				$("#send-sync-sticker-signal").attr("data-sid", spi);
		    				$("#send-sync-sticker-signal").click();
		        		// }
		        	});
		        	return;
				}

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
			    if( userData.length>40 ){
				    userData.splice(0, userData.length-40);
			    }
		    	$.lStorage("_stickerHistory", userData);
		    	thisTmp.showHistory( dom );

		    	$("#send-sync-sticker-signal").removeAttr("data-sid");
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
		    if( null != userData && userData.length > 0){
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
		    } else {
		    	dom.find(".imgArea .left").hide();
		    	dom.find(".imgArea .right").hide();
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
		try{
			thisTmp.splDict = $.lStorage("_sticker") || {};
			thisTmp.onInitSucc( newList, callback );
			// thisTmp.getStickerListApi().complete(function(data){
	  //       	if(data.status == 200){
	  //       		var obj = $.parseJSON(data.responseText);

	  //       		// //for order test
	  //       		// data.responseText = '{"spl":[{"spi":"chtbaby","na":"中華電信萌寶","l":"https://s3.hicloud.net.tw/project-o/stickers/dee069351f7bf0b9641dc80152c201389cf05ccd/20150416_194815/019644e37efcbdf884c53e6afca3980fd0989a86","ut":1429184897345},{"spi":"mrpig","na":"Mr. Pig","l":"https://s3.hicloud.net.tw/project-o/stickers/6754a06d993ced8d11049c0c30704779dd989bec/20150416_194815/5547f6bc90f611f5419505e0948f8f3d3e24553f","ut":1429184897114},{"spi":"pinkgirl","na":"朱瑪","l":"https://s3.hicloud.net.tw/project-o/stickers/f7dfe35319ec9ffeffcb6005caf3bcf50f6fcd43/20150416_194815/34dfefc2589b73ecadfd32e7da529429da0ea7d8","ut":1429184897114},{"spi":"piglovers","na":"Mr. Pig&朱瑪(情侶篇)","l":"https://s3.hicloud.net.tw/project-o/stickers/e4439783f8ff111caedf2021b1d0a18eaa194f31/20150416_194815/a7fa15370817aa025a75111e6261a136e8c63152","ut":1429184897114},{"spi":"dogncat-common-2015-1","na":"古意汪&奸詐喵","l":"https://s3.hicloud.net.tw/project-o/stickers/d7e647f03eeea4109faaf41f15504978f36c532e/20150416_194815/26f7235a5607f4146981e7a3ac9c8b3279c04942","ut":1429184897114},{"spi":"mrpig-duanwu-2015-1","na":"Mr. Pig一起慶端午","l":"https://s3.hicloud.net.tw/project-o/stickers/b8d6ff499a9e339515e4e400ac11aaac8bbb4ccd/20150617_193558/8e6a91127f6c54978ead992458e15b95e4dd06d3","ut":1434540960763},{"spi":"mrpig-motherday-2015-1","na":"Mr. Pig(母親節限定)","l":"https://s3.hicloud.net.tw/project-o/stickers/ea3281003b6e5b949047ef7a92411e8ddb88914b/20150506_173633/7a7c2e2a7df7723559e76bd6227052cc6dd20884","ut":1430904995441},{"spi":"mrpig-slaveday-2015-1","na":"Mr. Pig(勞動節限定)","l":"https://s3.hicloud.net.tw/project-o/stickers/4ac94c9679bc470773a36f8d0160ea9291f9b573/20150428_143355/e1b8e9b202fb81a77d9f90b97b9658929d8aaf74","ut":1430202837002},{"spi":"piglovers-child-2015-1","na":"Mr. Pig&朱瑪(童年篇)","l":"https://s3.hicloud.net.tw/project-o/stickers/f3a9f0f9d2ef67f0fabf6ddcf662a1e7e111780f/20150416_194815/8f5c1e6f0e67ea2be8f400b0accc0b1c5d9d7820","ut":1429184897114},{"spi":"mrpig-chow-2015-1","na":"Mr. Pig向星爺致敬","l":"https://s3.hicloud.net.tw/project-o/stickers/d0da82af8462b5f35ec88041ac3b26024808ce1b/20150617_193558/fa999a13d4438cc263166ebf3ab06c6c6729f75a","ut":1434540960763},{"spi":"mrpig-summer-2015-1","na":"Mr. Pig放暑假","l":"https://s3.hicloud.net.tw/project-o/stickers/aa37bd70677e4937b348f81f73b200ab0cb7081a/20150703_143311/591e4604a9538058680df13c91cf49eb8aa9254f","ut":1435905192522},{"spi":"mrpig-life-2015-1","na":"Mr. Pig(生活時事篇)","l":"https://s3.hicloud.net.tw/project-o/stickers/4491506ab39e879ee95c5fe17ffac6b7fe9e2ca6/20150416_194815/91aa76a164270d46c086397cf8b7b0b831c993ca","ut":1429184897114},{"spi":"piglovers-valentine-2015-1","na":"Mr. Pig&朱瑪(情人節限定)","l":"https://s3.hicloud.net.tw/project-o/stickers/7bfd3cc090a8036cdda2971ef737cfc5f2277bd8/20150416_194815/7a5d05c10bb9fe76d720d2b57a56f667c29a8056","ut":1429184897114},{"spi":"piglovers-newyear-2015-1","na":"Mr. Pig&朱瑪(新年限定)","l":"https://s3.hicloud.net.tw/project-o/stickers/e4aab0391914b7c0237be732b198b85df60401a6/20150416_194815/d76f5b680bdd73ce2987187b0ffc198ae5b25e49","ut":1429184897114},{"spi":"cacique","na":"淘氣酋長","l":"https://s3.hicloud.net.tw/project-o/stickers/bd976127d6f288d9b2dac97518674e0ab33f5f36/20150416_194815/e1b7b86361930f4d0d50eba7518fe401cf7ef15b","ut":1429184897114},{"spi":"fatlady","na":"發福大嬸","l":"https://s3.hicloud.net.tw/project-o/stickers/14efcd3ad708812302c5a9daf7a86965eb267b9d/20150416_194815/e8bfd4888c794e7208c88f8f62be0dee2d881acb","ut":1429184897114},{"spi":"curlsman","na":"吊帶褲大叔","l":"https://s3.hicloud.net.tw/project-o/stickers/55559f63e69aed6242e6237e477b570dd8c7964e/20150416_194815/8a769874adf5acd9371472da61a7f5455f97c256","ut":1429184897114},{"spi":"shinegirl","na":"閃亮女孩","l":"https://s3.hicloud.net.tw/project-o/stickers/0782ed7f9bd28898d70c38eee7c205f45e1405e4/20150416_194815/d80bb8b41bec2c35ee55b95c14ed5742d8be5a54","ut":1429184897114},{"spi":"stubblemans","na":"鬍渣台客","l":"https://s3.hicloud.net.tw/project-o/stickers/bee28809408f4817ccabfcfba3c69fdd08a075de/20150416_194815/c84b07a542d0f8a9a5fc60044d87f32a0e2b31df","ut":1429184897114}],"rsp_code":0,"rsp_msg":"回傳成功","rsp_success":true}';
	  //       		// obj = $.parseJSON(data.responseText);

	  //       		thisTmp.splDict = $.lStorage("_sticker") || {};
	  //       		var currentCnt = 0;
	  //       		var cnt = obj.spl.length;
	  //       		var newList = {};
	  //       		for( var i=0; i<cnt; i++ ){
	  //       			var tmpNewSpiDetail = obj.spl[i];
	  //       			newList[tmpNewSpiDetail.spi] = tmpNewSpiDetail;

	  //       			if( thisTmp.splDict.hasOwnProperty(tmpNewSpiDetail.spi) ){
	  //       				var oriDetail = thisTmp.splDict[tmpNewSpiDetail.spi];
	  //       				var oriTime = oriDetail.ut;
	        				
	  //       				var extendedDetail = $.extend( oriDetail, newList[tmpNewSpiDetail.spi] );
	        				
	  //       				//update downloaded stickers
	  //       				if( true==extendedDetail.isDownload && extendedDetail.ut!=oriTime ){
	  //       					thisTmp.downloadSticker(extendedDetail.spi, function(spi, result){
	  //       						newList[spi] = result;
	  //       						currentCnt++;
	  //       						if( cnt==currentCnt ){
	  //       							thisTmp.onInitSucc( newList, callback );
	  //       						}
	  //       					}, false);
	  //       				} else {
	  //       					currentCnt++;
	  //       					//將array改存為object, 方便查詢
	  //       					if( null!=extendedDetail.sl && null==extendedDetail.list ){
	  //       						extendedDetail.list = {};
	  //       						var oriList = thisTmp.splDict[tmpNewSpiDetail.spi].sl;
	  //       						for(var j=0; j<oriList.length; j++){
	  //       							extendedDetail.list[oriList[j].sid] = oriList[j];
	  //       						}
	  //       						delete extendedDetail.sl;
	  //       					}
	  //       					newList[tmpNewSpiDetail.spi] = extendedDetail;
	  //       				}

	  //       				// thisTmp.splDict[tmpNewSpiDetail.spi] = $.extend(thisTmp.splDict[tmpNewSpiDetail.spi], tmpNewSpiDetail);
	  //       			} else {
	  //       				currentCnt++;
	  //       				// thisTmp.splDict[tmpNewSpiDetail.spi] = tmpNewSpiDetail;
	  //       			}

	  //       			if( cnt==currentCnt ){
	  //       				thisTmp.onInitSucc( newList, callback );
	  //       			}
	  //       		}
		 //    		// $.lStorage("_sticker", thisTmp.splDict);
	  //       	}
	  //       });
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
        return (new QmiAjax({
        	apiName: "sticker_packages",
        	isPublicApi: true
        }))
	},
	getStickerDetailApi: function(spi) {
		return (new QmiAjax({
        	apiName: "sticker_packages/"+spi,
        	isPublicApi: true
        }))
	},
	getSingleStickerPathApi: function(sid) {
		return (new QmiAjax({
        	apiName: "stickers/"+sid,
        	isPublicApi: true
        }))
	},
	downloadSticker: function(spi, callback, isUpdateDom){
		if(null==isUpdateDom) isUpdateDom = true;
		var thisTmp = this;
		thisTmp.getStickerDetailApi(spi).complete(function(data){
	    	if(data.status == 200){
		    	var result;
	    		try{
		    		var detailData = $.parseJSON(data.responseText);
	        	
	        		// //for order test
		        	// if( spi=="chtbaby"){
		        	// 	data.responseText = '{"sl":[{"sid":"st_chtbaby_12","sou":"https://s3.hicloud.net.tw/project-o/stickers/dee069351f7bf0b9641dc80152c201389cf05ccd/20150416_194815/9a97d5193d0e109d83d7978f969cf6e6fc92f6ad","stu":"https://s3.hicloud.net.tw/project-o/stickers/dee069351f7bf0b9641dc80152c201389cf05ccd/20150416_194815/9a97d5193d0e109d83d7978f969cf6e6fc92f6ad"},{"sid":"st_chtbaby_1","sou":"https://s3.hicloud.net.tw/project-o/stickers/dee069351f7bf0b9641dc80152c201389cf05ccd/20150416_194815/10a9c0e8c0996261b283064e2de7a5c37e850230","stu":"https://s3.hicloud.net.tw/project-o/stickers/dee069351f7bf0b9641dc80152c201389cf05ccd/20150416_194815/10a9c0e8c0996261b283064e2de7a5c37e850230"},{"sid":"st_chtbaby_3","sou":"https://s3.hicloud.net.tw/project-o/stickers/dee069351f7bf0b9641dc80152c201389cf05ccd/20150416_194815/512ab7293871c5ae70a6ae4f9cdbfa53e543ef34","stu":"https://s3.hicloud.net.tw/project-o/stickers/dee069351f7bf0b9641dc80152c201389cf05ccd/20150416_194815/512ab7293871c5ae70a6ae4f9cdbfa53e543ef34"}],"rsp_code":0,"rsp_msg":"回傳成功","rsp_success":true}';
		        	// 	detailData = $.parseJSON(data.responseText);
		        	// }

		    		// if( null!=thisTmp.splDict[spi].sl ){
		    		// 	thisTmp.splDict[spi].sl.extend(detailData.sl);
		    		// } else {
		    		// 	thisTmp.splDict[spi].sl = detailData.sl;
		    		// }
		    		if( null==thisTmp.splDict[spi].list ){
		    			thisTmp.splDict[spi].list = {};
		    		}
		    		detailData.sl.sort( function(a,b){
		    			try{
		    				var splitA = a.sid.split("_");
		    				var splitB = b.sid.split("_");
			    			//"st_mrpig-slaveday-2015-1_1"
			    			return parseInt(splitA[2]) - parseInt(splitB[2]);
			    		} catch(e){
			    			cns.debug("error sid split", a, b);
			    			return -1;
			    		}
		    		});

		    		//另存detail
		    		var _stickerDetail = $.lStorage("_stickerDetail") || {};
		    		for( var i=0; i<detailData.sl.length; i++ ){
		    			var thisStkr = detailData.sl[i];
		    			_stickerDetail[thisStkr.sid] = thisStkr;
		    		}

		    		$.lStorage("_stickerDetail",_stickerDetail);

		    		thisTmp.splDict[spi].list = detailData.sl;

		    		thisTmp.splDict[spi].isDownload = true;
		    		result = thisTmp.splDict[spi];
		    		$.lStorage("_sticker", thisTmp.splDict);
		    		// $.lStorage("_stickerDetail", detailData.sl);
		    		if(isUpdateDom) thisTmp.updateTypeInDomList( spi );
		    		$("#send-sync-sticker-signal").removeAttr("data-sid");
		    		$("#send-sync-sticker-signal").click();
		    	} catch(e){
		    		errorReport(e);
		    		if( callback ) callback(spi,result);
		    	}
	    	}
	    	if( callback ) callback(spi,result);
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

	//get sticker detail picture
	getStickerPath: function(sid, callback){
		var _stickerDetail = $.lStorage("_stickerDetail") || {};
		if(_stickerDetail[sid] !== undefined) {

			callback(_stickerDetail[sid].sou);

		} else {
			new QmiAjax({
	        	apiName: "stickers/"+sid,
	        	isPublicApi: true
	        }).success(function(data){
	        	callback(data.sou);
	        })
		}
	},

	getStickerPath_bak: function(sid, callback){
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
	syncSticker: function( targetSpi ) {
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

		    		if( obj.isDownload != newStickerData[sid].isDownload || targetSpi==sid ){
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

