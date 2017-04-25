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
		$('<div>').load('layout/memberSelect.html?v1.8.0.4',function(){
			parentDom.append( $(this).find("#page-selectMem") );
			showSelectMemPageDelegate( dataDom, onPageChanged, onDone, isBackWhenDone );
		});
	}
}
/**
private function
**/
showSelectMemPageDelegate = function( thisCompose, onPageChanged, onDone, isBackWhenDone ) {
    var uiData = $.userStorage();
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
    // $(".header-title div:eq(1)").html(0);

    //設定高
    // var padding_top = $(".obj-selected").outerHeight();
    // $(".obj-cell-area").css("padding-top",padding_top);
    // $(".obj-cell-area").css("height",$(window).height()-57-padding_top);

    // var this_compose = $(this);


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
        // checkedBranches : branchData,
        // checkedFavorites : favoriteData,
    }

    ObjectDelegateView.init(viewOption).setHeight();

    if( null==guList || cnt <= 0 ){
        ObjectDelegateView.showNoMember();
        return;
    } 
    // $.each(guAll,function(i,gu_obj){
    //     //踢除離開或未加入的成員
    //     if( gu_obj.st!=1 ){
    //         if( excludeList.indexOf(i)<=0 ){
    //             excludeList.push(i);
    //         }
    //         return;
    //     }
    //     if( excludeList.indexOf(i)>=0 ) return;
    //     if( false==isShowSelf && i==group.gu ) return;
    //     cnt++;
    // });
    
    // $("#page-selectMem .ui-container").show();
    // $("#page-selectMem .obj-coach-noMember").hide();
    // $(".page-next").show();



    // $(".page-next").data("min_count",min_count);
    // if( isSingleSelect ) isShowAll = false;

    // $("#page-selectMem .ui-container").data("selected-branch",{});
    // $("#page-selectMem .ui-container").data("selected-obj",{});
    // $("#page-selectMem .ui-container").data("selected-fav",{});
    // updateSelectedObj();
    
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
    // //----- 我的最愛 ------
    // if( isShowFav ){
    //     var tmp = $("<div class='subgroup-row fav-parent'></div>");
    //     var innerTmp = $("<div class='subgroup-parent'></div>");
    //     var firststCell = $("<div class='obj-cell fav'>"+
    //         '<div class="obj-cell-chk"></div>' +
    //         '<div class="obj-cell-user-pic"><img src="images/common/others/empty_img_favor.png" style="width:60px"/></div>' +
    //         '<div class="obj-cell-subgroup-data">' + 
    //             '<div class="obj-user-name">' + $.i18n.getString("COMMON_FAVORIATE") + '</div></div>');
    //     innerTmp.html(firststCell);
    //     innerTmp.append('<div class="obj-cell-arrow"></div>');
        
    //     var memfold = $("<div></div>");
    //     memfold.css("display","none");

    //     for( var i in guAll){
    //         var gu_obj = guAll[i];
    //         if( gu_obj.fav==true ){
    //             var this_obj = getMemObjectRow(gu_obj, bl);
    //             this_obj.addClass("_2");
    //             memfold.append(this_obj);
    //         }
    //     }

    //     if( isShowFavBranch ){
    //         //  add fbl in to memfold
    //         // for( var fi in fbl ){
    //         //     var fb_obj = fbl[fi];
    //         //     var this_obj = $(
    //         //         '<div class="subgroup-parent">'+
    //         //             '<div class="obj-cell fav-branch _2" data-gu="'+fi+'">'+
    //         //                 '<div class="obj-cell-chk">'+
    //         //                     '<div class="img"></div>'+
    //         //                 '</div>' +
    //         //                 '<div class="obj-cell-user-pic"><img src="images/common/others/select_empty_all_photo.png" style="width:60px"/></div>' +
    //         //                 '<div class="obj-cell-subgroup-data">' + 
    //         //                      '<div class="obj-user-name">' + fb_obj.fn.replaceOriEmojiCode() + '</div>' +
    //         //                      '<div class="obj-user-title">'+
    //         //                 '</div></div>'+
    //         //             '</div>'+
    //         //             '<div class="obj-cell-arrow"></div>'+
    //         //         '</div>'
    //         //     );

    //         //     this_obj.data("fi",fi);
    //         //     this_obj.data("fn",fb_obj.fn);
    //         //     memfold.append(this_obj);

    //         //     var fblFold = $('<div></div>');
    //         //     fblFold.css("display","none")
    //         //     memfold.append(fblFold);
    //         //     for( var gu in guAll ){
    //         //         var memTmp = guAll[gu];
    //         //         if( memTmp .fbl.indexOf(fi)<0 ) continue;
    //         //         var fblMemRow = getMemObjectRow(memTmp, bl);
    //         //         fblFold.append(fblMemRow);
    //         //     }
    //         //     fblFold.find(".obj-cell.mem").addClass("_3");
    //         // }
    //         // tmp.append( memfold );

    //         //  add fbl in to memfold
    //         for( var fi in fbl ){
    //             var fb_obj = fbl[fi];
    //             var this_obj = $(
    //                 '<div class="obj-cell fav-branch _2" data-gu="'+fi+'">'+
    //                     '<div class="obj-cell-chk">'+
    //                         '<div class="img"></div>'+
    //                     '</div>' +
    //                     '<div class="obj-cell-user-pic"><img src="images/common/others/select_empty_all_photo.png" style="width:60px"/></div>' +
    //                     '<div class="obj-cell-subgroup-data">' + 
    //                          '<div class="obj-user-name">' + fb_obj.fn.replaceOriEmojiCode() + '</div>' +
    //                          '<div class="obj-user-title">'+
    //                     '</div></div>'+
    //                 '</div>'
    //             );
                
    //             this_obj.data("fi",fi);
    //             this_obj.data("fn",fb_obj.fn);
    //             memfold.append(this_obj);
    //         }
    //     }

    //     //若fav裡面有內容才show
    //     if( memfold.find(".obj-cell").length>0 ){

    //         tmp.append( memfold );


    //         $(".obj-cell-area").append(tmp);
            
    //         // tmp.find(".obj-cell.fav").off("click").click( function(){
    //             // $(this).next().toggleClass("open");
    //             // $(this).parent().next().toggle();
    //         // });
    //         tmp.find(".obj-cell.fav + .obj-cell-arrow").off("click").click( function(e){
    //             if( $(".obj-content").hasClass("on-search") ){
    //                 $(this).previous().trigger("click");
    //                 e.stopPropagation();
    //                 return;
    //             }
    //             $(this).toggleClass("open");
    //             $(this).parent().next().toggle();
    //         });
    //     }
    // }

    // //----- 團體列表 ------
    // if( !isSingleSelect && bl&&isShowBranch&&Object.keys(bl).length>0 ){
    //     $("#page-selectMem .ui-container").data("selected-branch",{});
    //     //標題bar
    //     var memSubTitle = $("<div class='obj-cell-subTitle group' data-chk='false'></div>");
    //     memSubTitle.append( '<div class="obj-cell-subTitle-chk">'+
    //         '<div class="img"></div>'+
    //         '<div class="select">'+$.i18n.getString("COMMON_SELECT_ALL")+'</div></div>' );
    //     memSubTitle.append( "<div class='text'>"+$.i18n.getString("COMPOSE_SUBGROUP")+"</div>" );
    //     $(".obj-cell-area").append(memSubTitle);

    //     //團體rows
    //     $.each(bl,function(key,bl_obj){
    //         //第一層顯示開關
    //         if(1==bl_obj.lv){
    //             var tmp = $("<div class='subgroup-row'></div>");
    //             var innerTmp = $("<div class='subgroup-parent'></div>");
    //             var firststCell = $("<div class='obj-cell subgroup branch' data-bl='"+key+"' data-bl-name='"+bl_obj.bn+"'>"+
    //                 '<div class="obj-cell-chk"><div class="img"></div></div>' +
    //                 // '<div class="obj-cell-user-pic"><img src="images/common/others/select_empty_group_photo.png" style="width:60px"/></div>' +
    //                 '<div class="obj-cell-user-pic"><img src="images/common/others/select_empty_all_photo.png" style="width:60px"/></div>' +
    //                 '<div class="obj-cell-subgroup-data">' + 
    //                     '<div class="obj-user-name">' + bl_obj.bn.replaceOriEmojiCode() + '</div></div>');
    //             firststCell.data( "bl-name", bl_obj.bn );
    //             firststCell.data( "bl", key );
    //             innerTmp.html(firststCell);
    //             // tmp.data("bi",key);
    //             tmp.html( innerTmp );
    //             if(bl_obj.cl.length>0){
    //                 innerTmp.append('<div class="obj-cell-arrow"></div>');
    //                 createChild( bl, tmp, bl_obj );
    //             }
    //             $(".obj-cell-area").append(tmp);
    //             $(".obj-cell-area").append('<hr color="#F3F3F3">');
    //         }
    //     });

    //     $(".obj-cell-area").find(".obj-cell-arrow").off("click").click( function(e){
    //         if( $(".obj-content").hasClass("on-search") ){
    //             $(this).prev().trigger("click");
    //             e.stopPropagation();
    //             return;
    //         }

    //         var dom = $(this).parent().next();
    //         if( $(this).hasClass("open") ){
    //             $(this).removeClass("open");
    //             dom.slideUp();
    //         } else {
    //             $(this).addClass("open");
    //             dom.slideDown();
    //         }
    //     });


    //     //branch全選
    //     memSubTitle.off("click").click( function(){
    //         //搜尋中關閉全選
    //         if( $(".obj-content").hasClass("on-search") ){
    //             return;
    //         }

    //         clearMeAndAllSelect();

    //         if( $(this).data("chk") ){
    //             $(this).data("chk", false );
    //             $(this).find(".img").removeClass("chk");

    //             //deselect all
    //             $(".obj-cell-area").find(".obj-cell.branch").each(function(){
    //                 var this_cell = $(this);
    //                 this_cell.data("chk",false);
    //                 this_cell.find(".obj-cell-chk .img").removeClass("chk");
    //             });

    //             //存回
    //             $("#page-selectMem .ui-container").data("selected-branch",{});
    //         } else {
    //             $(this).data("chk", true );
    //             $(this).find(".img").addClass("chk");

    //             //select all mem
    //             var selected_obj = {};
    //             $(".obj-cell-area").find(".obj-cell.branch").each(function(){
    //                 var this_cell = $(this);
    //                 this_cell.data("chk",true);
    //                 this_cell.find(".obj-cell-chk .img").addClass("chk");

    //                 if( this_cell.data("bl-name") ){
    //                     selected_obj[this_cell.data("bl")] = this_cell.data("bl-name");
    //                 }
    //             });

    //             //存回
    //             $("#page-selectMem .ui-container").data("selected-branch",selected_obj);
    //         }

    //         updateSelectedObj();
    //     });
    // }


    // //----- 加入成員列表 ------
    
    // //標題bar
    // var memSubTitle = $("<div class='obj-cell-subTitle mem'></div>");
    
    // if( !isSingleSelect ){
    //     memSubTitle.append( '<div class="obj-cell-subTitle-chk">'+
    //         '<div class="img"></div>'+
    //         '<div class="select">'+$.i18n.getString("COMMON_SELECT_ALL")+'</div></div>' );
        
    //     //mem全選
    //     memSubTitle.click( function(){
    //         clearMeAndAllSelect();

    //         if( $(this).data("chk") ){
    //             $(this).data("chk", false );
    //             $(this).find(".img").removeClass("chk");

    //             //deselect all
    //             $(".obj-cell-area").find(".obj-cell.mem").each(function(){
    //                 var this_cell = $(this);
    //                 this_cell.data("chk",false);
    //                 this_cell.find(".obj-cell-chk .img").removeClass("chk");
    //             });

    //             //存回
    //             $("#page-selectMem .ui-container").data("selected-obj",{});
    //         } else {
    //             $(this).data("chk", true );
    //             $(this).find(".img").addClass("chk");

    //             //select all mem
    //             var selected_obj = {};
    //             $(".obj-cell-area").find(".obj-cell.mem").each(function(){
    //                 var this_cell = $(this);
    //                 this_cell.data("chk",true);
    //                 this_cell.find(".obj-cell-chk .img").addClass("chk");
                    
    //                 if( this_cell.data("gu-name") ){
    //                     selected_obj[this_cell.data("gu")] = this_cell.data("gu-name");
    //                 }
    //             });

    //             //存回
    //             $("#page-selectMem .ui-container").data("selected-obj",selected_obj);
    //         }

    //         updateSelectedObj();
    //     });
    // }
    // memSubTitle.append( "<div class='text'>"+$.i18n.getString("COMMON_MEMBER")+"</div>" );
    // $(".obj-cell-area").append(memSubTitle);
    
    // //成員rows
    // $.each(guAll,function(i,gu_obj){
    //     if( excludeList.indexOf(i)>=0 ) return;
    //     var this_obj = getMemObjectRow(gu_obj, bl);
    //     $(".obj-cell-area").append(this_obj);
    // });

    //已經有內容 就製作已選的樣式
    console.debug("obj_data:",objData);
    // if(obj_data){
    //     obj_data = $.parseJSON(obj_data);
    //     try{
    //         for( var gu in obj_data ){
    //             if( excludeList.indexOf(gu)>=0 ){
    //                 delete obj_data[gu];
    //             }
    //         }
    //         this_compose.data("object_str", JSON.stringify(obj_data) );
    //     } catch(e){
    //         cns.debug("[!]"+e.message);
    //     }

    //     if(Object.keys(obj_data).length){
    //         $("#page-selectMem .ui-container").data("selected-obj",obj_data);
    //         $(document).find(".obj-cell").each(function(i,val){
    //             var this_cell = $(this);
    //             //有被選擇過 存在obj_data中
    //             if($.inArray(this_cell.data("gu"),Object.keys(obj_data)) >= 0){
    //                 this_cell.data("chk",true);
    //                 this_cell.find(".obj-cell-chk .img").addClass("chk");
    //                 // this_cell.find(".obj-cell-chk img").attr("src","images/common/icon/icon_check_round_check.png");
    //                 // this_cell.find(".img").addClass("chk");
    //             }else{
    //                 this_cell.data("chk",false);
    //                 this_cell.find(".obj-cell-chk .img").removeClass("chk");
    //                 // this_cell.find(".obj-cell-chk img").attr("src","images/common/icon/icon_check_round.png");
    //                 // this_cell.find(".img").removeClass("chk");
    //             }
    //         });

    //         updateSelectedObj();
    //     }
            
    // }else{
    //     //reset
    //     $("#page-selectMem .ui-container").data("selected-obj",{});  
    // }

    // //避免重複綁定事件 先解除
    // $(document).off('click', '.obj-cell.mem');
    // $(document).on("click",".obj-cell.mem",function(){
    //     clearMeAndAllSelect();
        
    //     var search = ".obj-cell.mem[data-gu="+$(this).data("gu")+"]";
    //     var this_cell = $(search);
    //     if( this_cell.length==0 ){
    //         this_cell = $(this);
    //     }
    //     var selected_obj = $("#page-selectMem .ui-container").data("selected-obj");
    //     // cns.debug("selected_obj:",selected_obj);
        
    //     //工作是單選
    //     if(this_compose.parent().hasClass("cp-work-item")){
    //         cns.debug("work");
    //         //全部清除
    //         // $(document).find(".obj-cell-chk img").attr("src","images/common/icon/icon_check_round.png");
    //         $(document).find(".obj-cell-chk").data("chk",false);
    //         $(document).find(".obj-cell-chk .img").removeClass("chk");

    //         this_cell.data("chk",true);
    //         this_cell.find(".obj-cell-chk .img").addClass("chk");
    //         // this_cell.find(".obj-cell-chk img").attr("src","images/common/icon/icon_check_round_check.png");

    //         $(".obj-selected .list .text").html("<span>" + this_cell.data("gu-name") + "</span>");
    //         //重置
    //         selected_obj ={};
    //         selected_obj[this_cell.data("gu")] = this_cell.data("gu-name");
    //     }else{
    //         //其餘發佈對象是復選
    //         //是否點選
    //         if(this_cell.data("chk")){
    //             this_cell.data("chk",false);
    //             this_cell.find(".obj-cell-chk .img").removeClass("chk");
    //             // this_cell.find(".obj-cell-chk img").attr("src","images/common/icon/icon_check_round.png");
                
    //             delete selected_obj[this_cell.data("gu")];
                
    //         }else{
    //             this_cell.data("chk",true);
    //             this_cell.find(".obj-cell-chk .img").addClass("chk");
    //             // this_cell.find(".obj-cell-chk img").attr("src","images/common/icon/icon_check_round_check.png");
                
    //             if( this_cell.data("gu-name") ){
    //                 selected_obj[this_cell.data("gu")] = this_cell.data("gu-name");
    //             }
    //         }
    //     }

    //     //存回
    //     $("#page-selectMem .ui-container").data("selected-obj",selected_obj);

    //     updateSelectedObj();
    // });

    // $(document).off('click', '.obj-cell.branch:not(.subgroup)');
    // $(document).on("click",".obj-cell.branch:not(.subgroup)",function(){
    //     clearMeAndAllSelect();

    //     var this_cell = $(this);
    //     var selected_obj = $("#page-selectMem .ui-container").data("selected-branch");
    //     // cns.debug("selected_obj:",selected_obj);
        
    //     //其餘發佈對象是復選
    //     //是否點選
    //     if(this_cell.data("chk")){
    //         this_cell.data("chk",false);
    //         this_cell.find(".obj-cell-chk .img").removeClass("chk");
    //         // this_cell.find(".obj-cell-chk img").attr("src","images/common/icon/icon_check_round.png");
            
    //         delete selected_obj[this_cell.data("bl")];
            
    //     }else{
    //         this_cell.data("chk",true);
    //         this_cell.find(".obj-cell-chk .img").addClass("chk");
    //         // this_cell.find(".obj-cell-chk img").attr("src","images/common/icon/icon_check_round_check.png");
            
    //         if( this_cell.data("bl-name") ){
    //             selected_obj[this_cell.data("bl")] = this_cell.data("bl-name");
    //         }
    //     }

    //     //存回
    //     $("#page-selectMem .ui-container").data("selected-branch",selected_obj);

    //     updateSelectedObj();
    // });

    // $(document).off('click', '.obj-cell.subgroup');
    // $(document).on("click",".obj-cell.subgroup",function(){
    //     clearMeAndAllSelect();

    //     var this_cell = $(this);
    //     var selected_obj = $("#page-selectMem .ui-container").data("selected-branch");
    //     // cns.debug("selected_obj:",selected_obj);

    //     //其餘發佈對象是復選
    //     //是否點選
    //     if(this_cell.data("chk")){
    //         this_cell.data("chk",false);
    //         this_cell.find(".obj-cell-chk .img").removeClass("chk");
    //         // this_cell.find(".obj-cell-chk img").attr("src","images/common/icon/icon_check_round.png");
            
    //         delete selected_obj[this_cell.data("bl")];

    //         //deselect sub-branches if all sub r selected
    //         var sublist = this_cell.parent().next().find(".obj-cell.branch");
    //         var allChkTrue = true;
    //         sublist.each( function(){
    //             if( !$(this).data("chk") ){
    //                 allChkTrue = false;
    //                 return false;
    //             }
    //         });
    //         if( allChkTrue ){
    //             sublist.each( function(){
    //                 $(this).data("chk",false);
    //                 $(this).find(".obj-cell-chk .img").removeClass("chk");
    //                 delete selected_obj[$(this).data("bl")];
    //             });
    //         }
    //     }else{
    //         this_cell.data("chk",true);
    //         this_cell.find(".obj-cell-chk .img").addClass("chk");
    //         // this_cell.find(".obj-cell-chk img").attr("src","images/common/icon/icon_check_round_check.png");
            
    //         if( this_cell.data("bl-name") ){
    //             selected_obj[this_cell.data("bl")] = this_cell.data("bl-name");
    //         }

    //         //select sub-branches if all sub r not selected
    //         var sublist = this_cell.parent().next().find(".obj-cell.branch");
    //         var allChkFalse = true;
    //         sublist.each( function(){
    //             if( true == $(this).data("chk") ){
    //                 allChkFalse = false;
    //                 return false;
    //             }
    //         });
    //         if( allChkFalse ){
    //             sublist.each( function(){
    //                 $(this).data("chk",true);
    //                 $(this).find(".obj-cell-chk .img").addClass("chk");
    //                 if( $(this).data("bl-name") ){
    //                     selected_obj[$(this).data("bl")] = $(this).data("bl-name");
    //                 }
    //             });
    //         }
    //     }

    //     //存回
    //     $("#page-selectMem .ui-container").data("selected-branch",selected_obj);

    //     updateSelectedObj();
    // });

    // $(".obj-selected .clear").off("click").click( selectTargetAll );

    // //避免重複
    // $(".ui-header .page-next").data("isBackWhenDone", isBackWhenDone);
    // $(document).off("click",".ui-header .page-next:not(.disable)");
    // $(document).on("click",".ui-header .page-next:not(.disable)",function(e){
    //     var isBackWhenDone = $(this).data("isBackWhenDone");
    //     var obj_length = Object.keys($("#page-selectMem .ui-container").data("selected-obj")).length
    //         +Object.keys($("#page-selectMem .ui-container").data("selected-branch")).length;

    //     //工作
    //     if(this_compose.parent().hasClass("cp-work-item")){
    //         var target = ".cp-work-item-object span:eq(" + this_compose.parents(".cp-work-item").data("work-index") + ")";
    //         var selected_obj = $("#page-selectMem .ui-container").data("selected-obj");
    //         var obj_str = "分派對象";
    //         if(obj_length){
    //             var key = Object.keys(selected_obj)[0];
    //             obj_str = selected_obj[key];
    //             $(target).css("color","red");
    //         }else{
    //             $(target).removeAttr("style");
    //         }
    //         $(target).html(obj_str);

    //         //製作發佈對象list 轉換成str 避免call by reference
    //         var obj_str = JSON.stringify(selected_obj);
    //         this_compose.data("object_str",obj_str);
    //     }else{
    //         //其餘發佈對象
    //         if(obj_length != 0){
    //             $(".cp-content-object span").html( $.i18n.getString("GROUP_MEMBERS",obj_length) );
    //         }else{
    //             $(".cp-content-object span").html("");
    //         }
            
    //         //製作發佈對象list 轉換成str 避免call by reference
    //         var obj_str = JSON.stringify($("#page-selectMem .ui-container").data("selected-obj"));
    //         this_compose.data("object_str",obj_str);
    //         var branch_str = JSON.stringify($("#page-selectMem .ui-container").data("selected-branch"));
    //         this_compose.data("branch_str",branch_str);
    //     }

    //     //回上一頁
    //     if(isBackWhenDone ) $(".page-next").parent().find(".page-back").trigger("click");
    //     if( onDone ) onDone(true);
    // });

    // //避免重複綁定事件 先解除
    // $(".obj-selected .list").off("click").click(function(e){
    //     $(this).find(".search").focus();
    //     e.stopPropagation();
    // });
    // $(document).on("click", ".on-search .obj-cell, .on-search .subgroup-parent", function(){
    //     $(".obj-selected .list .search").html("").trigger("input");
    //     $(".obj-cell-area").scrollTop(0);
    // });
    // $(".obj-selected .list .search").off("input").on("input", function(){
    //     //更新搜尋結果
    //     var search = $(this).html();
    //     var rows = $(".obj-cell");
    //     if( search.length<=0 ){
    //         rows.show();
    //         $(".obj-cell-arrow.open").removeClass("open");
    //         $(".subgroup-parent").next().hide();
    //         $(".obj-cell-arrow").css("opacity","1");

    //         $(".ui-container").removeClass("on-search");
    //         $(".obj-cell").show();
    //         $(".subgroup-parent").show();
    //         $(this).html("");
    //         $(".obj-cell-area hr").show();
    //         $(".obj-cell-subTitle .obj-cell-subTitle-chk").show();
    //         return;
    //     }
    //     search = search.toLowerCase();

    //     $(".obj-cell-area hr").hide();
    //     $(".subgroup-parent").hide();
    //     $(".subgroup-parent").next().show();
    //     $(".obj-cell-arrow").css("opacity","0");
    //     $(".ui-container").addClass("on-search");
    //     $(".subgroup-row.fav-parent").hide();
    //     $(".obj-cell-subTitle .obj-cell-subTitle-chk").hide();
    //     if( $(".ui-container").hasClass("on-search") ){
    //         rows.each( function( index, rowElement ){
    //             var row = $(rowElement);
    //             if( row.hasClass("self") 
    //                 || row.hasClass("all") 
    //                 || row.hasClass("fav") ){
    //                 row.hide();
    //                 return;
    //             }
    //             var parent = row.parents(".subgroup-parent");
    //             var name = row.find(".obj-user-name").text();
    //             var title = row.find(".obj-user-title").text();
    //             if( (name && name.toLowerCase().indexOf(search)>=0) 
    //                 || (title && title.toLowerCase().indexOf(search)>=0) ){
    //                 parent.show();
    //                 row.show();
    //                 return;
    //             }
    //             if( parent.length>0 ){
    //                 parent.hide();
    //             } else {
    //                 row.hide();
    //             }
                
    //         });
    //     }
    // });
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

