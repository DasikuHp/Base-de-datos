// BDA-QUEST · verificador SQL propio (sin dependencias).
//   - tokenize / parseScript: lee CREATE TABLE, ALTER TABLE, INSERT... y construye el esquema.
//   - validateSchema: errores que MySQL daría de verdad (PK doble, FK a tabla que aún no existe...).
//   - gradeSchema: compara el DDL del alumno con el marco esperado (claves, NOT NULL, UNIQUE, FK).
//   - parseAssertion: corrige aserciones tipo  A[x] ⊆ B[y].
// El motor de consultas (SELECT/UPDATE/DELETE/INSERT) está en sqlengine.js.
(function (root) {
'use strict';
const BQ = root.BQ = root.BQ || {};
const SQL = BQ.SQL = BQ.SQL || {};

class SqlError extends Error { constructor(msg, pos){ super(msg); this.pos = pos; } }
SQL.SqlError = SqlError;

// ---------- normalización ----------
const lc = s => String(s).toLowerCase();
SQL.fold = s => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// ---------- tokenizador ----------
// Tipos: w (palabra), q (identificador entre comillas inversas), s (cadena), n (número), p (símbolo)
function tokenize(src) {
  const out = []; let i = 0; const n = src.length;
  while (i < n) {
    const c = src[i];
    if (/\s/.test(c)) { i++; continue; }
    if (c === '#' || (c === '-' && src[i+1] === '-' && (i+2 >= n || /\s/.test(src[i+2])))) { while (i < n && src[i] !== '\n') i++; continue; }
    if (c === '/' && src[i+1] === '*') { const e = src.indexOf('*/', i+2); if (e < 0) throw new SqlError('Comentario /* sin cerrar', i); i = e + 2; continue; }
    if (c === "'" || c === '"') {
      let j = i + 1, v = '';
      for (;;) {
        if (j >= n) throw new SqlError('Cadena de texto sin cerrar (falta la comilla ' + c + ')', i);
        const d = src[j];
        if (d === '\\' && j + 1 < n) { const e = src[j+1]; v += e === 'n' ? '\n' : e === 't' ? '\t' : e; j += 2; continue; }
        if (d === c) { if (src[j+1] === c) { v += c; j += 2; continue; } break; }
        v += d; j++;
      }
      out.push({t: 's', v, pos: i, q: c}); i = j + 1; continue;
    }
    if (c === '`') { const e = src.indexOf('`', i+1); if (e < 0) throw new SqlError('Falta cerrar una comilla inversa `', i); out.push({t: 'q', v: src.slice(i+1, e), pos: i}); i = e + 1; continue; }
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[i+1] || ''))) {
      const m = /^(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/.exec(src.slice(i));
      out.push({t: 'n', v: m[0], pos: i}); i += m[0].length; continue;
    }
    if (/[A-Za-z_À-ɏ$]/.test(c)) {
      let j = i + 1; while (j < n && /[A-Za-z0-9_À-ɏ$]/.test(src[j])) j++;
      const v = src.slice(i, j); out.push({t: 'w', v, u: v.toUpperCase(), pos: i}); i = j; continue;
    }
    const two = src.substr(i, 3) === '<=>' ? '<=>' : src.substr(i, 2);
    if (['<=', '>=', '<>', '!=', ':=', '||', '&&'].includes(two)) { out.push({t: 'p', v: two === '!=' ? '<>' : two, pos: i}); i += 2; continue; }
    if (two === '<=>') { out.push({t: 'p', v: '<=>', pos: i}); i += 3; continue; }
    if ('(),;=<>+-*/%.@^~!&|'.includes(c)) { out.push({t: 'p', v: c, pos: i}); i++; continue; }
    throw new SqlError("Carácter no válido en SQL: '" + c + "'", i);
  }
  return out;
}
SQL.tokenize = tokenize;
const tokText = t => t ? (t.t === 's' ? "'" + t.v + "'" : t.v) : 'el final de la sentencia';

// separa por ';' de nivel superior (los tokens ya no llevan cadenas con ';')
function splitStatements(tokens) {
  const out = []; let cur = [];
  for (const t of tokens) { if (t.t === 'p' && t.v === ';') { if (cur.length) out.push(cur); cur = []; } else cur.push(t); }
  if (cur.length) out.push(cur);
  return out;
}
SQL.splitStatements = splitStatements;

