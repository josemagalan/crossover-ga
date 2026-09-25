'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { cx, VARIANTS } = require('../js/operators/cx.js');
const rng = require('../js/rng.js');

const isPerm = (a, n) => a.length === n && new Set(a).size === n && a.every((v) => v >= 1 && v <= n);

// Ciclos calculados de otra forma: componentes de la relación i ~ posición en P1 del gen P2[i].
function cyclesRef(p1, p2) {
  const n = p1.length;
  const seen = new Array(n).fill(false);
  const out = [];
  for (let s = 0; s < n; s++) {
    if (seen[s]) continue;
    const c = [];
    let i = s;
    while (!seen[i]) { seen[i] = true; c.push(i); i = p1.indexOf(p2[i]); }
    out.push(c.sort((a, b) => a - b));
  }
  return out;
}

test('ejemplo de las transparencias: primer ciclo del Padre 1, segundo del Padre 2', () => {
  const p1 = [1, 2, 3, 4, 5, 6, 7, 8];
  const p2 = [2, 4, 6, 8, 7, 5, 3, 1];
  const res = cx(p1, p2, 'random', { choices: ['p1', 'p2'] });
  assert.deepEqual(res.children[0], [1, 2, 6, 4, 7, 5, 3, 8]);
  // Recorrido del primer ciclo como en la transparencia: posiciones 1 → 8 → 4 → 2
  assert.deepEqual(res.cycles[0].positions.map((i) => i + 1), [1, 8, 4, 2]);
  // Estado intermedio de la transparencia: (1 2 6 4 * * * 8) tras empezar el segundo ciclo en la posición 3
  const afterFirstOfCycle2 = res.steps.find((s) => s.type === 'cycleStep' && s.auxCycles.length === 2);
  assert.deepEqual(afterFirstOfCycle2.children[0].map((g) => (g ? g.v : '*')), [1, 2, 6, 4, '*', '*', '*', 8]);
  assert.deepEqual(res.children[1], [2, 4, 3, 8, 5, 6, 7, 1]);
});

test('ejemplo de Goldberg (1989), variante del primer ciclo', () => {
  const C = [9, 8, 2, 1, 7, 4, 5, 10, 6, 3];
  const D = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const res = cx(C, D, 'first_cycle');
  assert.deepEqual(res.children[0], [9, 2, 3, 1, 5, 4, 7, 8, 6, 10]);
  assert.deepEqual(res.children[1], [1, 8, 2, 4, 7, 6, 5, 10, 9, 3]);
});

test('propiedades en 2000 casos por variante', () => {
  const r = rng.mulberry32(77);
  for (const variant of VARIANTS) {
    for (let t = 0; t < 2000; t++) {
      const n = rng.randInt(r, 5, 12);
      const p1 = rng.randomPermutation(r, n);
      const p2 = rng.randomPermutation(r, n);
      const res = cx(p1, p2, variant, { seed: t + 1 });
      const [h1, h2] = res.children;
      assert.ok(isPerm(h1, n) && isPerm(h2, n));
      for (let i = 0; i < n; i++) {
        assert.ok(h1[i] === p1[i] || h1[i] === p2[i], 'cada gen en la posición de un padre');
        assert.equal(h2[i], h1[i] === p1[i] ? p2[i] : p1[i], 'el Hijo 2 es el complementario');
      }
      const ref = cyclesRef(p1, p2);
      if (variant !== 'first_cycle') {
        assert.deepEqual(res.cycles.map((c) => c.positions.slice().sort((a, b) => a - b)), ref);
        res.cycles.forEach((c, k) => {
          const S = c.src === 'p1' ? p1 : p2;
          c.positions.forEach((i) => assert.equal(h1[i], S[i]));
          if (variant === 'alternate') assert.equal(c.src, k % 2 === 0 ? 'p1' : 'p2');
        });
      } else {
        ref[0].forEach((i) => assert.equal(h1[i], p1[i]));
        ref.slice(1).flat().forEach((i) => assert.equal(h1[i], p2[i]));
      }
      // Reproducible: la misma semilla da las mismas elecciones, y las elecciones reproducen el resultado
      assert.deepEqual(cx(p1, p2, variant, { seed: t + 1 }).children, res.children);
      assert.deepEqual(cx(p1, p2, variant, { choices: res.choices }).children, res.children);
      const last = res.steps[res.steps.length - 1];
      assert.deepEqual(last.children[0].map((g) => g.v), h1);
    }
  }
});

test('el sorteo usa ambos padres con semillas distintas', () => {
  const p1 = [1, 2, 3, 4, 5, 6, 7, 8];
  const p2 = [2, 4, 6, 8, 7, 5, 3, 1];
  const firsts = new Set();
  for (let s = 1; s <= 40; s++) firsts.add(cx(p1, p2, 'random', { seed: s }).choices[0]);
  assert.deepEqual([...firsts].sort(), ['p1', 'p2']);
});
