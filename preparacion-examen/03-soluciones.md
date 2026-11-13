# Soluciones — Examen de práctica

---

## PARTE 1 — E/R (solución)

### Tarea 1.1 — Diagrama (en texto; en el examen se dibuja)

```
CLIENTE ──<posee>── VEHICULO ──<sobre>── REPARACION <──dirige── MECANICO
                                                        |
                                                    <utiliza>
                                                        |
                                                      PIEZA

CLIENTE (id, nombre, nif*, telefono, fecha_alta)        * = identificador natural (C.Alt)
VEHICULO (id, matricula*, marca, modelo, anio)
REPARACION (id, numero_orden*, fecha_entrada, fecha_salida)
MECANICO (id, dni*, nombre, especialidad, sueldo)
PIEZA (codigo*, descripcion, precio_ud, stock)
```

**Relaciones y (min,max) — leídos de cada lado hacia el otro:**

| Relación | Lado A → B | Lado B → A | Justificación |
|---|---|---|---|
| CLIENTE —posee— VEHICULO | CLIENTE (1,1) — (0,N) VEHICULO | VEHICULO (0,N)... → ver abajo | Todo vehículo tiene 1 cliente (regla 2: "pertenece siempre"); un cliente puede tener 0..N vehículos |
| VEHICULO —sobre— REPARACION | VEHICULO (0,1) — (1,N) REPARACION | Toda reparación está sobre exactamente 1 vehículo (regla 3); un vehículo puede tener 0 reparaciones |
| MECANICO —dirige— REPARACION | MECANICO (0,1) — (1,1) REPARACION | Cada reparación la dirige exactamente 1 mecánico (regla 6); un mecánico puede no dirigir ninguna |
| REPARACION —utiliza— PIEZA | (0,N) — (0,N) | N:M (regla 5); atributo: **unidades** |

### Tarea 1.2 — Justificación de los (min,max)

- **posee (cliente–vehículo)**: regla 2 dice "un vehículo pertenece **siempre** a un cliente" → desde el lado VEHICULO el min es **1** y el max **1** (solo un cliente). "Un cliente **puede** tener varios vehículos" → desde CLIENTE, (0,N): el 0 porque puede no tener ninguno, el N porque puede tener muchos.
- **sobre (vehículo–reparación)**: regla 3 dice "toda reparación se hace sobre **un único vehículo**" → desde REPARACION, (1,1). "Un vehículo puede tener muchas reparaciones" → desde VEHICULO, (0,N).
- **dirige (mecánico–reparación)**: regla 6 dice "**exactamente un** mecánico" → desde REPARACION, (1,1) (participación total). "Un mecánico puede no dirigir ninguna" → desde MECANICO, (0,N).

### Tarea 1.3 — N:M

- **utiliza** (REPARACION—PIEZA) es N:M porque una reparación puede llevar varias piezas **y** una pieza puede usarse en varias reparaciones. Su **atributo** es `unidades` (no pertenece ni a la reparación sola ni a la pieza sola, sino a la combinación).

---

## PARTE 2 — Paso a tablas (solución)

### Tarea 2.1 — Esquema lógico en notación de marco

```
CLIENTE   = id + nif + nombre + telefono + fecha_alta
CP(id)
C.Alt(nif)
VNN(nombre)   VNN(nif)

VEHICULO  = id + matricula + marca + modelo + anio + cliente_id
CP(id)
C.Alt(matricula)
C.Aj(cliente_id) → CLIENTE(id)
VNN(cliente_id)      -- "pertenece siempre" → obligatoria
VNN(marca)     VNN(modelo)

REPARACION = id + numero_orden + fecha_entrada + fecha_salida + vehiculo_id + mecanico_id
CP(id)
C.Alt(numero_orden)
C.Aj(vehiculo_id) → VEHICULO(id)
C.Aj(mecanico_id) → MECANICO(id)
VNN(fecha_entrada)  VNN(vehiculo_id)   -- "toda reparación" → obligatorias
VNN(numero_orden)   VNN(mecanico_id)
-- fecha_salida NO es VNN: "puede no haber salido aún"
-- mecanico_id SÍ es VNN: "exactamente un mecánico" = participación obligatoria

MECANICO  = id + dni + nombre + especialidad + sueldo
CP(id)
C.Alt(dni)
VNN(nombre)   VNN(dni)

PIEZA     = codigo + descripcion + precio_ud + stock
CP(codigo)            -- el enunciado no da id artificial: el código es el identificador
VNN(descripcion) VNN(precio_ud) VNN(stock)

LINEA_UTILIZA = reparacion_id + pieza_codigo + unidades
CP(reparacion_id, pieza_codigo)       -- PK compuesta de la N:M
C.Aj(reparacion_id) → REPARACION(id)
C.Aj(pieza_codigo) → PIEZA(codigo)
VNN(unidades)
```

