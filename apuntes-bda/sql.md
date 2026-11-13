> Fuente: https://dexpositofp.github.io/docencia/BDA/sql.html (descargado el 13/11/2026)

# SQL — Lenguaje de consulta estructurado

Este tema introduce SQL desde cero y lo organiza en cuatro familias de instrucciones: **DDL**<span class="badge">definir</span>, **DML**<span class="badge">leer/escribir</span>, **DCL**<span class="badge">permisos</span> y **TCL**<span class="badge">transacciones</span>. A lo largo de la unidad alternaremos explicación y ejemplos (PostgreSQL y MySQL/MariaDB) exactamente como yo lo haría en clase.

## 1. Introducción a SQL

**SQL (Structured Query Language)** es el lenguaje estándar para trabajar con bases de datos relacionales. Nació a principios de los 70 en IBM (proyecto System R) a partir del modelo relacional de E. F. Codd, y en los 80 se estandarizó por ANSI/ISO. Desde entonces, todos los SGBDR (Sistemas de Gestión de Bases de Datos Relacionales) —como *PostgreSQL, MySQL/MariaDB, Oracle, SQL Server*— implementan SQL con pequeñas diferencias de dialéctos. SQL es *declarativo*: tú dices *qué* necesitas y el motor decide *cómo* obtenerlo.

**Idea clave.** Piensa en SQL como en cuatro sombreros distintos:

- **DDL**: crear y modificar la *estructura* (bases de datos, tablas, columnas, índices, claves).
- **DML**: insertar, consultar, actualizar y borrar *datos*.
- **DCL**: otorgar o revocar *permisos*.
- **TCL**: gestionar *transacciones* (confirmar o deshacer cambios).

### SQL en el ciclo de vida de una aplicación

En un proyecto típico empezamos levantando el *esquema* (DDL), cargamos datos de prueba (DML), definimos usuarios y privilegios (DCL) y, por último, nos aseguramos de que los cambios sean **atómicos** y consistentes mediante transacciones (TCL). Este orden no es rígido, pero ayuda a estructurar mentalmente el trabajo.

    CREATE TABLE autores (
                id SERIAL PRIMARY KEY,
                nombre VARCHAR(80) NOT NULL
                );
                CREATE TABLE libros (
                id SERIAL PRIMARY KEY,
                isbn CHAR(13) NOT NULL UNIQUE,
                titulo VARCHAR(120) NOT NULL,
                autor_id INT NOT NULL REFERENCES autores(id)
                );
                CREATE INDEX idx_libros_isbn ON libros(isbn);
                

**Consultas con JOIN y agregación.** Obtén el top 3 de clientes por gasto total y el número medio de líneas por pedido.

Solución orientativa

    SELECT c.nombre, SUM(p.total) AS total
                FROM clientes c JOIN pedidos p ON p.cliente_id = c.id
                GROUP BY c.id
                ORDER BY total DESC
                LIMIT 3;
                
                
                SELECT AVG(cnt) AS media_lineas
                FROM (
                SELECT COUNT(*) AS cnt FROM lineas_pedido GROUP BY pedido_id
                ) t;
                

**Transacciones.** Simula un alta de pedido con fallo intermedio y deja la BD consistente usando `SAVEPOINT`.

### Recursos y buenas prácticas

- Escribe sentencias *idempotentes* en despliegues: `CREATE TABLE IF NOT EXISTS`, `DROP ... IF EXISTS`.
- Versiona el esquema con migraciones (p. ej., Flyway, Liquibase) incluso en proyectos pequeños.
- Incluye `EXPLAIN`/`EXPLAIN ANALYZE` en tu rutina para entender planes de ejecución.
- Evita `SELECT *` en producción: carga columnas necesarias y documenta contratos.
- Centraliza constantes y validaciones en la BD siempre que tenga sentido.

## 2. DDL

En esta sección nos ponemos el «sombrero DDL» **centradas 100% en MySQL 8.0+**. Veremos desde la creación de bases de datos hasta el diseño fino de tablas, tipos de datos, claves primarias y ajenas, índices, opciones de motor y el tratamiento de `NULL`. La idea es que, al terminar, puedas leer y escribir DDL con criterio, sabiendo *por qué* eliges cada opción.

### 1) Crear bases de datos (charset y collation)

En MySQL, `CREATE DATABASE` y `CREATE SCHEMA` son sinónimos. Es clave fijar la **codificación** y la **ordenación** desde el principio. Para español moderno recomiendo `utf8mb4` con una collation insensible a mayúsculas y acentos (p. ej., `utf8mb4_0900_ai_ci` o, si la tienes, `utf8mb4_es_0900_ai_ci`).

    -- Crear la base y usarla
      CREATE DATABASE IF NOT EXISTS tienda
        CHARACTER SET utf8mb4
        COLLATE utf8mb4_0900_ai_ci;  -- alternativa: utf8mb4_es_0900_ai_ci
      USE tienda;
      
      -- Inspeccionar la definición
      SHOW CREATE DATABASE tienda\G
      

Consejo: también puedes definir charset/collation por *tabla* o por *columna* si necesitas comportamientos distintos.

### 2) Motores de almacenamiento (ENGINE)

El motor de almacenamiento decide cómo se guardan y bloquean los datos. **InnoDB** es el motor por defecto y el recomendado: soporta *transacciones*, *claves ajenas*, *bloqueo a nivel de fila* y *recuperación*. Otros motores existen (MEMORY, ARCHIVE, etc.) pero tienen usos muy específicos y limitaciones (p. ej., sin FKs). Lo normal en 1º DAW es usar siempre InnoDB.

    -- Motor por tabla
      CREATE TABLE ejemplo (
        id INT PRIMARY KEY
      ) ENGINE=InnoDB;
      

### 3) Tipos de datos en MySQL (elección didáctica)

Elegir bien los tipos evita sorpresas. Abajo tienes una «chuleta» con los más usados y cuándo elegirlos. Recuerda: para *dinero* usa `DECIMAL(p,s)`; para contadores `INT`/`BIGINT`; para textos libres `VARCHAR(n)` o `TEXT` si pueden ser muy largos; para fechas `DATE` y para fecha-hora sin zona horaria `DATETIME` (o `TIMESTAMP` si te interesa el auto-update y aceptas su rango limitado).

| Categoría                | Tipos comunes                                                | Notas prácticas                                                                                                                            |
|--------------------------|--------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------|
| Números enteros          | `TINYINT`, `SMALLINT`, `INT`, `BIGINT`                       | Elige el más pequeño que cubra el rango. `BOOLEAN` es alias de `TINYINT(1)`.                                                               |
| Números exactos          | `DECIMAL(p,s)`                                               | Para importes: p.ej., `DECIMAL(10,2)`. Evita `FLOAT/DOUBLE` en dinero.                                                                     |
| Números en coma flotante | `FLOAT`, `DOUBLE`                                            | Para cálculos científicos o medidas aproximadas.                                                                                           |
| Cadenas                  | `CHAR(n)`, `VARCHAR(n)`, `TINYTEXT/TEXT/MEDIUMTEXT/LONGTEXT` | `CHAR` para longitudes fijas (códigos); `VARCHAR` para variable; `TEXT` para textos largos.                                                |
| Binarios                 | `BINARY(n)`, `VARBINARY(n)`, `BLOB`…                         | Para datos binarios. Suele preferirse guardar ficheros fuera de la BD.                                                                     |
| Fecha y hora             | `DATE`, `TIME`, `DATETIME`, `TIMESTAMP`                      | `TIMESTAMP` puede auto-actualizarse (`DEFAULT CURRENT_TIMESTAMP`, `ON UPDATE`) pero su rango es ~1970-2038. `DATETIME` tiene rango amplio. |
| JSON                     | `JSON`                                                       | Valida formato y permite funciones JSON. Úsalo para datos semiestructurados, no como sustituto del modelado relacional.                    |
| Enumerados               | `ENUM`, `SET`                                                | Útiles pero rígidos: valorar tabla de referencia + FK si cambiarán.                                                                        |
| Espaciales               | `POINT`, `GEOMETRY`…                                         | Fuera del alcance básico, pero existen e incluso tienen índices espaciales.                                                                |

### 4) Crear tablas bien formadas

