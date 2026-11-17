// BDA-QUEST · MODO PAPEL. Se inserta dentro de app.js (marcador PAPER).
// Flujo: lees el enunciado → lo haces en el folio → 💡 Pista (de una en una) → ✅ Corregir (solución + casillas para puntuarte).
const ALLC = () => [...D.CASES, ...D.PCASES];
const caseAny = id => ALLC().find(c => c.id === id);
const fp = p => `(${p[0]},${p[1]})`;
const strip = h => String(h).replace(/<[^>]+>/g, '');
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
  groups.forEach(g => { const R = tables.find(x => x.name === g.to); L.push(`C.Aj(${g.cols.join(', ')}) → ${g.to}(${R ? pk(R).join(', ') : 'id'})`); });
  const v = t.cols.filter(c => /V/.test(c[1]) && !/P/.test(c[1])).map(c => `VNN(${c[0]})`); if (v.length) L.push(v.join('  '));
  return L.join('\n');
}
function subsetDet(c) {
  const T = c.tables, t0 = T.find(t => t.cols.some(x => x[2] && x[2] !== t.name)) || T[0]; const names = [t0.name];
  t0.cols.forEach(x => { if (x[2] && x[2] !== t0.name && !names.includes(x[2]) && names.length < 4) names.push(x[2]); });
  return names.map(n => T.find(t => t.name === n));
}

