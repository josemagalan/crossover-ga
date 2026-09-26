/*
 * Ciudades para ver las permutaciones como rutas del viajante: cada gen g (1…n) es una ciudad
 * en el plano [0, 100] × [0, 100], colocada al azar pero de forma reproducible (semilla).
 */
(function (root) {
  'use strict';

  const isNode = typeof module !== 'undefined' && module.exports;
  const R = isNode ? require('./rng.js') : root.GAX.rng;

  /**
   * n ciudades al azar con semilla, separadas al menos `gap` unidades si es posible
   * (se relaja la separación si no caben). Devuelve { g: [x, y] } para g = 1…n.
   */
  function randomCities(seed, n) {
    const rand = R.mulberry32(((seed >>> 0) * 2654435761 + 97) >>> 0);
    const pts = [];
    let gap = 22;
    let tries = 0;
    while (pts.length < n) {
      const p = [6 + rand() * 88, 6 + rand() * 88];
      if (pts.every((q) => Math.hypot(p[0] - q[0], p[1] - q[1]) >= gap)) pts.push(p);
      if (++tries > 400) { gap *= 0.85; tries = 0; }
    }
    const out = {};
    pts.forEach((p, i) => { out[i + 1] = [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10]; });
    return out;
  }

  /** Longitud del circuito cerrado que recorre las ciudades en ese orden. */
  function tourLength(route, cities) {
    let s = 0;
    for (let i = 0; i < route.length; i++) {
      const a = cities[route[i]];
      const b = cities[route[(i + 1) % route.length]];
      s += Math.hypot(a[0] - b[0], a[1] - b[1]);
    }
    return s;
  }

  const api = { randomCities, tourLength };
  if (isNode) module.exports = api;
  else (root.GAX = root.GAX || {}).cities = api;
})(typeof self !== 'undefined' ? self : this);
