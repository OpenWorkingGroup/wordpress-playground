# Create a component-development workspace

These commands create a new project repository. Choose a directory that does not already exist. Do not run them inside the framework checkout or an existing WordPress site.

## 1. Create the project and pin the framework

```sh
mkdir my-wordpress-workspace
cd my-wordpress-workspace
git init -b main
git submodule add https://github.com/OpenWorkingGroup/wordpress-playground.git tools/wordpress-playground
git -C tools/wordpress-playground checkout v0.1.0
cp tools/wordpress-playground/examples/workspace.gitignore .gitignore
cp tools/wordpress-playground/examples/workspace.json workspace.json
mkdir sources
```

The framework does not create or push your project's GitHub repository. Choose its name and visibility independently.

## 2. Add a baseline theme

Playground's `wp-content` mode mounts the integration directory over core's bundled themes. A clean database therefore needs its WordPress version's default theme present. The starter uses Twenty Twenty-Five, which was the default in the inspected extension cache. When selecting another WordPress version, verify its required default theme and adjust the configuration.

```sh
git submodule add --force https://github.com/WordPress/twentytwentyfive.git sources/twentytwentyfive
```

The project records the exact theme commit added. You can substitute an already-installed theme's source directory; no theme code is embedded in the framework. For child themes, include their parent as a separate component with the directory slug required by the child's `Template` header.

## 3. Add your plugins/themes

Clone each source repository under `sources/` (or use `git submodule add --force URL sources/NAME` to record an exact commit). The example `.gitignore` ignores ordinary source clones while Git still tracks explicitly added submodules. Commit code changes from the component's own repository.

Edit `workspace.json`. Paths are relative to this project directory and point to the actual plugin/theme root, which may be inside its repository:

```json
{
  "schema": 1,
  "components": [
    {"type": "theme", "slug": "twentytwentyfive", "name": "Baseline theme", "path": "sources/twentytwentyfive"},
    {"type": "plugin", "slug": "example-plugin", "name": "Example Plugin", "path": "sources/example-plugin/plugin"},
    {"type": "theme", "slug": "example-theme", "name": "Example Theme", "path": "sources/example-theme"}
  ]
}
```

The last two entries are illustrative; add them only after those sources exist. The framework accepts any conventional plugin or theme folder. A repository containing several plugins needs one entry per plugin folder. Existing sibling checkouts can be referenced with `../`; a collaborator must reproduce that layout. Prefer `sources/` submodules for portable project configuration.

## 4. Prepare and open the workspace

```sh
python3 tools/wordpress-playground/scripts/workspace.py prepare workspace.json
sh tools/wordpress-playground/scripts/setup-packaging.sh
code wordpress.generated.code-workspace
```

If `code` is unavailable, use VS Code's **File → Open Workspace from File**. Do not open the framework folder as your WordPress project.

The generated workspace puts `.playground/wp-content` **first**, named WordPress. The installed extension inspected during development serves only the first folder. Other folders expose your project and component sources for editing; they are not independently mounted.

In the Playground sidebar, select PHP 8.3 or another compatible version, then **Start WordPress Server**. Changing the version can itself start the server. Use the address it reports. Install/activate your selected components manually through WordPress administration; preparation copies files but does not activate them. The extension's initial local credentials are usually `admin` / `password`; follow the extension's reported credentials if different.

The extension manages its own persistent database under `~/.wp-now`; see [architecture](architecture.md). A separate site workspace gets a separate extension instance/window. No CLI server is created here.

## 5. Commit the project, not generated data

```sh
git add .gitignore .gitmodules workspace.json tools/wordpress-playground sources/twentytwentyfive
git commit -m "Create component development workspace"
```

Add other component submodule references deliberately. Never force-add `.playground`, `.tools`, `dist`, database files or credentials. The generated VS Code file is ignored; regenerate it from the committed manifest after cloning:

```sh
git clone --recurse-submodules YOUR_PROJECT_REPOSITORY
cd YOUR_PROJECT_DIRECTORY
python3 tools/wordpress-playground/scripts/workspace.py prepare workspace.json
```

Run packaging setup on each new machine. Neither the framework nor these instructions push your workspace remotely.
