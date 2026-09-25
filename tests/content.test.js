'use strict';
// Comprueba que el material docente de cada operador disponible es coherente con la herramienta:
// el código descargable (Python y JavaScript) da los mismos hijos que la animación, en todas
// las variantes y con los mismos sorteos, y cada paso de la animación resalta líneas que
// existen en el pseudocódigo.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const registry = require('../js/registry.js');
const rng = require('../js/rng.js');
const B = require('../js/operators/bin-utils.js');
const U = require('../js/operators/real-utils.js');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ga-content-'));
const PY = ['python3', 'python'].find((cmd) => spawnSync(cmd, ['--version']).status === 0);
const readyOps = registry.representations.flatMap((r) => r.operators.map((o) => Object.assign({ rep: r.id }, o))).filter((o) => o.ready);

const GEN = {
  permutation: (r, n) => rng.randomPermutation(r, n),
  binary: (r, n) => B.randomBits(r, n),
  real: (r, n) => U.randomReals(r, n),
};
const isPerm = (a, n) => a.length === n && new Set(a).size === n && a.every((v) => v >= 1 && v <= n);

/**
 * Forma de llamar a la función descargable de cada operador, deducida de su `spec`:
 *   cuts2   f(p1, p2, c1, c2[, variante])     PMX, OX, dos puntos
 *   cut1    f(p1, p2, c)                      un punto, contraejemplo
 *   cutsK   f(p1, p2, cortes)                 n puntos
 *   pRng    f(p1, p2, p, azar)                uniforme (binario y real)
 *   lam     f(p1, p2, λ)                      aritmético
 *   vRng    f(p1, p2, variante, azar)         CX
 */
function styleOf(spec) {
  if (spec.params && spec.params.some((p) => p.id === 'p')) return 'pRng';
  if (spec.params && spec.params.some((p) => p.id === 'lambda')) return 'lam';
  if (spec.cuts === 'k') return 'cutsK';
  if (spec.cuts === 0) return 'vRng';
  if (spec.cuts === 1) return 'cut1';
  return 'cuts2';
}

function makeCases(op, spec, count, seed, variant) {
  const r = rng.mulberry32(seed);
  const cases = [];
  while (cases.length < count) {
    const n = rng.randInt(r, 5, 12);
    const p1 = GEN[op.rep](r, n);
    const p2 = GEN[op.rep](r, n);
    const c = { v: variant, n, p1, p2, seed: cases.length + 1, params: {} };
    const st = styleOf(spec);
    if (st === 'cuts2') { c.c1 = rng.randInt(r, 0, n - 1); c.c2 = rng.randInt(r, c.c1 + 1, Math.min(n, c.c1 + n - 1)); c.cuts = [c.c1, c.c2]; }
    else if (st === 'cut1') { c.cut = rng.randInt(r, 1, n - 1); c.cuts = [c.cut]; }
    else if (st === 'cutsK') {
      const k = rng.randInt(r, 1, Math.min(5, n - 1));
      c.params.k = k;
      c.cuts = rng.shuffle(r, Array.from({ length: n - 1 }, (_, i) => i + 1)).slice(0, k).sort((a, b) => a - b);
    } else { c.cuts = []; }
    if (st === 'pRng') c.params.p = [0.1, 0.25, 0.5][cases.length % 3];
    if (st === 'lam') c.params.lambda = [0, 0.05, 0.25, 0.35, 0.5, 0.7, 1][cases.length % 7];
    const res = spec.run(p1, p2, c.cuts, { variant, seed: c.seed, params: c.params });
    c.expected = res.children;
    c.draws = res.draws || null;         // uniforme: números sorteados
    c.choices = res.choices || null;     // CX: padre elegido para cada ciclo
    c.style = st;
    cases.push(c);
  }
  return cases;
}

// Sustituto de Math.random / random.random que repite los sorteos de la herramienta
function scriptedJs(c) {
  if (c.draws) { const q = c.draws.slice(); return () => q.shift(); }
  const q = (c.choices || []).slice();
  return () => (q.shift() === 'p1' ? 0.25 : 0.75);
}

function callJs(fn, c) {
  switch (c.style) {
    case 'cuts2': return c.v ? fn(c.p1, c.p2, c.c1, c.c2, c.v) : fn(c.p1, c.p2, c.c1, c.c2);
    case 'cut1': return fn(c.p1, c.p2, c.cut);
    case 'cutsK': return fn(c.p1, c.p2, c.cuts);
    case 'pRng': return fn(c.p1, c.p2, c.params.p, scriptedJs(c));
    case 'lam': return fn(c.p1, c.p2, c.params.lambda);
    default: return fn(c.p1, c.p2, c.v, scriptedJs(c));
  }
}

const PY_DRIVER = (moduleName, fnName) => [
  'import json, random, sys',
  `from ${moduleName} import ${fnName} as fn`,
  'class Scripted:',
  '    def __init__(self, c):',
  '        self.q = list(c["draws"]) if c.get("draws") else [0.25 if x == "p1" else 0.75 for x in (c.get("choices") or [])]',
  '    def random(self): return self.q.pop(0)',
  'def call(c):',
  '    st = c["style"]',
  '    if st == "cuts2":',
  '        kw = {"variant": c["v"]} if c.get("v") else {}',
  '        return fn(c["p1"], c["p2"], c["c1"], c["c2"], **kw)',
  '    if st == "cut1": return fn(c["p1"], c["p2"], c["cut"])',
  '    if st == "cutsK": return fn(c["p1"], c["p2"], c["cuts"])',
  '    if st == "pRng": return fn(c["p1"], c["p2"], c["params"]["p"], rng=Scripted(c))',
  '    if st == "lam": return fn(c["p1"], c["p2"], c["params"]["lambda"])',
  '    return fn(c["p1"], c["p2"], variant=c["v"], rng=Scripted(c))',
  'cases = json.load(sys.stdin)',
  'print(json.dumps([[list(h) for h in call(c)] for c in cases]))',
].join('\n');

