import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { setupProject } from '../scripts/setup-project.mjs';
const root = path.resolve(import.meta.dirname, '..');
const git = (cwd, ...args) => execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8', stdio: ['ignore','pipe','pipe'] }).trim();
function fixture(t) {
 const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'existing project '));
 t.after(()=>fs.rmSync(tmp,{recursive:true,force:true}));
 const upstream=path.join(tmp,'upstream'), project=path.join(tmp,'project');
 for(const dir of [upstream,project]) {fs.mkdirSync(dir);git(dir,'init','-b','main');git(dir,'config','user.email','fixture@example.invalid');git(dir,'config','user.name','Fixture');}
 fs.cpSync(path.join(root,'examples'),path.join(upstream,'examples'),{recursive:true});
 fs.writeFileSync(path.join(upstream,'VERSION'),'0.4.0\n');git(upstream,'add','.');git(upstream,'commit','-m','release fixture');git(upstream,'tag','v0.4.0');
 fs.writeFileSync(path.join(upstream,'newer'),'newer commit');git(upstream,'add','.');git(upstream,'commit','-m','newer branch commit');
 fs.writeFileSync(path.join(project,'existing.txt'),'keep');fs.writeFileSync(path.join(project,'.gitignore'),'existing-rule\n');git(project,'add','.');git(project,'commit','-m','existing project');
 git(project,'-c','protocol.file.allow=always','submodule','add',upstream,'tools/wordpress-playground');
 return {project,framework:path.join(project,'tools/wordpress-playground')};
}
test('setup pins release, creates missing files and sources, preserves existing project, and is repeatable',t=>{
 const f=fixture(t);setupProject(f.framework,{prepare:false});
 assert.equal(git(f.framework,'rev-parse','HEAD'),git(f.framework,'rev-parse','v0.4.0'));
 assert.equal(fs.readFileSync(path.join(f.project,'existing.txt'),'utf8'),'keep');
 assert.ok(fs.existsSync(path.join(f.project,'sources/.gitkeep')));
 assert.ok(fs.existsSync(path.join(f.project,'setup.code-workspace')));
 const ignore=fs.readFileSync(path.join(f.project,'.gitignore'),'utf8');assert.ok(ignore.startsWith('existing-rule\n'));
 fs.writeFileSync(path.join(f.project,'sources/plugin.php'),'source');
 const config='{"schema":1,"components":[],"custom":"preserved"}\n';fs.writeFileSync(path.join(f.project,'workspace.json'),config);
 setupProject(f.framework,{prepare:false});
 assert.equal(fs.readFileSync(path.join(f.project,'workspace.json'),'utf8'),config);
 assert.equal(fs.readFileSync(path.join(f.project,'.gitignore'),'utf8'),ignore);
 assert.equal(fs.readFileSync(path.join(f.project,'sources/plugin.php'),'utf8'),'source');
 assert.ok(git(f.project,'ls-files','--stage','tools/wordpress-playground').includes(git(f.framework,'rev-parse','HEAD')));
});
test('incompatible existing configuration stops before pinning or copying',t=>{
 const f=fixture(t);const head=git(f.framework,'rev-parse','HEAD');fs.writeFileSync(path.join(f.project,'workspace.json'),'{"other":true}');
 assert.throws(()=>setupProject(f.framework,{prepare:false}),/another format/);
 assert.equal(git(f.framework,'rev-parse','HEAD'),head);assert.equal(fs.existsSync(path.join(f.project,'setup.code-workspace')),false);
});
test('existing sources directory is kept intact without adding a placeholder',t=>{
 const f=fixture(t);fs.mkdirSync(path.join(f.project,'sources'));fs.writeFileSync(path.join(f.project,'sources/keep'),'keep');setupProject(f.framework,{prepare:false});
 assert.equal(fs.readFileSync(path.join(f.project,'sources/keep'),'utf8'),'keep');assert.equal(fs.existsSync(path.join(f.project,'sources/.gitkeep')),false);
});
test('dirty framework is never switched',t=>{
 const f=fixture(t);fs.writeFileSync(path.join(f.framework,'local-work'),'keep');assert.throws(()=>setupProject(f.framework,{prepare:false}),/local changes/);
 assert.equal(fs.readFileSync(path.join(f.framework,'local-work'),'utf8'),'keep');
});
