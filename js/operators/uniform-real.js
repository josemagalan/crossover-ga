/*
 * Cruce uniforme para representación real: igual que en la binaria, cada posición se decide
 * por separado y los hijos intercambian el gen i si r_i <= p. Los valores no se modifican:
 * cada gen del hijo es exactamente el de uno de los padres (Luke, 2013, algoritmo 25).
 * Mühlenbein y Schlierkamp-Voosen (1993) lo llaman cruce discreto.
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const B = isNode ? require('./bin-utils.js') : root.GAX.binUtils;
  const U = isNode ? require('./real-utils.js') : root.GAX.realUtils;

  function uniform(p1, p2, p, opts) {
    const err = U.validateParents(p1, p2);
    if (err) throw new Error(err);
    return B.uniformTrace(p1, p2, p, opts);
  }

  const spec = {
    id: 'uniform-real',
    representation: 'real',
    cuts: 0,
    aux: 'mask',
    legend: ['p1', 'p2', 'mask'],
    params: [{ id: 'p', type: 'float', min: 0.1, max: 0.5, step: 0.05, default: 0.5 }],
    random: true,           // la página ofrece «Sortear de nuevo»
    run: (p1, p2, cuts, opts) => uniform(p1, p2, (opts && opts.params && opts.params.p) || 0.5, { seed: opts && opts.seed, draws: opts && opts.draws }),
  };

  const api = { uniform, validateParents: U.validateParents, spec };
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).operators = root.GAX.operators || {})['uniform-real'] = api;
})(typeof self !== 'undefined' ? self : this);
