// BDA-QUEST · motor del juego (mismo método que SYS-QUEST: teoría con truco, rondas de 10,
// banco de fallos que se repite hasta acertar 2 veces seguidas, chuleta y progreso).
(() => {
'use strict';
const D = window.BQ;
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const shuffle = a => { a=[...a]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };
const pick = a => a[Math.floor(Math.random()*a.length)];
const UNITS = D.UNITS, unitById = id => UNITS.find(u => u.id === id);
const caseById = id => D.CASES.find(c => c.id === id);
const KEY = 'bdaquest_v1';
const fresh = () => ({paper:{}, plan:{}, xp:0, streak:0, best:0, done:0, right:0, fails:{}, recent:[], unit:{}, exams:[]});
let save;
try { save = {...fresh(), ...JSON.parse(localStorage.getItem(KEY) || '{}')}; } catch { save = fresh(); }
function persist(){ try { localStorage.setItem(KEY, JSON.stringify(save)); } catch(e){} hud(); }

// ---------- normalización y corrección de texto libre ----------
const norm = s => String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9.=_,()\s-]/g,' ').replace(/\s+/g,' ').trim();
function hasAlt(text, alt){
  const a = norm(alt).trim(); if(!a) return false;
  if(a.length <= 3 && /^[a-z0-9]+$/.test(a)) return new RegExp('(^|[^a-z0-9])'+a+'([^a-z0-9]|$)').test(text);
  return text.includes(a);
}
function groupsHit(text, groups){ const t = ' '+norm(text)+' '; return groups.map(g => g.some(alt => hasAlt(t, alt))); }
/*TASKS2*/
/*PAPER*/

// ---------- HUD ----------
const level = () => 1 + Math.floor(save.xp/150);
function hud(){
  $('xp').textContent = save.xp; $('lv').textContent = level(); $('st').textContent = save.streak;
  const n = failIds().length; $('failCount').textContent = n; $('failBtn').classList.toggle('glow', n>0);
}

// ---------- vistas ----------
function view(html){ $('main').innerHTML = html; window.scrollTo(0,0); $('main').focus({preventScroll:true}); }
function unitPct(id){ const s = save.unit[id]; return s && s.done ? Math.round(s.right/s.done*100) : null; }


// ---------- PLAN DE REPASO (modo examen mañana, pensado para TDAH) ----------
const PLAN = [
  {i:'🧠', t:'Calentar: chuleta de trucos', m:5, go:()=>{ cheats(); }, cheat:true},
  {i:'◇', t:'E/R: festival de cine (examen real)', m:12, go:()=>casePart('festival',1)},
  {i:'◇', t:'E/R: reflexiva con roles', m:8, go:()=>casePart('empresa',1)},
  {i:'◇', t:'E/R: ternaria', m:8, go:()=>casePart('consultora',1)},
  {i:'▤', t:'Paso a tablas: huerto del examen', m:10, go:()=>casePart('huertoex',2)},
  {i:'▤', t:'Tablas + existencialidad (consultora)', m:10, go:()=>casePart('consultora',2)},
  {i:'⌗', t:'DDL: validar y escribir desde cero', m:12, go:()=>casePart('festival',3)},
  {i:'▶', t:'DML: 5 sentencias con error', m:10, go:()=>practice('dmlr')},
  {i:'▶', t:'DML: escribir desde cero', m:10, go:()=>practice('dmlw')},
  {i:'📝', t:'Simulacro final (examen completo)', m:30, go:()=>exam()}
];
let pomo = {end:0, t:null};
function pomoTick(){ const b=$('tmBtn'); if(!b) return; const left=Math.max(0,pomo.end-Date.now()); if(!pomo.end){ b.textContent='⏱ 25'; return; }
  const m=Math.floor(left/60000), sec=String(Math.floor(left%60000/1000)).padStart(2,'0'); b.textContent=`⏱ ${m}:${sec}`;
  if(left===0){ clearInterval(pomo.t); pomo.end=0; b.textContent='⏱ 25'; alert('⏰ 25 minutos. Descansa 5 minutos: levántate, bebe agua. Luego vuelves.'); } }
function pomoToggle(){ if(pomo.end){ clearInterval(pomo.t); pomo.end=0; pomoTick(); return; } pomo.end=Date.now()+25*60000; pomo.t=setInterval(pomoTick,1000); pomoTick(); }
function planNext(){ const i = PLAN.findIndex((p,k) => !save.plan[k]); return i<0 ? -1 : i; }
function planGo(i){ pendingPlan = i; PLAN[i].go(); if(PLAN[i].cheat){ save.plan[i]=true; persist(); pendingPlan=null; } }
function home(){
  const n = planNext(), done = Object.keys(save.plan).length, pct = Math.round(done/PLAN.length*100);
  const cur = n<0 ? null : PLAN[n];
  view(`<section class="hero"><h1>Plan para el examen</h1>
   <div class="bar" style="width:100%;margin:6px 0"><i style="width:${pct}%"></i></div><p class="small">${done} de ${PLAN.length} pasos hechos</p>
   ${cur ? `<div class="stepnow"><span class="uicon">${cur.i}</span><div><b>Paso ${n+1}: ${esc(cur.t)}</b><br><span class="small">≈ ${cur.m} min · una cosa cada vez</span></div></div>
   <div class="row big"><button class="primary" onclick="BQA.planGo(${n})">▶ Empezar este paso</button><button class="ghost" onclick="BQA.planSkip(${n})">Saltar</button></div>` : `<h2>🏆 ¡Plan completado!</h2><div class="row big"><button class="primary" onclick="BQA.exam()">📝 Otro simulacro</button><button onclick="BQA.review()">♻ Repasar fallos</button></div>`}
   <div class="row"><button class="primary" onclick="BQA.paper()">✏️ Modo papel (resuelvo en folio)</button></div><div class="row"><button class="ghost" id="tmBtn" onclick="BQA.pomo()">⏱ 25</button><span class="small">Temporizador de 25 min: cuando suene, 5 min de descanso.</span></div></section>
   <ol class="plan">${PLAN.map((p,k)=>`<li class="${save.plan[k]?'dn':k===n?'now':''}"><button onclick="BQA.planGo(${k})"><span>${save.plan[k]?'✔':p.i}</span> ${esc(p.t)} <small>${p.m} min</small></button></li>`).join('')}</ol>
   <details class="rules"><summary>Más opciones (todos los casos, temas, rondas)</summary><div id="moreBox"></div></details>`);
  $('moreBox').innerHTML = homeFull(); pomoTick(); hud();
}

