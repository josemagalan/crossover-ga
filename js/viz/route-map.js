/*
 * Mapas de rutas para los operadores de permutación: cada gen es una ciudad y cada cromosoma,
 * una ruta circular del viajante. Un mapa por hijo, con las rutas de los dos padres tenues y la
 * del hijo formándose paso a paso (solo los tramos entre posiciones consecutivas ya colocadas).
 * Los tramos del hijo se distinguen según estuvieran o no en algún padre.
 */
(function (root) {
  'use strict';
  const d3 = root.d3;
  const W = 300;
  const H = 220;
  const PAD = 16;

  const key = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);
  function edgeSet(p) {
    const s = new Set();
    for (let i = 0; i < p.length; i++) s.add(key(p[i], p[(i + 1) % p.length]));
    return s;
  }

  function createRouteMaps(el, opts) {
    const t = opts.t;              // (key, params) => texto
    const fmt = opts.formatLength; // número => texto
    const lengthOf = opts.tourLength;
    let problem = null;            // { p1, p2, cities }
    let current = null;

    const maps = el.svgs.map((svgEl) => {
      const svg = d3.select(svgEl).attr('viewBox', `0 0 ${W} ${H}`);
      return {
        svg,
        gParents: svg.append('g').attr('class', 'route-parents'),
        gEdges: svg.append('g').attr('class', 'route-edges'),
        gCities: svg.append('g').attr('class', 'route-cities'),
      };
    });

    const X = (c) => PAD + (c[0] / 100) * (W - 2 * PAD);
    const Y = (c) => PAD + (c[1] / 100) * (H - 2 * PAD);
    const closed = (route) => route.map((g) => `${X(problem.cities[g])},${Y(problem.cities[g])}`).join(' ');

    function setProblem(p) {
      problem = p;
      maps.forEach((m) => {
        m.gParents.selectAll('polygon')
          .data([{ k: 'p1', route: p.p1 }, { k: 'p2', route: p.p2 }], (d) => d.k)
          .join('polygon')
          .attr('class', (d) => `route-parent route-${d.k}`)
          .attr('points', (d) => closed(d.route));
      });
    }

    function show(step) {
      current = step;
      if (!problem) return;
      const { p1, p2, cities } = problem;
      const n = p1.length;
      const parentEdges = [edgeSet(p1), edgeSet(p2)];
      const genes = Object.keys(cities).map(Number);
      maps.forEach((m, k) => {
        const row = step.children[k].map((g) => (g ? g.v : null));
        const edges = [];
        for (let i = 0; i < n; i++) {
          const a = row[i];
          const b = row[(i + 1) % n];
          if (a == null || b == null || a === b) continue;
          const kk = key(a, b);
          edges.push({ id: `${i}:${kk}`, a, b, kept: parentEdges[0].has(kk) || parentEdges[1].has(kk) });
        }
        m.gEdges.selectAll('line')
          .data(edges, (d) => d.id)
          .join('line')
          .attr('class', (d) => `route-edge ${d.kept ? 'kept' : 'new'}`)
          .attr('x1', (d) => X(cities[d.a])).attr('y1', (d) => Y(cities[d.a]))
          .attr('x2', (d) => X(cities[d.b])).attr('y2', (d) => Y(cities[d.b]));

        const placed = new Set(row.filter((v) => v != null));
        const complete = row.every((v) => v != null);
        const missing = complete ? genes.filter((g) => !placed.has(g)) : [];
        const cityG = m.gCities.selectAll('g.city')
          .data(genes, (g) => g)
          .join((enter) => {
            const c = enter.append('g').attr('class', 'city');
            c.append('circle').attr('r', 9);
            c.append('text').attr('dy', '0.35em');
            return c;
          });
        cityG.attr('transform', (g) => `translate(${X(cities[g])},${Y(cities[g])})`)
          .classed('visited', (g) => placed.has(g))
          .classed('missing', (g) => missing.indexOf(g) !== -1);
        cityG.select('text').text((g) => g);

        // Pie: longitudes (del hijo, cuando está completo y es una ruta válida)
        const l1 = fmt(lengthOf(p1, cities));
        const l2 = fmt(lengthOf(p2, cities));
        let head;
        if (!complete) head = t('routeChildBuilding', { k: k + 1 });
        else if (missing.length) {
          const count = new Map();
          row.forEach((v) => count.set(v, (count.get(v) || 0) + 1));
          const rep = [...count.keys()].filter((v) => count.get(v) > 1).sort((a, b) => a - b);
          head = t('routeInvalid', { k: k + 1, rep: rep.join(', '), miss: missing.join(', ') });
        } else {
          head = t('routeChildLen', { k: k + 1, len: fmt(lengthOf(row, cities)) });
        }
        el.caps[k].textContent = `${head} · ${t('routeParents', { l1, l2 })}`;
        m.svg.attr('aria-label', t('routeSvgLabel', { k: k + 1 }));
      });
    }

    function refresh() { if (current) show(current); }

    return { setProblem, show, refresh };
  }

  (root.GAX = root.GAX || {}).createRouteMaps = createRouteMaps;
})(typeof self !== 'undefined' ? self : this);
