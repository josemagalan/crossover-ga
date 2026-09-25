/*
 * Vista D3 para operadores de cruce sobre permutaciones.
 * Dibuja padres, hijos, segmento, cortes arrastrables y, si el operador lo pide,
 * un panel auxiliar entre padres e hijos (p. ej. la tabla de correspondencias de PMX).
 * Anima cada paso de la traza que produce el operador.
 */
(function (root) {
  'use strict';
  const d3 = root.d3;
  const W_WIDE = 1000;
  const CELL_MAX = 72;

  // Paneles auxiliares: cada operador puede declarar uno (spec.aux) y la traza
  // indica en cada paso si se ve (auxVisible) y qué elementos resalta (auxActive).
  const AUX = {
    pairs: {
      caption: 'mappingTable',
      draw(g, geo, items) {
        const arrowW = 22;
        const m = items.length;
        const avail = geo.cell * geo.n;
        // Reduce las fichas si el segmento es largo para que la tabla quepa en una fila.
        const sq = Math.max(16, Math.min(geo.auxSq, (avail - (m - 1) * 6 - m * arrowW) / (2 * m)));
        const chipW = sq * 2 + arrowW;
        const gap = Math.max(6, Math.min(22, (avail - m * chipW) / Math.max(1, m - 1)));
        const total = m * chipW + (m - 1) * gap;
        const start = geo.x0 + (avail - total) / 2;
        const chips = g.selectAll('g.pair')
          .data(items.map((p, k) => Object.assign({ k }, p)), (d) => d.k)
          .join((enter) => {
            const c = enter.append('g').attr('class', 'pair');
            c.append('rect').attr('class', 'pair-bg');
            c.append('rect').attr('class', 'pair-a');
            c.append('text').attr('class', 'pair-a-num ink-p1');
            c.append('text').attr('class', 'pair-arrow').text('↔');
            c.append('rect').attr('class', 'pair-b');
            c.append('text').attr('class', 'pair-b-num ink-p2');
            return c;
          });
        chips.attr('transform', (d) => `translate(${start + d.k * (chipW + gap)},${geo.yAux})`);
        chips.select('.pair-bg').attr('x', -5).attr('y', -5).attr('width', chipW + 10).attr('height', sq + 10).attr('rx', 8);
        chips.select('.pair-a').attr('width', sq).attr('height', sq).attr('rx', 5).style('fill', 'var(--p1)');
        chips.select('.pair-b').attr('x', sq + arrowW).attr('width', sq).attr('height', sq).attr('rx', 5).style('fill', 'var(--p2)');
        const fs = `${Math.round(sq * 0.5)}px`;
        chips.select('.pair-a-num').attr('x', sq / 2).attr('y', sq / 2).attr('dy', '0.36em').style('font-size', fs).text((d) => d.a);
        chips.select('.pair-b-num').attr('x', sq * 1.5 + arrowW).attr('y', sq / 2).attr('dy', '0.36em').style('font-size', fs).text((d) => d.b);
        chips.select('.pair-arrow').attr('x', sq + arrowW / 2).attr('y', sq / 2).attr('dy', '0.36em').style('font-size', fs);
      },
      show(g, step, items) {
        const act = step.auxActive || [];
        g.selectAll('g.pair')
          .classed('active', (d) => act.indexOf(d.k) !== -1 && act.length < items.length)
          .classed('dim', (d) => act.length > 0 && act.indexOf(d.k) === -1);
      },
    },

    // Representación binaria: máscara de cruce, una celda bajo cada columna de genes.
    mask: {
      caption: 'maskCaption',
      draw() {},
      show(g, step, items, geo) {
        const shown = new Set(step.maskShown || []);
        const act = step.auxActive || [];
        const h = geo.auxSq;
        const cells = g.selectAll('g.mcell')
          .data(items.map((bit, i) => ({ bit, i })), (d) => d.i)
          .join((enter) => {
            const c = enter.append('g').attr('class', 'mcell');
            c.append('rect').attr('class', 'mcell-rect');
            c.append('text').attr('class', 'mcell-bit');
            return c;
          });
        const x = (i) => geo.x0 + i * geo.cell + (geo.cell - geo.s) / 2;
        cells.attr('transform', (d) => `translate(${x(d.i)},${geo.yAux})`)
          .classed('shown', (d) => shown.has(d.i))
          .classed('one', (d) => d.bit === 1)
          .classed('active', (d) => act.indexOf(d.i) !== -1 && act.length < items.length);
        cells.select('.mcell-rect').attr('width', geo.s).attr('height', h).attr('rx', 5);
        cells.select('.mcell-bit').attr('x', geo.s / 2).attr('y', h / 2).attr('dy', '0.36em')
          .style('font-size', `${Math.round(h * 0.55)}px`)
          .text((d) => (shown.has(d.i) ? d.bit : '?'));
      },
    },

    // Representación real (cruce aritmético): en cada columna, una escala vertical común con los
    // valores de los padres, el segmento que los une y los hijos a medida que se calculan.
    lerp: {
      caption: 'lerpCaption',
      captionShort: 'lerpCaptionShort',   // en pantallas estrechas
      height: (geo) => Math.round(Math.max(96, Math.min(150, geo.s * 1.9))),
      draw() {},
      show(g, step, items, geo, label, fmt) {
        const h = geo.auxH;
        const all = items.p1.concat(items.p2);
        let lo = Math.floor(Math.min.apply(null, all));
        let hi = Math.ceil(Math.max.apply(null, all));
        if (hi - lo < 1) hi = lo + 1;
        const pad = 9;
        const y = (v) => geo.yAux + pad + (h - 2 * pad) * (1 - (v - lo) / (hi - lo));
        const cx = (i) => geo.x0 + i * geo.cell + geo.cell / 2;
        const xL = geo.x0 + (geo.cell - geo.s) / 2;
        const xR = geo.x0 + geo.cell * geo.n - (geo.cell - geo.s) / 2;
        const r = Math.max(4, Math.min(7, geo.s * 0.1));
        const act = step.auxActive || [];

        // Marco con los valores mínimo y máximo de la escala
        const frame = [{ k: 'hi', v: hi }, { k: 'lo', v: lo }];
        g.selectAll('line.lerp-grid').data(frame, (d) => d.k).join('line')
          .attr('class', 'lerp-grid')
          .attr('x1', xL).attr('x2', xR).attr('y1', (d) => y(d.v)).attr('y2', (d) => y(d.v));
        g.selectAll('text.lerp-tick').data(frame, (d) => d.k).join('text')
          .attr('class', 'lerp-tick')
          .attr('x', xL - 6).attr('y', (d) => y(d.v)).attr('dy', '0.35em')
          .text((d) => fmt(d.v));

        const cols = items.p1.map((a, i) => {
          const c1 = step.children[0][i];
          const c2 = step.children[1][i];
          return { i, a, b: items.p2[i], c1: c1 ? c1.v : null, c2: c2 ? c2.v : null, w1: c1 ? c1.w : 0.5, w2: c2 ? c2.w : 0.5 };
        });
        const groups = g.selectAll('g.lerp-col').data(cols, (d) => d.i)
          .join((enter) => {
            const c = enter.append('g').attr('class', 'lerp-col');
            c.append('line').attr('class', 'lerp-seg');
            c.append('circle').attr('class', 'lerp-p lerp-p1');
            c.append('circle').attr('class', 'lerp-p lerp-p2');
            c.append('rect').attr('class', 'lerp-c lerp-c2');
            c.append('rect').attr('class', 'lerp-c lerp-c1');
            return c;
          });
        groups.classed('active', (d) => act.indexOf(d.i) !== -1 && act.length < cols.length)
          .classed('dim', (d) => act.length > 0 && act.length < cols.length && act.indexOf(d.i) === -1);
        groups.select('.lerp-seg').attr('x1', (d) => cx(d.i)).attr('x2', (d) => cx(d.i))
          .attr('y1', (d) => y(d.a)).attr('y2', (d) => y(d.b));
        groups.select('.lerp-p1').attr('cx', (d) => cx(d.i)).attr('cy', (d) => y(d.a)).attr('r', r);
        groups.select('.lerp-p2').attr('cx', (d) => cx(d.i)).attr('cy', (d) => y(d.b)).attr('r', r);
        // Hijos: rombos a los lados de la línea (Hijo 1 a la izquierda, Hijo 2 a la derecha)
        const q = r * 1.25;
        const place = (sel, key, dx) => sel
          .attr('width', q * 1.4).attr('height', q * 1.4)
          .attr('x', (d) => cx(d.i) + dx - q * 0.7).attr('y', (d) => (d[key] == null ? 0 : y(d[key]) - q * 0.7))
          .attr('transform', (d) => `rotate(45 ${cx(d.i) + dx} ${d[key] == null ? 0 : y(d[key])})`)
          .classed('shown', (d) => d[key] != null)
          // mismo color que el gen del hijo, que mezcla los de los padres según su peso
          .style('fill', (d) => `color-mix(in srgb, var(--p1) ${Math.round(100 * (key === 'c1' ? d.w1 : d.w2))}%, var(--p2))`);
        place(groups.select('.lerp-c1'), 'c1', -r * 1.9);
        place(groups.select('.lerp-c2'), 'c2', r * 1.9);
      },
    },

    // CX: ciclos encontrados hasta ahora, con el padre del que los toma el Hijo 1.
    cycles: {
      caption: 'cycleList',
      draw() {},
      show(g, step, items, geo, label) {
        const cycles = step.auxCycles || [];
        const h = geo.auxSq;
        const fs = Math.round(h * 0.46);
        const charW = fs * 0.62;
        const data = cycles.map((c, k) => {
          const text = `${label('cycleShort', { k: k + 1 })} · ${c.positions.map((i) => i + 1).join(' → ')}`;
          return { k, src: c.src, text, w: Math.round(text.length * charW + 24) };
        });
        const gap = 12;
        const total = data.reduce((a, d) => a + d.w, 0) + gap * Math.max(0, data.length - 1);
        let x = geo.x0 + (geo.cell * geo.n - total) / 2;
        data.forEach((d) => { d.x = x; x += d.w + gap; });
        const act = step.auxActive || [];
        const groups = g.selectAll('g.cycle')
          .data(data, (d) => d.k)
          .join((enter) => {
            const c = enter.append('g').attr('class', 'cycle');
            c.append('rect').attr('class', 'cycle-rect');
            c.append('text').attr('class', 'cycle-text');
            return c;
          });
        groups.attr('transform', (d) => `translate(${d.x},${geo.yAux})`)
          .classed('active', (d) => act.indexOf(d.k) !== -1);
        groups.select('.cycle-rect').attr('width', (d) => d.w).attr('height', h).attr('rx', h / 2)
          .style('fill', (d) => `var(--${d.src})`);
        groups.select('.cycle-text').attr('class', (d) => `cycle-text ink-${d.src}`)
          .attr('x', (d) => d.w / 2).attr('y', h / 2).attr('dy', '0.36em').style('font-size', `${fs}px`)
          .text((d) => d.text);
      },
    },

    // Contraejemplo: genes que faltan en cada hijo.
    missing: {
      caption: 'missingList',
      draw() {},
      show(g, step, items, geo, label) {
        const h = geo.auxSq;
        const fs = Math.round(h * 0.46);
        const charW = fs * 0.6;
        const data = items.map((it, k) => {
          const text = label('missingPill', { child: k + 1, list: it.missing.join(', ') });
          return { k, text, w: Math.round(text.length * charW + 28) };
        }).filter((d, k) => items[k].missing.length);
        const gap = 14;
        const total = data.reduce((a, d) => a + d.w, 0) + gap * Math.max(0, data.length - 1);
        let x = geo.x0 + (geo.cell * geo.n - total) / 2;
        data.forEach((d) => { d.x = x; x += d.w + gap; });
        const pills = g.selectAll('g.miss')
          .data(data, (d) => d.k)
          .join((enter) => {
            const c = enter.append('g').attr('class', 'miss');
            c.append('rect').attr('class', 'miss-rect');
            c.append('text').attr('class', 'miss-text');
            return c;
          });
        pills.attr('transform', (d) => `translate(${d.x},${geo.yAux})`);
        pills.select('.miss-rect').attr('width', (d) => d.w).attr('height', h).attr('rx', h / 2);
        pills.select('.miss-text').attr('x', (d) => d.w / 2).attr('y', h / 2).attr('dy', '0.36em').style('font-size', `${fs}px`).text((d) => d.text);
      },
    },

    // OX: lista ordenada de los genes que faltan en el hijo que se está construyendo.
    order: {
      caption: 'orderList',
      captionParams: (step) => ({ child: (step.auxChild || 0) + 1 }),
      draw() {},
      show(g, step, items, geo) {
        const it = items[step.auxChild || 0];
        const m = it.list.length;
        const avail = geo.cell * geo.n;
        const sq = Math.max(18, Math.min(geo.auxSq + 4, (avail - (m - 1) * 8) / m));
        const gap = Math.max(6, Math.min(14, (avail - m * sq) / Math.max(1, m - 1)));
        const start = geo.x0 + (avail - (m * sq + (m - 1) * gap)) / 2;
        const act = step.auxActive || [];
        const placed = step.auxPlaced || 0;
        const chips = g.selectAll('g.ochip')
          .data(it.list.map((v, j) => ({ v, j, donor: it.donor, key: `${step.auxChild}-${j}-${v}` })), (d) => d.key)
          .join((enter) => {
            const c = enter.append('g').attr('class', 'ochip');
            c.append('rect').attr('class', 'ochip-rect');
            c.append('text').attr('class', 'ochip-num');
            c.append('text').attr('class', 'ochip-idx');
            return c;
          });
        chips.attr('transform', (d) => `translate(${start + d.j * (sq + gap)},${geo.yAux})`)
          .classed('active', (d) => act.indexOf(d.j) !== -1)
          .classed('placed', (d) => d.j < placed && act.indexOf(d.j) === -1);
        chips.select('.ochip-rect').attr('width', sq).attr('height', sq).attr('rx', 5).style('fill', (d) => `var(--${d.donor})`);
        chips.select('.ochip-num').attr('class', (d) => `ochip-num ink-${d.donor}`)
          .attr('x', sq / 2).attr('y', sq / 2).attr('dy', '0.36em').style('font-size', `${Math.round(sq * 0.5)}px`).text((d) => d.v);
        chips.select('.ochip-idx').attr('x', sq / 2).attr('y', sq + 13).text((d) => `#${d.j + 1}`);
      },
    },
  };

  function createPermutationView(svgEl, opts) {
    const svg = d3.select(svgEl);
    const label = opts.label;                 // (key, params) => texto traducido
    const fmt = opts.format || ((v) => v);   // valor de un gen => texto (decimales según el idioma)
    const duration = opts.duration;           // () => ms de animación
    const onCutDrag = opts.onCutDrag;         // (índice del corte, hueco deseado) => void

    let geo = null;
    let problem = null;   // { p1, p2, cuts: [..], segment: bool, aux: { type, items } | null }
    let current = null;

    // Patrones rayados para los genes obtenidos por correspondencia
    const defs = svg.append('defs');
    ['p1', 'p2'].forEach((o) => {
      const pat = defs.append('pattern')
        .attr('id', `hatch-${o}`)
        .attr('patternUnits', 'userSpaceOnUse')
        .attr('width', 9).attr('height', 9)
        .attr('patternTransform', 'rotate(45)');
      pat.append('rect').attr('width', 9).attr('height', 9).style('fill', `var(--${o})`);
      pat.append('rect').attr('width', 4).attr('height', 9).attr('class', 'hatch-stripe');
    });

    defs.append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 0 10 10').attr('refX', 8).attr('refY', 5)
      .attr('markerWidth', 7).attr('markerHeight', 7).attr('orient', 'auto-start-reverse')
      .append('path').attr('d', 'M0,0 L10,5 L0,10 z').attr('class', 'link-head');

    const gBands = svg.append('g').attr('class', 'bands');
    const gLabels = svg.append('g').attr('class', 'labels');
    const gIdx = svg.append('g').attr('class', 'indices');
    const gCutLines = svg.append('g').attr('class', 'cut-lines');
    const gSlots = svg.append('g').attr('class', 'slots');
    const gSlotNums = svg.append('g').attr('class', 'slot-nums');
    const gParents = svg.append('g').attr('class', 'parents');
    const gChildren = svg.append('g').attr('class', 'children');
    const gAux = svg.append('g').attr('class', 'aux');
    const gLinks = svg.append('g').attr('class', 'links');
    const gGhost = svg.append('g').attr('class', 'ghosts');
    const gHandles = svg.append('g').attr('class', 'handles');

    function layout(n, auxType, linkSpace) {
      const hasAux = !!auxType;
      const compact = svgEl.clientWidth > 0 && svgEl.clientWidth < 640;
      const left = compact ? 44 : 128;
      const right = compact ? 8 : 16;
      // En pantallas estrechas el lienzo se ajusta a los genes para que se vean más grandes.
      const W = compact ? left + right + n * CELL_MAX : W_WIDE;
      const avail = W - left - right;
      const cell = Math.min(CELL_MAX, avail / n);
      const s = Math.round(cell * 0.84);
      const x0 = left + (avail - cell * n) / 2;
      const yHandle = 14;
      const yIdx = 44;
      const gap = 14;
      const yP1 = 58;
      const yP2 = yP1 + s + (linkSpace ? Math.max(40, Math.round(s * 0.7)) : gap);
      const yAux = yP2 + s + 52;
      const auxSq = Math.round(Math.min(34, s * 0.62));
      const auxH = hasAux && AUX[auxType].height ? AUX[auxType].height({ s }) : auxSq;
      const yC1 = hasAux ? yAux + auxH + 36 : yP2 + s + 44;
      const yC2 = yC1 + s + gap;
      const H = yC2 + s + 18;
      return { W, n, compact, left, cell, s, x0, yHandle, yIdx, yAux, auxSq, auxH, H, rowY: { p1: yP1, p2: yP2, c1: yC1, c2: yC2 } };
    }

    const geneX = (i) => geo.x0 + i * geo.cell + (geo.cell - geo.s) / 2;
    const gapX = (g) => geo.x0 + g * geo.cell;

    // Dibuja el aspecto de un gen dentro de un <g> (usado por genes, hijos y "fantasmas").
    function paintGene(g, d) {
      const s = geo.s;
      g.selectAll('*').remove();
      const mapped = d.kind === 'mapped';
      const blend = d.kind === 'blend';   // gen combinado (cruce aritmético): w = parte del Padre 1
      const fillOf = () => {
        if (mapped) return `url(#hatch-${d.origin})`;
        if (blend) return `color-mix(in srgb, var(--p1) ${Math.round(d.w * 100)}%, var(--p2))`;
        return `var(--${d.origin})`;
      };
      g.append('rect')
        .attr('class', 'gene-rect')
        .attr('width', s).attr('height', s)
        .attr('rx', Math.max(4, s * 0.14))
        .style('fill', fillOf());
      const txt = String(fmt(d.v));
      // Los valores largos (reales con decimales) se escriben más pequeños para que quepan.
      const fs = Math.min(s * 0.44, (s * 0.9) / (txt.length * 0.58));
      g.append('text')
        .attr('class', mapped || blend ? 'gene-num gene-num-halo' : `gene-num ink-${d.origin}`)
        .attr('x', s / 2).attr('y', s / 2)
        .attr('dy', '0.36em')
        .style('font-size', `${Math.round(fs)}px`)
        .text(txt);
      if (mapped) {
        const r = Math.max(7, s * 0.15);
        const b = g.append('g').attr('class', 'badge').attr('transform', `translate(${s - r * 0.55},${r * 0.55})`);
        b.append('circle').attr('r', r);
        b.append('text').attr('dy', '0.35em').style('font-size', `${Math.round(r * 1.3)}px`).text('↺');
      }
    }

    function setProblem(np) {
      const sizeChanged = !geo || geo.n !== np.p1.length;
      const auxChanged = !problem || (problem.aux && problem.aux.type) !== (np.aux && np.aux.type);
      problem = np;
      geo = layout(np.p1.length, np.aux && np.aux.type, !!np.links);
      svg.attr('viewBox', `0 0 ${geo.W} ${geo.H}`);
      if (sizeChanged) {
        gParents.selectAll('*').remove();
        gChildren.selectAll('*').remove();
        gSlots.selectAll('*').remove();
      }
      if (auxChanged) gAux.selectAll('*').remove();
      drawLabels();
      drawIndices();
      drawParents();
      drawSlots();
      drawCuts();
      if (np.aux) AUX[np.aux.type].draw(gAux, geo, np.aux.items);
    }

    function drawLabels() {
      const short = geo.compact ? 'Short' : '';
      const rows = [
        { key: 'parent1', row: 'p1' }, { key: 'parent2', row: 'p2' },
        { key: 'child1', row: 'c1' }, { key: 'child2', row: 'c2' },
      ];
      gLabels.selectAll('text.row-label')
        .data(rows, (d) => d.key)
        .join('text')
        .attr('class', (d) => `row-label lbl-${d.row}`)
        .attr('x', geo.left - (geo.compact ? 10 : 18))
        .attr('y', (d) => geo.rowY[d.row] + geo.s / 2)
        .attr('dy', '0.35em')
        .text((d) => label(d.key + short));
      gLabels.selectAll('text.aux-caption')
        .data(problem.aux ? [(geo.compact && AUX[problem.aux.type].captionShort) || AUX[problem.aux.type].caption] : [])
        .join('text')
        .attr('class', 'aux-caption')
        .classed('visible', !!(current && current.auxVisible))
        .attr('x', geo.x0 + (geo.cell * geo.n) / 2)
        .attr('y', geo.yAux - 16)
        .text((key) => label(key, current && AUX[problem.aux.type].captionParams ? AUX[problem.aux.type].captionParams(current) : undefined));
    }

    function drawIndices() {
      gIdx.selectAll('text')
        .data(d3.range(geo.n))
        .join('text')
        .attr('class', 'idx')
        .attr('x', (i) => geneX(i) + geo.s / 2)
        .attr('y', geo.yIdx)
        .text((i) => i + 1);
    }

    function drawParents() {
      const data = [];
      problem.p1.forEach((v, pos) => data.push({ row: 'p1', pos, v, origin: 'p1', kind: 'parent' }));
      problem.p2.forEach((v, pos) => data.push({ row: 'p2', pos, v, origin: 'p2', kind: 'parent' }));
      gParents.selectAll('g.gene')
        .data(data, (d) => `${d.row}-${d.pos}`)
        .join('g')
        .attr('class', 'gene')
        .attr('transform', (d) => `translate(${geneX(d.pos)},${geo.rowY[d.row]})`)
        .each(function (d) { paintGene(d3.select(this), d); });
    }

    function drawSlots() {
      const data = [];
      ['c1', 'c2'].forEach((row) => d3.range(geo.n).forEach((pos) => data.push({ row, pos })));
      gSlots.selectAll('rect.slot')
        .data(data, (d) => `${d.row}-${d.pos}`)
        .join('rect')
        .attr('class', 'slot')
        .attr('x', (d) => geneX(d.pos))
        .attr('y', (d) => geo.rowY[d.row])
        .attr('width', geo.s).attr('height', geo.s)
        .attr('rx', Math.max(4, geo.s * 0.14));
    }

    function drawCuts() {
      const cuts = problem.cuts;
      const pad = 10;
      const bands = [
        { id: 'parents', y0: geo.rowY.p1 - pad, y1: geo.rowY.p2 + geo.s + pad },
        { id: 'children', y0: geo.rowY.c1 - pad, y1: geo.rowY.c2 + geo.s + pad },
      ];
      // Tramos sombreados: los que indique el operador o, si no, el segmento entre dos cortes.
      const ranges = problem.bands || (problem.segment && cuts.length === 2 ? [[cuts[0], cuts[1]]] : []);
      const bandData = [];
      ranges.forEach((r, k) => bands.forEach((b) => bandData.push({ id: `${b.id}-${k}`, y0: b.y0, y1: b.y1, from: r[0], to: r[1] })));
      gBands.selectAll('rect.band')
        .data(bandData, (d) => d.id)
        .join('rect')
        .attr('class', 'band')
        .attr('x', (d) => gapX(d.from))
        .attr('width', (d) => gapX(d.to) - gapX(d.from))
        .attr('y', (d) => d.y0)
        .attr('height', (d) => d.y1 - d.y0)
        .attr('rx', 10);

      const lines = [];
      cuts.forEach((_, h) => bands.forEach((b) => lines.push({ h, b })));
      gCutLines.selectAll('line.cut')
        .data(lines, (d) => `${d.h}-${d.b.id}`)
        .join('line')
        .attr('class', 'cut')
        .attr('x1', (d) => gapX(cuts[d.h])).attr('x2', (d) => gapX(cuts[d.h]))
        .attr('y1', (d) => d.b.y0).attr('y2', (d) => d.b.y1);

      const handles = gHandles.selectAll('g.handle')
        .data(cuts.map((_, i) => i), (d) => d)
        .join((enter) => {
          const g = enter.append('g')
            .attr('class', 'handle')
            .attr('tabindex', 0)
            .attr('role', 'slider');
          g.append('rect').attr('class', 'handle-hit');
          g.append('line').attr('class', 'handle-stem');
          g.append('path').attr('class', 'handle-diamond').attr('d', 'M0,-10 L10,0 L0,10 L-10,0 Z');
          g.call(dragBehavior);
          g.on('keydown', onHandleKey);
          return g;
        });
      handles
        .attr('transform', (d) => `translate(${gapX(cuts[d])},${geo.yHandle})`)
        .attr('aria-label', (d) => `${label('cutLabel')} ${d + 1}`)
        .attr('aria-valuenow', (d) => cuts[d]);
      handles.select('.handle-hit')
        .attr('x', -18).attr('y', -geo.yHandle)
        .attr('width', 36).attr('height', geo.rowY.p2 + geo.s + 12);
      handles.select('.handle-stem').attr('y1', 10).attr('y2', geo.rowY.p1 - 10 - geo.yHandle);
    }

    // Se crea una sola vez: redibujar no interrumpe un arrastre en curso.
    const dragBehavior = d3.drag()
      .container(svgEl)
      .subject((event) => ({ x: event.x, y: event.y }))
      .on('start', function () { d3.select(this).classed('dragging', true); })
      .on('drag', function (event, h) {
        onCutDrag(h, Math.round((event.x - geo.x0) / geo.cell));
      })
      .on('end', function () { d3.select(this).classed('dragging', false); });

    function onHandleKey(event, h) {
      const delta = event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0;
      if (!delta) return;
      event.preventDefault();
      event.stopPropagation();
      onCutDrag(h, problem.cuts[h] + delta);
    }

    const has = (obj, row, pos) => !!(obj && obj[row] && obj[row].indexOf(pos) !== -1);

    function show(step, { animate } = {}) {
      current = step;
      const dur = animate ? duration() : 0;

      gGhost.selectAll('*').interrupt().remove();
      gChildren.selectAll('g.gene').interrupt().style('opacity', null);

      // Segmento y cortes
      gBands.selectAll('rect.band').classed('visible', step.segmentVisible);
      gCutLines.selectAll('line.cut').classed('faint', !step.segmentVisible);

      // Padres: resaltar / atenuar
      ['p1', 'p2'].forEach((row) => {
        const hl = step.highlight[row];
        gParents.selectAll('g.gene').filter((d) => d.row === row)
          .classed('active', (d) => has(step.highlight, row, d.pos))
          .classed('dim', (d) => !!(hl && hl.length) && !has(step.highlight, row, d.pos));
      });

      // Huecos de los hijos
      gSlots.selectAll('rect.slot').classed('focus', (d) => has(step.slot, d.row, d.pos));

      // Hijos
      const data = [];
      ['c1', 'c2'].forEach((row, k) => step.children[k].forEach((g, pos) => {
        if (g) data.push(Object.assign({ row, pos }, g));
      }));
      const flyTargets = new Set(step.fly.map((f) => `${f.to[0]}-${f.to[1]}`));
      const genes = gChildren.selectAll('g.gene')
        .data(data, (d) => `${d.row}-${d.pos}`)
        .join('g')
        .attr('class', 'gene')
        .attr('transform', (d) => `translate(${geneX(d.pos)},${geo.rowY[d.row]})`)
        .each(function (d) { paintGene(d3.select(this), d); })
        .classed('active', (d) => has(step.highlight, d.row, d.pos))
        .classed('conflict', (d) => has(step.conflict, d.row, d.pos));

      // Flechas entre padres: dónde está el mismo gen en el otro padre (CX)
      const linkPath = (l) => {
        const [r1, i1] = l.from;
        const [r2, i2] = l.to;
        const x1 = geneX(i1) + geo.s / 2;
        const x2 = geneX(i2) + geo.s / 2;
        const down = geo.rowY[r1] < geo.rowY[r2];
        const y1 = down ? geo.rowY[r1] + geo.s : geo.rowY[r1];
        const y2 = down ? geo.rowY[r2] - 4 : geo.rowY[r2] + geo.s + 4;
        const mid = (y1 + y2) / 2;
        return `M${x1},${y1} C${x1},${mid} ${x2},${mid} ${x2},${y2}`;
      };
      gLinks.selectAll('path.link')
        .data(step.links || [], (l) => `${l.from.join()}-${l.to.join()}`)
        .join('path')
        .attr('class', 'link')
        .attr('marker-end', 'url(#arrowhead)')
        .attr('d', linkPath);

      // Orden de relleno de los huecos (números dentro de los huecos todavía vacíos)
      const nums = [];
      Object.keys(step.slotOrder || {}).forEach((row) => {
        const k = row === 'c1' ? 0 : 1;
        step.slotOrder[row].forEach((pos, j) => { if (!step.children[k][pos]) nums.push({ row, pos, j }); });
      });
      gSlotNums.selectAll('text.slot-num')
        .data(nums, (d) => `${d.row}-${d.pos}`)
        .join('text')
        .attr('class', 'slot-num')
        .attr('x', (d) => geneX(d.pos) + geo.s / 2)
        .attr('y', (d) => geo.rowY[d.row] + geo.s - Math.max(6, geo.s * 0.14))
        .style('font-size', `${Math.max(10, Math.round(geo.s * 0.22))}px`)
        .text((d) => `#${d.j + 1}`);

      // Panel auxiliar del operador
      gAux.classed('visible', !!step.auxVisible);
      const caption = gLabels.selectAll('text.aux-caption').classed('visible', !!step.auxVisible);
      if (problem.aux) {
        const A = AUX[problem.aux.type];
        if (A.captionParams) caption.text(label(A.caption, A.captionParams(step)));
        A.show(gAux, step, problem.aux.items, geo, label, fmt);
      }

      // Animación: el gen "vuela" desde el padre hasta su hueco en el hijo
      if (dur > 0 && step.fly.length) {
        genes.filter((d) => flyTargets.has(`${d.row}-${d.pos}`))
          .style('opacity', 0)
          .transition().delay(dur).duration(0).style('opacity', 1);
        step.fly.forEach((f, idx) => {
          const k = f.to[0] === 'c1' ? 0 : 1;
          const d = step.children[k][f.to[1]];
          const ghost = gGhost.append('g')
            .attr('class', 'gene ghost')
            .attr('transform', `translate(${geneX(f.from[1])},${geo.rowY[f.from[0]]})`);
          paintGene(ghost, d);
          const delay = Math.min(idx * 40, dur * 0.4);
          ghost.transition()
            .delay(delay)
            .duration(dur - delay)
            .ease(d3.easeCubicInOut)
            .attr('transform', `translate(${geneX(f.to[1])},${geo.rowY[f.to[0]]})`)
            .remove();
        });
      }
    }

    function refreshLabels() {
      if (!geo) return;
      drawLabels();
      drawParents();
    }

    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (!geo || !problem) return;
        const compact = svgEl.clientWidth > 0 && svgEl.clientWidth < 640;
        if (compact !== geo.compact) {
          setProblem(problem);
          if (current) show(current, { animate: false });
        }
      }, 150);
    });

    return { setProblem, show, refreshLabels, get step() { return current; } };
  }

  (root.GAX = root.GAX || {}).createPermutationView = createPermutationView;
})(typeof self !== 'undefined' ? self : this);