// ---------- lector de tokens ----------
class Rd {
  constructor(toks) { this.t = toks; this.i = 0; }
  get done() { return this.i >= this.t.length; }
  peek(k = 0) { return this.t[this.i + k]; }
  next() { return this.t[this.i++]; }
  isW(u, k = 0) { const x = this.t[this.i + k]; return !!x && x.t === 'w' && x.u === u; }
  isP(v, k = 0) { const x = this.t[this.i + k]; return !!x && x.t === 'p' && x.v === v; }
  eatW(u) { if (this.isW(u)) { this.i++; return true; } return false; }
  eatP(v) { if (this.isP(v)) { this.i++; return true; } return false; }
  expectP(v, ctx) { if (!this.eatP(v)) throw new SqlError(`Se esperaba '${v}'${ctx ? ' ' + ctx : ''} y aparece ${tokText(this.peek())}`, this.peek()?.pos); }
  expectW(u, ctx) { if (!this.eatW(u)) throw new SqlError(`Se esperaba ${u}${ctx ? ' ' + ctx : ''} y aparece ${tokText(this.peek())}`, this.peek()?.pos); }
  ident(ctx) { const x = this.next(); if (!x || (x.t !== 'w' && x.t !== 'q')) throw new SqlError(`Se esperaba un nombre${ctx ? ' ' + ctx : ''} y aparece ${tokText(x)}`, x?.pos); return x.v; }
}
SQL.Rd = Rd;

// ---------- tipos ----------
function typeFamily(name) {
  const u = String(name).toUpperCase();
  if (/^(TINYINT|SMALLINT|MEDIUMINT|INT|INTEGER|BIGINT|SERIAL|BOOL|BOOLEAN|BIT)$/.test(u)) return 'int';
  if (/^(DECIMAL|NUMERIC|DEC|FIXED|FLOAT|DOUBLE|REAL)$/.test(u)) return 'dec';
  if (/^(CHAR|VARCHAR|TINYTEXT|TEXT|MEDIUMTEXT|LONGTEXT|ENUM|SET|NCHAR|NVARCHAR|CHARACTER)$/.test(u)) return 'str';
  if (/^(DATE)$/.test(u)) return 'date';
  if (/^(DATETIME|TIMESTAMP)$/.test(u)) return 'datetime';
  if (/^(TIME|YEAR)$/.test(u)) return 'time';
  if (/^(BLOB|TINYBLOB|MEDIUMBLOB|LONGBLOB|BINARY|VARBINARY|JSON)$/.test(u)) return 'bin';
  return null;
}
SQL.typeFamily = typeFamily;
const KNOWN_TYPES = /^(TINYINT|SMALLINT|MEDIUMINT|INT|INTEGER|BIGINT|SERIAL|BOOL|BOOLEAN|BIT|DECIMAL|NUMERIC|DEC|FIXED|FLOAT|DOUBLE|REAL|CHAR|VARCHAR|TINYTEXT|TEXT|MEDIUMTEXT|LONGTEXT|ENUM|SET|NCHAR|NVARCHAR|CHARACTER|DATE|DATETIME|TIMESTAMP|TIME|YEAR|BLOB|TINYBLOB|MEDIUMBLOB|LONGBLOB|BINARY|VARBINARY|JSON)$/;
const compat = (a, b) => a === b || (['int', 'dec'].includes(a) && ['int', 'dec'].includes(b)) || (['date', 'datetime'].includes(a) && ['date', 'datetime'].includes(b));

// ---------- modelo ----------
function newDb() { return {tables: {}, order: [], dbName: null, issues: [], events: []}; }
SQL.newDb = newDb;
const key = s => lc(s);

function readColList(p, ctx) {
  p.expectP('(', ctx); const cols = [];
  for (;;) {
    cols.push(p.ident('en la lista de columnas'));
    if (p.eatP('(')) { while (!p.isP(')') && !p.done) p.next(); p.expectP(')'); }  // longitud de prefijo
    if (p.isW('ASC') || p.isW('DESC')) p.next();
    if (p.eatP(',')) continue; break;
  }
  p.expectP(')', 'al cerrar la lista de columnas'); return cols;
}
function readRefActions(p, fk) {
  for (;;) {
    if (p.isW('ON') && (p.isW('DELETE', 1) || p.isW('UPDATE', 1))) {
      p.next(); const which = p.next().u; let act = p.next();
      let a = act && act.u;
      if (a === 'SET') { a = 'SET ' + p.next().u; } else if (a === 'NO') { a = 'NO ACTION'; p.next(); }
      if (which === 'DELETE') fk.onDelete = a; else fk.onUpdate = a;
    } else if (p.isW('MATCH')) { p.next(); p.next(); }
    else break;
  }
}
function readReferences(p) {
  p.expectW('REFERENCES'); let ref = p.ident('tras REFERENCES');
  if (p.eatP('.')) ref = p.ident();
  let refCols = null;
  if (p.isP('(')) refCols = readColList(p, 'tras el nombre de la tabla referenciada');
  const fk = {ref, refCols, onDelete: null, onUpdate: null}; readRefActions(p, fk); return fk;
}
function skipParens(p) { // consume ( ... ) equilibrado y devuelve sus tokens
  p.expectP('('); let d = 1; const out = [];
  while (!p.done) { const x = p.next(); if (x.t === 'p' && x.v === '(') d++; if (x.t === 'p' && x.v === ')') { d--; if (!d) return out; } out.push(x); }
  throw new SqlError('Falta cerrar un paréntesis');
}

