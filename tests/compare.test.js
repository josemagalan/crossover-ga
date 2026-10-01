'use strict';
// Comparación de operadores: métricas de lo que conserva cada hijo, cortes compartidos y medias.
const test = require('node:test');
const assert = require('node:assert/strict');

const C = require('../js/compare.js');
const R = require('../js/rng.js');
const registry = require('../js/registry.js');
const B = require('../js/operators/bin-utils.js');
const U = require('../js/operators/real-utils.js');

const opsOf = (rep) => registry.getRepresentation(rep).operators.filter((o) => o.ready)
  .map((o) => ({ id: o.id, spec: require(`../js/operators/${o.id}.js`).spec }));
const rotate = (a, k) => a.slice(k).concat(a.slice(0, k));

test('permutación: un padre, girado o no, conserva el orden circular y las adyacencias', () => {
  const p1 = [1, 2, 3, 4, 5, 6, 7, 8];
  const p2 = [3, 7, 5, 1, 6, 8, 2, 4];
  assert.deepEqual(C.permMetrics(p1, p1, p2), { position: 1, order: 1, adjacency: 1, clone: 1, valid: 1 });
  const rot = C.permMetrics(rotate(p1, 3), p1, p2);
  assert.equal(rot.order, 1);
  assert.equal(rot.adjacency, 1);
  assert.equal(rot.clone, 0);
  // Recorrido al revés: mismas adyacencias, sentido contrario en todos los tríos
  const rev = C.permMetrics(p1.slice().reverse(), p1, p2);
  assert.equal(rev.adjacency, 1);
  assert.equal(rev.order, 0);
});

test('permutación: hijo con genes repetidos (contraejemplo)', () => {
  const p1 = [1, 2, 3, 4, 5, 6];
  const p2 = [6, 5, 4, 3, 2, 1];
  const child = [1, 2, 3, 3, 2, 1];   // cabeza de P1 + cola de P2
  const m = C.permMetrics(child, p1, p2);
  assert.equal(m.valid, 0);
  assert.equal(m.position, 1);
  const g = C.geneClasses('permutation', child, p1, p2);
  assert.deepEqual(g.map((x) => x.dup), [true, true, true, true, true, true]);
  assert.deepEqual(g.map((x) => x.cls), ['p1', 'p1', 'p1', 'p2', 'p2', 'p2']);
});

test('propiedades de los operadores de permutación en muchos casos', () => {
  const r = R.mulberry32(5);
  const ops = Object.fromEntries(opsOf('permutation').map((o) => [o.id, o.spec]));
  for (let t = 0; t < 300; t++) {
    const n = R.randInt(r, 5, 12);
    const p1 = R.randomPermutation(r, n);
    const p2 = R.randomPermutation(r, n);
    const cuts = R.randomCuts(r, n);
    const run = (id, c) => ops[id].run(p1, p2, c, { seed: t + 1, variant: ops[id].defaultVariant });
    run('cx', []).children.forEach((h) => assert.equal(C.permMetrics(h, p1, p2).position, 1));
    ['pmx', 'ox', 'cx'].forEach((id) => run(id, cuts).children.forEach((h) => assert.equal(C.permMetrics(h, p1, p2).valid, 1)));
    run('one-point-perm', [cuts[0] || 1]).children.forEach((h) => assert.equal(C.permMetrics(h, p1, p2).position, 1));
    run('pmx', cuts).children.forEach((h) => {
      const m = C.permMetrics(h, p1, p2);
      Object.values(m).forEach((v) => assert.ok(v >= 0 && v <= 1));
    });
  }
});

test('binaria: padre propio y tramos', () => {
  const p1 = [1, 1, 0, 0, 1, 0, 0, 1];
  const p2 = [0, 0, 1, 0, 1, 1, 0, 0];
  assert.deepEqual(C.binMetrics(p1, p1, p2, 0), { own: 1, segments: 1 });
  assert.deepEqual(C.binMetrics(p1, p1, p2, 1), { own: 0, segments: 1 });
  const r = R.mulberry32(8);
  const one = require('../js/operators/one-point.js').spec;
  const two = require('../js/operators/two-point.js').spec;
  for (let t = 0; t < 500; t++) {
    const n = R.randInt(r, 5, 12);
    const a = B.randomBits(r, n);
    const b = B.randomBits(r, n);
    const c = R.randInt(r, 1, n - 1);
    one.run(a, b, [c]).children.forEach((h, k) => assert.ok(C.binMetrics(h, a, b, k).segments <= 2));
    two.run(a, b, R.randomCuts(r, n)).children.forEach((h, k) => assert.ok(C.binMetrics(h, a, b, k).segments <= 3));
  }
  const g = C.geneClasses('binary', [1, 0, 1, 0, 1, 0, 0, 1], p1, p2);
  assert.deepEqual(g.map((x) => x.cls), ['p1', 'p2', 'p2', 'same', 'same', 'p1', 'same', 'p1']);
});

