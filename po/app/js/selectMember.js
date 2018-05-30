/**
勾選成員用列表, 頁面如下
(<是back鈕)

<       選擇對象(cnt)   下一步
○   全選                  成員
○   img     name
◉   img     name

◉   全選                  群組
◉   img     name
◉   img     name

....

**/

/**
parentDom:       頁面container
dataDom:         存放成員列表資料的dom, 資料為stringify後的字串(送入跟取回資料都會存放在這個dom)
onPageChanged:   按下下一步時的callback
onDone(isDone):  當按下返回時的callback, isDone==false表示為點擊back返回, isDone==true為點擊下一步
isBackWhenDone:  按下下一步是否要自動返回上一頁

eg:
var btn = $(".extra-content .btn[data-type='edit']");
var tmpList = {};
for (var gu in g_room.memList) {
    tmpList[gu] = g_group.guAll[gu].nk;
}

btn.data("exclude_str", JSON.stringify([g_group.gu]));  //不顯示的gu清單, 比如說自己不顯示
btn.data("object_str", JSON.stringify(tmpList));        //成員資料
//選項
//isShowBranch:     是否要顯示群組
//isShowSelf:       是否要show自己
//isShowAll:        是否要show全選(如果isSingleSelect==true, isShowAll會被設成false)
//isShowFav:        是否要show我的最愛
//isSingleSelect:   是否為單選
//isShowFavBranch:  是否要show我的最愛群組
//min_count:        最小選擇數量(未達最小數量不能按下一步)

btn.data("object_opt", {
    isShowBranch: false,
    isShowSelf: false,
    isShowAll: false,
    isShowFav: false,
    isSingleSelect: false,
    min_count: 1
});
showSelectMemPage($("#pagesContainer"), btn, function () {
    }, function (isDone) {
        if (isDone) {
            alert("下一步");
        } else {
            alert("back");
        }
    }
);
**/
showSelectMemPage = function( parentDom, dataDom, onPageChanged, onDone, isBackWhenDone ){
	if( $("#page-selectMem").length>0 ){
		showSelectMemPageDelegate( dataDom, onPageChanged, onDone, isBackWhenDone );
	} else {
		$('<div>').load('layout/memberSelect.html?v2.4.0.2',function(){
			parentDom.append( $(this).find("#page-selectMem") );
			showSelectMemPageDelegate( dataDom, onPageChanged, onDone, isBackWhenDone );
		});
	}
}
/**
private function
**/
showSelectMemPageDelegate = function( thisCompose, onPageChanged, onDone, isBackWhenDone ) {
    var uiData = QmiGlobal.groups;
    var group = uiData[gi];
    var guAll = group.guAll;
    var bl = group.bl;
    var fbl = group.fbl;
    var guList = Object.keys(guAll) || [];

    var objData = $.parseJSON(thisCompose.data("object_str")) || {};
    var excludeList = [];
    var option = thisCompose.data("object_opt");
    var isShowBranch = false;
    var isShowSelf = false;
    var isShowAll = true;
    var isShowFav = true;
    var isSingleSelect = false;
    var isShowFavBranch = true;
    var min_count = 0;
    var cnt = 0;

    $.changePage("#page-selectMem", onPageChanged, onDone);

    if( option ){
        if(null != option.isShowBranch) isShowBranch = option.isShowBranch;
        if(null != option.isShowSelf) isShowSelf = option.isShowSelf;
        if(null != option.isShowAll) isShowAll = option.isShowAll;
        if(null != option.isShowFav) isShowFav = option.isShowFav;
        if(null != option.isSingleSelect) isSingleSelect = option.isSingleSelect;
        if(null != option.isShowFavBranch) isShowFavBranch = option.isShowFavBranch;
        if(null != option.min_count) min_count = option.min_count;
    }


    if( null==isBackWhenDone ) isBackWhenDone = true;

    try{
        excludeList = $.parseJSON(thisCompose.data("exclude_str"));
    } catch(e){
        cns.debug( e.message );
    }

    console.log(excludeList)

    var visibleMemList = guList.filter(function(gu) {
        var userObj = guAll[gu];
        if (userObj.st != 1) return false;
        if (excludeList.indexOf(gu) > -1) return false;
        if( false==isShowSelf && gu==group.gu ) return false;

        var branchID = userObj.bl;
        var extraContent = "";

        if( branchID && branchID.length > 0 ){
            var branchPath = branchID.split(".");
            if( branchPath && branchPath.length > 0 ){
                branchID = branchPath[branchPath.length-1];
                if( bl.hasOwnProperty(branchID) ){
                    extraContent = bl[branchID].bn;
                }
            }
        }

        userObj.bn = extraContent;
        cnt++;

        return true;
    });

    var viewOption = {
        mainPage : $("#page-selectMem"),
        headerBtn : $("#page-selectMem").find(".page-next"),
        selectNumElement : $("#page-selectMem").find(".header-title div:eq(1)"),
        thisCompose : thisCompose,
        thisComposeObj : thisCompose,
        onDone : onDone,
        isBack : isBackWhenDone,
        singleCheck : isSingleSelect,
        visibleMembers : visibleMemList,
        checkedMems : objData,
        minSelectNum : 1,
    }

    ObjectDelegateView.init(viewOption).setHeight();

    if( null==guList || cnt <= 0 ){
        ObjectDelegateView.showNoMember();
        return;
    } 
    
    //----- 全選 ------
    if( isShowAll ) ObjectDelegateView.addRowElement("Default", {isObjExist : (Object.keys(objData).length > 0) ? true : false });
    if( isShowFav && (group.favCnt > 0 || Object.keys(fbl).length > 0)) {
        ObjectDelegateView.addRowElement("Favorite");

        visibleMemList.forEach(function(gu) {
            var guObj = guAll[gu];
            if (guObj.fav) {
                ObjectDelegateView.addFavoriteSubRow("Member", {thisMember : guObj, isSubRow : true});
            }
        });


        if( isShowFavBranch ){
            for( var fi in fbl ){
                var fbObj = fbl[fi];
                fbObj.fi = fi;
                // fbObj.chk = false;
                // if (favoriteData && Object.keys(favoriteData).length) {
                //     if (favoriteData[fi] != undefined ) fbObj.chk = true;
                // }
                ObjectDelegateView.addFavoriteSubRow("FavBranch", {thisFavBranchObj : fbObj, isSubRow : true});
            }
        }
    }

    //----- 團體列表 ------
    if( !isSingleSelect && bl && isShowBranch && Object.keys(bl).length>0 ) {
        var parentBranches = [];
        ObjectDelegateView.addRowElement("SelectAllTitle", {type : "group", isDisplayedChkbox : true});

        //團體rows
        $.each(bl, function(key, branchObj){

            branchObj.chk = false;
            branchObj.bi = key;
            if (branchData && Object.keys(branchData).length) {
                if (branchData[key] != undefined ) branchObj.chk = true;
            }

            //第一層顯示開關
            if (1 == branchObj.lv) {
                parentBranches.push(key);
            }
        });

        parentBranches.forEach(function (branchKey) {
            ObjectDelegateView.addRowElement("ParentBranch", {thisBranch : bl[branchKey], bl: bl});
        });
    }

    if (!isSingleSelect) ObjectDelegateView.addRowElement("SelectAllTitle", {type : "mem", isDisplayedChkbox : true});
    else ObjectDelegateView.addRowElement("SelectAllTitle", {type: "mem", isDisplayedChkbox : false});

    ObjectDelegateView.makeMemberList();
    ObjectDelegateView.updateStatus();
    
}

