/*
 * Contenido docente del cruce en un punto (representación binaria).
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const C = isNode ? require('./binary-common.js') : root.GAX.contentShared.binary;

  const explanation = {
    es: [
      'El cruce en un punto es el operador de cruce clásico de los algoritmos genéticos, el que analiza Holland (1975). Se elige un punto de corte y los dos hijos intercambian las colas: el Hijo 1 se queda con la cabeza del Padre 1 y la cola del Padre 2, y el Hijo 2, al revés.',
      'Syswerda (1989) propuso describirlo con una máscara de cruce: un bit por posición, 0 si cada hijo copia el gen de su propio padre y 1 si los hijos lo intercambian. En el cruce en un punto la máscara es un bloque de ceros seguido de un bloque de unos. La misma idea sirve para los cruces en dos puntos, en n puntos y uniforme; solo cambia la forma de la máscara.',
      'Como los genes contiguos tienden a viajar juntos, este cruce conserva bien los grupos de genes próximos. En la teoría de esquemas de Holland, un esquema sobrevive al cruce con más facilidad cuanto más corta es su longitud de definición, es decir, cuanto más cerca están sus posiciones fijas. La contrapartida es un sesgo posicional: el primer gen y el último siempre proceden de padres distintos.',
      'Coste: cada hijo se construye con un solo recorrido, en tiempo O(n).',
    ],
    en: [
      'One-point crossover is the classic crossover operator of genetic algorithms, the one analysed by Holland (1975). A cut point is chosen and the two children swap tails: Child 1 keeps Parent 1’s head and Parent 2’s tail, and Child 2 the other way round.',
      'Syswerda (1989) proposed describing it with a crossover mask: one bit per position, 0 if each child copies its own parent’s gene and 1 if the children swap it. In one-point crossover the mask is a block of zeros followed by a block of ones. The same idea covers two-point, n-point and uniform crossover; only the shape of the mask changes.',
      'Because neighbouring genes tend to travel together, this crossover preserves groups of nearby genes well. In Holland’s schema theory, a schema survives crossover more easily the shorter its defining length, that is, the closer together its fixed positions are. The downside is a positional bias: the first and last genes always come from different parents.',
      'Cost: each child is built in a single pass, in O(n) time.',
    ],
  };

  const narration = C.narration;

  const pseudocode = {
    es: [
      { id: 'sig', indent: 0, text: 'CRUCE_EN_UN_PUNTO(P1, P2)' },
      { id: 'cuts', indent: 1, text: 'elegir un corte c, con 0 < c < n' },
      { id: 'mask', indent: 1, text: 'máscara M: M[i] = 0 si i < c;  M[i] = 1 si i ≥ c' },
      { id: 'forPos', indent: 1, text: 'para cada posición i:' },
      { id: 'keep', indent: 2, text: 'si M[i] = 0:  H1[i] ← P1[i];  H2[i] ← P2[i]' },
      { id: 'swap', indent: 2, text: 'si M[i] = 1:  H1[i] ← P2[i];  H2[i] ← P1[i]' },
      { id: 'return', indent: 1, text: 'devolver H1, H2' },
    ],
    en: [
      { id: 'sig', indent: 0, text: 'ONE_POINT_CROSSOVER(P1, P2)' },
      { id: 'cuts', indent: 1, text: 'choose a cut point c, with 0 < c < n' },
      { id: 'mask', indent: 1, text: 'mask M: M[i] = 0 if i < c;  M[i] = 1 if i ≥ c' },
      { id: 'forPos', indent: 1, text: 'for each position i:' },
      { id: 'keep', indent: 2, text: 'if M[i] = 0:  C1[i] ← P1[i];  C2[i] ← P2[i]' },
      { id: 'swap', indent: 2, text: 'if M[i] = 1:  C1[i] ← P2[i];  C2[i] ← P1[i]' },
      { id: 'return', indent: 1, text: 'return C1, C2' },
    ],
  };
  const keywords = { es: ['elegir', 'para cada', 'si', 'devolver'], en: ['choose', 'for each', 'if', 'return'] };
  const stepLines = C.cutsStepLines;
  const fnName = { python: 'one_point', javascript: 'onePoint' };

  const codeTemplates = {
    python: {
      label: 'Python',
      filename: 'one_point.py',
      template: `"""
{{title}}
{{ref}}
"""
import random


def one_point(p1, p2, c=None, rng=random):
    """{{doc1}}"""
    n = len(p1)
    if c is None:
        c = rng.randrange(1, n)
    # {{swap}}
    return p1[:c] + p2[c:], p2[:c] + p1[c:]


if __name__ == "__main__":
    # {{example}}
    p1 = [1, 1, 0, 0, 1, 0, 0, 1]
    p2 = [0, 0, 1, 0, 1, 1, 0, 0]
    h1, h2 = one_point(p1, p2, 5)
    print(h1)  # [1, 1, 0, 0, 1, 1, 0, 0]
    print(h2)  # [0, 0, 1, 0, 1, 0, 0, 1]
`,
    },
    javascript: {
      label: 'JavaScript',
      filename: 'one-point.js',
      template: `/**
 * {{title}}
 * {{ref}}
 *
 * {{doc1}}
 */
