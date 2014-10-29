var bl;
var guAll;

initContactList = function(){
	//get user data
	if( typeof(ui)=='undefined' ) return;
	var userData = $.lStorage(ui);
	if( !userData )	return;

	//get group data
	if( typeof(gi)=='undefined' ) return;
	var group = userData[gi];
	if( !group ) return;

	//get branch data
	bl = group.bl;
	if( !bl ) return;

	//get mem data
	guAll = group.guAll;
	if( !guAll ) return;

	//get html container
	var rowContainer = $(".contact-rows");
	if( !rowContainer || rowContainer.length<=0 ) return;
	rowContainer.html("");

	//add row all
	var tmp = $("<div class='row all'></div>");
	tmp.append("<div class='name'>"+$.i18n.getString("MEMBER_ALL")+"</div>");
	tmp.append("<div class='detail'>"+$.i18n.getString("COMPOSE_N_MEMBERS",0)+"</div>");
	rowContainer.append(tmp);

	//set title
	$("#page-group-main").find(".page-title").html( group.gn );
	//set sidemenu
	// $(".side-menu-btn").off("click").click(function(){
	//     $( "#side-menu" ).panel( "open");
	// });

	//show 1st level branch data
	if( Object.keys(bl).length>0 ){
		$.each(bl,function(key,bl_obj){
			//第一層顯示開關
			if(1==bl_obj.lv){
				var tmp = $("<div class='row branch'><div class='left'></div><div class='right'></div></div>");
				var left = tmp.find(".left");
				left.append("<div class='name'>"+bl_obj.bn+"</div>");
				if( bl_obj.cl.length>0 ) left.append("<div class='detail'>"+$.i18n.getString("COMPOSE_N_SUBGROUP", bl_obj.cl.length)+"</div>");
				left.append("<div class='detail'>"+$.i18n.getString("COMPOSE_N_MEMBERS", 0)+"</div>");
				
				tmp.find(".right").append("<img src='images/icon/icon_arrow_next.png'/>");
				tmp.data("bi", key );
				rowContainer.append(tmp);

				// var tmp = $("<table class='row branch'><tr><td></td><td></td></tr></div>");
				// var left = tmp.find("td:nth-child(1)");
				// left.append("<div class='name'>"+bl_obj.bn+"</div>");
				// if( bl_obj.cl.length>0 ) left.append("<div class='detail'>"+$.i18n.getString("COMPOSE_N_SUBGROUP", bl_obj.cl.length)+"</div>");
				// left.append("<div class='detail'>"+$.i18n.getString("COMPOSE_N_MEMBERS", 0)+"</div>");
				
				// tmp.find("td:nth-child(2)").append("<img src='images/icon/icon_arrow_next.png'/>");
				// tmp.data("bi", key );
				// rowContainer.append(tmp);
			}
		});
	}

	rowContainer.find(".row.branch").off("click").click( function(){
		showSubContactPage( "page-group-main", $(this).data("bi"), JSON.stringify([]) );
	});
	//是否要做search cache???
}

