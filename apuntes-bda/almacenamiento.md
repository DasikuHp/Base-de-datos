# Almacenamiento de la información — fundamentos y evolución

Esta unidad introduce los conceptos fundamentales del almacenamiento de información: desde la distinción entre **dato e información**, pasando por las limitaciones de los **ficheros tradicionales**, hasta llegar a los **Sistemas Gestores de Bases de Datos (SGBD)** tanto relacionales como NoSQL. Comprenderemos cómo han evolucionado las tecnologías de almacenamiento para adaptarse a las necesidades de escalabilidad, rendimiento y flexibilidad que demandan las aplicaciones modernas.

## 1\. Datos e Información

Antes de introducirnos en el mundo de las bases de datos, resulta fundamental distinguir entre dos conceptos básicos: **dato** e **información**. Aunque en el lenguaje cotidiano se utilizan como sinónimos, en el ámbito de la informática no significan lo mismo. Un _dato_ es simplemente un valor aislado que por sí solo carece de un significado completo: puede ser un número, una fecha o una palabra. Por ejemplo, valores como _25_, _2024-06-10_ o _"Juan"_ son solo datos en bruto; no sabemos si se trata de una edad, una temperatura, una fecha de nacimiento o el nombre de un cliente. Por sí mismos, los datos no resuelven ninguna necesidad ni responden a ninguna pregunta.

La **información**, en cambio, surge cuando esos datos se organizan y se interpretan dentro de un contexto. Es el resultado de darles un significado que aporte conocimiento. Así, si decimos:

> "El día 15 de junio de 2024 en Valencia se registraron **25 grados centígrados**."

Ahora ya no hablamos de un simple número: hemos transformado el dato en una información útil, que nos dice qué ocurrió, dónde y cuándo. Este ejemplo muestra cómo la diferencia entre dato e información radica en el contexto y la interpretación que se les da.

### Ejemplos prácticos adicionales

Para entender mejor esta distinción, veamos más ejemplos cotidianos:

Dato aislado

Información contextualizada

42

El estudiante Juan García ha obtenido un 42% en el examen de matemáticas

2024-12-25

La entrega del proyecto final está programada para el 25 de diciembre de 2024

120/80

La presión arterial del paciente Pedro López es de 120/80 mmHg (valores normales)

EUR 1500

El salario mensual neto del empleado ES-1234 es de 1500 euros

Para entender mejor esta distinción conviene recordar algunos puntos clave:

-   Los datos son la **materia prima**, la información es el **producto procesado**.
-   Un mismo dato puede generar informaciones muy distintas según el contexto en el que se utilice.
-   En informática, lo importante no es acumular datos sin más, sino convertirlos en información que sirva para tomar decisiones.
-   El **conocimiento** va un paso más allá: es la capacidad de aplicar la información de forma práctica.
-   La **sabiduría** representa el nivel más alto: usar el conocimiento con juicio y criterio.

**Consejo:** Siempre que trabajes con un conjunto de datos, pregúntate: _¿qué información útil puedo extraer de aquí?_ Esa reflexión te ayudará a diferenciar entre almacenar datos sin valor y gestionar conocimiento real.

En resumen, los datos aislados carecen de valor práctico, mientras que la información organizada y contextualizada es la que verdaderamente aporta utilidad. Esta distinción es el punto de partida que justifica la necesidad de sistemas de almacenamiento y gestión eficientes, que veremos materializados en los **Sistemas de Bases de Datos**. A lo largo del curso, profundizaremos en cómo los SGBD permiten realizar esa transformación de manera estructurada, fiable y accesible.

## 2\. Ficheros

Antes de la popularización de las bases de datos, las organizaciones utilizaban ficheros para almacenar la información. Esta estrategia resultaba relativamente sencilla y económica: bastaba con definir un conjunto de archivos de texto o binarios en los que registrar datos de clientes, empleados, ventas o cualquier otro aspecto del negocio. De hecho, en entornos reducidos todavía hoy se encuentran sistemas de gestión que dependen de hojas de cálculo o ficheros planos.

Sin embargo, a medida que los sistemas crecieron en tamaño y en complejidad, las limitaciones de este enfoque se hicieron evidentes. La gestión basada únicamente en ficheros genera problemas de redundancia, falta de integridad y dificultades a la hora de acceder de manera eficiente a la información. Estos inconvenientes suponen un freno considerable para el desarrollo de aplicaciones seguras y escalables.

### 2.1 Principales problemas del almacenamiento en ficheros

-   **Redundancia de datos:** la misma información se guarda en múltiples ficheros, lo que provoca duplicidad innecesaria.
-   **Inconsistencia:** si se actualiza un dato en un fichero y no en los demás, aparecen contradicciones.
-   **Dificultad de acceso:** recuperar información requiere recorrer el fichero completo, lo que supone operaciones lentas.
-   **Escasa seguridad:** el control de accesos es limitado y no suele existir gestión de permisos granular.
-   **Problemas de integridad:** no hay mecanismos que aseguren que los datos cumplen reglas básicas (ejemplo: no admitir edades negativas).
-   **Mantenimiento costoso:** cualquier cambio en la estructura de un fichero puede obligar a reprogramar todas las aplicaciones asociadas.
-   **Concurrencia limitada:** cuando varios usuarios intentan modificar el mismo fichero simultáneamente, surgen conflictos.
-   **Falta de copias de seguridad automatizadas:** no existe un mecanismo centralizado de backup y recuperación.

### 2.2 Ejemplo práctico de problemas con ficheros

Imaginemos una pequeña empresa que gestiona sus clientes con ficheros CSV. Tiene tres departamentos:

```
// Fichero: ventas_clientes.csv
ID,Nombre,Telefono,Email
1,María López,600111222,maria@example.com
2,Juan García,600333444,juan@example.com

// Fichero: soporte_clientes.csv
ClienteID,Nombre,Email,Incidencias
1,María López,maria@example.com,3
2,Juan García,juan@example.com,1

// Fichero: contabilidad_clientes.csv
ID,Cliente,Facturacion
1,María López,15000
2,Juan García,8500
  
```

**Problemas que surgen:**

-   Si María cambia su email, hay que actualizar 3 ficheros distintos (redundancia e inconsistencia)
-   No hay forma de asegurar que el ID 1 siempre es la misma persona en los 3 ficheros
-   Si dos usuarios editan simultáneamente, uno puede sobrescribir los cambios del otro
-   No se puede validar que el teléfono tenga 9 dígitos o que el email contenga @
-   Para obtener un informe completo de un cliente, hay que leer y cruzar manualmente los 3 ficheros

Aunque los ficheros pueden ser útiles en proyectos pequeños o para almacenamiento temporal, **no son adecuados cuando el volumen de datos crece** o cuando la información debe compartirse entre distintos usuarios y aplicaciones. En estas situaciones, las bases de datos resultan imprescindibles.

## 3\. Bases de datos

Para superar las limitaciones de los sistemas basados en ficheros, surge el concepto de **base de datos**. Una base de datos no es simplemente un conjunto de ficheros: es un _almacén estructurado de información_, diseñado para garantizar la consistencia, integridad y disponibilidad de los datos. Además, las bases de datos están gestionadas por un software especializado que centraliza el control y ofrece un conjunto de herramientas para manipular la información de forma eficiente.

