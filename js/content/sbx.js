/*
 * Contenido docente del cruce SBX, simulated binary crossover (representación real).
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const C = isNode ? require('./real-common.js') : root.GAX.contentShared.real;

  const explanation = {
    es: [
      'Deb y Agrawal (1995) diseñaron SBX para que el cruce con genes reales tenga una dispersión parecida a la del cruce de un punto de la representación binaria: es más probable que los hijos queden cerca de los padres que lejos. En cada gen se sortea un número u en [0, 1) y, a partir de él, un factor de dispersión β; los hijos son H1 = 0,5·[(1 + β)·P1 + (1 − β)·P2] y H2 = 0,5·[(1 − β)·P1 + (1 + β)·P2].',
      'El parámetro η controla esa concentración. Con valores moderados, entre 2 y 5, Deb y Agrawal comprueban que la dispersión se parece a la del cruce de un punto binario. Con η grande, β se acerca casi siempre a 1 y los hijos quedan muy pegados a los padres (más explotador); con η pequeño, β se dispersa más y los hijos pueden alejarse bastante (más explorador).',
      'Los dos hijos son siempre simétricos respecto a la media de los padres, H1 + H2 = P1 + P2, igual que en el cruce aritmético. Pero a diferencia de éste, la distancia a esa media no es un peso fijo sino aleatoria, y puede superar la que separa a los padres: SBX sí puede crear valores fuera de su intervalo.',
      'Coste: un número aleatorio por gen, en tiempo O(n).',
    ],
    en: [
      'Deb and Agrawal (1995) designed SBX so that crossover with real genes has a spread similar to that of one-point crossover in the binary representation: children are more likely to land close to the parents than far away. For each gene a number u in [0, 1) is drawn and, from it, a spread factor β; the children are C1 = 0.5·[(1 + β)·P1 + (1 − β)·P2] and C2 = 0.5·[(1 − β)·P1 + (1 + β)·P2].',
      'The parameter η controls that concentration. With moderate values, between 2 and 5, Deb and Agrawal find the spread resembles that of one-point binary crossover. With large η, β is almost always close to 1 and the children stay very close to the parents (more exploitative); with small η, β spreads out more and the children can move quite far away (more explorative).',
      'The two children are always symmetric about the parents’ average, C1 + C2 = P1 + P2, just as in arithmetic crossover. But unlike that operator, the distance from that average is not a fixed weight but a random one, and it can exceed the distance between the parents: SBX can create values outside their interval.',
      'Cost: one random number per gene, in O(n) time.',
    ],
  };

  const narration = {
    es: Object.assign({}, C.narration.es, {
      paramETA: 'Concentración (η)',
      intro: 'Partimos de dos padres, vectores de {n} números reales.',
      etaIntro: 'Con η = {eta}, en cada posición se sortea un número u en [0, 1) y se calcula con él un factor de dispersión β que decide cuánto se alejan los hijos de la media de los padres, a partes iguales pero en sentido contrario. Cuanto mayor es η, más se concentra β cerca de 1 y más se parecen los hijos a los padres.',
      geneLow: 'Posición {pos}: sale u = {u} ≤ 0,5, así que β = (2u)^(1/(η+1)) = {beta}. H1 = 0,5·[(1+β)·{a} + (1−β)·{b}] = {h1}; H2 = 0,5·[(1−β)·{a} + (1+β)·{b}] = {h2}.',
      geneHigh: 'Posición {pos}: sale u = {u} > 0,5, así que β = (1 / (2·(1−u)))^(1/(η+1)) = {beta}. H1 = 0,5·[(1+β)·{a} + (1−β)·{b}] = {h1}; H2 = 0,5·[(1−β)·{a} + (1+β)·{b}] = {h2}.',
      done: 'Resultado: en cada posición, H1 y H2 quedan a la misma distancia de la media de los padres, uno a cada lado; esa distancia depende de β y, con η = {eta}, puede quedar tanto dentro como fuera del intervalo de los padres. La suma H1 + H2 es siempre igual a P1 + P2.',
    }),
    en: Object.assign({}, C.narration.en, {
      paramETA: 'Concentration (η)',
      intro: 'We start from two parents, vectors of {n} real numbers.',
      etaIntro: 'With η = {eta}, at each position a number u in [0, 1) is drawn and used to compute a spread factor β that decides how far the children move from the parents’ average, equally but in opposite directions. The larger η is, the more β concentrates near 1 and the more the children resemble the parents.',
      geneLow: 'Position {pos}: u = {u} ≤ 0.5 comes out, so β = (2u)^(1/(η+1)) = {beta}. C1 = 0.5·[(1+β)·{a} + (1−β)·{b}] = {h1}; C2 = 0.5·[(1−β)·{a} + (1+β)·{b}] = {h2}.',
      geneHigh: 'Position {pos}: u = {u} > 0.5 comes out, so β = (1 / (2·(1−u)))^(1/(η+1)) = {beta}. C1 = 0.5·[(1+β)·{a} + (1−β)·{b}] = {h1}; C2 = 0.5·[(1−β)·{a} + (1+β)·{b}] = {h2}.',
      done: 'Result: at each position, C1 and C2 sit at the same distance from the parents’ average, one on each side; that distance depends on β and, with η = {eta}, can land either inside or outside the parents’ interval. The sum C1 + C2 always equals P1 + P2.',
    }),
  };

  const pseudocode = {
    es: [
      { id: 'sig', indent: 0, text: 'SBX(P1, P2, η)' },
      { id: 'forPos', indent: 1, text: 'para cada posición i:' },
      { id: 'draw', indent: 2, text: 'u ← número aleatorio en [0, 1)' },
      { id: 'betaLow', indent: 2, text: 'si u ≤ 0,5:  β ← (2u)^(1/(η+1))' },
      { id: 'betaHigh', indent: 2, text: 'si no:       β ← (1 / (2·(1−u)))^(1/(η+1))' },
      { id: 'h1', indent: 2, text: 'H1[i] ← 0,5 · [(1+β)·P1[i] + (1−β)·P2[i]]' },
      { id: 'h2', indent: 2, text: 'H2[i] ← 0,5 · [(1−β)·P1[i] + (1+β)·P2[i]]' },
      { id: 'return', indent: 1, text: 'devolver H1, H2' },
    ],
    en: [
      { id: 'sig', indent: 0, text: 'SBX(P1, P2, η)' },
      { id: 'forPos', indent: 1, text: 'for each position i:' },
      { id: 'draw', indent: 2, text: 'u ← random number in [0, 1)' },
      { id: 'betaLow', indent: 2, text: 'if u ≤ 0.5:  β ← (2u)^(1/(η+1))' },
      { id: 'betaHigh', indent: 2, text: 'else:        β ← (1 / (2·(1−u)))^(1/(η+1))' },
      { id: 'h1', indent: 2, text: 'C1[i] ← 0.5 · [(1+β)·P1[i] + (1−β)·P2[i]]' },
      { id: 'h2', indent: 2, text: 'C2[i] ← 0.5 · [(1−β)·P1[i] + (1+β)·P2[i]]' },
      { id: 'return', indent: 1, text: 'return C1, C2' },
    ],
  };
  const keywords = { es: ['para cada', 'si no', 'si', 'devolver'], en: ['for each', 'else', 'if', 'return'] };
  const stepLines = {
    intro: ['sig'],
    etaIntro: ['forPos', 'draw'],
    gene: ['forPos', 'draw', 'betaLow', 'betaHigh', 'h1', 'h2'],
    done: ['return'],
  };
  const fnName = { python: 'sbx', javascript: 'sbx' };

  const codeTemplates = {
    python: {
      label: 'Python',
      filename: 'sbx.py',
      template: `"""
{{title}}
{{ref}}
"""
import random
import math


def round5(x):
    """Redondeo hecho a mano: round() de Python redondea las mitades exactas al par más
    cercano, no hacia arriba como en la herramienta, y algún gen suelto no coincidiría."""
    s = -1 if x < 0 else 1
    return s * math.floor(abs(x) * 1e5 + 0.5) / 1e5


def sbx(p1, p2, eta=2, rng=random):
    """{{doc1}}"""
    h1, h2 = [], []
    for a, b in zip(p1, p2):
        u = rng.random()
        # {{beta}}
        beta = (2 * u) ** (1 / (eta + 1)) if u <= 0.5 else (1 / (2 * (1 - u))) ** (1 / (eta + 1))
        beta = round5(beta)
        h1.append(round5(0.5 * ((1 + beta) * a + (1 - beta) * b)))
        h2.append(round5(0.5 * ((1 - beta) * a + (1 + beta) * b)))
    return h1, h2


if __name__ == "__main__":
    # {{example}}
    random.seed(4)
    p1 = [2.0, 4.5, 1.0, 8.0, 6.5, 3.0]
    p2 = [6.0, 0.5, 3.0, 9.0, 2.5, 7.0]
    h1, h2 = sbx(p1, p2, 2)
    print(h1, h2)
`,
    },
    javascript: {
      label: 'JavaScript',
      filename: 'sbx.js',
      template: `/**
 * {{title}}
 * {{ref}}
 *
 * {{doc1}}
 */
