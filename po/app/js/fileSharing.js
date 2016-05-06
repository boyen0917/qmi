var FileSharing = function(){
	this.mainTi = QmiGlobal.groups[gi].ti_file;
	this.listOrder = "append";
	this.ti = this.mainTi;
	this.activeItemData = "";

	this.breadcrumb = [];
	this.fileItemArr = [];

	this.updateBreadcrumb();

	this.init = function(){
		this.reset();
		this.eventBinding();
	}

	this.init();
}

FileSharing.prototype = {
	fileDom: $("div.subpage-fileSharing section.fileSharing"),
	bcArrow: '<img src="images/fileSharing/layer_arrow_icon@2x.png">',
	// 200mb限制
	uploadLimit: 200 * (1024*1024),

	reset: function(){

		this.fileDom.find("section.list").html("").end()
		.find(".operator").hide();

		this.fileItemArr = [];
	},
	eventBinding: function(){
		var thisFile = this;
		var thisFileDom = $("section.fileSharing");
		
		//unbind self and all children
		$("section.fileSharing,section.fileSharing *").off();

		// $("section.fileSharing span.breadcrumb").niceScroll({
		// 	cursorcolor:"rgba(210, 210, 210, 0.4)", 
		// 	cursorwidth: '5',
		// 	cursorborderradius: '10px',
		// 	background: 'rgba(255,255,255,0)',
		// 	cursorborder:"",
		// 	boxzoom:false,
		// 	zindex: 999,
		// 	scrollspeed: 90,
		// 	mousescrollstep: 40
		// });

		thisFileDom.find(".home").click(function(){
			thisFile.ti = thisFile.mainTi;
			thisFile.getList().done(thisFile.updateBreadcrumb.bind(thisFile));
		});
		
		thisFileDom.find(".title .cl2").click(function(){
			var imgArrow = $(this).find("img");
			if(imgArrow.hasClass("asc")){
				thisFile.listOrder = "append";
				imgArrow.removeClass("asc").addClass("desc");
			}else{
				thisFile.listOrder = "prepend";
				imgArrow.removeClass("desc").addClass("asc");
			}
			
			for(i=0;i<thisFile.fileItemArr.length;i++){
				thisFile.fileItemArr[i].render(thisFileDom.find("section.list"),thisFile.listOrder);
			}
		});

		thisFileDom.find(".top img.v-arrow").click(function(){
			if($(this).hasClass("show")){
				$(this).addClass("asc");
				thisFile.showBreadcrumbMore();	
			}
		});

		thisFileDom.find("section.breadcrumb-cover").click(function(){
			thisFileDom.find(".top img.v-arrow").removeClass("asc");
			$(this).hide();
		});
		//more功能
		thisFileDom.find("div.top img.more").click(thisFile.showMore.bind(thisFile));
		//檔案操作 delete download
		thisFileDom.find("span.operator img").click(function(){
			var name = $(this).attr("name");
			if( name === "delete"){
				popupShowAdjust( "",$.i18n.getString("FILESHARING_DELETE_CONFIRM"),true,true,[thisFile.delete.bind(thisFile)]);
			} else {
				thisFile[name]();
			}
		});

		//more
		thisFileDom.find("section.file-cover").click(thisFile.showMore.bind(thisFile));
		thisFileDom.find("section.file-cover ul li:eq(0)").click(thisFile.showGeneralPopup.bind(thisFile,$.i18n.getString("FILESHARING_CREATE_FOLDER"),"createFolder"));
        thisFileDom.find("section.file-cover ul li:eq(1)").click(thisFile.uploadFile.bind(thisFile));


        var generalDom = thisFileDom.find("section.file-cover div.general");
		generalDom.click(function(){event.stopPropagation()})
		.find(".err-msg").html($.i18n.getString("FILESHARING_ERR_MSG")).end()
		.find("button.cancel").html($.i18n.getString("COMMON_CANCEL")).click(thisFile.showMore.bind(thisFile)).end()
		// .find("button.submit").html($.i18n.getString("COMMON_OK")).click(thisFile.createFolder.bind(thisFile)).end()
		.find("input").bind("input",function(){
			var thisVal = $(this).val();
			generalDom.find(".err-msg").css("opacity",0);
			for(i=0;i<thisFile.fileItemArr.length;i++){
				var thisItemObj = thisFile.fileItemArr[i];
				if(thisItemObj.matchFn == thisVal){
					generalDom.find(".err-msg").css("opacity",1);
					return false;
				}
			}
		});

		// 特別event
		// 進入資料夾
		thisFileDom.bind("goToFolder",function(event,itemData){
			cns.debug("goToFolder",itemData);
			// set ti
			thisFile.ti = itemData.ti
			thisFile.getList().done(thisFile.updateBreadcrumb.bind(thisFile,itemData));
		});
		// 下載
		thisFileDom.bind("download",function(){
			thisFile.download();
		});

		thisFileDom.bind("setItemData",function(event,itemData){
			thisFile.activeItemData = itemData;
		});
	},
	showBreadcrumbMore: function() {
		// var thisFile = this;
		// var thisFileDom = $("section.fileSharing");
		this.fileDom.find("section.breadcrumb-cover").show();
		var moreDom = $("section.fileSharing ul.breadcrumb-more");
		moreDom.find("li:not(:last-child)").remove();

		var moreArr = this.breadcrumb.slice(0,this.breadcrumb.length-3);

		for(i=0;i<moreArr.length;i++){
			var liDom = $('<li><img src="images/fileSharing/folder_icon@2x.png"><span>'+ moreArr[i].fn +'</span></li>');
			liDom.click(function(num){
				cns.debug("moreArr",{moreArrI:moreArr,i:num});
				this.fileDom.find("section.breadcrumb-cover").click().end()
				.trigger("goToFolder",moreArr[num]);
			}.bind(this,i));

			moreDom.prepend(liDom);
		}
	},
	updateBreadcrumb: function(itemData){
		var $thisBreadcrumb = this.fileDom.find(".breadcrumb");
		$thisBreadcrumb.html("");
		// cns.debug("bcArr",this.breadcrumb);
		//顯示more 箭頭
		this.fileDom.find(".top img.v-arrow").removeClass("show");

		if(typeof itemData != "undefined") {
			var chk = false;
			//舊的路徑
			for(i=0;i<this.breadcrumb.length;i++){
				if(this.breadcrumb[i].fi == itemData.fi) {
					this.breadcrumb = this.breadcrumb.slice(0,(i+1));
					chk = true;
					break;
				}
			}
			//新增路徑
			if(chk === false) this.breadcrumb.push(itemData);

			//只顯示三個
			var last3Arr = this.breadcrumb.slice(-3);
			
			for(i=0;i<last3Arr.length;i++){
				var thisBc = last3Arr[i];
				var $thisPath = $("<span>").html(thisBc.fn);
				$thisBreadcrumb.append(this.bcArrow).append($thisPath);

				$thisPath.click(function(){
					this.fsObj.ti = this.thisBc.ln.ti;
					this.fsObj.getList();
					this.fsObj.updateBreadcrumb(this.thisBc);
				}.bind({fsObj:this,thisBc:thisBc}));
			}
		}else{
			//首頁
			this.breadcrumb = [];
		}

		if(this.breadcrumb.length > 3) this.fileDom.find(".top img.v-arrow").addClass("show");
	},
	showMore: function(){
		var thisFile = this;
		var coverDom = thisFile.fileDom.find("section.file-cover");
		coverDom.find("ul").show().end()
		.find(".general").hide();

		if(coverDom.is(":visible")){
			coverDom.hide();
		}else{
			coverDom.show();
		}
	},
	showGeneralPopup: function(title,action){
		event.stopPropagation();
		var thisFile = this,
		coverDom = this.fileDom.find("section.file-cover");
		coverDom.show().find("ul").hide().end()
		.find("div.general .title").html(title).end()
		.find("div.general").show().end()
		.find("button.submit").unbind("click").click(thisFile.generalSubmitChk.bind(thisFile,action)).end()
		.find("input").val("");
	},
	generalSubmitChk: function(action){
		var name = this.fileDom.find("section.file-cover .general input").val();
		if(this.fileDom.find("section.file-cover .err-msg").attr("opacity") == 1 ){
			return false;
		}else if (name.length == 0){
			toastShow($.i18n.getString("FILESHARING_EMPTY_MSG"));
			return false;
		}else{
			this[action](name);
		}
	},
	createFolder: function(){
		var thisFile = this;
		var coverDom = thisFile.fileDom.find("section.file-cover");
		var folderName = coverDom.find("input").val();
		thisFile.fileDom.find("section.file-cover").trigger("click");
		var deferred = $.Deferred();
		$.when(new QmiAjax({
			apiName: "groups/" + gi + "/files/",
			method: "post",
			body: {
				tp: 10,
				ti: thisFile.ti
			},
			error: function(data){
				deferred.reject({response:data,api:1});
			}
		})).then(function(data){
			cns.debug("when data 1",data);
			return (new QmiAjax({
				apiName: "groups/" + gi + "/timelines/"+ thisFile.ti +"/events",
				method: "post",
				body: {
					meta: {
						tt: "",
						tp: "09",
						lv: 1
					}, 
					ml: [
						{
							fi: data.fi,
							ftp: 1,
							fn: folderName,
							ln: { ti:data.ln.ti},
							tp: 26 
						}
					]
				},
				error: function(data){
					deferred.reject({response:data,api:2});
				}
			})).then(function(data){
				deferred.resolve(data);
			});
		});

		deferred.done(function(data){
			cns.debug("成功喲",data);
			toastShow($.i18n.getString("FILESHARING_CREATE_SUCCESS"))
		}).fail(function(data){
			cns.debug("fileSharing createFolder error ",data);
		}).always(function(){
			thisFile.getList();
		});
	},
	getList: function(){
		var deferred = $.Deferred();
		// 注意誰是this
		new QmiAjax({
			apiName: "groups/" + gi + "/timelines/"+ this.ti +"/events",
			complete: function(data){
				//確認完成
				deferred.resolve();

				if(data.status != 200) return false;

				this.reset();

				var fileList = JSON.parse(data.responseText).el,
				fiArr = this.fileItemArr;
				// cns.debug("fileList",JSON.stringify(fileList,null,2));
				for(i=0;i<fileList.length;i++) {
					fiArr.push(new FileItem(fileList[i]));
				}
				//排序 desc
				fiArr.sort(function(a, b) {return b.meta.ct - a.meta.ct });

				for(i=0;i<fiArr.length;i++){
					fiArr[i].render($("section.fileSharing section.list"),this.listOrder);
				}
			}.bind(this)
		});

		return deferred.promise();
	},
	download: function(){
		new QmiAjax({
			apiName: "groups/" + gi + "/timelines/" + this.ti + "/files/" + this.activeItemData.fi + "/dl",
			method: "post",
			complete: function(data){
				if(data.status != 200) return false;

				cns.debug("dl data",data);
				// alert("...");
				var s3Data = JSON.parse(data.responseText);
				if(typeof s3Data == "undefined") toastShow("檔案錯誤");
				var dlData = JSON.parse(data.responseText);
				var link = document.createElement('a');
			    link.download = this.activeItemData.fn;

			    var dlUrl = dlData.s3;
			    if( dlData.s32.length > 0 ) dlUrl = dlData.s32;

			    link.href = dlUrl;
			    link.click();

			}.bind(this)
		});
	},

	uploadFile: function(){
		event.stopPropagation();
		var thisFile = this;
		var coverDom = thisFile.fileDom.find("section.file-cover");

		window.fsObjj = thisFile;


		if(thisFile.fileDom.find("section.progress-bar").length == 0){
			var progressSectionDom = $('<section class="progress-bar"><div class="frame"><div class="progress"></div><div class="text">0%</div></div></section>');	
			coverDom.append(progressSectionDom);

			progressSectionDom.click(function(){event.stopPropagation()})
		}else{
			var progressSectionDom = thisFile.fileDom.find("section.progress-bar");

		}

		// reset
		thisFile.setUploadProgress(0,true);

		// return false;
		
		var inputFileDom = thisFile.fileDom.find("input[type=file]");

		// 開啓選擇檔案
		inputFileDom.trigger("click");

		// 關閉上傳
		coverDom.hide();


		inputFileDom.off().on('change',function(e){
			coverDom.show();
			var fileData = $(this)[0].files[0];
			
			//每次選擇完檔案 就reset input file
			$(this).replaceWith( $(this).val('').clone( true ) );

			// 大於上傳限制
			if(fileData.size > thisFile.uploadLimit) {
				toastShow($.i18n.getString("FILESHARING_UPLOAD_OVERLIMIT"));
				return false;
			}

			for(i=0;i<thisFile.fileItemArr.length;i++){
				var thisItemObj = thisFile.fileItemArr[i];
				if(thisItemObj.fn == fileData.name){
					toastShow($.i18n.getString("FILESHARING_ERR_MSG"));
					return false;
				}
			}

			coverDom.addClass("disable");
			thisFile.fileDom.find("section.file-cover ul").hide();


			progressSectionDom.show();

			var 
			fileTp = 0,
			fiApiData = {},
			s3DefArr = [], // pic -> s3 s32,  video -> s32(temporary) ,others -> s3 only
		    uploadDeferred = $.Deferred(), // 上傳完成 deferred
			fileOnloadDeferred = MyDeferred(); // 按順序完成的專用deferred
			
		    switch(true){

		      case fileData.type.match("image") instanceof Array:
		        fileTp = 1;

		        thisFile.fileReader({
		        	file: fileData,
		        	tagName: "img",
		        	onload: "onload"
		        }).done(function(fileReaderData){
		        	//大小圖都要縮圖
	                var thumbnailImgObj = imgResizeByCanvas(fileReaderData,0,0,120,120,0.6);

					s3DefArr = [{
						s3: "s3",
						contentType: " ",
						file: thumbnailImgObj.blob
					},{
						s3: "s32",
						contentType: " ",
						file: fileData
					}];

	                fileOnloadDeferred.resolve();
		        })

		        break;
		      case fileData.type.match("video") instanceof Array:
		        fileTp = 2;

		        s3DefArr = [{
					s3: "s32",
					contentType: "video/mp4",
					file: fileData
				}];

				fileOnloadDeferred.resolve();

		        break;
		     
		      default:
		        // contentType暫時通用 " "
		      	s3DefArr.push({
					s3: "s3",
					contentType: " ",
					file: fileData
				})

		      	fileOnloadDeferred.resolve();
		    }

		    // 完成上傳前準備 因為要取得檔案的onloaded
		    fileOnloadDeferred.then(function(){
		    	thisFile.setUploadProgress(0.05);

		    	var tmpDeferred = MyDeferred();
				// step1 取得上傳網址
			    new QmiAjax({
					apiName: "groups/" + gi + "/files/",
					method: "post",
					body: {
						tp: fileTp,
						ti: thisFile.ti
					},
					error: function(errData){
						uploadDeferred.reject({response:errData,api:1});
					},
					success: tmpDeferred.resolve
				});

		    	return tmpDeferred;
		    // step2 進行s3 上傳
		    }).then(function(data){
		    	thisFile.setUploadProgress(0.05);

		    	var tmpDeferred = MyDeferred();
		    	fiApiData = data;
		    	
		    	// s3DefArr
		    	$.when.apply( {}, s3DefArr.map(function(item){

		    		item.url = fiApiData[item.s3] ;
		    		return thisFile.uploadToS3TmpDef(item)

		    	})).done(tmpDeferred.resolve)
		    	.fail(function(errData){
		    		uploadDeferred.reject({response: errData,api:"upload to s3"});
		    	})

		    	return tmpDeferred;
		    // commit 
		    }).then(function(){
		    	thisFile.setUploadProgress(0.8);
		    	var tmpDeferred = MyDeferred();
		    	
		    	new QmiAjax({
					apiName: "groups/" + gi + "/files/"+ fiApiData.fi +"/commit",
					method: "put",
					body: {
				    	ti: thisFile.ti, 
				    	tp: fileTp,
						mt: fileData.type || "text",
						si: fileData.size,
						md: {w:100,h:100,l:100}
					},
					error: function(errData){
						uploadDeferred.reject({response:errData,api:"commit",});
					},
					
					success: tmpDeferred.resolve
				})
				return tmpDeferred;
				
		    }).then(function(data){
		    	
		    	thisFile.setUploadProgress(0.05);

		    	new QmiAjax({
					apiName: "groups/" + gi + "/timelines/"+ thisFile.ti +"/events",
					method: "post",
					body: {
				    	meta: {
							tt: "",
							tp: "08",
							lv: 1
						}, 
						ml: [{
					    	fi: fiApiData.fi,
					    	ftp: "0",
					    	fn: fileData.name,
					    	c: "It's a File",
					    	si: fileData.size,
					    	tp: 26 // ?
						}]
					},
					error: function(errData){
						uploadDeferred.reject({response: errData,api:"post file"});
					},
					success: uploadDeferred.resolve
				})
		    })


		    uploadDeferred.done(function(data){
				toastShow($.i18n.getString("FILESHARING_UPLOAD_SUCCESS"))
			}).fail(function(data){
				cns.debug("error ",data);
			}).always(function(){
				thisFile.setUploadProgress(0.05);
				

				setTimeout(function(){
					coverDom.removeClass("disable").trigger("click").find("ul").show();
					progressSectionDom.hide()
				},100);
				
				thisFile.getList();
			});

		    
		});// inputFileDom change 
	},

	fileReader: function(args){
		var 
		deferred = $.Deferred(),
		reader = new FileReader();

		reader.readAsDataURL(args.file);
		reader.onloadend = function() {
			var 
			fileDom = document.createElement(args.tagName);
			fileDom.src = reader.result;
			fileDom[args.onload] = function(){
				deferred.resolve(this);
			}
		}
		return deferred.promise();
	},

	getVideoScreenshot: function(video){
	  	var tempW = video.videoWidth;
		var tempH = video.videoHeight;

		var canvas = document.createElement('canvas');
		canvas.width = tempW;
		canvas.height = tempH;
	  	canvas.getContext("2d").drawImage(video, 0, 0, tempW, tempH);

		canvas.toDataURL("image/png")

		var dataURL = canvas.toDataURL("image/png");

		return dataURItoBlob(dataURL);
	},

	setUploadProgress: (function(){
		originProgress = 0;

		// 百分比, bool 累計, bool 從零開始
	    return function( percentage, reset, increment ){

	    	if( reset === true ) originProgress = 0;
	    	// 累計
	    	if( increment === undefined ) {
	    		originProgress += percentage;
	    		currentProgress = originProgress;
	    	} else {
	    		currentProgress = percentage + originProgress;	
	    	}

	    	$("section.fileSharing section.progress-bar")
		    .find(".progress").css('width', '' + (148 * currentProgress) + 'px').end()
		    .find(".text").html(Math.round( 100 * currentProgress) + "%" );
	    }
	})(),

	uploadToS3TmpDef: function (options) {
		var thisFile = this;

		return $.ajax({
			url: options.url,
			type: 'PUT',
			contentType: options.contentType,
		 	data: options.file, 
			processData: false,
			xhr: function() {
				var xhr = new window.XMLHttpRequest();
				xhr.upload.addEventListener('progress', function(e) {
					if( e.lengthComputable ) thisFile.setUploadProgress(( 0.8 * e.loaded / e.total ), false, true );
				});
				return xhr;
			}
		})
	},

	rename: function() {
		this.showGeneralPopup($.i18n.getString("FILESHARING_RENAME"),"renameExecute");
	},
	renameExecute: function(name) {
		cns.debug("active data",this.activeItemData);
		var 
		thisItem = this.activeItemData ,
		newName = (thisItem.ti === null) ? name + (thisItem.fn.substring(thisItem.fn.lastIndexOf("."))) : name,

		// 預設是檔案 下方再判斷是否為資料夾
		body = {
			meta: {
				tt: "",
				tp: "U8",
				lv: 1
			}, 
			ml: [
				{	
					ftp: 0,
					fi: thisItem.fi,
					fn: newName,
					si: thisItem.si ,
					tp: 26 
				}
			]
		};


		//資料夾
		if( thisItem.meta.tp == "09"){
			body.ml[0].ln = {
				ti: thisItem.ti
			};
			body.meta.tp = "U9";
			body.ml[0].ftp = 1;

			delete body.ml[0].si;
			
		}

		cns.debug("rename",body);
		new QmiAjax({
			// /groups/{gi}/timelines/{ti}/events/{ei}
			apiName: "groups/" + gi + "/timelines/"+ this.ti +"/events/"+ this.activeItemData.ei,
			method: "post",
			body: body,
			complete: function(data){
				this.fileDom.find("section.file-cover").trigger("click")
				this.getList();
				if(data.status == 200) {
					toastShow($.i18n.getString("USER_PROFILE_UPDATE_SUCC"));	
				}
			}.bind(this)
		})
	},
	delete: function(){
		new QmiAjax({
			// /groups/{gi}/timelines/{ti}/events/{ei}
			apiName: "groups/" + gi + "/timelines/"+ this.ti +"/events/"+ this.activeItemData.ei,
			method: "delete",
			complete: function(data){
				
				if(data.status == 200) {
					this.getList().done(function(){
						toastShow($.i18n.getString("FILESHARING_DELETE_OK"));	
					});
					
				}
			}.bind(this)
		})
	}
}

