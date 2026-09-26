/*
 * Contenido docente del operador OX: explicación, narración, variantes, pseudocódigo,
 * código descargable y referencias. Misma forma que js/content/pmx.js.
 */
(function (root) {
  'use strict';

  const explanation = {
    es: [
      'OX (Order Crossover) procede del «modified crossover» que Davis (1985) propuso para problemas de empaquetado: conservar la primera parte de una lista y ordenar el resto de sus elementos según el orden en que aparecen en otra lista. La versión con dos cortes es la que describe después Goldberg (1989), y Oliver, Smith y Holland (1987) la comparan con PMX y CX en el problema del viajante.',
      'Cada hijo copia el segmento de uno de los padres en las mismas posiciones. El resto de genes sale del otro padre, pero no de sus posiciones: se recorren en el orden en que aparecen en él, se saltan los que ya están en el segmento y se van colocando en los huecos. Así el hijo nunca repite genes y no hace falta ninguna tabla de correspondencias.',
      'Por eso OX conserva sobre todo el orden relativo de los genes, no su posición absoluta: lo que el hijo hereda del segundo padre es qué genes van antes que otros. Encaja con problemas en los que importa la secuencia, como la programación de tareas o las rutas. PMX, en cambio, tiende a conservar posiciones absolutas.',
      'Las variantes difieren en dos detalles: desde dónde se lee el otro padre y por qué hueco se empieza a rellenar. La variante por defecto es la de las transparencias del curso, basadas en los apuntes de Algorítmica de la Universidad de Granada: se lee el otro padre desde el principio y se rellena a partir del segundo corte, dando la vuelta. En la clásica que describe Goldberg también se empieza a leer tras el segundo corte, y en la de izquierda a derecha se rellenan los huecos en orden. Con el selector de variante puedes compararlas con los mismos padres.',
      'Coste: guardando en un conjunto los genes del segmento, cada hijo se construye con un solo recorrido del otro padre, en tiempo O(n).',
    ],
    en: [
      'OX (Order Crossover) derives from the “modified crossover” that Davis (1985) proposed for packing problems: keep the first part of a list and order the rest of its elements as they appear in another list. The two-cut version is the one later described by Goldberg (1989), and Oliver, Smith and Holland (1987) compare it with PMX and CX on the travelling salesman problem.',
      'Each child copies the segment of one parent in the same positions. The remaining genes come from the other parent, but not from their positions: they are visited in the order in which they appear in it, those already in the segment are skipped, and the rest are placed into the gaps. The child therefore never repeats genes and no mapping table is needed.',
      'This is why OX mainly preserves the relative order of genes rather than their absolute position: what the child inherits from the second parent is which genes come before others. It suits problems where the sequence matters, such as task scheduling or routing. PMX, by contrast, tends to preserve absolute positions.',
      'The variants differ in two details: where the other parent is read from and which gap is filled first. The default variant is the one in the course slides, based on the Algorithmics notes of the University of Granada: the other parent is read from the start and the gaps are filled from the second cut, wrapping around. In the classic version described by Goldberg, reading also starts after the second cut, and in the left-to-right version the gaps are filled in order. Use the variant selector to compare them with the same parents.',
      'Cost: storing the segment genes in a set, each child is built with a single pass over the other parent, in O(n) time.',
    ],
  };

  const variants = {
    from_start: {
      name: { es: 'Orden desde el inicio', en: 'Order from the start' },
      desc: {
        es: 'Se lee el otro padre desde el principio y se rellena a partir del segundo corte, dando la vuelta. Es la variante de las transparencias del curso.',
        en: 'The other parent is read from the start and the gaps are filled from the second cut, wrapping around. This is the variant in the course slides.',
      },
    },
    classic: {
      name: { es: 'Clásica (Goldberg, 1989)', en: 'Classic (Goldberg, 1989)' },
      desc: {
        es: 'Se lee el otro padre empezando tras el segundo corte y se rellena también desde ahí, dando la vuelta.',
        en: 'The other parent is read starting after the second cut, and the gaps are filled from there too, wrapping around.',
      },
    },
    left_to_right: {
      name: { es: 'De izquierda a derecha', en: 'Left to right' },
      desc: {
        es: 'Se lee el otro padre desde el principio y los huecos se rellenan de izquierda a derecha.',
        en: 'The other parent is read from the start and the gaps are filled from left to right.',
      },
    },
  };

  const narration = {
    es: {
      orderList: 'Orden de relleno del Hijo {child}',
      intro: 'Partimos de dos padres, permutaciones de {n} elementos. OX conserva un segmento de un padre en su sitio y coloca el resto de genes en el orden relativo en que aparecen en el otro padre.',
      segment: 'Se elige un segmento central: posiciones {from} a {to} ({len} genes).',
      copySeg: 'Cada hijo copia el segmento de su propio padre, en las mismas posiciones: el Hijo 1 el del Padre 1 y el Hijo 2 el del Padre 2.',
      childStart: 'Completamos el Hijo {child}. Los genes que le faltan saldrán del Padre {other}, respetando el orden en que aparecen en él.',
      order_start: 'Recorremos el Padre {other} desde el principio y apuntamos los genes que aún no están en el Hijo {child}: {list}. Se saltan {skipped} porque ya están en el segmento.',
      order_cut: 'Recorremos el Padre {other} empezando tras el segundo corte (posición {start}) y dando la vuelta, y apuntamos los genes que aún no están en el Hijo {child}: {list}. Se saltan {skipped} porque ya están en el segmento.',
      positions_cut: 'Los huecos del Hijo {child} se rellenan empezando tras el segundo corte y dando la vuelta: posiciones {positions}.',
      positions_left: 'Los huecos del Hijo {child} se rellenan de izquierda a derecha: posiciones {positions}.',
      place: 'Posición {pos}: colocamos el gen {v}, el {j}.º de la lista.',
      done_cyclic: 'Resultado: los dos hijos son permutaciones válidas. Cada uno conserva el segmento de su padre en su sitio y, leyendo el hijo en círculo desde el segundo corte, el resto de genes aparece en el mismo orden relativo que en el otro padre.',
      done_linear: 'Resultado: los dos hijos son permutaciones válidas. Cada uno conserva el segmento de su padre en su sitio y, de izquierda a derecha, el resto de genes aparece en el mismo orden relativo que en el otro padre.',
    },
    en: {
      orderList: 'Filling order for Child {child}',
      intro: 'We start from two parents, permutations of {n} elements. OX keeps a segment of one parent in place and places the remaining genes in the relative order in which they appear in the other parent.',
      segment: 'A central segment is chosen: positions {from} to {to} ({len} genes).',
      copySeg: 'Each child copies the segment of its own parent, in the same positions: Child 1 from Parent 1 and Child 2 from Parent 2.',
      childStart: 'We complete Child {child}. Its missing genes will come from Parent {other}, keeping the order in which they appear there.',
      order_start: 'We go through Parent {other} from the start and note the genes not yet in Child {child}: {list}. We skip {skipped} because they are already in the segment.',
      order_cut: 'We go through Parent {other} starting after the second cut (position {start}) and wrapping around, noting the genes not yet in Child {child}: {list}. We skip {skipped} because they are already in the segment.',
      positions_cut: 'The gaps in Child {child} are filled starting after the second cut and wrapping around: positions {positions}.',
      positions_left: 'The gaps in Child {child} are filled from left to right: positions {positions}.',
      place: 'Position {pos}: we place gene {v}, number {j} in the list.',
      done_cyclic: 'Result: both children are valid permutations. Each keeps its parent’s segment in place and, reading the child in a circle from the second cut, the remaining genes appear in the same relative order as in the other parent.',
      done_linear: 'Result: both children are valid permutations. Each keeps its parent’s segment in place and, from left to right, the remaining genes appear in the same relative order as in the other parent.',
    },
  };

  // Pseudocódigo. Las líneas con `variants` solo se muestran en esas variantes.
  const pseudocode = {
    es: [
      { id: 'sig', indent: 0, text: 'OX(P1, P2)' },
      { id: 'cuts', indent: 1, text: 'elegir dos cortes c1 < c2; el segmento son las posiciones [c1, c2)' },
      { id: 'copySeg', indent: 1, text: 'H1[c1..c2) ← P1[c1..c2);   H2[c1..c2) ← P2[c1..c2)' },
      { id: 'forChild', indent: 1, text: 'para cada (H, Q) en {(H1, P2), (H2, P1)}:' },
      { id: 'order', indent: 2, variants: ['from_start', 'left_to_right'], text: 'L ← genes de Q que no están en H, en el orden en que aparecen en Q' },
      { id: 'order', indent: 2, variants: ['classic'], text: 'L ← genes de Q que no están en H, leyendo Q desde c2 y dando la vuelta' },
      { id: 'positions', indent: 2, variants: ['from_start', 'classic'], text: 'huecos de H en el orden c2, …, n−1, 0, …, c1−1' },
      { id: 'positions', indent: 2, variants: ['left_to_right'], text: 'huecos de H en el orden 0, …, c1−1, c2, …, n−1' },
      { id: 'forFree', indent: 2, text: 'para cada hueco i, en ese orden:' },
      { id: 'place', indent: 3, text: 'H[i] ← siguiente gen de L' },
      { id: 'return', indent: 1, text: 'devolver H1, H2' },
    ],
    en: [
      { id: 'sig', indent: 0, text: 'OX(P1, P2)' },
      { id: 'cuts', indent: 1, text: 'choose two cut points c1 < c2; the segment is positions [c1, c2)' },
      { id: 'copySeg', indent: 1, text: 'C1[c1..c2) ← P1[c1..c2);   C2[c1..c2) ← P2[c1..c2)' },
      { id: 'forChild', indent: 1, text: 'for each (C, Q) in {(C1, P2), (C2, P1)}:' },
      { id: 'order', indent: 2, variants: ['from_start', 'left_to_right'], text: 'L ← genes of Q not in C, in the order they appear in Q' },
      { id: 'order', indent: 2, variants: ['classic'], text: 'L ← genes of Q not in C, reading Q from c2 and wrapping around' },
      { id: 'positions', indent: 2, variants: ['from_start', 'classic'], text: 'gaps of C in the order c2, …, n−1, 0, …, c1−1' },
      { id: 'positions', indent: 2, variants: ['left_to_right'], text: 'gaps of C in the order 0, …, c1−1, c2, …, n−1' },
      { id: 'forFree', indent: 2, text: 'for each gap i, in that order:' },
      { id: 'place', indent: 3, text: 'C[i] ← next gene of L' },
      { id: 'return', indent: 1, text: 'return C1, C2' },
    ],
  };
  const keywords = {
    es: ['elegir', 'para cada', 'devolver'],
    en: ['choose', 'for each', 'return'],
  };

  const stepLines = {
    intro: ['sig'],
    segment: ['cuts'],
    copySeg: ['copySeg'],
    childStart: ['forChild'],
    order: ['order'],
    positions: ['positions'],
    place: ['forFree', 'place'],
    done: ['return'],
  };

  const codeTemplates = {
    python: {
      label: 'Python',
      filename: 'ox.py',
      template: `"""
{{title}}
{{desc}}
{{ref}}
"""
import random


def ox(p1, p2, c1=None, c2=None, variant="from_start", rng=random):
    """{{doc1}}

    {{doc2}}
    {{doc3}}
    {{doc4}}
    """
    n = len(p1)
    if c1 is None or c2 is None:
        # {{randomCuts}}
        c1, c2 = sorted(rng.sample(range(1, n), 2))

    def make_child(own, other):
        child = [None] * n
        # {{seg}}
        child[c1:c2] = own[c1:c2]
        taken = set(own[c1:c2])
        # {{reading}}
        reading = other[c2:] + other[:c2] if variant == "classic" else other
        rest = [g for g in reading if g not in taken]
        # {{gaps}}
        if variant == "left_to_right":
            gaps = list(range(c1)) + list(range(c2, n))
        else:
            gaps = list(range(c2, n)) + list(range(c1))
        for i, g in zip(gaps, rest):
            child[i] = g
        return child

    return make_child(p1, p2), make_child(p2, p1)


if __name__ == "__main__":
    # {{example}}
    p1 = [7, 3, 1, 8, 2, 4, 6, 5]
    p2 = [4, 3, 2, 8, 6, 7, 1, 5]
    h1, h2 = ox(p1, p2, 2, 5)
    print(h1)  # [7, 5, 1, 8, 2, 4, 3, 6]
    print(h2)  # [4, 5, 2, 8, 6, 7, 3, 1]
`,
    },
    javascript: {
      label: 'JavaScript',
      filename: 'ox.js',
      template: `/**
 * {{title}}
 * {{desc}}
 * {{ref}}
 *
 * {{doc2}}
 * {{doc3}}
 * {{doc4}}
 */
function ox(p1, p2, c1, c2, variant = 'from_start') {
  const n = p1.length;
  if (c1 === undefined || c2 === undefined) {
    // {{randomCuts}}
    const a = 1 + Math.floor(Math.random() * (n - 1));
    let b = 1 + Math.floor(Math.random() * (n - 2));
    if (b >= a) b++;
    c1 = Math.min(a, b);
    c2 = Math.max(a, b);
  }

  function makeChild(own, other) {
    const child = new Array(n).fill(null);
    // {{seg}}
    for (let i = c1; i < c2; i++) child[i] = own[i];
    const taken = new Set(own.slice(c1, c2));
    // {{reading}}
    const reading = variant === 'classic' ? other.slice(c2).concat(other.slice(0, c2)) : other;
    const rest = reading.filter((g) => !taken.has(g));
    // {{gaps}}
    const gaps = [];
    if (variant === 'left_to_right') {
      for (let i = 0; i < n; i++) if (i < c1 || i >= c2) gaps.push(i);
    } else {
      for (let i = c2; i < n; i++) gaps.push(i);
      for (let i = 0; i < c1; i++) gaps.push(i);
    }
    gaps.forEach((i, j) => { child[i] = rest[j]; });
    return child;
  }

  return [makeChild(p1, p2), makeChild(p2, p1)];
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ox };
  if (require.main === module) {
    // {{example}}
    const p1 = [7, 3, 1, 8, 2, 4, 6, 5];
    const p2 = [4, 3, 2, 8, 6, 7, 1, 5];
    const [h1, h2] = ox(p1, p2, 2, 5);
    console.log(h1); // [7, 5, 1, 8, 2, 4, 3, 6]
    console.log(h2); // [4, 5, 2, 8, 6, 7, 3, 1]
  }
}
`,
    },
  };

  const codeComments = {
    es: {
      title: 'Cruce OX (Order Crossover) para representación permutacional.',
      desc: 'Segmento [c1, c2): cada hijo conserva el segmento de su padre y toma el resto del otro padre, en el orden en que aparecen en él.',
      ref: 'Referencias: Davis, L. (1985); Goldberg, D. E. (1989).',
      doc1: 'Devuelve los dos hijos de cruzar con OX las permutaciones p1 y p2 (misma longitud).',
      doc2: 'c1, c2: cortes, con 0 <= c1 < c2 <= n. Si se omiten, se eligen al azar.',
      doc3: 'variant: "from_start" (se lee el otro padre desde el inicio y se rellena desde c2), "classic" (se lee',
      doc4: 'desde c2 y se rellena desde c2) o "left_to_right" (se lee desde el inicio y se rellena de izquierda a derecha).',
      randomCuts: 'Cortes aleatorios con 1 <= c1 < c2 <= n-1',
      seg: 'El hijo conserva el segmento de su propio padre, en las mismas posiciones',
      reading: 'Genes del otro padre que faltan, en el orden de lectura de la variante',
      gaps: 'Orden en que se rellenan los huecos',
      example: 'Ejemplo de las transparencias: segmento en las posiciones 3 a 5 (índices 2 a 4)',
    },
    en: {
      title: 'OX (Order Crossover) for permutation representations.',
      desc: 'Segment [c1, c2): each child keeps its parent\'s segment and takes the rest from the other parent, in the order they appear there.',
      ref: 'References: Davis, L. (1985); Goldberg, D. E. (1989).',
      doc1: 'Returns the two children of applying OX to permutations p1 and p2 (same length).',
      doc2: 'c1, c2: cut points, with 0 <= c1 < c2 <= n. If omitted, they are chosen at random.',
      doc3: 'variant: "from_start" (read the other parent from the start, fill from c2), "classic" (read',
      doc4: 'from c2, fill from c2) or "left_to_right" (read from the start, fill from left to right).',
      randomCuts: 'Random cut points with 1 <= c1 < c2 <= n-1',
      seg: 'The child keeps its own parent\'s segment, in the same positions',
      reading: 'Missing genes of the other parent, in the reading order of the variant',
      gaps: 'Order in which the gaps are filled',
      example: 'Example from the slides: segment at positions 3 to 5 (indices 2 to 4)',
    },
  };

  const references = [
    {
      id: 'davis-1985',
      type: 'inproceedings',
      original: true,
      authors: 'Davis, L.',
      year: '1985',
      title: 'Applying adaptive algorithms to epistatic domains',
      container: 'Proceedings of the 9th International Joint Conference on Artificial Intelligence',
      details: { es: '(pp. 162–164)', en: '(pp. 162–164)' },
      url: 'https://www.ijcai.org/Proceedings/85-1/Papers/029.pdf',
      note: {
        es: 'Origen de OX: el «modified crossover», con un solo corte, aplicado a listas de rectángulos para empaquetado.',
        en: 'Origin of OX: the “modified crossover”, with a single cut, applied to lists of rectangles for bin packing.',
      },
    },
    {
      id: 'goldberg-1989',
      type: 'book',
      authors: 'Goldberg, D. E.',
      year: '1989',
      title: 'Genetic algorithms in search, optimization, and machine learning',
      details: { es: 'Addison-Wesley', en: 'Addison-Wesley' },
      url: null,
      note: {
        es: 'Describe la versión de OX con dos cortes (la variante clásica de esta herramienta) junto a PMX y CX (p. 174), y resume la diferencia: PMX tiende a respetar la posición absoluta y OX, el orden relativo.',
        en: 'Describes the two-cut version of OX (this tool’s classic variant) alongside PMX and CX (p. 174), and sums up the difference: PMX tends to respect absolute position and OX relative order.',
      },
    },
    {
      id: 'oliver-1987',
      type: 'inproceedings',
      authors: 'Oliver, I. M., Smith, D. J., & Holland, J. R. C.',
      year: '1987',
      title: 'A study of permutation crossover operators on the traveling salesman problem',
      container: 'Genetic algorithms and their applications: Proceedings of the Second International Conference on Genetic Algorithms',
      details: { es: '(J. J. Grefenstette, ed., pp. 224–230). Lawrence Erlbaum', en: '(J. J. Grefenstette, Ed., pp. 224–230). Lawrence Erlbaum' },
      url: 'https://doi.org/10.4324/9780203761595-30',
      note: {
        es: 'Compara PMX, OX y CX en el problema del viajante.',
        en: 'Compares PMX, OX and CX on the travelling salesman problem.',
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
        es: 'Manual de referencia de computación evolutiva, con los operadores de cruce para permutaciones.',
        en: 'Reference textbook on evolutionary computation, including crossover operators for permutations.',
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
        es: 'Manual de metaheurísticas. El apartado 3.3.2.2 (p. 218, fig. 3.19) describe OX leyendo el Padre 2 y rellenando a partir del segundo corte (la variante «Clásica (Goldberg, 1989)» de esta herramienta), y señala que así conserva del Padre 1 el orden relativo, las adyacencias y las posiciones, y del Padre 2 solo el orden relativo.',
        en: 'Metaheuristics textbook. Section 3.3.2.2 (p. 218, fig. 3.19) describes OX reading Parent 2 and filling from the second cut (this tool’s “Classic (Goldberg, 1989)” variant), and notes that it then keeps the relative order, adjacencies and positions of Parent 1, and only the relative order of Parent 2.',
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
        es: 'Manual en español de metaheurísticas aplicadas a problemas de ingeniería de organización industrial. OX («cruzamiento por orden de genes») se trata en el apartado 8.3.3 (p. 188), y el problema del viajante, en el 2.2.',
        en: 'Spanish-language textbook on metaheuristics applied to industrial engineering problems. OX is covered in section 8.3.3 (p. 188), and the travelling salesman problem in section 2.2.',
      },
    },
  ];

  function getCode(kind, lang) {
    const tpl = codeTemplates[kind];
    const comments = codeComments[lang] || codeComments.es;
    return tpl.template.replace(/\{\{(\w+)\}\}/g, (m, k) => (comments[k] != null ? comments[k] : m));
  }

  function pseudocodeFor(lang, variant) {
    return (pseudocode[lang] || pseudocode.es).filter((l) => !l.variants || !variant || l.variants.indexOf(variant) !== -1);
  }

  function getPseudocodeText(lang, variant) {
    return pseudocodeFor(lang, variant).map((l) => '    '.repeat(l.indent) + l.text).join('\n') + '\n';
  }

  const api = {
    id: 'ox',
    explanation,
    narration,
    variants,
    pseudocode,
    pseudocodeFor,
    keywords,
    stepLines,
    codeTemplates,
    references,
    getCode,
    getPseudocodeText,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else ((root.GAX = root.GAX || {}).content = root.GAX.content || {}).ox = api;
})(typeof self !== 'undefined' ? self : this);
