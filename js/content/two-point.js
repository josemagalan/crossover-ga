/*
 * Contenido docente del cruce en dos puntos (representación binaria).
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const C = isNode ? require('./binary-common.js') : root.GAX.contentShared.binary;

  const explanation = {
    es: [
      'El cruce en dos puntos elige dos cortes y los hijos intercambian el tramo que queda entre ellos: cada hijo conserva los extremos de su padre y recibe el centro del otro. Su máscara de cruce es un bloque de unos rodeado de ceros.',
      'Corrige el principal sesgo del cruce en un punto. Si se imagina el cromosoma cerrado en un anillo, el primer gen y el último quedan contiguos, y con dos cortes pueden acabar juntos en el mismo hijo; con uno solo, nunca. Syswerda (1989) lo compara con el cruce en un punto y con el uniforme.',
      'Si el primer corte está al principio del cromosoma o el segundo al final, el cruce en dos puntos se reduce a uno en un punto.',
      'Coste: cada hijo se construye con un solo recorrido, en tiempo O(n).',
    ],
    en: [
      'Two-point crossover chooses two cuts and the children swap the stretch between them: each child keeps its parent’s ends and receives the other’s middle. Its crossover mask is a block of ones surrounded by zeros.',
      'It removes the main bias of one-point crossover. If the chromosome is imagined closed into a ring, the first and last genes become neighbours, and with two cuts they can end up together in the same child; with a single cut, never. Syswerda (1989) compares it with one-point and uniform crossover.',
      'If the first cut is at the start of the chromosome or the second at the end, two-point crossover reduces to one-point crossover.',
      'Cost: each child is built in a single pass, in O(n) time.',
    ],
  };

  const pseudocode = {
    es: [
      { id: 'sig', indent: 0, text: 'CRUCE_EN_DOS_PUNTOS(P1, P2)' },
      { id: 'cuts', indent: 1, text: 'elegir dos cortes c1 < c2' },
      { id: 'mask', indent: 1, text: 'máscara M: M[i] = 1 si c1 ≤ i < c2;  M[i] = 0 en otro caso' },
      { id: 'forPos', indent: 1, text: 'para cada posición i:' },
      { id: 'keep', indent: 2, text: 'si M[i] = 0:  H1[i] ← P1[i];  H2[i] ← P2[i]' },
      { id: 'swap', indent: 2, text: 'si M[i] = 1:  H1[i] ← P2[i];  H2[i] ← P1[i]' },
      { id: 'return', indent: 1, text: 'devolver H1, H2' },
    ],
    en: [
      { id: 'sig', indent: 0, text: 'TWO_POINT_CROSSOVER(P1, P2)' },
      { id: 'cuts', indent: 1, text: 'choose two cut points c1 < c2' },
      { id: 'mask', indent: 1, text: 'mask M: M[i] = 1 if c1 ≤ i < c2;  M[i] = 0 otherwise' },
      { id: 'forPos', indent: 1, text: 'for each position i:' },
      { id: 'keep', indent: 2, text: 'if M[i] = 0:  C1[i] ← P1[i];  C2[i] ← P2[i]' },
      { id: 'swap', indent: 2, text: 'if M[i] = 1:  C1[i] ← P2[i];  C2[i] ← P1[i]' },
      { id: 'return', indent: 1, text: 'return C1, C2' },
    ],
  };
  const keywords = { es: ['elegir', 'para cada', 'si', 'devolver'], en: ['choose', 'for each', 'if', 'return'] };
  const fnName = { python: 'two_point', javascript: 'twoPoint' };

  const codeTemplates = {
    python: {
      label: 'Python',
      filename: 'two_point.py',
      template: `"""
{{title}}
{{ref}}
"""
import random


def two_point(p1, p2, c1=None, c2=None, rng=random):
    """{{doc1}}"""
    n = len(p1)
    if c1 is None or c2 is None:
        c1, c2 = sorted(rng.sample(range(1, n), 2))
    # {{swap}}
    h1 = p1[:c1] + p2[c1:c2] + p1[c2:]
    h2 = p2[:c1] + p1[c1:c2] + p2[c2:]
    return h1, h2


if __name__ == "__main__":
    # {{example}}
    p1 = [1, 1, 0, 0, 1, 0, 0, 1]
    p2 = [0, 0, 1, 0, 1, 1, 0, 0]
    h1, h2 = two_point(p1, p2, 2, 6)
    print(h1)  # [1, 1, 1, 0, 1, 1, 0, 1]
    print(h2)  # [0, 0, 0, 0, 1, 0, 0, 0]
`,
    },
    javascript: {
      label: 'JavaScript',
      filename: 'two-point.js',
      template: `/**
 * {{title}}
 * {{ref}}
 *
 * {{doc1}}
 */
