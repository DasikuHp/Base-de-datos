// BDA-QUEST · MODO PAPEL. Se inserta dentro de app.js (marcador PAPER).
// Flujo: lees el enunciado → lo haces en el folio → 💡 Pista (de una en una) → ✅ Corregir (solución + casillas para puntuarte).
const ALLC = () => [...D.CASES, ...D.PCASES];
const caseAny = id => ALLC().find(c => c.id === id);
const fp = p => `(${p[0]},${p[1]})`;
const strip = h => String(h).replace(/<[^>]+>/g, '');
const noB = h => String(h).replace(/<\/?b>/g, '');          // los enunciados del examen no llevan negritas
const lvlName = l => ({1: '🟢 Fácil', 2: '🟡 Media', 3: '🔴 Difícil'})[l] || '';
function relText(r) {
  if (r.ternary) return `${r.ternary.map(x => `${esc(x.e)} <b>${fp(x.m)}</b>`).join(' — ')} · <b>${esc(r.verb)}</b> (ternaria)${r.attr ? ' · atributo: ' + esc(r.attr) : ''}`;
  if (r.roles) return `${esc(r.a)} <i>[rol ${esc(r.roles.a)}]</i> <b>${fp(r.na)}</b> — ${esc(r.verb)} — <b>${fp(r.nb)}</b> <i>[rol ${esc(r.roles.b)}]</i> ${esc(r.b)} (reflexiva, ${r.tipo})${r.attr ? ' · atributo: ' + esc(r.attr) : ''}`;
  return `${esc(r.a)} <b>${fp(r.na)}</b> — ${esc(r.verb)} — <b>${fp(r.nb)}</b> ${esc(r.b)} · ${r.tipo}${r.attr ? ' · atributo: ' + esc(r.attr) : ''}`;
}
function attrText(a) {
  const f = a[1] || '', n = esc(a[0]);
  if (f.includes('I')) return `<u>${n}</u>`;
  if (f.includes('p')) return `<u style="text-decoration-style:dashed">${n}</u> <i>(clave parcial)</i>`;
  let s = n; if (f.includes('a')) s += ' <i>(única)</i>'; if (f.includes('o')) s += ' <i>(opcional)</i>'; if (f.includes('m')) s += ' <i>(multivalorado)</i>'; if (f.includes('c')) s += ' <i>(componente de compuesto)</i>';
  return s;
}
const entText = e => `<b>${esc(e.n)}</b>(${e.attrs.map(attrText).join(', ')})`;
function marcoText(t, tables) {
  const pk = x => x.cols.filter(c => /P/.test(c[1])).map(c => c[0]);
  const L = [`${t.name} = ${t.cols.map(c => c[0]).join(' + ')}`, `CP(${pk(t).join(', ')})`];
  t.cols.filter(c => /A/.test(c[1])).forEach(c => L.push(`C.Alt(${c[0]})`));
  const groups = new Map();
  t.cols.filter(c => c[2]).forEach(c => { const k = c[2] + '#' + (c[4] || c[0]); if (!groups.has(k)) groups.set(k, {to: c[2], cols: []}); groups.get(k).cols.push(c[0]); });
  groups.forEach(g => { const R = tables.find(x => x.name === g.to); L.push(`C.Aj(${g.cols.join(', ')}) → ${g.to}(${R ? pk(R).slice(0, g.cols.length).join(', ') : 'id'})`); });
  const v = t.cols.filter(c => /V/.test(c[1]) && !/P/.test(c[1])).map(c => `VNN(${c[0]})`); if (v.length) L.push(v.join('  '));
  return L.join('\n');
}
const diagram = c => c.img ? `<img src="${c.img}" alt="E/R" style="max-width:100%;background:#fff">` : (T2.erOf(c).entities.length <= 7 ? T2.erSvgFull(c) : T2.erSvg(c) + `<h4>Atributos</h4><ul class="plist">${T2.erOf(c).entities.map(e => `<li>${entText(e)}</li>`).join('')}</ul>`);
const textoPlegado = c => `<details class="rules"><summary>Enunciado en texto (por si el dibujo no se ve bien)</summary>${rulesList(c)}</details>`;
const rulesList = c => `<ol class="prules">${c.rules.map(r => `<li>${noB(r)}</li>`).join('')}</ol>`;

