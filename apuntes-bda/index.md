> Fuente: https://dexpositofp.github.io/docencia/BDA/index.html (descargado el 13/11/2026)

# Bases de Datos — Guía de la asignatura (1º DAW)

En esta página encontrarás una visión global del módulo: objetivos, contenidos, metodología de trabajo y criterios de evaluación. Desde aquí enlazamos a cada tema (diseño lógico, modelo relacional, SQL y NoSQL).

## Objetivos de la asignatura

El objetivo principal de este módulo es proporcionar al alumnado los conocimientos y habilidades necesarios para diseñar, implementar y gestionar bases de datos en el contexto del desarrollo de aplicaciones web, con un **enfoque integrador** que conecta todos los módulos de 1º DAW.

Los contenidos están **muy orientados al campo de la programación**, priorizando el desarrollo de competencias prácticas que permitan al alumnado trabajar en proyectos reales desde el inicio del curso, integrando bases de datos con programación, lenguajes de marcas, entornos de desarrollo y sistemas informáticos.

**Enfoque integrador:** Este módulo no se trabaja de forma aislada. Cada concepto, proyecto y práctica se diseña para complementar y reforzar el aprendizaje de los demás módulos del ciclo, preparándote para desarrollar aplicaciones web completas y funcionales.

## 1. Competencias

Al finalizar este módulo, serás capaz de:

- **Diseñar modelos de datos** a partir de requisitos funcionales de aplicaciones web reales.
- **Aplicar el modelo relacional** en el diseño lógico y normalizarlo adecuadamente.
- **Implementar bases de datos** usando SQL en sus distintas vertientes (DDL, DML, DCL, TCL).
- **Desarrollar procedimientos almacenados y triggers** en PL/SQL para automatizar lógica de negocio.
- **Integrar bases de datos relacionales y NoSQL** en aplicaciones web completas.
- **Trabajar con diferentes SGBD** (MySQL, PostgreSQL, MongoDB, Redis) según las necesidades del proyecto.
- **Conectar bases de datos con aplicaciones Java**, desarrollando habilidades de integración entre persistencia y lógica de negocio.
- **Colaborar en proyectos integradores** que combinan bases de datos con los demás módulos del ciclo.

## 2. Contenidos

El módulo se estructura en los siguientes bloques temáticos, que se trabajan de forma **iterativa y progresiva** a lo largo de todo el curso:

1.  **Almacenamiento de la información**
    - Ficheros vs Bases de Datos
    - Sistemas Gestores de Bases de Datos (SGBD)
    - Tipos de SGBD: relacionales y NoSQL
2.  **Diseño conceptual**
    - Modelo Entidad-Relación (E/R) - Notación Chen
    - Diagrama de Clases UML
    - Cardinalidades y multiplicidades
3.  **Diseño lógico**
    - Modelo relacional
    - Transformación E/R → Tablas
    - Normalización (1FN, 2FN, 3FN, BCNF)
4.  **SQL: Lenguaje de consulta estructurado**
    - DDL: Definición de datos (CREATE, ALTER, DROP)
    - DML: Manipulación de datos (SELECT, INSERT, UPDATE, DELETE)
    - DCL: Control de acceso (GRANT, REVOKE)
    - TCL: Transacciones (COMMIT, ROLLBACK)
5.  **PL/SQL: Programación en base de datos**
    - Procedimientos almacenados
    - Funciones
    - Triggers (disparadores)
    - Cursores y excepciones
6.  **Bases de datos NoSQL**
    - Bases de datos documentales (MongoDB)
    - Bases de datos clave-valor (Redis)
    - Bases de datos columnares (Cassandra)
    - Bases de datos de grafos (Neo4j)
    - Arquitecturas híbridas (Polyglot Persistence)

**Nota importante:** Estos contenidos no se imparten de forma secuencial y aislada. Desde la **primera evaluación**, se trabajan **conceptos básicos de todos los Resultados de Aprendizaje (RAs)** para que puedas comenzar a desarrollar proyectos completos cuanto antes, integrando bases de datos con las tecnologías que estás aprendiendo en los demás módulos.

## 3. Metodología

### Enfoque práctico y orientado a proyectos

Este módulo sigue una metodología **eminentemente práctica**, donde la teoría se introduce de forma progresiva y siempre aplicada a casos reales de desarrollo web. El objetivo es que puedas trabajar en proyectos funcionales desde el inicio del curso.

### Estructura temporal por evaluaciones

#### Primera Evaluación: Fundamentos y base para proyectos

Durante la primera evaluación se presentarán **contenidos mínimos de todos los Resultados de Aprendizaje (RAs)** del módulo. Esto significa que verás:

- Conceptos básicos de diseño de bases de datos (E/R y modelo relacional)
- SQL fundamental (CREATE, SELECT, INSERT, UPDATE, DELETE, JOIN)
- Introducción a PL/SQL (procedimientos básicos)
- Primeros pasos con NoSQL (MongoDB básico)
- Conexión desde lenguajes de programación

**El objetivo** es que, al finalizar la primera evaluación, dispongas de las herramientas necesarias para **comenzar a trabajar en proyectos integradores** con todos los módulos del curso.

#### Segunda Evaluación: Profundización y primer proyecto

Se profundiza en todos los RAs trabajados en la primera evaluación, añadiendo:

- Diseño avanzado (normalización, restricciones complejas)
- SQL avanzado (subconsultas, vistas, transacciones)
- PL/SQL completo (triggers, funciones, cursores)
- NoSQL: diferentes tipos de bases de datos
- Optimización y rendimiento

Desarrollarás un **proyecto práctico** que integra bases de datos con programación y tecnologías web.

#### Tercera Evaluación: Proyecto integrador final

