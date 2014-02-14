<?php 
 $_POST['api_url'] = 'http://54.238.141.68:8090/apiv1/register/otp';
 $_POST['headers'] = 'cc: 
pn: 
di: 
ug: ';

// $test = '{"result":"","status":"400"}';

// print_r(json_decode($test));exit;



$temp = str_replace("\n", "@", $_POST['headers']);
$headers = explode("@",$temp);

$ch = curl_init();
//Setup some of our options.
curl_setopt($ch, CURLOPT_URL, $_POST['api_url']);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$result = curl_exec($ch);
$http_status_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
//Close cURL handle
curl_close($ch);

 if(isJson($result) && $result){
  $json = '{"result":'.$result.',"status":"'.$http_status_code.'"}';
 }else{
  $json = '{"result":"'.$result.'","status":"'.$http_status_code.'"}';
 }
 
print $json;
exit;

function isJson($string) {
 json_decode($string);
 return (json_last_error() == JSON_ERROR_NONE);
}

//http://webcache.googleusercontent.com/search?q=cache:9FKmS743qGAJ:http://www.wretch.cc/blog/bowzi923111/14194180+&cd=2&hl=zh-TW&ct=clnk&gl=tw
//https://www.google.com.tw/url?sa=t&rct=j&q=&esrc=s&source=web&cd=2&cad=rja&ved=0CDYQFjAB&url=http%3A%2F%2Fwww.wretch.cc%2Fblog%2Fbowzi923111%26category_id%3D11799270&ei=T1W9Ut61MNHYkgW9_IGwCw&usg=AFQjCNFCaF4valpeLfgRHKF_97dbzNgKIQ&sig2=H3G9_ZwVgSFmxiBBAKb-6Q


$headers = array("av: 1.0","os: android","li: zh_TW");
// av: 1.0
// os: android
// li: zh_TW
$post = '';
$url = 'http://54.238.141.68:8090/apiv1/sys/version';
// $url = 'http://www.google.com';
// $ch = curl_init();
// curl_setopt($ch, CURLOPT_URL,$url);
// curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
// if($post){
//  curl_setopt($ch,CURLOPT_POST,true);
//  curl_setopt($ch,CURLOPT_POSTFIELDS,$post);
// }
// $http_status_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
// curl_setopt($ch, CURLOPT_RETURNTRANSFER,1);
// $result=curl_exec ($ch);
// curl_close ($ch);

// $html_brand = "www.google.com";
// $ch = curl_init();

// $options = array(
//   CURLOPT_URL            => $html_brand,
//   CURLOPT_RETURNTRANSFER => true,
//   CURLOPT_HEADER         => true,
//   CURLOPT_FOLLOWLOCATION => true,
//   CURLOPT_ENCODING       => "",
//   CURLOPT_AUTOREFERER    => true,
//   CURLOPT_CONNECTTIMEOUT => 120,
//   CURLOPT_TIMEOUT        => 120,
//   CURLOPT_MAXREDIRS      => 10,
// );
// curl_setopt_array( $ch, $options );
// $response = curl_exec($ch);
// $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

// if ( $httpCode != 200 ){
//  echo "Return code is {$httpCode} \n"
//  .curl_error($ch);
// } else {
// echo "<pre>".htmlspecialchars($response)."</pre>";
// }

// curl_close($ch);
// exit;



$ch = curl_init();

//Setup some of our options.
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

//Execute the cURL request.


//Get the resulting HTTP status code from the cURL handle.

$result = curl_exec($ch);
$http_status_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
//Close cURL handle
curl_close($ch);

var_dump($http_status_code);




// Date: Thu, 26 Dec 2013 05:54:41 GMT
// Content-Length: 33
// Content-Type: text/plain


// {"os":"android","ug":"0","ms":""}

?>