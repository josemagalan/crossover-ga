# Cruces en algoritmos genéticos · Crossover in genetic algorithms

Herramienta docente interactiva (D3.js) que ilustra paso a paso los operadores de cruce de los algoritmos genéticos, clasificados por tipo de representación. Está pensada para alumnos de grado en Informática.

**Estado:** disponibles los cruces binarios en un punto, en dos puntos, en n puntos y uniforme (todos explicados con la máscara de cruce de Syswerda), los cruces reales uniforme, aritmético (con el peso λ ajustable), BLX-α (con el parámetro α) y SBX (con el parámetro η) —estos dos últimos con una vista 2D adicional que muestra los padres, una nube de otros hijos posibles y los hijos de la traza—, los cruces permutacionales PMX, OX, CX (OX y CX con tres variantes cada uno) y ERX (con su tabla de adyacencias y dos variantes) y un contraejemplo que muestra por qué el cruce en un punto no sirve para permutaciones.

## Qué incluye

- Pantalla inicial con los operadores clasificados por representación (binaria, real y permutacional).
- Animación paso a paso del cruce, en español e inglés, con una explicación de cada paso.
- Padres aleatorios (con semilla reproducible) o introducidos a mano, y puntos de corte que se arrastran con el ratón.
- El ejemplo actual queda guardado en la URL, para proyectarlo en clase o compartirlo.
- Panel «Para saber más»: explicación del método, pseudocódigo que resalta la línea del paso actual, implementación en Python y JavaScript para copiar o descargar, y referencias.
- Modo práctica «predice el hijo»: con el botón «Practicar», antes de ver la animación se puede escribir la predicción de los dos hijos y comprobarla gen a gen (verde/rojo), con los datos que el algoritmo sortea por dentro (máscara, sorteos u orden de los ciclos) a la vista cuando hace falta para que la predicción tenga una única respuesta correcta.
- En los cruces de permutación, «Ver como rutas» muestra cada cromosoma como una ruta del viajante sobre ciudades colocadas al azar: las de los padres y la de cada hijo formándose con la animación, con sus longitudes y los tramos nuevos marcados.
- Comparar operadores: una pantalla por representación que aplica todos sus cruces a los mismos padres (y, cuando se puede, los mismos cortes), colorea cada gen de los hijos según lo que conserva de los padres y resume en una tabla, con la media de 1000 repeticiones, cuánto conserva cada uno: posición, orden relativo circular, adyacencias, copias de un padre y validez en permutación; genes del padre propio y tramos en binaria; copias, valores dentro del intervalo y distancia a los padres en real.

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
| `js/compare.js`, `js/compare-view.js` | Métricas de «Comparar operadores» (qué conserva cada cruce) y su pantalla |
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

Interactive teaching tool (D3.js) that illustrates genetic algorithm crossover operators step by step, grouped by representation type. It currently includes the binary one-point, two-point, n-point and uniform crossovers (all explained through Syswerda's crossover mask), the real-valued uniform, arithmetic (with adjustable weight λ), BLX-α (with parameter α) and SBX (with parameter η) crossovers —the latter two with an additional 2D view showing the parents, a cloud of other possible children and the children of the current trace—, the permutation operators PMX, OX, CX (OX and CX with three variants each) and ERX (with its adjacency table and two variants) and a counterexample showing why one-point crossover fails on permutations.

It also has a "predict the child" practice mode: before watching the animation, write your prediction for both children and check it gene by gene (green/red), with whatever the algorithm draws internally (mask, draws or cycle order) revealed only when it's needed for the prediction to have a single correct answer.

For permutation crossovers, "Show as routes" draws each chromosome as a travelling-salesman route over randomly placed cities: the parents' routes and each child's route building up with the animation, with their lengths and new stretches marked.

A "compare operators" screen for each representation applies all its crossovers to the same parents (and, where possible, the same cuts), colours each child gene by what it keeps from the parents and sums up, averaged over 1000 runs, how much each operator keeps: position, circular relative order, adjacencies, copies of a parent and validity for permutations; genes from the own parent and stretches for binary; copies, values inside the interval and distance to the parents for real-valued.

Open `index.html` in a browser; no server or internet connection is needed. Run the tests with `npm test` (Node.js 22 or later). Code is released under the MIT licence and the teaching texts under CC BY 4.0.
