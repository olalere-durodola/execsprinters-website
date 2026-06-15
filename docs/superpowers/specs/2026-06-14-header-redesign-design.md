# ExecSprinters — Header Redesign

**Date:** 2026-06-14
**Status:** Approved design (pending spec review + user confirmation)

## 1. Problem

The header uses `mix-blend-mode: difference` to sit over the hero photo. Over mid-tone areas
of the image, the nav links (notably Fleet, Quote, Areas) wash out and become unreadable.

## 2. Solution (decided via visual brainstorming — "Style A")

Replace the blend-mode approach with a **persistent dark scrim bar**: a translucent ink
background with a blur, present the entire page, so the header always reads cleanly over any
photo or section. Enlarge the wordmark; recolor the Reserve button so it stays visible on the
dark bar.

## 3. Decisions (locked)

| # | Decision | Choice |
|---|----------|--------|
| 1 | Bar style | **Solid dark scrim** — `rgba(20,16,10,.55)` + `backdrop-filter: blur(12px)`, hairline bottom border. No `mix-blend-mode`. |
| 2 | Scroll behavior | **Stays dark the whole page.** On scroll it shrinks (utility row hides, nav height tightens) and becomes a bit more opaque. No light/paper mode. |
| 3 | Wordmark size | **~31px** (was 23px), white, with the small "DFW" tag. |
| 4 | Utility line | **Kept** (`● Open 24/7 · (817) 703-7628` left, `MERCEDES-BENZ SPRINTER` right), white, inside the dark bar; collapses on scroll. |
| 5 | Nav links | **All 6 kept** (Experience, Services, Fleet, Quote, Areas, Contact), white, subtle hover. |
| 6 | Reserve button | **Bronze background, ink text** (was ink bg → invisible on dark bar). Header-scoped only. |

## 4. Implementation (CSS-only in `index.html`, plus button color)

All changes are within the existing `<style>` block and target existing elements
(`header`, `.utility`, `.logo`, `.nav-links`, `.menu-btn`, the header `.btn-primary`). No
markup or JS-logic changes; the existing scroll handler that toggles `header.scrolled` and
`.utility.hide` is reused as-is.

**Specific edits:**
- `header`: remove `mix-blend-mode:difference`; add persistent
  `background:rgba(20,16,10,.55); backdrop-filter:blur(12px); border-bottom:1px solid rgba(245,241,234,.10)`.
  Keep `position:fixed; z-index:50; transition; top:40px`.
- `.utility`: remove `mix-blend-mode:difference`; add the same dark background + blur (NO
  bottom border — it flows directly into the nav, which carries the single bottom hairline, so
  the two dark rows read as one continuous bar with no double line). Keep `.utility.hide`
  (collapse on scroll) and the `color:#fff` text.
- `header.scrolled`: replace the old paper/light rule with a darker, more opaque scrim
  (`background:rgba(20,16,10,.80); backdrop-filter:blur(14px); border-bottom:1px solid rgba(245,241,234,.12)`),
  keep `top:0`. Add a shrink: `header.scrolled nav{height:64px}` (from 78px).
- `.logo`: `font-size:31px`; keep `color:#fff`. Remove the now-obsolete
  `header.scrolled .logo{color:var(--ink)}` override (logo stays white).
- `.nav-links`: remove `mix-blend-mode:difference`; keep `color:#fff`. Remove the
  `header.scrolled .nav-links{color:var(--ink-soft);...}` override (links stay white).
- `.menu-btn`: remove `mix-blend-mode` + the scrolled override; keep `color:#fff`.
- Reserve button (header only): add `header .btn-primary{background:var(--bronze);color:var(--ink)}`
  and `header .btn-primary:hover{background:var(--bronze-2)}`. Scoped to `header` so the hero
  and closing-CTA primary buttons are unaffected.
- Mobile: optionally reduce `.logo` to ~26px under 920px so the larger wordmark doesn't crowd
  the menu button.

## 5. Constraints honored
- Editorial bronze/paper aesthetic preserved (dark bar + bronze accent fit the palette).
- `prefers-reduced-motion` already handled globally (transitions disabled there).
- No change to content, nav data (`content.json` `nav`), or any rendering logic.

## 6. Testing
- Primary: **screenshot verification** (header is presentation-only). Capture at desktop and
  mobile, (a) over the hero, (b) scrolled into a light content section, (c) scrolled state —
  confirm all nav links + utility are legible everywhere and the Reserve button is visible.
- Sanity: existing jsdom regression suite still passes (header change is CSS; no renderer
  affected). Confirm the scroll handler still toggles `header.scrolled` / `.utility.hide`
  (unchanged code).

## 7. Out of scope (YAGNI)
- No nav trimming, no logo redraw, no new utility content, no light/scrolled mode.
- No changes to the hero, booking, or other sections.