function homeFull(){
  const cards = UNITS.map(u => { const p = unitPct(u.id);
    return `<button class="ucard ${u.exam?'exam':''}" onclick="BQA.unit('${u.id}')"><span class="uicon">${u.icon}</span><span class="uname">${esc(u.name)}</span><span class="usub">${esc(u.subtitle)}</span><span class="ubadge">${u.exam?'EXAMEN':'APOYO'}</span><span class="upct">${p==null?'NUEVO':p+'%'}</span></button>`; }).join('');
  const cases = D.CASES.map(c => `<div class="case"><b>${esc(c.name)}</b><span class="small">${esc(c.from)}</span><div class="row"><button onclick="BQA.exam('${c.id}')" class="primary">Examen completo</button><button onclick="BQA.casePart('${c.id}',1)">1 · E/R</button><button onclick="BQA.casePart('${c.id}',2)">2 · Tablas</button><button onclick="BQA.casePart('${c.id}',3)">3 · DDL</button><button onclick="BQA.casePart('${c.id}',4)">4 · DML</button></div></div>`).join('');
  const last = save.exams.slice(-3).reverse().map(e => `<li>${esc(e.date)} · ${esc(e.name)}: <b>${e.total}%</b> (E/R ${e.p[0]}% · tablas ${e.p[1]}% · DDL ${e.p[2]}%${e.p[3]!==undefined?' · DML '+e.p[3]+'%':''})</li>`).join('');
  return (`<section class="hero"><h1>BDA-QUEST</h1><p>El examen tiene <b>3 partes</b>: <b>1)</b> E/R conceptual · <b>2)</b> paso a tablas (claves y <b>restricciones de existencialidad</b>) · <b>3)</b> consultas: <b>DDL</b> de varias tablas (validar y escribir desde cero) y <b>DML</b> de una tabla (<b>5 sentencias con error</b> para revisar + <b>1 desde cero</b>). Tablas en <b>singular</b>; reflexivas con <b>rol</b>; ternarias.</p>
   <div class="row big"><button class="primary" onclick="BQA.exam()">📝 Examen completo (3 partes)</button><button onclick="BQA.campaign('')">⚔ Ronda mixta</button><button onclick="BQA.review()">♻ Repasar fallos</button></div>
   <div class="row"><button onclick="BQA.practice('dmlr')">🔎 DML: 5 sentencias con error</button><button onclick="BQA.practice('dmlw')">⌨ DML: desde cero</button><button onclick="BQA.practice('ddlw')">🏗 DDL: desde cero</button><button onclick="BQA.practice('ddl')">🧪 DDL: validar y explicar</button></div>
   <div class="row"><button class="ghost" onclick="BQA.cheats()">🧠 Chuleta de trucos</button><button class="ghost" onclick="BQA.progress()">▤ Progreso</button></div>
   ${last?`<ul class="small hist">${last}</ul>`:''}</section>
   <h2 class="sec">Casos con formato de examen</h2><p class="small">Cada caso trae su enunciado y se puede hacer entero o por partes: <b>1 E/R</b> (entidades, atributos, (min,max), reflexiva/ternaria) · <b>2 Tablas</b> (claves + existencialidad) · <b>3 DDL</b> · <b>4 DML</b>.</p><div class="cases">${cases}</div>
   <h2 class="sec">Temas</h2><div class="ugrid">${cards}</div>`);
}

function unitView(id){
  const u = unitById(id);
  const blocks = u.blocks.map((b,i) => `<article class="block"><h3>${i+1}. ${esc(b.t)}</h3>${b.img?`<img src="${b.img}" alt="${esc(b.t)}" loading="lazy">`:''}<div class="bx">${b.x}</div><div class="truco">💡 <b>Truco:</b> ${esc(b.k)}</div></article>`).join('');
  const n = qsOf(id).length;
  view(`<div class="crumb"><button class="ghost" onclick="BQA.home()">← Inicio</button></div><section class="hero"><h1>${u.icon} ${esc(u.name)}</h1><p>${esc(u.subtitle)}</p><p class="small">Fuente: ${esc(u.ref)}</p><div class="row"><button class="primary" onclick="BQA.campaign('${id}')">⚔ Ronda de este tema (${n} preguntas en el banco)</button></div></section>${blocks}<div class="row"><button class="primary" onclick="BQA.campaign('${id}')">⚔ Ronda de este tema</button><button class="ghost" onclick="BQA.home()">← Inicio</button></div>`);
}

