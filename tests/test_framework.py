import hashlib
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest
import zipfile

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('workspace', ROOT/'scripts/workspace.py')
workspace = importlib.util.module_from_spec(spec)
spec.loader.exec_module(workspace)


class FrameworkTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix='framework test ')
        self.project = Path(self.tmp.name)
        self.plugin = self.project/'sources/example'
        self.theme = self.project/'sources/baseline'
        self.plugin.mkdir(parents=True)
        self.theme.mkdir(parents=True)
        (self.plugin/'example.php').write_text('<?php\n/*\nPlugin Name: Example\nVersion: 1.2.3\n*/\n')
        (self.theme/'style.css').write_text('/*\nTheme Name: Baseline\nVersion: 2.3.4\n*/\n')
        (self.theme/'index.php').write_text('<?php // fixture')
        for path in (self.plugin, self.theme):
            (path/'.distignore').write_text('.distignore\n.env\nnode_modules\n.git\n')
        core = self.project/'.playground/wordpress'
        (core/'wp-content').mkdir(parents=True)
        (core/'wp-load.php').write_text('<?php // existing core fixture')
        self.manifest = self.project/'workspace.json'
        self.config = {'schema':1,'components':[
            {'type':'theme','slug':'baseline','path':'sources/baseline'},
            {'type':'plugin','slug':'example','path':'sources/example'}]}
        self.save()

    def tearDown(self):
        self.tmp.cleanup()

    def save(self):
        self.manifest.write_text(json.dumps(self.config))

    def test_prepare_refresh_and_remove_preserve_content(self):
        workspace.prepare(self.manifest)
        content = self.project/'.playground/wordpress/wp-content'
        (content/'uploads').mkdir()
        (content/'uploads/keep.txt').write_text('keep')
        (content/'plugins/unmanaged').mkdir()
        (content/'plugins/unmanaged/keep.php').write_text('keep')
        (self.plugin/'new.txt').write_text('new')
        workspace.prepare(self.manifest)
        self.assertEqual((content/'plugins/example/new.txt').read_text(),'new')
        self.assertEqual((content/'uploads/keep.txt').read_text(),'keep')
        self.assertTrue((content/'plugins/unmanaged/keep.php').exists())
        self.assertTrue(list((self.project/'.playground/previous-copies').glob('*/plugins/example/example.php')))
        self.config['components'].pop()
        self.save()
        workspace.prepare(self.manifest)
        self.assertFalse((content/'plugins/example').exists())
        self.assertTrue((self.plugin/'example.php').exists())

    def test_tasks_use_source_and_first_runtime_folder(self):
        workspace.prepare(self.manifest)
        data=json.loads((self.project/'wordpress.generated.code-workspace').read_text())
        self.assertEqual(data['folders'][0]['path'],'.playground/wordpress')
        tasks=data['tasks']['tasks']
        package=next(t for t in tasks if t['label']=='Package plugin: example')
        self.assertIn('${workspaceFolder:Workspace}/sources/example',package['args'])
        self.assertFalse(any('start' in str(t['args']) for t in tasks))

    def test_invalid_slug_does_not_create_runtime(self):
        self.config['components'][1]['slug']='../../escape';self.save()
        with self.assertRaises(ValueError): workspace.prepare(self.manifest)
        self.assertFalse((self.project/'.playground/managed-components.json').exists())

    def test_duplicate_identity_rejected(self):
        self.config['components'].append(self.config['components'][1]);self.save()
        with self.assertRaises(ValueError):workspace.prepare(self.manifest)

    def test_missing_source_leaves_existing_copy(self):
        workspace.prepare(self.manifest)
        self.config['components'][1]['path']='missing';self.save()
        with self.assertRaises(ValueError):workspace.prepare(self.manifest)
        self.assertTrue((self.project/'.playground/wordpress/wp-content/plugins/example/example.php').exists())

    def test_unmanaged_destination_is_not_overwritten(self):
        target=self.project/'.playground/wordpress/wp-content/plugins/example';target.mkdir(parents=True)
        (target/'keep').write_text('keep')
        with self.assertRaises(ValueError):workspace.prepare(self.manifest)
        self.assertEqual((target/'keep').read_text(),'keep')

    def test_symlink_rejected_before_existing_copy_changes(self):
        workspace.prepare(self.manifest)
        (self.plugin/'linked').symlink_to(self.theme, target_is_directory=True)
        with self.assertRaises(ValueError):workspace.prepare(self.manifest)
        self.assertTrue((self.project/'.playground/wordpress/wp-content/plugins/example/example.php').exists())

    def test_plugin_only_workspace_preserves_bundled_theme(self):
        bundled=self.project/'.playground/wordpress/wp-content/themes/bundled'
        bundled.mkdir(parents=True);(bundled/'style.css').write_text('core theme')
        self.config['components']=[self.config['components'][1]];self.save()
        workspace.prepare(self.manifest)
        self.assertEqual((bundled/'style.css').read_text(),'core theme')

    def test_empty_workspace_accepted(self):
        self.config['components']=[];self.save()
        workspace.prepare(self.manifest)
        self.assertTrue((self.project/'wordpress.generated.code-workspace').exists())

    def package(self,kind,source,slug='package-example'):
        return subprocess.run(['sh',str(ROOT/'scripts/package-extension.sh'),kind,str(source),str(self.project/'artifacts'),slug],text=True,capture_output=True)

    def test_real_plugin_and_theme_packages(self):
        self.assertTrue((ROOT/'.tools/wp-cli/wp-cli.phar').exists(),'Run setup-packaging.sh before tests')
        (self.plugin/'.env').write_text('fixture-only')
        (self.plugin/'vendor').mkdir();(self.plugin/'vendor/runtime.php').write_text('<?php // required')
        (self.plugin/'node_modules').mkdir();(self.plugin/'node_modules/dev.txt').write_text('not runtime')
        for kind,source,slug,entry in [('plugin',self.plugin,'my-plugin','example.php'),('theme',self.theme,'my-theme','style.css')]:
            for _ in range(2):
                result=self.package(kind,source,slug)
                self.assertEqual(result.returncode,0,result.stdout+result.stderr)
            archives=list((self.project/'artifacts').glob(slug+'*/*.zip'))
            self.assertEqual(len(archives),2)
            for archive in archives:
                with zipfile.ZipFile(archive) as z:
                    self.assertIn(slug+'/'+entry,z.namelist())
                    self.assertFalse(any('/.env' in n or '/node_modules/' in n for n in z.namelist()))
                    if kind=='plugin':self.assertIn(slug+'/vendor/runtime.php',z.namelist())
                checksum=Path(str(archive)+'.sha256').read_text().split()[0]
                self.assertEqual(checksum,hashlib.sha256(archive.read_bytes()).hexdigest())

    def test_bad_package_inputs_fail(self):
        (self.plugin/'.distignore').unlink()
        self.assertNotEqual(self.package('plugin',self.plugin).returncode,0)
        (self.plugin/'.distignore').write_text('example.php\n')
        self.assertNotEqual(self.package('plugin',self.plugin).returncode,0)
        (self.plugin/'.distignore').write_text('')
        (self.plugin/'second.php').write_text('<?php\n/*\nPlugin Name: Second\nVersion: 1.0\n*/')
        self.assertNotEqual(self.package('plugin',self.plugin).returncode,0)


if __name__=='__main__':unittest.main()
