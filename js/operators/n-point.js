/*
 * Cruce en n puntos para representación binaria: con k cortes, los tramos alternan entre
 * copiar del propio padre y tomar del otro. Máscara: el bit cambia en cada corte.
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const B = isNode ? require('./bin-utils.js') : root.GAX.binUtils;

  function nPoint(p1, p2, cuts) {
    const err = B.validateParents(p1, p2);
    if (err) throw new Error(err);
    const n = p1.length;
    const ok = Array.isArray(cuts) && cuts.length >= 1 &&
      cuts.every((c, i) => Number.isInteger(c) && c >= 1 && c <= n - 1 && (i === 0 || c > cuts[i - 1]));
    if (!ok) throw new Error('errCuts');
    return B.cutsTrace(p1, p2, cuts);
  }

  const spec = {
    id: 'n-point',
    representation: 'binary',
    cuts: 'k',            // tantos cortes como indique el parámetro k
    aux: 'mask',
    legend: ['p1', 'p2', 'mask', 'segment'],
    params: [{ id: 'k', type: 'int', min: 1, max: 5, step: 1, default: 3 }],
    run: (p1, p2, cuts) => nPoint(p1, p2, cuts),
  };

  const api = { nPoint, validateParents: B.validateParents, spec };
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).operators = root.GAX.operators || {})['n-point'] = api;
})(typeof self !== 'undefined' ? self : this);
