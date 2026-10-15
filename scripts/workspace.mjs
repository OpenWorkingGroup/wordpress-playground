#!/usr/bin/env node
// Prepare local integration copies. WordPress itself is managed by WP-CLI and Playground.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const framework = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ignored = new Set(['.git', '.tools', 'node_modules', '.DS_Store', '__pycache__']);
const exists = p => fs.existsSync(p) || fs.lstatSync(p, { throwIfNoEntry: false }) !== undefined;
const inside = (child, parent) => child === parent || child.startsWith(parent + path.sep);
const save = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
const safeDirectory = p => {
  if (exists(p) && (fs.lstatSync(p).isSymbolicLink() || !fs.statSync(p).isDirectory())) {
    throw new Error(`Expected a real directory: ${p}`);
  }
};

export function readConfig(manifest) {
  manifest = fs.realpathSync(manifest);
  const project = path.dirname(manifest);
  const config = JSON.parse(fs.readFileSync(manifest, 'utf8'));
  if (config.schema !== 1 || !Array.isArray(config.components)) throw new Error('Expected schema: 1 and components array');
  if (config.wordpress_version !== undefined && !/^(latest|[0-9]+(?:\.[0-9]+)*)$/.test(config.wordpress_version)) {
    throw new Error('wordpress_version must be latest or a numeric release');
  }
  const seen = new Set();
  const components = config.components.map(item => {
    if (!item || !['plugin', 'theme'].includes(item.type) || typeof item.slug !== 'string' || !/^[a-z0-9][a-z0-9_-]*$/.test(item.slug)) {
      throw new Error('Each component requires type plugin/theme and a safe lowercase slug');
    }
    if (typeof item.path !== 'string' || path.isAbsolute(item.path)) throw new Error('Component paths must be relative to workspace.json');
    const key = `${item.type}s/${item.slug}`;
    if (seen.has(key)) throw new Error(`Duplicate component: ${key}`);
    seen.add(key);
    const source = fs.realpathSync(path.resolve(project, item.path));
    const runtime = path.join(project, '.playground');
    if (!fs.statSync(source).isDirectory() || inside(runtime, source) || inside(source, runtime)) throw new Error(`Unsafe source: ${item.path}`);
    if (item.type === 'theme' && !fs.existsSync(path.join(source, 'style.css'))) throw new Error('Theme missing style.css');
    if (item.type === 'plugin' && !fs.readdirSync(source).some(name => name.endsWith('.php') && fs.statSync(path.join(source, name)).isFile() && /^[ \t/*#@]*Plugin Name:/m.test(fs.readFileSync(path.join(source, name), 'utf8').slice(0, 8192)))) {
      throw new Error('Plugin header missing');
    }
    return { ...item, source, key };
  });
  return { project, config, components };
}

export function prepare(manifest = 'workspace.json') {
  const { project, config, components } = readConfig(manifest);
  const runtime = path.join(project, '.playground');
  safeDirectory(runtime);
  fs.mkdirSync(runtime, { recursive: true });
  const wordpress = path.join(runtime, 'wordpress');
  safeDirectory(wordpress);
  if (!exists(wordpress)) execFileSync('sh', [path.join(framework, 'scripts/prepare-wordpress.sh'), wordpress, config.wordpress_version ?? 'latest'], { stdio: 'inherit' });
  if (!fs.existsSync(path.join(wordpress, 'wp-load.php'))) throw new Error('Incomplete WordPress installation; inspect before retrying');
  const content = path.join(wordpress, 'wp-content');
  for (const dir of [content, path.join(content, 'plugins'), path.join(content, 'themes'), path.join(runtime, 'previous-copies')]) safeDirectory(dir);
  const state = path.join(runtime, 'managed-components.json');
  if (exists(state) && fs.lstatSync(state).isSymbolicLink()) throw new Error('Managed state must not be a symlink');
  const previous = exists(state) ? JSON.parse(fs.readFileSync(state, 'utf8')) : [];
  if (!Array.isArray(previous) || previous.some(key => typeof key !== 'string' || !/^(plugins|themes)\/[a-z0-9][a-z0-9_-]*$/.test(key))) throw new Error('Invalid managed component record');
  for (const key of new Set([...previous, ...components.map(c => c.key)])) {
    const target = path.join(content, key);
    safeDirectory(target);
    if (exists(target) && !previous.includes(key)) throw new Error(`Refusing to overwrite unmanaged component: ${key}`);
  }
  const staged = fs.mkdtempSync(path.join(runtime, 'prepare-'));
  try {
    // Stage every source before replacing installed copies; reject links to external files.
    for (const c of components) fs.cpSync(c.source, path.join(staged, c.key), {
      recursive: true,
      filter(source) {
        if (ignored.has(path.basename(source))) return false;
        if (fs.lstatSync(source).isSymbolicLink()) throw new Error(`Symlink requires a real-file source: ${source}`);
        return true;
      }
    });
    for (const kind of ['plugins', 'themes']) fs.mkdirSync(path.join(content, kind), { recursive: true });
    const archive = path.join(runtime, 'previous-copies', path.basename(staged));
    for (const key of previous) if (exists(path.join(content, key))) {
      fs.mkdirSync(path.dirname(path.join(archive, key)), { recursive: true });
      fs.renameSync(path.join(content, key), path.join(archive, key));
    }
    for (const c of components) fs.renameSync(path.join(staged, c.key), path.join(content, c.key));
  } finally { fs.rmSync(staged, { recursive: true, force: true }); }
  save(state, components.map(c => c.key));
  const base = '${workspaceFolder:Workspace}';
  const tool = base + '/' + path.relative(project, framework).split(path.sep).join('/');
  const task = (label, command, args) => ({ label, type: 'process', command, args, problemMatcher: [] });
  const tasks = [task('Workspace: Refresh copies (stop Playground first)', 'node', [tool + '/scripts/workspace.mjs', 'prepare', base + '/' + path.basename(manifest)])];
  for (const c of components) tasks.push(task(`Package ${c.type}: ${c.name ?? c.slug}`, 'sh', [tool + '/scripts/package-extension.sh', c.type, base + '/' + c.path, base + '/dist', c.slug]));
  save(path.join(project, 'wordpress.generated.code-workspace'), {
    folders: [{ name: 'WordPress', path: '.playground/wordpress' }, { name: 'Workspace', path: '.' }, ...components.map(c => ({ name: `${c.name ?? c.slug} (${c.type})`, path: c.path }))],
    extensions: { recommendations: ['WordPressPlayground.wordpress-playground'] },
    settings: { 'files.exclude': { '**/.tools': true, '**/.playground': true } },
    tasks: { version: '2.0.0', tasks }
  });
  console.log('Prepared. Open wordpress.generated.code-workspace and start Playground. Previous copies are retained; sources and uploads are unchanged.');
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [command, manifest = 'workspace.json'] = process.argv.slice(2);
    if (command === 'prepare') prepare(manifest);
    else if (command === 'validate') console.log(`Valid workspace: ${readConfig(manifest).components.length} components`);
    else throw new Error('Usage: node scripts/workspace.mjs validate|prepare [workspace.json]');
  } catch (error) { console.error(`Error: ${error.message}`); process.exitCode = 1; }
}
