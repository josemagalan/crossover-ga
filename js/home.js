/*
 * Pantalla inicial: las representaciones y sus operadores, a partir del registro.
 * Los operadores disponibles son enlaces (#op=<id>); el resto aparecen como «próximamente».
 */
(function (root) {
  'use strict';

  function createHome(container, opts) {
    const registry = opts.registry;
    const t = opts.t;          // (key, params) => texto en el idioma actual
    const lang = opts.lang;    // () => 'es' | 'en'

    function node(tag, cls, text) {
      const e = document.createElement(tag);
      if (cls) e.className = cls;
      if (text != null) e.textContent = text;
      return e;
    }

    function opItem(op, l) {
      const li = node('li');
      const item = op.ready ? node('a', 'op-item') : node('div', 'op-item disabled');
      if (op.ready) item.href = `#op=${op.id}&lang=${l}`;
      else item.setAttribute('aria-disabled', 'true');
      const text = node('span', 'op-text');
      text.append(node('span', 'op-name', op.name[l]), node('span', 'op-summary', op.summary[l]));
      item.append(text);
      item.append(op.ready ? node('span', 'op-go', '→') : node('span', 'badge-soon', t('comingSoon')));
      if (op.ready) item.querySelector('.op-go').setAttribute('aria-hidden', 'true');
      li.append(item);
      return li;
    }

    function render() {
      const l = lang();
      container.replaceChildren(...registry.representations.map((rep) => {
        const card = node('section', 'rep-card');
        card.dataset.rep = rep.id;
        card.setAttribute('aria-labelledby', `rep-${rep.id}`);

        const head = node('div', 'rep-head');
        const h2 = node('h2', null, rep.name[l]);
        h2.id = `rep-${rep.id}`;
        head.append(h2, node('span', 'rep-count', t('opsCount', { n: rep.operators.length })));

        const chromo = node('div', 'chromo');
        chromo.setAttribute('aria-hidden', 'true');
        // Decimales con la coma o el punto del idioma
        rep.sample.forEach((v) => chromo.append(node('span', 'gene-mini', l === 'es' ? v.replace('.', ',') : v)));

        const list = node('ul', 'op-list');
        rep.operators.forEach((op) => list.append(opItem(op, l)));

        card.append(head, chromo, node('p', 'rep-desc', rep.desc[l]), list);
        if (rep.operators.filter((op) => op.ready).length > 1) {
          const cmp = node('a', 'cmp-link');
          cmp.href = `#cmp=${rep.id}&lang=${l}`;
          cmp.append(node('span', null, t('compareHomeLink')), node('span', 'op-go', '→'));
          cmp.querySelector('.op-go').setAttribute('aria-hidden', 'true');
          card.append(cmp);
        }
        return card;
      }));
    }

    return { render };
  }

  (root.GAX = root.GAX || {}).createHome = createHome;
})(typeof self !== 'undefined' ? self : this);
