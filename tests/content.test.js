'use strict';
// Comprueba que el material docente de cada operador disponible es coherente con la herramienta:
// el código descargable (Python y JavaScript) da los mismos hijos que la animación, en todas
// las variantes, y cada paso de la animación resalta líneas que existen en el pseudocódigo.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const registry = require('../js/registry.js');
const rng = require('../js/rng.js');
const U = require('../js/operators/perm-utils.js');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ga-content-'));
const PY = ['python3', 'python'].find((cmd) => spawnSync(cmd, ['--version']).status === 0);
const readyOps = registry.representations.flatMap((r) => r.operators).filter((o) => o.ready);

function randomCases(count, seed) {
  const r = rng.mulberry32(seed);
  const cases = [];
  while (cases.length < count) {
    const n = rng.randInt(r, 5, 12);
    const c1 = rng.randInt(r, 0, n - 1);
    const c2 = rng.randInt(r, c1 + 1, n);
    if (!U.validateCuts(n, c1, c2)) continue;
    cases.push({ p1: rng.randomPermutation(r, n), p2: rng.randomPermutation(r, n), c1, c2, seed: cases.length + 1 });
  }
  return cases;
}
const isPerm = (a, n) => a.length === n && new Set(a).size === n && a.every((v) => v >= 1 && v <= n);

for (const op of readyOps) {
  const { spec } = require(`../js/operators/${op.id}.js`);
  const content = require(`../js/content/${op.id}.js`);
  const variants = spec.variants || [null];
  const cutsOf = (c) => (spec.cuts === 2 ? [c.c1, c.c2] : []);
  const toolRun = (c, v) => spec.run(c.p1, c.p2, cutsOf(c), { variant: v, seed: c.seed });
  const expected = (c, v) => toolRun(c, v).children;
  // Las elecciones al azar de la herramienta, para repetirlas en el código descargable
  const scripted = (choices) => { const q = choices.slice(); return () => (q.shift() === 'p1' ? 0.25 : 0.75); };
  const callJs = (fn, c, v) => {
    if (spec.cuts === 0) return fn(c.p1, c.p2, v, scripted(toolRun(c, v).choices || []));
    return v ? fn(c.p1, c.p2, c.c1, c.c2, v) : fn(c.p1, c.p2, c.c1, c.c2);
  };
  const pseudo = (lang, v) => (content.pseudocodeFor ? content.pseudocodeFor(lang, v) : content.pseudocode[lang]);

  for (const lang of ['es', 'en']) {
    test(`${op.id}: JavaScript descargable (${lang}) coincide con la herramienta`, () => {
      const file = path.join(tmp, `${op.id}-${lang}.js`);
      const src = content.getCode('javascript', lang);
      assert.doesNotMatch(src, /\{\{\w+\}\}/, 'quedan marcadores sin sustituir');
      fs.writeFileSync(file, src);
      const fn = require(file)[op.id];
      variants.forEach((v, vi) => {
        for (const c of randomCases(800, 11 + vi)) {
          assert.deepEqual(callJs(fn, c, v), expected(c, v), `variante ${v}`);
        }
      });
      for (let t = 0; t < 200; t++) {
        const n = 5 + (t % 8);
        const [h1, h2] = fn(rng.randomPermutation(Math.random, n), rng.randomPermutation(Math.random, n));
        assert.ok(isPerm(h1, n) && isPerm(h2, n), 'cortes aleatorios por defecto');
      }
    });

    test(`${op.id}: Python descargable (${lang}) coincide con la herramienta`, (t) => {
      if (!PY) { t.skip('Python no está instalado'); return; }
      const dir = fs.mkdtempSync(path.join(tmp, `${op.id}-${lang}-`));
      const src = content.getCode('python', lang);
      assert.doesNotMatch(src, /\{\{\w+\}\}/, 'quedan marcadores sin sustituir');
      fs.writeFileSync(path.join(dir, `${op.id}.py`), src);
      const cases = [];
      variants.forEach((v, vi) => randomCases(800, 21 + vi).forEach((c) => {
        cases.push(Object.assign({ v, cuts: spec.cuts, choices: toolRun(c, v).choices || [] }, c));
      }));
      const driver = [
        'import json, random, sys',
        `from ${op.id} import ${op.id} as fn`,
        'class Scripted:',
        '    def __init__(self, ch): self.ch = list(ch)',
        '    def random(self): return 0.25 if self.ch.pop(0) == "p1" else 0.75',
        'cases = json.load(sys.stdin)',
        'out = []',
        'for c in cases:',
        '    kw = {"variant": c["v"]} if c["v"] else {}',
        '    if c["cuts"] == 0:',
        '        res = fn(c["p1"], c["p2"], rng=Scripted(c["choices"]), **kw)',
        '    else:',
        '        res = fn(c["p1"], c["p2"], c["c1"], c["c2"], **kw)',
        '    out.append([list(h) for h in res])',
        'ok = True',
        'for n in range(5, 13):',
        '    for _ in range(30):',
        '        h1, h2 = fn(random.sample(range(1, n + 1), n), random.sample(range(1, n + 1), n))',
        '        ok = ok and sorted(h1) == list(range(1, n + 1)) and sorted(h2) == list(range(1, n + 1))',
        'print(json.dumps({"out": out, "randomOk": ok}))',
      ].join('\n');
      fs.writeFileSync(path.join(dir, 'driver.py'), driver);
      const res = spawnSync(PY, ['driver.py'], { cwd: dir, input: JSON.stringify(cases), encoding: 'utf8' });
      assert.equal(res.status, 0, res.stderr);
      const { out, randomOk } = JSON.parse(res.stdout);
      cases.forEach((c, i) => assert.deepEqual(out[i], expected(c, c.v), `variante ${c.v}`));
      assert.ok(randomOk, 'los cortes aleatorios de Python deben dar hijos válidos');
      // El bloque __main__ imprime lo que dicen sus comentarios
      const demo = spawnSync(PY, [`${op.id}.py`], { cwd: dir, encoding: 'utf8' });
      const promised = [...src.matchAll(/print\(h[12]\)\s+#\s*(\[.*\])/g)].map((m) => m[1]).join('\n');
      assert.equal(demo.stdout.trim(), promised);
    });
  }

  test(`${op.id}: cada paso resalta líneas que existen en el pseudocódigo`, () => {
    variants.forEach((v) => {
      const types = new Set();
      for (const c of randomCases(200, 5)) toolRun(c, v).steps.forEach((s) => types.add(s.type));
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
  });
}
