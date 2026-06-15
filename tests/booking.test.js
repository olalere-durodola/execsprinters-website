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
  const next = d.querySelector('[data-b-next]');
  const back = d.querySelector('[data-b-back]');
  // can't advance with empty required pickup
  next.click();
  a(d.querySelector('[data-step="1"].is-active') !== null, 'blocked on step 1 when invalid');
  a(d.querySelector('[data-b-err]').textContent.length > 0, 'shows validation error');
  // fill required step 1 (point-to-point) then advance
  d.querySelector('[data-b-pickup]').value = 'DFW Terminal D';
  d.querySelector('[data-b-dropoff]').value = 'Plano';
  d.querySelector('[data-b-when]').value = '2099-01-01T10:00';
  next.click();
  a(d.querySelector('[data-step="2"].is-active') !== null, 'advances to step 2');
  a(!back.hidden, 'back button visible on step 2');
  back.click();
  a(d.querySelector('[data-step="1"].is-active') !== null, 'back returns to step 1');
  const svc = d.querySelector('[data-b-service]');
  const setSvc = v => { svc.value = v; svc.dispatchEvent(new site.window.Event('change')); };
  setSvc('Hourly / As Directed');
  a(!d.querySelector('[data-b-hours-wrap]').hidden, 'hours shown for hourly');
  a(d.querySelector('[data-b-dropoff-wrap]').hidden, 'drop-off hidden for hourly');
  setSvc('From Airport');
  a(!d.querySelector('[data-b-flight-wrap]').hidden, 'flight shown for airport');
  a(d.querySelector('[data-b-hours-wrap]').hidden, 'hours hidden for airport');
  a(!d.querySelector('[data-b-dropoff-wrap]').hidden, 'drop-off shown for airport');
  const pax = d.querySelector('[data-b-stepper="pax"]');
  a(pax.querySelectorAll('button').length === 2, 'stepper rendered with two buttons');
  const inc = pax.querySelectorAll('button')[1];
  inc.click(); inc.click();
  a(pax.querySelector('.b-val').textContent === '3', 'passenger stepper increments to 3');
  // min clamp
  const seats = d.querySelector('[data-b-stepper="seats"]');
  seats.querySelectorAll('button')[0].click();
  a(seats.querySelector('.b-val').textContent === '0', 'seats clamp at min 0');
  // seat type reveal when seats > 0
  seats.querySelectorAll('button')[1].click();
  a(!d.querySelector('[data-b-seattype-wrap]').hidden, 'seat type appears when seats > 0');
  // add stop
  const before = d.querySelectorAll('[data-b-stops] input').length;
  d.querySelector('[data-b-addstop]').click();
  a(d.querySelectorAll('[data-b-stops] input').length === before + 1, 'add stop adds a field');
  setSvc('Hourly / As Directed');
  d.querySelector('[data-b-hours]').value = '6';
  d.querySelector('[data-b-hours]').dispatchEvent(new site.window.Event('input'));
  const est = d.querySelector('[data-b-estimate]');
  a(est.classList.contains('show'), 'estimate shown for hourly');
  a(/\$900\.00/.test(est.textContent), 'hourly base 6×150 = $900.00');
  a(/\$1,154\.25/.test(est.textContent), 'hourly total includes gratuity = $1,154.25');
  a(/Gratuity/.test(est.textContent), 'gratuity line present');
  // airport = flat rate
  setSvc('From Airport');
  a(/\$250\.00/.test(est.textContent), 'airport base = flat $250.00');
  a(/Gratuity/.test(est.textContent), 'airport estimate has gratuity line');
  a(!/confirmed at booking/i.test(est.textContent), 'no more fare-confirmed copy');
  // point-to-point = hourly priced, hours field visible, 4-hr minimum
  setSvc('Point-to-Point');
  a(!d.querySelector('[data-b-hours-wrap]').hidden, 'hours field shows for point-to-point');
  d.querySelector('[data-b-hours]').value = '1';
  d.querySelector('[data-b-hours]').dispatchEvent(new site.window.Event('input'));
  a(/\$600\.00/.test(est.textContent), 'point-to-point clamps to 4-hr min = $600.00 base');
  // fill a full point-to-point booking and submit from step 3
  setSvc('Point-to-Point');
  d.querySelector('[data-b-pickup]').value='DFW Terminal D';
  d.querySelector('[data-b-dropoff]').value='Legacy West, Plano';
  d.querySelector('[data-b-when]').value='2099-02-03T14:30';
  d.querySelector('[data-b-next]').click(); // ->2
  d.querySelector('[data-b-next]').click(); // ->3
  a(d.querySelector('[data-b-review]').textContent.includes('DFW Terminal D'), 'review shows pickup');
  d.querySelector('[data-b-name]').value='Jane Exec';
  d.querySelector('[data-b-email]').value='jane@corp.com';
  d.querySelector('[data-b-phone]').value='8175551234';
  d.querySelector('[data-b-next]').click(); // submit
  const call = site.window.__calendlyCalls.pop();
  a(call && call.url === site.content.contact.calendlyUrl, 'Calendly opened with configured url');
  a(call.prefill.name === 'Jane Exec' && call.prefill.email === 'jane@corp.com', 'name/email prefilled');
  a(/Pick-up: DFW Terminal D/.test(call.prefill.customAnswers.a1), 'summary in customAnswers.a1');
  a(/Drop-off: Legacy West/.test(call.prefill.customAnswers.a1), 'summary includes drop-off');
  a(/Phone: 8175551234/.test(call.prefill.customAnswers.a1), 'summary includes phone');

  // child-seat stepper caps at its max (4)
  const seats2 = d.querySelector('[data-b-stepper="seats"]');
  const seatInc = seats2.querySelectorAll('button')[1];
  for(let i=0;i<10;i++) seatInc.click();
  a(seats2.querySelector('.b-val').textContent === '4', 'child seats clamp at max 4');

  // Calendly fallback: when window.Calendly is missing, details are not lost
  let opened = null;
  site.window.Calendly = undefined;
  site.window.open = (u)=>{ opened = u; return null; };
  d.querySelector('[data-b-next]').click(); // re-submit from step 3 (still filled)
  a(opened === site.content.contact.calendlyUrl, 'fallback opens calendly url in new tab');
  a(d.querySelector('[data-b-err]').textContent.length > 0, 'fallback shows a recovery message');
  done();
});
