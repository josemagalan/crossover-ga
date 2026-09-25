/*
 * Referencias y utilidades compartidas por los cruces de la representación real.
 * Las utilidades de código y pseudocódigo son las mismas que en la binaria.
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const C = isNode ? require('./binary-common.js') : root.GAX.contentShared.binary;

  const refs = {
    michalewicz: {
      id: 'michalewicz-1996',
      type: 'book',
      authors: 'Michalewicz, Z.',
      year: '1996',
      title: 'Genetic algorithms + data structures = evolution programs',
      details: { es: '(3.ª ed.; 1.ª ed., 1992). Springer', en: '(3rd ed.; 1st ed., 1992). Springer' },
      url: 'https://doi.org/10.1007/978-3-662-03315-9',
    },
    herrera: {
      id: 'herrera-1998',
      type: 'article',
      authors: 'Herrera, F., Lozano, M., & Verdegay, J. L.',
      year: '1998',
      title: 'Tackling real-coded genetic algorithms: Operators and tools for behavioural analysis',
      container: 'Artificial Intelligence Review',
      details: { es: '12(4), 265–319', en: '12(4), 265–319' },
      url: 'https://doi.org/10.1023/A:1006504901164',
    },
    muhlenbein: {
      id: 'muhlenbein-1993',
      type: 'article',
      authors: 'Mühlenbein, H., & Schlierkamp-Voosen, D.',
      year: '1993',
      title: 'Predictive models for the breeder genetic algorithm I. Continuous parameter optimization',
      container: 'Evolutionary Computation',
      details: { es: '1(1), 25–49', en: '1(1), 25–49' },
      url: 'https://doi.org/10.1162/evco.1993.1.1.25',
    },
  };

  /** Referencia compartida (real o binaria) con una nota propia del operador. */
  function ref(key, note, extra) {
    if (!refs[key]) return C.ref(key, note, extra);
    return Object.assign({}, refs[key], { note }, extra || {});
  }

  const api = { ref, makeHelpers: C.makeHelpers, binary: C };
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).contentShared = root.GAX.contentShared || {}).real = api;
})(typeof self !== 'undefined' ? self : this);
