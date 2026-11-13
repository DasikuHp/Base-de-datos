# Guía de repaso — Preparación del examen de Bases de Datos

> Basada en los apuntes de dexpositofp.github.io/docencia/BDA
> Estructura del examen: **1) E/R conceptual · 2) Paso a tablas (claves) · 3) Consultas: validar DDL (varias tablas) + DML (una tabla)**

---

## PARTE 1 — Entidad/Relación (conceptual)

### Checklist de lo que hay que dominar

- **Entidades** (sustantivos con datos propios), **atributos** (propiedades), **relaciones** (verbos entre entidades).
- Notación **Chen** + **(min,max)**.
- **Cardinalidades**:
  - `1:N` → cada instancia del lado N se relaciona **como máximo** con una del lado 1 (min 0 = opcional, min 1 = obligatorio).
  - `N:M` → los dos lados tienen máximo N.
  - `1:1` → los dos lados tienen máximo 1.
- **Participación**: mínima 1 = participación **total/obligatoria** ("todo Cliente debe tener..."), mínima 0 = **parcial/opcional** ("puede no tener").
- **Entidad débil**: no puede existir sin su "dueña" (ej. LÍNEA_DE_PEDIDO no existe sin PEDIDO).
- **Atributos clave vs. atributos normales**: el identificador natural (DNI, matrícula, ISBN) se distingue del identificador artificial (`id`).
- **Atributos de la relación**: datos que no pertenecen a ninguna entidad sola (ej. `unidades` entre PEDIDO y PRODUCTO).

### Errores típicos en el examen

| Error | Cómo evitarlo |
|---|---|
| Confundir cardinalidad máxima con mínima | El **máximo** dice "cuántos a la vez" (1 o N); el **mínimo** dice "obligatorio u opcional" (0 o 1) |
| Poner (0,N) en el lado 1 de un 1:N | El lado 1 solo puede ser (0,1) o (1,1) |
| Crear una entidad para algo que es solo un dato | "Dirección" de cliente = atributo; "Sucursal" con datos propios = entidad |
| Olvidar los (min,max) en TODA relación | Repasa el diagrama entero antes de darlo por bueno |
| Dibujar atributos que ya están en otra entidad | Cada dato va en su entidad "dueña" (la fecha del pedido es de PEDIDO, no de CLIENTE) |

### Método recomendado (en 4 pasos)

1. **Subraya sustantivos** en el enunciado → candidatas a entidad (¿tiene datos propios?).
2. **Subraya verbos** → relaciones.
3. **Para cada relación, pregúntate**: ¿cuántas puede tener a la vez cada lado? ¿es obligatorio? → eso te da los (min,max) en ambos lados.
4. **Revisa con un contraejemplo**: "¿puede existir un PEDIDO sin CLIENTE?" — si la respuesta del enunciado es no, el min del lado pedido→cliente es 1.

---

## PARTE 2 — Paso a tablas (análisis de CLAVES)

> Aquí la **sintaxis importa menos**: lo que puntúa es el **análisis de claves y restricciones**. Usa la notación de marco de los apuntes.

### Reglas de transformación (memorízalas)

| En el E/R | En tablas |
|---|---|
| Entidad | Tabla con PK = su identificador |
| Relación **1:N** | FK en el lado **N** apuntando al lado 1 (nunca una tabla nueva) |
| Relación **N:M** | **Tabla intermedia** con PK = (FK1, FK2) compuesta |
| Relación **1:1** | FK en cualquiera de los dos lados (con UNIQUE si es obligatoria) |
| Atributo de relación N:M | Columna en la tabla intermedia |
| Identificador natural (DNI, matrícula) | `C.Alt` → `UNIQUE` |

### Los 4 marcadores del marco (esenciales)

```
CLIENTE = id + dni + nombre + fecha_nac
CP(id)                          ← clave primaria: única, mínima, no nula
C.Alt(dni)                      ← clave alternativa/candidata: UNIQUE
C.Aj(cliente_id) → CLIENTE(id)  ← clave ajena: referencia a PK o Alt de otra tabla
VNN(nombre)                     ← valor no nulo: NOT NULL
ASERCIÓN 1: ...                 ← restricción que involucra varias tablas
```

### Análisis de claves: las 5 preguntas para CADA tabla

1. ¿Qué columna(s) identifican de forma **única, mínima y no nula** cada fila? → `CP`
2. ¿Hay **identificadores naturales** que también deban ser únicos? → `C.Alt`
3. ¿Qué columnas **referencian** a otras tablas y a qué clave exacta? → `C.Aj`
4. ¿Qué columnas son **obligatorias** según los mínimos del E/R? → `VNN`
5. ¿La PK es **compuesta**? (sobre todo en tablas intermedias de N:M)

### Mapeos exprés (de los apuntes)

**1:N** — la FK va al lado N y es VNN si la participación es obligatoria:

