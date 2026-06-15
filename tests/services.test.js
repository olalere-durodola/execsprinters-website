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
  a(!!d.querySelector('#services'), 'services section present');
  a(!!d.querySelector('#services .services-grid'), 'services grid present');
  a(d.querySelector('#services [data-list="services.items"]') !== null, 'grid is the services list container');

  const cards = d.querySelectorAll('#services .service-card');
  a(cards.length === site.content.services.items.length, 'renders one card per service (5)');
  a(cards[0].querySelector('h3').textContent === site.content.services.items[0].title, 'card title bound');
  a(cards[0].querySelectorAll('ul li').length === site.content.services.items[0].features.length, 'features rendered');
  a([...cards].every(x => x.querySelector('a.link').getAttribute('href') === '#quote'), 'every card CTA scrolls to #quote');
  a(d.querySelector('#services .service-card .svc-price') !== null, 'price line shown when price set');
  a(d.querySelector('[data-t="services.heading"] em') !== null, 'heading accent converts to <em>');
  a([...d.querySelector('[data-nav]').querySelectorAll('a')].some(x => x.getAttribute('href') === '#services'), 'nav shows Services link');
  done();
});
