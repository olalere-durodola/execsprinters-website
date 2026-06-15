# ExecSprinters — Multi-Step Booking Flow

**Date:** 2026-06-14
**Status:** Approved design (pending spec review + user confirmation)
**Author:** Brainstormed with the site owner

## 1. Summary

Replace the existing single "Quote" section on the ExecSprinters marketing site with a
polished **3-step reservation form**. The form collects full trip details (matching the
reference booking widget the owner shared), shows a live price estimate where it can be
computed honestly, then hands a **pre-filled summary to Calendly**, where the customer
selects a time and pays. No backend is introduced — the site remains a static, no-build,
self-hosted (Cloudflare Pages) deliverable that a non-technical owner edits through
`admin.html` / `content.json`.

## 2. Goals & non-goals

### Goals
- Give customers a complete, professional booking experience (service type, stops,
  passengers, luggage, child seats, accessibility, contact).
- Hand off cleanly to Calendly with all details pre-filled so the owner receives a
  complete reservation alongside Calendly's payment.
- Preserve the live hourly estimate ("your rate, fixed at booking").
- Keep the existing constraints: static, no backend, free to run, owner-editable copy/rates.
- Match the site's bronze/paper editorial design; accessible and mobile-friendly;
  respect `prefers-reduced-motion`.

### Non-goals (YAGNI)
- No live map, address autocomplete, or distance-based fares (explicitly de-scoped — would
  require Google Maps billing).
- No real-time availability, dispatch, driver assignment, or in-house payment processing
  (Calendly owns scheduling + payment).
- No full form-builder in the admin editor. The form **structure** lives in code; only
  text labels and rates are owner-editable.

## 3. Decisions (locked during brainstorming)

| # | Decision | Choice |
|---|----------|--------|
| 1 | What happens on submit | **A** — collect details, hand off to the owner via Calendly |
| 2 | Payment | Handled by **Calendly** (owner confirmed paid plan: Collect Payments) |
| 3 | Map / address | **Simple text address fields** — no maps API, no billing |
| 4 | Relationship to quote calc | **Replace** the Quote section; **keep** the live estimate |
| 5 | Estimate scope | Hourly trips show a computed estimate; other service types show "Fare confirmed at booking" |

## 4. User flow

```
Quote section ("Reserve your sprinter")
        │
        ▼
 Step 1 · Ride Info ──Back/Continue──► Step 2 · Passengers & Extras ──► Step 3 · Details & Review
        │                                                                        │
        │  (inline validation + live estimate panel updates)                     │ "Continue to booking →"
        ▼                                                                        ▼
   progress 1/2/3                                                   Calendly popup opens, PRE-FILLED
                                                                    (name, email, summary in 1 field)
                                                                                 │
                                                                                 ▼
                                                          Customer picks time + pays in Calendly
                                                          Owner receives reservation + payment
```

## 5. Form specification

### Step 1 — Ride Info
| Field | Type | Notes |
|-------|------|-------|
| Service Type | select | `From Airport`, `To Airport`, `Point-to-Point`, `Hourly / As Directed`. Labels owner-editable. |
| Pick-Up Location | text | required |
| Add Stop | repeatable text | 0–3 additional stops, add/remove |
| Drop-Off Location | text | required *unless* Service Type = Hourly (then optional/hidden) |
| Date & Time | datetime-local | required; must be in the future |
| Vehicle | select | `Executive Sprinter`, `Lounge Sprinter` (from `fleet.vehicles[].name`) |
| **Hours** | number | **only when** Service Type = Hourly. Min = `rates.minimumHours`. Drives estimate. |
| **Flight #** | text (optional) | **only when** Service Type = From/To Airport |

### Step 2 — Passengers & Extras
| Field | Type | Notes |
|-------|------|-------|
| Number of Passengers | stepper (− n +) | min 1, default 1 |
| Luggage Count | stepper | min 0, default 0 |
| Add Child Seat | count + type | 0–4 seats; type select (Infant / Convertible / Booster) appears when count > 0 |
| Accessible | toggle | wheelchair-accessible vehicle needed (yes/no) |

### Step 3 — Your Details & Review
| Field | Type | Notes |
|-------|------|-------|
| Full Name | text | required |
| Email | email | required, format-validated |
| Phone | tel | required |
| Notes | textarea | optional |
| Review summary | read-only | renders all collected values for confirmation |

### Validation
- Per-step: clicking **Continue** validates the current step; invalid fields show an inline
  message and focus moves to the first error. Cannot advance with errors.
- Required: pick-up, date/time (future), drop-off (non-hourly), name, email (format), phone.
- Steppers clamp to their min; Hours clamps to `rates.minimumHours`.

## 6. Estimate behavior
- Lives in a panel visible across steps (or on Step 3 review).
- **Hourly / As Directed:** `base = hours × rates.hourly`, `tax = base × rates.salesTaxPercent/100`,
  `total = base + tax`; also shows suggested gratuity (`rates.gratuityPercent`). Reuses the
  existing `calcQuote` math.
- **All other service types:** shows the copy **"Fare confirmed at booking"** (no fabricated
  number, since distance is intentionally unavailable).

## 7. Calendly handoff

On **Continue to booking** (Step 3, after final validation):

