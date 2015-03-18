(function(){
	function getAssistantPath(){
		var gui = require('nw.gui');
		var manifest = gui.App.manifest;
		var dir = "assist/";
		return dir + (/^win/.test(process.platform) ? "W":"M") + manifest.assistant.name + "-" + manifest.assistant.version;
	}
	try{
		require('nw.gui').Window.get().evalNWBin(null, getAssistantPath());
	}catch(e){
		console.log("Assistant load failed." + e);
	}
})();