A continuación definimos un esquema tipo «tienda» con **claves primarias**, **únicas**, **foráneas**, **checks**, **columnas generadas** e **índices**. Fíjate en el uso de `ENGINE`, `CHARACTER SET`, `COLLATE` y los nombres explícitos de las restricciones (`CONSTRAINT ...`).

    -- CLIENTES
      CREATE TABLE IF NOT EXISTS clientes (
        id            INT AUTO_INCREMENT,
        nombre        VARCHAR(80)     NOT NULL,
        email         VARCHAR(120)    NOT NULL,
        telefono      VARCHAR(20)     NULL,
        fecha_alta    DATE            NOT NULL DEFAULT (CURRENT_DATE),
        activo        TINYINT(1)      NOT NULL DEFAULT 1,
        nif           VARCHAR(12)     NULL,
        -- Restricciones
        CONSTRAINT pk_clientes PRIMARY KEY (id),
        CONSTRAINT uq_clientes_email UNIQUE (email),
        CONSTRAINT uq_clientes_nif   UNIQUE (nif),
        CONSTRAINT chk_email_arroba  CHECK (email LIKE '%@%')
      ) ENGINE=InnoDB
        DEFAULT CHARSET=utf8mb4
        COLLATE=utf8mb4_0900_ai_ci;
      
      -- PEDIDOS
      CREATE TABLE IF NOT EXISTS pedidos (
        id            INT AUTO_INCREMENT,
        cliente_id    INT            NOT NULL,
        fecha_pedido  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
        estado        ENUM('pendiente','enviado','cancelado','entregado') NOT NULL DEFAULT 'pendiente',
        total         DECIMAL(10,2)  NOT NULL DEFAULT 0,
        CONSTRAINT pk_pedidos PRIMARY KEY (id),
        CONSTRAINT fk_pedidos_cliente FOREIGN KEY (cliente_id)
          REFERENCES clientes(id)
          ON UPDATE CASCADE
          ON DELETE RESTRICT,
        KEY idx_pedidos_cliente (cliente_id)
      ) ENGINE=InnoDB;
      
      -- LÍNEAS DE PEDIDO (PK compuesta + columna generada)
      CREATE TABLE IF NOT EXISTS lineas_pedido (
        pedido_id   INT           NOT NULL,
        posicion    INT           NOT NULL,
        producto    VARCHAR(80)   NOT NULL,
        cantidad    INT           NOT NULL CHECK (cantidad > 0),
        precio      DECIMAL(10,2) NOT NULL CHECK (precio >= 0),
        importe     DECIMAL(10,2) AS (cantidad * precio) STORED,
        CONSTRAINT pk_lineas PRIMARY KEY (pedido_id, posicion),
        CONSTRAINT fk_lineas_pedido FOREIGN KEY (pedido_id)
          REFERENCES pedidos(id)
          ON UPDATE CASCADE
          ON DELETE CASCADE
      ) ENGINE=InnoDB;
      

**Sobre CHECK.** En MySQL 8.0.16+ las restricciones `CHECK` se *aplican*. En versiones antiguas se aceptaban pero se ignoraban. Si trabajas con una versión vieja, sustitúyelas por claves y lógica alternativa.

### 5) Claves primarias y AUTO_INCREMENT

Una **PK** identifica de forma única cada fila. En MySQL conviene que la PK sea *compacta y monótona* (p. ej., `INT AUTO_INCREMENT`) para favorecer el índice clustered de InnoDB. También puedes usar PK compuestas cuando tengan significado natural (como `(pedido_id, posicion)` en líneas).

    -- PK simple autoincremental
      CREATE TABLE categorias (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(60) NOT NULL UNIQUE
      ) ENGINE=InnoDB;
      
      -- PK compuesta
      CREATE TABLE favoritos (
        cliente_id INT NOT NULL,
        producto_id INT NOT NULL,
        PRIMARY KEY (cliente_id, producto_id)
      ) ENGINE=InnoDB;
      

### 6) Claves ajenas (FOREIGN KEY) y acciones

Las FKs garantizan integridad referencial. Define siempre la acción adecuada: `ON DELETE RESTRICT` (bloquea borrado), `ON DELETE CASCADE` (borra hijas), `ON DELETE SET NULL` (pone `NULL` si lo permites) o `NO ACTION` (equivalente práctico a `RESTRICT` en MySQL). Para `SET NULL`, la columna debe permitir `NULL`.

    -- SET NULL requiere permitir nulos
      ALTER TABLE pedidos
        ADD COLUMN comercial_id INT NULL,
        ADD CONSTRAINT fk_pedidos_comercial FOREIGN KEY (comercial_id)
        REFERENCES comerciales(id)
        ON DELETE SET NULL;
      

### 7) NULOS: reglas que debes interiorizar

- **`NULL` ≠ 0 ≠ ''**. Representa «valor desconocido». No compares con `=`; usa `IS NULL` / `IS NOT NULL`.
- Una columna sin `NOT NULL` *acepta* nulos. Define `NOT NULL` siempre que el dato sea obligatorio.
- Un índice **UNIQUE** permite múltiples `NULL` (porque `NULL` no es igual a `NULL`).
- Para `ON DELETE SET NULL` la columna debe ser `NULL`-able.
- Usa `DEFAULT` para valores por defecto coherentes (fechas, flags, importes en 0).

<!-- -->

    -- Ejemplos rápidos
      CREATE TABLE ejemplo_nulos (
        a INT UNIQUE NULL,      -- admite varios NULL
        b INT NOT NULL UNIQUE   -- no admite NULL
      );
      
      -- Búsqueda correcta
      SELECT * FROM ejemplo_nulos WHERE a IS NULL;  -- no uses a = NULL
      

### 8) Índices (UNIQUE, compuestos, FULLTEXT)

En InnoDB, la PK es el índice clustered. Crea índices secundarios para acelerar filtros y joins frecuentes. Mejor un índice compuesto bien pensado que varios índices sueltos. Para búsqueda de texto libre en columnas `VARCHAR/TEXT`, puedes usar `FULLTEXT`.

    -- Índice compuesto (cliente + fecha)
      CREATE INDEX idx_pedidos_cliente_fecha ON pedidos(cliente_id, fecha_pedido);
      
      -- Texto libre
      CREATE FULLTEXT INDEX ft_productos_nombre ON productos(nombre);
      
      -- Prefijos (cuando la columna es muy larga)
      CREATE INDEX idx_usuarios_email_pref ON usuarios(email(20));
      

### 9) ALTER TABLE: evolucionar el esquema

MySQL ofrece varias formas de alterar: `ADD`, `DROP`, `MODIFY` (cambia tipo/atributos), `CHANGE` (cambia nombre y tipo), `RENAME COLUMN` (8.0+), añadir/quitar restricciones e índices. Para eliminar una FK debes conocer su *nombre* simbólico.

    -- Añadir columnas y restricciones
      ALTER TABLE clientes
        ADD COLUMN apellidos VARCHAR(120) AFTER nombre,
        ADD CONSTRAINT chk_nombre_long CHECK (CHAR_LENGTH(nombre) >= 2);
      
      -- Cambiar tipo y NOT NULL
      ALTER TABLE clientes MODIFY telefono VARCHAR(25) NULL;
      
      -- Renombrar columna (8.0+)
      ALTER TABLE clientes RENAME COLUMN telefono TO telefono_movil;
      
      -- Añadir/quitar índice
      ALTER TABLE pedidos ADD UNIQUE uq_pedidos (cliente_id, fecha_pedido);
      ALTER TABLE pedidos DROP INDEX uq_pedidos;
      
      -- Quitar FK (necesitas el nombre)
      ALTER TABLE pedidos DROP FOREIGN KEY fk_pedidos_cliente;
      

**¿Cómo sé el nombre de una FK o índice?** Usa `SHOW CREATE TABLE nombre` o consulta `INFORMATION_SCHEMA` (`TABLE_CONSTRAINTS`, `KEY_COLUMN_USAGE`).

### 10) Comentarios, opciones y otras herramientas

- **Comentarios:** añade `COMMENT 'texto'` en columnas y tablas para documentar.
- **Opciones de tabla:** `ROW_FORMAT`, `AUTO_INCREMENT`, `ENGINE`, `CHARSET`, etc.
- **Vistas:** aunque son DDL, las veremos aparte; útiles para exponer «lecturas» estables a la capa de aplicación.
- **Buenas prácticas de despliegue:** usa `CREATE/DROP ... IF EXISTS` y versiona las migraciones.

**Antipatrones frecuentes.**

