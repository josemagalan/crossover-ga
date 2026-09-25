/*
 * Vista D3 para operadores de cruce sobre permutaciones.
 * Dibuja padres, hijos, segmento, cortes arrastrables y tabla de correspondencias,
 * y anima cada paso de la traza que produce el operador.
 */
(function (root) {
  'use strict';
  const d3 = root.d3;
  const W_WIDE = 1000;
  const CELL_MAX = 72;
  const ROWS = ['p1', 'p2', 'c1', 'c2'];

  function createPermutationView(svgEl, opts) {
    const svg = d3.select(svgEl);
    const label = opts.label;                 // (key) => texto traducido
    const duration = opts.duration;           // () => ms de animación
    const onCutsChange = opts.onCutsChange;   // (c1, c2) => void

    let geo = null;
    let p1 = [];
    let p2 = [];
    let cuts = [0, 0];
    let pairs = [];
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

    const gBands = svg.append('g').attr('class', 'bands');
    const gLabels = svg.append('g').attr('class', 'labels');
    const gIdx = svg.append('g').attr('class', 'indices');
    const gCutLines = svg.append('g').attr('class', 'cut-lines');
    const gSlots = svg.append('g').attr('class', 'slots');
    const gParents = svg.append('g').attr('class', 'parents');
    const gChildren = svg.append('g').attr('class', 'children');
    const gPairs = svg.append('g').attr('class', 'pairs');
    const gGhost = svg.append('g').attr('class', 'ghosts');
    const gHandles = svg.append('g').attr('class', 'handles');

    function layout(n) {
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
      const yP2 = yP1 + s + gap;
      const yPairs = yP2 + s + 52;
      const pairSq = Math.round(Math.min(34, s * 0.62));
      const yC1 = yPairs + pairSq + 36;
      const yC2 = yC1 + s + gap;
      const H = yC2 + s + 18;
      return { W, n, compact, left, cell, s, x0, yHandle, yIdx, yPairs, pairSq, H, rowY: { p1: yP1, p2: yP2, c1: yC1, c2: yC2 } };
    }

    const geneX = (i) => geo.x0 + i * geo.cell + (geo.cell - geo.s) / 2;
    const gapX = (g) => geo.x0 + g * geo.cell;

    // Dibuja el aspecto de un gen dentro de un <g> (usado por genes, hijos y "fantasmas").
    function paintGene(g, d) {
      const s = geo.s;
      g.selectAll('*').remove();
      const mapped = d.kind === 'mapped';
      g.append('rect')
        .attr('class', 'gene-rect')
        .attr('width', s).attr('height', s)
        .attr('rx', Math.max(4, s * 0.14))
        .style('fill', mapped ? `url(#hatch-${d.origin})` : `var(--${d.origin})`);
      g.append('text')
        .attr('class', mapped ? 'gene-num gene-num-halo' : `gene-num ink-${d.origin}`)
        .attr('x', s / 2).attr('y', s / 2)
        .attr('dy', '0.36em')
        .style('font-size', `${Math.round(s * 0.44)}px`)
        .text(d.v);
      if (mapped) {
        const r = Math.max(7, s * 0.15);
        const b = g.append('g').attr('class', 'badge').attr('transform', `translate(${s - r * 0.55},${r * 0.55})`);
        b.append('circle').attr('r', r);
        b.append('text').attr('dy', '0.35em').style('font-size', `${Math.round(r * 1.3)}px`).text('↺');
      }
    }

    function setProblem(np1, np2, c1, c2, npairs) {
      const sizeChanged = !geo || geo.n !== np1.length;
      p1 = np1; p2 = np2; cuts = [c1, c2]; pairs = npairs;
      geo = layout(p1.length);
      svg.attr('viewBox', `0 0 ${geo.W} ${geo.H}`);
      if (sizeChanged) {
        gParents.selectAll('*').remove();
        gChildren.selectAll('*').remove();
        gSlots.selectAll('*').remove();
      }
      drawLabels();
      drawIndices();
      drawParents();
      drawSlots();
      drawCuts();
      drawPairs();
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
      gLabels.selectAll('text.pairs-caption')
        .data([0])
        .join('text')
        .attr('class', 'pairs-caption')
        .classed('visible', !!(current && current.pairsVisible))
        .attr('x', geo.x0 + (geo.cell * geo.n) / 2)
        .attr('y', geo.yPairs - 16)
        .text(label('mappingTable'));
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
      p1.forEach((v, pos) => data.push({ row: 'p1', pos, v, origin: 'p1', kind: 'parent' }));
      p2.forEach((v, pos) => data.push({ row: 'p2', pos, v, origin: 'p2', kind: 'parent' }));
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
      const pad = 10;
      const bands = [
        { id: 'parents', y0: geo.rowY.p1 - pad, y1: geo.rowY.p2 + geo.s + pad },
        { id: 'children', y0: geo.rowY.c1 - pad, y1: geo.rowY.c2 + geo.s + pad },
      ];
      gBands.selectAll('rect.band')
        .data(bands, (d) => d.id)
        .join('rect')
        .attr('class', 'band')
        .attr('x', gapX(cuts[0]))
        .attr('width', gapX(cuts[1]) - gapX(cuts[0]))
        .attr('y', (d) => d.y0)
        .attr('height', (d) => d.y1 - d.y0)
        .attr('rx', 10);

      const lines = [];
      [0, 1].forEach((h) => bands.forEach((b) => lines.push({ h, b })));
      gCutLines.selectAll('line.cut')
        .data(lines, (d) => `${d.h}-${d.b.id}`)
        .join('line')
        .attr('class', 'cut')
        .attr('x1', (d) => gapX(cuts[d.h])).attr('x2', (d) => gapX(cuts[d.h]))
        .attr('y1', (d) => d.b.y0).attr('y2', (d) => d.b.y1);

      const handles = gHandles.selectAll('g.handle')
        .data([0, 1], (d) => d)
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

    function clampCuts(h, g) {
      const n = geo.n;
      let [c1, c2] = cuts;
      if (h === 0) c1 = Math.max(0, c2 - (n - 1), Math.min(g, c2 - 1));
      else c2 = Math.min(n, c1 + (n - 1), Math.max(g, c1 + 1));
      return [c1, c2];
    }

    function requestCuts(c1, c2) {
      if (c1 !== cuts[0] || c2 !== cuts[1]) onCutsChange(c1, c2);
    }

    // Se crea una sola vez: redibujar no interrumpe un arrastre en curso.
    const dragBehavior = d3.drag()
      .container(svgEl)
      .subject((event) => ({ x: event.x, y: event.y }))
      .on('start', function () { d3.select(this).classed('dragging', true); })
      .on('drag', function (event, h) {
        const g = Math.round((event.x - geo.x0) / geo.cell);
        const [c1, c2] = clampCuts(h, g);
        requestCuts(c1, c2);
      })
      .on('end', function () { d3.select(this).classed('dragging', false); });

    function onHandleKey(event, h) {
      const delta = event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0;
      if (!delta) return;
      event.preventDefault();
      event.stopPropagation();
      const [c1, c2] = clampCuts(h, cuts[h] + delta);
      requestCuts(c1, c2);
    }

    function drawPairs() {
      const arrowW = 22;
      const m = pairs.length;
      const avail = geo.cell * geo.n;
      // Reduce las fichas si el segmento es largo para que la tabla quepa en una fila.
      const sq = Math.max(16, Math.min(geo.pairSq, (avail - (m - 1) * 6 - m * arrowW) / (2 * m)));
      const chipW = sq * 2 + arrowW;
      const gap = Math.max(6, Math.min(22, (avail - m * chipW) / Math.max(1, m - 1)));
      const total = m * chipW + (m - 1) * gap;
      const start = geo.x0 + (avail - total) / 2;

      const chips = gPairs.selectAll('g.pair')
        .data(pairs.map((p, k) => Object.assign({ k }, p)), (d) => d.k)
        .join((enter) => {
          const g = enter.append('g').attr('class', 'pair');
          g.append('rect').attr('class', 'pair-bg');
          g.append('rect').attr('class', 'pair-a');
          g.append('text').attr('class', 'pair-a-num ink-p1');
          g.append('text').attr('class', 'pair-arrow').text('↔');
          g.append('rect').attr('class', 'pair-b');
          g.append('text').attr('class', 'pair-b-num ink-p2');
          return g;
        });
      chips.attr('transform', (d) => `translate(${start + d.k * (chipW + gap)},${geo.yPairs})`);
      chips.select('.pair-bg').attr('x', -5).attr('y', -5).attr('width', chipW + 10).attr('height', sq + 10).attr('rx', 8);
      chips.select('.pair-a').attr('width', sq).attr('height', sq).attr('rx', 5).style('fill', 'var(--p1)');
      chips.select('.pair-b').attr('x', sq + arrowW).attr('width', sq).attr('height', sq).attr('rx', 5).style('fill', 'var(--p2)');
      const fs = `${Math.round(sq * 0.5)}px`;
      chips.select('.pair-a-num').attr('x', sq / 2).attr('y', sq / 2).attr('dy', '0.36em').style('font-size', fs).text((d) => d.a);
      chips.select('.pair-b-num').attr('x', sq * 1.5 + arrowW).attr('y', sq / 2).attr('dy', '0.36em').style('font-size', fs).text((d) => d.b);
      chips.select('.pair-arrow').attr('x', sq + arrowW / 2).attr('y', sq / 2).attr('dy', '0.36em').style('font-size', fs);
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

      // Tabla de correspondencias
      gPairs.classed('visible', step.pairsVisible);
      gLabels.selectAll('text.pairs-caption').classed('visible', step.pairsVisible);
      const act = step.activePairs || [];
      gPairs.selectAll('g.pair')
        .classed('active', (d) => act.indexOf(d.k) !== -1 && act.length < pairs.length)
        .classed('dim', (d) => act.length > 0 && act.indexOf(d.k) === -1);

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
      if (geo) drawLabels();
    }

    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (!geo) return;
        const compact = svgEl.clientWidth > 0 && svgEl.clientWidth < 640;
        if (compact !== geo.compact) {
          setProblem(p1, p2, cuts[0], cuts[1], pairs);
          if (current) show(current, { animate: false });
        }
      }, 150);
    });

    return { setProblem, show, refreshLabels, get step() { return current; } };
  }

  (root.GAX = root.GAX || {}).createPermutationView = createPermutationView;
})(typeof self !== 'undefined' ? self : this);
