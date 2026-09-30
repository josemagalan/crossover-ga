'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../js/moodle.js');
const { pmx } = require('../js/operators/pmx.js');
const { ox } = require('../js/operators/ox.js');
const { cx } = require('../js/operators/cx.js');
const { onePoint } = require('../js/operators/one-point.js');
const { twoPoint } = require('../js/operators/two-point.js');
const { uniform } = require('../js/operators/uniform-binary.js');

const ALL = M.KINDS.map((k) => k.id);
const bank = {};
['es', 'en'].forEach((lang) => {
  bank[lang] = M.generate({ lang, kinds: ALL, levels: M.LEVELS, count: 6, n: 8, seed: 424242 });
  bank[lang].xml = M.toXml(bank[lang]);
});

// ---------- Lectura de lo que ve el alumno (independiente de los campos internos) ----------

function rows(html) {
  const out = [];
  for (const m of html.matchAll(/<tr><th[^>]*>([^<]*)<\/th>(.*?)<\/tr>/g)) {
    const tds = [...m[2].matchAll(/<td style="([^"]*)">(.*?)<\/td>/g)];
    out.push({ label: m[1], cells: tds.map((t) => t[2]), cuts: tds.map((t, i) => (t[1].includes('border-left') ? i : -1)).filter((i) => i >= 0) });
  }
  return out;
}
const nums = (cells) => cells.map(Number);
const clozeAnswers = (cells) => cells.map((c) => Number(c.match(/^\{1:SHORTANSWER:=(\d+)\}$/)[1]));

function readQuestion(q) {
  const rs = rows(q.text);
  const byLabel = (re) => rs.find((r) => re.test(r.label));
  const p1r = byLabel(/^(Padre|Parent) 1$/);
  return {
    p1: nums(p1r.cells), p2: nums(byLabel(/^(Padre|Parent) 2$/).cells), cuts: p1r.cuts,
    kids: rs.filter((r) => /^(Hijo|Child) [12]$/.test(r.label) && r.cells[0].startsWith('{1:')).map((r) => clozeAnswers(r.cells)),
    shown: (byLabel(/^(Hijo|Child)$|estudiante|Student/) || { cells: [] }).cells.map(Number),
    mask: (byLabel(/^(Máscara|Mask)$/) || { cells: [] }).cells.map(Number),
  };
}

function hashOf(link) {
  return new URLSearchParams(link.split('#')[1]);
}

// ---------- Pruebas ----------

test('se generan todos los tipos y niveles sin huecos', () => {
  ['es', 'en'].forEach((lang) => {
    const b = bank[lang];
    assert.equal(b.missing.length, 0, JSON.stringify(b.missing));
    assert.equal(b.questions.length, ALL.length * M.LEVELS.length * 6);
  });
});

test('«calcular hijos»: las casillas coinciden con el operador aplicado a lo que muestra el enunciado', () => {
  bank.es.questions.concat(bank.en.questions).filter((q) => q.kind.startsWith('calc-')).forEach((q) => {
    const s = readQuestion(q);
    let exp;
    if (q.kind === 'calc-pmx') exp = pmx(s.p1, s.p2, s.cuts[0], s.cuts[1]).children;
    else if (q.kind === 'calc-ox') exp = ox(s.p1, s.p2, s.cuts[0], s.cuts[1], 'from_start').children;
    else if (q.kind === 'calc-cx') {
      // la regla del enunciado fija el padre de cada ciclo
      const rule = [...q.text.matchAll(/(?:ciclo, del Padre|comes from Parent) (\d)/g)].map((m) => `p${m[1]}`);
      exp = cx(s.p1, s.p2, 'random', { choices: rule }).children;
    } else if (q.kind === 'calc-one-point') exp = onePoint(s.p1, s.p2, s.cuts[0]).children;
    else if (q.kind === 'calc-two-point') exp = twoPoint(s.p1, s.p2, s.cuts[0], s.cuts[1]).children;
    else {
      exp = [s.p1.map((g, i) => (s.mask[i] ? s.p2[i] : g)), s.p2.map((g, i) => (s.mask[i] ? s.p1[i] : g))];
    }
    assert.deepEqual(s.kids, exp, q.name);
    if (!q.kind.includes('point') && !q.kind.includes('binary')) s.kids.forEach((h) => assert.equal(new Set(h).size, h.length, q.name));
  });
});

