'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const B = require('../js/operators/bin-utils.js');
const { onePoint } = require('../js/operators/one-point.js');
const { twoPoint } = require('../js/operators/two-point.js');
const { nPoint } = require('../js/operators/n-point.js');
const { uniform } = require('../js/operators/uniform-binary.js');
const rng = require('../js/rng.js');

test('máscaras de Syswerda (1989): un punto, dos puntos', () => {
  assert.deepEqual(B.maskFromCuts(10, [5]).join(''), '0000011111');
  assert.deepEqual(B.maskFromCuts(10, [2, 7]).join(''), '0011111000');
  assert.deepEqual(B.bandsFromMask([0, 0, 1, 1, 1, 0, 1]), [[2, 5], [6, 7]]);
});

test('cruce en un punto: ejemplo de las transparencias (Luke)', () => {
  // 1 1 0 0 1 | 0 0 1  y  0 0 1 0 1 | 1 0 0: los hijos intercambian la cola tras la posición 5
  const res = onePoint([1, 1, 0, 0, 1, 0, 0, 1], [0, 0, 1, 0, 1, 1, 0, 0], 5);
  assert.deepEqual(res.children[0], [1, 1, 0, 0, 1, 1, 0, 0]);
  assert.deepEqual(res.children[1], [0, 0, 1, 0, 1, 0, 0, 1]);
});

test('cruce uniforme con un sorteo fijo', () => {
  const p1 = [1, 1, 0, 0, 1, 0, 0, 1];
  const p2 = [0, 0, 1, 0, 1, 1, 0, 0];
  const draws = [0.1, 0.9, 0.3, 0.6, 0.5, 0.49, 0.8, 0.2];
  const res = uniform(p1, p2, 0.5, { draws });
  assert.deepEqual(res.mask, [1, 0, 1, 0, 1, 1, 0, 1]);
  assert.deepEqual(res.children[0], [0, 1, 1, 0, 1, 1, 0, 0]);
  assert.deepEqual(res.children[1], [1, 0, 0, 0, 1, 0, 0, 1]);
});

test('propiedades de los cuatro operadores', () => {
  const r = rng.mulberry32(3);
  for (let t = 0; t < 3000; t++) {
    const n = rng.randInt(r, 5, 12);
    const p1 = B.randomBits(r, n);
    const p2 = B.randomBits(r, n);
    const k = rng.randInt(r, 1, Math.min(5, n - 1));
    const cuts = rng.shuffle(r, Array.from({ length: n - 1 }, (_, i) => i + 1)).slice(0, k).sort((a, b) => a - b);
    const c1 = rng.randInt(r, 0, n - 1);
    const c2 = rng.randInt(r, c1 + 1, Math.min(n, c1 + n - 1));
    const results = [
      onePoint(p1, p2, cuts[0]),
      twoPoint(p1, p2, c1, c2),
      nPoint(p1, p2, cuts),
      uniform(p1, p2, [0.1, 0.25, 0.5][t % 3], { seed: t + 1 }),
    ];
    for (const res of results) {
      const [h1, h2] = res.children;
      for (let i = 0; i < n; i++) {
        // cada posición: los hijos reparten los dos bits de los padres según la máscara
        if (res.mask[i]) { assert.equal(h1[i], p2[i]); assert.equal(h2[i], p1[i]); }
        else { assert.equal(h1[i], p1[i]); assert.equal(h2[i], p2[i]); }
      }
      const last = res.steps[res.steps.length - 1];
      assert.deepEqual(last.children[0].map((g) => g.v), h1);
    }
    // n puntos: el número de cambios de la máscara es el número de cortes
    const m = results[2].mask;
    const changes = m.reduce((a, b, i) => a + (i > 0 && b !== m[i - 1] ? 1 : 0), m[0]);
    assert.equal(changes, k);
    // dos puntos: la máscara es un único tramo de unos entre c1 y c2
    assert.deepEqual(results[1].mask, Array.from({ length: n }, (_, i) => (i >= c1 && i < c2 ? 1 : 0)));
  }
});

test('validación de bits', () => {
  assert.equal(B.validateParents([1, 0, 1, 1, 2], [0, 0, 0, 0, 0]), 'errBits');
  assert.equal(B.validateParents([1, 0, 1, 1], [0, 0, 0, 0]), 'errRange');
  assert.equal(B.validateParents([1, 0, 1, 1, 0], [0, 0, 0, 0, 1]), null);
});
