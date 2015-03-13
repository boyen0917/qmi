(function(){
	var gui = require('nw.gui');
	var manifest = gui.App.manifest;
	var nWindow = gui.Window;
	var dir = "assist/";

	function getAssistantPath(){
		return dir + (/^win/.test(process.platform) ? "W":"M") + manifest.assistant.name + "-" + manifest.assistant.version;
	}
	try{
		nWindow.get().evalNWBin(null, getAssistantPath());
	}catch(e){
		console.log("Assistant load failed." + e);
	}
})();