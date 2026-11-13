> Fuente: https://dexpositofp.github.io/docencia/BDA/plsql.html (descargado el 13/11/2026)

# PL/SQL

## ¿Qué es PL/SQL?

**PL/SQL** (Procedural Language/Structured Query Language) es la extensión procedural de Oracle para SQL. Para entender PL/SQL, primero debemos comprender la diferencia entre lenguajes declarativos y procedurales:

**SQL es un lenguaje declarativo,** le dices a la base de datos QUÉ quieres obtener, pero no CÓMO obtenerlo. Por ejemplo:

    SELECT nombre, salario FROM empleados WHERE departamento_id = 10;

Esta consulta dice "dame los nombres y salarios de empleados del departamento 10", pero no especifica cómo debe recorrer la tabla, en qué orden, etc. Oracle decide la mejor forma de hacerlo.

**PL/SQL es un lenguaje procedural:** Te permite escribir código que indica CÓMO realizar las operaciones, paso a paso, como en lenguajes de programación tradicionales (Java, Python, etc.). Esto te da control total sobre la lógica del programa.

PL/SQL combina lo mejor de ambos mundos, ya que puedes usar sentencias SQL dentro de estructuras procedurales. Esto te permite:

- **Variables y constantes:** Almacenar datos temporalmente mientras se ejecuta el programa. Por ejemplo, puedes guardar el resultado de una consulta en una variable y usarlo después en otra operación.
- **Estructuras de control:** Tomar decisiones (IF-THEN-ELSE) y repetir operaciones (bucles LOOP, WHILE, FOR). Por ejemplo, puedes actualizar el salario de empleados solo si cumplen ciertas condiciones, o procesar miles de registros uno por uno.
- **Manejo de excepciones:** Capturar errores y decidir qué hacer cuando algo sale mal. Por ejemplo, si un empleado no existe, puedes mostrar un mensaje personalizado en lugar de que el programa simplemente falle.
- **Cursores:** Procesar los resultados de una consulta fila por fila, como si recorrieras un array. Esto es útil cuando necesitas hacer operaciones complejas con cada registro.
- **Subprogramas (procedimientos y funciones):** Crear bloques de código reutilizables. Por ejemplo, puedes crear una función "calcular_bonus" y usarla en múltiples lugares sin repetir código.
- **Paquetes:** Agrupar funciones y procedimientos relacionados en un solo "contenedor", como si fueran módulos o clases en otros lenguajes.

### ¿Por qué usar PL/SQL en lugar de solo SQL?

Imagina que necesitas dar un aumento de salario del 10% a todos los empleados, pero solo si su salario actual es menor de 3000€. Con SQL puro sería:

    UPDATE empleados
    SET salario = salario * 1.10
    WHERE salario < 3000;

Esto funciona bien para operaciones simples. Pero ¿qué pasa si necesitas:

- Validar que el nuevo salario no supere un máximo permitido?
- Registrar cada cambio en una tabla de auditoría?
- Enviar una notificación por cada empleado actualizado?
- Hacer diferentes aumentos según el departamento?
- Manejar errores si algo falla?

Para este tipo de lógica compleja, necesitas PL/SQL. Te permite escribir "programas" completos que se ejecutan en el servidor de base de datos.

## Estructura de un Bloque PL/SQL

Un bloque PL/SQL tiene una sección de declaración de variables (DECLARE), otra donde escribes el código (BEGIN-END), y opcionalmente una sección para manejar problemas (EXCEPTION).

Todo programa PL/SQL se escribe en forma de bloques. Un bloque es un conjunto de sentencias agrupadas que se ejecutan como una unidad. Puede ser:

- **Anónimo:** Un bloque que se ejecuta una vez y no se guarda en la base de datos
- **Nombrado:** Un procedimiento, función o paquete que se guarda en la BD y puede ejecutarse múltiples veces

### Las Tres Secciones de un Bloque

    DECLARE
        -- ════════════════════════════════════════════════════════════
        -- SECCIÓN 1: DECLARATIVA (OPCIONAL)
        -- ════════════════════════════════════════════════════════════
        -- Aquí "preparas" todo lo que vas a necesitar:
        -- - Variables
        -- - Constantes
        -- - Cursores
        -- - Excepciones personalizadas

        v_nombre VARCHAR2(50);      -- Variable para guardar un nombre
        v_edad NUMBER := 25;        -- Variable inicializada con valor 25
        c_mayor_edad CONSTANT NUMBER := 18;  -- Constante que nunca cambiará
    BEGIN
        -- ════════════════════════════════════════════════════════════
        -- SECCIÓN 2: EJECUTABLE (OBLIGATORIA)
        -- ════════════════════════════════════════════════════════════
        -- Aquí va el código que HACE cosas:
        -- - Asignaciones a variables
        -- - Consultas SQL
        -- - Estructuras de control (IF, LOOP, etc.)
        -- - Llamadas a procedimientos/funciones

        v_nombre := 'Juan';  -- Asignar valor a la variable

        -- Mostrar un mensaje en la consola
        DBMS_OUTPUT.PUT_LINE('Hola ' || v_nombre);

        -- Tomar decisiones
        IF v_edad >= c_mayor_edad THEN
            DBMS_OUTPUT.PUT_LINE('Es mayor de edad');
        ELSE
            DBMS_OUTPUT.PUT_LINE('Es menor de edad');
        END IF;

    EXCEPTION
        -- ════════════════════════════════════════════════════════════
        -- SECCIÓN 3: EXCEPCIONES (OPCIONAL)
        -- ════════════════════════════════════════════════════════════
        -- Aquí capturas y manejas los errores que puedan ocurrir
        -- Es como el "try-catch" en Java o "try-except" en Python

        WHEN OTHERS THEN
            -- OTHERS captura cualquier error no especificado
            DBMS_OUTPUT.PUT_LINE('Error: ' || SQLERRM);
            -- SQLERRM es una función que devuelve el mensaje de error
    END;
    /

### Desglosando cada parte:

1\. Sección DECLARE (Opcional)

**¿Para qué sirve?** Es donde declaras todas las variables y constantes que vas a usar en el bloque.

**¿Es obligatoria?** No. Si no necesitas variables, puedes omitir esta sección completamente.

**¿Qué puedes declarar?**

- Variables (valores que pueden cambiar)
- Constantes (valores fijos)
- Cursores (para recorrer datos)
- Excepciones personalizadas
- Tipos de datos personalizados

2\. Sección BEGIN...END (Obligatoria)

**¿Para qué sirve?** Aquí va el código que realmente SE EJECUTA. Es el "cuerpo" del programa.

**¿Es obligatoria?** ¡Sí! Todo bloque PL/SQL debe tener al menos BEGIN...END, aunque esté vacío.

**¿Qué puedes poner?**

- Asignaciones de valores a variables
- Sentencias SQL (SELECT, INSERT, UPDATE, DELETE)
- Estructuras de control (IF, CASE, LOOP)
- Llamadas a procedimientos y funciones
- Instrucciones de entrada/salida (DBMS_OUTPUT)

3\. Sección EXCEPTION (Opcional)

**¿Para qué sirve?** Para "atrapar" errores y decidir qué hacer cuando algo sale mal, en lugar de que el programa simplemente falle.

**¿Es obligatoria?** No, pero es MUY recomendable usarla en código de producción.

**¿Qué pasa si no la pones?** Si ocurre un error, el bloque se detiene inmediatamente y el error se propaga hacia arriba.

**Ejemplo:** Si intentas dividir por cero sin manejar la excepción, el programa falla. Con EXCEPTION puedes mostrar un mensaje amigable.

La barra diagonal ( / )

La barra diagonal `/` al final del bloque es MUY IMPORTANTE. Le indica a herramientas como SQL\*Plus, SQL Developer o SQLcl que debe ejecutar el código PL/SQL que acabas de escribir.

**Sin la barra:** El código queda "esperando" y no se ejecuta.

**Con la barra:** El código se envía al motor PL/SQL y se ejecuta.

**Nota:** La barra debe estar en una línea separada, no al final de END;

### Tu Primer Programa PL/SQL

Empecemos con el ejemplo más simple posible - un "Hola Mundo":

    BEGIN
        DBMS_OUTPUT.PUT_LINE('¡Hola, mundo desde PL/SQL!');
    END;
    /

**Explicación línea por línea:**

1.  `BEGIN` - Marca el inicio del bloque ejecutable
2.  `DBMS_OUTPUT.PUT_LINE(...)` - Es como `System.out.println()` en Java o `print()` en Python. Muestra un mensaje en la consola.
3.  `END;` - Marca el final del bloque
4.  `/` - Ejecuta el bloque

⚠️ ¿No ves la salida?

Si ejecutas el código y no ves nada, es porque `DBMS_OUTPUT` está desactivado por defecto. En SQL Developer o SQL\*Plus, primero ejecuta:

    SET SERVEROUTPUT ON;

Esto activa la visualización de mensajes. Solo necesitas hacerlo una vez por sesión.

### Componentes del bloque:

| Sección         | Obligatoria | Descripción                                                    |
|-----------------|-------------|----------------------------------------------------------------|
| `DECLARE`       | No          | Declaración de variables, constantes, cursores y tipos locales |
| `BEGIN ... END` | Sí          | Contiene las sentencias ejecutables del programa               |
| `EXCEPTION`     | No          | Manejo de errores y excepciones                                |

## Ventajas de PL/SQL

### Mejor Rendimiento

PL/SQL se ejecuta en el servidor de base de datos, reduciendo el tráfico de red al enviar bloques completos en lugar de sentencias individuales.

### Mayor Seguridad

Los procedimientos almacenados permiten controlar el acceso a los datos sin dar permisos directos sobre las tablas.

### Modularidad

Permite crear procedimientos, funciones y paquetes reutilizables, facilitando el mantenimiento del código.

### Manejo de Errores

Sistema robusto de excepciones que permite capturar y gestionar errores de forma controlada.

# Variables y Tipos de Datos

## ¿Qué es una Variable?

Una **variable** es un "contenedor" en la memoria donde puedes guardar un valor temporalmente mientras se ejecuta tu programa.

**¿Por qué necesitamos variables?**

- **Guardar resultados:** Por ejemplo, el resultado de una consulta SQL para usarlo después
- **Hacer cálculos:** Guardar valores intermedios en operaciones matemáticas
- **Contar o acumular:** Llevar la cuenta de cuántas veces se repite algo en un bucle
- **Tomar decisiones:** Comparar valores para decidir qué hacer

## Declaración de Variables

En PL/SQL, **TODAS las variables deben declararse** antes de poder usarlas (a diferencia de JavaScript o Python). Esto ayuda a evitar errores.

**Sintaxis general:**

    nombre_variable tipo_dato [NOT NULL] [:= valor_inicial];

**Desglosando la sintaxis:**

- `nombre_variable` - El nombre que le das (por convención se usa v\_ al principio, v de "variable")
- `tipo_dato` - Qué tipo de dato guardará (número, texto, fecha, etc.)
- `NOT NULL` - (Opcional) Indica que la variable DEBE tener siempre un valor, no puede estar vacía
- `:= valor_inicial` - (Opcional) Puedes asignar un valor inicial al declarar la variable

### Ejemplos de Declaraciones

    DECLARE
        -- Variable simple sin valor inicial (vale NULL por defecto)
        v_nombre VARCHAR2(50);

        -- Variable con valor inicial
        v_edad NUMBER := 18;

        -- Variable que NO puede ser NULL (DEBE inicializarse)
        v_pais VARCHAR2(20) NOT NULL := 'España';

        -- Múltiples variables del mismo tipo
        v_precio NUMBER(10,2);
        v_descuento NUMBER(10,2) := 0;

        -- Variable booleana (solo TRUE, FALSE o NULL)
        v_activo BOOLEAN := TRUE;
    BEGIN
        DBMS_OUTPUT.PUT_LINE('País: ' || v_pais);
        DBMS_OUTPUT.PUT_LINE('Edad: ' || v_edad);
    END;
    /

⚠️ Reglas para Nombres de Variables