1.  Usar `VARCHAR(255)` por defecto «porque sí». Elige tamaños razonables.
2.  Abusar de `ENUM`; es sencillo al principio pero rígido para cambios.
3.  Sin claves ajenas «porque las controlo en la app». La BD *debe* hacer cumplir la integridad.
4.  Olvidar el charset/collation y mezclar luego columnas con reglas diferentes.

### 11) Práctica guiada (mini-reto)

Diseña el DDL de un pequeño módulo de «cursos»: *cursos*(id, título, precio), *alumnos*(id, nombre, email) y *matriculas*(curso_id, alumno_id, fecha, precio_pagado). Requisitos: emails únicos, precio no negativo, PK compuesta en `matriculas`, FK con `ON DELETE CASCADE` y columna generada `iva` = 21% de `precio_pagado` (STORED).

Solución orientativa

    CREATE TABLE cursos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        titulo VARCHAR(120) NOT NULL,
        precio DECIMAL(10,2) NOT NULL CHECK (precio >= 0)
      ) ENGINE=InnoDB;
      
      CREATE TABLE alumnos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(120) NOT NULL,
        email VARCHAR(120) NOT NULL UNIQUE
      ) ENGINE=InnoDB;
      
      CREATE TABLE matriculas (
        curso_id  INT NOT NULL,
        alumno_id INT NOT NULL,
        fecha     DATE NOT NULL DEFAULT (CURRENT_DATE),
        precio_pagado DECIMAL(10,2) NOT NULL CHECK (precio_pagado >= 0),
        iva DECIMAL(10,2) AS (ROUND(precio_pagado * 0.21, 2)) STORED,
        PRIMARY KEY (curso_id, alumno_id),
        CONSTRAINT fk_mat_curso  FOREIGN KEY (curso_id)  REFERENCES cursos(id)  ON DELETE CASCADE,
        CONSTRAINT fk_mat_alumno FOREIGN KEY (alumno_id) REFERENCES alumnos(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
      

## 3. DML: Consultas

En esta unidad profundizamos en **DML**: `SELECT`, `INSERT`, `UPDATE` y `DELETE`. Iremos de menos a más: primero consultas sobre *una tabla*, después *agrupaciones*, y finalmente trabajaremos con *varias tablas* (joins) y *subconsultas*. Todo con **MySQL 8.0+** en mente y usando el esquema del tema (*clientes*, *pedidos*, *lineas_pedido*). Añadiremos además una tabla *productos* para practicar.

**Recordatorio.** Orden lógico de evaluación: `FROM` → `WHERE` → `GROUP BY` → `HAVING` → `SELECT` → `ORDER BY` → `LIMIT`. Te servirá para entender por qué ciertas referencias no funcionan en `WHERE` pero sí en `HAVING` o en la proyección final.

### 0) Preparación: datos de ejemplo rápidos

    -- Tabla de apoyo para consultas
      CREATE TABLE IF NOT EXISTS productos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(80) NOT NULL,
        categoria VARCHAR(40) NOT NULL,
        precio DECIMAL(10,2) NOT NULL CHECK (precio >= 0),
        stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0)
      ) ENGINE=InnoDB;
      
      INSERT INTO productos (nombre, categoria, precio, stock) VALUES
        ('Libro BBDD', 'libros', 38.50, 50),
        ('Ratón', 'perifericos', 20.00, 120),
        ('Teclado', 'perifericos', 29.90, 80),
        ('Portátil 14\"', 'equipos', 799.00, 10),
        ('USB-C 32GB', 'almacenamiento', 9.99, 200);
      
      -- Algunos clientes/pedidos de ejemplo
      INSERT INTO clientes (nombre, email) VALUES
        ('Ada Lovelace','ada@ejemplo.com'),
        ('Linus Torvalds','linus@ejemplo.com'),
        ('Radia Perlman','radia@ejemplo.com');
      
      INSERT INTO pedidos (cliente_id, estado, total)
      VALUES (1,'pendiente',0), (2,'enviado',58.50);
      
      INSERT INTO lineas_pedido (pedido_id, posicion, producto, cantidad, precio) VALUES
        (2,1,'Libro BBDD',1,38.50),
        (2,2,'Ratón',1,20.00);
      

### 1) Consultas sobre *una tabla* (SELECT básico)

Empezamos con **proyección** (elegir columnas), **filtros** (`WHERE`), **ordenación** (`ORDER BY`) y **paginación** (`LIMIT/OFFSET`). Añadimos alias con `AS` y expresiones básicas.

    -- Columnas concretas + alias + expresión calculada
      SELECT id, nombre AS producto, precio, stock, (precio * stock) AS valor_stock
      FROM productos;
      
      -- Filtrado: operadores (=, <>, >, >=, <, <=), AND/OR/NOT, IN/BETWEEN/LIKE, IS NULL
      SELECT id, nombre, precio
      FROM productos
      WHERE categoria IN ('perifericos','almacenamiento')
        AND precio BETWEEN 10 AND 40
        AND nombre LIKE '%o%';
      
      -- Ordenación múltiple y paginación
      SELECT id, nombre, categoria, precio
      FROM productos
      ORDER BY categoria ASC, precio DESC
      LIMIT 5 OFFSET 0;
      
      -- Eliminar duplicados con DISTINCT
      SELECT DISTINCT categoria FROM productos ORDER BY categoria;
      
      -- Manejo de NULL: COALESCE / IFNULL
      SELECT c.id, c.nombre, COALESCE(c.telefono, '—') AS telefono
      FROM clientes c;
      

**Truco con NULL al ordenar.** MySQL no tiene `NULLS FIRST/LAST`, pero puedes simularlo: `ORDER BY (col IS NULL) ASC, col ASC` (primero no nulos).

### 2) Funciones habituales (números, cadenas y fechas)

Recuerda: en MySQL las funciones se escriben como `NOMBRE(argumentos)`. Las más usadas en 1º DAW:

| Categoría | Funciones típicas                                                 | Ejemplos                                                               |
|-----------|-------------------------------------------------------------------|------------------------------------------------------------------------|
| Números   | `ROUND`, `FLOOR`, `CEIL`, `ABS`                                   | `SELECT ROUND(AVG(precio),2) FROM productos;`                          |
| Cadenas   | `CONCAT`, `SUBSTRING`, `LENGTH`, `UPPER/LOWER`, `TRIM`, `REPLACE` | `SELECT CONCAT(UPPER(nombre),' (',categoria,')') FROM productos;`      |
| Fechas    | `NOW`, `CURDATE`, `DATE_FORMAT`, `DATEDIFF`, `TIMESTAMPDIFF`      | `SELECT TIMESTAMPDIFF(DAY, fecha_pedido, NOW()) AS dias FROM pedidos;` |
| Control   | `COALESCE`, `IFNULL`, `CASE WHEN`                                 | `CASE WHEN stock=0 THEN 'sin stock' ELSE 'ok' END`                     |

### 3) Agregación: `GROUP BY` y `HAVING`

Las agregaciones resumen varias filas en una. Usa `GROUP BY` con `COUNT`, `SUM`, `AVG`, `MIN`, `MAX`. Filtra grupos con `HAVING` (no con `WHERE`).

    -- Ventas por cliente (incluyendo clientes sin pedidos con LEFT JOIN)
      SELECT c.id, c.nombre,
             COALESCE(SUM(p.total),0) AS total_cliente,
             COUNT(p.id) AS num_pedidos
      FROM clientes c
      LEFT JOIN pedidos p ON p.cliente_id = c.id
      GROUP BY c.id, c.nombre
      ORDER BY total_cliente DESC;
      
      -- Solo clientes con >= 1 pedido y total > 50€
      SELECT c.nombre, SUM(p.total) AS total
      FROM clientes c
      JOIN pedidos p ON p.cliente_id = c.id
      GROUP BY c.id, c.nombre
      HAVING COUNT(p.id) >= 1 AND SUM(p.total) > 50;
      
      -- Agregación por categoría de producto
      SELECT categoria,
             COUNT(*) AS num_productos,
             ROUND(AVG(precio),2) AS precio_medio
      FROM productos
      GROUP BY categoria
      ORDER BY precio_medio DESC;
      
      -- Totales con WITH ROLLUP (suma por categoría y total general)
      SELECT categoria, SUM(precio) AS suma
      FROM productos
      GROUP BY categoria WITH ROLLUP;
      

