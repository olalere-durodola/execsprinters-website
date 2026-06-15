# Our Services Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an owner-editable "Our Services" section (5 informational cards that scroll to the booking form) after the photo bands, before Fleet.

**Architecture:** Static site, no backend. A new `services` block in `content.json` drives a card grid rendered by a `renderServices()` function in the existing `applyContent()` (same pattern as `bands`/`fleet.vehicles`). Nav and footer update via their existing `content.json`-driven arrays. Editable through `admin.html`'s SCHEMA. Tested with the existing jsdom harness.

**Tech Stack:** Vanilla HTML/CSS/JS; Node + jsdom tests (`npm test`).

**Reference spec:** `docs/superpowers/specs/2026-06-14-services-section-design.md`

---

## File Structure

| File | Responsibility | Change |
|------|----------------|--------|
| `content.json` | Add `services` block (header + 5 cards); add nav "Services" link; repoint first footer "Service" links to `#services` | Modify |
| `index.html` | Add `#services` section markup (with static fallback cards) + `renderServices()` in the script + section CSS | Modify |
| `admin.html` | Add a "Services" SCHEMA section (reuses existing field renderers) | Modify |
| `tests/services.test.js` | jsdom tests for the section | Create |
| `package.json` | Add `node tests/services.test.js` to the `test` script | Modify |

No new conventions: the section mirrors how `bands` already works (static fallback markup in a `data-list` container that `applyContent()` rebuilds from `content.json`).

---

## Conventions
- TDD: failing test → run (fail) → implement → run (pass) → commit.
- Run a single suite: `node tests/services.test.js`. Full: `npm test`.
- Commit trailer: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`
- Match the editorial design (paper/bronze), responsive, reduced-motion already handled globally.

---

## Task 1: `content.json` — services block, nav link, footer links

**Files:** Modify `content.json`; Create `tests/services.test.js`

- [ ] **Step 1: Write the failing test** — create `tests/services.test.js`:

```js
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

// DOM checks added in later tasks run after this:
const site = loadSite();
site.ready().then(() => {
  const d = site.document;
  // placeholder kept green until Task 2/3 add real DOM assertions
  a(true, 'site boots');
  done();
});
```

- [ ] **Step 2: Run, expect FAIL** — `node tests/services.test.js` (services/nav checks fail).

- [ ] **Step 3: Edit `content.json`**
  (a) Add a new top-level `"services"` block immediately AFTER the `"fleet"` block (and before `"marquee"`), with a trailing comma:

```jsonc
"services": {
  "eyebrow": "Our Services",
  "heading": "Tailored to *every occasion.*",
  "sub": "Tailored transportation solutions for every occasion.",
  "cta": "Reserve",
  "items": [
    { "title": "Airport Transfers",
      "description": "Reliable, punctual airport pickup and drop-off with flight tracking and meet & greet.",
      "features": ["Flight monitoring", "Luggage assistance", "Complimentary wait time"],
      "price": "$250 / trip · up to 50 mi" },
    { "title": "Corporate Transportation",
      "description": "Professional transportation for executives, meetings, conferences, and corporate events.",
      "features": ["WiFi & power outlets", "Privacy partitions", "Billing & invoicing"],
      "price": "$150/hr · 4-hr minimum" },
    { "title": "Special Events",
      "description": "Make your special occasions memorable with our luxury Sprinter van service.",
      "features": ["Weddings & proms", "Anniversaries", "Night-out packages"],
      "price": "$150/hr · 4-hr minimum" },
    { "title": "Point-to-Point",
      "description": "Direct transportation from your location to your destination with no stops.",
      "features": ["Direct routes", "Fixed pricing", "Express service"],
      "price": "$150/hr" },
    { "title": "Hourly Charter",
      "description": "Book our Sprinter van by the hour for multiple stops and flexible scheduling.",
      "features": ["Flexible timing", "Multiple stops", "Dedicated vehicle"],
      "price": "$150/hr · 4-hr minimum" }
  ]
},
```

  (b) In the `"nav"` array, insert `{ "label": "Services", "href": "#services" }` between the Experience and Fleet entries.

  (c) In `"footer".columns`, the first column titled "Service": change the hrefs of "Airport Transfers", "Corporate Shuttles", and "Charter & Events" from `#experience` to `#services` (leave "Corporate Accounts" → `#quote`).

  Keep `content.json` valid JSON (watch commas).