// ---------- construcción de cada ejercicio ----------
function paperItem(id) {
  const [k, rest] = [id.split(':')[0], id.split(':').slice(1).join(':')];
  if (k === 'er') return itemER(caseAny(rest));
  if (k === 'tab') return itemTab(caseAny(rest));
  if (k === 'ddlv') return itemDdlV(caseAny(rest));
  if (k === 'ddlw') return itemDdlW(caseAny(rest));
  if (k === 'dmlr') return itemDmlR(D.DMLR.find(t => t.id === rest));
  if (k === 'dmlw') return itemDmlW(D.DMLW.find(t => t.id === rest));
  if (k === 'norm') return itemNorm(D.NORM.find(t => t.id === rest));
  if (k === 'card0') return itemCard0();
}
const rulesList = c => `<ol class="prules">${c.rules.map(r => `<li>${r}</li>`).join('')}</ol>`;
function itemER(c) {
  const er = T2.erOf(c), hints = [
    `Subraya en el enunciado los <b>sustantivos con identificador</b>: serán entidades. Hay <b>${er.entities.length}</b>. Todas en <b>singular</b>.`,
    `Las entidades empiezan por: ${er.entities.map(e => esc(e.n[0]) + '…').join(', ')}.`,
    `Busca los <b>verbos</b>: hay <b>${c.rels.length}</b> relaciones${c.rels.some(r => r.roles) ? ' (alguna es <b>reflexiva</b>: pon un rol en cada punta)' : ''}${c.rels.some(r => r.ternary) ? ' (una es <b>ternaria</b>: tres pares)' : ''}.`,
    'Cada par: «puede / ninguno» → 0 · «siempre / exactamente / al menos uno / todo» → 1 · «varios / muchos» → N. Pon el par <b>pegado a la entidad que se cuenta</b> y escribe la frase al lado.',
    `Atributos: subraya el identificador${er.entities.some(e => e.attrs.some(a => /o/.test(a[1]))) ? ', marca los <b>opcionales</b>' : ''}${er.entities.some(e => e.attrs.some(a => /m/.test(a[1]))) ? ', dobla el óvalo de los <b>multivalorados</b>' : ''}. Lo que no se dice que es opcional es obligatorio.`];
  const rub = [`Entidades en <b>singular</b>: ${er.entities.map(e => esc(e.n)).join(', ')}`,
    ...er.entities.map(e => `Identificador de <b>${esc(e.n)}</b>: ${esc(e.attrs.filter(a => /I|p/.test(a[1])).map(a => a[0]).join(' + '))}${e.attrs.some(a => /o/.test(a[1])) ? ' · opcionales: ' + esc(e.attrs.filter(a => /o/.test(a[1])).map(a => a[0]).join(', ')) : ''}${e.attrs.some(a => /m/.test(a[1])) ? ' · multivalorados: ' + esc(e.attrs.filter(a => /m/.test(a[1])).map(a => a[0]).join(', ')) : ''}`),
    ...c.rels.map(relText), ...(c.decisions || []).map(d => `${esc(d.title)}: ${esc(d.opts.find(o => o[1])[0])}`), ...(c.extra || []).map(strip).map(esc)];
  const sol = `<h4>Entidades y atributos</h4><ul class="plist">${er.entities.map(e => `<li>${entText(e)}</li>`).join('')}</ul><h4>Relaciones (par pegado a la entidad que se cuenta)</h4><ul class="plist">${c.rels.map(r => `<li>${relText(r)}<br><span class="small">${esc(r.why || '')}</span></li>`).join('')}</ul>${(c.decisions || []).length ? `<h4>Decisiones de modelado</h4><ul class="plist">${c.decisions.map(d => `<li><b>${esc(d.title)}:</b> ${esc(d.opts.find(o => o[1])[0])}<br><span class="small">${esc(d.opts.find(o => o[1])[2])}</span></li>`).join('')}</ul>` : ''}${(c.extra || []).length ? `<h4>Detalles</h4><ul class="plist">${c.extra.map(x => `<li>${x}</li>`).join('')}</ul>` : ''}${(er.traps || []).length ? `<p class="small">No son entidades: ${er.traps.map(t => esc(t.n)).join(', ')}.</p>` : ''}<h4>Dibujo</h4>${c.img ? `<img src="${c.img}" alt="E/R" style="max-width:100%;background:#fff">` : T2.erSvg(c)}<p class="small">Dibujo simplificado (sin atributos ni ISA/débiles): compara entidades y pares.</p>`;
  return {id: 'er:' + c.id, part: 1, title: `E/R · ${c.name}`, src: c.from, statement: `${rulesList(c)}<p><b>Dibuja el E/R:</b> entidades (singular), atributos (identificador subrayado, opcionales, multivalorados), relaciones con su <b>(min,max)</b>, roles en las reflexivas y atributos de las relaciones.</p>`, hints, solution: sol, rubric: rub};
}
function itemTab(c) {
  const er = T2.erOf(c), tables = c.tables;
  const fig = c.img ? `<img src="${c.img}" alt="E/R" style="max-width:100%;background:#fff">` : T2.erSvg(c);
  const hasRefl = c.rels.some(r => r.roles), hasTern = c.rels.some(r => r.ternary);
  const hints = [
    `Pasan a tabla las <b>entidades</b> (${er.entities.length}) más una tabla por cada <b>N:M</b>${hasTern ? ' y por la <b>ternaria</b>' : ''}${er.entities.some(e => e.attrs.some(a => /m/.test(a[1]))) ? ' y por cada atributo <b>multivalorado</b>' : ''}. Total: <b>${tables.length}</b> tablas. Nombres en <b>singular y mayúsculas</b>.`,
    'En cada <b>1:N</b> la FK va en la tabla del lado N. En cada <b>N:M</b>, tabla intermedia con las dos FKs y CP compuesta (los atributos de la relación van ahí).',
    `Nulabilidad de cada FK: mínimo <b>1</b> → VNN (NOT NULL); mínimo <b>0</b> → admite NULL.${hasRefl ? ' La reflexiva es una FK a la misma tabla.' : ''}${hasTern ? ' En la ternaria, CP = las tres FKs.' : ''}`,
    `<b>Existencialidad:</b> mira los pares con mínimo 1 en la entidad del lado "1" (todo X tiene al menos un Y): no sale de la FK, se escribe una ASERCIÓN <code>X[clave] ⊆ Y[fk]</code>.${(c.asserts || []).length ? ' Aquí hay ' + c.asserts.length + '.' : ' Aquí quizá no haga falta ninguna.'}`,
    'Para cada tabla repasa las 5 preguntas: CP · C.Alt (únicos) · C.Aj (a quién apunta) · VNN (obligatorios) · ¿CP compuesta?'];
  const rub = [...tables.map(t => `<b>${esc(t.name)}</b>: ${esc(marcoText(t, tables).replace(/\n/g, ' · '))}`), ...(c.asserts || []).map(a => `ASERCIÓN: <code>${esc(a.t)}</code>`), ...((c.asserts || []).length ? [] : ['No invento aserciones: ningún mínimo 1 en el lado "1"']), 'Tablas en singular y en mayúsculas'];
  const sol = `<pre class="code">${esc(tables.map(t => marcoText(t, tables)).join('\n\n'))}${(c.asserts || []).length ? '\n\n' + esc(c.asserts.map((a, i) => `ASERCIÓN ${i + 1}: ${a.t}`).join('\n')) : ''}</pre>${tables.filter(t => t.note).map(t => `<p class="small"><b>${esc(t.name)}:</b> ${esc(t.note)}</p>`).join('')}${(c.asserts || []).map(a => `<p class="small">${esc(a.why)}</p>`).join('')}`;
  return {id: 'tab:' + c.id, part: 2, title: `Paso a tablas · ${c.name}`, src: c.from, statement: `${fig}<h4>Atributos</h4><ul class="plist">${er.entities.map(e => `<li>${entText(e)}</li>`).join('')}</ul><h4>Relaciones (par pegado a la entidad que se cuenta)</h4><ul class="plist">${c.rels.map(r => `<li>${relText(r)}</li>`).join('')}</ul>${(c.extra || []).length ? `<ul class="plist small">${c.extra.map(x => `<li>${x}</li>`).join('')}</ul>` : ''}<p><b>Haz el paso a tablas</b> con la notación de marco: CP, C.Alt, C.Aj, VNN y las <b>restricciones de existencialidad</b> (aserciones) que exija el diagrama.</p>`, hints, solution: sol, rubric: rub};
}
function itemDdlV(c) {
  const lines = parseDDL(c.ddl), ids = Object.keys(c.errors);
  const num = lines.map((l, i) => `${String(i + 1).padStart(2)}  ${l.text}`).join('\n');
  const prim = e => lines.findIndex(l => l.errs.includes(e)) + 1;
  const hints = [`Hay <b>${ids.length} errores</b> respecto al enunciado.`, 'Recorre tabla a tabla: ¿PK? ¿FKs (y a qué tabla/columna)? ¿NOT NULL donde toca y solo donde toca? ¿UNIQUE? ¿orden de creación? ¿nombres en singular?', `Errores en las líneas: ${ids.map(prim).sort((a, b) => a - b).join(', ')}.`, 'En el porqué, cita la regla del enunciado (R1, R2...) y di cómo quedaría bien.'];
  return {id: 'ddlv:' + c.id, part: 3, title: `DDL: validar · ${c.name}`, src: c.from, statement: `${rulesList(c)}<p><b>Marca las líneas con error y explica por qué</b> (campo libre). Si falta algo, indica dónde debería ir.</p><pre class="code">${esc(num)}</pre>`, hints,
    solution: `<ol class="plist">${ids.map(e => `<li><b>Línea ${prim(e)}:</b> ${c.errors[e].model}</li>`).join('')}</ol>`, rubric: ids.map(e => `Línea ${prim(e)} encontrada y explicada: ${esc(strip(c.errors[e].model).slice(0, 110))}…`)};
}
function itemDdlW(c) {
  const sub = subsetDet(c), spec = specOf(c, sub);
  const rub = []; spec.forEach(t => { const pk = t.cols.filter(x => /P/.test(x[1])).map(x => x[0]); rub.push(`<b>${esc(t.name)}</b>: PRIMARY KEY (${esc(pk.join(', '))})`);
    t.cols.filter(x => x[2]).forEach(x => rub.push(`FK ${esc(t.name)}.${esc(x[0])} → ${esc(x[2])}`));
    const nn = t.cols.filter(x => /V/.test(x[1]) && !/P/.test(x[1])).map(x => x[0]); if (nn.length) rub.push(`NOT NULL en ${esc(t.name)}: ${esc(nn.join(', '))}`);
    t.cols.filter(x => /A/.test(x[1])).forEach(x => rub.push(`UNIQUE en ${esc(t.name)}.${esc(x[0])}`)); });
  rub.push('Tablas en singular y creadas en el orden correcto'); rub.push('Sin consultas (solo CREATE TABLE)');
  const hints = ['Orden de creación: primero las tablas a las que apuntan otras.', 'Para cada tabla: columnas con tipo → NOT NULL en lo obligatorio → PRIMARY KEY (compuesta una sola vez) → UNIQUE en alternativas → FOREIGN KEY ... REFERENCES.', `Tablas: ${sub.map(t => t.name).join(', ')}. FK obligatoria → NOT NULL; opcional → sin NOT NULL.`, 'Los tipos no son lo importante: INT, VARCHAR(n), DATE, DECIMAL(8,2).'];
  return {id: 'ddlw:' + c.id, part: 3, title: `DDL: desde cero · ${c.name}`, src: c.from, statement: `${rulesList(c)}<p><b>Escribe el DDL</b> (solo <code>CREATE TABLE</code>, sin consultas) de estas ${sub.length} tablas. Tablas en singular y en el orden correcto.</p><pre class="code">${esc(sub.map(t => marcoLine(t, false)).join('\n'))}</pre><p class="small">Las claves y los nulos los deduces del enunciado.</p>`, hints,
    solution: `<pre class="code">${esc(BQ_SOLUTION(c, sub))}</pre><p class="small">Los tipos pueden variar: lo que se evalúa son claves, nulos, UNIQUE y FK.</p>`, rubric: rub};
}
function dmlResult(db, sql) {
  const r = runSafe(db, sql); if (r.error) return `<div class="dres bad">❌ ${esc(r.error)}</div>`;
  return r.kind === 'select' ? resultTable(r, 8) : `<p>${esc(r.op)}: <b>${r.affected}</b> fila(s) afectada(s).</p>`;
}
function itemDmlR(t) {
  const hints = ['Simula la sentencia con los datos: ¿qué devuelve o qué cambia exactamente?', 'Repasa la lista: WHERE · comillas · comas · orden de las cláusulas · NULL · paréntesis con AND/OR · ASC/DESC.', `Piensa en: «${esc(t.why[0][0])}».`, 'Escribe la corrección en el folio aunque no estés seguro del porqué.'];
  const ref = [].concat(t.ref)[0];
  return {id: 'dmlr:' + t.id, part: 4, title: `DML: revisar · ${t.title}`, src: 'Sentencia con error', statement: `<p>${esc(t.prompt)}</p>${dataViewer(t.db)}<pre class="code">${esc(t.bad)}</pre><p><b>¿Qué está mal y por qué?</b> Escribe la explicación y la sentencia corregida.</p>`, hints,
    solution: `<p>${t.model}</p><p><b>Corrección:</b></p><pre class="code">${esc(ref)}</pre><div class="cols2"><div class="dres"><b>Lo que hace la sentencia con error</b>${dmlResult(t.db, t.bad)}</div><div class="dres"><b>Lo que debería hacer</b>${dmlResult(t.db, ref)}</div></div>`,
    rubric: [`Vi el error: ${esc(strip(t.model).slice(0, 120))}…`, 'Lo expliqué con la idea clave (campo libre)', 'Escribí la sentencia corregida y da el mismo resultado']};
}
function itemDmlW(t) {
  const refs = [].concat(t.ref), hints = [...(t.hints || [])]; if (t.skeleton) hints.push(`Plantilla:<pre class="code">${esc(t.skeleton)}</pre>`);
  if (!hints.length) hints.push('Construye la sentencia cláusula a cláusula: SELECT → FROM → WHERE → GROUP BY → HAVING → ORDER BY → LIMIT.');
  return {id: 'dmlw:' + t.id, part: 4, title: `DML: desde cero · ${t.title}`, src: t.src, statement: `<p>${esc(t.prompt)}</p>${t.aliases ? `<p class="small">La columna debe llamarse <code>${esc(t.aliases.join(', '))}</code>.</p>` : ''}${dataViewer(t.db)}<p><b>Escribe la sentencia</b> en el folio.</p>`, hints,
    solution: `${refs.map((r, i) => `<p>${refs.length > 1 ? 'Opción ' + (i + 1) + ':' : '<b>Solución:</b>'}</p><pre class="code">${esc(r.replace(/;\s*/g, ';\n'))}</pre>`).join('')}<div class="dres"><b>Resultado esperado</b>${dmlResult(t.db, refs[0])}</div>`,
    rubric: ['Mi sentencia daría el mismo resultado (o equivalente)', 'Orden de cláusulas correcto y comillas/comas bien', ...(t.aliases ? ['Alias pedido: ' + esc(t.aliases.join(', '))] : [])]};
}
function itemNorm(t) { return {id: 'norm:' + t.id, part: 5, title: `Normalización · ${t.title}`, src: 'Boletín normalización', statement: `<p>${t.q}</p><p class="small">Notación DeMarco: <code>{ }</code> repetición · <code>[ ]</code> opcional · <code>( )</code> composición.</p>`, hints: t.hints, solution: t.sol, rubric: t.rub}; }
function itemCard0() { return {id: 'card0', part: 1, title: 'Cardinalidades (boletín 0)', src: 'Boletín 0: Cardinalidades', statement: `<p>Representa las cardinalidades (par pegado a la entidad que se cuenta):</p><ol class="plist">${D.CARD0.map(x => `<li>${esc(x[0])}</li>`).join('')}</ol>`, hints: ['Pregúntate en cada frase: ¿puede existir uno SIN el otro? (mínimo) y ¿cuántos a la vez? (máximo).', 'Si la parte no existe sin el todo (vagón, ejemplar, municipio) → entidad débil.', '«Varios y varios» → N:M; si hay datos de la pareja (nota, cantidad) van en la relación.'], solution: `<ol class="plist">${D.CARD0.map(x => `<li>${x[1]}</li>`).join('')}</ol>`, rubric: D.CARD0.map((x, i) => `${i + 1}. ${esc(x[0].slice(0, 60))}`)}; }

