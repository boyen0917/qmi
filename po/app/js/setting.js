
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

    		removeGroup(this_gi, function() {
    			try {
    				return JSON.parse(data.responseText).rsp_msg || msg;
    			} catch(e) {return false;}
    		}());

	        (QmiGlobal.windowListCiMap[this_gi] || []).forEach(function(thisCi){
                windowList[thisCi].close();
            })
	        if( callback ) callback();
    	}
    });
}

function removeGroup(thisGi, msg){
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
	}

	delete QmiGlobal.groups[thisGi];
	// 如果有就刪除
	delete QmiGlobal.companyGiMap[thisGi];

	if (Object.keys( QmiGlobal.groups ).length == 0) {
        $.mobile.changePage("#page-group-menu");
        $("#page-group-menu .page-back").hide();
        if (QmiGlobal.auth.isSso) $(".no-group-lock").show();
    }   

    //remove group data
    try{
		//----- remove from idb -------
		//chat
		if( null==g_idb_chat_cnts )
			initChatCntDB( clearChatIDB(thisGi) );
		else
			clearChatIDB(thisGi);

		// false 為 不跳popup -> removeCompany
		if(msg !== false)
			popupShowAdjust("", (msg || $.i18n.getString("GROUP_X_DELETED", rmGroupGn)),true); 

	} catch(e){errorReport(e);}
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
	var userDataTmp = QmiGlobal.groups;
    var guAllTmp = userDataTmp[gi].guAll;
	try{
        for( var gu in guAllTmp ){
        	var mem = guAllTmp[gu];

        	// mem.chk = false;
        	if( 1==mem.st ){
	        	if( 1==mem.ad ){
	        		list[gu] = mem.nk;
	        		// mem.chk = true;
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
			// console.log("DDDEE");
			var newList = $.parseJSON( dom.data("object_str") );

			var addList = [];
			var delList = [];

			for( var gu in newList ){
				if( !list.hasOwnProperty(gu) ){
					// 因改權限後會打combo api，如果是大團體撈成員必須一段時間，故趕在沒打之前先改local
					guAllTmp[gu].ad = 1; 
					addList.push(gu);
				}
			}

			for( var gu in list ){
				if( !newList.hasOwnProperty(gu) ){
					guAllTmp[gu].ad = 2; 
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
	var groupInfoDom = $("#page-group-main div.subpage-groupAbout");
	

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
    if(group.ntp === 2){
    	groupInfoDom.find(".ga-group-type-name").html($.i18n.getString("OFFICAL_GROUP"));
    }else{
    	groupInfoDom.find(".ga-group-type-name").html($.i18n.getString("GENERAL_GROUP"));
    }
    groupInfoDom.find(".ga-group-name").html(groupName._escape());
    groupInfoDom.find(".ga-group-id").html("ID : " + groupId.substring(groupId.length-4));
    groupInfoDom.find(".ga-group-des").html(groupDescription._escape().replace(/\n/g,"<br />"));
    

    if (isAdmin){
    	groupInfoDom.find(".ga-avatar-photo").removeClass("notadmin");
    	groupInfoDom.find(".ga-icon.admin").removeClass("notadmin");
    } else {
    	groupInfoDom.find(".ga-avatar-photo").addClass("notadmin");
    	groupInfoDom.find(".ga-icon.admin").addClass("notadmin");
    }

    var gaContent = groupInfoDom.find(".ga-content");
	var inGroupName = groupInfoDom.find("input.ga-group-name");
	var textGroupDes = groupInfoDom.find("textarea.ga-group-des");

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

	gaContent.off();
	
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

	
	$(".ga-avatar-img").attr("src", groupImg || "images/common/others/name_card_nophoto_profile.png");

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
}


function getUpdateGroupInfoApi( this_gi, newGn, newGd ){
	
	var body = {};
	var updateGroup = QmiGlobal.groups[this_gi] || {};
	body.gn = newGn ? newGn : updateGroup.gn;
	body.gd = newGd ? newGd : updateGroup.gd;
	new QmiAjax({
		apiName: "groups/" + this_gi,
		type: "put",
		body: body
	}).success(function(data){
		var sideMenuGroup = $("#page-group-main div.sm-group-area-r[data-gi='" + this_gi + "']");
		toastShow(data.rsp_msg);
		updateGroup.gn = newGn ? newGn : updateGroup.gn;
		updateGroup.gd = newGd ? newGd : updateGroup.gd;
		if (sideMenuGroup.length > 0) {
			sideMenuGroup.children("div").eq(0).html(updateGroup.gn);
		}
	}).error(function(e){
        alert("error");
    });
}