**Regla de oro.** En MySQL, si activas *sql_mode* estricto (recomendado), toda columna en la lista `SELECT` debe estar en `GROUP BY` o ser una agregación. Evita depender de extensiones no estándar.

### 4) Varias tablas: *joins* explicados

Para combinar tablas relacionadas usamos **JOIN**. Siempre pon alias cortos a las tablas y especifica la condición con `ON`.

| Tipo         | Qué devuelve                                                | Esquema mental |
|--------------|-------------------------------------------------------------|----------------|
| `INNER JOIN` | Solo coincidencias en ambas tablas                          | A ∩ B          |
| `LEFT JOIN`  | Todos los de la izquierda, y datos de la derecha si existen | A + (A∩B)      |
| `RIGHT JOIN` | Simétrico al anterior                                       | B + (A∩B)      |
| `CROSS JOIN` | Producto cartesiano (útil con cuidado)                      | A × B          |

    -- INNER JOIN: pedidos con su cliente
      SELECT p.id, c.nombre, p.fecha_pedido, p.estado, p.total
      FROM pedidos p
      INNER JOIN clientes c ON c.id = p.cliente_id
      ORDER BY p.fecha_pedido DESC;
      
      -- LEFT JOIN: clientes sin pedidos (mirando NULL)
      SELECT c.id, c.nombre
      FROM clientes c
      LEFT JOIN pedidos p ON p.cliente_id = c.id
      WHERE p.id IS NULL;
      
      -- RIGHT JOIN: (menos usado; preferimos reordenar tablas y usar LEFT)
      SELECT p.id, c.nombre
      FROM pedidos p
      RIGHT JOIN clientes c ON c.id = p.cliente_id;
      
      -- FULL OUTER JOIN (MySQL no lo tiene nativo): emulación con UNION
      SELECT c.id, c.nombre, p.id AS pedido_id
      FROM clientes c LEFT JOIN pedidos p ON p.cliente_id = c.id
      UNION
      SELECT c.id, c.nombre, p.id AS pedido_id
      FROM clientes c RIGHT JOIN pedidos p ON p.cliente_id = c.id;
      
      -- SELF JOIN: clientes con mismo dominio de email (ejemplo didáctico)
      SELECT c1.id, c1.email, c2.id, c2.email
      FROM clientes c1
      JOIN clientes c2 ON c1.id < c2.id AND SUBSTRING_INDEX(c1.email,'@',-1)=SUBSTRING_INDEX(c2.email,'@',-1);
      

### 5) Subconsultas: *IN*, *EXISTS*, escalares y correlacionadas

Una subconsulta puede devolver un escalar (una columna/una fila), una columna (para `IN`), varias columnas (en `EXISTS`) o una tabla derivada en `FROM`. En MySQL 8.0 también disponemos de **CTE** con `WITH`.

    -- Escalar: clientes con gasto > gasto medio
      SELECT c.*
      FROM clientes c
      WHERE (
        SELECT COALESCE(AVG(p.total),0) FROM pedidos p WHERE p.cliente_id = c.id
      ) > (
        SELECT AVG(total) FROM pedidos
      );
      
      -- IN: clientes que han hecho algún pedido
      SELECT * FROM clientes
      WHERE id IN (SELECT DISTINCT cliente_id FROM pedidos);
      
      -- EXISTS: equivalente, a menudo más eficiente
      SELECT c.* FROM clientes c
      WHERE EXISTS (SELECT 1 FROM pedidos p WHERE p.cliente_id = c.id);
      
      -- Correlacionada: pedidos por encima de la media del mismo cliente
      SELECT p.*
      FROM pedidos p
      WHERE p.total > (
        SELECT AVG(p2.total) FROM pedidos p2
        WHERE p2.cliente_id = p.cliente_id
      );
      
      -- Subconsulta en FROM (tabla derivada)
      SELECT t.cliente_id, t.num_pedidos, t.total
      FROM (
        SELECT cliente_id, COUNT(*) AS num_pedidos, SUM(total) AS total
        FROM pedidos
        GROUP BY cliente_id
      ) AS t
      ORDER BY t.total DESC;
      
      -- CTE (WITH): top 5 clientes por gasto (idéntico a tabla derivada, pero más legible)
      WITH gasto AS (
        SELECT cliente_id, SUM(total) AS total
        FROM pedidos
        GROUP BY cliente_id
      )
      SELECT c.nombre, g.total
      FROM gasto g JOIN clientes c ON c.id = g.cliente_id
      ORDER BY g.total DESC
      LIMIT 5;
      

### 6) Inserciones (`INSERT`)

Inserta una fila, varias filas, duplica desde otra tabla, o resuelve conflictos con `ON DUPLICATE KEY UPDATE`.

    -- Una y varias filas
      INSERT INTO productos (nombre, categoria, precio, stock)
      VALUES ('Altavoces', 'perifericos', 24.99, 40),
             ('Webcam', 'perifericos', 39.00, 30);
      
      -- INSERT ... SELECT (cargar desde otra tabla/consulta)
      INSERT INTO lineas_pedido (pedido_id, posicion, producto, cantidad, precio)
      SELECT 2, ROW_NUMBER() OVER (ORDER BY id), nombre, 1, precio
      FROM productos
      WHERE categoria = 'perifericos' AND precio <= 25
      LIMIT 1;
      
      -- Resolver duplicados por clave única (ej.: email de clientes)
      INSERT INTO clientes (nombre, email)
      VALUES ('Ada L.','ada@ejemplo.com')
      ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);
      
      -- REPLACE INTO (cuidado: borra e inserta; dispara ON DELETE)
      REPLACE INTO productos (id, nombre, categoria, precio, stock)
      VALUES (1, 'Libro BBDD (2ª ed.)', 'libros', 42.00, 40);
      

**Seguridad en inserciones.** Valida rangos y valores por defecto en el *DDL* (`NOT NULL`, `CHECK`). Evita depender solo de validaciones en la aplicación.

### 7) Actualizaciones (`UPDATE`)

Actualiza columnas con expresiones, usa `CASE` para reglas, y recuerda que puedes hacer `UPDATE ... JOIN` para aplicar cambios basados en otra tabla.

    -- Subir precio un 5% en 'perifericos' con tope
      UPDATE productos
      SET precio = LEAST(precio * 1.05, 50)
      WHERE categoria = 'perifericos';
      
      -- Marcar clientes inactivos sin pedidos en 2 años
      UPDATE clientes c
      LEFT JOIN pedidos p
        ON p.cliente_id = c.id
        AND p.fecha_pedido >= (CURRENT_DATE - INTERVAL 2 YEAR)
      SET c.activo = 0
      WHERE p.id IS NULL;
      
      -- Recalcular total de un pedido desde sus líneas
      UPDATE pedidos p
      JOIN (
        SELECT pedido_id, SUM(cantidad * precio) AS total_calc
        FROM lineas_pedido
        GROUP BY pedido_id
      ) t ON t.pedido_id = p.id
      SET p.total = t.total_calc
      WHERE p.id = 2;
      

### 8) Borrados (`DELETE`)

Usa `DELETE` con `WHERE` (sin WHERE, borra toda la tabla). Para borrar con condición basada en otra tabla, utiliza `DELETE ... JOIN`. Para vaciar rápido toda la tabla y reiniciar `AUTO_INCREMENT`, `TRUNCATE TABLE` (ojo: es DDL).

    -- Borrar productos sin stock y baratos
      DELETE FROM productos
      WHERE stock = 0 AND precio < 10;
      
      -- Borrar líneas de pedidos cancelados
      DELETE lp
      FROM lineas_pedido lp
      JOIN pedidos p ON p.id = lp.pedido_id
      WHERE p.estado = 'cancelado';
      
      -- Vaciar tabla (reinicia AUTO_INCREMENT)
      TRUNCATE TABLE productos;
      

**Modo seguro de MySQL Workbench/CLI.** Si tienes activado `SQL_SAFE_UPDATES`, necesitas `WHERE` con clave o `LIMIT`. Puedes desactivarlo con `SET SQL_SAFE_UPDATES=0;` (mejor aprender a filtrar bien).

### 9) Operadores de conjuntos (`UNION` y `UNION ALL`)

Une resultados de varias consultas compatibles (mismo número y tipo de columnas). `UNION` elimina duplicados; `UNION ALL` los conserva.

    -- Catálogo mixto: nombres que vengan de productos o de líneas de pedido
      SELECT nombre FROM productos
      UNION
      SELECT producto FROM lineas_pedido;
      

