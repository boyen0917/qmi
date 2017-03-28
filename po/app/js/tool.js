
// Array.prototype.find polyfill
if (!Array.prototype.find) {
  Array.prototype.find = function(predicate) {
    if (this === null) {
      throw new TypeError('Array.prototype.find called on null or undefined');
    }
    if (typeof predicate !== 'function') {
      throw new TypeError('predicate must be a function');
    }
    var list = Object(this);
    var length = list.length >>> 0;
    var thisArg = arguments[1];
    var value;

    for (var i = 0; i < length; i++) {
      value = list[i];
      if (predicate.call(thisArg, value, i, list)) {
        return value;
      }
    }
    return undefined;
  };
}

QmiGlobal.popup = function(args){
	QmiGlobal.scrollController.disableScroll();

	var self = this;

	self.deferred = $.Deferred();
	self.jqHtml = $(this.html);

	self.jqHtml.find(".popup-confirm").html( $.i18n.getString("COMMON_OK") ).end()
				.find(".popup-cancel").html( $.i18n.getString("COMMON_CANCEL") );

	if( args.confirm !== false && args.confirm !== undefined ) self.jqHtml.find(".popup-confirm").show();
	if( args.cancel  !== false && args.cancel  !== undefined ) self.jqHtml.find(".popup-cancel").show();
	if(typeof args.confirm === "string") self.jqHtml.find(".popup-confirm").html(args.confirm);
	if(typeof args.cancel === "string") self.jqHtml.find(".popup-cancel").html(args.cancel);

	if(args.title !== undefined)
		self.jqHtml.find('.popup-title').html(args.title);

	if(args.desc !== undefined)
		self.jqHtml.find('.popup-text').html(args.desc).show();
	
	//沒有按鈕 自動消失
	if( args.confirm === undefined && args.cancel === undefined) {
		setTimeout(function(){
			self.jqHtml.remove();
			self.remove();
		},1500);
	}

	//確認後動作
	self.jqHtml.find(".popup-confirm").click(function(){
		if(args.confirm !== undefined && args.action !== undefined) {
			args.action[0].apply({},[args.action[1]]);
		}
		self.jqHtml.remove();
		self.remove(true);
	})

	//取消
	self.jqHtml.find(".popup-cancel").click(function(){
		if(args.cancel !== undefined && args.cancelAction !== undefined)
			args.cancelAction();

		self.jqHtml.remove();
		self.remove();
	})

	$("body")
	.find("div.popup").remove().end()
	.append(self.jqHtml.show());

	return self.deferred.promise();
}

QmiGlobal.popup.prototype = {
	remove: function(isConfirm){
		this.deferred.resolve(isConfirm);

		$("body").removeClass("screen-lock");
		QmiGlobal.scrollController.enableScroll();
	},
	
	html:'<div class="popup">'
        + '<div class="popup-frame">'
        + '    <div class="popup-title"></div>'
        + '    <div class="popup-text" style="display:none"></div>'
        + '    <div class="popup-confirm-area">'
        + '        <div class="popup-cancel" style="display:none"></div>'
        + '        <div class="popup-confirm" style="display:none"></div>   ' 
        + '    </div>'
        + '</div>'
        + '<div class="popup-gap"></div>'
        + '</div>'
}



QmiGlobal.scrollController = {
	
	keys: {
		37: 1, 
		38: 1, 
		39: 1, 
		40: 1
	},

	preventDefault: function(e) {
		e = e || window.event;
		if (e.preventDefault)
			e.preventDefault();
		e.returnValue = false;  
	},

	preventDefaultForScrollKeys: function(e) {
		if (this.keys[e.keyCode]) {
			preventDefault(e);
			return false;
		}
	},

	disableScroll: function() {
		if (window.addEventListener) // older FF
			window.addEventListener('DOMMouseScroll', this.preventDefault, false);
		window.onwheel = this.preventDefault; // modern standard
		window.onmousewheel = document.onmousewheel = this.preventDefault; // older browsers, IE
		window.ontouchmove  = this.preventDefault; // mobile
		document.onkeydown  = this.preventDefaultForScrollKeys;
	},

	enableScroll: function() {
		if (window.removeEventListener)
			window.removeEventListener('DOMMouseScroll', this.preventDefault, false);
		window.onmousewheel = document.onmousewheel = null; 
		window.onwheel = null; 
		window.ontouchmove = null;  
		document.onkeydown = null;  
	}
}

ajaxDo = function (api_name,headers,method,load_show_chk,body,ajax_msg_chk,err_hide, privateUrl){
	return new QmiAjax({
		apiName: api_name,
		headers: headers,
		method: method,
		isLoadingShow: load_show_chk,
		body: body,
		ajaxMsg: ajax_msg_chk,
		errHide: err_hide,
		privateUrl: privateUrl,
		ajaxDo: true
	});
}


reLogin = function() {
	localStorage.removeItem("_loginAutoChk");
	localStorage.removeItem("_loginData");
	document.location = "index.html";
}

//縮圖
imgResizeByCanvas = function(img,x,y,max_w,max_h,quality){
	var MAX_WIDTH = max_w;
	var MAX_HEIGHT = max_h;
	var tempW = img.naturalWidth;
	var tempH = img.naturalHeight;
	if (tempW > tempH) {
		if (tempW > MAX_WIDTH) {
			tempH *= MAX_WIDTH / tempW;
			tempW = MAX_WIDTH;
		}
	} else {
		if (tempH > MAX_HEIGHT) {
			tempW *= MAX_HEIGHT / tempH;
			tempH = MAX_HEIGHT;
		}
	}

	var canvas = document.createElement('canvas');
	canvas.width = tempW;
	canvas.height = tempH;
	
	canvas.getContext("2d").drawImage(img, x, y, tempW, tempH);
	var dataURL = canvas.toDataURL("image/jpeg",quality);

	var img_obj = {
		w: Math.floor(tempW),
		h: Math.floor(tempH),
		blob: dataURItoBlob(dataURL),
		ori: img
	}
	return img_obj;
}

dataURItoBlob = function(dataURI) {
	var contentType;
	try{
		contentType = dataURI.split(';')[0];
		contentType = contentType.substring(5,contentType.length);
	} catch(e){
		contentType = 'image/png';
		errorReport(e);
	}
    var binary = atob(dataURI.split(',')[1]);
    var array = [];
    for(var i = 0; i < binary.length; i++) {
        array.push(binary.charCodeAt(i));
    }
    return new Blob([new Uint8Array(array)], {type: contentType});
}

getVideoBlob = function(videoDom, x,y,max_w,max_h,quality){
	if( null==videoDom || videoDom.length<=0 ) return null;
	var video = videoDom[0];
	if( null==video ) return null;
	
	return {
		l: Math.floor(video.duration*1000),
		blob: dataURItoBlob( videoDom.attr("src") )
	}
	
}

//寫入exif
writeExif = function(exifinfo,imageSrc){
	var deferred = $.Deferred();
	console.log("data:",imageSrc);
	console.log("exif:",exifinfo);
	var dataURL;
	var img = new Image();
	
	img.onload = function () {
		var canvas = document.createElement('canvas');
		canvas.width = this.naturalWidth;
		canvas.height = this.naturalHeight;
		canvas.getContext("2d").drawImage(img,0,0);
		dataURL = canvas.toDataURL("image/jpeg");
		var exif = {},
    		gps = {};
		exif[piexif.ExifIFD.DateTimeOriginal] = exifinfo.DateTimeOriginal;
		exif[piexif.ExifIFD.DateTimeDigitized] = exifinfo.DateTimeDigitized;
		gps[piexif.GPSIFD.GPSLatitudeRef] = exifinfo.GPSLatitudeRef;
    	gps[piexif.GPSIFD.GPSLatitude] = exifinfo.GPSLatitude;
    	gps[piexif.GPSIFD.GPSLongitudeRef] = exifinfo.GPSLongitudeRef;
    	gps[piexif.GPSIFD.GPSLongitude] = exifinfo.GPSLongitude;
		var piexifObj = {"Exif":exif, "GPS":gps};
		var exifStr = piexif.dump(piexifObj);
		dataURL = piexif.insert(exifStr, dataURL);
		deferred.resolve(dataURL);
	}
	img.src = imageSrc;
	return deferred.promise();
}

//轉換exif經緯度
toDecimal = function (number) {
	if(number === undefined) return;
    return number[0].numerator + number[1].numerator /
       (60 * number[1].denominator) + number[2].numerator / (3600 * number[2].denominator);
}

fileSizeTransfer = function (si){
	if(si < 900) 
		return Math.round(si*10)/10+" byte";

	if((si/1024) < 900)
		return Math.round(si/1024*10)/10+" kb";
	
	return Math.round(si/1024/1024*10)/10+" mb";
}

