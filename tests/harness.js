const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const ROOT = path.join(__dirname, '..');

// Load index.html in a DOM, serving content.json through a mocked fetch.
// Returns { window, document, content, flushRaf }.
function loadSite(overrides = {}) {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const content = JSON.parse(fs.readFileSync(path.join(ROOT, 'content.json'), 'utf8'));
  Object.assign(content, overrides);
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => console.log('JSDOM ERROR:', e.message));
  const raf = [];
  const dom = new JSDOM(html, {
    runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(win) {
      win.fetch = () => Promise.resolve({ ok: true, json: () => Promise.resolve(content) });
      win.matchMedia = q => ({ matches: false, media: q, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} });
      win.requestAnimationFrame = cb => { raf.push(cb); return raf.length; };
      win.performance = win.performance || { now: () => 0 };
      win.IntersectionObserver = class { constructor(cb){this.cb=cb;} observe(el){ this.cb([{ isIntersecting: true, target: el }]); } unobserve(){} disconnect(){} };
      // Calendly stub captured for assertions
      win.__calendlyCalls = [];
      win.Calendly = { initPopupWidget(opts){ win.__calendlyCalls.push(opts); } };
    },
  });
  return {
    window: dom.window,
    document: dom.window.document,
    content,
    flushRaf: () => raf.splice(0).forEach(cb => cb(16)),
    ready: ms => new Promise(r => setTimeout(r, ms || 500)),
  };
}

// minimal assert + summary
function makeAsserter() {
  let fails = 0;
  const a = (cond, msg) => { console.log((cond ? 'PASS' : 'FAIL') + ' — ' + msg); if (!cond) fails++; };
  const done = () => { console.log('\n' + (fails ? fails + ' FAILURE(S)' : 'ALL CHECKS PASSED')); process.exit(fails ? 1 : 0); };
  return { a, done };
}

module.exports = { loadSite, makeAsserter };
