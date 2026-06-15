const { loadSite, makeAsserter } = require('./harness');
const fs = require('fs'); const path = require('path');
const { a, done } = makeAsserter();

// data-shape checks (no DOM needed)
const c = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'content.json'), 'utf8'));
a(c.booking && typeof c.booking === 'object', 'content.booking exists');
a(Array.isArray(c.booking.serviceTypes) && c.booking.serviceTypes.length === 4, 'serviceTypes has 4 entries');
a(Array.isArray(c.booking.childSeatTypes) && c.booking.childSeatTypes.length >= 1, 'childSeatTypes present');
a(typeof c.booking.maxStops === 'number', 'maxStops is a number');
a(typeof c.booking.heading === 'string' && typeof c.booking.sub === 'string', 'booking heading/sub present');
a(c.quote === undefined, 'old quote block removed');

const site = loadSite();
site.ready().then(() => {
  const d = site.document;
  a(!!d.querySelector('#quote.booking'), 'booking section present with id=quote');
  a(d.querySelectorAll('#quote .b-step').length === 3, 'three step panels');
  a(d.querySelectorAll('#quote .b-progress .b-dot').length === 3, 'progress has 3 dots');
  a(!!d.querySelector('#quote [data-b-next]') && !!d.querySelector('#quote [data-b-back]'), 'has next/back buttons');
  a(!!d.querySelector('#quote select[data-b-service]'), 'service type select present');
  a(d.querySelector('[data-b-service]').options.length === site.content.booking.serviceTypes.length, 'service options populated');
  a(d.querySelector('[data-b-vehicle]').options.length === site.content.fleet.vehicles.length, 'vehicle options from fleet');
  a(d.querySelector('[data-b-seattype]').options.length === site.content.booking.childSeatTypes.length, 'seat type options populated');
  a(d.querySelector('#quote .sub').textContent.includes('four-hour'), 'booking sub text bound');
  done();
});