// ---------- explicación de una sentencia SQL ("cómo se piensa") ----------
function splitTop(s, sep) { const out = []; let d = 0, q = null, cur = ''; for (const ch of s) { if (q) { cur += ch; if (ch === q) q = null; continue; } if (ch === "'" || ch === '"') { q = ch; cur += ch; continue; } if (ch === '(') d++; if (ch === ')') d--; if (ch === sep && d === 0) { out.push(cur.trim()); cur = ''; continue; } cur += ch; } out.push(cur.trim()); return out.filter(Boolean); }
function clausesOf(sql) {
  const mask = sql.replace(/'[^']*'|"[^"]*"/g, m => "'" + 'x'.repeat(m.length - 2) + "'"), re = /\b(SELECT|FROM|WHERE|GROUP\s+BY|HAVING|ORDER\s+BY|LIMIT|SET|VALUES|INTO|UPDATE|DELETE)\b/gi, hits = []; let m;
  while ((m = re.exec(mask))) { const pre = mask.slice(0, m.index); const d = (pre.match(/\(/g) || []).length - (pre.match(/\)/g) || []).length; if (d === 0) hits.push({k: m[1].toUpperCase().replace(/\s+/g, ' '), i: m.index, len: m[0].length}); }
  return hits.map((h, n) => ({k: h.k, t: sql.slice(h.i + h.len, n + 1 < hits.length ? hits[n + 1].i : undefined).trim()}));
}
const cmpWord = {'=': 'es igual a', '<>': 'es distinto de', '<': 'es menor que', '>': 'es mayor que', '<=': 'es menor o igual que', '>=': 'es mayor o igual que'};
function condText(c) {
  let m;
  if ((m = /^(.+?)\s+NOT\s+LIKE\s+(.+)$/i.exec(c))) return `${m[1]} NO sigue el patrón ${m[2]}`;
  if ((m = /^(.+?)\s+LIKE\s+(.+)$/i.exec(c))) return `${m[1]} sigue el patrón ${m[2]} (% = cualquier texto, _ = una letra)`;
  if ((m = /^(.+?)\s+BETWEEN\s+(.+?)§§(.+)$/i.exec(c))) return `${m[1]} está entre ${m[2]} y ${m[3]} (incluye los extremos)`;
  if ((m = /^(.+?)\s+IS\s+NOT\s+NULL$/i.exec(c))) return `${m[1]} tiene valor (no es NULL)`;
  if ((m = /^(.+?)\s+IS\s+NULL$/i.exec(c))) return `${m[1]} no tiene valor (es NULL)`;
  if ((m = /^(.+?)\s+NOT\s+IN\s*\((.+)\)$/i.exec(c))) return `${m[1]} NO es ninguno de (${m[2]})`;
  if ((m = /^(.+?)\s+IN\s*\((.+)\)$/i.exec(c))) return `${m[1]} es uno de (${m[2]})`;
  if ((m = /^(.+?)\s*(<=|>=|<>|=|<|>)\s*(.+)$/.exec(c))) return `${m[1]} ${cmpWord[m[2]]} ${m[3]}`;
  return c;
}
function condsText(t) {
  const prot = t.replace(/BETWEEN\s+('[^']*'|[\w.]+)\s+AND\s+('[^']*'|[\w.]+)/gi, (_, a, b) => `BETWEEN ${a}§§${b}`);
  const parts = prot.split(/\s+(AND|OR)\s+/i), out = [];
  parts.forEach((p, i) => { if (i % 2) out.push(p.toUpperCase() === 'AND' ? ' y ' : ' o '); else out.push(condText(p.replace(/^\(|\)$/g, '').trim())); });
  return out.join('');
}
function itemText(e) {
  let al = null, m; if ((m = /^(.*\S)\s+AS\s+(\w+)$/i.exec(e))) { e = m[1]; al = m[2]; }
  let d;
  if (e === '*') d = 'todas las columnas';
  else if ((m = /^COUNT\s*\(\s*\*\s*\)$/i.exec(e))) d = 'cuenta las filas';
  else if ((m = /^COUNT\s*\(\s*DISTINCT\s+(.+)\)$/i.exec(e))) d = `cuenta los valores distintos de ${m[1]}`;
  else if ((m = /^COUNT\s*\((.+)\)$/i.exec(e))) d = `cuenta los valores no nulos de ${m[1]}`;
  else if ((m = /^(SUM|AVG|MIN|MAX)\s*\((.+)\)$/i.exec(e))) d = `${{SUM: 'suma', AVG: 'media', MIN: 'mínimo', MAX: 'máximo'}[m[1].toUpperCase()]} de ${m[2]}`;
  else if ((m = /^ROUND\s*\((.+),\s*(\d+)\s*\)$/i.exec(e))) d = `${m[1]} redondeado a ${m[2]} decimales`;
  else if (/^CASE\b/i.test(e)) d = 'clasifica con CASE WHEN … THEN … ELSE … END';
  else if ((m = /^(CONCAT_WS|CONCAT)\s*\(/i.exec(e))) d = 'une textos (' + e + ')';
  else if ((m = /^(UPPER|LOWER)\s*\((.+)\)$/i.exec(e))) d = `${m[2]} en ${m[1].toUpperCase() === 'UPPER' ? 'mayúsculas' : 'minúsculas'}`;
  else if ((m = /^(CHAR_LENGTH|LENGTH)\s*\((.+)\)$/i.exec(e))) d = `número de caracteres de ${m[2]}`;
  else if ((m = /^(SUBSTRING|LEFT|RIGHT)\s*\((.+)\)$/i.exec(e))) d = `trozo de texto (${e})`;
  else if ((m = /^(YEAR|MONTH|DAY|DAYNAME|MONTHNAME|TIMESTAMPDIFF)\s*\((.+)\)$/i.exec(e))) d = `parte de una fecha (${e})`;
  else if (/[+\-*/]/.test(e) && !/^\w+$/.test(e)) d = `cálculo: ${e}`;
  else d = `columna ${e}`;
  return al ? `${d} (la columna se llama «${al}»)` : d;
}
function explainOne(sql) {
  sql = sql.trim().replace(/;$/, ''); const cl = clausesOf(sql), g = k => (cl.find(c => c.k === k) || {}).t, steps = [];
  const kind = (/^\s*(SELECT|UPDATE|DELETE|INSERT)/i.exec(sql) || [])[1]; if (!kind) return '';
  if (/^SELECT$/i.test(kind)) {
    if (g('FROM')) steps.push(`<b>FROM</b> ${esc(g('FROM'))}: de qué tabla salen los datos.`);
    if (g('WHERE')) steps.push(`<b>WHERE</b>: se quedan las filas en las que ${esc(condsText(g('WHERE')))}.${/\(\s*SELECT/i.test(g('WHERE')) ? ' La <b>subconsulta</b> entre paréntesis se calcula <b>primero</b> y su resultado se usa en la condición.' : ''}`);
    if (g('GROUP BY')) steps.push(`<b>GROUP BY</b> ${esc(g('GROUP BY'))}: se agrupa, una fila por cada valor.`);
    if (g('HAVING')) steps.push(`<b>HAVING</b>: se quedan los grupos en los que ${esc(condsText(g('HAVING')))}.`);
    const sel = g('SELECT'); if (sel) steps.push(`<b>SELECT</b>: se muestra ${splitTop(sel.replace(/^DISTINCT\s+/i, ''), ',').map(x => esc(itemText(x))).join('; ')}${/^DISTINCT/i.test(sel) ? ' (sin repetir filas: DISTINCT)' : ''}.`);
    if (g('ORDER BY')) steps.push(`<b>ORDER BY</b>: se ordena por ${splitTop(g('ORDER BY'), ',').map(x => /\sDESC$/i.test(x) ? esc(x.replace(/\s+DESC$/i, '')) + ' de mayor a menor' : esc(x.replace(/\s+ASC$/i, '')) + ' de menor a mayor').join(', luego por ')}.`);
    if (g('LIMIT')) steps.push(`<b>LIMIT</b> ${esc(g('LIMIT'))}: solo las ${esc(g('LIMIT'))} primeras filas.`);
  } else if (/^UPDATE$/i.test(kind)) {
    steps.push(`<b>UPDATE</b> ${esc(g('UPDATE'))}: tabla que se modifica.`); steps.push(`<b>SET</b>: ${splitTop(g('SET') || '', ',').map(a => esc(a.replace(/\s*=\s*/, ' pasa a valer '))).join('; ')}.`);
    steps.push(g('WHERE') ? `<b>WHERE</b>: solo en las filas en las que ${esc(condsText(g('WHERE')))}.` : '⚠ Sin WHERE se modificarían TODAS las filas.');
  } else if (/^DELETE$/i.test(kind)) {
    steps.push(`<b>DELETE FROM</b> ${esc((g('FROM') || '').split(/\s+WHERE/i)[0])}: tabla de la que se borra.`);
    steps.push(g('WHERE') ? `<b>WHERE</b>: solo las filas en las que ${esc(condsText(g('WHERE')))}.` : '⚠ Sin WHERE se borrarían TODAS las filas.');
  } else if (/^INSERT$/i.test(kind)) {
    const m = /INSERT\s+INTO\s+(\w+)\s*(\(([^)]*)\))?\s*VALUES\s*(.+)$/is.exec(sql); if (m) { steps.push(`<b>INSERT INTO</b> ${esc(m[1])}: tabla donde se añade.`); steps.push(m[3] ? `Columnas: ${esc(m[3])} (los valores van en ese mismo orden).` : 'Sin lista de columnas: un valor por cada columna de la tabla, en su orden.'); steps.push(`<b>VALUES</b> ${esc(m[4])}: ${splitTop(m[4].replace(/\)\s*,\s*\(/g, '),(').replace(/^\(|\)$/g, ''), ',').length ? 'una fila por cada paréntesis.' : ''}`); }
  }
  return `<ol class="plist">${steps.map(s => `<li>${s}</li>`).join('')}</ol>`;
}
function explainSql(sql) { const parts = String(sql).split(/;\s*(?=(?:SELECT|UPDATE|DELETE|INSERT)\b)/i); return `<h4>Cómo se piensa (en el orden en que MySQL lo ejecuta)</h4>` + parts.map((p, i) => `${parts.length > 1 ? `<p class="small">Sentencia ${i + 1}</p>` : ''}${explainOne(p)}`).join('') + '<p class="small">Orden real: FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT.</p>'; }

