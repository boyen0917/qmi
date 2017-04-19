var bl;
var guAll;
var inviteGuAll;
var guAllExsit;
var fbl;
var isList = true;
var g_group;
var g_contactWaitLoadImgs;
var g_newMemList;
var sortedMemIdList;
// var isKeyPress = false;

$(document).ready(function(){
	//set add member button
	$(document).off("click",".contact-add");
	$(document).on("click",".contact-add",function(e){
		showAddMemberPage();
	});
});

initContactList = function(){
	//clear search result
	$(".subpage-contact .contact-search .clear").trigger("click");

	if( false==initContactData() ) return;

	//get html container
	var rowContainer = $(".subpage-contact .contact-rows");
	if( !rowContainer || rowContainer.length<=0 ) return;
	rowContainer.html("");

	var pagesTmp = $(".contact-subpages");
	if( pagesTmp.is(":visible") ){
		pagesTmp.find(".page-back").trigger("click");
	}
	$("#page-contact_all").data("gi",null);

	//add row all
	var tmp = $("<div class='row all'><div class='left'></div><div class='right'></div></div>");
	var left = tmp.find(".left");
	left.append("<div class='name'>"+$.i18n.getString("COMMON_ALL_MEMBERS")+"</div>");
	left.append("<div class='detail'>"+$.i18n.getString("COMPOSE_N_MEMBERS",Object.keys(guAllExsit).length)+"</div>");
	tmp.find(".right").append("<img src='images/icon/icon_arrow_right.png'/>");
	rowContainer.append(tmp);
	rowContainer.find(".row.all").off("click").click( function(){
		showAllMemberPage(g_group.gn) 
	});
	//any new mem
	var newMemCnt = Object.keys(g_newMemList).length;
	if( newMemCnt>0 ){
		tmp.find(".right").prepend("<div class='new'>"+newMemCnt+"</div>");
	}

	//add row favorite
	var tmp = $("<div class='row favorite'><div class='left'></div><div class='right'></div></div>");
	var left = tmp.find(".left");
	var branchCount = Object.keys(fbl).length;
	left.append("<div class='name'>"+$.i18n.getString("COMMON_FAVORIATE")+"</div>");
	left.append("<div class='detail mem'>"+$.i18n.getString("COMPOSE_N_MEMBERS",(g_group.favCnt)?g_group.favCnt:0 )+"</div>");
	if(branchCount>0) left.append("<div class='detail branch'>"+$.i18n.getString("COMPOSE_N_SUBGROUP", branchCount)+"</div>");
	tmp.find(".right").append("<img src='images/icon/icon_arrow_right.png'/>");
	rowContainer.append(tmp);
	rowContainer.find(".row.favorite").off("click").click( showFavoritePage );

	//set title
	$("#page-group-main").find(".page-title").html( g_group.gn );
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
				left.append("<div class='detail'>"+$.i18n.getString("COMPOSE_N_MEMBERS", bl_obj.cnt)+"</div>");
				if( bl_obj.cl.length>0 ) left.append("<div class='detail'>"+$.i18n.getString("COMPOSE_N_SUBGROUP", bl_obj.cl.length)+"</div>");
				
				tmp.find(".right").append("<img src='images/icon/icon_arrow_right.png'/>");
				tmp.data("bi", key );
				rowContainer.append(tmp);
			}
		});
	}

	rowContainer.find(".row.branch").off("click").click( function(){
		cns.debug("???");
		showSubContactPage( "page-group-main", $(this).data("bi"), JSON.stringify([]) );
	});

	//search bar
	var searchBar = $(".contact-search .content");
	var searchBarInput = searchBar.find(".input");
	searchBarInput.data("searchText","");
	searchBarInput.off("keyup").keyup( onSearchInput );
	// searchBarInput.off("keypress").keypress( function(){
	// 	isKeyPress = true;
	// });
	searchBar.find(".clear").off("click").click(deactiveSearch);
	//若沒有文字的話點別處取消搜尋
	searchBarInput.off("focusout").focusout( function(){
		var text = searchBarInput.val();
		if( !text || text.length==0 ){
			deactiveSearch();
		}
	});

	var searchHint = $(".contact-search .hintDiv");
	searchHint.off("click").click( function(){
		$(this).hide();
		searchBar.show();
		searchBarInput.focus();
	});

	// $(".subpage-contact").height( $(window).height()-63 );
	$(window).off("resize").resize( function(){
		$(".contact-branchList").height( $(window).height()-105 );
		$(".contact-scroll").height( $(window).height()-112 );
	});
}

deactiveSearch = function(){
	var content = $(".contact-search .content");
	content.hide();
	var input = content.find(".input");
	input.data("searchText","");
	input.val("");
	
	$(".contact-search .hintDiv").show();
	$(".subpage-contact .contact-rows").show();
	$(".contact-searchResult").hide();
	return;
}

