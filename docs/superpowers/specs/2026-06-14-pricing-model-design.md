# ExecSprinters — Booking Estimate Pricing Model

**Date:** 2026-06-14
**Status:** Approved design (pending spec review + user confirmation)

## 1. Goal

Make the booking estimate show a real Total for **every** service type (today only
"Hourly / As Directed" computes a number; airport and point-to-point show
"Fare confirmed at booking"). Roll **gratuity into the Total**.

## 2. Decisions (locked)

| # | Decision | Choice |
|---|----------|--------|
| 1 | Airport (From/To) | **Flat per-trip rate**, default **$250**, one rate for both directions, editable in admin. No Hours field. |
| 2 | Point-to-Point | **hours × hourly rate, 4-hr minimum** (now shows the Hours field). |
| 3 | Hourly / As-Directed | hours × hourly rate, 4-hr minimum (unchanged). |
| 4 | Tax | `salesTaxPercent` (8.25%) of the pre-tax base. |
| 5 | Gratuity | `gratuityPercent` (20%) of the pre-tax base, **included in the Total** (was shown separately). Drop the "paid separately" note. |
| 6 | "Fare confirmed at booking" | **Removed** — every type now computes a number. |

## 3. Data model (`content.json` → `rates`)

Add one key:
```jsonc
"rates": {
  "hourly": 150,
  "minimumHours": 4,
  "salesTaxPercent": 8.25,
  "gratuityPercent": 20,
  "airportFlat": 250        // NEW — flat per-trip airport fare
}
```

## 4. Estimate logic (`updateEstimate()` in index.html)

```
isAirport  = service matches /airport/i
isHourly   = service matches /hourly/i        (Hourly / As-Directed)
isPointToPoint = neither airport nor hourly   (Point-to-Point)
usesHours  = isHourly || isPointToPoint

base = isAirport ? rates.airportFlat
                 : max(rates.minimumHours, floor(hoursInput)) * rates.hourly
tax  = base * salesTaxPercent/100
grat = base * gratuityPercent/100
total = base + tax + grat
```

Rendered breakdown (all types):
```
Base ............ <money(base)>     // airport: "Airport flat rate" · hourly/p2p: "(N hrs × $RATE)"
Sales tax (8.25%) <money(tax)>
Gratuity (20%) .. <money(grat)>
─────────────────
Total ........... <money(total)>
```
- Remove the `else` branch that printed "Fare confirmed at booking".
- Remove the separate `.grat` "paid separately" note; gratuity is now a normal line inside the total.

## 5. Conditional fields

`syncConditional()` currently shows the Hours field only for hourly. Change so the Hours
field (`[data-b-hours-wrap]`) shows when **hourly OR point-to-point**. Airport keeps it hidden.
Flight # still only for airport; drop-off still hidden only for hourly (point-to-point keeps
drop-off). The Hours-input `input` listener still recomputes the estimate.

**Validation unchanged & correct:** `validate()` requires drop-off for all non-hourly types,
which includes airport — this is intended (airport transfers have a destination/origin), so
no change to `validate()`.

## 6. Collect / summary

`collect()` must capture `hours` whenever the Hours field is in use (hourly **or**
point-to-point), not only hourly. The Calendly summary already lists Hours when present —
no other change. (Airport: no hours line.)

## 7. Admin editor

In the **Pricing** SCHEMA section, add:
```js
{t:'number', p:'rates.airportFlat', label:'Airport flat rate ($ per trip)'},
```

## 8. Testing (jsdom)

Update/extend `tests/booking.test.js`:
- **Airport flat:** select "From Airport" → estimate Base == `airportFlat`, no Hours field,
  Total == base + tax + grat.
- **Hourly total includes gratuity:** 6 hrs → base $900, tax 8.25% = $74.25, grat 20% = $180,
  Total == $1,154.25 (was $974.25 before gratuity was included).
- **Point-to-Point:** Hours field visible; below-minimum hours clamps to 4; base = 4 × rate.
- Remove/replace the old "non-hourly shows fare-confirmed copy" assertion.
- Regression + services + admin suites still pass.

## 9. Out of scope (YAGNI)
- No distance/per-mile pricing (still no maps).
- No separate From-vs-To airport prices (single `airportFlat`).
- No change to the informational Services-section card prices (display only; decoupled).
