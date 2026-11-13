# Examen de práctica — Bases de Datos (formato real del examen)

> Resuélvelo primero sin mirar las soluciones (están en `03-soluciones.md`).
> Tiempo estimado: 90 minutos.

---

## ENUNCIADO — Taller mecánico "El Tornillo Feliz"

Un taller mecánico quiere gestionar sus reparaciones. Del análisis con el cliente se han recogido estas **reglas de negocio**:

1. De cada **cliente** guardamos: nombre, NIF (no puede repetirse), teléfono y fecha de alta. Todo cliente tiene NIF.
2. De cada **vehículo** guardamos: matrícula (no puede repetirse), marca, modelo y año. Un vehículo pertenece siempre a un cliente, y un cliente **puede** tener varios vehículos. Un vehículo solo puede pertenecer a un cliente.
3. De cada **reparación** guardamos: un número de orden interno, la fecha de entrada y la fecha de salida (puede no haber salido aún). Toda reparación se hace sobre **un único vehículo**, y un vehículo puede tener muchas reparaciones. Toda reparación está asociada a un vehículo (no se reparan coches "fantasma").
4. De cada **pieza** guardamos: un código de pieza (no se repite), descripción, precio unitario y stock.
5. Una reparación **utiliza** piezas. De cada pieza utilizada interesa saber **cuántas unidades** se usaron en esa reparación. Una reparación puede no llevar todavía ninguna pieza, y una pieza puede no haberse usado nunca. Una pieza se puede usar varias veces (en distintas reparaciones) y una reparación puede llevar varias piezas.
6. De cada **mecánico** guardamos: nombre, DNI (no se repite), especialidad y sueldo. Cada reparación la dirige **exactamente un mecánico** (el responsable), y un mecánico puede no dirigir ninguna reparación.
7. El taller usa un **número de orden** (único) y también un identificador interno numérico para cada reparación.

---

## PARTE 1 — Diseño conceptual (E/R)

**Tarea 1.1.** Dibuja el diagrama **E/R en notación Chen con (min,max)** que represente todas las reglas. Incluye entidades, atributos (marcando los identificadores) y relaciones con sus cardinalidades.

**Tarea 1.2.** Justifica **con las reglas del enunciado** los (min,max) de las relaciones `conduce/posee` (cliente–vehículo), `sobre` (vehículo–reparación) y `dirige` (mecánico–reparación).

**Tarea 1.3.** Indica qué relación es **N:M** y qué **atributo** tiene esa relación.

---

## PARTE 2 — Paso a tablas (análisis de claves)

> La sintaxis SQL no es lo importante: **analiza bien las claves**. Usa la notación de marco (`CP`, `C.Alt`, `C.Aj`, `VNN`).

**Tarea 2.1.** Escribe el **esquema lógico en notación de marco** de todas las tablas necesarias.

**Tarea 2.2.** Para la tabla intermedia (si la hay) y para `REPARACION`, justifica explícitamente:
- a) Qué columnas forman la **CP** y por qué son únicas, mínimas y no nulas.
- b) Qué **C.Alt** hay y por qué.
- c) Qué **C.Aj** hay, a qué tabla y a qué clave exacta apuntan, y cuáles deben ser **VNN** según los mínimos del E/R.

**Tarea 2.3.** ¿Podría usarse el `numero_orden` como CP de REPARACION en lugar del `id`? Justifica.

---

## PARTE 3 — Consultas: validación de sentencias

### 3.A — DDL (varias tablas): di por qué está MAL cada sentencia

> Dado el enunciado de la Parte 1, un compañero ha escrito este script. Contiene **13 errores** (la versión anterior decía 8, pero había más). En campo libre, identifica cada error y explica **por qué está mal** (la sintaxis puede ser válida: busca el error de **significado** respecto al enunciado y a las claves).

```sql
CREATE TABLE cliente (
  id            INT AUTO_INCREMENT,
  nombre        VARCHAR(80) NOT NULL,
  nif           CHAR(9),
  telefono      VARCHAR(15),
  fecha_alta    DATE,
  PRIMARY KEY (id)
);

CREATE TABLE vehiculo (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  matricula    CHAR(7),
  marca        VARCHAR(40) NOT NULL,
  modelo       VARCHAR(40) NOT NULL,
  anio         INT,
  cliente_id   INT,
  PRIMARY KEY (id)
);

CREATE TABLE reparacion (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  numero_orden  VARCHAR(10) NOT NULL,
  fecha_entrada DATE,
  fecha_salida  DATE,
  vehiculo_id   INT NOT NULL,
  mecanico_id   INT,
  PRIMARY KEY (id)
);

CREATE TABLE mecanico (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  dni           CHAR(9) NOT NULL,
  nombre        VARCHAR(80) NOT NULL,
  especialidad  VARCHAR(40),
  sueldo        DECIMAL(8,2)
);

CREATE TABLE pieza (
  codigo       VARCHAR(10),
  descripcion  VARCHAR(100) NOT NULL,
  precio_ud    DECIMAL(8,2) NOT NULL,
  stock        INT NOT NULL
);

CREATE TABLE reparacion_pieza (
  reparacion_id INT NOT NULL,
  pieza_id      INT NOT NULL,
  unidades      INT NOT NULL,
  PRIMARY KEY (reparacion_id)
);

ALTER TABLE reparacion
  ADD FOREIGN KEY (vehiculo_id) REFERENCES pieza(id);
```

### 3.B — DML (una sola tabla): di por qué está MAL cada sentencia

> Todas las sentencias trabajan **solo sobre la tabla REPARACION**, pero fallan por la **existencialidad** de los valores (lo que ya existe, lo que debe existir, lo de lo que depende). El script correcto de la Parte 3.A ha creado las tablas y hay estos datos:

```
REPARACION
id | numero_orden | fecha_entrada | fecha_salida | vehiculo_id | mecanico_id
1  |  R-001       | 2026-11-01    | NULL         | 10          | 5
2  |  R-002       | 2026-11-03    | 2026-11-05   | 11          | NULL
3  |  R-003       | 2026-11-08    | NULL         | 12          | 5

VEHICULO (resumen): ids 10, 11, 12
MECANICO (resumen): ids 5, 6
```

```sql
-- (1)
INSERT INTO reparacion (id, numero_orden, fecha_entrada, vehiculo_id, mecanico_id)
VALUES (2, 'R-004', '2026-11-10', 10, 5);

-- (2)
INSERT INTO reparacion (numero_orden, fecha_entrada, vehiculo_id)
VALUES ('R-005', '2026-11-10', 99);

-- (3)
UPDATE reparacion SET fecha_salida = '2026-11-11';

-- (4)
DELETE FROM reparacion WHERE id = 1;

-- (5)
INSERT INTO reparacion (numero_orden, fecha_entrada, vehiculo_id, mecanico_id)
VALUES ('R-006', '2026-11-10', 10, 7);

-- (6)
SELECT numero_orden, mecanico_id, COUNT(*) AS total
FROM reparacion
WHERE fecha_salida = NULL
GROUP BY numero_orden;
```
