
$(document).ready(function(){
	$(".addressBook-refresh").off("click").on("click",function(e){
		// AddressBook.showAddMemberPage();
		AddressBook.initAddressBookList(true);
	});
	$("#page-addressbook-addmem .ca-content-area").niceScroll( {
		// styler:"fb",
		cursorcolor:"rgba(107, 107, 107,0.8)", 
		cursorwidth: '10',
		cursorborderradius: '10px',
		background: 'rgba(255,255,255,0)',
		cursorborder:"",
		boxzoom:false,
		zindex: 999,
		scrollspeed: 90,
		mousescrollstep: 40
		// horizrailenabled: false,
		// ,autohidemode: "leave"
	} );
});

var AddressBook = AddressBook || {
	bl: null,
	guAll: null,
	inviteGuAll: null,
	guAllExsit: null,
	ucl: null,
	customCnt: 0,
	isList: true,
	group: null,
	contactWaitLoadImgs: null,
	newMemList: null,
	favGuAll: null,
	favCnt:0,
	groupName:"",
	// var isKeyPress = false;


	initAddressBookList: function(status){

		if (status === undefined) 
			status = false;
		else 
			status = true;

		var instance = this;

		var 
		api_name = "groups/" + gi + "/contacts",
		headers = {
			"ui":ui,
			"at":at, 
			"li":lang
		};

		ajaxDo(api_name,headers,"get",status).complete(function(data){
			if(data.status == 200){
				var tmp = $.parseJSON( data.responseText );
				
				try{
					instance.groupName = QmiGlobal.groups[gi].gn;
				} catch(e){
					errorReport(e);
				}

				if( !tmp ){
					alert("no data");
					return;
				}

				//get mem data
				if( !tmp.gcl || tmp.gcl.length<=0 ){
					cns.debug("no gcl data");
					tmp.gcl = {};
					// return;
				}
				//member tp 0: ucl, 1:gcl, 2: fav
				instance.favGuAll = {}
				instance.guAll = {};
				instance.guAllExsit = {};
				var cnt = 0;
		        for( var i=0; i<tmp.gcl.length; i++){
		        	var key = tmp.gcl[i].ci;
		            //將gu設成key 方便選取
		            instance.guAll[key] = tmp.gcl[i];
		            if( instance.guAll[key].tp==2 ){
		            	instance.guAll[key].fav = true;
						instance.favGuAll[key] = tmp.gcl[i];
						cnt++;
		            } else{
		            	instance.guAll[key].fav = false;
		            }
		            instance.guAllExsit[key] = instance.guAll[key];
		        }
				instance.inviteGuAll = {};
				instance.newMemList = {};


				//custom defined
				if( !tmp.ucl || tmp.ucl.length<=0 ){
					cns.debug("no ucl data");
					tmp.gcl = {};
					// return;
				}
				instance.ucl = {};
		        for( var i=0; i<tmp.ucl.length; i++){
		            //將gu設成key 方便選取
		            var data = tmp.ucl[i];
		        	var key = data.ci;
		            data.isCustom = true;
		            instance.guAll[ key ] = data;
		            instance.ucl[ key ] = data;
		            if( instance.guAll[key].tp==2 ){
		            	instance.guAll[key].fav = true;
						instance.favGuAll[key] = tmp.gcl[i];
						cnt++;
		            } else{
		            	instance.guAll[key].fav = false;
		            }
		        }
				instance.favCnt = cnt;
		        instance.customCnt = Object.keys(instance.ucl).length;


				//get branch data
				// if( !tmp.bl || tmp.bl.length<=0 ){
				// 	// alert("no branch data");
				// 	return;
				// }
				instance.bl = {};

        		$.each(tmp.bl,function(i,val){
                    if( null==val.bp|| val.bp.length==0 ) return;

                    var bp_arr = val.bp.replace(/^\./, '').split(".");
                    var pi = "";
                    if(bp_arr.length > 1){
                        pi = bp_arr[bp_arr.length-2]
                    }
        			instance.bl[bp_arr.last()] = {
        				lv: bp_arr.length,
        				bn: val.bn,
        				cl: [],
                        cnt: 0,
                        pi: pi,
        				bp_arr: bp_arr
        			};
        			
	        	});

                //建立子群組
	        	$.each(instance.bl,function(i,val){
        			if(val.lv > 1){
        				var parent = val.bp_arr[val.bp_arr.length-2];
        				if(instance.bl[parent]) instance.bl[parent].cl.push(i);
        			}
        			delete val.bp_arr;
	        	});
                
                //計算人數
                //*NOTE*
                // 同一人可能隸屬于多個群組, 若兩個子群組有同一人,
                // 母群組應該只能算一人, 普通加法不成立...
                for( var biTmp in instance.bl ){
                    //每個群組走過一次所有成員, 只要含有這個群組ＩＤ數量就加一..
                    var cnt=0;
                    $.each( instance.guAll, function(ci, mem){
                        if( mem && mem.bl &&mem.bl.indexOf(biTmp)>=0 ){
                            cnt++;
                        }
                    });
                    instance.bl[biTmp].cnt = cnt;
                }


				instance.onGetAddressBookData();
			}
		});
	},
	onGetAddressBookData: function(){
		var instance = this;
		//clear search result
		$(".subpage-addressBook .contact-search .clear").trigger("click");

		// if( false==instance.initAddressBookList() ) return;

		//get html container
		var rowContainer = $(".subpage-addressBook .contact-rows");
		if( !rowContainer || rowContainer.length<=0 ) return;
		rowContainer.html("");

		var pagesTmp = $(".contact-subpages");
		if( pagesTmp.is(":visible") ){
			pagesTmp.find(".page-back").trigger("click");
		}
		$("#page-addressbook_all").data("gi",null);

		//add row all
		var tmp = $("<div class='row all'><div class='left'></div><div class='right'></div></div>");
		var left = tmp.find(".left");
		left.append("<div class='name'>"+$.i18n.getString("COMMON_ALL_MEMBERS")+"</div>");
		left.append("<div class='detail'>"+$.i18n.getString("COMPOSE_N_MEMBERS",Object.keys(instance.guAllExsit).length)+"</div>");
		tmp.find(".right").append("<img src='images/icon/icon_arrow_right.png'/>");
		rowContainer.append(tmp);
		rowContainer.find(".row.all").off("click").click( function(){
			instance.showAllMemberPage(instance.groupName) 
		});

		//any new mem
		var newMemCnt = Object.keys(instance.newMemList).length;
		if( newMemCnt>0 ){
			tmp.find(".right").prepend("<div class='new'>"+newMemCnt+"</div>");
		}

		//add row custom
		if (!QmiGlobal.companyGiMap[gi] == undefined) {
			var tmp = $("<div class='row custom'><div class='left'></div><div class='right'></div></div>");
			var left = tmp.find(".left");
			left.append("<div class='name'>"+$.i18n.getString("ADDRESSBOOK_CUSTOM")+"</div>");
			left.append("<div class='detail mem'>"+$.i18n.getString("COMPOSE_N_MEMBERS",(instance.customCnt)?instance.customCnt:0 )+"</div>");
			
			tmp.find(".right").append("<img src='images/icon/icon_arrow_right.png'/>");
			tmp.off("click").click( {instance:instance}, instance.showCustomPage );
			rowContainer.append(tmp);
		}

		//add row favorite
		var tmp = $("<div class='row favorite'><div class='left'></div><div class='right'></div></div>");
		var left = tmp.find(".left");
		left.append("<div class='name'>"+$.i18n.getString("COMMON_FAVORIATE")+"</div>");
		left.append("<div class='detail mem'>"+$.i18n.getString("COMPOSE_N_MEMBERS",(instance.favCnt)?instance.favCnt:0 )+"</div>");
		
		tmp.find(".right").append("<img src='images/icon/icon_arrow_right.png'/>");
		tmp.off("click").click( {instance:instance}, instance.showFavoritePage );
		rowContainer.append(tmp);


		//set title
		$("#page-group-main").find(".page-title").html( instance.groupName );
		//set sidemenu
		// $(".side-menu-btn").off("click").click(function(){
		//     $( "#side-menu" ).panel( "open");
		// });

		//show 1st level branch data
		if( Object.keys(instance.bl).length>0 ){
			$.each(instance.bl,function(key,bl_obj){
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
			instance.showSubContactPage( "page-group-main", $(this).data("bi"), JSON.stringify([]) );
		});

		//search bar
		var searchBar = $(".subpage-addressBook .contact-search .content");
		var searchBarInput = searchBar.find(".input");
		searchBarInput.data("searchText","");
		searchBarInput.off("keyup").keyup( {instance:instance}, instance.onSearchInput );
		// searchBarInput.off("keypress").keypress( function(){
		// 	isKeyPress = true;
		// });
		searchBar.find(".clear").off("click").click(instance.deactiveSearch);
		//若沒有文字的話點別處取消搜尋
		searchBarInput.off("focusout").focusout( function(){
			var text = searchBarInput.val();
			searchBarInput.data("searchText","");
			if( !text || text.length==0 ){
				instance.deactiveSearch();
			}
		});

		var searchHint = $(".contact-search .hintDiv");
		searchHint.off("click").click( function(){
			$(this).hide();
			searchBar.show();
			searchBarInput.focus();
		});

		// $(".subpage-addressBook").height( $(window).height()-63 );
		$(window).off("resize").resize( function(){
			$(".contact-branchList").height( $(window).height()-105 );
			$(".contact-scroll").height( $(window).height()-112 );
		});
	},

	deactiveSearch: function(){
		var instance = this;
		var content = $(".contact-search .content");
		content.hide();
		var input = content.find(".input");
		input.data("searchText","");
		input.val("");
		
		$(".contact-search .hintDiv").show();
		$(".subpage-addressBook .contact-rows").show();
		$(".contact-searchResult").hide();
		return;
	},

	onSearchInput: function(e){
		var instance = e.data.instance;
		var input = $(this);
		if( input.val().indexOf("\n") >= 0 ){
			input.val( input.val().replace("/\n/g","") );
		}
		var str = input.val();	//+String.fromCharCode(e.keyCode);

		//if no search text, show ori rows
		if( !str || str.length==0 ){
			$(".contact-searchResult").hide();
			$(".subpage-addressBook .contact-rows").show();
			return;
		}

		//for chinese...enter for comfirm chinese triggers no event
		// if( e.keyCode == '13' || e.keyCode == '8' || e.keyCode == '46'){
		// 	if( input.val() != input.data("searchText") ){
		// 		isKeyPress = true;
		// 	}
		// }

		//check complete chinese typing
		// if( !isKeyPress ){
		// 	cns.debug("(",input.val(),")");
		// 	return;
		// }
		// isKeyPress = false;
		
		//return if no text changed
		if( input.data("searchText")==str ) return;
		input.data("searchText", str);
		cns.debug(str);

		//hide ori rows
		var contact = $(".subpage-addressBook .contact-rows");
		var searchResult = $(".subpage-addressBook .contact-searchResult");
		if( !str || str.length==0 ){
			$(".contact-searchResult").hide();
			$(".subpage-addressBook .contact-rows").show();
			return;
		}
		if( !searchResult || searchResult.length==0 ){
			searchResult = $('<div class="contact-searchResult" style="display:none;"></div>');
			contact.after( searchResult );
		}
		searchResult.show();
		contact.hide();

		//search with no case sensitive
		str = str.toLowerCase();

		//search mem
		var memObject = {};
		var memCount = 0;
		for( var key in instance.guAllExsit ){
			var mem = instance.guAllExsit[key];
			if( null==mem.nk ){
				cns.debug( JSON.stringify(mem) );
			} else {
				if( mem.nk.toLowerCase().indexOf(str)>=0 ){
					memObject[key] = mem;
					memCount++;
				}	
			}
		}

		//search bl
		var branchList = [];
		for( var key in instance.bl ){
			var branch = instance.bl[key];
			if( branch.bn.toLowerCase().indexOf(str)>=0 ){
				branchList.push(key);
			}
		}
		var branchCount = branchList.length;
		
		var memTitle = $(".contact-searchResult .memTitle");
		var branchTitle = $(".contact-searchResult .branchTitle");

		if( branchCount==0 && memCount==0 ){
			$(".contact-searchResult .noResult").show();
			memTitle.hide();
			branchTitle.hide();
			$(".contact-searchResult .contact-memLists").hide();
			$(".contact-searchResult .contact-rows").hide();
			return;
		}

		$(".contact-searchResult .noResult").hide();

		if( memCount>0 ){
			memTitle.show();
			var memListContainer = $(".contact-searchResult .contact-memLists");
			if( memListContainer && memListContainer.length>0 ){
				memListContainer.remove();
			}
			memListContainer = instance.generateMemberList(memObject);
			memTitle.after(memListContainer);
			instance.setOnMemListScroll();
		} else {
			memTitle.hide();
		}

		if( branchCount>0 ){
			branchTitle.show();
			var branchListContainer = $(".contact-searchResult .contact-rows");
			if( branchListContainer && branchListContainer.length>0 ){
				branchListContainer.remove();
			}
			branchListContainer = instance.generateBranchList( branchList );
			branchTitle.after(branchListContainer);

			branchListContainer.find(".row.branch").off("click").click( function(){
				instance.showSubContactPage( "page-group-main", $(this).data("bi"), JSON.stringify([]) );
			});
		} else {
			branchTitle.hide();
		}
	},

	showSubContactPage: function( parentPageID, bi, lvStackString, isGenContent ){
		var instance = this;
		if( null==isGenContent ) isGenContent = true;
		var lvStack = $.parseJSON(lvStackString);
		var data = instance.bl[bi];
		if( !data ) return;
		lvStack.push(data.bn);
		var parentLevel = data.lv;
		var childList = data.cl;
		
		var pageID = "page-addressbook_sub"+parentLevel;
		var page = $( "#"+pageID );
		if( !page || page.length==0 ){
			page = $('<div data-role="page" id="'+pageID+'" class="subPage contact-subpages">'
	            +'<div data-theme="c" data-role="header" data-position="fixed" data-tap-toggle="false">'
	                +'<div class="page-back" customize><img src="images/common/icon/bt_close_activity.png"/></div>'
	                +'<h3 class="page-title">成員列表</h3>'
	            +'</div><div class="subpage-addressBook"></div></div>');
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
			instance.showMainContact();
			// $.mobile.changePage("#"+parentPageID); //, { transition: "slide", reverse: true}
			// var tmp = $( "#"+parentPageID );
			// if( tmp && tmp.length>0 && false==tmp.data("gen") ){
			// 	instance.showSubContactPage( tmp.data("parentPageID"),
			// 		tmp.data("bi"), tmp.data("lvStackString") );
			// }
		});
		
		var subPage = page.find(".subpage-addressBook");
		subPage.html("");

		//title
		var title = $("<div class='contact-titleBar'></div>");
		var nameArea = $("<div class='nameArea list'></div>");
		nameArea.append("<div class='name'>"+data.bn+"</div>");
		nameArea.append("<div class='arrow'></div>");
		title.append(nameArea);
		title.append("<div class='btn'></div>");
		subPage.append(title);

		title.find(".btn").off("click").click( function(){
			instance.switchListAndGrid( $(this), subPageBottom );
		});

		//sub branch list
		cns.debug( parentLevel );
		var subbranchList = $(".contact-branchList");
		if( subbranchList.length==0 || parentLevel==1 ){
			subbranchList.remove();
			subbranchList = $('<div class="contact-branchList" style="display:none;"></div>');
			instance.showSubbranchListBox( subbranchList, data.lv, bi, JSON.stringify([]) );

			subbranchList.find(".row:nth-child(1)").addClass("current");

			subbranchList.find(".row.list").off("click").click( function(){
				cns.debug( $(this).data("bi") );
				//產生目前的頁面到指定階層中間的頁面, 除最後一頁外其餘內容留空, 走到那頁時才產
				var stackString = $(this).data("stack");
				var currentStack = lvStack.slice(0);
				if( stackString && stackString.length > 0 ){
					var stackTmp = $.parseJSON(stackString);
					var currentStackLvl = parentLevel;
					
					var pageIDTmp = "page-addressbook_sub"+currentStackLvl;
					instance.showSubContactPage( pageIDTmp, stackTmp[stackTmp.length-1], JSON.stringify(currentStack) );

					// for( var i=1; i<stackTmp.length-1; i++ ){
					// 	var pageIDTmp = "page-addressbook_sub"+currentStackLvl;
					// 	instance.showSubContactPage( pageIDTmp, stackTmp[i], JSON.stringify(currentStack), false );
					// 	if( instance.bl.hasOwnProperty(stackTmp[i]) ){
					// 		currentStack.push( instance.bl[stackTmp[i]].bn );
					// 	} else currentStack.push( stackTmp[i] );
					// 	currentStackLvl++;
					// }
					// var pageIDTmp = "page-addressbook_sub"+currentStackLvl;
					// instance.showSubContactPage( pageIDTmp, stackTmp[i], JSON.stringify(currentStack) );
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
		// 		$(".subpage-addressBook:not(.sub)").slideDown();
		// 		$(".subpage-addressBook.sub").hide();
		// 	} else {
		// 		$(".subpage-addressBook").hide();
		// 		$(".subpage-addressBook.sub._"+(parentLevel-1) ).slideDown();
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
		var memObject = {};
		var count = 0;
		$.each(instance.guAllExsit,function(key,mem){
			var id = mem.bl.substring(mem.bl.length-11,mem.bl.length);
			if( id==bi ){
				count++;
				memObject[key] = mem;
			}
		});
		var memContainer = instance.generateMemberGrid(memObject);
		subPageBottom.append(memContainer);
		var memListContainer = instance.generateMemberList(memObject);
		subPageBottom.append(memListContainer);
		if( instance.isList ){
			title.find(".btn").addClass("list");
			memContainer.css("display","none");
			instance.setOnMemListScroll();
		} else {
			memListContainer.css("display","none");
			instance.setOnMemGridScroll();
		}

		if( 0==count ){
			subTitle.hide();
			memListContainer.append("<div class='noMem'>"+$.i18n.getString("MEMBER_X_GROUP_NO_MEMBER", data.bn)+"</div>");
			memContainer.append("<div class='noMem'>"+$.i18n.getString("MEMBER_X_GROUP_NO_MEMBER", data.bn)+"</div>");
		} else {
			subTitle.find(".count").html(count);
		}

		//sub-branches
		if( childList.length>0 ){
			var subTitle = $("<div class='contact-rows-title'></div>");
			// subTitle.append( '<div class="count">'+childList.length+'</div>');
			subTitle.append( '<div class="text">'+$.i18n.getString("COMPOSE_N_SUBGROUP", "<b class='count'>"+childList.length+"</b>")+'</div>');
			subPageBottom.append( subTitle );

			var branch = instance.generateBranchList(childList);
			subPageBottom.append(branch);
			subPageBottom.find(".row.branch").off("click").click( function(){
				instance.showSubContactPage( pageID, $(this).data("bi"), JSON.stringify(lvStack) );
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
	},

	showSubbranchListBox: function( dom, startLvl, bi, stackString ){
		var instance = this;
		if( !bi || !dom || dom.length<0 ) return;
		var stack = $.parseJSON(stackString);
		stack.push(bi);
		stackString = JSON.stringify(stack);
		var data = instance.bl[bi];
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
				instance.showSubbranchListBox(tmp, startLvl, data.cl[i], stackString );
			}
		}
	},

	//顯示所有成員page
	showAllMemberPage: function(gn) {
		var instance = this;
		var pageID = "page-addressbook_all";
		var page = $( "#"+pageID );

		if( !page || page.length==0 ){
			page = $('<div data-role="page" id="'+pageID+'" class="contact-subpages">'
	            +'<div data-theme="c" data-role="header" data-position="fixed" data-tap-toggle="false">'
	                +'<div class="page-back" customize><img src="images/navi/navi_icon_back.png"/></div>'
	                +'<h3 class="page-title">成員列表</h3>'
	            +'</div><div class="subpage-addressBook"></div></div>');
			$("#page-group-main").after(page);
		} else if( gi==page.data("gi") ){
			$.mobile.changePage("#"+pageID, { transition: "slide"});
			return;
		}
		page.data("gi", gi);

		page.find(".page-title").html( $.i18n.getString("MEMBER_ALL") );
		page.find(".page-back").off("click").click( instance.showMainContact );
		
		var subPage = page.find(".subpage-addressBook");
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
			instance.switchListAndGrid( $(this), subPageBottom );
		});

		//mem-title
		var subTitle = $("<div class='contact-mems-title'></div>");
		subTitle.append( '<div class="count">'+0+'</div>');
		subTitle.append( '<div class="text">'+$.i18n.getString("COMPOSE_N_MEMBERS", "")+'</div>');
		subPageBottom.append(subTitle);
		
		//mem
		var count = Object.keys(instance.guAllExsit).length;
		var memContainer = instance.generateMemberGrid(instance.guAllExsit);
		subPageBottom.append(memContainer);
		var memListContainer = instance.generateMemberList(instance.guAllExsit);
		subPageBottom.append(memListContainer);
		if( instance.isList ){
			title.find(".btn").addClass("list");
			memContainer.css("display","none");
			instance.setOnMemListScroll();
		} else {
			memListContainer.css("display","none");
			instance.setOnMemGridScroll();
		}

		if( 0==count ){
			subTitle.hide();
			memContainer.append("<div class='noMem'>"+$.i18n.getString("MEMBER_X_GROUP_NO_MEMBER", gn)+"</div>");
			memListContainer.append("<div class='noMem'>"+$.i18n.getString("MEMBER_X_GROUP_NO_MEMBER", gn)+"</div>");
		} else {
			subTitle.find(".count").html(count);
		}

		$("#"+pageID +" .contact-scroll").height( $(window).height()-112 );
		$.mobile.changePage("#"+pageID, { transition: "slide"});
	},

	switchListAndGrid: function( dom, subPageBottom ){
		var instance = this;
		instance.isList = !instance.isList;
		var userData = QmiGlobal.groups;
		userData.isMemberShowList = instance.isList;
		// *--* $.lStorage(ui,userData);

		var mem = subPageBottom.find(".contact-mems");
		var memList = subPageBottom.find(".contact-memLists");
		if( instance.isList ){
			mem.fadeOut('fast', function(){
				memList.show(0);
			});
			dom.addClass("list");
			instance.setOnMemListScroll();
			instance.updateNewMemTag( memList );
		} else {
			memList.fadeOut('fast', function(){
				mem.show(0);
			});
			dom.removeClass("list");
			instance.setOnMemGridScroll();
			instance.updateNewMemTag( mem );
		}
	},

	generateMemberGrid: function( memObject ){
		var instance = this;
		var memContainer = $("<div class='contact-mems'></div>");
		$.each(memObject,function(key,mem){
			if( null== mem ){
				cns.debug(key);
			} else {
				var tmp = $("<div class='mem ab_namecard'></div>");
				if( mem.aut && mem.aut.length>0 ){
					tmp.append("<div class='img waitLoad' data-url='"+mem.aut+"'><div class='new' style='display:none;'>NEW</div></div>");
				} else {
					tmp.append("<div class='img'><div class='new' style='display:none;'>NEW</div></div>");
				}
				// cns.debug(key, mem.nk);
				tmp.append("<div class='name'>"+mem.nk.replaceOriEmojiCode()+"</div>");
				tmp.data("gu",key);
				//is admin?
				if( mem.ad==1 ){
					tmp.addClass("admin");
					memContainer.prepend(tmp);
				} else {
					memContainer.append(tmp);
				}
				//is new mem
				instance.setNewMemTag( tmp, mem );
				// if( instance.newMemList.hasOwnProperty(mem.gu) ){
				// 	tmp.find(".new").show();
				// 	tmp.click( function(){
				// 		if( instance.newMemList.hasOwnProperty(mem.gu) ){
				// 			delete instance.newMemList[mem.gu];
				// 			var tmpMemList = $.lStorage("_newMemList");
				// 			tmpMemList[gi] = instance.newMemList;
				// 			$.lStorage("_newMemList",tmpMemList);
				// 		}
				// 		$(this).find(".new").hide();
				// 		$(this).unbind("click");
				// 	});
				// }

			}
		});
		//"<div class='img' style='background-image:url("+mem.aut+");'><div class='new' style='display:none;'>NEW</div></div>");
		
		var tmp = memContainer.find(".img.waitLoad:lt(30)");
		$.each(tmp, function(index,domTmp){
			var dom = $(domTmp);
			dom.css("background-image","url("+dom.attr("data-url")+")").removeClass("waitLoad").removeAttr("data-url");
		});
		instance.contactWaitLoadImgs = memContainer.find(".img.waitLoad");

		return memContainer;
	},


	generateMemberList: function( memObject, favCallback ){
		var instance = this;
		var memContainer = $("<div class='contact-memLists'></div>");
		var count = 0;
		$.each(memObject,function(key,mem){
			//favorite ver.
			// var tmp = $("<div class='row mem'><div class='left ab_namecard'></div><div class='mid ab_namecard'></div><div class='right'></div></div>");
			var tmp = $("<div class='row mem ab_namecard'><div class='left'></div><div class='mid'></div><div class='right'>&nbsp</div></div>");
			//pic
			var left = tmp.find(".left");
			if( mem.aut && mem.aut.length>0 ){
				// left.append("<div class='img' style='background-image:url("+mem.aut+")'><div class='new' style='display:none;'>NEW</div></div>");
				left.append("<div class='img waitLoad' data-url='"+mem.aut+"'><div class='new' style='display:none;'>NEW</div></div>");
			} else {
				left.append("<div class='img'></div>");
			}
			//name, (職稱), detail
			var mid = tmp.find(".mid");
			mid.append("<div class='name'>"+mem.nk?(mem.nk.replaceOriEmojiCode()):""+"</div>");
			
			//暫時用部門取代職稱
			var posi = "";
			try{
				posi = instance.bl[mem.bl.split(",")[0].split(".")[0]].bn;
			} catch( e ){
				// cns.debug( e.message );
			}
			var tmpRow = $("<div class='detail'>"+posi+"</div>");
			if(posi.length==0) tmpRow.css("display","none");
			mid.append(tmpRow);
			
			var sl = (mem.sl)? mem.sl : "";
			tmpRow = $("<div class='detail'>"+sl+"</div>");
			if(sl.length==0) tmpRow.css("display","none");
			mid.append(tmpRow);
			if( !posi || posi.length==0 ){
				mid.find(".detail:last-child").addClass("twoLine");
			}
			tmp.data("gu",key)


			//is admin?
			if( mem.ad==1 ){
				tmp.addClass("admin");
				memContainer.prepend(tmp);
			} else {
				memContainer.append(tmp);
			}

			//is new mem
			instance.setNewMemTag( tmp, mem );
		});

		var tmp = memContainer.find(".img.waitLoad:lt(8)");
		$.each(tmp, function(index,domTmp){
			var dom = $(domTmp);
			dom.css("background-image","url("+dom.attr("data-url")+")").removeClass("waitLoad").removeAttr("data-url");
		});

		return memContainer;
	},

	setNewMemTag: function( tmp, mem ){
		var instance = this;
		if( instance.newMemList.hasOwnProperty(mem.gu) ){
			tmp.find(".new").show();
			tmp.click( function(){
				if( instance.newMemList.hasOwnProperty(mem.gu) ){
					delete instance.newMemList[mem.gu];
					var tmpMemList = $.lStorage("_newMemList");
					tmpMemList[gi] = instance.newMemList;
					$.lStorage("_newMemList",tmpMemList);

					$(".subpage-addressBook.main-subpage > .contact-rows > .row.all > .right .new").html( Object.keys(instance.newMemList).length );
				}
				$(this).find(".new").hide();
				$(this).unbind("click");
			});
		}
	},
	updateNewMemTag: function( dom ){
		var instance = this;
		var memDoms = dom.find(".mem.ab_namecard");
		$.each( memDoms, function(index, domTmp ){
			var dom = $(domTmp);
			var gu = dom.data("gu");
			var newTag = dom.find(".new");
			if( newTag.css("display")=="block" ){
				if( false == instance.newMemList.hasOwnProperty(gu) ){
					newTag.hide().unbind("click");
				}
			}
		});
	},

	setOnMemGridScroll: function(){
		var instance = this;
		var memContainer = $(".contact-scroll");
		instance.contactWaitLoadImgs = memContainer.find(".contact-mems .img.waitLoad");
		memContainer.unbind("scroll").scroll(function(){
			if( null==instance.contactWaitLoadImgs) return;
			var height = $(this).height()+128;
			// cns.debug();
			// cns.debug($(this).scrollTop(), $(this).attr("data-url"));
			for( var i=instance.contactWaitLoadImgs.length-1; i>=0; i-- ){
				var tmpDom = $(instance.contactWaitLoadImgs[i]);
				// tmpDom.html( tmpDom.offset().top );
				if( tmpDom.offset().top <height ){
					tmpDom.css("background-image","url("+tmpDom.attr("data-url")+")");
					tmpDom.removeAttr("data-url").removeClass("waitLoad");
					instance.contactWaitLoadImgs.splice(i,1);
				}
			}
		});
	},
	setOnMemListScroll: function(){
		var instance = this;
		var memContainer = $(".contact-scroll");
		instance.contactWaitLoadImgs = memContainer.find(".contact-memLists .img.waitLoad");
		memContainer.unbind("scroll").scroll(function(){
			if( null==instance.contactWaitLoadImgs) return;
			var height = $(this).height()+99;
			// cns.debug();
			// cns.debug($(this).scrollTop(), $(this).attr("data-url"));
			for( var i=instance.contactWaitLoadImgs.length-1; i>=0; i-- ){
				var tmpDom = $(instance.contactWaitLoadImgs[i]);
				// tmpDom.html( tmpDom.offset().top );
				if( tmpDom.offset().top <height ){
					tmpDom.css("background-image","url("+tmpDom.attr("data-url")+")");
					tmpDom.removeAttr("data-url").removeClass("waitLoad");
					instance.contactWaitLoadImgs.splice(i,1);
				}
			}
		});
	},

	generateBranchList: function( childList ){
		var instance = this;
		var branch = $("<div class='contact-rows'></div>");
		for(var i=0; i<childList.length; i++ ){
			var key = childList[i];
			var childData = instance.bl[key];
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
	},

	showMainContact: function(){
		var instance = this;
		// $("#page-group-main .contact-rows").height( $(window).height()-63 );
		$.mobile.changePage("#page-group-main", { transition: "slide", reverse: true});
	},

	/*
	              ███████╗ █████╗ ██╗   ██╗ ██████╗ ██████╗ ██╗████████╗███████╗          
	              ██╔════╝██╔══██╗██║   ██║██╔═══██╗██╔══██╗██║╚══██╔══╝██╔════╝          
	    █████╗    █████╗  ███████║██║   ██║██║   ██║██████╔╝██║   ██║   █████╗      █████╗
	    ╚════╝    ██╔══╝  ██╔══██║╚██╗ ██╔╝██║   ██║██╔══██╗██║   ██║   ██╔══╝      ╚════╝
	              ██║     ██║  ██║ ╚████╔╝ ╚██████╔╝██║  ██║██║   ██║   ███████╗          
	              ╚═╝     ╚═╝  ╚═╝  ╚═══╝   ╚═════╝ ╚═╝  ╚═╝╚═╝   ╚═╝   ╚══════╝          

	*/

	//顯示我的最愛頁面
	showFavoritePage: function( event ){//isBackward
		var instance = event.data.instance;
		var pageID = "page-addressbook_favorite";
		instance.updateFavoritePage();
		$("#"+pageID +" .contact-scroll").height( $(window).height()-112 );
		$.mobile.changePage("#"+pageID, { transition: "slide"});
		// if( true==isBackward ) $.mobile.changePage("#"+pageID, { transition: "slide", reverse: true} );
		// else  $.mobile.changePage("#"+pageID, { transition: "slide"});
	},

	updateFavoritePage: function(){
		var instance = AddressBook;
		var pageID = "page-addressbook_favorite";
		var page = $( "#"+pageID );

		if( !page || page.length==0 ){
			page = $('<div data-role="page" id="'+pageID+'" class="contact-subpages">'
	            +'<div data-theme="c" data-role="header" data-position="fixed" data-tap-toggle="false">'
	                +'<div class="page-back" customize><img src="images/navi/navi_icon_back.png"/></div>'
	                +'<h3 class="page-title">成員列表</h3>'
	            +'</div><div class="subpage-addressBook"></div></div>');
			$("#page-group-main").after(page);
		}
		// else if( gi==page.data("gi") ){
		// 	$.mobile.changePage("#"+pageID);
		// 	return;
		// }
		// page.data("gi", gi);

		page.find(".page-title").html( $.i18n.getString("COMMON_FAVORIATE") );
		page.find(".page-back").off("click").click( instance.showMainContact );
		
		var subPage = page.find(".subpage-addressBook");
		subPage.html("");

		//----- title -----
		var title = $("<div class='contact-titleBar'></div>");
		var nameArea = $("<div class='nameArea'></div>");
		nameArea.append("<div class='name'>"+$.i18n.getString("COMMON_FAVORIATE")+"</div>");
		// nameArea.append("<div class='arrow'></div>");
		title.append(nameArea);
		title.append("<div class='btn'></div>");
		subPage.append(title);

		//---- part below title bar -----
		var subPageBottom = $('<div class="contact-scroll"></div>');
		subPage.append(subPageBottom);

		// nameArea.off("click").click( function(){
		// 	//show sub divs
		// 	subbranchList.slideToggle();
		// 	title.find(".arrow").toggleClass("open");
		// });
		title.find(".btn").off("click").click( function(){
			instance.switchListAndGrid( $(this), subPageBottom );
		});

		//mem-title
		var subTitle = $("<div class='contact-mems-title'></div>");
		subTitle.append( '<div class="count">'+0+'</div>');
		subTitle.append( '<div class="text">'+$.i18n.getString("COMPOSE_N_MEMBERS", "")+'</div>');
		subPageBottom.append(subTitle);
		
		//mem
		// var memObject = {};
		// var count = 0;
		// $.each(guAllExsit,function(key,mem){
		// 	if( mem.fav ){
		// 		count++;
		// 		memObject[key] = mem;
		// 	}
		// });
		var memContainer = instance.generateMemberGrid(instance.favGuAll);
		subPageBottom.append(memContainer);
		var memListContainer = instance.generateMemberList(instance.favGuAll, instance.showFavoritePage);
		subPageBottom.append(memListContainer);
		if( instance.isList ){
			title.find(".btn").addClass("list");
			memContainer.css("display","none");
			instance.setOnMemListScroll();
		} else {
			memListContainer.css("display","none");
			instance.setOnMemGridScroll();
		}

		if( 0==instance.favCnt ){
			subTitle.hide();
			memContainer.append("<div class='noMem'>"+$.i18n.getString("MEMBER_X_GROUP_NO_MEMBER", $.i18n.getString("COMMON_FAVORIATE"))+"</div>");
			memListContainer.append("<div class='noMem'>"+$.i18n.getString("MEMBER_X_GROUP_NO_MEMBER", $.i18n.getString("COMMON_FAVORIATE"))+"</div>");
		} else {
			subTitle.find(".count").html(instance.favCnt);
		}
	},

	generateInputBox: function( subPage, title, placeholder, cancel, ok, onCancel, onOk ){
		var instance = this;
		var container = $(".contact-createSubgroup");
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
			input.attr("placeholder", placeholder );
			
			container.off("click").click( function(){
				container.fadeOut();
			});
			container.find("table").off("click").click( function(e){
				e.stopPropagation();
			});

			container.find(".cancel").off("click").click( function(e){
				e.stopPropagation();
				onCancel( input );
			});

			var create = container.find(".create");
			create.off("click").click( function(e){
				e.stopPropagation();
				onOk( input );
			});
		}
		return container;
	},

	/*
	               █████╗ ██████╗ ██████╗     ███╗   ███╗███████╗███╗   ███╗          
	              ██╔══██╗██╔══██╗██╔══██╗    ████╗ ████║██╔════╝████╗ ████║          
	    █████╗    ███████║██║  ██║██║  ██║    ██╔████╔██║█████╗  ██╔████╔██║    █████╗
	    ╚════╝    ██╔══██║██║  ██║██║  ██║    ██║╚██╔╝██║██╔══╝  ██║╚██╔╝██║    ╚════╝
	              ██║  ██║██████╔╝██████╔╝    ██║ ╚═╝ ██║███████╗██║ ╚═╝ ██║          
	              ╚═╝  ╚═╝╚═════╝ ╚═════╝     ╚═╝     ╚═╝╚══════╝╚═╝     ╚═╝          

	*/
	

	/*
	              ██╗   ██╗██████╗ ██████╗  █████╗ ████████╗███████╗          
	              ██║   ██║██╔══██╗██╔══██╗██╔══██╗╚══██╔══╝██╔════╝          
	    █████╗    ██║   ██║██████╔╝██║  ██║███████║   ██║   █████╗      █████╗
	    ╚════╝    ██║   ██║██╔═══╝ ██║  ██║██╔══██║   ██║   ██╔══╝      ╚════╝
	              ╚██████╔╝██║     ██████╔╝██║  ██║   ██║   ███████╗          
	               ╚═════╝ ╚═╝     ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚══════╝          

	*/
	updateContactBranchList: function(){
		var instance = this;
	    if( $(".subpage-addressBook").is(":visible") ){
	        $(".sm-small-area[data-sm-act=memberslist]").trigger("click");
	    } else{
	    	var dom = $(".contact-subpages");
	    	if( dom.is(":visible") ){
	    		dom.find( ".page-back" ).trigger("click");
	    	}
	    }
	},

	updateContactFavorite: function(){
		var instance = this;
		instance.initAddressBookList();

		//update all page
		var contactPage = $(".subpage-addressBook");
		if( contactPage.length>0 ){
			var favDetail = contactPage.find(".row.favorite .left");
			if( favDetail.length>0 ){
				var branchCount = Object.keys(fbl).length;
				favDetail.find(".detail.mem").html( $.i18n.getString("COMPOSE_N_MEMBERS",(instance.favCnt)?instance.favCnt:0 ) );
				var branch = favDetail.find(".detail.branch");
				if( branchCount>0 ) branch.html( $.i18n.getString("COMPOSE_N_SUBGROUP", branchCount) );
				else branch.hide();
			}
		}

		//update fav page
		var favPage = $("#page-addressbook_favorite");
		if( favPage.length>0 ){
			instance.updateFavoritePage(false);
		}
		// if( $(".subpage-addressBook").is(":visible") ){
	    //     $(".sm-small-area[data-sm-act=memberslist]").trigger("click");

	},

	userInfoShow: function(this_gi, this_gu){
		var instance = this;
    	
        if(!this_gu) return false;
        var this_gi = this_gi || gi;

    	$(".screen-lock").show();
    	$(".user-info-load-area").fadeIn("fast");
    	
    	$(".user-info-load-area .user").load('layout/layout.html .user-info-load',function(){
    		var this_info = $(this).find(".user-info-load");
            this_info._i18n();

    		//為了美觀
			this_info.find(".user-avatar-bar").hide();

    		var user_data = instance.guAll[this_gu];
    		if(user_data){
    			this_info.data("isCustom",user_data.isCustom);
	            if(user_data.isCustom){
	                //css 調整
	                $(".user-info-load-area .me").addClass("me-rotate");
	                $(".user-info-load-area .me").addClass("backface-visibility");
	                this_info.find(".action-chat").hide();
	                $(".user-avatar-bar-favorite").hide();


	            	//顯示刪除
	            	this_info.data("ci", user_data.ci);
	            	this_info.find(".user-info-delete").show();
	            	//顯示編輯
	            	var action = this_info.find(".action");
	            	action.find(".action-edit").show();
	            	action.find(".action-bar,.action-main,.action-chat").hide();
	            }else{
	                //css 調整
	                $(".user-info-load-area .me").removeClass("me-rotate");
	                $(".user-info-load-area .me").removeClass("backface-visibility");
	                this_info.find(".action-edit").hide();
	                this_info.find(".action-chat").off("click").click( function(){
	                    requestNewChatRoomApi(this_gi, "", [{gu:this_gu}], function(data){
	                    });
	                });
	                $(".user-avatar-bar-favorite").show();


	                if( true==user_data.fav ){
	                    $(".user-avatar-bar-favorite .active").show();
	                } else{
	                    $(".user-avatar-bar-favorite .deactive").show();
	                }
		            //隱藏首頁, 聊天鈕
		            this_info.find(".action").hide();
	            }


                $("body").addClass("user-info-adjust");
    			//為了美觀
    			this_info.find(".user-avatar-bar").show();

                this_info.data("this-info-gu",this_gu);
                this_info.data("this-info-gi",this_gi);

				//頭像
	        	if(user_data.aut){
	        		this_info.find(".user-avatar .user-pic").attr("src",user_data.auo);
	        		this_info.find(".user-avatar").data("auo",user_data.auo);

	        		//400存在css media min-width中 
	        		instance.userInfoAvatarPos($(".user-avatar .user-pic"));
	        	}

	        	// // *--* $.lStorage(ui,_groupList);

                // if(this_gu == gu) instance.showCustomInfo(user_data);

	        	
	        	if( user_data.isCustom ) instance.showCustomInfo(user_data);
	        	instance.userInfoDataShow(this_gi,this_info,user_data);
	        	instance.userInfoEvent(this_info);
	        }else{
	        	cns.debug("no user_data", this_gu, isCustom);
		    	this_info.data("avatar-chk",false);
	        	$(".screen-lock").fadeOut("fast");
	        	this_info.fadeOut("fast");
	        	$(".user-info-load-area").hide();
	        }
    	});
    },
	userInfoDataShow: function(this_gi,this_info,user_data,me) {
		var instance = this;
        cns.debug("user_data",user_data);
        if( user_data.st==2 ){
            this_info.find(".user-info-list-area").hide();
            this_info.find(".user-info-leave-area").show();
        } else {
            this_info.find(".user-info-list-area").show();
            this_info.find(".user-info-leave-area").hide();
        }

    	var this_gi = this_gi || gi;

    	var method = "html";
    	if(me){
    		method = "val";
    	}

    	var avatar_bar_arr = ["nk","sl","bd","bl","tt"];
    	var img_arr = ["em","pn","pn1","ext","mv"];
    	var selector;

		for( item in user_data){
			if(user_data[item].length > 0){
				if(item == "bd" && me){
			        user_data[item] = user_data[item].substring(0,4) + "/" + user_data[item].substring(4,6) + "/" + user_data[item].substring(6);
				}

				if($.inArray(item,avatar_bar_arr) >= 0) {
					selector = this_info.find(".user-avatar-bar");
				}else{
					selector = this_info.find(".user-info-list");
				}

				if(!me && item == "bd") {
					user_data.bd = user_data.bd.substring(4,6) + "." + user_data.bd.substring(6,8);
					method = "append";
				}

                if(item == "bl"){
                    try{
                        var bi_arr = user_data.bl.split(",")[0].split(".");
                        var bn = "";
                        var branch_list = instance.bl;
                        var test = selector.find(".bl");
                        test.show();
                        test = test[0];
                        // $(test).css("font-family", selector.find(".bl").css("font-family") );
                        // $(test).css("font-size", "12px" );
                        // $(test).css("line-height", "12px" );
                        var isClipped = false;
                        for( var i=bi_arr.length-1; i>=0; i-- ){
                            var bi = bi_arr[i];
                            if( !branch_list[bi] ){
                            	cns.debug("no branch data", bi);
                            	continue;
                            }
                            bn = branch_list[bi].bn+"-"+bn;
                            test.innerHTML = bn;
                            // cns.debug(test.offsetHeight);
                            if( test.offsetHeight>42 ){
                                bn = bn.substring(0,bn.length-1)+"......";
                                test.innerHTML = bn;
                                while( test.offsetHeight>40 ){
                                    // cns.debug("!", test.offsetHeight);
                                    bn = bn.substring(1,bn.length);
                                    test.innerHTML = bn;
                                }
                                bn = "..."+bn.substring(0,bn.length-6);
                                isClipped = true;
                                break;
                            }
                        }
                        if( false==isClipped && bn.length>0 ){
                            user_data.bl = bn.substring(0,bn.length-1);
                        } else{
                            user_data.bl = bn;
                        }
                        // cns.debug(bn);
                        // cns.debug(user_data.bl);
                        
                    } catch(e) {
                        errorReport(e);
                        continue;
                    }
                }

				selector.find("."+item)[method](user_data[item]).show();



				if(!me && $.inArray(item,img_arr) >= 0) {
					var this_img = selector.find("img."+item);
					this_img.attr("src","images/icon/bt_" + this_img.data("name") + "_normal.png");
				}
			}
		}

        var nkTmp = this_info.find(".user-avatar-bar .nk").html();
        if( nkTmp && nkTmp.length>0 ) this_info.find(".user-avatar-bar .nk").html( nkTmp.replaceOriEmojiCode() );

		if(user_data.mkp) this_info.find(".user-info-list .pn").val("******");
		if(user_data.mke) this_info.find(".user-info-list .em").val("******");
		if(user_data.mkb) {
			this_info.find(".user-avatar-bar .bd").hide();
			this_info.find(".user-info-list .bd").val("******");	
		}else{
            this_info.find(".user-avatar-bar .user-name").addClass("hidden");
        }


        if( user_data.st==2 ){
            this_info.find(".action, .sl, .bd, .bl").hide();
        }
    },

    showCustomInfo: function(user_data){
		var instance = this;
    	var this_gi = gi;
    	var this_gu = gu;

    	$(".screen-lock").show();
    	$(".user-info-load-area").fadeIn("fast");
        $(".user-info-load-area").addClass("transition1s");
    	$(".user-info-load-area .me").load('layout/layout.html .me-info-load',function(){
    		var this_info = $(this).find(".me-info-load");
            this_info._i18n();

    		//團體頭像
    		// this_info.find(".group-avatar img").attr("src",QmiGlobal.groups[gi].aut);
    		// avatarPos(this_info.find(".group-avatar img"),60);

    		//團體名稱
    		// this_info.find(".group-name").html(QmiGlobal.groups[gi].gn);

    		//頭像
    		// if(user_data.aut){
    		// 	this_info.find(".user-avatar.me > img").attr("src",user_data.auo);
    		// 	this_info.find(".user-avatar").data("auo",user_data.auo);

    		// 	//400存在css media min-width中 
    		// 	instance.userInfoAvatarPos(this_info.find(".user-avatar.me > img"));
    		// 	// $(".user-avatar .default").removeClass("default");
    		// }

    		// this_info.find(".user-info-list input").val("暫無資料");
    		// for( item in user_data){
    		// 	if(user_data[item]){
    		// 		// if(item == "bd"){
				  //   //     user_data[item] = user_data[item].substring(0,4) + "/" + user_data[item].substring(4,6) + "/" + user_data[item].substring(6);
      //   // 			}
      //   			this_info.find(".user-info-list ." + item).val(user_data[item]);
    		// 	}
    		// }

    		// if(user_data.mkp) this_info.find(".user-info-list .pn1").val("******");
    		// if(user_data.mke) this_info.find(".user-info-list .em").val("******");
    		// if(user_data.mkb) this_info.find(".user-info-list .bd").val("******");
    		this_info.find("input").removeAttr("readonly");

    		this_info.find(".bd").attr("readonly","true").off("click").click( {instance: instance}, function(){
    			cns.debug("todo: trigger datePicker");
    		});
    		this_info.find(".dp,.mv,.sl").parent().hide();
    		this_info.find(".bd").parent().parent().hide();
    		this_info.find(".user-info-back").hide();

    		this_info.find(".em, .pn1").parent().addClass("no-status");

    		// this_info.data("avatar-chk",false);
    		// $(".screen-lock").fadeOut("fast");
    		// this_info.fadeOut("fast");

    		// if(callback) callback(false);

    		if( user_data ){
    			this_info.data("isCustom", user_data.isCustom);
    			this_info.data("ci", user_data.ci);
	    		for( item in user_data){
	    			if(user_data[item]){
	    				// if(item == "bd"){
					    //     user_data[item] = user_data[item].substring(0,4) + "/" + user_data[item].substring(4,6) + "/" + user_data[item].substring(6);
	        // 			}
	        			this_info.find(".user-info-list ." + item).val(user_data[item]);
	    			}
	    		}
	    		this_info.find(".user-info-submit").text( $.i18n.getString("COMMON_DONE") );
	    	} else {
	    		this_info.find(".user-info-submit").text( $.i18n.getString("ADDRESSBOOK_ADD") );
	    		this_info.parent().removeClass("me-rotate");
	    	}
    		instance.userInfoEvent(this_info,true);
    	});
    },

    userInfoEvent: function(this_info,isNew){
		var instance = this;
    	this_info.unbind();
		
		this_info.find(".user-avatar").click(function(){
            var this_src = $(this).find(".user-pic").attr("src");
            if(!this_src) return false;

    		var img = new Image();
    		img.onload = function() {
    			var min_size = 500;
    			var this_width = this_height = 500;

    			//寬方形
    			var style = "width";
    			var add_class = "before1";
    			//高方形
    			if(this.width < this.height){
    				style = "height";
    				add_class = "before2";
    			}

    			if(this.width > 500) this_width = this.width;
    			if(this.height > 500) this_height = this.height;

				var img_show = window.open("layout/img_show.html", "", "width=" + this_width + ", height=" + this_height);
				var this_src = this.src;
	    		$(img_show.document).ready(function(){
	    			setTimeout(function(){
	    				var this_img = $(img_show.document).find("img.gallery");
	    				this_img.css(style,"100%");
	    				this_img.parent().addClass(add_class);
	    				this_img.attr("src",this_src);
	    			},300);
	    		});
			}
			img.src = this_src;
    	});	

        this_info.find(".user-avatar-bar:not(.me)").click(function(e){
            e.stopPropagation();
        });

    	if(isNew){

  

	    	this_info.find(".user-info-list input").bind("input",function(){
	    		//有更動即可按確定
		        this_info.find(".user-info-submit").addClass("user-info-submit-ready");
	    	});

	    	//更改資料 送出
	    	$(document).off("click",".user-info-submit-ready");
			$(document).on("click",".user-info-submit-ready",function(){
				if( this_info.data("isCustom") ){
	    			instance.editCustomInfo(this_info);
				} else {
	    			instance.addNewCustom(this_info);
				}
	    	});
    	}else{
    		this_info.find(".action-edit").click(function(){
	    		$(".user-info-load-area").addClass("user-info-flip");
	    		$(".user-info-load , .me-info-load").stop().animate({
					opacity:0
				},400);

	    		setTimeout(function(){
                    $(".user-info-load-area .me").removeClass("backface-visibility");
	    			$(document).find(".user-info-load-area .user").hide();
	    			$(".user-info-load , .me-info-load").stop().animate({
						opacity:1
					},400);
	    		},400);

                setTimeout(function(){
                    $(".user-info-load-area").removeClass("transition1s");
                    $(".user-info-load-area").removeClass("user-info-flip");
                    $(".user-info-load-area .me").addClass("adjust");
                },1000);
	    	});

            //刪除成員
            this_info.find(".user-info-delete").click(function(){

                instance.removeCustomInfo(this_info);
            });
    	}

    	//click fav
        this_info.find(".user-avatar-bar-favorite .fav").mouseup(function(){
            instance.clickUserInfoFavorite( $(this) );
        });
    },
	editCustomInfo: function(this_info){
    	var instance = this;
    	var new_name = this_info.find(".user-info-list .nk").val().trim().replace(/( +)/g," ").replace(/[&\|\\\\:\/!*^%$#@\-]/g,"");
    	if(new_name == ""){
    		toastShow( $.i18n.getString("USER_PROFILE_EMPTY_NAME") );
    		return false;
    	}
    	var ci = this_info.data("ci");
    	if(!ci){
    		cns.debug("editCustomInfo, no ci");
    		return;
    	}
    	
    	// load show
    	s_load_show = true;
		var api_name = "groups/"+gi+"/contact_users/"+ci;
        var headers = {
             "ui":ui,
             "at":at, 
             "li":lang
        };

        var body = {
		  nk: new_name // Nickname
		}
		var data = {};
		data.sl = this_info.find(".user-info-list .sl").val() // Slogan
		data.tt = this_info.find(".user-info-list .ti").val() // title
		data.pn1 = this_info.find(".user-info-list .pn1").val() // phone1
		data.pn2 = this_info.find(".user-info-list .pn2").val() // phone2
		data.ext = this_info.find(".user-info-list .et").val() // ext
		data.em = this_info.find(".user-info-list .em").val() // email
		// data.mv = this_info.find(".user-info-list .mv").val() // MVPN

		$.each( data, function(key, obj){
			if( obj ){
				body[key] = obj;
			}
		});

        var method = "put";
        ajaxDo(api_name,headers,method,false,body).complete(function(data){
        	//重置團體頭像、名稱的參數
        	if(data.status == 200){
        		//重置團體頭像、名稱 失敗也要重置
        		// var _groupList = QmiGlobal.groups;
        		// _groupList[gi].guAll[gu].nk = body.nk;
        		// _groupList[gi].guAll[gu].sl = body.sl;
        		// // *--* $.lStorage(ui,_groupList);
        		s_load_show = false;
        		
        		// 關閉load 圖示
        		QmiGlobal.ajaxLoadingUI.hide();

                //重置團體頭像、名稱的參數
                // getGroupCombo(gi,function(){
                //     updateAllAvatarName(gi,gu);    
                //     toastShow( $.i18n.getString("USER_PROFILE_UPDATE_SUCC") );
                // });

				var keys = ["nk","tt","pn1","pn2","ext","em"];
				for (var i = 0; i < keys.length; i++) {
					var key = keys[i];
					if( body.hasOwnProperty(key) ){
						instance.guAll[ci][key] = body[key];
					}
				}
        		instance.updateCustomPage();
        		// instance.updateCustomCount();

        		//結束關閉
        		this_info.find(".user-info-close").trigger("mouseup");
        	}
        });
    },
    addNewCustom: function(this_info){
    	var instance = this;
    	var new_name = this_info.find(".user-info-list .nk").val().trim().replace(/( +)/g," ").replace(/[&\|\\\\:\/!*^%$#@\-]/g,"");
    	if(new_name == ""){
    		toastShow( $.i18n.getString("USER_PROFILE_EMPTY_NAME") );
    		return false;
    	}
    	
    	// load show
    	s_load_show = true;
		var api_name = "groups/"+gi+"/contact_users";
        var headers = {
             "ui":ui,
             "at":at, 
             "li":lang
        };

        var body = {
		  nk: new_name, // Nickname
		  sl: this_info.find(".user-info-list .sl").val() // Slogan
		}
		var data = {};
		data.tt = this_info.find(".user-info-list .ti").val() // title
		data.pn1 = this_info.find(".user-info-list .pn1").val() // phone1
		data.pn2 = this_info.find(".user-info-list .pn2").val() // phone2
		data.ext = this_info.find(".user-info-list .et").val() // ext
		data.em = this_info.find(".user-info-list .em").val() // email
		// data.mv = this_info.find(".user-info-list .mv").val() // MVPN

		$.each( data, function(key, obj){
			if( obj ){
				body[key] = obj;
			}
		});

        var method = "post";
        ajaxDo(api_name,headers,method,false,body).complete(function(data){
        	//重置團體頭像、名稱的參數
        	if(data.status == 200){
        		//重置團體頭像、名稱 失敗也要重置
        		// var _groupList = QmiGlobal.groups;
        		// _groupList[gi].guAll[gu].nk = body.nk;
        		// _groupList[gi].guAll[gu].sl = body.sl;
        		// // *--* $.lStorage(ui,_groupList);
        		s_load_show = false;
        		
        		// 關閉load 圖示
        		QmiGlobal.ajaxLoadingUI.hide();

                //重置團體頭像、名稱的參數
                // getGroupCombo(gi,function(){
                //     updateAllAvatarName(gi,gu);    
                //     toastShow( $.i18n.getString("USER_PROFILE_UPDATE_SUCC") );
                // });

				var data = $.parseJSON(data.responseText);
				if(!data || !data.cl) return;
				data = data.cl;
		    	data.isCustom = true;
		        instance.guAll[ data.ci ] = data;
		        instance.ucl[ data.ci ] = data;
		        instance.guAll[data.ci].fav = false;
		        instance.customCnt = Object.keys(instance.ucl).length;


        		instance.updateCustomPage();
        		instance.updateCustomCount();

        		//結束關閉
        		this_info.find(".user-info-close").trigger("mouseup");
        	}
        });
    },
	removeCustomInfo: function(this_info){
    	var instance = this;
    	var ci = this_info.data("ci");
    	if(!ci){
    		cns.debug("removeCustomInfo, no ci");
    		return;
    	}
    	
    	// load show
    	s_load_show = true;
		var api_name = "groups/"+gi+"/contact_users/"+ci;
        var headers = {
             "ui":ui,
             "at":at, 
             "li":lang
        };

        var method = "DELETE";
        ajaxDo(api_name,headers,method,false,null).complete(function(data){
        	//重置團體頭像、名稱的參數
        	if(data.status == 200){
        		s_load_show = false;
        		
        		// 關閉load 圖示
        		QmiGlobal.ajaxLoadingUI.hide();

		        if( instance.ucl.hasOwnProperty(ci) ){
		        	delete instance.ucl[ci];
		        }
		        instance.customCnt = Object.keys(instance.ucl).length;
		        if( instance.guAll.hasOwnProperty(ci) ){
		        	delete instance.guAll[ci];
		        }
		        if( instance.favGuAll.hasOwnProperty(ci) ){
		        	delete instance.favGuAll[data.ci];
					instance.favCnt--;
		        }


        		instance.updateCustomPage();
        		instance.updateCustomCount();

        		//結束關閉
        		this_info.find(".user-info-close").trigger("mouseup");
        	}
        });
	},

	//這也可以合併..avatarPos
    userInfoAvatarPos: function(img){
    	//魔術數字 是個人資料的長寬比例400/250 小於這個比例 就要以寬為長邊
		var magic_number = 1.6;
		//偵測長寬
		var user_info_width = $(".user-info-load-area .width-chk").width() || 400;
		//調整長寬
		img.load(function() {

			//高為長邊
			if((this.width / this.height) > magic_number){
				img.css("height",250);
				img.css("margin-left",((img.width()-user_info_width)/2)* -1);
                img.css("opacity",0);
			}else{
			//寬為長邊
				img.css("width",user_info_width);
				img.css("margin-top",((img.height()-250)/2)* -1);
                img.css("opacity",0);
			}

            img.stop().animate({
                opacity:1
            },300);
        });
    },

    clickUserInfoFavorite: function(this_fav ){
		var instance = AddressBook;
        var this_info = this_fav.parents(".user-info-load");
        var this_gu = this_info.data("this-info-gu");
        var this_gi = this_info.data("this-info-gi");
        
        if( null==this_gu || null==this_gi ) return;

        var result;
        var succFav;
        if( this_fav.hasClass("active") ){
            result = updateAddressbookFavoriteStatusApi(this_gi, null, [this_gu] );
            succFav = false;
        } else {
            result = updateAddressbookFavoriteStatusApi(this_gi, [this_gu], null );
            succFav = true;
        }
        result.complete(function(data){
            if(data.status == 200){
                //update user fav
                if( instance.guAll && instance.guAll.hasOwnProperty(this_gu) ){
                	var mem = instance.guAll[this_gu];
                    mem.fav = succFav;
                    if(succFav){
                        this_fav.parent().find(".active").show();
                        this_fav.parent().find(".deactive").hide();
                        if( !instance.favGuAll.hasOwnProperty(this_gu) ){
	                        instance.favGuAll[this_gu] = mem;
	                        instance.favCnt++;
	                    }
                    } else {
                        if( instance.favCnt<0 ) instance.favCnt = 0;
                        this_fav.parent().find(".active").hide();
                        this_fav.parent().find(".deactive").show();
                        if( instance.favGuAll.hasOwnProperty(this_gu) ){
                        	delete instance.favGuAll[this_gu];
	                        instance.favCnt--;
                        }
                    }

                    $(".subpage-addressBook .favorite .detail").html( $.i18n.getString("COMPOSE_N_MEMBERS",(instance.favCnt)?instance.favCnt:0 ) );
                    instance.updateFavoritePage();
                }
            }
        });
    },

	/*
               ██████╗██╗   ██╗███████╗████████╗ ██████╗ ███╗   ███╗          
              ██╔════╝██║   ██║██╔════╝╚══██╔══╝██╔═══██╗████╗ ████║          
    █████╗    ██║     ██║   ██║███████╗   ██║   ██║   ██║██╔████╔██║    █████╗
    ╚════╝    ██║     ██║   ██║╚════██║   ██║   ██║   ██║██║╚██╔╝██║    ╚════╝
              ╚██████╗╚██████╔╝███████║   ██║   ╚██████╔╝██║ ╚═╝ ██║          
               ╚═════╝ ╚═════╝ ╚══════╝   ╚═╝    ╚═════╝ ╚═╝     ╚═╝          
                                                                              	*/

	//顯示我的最愛頁面
	showCustomPage: function( event ){//isBackward
		var instance = event.data.instance;
		var pageID = "page-addressbook_Custom";
		instance.updateCustomPage();
		$("#"+pageID +" .contact-scroll").height( $(window).height()-112 );
		$.mobile.changePage("#"+pageID, { transition: "slide"});
		// if( true==isBackward ) $.mobile.changePage("#"+pageID, { transition: "slide", reverse: true} );
		// else  $.mobile.changePage("#"+pageID, { transition: "slide"});
	},

	updateCustomPage: function(){
		var instance = AddressBook;
		var pageID = "page-addressbook_Custom";
		var page = $( "#"+pageID );

		if( !page || page.length==0 ){
			page = $('<div data-role="page" id="'+pageID+'" class="contact-subpages">'
	            +'<div data-theme="c" data-role="header" data-position="fixed" data-tap-toggle="false">'
	                +'<div class="page-back" customize><img src="images/navi/navi_icon_back.png"/></div>'
	                +'<h3 class="page-title">成員列表</h3>'
	            +'</div><div class="subpage-addressBook"></div></div>');
			$("#page-group-main").after(page);
		}
		// else if( gi==page.data("gi") ){
		// 	$.mobile.changePage("#"+pageID);
		// 	return;
		// }
		// page.data("gi", gi);

		page.find(".page-title").html( $.i18n.getString("ADDRESSBOOK_CUSTOM") );
		page.find(".page-back").off("click").click( instance.showMainContact );
		
		var subPage = page.find(".subpage-addressBook");
		subPage.html("");

		//----- title -----
		var title = $("<div class='contact-titleBar'></div>");
		var nameArea = $("<div class='nameArea'></div>");
		nameArea.append("<div class='name'>"+$.i18n.getString("ADDRESSBOOK_CUSTOM")+"</div>");
		// nameArea.append("<div class='arrow'></div>");
		title.append(nameArea);
		title.append("<div class='btn'></div>");
		title.append("<div class='addressBook-add'><img></div>");
		subPage.append(title);

		//---- part below title bar -----
		var subPageBottom = $('<div class="contact-scroll"></div>');
		subPage.append(subPageBottom);

		// nameArea.off("click").click( function(){
		// 	//show sub divs
		// 	subbranchList.slideToggle();
		// 	title.find(".arrow").toggleClass("open");
		// });
		title.find(".btn").off("click").click( function(){
			instance.switchListAndGrid( $(this), subPageBottom );
		});

		//set add member button
		title.find(".addressBook-add").off("click").click( function(e){
			// AddressBook.showAddMemberPage();
			AddressBook.showCustomInfo();
	    	//name card me-info not showing
	    	// this_info.find(".me-info-load").show();
		});

		//mem-title
		var subTitle = $("<div class='contact-mems-title'></div>");
		subTitle.append( '<div class="count">'+0+'</div>');
		subTitle.append( '<div class="text">'+$.i18n.getString("COMPOSE_N_MEMBERS", "")+'</div>');
		subPageBottom.append(subTitle);
		
		//mem
		// var memObject = {};
		// var count = 0;
		// $.each(guAllExsit,function(key,mem){
		// 	if( mem.fav ){
		// 		count++;
		// 		memObject[key] = mem;
		// 	}
		// });
		var memContainer = instance.generateMemberGrid(instance.ucl);
		subPageBottom.append(memContainer);
		var memListContainer = instance.generateMemberList(instance.ucl, instance.showCustomPage);
		subPageBottom.append(memListContainer);
		if( instance.isList ){
			title.find(".btn").addClass("list");
			memContainer.css("display","none");
			instance.setOnMemListScroll();
		} else {
			memListContainer.css("display","none");
			instance.setOnMemGridScroll();
		}

		$(".contact-scroll").height( $(window).height()-112 );
		if( 0==instance.customCnt ){
			subTitle.hide();
			memContainer.append("<div class='noMem'>"+$.i18n.getString("MEMBER_X_GROUP_NO_MEMBER", $.i18n.getString("ADDRESSBOOK_CUSTOM"))+"</div>");
			memListContainer.append("<div class='noMem'>"+$.i18n.getString("MEMBER_X_GROUP_NO_MEMBER", $.i18n.getString("ADDRESSBOOK_CUSTOM"))+"</div>");
		} else {
			subTitle.find(".count").html(instance.customCnt);
		}
	},
	updateCustomCount: function(){
		var instance = this;
		//get html container
		var rowContainer = $(".subpage-addressBook .contact-rows");
		if( !rowContainer || rowContainer.length<=0 ) return;
		//add row all
		rowContainer.find(".row.custom .mem").html($.i18n.getString("COMPOSE_N_MEMBERS",(instance.customCnt)?instance.customCnt:0 ));
	},
};