onSearchInput = function(e){
	var input = $(this);
	var resultContainer = $(".subpage-contact .contact-searchResult");
	if( input.val().indexOf("\n") >= 0 ){
		input.val( input.val().replace("/\n/g","") );
	}
	var str = input.val();	//+String.fromCharCode(e.keyCode);

	//if no search text, show ori rows
	if( !str || str.length==0 ){
		resultContainer.hide();
		$(".subpage-contact .contact-rows").show();
		return;
	}
	
	cns.debug(str);

	//hide ori rows
	var contact = $(".subpage-contact .contact-rows");
	var searchResult = $(".subpage-contact .contact-searchResult");
	if( !str || str.length==0 ){
		resultContainer.hide();
		$(".subpage-contact .contact-rows").show();
		return;
	}
	if( !searchResult || searchResult.length==0 ){
		searchResult = $('<div class="contact-searchResult" style="display:none;"></div>');
		contact.after( searchResult );
	}
	searchResult.show().scrollTop(0);
	contact.hide();

	//search with no case sensitive
	str = str.toLowerCase();

	//search mem
	var matchMemList = [];
	var memCount = 0;

	sortedMemIdList.forEach(function (memId) {
		var memberData = guAllExsit[memId];
		if(memberData.nk == null){
			cns.debug( JSON.stringify(mem) );
		} else {
			if( memberData.nk.toLowerCase().indexOf(str)>=0 ){
				matchMemList.push(memId);
				memCount++;
			}	
		}

	});
	// for( var key in guAllExsit ){
	// 	var mem = guAllExsit[key];
	// 	if( null==mem.nk ){
	// 		cns.debug( JSON.stringify(mem) );
	// 	} else {
	// 		if( mem.nk.toLowerCase().indexOf(str)>=0 ){
	// 			matchMemList.push(key);
	// 			memCount++;
	// 		}	
	// 	}
	// }


	//search bl
	var branchList = [];
	for( var key in bl ){
		var branch = bl[key];
		if( branch.bn.toLowerCase().indexOf(str)>=0 ){
			branchList.push(key);
		}
	}
	var branchCount = branchList.length;
	
	var memTitle = resultContainer.find(".memTitle");
	var branchTitle = resultContainer.find(".branchTitle");

	if( branchCount==0 && memCount==0 ){
		resultContainer.find(".noResult").show();
		memTitle.hide();
		branchTitle.hide();
		resultContainer.find(".contact-memLists").hide();
		resultContainer.find(".contact-rows").hide();
		return;
	}

	resultContainer.find(".noResult").hide();

	if( memCount>0 ){
		memTitle.show();
		var memListContainer = resultContainer.find(".contact-memLists");
		
		// if( memListContainer && memListContainer.length>0 ){
		// 	memListContainer.remove();
		// }
		memListContainer.removeData().html(generateMemberList(matchMemList, resultContainer)).show();
		// memTitle.after(memListContainer);
		setOnMemListScroll(matchMemList, resultContainer);
	} else {
		memTitle.hide();
	}

	if( branchCount>0 ){
		branchTitle.show();
		var branchListContainer = resultContainer.find(".contact-rows");
		if( branchListContainer && branchListContainer.length>0 ){
			branchListContainer.remove();
		}
		branchListContainer = generateBranchList( branchList );

		branchListContainer.find(".row.branch").off("click").click( function(){
			showSubContactPage( "page-group-main", $(this).data("bi"), JSON.stringify([]) );
		});
		branchTitle.after(branchListContainer);
	} else {
		branchTitle.hide();
	}
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
		page = $('<div data-role="page" id="'+pageID+'" class="subPage contact-subpages">'
            +'<div data-theme="c" data-role="header" data-position="fixed" data-tap-toggle="false">'
                +'<div class="page-back " customize><img src="images/common/icon/bt_close_activity.png"/></div>'
                +'<h3 class="page-title">成員列表</h3>'
            +'</div><div class="subpage-contact"></div></div>');
		$("#"+parentPageID).after(page);
	}
	// else if( true == page.data("gen") && gi==page.data("gi") ){
	// 	$.mobile.changePage("#"+pageID);
	// 	return;
	// }

	if( !isGenContent ){
		page.data("gen", false);
		page.data("parentPageID", parentPageID);
		page.data("bi", bi);
		page.data("lvStackString", lvStackString);
		cns.debug( page.data("gen"), page.data("parentPageID"), page.data("bi"), page.data("lvStackString") );
		return;
	} else {
		page.data("gen", true);
		page.data("gi", gi);
	}

	page.find(".page-title").html( data.bn );
	page.find(".page-back").off("click").click(function(){
		$(".contact-branchList").remove();
		showMainContact();
		// $.mobile.changePage("#"+parentPageID); //, { transition: "slide", reverse: true}
		// var tmp = $( "#"+parentPageID );
		// if( tmp && tmp.length>0 && false==tmp.data("gen") ){
		// 	showSubContactPage( tmp.data("parentPageID"),
		// 		tmp.data("bi"), tmp.data("lvStackString") );
		// }
	});
	
	var subPage = page.find(".subpage-contact");
	subPage.html("");

	//title
	var title = $("<div class='contact-titleBar'></div>");
	var nameArea = $("<div class='nameArea list'></div>");
	nameArea.append("<div class='name'>"+data.bn+"</div>");
	nameArea.append("<div class='arrow'></div>");
	title.append(nameArea);
	title.append("<div class='btn'></div>");
	subPage.append(title);

	//sub branch list
	cns.debug( parentLevel );
	var subbranchList = $(".contact-branchList");
	if( subbranchList.length==0 || parentLevel==1 ){
		subbranchList.remove();
		subbranchList = $('<div class="contact-branchList" style="display:none;"></div>');
		showSubbranchListBox( subbranchList, data.lv, bi, JSON.stringify([]) );

		subbranchList.find(".row:nth-child(1)").addClass("current");

		subbranchList.find(".row.list").off("click").click( function(){
			cns.debug( $(this).data("bi") );
			//產生目前的頁面到指定階層中間的頁面, 除最後一頁外其餘內容留空, 走到那頁時才產
			var stackString = $(this).data("stack");
			var currentStack = lvStack.slice(0);
			if( stackString && stackString.length > 0 ){
				var stackTmp = $.parseJSON(stackString);
				var currentStackLvl = parentLevel;
				
				var pageIDTmp = "page-contact_sub"+currentStackLvl;
				showSubContactPage( pageIDTmp, stackTmp[stackTmp.length-1], JSON.stringify(currentStack) );

				// for( var i=1; i<stackTmp.length-1; i++ ){
				// 	var pageIDTmp = "page-contact_sub"+currentStackLvl;
				// 	showSubContactPage( pageIDTmp, stackTmp[i], JSON.stringify(currentStack), false );
				// 	if( bl.hasOwnProperty(stackTmp[i]) ){
				// 		currentStack.push( bl[stackTmp[i]].bn );
				// 	} else currentStack.push( stackTmp[i] );
				// 	currentStackLvl++;
				// }
				// var pageIDTmp = "page-contact_sub"+currentStackLvl;
				// showSubContactPage( pageIDTmp, stackTmp[i], JSON.stringify(currentStack) );
			}
			//避免回來時看到開著的列表, 把列表卷上去
			// subbranchList.slideUp();
			subbranchList.css("display","none");
			title.find(".arrow").removeClass("open");
		});
		page.after(subbranchList);
	}
	else {
		var parentRow = subbranchList.find(".row.current");
		parentRow.removeClass("current");
		var current = subbranchList.find(".row."+bi);
		current.addClass("current");
	}

	nameArea.off("click").click( function(){
		//show sub divs
		subbranchList.slideToggle(400, function(){
			var currentRow = $(this).find(".row.current");
			var parent = $(this);
			var offset = currentRow.position().top;
			cns.debug( currentRow.position().top, parent.scrollTop() );
			if( offset>parent.height() || offset<0 ){
				parent.scrollTop( parent.scrollTop()+currentRow.position().top );
			}
		});
		title.find(".arrow").toggleClass("open");

	});

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
	var subGridPageContent = $("<div class='contact-mems'></div>");
	var subRowPageContent = $("<div class='contact-memLists'></div>");
	subTitle.append( '<div class="count">'+0+'</div>');
	subTitle.append( '<div class="text">'+$.i18n.getString("COMPOSE_N_MEMBERS", "")+'</div>');
	subPageBottom.append(subTitle);
	subPageBottom.append(subGridPageContent);
	subPageBottom.append(subRowPageContent);
	
	//mem
	var memObject = {};
	var count = 0;
	$.each(guAllExsit,function(key,mem){
		for(i=0;i<mem.bl.split(",").length;i++){
			[mem.bl.split(",")[i].split(".").last()]
			if( mem.bl.split(",")[i].split(".").last() == bi ){
				count++;
				memObject[key] = mem;
			}
		}
	});
	var memContainer = generateMemberGrid(Object.keys(memObject), page);
	var memListContainer = generateMemberList(Object.keys(memObject), page);
	subGridPageContent.html(memContainer);
	subRowPageContent.html(memListContainer);

	title.find(".btn").off("click").click( function(){
		switchListAndGrid( $(this), subPageBottom, Object.keys(memObject) );
	});

	if( isList ){
		title.find(".btn").addClass("list");
		subGridPageContent.css("display","none");
		setOnMemListScroll(Object.keys(memObject), page.find(".contact-scroll"));
	} else {
		subRowPageContent.css("display","none");
		setOnMemGridScroll(Object.keys(memObject), page.find(".contact-scroll"));
	}

	if( 0==count ){
		subTitle.hide();
		subRowPageContent.append("<div class='noMem'>"+$.i18n.getString("MEMBER_X_GROUP_NO_MEMBER", data.bn)+"</div>");
		subGridPageContent.append("<div class='noMem'>"+$.i18n.getString("MEMBER_X_GROUP_NO_MEMBER", data.bn)+"</div>");
	} else {
		subTitle.find(".count").html(count);
	}

	//sub-branches
	if( childList.length>0 ){
		var subTitle = $("<div class='contact-rows-title'></div>");
		// subTitle.append( '<div class="count">'+childList.length+'</div>');
		subTitle.append( '<div class="text">'+$.i18n.getString("COMPOSE_N_SUBGROUP", "<b class='count'>"+childList.length+"</b>")+'</div>');
		subPageBottom.append( subTitle );

		var branch = generateBranchList(childList);
		subPageBottom.append(branch);
		subPageBottom.find(".row.branch").off("click").click( function(){
			showSubContactPage( pageID, $(this).data("bi"), JSON.stringify(lvStack) );
		});
	}

	$("#"+pageID +" .contact-branchList").height( $(window).height()-110 );
	$("#"+pageID +" .contact-scroll").height( $(window).height()-112 );
	
	//第一頁滑進來, 其餘用fade
	if( "page-group-main"== parentPageID ){
		$.mobile.changePage("#"+pageID, { transition: "slide", reverse: false} );
	} else {
		$.mobile.changePage("#"+pageID);
	}
}

showSubbranchListBox = function( dom, startLvl, bi, stackString ){
	if( !bi || !dom || dom.length<0 ) return;
	var stack = $.parseJSON(stackString);
	stack.push(bi);
	stackString = JSON.stringify(stack);
	var data = bl[bi];
	var tmp = $("<div class='row list _"+(data.lv-startLvl+1)+" "+bi+"'><div class='left'></div><div class='right'>"+data.lv+"</div></div>");
	var left = tmp.find(".left");
	left.append("<div class='name'>"+data.bn+"</div>");
	// left.append("<div class='name'>拉拉拉拉拉拉拉拉拉拉拉拉+</div>");
	left.append("<div class='detail'>"+$.i18n.getString("COMPOSE_N_MEMBERS", data.cnt)+"</div>");
	tmp.data("stack", stackString);
	tmp.data("bi", bi);
	tmp.css("padding-left",((Math.min(11,data.lv-startLvl)+1)*20)+"px");
	if( startLvl== data.lv ) dom.append(tmp);
	else dom.after(tmp);

	if( data.cl.length>0 ){
		for( var i=0;i<data.cl.length;i++ ){
			showSubbranchListBox(tmp, startLvl, data.cl[i], stackString );
		}
	}
}

//顯示所有成員page
showAllMemberPage = function(gn) {
	var pageID = "page-contact_all";
	var page = $( "#"+pageID );

	if( !page || page.length==0 ){
		page = $('<div data-role="page" id="'+pageID+'" class="contact-subpages">'
            +'<div data-theme="c" data-role="header" data-position="fixed" data-tap-toggle="false">'
                +'<div class="page-back " customize><img src="images/navi/navi_icon_back.png"/></div>'
                +'<h3 class="page-title">成員列表</h3>'
            +'</div><div class="subpage-contact"></div></div>');
		$("#page-group-main").after(page);
	} else if( gi==page.data("gi") ){
		$.mobile.changePage("#"+pageID, { transition: "slide"});
		return;
	}
	page.data("gi", gi);

	page.find(".page-title").html( $.i18n.getString("MEMBER_ALL") );
	page.find(".page-back").off("click").click( showMainContact );
	
	var subPage = page.find(".subpage-contact");
	subPage.html("");

	//title
	var title = $("<div class='contact-titleBar'></div>");
	var nameArea = $("<div class='nameArea'></div>");
	nameArea.append("<div class='name'>"+$.i18n.getString("MEMBER_ALL")+"</div>");
	// nameArea.append("<div class='arrow'></div>");
	title.append(nameArea);
	title.append("<div class='btn'></div>");
	subPage.append(title);

	var subPageBottom = $('<div class="contact-scroll"></div>');
	subPage.append(subPageBottom);

	// nameArea.off("click").click( function(){
	// 	//show sub divs
	// 	subbranchList.slideToggle();
	// 	title.find(".arrow").toggleClass("open");
	// });
	title.find(".btn").off("click").click( function(){
		switchListAndGrid( $(this), subPageBottom, sortedMemIdList);
	});

	//mem-title
	var subTitle = $("<div class='contact-mems-title'></div>");
	var subGridPageContent = $("<div class='contact-mems'></div>");
	var subRowPageContent = $("<div class='contact-memLists'></div>");
	subTitle.append( '<div class="count">'+0+'</div>');
	subTitle.append( '<div class="text">'+$.i18n.getString("COMPOSE_N_MEMBERS", "")+'</div>');
	subPageBottom.append(subTitle);
	subPageBottom.append(subGridPageContent);
	subPageBottom.append(subRowPageContent);
	//mem
	var count = Object.keys(guAllExsit).length;
	var memContainer = generateMemberGrid(sortedMemIdList);
	var memListContainer = generateMemberList(sortedMemIdList);
	subGridPageContent.html(memContainer);
	subRowPageContent.html(memListContainer);

	if( isList ){
		title.find(".btn").addClass("list");
		subGridPageContent.css("display","none");
		setOnMemListScroll(sortedMemIdList);
	} else {
		subRowPageContent.css("display","none");
		setOnMemGridScroll(sortedMemIdList);
	}

	if( 0==count ){
		subTitle.hide();
		subGridPageContent.append("<div class='noMem'>"+$.i18n.getString("MEMBER_X_GROUP_NO_MEMBER", gn)+"</div>");
		subRowPageContent.append("<div class='noMem'>"+$.i18n.getString("MEMBER_X_GROUP_NO_MEMBER", gn)+"</div>");
	} else {
		subTitle.find(".count").html(count);
	}

	$("#"+pageID +" .contact-scroll").height( $(window).height()-112 );
	$.mobile.changePage("#"+pageID, { transition: "slide"});
}