getMatchIcon = function (fileName) {
	var fileExt = fileName.split(".").pop();
	var dictOfFileIconPath = {
		default : 'otherfile_icon.png',
		bmp : 'photo_icon.png',
		jpg : 'photo_icon.png',
		png : 'photo_icon.png',
		gif : 'photo_icon.png',
		pdf : 'pdf_icon.png',
		csv : 'excel_icon.png',
		xls : 'excel_icon.png',
		xlsx : 'excel_icon.png',
		ppt : 'ppt_icon.png',
		pptx : 'ppt_icon.png',
		doc : 'word_icon.png',
		docx : 'word_icon.png',
		mp3 : 'audio_icon.png',
		wav : 'audio_icon.png',
		wma : 'audio_icon.png',
		mp4 : 'video_icon.png', 
		flv : 'video_icon.png', 
		mov : 'video_icon.png', 
		wmv : 'video_icon.png', 
		mpg : 'video_icon.png', 
		avi : 'video_icon.png', 
	}

	if (dictOfFileIconPath[fileExt]) {
		return dictOfFileIconPath[fileExt];
	} else {
		return dictOfFileIconPath['default'];
	}
}

//調整個人頭像
avatarPos = function (ori_img,x){

	//reset
	// if( ori_img.length<=0 ){
	// 	return;
	// }
	// var src = ori_img[0].src;
	// var parent = ori_img.parent();
	// ori_img.remove();
	// var img = $("<img src='" + src + "'>​");
	// parent.prepend(img);
	

	// img.load(function() {
//           var w = img.width();
//           var h = img.height();
 //        if(!x){
 //        	x = avatar_size;
 //        }
//           mathAvatarPos(img,w,h,x);
//       });
}

mathAvatarPos = function (img,w,h,x,limit){
	//設最大值 若小於此值 就用原尺寸
	if(limit){
		w < limit ? x = w : x = limit ;
	}
	
    if(w == 0 || h == 0) return false;
    
    img.removeAttr( 'style' );
    
    if(w <= h){
    	img.attr("width",x);
        var p = ((h/(w/x))-x)/2*(-1);
        img.css("margin-top",p +"px");
    }else{
    	img.attr("height",x);
    	var p = ((w/(h/x))-x)/2*(-1);
    	img.css("margin-left",p +"px");
    }
}

//sha1 and base64 encode
toSha1Encode = function (string){
	var hash = CryptoJS.SHA1(string);
    var toBase64 = hash.toString(CryptoJS.enc.Base64);
    return toBase64;
}

// ldap密碼加密
QmiGlobal.aesCrypto = {
	enc: function(msg, key) {
		return CryptoJS.AES.encrypt(
			msg, 
			CryptoJS.enc.Utf8.parse(key), 
			{ 
		        mode: CryptoJS.mode.ECB,
		        padding: CryptoJS.pad.Pkcs7
		    }
	    ).toString();
	},
	dec: function(aesStr, key) {
		return CryptoJS.AES.decrypt(
			aesStr, 
			CryptoJS.enc.Utf8.parse(key), 
			{ 
			    mode: CryptoJS.mode.ECB,
			    padding: CryptoJS.pad.Pkcs7
			}
		).toString(CryptoJS.enc.Utf8);
	}
}

