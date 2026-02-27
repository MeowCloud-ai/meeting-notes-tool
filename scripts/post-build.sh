#!/bin/bash
set -e
cp manifest.json dist/manifest.json
cp -r icons dist/icons
sed -i 's|"service_worker": "src/background/index.ts"|"service_worker": "background.js"|' dist/manifest.json
sed -i 's|"src/content/index.ts"|"content.js"|' dist/manifest.json
echo "✅ post-build done"
