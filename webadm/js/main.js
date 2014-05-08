
var base_url = "https://apserver.mitake.com.tw/apiv1/";

function loginFun(pno,pwd){
    var id = "+886" + pno.substring(1);
    //登入認證
    var api_name = "login";
    var headers = {
        "id":id,
        "up":toSha1Encode(pwd), 
        "ns":"",
        "li":"zh_TW"
    };
    var method = "post";
    return result = ajaxDo(api_name,headers,method,true);

}

//sha1 and base64 encode
function toSha1Encode(string){
    var hash = CryptoJS.SHA1(string);
    var toBase64 = hash.toString(CryptoJS.enc.Base64);
    return toBase64;
}

function ajaxDo(api_name,headers,method,async,body){
    //console.log(api_url);
    var api_url = base_url + api_name;
    var myRand = Math.floor((Math.random()*1000)+1);
    
    if(async){
    	var result = $.ajax ({
            url: api_url,
            type: method,
            headers:headers,
            data:body
        });/* ajax結束 */
    }else{
    	var result = $.ajax ({
            url: api_url,
            type: method,
            headers:headers,
            async:false,
        });/* ajax結束 */
    }
    
    return result;
}