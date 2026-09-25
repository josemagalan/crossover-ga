/*
 * Utilidades compartidas por los operadores de representación permutacional.
 */
(function (root) {
  'use strict';

  /** Devuelve null si p1 y p2 son permutaciones válidas de 1..n (5 <= n <= 12), o una clave de error. */
  function validateParents(p1, p2) {
    if (!Array.isArray(p1) || !Array.isArray(p2)) return 'errFormat';
    if (p1.length !== p2.length) return 'errLength';
    const n = p1.length;
    if (n < 5 || n > 12) return 'errRange';
    const isPerm = (p) => {
      if (p.some((v) => !Number.isInteger(v))) return false;
      const s = new Set(p);
      return s.size === n && p.every((v) => v >= 1 && v <= n);
    };
    if (!isPerm(p1) || !isPerm(p2)) return 'errPerm';
    return null;
  }

  /** Dos cortes [c1, c2) con al menos un gen dentro y otro fuera del segmento. */
  function validateCuts(n, c1, c2) {
    return Number.isInteger(c1) && Number.isInteger(c2) &&
      c1 >= 0 && c2 <= n && c2 - c1 >= 1 && c2 - c1 <= n - 1;
  }

  function range(a, b) {
    const r = [];
    for (let i = a; i < b; i++) r.push(i);
    return r;
  }

  const api = { validateParents, validateCuts, range };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else (root.GAX = root.GAX || {}).permUtils = api;
})(typeof self !== 'undefined' ? self : this);
