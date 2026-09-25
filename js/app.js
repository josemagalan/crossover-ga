/*
 * Controlador de la página: enrutado (inicio / operador), estado, controles,
 * reproductor, idioma y URL.
 *
 * URL: #lang=es                          → pantalla inicial
 *      #op=pmx&lang=es&v=…&p1=…&p2=…&c=…&s=…&step=…  → página de un operador (v: variante, si la hay)
 */
(function () {
  'use strict';
  const G = window.GAX;
  const { rng: R, i18n, registry, createPermutationView, createLearnPanel, createHome } = G;

  const $ = (id) => document.getElementById(id);
  const el = {
    homeView: $('homeView'), opView: $('opView'), repGrid: $('repGrid'),
    opEyebrow: $('opEyebrow'), opTitle: $('opTitle'), opSubtitle: $('opSubtitle'),
    opSwitch: $('opSwitch'), vizLabel: $('vizLabel'), legend: $('legend'), dragHint: $('dragHint'),
    len: $('len'), lenOut: $('lenOut'), seed: $('seed'),
    variantField: $('variantField'), variant: $('variant'), variantDesc: $('variantDesc'),
    btnRandom: $('btnRandom'), btnCuts: $('btnCuts'),
    manualForm: $('manualForm'), inP1: $('inP1'), inP2: $('inP2'), err: $('err'),
    btnReset: $('btnReset'), btnPrev: $('btnPrev'), btnPlay: $('btnPlay'), btnNext: $('btnNext'),
    counter: $('stepCounter'), barFill: $('barFill'),
    speed: $('speed'), speedOut: $('speedOut'),
    narration: $('narration'), chain: $('chain'),
  };

  const state = {
    lang: (navigator.language || '').toLowerCase().startsWith('en') ? 'en' : 'es',
    view: null,          // 'home' | 'op'
    opId: null,
    variant: null,       // variante del operador, si tiene varias
    n: 8, seed: 0, p1: [], p2: [], cuts: [],
    result: null, step: 0,
    playing: false, speed: 1, errKey: null,
  };
  let timer = null;
  let learn = null;

  const fill = (s, params) => (params ? s.replace(/\{(\w+)\}/g, (m, p) => (params[p] != null ? params[p] : m)) : s);
  const t = (key, params) => i18n.t(state.lang, key, params);

  // Textos del operador actual (narración, leyenda propia...) con la interfaz general como respaldo.
  function tOp(key, params) {
    const c = state.opId && G.content[state.opId];
    const table = c && c.narration && (c.narration[state.lang] || c.narration.es);
    return table && table[key] != null ? fill(table[key], params) : t(key, params);
  }

  const impl = () => G.operators[state.opId];           // { spec, validateParents, ... }
  const spec = () => impl().spec;
  const meta = () => registry.getOperator(state.opId);   // nombre, resumen, subtítulo

  // ---------- Cortes (según cuántos declare el operador) ----------

  function validCuts(n, cuts) {
    const k = spec().cuts;
    if (!Array.isArray(cuts) || cuts.length !== k) return false;
    if (k === 0) return true;
    const [c1, c2] = cuts;
    return Number.isInteger(c1) && Number.isInteger(c2) && c1 >= 0 && c2 <= n && c2 - c1 >= 1 && c2 - c1 <= n - 1;
  }

  function randomCuts(rng, n) {
    return spec().cuts === 2 ? R.randomCuts(rng, n) : [];
  }

  // Posición válida más cercana a la pedida al arrastrar el corte i.
  function clampCut(i, g) {
    const n = state.n;
    const c = state.cuts.slice();
    if (spec().cuts === 2) {
      if (i === 0) c[0] = Math.max(0, c[1] - (n - 1), Math.min(g, c[1] - 1));
      else c[1] = Math.min(n, c[0] + (n - 1), Math.max(g, c[0] + 1));
    }
    return c;
  }

  // ---------- Vistas ----------

  const view = createPermutationView($('viz'), {
    label: (key, params) => tOp(key, params),
    duration: () => Math.round(750 / state.speed),
    onCutDrag: (i, g) => {
      const c = clampCut(i, g);
      if (c.join() !== state.cuts.join()) { state.cuts = c; recompute(1); }
    },
  });

  const home = createHome(el.repGrid, { registry, t: (k, p) => t(k, p), lang: () => state.lang });

  // ---------- Problema ----------

  function generate(seed, n) {
    const r = R.mulberry32(seed);
    const p1 = R.randomPermutation(r, n);
    let p2 = R.randomPermutation(r, n);
    while (p2.join() === p1.join()) p2 = R.randomPermutation(r, n);
    Object.assign(state, { seed, n, p1, p2, cuts: randomCuts(r, n) });
  }

  function recompute(step) {
    stop();
    state.result = spec().run(state.p1, state.p2, state.cuts, { variant: state.variant });
    view.setProblem({
      p1: state.p1, p2: state.p2, cuts: state.cuts,
      segment: !!spec().segment,
      aux: state.result.aux || null,
    });
    goTo(step || 0, false);
    syncControls();
  }

  // ---------- Reproductor ----------

  function goTo(i, animate) {
    const steps = state.result.steps;
    state.step = Math.max(0, Math.min(steps.length - 1, i));
    const step = steps[state.step];
    view.show(step, { animate });
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

  // ---------- Cabecera, selector de operadores y leyenda ----------

  const LEGEND = {
    p1: ['sw-p1', 'legendP1'],
    p2: ['sw-p2', 'legendP2'],
    mapped: ['sw-mapped', 'legendMapped'],
    conflict: ['sw-conflict', 'legendConflict'],
    segment: ['sw-segment', 'legendSegment'],
  };

  // Enlace a otro operador de la misma representación con los mismos padres (y cortes, si usa los mismos),
  // para comparar operadores sobre el mismo ejemplo.
  function sameProblemHref(id) {
    const target = G.operators[id] && G.operators[id].spec;
    const q = new URLSearchParams([['op', id], ['lang', state.lang], ['p1', state.p1.join('-')], ['p2', state.p2.join('-')]]);
    if (target && target.cuts === spec().cuts) q.set('c', state.cuts.join('-'));
    q.set('s', String(state.seed));
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
      else if (op.ready) chip.href = sameProblemHref(op.id);
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
  }

  function renderVariants() {
    const vs = spec().variants;
    el.variantField.hidden = !vs;
    el.variantDesc.hidden = !vs;
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
    if (state.view === 'home') {
      document.title = t('homeTitleDoc');
      home.render();
    } else if (state.view === 'op') {
      renderOpHeader();
      view.refreshLabels();
      learn.refresh();
      renderNarration();
    }
    writeHash();
  }

  // ---------- Enrutado ----------

  function showHome() {
    stop();
    state.view = 'home';
    el.opView.hidden = true;
    el.homeView.hidden = false;
  }

  function showOp(id, q) {
    stop();
    const changed = id !== state.opId;
    state.view = 'op';
    state.opId = id;
    state.errKey = null;
    el.homeView.hidden = true;
    el.opView.hidden = false;   // visible antes de dibujar, para medir el ancho disponible

    const vs = impl().spec.variants;
    const v = q.get('v');
    state.variant = vs ? (vs.indexOf(v) !== -1 ? v : impl().spec.defaultVariant) : null;
    if (!learn) {
      learn = createLearnPanel({ content: G.content[id], t: (k, p) => t(k, p), lang: () => state.lang });
      learn.setVariant(state.variant);
    } else learn.setContent(G.content[id], state.variant);

    const seed = parseInt(q.get('s'), 10);
    const p1 = (q.get('p1') || '').split('-').filter(Boolean).map(Number);
    const p2 = (q.get('p2') || '').split('-').filter(Boolean).map(Number);
    const cuts = (q.get('c') || '').split('-').filter((x) => x !== '').map(Number);
    if (p1.length && !impl().validateParents(p1, p2) && validCuts(p1.length, cuts)) {
      Object.assign(state, { p1, p2, cuts, n: p1.length, seed: Number.isFinite(seed) ? Math.abs(seed) % 1000000 : state.seed });
    } else {
      generate(Number.isFinite(seed) ? Math.abs(seed) % 1000000 : R.newSeed(), state.n);
    }
    renderOpHeader();
    recompute(parseInt(q.get('step'), 10) || 0);
    if (changed) window.scrollTo(0, 0);
  }

  function route() {
    const q = new URLSearchParams(location.hash.replace(/^#/, ''));
    if (i18n.languages.indexOf(q.get('lang')) !== -1) state.lang = q.get('lang');
    const id = q.get('op');
    if (id && registry.isReady(id) && G.operators[id] && G.content[id]) showOp(id, q);
    else showHome();
    applyLanguage();
  }

  // Guarda el estado en la URL sin crear entradas de historial (para proyectar o compartir).
  function writeHash() {
    const params = { lang: state.lang };
    if (state.view === 'op') {
      Object.assign(params, {
        op: state.opId,
        v: state.variant || undefined,
        p1: state.p1.join('-'),
        p2: state.p2.join('-'),
        c: state.cuts.join('-'),
        s: String(state.seed),
        step: String(state.step),
      });
    }
    const order = ['op', 'lang', 'v', 'p1', 'p2', 'c', 's', 'step'].filter((k) => params[k] != null);
    const h = new URLSearchParams(order.map((k) => [k, params[k]])).toString();
    if (location.hash.replace(/^#/, '') === h) return;
    try { history.replaceState(null, '', `#${h}`); } catch (err) { /* file:// en algunos navegadores */ }
  }

  // ---------- Controles ----------

  function syncControls() {
    el.len.value = state.n;
    el.lenOut.textContent = state.n;
    el.seed.value = state.seed;
    el.inP1.value = state.p1.join(' ');
    el.inP2.value = state.p2.join(' ');
  }

  el.len.addEventListener('input', () => { el.lenOut.textContent = el.len.value; });
  el.len.addEventListener('change', () => {
    generate(state.seed, Number(el.len.value));
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
  el.btnCuts.addEventListener('click', () => {
    const r = R.mulberry32((Date.now() ^ state.seed) >>> 0);
    let cuts;
    do { cuts = randomCuts(r, state.n); } while (cuts.length && cuts.join() === state.cuts.join());
    state.cuts = cuts;
    recompute(1);
  });

  const parseList = (s) => s.trim().split(/[\s,;]+/).filter(Boolean).map(Number);
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

  el.variant.addEventListener('change', () => {
    state.variant = el.variant.value;
    el.variantDesc.textContent = G.content[state.opId].variants[state.variant].desc[state.lang];
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
  [$('brandLink'), $('backLink')].forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    location.hash = `lang=${state.lang}`;
  }));

  document.addEventListener('keydown', (e) => {
    if (state.view !== 'op') return;
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) return;
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); stop(); next(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    else if (e.key === ' ' && tag !== 'button' && tag !== 'summary' && tag !== 'a') { e.preventDefault(); togglePlay(); }
    else if (e.key === 'Home') { e.preventDefault(); reset(); }
  });

  window.addEventListener('hashchange', route);

  // ---------- Arranque ----------
  route();
})();
