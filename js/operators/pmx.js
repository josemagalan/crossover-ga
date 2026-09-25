/*
 * Operador de cruce PMX (Partially Mapped Crossover) para representación permutacional.
 *
 * Convención (la de las transparencias del curso):
 *   - El segmento central son las posiciones [c1, c2).
 *   - El Hijo 1 recibe el segmento del Padre 2 y se completa con el Padre 1.
 *   - El Hijo 2 recibe el segmento del Padre 1 y se completa con el Padre 2.
 *   - Si un gen ya está en el hijo, se sigue la tabla de correspondencias
 *     (pares P1[i] <-> P2[i] del segmento) hasta encontrar uno que no esté.
 *
 * La función es pura: devuelve los hijos y una traza de pasos (cada paso lleva
 * una instantánea completa del estado) que la vista se limita a dibujar.
 */
(function (root) {
  'use strict';

  /** Devuelve null si p1 y p2 son permutaciones válidas de 1..n, o una clave de error. */
  function validateParents(p1, p2) {
    if (!Array.isArray(p1) || !Array.isArray(p2)) return 'errFormat';
    if (p1.length !== p2.length) return 'errLength';
    const n = p1.length;
    if (n < 5 || n > 12) return 'errRange';
    const isPerm = (p) => {
      if (p.some((v) => !Number.isInteger(v))) return false;
      const s = new Set(p);
      return s.size === n && p.every((v) => v >= 1 && v <= n);
    };
    if (!isPerm(p1) || !isPerm(p2)) return 'errPerm';
    return null;
  }

  function validateCuts(n, c1, c2) {
    return Number.isInteger(c1) && Number.isInteger(c2) &&
      c1 >= 0 && c2 <= n && c2 - c1 >= 1 && c2 - c1 <= n - 1;
  }

  function range(a, b) {
    const r = [];
    for (let i = a; i < b; i++) r.push(i);
    return r;
  }

  function pmx(p1, p2, c1, c2) {
    const err = validateParents(p1, p2);
    if (err) throw new Error(err);
    const n = p1.length;
    if (!validateCuts(n, c1, c2)) throw new Error('errCuts');

    const seg = range(c1, c2);
    const outside = range(0, n).filter((i) => i < c1 || i >= c2);
    const pairs = seg.map((i) => ({ pos: i, a: p1[i], b: p2[i] }));
    const children = [Array(n).fill(null), Array(n).fill(null)];
    const steps = [];

    let segmentVisible = false;
    let pairsVisible = false;

    // Añade un paso con una copia profunda del estado actual.
    function snap(step) {
      steps.push(Object.assign({
        children: children.map((c) => c.map((g) => (g ? Object.assign({}, g) : null))),
        segmentVisible,
        pairsVisible,
        activePairs: [],
        highlight: {},   // { p1:[pos], p2:[pos], c1:[pos], c2:[pos] }
        conflict: {},    // { c1:[pos] } genes duplicados
        slot: {},        // { c1:[pos] } hueco que se está rellenando
        fly: [],         // [{ from:[row,pos], to:[row,pos] }]
        chain: null,
      }, step));
    }

    snap({ type: 'intro', text: { key: 'intro', params: { n } } });

    segmentVisible = true;
    snap({
      type: 'segment',
      text: { key: 'segment', params: { from: c1 + 1, to: c2, len: c2 - c1 } },
      highlight: { p1: seg, p2: seg },
    });

    // Intercambio de segmentos
    const swapFly = [];
    seg.forEach((i) => {
      children[0][i] = { v: p2[i], origin: 'p2', kind: 'segment' };
      children[1][i] = { v: p1[i], origin: 'p1', kind: 'segment' };
      swapFly.push({ from: ['p2', i], to: ['c1', i] }, { from: ['p1', i], to: ['c2', i] });
    });
    snap({ type: 'swap', text: { key: 'swap' }, fly: swapFly, highlight: { c1: seg, c2: seg } });

    // Tabla de correspondencias
    pairsVisible = true;
    snap({
      type: 'mapping',
      text: { key: 'mapping', params: { pairs: pairs.map((p) => `${p.a} ↔ ${p.b}`).join(', ') } },
      activePairs: pairs.map((_, k) => k),
      highlight: { p1: seg, p2: seg },
    });

    // Relleno de cada hijo
    [0, 1].forEach((k) => {
      const src = k === 0 ? p1 : p2;       // padre que aporta los genes de fuera del segmento
      const other = k === 0 ? p2 : p1;     // padre cuyo segmento está en el hijo
      const srcRow = k === 0 ? 'p1' : 'p2';
      const childRow = k === 0 ? 'c1' : 'c2';
      const segIndexOf = new Map(seg.map((i) => [other[i], i]));

      snap({
        type: 'childStart',
        child: k,
        text: { key: 'childStart', params: { child: k + 1, parent: k + 1 } },
        highlight: { [srcRow]: outside },
        slot: { [childRow]: outside },
      });

      outside.forEach((i) => {
        let v = src[i];
        if (!segIndexOf.has(v)) {
          children[k][i] = { v, origin: srcRow, kind: 'direct' };
          snap({
            type: 'copy',
            child: k,
            text: { key: 'copy', params: { pos: i + 1, v, parent: k + 1, child: k + 1 } },
            fly: [{ from: [srcRow, i], to: [childRow, i] }],
            highlight: { [srcRow]: [i], [childRow]: [i] },
          });
          return;
        }

        const chain = [v];
        let j = segIndexOf.get(v);
        snap({
          type: 'conflict',
          child: k,
          text: { key: 'conflict', params: { pos: i + 1, v, child: k + 1, segPos: j + 1 } },
          highlight: { [srcRow]: [i] },
          conflict: { [childRow]: [j] },
          slot: { [childRow]: [i] },
          chain: chain.slice(),
        });

        for (let guard = 0; guard <= n; guard++) {
          const w = src[j];                 // par other[j] <-> src[j]
          chain.push(w);
          const pairIdx = j - c1;
          if (segIndexOf.has(w)) {
            const j2 = segIndexOf.get(w);
            snap({
              type: 'mapStep',
              child: k,
              text: { key: 'mapAgain', params: { v, w, child: k + 1, segPos: j2 + 1 } },
              activePairs: [pairIdx],
              highlight: { p1: [j], p2: [j] },
              conflict: { [childRow]: [j2] },
              slot: { [childRow]: [i] },
              chain: chain.slice(),
            });
            v = w;
            j = j2;
          } else {
            snap({
              type: 'mapStep',
              child: k,
              text: { key: 'mapOk', params: { v, w, child: k + 1 } },
              activePairs: [pairIdx],
              highlight: { p1: [j], p2: [j] },
              slot: { [childRow]: [i] },
              chain: chain.slice(),
            });
            children[k][i] = { v: w, origin: srcRow, kind: 'mapped' };
            snap({
              type: 'place',
              child: k,
              text: { key: 'place', params: { w, pos: i + 1, child: k + 1, chain: chain.join(' → ') } },
              fly: [{ from: [srcRow, j], to: [childRow, i] }],
              highlight: { [childRow]: [i] },
              chain: chain.slice(),
            });
            break;
          }
        }
      });
    });

    const c1v = children[0].map((g) => g.v);
    const c2v = children[1].map((g) => g.v);
    const kept1 = outside.filter((i) => c1v[i] === p1[i]).length;
    const kept2 = outside.filter((i) => c2v[i] === p2[i]).length;
    snap({
      type: 'done',
      text: { key: 'done', params: { k1: kept1, k2: kept2, out: outside.length } },
    });

    return { children: [c1v, c2v], steps, pairs, segment: [c1, c2] };
  }

  const api = { pmx, validateParents, validateCuts };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else ((root.GAX = root.GAX || {}).operators = root.GAX.operators || {}).pmx = api;
})(typeof self !== 'undefined' ? self : this);
