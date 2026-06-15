# Booking Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the site's single-field quote calculator with a 3-step reservation form that collects full trip details, shows a live hourly estimate, and hands a pre-filled summary to Calendly for scheduling + payment.

**Architecture:** Static site, no backend. The booking section markup lives in `index.html` (keeping `id="quote"` so existing anchors don't break). A `renderBooking()` function fills labels/options from `content.json`; a self-contained Booking controller (IIFE in the existing `<script>`) owns step state, validation, the stepper/stop/child-seat widgets, the estimate, and `submitBooking()` (the Calendly handoff). Copy/rates stay owner-editable via `content.json` + `admin.html`.

**Tech Stack:** Vanilla HTML/CSS/JS. Calendly popup widget (already loaded). Tests via Node + jsdom (dev-only, custom lightweight assertions, matching the existing test approach in this repo).

**Reference spec:** `docs/superpowers/specs/2026-06-14-booking-flow-design.md`

---

## File Structure

| File | Responsibility | Change |
|------|----------------|--------|
| `package.json` | Dev-only test tooling (jsdom devDependency, `npm test` script). Not part of the deployed site. | Create |
| `tests/harness.js` | Tiny shared test helpers: load `index.html` into jsdom with mocked `fetch`/`matchMedia`/`IntersectionObserver`, plus `assert()`/`summary()`. | Create |
| `tests/booking.test.js` | All booking-flow tests (steps, validation, conditional fields, widgets, estimate, Calendly handoff). | Create |
| `tests/regression.test.js` | Re-checks existing render (theme, marquee, testimonial, stats, quote math) still works. | Create |
| `content.json` | Add `booking` block (copy, serviceTypes, childSeatTypes, maxStops). Move pricing copy from `quote.sub` → `booking.sub`. Keep `quote` removed after migration. | Modify |
| `index.html` | Replace `#quote` section markup with the booking section (`id="quote"` retained). Add `renderBooking()` + Booking controller + `submitBooking()` to the script. | Modify |
| `admin.html` | Rename "Quote section text" → "Booking form" in SCHEMA; add editors for `booking.serviceTypes`, `booking.childSeatTypes`, `booking.maxStops`. | Modify |
| `HOW-TO-EDIT.md` | Add "Booking & payment setup (Calendly)" section. | Modify |
| `.gitignore` | Add `tests/` artifacts? No — keep `node_modules/` ignored (already present). `tests/` and `package.json` are committed but dev-only. | (already covers node_modules) |

**Deploy note:** `tests/`, `package.json`, `docs/`, and `node_modules/` are not referenced by the site. When the owner drags the folder to Cloudflare Pages they are harmless (unlinked). No build step is introduced.

---

## Conventions for every task
- **TDD:** write the failing test first, watch it fail, implement minimally, watch it pass, commit.
- **Run tests with:** `npm test` (runs all files in `tests/`) or a single file: `node tests/booking.test.js`.
- **Commit** after each green task. Use the repo trailer:
  `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`
- Keep the design intact (bronze/paper), respect `prefers-reduced-motion`, keyboard-accessible.

---

## Task 0: Test harness

**Files:**
- Create: `package.json`
- Create: `tests/harness.js`
- Create: `tests/regression.test.js`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "execsprinters-site",
  "private": true,
  "scripts": {
    "test": "node tests/booking.test.js && node tests/regression.test.js"
  },
  "devDependencies": {
    "jsdom": "^24.0.0"
  }
}
```

- [ ] **Step 2: Install jsdom**

Run: `npm install`
Expected: `node_modules/` created (already gitignored), no errors.

- [ ] **Step 3: Create `tests/harness.js`**

```js
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
    ready: ms => new Promise(r => setTimeout(r, ms || 350)),
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
```

- [ ] **Step 4: Create `tests/regression.test.js`** (locks existing behavior before we change anything)

```js
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
```

- [ ] **Step 5: Run regression test to confirm baseline green**

Run: `node tests/regression.test.js`
Expected: ALL CHECKS PASSED

- [ ] **Step 6: Commit**

```bash
git add package.json tests/harness.js tests/regression.test.js
git commit -m "test: add jsdom harness and baseline regression test"
```

---

## Task 1: `content.json` — add `booking` block, migrate copy

**Files:**
- Modify: `content.json`
- Test: `tests/booking.test.js` (create)

- [ ] **Step 1: Write the failing test** — create `tests/booking.test.js`

```js
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
```

- [ ] **Step 2: Run it, expect FAIL** (`content.booking exists` fails)

Run: `node tests/booking.test.js`
Expected: FAIL lines for booking.

- [ ] **Step 3: Edit `content.json`** — replace the `"quote": {...}` block with:

```jsonc
"booking": {
  "eyebrow": "Reserve",
  "heading": "Reserve your *Sprinter.*",
  "sub": "$150 per hour · four-hour minimum · no surge, no surprises. Tell us the trip — then pick a time and pay securely.",
  "serviceTypes": ["From Airport", "To Airport", "Point-to-Point", "Hourly / As Directed"],
  "childSeatTypes": ["Infant", "Convertible", "Booster"],
  "maxStops": 3
},
```

(Delete the entire former `"quote"` object. Leave `rates`, `fleet`, `contact.calendlyUrl` untouched.)

- [ ] **Step 4: Run it, expect PASS**

Run: `node tests/booking.test.js`
Expected: ALL CHECKS PASSED

- [ ] **Step 5: Commit**

```bash
git add content.json tests/booking.test.js
git commit -m "feat: add booking content block, retire quote block"
```

---

## Task 2: Booking section markup in `index.html`

Replace the `<!-- QUOTE -->` `<section class="quote" id="quote">...</section>` with the booking section. **Keep `id="quote"`.** Include static fallback content so it works with JS off.

**Files:**
- Modify: `index.html` (the `#quote` section + add booking CSS before the reduced-motion media block)
- Test: `tests/booking.test.js`

