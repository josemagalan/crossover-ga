/*
 * Operador de cruce ERX (Edge Recombination Crossover) para representación permutacional.
 *
 * Whitley, Starkweather y Fuquay (1989): el hijo intenta heredar las aristas de los padres, es
 * decir, los pares de genes vecinos. Los padres se leen como circuitos (el último gen es vecino
 * del primero) y sin sentido (la arista a–b es la misma que b–a).
 *
 *   1. Tabla de adyacencias: para cada gen, sus vecinos en cualquiera de los dos padres (2 a 4).
 *   2. Se empieza por un gen y se tacha de todas las listas.
 *   3. Si al gen actual le quedan vecinos, el siguiente es el vecino con la lista más corta
 *      (empate: al azar). Si no le quedan («callejón sin salida»), un gen sin usar, al azar.
 *   4. Se tacha el elegido de todas las listas y se repite hasta completar el hijo.
 *
 * Convenciones de esta herramienta: el Hijo 1 empieza por el primer gen del Padre 1 y el Hijo 2,
 * por el primer gen del Padre 2, con la tabla completa en cada uno. Los candidatos se consideran
 * en orden creciente, y solo se sortea cuando hay más de uno: se toma el de índice
 * ⌊r · k⌋ entre los k posibles, con r un número aleatorio en [0, 1).
 *
 * Variantes:
 *   - 'original' (por defecto): la regla de la lista más corta (Whitley et al., 1989).
 *   - 'enhanced': primero las aristas que comparten los dos padres (Starkweather et al., 1991).
 *
 * El sorteo es reproducible: generador con semilla (opts.seed) o lista fija de números
 * (opts.draws). Devuelve también `draws` (números usados) y `picks` (decisiones al azar).
 */
