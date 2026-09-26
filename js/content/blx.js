/*
 * Contenido docente del cruce BLX-α (representación real).
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const C = isNode ? require('./real-common.js') : root.GAX.contentShared.real;

  const explanation = {
    es: [
      'En el cruce BLX-α cada gen de los hijos se sortea, por separado, en un intervalo algo más ancho que el que forman los padres: si I es la distancia entre los dos genes, el intervalo se amplía α·I hacia cada lado. Con α = 0 es el cruce plano de Radcliffe (1990): los hijos quedan siempre dentro del intervalo de los padres, pero con un valor nuevo, no una copia. Eshelman y Schaffer (1993) lo generalizaron con el parámetro α para poder salir de ese intervalo.',
      'En sus pruebas, BLX-0,5 dio mejor resultado que otros valores de α, aunque no hay un valor que sea mejor en todos los problemas: cuanto mayor es α, más lejos de los padres pueden caer los hijos, lo que ayuda a explorar pero también puede alejar la búsqueda de una zona prometedora.',
      'A diferencia del cruce uniforme y del aritmético, que nunca salen del intervalo entre los padres, BLX-α (con α > 0) sí puede crear valores fuera de él. Esto le permite seguir progresando aunque el óptimo esté fuera de la región que cubre la población en ese momento, algo que Herrera, Lozano y Verdegay (1998) señalan como una de sus ventajas frente a los cruces que solo interpolan.',
      'Coste: dos números aleatorios por gen (uno por cada hijo), en tiempo O(n).',
    ],
    en: [
      'In BLX-α crossover each child gene is drawn, separately, from an interval somewhat wider than the one spanned by the parents: if I is the distance between the two genes, the interval is widened by α·I on each side. With α = 0 it is Radcliffe’s flat crossover (1990): the children always stay inside the parents’ interval, but with a new value rather than a copy. Eshelman and Schaffer (1993) generalised it with the parameter α so it could step outside that interval.',
      'In their experiments, BLX-0.5 performed better than other values of α, although no single value is best for every problem: the larger α is, the further from the parents the children can land, which helps exploration but can also pull the search away from a promising region.',
      'Unlike uniform and arithmetic crossover, which never leave the interval between the parents, BLX-α (with α > 0) can create values outside it. This lets it keep making progress even when the optimum lies outside the region the population currently covers, which Herrera, Lozano and Verdegay (1998) point out as one of its advantages over crossovers that only interpolate.',
      'Cost: two random numbers per gene (one per child), in O(n) time.',
    ],
  };

  const narration = {
    es: Object.assign({}, C.narration.es, {
      paramALPHA: 'Ampliación del intervalo (α)',
      intro: 'Partimos de dos padres, vectores de {n} números reales.',
      alphaIntro: 'Con α = {alpha}, en cada posición el intervalo entre los padres se amplía α veces su anchura I hacia cada lado, y los dos hijos se sortean, cada uno por separado, dentro de ese intervalo ampliado.',
      gene: 'Posición {pos}: el intervalo de los padres es [{cmin}, {cmax}] (anchura I = {width}), ampliado a [{lo}, {hi}]. H1 sale con r₁ = {r1} → {h1}; H2, con r₂ = {r2} → {h2}.',
      geneSame: 'Posición {pos}: los padres coinciden en {cmin}, así que el intervalo ampliado es ese mismo punto: H1 = H2 = {h1}.',
      done: 'Resultado: con α = {alpha}, en cada posición los hijos pueden caer hasta un {alpha} de la anchura del intervalo por fuera de él, a cualquiera de los dos lados. Cuanto mayor es α, más lejos de los padres pueden llegar.',
      doneFlat: 'Resultado: con α = 0 (cruce plano de Radcliffe), los hijos quedan siempre dentro del intervalo de los padres en todas las posiciones, como en el cruce uniforme, pero con un valor nuevo en vez de una copia.',
    }),
    en: Object.assign({}, C.narration.en, {
      paramALPHA: 'Interval widening (α)',
      intro: 'We start from two parents, vectors of {n} real numbers.',
      alphaIntro: 'With α = {alpha}, at each position the interval between the parents is widened by α times its width I on each side, and the two children are each drawn separately from within that widened interval.',
      gene: 'Position {pos}: the parents’ interval is [{cmin}, {cmax}] (width I = {width}), widened to [{lo}, {hi}]. C1 comes out with r₁ = {r1} → {h1}; C2, with r₂ = {r2} → {h2}.',
      geneSame: 'Position {pos}: the parents agree at {cmin}, so the widened interval is that same point: C1 = C2 = {h1}.',
      done: 'Result: with α = {alpha}, at each position the children can land up to α times the interval’s width outside it, on either side. The larger α is, the further from the parents they can go.',
      doneFlat: 'Result: with α = 0 (Radcliffe’s flat crossover), the children always stay inside the parents’ interval at every position, as in uniform crossover, but with a new value instead of a copy.',
    }),
  };

  const pseudocode = {
    es: [
      { id: 'sig', indent: 0, text: 'BLX_α(P1, P2, α)' },
      { id: 'forPos', indent: 1, text: 'para cada posición i:' },
      { id: 'interval', indent: 2, text: 'cmin ← mín(P1[i], P2[i]); cmax ← máx(P1[i], P2[i]); I ← cmax − cmin' },
      { id: 'h1', indent: 2, text: 'H1[i] ← número aleatorio uniforme en [cmin − α·I, cmax + α·I]' },
      { id: 'h2', indent: 2, text: 'H2[i] ← número aleatorio uniforme en [cmin − α·I, cmax + α·I]' },
      { id: 'return', indent: 1, text: 'devolver H1, H2' },
    ],
    en: [
      { id: 'sig', indent: 0, text: 'BLX_ALPHA(P1, P2, α)' },
      { id: 'forPos', indent: 1, text: 'for each position i:' },
      { id: 'interval', indent: 2, text: 'cmin ← min(P1[i], P2[i]); cmax ← max(P1[i], P2[i]); I ← cmax − cmin' },
      { id: 'h1', indent: 2, text: 'C1[i] ← uniform random number in [cmin − α·I, cmax + α·I]' },
      { id: 'h2', indent: 2, text: 'C2[i] ← uniform random number in [cmin − α·I, cmax + α·I]' },
      { id: 'return', indent: 1, text: 'return C1, C2' },
    ],
  };
  const keywords = { es: ['para cada', 'devolver'], en: ['for each', 'return'] };
  const stepLines = {
    intro: ['sig'],
    alphaIntro: ['forPos'],
    gene: ['forPos', 'interval', 'h1', 'h2'],
    done: ['return'],
  };
  const fnName = { python: 'blx', javascript: 'blx' };

  const codeTemplates = {
    python: {
      label: 'Python',
      filename: 'blx.py',
      template: `"""
{{title}}
{{ref}}
"""
import random


def blx(p1, p2, alpha=0.5, rng=random):
    """{{doc1}}"""
    h1, h2 = [], []
    for a, b in zip(p1, p2):
        cmin, cmax = min(a, b), max(a, b)
        width = cmax - cmin
        lo, hi = cmin - alpha * width, cmax + alpha * width
        h1.append(lo + rng.random() * (hi - lo))  # {{draw}}
        h2.append(lo + rng.random() * (hi - lo))
    return h1, h2


if __name__ == "__main__":
    # {{example}}
    random.seed(3)
    p1 = [2.0, 4.5, 1.0, 8.0, 6.5, 3.0]
    p2 = [6.0, 0.5, 3.0, 9.0, 2.5, 7.0]
    h1, h2 = blx(p1, p2, 0.5)
    print(h1, h2)
`,
    },
    javascript: {
      label: 'JavaScript',
      filename: 'blx.js',
      template: `/**
 * {{title}}
 * {{ref}}
 *
 * {{doc1}}
 */