// ---------- banco: preguntas normales + generadas desde los casos ----------
function caseQs(){
  const out = [];
  for(const c of D.CASES){
    c.rels.forEach((r,i) => out.push({id:`card:${c.id}:${i}`, topic:'er', type:'card', title:`${c.name}: ${r.ternary ? r.ternary.map(x=>x.e).join(' — ')+' (ternaria) · '+r.verb : r.a+' — '+r.verb+' — '+r.b+(r.roles?' (reflexiva)':'')}`, cs:c, rel:r, truco: r.ternary ? 'Ternaria: el par de cada entidad dice cuántas veces participa. "Todos los X han..." → mínimo 1; "puede no haber..." → 0.' : r.roles ? 'Reflexiva: mismo nombre en las dos puntas, un ROL en cada una. El par junto al rol dice cuántos de ese rol le tocan a UNO del otro rol.' : 'Pon junto a cada entidad cuántas de ESA le tocan a UNA de la otra, y escribe la frase. "Puede" → 0, "siempre/todo/exactamente" → 1.'}));
    c.tables.forEach(t => { if(t.cols.some(x => x[2] || /A/.test(x[1])) || t.cols.filter(x=>/P/.test(x[1])).length>1)
      out.push({id:`keys:${c.id}:${t.name}`, topic:'tab', type:'keys', title:`${c.name}: claves de ${t.name}`, cs:c, table:t, truco:'Cinco preguntas: CP (única, mínima, no nula), C.Alt (lo que no se repite), C.Aj (a quién apunto), VNN (¿puede existir sin…?), ¿compuesta?'}); });
    out.push({id:`ddl:${c.id}`, topic:'ddl', type:'ddl', title:`${c.name}: valida el DDL`, cs:c, truco:'Cada CREATE: ¿PK? ¿FKs? ¿NOT NULL donde toca y solo donde toca? ¿UNIQUE? ¿tipos? ¿orden? ¿singular? Y en el porqué, cita la regla del enunciado.'});
    out.push(...T2.extraCaseQs(c));
  }
  return out;
}
const CASEQ = caseQs();
const DMLQ = T2.dmlQs();
const ALL = () => [...D.BANK, ...CASEQ, ...DMLQ];
const qsOf = topic => ALL().filter(q => q.topic === topic);
const byId = id => ALL().find(q => q.id === id);

// Generador: "¿dónde va la FK?" con números nuevos cada vez (como los cálculos de SYS-QUEST).
const PAIRS = [['Cliente','Pedido','cliente_id','realiza'],['Departamento','Empleado','departamento_id','tiene'],['Equipo','Ciclista','nomeq','tiene'],['Vecino','Parcela','dni_vecino','tiene'],['Monitor','Taller','dni_monitor','imparte'],['Editorial','Libro','editorial_id','publica'],['Aula','Asignatura','aula_id','acoge'],['Almacén','Estantería','almacen_id','contiene']];
const NM = [['Autor','Libro','escribe'],['Médico','Paciente','atiende'],['Alumno','Módulo','cursa'],['Pedido','Producto','incluye'],['Vecino','Taller','se apunta a']];
function genMap(){
  const kind = pick(['1N','1N','1N','NM','11']);
  if(kind==='NM'){ const [a,b,v] = pick(NM);
    return {id:'gen-map', topic:'tab', type:'choice', gen:true, title:'Generado: ¿cómo se pasa?', q:`Un ${a.toLowerCase()} ${v} varios ${b.toLowerCase()}s y un ${b.toLowerCase()} puede estar relacionado con varios ${a.toLowerCase()}s. ¿Cómo se pasa a tablas?`,
      opts:shuffle([[`Tabla intermedia con las dos FKs y CP compuesta por ellas`,true,'Es N:M: los dos máximos son N.'],[`FK de ${a} dentro de ${b.toUpperCase()}`,false,`Solo cabría un ${a.toLowerCase()} por ${b.toLowerCase()}.`],[`FK de ${b} dentro de ${a.toUpperCase()}`,false,`Solo cabría un ${b.toLowerCase()} por ${a.toLowerCase()}.`],[`Tabla intermedia con CP solo en la FK de ${a}`,false,'La CP debe ser compuesta.']]), truco:'N:M = puente con CP compuesta.'}; }
  const [p,h,fk,v] = pick(PAIRS);
  if(kind==='11'){
    return {id:'gen-map', topic:'tab', type:'choice', gen:true, title:'Generado: 1:1', q:`Cada ${h.toLowerCase()} tiene exactamente un ${p.toLowerCase()} y cada ${p.toLowerCase()} tiene como mucho un ${h.toLowerCase()}. Pones la FK ${fk} en ${h.toUpperCase()}. ¿Qué más necesita?`,
      opts:shuffle([[`VNN(${fk}) y C.Alt(${fk}) (UNIQUE)`,true,'VNN porque es obligatorio; UNIQUE para que sea 1:1 y no 1:N.'],[`Solo VNN(${fk})`,false,'Sin UNIQUE un '+p.toLowerCase()+' podría tener varios.'],[`Solo C.Alt(${fk})`,false,'Falta VNN: "exactamente uno" es obligatorio.'],['Una tabla intermedia',false,'En 1:1 se evita.']]), truco:'1:1 = FK + UNIQUE.'};
  }
  const must = Math.random() < .55;
  const frase = must ? `Todo ${h.toLowerCase()} pertenece siempre a un único ${p.toLowerCase()}` : `Un ${h.toLowerCase()} puede no tener ${p.toLowerCase()} (y como mucho tiene uno)`;
  return {id:'gen-map', topic:'tab', type:'choice', gen:true, title:'Generado: ¿dónde va la FK?', q:`${frase}; un ${p.toLowerCase()} ${v} varios ${h.toLowerCase()}s. ¿Cómo queda?`,
    opts:shuffle([[`C.Aj(${fk}) en ${h.toUpperCase()} con VNN`,must, must?'Es 1:N y obligatorio: FK en el lado N y no admite NULL.':'El enunciado dice "puede no tener": la FK debe admitir NULL.'],[`C.Aj(${fk}) en ${h.toUpperCase()} sin VNN (admite NULL)`,!must, !must?'1:N opcional: FK en el lado N que admite NULL.':'Dice "siempre": la FK no puede ser NULL.'],[`C.Aj en ${p.toUpperCase()} apuntando a ${h.toUpperCase()}`,false,`Un ${p.toLowerCase()} tiene varios ${h.toLowerCase()}s: no caben en una columna.`],['Tabla intermedia',false,'Una 1:N no necesita tabla intermedia.']]), truco:'FK a los muchos. ¿Puede existir sin…? → decide el VNN.'};
}

