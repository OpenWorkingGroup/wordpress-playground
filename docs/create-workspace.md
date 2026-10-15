# Add plugin and theme development to an existing project

No baseline theme repository or theme configuration is required. Native WP-CLI downloads a standard WordPress installation, including its bundled themes. The VS Code Playground extension runs that installation. An empty component list is valid; add only the plugins or themes you actually develop.

## Requirements

Install VS Code desktop and the official **WordPress Playground** extension (`WordPressPlayground.wordpress-playground`). The checked-in setup workspace recommends it before any setup runs. Open Extensions and search `@recommended` to install it; recommendations do not install extensions automatically.

The host needs Git, **Node.js 22+**, **PHP 8+ with ZipArchive and curl**, command-line curl and unzip. Supported hosts are macOS and Linux (Windows through WSL). Playground's PHP runtime does not replace host PHP. No Python, npm install, pnpm install, or third-party JavaScript packages are required. First setup downloads WP-CLI and WordPress and needs internet access.

## 1. Add the framework to your project

Use any existing Git project. There is no requirement to create a new directory, initialize a new repository, or adopt a particular project name. The submodule requires Git; if your project is not under Git, decide separately whether to initialize it.

From your existing project directory, add the framework once:

```sh
git submodule add https://github.com/OpenWorkingGroup/wordpress-playground.git tools/wordpress-playground
```

If the submodule is already present, skip this command. The starter currently expects this submodule path. Your other files and component source layout remain project-owned.

## 2. Run project setup

Open `tools/wordpress-playground/wordpress-playground.code-workspace` using **File → Open Workspace from File**. Install the recommended Playground extension. Choose **Terminal → Run Task → Project: Set up**, or use **Tasks: Run Task** in the Command Palette.

This task automatically:

1. Pins the submodule to the release named in its VERSION file (currently **v0.4.0**) and stages that submodule reference.
2. Creates `workspace.json` and `setup.code-workspace` only if missing.
3. Adds missing local-output ignore rules while preserving existing `.gitignore` contents.
4. Creates `sources/` with a `.gitkeep` placeholder if the directory does not exist.
5. Validates configuration, prepares WP-CLI, and prepares standard WordPress with bundled themes.

Existing compatible configuration and source files are retained. A conflicting configuration format, unsafe path, or modified framework checkout stops setup with an explanation. Setup does not commit or push. It does not initialize a repository. If a later download fails, fix the reported issue and rerun; already-created files are retained.

The initial component list is empty: `{"schema": 1, "components": []}`. No baseline theme is required.

When setup finishes, open `wordpress.generated.code-workspace` in the project root. **Start Playground only in this generated workspace**, whose first folder is the prepared WordPress installation. Select a compatible PHP version such as 8.3 in the Playground sidebar and start its server. Use its reported address and credentials.

Terminal equivalent for the setup task, from the project root:

```sh
node tools/wordpress-playground/scripts/setup-project.mjs
```

The submodule-add command is the bootstrap step: its task definitions become available after the framework is present. Checking out the release and copying starter files are handled by the task.

Preparation downloads WordPress only when no installation exists. Subsequent preparation preserves core, bundled themes, installed components, uploads and settings. `wordpress_version` is an optional manifest field for a specific initial numeric core release; the default is `latest`. Changing that field does not upgrade an existing installation. In full WordPress mode the mounted core files determine the WordPress version, not the sidebar's download selection.

## 3. Add only the components you develop

Setup has already created `sources/`. Place your plugin/theme code there, clone repositories into it, or add component submodules to record exact commits. Existing components elsewhere in the project can be referenced directly by relative path; they do not need to be moved:

```sh
# Substitute your actual repository URL and directory name:
git submodule add YOUR_PLUGIN_REPOSITORY_URL sources/my-plugin
```

Edit `workspace.json` to identify the actual plugin root:

```json
{
  "schema": 1,
  "components": [
    {"type": "plugin", "slug": "my-plugin", "name": "My Plugin", "path": "sources/my-plugin"}
  ]
}
```

Use `"type": "theme"` only when you are developing a theme. Paths are relative to the workspace; repositories containing multiple components need one entry per component root. Source code remains independently versioned. For child-theme development, install its required parent theme normally or include the parent source explicitly.

Stop the extension server, run `prepare` again, reopen the generated workspace if component folders/tasks changed, then restart. Activate the components manually in WordPress. Bundled default themes need no manifest entry. The framework refuses to replace unmanaged installed components with the same slug; resolve such conflicts deliberately before preparing.

## 4. Commit project configuration

```sh
git add .gitignore .gitmodules workspace.json setup.code-workspace tools/wordpress-playground
git commit -m "Create component development workspace"
```

Also stage `sources/.gitkeep` if setup created it, so the empty directory is retained. Review and add component sources or component submodule references according to your project’s versioning policy. Setup does not ignore `sources/` or automatically stage its contents. Never force-add `.playground`, `.tools`, `dist`, databases or credentials. The generated VS Code file is ignored and reproducible.

After cloning this project on another machine:

```sh
git clone --recurse-submodules YOUR_PROJECT_REPOSITORY
cd YOUR_PROJECT_DIRECTORY
code setup.code-workspace
```

Run **Workspace: Set up**, then open the generated workspace.

You choose the project's GitHub name and visibility independently. None of these commands pushes the workspace or changes a separate site environment. See [updates](updates.md) for migration from older versions.

VS Code references: [workspace extension recommendations](https://code.visualstudio.com/docs/editing/workspaces/multi-root-workspaces) and [ordered tasks](https://code.visualstudio.com/docs/debugtest/tasks).