// ---------- generador de DDL (modelo → texto) con errores plantados ----------
const lcs = s => String(s).toLowerCase();
function pluralOf(n) { n = lcs(n); return /[aeiou]$/.test(n) ? n + 's' : n + 'es'; }
function ddlModel(tables, names) {
  const byName = n => tables.find(t => t.name === n), pkOf = t => t.cols.filter(c => /P/.test(c[1])).map(c => c[0]), cache = {};
  const typeOf = (t, c, depth = 0) => { const k = t.name + '.' + c[0]; if (cache[k]) return cache[k]; let ty;
    if (c[2] && depth < 6) { const R = byName(c[2]); const grp = t.cols.filter(x => x[2] === c[2] && (x[4] || x[0]) === (c[4] || c[0])); const idx = Math.max(0, grp.findIndex(x => x[0] === c[0])); const rp = R ? pkOf(R) : []; const rc = R && R.cols.find(x => x[0] === (rp[idx] || rp[0])); ty = rc ? typeOf(R, rc, depth + 1) : D.guessType(c[0]); } else ty = D.guessType(c[0]);
    return cache[k] = ty; };
  return (names ? tables.filter(t => names.includes(t.name)) : tables.slice()).map(t => {
    const pk = pkOf(t), groups = new Map();
    t.cols.filter(c => c[2]).forEach(c => { const k = c[2] + '#' + (c[4] || c[0]); if (!groups.has(k)) groups.set(k, {ref: c[2], cols: []}); groups.get(k).cols.push(c[0]); });
    const fks = [...groups.values()].map(g => { const R = byName(g.ref); return {cols: g.cols, ref: g.ref, refCols: (R ? pkOf(R) : ['id']).slice(0, g.cols.length)}; });
    return {name: t.name, pk, fks, cols: t.cols.map(c => { const ty = typeOf(t, c); return {n: c[0], isFk: !!c[2], type: ty, auto: pk.length === 1 && pk[0] === c[0] && !c[2] && /INT/.test(ty) && /^id/.test(lcs(c[0])), nn: /V|P/.test(c[1]), uq: /A/.test(c[1]), opt: /o/.test(c[1])}; })};
  });
}
function renderDdl(model) {
  const lines = [], nameOf = n => { const t = model.find(x => x.name === n); return t && t.plural ? pluralOf(n) : lcs(n); };
  model.forEach((t, ti) => {
    if (ti) lines.push({text: '', errs: []});
    lines.push({text: `CREATE TABLE ${nameOf(t.name)} (`, errs: t.errCreate || []});
    const body = [];
    t.cols.forEach(c => body.push({text: `  ${c.n} ${c.type}${c.auto ? ' AUTO_INCREMENT' : ''}${c.nn && !c.dropNN || c.addNN ? ' NOT NULL' : ''}${c.uq && !c.dropUQ ? ' UNIQUE' : ''}${t.dupPk && t.pk.length === 1 && t.pk[0] === c.n ? ' PRIMARY KEY' : ''}`, errs: c.errs || []}));
    if (!t.noPk) { const pk = t.shortPk ? t.pk.slice(0, 1) : t.pk; body.push({text: `  PRIMARY KEY (${pk.join(', ')})`, errs: t.errPk || []}); }
    t.fks.forEach(f => { if (f.dropped) return; const ref = f.wrong || f.ref, rc = f.wrong ? f.wrongCols : f.refCols; body.push({text: `  FOREIGN KEY (${f.cols.join(', ')}) REFERENCES ${nameOf(ref)}(${rc.join(', ')})`, errs: f.errs || []}); });
    body.forEach((b, i) => lines.push({text: b.text + (i < body.length - 1 ? ',' : ''), errs: b.errs}));
    lines.push({text: ');', errs: []});
  });
  return lines;
}
function mutateDdl(model, k) {
  const errors = []; let uid = 0; const used = new Set(), pick1 = a => a[Math.floor(Math.random() * a.length)];
  const add = (target, html) => { const id = 'g' + (++uid); (target.errs = target.errs || []).push(id); errors.push({id, model: html}); };
  const kinds = ['dropNN', 'addNN', 'dropUQ', 'dropFK', 'wrongFK', 'shortPk', 'noPk', 'plural', 'order', 'dupPk', 'dropNN', 'dropFK'];
  for (let tries = 0; tries < 60 && errors.length < k; tries++) {
    const kind = pick1(kinds), t = pick1(model), key = t.name;
    if (kind === 'dropNN') { const cs = t.cols.filter(c => c.nn && !c.dropNN && !t.pk.includes(c.n) && !used.has(key + c.n)); if (!cs.length) continue; const c = pick1(cs); used.add(key + c.n); c.dropNN = true; add(c, c.isFk ? `<code>${t.name}.${c.n}</code> es una FK <b>obligatoria</b> (mínimo 1: siempre tiene su ${lcs(t.fks.find(f => f.cols.includes(c.n)).ref)}): falta <b>NOT NULL</b> (restricción de existencia).` : `<code>${t.name}.${c.n}</code> es <b>obligatorio</b> (el enunciado no dice que pueda faltar): falta <b>NOT NULL</b>.`); }
    else if (kind === 'addNN') { const cs = t.cols.filter(c => c.opt && !c.addNN && !used.has(key + c.n)); if (!cs.length) continue; const c = pick1(cs); used.add(key + c.n); c.addNN = true; add(c, c.isFk ? `<code>${t.name}.${c.n}</code> es una FK <b>opcional</b> (mínimo 0: puede no tener ${lcs(t.fks.find(f => f.cols.includes(c.n)).ref)}): debe admitir NULL, sobra el NOT NULL.` : `<code>${t.name}.${c.n}</code> es <b>opcional</b> (puede no tener valor): sobra el NOT NULL.`); }
    else if (kind === 'dropUQ') { const cs = t.cols.filter(c => c.uq && !c.dropUQ && !used.has(key + c.n)); if (!cs.length) continue; const c = pick1(cs); used.add(key + c.n); c.dropUQ = true; add(c, `<code>${t.name}.${c.n}</code> es clave alternativa (no puede repetirse): falta <b>UNIQUE</b>.`); }
    else if (kind === 'dropFK') { const fs = t.fks.filter(f => !f.dropped && !f.wrong && !used.has(key + f.cols[0])); if (!fs.length) continue; const f = pick1(fs); used.add(key + f.cols[0]); f.dropped = true; const last = t.cols.find(c => c.n === f.cols[f.cols.length - 1]); add(last, `<b>Falta la FOREIGN KEY</b> <code>FOREIGN KEY (${f.cols.join(', ')}) REFERENCES ${lcs(f.ref)}(${f.refCols.join(', ')})</code> en ${t.name}.`); }
    else if (kind === 'wrongFK') { const fs = t.fks.filter(f => !f.dropped && !f.wrong && f.cols.length === 1 && !used.has(key + f.cols[0])); if (!fs.length) continue; const f = pick1(fs); const others = model.filter(x => x.name !== f.ref && x.name !== t.name && x.pk.length === 1); if (!others.length) continue; const o = pick1(others); used.add(key + f.cols[0]); f.wrong = o.name; f.wrongCols = o.pk.slice(0, 1); add(f, `La FK de <code>${t.name}.${f.cols[0]}</code> apunta a <b>la tabla equivocada</b> (<code>${lcs(o.name)}</code>): debe ser <code>REFERENCES ${lcs(f.ref)}(${f.refCols.join(', ')})</code>.`); }
    else if (kind === 'shortPk') { if (t.pk.length < 2 || t.shortPk || t.noPk || used.has('pk' + key)) continue; used.add('pk' + key); t.shortPk = true; add({get errs() { return t.errPk; }, set errs(v) { t.errPk = v; }}, `La CP de <code>${t.name}</code> debe ser <b>compuesta</b> <code>(${t.pk.join(', ')})</code>. Con solo <code>${t.pk[0]}</code> la tabla admitiría una única fila por ${t.pk[0]}.`); }
    else if (kind === 'noPk') { if (t.noPk || t.shortPk || t.dupPk || used.has('pk' + key)) continue; used.add('pk' + key); t.noPk = true; add({get errs() { return t.errCreate; }, set errs(v) { t.errCreate = v; }}, `<b>${t.name} no tiene clave primaria</b>: debe ser <code>PRIMARY KEY (${t.pk.join(', ')})</code>.`); }
    else if (kind === 'plural') { if (t.plural || used.has('n' + key)) continue; used.add('n' + key); t.plural = true; add({get errs() { return t.errCreate; }, set errs(v) { t.errCreate = v; }}, `<b>Nombre en plural</b>: las tablas se nombran en <b>singular</b> (<code>${lcs(t.name)}</code>, no <code>${pluralOf(t.name)}</code>).`); }
    else if (kind === 'dupPk') { if (t.pk.length !== 1 || t.dupPk || t.noPk || used.has('pk' + key)) continue; used.add('pk' + key); t.dupPk = true; add({get errs() { return t.errPk; }, set errs(v) { t.errPk = v; }}, `<b>PRIMARY KEY dos veces</b> sobre <code>${t.pk[0]}</code> en ${t.name}: ya la lleva en su línea; una tabla tiene una sola clave primaria.`); }
    else if (kind === 'order') { const i = model.indexOf(t), f = t.fks.find(f => !f.dropped && !f.wrong && f.ref !== t.name && model.indexOf(model.find(x => x.name === f.ref)) < i && !used.has('o' + key)); if (!f) continue; const ri = model.indexOf(model.find(x => x.name === f.ref)); used.add('o' + key); model.splice(i + 1, 0, model.splice(ri, 1)[0]); add(f, `<b>Orden de creación</b>: <code>${lcs(t.name)}</code> tiene una FK hacia <code>${lcs(f.ref)}</code>, que se crea <b>después</b>. Hay que crear antes la tabla referenciada.`); }
  }
  return errors;
}

