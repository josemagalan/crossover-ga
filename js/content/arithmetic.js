/*
 * Contenido docente del cruce aritmético (representación real).
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const C = isNode ? require('./real-common.js') : root.GAX.contentShared.real;

  const explanation = {
    es: [
      'El cruce aritmético aprovecha que los genes son números: en lugar de copiar valores de los padres, los combina. Cada gen del Hijo 1 es λ·P1 + (1 − λ)·P2 y cada gen del Hijo 2, λ·P2 + (1 − λ)·P1, con el mismo peso λ, entre 0 y 1, en todas las posiciones. Lo propuso Michalewicz (1992); con λ constante se llama cruce aritmético uniforme y, si λ cambia con las generaciones, no uniforme (Herrera, Lozano y Verdegay, 1998).',
      'Cada gen del hijo queda en el segmento que une los genes de los padres en esa posición, y el panel de valores lo muestra. Con λ = 0,5 cae justo en el punto medio y los dos hijos coinciden: son la media de los padres, que es el ejemplo de las transparencias. Con λ cerca de 0 o de 1, cada hijo se parece mucho a uno de los padres, y con λ = 0 o λ = 1 son copias suyas.',
      'Como los hijos siempre quedan entre los padres, el cruce aritmético explota la zona que ya ocupa la población, que tiende a concentrarse y a perder diversidad generación tras generación. A cambio, respeta las restricciones convexas: si los dos padres cumplen restricciones lineales, como a ≤ x ≤ b, los hijos también, y por eso Michalewicz lo usó para problemas con restricciones. Para explorar fuera del intervalo de los padres hay cruces como BLX-α.',
      'Coste: dos operaciones por gen, en tiempo O(n). Con λ fijo no necesita números aleatorios.',
    ],
    en: [
      'Arithmetic crossover takes advantage of genes being numbers: instead of copying the parents’ values, it combines them. Each gene of Child 1 is λ·P1 + (1 − λ)·P2 and each gene of Child 2 is λ·P2 + (1 − λ)·P1, with the same weight λ, between 0 and 1, in every position. It was proposed by Michalewicz (1992); with a constant λ it is called uniform arithmetic crossover and, if λ changes over the generations, non-uniform (Herrera, Lozano & Verdegay, 1998).',
      'Each child gene lies on the segment joining the parents’ genes in that position, and the values panel shows it. With λ = 0.5 it falls exactly at the midpoint and both children are the same: the average of the parents, which is the example in the slides. With λ close to 0 or 1, each child closely resembles one of the parents, and with λ = 0 or λ = 1 they are copies of them.',
      'Because the children always lie between the parents, arithmetic crossover exploits the region the population already occupies, which tends to concentrate and lose diversity generation after generation. In exchange, it respects convex constraints: if both parents satisfy linear constraints such as a ≤ x ≤ b, so do the children, which is why Michalewicz used it for constrained problems. To explore outside the parents’ interval there are crossovers such as BLX-α.',
      'Cost: two operations per gene, in O(n) time. With a fixed λ it needs no random numbers.',
    ],
  };

  const narration = {
    es: {
      lerpCaption: 'Valor de cada gen: los hijos quedan en el segmento entre los padres',
      lerpCaptionShort: 'Valor de cada gen',
      legendBlend: 'Gen combinado: su color mezcla los de los padres según su peso',
      paramLAMBDA: 'Peso (λ)',
      intro: 'Partimos de dos padres, vectores de {n} números reales. En el panel central, cada columna muestra los valores de los padres en esa posición y el segmento que los une.',
      weights: 'Con λ = {l}, cada gen del Hijo 1 se forma con un {pl} % del gen del Padre 1 y un {pm} % del gen del Padre 2; el Hijo 2 usa los pesos al revés.',
      weightsHalf: 'Con λ = {l}, los dos padres pesan lo mismo: cada gen de los hijos será la media de los genes de los padres en esa posición.',
      first: 'Posición 1: H1 = {l}·{a} + {m}·{b} = {h1} y H2 = {l}·{b} + {m}·{a} = {h2}. Los dos valores quedan en el segmento entre {a} y {b}.',
      firstHalf: 'Posición 1: H1 = H2 = ({a} + {b}) / 2 = {h1}, el punto medio del segmento entre los dos padres.',
      rest: 'El resto de posiciones, de la 2 a la {n}, se calcula igual, cada una con sus propios valores.',
      done: 'Resultado: cada gen de los hijos está en el segmento que une los genes de los padres. El cruce no crea valores fuera del intervalo de los padres, y el Hijo 1 queda más cerca del Padre 1 cuanto mayor es λ.',
      doneHalf: 'Resultado: con λ = {l} los dos hijos son iguales, la media de los padres, como en el ejemplo de las transparencias. Mueve λ para obtener dos hijos distintos.',
      doneEdge: 'Resultado: con λ = {l} los hijos son copias de los padres y el cruce no cambia nada. Prueba con un valor intermedio.',
    },
    en: {
      lerpCaption: 'Value of each gene: the children lie on the segment between the parents',
      lerpCaptionShort: 'Value of each gene',
      legendBlend: 'Combined gene: its colour mixes the parents’ colours according to their weight',
      paramLAMBDA: 'Weight (λ)',
      intro: 'We start from two parents, vectors of {n} real numbers. In the middle panel, each column shows the parents’ values in that position and the segment joining them.',
      weights: 'With λ = {l}, each gene of Child 1 takes {pl} % of Parent 1’s gene and {pm} % of Parent 2’s; Child 2 uses the weights the other way round.',
      weightsHalf: 'With λ = {l}, both parents weigh the same: each gene of the children will be the average of the parents’ genes in that position.',
      first: 'Position 1: C1 = {l}·{a} + {m}·{b} = {h1} and C2 = {l}·{b} + {m}·{a} = {h2}. Both values lie on the segment between {a} and {b}.',
      firstHalf: 'Position 1: C1 = C2 = ({a} + {b}) / 2 = {h1}, the midpoint of the segment between the two parents.',
      rest: 'The remaining positions, 2 to {n}, are computed in the same way, each with its own values.',
      done: 'Result: each gene of the children lies on the segment joining the parents’ genes. The crossover creates no values outside the parents’ interval, and Child 1 is closer to Parent 1 the larger λ is.',
      doneHalf: 'Result: with λ = {l} both children are the same, the average of the parents, as in the example in the slides. Move λ to get two different children.',
      doneEdge: 'Result: with λ = {l} the children are copies of the parents and the crossover changes nothing. Try an intermediate value.',
    },
  };

  const pseudocode = {
    es: [
      { id: 'sig', indent: 0, text: 'CRUCE_ARITMÉTICO(P1, P2, λ)' },
      { id: 'forPos', indent: 1, text: 'para cada posición i:' },
      { id: 'h1', indent: 2, text: 'H1[i] ← λ·P1[i] + (1 − λ)·P2[i]' },
      { id: 'h2', indent: 2, text: 'H2[i] ← λ·P2[i] + (1 − λ)·P1[i]' },
      { id: 'return', indent: 1, text: 'devolver H1, H2' },
    ],
    en: [
      { id: 'sig', indent: 0, text: 'ARITHMETIC_CROSSOVER(P1, P2, λ)' },
      { id: 'forPos', indent: 1, text: 'for each position i:' },
      { id: 'h1', indent: 2, text: 'C1[i] ← λ·P1[i] + (1 − λ)·P2[i]' },
      { id: 'h2', indent: 2, text: 'C2[i] ← λ·P2[i] + (1 − λ)·P1[i]' },
      { id: 'return', indent: 1, text: 'return C1, C2' },
    ],
  };
  const keywords = { es: ['para cada', 'devolver'], en: ['for each', 'return'] };
  const stepLines = {
    intro: ['sig'],
    weights: ['sig'],
    first: ['forPos', 'h1', 'h2'],
    rest: ['forPos', 'h1', 'h2'],
    done: ['return'],
  };
  const fnName = { python: 'arithmetic', javascript: 'arithmetic' };

  const codeTemplates = {
    python: {
      label: 'Python',
      filename: 'arithmetic.py',
      template: `"""
{{title}}
{{ref}}
"""


def arithmetic(p1, p2, lam=0.5):
    """{{doc1}}"""
    h1 = [lam * a + (1 - lam) * b for a, b in zip(p1, p2)]
    h2 = [lam * b + (1 - lam) * a for a, b in zip(p1, p2)]
    return h1, h2


if __name__ == "__main__":
    # {{example}}
    p1 = [2.0, 4.5, 1.0, 8.0, 6.5, 3.0]
    p2 = [6.0, 0.5, 3.0, 9.0, 2.5, 7.0]
    h1, h2 = arithmetic(p1, p2, 0.25)
    print(h1)  # [5.0, 1.5, 2.5, 8.75, 3.5, 6.0]
    print(h2)  # [3.0, 3.5, 1.5, 8.25, 5.5, 4.0]
    # {{half}}
    print(arithmetic(p1, p2)[0])  # [4.0, 2.5, 2.0, 8.5, 4.5, 5.0]
`,
    },
    javascript: {
      label: 'JavaScript',
      filename: 'arithmetic.js',
      template: `/**
 * {{title}}
 * {{ref}}
 *
 * {{doc1}}
 */
