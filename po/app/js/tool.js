$(function(){

	//ajax
	ajaxDo = function (api_name,headers,method,load_show_chk,body,ajax_msg_chk,err_hide, privateUrl){
		
		//設定是否顯示 loading 圖示
		load_show = load_show_chk;

		//提示訊息選擇
		if(ajax_msg_chk) ajax_msg = true;

	    var api_url = base_url + api_name;

	    // var myRand = Math.floor((Math.random()*1000)+1);
	    
	    //帶privateUrl的話自己改header
	    //如果沒帶privateUrl, 會將api, body, header的ci+gi的形式還原成gi
	    //再將url, ui, at取代
	    if( privateUrl ){
	    	api_url = "https://"+privateUrl +"/apiv1/"+ api_name;
	    } else {
			var api_name_parse, header_parse, body_parse, pri_cloud, ori_gi;
			api_name_parse = parsePrivateGi(api_name);
			if( headers && headers.gi )	header_parse = parsePrivateGi(headers.gi);
			if( body && body.gi ) body_parse = parsePrivateGi(headers.gi);
			if( api_name_parse || header_parse || body_parse ){
				if( api_name_parse ){
					var ciTmp = api_name_parse.ci;
					ori_gi = api_name_parse.gi;
					var pri_data = $.lStorage("_pri_group");
					if( pri_data.hasOwnProperty(ciTmp) ){
						pri_cloud = pri_data[ciTmp];
						if( pri_cloud ){
							if( headers.ui ) headers.ui = pri_cloud.ui;
							if( headers.at ) headers.at = pri_cloud.at;
						}
					}
					api_url = "https://"+pri_cloud.cl +"/apiv1/"+ api_name_parse.newStr;
				}
				if( header_parse ){
					if(ori_gi){
						headers.gi = ori_gi;
					} else {
						var ciTmp = header_parse.ci;
						ori_gi = header_parse.gi;
						var pri_data = $.lStorage("_pri_group");
						if( pri_data.hasOwnProperty(ciTmp) ){
							pri_cloud = pri_data[ciTmp];
							if( pri_cloud ){
								if( headers.ui ) headers.ui = pri_cloud.ui;
								if( headers.at ) headers.at = pri_cloud.at;
								if( pri_cloud.hasOwnProperty(giTmp) ){
									pri_group = pri_cloud[giTmp];
								}
							}
						}
						headers.gi = giTmp;
						api_url = "https://"+pri_cloud.cl +"/apiv1/"+ api_name;
					}
				}
				if( body_parse ){
					if(ori_gi){
						body.gi = ori_gi;
					} else {
						var ciTmp = body_parse.ci;
						ori_gi = body_parse.gi;
						var pri_data = $.lStorage("_pri_group");
						if( pri_data.hasOwnProperty(ciTmp) ){
							pri_cloud = pri_data[ciTmp];
							if( pri_cloud ){
								if( headers.ui ) headers.ui = pri_cloud.ui;
								if( headers.at ) headers.at = pri_cloud.at;
								if( pri_cloud.hasOwnProperty(giTmp) ){
									pri_group = pri_cloud[giTmp];
								}
							}
						}
						headers.gi = giTmp;
						api_url = "https://"+pri_cloud.cl +"/apiv1/"+ api_name;
					}
				}
			}
		}

	    if(body){
	        body = JSON.stringify(body);
	    }

	    var ajaxArgs = {
            url: api_url,
            type: method,
            headers:headers,
            data:body,
            errHide: err_hide || false
        };

        // AjaxTransfer 使用 ajaxDo.call 把額外的參數 extend進去
        if(this != window) {
        	$.extend(this,ajaxArgs);
        	ajaxArgs = this;
        }
		return $.ajax(ajaxArgs);	
	}


	//ajax 轉換
	AjaxTransfer = function(){
		this.headers = {ui:ui,at:at,li:lang};
	}

	AjaxTransfer.prototype = {
		STRIP_COMMENTS: /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg,
		ARGUMENT_NAMES: /([^\s,]+)/g,

		ajaxArgs: {
			method: "get",
			timeout: 30000
		},
		
		getParamNames: function(func) {
			var fnStr = func.toString().replace(this.STRIP_COMMENTS, '');
			var result = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(this.ARGUMENT_NAMES);
			if(result === null) result = [];

			return result;  
		},

		execute: function(args){
			args.headers = args.headers || {};
			// object clone 避免把prototype 的ajaxArgs 改變
			var argsClone = JSON.parse(JSON.stringify(this.ajaxArgs));

			$.extend(args.headers,this.headers);
		    $.extend(argsClone,args);

		 //    var newArr=[];
			// var paramArr = this.getParamNames(ajaxDo);
			// for (i = 0; i < paramArr.length; i++) {
			// 	if(paramArr[i] == "api_name"){
			// 		newArr.push(argsClone.url);
			// 		delete argsClone.url;
			// 	}else{
			// 		newArr.push(argsClone[paramArr[i]] || null);	
			// 	}
			// 	delete argsClone[paramArr[i]];
			// };
			// cns.debug("ajax args",{args:newArr,newAttr:argsClone});
			//把新加入的ajax變數當作this 傳到ajaxdo 做 extend加入 return deferred物件
			// if(args.gsp === true) {
			var newArr = [
				argsClone.url,
				argsClone.headers,
				argsClone.method,
				argsClone.load_show_chk ,
				argsClone.body ,
				argsClone.ajax_msg_chk ,
				argsClone.err_hide ,
				argsClone.privateUrl
			];
			// }

			// headers,method,load_show_chk,body,ajax_msg_chk,err_hide, privateUrl
			return (ajaxDo.apply(argsClone,newArr));
		}
	}
	 
    _pri_split_chat = "#";
    getPrivateGi = function( this_ci, this_gi ){
        return _pri_split_chat+this_ci+_pri_split_chat+this_gi+_pri_split_chat;
    }
    parsePrivateGi = function( str ){
        if(!str) return null;
        var parse = str.split(_pri_split_chat);
        if( parse.length>1 ){
            var data = {
                    ci: parse[1],
                    gi: parse[2]
                };
            parse[1]="";
            data.newStr = parse.join("");
            return data;
        }
        return null;
    }

	reLogin = function() {
		document.location = "index.html";
	}

	//縮圖
	imgResizeByCanvas = function(img,x,y,max_w,max_h,quality){
		var MAX_WIDTH = max_w;
		var MAX_HEIGHT = max_h;
		var tempW = img.width;
		var tempH = img.height;
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
		var ctx = canvas.getContext("2d");
		ctx.drawImage(img, x, y, tempW, tempH);
		var dataURL = canvas.toDataURL("image/png",quality);
		var img_obj = {
			w: Math.floor(tempW),
			h: Math.floor(tempH),
			blob: dataURItoBlob(dataURL)
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
		// var dataView = new Uint8Array(video);
		// var dataBlob = new Blob([dataView]);//new blob
		// return dataBlob;
		if( null==videoDom || videoDom.length<=0 ) return null;
		var video = videoDom[0];
		if( null==video ) return null;
		var vid_obj = {
			l: Math.floor(video.duration*1000),
			blob: dataURItoBlob( videoDom.attr("src") )
		}
		return vid_obj;
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

	htmlFormat = function (str){
        str = str.replace(/\n/g," \n ").split(" ");
        $.each(str,function(i,val){
            if(val.substring(0, 7) == 'http://' || val.substring(0, 8) == 'https://'){
                encode_val = "<a href=\"" + encodeHtmlEntity(val) + "\" target=\"_blank\">" + encodeHtmlEntity(val) + "</a>";
            }else{
                encode_val = encodeHtmlEntity(val);
            }
            if(encode_val) str.splice(i,1,encode_val);
        });

        return str.join(" ").replaceEmoji();
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
    $(".popup-confirm").click(function(){
    	if($(".popup").data("callback")){
    		var func = $(".popup").data("callback")[0];
    		var arguments = $(".popup").data("callback")[1];
			func(arguments);
    	}
		$(".popup-screen").trigger("close");
	});

	$(".popup-cancel").click(function(){
		$(".popup-screen").trigger("close");
	});


	$(".popup-screen").bind("close",function(){
		
	    $(".popup").fadeOut("fast",function(){
	    	$(".popup-screen").hide();	
	    });
	    //ajax也關
	    $('.ui-loader').hide();
		$(".ajax-screen-lock").hide();

	    $("body").removeClass("screen-lock");
	});

	//對話框設定
	popupShowAdjust = function (title,desc,confirm,cancel,callback){
		// cns.debug("========彈跳視窗========");
		// cns.debug("title:",title);
		// cns.debug("desc:",desc);
		// cns.debug("confirm:",confirm);
		// cns.debug("cancel:",cancel);
		// cns.debug("=======================");

		// $("body").addClass("screen-lock");
		
		//default
		$(".popup-confirm").html( $.i18n.getString("COMMON_OK") );
		$(".popup-cancel").html( $.i18n.getString("COMMON_CANCEL") );

		if(title){
			$('.popup-title').html(title);
		}else{
			$('.popup-title').html("");
		}
	    if(desc){
	    	$('.popup-text').show();
	        $('.popup-text').html(desc);
	    }else{
	    	$('.popup-text').hide();
	    }
	    if(confirm){
	    	$(".popup-confirm").show();
	    	$('.popup-cancel').removeClass("full-width");

	    	if(typeof confirm == "string"){
	    		if(confirm.split("+")[2]){
	    			$(".popup-confirm").html(confirm.split("+")[2]);
	    		}
	    		$(".popup-confirm").data("todo",confirm);
	    	}
	    }else{
	    	$(".popup-confirm").hide();
	    	$('.popup-cancel').addClass("full-width");
	    	
	    }
	    if(cancel){
	    	$(".popup-cancel").show();
	    	$('.popup-confirm').removeClass("full-width");
	    	if(typeof cancel == "string"){
	    		if(cancel.split("+")[2]){
	    			$(".popup-cancel").html(cancel.split("+")[2]);
	    		}
	    		$(".popup-confirm").data("todo",confirm);
	    	}
	    }else{
	    	$(".popup-cancel").hide();
	    	$('.popup-confirm').addClass("full-width");
	    }

	    //clear callback
	    if( null==callback ){
	    	$(".popup").removeData("callback");
	    } else{
	    	$(".popup").data("callback",callback);
	    }


	    if(!confirm && !cancel){
	    	setTimeout(function(){
    			$(".popup-screen").trigger("close");
    			$("body").removeClass("screen-lock");
    		},2000);
	    }

	    $(".popup-screen").show();
	    $(".popup").show();

	    $(".popup-frame").css("margin-left",0);
	    $(".popup-frame").css("margin-left",($(document).width() - $(".popup-frame").width())/2);
	    
	}

	changePageAfterPopUp = function(page){
		$.mobile.changePage(page);
	}

	
	//================================== language ===========================

	updateLanguage = function( lanPath ){
		$.i18n.load(lanPath, function(){
			$('body')._i18n();
		});
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

	resetDB = function(){
		clearBadgeLabel();
		if(typeof idb_timeline_events != "undefined") idb_timeline_events.clear();
		if(typeof g_idb_chat_msgs != "undefined") g_idb_chat_msgs.clear();
		if(typeof g_idb_chat_cnts != "undefined") g_idb_chat_cnts.clear();
    	var verTmp = localStorage["_ver"];
    	var loginRememberTmp = localStorage["_loginRemeber"];

    	localStorage.clear();

    	if(verTmp) localStorage["_ver"] = verTmp;
    	if(loginRememberTmp) localStorage["_loginRemeber"] = loginRememberTmp;
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
				// console.debug( this.toLocaleTimeString(language, options) );
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

	showGallery = function( this_gi, this_ti, gallery_arr, startIndex, title, isWatermark, watermarkText ){
		startIndex = startIndex || 0;
        var gallery = $(document).data("gallery");
        if( null != gallery && false==gallery.closed){
            gallery.focus();
            gallery.ui = ui;
            gallery.at = at;
            gallery.lang = lang;
            gallery.this_gi = this_gi;
            gallery.this_ti = this_ti;
            gallery.list = gallery_arr;
            gallery.startIndex = startIndex;
            gallery.title = title;
            gallery.isWatermark = isWatermark;
            gallery.watermarkText = watermarkText;
            var dataDom = $(gallery.document).find(".dataDom");
            dataDom.click();
        } else {
            gallery = window.open("layout/general_gallery.html", "", "width=480, height=730");
            $(document).data("gallery", gallery);
            $(gallery.document).ready(function(){
                setTimeout(function(){
                    gallery.ui = ui;
                    gallery.at = at;
                    gallery.lang = lang;
                    gallery.this_gi = this_gi;
                    gallery.this_ti = this_ti;
                    gallery.list = gallery_arr;
                    gallery.startIndex = startIndex;
                    gallery.title = title;
                    gallery.isWatermark = isWatermark;
                    gallery.watermarkText = watermarkText;
                    var dataDom = $(gallery.document).find(".dataDom");
                    dataDom.click();
                },1000);
            });
        }
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
			var userData = $.lStorage(ui);
			if( !userData.hasOwnProperty(this_gi) ){
				userData[this_gi] = data;
				$.lStorage(ui, userData);
				return;
			}
			var group = userData[this_gi];

			var updateKeys = ["auo","aut","cnt"];
			var ignoreKeys = ["rsp_code"];
			for( var key in data ){
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

			$.lStorage(ui, userData);
		} catch(e){
			errorReport(e);
		}
	}

	//更新團體資訊
	updateGroupAllInfoDom = function( this_gi ){
		try{
			var userData = $.lStorage(ui);
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

			//update name
			var gn = htmlFormat( group.gn );
			var gd = htmlFormat( group.gd );
			$(".polling-group-name[data-gi="+this_gi+"]").html(gn);
			$(".polling-group-description[data-gi="+this_gi+"]").html(gd);

			if( gi==this_gi ){
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
				$(".polling-group-name.currentGroup").html(gn);
				$(".polling-group-description.currentGroup").html(gd);
			}
			
		} catch(e){
			errorReport(e);
		}
	}

	updateGroupIconDom = function( this_gi ){
		try{
			var userData = $.lStorage(ui);
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
        	if(data.status == 200){

        		var branch_list = $.parseJSON(data.responseText);
        		setBranchList( this_gi, branch_list, callback );
        	}
        });
	}

	setBranchList = function(this_gi, branch_list, callback){
		var this_gi = this_gi || gi;
		if( !this_gi ) return;
		window.testBl = branch_list;
		console.debug("branch_list",branch_list);
    	//取得團體列表
        // var api_name = "groups/" + this_gi + "/branches";
        // var headers = {
        //     "ui":ui,
        //     "at":at,
        //     "li":lang
        // };

        // var method = "get";
        // ajaxDo(api_name,headers,method,false).complete(function(data){
        	// if(data.status == 200){

        		// var branch_list = $.parseJSON(data.responseText);
        		var new_bl = {};
        		var new_fbl = {};
                var _groupList = $.lStorage(ui);
                var guAll = _groupList[this_gi].guAll;

                //branch
        		if(branch_list.bl.length) {
                    //初始化陣列
        			$.each(branch_list.bl,function(i,val){
                        if( null==val.bp|| val.bp.length==0 ) return;

                        var bp_arr = val.bp.replace(/^\./, '').split(".");
                        var pi = "";
                        if(bp_arr.length > 1){
                            pi = bp_arr[bp_arr.length-2]
                        }
        				new_bl[bp_arr.last()] = {
        					lv: bp_arr.length,
        					bn: val.bn,
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
                    
                    window.testNewBl = new_bl;
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
        		}

                //fav branch
        		if(branch_list.fbl.length) {
        			$.each(branch_list.fbl,function(i,val){
	        			new_fbl[val.fi] = {fn:val.fn, cnt:0};
	        		});
        		}

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

                _groupList[this_gi].favCnt = favCnt;
            	_groupList[this_gi].bl = new_bl;
            	_groupList[this_gi].fbl = new_fbl;
            	$.lStorage(ui,_groupList);

            	if( callback ) callback(this_gi);
        	// }
    //     });
    }

    getGroupCompetence = function( this_gi ){
    	var tmp = {
    		isAdmin: false,
    		isOfficial: false
    	}
    	try{
    		var groupData = $.lStorage(ui)[this_gi];
			if( groupData.ad==1 ){
				tmp.isAdmin = true;
			}
			if( groupData.isOfficial ){
				tmp.isOfficial = groupData.isOfficial;
			}
    	} catch(e){
    		errorReport(e);
    	}
    	return tmp;
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
			videoTag.addClass("loaded");
			if( videoTag.length>0 ){
				var video = videoTag[0];
				video.oncanplay = function(event){
					videoTag.addClass("loaded");
					if(onload) onload(videoTag);
				}
				video.onerror = function(event){
					videoTag.addClass("error");
					if(onError) onError(videoTag);
				}
				// var timer = 0;
				// video.addEventListener('progress', function (e) {
				//     if (this.buffered.length > 0) {

				//         if (timer != 0) {
				//             clearTimeout(timer);
				//         }

				//         timer = setTimeout(function () {
				//         	var loadPercent = parseInt(video.buffered.end(0) / video.duration * 100);
				//             if( loadPercent== 100 ) {
				//                 if( onload ) onload(videoTag);
				//                 clearTimeout(timer);
				//             };          
				//         }, 1500);

				//     }
				// }, false); 
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
			videoTag[0].oncanplay = function(event){
				videoTag.addClass("loaded");
				if(onload) onload(videoTag);
			}
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
	    	console.debug("----- errorReport --------------------");
	    	if (e.stack){
	    		console.debug(e.stack);
	    	} else {
	    		console.debug(arguments.callee.caller, e.message);
	    	}
	    	console.debug("-------------------- errorReport -----");
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
    		cns.debug(e.stack);
   //  		alert(e.stack);
			// alert("clear cache 1 fail");

	  //   	try{
			// 	var path = require('nw.gui').App.dataPath;
		 //    	var fs = require('fs');
			// 	deleteFolderRecursive(fs, path);
			// 	alert("clear cache 2 succ");
			// } catch(e){
			// 	alert(e.stack);
			// 	alert("clear cache 2 fail");
			// }
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

});