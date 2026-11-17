# Bases de Datos: repaso para el examen

**Formato del examen (3 partes):**

1. **Entidad-relación (conceptual).**
2. **Paso a tablas.** La sintaxis no importa tanto: lo que cuenta es **analizar bien las claves** y dejarlo todo bien.
3. **Consultas: validación.** Te dan un enunciado E/R y sentencias DDL, y tienes que explicar **en campo libre por qué está mal** cada una.

**Cómo usarlo:** lee la parte 1, haz la parte 2 tapando las soluciones y corrige con la parte 3. Para practicar con corrección automática, abre `BDA-QUEST.html` (modo **Examen de prueba**).

**Para seguir en otra sesión:** pega este documento y escribe **"sigo"**. Empezaremos por "Pendientes para repetir" y después por lo que aún no te he preguntado.

---

## Antes de nada: dónde va el (min,max)

La web del profe **no es coherente**:

- **Lectura (web, conceptual 4.4)**: el par pegado a una entidad se lee desde esa entidad hacia la relación. *Cliente (0,N) —realiza— Pedido (1,1)* = un cliente puede estar en 0 a N pedidos y cada pedido es de exactamente 1 cliente. Solo el apartado de lógico (4.1/4.2) los escribe al revés.
- **Algunos textos** lo escriben al revés.

**En el examen escribe la frase al lado de cada par** ("cada pedido tiene exactamente 1 cliente"). Así está bien lo lea como lo lea. Y para el `VNN` de una FK no mires números: pregúntate **"¿puede existir un PEDIDO sin CLIENTE?"**

## Tus fallos de costumbre

*(Se irá rellenando según lo que falles al repasar.)*

## Pendientes para repetir

*(Vacío por ahora.)*

## Repasa primero

| Tema | Qué recordar |
|---|---|
| Lado de la FK en 1:N | Siempre en el lado **N** (los "muchos"). Nunca tabla intermedia |
| N:M | Tabla intermedia con **CP compuesta** por las dos FKs y los atributos de la relación |
| 1:1 | FK en un lado + **UNIQUE** (si no, sería 1:N) |
| VNN de una FK | Si el hijo **no puede existir sin** el padre |
| C.Alt | "No se repite" → **UNIQUE**. Si además es obligatorio → **+ VNN** |
| UNIQUE y NULL | UNIQUE admite **varios NULL** |
| Entidad débil | CP = PK de la fuerte + **clave parcial** |
| Dos PRIMARY KEY | Una tabla tiene **una sola** PK (en la columna **o** al final, nunca en los dos) |
| SET NULL | Solo si la FK **admite NULL** |
| Dinero | **DECIMAL(p,s)**, nunca FLOAT. Fechas en **DATE**, nunca VARCHAR |
| Orden del script | Los padres antes que los hijos |

---

# Parte 1: lo que entra

## 1. E/R (conceptual)

- **Chen:** rectángulo = entidad, óvalo = atributo, rombo = relación. Doble rectángulo = débil; doble rombo = relación identificadora; doble óvalo = multivalorado; óvalo discontinuo = derivado; subrayado = identificador; subrayado discontinuo = clave parcial.
- **(min,max):** mínimo 0 = **parcial** (opcional), 1 = **total** (obligatorio). Máximo 1 o N.
- **Palabras del enunciado:** "puede" → 0. "Siempre", "todo", "debe", "exactamente", "al menos uno" → 1. "Varios" → N. "Un único", "como mucho uno" → 1.
- **Atributo de la relación:** si el dato es "del encuentro" (unidades, nota, fecha de alta), va en el rombo.
- **Ternaria:** el dato depende de los tres a la vez. No son tres binarias.
- **Reflexiva:** la entidad consigo misma, con roles (supervisor y subordinado).
- **ISA:** ¿puede ser las dos cosas a la vez? → **solapada [O]**, si no **disyunta [D]**. ¿Tiene que ser alguna? → **total** (doble línea), si no **parcial**.
- **Agregación:** relacionas "la pareja" (el Suministro proveedor-producto) con otra entidad. **Composición:** todo-parte con dependencia = entidad débil.
- **Método:** sustantivos → entidades; verbos → relaciones; en cada relación pregunta los dos sentidos; contraejemplo.

## 2. Paso a tablas (análisis de claves)

```
T = c1 + c2 + …          tabla y columnas
CP(…)                    única, mínima y no nula
C.Alt(…)                 otra candidata → UNIQUE (admite NULL salvo que pongas VNN)
C.Aj(x) → T(k)           apunta a la PK o a una UNIQUE de T, mismo tipo
VNN(c)                   NOT NULL
ASERCIÓN n: …            regla entre tablas (cobertura ⊆, disyunción ∩ = ∅)
```

