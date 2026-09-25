/*
 * Cruce en un punto para representación binaria: los hijos intercambian las colas a partir del corte.
 * Máscara: 0…0 1…1 (el primer 1, en la posición del corte).
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const B = isNode ? require('./bin-utils.js') : root.GAX.binUtils;

  function onePoint(p1, p2, c) {
    const err = B.validateParents(p1, p2);
    if (err) throw new Error(err);
    if (!Number.isInteger(c) || c < 1 || c > p1.length - 1) throw new Error('errCuts');
    return B.cutsTrace(p1, p2, [c]);
  }

  const spec = {
    id: 'one-point',
    representation: 'binary',
    cuts: 1,
    aux: 'mask',
    legend: ['p1', 'p2', 'mask', 'segment'],
    run: (p1, p2, cuts) => onePoint(p1, p2, cuts[0]),
  };

  const api = { onePoint, validateParents: B.validateParents, spec };
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).operators = root.GAX.operators || {})['one-point'] = api;
})(typeof self !== 'undefined' ? self : this);
