'use strict';
// Cruce ERX (Edge Recombination Crossover), representación permutacional.
const test = require('node:test');
const assert = require('node:assert/strict');
const { erx, adjacency, edgeSet, VARIANTS } = require('../js/operators/erx.js');
const rng = require('../js/rng.js');

const isPerm = (a, n) => a.length === n && new Set(a).size === n && a.every((v) => v >= 1 && v <= n);

// Implementación independiente: listas como arrays, candidatos en orden creciente,
// y los mismos números aleatorios que ha usado la herramienta.
function erxRef(p1, p2, variant, draws) {
  const n = p1.length;
  const q = draws.slice();
  const nb = (p, g) => { const i = p.indexOf(g); return [p[(i + n - 1) % n], p[(i + 1) % n]]; };
  const shared = (a, b) => nb(p1, a).includes(b) && nb(p2, a).includes(b);
  const child = (start) => {
    const lists = {};
    p1.forEach((g) => { lists[g] = [...new Set(nb(p1, g).concat(nb(p2, g)))]; });
    const used = new Set([start]);
    const h = [start];
    let cur = start;
    while (h.length < n) {
      let cand = lists[cur].filter((g) => !used.has(g)).sort((a, b) => a - b);
      let pool;
      if (cand.length) {
        if (variant === 'enhanced' && cand.some((g) => shared(cur, g))) cand = cand.filter((g) => shared(cur, g));
        const cnt = (g) => lists[g].filter((x) => !used.has(x)).length;
        const m = Math.min(...cand.map(cnt));
        pool = cand.filter((g) => cnt(g) === m);
      } else {
        pool = p1.filter((g) => !used.has(g)).sort((a, b) => a - b);
      }
      const next = pool.length === 1 ? pool[0] : pool[Math.floor(q.shift() * pool.length)];
      h.push(next);
      used.add(next);
      cur = next;
    }
    return h;
  };
  return [child(p1[0]), child(p2[0])];
}

test('tabla de adyacencias: vecinos en los dos padres, leídos como circuitos', () => {
  const p1 = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const p2 = [9, 3, 7, 8, 2, 6, 5, 1, 4];
  const t = adjacency(p1, p2);
  assert.deepEqual(t[1].map((e) => e.v), [2, 4, 5, 9]);
  assert.deepEqual(t[8].map((e) => e.v), [2, 7, 9]);
  // 7–8 está en los dos padres; 8–9 solo en el Padre 1; 2–8 solo en el Padre 2
  const m8 = Object.fromEntries(t[8].map((e) => [e.v, e.m]));
  assert.deepEqual(m8, { 2: 'p2', 7: 'both', 9: 'p1' });
  Object.values(t).forEach((l) => assert.ok(l.length >= 2 && l.length <= 4));
});

test('ejemplo con el sorteo fijado (resultado de la implementación)', () => {
  const p1 = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const p2 = [4, 1, 2, 8, 7, 6, 9, 3, 5];
  const res = erx(p1, p2, 'original', { seed: 3 });
  assert.deepEqual(res.children, [[1, 4, 5, 3, 2, 8, 7, 6, 9], [4, 1, 2, 8, 7, 6, 5, 3, 9]]);
  assert.deepEqual(res.picks.map((p) => p.options), [[2, 4], [3, 6], [7, 9], [1, 5], [3, 8], [5, 9]]);
  assert.deepEqual(erx(p1, p2, 'original', { draws: res.draws }).children, res.children);
});

test('propiedades en 2000 casos por variante', () => {
  const r = rng.mulberry32(91);
  for (const variant of VARIANTS) {
    for (let t = 0; t < 2000; t++) {
      const n = rng.randInt(r, 5, 12);
      const p1 = rng.randomPermutation(r, n);
      const p2 = rng.randomPermutation(r, n);
      const res = erx(p1, p2, variant, { seed: t + 1 });
      const [h1, h2] = res.children;
      assert.ok(isPerm(h1, n) && isPerm(h2, n));
      assert.equal(h1[0], p1[0]);
      assert.equal(h2[0], p2[0]);
      // Implementación independiente con los mismos sorteos
      assert.deepEqual(erxRef(p1, p2, variant, res.draws), res.children);
      // Solo se sortea cuando hay varias opciones
      assert.equal(res.draws.length, res.picks.length);
      res.picks.forEach((p) => assert.ok(p.options.length > 1 && p.options.includes(p.pick)));
      // Cada arista del hijo que no viene de los padres se debe a un salto (o al cierre del circuito)
      const par = new Set([...edgeSet(p1), ...edgeSet(p2)]);
      res.children.forEach((h, k) => {
        const jumps = res.steps.filter((s) => s.type === 'deadEnd' && s.auxChild === k).length;
        const novel = [...edgeSet(h)].filter((e) => !par.has(e)).length;
        assert.ok(novel <= jumps + 1);
        assert.equal(res.newEdges[k], novel);
      });
      // Reproducible
      assert.deepEqual(erx(p1, p2, variant, { seed: t + 1 }).children, res.children);
      const last = res.steps[res.steps.length - 1];
      assert.deepEqual(last.children.map((c) => c.map((g) => g.v)), res.children);
    }
  }
});

test('la variante mejorada sigue una arista común siempre que la hay', () => {
  const r = rng.mulberry32(7);
  for (let t = 0; t < 500; t++) {
    const n = rng.randInt(r, 5, 12);
    const p1 = rng.randomPermutation(r, n);
    const p2 = rng.randomPermutation(r, n);
    const res = erx(p1, p2, 'enhanced', { seed: t + 1 });
    res.steps.filter((s) => s.type === 'pick').forEach((s) => {
      const lists = s.auxLists;
      const genes = p1.slice().sort((a, b) => a - b);
      const cur = lists[genes.indexOf(s.auxCurrent)];
      const commonLeft = cur.filter((e) => e.m === 'both' && (!e.removed || e.v === s.auxChosen));
      if (commonLeft.length) assert.equal(cur.find((e) => e.v === s.auxChosen).m, 'both');
    });
  }
});

test('padres iguales: los hijos son copias (salvo el sentido de recorrido)', () => {
  const p = [3, 1, 4, 5, 2, 6];
  const [h1, h2] = erx(p, p.slice(), 'original', { seed: 5 }).children;
  const same = (h) => [...edgeSet(h)].every((e) => edgeSet(p).has(e));
  assert.ok(same(h1) && same(h2));
});