test('opción múltiple: una sola correcta y penalización −1/(k−1)', () => {
  const xml = bank.es.xml;
  const blocks = [...xml.matchAll(/<question type="multichoice">([\s\S]*?)<\/question>/g)].map((m) => m[1]);
  assert.ok(blocks.length > 0);
  blocks.forEach((b) => {
    const fr = [...b.matchAll(/<answer fraction="([^"]+)"/g)].map((m) => Number(m[1]));
    assert.equal(fr.length, 4);
    assert.equal(fr.filter((f) => f === 100).length, 1);
    fr.filter((f) => f !== 100).forEach((f) => assert.ok(Math.abs(f + 100 / 3) < 1e-4));
    assert.match(b, /<shuffleanswers>1<\/shuffleanswers>/);
  });
});

test('«identificar el operador»: el hijo mostrado es el del operador marcado como correcto y los cuatro difieren', () => {
  bank.es.questions.filter((q) => q.kind === 'identify').forEach((q) => {
    const s = readQuestion(q);
    const [c1, c2] = s.cuts;
    const all = [pmx(s.p1, s.p2, c1, c2).children[1]].concat(['from_start', 'classic', 'left_to_right'].map((v) => ox(s.p1, s.p2, c1, c2, v).children[0]));
    assert.equal(new Set(all.map((h) => h.join())).size, 4, q.name);
    assert.deepEqual(s.shown, all[q.correct], q.name);
    assert.equal(q.options.filter((o) => o.correct).length, 1);
    assert.equal(q.options.findIndex((o) => o.correct), q.correct);
  });
});

test('«detectar el error»: el hijo del estudiante lleva exactamente el error del catálogo', () => {
  bank.es.questions.filter((q) => q.kind.startsWith('error-')).forEach((q) => {
    const s = readQuestion(q);
    const [c1, c2] = s.cuts;
    if (q.kind === 'error-pmx') {
      assert.deepEqual(s.shown, M.pmxCut(s.p1, s.p2, c1, c2));
      assert.notDeepEqual(s.shown, pmx(s.p1, s.p2, c1, c2).children[0]);
      assert.ok(new Set(s.shown).size < s.shown.length, 'la cadena cortada repite un gen');
    } else {
      assert.deepEqual(s.shown, ox(s.p1, s.p2, c1, c2, 'left_to_right').children[0]);
      assert.notDeepEqual(s.shown, ox(s.p1, s.p2, c1, c2, 'from_start').children[0]);
    }
    assert.ok(q.options[q.correct].correct);
  });
});

test('los niveles respetan sus filtros', () => {
  bank.es.questions.forEach((q) => {
    const s = readQuestion(q);
    if (q.kind === 'calc-cx') {
      const k = cx(s.p1, s.p2, 'alternate').cycles.length;   // 'first_cycle' agrupa el resto
      const exp = { easy: (x) => x === 2, medium: (x) => x === 3, hard: (x) => x >= 4 }[q.level];
      assert.ok(exp(k), `${q.name}: ${k} ciclos`);
      return;
    }
    if (q.kind.startsWith('calc-') && /point|binary/.test(q.kind)) {
      assert.equal(s.p1.length, M.BIN_N[q.level], q.name);
      return;
    }
    const len = s.cuts[1] - s.cuts[0];
    const [lo, hi] = M.SEG[q.level];
    assert.ok(len >= lo && len <= hi, `${q.name}: segmento de ${len}`);
    if (q.kind === 'calc-pmx') {
      const res = pmx(s.p1, s.p2, s.cuts[0], s.cuts[1]);
      const longest = [0, 1].map((k) => Math.max(0, ...res.steps.filter((st) => st.type === 'place' && st.child === k).map((st) => st.chain.length)));
      if (q.level === 'easy') assert.ok(longest[0] <= 2 && longest[1] <= 2, q.name);
      if (q.level === 'hard') assert.ok(longest[0] >= 3 && longest[1] >= 3, q.name);
    }
  });
});

