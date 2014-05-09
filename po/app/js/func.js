$(function(){
	function eee(){
		console.log(222);
	}
	
	//sha1 and base64 encode
	function toSha1Encode(string){
		var hash = CryptoJS.SHA1(string);
	    var toBase64 = hash.toString(CryptoJS.enc.Base64);
	    return toBase64;
	}
	
});