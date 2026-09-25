'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { onePointPerm } = require('../js/operators/one-point-perm.js');
const rng = require('../js/rng.js');

test('ejemplo: corte tras la posición 3', () => {
  const p1 = [1, 2, 3, 4, 5, 6, 7, 8];
  const p2 = [2, 4, 6, 8, 7, 5, 3, 1];
  const res = onePointPerm(p1, p2, 3);
  assert.deepEqual(res.children[0], [1, 2, 3, 8, 7, 5, 3, 1]);
  assert.deepEqual(res.children[1], [2, 4, 6, 4, 5, 6, 7, 8]);
  assert.equal(res.valid, false);
  assert.deepEqual(res.defects[0].repeated, [1, 3]);
  assert.deepEqual(res.defects[0].missing, [4, 6]);
  assert.deepEqual(res.defects[1].repeated, [4, 6]);
  assert.deepEqual(res.defects[1].missing, [1, 3]);
});

test('lo que sobra en un hijo es lo que falta en el otro', () => {
  const r = rng.mulberry32(5);
  let invalid = 0;
  for (let t = 0; t < 3000; t++) {
    const n = rng.randInt(r, 5, 12);
    const p1 = rng.randomPermutation(r, n);
    const p2 = rng.randomPermutation(r, n);
    const c = rng.randInt(r, 1, n - 1);
    const res = onePointPerm(p1, p2, c);
    assert.deepEqual(res.children[0], p1.slice(0, c).concat(p2.slice(c)));
    assert.deepEqual(res.defects[0].repeated, res.defects[1].missing);
    assert.deepEqual(res.defects[1].repeated, res.defects[0].missing);
    assert.equal(res.valid, res.defects[0].repeated.length === 0 && res.defects[1].repeated.length === 0);
    if (!res.valid) invalid++;
  }
  assert.ok(invalid > 2500, 'en la gran mayoría de los casos los hijos no son permutaciones');
});

test('caso afortunado: colas con los mismos genes', () => {
  const res = onePointPerm([1, 2, 3, 4, 5], [2, 1, 3, 5, 4], 2);
  assert.equal(res.valid, true);
  assert.equal(res.steps.find((s) => s.type === 'check').text.key, 'checkNone');
});
