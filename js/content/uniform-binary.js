/*
 * Contenido docente del cruce uniforme (representación binaria).
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const C = isNode ? require('./binary-common.js') : root.GAX.contentShared.binary;

  const explanation = {
    es: [
      'En el cruce uniforme no hay cortes: cada posición se decide por separado. Para cada gen se sortea un número aleatorio y, si no supera la probabilidad p, los hijos intercambian ese gen. La idea aparece en Ackley (1987), y Syswerda (1989) la presentó con la máscara de cruce y la comparó con los cruces de uno y dos puntos, frente a los que resultó mejor en la mayoría de sus pruebas.',
      'Con p = 0,5, la versión original, cada bit de la máscara vale 1 con probabilidad 0,5. Con valores menores (cruce uniforme parametrizado) se intercambian menos genes y los hijos se parecen más a sus padres. No tiene sentido usar p > 0,5: equivaldría a usar 1 − p y cambiar los nombres de los hijos.',
      'A diferencia de los cruces por cortes, el uniforme no depende de la posición: dos genes lejanos tienen la misma probabilidad de viajar juntos que dos contiguos. Por eso mezcla mucho más a los padres, pero también rompe con facilidad los grupos de genes que conviene mantener unidos.',
      'Coste: un número aleatorio por gen, en tiempo O(n).',
    ],
    en: [
      'Uniform crossover has no cut points: each position is decided separately. For each gene a random number is drawn and, if it does not exceed the probability p, the children swap that gene. The idea appears in Ackley (1987), and Syswerda (1989) presented it with the crossover mask and compared it with one- and two-point crossover, outperforming them in most of his tests.',
      'With p = 0.5, the original version, each mask bit is 1 with probability 0.5. With smaller values (parameterised uniform crossover) fewer genes are swapped and the children resemble their parents more. Using p > 0.5 makes no sense: it would be equivalent to using 1 − p and swapping the children’s names.',
      'Unlike cut-based crossovers, uniform crossover does not depend on position: two distant genes are as likely to travel together as two neighbouring ones. It therefore mixes the parents much more, but it also easily breaks groups of genes that should stay together.',
      'Cost: one random number per gene, in O(n) time.',
    ],
  };

  const narration = {
    es: Object.assign({}, C.narration.es, {
      paramP: 'Probabilidad de intercambio (p)',
      maskIntro: 'En el cruce uniforme no hay cortes: para cada posición se sortea un número r entre 0 y 1 y, si r ≤ p = {p}, los hijos intercambian ese gen. La máscara se forma posición a posición.',
      drawSwap: 'Posición {pos}: sale r = {r} ≤ {p}, así que los hijos intercambian el gen (máscara 1).',
      drawKeep: 'Posición {pos}: sale r = {r} > {p}, así que cada hijo copia el gen de su padre (máscara 0).',
    }),
    en: Object.assign({}, C.narration.en, {
      paramP: 'Swap probability (p)',
      maskIntro: 'Uniform crossover has no cut points: for each position a number r between 0 and 1 is drawn and, if r ≤ p = {p}, the children swap that gene. The mask is built position by position.',
      drawSwap: 'Position {pos}: r = {r} ≤ {p}, so the children swap the gene (mask 1).',
      drawKeep: 'Position {pos}: r = {r} > {p}, so each child copies its own parent’s gene (mask 0).',
    }),
  };

  const pseudocode = {
    es: [
      { id: 'sig', indent: 0, text: 'CRUCE_UNIFORME(P1, P2, p)' },
      { id: 'forPos', indent: 1, text: 'para cada posición i:' },
      { id: 'draw', indent: 2, text: 'r ← número aleatorio en [0, 1)' },
      { id: 'swap', indent: 2, text: 'si r ≤ p:  H1[i] ← P2[i];  H2[i] ← P1[i]      // M[i] = 1' },
      { id: 'keep', indent: 2, text: 'si no:     H1[i] ← P1[i];  H2[i] ← P2[i]      // M[i] = 0' },
      { id: 'return', indent: 1, text: 'devolver H1, H2' },
    ],
    en: [
      { id: 'sig', indent: 0, text: 'UNIFORM_CROSSOVER(P1, P2, p)' },
      { id: 'forPos', indent: 1, text: 'for each position i:' },
      { id: 'draw', indent: 2, text: 'r ← random number in [0, 1)' },
      { id: 'swap', indent: 2, text: 'if r ≤ p:  C1[i] ← P2[i];  C2[i] ← P1[i]      // M[i] = 1' },
      { id: 'keep', indent: 2, text: 'else:      C1[i] ← P1[i];  C2[i] ← P2[i]      // M[i] = 0' },
      { id: 'return', indent: 1, text: 'return C1, C2' },
    ],
  };
  const keywords = { es: ['para cada', 'si no', 'si', 'devolver'], en: ['for each', 'else', 'if', 'return'] };
  const stepLines = {
    intro: ['sig'],
    maskIntro: ['forPos'],
    drawSwap: ['draw', 'swap'],
    drawKeep: ['draw', 'keep'],
    done: ['return'],
  };
  const fnName = { python: 'uniform', javascript: 'uniform' };

  const codeTemplates = {
    python: {
      label: 'Python',
      filename: 'uniform.py',
      template: `"""
{{title}}
{{ref}}
"""
import random


def uniform(p1, p2, p=0.5, rng=random):
    """{{doc1}}"""
    h1, h2 = list(p1), list(p2)
    for i in range(len(p1)):
        # {{swap}}
        if rng.random() <= p:
            h1[i], h2[i] = p2[i], p1[i]
    return h1, h2


if __name__ == "__main__":
    # {{example}}
    random.seed(1)
    p1 = [1, 1, 0, 0, 1, 0, 0, 1]
    p2 = [0, 0, 1, 0, 1, 1, 0, 0]
    h1, h2 = uniform(p1, p2)
    print(h1, h2)
`,
    },
    javascript: {
      label: 'JavaScript',
      filename: 'uniform.js',
      template: `/**
 * {{title}}
 * {{ref}}
 *
 * {{doc1}}
 */