function twoPoint(p1, p2, c1, c2) {
  const n = p1.length;
  if (c1 === undefined || c2 === undefined) {
    const a = 1 + Math.floor(Math.random() * (n - 1));
    let b = 1 + Math.floor(Math.random() * (n - 2));
    if (b >= a) b++;
    c1 = Math.min(a, b);
    c2 = Math.max(a, b);
  }
  // {{swap}}
  const h1 = p1.slice(0, c1).concat(p2.slice(c1, c2), p1.slice(c2));
  const h2 = p2.slice(0, c1).concat(p1.slice(c1, c2), p2.slice(c2));
  return [h1, h2];
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { twoPoint };
  if (require.main === module) {
    // {{example}}
    const p1 = [1, 1, 0, 0, 1, 0, 0, 1];
    const p2 = [0, 0, 1, 0, 1, 1, 0, 0];
    const [h1, h2] = twoPoint(p1, p2, 2, 6);
    console.log(h1); // [1, 1, 1, 0, 1, 1, 0, 1]
    console.log(h2); // [0, 0, 0, 0, 1, 0, 0, 0]
  }
}
`,
    },
  };

  const codeComments = {
    es: {
      title: 'Cruce en dos puntos para representación binaria.',
      ref: 'Referencia: Syswerda, G. (1989).',
      doc1: 'Hijos del cruce en dos puntos con cortes c1 < c2: los hijos intercambian el tramo [c1, c2). Si se omiten, se eligen al azar.',
      swap: 'Cada hijo: extremos de su padre y tramo central del otro',
      example: 'Tramo intercambiado: posiciones 3 a 6 (índices 2 a 5)',
    },
    en: {
      title: 'Two-point crossover for binary representations.',
      ref: 'Reference: Syswerda, G. (1989).',
      doc1: 'Children of two-point crossover with cuts c1 < c2: the children swap the stretch [c1, c2). If omitted, they are chosen at random.',
      swap: 'Each child: its parent\'s ends and the other\'s middle stretch',
      example: 'Swapped stretch: positions 3 to 6 (indices 2 to 5)',
    },
  };

  const references = [
    C.ref('syswerda', {
      es: 'Describe los cruces de uno y dos puntos y el uniforme con máscaras de cruce, y los compara.',
      en: 'Describes one-point, two-point and uniform crossover with crossover masks, and compares them.',
    }),
    C.ref('luke', {
      es: 'Presenta el algoritmo del cruce en dos puntos que usan las transparencias del curso.',
      en: 'Presents the two-point crossover algorithm used in the course slides.',
    }),
    C.ref('eiben', {
      es: 'Manual de referencia de computación evolutiva, con los operadores de cruce para representación binaria.',
      en: 'Reference textbook on evolutionary computation, including crossover operators for binary representations.',
    }),
  ];

  const H = C.makeHelpers(codeTemplates, codeComments, pseudocode);
  const api = Object.assign({ id: 'two-point', explanation, narration: C.narration, pseudocode, keywords, stepLines: C.cutsStepLines, fnName, codeTemplates, references }, H);
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).content = root.GAX.content || {})['two-point'] = api;
})(typeof self !== 'undefined' ? self : this);
