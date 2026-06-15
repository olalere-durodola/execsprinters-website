const { loadSite, makeAsserter } = require('./harness');
const { a, done } = makeAsserter();
const site = loadSite();
site.ready().then(() => {
  const d = site.document, c = site.content;
  a(d.querySelectorAll('[data-list="bands"] .band').length === c.bands.length, 'bands render');
  a(d.querySelectorAll('#marqueeTrack .m-item').length === c.marquee.length * 2, 'marquee renders');
  a(d.querySelector('[data-t="testimonial.quote"]').textContent.includes('curb'), 'testimonial renders');
  a(d.documentElement.style.getPropertyValue('--bronze') === c.theme.bronze, 'theme applied');
  done();
});
