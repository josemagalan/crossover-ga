/*
 * Pantalla «Comparar operadores»: dibuja (HTML, sin D3) los padres, los hijos de cada
 * operador con cada gen coloreado según lo que conserva, y la tabla de métricas.
 * Los datos los calcula js/compare.js; el enrutado y el estado, js/app.js.
 */
(function (root) {
  'use strict';

  const LEGENDS = {
    permutation: [['p1', 'cmpLegendPosP1'], ['p2', 'cmpLegendPosP2'], ['moved', 'cmpLegendMoved'], ['moved dup', 'cmpLegendDup']],
    binary: [['p1', 'cmpLegendFromP1'], ['p2', 'cmpLegendFromP2'], ['same', 'cmpLegendSame']],
    real: [['p1', 'cmpLegendCopyP1'], ['p2', 'cmpLegendCopyP2'], ['inside', 'cmpLegendInside'], ['outside', 'cmpLegendOutside']],
  };

  function node(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function createCompareView(el, opts) {
    const { t, metrics } = opts;   // metrics: GAX.compare.METRICS
    let model = null;

    // Fila de genes: etiqueta + una casilla por posición (misma rejilla en todas las filas).
    function geneRow(label, values, classes) {
      const row = node('div', 'cmp-row');
      row.append(node('span', 'cmp-row-label', label));
      values.forEach((v, i) => {
        const c = classes[i];
        const chip = node('span', `cmp-gene ${c.cls}${c.dup ? ' dup' : ''}`, String(opts.format(v)));
        row.append(chip);
      });
      return row;
    }

    function indexRow(n) {
      const row = node('div', 'cmp-row cmp-idx');
      row.setAttribute('aria-hidden', 'true');
      row.append(node('span', 'cmp-row-label'));
      for (let i = 1; i <= n; i++) row.append(node('span', 'cmp-idx-num', String(i)));
      return row;
    }

    function grid(rows) {
      const g = node('div', 'cmp-grid');
      g.style.setProperty('--n', String(model.n));
      g.dataset.rep = model.rep;
      g.append(...rows);
      const scroll = node('div', 'cmp-scroll');
      scroll.append(g);
      return scroll;
    }

    function renderParents() {
      const { p1, p2, n } = model;
      const all = (cls) => Array.from({ length: n }, () => ({ cls, dup: false }));
      el.parents.replaceChildren(grid([
        indexRow(n),
        geneRow(t('parent1Short'), p1, all('p1')),
        geneRow(t('parent2Short'), p2, all('p2')),
      ]));
    }

    function renderChildren() {
      el.children.replaceChildren(...model.rows.map((r) => {
        const box = node('div', `cmp-op${r.id === model.from ? ' from' : ''}`);
        const head = node('div', 'cmp-op-head');
        const a = node('a', 'cmp-op-name', opts.opName(r.id));
        a.href = opts.opHref(r);
        head.append(a);
        const metaText = opts.opMeta(r);
        if (metaText) head.append(node('span', 'cmp-op-meta', metaText));
        box.append(head, grid([
          geneRow(t('child1Short'), r.children[0], r.genes[0]),
          geneRow(t('child2Short'), r.children[1], r.genes[1]),
        ]));
        return box;
      }));

      el.legend.replaceChildren(...LEGENDS[model.rep].map(([cls, key]) => {
        const li = node('li');
        li.append(node('span', `cmp-gene cmp-sw ${cls}`), node('span', null, t(key)));
        return li;
      }));
    }

    // Escala de las barras: los porcentajes van de 0 a 1; los números, hasta el mayor de la tabla.
    function scaleOf(m) {
      if (m.kind === 'pct') return 1;
      let max = m.id === 'distance' ? 0.5 : 1;
      model.rows.forEach((r) => {
        max = Math.max(max, r.example[m.id], r.mean ? r.mean[m.id] : 0);
      });
      return max;
    }

    function renderTable() {
      const ms = metrics[model.rep];
      el.tableNote.textContent = t('compareTableNote', { n: model.reps });

      const thead = node('thead');
      const hr = node('tr');
      const th0 = node('th', null, t('compareOperatorCol'));
      th0.scope = 'col';
      hr.append(th0);
      ms.forEach((m) => {
        const th = node('th', null, t(`metric_${m.id}`));
        th.scope = 'col';
        hr.append(th);
      });
      thead.append(hr);

      const tbody = node('tbody');
      const scales = ms.map(scaleOf);
      model.rows.forEach((r) => {
        const tr = node('tr', r.id === model.from ? 'from' : null);
        const th = node('th');
        th.scope = 'row';
        const a = node('a', null, opts.opName(r.id));
        a.href = opts.opHref(r);
        th.append(a);
        tr.append(th);
        ms.forEach((m, k) => {
          const td = node('td');
          const cell = node('div', 'cmp-cell');
          const nums = node('div', 'cmp-nums');
          const val = node('span', 'cmp-val', r.mean ? opts.value(m, r.mean[m.id]) : t('comparePending'));
          nums.append(val, node('span', 'cmp-ex', `(${opts.value(m, r.example[m.id])})`));
          const bar = node('div', 'cmp-bar');
          bar.setAttribute('aria-hidden', 'true');
          const pct = (v) => `${Math.max(0, Math.min(100, (100 * v) / (scales[k] || 1)))}%`;
          const fill = node('span', 'cmp-fill');
          fill.style.width = r.mean ? pct(r.mean[m.id]) : '0%';
          const tick = node('span', 'cmp-tick');
          tick.style.left = pct(r.example[m.id]);
          bar.append(fill, tick);
          cell.append(nums, bar);
          td.append(cell);
          tr.append(td);
        });
        tbody.append(tr);
      });
      el.table.replaceChildren(thead, tbody);

      el.defs.replaceChildren(...ms.flatMap((m) => [node('dt', null, t(`metric_${m.id}`)), node('dd', null, t(`metricDesc_${m.id}`))]));
      el.refs.textContent = t(`compareRefs_${model.rep}`);
    }

    return {
      render(m) {
        model = m;
        renderParents();
        renderChildren();
        renderTable();
      },
      /** Rellena las medias cuando terminan de calcularse (sin redibujar los hijos). */
      setRows(rows) {
        model.rows = rows;
        renderTable();
      },
    };
  }

  (root.GAX = root.GAX || {}).createCompareView = createCompareView;
})(typeof self !== 'undefined' ? self : this);
