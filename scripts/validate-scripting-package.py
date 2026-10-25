"""Check the published-project contract, not execution in the iPhone importer.

Criteria: ScriptingApp/scripting-app-development project-and-lifecycle.md;
archive layout inspected in ScriptingApp/Community-Scripts/test.scripting.
"""
import json
import pathlib
import re
import sys
import zipfile


def validate_files(files, expected_name=None):
    for required in ('script.json', 'index.tsx'):
        if required not in files:
            raise ValueError(f'Missing root {required}')
    descriptor = json.loads(files['script.json'])
    for key in ('name', 'icon', 'color', 'version'):
        if not isinstance(descriptor.get(key), str) or not descriptor[key].strip():
            raise ValueError(f'Invalid script.json {key}')
    if expected_name and descriptor['name'] != expected_name:
        raise ValueError('Project directory and script name differ')
    for name in files:
        parts = pathlib.PurePosixPath(name)
        if parts.is_absolute() or '..' in parts.parts or '\\' in name:
            raise ValueError('Unsafe project path')
    # The generated entry is a self-contained native adapter. No dependencies
    # outside the imported directory may be necessary to execute it.
    source = files['index.tsx'].decode('utf-8')
    for module in re.findall(r'from\s+[\'"]([^\'"]+)[\'"]', source):
        if module != 'scripting':
            raise ValueError(f'Unbundled entry dependency: {module}')
    return descriptor


def validate(target):
    target = pathlib.Path(target)
    if target.is_dir():
        files = {str(p.relative_to(target)).replace('\\', '/'): p.read_bytes()
                 for p in target.rglob('*') if p.is_file()}
        descriptor = validate_files(files, target.name)
    else:
        if target.suffix != '.scripting':
            raise ValueError('Publisher contract requires the canonical .scripting extension')
        with zipfile.ZipFile(target) as archive:
            if archive.testzip() is not None:
                raise ValueError('Corrupt archive')
            files = {n: archive.read(n) for n in archive.namelist() if not n.endswith('/')}
            descriptor = validate_files(files)
    return {'validation': 'project-contract-only', 'target': str(target),
            'version': descriptor['version'], 'name': descriptor['name'],
            'files': len(files), 'iphoneImportTested': False}


if __name__ == '__main__':
    try:
        print(json.dumps(validate(sys.argv[1]), ensure_ascii=False))
    except (ValueError, KeyError, zipfile.BadZipFile) as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
