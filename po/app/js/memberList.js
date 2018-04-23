/**
純顯示成員列表用, 頁面如下
(<是back鈕)

<   title
img     name
img     name
....

**/
showMemListPage = function( parentDom, title, list, onPageChanged, onDone ){
	if( $("#page-select-object").length>0 ){
		showMemListPageDelegate( title, list, onPageChanged, onDone );
	} else {
		$('<div>').load('layout/memberList.html?v2.3.0.5',function(){
			parentDom.append( $(this).find("#page-select-object") );
			showMemListPageDelegate( title, list, onPageChanged, onDone );
		});
	}
}
showMemListPageDelegate = function( title, list, onPageChanged, onDone ){
    var page = $("#page-select-object");

    //title
    page.find(".header-cp-object").html( title?title:"" );

    //tabs
    var length = list.length;
    var tabArea = page.find(".tabObj-tab-area");
    var cellArea = $("#page-select-object .tabObj-cell-area");
    tabArea.html("");
    var width = (100.0/list.length)+"%";
    $.each( list, function(index, object){
        var tab = $("<div class='tab'></div>");
        tab.data("id", index);
        tab.data("obj", object);
        tab.css("width",width);
        var tmp = "<div>" + ((object.title&&object.title.length>0)?object.title:" ") +"</div>";
        tab.html( tmp );
        tabArea.append(tab);
    });
    if( list.length<=1 ){
        tabArea.hide();
        cellArea.addClass("noTitle");
    } else {
        tabArea.show();
        cellArea.removeClass("noTitle");
    }

    //generate page when click
    tabArea.next().html("");
    page.find(".tab").click(function(){
        // $(window).scrollTop(20);
        $("body").addClass("user-info-adjust");
        setTimeout(function(){
            $("body").removeClass("user-info-adjust");
        },100);

        var tab = $(this);
        var index = tab.data("id");
        var cell = cellArea.find("._"+index);
        var listData = tab.data("obj").ml;
        var userData = $.userStorage();
        var guAll = userData[gi].guAll;
        var bl = userData[gi].bl;

        $("#page-select-object .tab").removeClass("current");
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

                if(mem.aut) object_img.attr("src",mem.aut);

                if(rt) this_obj.find(".obj-cell-time").html(new Date(rt).toFormatString());

                this_obj.find(".obj-cell-user-pic.namecard").data("gu",mem.gu);

                this_obj.data("gu",mem.gu);
                this_obj.data("gu-name",mem.nk);
                cellArea.find("._"+index).append(this_obj);
            });
        }

        if( cell.length<=0 ){
            cell = $("<div class='obj-cell-page _"+index+"'></div>");
            cellArea.append( cell );

            makeMemberList();
        }

        page.find(".obj-cell-page.current").hide().removeClass("current");
        cell.show().addClass("current");

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

    $.changePage("#page-select-object", onPageChanged, onDone);
}