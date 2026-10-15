# Validation and contributing

```sh
sh scripts/setup-packaging.sh
python3 -m unittest discover -s tests -v
php -l scripts/archive-check.php
sh -n scripts/setup-packaging.sh
sh -n scripts/package-extension.sh
```

Tests create isolated temporary workspaces and fixture components. They do not touch existing WordPress sites. Packaging tests invoke the real installed WP-CLI toolchain; setup must run first for those tests.

The foundation is tested locally on macOS. A GitHub Actions workflow runs the same suite on Ubuntu; a pushed workflow is not a claimed CI pass until its run completes. VS Code extension UI startup remains a manual acceptance check because the framework does not control VS Code.

Manual acceptance: create a workspace from docs/create-workspace.md, start the extension, verify the baseline theme and component activation, edit a source, stop/refresh/restart, test persistence, package plugin/theme ZIPs and install them on a separate disposable WordPress instance. Test SQLite and target MySQL/MariaDB separately before production use.

Keep contributions generic. Do not commit `.tools`, source checkouts, generated runtime, artifacts, machine paths, tokens, databases or licensed assets. Follow existing APIs and document breaking workspace schema changes.