- [ ] **Step 4: Run, expect PASS** — `node tests/services.test.js` → ALL CHECKS PASSED.

- [ ] **Step 5: Commit**

```bash
git add content.json tests/services.test.js
git commit -m "feat: add services content block, nav link, footer links"
```

---

## Task 2: `index.html` — section markup + CSS

**Files:** Modify `index.html`; Modify `tests/services.test.js`

- [ ] **Step 1: Add failing DOM test** — in `tests/services.test.js`, replace the placeholder `a(true, 'site boots');` line inside `site.ready().then` with:

```js
  a(!!d.querySelector('#services'), 'services section present');
  a(!!d.querySelector('#services .services-grid'), 'services grid present');
  a(d.querySelector('#services [data-list="services.items"]') !== null, 'grid is the services list container');
```

- [ ] **Step 2: Run, expect FAIL** — `node tests/services.test.js`.

- [ ] **Step 3: Add the section markup** in `index.html`. Find the photo-bands block — the `<div data-list="bands">…</div>` immediately followed by `<hr class="divider">` and then `<!-- FLEET -->`. Insert the following BETWEEN that `<hr class="divider">` and `<!-- FLEET -->`:

```html
<!-- SERVICES -->
<section class="services" id="services">
  <div class="wrap">
    <div class="services-head reveal">
      <span class="eyebrow" data-t="services.eyebrow">Our Services</span>
      <h2 data-t="services.heading">Tailored to <em>every occasion.</em></h2>
      <p data-t="services.sub">Tailored transportation solutions for every occasion.</p>
    </div>
    <div class="services-grid" data-list="services.items">
      <article class="service-card reveal">
        <h3>Airport Transfers</h3>
        <p>Reliable, punctual airport pickup and drop-off with flight tracking and meet &amp; greet.</p>
        <ul><li>Flight monitoring</li><li>Luggage assistance</li><li>Complimentary wait time</li></ul>
        <div class="svc-price">$250 / trip · up to 50 mi</div>
        <a href="#quote" class="link">Reserve →</a>
      </article>
    </div>
  </div>
</section>

<hr class="divider">
```

(The single static card is the no-JS/SEO fallback; `renderServices()` rebuilds the grid from `content.json` in Task 3 — same approach as `bands`.)

- [ ] **Step 4: Add CSS** before the `@media(prefers-reduced-motion:reduce){` block:

```css
/* services */
.services{padding:120px 0}
.services-head{max-width:620px;margin-bottom:56px}
.services-head h2{font-size:clamp(28px,3.6vw,46px);font-weight:300;margin:18px 0 14px}
.services-head h2 em{font-style:italic;color:var(--bronze)}
.services-head p{color:var(--ink-soft);font-size:16.5px}
.services-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
.service-card{display:flex;flex-direction:column;min-width:0;background:var(--card);
  border:1px solid var(--line);padding:32px clamp(24px,2.4vw,32px);transition:.4s ease;position:relative}
.service-card::before{content:"";position:absolute;inset:0;border:1px solid transparent;pointer-events:none;transition:.4s}
.service-card:hover{transform:translateY(-5px);box-shadow:0 26px 50px -32px rgba(28,24,18,.4)}
.service-card:hover::before{border-color:var(--bronze)}
.service-card h3{font-size:23px;font-weight:400;margin-bottom:12px}
.service-card>p{color:var(--ink-soft);font-size:15px;margin-bottom:20px}
.service-card ul{list-style:none;display:grid;gap:9px;margin-bottom:22px}
.service-card li{font-size:14px;color:var(--ink-soft);display:flex;align-items:center;gap:10px}
.service-card li::before{content:"";width:6px;height:6px;background:var(--bronze);transform:rotate(45deg);flex:0 0 auto}
.service-card .svc-price{font-family:'JetBrains Mono';font-size:13px;letter-spacing:.02em;color:var(--bronze);
  margin-top:auto;padding-top:16px;border-top:1px solid var(--line)}
.service-card .link{font-family:'JetBrains Mono';font-size:12.5px;letter-spacing:.04em;color:var(--ink);
  display:inline-flex;align-items:center;gap:9px;border-bottom:1px solid var(--bronze);padding-bottom:4px;
  width:fit-content;margin-top:18px;transition:.25s}
.service-card .link:hover{gap:14px;color:var(--bronze)}
@media(max-width:920px){.services{padding:80px 0}.services-grid{grid-template-columns:1fr 1fr}}
@media(max-width:600px){.services-grid{grid-template-columns:1fr}}
```