- [ ] **Step 1: Add failing DOM test** (append to `tests/booking.test.js`, before `done()` — convert the file to run DOM checks after `ready()`; structure the file so data checks run first, then DOM checks). Replace the trailing `done();` with:

```js
const site = loadSite();
site.ready().then(() => {
  const d = site.document;
  a(!!d.querySelector('#quote.booking'), 'booking section present with id=quote');
  a(d.querySelectorAll('#quote .b-step').length === 3, 'three step panels');
  a(d.querySelectorAll('#quote .b-progress .b-dot').length === 3, 'progress has 3 dots');
  a(!!d.querySelector('#quote [data-b-next]') && !!d.querySelector('#quote [data-b-back]'), 'has next/back buttons');
  a(!!d.querySelector('#quote select[data-b-service]'), 'service type select present');
  done();
});
```

- [ ] **Step 2: Run, expect FAIL** (`booking section present`).

Run: `node tests/booking.test.js`

- [ ] **Step 3: Replace the `#quote` section markup.** Use this structure (classes prefixed `b-`; reuses existing `.btn`, `.field`, `.eyebrow`). Fields carry `data-b-*` hooks. Step 2/3 panels start hidden via `.b-step` + `.is-active`.

```html
<!-- BOOKING -->
<section class="quote booking" id="quote">
  <div class="wrap">
    <div class="quote-inner reveal">
      <div class="b-head">
        <span class="eyebrow" data-t="booking.eyebrow">Reserve</span>
        <h2 data-t="booking.heading">Reserve your <em>Sprinter.</em></h2>
        <p class="sub" data-t="booking.sub"></p>
      </div>

      <div class="b-progress" aria-hidden="true">
        <span class="b-dot is-active" data-step="1"></span>
        <span class="b-dot" data-step="2"></span>
        <span class="b-dot" data-step="3"></span>
      </div>

      <form class="b-form" novalidate>
        <!-- STEP 1 -->
        <fieldset class="b-step is-active" data-step="1">
          <legend>Step 1 · Ride Info</legend>
          <div class="field"><label>Service Type</label>
            <select data-b-service></select></div>
          <div class="field"><label>Pick-Up Location</label>
            <input type="text" data-b-pickup placeholder="DFW Airport, Terminal D" required></div>
          <div data-b-stops></div>
          <button type="button" class="b-link" data-b-addstop>+ Add stop</button>
          <div class="field" data-b-dropoff-wrap><label>Drop-Off Location</label>
            <input type="text" data-b-dropoff placeholder="Legacy West, Plano"></div>
          <div class="field-row">
            <div class="field"><label>Date &amp; Time</label>
              <input type="datetime-local" data-b-when required></div>
            <div class="field"><label>Vehicle</label>
              <select data-b-vehicle></select></div>
          </div>
          <div class="field-row">
            <div class="field" data-b-hours-wrap hidden><label data-b-hours-lbl>Hours (4 min)</label>
              <input type="number" data-b-hours min="4" value="4" step="1"></div>
            <div class="field" data-b-flight-wrap hidden><label>Flight # (optional)</label>
              <input type="text" data-b-flight placeholder="AA1423"></div>
          </div>
        </fieldset>

        <!-- STEP 2 -->
        <fieldset class="b-step" data-step="2">
          <legend>Step 2 · Passengers &amp; Extras</legend>
          <div class="field-row">
            <div class="field"><label>Passengers</label>
              <div class="b-stepper" data-b-stepper="pax" data-min="1" data-val="1"></div></div>
            <div class="field"><label>Luggage</label>
              <div class="b-stepper" data-b-stepper="bags" data-min="0" data-val="0"></div></div>
          </div>
          <div class="field"><label>Child Seats</label>
            <div class="b-stepper" data-b-stepper="seats" data-min="0" data-val="0"></div></div>
          <div class="field" data-b-seattype-wrap hidden><label>Child Seat Type</label>
            <select data-b-seattype></select></div>
          <label class="b-toggle"><input type="checkbox" data-b-accessible>
            <span>Wheelchair-accessible vehicle needed</span></label>
        </fieldset>

        <!-- STEP 3 -->
        <fieldset class="b-step" data-step="3">
          <legend>Step 3 · Your Details</legend>
          <div class="field"><label>Full Name</label>
            <input type="text" data-b-name required></div>
          <div class="field-row">
            <div class="field"><label>Email</label>
              <input type="email" data-b-email required></div>
            <div class="field"><label>Phone</label>
              <input type="tel" data-b-phone required></div>
          </div>
          <div class="field"><label>Notes (optional)</label>
            <textarea data-b-notes rows="2"></textarea></div>
          <div class="b-review" data-b-review></div>
        </fieldset>

        <!-- estimate + nav -->
        <div class="estimate b-estimate" data-b-estimate></div>
        <div class="b-err" data-b-err role="alert" aria-live="polite"></div>
        <div class="b-nav">
          <button type="button" class="btn btn-ghost" data-b-back hidden>← Back</button>
          <button type="button" class="btn qbtn" data-b-next>Continue →</button>
        </div>
      </form>
    </div>
  </div>
</section>
```

