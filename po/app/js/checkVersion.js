/* depend: init.js, tool.js */
$(function(){
	g_currentVersion = "0.2.1";
    checkVersion = function(){

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
			    	g_currentVersion = "0.0.0";
			    } else {
			    	g_currentVersion = versionData.ver;
			    }
	    		var api_name = "/sys/version";
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

				    	if( g_currentVersion != getS3_result.av ){
	        				g_currentVersion = getS3_result.av;
				    		console.debug("update ver to ", g_currentVersion);
				    		$.lStorage("_ver",{ver:g_currentVersion});
				    		$(".version_update_lock").fadeIn();
				    		setTimeout( function(){
				    			if( false==clearCache() ){
				    				//if error clear cache
				    				$(".version_update_lock").hide();
				    			}
				    		}, 1000 );
				    	} else {
				    		console.debug("latest ver", g_currentVersion);
				    	}
		        	}
		        });
		    } catch(e){
		    	console.debug(e.stack);
		    	try{
		    		var gui = require('nw.gui');
		    		gui.App.clearCache();
		    		gui.Window.get().reload();
		    		console.debug("update successed");
		    		return true;
					// alert("clear cache 1 succ");
		    	} catch(e){
		    		console.debug(e.stack);
		    	}
		    }
		// }
    }
	checkVersion();
});