// ---------- rondas ----------
let run = null; // {list, i, right, xp, mode, fails:[], parts}
function failIds(){ return Object.keys(save.fails); }
function buildRound(topic, n=10){
  const recent = new Set(save.recent.slice(-40));
  const pool = (topic ? qsOf(topic) : ALL().filter(q => unitById(q.topic).exam || Math.random()<.35));
  const fresh_ = shuffle(pool.filter(q => !recent.has(q.id))), old = shuffle(pool.filter(q => recent.has(q.id)));
  let list = [...fresh_, ...old];
  // mezcla de tipos: como mucho 1 DDL y 2 cuadrículas por ronda (son largas)
  const out = []; let ddl=0, keys=0, long=0;
  for(const q of list){ if(out.length>=n) break; if(q.type==='ddl'){ if(ddl>=1) continue; ddl++; } if(q.type==='keys'){ if(keys>=2) continue; keys++; } if(['ddlw','attrs','ents','assert'].includes(q.type)){ if(long>=1) continue; long++; } out.push(q); }
  if(!topic || topic==='tab'){ out.splice(Math.min(out.length, 3), 0, genMap()); if(out.length>n) out.pop(); }
  save.recent = [...save.recent, ...out.map(q=>q.id)].slice(-60); persist();
  return shuffle(out);
}
let pendingPlan = null;
function start(list, mode, title){ run = {plan:pendingPlan, list, i:0, right:0, score:0, xp:0, mode, title, fails:[], parts:{1:[0,0],2:[0,0],3:[0,0],4:[0,0]}}; pendingPlan = null; task(); }
function campaign(topic){ start(buildRound(topic), 'ronda', topic ? unitById(topic).name : 'Ronda mixta'); }
function review(){
  const ids = failIds();
  if(!ids.length){ view(`<div class="crumb"><button class="ghost" onclick="BQA.home()">← Inicio</button></div><section class="hero"><h1>♻ Sin fallos pendientes</h1><p>Cada pregunta que falles se guarda aquí hasta que la aciertes <b>2 veces seguidas</b>.</p><div class="row"><button class="primary" onclick="BQA.campaign('')">⚔ Ronda mixta</button><button onclick="BQA.exam()">📝 Examen de prueba</button></div></section>`); return; }
  const list = shuffle(ids).slice(0,10).map(id => id==='gen-map' ? genMap() : byId(id)).filter(Boolean);
  start(list, 'repaso', 'Repaso de fallos');
}
function partOf(q){ return T2.partOf(q) || (q.type==='card' || q.topic==='er' ? 1 : (q.type==='keys' || q.topic==='tab') ? 2 : q.topic==='dml' ? 4 : 3); }
function caseParts(c){
  const cq = (t, f) => CASEQ.filter(q => q.type===t && q.cs && q.cs.id===c.id && (!f || f(q)));
  const p1 = [byId(`ents:${c.id}`), ...c.rels.map((r,i) => byId(`card:${c.id}:${i}`)), ...cq('choice', q => q.id.startsWith('dec:'))];
  const att = cq('attrs'); if(att.length) p1.splice(1, 0, pick(att));
  const keyTables = cq('keys').sort((a,b) => c.tables.indexOf(a.table)-c.tables.indexOf(b.table));
  const p2 = [...shuffle(keyTables).slice(0,3).sort((a,b) => c.tables.indexOf(a.table)-c.tables.indexOf(b.table)), byId(`assert:${c.id}`)];
  const p3 = [byId(`ddl:${c.id}`), byId(`ddlw:${c.id}`)];
  const p4 = [...shuffle(D.DMLR).slice(0,5).map(t => byId('dmlr:'+t.id)), byId('dmlw:'+pick(D.DMLW).id)];
  return {1:p1, 2:p2, 3:p3, 4:p4, keyTables};
}
function exam(caseId){
  const c = caseId ? caseById(caseId) : pick(D.CASES), P = caseParts(c);
  start([...P[1], ...P[2], ...P[3], ...P[4]], 'examen', `Examen · ${c.name}`);
  run.caseRef = c;
}
function casePart(caseId, part){
  const c = caseById(caseId), P = caseParts(c);
  const list = part===2 ? [...P.keyTables, ...P[2].slice(-1)] : part===1 ? [P[1][0], ...CASEQ.filter(q => q.type==='attrs' && q.cs.id===c.id), ...P[1].slice(1)] : P[part];
  start(list, 'parte', `${c.name} · Parte ${part}`); run.caseRef = c;
}
function practice(kind){
  const names = {dmlr:'DML · revisar errores', dmlw:'DML · desde cero', ddlw:'DDL · desde cero', ddl:'DDL · validar y explicar'};
  const n = kind==='dmlr' ? 5 : 6;
  start(shuffle(ALL().filter(q => q.type===kind)).slice(0,n), 'ronda', names[kind]);
}

