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
          name: { es: 'Cruce en un punto', en: 'One-point crossover' },
          summary: { es: 'Se corta por un punto y los hijos intercambian las colas.', en: 'Cut at one point; the children swap tails.' },
        },
        {
          id: 'two-point',
          name: { es: 'Cruce en dos puntos', en: 'Two-point crossover' },
          summary: { es: 'Los hijos intercambian el segmento entre dos cortes.', en: 'The children swap the segment between two cuts.' },
        },
        {
          id: 'n-point',
          name: { es: 'Cruce en n puntos', en: 'N-point crossover' },
          summary: { es: 'Con n cortes, cada tramo alterna el padre del que se copia.', en: 'With n cuts, each stretch alternates the parent it is copied from.' },
        },
        {
          id: 'uniform-binary',
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
      sample: ['0.42', '1.70', '−0.35', '2.10'],
      operators: [
        {
          id: 'uniform-real',
          name: { es: 'Cruce uniforme', en: 'Uniform crossover' },
          summary: { es: 'Cada gen se copia tal cual de uno de los dos padres, al azar.', en: 'Each gene is copied unchanged from one of the two parents, at random.' },
        },
        {
          id: 'arithmetic',
          name: { es: 'Cruce aritmético', en: 'Arithmetic crossover' },
          summary: { es: 'Los hijos son combinaciones lineales de los padres, con un peso λ.', en: 'The children are linear combinations of the parents, with weight λ.' },
        },
        {
          id: 'blx',
          name: { es: 'Cruce BLX-α', en: 'BLX-α crossover' },
          summary: { es: 'Cada gen se elige al azar en el intervalo de los padres ampliado en α.', en: 'Each gene is drawn from the parents’ interval widened by α.' },
        },
        {
          id: 'sbx',
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