showSubContactPage = function( parentPageID, bi, lvStackString, isGenContent ){
	if( null==isGenContent ) isGenContent = true;
	var lvStack = $.parseJSON(lvStackString);
	var data = bl[bi];
	if( !data ) return;
	lvStack.push(data.bn);
	var parentLevel = data.lv;
	var childList = data.cl;
	
	var pageID = "page-contact_sub"+parentLevel;
	var page = $( "#"+pageID );
	if( !page || page.length==0 ){
		page = $('<div data-role="page" id="'+pageID+'">'
            +'<div data-theme="c" data-role="header" data-position="fixed" data-tap-toggle="false">'
                +'<div class="page-back"><img src="images/navi/navi_icon_back.png"/></div>'
                +'<h3 class="page-title">成員列表</h3>'
            +'</div><div class="subpage-contact"></div></div>');
		$("#"+parentPageID).after(page);
	}
	if( !isGenContent ){
		page.data("gen", false);
		page.data("parentPageID", parentPageID);
		page.data("bi", bi);
		page.data("lvStackString", lvStackString);
		cns.debug( page.data("gen"), page.data("parentPageID"), page.data("bi"), page.data("lvStackString") );
		return;
	} else {
		page.data("gen", true);
	}

	page.find(".page-title").html( data.bn );
	page.find(".page-back").off("click").click(function(){
		$.mobile.changePage("#"+parentPageID);
		var tmp = $( "#"+parentPageID );
		if( tmp && tmp.length>0 && false==tmp.data("gen") ){
			showSubContactPage( tmp.data("parentPageID"),
				tmp.data("bi"), tmp.data("lvStackString") );
		}
	});
	
	var subPage = page.find(".subpage-contact");
	subPage.html("");

	//title
	var title = $("<div class='contact-titleBar'></div>");
	var nameArea = $("<div class='nameArea'></div>");
	nameArea.append("<div class='name'>"+data.bn+"</div>");
	nameArea.append("<div class='arrow'></div>");
	title.append(nameArea);
	title.append("<div class='btn'></div>");
	subPage.append(title);

	nameArea.off("click").click( function(){
		//show sub divs
		subbranchList.slideToggle();
		title.find(".arrow").toggleClass("open");
	});
	title.find(".btn").off("click").click( function(){
		if( true==$(this).hasClass("list") ){
			subPageBottom.find(".contact-memLists").fadeOut('fast', function(){
				subPageBottom.find(".contact-mems").show(0);
			});
			$(this).removeClass("list");
		} else {
			var mem = subPageBottom.find(".contact-mems");
			var memList = subPageBottom.find(".contact-memLists");
			if( !memList || memList.length==0 ){
				memList = $("<div class='contact-memLists'></div>");
				$.each( mem.find(".mem"),function(key,dom){
					var gu = $(dom).data("gu");
					var memData = guAll[gu];
					var tmp = $("<div class='row mem'><div class='left namecard'></div><div class='mid namecard'></div><div class='right'></div></div>");
					var left = tmp.find(".left");
					// $(left).data("gu", gu );
					//photo
					$(dom).find(".img").clone().appendTo(left);
					//name, ?
					var mid = tmp.find(".mid");
					// $(mid).data("gu", gu );
					$(dom).find(".name").clone().appendTo(mid);
					mid.append("<div class='detail'>職稱？群組？or?</div>");
					//favorite
					var right = tmp.find(".right");
					var fav = $("<div class='fav'></div>");
					if( memData && true==memData.fav ){
						right.addClass("active", true);
					}
					right.append(fav);
					right.data("gu", gu );
					cns.debug(right.data("gu"));

					memList.append(tmp);
				});
				mem.find(".noMem").clone().appendTo( memList );
			}

			mem.fadeOut('fast', function(){
				mem.after(memList);
				memList.show(0);
			});
			$(this).addClass("list");



			memList.find(".right").off("click").click( function(){
				var thisTmp = $(this);
				if( thisTmp.hasClass("sending") ) return;
				thisTmp.addClass("sending");
				var gu = thisTmp.data("gu");
				cns.debug(gu);
				if( !gu ) return;

				var api_name = "groups/" + gi + "/users/" + gu + "/favorite";
			    var headers = {
			             "ui":ui,
			             "at":at, 
			             "li":lang,
			                 };
				ajaxDo(api_name,headers,"put",true,null).complete(function(data){
					thisTmp.removeClass("sending");
					if(data.status == 200){
						//save to db
						var isAdded = (700==$.parseJSON(data.responseText).rsp_code);
						cns.debug("add:",isAdded);
						thisTmp.toggleClass("active", isAdded);
						var data = $.lStorage(ui);
						data[gi].guAll[gu].fav = isAdded;
						$.lStorage(ui, data);
					}
				});
			});
		}
	});

	//sub branch list
	var subbranchList = $('<div class="contact-branchList" style="display:none;"></div>');
	showSubbranchList( subbranchList, data.lv, bi, JSON.stringify([]) );
	subbranchList.find(".row.list").off("click").click( function(){
		//避免回來時看到開著的列表, 把列表卷上去
		subbranchList.slideUp();

		//產生目前的頁面到指定階層中間的頁面, 除最後一頁外其餘內容留空, 走到那頁時才產
		var stackString = $(this).data("stack");
		var currentStack = lvStack.slice(0);
		if( stackString && stackString.length > 0 ){
			var stackTmp = $.parseJSON(stackString);
			var currentStackLvl = parentLevel;
			for( var i=1; i<stackTmp.length-1; i++ ){
				var pageIDTmp = "page-contact_sub"+currentStackLvl;
				showSubContactPage( pageIDTmp, stackTmp[i], JSON.stringify(currentStack), false );
				if( bl.hasOwnProperty(stackTmp[i]) ){
					currentStack.push( bl[stackTmp[i]].bn );
				} else currentStack.push( stackTmp[i] );
				currentStackLvl++;
			}
			var pageIDTmp = "page-contact_sub"+currentStackLvl;
			showSubContactPage( pageIDTmp, stackTmp[i], JSON.stringify(currentStack) );
		}
	});
	subPage.append(subbranchList);

	// title.off("click").click( function(){
	// 	if( parentLevel==1 ){
	// 		$(".subpage-contact:not(.sub)").slideDown();
	// 		$(".subpage-contact.sub").hide();
	// 	} else {
	// 		$(".subpage-contact").hide();
	// 		$(".subpage-contact.sub._"+(parentLevel-1) ).slideDown();
	// 	}
	// });

	var subPageBottom = $('<div class="contact-scroll"></div>');
	subPage.append(subPageBottom);

	//branch-stack
	if( lvStack.length>1 ){
		var lvStackDiv = $("<div class='contact-lvStack'></div>");
		if( lvStack.length <= 3 ){
			for( var i=0;i<lvStack.length;i++ ){
				cns.debug(lvStack[i]);
				lvStackDiv.append( "<div>"+lvStack[i]+"</div><img src='images/common/icon/icon_arrow_grey_right.png'>" );
			}
		} else {
			lvStackDiv.append( "<div>...</div>" );
			for( var i=lvStack.length-3;i<lvStack.length;i++ ){
				cns.debug(lvStack[i]);
				lvStackDiv.append( "<div>"+lvStack[i]+"</div><img src='images/common/icon/icon_arrow_grey_right.png'>" );
			}
		}
		var tt = lvStackDiv.find("img:last-child");
		tt.remove();
		subPageBottom.append(lvStackDiv);
	}

	//mem-title
	var subTitle = $("<div class='contact-mems-title'></div>");
	subTitle.append( '<div class="count">'+0+'</div>');
	subTitle.append( '<div class="text">'+$.i18n.getString("COMPOSE_N_MEMBERS", "")+'</div>');
	subPageBottom.append(subTitle);
	
	//mem
	var memContainer = $("<div class='contact-mems'></div>");
	var count = 0;
	$.each(guAll,function(key,mem){
		var id = mem.bl.substring(mem.bl.length-11,mem.bl.length);
		if( id==bi ){
			count++;
			var tmp = $("<div class='mem namecard'></div>");
			if( mem.aut && mem.aut.length>0 ){
				tmp.append("<div class='img' style='background-image:url("+mem.aut+")'></div>");
			} else {
				tmp.append("<div class='img'></div>");
			}
			tmp.append("<div class='name'>"+mem.nk+"</div>");
			tmp.data("gu",key);
			memContainer.append(tmp);
		}
	});
	subPageBottom.append(memContainer);

	if( 0==count ){
		subTitle.hide();
		memContainer.append("<div class='noMem'>"+$.i18n.getString("MEMBER_X_GROUP_NO_MEMBER", data.bn)+"</div>");
	} else {
		subTitle.find(".count").html(count);
	}

	//sub-branches
	if( childList.length>0 ){
		var subTitle = $("<div class='contact-rows-title'></div>");
		subTitle.append( '<div class="count">'+childList.length+'</div>');
		subTitle.append( '<div class="text">'+$.i18n.getString("COMPOSE_N_SUBGROUP", "")+'</div>');
		subPageBottom.append( subTitle );

		var branch = $("<div class='contact-rows'></div>");
		for(var i=0; i<childList.length; i++ ){
			var key = childList[i];
			var childData = bl[key];
			if( childData ){
				var tmp = $("<div class='row branch'><div class='left'></div><div class='right'></div></div>");
				var left = tmp.find(".left");
				left.append("<div class='name'>"+childData.bn+"</div>");
				if( childData.cl.length>0 ) left.append("<div class='detail'>"+$.i18n.getString("COMPOSE_N_SUBGROUP", childData.cl.length)+"</div>");
				left.append("<div class='detail'>"+$.i18n.getString("COMPOSE_N_MEMBERS", 0)+"</div>");
				
				tmp.find(".right").append("<img src='images/icon/icon_arrow_next.png'/>");
				tmp.data("bi", key );
				
				branch.append(tmp);
			}
		}
		subPageBottom.append(branch);
		subPageBottom.find(".row.branch").off("click").click( function(){
			showSubContactPage( pageID, $(this).data("bi"), JSON.stringify(lvStack) );
		});
	}
	$.mobile.changePage("#"+pageID);
}

showSubbranchList = function( dom, startLvl, bi, stackString ){
	if( !bi || !dom || dom.length<0 ) return;
	var stack = $.parseJSON(stackString);
	stack.push(bi);
	stackString = JSON.stringify(stack);
	var data = bl[bi];
	var tmp = $("<div class='row list _"+(data.lv-startLvl+1)+"'><div class='left'></div><div class='right'>"+data.lv+"</div></div>");
	var left = tmp.find(".left");
	left.append("<div class='name'>"+data.bn+"</div>");
	// left.append("<div class='name'>拉拉拉拉拉拉拉拉拉拉拉拉+</div>");
	left.append("<div class='detail'>"+$.i18n.getString("COMPOSE_N_MEMBERS", 0)+"</div>");
	tmp.data("stack", stackString);
	tmp.css("padding-left",((Math.min(11,data.lv-startLvl)+1)*20)+"px");
	if( startLvl== data.lv ) dom.append(tmp);
	else dom.after(tmp);

	if( data.cl.length>0 ){
		for( var i=0;i<data.cl.length;i++ ){
			showSubbranchList(tmp, startLvl, data.cl[i], stackString );
		}
	}
	
}