test('real: uniforme copia, aritmético interpola, BLX-0 no sale del intervalo', () => {
  const p1 = [2.0, 4.5, 1.0, 8.0, 6.5, 3.0];
  const p2 = [6.0, 0.5, 3.0, 9.0, 2.5, 7.0];
  const uni = require('../js/operators/uniform-real.js').spec.run(p1, p2, [], { seed: 3, params: { p: 0.5 } });
  uni.children.forEach((h) => assert.deepEqual(C.realMetrics(h, p1, p2), { copied: 1, inside: 1, distance: 0 }));
  const ari = require('../js/operators/arithmetic.js').spec.run(p1, p2, [], { params: { lambda: 0.5 } });
  ari.children.forEach((h) => {
    const m = C.realMetrics(h, p1, p2);
    assert.equal(m.copied, 0);
    assert.equal(m.inside, 1);
    assert.ok(Math.abs(m.distance - 0.5) < 1e-9);
  });
  const blx = require('../js/operators/blx.js').spec.run(p1, p2, [], { seed: 4, params: { alpha: 0 } });
  blx.children.forEach((h) => assert.equal(C.realMetrics(h, p1, p2).inside, 1));
  const g = C.geneClasses('real', [2.0, 2.5, 0.5, 9.0, 4.0, 3.0], p1, p2);
  assert.deepEqual(g.map((x) => x.cls), ['p1', 'inside', 'outside', 'p2', 'inside', 'p1']);
});

test('cortes compartidos entre operadores', () => {
  const r = R.mulberry32(1);
  const spec = (id) => require(`../js/operators/${id}.js`).spec;
  assert.deepEqual(C.deriveCuts(spec('pmx'), [2, 5], 8, r).cuts, [2, 5]);
  assert.deepEqual(C.deriveCuts(spec('one-point-perm'), [2, 5], 8, r).cuts, [2]);
  assert.deepEqual(C.deriveCuts(spec('one-point'), [0, 5], 8, r).cuts, [5]);
  assert.deepEqual(C.deriveCuts(spec('n-point'), [2, 5], 8, r), { cuts: [2, 5], k: 2 });
  assert.deepEqual(C.deriveCuts(spec('pmx'), [3], 8, r).cuts.length, 2);
  assert.deepEqual(C.deriveCuts(spec('cx'), [2, 5], 8, r).cuts, []);
  for (let t = 0; t < 200; t++) {
    const n = R.randInt(r, 5, 12);
    const d = C.deriveCuts(spec('n-point'), [], n, r, 4);
    assert.equal(d.cuts.length, Math.min(4, n - 1));
    assert.ok(d.cuts.every((c, i) => c >= 1 && c <= n - 1 && (i === 0 || c > d.cuts[i - 1])));
  }
});

test('comparar: reproducible, mismos cortes y medias coherentes', () => {
  const r = R.mulberry32(11);
  const cases = {
    permutation: [R.randomPermutation(r, 8), R.randomPermutation(r, 8), [2, 6], 'pmx'],
    binary: [B.randomBits(r, 9), B.randomBits(r, 9), [3], 'one-point'],
    real: [U.randomReals(r, 7), U.randomReals(r, 7), [], 'blx'],
  };
  for (const [rep, [p1, p2, cuts, from]] of Object.entries(cases)) {
    const opts = { rep, ops: opsOf(rep), p1, p2, cuts, from, draw: 9, reps: 200, seed: 4 };
    const a = C.compare(opts);
    assert.deepEqual(C.compare(opts), a, `${rep}: misma entrada, mismo resultado`);
    const quick = C.compare(Object.assign({}, opts, { reps: 0 }));
    quick.forEach((row, i) => {
      assert.equal(row.mean, null);
      assert.deepEqual(row.children, a[i].children, 'el ejemplo no depende de las repeticiones');
    });
    a.forEach((row) => {
      assert.deepEqual(row.example, C.pairMetrics(rep, row.children, p1, p2));
      C.METRICS[rep].forEach((m) => {
        assert.ok(Number.isFinite(row.mean[m.id]));
        if (m.kind === 'pct') assert.ok(row.mean[m.id] >= 0 && row.mean[m.id] <= 1);
      });
    });
    assert.deepEqual(a.find((x) => x.id === from).cuts, cuts);
  }
  // Permutación: PMX y OX con el mismo segmento; el contraejemplo con el primer corte
  const perm = C.compare({ rep: 'permutation', ops: opsOf('permutation'), p1: cases.permutation[0], p2: cases.permutation[1], cuts: [2, 6], from: 'pmx', reps: 0, seed: 1 });
  const byId = Object.fromEntries(perm.map((x) => [x.id, x]));
  assert.deepEqual(byId.ox.cuts, [2, 6]);
  assert.deepEqual(byId['one-point-perm'].cuts, [2]);
  assert.deepEqual(byId.cx.cuts, []);
  // Sin cortes de origen, los operadores con cortes comparten unos al azar
  const none = C.compare({ rep: 'permutation', ops: opsOf('permutation'), p1: cases.permutation[0], p2: cases.permutation[1], cuts: [], reps: 0, seed: 3 });
  const nb = Object.fromEntries(none.map((x) => [x.id, x]));
  assert.deepEqual(nb.pmx.cuts, nb.ox.cuts);
  assert.equal(nb['one-point-perm'].cuts[0], nb.pmx.cuts[0]);
});