// ---------- pintar cada tarea ----------
let st = {}; // estado de la pregunta actual
function rulesBox(c, open){ if(open && run && run.i>0 && run.list[run.i-1] && run.list[run.i-1].cs===c) open=false; return `<details class="rules" ${open?'open':''}><summary>📄 Enunciado: ${esc(c.name)} (toca para ${open?'ocultar':'ver'})</summary><ol>${c.rules.map(r=>`<li>${r}</li>`).join('')}</ol></details>`; }
function task(){
  const q = run.list[run.i]; st = {q, answered:false};
  const u = unitById(q.topic);
  let body = '';
  if(q.type==='choice' || q.type==='multi'){
    st.opts = q.gen ? q.opts : shuffle(q.opts); st.sel = new Set();
    body = `${q.code?`<pre class="code">${esc(q.code)}</pre>`:''}${q.cs?rulesBox(q.cs,true):''}<p class="hint">${q.type==='multi'?'Marca <b>todas</b> las correctas y pulsa Comprobar.':'Elige una.'}</p><div class="opts">${st.opts.map((o,i)=>`<button class="opt" data-i="${i}" onclick="BQA.opt(${i})">${esc(o[0])}</button>`).join('')}</div>`;
  } else if(q.type==='match'){
    st.left = q.pairs.map(p=>p[0]); st.right = shuffle(q.pairs.map(p=>p[1])); st.asg = {};
    body = `<p class="hint">${esc(q.prompt)} Elige en cada desplegable.</p><div class="match">${st.left.map((l,i)=>`<label><span>${esc(l)}</span><select data-i="${i}" onchange="BQA.asg(${i},this.value)"><option value="">—</option>${st.right.map(r=>`<option>${esc(r)}</option>`).join('')}</select></label>`).join('')}</div>`;
  } else if(q.type==='order'){
    st.items = shuffle(q.steps); if(st.items.join()===q.steps.join()) st.items.reverse();
    body = `<p class="hint">Usa ▲ ▼ para ordenar.</p><ol class="order" id="orderList"></ol>`;
  } else if(q.type==='short'){
    body = `${q.code?`<pre class="code">${esc(q.code)}</pre>`:''}<textarea id="shortIn" rows="4" placeholder="Escribe tu respuesta como en el examen…"></textarea><p class="small">Se corrige buscando las ideas clave. Si al ver la respuesta modelo la tuya estaba bien dicha con otras palabras, márcala como buena.</p>`;
  } else if(T2.has(q.type)){
    body = T2.render(q);
  } else if(q.type==='keys'){
    const t = q.table, others = q.cs.tables.map(x=>x.name);
    body = `${rulesBox(q.cs, run.mode!=='examen' || run.list[run.i-1]?.type!=='keys')}<p class="hint">Tabla <b>${esc(t.name)}</b> = ${t.cols.map(c=>esc(c[0])).join(' + ')}<br>Marca en cada columna si es CP, C.Alt, C.Aj (y a qué tabla) y VNN. La sintaxis no cuenta: cuentan las claves.</p>
      <div class="tblwrap"><table class="keys"><thead><tr><th>Columna</th><th>CP</th><th>C.Alt</th><th>C.Aj →</th><th>VNN</th></tr></thead><tbody>${t.cols.map((c,i)=>`<tr data-i="${i}"><td><code>${esc(c[0])}</code></td><td><input type="checkbox" class="kcp"></td><td><input type="checkbox" class="kalt"></td><td><select class="kfk"><option value="">—</option>${others.filter(o=>o!==t.name || t.cols.some(x=>x[2]===t.name)).map(o=>`<option>${o}</option>`).join('')}</select></td><td><input type="checkbox" class="kvnn"></td></tr>`).join('')}</tbody></table></div><p class="small">Las columnas de la CP ya son no nulas: su VNN no se corrige.</p>`;
  } else if(q.type==='ddl'){
    st.lines = parseDDL(q.cs.ddl); st.marked = new Set();
    const nErr = Object.keys(q.cs.errors).length;
    body = `${rulesBox(q.cs, true)}<p class="hint">Este script tiene <b>${nErr} errores</b> respecto al enunciado. <b>Toca cada línea mal</b> y escribe <b>por qué</b> está mal, como en el campo libre del examen. Si el error es algo que <b>falta</b>, marca la línea donde debería estar.</p><div class="ddl" id="ddl">${st.lines.map((l,i)=>`<div class="dl" data-i="${i}"><button class="ln" onclick="BQA.mark(${i})"><span class="num">${i+1}</span><code>${esc(l.text)||'&nbsp;'}</code></button><div class="why hidden"><textarea rows="2" placeholder="¿Por qué está mal la línea ${i+1}?"></textarea></div></div>`).join('')}</div><p class="small" id="markCount">Líneas marcadas: 0 de ${nErr}</p>`;
  }
  const progress = `${run.i+1}/${run.list.length}`;
  view(`<div class="crumb"><button class="ghost" onclick="BQA.quit()">✕ Salir</button><span class="small">${esc(run.title)} · ${progress} · aciertos ${run.right}</span></div>
   <section class="qcard"><div class="qhead"><span class="tag">${u.icon} ${esc(u.name)}${run.mode==='examen'?` · PARTE ${partOf(q)}`:''}</span><span class="tag ghosttag">${({...T2.LABEL,choice:'TEST',multi:'VARIAS',match:'UNIR',order:'ORDENAR',short:'ESCRIBE',card:'(MIN,MAX)',keys:'CLAVES',ddl:'CAMPO LIBRE'})[q.type]}</span></div>
   <h2>${esc(q.title)}</h2>${q.q?`<p class="q">${esc(q.q)}</p>`:''}${body}
   <div id="fb"></div><div class="row"><button class="primary" id="go" onclick="BQA.check()">Comprobar</button></div></section>`);
  if(q.type==='order') drawOrder();
  if(q.type==='short') $('shortIn').focus();
  if(q.type==='ddlw') $('ddlIn').focus();
}
function parseDDL(src){
  return src.split('\n').map(raw => { const errs=[], alts=[]; const text = raw.replace(/\s*⟦(e\d+)(~?)⟧/g, (_,e,t)=>{ (t?alts:errs).push(e); return ''; }).replace(/\s+$/,''); return {text, errs, alts}; });
}
function drawOrder(){
  $('orderList').innerHTML = st.items.map((s,i)=>`<li><span>${esc(s)}</span><span class="ob"><button onclick="BQA.mv(${i},-1)" ${i===0?'disabled':''}>▲</button><button onclick="BQA.mv(${i},1)" ${i===st.items.length-1?'disabled':''}>▼</button></span></li>`).join('');
}