function parseColumnDef(p, tbl) {
  const name = p.ident('para la columna');
  const col = {name, type: null, family: null, len: null, enumVals: null, notNull: false, nullExplicit: false, auto: false, unique: false, pk: false, def: undefined, hasDefault: false, refs: null, checks: [], unsigned: false};
  const tt = p.peek();
  if (!tt || (tt.t !== 'w') || p.isP(',') || p.isP(')')) throw new SqlError(`A la columna '${name}' le falta el tipo de dato (INT, VARCHAR(50), DATE...)`, tt?.pos);
  if (!KNOWN_TYPES.test(tt.u)) {
    if (['PRIMARY', 'NOT', 'NULL', 'UNIQUE', 'DEFAULT', 'REFERENCES', 'AUTO_INCREMENT'].includes(tt.u)) throw new SqlError(`A la columna '${name}' le falta el tipo de dato antes de ${tt.u}`, tt.pos);
    throw new SqlError(`'${tt.v}' no es un tipo de dato válido en la columna '${name}'`, tt.pos);
  }
  p.next(); col.type = tt.u; col.family = typeFamily(tt.u);
  if (col.type === 'DOUBLE' && p.isW('PRECISION')) p.next();
  if (col.type === 'CHARACTER' && p.isW('VARYING')) p.next();
  if (p.isP('(')) {
    const inner = skipParens(p);
    if (col.type === 'ENUM' || col.type === 'SET') col.enumVals = inner.filter(x => x.t === 's').map(x => x.v);
    else { const nums = inner.filter(x => x.t === 'n').map(x => +x.v); col.len = nums[0] ?? null; col.scale = nums[1] ?? null;
      if (!nums.length) throw new SqlError(`Los paréntesis del tipo de '${name}' están vacíos`); }
  } else if ((col.type === 'VARCHAR' || col.type === 'VARBINARY')) {
    throw new SqlError(`VARCHAR necesita una longitud: '${name}' debería ser VARCHAR(n)`, p.peek()?.pos);
  }
  for (;;) {
    const x = p.peek(); if (!x || (x.t === 'p' && (x.v === ',' || x.v === ')'))) break;
    if (x.t !== 'w') throw new SqlError(`Sobra ${tokText(x)} en la definición de la columna '${name}'`, x.pos);
    const u = x.u;
    if (u === 'UNSIGNED' || u === 'ZEROFILL' || u === 'SIGNED') { p.next(); col.unsigned = u === 'UNSIGNED'; }
    else if (u === 'NOT') { p.next(); p.expectW('NULL', `tras NOT en '${name}'`); col.notNull = true; col.nullExplicit = false; }
    else if (u === 'NULL') { p.next(); col.nullExplicit = true; }
    else if (u === 'DEFAULT') { p.next(); col.hasDefault = true;
      let v = p.next(); if (!v) throw new SqlError(`Falta el valor tras DEFAULT en '${name}'`);
      if (v.t === 'p' && v.v === '(') { p.i--; skipParens(p); col.def = null; }
      else { if (v.t === 'p' && (v.v === '-' || v.v === '+')) { const w = p.next(); v = {t: 'n', v: (v.v === '-' ? '-' : '') + w.v}; }
        if (p.isP('(')) skipParens(p);   // CURRENT_TIMESTAMP(), NOW()
        col.def = v.t === 'n' ? +v.v : v.t === 's' ? v.v : (v.u === 'NULL' ? null : v.u === 'TRUE' ? 1 : v.u === 'FALSE' ? 0 : '#' + v.v); } }
    else if (u === 'AUTO_INCREMENT') { p.next(); col.auto = true; }
    else if (u === 'PRIMARY') { p.next(); p.eatW('KEY'); col.pk = true; }
    else if (u === 'KEY') { p.next(); col.pk = true; }
    else if (u === 'UNIQUE') { p.next(); p.eatW('KEY'); col.unique = true; }
    else if (u === 'REFERENCES') { col.refs = readReferences(p); }
    else if (u === 'CHECK') { p.next(); col.checks.push(skipParens(p)); p.eatW('ENFORCED'); }
    else if (u === 'COMMENT') { p.next(); p.next(); }
    else if (u === 'COLLATE') { p.next(); p.next(); }
    else if (u === 'CHARACTER') { p.next(); p.expectW('SET'); p.next(); }
    else if (u === 'CHARSET') { p.next(); p.next(); }
    else if (u === 'ON' && p.isW('UPDATE', 1)) { p.next(); p.next(); p.next(); if (p.isP('(')) skipParens(p); }
    else if (u === 'AS' || u === 'GENERATED') { throw new SqlError('Las columnas generadas no entran en este curso'); }
    else throw new SqlError(`'${x.v}' no se esperaba en la definición de la columna '${name}'. ¿Falta una coma antes?`, x.pos);
  }
  return col;
}