### 3.1 Características principales

-   **Centralización:** los datos se almacenan en un sistema único, accesible para distintas aplicaciones y usuarios.
-   **Reducción de redundancia:** la información se organiza de manera que se minimiza la duplicidad.
-   **Integridad:** se pueden definir reglas que aseguren que los datos cumplen restricciones lógicas y de negocio.
-   **Seguridad:** se gestionan permisos de acceso diferenciados para usuarios y grupos.
-   **Escalabilidad:** permiten manejar grandes volúmenes de información sin degradar el rendimiento.
-   **Flexibilidad en las consultas:** gracias a lenguajes especializados como SQL, es posible recuperar información compleja de forma rápida.
-   **Copias de seguridad y recuperación:** mecanismos automatizados de backup y restore.
-   **Control de concurrencia:** múltiples usuarios pueden trabajar simultáneamente sin conflictos.

### 3.2 Ejemplo comparativo

Retomando el ejemplo anterior de la empresa con ficheros CSV, con una base de datos tendríamos:

```
-- Una única tabla Clientes
CREATE TABLE Clientes (
    id INT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    telefono VARCHAR(9) CHECK (LENGTH(telefono) = 9),
    email VARCHAR(150) UNIQUE CHECK (email LIKE '%@%'),
    incidencias INT DEFAULT 0,
    facturacion DECIMAL(10,2) DEFAULT 0.00
);

-- Todos los departamentos consultan la misma información centralizada
-- Si María cambia su email, se actualiza una sola vez
-- Las restricciones CHECK garantizan integridad
-- Múltiples usuarios pueden trabajar simultáneamente
  
```

Gracias a estas características, las bases de datos se convierten en la solución natural para empresas, administraciones y organizaciones de todo tipo que necesiten almacenar y gestionar su información de manera fiable.

Piensa en una base de datos como en la infraestructura central de información de una organización. Igual que un sistema eléctrico distribuye la energía de forma segura y controlada a todos los dispositivos, la base de datos distribuye la información de manera estructurada, garantizando su integridad y accesibilidad.

## 4\. Sistemas Gestores de Bases de Datos (SGBD)

Una **base de datos** por sí sola no es suficiente para garantizar un uso eficiente y seguro de la información. Es necesario un sistema que proporcione mecanismos para crear, organizar, consultar, modificar y proteger los datos de forma estructurada. Aquí entran en juego los **Sistemas Gestores de Bases de Datos (SGBD)**, que son el conjunto de programas diseñados para facilitar todas estas operaciones. Gracias a ellos, los usuarios no necesitan preocuparse por la implementación técnica ni por los detalles del almacenamiento físico: basta con interactuar a través de lenguajes de consulta o de aplicaciones que se apoyan en el SGBD.

Las funciones principales de un SGBD incluyen la **definición** de estructuras de datos, la **inserción y modificación** de registros, la **gestión de transacciones** que aseguren propiedades como la consistencia, el control de **seguridad y accesos**, y la **recuperación ante fallos**. En la práctica, esto significa que un SGBD no solo organiza información, sino que también garantiza su integridad y la disponibilidad en todo momento.

### 4.1 Tipos de SGBD

A lo largo de la historia de la informática han surgido distintos tipos de SGBD, cada uno con características específicas y con ventajas en diferentes contextos. Conocerlos ayuda a entender por qué los sistemas actuales están diseñados de la manera en que lo están:

-   **SGBD jerárquicos:** organizan los datos en estructuras de árbol, con relaciones de tipo padre–hijo. Fueron muy usados en los años 60 y 70, sobre todo en sistemas bancarios y gubernamentales. Ejemplo: IBM IMS (Information Management System).
-   **SGBD en red:** permiten relaciones más flexibles entre registros, representando los datos en forma de grafo. Fueron una evolución de los jerárquicos para soportar estructuras más complejas. Ejemplo: IDMS (Integrated Database Management System).
-   **SGBD relacionales:** organizan los datos en tablas y son el estándar dominante desde los años 80 hasta hoy. Se basan en el álgebra relacional y lenguajes como SQL. Ejemplos: Oracle, MySQL, PostgreSQL, Microsoft SQL Server, MariaDB.
-   **SGBD orientados a objetos:** incorporan conceptos de la programación orientada a objetos para almacenar datos junto con su comportamiento. Aunque no llegaron a ser masivos, son útiles en aplicaciones muy específicas. Ejemplos: ObjectDB, db4o.
-   **SGBD NoSQL:** pensados para grandes volúmenes de datos y alta escalabilidad. Aquí encontramos sistemas de tipo clave–valor, orientados a documentos (como MongoDB), a grafos (como Neo4j) o a columnas (como Cassandra). Veremos estos sistemas en detalle en la sección 6.

### 4.2 Componentes de un SGBD

Un SGBD no es un único programa, sino un conjunto de módulos especializados que trabajan en conjunto para ofrecer todas las funcionalidades. Entre los principales componentes destacan:

-   **Motor de almacenamiento:** se encarga de guardar y recuperar los datos en memoria secundaria (discos). Gestiona aspectos como índices, páginas de datos, buffers y cachés.
-   **Procesador de consultas:** traduce las sentencias SQL en instrucciones ejecutables, optimizando la forma en que se accede a los datos. Incluye el parser (analizador sintáctico), el optimizador de consultas y el ejecutor.
-   **Gestor de transacciones:** asegura las propiedades ACID (Atomicidad, Consistencia, Aislamiento y Durabilidad). Maneja el control de concurrencia y la recuperación ante fallos.
-   **Gestor de seguridad:** controla accesos, permisos y autenticación de usuarios. Implementa roles, privilegios y políticas de seguridad.
-   **Catálogo del sistema:** también conocido como diccionario de datos, guarda metainformación sobre tablas, vistas, índices y permisos. Es el "mapa" que describe toda la estructura de la base de datos.
-   **Gestor de copias de seguridad:** permite realizar backups completos, incrementales y diferenciales, así como restaurar la base de datos a un punto en el tiempo.

No existe un único tipo de SGBD que sea perfecto para todo. La elección depende del tipo de datos, del volumen, de las consultas que se vayan a realizar y de la escalabilidad necesaria. En la práctica, muchas organizaciones combinan varias tecnologías: por ejemplo, PostgreSQL para datos transaccionales y MongoDB para datos no estructurados.

## 5\. Bases de Datos Relacionales

Los **Sistemas de Bases de Datos Relacionales** (RDBMS, por sus siglas en inglés) son el tipo de SGBD más utilizado en la actualidad. Su éxito se debe a que ofrecen un modelo sencillo y potente a la vez: los **datos se organizan en tablas** (también llamadas relaciones), compuestas por filas y columnas. Cada fila representa un registro único y cada columna un atributo o característica del mismo.

El modelo relacional fue propuesto por **Edgar F. Codd** en 1970 en su artículo "A Relational Model of Data for Large Shared Data Banks" y revolucionó la manera de entender las bases de datos. Gracias a él, la información puede gestionarse mediante operaciones matemáticas del _álgebra relacional_, lo que proporciona una base formal para la manipulación y consulta de datos.