sortMembers = function (memberIdList) {
	var newMemberArr = [],
		adminMemberArr = [],
		normalMemberListArr = [];

	// 先名字排列，再依據新成員>管理者>一般成員來排列
	memberIdList.forEach( function(memId){
		if (isNewMem(guAllExsit[memId])) newMemberArr.push(memId);
		else if (guAllExsit[memId].ad == 1) adminMemberArr.push(memId);
		else normalMemberListArr.push(memId);
	});

	return newMemberArr.concat(adminMemberArr, normalMemberListArr);
}

switchListAndGrid = function( dom, subPageBottom, memberKeyList){
	console.log(subPageBottom);
	isList = !isList;
	var userData = QmiGlobal.groups;
	userData.isMemberShowList = isList;
	// *--* $.lStorage(ui,userData);

	var mem = subPageBottom.find(".contact-mems");
	var memList = subPageBottom.find(".contact-memLists");
	if( isList ){
		mem.fadeOut('fast', function(){
			memList.show(0);
		});
		dom.addClass("list");
		setOnMemListScroll(memberKeyList, subPageBottom);
		updateNewMemTag( memList );
	} else {
		memList.fadeOut('fast', function(){
			mem.show(0);
		});
		dom.removeClass("list");
		setOnMemGridScroll(memberKeyList, subPageBottom);
		updateNewMemTag( mem );
	}
}

generateMemberGrid = function( memberKeyList, memContainer ){
	var memContainer = memContainer || $("#page-contact_all");
	var memObject = guAllExsit;
	var memberListHtml = "";
	var memberIndex = memContainer.find(".contact-mems").data("memberIndex") || 0,
		endMemberIndex = memberIndex + 500;

	try{
		if (endMemberIndex > memberKeyList.length - 1) {
			var loadMemberList = memberKeyList.slice(memberIndex);
			endMemberIndex = memberKeyList.length;
		} else {
			var loadMemberList = memberKeyList.slice(memberIndex, endMemberIndex);
		}
		memberListHtml = loadMemberList.reduce(function(memberHtml, memberId) {
			var memberData = memObject[memberId];
			var imgUrl = ( memberData.aut && memberData.aut.length>0 ) ? memberData.aut : "images/common/others/empty_img_personal_l.png";

			var memberElementStr = "<div class='mem namecard " + ((memberData.ad == 1) ? "admin " : " ") 
				+ ((isNewMem(memberData)) ? "new-mem" : "") + "' data-gu='" + memberData.gu + "'>"
				+ "<img data-url='" + imgUrl + "' src='" + imgUrl + "'>"
				+ "<div class='name'>" + memberData.nk.replaceOriEmojiCode()+"</div>"
				+ "</div>";

			return memberHtml + memberElementStr;	
		}, "");

		memContainer.find(".contact-mems").data("memberIndex", endMemberIndex);

		// var tmp = memContainer.find(".img.waitLoad:lt(108)");
		// $.each(tmp, function(index,domTmp){
		// 	var dom = $(domTmp);
		// 	// dom.css("background-image","url("+dom.attr("data-url")+")").removeClass("waitLoad").removeAttr("data-url");
		// });
		// g_contactWaitLoadImgs = memContainer.find(".img.waitLoad");
	} catch(e){
		errorReport(e);
	}

	return memberListHtml;
}

generateMemberList = function( memberKeyList, memContainer, favCallback ){
	memContainer = memContainer || $("#page-contact_all");
	var memObject = guAllExsit;
	var memberListHtml = "";
	var memberIndex = memContainer.find('.contact-memLists').data("memberIndex") || 0,
		endMemberIndex = memberIndex + 500;
	var count = 0;
	try{
		if (endMemberIndex > memberKeyList.length - 1) {
			var loadMemberList = memberKeyList.slice(memberIndex);
			endMemberIndex = memberKeyList.length;
		} else {
			var loadMemberList = memberKeyList.slice(memberIndex, endMemberIndex);
		}

		memberListHtml = loadMemberList.reduce(function(memberHtml, memberId) {
			var memberData = memObject[memberId];
			var imgUrl = ( memberData.aut && memberData.aut.length>0 ) ? memberData.aut : "images/common/others/empty_img_personal_l.png";

			var memberElementStr = "<div class='row mem namecard " + ((memberData.ad == 1) ? "admin " : " ")
			 	+ ((isNewMem(memberData)) ? "new-mem" : "") + "' data-gu='" + memberData.gu 
			 	+ "' ><div class='left'><img data-url='" + imgUrl + "' src='" + imgUrl 
			 	+ "' /></div><div class='mid'><div class='name'>" + memberData.nk.replaceOriEmojiCode() 
			 	+ "</div><div class='detail'>" + ((memberData.bl == "") ? "" : bl[memberData.bl.split(",")[0].split(".")[0]].bn)
				+ "</div><div class='detail " + ((memberData.bl == "") ? "twoLine" : "") +"'>" 
				+ ((memberData.sl == "") ? memberData.sl : "") + "</div></div><div class='right'>&nbsp</div></div>";

			return memberHtml + memberElementStr;	
		}, "");

		memContainer.find('.contact-memLists').data("memberIndex", endMemberIndex);

	} catch(e){
		errorReport(e);
	}

	return memberListHtml;
}
isNewMem = function(mem){
	return g_newMemList.hasOwnProperty(mem.gu);
}
setNewMemTag = function( tmp ){
	tmp.find(".new").show();
}
updateNewMemTag = function( dom ){
	var memDoms = dom.find(".mem.namecard");
	$.each( memDoms, function(index, domTmp ){
		var dom = $(domTmp);
		var gu = dom.data("gu");
		var newTag = dom.find(".new");
		if( newTag.css("display")=="block" ){
			if( false == g_newMemList.hasOwnProperty(gu) ){
				newTag.hide().unbind("click");
			}
		}
	});
}

setOnMemGridScroll = function (memberKeyList, memContainer){
	var memContainer = memContainer || $("#page-contact_all .contact-scroll");
	console.log(memContainer);
	// g_contactWaitLoadImgs = memContainer.find(".contact-mems .img.waitLoad");
	memContainer.unbind("scroll").scroll(function() {
		console.log("grid");
		var memberIndex = memContainer.find(".contact-mems").data("memberIndex");
		if ($(this).scrollTop() + $(this).height() > $(this)[0].scrollHeight - 200) {
			if (memberIndex <= memberKeyList.length - 1) {
				memContainer.find(".contact-mems").append(generateMemberGrid(memberKeyList, memContainer));
			}
		}
		// $("#page-contact_all").find(".contact-scroll").append(generateMemberGrid(guAllExsit));
		// cns.debug();
		// cns.debug($(this).scrollTop(), $(this).attr("data-url"));
		// for( var i=g_contactWaitLoadImgs.length-1; i>=0; i-- ){
		// 	var tmpDom = $(g_contactWaitLoadImgs[i]);
		// 	// tmpDom.html( tmpDom.offset().top );
		// 	if( tmpDom.offset().top <height ){
		// 		tmpDom.css("background-image","url("+tmpDom.attr("data-url")+")");
		// 		tmpDom.removeAttr("data-url").removeClass("waitLoad");
		// 		g_contactWaitLoadImgs.splice(i,1);
		// 	}
		// }
	});
}
setOnMemListScroll = function(memberKeyList, memContainer) {
	memContainer = memContainer || $("#page-contact_all .contact-scroll");
	console.log(memContainer);
	// var memContainer = $("#page-contact_all .contact-scroll, .subpage-contact .contact-searchResult");
	// g_contactWaitLoadImgs = memContainer.find(".contact-memLists .img.waitLoad");

	memContainer.unbind("scroll").scroll(function() {
		var memberIndex = memContainer.find(".contact-memLists").data("memberIndex");
		if ($(this).scrollTop() + $(this).height() > $(this)[0].scrollHeight - 200) {
			if (memberIndex <= memberKeyList.length - 1) {
				memContainer.find(".contact-memLists").append(generateMemberList(memberKeyList, memContainer));
			}
		}
		// if( null==g_contactWaitLoadImgs) return;
		// var height = $(this).height()+99;
	});
}