function applyTableConstraint(p, tbl, db) {
  let cname = null;
  if (p.eatW('CONSTRAINT')) { if (!p.isW('PRIMARY') && !p.isW('UNIQUE') && !p.isW('FOREIGN') && !p.isW('CHECK')) cname = p.ident(); }
  if (p.isW('PRIMARY')) { p.next(); p.expectW('KEY', 'tras PRIMARY'); if (p.peek() && p.peek().t === 'w' && !p.isP('(')) p.next(); const cols = readColList(p, 'tras PRIMARY KEY'); tbl.pkDecl.push(cols); return; }
  if (p.isW('UNIQUE')) { p.next(); if (!p.isP('(')) { p.eatW('KEY') || p.eatW('INDEX'); } if (!p.isP('(')) p.next(); tbl.uniques.push({cols: readColList(p, 'tras UNIQUE'), name: cname}); return; }
  if (p.isW('FOREIGN')) { p.next(); p.expectW('KEY', 'tras FOREIGN'); if (!p.isP('(')) p.next(); const cols = readColList(p, 'tras FOREIGN KEY');
    if (!p.isW('REFERENCES')) throw new SqlError('A FOREIGN KEY le falta la cláusula REFERENCES tabla(columna)', p.peek()?.pos);
    const r = readReferences(p); tbl.fks.push({cols, ref: r.ref, refCols: r.refCols, onDelete: r.onDelete, onUpdate: r.onUpdate, name: cname, at: db.order.length, stmtNo: db.events.length}); return; }
  if (p.isW('CHECK')) { p.next(); tbl.checks.push(skipParens(p)); p.eatW('ENFORCED'); return; }
  if (p.isW('KEY') || p.isW('INDEX') || p.isW('FULLTEXT')) { p.next(); if (p.peek() && p.peek().t !== 'p') p.next(); readColList(p); return; }
  throw new SqlError(`Restricción no reconocida: ${tokText(p.peek())}`, p.peek()?.pos);
}

function finishTable(tbl) {
  // PK declarada en columnas + a nivel de tabla
  const inline = tbl.cols.filter(c => c.pk).map(c => c.name);
  tbl.pkDeclCount = tbl.pkDecl.length + (inline.length ? 1 : 0) + (inline.length > 1 ? inline.length - 1 : 0);
  tbl.pk = tbl.pkDecl.length ? tbl.pkDecl[0] : inline;
  const pkset = new Set(tbl.pk.map(lc));
  tbl.cols.forEach(c => { if (pkset.has(lc(c.name))) c.pk = true; });
  // restricciones en línea -> listas
  tbl.cols.forEach(c => { if (c.unique) tbl.uniques.push({cols: [c.name], name: null, inline: true}); });
  tbl.cols.forEach(c => { if (c.refs) tbl.fks.push({cols: [c.name], ref: c.refs.ref, refCols: c.refs.refCols, onDelete: c.refs.onDelete, onUpdate: c.refs.onUpdate, name: null, inline: true, stmtNo: tbl.stmtNo, at: tbl.idx}); });
}

