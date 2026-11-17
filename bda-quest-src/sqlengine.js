// BDA-QUEST · mini motor SQL estilo MySQL (una tabla por consulta). Sin dependencias.
// Ejecuta SELECT / INSERT / UPDATE / DELETE de verdad sobre datos de ejemplo y compara el RESULTADO
// con el de la solución, en vez de buscar palabras sueltas. Incluye los errores clásicos de MySQL
// (ONLY_FULL_GROUP_BY, agregados en WHERE, FK, NOT NULL, ENUM...).
(function (root) {
'use strict';
const SQL = (root.BQ = root.BQ || {}).SQL;
const {SqlError, tokenize, splitStatements, Rd, fold} = SQL;
const lc = s => String(s).toLowerCase();
const TODAY = '2026-11-17';          // fecha fija para que CURDATE() sea reproducible

// ---------- valores ----------
const isNum = v => typeof v === 'number';
const toNum = v => { if (v === null || v === undefined) return null; if (isNum(v)) return v; if (typeof v === 'boolean') return v ? 1 : 0; const m = /^\s*[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/.exec(String(v)); return m ? parseFloat(m[0]) : 0; };
const bool3 = v => v === null || v === undefined ? null : (isNum(v) ? v !== 0 : String(v) !== '' && toNum(v) !== 0);
const b2n = b => b === null ? null : (b ? 1 : 0);
function cmpVals(a, b) {          // devuelve -1/0/1 o null si hay NULL
  if (a === null || b === null || a === undefined || b === undefined) return null;
  if (isNum(a) && isNum(b)) return a < b ? -1 : a > b ? 1 : 0;
  if (isNum(a) !== isNum(b)) { const x = toNum(a), y = toNum(b); return x < y ? -1 : x > y ? 1 : 0; }
  const x = fold(a), y = fold(b); return x < y ? -1 : x > y ? 1 : 0;
}
function orderCmp(a, b) {         // para ORDER BY: NULL el menor
  const an = a === null || a === undefined, bn = b === null || b === undefined;
  if (an || bn) return an && bn ? 0 : an ? -1 : 1;
  const c = cmpVals(a, b); if (c) return c;
  if (!isNum(a) && !isNum(b)) return a < b ? -1 : a > b ? 1 : 0;
  return 0;
}
const roundHalf = (x, d = 0) => { const f = Math.pow(10, d); const s = x < 0 ? -1 : 1; return s * Math.round(Math.abs(x) * f + 1e-9) / f; };
function fmt(v) { if (v === null || v === undefined) return 'NULL'; if (isNum(v)) return Number.isInteger(v) ? String(v) : String(+v.toFixed(4)); return String(v); }
SQL.fmtVal = fmt;

// ---------- fechas ----------
function parseDate(v) {
  if (v === null || v === undefined) return null; const m = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2}):(\d{2}))?/.exec(String(v));
  if (!m) return null; const [y, mo, d] = [+m[1], +m[2], +m[3]]; const dt = new Date(Date.UTC(y, mo - 1, d)); if (dt.getUTCMonth() !== mo - 1) return null;
  return {y, mo, d, h: +(m[4] || 0), mi: +(m[5] || 0), s: +(m[6] || 0), t: dt};
}
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const pad = (n, k = 2) => String(n).padStart(k, '0');
function dateFormat(dt, f) {
  return String(f).replace(/%([YymcdeHhIiSsMWaDjpbu%])/g, (_, c) => ({Y: dt.y, y: pad(dt.y % 100), m: pad(dt.mo), c: dt.mo, d: pad(dt.d), e: dt.d, H: pad(dt.h), h: pad(dt.h % 12 || 12), I: pad(dt.h % 12 || 12), i: pad(dt.mi), S: pad(dt.s), s: pad(dt.s), M: MONTHS[dt.mo - 1], b: MONTHS[dt.mo - 1].slice(0, 3), W: DAYS[dt.t.getUTCDay()], a: DAYS[dt.t.getUTCDay()].slice(0, 3), j: pad(Math.floor((dt.t - Date.UTC(dt.y, 0, 1)) / 864e5) + 1, 3), p: dt.h < 12 ? 'AM' : 'PM', u: pad(0), D: dt.d, '%': '%'}[c]));
}
function tsDiff(unit, a, b) {
  const A = parseDate(a), B = parseDate(b); if (!A || !B) return null;
  if (unit === 'DAY') return Math.trunc((B.t - A.t) / 864e5);
  let months = (B.y - A.y) * 12 + (B.mo - A.mo); if (months > 0 && B.d < A.d) months--; else if (months < 0 && B.d > A.d) months++;
  if (unit === 'MONTH') return months; if (unit === 'YEAR') return Math.trunc(months / 12);
  if (unit === 'WEEK') return Math.trunc((B.t - A.t) / 864e5 / 7); return null;
}

// ---------- erratas en palabras clave (FORM -> FROM, WERE -> WHERE...) ----------
const KEYWORDS = ['SELECT', 'FROM', 'WHERE', 'GROUP', 'HAVING', 'ORDER', 'LIMIT', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'DELETE', 'SET', 'DISTINCT', 'BETWEEN', 'LIKE', 'AND', 'OR'];
function lev(a, b) { const d = Array.from({length: a.length + 1}, (_, i) => [i]); for (let j = 1; j <= b.length; j++) d[0][j] = j; for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i-1][j] + 1, d[i][j-1] + 1, d[i-1][j-1] + (a[i-1] === b[j-1] ? 0 : 1)); return d[a.length][b.length]; }
function typoHint(tok) { if (!tok || tok.t !== 'w') return ''; const u = tok.u; if (KEYWORDS.includes(u)) return ''; const k = KEYWORDS.find(x => x.length > 2 && lev(u, x) <= (x.length > 4 ? 2 : 1) && u[0] === x[0]); return k ? ` ¿Querías escribir ${k}?` : ''; }
SQL.typoHint = typoHint;

