/*
 * Cruce en dos puntos para representación binaria: los hijos intercambian el tramo [c1, c2).
 * Máscara: 0…0 1…1 0…0.
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const B = isNode ? require('./bin-utils.js') : root.GAX.binUtils;

  function twoPoint(p1, p2, c1, c2) {
    const err = B.validateParents(p1, p2);
    if (err) throw new Error(err);
    const n = p1.length;
    if (!Number.isInteger(c1) || !Number.isInteger(c2) || c1 < 0 || c2 > n || c2 - c1 < 1 || c2 - c1 > n - 1) throw new Error('errCuts');
    return B.cutsTrace(p1, p2, [c1, c2]);
  }

  const spec = {
    id: 'two-point',
    representation: 'binary',
    cuts: 2,
    aux: 'mask',
    legend: ['p1', 'p2', 'mask', 'segment'],
    run: (p1, p2, cuts) => twoPoint(p1, p2, cuts[0], cuts[1]),
  };

  const api = { twoPoint, validateParents: B.validateParents, spec };
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).operators = root.GAX.operators || {})['two-point'] = api;
})(typeof self !== 'undefined' ? self : this);