function parseCreateTable(p, db, stmtNo) {
  p.eatW('TEMPORARY'); p.expectW('TABLE');
  if (p.eatW('IF')) { p.expectW('NOT'); p.expectW('EXISTS'); }
  let name = p.ident('para la tabla'); if (p.eatP('.')) name = p.ident();
  if (!p.isP('(')) throw new SqlError(`Tras el nombre de la tabla '${name}' falta el paréntesis de apertura (`, p.peek()?.pos);
  p.next();
  const tbl = {name, cols: [], pk: [], pkDecl: [], uniques: [], fks: [], checks: [], stmtNo, idx: db.order.length};
  if (db.tables[key(name)]) db.issues.push({level: 'error', code: 'dup', msg: `La tabla '${name}' ya existe (MySQL: Table '${name}' already exists)`});
  let first = true;
  for (;;) {
    if (p.isP(')')) { if (first) throw new SqlError(`La tabla '${name}' no tiene ninguna columna`); throw new SqlError(`Sobra una coma antes del paréntesis de cierre en '${name}'`, p.peek().pos); }
    first = false;
    const x = p.peek();
    if (x && x.t === 'w' && ['PRIMARY', 'UNIQUE', 'FOREIGN', 'CONSTRAINT', 'CHECK', 'INDEX', 'FULLTEXT'].includes(x.u) || (x && x.t === 'w' && x.u === 'KEY' && (p.peek(1)?.t === 'q' || p.isP('(', 1) || (p.peek(1)?.t === 'w' && p.isP('(', 2))))) applyTableConstraint(p, tbl, db);
    else { const c = parseColumnDef(p, tbl); if (tbl.cols.some(k => lc(k.name) === lc(c.name))) db.issues.push({level: 'error', code: 'dupcol', msg: `La columna '${c.name}' está repetida en '${name}'`}); tbl.cols.push(c); }
    if (p.eatP(',')) continue;
    if (p.isP(')')) { p.next(); break; }
    throw new SqlError(`En la tabla '${name}' falta una coma o un paréntesis antes de ${tokText(p.peek())}`, p.peek()?.pos);
  }
  // opciones de tabla: ENGINE=..., DEFAULT CHARSET=... (se ignoran)
  while (!p.done) { const x = p.next(); if (x.t === 'p' && x.v !== '=' && x.v !== ',') throw new SqlError(`Sobra ${tokText(x)} tras cerrar la tabla '${name}'. ¿Falta el ';' o un paréntesis?`, x.pos); }
  finishTable(tbl);
  db.tables[key(name)] = tbl; db.order.push(key(name));
  return tbl;
}

function parseAlter(p, db, stmtNo) {
  p.expectW('TABLE'); let name = p.ident(); if (p.eatP('.')) name = p.ident();
  const tbl = db.tables[key(name)];
  if (!tbl) { db.issues.push({level: 'error', code: 'noTable', msg: `ALTER TABLE sobre '${name}', que no existe todavía`}); return; }
  do {
    if (p.eatW('ADD')) {
      const x = p.peek();
      if (x && x.t === 'w' && ['PRIMARY', 'UNIQUE', 'FOREIGN', 'CONSTRAINT', 'CHECK', 'INDEX', 'KEY'].includes(x.u)) {
        const before = {pk: tbl.pkDecl.length};
        applyTableConstraint(p, tbl, db);
        if (tbl.pkDecl.length > before.pk) { tbl.pkDeclCount = (tbl.pkDeclCount || 0) + 1; if (!tbl.pk.length) tbl.pk = tbl.pkDecl[tbl.pkDecl.length - 1]; else db.issues.push({level: 'error', code: 'multiPk', msg: `'${tbl.name}' ya tiene clave primaria (Multiple primary key defined)`}); }
        const f = tbl.fks[tbl.fks.length - 1]; if (f && f.stmtNo === undefined) f.stmtNo = stmtNo;
        if (f && !f.alter && tbl.fks.length) { f.alter = true; f.at = db.order.length; }
      } else {
        p.eatW('COLUMN'); const c = parseColumnDef(p, tbl);
        if (tbl.cols.some(k => lc(k.name) === lc(c.name))) db.issues.push({level: 'error', code: 'dupcol', msg: `La columna '${c.name}' ya existe en '${tbl.name}'`});
        tbl.cols.push(c);
        if (c.pk) { tbl.pk = [...tbl.pk, c.name]; }
        if (c.unique) tbl.uniques.push({cols: [c.name], name: null, inline: true});
        if (c.refs) tbl.fks.push({cols: [c.name], ref: c.refs.ref, refCols: c.refs.refCols, onDelete: c.refs.onDelete, onUpdate: c.refs.onUpdate, inline: true, alter: true, at: db.order.length, stmtNo});
      }
    } else if (p.eatW('DROP')) {
      if (p.eatW('PRIMARY')) { p.expectW('KEY'); tbl.pk = []; tbl.pkDecl = []; tbl.cols.forEach(c => c.pk = false); }
      else if (p.eatW('FOREIGN')) { p.expectW('KEY'); const n = p.ident(); tbl.fks = tbl.fks.filter(f => f.name !== n); }
      else { p.eatW('COLUMN'); const n = p.ident(); const i = tbl.cols.findIndex(c => lc(c.name) === lc(n)); if (i < 0) db.issues.push({level: 'error', code: 'noCol', msg: `No se puede borrar '${n}': esa columna no existe en '${tbl.name}'`}); else tbl.cols.splice(i, 1); }
    } else if (p.isW('MODIFY') || p.isW('CHANGE')) {
      const ch = p.next().u === 'CHANGE'; let oldName = null; if (ch) oldName = p.ident();
      p.eatW('COLUMN'); if (!ch) { /* MODIFY col def */ }
      const c = parseColumnDef(p, tbl); const i = tbl.cols.findIndex(k => lc(k.name) === lc(oldName || c.name));
      if (i < 0) db.issues.push({level: 'error', code: 'noCol', msg: `La columna '${oldName || c.name}' no existe en '${tbl.name}'`}); else { c.pk = tbl.cols[i].pk; tbl.cols[i] = c; }
    } else if (p.isW('RENAME') || p.isW('ENGINE') || p.isW('AUTO_INCREMENT')) { while (!p.done && !p.isP(',')) p.next(); }
    else throw new SqlError(`ALTER TABLE: no se entiende ${tokText(p.peek())}`, p.peek()?.pos);
  } while (p.eatP(','));
  if (!p.done) throw new SqlError(`ALTER TABLE: sobra ${tokText(p.peek())}`, p.peek().pos);
}