### 5.1 Conceptos clave

-   **Relaciones (tablas):** cada tabla contiene información sobre una entidad, como `Clientes` o `Pedidos`. El nombre técnico es "relación".
-   **Filas (tuplas):** representan instancias concretas, como un cliente en particular o un pedido específico. Cada fila debe ser única.
-   **Columnas (atributos):** definen las características de la entidad, como `nombre`, `apellido` o `fecha_pedido`. Cada columna tiene un tipo de dato.
-   **Claves primarias (Primary Key):** identifican de forma única cada fila dentro de una tabla. No puede haber duplicados ni valores nulos en una clave primaria.
-   **Claves foráneas (Foreign Key):** permiten establecer vínculos entre tablas, garantizando la integridad referencial de los datos. Una clave foránea en una tabla hace referencia a la clave primaria de otra tabla.
-   **Índices:** estructuras auxiliares que aceleran las búsquedas en las tablas, similar a un índice de un libro.
-   **Vistas:** consultas predefinidas que se comportan como tablas virtuales, útiles para simplificar consultas complejas o restringir acceso a ciertos datos.

### 5.2 Ejemplo práctico completo

Supongamos una base de datos para gestionar pedidos en una tienda online. Necesitamos representar clientes, productos, pedidos y los detalles de cada pedido (qué productos contiene cada pedido).

```
-- Tabla de Clientes
CREATE TABLE Clientes (
    cliente_id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    telefono VARCHAR(15),
    fecha_registro DATE DEFAULT CURRENT_DATE,
    activo BOOLEAN DEFAULT TRUE
);

-- Tabla de Productos
CREATE TABLE Productos (
    producto_id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL CHECK (precio >= 0),
    stock INT DEFAULT 0 CHECK (stock >= 0),
    categoria VARCHAR(50)
);

-- Tabla de Pedidos
CREATE TABLE Pedidos (
    pedido_id INT PRIMARY KEY AUTO_INCREMENT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cliente_id INT NOT NULL,
    estado ENUM('pendiente', 'procesando', 'enviado', 'entregado', 'cancelado'),
    total DECIMAL(10,2),
    FOREIGN KEY (cliente_id) REFERENCES Clientes(cliente_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

-- Tabla de Detalles de Pedido (relación muchos a muchos entre Pedidos y Productos)
CREATE TABLE DetallesPedido (
    detalle_id INT PRIMARY KEY AUTO_INCREMENT,
    pedido_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (pedido_id) REFERENCES Pedidos(pedido_id)
        ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES Productos(producto_id)
        ON DELETE RESTRICT
);

-- Ejemplo de inserción de datos
INSERT INTO Clientes (nombre, apellido, email, telefono)
VALUES ('María', 'López', 'maria.lopez@example.com', '600111222');

INSERT INTO Productos (nombre, descripcion, precio, stock, categoria)
VALUES ('Laptop Dell XPS 13', 'Portátil ultraligero 13 pulgadas', 1299.99, 15, 'Informática');

INSERT INTO Pedidos (cliente_id, estado, total)
VALUES (1, 'pendiente', 1299.99);

INSERT INTO DetallesPedido (pedido_id, producto_id, cantidad, precio_unitario)
VALUES (1, 1, 1, 1299.99);

-- Consulta para ver todos los pedidos de un cliente con sus productos
SELECT
    c.nombre,
    c.apellido,
    p.pedido_id,
    p.fecha,
    p.estado,
    pr.nombre AS producto,
    dp.cantidad,
    dp.precio_unitario
FROM Clientes c
JOIN Pedidos p ON c.cliente_id = p.cliente_id
JOIN DetallesPedido dp ON p.pedido_id = dp.pedido_id
JOIN Productos pr ON dp.producto_id = pr.producto_id
WHERE c.cliente_id = 1;
  
```

En este ejemplo podemos observar:

-   Cada tabla tiene una clave primaria que identifica únicamente cada registro
-   Las claves foráneas establecen relaciones entre tablas (un pedido pertenece a un cliente)
-   Las restricciones CHECK aseguran la integridad (no puede haber precios o stocks negativos)
-   Las restricciones UNIQUE evitan duplicados (no puede haber dos clientes con el mismo email)
-   Las opciones ON DELETE y ON UPDATE definen el comportamiento en cascada
-   La tabla DetallesPedido resuelve la relación muchos a muchos entre Pedidos y Productos

### 5.3 Ventajas del modelo relacional

-   **Facilidad de comprensión:** las tablas son una forma intuitiva de organizar datos.
-   **Potencia en las consultas:** gracias a SQL se pueden realizar búsquedas muy complejas con JOINs, subconsultas y agregaciones.
-   **Integridad referencial:** asegura que los datos mantengan coherencia entre sí mediante claves foráneas.
-   **Escalabilidad vertical:** se adapta tanto a aplicaciones pequeñas como a sistemas empresariales masivos.
-   **Madurez y estandarización:** el lenguaje SQL está estandarizado y la tecnología lleva más de 40 años refinándose.
-   **Transacciones ACID:** garantiza consistencia y fiabilidad en operaciones críticas.
-   **Amplio ecosistema:** herramientas de administración, monitorización, backup y desarrollo muy maduras.

### 5.4 Propiedades ACID

Una de las características más importantes de las bases de datos relacionales es que garantizan las propiedades **ACID** en las transacciones:

Propiedad

Significado

Ejemplo

**Atomicidad**

Una transacción se ejecuta completamente o no se ejecuta en absoluto

En una transferencia bancaria, si falla el cargo, tampoco se realiza el abono

**Consistencia**

La base de datos pasa de un estado válido a otro estado válido

La suma de saldos antes y después de transferencias debe ser la misma

**Aislamiento**

Las transacciones concurrentes no interfieren entre sí

Dos usuarios comprando el último artículo no pueden comprarlo ambos

**Durabilidad**

Una vez confirmada, la transacción persiste incluso ante fallos

Si el sistema se cae tras confirmar un pago, este no se pierde

```
-- Ejemplo de transacción ACID: transferencia bancaria
START TRANSACTION;

-- Restar dinero de la cuenta origen
UPDATE Cuentas
SET saldo = saldo - 100
WHERE cuenta_id = 1;

-- Verificar que el saldo no quede negativo
-- Si queda negativo, hacer ROLLBACK automáticamente
-- (esto se haría con un CHECK constraint o trigger)

-- Sumar dinero a la cuenta destino
UPDATE Cuentas
SET saldo = saldo + 100
WHERE cuenta_id = 2;

-- Si todo está correcto, confirmar la transacción
COMMIT;

-- Si algo falla, deshacer todos los cambios
-- ROLLBACK;
  
```

Una buena práctica en bases de datos relacionales es _normalizar_ las tablas. La normalización consiste en aplicar reglas (formas normales) que eliminan redundancias y aseguran una mejor organización de los datos. Las principales formas normales son: 1FN (atributos atómicos), 2FN (dependencia total de la clave), 3FN (sin dependencias transitivas). Sin embargo, en algunos sistemas de alto rendimiento se aplican técnicas contrarias (desnormalización) para acelerar las consultas, aceptando cierta redundancia a cambio de velocidad.