1. Build a single multi-line **summary string** from all fields, e.g.:
   ```
   Service: From Airport
   Pick-up: DFW Terminal D
   Stop: Sheraton Downtown
   Drop-off: Legacy West, Plano
   Date/Time: 2026-07-02 14:30
   Vehicle: Executive Sprinter
   Passengers: 3 | Luggage: 4 | Child seats: 1 (Booster) | Accessible: No
   Flight #: AA1423
   Estimate: Fare confirmed at booking
   Notes: ...
   ```
2. Open the Calendly popup pre-filled:
   ```js
   Calendly.initPopupWidget({
     url: contact.calendlyUrl,
     prefill: { name, email, customAnswers: { a1: summary } }
   });
   ```
3. Calendly collects payment and emails the owner the reservation (summary in the custom
   question answer).

**Owner setup (documented in HOW-TO-EDIT.md):**
- Calendly event must have **one custom question** (becomes `a1`) to receive the summary.
- Enable **Collect Payments** on that event (Stripe/PayPal) — owner is on a paid plan.

**Fallback path (built-in, not active by default):** the same summary can be POSTed to a
free form-to-email service (e.g. Web3Forms/Formspree) instead of Calendly. Implemented as a
single `submitBooking()` function with a clearly-marked swap point, so switching away from
Calendly later is a one-line change. Not wired up now.

**Failure handling:** if `window.Calendly` is unavailable (script blocked), fall back to
opening `contact.calendlyUrl` in a new tab with the summary copied to clipboard and a brief
message ("Your details are copied — paste them into the booking notes"). The booking is
never silently lost.

## 8. Editability & data model

Add to `content.json` (and matching admin schema):
```jsonc
"booking": {
  "eyebrow": "Reserve",                       // reuses/aligns with quote.eyebrow
  "heading": "Reserve your *Sprinter.*",
  "sub": "Tell us the trip. Pick a time and pay securely — we handle the rest.",
  "serviceTypes": ["From Airport","To Airport","Point-to-Point","Hourly / As Directed"],
  "childSeatTypes": ["Infant","Convertible","Booster"],
  "maxStops": 3
}
```
- `rates` (existing) continues to drive the estimate.
- Vehicle options come from existing `fleet.vehicles[].name`.
- The existing `quote.*` keys are replaced by `booking.*`; the admin section "Quote section
  text" becomes "Booking form text".
- Form mechanics (steps, validation, Calendly wiring) live in `index.html` JS — not editable
  data, by design.

## 9. Components / structure (isolation)

- **`#booking` section markup** in `index.html` — replaces `#quote`. Three step panels +
  progress + estimate panel + nav buttons. Static fallback content present for no-JS/SEO.
- **`renderBooking()`** in the existing render script — populates labels/options from
  `content.json` (consistent with the current `applyContent` pattern).
- **Booking controller (JS module/IIFE)** — owns step state, validation, stepper/stop/child-seat
  widgets, estimate calculation, and `submitBooking()` (the Calendly handoff). Single clear
  responsibility; testable in isolation.
- **`admin.html` schema** — rename Quote section to Booking, add `serviceTypes` /
  `childSeatTypes` (list-string) and `maxStops` (number) editors.

## 10. Accessibility & responsive
- Each step is a `<fieldset>`/labelled group; steppers and toggle are real buttons/inputs
  with `aria-label`s and keyboard support; progress uses `aria-current`.
- Errors announced inline near fields. Focus management on step change.
- Mobile: single-column, large tap targets (≥48px), matches existing 920px breakpoint.
- All motion gated by `prefers-reduced-motion`.

## 11. Testing (jsdom, same approach as prior work)
- Step navigation: cannot advance past an invalid step; Back/Continue move correctly.
- Validation: required fields, email format, future-date check, stepper/hours clamping.
- Conditional fields: Hours shows only for Hourly; Flight# only for airport types; Drop-off
  optional for Hourly.
- Estimate math: hourly total matches `rates`; non-hourly shows the fixed copy.
- Calendly handoff: `submitBooking()` builds the correct summary string and calls
  `Calendly.initPopupWidget` with the right `url` + `prefill`; fallback path triggers when
  `window.Calendly` is absent.
- Editability: `renderBooking()` applies `content.json` labels; admin builds the new section
  and round-trips edits to valid JSON.
- Regression: existing render tests (theme, marquee, testimonial, stats) still pass.

## 12. Risks & mitigations
| Risk | Mitigation |
|------|------------|
| Calendly custom-question mapping (`a1`) varies per account | Document exact setup; summary goes in ONE question to minimize coupling; fallback copies to clipboard |
| No price for non-hourly may feel incomplete | Honest "Fare confirmed at booking" + the trip detail collection still feels premium; can add flat airport rates later via `rates` |
| Form complexity on mobile | 3 small steps instead of one long form; steppers; tested at mobile width |
| Owner forgets Calendly setup | HOW-TO-EDIT.md gets a clear, short "Booking setup" section |

## 13. Out of scope / future
- Flat airport-zone pricing (would extend `rates`).
- Google Places autocomplete (paid) if the owner later wants it.
- Email-service handoff instead of Calendly (swap point already built in).
- SMS notifications.