```
CLIENTE = id + nombre
CP(id)

PEDIDO = id + cliente_id + fecha
CP(id)
C.Aj(cliente_id) → CLIENTE(id)
VNN(fecha)
```

**N:M** — tabla intermedia con PK compuesta:

```
PEDIDO   = id + fecha
CP(id)

PRODUCTO = id + nombre + pvp
CP(id)

LINEA    = pedido_id + producto_id + unidades + precio_ud
CP(pedido_id, producto_id)
C.Aj(pedido_id)   → PEDIDO(id)
C.Aj(producto_id) → PRODUCTO(id)
VNN(unidades)     VNN(precio_ud)
```

### Errores típicos con claves

- ❌ Poner PK en la tabla del lado **1** de un 1:N "para enlazar" → la FK siempre va al lado N.
- ❌ Crear tabla intermedia en un 1:N.
- ❌ PK compuesta en la intermedia **a la que le falta una de las dos FKs**.
- ❌ Olvidar `VNN` en una FK obligatoria (min=1 en el E/R ⇒ NOT NULL).
- ❌ Identificador natural sin `C.Alt` (dos filas con el mismo DNI/matrícula = desastre).
- ❌ Decidir la PK "porque es la primera columna" — la PK debe ser **única + mínima + no nula** por significado.

---

## PARTE 3 — Consultas: validación de DDL (varias tablas) + DML (una tabla)

### A) Validación de DDL (enunciado E/R + sentencias CREATE de varias tablas)

> Se te da un enunciado en E/R y un script con `CREATE TABLE` de **varias tablas** que contiene **errores plantados**. En campo libre debes explicar **por qué está mal** cada sentencia.

**Checklist de errores que el profesor suele plantar:**

1. **PK incorrecta**: falta, es redundante (columna que ya es UNIQUE), o es nula.
2. **FK mal referenciada**: apunta a una columna que no es PK/UNIQUE de la tabla referenciada, o el tipo no coincide.
3. **FK que falta**: la intermedia de un N:M sin sus dos FKs, o el lado N de un 1:N sin FK.
4. **NOT NULL faltante o de más**: min=1 del E/R ⇒ VNN/NOT NULL; si es opcional, NO debe llevarlo.
5. **UNIQUE faltante** en el identificador natural.
6. **Tipos incoherentes**: FK `INT` contra PK `VARCHAR`, textos sin longitud, fechas como texto.
7. **Orden de creación**: crear una tabla con FK hacia otra que aún no existe.
8. **PK compuesta mal definida**: declarar la PK columna a columna en lugar de `(a, b)`.

### B) DML sobre una sola tabla — la clave es la "EXISTENCIALIDAD"

> Aunque el DML toque **una sola tabla**, los errores aparecen porque **el valor que usas debe existir** (o no existir) en otra tabla o en la propia tabla. Pregúntate siempre: **¿existe?**

**Checklist de existencia:**

| Sentencia | ¿Qué debe existir / no existir? |
|---|---|
| `INSERT` en tabla con FK | El valor de la FK **debe existir ya** en la tabla padre (si no: error de integridad) |
| `INSERT` con PK | El valor de la PK **NO debe existir ya** (duplicado) |
| `INSERT` con columna NOT NULL | El valor **no puede ser NULL** |
| `UPDATE` de una PK/FK | El nuevo valor debe **existir** (FK) o **no existir** (PK) en destino |
| `DELETE` de una fila referenciada | Si otra tabla la referencia (sin `ON DELETE CASCADE`), **no se puede borrar** |
| `UPDATE`/`DELETE` sin `WHERE` | Afecta a **todas** las filas — casi siempre un error |
| `SELECT` con `GROUP BY` | Toda columna del SELECT no agregada debe estar en el GROUP BY |

### Errores típicos de DML que hay que saber justificar

- `INSERT` con FK a un id **que no existe todavía** → violación de integridad referencial.
- `INSERT` dos veces la misma PK → duplicado.
- `DELETE` de un cliente **con pedidos asociados** → integridad referencial (o borrado en cascada inesperado).
- `UPDATE` sin `WHERE` → modifica toda la tabla.
- `INSERT` NULL en columna `VNN/NOT NULL`.
- Comprobar "si existe" con `= NULL` → **siempre falso**; hay que usar `IS NULL` / `IS NOT NULL`.

---

## Resumen exprés para el día antes

1. **E/R**: entidades con datos propios, relaciones con (min,max) en ambos lados, contraejemplos.
2. **Tablas**: 1:N ⇒ FK en el lado N · N:M ⇒ tabla intermedia con PK compuesta · identificador natural ⇒ C.Alt · min=1 ⇒ VNN.
3. **DDL**: repasa cada CREATE preguntando *¿PK? ¿FKs? ¿NOT NULL correctos? ¿UNIQUE? ¿tipos? ¿orden?*
4. **DML**: antes de cada sentencia pregúntate **"¿el valor que uso ya existe? ¿el valor que inserto ya estaba? ¿algo depende de esta fila?"**
