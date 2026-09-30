/*
 * Generador de bancos de preguntas para Moodle (formato Moodle XML).
 *
 * Cada pregunta se construye con los mismos operadores que la aplicación, así que la respuesta
 * guardada es la que da el operador. La retroalimentación general enlaza a la web publicada con
 * el hash que reproduce el ejercicio (y, en «detectar el error», el paso donde se comete).
 *
 * Tipos: «calcular los hijos» (cloze, una casilla por gen), «identificar el operador» y
 * «detectar el error» (opción múltiple con penalización −1/(k−1) en las erróneas).
 * Niveles: fácil, media y difícil, con filtros por ejemplar (longitud del segmento, cadenas del
 * PMX, número de ciclos del CX, longitud de la cadena binaria…).
 *
 * El nombre de cada pregunta (que el alumno no ve) lleva su semilla, para reproducirla. La semilla
 * base del banco es aleatoria en cada exportación, para que no se pueda regenerar el banco.
 */
(function (root) {
  'use strict';

  const isNode = typeof module !== 'undefined' && module.exports;
  const R = isNode ? require('./rng.js') : root.GAX.rng;
  const B = isNode ? require('./operators/bin-utils.js') : root.GAX.binUtils;
  const OPS = isNode ? {
    pmx: require('./operators/pmx.js'),
    ox: require('./operators/ox.js'),
    cx: require('./operators/cx.js'),
    'one-point': require('./operators/one-point.js'),
    'two-point': require('./operators/two-point.js'),
    'uniform-binary': require('./operators/uniform-binary.js'),
  } : root.GAX.operators;

  const APP = 'https://josemagalan.github.io/crossover-ga/';
  const LEVELS = ['easy', 'medium', 'hard'];
  const MAX_TRIES = 20000;

  // ---------- Textos ----------

  const T = {
    es: {
      root: 'Cruces',
      level: { easy: 'Fácil', medium: 'Media', hard: 'Difícil' },
      type: { calc: 'Calcular hijos', identify: 'Identificar el operador', error: 'Detectar el error' },
      op: { pmx: 'PMX', ox: 'OX', cx: 'CX', 'one-point': 'Un punto (binario)', 'two-point': 'Dos puntos (binario)', 'uniform-binary': 'Uniforme (binario)' },
      opFull: { pmx: 'PMX', ox: 'OX', cx: 'CX (por ciclos)', 'one-point': 'en un punto', 'two-point': 'en dos puntos', 'uniform-binary': 'uniforme' },
      parent: (k) => `Padre ${k}`,
      child: (k) => `Hijo ${k}`,
      shownChild: 'Hijo',
      studentChild: 'Hijo 1 del estudiante',
      seg: (c) => `el segmento son las posiciones ${c[0] + 1} a ${c[1]} (entre las rayas rojas)`,
      cut1: (c) => `el corte está tras la posición ${c} (raya roja)`,
      apply: (op, where) => `<p>Aplica el cruce <strong>${op}</strong> a estos padres${where ? `; ${where}` : ''}.</p>`,
      applyBin: (op, where) => `<p>Aplica el cruce <strong>${op}</strong> a estos padres binarios${where ? `; ${where}` : ''}.</p>`,
      conv: {
        pmx: 'Convención: el Hijo 1 recibe el segmento del Padre 2 y se completa con el Padre 1 siguiendo la tabla de correspondencias; el Hijo 2, al revés.',
        ox: 'Convención (la de las transparencias): el Hijo 1 conserva el segmento del Padre 1; los genes que faltan se toman del Padre 2 <em>leyéndolo desde el principio</em> y se colocan <em>a partir del segundo corte</em>, dando la vuelta al llegar al final. El Hijo 2, al revés.',
        cx: (rule) => `Convención: cada ciclo empieza en la primera posición todavía libre. En el Hijo 1, ${rule}. El Hijo 2 es el complementario: en cada ciclo toma el gen del otro padre.`,
        cuts: 'Convención: fuera del segmento, cada hijo copia a su propio padre (Hijo 1 ← Padre 1); dentro, los hijos intercambian los genes.',
        cut1: 'Convención: hasta el corte, cada hijo copia a su propio padre (Hijo 1 ← Padre 1); desde el corte, los hijos intercambian los genes.',
        uniform: 'Convención: con 0 en la máscara, cada hijo copia a su propio padre (Hijo 1 ← Padre 1); con 1, los hijos intercambian el gen.',
      },
      mask: 'Máscara',
      cycleRule: (i, src) => `el ${i + 1}.º ciclo, del Padre ${src}`,
      solution: (h1, h2) => `<p><strong>Solución.</strong> Hijo 1 = ${h1} · Hijo 2 = ${h2}</p>`,
      pairs: (p) => `Correspondencias: ${p}. Genes recolocados con la tabla:`,
      chainItem: (k, pos, chain) => `Hijo ${k}, posición ${pos}: ${chain}`,
      oxItem: (k, list, pos) => `Hijo ${k}: genes del Padre ${3 - k} en orden, sin los del segmento: ${list}; se colocan en las posiciones ${pos}.`,
      cycleItem: (i, pos, src) => `Ciclo ${i + 1}: posiciones ${pos}, del Padre ${src} en el Hijo 1.`,
      maskItem: (m) => `Máscara de cruce: ${m} (1 = se intercambia el gen).`,
      stepLink: 'Ver la resolución paso a paso de este ejercicio',
      identifyStem: (where) => `<p>Con estos padres y ${where}, un cruce ha producido el hijo que conserva el segmento del Padre 1 y se completa con genes del Padre 2.</p>`,
      identifyQ: '<p>¿Qué operador se ha aplicado?</p>',
      cand: {
        pmx: 'PMX',
        from_start: 'OX leyendo el Padre 2 desde el principio y rellenando a partir del segundo corte (transparencias)',
        classic: 'OX leyendo el Padre 2 a partir del segundo corte y rellenando desde ahí (Goldberg, 1989)',
        left_to_right: 'OX leyendo el Padre 2 desde el principio y rellenando de izquierda a derecha',
      },
      correct: 'Correcto.',
      wouldGive: (c) => `Con este operador saldría ${c}.`,
      seeInApp: 'Verlo en la aplicación',
      identifyGeneral: 'Los cuatro operadores dan hijos distintos con estos padres; en cada opción se indica cuál.',
      seeCorrect: 'Ver el operador correcto paso a paso',
      errQ: '<p>¿Qué error ha cometido?</p>',
      pmxErrStem: (where) => `<p>Un estudiante aplica el cruce <strong>PMX</strong> a estos padres; ${where}. El Hijo 1 debe recibir el segmento del Padre 2 y completarse con el Padre 1 siguiendo la tabla de correspondencias.</p>`,
      pmxErr: {
        cut: 'Ha cortado la cadena de correspondencias: aplica un solo par aunque el gen obtenido siga estando en el segmento.',
        cutFb: (pos, chain) => `Correcto: en la posición ${pos} la cadena completa es ${chain}.`,
        reverse: 'Ha usado la tabla de correspondencias en sentido contrario.',
        reverseFb: (c) => `Con la tabla al revés saldría ${c}.`,
        segment: 'Ha dejado en el Hijo 1 el segmento del Padre 1 en lugar del del Padre 2.',
        segmentFb: 'El segmento del hijo del estudiante sí es el del Padre 2.',
        none: 'No hay ningún error.',
        noneFb: (c) => `El hijo correcto es ${c}; fíjate en que el del estudiante repite un gen.`,
        general: (c, pos, chain) => `<p><strong>Hijo 1 correcto:</strong> ${c}. En la posición ${pos} hay que seguir la cadena ${chain} hasta un gen que no esté en el segmento.</p>`,
        link: 'Ver en la aplicación el paso donde se comete el error',
      },
      oxErrStem: (where) => `<p>Un estudiante aplica el cruce <strong>OX</strong> con la convención de las transparencias; ${where}. El Hijo 1 conserva el segmento del Padre 1, y los genes que faltan se toman del Padre 2 leyéndolo desde el principio y se colocan a partir del segundo corte, dando la vuelta.</p>`,
      oxErr: {
        ltr: 'Ha colocado los genes de izquierda a derecha en lugar de empezar tras el segundo corte.',
        ltrFb: (pos) => `Correcto: el orden de los genes es bueno, pero el primero debe ir en la posición ${pos}.`,
        classic: 'Ha leído el Padre 2 empezando tras el segundo corte en lugar de desde el principio.',
        classicFb: (c) => `Leyendo así (y rellenando tras el corte) saldría ${c}.`,
        noskip: 'No ha saltado los genes que ya estaban en el segmento.',
        noskipFb: (c) => `Sin saltarlos saldría ${c}, con genes repetidos; el del estudiante no repite ninguno.`,
        none: 'No hay ningún error.',
        noneFb: (c) => `El hijo correcto es ${c}.`,
        general: (c, list, pos) => `<p><strong>Hijo 1 correcto:</strong> ${c}. Los genes del Padre 2 sin los del segmento son ${list} y van en las posiciones ${pos}.</p>`,
        link: 'Ver en la aplicación el orden de relleno correcto',
      },
      errName: { pmx: 'cadena cortada', ox: 'relleno de izquierda a derecha' },
    },
    en: {
      root: 'Crossover',
      level: { easy: 'Easy', medium: 'Medium', hard: 'Hard' },
      type: { calc: 'Compute offspring', identify: 'Identify the operator', error: 'Spot the mistake' },
      op: { pmx: 'PMX', ox: 'OX', cx: 'CX', 'one-point': 'One-point (binary)', 'two-point': 'Two-point (binary)', 'uniform-binary': 'Uniform (binary)' },
      opFull: { pmx: 'PMX', ox: 'OX', cx: 'CX (cycle)', 'one-point': 'one-point', 'two-point': 'two-point', 'uniform-binary': 'uniform' },
      parent: (k) => `Parent ${k}`,
      child: (k) => `Child ${k}`,
      shownChild: 'Child',
      studentChild: 'Student’s Child 1',
      seg: (c) => `the segment is positions ${c[0] + 1} to ${c[1]} (between the red lines)`,
      cut1: (c) => `the cut is after position ${c} (red line)`,
      apply: (op, where) => `<p>Apply <strong>${op}</strong> crossover to these parents${where ? `; ${where}` : ''}.</p>`,
      applyBin: (op, where) => `<p>Apply <strong>${op}</strong> crossover to these binary parents${where ? `; ${where}` : ''}.</p>`,
      conv: {
        pmx: 'Convention: Child 1 receives the segment of Parent 2 and is completed from Parent 1 following the mapping table; Child 2, the other way round.',
        ox: 'Convention (the one in the slides): Child 1 keeps the segment of Parent 1; the missing genes are taken from Parent 2 <em>reading it from the start</em> and placed <em>from the second cut onwards</em>, wrapping around at the end. Child 2, the other way round.',
        cx: (rule) => `Convention: each cycle starts at the first position still free. In Child 1, ${rule}. Child 2 is the complement: in each cycle it takes the gene of the other parent.`,
        cuts: 'Convention: outside the segment, each child copies its own parent (Child 1 ← Parent 1); inside it, the children swap genes.',
        cut1: 'Convention: up to the cut, each child copies its own parent (Child 1 ← Parent 1); from the cut on, the children swap genes.',
        uniform: 'Convention: where the mask is 0, each child copies its own parent (Child 1 ← Parent 1); where it is 1, the children swap the gene.',
      },
      mask: 'Mask',
      cycleRule: (i, src) => `cycle ${i + 1} comes from Parent ${src}`,
      solution: (h1, h2) => `<p><strong>Solution.</strong> Child 1 = ${h1} · Child 2 = ${h2}</p>`,
      pairs: (p) => `Mapping: ${p}. Genes relocated with the table:`,
      chainItem: (k, pos, chain) => `Child ${k}, position ${pos}: ${chain}`,
      oxItem: (k, list, pos) => `Child ${k}: genes of Parent ${3 - k} in order, without those in the segment: ${list}; they go to positions ${pos}.`,
      cycleItem: (i, pos, src) => `Cycle ${i + 1}: positions ${pos}, from Parent ${src} in Child 1.`,
      maskItem: (m) => `Crossover mask: ${m} (1 = the gene is swapped).`,
      stepLink: 'See the step-by-step solution of this exercise',
      identifyStem: (where) => `<p>With these parents and ${where}, a crossover has produced the child that keeps the segment of Parent 1 and is completed with genes from Parent 2.</p>`,
      identifyQ: '<p>Which operator was applied?</p>',
      cand: {
        pmx: 'PMX',
        from_start: 'OX reading Parent 2 from the start and filling from the second cut (slides)',
        classic: 'OX reading Parent 2 from the second cut and filling from there (Goldberg, 1989)',
        left_to_right: 'OX reading Parent 2 from the start and filling left to right',
      },
      correct: 'Correct.',
      wouldGive: (c) => `This operator would give ${c}.`,
      seeInApp: 'See it in the app',
      identifyGeneral: 'The four operators give different children with these parents; each option shows which.',
      seeCorrect: 'See the correct operator step by step',
      errQ: '<p>What mistake did they make?</p>',
      pmxErrStem: (where) => `<p>A student applies <strong>PMX</strong> crossover to these parents; ${where}. Child 1 must receive the segment of Parent 2 and be completed from Parent 1 following the mapping table.</p>`,
      pmxErr: {
        cut: 'They cut the mapping chain short: they apply a single pair even though the resulting gene is still in the segment.',
        cutFb: (pos, chain) => `Correct: at position ${pos} the full chain is ${chain}.`,
        reverse: 'They used the mapping table in the wrong direction.',
        reverseFb: (c) => `With the table reversed the result would be ${c}.`,
        segment: 'They left the segment of Parent 1 in Child 1 instead of that of Parent 2.',
        segmentFb: 'The segment of the student’s child is indeed that of Parent 2.',
        none: 'There is no mistake.',
        noneFb: (c) => `The correct child is ${c}; note that the student’s one repeats a gene.`,
        general: (c, pos, chain) => `<p><strong>Correct Child 1:</strong> ${c}. At position ${pos} you must follow the chain ${chain} until reaching a gene that is not in the segment.</p>`,
        link: 'See in the app the step where the mistake happens',
      },
      oxErrStem: (where) => `<p>A student applies <strong>OX</strong> crossover with the convention of the slides; ${where}. Child 1 keeps the segment of Parent 1, and the missing genes are taken from Parent 2 reading it from the start and placed from the second cut onwards, wrapping around.</p>`,
      oxErr: {
        ltr: 'They placed the genes left to right instead of starting after the second cut.',
        ltrFb: (pos) => `Correct: the order of the genes is right, but the first one must go to position ${pos}.`,
        classic: 'They read Parent 2 starting after the second cut instead of from the start.',
        classicFb: (c) => `Reading that way (and filling after the cut) the result would be ${c}.`,
        noskip: 'They did not skip the genes already in the segment.',
        noskipFb: (c) => `Without skipping them the result would be ${c}, with repeated genes; the student’s child repeats none.`,
        none: 'There is no mistake.',
        noneFb: (c) => `The correct child is ${c}.`,
        general: (c, list, pos) => `<p><strong>Correct Child 1:</strong> ${c}. The genes of Parent 2 without those in the segment are ${list}, and they go to positions ${pos}.</p>`,
        link: 'See in the app the correct filling order',
      },
      errName: { pmx: 'chain cut short', ox: 'filled left to right' },
    },
  };

  // ---------- Tipos de pregunta ----------

  /** Tipos disponibles: id, tipo, operador. */
  const KINDS = [
    { id: 'calc-pmx', type: 'calc', op: 'pmx' },
    { id: 'calc-ox', type: 'calc', op: 'ox' },
    { id: 'calc-cx', type: 'calc', op: 'cx' },
    { id: 'calc-one-point', type: 'calc', op: 'one-point' },
    { id: 'calc-two-point', type: 'calc', op: 'two-point' },
    { id: 'calc-uniform-binary', type: 'calc', op: 'uniform-binary' },
    { id: 'identify', type: 'identify', op: null },
    { id: 'error-pmx', type: 'error', op: 'pmx' },
    { id: 'error-ox', type: 'error', op: 'ox' },
  ];
  const kindById = (id) => KINDS.find((k) => k.id === id);
  const isBinary = (kind) => ['one-point', 'two-point', 'uniform-binary'].indexOf(kind.op) !== -1;

  // Longitud del segmento por nivel (acotada a n − 2) y longitud de las cadenas binarias.
  const SEG = { easy: [2, 3], medium: [3, 4], hard: [4, 5] };
  const BIN_N = { easy: 8, medium: 10, hard: 12 };
  function segRange(level, n) {
    const hi = Math.min(SEG[level][1], n - 2);
    return [Math.min(SEG[level][0], hi), hi];
  }
  const segOk = (cuts, level, n) => {
    const len = cuts[1] - cuts[0];
    const [lo, hi] = segRange(level, n);
    return len >= lo && len <= hi;
  };

  // ---------- Utilidades ----------

  const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const fmt = (g) => g.join(' ');

  function problem(seed, n, binary) {
    const r = R.mulberry32(seed);
    const gen = binary ? (rr) => B.randomBits(rr, n) : (rr) => R.randomPermutation(rr, n);
    const p1 = gen(r);
    let p2 = gen(r);
    while (same(p1, p2)) p2 = gen(r);
    return { p1, p2, cuts: R.randomCuts(r, n), cut: R.randInt(r, 1, n - 1), seed, n };
  }

  function appLink(op, pb, lang, extra) {
    extra = extra || {};
    const q = new URLSearchParams([['op', op], ['lang', lang]]);
    if (extra.v) q.set('v', extra.v);
    if (extra.r) q.set('r', String(extra.r));
    if (extra.params) Object.keys(extra.params).forEach((k) => q.set(k, String(extra.params[k])));
    q.set('p1', pb.p1.join('-'));
    q.set('p2', pb.p2.join('-'));
    if (extra.cuts) q.set('c', extra.cuts.join('-'));
    q.set('s', String(pb.seed % 1000000));   // la aplicación también reduce s= a menos de 10^6
    if (extra.step != null) q.set('step', String(extra.step));
    return `${APP}#${q.toString()}`;
  }
  const a = (href, text) => `<a href="${esc(href)}" target="_blank" rel="noopener">${text}</a>`;

  const CELL = 'padding:4px 8px;text-align:center;font-family:monospace;font-size:1.1em;';
  const CUT = 'border-left:3px solid #c00;';
  function row(label, genes, cuts, cellFn) {
    const cs = new Set(cuts || []);
    const td = genes.map((g, i) => `<td style="${cs.has(i) ? CUT : ''}${CELL}">${cellFn ? cellFn(g, i) : esc(g)}</td>`).join('');
    return `<tr><th style="padding:4px 10px;text-align:left;white-space:nowrap;">${esc(label)}</th>${td}</tr>`;
  }
  function posHeader(n, cuts) {
    const cs = new Set(cuts || []);
    const td = Array.from({ length: n }, (_, i) => `<td style="${cs.has(i) ? CUT : ''}padding:0 8px;text-align:center;color:#777;font-size:0.8em;">${i + 1}</td>`).join('');
    return `<tr><th></th>${td}</tr>`;
  }
  const table = (rows) => `<table style="border-collapse:collapse;margin:0.6em 0;">${rows.join('')}</table>`;
  const cloze = (v) => `{1:SHORTANSWER:=${v}}`;
  const ul = (items) => `<ul>${items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;

  function base(kind, level, pb, L, lang, extraName) {
    const opName = kind.op ? L.op[kind.op] : null;
    const cat = kind.type === 'identify'
      ? [L.type.identify, L.level[level]]
      : [opName, L.type[kind.type], L.level[level]];
    const name = [kind.type === 'identify' ? L.type.identify : `${opName} · ${L.type[kind.type]}`, L.level[level].toLowerCase(), `n=${pb.n}`, `s=${pb.seed}`]
      .concat(extraName || []).join(' · ');
    const tags = [`crossover-${kind.op || 'identify'}`, `type-${kind.type}`, `level-${level}`, `lang-${lang}`];
    return { kind: kind.id, level, seed: pb.seed, n: pb.n, category: cat, name, tags, p1: pb.p1, p2: pb.p2 };
  }

  // ---------- Constructores (devuelven null si el ejemplar no cumple el nivel) ----------

  function calcPmx(pb, level, L, lang, kind) {
    const { p1, p2, cuts, n } = pb;
    if (!segOk(cuts, level, n)) return null;
    const res = OPS.pmx.pmx(p1, p2, cuts[0], cuts[1]);
    const places = res.steps.filter((s) => s.type === 'place');
    const longest = [0, 1].map((k) => Math.max(0, ...places.filter((s) => s.child === k).map((s) => s.chain.length)));
    if (level === 'easy' && !(places.length >= 1 && longest[0] <= 2 && longest[1] <= 2)) return null;
    if (level === 'medium' && !(Math.max(...longest) >= 3)) return null;
    if (level === 'hard' && !(longest[0] >= 3 && longest[1] >= 3)) return null;
    const [h1, h2] = res.children;
    const q = base(kind, level, pb, L, lang);
    return Object.assign(q, {
      qtype: 'cloze', answer: [h1, h2],
      text: L.apply('PMX', L.seg(cuts)) +
        table([posHeader(n, cuts), row(L.parent(1), p1, cuts), row(L.parent(2), p2, cuts)]) +
        `<p>${L.conv.pmx}</p>` +
        table([posHeader(n, cuts), row(L.child(1), h1, cuts, cloze), row(L.child(2), h2, cuts, cloze)]),
      general: L.solution(fmt(h1), fmt(h2)) +
        `<p>${esc(L.pairs(res.pairs.map((p) => `${p.a} ↔ ${p.b}`).join(', ')))}</p>` +
        ul(places.map((s) => L.chainItem(s.child + 1, s.text.params.pos, s.text.params.chain))) +
        `<p>${a(appLink('pmx', pb, lang, { cuts }), L.stepLink)}</p>`,
      link: appLink('pmx', pb, lang, { cuts }),
    });
  }

  function calcOx(pb, level, L, lang, kind) {
    const { p1, p2, cuts, n } = pb;
    if (!segOk(cuts, level, n)) return null;
    const res = OPS.ox.ox(p1, p2, cuts[0], cuts[1], 'from_start');
    const [h1, h2] = res.children;
    if (level !== 'easy') {
      const cl = OPS.ox.ox(p1, p2, cuts[0], cuts[1], 'classic').children[0];
      const lr = OPS.ox.ox(p1, p2, cuts[0], cuts[1], 'left_to_right').children[0];
      if (same(h1, cl) || same(h1, lr)) return null;
      if (level === 'hard' && !(cuts[0] >= 2 && n - cuts[1] >= 2)) return null;
    }
    const items = res.aux.items;
    const link = appLink('ox', pb, lang, { v: 'from_start', cuts });
    const q = base(kind, level, pb, L, lang);
    return Object.assign(q, {
      qtype: 'cloze', answer: [h1, h2],
      text: L.apply('OX', L.seg(cuts)) +
        table([posHeader(n, cuts), row(L.parent(1), p1, cuts), row(L.parent(2), p2, cuts)]) +
        `<p>${L.conv.ox}</p>` +
        table([posHeader(n, cuts), row(L.child(1), h1, cuts, cloze), row(L.child(2), h2, cuts, cloze)]),
      general: L.solution(fmt(h1), fmt(h2)) +
        ul([0, 1].map((k) => L.oxItem(k + 1, items[k].list.join(', '), items[k].positions.map((i) => i + 1).join(', ')))) +
        `<p>${a(link, L.stepLink)}</p>`,
      link,
    });
  }

  function calcCx(pb, level, L, lang, kind) {
    const { p1, p2, n } = pb;
    const want = { easy: [2, 2], medium: [3, 3], hard: [4, n] }[level];
    for (let r = 1; r <= 30; r++) {
      const res = OPS.cx.cx(p1, p2, 'random', { seed: r });
      const k = res.cycles.length;
      if (k < want[0] || k > want[1]) return null;   // el número de ciclos no depende del sorteo
      if (new Set(res.choices).size !== 2) continue;
      if (level !== 'hard' && res.cycles.some((c) => c.positions.length < 2)) return null;
      const [h1, h2] = res.children;
      const rule = res.choices.map((c, i) => L.cycleRule(i, c === 'p1' ? 1 : 2)).join('; ');
      const link = appLink('cx', pb, lang, { v: 'random', r });
      const q = base(kind, level, pb, L, lang, [`r=${r}`]);
      return Object.assign(q, {
        qtype: 'cloze', answer: [h1, h2], draw: r, choices: res.choices,
        text: L.apply(L.opFull.cx, '') +
          table([posHeader(n), row(L.parent(1), p1), row(L.parent(2), p2)]) +
          `<p>${L.conv.cx(rule)}</p>` +
          table([posHeader(n), row(L.child(1), h1, null, cloze), row(L.child(2), h2, null, cloze)]),
        general: L.solution(fmt(h1), fmt(h2)) +
          ul(res.cycles.map((c, i) => L.cycleItem(i, c.positions.map((x) => x + 1).join(' → '), c.src === 'p1' ? 1 : 2))) +
          `<p>${a(link, L.stepLink)}</p>`,
        link,
      });
    }
    return null;
  }

  function calcBinary(pb, level, L, lang, kind) {
    const { p1, p2, n } = pb;
    let res; let cuts; let where; let conv; let link; let draw = null; let maskRow = null; const extraName = [];
    if (kind.op === 'one-point') {
      cuts = [pb.cut];
      res = OPS['one-point'].onePoint(p1, p2, pb.cut);
      where = L.cut1(pb.cut);
      conv = L.conv.cut1;
      link = appLink('one-point', pb, lang, { cuts });
    } else if (kind.op === 'two-point') {
      cuts = pb.cuts;
      if (cuts[1] - cuts[0] < 2) return null;
      res = OPS['two-point'].twoPoint(p1, p2, cuts[0], cuts[1]);
      where = L.seg(cuts);
      conv = L.conv.cuts;
      link = appLink('two-point', pb, lang, { cuts });
    } else {
      cuts = null;
      // La aplicación reduce el sorteo r= a menos de 10^6: se usa ya reducido para que el enlace lo reproduzca.
      draw = (pb.seed % 999999) + 1;
      res = OPS['uniform-binary'].uniform(p1, p2, 0.5, { seed: draw });
      const runs = B.bandsFromMask(res.mask).length;
      if (runs < 2 || res.mask.every((b) => b === 1)) return null;   // si no, equivale a un cruce por cortes
      where = '';
      conv = L.conv.uniform;
      maskRow = row(L.mask, res.mask);
      link = appLink('uniform-binary', pb, lang, { r: draw, params: { p: 0.5 } });
      extraName.push(`r=${draw}`);
    }
    const [h1, h2] = res.children;
    if (res.children.some((h) => same(h, p1) || same(h, p2))) return null;
    const mask = res.mask || B.maskFromCuts(n, cuts);
    const q = base(kind, level, pb, L, lang, extraName);
    return Object.assign(q, {
      qtype: 'cloze', answer: [h1, h2], draw,
      text: L.applyBin(L.opFull[kind.op], where) +
        table([posHeader(n, cuts), row(L.parent(1), p1, cuts), row(L.parent(2), p2, cuts)].concat(maskRow ? [maskRow] : [])) +
        `<p>${conv}</p>` +
        table([posHeader(n, cuts), row(L.child(1), h1, cuts, cloze), row(L.child(2), h2, cuts, cloze)]),
      general: L.solution(fmt(h1), fmt(h2)) + `<p>${esc(L.maskItem(mask.join(' ')))}</p>` + `<p>${a(link, L.stepLink)}</p>`,
      link,
    });
  }

  function candidates(pb, L) {
    const [c1, c2] = pb.cuts;
    return [
      { id: 'pmx', v: null, name: L.cand.pmx, child: OPS.pmx.pmx(pb.p1, pb.p2, c1, c2).children[1] },   // el hijo con el segmento del Padre 1
      { id: 'ox', v: 'from_start', name: L.cand.from_start, child: OPS.ox.ox(pb.p1, pb.p2, c1, c2, 'from_start').children[0] },
      { id: 'ox', v: 'classic', name: L.cand.classic, child: OPS.ox.ox(pb.p1, pb.p2, c1, c2, 'classic').children[0] },
      { id: 'ox', v: 'left_to_right', name: L.cand.left_to_right, child: OPS.ox.ox(pb.p1, pb.p2, c1, c2, 'left_to_right').children[0] },
    ];
  }

  function identify(pb, level, L, lang, kind) {
    const { p1, p2, cuts, n } = pb;
    if (!segOk(cuts, level, n)) return null;
    const cs = candidates(pb, L);
    if (new Set(cs.map((c) => c.child.join())).size !== cs.length) return null;
    const target = pb.seed % cs.length;
    const right = cs[target];
    const lnk = (c) => appLink(c.id, pb, lang, { v: c.v, cuts });
    const q = base(kind, level, pb, L, lang, [`ok=${right.id}${right.v ? '/' + right.v : ''}`]);
    return Object.assign(q, {
      qtype: 'multichoice', shown: right.child, correct: target,
      options: cs.map((c, i) => ({
        text: esc(c.name), correct: i === target,
        feedback: `${i === target ? L.correct : L.wouldGive(fmt(c.child))} ${a(lnk(c), L.seeInApp)}`,
      })),
      text: L.identifyStem(L.seg(cuts)) +
        table([posHeader(n, cuts), row(L.parent(1), p1, cuts), row(L.parent(2), p2, cuts), row(L.shownChild, right.child, cuts)]) +
        L.identifyQ,
      general: `<p>${L.identifyGeneral} ${a(lnk(right), L.seeCorrect)}</p>`,
      link: lnk(right),
    });
  }

  /** PMX con la cadena cortada: al encontrar un conflicto se aplica un solo par. */
  function pmxCut(p1, p2, c1, c2) {
    const n = p1.length;
    const h = Array(n).fill(null);
    const segIdx = new Map();
    for (let i = c1; i < c2; i++) { h[i] = p2[i]; segIdx.set(p2[i], i); }
    for (let i = 0; i < n; i++) {
      if (i >= c1 && i < c2) continue;
      h[i] = segIdx.has(p1[i]) ? p1[segIdx.get(p1[i])] : p1[i];
    }
    return h;
  }

  /** PMX con la tabla en sentido contrario: se busca el gen en el segmento del Padre 1. */
  function pmxReverse(p1, p2, c1, c2) {
    const n = p1.length;
    const h = Array(n).fill(null);
    const seg2 = new Set(p2.slice(c1, c2));
    const idx1 = new Map();
    for (let i = c1; i < c2; i++) { h[i] = p2[i]; idx1.set(p1[i], i); }
    for (let i = 0; i < n; i++) {
      if (i >= c1 && i < c2) continue;
      let v = p1[i];
      for (let g = 0; g <= n && seg2.has(v) && idx1.has(v); g++) v = p2[idx1.get(v)];
      h[i] = v;
    }
    return h;
  }

  /** OX sin saltar los genes del segmento: se copian los primeros del otro padre tal cual. */
  function oxNoSkip(p1, p2, c1, c2) {
    const n = p1.length;
    const h = p1.slice();
    const pos = [];
    for (let i = c2; i < n; i++) pos.push(i);
    for (let i = 0; i < c1; i++) pos.push(i);
    pos.forEach((p, j) => { h[p] = p2[j]; });
    return h;
  }

  function mcOptions(list) {
    // El orden lo baraja Moodle (shuffleanswers); aquí solo se guarda cuál es la correcta.
    return list.map((o) => Object.assign({}, o));
  }

  function errorPmx(pb, level, L, lang, kind) {
    const { p1, p2, cuts, n } = pb;
    if (!segOk(cuts, level, n)) return null;
    const [c1, c2] = cuts;
    const res = OPS.pmx.pmx(p1, p2, c1, c2);
    const good = res.children[0];
    const wrong = pmxCut(p1, p2, c1, c2);
    const rev = pmxReverse(p1, p2, c1, c2);
    if (same(wrong, good) || same(rev, good) || same(rev, wrong)) return null;
    const badPos = wrong.findIndex((g, i) => g !== good[i]);
    const step = res.steps.findIndex((s) => s.type === 'place' && s.child === 0 && s.text.params.pos === badPos + 1);
    const chain = res.steps[step].text.params.chain;
    const E = L.pmxErr;
    const link = appLink('pmx', pb, lang, { cuts, step });
    const q = base(kind, level, pb, L, lang, [L.errName.pmx]);
    return Object.assign(q, {
      qtype: 'multichoice', shown: wrong, correct: 0, step,
      options: mcOptions([
        { text: E.cut, correct: true, feedback: esc(E.cutFb(badPos + 1, chain)) },
        { text: E.reverse, correct: false, feedback: esc(E.reverseFb(fmt(rev))) },
        { text: E.segment, correct: false, feedback: esc(E.segmentFb) },
        { text: E.none, correct: false, feedback: esc(E.noneFb(fmt(good))) },
      ]),
      text: L.pmxErrStem(L.seg(cuts)) +
        table([posHeader(n, cuts), row(L.parent(1), p1, cuts), row(L.parent(2), p2, cuts), row(L.studentChild, wrong, cuts)]) +
        L.errQ,
      general: E.general(fmt(good), badPos + 1, esc(chain)) + `<p>${a(link, E.link)}</p>`,
      link,
    });
  }

  function errorOx(pb, level, L, lang, kind) {
    const { p1, p2, cuts, n } = pb;
    if (!segOk(cuts, level, n) || cuts[0] < 2) return null;
    const [c1, c2] = cuts;
    const res = OPS.ox.ox(p1, p2, c1, c2, 'from_start');
    const good = res.children[0];
    const wrong = OPS.ox.ox(p1, p2, c1, c2, 'left_to_right').children[0];
    const cl = OPS.ox.ox(p1, p2, c1, c2, 'classic').children[0];
    const ns = oxNoSkip(p1, p2, c1, c2);
    if (new Set([good, wrong, cl, ns].map((x) => x.join())).size !== 4) return null;
    const step = res.steps.findIndex((s) => s.type === 'positions' && s.child === 0);
    const E = L.oxErr;
    const link = appLink('ox', pb, lang, { v: 'from_start', cuts, step });
    const item = res.aux.items[0];
    const q = base(kind, level, pb, L, lang, [L.errName.ox]);
    return Object.assign(q, {
      qtype: 'multichoice', shown: wrong, correct: 0, step,
      options: mcOptions([
        { text: E.ltr, correct: true, feedback: esc(E.ltrFb(c2 + 1)) },
        { text: E.classic, correct: false, feedback: esc(E.classicFb(fmt(cl))) },
        { text: E.noskip, correct: false, feedback: esc(E.noskipFb(fmt(ns))) },
        { text: E.none, correct: false, feedback: esc(E.noneFb(fmt(good))) },
      ]),
      text: L.oxErrStem(L.seg(cuts)) +
        table([posHeader(n, cuts), row(L.parent(1), p1, cuts), row(L.parent(2), p2, cuts), row(L.studentChild, wrong, cuts)]) +
        L.errQ,
      general: E.general(fmt(good), item.list.join(', '), item.positions.map((i) => i + 1).join(', ')) + `<p>${a(link, E.link)}</p>`,
      link,
    });
  }

  const BUILDERS = {
    'calc-pmx': calcPmx, 'calc-ox': calcOx, 'calc-cx': calcCx,
    'calc-one-point': calcBinary, 'calc-two-point': calcBinary, 'calc-uniform-binary': calcBinary,
    identify, 'error-pmx': errorPmx, 'error-ox': errorOx,
  };

  // ---------- Generación ----------

  /**
   * Genera las preguntas.
   * opts: { lang, kinds: [id], levels: [id], count, n (permutaciones), seed (base; aleatoria si falta) }
   * → { seed, questions: [...], missing: [{ kind, level, made, wanted }] }
   */
  function generate(opts) {
    const lang = T[opts.lang] ? opts.lang : 'es';
    const L = T[lang];
    const n = Math.max(8, Math.min(10, opts.n || 8));
    const count = Math.max(1, Math.min(50, opts.count || 10));
    const seed = Number.isFinite(opts.seed) ? opts.seed : R.newSeed();
    const questions = [];
    const missing = [];
    const used = new Set();
    let block = 0;
    (opts.kinds || []).forEach((kid) => {
      const kind = kindById(kid);
      if (!kind) return;
      LEVELS.filter((lv) => (opts.levels || []).indexOf(lv) !== -1).forEach((level) => {
        // Cada bloque (tipo × nivel) empieza en su propia zona de semillas.
        let s = seed * 1000 + (block++) * 100003;
        let made = 0;
        for (let tries = 0; made < count && tries < MAX_TRIES; tries++, s++) {
          const nn = isBinary(kind) ? BIN_N[level] : n;
          const pb = problem(s % 2147483647, nn, isBinary(kind));
          const q = BUILDERS[kid](pb, level, L, lang, kind);
          if (!q) continue;
          const key = `${kid}|${pb.p1.join()}|${pb.p2.join()}|${(pb.cuts || []).join()}`;
          if (used.has(key)) continue;
          used.add(key);
          questions.push(q);
          made++;
        }
        if (made < count) missing.push({ kind: kid, level, made, wanted: count });
      });
    });
    return { seed, lang, questions, missing };
  }

  // ---------- Moodle XML ----------

  const cdata = (s) => `<![CDATA[${String(s).replace(/\]\]>/g, ']]]]><![CDATA[>')}]]>`;

  function toXml(result) {
    const L = T[result.lang] || T.es;
    const out = [];
    let lastCat = null;
    result.questions.forEach((q) => {
      const cat = [L.root].concat(q.category).join('/');
      if (cat !== lastCat) {
        out.push(`  <question type="category">\n    <category><text>$course$/top/${esc(cat)}</text></category>\n  </question>`);
        lastCat = cat;
      }
      let body = '';
      if (q.qtype === 'multichoice') {
        const k = q.options.length;
        const wrong = (-(100 / (k - 1))).toFixed(5);
        body = `    <single>true</single>
    <shuffleanswers>1</shuffleanswers>
    <answernumbering>abc</answernumbering>
    <showstandardinstruction>0</showstandardinstruction>
    <correctfeedback format="html"><text></text></correctfeedback>
    <partiallycorrectfeedback format="html"><text></text></partiallycorrectfeedback>
    <incorrectfeedback format="html"><text></text></incorrectfeedback>
