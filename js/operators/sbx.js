/*
 * Cruce SBX, simulated binary crossover (Deb & Agrawal, 1995) para representación real.
 * Imita, con genes reales, la dispersión del cruce de un punto de la representación binaria.
 * En cada posición se sortea u en [0, 1) y se calcula un factor de dispersión β a partir de él
 * y del parámetro η (ecuaciones 19–20 del artículo, invertidas para el sorteo):
 *   u ≤ 0,5:  β = (2u)^(1/(η+1))          u > 0,5:  β = (1/(2(1−u)))^(1/(η+1))
 * y los hijos son H1 = 0,5·[(1+β)·P1 + (1−β)·P2], H2 = 0,5·[(1−β)·P1 + (1+β)·P2]. Un η grande
 * concentra los hijos cerca de los padres (menos disruptivo); uno pequeño los dispersa más.
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const B = isNode ? require('./bin-utils.js') : root.GAX.binUtils;
  const U = isNode ? require('./real-utils.js') : root.GAX.realUtils;
  const R = isNode ? require('../rng.js') : root.GAX.rng;

  const CLOUD_TRIALS = 100;   // 100 sorteos × 2 hijos = 200 puntos en la nube

  // Redondeo a 5 decimales, hecho a mano (no con Math.round/round de cada lenguaje): el exponente
  // 1/(η+1) da resultados que, en los últimos bits, pueden diferir entre motores de JavaScript y
  // Python, y además Python redondea las mitades exactas al par más cercano en lugar de hacia
  // arriba. Con la misma cuenta en los dos lenguajes (más el margen de sobra frente a esa
  // diferencia de bits, del orden de 1e-15), el código descargable da exactamente los mismos
  // hijos que la herramienta, sin que se note en la precisión mostrada.
  function round5(x) {
    const s = x < 0 ? -1 : 1;
    return (s * Math.floor(Math.abs(x) * 1e5 + 0.5)) / 1e5;
  }

  /** Factor de dispersión β a partir del sorteo u en [0, 1) y el parámetro η. */
  function beta(u, eta) {
    const b = u <= 0.5 ? Math.pow(2 * u, 1 / (eta + 1)) : Math.pow(1 / (2 * (1 - u)), 1 / (eta + 1));
    return round5(b);
  }

  function children(a, b, b_) {
    return [round5(0.5 * ((1 + b_) * a + (1 - b_) * b)), round5(0.5 * ((1 - b_) * a + (1 + b_) * b))];
  }

  function sbx(p1, p2, eta, opts) {
    const err = U.validateParents(p1, p2);
    if (err) throw new Error(err);
    if (!(eta >= 0)) throw new Error('errParam');
    opts = opts || {};
    const n = p1.length;
    const rand = R.mulberry32((opts.seed >>> 0) || 1);
    const draws = Array.isArray(opts.draws) ? opts.draws.slice(0, n) : Array.from({ length: n }, () => rand());

    const h1 = new Array(n);
    const h2 = new Array(n);
    const T = B.newTrace(n);
    const place = (i, b_) => {
      [h1[i], h2[i]] = children(p1[i], p2[i], b_);
      T.children[0][i] = { v: h1[i], origin: 'blend', kind: 'wide' };
      T.children[1][i] = { v: h2[i], origin: 'blend', kind: 'wide' };
      return [
        { from: ['p1', i], to: ['c1', i] }, { from: ['p2', i], to: ['c1', i] },
        { from: ['p1', i], to: ['c2', i] }, { from: ['p2', i], to: ['c2', i] },
      ];
    };

    T.snap({ type: 'intro', text: { key: 'intro', params: { n } } });
    T.st.auxVisible = true;
    T.snap({ type: 'etaIntro', text: { key: 'etaIntro', params: { eta } } });
    for (let i = 0; i < n; i++) {
      const u = draws[i];
      const b_ = beta(u, eta);
      const fly = place(i, b_);
      T.snap({
        type: 'gene',
        text: { key: u <= 0.5 ? 'geneLow' : 'geneHigh', params: { pos: i + 1, u, eta, beta: b_, a: p1[i], b: p2[i], h1: h1[i], h2: h2[i] } },
        fly,
        highlight: { p1: [i], p2: [i], c1: [i], c2: [i] },
        auxActive: [i],
      });
    }
    T.snap({ type: 'done', text: { key: 'done', params: { eta } } });

    // Nube de otros hijos posibles con estos mismos padres y η, solo con los genes 1 y 2
    // (no se genera al reproducir sorteos concretos, p. ej. desde los tests).
    let cloud = [];
    if (!Array.isArray(opts.draws)) {
      for (let t = 0; t < CLOUD_TRIALS; t++) {
        // β independiente para cada uno de los dos genes que se representan, como en la traza real.
        const [g0h1, g0h2] = children(p1[0], p2[0], beta(rand(), eta));
        const [g1h1, g1h2] = children(p1[1], p2[1], beta(rand(), eta));
        cloud.push([g0h1, g1h1], [g0h2, g1h2]);
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
    id: 'sbx',
    representation: 'real',
    cuts: 0,
    aux: 'cloud',
    legend: ['p1', 'p2', 'cloud', 'cloudChild1', 'cloudChild2'],
    params: [{ id: 'eta', type: 'int', min: 1, max: 20, step: 1, default: 2 }],
    random: true,           // la página ofrece «Sortear de nuevo»
    run: (p1, p2, cuts, opts) => {
      const e = opts && opts.params && opts.params.eta;
      return sbx(p1, p2, typeof e === 'number' ? e : 2, { seed: opts && opts.seed, draws: opts && opts.draws });
    },
  };

  const api = { sbx, beta, validateParents: U.validateParents, spec };
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).operators = root.GAX.operators || {}).sbx = api;
})(typeof self !== 'undefined' ? self : this);
