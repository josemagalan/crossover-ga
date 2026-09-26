'use strict';
// Cruce BLX-α (representación real).
const test = require('node:test');
const assert = require('node:assert/strict');

const rng = require('../js/rng.js');
const U = require('../js/operators/real-utils.js');
const BLX = require('../js/operators/blx.js');

test('validación de α', () => {
  assert.throws(() => BLX.blx([1, 2, 3, 4, 5], [1, 2, 3, 4, 5], -0.1), /errParam/);
  assert.throws(() => BLX.blx([1, 2, 3, 4, 5], [1, 2, 3, 4, 5], 1.1), /errParam/);
});

test('BLX-α: sorteo fijado, resultado exacto', () => {
  const p1 = [2.0, 4.5, 1.0, 8.0, 6.5, 3.0];
  const p2 = [6.0, 0.5, 3.0, 9.0, 2.5, 7.0];
  // Con α = 0 (cruce plano), cada r escoge directamente un punto del intervalo [min, max].
  const res = BLX.blx(p1, p2, 0, { draws: [0, 1, 0.5, 0.5, 0, 1, 1, 0, 0.25, 0.75, 0, 0] });
  assert.deepEqual(res.children[0], [2, 2.5, 1, 9, 3.5, 3]);
  assert.deepEqual(res.children[1], [6, 2.5, 3, 8, 5.5, 3]);
});

test('BLX-α: propiedades en miles de casos', () => {
  const r = rng.mulberry32(17);
  for (let t = 0; t < 3000; t++) {
    const n = rng.randInt(r, 5, 12);
    const p1 = U.randomReals(r, n);
    const p2 = U.randomReals(r, n);
    const alpha = Math.round(r() * 20) / 20;
    const res = BLX.spec.run(p1, p2, [], { seed: t + 1, params: { alpha } });
    const [h1, h2] = res.children;
    assert.equal(res.draws.length, 2 * n);
    for (let i = 0; i < n; i++) {
      const cmin = Math.min(p1[i], p2[i]);
      const cmax = Math.max(p1[i], p2[i]);
      const width = cmax - cmin;
      const lo = cmin - alpha * width - 1e-9;
      const hi = cmax + alpha * width + 1e-9;
      assert.ok(h1[i] >= lo && h1[i] <= hi, 'H1 dentro del intervalo ampliado');
      assert.ok(h2[i] >= lo && h2[i] <= hi, 'H2 dentro del intervalo ampliado');
      // Implementación independiente a partir de los mismos sorteos
      const r1 = res.draws[2 * i];
      const r2 = res.draws[2 * i + 1];
      assert.ok(Math.abs(h1[i] - (lo + 1e-9 + r1 * (hi - lo - 2e-9))) < 1e-6);
      assert.ok(Math.abs(h2[i] - (lo + 1e-9 + r2 * (hi - lo - 2e-9))) < 1e-6);
    }
    // Misma semilla, mismo resultado
    const again = BLX.spec.run(p1, p2, [], { seed: t + 1, params: { alpha } });
    assert.deepEqual(again.children, res.children);
    const types = res.steps.map((s) => s.type);
    assert.deepEqual(types, ['intro', 'alphaIntro', ...Array(n).fill('gene'), 'done']);
    assert.deepEqual(res.steps[res.steps.length - 1].children.map((c) => c.map((g) => g.v)), res.children);
  }
});

test('BLX-α con α = 0: los hijos nunca salen del intervalo de los padres', () => {
  const r = rng.mulberry32(23);
  for (let t = 0; t < 1000; t++) {
    const n = rng.randInt(r, 5, 12);
    const p1 = U.randomReals(r, n);
    const p2 = U.randomReals(r, n);
    const [h1, h2] = BLX.spec.run(p1, p2, [], { seed: t + 1, params: { alpha: 0 } }).children;
    for (let i = 0; i < n; i++) {
      const lo = Math.min(p1[i], p2[i]) - 1e-9;
      const hi = Math.max(p1[i], p2[i]) + 1e-9;
      assert.ok(h1[i] >= lo && h1[i] <= hi);
      assert.ok(h2[i] >= lo && h2[i] <= hi);
    }
  }
});

test('la nube de la traza tiene 200 puntos (o ninguno cuando se fijan los sorteos)', () => {
  const p1 = [2.0, 4.5, 1.0, 8.0, 6.5, 3.0];
  const p2 = [6.0, 0.5, 3.0, 9.0, 2.5, 7.0];
  const res = BLX.spec.run(p1, p2, [], { seed: 5, params: { alpha: 0.5 } });
  assert.equal(res.aux.type, 'cloud');
  assert.equal(res.aux.items.cloud.length, 200);
  const fixed = BLX.blx(p1, p2, 0.5, { draws: new Array(12).fill(0.5) });
  assert.equal(fixed.aux.items.cloud.length, 0);
});
