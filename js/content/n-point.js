/*
 * Contenido docente del cruce en n puntos (representación binaria).
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const C = isNode ? require('./binary-common.js') : root.GAX.contentShared.binary;

  const explanation = {
    es: [
      'El cruce en n puntos generaliza los anteriores: con k cortes, el cromosoma queda dividido en k + 1 tramos, y cada hijo toma los tramos alternativamente de su propio padre y del otro. Con k = 1 es el cruce en un punto y con k = 2, el de dos puntos.',
      'En la máscara de cruce, el bit cambia de valor en cada corte. Cuantos más cortes, más se mezclan los padres y más se rompen los grupos de genes contiguos. En el extremo, con un corte entre cada dos genes (k = n − 1), la máscara alterna 0 y 1 en todas las posiciones.',
      'Cambia el número de cortes con el control «Número de cortes» y arrastra cada corte para ver cómo cambia la máscara.',
      'Coste: cada hijo se construye con un solo recorrido, en tiempo O(n).',
    ],
    en: [
      'N-point crossover generalises the previous ones: with k cuts, the chromosome is divided into k + 1 stretches, and each child takes the stretches alternately from its own parent and from the other. With k = 1 it is one-point crossover and with k = 2, two-point crossover.',
      'In the crossover mask, the bit changes value at every cut. The more cuts, the more the parents are mixed and the more groups of neighbouring genes are broken. At the extreme, with a cut between every two genes (k = n − 1), the mask alternates 0 and 1 at every position.',
      'Change the number of cuts with the “Number of cuts” control and drag each cut to see how the mask changes.',
      'Cost: each child is built in a single pass, in O(n) time.',
    ],
  };

  const narration = {
    es: Object.assign({ paramK: 'Número de cortes' }, C.narration.es),
    en: Object.assign({ paramK: 'Number of cuts' }, C.narration.en),
  };

  const pseudocode = {
    es: [
      { id: 'sig', indent: 0, text: 'CRUCE_EN_N_PUNTOS(P1, P2, k)' },
      { id: 'cuts', indent: 1, text: 'elegir k cortes c1 < c2 < … < ck' },
      { id: 'mask', indent: 1, text: 'máscara M: M[i] = (número de cortes cj ≤ i) módulo 2' },
      { id: 'forPos', indent: 1, text: 'para cada posición i:' },
      { id: 'keep', indent: 2, text: 'si M[i] = 0:  H1[i] ← P1[i];  H2[i] ← P2[i]' },
      { id: 'swap', indent: 2, text: 'si M[i] = 1:  H1[i] ← P2[i];  H2[i] ← P1[i]' },
      { id: 'return', indent: 1, text: 'devolver H1, H2' },
    ],
    en: [
      { id: 'sig', indent: 0, text: 'N_POINT_CROSSOVER(P1, P2, k)' },
      { id: 'cuts', indent: 1, text: 'choose k cut points c1 < c2 < … < ck' },
      { id: 'mask', indent: 1, text: 'mask M: M[i] = (number of cuts cj ≤ i) modulo 2' },
      { id: 'forPos', indent: 1, text: 'for each position i:' },
      { id: 'keep', indent: 2, text: 'if M[i] = 0:  C1[i] ← P1[i];  C2[i] ← P2[i]' },
      { id: 'swap', indent: 2, text: 'if M[i] = 1:  C1[i] ← P2[i];  C2[i] ← P1[i]' },
      { id: 'return', indent: 1, text: 'return C1, C2' },
    ],
  };
  const keywords = { es: ['elegir', 'para cada', 'si', 'devolver'], en: ['choose', 'for each', 'if', 'return'] };
  const fnName = { python: 'n_point', javascript: 'nPoint' };

  const codeTemplates = {
    python: {
      label: 'Python',
      filename: 'n_point.py',
      template: `"""
{{title}}
{{ref}}
"""
import random


def n_point(p1, p2, cuts=None, k=3, rng=random):
    """{{doc1}}"""
    n = len(p1)
    if cuts is None:
        cuts = sorted(rng.sample(range(1, n), k))
    h1, h2 = [], []
    swap = False
    for i in range(n):
        # {{toggle}}
        if i in cuts:
            swap = not swap
        h1.append(p2[i] if swap else p1[i])
        h2.append(p1[i] if swap else p2[i])
    return h1, h2


if __name__ == "__main__":
    # {{example}}
    p1 = [1, 1, 0, 0, 1, 0, 0, 1]
    p2 = [0, 0, 1, 0, 1, 1, 0, 0]
    h1, h2 = n_point(p1, p2, [2, 4, 6])
    print(h1)  # [1, 1, 1, 0, 1, 0, 0, 0]
    print(h2)  # [0, 0, 0, 0, 1, 1, 0, 1]
`,
    },
    javascript: {
      label: 'JavaScript',
      filename: 'n-point.js',
      template: `/**
 * {{title}}
 * {{ref}}
 *
 * {{doc1}}
 */
