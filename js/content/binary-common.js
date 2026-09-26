/*
 * Textos compartidos por los cruces de la representación binaria (narración de la máscara,
 * leyenda) y utilidades para los ficheros de contenido de cada operador binario.
 */
(function (root) {
  'use strict';

  const narration = {
    es: {
      maskCaption: 'Máscara de cruce (1 = intercambio)',
      legendMask: 'Bit 1 de la máscara: los hijos intercambian el gen',
      legendSegment: 'Tramo que se intercambia',
      intro: 'Partimos de dos padres, cadenas de {n} bits.',
      cutsOne: 'Se elige un punto de corte: tras la posición {c}.',
      cutsMany: 'Se eligen {k} puntos de corte: tras las posiciones {list}.',
      mask: 'Esos cortes equivalen a una máscara de cruce: {mask}. Donde hay un 0, cada hijo copia el gen de su propio padre; donde hay un 1, los hijos lo intercambian.',
      keep: 'Posiciones con 0 ({positions}): el Hijo 1 copia el gen del Padre 1 y el Hijo 2, el del Padre 2.',
      swap: 'Posiciones con 1 ({positions}): los hijos intercambian los genes; el Hijo 1 toma los del Padre 2 y el Hijo 2, los del Padre 1.',
      done: 'Resultado: los hijos se reparten los genes de los padres según la máscara ({swapped} posiciones intercambiadas y {kept} conservadas). En las {same} posiciones en que los padres coinciden, los hijos tienen ese mismo bit, haya o no intercambio.',
      doneNoSame: 'Resultado: los hijos se reparten los genes de los padres según la máscara ({swapped} posiciones intercambiadas y {kept} conservadas).',
    },
    en: {
      maskCaption: 'Crossover mask (1 = swap)',
      legendMask: 'Mask bit 1: the children swap the gene',
      legendSegment: 'Stretch that is swapped',
      intro: 'We start from two parents, strings of {n} bits.',
      cutsOne: 'A cut point is chosen: after position {c}.',
      cutsMany: '{k} cut points are chosen: after positions {list}.',
      mask: 'Those cuts are equivalent to a crossover mask: {mask}. Where there is a 0, each child copies its own parent’s gene; where there is a 1, the children swap it.',
      keep: 'Positions with 0 ({positions}): Child 1 copies Parent 1’s gene and Child 2 copies Parent 2’s.',
      swap: 'Positions with 1 ({positions}): the children swap genes; Child 1 takes Parent 2’s and Child 2 takes Parent 1’s.',
      done: 'Result: the children share out the parents’ genes according to the mask ({swapped} positions swapped and {kept} kept). In the {same} positions where the parents agree, the children have that same bit whether or not it is swapped.',
      doneNoSame: 'Result: the children share out the parents’ genes according to the mask ({swapped} positions swapped and {kept} kept).',
    },
  };

  // Pasos de los cruces por cortes -> líneas del pseudocódigo
  const cutsStepLines = {
    intro: ['sig'],
    cuts: ['cuts'],
    mask: ['mask'],
    keep: ['forPos', 'keep'],
    swap: ['forPos', 'swap'],
    done: ['return'],
  };

  const refs = {
    holland: {
      id: 'holland-1992',
      type: 'book',
      authors: 'Holland, J. H.',
      year: '1992',
      title: 'Adaptation in natural and artificial systems: An introductory analysis with applications to biology, control, and artificial intelligence',
      details: { es: '(1.ª ed. en MIT Press; 1.ª ed., 1975, University of Michigan Press). MIT Press', en: '(1st MIT Press ed.; 1st ed., 1975, University of Michigan Press). MIT Press' },
      url: null,
    },
    syswerda: {
      id: 'syswerda-1989',
      type: 'inproceedings',
      authors: 'Syswerda, G.',
      year: '1989',
      title: 'Uniform crossover in genetic algorithms',
      container: 'Proceedings of the Third International Conference on Genetic Algorithms',
      details: { es: '(J. D. Schaffer, ed., pp. 2–9). Morgan Kaufmann', en: '(J. D. Schaffer, Ed., pp. 2–9). Morgan Kaufmann' },
      url: null,
    },
    mitchell: {
      id: 'mitchell-1996',
      type: 'book',
      authors: 'Mitchell, M.',
      year: '1996',
      title: 'An introduction to genetic algorithms',
      details: { es: 'MIT Press', en: 'MIT Press' },
      url: null,
    },
    luke: {
      id: 'luke-2013',
      type: 'book',
      authors: 'Luke, S.',
      year: '2013',
      title: 'Essentials of metaheuristics',
      details: { es: '(2.ª ed.). Lulu. Disponible gratis en línea', en: '(2nd ed.). Lulu. Freely available online' },
      url: 'https://people.cs.gmu.edu/~sean/book/metaheuristics/',
    },
    eiben: {
      id: 'eiben-smith-2015',
      type: 'book',
      authors: 'Eiben, A. E., & Smith, J. E.',
      year: '2015',
      title: 'Introduction to evolutionary computing',
      details: { es: '(2.ª ed.). Springer, Natural Computing Series', en: '(2nd ed.). Springer, Natural Computing Series' },
      url: 'https://doi.org/10.1007/978-3-662-44874-8',
    },
    talbi: {
      id: 'talbi-2009',
      type: 'book',
      authors: 'Talbi, E.-G.',
      year: '2009',
      title: 'Metaheuristics: From design to implementation',
      details: { es: 'Wiley', en: 'Wiley' },
      url: 'https://doi.org/10.1002/9780470496916',
    },
    bautista: {
      id: 'bautista-valhondo-2020',
      type: 'book',
      authors: 'Bautista-Valhondo, J.',
      year: '2020',
      title: 'Metaheurísticas en ingeniería',
      details: { es: 'Dextra, colección Investigación operativa', en: 'Dextra, Investigación operativa series' },
      url: null,
    },
    whitley: {
      id: 'whitley-1994',
      type: 'article',
      authors: 'Whitley, D.',
      year: '1994',
      title: 'A genetic algorithm tutorial',
      container: 'Statistics and Computing',
      details: { es: '4(2), 65–85', en: '4(2), 65–85' },
      url: 'https://doi.org/10.1007/BF00175354',
    },
  };

  /** Referencia compartida con una nota propia del operador. */
  function ref(key, note, extra) {
    return Object.assign({}, refs[key], { note }, extra || {});
  }

  function makeHelpers(codeTemplates, codeComments, pseudocode) {
    return {
      getCode(kind, lang) {
        const tpl = codeTemplates[kind];
        const comments = codeComments[lang] || codeComments.es;
        return tpl.template.replace(/\{\{(\w+)\}\}/g, (m, k) => (comments[k] != null ? comments[k] : m));
      },
      getPseudocodeText(lang) {
        return (pseudocode[lang] || pseudocode.es).map((l) => '    '.repeat(l.indent) + l.text).join('\n') + '\n';
      },
    };
  }

  const api = { narration, cutsStepLines, ref, refs, makeHelpers };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else ((root.GAX = root.GAX || {}).contentShared = root.GAX.contentShared || {}).binary = api;
})(typeof self !== 'undefined' ? self : this);
