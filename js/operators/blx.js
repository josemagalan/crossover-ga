/*
 * Cruce BLX-α (Eshelman & Schaffer, 1993) para representación real.
 * En cada posición, con cmin = mín(P1[i], P2[i]), cmax = máx(P1[i], P2[i]) e I = cmax − cmin,
 * cada hijo se sortea, independientemente, en el intervalo [cmin − α·I, cmax + α·I].
 * Con α = 0 es el cruce plano de Radcliffe (1990): los hijos quedan dentro del intervalo de
 * los padres. Con α > 0 el intervalo se amplía por los dos lados y los hijos pueden salir de él.
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const B = isNode ? require('./bin-utils.js') : root.GAX.binUtils;
  const U = isNode ? require('./real-utils.js') : root.GAX.realUtils;
  const R = isNode ? require('../rng.js') : root.GAX.rng;

  const CLOUD_TRIALS = 100;   // 100 sorteos × 2 hijos = 200 puntos en la nube

  /** Intervalo [lo, hi] de BLX-α en una posición, dados los dos genes de los padres. */
  function interval(a, b, alpha) {
    const cmin = Math.min(a, b);
    const cmax = Math.max(a, b);
    const width = cmax - cmin;
    return { cmin, cmax, width, lo: cmin - alpha * width, hi: cmax + alpha * width };
  }

  function blx(p1, p2, alpha, opts) {
    const err = U.validateParents(p1, p2);
    if (err) throw new Error(err);
    if (!(alpha >= 0 && alpha <= 1)) throw new Error('errParam');
    opts = opts || {};
    const n = p1.length;
    const rand = R.mulberry32((opts.seed >>> 0) || 1);
    const draws = Array.isArray(opts.draws) ? opts.draws.slice(0, 2 * n) : Array.from({ length: 2 * n }, () => rand());

    const h1 = new Array(n);
    const h2 = new Array(n);
    const T = B.newTrace(n);
    const place = (i) => {
      const { lo, hi } = interval(p1[i], p2[i], alpha);
      const r1 = draws[2 * i];
      const r2 = draws[2 * i + 1];
      h1[i] = lo + r1 * (hi - lo);
      h2[i] = lo + r2 * (hi - lo);
      T.children[0][i] = { v: h1[i], origin: 'blend', kind: 'wide' };
      T.children[1][i] = { v: h2[i], origin: 'blend', kind: 'wide' };
      return [
        { from: ['p1', i], to: ['c1', i] }, { from: ['p2', i], to: ['c1', i] },
        { from: ['p1', i], to: ['c2', i] }, { from: ['p2', i], to: ['c2', i] },
      ];
    };

    T.snap({ type: 'intro', text: { key: 'intro', params: { n } } });
    T.st.auxVisible = true;
    T.snap({ type: 'alphaIntro', text: { key: 'alphaIntro', params: { alpha } } });
    for (let i = 0; i < n; i++) {
      const { cmin, cmax, width, lo, hi } = interval(p1[i], p2[i], alpha);
      const fly = place(i);
      T.snap({
        type: 'gene',
        text: {
          key: width < 1e-9 ? 'geneSame' : 'gene',
          params: { pos: i + 1, cmin, cmax, width, lo, hi, alpha, r1: draws[2 * i], r2: draws[2 * i + 1], h1: h1[i], h2: h2[i] },
        },
        fly,
        highlight: { p1: [i], p2: [i], c1: [i], c2: [i] },
        auxActive: [i],
      });
    }
    T.snap({ type: 'done', text: { key: alpha === 0 ? 'doneFlat' : 'done', params: { alpha } } });

    // Nube de otros hijos posibles con estos mismos padres y α, solo con los genes 1 y 2
    // (no se genera al reproducir sorteos concretos, p. ej. desde los tests).
    let cloud = [];
    if (!Array.isArray(opts.draws)) {
      const iv0 = interval(p1[0], p2[0], alpha);
      const iv1 = interval(p1[1], p2[1], alpha);
      for (let t = 0; t < CLOUD_TRIALS; t++) {
        const a0 = iv0.lo + rand() * (iv0.hi - iv0.lo);
        const a1 = iv1.lo + rand() * (iv1.hi - iv1.lo);
        const b0 = iv0.lo + rand() * (iv0.hi - iv0.lo);
        const b1 = iv1.lo + rand() * (iv1.hi - iv1.lo);
        cloud.push([a0, a1], [b0, b1]);
      }
    }

    return {
      children: [h1, h2],
      steps: T.steps,
      draws,
      aux: { type: 'cloud', items: { p1: [p1[0], p1[1]], p2: [p2[0], p2[1]], cloud } },
    };
  }

  const spec = {
    id: 'blx',
    representation: 'real',
    cuts: 0,
    aux: 'cloud',
    legend: ['p1', 'p2', 'cloud'],
    params: [{ id: 'alpha', type: 'float', min: 0, max: 1, step: 0.05, default: 0.5 }],
    random: true,           // la página ofrece «Sortear de nuevo»
    run: (p1, p2, cuts, opts) => {
      const a = opts && opts.params && opts.params.alpha;
      return blx(p1, p2, typeof a === 'number' ? a : 0.5, { seed: opts && opts.seed, draws: opts && opts.draws });
    },
  };

  const api = { blx, interval, validateParents: U.validateParents, spec };
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).operators = root.GAX.operators || {}).blx = api;
})(typeof self !== 'undefined' ? self : this);