// ---------- chuletas ----------
const CHULETA = {
  dml: '<ol class="plist"><li>Orden: <code>SELECT · FROM · WHERE · GROUP BY · HAVING · ORDER BY · LIMIT</code>.</li><li>Una fila / unas filas concretas: <code>WHERE clave = valor</code>. UPDATE y DELETE <b>siempre</b> con WHERE.</li><li>NULL: <code>IS NULL</code> / <code>IS NOT NULL</code> (nunca = NULL).</li><li>Texto y fechas entre comillas simples; fechas <code>\'AAAA-MM-DD\'</code>.</li><li>LIKE: <code>%</code> = cualquier texto, <code>_</code> = una letra. BETWEEN incluye los extremos.</li><li>AND/OR mezclados → paréntesis. Varias columnas en SET → comas.</li><li>Agregados: COUNT, SUM, AVG, MIN, MAX. Columna normal + agregado → GROUP BY. Filtrar filas → WHERE; filtrar grupos → HAVING.</li><li>Los N mayores: <code>ORDER BY col DESC LIMIT N</code>. Sin repetir: DISTINCT.</li><li>Funciones: CONCAT, UPPER, LOWER, CHAR_LENGTH, SUBSTRING, ROUND, YEAR, MONTH, DAYNAME, CASE WHEN.</li><li>INSERT: <code>INSERT INTO t (cols) VALUES (...)</code>, valores en el orden de las columnas.</li><li>Borrar un padre con hijos: primero los hijos.</li><li><b>Agregado + columna</b> en el mismo SELECT sin GROUP BY: no se puede (<code>SELECT dorsal, MIN(edad)</code>). Datos de la fila del mínimo/máximo → <b>subconsulta</b>: <code>WHERE edad = (SELECT MIN(edad) FROM ciclista)</code>.</li><li>Filtrar <b>antes</b> de agrupar → WHERE; filtrar el resultado de un grupo → HAVING. Orden: WHERE → GROUP BY → HAVING.</li><li>Funciones anidadas: se resuelven de dentro hacia fuera: <code>ROUND(AVG(edad), 1)</code>, <code>UPPER(SUBSTRING(nombre, 1, 3))</code>.</li><li>El alias (<code>AS nombre</code>) <b>no es obligatorio</b>.</li></ol>',
  ddl: '<ol class="plist"><li>Una tabla por entidad (<b>singular</b>) y una intermedia por cada N:M / ternaria / multivalorado.</li><li><b>Esquema entero</b>: <code>DROP DATABASE IF EXISTS x; CREATE DATABASE x; USE x;</code> y después todas las tablas.</li><li>Crea primero las tablas a las que apuntan otras (orden).</li><li>Por tabla: columnas con tipo → <code>NOT NULL</code> si es obligatorio → <code>PRIMARY KEY</code> (compuesta una sola vez) → <code>UNIQUE</code> en alternativas → <code>FOREIGN KEY (x) REFERENCES T(pk)</code>.</li><li>Si el enunciado da un identificador natural (DNI, matrícula, ISBN...) esa es la CP; solo hay <code>id</code> si el enunciado lo da o no hay ninguna clave.</li><li>FK obligatoria (mínimo 1) → NOT NULL; opcional (mínimo 0) → sin NOT NULL. La FK y la columna referenciada, del mismo tipo.</li><li>Tipos: INT, VARCHAR(n), CHAR(n), DATE, DATETIME, DECIMAL(8,2), ENUM(\'a\',\'b\').</li><li>Sin consultas en el DDL.</li></ol>',
  er: '<ol class="plist"><li>Entidades = sustantivos con identificador, en <b>singular</b>. Verbos = relaciones. Datos = atributos.</li><li>Por atributo: identificador (subrayado), opcional, multivalorado (doble óvalo), compuesto, derivado.</li><li>Par (min,max) <b>pegado a la entidad que se cuenta</b>: Cliente (1,1) — realiza — (0,N) Pedido = cada pedido, exactamente 1 cliente; un cliente, 0 a N pedidos. Escribe la frase.</li><li>«Puede / ninguno» → 0 · «siempre / exactamente / al menos uno / todo» → 1 · «varios» → N.</li><li>Reflexiva: mismo nombre en las dos puntas + rol en cada una. Ternaria: tres pares y atributos colgando del rombo.</li><li>Si la misma pareja se repite en fechas distintas, la relación pasa a ser una entidad.</li><li>Entidad débil: no se identifica sola (doble rectángulo, rombo doble, clave parcial). ISA: parcial/total, disyunta/solapada.</li></ol>',
  tab: '<ol class="plist"><li>Una tabla por entidad, por N:M, por ternaria y por atributo multivalorado. Nombres en singular y mayúsculas.</li><li>1:N → FK en la tabla del lado N. N:M → intermedia con las dos FKs y CP compuesta (atributos de la relación ahí).</li><li>Mínimo 1 → VNN en la FK · mínimo 0 → admite NULL. 1:1 → FK + C.Alt (UNIQUE).</li><li>Reflexiva 1:N → FK a la propia tabla. Ternaria → 3 FKs y CP de las tres. Débil → CP = clave del fuerte + parcial.</li><li><b>Existencialidad</b>: mínimo 1 en la entidad del lado "1" → ASERCIÓN <code>PADRE[clave] ⊆ HIJA[fk]</code>. ISA total → <code>SUP ⊆ SUB1 ∪ SUB2</code>; disyunta → <code>SUB1 ∩ SUB2 = ∅</code>.</li><li>Por tabla: CP · C.Alt · C.Aj · VNN.</li></ol>',
  norm: '<ol class="plist"><li>1FN: sin grupos repetidos {} ni valores compuestos → sácalos a otra tabla con la clave del padre.</li><li>2FN: ningún atributo depende de solo una parte de la clave compuesta.</li><li>3FN: ningún atributo depende de otro no clave (transitiva).</li><li>FNBC: todo determinante es clave candidata.</li></ol>'};
const chuletaFor = id => { const k = id.split(':')[0]; return k.startsWith('dml') ? CHULETA.dml : k.startsWith('ddl') ? CHULETA.ddl : (k === 'er' || k === 'card0' || k === 'card1') ? CHULETA.er : (k === 'tab' || k === 'tab0') ? CHULETA.tab : k === 'norm' ? CHULETA.norm : ''; };

