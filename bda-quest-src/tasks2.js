// BDA-QUEST · tareas nuevas con formato de examen. Se inserta dentro de app.js (marcador TASKS2).
// Tipos: ents · attrs · card (binaria, reflexiva con roles, ternaria) · assert (existencialidad)
//        ddlw (DDL desde cero) · dmlr (revisar errores) · dmlw (DML desde cero)
const T2 = {};
const SQLX = D.SQL;
const lcx = s => String(s).toLowerCase();
const fold2 = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const nice = s => String(s).replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
const sentence = s => s.charAt(0).toUpperCase() + s.slice(1);
const plural = n => { const w = n.trim(); if (/ción$/i.test(w)) return w.replace(/ción$/i, 'ciones'); if (/[aeiouáéíóú]$/i.test(w)) return w + 's'; if (/z$/i.test(w)) return w.slice(0, -1) + 'ces'; return w + 'es'; };
T2.TYPES = new Set(['ents', 'attrs', 'card', 'assert', 'ddlw', 'dmlr', 'dmlw']);
T2.has = t => T2.TYPES.has(t);
T2.LABEL = {ents: 'ENTIDADES', attrs: 'ATRIBUTOS', card: '(MIN,MAX)', assert: 'EXISTENCIALIDAD', ddlw: 'DDL DESDE CERO', dmlr: 'REVISA EL ERROR', dmlw: 'DML DESDE CERO'};
T2.partOf = q => ({ents: 1, attrs: 1, card: 1, assert: 2, ddlw: 3, dmlr: 4, dmlw: 4})[q.type] || null;

// ---------- E/R de cada caso (los antiguos se deducen del marco) ----------
const sameName = (a, b) => fold2(a) === fold2(b);
function entityName(c, tname) {
  for (const r of c.rels) for (const n of [r.a, r.b, ...(r.ternary || []).map(x => x.e)]) if (n && sameName(n, tname)) return n;
  return nice(tname.toLowerCase());
}
function isJunction(t) { const p = t.cols.filter(x => /P/.test(x[1])); return p.length >= 2 && p.every(x => x[2]); }
T2.erOf = function (c) {
  if (c.er) return c.er;
  const ents = c.tables.filter(t => !isJunction(t)).map(t => ({n: entityName(c, t.name), attrs: t.cols.filter(x => !x[2]).map(x => [x[0], (/P/.test(x[1]) ? 'I' : '') + (/o/.test(x[1]) ? 'o' : '')])}));
  const traps = c.rels.filter(r => r.attr).map(r => ({n: sentence(r.verb), why: `«${sentence(r.verb)}» es una relación (un verbo): ${r.a} y ${r.b} son las entidades.`}));
  return (c.er = {entities: ents, traps});
};
const flagsOf = (a, f) => (a[1] || '').includes(f);

// ---------- preguntas nuevas de cada caso ----------
T2.extraCaseQs = function (c) {
  const out = [], er = T2.erOf(c);
  out.push({id: `ents:${c.id}`, topic: 'er', type: 'ents', title: `${c.name}: entidades`, cs: c, truco: 'Entidad = sustantivo con identificador, y SIEMPRE en singular. Verbos → relaciones, datos → atributos.'});
  for (let i = 0; i < er.entities.length; i += 2) out.push({id: `attrs:${c.id}:${i / 2}`, topic: 'er', type: 'attrs', title: `${c.name}: atributos de ${er.entities.slice(i, i + 2).map(e => e.n).join(' y ')}`, cs: c, ents: er.entities.slice(i, i + 2), truco: 'Para cada atributo: ¿identifica? (subrayado) ¿puede faltar? (opcional) ¿admite varios valores? (multivalorado).'});
  (c.decisions || []).forEach((d, i) => out.push({id: `dec:${c.id}:${i}`, topic: 'er', type: 'choice', title: `${c.name}: ${d.title}`, q: d.q, opts: d.opts, cs: c, truco: d.truco}));
  out.push({id: `assert:${c.id}`, topic: 'tab', type: 'assert', title: `${c.name}: restricciones de existencialidad`, cs: c, truco: 'Mínimo 1 en el lado "1" de una relación (todo X tiene al menos un Y) no sale de la FK: se escribe como ASERCIÓN  X[clave] ⊆ Y[fk].'});
  out.push({id: `ddlw:${c.id}`, topic: 'ddl', type: 'ddlw', title: `${c.name}: escribe el DDL desde cero`, cs: c, truco: 'Orden: primero las tablas a las que apuntan otras. Por tabla: columnas + NOT NULL/UNIQUE, PRIMARY KEY, FOREIGN KEY. Tablas en singular.'});
  return out;
};
T2.dmlQs = function () {
  return [...D.DMLR.map(t => ({id: `dmlr:${t.id}`, topic: 'dml', type: 'dmlr', title: `Revisa: ${t.title}`, t, truco: t.truco})),
          ...D.DMLW.map(t => ({id: `dmlw:${t.id}`, topic: 'dml', type: 'dmlw', title: t.title, t, truco: (t.hints || [])[0] || 'Lee el enunciado y construye la consulta cláusula a cláusula.'}))];
};