### 10) (Opcional) Funciones de ventana

MySQL 8.0 incorpora **ventanas** (`OVER`), útiles para rankings y totales acumulados sin perder el detalle fila a fila.

    -- Ranking de productos por precio dentro de su categoría
      SELECT categoria, nombre, precio,
             RANK() OVER (PARTITION BY categoria ORDER BY precio DESC) AS pos
      FROM productos;
      
      -- Total acumulado de ventas por cliente (ejemplo sobre pedidos)
      SELECT c.nombre, p.fecha_pedido, p.total,
             SUM(p.total) OVER (PARTITION BY c.id ORDER BY p.fecha_pedido) AS acumulado
      FROM clientes c
      JOIN pedidos p ON p.cliente_id = c.id
      ORDER BY c.nombre, p.fecha_pedido;
      

### 11) Buenas prácticas y errores comunes

- Evita `SELECT *` en producción: selecciona solo lo necesario.
- Filtra pronto: las condiciones en `WHERE` y los *joins* adecuados mejoran el plan.
- Comprueba planes con `EXPLAIN` cuando una consulta sea lenta.
- Cuida los índices que soportan tus filtros y joins más frecuentes.
- No uses `DELETE`/`UPDATE` masivos sin `WHERE` (y considera transacciones).

### 12) Ejercicios guiados

1.  **Una tabla:** Lista los 3 productos más caros de cada categoría, mostrando categoría, nombre, precio y su posición dentro de la categoría (1–3).

    Solución orientativa

        WITH r AS (
            SELECT categoria, nombre, precio,
                   ROW_NUMBER() OVER (PARTITION BY categoria ORDER BY precio DESC) AS rn
            FROM productos
          )
          SELECT categoria, nombre, precio, rn
          FROM r
          WHERE rn <= 3
          ORDER BY categoria, rn;
          

2.  **Agrupación:** Muestra por categoría el número de productos con stock \> 0 y el precio medio.

    Solución orientativa

        SELECT categoria,
                 COUNT(*) AS num,
                 ROUND(AVG(precio),2) AS media
          FROM productos
          WHERE stock > 0
          GROUP BY categoria;
          

3.  **Varios joins:** Saca el importe total por pedido (`SUM(cantidad*precio)`) junto con el nombre del cliente y la fecha, incluyendo pedidos sin líneas (importe 0).

    Solución orientativa

        SELECT p.id, c.nombre, p.fecha_pedido,
                 COALESCE(SUM(lp.cantidad * lp.precio),0) AS importe
          FROM pedidos p
          JOIN clientes c ON c.id = p.cliente_id
          LEFT JOIN lineas_pedido lp ON lp.pedido_id = p.id
          GROUP BY p.id, c.nombre, p.fecha_pedido
          ORDER BY p.fecha_pedido DESC;
          

4.  **Subconsulta correlacionada:** Pedidos cuyo total es mayor que la media de sus pedidos del mismo cliente.

    Solución orientativa

        SELECT p.*
          FROM pedidos p
          WHERE p.total > (
            SELECT AVG(p2.total) FROM pedidos p2 WHERE p2.cliente_id = p.cliente_id
          );
          

## 3.c) DML en MySQL — Inserciones, actualizaciones y borrado (CRUD)

En DML no todo es `SELECT`. En el día a día insertamos nuevas filas (`INSERT`), modificamos datos existentes (`UPDATE`) y eliminamos filas (`DELETE`). También veremos variantes útiles como `INSERT ... SELECT`, `ON DUPLICATE KEY UPDATE`, `INSERT IGNORE`, `REPLACE`, actualizaciones/borrados con *JOIN*, y diferencias con `TRUNCATE`. Todo con **MySQL 8.0+** y el esquema del tema.

### 1) INSERT — insertar filas

La forma básica es indicar las columnas destino y los valores en el mismo orden. Si no indicas una columna, se aplica su `DEFAULT` (si lo tiene) o `NULL` (si lo permite). Para claves autoincrementales usa `AUTO_INCREMENT`. Tras un `INSERT`, recupera el identificador con `SELECT LAST_INSERT_ID();`

    -- Una fila
      INSERT INTO clientes (nombre, email) 
      VALUES ('Grace Hopper','grace@ejemplo.com');
      
      -- Varias filas en una sola sentencia
      INSERT INTO productos (nombre, categoria, precio, stock) VALUES
        ('Auriculares', 'perifericos', 19.95, 40),
        ('SSD 1TB',    'almacenamiento', 89.00, 25);
      
      -- Insertar sin algunas columnas (usará DEFAULT o NULL)
      INSERT INTO pedidos (cliente_id, estado) VALUES (1, 'pendiente');
      
      -- Recuperar el último id autogenerado (sesión actual)
      SELECT LAST_INSERT_ID() AS nuevo_pedido_id;
      

#### 1.1) INSERT ... SELECT (cargar desde otra tabla/consulta)

Muy útil para migraciones o para duplicar datos transformados. La lista de columnas de destino debe ser compatible con la consulta.

    -- Crear líneas copiando productos baratos como «regalos» del pedido 3
      INSERT INTO lineas_pedido (pedido_id, posicion, producto, cantidad, precio)
      SELECT 3,
             ROW_NUMBER() OVER (ORDER BY id) AS posicion,
             nombre,
             1 AS cantidad,
             0.00 AS precio
      FROM productos
      WHERE precio <= 10;
      

#### 1.2) Manejo de duplicados

**Contexto.** Cuando hay un índice `UNIQUE` (por ejemplo en `clientes.email`) un `INSERT` que lo rompa fallará. Tienes tres estrategias: *reemplazar*, *ignorar* o *fusionar/actualizar*.

    -- a) ON DUPLICATE KEY UPDATE (upsert): si choca con una clave única, actualiza
      INSERT INTO clientes (nombre, email)
      VALUES ('Grace H.', 'grace@ejemplo.com')
      ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);   -- véase nota abajo
      
      -- Nota: En MySQL 8.0.20+ la función VALUES() está deprecada.
      -- Alternativa moderna: alias de la fila insertada (cuando tu versión lo permita):
      -- INSERT INTO clientes AS nuevo (nombre, email)
      -- VALUES ('Grace H.', 'grace@ejemplo.com')
      -- ON DUPLICATE KEY UPDATE nombre = nuevo.nombre;
      
      -- b) INSERT IGNORE: no lanza error; las filas problemáticas se ignoran (¡ojo!)
      INSERT IGNORE INTO clientes (nombre, email)
      VALUES ('Duplicada','grace@ejemplo.com');
      
      -- c) REPLACE: borra la fila que choque y la inserta de nuevo (dispara ON DELETE + ON INSERT)
      REPLACE INTO clientes (id, nombre, email)
      VALUES (1, 'Grace H. (actualizada)', 'grace@ejemplo.com');
      

**Advertencia.** `INSERT IGNORE` puede ocultar problemas (datos truncados, *checks* que fallan, etc.). `REPLACE` elimina y vuelve a insertar: puede perder valores de otras columnas no incluidas y dispara disparadores (*triggers*). Para la mayoría de casos, prefiero `ON DUPLICATE KEY UPDATE`.

### 2) UPDATE — modificar filas

Actualiza columnas con expresiones, funciones y condiciones. Recuerda que sin `WHERE` se actualiza *toda* la tabla. En MySQL Workbench y CLI suele estar activo `SQL_SAFE_UPDATES` (modo seguro), que exige `WHERE` por clave o `LIMIT`.

    -- Subir el precio un 5% en «perifericos», con tope 50€
      UPDATE productos
      SET precio = LEAST(precio * 1.05, 50)
      WHERE categoria = 'perifericos';
      
      -- Reglas condicionales con CASE
      UPDATE productos
      SET precio = CASE
        WHEN categoria = 'libros' THEN precio * 0.95   -- 5% descuento
        WHEN stock <= 5          THEN precio * 1.10   -- recargo por escasez
        ELSE precio
      END;
      
      -- Modo seguro (si bloquea la ejecución, desactívalo en tu sesión)
      -- SET SQL_SAFE_UPDATES = 0;
      

#### 2.1) UPDATE con JOIN (basado en otra tabla)

