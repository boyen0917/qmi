var FSObj = function(){
}
//api_name,headers,method,load_show_chk,body,ajax_msg_chk,err_hide, privateUrl
FSObj.prototype = {
	ajaxSetting: {
		api_name:"",
		headers:"",
		method:"",
		load_show_chk:"",
		body:"",
		ajax_msg_chk:"",
		err_hide:"",
		privateUrl:""
	},
	ajax: function(args){
	    $.extend(this.ajaxSetting,args);

	    console.debug("ajaxSetting",this.ajaxSetting);

	    // return $.ajax(ajaxSetting);
	}
}