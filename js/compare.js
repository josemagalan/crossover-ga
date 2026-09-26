/*
 * Comparación de operadores de una misma representación con los mismos padres:
 * qué conserva cada uno de la información de los padres.
 *
 * Lógica pura (sin DOM), usada por la pantalla «Comparar operadores» y por los tests.
 *
 *   compare({ rep, ops, p1, p2, cuts, from, variant, params, draw, reps, seed })
 *     ops: [{ id, spec }] en el orden en que se muestran
 *     → [{ id, cuts, params, variant, children, genes, example, mean }]
 *
 * example: métricas del ejemplo (media de sus dos hijos); mean: media de `reps`
 * repeticiones con los mismos padres y cortes y sorteos al azar (y los mismos parámetros),
 * o null si reps = 0.
 */
(function (root) {
  'use strict';

  const isNode = typeof module !== 'undefined' && module.exports;
  const R = isNode ? require('./rng.js') : root.GAX.rng;

  const EPS = 1e-9;

  // Métricas de cada representación, en el orden de las columnas.
  // kind: 'pct' (fracción entre 0 y 1) o 'num' (número sin tope fijo).
  const METRICS = {
    permutation: [
      { id: 'position', kind: 'pct' },
      { id: 'order', kind: 'pct' },
      { id: 'adjacency', kind: 'pct' },
      { id: 'clone', kind: 'pct' },
      { id: 'valid', kind: 'pct' },
    ],
    binary: [
      { id: 'own', kind: 'pct' },
      { id: 'segments', kind: 'num' },
    ],
    real: [
      { id: 'copied', kind: 'pct' },
      { id: 'inside', kind: 'pct' },
      { id: 'distance', kind: 'num' },
    ],
  };

  // ---------- Métricas de un hijo ----------

  /** Primera posición de cada gen (un hijo no válido puede repetir genes o no tenerlos). */
  function firstIndex(arr) {
    const m = new Map();
    arr.forEach((g, i) => { if (!m.has(g)) m.set(g, i); });
    return m;
  }

  // Aristas del circuito (sin sentido y cerrando el ciclo: el último gen es vecino del primero).
  const edgeKey = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);
  function edges(arr) {
    const s = new Set();
    for (let i = 0; i < arr.length; i++) s.add(edgeKey(arr[i], arr[(i + 1) % arr.length]));
    return s;
  }

  /**
   * Sentido en que se recorren tres genes al leer el cromosoma como un circuito:
   * true si aparecen como a → b → c (empezando por cualquiera de ellos), false si como a → c → b.
   */
  function clockwise(idx, a, b, c) {
    const x = idx.get(a);
    const y = idx.get(b);
    const z = idx.get(c);
    return (x < y) + (y < z) + (z < x) === 2;
  }

  /**
   * Permutación. El cromosoma se lee como un circuito (una ruta del viajante): sin principio
   * ni fin y en cualquier sentido para las adyacencias.
   *  position:  genes en la misma posición que en alguno de los padres.
   *  order:     de los tríos de genes que los dos padres recorren en el mismo sentido,
   *             los que el hijo también recorre en ese sentido (orden relativo circular).
   *  adjacency: aristas del circuito del hijo que ya estaban en alguno de los padres.
   *  clone:     1 si el hijo es idéntico a uno de los padres.
   *  valid:     1 si el hijo es una permutación (sin repetidos), 0 si no.
   */
  function permMetrics(child, p1, p2) {
    const n = child.length;
    let pos = 0;
    for (let i = 0; i < n; i++) if (child[i] === p1[i] || child[i] === p2[i]) pos++;

    const i1 = firstIndex(p1);
    const i2 = firstIndex(p2);
    const ic = firstIndex(child);
    const genes = p1.slice().sort((a, b) => a - b);
    let agree = 0;
    let kept = 0;
    for (let x = 0; x < n; x++) {
      for (let y = x + 1; y < n; y++) {
        for (let z = y + 1; z < n; z++) {
          const a = genes[x];
          const b = genes[y];
          const c = genes[z];
          const o = clockwise(i1, a, b, c);
          if (o !== clockwise(i2, a, b, c)) continue;
          agree++;
          if (ic.has(a) && ic.has(b) && ic.has(c) && clockwise(ic, a, b, c) === o) kept++;
        }
      }
    }

    const e1 = edges(p1);
    const e2 = edges(p2);
    let adj = 0;
    for (let i = 0; i < n; i++) {
      const k = edgeKey(child[i], child[(i + 1) % n]);
      if (e1.has(k) || e2.has(k)) adj++;
    }

    const same = (p) => p.every((g, i) => g === child[i]);
    return {
      position: pos / n,
      order: agree ? kept / agree : 1,
      adjacency: adj / n,
      clone: same(p1) || same(p2) ? 1 : 0,
      valid: new Set(child).size === n ? 1 : 0,
    };
  }

  /**
   * Binaria. Solo cuentan las posiciones en que los padres difieren (donde coinciden,
   * cualquier cruce copia ese mismo valor).
   *  own:      fracción que el hijo k toma de «su» padre (H1 de P1, H2 de P2).
   *  segments: tramos seguidos tomados de un mismo padre.
   */
  function binMetrics(child, p1, p2, k) {
    const own = k === 0 ? p1 : p2;
    let count = 0;
    let fromOwn = 0;
    let segments = 0;
    let last = null;
    for (let i = 0; i < child.length; i++) {
      if (p1[i] === p2[i]) continue;
      count++;
      const src = child[i] === own[i] ? 'own' : 'other';
      if (src === 'own') fromOwn++;
      if (src !== last) segments++;
      last = src;
    }
    return { own: count ? fromOwn / count : 1, segments: count ? segments : 1 };
  }

  /**
   * Real.
   *  copied:   genes iguales a los de uno de los padres.
   *  inside:   genes dentro del intervalo [mín, máx] de los padres.
   *  distance: distancia media al padre más cercano, en anchuras I = |P1 − P2|
   *            (solo posiciones con I > 0).
   */
  function realMetrics(child, p1, p2) {
    const n = child.length;
    let copied = 0;
    let inside = 0;
    let dist = 0;
    let wide = 0;
    for (let i = 0; i < n; i++) {
      const c = child[i];
      const lo = Math.min(p1[i], p2[i]);
      const hi = Math.max(p1[i], p2[i]);
      if (Math.abs(c - p1[i]) < EPS || Math.abs(c - p2[i]) < EPS) copied++;
      if (c >= lo - EPS && c <= hi + EPS) inside++;
      if (hi - lo > EPS) {
        wide++;
        dist += Math.min(Math.abs(c - p1[i]), Math.abs(c - p2[i])) / (hi - lo);
      }
    }
    return { copied: copied / n, inside: inside / n, distance: wide ? dist / wide : 0 };
  }

  function childMetrics(rep, child, p1, p2, k) {
    if (rep === 'permutation') return permMetrics(child, p1, p2);
    if (rep === 'binary') return binMetrics(child, p1, p2, k);
    return realMetrics(child, p1, p2);
  }

  /** Media de las métricas de los dos hijos. */
  function pairMetrics(rep, children, p1, p2) {
    const a = childMetrics(rep, children[0], p1, p2, 0);
    const b = childMetrics(rep, children[1], p1, p2, 1);
    const out = {};
    METRICS[rep].forEach((m) => { out[m.id] = (a[m.id] + b[m.id]) / 2; });
    return out;
  }

  // ---------- Qué conserva cada gen (para colorear los hijos) ----------

  /**
   * Clase de cada gen de un hijo:
   *  permutación: 'p1' / 'p2' (misma posición que en ese padre), 'moved'; dup = gen repetido.
   *  binaria:     'p1' / 'p2' (de qué padre sale), 'same' (los padres coinciden).
   *  real:        'p1' / 'p2' (copia exacta), 'inside' / 'outside' (valor nuevo).
   */
  function geneClasses(rep, child, p1, p2) {
    const count = new Map();
    child.forEach((g) => count.set(g, (count.get(g) || 0) + 1));
    return child.map((g, i) => {
      if (rep === 'permutation') {
        const cls = g === p1[i] ? 'p1' : g === p2[i] ? 'p2' : 'moved';
        return { cls, dup: count.get(g) > 1 };
      }
      if (rep === 'binary') return { cls: p1[i] === p2[i] ? 'same' : g === p1[i] ? 'p1' : 'p2', dup: false };
      if (Math.abs(g - p1[i]) < EPS) return { cls: 'p1', dup: false };
      if (Math.abs(g - p2[i]) < EPS) return { cls: 'p2', dup: false };
      const lo = Math.min(p1[i], p2[i]);
      const hi = Math.max(p1[i], p2[i]);
      return { cls: g >= lo - EPS && g <= hi + EPS ? 'inside' : 'outside', dup: false };
    });
  }

  // ---------- Cortes y ajustes de cada operador ----------

  /** Cortes interiores (1..n−1), sin repetir y ordenados. */
  function interiorCuts(cuts, n) {
    return [...new Set((cuts || []).filter((c) => Number.isInteger(c) && c >= 1 && c <= n - 1))].sort((a, b) => a - b);
  }

  const validSegment = (cuts, n) => Array.isArray(cuts) && cuts.length === 2 &&
    Number.isInteger(cuts[0]) && Number.isInteger(cuts[1]) &&
    cuts[0] >= 0 && cuts[1] <= n && cuts[1] - cuts[0] >= 1 && cuts[1] - cuts[0] <= n - 1;

  function randomInterior(rng, n, k) {
    return R.shuffle(rng, Array.from({ length: n - 1 }, (_, i) => i + 1)).slice(0, k).sort((a, b) => a - b);
  }

  /**
   * Cortes para un operador a partir de los de la página de origen, cuando se pueden
   * reutilizar (así la diferencia entre operadores no se debe a los cortes):
   *  dos cortes [c1, c2): los mismos si los hay; si no, los dos primeros interiores.
   *  un corte: el primer corte interior.
   *  k cortes: los cortes interiores (y k pasa a ser cuántos son, hasta el máximo de k).
   * Si no hay cortes que reutilizar, se sortean. Devuelve { cuts, k? }.
   */
  function deriveCuts(spec, srcCuts, n, rng, k) {
    const c = spec.cuts;
    if (!c) return { cuts: [] };
    const inner = interiorCuts(srcCuts, n);
    if (c === 2) {
      if (validSegment(srcCuts, n)) return { cuts: srcCuts.slice() };
      if (inner.length >= 2) return { cuts: inner.slice(0, 2) };
      return { cuts: R.randomCuts(rng, n) };
    }
    if (c === 1) return { cuts: inner.length ? [inner[0]] : [R.randInt(rng, 1, n - 1)] };
    // c === 'k'
    const pk = (spec.params || []).find((p) => p.id === 'k');
    const kMax = Math.min(pk ? pk.max : n - 1, n - 1);
    if (inner.length && k == null) {
      const kk = Math.min(inner.length, kMax);
      return { cuts: inner.slice(0, kk), k: kk };
    }
    const kk = Math.max(1, Math.min(k != null ? k : (pk ? pk.default : 1), kMax));
    return { cuts: randomInterior(rng, n, kk), k: kk };
  }

  /** Parámetros por defecto del operador, o los de la página de origen si es ese operador. */
  function defaultParams(spec, given) {
    const out = {};
    (spec.params || []).forEach((p) => {
      const v = given && given[p.id];
      out[p.id] = Number.isFinite(v) && v >= p.min && v <= p.max ? v : p.default;
    });
    return out;
  }

  // ---------- Comparación ----------

  function compare(opts) {
    const { rep, ops, p1, p2 } = opts;
    const n = p1.length;
    const reps = opts.reps == null ? 1000 : opts.reps;
    const draw = opts.draw || 1;
    const cutRng = R.mulberry32((opts.seed || 1) + 7);
    const metrics = METRICS[rep];
    // Cortes de referencia: los de la página de origen o, si no tenía, unos al azar comunes a todos.
    const src = Array.isArray(opts.cuts) && opts.cuts.length ? opts.cuts : R.randomCuts(cutRng, n);

    return ops.map(({ id, spec }, idx) => {
      const isFrom = id === opts.from;
      const params = defaultParams(spec, isFrom ? opts.params : null);
      const variant = spec.variants
        ? (isFrom && spec.variants.indexOf(opts.variant) !== -1 ? opts.variant : spec.defaultVariant)
        : null;

      // Ejemplo: los cortes de la página de origen (o los mismos para todos, si hay que sortearlos)
      let cuts = null;
      let res = null;
      if (isFrom && Array.isArray(opts.cuts)) {
        cuts = opts.cuts.slice();
        try { res = spec.run(p1, p2, cuts, { variant, seed: draw, params }); } catch (err) { res = null; }
      }
      if (!res) {   // otro operador, o cortes de origen que no valen para él
        const d = deriveCuts(spec, src, n, cutRng, isFrom ? params.k : undefined);
        cuts = d.cuts;
        if (d.k != null) params.k = d.k;
        res = spec.run(p1, p2, cuts, { variant, seed: draw, params });
      }
      const children = res.children.map((c) => c.slice());
      const example = pairMetrics(rep, children, p1, p2);
      const genes = children.map((c) => geneClasses(rep, c, p1, p2));

      // Media: mismos padres y parámetros, cortes y sorteos al azar
      const rng = R.mulberry32(((opts.seed || 1) * 7919 + idx * 104729 + 1) >>> 0);
      const sum = {};
      metrics.forEach((m) => { sum[m.id] = 0; });
      for (let t = 0; t < reps; t++) {
        const rc = deriveCuts(spec, [], n, rng, params.k).cuts;
        const r = spec.run(p1, p2, rc, { variant, seed: 1 + Math.floor(rng() * 999999), params });
        const m = pairMetrics(rep, r.children, p1, p2);
        metrics.forEach((mm) => { sum[mm.id] += m[mm.id]; });
      }
      // Sin repeticiones (primer dibujado rápido de la página), la media queda pendiente.
      let mean = null;
      if (reps) {
        mean = {};
        metrics.forEach((m) => { mean[m.id] = sum[m.id] / reps; });
      }

      return { id, cuts, params, variant, children, genes, example, mean };
    });
  }

  const api = {
    METRICS, compare, deriveCuts, interiorCuts, defaultParams,
    permMetrics, binMetrics, realMetrics, pairMetrics, geneClasses,
  };
  if (isNode) module.exports = api;
  else (root.GAX = root.GAX || {}).compare = api;
})(typeof self !== 'undefined' ? self : this);
