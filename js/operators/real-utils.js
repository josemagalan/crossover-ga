/*
 * Utilidades de la representación real: validación y generación de padres.
 *
 * Para que los ejemplos se lean bien en clase, los padres aleatorios tienen un decimal y
 * están entre 0 y 10. A mano se admiten valores entre 0 y 100 con hasta dos decimales
 * (sin negativos: el guion separa los genes en la URL).
 */
(function (root) {
  'use strict';

  const isNode = typeof module !== 'undefined' && module.exports;
  const R = isNode ? require('../rng.js') : root.GAX.rng;

  const MIN = 0;
  const MAX = 100;

  /** null si p1 y p2 son vectores reales válidos de la misma longitud (5 <= n <= 12), o una clave de error. */
  function validateParents(p1, p2) {
    if (!Array.isArray(p1) || !Array.isArray(p2)) return 'errFormat';
    if (p1.length !== p2.length) return 'errLength';
    const n = p1.length;
    if (n < 5 || n > 12) return 'errRange';
    const ok = (v) => typeof v === 'number' && Number.isFinite(v) && v >= MIN && v <= MAX && Math.abs(v * 100 - Math.round(v * 100)) < 1e-6;
    if (!p1.concat(p2).every(ok)) return 'errReal';
    return null;
  }

  /** Vector de n reales con un decimal en [0, 10]. */
  function randomReals(rng, n) {
    return Array.from({ length: n }, () => Math.round(rng() * 100) / 10);
  }

  const api = { validateParents, randomReals, MIN, MAX };
  if (isNode) module.exports = api;
  else (root.GAX = root.GAX || {}).realUtils = api;
})(typeof self !== 'undefined' ? self : this);