// Main Object
var mainObj = {};

//FileItem Object
var FileItem = function(data){
	this.ei = data.ei;
	this.meta = data.meta;
	this.dom = {};
	$.extend(this,data.ml[0]);
	
	if(typeof data.ml[0].ln != "undefined") {
		this.ti = data.ml[0].ln.ti; 
		this.matchFn = this.fn;
	} else {
		this.ti = null;
		this.matchFn = this.fn.substring(0,this.fn.lastIndexOf("."));
	}

	this.init();
}

FileItem.prototype = {
	fileDom: $("section.fileSharing"),
	imgTypeMap: {
		imgPath: "images/fileSharing/",
		default: "otherfile_icon@2x.png",
		mp4: "video_icon@2x.png",
		jpg: "photo_icon@2x.png",
		png: "photo_icon@2x.png",
		ppt: "ppt_icon@2x.png",
		doc: "word_icon@2x.png",
		csv: "excel_icon@2x.png",
		xls: "excel_icon@2x.png",
		xlsx: "excel_icon@2x.png",
		folder: "folder_icon@2x.png"
	},
	getFileIcon: function(fn){
		var ext = fn.substring(fn.lastIndexOf(".")+1);
		if(typeof this.imgTypeMap[ext] != "undefined"){
			return this.imgTypeMap.imgPath + this.imgTypeMap[ext];
		}else{
			return this.imgTypeMap.imgPath + this.imgTypeMap.default;	
		}
	},
	fileItemHtml: 
		'<div class="row">' +
	    '    <span class="cl1">' +
	    '        <img class="icon">' +
	    '        <span>...</span>' +
	    '    </span>' +
	    '    <span class="cl2"></span>' +
	    '    <span class="cl3"></span>' +
	    '</div>'
	,
	render: function(container,order){
		container[order](this.dom);
	},
	init: function(){
		var $thisItem = this.dom = $(this.fileItemHtml);
		if(this.ti != null){
			$thisItem.find(".cl1 img").attr("src",this.getFileIcon("folder")).end()
			.find(".cl3").html("--");
		}else{
			$thisItem.find(".cl1 img").attr("src",this.getFileIcon(this.fn)).end()
			.find(".cl3").html(this.fileSizeTrans(this.si));
		}

		$thisItem.find(".cl1 span").html(this.fn).end()
		.find(".cl2").html(this.timeFormat(this.meta.ct));
		
		this.eventBinding($thisItem);
	},
	eventBinding: function($thisItem){
		var thisItemObj = this;
		var thisFileDom = this.fileDom;
		$thisItem.children().unbind();

		$thisItem.click(function(){
 			//folder
			if(thisItemObj.ti != null){
				thisFileDom.find(".operator [name=download]").hide();
			}else{
				thisFileDom.find(".operator [name=download]").show();
			}
			cns.debug("thisItemObj",thisItemObj);
			thisFileDom.find("div.row").removeClass("fs-active").end()
			.find(".operator").show();
			$(this).addClass("fs-active");

			thisFileDom.trigger("setItemData",thisItemObj);
			
		});

		$thisItem.dblclick(function(){

			if(thisItemObj.ti != null){
				thisFileDom.trigger("goToFolder",thisItemObj);
				// thisFileDom.trigger("setItemData",null);
			}else{
				thisFileDom.trigger("download");
			}
		});
	},

	timeFormat: function(milliSec){
		var d = new Date(milliSec);

	    var timeStr = d.getFullYear() +"/"+ 
	    transfer(d.getMonth()+1) +"/"+ 
	    transfer(d.getDate()) +" "+ 
	    transfer(d.getHours()) +":"+ 
	    transfer(d.getMinutes()) +":"+ 
	    transfer(d.getSeconds());

	    return timeStr;

	    function transfer(n){
			n = n.toString();
			return n.length == 1 ? "0"+n : n;
	    }
	},
	fileSizeTrans: function (si){
		if(si < 900) 
			return Math.round(si*10)/10+" byte";

		if((si/1024) < 900)
			return Math.round(si/1024*10)/10+" kb";
		
		return Math.round(si/1024/1024*10)/10+" mb";
	}
}