La tercera evaluación se centra exclusivamente en el desarrollo de un **proyecto integrador completo** que combina todos los módulos de 1º DAW:

- Bases de Datos (diseño, implementación, optimización)
- Programación (Java)
- Lenguajes de Marcas (HTML, CSS, XML, JSON)
- Entornos de Desarrollo (Git, testing, documentación)
- Sistemas Informáticos (despliegue, configuración)

### Trabajo con proyectos

**Validación con el equipo educativo:** Todos los proyectos deberán ser **presentados y validados con el equipo educativo completo** antes de su entrega final. Esto asegura que el proyecto cumple con los requisitos de todos los módulos y permite detectar y corregir problemas de forma temprana.

### Todos los RAs en todas las evaluaciones

A diferencia de un enfoque secuencial tradicional, en este módulo se trabajan **todos los Resultados de Aprendizaje en todas las evaluaciones**, pero con diferentes niveles de profundidad:

- **1ª Eval:** Conceptos básicos de todos los RAs
- **2ª Eval:** Profundización en todos los RAs + proyecto
- **3ª Eval:** Dominio avanzado aplicado al proyecto integrador

Esta metodología espiral permite consolidar conocimientos, detectar carencias de forma temprana y mantener la motivación al trabajar en proyectos reales desde el principio.

### Actividades de aprendizaje

- **Sesiones prácticas:** Ejercicios guiados y laboratorio con SGBD reales
- **Desarrollo de proyectos:** Individuales y en equipo
- **Presentaciones:** Exposición de proyectos ante el equipo educativo
- **Resolución de problemas:** Casos reales de diseño y optimización
- **Trabajo colaborativo:** Uso de Git y metodologías ágiles

## 4. Evaluación

La evaluación está diseñada para ser **progresiva y acumulativa**, valorando tanto los conocimientos teóricos como las competencias prácticas adquiridas a lo largo del curso.

### Criterios de evaluación por evaluación

<table>
<colgroup>
<col style="width: 25%" />
<col style="width: 25%" />
<col style="width: 25%" />
<col style="width: 25%" />
</colgroup>
<thead>
<tr class="header">
<th>Evaluación</th>
<th>Instrumentos</th>
<th>Peso</th>
<th>Descripción</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td><strong>1ª Evaluación</strong></td>
<td>Prueba objetiva</td>
<td><strong>100%</strong></td>
<td>Examen que evalúa los <strong>contenidos mínimos de todos los RAs</strong> trabajados durante el trimestre: diseño básico, SQL fundamental, introducción a PL/SQL y NoSQL, conexión desde código.</td>
</tr>
<tr class="even">
<td><strong>2ª Evaluación</strong></td>
<td>• Prueba objetiva<br />
• Proyecto práctico</td>
<td><strong>20%</strong><br />
<strong>80%</strong></td>
<td><strong>Prueba objetiva (20%):</strong> Examen de conocimientos teórico-prácticos sobre los contenidos profundizados.<br />
<br />
<strong>Proyecto (80%):</strong> Desarrollo de una aplicación web completa que integra base de datos (diseño, implementación, consultas, procedimientos) con programación y tecnologías web. Presentación y validación con el equipo educativo.</td>
</tr>
<tr class="odd">
<td><strong>3ª Evaluación</strong></td>
<td>Proyecto integrador</td>
<td><strong>100%</strong></td>
<td>Proyecto final que integra <strong>todos los módulos de 1º DAW</strong>. La nota de Bases de Datos depende del diseño, implementación y gestión de la base de datos del proyecto, así como de su correcta integración con el resto de componentes. Requiere presentación y defensa ante el equipo educativo completo.</td>
</tr>
</tbody>
</table>

### Cálculo de la nota final del módulo

La **nota final del curso** se calculará de la siguiente manera:

- **20% - Media de las pruebas objetivas:** Se hará la media aritmética de todas las pruebas objetivas realizadas a lo largo del curso (1ª evaluación + 2ª evaluación).
- **80% - Proyecto final:** El proyecto integrador de la 3ª evaluación, que incluye el proyecto de la 2ª evaluación mejorado y ampliado con la integración de todos los módulos.

**Fórmula:** Nota Final = (Media Pruebas Objetivas × 0.20) + (Proyecto Final × 0.80)

Este sistema de evaluación refuerza el enfoque práctico del módulo, dando mayor peso al desarrollo de competencias aplicadas en proyectos reales, mientras se mantiene la verificación de conocimientos teóricos a través de las pruebas objetivas.

**⚠️ ¡A tener en cuenta!**  
Para cada prueba que se realice (tanto pruebas objetivas como proyectos), se os puede pedir **en cualquier momento una prueba de validación** para verificar el trabajo realizado. Si no se supera dicha prueba de validación, la prueba o proyecto correspondiente se calificará con **0**.  
  
Esta medida garantiza que el trabajo presentado es realmente vuestro y que habéis adquirido las competencias evaluadas.

**Consejo:** El proyecto integrador de la 3ª evaluación es la culminación de todo el aprendizaje del curso. Comienza a planificarlo desde la 1ª evaluación y solicita validaciones periódicas con el equipo educativo para asegurar que vas por buen camino.

### Resultados de Aprendizaje (RAs) evaluados

Todos los RAs del módulo se trabajan y evalúan en las tres evaluaciones, con diferente nivel de profundidad. La evaluación verifica el logro de estos RAs de forma progresiva a lo largo del curso.

<a href="#top" class="backtotop" aria-label="Volver arriba">↑</a>

<a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="noopener noreferrer" title="CC BY-NC-SA 4.0"><img src="https://i.creativecommons.org/l/by-nc-sa/4.0/88x31.png" alt="Licencia Creative Commons BY-NC-SA 4.0" /></a>