// Lee un script entero. Cada sentencia fallida se anota como error de sintaxis y se sigue con la siguiente.
function parseScript(src, db) {
  db = db || newDb(); let toks;
  try { toks = tokenize(src); } catch (e) { if (e instanceof SqlError) { db.issues.push({level: 'error', code: 'syntax', msg: e.message}); return db; } throw e; }
  const stmts = splitStatements(toks);
  stmts.forEach((st, si) => {
    const p = new Rd(st); const first = p.peek();
    try {
      if (!first || first.t !== 'w') throw new SqlError(`Una sentencia no puede empezar por ${tokText(first)}`, first?.pos);
      const u = first.u;
      if (u === 'CREATE') {
        p.next();
        if (p.isW('DATABASE') || p.isW('SCHEMA')) { p.next(); if (p.eatW('IF')) { p.expectW('NOT'); p.expectW('EXISTS'); } db.dbName = p.ident(); db.events.push({k: 'createdb', name: db.dbName}); return; }
        if (p.isW('TABLE') || p.isW('TEMPORARY')) { const tb = parseCreateTable(p, db, si); db.events.push({k: 'create', table: tb.name}); return; }
        db.events.push({k: 'other', u}); return;
      }
      if (u === 'DROP') { p.next(); if (p.isW('DATABASE') || p.isW('SCHEMA')) { p.next(); if (p.eatW('IF')) p.expectW('EXISTS'); db.events.push({k: 'dropdb', name: p.ident()}); }
        else if (p.eatW('TABLE')) { if (p.eatW('IF')) p.expectW('EXISTS'); const n = p.ident(); delete db.tables[key(n)]; db.order = db.order.filter(k => k !== key(n)); db.events.push({k: 'droptable', name: n}); }
        return; }
      if (u === 'USE') { p.next(); db.events.push({k: 'use', name: p.ident()}); return; }
      if (u === 'ALTER') { p.next(); parseAlter(p, db, si); db.events.push({k: 'alter'}); return; }
      if (['SET', 'LOCK', 'UNLOCK', 'INSERT', 'START', 'COMMIT', 'BEGIN'].includes(u)) { db.events.push({k: u.toLowerCase()}); return; }
      if (['SELECT', 'UPDATE', 'DELETE'].includes(u)) { db.events.push({k: 'dml', u}); return; }
      throw new SqlError(`Sentencia desconocida: ${first.v}. ¿Querías escribir CREATE TABLE?`, first.pos);
    } catch (e) {
      if (e instanceof SqlError) db.issues.push({level: 'error', code: 'syntax', msg: e.message, stmt: si + 1}); else throw e;
    }
  });
  return db;
}
SQL.parseScript = parseScript;

