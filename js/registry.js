/*
 * Catálogo de representaciones y operadores de cruce.
 * Un operador con `ready: true` necesita dos ficheros con su mismo id:
 *   js/operators/<id>.js  (lógica y traza)   y   js/content/<id>.js  (contenido docente)
 * Los demás aparecen en la pantalla inicial como «próximamente».
 */
(function (root) {
  'use strict';

  const representations = [
    {
      id: 'binary',
      name: { es: 'Binaria', en: 'Binary' },
      desc: {
        es: 'Cada gen es un bit (0 o 1). Es la codificación clásica de los algoritmos genéticos: enteros y reales se codifican como cadenas de bits.',
        en: 'Each gene is a bit (0 or 1). It is the classic genetic algorithm encoding: integers and reals are encoded as bit strings.',
      },
      sample: ['1', '0', '1', '1', '0', '0', '1', '0'],
      operators: [
        {
          id: 'one-point',
          ready: true,
          subtitle: {
            es: 'Cruce en un punto: los hijos intercambian las colas a partir del corte',
            en: 'One-point crossover: the children swap tails from the cut point',
          },
          name: { es: 'Cruce en un punto', en: 'One-point crossover' },
          summary: { es: 'Se corta por un punto y los hijos intercambian las colas.', en: 'Cut at one point; the children swap tails.' },
        },
        {
          id: 'two-point',
          ready: true,
          subtitle: {
            es: 'Cruce en dos puntos: los hijos intercambian el tramo entre los cortes',
            en: 'Two-point crossover: the children swap the stretch between the cuts',
          },
          name: { es: 'Cruce en dos puntos', en: 'Two-point crossover' },
          summary: { es: 'Los hijos intercambian el segmento entre dos cortes.', en: 'The children swap the segment between two cuts.' },
        },
        {
          id: 'n-point',
          ready: true,
          subtitle: {
            es: 'Cruce en n puntos: con cada corte, los hijos cambian de padre',
            en: 'N-point crossover: at every cut, the children switch parent',
          },
          name: { es: 'Cruce en n puntos', en: 'N-point crossover' },
          summary: { es: 'Con n cortes, cada tramo alterna el padre del que se copia.', en: 'With n cuts, each stretch alternates the parent it is copied from.' },
        },
        {
          id: 'uniform-binary',
          ready: true,
          subtitle: {
            es: 'Cruce uniforme: cada posición se intercambia al azar con probabilidad p',
            en: 'Uniform crossover: each position is swapped at random with probability p',
          },
          name: { es: 'Cruce uniforme', en: 'Uniform crossover' },
          summary: { es: 'Una máscara aleatoria decide de qué padre sale cada gen.', en: 'A random mask decides which parent each gene comes from.' },
        },
      ],
    },
    {
      id: 'real',
      name: { es: 'Real', en: 'Real-valued' },
      desc: {
        es: 'Cada gen es un número real. Es la representación natural cuando las variables del problema son continuas.',
        en: 'Each gene is a real number. It is the natural representation when the problem variables are continuous.',
      },
      sample: ['4.2', '1.7', '8.5', '2.1'],
      operators: [
        {
          id: 'uniform-real',
          ready: true,
          subtitle: {
            es: 'Cruce uniforme: cada gen viene tal cual de uno de los dos padres',
            en: 'Uniform crossover: each gene comes unchanged from one of the two parents',
          },
          name: { es: 'Cruce uniforme', en: 'Uniform crossover' },
          summary: { es: 'Cada gen se copia tal cual de uno de los dos padres, al azar.', en: 'Each gene is copied unchanged from one of the two parents, at random.' },
        },
        {
          id: 'arithmetic',
          ready: true,
          subtitle: {
            es: 'Cruce aritmético: cada gen del hijo es una media ponderada de los padres',
            en: 'Arithmetic crossover: each child gene is a weighted average of the parents',
          },
          name: { es: 'Cruce aritmético', en: 'Arithmetic crossover' },
          summary: { es: 'Los hijos son combinaciones lineales de los padres, con un peso λ.', en: 'The children are linear combinations of the parents, with weight λ.' },
        },
        {
          id: 'blx',
          ready: true,
          subtitle: {
            es: 'Cruce BLX-α: cada gen se sortea en el intervalo de los padres ampliado en α',
            en: 'BLX-α crossover: each gene is drawn from the parents’ interval widened by α',
          },
          name: { es: 'Cruce BLX-α', en: 'BLX-α crossover' },
          summary: { es: 'Cada gen se elige al azar en el intervalo de los padres ampliado en α.', en: 'Each gene is drawn from the parents’ interval widened by α.' },
        },
        {
          id: 'sbx',
          ready: true,
          subtitle: {
            es: 'Cruce SBX: imita con reales la dispersión del cruce binario de un punto; η la controla',
            en: 'SBX crossover: mimics one-point binary crossover’s spread with reals; η controls it',
          },
          name: { es: 'Cruce SBX', en: 'SBX crossover' },
          summary: { es: 'Imita con reales el efecto del cruce binario de un punto; η controla la dispersión.', en: 'Mimics one-point binary crossover with reals; η controls the spread.' },
        },
      ],
    },
    {
      id: 'permutation',
      name: { es: 'Permutacional', en: 'Permutation' },
      desc: {
        es: 'El cromosoma es una ordenación de n elementos, sin repetidos. Se usa en problemas de secuenciación y de rutas, como el del viajante.',
        en: 'The chromosome is an ordering of n elements with no repeats. It is used in sequencing and routing problems such as the travelling salesman.',
      },
      sample: ['3', '1', '4', '2', '5'],
      operators: [
        {
          id: 'one-point-perm',
          ready: true,
          name: { es: 'Contraejemplo: cruce en un punto', en: 'Counterexample: one-point crossover' },
          summary: { es: 'Por qué hacen falta operadores específicos: aparecen genes repetidos.', en: 'Why specific operators are needed: genes get repeated.' },
          subtitle: {
            es: 'Qué ocurre si se aplica a permutaciones el cruce clásico de la representación binaria',
            en: 'What happens when the classic binary crossover is applied to permutations',
          },
        },
        {
          id: 'pmx',
          ready: true,
          name: { es: 'Cruce PMX', en: 'PMX crossover' },
          summary: { es: 'Segmento de un padre y correspondencias para completar sin repetir genes.', en: 'A segment from one parent and a mapping to complete without repeating genes.' },
          subtitle: {
            es: 'Partially Mapped Crossover: cómo recombinar dos permutaciones sin repetir genes',
            en: 'Partially Mapped Crossover: recombining two permutations without repeating genes',
          },
        },
        {
          id: 'ox',
          ready: true,
          name: { es: 'Cruce OX', en: 'OX crossover' },
          summary: { es: 'Segmento de un padre y el resto en el orden relativo del otro.', en: 'A segment from one parent and the rest in the other’s relative order.' },
          subtitle: {
            es: 'Order Crossover: un segmento de un padre y el resto en el orden del otro',
            en: 'Order Crossover: a segment from one parent and the rest in the other’s order',
          },
        },
        {
          id: 'cx',
          ready: true,
          name: { es: 'Cruce CX', en: 'CX crossover' },
          summary: { es: 'Cada gen conserva la posición que tenía en uno de los padres, siguiendo ciclos.', en: 'Each gene keeps the position it had in one of the parents, following cycles.' },
          subtitle: {
            es: 'Cycle Crossover: cada gen conserva la posición que tenía en uno de los padres',
            en: 'Cycle Crossover: every gene keeps the position it had in one of the parents',
          },
        },
        {
          id: 'erx',
          ready: true,
          name: { es: 'Cruce ERX', en: 'ERX crossover' },
          summary: { es: 'Cada gen del hijo sigue a uno de sus vecinos en los padres, con una tabla de adyacencias.', en: 'Each child gene follows one of its neighbours in the parents, using an adjacency table.' },
          subtitle: {
            es: 'Edge Recombination Crossover: el hijo hereda las aristas (los genes vecinos) de los padres',
            en: 'Edge Recombination Crossover: the child inherits the parents’ edges (neighbouring genes)',
          },
        },
      ],
    },
  ];

  const byId = {};
  representations.forEach((rep) => rep.operators.forEach((op) => { byId[op.id] = Object.assign({ representation: rep.id }, op); }));

  function getOperator(id) { return byId[id] || null; }
  function getRepresentation(id) { return representations.find((r) => r.id === id) || null; }
  function isReady(id) { return !!(byId[id] && byId[id].ready); }

  const api = { representations, getOperator, getRepresentation, isReady };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else (root.GAX = root.GAX || {}).registry = api;
})(typeof self !== 'undefined' ? self : this);