- Deben empezar con una letra (no con número)
- Pueden contener letras, números y guiones bajos (\_)
- No pueden tener espacios ni caracteres especiales (@, \#, etc.)
- No pueden ser palabras reservadas (SELECT, BEGIN, etc.)
- Longitud máxima: 30 caracteres
- No distinguen entre mayúsculas y minúsculas (v_Nombre = v_nombre)

**Buenas prácticas:** Usa prefijos como v\_ para variables, c\_ para constantes, p\_ para parámetros

## Tipos de Datos Básicos

El **tipo de dato** define qué clase de información puede almacenar una variable. Es como decidir qué tipo de caja necesitas: una para zapatos, otra para libros, otra para joyas, etc.

### 1. Tipos para TEXTO (Cadenas de Caracteres)

| Tipo          | Explicación Detallada                                                                                                                                                                     | Cuándo Usarlo                                                                      |
|---------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------|
| `VARCHAR2(n)` | **Variable Character** - Texto de longitud variable hasta `n` caracteres (máximo 32,767 en PL/SQL). Solo ocupa el espacio necesario. Si guardas 'Ana' en VARCHAR2(100), solo usa 3 bytes. | Nombres, direcciones, descripciones, emails - cualquier texto de longitud variable |
| `CHAR(n)`     | **Character** - Texto de longitud FIJA de exactamente `n` caracteres. Si guardas 'Ana' en CHAR(10), se rellena con espacios hasta completar 10 caracteres.                                | Códigos de longitud fija (código postal: CHAR(5), códigos de país: CHAR(2))        |

    DECLARE
        v_nombre VARCHAR2(50) := 'María García';     -- Usa 12 caracteres
        v_pais CHAR(2) := 'ES';                      -- Siempre usa 2 caracteres
        v_codigo_postal CHAR(5) := '28001';          -- Siempre 5 caracteres
        v_email VARCHAR2(100) := 'maria@ejemplo.com'; -- Usa lo necesario
    BEGIN
        DBMS_OUTPUT.PUT_LINE('Nombre: ' || v_nombre);
        DBMS_OUTPUT.PUT_LINE('País: ' || v_pais);
    END;
    /

### 2. Tipos para NÚMEROS

| Tipo          | Explicación Detallada                                                                                                 | Cuándo Usarlo                                                             |
|---------------|-----------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------|
| `NUMBER`      | Número genérico (enteros o decimales). Puede almacenar desde números pequeñísimos hasta enormes con hasta 38 dígitos. | Cuando no sabes si será entero o decimal                                  |
| `NUMBER(p)`   | `p` = precisión (total de dígitos). Ej: NUMBER(5) puede almacenar -99999 a 99999                                      | Números enteros con límite conocido                                       |
| `NUMBER(p,s)` | `p` = precisión total, `s` = decimales. NUMBER(7,2) = 5 enteros + 2 decimales. Ejemplo: 12345.67                      | Precios, salarios, porcentajes - cualquier decimal con precisión conocida |
| `INTEGER`     | Equivale a NUMBER(38). Solo números enteros (sin decimales)                                                           | Contadores, cantidades, IDs                                               |

    DECLARE
        -- Números enteros
        v_edad INTEGER := 25;
        v_cantidad NUMBER(5) := 1000;        -- Máximo 99999

        -- Números decimales
        v_precio NUMBER(10,2) := 299.99;     -- 8 enteros + 2 decimales
        v_iva NUMBER(4,2) := 0.21;           -- 2 enteros + 2 decimales (21%)
        v_nota NUMBER(4,2) := 7.85;          -- Notas con 2 decimales

        -- Número genérico
        v_resultado NUMBER;
    BEGIN
        v_resultado := v_precio * (1 + v_iva);
        DBMS_OUTPUT.PUT_LINE('Precio con IVA: ' || v_resultado);
        -- Resultado: 362.9879 (puedes redondearlo con ROUND)
    END;
    /

### 3. Tipos para FECHAS y TIEMPO

| Tipo        | Explicación Detallada                                                                                                              | Cuándo Usarlo                                                                |
|-------------|------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------|
| `DATE`      | Almacena fecha Y hora (desde el año -4712 hasta el 9999). Incluye: año, mes, día, hora, minutos, segundos. Precisión de 1 segundo. | Fechas de nacimiento, fechas de contratos, timestamps generales              |
| `TIMESTAMP` | Como DATE pero con fracciones de segundo (hasta 9 decimales). Más preciso que DATE.                                                | Cuando necesitas precisión de milisegundos (logs, transacciones, mediciones) |

    DECLARE
        v_hoy DATE := SYSDATE;                    -- Fecha y hora actual
        v_nacimiento DATE := TO_DATE('15/03/2000', 'DD/MM/YYYY');
        v_momento TIMESTAMP := SYSTIMESTAMP;       -- Con fracciones de segundo
        v_edad NUMBER;
    BEGIN
        -- Calcular edad (MONTHS_BETWEEN devuelve meses entre dos fechas)
        v_edad := FLOOR(MONTHS_BETWEEN(v_hoy, v_nacimiento) / 12);

        DBMS_OUTPUT.PUT_LINE('Hoy es: ' || TO_CHAR(v_hoy, 'DD/MM/YYYY HH24:MI:SS'));
        DBMS_OUTPUT.PUT_LINE('Edad: ' || v_edad || ' años');
        DBMS_OUTPUT.PUT_LINE('Timestamp preciso: ' || v_momento);
    END;
    /

### 4. Tipo LÓGICO (Booleano)

| Tipo      | Explicación Detallada                                                                                                                             | Cuándo Usarlo                                 |
|-----------|---------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------|
| `BOOLEAN` | Solo puede tener 3 valores: TRUE (verdadero), FALSE (falso) o NULL (desconocido). **MUY IMPORTANTE:** No se puede usar en tablas, solo en PL/SQL. | Banderas (flags), condiciones, estados on/off |

    DECLARE
        v_es_mayor BOOLEAN;
        v_tiene_descuento BOOLEAN := FALSE;
        v_activo BOOLEAN := TRUE;
        v_edad NUMBER := 20;
    BEGIN
        -- Asignar resultado de una comparación
        v_es_mayor := (v_edad >= 18);

        IF v_es_mayor THEN
            DBMS_OUTPUT.PUT_LINE('Es mayor de edad');
            v_tiene_descuento := TRUE;
        END IF;

        -- IMPORTANTE: No puedes hacer esto:
        -- DBMS_OUTPUT.PUT_LINE(v_activo);  -- ERROR!
        -- Porque BOOLEAN no se puede convertir a texto directamente

        -- Debes hacer esto:
        IF v_activo THEN
            DBMS_OUTPUT.PUT_LINE('Estado: ACTIVO');
        ELSE
            DBMS_OUTPUT.PUT_LINE('Estado: INACTIVO');
        END IF;
    END;
    /

## Atributo %TYPE

**El Problema:** Imagina que declaras una variable así:

    DECLARE
        v_nombre VARCHAR2(50);  -- Declaras que el nombre tiene máximo 50 caracteres
    BEGIN
        SELECT nombre INTO v_nombre
        FROM empleados
        WHERE empleado_id = 100;
    END;
    /

Pero un día, alguien cambia la tabla y hace la columna `nombre` de tipo `VARCHAR2(100)`. ¡Tu código puede fallar! Tendrías que buscar todas las variables relacionadas con nombre y cambiarlas manualmente.

**La Solución: %TYPE**

Con `%TYPE` le dices a PL/SQL: "Esta variable debe tener exactamente el mismo tipo de dato que esta columna de tabla". Si la tabla cambia, tu variable se adapta automáticamente.

    DECLARE
        -- Esta variable tendrá el MISMO tipo que la columna nombre de empleados
        v_nombre empleados.nombre%TYPE;

        -- También puedes basarte en otra variable
        v_apellido v_nombre%TYPE;

        -- O en cualquier columna de cualquier tabla
        v_salario empleados.salario%TYPE;
        v_fecha_contrato empleados.fecha_contratacion%TYPE;
    BEGIN
        SELECT nombre, salario, fecha_contratacion
        INTO v_nombre, v_salario, v_fecha_contrato
        FROM empleados
        WHERE empleado_id = 100;

        DBMS_OUTPUT.PUT_LINE('Empleado: ' || v_nombre);
        DBMS_OUTPUT.PUT_LINE('Salario: ' || v_salario);
    END;
    /

✨ Ventajas de usar %TYPE

- **Mantenibilidad:** Si cambia la estructura de la tabla, no necesitas cambiar tu código
- **Seguridad:** Garantiza que el tipo de dato es compatible
- **Menos código:** No necesitas recordar qué tipo exacto tiene cada columna
- **Documentación:** Al leer el código, sabes inmediatamente de dónde viene el tipo de dato

**Regla de oro:** Siempre que una variable vaya a recibir datos de una columna de tabla, usa %TYPE

## Atributo %ROWTYPE - Guardando Filas Completas

**El Problema:** ¿Qué pasa si necesitas guardar todos los datos de un empleado?

    -- Forma TEDIOSA (NO hagas esto):
    DECLARE
        v_empleado_id empleados.empleado_id%TYPE;
        v_nombre empleados.nombre%TYPE;
        v_apellido empleados.apellido%TYPE;
        v_email empleados.email%TYPE;
        v_telefono empleados.telefono%TYPE;
        v_fecha_contratacion empleados.fecha_contratacion%TYPE;
        v_salario empleados.salario%TYPE;
        v_departamento_id empleados.departamento_id%TYPE;
        -- ¡Y si la tabla tiene 20 columnas!
    BEGIN
        SELECT empleado_id, nombre, apellido, email, telefono,
               fecha_contratacion, salario, departamento_id
        INTO v_empleado_id, v_nombre, v_apellido, v_email, v_telefono,
             v_fecha_contratacion, v_salario, v_departamento_id
        FROM empleados
        WHERE empleado_id = 100;
    END;
    /

**La Solución: %ROWTYPE**

`%ROWTYPE` crea automáticamente una variable "registro" (como un struct en C o un object en JavaScript) que tiene un campo por cada columna de la tabla.

    DECLARE
        -- UNA sola variable que representa una fila COMPLETA de la tabla
        v_empleado empleados%ROWTYPE;
    BEGIN
        -- Selecciona TODOS los campos de la tabla con *
        SELECT * INTO v_empleado
        FROM empleados
        WHERE empleado_id = 100;

        -- Accede a cada campo usando punto (.)
        DBMS_OUTPUT.PUT_LINE('ID: ' || v_empleado.empleado_id);
        DBMS_OUTPUT.PUT_LINE('Nombre: ' || v_empleado.nombre);
        DBMS_OUTPUT.PUT_LINE('Email: ' || v_empleado.email);
        DBMS_OUTPUT.PUT_LINE('Salario: ' || v_empleado.salario);
        DBMS_OUTPUT.PUT_LINE('Departamento: ' || v_empleado.departamento_id);

        -- Puedes modificar los valores
        v_empleado.salario := v_empleado.salario * 1.10;  -- Aumento del 10%

        DBMS_OUTPUT.PUT_LINE('Nuevo salario: ' || v_empleado.salario);
    END;
    /

Cómo funciona %ROWTYPE

Cuando escribes `v_empleado empleados%ROWTYPE;`, Oracle automáticamente crea una variable que tiene:

- `v_empleado.empleado_id` del tipo de la columna empleado_id
- `v_empleado.nombre` del tipo de la columna nombre
- `v_empleado.salario` del tipo de la columna salario
- ... y así para TODAS las columnas de la tabla

Es como si Oracle leyera la estructura de la tabla y creara automáticamente todas las variables necesarias por ti.

### Ejemplo Práctico: Comparar Empleados

    DECLARE
        v_empleado1 empleados%ROWTYPE;
        v_empleado2 empleados%ROWTYPE;
    BEGIN
        -- Cargar dos empleados diferentes
        SELECT * INTO v_empleado1
        FROM empleados
        WHERE empleado_id = 100;

        SELECT * INTO v_empleado2
        FROM empleados
        WHERE empleado_id = 101;

        -- Comparar sus salarios
        IF v_empleado1.salario > v_empleado2.salario THEN
            DBMS_OUTPUT.PUT_LINE(v_empleado1.nombre || ' gana más que ' ||
                               v_empleado2.nombre);
        ELSE
            DBMS_OUTPUT.PUT_LINE(v_empleado2.nombre || ' gana más que ' ||
                               v_empleado1.nombre);
        END IF;

        -- Mostrar diferencia de salario
        DBMS_OUTPUT.PUT_LINE('Diferencia: ' ||
            ABS(v_empleado1.salario - v_empleado2.salario) || '€');
    END;
    /

⚠️ %ROWTYPE con SELECT \*

Cuando usas %ROWTYPE, normalmente usas `SELECT *` para traer todos los campos. Pero también puedes seleccionar campos específicos usando un cursor (lo veremos más adelante).

**Importante:** Si la tabla tiene 50 columnas y solo necesitas 3, quizás sea mejor declarar variables individuales con %TYPE en lugar de usar %ROWTYPE.

## Constantes

**¿Qué es una constante?** Es como una variable, pero su valor NO puede cambiar una vez asignado. Piensa en valores que son siempre los mismos en tu programa:

- El IVA (21% en España) - no cambia durante la ejecución del programa
- El nombre de tu empresa
- Valores matemáticos como PI (3.14159...)
- Límites o umbrales fijos (salario mínimo, edad de jubilación, etc.)

### ¿Por qué usar constantes en lugar de variables?

1.  **Seguridad:** Evitas cambiar accidentalmente un valor que debe permanecer fijo
2.  **Claridad:** Al leer el código, sabes que ese valor no cambiará
3.  **Mantenimiento:** Si el IVA cambia, solo lo modificas en UN lugar (donde declaras la constante)
4.  **Rendimiento:** Oracle puede optimizar mejor el código

### Sintaxis de las Constantes

    nombre_constante CONSTANT tipo_dato := valor;

**Reglas importantes:**

- Debes usar la palabra `CONSTANT`
- DEBES inicializar la constante (darle valor inmediatamente)
- No puedes cambiar su valor después
- Por convención, se usa el prefijo c\_ (de "constant")

### Ejemplos Prácticos

    DECLARE
        -- Constantes de configuración
        c_iva CONSTANT NUMBER(4,2) := 0.21;           -- IVA 21%
        c_empresa CONSTANT VARCHAR2(50) := 'TechSolutions S.L.';
        c_email_soporte CONSTANT VARCHAR2(100) := 'soporte@techsolutions.com';

        -- Constantes matemáticas
        c_pi CONSTANT NUMBER := 3.14159265359;

        -- Límites de negocio
        c_salario_minimo CONSTANT NUMBER := 1000;
        c_edad_jubilacion CONSTANT NUMBER := 67;
        c_dias_garantia CONSTANT NUMBER := 365;

        -- Variables que sí pueden cambiar
        v_precio NUMBER := 100;
        v_precio_final NUMBER;
    BEGIN
        -- Usar las constantes en cálculos
        v_precio_final := v_precio * (1 + c_iva);

        DBMS_OUTPUT.PUT_LINE('Empresa: ' || c_empresa);
        DBMS_OUTPUT.PUT_LINE('Email: ' || c_email_soporte);
        DBMS_OUTPUT.PUT_LINE('Precio sin IVA: ' || v_precio || '€');
        DBMS_OUTPUT.PUT_LINE('IVA (' || (c_iva * 100) || '%): ' ||
                            (v_precio * c_iva) || '€');
        DBMS_OUTPUT.PUT_LINE('Precio final: ' || v_precio_final || '€');

        -- Esto daría ERROR:
        -- c_iva := 0.10;  -- ❌ ERROR! No puedes modificar una constante
    END;
    /

### Ejemplo Real: Sistema de Descuentos

    DECLARE
        -- Definir constantes para los diferentes descuentos
        c_descuento_estudiante CONSTANT NUMBER := 0.15;  -- 15%
        c_descuento_jubilado CONSTANT NUMBER := 0.20;    -- 20%
        c_descuento_empleado CONSTANT NUMBER := 0.25;    -- 25%

        -- Variables
        v_precio_base NUMBER := 100;
        v_precio_final NUMBER;
        v_es_estudiante BOOLEAN := TRUE;
    BEGIN
        -- Aplicar descuento según el tipo de cliente
        IF v_es_estudiante THEN
            v_precio_final := v_precio_base * (1 - c_descuento_estudiante);
            DBMS_OUTPUT.PUT_LINE('Descuento estudiante aplicado: ' ||
                               (c_descuento_estudiante * 100) || '%');
        ELSE
            v_precio_final := v_precio_base;
        END IF;

        DBMS_OUTPUT.PUT_LINE('Precio final: ' || v_precio_final || '€');
    END;
    /

💡 Buenas Prácticas con Constantes

- **Nombres descriptivos:** `c_iva` es mejor que `c_impuesto`
- **Mayúsculas opcionales:** Algunos programadores usan TODO EN MAYÚSCULAS para constantes: `C_IVA`
- **Agrúpalas al principio:** Declara todas las constantes juntas para que sean fáciles de encontrar
- **Documéntalas:** Añade comentarios explicando qué representa cada constante

Variable vs Constante - ¿Cuándo usar cada una?

**Usa VARIABLE cuando:**

- El valor puede cambiar durante la ejecución
- Almacenas resultados de consultas o cálculos
- Usas contadores o acumuladores

**Usa CONSTANTE cuando:**

- El valor es fijo y conocido de antemano
- Representa configuración, límites o parámetros de negocio
- Quieres dar nombre a un "número mágico" (evitar v_total := v_precio \* 1.21)

# Asignaciones

**Asignar** es el acto de dar un valor a una variable. Es como llenar una caja vacía con algo concreto. En PL/SQL hay dos formas principales de hacerlo:

1.  **Asignación directa (`:=`)** - Tú decides qué valor poner
2.  **Asignación con SELECT INTO** - El valor viene de la base de datos

## 1. Asignación Directa con el operador :=

**¿Por qué `:=` y no solo `=`?**

En PL/SQL, `=` se usa para **comparar** y `:=` se usa para **asignar**.

    -- En otros lenguajes (JavaScript, Python):
    x = 5          // Asignación

    -- En PL/SQL:
    x := 5         -- Asignación
    x = 5          -- Comparación (¿x es igual a 5?)

### Sintaxis básica

    nombre_variable := valor;

El **valor** puede ser:

- Un número literal: `v_edad := 25;`
- Una cadena de texto: `v_nombre := 'María';`
- El resultado de una operación: `v_total := 100 + 50;`
- El valor de otra variable: `v_copia := v_original;`
- El resultado de una función: `v_hoy := SYSDATE;`

### Ejemplos de Asignación Directa

    DECLARE
        v_nombre VARCHAR2(50);
        v_edad NUMBER;
        v_salario NUMBER(10,2);
    BEGIN
        -- Asignaciones directas
        v_nombre := 'Ana García';
        v_edad := 30;
        v_salario := 2500.50;

        -- Asignación con expresiones
        v_salario := v_salario * 1.10;  -- Incremento del 10%

        -- Asignación con funciones
        v_nombre := UPPER(v_nombre);

        DBMS_OUTPUT.PUT_LINE(v_nombre || ', ' || v_edad || ' años, salario: ' || v_salario);
    END;
    /

## 2. Asignación con SELECT INTO

Cuando necesitas que el valor venga de la base de datos, usas `SELECT INTO`. Es como hacer una consulta SQL normal, pero en lugar de mostrar los resultados en pantalla, los guardas en variables.

### ¿Cómo funciona?

En SQL normal haces:

    SELECT nombre, salario FROM empleados WHERE empleado_id = 100;

Esto muestra los datos en pantalla. Pero en PL/SQL necesitas **guardar** esos datos en variables para poder trabajar con ellos:

    SELECT nombre, salario
    INTO v_nombre, v_salario    -- Aquí se GUARDAN los datos
    FROM empleados
    WHERE empleado_id = 100;

### Sintaxis

    SELECT columna1, columna2, ...
    INTO variable1, variable2, ...
    FROM tabla
    WHERE condición;

**Reglas importantes:**

- El número de columnas debe coincidir con el número de variables
- Los tipos de datos deben ser compatibles
- El orden importa: la primera columna va a la primera variable, etc.

### Ejemplo Completo

    DECLARE
        -- Declarar variables para recibir los datos
        v_nombre empleados.nombre%TYPE;
        v_salario empleados.salario%TYPE;
        v_departamento empleados.departamento_id%TYPE;
    BEGIN
        -- Ejecutar consulta y guardar resultados
        SELECT nombre, salario, departamento_id
        INTO v_nombre, v_salario, v_departamento
        FROM empleados
        WHERE empleado_id = 100;

        -- Ahora puedes usar las variables
        DBMS_OUTPUT.PUT_LINE('=== DATOS DEL EMPLEADO ===');
        DBMS_OUTPUT.PUT_LINE('Nombre: ' || v_nombre);
        DBMS_OUTPUT.PUT_LINE('Salario: ' || v_salario || '€');
        DBMS_OUTPUT.PUT_LINE('Departamento: ' || v_departamento);

        -- Puedes hacer cálculos con los valores obtenidos
        DBMS_OUTPUT.PUT_LINE('Salario anual: ' || (v_salario * 12) || '€');
    END;
    /

### Ejemplo: SELECT INTO con Cálculos

Puedes seleccionar directamente el resultado de cálculos o funciones:

    DECLARE
        v_total_empleados NUMBER;
        v_salario_medio NUMBER;
        v_salario_maximo NUMBER;
    BEGIN
        -- Seleccionar resultados de funciones agregadas
        SELECT COUNT(*),
               AVG(salario),
               MAX(salario)
        INTO v_total_empleados,
             v_salario_medio,
             v_salario_maximo
        FROM empleados;

        DBMS_OUTPUT.PUT_LINE('Total empleados: ' || v_total_empleados);
        DBMS_OUTPUT.PUT_LINE('Salario medio: ' || ROUND(v_salario_medio, 2) || '€');
        DBMS_OUTPUT.PUT_LINE('Salario máximo: ' || v_salario_maximo || '€');
    END;
    /

⚠️ LA REGLA MÁS IMPORTANTE: Exactamente UNA fila

`SELECT INTO` solo funciona si la consulta devuelve **EXACTAMENTE UNA FILA**. Si devuelve 0 filas o más de 1, el programa falla con un error:

**Si devuelve 0 filas:**

- Se genera el error `NO_DATA_FOUND`
- Ejemplo: buscas el empleado 999 pero no existe

**Si devuelve más de 1 fila:**

- Se genera el error `TOO_MANY_ROWS`
- Ejemplo: seleccionas empleados del departamento 10 pero hay 5 empleados en ese departamento

**¿Cómo evitar estos errores?**

1.  Usa condiciones WHERE que garanticen una única fila (ej: WHERE empleado_id = 100)
2.  Para múltiples filas, usa CURSORES (lo veremos más adelante)
3.  Para funciones agregadas (COUNT, AVG, etc.) siempre devuelven una fila
4.  Maneja las excepciones (siguiente ejemplo)

## Manejo de Errores con SELECT INTO

Para manejar los casos donde SELECT INTO puede fallar, usamos la sección EXCEPTION:

    DECLARE
        v_nombre empleados.nombre%TYPE;
        v_salario empleados.salario%TYPE;
        v_buscar_id NUMBER := 999;  -- ID que probablemente no existe
    BEGIN
        -- Intentar buscar el empleado
        SELECT nombre, salario
        INTO v_nombre, v_salario
        FROM empleados
        WHERE empleado_id = v_buscar_id;

        -- Si llegamos aquí, es que se encontró exactamente 1 empleado
        DBMS_OUTPUT.PUT_LINE('✓ Empleado encontrado:');
        DBMS_OUTPUT.PUT_LINE('  Nombre: ' || v_nombre);
        DBMS_OUTPUT.PUT_LINE('  Salario: ' || v_salario || '€');

    EXCEPTION
        -- Si no encontró ningún empleado
        WHEN NO_DATA_FOUND THEN
            DBMS_OUTPUT.PUT_LINE('✗ No existe empleado con ID ' || v_buscar_id);
            DBMS_OUTPUT.PUT_LINE('  Verifica que el ID sea correcto');

        -- Si encontró más de uno (raro con empleado_id, pero posible con otros criterios)
        WHEN TOO_MANY_ROWS THEN
            DBMS_OUTPUT.PUT_LINE('✗ La consulta devolvió múltiples empleados');
            DBMS_OUTPUT.PUT_LINE('  Usa un WHERE más específico o un cursor');

        -- Cualquier otro error inesperado
        WHEN OTHERS THEN
            DBMS_OUTPUT.PUT_LINE('✗ Error inesperado: ' || SQLERRM);
    END;
    /

### Ejemplo Práctico: Buscar y Actualizar

Un caso real: buscar un empleado y darle un aumento de salario:

    DECLARE
        v_empleado_id NUMBER := 100;
        v_nombre empleados.nombre%TYPE;
        v_salario_actual empleados.salario%TYPE;
        v_salario_nuevo NUMBER;
        c_aumento CONSTANT NUMBER := 0.10;  -- 10% de aumento
    BEGIN
        -- 1. Buscar datos actuales del empleado
        SELECT nombre, salario
        INTO v_nombre, v_salario_actual
        FROM empleados
        WHERE empleado_id = v_empleado_id;

        -- 2. Calcular nuevo salario
        v_salario_nuevo := v_salario_actual * (1 + c_aumento);

        -- 3. Mostrar información
        DBMS_OUTPUT.PUT_LINE('Empleado: ' || v_nombre);
        DBMS_OUTPUT.PUT_LINE('Salario actual: ' || v_salario_actual || '€');
        DBMS_OUTPUT.PUT_LINE('Aumento: ' || (c_aumento * 100) || '%');
        DBMS_OUTPUT.PUT_LINE('Nuevo salario: ' || ROUND(v_salario_nuevo, 2) || '€');

        -- 4. Aplicar el aumento en la base de datos
        UPDATE empleados
        SET salario = v_salario_nuevo
        WHERE empleado_id = v_empleado_id;

        -- 5. Confirmar cambios
        COMMIT;
        DBMS_OUTPUT.PUT_LINE('✓ Aumento aplicado correctamente');

    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            DBMS_OUTPUT.PUT_LINE('Error: Empleado ' || v_empleado_id || ' no encontrado');
            -- No hay nada que hacer con ROLLBACK porque no se hizo ningún cambio

        WHEN OTHERS THEN
            DBMS_OUTPUT.PUT_LINE('Error al aplicar aumento: ' || SQLERRM);
            ROLLBACK;  -- Deshacer cualquier cambio si hubo error
    END;
    /

Resumen: SELECT INTO paso a paso

1.  **Declarar variables** del tipo correcto (usa %TYPE)
2.  **Escribir el SELECT** con las columnas que necesitas
3.  **Añadir INTO** con las variables donde guardar los datos
4.  **Añadir FROM y WHERE** para especificar qué fila quieres
5.  **Asegurarte** de que el WHERE devuelve exactamente 1 fila
6.  **Manejar excepciones** NO_DATA_FOUND y TOO_MANY_ROWS

💡 ¿Cuándo usar cada método de asignación?

**Usa := cuando:**

- Conoces el valor de antemano (literales, constantes)
- Haces cálculos con otras variables
- Usas funciones de PL/SQL (SYSDATE, UPPER, etc.)

**Usa SELECT INTO cuando:**

- El valor está en la base de datos
- Necesitas buscar información basándote en algún criterio
- Trabajas con agregaciones (COUNT, SUM, AVG, etc.)

# Operadores en PL/SQL

## Operadores Aritméticos

| Operador | Descripción    | Ejemplo                              |
|----------|----------------|--------------------------------------|
| `+`      | Suma           | `v_total := v_precio + v_iva;`       |
| `-`      | Resta          | `v_descuento := v_precio - 10;`      |
| `*`      | Multiplicación | `v_area := v_base * v_altura;`       |
| `/`      | División       | `v_promedio := v_suma / v_cantidad;` |
| `**`     | Exponenciación | `v_cuadrado := v_numero ** 2;`       |

## Operadores de Comparación

| Operador    | Descripción       | Ejemplo                            |
|-------------|-------------------|------------------------------------|
| `=`         | Igual a           | `IF v_edad = 18 THEN ...`          |
| `!=` o `<>` | Diferente de      | `IF v_estado != 'ACTIVO' THEN ...` |
| `<`         | Menor que         | `IF v_precio < 100 THEN ...`       |
| `>`         | Mayor que         | `IF v_salario > 3000 THEN ...`     |
| `<=`        | Menor o igual que | `IF v_edad <= 65 THEN ...`         |
| `>=`        | Mayor o igual que | `IF v_nota >= 5 THEN ...`          |

## Operadores Lógicos

| Operador | Descripción | Ejemplo                                             |
|----------|-------------|-----------------------------------------------------|
| `AND`    | Y lógico    | `IF v_edad >= 18 AND v_edad <= 65 THEN ...`         |
| `OR`     | O lógico    | `IF v_dia = 'SABADO' OR v_dia = 'DOMINGO' THEN ...` |
| `NOT`    | Negación    | `IF NOT v_activo THEN ...`                          |

## Operador de Concatenación

El operador `||` se usa para concatenar cadenas de texto:

    DECLARE
        v_nombre VARCHAR2(50) := 'Juan';
        v_apellido VARCHAR2(50) := 'Pérez';
        v_nombre_completo VARCHAR2(100);
    BEGIN
        v_nombre_completo := v_nombre || ' ' || v_apellido;
        DBMS_OUTPUT.PUT_LINE('Nombre completo: ' || v_nombre_completo);

        -- También se puede concatenar con números
        v_edad NUMBER := 25;
        DBMS_OUTPUT.PUT_LINE(v_nombre || ' tiene ' || v_edad || ' años');
    END;
    /

# Estructura Condicional IF-THEN-ELSE

Las estructuras condicionales permiten que tu programa **tome decisiones**. Es como los "si...entonces" de la vida real:

- "**Si** llueve, **entonces** llevo paraguas"
- "**Si** tengo más de 18 años, **entonces** puedo votar, **si no**, no puedo"
- "**Si** la nota es \>= 9, sobresaliente; **si** es \>= 7, notable; **si** es \>= 5, aprobado; **si no**, suspenso"

En PL/SQL, la estructura `IF` evalúa una **condición** (una expresión que es verdadera o falsa) y ejecuta diferentes bloques de código según el resultado.

### ¿Qué es una condición?

Una condición es cualquier expresión que Oracle pueda evaluar como verdadera (TRUE) o falsa (FALSE):

    v_edad >= 18           -- ¿La edad es mayor o igual que 18?
    v_nombre = 'Juan'      -- ¿El nombre es exactamente 'Juan'?
    v_salario > 3000       -- ¿El salario es mayor que 3000?
    v_activo = TRUE        -- ¿La variable activo es verdadera?
    v_stock <= 0           -- ¿El stock es menor o igual que 0?

## IF-THEN Simple - Ejecutar algo solo si se cumple una condición

**Úsalo cuando:** Solo quieres hacer algo SI se cumple una condición. Si no se cumple, no pasa nada.

    IF condición THEN
        -- Este código SOLO se ejecuta si la condición es TRUE
    END IF;

### Ejemplo 1: Alerta de stock bajo

    DECLARE
        v_stock NUMBER := 5;
        c_stock_minimo CONSTANT NUMBER := 10;
    BEGIN
        -- Solo mostrar alerta si el stock es bajo
        IF v_stock < c_stock_minimo THEN
            DBMS_OUTPUT.PUT_LINE('⚠️ ALERTA: Stock bajo!');
            DBMS_OUTPUT.PUT_LINE('Stock actual: ' || v_stock);
            DBMS_OUTPUT.PUT_LINE('Stock mínimo: ' || c_stock_minimo);
        END IF;

        DBMS_OUTPUT.PUT_LINE('Fin del programa');
        -- Este mensaje SIEMPRE se muestra, esté o no dentro del IF
    END;
    /

**¿Qué pasa si v_stock = 15?** El código dentro del IF NO se ejecuta, solo se muestra "Fin del programa".

### Ejemplo 2: Bonus para salarios bajos

    DECLARE
        v_salario NUMBER := 1500;
        v_bonus NUMBER := 0;
    BEGIN
        DBMS_OUTPUT.PUT_LINE('Salario base: ' || v_salario || '€');

        -- Dar bonus solo si el salario es menor de 2000
        IF v_salario < 2000 THEN
            v_bonus := 300;
            DBMS_OUTPUT.PUT_LINE('✓ Bonus aplicado: ' || v_bonus || '€');
        END IF;

        DBMS_OUTPUT.PUT_LINE('Salario total: ' || (v_salario + v_bonus) || '€');
    END;
    /

## IF-THEN-ELSE - Hacer una cosa u otra

**Úsalo cuando:** Quieres ejecutar un código si se cumple la condición, y OTRO código diferente si no se cumple. Siempre se ejecuta uno de los dos bloques.

    IF condición THEN
        -- Código si la condición es TRUE
    ELSE
        -- Código si la condición es FALSE
    END IF;

### Diagrama de flujo mental:

          ┌──────────────┐
          │  ¿Condición? │
          └──────┬───────┘
                 │
           ┌─────┴─────┐
           │           │
        TRUE          FALSE
           │           │
           ▼           ▼
      ┌────────┐  ┌────────┐
      │  THEN  │  │  ELSE  │
      └────────┘  └────────┘
           │           │
           └─────┬─────┘
                 ▼
          (continúa programa)

### Ejemplo 1: Mayor o menor de edad

    DECLARE
        v_edad NUMBER := 17;
    BEGIN
        DBMS_OUTPUT.PUT_LINE('Edad: ' || v_edad);

        IF v_edad >= 18 THEN
            DBMS_OUTPUT.PUT_LINE('✓ Eres mayor de edad');
            DBMS_OUTPUT.PUT_LINE('Puedes votar');
        ELSE
            DBMS_OUTPUT.PUT_LINE('✗ Eres menor de edad');
            DBMS_OUTPUT.PUT_LINE('No puedes votar');
        END IF;
    END;
    /

### Ejemplo 2: Aplicar descuento según el precio

    DECLARE
        v_precio NUMBER := 150;
        v_precio_final NUMBER;
        c_umbral CONSTANT NUMBER := 100;
    BEGIN
        DBMS_OUTPUT.PUT_LINE('Precio original: ' || v_precio || '€');

        IF v_precio > c_umbral THEN
            -- Compra grande: 10% de descuento
            v_precio_final := v_precio * 0.90;
            DBMS_OUTPUT.PUT_LINE('✓ Descuento del 10% aplicado');
        ELSE
            -- Compra pequeña: sin descuento
            v_precio_final := v_precio;
            DBMS_OUTPUT.PUT_LINE('Sin descuento (mínimo: ' || c_umbral || '€)');
        END IF;

        DBMS_OUTPUT.PUT_LINE('Precio final: ' || v_precio_final || '€');
    END;
    /

### Ejemplo 3: Par o impar

    DECLARE
        v_numero NUMBER := 7;
    BEGIN
        -- MOD devuelve el resto de la división
        -- Si numero MOD 2 = 0, es par; si es 1, es impar
        IF MOD(v_numero, 2) = 0 THEN
            DBMS_OUTPUT.PUT_LINE(v_numero || ' es PAR');
        ELSE
            DBMS_OUTPUT.PUT_LINE(v_numero || ' es IMPAR');
        END IF;
    END;
    /

## IF-THEN-ELSIF-ELSE - Múltiples Condiciones

**Úsalo cuando:** Tienes más de dos opciones. Es como una cadena de decisiones: "si esto... si no esto otro... si no esto otro... y si nada de lo anterior, entonces..."

    IF condición1 THEN
        -- Código si condición1 es TRUE
    ELSIF condición2 THEN
        -- Código si condición1 es FALSE y condición2 es TRUE
    ELSIF condición3 THEN
        -- Código si condición1 y condición2 son FALSE, y condición3 es TRUE
    ELSE
        -- Código si NINGUNA condición anterior es TRUE
    END IF;

⚠️ ¡Atención! Es ELSIF, no ELSEIF

En PL/SQL se escribe `ELSIF` (sin la segunda 'E'). Este es uno de los errores más comunes de principiantes:

- [x] Correcto: `ELSIF`
- ✗ Incorrecto: `ELSEIF` (como en PHP o Python)
- ✗ Incorrecto: `ELSE IF` (dos palabras separadas)

### ¿Cómo funciona la evaluación?

1.  Evalúa la primera condición (IF)
2.  Si es TRUE, ejecuta ese bloque y sale (NO evalúa el resto)
3.  Si es FALSE, pasa a evaluar el siguiente (ELSIF)
4.  Si ese es TRUE, ejecuta ese bloque y sale
5.  Si todos son FALSE, ejecuta el ELSE (si existe)

**Importante:** Solo se ejecuta UNO de los bloques, nunca más de uno.

### Ejemplo 1: Sistema de Calificaciones

    DECLARE
        v_nota NUMBER := 7.5;
        v_calificacion VARCHAR2(20);
    BEGIN
        DBMS_OUTPUT.PUT_LINE('Nota numérica: ' || v_nota);

        -- Evaluar la nota de mayor a menor
        IF v_nota >= 9 THEN
            v_calificacion := 'Sobresaliente';
        ELSIF v_nota >= 7 THEN
            v_calificacion := 'Notable';
        ELSIF v_nota >= 5 THEN
            v_calificacion := 'Aprobado';
        ELSIF v_nota >= 3 THEN
            v_calificacion := 'Insuficiente';
        ELSE
            v_calificacion := 'Muy deficiente';
        END IF;

        DBMS_OUTPUT.PUT_LINE('Calificación: ' || v_calificacion);
    END;
    /

**Explicación del flujo:**

    Nota = 7.5

    ¿7.5 >= 9?   → NO  → pasa al siguiente
    ¿7.5 >= 7?   → SÍ  → Ejecuta: v_calificacion := 'Notable'
                      → SALE del IF (no evalúa el resto)

    Resultado: "Notable"

### Ejemplo 2: Categorías de Salario

    DECLARE
        v_salario NUMBER := 2800;
        v_categoria VARCHAR2(20);
        v_descripcion VARCHAR2(100);
    BEGIN
        IF v_salario < 1000 THEN
            v_categoria := 'Becario';
            v_descripcion := 'Salario en prácticas';

        ELSIF v_salario < 1500 THEN
            v_categoria := 'Junior';
            v_descripcion := 'Empleado de nivel inicial';

        ELSIF v_salario < 2500 THEN
            v_categoria := 'Intermedio';
            v_descripcion := 'Empleado con experiencia';

        ELSIF v_salario < 4000 THEN
            v_categoria := 'Senior';
            v_descripcion := 'Empleado experimentado';

        ELSE
            v_categoria := 'Directivo';
            v_descripcion := 'Puesto de alta dirección';
        END IF;

        DBMS_OUTPUT.PUT_LINE('Salario: ' || v_salario || '€');
        DBMS_OUTPUT.PUT_LINE('Categoría: ' || v_categoria);
        DBMS_OUTPUT.PUT_LINE('Descripción: ' || v_descripcion);
    END;
    /

### Ejemplo 3: Calculadora de Descuentos por Volumen

    DECLARE
        v_cantidad NUMBER := 150;
        v_precio_unitario NUMBER := 10;
        v_descuento NUMBER;
        v_total NUMBER;
    BEGIN
        -- Descuentos por volumen de compra
        IF v_cantidad >= 500 THEN
            v_descuento := 0.20;  -- 20% para compras grandes
            DBMS_OUTPUT.PUT_LINE('✓ Descuento TOP aplicado: 20%');

        ELSIF v_cantidad >= 200 THEN
            v_descuento := 0.15;  -- 15% para compras medianas-grandes
            DBMS_OUTPUT.PUT_LINE('✓ Descuento ALTO aplicado: 15%');

        ELSIF v_cantidad >= 100 THEN
            v_descuento := 0.10;  -- 10% para compras medianas
            DBMS_OUTPUT.PUT_LINE('✓ Descuento MEDIO aplicado: 10%');

        ELSIF v_cantidad >= 50 THEN
            v_descuento := 0.05;  -- 5% para compras pequeñas
            DBMS_OUTPUT.PUT_LINE('✓ Descuento BÁSICO aplicado: 5%');

        ELSE
            v_descuento := 0;     -- Sin descuento
            DBMS_OUTPUT.PUT_LINE('Sin descuento (mínimo: 50 unidades)');
        END IF;

        -- Calcular total
        v_total := v_cantidad * v_precio_unitario * (1 - v_descuento);

        DBMS_OUTPUT.PUT_LINE('----------------------------');
        DBMS_OUTPUT.PUT_LINE('Cantidad: ' || v_cantidad || ' unidades');
        DBMS_OUTPUT.PUT_LINE('Precio unitario: ' || v_precio_unitario || '€');
        DBMS_OUTPUT.PUT_LINE('Subtotal: ' || (v_cantidad * v_precio_unitario) || '€');
        DBMS_OUTPUT.PUT_LINE('Descuento: ' || (v_descuento * 100) || '%');
        DBMS_OUTPUT.PUT_LINE('TOTAL: ' || v_total || '€');
    END;
    /

Orden de las Condiciones

El orden de las condiciones es MUY IMPORTANTE. Siempre evalúa de la más restrictiva a la menos restrictiva:

**✓ Correcto (de mayor a menor):**

    IF nota >= 9 THEN ...
    ELSIF nota >= 7 THEN ...
    ELSIF nota >= 5 THEN ...

**✗ Incorrecto (de menor a mayor):**

    IF nota >= 5 THEN ...      -- ¡Esto captura TODO >= 5!
    ELSIF nota >= 7 THEN ...   -- Nunca se ejecutará
    ELSIF nota >= 9 THEN ...   -- Nunca se ejecutará

Si pones las condiciones en orden incorrecto, los bloques posteriores nunca se ejecutarán.

## Condiciones Compuestas

    DECLARE
        v_edad NUMBER := 25;
        v_estudiante BOOLEAN := TRUE;
    BEGIN
        IF v_edad >= 18 AND v_edad <= 65 THEN
            DBMS_OUTPUT.PUT_LINE('Edad laboral');
        END IF;

        IF v_estudiante OR v_edad < 18 THEN
            DBMS_OUTPUT.PUT_LINE('Descuento aplicable');
        END IF;

        IF NOT v_estudiante THEN
            DBMS_OUTPUT.PUT_LINE('No es estudiante');
        END IF;
    END;
    /

# Expresión CASE

La expresión `CASE` es una alternativa a múltiples `IF-ELSIF` cuando se compara el mismo valor contra varias opciones.

## CASE Simple

    DECLARE
        v_dia_num NUMBER := 3;
        v_dia_nombre VARCHAR2(10);
    BEGIN
        v_dia_nombre := CASE v_dia_num
            WHEN 1 THEN 'Lunes'
            WHEN 2 THEN 'Martes'
            WHEN 3 THEN 'Miércoles'
            WHEN 4 THEN 'Jueves'
            WHEN 5 THEN 'Viernes'
            WHEN 6 THEN 'Sábado'
            WHEN 7 THEN 'Domingo'
            ELSE 'Día inválido'
        END;

        DBMS_OUTPUT.PUT_LINE('Día: ' || v_dia_nombre);
    END;
    /

## CASE Buscado

Permite evaluar diferentes condiciones en cada `WHEN`:

    DECLARE
        v_salario NUMBER := 2800;
        v_categoria VARCHAR2(20);
    BEGIN
        v_categoria := CASE
            WHEN v_salario < 1000 THEN 'Junior'
            WHEN v_salario BETWEEN 1000 AND 2500 THEN 'Medio'
            WHEN v_salario BETWEEN 2501 AND 4000 THEN 'Senior'
            ELSE 'Ejecutivo'
        END;

        DBMS_OUTPUT.PUT_LINE('Categoría: ' || v_categoria);
    END;
    /

## Sentencia CASE

También existe la sentencia `CASE` (no expresión) para control de flujo:

    DECLARE
        v_tipo_producto CHAR(1) := 'A';
    BEGIN
        CASE v_tipo_producto
            WHEN 'A' THEN
                DBMS_OUTPUT.PUT_LINE('Producto alimentario');
                DBMS_OUTPUT.PUT_LINE('IVA: 4%');
            WHEN 'B' THEN
                DBMS_OUTPUT.PUT_LINE('Producto básico');
                DBMS_OUTPUT.PUT_LINE('IVA: 10%');
            WHEN 'C' THEN
                DBMS_OUTPUT.PUT_LINE('Producto general');
                DBMS_OUTPUT.PUT_LINE('IVA: 21%');
            ELSE
                DBMS_OUTPUT.PUT_LINE('Tipo de producto desconocido');
        END CASE;
    END;
    /

# Bucles en PL/SQL

Un **bucle** (loop en inglés) es una estructura que permite ejecutar el mismo bloque de código múltiples veces.

### ¿Cuándo necesitas un bucle?

- Procesar todos los empleados de un departamento (uno por uno)
- Generar las tablas de multiplicar del 1 al 10
- Recorrer los 12 meses del año
- Repetir algo hasta que se cumpla una condición (ej: hasta que el usuario introduzca 0)
- Hacer cálculos iterativos (ej: calcular factoriales, secuencia de Fibonacci)

### Los Tres Tipos de Bucles en PL/SQL

| Tipo    | Cuándo Usarlo                                  | Característica Principal              |
|---------|------------------------------------------------|---------------------------------------|
| `LOOP`  | Cuando no sabes cuántas veces repetir          | Bucle "infinito" que sales con EXIT   |
| `WHILE` | Cuando sabes la condición pero no las veces    | Evalúa condición ANTES de cada vuelta |
| `FOR`   | Cuando sabes EXACTAMENTE cuántas veces repetir | Contador automático que va de X a Y   |

Conceptos Clave de los Bucles

- **Iteración:** Cada "vuelta" o repetición del bucle
- **Contador:** Variable que lleva la cuenta de cuántas vueltas has dado
- **Condición de salida:** Cuándo debe parar el bucle
- **Bucle infinito:** Un bucle que nunca termina (¡ERROR! consume recursos)

## LOOP Básico - El Bucle más Simple

El bucle `LOOP` es el más básico: repite el código indefinidamente hasta que TÚ le digas que pare con `EXIT`.

### Sintaxis

    LOOP
        -- Código que se repite
        -- ...

        EXIT WHEN condición;  -- Sale cuando la condición es TRUE
    END LOOP;

**⚠️ PELIGRO:** Si nunca pones EXIT, ¡el bucle será infinito y nunca terminará!

### Ejemplo 1: Contar del 1 al 5

    DECLARE
        v_contador NUMBER := 1;
    BEGIN
        LOOP
            -- Mostrar el número actual
            DBMS_OUTPUT.PUT_LINE('Número: ' || v_contador);

            -- Incrementar el contador
            v_contador := v_contador + 1;

            -- Condición de salida
            EXIT WHEN v_contador > 5;
        END LOOP;

        DBMS_OUTPUT.PUT_LINE('¡Bucle terminado!');
    END;
    /

    -- Salida:
    -- Número: 1
    -- Número: 2
    -- Número: 3
    -- Número: 4
    -- Número: 5
    -- ¡Bucle terminado!

**¿Cómo funciona?**

1.  Vuelta 1: contador=1, muestra "1", incrementa a 2, ¿2\>5? NO → continúa
2.  Vuelta 2: contador=2, muestra "2", incrementa a 3, ¿3\>5? NO → continúa
3.  Vuelta 3: contador=3, muestra "3", incrementa a 4, ¿4\>5? NO → continúa
4.  Vuelta 4: contador=4, muestra "4", incrementa a 5, ¿5\>5? NO → continúa
5.  Vuelta 5: contador=5, muestra "5", incrementa a 6, ¿6\>5? SÍ → SALE

### Ejemplo 2: Sumar números hasta superar 100

    DECLARE
        v_suma NUMBER := 0;
        v_numero NUMBER := 1;
    BEGIN
        DBMS_OUTPUT.PUT_LINE('Sumando números hasta superar 100...');

        LOOP
            -- Añadir el número actual a la suma
            v_suma := v_suma + v_numero;
            DBMS_OUTPUT.PUT_LINE('  ' || v_numero || ' sumado → Total: ' || v_suma);

            -- Pasar al siguiente número
            v_numero := v_numero + 1;

            -- Salir si la suma supera 100
            EXIT WHEN v_suma > 100;
        END LOOP;

        DBMS_OUTPUT.PUT_LINE('----------------------------');
        DBMS_OUTPUT.PUT_LINE('Suma final: ' || v_suma);
        DBMS_OUTPUT.PUT_LINE('Último número sumado: ' || (v_numero - 1));
    END;
    /

    -- ¿Qué hace? Suma 1+2+3+4+... hasta que la suma supere 100

### Dos formas de usar EXIT

#### 1. EXIT WHEN (condicional)

    LOOP
        -- código
        EXIT WHEN condición;  -- Sale SI la condición es TRUE
        -- más código
    END LOOP;

#### 2. EXIT solo (incondicional)

    LOOP
        -- código

        IF condición THEN
            EXIT;  -- Sale SIEMPRE que llegue aquí
        END IF;

        -- más código
    END LOOP;

### Ejemplo Práctico: Menú de Opciones

    DECLARE
        v_opcion NUMBER := 1;  -- En un programa real vendría del usuario
        v_contador NUMBER := 0;
    BEGIN
        DBMS_OUTPUT.PUT_LINE('=== MENÚ DE OPCIONES ===');

        LOOP
            v_contador := v_contador + 1;

            DBMS_OUTPUT.PUT_LINE('');
            DBMS_OUTPUT.PUT_LINE('Procesando opción ' || v_opcion || '...');

            -- Procesar según la opción
            IF v_opcion = 1 THEN
                DBMS_OUTPUT.PUT_LINE('  → Generando informe');
            ELSIF v_opcion = 2 THEN
                DBMS_OUTPUT.PUT_LINE('  → Exportando datos');
            ELSIF v_opcion = 3 THEN
                DBMS_OUTPUT.PUT_LINE('  → Abriendo configuración');
            ELSIF v_opcion = 0 THEN
                DBMS_OUTPUT.PUT_LINE('  → Saliendo del programa...');
                EXIT;  -- Salida inmediata
            ELSE
                DBMS_OUTPUT.PUT_LINE('  → Opción inválida');
            END IF;

            -- Simular cambio de opción
            v_opcion := v_opcion - 1;

            -- Seguridad: evitar bucle infinito en demostración
            EXIT WHEN v_contador > 10;
        END LOOP;

        DBMS_OUTPUT.PUT_LINE('');
        DBMS_OUTPUT.PUT_LINE('Programa finalizado');
    END;
    /

⚠️ Evita Bucles Infinitos

Un error común es olvidar la condición de salida:

**✗ MALO (bucle infinito):**

    DECLARE
        v_contador NUMBER := 1;
    BEGIN
        LOOP
            DBMS_OUTPUT.PUT_LINE(v_contador);
            -- ¡FALTA incrementar v_contador!
            -- ¡FALTA condición EXIT!
        END LOOP;
        -- Este bucle NUNCA termina → cuelga el programa
    END;
    /

**✓ BUENO:**

    DECLARE
        v_contador NUMBER := 1;
    BEGIN
        LOOP
            DBMS_OUTPUT.PUT_LINE(v_contador);
            v_contador := v_contador + 1;  -- ✓ Incrementa
            EXIT WHEN v_contador > 10;      -- ✓ Condición de salida
        END LOOP;
    END;
    /

**Tip:** Siempre asegúrate de que tu bucle TIENE una forma de salir.

## WHILE-LOOP

El bucle `WHILE` evalúa la condición antes de cada iteración:

    DECLARE
        v_contador NUMBER := 1;
    BEGIN
        WHILE v_contador <= 5 LOOP
            DBMS_OUTPUT.PUT_LINE('Contador: ' || v_contador);
            v_contador := v_contador + 1;
        END LOOP;
    END;
    /

**Ejemplo: Calcular factorial**

    DECLARE
        v_numero NUMBER := 5;
        v_factorial NUMBER := 1;
        v_i NUMBER := 1;
    BEGIN
        WHILE v_i <= v_numero LOOP
            v_factorial := v_factorial * v_i;
            v_i := v_i + 1;
        END LOOP;

        DBMS_OUTPUT.PUT_LINE('Factorial de ' || v_numero || ' = ' || v_factorial);
    END;
    /

## FOR-LOOP

El bucle `FOR` itera sobre un rango de valores:

    BEGIN
        FOR i IN 1..5 LOOP
            DBMS_OUTPUT.PUT_LINE('i = ' || i);
        END LOOP;
    END;
    /

Importante

La variable del bucle FOR (en este caso `i`) se declara automáticamente y solo existe dentro del bucle. No necesitas declararla en la sección DECLARE.

### FOR-LOOP Inverso

Usa `REVERSE` para iterar en orden descendente:

    BEGIN
        DBMS_OUTPUT.PUT_LINE('Cuenta atrás:');
        FOR i IN REVERSE 1..10 LOOP
            DBMS_OUTPUT.PUT_LINE(i);
        END LOOP;
        DBMS_OUTPUT.PUT_LINE('¡Despegue!');
    END;
    /

### CONTINUE

La sentencia `CONTINUE` salta a la siguiente iteración:

    BEGIN
        FOR i IN 1..10 LOOP
            -- Saltar números pares
            CONTINUE WHEN MOD(i, 2) = 0;

            DBMS_OUTPUT.PUT_LINE('Número impar: ' || i);
        END LOOP;
    END;
    /

## Bucles Anidados

Se pueden anidar bucles y usar etiquetas para mayor claridad:

    BEGIN
        <>
        FOR i IN 1..3 LOOP
            DBMS_OUTPUT.PUT_LINE('Fila ' || i);

            <>
            FOR j IN 1..4 LOOP
                DBMS_OUTPUT.PUT_LINE('  Columna ' || j);
            END LOOP bucle_interno;

        END LOOP bucle_externo;
    END;
    /

**Salir de bucles anidados:**

    DECLARE
        v_encontrado BOOLEAN := FALSE;
    BEGIN
        <>
        FOR i IN 1..10 LOOP
            FOR j IN 1..10 LOOP
                IF i * j = 42 THEN
                    DBMS_OUTPUT.PUT_LINE(i || ' x ' || j || ' = 42');
                    EXIT busqueda;  -- Sale del bucle externo
                END IF;
            END LOOP;
        END LOOP busqueda;
    END;
    /

# Cursores en PL/SQL

## ¿Qué es un Cursor?

¿Recuerdas que `SELECT INTO` solo funciona si la consulta devuelve EXACTAMENTE una fila? ¿Qué pasa si quieres procesar 100 empleados uno por uno?

Ahí es donde entran los **cursores**. Un cursosr es un puntero que recorre un conjunto de resultados fila por fila.

### Ejemplo Visual

    Resultado de SELECT * FROM empleados WHERE departamento_id = 10:

        ┌────────┬────────────┬─────────┐
        │  ID    │   Nombre   │ Salario │
        ├────────┼────────────┼─────────┤
     ┌─→│  101   │   Ana      │  2500   │  ← CURSOR apunta aquí (fila 1)
     │  ├────────┼────────────┼─────────┤
     │  │  102   │   Juan     │  2800   │
     │  ├────────┼────────────┼─────────┤
     │  │  103   │   María    │  3000   │
     │  └────────┴────────────┴─────────┘
     │
     └── FETCH: "dame la fila actual y avanza al siguiente"

    El cursor lee Ana → la procesas → avanza a Juan → lo procesas → avanza a María...

### ¿Cuándo Usar Cursores?

| Situación                                                              | ¿Usar Cursor? | ¿Por qué?                       |
|------------------------------------------------------------------------|---------------|---------------------------------|
| Consulta devuelve 1 fila                                               | NO            | Usa SELECT INTO                 |
| Consulta devuelve 0 o muchas filas y necesitas procesarlas una por una | SÍ            | Los cursores son la solución    |
| Solo necesitas contar o sumar                                          | NO            | Usa COUNT(), SUM() directamente |
| Necesitas hacer UPDATE/DELETE en cada fila con lógica compleja         | SÍ            | Cursor FOR UPDATE               |

Tipos de Cursores

1.  **Cursores Implícitos:** Oracle los crea automáticamente cuando ejecutas SQL (SELECT INTO, UPDATE, DELETE, INSERT). Tú no los ves, Oracle los gestiona.
2.  **Cursores Explícitos:** TÚ los declaras, los abres, lees las filas una por una, y los cierras. Tienes control total.

En esta sección nos centraremos en los **cursores explícitos** porque son los que necesitas conocer para procesar múltiples filas.

## El Problema que resuelven los cursores

**Intento fallido sin cursor:**

    DECLARE
        v_nombre empleados.nombre%TYPE;
        v_salario empleados.salario%TYPE;
    BEGIN
        -- Esto FALLA si hay más de 1 empleado en el departamento 10
        SELECT nombre, salario
        INTO v_nombre, v_salario
        FROM empleados
        WHERE departamento_id = 10;

        -- ERROR: ORA-01422: TOO_MANY_ROWS
    END;
    /

**Solución con cursor:**

    DECLARE
        v_nombre empleados.nombre%TYPE;
        v_salario empleados.salario%TYPE;

        -- 1. DECLARAR el cursor (definir la consulta)
        CURSOR c_empleados IS
            SELECT nombre, salario
            FROM empleados
            WHERE departamento_id = 10;
    BEGIN
        -- 2. ABRIR el cursor (ejecutar la consulta)
        OPEN c_empleados;

        -- 3. FETCH: leer filas una por una en un bucle
        LOOP
            FETCH c_empleados INTO v_nombre, v_salario;
            EXIT WHEN c_empleados%NOTFOUND;  -- Salir cuando no hay más filas

            -- Procesar cada empleado
            DBMS_OUTPUT.PUT_LINE(v_nombre || ' - ' || v_salario || '€');
        END LOOP;

        -- 4. CERRAR el cursor (liberar recursos)
        CLOSE c_empleados;
    END;
    /

**¡Ahora funciona!** Procesa todos los empleados del departamento 10, sin importar cuántos sean.

## Cursores Implícitos

Oracle gestiona automáticamente los cursores implícitos. Puedes usar sus atributos para obtener información:

| Atributo       | Descripción                                                         |
|----------------|---------------------------------------------------------------------|
| `SQL%FOUND`    | TRUE si la última sentencia SQL afectó al menos una fila            |
| `SQL%NOTFOUND` | TRUE si la última sentencia SQL no afectó ninguna fila              |
| `SQL%ROWCOUNT` | Número de filas afectadas por la última sentencia SQL               |
| `SQL%ISOPEN`   | Siempre FALSE para cursores implícitos (se cierran automáticamente) |

    BEGIN
        UPDATE empleados
        SET salario = salario * 1.10
        WHERE departamento_id = 10;

        IF SQL%FOUND THEN
            DBMS_OUTPUT.PUT_LINE('Empleados actualizados: ' || SQL%ROWCOUNT);
        ELSE
            DBMS_OUTPUT.PUT_LINE('No se actualizó ningún empleado');
        END IF;
    END;
    /

## Cursores Explícitos

Trabajar con cursores explícitos es como leer un libro: lo abres, lees página por página, y cuando terminas lo cierras.

### El Ciclo de Vida de un Cursor (4 pasos obligatorios)

Los 4 Pasos de un Cursor

1.  **DECLARE (Declarar):** Defines QUÉ consulta ejecutará el cursor. Es como decidir qué libro vas a leer.
2.  **OPEN (Abrir):** Ejecutas la consulta y preparas los resultados. Es como abrir el libro en la primera página.
3.  **FETCH (Leer/Recuperar):** Lees una fila y avanzas a la siguiente. Es como leer una página y pasar a la siguiente. Lo repites en un bucle hasta que no queden más filas.
4.  **CLOSE (Cerrar):** Liberas los recursos del cursor. Es como cerrar el libro cuando terminas. ¡MUY IMPORTANTE! Si no cierras cursores, consumes memoria innecesariamente.

### Analogía Visual del Flujo

    1. DECLARE                  2. OPEN                    3. FETCH (en bucle)
       ┌─────────┐                 ┌─────────┐                ┌─────────┐
       │ Cursor  │                 │Ejecutar │                │ Leer    │
       │ definido│────────────────→│ SELECT  │───────────────→│ fila    │
       └─────────┘                 └─────────┘                └────┬────┘
                                         │                          │
                                         ▼                          │
                                   ┌─────────┐                      │
                                   │Resultado│                      │
                                   │ de la   │                      │
                                   │consulta │                      │
                                   └─────────┘                      │
                                                                    │
                                   4. CLOSE ←───────────────────────┘
                                     ┌─────────┐
                                     │ Liberar │
                                     │recursos │
                                     └─────────┘

### Ejemplo Completo Paso a Paso

    DECLARE
        -- ═══════════════════════════════════════════════════════════
        -- PASO 1: DECLARAR el cursor
        -- ═══════════════════════════════════════════════════════════
        -- Aquí defines la consulta que ejecutará el cursor
        -- Por convención, los cursores se nombran con prefijo c_

        CURSOR c_empleados IS
            SELECT empleado_id, nombre, salario
            FROM empleados
            WHERE departamento_id = 10;

        -- Variables para almacenar cada fila que leas del cursor
        -- Usa %TYPE para que coincidan con los tipos de las columnas
        v_id empleados.empleado_id%TYPE;
        v_nombre empleados.nombre%TYPE;
        v_salario empleados.salario%TYPE;
    BEGIN
        DBMS_OUTPUT.PUT_LINE('=== LISTADO DE EMPLEADOS DEPT. 10 ===');
        DBMS_OUTPUT.PUT_LINE('');

        -- ═══════════════════════════════════════════════════════════
        -- PASO 2: ABRIR el cursor
        -- ═══════════════════════════════════════════════════════════
        -- Esto ejecuta el SELECT y prepara los resultados
        -- Es como ejecutar la consulta y tener los datos listos para leer

        OPEN c_empleados;

        -- ═══════════════════════════════════════════════════════════
        -- PASO 3: FETCH - Leer filas una por una en un BUCLE
        -- ═══════════════════════════════════════════════════════════
        LOOP
            -- FETCH: lee la SIGUIENTE fila y la guarda en las variables
            FETCH c_empleados INTO v_id, v_nombre, v_salario;

            -- ¿Ya no hay más filas? Salir del bucle
            -- %NOTFOUND es TRUE cuando FETCH no encontró más filas
            EXIT WHEN c_empleados%NOTFOUND;

            -- Procesar la fila actual
            DBMS_OUTPUT.PUT_LINE('ID: ' || v_id ||
                               ' | Nombre: ' || v_nombre ||
                               ' | Salario: ' || v_salario || '€');
        END LOOP;

        -- ═══════════════════════════════════════════════════════════
        -- PASO 4: CERRAR el cursor
        -- ═══════════════════════════════════════════════════════════
        -- ¡MUY IMPORTANTE! Siempre cierra el cursor para liberar recursos

        CLOSE c_empleados;

        DBMS_OUTPUT.PUT_LINE('');
        DBMS_OUTPUT.PUT_LINE('Fin del listado');
    END;
    /

### ¿Qué hace el código anterior?

1.  **Línea CURSOR:** Define que c_empleados es un cursor que ejecutará ese SELECT
2.  **OPEN:** Ejecuta el SELECT. Ahora Oracle tiene los resultados en memoria
3.  **Primera vuelta del LOOP:**
    - FETCH lee la primera fila y la guarda en v_id, v_nombre, v_salario
    - %NOTFOUND es FALSE (hay datos), no sale
    - Muestra los datos
4.  **Segunda vuelta:** FETCH lee la segunda fila, la procesa...
5.  **Última vuelta:**
    - FETCH intenta leer pero no hay más filas
    - %NOTFOUND es TRUE
    - EXIT saca del bucle
6.  **CLOSE:** Libera la memoria usada por el cursor

⚠️ Error Común: Olvidar EXIT WHEN

Si no pones `EXIT WHEN c_cursor%NOTFOUND`, el bucle intentará leer infinitamente y causará errores.

**¿Por qué?** Cuando FETCH no encuentra más filas, las variables quedan con el valor de la última fila leída. El bucle seguiría procesando esos mismos datos eternamente.

### Ejemplo Real: Dar Bonus a Empleados

    DECLARE
        CURSOR c_empleados_bajo_salario IS
            SELECT empleado_id, nombre, salario
            FROM empleados
            WHERE salario < 2000  -- Solo empleados con salario bajo
            ORDER BY salario ASC; -- Del menor al mayor salario

        v_id empleados.empleado_id%TYPE;
        v_nombre empleados.nombre%TYPE;
        v_salario empleados.salario%TYPE;
        v_bonus NUMBER;
        v_total_bonus NUMBER := 0;
        v_contador NUMBER := 0;
    BEGIN
        DBMS_OUTPUT.PUT_LINE('=== PROGRAMA DE BONUS ===');
        DBMS_OUTPUT.PUT_LINE('Bonus para empleados con salario < 2000€');
        DBMS_OUTPUT.PUT_LINE('');

        OPEN c_empleados_bajo_salario;

        LOOP
            FETCH c_empleados_bajo_salario INTO v_id, v_nombre, v_salario;
            EXIT WHEN c_empleados_bajo_salario%NOTFOUND;

            -- Calcular bonus (10% del salario, mínimo 150€)
            v_bonus := GREATEST(v_salario * 0.10, 150);

            -- Mostrar información
            DBMS_OUTPUT.PUT_LINE('Empleado: ' || v_nombre);
            DBMS_OUTPUT.PUT_LINE('  Salario actual: ' || v_salario || '€');
            DBMS_OUTPUT.PUT_LINE('  Bonus asignado: ' || ROUND(v_bonus, 2) || '€');
            DBMS_OUTPUT.PUT_LINE('');

            -- Acumular estadísticas
            v_total_bonus := v_total_bonus + v_bonus;
            v_contador := v_contador + 1;
        END LOOP;

        CLOSE c_empleados_bajo_salario;

        -- Mostrar resumen
        DBMS_OUTPUT.PUT_LINE('=== RESUMEN ===');
        DBMS_OUTPUT.PUT_LINE('Empleados beneficiados: ' || v_contador);
        DBMS_OUTPUT.PUT_LINE('Total bonus repartido: ' || ROUND(v_total_bonus, 2) || '€');
        DBMS_OUTPUT.PUT_LINE('Bonus promedio: ' ||
            ROUND(v_total_bonus / NULLIF(v_contador, 0), 2) || '€');
    END;
    /

### Atributos de Cursores

Los cursores tienen "atributos" que te dan información sobre su estado actual. Son como sensores que te dicen qué está pasando con el cursor.

| Atributo    | ¿Qué te dice?                                               | Cuándo Usarlo                                                     |
|-------------|-------------------------------------------------------------|-------------------------------------------------------------------|
| `%FOUND`    | TRUE si el último FETCH encontró y leyó una fila            | Para confirmar que se leyó una fila correctamente                 |
| `%NOTFOUND` | TRUE si el último FETCH NO encontró más filas (se acabaron) | Para salir del bucle cuando ya no hay más datos                   |
| `%ROWCOUNT` | Número total de filas que has leído hasta ahora             | Para llevar la cuenta, mostrar progreso, o limitar procesamiento  |
| `%ISOPEN`   | TRUE si el cursor está actualmente abierto                  | Para verificar si ya abriste el cursor (evitar abrirlo dos veces) |

#### Ejemplo: Usando los Atributos

    DECLARE
        CURSOR c_empleados IS
            SELECT nombre, salario FROM empleados WHERE departamento_id = 10;

        v_nombre empleados.nombre%TYPE;
        v_salario empleados.salario%TYPE;
    BEGIN
        -- Verificar si el cursor está abierto (buena práctica)
        IF c_empleados%ISOPEN THEN
            DBMS_OUTPUT.PUT_LINE('El cursor ya estaba abierto');
            CLOSE c_empleados;
        END IF;

        OPEN c_empleados;

        DBMS_OUTPUT.PUT_LINE('Procesando empleados...');
        DBMS_OUTPUT.PUT_LINE('');

        LOOP
            FETCH c_empleados INTO v_nombre, v_salario;

            -- Salir si no hay más filas
            EXIT WHEN c_empleados%NOTFOUND;

            -- Mostrar número de fila procesada usando %ROWCOUNT
            DBMS_OUTPUT.PUT_LINE('Fila ' || c_empleados%ROWCOUNT || ': ' ||
                               v_nombre || ' - ' || v_salario || '€');

            -- Procesar solo las primeras 10 filas (ejemplo de límite)
            EXIT WHEN c_empleados%ROWCOUNT >= 10;
        END LOOP;

        DBMS_OUTPUT.PUT_LINE('');
        DBMS_OUTPUT.PUT_LINE('Total filas procesadas: ' || c_empleados%ROWCOUNT);

        CLOSE c_empleados;
    END;
    /

💡 %FOUND vs %NOTFOUND

Son opuestos exactos:

- `%FOUND` = TRUE → hay datos → continúa procesando
- `%NOTFOUND` = TRUE → no hay más datos → sal del bucle

Normalmente usas `%NOTFOUND` porque es más intuitivo: "si NO encontró datos, sal".

### Cursores con Parámetros

Los cursores pueden aceptar parámetros para hacerlos más flexibles:

    DECLARE
        CURSOR c_empleados_dept(p_dept_id NUMBER) IS
            SELECT empleado_id, nombre, salario
            FROM empleados
            WHERE departamento_id = p_dept_id
            ORDER BY salario DESC;

        v_id empleados.empleado_id%TYPE;
        v_nombre empleados.nombre%TYPE;
        v_salario empleados.salario%TYPE;
    BEGIN
        -- Abrir el cursor para el departamento 10
        OPEN c_empleados_dept(10);
        DBMS_OUTPUT.PUT_LINE('=== Departamento 10 ===');

        LOOP
            FETCH c_empleados_dept INTO v_id, v_nombre, v_salario;
            EXIT WHEN c_empleados_dept%NOTFOUND;
            DBMS_OUTPUT.PUT_LINE(v_nombre || ': ' || v_salario);
        END LOOP;

        CLOSE c_empleados_dept;

        -- Reutilizar el cursor para otro departamento
        OPEN c_empleados_dept(20);
        DBMS_OUTPUT.PUT_LINE('=== Departamento 20 ===');

        LOOP
            FETCH c_empleados_dept INTO v_id, v_nombre, v_salario;
            EXIT WHEN c_empleados_dept%NOTFOUND;
            DBMS_OUTPUT.PUT_LINE(v_nombre || ': ' || v_salario);
        END LOOP;

        CLOSE c_empleados_dept;
    END;
    /

## FOR-LOOP con cursores

**¡Atención!** Esta es la forma MÁS FÁCIL y RECOMENDADA de trabajar con cursores. Oracle hace TODO el trabajo por ti.

### El Problema con el Método Manual

Con el método que vimos antes (OPEN, LOOP, FETCH, CLOSE) tienes que:

- Declarar variables para cada columna
- Acordarte de OPEN
- Escribir el FETCH manualmente
- Acordarte de EXIT WHEN %NOTFOUND
- Acordarte de CLOSE

Son muchas cosas para recordar y es fácil olvidar alguna (especialmente el CLOSE).

### La solución: FOR-LOOP con cursor

Con el bucle FOR, Oracle hace TODO esto automáticamente:

Lo que hace FOR automáticamente

1.  **Abre el cursor** automáticamente
2.  **Declara una variable registro** que tiene todos los campos del SELECT
3.  **Hace FETCH** automáticamente en cada vuelta del bucle
4.  **Sale del bucle** automáticamente cuando no hay más filas
5.  **Cierra el cursor** automáticamente al terminar

**Resultado:** ¡Menos código, menos errores, más fácil de leer!

### Comparación: Antes y Después

#### Método Manual (largo y tedioso)

    DECLARE
        CURSOR c_empleados IS
            SELECT nombre, salario FROM empleados WHERE departamento_id = 10;

        -- Tienes que declarar variables manualmente
        v_nombre empleados.nombre%TYPE;
        v_salario empleados.salario%TYPE;
    BEGIN
        OPEN c_empleados;  -- Abrir manualmente

        LOOP
            FETCH c_empleados INTO v_nombre, v_salario;  -- Fetch manual
            EXIT WHEN c_empleados%NOTFOUND;              -- Salida manual

            DBMS_OUTPUT.PUT_LINE(v_nombre || ' - ' || v_salario);
        END LOOP;

        CLOSE c_empleados;  -- Cerrar manualmente (¡fácil de olvidar!)
    END;
    /

#### Método FOR (corto y elegante)

    DECLARE
        CURSOR c_empleados IS
            SELECT nombre, salario FROM empleados WHERE departamento_id = 10;
    BEGIN
        -- FOR hace TODO automáticamente
        FOR emp IN c_empleados LOOP
            -- emp es un registro con los campos nombre y salario
            DBMS_OUTPUT.PUT_LINE(emp.nombre || ' - ' || emp.salario);
        END LOOP;
        -- No necesitas CLOSE, se hace automáticamente
    END;
    /

### ¿Cómo Funciona FOR con Cursores?

    FOR variable_registro IN nombre_cursor LOOP
        -- Usa variable_registro.nombre_columna para acceder a los datos
    END LOOP;

**Desglosando la sintaxis:**

- `variable_registro` - Un nombre que eliges (común: emp, row, reg). Oracle la crea automáticamente, NO la declares en DECLARE
- `nombre_cursor` - El cursor que declaraste
- Dentro del LOOP: accedes a las columnas con `variable.columna`

### Ejemplo Completo con FOR

    DECLARE
        CURSOR c_empleados IS
            SELECT empleado_id, nombre, salario, departamento_id
            FROM empleados
            WHERE departamento_id = 10
            ORDER BY salario DESC;  -- Del mayor al menor salario

        v_contador NUMBER := 0;
        v_suma_salarios NUMBER := 0;
    BEGIN
        DBMS_OUTPUT.PUT_LINE('=== EMPLEADOS DEL DEPARTAMENTO 10 ===');
        DBMS_OUTPUT.PUT_LINE('');

        -- FOR hace todo automáticamente
        FOR emp IN c_empleados LOOP
            v_contador := v_contador + 1;
            v_suma_salarios := v_suma_salarios + emp.salario;

            -- Acceder a los campos con emp.nombre_columna
            DBMS_OUTPUT.PUT_LINE('Empleado #' || v_contador);
            DBMS_OUTPUT.PUT_LINE('  ID: ' || emp.empleado_id);
            DBMS_OUTPUT.PUT_LINE('  Nombre: ' || emp.nombre);
            DBMS_OUTPUT.PUT_LINE('  Salario: ' || emp.salario || '€');
            DBMS_OUTPUT.PUT_LINE('');
        END LOOP;

        -- Mostrar estadísticas
        IF v_contador > 0 THEN
            DBMS_OUTPUT.PUT_LINE('=== RESUMEN ===');
            DBMS_OUTPUT.PUT_LINE('Total empleados: ' || v_contador);
            DBMS_OUTPUT.PUT_LINE('Suma salarios: ' || v_suma_salarios || '€');
            DBMS_OUTPUT.PUT_LINE('Salario promedio: ' ||
                ROUND(v_suma_salarios / v_contador, 2) || '€');
        ELSE
            DBMS_OUTPUT.PUT_LINE('No hay empleados en este departamento');
        END IF;
    END;
    /

### FOR-LOOP con cursor Inline

¿Quieres hacerlo aún más simple? Puedes escribir el SELECT directamente dentro del FOR, sin ni siquiera declarar el cursor:

    BEGIN
        -- El cursor se crea y se ejecuta directamente en el FOR
        FOR emp IN (SELECT empleado_id, nombre, salario
                    FROM empleados
                    WHERE salario > 3000
                    ORDER BY salario DESC)
        LOOP
            DBMS_OUTPUT.PUT_LINE(emp.nombre || ' gana ' || emp.salario || '€');
        END LOOP;
    END;
    /

**Ventajas del cursor inline:**

- No necesitas sección DECLARE
- El cursor solo existe dentro del FOR (no "contamina" el resto del código)
- Perfecto para consultas simples que solo usas una vez

**¿Cuándo usar cada forma?**

- **Cursor declarado:** Cuando la consulta es compleja o la reutilizarás
- **Cursor inline:** Cuando es una consulta simple que solo usas una vez

### Ejemplo Real: Generar Informe de Ventas

    BEGIN
        DBMS_OUTPUT.PUT_LINE('╔════════════════════════════════════════╗');
        DBMS_OUTPUT.PUT_LINE('║     INFORME DE VENTAS POR PRODUCTO     ║');
        DBMS_OUTPUT.PUT_LINE('╚════════════════════════════════════════╝');
        DBMS_OUTPUT.PUT_LINE('');

        -- Cursor inline con JOIN y funciones agregadas
        FOR producto IN (
            SELECT p.nombre,
                   p.precio_unitario,
                   COUNT(v.venta_id) AS num_ventas,
                   SUM(v.cantidad) AS total_unidades,
                   SUM(v.cantidad * p.precio_unitario) AS total_ingresos
            FROM productos p
            LEFT JOIN ventas v ON p.producto_id = v.producto_id
            GROUP BY p.producto_id, p.nombre, p.precio_unitario
            HAVING SUM(v.cantidad * p.precio_unitario) > 1000  -- Solo productos rentables
            ORDER BY total_ingresos DESC
        )
        LOOP
            DBMS_OUTPUT.PUT_LINE('Producto: ' || producto.nombre);
            DBMS_OUTPUT.PUT_LINE('  Precio: ' || producto.precio_unitario || '€');
            DBMS_OUTPUT.PUT_LINE('  Ventas realizadas: ' || producto.num_ventas);
            DBMS_OUTPUT.PUT_LINE('  Unidades vendidas: ' || producto.total_unidades);
            DBMS_OUTPUT.PUT_LINE('  Ingresos totales: ' ||
                ROUND(producto.total_ingresos, 2) || '€');
            DBMS_OUTPUT.PUT_LINE('  ────────────────────────');
        END LOOP;

        DBMS_OUTPUT.PUT_LINE('');
        DBMS_OUTPUT.PUT_LINE('Fin del informe');
    END;
    /

Regla de Oro para Cursores

**Usa SIEMPRE el bucle FOR con cursores**, a menos que:

- Necesites control muy preciso sobre OPEN/CLOSE (raro)
- Necesites salir del bucle bajo condiciones muy específicas en medio del procesamiento

El 95% de las veces, FOR es la mejor opción. Es más simple, más seguro (no olvidas cerrar el cursor), y más fácil de leer.

### Cursores FOR UPDATE

Cuando necesitas actualizar las filas recuperadas por un cursor, usa `FOR UPDATE`:

    DECLARE
        CURSOR c_empleados IS
            SELECT empleado_id, nombre, salario
            FROM empleados
            WHERE departamento_id = 10
            FOR UPDATE OF salario NOWAIT;
    BEGIN
        FOR emp IN c_empleados LOOP
            -- Actualizar el salario de cada empleado
            UPDATE empleados
            SET salario = salario * 1.10
            WHERE CURRENT OF c_empleados;

            DBMS_OUTPUT.PUT_LINE('Actualizado: ' || emp.nombre);
        END LOOP;

        COMMIT;
    END;
    /

⚠️ NOWAIT

La cláusula `NOWAIT` hace que el cursor falle inmediatamente si las filas están bloqueadas por otro usuario. Sin ella, esperaría indefinidamente.

# Procedimientos Almacenados

## ¿Qué es un Procedimiento?

Imagina que tienes una tarea que haces frecuentemente: por ejemplo, calcular el bonus de un empleado, actualizar su salario, y registrar el cambio en una tabla de auditoría. En lugar de escribir ese código cada vez que lo necesitas, lo escribes una vez como un procedimiento y luego lo llamas cuando lo necesites.

Un **procedimiento** es como una "receta" guardada: le das un nombre, lo guardas en la base de datos, y luego puedes ejecutarlo las veces que quieras simplemente llamándolo por su nombre.

### ¿Por qué usar Procedimientos?

### ♻Reutilización

Escribe el código una vez, úsalo mil veces. No repites código.

### Mantenimiento

Si hay un error o necesitas cambiar algo, lo corriges en UN solo lugar.

### Modularidad

Divide problemas grandes en piezas pequeñas y manejables.

### Seguridad

Puedes dar permiso para ejecutar el procedimiento sin dar acceso directo a las tablas.

### ⚡ Rendimiento

Se compila una vez y se ejecuta rápido. Reduce el tráfico de red.

### 📝 Claridad

Tu código es más legible: `aumentar_salario(100, 10)` es más claro que 20 líneas de SQL.

### Procedimiento vs Bloque Anónimo

| Característica        | Bloque Anónimo               | Procedimiento             |
|-----------------------|------------------------------|---------------------------|
| ¿Tiene nombre?        | NO                           | SÍ                        |
| ¿Se guarda en la BD?  | NO (se ejecuta y desaparece) | SÍ (permanece en la BD)   |
| ¿Se puede reutilizar? | NO (hay que reescribirlo)    | SÍ (se llama por nombre)  |
| ¿Acepta parámetros?   | NO                           | SÍ                        |
| Cuándo usar           | Para pruebas rápidas         | Para código de producción |

## Sintaxis Básica

    CREATE [OR REPLACE] PROCEDURE nombre_procedimiento
        [(parametro1 [modo] tipo_dato,
          parametro2 [modo] tipo_dato,
          ...)]
    IS
        -- Declaraciones locales
    BEGIN
        -- Sentencias ejecutables
    EXCEPTION
        -- Manejo de excepciones (opcional)
    END nombre_procedimiento;
    /

## Tu Primer Procedimiento

Empecemos con el ejemplo más simple posible:

### 1. Crear el Procedimiento

    -- Crear el procedimiento y guardarlo en la base de datos
    CREATE OR REPLACE PROCEDURE saludar
    IS
        -- IS es equivalente a AS - puedes usar cualquiera
        -- Aquí irían las declaraciones de variables (si las necesitas)
    BEGIN
        DBMS_OUTPUT.PUT_LINE('¡Hola desde un procedimiento!');
        DBMS_OUTPUT.PUT_LINE('Me ejecutaré cada vez que me llames');
    END saludar;
    /

    -- Mensaje de Oracle: "Procedure created."

**Explicación línea por línea:**

- `CREATE OR REPLACE` - Crea el procedimiento. Si ya existe uno con ese nombre, lo reemplaza
- `PROCEDURE saludar` - El nombre del procedimiento (usa nombres descriptivos)
- `IS` - Separa la declaración de la implementación (también puedes usar `AS`)
- `BEGIN ... END` - El código que se ejecutará cuando llames al procedimiento
- `END saludar;` - Opcionalmente puedes poner el nombre del procedimiento aquí (buena práctica)
- `/` - Ejecuta el comando CREATE (guarda el procedimiento en la BD)

CREATE OR REPLACE

Usa siempre `CREATE OR REPLACE` en lugar de solo `CREATE`:

- Si el procedimiento no existe → lo crea
- Si ya existe → lo reemplaza con la nueva versión

Esto es muy útil durante el desarrollo, porque puedes ejecutar el script múltiples veces sin errores.

### 2. Llamar (Ejecutar) el Procedimiento

Una vez creado, puedes ejecutarlo de tres formas:

#### Forma 1: Desde un bloque PL/SQL

    BEGIN
        saludar;  -- Simplemente escribe su nombre
    END;
    /

    -- Salida:
    -- ¡Hola desde un procedimiento!
    -- Me ejecutaré cada vez que me llames

#### Forma 2: Con EXECUTE (solo en SQL\*Plus/SQLcl/SQL Developer)

    EXECUTE saludar;
    -- o la forma corta:
    EXEC saludar;

#### Forma 3: Con CALL (estándar SQL)

    CALL saludar();

**¿Cuál usar?** En bloques PL/SQL usa la Forma 1. Para pruebas rápidas desde SQL Developer, usa `EXEC`.

### Ejemplo: Procedimiento para Limpiar Datos

    CREATE OR REPLACE PROCEDURE limpiar_empleados_inactivos
    IS
        v_eliminados NUMBER;
    BEGIN
        DBMS_OUTPUT.PUT_LINE('Iniciando limpieza de empleados inactivos...');

        -- Eliminar empleados que no han tenido actividad en 5 años
        DELETE FROM empleados
        WHERE fecha_ultimo_acceso < ADD_MONTHS(SYSDATE, -60)
        AND estado = 'INACTIVO';

        -- Guardar cuántos se eliminaron
        v_eliminados := SQL%ROWCOUNT;

        -- Confirmar cambios
        COMMIT;

        DBMS_OUTPUT.PUT_LINE('Limpieza completada.');
        DBMS_OUTPUT.PUT_LINE('Empleados eliminados: ' || v_eliminados);
    END limpiar_empleados_inactivos;
    /

    -- Ejecutar:
    EXEC limpiar_empleados_inactivos;

## Parámetros en Procedimientos

Los procedimientos sin parámetros son limitados: siempre hacen exactamente lo mismo. Los parámetros te permiten hacer procedimientos **flexibles** que se adaptan a diferentes situaciones.

### Analogía

Piensa en una calculadora:

- **Sin parámetros:** Una calculadora que solo suma 2+2. Siempre da 4.
- **Con parámetros:** Una calculadora que suma dos números QUE TÚ LE DAS. Tú decides qué sumar.

Los parámetros son esas "entradas" que le pasas al procedimiento para que trabaje con ellas.

### Los Tres Modos de Parámetros

En PL/SQL, los parámetros pueden funcionar de tres formas diferentes:

| Modo     | Dirección          | Explicación Simple                                                      | Analogía                                                                             |
|----------|--------------------|-------------------------------------------------------------------------|--------------------------------------------------------------------------------------|
| `IN`     | Tú → Procedimiento | Le PASAS un valor al procedimiento. Él lo lee pero NO lo puede cambiar. | Como darle una fotocopia de un documento: puede leerlo pero no modificar el original |
| `OUT`    | Procedimiento → Tú | El procedimiento te DEVUELVE un valor. No le pasas nada de entrada.     | Como una máquina expendedora: no metes nada, solo recibes algo de vuelta             |
| `IN OUT` | Tú ⟷ Procedimiento | Le pasas un valor Y él te devuelve otro (o el mismo modificado).        | Como darle un documento original para que lo modifique y te lo devuelva modificado   |

💡 Modo por Defecto

Si no especificas el modo, Oracle asume `IN`. Estos son equivalentes:

    PROCEDURE ejemplo(p_numero NUMBER)          -- IN por defecto
    PROCEDURE ejemplo(p_numero IN NUMBER)       -- Explícito

### Visualización de los Modos

                  IN                    OUT                  IN OUT
             ┌──────────┐          ┌──────────┐         ┌──────────┐
      Valor  │          │          │          │  Valor  │          │  Valor
      ──────→│  PROC    │          │  PROC    │←────────│  PROC    │←──────
             │          │          │          │         │          │
             └──────────┘          └──────────┘         └────┬─────┘
                                                             │
                                                        Valor modificado
                                                             │
                                                             ↓

### Modo IN - Pasar Datos AL Procedimiento

**Úsalo cuando:** Necesitas pasarle información al procedimiento, pero el procedimiento NO debe modificar ese valor.

#### Ejemplo Simple: Saludar a Alguien

    CREATE OR REPLACE PROCEDURE saludar_persona(
        p_nombre IN VARCHAR2  -- Parámetro de ENTRADA
    )
    IS
    BEGIN
        -- Podemos LEER p_nombre
        DBMS_OUTPUT.PUT_LINE('¡Hola, ' || p_nombre || '!');
        DBMS_OUTPUT.PUT_LINE('Bienvenido al sistema');

        -- Pero NO podemos hacer esto:
        -- p_nombre := 'Otro nombre';  -- ERROR! IN no se puede modificar
    END saludar_persona;
    /

    -- Llamadas al procedimiento:
    BEGIN
        saludar_persona('Ana');     -- Salida: ¡Hola, Ana!
        saludar_persona('Juan');    -- Salida: ¡Hola, Juan!
        saludar_persona('María');   -- Salida: ¡Hola, María!
    END;
    /

#### Ejemplo Real: Aumentar Salario

    CREATE OR REPLACE PROCEDURE aumentar_salario(
        p_empleado_id IN NUMBER,      -- ID del empleado a actualizar
        p_porcentaje IN NUMBER        -- % de aumento (ej: 10 para 10%)
    )
    IS
        v_salario_actual NUMBER;
        v_salario_nuevo NUMBER;
    BEGIN
        DBMS_OUTPUT.PUT_LINE('Procesando aumento para empleado ' || p_empleado_id);

        -- 1. Obtener salario actual
        SELECT salario INTO v_salario_actual
        FROM empleados
        WHERE empleado_id = p_empleado_id;

        -- 2. Calcular nuevo salario
        v_salario_nuevo := v_salario_actual * (1 + p_porcentaje / 100);

        -- 3. Actualizar en la base de datos
        UPDATE empleados
        SET salario = v_salario_nuevo
        WHERE empleado_id = p_empleado_id;

        -- 4. Mostrar resultado
        DBMS_OUTPUT.PUT_LINE('Salario anterior: ' || v_salario_actual || '€');
        DBMS_OUTPUT.PUT_LINE('Aumento: ' || p_porcentaje || '%');
        DBMS_OUTPUT.PUT_LINE('Salario nuevo: ' || v_salario_nuevo || '€');

        COMMIT;

    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            DBMS_OUTPUT.PUT_LINE('ERROR: Empleado ' || p_empleado_id || ' no existe');
        WHEN OTHERS THEN
            DBMS_OUTPUT.PUT_LINE('ERROR: ' || SQLERRM);
            ROLLBACK;
    END aumentar_salario;
    /

    -- Llamadas de ejemplo:
    BEGIN
        aumentar_salario(100, 10);    -- Aumentar 10% al empleado 100
        aumentar_salario(101, 5);     -- Aumentar 5% al empleado 101
        aumentar_salario(102, 15);    -- Aumentar 15% al empleado 102
    END;
    /

**Ventajas de usar parámetros IN:**

- Un solo procedimiento sirve para TODOS los empleados (no necesitas uno por empleado)
- Puedes aplicar diferentes porcentajes de aumento
- El código es reutilizable y flexible

### Modo OUT - Recibir Datos DEL Procedimiento

**Úsalo cuando:** El procedimiento necesita DEVOLVERTE uno o más valores (resultados).

**Diferencia clave:** Los procedimientos NO usan `RETURN` (eso es para funciones). Para devolver valores usan parámetros OUT.

#### Ejemplo Simple: Calcular Área de un Rectángulo

    CREATE OR REPLACE PROCEDURE calcular_area_rectangulo(
        p_base IN NUMBER,        -- ENTRADA: le pasamos la base
        p_altura IN NUMBER,      -- ENTRADA: le pasamos la altura
        p_area OUT NUMBER        -- SALIDA: él nos devuelve el área
    )
    IS
    BEGIN
        -- Calcular área y guardarla en el parámetro OUT
        p_area := p_base * p_altura;

        -- El parámetro OUT se "devuelve" automáticamente al finalizar
    END calcular_area_rectangulo;
    /

    -- Uso del procedimiento:
    DECLARE
        v_resultado NUMBER;  -- Variable para recibir el resultado
    BEGIN
        -- Llamar al procedimiento
        -- Los parámetros OUT se pasan como variables (no como valores)
        calcular_area_rectangulo(10, 5, v_resultado);

        -- Ahora v_resultado contiene el valor que devolvió el procedimiento
        DBMS_OUTPUT.PUT_LINE('El área es: ' || v_resultado);
        -- Salida: El área es: 50
    END;
    /

⚠️ Importante sobre OUT

Los parámetros OUT:

- Se pasan como VARIABLES, no como valores literales
- Cuando el procedimiento termina, las variables "se llenan" con los valores
- Puedes tener múltiples parámetros OUT (devolver varios valores a la vez)

**Error común:**

    -- ✗ INCORRECTO:
    calcular_area_rectangulo(10, 5, 50);  -- ERROR! 50 es un valor, no una variable

    -- ✓ CORRECTO:
    DECLARE
        v_area NUMBER;
    BEGIN
        calcular_area_rectangulo(10, 5, v_area);  -- v_area es una variable
    END;

#### Ejemplo Real: Obtener Datos de Empleado

    CREATE OR REPLACE PROCEDURE obtener_datos_empleado(
        -- Parámetro IN: le pasamos el ID
        p_empleado_id IN NUMBER,

        -- Parámetros OUT: nos devuelve los datos
        p_nombre OUT VARCHAR2,
        p_salario OUT NUMBER,
        p_departamento OUT VARCHAR2
    )
    IS
    BEGIN
        -- Buscar empleado y guardar resultados en los parámetros OUT
        SELECT e.nombre, e.salario, d.nombre
        INTO p_nombre, p_salario, p_departamento
        FROM empleados e
        JOIN departamentos d ON e.departamento_id = d.departamento_id
        WHERE e.empleado_id = p_empleado_id;

    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            -- Si no existe, devolver NULLs
            p_nombre := NULL;
            p_salario := NULL;
            p_departamento := NULL;
    END obtener_datos_empleado;
    /

    -- Uso del procedimiento:
    DECLARE
        -- Declarar variables para RECIBIR los valores
        v_nombre VARCHAR2(100);
        v_salario NUMBER;
        v_depto VARCHAR2(100);
    BEGIN
        DBMS_OUTPUT.PUT_LINE('=== CONSULTAR EMPLEADO ===');

        -- Llamar al procedimiento
        -- El procedimiento "llenará" estas tres variables con los datos
        obtener_datos_empleado(100, v_nombre, v_salario, v_depto);

        -- Verificar si encontró al empleado
        IF v_nombre IS NOT NULL THEN
            DBMS_OUTPUT.PUT_LINE('✓ Empleado encontrado:');
            DBMS_OUTPUT.PUT_LINE('  Nombre: ' || v_nombre);
            DBMS_OUTPUT.PUT_LINE('  Salario: ' || v_salario || '€');
            DBMS_OUTPUT.PUT_LINE('  Departamento: ' || v_depto);
        ELSE
            DBMS_OUTPUT.PUT_LINE('✗ Empleado no encontrado');
        END IF;
    END;
    /

#### ¿Por qué usar OUT en lugar de SELECT INTO directamente?

Ventajas de usar un procedimiento con OUT:

- **Reutilización:** El mismo procedimiento se usa en múltiples lugares
- **Encapsulación:** La lógica de la consulta (el JOIN) está en un solo lugar
- **Mantenimiento:** Si cambia la estructura de las tablas, solo modificas el procedimiento
- **Seguridad:** Puedes dar permiso para ejecutar el procedimiento sin dar acceso directo a las tablas

### Modo IN OUT - Pasar Y Recibir el Mismo Valor Modificado

**Úsalo cuando:** Necesitas pasarle un valor al procedimiento Y que el procedimiento te devuelva ese MISMO valor pero modificado.

**Analogía:** Es como llevar tu coche al taller:

- Le PASAS tu coche (IN)
- El taller lo modifica/repara
- Te DEVUELVEN el mismo coche pero mejorado (OUT)

#### Ejemplo Simple: Aplicar Descuento

    CREATE OR REPLACE PROCEDURE aplicar_descuento(
        p_precio IN OUT NUMBER,    -- ENTRA con un valor y SALE modificado
        p_descuento IN NUMBER      -- Solo entrada
    )
    IS
    BEGIN
        -- Leer el valor que vino (IN)
        DBMS_OUTPUT.PUT_LINE('  Precio recibido: ' || p_precio || '€');

        -- Modificarlo
        p_precio := p_precio * (1 - p_descuento / 100);

        -- Al terminar, el nuevo valor se "devuelve" automáticamente (OUT)
        DBMS_OUTPUT.PUT_LINE('  Precio con descuento: ' || p_precio || '€');
    END aplicar_descuento;
    /

    -- Uso del procedimiento:
    DECLARE
        v_precio NUMBER := 100;  -- Variable que se modificará
    BEGIN
        DBMS_OUTPUT.PUT_LINE('Precio original: ' || v_precio || '€');

        -- Pasar la variable al procedimiento
        -- Cuando termine, v_precio tendrá el valor modificado
        aplicar_descuento(v_precio, 20);  -- 20% de descuento

        DBMS_OUTPUT.PUT_LINE('Precio final: ' || v_precio || '€');
    END;
    /

    -- Salida:
    -- Precio original: 100€
    --   Precio recibido: 100€
    --   Precio con descuento: 80€
    -- Precio final: 80€

#### Diferencia entre IN OUT y usar IN + OUT separados

**Con IN OUT (un solo parámetro):**

    PROCEDURE aplicar_descuento(p_precio IN OUT NUMBER, ...)

    -- Uso:
    v_precio := 100;
    aplicar_descuento(v_precio, 20);
    -- v_precio ahora vale 80

**Equivalente con IN + OUT separados (dos parámetros):**

    PROCEDURE aplicar_descuento(
        p_precio_original IN NUMBER,
        p_descuento IN NUMBER,
        p_precio_final OUT NUMBER
    )

    -- Uso:
    v_precio_original := 100;
    aplicar_descuento(v_precio_original, 20, v_precio_final);
    -- v_precio_final vale 80, v_precio_original sigue siendo 100

**¿Cuándo usar cada uno?**

- **IN OUT:** Cuando quieres modificar el valor "en su lugar" (como actualizar una variable)
- **IN + OUT separados:** Cuando quieres conservar el valor original Y obtener el nuevo

#### Ejemplo Real: Normalizar Formato de Texto

    CREATE OR REPLACE PROCEDURE normalizar_texto(
        p_texto IN OUT VARCHAR2  -- Entra mal formateado, sale normalizado
    )
    IS
    BEGIN
        -- 1. Eliminar espacios al inicio y final
        p_texto := TRIM(p_texto);

        -- 2. Convertir a mayúsculas la primera letra, resto minúsculas
        p_texto := INITCAP(p_texto);

        -- 3. Reemplazar múltiples espacios por uno solo
        WHILE INSTR(p_texto, '  ') > 0 LOOP
            p_texto := REPLACE(p_texto, '  ', ' ');
        END LOOP;
    END normalizar_texto;
    /

    -- Uso:
    DECLARE
        v_nombre VARCHAR2(100) := '   JUAN    PÉREZ  ';
    BEGIN
        DBMS_OUTPUT.PUT_LINE('Antes: [' || v_nombre || ']');

        normalizar_texto(v_nombre);

        DBMS_OUTPUT.PUT_LINE('Después: [' || v_nombre || ']');
    END;
    /

    -- Salida:
    -- Antes: [   JUAN    PÉREZ  ]
    -- Después: [Juan Pérez]

Resumen de los Tres Modos

| Modo     | Antes de llamar            | Después de llamar       | Uso Típico                           |
|----------|----------------------------|-------------------------|--------------------------------------|
| `IN`     | v = 10                     | v = 10 (sin cambios)    | Pasar datos al procedimiento         |
| `OUT`    | v puede ser cualquier cosa | v = valor nuevo         | Obtener resultados del procedimiento |
| `IN OUT` | v = 10                     | v = modificado (ej: 15) | Modificar un valor existente         |

# Funciones

Una **función** es similar a un procedimiento, pero siempre devuelve un valor mediante la sentencia `RETURN`.

## Sintaxis

    CREATE [OR REPLACE] FUNCTION nombre_funcion
        [(parametro1 [modo] tipo_dato,
          parametro2 [modo] tipo_dato,
          ...)]
    RETURN tipo_dato_retorno
    IS
        -- Declaraciones locales
    BEGIN
        -- Sentencias ejecutables
        RETURN valor;
    EXCEPTION
        -- Manejo de excepciones (opcional)
    END nombre_funcion;
    /

## Diferencias entre Funciones y Procedimientos

| Característica   | Función                      | Procedimiento                      |
|------------------|------------------------------|------------------------------------|
| Valor de retorno | Obligatorio (un solo valor)  | Opcional (mediante parámetros OUT) |
| Sentencia RETURN | Obligatoria                  | No permitida                       |
| Uso en SQL       | Puede usarse en SELECT       | No puede usarse en SELECT          |
| Propósito        | Calcular y devolver un valor | Realizar una acción                |

## Función Simple

    CREATE OR REPLACE FUNCTION obtener_nombre_completo(
        p_nombre VARCHAR2,
        p_apellido VARCHAR2
    )
    RETURN VARCHAR2
    IS
    BEGIN
        RETURN p_nombre || ' ' || p_apellido;
    END obtener_nombre_completo;
    /

    -- Uso en un bloque PL/SQL
    DECLARE
        v_completo VARCHAR2(200);
    BEGIN
        v_completo := obtener_nombre_completo('Juan', 'Pérez');
        DBMS_OUTPUT.PUT_LINE(v_completo);
    END;
    /

    -- Uso en una consulta SQL
    SELECT obtener_nombre_completo(nombre, apellido) AS nombre_completo
    FROM empleados;

## Función para Cálculos

    CREATE OR REPLACE FUNCTION calcular_imc(
        p_peso NUMBER,     -- en kilogramos
        p_altura NUMBER    -- en metros
    )
    RETURN NUMBER
    IS
        v_imc NUMBER;
    BEGIN
        IF p_altura <= 0 THEN
            RAISE_APPLICATION_ERROR(-20001, 'La altura debe ser mayor que 0');
        END IF;

        v_imc := p_peso / (p_altura * p_altura);
        RETURN ROUND(v_imc, 2);
    END calcular_imc;
    /

    -- Uso
    BEGIN
        DBMS_OUTPUT.PUT_LINE('IMC: ' || calcular_imc(70, 1.75));
    END;
    /

## Función con Consulta a la Base de Datos

    CREATE OR REPLACE FUNCTION contar_empleados_dept(
        p_departamento_id NUMBER
    )
    RETURN NUMBER
    IS
        v_cantidad NUMBER;
    BEGIN
        SELECT COUNT(*)
        INTO v_cantidad
        FROM empleados
        WHERE departamento_id = p_departamento_id;

        RETURN v_cantidad;
    END contar_empleados_dept;
    /

    -- Uso en SQL
    SELECT d.nombre,
           contar_empleados_dept(d.departamento_id) AS num_empleados
    FROM departamentos d;

## Función Determinista

Una función `DETERMINISTIC` siempre devuelve el mismo resultado para los mismos parámetros (sin acceder a la BD):

    CREATE OR REPLACE FUNCTION fahrenheit_a_celsius(
        p_fahrenheit NUMBER
    )
    RETURN NUMBER
    DETERMINISTIC
    IS
    BEGIN
        RETURN (p_fahrenheit - 32) * 5 / 9;
    END fahrenheit_a_celsius;
    /

    SELECT fahrenheit_a_celsius(100) AS celsius FROM DUAL;
    -- Resultado: 37.77...

💡 DETERMINISTIC

Marcar una función como `DETERMINISTIC` permite a Oracle optimizar su ejecución al poder cachear resultados.

# Paquetes (Packages)

Un **paquete** es un objeto de base de datos que agrupa procedimientos, funciones, variables, constantes, cursores y tipos relacionados. Los paquetes tienen dos partes:

- **Especificación (Package Specification):** Define la interfaz pública del paquete
- **Cuerpo (Package Body):** Contiene la implementación del código

## Ventajas de los Paquetes

### Modularidad

Agrupa elementos relacionados en una única unidad lógica

### Encapsulación

Oculta detalles de implementación, exponiendo solo la interfaz pública

### Rendimiento

Se carga completamente en memoria la primera vez que se usa

### Mantenimiento

Facilita el mantenimiento al cambiar solo el cuerpo sin afectar la especificación

## Estructura de un Paquete

### 1. Especificación del Paquete

    CREATE OR REPLACE PACKAGE pkg_empleados AS
        -- Constantes públicas
        c_salario_minimo CONSTANT NUMBER := 1000;

        -- Variables públicas (usar con precaución)
        g_contador NUMBER := 0;

        -- Declaración de procedimientos públicos
        PROCEDURE contratar_empleado(
            p_nombre VARCHAR2,
            p_salario NUMBER,
            p_departamento_id NUMBER
        );

        -- Declaración de funciones públicas
        FUNCTION calcular_salario_anual(
            p_empleado_id NUMBER
        ) RETURN NUMBER;

        FUNCTION obtener_total_empleados
        RETURN NUMBER;

    END pkg_empleados;
    /

### 2. Cuerpo del Paquete

    CREATE OR REPLACE PACKAGE BODY pkg_empleados AS

        -- Variables y procedimientos privados (solo visibles dentro del paquete)
        v_ultimo_id NUMBER;

        -- Procedimiento privado (no está en la especificación)
        PROCEDURE validar_salario(p_salario NUMBER) IS
        BEGIN
            IF p_salario < c_salario_minimo THEN
                RAISE_APPLICATION_ERROR(-20001,
                    'El salario no puede ser menor que ' || c_salario_minimo);
            END IF;
        END validar_salario;

        -- Implementación de procedimientos públicos
        PROCEDURE contratar_empleado(
            p_nombre VARCHAR2,
            p_salario NUMBER,
            p_departamento_id NUMBER
        ) IS
            v_nuevo_id NUMBER;
        BEGIN
            -- Validar salario usando procedimiento privado
            validar_salario(p_salario);

            -- Obtener nuevo ID
            SELECT NVL(MAX(empleado_id), 0) + 1
            INTO v_nuevo_id
            FROM empleados;

            -- Insertar empleado
            INSERT INTO empleados (empleado_id, nombre, salario, departamento_id)
            VALUES (v_nuevo_id, p_nombre, p_salario, p_departamento_id);

            g_contador := g_contador + 1;
            v_ultimo_id := v_nuevo_id;

            DBMS_OUTPUT.PUT_LINE('Empleado contratado con ID: ' || v_nuevo_id);
            COMMIT;
        END contratar_empleado;

        -- Implementación de funciones públicas
        FUNCTION calcular_salario_anual(
            p_empleado_id NUMBER
        ) RETURN NUMBER IS
            v_salario_mensual NUMBER;
        BEGIN
            SELECT salario
            INTO v_salario_mensual
            FROM empleados
            WHERE empleado_id = p_empleado_id;

            RETURN v_salario_mensual * 12;
        EXCEPTION
            WHEN NO_DATA_FOUND THEN
                RETURN NULL;
        END calcular_salario_anual;

        FUNCTION obtener_total_empleados
        RETURN NUMBER IS
            v_total NUMBER;
        BEGIN
            SELECT COUNT(*) INTO v_total FROM empleados;
            RETURN v_total;
        END obtener_total_empleados;

    END pkg_empleados;
    /

## Uso del Paquete

    BEGIN
        -- Llamar a procedimiento del paquete
        pkg_empleados.contratar_empleado('María García', 2500, 10);

        -- Usar función del paquete
        DBMS_OUTPUT.PUT_LINE('Total empleados: ' ||
            pkg_empleados.obtener_total_empleados);

        -- Acceder a constante pública
        DBMS_OUTPUT.PUT_LINE('Salario mínimo: ' ||
            pkg_empleados.c_salario_minimo);

        -- Acceder a variable pública
        DBMS_OUTPUT.PUT_LINE('Contador: ' || pkg_empleados.g_contador);
    END;
    /

Estado del Paquete

Las variables de paquete mantienen su valor durante toda la sesión del usuario. Esto permite crear variables "globales" a nivel de sesión.

# Manejo de Excepciones

## ¿Qué es una Excepción?

Una **excepción** es un error que ocurre mientras se ejecuta tu programa.

Sin manejo de excepciones, cuando ocurre un error, tu programa simplemente "EXPLOTA" y se detiene mostrando un mensaje críptico. Con manejo de excepciones, puedes:

- Detectar cuándo ocurre un error
- Decidir qué hacer (mostrar mensaje amigable, intentar otra cosa, registrar el error, etc.)
- Continuar ejecutando el programa de forma controlada

### Ejemplo del Problema

**Sin manejo de excepciones:**

    DECLARE
        v_salario NUMBER;
    BEGIN
        -- Intentar buscar un empleado que no existe
        SELECT salario INTO v_salario
        FROM empleados
        WHERE empleado_id = 9999;  -- Este ID no existe

        DBMS_OUTPUT.PUT_LINE('Salario: ' || v_salario);
    END;
    /

    -- ERROR! ORA-01403: no data found
    -- El programa se detiene abruptamente 💥

**Con manejo de excepciones:**

    DECLARE
        v_salario NUMBER;
    BEGIN
        SELECT salario INTO v_salario
        FROM empleados
        WHERE empleado_id = 9999;

        DBMS_OUTPUT.PUT_LINE('Salario: ' || v_salario);

    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            -- Capturar el error elegantemente
            DBMS_OUTPUT.PUT_LINE('Lo siento, ese empleado no existe');
            DBMS_OUTPUT.PUT_LINE('Por favor, verifica el ID');
    END;
    /

    -- Salida: Lo siento, ese empleado no existe
    --         Por favor, verifica el ID
    -- El programa termina normalmente ✓

### ¿Por qué es Importante Manejar Excepciones?

### Mejor Experiencia de Usuario

Mensajes claros en lugar de códigos de error crípticos

### Programas Más Robustos

El programa no "muere" ante el primer problema

### Facilita Debugging

Puedes registrar errores en logs para analizarlos después

### Recuperación de Errores

Puedes intentar soluciones alternativas cuando algo falla

## Estructura de Manejo de Excepciones

    BEGIN
        -- Código ejecutable
    EXCEPTION
        WHEN nombre_excepcion1 THEN
            -- Manejo del error 1
        WHEN nombre_excepcion2 THEN
            -- Manejo del error 2
        WHEN OTHERS THEN
            -- Manejo de cualquier otra excepción
    END;

## Excepciones Predefinidas

Oracle proporciona excepciones predefinidas para errores comunes:

| Excepción          | Código Error | Descripción                                             |
|--------------------|--------------|---------------------------------------------------------|
| `NO_DATA_FOUND`    | ORA-01403    | SELECT INTO no devolvió filas                           |
| `TOO_MANY_ROWS`    | ORA-01422    | SELECT INTO devolvió más de una fila                    |
| `ZERO_DIVIDE`      | ORA-01476    | División por cero                                       |
| `VALUE_ERROR`      | ORA-06502    | Error de conversión, truncamiento o asignación          |
| `DUP_VAL_ON_INDEX` | ORA-00001    | Intento de insertar un valor duplicado en columna única |
| `INVALID_CURSOR`   | ORA-01001    | Operación inválida sobre cursor                         |
| `INVALID_NUMBER`   | ORA-01722    | Conversión de cadena a número falló                     |
| `LOGIN_DENIED`     | ORA-01017    | Usuario/contraseña inválidos                            |

## Cómo Manejar Excepciones - Paso a Paso

### Sintaxis Básica

    BEGIN
        -- Código normal que puede generar errores

    EXCEPTION
        WHEN nombre_excepcion1 THEN
            -- Qué hacer si ocurre este error específico

        WHEN nombre_excepcion2 THEN
            -- Qué hacer si ocurre este otro error

        WHEN OTHERS THEN
            -- Qué hacer si ocurre cualquier otro error no especificado
    END;

### Flujo de Ejecución

    ┌────────────────────────────────────┐
    │ BEGIN                              │
    │   línea 1                          │
    │   línea 2                          │
    │   línea 3  ← ERROR! Se dispara    │
    │   línea 4  (no se ejecuta)         │
    │   línea 5  (no se ejecuta)         │
    └────────┬───────────────────────────┘
             │ Salta inmediatamente a EXCEPTION
             ↓
    ┌────────────────────────────────────┐
    │ EXCEPTION                          │
    │   WHEN tipo_error THEN             │
    │     [manejo del error]             │
    └────────────────────────────────────┘
             │
             ↓
        Programa termina (con o sin error según manejaste)

⚠️ Importante: El Flujo se Interrumpe

Cuando ocurre una excepción:

1.  La ejecución se DETIENE inmediatamente en la línea del error
2.  Salta a la sección EXCEPTION
3.  Las líneas que seguían al error NO se ejecutan

### Ejemplo Completo y Comentado

    DECLARE
        v_salario NUMBER;
        v_empleado_id NUMBER := 999;
    BEGIN
        DBMS_OUTPUT.PUT_LINE('Buscando empleado ' || v_empleado_id || '...');

        -- Esta línea puede generar varias excepciones diferentes:
        -- - NO_DATA_FOUND si el empleado no existe
        -- - TOO_MANY_ROWS si hay más de un empleado (improbable con ID único)
        SELECT salario INTO v_salario
        FROM empleados
        WHERE empleado_id = v_empleado_id;

        -- Si llegamos aquí, es que NO hubo error
        DBMS_OUTPUT.PUT_LINE('✓ Empleado encontrado');
        DBMS_OUTPUT.PUT_LINE('Salario: ' || v_salario || '€');

    EXCEPTION
        -- Capturar error específico: empleado no existe
        WHEN NO_DATA_FOUND THEN
            DBMS_OUTPUT.PUT_LINE('✗ ERROR: No existe empleado con ID ' || v_empleado_id);
            DBMS_OUTPUT.PUT_LINE('Verifica que el ID sea correcto');

        -- Capturar error específico: múltiples filas
        WHEN TOO_MANY_ROWS THEN
            DBMS_OUTPUT.PUT_LINE('✗ ERROR: La consulta devolvió múltiples resultados');
            DBMS_OUTPUT.PUT_LINE('Esto no debería pasar con un ID único');

        -- Capturar CUALQUIER otro error no previsto
        WHEN OTHERS THEN
            DBMS_OUTPUT.PUT_LINE('✗ ERROR inesperado: ' || SQLERRM);
            DBMS_OUTPUT.PUT_LINE('Código de error: ' || SQLCODE);
    END;
    /

### Ejemplo: División por Cero

    DECLARE
        v_total NUMBER := 100;
        v_cantidad NUMBER := 0;  -- ¡Cero!
        v_promedio NUMBER;
    BEGIN
        DBMS_OUTPUT.PUT_LINE('Calculando promedio...');

        -- Esto generará ZERO_DIVIDE
        v_promedio := v_total / v_cantidad;

        -- Esta línea nunca se ejecuta si v_cantidad es 0
        DBMS_OUTPUT.PUT_LINE('Promedio: ' || v_promedio);

    EXCEPTION
        WHEN ZERO_DIVIDE THEN
            DBMS_OUTPUT.PUT_LINE('✗ ERROR: No se puede dividir por cero');
            DBMS_OUTPUT.PUT_LINE('La cantidad no puede ser 0');
            -- Podrías asignar un valor por defecto:
            v_promedio := 0;
    END;
    /

## Funciones para Manejo de Errores

| Función   | Descripción                                               |
|-----------|-----------------------------------------------------------|
| `SQLCODE` | Devuelve el código numérico del error (0 si no hay error) |
| `SQLERRM` | Devuelve el mensaje de error asociado al código           |

    BEGIN
        -- Código que puede generar errores
        UPDATE empleados SET salario = salario * 1.10;

    EXCEPTION
        WHEN OTHERS THEN
            DBMS_OUTPUT.PUT_LINE('Código de error: ' || SQLCODE);
            DBMS_OUTPUT.PUT_LINE('Mensaje: ' || SQLERRM);
            ROLLBACK;
    END;
    /

## Excepciones Definidas por el Usuario

Puedes declarar tus propias excepciones:

    DECLARE
        -- Declarar excepción personalizada
        e_salario_invalido EXCEPTION;
        v_salario NUMBER := 500;
        c_salario_minimo CONSTANT NUMBER := 1000;
    BEGIN
        -- Validar salario
        IF v_salario < c_salario_minimo THEN
            RAISE e_salario_invalido;  -- Lanzar la excepción
        END IF;

        DBMS_OUTPUT.PUT_LINE('Salario válido: ' || v_salario);

    EXCEPTION
        WHEN e_salario_invalido THEN
            DBMS_OUTPUT.PUT_LINE('Error: El salario debe ser al menos ' ||
                               c_salario_minimo);
    END;
    /

## RAISE_APPLICATION_ERROR

**¿Para qué sirve?** A veces necesitas detener el programa porque detectas que algo está mal según tus reglas de negocio (no solo errores de Oracle).

### Ejemplos de Cuándo Usarlo

- Un salario es negativo (Oracle no lo impide, pero tú sí quieres)
- Un descuento supera el 100%
- Un usuario intenta hacer algo que no tiene permisos para hacer
- Una fecha de fin es anterior a la fecha de inicio

### Sintaxis

    RAISE_APPLICATION_ERROR(código_error, 'mensaje de error');

    -- código_error: DEBE estar entre -20000 y -20999
    -- mensaje: El texto que verá el usuario (máximo 2048 caracteres)

Rango de Códigos de Error

- **-20000 a -20999:** Reservados para TI (errores personalizados de tu aplicación)
- **Otros números:** Usados por Oracle (no los uses)

**Buena práctica:** Documenta qué significa cada código en tu aplicación:

- -20001: Error de validación
- -20002: Recurso no encontrado
- -20003: Permiso denegado
- Etc.

### Ejemplo Simple: Validar Edad

    DECLARE
        v_edad NUMBER := -5;  -- Edad inválida
    BEGIN
        DBMS_OUTPUT.PUT_LINE('Validando edad...');

        -- Validar que la edad sea coherente
        IF v_edad < 0 THEN
            -- ¡Alto! Esto no tiene sentido
            RAISE_APPLICATION_ERROR(-20001,
                'La edad no puede ser negativa. Valor recibido: ' || v_edad);
        END IF;

        IF v_edad > 150 THEN
            RAISE_APPLICATION_ERROR(-20001,
                'La edad no puede superar 150 años. Valor recibido: ' || v_edad);
        END IF;

        -- Si llegamos aquí, la edad es válida
        DBMS_OUTPUT.PUT_LINE('Edad válida: ' || v_edad);
    END;
    /

    -- Error: ORA-20001: La edad no puede ser negativa. Valor recibido: -5

### Ejemplo Real: Procedimiento con Validaciones

    CREATE OR REPLACE PROCEDURE aumentar_salario(
        p_empleado_id NUMBER,
        p_porcentaje NUMBER
    ) IS
        v_salario_actual NUMBER;
        c_porcentaje_max CONSTANT NUMBER := 50;  -- Máximo 50% de aumento
    BEGIN
        -- ═══════════════════════════════════════════════════════════
        -- VALIDACIÓN 1: Porcentaje válido
        -- ═══════════════════════════════════════════════════════════
        IF p_porcentaje < 0 THEN
            RAISE_APPLICATION_ERROR(-20001,
                'El porcentaje no puede ser negativo');
        END IF;

        IF p_porcentaje > c_porcentaje_max THEN
            RAISE_APPLICATION_ERROR(-20001,
                'El porcentaje no puede superar ' || c_porcentaje_max || '%');
        END IF;

        -- ═══════════════════════════════════════════════════════════
        -- VALIDACIÓN 2: Empleado existe
        -- ═══════════════════════════════════════════════════════════
        BEGIN
            SELECT salario INTO v_salario_actual
            FROM empleados
            WHERE empleado_id = p_empleado_id;
        EXCEPTION
            WHEN NO_DATA_FOUND THEN
                -- Transformar la excepción de Oracle en un mensaje personalizado
                RAISE_APPLICATION_ERROR(-20002,
                    'Empleado con ID ' || p_empleado_id || ' no encontrado');
        END;

        -- ═══════════════════════════════════════════════════════════
        -- VALIDACIÓN 3: Salario actual válido
        -- ═══════════════════════════════════════════════════════════
        IF v_salario_actual <= 0 THEN
            RAISE_APPLICATION_ERROR(-20003,
                'El empleado tiene un salario inválido en la base de datos');
        END IF;

        -- ═══════════════════════════════════════════════════════════
        -- Todo validado → Aplicar el aumento
        -- ═══════════════════════════════════════════════════════════
        UPDATE empleados
        SET salario = salario * (1 + p_porcentaje / 100)
        WHERE empleado_id = p_empleado_id;

        DBMS_OUTPUT.PUT_LINE('✓ Aumento aplicado correctamente');
        DBMS_OUTPUT.PUT_LINE('Salario anterior: ' || v_salario_actual || '€');
        DBMS_OUTPUT.PUT_LINE('Nuevo salario: ' ||
            (v_salario_actual * (1 + p_porcentaje / 100)) || '€');

        COMMIT;
    END aumentar_salario;
    /

    -- Pruebas:
    BEGIN
        aumentar_salario(100, 10);   -- ✓ OK
        aumentar_salario(100, -5);   -- ✗ ERROR -20001: porcentaje negativo
        aumentar_salario(100, 80);   -- ✗ ERROR -20001: porcentaje muy alto
        aumentar_salario(9999, 10);  -- ✗ ERROR -20002: empleado no existe
    END;
    /

💡 RAISE_APPLICATION_ERROR vs EXCEPTION

**¿Cuándo usar cada uno?**

**EXCEPTION:** Para CAPTURAR errores que ya ocurrieron

    BEGIN
        SELECT ... -- Esto puede fallar
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            -- Reaccionar al error
    END;

**RAISE_APPLICATION_ERROR:** Para GENERAR un error cuando TÚ detectas algo malo

    IF salario < 0 THEN
        RAISE_APPLICATION_ERROR(-20001, 'Salario inválido');
    END IF;

Puedes combinarlos:

    BEGIN
        SELECT ...
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            -- Capturar el error de Oracle y lanzar el tuyo personalizado
            RAISE_APPLICATION_ERROR(-20002, 'Cliente no encontrado');
    END;

## Propagación de Excepciones

Si una excepción no se maneja en un bloque, se propaga al bloque exterior:

    BEGIN
        -- Bloque exterior
        DBMS_OUTPUT.PUT_LINE('Inicio bloque exterior');

        BEGIN
            -- Bloque interior
            DBMS_OUTPUT.PUT_LINE('Inicio bloque interior');

            -- Esto generará una excepción
            DECLARE
                v_resultado NUMBER;
            BEGIN
                v_resultado := 10 / 0;  -- División por cero
            END;

        EXCEPTION
            WHEN ZERO_DIVIDE THEN
                DBMS_OUTPUT.PUT_LINE('Error en bloque interior: División por cero');
                RAISE;  -- Re-lanzar la excepción al bloque exterior
        END;

        DBMS_OUTPUT.PUT_LINE('Esta línea no se ejecutará');

    EXCEPTION
        WHEN ZERO_DIVIDE THEN
            DBMS_OUTPUT.PUT_LINE('Error capturado en bloque exterior');
    END;
    /

⚠️ WHEN OTHERS

Usa `WHEN OTHERS` con precaución y siempre al final. Captura cualquier excepción no manejada explícitamente.

# Triggers (Disparadores)

## ¿Qué es un Trigger?

Un **trigger** (disparador) es un bloque de código PL/SQL que se ejecuta **automáticamente** cuando ocurre un evento específico en una tabla.

### Analogía del Mundo Real

Imagina una alarma de tu casa:

- **Evento:** Alguien abre la puerta
- **Acción automática:** La alarma suena
- Tú no activaste la alarma manualmente, se disparó sola cuando ocurrió el evento

Los triggers funcionan igual en la base de datos:

- **Evento:** Se inserta/actualiza/elimina una fila en una tabla
- **Acción automática:** Se ejecuta el código del trigger
- Nadie llamó al trigger, Oracle lo ejecuta automáticamente

### ¿Para Qué Sirven los Triggers?

### Auditoría

Registrar quién modificó qué y cuándo automáticamente

### Validación

Asegurar que los datos cumplen reglas de negocio complejas

### Sincronización

Mantener tablas relacionadas actualizadas automáticamente

### Seguridad

Prevenir cambios no autorizados o en horarios específicos

### Cálculos Automáticos

Actualizar totales, contadores, estadísticas automáticamente

### Prevención

Impedir operaciones que violarían reglas de negocio

### Ejemplos del Mundo Real

| Situación                                  | Sin Trigger                                                                    | Con Trigger                                                   |
|--------------------------------------------|--------------------------------------------------------------------------------|---------------------------------------------------------------|
| Auditar cambios de salario                 | Cada desarrollador debe recordar escribir en la tabla de auditoría (se olvida) | El trigger lo hace automáticamente siempre                    |
| Actualizar stock al vender                 | Código manual para restar del inventario (puede olvidarse)                     | Al insertar venta, el trigger actualiza stock automáticamente |
| Prevenir eliminaciones los fines de semana | Confiar en que nadie ejecutará DELETE en sábado/domingo                        | El trigger bloquea DELETE automáticamente si es fin de semana |

⚠️ Cuidado con los Triggers

Los triggers son potentes pero tienen riesgos:

- **"Magia invisible":** Código que se ejecuta sin que lo veas, difícil de debuggear
- **Rendimiento:** Se ejecutan en CADA operación, pueden ralentizar la BD
- **Complejidad:** Triggers que disparan otros triggers pueden ser difíciles de entender

**Regla:** Úsalos solo cuando realmente lo necesites. Si puedes lograr lo mismo con constraints o código de aplicación, mejor.

## Tipos de Triggers

Hay que tomar dos decisiones al crear un trigger:

1.  **¿CUÁNDO?** (BEFORE, AFTER o INSTEAD OF)
2.  **¿CUÁNTAS VECES?** (Una por sentencia o una por cada fila)

### 1. CUÁNDO - Momento de Ejecución

| Tipo         | Se Ejecuta...                                     | Úsalo Para...                                           | Ejemplo                                            |
|--------------|---------------------------------------------------|---------------------------------------------------------|----------------------------------------------------|
| `BEFORE`     | ANTES de que se ejecute el INSERT/UPDATE/DELETE   | Validar o modificar datos ANTES de guardarlos           | Convertir email a minúsculas antes de insertar     |
| `AFTER`      | DESPUÉS de que se ejecutó el INSERT/UPDATE/DELETE | Auditoría, registrar el cambio, actualizar otras tablas | Registrar en tabla de auditoría quién modificó qué |
| `INSTEAD OF` | EN LUGAR de la operación (solo para vistas)       | Hacer que las vistas sean actualizables                 | Permitir INSERT en una vista compleja con JOIN     |

#### Visualización del Flujo

    UPDATE empleados SET salario = 3000 WHERE empleado_id = 100;
                    ↓
            ┌───────────────┐
            │ BEFORE Trigger│  ← Ejecuta aquí (puede modificar 3000 a otro valor)
            └───────┬───────┘
                    ↓
            ┌───────────────┐
            │ Ejecutar      │  ← Oracle ejecuta el UPDATE real
            │ UPDATE        │
            └───────┬───────┘
                    ↓
            ┌───────────────┐
            │ AFTER Trigger │  ← Ejecuta aquí (el UPDATE ya ocurrió)
            └───────────────┘

### 2. CUÁNTAS VECES - Nivel de Ejecución

<table class="data-table">
<colgroup>
<col style="width: 25%" />
<col style="width: 25%" />
<col style="width: 25%" />
<col style="width: 25%" />
</colgroup>
<thead>
<tr class="header">
<th>Nivel</th>
<th>Se Ejecuta...</th>
<th>Sintaxis</th>
<th>Ejemplo</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td><strong>Statement</strong><br />
(Sentencia)</td>
<td>UNA vez por cada sentencia SQL, sin importar cuántas filas afecte</td>
<td>(por defecto, sin <code>FOR EACH ROW</code>)</td>
<td>Registrar "Se actualizaron salarios" (sin detalles de cada fila)</td>
</tr>
<tr class="even">
<td><strong>Row</strong><br />
(Fila)</td>
<td>UNA vez POR CADA fila afectada</td>
<td>Con <code>FOR EACH ROW</code></td>
<td>Validar CADA salario individualmente antes de actualizar</td>
</tr>
</tbody>
</table>

#### Ejemplo de la Diferencia

    -- Sentencia que afecta 100 filas:
    UPDATE empleados SET salario = salario * 1.10 WHERE departamento_id = 10;

    ┌─────────────────────────┬───────────────────────────┐
    │  Statement-level        │  Row-level (FOR EACH ROW) │
    ├─────────────────────────┼───────────────────────────┤
    │  Se ejecuta 1 vez       │  Se ejecuta 100 veces     │
    │  (una por la sentencia) │  (una por cada fila)      │
    └─────────────────────────┴───────────────────────────┘

### Combinaciones Posibles

| Combinación             | Cuándo Usarlo                                                   |
|-------------------------|-----------------------------------------------------------------|
| `BEFORE + FOR EACH ROW` | Validar o modificar datos de CADA fila ANTES de guardarlos      |
| `AFTER + FOR EACH ROW`  | Auditoría detallada: registrar cambio de CADA fila              |
| `BEFORE + Statement`    | Validación general antes de cualquier cambio (raro)             |
| `AFTER + Statement`     | Registrar que SE HIZO una operación (sin detalles de cada fila) |

## Sintaxis Básica

    CREATE [OR REPLACE] TRIGGER nombre_trigger
    {BEFORE | AFTER | INSTEAD OF}
    {INSERT | UPDATE | DELETE}
    [OR {INSERT | UPDATE | DELETE}]
    ON nombre_tabla
    [FOR EACH ROW]
    [WHEN (condición)]
    BEGIN
        -- Código del trigger
    END;
    /

## Ejemplos Prácticos de Triggers

### Entendiendo :NEW y :OLD

En los triggers de fila (`FOR EACH ROW`), tienes acceso a dos "registros" especiales que representan los datos:

| Registro | Qué Contiene                                                              | Disponible en... |
|----------|---------------------------------------------------------------------------|------------------|
| `:NEW`   | Los valores NUEVOS que se van a insertar o con los que se va a actualizar | INSERT, UPDATE   |
| `:OLD`   | Los valores ANTIGUOS que tenía la fila antes del cambio                   | UPDATE, DELETE   |

#### Visualización de :NEW y :OLD

    -- ANTES del UPDATE:
    empleado_id | nombre | salario
         100    |  Ana   |  2000

    -- Ejecutas:
    UPDATE empleados SET salario = 2500 WHERE empleado_id = 100;

    -- En el trigger BEFORE UPDATE FOR EACH ROW:
    :OLD.empleado_id → 100     :NEW.empleado_id → 100
    :OLD.nombre      → 'Ana'   :NEW.nombre      → 'Ana'
    :OLD.salario     → 2000    :NEW.salario     → 2500  ← Cambió!

    -- DESPUÉS del UPDATE (si el trigger no lo impide):
    empleado_id | nombre | salario
         100    |  Ana   |  2500

✏Puedes MODIFICAR :NEW en BEFORE

En triggers `BEFORE FOR EACH ROW` puedes **cambiar** los valores de `:NEW` antes de que se guarden:

    :NEW.nombre := UPPER(:NEW.nombre);  -- Convertir a mayúsculas
    :NEW.fecha_modificacion := SYSDATE;  -- Poner fecha actual

¡Esto modifica los datos que se van a guardar!

### Ejemplo 1: BEFORE INSERT - Validar y Normalizar Datos

    CREATE OR REPLACE TRIGGER trg_validar_empleado
    BEFORE INSERT OR UPDATE ON empleados
    FOR EACH ROW
    DECLARE
        c_salario_minimo CONSTANT NUMBER := 1000;
    BEGIN
        DBMS_OUTPUT.PUT_LINE('→ Trigger ejecutándose...');

        -- ═══════════════════════════════════════════════════════════
        -- VALIDACIÓN: Salario no puede ser menor que el mínimo
        -- ═══════════════════════════════════════════════════════════
        IF :NEW.salario < c_salario_minimo THEN
            -- ¡DETENER! Rechazar la operación
            RAISE_APPLICATION_ERROR(-20001,
                'ERROR: El salario no puede ser menor que ' || c_salario_minimo ||
                '€. Salario recibido: ' || :NEW.salario || '€');
        END IF;

        -- ═══════════════════════════════════════════════════════════
        -- NORMALIZACIÓN: Convertir nombre a formato estándar
        -- ═══════════════════════════════════════════════════════════
        -- INITCAP: Primera letra mayúscula, resto minúsculas
        :NEW.nombre := INITCAP(TRIM(:NEW.nombre));

        -- Ejemplo: "  JUAN pérez  " → "Juan Pérez"

        -- ═══════════════════════════════════════════════════════════
        -- AUTO-RELLENAR: Fecha de modificación
        -- ═══════════════════════════════════════════════════════════
        :NEW.fecha_modificacion := SYSDATE;

        -- ═══════════════════════════════════════════════════════════
        -- AUTO-RELLENAR: Email si está vacío
        -- ═══════════════════════════════════════════════════════════
        IF :NEW.email IS NULL THEN
            -- Generar email automáticamente: nombre@empresa.com
            :NEW.email := LOWER(REPLACE(:NEW.nombre, ' ', '.')) || '@empresa.com';
        END IF;

        DBMS_OUTPUT.PUT_LINE('✓ Validación completada');
    END trg_validar_empleado;
    /

    -- Probar el trigger:
    INSERT INTO empleados (empleado_id, nombre, salario)
    VALUES (200, '  MARÍA  garcía  ', 2500);

    -- ¿Qué pasa?
    -- 1. nombre se normaliza → "María García"
    -- 2. fecha_modificacion se rellena con SYSDATE
    -- 3. email se genera → "maría.garcía@empresa.com"
    -- 4. Se guarda en la BD

    -- Intento con salario inválido:
    INSERT INTO empleados (empleado_id, nombre, salario)
    VALUES (201, 'Pedro', 500);
    -- ERROR: ORA-20001: El salario no puede ser menor que 1000€

### Ejemplo 2: AFTER UPDATE - Auditoría de Cambios

    -- Primero, crear tabla de auditoría
    CREATE TABLE auditoria_salarios (
        auditoria_id NUMBER PRIMARY KEY,
        empleado_id NUMBER,
        nombre_empleado VARCHAR2(100),
        salario_anterior NUMBER,
        salario_nuevo NUMBER,
        diferencia NUMBER,
        usuario VARCHAR2(50),
        fecha TIMESTAMP DEFAULT SYSTIMESTAMP
    );

    CREATE SEQUENCE seq_auditoria;

    -- Trigger que registra cambios de salario
    CREATE OR REPLACE TRIGGER trg_auditar_salario
    AFTER UPDATE OF salario ON empleados  -- Solo cuando cambia el salario
    FOR EACH ROW
    WHEN (OLD.salario != NEW.salario)     -- Solo si realmente cambió
    BEGIN
        -- Registrar el cambio en la tabla de auditoría
        INSERT INTO auditoria_salarios (
            auditoria_id,
            empleado_id,
            nombre_empleado,
            salario_anterior,
            salario_nuevo,
            diferencia,
            usuario
        ) VALUES (
            seq_auditoria.NEXTVAL,
            :NEW.empleado_id,
            :NEW.nombre,
            :OLD.salario,           -- Valor ANTES del cambio
            :NEW.salario,           -- Valor DESPUÉS del cambio
            :NEW.salario - :OLD.salario,  -- Cuánto cambió
            USER                    -- Quién hizo el cambio
        );

        DBMS_OUTPUT.PUT_LINE('✓ Cambio de salario registrado en auditoría');
    END trg_auditar_salario;
    /

    -- Probar:
    UPDATE empleados SET salario = 3000 WHERE empleado_id = 100;

    -- Consultar auditoría:
    SELECT empleado_id, nombre_empleado,
           salario_anterior, salario_nuevo, diferencia,
           usuario, TO_CHAR(fecha, 'DD/MM/YYYY HH24:MI:SS') AS cuando
    FROM auditoria_salarios
    ORDER BY fecha DESC;

## Trigger AFTER de Sentencia

Ejemplo: Auditoría de cambios:

    -- Tabla de auditoría
    CREATE TABLE auditoria_empleados (
        auditoria_id NUMBER PRIMARY KEY,
        usuario VARCHAR2(50),
        fecha TIMESTAMP,
        operacion VARCHAR2(10),
        num_filas NUMBER
    );

    CREATE SEQUENCE seq_auditoria;

    -- Trigger de auditoría
    CREATE OR REPLACE TRIGGER trg_auditoria_empleados
    AFTER INSERT OR UPDATE OR DELETE ON empleados
    DECLARE
        v_operacion VARCHAR2(10);
    BEGIN
        -- Determinar tipo de operación
        IF INSERTING THEN
            v_operacion := 'INSERT';
        ELSIF UPDATING THEN
            v_operacion := 'UPDATE';
        ELSIF DELETING THEN
            v_operacion := 'DELETE';
        END IF;

        -- Registrar en tabla de auditoría
        INSERT INTO auditoria_empleados
        VALUES (seq_auditoria.NEXTVAL,
                USER,
                SYSTIMESTAMP,
                v_operacion,
                SQL%ROWCOUNT);
    END;
    /

## Trigger con Predicados Condicionales

    CREATE OR REPLACE TRIGGER trg_log_cambios
    AFTER INSERT OR UPDATE OR DELETE ON empleados
    FOR EACH ROW
    BEGIN
        IF INSERTING THEN
            DBMS_OUTPUT.PUT_LINE('Nuevo empleado: ' || :NEW.nombre);

        ELSIF UPDATING THEN
            DBMS_OUTPUT.PUT_LINE('Actualizado: ' || :OLD.nombre);

            IF :OLD.salario != :NEW.salario THEN
                DBMS_OUTPUT.PUT_LINE('Salario cambió de ' ||
                                   :OLD.salario || ' a ' || :NEW.salario);
            END IF;

        ELSIF DELETING THEN
            DBMS_OUTPUT.PUT_LINE('Empleado eliminado: ' || :OLD.nombre);
        END IF;
    END;
    /

## Trigger con Cláusula WHEN

Filtrar qué filas activan el trigger:

    CREATE OR REPLACE TRIGGER trg_salario_alto
    BEFORE UPDATE OF salario ON empleados
    FOR EACH ROW
    WHEN (NEW.salario > 5000)
    BEGIN
        DBMS_OUTPUT.PUT_LINE('ALERTA: Salario alto asignado a ' || :NEW.nombre);

        -- Podría enviar una notificación, registrar en log, etc.
        INSERT INTO log_salarios_altos (empleado_id, salario, fecha)
        VALUES (:NEW.empleado_id, :NEW.salario, SYSDATE);
    END;
    /

## Gestión de Triggers

### Deshabilitar/Habilitar Triggers

    -- Deshabilitar un trigger específico
    ALTER TRIGGER trg_validar_salario DISABLE;

    -- Habilitar un trigger
    ALTER TRIGGER trg_validar_salario ENABLE;

    -- Deshabilitar todos los triggers de una tabla
    ALTER TABLE empleados DISABLE ALL TRIGGERS;

    -- Habilitar todos los triggers de una tabla
    ALTER TABLE empleados ENABLE ALL TRIGGERS;

### Eliminar un Trigger

    DROP TRIGGER trg_validar_salario;

⚠️ Limitaciones de los Triggers

- No pueden contener sentencias COMMIT, ROLLBACK o SAVEPOINT
- No pueden declarar variables de tipo LONG o LONG RAW
- Cuidado con triggers mutuamente activables (recursión)
- Los triggers de fila no pueden consultar o modificar la tabla que los activó (tabla mutante)

<a href="#top" class="backtotop" aria-label="Volver arriba">↑</a>

<a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="noopener noreferrer" title="CC BY-NC-SA 4.0"><img src="https://i.creativecommons.org/l/by-nc-sa/4.0/88x31.png" alt="Licencia Creative Commons BY-NC-SA 4.0" /></a>

