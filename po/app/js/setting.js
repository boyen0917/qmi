
$(document).ready( function(){
	$(document).on("click",".gs-row",function(e){
		var type = $(this).data("type");
		switch( type ){
			case "permission":
				showUpdatePermissionPage();
				break;
			case "info":
				showGroupInfoPage();
				break;
		}
	});

	$(document).on("click", ".gs-leave", function(){
		popupShowAdjust( $.i18n.getString("GROUPSETTING_LEAVE_ALERT_TITLE"),
			$.i18n.getString("GROUPSETTING_LEAVE_ALERT_CONTENT"),
			true, true, [function(){
				requestLeaveGroup( gi, gu);
			},null] );
	});




	$(document).on("click",".ga-header-back",function(e){
		var tmp = $(".subpage-groupAbout").data("lastPage");
		if( tmp ) $(tmp).show();
		$(".subpage-groupAbout").data("lastPage",null);
		$(".subpage-groupAbout").off("animate").animate(
			{marginLeft: '100%'}, 1000, function(){
				$(".subpage-groupAbout").hide();
		});
	});

	//-------------- group img -------------------

	//file upload
	$(document).on("click",".ga-avatar-photo.admin",function(e){
		$(".ga-avatar input").trigger("click");
	});

	//檔案上傳
	$(document).on("change",".ga-avatar input",function(e){
		var input = $(this);
		input.removeClass("ready");
		var imageType = /image.*/;
		var file = $(this)[0].files[0];
		if (file.type.match(imageType)) {
			var reader = new FileReader();
			reader.onload = function(e) {
				var img = $(".ga-avatar-img.upload");
				//reset
				img.attr("src",reader.result);
				img.fadeIn();
		        
		        input.addClass("ready");
		        //有更動即可按確定
		        // this_info.find(".user-info-submit").addClass("user-info-submit-ready");

		        // //記錄更動
		        // this_info.data("avatar-chk",true);
				checkGroupInfoChange();
			}
			reader.readAsDataURL(file);
		}else{
			//clear input file
			var this_file = $(this);
			this_file.replaceWith( this_file = this_file.clone( true ) );

			//警語
			popupShowAdjust("", $.i18n.getString("COMMON_NOT_IMAGE") );
		}
	});
	//為了阻止網頁跳轉
	$(document).on("dragover","body",function(e){
		e.preventDefault();
        e.stopPropagation();
	});
	$(document).on("drop","body",function(e){
		e.preventDefault();
        e.stopPropagation();
	});

	$(document).on("drop",".ga-avatar.admin",function(e){
		//為了阻止網頁跳轉
		e.preventDefault();
	    e.stopPropagation();
	        
	    $(".ga-avatar input")[0].files = e.originalEvent.dataTransfer.files;
	});

	//--------------- group name & description ---------
	$(document).on("input",".ga-info.edit .ga-info-row .content",function(e){
		var content = $(this);
		if( content.val() 
			&& content.val().length>0 
			&& content.data("oriText") != content.val() ){
			content.addClass("ready");
		} else {
			content.removeClass("ready");
		}
		checkGroupInfoChange();
	});
	$(document).on("keydown keyup",".ga-info.edit .ga-info-row .autoHeight",function(e){
		$(this).height('0px').height($(this).prop("scrollHeight")+"px");
	});

	//---------- on done ---------------
	$(document).on("click",".ga-header-done.ready", function(e){
		var edit = $(".ga-info.edit");
		var newGn = null;
		var newGd = null;
		var updateDom = edit.find(".ga-info-row .content");
		$.each( updateDom, function(i,domTmp){
			var dom = $(domTmp);
			var type = dom.parent().data("type");
			switch( type ){
				case "name":
					if(dom.hasClass("ready")) newGn = dom.val();
					else newGn = dom.data("oriText");
					break;
				case "info":
					if(dom.hasClass("ready")) newGd = dom.val();
					else newGd = dom.data("oriText");
					break;
			}
		});
		var file = null;
		var input = $(".ga-avatar input.ready");
		if( input.length> 0 ){
			file = input[0].files[0];
		}
		requestUpdateGroupInfo( gi, newGn, newGd, file, function(){
			resetGroupInfo();
		});
	});

	$(document).on("click",".ga-info.view.admin", function(){
		$(this).hide();
		$(".ga-info.edit").show();
	});
});