// ---------- parser de expresiones ----------
const AGGS = new Set(['COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'GROUP_CONCAT']);
const CLAUSE_END = new Set(['FROM', 'WHERE', 'GROUP', 'HAVING', 'ORDER', 'LIMIT', 'UNION', 'SET', 'VALUES', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 'CROSS', 'ON', 'ASC', 'DESC', 'OFFSET']);
class ExprParser {
  constructor(rd) { this.p = rd; }
  expr() { return this.or(); }
  or() { let a = this.xor(); while (this.p.isW('OR') || this.p.isP('||')) { this.p.next(); a = {k: 'bin', op: 'OR', a, b: this.xor()}; } return a; }
  xor() { let a = this.and(); while (this.p.isW('XOR')) { this.p.next(); a = {k: 'bin', op: 'XOR', a, b: this.and()}; } return a; }
  and() { let a = this.not(); while (this.p.isW('AND') || this.p.isP('&&')) { this.p.next(); a = {k: 'bin', op: 'AND', a, b: this.not()}; } return a; }
  not() { if (this.p.isW('NOT') || this.p.isP('!')) { this.p.next(); return {k: 'un', op: 'NOT', a: this.not()}; } return this.cmp(); }
  cmp() {
    let a = this.add(); const p = this.p;
    for (;;) {
      const x = p.peek(); if (!x) break;
      if (x.t === 'p' && ['=', '<>', '<', '>', '<=', '>=', '<=>'].includes(x.v)) { p.next(); a = {k: 'bin', op: x.v, a, b: this.add()}; continue; }
      if (x.t === 'p' && x.v === ':=') throw new SqlError("Para comparar se usa '=' (no ':=')");
      if (x.t !== 'w') break;
      if (x.u === 'IS') { p.next(); const neg = p.eatW('NOT');
        if (p.eatW('NULL')) { a = {k: 'isnull', a, neg}; continue; }
        if (p.isW('TRUE') || p.isW('FALSE')) { const v = p.next().u === 'TRUE'; a = {k: 'istrue', a, v, neg}; continue; }
        throw new SqlError(`Tras IS ${neg ? 'NOT ' : ''}se espera NULL, TRUE o FALSE y aparece ${p.peek() ? p.peek().v : 'el final'}`, p.peek()?.pos); }
      let neg = false, save = p.i;
      if (x.u === 'NOT' && (p.isW('LIKE', 1) || p.isW('IN', 1) || p.isW('BETWEEN', 1) || p.isW('REGEXP', 1) || p.isW('RLIKE', 1))) { p.next(); neg = true; }
      if (p.isW('LIKE')) { p.next(); const pat = this.add(); if (p.eatW('ESCAPE')) p.next(); a = {k: 'like', a, pat, neg}; continue; }
      if (p.isW('REGEXP') || p.isW('RLIKE')) { p.next(); const pat = this.add(); a = {k: 'regexp', a, pat, neg}; continue; }
      if (p.isW('IN')) { p.next(); p.expectP('(', 'tras IN');
        if (p.isW('SELECT')) throw new SqlError('Las subconsultas no entran en esta parte (solo una tabla)');
        const list = []; for (;;) { list.push(this.expr()); if (p.eatP(',')) continue; break; } p.expectP(')', 'al cerrar la lista de IN'); a = {k: 'in', a, list, neg}; continue; }
      if (p.isW('BETWEEN')) { p.next(); const lo = this.add(); if (!p.eatW('AND')) throw new SqlError('BETWEEN necesita AND: BETWEEN 20 AND 30', p.peek()?.pos); const hi = this.add(); a = {k: 'between', a, lo, hi, neg}; continue; }
      p.i = save; break;
    }
    return a;
  }
  add() { let a = this.mul(); for (;;) { const x = this.p.peek(); if (x && x.t === 'p' && (x.v === '+' || x.v === '-')) { this.p.next(); a = {k: 'bin', op: x.v, a, b: this.mul()}; } else break; } return a; }
  mul() { let a = this.unary(); for (;;) { const x = this.p.peek(); if (x && ((x.t === 'p' && ['*', '/', '%'].includes(x.v)) || (x.t === 'w' && (x.u === 'DIV' || x.u === 'MOD')))) { this.p.next(); a = {k: 'bin', op: x.t === 'w' ? x.u : x.v, a, b: this.unary()}; } else break; } return a; }
  unary() { const x = this.p.peek(); if (x && x.t === 'p' && x.v === '-') { this.p.next(); return {k: 'un', op: '-', a: this.unary()}; } if (x && x.t === 'p' && x.v === '+') { this.p.next(); return this.unary(); } return this.primary(); }
  primary() {
    const p = this.p, x = p.next(); if (!x) throw new SqlError('La expresión está incompleta: falta un valor al final');
    if (x.t === 'n') return {k: 'lit', v: parseFloat(x.v)};
    if (x.t === 's') return {k: 'lit', v: x.v, str: true};
    if (x.t === 'p' && x.v === '(') { if (p.isW('SELECT')) throw new SqlError('Las subconsultas no entran en esta parte (solo una tabla)'); const e = this.expr(); p.expectP(')', 'al cerrar el paréntesis'); return e; }
    if (x.t === 'p') throw new SqlError(`No se esperaba '${x.v}' aquí`, x.pos);
    if (x.t === 'w') {
      const u = x.u;
      if (u === 'NULL') return {k: 'lit', v: null};
      if (u === 'TRUE') return {k: 'lit', v: 1}; if (u === 'FALSE') return {k: 'lit', v: 0};
      if (u === 'CASE') return this.caseExpr();
      if (u === 'INTERVAL') throw new SqlError('INTERVAL no entra en esta parte');
      if (p.isP('(')) return this.call(x);
      if (CLAUSE_END.has(u) && !p.isP('.')) throw new SqlError(`Falta una expresión antes de ${x.v}`, x.pos);
    }
    if (x.t === 'w' || x.t === 'q') {
      if (p.isP('.')) { p.next(); const c = p.next(); if (!c || (c.t !== 'w' && c.t !== 'q' && !(c.t === 'p' && c.v === '*'))) throw new SqlError('Tras el punto falta el nombre de la columna'); return {k: 'col', tbl: x.v, name: c.v}; }
      return {k: 'col', name: x.v};
    }
    throw new SqlError(`No se entiende ${x.v}`, x.pos);
  }
  caseExpr() {
    const p = this.p; let operand = null; if (!p.isW('WHEN')) operand = this.expr();
    const whens = []; while (p.eatW('WHEN')) { const c = this.expr(); p.expectW('THEN', 'tras la condición del WHEN'); whens.push([c, this.expr()]); }
    if (!whens.length) throw new SqlError('CASE necesita al menos un WHEN ... THEN ...');
    let els = null; if (p.eatW('ELSE')) els = this.expr(); p.expectW('END', 'para cerrar el CASE');
    return {k: 'case', operand, whens, els};
  }
  call(x) {
    const p = this.p, name = x.u; p.expectP('(');
    if (AGGS.has(name)) {
      let distinct = false, star = false, args = [], sep = ',';
      if (p.eatW('DISTINCT')) distinct = true;
      if (p.isP('*')) { p.next(); star = true; if (name !== 'COUNT') throw new SqlError(`${name}(*) no es válido: solo COUNT admite *`); }
      else if (!p.isP(')')) { for (;;) { args.push(this.expr()); if (p.eatP(',')) continue; break; } if (name === 'GROUP_CONCAT' && p.eatW('SEPARATOR')) sep = p.next().v; }
      p.expectP(')', `al cerrar ${name}(`);
      if (!star && !args.length) throw new SqlError(`${name}() necesita un argumento`);
      return {k: 'agg', name, distinct, star, args, sep};
    }
    if (name === 'EXTRACT') { const unit = p.next().u; p.expectW('FROM'); const e = this.expr(); p.expectP(')'); return {k: 'fn', name: unit, args: [e]}; }
    if (name === 'TIMESTAMPDIFF') { const unit = p.next().u; p.expectP(','); const a = this.expr(); p.expectP(','); const b = this.expr(); p.expectP(')'); return {k: 'fn', name, unit, args: [a, b]}; }
    if (name === 'CAST') { const e = this.expr(); p.expectW('AS'); const ty = p.next().u; if (p.isP('(')) { while (!p.isP(')')) p.next(); p.next(); } p.expectP(')'); return {k: 'fn', name: 'CAST', ty, args: [e]}; }
    const args = []; if (!p.isP(')')) { for (;;) { args.push(this.expr()); if (p.eatP(',')) continue; break; } }
    p.expectP(')', `al cerrar ${name}(`);
    return {k: 'fn', name, args};
  }
}

// ---------- evaluador ----------
const hasAgg = n => !!n && (n.k === 'agg' || (n.a && hasAgg(n.a)) || (n.b && hasAgg(n.b)) || (n.args && n.args.some(hasAgg)) || (n.list && n.list.some(hasAgg)) || (n.lo && hasAgg(n.lo)) || (n.hi && hasAgg(n.hi)) || (n.pat && hasAgg(n.pat)) || (n.operand && hasAgg(n.operand)) || (n.whens && n.whens.some(w => hasAgg(w[0]) || hasAgg(w[1]))) || (n.els && hasAgg(n.els)));
function walk(n, f) { if (!n) return; f(n); ['a', 'b', 'lo', 'hi', 'pat', 'operand', 'els'].forEach(k => n[k] && walk(n[k], f)); (n.args || []).forEach(x => walk(x, f)); (n.list || []).forEach(x => walk(x, f)); (n.whens || []).forEach(w => { walk(w[0], f); walk(w[1], f); }); }
const likeRe = (pat, neg) => new RegExp('^' + String(pat).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '[\\s\\S]*').replace(/_/g, '[\\s\\S]') + '$', 'i');
const strv = v => v === null || v === undefined ? null : isNum(v) ? fmt(v) : String(v);
const utf8len = s => { let n = 0; for (const ch of s) { const c = ch.codePointAt(0); n += c < 0x80 ? 1 : c < 0x800 ? 2 : c < 0x10000 ? 3 : 4; } return n; };

function ev(n, cx) {
  switch (n.k) {
    case 'lit': return n.v;
    case 'col': return cx.col(n);
    case 'un': { const v = ev(n.a, cx); if (n.op === '-') return v === null ? null : -toNum(v); const b = bool3(v); return b === null ? null : b2n(!b); }
    case 'bin': return binop(n, cx);
    case 'isnull': { const v = ev(n.a, cx); return b2n((v === null || v === undefined) !== n.neg); }
    case 'istrue': { const b = bool3(ev(n.a, cx)); const r = b === null ? false : b === n.v; return b2n(r !== n.neg); }
    case 'in': { const v = ev(n.a, cx); if (v === null) return null; let seenNull = false, hit = false;
      for (const e of n.list) { const c = cmpVals(v, ev(e, cx)); if (c === null) seenNull = true; else if (c === 0) { hit = true; break; } }
      if (hit) return b2n(!n.neg); if (seenNull) return null; return b2n(n.neg); }
    case 'between': { const v = ev(n.a, cx), lo = ev(n.lo, cx), hi = ev(n.hi, cx); const c1 = cmpVals(v, lo), c2 = cmpVals(v, hi); if (c1 === null || c2 === null) return null; const r = c1 >= 0 && c2 <= 0; return b2n(r !== n.neg); }
    case 'like': { const v = ev(n.a, cx), p = ev(n.pat, cx); if (v === null || p === null) return null; return b2n(likeRe(strv(p)).test(strv(v)) !== n.neg); }
    case 'regexp': { const v = ev(n.a, cx), p = ev(n.pat, cx); if (v === null || p === null) return null; let r; try { r = new RegExp(strv(p), 'i').test(strv(v)); } catch { throw new SqlError('Expresión regular no válida en REGEXP'); } return b2n(r !== n.neg); }
    case 'case': { const op = n.operand ? ev(n.operand, cx) : undefined;
      for (const [c, r] of n.whens) { const hit = n.operand ? cmpVals(op, ev(c, cx)) === 0 : bool3(ev(c, cx)) === true; if (hit) return ev(r, cx); }
      return n.els ? ev(n.els, cx) : null; }
    case 'agg': return cx.agg(n);
    case 'fn': return callFn(n, cx);
  }
  throw new SqlError('Expresión no soportada');
}
function binop(n, cx) {
  const op = n.op;
  if (op === 'AND') { const a = bool3(ev(n.a, cx)); if (a === false) return 0; const b = bool3(ev(n.b, cx)); if (b === false) return 0; return a === null || b === null ? null : 1; }
  if (op === 'OR') { const a = bool3(ev(n.a, cx)); if (a === true) return 1; const b = bool3(ev(n.b, cx)); if (b === true) return 1; return a === null || b === null ? null : 0; }
  if (op === 'XOR') { const a = bool3(ev(n.a, cx)), b = bool3(ev(n.b, cx)); return a === null || b === null ? null : b2n(a !== b); }
  const a = ev(n.a, cx), b = ev(n.b, cx);
  if (op === '<=>') { if (a === null || b === null) return b2n(a === null && b === null); return b2n(cmpVals(a, b) === 0); }
  if (['=', '<>', '<', '>', '<=', '>='].includes(op)) { const c = cmpVals(a, b); if (c === null) return null; return b2n({'=': c === 0, '<>': c !== 0, '<': c < 0, '>': c > 0, '<=': c <= 0, '>=': c >= 0}[op]); }
  if (a === null || b === null) return null;
  const x = toNum(a), y = toNum(b);
  switch (op) { case '+': return x + y; case '-': return x - y; case '*': return x * y; case '/': return y === 0 ? null : x / y; case 'DIV': return y === 0 ? null : Math.trunc(x / y); case '%': case 'MOD': return y === 0 ? null : x % y; }
  throw new SqlError('Operador no soportado: ' + op);
}
const FN = {
  ROUND: (a) => a[0] === null ? null : roundHalf(toNum(a[0]), a[1] == null ? 0 : toNum(a[1])),
  TRUNCATE: a => a[0] === null ? null : Math.trunc(toNum(a[0]) * Math.pow(10, toNum(a[1]))) / Math.pow(10, toNum(a[1])),
  FLOOR: a => a[0] === null ? null : Math.floor(toNum(a[0])), CEIL: a => a[0] === null ? null : Math.ceil(toNum(a[0])), CEILING: a => a[0] === null ? null : Math.ceil(toNum(a[0])),
  ABS: a => a[0] === null ? null : Math.abs(toNum(a[0])), SIGN: a => a[0] === null ? null : Math.sign(toNum(a[0])), SQRT: a => a[0] === null ? null : Math.sqrt(toNum(a[0])),
  POWER: a => Math.pow(toNum(a[0]), toNum(a[1])), POW: a => Math.pow(toNum(a[0]), toNum(a[1])), MOD: a => toNum(a[1]) === 0 ? null : toNum(a[0]) % toNum(a[1]),
  LENGTH: a => a[0] === null ? null : utf8len(strv(a[0])), OCTET_LENGTH: a => a[0] === null ? null : utf8len(strv(a[0])), CHAR_LENGTH: a => a[0] === null ? null : [...strv(a[0])].length, CHARACTER_LENGTH: a => a[0] === null ? null : [...strv(a[0])].length,
  UPPER: a => a[0] === null ? null : strv(a[0]).toUpperCase(), UCASE: a => a[0] === null ? null : strv(a[0]).toUpperCase(),
  LOWER: a => a[0] === null ? null : strv(a[0]).toLowerCase(), LCASE: a => a[0] === null ? null : strv(a[0]).toLowerCase(),
  SUBSTRING: a => sub(a), SUBSTR: a => sub(a), MID: a => sub(a),
  LEFT: a => a[0] === null ? null : [...strv(a[0])].slice(0, Math.max(0, toNum(a[1]))).join(''), RIGHT: a => { if (a[0] === null) return null; const c = [...strv(a[0])], k = Math.max(0, toNum(a[1])); return k ? c.slice(-k).join('') : ''; },
  CONCAT: a => a.some(x => x === null) ? null : a.map(strv).join(''), CONCAT_WS: a => a[0] === null ? null : a.slice(1).filter(x => x !== null).map(strv).join(strv(a[0])),
  TRIM: a => a[0] === null ? null : strv(a[0]).trim(), LTRIM: a => a[0] === null ? null : strv(a[0]).trimStart(), RTRIM: a => a[0] === null ? null : strv(a[0]).trimEnd(),
  REPLACE: a => a.some(x => x === null) ? null : strv(a[0]).split(strv(a[1])).join(strv(a[2])), REVERSE: a => a[0] === null ? null : [...strv(a[0])].reverse().join(''),
  REPEAT: a => a[0] === null ? null : strv(a[0]).repeat(Math.max(0, toNum(a[1]))),
  LPAD: a => a[0] === null ? null : strv(a[0]).padStart(toNum(a[1]), strv(a[2])).slice(0, toNum(a[1])), RPAD: a => a[0] === null ? null : strv(a[0]).padEnd(toNum(a[1]), strv(a[2])).slice(0, toNum(a[1])),
  INSTR: a => a.some(x => x === null) ? null : fold(strv(a[0])).indexOf(fold(strv(a[1]))) + 1, LOCATE: a => a.some(x => x === null) ? null : fold(strv(a[1])).indexOf(fold(strv(a[0]))) + 1,
  IFNULL: a => a[0] === null ? a[1] : a[0], COALESCE: a => { for (const x of a) if (x !== null) return x; return null; }, NULLIF: a => cmpVals(a[0], a[1]) === 0 ? null : a[0],
  IF: a => bool3(a[0]) === true ? a[1] : a[2], ISNULL: a => b2n(a[0] === null),
  GREATEST: a => a.some(x => x === null) ? null : a.reduce((m, x) => orderCmp(x, m) > 0 ? x : m), LEAST: a => a.some(x => x === null) ? null : a.reduce((m, x) => orderCmp(x, m) < 0 ? x : m),
  CURDATE: () => TODAY, CURRENT_DATE: () => TODAY, NOW: () => TODAY + ' 12:00:00', CURRENT_TIMESTAMP: () => TODAY + ' 12:00:00',
  YEAR: a => { const d = parseDate(a[0]); return d ? d.y : null; }, MONTH: a => { const d = parseDate(a[0]); return d ? d.mo : null; }, DAY: a => { const d = parseDate(a[0]); return d ? d.d : null; }, DAYOFMONTH: a => { const d = parseDate(a[0]); return d ? d.d : null; },
  DAYOFWEEK: a => { const d = parseDate(a[0]); return d ? d.t.getUTCDay() + 1 : null; }, WEEKDAY: a => { const d = parseDate(a[0]); return d ? (d.t.getUTCDay() + 6) % 7 : null; },
  DAYNAME: a => { const d = parseDate(a[0]); return d ? DAYS[d.t.getUTCDay()] : null; }, MONTHNAME: a => { const d = parseDate(a[0]); return d ? MONTHS[d.mo - 1] : null; },
  DAYOFYEAR: a => { const d = parseDate(a[0]); return d ? Math.floor((d.t - Date.UTC(d.y, 0, 1)) / 864e5) + 1 : null; },
  DATE: a => { const d = parseDate(a[0]); return d ? `${d.y}-${pad(d.mo)}-${pad(d.d)}` : null; },
  DATEDIFF: a => { const x = parseDate(a[0]), y = parseDate(a[1]); return x && y ? Math.round((x.t - y.t) / 864e5) : null; },
  DATE_FORMAT: a => { const d = parseDate(a[0]); return d ? dateFormat(d, strv(a[1])) : null; },
  HOUR: a => { const d = parseDate(a[0]); return d ? d.h : null; },
};
function sub(a) { if (a[0] === null || a[1] === null) return null; const c = [...strv(a[0])]; let p = toNum(a[1]); const len = a[2] === undefined ? Infinity : toNum(a[2]); if (len <= 0) return ''; const s = p > 0 ? p - 1 : p < 0 ? c.length + p : 0; if (p === 0) return ''; return c.slice(Math.max(0, s), len === Infinity ? undefined : Math.max(0, s) + len).join(''); }
function callFn(n, cx) {
  if (n.name === 'TIMESTAMPDIFF') { const a = n.args.map(x => ev(x, cx)); return tsDiff(n.unit, a[0], a[1]); }
  if (n.name === 'CAST') { const v = ev(n.args[0], cx); if (v === null) return null; if (/INT|SIGNED|UNSIGNED/.test(n.ty)) return Math.trunc(toNum(v)); if (/DEC|NUMERIC|FLOAT|DOUBLE/.test(n.ty)) return toNum(v); return strv(v); }
  const f = FN[n.name] || FN[n.name.replace(/^EXTRACT_/, '')];
  if (!f) { if (['YEAR', 'MONTH', 'DAY'].includes(n.name)) return FN[n.name](n.args.map(x => ev(x, cx))); throw new SqlError(`La función ${n.name}() no existe o no entra en este curso`); }
  return f(n.args.map(x => ev(x, cx)));
}
function aggEval(n, rows, cx) {
  if (n.name === 'COUNT' && n.star) return rows.length;
  let vals = rows.map(r => ev(n.args[0], cx.withRow(r))).filter(v => v !== null);
  if (n.distinct) { const seen = new Set(); vals = vals.filter(v => { const k = isNum(v) ? 'n' + v : 's' + fold(v); if (seen.has(k)) return false; seen.add(k); return true; }); }
  switch (n.name) {
    case 'COUNT': return vals.length;
    case 'SUM': return vals.length ? vals.reduce((s, v) => s + toNum(v), 0) : null;
    case 'AVG': return vals.length ? vals.reduce((s, v) => s + toNum(v), 0) / vals.length : null;
    case 'MIN': return vals.length ? vals.reduce((m, v) => orderCmp(v, m) < 0 ? v : m) : null;
    case 'MAX': return vals.length ? vals.reduce((m, v) => orderCmp(v, m) > 0 ? v : m) : null;
    case 'GROUP_CONCAT': return vals.length ? vals.map(strv).join(n.sep) : null;
  }
}

// ---------- tablas y restricciones ----------
function coerce(col, v, tname) {
  const nm = `${tname}.${col.name}`;
  if (v === null || v === undefined) return null;
  switch (col.family) {
    case 'int': { if (!isNum(v)) { if (typeof v === 'string' && !/^\s*[+-]?\d+(\.\d*)?\s*$/.test(v)) throw new SqlError(`El valor '${v}' no es un número entero válido para ${nm} (Incorrect integer value)`); v = toNum(v); } return Math.round(v); }
    case 'dec': { if (!isNum(v)) { if (typeof v === 'string' && !/^\s*[+-]?(\d+\.?\d*|\.\d+)\s*$/.test(v)) throw new SqlError(`El valor '${v}' no es un número válido para ${nm}`); v = toNum(v); }
      if (col.scale != null) v = roundHalf(v, col.scale);
      if (col.len != null && col.scale != null && Math.abs(v) >= Math.pow(10, col.len - col.scale)) throw new SqlError(`Valor fuera de rango para ${nm} (${col.type}(${col.len},${col.scale})) — Out of range value`);
      return v; }
    case 'str': { let s = strv(v);
      if (col.enumVals) { const hit = col.enumVals.find(e => fold(e) === fold(s) && e.toLowerCase() === s.toLowerCase()) || col.enumVals.find(e => fold(e) === fold(s)); if (!hit) throw new SqlError(`'${s}' no es un valor válido del ENUM de ${nm}: solo ${col.enumVals.map(e => "'" + e + "'").join(', ')} (Data truncated)`); return hit; }
      if (col.len != null && /CHAR/.test(col.type) && [...s].length > col.len) throw new SqlError(`Texto demasiado largo para ${nm}: máximo ${col.len} caracteres (Data too long)`);
      return s; }
    case 'date': case 'datetime': { const s = strv(v); const d = parseDate(s); if (!d) throw new SqlError(`'${s}' no es una fecha válida para ${nm} (formato AAAA-MM-DD) — Incorrect date value`); return col.family === 'date' ? `${d.y}-${pad(d.mo)}-${pad(d.d)}` : s; }
  }
  return v;
}

class Engine {
  constructor() { this.tables = {}; }
  // ---- carga de datos de ejemplo desde un script SQL ----
  static fromScript(src) {
    const e = new Engine(); const db = SQL.parseScript(src);
    for (const k of db.order) { const t = db.tables[k]; e.tables[k] = {name: t.name, cols: t.cols, pk: t.pk, uniques: t.uniques, fks: t.fks, checks: t.checks.concat(...t.cols.map(c => c.checks)).map(tk => new ExprParser(new Rd(tk)).expr()), rows: [], auto: 1}; }
    const toks = tokenize(src);
    e.loading = true;   // como FOREIGN_KEY_CHECKS=0 mientras se cargan los datos de ejemplo
    for (const st of splitStatements(toks)) if (st[0] && st[0].t === 'w' && st[0].u === 'INSERT') e.execTokens(st, true);
    e.loading = false;
    return e;
  }
  clone() { const e = new Engine(); e.loading = false; for (const k in this.tables) { const t = this.tables[k]; e.tables[k] = {...t, rows: t.rows.map(r => ({...r})), auto: t.auto}; } return e; }
  table(name) { const t = this.tables[lc(name)]; if (!t) throw new SqlError(`La tabla '${name}' no existe en esta base de datos. Tablas: ${Object.values(this.tables).map(x => x.name).join(', ')}`); return t; }

  // ---- punto de entrada: una sentencia ----
  exec(sql) {
    const toks = tokenize(sql); const sts = splitStatements(toks);
    if (!sts.length) throw new SqlError('Has escrito una sentencia vacía');
    if (sts.length > 1) throw new SqlError('Aquí se ejecuta UNA sentencia cada vez (hay más de un ";")');
    return this.execTokens(sts[0], false);
  }
  execAll(sql) { const out = []; for (const st of splitStatements(tokenize(sql))) out.push(this.execTokens(st, false)); return out; }
  execTokens(toks, seed) {
    const p = new Rd(toks), f = p.peek(); if (!f || f.t !== 'w') throw new SqlError(`Una sentencia no puede empezar por ${f ? f.v : 'nada'}`);
    switch (f.u) {
      case 'SELECT': return this.select(p);
      case 'INSERT': return this.insert(p, seed);
      case 'UPDATE': return this.update(p);
      case 'DELETE': return this.del(p);
      case 'CREATE': case 'DROP': case 'ALTER': case 'TRUNCATE': throw new SqlError(`${f.u} es DDL (estructura): esta parte trabaja con datos (SELECT, INSERT, UPDATE, DELETE)`);
      default: throw new SqlError(`${f.v}: aquí solo se admiten SELECT, INSERT, UPDATE y DELETE`);
    }
  }

  // ---- contexto de evaluación ----
  mkCx(t, rowObj, opts) {
    const cx = {
      row: rowObj, grp: null, where: opts.where, aliases: opts.aliases || null, tname: t.name, talias: opts.talias, noAgg: opts.noAgg, strictGroup: opts.strictGroup,
      col(n) {
        if (n.tbl && ![lc(t.name), lc(opts.talias || '')].includes(lc(n.tbl))) throw new SqlError(`La tabla '${n.tbl}' no está en el FROM (Unknown table)`);
        const k = lc(n.name);
        if (this.row && Object.prototype.hasOwnProperty.call(this.row, k)) return this.row[k];
        if (!t.cols.some(c => lc(c.name) === k)) {
          if (this.aliases && this.aliases.has(k) && !this.noAlias) return ev(this.aliases.get(k), this);
          throw new SqlError(`La columna '${n.name}' no existe${this.where ? ' (en ' + this.where + ')' : ''}${this.where === 'WHERE' && opts.aliasNames && opts.aliasNames.has(k) ? ': en WHERE no se pueden usar alias del SELECT' : ''}. Columnas de ${t.name}: ${t.cols.map(c => c.name).join(', ')}`);
        }
        return null;
      },
      agg(n) { if (this.noAgg) throw new SqlError(`No se pueden usar funciones de agregado (${n.name}) en ${this.where || 'esta cláusula'}: WHERE filtra filas ANTES de agrupar; para filtrar por un agregado se usa HAVING`); if (!this.grp) return aggEval(n, [], this.withRow(this.row)) ?? null; return aggEval(n, this.grp, this); },
      withRow(r) { return Object.assign(Object.create(Object.getPrototypeOf(this)), this, {row: r, grp: null}); },
    };
    return cx;
  }
  checkCols(t, node, where) { walk(node, n => { if (n.k === 'col') { if (n.tbl && !(lc(n.tbl) === lc(t.name))) { /* alias comprobado al evaluar */ } } }); }

  // ---- SELECT ----
  select(p) {
    p.expectW('SELECT'); const distinct = p.eatW('DISTINCT'); p.eatW('ALL');
    const items = []; const ep = new ExprParser(p);
    for (;;) {
      if (p.isP('*')) { p.next(); items.push({star: true}); }
      else { const start = p.i; const e = ep.expr(); let alias = null;
        if (p.eatW('AS')) { const a = p.next(); if (!a || (a.t !== 'w' && a.t !== 'q' && a.t !== 's')) throw new SqlError('Tras AS falta el nombre del alias'); alias = a.v; }
        else if (p.peek() && (p.peek().t === 'q' || (p.peek().t === 'w' && !CLAUSE_END.has(p.peek().u)) || p.peek().t === 's')) { alias = p.next().v; }
        const label = alias || p.t.slice(start, p.i).map(x => x.t === 's' ? `'${x.v}'` : x.v).join(' ').replace(/ ?([(),.]) ?/g, '$1').replace(/\( /g, '(');
        items.push({e, alias, label}); }
      if (p.eatP(',')) continue; break;
    }
    let t = null, talias = null;
    if (p.eatW('FROM')) {
      const tn = p.ident('tras FROM'); t = this.table(tn);
      if (p.eatW('AS')) talias = p.ident(); else if (p.peek() && p.peek().t !== 'p' && !CLAUSE_END.has(p.peek().u || '') ) talias = p.ident();
      if (p.isP(',') || p.isW('JOIN') || p.isW('INNER') || p.isW('LEFT') || p.isW('RIGHT') || p.isW('CROSS')) throw new SqlError('En esta parte las consultas son de UNA sola tabla (sin JOIN ni varias tablas en el FROM)');
    } else if (!p.done) { const x = p.peek(); throw new SqlError(`Tras la lista de columnas no se entiende «${x.v}».${typoHint(x) || ' Falta FROM antes del nombre de la tabla.'}`, x.pos); }
    else if (items.some(i => i.star)) throw new SqlError('SELECT * necesita un FROM');
    let where = null, groupBy = [], having = null, orderBy = [], limit = null, offset = 0;
    if (p.eatW('WHERE')) where = ep.expr();
    if (p.eatW('GROUP')) { p.expectW('BY', 'tras GROUP'); for (;;) { groupBy.push(ep.expr()); if (p.eatP(',')) continue; break; } }
    if (p.eatW('HAVING')) having = ep.expr();
    if (p.eatW('ORDER')) { p.expectW('BY', 'tras ORDER'); for (;;) { const e = ep.expr(); let dir = 1; if (p.eatW('DESC')) dir = -1; else p.eatW('ASC'); orderBy.push({e, dir}); if (p.eatP(',')) continue; break; } }
    if (p.eatW('LIMIT')) { const a = p.next(); if (!a || a.t !== 'n') throw new SqlError('LIMIT necesita un número'); if (p.eatP(',')) { offset = +a.v; const b = p.next(); if (!b || b.t !== 'n') throw new SqlError('LIMIT necesita un número'); limit = +b.v; } else { limit = +a.v; if (p.eatW('OFFSET')) offset = +p.next().v; } }
    if (!p.done) {
      const x = p.peek();
      if (x.t === 'w' && ['FROM', 'WHERE', 'GROUP', 'HAVING', 'ORDER', 'LIMIT'].includes(x.u)) throw new SqlError(`${x.u} está en un sitio incorrecto: el orden es SELECT ... FROM ... WHERE ... GROUP BY ... HAVING ... ORDER BY ... LIMIT`, x.pos);
      throw new SqlError(`No se entiende «${x.v}» (sobra algo o falta una coma/operador).${typoHint(p.t[p.i - 1]) ? ' Antes aparece «' + p.t[p.i - 1].v + '»:' + typoHint(p.t[p.i - 1]) : ''}`, x.pos);
    }
    if (!t) { // SELECT sin tabla
      const cx0 = this.mkCx({name: '', cols: []}, {}, {where: 'SELECT'});
      return {kind: 'select', cols: items.map(i => i.label), rows: [items.map(i => ev(i.e, cx0))], ordered: false};
    }
    const aliases = new Map(); items.forEach(i => { if (i.alias) aliases.set(lc(i.alias), i.e); });
    const aliasNames = new Set(aliases.keys());
    const baseCx = (row, where, extra) => this.mkCx(t, row, Object.assign({where, talias, aliases: null, aliasNames}, extra || {}));
    // WHERE
    let rows = t.rows;
    if (where) { rows = rows.filter(r => bool3(ev(where, baseCx(r, 'WHERE', {noAgg: true}))) === true); }
    // ¿agrupa?
    const aggregated = groupBy.length > 0 || items.some(i => i.e && hasAgg(i.e)) || (having && hasAgg(having)) || orderBy.some(o => hasAgg(o.e));
    const star = items.filter(i => i.star).length; let outItems = [];
    items.forEach(i => { if (i.star) t.cols.forEach(c => outItems.push({e: {k: 'col', name: c.name}, label: c.name, alias: null})); else outItems.push(i); });
    const resolveAlias = e => (e.k === 'col' && !e.tbl && aliases.has(lc(e.name)) && !t.cols.some(c => lc(c.name) === lc(e.name))) ? aliases.get(lc(e.name)) : e;
    let projected = [];  // {vals, keys}
    if (aggregated) {
      if (star) throw new SqlError('SELECT * no se puede combinar con funciones de agregado / GROUP BY');
      const gExprs = groupBy.map(g => (g.k === 'lit' && isNum(g.v) ? outItems[g.v - 1].e : resolveAlias(g)));
      // ONLY_FULL_GROUP_BY
      const gcols = new Set(gExprs.filter(g => g.k === 'col').map(g => lc(g.name)));
      const pkCovered = t.pk.length && t.pk.every(c => gcols.has(lc(c)));
      const bare = (node, label) => { if (!node || pkCovered) return; (function w(n, inAgg) { if (!n) return; if (n.k === 'agg') return; if (n.k === 'col' && !(aliases.has(lc(n.name)) && !t.cols.some(c => lc(c.name) === lc(n.name)))) { if (!gcols.has(lc(n.name))) throw new SqlError(`'${n.name}' aparece en ${label} sin función de agregado y no está en el GROUP BY (MySQL: only_full_group_by). Con GROUP BY, el SELECT solo puede llevar las columnas agrupadas y funciones como COUNT/SUM/AVG/MIN/MAX.`); }
        ['a', 'b', 'lo', 'hi', 'pat', 'operand', 'els'].forEach(k => n[k] && w(n[k])); (n.args || []).forEach(x => w(x)); (n.list || []).forEach(x => w(x)); (n.whens || []).forEach(x => { w(x[0]); w(x[1]); }); })(node); };
      outItems.forEach((i, ix) => { if (!gExprs.some(g => JSON.stringify(g) === JSON.stringify(i.e))) bare(i.e, `el SELECT (columna ${ix + 1})`); });
      if (having) bare(resolveAlias(having), 'HAVING'); orderBy.forEach(o => { if (!(o.e.k === 'lit' && isNum(o.e.v))) bare(resolveAlias(o.e), 'ORDER BY'); });
      // grupos
      const groups = new Map();
      if (!gExprs.length) groups.set('', rows);
      else rows.forEach(r => { const cx = baseCx(r, 'GROUP BY', {noAgg: true}); const k = gExprs.map(g => { const v = ev(g, cx); return v === null ? '∅' : isNum(v) ? 'n' + v : 's' + fold(v); }).join('\u0001'); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(r); });
      for (const [, g] of groups) {
        const row0 = g[0] || {}; const cx = baseCx(row0, 'la consulta'); cx.grp = g; cx.aliases = aliases;
        if (having) { const hv = bool3(ev(having, cx)); if (hv !== true) continue; }
        const vals = outItems.map(i => ev(i.e, cx));
        const keys = orderBy.map(o => (o.e.k === 'lit' && isNum(o.e.v)) ? vals[o.e.v - 1] : ev(o.e, cx));
        projected.push({vals, keys});
      }
    } else {
      if (having) throw new SqlError('HAVING sin GROUP BY ni agregados: para filtrar filas se usa WHERE');
      rows.forEach(r => { const cx = baseCx(r, 'el SELECT'); cx.aliases = aliases; const vals = outItems.map(i => ev(i.e, cx));
        const keys = orderBy.map(o => (o.e.k === 'lit' && isNum(o.e.v)) ? vals[o.e.v - 1] : ev(o.e, (() => { const c2 = baseCx(r, 'ORDER BY'); c2.aliases = aliases; return c2; })()));
        projected.push({vals, keys}); });
    }
    orderBy.forEach(o => { if (o.e.k === 'lit' && isNum(o.e.v) && (o.e.v < 1 || o.e.v > outItems.length)) throw new SqlError(`ORDER BY ${o.e.v}: no hay columna ${o.e.v} en el SELECT`); });
    if (orderBy.length) projected = projected.map((x, i) => ({...x, i})).sort((a, b) => { for (let k = 0; k < orderBy.length; k++) { const c = orderCmp(a.keys[k], b.keys[k]); if (c) return c * orderBy[k].dir; } return a.i - b.i; });
    let out = projected.map(x => x.vals);
    if (distinct) { const seen = new Set(); out = out.filter(r => { const k = r.map(v => v === null ? '∅' : isNum(v) ? 'n' + v : 's' + fold(v)).join('\u0001'); if (seen.has(k)) return false; seen.add(k); return true; }); }
    if (limit !== null) out = out.slice(offset, offset + limit);
    return {kind: 'select', cols: outItems.map(i => i.alias || i.label), rows: out, ordered: orderBy.length > 0, table: t.name};
  }

  // ---- INSERT ----
  insert(p, seed) {
    p.expectW('INSERT'); p.eatW('IGNORE'); p.eatW('INTO'); const t = this.table(p.ident('tras INSERT INTO'));
    let cols = null;
    if (p.isP('(')) { p.next(); cols = []; for (;;) { cols.push(p.ident('en la lista de columnas')); if (p.eatP(',')) continue; break; } p.expectP(')', 'al cerrar la lista de columnas'); }
    if (p.isW('SELECT')) throw new SqlError('INSERT ... SELECT no entra en esta parte');
    if (!p.eatW('VALUES') && !p.eatW('VALUE')) throw new SqlError(`En un INSERT falta la palabra VALUES antes de los datos (INSERT INTO ${t.name} (...) VALUES (...))`, p.peek()?.pos);
    const ep = new ExprParser(p); const tuples = [];
    for (;;) { p.expectP('(', 'antes de los valores'); const vs = []; if (!p.isP(')')) for (;;) { vs.push(p.isW('DEFAULT') ? (p.next(), {k: 'def'}) : ep.expr()); if (p.eatP(',')) continue; break; } p.expectP(')', 'al cerrar los valores'); tuples.push(vs); if (p.eatP(',')) continue; break; }
    if (!p.done) throw new SqlError(`Sobra ${p.peek().v} al final del INSERT`, p.peek().pos);
    const colDefs = cols ? cols.map(n => { const c = t.cols.find(c => lc(c.name) === lc(n)); if (!c) throw new SqlError(`La columna '${n}' no existe en ${t.name}. Columnas: ${t.cols.map(c => c.name).join(', ')}`); return c; }) : t.cols;
    if (cols && new Set(cols.map(lc)).size !== cols.length) throw new SqlError('Hay una columna repetida en la lista del INSERT');
    const snap = t.rows.length, autoSnap = t.auto; let n = 0; const cx0 = this.mkCx({name: '', cols: []}, {}, {where: 'VALUES', noAgg: true});
    try {
      tuples.forEach((vs, ri) => {
        if (vs.length !== colDefs.length) throw new SqlError(`El INSERT indica ${colDefs.length} columna(s) pero la fila ${ri + 1} trae ${vs.length} valor(es) (Column count doesn't match value count)`);
        const row = {}; t.cols.forEach(c => row[lc(c.name)] = undefined);
        colDefs.forEach((c, i) => { const v = vs[i].k === 'def' ? undefined : ev(vs[i], cx0); row[lc(c.name)] = v; });
        this.finishRow(t, row, null);
        t.rows.push(row); n++;
        this.checkRow(t, row, row);
      });
    } catch (e) { t.rows.length = snap; t.auto = autoSnap; throw e; }
    return {kind: 'dml', op: 'INSERT', affected: n, table: t.name};
  }
  finishRow(t, row, old) {    // rellena defaults / AUTO_INCREMENT, coacciona tipos y comprueba NOT NULL
    t.cols.forEach(c => { const k = lc(c.name); let v = row[k];
      if (v === undefined) { if (c.auto) v = t.auto++; else if (c.hasDefault) v = typeof c.def === 'string' && c.def[0] === '#' ? (c.def === '#CURRENT_TIMESTAMP' ? TODAY + ' 12:00:00' : null) : c.def; else if (c.notNull || c.pk) throw new SqlError(`'${c.name}' no tiene valor y no admite NULL ni tiene DEFAULT (Field '${c.name}' doesn't have a default value)`); else v = null; }
      else if (c.auto && (v === null || v === 0)) v = t.auto++;
      if (v === null && (c.notNull || c.pk)) throw new SqlError(`'${c.name}' no admite NULL (es NOT NULL o forma parte de la clave primaria)`);
      if (v !== null) { v = coerce(c, v, t.name); if (c.auto && isNum(v) && v >= t.auto) t.auto = v + 1; }
      row[k] = v; });
  }
  checkRow(t, row, self) {     // únicos, CHECK y claves ajenas
    const others = t.rows.filter(r => r !== self);
    const keyOf = (r, cs) => cs.map(c => r[lc(c)]);
    const dup = (cs, label) => { const kv = keyOf(row, cs); if (kv.some(v => v === null)) return; if (others.some(r => keyOf(r, cs).every((v, i) => cmpVals(v, kv[i]) === 0))) throw new SqlError(`Valor duplicado (${kv.map(fmt).join(', ')}) en ${label} de ${t.name} (Duplicate entry)`); };
    if (t.pk.length) dup(t.pk, 'la clave primaria'); t.uniques.forEach(u => dup(u.cols, 'una columna UNIQUE (' + u.cols.join(', ') + ')'));
    t.checks.forEach(ch => { const cx = this.mkCx(t, row, {where: 'CHECK', noAgg: true}); if (bool3(ev(ch, cx)) === false) throw new SqlError(`La fila no cumple una restricción CHECK de ${t.name} (Check constraint is violated)`); });
    if (!this.loading) t.fks.forEach(f => { const v = keyOf(row, f.cols); if (v.some(x => x === null)) return; const R = this.table(f.ref); const rc = f.refCols || R.pk;
      if (!R.rows.some(r => keyOf(r, rc).every((x, i) => cmpVals(x, v[i]) === 0))) throw new SqlError(`Clave ajena: ${t.name}(${f.cols.join(', ')}) = (${v.map(fmt).join(', ')}) no existe en ${R.name} (Cannot add or update a child row: a foreign key constraint fails)`); });
  }

  // ---- UPDATE ----
  update(p) {
    p.expectW('UPDATE'); const tn = p.ident('tras UPDATE'); const t = this.table(tn); let talias = null; if (p.eatW('AS')) talias = p.ident(); else if (p.peek() && p.peek().t !== 'p' && !p.isW('SET')) talias = p.ident();
    if (!p.eatW('SET')) throw new SqlError(`En un UPDATE falta SET: UPDATE ${t.name} SET columna = valor WHERE ...`, p.peek()?.pos);
    const ep = new ExprParser(p); const sets = [];
    for (;;) { const c = p.ident('en SET'); let cn = c; if (p.eatP('.')) cn = p.ident(); if (!p.eatP('=')) throw new SqlError(`En SET falta '=' tras ${cn}`, p.peek()?.pos); sets.push([cn, ep.expr()]); if (p.eatP(',')) continue; break; }
    let where = null, limit = null, orderBy = [];
    if (p.eatW('WHERE')) where = ep.expr();
    if (p.eatW('ORDER')) { p.expectW('BY'); for (;;) { const e = ep.expr(); let dir = 1; if (p.eatW('DESC')) dir = -1; else p.eatW('ASC'); orderBy.push({e, dir}); if (p.eatP(',')) continue; break; } }
    if (p.eatW('LIMIT')) limit = +p.next().v;
    if (!p.done) throw new SqlError(`Sobra ${p.peek().v} al final del UPDATE (¿falta una coma en SET o un AND en el WHERE?)`, p.peek().pos);
    sets.forEach(([c]) => { if (!t.cols.some(x => lc(x.name) === lc(c))) throw new SqlError(`La columna '${c}' no existe en ${t.name}`); });
    const snapshot = t.rows.map(r => ({...r})); let n = 0;
    try {
      let targets = t.rows.filter(r => !where || bool3(ev(where, this.mkCx(t, r, {where: 'WHERE', talias, noAgg: true}))) === true);
      if (orderBy.length) targets = targets.map((r, i) => ({r, i, k: orderBy.map(o => ev(o.e, this.mkCx(t, r, {where: 'ORDER BY', talias})))})).sort((a, b) => { for (let j = 0; j < orderBy.length; j++) { const c = orderCmp(a.k[j], b.k[j]); if (c) return c * orderBy[j].dir; } return a.i - b.i; }).map(x => x.r);
      if (limit !== null) targets = targets.slice(0, limit);
      targets.forEach(r => {
        const old = {...r};
        sets.forEach(([c, e]) => { const col = t.cols.find(x => lc(x.name) === lc(c)); let v = ev(e, this.mkCx(t, r, {where: 'SET', talias, noAgg: true})); if (v === null && (col.notNull || col.pk)) throw new SqlError(`'${col.name}' no admite NULL (NOT NULL)`); if (v !== null) v = coerce(col, v, t.name); r[lc(c)] = v; });
        const changed = t.cols.some(c => cmpVals(old[lc(c.name)], r[lc(c.name)]) !== 0 && !(old[lc(c.name)] === null && r[lc(c.name)] === null));
        if (changed) { this.checkRow(t, r, r); this.onParentChange(t, old, r); n++; }
      });
    } catch (e) { t.rows = snapshot; throw e; }
    return {kind: 'dml', op: 'UPDATE', affected: n, matched: undefined, table: t.name};
  }
  childRefs(t) { const out = []; for (const k in this.tables) { const C = this.tables[k]; C.fks.forEach(f => { if (lc(f.ref) === lc(t.name)) out.push({C, f}); }); } return out; }
  onParentChange(t, old, now) {  // cambio de clave referenciada
    this.childRefs(t).forEach(({C, f}) => { const rc = f.refCols || t.pk; if (rc.every(c => cmpVals(old[lc(c)], now[lc(c)]) === 0)) return;
      const kids = C.rows.filter(r => f.cols.every((c, i) => cmpVals(r[lc(c)], old[lc(rc[i])]) === 0));
      if (!kids.length) return;
      if (f.onUpdate === 'CASCADE') kids.forEach(r => f.cols.forEach((c, i) => r[lc(c)] = now[lc(rc[i])]));
      else throw new SqlError(`No se puede cambiar la clave de ${t.name}: ${C.name} tiene filas que la referencian (Cannot delete or update a parent row: a foreign key constraint fails)`); });
  }

  // ---- DELETE ----
  del(p) {
    p.expectW('DELETE'); if (!p.eatW('FROM')) throw new SqlError('En un DELETE falta FROM: DELETE FROM tabla WHERE ...', p.peek()?.pos);
    const t = this.table(p.ident('tras DELETE FROM')); const ep = new ExprParser(p); let where = null, limit = null;
    if (p.eatW('WHERE')) where = ep.expr();
    if (p.eatW('ORDER')) { p.expectW('BY'); ep.expr(); p.eatW('ASC') || p.eatW('DESC'); }
    if (p.eatW('LIMIT')) limit = +p.next().v;
    if (!p.done) throw new SqlError(`Sobra ${p.peek().v} al final del DELETE`, p.peek().pos);
    const snap = {}; for (const k in this.tables) snap[k] = this.tables[k].rows.map(r => ({...r}));
    let targets = t.rows.filter(r => !where || bool3(ev(where, this.mkCx(t, r, {where: 'WHERE', noAgg: true}))) === true);
    if (limit !== null) targets = targets.slice(0, limit);
    try { targets.forEach(r => this.deleteRow(t, r)); } catch (e) { for (const k in snap) this.tables[k].rows = snap[k]; throw e; }
    return {kind: 'dml', op: 'DELETE', affected: targets.length, table: t.name};
  }
  deleteRow(t, row) {
    this.childRefs(t).forEach(({C, f}) => { const rc = f.refCols || t.pk;
      const kids = C.rows.filter(r => f.cols.every((c, i) => cmpVals(r[lc(c)], row[lc(rc[i])]) === 0));
      if (!kids.length) return;
      if (f.onDelete === 'CASCADE') kids.forEach(k => this.deleteRow(C, k));
      else if (f.onDelete === 'SET NULL') kids.forEach(k => f.cols.forEach(c => k[lc(c)] = null));
      else throw new SqlError(`No se puede borrar de ${t.name}: ${C.name} tiene filas que dependen de ella (Cannot delete or update a parent row: a foreign key constraint fails). Habría que borrar antes las filas de ${C.name}.`); });
    const i = t.rows.indexOf(row); if (i >= 0) t.rows.splice(i, 1);
  }
}
SQL.Engine = Engine;

// ---------- comparación de resultados ----------
const canon = v => v === null || v === undefined ? '∅' : isNum(v) ? 'n' + (+v.toFixed(5)) : 's' + String(v);
const rowKey = r => r.map(canon).join('\u0001');
function sameRows(a, b, ordered) {
  if (a.length !== b.length) return false;
  if (ordered) return a.every((r, i) => rowKey(r) === rowKey(b[i]));
  const m = new Map(); b.forEach(r => m.set(rowKey(r), (m.get(rowKey(r)) || 0) + 1));
  for (const r of a) { const k = rowKey(r); if (!m.get(k)) return false; m.set(k, m.get(k) - 1); } return true;
}
function stateOf(eng) { const o = {}; for (const k in eng.tables) o[k] = eng.tables[k].rows.map(r => eng.tables[k].cols.map(c => r[lc(c.name)])); return o; }

// Corrige una respuesta de DML contra una o varias soluciones válidas.
//   task: {db, kind:'select'|'write', ref: 'SQL' | ['SQL1','SQL2'], ordered?:bool, aliases?:['nombre_completo']}
//   makeEngine(dbName) -> Engine nuevo con los datos de ejemplo
function gradeDml(task, userSql, makeEngine) {
  const refs = [].concat(task.ref); const res = {ok: false, msgs: [], user: null, ref: null, error: null};
  let user;
  const eu = makeEngine(task.db);
  try { const rs = eu.execAll(userSql); if (!rs.length) throw new SqlError('No has escrito ninguna sentencia'); user = rs; } catch (e) { if (e instanceof SqlError) { res.error = e.message; return res; } throw e; }
  const last = user[user.length - 1];
  if (task.kind === 'select') {
    if (user.length > 1) { res.msgs.push('Se pedía UNA sola consulta.'); }
    if (last.kind !== 'select') { res.msgs.push('Esto no es una consulta SELECT: no devuelve filas.'); return res; }
    res.user = last; let best = null;
    for (const r of refs) { const er = makeEngine(task.db); const rr = er.execAll(r).pop(); res.ref = res.ref || rr; const ordered = task.ordered !== undefined ? task.ordered : rr.ordered;
      if (rr.cols.length === last.cols.length && sameRows(last.rows, rr.rows, ordered)) { best = rr; res.ref = rr; res.ok = true; break; } }
    if (res.ok) {
      if (task.aliases) task.aliases.forEach((a, i) => { if (lc(last.cols[i] || '') !== lc(a)) { res.ok = false; res.msgs.push(`El resultado es correcto, pero la columna ${i + 1} debía llamarse «${a}» (alias con AS) y se llama «${last.cols[i] || '?'}».`); } });
      return res;
    }
    const rr = res.ref;
    if (rr.cols.length !== last.cols.length) res.msgs.push(`Devuelves ${last.cols.length} columna(s) y se piden ${rr.cols.length}.`);
    if (rr.rows.length !== last.rows.length) res.msgs.push(`Devuelves ${last.rows.length} fila(s) y deberían salir ${rr.rows.length}.`);
    else if (rr.cols.length === last.cols.length) {
      if (sameRows(last.rows, rr.rows, false)) res.msgs.push('Las filas son las correctas pero el ORDEN no coincide con el pedido (revisa ORDER BY y ASC/DESC).');
      else res.msgs.push('Hay el mismo número de filas pero los valores no coinciden (revisa el WHERE, las columnas y los cálculos).');
    }
    return res;
  }
  // consultas de modificación: se compara el estado final de toda la base
  let bestState = null;
  const su = stateOf(eu); res.user = {kind: 'dml', affected: last.affected, op: last.op};
  for (const r of refs) { const er = makeEngine(task.db); const rrs = er.execAll(r); const sr = stateOf(er); bestState = bestState || {sr, er, rrs};
    if (Object.keys(sr).every(k => sameRows(su[k], sr[k], false))) { res.ok = true; res.ref = {kind: 'dml', affected: rrs[rrs.length - 1].affected}; return res; } }
  const {sr, rrs} = bestState; res.ref = {kind: 'dml', affected: rrs[rrs.length - 1].affected};
  Object.keys(sr).forEach(k => { if (!sameRows(su[k], sr[k], false)) { const t = eu.tables[k];
    res.msgs.push(`La tabla ${t.name} no queda como debería: tiene ${su[k].length} fila(s) y deberían ser ${sr[k].length}.`);
    const want = new Map(); sr[k].forEach(r => want.set(rowKey(r), r)); const got = new Map(); su[k].forEach(r => got.set(rowKey(r), r));
    const extra = [...got.keys()].filter(x => !want.has(x)).slice(0, 3), miss = [...want.keys()].filter(x => !got.has(x)).slice(0, 3);
    if (extra.length) res.msgs.push('Filas que sobran/están mal: ' + extra.map(x => '(' + got.get(x).map(fmt).join(', ') + ')').join('  '));
    if (miss.length) res.msgs.push('Filas que faltan/deberían estar: ' + miss.map(x => '(' + want.get(x).map(fmt).join(', ') + ')').join('  ')); } });
  return res;
}
SQL.gradeDml = gradeDml;

})(typeof globalThis !== 'undefined' ? globalThis : window);
