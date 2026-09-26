/*
 * Contenido docente del operador CX: explicación, narración, variantes, pseudocódigo,
 * código descargable y referencias. Misma forma que js/content/pmx.js.
 */
(function (root) {
  'use strict';

  const explanation = {
    es: [
      'CX (Cycle Crossover) fue propuesto por Oliver, Smith y Holland (1987), que lo compararon con PMX y OX en el problema del viajante. Su idea es la más estricta de las tres: cada gen del hijo debe ocupar exactamente la misma posición que tenía en uno de los padres.',
      'Esa exigencia encadena unas posiciones con otras. Si el hijo toma de un padre el gen de la posición i, ese mismo gen no puede llegarle también del otro padre; y como en el otro padre ocupa otra posición j, la posición j también debe tomarse del primer padre. Siguiendo esta cadena siempre se vuelve a la posición de partida: es un ciclo, y todas sus posiciones se toman del mismo padre.',
      'Las posiciones se reparten así en ciclos disjuntos, y lo único que se decide es de qué padre se toma cada ciclo; el segundo hijo toma cada ciclo del otro padre. Por eso CX conserva al máximo las posiciones absolutas y nunca coloca un gen en una posición nueva, pero mezcla poco: si los padres forman un único ciclo, los hijos son copias de ellos.',
      'La variante por defecto es la de las transparencias del curso: cada ciclo empieza en la primera posición libre y su padre se elige al azar (con el botón «Sortear de nuevo» puedes repetir el sorteo). En la que describe Goldberg (1989), el primer ciclo se toma del Padre 1 y todas las posiciones restantes del Padre 2. Otra variante habitual alterna los ciclos entre los dos padres.',
      'Coste: guardando la posición de cada gen en el otro padre, cada salto del ciclo es inmediato y cada posición se visita una sola vez, en tiempo O(n).',
    ],
    en: [
      'CX (Cycle Crossover) was proposed by Oliver, Smith and Holland (1987), who compared it with PMX and OX on the travelling salesman problem. Its idea is the strictest of the three: every gene of the child must occupy exactly the position it had in one of the parents.',
      'That requirement chains positions together. If the child takes the gene at position i from one parent, that same gene cannot also reach it from the other parent; and since in the other parent it sits at another position j, position j must also be taken from the first parent. Following this chain always leads back to the starting position: it is a cycle, and all its positions are taken from the same parent.',
      'The positions thus split into disjoint cycles, and the only decision is which parent each cycle comes from; the second child takes each cycle from the other parent. This is why CX preserves absolute positions as much as possible and never places a gene in a new position, but it mixes little: if the parents form a single cycle, the children are copies of them.',
      'The default variant is the one in the course slides: each cycle starts at the first free position and its parent is chosen at random (use “Draw again” to repeat the draw). In the version described by Goldberg (1989), the first cycle comes from Parent 1 and all remaining positions from Parent 2. Another common variant alternates cycles between the two parents.',
      'Cost: storing the position of each gene in the other parent, each jump along a cycle is immediate and each position is visited once, in O(n) time.',
    ],
  };

  const variants = {
    random: {
      name: { es: 'Ciclos al azar', en: 'Random cycles' },
      desc: {
        es: 'Cada ciclo empieza en la primera posición libre y su padre se elige al azar. Es la variante de las transparencias del curso.',
        en: 'Each cycle starts at the first free position and its parent is chosen at random. This is the variant in the course slides.',
      },
    },
    first_cycle: {
      name: { es: 'Primer ciclo del Padre 1 (Goldberg, 1989)', en: 'First cycle from Parent 1 (Goldberg, 1989)' },
      desc: {
        es: 'El primer ciclo se toma del Padre 1 y todas las demás posiciones, del Padre 2.',
        en: 'The first cycle comes from Parent 1 and all other positions from Parent 2.',
      },
    },
    alternate: {
      name: { es: 'Ciclos alternos', en: 'Alternating cycles' },
      desc: {
        es: 'Los ciclos se toman alternativamente del Padre 1 y del Padre 2, empezando por el Padre 1.',
        en: 'Cycles are taken alternately from Parent 1 and Parent 2, starting with Parent 1.',
      },
    },
  };

  const narration = {
    es: {
      cycleList: 'Ciclos del Hijo 1 (posiciones)',
      cycleShort: 'C{k}',
      legendLink: 'Posición del mismo gen en el otro padre',
      intro: 'Partimos de dos padres, permutaciones de {n} elementos. CX no usa cortes: cada gen de los hijos ocupará la misma posición que en uno de los padres.',
      cycleStartRandom: 'Ciclo {k}: empieza en la primera posición libre, la {pos}. Elegimos al azar entre el {a} del Padre 1 y el {b} del Padre 2: sale el {v}, así que todo este ciclo se toma del Padre {src}.',
      cycleStartAlternate: 'Ciclo {k}: empieza en la primera posición libre, la {pos}. Los ciclos se alternan, así que este se toma del Padre {src}.',
      cycleStartFirst: 'Ciclo {k}: empieza en la posición {pos} y se toma del Padre 1.',
      cycleStep: 'Posición {pos}: el Hijo 1 toma el {v} del Padre {src} (y el Hijo 2, el {w} del Padre {oth}). En el Padre {oth} el {v} está en la posición {next}, así que esa posición también debe tomarse del Padre {src}: el {nextV}.',
      cycleClose: 'Posición {pos}: el Hijo 1 toma el {v} del Padre {src} (y el Hijo 2, el {w}). En el Padre {oth} el {v} está en la posición {start}, donde empezamos: se cierra el ciclo {k} ({positions}).',
      fillRest: 'Todas las posiciones restantes ({positions}) se toman del Padre 2 en el Hijo 1, y del Padre 1 en el Hijo 2, sin seguir más ciclos.',
      done: 'Resultado: {cycles} ciclos. Cada gen de los hijos está en la misma posición que en uno de los padres, así que ambos son permutaciones válidas; el Hijo 2 es el complementario del Hijo 1.',
      doneFirst: 'Resultado: cada gen de los hijos está en la misma posición que en uno de los padres, así que ambos son permutaciones válidas; el Hijo 2 es el complementario del Hijo 1.',
    },
    en: {
      cycleList: 'Cycles of Child 1 (positions)',
      cycleShort: 'C{k}',
      legendLink: 'Position of the same gene in the other parent',
      intro: 'We start from two parents, permutations of {n} elements. CX uses no cut points: every gene of the children will occupy the same position as in one of the parents.',
      cycleStartRandom: 'Cycle {k}: it starts at the first free position, {pos}. We choose at random between Parent 1’s {a} and Parent 2’s {b}: {v} comes up, so this whole cycle is taken from Parent {src}.',
      cycleStartAlternate: 'Cycle {k}: it starts at the first free position, {pos}. Cycles alternate, so this one is taken from Parent {src}.',
      cycleStartFirst: 'Cycle {k}: it starts at position {pos} and is taken from Parent 1.',
      cycleStep: 'Position {pos}: Child 1 takes {v} from Parent {src} (and Child 2 takes {w} from Parent {oth}). In Parent {oth}, {v} is at position {next}, so that position must also come from Parent {src}: {nextV}.',
      cycleClose: 'Position {pos}: Child 1 takes {v} from Parent {src} (and Child 2 takes {w}). In Parent {oth}, {v} is at position {start}, where we began: cycle {k} is closed ({positions}).',
      fillRest: 'All remaining positions ({positions}) are taken from Parent 2 in Child 1, and from Parent 1 in Child 2, without following more cycles.',
      done: 'Result: {cycles} cycles. Every gene of the children is in the same position as in one of the parents, so both are valid permutations; Child 2 is the complement of Child 1.',
      doneFirst: 'Result: every gene of the children is in the same position as in one of the parents, so both are valid permutations; Child 2 is the complement of Child 1.',
    },
  };

  const pseudocode = {
    es: [
      { id: 'sig', indent: 0, text: 'CX(P1, P2)' },
      { id: 'whileFree', indent: 1, text: 'mientras H1 tenga posiciones libres:' },
      { id: 'start', indent: 2, text: 'i0 ← primera posición libre' },
      { id: 'choose', indent: 2, variants: ['random'], text: 'S ← P1 o P2, al azar;   O ← el otro padre' },
      { id: 'choose', indent: 2, variants: ['first_cycle'], text: 'S ← P1 en el primer ciclo, P2 en los demás;   O ← el otro padre' },
      { id: 'choose', indent: 2, variants: ['alternate'], text: 'S ← P1 y P2 por turnos, empezando por P1;   O ← el otro padre' },
      { id: 'init', indent: 2, text: 'i ← i0' },
      { id: 'repeat', indent: 2, text: 'repetir:' },
      { id: 'place', indent: 3, text: 'H1[i] ← S[i];   H2[i] ← O[i]' },
      { id: 'follow', indent: 3, text: 'i ← posición de S[i] en O' },
      { id: 'until', indent: 2, text: 'hasta que i = i0' },
      { id: 'return', indent: 1, text: 'devolver H1, H2' },
    ],
    en: [
      { id: 'sig', indent: 0, text: 'CX(P1, P2)' },
      { id: 'whileFree', indent: 1, text: 'while C1 has free positions:' },
      { id: 'start', indent: 2, text: 'i0 ← first free position' },
      { id: 'choose', indent: 2, variants: ['random'], text: 'S ← P1 or P2, at random;   O ← the other parent' },
      { id: 'choose', indent: 2, variants: ['first_cycle'], text: 'S ← P1 in the first cycle, P2 in the rest;   O ← the other parent' },
      { id: 'choose', indent: 2, variants: ['alternate'], text: 'S ← P1 and P2 in turn, starting with P1;   O ← the other parent' },
      { id: 'init', indent: 2, text: 'i ← i0' },
      { id: 'repeat', indent: 2, text: 'repeat:' },
      { id: 'place', indent: 3, text: 'C1[i] ← S[i];   C2[i] ← O[i]' },
      { id: 'follow', indent: 3, text: 'i ← position of S[i] in O' },
      { id: 'until', indent: 2, text: 'until i = i0' },
      { id: 'return', indent: 1, text: 'return C1, C2' },
    ],
  };
  const keywords = {
    es: ['mientras', 'repetir', 'hasta que', 'devolver'],
    en: ['while', 'repeat', 'until', 'return'],
  };

  const stepLines = {
    intro: ['sig'],
    cycleStart: ['whileFree', 'start', 'choose'],
    cycleStep: ['place', 'follow'],
    cycleClose: ['place', 'follow', 'until'],
    fillRest: ['choose', 'place'],
    done: ['return'],
  };

  const codeTemplates = {
    python: {
      label: 'Python',
      filename: 'cx.py',
      template: `"""
{{title}}
{{desc}}
{{ref}}
"""
import random


def cx(p1, p2, variant="random", rng=random):
    """{{doc1}}

    {{doc2}}
    {{doc3}}
    """
    n = len(p1)
    h1, h2 = [None] * n, [None] * n
    # {{pos}}
    pos1 = {g: i for i, g in enumerate(p1)}
    pos2 = {g: i for i, g in enumerate(p2)}
    k = 0
    while None in h1:
        start = h1.index(None)
        # {{choose}}
        if variant == "random":
            from_p1 = rng.random() < 0.5
        elif variant == "alternate":
            from_p1 = k % 2 == 0
        else:  # "first_cycle"
            from_p1 = k == 0
        s, o, pos_o = (p1, p2, pos2) if from_p1 else (p2, p1, pos1)
        # {{cycle}}
        i = start
        while True:
            h1[i], h2[i] = s[i], o[i]
            i = pos_o[s[i]]
            if i == start:
                break
        k += 1
    return h1, h2


if __name__ == "__main__":
    # {{example}}
    p1 = [1, 2, 3, 4, 5, 6, 7, 8]
    p2 = [2, 4, 6, 8, 7, 5, 3, 1]
    h1, h2 = cx(p1, p2, variant="alternate")
    print(h1)  # [1, 2, 6, 4, 7, 5, 3, 8]
    print(h2)  # [2, 4, 3, 8, 5, 6, 7, 1]
`,
    },
    javascript: {
      label: 'JavaScript',
      filename: 'cx.js',
      template: `/**
 * {{title}}
 * {{desc}}
 * {{ref}}
 *
 * {{doc2}}
 * {{doc3}}
 */
function cx(p1, p2, variant = 'random', random = Math.random) {
  const n = p1.length;
  const h1 = new Array(n).fill(null);
  const h2 = new Array(n).fill(null);
  // {{pos}}
  const pos1 = new Map(p1.map((g, i) => [g, i]));
  const pos2 = new Map(p2.map((g, i) => [g, i]));
  let k = 0;
  while (h1.includes(null)) {
    const start = h1.indexOf(null);
    // {{choose}}
    let fromP1;
    if (variant === 'random') fromP1 = random() < 0.5;
    else if (variant === 'alternate') fromP1 = k % 2 === 0;
    else fromP1 = k === 0; // 'first_cycle'
    const [s, o, posO] = fromP1 ? [p1, p2, pos2] : [p2, p1, pos1];
    // {{cycle}}
    let i = start;
    do {
      h1[i] = s[i];
      h2[i] = o[i];
      i = posO.get(s[i]);
    } while (i !== start);
    k++;
  }
  return [h1, h2];
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { cx };
  if (require.main === module) {
    // {{example}}
    const p1 = [1, 2, 3, 4, 5, 6, 7, 8];
    const p2 = [2, 4, 6, 8, 7, 5, 3, 1];
    const [h1, h2] = cx(p1, p2, 'alternate');
    console.log(h1); // [1, 2, 6, 4, 7, 5, 3, 8]
    console.log(h2); // [2, 4, 3, 8, 5, 6, 7, 1]
  }
}
`,
    },
  };

  const codeComments = {
    es: {
      title: 'Cruce CX (Cycle Crossover) para representación permutacional.',
      desc: 'Cada gen de los hijos ocupa la misma posición que en uno de los padres; el Hijo 2 es el complementario del Hijo 1.',
      ref: 'Referencias: Oliver, Smith y Holland (1987); Goldberg (1989).',
      doc1: 'Devuelve los dos hijos de cruzar con CX las permutaciones p1 y p2 (misma longitud).',
      doc2: 'variant: "random" (el padre de cada ciclo se elige al azar), "first_cycle" (primer ciclo de p1,',
      doc3: 'el resto de p2) o "alternate" (ciclos alternos, empezando por p1). Cada ciclo empieza en la primera posición libre.',
      pos: 'Posición de cada gen en cada padre',
      choose: 'Padre del que se toma este ciclo en el Hijo 1',
      cycle: 'Recorrer el ciclo: la posición del gen S[i] en el otro padre también se toma de S',
      example: 'Ejemplo de las transparencias: con ciclos alternos, el primero sale del Padre 1 y el segundo del Padre 2',
    },
    en: {
      title: 'CX (Cycle Crossover) for permutation representations.',
      desc: 'Every gene of the children keeps the position it had in one of the parents; Child 2 is the complement of Child 1.',
      ref: 'References: Oliver, Smith and Holland (1987); Goldberg (1989).',
      doc1: 'Returns the two children of applying CX to permutations p1 and p2 (same length).',
      doc2: 'variant: "random" (the parent of each cycle is chosen at random), "first_cycle" (first cycle from p1,',
      doc3: 'the rest from p2) or "alternate" (alternating cycles, starting with p1). Each cycle starts at the first free position.',
      pos: 'Position of each gene in each parent',
      choose: 'Parent this cycle is taken from in Child 1',
      cycle: 'Follow the cycle: the position of gene S[i] in the other parent is also taken from S',
      example: 'Example from the slides: with alternating cycles, the first comes from Parent 1 and the second from Parent 2',
    },
  };

  const references = [
    {
      id: 'oliver-1987',
      type: 'inproceedings',
      original: true,
      authors: 'Oliver, I. M., Smith, D. J., & Holland, J. R. C.',
      year: '1987',
      title: 'A study of permutation crossover operators on the traveling salesman problem',
      container: 'Genetic algorithms and their applications: Proceedings of the Second International Conference on Genetic Algorithms',
      details: { es: '(J. J. Grefenstette, ed., pp. 224–230). Lawrence Erlbaum', en: '(J. J. Grefenstette, Ed., pp. 224–230). Lawrence Erlbaum' },
      url: 'https://doi.org/10.4324/9780203761595-30',
      note: {
        es: 'Artículo en el que se propone CX y se compara con PMX y OX en el problema del viajante.',
        en: 'Paper proposing CX and comparing it with PMX and OX on the travelling salesman problem.',
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
        es: 'Describe CX con un ejemplo paso a paso (pp. 174–175): el primer ciclo sale de un padre y el resto de posiciones, del otro.',
        en: 'Describes CX with a step-by-step example (pp. 174–175): the first cycle comes from one parent and the remaining positions from the other.',
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
      id: 'larranaga-1999',
      type: 'article',
      authors: 'Larrañaga, P., Kuijpers, C. M. H., Murga, R. H., Inza, I., & Dizdarevic, S.',
      year: '1999',
      title: 'Genetic algorithms for the travelling salesman problem: A review of representations and operators',
      container: 'Artificial Intelligence Review',
      details: { es: '13(2), 129–170', en: '13(2), 129–170' },
      url: 'https://doi.org/10.1023/A:1006529012972',
      note: {
        es: 'Revisión de representaciones y operadores para el problema del viajante.',
        en: 'Review of representations and operators for the travelling salesman problem.',
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
        es: 'Manual de metaheurísticas. En el apartado 3.3.2.2 (p. 219) cita el cruce de ciclos entre otros cruces para permutaciones, como el que conserva las posiciones absolutas de los genes.',
        en: 'Metaheuristics textbook. In section 3.3.2.2 (p. 219) it lists cycle crossover among other permutation crossovers, as the one that preserves the absolute positions of the genes.',
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
    id: 'cx',
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
  else ((root.GAX = root.GAX || {}).content = root.GAX.content || {}).cx = api;
})(typeof self !== 'undefined' ? self : this);
