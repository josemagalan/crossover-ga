/*
 * Cruce uniforme para representación binaria: cada posición se decide por separado.
 * Se intercambia la posición i si un número aleatorio r_i en [0, 1) cumple r_i <= p
 * (p = 0,5 en la versión original; con p < 0,5 se habla de cruce uniforme parametrizado).
 * El sorteo es reproducible (opts.seed) o se puede fijar (opts.draws, lista de r_i).
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const B = isNode ? require('./bin-utils.js') : root.GAX.binUtils;

  function uniform(p1, p2, p, opts) {
    const err = B.validateParents(p1, p2);
    if (err) throw new Error(err);
    if (!(p > 0 && p <= 1)) throw new Error('errParam');
    opts = opts || {};
    const n = p1.length;
    const rand = B.R.mulberry32((opts.seed >>> 0) || 1);
    // Sorteos redondeados a centésimas, para que la narración muestre exactamente el número comparado con p.
    const draws = Array.isArray(opts.draws) ? opts.draws.slice(0, n) : Array.from({ length: n }, () => Math.floor(rand() * 100) / 100);
    const mask = draws.map((r) => (r <= p ? 1 : 0));

    const T = B.newTrace(n);
    T.snap({ type: 'intro', text: { key: 'intro', params: { n } } });
    T.st.auxVisible = true;
    T.snap({ type: 'maskIntro', text: { key: 'maskIntro', params: { p } } });
    for (let i = 0; i < n; i++) {
      T.st.maskShown.push(i);
      const swap = mask[i] === 1;
      const fly = T.place(i, swap, p1, p2);
      T.snap({
        type: swap ? 'drawSwap' : 'drawKeep',
        text: { key: swap ? 'drawSwap' : 'drawKeep', params: { pos: i + 1, r: draws[i], p } },
        fly,
        highlight: { p1: [i], p2: [i], c1: [i], c2: [i] },
        auxActive: [i],
      });
    }
    T.st.segmentVisible = true;
    B.doneStep(T.snap, p1, p2, mask);
    return {
      children: T.children.map((c) => c.map((g) => g.v)),
      steps: T.steps,
      mask,
      draws,
      bands: B.bandsFromMask(mask),
      aux: { type: 'mask', items: mask },
    };
  }

  const spec = {
    id: 'uniform-binary',
    representation: 'binary',
    cuts: 0,
    aux: 'mask',
    legend: ['p1', 'p2', 'mask'],
    params: [{ id: 'p', type: 'float', min: 0.1, max: 0.5, step: 0.05, default: 0.5 }],
    random: true,           // la página ofrece «Sortear de nuevo»
    run: (p1, p2, cuts, opts) => uniform(p1, p2, (opts && opts.params && opts.params.p) || 0.5, { seed: opts && opts.seed, draws: opts && opts.draws }),
  };

  const api = { uniform, validateParents: B.validateParents, spec };
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).operators = root.GAX.operators || {})['uniform-binary'] = api;
})(typeof self !== 'undefined' ? self : this);
