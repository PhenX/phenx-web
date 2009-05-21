<?php
$d = reset(array_keys($_GET));

preg_match('/^(?P<mime>[a-z0-9\/+-.]+)(;charset=(?P<charset>[a-z0-9-])+)?(?P<base64>;base64)?\,(?P<data>.*)?/i', $d, $o);

$charset = $o['charset'] ? $o['charset'] : 'US-ASCII';
$mime = $o['mime'] ? $o['mime'] : 'text/plain';

header("Content-Type: $mime; charset=$charset");
header("Cache-Control: max-age=604800");
echo $o['base64'] ? base64_decode($o['data']) : $o['data'];