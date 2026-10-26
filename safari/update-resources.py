#!/usr/bin/env python3
"""Refresh Safari's generated resources from the Chrome extension sources."""

import json
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PROJECT = ROOT / 'safari' / 'ZhihuFocus'
RESOURCES = PROJECT / 'Shared (Extension)' / 'Resources'


def update_resources():
    RESOURCES.mkdir(parents=True, exist_ok=True)
    for name in ('content', 'popup', 'shared', 'icons'):
        target = RESOURCES / name
        if target.exists():
            shutil.rmtree(target)
        shutil.copytree(ROOT / name, target)

    manifest = json.loads((ROOT / 'manifest.json').read_text())
    for script in manifest['content_scripts']:
        # Safari ignores include_globs. Exact root/query match patterns keep the
        # home layout limited to the same pages as the Chrome version.
        if 'include_globs' in script:
            script['matches'] = script.pop('include_globs')
    (RESOURCES / 'manifest.json').write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + '\n'
    )

    # Safari implements storage.sync without cross-device synchronization.
    # Keep its preferences explicitly local, with matching onChanged events.
    for path in ('content/focus.js', 'popup/popup.js'):
        target = RESOURCES / path
        source = target.read_text()
        target.write_text(source.replace('chrome.storage.sync', 'chrome.storage.local')
                          .replace("areaName !== 'sync'", "areaName !== 'local'"))

    project_file = PROJECT / 'ZhihuFocus.xcodeproj' / 'project.pbxproj'
    project = project_file.read_text()
    project = re.sub(r'MARKETING_VERSION = [^;]+;',
                     f'MARKETING_VERSION = {manifest["version"]};', project)
    project_file.write_text(project)
    print(f'Safari resources updated: {manifest["version"]}')


if __name__ == '__main__':
    update_resources()