## 6\. Bases de Datos NoSQL

### 6.1 Introducción a NoSQL

El término **NoSQL** (originalmente "No SQL", ahora también interpretado como "Not Only SQL") surgió a finales de la década de 2000 para describir una nueva generación de sistemas de bases de datos que rompen con el modelo relacional tradicional. Estas bases de datos nacieron como respuesta a las necesidades de empresas tecnológicas (Google, Amazon, Facebook) que debían manejar volúmenes masivos de datos distribuidos en múltiples servidores.

Las bases de datos NoSQL están diseñadas principalmente para:

-   **Escalabilidad horizontal:** distribuir datos entre cientos o miles de servidores
-   **Alto rendimiento:** procesar millones de operaciones por segundo
-   **Flexibilidad de esquema:** almacenar datos sin estructura fija predefinida
-   **Disponibilidad:** mantener el servicio activo incluso ante fallos de servidores
-   **Grandes volúmenes:** manejar petabytes de información distribuida

**¿Cuándo usar NoSQL?** Considera NoSQL cuando necesites escalabilidad horizontal masiva, cuando los datos no tengan una estructura fija, cuando priorices disponibilidad sobre consistencia estricta, o cuando trabajes con datos no relacionales (documentos JSON, grafos de relaciones sociales, series temporales).

### 6.2 Tipos de Bases de Datos NoSQL

A diferencia de las bases de datos relacionales que comparten un modelo común (tablas), las bases de datos NoSQL se dividen en varios tipos fundamentalmente diferentes:

Tipo

Modelo de datos

Casos de uso típicos

Ejemplos

**Documentales**

Documentos JSON/BSON

Aplicaciones web, CMS, catálogos de productos

MongoDB, CouchDB, RavenDB

**Clave-Valor**

Pares clave-valor simples

Cachés, sesiones, carritos de compra

Redis, Amazon DynamoDB, Riak

**Columnares**

Familias de columnas

Big Data, análisis, series temporales

Apache Cassandra, HBase, ScyllaDB

**Grafos**

Nodos y relaciones

Redes sociales, recomendaciones, detección de fraude

Neo4j, ArangoDB, Amazon Neptune

### 6.3 Bases de Datos Documentales

Las bases de datos documentales almacenan la información en documentos (normalmente JSON o BSON), donde cada documento puede tener una estructura diferente. No requieren un esquema fijo, lo que proporciona gran flexibilidad.

#### Características principales

-   Los documentos son autocontenidos y pueden incluir subdocumentos y arrays
-   No necesitan definir la estructura de antemano (schema-less o schema-flexible)
-   Permiten consultas complejas sobre los campos del documento
-   Soportan índices para acelerar búsquedas
-   Ideal para datos que naturalmente se representan como documentos (perfiles de usuario, artículos, productos)

#### Ejemplo práctico con MongoDB

```
// Colección de usuarios en MongoDB (equivalente a una tabla)
// Cada documento puede tener campos diferentes

// Usuario 1: perfil básico
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "nombre": "María López",
  "email": "maria@example.com",
  "edad": 28,
  "ciudad": "Valencia",
  "intereses": ["programación", "diseño", "yoga"]
}

// Usuario 2: perfil completo con subdocumentos
{
  "_id": ObjectId("507f1f77bcf86cd799439012"),
  "nombre": "Juan García",
  "email": "juan@example.com",
  "edad": 35,
  "direccion": {
    "calle": "Gran Vía 123",
    "ciudad": "Madrid",
    "cp": "28013"
  },
  "pedidos": [
    {
      "pedido_id": 1001,
      "fecha": "2024-01-15",
      "total": 299.99,
      "productos": [
        {"nombre": "Teclado mecánico", "precio": 129.99},
        {"nombre": "Ratón inalámbrico", "precio": 49.99}
      ]
    },
    {
      "pedido_id": 1002,
      "fecha": "2024-02-20",
      "total": 899.99
    }
  ],
  "verificado": true,
  "fecha_registro": ISODate("2023-06-10T00:00:00Z")
}

// Insertar un documento
db.usuarios.insertOne({
  nombre: "Ana Martínez",
  email: "ana@example.com",
  edad: 31,
  skills: ["JavaScript", "React", "Node.js"],
  experiencia_años: 7
});

// Consultas en MongoDB
// Buscar usuarios mayores de 30 años en Valencia
db.usuarios.find({
  edad: { $gt: 30 },
  ciudad: "Valencia"
});

// Buscar usuarios con un interés específico
db.usuarios.find({
  intereses: "programación"
});

// Actualizar un documento añadiendo un nuevo interés
db.usuarios.updateOne(
  { email: "maria@example.com" },
  { $push: { intereses: "machine learning" } }
);

// Buscar usuarios que hayan hecho pedidos superiores a 500€
db.usuarios.find({
  "pedidos.total": { $gt: 500 }
});

// Crear índice para acelerar búsquedas por email
db.usuarios.createIndex({ email: 1 }, { unique: true });
  
```

#### Ventajas de bases de datos documentales

-   Gran flexibilidad: cada documento puede tener campos diferentes
-   Evita JOINs: los datos relacionados se pueden incluir en el mismo documento
-   Desarrollo ágil: no requiere migraciones de esquema complejas
-   Rendimiento en lecturas: recuperar un documento completo es muy rápido
-   Natural para aplicaciones web: JSON es el formato nativo de JavaScript

#### Principales sistemas: MongoDB vs CouchDB

Característica

MongoDB

CouchDB

Formato

BSON (Binary JSON)

JSON nativo

Consultas

Lenguaje propio rico y potente

MapReduce y vistas

Consistencia

Eventual o fuerte (configurable)

Eventual

Caso de uso

Aplicaciones web generales, Big Data

Aplicaciones offline-first, móviles

### 6.4 Bases de Datos Clave-Valor

Las bases de datos clave-valor son las más simples de todas las NoSQL. Funcionan como un gran diccionario o mapa hash distribuido: cada valor se almacena asociado a una clave única, y solo se puede recuperar conociendo esa clave.

#### Características principales

-   Modelo extremadamente simple: solo GET (leer) y PUT (escribir)
-   Altísimo rendimiento: operaciones en microsegundos
-   Escalabilidad masiva: pueden manejar millones de operaciones por segundo
-   El valor puede ser cualquier cosa: string, JSON, binario, objeto serializado
-   No hay consultas complejas: solo recuperación por clave exacta

#### Ejemplo práctico con Redis

