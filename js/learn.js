/*
 * Panel "Para saber más": pestañas de explicación, pseudocódigo/código y referencias.
 * El pseudocódigo resalta las líneas que corresponden al paso actual de la animación.
 */
(function (root) {
  'use strict';

  function createLearnPanel(opts) {
    const content = opts.content;   // contenido del operador (js/content/*.js)
    const t = opts.t;               // (key, params) => texto en el idioma actual
    const lang = opts.lang;         // () => 'es' | 'en'

    const $ = (id) => document.getElementById(id);
    const tabs = Array.from(document.querySelectorAll('.learn [role="tab"]'));
    const panels = tabs.map((tb) => $(tb.getAttribute('aria-controls')));
    const kindButtons = Array.from(document.querySelectorAll('.learn [data-code]'));
    const els = {
      explain: $('explainBody'), code: $('codeBlock'), refs: $('refList'),
      copy: $('btnCopy'), download: $('btnDownload'), status: $('copyStatus'),
      sync: $('syncToggle'), syncWrap: $('syncWrap'), hint: $('codeHint'),
    };

    let kind = 'pseudo';
    let currentLines = [];
    let statusTimer = null;

    // ---------- Pestañas (patrón ARIA: flechas para moverse entre pestañas) ----------
    function selectTab(tab, focus) {
      tabs.forEach((tb, i) => {
        const sel = tb === tab;
        tb.setAttribute('aria-selected', String(sel));
        tb.tabIndex = sel ? 0 : -1;
        panels[i].hidden = !sel;
      });
      if (focus) tab.focus();
    }
    tabs.forEach((tb, i) => {
      tb.addEventListener('click', () => selectTab(tb));
      tb.addEventListener('keydown', (e) => {
        let j = null;
        if (e.key === 'ArrowRight') j = (i + 1) % tabs.length;
        else if (e.key === 'ArrowLeft') j = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') j = 0;
        else if (e.key === 'End') j = tabs.length - 1;
        if (j !== null) { e.preventDefault(); e.stopPropagation(); selectTab(tabs[j], true); }
      });
    });

    // ---------- Explicación ----------
    function renderExplanation() {
      els.explain.replaceChildren(...content.explanation[lang()].map((txt) => {
        const p = document.createElement('p');
        p.textContent = txt;
        return p;
      }));
    }

    // ---------- Pseudocódigo y código ----------
    function appendWithKeywords(parent, text, kws) {
      if (!kws.length) { parent.textContent = text; return; }
      const re = new RegExp(`(?<!\\p{L})(${kws.slice().sort((a, b) => b.length - a.length).join('|')})(?!\\p{L})`, 'gu');
      let last = 0;
      text.replace(re, (m, kw, idx) => {
        if (idx > last) parent.append(text.slice(last, idx));
        const k = document.createElement('span');
        k.className = 'kw';
        k.textContent = kw;
        parent.append(k);
        last = idx + m.length;
        return m;
      });
      if (last < text.length) parent.append(text.slice(last));
    }

    function codeLine(text, isComment) {
      const row = document.createElement('span');
      row.className = 'line' + (isComment ? ' comment' : '');
      if (isComment || !text) { row.textContent = text || ' '; return row; }
      // Comentario al final de la línea (# en Python, // en JavaScript)
      const m = text.match(/^(.*?\S)(\s+)(#|\/\/)(\s.*)$/);
      if (m && !/["']/.test(m[4])) {
        row.append(m[1] + m[2]);
        const c = document.createElement('span');
        c.className = 'comment';
        c.textContent = m[3] + m[4];
        row.append(c);
      } else {
        row.textContent = text;
      }
      return row;
    }

    function renderCode() {
      const l = lang();
      const code = document.createElement('code');
      if (kind === 'pseudo') {
        const kws = content.keywords[l] || [];
        content.pseudocode[l].forEach((line) => {
          const row = document.createElement('span');
          row.className = 'line pseudo';
          row.dataset.line = line.id;
          row.style.setProperty('--indent', line.indent);
          if (line.text.startsWith('//')) {
            row.classList.add('comment');
            row.textContent = line.text;
          } else {
            appendWithKeywords(row, line.text, kws);
          }
          code.append(row);
        });
      } else {
        let inDoc = false;
        content.getCode(kind, l).replace(/\n$/, '').split('\n').forEach((line) => {
          const quotes = (line.match(/"""/g) || []).length;
          const trimmed = line.trim();
          const isComment = inDoc || quotes > 0 || /^(#|\/\/|\/\*\*|\*)/.test(trimmed);
          if (quotes % 2 === 1) inDoc = !inDoc;
          code.append(codeLine(line, isComment));
        });
      }
      els.code.replaceChildren(code);
      els.code.dataset.kind = kind;
      els.syncWrap.hidden = kind !== 'pseudo';
      els.hint.textContent = kind === 'pseudo' ? t('syncHint') : t('codeHint');
      els.download.textContent = `${t('download')} ${filename()}`;
      kindButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.code === kind)));
      applyHighlight();
    }

    function applyHighlight() {
      const on = kind === 'pseudo' && els.sync.checked;
      els.code.querySelectorAll('.line.pseudo').forEach((row) => {
        row.classList.toggle('current', on && currentLines.indexOf(row.dataset.line) !== -1);
      });
    }

    function currentText() {
      return kind === 'pseudo' ? content.getPseudocodeText(lang()) : content.getCode(kind, lang());
    }
    function filename() {
      return kind === 'pseudo' ? t('pseudoFile') : content.codeTemplates[kind].filename;
    }

    function flash(msg) {
      els.status.textContent = msg;
      clearTimeout(statusTimer);
      statusTimer = setTimeout(() => { els.status.textContent = ''; }, 2000);
    }

    function legacyCopy(text) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.append(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      ta.remove();
      return ok;
    }

    kindButtons.forEach((b) => b.addEventListener('click', () => { kind = b.dataset.code; renderCode(); }));
    els.sync.addEventListener('change', applyHighlight);

    els.copy.addEventListener('click', async () => {
      const text = currentText();
      let ok = false;
      try { await navigator.clipboard.writeText(text); ok = true; } catch (e) { ok = legacyCopy(text); }
      flash(ok ? t('copied') : t('copyFail'));
    });

    els.download.addEventListener('click', () => {
      const blob = new Blob([currentText()], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename();
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    });

    // ---------- Referencias ----------
    function renderRefs() {
      const l = lang();
      els.refs.replaceChildren(...content.references.map((r) => {
        const li = document.createElement('li');
        if (r.original) {
          const badge = document.createElement('span');
          badge.className = 'ref-badge';
          badge.textContent = t('refOriginal');
          li.append(badge);
        }
        const cite = document.createElement('p');
        cite.className = 'cite';
        cite.append(`${r.authors} (${r.year}). `);
        const em = (txt) => { const e = document.createElement('em'); e.textContent = txt; return e; };
        const details = r.details[l];
        if (r.type === 'book') {
          cite.append(em(r.title), details.startsWith('(') ? ' ' : '. ', `${details}.`);
        } else if (r.type === 'article') {
          cite.append(`${r.title}. `, em(r.container), `, ${details}.`);
        } else {
          cite.append(`${r.title}. ${l === 'es' ? 'En' : 'In'} `, em(r.container), ` ${details}.`);
        }
        if (r.url) {
          const a = document.createElement('a');
          a.href = r.url;
          a.target = '_blank';
          a.rel = 'noopener';
          a.textContent = r.url.replace(/^https:\/\//, '');
          cite.append(' ', a);
        }
        const note = document.createElement('p');
        note.className = 'ref-note';
        note.textContent = r.note[l];
        li.append(cite, note);
        return li;
      }));
    }

    function refresh() {
      renderExplanation();
      renderCode();
      renderRefs();
    }

    function setStep(step) {
      currentLines = (step && content.stepLines[step.type]) || [];
      applyHighlight();
    }

    refresh();
    return { refresh, setStep };
  }

  (root.GAX = root.GAX || {}).createLearnPanel = createLearnPanel;
})(typeof self !== 'undefined' ? self : this);
