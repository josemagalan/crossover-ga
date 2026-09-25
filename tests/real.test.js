'use strict';
// Cruces de la representación real: uniforme (discreto) y aritmético.
const test = require('node:test');
const assert = require('node:assert/strict');

const rng = require('../js/rng.js');
const U = require('../js/operators/real-utils.js');
const UR = require('../js/operators/uniform-real.js');
const AR = require('../js/operators/arithmetic.js');

const close = (a, b) => Math.abs(a - b) < 1e-9;

test('validación de padres reales', () => {
  assert.equal(U.validateParents([1, 2.5, 3, 4, 5], [0, 9.99, 100, 4.2, 7]), null);
  assert.equal(U.validateParents([1, 2, 3, 4, 5], [1, 2, 3, 4]), 'errLength');
  assert.equal(U.validateParents([1, 2, 3, 4], [1, 2, 3, 4]), 'errRange');
  assert.equal(U.validateParents([1, 2, 3, 4, -5], [1, 2, 3, 4, 5]), 'errReal');
  assert.equal(U.validateParents([1, 2, 3, 4, 100.5], [1, 2, 3, 4, 5]), 'errReal');
  assert.equal(U.validateParents([1, 2, 3, 4, 1.234], [1, 2, 3, 4, 5]), 'errReal');
  assert.equal(U.validateParents([1, 2, 3, 4, NaN], [1, 2, 3, 4, 5]), 'errReal');
  assert.throws(() => AR.arithmetic([1, 2, 3, 4, 5], [1, 2, 3, 4, 5], 1.5), /errParam/);
});

test('padres aleatorios: un decimal, entre 0 y 10', () => {
  const r = rng.mulberry32(3);
  for (let t = 0; t < 500; t++) {
    const v = U.randomReals(r, 8);
    assert.equal(U.validateParents(v, v), null);
    assert.ok(v.every((x) => x >= 0 && x <= 10 && close(x * 10, Math.round(x * 10))));
  }
});

test('aritmético: ejemplo de las transparencias (λ = 0,5, la media) y ejemplo del código', () => {
  const p1 = [2.0, 4.5, 1.0, 8.0, 6.5, 3.0];
  const p2 = [6.0, 0.5, 3.0, 9.0, 2.5, 7.0];
  const half = AR.arithmetic(p1, p2, 0.5).children;
  assert.deepEqual(half[0], [4.0, 2.5, 2.0, 8.5, 4.5, 5.0]);
  assert.deepEqual(half[1], half[0]);
  const q = AR.arithmetic(p1, p2, 0.25).children;
  assert.deepEqual(q, [[5.0, 1.5, 2.5, 8.75, 3.5, 6.0], [3.0, 3.5, 1.5, 8.25, 5.5, 4.0]]);
  assert.deepEqual(AR.arithmetic(p1, p2, 1).children, [p1, p2]);
  assert.deepEqual(AR.arithmetic(p1, p2, 0).children, [p2, p1]);
});

test('aritmético: propiedades en miles de casos', () => {
  const r = rng.mulberry32(7);
  for (let t = 0; t < 3000; t++) {
    const n = rng.randInt(r, 5, 12);
    const p1 = U.randomReals(r, n);
    const p2 = U.randomReals(r, n);
    const lam = Math.round(r() * 20) / 20;
    const res = AR.spec.run(p1, p2, [], { params: { lambda: lam } });
    const [h1, h2] = res.children;
    for (let i = 0; i < n; i++) {
      const lo = Math.min(p1[i], p2[i]) - 1e-9;
      const hi = Math.max(p1[i], p2[i]) + 1e-9;
      assert.ok(h1[i] >= lo && h1[i] <= hi && h2[i] >= lo && h2[i] <= hi, 'los hijos quedan entre los padres');
      assert.ok(close(h1[i] + h2[i], p1[i] + p2[i]), 'la suma se conserva');
      // Implementación independiente: interpolación desde el Padre 2
      assert.ok(close(h1[i], p2[i] + lam * (p1[i] - p2[i])));
    }
    // La traza termina con los hijos completos y el mismo resultado
    const last = res.steps[res.steps.length - 1];
    assert.deepEqual(last.children.map((c) => c.map((g) => g.v)), res.children);
    assert.deepEqual(res.steps.map((s) => s.type), ['intro', 'weights', 'first', 'rest', 'done']);
  }
});

test('uniforme real: sorteo fijado y los genes salen sin modificar de los padres', () => {
  const p1 = [2.0, 4.5, 1.0, 8.0, 6.5, 3.0];
  const p2 = [6.0, 0.5, 3.0, 9.0, 2.5, 7.0];
  const res = UR.uniform(p1, p2, 0.5, { draws: [0.1, 0.9, 0.5, 0.51, 0.0, 0.99] });
  assert.deepEqual(res.mask, [1, 0, 1, 0, 1, 0]);
  assert.deepEqual(res.children, [[6.0, 4.5, 3.0, 8.0, 2.5, 3.0], [2.0, 0.5, 1.0, 9.0, 6.5, 7.0]]);

  const r = rng.mulberry32(11);
  for (let t = 0; t < 2000; t++) {
    const n = rng.randInt(r, 5, 12);
    const a = U.randomReals(r, n);
    const b = U.randomReals(r, n);
    const out = UR.spec.run(a, b, [], { seed: t + 1, params: { p: 0.3 } });
    for (let i = 0; i < n; i++) {
      assert.equal(out.children[0][i], out.mask[i] ? b[i] : a[i]);
      assert.equal(out.children[1][i], out.mask[i] ? a[i] : b[i]);
    }
    assert.deepEqual(out.mask, out.draws.map((d) => (d <= 0.3 ? 1 : 0)));
  }
});
