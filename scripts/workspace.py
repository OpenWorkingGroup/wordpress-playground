#!/usr/bin/env python3
"""Prepare disposable integration copies and VS Code tasks from project configuration."""
import argparse
import datetime
import json
import os
from pathlib import Path
import re
import shutil
import tempfile

FRAMEWORK = Path(__file__).resolve().parents[1]
SLUG = re.compile(r'^[a-z0-9][a-z0-9_-]*$')
IGNORED = {'.git', '.tools', 'node_modules', '.DS_Store', '__pycache__'}


def read_config(manifest):
    manifest = Path(manifest).resolve()
    project = manifest.parent
    config = json.loads(manifest.read_text())
    if config.get('schema') != 1 or not isinstance(config.get('components'), list):
        raise ValueError('Expected schema: 1 and a components array')
    components, seen = [], set()
    for item in config['components']:
        kind, slug, source = item.get('type'), item.get('slug'), item.get('path')
        if kind not in ('plugin', 'theme') or not isinstance(slug, str) or not SLUG.fullmatch(slug):
            raise ValueError('Each component requires type plugin/theme and a safe lowercase slug')
        if not isinstance(source, str) or Path(source).is_absolute():
            raise ValueError('Component paths must be relative to workspace.json')
        key = f'{kind}s/{slug}'
        if key in seen:
            raise ValueError(f'Duplicate component: {key}')
        seen.add(key)
        path = (project / source).resolve()
        if not path.is_dir():
            raise ValueError(f'Missing source: {source}')
        runtime = (project / '.playground').resolve()
        if path == project or path in runtime.parents or path == runtime or runtime in path.parents:
            raise ValueError('Source must not contain or live inside generated runtime storage')
        if kind == 'theme' and not (path / 'style.css').is_file():
            raise ValueError(f'Theme missing style.css: {source}')
        if kind == 'plugin' and not any(re.search(r'^[ \t/*#@]*Plugin Name:', p.read_text(errors='replace')[:8192], re.M)
                                        for p in path.glob('*.php')):
            raise ValueError(f'Plugin header missing: {source}')
        components.append(dict(item, key=key, source=path))
    return project, config, components


def copy_source(source, destination):
    # Reject symlinks instead of silently exporting files outside the selected source.
    for parent, dirs, files in os.walk(source, followlinks=False):
        dirs[:] = [d for d in dirs if d not in IGNORED]
        for name in dirs + [f for f in files if f not in IGNORED]:
            if (Path(parent) / name).is_symlink():
                raise ValueError(f'Symlink requires a prepared real-file source: {Path(parent) / name}')
    shutil.copytree(source, destination, ignore=shutil.ignore_patterns(*IGNORED))


def prepare(manifest):
    project, config, components = read_config(manifest)
    if not any(c['type'] == 'theme' for c in components):
        raise ValueError('Include a default/baseline theme: wp-content mode hides bundled core themes')
    runtime = project / '.playground'
    if runtime.is_symlink():
        raise ValueError('Runtime directory must not be a symlink')
    runtime.mkdir(exist_ok=True)
    content = runtime / 'wp-content'
    for path in [content, content / 'plugins', content / 'themes']:
        if path.is_symlink():
            raise ValueError('Integration directories must not be symlinks')
    state_file = runtime / 'managed-components.json'
    previous = json.loads(state_file.read_text()) if state_file.exists() else []
    if not isinstance(previous, list) or any(not re.fullmatch(r'(plugins|themes)/[a-z0-9][a-z0-9_-]*', x) for x in previous):
        raise ValueError('Invalid managed component record')
    for key in set(previous) | {c['key'] for c in components}:
        target = content / key
        if target.is_symlink() or (target.exists() and not target.is_dir()):
            raise ValueError(f'Unsafe integration destination: {key}')
        if target.exists() and key not in previous:
            raise ValueError(f'Refusing to overwrite an unmanaged installed component: {key}')
    # Copy and validate every source before touching any installed copy.
    with tempfile.TemporaryDirectory(prefix='prepare-', dir=runtime) as tmp:
        staged = Path(tmp)
        for c in components:
            copy_source(c['source'], staged / c['key'])
        for kind in ('plugins', 'themes'):
            (content / kind).mkdir(parents=True, exist_ok=True)
        archive = runtime / 'previous-copies' / datetime.datetime.now().strftime('%Y%m%dT%H%M%S%f')
        for key in previous:
            target = content / key
            if target.exists():
                saved = archive / key
                saved.parent.mkdir(parents=True, exist_ok=True)
                target.rename(saved)
        for c in components:
            (staged / c['key']).rename(content / c['key'])
    state_file.write_text(json.dumps([c['key'] for c in components], indent=2) + '\n')
    write_vscode(project, components, Path(manifest).name)
    print('Prepared copies. Open wordpress.generated.code-workspace; start Playground there.')
    print('Previous copies are retained under .playground/previous-copies. Sources and uploads are unchanged.')


def write_vscode(project, components, manifest_name):
    framework = Path(os.path.relpath(FRAMEWORK, project)).as_posix()
    base = '${workspaceFolder:Workspace}'
    tool = base + '/' + framework
    tasks = [dict(label='Framework: Set up packaging', type='process', command='sh',
                  args=[tool+'/scripts/setup-packaging.sh'], problemMatcher=[]),
             dict(label='Workspace: Refresh copies (stop Playground first)', type='process', command='python3',
                  args=[tool+'/scripts/workspace.py','prepare',base+'/'+manifest_name], problemMatcher=[])]
    folders = [dict(name='WordPress', path='.playground/wp-content'), dict(name='Workspace', path='.')]
    for c in components:
        label = c.get('name', c['slug'])
        folders.append(dict(name=f"{label} ({c['type']})", path=c['path']))
        tasks.append(dict(label=f"Package {c['type']}: {label}", type='process', command='sh',
                          args=[tool+'/scripts/package-extension.sh',c['type'],base+'/'+c['path'],base+'/dist',c['slug']],
                          problemMatcher=[]))
    workspace = dict(folders=folders, extensions=dict(recommendations=['WordPressPlayground.wordpress-playground']),
                     settings={'files.exclude': {'**/.tools': True, '**/.playground': True}},
                     tasks=dict(version='2.0.0', tasks=tasks))
    (project/'wordpress.generated.code-workspace').write_text(json.dumps(workspace, indent=2)+'\n')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['validate', 'prepare'])
    parser.add_argument('manifest', nargs='?', default='workspace.json')
    args = parser.parse_args()
    try:
        if args.command == 'prepare':
            prepare(args.manifest)
        else:
            _, _, components = read_config(args.manifest)
            print(f'Valid workspace: {len(components)} components')
    except (ValueError, OSError, KeyError, TypeError) as exc:
        parser.exit(1, f'Error: {exc}\n')


if __name__ == '__main__':
    main()
