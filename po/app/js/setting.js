
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
	// $(document).on("click",".group-info-close",function(e){
	// 	if( $("#page-group-info").is(":visible") ){
	// 		$("#page-group-info").fadeOut();
	// 		$(".screen-lock").fadeOut();
	// 		$(".screen-lock").css("height","");
	// 	}
	// });
	$(document).on("click",".ga-header-back",function(e){
		var tmp = $(".subpage-groupAbout").data("lastPage");
		if( tmp ) $(tmp).show();
		$(".subpage-groupAbout").data("lastPage",null);
		$(".subpage-groupAbout").off("animate").animate(
			{marginLeft: '100%'}, 1000, function(){
				$(".subpage-groupAbout").hide();
		});
		/*

		if( tmp && tmp==".subpage-groupSetting" ){
			$(".subpage-groupAbout").off("animate").animate(
				{marginLeft: '100%'}, 1000, function(){
					$(".subpage-groupAbout").hide();
			});
		} else {
			$(".subpage-groupAbout").fadeOut();
		}
		*/
	});

	// $(document).on("load", ".ga-avatar-img.groupImg",function(e){
	// 	$(".ga-avatar-img.default").fadeOut();
	// 	$(this).fadeIn();
	// });
});

function initGroupSetting(){
	// 如果是管理者的話顯示額外設定
    try{
        var userData = $.lStorage(ui);
        var me_gu = userData[gi].gu;
        if( 1==userData[gi].guAll[gu].ad ){
            $(".gs-row[data-type=permission]").show();
            $(".gs-row[data-type=info]").show();
        } else {
            $(".gs-row[data-type=permission]").hide();
            $(".gs-row[data-type=info]").hide();
        }
    } catch(e){
        errorReport(e);
    }
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
            }
    
    ajaxDo(api_name,headers,method,true,body).complete(function(data){
    	if(data.status == 200){
    		//可以直接改權限, 不過取消admin的權限該是多少？
    		//改成直接打api更新好了...
    		setGroupAllUser(null, gi, callback);
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
	if( isAdmin ){
		$(".subpage-groupAbout .admin").show();
		$(".subpage-groupAbout .general").hide();
		$(".ga-header-bar").removeClass("bgColor");

		$(".ga-info-row .content").attr("contenteditable","true");
	} else {
		$(".subpage-groupAbout .admin").hide();
		$(".subpage-groupAbout .general").show();
		$(".ga-header-bar").addClass("bgColor");
		$(".ga-info-row .content").attr("contenteditable","false");
	}

	$(".subpage-groupAbout .groupName").html( groupName.replaceOriEmojiCode() );
	$(".subpage-groupAbout .groupDescription").html( groupDescription.replaceOriEmojiCode() );
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

}