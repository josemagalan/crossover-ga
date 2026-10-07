# Crossover in genetic algorithms

[![Live demo](https://img.shields.io/badge/Live_demo-GitHub_Pages-2ea44f?logo=github)](https://josemagalan.github.io/crossover-ga/)
[![Tests](https://github.com/josemagalan/crossover-ga/actions/workflows/tests.yml/badge.svg)](https://github.com/josemagalan/crossover-ga/actions/workflows/tests.yml)
[![Code: MIT](https://img.shields.io/badge/Code-MIT-yellow.svg)](LICENSE)
[![Content: CC BY 4.0](https://img.shields.io/badge/Content-CC_BY_4.0-lightgrey.svg)](LICENSE-CONTENT.md)
[![D3.js v7 · no build](https://img.shields.io/badge/D3.js_v7-no_build-f9a03c?logo=d3dotjs&logoColor=white)](https://d3js.org/)
[![Languages: ES | EN](https://img.shields.io/badge/Languages-ES_%7C_EN-blue.svg)](#features)
[![Purpose: Teaching tool](https://img.shields.io/badge/Purpose-Teaching_tool-informational.svg)](#pedagogical-purpose)
[![Sister tool: mutation-ga](https://img.shields.io/badge/Sister_tool-mutation--ga-8a2be2?logo=github)](https://github.com/josemagalan/mutation-ga)
[![Sister tool: selection-ga](https://img.shields.io/badge/Sister_tool-selection--ga-8a2be2?logo=github)](https://github.com/josemagalan/selection-ga)

**José Manuel Galán**¹ · **Silvia Díaz-de la Fuente**² · **Virginia Ahedo**¹ · **María Pereda**³ · **José Ignacio Santos**¹

¹ Universidad de Burgos · ² Universidad de Salamanca · ³ Universidad Politécnica de Madrid
All authors are members of the Los Goonies research group (Group of Organization and Industrial Engineering and Simulation).

---

## Overview

Crossover is how a genetic algorithm combines the information of two parents to create children, and how it has to be done depends on how each solution is represented: an operator designed for bit strings can produce invalid solutions when the chromosome is a permutation. This interactive tool shows, step by step and in Spanish or English, how the classic crossover operators work for binary, real-valued and permutation representations, and lets students practise predicting the children and compare what each operator preserves from the parents.

It is the sister tool of [Mutation in genetic algorithms](https://github.com/josemagalan/mutation-ga), with the same approach and features, and the series is completed by [Selection in genetic algorithms](https://github.com/josemagalan/selection-ga). It runs entirely in the browser, with no build step and no server: open `index.html` or use the [live demo](https://josemagalan.github.io/crossover-ga/).

## Implemented operators

| Representation | Operators |
| --- | --- |
| Binary | One-point, two-point, n-point (k cuts) and uniform (probability p), all explained through Syswerda’s crossover mask |
| Real-valued | Uniform, arithmetic (weight λ), BLX-α (α) and SBX (η); BLX-α and SBX with an extra 2D view of the parents, a cloud of other possible children and the children of the trace |
| Permutation | PMX, OX (three variants), CX (three variants) and ERX (two variants, with its adjacency table), plus a counterexample showing why one-point crossover fails on permutations |

There is no separate integer section: integer vectors use the binary crossovers unchanged (one-point, two-point, n-point and uniform), because these only cut and recombine positions without looking at the gene values (Eiben & Smith, *Introduction to Evolutionary Computing*). Integer-specific operators are needed for mutation, which the sister tool covers.

## Features

- **Step-by-step animation** of every operator with a narration of each step, in Spanish and English.
- **Your own examples:** random parents with a reproducible seed or parents entered by hand, draggable cut points, operator parameters as sliders; the current example is saved in the URL, ready to project in class or share.
- **Learn more panel:** explanation of the method, pseudocode that highlights the line of the current step, Python and JavaScript implementations to copy or download (tested to give exactly the same children as the tool), and references with the original source of each operator.
- **Practice mode (“predict the child”):** write your prediction of both children before watching the animation and check it gene by gene; whatever the algorithm draws internally (mask, draws, cycle order, ties) is revealed only when needed for the answer to be unique.
- **Compare operators:** one screen per representation applies every crossover to the same parents (and, where possible, the same cuts), colours each child gene by what it keeps from the parents, and sums up how much each operator preserves, averaged either over 1000 runs with those same parents or over 1000 random parent pairs of the same length (10 runs each), so that what depends on the particular parents can be told apart from each operator’s typical behaviour: position, circular relative order, adjacencies, copies of a parent and validity for permutations; genes from the own parent and stretches for binary; copies, values inside the parents’ interval and distance to the parents for real-valued.
- **Question banks for Moodle (for teachers):** generates graded questions in Moodle XML — compute the offspring (cloze, one box per gene) for PMX, OX, CX and the binary crossovers, identify the operator, and spot the mistake in PMX and OX — in three difficulty levels, one category per operator, type and level, ready for Moodle’s random questions. Each question’s general feedback gives the solution and links to the step-by-step solution of that very exercise in the tool.
- **Chromosomes as routes:** for permutation crossovers, each gene becomes a city and each chromosome a travelling-salesman route; the parents’ routes and each child’s route build up with the animation, with their lengths and the new stretches marked.

## Pedagogical purpose

The tool is designed for undergraduate courses on metaheuristics, evolutionary computation and industrial engineering (production scheduling, sequencing, routing). It can be projected in lectures to walk through each operator, used by students on their own to check hand-worked exercises in practice mode, or used in seminars to discuss why different representations need different operators and what each operator preserves.

## Running locally

Open `index.html` in any modern browser. No server or internet connection is needed: D3 v7 is bundled in `vendor/`.

Keyboard: ← → step back/forward, Space play/pause, Home back to the start.

## Tests

Requires Node.js 22 or later; Python 3 is optional (it is used to test the downloadable Python code as well).

```
npm test
```

The tests check every operator (worked examples, thousands of random cases contrasted with an independent implementation), that the downloadable code gives the same children as the tool with the same random draws, that the pseudocode is linked to the animation steps, the comparison metrics (including the averages over random parents, reproducible and independent of how they are split into batches), the city maps and the Moodle question generator (stored answers match the operators, one correct option, well-formed XML, links that reproduce each exercise). They run on every push with GitHub Actions.

## Project structure

| Path | Contents |
| --- | --- |
| `index.html`, `css/` | Page and styles |
| `js/registry.js`, `js/home.js` | Catalogue of representations and operators; home screen |
| `js/operators/` | Logic of each operator: a pure function returning the children and the trace of steps |
| `js/viz/` | D3 views that draw the trace, and the route maps |
| `js/content/` | Teaching content of each operator: explanation, pseudocode, downloadable code and references |
| `js/compare.js`, `js/compare-view.js` | “Compare operators”: metrics and screen |
| `js/moodle.js`, `js/moodle-page.js` | Moodle question-bank generator (Moodle XML) and its page |
| `js/learn.js`, `js/about.js`, `js/app.js` | “Learn more” panel, about page and footer, page controller |
| `js/i18n.js`, `js/rng.js`, `js/cities.js` | Spanish and English texts; seeded random generator; random cities |
| `img/logos/`, `vendor/` | Institution logos; D3.js v7 |
| `tests/` | Tests with `node:test` |

## Related tools

- [Mutation in genetic algorithms](https://github.com/josemagalan/mutation-ga) ([live demo](https://josemagalan.github.io/mutation-ga/)): the companion tool on mutation operators by representation (binary, integer, real-valued and permutation), by the same authors and with the same interface, practice mode, comparison screen and Moodle question banks. Used together, the two tools cover the variation operators of a genetic algorithm.
- [Selection in genetic algorithms](https://github.com/josemagalan/selection-ga) ([live demo](https://josemagalan.github.io/selection-ga/)): the third tool of the series, on parent selection (roulette wheel, SUS, ranking, tournament, truncation…) and replacement (elitism, steady state, (μ + λ), (μ, λ)), by the same authors and with the same interface. Together, the three tools cover the operators of a genetic algorithm.

## How to cite

A paper describing this tool is in preparation for the Congreso de Ingeniería de Organización (CIO). In the meantime, if you would like to cite it, please contact the authors.

## License

- Code, including the downloadable Python and JavaScript implementations: MIT (see [LICENSE](LICENSE)).
- Teaching texts (explanations, step narration and pseudocode): CC BY 4.0 (see [LICENSE-CONTENT.md](LICENSE-CONTENT.md)).
- D3.js: ISC licence (see [vendor/d3-LICENSE](vendor/d3-LICENSE)).

## Acknowledgements

We thank Anthropic’s Claude for Science programme for supporting the development of this tool, which was built with the help of Claude.

<p>
  <img src="img/logos/ubu.png" alt="Universidad de Burgos" height="56">&nbsp;&nbsp;
  <img src="img/logos/usal.png" alt="Universidad de Salamanca" height="44">&nbsp;&nbsp;
  <img src="img/logos/upm.png" alt="Universidad Politécnica de Madrid" height="44">&nbsp;&nbsp;
  <img src="img/logos/goonies.png" alt="Los Goonies research group" height="44">
</p>
