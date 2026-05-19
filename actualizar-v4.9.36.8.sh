#!/usr/bin/env bash
set -e
VERSION="4.9.36.8-chat-negocio-membresia-admin"
cp app.js ./app.js
cp styles.css ./styles.css
cp service-worker.js ./service-worker.js
cp manifest.json ./manifest.json
cp vercel.json ./vercel.json
python3 - <<'PY'
from pathlib import Path
p=Path('index.html')
if p.exists():
    s=p.read_text(encoding='utf-8')
    import re
    v='4.9.36.8-chat-negocio-membresia-admin'
    s=re.sub(r'styles\.css\?v=[^"\']+', f'styles.css?v={v}', s)
    s=re.sub(r'app\.js\?v=[^"\']+', f'app.js?v={v}', s)
    s=re.sub(r'data-version="[^"]*"', f'data-version="{v}"', s)
    p.write_text(s, encoding='utf-8')
PY