// ---------- listas por sección ----------
function paperSections() {
  const caseIds = D.CASES.filter(c => c.id !== 'huertoex').map(c => c.id), pcs = D.PCASES.map(c => c.id);
  return [
    {k: 'er', t: '1 · E/R (conceptual)', ids: [...caseIds, ...pcs, 'card0'].map(i => i === 'card0' ? 'card0' : 'er:' + i)},
    {k: 'tab', t: '2 · Paso a tablas + existencialidad', ids: [...D.CASES.map(c => c.id), ...pcs].map(i => 'tab:' + i)},
    {k: 'ddlv', t: '3 · DDL: validar y explicar el porqué', ids: D.CASES.map(c => 'ddlv:' + c.id)},
    {k: 'ddlw', t: '3 · DDL: escribir desde cero', ids: D.CASES.map(c => 'ddlw:' + c.id)},
    {k: 'dmlr', t: '3 · DML: revisar errores', ids: D.DMLR.map(t => 'dmlr:' + t.id)},
    {k: 'dmlw', t: '3 · DML: desde cero (boletines)', ids: D.DMLW.map(t => 'dmlw:' + t.id)},
    {k: 'norm', t: 'Normalización (boletín)', ids: D.NORM.map(t => 'norm:' + t.id)}];
}
const paperTitle = id => { const it = paperItem(id); return it ? it.title.replace(/^[^·]+· /, '') : id; };