Muy potente para sincronizar campos entre tablas relacionadas o resultados agregados.

    -- Recalcular el total del pedido 2 desde sus líneas
      UPDATE pedidos p
      JOIN (
        SELECT pedido_id, SUM(cantidad * precio) AS total_calc
        FROM lineas_pedido
        GROUP BY pedido_id
      ) t ON t.pedido_id = p.id
      SET p.total = t.total_calc
      WHERE p.id = 2;
      
      -- Desactivar clientes sin pedidos en los últimos 2 años
      UPDATE clientes c
      LEFT JOIN pedidos p
        ON p.cliente_id = c.id
        AND p.fecha_pedido >= (CURRENT_DATE - INTERVAL 2 YEAR)
      SET c.activo = 0
      WHERE p.id IS NULL;
      

#### 2.2) ORDER BY y LIMIT en UPDATE

MySQL permite limitar cuántas filas actualizas y en qué orden. Útil para «trabajar por lotes».

    -- Subir un céntimo a los 10 productos más baratos
      UPDATE productos
      SET precio = precio + 0.01
      ORDER BY precio ASC
      LIMIT 10;
      
      -- Filas afectadas en esta sesión
      SELECT ROW_COUNT() AS filas_modificadas;
      

### 3) DELETE — eliminar filas

Igual que en `UPDATE`, si omites `WHERE` borrarás toda la tabla. Puedes borrar en base a otra tabla con `DELETE ... JOIN`.

    -- Borrar productos sin stock y baratos
      DELETE FROM productos
      WHERE stock = 0 AND precio < 10;
      
      -- Borrar líneas de pedidos cancelados (apoyándonos en la tabla pedidos)
      DELETE lp
      FROM lineas_pedido lp
      JOIN pedidos p ON p.id = lp.pedido_id
      WHERE p.estado = 'cancelado';
      
      -- Borrar por lotes, controlando el número
      DELETE FROM lineas_pedido
      WHERE pedido_id = 3
      ORDER BY posicion DESC
      LIMIT 1;
      

#### 3.1) TRUNCATE vs DELETE vs DROP

| Operación              | Qué hace                         | Notas                                                                                                                             |
|------------------------|----------------------------------|-----------------------------------------------------------------------------------------------------------------------------------|
| `DELETE FROM tabla`    | Elimina filas según `WHERE`      | Lento en tablas grandes (borra fila a fila). Respeta *triggers*. No reinicia `AUTO_INCREMENT` salvo que lo fuerces.               |
| `TRUNCATE TABLE tabla` | Vacía toda la tabla              | Es DDL (implícitamente hace `COMMIT`), muy rápido, reinicia `AUTO_INCREMENT`, no dispara *triggers*. Requiere permisos más altos. |
| `DROP TABLE tabla`     | Elimina la tabla y su definición | Destruye también índices, permisos y datos. Irreversible salvo copia de seguridad.                                                |

### 4) Integridad y transacciones: cómo afectan al CRUD

- **Claves ajenas:** un `DELETE` puede fallar si hay filas hijas sin una acción definida; usa `ON DELETE CASCADE` o `ON DELETE SET NULL` si es correcto en tu modelo.
- **CHECK/NOT NULL/UNIQUE:** evitan que `INSERT`/`UPDATE` dejen datos inconsistentes. Prefiere validar en la BD además de en la app.
- **Transacciones (TCL):** agrupa cambios dependientes con `START TRANSACTION` → `COMMIT` / `ROLLBACK`. Úsalo siempre en operaciones multi-tabla.

<!-- -->

    -- Alta de cliente y pedido de forma atómica
      START TRANSACTION;
        INSERT INTO clientes (nombre, email) VALUES ('Ada L.','ada@ejemplo.com');
        SET @id_cliente = LAST_INSERT_ID();
      
        INSERT INTO pedidos (cliente_id, estado, total)
        VALUES (@id_cliente, 'pendiente', 0);
      
        -- si todo va bien:
      COMMIT;
      -- si algo falla: ROLLBACK;
      

### 5) Mini-prácticas rápidas

1.  **Upsert de productos.** Inserta o actualiza el precio y el stock de un producto por su nombre (único).

    Solución orientativa

        ALTER TABLE productos ADD CONSTRAINT uq_prod_nombre UNIQUE (nombre);
          
          INSERT INTO productos (nombre, categoria, precio, stock)
          VALUES ('USB-C 64GB','almacenamiento', 14.99, 80)
          ON DUPLICATE KEY UPDATE
            precio = VALUES(precio),
            stock  = VALUES(stock);
          

2.  **Actualizar por join.** Sube un 10% el precio de todos los productos vendidos alguna vez.

    Solución orientativa

        UPDATE productos pr
          JOIN lineas_pedido lp ON lp.producto = pr.nombre
          SET pr.precio = pr.precio * 1.10;
          

3.  **Borrado seguro.** Borra como máximo 20 pedidos cancelados más antiguos, manteniendo un registro por si hay que deshacer.

    Solución orientativa

        START TRANSACTION;
            -- (opcional) copiar ids a una tabla temporal / registro
            CREATE TEMPORARY TABLE a_borrar AS
              SELECT id FROM pedidos
              WHERE estado = 'cancelado'
              ORDER BY fecha_pedido ASC
              LIMIT 20;
          
            DELETE p
            FROM pedidos p
            JOIN a_borrar t ON t.id = p.id;
          COMMIT;
          

**Checklist mental antes de ejecutar un CRUD masivo:** 1) ¿Tengo `WHERE` correcto? 2) ¿Afectarán FKs/índices/triggers? 3) ¿Necesito transacción? 4) ¿He probado con `SELECT` previo? 5) ¿Debo limitar (`LIMIT`) o paginar por lotes?

## 4.b) DCL en MySQL — Usuarios, roles y privilegios (guía completa)

Con **DCL** definimos *quién* puede hacer *qué* en nuestra base de datos. En MySQL 8.0 trabajaremos con **usuarios** (`CREATE USER`, `ALTER USER`, `DROP USER`), **roles** (`CREATE ROLE`, `GRANT ... TO`), y **privilegios** (`GRANT`, `REVOKE`). Aplicaremos el principio de mínimo privilegio y veremos buenas prácticas para entornos reales.

| Nivel           | Ámbito                             | Ejemplo de destino       | Cuándo usar                        |
|-----------------|------------------------------------|--------------------------|------------------------------------|
| Global          | Todo el servidor                   | `*.*`                    | Administración (evítalo para apps) |
| Base de datos   | Una BD                             | `tienda.*`               | Permisos típicos de app            |
| Tabla / Vista   | Objeto concreto                    | `tienda.pedidos`         | Control fino                       |
| Columna         | Columnas específicas               | `tienda.clientes(email)` | Informes parciales                 |
| Rutina / Evento | Procedimientos, funciones, eventos | `tienda.fn_calcular()`   | Ejecución controlada               |

### 1) Crear usuarios (identidad y seguridad)

Un usuario en MySQL es `'nombre'@'host'`. El *host* controla desde dónde se puede conectar (p. ej., `'app'@'localhost'` solo desde el propio servidor; `'app'@'%'` desde cualquier IP). En MySQL 8.0, el plugin de autenticación por defecto es `caching_sha2_password`.

    -- Crear una usuaria de aplicación con contraseña fuerte
      CREATE USER 'app_ro'@'%' IDENTIFIED BY 'Contraseña#Segura#2025';
      
      -- Crear otro usuario restringido a conexiones locales
      CREATE USER 'app_rw'@'localhost' IDENTIFIED BY 'Otra#Fuerte#2025';
      
      -- Políticas: caducidad, bloqueo por intentos, etc.
      ALTER USER 'app_ro'@'%'
        PASSWORD EXPIRE INTERVAL 180 DAY
        FAILED_LOGIN_ATTEMPTS 6
        PASSWORD HISTORY 5
        PASSWORD REUSE INTERVAL 365 DAY;
      
      -- Reglas de conexión segura (si tu despliegue usa TLS)
      ALTER USER 'app_ro'@'%' REQUIRE SSL;
      
      -- Cambiar contraseña más tarde
      ALTER USER 'app_ro'@'%' IDENTIFIED BY 'Nueva#Contraseña#2026';
      

**Consejo.** Evita `'root'@'%'` y no uses cuentas de administración en la aplicación. Crea *usuarios de servicio* con permisos mínimos.

### 2) Privilegios: GRANT y REVOKE