// ---------- corrección ----------
function check(){
  if(st.answered) return next();
  const q = st.q; let ok=false, score=0, fb='';
  if(q.type==='choice' || q.type==='multi'){
    if(!st.sel.size) return flash('Elige una opción.');
    const good = st.opts.map((o,i)=>o[1]?i:-1).filter(i=>i>=0);
    ok = good.length===st.sel.size && good.every(i=>st.sel.has(i)); score = ok?1:0;
    document.querySelectorAll('.opt').forEach(b => { const i=+b.dataset.i, o=st.opts[i]; b.disabled=true; b.classList.add(o[1]?'good':(st.sel.has(i)?'bad':'dim')); b.innerHTML = `${esc(o[0])}<small>${esc(o[2])}</small>`; });
  } else if(q.type==='match'){
    const res = st.left.map((l,i)=> st.asg[i] === q.pairs[i][1]);
    ok = res.every(Boolean); score = res.filter(Boolean).length/res.length;
    document.querySelectorAll('.match label').forEach((lab,i)=>{ lab.classList.add(res[i]?'good':'bad'); lab.querySelector('select').disabled=true; if(!res[i]) lab.insertAdjacentHTML('beforeend',`<small>→ ${esc(q.pairs[i][1])}. ${esc(q.pairs[i][2])}</small>`); });
  } else if(q.type==='order'){
    const res = st.items.map((s,i)=> s===q.steps[i]); ok = res.every(Boolean); score = res.filter(Boolean).length/res.length;
    $('orderList').innerHTML = q.steps.map((s,i)=>`<li class="${res[i]?'good':'bad'}"><span>${i+1}. ${esc(s)}</span>${res[i]?'':`<small>Tú lo pusiste aquí: ${esc(st.items[i])}</small>`}</li>`).join('');
    fb = `<p>${esc(q.why)}</p>`;
  } else if(q.type==='short'){
    const txt = $('shortIn').value; if(!txt.trim()) return flash('Escribe algo antes de comprobar.');
    const hits = groupsHit(txt, q.groups); ok = hits.every(Boolean); score = hits.filter(Boolean).length/hits.length; $('shortIn').disabled = true;
    fb = `<p><b>Respuesta modelo:</b> ${esc(q.model)}</p>${ok?'':`<p>${esc(q.why)}</p>`}`;
  } else if(T2.has(q.type)){
    const r = T2.check(q); if(r.flash) return flash(r.flash); ok=r.ok; score=r.score; fb=r.fb||'';
  } else if(q.type==='keys'){
    const t = q.table; let total=0, good=0; const rows = document.querySelectorAll('.keys tbody tr');
    t.cols.forEach((c,i) => { const tr = rows[i], f = c[1]||'', fk = c[2]||'';
      const cells = [['.kcp', /P/.test(f)], ['.kalt', /A/.test(f)]];
      cells.forEach(([sel, exp]) => { const el = tr.querySelector(sel); total++; const g = el.checked===exp; if(g) good++; el.parentNode.classList.add(g?'good':'bad'); el.disabled=true; });
      const s = tr.querySelector('.kfk'); total++; const gfk = s.value===fk; if(gfk) good++; s.parentNode.classList.add(gfk?'good':'bad'); s.disabled=true; if(!gfk) s.insertAdjacentHTML('afterend',`<small>${fk||'ninguna'}</small>`);
      const vn = tr.querySelector('.kvnn'); vn.disabled=true;
      if(/P/.test(f) || !/[Vo]/.test(f)) vn.parentNode.classList.add('na');
      else { total++; const exp = /V/.test(f); const g = vn.checked===exp; if(g) good++; vn.parentNode.classList.add(g?'good':'bad'); }
    });
    score = good/total; ok = good===total;
    fb = `<p><b>Marco correcto:</b></p><pre class="code">${esc(marco(t,q.cs))}</pre>${t.note?`<p>${esc(t.note)}</p>`:''}<p class="small">Gris = el enunciado no dice si es obligatorio, no se corrige.</p>`;
  } else if(q.type==='ddl'){
    const res = gradeDDL(q); score = res.score; ok = res.ok; fb = res.html;
  }
  st.answered = true; st.ok = ok; st.score = score;
  record(q, ok, score);
  const truco = q.truco ? `<div class="truco">💡 <b>Truco:</b> ${esc(q.truco)}</div>` : '';
  const selfFix = (!ok && (q.type==='short' || q.type==='ddl' || q.type==='dmlr')) ? `<button class="ghost" onclick="BQA.selfOk()">✔ Lo había dicho bien con otras palabras</button>` : '';
  $('fb').innerHTML = `<div class="feedback ${ok?'ok':'ko'}"><h3>${ok?'✔ ¡Correcto!':(score>0?`◐ A medias (${Math.round(score*100)} %)`:'✘ No')}</h3>${fb}${truco}${selfFix}</div>`;
  $('go').textContent = run.i+1 < run.list.length ? 'Siguiente →' : 'Ver resultado';
  $('fb').scrollIntoView({behavior:'smooth', block:'nearest'});
}
function marco(t, cs){
  const L = [`${t.name} = ${t.cols.map(c=>c[0]).join(' + ')}`, `CP(${t.cols.filter(c=>/P/.test(c[1])).map(c=>c[0]).join(', ')})`];
  t.cols.filter(c=>/A/.test(c[1])).forEach(c=>L.push(`C.Alt(${c[0]})`));
  t.cols.filter(c=>c[2]).forEach(c=>{ const tgt = (cs ? cs.tables : D.CASES.flatMap(x=>x.tables)).find(x=>x.name===c[2]); const pk = tgt ? tgt.cols.filter(x=>/P/.test(x[1])).map(x=>x[0]).join(', ') : 'id'; L.push(`C.Aj(${c[0]}) → ${c[2]}(${pk})`); });
  const v = t.cols.filter(c=>/V/.test(c[1]) && !/P/.test(c[1])).map(c=>`VNN(${c[0]})`); if(v.length) L.push(v.join('  '));
  return L.join('\n');
}
function gradeDDL(q){
  const E = q.cs.errors, ids = Object.keys(E); const boxes = document.querySelectorAll('#ddl .dl');
  const marked = [...st.marked];
  const textOf = i => boxes[i].querySelector('textarea').value;
  let pts = 0; const rows = [];
  const usedLines = new Set();
  for(const e of ids){
    const lines = st.lines.map((l,i)=> (l.errs.includes(e)||l.alts.includes(e)) ? i : -1).filter(i=>i>=0);
    const primary = st.lines.findIndex(l=>l.errs.includes(e));
    const found = lines.filter(i => st.marked.has(i));
    found.forEach(i=>usedLines.add(i));
    const why = found.map(textOf).join(' ');
    const reasonOk = found.length>0 && groupsHit(why, E[e].why).every(Boolean);
    pts += (found.length?0.5:0) + (reasonOk?0.5:0);
    rows.push(`<li class="${reasonOk?'good':found.length?'half':'bad'}"><b>Línea ${primary+1}</b> ${found.length?(reasonOk?'✔ encontrada y bien explicada':'◐ encontrada, pero el porqué no tiene la idea clave'):'✘ no la marcaste'}<br>${E[e].model}</li>`);
    boxes[primary].classList.add(found.length?'found':'missed');
  }
  const falsos = marked.filter(i=>!usedLines.has(i));
  falsos.forEach(i=>boxes[i].classList.add('falso'));
  boxes.forEach(b=>{ b.querySelector('.ln').disabled=true; const ta=b.querySelector('textarea'); if(ta) ta.disabled=true; });
  const score = Math.max(0, (pts - falsos.length*0.25)/ids.length);
  return {score, ok: pts===ids.length && !falsos.length,
    html:`<ol class="errs">${rows.join('')}</ol>${falsos.length?`<p>⚠ Marcaste ${falsos.length} línea(s) que estaban bien: ${falsos.map(i=>i+1).join(', ')} (cada una resta un poco, como en un examen).</p>`:''}<p class="small">Para el campo libre: di <b>qué</b> está mal, <b>qué regla</b> del enunciado lo pide y <b>cómo</b> sería correcto.</p>`};
}
function record(q, ok, score){
  const u = save.unit[q.topic] ||= {done:0, right:0}; u.done++; if(ok) u.right++;
  save.done++; if(ok){ save.right++; save.streak++; save.best = Math.max(save.best, save.streak); } else save.streak = 0;
  const gain = Math.round((ok?20:8*score) + (q.type==='ddl'?20*score:0) + (['ddlw','dmlr','dmlw'].includes(q.type)?15*score:0) + (q.type==='keys'?10*score:0));
  save.xp += gain; run.xp += gain; run.score += score; if(ok) run.right++;
  if(run.mode==='examen'){ const p = run.parts[partOf(q)]; p[0]+=score; p[1]++; }
  const f = save.fails[q.id];
  if(!ok){ save.fails[q.id] = {n:0}; run.fails.push(q); }
  else if(f){ f.n++; if(f.n>=2) delete save.fails[q.id]; }
  persist();
}
function selfOk(){
  const q = st.q; if(st.ok) return; st.ok = true; run.right++; save.right++; save.streak++;
  const u = save.unit[q.topic]; if(u) u.right++;
  const f = save.fails[q.id]; if(f){ f.n++; if(f.n>=2) delete save.fails[q.id]; }
  run.fails = run.fails.filter(x=>x!==q);
  if(run.mode==='examen'){ const p = run.parts[partOf(q)]; p[0] += 1-st.score; }
  run.score += 1-st.score; st.score = 1; persist();
  document.querySelector('.feedback h3').textContent = '✔ Marcada como correcta'; document.querySelector('.feedback').className='feedback ok';
  document.querySelector('.feedback button.ghost')?.remove();
}
function next(){ run.i++; if(run.i < run.list.length) task(); else end(); }
function end(){
  const n = run.list.length, pct = Math.round(run.score/n*100);
  const planDone = run.plan!=null && pct>=0; if(planDone){ save.plan[run.plan]=true; persist(); }
  let extra = '';
  if(run.mode==='examen'){
    const p = [1,2,3,4].map(k => run.parts[k][1] ? Math.round(run.parts[k][0]/run.parts[k][1]*100) : 0);
    save.exams.push({date:new Date().toLocaleDateString('es-ES'), name:run.caseRef.name, total:pct, p}); save.exams = save.exams.slice(-20); persist();
    extra = `<div class="parts">${['E/R','Paso a tablas','DDL','DML'].map((t,i)=>`<div class="part"><b>Parte ${i+1}</b><span>${t}</span><strong>${p[i]}%</strong><i style="width:${p[i]}%"></i></div>`).join('')}</div>`;
  }
  const fig = run.caseRef ? `<details class="rules"><summary>🖼 Así queda el E/R de «${esc(run.caseRef.name)}» (para comparar con tu dibujo)</summary>${run.caseRef.img ? `<img src="${run.caseRef.img}" alt="E/R" style="max-width:100%;background:#fff">` : T2.erSvg(run.caseRef)}<p class="small">Dibujo simplificado (sin atributos): par (min,max) pegado a cada entidad.</p></details>` : '';
  const fails = run.fails.length ? `<h3>Para repasar (ya están en ♻ Repasar fallos)</h3><ul class="flist">${run.fails.map(q=>`<li><b>${esc(q.title)}</b><br><span class="small">💡 ${esc(q.truco||'')}</span></li>`).join('')}</ul>` : '<p>¡Sin fallos en esta ronda!</p>';
  view(`<section class="hero"><h1>${pct>=80?'🏆':pct>=50?'👍':'📚'} ${esc(run.title)}</h1><p>Nota: <b>${pct}%</b> · ${run.right}/${n} perfectas · +${run.xp} XP</p>${extra}${fig}${fails}${planDone?'<p class="small">✔ Paso del plan hecho. 💧 Respira un minuto antes del siguiente.</p>':''}<div class="row big"><button class="primary" onclick="BQA.home()">${planDone?'Siguiente paso →':'Inicio'}</button>${failIds().length?'<button onclick="BQA.review()">♻ Repasar fallos</button>':''}<button onclick="BQA.exam()">📝 Otro examen</button></div></section>`);
}
function flash(msg){ $('fb').innerHTML = `<div class="feedback ko"><p>${esc(msg)}</p></div>`; }

