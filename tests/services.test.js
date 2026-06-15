const fs = require('fs'); const path = require('path');
const { loadSite, makeAsserter } = require('./harness');
const { a, done } = makeAsserter();

// data-shape checks
const c = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'content.json'), 'utf8'));
a(c.services && typeof c.services === 'object', 'content.services exists');
a(Array.isArray(c.services.items) && c.services.items.length === 5, 'services has 5 items');
a(typeof c.services.heading === 'string' && typeof c.services.cta === 'string', 'services heading + cta present');
a(c.services.items.every(s => s.title && s.description && Array.isArray(s.features)), 'each service has title/description/features');
a(c.nav.some(n => n.href === '#services'), 'nav has a Services link');

const site = loadSite();
site.ready().then(() => {
  const d = site.document;
  a(true, 'site boots');
  done();
});
