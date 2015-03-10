$(function(){
	g_currentVersion = "0.1.7";
    checkVersion = function(){
    	try{
	    	var currentVersion = $.lStorage("_ver");
	    	if( null==currentVersion || (g_currentVersion != currentVersion.ver) ){
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
	    } catch(e){
	    	console.debug(e);
	    }
    }
	checkVersion();
});