# Daily workflow

1. Edit the source repository shown in VS Code, not `.playground/wp-content`.
2. Run the component's own build/tests if it has npm, Composer or other requirements. The framework does not guess or execute project-supplied build commands.
3. Stop the Playground server in the extension sidebar.
4. Run **Workspace: Refresh copies (stop Playground first)**, or the `prepare` command from the creation guide.
5. Start the extension again. Test the plugin/theme and its integrations.
6. Run the component's **Package plugin/theme: …** task. Manually install the resulting ZIP on the separate site workspace.

Refresh mirrors only manifest-managed plugin/theme folders. It preserves uploads, database files and unmanaged installed components, and refuses to overwrite a pre-existing unmanaged destination. Prior managed copies, including removed components, move to `.playground/previous-copies/`. Activation settings are not migrated when a slug changes: deactivate the old component before renaming, then activate the new one yourself. Do not run prepare while the extension is serving the integration copies; the framework cannot stop or introspect arbitrary VS Code extension instances.

Each plugin/theme is copied independently. Symlinks inside sources are rejected rather than exposing files outside the selected component. Prepare real runtime files before refreshing. `.git`, `node_modules`, `.tools`, `.DS_Store` and Python caches are excluded from integration copies; compiled assets and Composer `vendor/` are retained. These integration exclusions are distinct from release packaging exclusions.

## Packaging any component

```sh
sh tools/wordpress-playground/scripts/package-extension.sh plugin sources/example-plugin dist example-plugin
sh tools/wordpress-playground/scripts/package-extension.sh theme sources/example-theme dist example-theme
```

The fourth argument sets the archive root directory. If omitted it defaults to the source directory's basename. A plugin needs exactly one root-level PHP entrypoint with `Plugin Name` and `Version` headers. A theme needs `style.css` with `Theme Name` and `Version`. A standalone PHP plugin can first be placed in its own folder.

Add a reviewed `.distignore` in the **component source root** before packaging. Start from `tools/wordpress-playground/tools/packaging/distignore.example`. Keep required runtime assets, translation files and vendor libraries. Add exclusions appropriate to the component; `.gitignore` is not the release policy. The framework requires `.distignore` but does not claim it is a secrets scanner.

WP-CLI `dist-archive` produces the ZIP and reads the version. The wrapper checks its entrypoint/layout and writes a SHA-256 checksum. Each invocation uses a unique directory under the specified output location, preserving previous artifacts even when the version is unchanged. Package validation does not certify PHP compatibility, licensing, security, database migrations or integration behavior.

Output must be outside the component source. Packaging never loads WordPress or changes either site's content. It is deliberately not an auto-deployment action.

## Content and sites

Editorial content belongs to the separate site's WordPress database. Use native Tools → Export/Import (WXR) for reviewed portable starter content. WXR does not include plugin/theme binaries, most settings, custom plugin tables or media bytes. Install the required components before importing custom post types. A complete backup needs both database and files; the framework does not provide a new backup/import format.

## Tools

Setup installs WP-CLI 2.12.0 (SHA-256 verified) and dist-archive 3.1.0 inside the framework's ignored `.tools/`. It requires network access on first use. Runtime files are not committed or published. On PHP 8.5, dependency deprecation notices are suppressed while errors/warnings remain visible. `PHP_BIN` selects a host PHP executable. The PHP version selected in the Playground sidebar is independent of this host runtime.
