# WordPress Playground Framework

Reusable development tooling for WordPress plugins and themes, maintained by Open Working Group. Projects own their component selection and configuration; this repository supplies shared tools as a **versioned Git submodule**.

The official WordPress Playground VS Code extension runs WordPress. This framework prepares a standard WordPress installation with bundled themes and integration copies, generates project-specific VS Code tasks, and packages components using the official WP-CLI `dist-archive` command. It does not start a server, install components into a site, import content, or deploy anything.

## Start here

- [Create a component-development workspace](docs/create-workspace.md)
- [Daily development and packaging](docs/usage.md)
- [Update or roll back the framework](docs/updates.md)
- [Architecture, boundaries and limitations](docs/architecture.md)
- [Validation and contributing](docs/contributing.md)

Supported host: macOS or Linux (Windows through WSL), Git, Python 3.9+, PHP 8+ with ZipArchive, curl and unzip. Packaging setup also needs PHP's HTTP/Composer dependencies, including curl. Install the official `WordPressPlayground.wordpress-playground` extension in VS Code. Its PHP runtime is separate from the host PHP used for packaging.

## The boundary

```text
project-workspace/                 # Your project's repository
├── workspace.json                 # Your component definitions
├── tools/wordpress-playground/    # This repository, pinned submodule
├── sources/                      # Separate component repos/submodules
├── .playground/                  # Ignored integration copies and local files
├── dist/                         # Ignored ZIP artifacts and checksums
└── wordpress.generated.code-workspace
```

A site's skeleton/configuration and reviewed WordPress WXR exports belong in a **separate site repository**, not in this component-development workspace or the framework. Component source remains independently versioned. No commercial theme, plugin implementation, personal path, credentials, site database, uploads or project-specific shortcuts are shipped here.

## Minimal commands

Run these from your project workspace after following the creation guide:

```sh
sh tools/wordpress-playground/scripts/setup-packaging.sh
python3 tools/wordpress-playground/scripts/workspace.py validate workspace.json
python3 tools/wordpress-playground/scripts/workspace.py prepare workspace.json
```

Open `wordpress.generated.code-workspace`. Start WordPress through the extension sidebar. Select a PHP version compatible with your components (8.3 is a reasonable starting point). Use **Terminal → Run Task** or **Tasks: Run Task** in the Command Palette to package the listed components.

## Versioning

Current framework release: `v0.2.0`. Workspace configuration schema: `1`.

This is a framework/module repository, **not a GitHub template repository**. Projects pin its commit and review upgrades explicitly. A future starter template may copy only project-owned configuration, never the framework implementation.

## License and upstream tools

Original framework code and documentation are MIT licensed. Downloaded WP-CLI and its packages retain their own licenses and are not included in Git. This project is not the official WordPress Playground project and does not imply WordPress endorsement.

Official references: [Playground VS Code extension](https://github.com/WordPress/playground-tools/tree/trunk/packages/vscode-extension), [WP-CLI distribution archives](https://developer.wordpress.org/cli/commands/dist-archive/).
