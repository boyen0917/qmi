<?php 
if(@$_POST['opt'] == "update"){
 $filename = "file_list.json";
 
 $fp=fopen($filename,"w");
 fputs($fp,$_POST["json_string"]);
 fclose($fp);
 
 exit;
}


if(isset($_GET['files']))
{
  
 $error = false;
 $files = array();
 
 $file_path='files/';
  
 foreach($_FILES as $file)
 {
  $tmp = explode('.', $file['name']);
  $ext = end($tmp);
  if($ext == 'ipa')
  {
   $new_filename = 'ios.ipa';
//    $log_file_type = 'ios';
  }
  elseif($ext == 'plist')
  {
   $file_path='/var/www/localhost/htdocs/project-o-web/po/iosplist/';
   $new_filename = 'ios.plist';
//    $log_file_type = 'plist';
  }
  else
  {
   $new_filename = 'android.apk';
//    $log_file_type = 'android';
  }

//   $user_ip = $this->get_real_ip();
//   $upload_log_dir = '/localhost/htdocs/log/';
//   $log_content = '
// ip : '.$user_ip.'
// file type : '.$log_file_type.'
// file name : '.$filename.'.'.$ext.'
// time : '.date("H:i:s").'
// __________________________
//                 ';

//   $logfile = $upload_log_dir.date("Y_m_d").".log";
//   $fp = fopen ($logfile, "a");
//   fwrite($fp,$log_content);
//   fclose($fp);
  
  if(move_uploaded_file($file['tmp_name'], $file_path.$new_filename))
  {
   $files[] = $file_path .$new_filename;
  }
  else
  {
   $error = true;
  }
 }
 $data = ($error) ? array('error' => 'There was an error uploading your files') : array('files' => $files);
}

echo json_encode($data);

?>