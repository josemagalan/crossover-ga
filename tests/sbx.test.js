'use strict';
// Cruce SBX, simulated binary crossover (representación real).
const test = require('node:test');
const assert = require('node:assert/strict');

const rng = require('../js/rng.js');
const U = require('../js/operators/real-utils.js');
const SBX = require('../js/operators/sbx.js');

// El motor redondea β y los genes a 5 decimales para que el código descargable dé exactamente
// los mismos hijos en Python y en JavaScript (el exponente 1/(η+1) puede diferir en el último
// bit entre motores); la tolerancia aquí es holgada frente a ese redondeo.
const close = (a, b) => Math.abs(a - b) < 1e-4;

test('validación de η', () => {
  assert.throws(() => SBX.sbx([1, 2, 3, 4, 5], [1, 2, 3, 4, 5], -1), /errParam/);
});

test('β: fórmula independiente a partir de u y η', () => {
  const indep = (u, eta) => (u <= 0.5 ? (2 * u) ** (1 / (eta + 1)) : (1 / (2 * (1 - u))) ** (1 / (eta + 1)));
  for (const eta of [1, 2, 5, 10, 20]) {
    for (const u of [0, 0.1, 0.25, 0.5, 0.5001, 0.75, 0.9, 0.999999]) {
      assert.ok(close(SBX.beta(u, eta), indep(u, eta)), `eta=${eta} u=${u}`);
    }
  }
  // β = 1 exactamente en u = 0,5 (frontera entre las dos ramas)
  for (const eta of [1, 2, 5, 20]) assert.ok(close(SBX.beta(0.5, eta), 1));
});

test('SBX: sorteo fijado, resultado exacto', () => {
  const p1 = [2.0, 4.5, 1.0, 8.0, 6.5, 3.0];
  const p2 = [6.0, 0.5, 3.0, 9.0, 2.5, 7.0];
  const res = SBX.sbx(p1, p2, 2, { draws: [0.1, 0.9, 0.5, 0.5, 0.3, 0.7] });
  const beta0 = (2 * 0.1) ** (1 / 3);
  const beta1 = (1 / (2 * (1 - 0.9))) ** (1 / 3);
  assert.ok(close(res.children[0][0], 0.5 * ((1 + beta0) * 2.0 + (1 - beta0) * 6.0)));
  assert.ok(close(res.children[0][1], 0.5 * ((1 + beta1) * 4.5 + (1 - beta1) * 0.5)));
  // Con u = 0,5 exactamente, β = 1: H1 = P1 y H2 = P2 en esa posición.
  assert.ok(close(res.children[0][2], p1[2]));
  assert.ok(close(res.children[1][2], p2[2]));
});

test('SBX: propiedades en miles de casos', () => {
  const r = rng.mulberry32(29);
  for (let t = 0; t < 3000; t++) {
    const n = rng.randInt(r, 5, 12);
    const p1 = U.randomReals(r, n);
    const p2 = U.randomReals(r, n);
    const eta = rng.randInt(r, 1, 20);
    const res = SBX.spec.run(p1, p2, [], { seed: t + 1, params: { eta } });
    const [h1, h2] = res.children;
    assert.equal(res.draws.length, n);
    for (let i = 0; i < n; i++) {
      assert.ok(close(h1[i] + h2[i], p1[i] + p2[i]), 'la suma se conserva');
      const u = res.draws[i];
      const beta = SBX.beta(u, eta);
      assert.ok(close(h1[i], 0.5 * ((1 + beta) * p1[i] + (1 - beta) * p2[i])));
      assert.ok(close(h2[i], 0.5 * ((1 - beta) * p1[i] + (1 + beta) * p2[i])));
    }
    const again = SBX.spec.run(p1, p2, [], { seed: t + 1, params: { eta } });
    assert.deepEqual(again.children, res.children);
    const types = res.steps.map((s) => s.type);
    assert.deepEqual(types, ['intro', 'etaIntro', ...Array(n).fill('gene'), 'done']);
  }
});

test('la nube de la traza tiene 200 puntos (o ninguno cuando se fijan los sorteos)', () => {
  const p1 = [2.0, 4.5, 1.0, 8.0, 6.5, 3.0];
  const p2 = [6.0, 0.5, 3.0, 9.0, 2.5, 7.0];
  const res = SBX.spec.run(p1, p2, [], { seed: 6, params: { eta: 2 } });
  assert.equal(res.aux.type, 'cloud');
  assert.equal(res.aux.items.cloud.length, 200);
  const fixed = SBX.sbx(p1, p2, 2, { draws: new Array(6).fill(0.5) });
  assert.equal(fixed.aux.items.cloud.length, 0);
});
