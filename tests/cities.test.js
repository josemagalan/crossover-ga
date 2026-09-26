'use strict';
// Ciudades al azar para ver las permutaciones como rutas.
const test = require('node:test');
const assert = require('node:assert/strict');
const { randomCities, tourLength } = require('../js/cities.js');

test('ciudades reproducibles, dentro del plano y separadas', () => {
  for (let seed = 0; seed < 300; seed++) {
    for (const n of [5, 8, 12]) {
      const c = randomCities(seed, n);
      assert.deepEqual(randomCities(seed, n), c);
      assert.deepEqual(Object.keys(c).map(Number), Array.from({ length: n }, (_, i) => i + 1));
      const pts = Object.values(c);
      pts.forEach(([x, y]) => assert.ok(x >= 0 && x <= 100 && y >= 0 && y <= 100));
      let min = Infinity;
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) min = Math.min(min, Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]));
      assert.ok(min >= 8, `semilla ${seed}, n ${n}: ciudades demasiado juntas (${min})`);
    }
  }
});

test('longitud de un circuito: cuadrado y cambio de sentido o de inicio', () => {
  const sq = { 1: [0, 0], 2: [10, 0], 3: [10, 10], 4: [0, 10] };
  assert.equal(tourLength([1, 2, 3, 4], sq), 40);
  assert.ok(Math.abs(tourLength([1, 3, 2, 4], sq) - (20 + 2 * Math.hypot(10, 10))) < 1e-9);
  const c = randomCities(7, 9);
  const r = [3, 1, 4, 9, 5, 2, 6, 8, 7];
  const l = tourLength(r, c);
  assert.ok(Math.abs(tourLength(r.slice().reverse(), c) - l) < 1e-9);
  assert.ok(Math.abs(tourLength(r.slice(4).concat(r.slice(0, 4)), c) - l) < 1e-9);
});