// ---------- validación a lo MySQL ----------
function validateSchema(db) {
  const iss = [...db.issues];
  const err = (code, msg) => iss.push({level: 'error', code, msg});
  const warn = (code, msg) => iss.push({level: 'warn', code, msg});
  db.order.forEach(k => {
    const t = db.tables[k]; const colOf = n => t.cols.find(c => lc(c.name) === lc(n));
    if (t.pkDeclCount > 1) err('multiPk', `'${t.name}' declara la PRIMARY KEY más de una vez (MySQL: Multiple primary key defined). Una tabla solo tiene una CP; si es compuesta se escribe una sola vez: PRIMARY KEY (a, b).`);
    if (!t.pk.length) warn('noPk', `'${t.name}' no tiene clave primaria.`);
    t.pk.forEach(n => { const c = colOf(n); if (!c) err('pkCol', `La PRIMARY KEY de '${t.name}' usa '${n}', que no es una columna de la tabla.`); else if (c.nullExplicit && !c.notNull) err('pkNull', `'${n}' forma parte de la PRIMARY KEY pero se declaró NULL: una CP no puede admitir nulos.`); });
    t.uniques.forEach(u => u.cols.forEach(n => { if (!colOf(n)) err('uqCol', `UNIQUE usa '${n}', que no es una columna de '${t.name}'.`); }));
    t.cols.forEach(c => { if (c.auto && !c.pk && !t.uniques.some(u => u.cols.length === 1 && lc(u.cols[0]) === lc(c.name))) err('autoKey', `AUTO_INCREMENT en '${t.name}.${c.name}' exige que sea clave (PRIMARY KEY o UNIQUE).`);
      if (c.family === 'str' && (c.type === 'VARCHAR') && c.len == null) err('varchar', `VARCHAR sin longitud en '${t.name}.${c.name}'.`);
      if (c.def !== undefined && c.auto) err('autoDef', `'${t.name}.${c.name}': AUTO_INCREMENT no puede llevar DEFAULT.`); });
    t.fks.forEach(f => {
      f.cols.forEach(n => { if (!colOf(n)) err('fkCol', `La FOREIGN KEY de '${t.name}' usa '${n}', que no es una columna de la tabla.`); });
      const rk = key(f.ref); const R = db.tables[rk];
      const orderOf = db.order.indexOf(rk);
      if (!R) { err('fkNoTable', `La FK de '${t.name}(${f.cols.join(', ')})' apunta a '${f.ref}', que no existe.`); return; }
      const selfRef = rk === k;
      if (!selfRef && !f.alter && orderOf > db.order.indexOf(k)) err('fkOrder', `Orden de creación: '${t.name}' tiene una FK hacia '${R.name}', que se crea DESPUÉS. Al ejecutar el CREATE TABLE de '${t.name}', '${R.name}' aún no existe y MySQL da error. Crea antes '${R.name}' (o añade la FK después con ALTER TABLE).`);
      const refCols = f.refCols || R.pk;
      if (!refCols.length) { err('fkNoPk', `La FK de '${t.name}' apunta a '${R.name}', que no tiene clave primaria.`); return; }
      if (refCols.length !== f.cols.length) { err('fkCount', `La FK de '${t.name}(${f.cols.join(', ')})' tiene ${f.cols.length} columna(s) pero '${R.name}' se referencia con ${refCols.length}.`); return; }
      const rset = refCols.map(lc).sort().join(',');
      const isPk = R.pk.map(lc).sort().join(',') === rset;
      const isUq = R.uniques.some(u => u.cols.map(lc).sort().join(',') === rset);
      refCols.forEach(n => { if (!R.cols.some(c => lc(c.name) === lc(n))) err('fkRefCol', `La FK de '${t.name}' apunta a '${R.name}(${n})', que no es una columna de '${R.name}'.`); });
      if (R.cols.length && refCols.every(n => R.cols.some(c => lc(c.name) === lc(n))) && !isPk && !isUq) err('fkNotKey', `La FK de '${t.name}' referencia '${R.name}(${refCols.join(', ')})', que NO es clave primaria ni UNIQUE: una clave ajena solo puede apuntar a una CP o a una clave alternativa.`);
      f.cols.forEach((n, i) => { const a = colOf(n), b = R.cols.find(c => lc(c.name) === lc(refCols[i]));
        if (a && b && a.family && b.family && !compat(a.family, b.family)) err('fkType', `Tipos incompatibles en la FK: '${t.name}.${a.name}' es ${a.type} y '${R.name}.${b.name}' es ${b.type}. Deben ser del mismo tipo.`);
        if (a && (f.onDelete === 'SET NULL' || f.onUpdate === 'SET NULL') && a.notNull) err('fkSetNull', `'${t.name}.${a.name}' es NOT NULL pero la FK usa ON ... SET NULL: son incompatibles.`); });
    });
  });
  return iss;
}
SQL.validateSchema = validateSchema;