generateBranchList = function( childList ){
	var branch = $("<div class='contact-rows'></div>");
	for(var i=0; i<childList.length; i++ ){
		var key = childList[i];
		var childData = bl[key];
		if( childData ){
			var tmp = $("<div class='row branch'><div class='left'></div><div class='right'></div></div>");
			var left = tmp.find(".left");
			left.append("<div class='name'>"+childData.bn+"</div>");
			left.append("<div class='detail'>"+$.i18n.getString("COMPOSE_N_MEMBERS", childData.cnt)+"</div>");
			if( childData.cl.length>0 ) left.append("<div class='detail'>"+$.i18n.getString("COMPOSE_N_SUBGROUP", childData.cl.length)+"</div>");
			
			tmp.find(".right").append("<img src='images/icon/icon_arrow_right.png'/>");
			tmp.data("bi", key );
			
			branch.append(tmp);
		}
	}
	return branch;
}

showMainContact = function(){
	// $("#page-group-main .contact-rows").height( $(window).height()-63 );
	$.mobile.changePage("#page-group-main", { transition: "slide", reverse: true});
}

initContactData = function(){
	//get user data
	if( typeof(ui)=='undefined' ) return;
	var userData = QmiGlobal.groups;
	if( !userData )	return;
	isList = (userData.isMemberShowList)?userData.isMemberShowList:false;

	//get group data
	if( typeof(gi)=='undefined' ) return;
	g_group = userData[gi];
	if( !g_group ) return;

	//get branch data
	bl = g_group.bl;
	if( !bl ) return;

	fbl = g_group.fbl;

	//get mem data
	guAll = g_group.guAll;
	if( !guAll ) return;
	inviteGuAll = g_group.inviteGuAll;

	guAllExsit = {};
	$.each( guAll, function(key,obj){
		if( obj && obj.st==1 ){
			guAllExsit[key] = obj;
		// }else {
		// 	window.testMem = window.testMem || {}
		// 	window.testMem[obj.nk] = obj;
		}
	});
	// // *--* $.lStorage(ui, userData);

	//get new mem data
	var currentTime = new Date().getTime();
    var tmpMemList = $.lStorage("_newMemList");
    if( tmpMemList && tmpMemList.hasOwnProperty(gi) ){
        g_newMemList = tmpMemList[gi];
        $.each(g_newMemList, function(key,time){
        	if( time<=currentTime ){
        		delete g_newMemList[key];
        	}
        });
        $.lStorage("_newMemList",tmpMemList);
    } else {
    	g_newMemList = {};
    }

	sortedMemIdList = sortMembers(Object.keys(guAllExsit));
}

/*
              ███████╗ █████╗ ██╗   ██╗ ██████╗ ██████╗ ██╗████████╗███████╗          
              ██╔════╝██╔══██╗██║   ██║██╔═══██╗██╔══██╗██║╚══██╔══╝██╔════╝          
    █████╗    █████╗  ███████║██║   ██║██║   ██║██████╔╝██║   ██║   █████╗      █████╗
    ╚════╝    ██╔══╝  ██╔══██║╚██╗ ██╔╝██║   ██║██╔══██╗██║   ██║   ██╔══╝      ╚════╝
              ██║     ██║  ██║ ╚████╔╝ ╚██████╔╝██║  ██║██║   ██║   ███████╗          
              ╚═╝     ╚═╝  ╚═╝  ╚═══╝   ╚═════╝ ╚═╝  ╚═╝╚═╝   ╚═╝   ╚══════╝          

*/

//顯示我的最愛頁面
showFavoritePage = function( isBackward ){
	var pageID = "page-contact_favorite";
	updateFavoritePage();
	$("#"+pageID +" .contact-scroll").height( $(window).height()-112 );
	if( true==isBackward ) $.mobile.changePage("#"+pageID, { transition: "slide", reverse: true} );
	else  $.mobile.changePage("#"+pageID, { transition: "slide"});
}

updateFavoritePage = function(){
	var pageID = "page-contact_favorite";
	var page = $( "#"+pageID );

	guAllExsit = QmiGlobal.groups[gi].guAll;

	if( !page || page.length==0 ){
		page = $('<div data-role="page" id="'+pageID+'" class="contact-subpages">'
            +'<div data-theme="c" data-role="header" data-position="fixed" data-tap-toggle="false">'
                +'<div class="page-back " customize><img src="images/navi/navi_icon_back.png"/></div>'
                +'<h3 class="page-title">成員列表</h3>'
            +'</div><div class="subpage-contact"></div></div>');
		$("#page-group-main").after(page);
	}
	// else if( gi==page.data("gi") ){
	// 	$.mobile.changePage("#"+pageID);
	// 	return;
	// }
	// page.data("gi", gi);

	page.find(".page-title").html( $.i18n.getString("COMMON_FAVORIATE") );
	page.find(".page-back").off("click").click( showMainContact );
	
	var subPage = page.find(".subpage-contact");
	subPage.html("");

	//----- title -----
	var title = $("<div class='contact-titleBar'></div>");
	var nameArea = $("<div class='nameArea'></div>");
	nameArea.append("<div class='name'>"+$.i18n.getString("COMMON_FAVORIATE")+"</div>");
	// nameArea.append("<div class='arrow'></div>");
	title.append(nameArea);
	title.append("<div class='btnExtra'></div>");
	title.append("<div class='btn'></div>");
	subPage.append(title);

	//---- extra ------
	var extra = $("<div class='contact-extra'></div>");
	subPage.append(extra);
	extra.css("display","none");
	//btn
	//content
	var extraContent = $("<div class='content'></div>");
	extraContent.append("<div class='btn editFavMembers' align='center'>" 
		+ "<div class='img'></div><div class='text'>" 
		+ $.i18n.getString("MEMBER_FAVORITE_EDIT_BRANCH") + "</div></div>"
		+ "<div class='btn addGroup' align='center'>" 
		+ "<div class='img'></div><div class='text'>" 
		+ $.i18n.getString("MEMBER_CREATE_CUSTOMIZE_GROUP") + "</div></div>");
	extra.append( extraContent );

	extra.off("click").click( function(){
		extra.fadeToggle('fast');
	});
	extraContent.off("click").click( function(e){
    	e.stopPropagation();
		cns.debug("!");
	});
	extraContent.find(".btn.addGroup").off("click").click( function(e) {
    	e.stopPropagation();
		showFavGroupBox(subPage, {
			title: $.i18n.getString("MEMBER_CREATE_CUSTOMIZE_GROUP"),
			placeholder: $.i18n.getString("MEMBER_CUSTOMIZE_GROUP_NAME"),
			inputText: "",
			cancelText: $.i18n.getString("COMMON_CANCEL"), 
			confirmText: $.i18n.getString("MEMBER_CREATE"),
			cancelCallback: function (container, input) {
				container.fadeOut();
				input.val("");
			},
			confirmCallback: addFavGroup
		});
	});

	extraContent.find(".btn.editFavMembers").off("click").click( function(e){
    	e.stopPropagation();
    	showEditFavListPage($(this));

    	extra.fadeToggle('fast');
		// showAddFavGroupBox( subPage );
	});

	//---- part below title bar -----
	var subPageBottom = $('<div class="contact-scroll"></div>');
	subPage.append(subPageBottom);

	// nameArea.off("click").click( function(){
	// 	//show sub divs
	// 	subbranchList.slideToggle();
	// 	title.find(".arrow").toggleClass("open");
	// });
	title.find(".btn").off("click").click( function(){
		switchListAndGrid( $(this), subPageBottom );
	});
	title.find(".btnExtra").off("click").click( function(){
		extra.fadeToggle('fast');
	});

	//mem-title
	var subTitle = $("<div class='contact-mems-title'></div>");
	var subGridPageContent = $("<div class='contact-mems'></div>");
	var subRowPageContent = $("<div class='contact-memLists'></div>");
	subTitle.append( '<div class="count">'+0+'</div>');
	subTitle.append( '<div class="text">'+$.i18n.getString("COMPOSE_N_MEMBERS", "")+'</div>');
	subPageBottom.append(subTitle);
	subPageBottom.append(subGridPageContent);
	subPageBottom.append(subRowPageContent);
	
	//mem
	var memObject = {};
	var count = 0;
	$.each(guAllExsit,function(key,mem){
		if( mem.fav ){
			count++;
			memObject[key] = mem;
		}
	});
	var memContainer = generateMemberGrid(Object.keys(memObject), page);
	var memListContainer = generateMemberList(Object.keys(memObject), page, showFavoritePage);
	subGridPageContent.html(memContainer);
	subRowPageContent.html(memListContainer);

	if( isList ){
		title.find(".btn").addClass("list");
		subGridPageContent.css("display","none");
		setOnMemListScroll();
	} else {
		subRowPageContent.css("display","none");
		setOnMemGridScroll();
	}

	if( 0==count ){
		subTitle.hide();
		subGridPageContent.append("<div class='noMem'>"+$.i18n.getString("MEMBER_X_GROUP_NO_MEMBER", $.i18n.getString("COMMON_FAVORIATE"))+"</div>");
		subRowPageContent.append("<div class='noMem'>"+$.i18n.getString("MEMBER_X_GROUP_NO_MEMBER", $.i18n.getString("COMMON_FAVORIATE"))+"</div>");
	} else {
		subTitle.find(".count").html(count);
	}
	
	//sub-branches
	if( fbl ){
		var length = Object.keys(fbl).length;
		if( length>0 ){
			var subTitle = $("<div class='contact-rows-title'></div>");
			subTitle.append( '<div class="count">'+length+'</div>');
			subTitle.append( '<div class="text">'+$.i18n.getString("COMPOSE_N_SUBGROUP", "")+'</div>');
			subPageBottom.append( subTitle );

			var branch = generateFavBranchList( fbl );
			subPageBottom.append(branch);
		}
	}
}

