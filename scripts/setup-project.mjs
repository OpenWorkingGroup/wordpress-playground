#!/usr/bin/env node
// Bootstrap an already-added submodule into its existing parent project.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

export function setupProject(framework, { prepare = true } = {}) {
  framework = fs.realpathSync(framework);
  const git = (cwd, ...args) => execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8' }).trim();
  const project = git(framework, 'rev-parse', '--show-superproject-working-tree');
  if (!project) throw new Error('Add this framework as a submodule of your existing project first. See the setup guide.');
  const relative = path.relative(project, framework);
  if (relative !== 'tools/wordpress-playground') throw new Error('This starter expects the submodule at tools/wordpress-playground within the project.');
  const version = fs.readFileSync(path.join(framework, 'VERSION'), 'utf8').trim();
  if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error('Invalid framework VERSION');
  const tag = `v${version}`;
  const release = git(framework, 'rev-parse', '--verify', `refs/tags/${tag}^{commit}`);
  if (git(framework, 'status', '--porcelain')) throw new Error('Framework checkout has local changes; preserve them before setup.');
  // Check collisions before changing the checkout or any project file.
  for (const name of ['.gitignore', 'workspace.json', 'setup.code-workspace']) {
    const file = path.join(project, name);
    const stat = fs.lstatSync(file, { throwIfNoEntry: false });
    if (stat && (!stat.isFile() || stat.isSymbolicLink())) throw new Error(`Expected a regular project file: ${name}`);
  }
  const sources = path.join(project, 'sources');
  const sourceStat = fs.lstatSync(sources, { throwIfNoEntry: false });
  if (sourceStat && (!sourceStat.isDirectory() || sourceStat.isSymbolicLink())) throw new Error('Expected sources to be a real directory; existing path was preserved.');
  const manifest = path.join(project, 'workspace.json');
  if (fs.existsSync(manifest)) {
    const value = JSON.parse(fs.readFileSync(manifest, 'utf8'));
    if (value.schema !== 1 || !Array.isArray(value.components)) throw new Error('Existing workspace.json belongs to another format. Resolve the filename conflict before setup; it has not been overwritten.');
  }
  console.log(`Pinning framework to ${tag}`);
  git(framework, 'checkout', '--detach', release);
  git(project, 'add', '--', relative);
  for (const [source, target] of [['workspace.json', 'workspace.json'], ['setup.code-workspace', 'setup.code-workspace']]) {
    const destination = path.join(project, target);
    if (!fs.existsSync(destination)) fs.copyFileSync(path.join(framework, 'examples', source), destination, fs.constants.COPYFILE_EXCL);
    else console.log(`Keeping existing ${target}`);
  }
  if (!sourceStat) { fs.mkdirSync(sources); fs.writeFileSync(path.join(sources, '.gitkeep'), ''); }
  // Ignore only framework outputs; do not impose a source layout or ignore project code.
  const ignoreFile = path.join(project, '.gitignore');
  const previous = fs.existsSync(ignoreFile) ? fs.readFileSync(ignoreFile, 'utf8') : '';
  const rules = ['/.playground/', '/dist/', '/wordpress.generated.code-workspace'];
  const missing = rules.filter(rule => !previous.split(/\r?\n/).includes(rule));
  if (missing.length) fs.appendFileSync(ignoreFile, `${previous && !previous.endsWith('\n') ? '\n' : ''}\n# WordPress Playground local outputs\n${missing.join('\n')}\n`);
  if (prepare) {
    console.log('Validating project configuration');
    execFileSync(process.execPath, [path.join(framework, 'scripts/workspace.mjs'), 'validate', manifest], { stdio: 'inherit' });
    console.log('Setting up WP-CLI');
    execFileSync('sh', [path.join(framework, 'scripts/setup-packaging.sh')], { stdio: 'inherit' });
    console.log('Preparing WordPress');
    execFileSync(process.execPath, [path.join(framework, 'scripts/workspace.mjs'), 'prepare', manifest], { stdio: 'inherit' });
  }
  console.log(`Project ready: ${project}\nOpen wordpress.generated.code-workspace after preparation. Review and commit the project changes; setup does not commit or push.`);
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { setupProject(path.resolve(import.meta.dirname, '..')); }
  catch (error) { console.error(`Error: ${error.message}`); process.exitCode = 1; }
}
