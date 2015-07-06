/* depend: init.js, tool.js */
$(function(){
	g_currentContainerVersion = "0.2.1";
	g_currentVersion = "0.0.0";
	// g_downloadPath = "http://webdev.cloud.mitake.com.tw/qmipc/download.html";


    checkContainerVersion = function( onDone ){
    	try{
    		if( typeof(getWebCntrVersion)!= "undefined" ){
	    		var versionObj = getWebCntrVersion();
	    		g_currentContainerVersion = versionObj.APP_VERSION;
	    		cns.debug( getComputerName() );
	    	} else {
	    		g_currentContainerVersion = require('nw.gui').App.manifest.version;
	    	}

			if( null==g_currentContainerVersion ){
				g_currentContainerVersion = "0.0.0";
			}
			$("#container_version span.container").html(g_currentContainerVersion);

	  //   	var api_name = "sys/version";
	  //   	var headers = {
	  //   		os: 2,
			// 	tp: 1,
			// 	av: g_currentContainerVersion,
			// 	li: lang
			// };
			// var method = "get";
	  //   	var result = ajaxDo(api_name,headers,method,false);
	  //       result.complete(function(data){
		 //    	if(data.status == 200){
		 //    		var getS3_result =$.parseJSON(data.responseText);

		 			var getS3_result = {av:"0.6.5"};

		 			cns.debug( "old:", g_currentContainerVersion, "new:", getS3_result.av );
			    	if( versionCompare(g_currentContainerVersion, getS3_result.av)>0 ){
			    		console.debug("need update container ver");
			    		// $(".version_update_lock").fadeIn();
			    		onDone(true);
			    		popupShowAdjust(
			    			$.i18n.getString("LANDING_PAGE_UPDATE_CONTAINER_TITLE"),	//"Need update container version"
			    			$.i18n.getString("LANDING_PAGE_UPDATE_CONTAINER_DESCRIPTION"),	//"Please click ok to download newest container version.",
			    			$.i18n.getString("COMMON_OK"),null,[onClickDownload]);
			    	} else {
			    		onDone(false);
			    		console.debug("latest container ver", g_currentContainerVersion);
			    	}
		    // 	}
		    // });
    	} catch(e){
			$("#container_version span.container").html("0.0.0");
    		console.debug("ignore container ver", e.stack);
    		onDone(false);
    		// onDone(true);
    		// $(".container_update_lock").show();
    	}
    }

    versionCompare = function(oldVerStr, newVerStr){
    	var oldVerAry = oldVerStr.split(".");
    	var newVerAry = newVerStr.split(".");
    	for( var i=0; i<oldVerAry.length; i++ ){
    		if( newVerAry[i] == oldVerAry[i] ){
	    		cns.debug("compare(str)",i,newVerAry[i],oldVerAry[i]);
    			continue;
    		} else {
	    		newVerAry[i] = parseInt( newVerAry[i] );
	    		oldVerAry[i] = parseInt( oldVerAry[i] );
	    		cns.debug("compare(int)",i,newVerAry[i],oldVerAry[i]);
    			cns.debug( "result", (newVerAry[i]- oldVerAry[i] ) );
    			return (newVerAry[i]- oldVerAry[i] );
    		}
    	}
    	cns.debug( "result", (newVerAry[i]- oldVerAry[i] ) );
    	return 0;
    }

    onClickDownload = function(){
		$(".container_update_lock").show();
    	var link = $(".container_update_lock a");
    	// link.attr("href",g_downloadPath);
    	link.trigger("click");
    	console.debug("download clicked");
    	try{
	    	require('nw.gui').App.quit();
	    } catch(e){
	    	console.debug(e.stack);
	    }
    }

    checkWebVersion = function( onDone ){

    // 	if( (typeof clearCache != 'function')|| 'undefined'==lang ){
    // 		console.debug("clearCache",typeof clearCache, "lang", typeof lang );
    // 		try{
	   //  		var gui = require('nw.gui');
	   //  		gui.App.clearCache();
	   //  		gui.Window.get().reload();
	   //  		console.debug("update successed");
	   //  		return true;
				// // alert("clear cache 1 succ");
	   //  	} catch(e){
	   //  		console.debug(e.stack);
	   //  	}
	   //  } else{
	    	try{
			    var versionData = $.lStorage("_ver");
			    if( null==versionData || null==versionData.ver ){
			    	
			    } else {
			    	g_currentVersion = versionData.ver;
			    }
				$("#container_version span.web").html("("+g_currentVersion+")");
	    		var api_name = "sys/version";
	    		var headers = {
	    			os: 2,
					tp: 0,
					av: g_currentVersion,
					li: lang
				};
				var method = "get";
	    		var result = ajaxDo(api_name,headers,method,false);
	        	result.complete(function(data){
		        	if(data.status == 200){
		        		var getS3_result =$.parseJSON(data.responseText);

				    	if( g_currentVersion != getS3_result.av && typeof(require)!="undefined" ){
	        				g_currentVersion = getS3_result.av;
				    		console.debug("update ver to ", g_currentVersion);
				    		$.lStorage("_ver",{ver:g_currentVersion});
				    		$(".version_update_lock").fadeIn();
				    		onDone(true);
				    		setTimeout( function(){
				    			if( false==clearCache() ){
				    				//if error clear cache
				    				$(".version_update_lock").hide();
				    			}
				    		}, 1000 );
				    	} else {
				    		onDone(false);
				    		console.debug("latest ver", g_currentVersion, getS3_result.av);
				    	}
		        	} else {
						console.debug("fail to get version");
						onDone(false);
					}
		        });
		    } catch(e){
		    	console.debug(e.stack);
		    	try{
		    		var gui = require('nw.gui');
		    		gui.App.clearCache();
		    		gui.Window.get().reload();
		    		console.debug("update successed");
		    		onDone(false);
		    		return true;
					// alert("clear cache 1 succ");
		    	} catch(e){
		    		console.debug(e.stack);
		    		onDone(false);
		    	}
		    }
		// }
    }

    checkVersion = function( onDone ){
    	checkWebVersion( function(needUpdate){
    		if( false==needUpdate ){
	    		checkContainerVersion(function(needUpdate){
	    			if( false==needUpdate ) onDone();
	    		});
    		}
    	});
    }
});