**Las 5 preguntas para cada tabla:** ¿CP? ¿C.Alt? ¿C.Aj y a qué clave exacta? ¿VNN? ¿La CP es compuesta?

| E/R | Tablas |
|---|---|
| 1:N | FK en el lado N; VNN si el hijo no puede existir sin padre |
| N:M | Tabla intermedia: CP(fk1, fk2) + atributos de la relación |
| 1:1 | FK en un lado + C.Alt(FK) |
| Reflexiva 1:N | FK a la propia tabla (`jefe_id → EMPLEADO(id)`) |
| Ternaria | Tabla con 3 FKs; la CP con 2 o 3 según la regla |
| Débil | CP = PK de la fuerte + clave parcial |
| Multivalorado | Tabla propia: CP(base, valor) |
| ISA | Subtipo con CP = FK al supertipo; total y disyunta como aserciones |
| Participación total del lado 1 | ASERCIÓN de cobertura: `DOCTOR[id] ⊆ CONSULTA[doctor_id]` |

## 3. Validación del DDL ("¿por qué está mal?")

**Los 8 errores que se plantan:**

1. **PK** que falta, declarada dos veces o sobre la columna equivocada.
2. **FK mal referenciada:** otra tabla, o una columna que no es PK ni UNIQUE.
3. **FK que falta:** lado N sin FK, o intermedia sin sus dos FKs.
4. **NOT NULL** que falta (es obligatorio) o que **sobra** (es opcional).
5. **UNIQUE** que falta en el identificador natural.
6. **Tipos incoherentes:** FK INT contra PK VARCHAR, fecha en VARCHAR, dinero en FLOAT.
7. **Orden de creación:** FK hacia una tabla que todavía no existe.
8. **PK compuesta mal:** le falta una columna, le sobra una, o lleva PRIMARY KEY en cada columna.

**Cómo escribir el porqué (3 piezas):** **qué** está mal + **qué regla** del enunciado lo exige + **cómo** sería correcto.

> Ejemplo: "`mecanico_id INT` está mal porque la regla 6 dice que cada reparación la dirige **exactamente un** mecánico (participación obligatoria), así que la FK debe ser `NOT NULL`, y además le falta `FOREIGN KEY (mecanico_id) REFERENCES mecanico(id)`."

## 4. DML de una tabla (por si cae)

- `= NULL` nunca es verdadero: se usa `IS NULL`.
- `UPDATE` o `DELETE` sin `WHERE` afectan a toda la tabla.
- INSERT: ¿la PK ya existe? ¿existe el padre de la FK? ¿dejo NULL algo NOT NULL?
- DELETE de una fila con hijos: falla con RESTRICT, borra los hijos con CASCADE, los pone a NULL con SET NULL.
- `GROUP BY`: toda columna del SELECT que no sea agregado va en el GROUP BY. Filtrar grupos → `HAVING`.

---

# Parte 2: preguntas, sin soluciones

### Enunciado de las rondas 1 a 3: Biblioteca

- **R1.** De cada **socio**: número de socio (lo identifica), DNI (todos lo tienen y no se repite), nombre y teléfono (puede no tenerlo).
- **R2.** De cada **libro**: ISBN (lo identifica), título y año. Un libro tiene **uno o varios** autores; de cada autor hay **al menos un** libro registrado y puede haber varios.
- **R3.** De cada **autor**: código (lo identifica), nombre y nacionalidad.
- **R4.** Cada libro tiene **varios ejemplares**, numerados 1, 2, 3… **dentro de ese libro**. Un ejemplar no existe sin su libro. De cada ejemplar se guarda su estado.
- **R5.** Un socio se lleva **prestado** un ejemplar en una **fecha**, y se guarda la **fecha de devolución** (puede no haberlo devuelto aún). Un socio puede tener muchos préstamos o ninguno; un ejemplar puede prestarse muchas veces (también al mismo socio en fechas distintas) o ninguna.

**Ronda 1 (E/R)**

1. Libro — escrito por — Autor: pon el (min,max) junto a cada entidad y di el tipo de relación.
2. ¿Qué tipo de entidad es Ejemplar? ¿Cuál es su identificador y cómo se dibuja?
3. Libro — tiene — Ejemplar: (min,max) junto a cada entidad.
4. Socio — presta — Ejemplar: ¿qué tipo de relación es y qué atributos tiene?
5. ¿Qué identificador alternativo hay en el enunciado y cómo se marca?

**Ronda 2 (paso a tablas)**

