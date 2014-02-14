<?php 



if($_POST){
 $temp = str_replace("\n", "@", $_POST['headers']);
 $headers = explode("@",$temp);
 
 $ch = curl_init();
 //Setup some of our options.
 curl_setopt($ch, CURLOPT_URL, $_POST['api_url']);
 curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
 
 if($_POST['method'] == 'post'){
  curl_setopt($ch, CURLOPT_POST, true); // 啟用POST
  curl_setopt($ch, CURLOPT_POSTFIELDS, $_POST['body']);
 }
 
 if($_POST['method'] == 'put'){
  curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "PUT");
 }
 
 curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
 
 $result = curl_exec($ch);
 $http_status_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
 //Close cURL handle
 curl_close($ch);
 if($http_status_code == 200){
     if(isJson($result) && $result){
      $json = '{"result":'.$result.',"status":"200"}';
     }else{
      $json = '{"result":"'.$result.'","status":"200"}';
     }
 }else{
     $json = '{"result":"","status":"'.$http_status_code.'"}';
 }
  
 print $json;
}else{
 print "幹嘛這樣";
}

function isJson($string) {
 json_decode($string);
 return (json_last_error() == JSON_ERROR_NONE);
}
?>