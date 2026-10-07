/*
 * Controlador de la página: enrutado (inicio / operador), estado, controles,
 * reproductor, idioma y URL.
 *
 * URL: #lang=es                          → pantalla inicial
 *      #op=pmx&lang=es&v=…&r=…&k=…&p=…&p1=…&p2=…&c=…&s=…&step=…  → página de un operador
 *      (v: variante; r: semilla del sorteo; k, p: parámetros del operador, si los tiene)
 *      #cmp=permutation&lang=es&from=pmx&v=…&r=…&<parámetros de from>&p1=…&p2=…&c=…&s=…
 *                                          → comparar los operadores de una representación
 */
(function () {
  'use strict';
  const G = window.GAX;
  const { rng: R, i18n, registry, createPermutationView, createLearnPanel, createHome, createCompareView, createRouteMaps } = G;

  const $ = (id) => document.getElementById(id);
  const el = {
    homeView: $('homeView'), opView: $('opView'), repGrid: $('repGrid'),
    opEyebrow: $('opEyebrow'), opTitle: $('opTitle'), opSubtitle: $('opSubtitle'),
    opSwitch: $('opSwitch'), vizLabel: $('vizLabel'), legend: $('legend'), dragHint: $('dragHint'),
    len: $('len'), lenOut: $('lenOut'), seed: $('seed'),
    variantField: $('variantField'), variant: $('variant'), variantDesc: $('variantDesc'),
    btnRandom: $('btnRandom'), btnCuts: $('btnCuts'), btnDraw: $('btnDraw'),
    manualForm: $('manualForm'), inP1: $('inP1'), inP2: $('inP2'), err: $('err'), manualHint: $('manualHint'),
    paramsBox: $('paramsBox'),
    btnReset: $('btnReset'), btnPrev: $('btnPrev'), btnPlay: $('btnPlay'), btnNext: $('btnNext'),
    counter: $('stepCounter'), barFill: $('barFill'),
    speed: $('speed'), speedOut: $('speedOut'),
    narration: $('narration'), chain: $('chain'),
    playerBox: $('playerBox'), narrationBox: $('narrationBox'),
    btnPractice: $('btnPractice'), practiceCard: $('practiceCard'), practiceIntro: $('practiceIntro'),
    practiceGivens: $('practiceGivens'), practiceForm: $('practiceForm'), prC1: $('prC1'), prC2: $('prC2'),
    practiceErr: $('practiceErr'), practiceResult: $('practiceResult'), btnPracticeExit: $('btnPracticeExit'),
    btnCompare: $('btnCompare'), btnRoutes: $('btnRoutes'), routeCard: $('routeCard'), routeLegend: $('routeLegend'),
    cmpView: $('cmpView'), cmpBack: $('cmpBack'), cmpBackText: $('cmpBackText'), cmpEyebrow: $('cmpEyebrow'),
    cmpRandom: $('cmpRandom'), cmpDraw: $('cmpDraw'), cmpAvg: $('cmpAvg'), cmpProgress: $('cmpProgress'),
    aboutView: $('aboutView'), aboutBody: $('aboutBody'), siteFoot: $('siteFoot'),
    moodleView: $('moodleView'), moodleBody: $('moodleBody'),
  };

  const state = {
    lang: (navigator.language || '').toLowerCase().startsWith('en') ? 'en' : 'es',
    view: null,          // 'home' | 'op' | 'cmp' | 'about' | 'moodle'
    opId: null,
    variant: null,       // variante del operador, si tiene varias
    draw: 1,             // semilla del sorteo de los operadores o variantes aleatorios (CX, uniforme)
    params: {},          // parámetros del operador (k cortes, probabilidad p...)
    n: 8, seed: 0, p1: [], p2: [], cuts: [],
    result: null, step: 0,
    playing: false, speed: 1, errKey: null,
    practice: false,     // modo «predice el hijo»: paso fijo en la intro, sin reproductor
    cmp: null,           // pantalla de comparar: { rep, from, variant, params, cuts, rows }
    routes: false,       // permutaciones: ver los cromosomas como rutas sobre un mapa de ciudades
  };
  const CMP_REPS = 1000;   // repeticiones para las medias de la comparación
  let cmpToken = 0;
  // Media con padres al azar (fase 10): parejas, cruces por pareja, semilla fija y tamaño de cada tanda.
  const CMP_RAND = { pairs: 1000, reps: 10, seed: 1, chunk: 20 };
  const randCache = new Map();   // clave de ajustes → medias ya calculadas
  let randToken = 0;
  let randJob = null;             // cálculo en curso: { key, token, done }
  let timer = null;
  let learn = null;

  // Los números no enteros se muestran con uno o dos decimales y la coma o el punto del idioma.
  const locale = () => (state.lang === 'es' ? 'es-ES' : 'en-GB');
  const fmtValue = (v) => (typeof v === 'number' && !Number.isInteger(v)
    ? v.toLocaleString(locale(), { minimumFractionDigits: 1, maximumFractionDigits: 2 })
    : v);
  // Genes: en la representación real, siempre con decimales (5,0 y no 5), para distinguirlos de las otras.
  const fmtGene = (v) => (curRep() === 'real' && typeof v === 'number'
    ? v.toLocaleString(locale(), { minimumFractionDigits: 1, maximumFractionDigits: 2 })
    : v);
  // params.genes: nombres de los parámetros que son valores de genes (se escriben como en la vista).
  const fill = (s, params) => (params ? s.replace(/\{(\w+)\}/g, (m, p) => {
    if (params[p] == null) return m;
    return params.genes && params.genes.indexOf(p) !== -1 ? fmtGene(params[p]) : fmtValue(params[p]);
  }) : s);
  const t = (key, params) => fill(i18n.t(state.lang, key), params);

  // Textos del operador actual (narración, leyenda propia...) con la interfaz general como respaldo.
  function tOp(key, params) {
    const c = state.opId && G.content[state.opId];
    const table = c && c.narration && (c.narration[state.lang] || c.narration.es);
    return table && table[key] != null ? fill(table[key], params) : t(key, params);
  }

  const impl = () => G.operators[state.opId];           // { spec, validateParents, ... }
  const spec = () => impl().spec;
  const meta = () => registry.getOperator(state.opId);   // nombre, resumen, subtítulo
  const repId = () => meta().representation;             // 'permutation' | 'binary' | 'real'
  const curRep = () => (state.view === 'cmp' ? state.cmp.rep : repId());

  // ---------- Cortes (según cuántos declare el operador) ----------

  // Número de cortes: fijo (0, 1, 2) o dado por el parámetro k (cruce en n puntos).
  function cutsCount(n) {
    const c = spec().cuts;
    if (c !== 'k') return c;
    return Math.max(1, Math.min(state.params.k || 1, (n || state.n) - 1));
  }
  const pmxStyleCuts = () => spec().cuts === 2;   // dos cortes [c1, c2): se admite c1 = 0 o c2 = n

  function validCuts(n, cuts) {
    const k = cutsCount(n);
    if (!Array.isArray(cuts) || cuts.length !== k) return false;
    if (k === 0) return true;
    if (pmxStyleCuts()) {
      const [c1, c2] = cuts;
      return Number.isInteger(c1) && Number.isInteger(c2) && c1 >= 0 && c2 <= n && c2 - c1 >= 1 && c2 - c1 <= n - 1;
    }
    return cuts.every((c, i) => Number.isInteger(c) && c >= 1 && c <= n - 1 && (i === 0 || c > cuts[i - 1]));
  }

  function randomCuts(rng, n) {
    const k = cutsCount(n);
    if (pmxStyleCuts()) return R.randomCuts(rng, n);
    if (k === 0) return [];
    return R.shuffle(rng, Array.from({ length: n - 1 }, (_, i) => i + 1)).slice(0, k).sort((a, b) => a - b);
  }

  // Posición válida más cercana a la pedida al arrastrar el corte i.
  function clampCut(i, g) {
    const n = state.n;
    const c = state.cuts.slice();
    if (pmxStyleCuts()) {
      if (i === 0) c[0] = Math.max(0, c[1] - (n - 1), Math.min(g, c[1] - 1));
      else c[1] = Math.min(n, c[0] + (n - 1), Math.max(g, c[0] + 1));
    } else {
      const lo = i > 0 ? c[i - 1] + 1 : 1;
      const hi = i < c.length - 1 ? c[i + 1] - 1 : n - 1;
      c[i] = Math.max(lo, Math.min(hi, g));
    }
    return c;
  }

  // ---------- Vistas ----------

  const view = createPermutationView($('viz'), {
    label: (key, params) => tOp(key, params),
    format: (v) => fmtGene(v),
    duration: () => Math.round(750 / state.speed),
    onCutDrag: (i, g) => {
      const c = clampCut(i, g);
      if (c.join() !== state.cuts.join()) { state.cuts = c; recompute(1); }
    },
  });

  const routeMaps = createRouteMaps({
    svgs: [$('routeMap1'), $('routeMap2')], caps: [$('routeCap1'), $('routeCap2')],
  }, {
    t: (k, p) => t(k, p),
    tourLength: G.cities.tourLength,
    formatLength: (v) => Math.round(v).toLocaleString(locale()),
  });
  const routesOn = () => state.routes && state.view === 'op' && repId() === 'permutation';

  function renderRoutes() {
    const perm = state.view === 'op' && repId() === 'permutation';
    el.btnRoutes.hidden = !perm;
    el.btnRoutes.textContent = t(state.routes ? 'hideRoutes' : 'showRoutes');
    el.btnRoutes.setAttribute('aria-pressed', String(!!state.routes));
    el.routeCard.hidden = !routesOn();
    const items = [['sw-line sw-route-p1', 'routeLegendP1'], ['sw-line sw-route-p2', 'routeLegendP2'],
      ['sw-line sw-route-kept', 'routeLegendKept'], ['sw-line sw-route-new', 'routeLegendNew'], ['sw-city', 'routeLegendCity']];
    if (perm && spec().invalidChildren) items.push(['sw-city-missing', 'routeLegendMissing']);
    el.routeLegend.replaceChildren(...items.map(([cls, k]) => {
      const li = document.createElement('li');
      const sw = document.createElement('span');
      sw.className = `sw ${cls}`;
      const lab = document.createElement('span');
      lab.textContent = t(k);
      li.append(sw, lab);
      return li;
    }));
    if (routesOn() && state.result) {
      routeMaps.setProblem({ p1: state.p1, p2: state.p2, cities: G.cities.randomCities(state.seed, state.n) });
      routeMaps.show(state.result.steps[state.step]);
    }
  }

  const home = createHome(el.repGrid, { registry, t: (k, p) => t(k, p), lang: () => state.lang });

  // ---------- Problema ----------

  // Padres aleatorios según la representación del operador.
  const GENERATORS = {
    permutation: (r, n) => R.randomPermutation(r, n),
    binary: (r, n) => G.binUtils.randomBits(r, n),
    real: (r, n) => G.realUtils.randomReals(r, n),
  };

  function generate(seed, n) {
    const r = R.mulberry32(seed);
    const gen = GENERATORS[repId()];
    const p1 = gen(r, n);
    let p2 = gen(r, n);
    while (p2.join() === p1.join()) p2 = gen(r, n);
    Object.assign(state, { seed, n, p1, p2, cuts: randomCuts(r, n) });
  }

  function recompute(step) {
    stop();
    state.result = spec().run(state.p1, state.p2, state.cuts, { variant: state.variant, seed: state.draw, params: state.params });
    view.setProblem({
      p1: state.p1, p2: state.p2, cuts: state.cuts,
      segment: !!spec().segment,
      links: !!spec().links,
      bands: state.result.bands || null,
      aux: state.result.aux || null,
    });
    if (routesOn()) routeMaps.setProblem({ p1: state.p1, p2: state.p2, cities: G.cities.randomCities(state.seed, state.n) });
    goTo(state.practice ? 0 : (step || 0), false);
    syncControls();
    // Los enlaces a los otros operadores llevan los padres (y cortes) actuales
    el.opSwitch.querySelectorAll('a.op-chip[data-op]').forEach((a) => { a.href = sameProblemHref(a.dataset.op); });
    el.btnCompare.href = compareHref();
    // El problema ha podido cambiar (padres, cortes, parámetros): refrescar los datos ocultos y la predicción.
    if (state.practice) { renderPracticeGivens(); resetPracticeForm(); }
  }

  // ---------- Reproductor ----------

  function goTo(i, animate) {
    const steps = state.result.steps;
    state.step = Math.max(0, Math.min(steps.length - 1, i));
    const step = steps[state.step];
    view.show(step, { animate });
    if (routesOn()) routeMaps.show(step);
    learn.setStep(step);
    renderNarration();
    el.btnPrev.disabled = el.btnReset.disabled = state.step === 0;
    el.btnNext.disabled = state.step === steps.length - 1;
    el.barFill.style.width = `${(100 * state.step) / Math.max(1, steps.length - 1)}%`;
    writeHash();
  }

  function renderNarration() {
    const steps = state.result.steps;
    const step = steps[state.step];
    el.counter.textContent = t('stepOf', { i: state.step + 1, n: steps.length });
    el.narration.textContent = tOp(step.text.key, step.text.params);
    el.chain.replaceChildren();
    if (step.chain && step.chain.length) {
      const lab = document.createElement('span');
      lab.className = 'chain-label';
      lab.textContent = `${t('chainLabel')}:`;
      el.chain.append(lab);
      step.chain.forEach((v, idx) => {
        if (idx > 0) {
          const a = document.createElement('span');
          a.className = 'arrow';
          a.textContent = '→';
          el.chain.append(a);
        }
        const c = document.createElement('span');
        c.className = 'chip' + (idx === step.chain.length - 1 && step.type !== 'conflict' ? ' last' : '');
        c.textContent = v;
        el.chain.append(c);
      });
      el.chain.hidden = false;
    } else {
      el.chain.hidden = true;
    }
  }

  function next() {
    if (state.step < state.result.steps.length - 1) goTo(state.step + 1, true);
    else stop();
  }
  function prev() { stop(); goTo(state.step - 1, false); }
  function reset() { stop(); goTo(0, false); }

  function play() {
    if (state.step >= state.result.steps.length - 1) goTo(0, false);
    state.playing = true;
    el.btnPlay.classList.add('playing');
    el.btnPlay.title = t('pause');
    el.btnPlay.setAttribute('aria-label', t('pause'));
    const tick = () => {
      if (!state.playing) return;
      next();
      if (state.step >= state.result.steps.length - 1) { stop(); return; }
      timer = setTimeout(tick, Math.round(2600 / state.speed));
    };
    timer = setTimeout(tick, 250);
  }
  function stop() {
    state.playing = false;
    clearTimeout(timer);
    el.btnPlay.classList.remove('playing');
    el.btnPlay.title = t('play');
    el.btnPlay.setAttribute('aria-label', t('play'));
  }
  function togglePlay() { if (state.playing) stop(); else play(); }

  // ---------- Modo práctica («predice el hijo») ----------

  // Operadores del cruce uniforme (binario y real): la máscara está calculada desde el principio,
  // pero solo se revela progresivamente en la traza normal, así que aquí sí es un dato oculto.
  const UNIFORM_OPS = ['uniform-binary', 'uniform-real'];

  function setPracticeMode(on) {
    state.practice = on;
    el.btnPractice.textContent = t(on ? 'exitPractice' : 'practiceMode');
    el.practiceCard.hidden = !on;
    el.playerBox.hidden = on;
    el.narrationBox.hidden = on;
    if (on) {
      el.practiceIntro.textContent = t('practiceIntro');
      renderPracticeGivens();
      resetPracticeForm();
      goTo(0, false);
    } else {
      goTo(state.step, false);
    }
  }

  // Información que el algoritmo ha sorteado y que la traza normal no muestra desde el principio
  // (o no muestra nunca): sin ella la predicción del hijo exacto no tendría una única respuesta.
  function renderPracticeGivens() {
    const r = state.result;
    const rows = [];
    const fmtDraw = (v) => v.toLocaleString(locale(), { minimumFractionDigits: 4, maximumFractionDigits: 4 });

    if (UNIFORM_OPS.indexOf(state.opId) !== -1 && Array.isArray(r.mask)) {
      rows.push({ label: t('practiceGivenMaskLabel'), value: r.mask.join(' '), hint: t('practiceGivenMaskHint') });
    }
    if (state.opId === 'cx' && state.variant === 'random' && Array.isArray(r.choices)) {
      const value = r.choices.map((c, i) => `${t('practiceCycleN', { k: i + 1 })}: ${t(c === 'p1' ? 'parent1' : 'parent2')}`).join(' · ');
      rows.push({ label: t('practiceGivenChoicesLabel'), value });
    }
    if ((state.opId === 'blx' || state.opId === 'sbx') && Array.isArray(r.draws)) {
      const perGene = Array.from({ length: state.n }, (_, i) => (state.opId === 'blx'
        ? `${t('practiceGeneN', { i: i + 1 })}: r₁=${fmtDraw(r.draws[2 * i])}, r₂=${fmtDraw(r.draws[2 * i + 1])}`
        : `${t('practiceGeneN', { i: i + 1 })}: u=${fmtDraw(r.draws[i])}`));
      rows.push({ label: t(state.opId === 'blx' ? 'practiceGivenBlxLabel' : 'practiceGivenSbxLabel'), value: perGene.join(' · ') });
    }

    if (state.opId === 'erx' && Array.isArray(r.picks) && r.picks.length) {
      const value = r.picks.map((p) => `${t(p.child === 0 ? 'child1Short' : 'child2Short')}: ${p.kind === 'tie'
        ? t('practiceErxTie', { options: p.options.join('/'), v: p.pick })
        : t('practiceErxJump', { v: p.pick })}`).join(' · ');
      rows.push({ label: t('practiceGivenErxLabel'), value });
    }

    el.practiceGivens.replaceChildren();
    el.practiceGivens.hidden = !rows.length;
    rows.forEach((row) => {
      const p = document.createElement('p');
      p.className = 'practice-given';
      const strong = document.createElement('strong');
      strong.textContent = `${row.label}: `;
      p.append(strong, document.createTextNode(row.value));
      if (row.hint) {
        const hint = document.createElement('span');
        hint.className = 'practice-given-hint';
        hint.textContent = ` ${row.hint}`;
        p.append(hint);
      }
      el.practiceGivens.append(p);
    });
  }

  function resetPracticeForm() {
    el.prC1.value = '';
    el.prC2.value = '';
    el.practiceErr.textContent = '';
    [el.prC1, el.prC2].forEach((i) => i.removeAttribute('aria-invalid'));
    el.practiceResult.replaceChildren();
    el.btnPracticeExit.hidden = true;
  }

  // Validación ligera de la predicción: solo el formato numérico que exige la representación
  // (longitud, bits, enteros en rango), SIN exigir que sea una permutación válida (en el
  // uno-punto de permutación el hijo «correcto» puede tener genes repetidos o que falten:
  // esa es justo la lección) ni el rango [0, 100] de la entrada manual de padres (en BLX-α
  // y SBX el hijo puede caer legítimamente fuera de ese rango).
  function validatePracticeGuess(guess) {
    const n = state.n;
    if (!Array.isArray(guess) || guess.length !== n) return 'errLength';
    if (repId() === 'binary') return guess.every((v) => v === 0 || v === 1) ? null : 'errBits';
    if (repId() === 'permutation') return guess.every((v) => Number.isInteger(v) && v >= 1 && v <= n) ? null : 'errFormat';
    return guess.every((v) => typeof v === 'number' && Number.isFinite(v)) ? null : 'errFormat';
  }

  function renderPracticeResult(rows) {
    el.practiceResult.replaceChildren();
    let ok = 0;
    let total = 0;
    rows.forEach((cells, ci) => {
      const line = document.createElement('div');
      line.className = 'practice-result-row';
      const label = document.createElement('span');
      label.className = 'practice-result-label';
      label.textContent = `${t(ci === 0 ? 'child1' : 'child2')}:`;
      line.append(label);
      cells.forEach((cell) => {
        total++;
        if (cell.ok) ok++;
        const chip = document.createElement('span');
        chip.className = `practice-gene ${cell.ok ? 'ok' : 'bad'}`;
        chip.textContent = cell.ok ? fmtGene(cell.correct) : `${fmtGene(cell.guess)} → ${fmtGene(cell.correct)}`;
        line.append(chip);
      });
      el.practiceResult.append(line);
    });
    const summary = document.createElement('p');
    summary.className = `practice-score${ok === total ? ' all' : ''}`;
    summary.textContent = ok === total ? t('practiceAllCorrect') : t('practiceResultScore', { ok, total });
    el.practiceResult.append(summary);
    el.btnPracticeExit.hidden = false;
  }

  function gradePractice() {
    const g1 = parseList(el.prC1.value);
    const g2 = parseList(el.prC2.value);
    const err = validatePracticeGuess(g1) || validatePracticeGuess(g2);
    el.practiceErr.textContent = err ? t(err) : '';
    [el.prC1, el.prC2].forEach((i) => i.setAttribute('aria-invalid', String(!!err)));
    if (err) { el.practiceResult.replaceChildren(); el.btnPracticeExit.hidden = true; return; }

    const correct = state.result.children;
    const isReal = repId() === 'real';
    const closeEnough = (a, b) => (isReal ? Math.abs(a - b) < 0.1 : a === b);
    const rows = [g1, g2].map((guess, ci) => guess.map((v, i) => ({ guess: v, correct: correct[ci][i], ok: closeEnough(v, correct[ci][i]) })));
    renderPracticeResult(rows);
  }

  // ---------- Comparar operadores ----------

  const cmpView = createCompareView({
    parents: $('cmpParents'), children: $('cmpChildren'), legend: $('cmpLegend'),
    table: $('cmpTable'), tableNote: $('cmpTableNote'), defs: $('cmpDefs'), refs: $('cmpRefs'),
  }, {
    t: (k, p) => t(k, p),
    metrics: G.compare.METRICS,
    format: (v) => fmtGene(v),
    opName: (id) => registry.getOperator(id).name[state.lang],
    opHref: (row) => opHref(row.id, { variant: row.variant, params: row.params, cuts: row.cuts, draw: state.draw }),
    opMeta: (row) => cmpMeta(row),
    value: (m, v) => cmpValue(m, v),
  });

  const PARAM_SYMBOL = { k: 'k', p: 'p', lambda: 'λ', alpha: 'α', eta: 'η' };

  // Enlace a la página de un operador con los padres actuales y los ajustes dados.
  function opHref(id, o) {
    const target = G.operators[id].spec;
    const q = new URLSearchParams([['op', id], ['lang', state.lang]]);
    if (o.variant) q.set('v', o.variant);
    const usesR = target.random || (target.randomVariants && target.randomVariants.indexOf(o.variant) !== -1);
    if (usesR && o.draw) q.set('r', String(o.draw));
    (target.params || []).forEach((pr) => { if (o.params && o.params[pr.id] != null) q.set(pr.id, String(o.params[pr.id])); });
    q.set('p1', state.p1.join('-'));
    q.set('p2', state.p2.join('-'));
    if (o.cuts && o.cuts.length) q.set('c', o.cuts.join('-'));
    q.set('s', String(state.seed));
    return `#${q.toString()}`;
  }

  // Enlace a la comparación desde la página de un operador: mismos padres, cortes, variante y parámetros.
  function compareHref() {
    const q = new URLSearchParams([['cmp', repId()], ['lang', state.lang], ['from', state.opId]]);
    if (state.variant) q.set('v', state.variant);
    if (usesDraw()) q.set('r', String(state.draw));
    (spec().params || []).forEach((pr) => q.set(pr.id, String(state.params[pr.id])));
    q.set('p1', state.p1.join('-'));
    q.set('p2', state.p2.join('-'));
    if (state.cuts.length) q.set('c', state.cuts.join('-'));
    q.set('s', String(state.seed));
    return `#${q.toString()}`;
  }

  // Ajustes con los que se ha cruzado cada operador: cortes, variante y parámetros.
  function cmpMeta(row) {
    const target = G.operators[row.id].spec;
    const parts = [];
    const c = row.cuts;
    if (target.cuts === 2) parts.push(t('cmpSegment', { a: c[0] + 1, b: c[1] }));
    else if (target.cuts === 1) parts.push(t('cmpCutAfter', { c: c[0] }));
    else if (target.cuts === 'k') parts.push(c.length === 1 ? t('cmpCutAfter', { c: c[0] }) : t('cmpCutsAfter', { list: c.join(', ') }));
    if (row.variant) parts.push(`${t('variant').toLowerCase()}: ${G.content[row.id].variants[row.variant].name[state.lang]}`);
    (target.params || []).forEach((pr) => { if (pr.id !== 'k') parts.push(`${PARAM_SYMBOL[pr.id] || pr.id} = ${fmtValue(row.params[pr.id])}`); });
    return parts.join(' · ');
  }

  function cmpValue(m, v) {
    if (m.kind === 'pct') return v.toLocaleString(locale(), { style: 'percent', maximumFractionDigits: 0 });
    const d = m.id === 'distance' ? 2 : 1;
    return v.toLocaleString(locale(), { minimumFractionDigits: d, maximumFractionDigits: d });
  }

  const cmpOps = (rep) => registry.getRepresentation(rep).operators
    .filter((op) => op.ready && G.operators[op.id] && G.content[op.id])
    .map((op) => ({ id: op.id, spec: G.operators[op.id].spec }));

  function compareOpts(reps) {
    const c = state.cmp;
    return {
      rep: c.rep, ops: cmpOps(c.rep), p1: state.p1, p2: state.p2, cuts: c.cuts,
      from: c.from, variant: c.variant, params: c.params, draw: state.draw, reps, seed: state.seed + 1,
    };
  }

  // Primero el ejemplo (rápido); las medias, justo después, para no bloquear el primer dibujado.
  function recomputeCompare() {
    const token = ++cmpToken;
    const c = state.cmp;
    c.rows = G.compare.compare(compareOpts(0));
    cmpView.render(cmpModel());
    syncAvg();
    writeHash();
    setTimeout(() => {
      if (token !== cmpToken || state.view !== 'cmp') return;
      c.rows = G.compare.compare(compareOpts(CMP_REPS));
      cmpView.setTable(cmpModel());
      if (c.avg === 'rand') ensureRandMean();
    }, 30);
  }

  // Modelo para la vista: en el modo «padres al azar», la media mostrada es la de muchas parejas.
  function cmpModel() {
    const c = state.cmp;
    const rand = c.avg === 'rand' ? randCache.get(randKey()) || null : null;
    const rows = (c.rows || []).map((r) => (c.avg === 'rand' ? Object.assign({}, r, { mean: rand ? rand[r.id] : null }) : r));
    return {
      rep: c.rep, n: state.n, p1: state.p1, p2: state.p2, rows, reps: CMP_REPS, from: c.from,
      mode: c.avg, pairs: CMP_RAND.pairs, randReps: CMP_RAND.reps,
    };
  }

  // La media con padres al azar solo depende de la representación, la longitud y los ajustes.
  function randKey() {
    const c = state.cmp;
    return JSON.stringify([c.rep, state.n, c.from, c.variant, c.params]);
  }

  // Calcula (por tandas, sin bloquear la página) la media con padres al azar, si no está ya.
  function ensureRandMean() {
    const key = randKey();
    if (randCache.has(key)) { el.cmpProgress.textContent = ''; return; }
    if (randJob && randJob.key === key) return;   // ya se está calculando
    const token = ++randToken;
    randJob = { key, token, done: 0 };
    const c = state.cmp;
    const acc = G.compare.randomMeanStart({
      rep: c.rep, ops: cmpOps(c.rep), n: state.n, from: c.from, variant: c.variant, params: c.params,
      pairs: CMP_RAND.pairs, reps: CMP_RAND.reps, seed: CMP_RAND.seed,
    });
    const tick = () => {
      if (token !== randToken || state.view !== 'cmp' || randKey() !== key) {
        if (randJob && randJob.token === token) randJob = null;
        return;
      }
      const done = G.compare.randomMeanStep(acc, CMP_RAND.chunk);
      randJob.done = done;
      if (done < 1) {
        showRandProgress();
        setTimeout(tick, 0);
        return;
      }
      randCache.set(key, G.compare.randomMeanResult(acc));
      randJob = null;
      el.cmpProgress.textContent = '';
      if (state.cmp.avg === 'rand') cmpView.setTable(cmpModel());
    };
    showRandProgress();
    setTimeout(tick, 0);
  }

  function showRandProgress() {
    const busy = randJob && state.cmp && state.cmp.avg === 'rand' && randJob.key === randKey();
    el.cmpProgress.textContent = busy ? t('compareProgress', { p: Math.floor(100 * randJob.done) }) : '';
  }

  function syncAvg() {
    el.cmpAvg.querySelectorAll('button[data-avg]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.avg === state.cmp.avg)));
    showRandProgress();
  }

  function renderCompareHeader() {
    const c = state.cmp;
    const rep = registry.getRepresentation(c.rep);
    el.cmpEyebrow.textContent = t('representationOf', { name: rep.name[state.lang] });
    document.title = t('compareDocTitle', { name: rep.name[state.lang] });
    if (c.from) {
      const src = c.rows && c.rows.find((r) => r.id === c.from);
      el.cmpBackText.textContent = t('compareBackTo', { name: registry.getOperator(c.from).name[state.lang] });
      el.cmpBack.href = opHref(c.from, { variant: c.variant, params: c.params, cuts: src ? src.cuts : c.cuts, draw: state.draw });
    } else {
      el.cmpBackText.textContent = t('allOperators');
      el.cmpBack.href = `#lang=${state.lang}`;
    }
  }

  function showCompare(repIdParam, q) {
    stop();
    const ops = cmpOps(repIdParam);
    const from = ops.some((o) => o.id === q.get('from')) ? q.get('from') : null;
    const fromSpec = from ? G.operators[from].spec : null;
    const params = {};
    if (fromSpec) {
      (fromSpec.params || []).forEach((pr) => {
        const v = q.has(pr.id) && q.get(pr.id) !== '' ? Number(q.get(pr.id)) : NaN;
        params[pr.id] = Number.isFinite(v) && v >= pr.min && v <= pr.max ? v : pr.default;
      });
    }
    const variant = fromSpec && fromSpec.variants && fromSpec.variants.indexOf(q.get('v')) !== -1 ? q.get('v') : null;
    const r = parseInt(q.get('r'), 10);
    state.draw = Number.isFinite(r) && r > 0 ? r % 1000000 : R.newSeed() + 1;
    state.view = 'cmp';
    state.cmp = { rep: repIdParam, from, variant, params, cuts: [], rows: null, avg: q.get('avg') === 'rand' ? 'rand' : 'same' };

    const seed = parseInt(q.get('s'), 10);
    const p1 = (q.get('p1') || '').split('-').filter(Boolean).map(Number);
    const p2 = (q.get('p2') || '').split('-').filter(Boolean).map(Number);
    const cuts = (q.get('c') || '').split('-').filter((x) => x !== '').map(Number);
    if (p1.length && !G.operators[ops[0].id].validateParents(p1, p2)) {
      Object.assign(state, { p1, p2, n: p1.length, seed: Number.isFinite(seed) ? Math.abs(seed) % 1000000 : state.seed });
      state.cmp.cuts = cuts.every((c) => Number.isInteger(c) && c >= 0 && c <= p1.length) ? cuts : [];
    } else {
      cmpParents(Number.isFinite(seed) ? Math.abs(seed) % 1000000 : R.newSeed(), state.n || 8);
    }

    el.homeView.hidden = true;
    el.opView.hidden = true;
    el.aboutView.hidden = true;
    el.moodleView.hidden = true;
    el.cmpView.hidden = false;
    recomputeCompare();
    renderCompareHeader();
    window.scrollTo(0, 0);
  }

  // Padres aleatorios para la comparación (los cortes de origen se conservan si siguen valiendo).
  function cmpParents(seed, n) {
    const r = R.mulberry32(seed);
    const gen = GENERATORS[state.cmp.rep];
    const p1 = gen(r, n);
    let p2 = gen(r, n);
    while (p2.join() === p1.join()) p2 = gen(r, n);
    Object.assign(state, { seed, n, p1, p2 });
  }

  // ---------- Cabecera, selector de operadores y leyenda ----------

  const LEGEND = {
    p1: ['sw-p1', 'legendP1'],
    p2: ['sw-p2', 'legendP2'],
    mapped: ['sw-mapped', 'legendMapped'],
    conflict: ['sw-conflict', 'legendConflict'],
    segment: ['sw-segment', 'legendSegment'],
    link: ['sw-link', 'legendLink'],
    mask: ['sw-mask', 'legendMask'],
    blend: ['sw-blend', 'legendBlend'],
    both: ['sw-both', 'legendBoth'],
    jump: ['sw-jump', 'legendJump'],
    cloud: ['sw-cloud', 'legendCloud'],
    cloudChild1: ['sw-cloud-c1', 'legendCloudChild1'],
    cloudChild2: ['sw-cloud-c2', 'legendCloudChild2'],
  };

  // Enlace a otro operador de la misma representación con los mismos padres (y cortes, si usa los mismos),
  // para comparar operadores sobre el mismo ejemplo.
  function sameProblemHref(id) {
    const target = G.operators[id] && G.operators[id].spec;
    const q = new URLSearchParams([['op', id], ['lang', state.lang], ['p1', state.p1.join('-')], ['p2', state.p2.join('-')]]);
    if (target && target.cuts === spec().cuts && target.cuts !== 'k') q.set('c', state.cuts.join('-'));
    q.set('s', String(state.seed));
    if (state.routes && repId() === 'permutation') q.set('m', '1');
    return `#${q.toString()}`;
  }

  function renderOpHeader() {
    const m = meta();
    const rep = registry.getRepresentation(m.representation);
    const l = state.lang;
    el.opEyebrow.textContent = t('representationOf', { name: rep.name[l] });
    el.opTitle.textContent = m.name[l];
    el.opSubtitle.textContent = m.subtitle ? m.subtitle[l] : m.summary[l];
    el.vizLabel.textContent = t('svgLabel', { name: m.name[l] });
    document.title = t('opTitleDoc', { name: m.name[l] });

    el.opSwitch.replaceChildren(...rep.operators.map((op) => {
      const current = op.id === state.opId;
      const chip = document.createElement(op.ready && !current ? 'a' : 'span');
      chip.className = 'op-chip' + (current ? ' current' : '') + (op.ready ? '' : ' soon');
      chip.textContent = op.name[l];
      if (current) chip.setAttribute('aria-current', 'page');
      else if (op.ready) { chip.dataset.op = op.id; chip.href = sameProblemHref(op.id); }
      else {
        chip.title = t('comingSoon');
        const s = document.createElement('span');
        s.className = 'sr-only';
        s.textContent = ` (${t('comingSoon')})`;
        chip.append(s);
      }
      return chip;
    }));

    el.legend.replaceChildren(...spec().legend.map((key) => {
      const li = document.createElement('li');
      const sw = document.createElement('span');
      sw.className = `sw ${LEGEND[key][0]}`;
      const lab = document.createElement('span');
      lab.textContent = tOp(LEGEND[key][1]);
      li.append(sw, lab);
      return li;
    }));

    const hasCuts = spec().cuts > 0;
    el.btnCuts.hidden = !hasCuts;
    el.dragHint.hidden = !hasCuts;
    renderVariants();
    renderParams();
    el.manualHint.textContent = t(`manualHint_${repId()}`);
    const PH = {
      binary: ['1 1 0 0 1 0 0 1', '0 0 1 0 1 1 0 0'],
      real: state.lang === 'es' ? ['2,0 4,5 1,0 8,0 6,5 3,0', '6,0 0,5 3,0 9,0 2,5 7,0'] : ['2.0 4.5 1.0 8.0 6.5 3.0', '6.0 0.5 3.0 9.0 2.5 7.0'],
      permutation: ['1 2 3 4 5 6 7 8', '3 7 5 1 6 8 2 4'],
    };
    const ph = PH[repId()];
    el.inP1.placeholder = ph[0];
    el.inP2.placeholder = ph[1];
    el.prC1.placeholder = ph[0];
    el.prC2.placeholder = ph[1];
  }

  // Controles de los parámetros del operador (p. ej. número de cortes k, probabilidad p).
  function renderParams() {
    const ps = spec().params || [];
    el.paramsBox.hidden = !ps.length;
    el.paramsBox.replaceChildren(...ps.map((pr) => {
      const id = `param-${pr.id}`;
      const field = document.createElement('div');
      field.className = 'field';
      const lab = document.createElement('label');
      lab.htmlFor = id;
      lab.textContent = tOp(`param${pr.id.toUpperCase()}`);
      const wrap = document.createElement('div');
      wrap.className = 'range-wrap';
      const input = document.createElement('input');
      Object.assign(input, { type: 'range', id, min: pr.min, max: pr.id === 'k' ? Math.min(pr.max, state.n - 1) : pr.max, step: pr.step, value: state.params[pr.id] });
      const out = document.createElement('output');
      out.htmlFor = id;
      out.textContent = fmtValue(state.params[pr.id]);
      input.addEventListener('input', () => { out.textContent = fmtValue(Number(input.value)); });
      input.addEventListener('change', () => {
        state.params[pr.id] = Number(input.value);
        if (pr.id === 'k') state.cuts = randomCuts(R.mulberry32((Date.now() ^ state.seed) >>> 0), state.n);
        recompute(0);
      });
      wrap.append(input, out);
      field.append(lab, wrap);
      return field;
    }));
  }

  const usesDraw = () => !!(spec().random || (spec().randomVariants && spec().randomVariants.indexOf(state.variant) !== -1));

  function renderVariants() {
    const vs = spec().variants;
    el.variantField.hidden = !vs;
    el.variantDesc.hidden = !vs;
    el.btnDraw.hidden = !usesDraw();
    if (!vs) return;
    const meta = G.content[state.opId].variants;
    const l = state.lang;
    el.variant.replaceChildren(...vs.map((v) => {
      const o = document.createElement('option');
      o.value = v;
      o.textContent = meta[v].name[l];
      return o;
    }));
    el.variant.value = state.variant;
    el.variantDesc.textContent = meta[state.variant].desc[l];
    el.btnDraw.hidden = !usesDraw();
  }

  // ---------- Idioma ----------

  function applyLanguage() {
    document.documentElement.lang = state.lang;
    document.querySelectorAll('[data-i18n]').forEach((node) => { node.textContent = t(node.dataset.i18n); });
    document.querySelectorAll('[data-i18n-aria]').forEach((node) => node.setAttribute('aria-label', t(node.dataset.i18nAria)));
    document.querySelectorAll('[data-i18n-title]').forEach((node) => {
      node.title = t(node.dataset.i18nTitle);
      node.setAttribute('aria-label', t(node.dataset.i18nTitle));
    });
    document.querySelectorAll('.lang button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === state.lang)));
    el.err.textContent = state.errKey ? t(state.errKey) : '';
    if (state.playing) { el.btnPlay.title = t('pause'); el.btnPlay.setAttribute('aria-label', t('pause')); }
    G.about.renderFooter(el.siteFoot, state.lang);
    $('moodleLink').href = `#page=moodle&lang=${state.lang}`;
    $('sisterLink').href = G.about.sisterUrl(state.lang);
    if (state.view === 'about') {
      document.title = `${G.about.text[state.lang].title} · ${t('brand')}`;
      G.about.renderAbout(el.aboutBody, state.lang);
    }
    if (state.view === 'moodle') {
      document.title = `${G.moodlePage.text[state.lang].title} · ${t('brand')}`;
      G.moodlePage.renderMoodle(el.moodleBody, state.lang);
    }
    if (state.view === 'home') {
      document.title = t('homeTitleDoc');
      home.render();
    } else if (state.view === 'op') {
      renderOpHeader();
      view.refreshLabels();
      view.show(view.step, { animate: false });   // genes con la coma o el punto del idioma
      learn.refresh();
      renderNarration();
      syncControls();
      el.btnPractice.textContent = t(state.practice ? 'exitPractice' : 'practiceMode');
      if (state.practice) {
        el.practiceIntro.textContent = t('practiceIntro');
        renderPracticeGivens();
        resetPracticeForm();
      }
      el.btnCompare.href = compareHref();
      renderRoutes();
    } else if (state.view === 'cmp') {
      renderCompareHeader();
      cmpView.render(cmpModel());
      showRandProgress();
    }
    writeHash();
  }

  // ---------- Enrutado ----------

  function showHome() {
    stop();
    state.view = 'home';
    el.opView.hidden = true;
    el.cmpView.hidden = true;
    el.aboutView.hidden = true;
    el.moodleView.hidden = true;
    el.homeView.hidden = false;
  }

  function showAbout() {
    stop();
    const changed = state.view !== 'about';
    state.view = 'about';
    el.homeView.hidden = true;
    el.opView.hidden = true;
    el.cmpView.hidden = true;
    el.moodleView.hidden = true;
    el.aboutView.hidden = false;
    if (changed) window.scrollTo(0, 0);
  }

  function showMoodle() {
    stop();
    const changed = state.view !== 'moodle';
    state.view = 'moodle';
    el.homeView.hidden = true;
    el.opView.hidden = true;
    el.cmpView.hidden = true;
    el.aboutView.hidden = true;
    el.moodleView.hidden = false;
    if (changed) window.scrollTo(0, 0);
  }

  function showOp(id, q) {
    stop();
    const changed = id !== state.opId || state.view !== 'op';
    state.view = 'op';
    state.opId = id;
    state.errKey = null;
    state.practice = false;
    state.routes = q.get('m') === '1';
    el.practiceCard.hidden = true;
    el.playerBox.hidden = false;
    el.narrationBox.hidden = false;
    el.btnPractice.textContent = t('practiceMode');
    el.homeView.hidden = true;
    el.cmpView.hidden = true;
    el.aboutView.hidden = true;
    el.moodleView.hidden = true;
    el.opView.hidden = false;   // visible antes de dibujar, para medir el ancho disponible

    const vs = impl().spec.variants;
    const v = q.get('v');
    state.variant = vs ? (vs.indexOf(v) !== -1 ? v : impl().spec.defaultVariant) : null;
    state.params = {};
    (impl().spec.params || []).forEach((pr) => {
      const v = q.has(pr.id) && q.get(pr.id) !== '' ? Number(q.get(pr.id)) : NaN;
      state.params[pr.id] = Number.isFinite(v) && v >= pr.min && v <= pr.max ? v : pr.default;
    });
    const r = parseInt(q.get('r'), 10);
    state.draw = Number.isFinite(r) && r > 0 ? r % 1000000 : R.newSeed() + 1;
    if (!learn) {
      learn = createLearnPanel({ content: G.content[id], t: (k, p) => t(k, p), lang: () => state.lang });
      learn.setVariant(state.variant);
    } else learn.setContent(G.content[id], state.variant);

    const seed = parseInt(q.get('s'), 10);
    const p1 = (q.get('p1') || '').split('-').filter(Boolean).map(Number);
    const p2 = (q.get('p2') || '').split('-').filter(Boolean).map(Number);
    const cuts = (q.get('c') || '').split('-').filter((x) => x !== '').map(Number);
    const s0 = Number.isFinite(seed) ? Math.abs(seed) % 1000000 : state.seed;
    if (p1.length && !impl().validateParents(p1, p2)) {
      // Padres válidos: se conservan; si los cortes no valen para este operador, se sortean.
      const okCuts = validCuts(p1.length, cuts) ? cuts : randomCuts(R.mulberry32(s0 + 1), p1.length);
      Object.assign(state, { p1, p2, cuts: okCuts, n: p1.length, seed: s0 });
    } else {
      generate(Number.isFinite(seed) ? Math.abs(seed) % 1000000 : R.newSeed(), state.n);
    }
    renderOpHeader();
    recompute(parseInt(q.get('step'), 10) || 0);
    renderRoutes();
    if (changed) window.scrollTo(0, 0);
  }

  function route() {
    const q = new URLSearchParams(location.hash.replace(/^#/, ''));
    if (i18n.languages.indexOf(q.get('lang')) !== -1) state.lang = q.get('lang');
    const id = q.get('op');
    const cmp = q.get('cmp');
    if (id && registry.isReady(id) && G.operators[id] && G.content[id]) showOp(id, q);
    else if (cmp && registry.getRepresentation(cmp) && cmpOps(cmp).length) showCompare(cmp, q);
    else if (q.get('page') === 'about') showAbout();
    else if (q.get('page') === 'moodle') showMoodle();
    else showHome();
    applyLanguage();
  }

  // Guarda el estado en la URL sin crear entradas de historial (para proyectar o compartir).
  function writeHash() {
    const params = { lang: state.lang };
    if (state.view === 'about') params.page = 'about';
    if (state.view === 'moodle') params.page = 'moodle';
    if (state.view === 'op') {
      Object.assign(params, {
        op: state.opId,
        v: state.variant || undefined,
        r: usesDraw() ? String(state.draw) : undefined,
        p1: state.p1.join('-'),
        p2: state.p2.join('-'),
        c: state.cuts.join('-'),
        s: String(state.seed),
        step: String(state.step),
        m: routesOn() ? '1' : undefined,
      });
    }
    if (state.view === 'op') (spec().params || []).forEach((pr) => { params[pr.id] = String(state.params[pr.id]); });
    let paramIds = state.view === 'op' ? (spec().params || []).map((pr) => pr.id) : [];
    if (state.view === 'cmp') {
      const c = state.cmp;
      Object.assign(params, {
        cmp: c.rep,
        from: c.from || undefined,
        avg: c.avg === 'rand' ? 'rand' : undefined,
        v: c.variant || undefined,
        r: String(state.draw),
        p1: state.p1.join('-'),
        p2: state.p2.join('-'),
        c: c.cuts.length ? c.cuts.join('-') : undefined,
        s: String(state.seed),
      });
      paramIds = Object.keys(c.params);
      paramIds.forEach((k) => { params[k] = String(c.params[k]); });
    }
    const order = ['page', 'op', 'cmp', 'lang', 'from', 'avg', 'v', 'r'].concat(paramIds, ['p1', 'p2', 'c', 's', 'm', 'step']).filter((k) => params[k] != null && params[k] !== '');
    const h = new URLSearchParams(order.map((k) => [k, params[k]])).toString();
    if (location.hash.replace(/^#/, '') === h) return;
    try { history.replaceState(null, '', `#${h}`); } catch (err) { /* file:// en algunos navegadores */ }
  }

  // ---------- Controles ----------

  function syncControls() {
    el.len.value = state.n;
    el.lenOut.textContent = state.n;
    el.seed.value = state.seed;
    el.inP1.value = state.p1.map(fmtGene).join(' ');
    el.inP2.value = state.p2.map(fmtGene).join(' ');
  }

  el.len.addEventListener('input', () => { el.lenOut.textContent = el.len.value; });
  el.len.addEventListener('change', () => {
    const n = Number(el.len.value);
    if (state.params.k && state.params.k > n - 1) state.params.k = n - 1;
    generate(state.seed, n);
    renderParams();
    recompute(0);
  });
  el.seed.addEventListener('change', () => {
    const s = Math.abs(parseInt(el.seed.value, 10));
    if (!Number.isFinite(s)) { el.seed.value = state.seed; return; }
    generate(s % 1000000, state.n);
    recompute(0);
  });
  el.btnRandom.addEventListener('click', () => {
    generate(R.newSeed(), state.n);
    recompute(0);
  });
  el.btnDraw.addEventListener('click', () => {
    state.draw = R.newSeed() + 1;
    recompute(0);
  });
  el.btnCuts.addEventListener('click', () => {
    const r = R.mulberry32((Date.now() ^ state.seed) >>> 0);
    let cuts;
    do { cuts = randomCuts(r, state.n); } while (cuts.length && cuts.join() === state.cuts.join());
    state.cuts = cuts;
    recompute(1);
  });

  // Lista de números; en binaria también se admite una cadena seguida como 10110 y en real,
  // la coma decimal (entonces los genes se separan con espacios o punto y coma).
  const parseList = (s) => {
    if (repId() === 'real') return s.trim().split(/[\s;]+/).filter(Boolean).map((x) => Number(x.replace(',', '.')));
    const tokens = s.trim().split(/[\s,;]+/).filter(Boolean);
    if (repId() === 'binary' && tokens.length === 1 && /^\d{2,}$/.test(tokens[0])) return tokens[0].split('').map(Number);
    return tokens.map(Number);
  };
  el.manualForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const p1 = parseList(el.inP1.value);
    const p2 = parseList(el.inP2.value);
    const err = impl().validateParents(p1, p2);
    state.errKey = err;
    el.err.textContent = err ? t(err) : '';
    [el.inP1, el.inP2].forEach((i) => i.setAttribute('aria-invalid', String(!!err)));
    if (err) return;
    const n = p1.length;
    let cuts = state.cuts;
    if (n !== state.n || !validCuts(n, cuts)) cuts = randomCuts(R.mulberry32(state.seed), n);
    Object.assign(state, { n, p1, p2, cuts });
    recompute(0);
  });

  el.btnPractice.addEventListener('click', () => setPracticeMode(!state.practice));
  el.btnRoutes.addEventListener('click', () => {
    state.routes = !state.routes;
    renderRoutes();
    el.opSwitch.querySelectorAll('a.op-chip[data-op]').forEach((a) => { a.href = sameProblemHref(a.dataset.op); });
    writeHash();
  });
  el.cmpRandom.addEventListener('click', () => {
    cmpParents(R.newSeed(), state.n);
    recomputeCompare();
    renderCompareHeader();
  });
  el.cmpAvg.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-avg]');
    if (!b || b.dataset.avg === state.cmp.avg) return;
    state.cmp.avg = b.dataset.avg;
    syncAvg();
    cmpView.setTable(cmpModel());
    if (state.cmp.avg === 'rand') ensureRandMean();
    writeHash();
  });
  el.cmpDraw.addEventListener('click', () => {
    state.draw = R.newSeed() + 1;
    recomputeCompare();
    renderCompareHeader();
  });
  el.btnPracticeExit.addEventListener('click', () => setPracticeMode(false));
  el.practiceForm.addEventListener('submit', (e) => { e.preventDefault(); gradePractice(); });

  el.variant.addEventListener('change', () => {
    state.variant = el.variant.value;
    el.variantDesc.textContent = G.content[state.opId].variants[state.variant].desc[state.lang];
    el.btnDraw.hidden = !usesDraw();
    learn.setVariant(state.variant);
    recompute(state.step);   // mismo paso, para comparar variantes
  });

  el.speed.addEventListener('input', () => {
    state.speed = Number(el.speed.value);
    el.speedOut.textContent = `${state.speed}×`;
  });

  el.btnNext.addEventListener('click', () => { stop(); next(); });
  el.btnPrev.addEventListener('click', prev);
  el.btnReset.addEventListener('click', reset);
  el.btnPlay.addEventListener('click', togglePlay);

  document.querySelectorAll('.lang button').forEach((b) => b.addEventListener('click', () => {
    state.lang = b.dataset.lang;
    applyLanguage();
  }));

  // Enlaces a la pantalla inicial conservando el idioma
  [$('brandLink'), $('backLink'), $('aboutBack'), $('moodleBack')].forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    location.hash = `lang=${state.lang}`;
  }));

  document.addEventListener('keydown', (e) => {
    if (state.view !== 'op') return;
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) return;
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (state.practice) return;   // el paso queda fijo en la intro mientras se practica
    if (e.key === 'ArrowRight') { e.preventDefault(); stop(); next(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    else if (e.key === ' ' && tag !== 'button' && tag !== 'summary' && tag !== 'a') { e.preventDefault(); togglePlay(); }
    else if (e.key === 'Home') { e.preventDefault(); reset(); }
  });

  window.addEventListener('hashchange', route);

  // ---------- Arranque ----------
  route();
})();
