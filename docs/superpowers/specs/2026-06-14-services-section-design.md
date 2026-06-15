# ExecSprinters — "Our Services" Section

**Date:** 2026-06-14
**Status:** Approved design (pending spec review + user confirmation)

## 1. Summary

Add an informational **"Our Services"** section to the single-page site: a header plus a
**3-column card grid** of five services (Airport Transfers, Corporate Transportation,
Special Events, Point-to-Point, Hourly Charter). Each card shows a
title, description, feature bullets, an optional price line, and a **"Reserve →"** link
that smooth-scrolls to the existing booking form (`#quote`). The section is fully
owner-editable through `content.json` + `admin.html`, consistent with the rest of the site.
No backend; static site unchanged in architecture.

## 2. Decisions (locked during brainstorming)

| # | Decision | Choice |
|---|----------|--------|
| 1 | Relationship to booking | **Informational + scroll to booking.** Cards are marketing; each has a button that scrolls to `#quote`. The booking form keeps its own 4 service types. No data coupling. |
| 2 | Placement | **After the 3 photo bands, before Fleet.** `id="services"`. |
| 3 | Navigation | Add **"Services"** link to the top nav (between Experience and Fleet) and to the footer "Service" column. |
| 4 | Pricing | Per-card **optional free-text** price line (empty string → price line not rendered). |
| 5 | Card CTA | A **"Reserve →"** link per card scrolling to `#quote`. |
| 6 | Editability | New `services` block in `content.json`; editable via `admin.html` (add/remove/reorder cards, edit all fields). |

## 3. Content model (`content.json`)

Add a new top-level `services` block:
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
}
```
- `heading` supports the `*asterisk*` → italic-bronze accent convention (via existing `fmt`).
- `price` is optional; empty string → the price line is not rendered.
- All copy above is the default; the owner edits it in `admin.html`.

## 4. Markup & rendering

- **Section** (`index.html`), inserted after the photo bands `<div data-list="bands">…</div>`
  and the following `<hr class="divider">`, before `<!-- FLEET -->`:
  ```html
  <section class="services" id="services">
    <div class="wrap">
      <div class="services-head reveal">
        <span class="eyebrow" data-t="services.eyebrow">Our Services</span>
        <h2 data-t="services.heading">Tailored to <em>every occasion.</em></h2>
        <p data-t="services.sub">Tailored transportation solutions for every occasion.</p>
      </div>
      <div class="services-grid" data-list="services.items">
        <!-- static fallback cards (1–2) for no-JS/SEO; JS rebuilds from content.json -->
      </div>
    </div>
  </section>
  <hr class="divider">
  ```
- **Render:** in `applyContent()`, add a `services.items` renderer (same pattern as
  `bands`/`fleet.vehicles`). Each card:
  ```html
  <article class="service-card reveal">
    <h3>{title}</h3>
    <p>{description}</p>
    <ul>{features → <li>feature</li>}</ul>
    <div class="svc-price">{price}</div>   <!-- omitted when price is empty -->
    <a href="#quote" class="link">{services.cta} →</a>
  </article>
  ```
  Uses existing `fmt()` for escaping + accent. Feature `<li>`s get a bronze marker via CSS.
- **Static fallback:** include the first one or two cards as static HTML inside the grid so
  the section is meaningful with JS disabled and for crawlers; the renderer replaces the
  grid's contents from `content.json` (matches how `bands` works today).

## 5. Styling

- New CSS block (before the reduced-motion media query), in the site's editorial language:
  section padding consistent with `.fleet`/`.areas`; `.services-head` max-width ~620px;
  `.services-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24–32px}`.
- `.service-card`: light card (`var(--card)`) with `1px solid var(--line)`, padding ~30px,
  subtle hover lift + bronze hairline (mirroring `.vehicle`), Fraunces `h3`, muted body,
  feature `<ul>` with a small bronze square/diamond marker per `<li>` (like `.b-assure`),
  a `.svc-price` line (JetBrains Mono, bronze, near the bottom), and a `.link` CTA reusing
  the existing band `.link` style (bronze underline, arrow nudges on hover).
- Responsive: `repeat(3,1fr)` → 2 columns ≤ ~920px → 1 column ≤ ~600px. Use `min-width:0`
  on grid children to avoid the overflow class of bug seen in the booking form.
- Respect `prefers-reduced-motion` (reveals already gated globally).

## 6. Navigation & footer

- `content.json` `nav` array: add `{ "label": "Services", "href": "#services" }` between
  Experience and Fleet. (Nav renders from this array, so this is the only nav change.)
- Footer "Service" column already lists service-style links; update its first items to point
  to `#services` (e.g., "Airport Transfers", "Corporate Shuttles", "Charter & Events" →
  `#services`). Footer is rendered from `footer.columns`, so this is a `content.json` edit.

## 7. Admin editor (`admin.html`)

Add a new SCHEMA section **"Services"**:
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
Reuses existing `list` / `list-string` / `text` / `textarea` renderers — no admin engine
changes. Owner can add/remove/reorder cards and features.

## 8. Testing (jsdom, existing harness)

- `services.items` renders the correct number of `.service-card` elements from `content.json`.
- A card with a non-empty `price` renders `.svc-price`; a card with `price:""` does not.
- Card titles/descriptions/features bind correctly; accent (`*…*`) converts in the heading.
- Each card's CTA `href === "#quote"`.
- Nav includes a link with `href="#services"`.
- Regression: existing render (bands, marquee, testimonial, booking, admin) still passes;
  admin builds a "Services" section.

## 9. Out of scope / future (YAGNI)

- No coupling between these cards and the booking form's service-type dropdown or estimate.
- No per-service icons/illustrations (text + bronze markers only).
- No deep-link pre-selection of the booking form (decided against; "scroll to booking" only).

## 10. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Grid overflow on narrow widths (as happened with booking) | `min-width:0` on grid children; tested at mobile widths |
| Two pricing sources drift (cards vs hourly rate in `rates`) | Card prices are free-text display only, explicitly decoupled; documented for the owner |
| Card count not divisible by 3 | 5 cards = 3 + 2; grid handles any count gracefully (cards left-align, no awkward stretch) |