for (const op of readyOps) {
  const { spec } = require(`../js/operators/${op.id}.js`);
  const content = require(`../js/content/${op.id}.js`);
  const variants = spec.variants || [null];
  const fnName = (lang) => (content.fnName ? content.fnName[lang] : op.id);
  const pseudo = (lang, v) => (content.pseudocodeFor ? content.pseudocodeFor(lang, v) : content.pseudocode[lang]);
  const allCases = (seedBase) => variants.flatMap((v, vi) => makeCases(op, spec, 600, seedBase + vi, v));

  for (const lang of ['es', 'en']) {
    test(`${op.id}: JavaScript descargable (${lang}) coincide con la herramienta`, () => {
      const src = content.getCode('javascript', lang);
      assert.doesNotMatch(src, /\{\{\w+\}\}/, 'quedan marcadores sin sustituir');
      const file = path.join(tmp, `${op.id}-${lang}.js`);
      fs.writeFileSync(file, src);
      const fn = require(file)[fnName('javascript')];
      for (const c of allCases(11)) assert.deepEqual(callJs(fn, c), c.expected, `variante ${c.v}`);
      // Sin argumentos opcionales (cortes o sorteo al azar): hijos de la longitud correcta y,
      // en permutaciones, válidos (salvo el contraejemplo, que precisamente no lo garantiza)
      for (let t = 0; t < 200; t++) {
        const n = 5 + (t % 8);
        const p1 = GEN[op.rep](Math.random, n);
        const p2 = GEN[op.rep](Math.random, n);
        const [h1, h2] = fn(p1, p2);
        assert.ok(h1.length === n && h2.length === n);
        if (op.rep === 'permutation' && !spec.invalidChildren) assert.ok(isPerm(h1, n) && isPerm(h2, n));
      }
    });

    test(`${op.id}: Python descargable (${lang}) coincide con la herramienta`, (t) => {
      if (!PY) { t.skip('Python no está instalado'); return; }
      const src = content.getCode('python', lang);
      assert.doesNotMatch(src, /\{\{\w+\}\}/, 'quedan marcadores sin sustituir');
      const dir = fs.mkdtempSync(path.join(tmp, `${op.id}-${lang}-`));
      const pyFile = content.codeTemplates.python.filename;
      fs.writeFileSync(path.join(dir, pyFile), src);
      fs.writeFileSync(path.join(dir, 'driver.py'), PY_DRIVER(pyFile.replace(/\.py$/, ''), fnName('python')));
      const cases = allCases(21);
      const res = spawnSync(PY, ['driver.py'], { cwd: dir, input: JSON.stringify(cases), encoding: 'utf8' });
      assert.equal(res.status, 0, res.stderr);
      JSON.parse(res.stdout).forEach((out, i) => assert.deepEqual(out, cases[i].expected, `variante ${cases[i].v}`));
      // El bloque __main__ imprime lo que prometen sus comentarios
      const demo = spawnSync(PY, [pyFile], { cwd: dir, encoding: 'utf8' });
      assert.equal(demo.status, 0, demo.stderr);
      const promised = [...src.matchAll(/print\(h[12]\)\s+#\s*(\[.*\])/g)].map((m) => m[1]);
      assert.deepEqual(demo.stdout.trim().split('\n').slice(0, promised.length), promised);
    });
  }

  test(`${op.id}: cada paso resalta líneas que existen en el pseudocódigo`, () => {
    variants.forEach((v) => {
      const types = new Set();
      makeCases(op, spec, 150, 5, v).forEach((c) => {
        spec.run(c.p1, c.p2, c.cuts, { variant: v, seed: c.seed, params: c.params }).steps.forEach((s) => types.add(s.type));
      });
      for (const type of types) assert.ok(content.stepLines[type], `falta stepLines.${type}`);
      for (const lang of ['es', 'en']) {
        const ids = new Set(pseudo(lang, v).map((l) => l.id));
        for (const type of types) content.stepLines[type].forEach((id) => assert.ok(ids.has(id), `${lang}/${v}: falta la línea ${id}`));
      }
      assert.deepEqual(pseudo('es', v).map((l) => l.id), pseudo('en', v).map((l) => l.id));
    });
  });

  test(`${op.id}: explicación, variantes y referencias en ambos idiomas`, () => {
    assert.equal(content.explanation.es.length, content.explanation.en.length);
    for (const ref of content.references) {
      assert.ok(ref.authors && ref.year && ref.title && ref.note.es && ref.note.en && ref.details.es && ref.details.en, ref.id);
      if (ref.url) assert.match(ref.url, /^https:\/\//);
    }
    assert.ok(content.references.filter((r) => r.original).length <= 1);
    if (spec.variants) {
      assert.ok(spec.variants.includes(spec.defaultVariant));
      for (const v of spec.variants) {
        const meta = content.variants[v];
        assert.ok(meta && meta.name.es && meta.name.en && meta.desc.es && meta.desc.en, `variante ${v}`);
      }
    }
    for (const pr of spec.params || []) {
      for (const lang of ['es', 'en']) assert.ok(content.narration[lang][`param${pr.id.toUpperCase()}`], `${lang}: falta la etiqueta del parámetro ${pr.id}`);
    }
  });
}