```
// Redis es una BD clave-valor en memoria (muy rápida)

// Operaciones básicas
SET usuario:1001:nombre "María López"
GET usuario:1001:nombre
// Resultado: "María López"

// Almacenar objetos JSON como valores
SET usuario:1001:perfil '{"email":"maria@example.com","edad":28,"ciudad":"Valencia"}'
GET usuario:1001:perfil

// Establecer tiempo de expiración (útil para cachés y sesiones)
SETEX sesion:abc123 3600 '{"user_id":1001,"login_time":"2024-01-15T10:00:00Z"}'
// Expira en 3600 segundos (1 hora)

// Contadores (atómicos, muy rápidos)
SET producto:1234:vistas 0
INCR producto:1234:vistas
INCR producto:1234:vistas
GET producto:1234:vistas
// Resultado: "2"

// Listas (útil para colas, notificaciones)
LPUSH cola:tareas "procesar_pedido_1001"
LPUSH cola:tareas "enviar_email_2002"
RPOP cola:tareas
// Resultado: "procesar_pedido_1001"

// Sets (conjuntos únicos)
SADD usuario:1001:intereses "programación"
SADD usuario:1001:intereses "diseño"
SADD usuario:1001:intereses "programación"  // No se añade (duplicado)
SMEMBERS usuario:1001:intereses
// Resultado: ["programación", "diseño"]

// Hashes (útil para objetos con campos)
HSET usuario:1002 nombre "Juan García"
HSET usuario:1002 email "juan@example.com"
HSET usuario:1002 edad 35
HGETALL usuario:1002
// Resultado: {"nombre":"Juan García","email":"juan@example.com","edad":"35"}

// Uso típico: caché de consultas SQL
SET cache:consulta:productos:categoria:laptops '[{"id":1,"nombre":"Dell XPS"},{"id":2,"nombre":"MacBook"}]'
EXPIRE cache:consulta:productos:categoria:laptops 300
// Caché expira en 5 minutos
  
```

#### Casos de uso típicos

-   **Cachés:** almacenar resultados de consultas costosas para acelerar lecturas
-   **Sesiones de usuario:** almacenar información temporal de usuarios autenticados
-   **Carritos de compra:** datos temporales que no necesitan persistencia compleja
-   **Contadores en tiempo real:** vistas, likes, estadísticas que se actualizan constantemente
-   **Colas de tareas:** sistemas de procesamiento asíncrono
-   **Límites de tasa (rate limiting):** controlar número de peticiones por usuario

#### Principales sistemas: Redis vs DynamoDB

Característica

Redis

Amazon DynamoDB

Almacenamiento

En memoria (con persistencia opcional)

Disco (SSD)

Velocidad

Extremadamente rápido (microsegundos)

Muy rápido (milisegundos)

Estructuras

Strings, listas, sets, hashes, sorted sets

Solo items con atributos

Escalabilidad

Vertical + clustering

Horizontal ilimitada (gestionada por AWS)

Caso de uso

Caché, sesiones, pub/sub, colas

Aplicaciones serverless, IoT, gaming

### 6.5 Bases de Datos Columnares

Las bases de datos columnares (también llamadas "wide-column stores") organizan los datos en familias de columnas en lugar de en filas. A diferencia de las bases relacionales que almacenan filas completas juntas, estas almacenan cada columna separadamente, lo que las hace extremadamente eficientes para análisis de grandes volúmenes de datos.

#### Características principales

-   Optimizadas para escrituras y lecturas masivas distribuidas
-   Cada fila puede tener diferentes columnas (esquema flexible)
-   Excelente compresión de datos (columnas similares se comprimen bien)
-   Particionamiento automático de datos entre múltiples nodos
-   Alta disponibilidad sin punto único de fallo
-   Ideal para series temporales y análisis de Big Data

#### Ejemplo práctico con Apache Cassandra

```
// Cassandra usa CQL (Cassandra Query Language), similar a SQL

-- Crear un keyspace (equivalente a una base de datos)
CREATE KEYSPACE tienda
WITH replication = {
  'class': 'SimpleStrategy',
  'replication_factor': 3
};

USE tienda;

-- Crear una tabla (familia de columnas)
CREATE TABLE sensores_temperatura (
  sensor_id text,
  timestamp timestamp,
  temperatura decimal,
  humedad decimal,
  ubicacion text,
  PRIMARY KEY (sensor_id, timestamp)
) WITH CLUSTERING ORDER BY (timestamp DESC);

-- Insertar datos
INSERT INTO sensores_temperatura (sensor_id, timestamp, temperatura, humedad, ubicacion)
VALUES ('sensor_001', '2024-01-15 10:00:00', 22.5, 65.0, 'Sala A');

INSERT INTO sensores_temperatura (sensor_id, timestamp, temperatura, humedad, ubicacion)
VALUES ('sensor_001', '2024-01-15 10:01:00', 22.7, 64.5, 'Sala A');

INSERT INTO sensores_temperatura (sensor_id, timestamp, temperatura, humedad, ubicacion)
VALUES ('sensor_002', '2024-01-15 10:00:00', 21.3, 70.0, 'Sala B');

-- Consultar últimas lecturas de un sensor (muy eficiente)
SELECT * FROM sensores_temperatura
WHERE sensor_id = 'sensor_001'
ORDER BY timestamp DESC
LIMIT 10;

-- Consultar rango temporal
SELECT * FROM sensores_temperatura
WHERE sensor_id = 'sensor_001'
AND timestamp >= '2024-01-15 10:00:00'
AND timestamp < '2024-01-15 11:00:00';

-- Tabla para eventos de usuarios (diferente estructura)
CREATE TABLE eventos_usuario (
  usuario_id text,
  evento_id timeuuid,
  tipo_evento text,
  datos text,
  PRIMARY KEY (usuario_id, evento_id)
) WITH CLUSTERING ORDER BY (evento_id DESC);

-- Cassandra permite diferentes columnas en diferentes filas
INSERT INTO eventos_usuario (usuario_id, evento_id, tipo_evento, datos)
VALUES ('user_001', now(), 'login', '{"ip":"192.168.1.1","navegador":"Chrome"}');

INSERT INTO eventos_usuario (usuario_id, evento_id, tipo_evento, datos)
VALUES ('user_001', now(), 'compra', '{"producto_id":1234,"precio":99.99}');

-- Agregaciones con contadores
CREATE TABLE estadisticas_producto (
  producto_id int,
  mes text,
  vistas counter,
  compras counter,
  PRIMARY KEY (producto_id, mes)
);

UPDATE estadisticas_producto
SET vistas = vistas + 1
WHERE producto_id = 1234 AND mes = '2024-01';

UPDATE estadisticas_producto
SET compras = compras + 1
WHERE producto_id = 1234 AND mes = '2024-01';
  
```

#### Ventajas de bases de datos columnares

-   Escalabilidad horizontal lineal: añadir más nodos aumenta la capacidad proporcionalmente
-   Alta disponibilidad: sin punto único de fallo (arquitectura descentralizada)
-   Rendimiento predecible incluso con petabytes de datos
-   Escrituras extremadamente rápidas (optimizadas con LSM trees)
-   Ideal para series temporales, logs, métricas y eventos

#### Principales sistemas: Cassandra vs HBase

Característica

Apache Cassandra

Apache HBase

Arquitectura

Descentralizada (peer-to-peer)

Master-slave (depende de HDFS)

Lenguaje

CQL (similar a SQL)

API Java, REST

Consistencia

Configurable (eventual o fuerte)

Fuerte

Ecosistema

Independiente

Integrado con Hadoop

Caso de uso

IoT, series temporales, mensajería

Big Data analytics, Hadoop ecosystem

