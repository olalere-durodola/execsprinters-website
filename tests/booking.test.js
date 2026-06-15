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

done();