updateSelectedObj = function(){
    var len = 0;
    var cnt = 0;
    var branch = $("#page-selectMem .ui-container").data("selected-branch");
    var mem = $("#page-selectMem .ui-container").data("selected-obj");
    
    $(".obj-selected .list .text").html("");
    //寫入到選擇區域
    if( null != branch ){
        len += Object.keys(branch).length;
        $.each(branch,function(i,val){
            $(".obj-selected .list .text").append("<span>"+val.replaceOriEmojiCode()+"</span>");
        });

        var bAllSelect = true;
        $(".obj-cell.branch").each(function(){
            if( !$(this).data("chk") ){
                bAllSelect = false;
                return false;
            }
        });
        var all = $(".obj-cell-subTitle.group");
        if( bAllSelect ){
            //群組全選
            all.data("chk", true );
            all.find(".img").addClass("chk");
        } else {
            //清除群組全選
            all.data("chk", false );
            all.find(".img").removeClass("chk");
        }
    }

    if( null != mem ){
        len += Object.keys(mem).length;
        $.each(mem,function(i,val){
            $(".obj-selected .list .text").append("<span>"+val.replaceOriEmojiCode()+"</span>");
        });

        var bAllSelect = true;
        $(".obj-cell.mem").each(function(){
            if( !$(this).data("chk") ){
                bAllSelect = false;
                return false;
            }
        });
        var all = $(".obj-cell-subTitle.mem");
        if( bAllSelect ){
            //群組全選
            all.data("chk", true );
            all.find(".img").addClass("chk");
        } else {
            //清除群組全選
            all.data("chk", false );
            all.find(".img").removeClass("chk");
        }
    }
    // $(".obj-cell-area").css("padding-top",($(".obj-selected div:eq(1)").height()+20)+"px");
    // cns.debug("$(window).height():",$(window).height());
    //更改標題
    $(".header-title div:eq(1)").html(len);
    var min_count = $(".page-next").data("min_count");
    if( len>=min_count ) $(".page-next").removeClass("disable");
    else $(".page-next").addClass("disable");

    //重設高
    var padding_top = $(".obj-selected").outerHeight();
    $(".obj-cell-area").css("padding-top",padding_top);
    $(".obj-cell-area").css("height",$(window).height()-57-padding_top);
}