// ---------- corrección del DDL contra el marco esperado ----------
// spec = tabla del caso: {name, cols:[[nombre, marcas, tablaFK]]}
//   marcas: P = en la CP · A = C.Alt (UNIQUE) · V = obligatorio · o = admite NULL
function gradeSchema(db, spec, opts) {
  opts = opts || {}; const checks = []; const iss = validateSchema(db);
  const add = (ok, label, hint, table) => checks.push({ok, label, hint: ok ? '' : hint, table});
  const tableByName = n => db.tables[key(n)];
  const sing = n => { const a = lc(n); return db.order.filter(k => k === a + 's' || k === a + 'es' || (k.endsWith('s') && k.slice(0, -1) === a)); };
  spec.forEach(sp => {
    const t = tableByName(sp.name); const T = sp.name;
    if (!t) { const plural = sing(sp.name);
      add(false, `Tabla ${T}`, plural.length ? `Has creado «${db.tables[plural[0]].name}» en plural: las tablas se nombran en SINGULAR (${T}).` : `Falta la tabla ${T}.`, T);
      return; }
    add(true, `Tabla ${T}`, '', T);
    const colOf = n => t.cols.find(c => lc(c.name) === lc(n));
    sp.cols.forEach(c => { const col = colOf(c[0]); if (!col) add(false, `${T}.${c[0]} existe`, `Falta la columna ${c[0]} en ${T}.`, T); });
    const pkWant = sp.cols.filter(c => /P/.test(c[1])).map(c => c[0]);
    if (pkWant.length) {
      const got = t.pk.map(lc).sort().join(','), want = pkWant.map(lc).sort().join(',');
      add(got === want, `CP de ${T} = (${pkWant.join(', ')})`, !t.pk.length ? `${T} no tiene clave primaria. Debe ser (${pkWant.join(', ')}).` : `La CP de ${T} es (${t.pk.join(', ')}) y debería ser (${pkWant.join(', ')})${pkWant.length > 1 ? ': en una tabla intermedia la CP es compuesta y se escribe una sola vez.' : '.'}`, T);
    }
    sp.cols.forEach(c => {
      const col = colOf(c[0]); if (!col) return;
      const inPk = t.pk.map(lc).includes(lc(c[0]));
      if (/A/.test(c[1])) { const u = t.uniques.some(x => x.cols.length === 1 && lc(x.cols[0]) === lc(c[0])) || (t.pk.length === 1 && inPk);
        add(u, `UNIQUE en ${T}.${c[0]} (C.Alt)`, `Falta UNIQUE en ${T}.${c[0]}: es clave alternativa y no puede repetirse.`, T); }
      if (/V/.test(c[1]) && !/P/.test(c[1])) add(col.notNull || inPk, `NOT NULL en ${T}.${c[0]} (VNN)`, `${T}.${c[0]} es obligatorio: falta NOT NULL.`, T);
      if (/o/.test(c[1]) && !/P/.test(c[1])) add(!col.notNull && !inPk, `${T}.${c[0]} admite NULL`, `${T}.${c[0]} es opcional: sobra el NOT NULL.`, T);
      if (c[2]) {
        const tgt = spec.find(s => s.name === c[2]); const tgtPk = tgt ? tgt.cols.filter(x => /P/.test(x[1])).map(x => x[0]) : [];
        const f = t.fks.find(f => f.cols.map(lc).includes(lc(c[0])));
        let ok = !!f && lc(f.ref) === lc(c[2]);
        let hint = !f ? `Falta la FOREIGN KEY de ${T}.${c[0]} hacia ${c[2]}.` : `La FK de ${T}.${c[0]} apunta a ${f.ref} y debería apuntar a ${c[2]}.`;
        if (ok && tgtPk.length) { const rc = (f.refCols || (tableByName(c[2]) || {pk: []}).pk).map(lc);
          if (f.cols.length === 1 && tgtPk.length === 1 && rc[0] !== lc(tgtPk[0])) { ok = false; hint = `La FK de ${T}.${c[0]} debe referenciar ${c[2]}(${tgtPk[0]}).`; } }
        add(ok, `FK ${T}.${c[0]} → ${c[2]}`, hint, T);
      } else if (opts.noExtraFk !== false && t.fks.some(f => f.cols.length === 1 && lc(f.cols[0]) === lc(c[0]))) {
        add(false, `${T}.${c[0]} no es clave ajena`, `Has puesto una FOREIGN KEY en ${T}.${c[0]} que el enunciado no pide.`, T);
      }
    });
  });
  const errs = iss.filter(i => i.level === 'error');
  const warns = iss.filter(i => i.level === 'warn');
  const total = checks.length, good = checks.filter(c => c.ok).length;
  return {checks, issues: iss, errors: errs, warns, total, good, score: total ? good / total : 0, ok: good === total && !errs.length};
}
SQL.gradeSchema = gradeSchema;

// ---------- aserciones:  A[x] ⊆ B[y] ----------
function parseAssertion(text) {
  const s = String(text || '').replace(/[\\]/g, '').replace(/\s+/g, '');
  const m = /^([A-Za-zÀ-ÿ_0-9]+)\[([^\]]+)\](?:⊆|<=|c=|⊂|subset|⊆=)([A-Za-zÀ-ÿ_0-9]+)\[([^\]]+)\]$/i.exec(s);
  if (!m) return null;
  const cols = x => x.split(',').map(lc).filter(Boolean);
  return {lt: lc(m[1]), lc: cols(m[2]), rt: lc(m[3]), rc: cols(m[4])};
}
SQL.parseAssertion = parseAssertion;
SQL.sameAssertion = (a, b) => !!a && !!b && a.lt === b.lt && a.rt === b.rt && a.lc.join() === b.lc.join() && a.rc.join() === b.rc.join();

})(typeof globalThis !== 'undefined' ? globalThis : window);