// ---------- chuleta y progreso ----------
function cheats(){
  const html = UNITS.map(u => `<section class="block"><h3>${u.icon} ${esc(u.name)}${u.exam?' <span class="tag">EXAMEN</span>':''}</h3><ul class="cheat">${u.blocks.map(b=>`<li><b>${esc(b.t)}:</b> ${esc(b.k)}</li>`).join('')}</ul></section>`).join('');
  view(`<div class="crumb"><button class="ghost" onclick="BQA.home()">← Inicio</button><button class="ghost" onclick="window.print()">🖨 Imprimir</button></div><section class="hero"><h1>🧠 Chuleta de trucos</h1><p>Un truco por cada bloque de teoría. Imprímela o léela el día antes.</p></section>
  <section class="block warn"><h3>⚠ Dónde va el (min,max)</h3><p>En los <b>dibujos de la web</b> el par va pegado a la entidad que se cuenta: Departamento —(1,1)— tiene —(1,N)— Empleado = "un departamento tiene de 1 a N empleados; cada empleado, exactamente 1 departamento". Es la convención de clase (dibujos, lógico y SQL de clase). Solo el párrafo «Lectura correcta» de conceptual 4.4 lo escribe al revés: no lo sigas. <b>En el examen escribe la frase al lado de cada par.</b></p></section>${html}`);
}
function progress(){
  const rows = UNITS.map(u => { const s = save.unit[u.id]||{done:0,right:0}; const p = s.done?Math.round(s.right/s.done*100):0; return `<tr><td>${u.icon} ${esc(u.name)}</td><td>${s.done}</td><td>${s.right}</td><td><div class="bar"><i style="width:${p}%"></i></div>${s.done?p+'%':'—'}</td></tr>`; }).join('');
  view(`<div class="crumb"><button class="ghost" onclick="BQA.home()">← Inicio</button></div><section class="hero"><h1>▤ Progreso</h1><p>Nivel ${level()} · ${save.xp} XP · ${save.right}/${save.done} aciertos · mejor racha ${save.best} · fallos pendientes ${failIds().length}</p>
  <div class="tblwrap"><table class="prog"><thead><tr><th>Tema</th><th>Hechas</th><th>Bien</th><th>Dominio</th></tr></thead><tbody>${rows}</tbody></table></div>
  <p class="small">El progreso se guarda en este navegador. Si abres el archivo en otro móvil u ordenador, empieza de cero.</p><div class="row"><button class="danger" onclick="BQA.reset()">Borrar progreso</button></div></section>`);
}
function reset(){ if(confirm('¿Borrar todo el progreso y los fallos guardados?')){ save = fresh(); persist(); home(); } }

