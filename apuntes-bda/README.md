# Apuntes de la web de BDA (descarga completa)

Descargado el **13/11/2026** de https://dexpositofp.github.io/docencia/BDA/index.html.

La web no se puede abrir desde el entorno donde se hizo la descarga, así que se bajó de su **código fuente**, que es lo que publica GitHub Pages: el repositorio público `dexpositofp/docencia`, rama `main`, carpeta `BDA/`. Se siguieron todos los enlaces internos (páginas, hoja de estilos e imágenes).

## Qué hay

| Archivo | Tema | Original |
|---|---|---|
| `index.md` | Guía de la asignatura: objetivos, contenidos, metodología y evaluación | `index.html` |
| `almacenamiento.md` | Datos e información, ficheros, SGBD, relacional, ACID, NoSQL y CAP | `almacenamiento.html` |
| `conceptual.md` | Modelo E/R (Chen con (min,max)) y diagrama de clases UML | `conceptual.html` |
| `logico.md` | Notación de marco, paso a tablas, políticas de FK y normalización | `logico.html` |
| `sql.md` | DDL, DML (consultas y CRUD), DCL y TCL en MySQL | `sql.html` |
| `plsql.md` | PL/SQL: bloques, cursores, procedimientos, funciones, excepciones y triggers | `plsql.html` |
| `00-apuntes-completos.md` | Los seis anteriores en un solo archivo | |
| `img/` | Las 23 imágenes de los diagramas | `img/` |

El HTML original, sin tocar, está en `../web-original/`.

## Lo que la web enlaza pero no existe

El menú tiene **Persistencia** (`persistencia.html`) y **NoSQL** (`nosql.html`), pero esas dos páginas dan **404**: todavía no están publicadas. Lo de NoSQL que sí hay está dentro de `almacenamiento.md` (apartado 6).

## ⚠ Ojo: la web no es coherente con dónde va el (min,max)

- **Los dibujos** (todas las imágenes de `img/`) ponen el par **pegado a la entidad de la que se cuentan cuántas**. Ejemplo: en *Departamento — tiene — Empleado*, el `(1,N)` está junto a **Empleado** porque un departamento tiene de 1 a N empleados, y el `(1,1)` junto a **Departamento** porque cada empleado tiene exactamente 1 departamento.
- **Algunos textos** dicen lo contrario ("Departamento (1,N) — tiene — Empleado (1,1)") y en `logico.md` (4.1.1 y 4.2.1) la explicación de cuándo la FK es `VNN` no cuadra con su propio dibujo.

**Qué hacer en el examen:** al lado de cada par escribe la frase ("cada pedido tiene exactamente 1 cliente"). Así está bien lo lea el profe como lo lea. Y para decidir el `VNN` de una FK no mires el número, pregúntate: **¿puede existir un PEDIDO sin CLIENTE?** Si no puede, `VNN(cliente_id)`.