// ---------- motor de datos ----------
const baseEng = {};
T2.mkEngine = db => { if (!baseEng[db]) baseEng[db] = SQLX.Engine.fromScript(D.SEEDS[db]); return baseEng[db].clone(); };
function cell(v) { return v === null || v === undefined ? '<i class="nul">NULL</i>' : esc(SQLX.fmtVal(v)); }
function resultTable(res, max = 6, hi) {
  const rows = res.rows.slice(0, max);
  return `<div class="tblwrap"><table class="rt"><thead><tr>${res.cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(v => `<td>${cell(v)}</td>`).join('')}</tr>`).join('') || `<tr><td colspan="${res.cols.length}"><i class="nul">(0 filas)</i></td></tr>`}</tbody></table></div>${res.rows.length > max ? `<p class="small">… ${res.rows.length} filas en total (se muestran ${max}).</p>` : `<p class="small">${res.rows.length} fila(s).</p>`}`;
}
function dataViewer(db, only) {
  const e = T2.mkEngine(db); const names = only || D.DB_INFO[db].tables;
  const tabs = Object.values(e.tables).filter(t => !only || names.some(n => sameName(n, t.name)));
  return `<details class="rules"><summary>🗂 Tablas y datos de «${esc(D.DB_INFO[db].name)}» (toca para ver)</summary>${tabs.map(t => `<p class="small"><b>${esc(t.name)}</b>(${t.cols.map(c => `${t.pk.map(x => x.toLowerCase()).includes(c.name.toLowerCase()) ? '<u>' + esc(c.name) + '</u>' : esc(c.name)} <span class="ty">${esc(c.type)}${c.len ? '(' + c.len + (c.scale != null ? ',' + c.scale : '') + ')' : ''}${c.notNull ? ' NN' : ''}</span>`).join(', ')})${t.fks.length ? ' · FK: ' + t.fks.map(f => `${esc(f.cols.join(','))}→${esc(f.ref)}`).join('; ') : ''}</p>${resultTable({cols: t.cols.map(c => c.name), rows: t.rows.slice(0, 5).map(r => t.cols.map(c => r[c.name.toLowerCase()]))}, 5)}`).join('')}</details>`;
}

// ---------- ENTIDADES ----------
function entOptions(q) {
  const c = q.cs, er = T2.erOf(c), opts = [];
  er.entities.forEach(e => opts.push({t: e.n, ok: true, why: `${e.n} es una entidad: tiene identificador y varias propiedades. Y está en singular.`}));
  const ents = shuffle(er.entities);
  ents.slice(0, 2).forEach(e => opts.push({t: plural(e.n), ok: false, why: `Plural: las entidades se nombran en SINGULAR (${e.n}): el nombre es el del tipo, no el del conjunto.`}));
  shuffle(er.entities.flatMap(e => e.attrs.filter(a => !flagsOf(a, 'I') && !flagsOf(a, 'c')).map(a => [e, a]))).slice(0, 2).forEach(([e, a]) => opts.push({t: nice(a[0]), ok: false, why: `«${nice(a[0])}» es un ATRIBUTO de ${e.n}, no una entidad.`}));
  (er.traps || []).slice(0, 2).forEach(t => opts.push({t: t.n, ok: false, why: t.why}));
  const seen = new Set(); return shuffle(opts.filter(o => { const k = fold2(o.t); if (seen.has(k)) return false; seen.add(k); return true; }));
}
function renderEnts(q) {
  st.opts = entOptions(q); st.sel = new Set();
  return `${rulesBox(q.cs, true)}<p class="hint">Marca <b>solo las entidades</b> del enunciado (en <b>singular</b>). Las relaciones son verbos y los atributos son datos.</p><div class="opts">${st.opts.map((o, i) => `<button class="opt" data-i="${i}" onclick="BQA.tog(${i})">${esc(o.t)}</button>`).join('')}</div>`;
}
function checkEnts(q) {
  if (!st.sel.size) return {flash: 'Marca al menos una entidad.'};
  let good = 0, wrong = 0; const total = st.opts.filter(o => o.ok).length;
  document.querySelectorAll('.opt').forEach(b => { const i = +b.dataset.i, o = st.opts[i], on = st.sel.has(i); b.disabled = true;
    if (o.ok && on) good++; if (!o.ok && on) wrong++;
    b.classList.add(o.ok ? (on ? 'good' : 'bad') : (on ? 'bad' : 'dim')); b.innerHTML = `${esc(o.t)}<small>${o.ok && !on ? 'Faltaba: ' : ''}${esc(o.why)}</small>`; });
  const score = Math.max(0, (good - wrong * .5) / total);
  return {ok: good === total && !wrong, score, fb: ''};
}

// ---------- ATRIBUTOS ----------
function renderAttrs(q) {
  const multi = q.ents.some(e => e.attrs.some(a => flagsOf(a, 'm'))), comp = q.ents.some(e => e.attrs.some(a => flagsOf(a, 'c')));
  st.attrCols = {multi, comp};
  return `${rulesBox(q.cs, true)}<p class="hint">Para cada atributo marca: <b>identificador</b> (el subrayado; solo uno por entidad), <b>opcional</b> (puede faltar)${multi ? ', <b>multivalorado</b> (varios valores)' : ''}${comp ? ' y <b>componente de un atributo compuesto</b>' : ''}.</p>
  ${q.ents.map((e, ei) => `<div class="tblwrap"><table class="keys attrs" data-e="${ei}"><thead><tr><th>${esc(e.n)}</th><th>Identificador</th><th>Opcional</th>${multi ? '<th>Multivalorado</th>' : ''}${comp ? '<th>Compuesto</th>' : ''}</tr></thead><tbody>${shuffle(e.attrs.map((a, ai) => ai)).map(ai => `<tr data-a="${ai}"><td><code>${esc(e.attrs[ai][0])}</code></td><td><input type="radio" name="id${ei}" class="aid"></td><td><input type="checkbox" class="aop"></td>${multi ? '<td><input type="checkbox" class="amu"></td>' : ''}${comp ? '<td><input type="checkbox" class="aco"></td>' : ''}</tr>`).join('')}</tbody></table></div>`).join('')}`;
}
function checkAttrs(q) {
  let total = 0, good = 0;
  document.querySelectorAll('table.attrs').forEach(tb => { const e = q.ents[+tb.dataset.e];
    tb.querySelectorAll('tbody tr').forEach(tr => { const a = e.attrs[+tr.dataset.a];
      const cks = [['.aid', flagsOf(a, 'I')], ['.aop', flagsOf(a, 'o')], ['.amu', flagsOf(a, 'm')], ['.aco', flagsOf(a, 'c')]];
      cks.forEach(([sel, exp]) => { const el = tr.querySelector(sel); if (!el) return; total++; const g = el.checked === exp; if (g) good++; el.parentNode.classList.add(g ? 'good' : 'bad'); el.disabled = true; }); }); });
  return {ok: good === total, score: good / total, fb: `<ul class="flist">${q.ents.map(e => `<li><b>${esc(e.n)}</b>: identificador <code>${esc(e.attrs.filter(a => flagsOf(a, 'I')).map(a => a[0]).join(', '))}</code>${e.attrs.some(a => flagsOf(a, 'o')) ? ' · opcional: <code>' + esc(e.attrs.filter(a => flagsOf(a, 'o')).map(a => a[0]).join(', ')) + '</code>' : ''}${e.attrs.some(a => flagsOf(a, 'm')) ? ' · multivalorado: <code>' + esc(e.attrs.filter(a => flagsOf(a, 'm')).map(a => a[0]).join(', ')) + '</code>' : ''}</li>`).join('')}</ul><p class="small">Lo no marcado como opcional es obligatorio (así lo dice el enunciado).</p>`};
}

// ---------- (MIN,MAX): binaria, reflexiva con roles y ternaria ----------
const selOf = (k, vals) => `<select id="${k}">${['<option value="">?</option>', ...vals.map(v => `<option>${v}</option>`)].join('')}</select>`;
function renderCard(q) {
  const r = q.rel, c = q.cs;
  if (r.ternary) {
    st.tern = true;
    return `${rulesBox(c, true)}<p class="hint">Relación <b>ternaria</b>: las tres entidades participan a la vez. Pon el (min,max) de <b>cada una</b> (cuántas veces participa una instancia de esa entidad).</p>
    <div class="erline">${r.ternary.map((x, i) => `<span class="ent">${esc(x.e)}</span><span class="pair">(${selOf('tmin' + i, ['0', '1'])},${selOf('tmax' + i, ['1', 'N'])})</span>`).join('<span class="line"></span>')}</div><div class="erline"><span class="rombo">${esc(r.verb)}</span></div>
    <p class="hint">Atributo propio de la relación: <input id="attr" placeholder="nombre del atributo"></p>`;
  }
  const refl = !!r.roles;
  return `${rulesBox(c, true)}<p class="hint">Pon el (min,max) <b>junto a cada entidad</b>, como en los dibujos del profe: el par pegado a una entidad dice cuántas de <b>esa</b> le corresponden a <b>una</b> de la otra.${refl ? ' Es una relación <b>reflexiva</b>: escribe también el <b>rol</b> de cada extremo.' : ''}</p>
  <div class="erline"><span class="ent">${esc(r.a)}</span>${refl ? '<input id="rola" class="rolin" placeholder="rol…">' : ''}<span class="pair">(${selOf('amin', ['0', '1'])},${selOf('amax', ['1', 'N'])})</span><span class="line"></span><span class="rombo">${esc(r.verb)}</span><span class="line"></span><span class="pair">(${selOf('bmin', ['0', '1'])},${selOf('bmax', ['1', 'N'])})</span>${refl ? '<input id="rolb" class="rolin" placeholder="rol…">' : ''}<span class="ent">${esc(r.b)}</span></div>
  <p class="hint">Tipo de relación: ${selOf('tipo', ['1:1', '1:N', 'N:M'])}${r.attr ? ' · Atributo propio de la relación: <input id="attr" placeholder="nombre del atributo">' : ''}</p>`;
}
function attrHit(txt, want) { return want.split(',').every(x => norm(txt).includes(norm(x).trim().split('_')[0])); }
function checkCard(q) {
  const r = q.rel, v = k => $(k).value, mark = (k, g) => { $(k).classList.add(g ? 'good' : 'bad'); $(k).disabled = true; return g; };
  if (r.ternary) {
    const ks = r.ternary.flatMap((x, i) => ['tmin' + i, 'tmax' + i]); if (ks.some(k => !v(k))) return {flash: 'Rellena los tres pares (min,max).'};
    const res = r.ternary.flatMap((x, i) => [mark('tmin' + i, v('tmin' + i) === x.m[0]), mark('tmax' + i, v('tmax' + i) === x.m[1])]);
    const a = $('attr'); const aok = r.attr ? attrHit(a.value, r.attr) : true; mark('attr', aok); res.push(aok);
    const good = res.filter(Boolean).length;
    return {ok: good === res.length, score: good / res.length, fb: `<p><b>Solución:</b> ${r.ternary.map(x => `${esc(x.e)} <b>(${x.m.join(',')})</b>`).join(' — ')} · relación <b>${esc(r.verb)}</b> · atributo: <b>${esc(r.attr)}</b></p><p>${esc(r.why)}</p><p class="small">En la ternaria, el mínimo 1 de una entidad significa "participa siempre"; si el enunciado lo exige, además hace falta una ASERCIÓN de existencialidad.</p>`};
  }
  const ks = ['amin', 'amax', 'bmin', 'bmax', 'tipo']; if (ks.some(k => !v(k))) return {flash: 'Rellena los cuatro números y el tipo.'};
  const cur = {amin: v('amin'), amax: v('amax'), bmin: v('bmin'), bmax: v('bmax'), tipo: v('tipo')};
  const opts = [{amin: r.na[0], amax: r.na[1], bmin: r.nb[0], bmax: r.nb[1], tipo: r.tipo}, ...(r.alts || []).map(a => ({amin: a.na[0], amax: a.na[1], bmin: a.nb[0], bmax: a.nb[1], tipo: r.tipo, alt: a}))];
  const best = opts.map(o => ({o, hits: ks.filter(k => cur[k] === o[k]).length})).sort((x, y) => y.hits - x.hits)[0];
  const res = ks.map(k => mark(k, cur[k] === best.o[k]));
  if (r.roles) { const ra = r.ra || [r.roles.a], rb = r.rb || [r.roles.b]; const t1 = norm($('rola').value), t2 = norm($('rolb').value);
    const sw = ra.some(x => t1.includes(norm(x))) && rb.some(x => t2.includes(norm(x))); const sw2 = ra.some(x => t2.includes(norm(x))) && rb.some(x => t1.includes(norm(x)));
    const rok = sw || sw2; if (sw2 && !sw) { /* roles al revés: se avisa */ } mark('rola', rok); mark('rolb', rok); res.push(rok); }
  if (r.attr) { const a = $('attr'); const aok = attrHit(a.value, r.attr); mark('attr', aok); res.push(aok); }
  const good = res.filter(Boolean).length, ok = good === res.length;
  const alt = best.o.alt && ks.every(k => cur[k] === best.o[k]) ? `<p class="small">✔ Esta lectura también vale: ${esc(best.o.alt.why)}</p>` : '';
  return {ok, score: good / res.length, fb: `<p><b>Solución:</b> ${esc(r.a)}${r.roles ? ' <i>(' + esc(r.roles.a) + ')</i>' : ''} <b>(${r.na.join(',')})</b> — ${esc(r.verb)} — <b>(${r.nb.join(',')})</b> ${r.roles ? '<i>(' + esc(r.roles.b) + ')</i> ' : ''}${esc(r.b)} · <b>${r.tipo}</b>${r.attr ? ' · atributo: <b>' + esc(r.attr) + '</b>' : ''}</p><p>${esc(r.why)}</p>${(r.alts || []).length && !alt ? `<p class="small">También se admite: (${r.alts[0].na.join(',')}) / (${r.alts[0].nb.join(',')}). ${esc(r.alts[0].why)}</p>` : alt}`};
}

// ---------- EXISTENCIALIDAD (aserciones) ----------
function assertOptions(q) {
  const c = q.cs, right = (c.asserts || []).map(a => ({t: a.t, ok: true, why: a.why})), opts = [...right];
  const pk = t => t.cols.filter(x => /P/.test(x[1])).map(x => x[0]);
  const fks = []; c.tables.forEach(t => t.cols.forEach(x => { if (x[2] && !/P/.test(x[1])) { const R = c.tables.find(y => y.name === x[2]); if (R && R.name !== t.name) fks.push({t, x, R}); } }));
  const have = new Set(right.map(a => fold2(a.t).replace(/\s/g, '')));
  const wrong = shuffle(fks).map(({t, x, R}) => ({t: `${R.name}[${pk(R)[0]}] ⊆ ${t.name}[${x[0]}]`, ok: false, why: /o/.test(x[1]) || !/V/.test(x[1]) ? `El enunciado NO exige que todo ${R.name.toLowerCase()} tenga ${t.name.toLowerCase()} (el mínimo es 0): no hace falta aserción.` : `El enunciado no dice que todo ${R.name.toLowerCase()} tenga algún ${t.name.toLowerCase()}: el mínimo en ese lado es 0.`})).filter(o => !have.has(fold2(o.t).replace(/\s/g, ''))).slice(0, right.length ? 2 : 3);
  opts.push(...wrong);
  const one = shuffle(fks)[0]; if (one) opts.push({t: `${one.t.name}[${one.x[0]}] ⊆ ${one.R.name}[${pk(one.R)[0]}]`, ok: false, why: 'Esto ya lo garantiza la FOREIGN KEY: no es una aserción adicional.'});
  opts.push({t: 'Ninguna aserción adicional', ok: right.length === 0, none: true, why: right.length === 0 ? 'Correcto: todas las participaciones mínimas son 0 o salen de VNN/FK. No inventes restricciones que el enunciado no pide.' : 'Hay al menos un mínimo 1 en el lado "1" de una relación: sí hacen falta aserciones.'});
  return shuffle(opts);
}
function renderAssert(q) {
  st.opts = assertOptions(q); st.sel = new Set();
  return `${rulesBox(q.cs, true)}<p class="hint">Marca las <b>restricciones de existencialidad</b> que exige el enunciado y que <b>no salen</b> solo de PRIMARY KEY, FOREIGN KEY y NOT NULL. Se escriben así: <code>PADRE[clave] ⊆ HIJA[fk]</code> ("todo padre aparece en la tabla hija"). Si no hay ninguna, marca la última opción.</p><div class="opts">${st.opts.map((o, i) => `<button class="opt mono" data-i="${i}" onclick="BQA.tog(${i})">${esc(o.t)}</button>`).join('')}</div>`;
}
function checkAssert(q) {
  if (!st.sel.size) return {flash: 'Marca al menos una opción (o «Ninguna aserción adicional»).'};
  let good = 0, wrong = 0; const total = st.opts.filter(o => o.ok).length || 1;
  document.querySelectorAll('.opt').forEach(b => { const i = +b.dataset.i, o = st.opts[i], on = st.sel.has(i); b.disabled = true;
    if (o.ok && on) good++; if (!o.ok && on) wrong++;
    b.classList.add(o.ok ? (on ? 'good' : 'bad') : (on ? 'bad' : 'dim')); b.innerHTML = `${esc(o.t)}<small>${o.ok && !on ? 'Faltaba: ' : ''}${esc(o.why)}</small>`; });
  return {ok: good === total && !wrong, score: Math.max(0, (good - wrong * .5) / total), fb: `<p class="small">Regla: <b>min = 1 en el lado "1"</b> (todo departamento tiene al menos un empleado) → VNN en la FK no basta → ASERCIÓN de cobertura. <b>min = 0</b> → nada que añadir.</p>`};
}

// ---------- DDL desde cero ----------
function pickSubset(c) {
  const T = c.tables, byN = n => T.find(t => t.name === n);
  const cand = T.filter(t => t.cols.some(x => x[2] && x[2] !== t.name));
  const t0 = pick(cand.length ? cand : T); const names = new Set([t0.name]);
  t0.cols.forEach(x => { if (x[2] && names.size < 4) names.add(x[2]); });
  return [...names].map(n => byN(n));
}
function specOf(c, subset) { const names = new Set(subset.map(t => t.name)); return subset.map(t => ({name: t.name, cols: t.cols.map(x => (x[2] && !names.has(x[2])) ? [x[0], x[1], undefined] : x)})); }
function marcoLine(t, full) {
  const pk = t.cols.filter(c => /P/.test(c[1])).map(c => c[0]);
  const L = [`${t.name} = ${t.cols.map(c => c[0]).join(' + ')}`];
  if (!full) return L.join('\n');
  L.push(`CP(${pk.join(', ')})`); t.cols.filter(c => /A/.test(c[1])).forEach(c => L.push(`C.Alt(${c[0]})`));
  t.cols.filter(c => c[2]).forEach(c => L.push(`C.Aj(${c[0]}) → ${c[2]}`)); const v = t.cols.filter(c => /V/.test(c[1]) && !/P/.test(c[1])).map(c => `VNN(${c[0]})`); if (v.length) L.push(v.join(' '));
  return L.join('\n');
}
function renderDdlw(q) {
  if (!st.subset) { st.subset = pickSubset(q.cs); st.level = st.level || 'cols'; }
  const spec = st.subset;
  return `${rulesBox(q.cs, true)}<p class="hint">Escribe el <b>DDL</b> (solo <code>CREATE TABLE</code>, sin consultas) de estas <b>${spec.length} tablas</b>. Tablas en <b>singular</b> y creadas en el <b>orden correcto</b> (primero las que referencian otras). La sintaxis fina no es lo importante: cuentan <b>claves, NOT NULL, UNIQUE y FK</b>.</p>
  <div class="row"><label class="small">Ayuda: <select id="ddlLevel" onchange="BQA.ddlLevel(this.value)"><option value="cols" ${st.level === 'cols' ? 'selected' : ''}>Solo tablas y columnas (deduce las claves del enunciado)</option><option value="marco" ${st.level === 'marco' ? 'selected' : ''}>Con el marco completo (CP, C.Alt, C.Aj, VNN)</option></select></label></div>
  <pre class="code" id="marcoBox">${esc(spec.map(t => marcoLine(t, st.level === 'marco')).join('\n\n'))}</pre>
  <textarea id="ddlIn" class="editor" rows="12" spellcheck="false" placeholder="CREATE TABLE ... ( ... );">${esc(st.typed || '')}</textarea>`;
}
function checkDdlw(q) {
  const txt = $('ddlIn').value; st.typed = txt; if (!txt.trim()) return {flash: 'Escribe tu DDL antes de comprobar.'};
  $('ddlIn').disabled = true; $('ddlLevel').disabled = true;
  const db = SQLX.parseScript(txt), spec = specOf(q.cs, st.subset), g = SQLX.gradeSchema(db, spec);
  const syn = g.errors.filter(e => !/^fk(NotKey|Type|Order|NoTable|RefCol|NoPk|Count|Col|SetNull)$/.test(e.code) && e.code !== 'multiPk').length;
  const byT = {}; g.checks.forEach(ch => (byT[ch.table] = byT[ch.table] || []).push(ch));
  const list = Object.keys(byT).map(t => `<li><b>${esc(t)}</b><ul class="errs mini">${byT[t].map(ch => `<li class="${ch.ok ? 'good' : 'bad'}">${ch.ok ? '✔' : '✘'} ${esc(ch.label)}${ch.ok ? '' : '<br><small>' + esc(ch.hint) + '</small>'}</li>`).join('')}</ul></li>`).join('');
  const errs = g.errors.length ? `<h3>Errores que MySQL daría al ejecutarlo</h3><ul class="errs">${g.errors.map(e => `<li class="bad">${esc(e.msg)}</li>`).join('')}</ul>` : '';
  const warn = g.warns.length ? `<p class="small">⚠ ${g.warns.map(w => esc(w.msg)).join(' ')}</p>` : '';
  const score = Math.max(0, g.score - Math.min(.3, g.errors.length * .08));
  const sol = BQ_SOLUTION(q.cs, st.subset);
  return {ok: g.ok, score, fb: `<ul class="flist">${list}</ul>${errs}${warn}<details class="rules"><summary>Ver una solución modelo</summary><pre class="code">${esc(sol)}</pre><p class="small">Los tipos (VARCHAR(n), INT...) pueden variar: lo evaluable son claves, nulos y FK.</p></details>`};
}
function BQ_SOLUTION(c, subset) { return D.solutionDDL(specOf(c, subset)); }

// ---------- DML: revisar errores / desde cero ----------
function dmlCommon(t) {
  return `<p class="hint">${t.src ? '<span class="small">' + esc(t.src) + '</span><br>' : ''}${esc(t.prompt)}</p>${dataViewer(t.db)}`;
}
function renderDmlr(q) {
  const t = q.t; st.hint = 0;
  return `${dmlCommon(t)}<p class="hint">Esta sentencia <b>tiene un error</b>. Explica <b>qué falla y por qué</b> (campo libre) y escribe la sentencia <b>corregida</b>.</p>
  <pre class="code">${esc(t.bad)}</pre>
  <label class="small" for="dwhy">1) ¿Qué está mal y por qué?</label><textarea id="dwhy" rows="3" placeholder="Escribe con tus palabras qué falla…"></textarea>
  <label class="small" for="dfix">2) Escribe aquí la sentencia correcta (en blanco para que la rellenes):</label><textarea id="dfix" class="editor" rows="4" spellcheck="false" placeholder="SELECT ..."></textarea>
  <p class="small">Se corrige comparando la explicación con las ideas clave y <b>ejecutando</b> tu sentencia sobre los datos.</p>`;
}
function resBlock(label, r) {
  if (r.error) return `<div class="dres bad"><b>${label}</b><br>❌ ${esc(r.error)}</div>`;
  return `<div class="dres"><b>${label}</b>${r.kind === 'select' ? resultTable(r) : `<p>${esc(r.op)}: ${r.affected} fila(s) afectada(s)</p>`}</div>`;
}
function runSafe(db, sql) { try { return T2.mkEngine(db).execAll(sql).pop(); } catch (e) { if (e instanceof SQLX.SqlError) return {error: e.message}; throw e; } }
function checkDmlr(q) {
  const t = q.t, why = $('dwhy').value, fix = $('dfix').value;
  if (!why.trim() && !fix.trim()) return {flash: 'Explica el error y/o escribe la corrección antes de comprobar.'};
  const hits = groupsHit(why, t.why), whyScore = why.trim() ? hits.filter(Boolean).length / hits.length : 0;
  let fixScore = 0, fixHtml = '';
  $('dwhy').disabled = true; $('dfix').disabled = true;
  if (fix.trim()) { const g = SQLX.gradeDml({db: t.db, kind: t.kind, ref: t.ref, aliases: t.aliases}, fix, T2.mkEngine.bind(null)); fixScore = g.ok ? 1 : 0;
    fixHtml = g.ok ? '<p>✔ Tu corrección <b>da el resultado correcto</b> al ejecutarla.</p>' : `<p>✘ Tu corrección no es correcta: ${g.error ? 'MySQL: ' + esc(g.error) : esc(g.msgs.join(' '))}</p>`; }
  else fixHtml = '<p class="small">No has escrito la corrección.</p>';
  const badRun = runSafe(t.db, t.bad), refRun = runSafe(t.db, [].concat(t.ref)[0]);
  const score = (whyScore + fixScore) / 2, ok = whyScore === 1 && fixScore === 1;
  return {ok, score, fb: `<p><b>Explicación modelo:</b> ${t.model}</p>${why.trim() ? `<p class="small">Tu explicación: ${hits.every(Boolean) ? '✔ tiene las ideas clave' : '◐ le falta alguna idea clave (' + hits.filter(h => !h).length + ' de ' + hits.length + ')'}.</p>` : ''}${fixHtml}<div class="cols2">${resBlock('Lo que hace la sentencia con error', badRun)}${resBlock('Lo que debería hacer', refRun)}</div><p><b>Corrección:</b></p><pre class="code">${esc([].concat(t.ref)[0])}</pre>`};
}
function renderDmlw(q) {
  const t = q.t; st.hint = 0;
  return `${dmlCommon(t)}
  <div class="row"><button class="ghost" onclick="BQA.dmlHint()" id="dmlHintBtn">💡 Pista (0/${(t.hints || []).length})</button>${t.skeleton ? '<button class="ghost" onclick="BQA.dmlSkel()">🧩 Plantilla</button>' : ''}</div><div id="dmlHints"></div>
  <textarea id="dmlIn" class="editor" rows="6" spellcheck="false" placeholder="Escribe aquí tu sentencia SQL…">${esc(st.typed || '')}</textarea><p class="small">Se corrige <b>ejecutándola</b> sobre los datos y comparando el resultado con el de la solución.</p>`;
}
function checkDmlw(q) {
  const t = q.t, sql = $('dmlIn').value; st.typed = sql; if (!sql.trim()) return {flash: 'Escribe la sentencia antes de comprobar.'};
  $('dmlIn').disabled = true;
  const g = SQLX.gradeDml({db: t.db, kind: t.kind, ref: t.ref, aliases: t.aliases, ordered: t.ordered}, sql, T2.mkEngine.bind(null));
  let body = '';
  if (g.error) body = `<div class="dres bad"><b>MySQL dice:</b><br>❌ ${esc(g.error)}</div>`;
  else {
    if (g.msgs.length) body += `<ul class="errs">${g.msgs.map(m => `<li class="bad">${esc(m)}</li>`).join('')}</ul>`;
    if (g.user && g.user.kind === 'select') body += `<div class="cols2"><div class="dres"><b>Tu resultado</b>${resultTable(g.user)}</div>${g.ok ? '' : `<div class="dres"><b>Resultado esperado</b>${g.ref ? resultTable(g.ref) : ''}</div>`}</div>`;
    else if (g.user) body += `<p>Tu sentencia: ${esc(g.user.op)} · ${g.user.affected} fila(s) afectada(s). Debían ser ${g.ref ? g.ref.affected : '?'}.</p>`;
  }
  return {ok: g.ok, score: g.ok ? 1 : 0, fb: `${body}<p><b>Solución:</b></p><pre class="code">${esc([].concat(t.ref).join(';\n'))}</pre>`};
}

// ---------- dibujo del E/R (solución) ----------
T2.erSvg = function (c) {
  const ents = [...new Set(c.rels.flatMap(r => r.ternary ? r.ternary.map(x => x.e) : [r.a, r.b]))];
  const W = 760, H = 460, cx = W / 2, cy = H / 2, rx = 290, ry = 165, pos = {};
  ents.forEach((e, i) => { const a = (i / ents.length) * Math.PI * 2 - Math.PI / 2; pos[e] = [cx + rx * Math.cos(a), cy + ry * Math.sin(a)]; });
  let s = `<svg viewBox="0 0 ${W} ${H}" class="ersvg" role="img" aria-label="E/R de ${esc(c.name)}"><rect width="${W}" height="${H}" fill="#fff"/>`;
  const box = (x, y, t) => `<rect x="${x - 46}" y="${y - 15}" width="92" height="30" fill="#fff" stroke="#111" stroke-width="2"/><text x="${x}" y="${y + 5}" text-anchor="middle" font-size="13" font-weight="700" fill="#111">${esc(t)}</text>`;
  const rhomb = (x, y, t) => `<polygon points="${x},${y - 17} ${x + 46},${y} ${x},${y + 17} ${x - 46},${y}" fill="#fff" stroke="#111" stroke-width="2"/><text x="${x}" y="${y + 4}" text-anchor="middle" font-size="11" fill="#111">${esc(t)}</text>`;
  const lab = (x1, y1, x2, y2, t) => { const px = x1 + (x2 - x1) * .3, py = y1 + (y2 - y1) * .3; return `<text x="${px}" y="${py - 5}" text-anchor="middle" font-size="12" font-weight="700" fill="#b33">${esc(t)}</text>`; };
  c.rels.forEach(r => {
    if (r.ternary) { const pts = r.ternary.map(x => pos[x.e]); const mx = pts.reduce((a, p) => a + p[0], 0) / 3, my = pts.reduce((a, p) => a + p[1], 0) / 3;
      r.ternary.forEach((x, i) => { s += `<line x1="${pts[i][0]}" y1="${pts[i][1]}" x2="${mx}" y2="${my}" stroke="#111" stroke-width="1.5"/>${lab(pts[i][0], pts[i][1], mx, my, `(${x.m.join(',')})`)}`; }); s += rhomb(mx, my, r.verb); }
    else if (r.a === r.b) { const [x, y] = pos[r.a]; const mx = x + 70, my = y - 60; s += `<path d="M ${x + 30} ${y - 15} Q ${mx + 20} ${my - 20} ${mx} ${my + 17}" fill="none" stroke="#111" stroke-width="1.5"/><path d="M ${x + 46} ${y} Q ${mx + 70} ${my + 20} ${mx + 40} ${my + 12}" fill="none" stroke="#111" stroke-width="1.5"/>${rhomb(mx, my, r.verb)}<text x="${x + 26}" y="${y - 24}" font-size="11" font-weight="700" fill="#b33">(${r.na.join(',')}) ${esc(r.roles.a)}</text><text x="${x + 52}" y="${y + 18}" font-size="11" font-weight="700" fill="#b33">(${r.nb.join(',')}) ${esc(r.roles.b)}</text>`; }
    else { const [x1, y1] = pos[r.a], [x2, y2] = pos[r.b], mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#111" stroke-width="1.5"/>${lab(x1, y1, x2, y2, `(${r.na.join(',')})`)}${lab(x2, y2, x1, y1, `(${r.nb.join(',')})`)}${rhomb(mx, my, r.verb)}`; }
  });
  ents.forEach(e => { s += box(pos[e][0], pos[e][1], e); });
  return s + '</svg>';
};