/*
              ██╗     ███████╗ █████╗ ██╗   ██╗███████╗          
              ██║     ██╔════╝██╔══██╗██║   ██║██╔════╝          
    █████╗    ██║     █████╗  ███████║██║   ██║█████╗      █████╗
    ╚════╝    ██║     ██╔══╝  ██╔══██║╚██╗ ██╔╝██╔══╝      ╚════╝
              ███████╗███████╗██║  ██║ ╚████╔╝ ███████╗          
              ╚══════╝╚══════╝╚═╝  ╚═╝  ╚═══╝  ╚══════╝          
                                                                 
*/

function initGroupSetting(){
	// 如果是管理者的話顯示額外設定
    try{
        var userData = $.lStorage(ui);
        var group = userData[gi];
        if( 1==group.ad ){
            $(".gs-row[data-type=permission]").show();
            $(".gs-row[data-type=info]").show();
        } else {
            $(".gs-row[data-type=permission]").hide();
            $(".gs-row[data-type=info]").hide();
        }

        //離開團體開關
        if( group.set.s11==0 || group.set.s11==2 ){
        	$(".gs-leave").show();
        } else {
        	$(".gs-leave").hide();
        }
    } catch(e){
        errorReport(e);
    }
}

function requestLeaveGroup( this_gi, this_gu, callback ){
	// PUT /groups/{gi}/users/{gu}/status
	// {
	//   "st": 1 // 1(正常)、2(已退出)
	// }
	var api_name = "/groups/"+this_gi+"/users/"+this_gu+"/status";
    var headers = {
            ui: ui,
	        at: at,
	        li: lang
                 };
    var method = "put";
    var body = { st: 2 };
    
    ajaxDo(api_name,headers,method,true,body).complete(function(data){
    	if(data.status == 200){
    		$(".sm-group-area[data-gi="+this_gi+"]").remove();
    		var otherGroup = $(".sm-group-area.enable");
    		if( otherGroup.length>0 ){
    			$(otherGroup[0]).trigger("click");
    		} else{
    			document.location = "login.html";
    		}

    		//remove group data
    		try{
    			//local storage
	    		var userData = $.lStorage(ui);
	    		if( userData.hasOwnProperty(this_gi) ){
	    			delete userData[this_gi];
	    		}

	    		//----- TODO -------
	    		//
	    		// remove from idb
	    		//
	    		//----- TODO -------

		    } catch(e){
		    	errorReport(e);
		    }

	        if( callback ) callback();
    	}
    });
}


/*
         ██████╗ ███████╗ ██████╗  ███╗   ███╗ ██╗ ███████╗ ███████╗ ██╗  ██████╗  ███╗   ██╗          
         ██╔══██╗██╔════╝ ██╔══██╗ ████╗ ████║ ██║ ██╔════╝ ██╔════╝ ██║ ██╔═══██╗ ████╗  ██║          
 █████╗  ██████╔╝█████╗   ██████╔╝ ██╔████╔██║ ██║ ███████╗ ███████╗ ██║ ██║   ██║ ██╔██╗ ██║    █████╗
 ╚════╝  ██╔═══╝ ██╔══╝   ██╔══██╗ ██║╚██╔╝██║ ██║ ╚════██║ ╚════██║ ██║ ██║   ██║ ██║╚██╗██║    ╚════╝
         ██║     ███████╗ ██║  ██║ ██║ ╚═╝ ██║ ██║ ███████║ ███████║ ██║ ╚██████╔╝ ██║ ╚████║          
         ╚═╝     ╚══════╝ ╚═╝  ╚═╝ ╚═╝     ╚═╝ ╚═╝ ╚══════╝ ╚══════╝ ╚═╝  ╚═════╝  ╚═╝  ╚═══╝          
                                                                                                    
*/

