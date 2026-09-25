# Cruces en algoritmos genéticos · Crossover in genetic algorithms

Herramienta docente interactiva (D3.js) que ilustra paso a paso los operadores de cruce de los algoritmos genéticos, clasificados por tipo de representación. Está pensada para alumnos de grado en Informática.

**Estado:** disponibles los cruces permutacionales PMX, OX y CX (OX y CX con tres variantes cada uno) y un contraejemplo que muestra por qué el cruce en un punto no sirve para permutaciones. Después vendrán los cruces para representación binaria y real.

## Qué incluye

- Pantalla inicial con los operadores clasificados por representación (binaria, real y permutacional).
- Animación paso a paso del cruce, en español e inglés, con una explicación de cada paso.
- Padres aleatorios (con semilla reproducible) o introducidos a mano, y puntos de corte que se arrastran con el ratón.
- El ejemplo actual queda guardado en la URL, para proyectarlo en clase o compartirlo.
- Panel «Para saber más»: explicación del método, pseudocódigo que resalta la línea del paso actual, implementación en Python y JavaScript para copiar o descargar, y referencias.

## Uso

Abre `index.html` en el navegador. No necesita servidor ni conexión a internet: D3 v7 va incluido en `vendor/`.

Teclado: ← → avanzar o retroceder, espacio reproducir o pausar, Inicio volver al principio.

## Tests

Requieren Node.js 22 o superior; Python 3 es opcional (sirve para probar también la versión en Python del código descargable).

```
npm test
```

Comprueban el operador (el ejemplo de las transparencias y miles de casos aleatorios contrastados con una implementación independiente), que el código descargable da los mismos hijos que la herramienta y que el pseudocódigo está enlazado con los pasos de la animación.

## Estructura

| Ruta | Contenido |
| --- | --- |
| `index.html`, `css/` | Página y estilos |
| `js/registry.js`, `js/home.js` | Catálogo de representaciones y operadores; pantalla inicial |
| `js/operators/` | Lógica de cada operador: función pura que devuelve los hijos y la traza de pasos |
| `js/viz/` | Vistas D3 que dibujan esa traza |
| `js/content/` | Contenido docente de cada operador: explicación, pseudocódigo, código descargable y referencias |
| `js/learn.js`, `js/app.js` | Panel «Para saber más» y controlador de la página |
| `js/i18n.js`, `js/rng.js` | Textos en español e inglés; generador aleatorio con semilla |
| `vendor/` | D3.js v7 |
| `tests/` | Tests con `node:test` |

## Licencia

- Código, incluidas las implementaciones descargables en Python y JavaScript: MIT (ver [LICENSE](LICENSE)).
- Textos docentes (explicaciones, narración de los pasos y pseudocódigo): CC BY 4.0 (ver [LICENSE-CONTENT.md](LICENSE-CONTENT.md)).
- D3.js: licencia ISC (ver [vendor/d3-LICENSE](vendor/d3-LICENSE)).

## Autor

José Manuel Galán, Universidad de Burgos.

---

## English

Interactive teaching tool (D3.js) that illustrates genetic algorithm crossover operators step by step, grouped by representation type. It currently includes the permutation operators PMX, OX and CX (OX and CX with three variants each) and a counterexample showing why one-point crossover fails on permutations; the binary and real-valued operators will follow.

Open `index.html` in a browser; no server or internet connection is needed. Run the tests with `npm test` (Node.js 22 or later). Code is released under the MIT licence and the teaching texts under CC BY 4.0.