// ---------- dibujo del E/R COMPLETO (con atributos), como en el examen ----------
T2.erSvgFull = function (c) {
  const er = T2.erOf(c), attrsOf = n => { const e = er.entities.find(x => sameName(x.n, n)); return e ? e.attrs : []; };
  const names = [...new Set(c.rels.flatMap(r => r.ternary ? r.ternary.map(x => x.e) : [r.a, r.b]))];
  const N = names.length, big = N > 4, W = big ? 1240 : 1000, H = big ? 800 : 640, cx = W / 2, cy = H / 2, rx = W * (N <= 2 ? .28 : .33), ry = H * (N <= 2 ? .1 : .31), pos = {};
  names.forEach((e, i) => { const a = N === 1 ? 0 : (i / N) * Math.PI * 2 - Math.PI / 2 + (N === 2 ? Math.PI / 2 : 0); pos[e] = [cx + rx * Math.cos(a), cy + ry * Math.sin(a), a]; });
  let lines = '', shapes = '';
  const tw = t => Math.max(54, 6.6 * String(t).length + 18);
  const ent = (x, y, t) => `<rect x="${x - 48}" y="${y - 16}" width="96" height="32" fill="#fff" stroke="#111" stroke-width="2"/><text x="${x}" y="${y + 5}" text-anchor="middle" font-size="14" font-weight="700" fill="#111">${esc(t)}</text>`;
  const rhomb = (x, y, t) => `<polygon points="${x},${y - 20} ${x + Math.max(48, 3.6 * t.length + 14)},${y} ${x},${y + 20} ${x - Math.max(48, 3.6 * t.length + 14)},${y}" fill="#fff" stroke="#111" stroke-width="2"/><text x="${x}" y="${y + 4}" text-anchor="middle" font-size="11" fill="#111">${esc(t)}</text>`;
  const attr = (x, y, a, dashed) => { const f = a[1] || '', w = tw(a[0]), id = /I/.test(f), part = /p/.test(f), multi = /m/.test(f);
    lines += `<line x1="${x}" y1="${y}" x2="${a._ex}" y2="${a._ey}" stroke="#111" stroke-width="1.3" ${/o/.test(f) ? 'stroke-dasharray="5 4"' : ''}/>`;
    return `${multi ? `<ellipse cx="${x}" cy="${y}" rx="${w / 2 + 5}" ry="19" fill="#fff" stroke="#111" stroke-width="1.3"/>` : ''}<ellipse cx="${x}" cy="${y}" rx="${w / 2}" ry="${multi ? 15 : 14}" fill="#fff" stroke="#111" stroke-width="1.3"/><text x="${x}" y="${y + 4}" text-anchor="middle" font-size="11" fill="#111" ${id ? 'font-weight="700" text-decoration="underline"' : ''} ${part ? 'text-decoration="underline" style="text-decoration-style:dashed"' : ''}>${esc(a[0])}</text>`; };
  // relaciones
  const pairCount = {};
  c.rels.forEach(r => {
    const key = r.ternary ? null : [r.a, r.b].sort().join('|'); if (key) pairCount[key] = (pairCount[key] || 0) + 1; const off = key ? (pairCount[key] - 1) * 56 : 0;
    const lab = (x1, y1, x2, y2, t, dx = 0) => `<text x="${x1 + (x2 - x1) * .27 + dx}" y="${y1 + (y2 - y1) * .27 - 6}" text-anchor="middle" font-size="12" font-weight="700" fill="#b02a2a">${esc(t)}</text>`;
    let mx, my;
    if (r.ternary) { const pts = r.ternary.map(x => pos[x.e]); mx = pts.reduce((a, p) => a + p[0], 0) / 3; my = pts.reduce((a, p) => a + p[1], 0) / 3;
      r.ternary.forEach((x, i) => { lines += `<line x1="${pts[i][0]}" y1="${pts[i][1]}" x2="${mx}" y2="${my}" stroke="#111" stroke-width="1.6"/>`; shapes += lab(pts[i][0], pts[i][1], mx, my, fp2(x.m)); }); }
    else if (r.a === r.b) { const [x, y, a0] = pos[r.a], a = a0 + Math.PI, ox = Math.cos(a) * 110, oy = Math.sin(a) * 110; mx = x + ox; my = y + oy;
      lines += `<line x1="${x}" y1="${y}" x2="${mx}" y2="${my}" stroke="#111" stroke-width="1.6"/>`; lines += `<path d="M ${x + 30} ${y + 12} Q ${mx + 70 * Math.sin(a)} ${my - 70 * Math.cos(a)} ${mx} ${my}" fill="none" stroke="#111" stroke-width="1.6"/>`;
      shapes += `<text x="${x + 54 * Math.cos(a) + 18}" y="${y + 54 * Math.sin(a) - 8}" font-size="11" font-weight="700" fill="#b02a2a">${fp2(r.na)} ${esc(r.roles ? r.roles.a : '')}</text><text x="${x + 54 * Math.cos(a) + 18}" y="${y + 54 * Math.sin(a) + 16}" font-size="11" font-weight="700" fill="#b02a2a">${fp2(r.nb)} ${esc(r.roles ? r.roles.b : '')}</text>`; }
    else { const [x1, y1] = pos[r.a], [x2, y2] = pos[r.b]; const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1; mx = (x1 + x2) / 2 - dy / L * off; my = (y1 + y2) / 2 + dx / L * off;
      lines += `<line x1="${x1}" y1="${y1}" x2="${mx}" y2="${my}" stroke="#111" stroke-width="1.6"/><line x1="${mx}" y1="${my}" x2="${x2}" y2="${y2}" stroke="#111" stroke-width="1.6"/>`;
      shapes += lab(x1, y1, mx, my, fp2(r.na)) + lab(x2, y2, mx, my, fp2(r.nb)); }
    shapes += rhomb(mx, my, r.verb);
    String(r.attr || '').split(',').map(x => x.trim()).filter(Boolean).forEach((an, i) => { const ax = mx + 20 + i * 8, ay = my - 62 - i * 30; lines += `<line x1="${mx}" y1="${my - 20}" x2="${ax}" y2="${ay + 14}" stroke="#111" stroke-width="1.3"/>`; shapes += `<ellipse cx="${ax}" cy="${ay}" rx="${tw(an) / 2}" ry="14" fill="#fff" stroke="#111" stroke-width="1.3"/><text x="${ax}" y="${ay + 4}" text-anchor="middle" font-size="11" fill="#111">${esc(an)}</text>`; });
  });
  // entidades y atributos
  names.forEach(n => { const [x, y, a] = pos[n], at = attrsOf(n), k = at.length;
    const out = N === 1 ? -Math.PI / 2 : a, spread = Math.min(2.7, .62 * Math.max(1, k - 1)), R = 82 + 7 * k;
    at.forEach((q, i) => { const ang = k === 1 ? out : out - spread / 2 + spread * i / (k - 1), ax = x + R * Math.cos(ang), ay = y + R * Math.sin(ang) * .78; q._ex = x + 48 * Math.cos(ang) * .9; q._ey = y + 16 * Math.sin(ang) * 1.1; shapes += attr(ax, ay, q); });
    shapes += ent(x, y, n); });
  return `<div class="svgwrap"><svg viewBox="0 0 ${W} ${H}" class="ersvg" style="min-width:${big ? 900 : 720}px" role="img" aria-label="E/R de ${esc(c.name)}"><rect width="${W}" height="${H}" fill="#fff"/>${lines}${shapes}</svg></div>`;
};
const fp2 = p => `(${p[0]},${p[1]})`;

window.T2 = T2;
Object.assign(T2, {renderEnts, checkEnts, renderAttrs, checkAttrs, renderCard, checkCard, renderAssert, checkAssert, renderDdlw, checkDdlw, renderDmlr, checkDmlr, renderDmlw, checkDmlw});
T2.render = q => ({ents: renderEnts, attrs: renderAttrs, card: renderCard, assert: renderAssert, ddlw: renderDdlw, dmlr: renderDmlr, dmlw: renderDmlw})[q.type](q);
T2.check = q => ({ents: checkEnts, attrs: checkAttrs, card: checkCard, assert: checkAssert, ddlw: checkDdlw, dmlr: checkDmlr, dmlw: checkDmlw})[q.type](q);
