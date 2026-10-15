# Validation — v0.4.0

All 18 local JavaScript tests pass. Added isolated Git-submodule fixtures verify release pinning (including staging the pinned reference), repeatable installation into an existing project, sources directory creation, preservation of existing sources/configuration/ignore rules, and refusal of incompatible configuration or dirty framework checkouts. The previous real WP-CLI archive tests continue to pass. VS Code UI execution remains a manual check.

# Validation — v0.3.0

All 14 JavaScript tests pass locally on Node.js 22, including real WP-CLI plugin/theme packaging, checksum and exclusion checks, safe refresh/removal, empty/plugin-only workspaces, task ordering, and linked paths containing spaces. A fresh empty workspace downloaded standard WordPress with bundled themes. The exact starter task commands were run in sequence and repeated successfully. No npm dependencies or Python are needed.

VS Code recommendation prompts, task UI and extension startup still require manual acceptance. The commands were rehearsed outside VS Code; no existing user environment was changed. CI results are separate from these local checks.

# Validation — v0.2.0

All 11 local automated tests pass, including empty and plugin-only workspaces and preservation of bundled themes. A fresh empty workspace downloaded WordPress 7.1.3 with its bundled themes through native WP-CLI and generated the full-installation workspace successfully. Repeated preparation preserved the installation. The download command allows 512 MB for archive extraction. Shell syntax checks pass.

VS Code extension startup and persistence for the new full-installation path still require manual acceptance. No existing user site was changed. See [updates](updates.md) before switching an existing v0.1.0 workspace.

## Historical validation — v0.1.0

This record describes the superseded baseline-theme design.

# Foundation validation — v0.1.0

Validated locally on macOS with Python 3, PHP 8.5.11, WP-CLI 2.12.0 and dist-archive 3.1.0.

- All 10 automated tests pass: preparation/refresh/removal, content preservation, task generation, invalid slugs, duplicate identities, missing sources, unmanaged destinations, symlink rejection, required baseline theme, real plugin/theme archives and invalid package inputs.
- Fresh toolchain download matches the pinned WP-CLI SHA-256. Repeated setup reuses the verified installation.
- A separate temporary project successfully followed the creation flow: framework submodule, baseline theme submodule, copied project manifest/ignore file, validation, integration preparation, generated workspace and packaging setup.
- The official Twenty Twenty-Five source packaged successfully with the native command and produced a checksum sidecar. No theme code is included in this repository.
- PHP and shell syntax checks pass. The publication file list excludes downloaded tools, runtime data, artifacts, licensed components and local project identifiers.
- The retired CLI server was stopped before its implementation was removed. Existing component-development and site workspaces were not migrated.

The GitHub workflow is provided for Linux verification; its result must be checked separately after push. The creation flow was rehearsed without starting a new VS Code extension instance. Extension startup, component activation and persistence in a user's newly created workspace remain the documented manual acceptance steps. No production qualification or remote WordPress deployment is claimed.