- [ ] **Step 5: Run, expect PASS** — `node tests/services.test.js`; also `node tests/regression.test.js` → ALL CHECKS PASSED.

- [ ] **Step 6: Commit**

```bash
git add index.html tests/services.test.js
git commit -m "feat: add services section markup and styles"
```

---

## Task 3: `renderServices()` — rebuild grid from content.json

**Files:** Modify `index.html` (script); Modify `tests/services.test.js`

- [ ] **Step 1: Add failing tests** — inside `site.ready().then`, before `done();`:

```js
  const cards = d.querySelectorAll('#services .service-card');
  a(cards.length === site.content.services.items.length, 'renders one card per service (5)');
  a(cards[0].querySelector('h3').textContent === site.content.services.items[0].title, 'card title bound');
  a(cards[0].querySelectorAll('ul li').length === site.content.services.items[0].features.length, 'features rendered');
  a([...cards].every(c => c.querySelector('a.link').getAttribute('href') === '#quote'), 'every card CTA scrolls to #quote');
  a(d.querySelector('#services .service-card .svc-price') !== null, 'price line shown when price set');
  // accent in heading converts
  a(d.querySelector('[data-t="services.heading"] em') !== null, 'heading accent converts to <em>');
  // nav link rendered
  a([...d.querySelector('[data-nav]').querySelectorAll('a')].some(x => x.getAttribute('href') === '#services'), 'nav shows Services link');
```

- [ ] **Step 2: Run, expect FAIL** (cards still equal 1 from the static fallback).

- [ ] **Step 3: Implement `renderServices()`** and call it from `applyContent()`. Add the function near the other list renderers (e.g., right after the `fleet.vehicles` renderer):

```js
// --- services ---
const svc = document.querySelector('[data-list="services.items"]');
if(svc && Array.isArray(get('services.items')))
  svc.innerHTML = get('services.items').map(s =>
    `<article class="service-card reveal">
      <h3>${fmt(s.title)}</h3>
      <p>${fmt(s.description)}</p>
      <ul>${(s.features||[]).map(f=>`<li>${fmt(f)}</li>`).join('')}</ul>
      ${s.price ? `<div class="svc-price">${fmt(s.price)}</div>` : ''}
      <a href="#quote" class="link">${fmt((CONTENT.services&&CONTENT.services.cta)||'Reserve')} →</a>
    </article>`).join('');
```

Place this block inside `applyContent()` alongside the other `data-list` renderers (it relies on the existing `get()` and `fmt()` helpers, and on `observeReveals()` being called afterward — which `applyContent()` already does at its end).

- [ ] **Step 4: Run, expect PASS** — `node tests/services.test.js` and `node tests/regression.test.js` → ALL CHECKS PASSED.

- [ ] **Step 5: Commit**

```bash
git add index.html tests/services.test.js
git commit -m "feat: render services cards from content.json"
```

---

## Task 4: Admin editor — Services section

**Files:** Modify `admin.html`; Modify `tests/services.test.js`; Modify `package.json`

