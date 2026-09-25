/*
 * Operador de cruce OX (Order Crossover) para representación permutacional.
 *
 * Convención (la de las transparencias del curso):
 *   - El segmento central son las posiciones [c1, c2).
 *   - El Hijo 1 conserva el segmento del Padre 1 y toma el resto de genes del Padre 2,
 *     en el orden en que aparecen en él; el Hijo 2, al revés.
 *
 * Variantes (difieren en desde dónde se lee el otro padre y por dónde se empieza a rellenar):
 *   - 'from_start'    (por defecto): se lee el otro padre desde el principio y se rellena
 *                      a partir del segundo corte, dando la vuelta. Es la de las transparencias.
 *   - 'classic'       : se lee el otro padre empezando tras el segundo corte y se rellena
 *                      también desde ahí, dando la vuelta (Goldberg, 1989).
 *   - 'left_to_right' : se lee el otro padre desde el principio y se rellena de izquierda a derecha.
 *
 * La función es pura: devuelve los hijos y una traza de pasos con el estado completo en cada uno.
 */
(function (root) {
  'use strict';

  const U = (typeof module !== 'undefined' && module.exports) ? require('./perm-utils.js') : root.GAX.permUtils;
  const { validateParents, validateCuts, range } = U;

  const VARIANTS = ['from_start', 'classic', 'left_to_right'];
  const DEFAULT_VARIANT = 'from_start';

  /** Orden en que se leen los genes del otro padre y orden en que se rellenan los huecos. */
  function plan(own, other, c1, c2, variant) {
    const n = own.length;
    const taken = new Set(own.slice(c1, c2));
    const reading = variant === 'classic' ? other.slice(c2).concat(other.slice(0, c2)) : other.slice();
    const list = reading.filter((g) => !taken.has(g));
    const skipped = reading.filter((g) => taken.has(g));
    const positions = variant === 'left_to_right'
      ? range(0, c1).concat(range(c2, n))
      : range(c2, n).concat(range(0, c1));
    return { list, skipped, positions };
  }

  function ox(p1, p2, c1, c2, variant) {
    variant = variant || DEFAULT_VARIANT;
    if (VARIANTS.indexOf(variant) === -1) throw new Error('errVariant');
    const err = validateParents(p1, p2);
    if (err) throw new Error(err);
    const n = p1.length;
    if (!validateCuts(n, c1, c2)) throw new Error('errCuts');

    const seg = range(c1, c2);
    const children = [Array(n).fill(null), Array(n).fill(null)];
    const plans = [plan(p1, p2, c1, c2, variant), plan(p2, p1, c1, c2, variant)];
    const steps = [];
    const readKey = variant === 'classic' ? 'order_cut' : 'order_start';
    const posKey = variant === 'left_to_right' ? 'positions_left' : 'positions_cut';

    let segmentVisible = false;
    let auxVisible = false;
    let auxChild = 0;

    function snap(step) {
      steps.push(Object.assign({
        children: children.map((c) => c.map((g) => (g ? Object.assign({}, g) : null))),
        segmentVisible,
        auxVisible,
        auxChild,
        auxActive: [],
        auxPlaced: 0,
        highlight: {},
        conflict: {},
        slot: {},
        slotOrder: {},   // { c1: [posiciones en orden de relleno] }
        fly: [],
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

    const fly = [];
    seg.forEach((i) => {
      children[0][i] = { v: p1[i], origin: 'p1', kind: 'segment' };
      children[1][i] = { v: p2[i], origin: 'p2', kind: 'segment' };
      fly.push({ from: ['p1', i], to: ['c1', i] }, { from: ['p2', i], to: ['c2', i] });
    });
    snap({ type: 'copySeg', text: { key: 'copySeg' }, fly, highlight: { c1: seg, c2: seg } });

    [0, 1].forEach((k) => {
      const own = k === 0 ? p1 : p2;
      const other = k === 0 ? p2 : p1;
      const otherRow = k === 0 ? 'p2' : 'p1';
      const childRow = k === 0 ? 'c1' : 'c2';
      const { list, skipped, positions } = plans[k];
      const where = (g) => other.indexOf(g);
      auxChild = k;
      auxVisible = false;

      snap({
        type: 'childStart',
        child: k,
        text: { key: 'childStart', params: { child: k + 1, own: k + 1, other: 2 - k } },
        highlight: { [childRow]: seg },
        slot: { [childRow]: positions },
      });

      auxVisible = true;
      snap({
        type: 'order',
        child: k,
        text: {
          key: readKey,
          params: { other: 2 - k, child: k + 1, list: list.join(', '), skipped: skipped.join(', '), start: c2 + 1 },
        },
        highlight: { [otherRow]: list.map(where) },
      });

      snap({
        type: 'positions',
        child: k,
        text: { key: posKey, params: { child: k + 1, positions: positions.map((i) => i + 1).join(', ') } },
        slot: { [childRow]: positions },
        slotOrder: { [childRow]: positions },
      });

      positions.forEach((pos, j) => {
        const v = list[j];
        children[k][pos] = { v, origin: otherRow, kind: 'ordered' };
        snap({
          type: 'place',
          child: k,
          text: { key: 'place', params: { pos: pos + 1, v, j: j + 1, total: list.length, child: k + 1 } },
          fly: [{ from: [otherRow, where(v)], to: [childRow, pos] }],
          highlight: { [childRow]: [pos], [otherRow]: [where(v)] },
          slotOrder: { [childRow]: positions },
          auxActive: [j],
          auxPlaced: j,
        });
      });
    });

    auxVisible = false;
    snap({ type: 'done', text: { key: variant === 'left_to_right' ? 'done_linear' : 'done_cyclic' } });

    return {
      children: children.map((c) => c.map((g) => g.v)),
      steps,
      variant,
      aux: { type: 'order', items: plans.map((pl, k) => ({ list: pl.list, positions: pl.positions, donor: k === 0 ? 'p2' : 'p1' })) },
      segment: [c1, c2],
    };
  }

  const spec = {
    id: 'ox',
    representation: 'permutation',
    cuts: 2,
    segment: true,
    aux: 'order',
    legend: ['p1', 'p2', 'segment'],
    variants: VARIANTS,
    defaultVariant: DEFAULT_VARIANT,
    run: (p1, p2, cuts, opts) => ox(p1, p2, cuts[0], cuts[1], opts && opts.variant),
  };

  const api = { ox, plan, validateParents, validateCuts, spec, VARIANTS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else ((root.GAX = root.GAX || {}).operators = root.GAX.operators || {}).ox = api;
})(typeof self !== 'undefined' ? self : this);
