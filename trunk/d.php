<?php
$parts = explode(',', reset(array_keys($_GET)));

$options = explode(';', $parts[0]);
$data = $parts[1];

$mime = 'text/plain';
$charset = 'US-ASCII';
foreach($options as $o){
  if ($o == 'base64')
    $data = base64_decode($data);
  else if (preg_match('/^charset=(.*)/', $o, $c))
    $charset = $c[1];
  else 
    $mime = $o;
}

header("Content-Type: $mime; charset=$charset");
header("Cache-Control: max-age=604800");
echo $data;