function nPoint(p1, p2, cuts, k = 3) {
  const n = p1.length;
  if (cuts === undefined) {
    const pool = Array.from({ length: n - 1 }, (_, i) => i + 1);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    cuts = pool.slice(0, k).sort((a, b) => a - b);
  }
  const h1 = [];
  const h2 = [];
  let swap = false;
  for (let i = 0; i < n; i++) {
    // {{toggle}}
    if (cuts.includes(i)) swap = !swap;
    h1.push(swap ? p2[i] : p1[i]);
    h2.push(swap ? p1[i] : p2[i]);
  }
  return [h1, h2];
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { nPoint };
  if (require.main === module) {
    // {{example}}
    const p1 = [1, 1, 0, 0, 1, 0, 0, 1];
    const p2 = [0, 0, 1, 0, 1, 1, 0, 0];
    const [h1, h2] = nPoint(p1, p2, [2, 4, 6]);
    console.log(h1); // [1, 1, 1, 0, 1, 0, 0, 0]
    console.log(h2); // [0, 0, 0, 0, 1, 1, 0, 1]
  }
}
`,
    },
  };

  const codeComments = {
    es: {
      title: 'Cruce en n puntos para representación binaria.',
      ref: 'Referencia: Syswerda, G. (1989).',
      doc1: 'Hijos del cruce con los cortes indicados (lista creciente entre 1 y n-1); si se omite, se eligen k cortes al azar.',
      toggle: 'En cada corte se cambia de padre',
      example: 'Tres cortes, tras las posiciones 2, 4 y 6',
    },
    en: {
      title: 'N-point crossover for binary representations.',
      ref: 'Reference: Syswerda, G. (1989).',
      doc1: 'Children of crossover with the given cuts (increasing list between 1 and n-1); if omitted, k cuts are chosen at random.',
      toggle: 'At every cut, switch parent',
      example: 'Three cuts, after positions 2, 4 and 6',
    },
  };

  const references = [
    C.ref('syswerda', {
      es: 'Con las máscaras de cruce, los cruces por cortes se reducen a máscaras con tramos de unos y ceros.',
      en: 'With crossover masks, cut-based crossovers become masks made of stretches of ones and zeros.',
    }),
    C.ref('eiben', {
      es: 'Manual de referencia de computación evolutiva, con los operadores de cruce para representación binaria.',
      en: 'Reference textbook on evolutionary computation, including crossover operators for binary representations.',
    }),
    C.ref('mitchell', {
      es: 'Introducción clásica a los algoritmos genéticos; menciona las versiones de cruce en varios puntos.',
      en: 'Classic introduction to genetic algorithms; mentions multi-point versions of crossover.',
    }),
    C.ref('talbi', {
      es: 'Manual de metaheurísticas. El apartado 3.3.2.2 (p. 214, fig. 3.16) presenta el cruce en n puntos como generalización del de un punto.',
      en: 'Metaheuristics textbook. Section 3.3.2.2 (p. 214, fig. 3.16) presents n-point crossover as the generalisation of one-point crossover.',
    }),
    C.ref('whitley', {
      es: 'El apartado 3.1.1 compara los cruces con varios puntos de corte: los esquemas cuyos genes están cerca en el cromosoma tienen menos probabilidad de romperse.',
      en: 'Section 3.1.1 compares crossovers with several cut points: schemata whose genes are close together on the chromosome are less likely to be broken.',
    }),
  ];

  const H = C.makeHelpers(codeTemplates, codeComments, pseudocode);
  const api = Object.assign({ id: 'n-point', explanation, narration, pseudocode, keywords, stepLines: C.cutsStepLines, fnName, codeTemplates, references }, H);
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).content = root.GAX.content || {})['n-point'] = api;
})(typeof self !== 'undefined' ? self : this);
