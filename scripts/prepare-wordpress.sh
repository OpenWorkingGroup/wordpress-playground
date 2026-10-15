#!/bin/sh
# Download a normal WordPress installation; the VS Code extension initializes it.
set -eu
root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
[ "$#" -ge 1 ] && [ "$#" -le 2 ] || { echo 'Usage: prepare-wordpress.sh DESTINATION [VERSION]' >&2; exit 2; }
target=$1
version=${2:-latest}
case "$version" in latest) ;; *[!0-9.]*|'') echo 'Use latest or a numeric WordPress release version' >&2; exit 2;; esac
[ ! -e "$target" ] || { echo 'Destination already exists; refusing to overwrite it' >&2; exit 2; }
[ -f "$root/.tools/wp-cli/wp-cli.phar" ] || { echo 'Run scripts/setup-packaging.sh first' >&2; exit 2; }
export WP_CLI_PACKAGES_DIR="$root/.tools/wp-cli/packages"
export WP_CLI_CACHE_DIR="$root/.tools/wp-cli/cache"
export WP_CLI_CONFIG_PATH="$root/tools/packaging/wp-cli.yml"
mkdir -p "$(dirname "$target")"
parent=$(CDPATH= cd -- "$(dirname "$target")" && pwd)
target="$parent/$(basename "$target")"
staging=$(mktemp -d "$parent/core-download-XXXXXX")
trap 'rm -rf "$staging"' EXIT HUP INT TERM
cd "$root/tools/packaging"
"${PHP_BIN:-php}" -d error_reporting=22527 -d memory_limit=512M "$root/.tools/wp-cli/wp-cli.phar" core download --path="$staging" --version="$version"
[ -f "$staging/wp-load.php" ] && [ -d "$staging/wp-content/themes" ]
mv "$staging" "$target"