### 6.6 Bases de Datos de Grafos

Las bases de datos de grafos almacenan datos como nodos (entidades) y aristas (relaciones entre entidades). Este modelo es ideal cuando las relaciones entre datos son tan importantes como los datos mismos. Son especialmente potentes para consultas que requieren recorrer múltiples niveles de relaciones.

#### Características principales

-   Los nodos representan entidades (personas, productos, lugares, etc.)
-   Las aristas representan relaciones con dirección y propiedades
-   Tanto nodos como aristas pueden tener propiedades (clave-valor)
-   Optimizadas para consultas de recorrido (traversal queries)
-   Excelentes para detectar patrones y caminos entre nodos

#### Ejemplo práctico con Neo4j

```
// Neo4j usa Cypher, un lenguaje declarativo para grafos

// Crear nodos (personas)
CREATE (maria:Persona {
  nombre: 'María López',
  edad: 28,
  ciudad: 'Valencia',
  profesion: 'Desarrolladora'
});

CREATE (juan:Persona {
  nombre: 'Juan García',
  edad: 35,
  ciudad: 'Madrid',
  profesion: 'Diseñador'
});

CREATE (ana:Persona {
  nombre: 'Ana Martínez',
  edad: 31,
  ciudad: 'Barcelona',
  profesion: 'Project Manager'
});

CREATE (carlos:Persona {
  nombre: 'Carlos Ruiz',
  edad: 29,
  ciudad: 'Valencia',
  profesion: 'Data Scientist'
});

// Crear relaciones entre personas
MATCH (maria:Persona {nombre: 'María López'})
MATCH (juan:Persona {nombre: 'Juan García'})
CREATE (maria)-[:CONOCE {desde: '2020-03-15', relacion: 'amigos'}]->(juan);

MATCH (juan:Persona {nombre: 'Juan García'})
MATCH (ana:Persona {nombre: 'Ana Martínez'})
CREATE (juan)-[:TRABAJA_CON {proyecto: 'WebApp2024', rol: 'colaborador'}]->(ana);

MATCH (maria:Persona {nombre: 'María López'})
MATCH (carlos:Persona {nombre: 'Carlos Ruiz'})
CREATE (maria)-[:CONOCE {desde: '2019-06-01', relacion: 'compañeros'}]->(carlos);

MATCH (ana:Persona {nombre: 'Ana Martínez'})
MATCH (carlos:Persona {nombre: 'Carlos Ruiz'})
CREATE (ana)-[:MENTORIZA {area: 'Machine Learning'}]->(carlos);

// Crear nodos de empresas y proyectos
CREATE (empresa1:Empresa {
  nombre: 'TechCorp',
  sector: 'Tecnología',
  empleados: 500
});

CREATE (proyecto1:Proyecto {
  nombre: 'WebApp2024',
  presupuesto: 50000,
  estado: 'en_desarrollo'
});

// Relacionar personas con empresas y proyectos
MATCH (maria:Persona {nombre: 'María López'})
MATCH (empresa1:Empresa {nombre: 'TechCorp'})
CREATE (maria)-[:TRABAJA_EN {puesto: 'Senior Developer', desde: '2021-01-15'}]->(empresa1);

MATCH (juan:Persona {nombre: 'Juan García'})
MATCH (proyecto1:Proyecto {nombre: 'WebApp2024'})
CREATE (juan)-[:PARTICIPA_EN {rol: 'Lead Designer', horas_semanales: 30}]->(proyecto1);

// CONSULTAS POTENTES

// 1. Encontrar amigos de amigos (2 niveles de profundidad)
MATCH (maria:Persona {nombre: 'María López'})-[:CONOCE*1..2]-(amigo)
RETURN DISTINCT amigo.nombre;

// 2. Encontrar el camino más corto entre dos personas
MATCH camino = shortestPath(
  (maria:Persona {nombre: 'María López'})-[*]-(ana:Persona {nombre: 'Ana Martínez'})
)
RETURN camino;

// 3. Recomendar personas que María podría conocer
// (amigos de amigos que María aún no conoce)
MATCH (maria:Persona {nombre: 'María López'})-[:CONOCE]-(amigo)-[:CONOCE]-(recomendacion)
WHERE NOT (maria)-[:CONOCE]-(recomendacion)
AND maria <> recomendacion
RETURN recomendacion.nombre, COUNT(*) AS conexiones_comunes
ORDER BY conexiones_comunes DESC;

// 4. Encontrar expertos en un área mediante la red
MATCH (persona:Persona)-[:MENTORIZA {area: 'Machine Learning'}]->(aprendiz)
RETURN persona.nombre AS mentor, COUNT(aprendiz) AS num_mentorados
ORDER BY num_mentorados DESC;

// 5. Análisis de comunidades: personas en la misma ciudad que se conocen
MATCH (p1:Persona)-[:CONOCE]-(p2:Persona)
WHERE p1.ciudad = p2.ciudad
RETURN p1.ciudad, COUNT(*) AS conexiones_locales
ORDER BY conexiones_locales DESC;

// 6. Detectar influencers (personas con más conexiones)
MATCH (persona:Persona)-[rel]-(conectado)
RETURN persona.nombre, COUNT(rel) AS num_conexiones
ORDER BY num_conexiones DESC
LIMIT 5;

// 7. Proyectos en los que colaboran personas que se conocen
MATCH (p1:Persona)-[:CONOCE]-(p2:Persona),
      (p1)-[:PARTICIPA_EN]->(proyecto:Proyecto)<-[:PARTICIPA_EN]-(p2)
RETURN proyecto.nombre, p1.nombre, p2.nombre;
  
```

#### Casos de uso típicos

-   **Redes sociales:** modelar conexiones, sugerencias de amistad, feed de noticias
-   **Sistemas de recomendación:** productos, contenidos, contactos basados en grafo social
-   **Detección de fraude:** identificar patrones sospechosos en transacciones
-   **Gestión del conocimiento:** wikis, ontologías, relaciones entre conceptos
-   **Redes de logística:** optimización de rutas, cadenas de suministro
-   **Análisis de impacto:** cómo un cambio afecta a elementos relacionados

#### Ventajas de bases de datos de grafos

-   Consultas de relaciones complejas son extremadamente rápidas
-   Modelo natural para datos altamente conectados
-   Flexibilidad: fácil añadir nuevos tipos de nodos y relaciones
-   Excelente rendimiento en consultas de profundidad variable
-   Visualización intuitiva de los datos y sus relaciones

#### Principales sistemas: Neo4j vs ArangoDB

Característica

Neo4j

ArangoDB

Tipo

Solo grafos

Multi-modelo (grafos, documentos, clave-valor)

Lenguaje

Cypher (muy expresivo para grafos)

AQL (similar a SQL)

Rendimiento

Optimizado para traversals complejos

Bueno en general, flexible

Ecosistema

Muy maduro, amplia comunidad

Creciente, moderna

Caso de uso

Cuando el grafo es el modelo principal

Cuando necesitas grafos + otros modelos

### 6.7 Teorema CAP