test('comparar: CX sin mezcla aparece como copia de un padre', () => {
  // Padres con un único ciclo: CX siempre devuelve una copia de un padre.
  const p1 = [1, 2, 3, 4, 5, 6];
  const p2 = [2, 3, 4, 5, 6, 1];
  const rows = C.compare({ rep: 'permutation', ops: opsOf('permutation'), p1, p2, cuts: [1, 4], reps: 100, seed: 2 });
  const cx = rows.find((x) => x.id === 'cx');
  assert.equal(cx.mean.clone, 1);
  assert.equal(cx.example.clone, 1);
});

// ---------- Media con padres al azar (fase 10) ----------

test('padres al azar: reproducible y sin depender de cómo se reparta en tandas', () => {
  const opts = { rep: 'permutation', ops: opsOf('permutation'), n: 8, pairs: 40, reps: 3, seed: 5 };
  const a = C.randomMean(opts);
  assert.deepEqual(C.randomMean(opts), a);
  const acc = C.randomMeanStart(opts);
  assert.equal(C.randomMeanResult(acc), null);
  let done = 0;
  while (done < 1) done = C.randomMeanStep(acc, 7);
  assert.deepEqual(C.randomMeanResult(acc), a);
  // Otra semilla, otras parejas
  assert.notDeepEqual(C.randomMean(Object.assign({}, opts, { seed: 6 })), a);
});

test('padres al azar: parejas distintas y válidas en las tres representaciones', () => {
  const rng = R.mulberry32(3);
  for (const rep of ['permutation', 'binary', 'real']) {
    for (let i = 0; i < 50; i++) {
      const [p1, p2] = C.randomPair(rep, rng, 6);
      assert.equal(p1.length, 6);
      assert.notDeepEqual(p1, p2);
      if (rep === 'permutation') assert.deepEqual(p1.slice().sort((a, b) => a - b), [1, 2, 3, 4, 5, 6]);
      if (rep === 'binary') assert.ok(p1.every((g) => g === 0 || g === 1));
    }
  }
});

test('padres al azar: permutación con lo esperado de cada operador', () => {
  const m = C.randomMean({ rep: 'permutation', ops: opsOf('permutation'), n: 8, pairs: 60, reps: 4, seed: 1 });
  assert.equal(m.cx.position, 1);
  ['pmx', 'ox', 'cx', 'erx'].forEach((id) => assert.equal(m[id].valid, 1));
  assert.ok(m['one-point-perm'].valid < 0.3);
  assert.equal(m['one-point-perm'].position, 1);
  assert.ok(m.erx.adjacency > m.pmx.adjacency);
  assert.ok(m.ox.order > m.pmx.order);
  assert.ok(m.pmx.position > m.ox.position);
  assert.ok(m.cx.clone > 0.3);   // con n = 8 muchos hijos de CX son copias de un padre
});

test('padres al azar: binaria y real, y respeta los ajustes del operador de origen', () => {
  const b = C.randomMean({ rep: 'binary', ops: opsOf('binary'), n: 8, pairs: 30, reps: 3, seed: 2 });
  Object.values(b).forEach((x) => { assert.ok(x.own >= 0 && x.own <= 1); assert.ok(x.segments >= 1); });
  const r = C.randomMean({ rep: 'real', ops: opsOf('real'), n: 6, pairs: 30, reps: 3, seed: 2 });
  assert.equal(r['uniform-real'].copied, 1);
  assert.equal(r.arithmetic.inside, 1);
  assert.ok(r.blx.inside < 1);
  const r0 = C.randomMean({ rep: 'real', ops: opsOf('real'), n: 6, pairs: 30, reps: 3, seed: 2, from: 'blx', params: { alpha: 0 } });
  assert.equal(r0.blx.inside, 1);   // con α = 0, BLX solo muestrea entre los padres
});