function onePoint(p1, p2, c) {
  const n = p1.length;
  if (c === undefined) c = 1 + Math.floor(Math.random() * (n - 1));
  // {{swap}}
  return [p1.slice(0, c).concat(p2.slice(c)), p2.slice(0, c).concat(p1.slice(c))];
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { onePoint };
  if (require.main === module) {
    // {{example}}
    const p1 = [1, 1, 0, 0, 1, 0, 0, 1];
    const p2 = [0, 0, 1, 0, 1, 1, 0, 0];
    const [h1, h2] = onePoint(p1, p2, 5);
    console.log(h1); // [1, 1, 0, 0, 1, 1, 0, 0]
    console.log(h2); // [0, 0, 1, 0, 1, 0, 0, 1]
  }
}
`,
    },
  };

  const codeComments = {
    es: {
      title: 'Cruce en un punto para representación binaria.',
      ref: 'Referencias: Holland, J. H. (1975); Syswerda, G. (1989).',
      doc1: 'Hijos del cruce en un punto con corte c (0 < c < n): los hijos intercambian las colas. Si se omite c, se elige al azar.',
      swap: 'Cada hijo: cabeza de su padre y cola del otro',
      example: 'Ejemplo de las transparencias: corte tras la posición 5',
    },
    en: {
      title: 'One-point crossover for binary representations.',
      ref: 'References: Holland, J. H. (1975); Syswerda, G. (1989).',
      doc1: 'Children of one-point crossover with cut c (0 < c < n): the children swap tails. If c is omitted, it is chosen at random.',
      swap: 'Each child: its parent\'s head and the other\'s tail',
      example: 'Example from the slides: cut after position 5',
    },
  };

  const references = [
    C.ref('holland', {
      es: 'Obra fundacional de los algoritmos genéticos, con el análisis del cruce en un punto mediante la teoría de esquemas.',
      en: 'Foundational work on genetic algorithms, analysing one-point crossover through schema theory.',
    }, { original: true }),
    C.ref('syswerda', {
      es: 'Describe los cruces de uno y dos puntos y el uniforme con máscaras de cruce, y los compara.',
      en: 'Describes one-point, two-point and uniform crossover with crossover masks, and compares them.',
    }),
    C.ref('mitchell', {
      es: 'Introducción clásica a los algoritmos genéticos; explica el teorema de los esquemas con el cruce en un punto.',
      en: 'Classic introduction to genetic algorithms; explains the schema theorem with one-point crossover.',
    }),
    C.ref('luke', {
      es: 'Presenta el algoritmo del cruce en un punto que usan las transparencias del curso.',
      en: 'Presents the one-point crossover algorithm used in the course slides.',
    }),
    C.ref('talbi', {
      es: 'Manual de metaheurísticas. Su apartado 3.3.2.2 (pp. 213–215) repasa las propiedades deseables de un cruce (heredabilidad, respeto, validez) y presenta el cruce en un punto y el efecto de disrupción que produce en los extremos del cromosoma.',
      en: 'Metaheuristics textbook. Section 3.3.2.2 (pp. 213–215) reviews the desirable properties of a crossover (heritability, respect, validity) and presents one-point crossover and the disruption it causes at the ends of the chromosome.',
    }),
    C.ref('bautista', {
      es: 'Manual en español de metaheurísticas aplicadas a problemas de ingeniería de organización industrial. El cruce en un punto se trata en el apartado 8.3.1 (p. 186).',
      en: 'Spanish-language textbook on metaheuristics applied to industrial engineering problems. One-point crossover is covered in section 8.3.1 (p. 186).',
    }),
    C.ref('whitley', {
      es: 'Tutorial clásico y muy citado. El apartado 3.1 relaciona el cruce en un punto con los esquemas, y el 3.1.2 explica por qué rompe con más facilidad los esquemas de mayor longitud de definición.',
      en: 'Classic, widely cited tutorial. Section 3.1 relates one-point crossover to schemata, and section 3.1.2 explains why it more easily breaks schemata with a longer defining length.',
    }),
  ];

  const H = C.makeHelpers(codeTemplates, codeComments, pseudocode);
  const api = Object.assign({ id: 'one-point', explanation, narration, pseudocode, keywords, stepLines, fnName, codeTemplates, references }, H);
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).content = root.GAX.content || {})['one-point'] = api;
})(typeof self !== 'undefined' ? self : this);
