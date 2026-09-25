/*
 * Contenido docente del contraejemplo: cruce en un punto aplicado a permutaciones.
 * Misma forma que js/content/pmx.js.
 */
(function (root) {
  'use strict';

  const explanation = {
    es: [
      'El cruce en un punto es el operador clásico de la representación binaria: se corta a los dos padres por el mismo punto y los hijos intercambian las colas. Con bits funciona porque cualquier combinación de ceros y unos es un cromosoma válido.',
      'Con permutaciones no ocurre lo mismo. La cola del otro padre puede traer genes que ya están en la cabeza del hijo, y a cambio le faltarán otros. En cuanto hay un gen repetido, el hijo deja de ser una permutación: en el problema del viajante sería una ruta que visita dos veces una ciudad y se salta otra.',
      'Además, si un hijo tiene genes repetidos, el otro también, y en la misma cantidad: lo que sobra en uno es exactamente lo que falta en el otro. Solo se salvan los casos en que las dos colas contienen los mismos genes. Por eso la representación permutacional necesita operadores diseñados para ella, como PMX, OX o CX, o bien reparar los hijos después del cruce.',
    ],
    en: [
      'One-point crossover is the classic operator of the binary representation: both parents are cut at the same point and the children swap tails. With bits it works because any combination of zeros and ones is a valid chromosome.',
      'With permutations this is no longer true. The other parent’s tail may bring genes that are already in the child’s head, and in exchange others will be missing. As soon as a gene is repeated, the child is no longer a permutation: in the travelling salesman problem it would be a route that visits one city twice and skips another.',
      'Moreover, if one child has repeated genes, so does the other, and in the same number: what is left over in one is exactly what is missing in the other. Only cases where both tails contain the same genes escape. This is why the permutation representation needs operators designed for it, such as PMX, OX or CX, or else the children must be repaired after crossover.',
    ],
  };

  const narration = {
    es: {
      missingList: 'Genes que faltan',
      missingPill: 'Hijo {child} · faltan {list}',
      intro: 'Partimos de dos padres, permutaciones de {n} elementos, y les aplicamos el cruce en un punto de la representación binaria, sin ninguna precaución.',
      cut: 'Se elige un punto de corte: tras la posición {c}. La cabeza son las posiciones 1 a {c} y la cola, de la {c1} a la {n}.',
      heads: 'Cada hijo copia la cabeza de su padre: el Hijo 1 la del Padre 1 y el Hijo 2 la del Padre 2.',
      tails: 'Y cada hijo recibe la cola del otro padre, posiciones {c1} a {n}, tal cual.',
      checkBoth: 'El Hijo 1 repite {d1} y le faltan {m1}; el Hijo 2 repite {d2} y le faltan {m2}. Ninguno de los dos es una permutación válida.',
      checkNone: 'Esta vez los dos hijos son permutaciones válidas, pero solo por casualidad: las dos colas contienen los mismos genes. Prueba con otros padres o mueve el corte.',
      done: 'Conclusión: el cruce en un punto no sirve para permutaciones. Lo que sobra en un hijo es justo lo que le falta al otro. Hacen falta operadores específicos, como PMX, OX o CX.',
      doneLucky: 'Conclusión: aunque aquí haya salido bien, en la mayoría de los casos el cruce en un punto produce hijos con genes repetidos. Hacen falta operadores específicos, como PMX, OX o CX.',
    },
    en: {
      missingList: 'Missing genes',
      missingPill: 'Child {child} · missing {list}',
      intro: 'We start from two parents, permutations of {n} elements, and apply the one-point crossover of the binary representation to them, without any precaution.',
      cut: 'A cut point is chosen: after position {c}. The head is positions 1 to {c} and the tail, positions {c1} to {n}.',
      heads: 'Each child copies its own parent’s head: Child 1 from Parent 1 and Child 2 from Parent 2.',
      tails: 'And each child receives the other parent’s tail, positions {c1} to {n}, unchanged.',
      checkBoth: 'Child 1 repeats {d1} and is missing {m1}; Child 2 repeats {d2} and is missing {m2}. Neither is a valid permutation.',
      checkNone: 'This time both children are valid permutations, but only by chance: both tails contain the same genes. Try other parents or move the cut.',
      done: 'Conclusion: one-point crossover does not work for permutations. What is left over in one child is exactly what the other is missing. Specific operators such as PMX, OX or CX are needed.',
      doneLucky: 'Conclusion: although it worked here, in most cases one-point crossover produces children with repeated genes. Specific operators such as PMX, OX or CX are needed.',
    },
  };

  const pseudocode = {
    es: [
      { id: 'sig', indent: 0, text: 'CRUCE_EN_UN_PUNTO(P1, P2)' },
      { id: 'cut', indent: 1, text: 'elegir un corte c, con 0 < c < n' },
      { id: 'h1', indent: 1, text: 'H1 ← P1[0..c) seguido de P2[c..n)' },
      { id: 'h2', indent: 1, text: 'H2 ← P2[0..c) seguido de P1[c..n)' },
      { id: 'note', indent: 1, text: '// con permutaciones, H1 y H2 pueden repetir genes y perder otros' },
      { id: 'return', indent: 1, text: 'devolver H1, H2' },
    ],
    en: [
      { id: 'sig', indent: 0, text: 'ONE_POINT_CROSSOVER(P1, P2)' },
      { id: 'cut', indent: 1, text: 'choose a cut point c, with 0 < c < n' },
      { id: 'h1', indent: 1, text: 'C1 ← P1[0..c) followed by P2[c..n)' },
      { id: 'h2', indent: 1, text: 'C2 ← P2[0..c) followed by P1[c..n)' },
      { id: 'note', indent: 1, text: '// with permutations, C1 and C2 may repeat genes and lose others' },
      { id: 'return', indent: 1, text: 'return C1, C2' },
    ],
  };
  const keywords = { es: ['elegir', 'devolver'], en: ['choose', 'return'] };

  const stepLines = {
    intro: ['sig'],
    cut: ['cut'],
    heads: ['h1', 'h2'],
    tails: ['h1', 'h2'],
    check: ['note'],
    done: ['return'],
  };

  // Nombre de la función en el código descargable (el id del operador lleva guiones).
  const fnName = { python: 'one_point', javascript: 'onePoint' };

  const codeTemplates = {
    python: {
      label: 'Python',
      filename: 'one_point.py',
      template: `"""
{{title}}
{{desc}}
"""
import random


def one_point(p1, p2, c=None, rng=random):
    """{{doc1}}"""
    n = len(p1)
    if c is None:
        c = rng.randrange(1, n)
    return p1[:c] + p2[c:], p2[:c] + p1[c:]


def is_permutation(h):
    """{{doc2}}"""
    return sorted(h) == list(range(1, len(h) + 1))


if __name__ == "__main__":
    # {{example}}
    p1 = [1, 2, 3, 4, 5, 6, 7, 8]
    p2 = [2, 4, 6, 8, 7, 5, 3, 1]
    h1, h2 = one_point(p1, p2, 3)
    print(h1)  # [1, 2, 3, 8, 7, 5, 3, 1]
    print(h2)  # [2, 4, 6, 4, 5, 6, 7, 8]
    print(is_permutation(h1), is_permutation(h2))  # False False
`,
    },
    javascript: {
      label: 'JavaScript',
      filename: 'one-point.js',
      template: `/**
 * {{title}}
 * {{desc}}
 */
function onePoint(p1, p2, c) {
  const n = p1.length;
  if (c === undefined) c = 1 + Math.floor(Math.random() * (n - 1));
  return [p1.slice(0, c).concat(p2.slice(c)), p2.slice(0, c).concat(p1.slice(c))];
}

// {{doc2}}
function isPermutation(h) {
  return [...h].sort((a, b) => a - b).every((g, i) => g === i + 1);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { onePoint, isPermutation };
  if (require.main === module) {
    // {{example}}
    const p1 = [1, 2, 3, 4, 5, 6, 7, 8];
    const p2 = [2, 4, 6, 8, 7, 5, 3, 1];
    const [h1, h2] = onePoint(p1, p2, 3);
    console.log(h1); // [1, 2, 3, 8, 7, 5, 3, 1]
    console.log(h2); // [2, 4, 6, 4, 5, 6, 7, 8]
    console.log(isPermutation(h1), isPermutation(h2)); // false false
  }
}
`,
    },
  };

  const codeComments = {
    es: {
      title: 'Contraejemplo: cruce en un punto aplicado a permutaciones.',
      desc: 'Es el cruce clásico de la representación binaria; con permutaciones los hijos pueden repetir genes.',
      doc1: 'Hijos del cruce en un punto con corte c (0 < c < n); si se omite c, se elige al azar.',
      doc2: 'Comprueba si h contiene los números 1..n exactamente una vez.',
      example: 'Corte tras la posición 3: los dos hijos repiten genes',
    },
    en: {
      title: 'Counterexample: one-point crossover applied to permutations.',
      desc: 'It is the classic crossover of the binary representation; with permutations the children may repeat genes.',
      doc1: 'Children of one-point crossover with cut c (0 < c < n); if c is omitted, it is chosen at random.',
      doc2: 'Checks whether h contains the numbers 1..n exactly once.',
      example: 'Cut after position 3: both children repeat genes',
    },
  };

  const references = [
    {
      id: 'goldberg-lingle-1985',
      type: 'inproceedings',
      authors: 'Goldberg, D. E., & Lingle, R.',
      year: '1985',
      title: 'Alleles, loci, and the traveling salesman problem',
      container: 'Proceedings of an International Conference on Genetic Algorithms and Their Applications',
      details: { es: '(J. J. Grefenstette, ed., pp. 154–159). Lawrence Erlbaum', en: '(J. J. Grefenstette, Ed., pp. 154–159). Lawrence Erlbaum' },
      url: 'https://doi.org/10.4324/9781315799674-15',
      note: {
        es: 'Proponen PMX precisamente para poder cruzar permutaciones en el problema del viajante.',
        en: 'They propose PMX precisely to be able to cross permutations in the travelling salesman problem.',
      },
    },
    {
      id: 'eiben-smith-2015',
      type: 'book',
      authors: 'Eiben, A. E., & Smith, J. E.',
      year: '2015',
      title: 'Introduction to evolutionary computing',
      details: { es: '(2.ª ed.). Springer, Natural Computing Series', en: '(2nd ed.). Springer, Natural Computing Series' },
      url: 'https://doi.org/10.1007/978-3-662-44874-8',
      note: {
        es: 'Manual de referencia de computación evolutiva; trata la recombinación para cada tipo de representación.',
        en: 'Reference textbook on evolutionary computation; covers recombination for each type of representation.',
      },
    },
  ];

  function getCode(kind, lang) {
    const tpl = codeTemplates[kind];
    const comments = codeComments[lang] || codeComments.es;
    return tpl.template.replace(/\{\{(\w+)\}\}/g, (m, k) => (comments[k] != null ? comments[k] : m));
  }

  function getPseudocodeText(lang) {
    return (pseudocode[lang] || pseudocode.es).map((l) => '    '.repeat(l.indent) + l.text).join('\n') + '\n';
  }

  const api = {
    id: 'one-point-perm',
    explanation,
    narration,
    pseudocode,
    keywords,
    stepLines,
    fnName,
    codeTemplates,
    references,
    getCode,
    getPseudocodeText,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else ((root.GAX = root.GAX || {}).content = root.GAX.content || {})['one-point-perm'] = api;
})(typeof self !== 'undefined' ? self : this);