### Tarea 2.2 — Análisis de claves

**a) CP:**
- `LINEA_UTILIZA`: CP **compuesta** `(reparacion_id, pieza_codigo)`. Es **única** (no puede repetirse el par "esa reparación usa esa pieza"), **mínima** (quitar cualquiera de las dos columnas permitiría duplicados) y **no nula** (ambas son FKs obligatorias).
- `REPARACION`: CP `id` — única por ser AUTO_INCREMENT, mínima (una sola columna) y no nula.

**b) C.Alt:** `numero_orden` en REPARACION, `matricula` en VEHICULO, `nif` en CLIENTE, `dni` en MECANICO. Son identificadores del mundo real que el enunciado dice que "no se repiten" → `UNIQUE`. En PIEZA el código es directamente CP.

**c) C.Aj y obligatoriedad (VNN):**
| FK | Referencia | ¿VNN? | Por qué |
|---|---|---|---|
| VEHICULO.cliente_id | CLIENTE(id) | **Sí** | "pertenece **siempre** a un cliente" (min=1) |
| REPARACION.vehiculo_id | VEHICULO(id) | **Sí** | "toda reparación" (min=1) |
| REPARACION.mecanico_id | MECANICO(id) | **Sí** | "**exactamente un** mecánico" (min=1) |
| LINEA.reparacion_id | REPARACION(id) | Sí | Forman parte de la PK compuesta |
| LINEA.pieza_codigo | PIEZA(codigo) | Sí | Forman parte de la PK compuesta |

> **Regla de oro**: min=1 en el E/R ⇒ FK con NOT NULL (VNN). min=0 ⇒ puede ser NULL.

### Tarea 2.3 — ¿numero_orden como CP?

**Sí, sería válido**: es único (regla 7) y no nulo, cumple las 3 condiciones de PK. **Pero** el enunciado dice que "el taller usa un número de orden **y también** un identificador interno" → el diseño con `id` artificial es preferible porque: los códigos de negocio a veces cambian de formato (y la PK debe ser estable), y las FKs hacia REPARACION serían más pesadas como VARCHAR. Ambas opciones son correctas si se justifica; si se elige `numero_orden` como CP, entonces el `id` interno sería la `C.Alt`.

---

## PARTE 3 — Consultas (solución)

### 3.A — Los 8 errores del DDL

| # | Sentencia | ¿Por qué está MAL? |
|---|---|---|
| 1 | `CREATE TABLE cliente` — `nif CHAR(9)` sin NOT NULL | La regla 1 dice "**todo cliente tiene NIF**" y "no puede repetirse": falta `NOT NULL` (VNN) y `UNIQUE` (C.Alt). El identificador natural no está protegido. |
| 2 | `CREATE TABLE vehiculo` — `matricula CHAR(7)` sin UNIQUE/NOT NULL | La regla 2 dice que "no puede repetirse": falta `UNIQUE` (C.Alt). Dos vehículos con la misma matrícula serían aceptados. |
| 3 | `CREATE TABLE vehiculo` — `cliente_id` sin FK y sin NOT NULL | Falta la `C.Aj(cliente_id) → CLIENTE(id)`. Además, la regla 2 ("pertenece **siempre**") exige `NOT NULL` (VNN). Sin la FK se pueden crear vehículos "huérfanos". |
| 4 | `CREATE TABLE reparacion` — `fecha_entrada` sin NOT NULL | Toda reparación real tiene fecha de entrada; es un dato mínimo del enunciado (regla 3). |
| 5 | `CREATE TABLE reparacion` — `numero_orden` sin UNIQUE | La regla 7 dice que es **único**: falta `UNIQUE` (C.Alt). |
| 6 | `CREATE TABLE pieza` — PK declarada como `id` **que no existe** | La tabla PIEZA **no tiene columna `id`**: su identificador es `codigo`. Además `codigo VARCHAR(10)` aparece sin NOT NULL y sin PK. La PK debe declararse sobre `codigo`. |
| 7 | `CREATE TABLE reparacion_pieza` — `PRIMARY KEY (reparacion_id)` | La PK de la tabla intermedia de una N:M debe ser **compuesta**: `(reparacion_id, pieza_codigo)`. Tal como está, una reparación solo podría usar **una** pieza (¡viola la regla 5!). Además la columna se llama `pieza_id` pero PIEZA no tiene `id` — la FK debe apuntar a `pieza(codigo)`. Y faltan las dos FKs. |
| 8 | `ALTER TABLE reparacion ADD FOREIGN KEY (vehiculo_id) REFERENCES pieza(id)` | **La FK apunta a la tabla equivocada**: `vehiculo_id` debe referenciar `VEHICULO(id)`, no `PIEZA(id)`. Además, PIEZA no tiene columna `id`. La "existencialidad" falla: referenciarías filas de pieza donde debería haber vehículos. |

