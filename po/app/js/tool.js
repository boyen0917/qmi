$(function(){

	//ajax
	ajaxDo = function (api_name,headers,method,load_show_chk,body,ajax_msg_chk,err_hide){
		//設定是否顯示 loading 圖示
		load_show = load_show_chk;

		//提示訊息選擇
		if(ajax_msg_chk) ajax_msg = true;
		
	    //cns.debug(api_url);
	    var api_url = base_url + api_name;
	    var myRand = Math.floor((Math.random()*1000)+1);

	    if(body){
	        body = JSON.stringify(body);
	    }
	    
	    var result = $.ajax ({
            url: api_url,
            type: method,
            headers:headers,
            data:body,
            errHide: err_hide || false
        });
	    
	    return result;
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
		var dataURL = canvas.toDataURL("image/jpeg",quality);
		var img_obj = {
			w: Math.floor(tempW),
			h: Math.floor(tempH),
			blob: dataURItoBlob(dataURL)
		}
		return img_obj;
	}

	dataURItoBlob = function(dataURI) {
        var binary = atob(dataURI.split(',')[1]);
        var array = [];
        for(var i = 0; i < binary.length; i++) {
            array.push(binary.charCodeAt(i));
        }
        return new Blob([new Uint8Array(array)], {type: 'image/jpeg'});
    }


	//調整個人頭像
	avatarPos = function (ori_img,x){

		//reset
		var src = ori_img[0].src;
		var parent = ori_img.parent();
		ori_img.remove();
		var img = $("<img src='" + src + "'>​");
		parent.prepend(img);
		

		img.load(function() {
            var w = img.width();
            var h = img.height();
	        if(!x){
	        	x = avatar_size;
	        }
            mathAvatarPos(img,w,h,x);
        });
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
		$(".popup-confirm").html("確認");
		$(".popup-cancel").html("取消");

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

	    if(callback) $(".popup").data("callback",callback);


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
													cns.debug("commit後的 data:",data);
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
		if(typeof idb_timeline_events != "undefined") idb_timeline_events.clear();
		if(typeof g_idb_chat_msgs != "undefined") g_idb_chat_msgs.clear();
		if(typeof g_idb_chat_cnts != "undefined") g_idb_chat_cnts.clear();
    	localStorage.clear();
    }

	getFilePermissionId = function(object_str){
		var object_obj = $.parseJSON(object_str);
		var gul_arr = [];
		$.each(object_obj,function(i,val){
			var temp_obj = {
				gu: i,
				n: val
			}
			gul_arr.push(temp_obj);
		});
		var api_name = "groups/" + gi + "/permissions";

        var headers = {
                 "ui":ui,
                 "at":at, 
                 "li":lang,
                     };
        var body = {
                ti: ti_feed,
                tu:{
                  gul: gul_arr 
                }
            }

        var method = "post";
        var pi_result = ajaxDo(api_name,headers,method,false,body);
		return pi_result;
	}

	getS3UploadUrl = function(ti,tp,pi){
		var api_name = "groups/" + gi + "/files";

        var headers = {
                 "ui":ui,
                 "at":at, 
                 "li":lang,
                     };
        var method = "post";
        var body = {
                  // fn: "filename", //目前已無用
                  tp: tp,
                  ti: ti,
                  pi: pi
                }
        return ajaxDo(api_name,headers,method,false,body);
	}

	uploadImgToS3 = function(url,file){
		return $.ajax ({
            url: url,
			type: 'PUT',
			contentType: " ",
		 	data: file, 
			processData: false
        });
	}
	
	uploadCommit = function(fi,ti,pi,tp,mt,si,md){
		var api_name = "groups/" + gi + "/files/" + fi + "/commit";
        var headers = {
                 "ui":ui,
                 "at":at, 
                 "li":lang,
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

	uploadGroupImage = function(file, ti, permission_id, ori_arr, tmb_arr, pi, callback){
		
		var reader = new FileReader();
		reader.onloadend = function() {
			var tempImg = new Image();
		    tempImg.src = reader.result;
		    tempImg.onload = function(){
		        var o_obj = imgResizeByCanvas(this,0,0,ori_arr[0],ori_arr[1],ori_arr[2]);
		        var t_obj = imgResizeByCanvas(this,0,0,tmb_arr[0],tmb_arr[1],tmb_arr[2]);

				getS3UploadUrl(ti, 1, pi).complete(function(data){
		    		cns.debug("!");
		    	
					var s3url_result = $.parseJSON(data.responseText);
					if(data.status == 200){
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

					        			uploadCommit(fi,ti,pi,1,file.type,o_obj.blob.size,md).complete(function(data){
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

	randomHash = function(length){
		if(length<=0)	return "";
		
	    var text = "";
	    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	    for( var i=0; i < length; i++ )
	        text += possible.charAt(Math.floor(Math.random() * possible.length));

	    return text;
	}

	Date.prototype.toFormatString = function(){
		var now = new Date();
		var diff = (now.getTime()-this.getTime())/1000;
		var language = window.navigator.userLanguage || window.navigator.language;

		//within min
		if( diff<60 ){
			return $.i18n.getString("COMMON_JUST_NOW");
		} else if( diff<3600 ){	//within hour
			return $.i18n.getString("COMMON_NMINUTES_AGO", Math.floor(diff/60) );
		} else if( diff<86400 ){	//today
			return $.i18n.getString("COMMON_NHOURS_AGO", Math.floor(diff/3600) );
		} else if( diff<172800 ){	//yesterday
			var options = {hour: "2-digit", minute: "2-digit"};
			return $.i18n.getString("COMMON_YESTERDAY")+" "+this.toLocaleTimeString(language, options);
		} else if( now.getYear()==this.getYear() ){	//within a year
			var options = {
			    month: "numeric",
			    day: "numeric", hour: "2-digit", minute: "2-digit"
			};
			return this.toLocaleTimeString(language, options);
		}
		var options = {
		    year: "numeric", month: "numeric",
		    day: "numeric", hour: "2-digit", minute: "2-digit"
		};
		return this.toLocaleTimeString(language, options);
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
});