//顯示單一自定群組內容
showSubFavoritePage = function( fi ){
	var data = fbl[fi];
	var parentPageID = "page-contact_favorite";
	var pageID = "page-contact_sub_favorite";
	var page = $( "#"+pageID );
	if( !page || page.length==0 ){
		page = $('<div data-role="page" id="'+pageID+'" class="subPage contact-subpages">'
            +'<div data-theme="c" data-role="header" data-position="fixed" data-tap-toggle="false">'
                +'<div class="page-back " customize><img src="images/common/icon/bt_close_activity.png"/></div>'
                +'<h3 class="page-title">成員列表</h3>'
            +'</div><div class="subpage-contact"></div></div>');
		$("#"+parentPageID).after(page);
	}

	page.find(".page-title").html( data.fn );
	page.find(".page-back").off("click").click( function(){
		showFavoritePage(true);
	});
	
	var subPage = page.find(".subpage-contact");
	subPage.html("");

	//title
	var title = $("<div class='contact-titleBar'></div>");
	var nameArea = $("<div class='nameArea'></div>");
	nameArea.append("<div class='name'>"+data.fn+"</div>");
	// nameArea.append("<div class='arrow'></div>");
	title.append(nameArea);
	title.append("<div class='btnExtra'></div>");
	title.append("<div class='btn'></div>");
	subPage.append(title);

	//---- extra ------
	var extra = $("<div class='contact-extra'></div>");
	subPage.append(extra);
	extra.css("display","none");
	//btn
	//content
	var extraContent = $("<div class='content'></div>");
	extraContent.append("<div class='btn editGroup' align='center'><div class='img'></div><div class='text'>"+$.i18n.getString("MEMBER_EDIT_CUSTOMIZE_GROUP_NAME")+"</div></div>");
	extraContent.append("<div class='btn editMem' align='center'><div class='img'></div><div class='text'>"+$.i18n.getString("MEMBER_EDIT_CUSTOMIZE_GROUP_MEMBER")+"</div></div>");
	extraContent.append("<div class='btn delete' align='center'><div class='img'></div><div class='text'>"+$.i18n.getString("MEMBER_DELETE_CUSTOMIZE_GROUP")+"</div></div>");
	extra.append( extraContent );

	var subPageBottom = $('<div class="contact-scroll"></div>');
	subPage.append(subPageBottom);

	//mem-title
	var subTitle = $("<div class='contact-mems-title'></div>");
	var subGridPageContent = $("<div class='contact-mems'></div>");
	var subRowPageContent = $("<div class='contact-memLists'></div>");
	subTitle.append( '<div class="count">'+0+'</div>');
	subTitle.append( '<div class="text">'+$.i18n.getString("COMPOSE_N_MEMBERS", "")+'</div>');
	subPageBottom.append(subTitle);
	subPageBottom.append(subGridPageContent);
	subPageBottom.append(subRowPageContent);
	
	//mem
	var memObject = {};
	var currentFavData = {};
	var count = 0;
	$.each(guAllExsit,function(key,mem){
		if( mem.fbl && mem.fbl.length>0 ){
			for(var i=0;i<mem.fbl.length;i++){
				if( mem.fbl[i]==fi ){
					memObject[key] = mem;
					currentFavData[key] = mem.nk;
					count++;
					break;
				}
			}
		}
	});
    var memContainer = generateMemberGrid(Object.keys(memObject), page);
	var memListContainer = generateMemberList(Object.keys(memObject), page);
	subGridPageContent.html(memContainer);
	subRowPageContent.html(memListContainer);

	title.find(".btn").off("click").click( function(){
		switchListAndGrid( $(this), subPageBottom, Object.keys(memObject));
	});

	if( isList ){
		title.find(".btn").addClass("list");
		subGridPageContent.css("display","none");
		setOnMemListScroll(Object.keys(memObject), page.find(".contact-scroll"));
	} else {
		subRowPageContent.css("display","none");
		setOnMemGridScroll(Object.keys(memObject), page.find(".contact-scroll"));
	}

	if( 0==count ){
		subTitle.hide();
		memListContainer.append("<div class='noMem'>"+$.i18n.getString("MEMBER_X_GROUP_NO_MEMBER", data.fn)+"</div>");
		memContainer.append("<div class='noMem'>"+$.i18n.getString("MEMBER_X_GROUP_NO_MEMBER", data.fn)+"</div>");
	} else {
		subTitle.find(".count").html(count);
	}


	extra.off("click").click( function(){
		extra.fadeToggle('fast');
	});
	extraContent.off("click").click( function(e){
    	e.stopPropagation();
		cns.debug("!");
	});
	extraContent.find(".btn.editGroup").off("click").click( function(e){
    	e.stopPropagation();
    	// extra.fadeToggle('fast');

    	showFavGroupBox(subPage, {
			title: $.i18n.getString("MEMBER_EDIT_CUSTOMIZE_GROUP_NAME"),
			placeholder: $.i18n.getString("MEMBER_CUSTOMIZE_GROUP_NAME"),
			inputText: data.fn,
			cancelText: $.i18n.getString("COMMON_CANCEL"), 
			confirmText: $.i18n.getString("COMMON_OK"),
			cancelCallback: function(container, input) {
				container.fadeOut();
				input.val("");
			},
			confirmCallback: function(container, input) {
				updateSubFavoriteGroup({fn:input.val(), al:[], dl:[]}, container, fi);
			}
		});
	});
	extraContent.find(".btn.editMem").off("click").click( function(e){
		$(this).data("fi", fi);
		$(this).data("object_str", JSON.stringify(currentFavData) );
    	e.stopPropagation();
		showEditFavGroupBox( $(this) );
	});
	extraContent.find(".btn.delete").off("click").click( function(e){
		$(this).data("fi", fi);
    	e.stopPropagation();
		popupShowAdjust($.i18n.getString("MEMBER_DELETE_CUSTOMIZE_GROUP"),
			$.i18n.getString("MEMBER_DELETE_CUSTOMIZE_GROUP_CONFIRM", data.fn),
			$.i18n.getString("COMMON_OK"),$.i18n.getString("COMMON_CANCEL"),
			[deleteFavGroup,$(this)]
		);
	});
	title.find(".btnExtra").off("click").click( function(){
		extra.fadeToggle('fast');
	});


	//滑進來
	$("#"+pageID +" .contact-scroll").height( $(window).height()-112 );
	$.mobile.changePage("#"+pageID, { transition: "slide", reverse: false} );
}

//產生自定群組列表
generateFavBranchList = function( childList ){
	var branch = $("<div class='contact-rows'></div>");
	for( var key in childList ){
		// var key = childList[i];
		var data = childList[key];
		if( data ){
			var tmp = $("<div class='row fav'><div class='left'></div><div class='right'></div></div>");
			var left = tmp.find(".left");
			left.append("<div class='name'>"+data.fn+"</div>");
			left.append("<div class='detail'>"+$.i18n.getString("COMPOSE_N_MEMBERS", data.cnt)+"</div>");
			// if( childData.cl.length>0 ) left.append("<div class='detail'>"+$.i18n.getString("COMPOSE_N_SUBGROUP", childData.cl.length)+"</div>");
			
			tmp.find(".right").append("<img src='images/icon/icon_arrow_right.png'/>");
			tmp.data("fi", key );
			
			branch.append(tmp);
		}
	}
	branch.find(".row.fav").off("click").click( function(){
		showSubFavoritePage( $(this).data("fi") );
	});
	return branch;
}

//顯示自定群組或編輯群組名稱對話框
showFavGroupBox = function( subPage, boxOption ){
	var container = subPage.find(".contact-createSubgroup");
	if( container.length==0 ){
		container = generateInputBox(subPage, 
			boxOption.title,
			boxOption.placeholder,
			boxOption.inputText,
			boxOption.cancelText,
			boxOption.confirmText,
			boxOption.cancelCallback,
			boxOption.confirmCallback
		);
		// var create = container.find(".create");
		// create.data("object_str","");
	}
	

	var extra = subPage.find(".contact-extra");
	extra.fadeToggle('fast');

	container.fadeToggle();
	container.find("input").focus();
}

showEditFavListPage = function( dom ) {
	var favoriteList = {};
	var thisGroup = QmiGlobal.groups[gi];	
		newGroupMembers = $.extend(true, {}, guAllExsit);

	var favBlock = $(".subpage-contact .row.favorite");

	var option = {
		isShowBranch: false,
		isShowAll: false,
		isShowFav: false,
	};

	for (var gu in guAllExsit) {
  		if (guAllExsit[gu].fav) favoriteList[gu] = guAllExsit[gu].nk;
	}

	dom.data("object_str", JSON.stringify(favoriteList));

	composeObjectShowDelegate(dom, dom, option, function() {
		var newFavoriteList = $.parseJSON(dom.data("object_str"));
		var addFavList = [], deleteFavList = [];

		// 新增哪些我的最愛成員
		for (var gu in newFavoriteList) {
			if (!favoriteList.hasOwnProperty(gu)) {
				addFavList.push(gu);
				newGroupMembers[gu].fav = true;
			}
		}

		// 移除哪些我的最愛成員
		for (var gu in favoriteList) {
			if (!newFavoriteList.hasOwnProperty(gu)) {
				deleteFavList.push(gu);
				newGroupMembers[gu].fav = false;
			}
		}

		if(addFavList.length > 0 || deleteFavList.length > 0 ) {
			updateUserFavoriteStatusApi(gi, addFavList, deleteFavList).done(function (data) {
				var rspObj = $.parseJSON(data.responseText);
				var favCntDiv = favBlock.find(".detail:eq(0)");

				// 不打成員分頁api，大團體很花時間
				// 更新我的最愛api送成功才更新guAll和畫面
				if (data.status == 200) {
					thisGroup.favCnt = Object.keys(newFavoriteList).length;
					thisGroup.guAll = newGroupMembers;
					favCntDiv.text($.i18n.getString("COMPOSE_N_MEMBERS", thisGroup.favCnt));
					showFavoritePage();
				}

				toastShow(rspObj.rsp_msg);
			});
		}
		
	});
}