Los privilegios más comunes: `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `CREATE`, `ALTER`, `DROP`, `INDEX`, `REFERENCES`, `CREATE VIEW`, `SHOW VIEW`, `TRIGGER`, `EVENT`, `EXECUTE`. Evita `FILE` salvo casos muy controlados.

    -- Lectura en toda la BD 'tienda' (afecta a tablas actuales y futuras de esa BD)
      GRANT SELECT ON tienda.* TO 'app_ro'@'%';
      
      -- Lectura + escritura solo en tablas de negocio (ejemplo fino por tabla)
      GRANT SELECT, INSERT, UPDATE, DELETE ON tienda.pedidos       TO 'app_rw'@'localhost';
      GRANT SELECT, INSERT, UPDATE, DELETE ON tienda.lineas_pedido TO 'app_rw'@'localhost';
      
      -- Privilegios de definición (DDL) para tareas de mantenimiento
      GRANT CREATE, ALTER, INDEX, DROP ON tienda.* TO 'app_rw'@'localhost';
      
      -- Column-level: permitir UPDATE solo de 'telefono' y 'email' en clientes
      GRANT UPDATE (telefono, email) ON tienda.clientes TO 'app_rw'@'localhost';
      
      -- Revocar privilegios (siempre especifica el mismo ámbito que concediste)
      REVOKE INSERT, UPDATE ON tienda.pedidos FROM 'app_rw'@'localhost';
      
      -- Mostrar lo que tiene un usuario
      SHOW GRANTS FOR 'app_rw'@'localhost'\G
      

**Con `WITH GRANT OPTION` cuidado.** Permite a un usuario *redistribuir* privilegios. Evítalo en cuentas de aplicación; resérvalo para administración.

### 3) Roles (reutiliza conjuntos de privilegios)

Un **rol** agrupa privilegios y se puede otorgar a usuarios (¡incluso a otros roles!). Actívalo por defecto con `SET DEFAULT ROLE` para que se cargue al iniciar sesión.

    -- 1) Definir roles
      CREATE ROLE 'rol_lectura', 'rol_escritura';
      
      -- 2) Dar privilegios a los roles
      GRANT SELECT ON tienda.* TO 'rol_lectura';
      GRANT SELECT, INSERT, UPDATE, DELETE ON tienda.* TO 'rol_escritura';
      
      -- 3) Asignar roles a usuarios (con o sin capacidad de administrarlos)
      GRANT 'rol_lectura'  TO 'app_ro'@'%';
      GRANT 'rol_escritura' TO 'app_rw'@'localhost' WITH ADMIN OPTION;
      
      -- 4) Activar roles por defecto para cada usuario
      SET DEFAULT ROLE 'rol_lectura'  TO 'app_ro'@'%';
      SET DEFAULT ROLE 'rol_escritura' TO 'app_rw'@'localhost';
      
      -- Comprobar
      SHOW GRANTS FOR 'app_ro'@'%'\G
      

**BD completa vs. tabla suelta.** Dar permisos a nivel *base de datos* (p. ej., `tienda.*`) aplica a tablas existentes *y a las que se creen después* en esa BD. Para casos especiales, complementa con tabla/columna.

### 4) Vistas con seguridad controlada

Las **vistas** permiten exponer un subconjunto de datos. Con `SQL SECURITY DEFINER` la vista se ejecuta con los privilegios de su creador (ideal para encapsular reglas de acceso).

    -- Vista de solo lectura con columnas permitidas
      CREATE VIEW v_clientes_publicos
      SQL SECURITY DEFINER
      AS
      SELECT id, nombre, email
      FROM tienda.clientes;
      
      -- Dar permiso solo sobre la vista, no sobre la tabla
      GRANT SELECT ON tienda.v_clientes_publicos TO 'app_ro'@'%';
      

### 5) Gestión del ciclo de vida: renombrar, bloquear, borrar

    -- Bloquear una cuenta temporalmente (no puede autenticarse)
      ALTER USER 'app_rw'@'localhost' ACCOUNT LOCK;
      
      -- Desbloquear
      ALTER USER 'app_rw'@'localhost' ACCOUNT UNLOCK;
      
      -- Renombrar usuario (útil en migraciones)
      RENAME USER 'app_rw'@'localhost' TO 'app_writer'@'localhost';
      
      -- Borrar usuario (se revocan sus roles/privilegios automáticamente)
      DROP USER IF EXISTS 'app_writer'@'localhost';
      

### 6) Cómo decide MySQL qué usuario coincide (resolución `user@host`)

Si existen varias entradas que podrían coincidir (p. ej., `'ana'@'localhost'` y `'ana'@'%'`), MySQL elige la más específica. Revisa con `SELECT user, host FROM mysql.user ORDER BY host;` para detectar solapamientos.

### 7) Buenas prácticas de seguridad

- Principio de **mínimo privilegio**: da solo lo imprescindible.
- Separa *cuentas de administración* de *cuentas de aplicación*.
- Usa **roles** para estandarizar permisos y simplificar auditorías.
- Revisa periódicamente con `SHOW GRANTS` y elimina cuentas que no se usan (*account hygiene*).
- Activa políticas de **contraseña** (caducidad, intentos fallidos, complejidad) y, si procede, **TLS** (`REQUIRE SSL`).
- Evita `FILE` y privilegios globales para usuarios de app.

### 8) Escenarios prácticos

1.  **Solo lectura para analistas externos** (acceso desde cualquier IP, sin redistribuir permisos).

    Solución orientativa

        CREATE USER 'analista'@'%' IDENTIFIED BY 'Analista#2025';
          GRANT SELECT ON tienda.* TO 'analista'@'%';
          -- impedir que delegue permisos:
          -- (no usamos WITH GRANT OPTION)
          SHOW GRANTS FOR 'analista'@'%'\G
          

2.  **Aplicación con CRUD limitado** (sin DROP/ALTER).

    Solución orientativa

        CREATE USER 'app'@'%' IDENTIFIED BY 'App#2025';
          GRANT SELECT, INSERT, UPDATE, DELETE ON tienda.* TO 'app'@'%';
          -- nada de DDL ni privilegios peligrosos
          

3.  **Permitir edición solo de ciertas columnas sensibles** (p. ej., teléfono y email).

    Solución orientativa

        GRANT UPDATE (telefono, email) ON tienda.clientes TO 'app'@'%';
          REVOKE UPDATE ON tienda.clientes FROM 'app'@'%'; -- elimina UPDATE global a la tabla si lo tuviera
          

**Errores típicos.** 1) Dar permisos en `*.*` a cuentas de app. 2) Usar `'%'` sin necesidad (prefiere rangos/hosts concretos). 3) Olvidar `SET DEFAULT ROLE` tras asignar roles. 4) Conceder `WITH GRANT OPTION` a usuarios no administradores.

## 5.b) TCL en MySQL — Transacciones en profundidad

**TCL** (Transaction Control Language) nos da el control sobre cómo se aplican o deshacen los cambios en la base de datos. En MySQL (InnoDB) trabajamos con `START TRANSACTION`/`BEGIN`, `COMMIT`, `ROLLBACK`, `SAVEPOINT` y los **niveles de aislamiento**. Además, entenderemos cómo funcionan los *bloqueos* (row locks) y la *lectura consistente* (MVCC) para evitar sorpresas en concurrencia.

### 1) Autocommit y transacciones explícitas

Por defecto MySQL suele tener `autocommit=1`: cada sentencia DML se confirma sola. Para agrupar varias operaciones dependientes, desactiva autocommit o usa una transacción explícita.

    -- Ver/ajustar autocommit (sesión actual)
      SHOW VARIABLES LIKE 'autocommit';
      SET autocommit = 0;     -- a partir de ahora, cada sentencia queda pendiente hasta COMMIT
      
      -- Patrón recomendado: transacción explícita
      START TRANSACTION;       -- opcional: START TRANSACTION READ WRITE;
        -- ... tus INSERT/UPDATE/DELETE aquí ...
      COMMIT;                  -- aplica los cambios
      -- ROLLBACK;             -- si hubo error, deshazlo
      
      -- Volver a autocommit si quieres
      SET autocommit = 1;
      

#### 1.1) Ejemplo completo: alta de pedido atómica

Alta de pedido + líneas + recálculo del total. Si algo falla, nada queda a medias.

    START TRANSACTION;
      
        INSERT INTO pedidos (cliente_id, estado, total)
        VALUES (1, 'pendiente', 0);
      
        SET @id_pedido := LAST_INSERT_ID();
      
        INSERT INTO lineas_pedido (pedido_id, posicion, producto, cantidad, precio) VALUES
          (@id_pedido, 1, 'Libro BBDD', 1, 38.50),
          (@id_pedido, 2, 'Ratón', 1, 20.00);
      
        -- recalcular total desde las líneas
        UPDATE pedidos p
        JOIN (
          SELECT pedido_id, SUM(cantidad * precio) AS total_calc
          FROM lineas_pedido
          WHERE pedido_id = @id_pedido
          GROUP BY pedido_id
        ) t ON t.pedido_id = p.id
        SET p.total = t.total_calc;
      
      COMMIT;
      

**Consejo.** Antes de confirmar, valida supuestos (existencias, importes no negativos, etc.). Si algo no cuadra, `ROLLBACK;`.

### 2) SAVEPOINT, ROLLBACK TO y RELEASE

Los **savepoints** permiten “marcar” puntos intermedios para deshacer *parcialmente* sin perder toda la transacción.

    START TRANSACTION;
        -- operaciones A
        SAVEPOINT sp_despues_A;
      
        -- operaciones B (arriesgadas)
        -- ...
        -- Si algo sale mal:
        ROLLBACK TO sp_despues_A;  -- deshace solo B; A se mantiene
      
        -- seguimos con C...
        RELEASE SAVEPOINT sp_despues_A;  -- opcional: libera el savepoint
      COMMIT;
      

### 3) Niveles de aislamiento

Controlan qué fenómenos de concurrencia toleramos. InnoDB por defecto usa **REPEATABLE READ**. A mayor aislamiento, menos anomalías… y potencialmente menos concurrencia.

| Nivel                                | Lecturas sucias | No repetibles | Fantasmas                         |
|--------------------------------------|-----------------|---------------|-----------------------------------|
| READ UNCOMMITTED                     | posibles        | posibles      | posibles                          |
| READ COMMITTED                       | no              | posibles      | posibles                          |
| REPEATABLE READ (InnoDB por defecto) | no              | no            | mitigadas con *next-key locks*    |
| SERIALIZABLE                         | no              | no            | no (equivale a ejecutar en serie) |

    -- Fijar el aislamiento para la siguiente transacción
      SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
      START TRANSACTION;
        -- ... consultas y DML aquí se ejecutan con READ COMMITTED ...
      COMMIT;
      
      -- Fijarlo para toda la sesión
      SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ;
      

### 4) Lectura consistente (MVCC) y SELECT con bloqueo

Con MVCC, una consulta “ve” un *snapshot* consistente. Si necesitas **bloquear** filas para evitar que otra transacción las cambie (p. ej., al calcular stock), usa `SELECT ... FOR UPDATE` (bloqueo exclusivo) o `SELECT ... FOR SHARE` (bloqueo compartido).

    START TRANSACTION;
      
        -- Bloquear una fila de productos para actualización de stock
        SELECT id, stock
        FROM productos
        WHERE id = 10
        FOR UPDATE;   -- evita que otra transacción la modifique hasta COMMIT/ROLLBACK
      
        -- comprobar stock y actualizar
        UPDATE productos SET stock = stock - 1 WHERE id = 10 AND stock > 0;
      
      COMMIT;
      

**Matiz.** `FOR SHARE` ofrece lectura con bloqueo compartido (antes se usaba `LOCK IN SHARE MODE`). En versiones recientes existen variantes para cola de trabajo (*NOWAIT* / *SKIP LOCKED*) si tu servidor las soporta.

### 5) Deadlocks y lock waits: cómo reconocerlos y actuar

Un **deadlock** aparece cuando dos transacciones se esperan mutuamente. InnoDB detecta el ciclo y aborta una de ellas con error para liberar el bloqueo. Estrategia: *captura el error, haz ROLLBACK y reintenta*.

    -- Escenario didáctico (dos sesiones)
      -- Sesión A
      START TRANSACTION;
      UPDATE productos SET precio = precio + 1 WHERE id = 1;
      -- (sin COMMIT) ahora intenta:
      UPDATE productos SET precio = precio + 1 WHERE id = 2;
      
      -- Sesión B
      START TRANSACTION;
      UPDATE productos SET precio = precio + 1 WHERE id = 2;
      -- (sin COMMIT) ahora intenta:
      UPDATE productos SET precio = precio + 1 WHERE id = 1;
      -- InnoDB detectará deadlock en una de las sesiones
      

**Evítalos con orden consistente.** Actualiza filas en el mismo orden en todas las transacciones (por ejemplo, siempre por `id` ascendente). Usa índices adecuados para que el *where* seleccione por clave y reduzca bloqueos.

**Diagnóstico.** Si necesitas detalles, consulta el último conflicto en `SHOW ENGINE INNODB STATUS\G` o las vistas de *performance_schema* relacionadas con bloqueos si están activadas.

### 6) DDL y *commits* implícitos

En MySQL, muchas sentencias DDL fuerzan **commits implícitos** antes y después de ejecutarse (p. ej., `CREATE/DROP/ALTER TABLE`, `TRUNCATE`, `CREATE/DROP DATABASE`, `LOCK/UNLOCK TABLES`). No puedes incluirlas “a medias” en una transacción y esperar deshacerlas.

    START TRANSACTION;
        DELETE FROM pedidos WHERE estado = 'cancelado';
        -- ¡Ojo! Esto hace commit implícito, no es parte de la transacción:
        TRUNCATE TABLE log_temporal;
      -- COMMIT aquí no afectará al TRUNCATE anterior
      

### 7) Patrón práctico: “disminuir stock” de forma segura

Disminuir stock debe ser *atómico* y evitar condiciones de carrera. Bloqueamos la fila de producto, validamos, y aplicamos el cambio.

    START TRANSACTION;
      
        -- bloquear fila del producto
        SELECT stock FROM productos WHERE id = 42 FOR UPDATE;
      
        -- verificar disponibilidad
        -- (si no hay stock, ROLLBACK y notificar)
        UPDATE productos
        SET stock = stock - 1
        WHERE id = 42 AND stock > 0;
      
        -- comprobar que realmente se afectó 1 fila
        SELECT ROW_COUNT() AS filas_afectadas;
      
        -- opcional: registrar movimiento, insertar línea de pedido, etc.
      
      COMMIT;
      

### 8) Errores comunes y buenas prácticas

- Olvidar **COMMIT/ROLLBACK**: deja bloqueos abiertos y sesiones colgadas.
- Mezclar **DDL** en mitad de una lógica DML crítica: provoca *commits* implícitos.
- Asumir que **SELECT** “ve” cambios de otra transacción sin confirmar: con MVCC no es así (salvo que bloquees explícitamente).
- No controlar errores de **deadlock** o **lock wait timeout**: añade un pequeño *retry* exponencial.
- Elegir niveles de aislamiento sin medir: empieza con *READ COMMITTED* o *REPEATABLE READ* según tu caso, y perfila.

### 9) Mini-prácticas guiadas

1.  **Rollback parcial.** Inserta dos líneas de pedido; simula un error en la segunda y usa `SAVEPOINT` para deshacer solo esa parte y confirmar el resto.

    Solución orientativa

        START TRANSACTION;
            INSERT INTO lineas_pedido VALUES (3,1,'USB-C',1,9.99);
            SAVEPOINT sp;
            INSERT INTO lineas_pedido VALUES (3,2,'Portátil 14"',1,-1.00); -- viola CHECK
            -- error: deshacer solo la segunda
            ROLLBACK TO sp;
          COMMIT;
          

2.  **Comparar aislamientos.** En dos sesiones, con *READ COMMITTED* y *REPEATABLE READ*, observa si una consulta repetida ve cambios confirmados por la otra sesión.
    Guía
    Ejecuta `SET SESSION TRANSACTION ISOLATION LEVEL ...`, empieza una transacción, lanza `SELECT` y repítela tras un `UPDATE` confirmado desde otra sesión. Compara resultados.

3.  **Evitar deadlocks.** Diseña una actualización multi-fila que siempre recorra IDs en orden ascendente en todas las sesiones. Verifica que no se producen interbloqueos.

<a href="#top" class="backtotop" aria-label="Volver arriba">↑</a>

<a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="noopener noreferrer" title="CC BY-NC-SA 4.0"><img src="https://i.creativecommons.org/l/by-nc-sa/4.0/88x31.png" alt="Licencia Creative Commons BY-NC-SA 4.0" /></a>