// ---------- niveles y minutos ----------
function dmlLevel(t) { if (t.lvl) return t.lvl; const r = [].concat(t.ref || t.bad).join(' '); return /HAVING|CASE|TIMESTAMPDIFF|;\s*\w|ROUND\(.*AVG/i.test(r) || [].concat(t.ref || []).length > 1 ? 3 : /GROUP BY|BETWEEN|LIKE|IN \(|DISTINCT|LIMIT|CONCAT|YEAR|MONTH|SUBSTRING|UPDATE|DELETE|INSERT/i.test(r) ? 2 : 1; }
function paperMeta(id) {
  const k = id.split(':')[0], rest = id.split(':').slice(1).join(':');
  if (k === 'er' || k === 'tab') { const c = caseAny(rest), n = T2.erOf(c).entities.length; return {title: `${k === 'er' ? 'E/R' : 'Tablas'} · ${c.name}`, level: c.level || 2, min: k === 'er' ? 3 + 2 * n : 2 + 2 * c.tables.length}; }
  if (k === 'ddlv') { const c = caseAny(rest); return {title: `DDL validar · ${c.name}`, level: c.level || 2, min: 7}; }
  if (k === 'ddlg') { const c = caseAny(rest); return {title: `DDL con errores (generado) · ${c.name}`, level: c.level || 2, min: 6}; }
  if (k === 'ddlw' || k === 'ddlh') { const c = caseAny(rest), n = ddlNames(c).length; return {title: `DDL desde el E/R · ${c.name}`, level: c.level || 2, min: 3 + 2 * n}; }
  if (k === 'dmlr') { const t = D.DMLR.find(x => x.id === rest); return {title: `DML revisar · ${t.title}`, level: dmlLevel(t), min: 3}; }
  if (k === 'dmlw') { const t = D.DMLW.find(x => x.id === rest), l = dmlLevel(t); return {title: `DML desde cero · ${t.title}`, level: l, min: l === 1 ? 2 : l === 2 ? 4 : 6}; }
  if (k === 'ddls') { const t = D.DDLS.find(x => x.id === rest); return {title: `DDL ${t.title}`, level: t.lvl, min: 3 + t.lvl * 2}; }
  if (k === 'norm') { const t = D.NORM.find(x => x.id === rest); return {title: `Normalización · ${t.title}`, level: /6[a-f]/.test(t.id) ? 1 : 3, min: /6[a-f]/.test(t.id) ? 3 : 8}; }
  if (k === 'card0') return {title: 'Cardinalidades (boletín 0)', level: 1, min: 8};
  if (k === 'card1') return {title: `Relámpago pares · ${+rest + 1}`, level: 1, min: 2};
  if (k === 'tab0') return {title: `Relámpago tablas · ${+rest + 1}`, level: 1, min: 3};
  return {title: id, level: 2, min: 5};
}

// ---------- construcción de cada ejercicio ----------
function paperItem(id) {
  const k = id.split(':')[0], rest = id.split(':').slice(1).join(':'); let it;
  if (k === 'er') it = itemER(caseAny(rest)); else if (k === 'tab') it = itemTab(caseAny(rest)); else if (k === 'ddlv') it = itemDdlV(caseAny(rest)); else if (k === 'ddlg') it = itemDdlG(caseAny(rest));
  else if (k === 'ddlw' || k === 'ddlh') it = itemDdlW(caseAny(rest));
  else if (k === 'dmlr') it = itemDmlR(D.DMLR.find(t => t.id === rest)); else if (k === 'dmlw') it = itemDmlW(D.DMLW.find(t => t.id === rest));
  else if (k === 'ddls') it = itemDdls(D.DDLS.find(t => t.id === rest)); else if (k === 'norm') it = itemNorm(D.NORM.find(t => t.id === rest)); else if (k === 'card0') it = itemCard0(); else if (k === 'card1') it = itemCard1(+rest); else if (k === 'tab0') it = itemTab0(+rest);
  const m = paperMeta(id); it.level = m.level; it.min = m.min; it.chuleta = chuletaFor(id); return it;
}
function itemER(c) {
  const er = T2.erOf(c), hints = [
    `Subraya en el enunciado los sustantivos con identificador: serán entidades. Hay ${er.entities.length}. Todas en singular.`,
    `Las entidades empiezan por: ${er.entities.map(e => esc(e.n[0]) + '…').join(', ')}.`,
    `Busca los verbos: hay ${c.rels.length} relaciones${c.rels.some(r => r.roles) ? ' (alguna es reflexiva: pon un rol en cada punta)' : ''}${c.rels.some(r => r.ternary) ? ' (una es ternaria: tres pares)' : ''}.`,
    'Cada par: «puede / ninguno» → 0 · «siempre / exactamente / al menos uno / todo» → 1 · «varios / muchos» → N. Pon el par pegado a la entidad que se cuenta y escribe la frase al lado.',
    `Atributos: subraya el identificador${er.entities.some(e => e.attrs.some(a => /o/.test(a[1]))) ? ', marca los opcionales' : ''}${er.entities.some(e => e.attrs.some(a => /m/.test(a[1]))) ? ', dobla el óvalo de los multivalorados' : ''}. Lo que no se dice que es opcional es obligatorio.`];
  const rub = [`Entidades en <b>singular</b>: ${er.entities.map(e => esc(e.n)).join(', ')}`,
    ...er.entities.map(e => `Identificador de <b>${esc(e.n)}</b>: ${esc(e.attrs.filter(a => /I|p/.test(a[1])).map(a => a[0]).join(' + ') || '(subtipo: hereda el del supertipo)')}${e.attrs.some(a => /o/.test(a[1])) ? ' · opcionales: ' + esc(e.attrs.filter(a => /o/.test(a[1])).map(a => a[0]).join(', ')) : ''}${e.attrs.some(a => /m/.test(a[1])) ? ' · multivalorados: ' + esc(e.attrs.filter(a => /m/.test(a[1])).map(a => a[0]).join(', ')) : ''}`),
    ...c.rels.map(relText), ...(c.decisions || []).map(d => `${esc(d.title)}: ${esc(d.opts.find(o => o[1])[0])}`), ...(c.extra || []).map(strip).map(esc)];
  const sol = `<h4>Entidades y atributos</h4><ul class="plist">${er.entities.map(e => `<li>${entText(e)}</li>`).join('')}</ul><h4>Relaciones (par pegado a la entidad que se cuenta)</h4><ul class="plist">${c.rels.map(r => `<li>${relText(r)}<br><span class="small">${esc(r.why || '')}</span></li>`).join('')}</ul>${(c.decisions || []).length ? `<h4>Decisiones de modelado</h4><ul class="plist">${c.decisions.map(d => `<li><b>${esc(d.title)}:</b> ${esc(d.opts.find(o => o[1])[0])}<br><span class="small">${esc(d.opts.find(o => o[1])[2])}</span></li>`).join('')}</ul>` : ''}${(c.extra || []).length ? `<h4>Detalles</h4><ul class="plist">${c.extra.map(x => `<li>${x}</li>`).join('')}</ul>` : ''}${(er.traps || []).length ? `<p class="small">No son entidades: ${er.traps.map(t => esc(t.n)).join(', ')}.</p>` : ''}<h4>Dibujo</h4>${c.img ? `<img src="${c.img}" alt="E/R" style="max-width:100%;background:#fff">` : T2.erSvg(c)}<p class="small">Dibujo simplificado (sin atributos ni ISA/débiles): compara entidades y pares.</p>`;
  return {id: 'er:' + c.id, part: 1, title: `E/R · ${c.name}`, src: c.from, statement: `${rulesList(c)}<p>Dibuja el E/R: entidades (singular), atributos (identificador subrayado, opcionales, multivalorados), relaciones con su (min,max), roles en las reflexivas y atributos de las relaciones.</p>`, hints, solution: sol, rubric: rub};
}
function itemTab(c) {
  const er = T2.erOf(c), tables = c.tables;
  const fig = c.img ? `<img src="${c.img}" alt="E/R" style="max-width:100%;background:#fff">` : T2.erSvg(c);
  const hasRefl = c.rels.some(r => r.roles), hasTern = c.rels.some(r => r.ternary);
  const hints = [
    `Pasan a tabla las entidades (${er.entities.length}) más una tabla por cada N:M${hasTern ? ' y por la ternaria' : ''}${er.entities.some(e => e.attrs.some(a => /m/.test(a[1]))) ? ' y por cada atributo multivalorado' : ''}. Total: ${tables.length} tablas. Nombres en singular y mayúsculas.`,
    'En cada 1:N la FK va en la tabla del lado N. En cada N:M, tabla intermedia con las dos FKs y CP compuesta (los atributos de la relación van ahí).',
    `Nulabilidad de cada FK: mínimo 1 → VNN (NOT NULL); mínimo 0 → admite NULL.${hasRefl ? ' La reflexiva es una FK a la misma tabla.' : ''}${hasTern ? ' En la ternaria, CP = las tres FKs.' : ''}`,
    `Existencialidad: mira los pares con mínimo 1 en la entidad del lado "1" (todo X tiene al menos un Y): no sale de la FK, se escribe una ASERCIÓN X[clave] ⊆ Y[fk].${(c.asserts || []).length ? ' Aquí hay ' + c.asserts.length + '.' : ' Aquí quizá no haga falta ninguna.'}`,
    'Para cada tabla repasa las 5 preguntas: CP · C.Alt (únicos) · C.Aj (a quién apunta) · VNN (obligatorios) · ¿CP compuesta?'];
  const rub = [...tables.map(t => `<b>${esc(t.name)}</b>: ${esc(marcoText(t, tables).replace(/\n/g, ' · '))}`), ...(c.asserts || []).map(a => `ASERCIÓN: <code>${esc(a.t)}</code>`), ...((c.asserts || []).length ? [] : ['No invento aserciones: ningún mínimo 1 en el lado "1"']), 'Tablas en singular y en mayúsculas'];
  const sol = `<pre class="code">${esc(tables.map(t => marcoText(t, tables)).join('\n\n'))}${(c.asserts || []).length ? '\n\n' + esc(c.asserts.map((a, i) => `ASERCIÓN ${i + 1}: ${a.t}`).join('\n')) : ''}</pre>${tables.filter(t => t.note).map(t => `<p class="small"><b>${esc(t.name)}:</b> ${esc(t.note)}</p>`).join('')}${(c.asserts || []).map(a => `<p class="small">${esc(a.why)}</p>`).join('')}`;
  return {id: 'tab:' + c.id, part: 2, title: `Paso a tablas · ${c.name}`, src: c.from, statement: `${fig}<h4>Atributos</h4><ul class="plist">${er.entities.map(e => `<li>${entText(e)}</li>`).join('')}</ul><h4>Relaciones (par pegado a la entidad que se cuenta)</h4><ul class="plist">${c.rels.map(r => `<li>${relText(r)}</li>`).join('')}</ul>${(c.extra || []).length ? `<ul class="plist small">${c.extra.map(x => `<li>${x}</li>`).join('')}</ul>` : ''}<p>Haz el paso a tablas con la notación de marco: CP, C.Alt, C.Aj, VNN y las restricciones de existencialidad (aserciones) que exija el diagrama.</p>`, hints, solution: sol, rubric: rub};
}
function itemDdlV(c) {
  const lines = parseDDL(c.ddl), ids = Object.keys(c.errors);
  const num = lines.map((l, i) => `${String(i + 1).padStart(2)}  ${l.text}`).join('\n');
  const prim = e => lines.findIndex(l => l.errs.includes(e)) + 1;
  const hints = [`Hay ${ids.length} errores respecto al enunciado.`, 'Recorre tabla a tabla: ¿PK? ¿FKs (y a qué tabla/columna)? ¿NOT NULL donde toca y solo donde toca? ¿UNIQUE? ¿orden de creación? ¿nombres en singular?', `Errores en las líneas: ${ids.map(prim).sort((a, b) => a - b).join(', ')}.`, 'En el porqué, cita la regla del enunciado (R1, R2...) y di cómo quedaría bien.'];
  return {id: 'ddlv:' + c.id, part: 3, title: `DDL: validar · ${c.name}`, src: c.from, statement: `${diagram(c)}${textoPlegado(c)}<p>Este DDL pretende ser el paso a tablas del E/R. Marca las líneas con error y explica por qué (campo libre). Si falta algo, indica dónde debería ir.</p><pre class="code">${esc(num)}</pre>`, hints,
    solution: `<ol class="plist">${ids.map(e => `<li><b>Línea ${prim(e)}:</b> ${c.errors[e].model}</li>`).join('')}</ol>`, rubric: ids.map(e => `Línea ${prim(e)} encontrada y explicada: ${esc(strip(c.errors[e].model).slice(0, 110))}…`)};
}
function itemDdlG(c) {
  const k = (c.level || 2) === 1 ? 3 : (c.level || 2) === 2 ? 4 : 6, model = ddlModel(c.tables), errors = mutateDdl(model, k), lines = renderDdl(model);
  const num = lines.map((l, i) => `${String(i + 1).padStart(2)}  ${l.text}`).join('\n'), where = id => lines.findIndex(l => l.errs.includes(id)) + 1;
  const hints = [`Hay ${errors.length} errores respecto al enunciado.`, 'Recorre tabla a tabla: ¿PK completa? ¿FKs (y a qué tabla)? ¿NOT NULL donde toca y solo donde toca? ¿UNIQUE? ¿orden de creación? ¿nombres en singular?', `Errores en las líneas: ${errors.map(e => where(e.id)).sort((a, b) => a - b).join(', ')}.`, 'En el porqué, cita la regla del enunciado y di cómo quedaría bien.'];
  return {id: 'ddlg:' + c.id, part: 3, title: `DDL con errores · ${c.name}`, src: 'Generado: cada vez salen errores distintos', statement: `${diagram(c)}${textoPlegado(c)}<p>Este DDL pretende ser el paso a tablas del E/R. Marca las líneas con error y explica por qué (campo libre). Si falta algo, indica dónde debería ir.</p><pre class="code">${esc(num)}</pre>`, hints,
    solution: `<ol class="plist">${errors.map(e => `<li><b>Línea ${where(e.id)}:</b> ${e.model}</li>`).join('')}</ol><details class="rules"><summary>Ver el DDL correcto</summary><pre class="code">${esc(renderDdl(ddlModel(c.tables)).map(l => l.text).join('\n'))}</pre></details>`, rubric: errors.map(e => `Línea ${where(e.id)} encontrada y explicada: ${esc(strip(e.model).slice(0, 100))}…`)};
}
function ddlNames(c) { return c.tables.map(t => t.name); }
const dbHead = c => `DROP DATABASE IF EXISTS ${c.id};\nCREATE DATABASE ${c.id};\nUSE ${c.id};\n\n`;
function itemDdlW(c) {
  const names = ddlNames(c), sub = names.map(n => c.tables.find(t => t.name === n)), model = ddlModel(c.tables, names), sol = dbHead(c) + renderDdl(model).map(l => l.text).join('\n'), all = true;
  const rub = []; sub.forEach(t => { const pk = t.cols.filter(x => /P/.test(x[1])).map(x => x[0]); rub.push(`<b>${esc(t.name)}</b>: PRIMARY KEY (${esc(pk.join(', '))})`);
    const groups = new Map(); t.cols.filter(x => x[2] && names.includes(x[2])).forEach(x => { const g = x[2] + '#' + (x[4] || x[0]); if (!groups.has(g)) groups.set(g, {to: x[2], cols: []}); groups.get(g).cols.push(x[0]); }); groups.forEach(g => rub.push(`FK ${esc(t.name)}(${esc(g.cols.join(', '))}) → ${esc(g.to)}`));
    const nn = t.cols.filter(x => /V/.test(x[1]) && !/P/.test(x[1])).map(x => x[0]); if (nn.length) rub.push(`NOT NULL en ${esc(t.name)}: ${esc(nn.join(', '))}`);
    t.cols.filter(x => /A/.test(x[1])).forEach(x => rub.push(`UNIQUE en ${esc(t.name)}.${esc(x[0])}`)); });
  rub.unshift('DROP DATABASE IF EXISTS + CREATE DATABASE + USE (esquema entero)'); rub.push('Tablas en singular y creadas en el orden correcto'); rub.push('Sin consultas (solo DDL)');
  const er = T2.erOf(c), hints = [`Cada rectángulo es una tabla (singular). Además, una tabla por cada N:M${c.rels.some(r => r.ternary) ? ', por la ternaria' : ''}${er.entities.some(e => e.attrs.some(a => /m/.test(a[1]))) ? ' y por cada atributo multivalorado (doble óvalo)' : ''}. ${all ? 'En total ' + c.tables.length + ' tablas.' : ''}`,
    'En una 1:N, la entidad cuyo par tiene máximo 1 es la que se referencia (lado "1"); la otra tabla lleva la FK. En una N:M, tabla intermedia con las dos FKs y CP compuesta (los atributos de la relación van ahí).',
    'Nulos de la FK (existencia): mínimo 1 en el par de la entidad referenciada → NOT NULL; mínimo 0 → admite NULL. Óvalo con línea discontinua = atributo opcional (sin NOT NULL). Reflexiva: FK a la propia tabla.',
    'Orden: crea primero las tablas a las que apuntan otras. Subrayado = clave primaria. Si el enunciado da un identificador natural (DNI, ISBN...), ese es la CP.'];
  return {id: 'ddlw:' + c.id, part: 3, title: `DDL: desde el E/R · ${c.name}`, src: c.from, statement: `${diagram(c)}${textoPlegado(c)}<p>Crea el <b>esquema entero</b> de este E/R: la base de datos (<code>DROP DATABASE IF EXISTS</code>, <code>CREATE DATABASE</code>, <code>USE</code>) y <b>todas las tablas</b> con sus claves (solo DDL, sin consultas). Tablas en singular y en el orden correcto. La sintaxis fina no es lo importante: cuentan claves, NOT NULL, UNIQUE y FK.</p>`, hints,
    solution: `<pre class="code">${esc(sol)}</pre><p class="small">Los tipos pueden variar: lo que se evalúa son claves, nulos, UNIQUE y FK.</p>`, rubric: rub};
}
function dmlResult(db, sql) {
  const r = runSafe(db, sql); if (r.error) return `<div class="dres bad">❌ ${esc(r.error)}</div>`;
  return r.kind === 'select' ? resultTable(r, 8) : `<p>${esc(r.op)}: <b>${r.affected}</b> fila(s) afectada(s).</p>`;
}
function itemDmlR(t) {
  const hints = ['Simula la sentencia con los datos: ¿qué devuelve o qué cambia exactamente?', 'Repasa la lista: WHERE · comillas · comas · orden de las cláusulas · NULL · paréntesis con AND/OR · ASC/DESC · tipos de las columnas.', `Piensa en: «${esc(t.why[0][0])}».`, 'Escribe la corrección en el folio aunque no estés seguro del porqué.'];
  const ref = [].concat(t.ref)[0];
  return {id: 'dmlr:' + t.id, part: 4, title: `DML: revisar · ${t.title}`, src: 'Sentencia con error', statement: `<p>${esc(t.prompt)}</p>${dataViewer(t.db)}<pre class="code">${esc(t.bad)}</pre><p>¿Qué está mal y por qué? Escribe la explicación y la sentencia corregida.</p>`, hints,
    solution: `<p>${t.model}</p><p><b>Corrección:</b></p><pre class="code">${esc(ref)}</pre><div class="cols2"><div class="dres"><b>Lo que hace la sentencia con error</b>${dmlResult(t.db, t.bad)}</div><div class="dres"><b>Lo que debería hacer</b>${dmlResult(t.db, ref)}</div></div>${explainSql(ref)}`,
    rubric: [`Vi el error: ${esc(strip(t.model).slice(0, 120))}…`, 'Lo expliqué con la idea clave (campo libre)', 'Escribí la sentencia corregida y da el mismo resultado']};
}
function itemDmlW(t) {
  const refs = [].concat(t.ref), hints = [...(t.hints || [])]; if (t.skeleton) hints.push(`Plantilla:<pre class="code">${esc(t.skeleton)}</pre>`);
  hints.unshift('Método: 1) ¿de qué tabla? 2) ¿qué filas (WHERE)? 3) ¿agrupo (GROUP BY / HAVING)? 4) ¿qué columnas o cálculos muestro? 5) ¿orden y LIMIT?');
  return {id: 'dmlw:' + t.id, part: 4, title: `DML: desde cero · ${t.title}`, src: t.src, statement: `<p>${esc(t.prompt)}</p>${dataViewer(t.db)}<p>Escribe la sentencia en el folio.</p>`, hints,
    solution: `${refs.map((r, i) => `<p>${refs.length > 1 ? 'Opción ' + (i + 1) + ':' : '<b>Solución:</b>'}</p><pre class="code">${esc(r.replace(/;\s*/g, ';\n'))}</pre>`).join('')}<div class="dres"><b>Resultado esperado</b>${dmlResult(t.db, refs[0])}</div>${explainSql(refs[0])}`,
    rubric: ['Mi sentencia daría el mismo resultado (o equivalente)', 'Orden de cláusulas correcto y comillas/comas bien']};
}
function itemDdls(t) { return {id: 'ddls:' + t.id, part: 3, title: `DDL: ${t.title}`, src: t.tags.join(' · '), statement: `<p>${t.q}</p><p>Escribe el DDL (solo CREATE TABLE / ALTER TABLE, sin consultas). Tablas en singular.</p>`, hints: t.hints, solution: `<pre class="code">${esc(t.sol)}</pre>`, rubric: t.rub}; }
function itemNorm(t) { return {id: 'norm:' + t.id, part: 5, title: `Normalización · ${t.title}`, src: 'Boletín normalización', statement: `<p>${t.q}</p><p class="small">Notación DeMarco: <code>{ }</code> repetición · <code>[ ]</code> opcional · <code>( )</code> composición.</p>`, hints: t.hints, solution: t.sol, rubric: t.rub}; }
function itemCard0() { return {id: 'card0', part: 1, title: 'Cardinalidades (boletín 0)', src: 'Boletín 0: Cardinalidades', statement: `<p>Representa las cardinalidades (par pegado a la entidad que se cuenta):</p><ol class="plist">${D.CARD0.map(x => `<li>${esc(x[0])}</li>`).join('')}</ol>`, hints: ['Pregúntate en cada frase: ¿puede existir uno SIN el otro? (mínimo) y ¿cuántos a la vez? (máximo).', 'Si la parte no existe sin el todo (vagón, ejemplar, municipio) → entidad débil.', '«Varios y varios» → N:M; si hay datos de la pareja (nota, cantidad) van en la relación.'], solution: `<ol class="plist">${D.CARD0.map(x => `<li>${x[1]}</li>`).join('')}</ol>`, rubric: D.CARD0.map((x, i) => `${i + 1}. ${esc(x[0].slice(0, 60))}`)}; }
function itemCard1(i) { const x = D.CARD1[i]; return {id: 'card1:' + i, part: 1, title: `Relámpago pares · ${i + 1}`, src: '2 minutos', statement: `<p>${esc(x[0])}</p><p>Dibuja la relación con sus (min,max) (pegado a la entidad que se cuenta).</p>`, hints: ['¿Puede existir uno sin el otro? (mínimo 0 o 1) ¿Cuántos a la vez? (máximo 1 o N).', 'Escribe la frase al lado de cada par.'], solution: `<p>${x[1]}</p>`, rubric: ['Pares (min,max) bien colocados', 'Tipo de relación correcto', 'Detalle especial (rol / débil / aserción / ISA) si lo hay']}; }
function itemTab0(i) { const x = D.TAB0[i]; return {id: 'tab0:' + i, part: 2, title: `Relámpago tablas · ${i + 1}`, src: '3 minutos', statement: `<p>${esc(x.q)}</p><p>Escribe las tablas resultantes con la notación de marco.</p>`, hints: x.h, solution: `<pre class="code">${esc(x.a)}</pre>`, rubric: ['Tablas y CP correctas', 'FK en el lado correcto y su nulabilidad (VNN / NULL)', 'Restricciones adicionales si las hay']}; }

// ---------- listas por sección ----------
function paperSections() {
  const withTables = ALLC().filter(c => c.tables), erIds = ['agencia', 'academia', ...withTables.filter(c => c.id !== 'huertoex' && c.id !== 'agencia' && c.id !== 'academia').map(c => c.id)];
  const byLvl = ids => ids.map((id, i) => [id, paperMeta(id).level, i]).sort((x, y) => x[1] - y[1] || x[2] - y[2]).map(x => x[0]);
  return [
    {k: 'er', t: '1 · E/R (conceptual)', ids: erIds.map(i => 'er:' + i)},
    {k: 'ddlw', t: '3 · DDL: escribir desde cero', ids: byLvl([...D.DDLS.map(t => 'ddls:' + t.id), ...withTables.map(c => 'ddlw:' + c.id)])},
    {k: 'ddlv', t: '3 · DDL: validar y explicar el porqué (enunciado E/R + DDL de varias tablas)', ids: byLvl([...D.CASES.map(c => 'ddlv:' + c.id), ...withTables.map(c => 'ddlg:' + c.id)])},
    {k: 'dmlr', t: '3 · DML: revisar errores (de una tabla)', ids: byLvl(D.DMLR.map(t => 'dmlr:' + t.id))},
    {k: 'dmlw', t: '3 · DML: desde cero (de una tabla)', ids: byLvl(D.DMLW.map(t => 'dmlw:' + t.id))}];
}
const paperTitle = id => paperMeta(id).title.replace(/^[^·]+· /, '');

function paperTags(id) {
  const k = id.split(':')[0], rest = id.split(':').slice(1).join(':'); let tags = [];
  if (['ddlv', 'ddlg', 'ddlw', 'ddlh', 'er'].includes(k)) { const c = caseAny(rest); if (c) { if (c.rels.some(r => r.roles)) tags.push('reflexiva'); if (c.rels.some(r => r.ternary)) tags.push('ternaria'); if ((c.asserts || []).length) tags.push('existencia'); } }
  if (k === 'ddls') tags = D.DDLS.find(x => x.id === rest).tags;
  return tags.map(t => ` <span class="tag ghosttag">${t}</span>`).join('');
}
// ---------- pantallas ----------
let pp = null, pFilter = 0;       // 0 todo · 1/2/3 nivel · 9 rápidos
const passFilter = id => { const m = paperMeta(id); return pFilter === 0 || (pFilter === 9 ? m.min <= 4 : m.level === pFilter); };
function paperHome() {
  const secs = paperSections(), pc = save.paper || {};
  const dn = ids => ids.filter(i => pc[i] !== undefined).length;
  view(`<div class="crumb"><button class="ghost" onclick="BQA.home()">← Plan</button></div><section class="hero"><h1>✏️ Modo papel</h1>
   <p>El examen es en papel: aquí lees, lo haces en el folio, y cuando acabes pulsas ✅ Corregir para ver la solución y marcar lo que tenías bien. Si te atascas: 💡 Pista (de una en una). Sale primero lo más simple (🟢) y después lo más denso (🔴). En el examen te dan un <b>E/R dibujado</b>: de ahí sacas el paso a tablas <b>escribiendo los CREATE TABLE</b> (sin consultas), validas un DDL con campo libre y haces DML de una tabla (5 sentencias con error + 1 desde cero).</p>
   <div class="row big"><button class="primary" onclick="BQA.paperRoute()">🪜 Ruta paso a paso (de simple a denso)</button><button onclick="BQA.paperExam()">📝 Simulacro en papel</button><button onclick="BQA.taller()">🧱 Aprender CREATE TABLE</button><button class="primary" onclick="BQA.dml()">🧪 Taller de DML</button></div>
   <div class="row"><button class="ghost" onclick="BQA.paperPrint('')">🖨 Imprimir un examen (enunciados)</button><button class="ghost" onclick="BQA.paperPrint('sol')">🖨 …con soluciones</button></div></section>
   ${secs.map(s => `<button class="ucard" style="width:100%" onclick="BQA.paperList('${s.k}')"><span class="uicon">✏</span><span class="uname">${esc(s.t)}</span><span class="usub">${s.ids.length} ejercicios</span><span class="ubadge">PAPEL</span><span class="upct">${dn(s.ids)}/${s.ids.length}</span></button>`).join('<div style="height:8px"></div>')}`);
}
function paperList(k, f) {
  if (f !== undefined) pFilter = f;
  const s = paperSections().find(x => x.k === k), pc = save.paper || {}, ids = s.ids.filter(passFilter);
  const chips = [[0, 'Todos'], [1, '🟢 Fácil'], [2, '🟡 Media'], [3, '🔴 Difícil'], [9, '⚡ Rápidos (≤4 min)']].map(([v, n]) => `<button class="${pFilter === v ? 'primary' : 'ghost'}" onclick="BQA.paperList('${k}',${v})">${n}</button>`).join('');
  view(`<div class="crumb"><button class="ghost" onclick="BQA.paper()">← Modo papel</button></div><section class="hero"><h1>${esc(s.t)}</h1><div class="row">${chips}</div>${ids.length ? `<div class="row"><button class="primary" onclick="BQA.paperOpen('${k}',0)">▶ Empezar por el primero (${ids.length})</button></div>` : '<p>Ningún ejercicio con este filtro.</p>'}</section>
   <div class="cases">${ids.map((id, i) => { const p = pc[id], m = paperMeta(id); return `<div class="case"><b>${esc(paperTitle(id))}</b> <span class="tag ghosttag">${lvlName(m.level)}</span> <span class="tag ghosttag">≈${m.min} min</span>${paperTags(id)} ${p !== undefined ? `<span class="tag">${p}%</span>` : ''}<div class="row"><button onclick="BQA.paperOpen('${k}',${i})">Abrir</button></div></div>`; }).join('')}</div>`);
}

// ---------- RUTA PASO A PASO (de lo más simple a lo más denso) ----------
const PATH = [
  {g: '🟢 Nivel 1 · Calentamiento (1 tabla, consultas simples)', ids: ['ddls:s1', 'dmlw:w-h-sel1', 'dmlw:w-h-sel2', 'dmlw:w-h-sel3', 'dmlr:r-upd-nowhere', 'dmlw:w-h-upd1', 'ddls:s6', 'dmlr:r-null-eq']},
  {g: '🟢 Nivel 2 · Fácil (2 tablas, filtros y orden)', ids: ['ddls:s2', 'dmlw:w-h-sel4', 'dmlw:w-h-sel6', 'dmlr:r-quotes', 'ddlw:veterinaria', 'dmlw:w-h-sel9', 'dmlr:r-clause-order', 'ddls:s3']},
  {g: '🟡 Nivel 3 · Medio (N:M, reflexiva, agregados)', ids: ['ddlw:academia', 'dmlw:w-h-sel5', 'dmlw:w-c-agg1', 'dmlr:r-order-asc', 'ddls:s5', 'ddls:s8', 'dmlw:w-h-grp1', 'dmlr:r-no-group', 'ddlg:biblioteca']},
  {g: '🟡 Nivel 4 · Medio-alto (ternaria, multivalorado, HAVING)', ids: ['ddls:s9', 'ddls:s10', 'dmlw:w-c-hav1', 'dmlr:r-agg-where', 'ddlw:hotel', 'dmlw:w-h-sel13', 'dmlr:r-or-prec', 'ddlg:gimnasio']},
  {g: '🔴 Nivel 5 · Denso (subconsultas, anidadas, E/R de varias entidades)', ids: ['dmlw:w-h-nest2', 'dmlr:r-agg-mix', 'dmlw:w-c-sub1', 'dmlr:r-filter-order', 'dmlw:w-c-filt1', 'ddlw:universidad', 'ddlg:delivery', 'dmlr:r-agg-where-min']},
  {g: '🔴 Nivel 6 · Como el examen', ids: ['ddlw:clinica', 'ddlv:clinica', 'ddlw:festival', 'dmlw:w-c-filt2']}
];
const pathFlat = () => PATH.flatMap(g => g.ids);
function paperRoute() {
  const pc = save.paper || {}, flat = pathFlat(), done = flat.filter(i => pc[i] !== undefined).length, next = flat.findIndex(i => pc[i] === undefined);
  view(`<div class="crumb"><button class="ghost" onclick="BQA.paper()">← Modo papel</button></div><section class="hero"><h1>🪜 Ruta paso a paso</h1>
   <p>De lo más simple a lo más denso, poco a poco: <b>E/R → CREATE TABLE</b>, validar DDL con campo libre y DML de una tabla (con sentencias con error). Cada paso se hace en el folio; pulsa 💡 si te atascas y ✅ Corregir para puntuarte.</p>
   <div class="bar" style="width:100%;margin:6px 0"><i style="width:${Math.round(done / flat.length * 100)}%"></i></div><p class="small">${done} de ${flat.length} pasos hechos</p>
   <div class="row big">${next < 0 ? '<b>🏆 ¡Ruta completada!</b>' : `<button class="primary" onclick="BQA.paperRouteGo(${next})">▶ ${done ? 'Seguir' : 'Empezar'} por el paso ${next + 1}</button>`}</div></section>
   ${PATH.map(g => { let n = flat.indexOf(g.ids[0]); const dn = g.ids.filter(i => pc[i] !== undefined).length; return `<section class="block"><h3>${g.g} <span class="small">${dn}/${g.ids.length}</span></h3><div class="cases">${g.ids.map((id, k) => { const idx = n + k, p = pc[id], m = paperMeta(id); return `<div class="case"><b>${idx + 1}. ${esc(m.title)}</b> <span class="tag ghosttag">≈${m.min} min</span>${paperTags(id)} ${p !== undefined ? `<span class="tag">${p}%</span>` : ''}<div class="row"><button onclick="BQA.paperRouteGo(${idx})">Abrir</button></div></div>`; }).join('')}</div></section>`; }).join('')}`);
}
function paperRouteGo(i) { pp = {list: pathFlat(), i, sec: null, route: true, title: 'Ruta paso a paso', hint: 0, done: false, checks: new Set()}; paperShow(); }
function paperOpen(k, i, ids, title) {
  const s = k ? paperSections().find(x => x.k === k) : null;
  pp = {list: ids || s.ids.filter(passFilter), i, sec: k, title: title || (s ? s.t : ''), hint: 0, done: false, checks: new Set()}; paperShow();
}
function paperShow() {
  const id = pp.list[pp.i], it = paperItem(id); pp.it = it; pp.hint = 0; pp.done = false; pp.checks = new Set();
  view(`<div class="crumb"><button class="ghost" onclick="${pp.route ? 'BQA.paperRoute()' : pp.sec ? `BQA.paperList('${pp.sec}')` : 'BQA.paper()'}">✕ Salir</button><span class="small">${esc(pp.title)} · ${pp.i + 1}/${pp.list.length}</span></div>
   <section class="qcard"><div class="qhead"><span class="tag">✏ ${it.part === 5 ? 'NORMALIZACIÓN' : 'PARTE ' + it.part}</span><span class="tag ghosttag">${lvlName(it.level)} · ≈${it.min} min</span>${it.src ? `<span class="tag ghosttag">${esc(it.src)}</span>` : ''}</div>
   <h2>${it.title}</h2><div class="statement">${it.statement}</div>
   ${it.chuleta ? `<details class="rules"><summary>📋 Chuleta rápida (si la necesitas)</summary>${it.chuleta}</details>` : ''}
   <p class="small">✏ Hazlo en el folio. 💡 Si te atascas, pide una pista. Cuando acabes, ✅ Corregir.</p>
   <div class="row big"><button class="ghost" id="pHint" onclick="BQA.paperHint()">💡 Pista (0/${it.hints.length})</button><button class="primary" id="pCorr" onclick="BQA.paperCorrect()">✅ Corregir</button></div>
   <div id="pHints"></div><div id="pSol"></div></section>`);
}
function paperHint() {
  const it = pp.it; if (pp.hint < it.hints.length) pp.hint++;
  $('pHints').innerHTML = it.hints.slice(0, pp.hint).map((h, i) => `<div class="hint">💡 ${i + 1}. ${h}</div>`).join('');
  $('pHint').textContent = `💡 Pista (${pp.hint}/${it.hints.length})`; if (pp.hint >= it.hints.length) $('pHint').disabled = true;
}
function paperCorrect() {
  if (pp.done) return; pp.done = true; const it = pp.it; $('pHint').disabled = true; $('pCorr').disabled = true;
  $('pSol').innerHTML = `<div class="feedback ok"><h3>✅ Solución</h3>${it.solution}</div>
   <div class="feedback ko"><h3>Corrígete: marca lo que tenías bien</h3><div class="rub">${it.rubric.map((r, i) => `<label><input type="checkbox" onchange="BQA.paperTick(${i},this.checked)"> <span>${r}</span></label>`).join('')}</div><p id="pScore" class="small">0 de ${it.rubric.length}</p>
   <div class="row"><button class="primary" onclick="BQA.paperNext()">${pp.i + 1 < pp.list.length ? 'Siguiente →' : 'Terminar'}</button><button class="ghost" onclick="BQA.paperAll()">Lo tenía todo ✔</button></div></div>`;
  $('pSol').scrollIntoView({behavior: 'smooth', block: 'nearest'});
}
function paperScore() { const n = pp.it.rubric.length, c = pp.checks.size; if ($('pScore')) $('pScore').textContent = `${c} de ${n} (${Math.round(c / n * 100)}%)`; }
function paperTick(i, on) { on ? pp.checks.add(i) : pp.checks.delete(i); paperScore(); }
function paperAll() { document.querySelectorAll('.rub input').forEach((b, i) => { b.checked = true; pp.checks.add(i); }); paperScore(); }
function paperNext() {
  const it = pp.it, pct = Math.round(pp.checks.size / it.rubric.length * 100);
  save.paper = save.paper || {}; save.paper[it.id] = pct; pp.scores = pp.scores || {}; pp.scores[it.id] = pct;
  save.xp += Math.round(pct / 5); persist();
  if (pp.i + 1 < pp.list.length) { pp.i++; paperShow(); return; }
  const sc = Object.values(pp.scores), avg = Math.round(sc.reduce((a, b) => a + b, 0) / sc.length);
  const byPart = {}; pp.list.forEach(id => { const p = paperItem(id).part; (byPart[p] = byPart[p] || []).push(pp.scores[id] ?? 0); });
  view(`<section class="hero"><h1>${avg >= 80 ? '🏆' : avg >= 50 ? '👍' : '📚'} ${esc(pp.title)}</h1><p>Autocorrección media: <b>${avg}%</b></p>
   <div class="parts">${Object.keys(byPart).map(p => { const v = Math.round(byPart[p].reduce((a, b) => a + b, 0) / byPart[p].length); return `<div class="part"><b>${p == 5 ? 'Norm.' : 'Parte ' + p}</b><strong>${v}%</strong><i style="width:${v}%"></i></div>`; }).join('')}</div>
   <p class="small">Tu nota de cada ejercicio queda guardada en el listado.</p><div class="row big">${pp.route ? '<button class="primary" onclick="BQA.paperRoute()">🪜 Ver la ruta</button>' : ''}<button class="primary" onclick="BQA.paper()">Modo papel</button><button onclick="BQA.home()">Plan</button></div></section>`);
}
function examIds(c) { return [`er:${c.id}`, `ddlg:${c.id}`, `ddlw:${c.id}`, ...shuffle(D.DMLR.filter(t => !t.noExam && dmlLevel(t) <= 3)).slice(0, 5).map(t => 'dmlr:' + t.id), 'dmlw:' + pick(D.DMLW.filter(t => dmlLevel(t) <= 3)).id]; }
const examPool = () => ALLC().filter(c => c.tables && (c.level || 2) <= 2 && c.id !== 'huertoex');
function paperExam(caseId) {
  const c = caseId ? caseAny(caseId) : pick(examPool());
  paperOpen(null, 0, examIds(c), `Simulacro en papel · ${c.name}`);
}
function paperPrint(mode) {
  const c = pick(examPool()), its = examIds(c).map(paperItem);
  view(`<div class="crumb"><button class="ghost" onclick="BQA.paper()">← Modo papel</button><button class="primary" onclick="window.print()">🖨 Imprimir / guardar PDF</button><button class="ghost" onclick="BQA.paperPrint('${mode}')">Otro examen</button></div>
   <section class="block printsheet"><h3>Examen de práctica · ${esc(c.name)}</h3><p class="small">Parte 1: E/R · Parte 3: DDL (validar y desde cero) y DML (5 con error + 1 desde cero). Convención de clase: (min,max) pegado a la entidad que se cuenta.</p>${its.map((it, n) => `<div class="pitem"><h4>${n + 1}. ${it.title}</h4><div class="statement">${it.statement}</div>${mode === 'sol' ? `<div class="psol"><b>Solución</b>${it.solution}</div>` : '<div class="lines"></div>'}</div>`).join('')}</section>`);
}