- [ ] **Step 4: Add booking CSS** before the `@media(prefers-reduced-motion:reduce)` block. Match the dark `.quote-inner` panel (the booking sits on the same ink card). Key rules:

```css
/* booking form */
.booking .b-head{max-width:46ch;margin-bottom:26px}
.booking .b-head .sub{color:rgba(245,241,234,.7)}
.b-progress{display:flex;gap:10px;margin-bottom:26px}
.b-dot{width:34px;height:3px;border-radius:3px;background:rgba(245,241,234,.2);transition:.3s}
.b-dot.is-active{background:var(--bronze-2)}
.b-step{border:none;display:none}
.b-step.is-active{display:block;animation:rise .4s ease}
.b-step legend{font-family:'JetBrains Mono';font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--bronze-2);margin-bottom:16px}
.booking .field label{color:rgba(245,241,234,.55)}
.b-link{background:none;border:none;color:var(--bronze-2);font-family:'JetBrains Mono';font-size:12px;cursor:pointer;padding:6px 0;letter-spacing:.04em}
.b-stepper{display:flex;align-items:center;border:1px solid rgba(245,241,234,.18)}
.b-stepper button{flex:0 0 46px;height:46px;background:rgba(255,255,255,.04);border:none;color:var(--paper);font-size:18px;cursor:pointer}
.b-stepper button:hover{background:rgba(255,255,255,.09)}
.b-stepper .b-val{flex:1;text-align:center;font-family:'Fraunces';font-size:18px}
.b-toggle{display:flex;align-items:center;gap:12px;margin-top:14px;color:rgba(245,241,234,.8);font-size:14px;cursor:pointer}
.b-toggle input{width:auto}
.b-review{margin-top:18px;padding:16px;border:1px dashed rgba(245,241,234,.22);font-family:'JetBrains Mono';font-size:12px;line-height:1.9;color:rgba(245,241,234,.8);white-space:pre-wrap}
.b-estimate{display:none}.b-estimate.show{display:block}
.b-err{color:#e8a07a;font-family:'JetBrains Mono';font-size:11.5px;min-height:16px;margin:10px 0 0;letter-spacing:.03em}
.b-nav{display:flex;gap:12px;margin-top:18px}
.b-nav .btn{flex:1;justify-content:center}
```