getMemObjectRow = function( gu_obj, bl ){
    var this_obj = $(
        '<div class="obj-cell mem" data-gu="'+gu_obj.gu+'">' +
           '<div class="obj-cell-chk"><div class="img"></div></div>' +
           '<div class="obj-cell-user-pic namecard"><img src="images/common/others/empty_img_personal_xl.png" style="width:60px"/></div>' +
           '<div class="obj-cell-user-data">' + 
                '<div class="obj-user-name">' + gu_obj.nk.replaceOriEmojiCode() + '</div>' +
                '<div class="obj-user-title"></div>' +
        '</div>'
    );

    //get extra content (bl name or em)
    var branchID = gu_obj.bl;
    var extraContent = "";  //gu_obj.em;
    if( branchID && branchID.length>0 ){
        var branchPath = branchID.split(".");
        if( branchPath && branchPath.length>0 ){
            branchID = branchPath[branchPath.length-1];
            if( bl.hasOwnProperty(branchID) ){
                extraContent = bl[branchID].bn;
            }
        }
    }
    if(extraContent && extraContent.length>0){
        this_obj.find(".obj-cell-user-data").addClass("extra");
        this_obj.find(".obj-user-title").html( extraContent );
    }

    var object_img = this_obj.find(".obj-cell-user-pic img");
    if(gu_obj.aut) {
        object_img.attr("src",gu_obj.aut);
        avatarPos(object_img);
    }

    this_obj.data("gu",gu_obj.gu);
    this_obj.find(".obj-cell-user-pic.namecard").data("gu",gu_obj.gu);
    this_obj.data("gu-name",gu_obj.nk);

    return this_obj;
}