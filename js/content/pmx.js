/*
 * Contenido docente del operador PMX: explicación, pseudocódigo, código descargable
 * y referencias. Cada operador nuevo (OX, CX...) tendrá un fichero con esta misma forma.
 *
 * Es un fichero de datos: la página lo muestra tal cual y los tests comprueban
 * que el código descargable da los mismos resultados que la herramienta.
 */
(function (root) {
  'use strict';

  const explanation = {
    es: [
      'PMX (Partially Mapped Crossover) fue propuesto por Goldberg y Lingle (1985) para aplicar algoritmos genéticos al problema del viajante. Está pensado para representaciones permutacionales, en las que cada gen debe aparecer exactamente una vez. Un cruce clásico de uno o dos puntos rompería esa restricción y generaría individuos no válidos, con genes repetidos y otros ausentes.',
      'La idea es combinar dos formas de herencia. Cada hijo copia íntegro un segmento de uno de los padres, con esos genes en sus posiciones exactas, y del otro padre toma todos los genes que puede sin moverlos de sitio. Cuando un gen del segundo padre ya está en el hijo porque llegó con el segmento, no se descarta ni se elige otro al azar: se sustituye siguiendo la correspondencia que el segmento establece, posición a posición, entre los dos padres.',
      'A veces una sola correspondencia no basta, porque el gen que se obtiene también está ya en el hijo, y hay que encadenar varias. La cadena nunca pasa dos veces por el mismo gen, así que siempre termina, y el resultado es siempre una permutación válida.',
      'Por construcción, PMX tiende a conservar posiciones absolutas: los genes del segmento conservan la posición que tenían en un padre, y los del otro padre también, salvo los que hay que sustituir. Esto lo hace adecuado cuando importa en qué posición está cada elemento, como en problemas de asignación o de secuenciación. Otros operadores priorizan otras propiedades: OX conserva sobre todo el orden relativo de los genes, CX garantiza que cada gen ocupe la posición que tenía en alguno de los padres, y ERX (recombinación de aristas) intenta conservar las adyacencias, que es lo que importa en el problema del viajante.',
      'Coste: guardando en un diccionario la posición de cada gen del segmento, cada hijo se construye en tiempo O(n). Las cadenas de dos genes distintos nunca se cruzan, así que en total recorren como mucho tantas posiciones como tiene el segmento. Una implementación ingenua que busque cada gen recorriendo el hijo es O(n²).',
    ],
    en: [
      'PMX (Partially Mapped Crossover) was proposed by Goldberg and Lingle (1985) to apply genetic algorithms to the travelling salesman problem. It is designed for permutation representations, in which every gene must appear exactly once. A classic one- or two-point crossover would break that constraint and produce invalid individuals, with some genes repeated and others missing.',
      'The idea is to combine two kinds of inheritance. Each child copies a whole segment from one parent, keeping those genes in their exact positions, and takes from the other parent every gene it can without moving it. When a gene from the second parent is already in the child because it arrived with the segment, it is neither dropped nor replaced at random: it is substituted by following the mapping that the segment defines, position by position, between the two parents.',
      'Sometimes a single mapping is not enough, because the gene obtained is also already in the child, and several mappings must be chained. The chain never visits the same gene twice, so it always ends, and the result is always a valid permutation.',
      'By construction, PMX tends to preserve absolute positions: segment genes keep the position they had in one parent, and so do the genes of the other parent, except those that must be substituted. This makes it suitable when the position of each element matters, as in assignment or sequencing problems. Other operators favour other properties: OX mainly preserves the relative order of genes, CX guarantees that every gene keeps the position it had in one of the parents, and ERX (edge recombination) tries to preserve adjacencies, which is what matters in the travelling salesman problem.',
      'Cost: storing the position of each segment gene in a dictionary, each child is built in O(n) time. The chains of two different genes never meet, so together they visit at most as many positions as the segment has. A naive implementation that searches the child for each gene is O(n²).',
    ],
  };

  // Narración de cada paso de la animación y textos propios de PMX (leyenda, panel auxiliar).
  const narration = {
    es: {
      mappingTable: 'Tabla de correspondencias',
      legendMapped: 'Obtenido por correspondencia',
      intro: 'Partimos de dos padres, permutaciones de {n} elementos. Un cruce ingenuo (por ejemplo, en un punto) produciría hijos con genes repetidos; PMX está diseñado para que los hijos sigan siendo permutaciones válidas.',
      segment: 'Se elige un segmento central: posiciones {from} a {to} ({len} genes).',
      swap: 'Cada hijo recibe el segmento del otro padre: el Hijo 1 hereda el del Padre 2 y el Hijo 2, el del Padre 1.',
      mapping: 'Los genes del segmento que comparten posición forman la tabla de correspondencias: {pairs}. La usaremos para resolver repeticiones.',
      childStart: 'Completamos el Hijo {child} con los genes del Padre {parent} que quedan fuera del segmento, de izquierda a derecha.',
      copy: 'Posición {pos}: el gen {v} del Padre {parent} no está todavía en el Hijo {child}, así que se copia directamente.',
      conflict: 'Posición {pos}: el gen {v} ya está en el Hijo {child} (posición {segPos}, dentro del segmento). Copiarlo lo repetiría, así que consultamos la tabla de correspondencias.',
      mapAgain: '{v} ↔ {w}, pero {w} también está ya en el Hijo {child} (posición {segPos}), así que seguimos la cadena.',
      mapOk: '{v} ↔ {w}, y {w} todavía no está en el Hijo {child}: es el gen que buscamos.',
      place: 'Colocamos {w} en la posición {pos} del Hijo {child}. Cadena seguida: {chain}.',
      done: 'Resultado: los dos hijos son permutaciones válidas. El Hijo 1 conserva el segmento del Padre 2 y {k1} de {out} posiciones del Padre 1; el Hijo 2 conserva el segmento del Padre 1 y {k2} de {out} posiciones del Padre 2.',
    },
    en: {
      mappingTable: 'Mapping table',
      legendMapped: 'Obtained through the mapping',
      intro: 'We start from two parents, permutations of {n} elements. A naive crossover (e.g. one-point) would produce children with repeated genes; PMX is designed so that the children remain valid permutations.',
      segment: 'A central segment is chosen: positions {from} to {to} ({len} genes).',
      swap: 'Each child receives the segment of the other parent: Child 1 inherits Parent 2\'s and Child 2 inherits Parent 1\'s.',
      mapping: 'Segment genes sharing a position form the mapping table: {pairs}. We will use it to resolve repetitions.',
      childStart: 'We complete Child {child} with the genes of Parent {parent} outside the segment, from left to right.',
      copy: 'Position {pos}: gene {v} from Parent {parent} is not yet in Child {child}, so it is copied directly.',
      conflict: 'Position {pos}: gene {v} is already in Child {child} (position {segPos}, inside the segment). Copying it would repeat it, so we look it up in the mapping table.',
      mapAgain: '{v} ↔ {w}, but {w} is also already in Child {child} (position {segPos}), so we follow the chain.',
      mapOk: '{v} ↔ {w}, and {w} is not yet in Child {child}: this is the gene we need.',
      place: 'We place {w} at position {pos} of Child {child}. Chain followed: {chain}.',
      done: 'Result: both children are valid permutations. Child 1 keeps Parent 2\'s segment and {k1} of {out} positions from Parent 1; Child 2 keeps Parent 1\'s segment and {k2} of {out} positions from Parent 2.',
    },
  };

  // Pseudocódigo: cada línea tiene un id para poder resaltarla desde la animación.
  const pseudocode = {
    es: [
      { id: 'sig', indent: 0, text: 'PMX(P1, P2)' },
      { id: 'cuts', indent: 1, text: 'elegir dos cortes c1 < c2; el segmento son las posiciones [c1, c2)' },
      { id: 'copySeg', indent: 1, text: 'H1[c1..c2) ← P2[c1..c2);   H2[c1..c2) ← P1[c1..c2)' },
      { id: 'mapTable', indent: 1, text: '// correspondencias: P1[j] ↔ P2[j] para cada j del segmento' },
      { id: 'forChild', indent: 1, text: 'para cada par (H, P) en {(H1, P1), (H2, P2)}:' },
      { id: 'forOutside', indent: 2, text: 'para cada posición i fuera del segmento:' },
      { id: 'take', indent: 3, text: 'g ← P[i]' },
      { id: 'whileConflict', indent: 3, text: 'mientras g esté en el segmento de H:' },
      { id: 'follow', indent: 4, text: 'g ← P[j], donde j es la posición de g en H' },
      { id: 'place', indent: 3, text: 'H[i] ← g' },
      { id: 'return', indent: 1, text: 'devolver H1, H2' },
    ],
    en: [
      { id: 'sig', indent: 0, text: 'PMX(P1, P2)' },
      { id: 'cuts', indent: 1, text: 'choose two cut points c1 < c2; the segment is positions [c1, c2)' },
      { id: 'copySeg', indent: 1, text: 'C1[c1..c2) ← P2[c1..c2);   C2[c1..c2) ← P1[c1..c2)' },
      { id: 'mapTable', indent: 1, text: '// mapping: P1[j] ↔ P2[j] for every j in the segment' },
      { id: 'forChild', indent: 1, text: 'for each pair (C, P) in {(C1, P1), (C2, P2)}:' },
      { id: 'forOutside', indent: 2, text: 'for each position i outside the segment:' },
      { id: 'take', indent: 3, text: 'g ← P[i]' },
      { id: 'whileConflict', indent: 3, text: 'while g is in the segment of C:' },
      { id: 'follow', indent: 4, text: 'g ← P[j], where j is the position of g in C' },
      { id: 'place', indent: 3, text: 'C[i] ← g' },
      { id: 'return', indent: 1, text: 'return C1, C2' },
    ],
  };
  const keywords = {
    es: ['elegir', 'para cada', 'mientras', 'devolver'],
    en: ['choose', 'for each', 'while', 'return'],
  };

  // Qué líneas del pseudocódigo corresponden a cada tipo de paso de la traza.
  const stepLines = {
    intro: ['sig'],
    segment: ['cuts'],
    swap: ['copySeg'],
    mapping: ['mapTable'],
    childStart: ['forChild', 'forOutside'],
    copy: ['take', 'place'],
    conflict: ['take', 'whileConflict'],
    mapStep: ['follow'],
    place: ['place'],
    done: ['return'],
  };

  // Código descargable. {{clave}} se sustituye por el comentario en el idioma elegido.
  const codeTemplates = {
    python: {
      label: 'Python',
      filename: 'pmx.py',
      template: `"""
{{title}}
{{desc}}
{{ref}}
"""
import random


def pmx(p1, p2, c1=None, c2=None, rng=random):
    """{{doc1}}

    {{doc2}}
    {{doc3}}
    """
    n = len(p1)
    if c1 is None or c2 is None:
        # {{randomCuts}}
        c1, c2 = sorted(rng.sample(range(1, n), 2))

    def make_child(donor, other):
        child = [None] * n
        # {{seg}}
        child[c1:c2] = other[c1:c2]
        # {{pos}}
        pos = {other[j]: j for j in range(c1, c2)}
        for i in list(range(c1)) + list(range(c2, n)):
            g = donor[i]
            # {{chain}}
            while g in pos:
                g = donor[pos[g]]
            child[i] = g
        return child

    return make_child(p1, p2), make_child(p2, p1)


if __name__ == "__main__":
    # {{example}}
    p1 = [1, 2, 3, 4, 5, 6, 7, 8, 9]
    p2 = [4, 5, 2, 1, 8, 7, 6, 9, 3]
    h1, h2 = pmx(p1, p2, 3, 7)
    print(h1)  # [4, 2, 3, 1, 8, 7, 6, 5, 9]
    print(h2)  # [1, 8, 2, 4, 5, 6, 7, 9, 3]
`,
    },
    javascript: {
      label: 'JavaScript',
      filename: 'pmx.js',
      template: `/**
 * {{title}}
 * {{desc}}
 * {{ref}}
 *
 * {{doc2}}
 * {{doc3}}
 */
function pmx(p1, p2, c1, c2) {
  const n = p1.length;
  if (c1 === undefined || c2 === undefined) {
    // {{randomCuts}}
    const a = 1 + Math.floor(Math.random() * (n - 1));
    let b = 1 + Math.floor(Math.random() * (n - 2));
    if (b >= a) b++;
    c1 = Math.min(a, b);
    c2 = Math.max(a, b);
  }

  function makeChild(donor, other) {
    const child = new Array(n).fill(null);
    const pos = new Map();
    for (let j = c1; j < c2; j++) {
      // {{seg}}
      child[j] = other[j];
      // {{pos}}
      pos.set(other[j], j);
    }
    for (let i = 0; i < n; i++) {
      if (i >= c1 && i < c2) continue;
      let g = donor[i];
      // {{chain}}
      while (pos.has(g)) g = donor[pos.get(g)];
      child[i] = g;
    }
    return child;
  }

  return [makeChild(p1, p2), makeChild(p2, p1)];
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { pmx };
  if (require.main === module) {
    // {{example}}
    const p1 = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const p2 = [4, 5, 2, 1, 8, 7, 6, 9, 3];
    const [h1, h2] = pmx(p1, p2, 3, 7);
    console.log(h1); // [4, 2, 3, 1, 8, 7, 6, 5, 9]
    console.log(h2); // [1, 8, 2, 4, 5, 6, 7, 9, 3]
  }
}
`,
    },
  };

  const codeComments = {
    es: {
      title: 'Cruce PMX (Partially Mapped Crossover) para representación permutacional.',
      desc: 'Segmento [c1, c2): el hijo 1 recibe el segmento del padre 2 y el resto del padre 1; el hijo 2, al revés.',
      ref: 'Referencia: Goldberg, D. E. y Lingle, R. (1985). Alleles, loci, and the traveling salesman problem.',
      doc1: 'Devuelve los dos hijos de cruzar con PMX las permutaciones p1 y p2 (misma longitud).',
      doc2: 'c1, c2: cortes, con 0 <= c1 < c2 <= n.',
      doc3: 'Si se omiten, se eligen al azar dejando al menos un gen fuera del segmento a cada lado.',
      randomCuts: 'Cortes aleatorios con 1 <= c1 < c2 <= n-1',
      seg: 'El hijo hereda el segmento del otro padre, en las mismas posiciones',
      pos: 'Posición de cada gen del segmento (equivale a la tabla de correspondencias)',
      chain: 'Si el gen ya está en el segmento, se sigue la correspondencia hasta dar con uno libre',
      example: 'Ejemplo de las transparencias: segmento en las posiciones 4 a 7 (índices 3 a 6)',
    },
    en: {
      title: 'PMX (Partially Mapped Crossover) for permutation representations.',
      desc: 'Segment [c1, c2): child 1 receives the segment of parent 2 and the rest from parent 1; child 2 the other way round.',
      ref: 'Reference: Goldberg, D. E. and Lingle, R. (1985). Alleles, loci, and the traveling salesman problem.',
      doc1: 'Returns the two children of applying PMX to permutations p1 and p2 (same length).',
      doc2: 'c1, c2: cut points, with 0 <= c1 < c2 <= n.',
      doc3: 'If omitted, they are chosen at random leaving at least one gene outside the segment on each side.',
      randomCuts: 'Random cut points with 1 <= c1 < c2 <= n-1',
      seg: 'The child inherits the other parent\'s segment, in the same positions',
      pos: 'Position of each segment gene (equivalent to the mapping table)',
      chain: 'If the gene is already in the segment, follow the mapping until a free one is found',
      example: 'Example from the slides: segment at positions 4 to 7 (indices 3 to 6)',
    },
  };

  // Datos comprobados el 2026-09-25: Goldberg y Lingle (1985) con la bibliografía de Goldberg (1989)
  // y la ficha de la reimpresión en Taylor & Francis; Goldberg (1989) con su página de créditos.
  const references = [
    {
      id: 'goldberg-lingle-1985',
      type: 'inproceedings',
      original: true,
      authors: 'Goldberg, D. E., & Lingle, R.',
      year: '1985',
      title: 'Alleles, loci, and the traveling salesman problem',
      container: 'Proceedings of an International Conference on Genetic Algorithms and Their Applications',
      details: { es: '(J. J. Grefenstette, ed., pp. 154–159). Lawrence Erlbaum', en: '(J. J. Grefenstette, Ed., pp. 154–159). Lawrence Erlbaum' },
      url: 'https://doi.org/10.4324/9781315799674-15',
      note: {
        es: 'Artículo original en el que se propone PMX, aplicado al problema del viajante.',
        en: 'Original paper proposing PMX, applied to the travelling salesman problem.',
      },
    },
    {
      id: 'eiben-smith-2015',
      authors: 'Eiben, A. E., & Smith, J. E.',
      year: '2015',
      title: 'Introduction to evolutionary computing',
      type: 'book',
      details: { es: '(2.ª ed.). Springer, Natural Computing Series', en: '(2nd ed.). Springer, Natural Computing Series' },
      url: 'https://doi.org/10.1007/978-3-662-44874-8',
      note: {
        es: 'Manual de referencia de computación evolutiva. Presenta los operadores de cruce para permutaciones (PMX, de orden, de ciclos y de aristas) con ejemplos.',
        en: 'Reference textbook on evolutionary computation. Presents crossover operators for permutations (PMX, order, cycle and edge crossover) with examples.',
      },
    },
    {
      id: 'larranaga-1999',
      type: 'article',
      authors: 'Larrañaga, P., Kuijpers, C. M. H., Murga, R. H., Inza, I., & Dizdarevic, S.',
      year: '1999',
      title: 'Genetic algorithms for the travelling salesman problem: A review of representations and operators',
      container: 'Artificial Intelligence Review',
      details: { es: '13(2), 129–170', en: '13(2), 129–170' },
      url: 'https://doi.org/10.1023/A:1006529012972',
      note: {
        es: 'Revisión de representaciones y operadores para el problema del viajante. Compara PMX con muchos otros operadores de cruce y mutación.',
        en: 'Review of representations and operators for the travelling salesman problem. Compares PMX with many other crossover and mutation operators.',
      },
    },
    {
      id: 'goldberg-1989',
      authors: 'Goldberg, D. E.',
      year: '1989',
      title: 'Genetic algorithms in search, optimization, and machine learning',
      type: 'book',
      details: { es: 'Addison-Wesley', en: 'Addison-Wesley' },
      url: null,
      note: {
        es: 'Libro clásico sobre algoritmos genéticos, del autor de PMX. Trata los operadores de reordenación para problemas de permutaciones; PMX, en las pp. 170–174.',
        en: 'Classic book on genetic algorithms by the author of PMX. Covers reordering operators for permutation problems; PMX on pp. 170–174.',
      },
    },
    {
      id: 'luke-2013',
      authors: 'Luke, S.',
      year: '2013',
      title: 'Essentials of metaheuristics',
      type: 'book',
      details: { es: '(2.ª ed.). Lulu. Disponible gratis en línea', en: '(2nd ed.). Lulu. Freely available online' },
      url: 'https://people.cs.gmu.edu/~sean/book/metaheuristics/',
      note: {
        es: 'Introducción práctica y gratuita a las metaheurísticas y los algoritmos evolutivos.',
        en: 'Practical, free introduction to metaheuristics and evolutionary algorithms.',
      },
    },
    {
      id: 'talbi-2009',
      type: 'book',
      authors: 'Talbi, E.-G.',
      year: '2009',
      title: 'Metaheuristics: From design to implementation',
      details: { es: 'Wiley', en: 'Wiley' },
      url: 'https://doi.org/10.1002/9780470496916',
      note: {
        es: 'Manual de metaheurísticas. El apartado 3.3.2.2 (pp. 218–219, fig. 3.20) describe PMX con un ejemplo paso a paso.',
        en: 'Metaheuristics textbook. Section 3.3.2.2 (pp. 218–219, fig. 3.20) describes PMX with a step-by-step example.',
      },
    },
    {
      id: 'bautista-valhondo-2020',
      type: 'book',
      authors: 'Bautista-Valhondo, J.',
      year: '2020',
      title: 'Metaheurísticas en ingeniería',
      details: { es: 'Dextra, colección Investigación operativa', en: 'Dextra, Investigación operativa series' },
      url: null,
      note: {
        es: 'Manual en español de metaheurísticas aplicadas a problemas de ingeniería de organización industrial. PMX («cruzamiento por emparejado parcial») se trata en el apartado 8.3.4 (p. 189), y el problema del viajante, en el 2.2.',
        en: 'Spanish-language textbook on metaheuristics applied to industrial engineering problems. PMX is covered in section 8.3.4 (p. 189), and the travelling salesman problem in section 2.2.',
      },
    },
  ];

  function getCode(kind, lang) {
    const tpl = codeTemplates[kind];
    const comments = codeComments[lang] || codeComments.es;
    return tpl.template.replace(/\{\{(\w+)\}\}/g, (m, k) => (comments[k] != null ? comments[k] : m));
  }

  function getPseudocodeText(lang) {
    const lines = pseudocode[lang] || pseudocode.es;
    return lines.map((l) => '    '.repeat(l.indent) + l.text).join('\n') + '\n';
  }

  const api = {
    id: 'pmx',
    explanation,
    narration,
    pseudocode,
    keywords,
    stepLines,
    codeTemplates,
    references,
    getCode,
    getPseudocodeText,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else ((root.GAX = root.GAX || {}).content = root.GAX.content || {}).pmx = api;
})(typeof self !== 'undefined' ? self : this);