function showUpdatePermissionPage(){
	
	//find current admins
	var list = {};
	try{
        var userData = $.lStorage(ui);
        var guAll = userData[gi].guAll;
        for( var gu in guAll ){
        	var mem = guAll[gu];
        	if( 1==mem.ad ){
        		list[gu] = mem.nk;
        	}
        }
    } catch(e){
        errorReport(e);
    }

	var option = {
		isShowGroup:false,
        isShowSelf:true,
		isShowAll:false,
		isShowFav:true,
		isShowFavBranch:false
	};
	var dom = $(".gs-row[data-type=permission]");
	dom.data("object_str",JSON.stringify(list) );
	composeObjectShowDelegate( dom, dom, option, function(){
		try{
			var newList = $.parseJSON( dom.data("object_str") );

			var addList = [];
			var delList = [];

			for( var gu in newList ){
				if( !list.hasOwnProperty(gu) ){
					addList.push(gu);
				}
			}

			for( var gu in list ){
				if( !newList.hasOwnProperty(gu) ){
					delList.push(gu);
				}
			}

			requestUpdatePermission(gi, addList, delList, null);
		} catch(e){

		}
	});
}
function requestUpdatePermission( this_gi, addList, delList, callback){
	// PUT /groups/{gi}/administrators
	// {
	//   "el": // Enabled Admin List
	//   [
	//     "asdfas-fdsa8n3ff-dfsan",
	//     "i234t9sfh34-fdsnaf-34f"
	//   ],
	//   "dl": // Disabled Admin List
	//   [
	//     "sdafie3-f8dsnfa-f3nfda",
	//     "vcxnz-8f34nsa-f83fnsda"
	//   ]
	// }
	var api_name = "/groups/"+this_gi+"/administrators";
    var headers = {
            ui: ui,
	        at: at,
	        li: lang
                 };
    var method = "put";
    var body = {
              el: addList,
              dl: delList
            };
    
    ajaxDo(api_name,headers,method,true,body).complete(function(data){
    	if(data.status == 200){
    		//可以直接改權限, 不過取消admin的權限該是多少？
    		//改成直接打api更新好了...
    		setGroupAllUser(null, this_gi, callback);
    		// try{
		    //     var userData = $.lStorage(ui);
		    //     var guAll = userData[gi].guAll;
		    //     for( var i=0; i<addList.length; i++ ){
		    //     	var gu = addList[i];
		    //     	var mem = guAll[gu];
		    //     	mem.ad = 1;
		    //     }
		    //     for( var i=0; i<delList.length; i++ ){
		    //     	var gu = delList[i];
		    //     	var mem = guAll[gu];
		    //     	mem.ad = 2;
		    //     }
		    // } catch(e){
		    //     errorReport(e);
		    // }
    	} else if(callback) callback( data );
    });
}

/*
              ██╗ ███╗   ██╗ ███████╗ ██████╗           
              ██║ ████╗  ██║ ██╔════╝██╔═══██╗          
    █████╗    ██║ ██╔██╗ ██║ █████╗  ██║   ██║    █████╗
    ╚════╝    ██║ ██║╚██╗██║ ██╔══╝  ██║   ██║    ╚════╝
              ██║ ██║ ╚████║ ██║     ╚██████╔╝          
              ╚═╝ ╚═╝  ╚═══╝ ╚═╝      ╚═════╝           
                                                      
*/
function showGroupInfoPage(){
	var isAdmin = false;
	var groupName = $.i18n.getString("USER_PROFILE_NO_DATA");
	var groupDescription = groupName;
	var groupImg = null;
	try{
        var userData = $.lStorage(ui);
        var group = userData[gi];
        isAdmin = (1==group.ad);
        groupName = group.gn;
        groupDescription = group.gd;
        groupImg = group.auo;
    } catch(e){
        errorReport(e);
    }

	//admin
	var view = $(".ga-info.view");
	view.show();
	$(".ga-info.edit").hide();

	if( isAdmin ){
		view.addClass("admin");
		$(".ga-avatar").addClass("admin");
		$(".subpage-groupAbout .admin").show();
		$(".subpage-groupAbout .general").hide();
		$(".ga-header-bar").removeClass("bgColor");

		$(".ga-info.edit .ga-info-row[data-type='name'] .content").val( groupName );
		$(".ga-info.edit .ga-info-row[data-type='info'] .content").val( groupDescription );
	} else {
		view.removeClass("admin");
		$(".ga-avatar").removeClass("admin");
		$(".subpage-groupAbout .admin").hide();
		$(".subpage-groupAbout .general").show();
		$(".ga-header-bar").addClass("bgColor");
	}
	

	// if( groupImg ){
	// 	if( $(".ga-avatar-img.groupImg").attr("src")!=groupImg ){
	// 		$(".ga-avatar-img.default").hide();
	// 		$(".ga-avatar-img.groupImg").show();
	// 	} else {
	// 		$(".ga-avatar-img.default").show();
	// 		$(".ga-avatar-img.groupImg").hide();
	// 		$(".ga-avatar-img.groupImg").off("load").load( function(){
	// 			$(".ga-avatar-img.default").fadeOut();
	// 			$(this).fadeIn();
	// 		});
	// 		$(".ga-avatar-img.groupImg").attr("src",groupImg);
	// 	}
	// } else {
	// 	$(".ga-avatar-img.default").show();
	// 	$(".ga-avatar-img.groupImg").hide();
	// }

	// if( $(".subpage-groupSetting").is(":visible") ){
		$(".subpage-groupAbout").css("margin-left","100%");
		$(".subpage-groupAbout").show();
		$(".subpage-groupAbout").off("animate").animate(
			{marginLeft: '0%'}, 1000, function(){
				$(".subpage-groupSetting").hide();
			    $(".subpage-contact").hide();
			    $(".subpage-timeline").hide();
			    $(".subpage-chatList").hide();
			    $(".subpage-album").hide();
		});
		// $(".subpage-groupAbout").data("lastPage", ".subpage-groupSetting");
	// } else {
		// $(".subpage-groupAbout").css("margin-left","0%");
		// $(".subpage-groupAbout").fadeIn();
		if( $(".subpage-contact").is(":visible") ){
			$(".subpage-groupAbout").data("lastPage", ".subpage-contact");
		} else if( $(".subpage-timeline").is(":visible") ){
			$(".subpage-groupAbout").data("lastPage", ".subpage-timeline");
		} else if( $(".subpage-chatList").is(":visible") ){
			$(".subpage-groupAbout").data("lastPage", ".subpage-chatList");
		} else if( $(".subpage-album").is(":visible") ){
			$(".subpage-groupAbout").data("lastPage", ".subpage-album");
		} else if( $(".subpage-groupSetting").is(":visible") ){
			$(".subpage-groupAbout").data("lastPage", ".subpage-groupSetting");
		}
	// }
    // $(".subpage-contact").fadeOut();
    // $(".subpage-timeline").fadeOut();
    // $(".subpage-chatList").fadeOut();
    // $(".subpage-album").fadeOut();

	//reset
	resetGroupInfo();
}

