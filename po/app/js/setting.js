
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
			{marginLeft: '100%'}, 500, function(){
				$(".subpage-groupAbout").hide();
		});
	});

	//-------------- group img -------------------

	//file upload
	$(document).on("click",".ga-avatar-photo.admin",function(e){
		$(".setting-group-avatar").trigger("click");
	});

	//團體頭像上傳
	$(document).on("change",".setting-group-avatar",function(){
		var groupAvatar = $(".ga-avatar");
		var imageType = /image.*/;
		var file_ori = $(".setting-group-avatar");
		var file = file_ori[0].files[0];
		if (file.type.match(imageType)) {
			var reader = new FileReader();
			reader.onload = function(e) {

				$(".ga-avatar > img").remove();
				var new_img = $("<img class='ga-avatar-img'/>");
				groupAvatar.prepend(new_img);
				var imgs = groupAvatar.find(".ga-avatar-img");
				//imgs.hide();
				//var img = imgs.filter(".upload");
				//reset
				imgs.attr("src",reader.result);
				//img.show();
		        //有更動即可按確定
		        // this_info.find(".user-info-submit").addClass("user-info-submit-ready");
		        
		        // //記錄更動
		        // this_info.data("avatar-chk",true);
				//checkGroupInfoChange();

				qmiUploadFile({
					urlAjax: {
						apiName: "groups/"+ gi +"/avatar",
						method: "put"
					},
					file: groupAvatar.find(".ga-avatar-img")[0],
					oriObj: {w: 1280, h: 1280, s: 0.7},
					tmbObj: {w: 480, h: 480, s: 0.6},
					tp: 1 // ;
				}).done(function(data) {
					console.log("finish", data);
					$("img[data-gi='"+gi+"']").attr("src",data.data.tu);
					toastShow(data.data.rsp_msg);
				});
			}
			reader.readAsDataURL(file);

			groupAvatar.find('input[type="file"]').val(null);

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
	// $(document).on("input",".ga-info.edit .ga-info-row .content",function(e){
	// 	var content = $(this);
	// 	if( content.val() 
	// 		&& content.val().length>0 
	// 		&& content.data("oriText") != content.val() ){
	// 		content.addClass("ready");
	// 	} else {
	// 		content.removeClass("ready");
	// 	}
	// 	checkGroupInfoChange();
	// });
	// $(document).on("keydown keyup",".ga-info.edit .ga-info-row .autoHeight",function(e){
	// 	$(this).height('0px').height($(this).prop("scrollHeight")+"px");
	// });

	//---------- on done ---------------
	// $(document).on("click",".ga-header-done.ready", function(e){
	// 	var edit = $(".ga-info.edit");
	// 	var newGn = null;
	// 	var newGd = null;
	// 	var updateDom = edit.find(".ga-info-row .content");
	// 	$.each( updateDom, function(i,domTmp){
	// 		var dom = $(domTmp);
	// 		var type = dom.parent().data("type");
	// 		switch( type ){
	// 			case "name":
	// 				if(dom.hasClass("ready")) newGn = dom.val();
	// 				else newGn = dom.data("oriText");
	// 				break;
	// 			case "info":
	// 				if(dom.hasClass("ready")) newGd = dom.val();
	// 				else newGd = dom.data("oriText");
	// 				break;
	// 		}
	// 	});
	// 	var file = null;
	// 	var input = $(".ga-avatar input.ready");
	// 	if( input.length> 0 ){
	// 		file = input[0].files[0];
	// 	}
	// 	requestUpdateGroupInfo( gi, newGn, newGd, file, resetGroupInfo );
	// });

	
});

/*
              ██╗     ███████╗ █████╗ ██╗   ██╗███████╗          
              ██║     ██╔════╝██╔══██╗██║   ██║██╔════╝          
    █████╗    ██║     █████╗  ███████║██║   ██║█████╗      █████╗
    ╚════╝    ██║     ██╔══╝  ██╔══██║╚██╗ ██╔╝██╔══╝      ╚════╝
              ███████╗███████╗██║  ██║ ╚████╔╝ ███████╗          
              ╚══════╝╚══════╝╚═╝  ╚═╝  ╚═══╝  ╚══════╝          
                                                                 
*/

function requestLeaveGroup( this_gi, this_gu, callback ){
	// PUT /groups/{gi}/users/{gu}/status
	// {
	//   "st": 1 // 1(正常)、2(已退出)
	// }
	var api_name = "groups/"+this_gi+"/users/"+this_gu+"/status";
    var headers = {
            ui: ui,
	        at: at,
	        li: lang
                 };
    var method = "put";
    var body = { st: 2 };
    
    ajaxDo(api_name,headers,method,true,body).complete(function(data){
    	if(data.status == 200){
    		removeGroup( this_gi );

	        if( callback ) callback();
    	}
    });
}

function removeGroup( thisGi ){
	$(".sm-group-area[data-gi="+thisGi+"]").remove();
	if( QmiGlobal.groups[thisGi] !== undefined)
		var rmGroupGn = QmiGlobal.groups[thisGi].gn._escape();

	if( gi==thisGi ){
	    var otherGroup = $(".sm-group-area.enable");
	    if( otherGroup.length>0 ){
	    	$(otherGroup[0]).trigger("click");
	    } else{
	    	gi = null;
	    	goToGroupMenu();
	    }

	    delete QmiGlobal.groups[thisGi];
	}

    //remove group data
    try{
		//----- remove from idb -------
		//chat
		if( null==g_idb_chat_cnts ){
			initChatCntDB( clearChatIDB(thisGi) );
		} else{
			clearChatIDB(thisGi);
		}
		//timeline_events
		// if( null!=idb_timeline_events ){
		//  			clearTimelineIDB(this_gi);
		//  		}
		if(rmGroupGn !== undefined) toastShow( $.i18n.getString("GROUP_X_DELETED", rmGroupGn) );

	} catch(e){
		errorReport(e);
	}
}

function clearChatIDB( this_gi, callback ){
	g_idb_chat_msgs.iterate(function(item){
	    try{
			if( null!=item ){
				cns.debug(item.ei);
				g_idb_chat_msgs.remove(item.ei);
			}
		} catch(e){
			errorReport(e);
		}
    },{
        index: "gi_ci_ct",
        keyRange: g_idb_chat_msgs.makeKeyRange({
	        upper: [this_gi,"T9999999999"],
	        lower: [this_gi,"T0000000000"]
	        // only:18
        }),
        order: "DESC",
        onEnd: function(result){
        	cns.debug("onError:",result);
        	if(callback) callback();
        },
        onError: function(result){
            cns.debug("onError:",result);
        }
    });
}

function clearTimelineIDB( this_gi, callback ){
	idb_timeline_events.iterate(function(item){
	    try{
			if( null!=item ){
				cns.debug(item.ei);
				idb_timeline_events.remove(item.ei);
			}
		} catch(e){
			errorReport(e);
		}
    },{
        index: "gi_ct",
        keyRange: idb_timeline_events.makeKeyRange({
	        upper: [this_gi,9999999999999],
	        lower: [this_gi]
	        // only:18
        }),
        order: "DESC",
        onEnd: function(result){
        	cns.debug("onError:",result);
        	if(callback) callback();
        },
        onError: function(result){
            cns.debug("onError:",result);
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
//管理員列表
function showUpdatePermissionPage(){
	
	//find current admins
	var list = {};
	try{
        var userDataTmp = QmiGlobal.groups;
        var guAllTmp = userDataTmp[gi].guAll;
        for( var gu in guAllTmp ){
        	var mem = guAllTmp[gu];
        	if( 1==mem.st ){
	        	if( 1==mem.ad ){
	        		list[gu] = mem.nk;
	        	}
        	}
        }
    } catch(e){
        errorReport(e);
    }

	var option = {
		isShowBranch:false,
        isShowSelf:true,
		isShowAll:false,
		isShowFav:true,
		isShowFavBranch:false,
		isShowLeftMem:false
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
//更新管理員
function requestUpdatePermission( this_gi, addList, delList, callback){
	var api_name = "groups/"+this_gi+"/administrators";
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
    		getGroupComboInit( this_gi ).done( callback );
    	
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
	var groupId = null;
	

	try{
        var userData = QmiGlobal.groups;
        var group = userData[gi];
        isAdmin = (1==group.ad);
        groupName = group.gn;
        groupDescription = group.gd;
        groupImg = group.auo;
        groupId = group.gi;
    } catch(e){
        errorReport(e);
    }
    if(group.isOfficial){
    	$(".ga-group-type-name").html($.i18n.getString("OFFICAL_GROUP"));
    }else{
    	$(".ga-group-type-name").html($.i18n.getString("GENERAL_GROUP"));
    }
    $(".ga-group-name").html(groupName._escape());
    $(".ga-group-id").html("ID : " + groupId);
    $(".ga-group-des").html(groupDescription._escape().replace(/\n/g,"<br />"));
    

    if (isAdmin){
    	$(".ga-avatar-photo").removeClass("notadmin");
    	$(".ga-icon.admin").removeClass("notadmin");
    } else {
    	$(".ga-avatar-photo").addClass("notadmin");
    	$(".ga-icon.admin").addClass("notadmin");
    }

    var gaContent = $(".ga-content");
	var inGroupName = $("input.ga-group-name");
	var textGroupDes = $("textarea.ga-group-des");

	var contentViewshow = function(){
		gaContent.find(".ga-gr-content.view").show().end()
				 .find(".ga-gr-content.edit").hide();
	};
	var rowViewshow = function(){
		gaContent.find(".ga-info-row.view").show().end()
				 .find(".ga-info-row.edit").hide();
	};
	contentViewshow();
	rowViewshow();
 	// gaContent.find(".ga-gr-content.view").show().end()
 	// 		 .find(".ga-gr-content.edit").hide().end()
 	// 		 .find(".ga-info-row.view").show().end()
		// 	 .find(".ga-info-row.edit").hide().end();

    gaContent.on("click","#icon-view-gname", function(){
    	gaContent.find(".ga-gr-content.view").hide().end()
				 .find(".ga-gr-content.edit").show();
    	setTimeout(function(){
            inGroupName.focus();
        }, 0);
    	inGroupName.val(groupName);		
	});
	gaContent.on("click","#icon-view-gdes", function(){
		gaContent.find(".ga-info-row.view").hide().end()
				 .find(".ga-info-row.edit").show();
		setTimeout(function(){
            textGroupDes.focus();
        }, 0);	
		textGroupDes.val(groupDescription);	
	});
	gaContent.on("click","#icon-edit-gname", function(){
		if(inGroupName.val() == ""){
			popupShowAdjust("團體名稱不能為空");
		}else{
			contentViewshow();
			gaContent.find(".ga-group-name").html(inGroupName.val());
			getUpdateGroupInfoApi(gi, inGroupName.val(), "");
		}
	});
	gaContent.on("click","#icon-edit-gdes", function(){
		rowViewshow();
		gaContent.find(".ga-group-des").html(textGroupDes.val()._escape().replace(/\n/g,"<br />"));
		getUpdateGroupInfoApi(gi, "", textGroupDes.val());
	});
	gaContent.on("click",".ga-cancel-gname", function(){
		contentViewshow();
	});
	gaContent.on("click",".ga-cancel-gdes", function(){
		rowViewshow();
	});

	
	//admin
	// var view = $(".ga-info.view");
	// view.show();
	// $(".ga-info.edit").hide();

	// if( isAdmin ){
	// 	view.addClass("admin");
	// 	$(".ga-avatar").addClass("admin");
	// 	$(".subpage-groupAbout .admin").show();
	// 	$(".subpage-groupAbout .general").hide();
	// 	$(".ga-header-bar").removeClass("bgColor");

	// 	$(".ga-info.edit .ga-info-row[data-type='name'] .content").val( groupName );
	// 	$(".ga-info.edit .ga-info-row[data-type='info'] .content").val( groupDescription );
	// } else {
	// 	view.removeClass("admin");
	// 	$(".ga-avatar").removeClass("admin");
	// 	$(".subpage-groupAbout .admin").hide();
	// 	$(".subpage-groupAbout .general").show();
	// 	$(".ga-header-bar").addClass("bgColor");
	// }
	if(groupImg){
		$(".ga-avatar-img").attr("src",groupImg);
	} else{
		$(".ga-avatar-img").attr("src","images/common/others/name_card_nophoto_profile.png");
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
			{marginLeft: '0%'}, 500, function(){
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
	// var img = $(".ga-avatar-img");
	// img.filter(".upload").hide();
	// img.filter(".currentGroup").show();
	// resetGroupInfo();
}

// function resetGroupInfo(){

// 	$(".ga-header-done").removeClass("ready");
// 	var input = $(".ga-avatar input");
// 	input.replaceWith( input.clone(true) );
// 	// $(".ga-avatar-img.currentGroup").show();

// 	var info = $(".ga-info");
// 	var contents = info.filter(".edit .ga-info-row .content");
// 	$.each( contents, function(i,dom){
// 		var domTmp = $(dom);
// 		domTmp.data("oriText", domTmp.val() );
// 	});

// 	info.filter(".view").show();
// 	info.filter(".edit").hide();

// }

// function checkGroupInfoChange(){
// 	if( $(".ga-avatar input").hasClass("ready") 
// 		|| $(".ga-info.edit .ga-info-row .content.ready").length>0 ){
// 		$(".ga-header-done").addClass("ready");
// 	} else {
// 		$(".ga-header-done").removeClass("ready");
// 	}
// }


// 需要defer改寫
// function requestUpdateGroupInfo( this_gi, newGn, newGd, file, callback){
	
// 	var isReady = false;
// 	//如果更新資料
// 	if( null!=newGn || null!=newGd ){
// 		getUpdateGroupInfoApi(this_gi, newGn, newGd).complete(function(data){
// 	    	if(data.status == 200){
// 	    		if( isReady ){
// 	    			getGroupComboInit( this_gi ).done( function(){
// 	    				updateGroupAllInfoDom( this_gi );
// 		    			if(callback) callback();
// 		    			s_load_show = false;
// 		    		});
// 	    		}
// 	    		isReady = true;
// 	    	}
// 	    });
// 	} else isReady = true;

//     //如果更新頭像
//     if( file ){
// 		var ori_arr = [1280,1280,0.7];
// 		var tmb_arr = [120,120,0.6];

// 	    var api_name = "groups/" + this_gi + "/avatar"

// 	    uploadToS3(file,api_name,ori_arr,tmb_arr,function(chk){
// 	    	if(!chk) {
// 	    		toastShow( $.i18n.getString("GROUP_AVATAR_UPLOAD_ALERT") ); //團體頭像上傳失敗
// 	    	}

// 	    	if( isReady ){
// 				var img = $(".ga-avatar-img");
// 				img.filter(".currentGroup").load(function(){
// 					$(this).show().off("load");
// 					img.filter(".upload").hide();
// 				});
// 	    		getGroupComboInit( this_gi ).done( function(){
// 	    			updateGroupAllInfoDom( this_gi );
// 	    			if(callback) callback();
// 	    			s_load_show = false;
// 	    		});
// 	    	}
// 	    	isReady = true;
// 	    });
//     } else isReady = true;
// }

function getUpdateGroupInfoApi( this_gi, newGn, newGd ){
	//PUT /groups/{gi}{?tp} 
	//tp=??
	//{
	//   "gn": "四竹資訊",
	//   "gd": "這是一個敘述"
	// }

	// var api_name = "groups/"+this_gi;
	// var headers = {
	//         ui: ui,
	//         at: at,
	//         li: lang
	//              };
	// var method = "put";
	// var body = {};
	// if( newGn ) body.gn = newGn;
	// if( newGd ) body.gd = newGd;
	var body = {};
	if( newGn )	body.gn = newGn;
	if( newGd )	body.gd = newGd;
	// return ajaxDo(api_name,headers,method,true,body);
	new QmiAjax({
		apiName: "groups/" + this_gi,
		type: "put",
		body: body
	}).success(function(data){
		toastShow(data.rsp_msg);
	}).error(function(e){
        alert("error");
    });
}