function sbx(p1, p2, eta = 2, random = Math.random) {
  // Redondeo hecho a mano: con el redondeo nativo, un empate exacto a mitad de camino se
  // resolvería de otra forma en Python (al par más cercano) que aquí, y el resultado no
  // coincidiría en algún gen suelto.
  const round5 = (x) => {
    const s = x < 0 ? -1 : 1;
    return (s * Math.floor(Math.abs(x) * 1e5 + 0.5)) / 1e5;
  };
  const h1 = [];
  const h2 = [];
  for (let i = 0; i < p1.length; i++) {
    const u = random();
    // {{beta}}
    const beta = round5(u <= 0.5 ? (2 * u) ** (1 / (eta + 1)) : (1 / (2 * (1 - u))) ** (1 / (eta + 1)));
    h1.push(round5(0.5 * ((1 + beta) * p1[i] + (1 - beta) * p2[i])));
    h2.push(round5(0.5 * ((1 - beta) * p1[i] + (1 + beta) * p2[i])));
  }
  return [h1, h2];
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { sbx };
  if (require.main === module) {
    // {{example}}
    const p1 = [2.0, 4.5, 1.0, 8.0, 6.5, 3.0];
    const p2 = [6.0, 0.5, 3.0, 9.0, 2.5, 7.0];
    console.log(sbx(p1, p2, 2));
  }
}
`,
    },
  };

  const codeComments = {
    es: {
      title: 'Cruce SBX (simulated binary crossover) para representación real.',
      ref: 'Referencia: Deb, K. y Agrawal, R. B. (1995).',
      doc1: 'Hijos del cruce SBX: en cada gen se sortea un factor de dispersión β a partir de η y se combinan los padres con él.',
      beta: 'β decide cuánto se alejan los hijos de la media de los padres',
      example: 'Ejemplo (el resultado depende del sorteo)',
    },
    en: {
      title: 'SBX (simulated binary crossover) for real-valued representations.',
      ref: 'Reference: Deb, K. & Agrawal, R. B. (1995).',
      doc1: 'Children of SBX crossover: for each gene a spread factor β is drawn from η and used to combine the parents.',
      beta: 'β decides how far the children move from the parents’ average',
      example: 'Example (the result depends on the draw)',
    },
  };

  const references = [
    C.ref('deb', {
      es: 'Presenta el cruce SBX y la distribución polinómica del factor de dispersión β a partir del parámetro η.',
      en: 'Introduces SBX crossover and the polynomial distribution of the spread factor β from the parameter η.',
    }, { original: true }),
    C.ref('eiben', {
      es: 'Sitúa el SBX entre los operadores de recombinación para representaciones reales, junto con el aritmético y el BLX-α.',
      en: 'Places SBX among the recombination operators for real-valued representations, alongside arithmetic and BLX-α crossover.',
    }),
  ];

  const H = C.makeHelpers(codeTemplates, codeComments, pseudocode);
  const api = Object.assign({ id: 'sbx', explanation, narration, pseudocode, keywords, stepLines, fnName, codeTemplates, references }, H);
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).content = root.GAX.content || {}).sbx = api;
})(typeof self !== 'undefined' ? self : this);
