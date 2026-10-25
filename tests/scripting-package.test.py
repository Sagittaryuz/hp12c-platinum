import importlib.util
import json
import pathlib
import sys
sys.dont_write_bytecode = True
import tempfile
import unittest
import zipfile

spec = importlib.util.spec_from_file_location('package_contract', pathlib.Path(__file__).parents[1] / 'scripts/validate-scripting-package.py')
contract = importlib.util.module_from_spec(spec)
spec.loader.exec_module(contract)


class ScriptingContract(unittest.TestCase):
    def archive(self, root, name='calculator.scripting', manifest='script.json', prefix=''):
        target = pathlib.Path(root) / name
        with zipfile.ZipFile(target, 'w') as archive:
            archive.writestr(prefix + 'index.tsx', 'import {Script} from "scripting"; Script.exit()')
            archive.writestr(prefix + manifest, json.dumps(dict(name='Calculator', icon='function', color='#c6c6c6', version='1.0.0')))
        return target

    def test_official_archive_root_contract(self):
        with tempfile.TemporaryDirectory() as root:
            self.assertEqual(contract.validate(self.archive(root))['name'], 'Calculator')

    def test_publisher_does_not_distribute_generic_zip_to_remote_import(self):
        with tempfile.TemporaryDirectory() as root:
            with self.assertRaisesRegex(ValueError, '.scripting'):
                contract.validate(self.archive(root, name='calculator.zip'))

    def test_renaming_original_metadata_is_not_sufficient(self):
        with tempfile.TemporaryDirectory() as root:
            with self.assertRaisesRegex(ValueError, 'root script.json'):
                contract.validate(self.archive(root, manifest='metadata.json'))

    def test_nested_project_is_not_the_official_archive_root(self):
        with tempfile.TemporaryDirectory() as root:
            with self.assertRaisesRegex(ValueError, 'root script.json'):
                contract.validate(self.archive(root, prefix='Calculator/'))

    def test_descriptor_requires_all_official_fields(self):
        with self.assertRaisesRegex(ValueError, 'icon'):
            contract.validate_files({'script.json': b'{"name":"Calculator"}', 'index.tsx': b''})

    def test_entry_cannot_depend_on_sources_outside_remote_project(self):
        files={'script.json': json.dumps(dict(name='Calculator', icon='function', color='gray', version='1.0')).encode(), 'index.tsx': b'import {store} from "../host-state.mjs"'}
        with self.assertRaisesRegex(ValueError, 'Unbundled'):
            contract.validate_files(files)


if __name__ == '__main__':
    unittest.main()
