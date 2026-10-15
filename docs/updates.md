# Framework updates and rollback

A project pins the framework as a Git submodule. The recorded commit is the dependency lock. Generating a GitHub repository from a template does not establish an update relationship; it copies the starter files and creates independent history.

## Upgrade explicitly

From the project repository, with the extension stopped and your work committed:

```sh
git -C tools/wordpress-playground status --short
git -C tools/wordpress-playground fetch origin --tags
# Review the selected release's changelog and migrations first.
git -C tools/wordpress-playground checkout vX.Y.Z
sh tools/wordpress-playground/scripts/setup-packaging.sh
python3 tools/wordpress-playground/scripts/workspace.py validate workspace.json
python3 tools/wordpress-playground/scripts/workspace.py prepare workspace.json
git add tools/wordpress-playground
git commit -m "Update WordPress framework to vX.Y.Z"
```

Replace `vX.Y.Z` with an actual reviewed release tag. Do not switch a dirty framework checkout: contribute those changes in the framework repository first. Reopen the regenerated VS Code workspace to load task changes; start Playground, exercise component behavior and package a test artifact before merging/pushing the project update.

The upgrade changes shared tooling, not your source repositories, site database, uploads, PHP selection or project manifest. A schema-breaking release must provide explicit migration steps. Generated tasks are disposable; project-owned configuration is never silently rewritten by an update.

## Rollback

If an isolated project commit only updates the framework submodule, revert that commit, then restore its submodule revision:

```sh
git revert FRAMEWORK_UPDATE_COMMIT
git submodule update --init --recursive
python3 tools/wordpress-playground/scripts/workspace.py prepare workspace.json
```

If the upgrade also changed your manifest schema, revert/migrate that project configuration deliberately. Git rollback does not restore database migrations performed by component plugins. Preserve site backups independently.

## Optional automated proposals

GitHub Dependabot supports `gitsubmodule`; it follows the latest commit on the configured branch, not a semantic-version release-tag policy. Enable it only when branch-following proposals are desired. Do not automatically merge dependency updates. Tag-based upgrades remain manual in this foundation.

## Maintainer release process

1. Make generic changes in the framework repository; do not edit vendored project copies.
2. Run the tests and inspect the publication file list.
3. Update VERSION and CHANGELOG.md; document schema/toolchain migrations.
4. Tag the tested commit and push the branch and tag.
5. Consumers opt in by updating their pinned submodule revision.

`v0.1.0` introduces schema 1. There are no automatic migrations or update schedulers.

References: https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-repository-from-a-template and https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference .
