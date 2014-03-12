<?php

for ($i = 1; $i < 5; $i++) {
  sleep(1);
  print(str_repeat(' ', 0));
  print("<p>wait $i s</p>");
  flush();
  print("22");
    ob_flush(); // this is needed  
}
?>
