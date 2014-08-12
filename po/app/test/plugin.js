(function($) {
	//localstorage for object
    $.lStorage = function(key,value) {
    	console.log(localStorage[key]);
		if(value){
			
		}else{
			return $.parseJSON(localStorage[key])
		}
    };
})(jQuery);