Add reduced-motion guard: append `.b-step.is-active{animation:none}` inside the existing reduced-motion media query.

- [ ] **Step 5: Run, expect PASS** for the Step-2 DOM checks.

Run: `node tests/booking.test.js`
Expected: the 5 markup checks PASS (controller behavior tested later may still be absent — keep those tests for later tasks).

- [ ] **Step 6: Commit**

```bash
git add index.html tests/booking.test.js
git commit -m "feat: add 3-step booking section markup and styles"
```

---

## Task 3: `renderBooking()` — populate from content.json

**Files:**
- Modify: `index.html` (script — add `renderBooking()`, call it from `applyContent()`)
- Test: `tests/booking.test.js`

- [ ] **Step 1: Add failing tests** (append inside the `ready()` block):

```js
a(d.querySelector('[data-b-service]').options.length === site.content.booking.serviceTypes.length, 'service options populated');
a(d.querySelector('[data-b-vehicle]').options.length === site.content.fleet.vehicles.length, 'vehicle options from fleet');
a(d.querySelector('[data-b-seattype]').options.length === site.content.booking.childSeatTypes.length, 'seat type options populated');
a(d.querySelector('#quote .sub').textContent.includes('four-hour'), 'booking sub text bound');
```

- [ ] **Step 2: Run, expect FAIL.**

- [ ] **Step 3: Implement `renderBooking()`** and call it at the end of `applyContent()`:

```js
function renderBooking(){
  const b = CONTENT.booking; if(!b) return;
  const fill = (sel, arr) => { const el=document.querySelector(sel); if(el&&Array.isArray(arr)) el.innerHTML = arr.map(o=>`<option>${fmt(o)}</option>`).join(''); };
  fill('[data-b-service]', b.serviceTypes);
  fill('[data-b-seattype]', b.childSeatTypes);
  const veh = (CONTENT.fleet&&CONTENT.fleet.vehicles||[]).map(v=>v.name);
  fill('[data-b-vehicle]', veh);
}
```

Add `renderBooking();` right before the `buildHero();` call in `applyContent()`.

- [ ] **Step 4: Run, expect PASS.**

- [ ] **Step 5: Commit**

```bash
git add index.html tests/booking.test.js
git commit -m "feat: populate booking options from content.json"
```

---

## Task 4: Booking controller — step navigation + validation