function uniform(p1, p2, p = 0.5, random = Math.random) {
  const h1 = p1.slice();
  const h2 = p2.slice();
  for (let i = 0; i < p1.length; i++) {
    // {{swap}}
    if (random() <= p) {
      h1[i] = p2[i];
      h2[i] = p1[i];
    }
  }
  return [h1, h2];
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { uniform };
  if (require.main === module) {
    // {{example}}
    const p1 = [1, 1, 0, 0, 1, 0, 0, 1];
    const p2 = [0, 0, 1, 0, 1, 1, 0, 0];
    console.log(uniform(p1, p2));
  }
}
`,
    },
  };

  const codeComments = {
    es: {
      title: 'Cruce uniforme para representación binaria.',
      ref: 'Referencias: Ackley, D. H. (1987); Syswerda, G. (1989).',
      doc1: 'Hijos del cruce uniforme: cada posición se intercambia con probabilidad p (0,5 en la versión original).',
      swap: 'Se sortea cada posición por separado',
      example: 'Ejemplo con los padres de las transparencias (el resultado depende del sorteo)',
    },
    en: {
      title: 'Uniform crossover for binary representations.',
      ref: 'References: Ackley, D. H. (1987); Syswerda, G. (1989).',
      doc1: 'Children of uniform crossover: each position is swapped with probability p (0.5 in the original version).',
      swap: 'Each position is drawn separately',
      example: 'Example with the parents from the slides (the result depends on the draw)',
    },
  };

  const references = [
    C.ref('syswerda', {
      es: 'Presenta el cruce uniforme con máscaras de cruce y lo compara con los de uno y dos puntos.',
      en: 'Presents uniform crossover with crossover masks and compares it with one- and two-point crossover.',
    }),
    {
      id: 'ackley-1987',
      type: 'book',
      authors: 'Ackley, D. H.',
      year: '1987',
      title: 'A connectionist machine for genetic hillclimbing',
      details: { es: 'Kluwer Academic Publishers', en: 'Kluwer Academic Publishers' },
      url: null,
      note: {
        es: 'Primera aparición del cruce uniforme, según Syswerda (1989) y Luke (2013).',
        en: 'First appearance of uniform crossover, according to Syswerda (1989) and Luke (2013).',
      },
    },
    C.ref('luke', {
      es: 'Presenta el cruce uniforme parametrizado que usan las transparencias del curso.',
      en: 'Presents the parameterised uniform crossover used in the course slides.',
    }),
    C.ref('mitchell', {
      es: 'Introducción clásica a los algoritmos genéticos, con ejemplos de uso del cruce uniforme.',
      en: 'Classic introduction to genetic algorithms, with examples using uniform crossover.',
    }),
    C.ref('talbi', {
      es: 'Manual de metaheurísticas. El apartado 3.3.2.2 (pp. 214–215, fig. 3.17) presenta el cruce uniforme: cada gen se toma al azar de uno de los padres, sin depender del tamaño de los segmentos.',
      en: 'Metaheuristics textbook. Section 3.3.2.2 (pp. 214–215, fig. 3.17) presents uniform crossover: each gene is taken at random from one of the parents, regardless of segment size.',
    }),
    C.ref('whitley', {
      es: 'El apartado 4.2.1 analiza el cruce uniforme: cada bit se hereda de forma independiente, sin ligamiento entre bits, y la probabilidad de romper un esquema depende solo de su orden, no de su longitud de definición.',
      en: 'Section 4.2.1 analyses uniform crossover: each bit is inherited independently, with no linkage between bits, and the probability of breaking a schema depends only on its order, not on its defining length.',
    }),
  ];

  const H = C.makeHelpers(codeTemplates, codeComments, pseudocode);
  const api = Object.assign({ id: 'uniform-binary', explanation, narration, pseudocode, keywords, stepLines, fnName, codeTemplates, references }, H);
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).content = root.GAX.content || {})['uniform-binary'] = api;
})(typeof self !== 'undefined' ? self : this);