${q.options.map((o) => `    <answer fraction="${o.correct ? 100 : wrong}" format="html">
      <text>${cdata(o.text)}</text>
      <feedback format="html"><text>${cdata(o.feedback)}</text></feedback>
    </answer>`).join('\n')}
`;
      }
      out.push(`  <question type="${q.qtype}">
    <name><text>${esc(q.name)}</text></name>
    <questiontext format="html"><text>${cdata(q.text)}</text></questiontext>
    <generalfeedback format="html"><text>${cdata(q.general)}</text></generalfeedback>
    <defaultgrade>1</defaultgrade>
    <penalty>0</penalty>
    <hidden>0</hidden>
    <idnumber></idnumber>
${body}    <tags>${q.tags.map((t) => `<tag><text>${esc(t)}</text></tag>`).join('')}</tags>
  </question>`);
    });
    return `<?xml version="1.0" encoding="UTF-8"?>\n<!-- ${esc(L.root)} · seed ${result.seed} · ${APP} -->\n<quiz>\n${out.join('\n')}\n</quiz>\n`;
  }

  /** Texto de la pregunta para la vista previa: las casillas cloze se sustituyen por campos vacíos. */
  function previewHtml(q) {
    return q.text.replace(/\{1:SHORTANSWER:=[^}]*\}/g, '<input size="2" disabled aria-label="…">');
  }

  const api = { generate, toXml, previewHtml, KINDS, LEVELS, SEG, BIN_N, texts: T, APP, pmxCut, pmxReverse, oxNoSkip };
  if (isNode) module.exports = api;
  else (root.GAX = root.GAX || {}).moodle = api;
})(typeof self !== 'undefined' ? self : this);
