
var FileSharing = function(){

}

//api_name,headers,method,load_show_chk,body,ajax_msg_chk,err_hide, privateUrl
FileSharing.prototype = {
	headers:{
		ui:ui,
		at:at,
		li:lang
	},
	ajaxArgs: {
		api_name:"",
		method:"",
		load_show_chk:"",
		body:"",
		ajax_msg_chk:"",
		err_hide:"",
		privateUrl:""
	},
	ajaxDo: function(args){
		$.extend(args.headers,this.headers);
	    $.extend(this.ajaxArgs,args);

	    console.debug("ajaxArgs",this.ajaxArgs);

	    ajaxTransfer.call(this.ajaxArgs);

	    // return $.ajax(ajaxSetting);
	},
	events: function(){
		// var $fileSharing = $("section.fileSharing");


	}
}

// })