El **Teorema CAP**, formulado por Eric Brewer en 2000, es fundamental para entender los compromisos que hacen las bases de datos distribuidas (incluyendo NoSQL). Establece que en un sistema distribuido es imposible garantizar simultáneamente las tres propiedades siguientes:

Propiedad

Descripción

Ejemplo

**Consistency (Consistencia)**

Todos los nodos ven los mismos datos al mismo tiempo

Después de actualizar un dato, todas las lecturas devuelven el nuevo valor

**Availability (Disponibilidad)**

El sistema siempre responde a las peticiones (aunque algunos nodos fallen)

La aplicación sigue funcionando aunque fallen servidores

**Partition tolerance (Tolerancia a particiones)**

El sistema sigue operando aunque se pierda comunicación entre nodos

Si se corta la red entre data centers, ambos siguen sirviendo peticiones

Según el teorema CAP, solo se pueden garantizar **dos de estas tres propiedades**. Esto lleva a tres tipos de sistemas:

**CP (Consistency + Partition tolerance):** Sacrifica disponibilidad. Si hay una partición de red, algunos nodos dejan de responder hasta que se resuelva, garantizando que todos los datos sean consistentes.  
_Ejemplos: HBase, MongoDB (configurado en modo strong consistency), Redis (en modo cluster)_

**AP (Availability + Partition tolerance):** Sacrifica consistencia fuerte. El sistema siempre responde, pero puede devolver datos temporalmente inconsistentes entre nodos. Utiliza consistencia eventual: los datos convergen con el tiempo.  
_Ejemplos: Cassandra, DynamoDB, CouchDB, Riak_

**CA (Consistency + Availability):** No tolera particiones de red. En la práctica, esto solo es viable en sistemas no distribuidos o en redes extremadamente fiables.  
_Ejemplos: Bases de datos relacionales tradicionales en un solo servidor (PostgreSQL, MySQL)_

#### Ejemplo práctico del teorema CAP

Imaginemos un sistema de comercio electrónico con dos data centers (España y EE.UU.) para dar servicio global:

```
// Escenario: Un cliente actualiza su dirección de envío

// Sistema CP (MongoDB en strong consistency)
// 1. Cliente actualiza dirección en servidor España
// 2. Sistema espera a que se replique a EE.UU.
// 3. Si hay partición de red, el sistema rechaza la escritura
// 4. Ventaja: Garantiza que todos leen la dirección correcta
// 5. Desventaja: Si se cae la conexión, no se pueden hacer actualizaciones

// Sistema AP (Cassandra)
// 1. Cliente actualiza dirección en servidor España
// 2. Sistema acepta inmediatamente (sin esperar replicación)
// 3. Si hay partición de red, cada data center acepta cambios independientes
// 4. Ventaja: El sistema siempre está disponible para escrituras
// 5. Desventaja: Temporalmente, España y EE.UU. pueden tener direcciones diferentes
// 6. Resolución: Tras restaurarse la red, se aplica una política de reconciliación
//    (por ejemplo, "last write wins" - gana la última escritura)
  
```

Base de datos

Tipo CAP

Trade-off

MongoDB

CP (configurable)

Puede sacrificar disponibilidad para garantizar consistencia

Cassandra

AP

Siempre disponible, pero con consistencia eventual

Redis

CP (cluster) / CA (single)

En cluster sacrifica disponibilidad ante particiones

CouchDB

AP

Diseñado para consistencia eventual

Neo4j

CA (causal cluster puede ser CP)

Tradicionalmente no distribuido, versiones nuevas soportan clustering

PostgreSQL

CA

No diseñado para particiones de red (sistema centralizado)

### 6.8 Comparativa SQL vs NoSQL

Ahora que conocemos tanto las bases de datos relacionales como las NoSQL, es importante entender cuándo usar cada una. No son tecnologías competidoras, sino complementarias: cada una sobresale en diferentes escenarios.

Aspecto

SQL (Relacional)

NoSQL

**Modelo de datos**

Tablas con esquema fijo

Flexible: documentos, clave-valor, columnas, grafos

**Esquema**

Definido antes de insertar datos (schema-on-write)

Flexible, puede cambiar (schema-on-read)

**Escalabilidad**

Vertical (más potencia al servidor)

Horizontal (más servidores)

**Transacciones**

ACID completo, ideal para transacciones complejas

Varía: algunas solo eventual consistency, otras soportan transacciones

**Consistencia**

Fuerte (strong consistency)

Generalmente eventual (configurable en algunos casos)

**Consultas**

SQL muy expresivo, JOINs complejos

APIs específicas, limitadas en JOINs

**Relaciones**

Excelente con claves foráneas y JOINs

Limitadas (excepto BD de grafos)

**Madurez**

40+ años, muy estable y probado

Más reciente (10-15 años), en evolución

**Casos de uso**

Transacciones financieras, ERP, CRM, datos estructurados

Big Data, IoT, analytics, catálogos, redes sociales, cachés

#### ¿Cuándo usar SQL?

-   Los datos tienen estructura clara y estable
-   Necesitas transacciones ACID complejas (bancos, comercio, contabilidad)
-   Las relaciones entre datos son críticas (muchos JOINs)
-   Requieres consultas complejas ad-hoc
-   La integridad referencial es imprescindible
-   El volumen de datos cabe en escalado vertical
-   Ejemplos: sistemas de facturación, gestión de pedidos, CRM

#### ¿Cuándo usar NoSQL?

-   Los datos no tienen estructura fija o cambian frecuentemente
-   Necesitas escalar horizontalmente a muchos servidores
-   Priorizas disponibilidad sobre consistencia inmediata
-   Manejas volúmenes masivos de datos (petabytes)
-   Trabajas con datos semi-estructurados (JSON, logs, eventos)
-   Necesitas muy alto rendimiento en lecturas/escrituras
-   Ejemplos: catálogos de productos, perfiles de usuario, métricas, logs, mensajería

#### Arquitecturas híbridas (Polyglot Persistence)

En la práctica, muchas aplicaciones modernas usan **múltiples bases de datos** en función de las necesidades de cada componente:

```
// Ejemplo de arquitectura de comercio electrónico

PostgreSQL (SQL):
  - Gestión de pedidos y transacciones (ACID crítico)
  - Gestión de usuarios y autenticación
  - Facturación y contabilidad

MongoDB (Documental):
  - Catálogo de productos (esquema flexible)
  - Contenido del CMS
  - Perfiles de usuario enriquecidos

Redis (Clave-Valor):
  - Caché de consultas frecuentes
  - Sesiones de usuario
  - Carritos de compra temporales
  - Rate limiting

Elasticsearch (Motor de búsqueda):
  - Búsqueda de productos
  - Búsqueda de texto completo
  - Logs y analytics

Cassandra (Columnar):
  - Eventos de usuario (clickstream)
  - Métricas y analytics en tiempo real
  - Historial de navegación

Neo4j (Grafos):
  - Recomendaciones de productos
  - "Usuarios que compraron esto también compraron..."
  - Detección de fraude
  
```

**Advertencia:** Usar múltiples bases de datos aumenta la complejidad operacional. Solo hazlo cuando los beneficios (rendimiento, escalabilidad, flexibilidad) justifiquen el coste adicional de mantenimiento, monitorización y conocimiento técnico requerido.