**Files:**
- Modify: `index.html` (script — add the Booking controller IIFE; initialize it from `boot()`'s `.finally`)
- Test: `tests/booking.test.js`

- [ ] **Step 1: Add failing tests:**

```js
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
```

- [ ] **Step 2: Run, expect FAIL.**

- [ ] **Step 3: Implement the controller.** Add this IIFE in the `<script>` (after `openCal`), and call `initBooking()` from `boot()`'s `.finally`:

```js
function initBooking(){
  const form = document.querySelector('#quote .b-form'); if(!form) return;
  const $ = s => form.querySelector(s);
  const steps = [...form.querySelectorAll('.b-step')];
  const dots = [...document.querySelectorAll('#quote .b-dot')];
  const errBox = $('[data-b-err]');
  const back = $('[data-b-back]'), next = $('[data-b-next]');
  let step = 1;
  const isHourly = () => /hourly/i.test($('[data-b-service]').value);

  function show(n){
    step = n;
    steps.forEach(s => s.classList.toggle('is-active', +s.dataset.step === n));
    dots.forEach(dt => dt.classList.toggle('is-active', +dt.dataset.step <= n));
    back.hidden = n === 1;
    next.textContent = n === 3 ? 'Continue to booking →' : 'Continue →';
    errBox.textContent = '';
    if(n === 3) renderReview();
  }
  function fail(msg, el){ errBox.textContent = msg; if(el) el.focus(); return false; }
  function validate(n){
    if(n === 1){
      if(!$('[data-b-pickup]').value.trim()) return fail('Please enter a pick-up location.', $('[data-b-pickup]'));
      if(!isHourly() && !$('[data-b-dropoff]').value.trim()) return fail('Please enter a drop-off location.', $('[data-b-dropoff]'));
      const w = $('[data-b-when]').value;
      if(!w) return fail('Please choose a date and time.', $('[data-b-when]'));
      if(new Date(w).getTime() <= Date.now()) return fail('Please choose a future date and time.', $('[data-b-when]'));
    }
    if(n === 3){
      if(!$('[data-b-name]').value.trim()) return fail('Please enter your name.', $('[data-b-name]'));
      const em = $('[data-b-email]').value.trim();
      if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) return fail('Please enter a valid email.', $('[data-b-email]'));
      if(!$('[data-b-phone]').value.trim()) return fail('Please enter a phone number.', $('[data-b-phone]'));
    }
    return true;
  }
  next.addEventListener('click', () => {
    if(!validate(step)) return;
    if(step < 3) show(step + 1);
    else submitBooking(collect());
  });
  back.addEventListener('click', () => { if(step > 1) show(step - 1); });

  // placeholders filled in later tasks:
  function collect(){ return {}; }
  function renderReview(){}
  window.__booking = { show, validate, collect, isHourly };  // test hook
  show(1);
}
```

- [ ] **Step 4: Run, expect PASS** for the navigation/validation tests.

- [ ] **Step 5: Commit**

```bash
git add index.html tests/booking.test.js
git commit -m "feat: booking step navigation and per-step validation"
```

---

## Task 5: Conditional fields (service type → hours / flight / drop-off)

**Files:**
- Modify: `index.html` (controller)
- Test: `tests/booking.test.js`

- [ ] **Step 1: Add failing tests:**

```js
const svc = d.querySelector('[data-b-service]');
const setSvc = v => { svc.value = v; svc.dispatchEvent(new site.window.Event('change')); };
setSvc('Hourly / As Directed');
a(!d.querySelector('[data-b-hours-wrap]').hidden, 'hours shown for hourly');
a(d.querySelector('[data-b-dropoff-wrap]').hidden, 'drop-off hidden for hourly');
setSvc('From Airport');
a(!d.querySelector('[data-b-flight-wrap]').hidden, 'flight shown for airport');
a(d.querySelector('[data-b-hours-wrap]').hidden, 'hours hidden for airport');
a(!d.querySelector('[data-b-dropoff-wrap]').hidden, 'drop-off shown for airport');
```

- [ ] **Step 2: Run, expect FAIL.**

- [ ] **Step 3: Implement.** In `initBooking()`, add after `show(1)` and wire a `change` handler:

```js
function syncConditional(){
  const v = $('[data-b-service]').value;
  const hourly = /hourly/i.test(v);
  const airport = /airport/i.test(v);
  $('[data-b-hours-wrap]').hidden = !hourly;
  $('[data-b-flight-wrap]').hidden = !airport;
  $('[data-b-dropoff-wrap]').hidden = hourly;
  updateEstimate();           // defined in Task 7 (safe: guard if undefined)
}
$('[data-b-service]').addEventListener('change', syncConditional);
syncConditional();
```

Guard the estimate call for now: `if(typeof updateEstimate==='function') updateEstimate();` (replace once Task 7 lands).

- [ ] **Step 4: Run, expect PASS.**

- [ ] **Step 5: Commit**

```bash
git add index.html tests/booking.test.js
git commit -m "feat: conditional booking fields by service type"
```

---

## Task 6: Widgets — steppers, add-stop, child-seat type

**Files:**
- Modify: `index.html` (controller — build steppers, stop rows, seat-type reveal)
- Test: `tests/booking.test.js`

- [ ] **Step 1: Add failing tests:**

```js
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
```

- [ ] **Step 2: Run, expect FAIL.**

- [ ] **Step 3: Implement** inside `initBooking()`:

```js
// steppers
form.querySelectorAll('[data-b-stepper]').forEach(s => {
  const min = +s.dataset.min || 0;
  let val = +s.dataset.val || min;
  s.innerHTML = `<button type="button" aria-label="decrease">−</button><span class="b-val">${val}</span><button type="button" aria-label="increase">+</button>`;
  const out = s.querySelector('.b-val');
  const set = v => { val = Math.max(min, v); out.textContent = val; s.dataset.val = val;
    if(s.dataset.bStepper === 'seats'){ $('[data-b-seattype-wrap]').hidden = val === 0; } };
  s.querySelectorAll('button')[0].addEventListener('click', () => set(val - 1));
  s.querySelectorAll('button')[1].addEventListener('click', () => set(val + 1));
});
// add / remove stops
const stopsHost = $('[data-b-stops]');
$('[data-b-addstop]').addEventListener('click', () => {
  const max = (CONTENT.booking && CONTENT.booking.maxStops) || 3;
  if(stopsHost.children.length >= max){ errBox.textContent = `Up to ${max} stops.`; return; }
  const row = document.createElement('div'); row.className = 'field';
  row.innerHTML = `<label>Stop</label><input type="text" placeholder="Add a stop">`;
  stopsHost.appendChild(row);
});
```

(Stepper value read helper for later: `const stepVal = k => +form.querySelector(`[data-b-stepper="${k}"]`).dataset.val;`)

- [ ] **Step 4: Run, expect PASS.**

- [ ] **Step 5: Commit**

```bash
git add index.html tests/booking.test.js
git commit -m "feat: booking steppers, add-stop, child-seat reveal"
```

---

## Task 7: Live estimate

**Files:**
- Modify: `index.html` (controller — `updateEstimate()`; replace the Task 5 guard)
- Test: `tests/booking.test.js`

- [ ] **Step 1: Add failing tests:**

```js
setSvc('Hourly / As Directed');
d.querySelector('[data-b-hours]').value = '6';
d.querySelector('[data-b-hours]').dispatchEvent(new site.window.Event('input'));
const est = d.querySelector('[data-b-estimate]');
a(est.classList.contains('show'), 'estimate shown for hourly');
a(/\$900\.00/.test(est.textContent), 'hourly base 6×150 = $900.00');
setSvc('From Airport');
a(/confirmed at booking/i.test(est.textContent), 'non-hourly shows fare-confirmed copy');
```

- [ ] **Step 2: Run, expect FAIL.**

- [ ] **Step 3: Implement `updateEstimate()`** in the controller and replace the guarded call in `syncConditional`:

```js
function updateEstimate(){
  const est = $('[data-b-estimate]'); const r = (CONTENT.rates)||{};
  if(isHourly()){
    const RATE=+r.hourly||150, MIN=+r.minimumHours||4, TAX=(+r.salesTaxPercent||0)/100, GRAT=(+r.gratuityPercent||0)/100;
    let hrs=Math.floor(parseFloat($('[data-b-hours]').value)||MIN); if(hrs<MIN){hrs=MIN; $('[data-b-hours]').value=MIN;}
    const base=hrs*RATE, tax=base*TAX, total=base+tax, grat=base*GRAT;
    est.innerHTML =
      `<div class="line"><span class="lbl">Base (${hrs} hrs × $${RATE})</span><span class="val">${money(base)}</span></div>`+
      `<div class="line"><span class="lbl">Sales tax (${r.salesTaxPercent||0}%)</span><span class="val">${money(tax)}</span></div>`+
      `<div class="rule"></div>`+
      `<div class="line"><span class="lbl" style="color:var(--paper)">Total</span><span class="price">${money(total)}</span></div>`+
      `<div class="grat"><div class="line"><span class="lbl">+ Gratuity (${r.gratuityPercent||0}%)</span><span class="val">${money(grat)}</span></div></div>`;
  } else {
    est.innerHTML = `<div class="line"><span class="lbl" style="color:var(--paper)">Estimate</span><span class="val">Fare confirmed at booking</span></div>`;
  }
  est.classList.add('show');
}
$('[data-b-hours]').addEventListener('input', updateEstimate);
```

Replace the Task 5 guarded line with a direct `updateEstimate();`.

- [ ] **Step 4: Run, expect PASS.**

- [ ] **Step 5: Commit**

```bash
git add index.html tests/booking.test.js
git commit -m "feat: live hourly estimate, fare-confirmed for other types"
```

---

## Task 8: `submitBooking()` — Calendly handoff

**Files:**
- Modify: `index.html` (controller — `collect()`, `renderReview()`, `submitBooking()`)
- Test: `tests/booking.test.js`

- [ ] **Step 1: Add failing tests:**

```js
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
```

- [ ] **Step 2: Run, expect FAIL.**

- [ ] **Step 3: Implement** `collect`, `renderReview`, `submitBooking`, replacing the Task 4 placeholders:

```js
function stepVal(k){ const s=form.querySelector(`[data-b-stepper="${k}"]`); return s?+s.dataset.val:0; }
function collect(){
  const stops = [...stopsHost.querySelectorAll('input')].map(i=>i.value.trim()).filter(Boolean);
  const seats = stepVal('seats');
  return {
    service: $('[data-b-service]').value,
    pickup: $('[data-b-pickup]').value.trim(),
    stops,
    dropoff: isHourly() ? '' : $('[data-b-dropoff]').value.trim(),
    when: $('[data-b-when]').value.replace('T',' '),
    vehicle: $('[data-b-vehicle]').value,
    hours: isHourly() ? Math.max((CONTENT.rates&&CONTENT.rates.minimumHours)||4, Math.floor(+$('[data-b-hours]').value||0)) : '',
    flight: /airport/i.test($('[data-b-service]').value) ? $('[data-b-flight]').value.trim() : '',
    pax: stepVal('pax'), bags: stepVal('bags'),
    seats, seatType: seats>0 ? $('[data-b-seattype]').value : '',
    accessible: $('[data-b-accessible]').checked ? 'Yes' : 'No',
    name: $('[data-b-name]').value.trim(),
    email: $('[data-b-email]').value.trim(),
    phone: $('[data-b-phone]').value.trim(),
    notes: $('[data-b-notes]').value.trim(),
  };
}
function summarize(b){
  const L=[];
  L.push('Service: '+b.service);
  L.push('Pick-up: '+b.pickup);
  b.stops.forEach(s=>L.push('Stop: '+s));
  if(b.dropoff) L.push('Drop-off: '+b.dropoff);
  L.push('Date/Time: '+b.when);
  L.push('Vehicle: '+b.vehicle);
  if(b.hours) L.push('Hours: '+b.hours);
  if(b.flight) L.push('Flight #: '+b.flight);
  L.push(`Passengers: ${b.pax} | Luggage: ${b.bags} | Child seats: ${b.seats}${b.seatType?` (${b.seatType})`:''} | Accessible: ${b.accessible}`);
  if(b.notes) L.push('Notes: '+b.notes);
  return L.join('\n');
}
function renderReview(){ $('[data-b-review]').textContent = summarize(collect()); }
function submitBooking(b){
  const summary = summarize(b);
  const url = (CONTENT.contact && CONTENT.contact.calendlyUrl) || '';
  const prefill = { name: b.name, email: b.email, customAnswers: { a1: summary } };
  if(window.Calendly && url){ window.Calendly.initPopupWidget({ url, prefill }); return; }
  // fallback: copy details + open scheduling link in a new tab
  try{ navigator.clipboard && navigator.clipboard.writeText(summary); }catch(e){}
  errBox.textContent = 'Your trip details are copied — paste them into the booking notes.';
  if(url) window.open(url, '_blank');
}
```

- [ ] **Step 4: Run, expect PASS.**

- [ ] **Step 5: Commit**

```bash
git add index.html tests/booking.test.js
git commit -m "feat: build booking summary and Calendly prefill handoff"
```

---

## Task 9: Admin editor — Booking section

**Files:**
- Modify: `admin.html` (SCHEMA: rename Quote → Booking; add list/number editors)
- Test: extend `tests/regression.test.js` (admin loads, 14→ same count, new section present)

- [ ] **Step 1: Add failing admin test** — create `tests/admin.test.js`:

```js
const fs=require('fs'),path=require('path');
const { JSDOM, VirtualConsole }=require('jsdom');
const html=fs.readFileSync(path.join(__dirname,'..','admin.html'),'utf8');
const cj=JSON.parse(fs.readFileSync(path.join(__dirname,'..','content.json'),'utf8'));
const vc=new VirtualConsole();
const dom=new JSDOM(html,{runScripts:'dangerously',virtualConsole:vc,beforeParse(w){
  w.fetch=()=>Promise.resolve({ok:true,json:()=>Promise.resolve(JSON.parse(JSON.stringify(cj)))});
  w.URL.createObjectURL=()=>'blob:x'; w.URL.revokeObjectURL=()=>{};
}});
const d=dom.window.document; let fails=0;
const a=(c,m)=>{console.log((c?'PASS':'FAIL')+' — '+m);if(!c)fails++;};
setTimeout(()=>{
  const titles=[...d.querySelectorAll('details.sec summary')].map(s=>s.textContent);
  a(titles.some(t=>/Booking form/.test(t)),'admin has Booking form section');
  a(!titles.some(t=>/Quote section text/.test(t)),'old Quote section removed');
  a(!!d.querySelector('details.sec'),'admin built sections');
  console.log('\n'+(fails?fails+' FAILURE(S)':'ALL CHECKS PASSED'));process.exit(fails?1:0);
},300);
```

Add `node tests/admin.test.js` to the `test` script in `package.json`.

- [ ] **Step 2: Run, expect FAIL.**

- [ ] **Step 3: Edit `admin.html` SCHEMA** — replace the `{ title:'Quote section text', ... }` block with:

```js
{ title:'Booking form', note:'headline, service types, options', fields:[
  {t:'text', p:'booking.eyebrow', label:'Small label'},
  {t:'text', p:'booking.heading', label:'Heading', hint:'use *asterisks* for accent'},
  {t:'textarea', p:'booking.sub', label:'Sub text'},
  {t:'list-string', p:'booking.serviceTypes', label:'Service types', itemLabel:'Service'},
  {t:'list-string', p:'booking.childSeatTypes', label:'Child seat types', itemLabel:'Type'},
  {t:'number', p:'booking.maxStops', label:'Max extra stops'},
]},
```

- [ ] **Step 4: Run, expect PASS.**

- [ ] **Step 5: Commit**

```bash
git add admin.html tests/admin.test.js package.json
git commit -m "feat: admin editor for booking form content"
```

---

## Task 10: Owner docs — Calendly booking setup

**Files:**
- Modify: `HOW-TO-EDIT.md`

- [ ] **Step 1: Add a "Booking & payment setup (Calendly)" section** documenting:
  - The site collects the trip and opens your Calendly to schedule + pay.
  - **Required once in Calendly:** on the booking event, (1) turn on **Collect Payments** (Stripe/PayPal); (2) add **one custom question** (e.g. "Trip details") — the site fills it automatically with the full reservation summary.
  - Editing service types / seat types / max stops / rates is done in `admin.html`.
  - Note: the booking summary lands in that custom question on every reservation.

- [ ] **Step 2: Commit**

```bash
git add HOW-TO-EDIT.md
git commit -m "docs: Calendly booking & payment setup for the owner"
```

---

## Task 11: Full verification + visual check

**Files:** none (verification only)

- [ ] **Step 1: Run the whole suite**

Run: `npm test`
Expected: ALL CHECKS PASSED across booking, regression, admin.

- [ ] **Step 2: Visual smoke test** — render with a temporary puppeteer script (install `puppeteer --no-save`), serve the folder, and screenshot the booking section across the 3 steps + an estimate state. Confirm: dark panel matches design, steppers/labels readable, nothing overflows at 1440px and at 390px mobile width. Delete the puppeteer script + screenshots after.

- [ ] **Step 3: Manual sanity in a real browser via local server**

Run: `npx --yes http-server -p 8080 .` (or `python -m http.server 8080`)
Open `http://localhost:8080/` → scroll to Reserve → walk all 3 steps → confirm Calendly popup opens with details (use your real `calendlyUrl`).

- [ ] **Step 4: Commit any fixes found.**

---

## Task 12: Cleanup + final commit

- [ ] **Step 1:** Ensure no stray test artifacts (`node_modules/` gitignored; remove any puppeteer screenshots/scripts).
- [ ] **Step 2:** `git status` clean except intended files.
- [ ] **Step 3:** Push: `git push` (if the user wants it pushed to GitHub).

---

## Definition of done
- `npm test` green (booking + regression + admin).
- Booking form replaces the quote calculator, keeps `id="quote"`, all existing nav/links still work.
- Live hourly estimate correct; non-hourly shows "Fare confirmed at booking".
- Submitting opens Calendly pre-filled with name/email + full summary in `customAnswers.a1`; fallback copies summary + opens the link if Calendly is unavailable.
- Service types / seat types / max stops / copy editable in `admin.html`; round-trips to valid `content.json`.
- Design, responsiveness, reduced-motion, and accessibility preserved.
- `HOW-TO-EDIT.md` documents the one-time Calendly setup.