selectTargetAll = function(){
    clearMeAndAllSelect();
    clearMemAndBranchAll();
    $(".obj-cell.all").data("chk",true);
    $(".obj-cell.all").find(".img").addClass("chk");
    //clear data
    $(".ui-container").data("selected-branch",{});
    $(".ui-container").data("selected-obj",{});
    
    //deselect group&mem "select all"
    $(".obj-cell-subTitle").data("chk",false);
    //deselect all branch
    $(".obj-cell-area").find(".obj-cell.branch").each(function(){
        var this_cell = $(this);
        this_cell.data("chk",false);
        this_cell.find(".obj-cell-chk .img").removeClass("chk");
    });
    //deselect all mem
    $(".obj-cell-area").find(".obj-cell.mem").each(function(){
        var this_cell = $(this);
        this_cell.data("chk",false);
        this_cell.find(".obj-cell-chk .img").removeClass("chk");
    });
    updateSelectedObj();
}

createChild = function( bl, parent, bl_obj ){
	var tmp = $("<div></div>");
    if( 1==bl_obj.lv ) tmp.css("display","none");
	for( var i=0; i<bl_obj.cl.length; i++ ){
        var key = bl_obj.cl[i];
		var data = bl[key];

        //目前除了第一層外所有階層都同級
		// var content = $("<div class='obj-cell branch _"+data.lv+"' data-bl='"+key+"' data-bl-name='"+data.bn+"'>"+
        var content = $("<div class='obj-cell branch _2' data-bl='"+key+"' data-bl-name='"+data.bn+"'>"+
	    	'<div class="obj-cell-chk"><div class="img"></div></div>' +
	    	// '<div class="obj-cell-user-pic namecard"><img src="images/common/others/select_empty_group_photo.png" style="width:60px"/></div>' +
	    	'<div class="obj-cell-user-pic namecard"><img src="images/common/others/select_empty_all_photo.png" style="width:60px"/></div>' +
            '<div class="obj-cell-subgroup-data">' + 
	        	'<div class="obj-user-name">' + data.bn.replaceOriEmojiCode() + '</div>' +
	        '</div>'
	    );

        // content.css("padding-left", (data.lv-1)*20+"px;");
        // content.css("background", ;

        tmp.append( content );
		if( data.cl.length>0 ) createChild(bl, tmp, data );
	}
	
	parent.append(tmp);
}

clearMeAndAllSelect = function(){
    //deselect self & all
    var speSelect = $(".obj-cell.self, .obj-cell.all");
    speSelect.each( function(){
        if( $(this).data("chk") ){
            $(this).data("chk", false );
            $(this).find(".img").removeClass("chk");
            //clear data
            $(".ui-container").data("selected-branch",{});
            $(".ui-container").data("selected-obj",{});
        }
    });
}
clearMemAndBranchAll = function(){
    //deselect "select all" of branch & mem
    $(".obj-cell-subTitle").each( function(){
        if( $(this).data("chk") ){
            $(this).data("chk", false );
            $(this).find(".img").removeClass("chk");
        }
    });
}

selectTargetAll = function(){
    clearMeAndAllSelect();
    clearMemAndBranchAll();
    $(".obj-cell.all").data("chk",true);
    $(".obj-cell.all").find(".img").addClass("chk");
    //clear data
    $(".ui-container").data("selected-branch",{});
    $(".ui-container").data("selected-obj",{});
    
    //deselect group&mem "select all"
    $(".obj-cell-subTitle").data("chk",false);
    //deselect all branch
    $(".obj-cell-area").find(".obj-cell.branch").each(function(){
        var this_cell = $(this);
        this_cell.data("chk",false);
        this_cell.find(".obj-cell-chk .img").removeClass("chk");
    });
    //deselect all mem
    $(".obj-cell-area").find(".obj-cell.mem").each(function(){
        var this_cell = $(this);
        this_cell.data("chk",false);
        this_cell.find(".obj-cell-chk .img").removeClass("chk");
    });
    updateSelectedObj();
}