// ---------- pantallas ----------
let pp = null;
function paperHome() {
  const secs = paperSections(), pc = save.paper || {};
  const dn = ids => ids.filter(i => pc[i] !== undefined).length;
  view(`<div class="crumb"><button class="ghost" onclick="BQA.home()">← Plan</button></div><section class="hero"><h1>✏️ Modo papel</h1>
   <p>El examen es en papel: aquí <b>lees</b>, lo haces <b>en el folio</b>, y cuando acabes pulsas <b>✅ Corregir</b> para ver la solución y marcar lo que tenías bien. Si te atascas: <b>💡 Pista</b> (de una en una).</p>
   <div class="row big"><button class="primary" onclick="BQA.paperExam()">📝 Simulacro en papel (examen completo)</button></div>
   <div class="row"><button class="ghost" onclick="BQA.paperPrint('')">🖨 Imprimir un examen (enunciados)</button><button class="ghost" onclick="BQA.paperPrint('sol')">🖨 …con soluciones</button></div></section>
   ${secs.map(s => `<button class="ucard" style="width:100%" onclick="BQA.paperList('${s.k}')"><span class="uicon">✏</span><span class="uname">${esc(s.t)}</span><span class="usub">${s.ids.length} ejercicios</span><span class="ubadge">PAPEL</span><span class="upct">${dn(s.ids)}/${s.ids.length}</span></button>`).join('<div style="height:8px"></div>')}`);
}
function paperList(k) {
  const s = paperSections().find(x => x.k === k), pc = save.paper || {};
  view(`<div class="crumb"><button class="ghost" onclick="BQA.paper()">← Modo papel</button></div><section class="hero"><h1>${esc(s.t)}</h1><div class="row"><button class="primary" onclick="BQA.paperOpen('${s.k}',0)">▶ Empezar por el primero</button></div></section>
   <div class="cases">${s.ids.map((id, i) => { const p = pc[id]; return `<div class="case"><b>${esc(paperTitle(id))}</b> ${p !== undefined ? `<span class="tag">${p}%</span>` : ''}<div class="row"><button onclick="BQA.paperOpen('${s.k}',${i})">Abrir</button></div></div>`; }).join('')}</div>`);
}
function paperOpen(k, i, ids, title) {
  const s = k ? paperSections().find(x => x.k === k) : null;
  pp = {list: ids || s.ids, i, sec: k, title: title || (s ? s.t : ''), hint: 0, done: false, checks: new Set()}; paperShow();
}
function paperShow() {
  const id = pp.list[pp.i], it = paperItem(id); pp.it = it; pp.hint = 0; pp.done = false; pp.checks = new Set();
  view(`<div class="crumb"><button class="ghost" onclick="${pp.sec ? `BQA.paperList('${pp.sec}')` : 'BQA.paper()'}">✕ Salir</button><span class="small">${esc(pp.title)} · ${pp.i + 1}/${pp.list.length}</span></div>
   <section class="qcard"><div class="qhead"><span class="tag">✏ ${it.part === 5 ? 'NORMALIZACIÓN' : 'PARTE ' + it.part}</span>${it.src ? `<span class="tag ghosttag">${esc(it.src)}</span>` : ''}</div>
   <h2>${it.title}</h2><div class="statement">${it.statement}</div>
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
  const gain = Math.round(pct / 5); save.xp += gain; persist();
  if (pp.i + 1 < pp.list.length) { pp.i++; paperShow(); return; }
  const sc = Object.values(pp.scores), avg = Math.round(sc.reduce((a, b) => a + b, 0) / sc.length);
  const byPart = {}; pp.list.forEach(id => { const p = paperItem(id).part; (byPart[p] = byPart[p] || []).push(pp.scores[id] ?? 0); });
  view(`<section class="hero"><h1>${avg >= 80 ? '🏆' : avg >= 50 ? '👍' : '📚'} ${esc(pp.title)}</h1><p>Autocorrección media: <b>${avg}%</b></p>
   <div class="parts">${Object.keys(byPart).map(p => { const v = Math.round(byPart[p].reduce((a, b) => a + b, 0) / byPart[p].length); return `<div class="part"><b>${p == 5 ? 'Norm.' : 'Parte ' + p}</b><strong>${v}%</strong><i style="width:${v}%"></i></div>`; }).join('')}</div>
   <p class="small">Tu nota de cada ejercicio queda guardada en el listado.</p><div class="row big"><button class="primary" onclick="BQA.paper()">Modo papel</button><button onclick="BQA.home()">Plan</button></div></section>`);
}
function paperExam(caseId) {
  const pool = D.CASES.filter(c => c.id !== 'huertoex'), c = caseId ? caseAny(caseId) : pick(pool);
  const ids = [`er:${c.id}`, `tab:${c.id}`, `ddlv:${c.id}`, `ddlw:${c.id}`, ...shuffle(D.DMLR).slice(0, 5).map(t => 'dmlr:' + t.id), 'dmlw:' + pick(D.DMLW).id];
  paperOpen(null, 0, ids, `Simulacro en papel · ${c.name}`);
}
function paperPrint(mode) {
  const pool = D.CASES.filter(c => c.id !== 'huertoex'), c = pick(pool);
  const ids = [`er:${c.id}`, `tab:${c.id}`, `ddlv:${c.id}`, `ddlw:${c.id}`, ...shuffle(D.DMLR).slice(0, 5).map(t => 'dmlr:' + t.id), 'dmlw:' + pick(D.DMLW).id];
  const its = ids.map(paperItem);
  view(`<div class="crumb"><button class="ghost" onclick="BQA.paper()">← Modo papel</button><button class="primary" onclick="window.print()">🖨 Imprimir / guardar PDF</button><button class="ghost" onclick="BQA.paperPrint('${mode}')">Otro examen</button></div>
   <section class="block printsheet"><h3>Examen de práctica · ${esc(c.name)}</h3><p class="small">Parte 1: E/R · Parte 2: paso a tablas · Parte 3: DDL y DML. Convención de clase: (min,max) pegado a la entidad que se cuenta.</p>${its.map((it, n) => `<div class="pitem"><h4>${n + 1}. ${it.title}</h4><div class="statement">${it.statement}</div>${mode === 'sol' ? `<div class="psol"><b>Solución</b>${it.solution}</div>` : '<div class="lines"></div>'}</div>`).join('')}</section>`);
}
