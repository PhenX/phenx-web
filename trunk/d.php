<?php
$d = reset(array_keys($_GET));
$comma_pos = strpos($d, ',');
$options = explode(';', substr($d, 0, $comma_pos));
$data = substr($d, $comma_pos ? $comma_pos+1 : null);

$mime = 'text/plain';
$charset = 'US-ASCII';

foreach($options as $o){
	if (!$o) break;
  if ($o == 'base64')
    $data = base64_decode($data);
  else if (preg_match('/^charset=(.*)/', $o, $c) && $c)
    $charset = $c[1];
  else 
		$mime = $o;
}

header("Content-Type: $mime; charset=$charset");
header("Cache-Control: max-age=604800");
echo $data;