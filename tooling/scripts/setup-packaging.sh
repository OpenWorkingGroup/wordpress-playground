#!/bin/sh
set -eu
root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
php_bin=${PHP_BIN:-php}
"$php_bin" -r 'if(PHP_VERSION_ID<80000||!extension_loaded("zip")){fwrite(STDERR,"PHP 8+ with ZipArchive is required.\n");exit(1);}'
mkdir -p "$root/.tools/wp-cli"
export WP_CLI_PACKAGES_DIR="$root/.tools/wp-cli/packages"
export WP_CLI_CACHE_DIR="$root/.tools/wp-cli/cache"
export WP_CLI_CONFIG_PATH="$root/packaging/wp-cli.yml"
cd "$root/packaging"
if [ ! -f "$root/.tools/wp-cli/wp-cli.phar" ]; then
 curl --fail --location --silent --show-error https://github.com/wp-cli/wp-cli/releases/download/v2.12.0/wp-cli-2.12.0.phar -o "$root/.tools/wp-cli/wp-cli.phar.download"
 mv "$root/.tools/wp-cli/wp-cli.phar.download" "$root/.tools/wp-cli/wp-cli.phar"
fi
"$php_bin" -r 'if(hash_file("sha256",$argv[1])!=="ce34ddd838f7351d6759068d09793f26755463b4a4610a5a5c0a97b68220d85c"){fwrite(STDERR,"WP-CLI release checksum mismatch\n");exit(1);}' "$root/.tools/wp-cli/wp-cli.phar"
version=$("$php_bin" -d error_reporting=22527 "$root/.tools/wp-cli/wp-cli.phar" --version)
[ "$version" = 'WP-CLI 2.12.0' ] || { echo "Unexpected version: $version" >&2; exit 1; }
if "$php_bin" -r '
$p=$argv[1];if(!is_file($p))exit(1);$lock=json_decode(file_get_contents($p),true);foreach($lock["packages"]??[] as $package){if($package["name"]==="wp-cli/dist-archive-command"&&$package["version"]==="v3.1.0")exit(0);}exit(1);
' "$WP_CLI_PACKAGES_DIR/composer.lock" && [ -f "$WP_CLI_PACKAGES_DIR/vendor/wp-cli/dist-archive-command/dist-archive-command.php" ]; then
 echo 'Pinned WP-CLI packaging tools are ready.'
else
 "$php_bin" -d error_reporting=22527 "$root/.tools/wp-cli/wp-cli.phar" package install wp-cli/dist-archive-command:v3.1.0
fi
