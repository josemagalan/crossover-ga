'use strict';
// Coherencia del catálogo de operadores: cada operador disponible tiene su lógica,
// su contenido docente y sus textos, y los demás al menos nombre y resumen en ES/EN.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const registry = require('../js/registry.js');
const i18n = require('../js/i18n.js');
const rng = require('../js/rng.js');

const LEGEND_KEYS = ['p1', 'p2', 'mapped', 'conflict', 'segment'];
const ops = registry.representations.flatMap((rep) => rep.operators.map((op) => Object.assign({ rep }, op)));

test('ids únicos y textos en español e inglés', () => {
  const ids = ops.map((o) => o.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const rep of registry.representations) {
    for (const k of ['name', 'desc']) assert.ok(rep[k].es && rep[k].en, `${rep.id}.${k}`);
    assert.ok(rep.sample.length > 0);
  }
  for (const op of ops) {
    assert.ok(op.name.es && op.name.en && op.summary.es && op.summary.en, op.id);
    assert.equal(registry.getOperator(op.id).representation, op.rep.id);
  }
});

for (const op of ops.filter((o) => o.ready)) {
  test(`operador disponible «${op.id}»: lógica, contenido y narración`, () => {
    const impl = require(path.join('..', 'js', 'operators', `${op.id}.js`));
    const content = require(path.join('..', 'js', 'content', `${op.id}.js`));
    const { spec } = impl;
    assert.equal(spec.id, op.id);
    assert.equal(spec.representation, op.rep.id);
    assert.equal(content.id, op.id);
    assert.ok(op.subtitle && op.subtitle.es && op.subtitle.en);
    assert.ok(Array.isArray(spec.legend) && spec.legend.every((k) => LEGEND_KEYS.includes(k)));
    assert.ok(Number.isInteger(spec.cuts) && spec.cuts >= 0);

    // Cada clave de texto que emite la traza existe en la narración del operador (o en la interfaz general)
    const r = rng.mulberry32(99);
    const keys = new Set();
    for (let t = 0; t < 200; t++) {
      const n = rng.randInt(r, 5, 12);
      const cuts = spec.cuts === 2 ? rng.randomCuts(r, n) : [];
      const res = spec.run(rng.randomPermutation(r, n), rng.randomPermutation(r, n), cuts);
      res.steps.forEach((s) => keys.add(s.text.key));
    }
    const legendLabels = { mapped: 'legendMapped' };
    for (const lang of ['es', 'en']) {
      const has = (k) => (content.narration[lang] && content.narration[lang][k] != null) || i18n.dict[lang][k] != null;
      keys.forEach((k) => assert.ok(has(k), `${lang}: falta el texto «${k}»`));
      spec.legend.filter((k) => legendLabels[k]).forEach((k) => assert.ok(has(legendLabels[k]), `${lang}: falta ${legendLabels[k]}`));
    }
  });
}

test('la página carga los scripts de cada operador disponible', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  for (const op of ops.filter((o) => o.ready)) {
    assert.match(html, new RegExp(`src="js/operators/${op.id}\\.js"`));
    assert.match(html, new RegExp(`src="js/content/${op.id}\\.js"`));
  }
});

test('interfaz general: mismas claves en ambos idiomas', () => {
  assert.deepEqual(Object.keys(i18n.dict.es).sort(), Object.keys(i18n.dict.en).sort());
});
