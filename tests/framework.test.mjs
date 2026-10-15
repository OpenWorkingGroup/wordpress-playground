import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { prepare } from '../scripts/workspace.mjs';

const root = path.resolve(import.meta.dirname, '..');
function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'framework test '));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const write = (p, value) => { fs.mkdirSync(path.dirname(path.join(dir, p)), { recursive: true }); fs.writeFileSync(path.join(dir, p), value); };
  write('sources/example/example.php', '<?php\n/*\nPlugin Name: Example\nVersion: 1.2.3\n*/');
  write('sources/theme/style.css', '/*\nTheme Name: Example\nVersion: 2.3.4\n*/');
  write('sources/theme/index.php', '<?php // fixture');
  for (const c of ['example', 'theme']) write(`sources/${c}/.distignore`, '.distignore\n.env\nnode_modules\n.git\n');
  write('.playground/wordpress/wp-load.php', '<?php // fixture');
  write('.playground/wordpress/wp-content/themes/bundled/style.css', 'bundled');
  const config = { schema: 1, components: [{ type: 'plugin', slug: 'example', path: 'sources/example' }, { type: 'theme', slug: 'example-theme', path: 'sources/theme' }] };
  const manifest = path.join(dir, 'workspace.json');
  const save = () => write('workspace.json', JSON.stringify(config));
  save();
  return { dir, write, config, save, manifest, content: path.join(dir, '.playground/wordpress/wp-content') };
}