function resetGroupInfo(){
	var img = $(".ga-avatar-img.upload");
	img.css("display","none");
	$(".ga-header-done").removeClass("ready");
	var input = $(".ga-avatar input");
	input.replaceWith( input.clone(true) );

	var contents = $(".ga-info.edit .ga-info-row .content");
	$.each( contents, function(i,dom){
		var domTmp = $(dom);
		domTmp.data("oriText", domTmp.val() );
	});

	$(".ga-info.view").show();
	$(".ga-info.edit").hide();
}

function checkGroupInfoChange(){
	if( $(".ga-avatar input").hasClass("ready") 
		|| $(".ga-info.edit .ga-info-row .content.ready").length>0 ){
		$(".ga-header-done").addClass("ready");
	} else {
		$(".ga-header-done").removeClass("ready");
	}
}

function requestUpdateGroupInfo( this_gi, newGn, newGd, file, callback){
	
	var isReady = false;
	//如果更新資料
	if( null!=newGn || null!=newGd ){
		getUpdateGroupInfoApi(this_gi, newGn, newGd).complete(function(data){
	    	if(data.status == 200){
	    		if( isReady ){
	    			setGroupAllUser(null, this_gi, function(){
		    			if(callback) callback();
		    			s_load_show = false;
		    		});
	    		}
	    		isReady = true;
	    	}
	    });
	} else isReady = true;

    //如果更新頭像
    if( file ){
		var ori_arr = [1280,1280,0.7];
		var tmb_arr = [120,120,0.6];

	    var api_name = "groups/" + this_gi + "/avatar"

	    uploadToS3(file,api_name,ori_arr,tmb_arr,function(chk){
	    	if(!chk) {
	    		toastShow( $.i18n.getString("GROUP_AVATAR_UPLOAD_ALERT") ); //團體頭像上傳失敗
	    	}

	    	if( isReady ){
	    		setGroupAllUser(null, this_gi, function(){
	    			if(callback) callback();
	    			s_load_show = false;
	    		});
	    	}
	    	isReady = true;
	    });
    } else isReady = true;
}

function getUpdateGroupInfoApi( this_gi, newGn, newGd ){
	//PUT /groups/{gi}{?tp} 
	//tp=??
	//{
	//   "gn": "四竹資訊",
	//   "gd": "這是一個敘述"
	// }

	var api_name = "/groups/"+this_gi;
	var headers = {
	        ui: ui,
	        at: at,
	        li: lang
	             };
	var method = "put";
	var body = {};
	if( newGn ) body.gn = newGn;
	if( newGd ) body.gd = newGd;
	
	return ajaxDo(api_name,headers,method,true,body);
}