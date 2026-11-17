// BDA-QUEST · genera el DDL modelo a partir del marco de un caso (para "DDL desde cero" y las soluciones).
(function (root) {
'use strict';
const BQ = root.BQ = root.BQ || {};
const lc = s => String(s).toLowerCase();

function guessType(name) {
  const n = lc(name);
  if (/^(dni|nif|cif)/.test(n) || /^dni_/.test(n)) return 'CHAR(9)';
  if (/^nss/.test(n)) return 'CHAR(12)';
  if (/matricula/.test(n)) return 'CHAR(7)';
  if (/^cp$|codigo_postal/.test(n)) return 'CHAR(5)';
  if (/telefono|movil/.test(n)) return 'VARCHAR(15)';
  if (/email|correo/.test(n)) return 'VARCHAR(120)';
  if (/fecha_hora/.test(n)) return 'DATETIME';
  if (/^fecha|fecha_/.test(n)) return 'DATE';
  if (/metros|precio|importe|salario|sueldo|horas|descuento|pendiente|premio/.test(n)) return 'DECIMAL(8,2)';
  if (/^(edad|anio|stock|cantidad|unidades|km|altura|aforo|duracion|cupo|num_butaca|capacidad|planta|num_|numero|netapa|dorsal|codigo_depto|codigo_empresa|codigo_trabajador|codigo_rol|codigo_sala)/.test(n) || /^id($|_)/.test(n)) return /anio|edad|km|altura|aforo|duracion|cupo|butaca|planta|capacidad/.test(n) ? 'SMALLINT' : 'INT';
  if (/^codigo$/.test(n)) return 'VARCHAR(10)';
  if (/descripcion|diagnostico|tratamiento/.test(n)) return 'TEXT';
  return 'VARCHAR(60)';
}

// tables: marco del caso [{name, cols:[[nombre, marcas, tablaFK]]}] → texto SQL
function solutionDDL(tables, only) {
  const byName = n => tables.find(t => t.name === n);
  const pkOf = t => t.cols.filter(c => /P/.test(c[1])).map(c => c[0]);
  const typeCache = {};
  const typeOf = (t, c, depth = 0) => {
    const k = t.name + '.' + c[0]; if (typeCache[k]) return typeCache[k];
    let ty;
    if (c[2] && depth < 6) { const R = byName(c[2]); const rp = R ? pkOf(R) : []; const rc = R && R.cols.find(x => x[0] === (rp.length === 1 ? rp[0] : c[0])); ty = rc ? typeOf(R, rc, depth + 1) : guessType(c[0]); if (/AUTO/.test(ty)) ty = ty; }
    else ty = c[3] || guessType(c[0]);
    return typeCache[k] = ty;
  };
  let list = only ? tables.filter(t => only.includes(t.name)) : tables.slice();
  // orden: primero las tablas a las que otros apuntan
  const out = [], done = new Set();
  const add = t => { if (done.has(t.name)) return; done.add(t.name); t.cols.forEach(c => { if (c[2] && c[2] !== t.name) { const R = list.find(x => x.name === c[2]); if (R) add(R); } }); out.push(t); };
  list.forEach(add);
  return out.map(t => {
    const pk = pkOf(t), lines = [];
    t.cols.forEach(c => {
      let ty = typeOf(t, c); const single = pk.length === 1 && pk[0] === c[0] && !c[2];
      let s = `  ${c[0]} ${ty}`;
      if (single && /INT/.test(ty) && /^id/.test(lc(c[0]))) s += ' AUTO_INCREMENT';
      if (/V/.test(c[1]) || /P/.test(c[1])) s += ' NOT NULL';
      if (/A/.test(c[1])) s += ' UNIQUE';
      lines.push(s);
    });
    lines.push(`  PRIMARY KEY (${pk.join(', ')})`);
    t.cols.filter(c => c[2]).forEach(c => { const R = byName(c[2]); const rp = R ? pkOf(R) : []; lines.push(`  FOREIGN KEY (${c[0]}) REFERENCES ${lc(c[2])}(${rp.length === 1 ? rp[0] : c[0]})`); });
    return `CREATE TABLE ${lc(t.name)} (\n${lines.join(',\n')}\n);`;
  }).join('\n\n');
}
BQ.solutionDDL = solutionDDL;
BQ.guessType = guessType;
})(typeof globalThis !== 'undefined' ? globalThis : window);