test('refresh and removal preserve uploads, unmanaged components and source; retain old copies', t => {
  const f = fixture(t); prepare(f.manifest);
  f.write('.playground/wordpress/wp-content/uploads/keep', 'keep');
  f.write('.playground/wordpress/wp-content/plugins/unmanaged/keep', 'keep');
  f.write('sources/example/new.txt', 'new'); prepare(f.manifest);
  assert.equal(fs.readFileSync(path.join(f.content, 'plugins/example/new.txt'), 'utf8'), 'new');
  for (const p of ['uploads/keep', 'plugins/unmanaged/keep']) assert.equal(fs.readFileSync(path.join(f.content, p), 'utf8'), 'keep');
  assert.ok(fs.readdirSync(path.join(f.dir, '.playground/previous-copies')).length);
  f.config.components.shift(); f.save(); prepare(f.manifest);
  assert.equal(fs.existsSync(path.join(f.content, 'plugins/example')), false);
  assert.ok(fs.existsSync(path.join(f.dir, 'sources/example/example.php')));
});
test('generated workspace uses source packaging, JavaScript refresh and extension recommendations', t => {
  const f = fixture(t); prepare(f.manifest);
  const w = JSON.parse(fs.readFileSync(path.join(f.dir, 'wordpress.generated.code-workspace')));
  assert.equal(w.folders[0].path, '.playground/wordpress');
  assert.ok(w.extensions.recommendations.includes('WordPressPlayground.wordpress-playground'));
  assert.equal(w.tasks.tasks[0].command, 'node');
  assert.ok(w.tasks.tasks.find(t => t.label === 'Package plugin: example').args.includes('${workspaceFolder:Workspace}/sources/example'));
});
for (const [name, alter] of [
  ['invalid slug', f => { f.config.components[0].slug = '../../escape'; }],
  ['duplicate identity', f => { f.config.components.push(f.config.components[0]); }],
  ['missing source', f => { f.config.components[0].path = 'missing'; }],
  ['invalid version', f => { f.config.wordpress_version = '--bad'; }]
]) test(`reject ${name} without replacing existing copies`, t => {
  const f = fixture(t); prepare(f.manifest); alter(f); f.save();
  assert.throws(() => prepare(f.manifest));
  assert.ok(fs.existsSync(path.join(f.content, 'plugins/example/example.php')));
});
test('refuse unmanaged component replacement', t => {
  const f = fixture(t); f.write('.playground/wordpress/wp-content/plugins/example/keep', 'keep');
  assert.throws(() => prepare(f.manifest), /unmanaged/);
  assert.equal(fs.readFileSync(path.join(f.content, 'plugins/example/keep'), 'utf8'), 'keep');
});
test('reject source symlinks before replacing installed copies', t => {
  const f = fixture(t); prepare(f.manifest);
  fs.symlinkSync(path.join(f.dir, 'sources/theme'), path.join(f.dir, 'sources/example/link'));
  assert.throws(() => prepare(f.manifest), /Symlink/);
  assert.ok(fs.existsSync(path.join(f.content, 'plugins/example/example.php')));
});
for (const count of [0, 1]) test(`${count} component workspace preserves bundled themes`, t => {
  const f = fixture(t); f.config.components = f.config.components.slice(0, count); f.save(); prepare(f.manifest);
  assert.equal(fs.readFileSync(path.join(f.content, 'themes/bundled/style.css'), 'utf8'), 'bundled');
});
test('native plugin and theme archives have correct contents and checksums', t => {
  const f = fixture(t);
  f.write('sources/example/.env', 'fixture'); f.write('sources/example/node_modules/dev.txt', 'exclude');
  f.write('sources/example/vendor/runtime.php', '<?php // runtime');
  for (const [kind, source, entry] of [['plugin', 'example', 'example.php'], ['theme', 'theme', 'style.css']]) {
    const slug = `my-${kind}`;
    for (let i = 0; i < 2; i++) execFileSync('sh', [path.join(root, 'scripts/package-extension.sh'), kind, path.join(f.dir, 'sources', source), path.join(f.dir, 'dist'), slug]);
    const archives = fs.readdirSync(path.join(f.dir, 'dist'), { recursive: true }).filter(n => n.endsWith('.zip') && n.includes(slug));
    assert.equal(archives.length, 2);
    for (const name of archives) {
      const zip = path.join(f.dir, 'dist', name);
      const listing = execFileSync('unzip', ['-Z1', zip], { encoding: 'utf8' });
      assert.ok(listing.includes(`${slug}/${entry}`)); assert.ok(!listing.includes('/.env')); assert.ok(!listing.includes('/node_modules/'));
      if (kind === 'plugin') assert.ok(listing.includes('/vendor/runtime.php'));
      assert.equal(fs.readFileSync(zip + '.sha256', 'utf8').split(/\s/)[0], createHash('sha256').update(fs.readFileSync(zip)).digest('hex'));
    }
  }
});
test('invalid package inputs fail', t => {
  const f = fixture(t);
  const run = () => spawnSync('sh', [path.join(root, 'scripts/package-extension.sh'), 'plugin', path.join(f.dir, 'sources/example'), path.join(f.dir, 'dist')]).status;
  fs.unlinkSync(path.join(f.dir, 'sources/example/.distignore')); assert.notEqual(run(), 0);
  f.write('sources/example/.distignore', 'example.php\n'); assert.notEqual(run(), 0);
  f.write('sources/example/.distignore', ''); f.write('sources/example/second.php', '<?php\n/*\nPlugin Name: Second\nVersion: 1.0\n*/'); assert.notEqual(run(), 0);
});
test('starter workspace validates then installs WP-CLI then prepares; recommendations available before setup', () => {
  const w = JSON.parse(fs.readFileSync(path.join(root, 'examples/setup.code-workspace')));
  assert.equal(w.folders[0].path, '.');
  assert.equal(w.tasks.tasks[0].dependsOrder, 'sequence');
  assert.deepEqual(w.tasks.tasks[0].dependsOn, w.tasks.tasks.slice(1).map(t => t.label));
  assert.ok(w.extensions.recommendations.includes('WordPressPlayground.wordpress-playground'));
});
test('CLI runs through a linked framework path and handles spaces', t => {
  const f = fixture(t);
  const link = path.join(f.dir, 'linked framework'); fs.symlinkSync(root, link);
  const output = execFileSync('node', [path.join(link, 'scripts/workspace.mjs'), 'validate', f.manifest], { encoding: 'utf8' });
  assert.match(output, /Valid workspace: 2 components/);
});