htmlFormat = function (str, isToCharCode){
	if(str.match(/\&\#\d+\;*/g)){
    	str = str.replace(/\&\#/g,"&#38;&#35;");
    } 
    var strArr = str._escape().replace(/\n/g," \n ").split(" ");
    $.each(strArr,function(i,val){
    	var newStr = (isToCharCode === true ? encodeHtmlEntity(val) : val) ;

        if(val.substring(0, 7) == 'http://' || val.substring(0, 8) == 'https://')
            newStr = "<a href=\"" + newStr + "\" target=\"_blank\">" + newStr + "</a>";
            
        strArr.splice(i,1,newStr);
    });

    return strArr.join(" ").replaceEmoji().replace(/\n/g, "<br/>");
}

//轉換html符號
encodeHtmlEntity = function(str) {
    if(!str) return false;

    var escape_list = {"10":"<br/>"};
    var buf = [];
    for (var i=str.length-1;i>=0;i--) {
        var char_code = str[i].charCodeAt();
        if(escape_list[char_code]){
            buf.unshift(escape_list[char_code]);
        }else{
            buf.unshift(['&#', char_code, ';'].join(''));
        }
     }
	return buf.join('');
};

//秒數轉成時分秒
secondsToTime = function (secs)
{
    var s_hours = Math.floor(secs / (60 * 60));

    var divisor_for_minutes = secs % (60 * 60);
    var s_minutes = Math.floor(divisor_for_minutes / 60);

    var divisor_for_seconds = divisor_for_minutes % 60;
    var s_seconds = Math.ceil(divisor_for_seconds);
    return s_minutes + ":" + ((s_seconds < 10)?("0" + s_seconds):(s_seconds));
}

toastShow = function(desc){
	if($(".toast").css("opacity") !== "0" || (desc || "").length === 0) return;

	$(".toast div").html(desc);
	$(".toast").css("bottom","0px");
	$(".toast").css("opacity","0");
	
	setTimeout(function(){
		$(".toast").show();
		$(".toast").animate({
			bottom: "30px",
			opacity: "1.0"
		},100);
	},100);
	
	setTimeout(function(){
		$(".toast").fadeOut('fast', function(){
			$(this).css("bottom","0px");
			$(this).css("opacity","0");
		});
	},4000);
}

//對話框設定
popupShowAdjust = function (title,desc,confirm,cancel,callback){
	new QmiGlobal.popup({
		title: title,
		desc: desc,
		confirm: confirm,
		cancel: cancel,
		action: callback
	});
}




changePageAfterPopUp = function(page){
	$.mobile.changePage(page);
}


//================================== language ===========================

updateLanguage = function( lanPath ){
	lanPath = lanPath || lang;
	var deferred = $.Deferred();
	$.i18n.load(lanPath, function(){
		$('body')._i18n();
		deferred.resolve();
	});

	return deferred.promise();
}


uploadToS3 = function(file,api_name,ori_arr,tmb_arr,callback){
	var result_msg = false;

    var headers = {
        ui: ui,
        at: at,
        li: lang
    };
    var method = "put";

    //上傳圖像強制開啟loading 圖示
    s_load_show = true;
    var result = ajaxDo(api_name,headers,method,false);
    result.complete(function(data){
    	if(data.status == 200){
    		var getS3_result =$.parseJSON(data.responseText);
    		var fi = getS3_result.fi;
    		var ou = getS3_result.ou;
    		var tu = getS3_result.tu;

			//大小圖都要縮圖
			var reader = new FileReader();
	        reader.onloadend = function() {
	            var tempImg = new Image();
	            tempImg.src = reader.result;
	            tempImg.onload = function() {
	                
	                //大小圖都要縮圖
	                var o_obj = imgResizeByCanvas(this,0,0,ori_arr[0],ori_arr[1],ori_arr[2]);
	                var t_obj = imgResizeByCanvas(this,0,0,tmb_arr[0],tmb_arr[1],tmb_arr[2]);
	                cns.debug("img",{
	                	originImgObj: o_obj,
	                	thumbnailImgObj: t_obj
	                });
	                //傳大圖
	                $.ajax({
						url: ou,
						type: 'PUT',
						contentType: " ",
					 	data: o_obj.blob, 
						processData: false,
						complete: function(data) { 
							if(data.status == 200){
								//傳小圖
				                $.ajax({
									url: tu,
									type: 'PUT',
									contentType: " ",
								 	data: t_obj.blob, 
									processData: false,
									complete: function(data) { 
										if(data.status == 200){

											api_name = api_name + "/commit";
						                    var headers = {
						                        ui: ui,
									            at: at,
									            li: lang
						                    };
						                    var method = "put";

						                    var body = {
						                      fi: fi,
						                      si: o_obj.blob.size
						                    }
						                    ajaxDo(api_name,headers,method,true,body).complete(function(data){
									        	//commit 成功
									        	if(data.status == 200){
									        		if(callback) callback(true);
									        	}else{
									        		//commit 失敗
									        		if(callback) callback(false);
									        	}
						                    });
										}else{
											cns.debug("小圖上傳 錯誤");
											if(callback) callback(false);
										}
								}});
							}else{
								cns.debug("大圖上傳 錯誤");
								if(callback) callback(false);
							}
					}});
	            }
	        }
	        reader.readAsDataURL(file);
		}else{
			cns.debug("取得s3網址 錯誤");
			if(callback) callback(false);
		}
	});
}

qmiUploadFile = function(uploadObj){
	// tp 1: 圖片 2: 影片
	
	var allDoneDef = $.Deferred(),
		s3ResponseObj;

	(function() {
		var chainDef = MyDeferred();
		// 取得上傳網址
		new QmiAjax(uploadObj.urlAjax).complete(chainDef.resolve)
		return chainDef;
	}()).then(function(s3Obj) {
		var chainDef = MyDeferred();
		
		qmiUploadS3(uploadObj, s3Obj).done(chainDef.resolve).fail(chainDef.reject);
		return chainDef;
	}, chainDefError.bind("get url fail")).then(function(responseObj) {
		var chainDef = MyDeferred(),
			s3Obj = responseObj.data,
			exifObj = {},
			body = {
				// fi: uploadObj.tp === 2 ? "" : s3Obj.fi,
				fi: s3Obj.fi,
				ti: (uploadObj.urlAjax.body || {}).ti,
				pi: 0, // 再確認
				tp: uploadObj.tp,
				mt: s3Obj.mt,
				si: s3Obj.si,
				md: s3Obj.md
			};
			if(s3Obj.oriFile){
				EXIF.getData(s3Obj.oriFile, function(){
					exifObj = EXIF.getAllTags(this);
					if(!$.isEmptyObject(exifObj)){
						body.exif = {
							"DateTimeOriginal": exifObj.DateTimeOriginal || "",
							"DateTimeDigitized": exifObj.DateTimeDigitized || "",
							"LatitudeRef": exifObj.GPSLatitudeRef || "", //緯度
							"Latitude": toDecimal(exifObj.GPSLatitude) || "", 
							"LongitudeRef": exifObj.GPSLongitudeRef || "", //經度
							"Longitude": toDecimal(exifObj.GPSLongitude) || "" 
						}
					}
				});
			}
		// commit
		new QmiAjax({
			apiName: uploadObj.urlAjax.apiName + (uploadObj.hasFi === true ? "/" + s3Obj.fi : "") + "/commit",
			method: "put",
			body: body
		}).success(function(data) {
			data.fi = s3Obj.fi;
			data.tp = uploadObj.tp;
			data.file = uploadObj.file;
			chainDef.resolve({isSuccess: true, data: data})
		}).error(chainDef.reject);

		return chainDef;
	}, chainDefError.bind("qmi upload s3 fail"))
	.then(allDoneDef.resolve, chainDefError.bind("qmi upload commit fail"));

	return allDoneDef.promise();

	function chainDefError(data) {
		allDoneDef.resolve({isSuccess: false, data: data, msg: this, errFileName: uploadObj.fileName})
	}
}


// 做 s3 上傳
qmiUploadS3 = function(uploadObj,s3Obj) {
	var allDef = $.Deferred(),
		tmbObj = uploadObj.tmbObj,
		oriObj = uploadObj.oriObj;

	var uploadDef = $.Deferred(),
		mediaLoadDef = $.Deferred(),
		oriFile, tmbFile, mt, si, md, contentType,
		paramObj = {
			s3: { url: s3Obj.s3 || s3Obj.tu },
			s32: { url: s3Obj.s32 || s3Obj.ou},
		};

	switch(uploadObj.tp) {
		case 0: // 其他類型 檔案上傳
			paramObj.s3.file = uploadObj.file;
			delete paramObj.s32;

			contentType = " ";
			// 傳給外部 commit 使用
			mt = uploadObj.file.type || "text";
			si = uploadObj.file.size;
			md = {w:100,h:100,l:100};
	
			mediaLoadDef.resolve();

			break;
		case 1: // 圖
			var oFile = imgResizeByCanvas(uploadObj.file, 0, 0, oriObj.w,  oriObj.h,  oriObj.s),
				tFile = imgResizeByCanvas(uploadObj.file, 0, 0, tmbObj.w,  tmbObj.h,  tmbObj.s);

			paramObj.s32.file = oFile.blob;
			paramObj.s3.file = tFile.blob;

			contentType = " ";

			// 傳給外部 commit 使用
			mt = oFile.blob.type;
			si = oFile.blob.size;
			md = { w: oFile.w, h: oFile.h };
			oriFile = oFile.ori;

			mediaLoadDef.resolve();

			break;
		case 2: // 影 只要傳s32 timeline是這樣

			paramObj.s32.file = uploadObj.file;
			delete paramObj.s3;
			contentType = "video/mp4";

			// uploadObj.compress().done(function (uploadFile) {
			// 	paramObj.s32.file = uploadFile;

				// mt = uploadObj.file.type;
				// si = uploadObj.file.size;

				// var video = document.createElement('video');
				// video.src = URL.createObjectURL(uploadObj.file);
				// video.onloadeddata = function() {
				// 	md = {l: Math.floor(video.duration * 1000)};
				// 	mediaLoadDef.resolve();
				// }
			// });

			zipVideoFile(uploadObj).done(function (uploadFile) {
				paramObj.s32.file = uploadFile;

				// 傳給外部 commit 使用
				mt = uploadFile.type;
				si = uploadFile.size;

				var video = document.createElement('video');
				video.src = URL.createObjectURL(uploadObj.file);
				video.onloadeddata = function() {
					md = {l: Math.floor(video.duration * 1000)};
					mediaLoadDef.resolve();
				}
			}).fail(function () { // 壓縮失敗
				paramObj.s32.file = uploadObj.file;

				// 傳給外部 commit 使用
				mt = uploadObj.file.type;
				si = uploadObj.file.size;

				var video = document.createElement('video');
				video.src = URL.createObjectURL(uploadObj.file);
				video.onloadeddata = function() {
					md = {l: Math.floor(video.duration * 1000)};
					mediaLoadDef.resolve();
				}
			});
			
			break;
		default: 
	}

	mediaLoadDef.done(function() {

		$.when.apply($, (Object.keys(paramObj).reduce(function(arr,key,i) {
				var ajaxArgs = {
					url: paramObj[key].url,
					type: 'PUT',
					contentType: contentType,
				 	data: paramObj[key].file, 
					processData: false,
				}
				
				if (uploadObj.progressBar) ajaxArgs.xhr = uploadObj.progressBar;
				arr[i] = $.ajax(ajaxArgs);
				return arr;
			},[]))
		).done(function(data) {
			allDef.resolve({status: 200, isSuccess: true, data: {
				fi: s3Obj.fi,
				mt: mt,
				si:	si,
				md:	md,
				oriFile: oriFile
			}})
		}).fail(function() {
			// 上傳s3 失敗
			allDef.reject({status: 999, isSuccess: false, data: arguments});
		});
	})

	return allDef.promise();
} // end of qmiUploadS3

resetDB = function(){
	clearBadgeLabel();
	if(typeof idb_timeline_events != "undefined") idb_timeline_events.clear();
	if(typeof g_idb_chat_msgs != "undefined") g_idb_chat_msgs.clear();
	if(typeof g_idb_chat_cnts != "undefined") g_idb_chat_cnts.clear();

	var exceptionObj = {};
	var exceptionItemArr = [
		"_ver",
		"_loginRemeber",
		"_lastBaseUrl"
	];

	exceptionItemArr.forEach(function(lsStr) {
		if(localStorage[lsStr]) exceptionObj[lsStr] = localStorage[lsStr];
	});

	localStorage.clear();

	Object.keys(exceptionObj).forEach(function(key) {
		$.lStorage(key, exceptionObj[key]);
	});
}

getFilePermissionIdWithTarget = function(this_gi, object_str, branch_str){
	var object_obj = $.parseJSON(object_str);
	var gul_arr = [];
	$.each(object_obj,function(i,val){
		var temp_obj = {
			gu: i,
			n: val
		}
		gul_arr.push(temp_obj);
	});

	var branch_obj = $.parseJSON(branch_str);
	var bl_arr = [];
	$.each(branch_obj,function(i,val){
		var temp_obj = {
			bi: i,
			bn: val
		}
		bl_arr.push(temp_obj);
	});

    var body = {
            ti: ti_feed,
            tu:{
              gul: gul_arr,
              bl: bl_arr
            }
        }
    return getFilePermissionId( this_gi, {gul: gul_arr,bl: bl_arr} );
}

getFilePermissionId = function( this_gi, tuObject ){
	var api_name = "groups/" + this_gi + "/permissions";

    var headers = {
             "ui":ui,
             "at":at, 
             "li":lang
    };
    var body = {
            ti: ti_feed,
            tu: tuObject
        };

    var method = "post";
    var pi_result = ajaxDo(api_name,headers,method,false,body);
	return pi_result;
}

getS3UploadUrl = function(this_gi, ti,tp,pi, isApplyWatermark){
	var api_name = "groups/" + this_gi + "/files";

    var headers = {
             "ui":ui,
             "at":at, 
             "li":lang
                 };
    var method = "post";
    var body = {
              // fn: "filename", //目前已無用
              tp: tp,
              ti: ti,
              pi: pi
            };
    if( isApplyWatermark ){
    	body.wm = 1
    }
    return ajaxDo(api_name,headers,method,false,body);
};

uploadImgToS3 = function(url,file){
	return $.ajax ({
        url: url,
		type: 'PUT',
		contentType: " ",
	 	data: file, 
		processData: false
    });
}

uploadVideoToS3 = function(url, file){
	cns.debug(file.type);
	return $.ajax ({
        url: url,
		type: 'PUT',
		contentType: "video/mp4",
	 	data: file, 
		processData: false
    });
}



uploadCommit = function(this_gi, fi,ti,pi,tp,mt,si,md){
	var api_name = "groups/" + this_gi + "/files/" + fi + "/commit";
    var headers = {
             "ui":ui,
             "at":at, 
             "li":lang
                 };
    var method = "put";

    var body = {
      ti: ti,
      pi: pi,
      tp: tp,
      mt: mt,
      si: si,
      md: md
    }
    return ajaxDo(api_name,headers,method,false,body);
}

uploadGroupImage = function(this_gi, file, ti, permission_id, ori_arr, tmb_arr, pi, callback){
	
	var reader = new FileReader();
	reader.onloadend = function() {
		var tempImg = new Image();
	    tempImg.src = reader.result;
	    tempImg.onload = function(){
	        var o_obj = imgResizeByCanvas(this,0,0,ori_arr[0],ori_arr[1],ori_arr[2]);
	        var t_obj = imgResizeByCanvas(this,0,0,tmb_arr[0],tmb_arr[1],tmb_arr[2]);

			getS3UploadUrl(this_gi, ti, 1, pi).complete(function(data){
	    		cns.debug("!");
	    	
				if(data.status == 200){
					var s3url_result = $.parseJSON(data.responseText);
					var fi = s3url_result.fi;
			    	var s3_url = s3url_result.s3;
			    	var s32_url = s3url_result.s32;

			    	//傳大圖
			    	uploadImgToS3(s32_url,o_obj.blob).complete(function(data){
			    		if(data.status == 200){

			    			//傳小圖 已經縮好囉
				    		uploadImgToS3(s3_url,t_obj.blob).complete(function(data){

				        		if(data.status == 200){
				        			var tempW = this.width;
									var tempH = this.height;
									
									//mime type
									var md = {};
				        			md.w = o_obj.w;
				        			md.h = o_obj.h;

				        			uploadCommit(this_gi, fi,ti,pi,1,file.type,o_obj.blob.size,md).complete(function(data){
				        				if(data.status == 200){
					        				var commit_result = $.parseJSON(data.responseText);

					        				var data = {
					        					fi:fi,
					        					s3:s3_url,
					        					s32:s32_url
					        				}
						                	if(callback) callback(data);
						                } else {
						                	if(callback) callback();
						                }
					                	return;
				        			}); //end of uploadCommit

				        		} else {
									if(callback)	callback();
								} //end of small uploadImgToS3 200
				    		}); //end of small uploadImgToS3

			    		} else {
							if(callback)	callback();
						} //end of big uploadImgToS3 200
		        	}); //end of big uploadImgToS3
				
				} else{
					if(callback)	callback();
				} //end of getUrl 200
			}); //end of getUrl
		}
	}
	reader.readAsDataURL(file);
}


uploadGroupVideo = function(this_gi, file, video, ti, permission_id, ori_arr, tmb_arr, pi, callback){
	
	var o_obj = getVideoBlob(video, 0,0,ori_arr[0],ori_arr[1],ori_arr[2]);
	var t_obj = getVideoThumbnail(video,0,0,tmb_arr[0],tmb_arr[1],tmb_arr[2]);

	getS3UploadUrl(this_gi, ti, 2, pi).complete(function(data){
		cns.debug("!");
	
		if(data.status == 200){
			var s3url_result = $.parseJSON(data.responseText);
			var fi = s3url_result.fi;
	    	var s3_url = s3url_result.s3; //截圖
	    	var s32_url = s3url_result.s32;	//影片原檔

	    	//傳大圖
	    	uploadVideoToS3(s32_url,o_obj.blob).complete(function(data){
	    		if(data.status == 200){

	    			//傳縮圖(縮圖一樣要用video/mp4傳...?!)
		    		uploadVideoToS3(s3_url,t_obj.blob).complete(function(data){

		    			if(data.status == 200){
		        			var tempW = this.width;
							var tempH = this.height;
							
							//mime type
							var md = {};
		        			md.l = o_obj.l;

		        			uploadCommit(this_gi, fi,ti,pi,2,file.type,o_obj.blob.size,md).complete(function(data){
		        				if(data.status == 200){
			        				var commit_result = $.parseJSON(data.responseText);

			        				var data = {
			        					fi:fi,
			        					s3:s3_url,
			        					s32:s32_url
			        				}
				                	if(callback) callback(data);
				                } else {
				                	if(callback) callback();
				                }
			                	return;
		        			}); //end of uploadCommit

		        		} else {
							if(callback)	callback();
						} //end of small uploadImgToS3 200
		    		}); //end of small uploadImgToS3

	    		} else {
					if(callback)	callback();
				} //end of big uploadImgToS3 200
	    	}); //end of big uploadImgToS3
		
		} else{
			if(callback)	callback();
		} //end of getUrl 200
	}); //end of getUrl
}


getVideoImgUrl = function(file) {
	var deferred = $.Deferred(),
		fileURL = URL.createObjectURL(file),
		video = document.createElement('video');

	video.src = fileURL;

	video.onloadeddata = function() {
		var canvas = document.createElement('canvas');
		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;
		canvas.getContext('2d').drawImage( video, 0, 0, video.videoWidth, video.videoHeight);

		deferred.resolve(canvas.toDataURL())
	}

	return deferred.promise();
}

getVideoThumbnail = function( videoDom, x,y,max_w,max_h,quality ) {
	if( !videoDom ) return null;
	var video = videoDom[0];
    if( !video ) return null;
    var canvas = document.createElement("canvas");
	var hScale = max_h/video.videoHeight;
	var wScale = max_w/video.videoWidth;
	var scale = (wScale>hScale)?hScale:wScale;
    var width = video.videoWidth*scale;
    var height = video.videoHeight*scale;

    canvas.width = width;
    canvas.height = height;
	var ctx = canvas.getContext("2d");
	ctx.drawImage(video, x, y, width, height);
	var dataURL = canvas.toDataURL("image/png",quality);
	var img_obj = {
		w: Math.floor(width),
		h: Math.floor(height),
		blob: dataURItoBlob(dataURL)
	}
	// var img = new Image;
	// img.src = dataURL;
	// $("#container").append(img);
	return img_obj;
};

randomHash = function(length){
	if(length<=0)	return "";
	
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < length; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

Date.prototype.toFormatString = function(isShowTime){
	var now = new Date();
	var diff = (now.getTime()-this.getTime())/1000;
	var language = window.navigator.userLanguage || window.navigator.language;

	//within min
	if( diff<60 ){
		return $.i18n.getString("COMMON_JUST_NOW");
	} else if( diff<3600 ){	//within hour
		return $.i18n.getString("COMMON_NMINUTES_AGO", Math.floor(diff/60) );
	} else if( now.getYear()==this.getYear() ){
		//today(n-hours ago)
		if( this.getMonth()==now.getMonth() && now.getDate()==this.getDate() ){
			return $.i18n.getString("COMMON_NHOURS_AGO", Math.floor(diff/3600) );
		}//yesterday
		else if( this.getMonth()==now.getMonth() && this.getDate()==(now.getDate()-1) ){
			var options = {hour: "2-digit", minute: "2-digit",hour12:false};
			return $.i18n.getString("COMMON_YESTERDAY")+" "+this.toLocaleTimeString(language, options);
		} else if( this.getWeek()==now.getWeek() ){
			var options = {weekday: "short"};
			
			//星期四 15:40
			// cns.debug( this.toLocaleTimeString(language, options) );
			return this.toLocaleTimeString(language, options).split(" ")[0]
					+" "+this.getHours()+":"+this.getMinutes();
		} else {	//within a year
			//2/20 15:40
			return (this.getMonth()+1)+"/"+this.getDate()
				+" "+this.getHours()
				+":"+padStringToTwoChar(this.getMinutes());
		}
	}
	if( isShowTime ){
		var options = {
		    year: "numeric", month: "numeric",
		    day: "numeric", hour: "2-digit", minute: "2-digit",hour12:false
		};
		return this.toLocaleTimeString(language, options);
	}
	return this.toLocaleDateString(language);
}

padStringToTwoChar = function(d) {
    return (d < 10) ? '0' + d.toString() : d.toString();
}

Date.prototype.getWeek = function() {
	var date = new Date(this.getTime());
	 date.setHours(0, 0, 0, 0);
	// Thursday in current week decides the year.
	date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
	// January 4 is always in week 1.
	var week1 = new Date(date.getFullYear(), 0, 4);
	// Adjust to Thursday in week 1 and count number of weeks from date to week1.
	return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000
	                      - 3 + (week1.getDay() + 6) % 7) / 7);
}

Date.prototype.getRandomString = function(digit){
	if (!digit || digit < 1) digit = 4;
	var time_str = new Date().getTime().toString();
	var length = time_str.length;
	return time_str.substring(length-digit,length);
}

textSomeonesHtmlFormat = function(name){
	switch(lang){
		case "zh_TW":
		case "zh_CN":
			return "<label class='name'>"+name+"</label><label class='someone-s'>的</label>";
			break;
		case "en_US":
			return "<label class='name'>"+name+"</label><label class='someone-s'>'s</label>";
			break;
	}
	return name;
}

textAndHtmlFormat = function(text){
	switch(lang){
		case "zh_TW":
		case "zh_CN":
			return "<label>"+text.replace(/(並|和|跟|以及)/g,function(match) {
			    return "</label><label class='and'>"+match+"</label><label>";
		    })+"</label>";
		 //    return str.replace(/([^%]|^)%(?:(\d+)\$)?(@|d|ld)/g, function(p0, p, position) {
		 //        if (position) {
		 //          return p + args[parseInt(position)-1];
		 //        }
		 //        return p + args.shift();
		 //      })
			// break;
		case "en_US":
			return text.replace(/and/g,function(match) {
			    return "<label class='and'>"+match+"</label>";
		    });
			break;
	}
	return name;
}

getStickerPath = function(id){
	return "sticker/" + id.split("_")[1] + "/" + id + ".png";
}
setStickerUrl = function(dom, id){
	if( null!= initStickerArea ){
		initStickerArea.setStickerSrc(dom, id );
	}
}

QmiGlobal.gallery = function (data) {
	this.gi = data.gi;
    this.photoList = data.photoList;
    this.currentImage = data.currentImage;
    this.isApplyWatermark = data.isApplyWatermark;
    this.watermarkText = data.watermarkText;

    this.container =  $("<div id='galleryModal' style='display:none;'>"
            + "<div class='close'>×</div>"
            + "<div class='preBtn arrowBtn'><div class='draw'></div></div>"
            + "<div class='nextBtn arrowBtn'><div class='draw'></div></div>"
            + "<figure class='gallery-contaniner'>"
            + "<div class='img-container'>"
            + "<img class='currentImg'>"
            + "<figcaption id='caption'></figcaption>"
            + "<a class='download-link' href='"+ this.photoList[this.currentImage].s32
            + "' ><div></div></a></div></figure></div>");
    var leftArrow = this.container.find(".preBtn");
    var caption = this.container.find("#caption");
    var rightArrow = this.container.find(".nextBtn");
    var closeBtn  = this.container.find(".close");
    var imgElement = this.container.find("img");
    var downloadDom = this.container.find(".download-link");
    imgElement.attr("src", this.photoList[this.currentImage].s32);
    caption.html(this.currentImage + 1 + "/" + this.photoList.length);
    downloadDom.attr("download", getS3FileNameWithExtension(this.photoList[this.currentImage].s32, 6 ));

    closeBtn.on("click", this.close.bind(this));
    leftArrow.on('click', this.showPreviousImage.bind(this));
    rightArrow.on('click', this.showNextImage.bind(this));

    this.container.find("a.download-link").click(function(e) {e.stopPropagation();});

    // Brian ZoomIn
    this.zoomObj = {
        dom: this.container.find(".img-container"),
        reset: function() {
            var container = this.dom;
            container.removeClass("zoomOut").find(".currentImg").removeClass("zoomIn");
            container.find(".currentImg").attr("style", "");
        },
        init: function() {
            var self = this;
            self.dom.click(function() {
                var container = $(this),
                    img = container.find(".currentImg"),
                    hZoomIn = img.height()*2, wZoomIn = img.width()*2;

                container.toggleClass("zoomOut").find(".currentImg").toggleClass("zoomIn");
                
                if(container.hasClass("zoomOut") === false) {
                    self.reset();
                } else {
                    img.height(hZoomIn).width(wZoomIn);
                    img.width()/2 - window.innerWidth*0.55;
                    container.scrollLeft(img.width()/2 - window.innerWidth*0.55)
                    .scrollTop(img.height()/2 - window.innerHeight*0.55);

                    var hDiff = container.height() - img.height(),
                        wDiff = container.width() - img.width();

                    if(hDiff > 0) { img.css("margin-top", hDiff/2) }
                    if(wDiff > 0) { img.css("margin-left", wDiff/2) }
                }
            })
        }
    }
    this.zoomObj.init();
    // end of Brian ZoomIn

    $("body").append(this.container);
    this.container.fadeIn();

    this.hasMultiImage = function () {
        if (this.photoList.length == 1) {
            return false;
        } 
        return true;
    };

    this.hideElements = function () {
        leftArrow.hide();
        rightArrow.hide();
        caption.hide();
    }

    if (! this.hasMultiImage()) {
        this.hideElements();
    } 
}


QmiGlobal.gallery.prototype = {

	getImageUrl: function() {
		return new QmiAjax({
        	apiName: "groups/" + this.gi + "/files/" + this.photoList[this.currentImage].c 
        		+ "?pi=" + this.photoList[this.currentImage].p + "&ti=" 
        		+ QmiGlobal.groups[this.gi].ti_feed
    	});
	},

	showPreviousImage: function(e) {
		this.zoomObj.reset();
		
		this.currentImage = (this.photoList.length + this.currentImage - 1) % (this.photoList.length);
		if (! this.photoList[this.currentImage].hasOwnProperty("s32")) {
			this.getImageUrl().then(function (data) {
				
				if (this.isApplyWatermark) {
					getWatermarkImage(this.watermarkText, $.parseJSON(data.responseText).s32, 1, 
						function (imgUrl) {
							this.photoList[this.currentImage].s32 = imgUrl;
							this.container.find("img").attr("src", imgUrl);
						}.bind(this));
				}

				this.photoList[this.currentImage].s32 = $.parseJSON(data.responseText).s32;
				this.container.find("img").attr("src", this.photoList[this.currentImage].s32);
				this.container.find(".download-link").attr("href", this.photoList[this.currentImage].s32);
				this.container.find(".download-link").attr("download",
					getS3FileNameWithExtension(this.photoList[this.currentImage].s32, 6));
			}.bind(this));
		}
		this.container.find("img").attr("src", this.photoList[this.currentImage].s32);
		this.container.find(".download-link").attr("href", this.photoList[this.currentImage].s32);
		this.container.find(".download-link").attr("download",
					getS3FileNameWithExtension(this.photoList[this.currentImage].s32, 6));
		this.container.find("#caption").html(this.currentImage + 1 + "/" + this.photoList.length);
	},

	showNextImage: function(e) {
		this.zoomObj.reset();

		this.currentImage = (this.currentImage + 1) % (this.photoList.length);
		if (! this.photoList[this.currentImage].hasOwnProperty("s32")) {

			this.getImageUrl().then(function (data) {
				if (this.isApplyWatermark) {
					getWatermarkImage(this.watermarkText, $.parseJSON(data.responseText).s32, 1, 
						function (imgUrl) {
							this.photoList[this.currentImage].s32 = imgUrl;
							this.container.find("img").attr("src", imgUrl);
						}.bind(this));
				}
				this.photoList[this.currentImage].s32 = $.parseJSON(data.responseText).s32;
				this.container.find("img").attr("src", this.photoList[this.currentImage].s32);
				this.container.find(".download-link").attr("href", this.photoList[this.currentImage].s32);
				this.container.find(".download-link").attr("download",
					getS3FileNameWithExtension(this.photoList[this.currentImage].s32, 6));
			}.bind(this));
		}
		this.container.find("img").attr("src", this.photoList[this.currentImage].s32);
		this.container.find(".download-link").attr("href", this.photoList[this.currentImage].s32);
		this.container.find(".download-link").attr("download",
					getS3FileNameWithExtension(this.photoList[this.currentImage].s32, 6));
		this.container.find("#caption").html(this.currentImage + 1 + "/" + this.photoList.length);
	},

	close: function() {
		var self = this;
		self.container.fadeOut(300, function() {
			self.container.remove();
			delete self.photoList;
			delete self.container;
		})
	},
}

showAlbumPage = function( this_gi, this_ti, this_gai, name ){
	if( null== window ) return;
	gallery = window.opener;
	if( gallery && false==gallery.closed ){
		var dataDom = $(gallery.document).find(".al-single .dataDom");
        gallery.focus();
    	dataDom.attr("data-gi",this_gi);
    	dataDom.attr("data-ti",this_ti);
    	dataDom.attr("data-gai",this_gai);
    	dataDom.attr("data-name",name);
        dataDom.click();
    } 
}

getAlbum = function( this_gi, this_gai, ajax_load,err_show ){
	try{
		var err_show = err_show || false;
    	//GET /groups/{gi}/galleries/{gai}/images
    	var api_name = "groups/" + this_gi + "/galleries/" + this_gai + "/images";
        var headers = {
            "ui":ui,
            "at":at,
            "li":lang
        };
        var method = "get";
        return ajaxDo(api_name,headers,method,ajax_load,false,false,err_show);
    } catch(e){
    	errorReport(e);
    	return null;
    }
}

//     at: "dbf24f99-9cee-4f97-a29f-f52a9c236c41"
// li: "zh_TW"
// ui: "U000000R0CT"


getGroupData = function(this_gi,ajax_load,tp,err_show){
	var err_show = err_show || false;
	var api_name = "groups/" + this_gi;
	if( tp ) api_name = api_name +"?tp=" +tp;
    var headers = {
        "ui":ui,
        "at":at,
        "li":lang
    };
    var method = "get";
    return ajaxDo(api_name,headers,method,ajax_load,false,false,err_show);
}

setGroupAttributes = function( this_gi, data ){
	try{
		var userData = QmiGlobal.groups;
		if( !userData.hasOwnProperty(this_gi) ){
			userData[this_gi] = data;
			// *--* $.lStorage(ui, userData);
			return;
		}
		var group = userData[this_gi];

		var updateKeys = ["auo","aut","cnt"];
		var ignoreKeys = ["rsp_code"];
		for( var key in data ){


			data


			//update auo, aut, etc.
			if( updateKeys.indexOf(key)>=0 ){
				group[key] = data[key];
			} //add new keys
			else if( !group.hasOwnProperty(key) ){
				if( typeof(data[key])=="object" ) continue;
				if( ignoreKeys.indexOf(key)>=0 ) continue;
				group[key] = data[key];
			}
		}
		
		group.gn = data.gn || "";
		group.gd = data.gd || "";
		group.set = data.set;

		// *--* $.lStorage(ui, userData);
	} catch(e){
		errorReport(e);
	}
}

//更新團體資訊
updateGroupAllInfoDom = function( thisGi ){
	try{
		var group = QmiGlobal.groups[thisGi];

		//update icon
		var emptyAuo = "images/common/others/name_card_nophoto_profile.png";
		var emptyAut = "images/common/others/empty_img_all_l.png";
		if( group.auo ){
			$(".polling-group-pic-o[data-gi="+thisGi+"]").attr("src", group.auo);
		} else {
			$(".polling-group-pic-o[data-gi="+thisGi+"]").attr("src", emptyAuo);
		}
		if( group.aut ){
			$(".polling-group-pic-t[data-gi="+thisGi+"]").attr("src", group.aut);
		} else {
			$(".polling-group-pic-t[data-gi="+thisGi+"]").attr("src", emptyAut);
		}

		//update name
		updateSideMenuContent(thisGi);

		if( gi==thisGi ){
			//update icon
			if( group.auo ){
				$(".polling-group-pic-o.currentGroup").attr("src", group.auo);
			} else {
				$(".polling-group-pic-o.currentGroup").attr("src", emptyAuo);
			}
			if( group.aut ){
				$(".polling-group-pic-t.currentGroup").attr("src", group.aut);
			} else {
				$(".polling-group-pic-t.currentGroup").attr("src", emptyAut);
			}

			//update name
			$(".polling-group-name.currentGroup").html(group.gn._escape());
			$(".polling-group-description.currentGroup").html(htmlFormat(group.gd));
		}
		
		// 等於當前團體 再做更新ui tab
    	updateTab( thisGi );
    	
	} catch(e){
		errorReport(e);
	}
}


updateSideMenuContent = function(thisGi) {
	//update name
	if(QmiGlobal.groups[thisGi] === undefined) return;
	
	var groupData = QmiGlobal.groups[thisGi],
		gn = groupData.gn._escape(),
		gd = groupData.gd._escape(),
		ad = groupData.ad;
	//管理員圖示
	var tmp = $(".sm-group-area[data-gi="+thisGi+"]");
    if(ad == 1){
        tmp.find(".sm-icon-host").show();
    } else{
        tmp.find(".sm-icon-host").hide();
    }

	$(".polling-group-name[data-gi="+thisGi+"]")
	.find("div:nth-child(1)").html(gn).end()
	.find("div:nth-child(2)").html($.i18n.getString("COMPOSE_N_MEMBERS", QmiGlobal.getActivedUserNum(thisGi)));
	$(".polling-group-description[data-gi="+groupData.gi+"]").html(gd);
}

updateGroupIconDom = function( this_gi ){
	try{
		var userData = QmiGlobal.groups;
		var group = userData[this_gi];

		//update icon
		var emptyAuo = "images/common/others/name_card_nophoto_profile.png";
		var emptyAut = "images/common/others/empty_img_all_l.png";
		
		if( group.auo ){
			$(".polling-group-pic-o[data-gi="+this_gi+"]").attr("src", group.auo);
		} else {
			$(".polling-group-pic-o[data-gi="+this_gi+"]").attr("src", emptyAuo);
		}
		if( group.aut ){
			$(".polling-group-pic-t[data-gi="+this_gi+"]").attr("src", group.aut);
		} else {
			$(".polling-group-pic-t[data-gi="+this_gi+"]").attr("src", emptyAut);
		}
	} catch(e){
		errorReport(e);
	}
}


updateBranchList = function(this_gi, callback){
	var this_gi = this_gi || gi;
	if( !this_gi ) return;

	//取得團體列表
    var api_name = "groups/" + this_gi + "/branches";
    var headers = {
        "ui":ui,
        "at":at,
        "li":lang
    };

    var method = "get";
    ajaxDo(api_name,headers,method,false).complete(function(data){
    	if(data.status == 200)
    		setBranchList( this_gi, $.parseJSON(data.responseText), callback );
    });
}

setBranchList = function(thisGi, originData, callback){
	var 
	thisGi = thisGi || gi,
	qmiGroupData = QmiGlobal.groups[thisGi],
	new_bl = {},
	new_fbl = {},
	guAll = qmiGroupData.guAll;

    if( !thisGi ) return;

    //branch
    //初始化陣列
	$.each(originData.bl,function(i,val){
        if( null==val.bp|| val.bp.length==0 ) return;

        var bp_arr = val.bp.replace(/^\./, '').split(".");
        var pi = "";
        if(bp_arr.length > 1){
            pi = bp_arr[bp_arr.length-2]
        }
		new_bl[bp_arr.last()] = {
			lv: bp_arr.length,
			bn: val.bn._escape(),
			cl: [],
            cnt: 0,
            pi: pi,
			bp_arr: bp_arr
		};
		
	});

    //建立子群組
	$.each(new_bl,function(i,val){
		if(val.lv > 1){
			var parent = val.bp_arr[val.bp_arr.length-2];
			if(new_bl[parent]) new_bl[parent].cl.push(i);
		}
		delete val.bp_arr;
	});
    
    //計算人數
    //*NOTE*
    // 同一人可能隸屬于多個群組, 若兩個子群組有同一人,
    // 母群組應該只能算一人, 普通加法不成立...

    for( var biTmp in new_bl ){
        //每個群組走過一次所有成員, 只要含有這個群組ＩＤ數量就加一..
        var cnt=0;
        for( var id in guAll ){

            var mem = guAll[id];
            if( 
            	mem && 
            	// 代表未離開
            	mem.st==1 && 
            	// 現在遍歷的bi 比對到該成員的bu list xxx,xxx,xx
            	mem.bl.indexOf(biTmp)>=0
            ){
            	// 並且該成員所屬的bi 現在還存在
            	for(i=0;i<mem.bl.split(",").length;i++){
            		if(new_bl[mem.bl.split(",")[i].split(".").last()] !== undefined){
                    	cnt++;
                    	break;
                    }
            	}
            }
        }
        new_bl[biTmp].cnt = cnt;
	}

    //fav branch
	$.each(originData.fbl,function(i,val){
		new_fbl[val.fi] = {fn:val.fn, cnt:0};
	});

    //計算人數
    var favCnt = 0;
    $.each(guAll,function(i,val){
    	if(null==val || val.st!=1 ) return;

        //fi mem cnt
        if( val.fbl && val.fbl.length>0 ){
            for(var i=0; i<val.fbl.length; i++){
                var fi = val.fbl[i];
                if(new_fbl[fi]) new_fbl[fi].cnt++;
            }
        }

        //fav cnt
        if( true==val.fav ) favCnt++;
    });

   	qmiGroupData.favCnt = favCnt;
	qmiGroupData.bl = new_bl;
	qmiGroupData.fbl = new_fbl;

	if( callback ) callback(thisGi);
}

getGroupCompetence = function( this_gi ){
	var tmp = {
		isAdmin: false,
		isOfficial: false
	}
	try{
		var groupData = QmiGlobal.groups[this_gi];
		if( groupData.ad==1 ){
			tmp.isAdmin = true;
		}
		if( groupData.ntp === 2 ){
			tmp.isOfficial = groupData.isOfficial;
		}
	} catch(e){
		errorReport(e);
	}
	return tmp;
}

getS32file = function(thisTi, fileObj) {
	var api_name = "groups/" + gi + "/files/" + fileObj.c + "?pi=" + fileObj.p + "&ti=" 
		+ thisTi;
	var result = new QmiAjax({
        apiName: api_name
    })
    var deferred = $.Deferred();

    result.complete(function(data){
        if(data.status != 200){
        	cns.debug("get s3 fail");
        	return false;
        }

		try{
			cns.debug(data.responseText);
			cns.debug("target",target, "tp",tp);
		} catch(e){
			errorReport(e);
		}

        var obj =$.parseJSON(data.responseText);
        deferred.resolve(obj);
    });

    return deferred.promise();
}

getS3FileNameWithExtension = function( s3Addr, type ){
    var szFileName = "qmi_file";
	if( s3Addr ){
		var index = s3Addr.indexOf("?");
		if( index>=0 ){
			szFileName = s3Addr.substring(index-38, index);
		}
	}

    switch( type ){
    	case 6:
    		szFileName = szFileName + ".png";
    		break;
    }
	return szFileName;
}

getQRCodeFileNameWithExtension = function( addr ){
	//https://project-o.s3.hicloud.net.tw/qrcode/bfded2e0-4fa4-41de-bb8a-160a49b94037

    var szFileName = "qmi_qrcode.png";
	if( addr ){
		var index = addr.lastIndexOf("/");
		if( index>=0 ){
			szFileName = addr.substring(index+1, addr.length) + ".png";
		}
	}
	return szFileName;
}

renderVideoFile = function(file, videoTag, onload, onError){
	var reader = new FileReader();
	reader.onload = function(event){
		// videoTag.addClass("loaded");
		if( videoTag.length>0 ){
			var video = videoTag[0];
			// video.oncanplay = function(event){
				// videoTag.addClass("loaded");
				if(onload) onload(videoTag);
			// }
			video.onerror = function(event){
				videoTag.addClass("error");
				if(onError) onError(videoTag);
			}
		} else {
			if(onload) onload(videoTag);
		}
		videoTag.attr("src",reader.result);
	}
	reader.onerror = function(event){
		videoTag.addClass("error");
		if(onError) onError(videoTag);
	}

	reader.readAsDataURL(file);
}

renderVideoUrl = function(url, videoTag, onload, onError){
	if( videoTag.length>0 ){
		// videoTag[0].oncanplay = function(event){
			// videoTag.addClass("loaded");
			if(onload) onload(videoTag);
		// }
		videoTag[0].onerror = function(event){
			videoTag.addClass("error");
			if(onError) onError(videoTag);
		}
    
		videoTag.attr("src", url);
	}
}

function drawCanvasImageBg( ctx, img, x, y, w, h ){
	ctx.save();
	ctx.drawImage(img, x,y,w, h);
	ctx.restore();
}

function drawCanvasText(ctx, w, h, text, textSize, lineHeight, color ){
	if( !text || text.length<=0 ) return;
	lineHeight = lineHeight || 44;
	var newWH = (w+h)/1.41421356237;	//sqrt(2)
	var offset = h/2;	//sqrt(2)
	var cnt = Math.ceil(newWH/lineHeight)+2;
	ctx.font = textSize+' Microsoft JhengHei';	// Calibri
	text = text+"  ";
	var textWidth = ctx.measureText(text).width;
	var textCnt = Math.ceil(newWH/textWidth)+2;

	ctx.save();
	ctx.translate(-offset,offset);
	ctx.rotate(-0.25*Math.PI);

	var yTmp = 0;
	// stroke color
	ctx.strokeStyle = "rgba(128,128,128,0.3)";
    ctx.lineWidth = 1;

	ctx.fillStyle = color || "rgba(255,255,255,0.3)";
	// ctx.strokeStyle = "rgba(255,255,255,0.3)";
    var longTextString = "";
    for( var j=0; j<textCnt; j++){
	    longTextString += text;
	}
	for( var i=0; i<cnt; i++){
		var xTmp = 0;
		ctx.strokeText(longTextString, xTmp, yTmp);
		ctx.fillText( longTextString, xTmp, yTmp);
		yTmp+=lineHeight;
	}
	ctx.restore();
}

renderImageWithWatermark = function(newImage, text, url, quality){
	//eg.
	//	var img = $("<img/>");
	//	renderImageWithWatermark(img,"text拉拉", s3url, 0.9);

	var img = new Image;
	img .setAttribute('crossOrigin', 'anonymous');
	img.onload = function(){
		var c    = document.createElement('canvas');
		var ctx  = c.getContext('2d');
		c.width  = img.width;
		c.height = img.height;
		drawCanvasImageBg( ctx, img, 0, 0, c.width, c.height);
		drawCanvasText(ctx, c.width, c.height, text, "48px", 68);
		newImage.attr("src", c.toDataURL("image/png",quality) );
	};
	img.src = url;
}

/* 浮水印, 會有cross-domain問題, 不支援網頁版 */
if( typeof(require)!="undefined" ) {
	getWatermarkImage = function(text, url, quality, callback, textSize){
		//eg.
		//	var img = $("<img/>");
		//	renderImageWithWatermark(img,"text拉拉", s3url, 0.9);
		if( !callback ) return;
		if( !textSize ) textSize = "24px";

		var img = new Image();
		img.crossOrigin = '*';
		img.onload = function(){
			var c    = document.createElement('canvas');
			var ctx  = c.getContext('2d');
			c.width  = img.width;
			c.height = img.height;
			drawCanvasImageBg( ctx, img, 0, 0, c.width, c.height);
			drawCanvasText(ctx, c.width, c.height, text, textSize, 68);
			// cns.debug( c.toDataURL("image/png",1) );

            // callback( c.toDataURL("image/png",1) );

            var tmpUrl = c.toDataURL("image/png",1);
			var image_data = atob(tmpUrl.split(',')[1]);
            // Use typed arrays to convert the binary data to a Blob
            var arraybuffer = new ArrayBuffer(image_data.length);
            var view = new Uint8Array(arraybuffer);
            for (var i=0; i<image_data.length; i++) {
                view[i] = image_data.charCodeAt(i) & 0xff;
            }
            try {
                // This is the recommended method:
                var blob = new Blob([arraybuffer], {type: 'application/octet-stream'});
            } catch (e) {
                // The BlobBuilder API has been deprecated in favour of Blob, but older
                // browsers don't know about the Blob constructor
                // IE10 also supports BlobBuilder, but since the `Blob` constructor
                //  also works, there's no need to add `MSBlobBuilder`.
                var bb = new (window.WebKitBlobBuilder || window.MozBlobBuilder);
                bb.append(arraybuffer);
                var blob = bb.getBlob('application/octet-stream'); // <-- Here's the Blob
            }

            // Use the URL object to create a temporary URL
            var blobUrl = window.URL.createObjectURL(blob);
            callback( blobUrl );

		};
		img.src = url;
	}
} else {
	drawCanvasBgColor = function(ctx, color, x, y, w, h){
		ctx.save();
		ctx.rect(x,y,w,h);
		ctx.fillStyle=color;
		ctx.fill();
		ctx.restore();
	}
	getWatermarkImage = function(text, url, quality, callback, textSize){
		//eg.
		//	var img = $("<img/>");
		//	renderImageWithWatermark(img,"text拉拉", s3url, 0.9);
		if( !callback ) return;
		if( !textSize ) textSize = "24px";

		var c    = document.createElement('canvas');
		var ctx  = c.getContext('2d');
		c.width  = 300;
		c.height = 300;
		text = "watermark not supported."
		drawCanvasBgColor( ctx, "white", 0, 0, c.width, c.height);
		drawCanvasText(ctx, c.width, c.height, text, textSize, 68, "gray");
		// cns.debug( c.toDataURL("image/png",1) );

        // callback( c.toDataURL("image/png",1) );

        var tmpUrl = c.toDataURL("image/png",1);
		var image_data = atob(tmpUrl.split(',')[1]);
        // Use typed arrays to convert the binary data to a Blob
        var arraybuffer = new ArrayBuffer(image_data.length);
        var view = new Uint8Array(arraybuffer);
        for (var i=0; i<image_data.length; i++) {
            view[i] = image_data.charCodeAt(i) & 0xff;
        }
        try {
            // This is the recommended method:
            var blob = new Blob([arraybuffer], {type: 'application/octet-stream'});
        } catch (e) {
            // The BlobBuilder API has been deprecated in favour of Blob, but older
            // browsers don't know about the Blob constructor
            // IE10 also supports BlobBuilder, but since the `Blob` constructor
            //  also works, there's no need to add `MSBlobBuilder`.
            var bb = new (window.WebKitBlobBuilder || window.MozBlobBuilder);
            bb.append(arraybuffer);
            var blob = bb.getBlob('application/octet-stream'); // <-- Here's the Blob
        }

        // Use the URL object to create a temporary URL
        var blobUrl = window.URL.createObjectURL(blob);
        callback( blobUrl );
	}
}


//ref: http://en.wikipedia.org/wiki/National_conventions_for_writing_telephone_numbers
checkPhoneValidation = function(countryCode, phone){
	if( null==countryCode || null==phone ) return;

	switch(countryCode){
		case "+886": //taiwan 手機10碼 開頭為09, 轉國際電話時去掉前綴'0'共1碼
			return (phone.length == 10 && phone.substring(0,2) == "09");
			break;
		case "+86": //china 手機11碼 開頭為1, 轉國際電話時無前綴碼
			return (phone.length == 11 && phone.substring(0,1) == "1");
			break;
		case "+852": //hongkong 手機8碼 無開頭, 轉國際電話時無前綴碼
			return (phone.length == 8);
			break;
		case "+853": //Macau 手機8碼 6開頭, 轉國際電話時無前綴碼
			return (phone.length == 8 && phone.substring(0,1) == "6");
			break;
		case "+1": //america (XXX)XXX-XXXX, 手機10碼 開頭區碼, 轉國際電話時無前綴碼
			return (phone.length == 10);
			break;
	}
	return true;
}

getInternationalPhoneNumber = function(countryCode, phone){
	if( null==countryCode || null==phone ) return "";

	if( checkPhoneValidation(countryCode, phone) ){
		switch(countryCode){
			case "+886": //taiwan 手機10碼 開頭為09, 轉國際電話時去掉前綴'0'共1碼
				return phone.substring(1,phone.length);
				break;
			default: //china 手機號碼11碼 開頭為1, 轉國際電話時無前綴碼
				return phone;
				break;
		}
	}
	return "";
}

/* node-webkit only */
copyTextToClipboard = function( text ){
	try{
		// Load native UI library
		var gui = require('nw.gui');
		// We can not create a clipboard, we have to receive the system clipboard
		var clipboard = gui.Clipboard.get();
		// Or write something
		clipboard.set(text, 'text');
		toastShow( $.i18n.getString("FEED_COPY_CONTENT_SUCC") );
	} catch(e) {
		// errorReport(e);
	}
}


errorReport = function(e){
	if( e ){
		if( e.message.indexOf("riseNotification")==0 ) return;
    	cns.debug("----- errorReport --------------------");
    	if (e.stack){
    		cns.debug(e.stack);
    	} else {
    		cns.debug(arguments.callee.caller, e.message);
    	}
    	cns.debug("-------------------- errorReport -----");
	}
}

deleteFolderRecursive = function(fs, path) {
	if( fs.existsSync(path) ) {
	  fs.readdirSync(path).forEach(function(file,index){
	    var curPath = path + "/" + file;
	    if(fs.lstatSync(curPath).isDirectory()) { // recurse
	      deleteFolderRecursive(fs, curPath);
	    } else { // delete file
	      fs.unlinkSync(curPath);
	    }
	  });
	  fs.rmdirSync(path);
	}
}

clearCache = function(){
	try{
		var gui = require('nw.gui');
		gui.App.clearCache();
		gui.Window.get().reload();
		cns.debug("update successed");
		return true;
		// alert("clear cache 1 succ");
	} catch(e){
		location.reload();
		cns.debug(e.stack);
	}
	return false;
}

setBadgeLabel = function(str){

	//nodeJS用, show程式小icon上面的數字
	try{
		require('nw.gui').Window.get().setBadgeLabel( str );
	}catch(e){
		// cns.debug(e);	//必加, 一般瀏覽器require not defined
	}
}

clearBadgeLabel = function(){
	//nodeJS用, show程式小icon上面的數字
	try{
		require('nw.gui').Window.get().setBadgeLabel("");
	}catch(e){
		// cns.debug(e);	//必加, 一般瀏覽器require not defined
	}
}

loadScript = function(filePath) {
	var pathArr = filePath.split('/');
	var scriptName = pathArr[pathArr.length-1].split(".")[0];
	var objName = scriptName.substring(0,1).toUpperCase() + scriptName.substring(1);
	var deferred = $.Deferred();
	    
	if(typeof window[objName] == "undefined"){
		$.get(filePath,function(){
			deferred.resolve(objName);
		});
	}else{
		deferred.resolve(objName);
	}

	return deferred.promise();
}

//等待變數完成
myWait = function(variable,type){
	var deferred = $.Deferred();
	var cnt = 0;
	(function(){
		if (cnt > 30) {
			deferred.resolve(false);
			return false;
		} else {
			cnt++;
		}
		var args = arguments;
		setTimeout(function(){
			if ( ( typeof type === "undefined" && typeof variable() !== "undefined" ) || ( typeof type !== "undefined" && variable() !== type ) )
			  deferred.resolve();
			else
			  args.callee.apply(this,args);
		},100);
	})(arguments)

  return deferred.promise();
}

zipVideoFile = function (videoObj) {
	var transferBlobDef = $.Deferred();
	try {
		var ffmpeg = require('fluent-ffmpeg');
		var fs = require('fs');
    	var path = require('path');
    	var nwDir = path.dirname(process.execPath); //node webkit 根目錄
	    var outputPath = nwDir + '/video/outputfile.mp4'; //輸出影片檔案
	    var command = ffmpeg(videoObj.file.path); 

    	var duration, //轉檔總時間 
	    	seconds,　//目前進行的時間
	       	percent; //轉檔百分比;

	       	zipVideoActionDef = $.Deferred();

	    if (!fs.existsSync(nwDir + '/video')) {
	    	fs.mkdirSync(nwDir + '/video');
		}

		command.setFfmpegPath(nwDir + '/bin/ffmpeg');

	    command.size('640x320')
	    	.outputOptions('-crf 24')
	    	.outputOptions('-c:a copy')
	     	.on('start', function(commandLine) {
	     		if (videoObj.setAbortFfmpegCmdEvent) {
	     			videoObj.setAbortFfmpegCmdEvent(command);
	     		}
	            console.log('Spawned Ffmpeg with command: ' + commandLine);
	        })
	        .on('stderr', function(stderrLine) {
	        	var match;
	        	console.log(stderrLine);
	        	// 找出ffmpeg回傳的duration，再轉換成秒數
	            if (stderrLine.trim().startsWith('Duration')) {
	                match = stderrLine.trim().match(/Duration:\s\d\d\:\d\d:\d\d/).toString().split('Duration:').slice(1).toString().split(':');
	                duration = +match[0] * 60 * 60 + +match[1] * 60 + +match[2];
	            } else if (stderrLine.trim().indexOf('size=') > 0 ) {
	            	// 找出ffmpeg回傳的目前執行的時間，再轉換成秒數，並更新進度條狀態
	                match = stderrLine.trim().match(/time=\d\d\:\d\d:\d\d/).toString().split('time=').slice(1).toString().split(':');
	                seconds = +match[0] * 60 * 60 + +match[1] * 60 + +match[2];
	                percent = ((seconds / duration) * 50).toFixed();

	                if (videoObj.updateCompressionProgress) {
	               	 	videoObj.updateCompressionProgress(percent);
	                }
	            }
	        })
	        .on('error', function(err, stdout, stderr) {
	            console.log('Cannot process video ' + err.message);
	            zipVideoActionDef.reject('Cannot process video: ' + err.message);
	        })
	        .on('end', function(stdout) {
	        	console.log('finish');
	            zipVideoActionDef.resolve();
	        }).saveToFile(outputPath);

	        zipVideoActionDef.done(function () {
		        fs.readFile(outputPath, function(err, data) {
		            var byteArray = new Uint8Array(data);
		            var blob = new Blob([byteArray], {type: 'application/octet-binary'});
		            blob.name = videoObj.file.name;
		            transferBlobDef.resolve(blob);
		        });
		    }).fail(function (errorMsg) {
		    	console.log(errorMsg);
		    });
	} catch (e) {
		transferBlobDef.reject();
	}
	
    return transferBlobDef.promise();
}

function setPolling(ts) {
	var pp = $.lStorage("_pollingData");
	pp.ts.pt = ts;
	$.lStorage("_pollingData", pp);
};

function getUnreadUserList(readUserList) {
	var groupMembers = QmiGlobal.groups[gi].guAll;
	var readUserIdList = readUserList.map(function(readUser) {
		return readUser.gu;
	});

	return Object.keys(groupMembers).reduce(function (unreaderlist, key) {
		if (key != "undefined" && groupMembers[key].st == 1) {
			if (readUserIdList.indexOf(key) < 0) {
				unreaderlist.push({gu: key});
			} 
		}
		return unreaderlist;
	}, []);
}
