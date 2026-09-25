/*
 * Operador de cruce CX (Cycle Crossover) para representación permutacional.
 *
 * Cada gen del hijo ocupa la posición que tenía en uno de los padres. Las posiciones se agrupan
 * en ciclos: si la posición i se toma del padre S, el gen S[i] no puede venir del otro padre O,
 * así que la posición donde O tiene ese gen también debe tomarse de S, y así hasta volver a i.
 * El Hijo 2 es el complementario: en cada ciclo toma el gen del otro padre.
 *
 * Variantes (difieren en de qué padre se toma cada ciclo; cada ciclo empieza en la primera
 * posición todavía libre):
 *   - 'random'      (por defecto): el padre de cada ciclo se elige al azar (transparencias del curso).
 *   - 'first_cycle' : el primer ciclo, del Padre 1; todas las demás posiciones, del Padre 2 (Goldberg, 1989).
 *   - 'alternate'   : ciclos alternos: Padre 1, Padre 2, Padre 1…
 *
 * El sorteo es reproducible: usa un generador con semilla (opts.seed) o una lista fija de
 * elecciones (opts.choices, p. ej. ['p1', 'p2']) para reproducir un ejemplo concreto.
 */
(function (root) {
  'use strict';

  const isNode = typeof module !== 'undefined' && module.exports;
  const U = isNode ? require('./perm-utils.js') : root.GAX.permUtils;
  const R = isNode ? require('../rng.js') : root.GAX.rng;
  const { validateParents } = U;

  const VARIANTS = ['random', 'first_cycle', 'alternate'];
  const DEFAULT_VARIANT = 'random';

  function cx(p1, p2, variant, opts) {
    variant = variant || DEFAULT_VARIANT;
    opts = opts || {};
    if (VARIANTS.indexOf(variant) === -1) throw new Error('errVariant');
    const err = validateParents(p1, p2);
    if (err) throw new Error(err);
    const n = p1.length;
    const rand = R.mulberry32((opts.seed >>> 0) || 1);
    const scripted = Array.isArray(opts.choices) ? opts.choices.slice() : null;

    const children = [Array(n).fill(null), Array(n).fill(null)];
    const cycles = [];     // [{ positions: [...], src: 'p1'|'p2' }]
    const choices = [];    // padre elegido para cada ciclo (para reproducirlo)
    const steps = [];
    let auxVisible = false;

    function snap(step) {
      steps.push(Object.assign({
        children: children.map((c) => c.map((g) => (g ? Object.assign({}, g) : null))),
        segmentVisible: false,
        auxVisible,
        auxCycles: cycles.map((c) => ({ positions: c.positions.slice(), src: c.src, closed: !!c.closed })),
        auxActive: [],
        highlight: {},
        conflict: {},
        slot: {},
        slotOrder: {},
        links: [],       // [{ from: [fila, pos], to: [fila, pos] }] flechas entre padres
        fly: [],
        chain: null,
      }, step));
    }

    snap({ type: 'intro', text: { key: 'intro', params: { n } } });

    let k = 0;
    while (children[0].indexOf(null) !== -1) {
      const start = children[0].indexOf(null);

      // Goldberg: tras el primer ciclo, todo lo que queda se toma del Padre 2 en un solo paso.
      if (variant === 'first_cycle' && k > 0) {
        const rest = [];
        for (let i = 0; i < n; i++) {
          if (children[0][i]) continue;
          children[0][i] = { v: p2[i], origin: 'p2', kind: 'cycle' };
          children[1][i] = { v: p1[i], origin: 'p1', kind: 'cycle' };
          rest.push(i);
        }
        const fly = [];
        rest.forEach((i) => fly.push({ from: ['p2', i], to: ['c1', i] }, { from: ['p1', i], to: ['c2', i] }));
        snap({
          type: 'fillRest',
          text: { key: 'fillRest', params: { positions: rest.map((i) => i + 1).join(', ') } },
          fly,
          highlight: { c1: rest, c2: rest },
        });
        break;
      }

      let src;
      if (variant === 'random') {
        src = scripted && scripted.length ? scripted.shift() : (rand() < 0.5 ? 'p1' : 'p2');
      } else if (variant === 'alternate') {
        src = k % 2 === 0 ? 'p1' : 'p2';
      } else {
        src = 'p1';
      }
      choices.push(src);
      const S = src === 'p1' ? p1 : p2;
      const O = src === 'p1' ? p2 : p1;
      const oth = src === 'p1' ? 'p2' : 'p1';
      const cycle = { positions: [], src };
      cycles.push(cycle);
      auxVisible = true;

      const startKey = variant === 'random' ? 'cycleStartRandom' : (variant === 'alternate' ? 'cycleStartAlternate' : 'cycleStartFirst');
      snap({
        type: 'cycleStart',
        text: { key: startKey, params: { k: k + 1, pos: start + 1, a: p1[start], b: p2[start], v: S[start], src: src === 'p1' ? 1 : 2 } },
        highlight: { p1: [start], p2: [start] },
        slot: { c1: [start], c2: [start] },
        auxActive: [k],
      });

      let i = start;
      for (let guard = 0; guard <= n; guard++) {
        children[0][i] = { v: S[i], origin: src, kind: 'cycle' };
        children[1][i] = { v: O[i], origin: oth, kind: 'cycle' };
        cycle.positions.push(i);
        const j = O.indexOf(S[i]);   // dónde tiene el otro padre ese mismo gen
        const closes = j === start;
        snap({
          type: closes ? 'cycleClose' : 'cycleStep',
          text: {
            key: closes ? 'cycleClose' : 'cycleStep',
            params: {
              pos: i + 1, v: S[i], w: O[i], src: src === 'p1' ? 1 : 2, oth: oth === 'p1' ? 1 : 2,
              next: j + 1, nextV: S[j], k: k + 1, start: start + 1,
              positions: cycle.positions.map((x) => x + 1).join(' → '),
            },
          },
          fly: [{ from: [src, i], to: ['c1', i] }, { from: [oth, i], to: ['c2', i] }],
          highlight: { [src]: closes ? cycle.positions.slice() : [i, j], [oth]: [j], c1: [i], c2: [i] },
          links: [{ from: [src, i], to: [oth, j] }],
          auxActive: [k],
        });
        if (closes) break;
        i = j;
      }
      cycle.closed = true;
      k++;
    }

    auxVisible = true;
    snap({ type: 'done', text: { key: variant === 'first_cycle' ? 'doneFirst' : 'done', params: { cycles: cycles.length } } });

    return {
      children: children.map((c) => c.map((g) => g.v)),
      steps,
      variant,
      choices,
      cycles: cycles.map((c) => ({ positions: c.positions.slice(), src: c.src })),
      aux: { type: 'cycles', items: [] },
    };
  }

  const spec = {
    id: 'cx',
    representation: 'permutation',
    cuts: 0,
    segment: false,
    aux: 'cycles',
    legend: ['p1', 'p2', 'link'],
    links: true,                  // deja espacio entre los padres para las flechas
    variants: VARIANTS,
    defaultVariant: DEFAULT_VARIANT,
    randomVariants: ['random'],   // variantes con sorteo: la página ofrece «Sortear de nuevo»
    run: (p1, p2, cuts, opts) => cx(p1, p2, opts && opts.variant, { seed: opts && opts.seed, choices: opts && opts.choices }),
  };

  const api = { cx, validateParents, spec, VARIANTS };
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).operators = root.GAX.operators || {}).cx = api;
})(typeof self !== 'undefined' ? self : this);
