/*
 * Contraejemplo: cruce en un punto (el clásico de la representación binaria) aplicado a
 * permutaciones. Sirve para ver por qué hacen falta operadores específicos: los hijos
 * pueden repetir genes y perder otros.
 *
 *   Hijo 1 = cabeza del Padre 1 (posiciones [0, c)) + cola del Padre 2 (posiciones [c, n))
 *   Hijo 2 = cabeza del Padre 2 + cola del Padre 1
 */
(function (root) {
  'use strict';

  const isNode = typeof module !== 'undefined' && module.exports;
  const U = isNode ? require('./perm-utils.js') : root.GAX.permUtils;
  const { validateParents, range } = U;

  /** Genes repetidos y genes que faltan en un hijo de longitud n (valores 1..n). */
  function defects(child) {
    const n = child.length;
    const count = new Map();
    child.forEach((g) => count.set(g, (count.get(g) || 0) + 1));
    const repeated = [...count.keys()].filter((g) => count.get(g) > 1).sort((a, b) => a - b);
    const missing = range(1, n + 1).filter((g) => !count.has(g));
    return { repeated, missing, positions: range(0, n).filter((i) => count.get(child[i]) > 1) };
  }

  function onePointPerm(p1, p2, c) {
    const err = validateParents(p1, p2);
    if (err) throw new Error(err);
    const n = p1.length;
    if (!Number.isInteger(c) || c < 1 || c > n - 1) throw new Error('errCuts');

    const head = range(0, c);
    const tail = range(c, n);
    const children = [Array(n).fill(null), Array(n).fill(null)];
    const steps = [];
    let auxVisible = false;

    function snap(step) {
      steps.push(Object.assign({
        children: children.map((ch) => ch.map((g) => (g ? Object.assign({}, g) : null))),
        segmentVisible: true,
        auxVisible,
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

    snap({ type: 'intro', text: { key: 'intro', params: { n } } });
    snap({ type: 'cut', text: { key: 'cut', params: { c, c1: c + 1, n } }, highlight: { p1: head, p2: head } });

    let fly = [];
    head.forEach((i) => {
      children[0][i] = { v: p1[i], origin: 'p1', kind: 'segment' };
      children[1][i] = { v: p2[i], origin: 'p2', kind: 'segment' };
      fly.push({ from: ['p1', i], to: ['c1', i] }, { from: ['p2', i], to: ['c2', i] });
    });
    snap({ type: 'heads', text: { key: 'heads', params: { c } }, fly, highlight: { p1: head, p2: head, c1: head, c2: head } });

    fly = [];
    tail.forEach((i) => {
      children[0][i] = { v: p2[i], origin: 'p2', kind: 'segment' };
      children[1][i] = { v: p1[i], origin: 'p1', kind: 'segment' };
      fly.push({ from: ['p2', i], to: ['c1', i] }, { from: ['p1', i], to: ['c2', i] });
    });
    snap({ type: 'tails', text: { key: 'tails', params: { c1: c + 1, n } }, fly, highlight: { p1: tail, p2: tail, c1: tail, c2: tail } });

    const h1 = children[0].map((g) => g.v);
    const h2 = children[1].map((g) => g.v);
    const d = [defects(h1), defects(h2)];
    const valid = d[0].repeated.length === 0;   // si un hijo es válido, el otro también
    auxVisible = !valid;
    snap({
      type: 'check',
      text: valid
        ? { key: 'checkNone' }
        : { key: 'checkBoth', params: { d1: d[0].repeated.join(', '), m1: d[0].missing.join(', '), d2: d[1].repeated.join(', '), m2: d[1].missing.join(', ') } },
      conflict: { c1: d[0].positions, c2: d[1].positions },
      highlight: { c1: d[0].positions, c2: d[1].positions },
    });
    snap({ type: 'done', text: { key: valid ? 'doneLucky' : 'done' }, conflict: { c1: d[0].positions, c2: d[1].positions } });

    return {
      children: [h1, h2],
      steps,
      valid,
      defects: d,
      aux: { type: 'missing', items: d.map((x) => ({ missing: x.missing, repeated: x.repeated })) },
    };
  }

  const spec = {
    id: 'one-point-perm',
    representation: 'permutation',
    cuts: 1,
    segment: false,
    aux: 'missing',
    legend: ['p1', 'p2', 'conflict'],
    invalidChildren: true,        // a propósito: los hijos pueden no ser permutaciones
    run: (p1, p2, cuts) => onePointPerm(p1, p2, cuts[0]),
  };

  const api = { onePointPerm, defects, validateParents, spec };
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).operators = root.GAX.operators || {})['one-point-perm'] = api;
})(typeof self !== 'undefined' ? self : this);
