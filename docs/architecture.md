# Architecture and scope

There are three independent ownership boundaries:

- **Framework:** generic tooling, examples, validation and documentation. No project's components or content.
- **Component workspace:** a project manifest, framework commit, source repository references and integration workflow. Components remain independently installable and versioned.
- **Site workspace:** skeleton-site configuration, approved WXR content and release/installation records. Mutable site databases/uploads stay out of Git.

A component workspace's generated `.code-workspace` is derived from `workspace.json`, so project names and component-specific tasks never enter the framework. Relative source paths make projects portable. Submodules record independent source revisions; sibling/local clones can also be referenced when reproducibility is managed separately.

## Playground extension behavior

The framework uses the extension's full **wordpress** mode. Native WP-CLI downloads normal WordPress core and bundled themes into `.playground/wordpress` on first preparation. No default theme source is a project dependency. Empty and plugin-only workspaces are supported.

The extension initializes the installation and manages SQLite persistence. In inspected extension 0.1.72, database storage may be under a path-derived `~/.wp-now/wp-content` directory while site files/uploads live in the mounted installation. Do not assume `.playground` alone is a complete backup; inspect the actual database location before backing up or migrating. Renaming the first workspace folder can select different extension storage.

The extension's empty-folder playground mode supplies default themes but uses a shared `playground` storage directory in the inspected version. It is not used here because separate project workspaces must remain isolated.
The extension serves the first workspace folder, selects an available port starting at 8881 and initially defaults to PHP 7.4. Select a compatible PHP version explicitly; some plugins require 8+. Multi-root source folders do not automatically become mounts, and external symlink support is limited. Explicit copies avoid depending on that behavior.

The inspected extension binds its HTTP server without a loopback-only host setting and exposes no contributed host/port settings. Its server can be reachable on other network interfaces depending on host firewall/network settings. Use trusted local development environments with synthetic data; do not expose production credentials/data. This framework does not modify the extension or claim to enforce loopback binding.

Extension updates may change these behaviors; recheck the extension's displayed project path, mode, address, PHP version and persistence after upgrades. No CLI server, daemon, port reservation or competing runtime is included.

## Why no template or Tekton?

A GitHub template is a starting copy, not a dependency upgrade mechanism. This repository is a versioned module. A future project-starter template can reference it without copying its implementation.

Native WP-CLI already packages plugins/themes. VS Code tasks invoke that workflow locally. A CI platform may call the same scripts, but Kubernetes/Tekton is not required or included.

## Prepared sources

Integration preparation is explicit, synchronous and intended for a stopped development server. All sources are staged before existing copies are moved. Previous copies are retained locally; do not edit them as source. It is not a deployment transaction for production. Run project-specific builds before preparation and packaging.

No licensed/commercial source is copied into this repository. Packaging third-party code does not grant redistribution rights.
