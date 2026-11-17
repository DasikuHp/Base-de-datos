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
IMG2 = SRC          # imágenes propias del juego (bda-quest-src/img/...)

def inline_images(js: str) -> str:
    def rep(m):
        path = IMG / m.group(1)
        if not path.exists(): path = IMG2 / m.group(1)
        data = base64.b64encode(path.read_bytes()).decode()
        return f"img:'data:image/png;base64,{data}'"
    return re.sub(r"img:'(img/[^']+\.png)'", rep, js)

DATA_FILES = ('units.js', 'units2.js', 'cases.js', 'cases2.js', 'bank.js', 'bank2.js', 'seeds.js', 'sqlcheck.js', 'sqlengine.js', 'ddlgen.js', 'dml.js', 'dml2.js', 'paper-data.js', 'paper-data2.js', 'paper-data3.js')
data = '\n'.join((SRC / f).read_text(encoding='utf-8') for f in DATA_FILES)
data = inline_images(data)
app = (SRC / 'app.js').read_text(encoding='utf-8').replace('/*TASKS2*/', (SRC / 'tasks2.js').read_text(encoding='utf-8')).replace('/*PAPER*/', (SRC / 'paper.js').read_text(encoding='utf-8'))
html = (SRC / 'template.html').read_text(encoding='utf-8')
html = html.replace('/*DATA*/', data.replace('</script', '<\\/script')).replace('/*APP*/', app.replace('</script', '<\\/script'))
out = ROOT / 'BDA-QUEST.html'
out.write_text(html, encoding='utf-8')
print(f'{out.name}: {out.stat().st_size/1024:.0f} KB')
