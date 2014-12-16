showMemListPage = function( parentDom, title, list, onPageChanged, onDone ){
	if( $("#page-tab-object").length>0 ){
		showMemListPageDelegate( title, list, onPageChanged, onDone );
	} else {
		$('<div>').load('layout/memberList.html',function(){
			parentDom.append( $(this).find("#page-tab-object") );
			showMemListPageDelegate( title, list, onPageChanged, onDone );
		});
	}
}
showMemListPageDelegate = function( title, list, onPageChanged, onDone ){
    var page = $("#page-tab-object");

    //title
    page.find(".header-cp-object").html( title?title:"" );

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
    $(document).find("#page-tab-object .tab").click(function(){
        $(window).scrollTop(0);
        $("body").addClass("user-info-adjust");
        setTimeout(function(){
            $("body").removeClass("user-info-adjust");
        },100);

        var tab = $(this);
        var index = tab.data("id");
        var cell = cellArea.find("._"+index);

        $("#page-tab-object .tab").removeClass("current");
        tab.addClass("current");

        if( cell.length<=0 ){
            var data = tab.data("obj");
            cell = $("<div class='obj-cell-page _"+index+"'></div>");
            cellArea.append( cell );

            //gen mem
            var guAll = $.lStorage(ui)[gi].guAll;
            var bl = $.lStorage(ui)[gi].bl;
            for(var i=0;i<data.ml.length; i++ ){
                var gu = data.ml[i].gu;
                var rt = data.ml[i].rt;
                if( !gu ) continue;
                if( !guAll.hasOwnProperty(gu) ) continue;
                var mem = guAll[gu];
                var this_obj = $(
                    '<div class="obj-cell mem" data-gu="'+gu+'">' +
                        '<div class="obj-cell-user-pic namecard"><img src="images/common/others/empty_img_personal_xl.png" style="width:60px"/></div>' +
                        '<div class="obj-cell-time"></div>' +
                        '<div class="obj-cell-user-data">' + 
                            '<div class="obj-user-name">' + mem.nk.replaceOriEmojiCode() + '</div>' +
                            '<div class="obj-user-title"></div>' +
                    '</div>'
                );

                var branchID = mem.bl;
                var extraContent = "";  //mem.em;
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
                if(mem.aut) {
                    object_img.attr("src",mem.aut);
                    //object_img.removeAttr("style");
                    // avatarPos(object_img);
                }
                if( rt ) {
                    this_obj.find(".obj-cell-time").html( new Date(rt).toFormatString() );
                }
                this_obj.find(".obj-cell-user-pic.namecard").data("gu",mem.gu);

                this_obj.data("gu",mem.gu);
                this_obj.data("gu-name",mem.nk);
                cell.append(this_obj);
            }
        }
        $("#page-tab-object .obj-cell-page.current").hide().removeClass("current");
        cell.show().addClass("current");
    }); 
    tabArea.find(".tab:nth-child(1)").trigger("click");

    $.changePage("#page-tab-object", onPageChanged, onDone);
}