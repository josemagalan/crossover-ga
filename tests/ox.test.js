'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { ox, VARIANTS } = require('../js/operators/ox.js');
const rng = require('../js/rng.js');

// Implementación independiente, escrita de otra forma, para contrastar.
function oxRef(own, other, c1, c2, variant) {
  const n = own.length;
  const child = new Array(n).fill(0);
  for (let i = c1; i < c2; i++) child[i] = own[i];
  const inSeg = (g) => own.slice(c1, c2).includes(g);
  const start = variant === 'classic' ? c2 : 0;
  const rest = [];
  for (let t = 0; t < n; t++) { const g = other[(start + t) % n]; if (!inSeg(g)) rest.push(g); }
  let i = variant === 'left_to_right' ? 0 : c2 % n;
  for (const g of rest) {
    while (i >= c1 && i < c2) i = (i + 1) % n;
    child[i] = g;
    i = (i + 1) % n;
  }
  return child;
}
const isPerm = (a, n) => a.length === n && new Set(a).size === n && a.every((v) => v >= 1 && v <= n);

test('ejemplo de las transparencias (variante por defecto)', () => {
  const p1 = [7, 3, 1, 8, 2, 4, 6, 5];
  const p2 = [4, 3, 2, 8, 6, 7, 1, 5];
  const { children, aux } = ox(p1, p2, 2, 5);
  assert.deepEqual(children[0], [7, 5, 1, 8, 2, 4, 3, 6]);
  assert.deepEqual(aux.items[0].list, [4, 3, 6, 7, 5]); // «Ordenar» de la transparencia
  assert.deepEqual(children[1], [4, 5, 2, 8, 6, 7, 3, 1]);
});

test('ejemplo de Goldberg (1989), variante clásica', () => {
  const A = [9, 8, 4, 5, 6, 7, 1, 3, 2, 10];
  const B = [8, 7, 1, 2, 3, 10, 9, 5, 4, 6];
  const { children } = ox(A, B, 3, 6, 'classic');
  // Goldberg llama B' al hijo con el segmento de A y el resto en el orden de B, y A' al simétrico.
  assert.deepEqual(children[0], [2, 3, 10, 5, 6, 7, 9, 4, 8, 1]);
  assert.deepEqual(children[1], [5, 6, 7, 2, 3, 10, 1, 9, 8, 4]);
});

test('ejemplo de Davis (1985): con el primer corte en 0 coincide con su «modified crossover»', () => {
  const a = [3, 1, 2, 6, 4, 5];
  const b = [4, 1, 6, 5, 2, 3];
  for (const v of ['from_start', 'left_to_right']) assert.deepEqual(ox(a, b, 0, 2, v).children[0], [3, 1, 4, 6, 5, 2]);
});

test('propiedades en 2000 casos por variante', () => {
  const r = rng.mulberry32(2024);
  for (const variant of VARIANTS) {
    for (let t = 0; t < 2000; t++) {
      const n = rng.randInt(r, 5, 12);
      const p1 = rng.randomPermutation(r, n);
      const p2 = rng.randomPermutation(r, n);
      const c1 = rng.randInt(r, 0, n - 1);
      const c2 = rng.randInt(r, c1 + 1, Math.min(n, c1 + n - 1));
      const res = ox(p1, p2, c1, c2, variant);
      const [h1, h2] = res.children;
      assert.ok(isPerm(h1, n) && isPerm(h2, n));
      for (let i = c1; i < c2; i++) { assert.equal(h1[i], p1[i]); assert.equal(h2[i], p2[i]); }
      assert.deepEqual(h1, oxRef(p1, p2, c1, c2, variant), `${variant} H1`);
      assert.deepEqual(h2, oxRef(p2, p1, c1, c2, variant), `${variant} H2`);
      // Orden relativo: los genes de fuera del segmento aparecen en el orden en que se leyó el otro padre
      const rd = res.aux.items[0];
      assert.deepEqual(rd.positions.map((i) => h1[i]), rd.list);
      const last = res.steps[res.steps.length - 1];
      assert.deepEqual(last.children[0].map((g) => g.v), h1);
      assert.deepEqual(last.children[1].map((g) => g.v), h2);
      for (let s = 1; s < res.steps.length; s++) {
        const filled = (st) => st.children.flat().filter(Boolean).length;
        const diff = filled(res.steps[s]) - filled(res.steps[s - 1]);
        if (res.steps[s].type === 'copySeg') assert.equal(diff, 2 * (c2 - c1));
        else assert.ok(diff === 0 || diff === 1);
      }
    }
  }
});

test('variante desconocida', () => {
  assert.throws(() => ox([1, 2, 3, 4, 5], [5, 4, 3, 2, 1], 1, 3, 'otra'), /errVariant/);
});
