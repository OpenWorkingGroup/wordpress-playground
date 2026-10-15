# Changelog

## v1.2.0

- Move packaging scripts, supporting documentation, tests, release metadata, and packaging configuration under tooling/.
- Keep plugins/, themes/, README, LICENSE, and required hidden GitHub/VS Code configuration at the root.
- Update packaging tasks and CI paths; new caches and artifacts use tooling/.tools/ and tooling/dist/.
- Existing local caches/artifacts at the old paths are left intact and ignored.

## v1.1.0

- Remove the redundant .code-workspace file; open the folder directly using .vscode recommendations and packaging tasks.
- Remove the bundled default theme. Install themes through native WordPress Appearance → Themes from WordPress.org.
- A fresh checkout starts WordPress admin, but requires a one-time theme installation before the homepage renders. Existing v1.0.0 clones must reinstall the removed theme after pulling.

## v1.0.0 — standalone development starter

- Replace the framework/submodule scaffolding with a directly mounted wp-content project.
- Include plugins/ and unmodified Twenty Twenty-Five 1.5 so cloning and starting the official extension produces a usable default site.
- Remove manifests, setup scripts, generated workspaces, synchronization, and Node/Python requirements.
- Keep a single optional VS Code packaging task using native WP-CLI with automatic tool setup.
- Enable GitHub template usage; component repositories remain independent.
- Breaking layout change: existing v0.4.x framework projects should use a fresh standalone starter. No site/database migration is performed.

## v0.4.0

- Install into an existing Git project with one submodule-add command followed by the included Project: Set up task.
- Automate release pinning and starter configuration creation; preserve existing project files and refuse conflicting formats or dirty framework checkouts.
- Create sources/ with a Git placeholder when missing; allow component paths elsewhere in the project.
- Keep project creation and repository initialization outside framework setup.

## v0.3.0

- Add checked-in framework and project setup workspaces with Playground extension recommendations.
- Provide ordered VS Code setup tasks and explicit host/extension requirements.
- Replace Python setup and tests with dependency-free JavaScript (Node.js 22+); npm test runs the suite without installing packages.
- Preserve schema 1 and the v0.2.0 runtime path. See the update guide for replacing generated tasks.

## 0.2.0 — 2026-10-15

- Remove the mandatory baseline theme from configuration, preparation and the creation guide.
- Prepare standard WordPress core with bundled themes using native WP-CLI; run it through the extension’s full WordPress mode.
- Accept empty and plugin-only workspaces; retain optional theme-development/packaging support.
- Runtime folder changes to `.playground/wordpress`; see docs/updates.md before migrating an existing workspace.

## 0.1.0 — 2026-10-15

- Introduce project-owned workspace schema 1 and generated multi-root VS Code tasks.
- Prepare explicit plugin/theme integration copies for the official Playground extension.
- Package plugins and themes using pinned WP-CLI distribution tooling and SHA-256 sidecars.
- Document independent component/site workspaces, manual creation, submodule updates and rollback.
- Retire the earlier CLI-server approach; no project-specific code or runtime data is distributed.
