<?php

print_r($GLOBALS);

if ($_FILES["file"]["error"] > 0) {
  echo "Error: " . $_FILES["file"]["error"] . "<br>";
} else {
  echo "Upload: " . $_FILES["file"]["name"] . "<br>";
  echo "Type: " . $_FILES["file"]["type"] . "<br>";
  echo "Size: " . ($_FILES["file"]["size"] / 1024) . " kB<br>";
  echo "Stored in: " . $_FILES["file"]["tmp_name"];
}


$method = strtolower($_SERVER['REQUEST_METHOD']);
$data = array();

switch ($method) {
    case 'get':
        $data = $_GET;
        break;
    case 'post':
        $data = $_POST;
        break;
    case 'put':
    	$qq=1234;
        $data = json_decode(file_get_contents("php://input"), true);
        break;
}

var_dump($data);

ob_start();
echo print_r($GLOBALS);
$val = ob_get_contents();

$logfile = "upload.log";
$fp = fopen ($logfile, "w");

fwrite($fp,$val);
fclose($fp);

ob_end_clean();


?>