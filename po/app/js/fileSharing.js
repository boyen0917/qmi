var FileSharing = function(){
	this.mainTi = $.lStorage(ui)[gi].ti_file;
	this.listOrder = "append";
	this.ti = this.mainTi;

	this.breadcrumb = [];
	this.fileItemArr = [];

	this.init = function(){
		this.reset();
		this.eventBinding();
	}

	this.init();
}

FileSharing.prototype = {
	fileDom: $("section.fileSharing"),
	bcArrow: '<img src="images/fileSharing/layer_arrow_icon@2x.png">',
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

		thisFileDom.find(".home").click(function(){
			thisFile.ti = thisFile.mainTi;
			thisFile.getList().done(thisFile.updateBreadcrumb.bind(thisFile));
		});
		
		thisFileDom.find(".title .cl2 img").click(function(){
			if($(this).hasClass("asc")){
				thisFile.listOrder = "append";
				$(this).removeClass("asc").addClass("desc");
			}else{
				thisFile.listOrder = "prepend";
				$(this).removeClass("desc").addClass("asc");
			}

			for(i=0;i<thisFile.fileItemArr.length;i++){
				thisFile.fileItemArr[i].render(thisFileDom.find("section.list"),thisFile.listOrder);
			}
		});

		thisFileDom.find("div.top img.more").click(thisFile.showMore.bind(thisFile));

		thisFileDom.find("span.operator img").click(function(){
			var name = $(this).attr("name");
			var fi = thisFileDom.find("div.row.fs-active").data("fi");
			thisFile[name](fi);
		});

		// 特別event
		// 進入資料夾
		thisFileDom.bind("goToFolder",function(event,itemData){
			// set ti
			thisFile.ti = itemData.ti
			thisFile.getList().done(thisFile.updateBreadcrumb.bind(thisFile,itemData));
		});
		// 下載
		thisFileDom.bind("download",function(event,fi){
			thisFile.download(fi);
		});
	},
	updateBreadcrumb: function(itemData){
		var $thisBreadcrumb = this.fileDom.find(".breadcrumb");
		$thisBreadcrumb.html("");

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

			for(i=0;i<this.breadcrumb.length;i++){
				var thisBc = this.breadcrumb[i];
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
	},
	showMore: function(){
		var thisFile = this;
		var coverDom = thisFile.fileDom.find("section.file-cover");
		if(coverDom.length > 0) {
			coverDom.find("ul").show();
			coverDom.find(".general").hide();
			if(coverDom.is(":visible")){
				coverDom.hide();
			}else{
				coverDom.show();
			}
			return false;
		}

        var coverDom = $('<section class="file-cover"><ul class="more"></ul></section>'),
        createLiDom = $("<li>").html($.i18n.getString("FILESHARING_CREATE_FOLDER")).click(thisFile.showMoreContent.bind(thisFile));
        uploadLiDom = $("<li>").html($.i18n.getString("FILESHARING_UPLOAD_FILE")).click(thisFile.uploadFile.bind(thisFile));
		coverDom.find("ul").append(createLiDom).append(uploadLiDom);
		thisFile.fileDom.append(coverDom);

		coverDom.click(thisFile.showMore.bind(thisFile));
	},
	showMoreContent: function(title,action){
		event.stopPropagation();
		var thisFile = this,

		coverDom = this.fileDom.find("section.file-cover");
		coverDom.find("ul").hide();

		if(coverDom.find(".general").length > 0) {
			coverDom.find(".general").show().end()
			.find(".loading").hide().end()
			.find("input").val("");
			return false;
		}
		
		var generalDom = $(
			'<div class="general">'+
			'	<div class="title">'+ $.i18n.getString("FILESHARING_CREATE_FOLDER") +'</div>'+
            '    <div class="input-area"><input type="text"></div>'+
            '	 <div class="err-msg"></div>'+
            '    <div class="confirm">'+
            '		<button class="cancel" data-textid="COMMON_CANCEL"></button>'+
            '       <button class="submit" data-textid="COMMON_OK"></button>'+
            '    </div>'+
			'</div>'
		);
		coverDom.append(generalDom);

		generalDom.click(function(){event.stopPropagation()})
		generalDom.find(".err-msg").html($.i18n.getString("FILESHARING_ERR_MSG")).end()
		.find("button.cancel").html($.i18n.getString("COMMON_CANCEL")).click(thisFile.showMore.bind(thisFile)).end()
		.find("button.submit").html($.i18n.getString("COMMON_OK")).click(thisFile.createFolder.bind(thisFile)).end()
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
	},
	createFolder: function(){
		var thisFile = this;
		var coverDom = thisFile.fileDom.find("section.file-cover");
		var folderName = coverDom.find("input").val();
		if(thisFile.fileDom.find("section.file-cover .err-msg").attr("opacity") == 1 ){
			return false;
		}else if (folderName.length == 0){
			alert("shit");
		}else{
			thisFile.fileDom.find("section.file-cover").trigger("click");
			var deferred = $.Deferred();
			$.when(new AjaxTransfer().execute({
				url: "groups/" + gi + "/files/",
				method: "post",
				body: {
					tp: 10,
					ti: thisFile.ti
				},
				load_show_chk: true,
				error: function(data){
					deferred.reject({response:data,api:1});
				}
			})).then(function(data){
				console.debug("when data 1",data);
				return (new AjaxTransfer().execute({
					url: "groups/" + gi + "/timelines/"+ thisFile.ti +"/events",
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
		}
	},
	getList: function(){
		var deferred = $.Deferred();
		// 注意誰是this
		new AjaxTransfer().execute({
			url: "groups/" + gi + "/timelines/"+ this.ti +"/events",
			complete: function(data){
				//確認完成
				deferred.resolve();

				if(data.status != 200) return false;

				this.reset();

				var fileList = JSON.parse(data.responseText).el,
				fiArr = this.fileItemArr;
				// cns.debug("fileList",JSON.stringify(fileList,null,2));
				for(i=0;i<fileList.length;i++) {
					var itemObj = new FileItem(fileList[i]);
					fiArr.push(itemObj);
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
	download: function(fi){
		new AjaxTransfer().execute({
			url: "groups/" + gi + "/timelines/" + this.ti + "/files/" + fi + "/dl",
			method: "post",
			complete: function(data){
				if(data.status != 200) return false;

				var s3Data = JSON.parse(data.responseText);
				if(typeof s3Data == "undefined") toastShow("檔案錯誤");

				window.location = JSON.parse(data.responseText).s3;
			}.bind(this)
		});
	},
	uploadFile: function(){
		event.stopPropagation();
		var thisFile = this;
		var coverDom = thisFile.fileDom.find("section.file-cover");

		if(thisFile.fileDom.find("div.progress-bar").length == 0){
			var progressSectionDom = $('<section class="progress-bar"><div class="frame"><div class="progress"></div><div class="text">0%</div></div></section>');	
			coverDom.append(progressSectionDom);

			progressSectionDom.click(function(){event.stopPropagation()})
		}else{
			var progressSectionDom = thisFile.fileDom.find("section.progress-bar");
		}
		// return false;
		
		var inputFileDom = thisFile.fileDom.find("input[type=file]");

		inputFileDom.trigger("click");

		inputFileDom.off().on('change',function(e){
			var fileData = $(this)[0].files[0];

			// 大於100MB
			if(fileData.size > 104857600) {
				toastShow($.i18n.getString("FILESHARING_UPLOAD_OVERLIMIT"));
				coverDom.trigger("click");
				return false;
			}

			for(i=0;i<thisFile.fileItemArr.length;i++){
				var thisItemObj = thisFile.fileItemArr[i];
				if(thisItemObj.fn == fileData.name){
					toastShow($.i18n.getString("FILESHARING_ERR_MSG"));
					coverDom.trigger("click");
					return false;
				}
			}

			coverDom.addClass("disable");
			thisFile.fileDom.find("ul").hide();
			var tp = 0;

		    switch(true){
		      case fileData.type.match("image") instanceof Array:
		        tp = 1;
		        break;
		      case fileData.type.match("video") instanceof Array:
		        tp = 2;
		        break;
		    }

		    progressSectionDom.show();
		    
		    var deferred = $.Deferred();
		    var fiApiData = {};
		    $.when(new AjaxTransfer().execute({
				url: "groups/" + gi + "/files/",
				method: "post",
				body: {
					tp: tp,
					ti: thisFile.ti
				},
				error: function(data){
					deferred.reject({response:data,api:1});
				}
			})).then(function(data){
				cns.debug("upload to s3 data",data);
				fiApiData = data;
				return ($.ajax({
					url: data.s3,
					type: 'PUT',
					contentType: " ",
				 	data: fileData, 
					processData: false,
					error: function(data){
						deferred.reject({response:data,api:"upload to s3"});
					},
					xhr: function() {
						var progressDom = progressSectionDom.find(".progress");
						var textDom = progressSectionDom.find(".text");
						var xhr = new window.XMLHttpRequest();
						xhr.upload.addEventListener('progress', function(e) {
							if (e.lengthComputable) {
							    progressDom.css('width', '' + (148 * e.loaded / e.total) + 'px');
							    textDom.html(Math.round(100 * e.loaded / e.total) + "%");
							}
						});
						return xhr;
					}
				}));
			}).then(function(data){
				return (new AjaxTransfer().execute({
					url: "groups/" + gi + "/files/"+ fiApiData.fi +"/commit",
					method: "put",
					body: {
				    	ti: thisFile.ti, 
				    	tp: tp,
						mt: fileData.type,
						si: fileData.size,
						md: {w:100,h:100,l:100}
					},
					error: function(data){
						deferred.reject({response:data,api:"commit"});
					}
				}));
		    }).then(function(data){
		    	return (new AjaxTransfer().execute({
					url: "groups/" + gi + "/timelines/"+ thisFile.ti +"/events",
					method: "post",
					body: {
				    	meta: {
							tt: "",
							tp: "08",
							lv: 1
						}, 
						ml: [
						    {
						    	fi: fiApiData.fi,
						    	ftp: "0",
						    	fn: fileData.name,
						    	c: "It's a File",
						    	si: fileData.size,
						    	tp: 26
							} 
						]
					},
					error: function(data){
						deferred.reject({response:data,api:"post 2"});
					}
				}));
		    }).then(function(data){
		    	deferred.resolve(data);
		    });

		    //每次選擇完檔案 就reset input file
			$(this).replaceWith( $(this).val('').clone( true ) );

		    deferred.done(function(data){
				cns.debug("成功",data);
				toastShow($.i18n.getString("FILESHARING_UPLOAD_SUCCESS"))
			}).fail(function(data){
				cns.debug("error ",data);
			}).always(function(){
				coverDom.removeClass("disable").trigger("click").end()
				.find("ul").show();

				progressSectionDom.hide();
				thisFile.getList();
			});
		});

	},
	rename: function() {
		
	},
	
	api: function(){
		//tool.js
		new AjaxTransfer().execute(this);
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
			$thisItem.data("fi",this.fi)
			.find(".cl1 img").attr("src",this.getFileIcon(this.fn)).end()
			.find(".cl3").html(this.fileSizeTrans(this.si));
		}

		$thisItem.find(".cl1 span").html(this.fn).end()
		.find(".cl2").html(this.timeFormat(this.meta.ct));
		
		this.eventBinding($thisItem);
		// $("section.fileSharing section.list").append($thisItem);
	},
	eventBinding: function($thisItem){
		var thisItemObj = this;
		var thisFileDom = this.fileDom;
		$thisItem.children().unbind();

		$thisItem.click(function(){
			
			thisFileDom.find("div.row").removeClass("fs-active").end()
			.find(".operator").show();

			$(this).addClass("fs-active");

			// cns.debug("thisItemObj",JSON.stringify(thisItemObj,null,2));

			//folder
			if(thisItemObj.ti != null){
				thisFileDom.trigger("goToFolder",thisItemObj);
			}
		});

		$thisItem.dblclick(function(){
			//folder 不下載
			if(thisItemObj.ti != null) return false;
			thisFileDom.trigger("download",thisItemObj.fi);
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