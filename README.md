# WordPress Playground development starter

Develop plugins and themes together, directly in VS Code. Open the folder and start the official Playground extension. No framework submodule, setup task, manifest, generated workspace, npm install, or source-copy step is needed to run WordPress.

## Start WordPress

1. Clone this repository, or choose [Use this template](https://github.com/new?template_name=wordpress-playground&template_owner=OpenWorkingGroup) and clone your new project. For an existing clone, use `git pull`.
2. Open the repository root in VS Code. Install the recommended **WordPress Playground** extension (`WordPressPlayground.wordpress-playground`).
3. Click **Start Server** in the Playground sidebar. Use its reported address and credentials. For modern components, select a compatible PHP version such as 8.3.

The extension downloads WordPress/PHP on first use, so internet access is required. VS Code and the extension are the only requirements for running the site. Host PHP is needed only for the optional packaging task.

The root is a normal `wp-content` directory:

```text
plugins/                  # Clone your plugin repositories here
  my-plugin/
themes/
  twentytwentyfive/        # Included, unmodified standard WordPress theme
  my-theme/               # Optional custom theme repository
.vscode/                  # Extension recommendation and packaging task
```

The included Twenty Twenty-Five theme makes the initial site usable without extra setup. The extension's `wp-content` mode hides the themes in its WordPress download, so the starter carries this standard theme. There is no theme configuration to maintain. WordPress core and the database are not committed.

## Develop plugins together

From the repository root:

```sh
git clone YOUR_PLUGIN_REPOSITORY_URL plugins/my-plugin
git clone YOUR_OTHER_PLUGIN_REPOSITORY_URL plugins/my-other-plugin
```

Use **Plugins → Installed Plugins** to activate them. Edit these files directly and reload the site. There is no synchronization task. If a newly cloned component is not discovered immediately, stop and start Playground once. Run any build commands required by each component inside its own repository.

For a custom theme, clone into `themes/my-theme`, then activate it in **Appearance → Themes**. The plugin/theme entry files must be directly inside that folder; repositories with a nested build output need their own build/layout adjustment.

Component clones are ignored by the starter repository and keep their own Git history. Commit/push inside each component repository. New projects should clone components explicitly; a starter pull does not fetch their repositories. You may choose submodules yourself if you want the project to record exact component revisions, but they are not required.

## Package for installation on another site

Add a reviewed `.distignore` to the component root; `tools/packaging/distignore.example` is a starting point. Keep runtime assets and required vendor files.

Choose **Terminal → Run Task → Package component**, select plugin/theme, and enter its folder (for example `plugins/my-plugin`). The task prepares pinned WP-CLI tooling automatically on first use and writes an installable ZIP plus checksum under `dist/`.

Packaging requires host PHP 8+ with ZipArchive and curl, command-line curl, and a POSIX shell (macOS/Linux, or Windows through WSL). It uses official WP-CLI `dist-archive`; it does not start another server or deploy anything. Install the ZIP manually on the separate SYVLocal integration site.

## Persistence and updates

The extension manages the local database under `~/.wp-now`; uploads live in this mounted folder. Restarting is not a reset. Moving the project can select different database storage. Use native WordPress Export/Import for starter content; WXR is not a complete database/files backup.

This repository is intended as a **GitHub template** for independent projects. Template-created repositories do not automatically inherit later template updates: `git pull` updates your own repository. Review and copy changes to the few starter files when needed. A direct clone of this repository can pull its updates normally.

The earlier v0.4.x framework is superseded. Start a fresh standalone clone for this layout; do not pull it into a live framework submodule and assume automatic migration. Existing generated sites and databases are not migrated or removed.

Validated against extension 0.1.72. It chooses an available port and may listen beyond loopback; use this for local development with synthetic data. Never use production credentials or content here.

Original starter tooling is MIT licensed. The bundled theme and its assets retain their upstream licenses; see [THIRD_PARTY.md](THIRD_PARTY.md). This is an independent starter, not the official Playground project.

References: [official extension documentation](https://developer.wordpress.org/playground/developers/local-development/vscode-extension/) · [GitHub templates](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-repository-from-a-template).