6. Escribe el marco de SOCIO.
7. Escribe el marco de EJEMPLAR y justifica la CP.
8. Escribe el marco de la tabla que sale de "escrito por".
9. Escribe el marco de PRESTAMO. ¿Por qué la fecha tiene que estar en la CP?
10. ¿Qué regla del enunciado no se puede cumplir solo con CP, C.Aj y VNN? Escríbela como aserción.

**Ronda 3 (validación del DDL: di por qué está mal cada línea marcada con número)**

```sql
CREATE TABLE socio (
  num_socio    INT PRIMARY KEY,
  dni          CHAR(9),                                   -- (11)
  nombre       VARCHAR(80) NOT NULL,
  telefono     VARCHAR(15) NOT NULL                       -- (12)
);
CREATE TABLE libro (
  isbn         CHAR(13) PRIMARY KEY,
  titulo       VARCHAR(150) NOT NULL,
  anio         SMALLINT
);
CREATE TABLE ejemplar (
  isbn         CHAR(13) NOT NULL,
  num_ejemplar INT NOT NULL,
  estado       VARCHAR(20),
  PRIMARY KEY (num_ejemplar),                             -- (13)
  FOREIGN KEY (isbn) REFERENCES libro(isbn)
);
CREATE TABLE prestamo (
  num_socio    INT NOT NULL,
  isbn         CHAR(13) NOT NULL,
  num_ejemplar INT NOT NULL,
  fecha        DATE NOT NULL,
  fecha_dev    DATE,
  PRIMARY KEY (num_socio, isbn, num_ejemplar),            -- (14)
  FOREIGN KEY (num_socio) REFERENCES socio(num_socio),
  FOREIGN KEY (num_ejemplar) REFERENCES ejemplar(num_ejemplar)  -- (15)
);
CREATE TABLE libro_autor (
  isbn         CHAR(13) NOT NULL,
  cod_autor    INT NOT NULL,
  PRIMARY KEY (isbn, cod_autor),
  FOREIGN KEY (isbn) REFERENCES libro(isbn),
  FOREIGN KEY (cod_autor) REFERENCES autor(cod_autor)     -- (16)
);
CREATE TABLE autor (
  cod_autor    INT PRIMARY KEY,
  nombre       VARCHAR(80) NOT NULL,
  nacionalidad VARCHAR(40)
);
```

**Ronda 4 (trampas típicas: contesta en una frase)**

17. ¿NOT NULL y UNIQUE son lo mismo? Pon un ejemplo de columna que necesite los dos.
18. `id INT AUTO_INCREMENT PRIMARY KEY,` … `PRIMARY KEY (id)` en la misma tabla: ¿qué pasa?
19. `ON DELETE SET NULL` sobre una FK `NOT NULL`: ¿qué pasa?
20. Una relación 1:N, ¿necesita tabla intermedia?
21. `precio FLOAT NOT NULL` en una tienda: ¿qué está mal?
22. `fecha VARCHAR(10)`: ¿qué está mal?

**Ronda 5 (DML de una tabla, por si cae)**

Datos: `SOCIO` tiene los num_socio 1, 2 y 3. `PRESTAMO` tiene una fila del socio 2.

23. `INSERT INTO socio (num_socio, dni, nombre) VALUES (2, '11111111A', 'Ana');`
24. `DELETE FROM socio WHERE num_socio = 2;` (la FK es RESTRICT)
25. `SELECT * FROM prestamo WHERE fecha_dev = NULL;`
26. `UPDATE prestamo SET fecha_dev = '2026-11-20';`

---

# Parte 3: soluciones

**Ronda 1**

1. Libro **(1,N)** — escrito por — **(1,N)** Autor. Junto a Libro, (1,N): un libro tiene uno o varios autores. Junto a Autor, (1,N): de cada autor hay al menos un libro. Tipo **N:M**.
2. **Entidad débil**: no se identifica sola. Identificador = ISBN del libro + **clave parcial** `num_ejemplar` (el 1 de un libro no es el 1 de otro). Se dibuja con **doble rectángulo**, relación identificadora con **doble rombo**, `num_ejemplar` con **subrayado discontinuo** y participación total.
3. Libro **(1,N)** — tiene — **(1,1)** Ejemplar. Cada libro tiene varios ejemplares (al menos uno); cada ejemplar es de exactamente un libro.
4. **N:M** entre Socio y Ejemplar, con atributos **fecha** y **fecha_devolucion**. Ojo: el mismo socio puede llevarse el mismo ejemplar varias veces, así que la fecha tiene que ayudar a identificar cada préstamo (pregunta 9).
5. El **DNI** del socio: es candidato, pero el identificador es el número de socio. Se queda como **C.Alt(dni)** y, como todos lo tienen, **VNN(dni)**.

