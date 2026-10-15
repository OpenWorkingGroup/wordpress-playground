<?php
// Inspect metadata and archive structure without evaluating component code.
function fail($message) { fwrite(STDERR, $message."\n"); exit(2); }
function header_value($text, $key) {
 preg_match('/^[ \t\/*#@]*'.preg_quote($key, '/').':[ \t]*([^\r\n]+)/mi', substr($text,0,8192),$match);
 return trim($match[1]??'');
}
if ($argc !== 5) fail('Expected mode, kind, path and slug');
[, $mode, $kind, $path, $slug] = $argv;
if (!in_array($kind,['plugin','theme'],true)) fail('Invalid component type');
$key=$kind==='plugin'?'Plugin Name':'Theme Name';
if ($mode==='source') {
 $files=$kind==='theme'?[$path.'/style.css']:glob($path.'/*.php');
 $found=0;
 foreach($files as $file) {
  if(!is_file($file))continue;
  $text=file_get_contents($file,false,null,0,8192);
  if(header_value($text,$key)==='')continue;
  $found++;
  if(header_value($text,'Version')==='')fail('A Version header is required');
 }
 if($found!==1)fail('Expected exactly one component entrypoint with Name and Version headers');
 if(!is_file($path.'/.distignore'))fail('Add and review .distignore before packaging (see tools/packaging/distignore.example)');
 exit(0);
}
if($mode!=='archive')fail('Invalid mode');
$zip=new ZipArchive();
if($zip->open($path,ZipArchive::CHECKCONS)!==true)fail('Invalid ZIP');
$found=0;
for($i=0;$i<$zip->numFiles;$i++) {
 $name=$zip->getNameIndex($i);
 if(!str_starts_with($name,$slug.'/')||in_array('..',explode('/',$name),true)||str_contains($name,'\\'))fail('Unexpected ZIP path');
 $relative=substr($name,strlen($slug)+1);
 $candidate=$kind==='theme'?$relative==='style.css':preg_match('/^[^\/]+\.php$/',$relative);
 if($candidate&&header_value($zip->getFromIndex($i),$key)!=='')$found++;
}
if($found!==1)fail('Archive must retain exactly one component entrypoint');
$zip->close();
file_put_contents($path.'.sha256',hash_file('sha256',$path).'  '.basename($path)."\n");