- [ ] **Step 1: Add failing test** — append a second jsdom block to `tests/services.test.js` that loads `admin.html`. To keep one process, add this helper test as a separate file instead: create `tests/services-admin.test.js`:

```js
const fs=require('fs'),path=require('path');
const { JSDOM, VirtualConsole }=require('jsdom');
const html=fs.readFileSync(path.join(__dirname,'..','admin.html'),'utf8');
const cj=JSON.parse(fs.readFileSync(path.join(__dirname,'..','content.json'),'utf8'));
const dom=new JSDOM(html,{runScripts:'dangerously',virtualConsole:new VirtualConsole(),beforeParse(w){
  w.fetch=()=>Promise.resolve({ok:true,json:()=>Promise.resolve(JSON.parse(JSON.stringify(cj)))});
  w.URL.createObjectURL=()=>'blob:x'; w.URL.revokeObjectURL=()=>{};
}});
const d=dom.window.document; let fails=0;
const a=(c,m)=>{console.log((c?'PASS':'FAIL')+' — '+m);if(!c)fails++;};
setTimeout(()=>{
  const titles=[...d.querySelectorAll('details.sec summary')].map(s=>s.textContent);
  a(titles.some(t=>/Services/.test(t)),'admin has a Services section');
  const labels=[...d.querySelectorAll('details.sec label')].map(l=>l.textContent);
  a(labels.some(t=>/Service cards/.test(t)),'service cards list editor rendered');
  console.log('\n'+(fails?fails+' FAILURE(S)':'ALL CHECKS PASSED'));process.exit(fails?1:0);
},300);
```

Add `node tests/services.test.js && node tests/services-admin.test.js` to the `test` script in `package.json` (append to the existing chain).

- [ ] **Step 2: Run, expect FAIL** — `node tests/services-admin.test.js`.

- [ ] **Step 3: Edit `admin.html` SCHEMA** — add this section (e.g., right after the "Fleet" section object):

```js
{ title:'Services', note:'the service cards', fields:[
  {t:'text', p:'services.eyebrow', label:'Small label'},
  {t:'text', p:'services.heading', label:'Heading', hint:'use *asterisks* for accent'},
  {t:'textarea', p:'services.sub', label:'Tagline'},
  {t:'text', p:'services.cta', label:'Card button text'},
  {t:'list', p:'services.items', label:'Service cards', itemLabel:'Service', item:[
    {t:'text', k:'title', label:'Title'},
    {t:'textarea', k:'description', label:'Description'},
    {t:'list-string', k:'features', label:'Features', itemLabel:'Feature'},
    {t:'text', k:'price', label:'Price line (optional)'},
  ]},
]},
```

- [ ] **Step 4: Run, expect PASS** — `node tests/services-admin.test.js`; then `npm test` → all suites ALL CHECKS PASSED.

- [ ] **Step 5: Commit**

```bash
git add admin.html tests/services-admin.test.js package.json
git commit -m "feat: admin editor for services cards"
```

---

## Task 5: Verification + visual check

**Files:** none (verification only)

- [ ] **Step 1: Full suite** — `npm test` → booking, regression, admin, services, services-admin all pass.
- [ ] **Step 2: Visual** — install `puppeteer --no-save`, serve the folder, screenshot the services section at 1440px, 768px, and 390px; confirm 3+2 grid on desktop, no horizontal overflow, cards styled (price line, bronze markers, Reserve link), and the "Services" nav link appears. Delete the script + screenshots after.
- [ ] **Step 3:** Commit any fixes. If clean, nothing to commit.

---

## Definition of done
- `npm test` green across all suites.
- "Our Services" section appears after the photo bands, before Fleet, with 5 cards rendered from `content.json`.
- Each card shows title/description/features, an optional price line (hidden when empty), and a "Reserve →" link to `#quote`.
- "Services" link in the top nav and repointed footer links work.
- Owner can edit/add/remove/reorder service cards in `admin.html` (round-trips to valid JSON).
- Responsive (3 → 2 → 1 columns), no overflow, matches the editorial design.