test('los enlaces reproducen el ejercicio (padres, cortes, variante y paso)', () => {
  bank.es.questions.forEach((q) => {
    const s = readQuestion(q);
    const h = hashOf(q.link);
    assert.ok(q.link.startsWith(M.APP + '#'), q.link);
    assert.equal(h.get('p1'), s.p1.join('-'), q.name);
    assert.equal(h.get('p2'), s.p2.join('-'), q.name);
    if (s.cuts.length) assert.equal(h.get('c'), s.cuts.join('-'), q.name);
    assert.equal(h.get('lang'), 'es');
    assert.ok(q.general.includes(q.link.replace(/&/g, '&amp;')), `${q.name}: el enlace está en la retroalimentación`);
    assert.ok(!q.text.includes(M.APP), `${q.name}: el enunciado no enlaza a la aplicación`);
    if (q.kind === 'calc-cx') assert.equal(h.get('r'), String(q.draw));
    if (q.kind === 'calc-uniform-binary') {
      // La aplicación usa r % 10^6 como semilla del sorteo: debe dar la misma máscara.
      const r = Number(h.get('r'));
      assert.ok(r > 0 && r < 1e6);
      const mask = uniform(s.p1, s.p2, Number(h.get('p')), { seed: r % 1000000 }).mask;
      assert.deepEqual(mask, s.mask, q.name);
    }
    assert.ok(Number(h.get('s')) < 1e6);
    if (q.kind === 'error-pmx') {
      const st = pmx(s.p1, s.p2, s.cuts[0], s.cuts[1]).steps[Number(h.get('step'))];
      assert.equal(st.type, 'place');
      assert.equal(st.child, 0);
    }
    if (q.kind === 'error-ox') {
      const st = ox(s.p1, s.p2, s.cuts[0], s.cuts[1], 'from_start').steps[Number(h.get('step'))];
      assert.equal(st.type, 'positions');
    }
  });
});

test('misma semilla, mismo banco; semillas distintas, bancos distintos; sin ejercicios repetidos', () => {
  const opts = { lang: 'es', kinds: ['calc-pmx', 'identify'], levels: ['medium'], count: 5, n: 9 };
  assert.equal(M.toXml(M.generate(Object.assign({ seed: 5 }, opts))), M.toXml(M.generate(Object.assign({ seed: 5 }, opts))));
  assert.notEqual(M.toXml(M.generate(Object.assign({ seed: 5 }, opts))), M.toXml(M.generate(Object.assign({ seed: 6 }, opts))));
  const keys = bank.es.questions.map((q) => `${q.kind}|${q.p1.join()}|${q.p2.join()}|${readQuestion(q).cuts.join()}`);
  assert.equal(new Set(keys).size, keys.length);
  const r = M.generate({ lang: 'es', kinds: ['calc-pmx'], levels: ['easy'], count: 1 });
  assert.ok(Number.isInteger(r.seed));
});

test('el XML está bien formado y trae una categoría por tipo y nivel', () => {
  ['es', 'en'].forEach((lang) => {
    const xml = bank[lang].xml;
    assert.match(xml, /^<\?xml version="1.0" encoding="UTF-8"\?>/);
    // Comprobación de anidamiento sin las secciones CDATA.
    const bare = xml.replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '').replace(/<\?xml[^>]*\?>/, '').replace(/<!--[\s\S]*?-->/g, '');
    assert.doesNotMatch(bare, /&(?!amp;|lt;|gt;|quot;|apos;)/);
    const stack = [];
    for (const m of bare.matchAll(/<(\/?)([a-z]+)[^>]*?(\/?)>/g)) {
      if (m[3]) continue;
      if (m[1]) assert.equal(stack.pop(), m[2]);
      else stack.push(m[2]);
    }
    assert.equal(stack.length, 0);
    const cats = [...xml.matchAll(/<category><text>\$course\$\/top\/([^<]+)<\/text>/g)].map((m) => m[1]);
    assert.equal(new Set(cats).size, ALL.length * M.LEVELS.length);
    assert.ok(cats.every((c) => c.startsWith(M.texts[lang].root + '/')));
    const names = [...xml.matchAll(/<name><text>([^<]+)<\/text>/g)].map((m) => m[1]);
    assert.ok(names.every((n) => /s=\d+/.test(n)));
  });
});

test('el banco en inglés no arrastra textos en español', () => {
  const visible = bank.en.questions.map((q) => q.text + q.general + (q.options || []).map((o) => o.text + o.feedback).join('')).join(' ');
  assert.doesNotMatch(visible, /Padre|Hijo|posición|Correcto|segmento|Ver /);
});
