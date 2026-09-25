/*
 * Utilidades de la representación binaria y motor común de los cruces por máscara.
 *
 * Syswerda (1989) describe los cruces de un punto, dos puntos y uniforme con una misma idea:
 * una máscara de cruce, un bit por posición. Con 0, cada hijo copia el gen de su propio padre;
 * con 1, los hijos intercambian el gen (el Hijo 1 toma el del Padre 2 y el Hijo 2, el del Padre 1).
 * Los operadores solo difieren en cómo se forma la máscara.
 */
(function (root) {
  'use strict';

  const isNode = typeof module !== 'undefined' && module.exports;
  const R = isNode ? require('../rng.js') : root.GAX.rng;

  /** null si p1 y p2 son cadenas de bits válidas de la misma longitud (5 <= n <= 12), o una clave de error. */
  function validateParents(p1, p2) {
    if (!Array.isArray(p1) || !Array.isArray(p2)) return 'errFormat';
    if (p1.length !== p2.length) return 'errLength';
    const n = p1.length;
    if (n < 5 || n > 12) return 'errRange';
    if (!p1.concat(p2).every((b) => b === 0 || b === 1)) return 'errBits';
    return null;
  }

  function randomBits(rng, n) {
    return Array.from({ length: n }, () => (rng() < 0.5 ? 1 : 0));
  }

  /** Máscara de los cruces por cortes: el bit cambia de valor en cada corte (empieza en 0). */
  function maskFromCuts(n, cuts) {
    const mask = [];
    let bit = 0;
    let j = 0;
    for (let i = 0; i < n; i++) {
      while (j < cuts.length && cuts[j] === i) { bit = 1 - bit; j++; }
      mask.push(bit);
    }
    return mask;
  }

  /** Tramos [desde, hasta) con máscara 1, para sombrearlos en la vista. */
  function bandsFromMask(mask) {
    const bands = [];
    let start = -1;
    mask.concat([0]).forEach((b, i) => {
      if (b === 1 && start < 0) start = i;
      if (b !== 1 && start >= 0) { bands.push([start, i]); start = -1; }
    });
    return bands;
  }

  function positionsWhere(mask, bit) {
    const r = [];
    mask.forEach((b, i) => { if (b === bit) r.push(i); });
    return r;
  }

  function newTrace(n) {
    const children = [Array(n).fill(null), Array(n).fill(null)];
    const steps = [];
    const st = { segmentVisible: false, auxVisible: false, maskShown: [] };
    function snap(step) {
      steps.push(Object.assign({
        children: children.map((c) => c.map((g) => (g ? Object.assign({}, g) : null))),
        segmentVisible: st.segmentVisible,
        auxVisible: st.auxVisible,
        maskShown: st.maskShown.slice(),
        auxActive: [],
        highlight: {},
        conflict: {},
        slot: {},
        slotOrder: {},
        links: [],
        fly: [],
        chain: null,
      }, step));
    }
    function place(i, swap, p1, p2) {
      children[0][i] = { v: swap ? p2[i] : p1[i], origin: swap ? 'p2' : 'p1', kind: 'segment' };
      children[1][i] = { v: swap ? p1[i] : p2[i], origin: swap ? 'p1' : 'p2', kind: 'segment' };
      return swap
        ? [{ from: ['p2', i], to: ['c1', i] }, { from: ['p1', i], to: ['c2', i] }]
        : [{ from: ['p1', i], to: ['c1', i] }, { from: ['p2', i], to: ['c2', i] }];
    }
    return { children, steps, st, snap, place };
  }

  function doneStep(snap, p1, p2, mask) {
    const same = p1.filter((b, i) => b === p2[i]).length;
    const swapped = mask.filter((b) => b === 1).length;
    snap({ type: 'done', text: { key: same ? 'done' : 'doneNoSame', params: { same, swapped, kept: mask.length - swapped } } });
  }

  /**
   * Traza de un cruce por cortes (un punto, dos puntos, n puntos): se eligen los cortes, se ve
   * la máscara que equivalen, se copian las posiciones con 0 y se intercambian las de 1.
   */
  function cutsTrace(p1, p2, cuts) {
    const n = p1.length;
    const mask = maskFromCuts(n, cuts);
    cuts = cuts.filter((c) => c > 0 && c < n);   // un corte en 0 o en n no se nombra
    const T = newTrace(n);
    T.snap({ type: 'intro', text: { key: 'intro', params: { n } } });
    T.snap({
      type: 'cuts',
      text: { key: cuts.length === 1 ? 'cutsOne' : 'cutsMany', params: { c: cuts[0], list: cuts.join(', '), k: cuts.length } },
    });
    T.st.auxVisible = true;
    T.st.maskShown = mask.map((_, i) => i);
    T.st.segmentVisible = true;
    T.snap({ type: 'mask', text: { key: 'mask', params: { mask: mask.join('') } } });
    const keep = positionsWhere(mask, 0);
    const swap = positionsWhere(mask, 1);
    let fly = [];
    keep.forEach((i) => { fly = fly.concat(T.place(i, false, p1, p2)); });
    T.snap({ type: 'keep', text: { key: 'keep', params: { positions: keep.map((i) => i + 1).join(', ') } }, fly, highlight: { c1: keep, c2: keep }, auxActive: keep });
    fly = [];
    swap.forEach((i) => { fly = fly.concat(T.place(i, true, p1, p2)); });
    T.snap({ type: 'swap', text: { key: 'swap', params: { positions: swap.map((i) => i + 1).join(', ') } }, fly, highlight: { c1: swap, c2: swap }, auxActive: swap });
    doneStep(T.snap, p1, p2, mask);
    return {
      children: T.children.map((c) => c.map((g) => g.v)),
      steps: T.steps,
      mask,
      bands: bandsFromMask(mask),
      aux: { type: 'mask', items: mask },
    };
  }

  /**
   * Traza del cruce uniforme, común a las representaciones binaria y real (los genes se copian
   * tal cual; solo cambia qué valores contienen). Se intercambia la posición i si un número
   * aleatorio r_i en [0, 1) cumple r_i <= p. El sorteo es reproducible (opts.seed) o se puede
   * fijar (opts.draws, lista de r_i). No valida los padres: lo hace cada operador.
   */
  function uniformTrace(p1, p2, p, opts) {
    if (!(p > 0 && p <= 1)) throw new Error('errParam');
    opts = opts || {};
    const n = p1.length;
    const rand = R.mulberry32((opts.seed >>> 0) || 1);
    // Sorteos redondeados a centésimas, para que la narración muestre exactamente el número comparado con p.
    const draws = Array.isArray(opts.draws) ? opts.draws.slice(0, n) : Array.from({ length: n }, () => Math.floor(rand() * 100) / 100);
    const mask = draws.map((r) => (r <= p ? 1 : 0));

    const T = newTrace(n);
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
    doneStep(T.snap, p1, p2, mask);
    return {
      children: T.children.map((c) => c.map((g) => g.v)),
      steps: T.steps,
      mask,
      draws,
      bands: bandsFromMask(mask),
      aux: { type: 'mask', items: mask },
    };
  }

  const api = { validateParents, randomBits, maskFromCuts, bandsFromMask, positionsWhere, newTrace, doneStep, cutsTrace, uniformTrace, R };
  if (isNode) module.exports = api;
  else (root.GAX = root.GAX || {}).binUtils = api;
})(typeof self !== 'undefined' ? self : this);