showEditFavGroupBox = function( dom ) {
	var oriData = dom.data("object_str");
	oriData = $.parseJSON(oriData);
	var option = {
		isShowBranch:false,
		isShowAll:false,
		isShowFav:true,
		isShowSelf:true
	};
	composeObjectShowDelegate( dom, dom, option, function(){
		var obj = dom.data("object_str");
		var memObject = $.parseJSON(obj);
		var memKeys = Object.keys(memObject);
		var fi = dom.data("fi");
		cns.debug( obj );
		// cns.debug( create.data("branch_str") );

		//若沒有人就砍了吧
		if( memKeys.length==0 ){
			// delete fi
			popupShowAdjust($.i18n.getString("MEMBER_DELETE_CUSTOMIZE_GROUP"),
				$.i18n.getString("MEMBER_CUSTOMIZE_GROUP_NO_MEMBER"),
				$.i18n.getString("COMMON_OK"),$.i18n.getString("COMMON_CANCEL"),
				[deleteFavGroup,dom]
			);
		} else {
			// edit mem
			// var api_name = "groups/" + gi + "/favorites/" + fi;
			// var headers = {
			// 	"ui":ui,
			// 	"at":at, 
			// 	"li":lang
			// };
			var updateList = {
			  "al": [], // add list
			  "dl": []	// del list
			};

			// //check dl
			for( var key in oriData ){
				if( null==memObject[key] ){
					updateList.dl.push(key);
				}
			}
			//check al
			for( var key in memObject ){
				if( null==oriData[key] ){
					updateList.al.push(key);
				}
			}

			updateSubFavoriteGroup(updateList, dom, fi);

			// //沒有變化
			// if( body.al.length==0 && body.dl.length==0 ) return;

			// ajaxDo(api_name,headers,"put",true,body).complete(function(data){
			// 	if(data.status == 200){
			// 		var userData = QmiGlobal.groups;
			// 		g_group = userData[gi];

			// 		//add fi to mem data
			// 		guAll = g_group.guAll;
			// 		for(var i=0; i<body.al.length; i++){
			// 			var key = body.al[i];
			// 			guAll[key].fbl.push(fi);
			// 		}
			// 		//del fi from mem data
			// 		for(var i=0; i<body.dl.length; i++){
			// 			var key = body.dl[i];
			// 			var index = guAll[key].fbl.indexOf(fi);
			// 			if( index>=0 ) delete guAll[key].fbl[index];
			// 		}

			// 		//add fi data to fbl
			// 		fbl = g_group.fbl;
			// 		fbl[fi].cnt = memKeys.length;
			// 		// *--* $.lStorage(ui, userData );

			// 		initContactData();
			// 		dom.parent().fadeOut();
			// 		showSubFavoritePage(fi);

			// 		toastShow( $.i18n.getString("MEMBER_EDIT_CUSTOMIZE_GROUP_MEMBER_SUCC") );
			// 	} else {
			// 		toastShow( $.i18n.getString("MEMBER_EDIT_CUSTOMIZE_GROUP_MEMBER_FAIL") );
			// 	}
			// });
		}
	});
}

generateInputBox = function( subPage, title, placeholder, inputValue, cancel, ok, onCancel, onOk ){
	var container = subPage.find(".contact-createSubgroup");
	if( container.length==0 ){
		subPage.append("<div class='contact-createSubgroup' style='display:none;' data-init='f'>"
            +"<table class='innerContainer'>"
                +"<tr><td class='title'>"+title+"</td></tr>"
                +"<tr><td><input class='input'/></td></tr>"
                +"<tr><td class='cancel'>"+cancel+"</td>"
                    +"<td class='create cp-custom-subgroup'>"+ok+"</td></tr>"
            +"</table></div>");
		container = subPage.find(".contact-createSubgroup");

		//name input
		var input = container.find(".input");
		input.attr({
			placeholder: placeholder,
			value: inputValue
		});
		
		container.off("click").click( function(){
			container.fadeOut();
		});
		container.find("table").off("click").click( function(e){
			e.stopPropagation();
		});

		container.find(".cancel").off("click").click( function(e){
			e.stopPropagation();
			onCancel(container, input );
		});

		var create = container.find(".create");
		create.off("click").click( function(e){
			e.stopPropagation();
			onOk(container, input);
		});
	}
	return container;
}

deleteFavGroup = function( dom ){
	var fi = dom.data("fi");
	var api_name = "groups/" + gi + "/favorites/"+fi;
	var headers = {
		"ui":ui,
		"at":at, 
		"li":lang
	};
	ajaxDo(api_name,headers,"delete",true,null).complete(function(data){
		if(data.status == 200){
			var tmp = $.parseJSON( data.responseText );
			var data = {};
			var userData = QmiGlobal.groups;
			g_group = userData[gi];

			//-----
			// if user data is updated when delete
			// remove this block
			//-----
			//remove fi to mem data
			guAll = g_group.guAll;
			for(var key in guAll){
				for( var fiTmp in guAll[key].fbl ){
					if( fiTmp.indexOf(fi)>=0 ){
						delete guAll[key];
						break;
					}
				}
			}

			//remove fi from fbl
			fbl = g_group.fbl;
			delete fbl[fi];
			// *--* $.lStorage(ui, userData );

			initContactData();
			showFavoritePage( true );
			toastShow( $.i18n.getString("MEMBER_DELETE_CUSTOMIZE_GROUP_SUCC") );
		} else {
			toastShow( $.i18n.getString("MEMBER_DELETE_CUSTOMIZE_GROUP_FAIL") );
		}
	});
}

addFavGroup = function (container, input) {
	var create = container.find(".create");
	var name = input.val();
	if( null==name || name.length==0 ){
		toastShow( $.i18n.getString("MEMBER_ENTER_CUSTOMIZE_GROUP_NAME") );
		return;
	}
	cns.debug( "create", name );
	// container.fadeOut();
	var option = {
		isShowBranch:false,
		isShowAll:false,
		isShowFav:true
	};
	composeObjectShowDelegate( create, create, option, function(){
		var obj = create.data("object_str");
		cns.debug( obj );
		// cns.debug( create.data("branch_str") );

		var api_name = "groups/" + gi + "/favorites";
		var headers = {
			"ui":ui,
			"at":at, 
			"li":lang
		};
		var memObject = $.parseJSON(obj);
		var memKeys = Object.keys(memObject);
		var body = {
		  "fn": name, // Favorite Branch Name
		  "gul": memKeys
		};

		ajaxDo(api_name, headers,"post",true,body).complete(function(data){
			if(data.status == 200){
				var tmp = $.parseJSON( data.responseText );
				cns.debug( data.responseText );
				var data = {};
				var userData = QmiGlobal.groups;
				g_group = userData[gi];

				//add fi to mem data
				guAll = g_group.guAll;
				for(var key in memObject){
					guAll[key].fbl.push(tmp.fi);
				}

				//add fi data to fbl
				fbl = g_group.fbl;
				fbl[tmp.fi] = {cnt:memKeys.length, fn:name};
				data[tmp.fi] = fbl[tmp.fi];
				// *--* $.lStorage(ui, userData );

				var branch = generateFavBranchList( data );
				var rows = $("#page-contact_favorite .contact-rows");
				if( rows.length>0 ){
					branch.find(".row").appendTo( rows );
				} else {
					branch.appendTo("#page-contact_favorite .contact-scroll");
				}
				container.fadeOut();

				initContactData();

				toastShow( $.i18n.getString("MEMBER_CREATE_CUSTOMIZE_SUCC") );
				input.val("");
				create.data("object_str", "");

				//update subpage-contact
				var fav = $(".subpage-contact .row.favorite");
				if( fav.length>0 ){
					var branchCntDiv = fav.find(".detail:eq(1)");
					var branchCount = Object.keys(fbl).length;
					if(branchCount<=0) branchCntDiv.hide();
					else{
						var text = $.i18n.getString("COMPOSE_N_SUBGROUP", branchCount);
						if( branchCntDiv.length>0 ){
							branchCntDiv.text( text );
						}
						else{
							fav.find("left").append("<div class='detail'>"+text+"</div>");
						}
					}
				}
			} else {
				toastShow( $.i18n.getString("MEMBER_CREATE_CUSTOMIZE_FAIL") );
			}
		});
	});
}

/*
               █████╗ ██████╗ ██████╗     ███╗   ███╗███████╗███╗   ███╗          
              ██╔══██╗██╔══██╗██╔══██╗    ████╗ ████║██╔════╝████╗ ████║          
    █████╗    ███████║██║  ██║██║  ██║    ██╔████╔██║█████╗  ██╔████╔██║    █████╗
    ╚════╝    ██╔══██║██║  ██║██║  ██║    ██║╚██╔╝██║██╔══╝  ██║╚██╔╝██║    ╚════╝
              ██║  ██║██████╔╝██████╔╝    ██║ ╚═╝ ██║███████╗██║ ╚═╝ ██║          
              ╚═╝  ╚═╝╚═════╝ ╚═════╝     ╚═╝     ╚═╝╚══════╝╚═╝     ╚═╝          

*/
function showAddMemberPage(){
	$.mobile.changePage("#page-contact-addmem");
	$("#page-contact-addmem .ca-list-area .cal-coachmake").show();
	$("#page-contact-addmem .ca-list-area .cal-div-area").hide();

	initQRCodePage();

	$("#page-contact-addmem .ca-nav-box").off("click").click( function(){
		var this_btn = $(this);
		if( this_btn.hasClass("ca-invite") ){
			$("#page-contact-addmem .ca-invite-area").show();
			$("#page-contact-addmem .ca-list-area").hide();
		} else {
			$("#page-contact-addmem .ca-invite-area").hide();
			$("#page-contact-addmem .ca-list-area").show();
			getInviteList();
		}
		$("#page-contact-addmem .ca-nav-active").removeClass("ca-nav-active");
		this_btn.addClass("ca-nav-active");
	});
	$("#page-contact-addmem .ca-invite").trigger("click");
	$("#page-contact-addmem .ca-invite-submit").off("click").click( sendInvite );

	updateInvitePending();
}

