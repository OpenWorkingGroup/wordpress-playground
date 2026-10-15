# Start a development workspace

The old framework setup has been replaced by a standalone starter.

## 1. Add the framework to your project

This old section link is retained for existing bookmarks. **Do not add a framework submodule.** Clone the starter or a project created from its GitHub template, open the repository root in VS Code, install the recommended WordPress Playground extension, and click **Start Server**.

No setup command, Git initialization, baseline-theme checkout, or file-copy step is required. The `plugins/` and `themes/` directories are included. **Theme installation is optional.** You can log in at `/wp-admin/` and begin backend plugin development without a theme. When you need frontend testing, install Twenty Twenty-Five or another theme through **Appearance → Themes → Add New**. Themes come directly from WordPress.org and remain untracked local files. Until a theme is activated, the public homepage may report a missing theme.

Clone plugin repositories directly into `plugins/my-plugin`, then activate them in WordPress. Clone custom themes into `themes/my-theme`.

See the [README](../README.md) for the complete short workflow, packaging, and template update behavior. Existing v0.4.x framework installations are not automatically migrated; use a fresh standalone clone.