### 6.9 Ventajas y Desventajas de NoSQL

#### Ventajas principales

-   **Escalabilidad horizontal:** fácil añadir más servidores para aumentar capacidad
-   **Flexibilidad de esquema:** no necesitas definir estructura rígida de antemano
-   **Alto rendimiento:** optimizadas para casos de uso específicos (lecturas, escrituras, grafos)
-   **Disponibilidad:** arquitecturas diseñadas para funcionar 24/7 sin downtime
-   **Manejo de Big Data:** capaces de procesar petabytes de información distribuida
-   **Desarrollo ágil:** cambios de esquema no requieren migraciones complejas
-   **Coste:** muchas opciones open source y pueden usar hardware commodity
-   **Especialización:** cada tipo está optimizado para casos de uso específicos

#### Desventajas y limitaciones

-   **Falta de estandarización:** cada sistema tiene su propio lenguaje de consulta
-   **Consistencia eventual:** puede haber lecturas temporalmente inconsistentes
-   **JOINs limitados:** operaciones entre "tablas" son complejas o imposibles
-   **Madurez:** menos años de desarrollo que sistemas SQL
-   **Menos herramientas:** ecosistema de administración y monitorización menos maduro
-   **Curva de aprendizaje:** cada tipo de NoSQL requiere aprender conceptos nuevos
-   **Transacciones limitadas:** muchos no soportan transacciones multi-documento/multi-tabla
-   **Complejidad operacional:** gestionar clusters distribuidos es complejo

**Recomendación:** Para empezar tu carrera como desarrollador, domina primero las bases de datos relacionales (SQL). Son la base de la mayoría de aplicaciones empresariales y te darán fundamentos sólidos. Después, aprende NoSQL según lo necesites: MongoDB si trabajas con APIs REST/JSON, Redis para cachés, Neo4j para grafos sociales, etc. No necesitas saberlo todo desde el principio.

## 7\. Ejercicios de refuerzo

Para consolidar los conceptos aprendidos sobre datos, información, sistemas de gestión de bases de datos relacionales y NoSQL, se proponen los siguientes ejercicios. Algunos son prácticos, otros requieren reflexión e investigación adicional.

### 7.1 Ejercicios de investigación

1.  Investiga un caso real en el que la gestión de la información en simples ficheros haya causado problemas de coherencia o pérdida de datos. Explica cómo una base de datos podría haber solucionado el problema.
2.  Busca qué empresas tecnológicas utilizan bases de datos relacionales a gran escala y qué características de estos sistemas les resultan imprescindibles. Haz lo mismo con bases de datos NoSQL.
3.  Investiga el caso de Instagram: ¿por qué migraron de PostgreSQL a Cassandra para ciertos tipos de datos? ¿Qué les llevó a tomar esa decisión?
4.  Busca información sobre el término "NewSQL". ¿Qué problemas intenta resolver? ¿Cómo combina ventajas de SQL y NoSQL?

### 7.2 Ejercicios de reflexión

1.  Explica, con tus propias palabras, la diferencia entre **dato** e **información**. Pon un ejemplo de tu vida cotidiana.
2.  ¿Por qué es importante que un SGBD asegure las propiedades **ACID** en las transacciones? Imagina qué pasaría si una transferencia bancaria no cumpliera estas propiedades.
3.  Diseña un pequeño escenario de base de datos para una biblioteca usando únicamente _ficheros de texto_. Luego, identifica los problemas que surgirían y describe cómo los resolverías usando un SGBD relacional.
4.  Explica el Teorema CAP con tus propias palabras. ¿Por qué es imposible garantizar las tres propiedades simultáneamente en un sistema distribuido?
5.  Si tuvieras que diseñar una red social (como Twitter), ¿qué tipo de base de datos usarías para cada componente? (usuarios, tweets, timeline, trending topics, mensajes directos). Justifica tu respuesta.

### 7.3 Ejercicios prácticos - SQL

1.  Dibuja un pequeño diagrama relacional (tablas + relaciones) para un sistema de gestión de una tienda online que maneja **Clientes**, **Pedidos**, **Productos** y **Categorías**.
2.  Identifica las claves primarias y foráneas en tu diagrama del ejercicio anterior y explica qué restricciones aseguran la integridad referencial.
3.  Escribe sentencias SQL para crear las tablas de tu diseño, incluyendo restricciones CHECK, UNIQUE, NOT NULL y claves foráneas.
4.  Plantea al menos 5 consultas SQL que podrían hacerse sobre tu diseño relacional:
    -   Listar productos de una categoría específica
    -   Mostrar todos los pedidos de un cliente con el total de cada pedido
    -   Encontrar los 10 productos más vendidos
    -   Calcular el total de ventas del último mes
    -   Listar clientes que nunca han hecho un pedido

### 7.4 Ejercicios prácticos - NoSQL

1.  Diseña el modelo de datos para un blog usando MongoDB. Decide si incrustar comentarios dentro del documento del post o crear una colección separada. Justifica tu decisión.
2.  Imagina que estás diseñando una aplicación de fitness que registra entrenamientos diarios. ¿Usarías una BD relacional o Cassandra? ¿Por qué? Diseña el esquema que usarías.
3.  Diseña un grafo para representar una red de recomendaciones de películas. Define:
    -   Tipos de nodos (Película, Usuario, Actor, Director, Género)
    -   Tipos de relaciones (VISTO, LE\_GUSTA, ACTUA\_EN, DIRIGE, PERTENECE\_A)
    -   Propiedades de nodos y relaciones
    -   Tres consultas Cypher útiles (recomendaciones, actores más prolíficos, etc.)
4.  Para cada uno de los siguientes escenarios, decide qué tipo de base de datos usarías (SQL, documental, clave-valor, columnar o grafos) y justifica:
    -   Sistema de reservas de hotel
    -   Aplicación de mensajería instantánea (tipo WhatsApp)
    -   Plataforma de streaming de música (tipo Spotify)
    -   Sistema de gestión de inventario para supermercado
    -   Red social profesional (tipo LinkedIn)
    -   Plataforma de monitorización de sensores IoT (millones de lecturas/segundo)

### 7.5 Ejercicio integrador

Diseña la arquitectura de bases de datos completa para una plataforma de e-learning (tipo Udemy/Coursera):

1.  Identifica los diferentes tipos de datos que necesitas almacenar
2.  Decide qué base de datos usar para cada tipo (puedes usar múltiples tecnologías)
3.  Justifica cada elección basándote en: volumen, estructura, consultas, consistencia, escalabilidad
4.  Dibuja un diagrama de arquitectura mostrando cómo interactúan los diferentes sistemas
5.  Identifica los puntos críticos donde necesitas transacciones ACID
6.  Diseña el esquema de datos para al menos dos de las bases de datos que elegiste

**Tip:** Al resolver los ejercicios prácticos, intenta pensar en cómo organizarías la información y qué tipo de consultas se harán más frecuentemente. Esta habilidad de análisis es clave para convertirte en un buen arquitecto de datos. No hay una única respuesta correcta: lo importante es que justifiques tus decisiones técnicas.
