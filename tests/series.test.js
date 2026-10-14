'use strict';
// Enlaces a las demás herramientas de la serie: «Acerca de», pie y portada enlazan también a representación y a
// inicialización y evaluación, con el idioma de la página.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

global.self = global;
require('../js/about.js');
const about = global.GAX.about;
const url = (k, l) => about.sisterUrl(l, k);
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('las herramientas de la serie se enlazan con el idioma', () => {
  assert.equal(url('representation', 'en'), 'https://josemagalan.github.io/representation-ga/#lang=en');
  assert.equal(url('initialization', 'es'), 'https://josemagalan.github.io/initialization-and-evaluation-ga/#lang=es');
  assert.equal(url('selection', 'en').startsWith('https://josemagalan.github.io/selection-ga/') || url('crossover', 'en').startsWith('https://josemagalan.github.io/crossover-ga/'), true);
});

test('los textos de «Acerca de» y del pie tienen las mismas claves en ES y EN', () => {
  assert.deepEqual(Object.keys(about.text.es).sort(), Object.keys(about.text.en).sort());
  for (const l of ['es', 'en']) {
    for (const k of ['sisterLinkRepresentation', 'sisterLinkInitialization', 'footRepresentation', 'footInitialization']) assert.ok(about.text[l][k], `${k} (${l})`);
  }
});

test('la portada enlaza a representación y a inicialización y evaluación', () => {
  assert.match(html, /href="https:\/\/josemagalan\.github\.io\/representation-ga\/"/);
  assert.match(html, /href="https:\/\/josemagalan\.github\.io\/initialization-and-evaluation-ga\/"/);
});
