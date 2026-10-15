#!/bin/sh
# Thin wrapper around official WP-CLI distribution packaging; does not boot WordPress.
set -eu
root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
[ "$#" -ge 3 ] && [ "$#" -le 4 ] || { echo "Usage: $0 plugin|theme SOURCE OUTPUT_DIRECTORY [SLUG]" >&2; exit 2; }
kind=$1
case "$kind" in plugin|theme) ;; *) echo 'Expected plugin or theme' >&2; exit 2;; esac
source=$(CDPATH= cd -- "$2" && pwd)
output=$3
slug=${4:-$(basename "$source")}
case "$slug" in ''|*[!a-z0-9_-]*) echo 'Invalid component slug' >&2; exit 2;; esac
mkdir -p "$output"
output=$(CDPATH= cd -- "$output" && pwd)
case "$output/" in "$source/"*) echo 'Output must be outside source' >&2; exit 2;; esac
php_bin=${PHP_BIN:-php}
"$php_bin" "$root/scripts/archive-check.php" source "$kind" "$source" "$slug"
export WP_CLI_PACKAGES_DIR="$root/.tools/wp-cli/packages"
export WP_CLI_CACHE_DIR="$root/.tools/wp-cli/cache"
export WP_CLI_CONFIG_PATH="$root/packaging/wp-cli.yml"
[ -f "$root/.tools/wp-cli/wp-cli.phar" ] || { echo 'Run tooling/scripts/setup-packaging.sh first' >&2; exit 2; }
run=$(mktemp -d "$output/$slug-$(date -u +%Y%m%dT%H%M%SZ)-XXXXXX")
cd "$root/packaging"
"$php_bin" -d error_reporting=22527 "$root/.tools/wp-cli/wp-cli.phar" dist-archive "$source" "$run/" --format=zip --plugin-dirname="$slug"
set -- "$run"/*.zip
[ "$#" = 1 ] && [ -f "$1" ] || { echo 'Expected one ZIP' >&2; exit 1; }
"$php_bin" "$root/scripts/archive-check.php" archive "$kind" "$1" "$slug"
printf '\nInstallable ZIP: %s\nChecksum: %s.sha256\n' "$1" "$1"
