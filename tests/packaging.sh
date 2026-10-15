#!/bin/sh
set -eu
root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
fixture=$(mktemp -d)
trap 'rm -rf "$fixture"' EXIT HUP INT TERM
mkdir -p "$fixture/example"
printf '<?php\n/*\nPlugin Name: Example\nVersion: 1.0.0\n*/\n' > "$fixture/example/example.php"
printf '.env\n.distignore\n' > "$fixture/example/.distignore"
printf 'fixture\n' > "$fixture/example/.env"
sh "$root/scripts/package-extension.sh" plugin "$fixture/example" "$fixture/dist"
php -r '$z=new ZipArchive();$z->open(glob($argv[1]."/*/*.zip")[0]);if($z->locateName("example/example.php")===false||$z->locateName("example/.env")!==false)exit(1);' "$fixture/dist"
test -f "$root/themes/twentytwentyfive/templates/index.html"
test -d "$root/plugins"
echo 'Starter layout and native packaging passed.'