function updateInvitePending () {
	//render invite pending member list
	// updateInvitePending();
	var api_name = "groups/" + gi + "/invitations";
	var headers = {
	         "ui":ui,
	         "at":at, 
	         "li":lang,
	             };
	var method = "get";
	var result = ajaxDo(api_name,headers,method,false);
	result.complete(function(data){
		if(data.status != 200) return false;
		var obj =$.parseJSON(data.responseText);
		if( obj&&obj.hasOwnProperty("il") ) inviteGuAll = obj.il;

		var userData = QmiGlobal.groups;
		if( userData && gi ){
			if( userData.hasOwnProperty(gi) ){
				userData[gi].inviteGuAll = inviteGuAll;
			}
		}
		// *--* $.lStorage(ui, userData);


		var pendingAreaParent = $("#page-contact-addmem .ca-pending-area");
		var pendingArea = pendingAreaParent.children(".list");
		var coachArea = pendingAreaParent.children(".coach");
		//render invite pending member list
		if( inviteGuAll && inviteGuAll.length>0){
			coachArea.hide();
			pendingArea.html("").show();
			var template = $('<div class="row">'
					+'<div class="left"><img class="pend_img" src="images/common/others/empty_img_personal_l.png"/></div>'
					+'<div class="mid"><div class="name"></div><div class="phone"></div></div>'
					+'<div class="right"><img class="resend" src="images/icon/icon_invite_mail.png"/><img class="del" src="images/icon/icon_chatroom_chatlist_del.png"</div>'
				+'</div>');
			for( var i=0;i<inviteGuAll.length;i++){
				var mem = inviteGuAll[i];
				var newRow = template.clone();
				//name
				newRow.find(".name").html( (mem.nk || "" )._escape() );
				//phone
				newRow.find(".phone").text( mem.ik||"" );
				newRow.data("pn",mem.ik).data("nk",mem.nk).data("gi",gi);
				pendingArea.append(newRow);
			}
			pendingArea.find(".resend").click(function(e){
				var row = $(this).parents(".row");
				var this_gi = row.data("gi");
				var phone = row.data("pn");
				var nk = row.data("nk");
				cns.debug("resend", phone, nk );

				if( this_gi && nk && phone ){
					sendInviteAPI( this_gi, [{
						"pn": phone,
						"nk": nk
					}], function(data){
						if( data.status==200 ){
							try{
								var obj = $.parseJSON(data.responseText);
								/* ----- TODO ------
									如果已經邀過了...?
								   ----- TODO ------ */
								//mem already in group
								if( obj.ul[0].aj==true ){
									toastShow( $.i18n.getString("INVITE_ALREADY_IN_GROUP") );
								} else {
									toastShow( $.i18n.getString("INVITE_SUCC") );
								}
								updateInvitePending();

							} catch(e){
								toastShow( $.i18n.getString("INVITE_FAIL") );
								errorReport(e);
							}
						} else {
							toastShow( $.i18n.getString("INVITE_FAIL") );
						}
					});
				} else{
					toastShow( $.i18n.getString("INVITE_FAIL") );
				}
			});
			pendingArea.find(".del").click(function(e){

				var row = $(this).parents(".row");
				var this_gi = row.data("gi");
				var phone = row.data("pn");
				cns.debug("del", this_gi, phone );

				if( this_gi && phone ){
					var succ = false;
					removeInviteAPI( this_gi, [{
						"ik": phone
					}], function(data){
						if( data.status==200 ){
							try{
								var obj = $.parseJSON(data.responseText);

								updateInvitePending();
								
								toastShow( obj.rsp_msg );
								succ = true;
							} catch(e){
								errorReport(e);
							}
						}

						if(!succ){
							toastShow( $.i18n.getString("INVITE_DELETED_FAIL") );
						}
					});
				} else {
					toastShow( $.i18n.getString("INVITE_DELETED_FAIL") );
				}
			});
		} else {
			coachArea.show();
			pendingArea.hide();
		}
	});
}


function getInviteList(){
	var api_name = "groups/" + gi + "/invitations";
	var headers = {
	         "ui":ui,
	         "at":at, 
	         "li":lang,
	             };
	var method = "get";
	var result = ajaxDo(api_name,headers,method,false);
	result.complete(function(data){
		if(data.status != 200) return false;

		var obj =$.parseJSON(data.responseText);
		if( obj.il && obj.il.length<=0 ){
			$("#page-contact-addmem .ca-list-area .cal-coachmake").fadeIn();
			$("#page-contact-addmem .ca-list-area .cal-div-area").fadeOut();

		} else {
			var area = $("#page-contact-addmem .ca-list-area .cal-div-area");
			area.html("");

			for( var i=0; i<obj.il.length; i++){
				var data_info = obj.il[i];
				if( !data_info ) continue;
				// "ik": "+886935398692", or "abc@gmail.com"
			    // "tp": 0, or 1 // Invitation Type 0(Phone)、1(Email)
			    // "nk": "小瓶 "
			    // "auo": "http://s3.url/xxx", // Avatar Original URL
			    // "aut": "http://s3.url/xxx"  // Avatar Thumbnail URL
			    var row = $("<div class='cal-row'></div>");
			    row.append("<div class='photo'><img class='st-user-pic' src='images/common/others/empty_img_personal_l.png'/></div>");
			    row.append("<div class=info><div class='name'></div><div class='tel'></div></div>");
			    row.append("<div class='img'><img src='images/invitemembers/invitemembers_icon_reinvite.png'/></div>");
			    area.append( row );

			    if( data_info.aut ) row.find(".photo img").attr( "src", data_info.aut.replaceOriEmojiCode() );
			    if( data_info.nk ) row.find(".info .name").html( data_info.nk.replaceOriEmojiCode() );
			    if( data_info.ik && data_info.ik.length>0 ){
			    	if( data_info.tp==0 ){
			    		var tmp = data_info.ik.replace( /^(\+.{3})/, "0")
			    		row.find(".info .tel").html( tmp );
			    	} else {
			    		row.find(".info .tel").html( data_info.ik );
			    	}
			    }
			}

			$("#page-contact-addmem .ca-list-area .cal-coachmake").fadeOut();
			area.fadeIn();
		}
	});
}

function sendInvite(){
	var nk = $(".cai-name input").val();
	if( !nk || nk.length==0 ){
		popupShowAdjust("", $.i18n.getString("INVITE_DISPLAY_NAME") );
		return;
	}
	var phone = $(".cai-num input").val();
	if( !phone || phone.length==0 ){
		popupShowAdjust("", $.i18n.getString("INVITE_PHONE_NUMBER") );
		return;
	}
	if( phone.length<10 || phone.indexOf("0")!=0 ){
		popupShowAdjust("", $.i18n.getString("INVITE_PHONE_ERROR") );
		return;
	}
	var area = $(".cai-area .area");
	phone = phone.replace(/^0/, area.html() );
	/* ----- TODO ------
		 國碼/email
		不同國別電話格式檢查
	   ----- TODO ------*/
	sendInviteAPI( gi, [{
			"pn": phone,
			"nk": nk
		}], function(data){
			if( data.status==200 ){
				// "ul":
				// [
				//   {
				//     "gu": "asdfas-awefnasdf", // Group User Id
				//     "ik": "+886912345678",  // Invitation Key
				//     "tp": 0,  // Invitation Type(0: Phone, 1: Email)
				//     "aj": true  // Already Joined Group ?
				//   }
				// ]
				try{
					var obj = $.parseJSON(data.responseText);
					/* ----- TODO ------
						如果已經邀過了...?
					   ----- TODO ------ */
					//mem already in group
					if( obj.ul[0].aj==true ){
						toastShow( $.i18n.getString("INVITE_ALREADY_IN_GROUP") );
					} else {
						toastShow( $.i18n.getString("INVITE_SUCC") );
						$(".cai-name input").val("");
						$(".cai-num input").val("");
					}
					//update inviting list
					if(!inviteGuAll) inviteGuAll = {};
					inviteGuAll[obj.ul[0].gu] = {
						gu: obj.ul[0].gu,
						ik: obj.ul[0].ik,
						tp: obj.ul[0].tp,
						st: 0,
						nk: nk,
						pn: phone
					};
					showMainContact();
					updateInvitePending();

				} catch(e){

				}
			} else {
				toastShow( $.i18n.getString("INVITE_FAIL") );
			}
	});
}

function sendInviteAPI( this_gi, list, callback ){
	var api_name = "groups/" + this_gi + "/invitations";
	var headers = {
	         "ui":ui,
	         "at":at, 
	         "li":lang,
	             };

	//private cloud, add uui & uat
	var url;
	var body = { "ul":list };
	var method = "post";
	var result = ajaxDo(api_name,headers,method,false, body, null, null, url);
	result.complete(function(data){
		callback(data);
	});
}