// ---------- API para los botones ----------
window.BQA = {
  paper:paperHome, paperList, paperOpen, paperHint, paperCorrect, paperTick, paperAll, paperNext, paperExam, paperPrint,
  home, planGo, pomo:pomoToggle, planSkip(i){ save.plan[i]=true; persist(); home(); }, unit:unitView, campaign, review, exam, casePart, cheats, progress, reset, check, selfOk,
  quit(){ if(!run || confirm('¿Salir? Lo contestado ya cuenta para el progreso.')) home(); },
  opt(i){ if(st.answered) return; if(st.q.type==='multi'){ st.sel.has(i)?st.sel.delete(i):st.sel.add(i); } else { st.sel = new Set([i]); }
    document.querySelectorAll('.opt').forEach(b=>b.classList.toggle('on', st.sel.has(+b.dataset.i))); if(st.q.type==='choice') check(); },
  asg(i,v){ st.asg[i]=v; },
  tog(i){ if(st.answered) return; st.sel.has(i)?st.sel.delete(i):st.sel.add(i); document.querySelectorAll('.opt').forEach(b=>b.classList.toggle('on', st.sel.has(+b.dataset.i))); },
  ddlLevel(v){ st.level=v; const ta=$('ddlIn'); if(ta) st.typed=ta.value; $('marcoBox').textContent = st.subset.map(t => marcoLine(t, v==='marco')).join('\n\n'); },
  dmlHint(){ const t=st.q.t, hs=t.hints||[]; if(st.hint<hs.length) st.hint++; $('dmlHints').innerHTML = hs.slice(0,st.hint).map((h,i)=>`<div class="hint">💡 ${i+1}. ${esc(h)}</div>`).join(''); $('dmlHintBtn').textContent=`💡 Pista (${st.hint}/${hs.length})`; },
  dmlSkel(){ $('dmlHints').insertAdjacentHTML('beforeend', `<pre class="code">${esc(st.q.t.skeleton)}</pre>`); },
  practice,
  mv(i,d){ const j=i+d; [st.items[i],st.items[j]]=[st.items[j],st.items[i]]; drawOrder(); },
  mark(i){ if(st.answered) return; const box = document.querySelectorAll('#ddl .dl')[i];
    if(st.marked.has(i)){ st.marked.delete(i); box.classList.remove('on'); box.querySelector('.why').classList.add('hidden'); }
    else { st.marked.add(i); box.classList.add('on'); box.querySelector('.why').classList.remove('hidden'); box.querySelector('textarea').focus(); }
    $('markCount').textContent = `Líneas marcadas: ${st.marked.size} de ${Object.keys(st.q.cs.errors).length}`; }
};
document.addEventListener('keydown', e => { if(e.key==='Enter' && (e.ctrlKey || e.metaKey) && st.q){ e.preventDefault(); check(); } });
home();
})();
