# Bases de Datos (1º DAW)

Mismo método que en Sistemas Informáticos: un juego de estudio en un solo HTML y un repaso por rondas.

## Cómo estudiar

1. **`BDA-QUEST.html`**: ábrelo en el navegador (funciona sin internet y se puede pasar por WhatsApp).
   - **Examen de prueba (3 partes)**, con el formato del examen:
     1. **E/R:** poner los (min,max) de cada relación a partir de las reglas.
     2. **Paso a tablas:** marcar CP, C.Alt, C.Aj y VNN de cada columna. La sintaxis no cuenta, cuentan las claves.
     3. **Validar el DDL contra el enunciado:** tocar las líneas mal y escribir **por qué**, en campo libre.
   - **Temas** con teoría y un **truco** por bloque, y una ronda de 10 preguntas por tema.
   - **Repasar fallos**: cada pregunta fallada vuelve hasta que la aciertes 2 veces seguidas.
   - **Chuleta de trucos** imprimible y **progreso** por tema.
2. **`repaso-bda.md`**: teoría resumida, preguntas por rondas sin solución y las soluciones al final. Para seguir con Claude en otra sesión: pega el documento y escribe "sigo".
3. **`preparacion-examen/`**: guía, examen de práctica y soluciones (la Parte 3.A, corregida).

## Material

- **`apuntes-bda/`**: la web completa del profe (https://dexpositofp.github.io/docencia/BDA/) en Markdown, con sus imágenes. Su `README.md` explica de dónde sale y qué páginas faltan.
- **`web-original/`**: el HTML original de la web, sin tocar.
- Boletines (PDF), scripts SQL (`huertos`, `ciclismo`, `instituto`) y el DER del huerto.

## Editar el juego

El contenido está en `bda-quest-src/`:

| Archivo | Qué contiene |
|---|---|
| `units.js` | Temas y teoría |
| `cases.js` | Casos de examen: enunciado, (min,max), claves y DDL con errores |
| `bank.js` | Preguntas |
| `app.js` | Motor del juego |

Después de cambiar algo, regenera el HTML:

```bash
python3 bda-quest-src/build.py
```
