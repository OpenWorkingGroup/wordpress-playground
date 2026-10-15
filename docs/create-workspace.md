# Create a component-development workspace

No baseline theme repository or theme configuration is required. Native WP-CLI downloads a standard WordPress installation, including its bundled themes. The VS Code Playground extension runs that installation. An empty component list is valid; add only the plugins or themes you actually develop.

## Requirements

Install VS Code desktop and the official **WordPress Playground** extension (`WordPressPlayground.wordpress-playground`). The checked-in setup workspace recommends it before any setup runs. Open Extensions and search `@recommended` to install it; recommendations do not install extensions automatically.

The host needs Git, **Node.js 22+**, **PHP 8+ with ZipArchive and curl**, command-line curl and unzip. Supported hosts are macOS and Linux (Windows through WSL). Playground's PHP runtime does not replace host PHP. No Python, npm install, pnpm install, or third-party JavaScript packages are required. First setup downloads WP-CLI and WordPress and needs internet access.

## 1. Create the project and pin the framework

Choose a new directory, separate from the framework checkout and any existing site:

```sh
mkdir my-wordpress-workspace
cd my-wordpress-workspace
git init -b main
git submodule add https://github.com/OpenWorkingGroup/wordpress-playground.git tools/wordpress-playground
git -C tools/wordpress-playground checkout v0.3.0
cp tools/wordpress-playground/examples/workspace.gitignore .gitignore
cp tools/wordpress-playground/examples/workspace.json workspace.json
cp tools/wordpress-playground/examples/setup.code-workspace setup.code-workspace
```

The starter configuration is simply:

```json
{"schema": 1, "components": []}
```

## 2. Run setup in VS Code

Open `setup.code-workspace` using **File → Open Workspace from File** (or `code setup.code-workspace`). Install the recommended Playground extension.

Choose **Terminal → Run Task → Workspace: Set up**, or open the Command Palette and select **Tasks: Run Task**. The task runs three visible steps in order: validate your configuration, set up WP-CLI, then prepare standard WordPress. A failure stops the sequence; fix the reported prerequisite and rerun the task.

When it finishes, open `wordpress.generated.code-workspace`. **Start Playground only in this generated workspace**, whose first folder is the prepared WordPress installation. The setup workspace is for setup, not running a site. Select a compatible PHP version such as 8.3 in the Playground sidebar and start its server. Use its reported address and credentials.

Terminal equivalent, if preferred:

```sh
node tools/wordpress-playground/scripts/workspace.mjs validate workspace.json
sh tools/wordpress-playground/scripts/setup-packaging.sh
node tools/wordpress-playground/scripts/workspace.mjs prepare workspace.json
```

Preparation downloads WordPress only when no installation exists. Subsequent preparation preserves core, bundled themes, installed components, uploads and settings. `wordpress_version` is an optional manifest field for a specific initial numeric core release; the default is `latest`. Changing that field does not upgrade an existing installation. In full WordPress mode the mounted core files determine the WordPress version, not the sidebar's download selection.

## 3. Add only the components you develop

Clone source repositories under `sources/`, or add them as submodules to record exact commits:

```sh
mkdir -p sources
# Substitute your actual repository URL and directory name:
git submodule add --force YOUR_PLUGIN_REPOSITORY_URL sources/my-plugin
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

Add any component submodule references deliberately. The example ignore file excludes ordinary source clones; explicitly added submodules remain tracked. Never force-add `.playground`, `.tools`, `dist`, databases or credentials. The generated VS Code file is ignored and reproducible.

After cloning this project on another machine:

```sh
git clone --recurse-submodules YOUR_PROJECT_REPOSITORY
cd YOUR_PROJECT_DIRECTORY
code setup.code-workspace
```

Run **Workspace: Set up**, then open the generated workspace.

You choose the project's GitHub name and visibility independently. None of these commands pushes the workspace or changes a separate site environment. See [updates](updates.md) for migration from v0.1.0.

VS Code references: [workspace extension recommendations](https://code.visualstudio.com/docs/editing/workspaces/multi-root-workspaces) and [ordered tasks](https://code.visualstudio.com/docs/debugtest/tasks).
