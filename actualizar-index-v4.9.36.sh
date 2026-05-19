#!/usr/bin/env bash
set -e
if [ ! -f index.html ]; then
  echo "No encuentro index.html. Ejecuta este script desde la raíz del proyecto."
  exit 1
fi
cp index.html "index.html.bak-v4.9.35"
python3 - <<'PY'
from pathlib import Path
p = Path('index.html')
s = p.read_text(encoding='utf-8')
repls = {
    '<title>Conecta Servicios v4.9.35</title>': '<title>Conecta Servicios v4.9.36</title>',
    'styles.css?v=4.9.35-landing-embajadores': 'styles.css?v=4.9.36-final-acceso-membresias',
    'data-version="4.9.35-landing-embajadores"': 'data-version="4.9.36-final-acceso-membresias"',
    'app.js?v=4.9.35-landing-embajadores': 'app.js?v=4.9.36-final-acceso-membresias',
}
for a,b in repls.items():
    s = s.replace(a,b)
p.write_text(s, encoding='utf-8')
print('index.html actualizado a v4.9.36-final-acceso-membresias')
PY
