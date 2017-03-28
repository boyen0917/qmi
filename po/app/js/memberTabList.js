/**
通用版已未讀
(func.js也有一個showObjectTabShow, 沒有整合)
顯示多tab的成員列表, 主要用在已未讀, 頁面如下
(<是back鈕)

<      title
--------------------
 已讀      |    未讀
------------------
img name/branch  已讀時間
img name/branch  已讀時間
....

**/

/**
parentDom:    頁面的container
onDone:       按下back扭的callback
**/
loadObjectTabPage = function( parentDom, onDone ){
    if( $("#page-tab-object").length>0 ){
        if( onDone ) onDone();
    } else {
        $('<div>').load('layout/memberList.html',function(){
            parentDom.after( $(this).find("#page-tab-object") );
            if( onDone ) onDone();
        });
    }
}

/**
giTmp:          group id
title:          顯示標題
list:           {title: $.i18n.getString("FEED_READ"), ml: null}
onPageChanged:  頁面跳轉完成的callback
onDone:         按下back扭的callback

eg.var list = [
    { //tab 1
        title: $.i18n.getString("FEED_READ"), 
        ml: [
            {"gu":"M00000fx01f","rt":1439437853894},
            {"gu":"M0000bLh01w","rt":1438159950688}
        ]
    }, { //tab 2
        title: $.i18n.getString("FEED_UNREAD"), 
        ml: [{"gu":"M000000606f","rt":1413969741770}]
    }
]

showChatObjectTabShow( "G000001", "聊天室已未讀", list, function(){
        alert("page loaded");
    }, function(){
        alert("on back to parent page");
    }
);
**/
showChatObjectTabShow = function( giTmp, title, list, onPageChanged, onDone ){
    var page = $("#page-tab-object");

    //title
    page.find(".header-cp-object").html(title ? title : "" );

    //tabs
    var length = list.length;
    var tabArea = page.find(".tabObj-tab-area");
    var cellArea = $("#page-tab-object .tabObj-cell-area");
    tabArea.html("");
    var width = (100.0/list.length)+"%";
    $.each( list, function(index, object){
        var tab = $("<div class='tab'></div>");
        tab.data("id", index);
        tab.data("obj", object);
        tab.css("width",width);
        var tmp = "<div>" + ((object.title&&object.title.length>0)?object.title:" ") +"</div>";
        tab.html( tmp );
        tab.data("clickable", (null==object.clickable)?true:(object.clickable) );
        tabArea.append(tab);
    });
    // if( list.length<=1 ){
    //     tabArea.hide();
    //     cellArea.addClass("noTitle");
    // } else {
        tabArea.show();
        cellArea.removeClass("noTitle");
    // }

    //generate page when click
    tabArea.next().html("");
    page.find(".tab").click(function(){
        var tab = $(this);
        if( false==tab.data("clickable") ){
            popupShowAdjust( $.i18n.getString("COMMON_PAID_FEATURE_TITLE"), $.i18n.getString("COMMON_PAID_FEATURE_CONTENT") );
            return;
        }

        $(window).scrollTop(0);
        $("body").addClass("user-info-adjust");
        setTimeout(function(){
            $("body").removeClass("user-info-adjust");
        }, 100);

        var index = tab.data("id");
        var cell = cellArea.find("._"+index);
        var userData = $.userStorage();
        var guAll = userData[gi].guAll;
        var listData = tab.data("obj").ml;
        var bl = userData[gi].bl;
        var myID = userData[gi].me;

        $("#page-tab-object .tab").removeClass("current");
        tab.addClass("current");

        var makeMemberList = function () {
            var currentMembum = cellArea.find("._" + index + " .obj-cell").length;
            var loadMemList = listData.slice(currentMembum, currentMembum + 100);

            if (currentMembum + 100 > listData.length - 1) {
                loadMemList = listData.slice(currentMembum);
            } 

            loadMemList.forEach(function (member) {
                var gu = member.gu;
                var rt = member.rt;
                var mem = guAll[gu];

                if( !gu ) return;
                if( !guAll.hasOwnProperty(gu) || gu === myID) return;

                var this_obj = $(
                    '<div class="obj-cell mem" data-gu="'+gu+'">' +
                        '<div class="obj-cell-user-pic"><img src="images/common/others/empty_img_personal_xl.png" style="width:60px"/></div>' +
                        '<div class="obj-cell-time"></div>' +
                        '<div class="obj-cell-user-data">' + 
                            '<div class="obj-user-name">' + mem.nk.replaceOriEmojiCode() + '</div>' +
                            '<div class="obj-user-title"></div>' +
                    '</div>'
                );

                var branchID = mem.bl;
                var extraContent = "";  //mem.em;
                if( branchID && branchID.length > 0 ){
                    var branchPath = branchID.split(".");
                    if( branchPath && branchPath.length > 0 ){
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
                if(mem.aut) {
                    object_img.attr("src",mem.aut);
                    //object_img.removeAttr("style");
                    // avatarPos(object_img);
                }
                if( rt ) {
                    this_obj.find(".obj-cell-time").html( new Date(rt).toFormatString() );
                }
                this_obj.find(".obj-cell-user-pic.namecard").data("gu",mem.gu);

                this_obj.data("gu", mem.gu);
                this_obj.data("gu-name", mem.nk);
                cellArea.find("._"+index).append(this_obj);
            });
        }

        if( cell.length <= 0 ){
            cell = $("<div class='obj-cell-page _"+index+"'></div>");
            cellArea.append( cell );

            makeMemberList();
        }
        
        $("#page-tab-object .obj-cell-page.current").hide().removeClass("current");
        cell.show().addClass("current");

        console.log(page.find(".obj-cell-page.current"));
        page.find(".obj-cell-page.current").off("scroll").on("scroll", function (e) {
            var container = $(e.target);
            if (container.scrollTop() + container.height() > container[0].scrollHeight - 20) {
                if (container.find(" .obj-cell").length < listData.length) {
                    makeMemberList();
                }
            }
        });
    }); 
    tabArea.find(".tab:nth-child(1)").trigger("click");

    $.changePage("#page-tab-object", onPageChanged, onDone);
}