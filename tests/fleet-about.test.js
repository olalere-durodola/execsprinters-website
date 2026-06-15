const fs = require('fs'); const path = require('path');
const { loadSite, makeAsserter } = require('./harness');
const { a, done } = makeAsserter();

const c = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'content.json'), 'utf8'));
// data shape
a(c.fleet.vehicle && typeof c.fleet.vehicle === 'object', 'fleet is a single vehicle object');
a(c.fleet.vehicles === undefined, 'old fleet.vehicles array removed');
a(Array.isArray(c.fleet.vehicle.amenities) && c.fleet.vehicle.amenities.length >= 1, 'vehicle has amenities');
a(Array.isArray(c.fleet.vehicle.stats), 'vehicle has stats');
a(c.about && Array.isArray(c.about.paragraphs), 'about block with paragraphs');
a(c.nav.some(n => n.href === '#about'), 'nav has About link');

const site = loadSite();
site.ready().then(() => {
  const d = site.document, v = site.content.fleet.vehicle;
  // fleet showcase rendered from the single vehicle
  a(!!d.querySelector('#fleet .showcase'), 'fleet showcase present');
  a(d.querySelector('[data-fv-name]').textContent === v.name, 'vehicle name bound');
  a(d.querySelector('[data-fv-tag]').textContent === v.tag, 'vehicle tag bound');
  a(d.querySelectorAll('#fleet [data-fv-amenities] li').length === v.amenities.length,
    `amenities rendered (${v.amenities.length})`);
  a(d.querySelectorAll('#fleet [data-fv-stats] > div').length === v.stats.length, 'stats rendered');
  a(d.querySelector('[data-fv-img]').getAttribute('src') === v.image, 'vehicle image bound');

  // about section
  a(!!d.querySelector('#about'), 'about section present');
  a(d.querySelectorAll('#about [data-list="about.paragraphs"] p').length === site.content.about.paragraphs.length,
    'about paragraphs rendered');
  a(d.querySelector('[data-t="about.heading"] em') !== null, 'about heading accent converts');

  // nav link rendered
  a([...d.querySelector('[data-nav]').querySelectorAll('a')].some(x => x.getAttribute('href') === '#about'),
    'nav shows About link');
  done();
});
