# Bases de Datos (1º DAW)

## BDA-QUEST — juego de estudio con el formato del examen

Abre **`BDA-QUEST.html`** en el navegador (un solo archivo, funciona sin internet).

**Examen completo = 3 partes**
1. **E/R conceptual**: entidades (en *singular*), atributos, (min,max), **reflexivas con rol**, **ternarias** y decisiones de modelado.
2. **Paso a tablas**: claves (CP, C.Alt, C.Aj, VNN) y **restricciones de existencialidad** (aserciones).
3. **Consultas**: **DDL** de varias tablas (validar y explicar el porqué + escribirlo **desde cero**) y **DML** de una tabla (**5 sentencias con error** para revisar + **1 desde cero**).

**Verificador**: ya no busca palabras. El DDL se analiza (PK, FK, NOT NULL, UNIQUE, orden de creación, tipos) y el DML se **ejecuta** sobre datos de ejemplo (huerto, ciclismo, instituto) comparando el resultado con la solución.

Casos: festival de cine y huerto (del examen real), consultora (ternaria), empresa (reflexiva), tienda, hospital, ciclismo, taller.

### Editar
Código en `bda-quest-src/` (`cases*.js`, `dml.js`, `tasks2.js`, `sqlcheck.js`, `sqlengine.js`…). Regenerar: `python3 bda-quest-src/build.py`.

## Material
- `dml-ddl/`: contenido del zip del examen lógico (boletines SQL, examen, scripts, DER).
- `archivos/Examen_Logico.zip`: zip original.
- `sql-quest/SQL_Quest_TDAH_v2.html`: primer juego de SQL (verificador antiguo, por palabras).
- `apuntes-bda/`, `preparacion-examen/`: apuntes y práctica.
