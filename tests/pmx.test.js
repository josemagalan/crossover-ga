'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { pmx, validateParents, validateCuts } = require('../js/operators/pmx.js');
const rng = require('../js/rng.js');

// Implementación independiente (versión por intercambios de Goldberg) para contrastar.
function pmxBySwaps(src, other, c1, c2) {
  const child = src.slice();
  for (let i = c1; i < c2; i++) {
    const j = child.indexOf(other[i]);
    [child[i], child[j]] = [child[j], child[i]];
  }
  return child;
}

const isPermOf = (arr, n) => arr.length === n && new Set(arr).size === n && arr.every((v) => v >= 1 && v <= n);

test('ejemplo de referencia (transparencias de Granada / Tema 5d)', () => {
  const p1 = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const p2 = [4, 5, 2, 1, 8, 7, 6, 9, 3];
  const { children } = pmx(p1, p2, 3, 7);
  assert.deepEqual(children[0], [4, 2, 3, 1, 8, 7, 6, 5, 9]);
  assert.deepEqual(children[1], [1, 8, 2, 4, 5, 6, 7, 9, 3]);
});

test('cadena de correspondencias de más de un salto', () => {
  // Segmento [2,5): P2 aporta 6 7 8 al Hijo 1; P1 tiene 3 4 5 ahí.
  // Pares: 3↔6, 4↔7, 5↔8. El 8 de P1 en la pos 7 choca: 8→5 (libre).
  const p1 = [1, 2, 3, 4, 5, 6, 7, 8];
  const p2 = [3, 4, 6, 7, 8, 1, 2, 5];
  const r = pmx(p1, p2, 2, 5);
  assert.deepEqual(r.children[0], pmxBySwaps(p1, p2, 2, 5));
  // Otro caso con cadena de dos saltos: pares 1↔2, 2↔3 -> 3 debe viajar 3→2→1
  const q1 = [1, 2, 4, 5, 3];
  const q2 = [2, 3, 5, 4, 1];
  const r2 = pmx(q1, q2, 0, 2);
  assert.deepEqual(r2.children[0], pmxBySwaps(q1, q2, 0, 2));
  const place = r2.steps.find((s) => s.type === 'place' && s.child === 0);
  assert.ok(place.chain.length >= 3, 'se esperaba una cadena de al menos dos saltos');
});

test('propiedades en 3000 casos aleatorios', () => {
  const r = rng.mulberry32(12345);
  let longChains = 0;
  for (let t = 0; t < 3000; t++) {
    const n = rng.randInt(r, 5, 12);
    const p1 = rng.randomPermutation(r, n);
    const p2 = rng.randomPermutation(r, n);
    const c1 = rng.randInt(r, 0, n - 1);
    const c2 = rng.randInt(r, c1 + 1, Math.min(n, c1 + n - 1));
    if (!validateCuts(n, c1, c2)) continue;
    const res = pmx(p1, p2, c1, c2);
    const [h1, h2] = res.children;

    assert.ok(isPermOf(h1, n) && isPermOf(h2, n), 'los hijos deben ser permutaciones');
    for (let i = c1; i < c2; i++) {
      assert.equal(h1[i], p2[i]);
      assert.equal(h2[i], p1[i]);
    }
    assert.deepEqual(h1, pmxBySwaps(p1, p2, c1, c2));
    assert.deepEqual(h2, pmxBySwaps(p2, p1, c1, c2));

    // Genes fuera del segmento que no chocan se heredan en su posición.
    const segSet1 = new Set(p2.slice(c1, c2));
    for (let i = 0; i < n; i++) {
      if ((i < c1 || i >= c2) && !segSet1.has(p1[i])) assert.equal(h1[i], p1[i]);
    }

    // La última instantánea de la traza coincide con el resultado.
    const last = res.steps[res.steps.length - 1];
    assert.equal(last.type, 'done');
    assert.deepEqual(last.children[0].map((g) => g.v), h1);
    assert.deepEqual(last.children[1].map((g) => g.v), h2);

    // Cada paso añade como mucho un gen (salvo el intercambio de segmentos).
    for (let s = 1; s < res.steps.length; s++) {
      const filled = (st) => st.children.flat().filter(Boolean).length;
      const diff = filled(res.steps[s]) - filled(res.steps[s - 1]);
      if (res.steps[s].type === 'swap') assert.equal(diff, 2 * (c2 - c1));
      else assert.ok(diff === 0 || diff === 1);
    }
    res.steps.filter((s) => s.type === 'place').forEach((s) => { if (s.chain.length > 2) longChains++; });
  }
  assert.ok(longChains > 0, 'los casos aleatorios deberían incluir cadenas largas');
});

test('validación de entradas', () => {
  assert.equal(validateParents([1, 2, 3, 4, 5], [1, 2, 3, 4]), 'errLength');
  assert.equal(validateParents([1, 2, 3, 4, 4], [1, 2, 3, 4, 5]), 'errPerm');
  assert.equal(validateParents([1, 2, 3, 4], [4, 3, 2, 1]), 'errRange');
  assert.equal(validateParents([1, 2, 3, 4, 5], [5, 4, 3, 2, 1]), null);
  assert.throws(() => pmx([1, 2, 3, 4, 5], [5, 4, 3, 2, 1], 0, 5), /errCuts/);
});

test('cortes aleatorios siempre válidos y con genes a ambos lados', () => {
  const r = rng.mulberry32(7);
  for (let t = 0; t < 1000; t++) {
    const n = rng.randInt(r, 5, 12);
    const [c1, c2] = rng.randomCuts(r, n);
    assert.ok(validateCuts(n, c1, c2));
    assert.ok(c1 >= 1 && c2 <= n - 1 && c2 - c1 >= 2);
  }
});
