/*
 * Contenido docente del cruce uniforme (representación real).
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const C = isNode ? require('./real-common.js') : root.GAX.contentShared.real;
  const BN = C.binary.narration;

  const explanation = {
    es: [
      'El cruce uniforme de la representación real funciona igual que el de la binaria: para cada posición se sortea un número y, si no supera la probabilidad p, los hijos intercambian ese gen. Los valores no se tocan: cada gen de un hijo es exactamente el de uno de sus padres. Mühlenbein y Schlierkamp-Voosen (1993) lo llaman cruce discreto.',
      'Por eso solo recombina valores que ya existen en la población. A partir de dos padres con 4,0 y 5,0 en una posición, ningún hijo tendrá 4,5: si el mejor valor de una variable no está en ningún individuo, solo la mutación puede acercarse a él. Los cruces aritmético, BLX-α o SBX sí crean valores nuevos, dentro o alrededor del intervalo que forman los padres.',
      'Visto de forma geométrica, si cada individuo es un punto de un espacio de n dimensiones, los hijos del cruce uniforme son vértices del hiperrectángulo que tiene a los dos padres en esquinas opuestas.',
      'Coste: un número aleatorio por gen, en tiempo O(n).',
    ],
    en: [
      'Uniform crossover for real-valued representations works just like the binary one: for each position a number is drawn and, if it does not exceed the probability p, the children swap that gene. The values are not changed: each gene of a child is exactly one of its parents’ genes. Mühlenbein and Schlierkamp-Voosen (1993) call it discrete crossover.',
      'It therefore only recombines values that already exist in the population. From two parents with 4.0 and 5.0 in a position, no child will have 4.5: if the best value of a variable is not present in any individual, only mutation can get close to it. Arithmetic, BLX-α or SBX crossover do create new values, inside or around the interval spanned by the parents.',
      'Geometrically, if each individual is a point in an n-dimensional space, the children of uniform crossover are vertices of the hyperrectangle that has the two parents at opposite corners.',
      'Cost: one random number per gene, in O(n) time.',
    ],
  };

  const narration = {
    es: Object.assign({}, BN.es, {
      paramP: 'Probabilidad de intercambio (p)',
      intro: 'Partimos de dos padres, vectores de {n} números reales.',
      maskIntro: 'Como en la representación binaria, para cada posición se sortea un número r entre 0 y 1 y, si r ≤ p = {p}, los hijos intercambian ese gen. Los valores se copian tal cual, sin modificarlos.',
      drawSwap: 'Posición {pos}: sale r = {r} ≤ {p}, así que los hijos intercambian el gen (máscara 1).',
      drawKeep: 'Posición {pos}: sale r = {r} > {p}, así que cada hijo copia el gen de su padre (máscara 0).',
      done: 'Resultado: {swapped} posiciones intercambiadas y {kept} conservadas. Cada gen de los hijos es exactamente el de uno de los padres: el cruce uniforme no crea valores nuevos. En las {same} posiciones en que los padres coinciden, los hijos tienen ese mismo valor.',
      doneNoSame: 'Resultado: {swapped} posiciones intercambiadas y {kept} conservadas. Cada gen de los hijos es exactamente el de uno de los padres: el cruce uniforme no crea valores nuevos.',
    }),
    en: Object.assign({}, BN.en, {
      paramP: 'Swap probability (p)',
      intro: 'We start from two parents, vectors of {n} real numbers.',
      maskIntro: 'As in the binary representation, for each position a number r between 0 and 1 is drawn and, if r ≤ p = {p}, the children swap that gene. The values are copied as they are, unchanged.',
      drawSwap: 'Position {pos}: r = {r} ≤ {p}, so the children swap the gene (mask 1).',
      drawKeep: 'Position {pos}: r = {r} > {p}, so each child copies its own parent’s gene (mask 0).',
      done: 'Result: {swapped} positions swapped and {kept} kept. Each gene of the children is exactly one of the parents’ genes: uniform crossover creates no new values. In the {same} positions where the parents agree, the children have that same value.',
      doneNoSame: 'Result: {swapped} positions swapped and {kept} kept. Each gene of the children is exactly one of the parents’ genes: uniform crossover creates no new values.',
    }),
  };

  const pseudocode = {
    es: [
      { id: 'sig', indent: 0, text: 'CRUCE_UNIFORME(P1, P2, p)' },
      { id: 'forPos', indent: 1, text: 'para cada posición i:' },
      { id: 'draw', indent: 2, text: 'r ← número aleatorio en [0, 1)' },
      { id: 'swap', indent: 2, text: 'si r ≤ p:  H1[i] ← P2[i];  H2[i] ← P1[i]' },
      { id: 'keep', indent: 2, text: 'si no:     H1[i] ← P1[i];  H2[i] ← P2[i]' },
      { id: 'return', indent: 1, text: 'devolver H1, H2' },
    ],
    en: [
      { id: 'sig', indent: 0, text: 'UNIFORM_CROSSOVER(P1, P2, p)' },
      { id: 'forPos', indent: 1, text: 'for each position i:' },
      { id: 'draw', indent: 2, text: 'r ← random number in [0, 1)' },
      { id: 'swap', indent: 2, text: 'if r ≤ p:  C1[i] ← P2[i];  C2[i] ← P1[i]' },
      { id: 'keep', indent: 2, text: 'else:      C1[i] ← P1[i];  C2[i] ← P2[i]' },
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
      filename: 'uniform_real.py',
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
    p1 = [2.0, 4.5, 1.0, 8.0, 6.5, 3.0]
    p2 = [6.0, 0.5, 3.0, 9.0, 2.5, 7.0]
    h1, h2 = uniform(p1, p2)
    print(h1, h2)
`,
    },
    javascript: {
      label: 'JavaScript',
      filename: 'uniform-real.js',
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
    const p1 = [2.0, 4.5, 1.0, 8.0, 6.5, 3.0];
    const p2 = [6.0, 0.5, 3.0, 9.0, 2.5, 7.0];
    console.log(uniform(p1, p2));
  }
}
`,
    },
  };

  const codeComments = {
    es: {
      title: 'Cruce uniforme (o discreto) para representación real.',
      ref: 'Referencias: Syswerda, G. (1989); Mühlenbein, H. y Schlierkamp-Voosen, D. (1993); Luke, S. (2013).',
      doc1: 'Hijos del cruce uniforme: cada posición se intercambia con probabilidad p; los valores se copian sin modificar.',
      swap: 'Se sortea cada posición por separado',
      example: 'Ejemplo (el resultado depende del sorteo)',
    },
    en: {
      title: 'Uniform (or discrete) crossover for real-valued representations.',
      ref: 'References: Syswerda, G. (1989); Mühlenbein, H. & Schlierkamp-Voosen, D. (1993); Luke, S. (2013).',
      doc1: 'Children of uniform crossover: each position is swapped with probability p; values are copied unchanged.',
      swap: 'Each position is drawn separately',
      example: 'Example (the result depends on the draw)',
    },
  };

  const references = [
    C.ref('luke', {
      es: 'Su algoritmo de cruce uniforme, el de las transparencias del curso, sirve igual para vectores de bits que de reales.',
      en: 'Its uniform crossover algorithm, the one in the course slides, works the same for vectors of bits and of reals.',
    }),
    C.ref('muhlenbein', {
      es: 'Usan este cruce con reales en su algoritmo genético «breeder» y lo llaman cruce discreto.',
      en: 'They use this crossover with reals in their breeder genetic algorithm and call it discrete crossover.',
    }),
    C.ref('syswerda', {
      es: 'Presenta el cruce uniforme, con máscaras de cruce, para cadenas binarias.',
      en: 'Presents uniform crossover, with crossover masks, for binary strings.',
    }),
    C.ref('herrera', {
      es: 'Revisión de los operadores para codificación real, con una comparación experimental; incluye el cruce discreto.',
      en: 'Review of operators for real coding, with an experimental comparison; includes discrete crossover.',
    }),
    C.ref('talbi', {
      es: 'Manual de metaheurísticas. El apartado 3.3.2.2 (pp. 214–215) presenta el cruce uniforme y señala que, en representación real, se usa junto a los de un punto y n puntos.',
      en: 'Metaheuristics textbook. Section 3.3.2.2 (pp. 214–215) presents uniform crossover and notes that, for real-valued representations, it is used alongside one-point and n-point crossover.',
    }),
  ];

  const H = C.makeHelpers(codeTemplates, codeComments, pseudocode);
  const api = Object.assign({ id: 'uniform-real', explanation, narration, pseudocode, keywords, stepLines, fnName, codeTemplates, references }, H);
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).content = root.GAX.content || {})['uniform-real'] = api;
})(typeof self !== 'undefined' ? self : this);