(function (root) {
  'use strict';

  const isNode = typeof module !== 'undefined' && module.exports;
  const U = isNode ? require('./perm-utils.js') : root.GAX.permUtils;
  const R = isNode ? require('../rng.js') : root.GAX.rng;
  const { validateParents } = U;

  const VARIANTS = ['original', 'enhanced'];
  const DEFAULT_VARIANT = 'original';

  const key = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);

  /** Aristas (sin sentido) de un circuito. */
  function edgeSet(p) {
    const s = new Set();
    for (let i = 0; i < p.length; i++) s.add(key(p[i], p[(i + 1) % p.length]));
    return s;
  }

  /** Tabla de adyacencias: gen → vecinos en orden creciente, con el padre del que viene cada arista. */
  function adjacency(p1, p2) {
    const e1 = edgeSet(p1);
    const e2 = edgeSet(p2);
    const table = {};
    p1.forEach((g) => { table[g] = new Set(); });
    [p1, p2].forEach((p) => p.forEach((g, i) => {
      table[g].add(p[(i + p.length - 1) % p.length]);
      table[g].add(p[(i + 1) % p.length]);
    }));
    const out = {};
    Object.keys(table).forEach((g) => {
      out[g] = [...table[g]].sort((a, b) => a - b).map((v) => {
        const k = key(Number(g), v);
        const m = e1.has(k) && e2.has(k) ? 'both' : e1.has(k) ? 'p1' : 'p2';
        return { v, m };
      });
    });
    return out;
  }

  function erx(p1, p2, variant, opts) {
    variant = variant || DEFAULT_VARIANT;
    opts = opts || {};
    if (VARIANTS.indexOf(variant) === -1) throw new Error('errVariant');
    const err = validateParents(p1, p2);
    if (err) throw new Error(err);
    const n = p1.length;
    const rand = R.mulberry32((opts.seed >>> 0) || 1);
    const scripted = Array.isArray(opts.draws) ? opts.draws.slice() : null;
    const draws = [];
    const picks = [];
    const draw = () => {
      const r = scripted ? scripted.shift() : rand();
      draws.push(r);
      return r;
    };

    const table = adjacency(p1, p2);
    const genes = p1.slice().sort((a, b) => a - b);
    const children = [Array(n).fill(null), Array(n).fill(null)];
    const steps = [];
    const results = [];
    let removed = new Set();
    let auxVisible = false;
    let auxChild = 0;

    const listsNow = () => genes.map((g) => table[g].map((e) => ({ v: e.v, m: e.m, removed: removed.has(e.v) })));
    const left = (g) => table[g].filter((e) => !removed.has(e.v));

    function snap(step) {
      steps.push(Object.assign({
        children: children.map((c) => c.map((x) => (x ? Object.assign({}, x) : null))),
        segmentVisible: false,
        auxVisible,
        auxChild,
        auxLists: listsNow(),
        auxCurrent: null,
        auxCand: [],
        auxChosen: null,
        auxUsed: [...removed],
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
    auxVisible = true;
    snap({ type: 'table', text: { key: variant === 'enhanced' ? 'tableEnhanced' : 'table' } });

    [0, 1].forEach((k) => {
      const own = k === 0 ? p1 : p2;
      const row = k === 0 ? 'c1' : 'c2';
      const ownRow = k === 0 ? 'p1' : 'p2';
      auxChild = k;
      removed = new Set();
      const child = [];

      const place = (v, g) => {
        children[k][child.length] = g;
        child.push(v);
        removed.add(v);
      };

      const start = own[0];
      place(start, { v: start, origin: ownRow, kind: 'segment' });
      snap({
        type: 'start',
        text: { key: k === 0 ? 'start' : 'start2', params: { child: k + 1, v: start } },
        fly: [{ from: [ownRow, 0], to: [row, 0] }],
        highlight: { [ownRow]: [0], [row]: [0] },
        auxCurrent: start,
      });

      let current = start;
      while (child.length < n) {
        const pos = child.length;
        const avail = left(current);
        let v;
        let type;
        let params;
        let g;
        let cand = avail.map((e) => e.v);
        if (avail.length) {
          let pool = avail;
          const common = avail.filter((e) => e.m === 'both');
          const useCommon = variant === 'enhanced' && common.length > 0;
          if (useCommon) pool = common;
          const count = (x) => left(x).length;
          const fewest = Math.min(...pool.map((e) => count(e.v)));
          const ties = pool.filter((e) => count(e.v) === fewest).map((e) => e.v);
          if (ties.length > 1) {
            v = ties[Math.floor(draw() * ties.length)];
            picks.push({ child: k, kind: 'tie', options: ties.slice(), pick: v });
          } else {
            v = ties[0];
          }
          const edge = avail.find((e) => e.v === v);
          const list = avail.map((e) => `${e.v} (${count(e.v)})`).join(', ');
          type = ties.length > 1 ? 'pickTie' : 'pick';
          params = {
            cur: current, v, cnt: fewest, list, ties: ties.join(', '),
            common: common.map((e) => e.v).join(', '),
          };
          if (useCommon) type = ties.length > 1 ? 'pickCommonTie' : 'pickCommon';
          g = edge.m === 'both' ? { v, origin: 'both', kind: 'both' } : { v, origin: edge.m, kind: 'segment' };
          if (useCommon) cand = common.map((e) => e.v);
        } else {
          const unused = genes.filter((x) => !removed.has(x));
          if (unused.length > 1) {
            v = unused[Math.floor(draw() * unused.length)];
            picks.push({ child: k, kind: 'jump', options: unused.slice(), pick: v });
          } else {
            v = unused[0];
          }
          type = unused.length > 1 ? 'deadEnd' : 'deadEndLast';
          params = { cur: current, v, unused: unused.join(', ') };
          g = { v, origin: ownRow, kind: 'jump' };
          cand = [];
        }

        // De qué padre sale la arista (para el vuelo y el resaltado): el primero que la tenga
        const src = g.kind === 'jump' ? ownRow : (g.origin === 'p2' ? 'p2' : 'p1');   // arista común: se muestra en el Padre 1
        const S = src === 'p1' ? p1 : p2;
        place(v, g);
        const hl = { [row]: [pos] };
        if (g.kind !== 'jump') hl[src] = [S.indexOf(current), S.indexOf(v)];
        snap({
          type: g.kind === 'jump' ? 'deadEnd' : 'pick',
          text: { key: type, params },
          fly: [{ from: [src, S.indexOf(v)], to: [row, pos] }],
          highlight: hl,
          auxCurrent: current,
          auxCand: cand,
          auxChosen: v,
        });
        current = v;
      }
      results.push(child);
    });

    // Aristas del circuito de cada hijo que no están en ningún padre
    const e1 = edgeSet(p1);
    const e2 = edgeSet(p2);
    const fresh = results.map((c) => [...edgeSet(c)].filter((e) => !e1.has(e) && !e2.has(e)).length);
    snap({ type: 'done', text: { key: 'done', params: { n, new1: fresh[0], new2: fresh[1] } } });

    return {
      children: results,
      steps,
      variant,
      draws,
      picks,
      newEdges: fresh,
      aux: { type: 'edges', items: genes },
    };
  }

  const spec = {
    id: 'erx',
    representation: 'permutation',
    cuts: 0,
    segment: false,
    aux: 'edges',
    legend: ['p1', 'p2', 'both', 'jump'],
    variants: VARIANTS,
    defaultVariant: DEFAULT_VARIANT,
    random: true,   // empates y callejones sin salida: la página ofrece «Sortear de nuevo»
    run: (p1, p2, cuts, opts) => erx(p1, p2, opts && opts.variant, { seed: opts && opts.seed, draws: opts && opts.draws }),
  };

  const api = { erx, adjacency, edgeSet, validateParents, spec, VARIANTS };
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).operators = root.GAX.operators || {}).erx = api;
})(typeof self !== 'undefined' ? self : this);
