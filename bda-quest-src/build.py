#!/usr/bin/env python3
"""Junta BDA-QUEST en un único HTML (../BDA-QUEST.html) con las imágenes incrustadas,
para poder pasarlo por WhatsApp o correo y abrirlo sin internet.

Uso:  python3 bda-quest-src/build.py
"""
import base64, re
from pathlib import Path

SRC = Path(__file__).resolve().parent
ROOT = SRC.parent
IMG = ROOT / 'apuntes-bda'

def inline_images(js: str) -> str:
    def rep(m):
        path = IMG / m.group(1)
        data = base64.b64encode(path.read_bytes()).decode()
        return f"img:'data:image/png;base64,{data}'"
    return re.sub(r"img:'(img/[^']+\.png)'", rep, js)

data = '\n'.join((SRC / f).read_text(encoding='utf-8') for f in ('units.js', 'cases.js', 'bank.js'))
data = inline_images(data)
app = (SRC / 'app.js').read_text(encoding='utf-8')
html = (SRC / 'template.html').read_text(encoding='utf-8')
html = html.replace('/*DATA*/', data.replace('</script', '<\\/script')).replace('/*APP*/', app.replace('</script', '<\\/script'))
out = ROOT / 'BDA-QUEST.html'
out.write_text(html, encoding='utf-8')
print(f'{out.name}: {out.stat().st_size/1024:.0f} KB')
