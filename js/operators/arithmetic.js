/*
 * Cruce aritmético (Michalewicz, 1992) para representación real.
 * Cada gen de los hijos es una combinación lineal de los genes de los padres en esa posición:
 *   H1[i] = λ·P1[i] + (1 − λ)·P2[i]
 *   H2[i] = λ·P2[i] + (1 − λ)·P1[i]
 * Con λ constante se llama cruce aritmético uniforme; con λ = 0,5 los dos hijos coinciden
 * y son la media de los padres, que es el caso de las transparencias del curso.
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const B = isNode ? require('./bin-utils.js') : root.GAX.binUtils;
  const U = isNode ? require('./real-utils.js') : root.GAX.realUtils;

  /** Hijos del cruce aritmético con peso lam (0 <= lam <= 1). */
  function combine(p1, p2, lam) {
    return [
      p1.map((a, i) => lam * a + (1 - lam) * p2[i]),
      p2.map((b, i) => lam * b + (1 - lam) * p1[i]),
    ];
  }

  function arithmetic(p1, p2, lam) {
    const err = U.validateParents(p1, p2);
    if (err) throw new Error(err);
    if (!(lam >= 0 && lam <= 1)) throw new Error('errParam');
    const n = p1.length;
    const [h1, h2] = combine(p1, p2, lam);
    const m = 1 - lam;

    const T = B.newTrace(n);
    // Gen mezcla: w es la parte que aporta el Padre 1 (λ en el Hijo 1 y 1 − λ en el Hijo 2).
    const place = (i) => {
      T.children[0][i] = { v: h1[i], origin: 'blend', kind: 'blend', w: lam };
      T.children[1][i] = { v: h2[i], origin: 'blend', kind: 'blend', w: m };
      return [
        { from: ['p1', i], to: ['c1', i] }, { from: ['p2', i], to: ['c1', i] },
        { from: ['p1', i], to: ['c2', i] }, { from: ['p2', i], to: ['c2', i] },
      ];
    };
    const all = Array.from({ length: n }, (_, i) => i);

    T.snap({ type: 'intro', text: { key: 'intro', params: { n } } });
    T.st.auxVisible = true;
    const half = Math.abs(lam - 0.5) < 1e-9;
    T.snap({
      type: 'weights',
      text: { key: half ? 'weightsHalf' : 'weights', params: { l: lam, m, pl: Math.round(lam * 100), pm: Math.round(m * 100) } },
    });
    let fly = place(0);
    T.snap({
      type: 'first',
      text: { key: half ? 'firstHalf' : 'first', params: { a: p1[0], b: p2[0], l: lam, m, h1: h1[0], h2: h2[0], genes: ['a', 'b', 'h1', 'h2'] } },
      fly,
      highlight: { p1: [0], p2: [0], c1: [0], c2: [0] },
      auxActive: [0],
    });
    fly = [];
    for (let i = 1; i < n; i++) fly = fly.concat(place(i));
    const rest = all.slice(1);
    T.snap({
      type: 'rest',
      text: { key: 'rest', params: { n } },
      fly,
      highlight: { c1: rest, c2: rest },
      auxActive: rest,
    });
    const doneKey = half ? 'doneHalf' : (lam === 0 || lam === 1) ? 'doneEdge' : 'done';
    T.snap({ type: 'done', text: { key: doneKey, params: { l: lam } } });

    return {
      children: [h1, h2],
      steps: T.steps,
      aux: { type: 'lerp', items: { p1, p2 } },
    };
  }

  const spec = {
    id: 'arithmetic',
    representation: 'real',
    cuts: 0,
    aux: 'lerp',
    legend: ['p1', 'p2', 'blend'],
    params: [{ id: 'lambda', type: 'float', min: 0, max: 1, step: 0.05, default: 0.5 }],
    run: (p1, p2, cuts, opts) => {
      const l = opts && opts.params && opts.params.lambda;
      return arithmetic(p1, p2, typeof l === 'number' ? l : 0.5);
    },
  };

  const api = { arithmetic, combine, validateParents: U.validateParents, spec };
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).operators = root.GAX.operators || {}).arithmetic = api;
})(typeof self !== 'undefined' ? self : this);
