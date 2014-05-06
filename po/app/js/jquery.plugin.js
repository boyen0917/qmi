(function($) {
	//localstorage for object
    $.lStorage = function(key,value) {
		if(value){
			if(typeof(value) == "object"){
				value = JSON.stringify(value);
	    	}
			localStorage[key] = value;
		}else{
			return $.parseJSON(localStorage[key])
		}
    };
})(jQuery);