*(Extra: el orden de creación no provoca error aquí porque las FKs se añaden con ALTER al final, pero ojo: `reparacion_pieza` no declara FKs en su CREATE.)*

### 3.B — Los 6 errores del DML (existencialidad)

| # | Sentencia | ¿Por qué está MAL? |
|---|---|---|
| 1 | `INSERT ... VALUES (2, 'R-004', ..., 10, 5)` | El `id = 2` **ya existe** en REPARACION (fila de R-002). La PK no admite duplicados → error `Duplicate entry`. Además `numero_orden` es único y no hay problema con 'R-004', pero el `id` duplicado la mata. |
| 2 | `INSERT ... VALUES ('R-005', '2026-11-10', 99)` | El `vehiculo_id = 99` **no existe** en VEHICULO (solo hay 10, 11, 12). Es una FK → violación de integridad referencial. Es el caso puro de **existencialidad**: el valor referenciado debe existir antes. |
| 3 | `UPDATE reparacion SET fecha_salida = '2026-11-11'` | **Falta el WHERE**: actualiza **todas** las filas, incluyendo reparaciones que **aún no han salido** (fecha_salida debe seguir siendo NULL) y da una fecha de salida **anterior** a fechas de entrada posteriores. Un UPDATE sin WHERE casi siempre es un error. |
| 4 | `DELETE FROM reparacion WHERE id = 1` | La reparación id=1 es **referenciada** por la tabla intermedia `reparacion_pieza` (las líneas de piezas usadas). Sin `ON DELETE CASCADE`, el SGBD **rechaza el borrado** (integridad referencial). Primero habría que borrar las líneas que la referencian. |
| 5 | `INSERT ... VALUES ('R-006', '2026-11-10', 10, 7)` | El `mecanico_id = 7` **no existe** en MECANICO (solo hay 5 y 6). Violación de FK: el mecanico referenciado no existe. |
| 6 | `SELECT ... WHERE fecha_salida = NULL ... GROUP BY numero_orden` | Dos errores: ① **`= NULL` es siempre falso**: la existencia de NULL no se compara con `=`, hay que usar `IS NULL`. ② `mecanico_id` está en el SELECT pero **no en el GROUP BY** ni dentro de una función de agregación → error (o mezcla de filas distintas). Además, la consulta dice "las reparaciones sin salir" pero agrupa por número de orden ignorando el id: si `numero_orden` es único está bien, pero el objetivo de "por reparación" exige incluir `id` o agrupar por la PK. |

---

## Frases clave para el campo libre ("¿por qué está mal?")

- "**La FK referencia un valor que no existe en la tabla padre**" (integridad referencial).
- "**La PK es única y ese valor ya está en la tabla**" (duplicado).
- "**Esa columna es NOT NULL (VNN) y se está insertando NULL**".
- "**La FK debe apuntar a la PK/UNIQUE de la tabla referenciada, y apunta a otra cosa**".
- "**min=1 en el E/R significa participación obligatoria, por lo que la FK debe ser NOT NULL**".
- "**Sin WHERE el UPDATE/DELETE afecta a toda la tabla**".
- "**Una fila referenciada por otra tabla no puede borrarse sin tratar antes las referencias**".
- "**`= NULL` nunca es verdadero; para comprobar existencia de NULL se usa IS NULL**".
