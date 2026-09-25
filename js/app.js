/*
 * Controlador de la página: estado, controles, reproductor, idioma y URL.
 */
(function () {
  'use strict';
  const { rng: R, i18n, operators, createPermutationView, createLearnPanel, content } = window.GAX;
  const { pmx, validateParents, validateCuts } = operators.pmx;

  const $ = (id) => document.getElementById(id);
  const el = {
    len: $('len'), lenOut: $('lenOut'), seed: $('seed'),
    btnRandom: $('btnRandom'), btnCuts: $('btnCuts'),
    manual: $('manual'), manualForm: $('manualForm'), inP1: $('inP1'), inP2: $('inP2'), err: $('err'),
    btnReset: $('btnReset'), btnPrev: $('btnPrev'), btnPlay: $('btnPlay'), btnNext: $('btnNext'),
    counter: $('stepCounter'), barFill: $('barFill'),
    speed: $('speed'), speedOut: $('speedOut'),
    narration: $('narration'), chain: $('chain'),
  };

  const state = {
    lang: 'es', n: 8, seed: 0,
    p1: [], p2: [], c1: 0, c2: 0,
    result: null, step: 0,
    playing: false, speed: 1, errKey: null,
  };
  let timer = null;

  const t = (key, params) => i18n.t(state.lang, key, params);

  const view = createPermutationView(document.getElementById('viz'), {
    label: (key) => t(key),
    duration: () => Math.round(750 / state.speed),
    onCutsChange: (c1, c2) => {
      state.c1 = c1; state.c2 = c2;
      recompute(1);
    },
  });

  const learn = createLearnPanel({
    content: content.pmx,
    t: (key, params) => t(key, params),
    lang: () => state.lang,
  });

  // ---------- Problema ----------

  function generate(seed, n) {
    const r = R.mulberry32(seed);
    const p1 = R.randomPermutation(r, n);
    let p2 = R.randomPermutation(r, n);
    while (p2.join() === p1.join()) p2 = R.randomPermutation(r, n);
    const [c1, c2] = R.randomCuts(r, n);
    Object.assign(state, { seed, n, p1, p2, c1, c2 });
  }

  function recompute(step) {
    stop();
    state.result = pmx(state.p1, state.p2, state.c1, state.c2);
    view.setProblem(state.p1, state.p2, state.c1, state.c2, state.result.pairs);
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
    el.narration.textContent = t(step.text.key, step.text.params);
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

  // ---------- Idioma ----------

  function applyLanguage() {
    document.documentElement.lang = state.lang;
    document.title = t('docTitle');
    document.querySelectorAll('[data-i18n]').forEach((node) => { node.textContent = t(node.dataset.i18n); });
    document.querySelectorAll('[data-i18n-aria]').forEach((node) => node.setAttribute('aria-label', t(node.dataset.i18nAria)));
    document.querySelectorAll('[data-i18n-title]').forEach((node) => {
      node.title = t(node.dataset.i18nTitle);
      node.setAttribute('aria-label', t(node.dataset.i18nTitle));
    });
    document.querySelectorAll('.lang button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === state.lang)));
    el.err.textContent = state.errKey ? t(state.errKey) : '';
    if (state.playing) { el.btnPlay.title = t('pause'); el.btnPlay.setAttribute('aria-label', t('pause')); }
    view.refreshLabels();
    learn.refresh();
    if (state.result) { renderNarration(); writeHash(); }
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
    do { cuts = R.randomCuts(r, state.n); } while (cuts[0] === state.c1 && cuts[1] === state.c2);
    [state.c1, state.c2] = cuts;
    recompute(1);
  });

  const parseList = (s) => s.trim().split(/[\s,;]+/).filter(Boolean).map(Number);
  el.manualForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const p1 = parseList(el.inP1.value);
    const p2 = parseList(el.inP2.value);
    const err = validateParents(p1, p2);
    state.errKey = err;
    el.err.textContent = err ? t(err) : '';
    [el.inP1, el.inP2].forEach((i) => i.setAttribute('aria-invalid', String(!!err)));
    if (err) return;
    const n = p1.length;
    let { c1, c2 } = state;
    if (n !== state.n || !validateCuts(n, c1, c2)) [c1, c2] = R.randomCuts(R.mulberry32(state.seed), n);
    Object.assign(state, { n, p1, p2, c1, c2 });
    recompute(0);
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

  document.addEventListener('keydown', (e) => {
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) return;
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); stop(); next(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    else if (e.key === ' ' && tag !== 'button' && tag !== 'summary') { e.preventDefault(); togglePlay(); }
    else if (e.key === 'Home') { e.preventDefault(); reset(); }
  });

  // ---------- Estado en la URL (para proyectar o compartir un ejemplo) ----------

  function writeHash() {
    const h = new URLSearchParams({
      lang: state.lang,
      p1: state.p1.join('-'),
      p2: state.p2.join('-'),
      c: `${state.c1}-${state.c2}`,
      s: String(state.seed),
      step: String(state.step),
    }).toString();
    try { history.replaceState(null, '', `#${h}`); } catch (err) { /* file:// en algunos navegadores */ }
  }

  function readHash() {
    const q = new URLSearchParams(location.hash.replace(/^#/, ''));
    if (i18n.languages.indexOf(q.get('lang')) !== -1) state.lang = q.get('lang');
    else if ((navigator.language || '').toLowerCase().startsWith('en')) state.lang = 'en';
    const seed = parseInt(q.get('s'), 10);
    state.seed = Number.isFinite(seed) ? Math.abs(seed) % 1000000 : R.newSeed();
    const p1 = (q.get('p1') || '').split('-').filter(Boolean).map(Number);
    const p2 = (q.get('p2') || '').split('-').filter(Boolean).map(Number);
    const c = (q.get('c') || '').split('-').map(Number);
    const step = parseInt(q.get('step'), 10) || 0;
    if (p1.length && !validateParents(p1, p2) && validateCuts(p1.length, c[0], c[1])) {
      Object.assign(state, { p1, p2, n: p1.length, c1: c[0], c2: c[1] });
    } else {
      generate(state.seed, state.n);
    }
    return step;
  }

  // ---------- Arranque ----------
  const initialStep = readHash();
  applyLanguage();
  recompute(initialStep);
})();
