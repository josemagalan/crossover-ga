/*
 * Contenido docente del operador ERX (Edge Recombination Crossover): explicación, narración,
 * variantes, pseudocódigo, código descargable y referencias. Misma forma que js/content/cx.js.
 */
(function (root) {
  'use strict';

  const explanation = {
    es: [
      'ERX (Edge Recombination Crossover) lo propusieron Whitley, Starkweather y Fuquay (1989) para el problema del viajante. Parte de una observación: en una ruta lo que cuenta no es en qué posición está cada ciudad, sino qué ciudades van seguidas. Por eso ERX no intenta conservar posiciones (como CX) ni el orden (como OX), sino las aristas: los pares de genes vecinos, leyendo cada padre como un circuito cerrado y sin importar el sentido.',
      'Primero se construye la tabla de adyacencias: para cada gen, la lista de sus vecinos en cualquiera de los dos padres. Cada gen tiene dos vecinos en cada padre, así que su lista tiene entre 2 y 4 genes; cuando un vecino aparece en los dos padres, esa arista es común y solo se anota una vez.',
      'El hijo se construye gen a gen. Se empieza por un gen, se tacha de todas las listas y, mientras al gen actual le queden vecinos, el siguiente es el vecino al que le quedan menos vecinos a su vez (si empatan, al azar). La idea es gastar primero los genes con menos opciones, para no dejarlos aislados más adelante. Si el gen actual se queda sin vecinos («callejón sin salida»), se salta a un gen sin usar elegido al azar: es la única forma de que el hijo tenga una arista que no estaba en ningún padre.',
      'En esta herramienta, el Hijo 1 empieza por el primer gen del Padre 1 y el Hijo 2, por el primer gen del Padre 2, cada uno con la tabla completa. La variante mejorada (Starkweather et al., 1991) da prioridad a las aristas comunes a los dos padres, que se consideran las más prometedoras; con los empates y los saltos al azar, «Sortear de nuevo» repite el sorteo.',
      'Coste: la tabla tiene como mucho 4n entradas; en cada paso se tacha un gen de las listas de sus vecinos y se comparan hasta cuatro candidatos, en tiempo O(n).',
    ],
    en: [
      'ERX (Edge Recombination Crossover) was proposed by Whitley, Starkweather and Fuquay (1989) for the travelling salesman problem. It starts from an observation: in a route what matters is not the position of each city but which cities follow each other. So ERX does not try to preserve positions (like CX) or order (like OX), but edges: pairs of neighbouring genes, reading each parent as a closed circuit and regardless of direction.',
      'First the adjacency table is built: for each gene, the list of its neighbours in either parent. Each gene has two neighbours in each parent, so its list has between 2 and 4 genes; when a neighbour appears in both parents, that edge is shared and is written down only once.',
      'The child is built gene by gene. It starts with one gene, which is crossed out of every list, and while the current gene has neighbours left, the next one is the neighbour that in turn has the fewest neighbours left (ties are broken at random). The idea is to use up first the genes with fewer options, so they are not left isolated later. If the current gene has no neighbours left (a “dead end”), it jumps to an unused gene chosen at random: this is the only way the child can get an edge that was in neither parent.',
      'In this tool, Child 1 starts with the first gene of Parent 1 and Child 2 with the first gene of Parent 2, each with the full table. The enhanced variant (Starkweather et al., 1991) gives priority to the edges shared by both parents, considered the most promising; with ties and random jumps, “Draw again” repeats the draw.',
      'Cost: the table has at most 4n entries; at each step one gene is crossed out of its neighbours’ lists and up to four candidates are compared, in O(n) time.',
    ],
  };

  const variants = {
    original: {
      name: { es: 'Original (Whitley et al., 1989)', en: 'Original (Whitley et al., 1989)' },
      desc: {
        es: 'El siguiente gen es el vecino con la lista más corta; los empates y los callejones sin salida se resuelven al azar.',
        en: 'The next gene is the neighbour with the shortest list; ties and dead ends are resolved at random.',
      },
    },
    enhanced: {
      name: { es: 'Prioridad a las aristas comunes (Starkweather et al., 1991)', en: 'Priority to shared edges (Starkweather et al., 1991)' },
      desc: {
        es: 'Si el gen actual tiene aristas comunes a los dos padres, el siguiente se elige entre ellas; después, la misma regla de la lista más corta.',
        en: 'If the current gene has edges shared by both parents, the next one is chosen among them; then the same shortest-list rule applies.',
      },
    },
  };

  const narration = {
    es: {
      edgeTable: 'Tabla de adyacencias (vecinos de cada gen) · Hijo {child}',
      edgeTableShort: 'Adyacencias · H{child}',
      legendP1: 'Arista (vecino) del Padre 1',
      legendP2: 'Arista (vecino) del Padre 2',
      legendBoth: 'Arista de los dos padres',
      legendJump: 'Salto al azar: arista nueva',
      intro: 'Partimos de dos padres, permutaciones de {n} genes. ERX intenta que los hijos hereden las aristas de los padres: qué genes van seguidos, leyendo cada padre como un circuito (el último gen es vecino del primero).',
      table: 'Tabla de adyacencias: en cada columna, un gen y sus vecinos en el Padre 1 (azul), en el Padre 2 (naranja) o en los dos (mitad y mitad). Cada gen tiene entre 2 y 4 vecinos.',
      tableEnhanced: 'Tabla de adyacencias: en cada columna, un gen y sus vecinos en el Padre 1 (azul), en el Padre 2 (naranja) o en los dos (mitad y mitad). En esta variante, las aristas comunes a los dos padres tienen prioridad.',
      start: 'Hijo {child}: empezamos por el primer gen del Padre {child}, el {v}, y lo tachamos de todas las listas.',
      start2: 'Hijo {child}: volvemos a la tabla completa y empezamos por el primer gen del Padre {child}, el {v}, que tachamos de todas las listas.',
      pick: 'Al {cur} le quedan como vecinos {list} (entre paréntesis, cuántos vecinos le quedan a cada uno). Elegimos el que menos tiene, el {v}, y lo tachamos.',
      pickTie: 'Al {cur} le quedan como vecinos {list}. Empatan {ties} con {cnt} vecinos cada uno: se elige al azar y sale el {v}, que tachamos.',
      pickCommon: 'Al {cur} le quedan como vecinos {list}. Tiene arista común a los dos padres con {common}, así que tiene prioridad: elegimos el {v} y lo tachamos.',
      pickCommonTie: 'Al {cur} le quedan como vecinos {list}. Las aristas comunes, con {common}, tienen prioridad; empatan {ties} con {cnt} vecinos: se elige al azar y sale el {v}.',
      deadEnd: 'Al {cur} ya no le quedan vecinos: es un callejón sin salida. Se elige al azar un gen sin usar ({unused}) y sale el {v}: esta arista no estaba en ningún padre.',
      deadEndLast: 'Al {cur} ya no le quedan vecinos, pero solo queda un gen sin usar, el {v}, que va al final.',
      done: 'Resultado: los dos hijos son permutaciones válidas. De las {n} aristas del circuito de cada hijo, {new1} (Hijo 1) y {new2} (Hijo 2) no estaban en ningún padre: todas las demás se han heredado.',
    },
    en: {
      edgeTable: 'Adjacency table (neighbours of each gene) · Child {child}',
      edgeTableShort: 'Adjacencies · C{child}',
      legendP1: 'Edge (neighbour) from Parent 1',
      legendP2: 'Edge (neighbour) from Parent 2',
      legendBoth: 'Edge from both parents',
      legendJump: 'Random jump: new edge',
      intro: 'We start from two parents, permutations of {n} genes. ERX tries to make the children inherit the parents’ edges: which genes follow each other, reading each parent as a circuit (the last gene is a neighbour of the first).',
      table: 'Adjacency table: each column holds a gene and its neighbours in Parent 1 (blue), Parent 2 (orange) or both (half and half). Each gene has between 2 and 4 neighbours.',
      tableEnhanced: 'Adjacency table: each column holds a gene and its neighbours in Parent 1 (blue), Parent 2 (orange) or both (half and half). In this variant, edges shared by both parents have priority.',
      start: 'Child {child}: we start with the first gene of Parent {child}, {v}, and cross it out of every list.',
      start2: 'Child {child}: we go back to the full table and start with the first gene of Parent {child}, {v}, which we cross out of every list.',
      pick: '{cur} has neighbours {list} left (in brackets, how many neighbours each of them has left). We choose the one with the fewest, {v}, and cross it out.',
      pickTie: '{cur} has neighbours {list} left. {ties} tie with {cnt} neighbours each: one is chosen at random and {v} comes up; we cross it out.',
      pickCommon: '{cur} has neighbours {list} left. It shares an edge with both parents with {common}, which has priority: we choose {v} and cross it out.',
      pickCommonTie: '{cur} has neighbours {list} left. Shared edges, with {common}, have priority; {ties} tie with {cnt} neighbours: one is chosen at random and {v} comes up.',
      deadEnd: '{cur} has no neighbours left: it is a dead end. An unused gene ({unused}) is chosen at random and {v} comes up: this edge was in neither parent.',
      deadEndLast: '{cur} has no neighbours left, but there is only one unused gene, {v}, which goes last.',
      done: 'Result: both children are valid permutations. Of the {n} edges in each child’s circuit, {new1} (Child 1) and {new2} (Child 2) were in neither parent: all the others were inherited.',
    },
  };

  const pseudocode = {
    es: [
      { id: 'sig', indent: 0, text: 'ERX(P1, P2)' },
      { id: 'table', indent: 1, text: 'A ← para cada gen, sus vecinos en P1 y en P2 (leídos como circuitos)' },
      { id: 'start', indent: 1, text: 'actual ← primer gen de P1;   H ← [actual]' },
      { id: 'cross', indent: 1, text: 'tachar actual de todas las listas de A' },
      { id: 'loop', indent: 1, text: 'mientras H no esté completo:' },
      { id: 'if', indent: 2, text: 'si a actual le quedan vecinos en A:' },
      { id: 'common', indent: 3, variants: ['enhanced'], text: 'si alguno comparte arista con los dos padres, quedarse solo con esos' },
      { id: 'choose', indent: 3, text: 'siguiente ← el vecino con menos vecinos restantes (empate: al azar)' },
      { id: 'else', indent: 2, text: 'si no:' },
      { id: 'jump', indent: 3, text: 'siguiente ← un gen sin usar, al azar' },
      { id: 'add', indent: 2, text: 'añadir siguiente a H;   tacharlo de todas las listas;   actual ← siguiente' },
      { id: 'return', indent: 1, text: 'devolver H   (el Hijo 2, igual empezando por el primer gen de P2)' },
    ],
    en: [
      { id: 'sig', indent: 0, text: 'ERX(P1, P2)' },
      { id: 'table', indent: 1, text: 'A ← for each gene, its neighbours in P1 and in P2 (read as circuits)' },
      { id: 'start', indent: 1, text: 'current ← first gene of P1;   C ← [current]' },
      { id: 'cross', indent: 1, text: 'cross current out of every list in A' },
      { id: 'loop', indent: 1, text: 'while C is not complete:' },
      { id: 'if', indent: 2, text: 'if current has neighbours left in A:' },
      { id: 'common', indent: 3, variants: ['enhanced'], text: 'if any shares an edge with both parents, keep only those' },
      { id: 'choose', indent: 3, text: 'next ← the neighbour with the fewest neighbours left (tie: at random)' },
      { id: 'else', indent: 2, text: 'else:' },
      { id: 'jump', indent: 3, text: 'next ← an unused gene, at random' },
      { id: 'add', indent: 2, text: 'append next to C;   cross it out of every list;   current ← next' },
      { id: 'return', indent: 1, text: 'return C   (Child 2: the same, starting with the first gene of P2)' },
    ],
  };
  const keywords = {
    es: ['mientras', 'si no', 'si', 'devolver'],
    en: ['while', 'else', 'if', 'return'],
  };

  const stepLines = {
    intro: ['sig'],
    table: ['table'],
    start: ['start', 'cross'],
    pick: ['loop', 'if', 'choose', 'add'],
    deadEnd: ['loop', 'else', 'jump', 'add'],
    done: ['return'],
  };

  const codeTemplates = {
    python: {
      label: 'Python',
      filename: 'erx.py',
      template: `"""
{{title}}
{{desc}}
{{ref}}
"""
import random


def edges(p):
    """{{edges}}"""
    n = len(p)
    return {frozenset((p[i], p[(i + 1) % n])) for i in range(n)}


def erx_child(start, p1, p2, variant="original", rng=random):
    """{{child}}"""
    table = {g: set() for g in p1}
    for e in edges(p1) | edges(p2):
        a, b = tuple(e)
        table[a].add(b)
        table[b].add(a)
    common = edges(p1) & edges(p2)
    child = [start]
    for lst in table.values():
        lst.discard(start)
    current = start
    while len(child) < len(p1):
        cand = sorted(table[current])
        if cand:
            if variant == "enhanced":
                # {{common}}
                shared = [g for g in cand if frozenset((current, g)) in common]
                cand = shared or cand
            fewest = min(len(table[g]) for g in cand)
            ties = [g for g in cand if len(table[g]) == fewest]
        else:
            # {{jump}}
            ties = sorted(set(p1) - set(child))
        # {{tie}}
        nxt = ties[0] if len(ties) == 1 else ties[int(rng.random() * len(ties))]
        child.append(nxt)
        for lst in table.values():
            lst.discard(nxt)
        current = nxt
    return child


def erx(p1, p2, variant="original", rng=random):
    """{{doc1}}"""
    return erx_child(p1[0], p1, p2, variant, rng), erx_child(p2[0], p1, p2, variant, rng)


if __name__ == "__main__":
    # {{example}}
    random.seed(1)
    p1 = [1, 2, 3, 4, 5, 6, 7, 8, 9]
    p2 = [9, 3, 7, 8, 2, 6, 5, 1, 4]
    h1, h2 = erx(p1, p2)
    print(h1)  # [1, 5, 4, 9, 8, 7, 3, 2, 6]
    print(h2)  # [9, 8, 7, 3, 2, 6, 5, 4, 1]
`,
    },
    javascript: {
      label: 'JavaScript',
      filename: 'erx.js',
      template: `/**
 * {{title}}
 * {{desc}}
 * {{ref}}
 */

/** {{edges}} */
function edges(p) {
  const n = p.length;
  return new Set(p.map((g, i) => {
    const h = p[(i + 1) % n];
    return g < h ? \`\${g}-\${h}\` : \`\${h}-\${g}\`;
  }));
}

/** {{child}} */
function erxChild(start, p1, p2, variant = 'original', random = Math.random) {
  const e1 = edges(p1);
  const e2 = edges(p2);
  const table = new Map(p1.map((g) => [g, new Set()]));
  for (const e of new Set([...e1, ...e2])) {
    const [a, b] = e.split('-').map(Number);
    table.get(a).add(b);
    table.get(b).add(a);
  }
  const key = (a, b) => (a < b ? \`\${a}-\${b}\` : \`\${b}-\${a}\`);
  const child = [start];
  table.forEach((lst) => lst.delete(start));
  let current = start;
  while (child.length < p1.length) {
    let cand = [...table.get(current)].sort((a, b) => a - b);
    let ties;
    if (cand.length) {
      if (variant === 'enhanced') {
        // {{common}}
        const shared = cand.filter((g) => e1.has(key(current, g)) && e2.has(key(current, g)));
        if (shared.length) cand = shared;
      }
      const fewest = Math.min(...cand.map((g) => table.get(g).size));
      ties = cand.filter((g) => table.get(g).size === fewest);
    } else {
      // {{jump}}
      ties = p1.filter((g) => !child.includes(g)).sort((a, b) => a - b);
    }
    // {{tie}}
    const next = ties.length === 1 ? ties[0] : ties[Math.floor(random() * ties.length)];
    child.push(next);
    table.forEach((lst) => lst.delete(next));
    current = next;
  }
  return child;
}

/** {{doc1}} */
function erx(p1, p2, variant = 'original', random = Math.random) {
  return [erxChild(p1[0], p1, p2, variant, random), erxChild(p2[0], p1, p2, variant, random)];
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { erx, erxChild, edges };
  if (require.main === module) {
    // {{example}}
    const p1 = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const p2 = [9, 3, 7, 8, 2, 6, 5, 1, 4];
    console.log(erx(p1, p2));
  }
}
`,
    },
  };

  const codeComments = {
    es: {
      title: 'Cruce ERX (Edge Recombination Crossover) para representación permutacional.',
      desc: 'Los hijos heredan las aristas (pares de genes vecinos) de los padres, leídos como circuitos.',
      ref: 'Referencias: Whitley, Starkweather y Fuquay (1989); variante «enhanced»: Starkweather et al. (1991).',
      edges: 'Aristas de un circuito, sin sentido (el último gen es vecino del primero).',
      child: 'Un hijo de ERX que empieza por el gen start.',
      common: 'Variante mejorada: primero las aristas que comparten los dos padres',
      jump: 'Callejón sin salida: cualquier gen sin usar',
      tie: 'Empate (o salto): al azar, en orden creciente; solo se sortea si hay más de uno',
      doc1: 'Hijos del cruce ERX: el Hijo 1 empieza por el primer gen del Padre 1 y el Hijo 2, por el del Padre 2.',
      example: 'Ejemplo (el resultado depende del sorteo)',
    },
    en: {
      title: 'ERX (Edge Recombination Crossover) for permutation representations.',
      desc: 'The children inherit the edges (pairs of neighbouring genes) of the parents, read as circuits.',
      ref: 'References: Whitley, Starkweather & Fuquay (1989); “enhanced” variant: Starkweather et al. (1991).',
      edges: 'Edges of a circuit, regardless of direction (the last gene is a neighbour of the first).',
      child: 'One ERX child starting with gene start.',
      common: 'Enhanced variant: edges shared by both parents first',
      jump: 'Dead end: any unused gene',
      tie: 'Tie (or jump): at random, in increasing order; only drawn if there is more than one',
      doc1: 'Children of ERX: Child 1 starts with the first gene of Parent 1 and Child 2 with that of Parent 2.',
      example: 'Example (the result depends on the draw)',
    },
  };

  const references = [
    {
      id: 'whitley-1989',
      type: 'inproceedings',
      original: true,
      authors: 'Whitley, D., Starkweather, T., & Fuquay, D.',
      year: '1989',
      title: 'Scheduling problems and traveling salesmen: The genetic edge recombination operator',
      container: 'Proceedings of the Third International Conference on Genetic Algorithms',
      details: { es: '(J. D. Schaffer, ed., pp. 133–140). Morgan Kaufmann', en: '(J. D. Schaffer, Ed., pp. 133–140). Morgan Kaufmann' },
      url: 'https://dl.acm.org/doi/10.5555/645512.657238',
      note: {
        es: 'Artículo original: propone ERX y la tabla de adyacencias, y lo aplica al problema del viajante y a problemas de secuenciación.',
        en: 'Original paper: proposes ERX and the adjacency table, and applies it to the travelling salesman problem and to sequencing problems.',
      },
    },
    {
      id: 'starkweather-1991',
      type: 'inproceedings',
      authors: 'Starkweather, T., McDaniel, S., Mathias, K., Whitley, D., & Whitley, C.',
      year: '1991',
      title: 'A comparison of genetic sequencing operators',
      container: 'Proceedings of the Fourth International Conference on Genetic Algorithms',
      details: { es: '(R. K. Belew y L. B. Booker, eds., pp. 69–76). Morgan Kaufmann', en: '(R. K. Belew & L. B. Booker, Eds., pp. 69–76). Morgan Kaufmann' },
      url: null,
      note: {
        es: 'Compara operadores de secuenciación y presenta la versión mejorada de ERX, que da prioridad a las aristas comunes a los dos padres.',
        en: 'Compares sequencing operators and presents the enhanced version of ERX, which gives priority to the edges shared by both parents.',
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
        es: 'Manual de referencia de computación evolutiva. Presenta el cruce de aristas (edge crossover) con la tabla de adyacencias y la marca de las aristas comunes.',
        en: 'Reference textbook on evolutionary computation. Presents edge crossover with the adjacency table and the marking of shared edges.',
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
        es: 'Revisión de representaciones y operadores para el problema del viajante; describe ERX y lo compara con PMX, OX, CX y otros.',
        en: 'Review of representations and operators for the travelling salesman problem; describes ERX and compares it with PMX, OX, CX and others.',
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
    id: 'erx',
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
  else ((root.GAX = root.GAX || {}).content = root.GAX.content || {}).erx = api;
})(typeof self !== 'undefined' ? self : this);