function arithmetic(p1, p2, lam = 0.5) {
  const h1 = p1.map((a, i) => lam * a + (1 - lam) * p2[i]);
  const h2 = p2.map((b, i) => lam * b + (1 - lam) * p1[i]);
  return [h1, h2];
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { arithmetic };
  if (require.main === module) {
    // {{example}}
    const p1 = [2.0, 4.5, 1.0, 8.0, 6.5, 3.0];
    const p2 = [6.0, 0.5, 3.0, 9.0, 2.5, 7.0];
    const [h1, h2] = arithmetic(p1, p2, 0.25);
    console.log(h1); // [5, 1.5, 2.5, 8.75, 3.5, 6]
    console.log(h2); // [3, 3.5, 1.5, 8.25, 5.5, 4]
    // {{half}}
    console.log(arithmetic(p1, p2)[0]); // [4, 2.5, 2, 8.5, 4.5, 5]
  }
}
`,
    },
  };

  const codeComments = {
    es: {
      title: 'Cruce aritmético para representación real.',
      ref: 'Referencias: Michalewicz, Z. (1992); Herrera, F., Lozano, M. y Verdegay, J. L. (1998).',
      doc1: 'Hijos del cruce aritmético con peso lam (entre 0 y 1): combinaciones lineales de los padres, gen a gen.',
      example: 'Ejemplo con λ = 0,25: el Hijo 1 se parece más al Padre 2',
      half: 'Con λ = 0,5 los dos hijos son la media de los padres (transparencias)',
    },
    en: {
      title: 'Arithmetic crossover for real-valued representations.',
      ref: 'References: Michalewicz, Z. (1992); Herrera, F., Lozano, M. & Verdegay, J. L. (1998).',
      doc1: 'Children of arithmetic crossover with weight lam (between 0 and 1): linear combinations of the parents, gene by gene.',
      example: 'Example with λ = 0.25: Child 1 is closer to Parent 2',
      half: 'With λ = 0.5 both children are the average of the parents (slides)',
    },
  };

  const references = [
    C.ref('michalewicz', {
      es: 'Propone el cruce aritmético en su sistema GENOCOP para optimización numérica con restricciones lineales.',
      en: 'Proposes arithmetic crossover in his GENOCOP system for numerical optimisation with linear constraints.',
    }, { original: true }),
    C.ref('herrera', {
      es: 'Revisión de los operadores para codificación real: define el cruce aritmético uniforme y no uniforme y lo compara experimentalmente con otros.',
      en: 'Review of operators for real coding: defines uniform and non-uniform arithmetic crossover and compares it experimentally with others.',
    }),
    C.ref('eiben', {
      es: 'Trata la recombinación aritmética (simple, de un gen y completa) para representaciones reales.',
      en: 'Covers arithmetic recombination (simple, single and whole) for real-valued representations.',
    }),
    C.ref('talbi', {
      es: 'Manual de metaheurísticas. El apartado 3.3.2.2 (p. 215) presenta el cruce intermedio o aritmético, oᵢ = α·x₁ᵢ + (1 − α)·x₂ᵢ (su α es el λ de esta herramienta), entre los cruces «centrados en la media»; en la p. 219 lo extiende a más de dos padres.',
      en: 'Metaheuristics textbook. Section 3.3.2.2 (p. 215) presents intermediate or arithmetic crossover, oᵢ = α·x₁ᵢ + (1 − α)·x₂ᵢ (its α is this tool’s λ), among the “mean-centric” crossovers; on p. 219 it extends it to more than two parents.',
    }),
  ];

  const H = C.makeHelpers(codeTemplates, codeComments, pseudocode);
  const api = Object.assign({ id: 'arithmetic', explanation, narration, pseudocode, keywords, stepLines, fnName, codeTemplates, references }, H);
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).content = root.GAX.content || {}).arithmetic = api;
})(typeof self !== 'undefined' ? self : this);
