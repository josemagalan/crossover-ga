/*
 * Generador pseudoaleatorio con semilla (mulberry32) y utilidades.
 * Funciona tanto en el navegador (window.GAX.rng) como en Node (module.exports).
 */
(function (root) {
  'use strict';

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /** Entero uniforme en [lo, hi] (ambos incluidos). */
  function randInt(rng, lo, hi) {
    return lo + Math.floor(rng() * (hi - lo + 1));
  }

  function shuffle(rng, arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /** Permutación aleatoria de 1..n */
  function randomPermutation(rng, n) {
    return shuffle(rng, Array.from({ length: n }, (_, i) => i + 1));
  }

  /**
   * Cortes [c1, c2) con al menos una posición fuera del segmento a cada lado
   * y un segmento de al menos 2 genes (requiere n >= 5).
   */
  function randomCuts(rng, n) {
    const c1 = randInt(rng, 1, n - 3);
    const c2 = randInt(rng, c1 + 2, n - 1);
    return [c1, c2];
  }

  function newSeed() {
    return Math.floor(Math.random() * 1e6);
  }

  const api = { mulberry32, randInt, shuffle, randomPermutation, randomCuts, newSeed };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else (root.GAX = root.GAX || {}).rng = api;
})(typeof self !== 'undefined' ? self : this);