**Ronda 2**

6.
```
SOCIO = num_socio + dni + nombre + telefono
CP(num_socio)
C.Alt(dni)
VNN(dni)  VNN(nombre)
```
`telefono` no lleva VNN: R1 dice que puede no tenerlo.

7.
```
EJEMPLAR = isbn + num_ejemplar + estado
CP(isbn, num_ejemplar)
C.Aj(isbn) → LIBRO(isbn)
```
Es débil: CP = PK de la fuerte (isbn) + clave parcial (num_ejemplar). Con solo num_ejemplar habría muchos "ejemplar 1".

8.
```
LIBRO_AUTOR = isbn + cod_autor
CP(isbn, cod_autor)
C.Aj(isbn) → LIBRO(isbn)
C.Aj(cod_autor) → AUTOR(cod_autor)
```

9.
```
PRESTAMO = num_socio + isbn + num_ejemplar + fecha + fecha_dev
CP(num_socio, isbn, num_ejemplar, fecha)
C.Aj(num_socio) → SOCIO(num_socio)
C.Aj(isbn, num_ejemplar) → EJEMPLAR(isbn, num_ejemplar)
```
Sin `fecha` en la CP, el mismo socio no podría volver a llevarse el mismo ejemplar otro día (R5 dice que sí puede). La FK al ejemplar es **compuesta**, porque su CP es compuesta. `fecha_dev` admite NULL.

10. R2: "de cada autor hay al menos un libro" y "un libro tiene uno o varios autores" son participaciones totales del lado que no lleva la FK:
```
ASERCIÓN 1: AUTOR[cod_autor] ⊆ LIBRO_AUTOR[cod_autor]
ASERCIÓN 2: LIBRO[isbn] ⊆ LIBRO_AUTOR[isbn]
```
Y R4 ("cada libro tiene varios ejemplares"): `LIBRO[isbn] ⊆ EJEMPLAR[isbn]`.

**Ronda 3**

11. `dni CHAR(9)`: R1 dice que **todos lo tienen y no se repite** → faltan `NOT NULL` y `UNIQUE` (C.Alt + VNN).
12. `telefono … NOT NULL`: R1 dice que **puede no tenerlo** → sobra el NOT NULL.
13. `PRIMARY KEY (num_ejemplar)`: ejemplar es **débil**, los números se repiten entre libros → la CP es compuesta: `PRIMARY KEY (isbn, num_ejemplar)`.
14. `PRIMARY KEY (num_socio, isbn, num_ejemplar)`: falta **fecha**. Con esta CP el mismo socio no podría llevarse el mismo ejemplar dos veces, y R5 lo permite.
15. `FOREIGN KEY (num_ejemplar) REFERENCES ejemplar(num_ejemplar)`: la clave de EJEMPLAR es **compuesta**, así que la FK también: `FOREIGN KEY (isbn, num_ejemplar) REFERENCES ejemplar(isbn, num_ejemplar)`. Con solo num_ejemplar no se sabe de qué libro es el ejemplar (y, con la CP corregida, num_ejemplar sola no es clave).
16. `REFERENCES autor(cod_autor)`: **orden de creación**. `autor` se crea después y al ejecutar este CREATE todavía no existe. Hay que crear `autor` antes (o añadir la FK al final con ALTER TABLE).

**Ronda 4**

17. No. NOT NULL obliga a que haya valor; UNIQUE impide que se repita (y admite varios NULL). Un DNI obligatorio y sin repetir necesita los dos: `dni CHAR(9) NOT NULL UNIQUE`.
18. Error: la clave primaria está declarada **dos veces** ("Multiple primary key defined"). Una tabla tiene una sola PK.
19. Contradicción: no se puede poner a NULL una columna que no admite NULL. O la FK es opcional (se quita NOT NULL) o se usa RESTRICT o CASCADE.
20. No. La FK va en el lado N. Solo N:M, ternarias y multivalorados crean tabla nueva.
21. El dinero se guarda con `DECIMAL(10,2)`: FLOAT es aproximado y da errores de redondeo.
22. Una fecha va en `DATE`: como texto se aceptan fechas imposibles y no se puede ordenar ni calcular.

**Ronda 5**

23. Falla: el **num_socio 2 ya existe** (PK duplicada).
24. Falla: el socio 2 tiene un préstamo que lo **referencia** y la FK es RESTRICT.
25. No devuelve nada: `= NULL` nunca es verdadero. Se escribe `WHERE fecha_dev IS NULL`.
26. Sin `WHERE`: pone esa fecha de devolución a **todos** los préstamos, también a los ya devueltos.
