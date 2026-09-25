'use strict';
// Comprueba que el material docente es coherente con la herramienta:
// el código descargable (Python y JavaScript) da los mismos hijos que la animación,
// y cada paso de la animación resalta líneas que existen en el pseudocódigo.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const tool = require('../js/operators/pmx.js');
const rng = require('../js/rng.js');
const content = require('../js/content/pmx.js');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pmx-content-'));

function randomCases(count, seed) {
  const r = rng.mulberry32(seed);
  const cases = [];
  while (cases.length < count) {
    const n = rng.randInt(r, 5, 12);
    const c1 = rng.randInt(r, 0, n - 1);
    const c2 = rng.randInt(r, c1 + 1, n);
    if (!tool.validateCuts(n, c1, c2)) continue;
    cases.push({ p1: rng.randomPermutation(r, n), p2: rng.randomPermutation(r, n), c1, c2 });
  }
  return cases;
}
const isPerm = (a, n) => a.length === n && new Set(a).size === n && a.every((v) => v >= 1 && v <= n);

for (const lang of ['es', 'en']) {
  test(`JavaScript descargable (${lang}) coincide con la herramienta`, () => {
    const file = path.join(tmp, `pmx-${lang}.js`);
    fs.writeFileSync(file, content.getCode('javascript', lang));
    assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /\{\{\w+\}\}/, 'quedan marcadores sin sustituir');
    const { pmx } = require(file);
    for (const c of randomCases(1500, lang === 'es' ? 1 : 2)) {
      assert.deepEqual(pmx(c.p1, c.p2, c.c1, c.c2), tool.pmx(c.p1, c.p2, c.c1, c.c2).children);
    }
    // Cortes aleatorios por defecto: siempre hijos válidos
    for (let t = 0; t < 300; t++) {
      const n = 5 + (t % 8);
      const p1 = rng.randomPermutation(Math.random, n);
      const p2 = rng.randomPermutation(Math.random, n);
      const [h1, h2] = pmx(p1, p2);
      assert.ok(isPerm(h1, n) && isPerm(h2, n));
    }
  });

  test(`Python descargable (${lang}) coincide con la herramienta`, (t) => {
    const py = ['python3', 'python'].find((cmd) => spawnSync(cmd, ['--version']).status === 0);
    if (!py) { t.skip('Python no está instalado'); return; }
    const src = content.getCode('python', lang);
    assert.doesNotMatch(src, /\{\{\w+\}\}/, 'quedan marcadores sin sustituir');
    fs.writeFileSync(path.join(tmp, 'pmx.py'), src);
    const cases = randomCases(1500, lang === 'es' ? 3 : 4);
    const driver = [
      'import json, random, sys',
      'from pmx import pmx',
      'cases = json.load(sys.stdin)',
      'out = [list(map(list, pmx(c["p1"], c["p2"], c["c1"], c["c2"]))) for c in cases]',
      'rnd = []',
      'for n in range(5, 13):',
      '    for _ in range(40):',
      '        p1 = random.sample(range(1, n + 1), n); p2 = random.sample(range(1, n + 1), n)',
      '        h1, h2 = pmx(p1, p2)',
      '        rnd.append(sorted(h1) == list(range(1, n + 1)) and sorted(h2) == list(range(1, n + 1)))',
      'print(json.dumps({"out": out, "randomOk": all(rnd)}))',
    ].join('\n');
    fs.writeFileSync(path.join(tmp, 'driver.py'), driver);
    const res = spawnSync(py, ['driver.py'], { cwd: tmp, input: JSON.stringify(cases), encoding: 'utf8' });
    assert.equal(res.status, 0, res.stderr);
    const { out, randomOk } = JSON.parse(res.stdout);
    cases.forEach((c, i) => assert.deepEqual(out[i], tool.pmx(c.p1, c.p2, c.c1, c.c2).children));
    assert.ok(randomOk, 'los cortes aleatorios de Python deben dar hijos válidos');
    // El ejemplo del bloque __main__ imprime el resultado de las transparencias
    const demo = spawnSync(py, ['pmx.py'], { cwd: tmp, encoding: 'utf8' });
    assert.equal(demo.stdout.trim(), '[4, 2, 3, 1, 8, 7, 6, 5, 9]\n[1, 8, 2, 4, 5, 6, 7, 9, 3]');
  });
}

test('cada tipo de paso resalta líneas que existen en el pseudocódigo', () => {
  const types = new Set();
  for (const c of randomCases(300, 5)) tool.pmx(c.p1, c.p2, c.c1, c.c2).steps.forEach((s) => types.add(s.type));
  for (const type of types) assert.ok(content.stepLines[type], `falta stepLines.${type}`);
  for (const lang of ['es', 'en']) {
    const ids = new Set(content.pseudocode[lang].map((l) => l.id));
    Object.values(content.stepLines).flat().forEach((id) => assert.ok(ids.has(id), `${lang}: falta la línea ${id}`));
  }
  assert.deepEqual(content.pseudocode.es.map((l) => l.id), content.pseudocode.en.map((l) => l.id));
});

test('explicación y referencias completas en ambos idiomas', () => {
  assert.equal(content.explanation.es.length, content.explanation.en.length);
  for (const ref of content.references) {
    assert.ok(ref.authors && ref.year && ref.title && ref.note.es && ref.note.en && ref.details.es && ref.details.en, ref.id);
    if (ref.url) assert.match(ref.url, /^https:\/\//);
  }
  assert.equal(content.references.filter((r) => r.original).length, 1);
});