function blx(p1, p2, alpha = 0.5, random = Math.random) {
  const h1 = [];
  const h2 = [];
  for (let i = 0; i < p1.length; i++) {
    const cmin = Math.min(p1[i], p2[i]);
    const cmax = Math.max(p1[i], p2[i]);
    const width = cmax - cmin;
    const lo = cmin - alpha * width;
    const hi = cmax + alpha * width;
    h1.push(lo + random() * (hi - lo));  // {{draw}}
    h2.push(lo + random() * (hi - lo));
  }
  return [h1, h2];
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { blx };
  if (require.main === module) {
    // {{example}}
    const p1 = [2.0, 4.5, 1.0, 8.0, 6.5, 3.0];
    const p2 = [6.0, 0.5, 3.0, 9.0, 2.5, 7.0];
    console.log(blx(p1, p2, 0.5));
  }
}
`,
    },
  };

  const codeComments = {
    es: {
      title: 'Cruce BLX-α para representación real.',
      ref: 'Referencias: Eshelman, L. J. y Schaffer, J. D. (1993); Herrera, F., Lozano, M. y Verdegay, J. L. (1998).',
      doc1: 'Hijos del cruce BLX-α: cada gen se sortea, por separado, en el intervalo de los padres ampliado α veces su anchura hacia cada lado.',
      draw: 'Un sorteo independiente para cada hijo',
      example: 'Ejemplo (el resultado depende del sorteo)',
    },
    en: {
      title: 'BLX-α crossover for real-valued representations.',
      ref: 'References: Eshelman, L. J. & Schaffer, J. D. (1993); Herrera, F., Lozano, M. & Verdegay, J. L. (1998).',
      doc1: 'Children of BLX-α crossover: each gene is drawn, separately, from the parents’ interval widened by α times its width on each side.',
      draw: 'An independent draw for each child',
      example: 'Example (the result depends on the draw)',
    },
  };

  const references = [
    C.ref('eshelman', {
      es: 'Presenta el cruce BLX-α y el marco de los esquemas de intervalo para analizar los algoritmos genéticos con codificación real.',
      en: 'Introduces BLX-α crossover and the interval-schemata framework for analysing real-coded genetic algorithms.',
    }, { original: true }),
    C.ref('herrera', {
      es: 'Revisión de los operadores para codificación real; sitúa el BLX-α entre los que pueden generar valores fuera del intervalo de los padres.',
      en: 'Review of operators for real coding; places BLX-α among those that can generate values outside the parents’ interval.',
    }),
    C.ref('eiben', {
      es: 'Describe el cruce de mezcla (BLX) junto con el resto de operadores de recombinación para representaciones reales.',
      en: 'Describes blend crossover (BLX) alongside the other recombination operators for real-valued representations.',
    }),
  ];

  const H = C.makeHelpers(codeTemplates, codeComments, pseudocode);
  const api = Object.assign({ id: 'blx', explanation, narration, pseudocode, keywords, stepLines, fnName, codeTemplates, references }, H);
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).content = root.GAX.content || {}).blx = api;
})(typeof self !== 'undefined' ? self : this);
