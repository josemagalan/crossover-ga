/*
 * Página «Acerca de» y pie común: autores, filiaciones, cómo citar, licencias y agradecimientos.
 */
(function (root) {
  'use strict';

  const REPO = 'https://github.com/josemagalan/crossover-ga';
  const SELECTION = 'https://josemagalan.github.io/selection-ga/';
  const SISTER = 'https://josemagalan.github.io/mutation-ga/';

  const authors = [
    { name: 'José Manuel Galán', aff: [1] },
    { name: 'Silvia Díaz-de la Fuente', aff: [2] },
    { name: 'Virginia Ahedo', aff: [1] },
    { name: 'María Pereda', aff: [3] },
    { name: 'José Ignacio Santos', aff: [1] },
  ];

  const affiliations = {
    es: ['Universidad de Burgos', 'Universidad de Salamanca', 'Universidad Politécnica de Madrid'],
    en: ['University of Burgos', 'University of Salamanca', 'Technical University of Madrid (UPM)'],
  };

  // Logos: la UBU, institución principal, primero y algo mayor.
  const logos = [
    { src: 'img/logos/ubu.png', alt: 'Universidad de Burgos', href: 'https://www.ubu.es', main: true },
    { src: 'img/logos/usal.png', alt: 'Universidad de Salamanca', href: 'https://www.usal.es' },
    { src: 'img/logos/upm.png', alt: 'Universidad Politécnica de Madrid', href: 'https://www.upm.es' },
    { src: 'img/logos/goonies.png', alt: 'Los Goonies · Group of Organization and Industrial Engineering and Simulation', href: null },
  ];

  const text = {
    es: {
      title: 'Acerca de esta herramienta',
      lead: 'Herramienta docente interactiva para ver paso a paso los operadores de cruce de los algoritmos genéticos, clasificados por el tipo de representación (binaria, real y permutacional), con su explicación, pseudocódigo, código descargable y referencias.',
      authorsTitle: 'Autores',
      group: 'Todos los autores forman parte del grupo de investigación Los Goonies (Group of Organization and Industrial Engineering and Simulation).',
      sisterTitle: 'Herramientas hermanas',
      sister: 'Esta herramienta acompaña a «Mutación en algoritmos genéticos», de los mismos autores, que muestra con el mismo enfoque los operadores de mutación de cada representación (binaria, entera, real y permutacional).',
      sisterSelection: '«Selección en algoritmos genéticos», la tercera herramienta de la serie, muestra cómo se eligen los padres (ruleta, SUS, ranking, torneo…) y quién sobrevive en el reemplazo. Juntas cubren los tres operadores de un algoritmo genético: selección, cruce y mutación.',
      sisterLinkSelection: 'Abrir «Selección en algoritmos genéticos»',
      sisterLink: 'Abrir «Mutación en algoritmos genéticos»',
      citeTitle: 'Cómo citar',
      cite: 'Estamos preparando un artículo sobre esta herramienta para el Congreso de Ingeniería de Organización. Mientras tanto, si quieres citarla, ponte en contacto con los autores.',
      codeTitle: 'Código y licencias',
      code: 'El código fuente está en GitHub. El código, incluidas las implementaciones en Python y JavaScript que se descargan desde la herramienta, se publica con licencia MIT; los textos docentes (explicaciones, narración de los pasos y pseudocódigo), con licencia CC BY 4.0. D3.js tiene licencia ISC.',
      repo: 'Repositorio en GitHub',
      thanksTitle: 'Agradecimientos',
      thanks: 'Agradecemos al programa Claude for Science de Anthropic su apoyo al desarrollo de esta herramienta, que se ha realizado con la ayuda de Claude.',
      foot: 'Acerca de',
      footMoodle: 'Preguntas para Moodle',
      footSister: 'Herramientas hermanas:',
      footOther: 'mutación',
      footSelection: 'selección',
      footLicence: 'Código MIT · Textos CC BY 4.0',
    },
    en: {
      title: 'About this tool',
      lead: 'Interactive teaching tool to follow, step by step, the crossover operators of genetic algorithms, grouped by representation type (binary, real-valued and permutation), with explanations, pseudocode, downloadable code and references.',
      authorsTitle: 'Authors',
      group: 'All authors are members of the Los Goonies research group (Group of Organization and Industrial Engineering and Simulation).',
      sisterTitle: 'Sister tools',
      sister: 'This tool accompanies “Mutation in genetic algorithms”, by the same authors, which shows the mutation operators for each representation (binary, integer, real-valued and permutation) with the same approach.',
      sisterSelection: '“Selection in genetic algorithms”, the third tool of the series, shows how parents are chosen (roulette wheel, SUS, ranking, tournament…) and who survives in replacement. Together they cover the three operators of a genetic algorithm: selection, crossover and mutation.',
      sisterLinkSelection: 'Open “Selection in genetic algorithms”',
      sisterLink: 'Open “Mutation in genetic algorithms”',
      citeTitle: 'How to cite',
      cite: 'We are preparing a paper on this tool for the Congreso de Ingeniería de Organización (Spanish conference on industrial management and engineering). In the meantime, if you would like to cite it, please contact the authors.',
      codeTitle: 'Code and licences',
      code: 'The source code is on GitHub. The code, including the Python and JavaScript implementations downloadable from the tool, is released under the MIT licence; the teaching texts (explanations, step narration and pseudocode), under CC BY 4.0. D3.js is ISC-licensed.',
      repo: 'GitHub repository',
      thanksTitle: 'Acknowledgements',
      thanks: 'We thank Anthropic’s Claude for Science programme for supporting the development of this tool, which was built with the help of Claude.',
      foot: 'About',
      footMoodle: 'Moodle questions',
      footSister: 'Sister tools:',
      footOther: 'mutation',
      footSelection: 'selection',
      footLicence: 'Code MIT · Texts CC BY 4.0',
    },
  };

  function node(tag, cls, content) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (content != null) e.textContent = content;
    return e;
  }

  function authorLine(withAff) {
    const p = node('p', 'about-authors');
    authors.forEach((a, i) => {
      if (i) p.append(document.createTextNode(' · '));
      p.append(document.createTextNode(a.name));
      if (withAff) p.append(node('sup', null, a.aff.join(',')));
    });
    return p;
  }

  function logoRow(cls) {
    const row = node('div', cls);
    logos.forEach((l) => {
      const img = node('img');
      img.src = l.src;
      img.alt = l.alt;
      img.title = l.alt;
      img.loading = 'lazy';
      if (l.main) img.className = 'main';
      if (l.href) {
        const a = node('a');
        a.href = l.href;
        a.target = '_blank';
        a.rel = 'noopener';
        a.append(img);
        row.append(a);
      } else row.append(img);
    });
    return row;
  }

  function section(title, ...children) {
    const s = node('section', 'about-section');
    s.append(node('h2', null, title), ...children);
    return s;
  }

  function renderAbout(container, lang) {
    const T = text[lang] || text.es;
    const affs = node('p', 'about-affs');
    (affiliations[lang] || affiliations.es).forEach((a, i) => {
      if (i) affs.append(document.createTextNode(' · '));
      affs.append(node('sup', null, String(i + 1)), document.createTextNode(` ${a}`));
    });
    const repo = node('a', null, T.repo);
    repo.href = REPO;
    const codeP = node('p', null, `${T.code} `);
    codeP.append(repo, document.createTextNode('.'));
    container.replaceChildren(
      node('h1', null, T.title),
      node('p', 'lead', T.lead),
      section(T.authorsTitle, authorLine(true), affs, node('p', null, T.group)),
      logoRow('about-logos'),
      section(T.sisterTitle, ...(() => {
        const p = node('p', null, `${T.sister} `);
        const s = node('a', null, T.sisterLink);
        s.href = sisterUrl(lang);
        s.target = '_blank';
        s.rel = 'noopener';
        p.append(s, document.createTextNode('.'));
        const p2 = node('p', null, `${T.sisterSelection} `);
        const s2 = node('a', null, T.sisterLinkSelection);
        s2.href = sisterUrl(lang, 'selection');
        s2.target = '_blank';
        s2.rel = 'noopener';
        p2.append(s2, document.createTextNode('.'));
        return [p, p2];
      })()),
      section(T.citeTitle, node('p', null, T.cite)),
      section(T.codeTitle, codeP),
      section(T.thanksTitle, node('p', null, T.thanks)),
    );
  }

  function sisterUrl(lang, which) { return `${which === 'selection' ? SELECTION : SISTER}#lang=${lang}`; }

  function renderFooter(container, lang) {
    const T = text[lang] || text.es;
    const info = node('div', 'site-foot-info');
    info.append(authorLine(false));
    const links = node('p', 'site-foot-links');
    const about = node('a', null, T.foot);
    about.href = `#page=about&lang=${lang}`;
    const gh = node('a', null, 'GitHub');
    gh.href = REPO;
    const moodle = node('a', null, T.footMoodle);
    moodle.href = `#page=moodle&lang=${lang}`;
    const sister = node('a', null, T.footOther);
    sister.href = sisterUrl(lang);
    const selection = node('a', null, T.footSelection);
    selection.href = sisterUrl(lang, 'selection');
    links.append(about, document.createTextNode(' · '), moodle, document.createTextNode(` · ${T.footSister} `), sister, document.createTextNode(', '), selection, document.createTextNode(' · '), gh, document.createTextNode(` · ${T.footLicence}`));
    info.append(links);
    container.replaceChildren(logoRow('site-foot-logos'), info);
  }

  const api = { renderAbout, renderFooter, sisterUrl, authors, affiliations, text };
  (root.GAX = root.GAX || {}).about = api;
})(typeof self !== 'undefined' ? self : this);
