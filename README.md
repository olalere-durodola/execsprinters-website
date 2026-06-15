# ExecSprinters — DFW Executive Transportation

A premium, single-page marketing site for a chauffeured Mercedes-Benz Sprinter
service in the Dallas–Fort Worth metroplex.

It's a **static site** (no build step, no server) designed so a non-technical owner
can edit everything — text, prices, photos, colors — through a simple in-browser form.

## Files

| File | What it is |
|------|------------|
| `index.html` | The website. Renders all content from `content.json` at load. Don't hand-edit. |
| `content.json` | All editable content: copy, prices, contact info, colors, photos, lists. |
| `admin.html` | Friendly form editor. Open it to change `content.json` without code. |
| `images/` | Site photography. |
| `HOW-TO-EDIT.md` | Step-by-step editing & publishing guide for the site owner. |

## Editing the site

Open `admin.html` in a browser, make changes, click **Save changes**, and replace the
downloaded `content.json` (and any new photos) in this folder. Full instructions:
[HOW-TO-EDIT.md](HOW-TO-EDIT.md).

## Publishing (Cloudflare Pages)

Upload this folder to Cloudflare Pages (drag-and-drop, or connect this repo for
automatic deploys). See [HOW-TO-EDIT.md](HOW-TO-EDIT.md#to-publish-your-changes-cloudflare-pages).

## Tech notes

- Hand-coded HTML/CSS/JS — no framework, no dependencies.
- Fonts: Fraunces (display), Space Grotesk (body), JetBrains Mono (labels).
- Content is hydrated from `content.json` at runtime, with the copy also present in the
  HTML as a fallback (works with JavaScript disabled and stays search-engine friendly).
- Respects `prefers-reduced-motion`.