function removeInviteAPI( this_gi, list, callback ){
	var api_name = "groups/" + this_gi + "/invitations";
	var headers = {
	         "ui":ui,
	         "at":at, 
	         "li":lang,
	             };
	var body = { "il":list };
	var method = "put";
	var result = ajaxDo(api_name,headers,method,false, body);
	result.complete(function(data){
		callback(data);
	});
}

/*
              ██╗   ██╗██████╗ ██████╗  █████╗ ████████╗███████╗          
              ██║   ██║██╔══██╗██╔══██╗██╔══██╗╚══██╔══╝██╔════╝          
    █████╗    ██║   ██║██████╔╝██║  ██║███████║   ██║   █████╗      █████╗
    ╚════╝    ██║   ██║██╔═══╝ ██║  ██║██╔══██║   ██║   ██╔══╝      ╚════╝
              ╚██████╔╝██║     ██████╔╝██║  ██║   ██║   ███████╗          
               ╚═════╝ ╚═╝     ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚══════╝          

*/
function updateContactBranchList(){
    if( $(".subpage-contact").is(":visible") ){
        $(".sm-small-area[data-sm-act=memberslist]").trigger("click");
    } else{
    	var dom = $(".contact-subpages");
    	if( dom.is(":visible") ){
    		dom.find( ".page-back" ).trigger("click");
    	}
    }
}

function updateContactFavorite(){
	initContactData();

	//update all page
	var contactPage = $(".subpage-contact");
	if( contactPage.length>0 ){
		var favDetail = contactPage.find(".row.favorite .left");
		if( favDetail.length>0 ){
			var branchCount = Object.keys(fbl).length;
			favDetail.find(".detail.mem").html( $.i18n.getString("COMPOSE_N_MEMBERS",(g_group.favCnt)?g_group.favCnt:0 ) );
			var branch = favDetail.find(".detail.branch");
			if( branchCount>0 ) branch.html( $.i18n.getString("COMPOSE_N_SUBGROUP", branchCount) );
			else branch.hide();
		}
	}

	//update fav page
	var favPage = $("#page-contact_favorite");
	if( favPage.length>0 ){
		updateFavoritePage(false);
	}
	// if( $(".subpage-contact").is(":visible") ){
    //     $(".sm-small-area[data-sm-act=memberslist]").trigger("click");
}

function updateSubFavoriteGroup (updateData, dom, favBranchID) {
	

	var api_name = "groups/" + gi + "/favorites/" + favBranchID;
	var headers = {
		"ui":ui,
		"at":at, 
		"li":lang
	};

	ajaxDo(api_name,headers, "put", true, updateData).complete(function(data) {
		if(data.status == 200){
			fbl = g_group.fbl;

			if (updateData.al.length > 0 || updateData.dl.length > 0) {
				var userData = QmiGlobal.groups;
				var memObjects = $.parseJSON(dom.data("object_str")),
					memKeys = Object.keys(memObjects);

				g_group = userData[gi];

				//add fi to mem data
				guAll = g_group.guAll;

				for(var i = 0; i < updateData.al.length; i++){
					var key = updateData.al[i];
					guAll[key].fbl.push(favBranchID);
				}
				//del fi from mem data
				for(var i = 0; i < updateData.dl.length; i++){
					var key = updateData.dl[i];
					var index = guAll[key].fbl.indexOf(favBranchID);
					if( index>=0 ) delete guAll[key].fbl[index];
				}

				fbl[favBranchID].cnt = memKeys.length;	

				initContactData();
				dom.parent().fadeOut();
			}

			if (updateData.hasOwnProperty("fn")) {
				fbl[favBranchID].fn = updateData.fn;
			}

			showSubFavoritePage(favBranchID);
		} 
		toastShow($.parseJSON(data.responseText).rsp_msg);
	});
}

function initQRCodePage(){
	var page = $(".ca-qrcode-area");
	var imgContainer = page.find(".qr_img_container");
	imgContainer.find("img").hide();
	var switchBtn = page.find(".switch");
	var downloadBtn = page.find(".qr_btn[data-type=save]");
	downloadBtn.addClass("disabled");
	downloadBtn.removeAttr("href");
	downloadBtn.removeAttr("download");

	var api_name = "groups/" + gi + "/qrcode";
	var headers = {
		"ui":ui,
		"at":at, 
		"li":lang
	};

	ajaxDo(api_name,headers,"get",true).complete(function(data){
		if(data.status == 200){
			var rps = $.parseJSON(data.responseText);
			if(!rps || !rps.rsp_success){
				imgContainer.find('img').hide();
				imgContainer.addClass("disabled");
				return;
			}
			switchBtn.attr("data-enabled",rps.rps);
			if(rps.qst==0){ //donno why 0 stands for enabled...
				imgContainer.removeClass("disabled");
				switchBtn.children("img").attr("src", "images/registration/checkbox_check.png");
			} else {
				imgContainer.addClass("disabled");
				switchBtn.children("img").attr("src", "images/registration/checkbox_none.png");
			}
			imgContainer.find('img').attr('src', rps.qru).show();
			downloadBtn.removeClass("disabled");
			downloadBtn.attr("href", rps.qru );
			var fileName = getQRCodeFileNameWithExtension( rps.qru );
			downloadBtn.attr("download", fileName );
		}
	});

	$("#page-contact-addmem .ca-tab").off("click").click( function(){
		$(this).parent().find(".ca-tab.active").removeClass("active");
		$(this).addClass("active");
		var type = $(this).attr("data-type");
		$("#page-contact-addmem .ca-sub-area.active").removeClass("active");
		$("#page-contact-addmem ."+type).addClass("active");
		if( type=="pending" ){
			updateInvitePending();
		}
	});
	$("#page-contact-addmem .ca-qrcode-area .switch").off("click").click( function(){
		var switchBtn = $(this);
		var now = new Date().getTime();
		if( switchBtn.data("enabledTime") && switchBtn.data("enabledTime")>now ){
			toastShow( $.i18n.getString("COMMON_ACT_TOO_FREQUENT") );
			return;
		}
		switchBtn.data("enabledTime",now+3000);
		if( 0==switchBtn.attr("data-enabled") ){
			updateQRCodeSetting(1); // QRcode Status(0：已啟用、1：已停用)
		} else {
			updateQRCodeSetting(0);
		}
	});
	$("#page-contact-addmem .ca-qrcode-area .qr_btn[data-type='update']").off("click").click( function(){
		var switchBtn = $(this);
		var now = new Date().getTime();
		if( switchBtn.data("enabledTime") && switchBtn.data("enabledTime")>now ){
			toastShow( $.i18n.getString("COMMON_ACT_TOO_FREQUENT") );
			return;
		}
		switchBtn.data("enabledTime",now+3000);
		refreshQRCode();
	});
	// $("#page-contact-addmem .ca-qrcode-area .qr_btn[data-type='save']").off("click").click( function(){
	// 	if( $(this).hasClass("disabled") ) return;
	// 	var src = $(".qr_img_container img").attr("src");
	// 	// if(!src || 0==src.length) return;
	// 	// var aDom = $('<a href="'+src+'" download></a>');
	// 	// $("body").append(aDom);
	// 	// aDom.trigger("click");
	// 	// aDom.remove();
	// 	window.location.href = src;
	// });
}

function refreshQRCode( callback ){
	cns.debug("refreshQRCode");
	var page = $(".ca-qrcode-area");
	var imgContainer = page.find(".qr_img_container");
	imgContainer.addClass("disabled");
	imgContainer.find('img').hide();
	var downloadBtn = page.find(".qr_btn[data-type=save]");
	downloadBtn.addClass("disabled");
	downloadBtn.removeAttr("href");
	downloadBtn.removeAttr("download");
	var api_name = "groups/" + gi +"/qrcode";
	var headers = {
		"ui":ui,
		"at":at, 
		"li":lang
	};

	ajaxDo(api_name,headers,"put",true).complete(function(data){
		if(data.status == 200){
			var rps = $.parseJSON(data.responseText);
			if(!rps || rps.rsp_code<0 ){
				imgContainer.find('img').hide();
				imgContainer.addClass("disabled");
				if(callback) callback(false);
				return;
			}
			imgContainer.find('img').attr("src", rps.qru ).off("load").load(function(){
				$(this).show();
				imgContainer.removeClass("disabled");
				downloadBtn.removeClass("disabled");
			});
			downloadBtn.attr("href", rps.qru );
			var fileName = getQRCodeFileNameWithExtension( rps.qru );
			downloadBtn.attr("download", fileName );
			if(callback) callback(true);
		} else {
			imgContainer.find('img').hide();
			imgContainer.addClass("disabled");
			if(callback) callback(false);
		}
	});
}

function updateQRCodeSetting( switchVal, callback ){
	var api_name = "groups/" + gi;
	var headers = {
		"ui":ui,
		"at":at, 
		"li":lang
	};
	var body = {
		qst: switchVal
	}

	ajaxDo(api_name,headers,"put",true,body).complete(function(data){
		if(data.status == 200){
			var rps = $.parseJSON(data.responseText);
			var page = $("#page-contact-addmem");
			var switchBtn = page.find(".ca-qrcode-area .switch");
			switchBtn.attr("data-enabled",rps.qst);
			var imgContainer = page.find(".qr_img_container");
			if(rps.qst==1){
				imgContainer.addClass("disabled");
				switchBtn.children("img").attr("src","images/registration/checkbox_none.png");
			} else {
				imgContainer.removeClass("disabled");
				switchBtn.children("img").attr("src","images/registration/checkbox_check.png");
			}
			if(callback) callback(true);
		} else {
			if(callback) callback(false);
		}
	});
}