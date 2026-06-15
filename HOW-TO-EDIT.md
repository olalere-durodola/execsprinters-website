# How to edit your website

Your site is just a few files in this folder. You never need to touch code — an
editor page does it for you.

```
index.html       ← the website itself (don't edit by hand)
content.json     ← all your words, prices, and colors live here
admin.html       ← the editor you use to change content.json
images/          ← your photos
HOW-TO-EDIT.md   ← this guide
```

---

## To change anything (text, prices, photos, colors)

1. **Open the editor.** Double-click `admin.html`. It opens in your web browser.
   - If it says *"Couldn't load your content automatically,"* click the **Choose file**
     button it shows and pick `content.json` from this folder. (This only happens when
     you open it straight from your computer instead of from the live website — it's fine.)
2. **Make your changes** in the form. Sections expand when you click them.
3. **Replace a photo?** Click **Choose file** under any photo and pick a new image.
   Use a wide (landscape) photo for best results.
4. Click **⬇ Save changes** at the bottom. Your browser downloads an updated
   `content.json` (and any new photos).
5. **Move the downloaded files into this folder**, replacing the old ones.
   (New photos keep their original names, e.g. `hero.jpg`, so they drop right in.)
6. **Publish** — see below.

> **Accent text:** wrap words in `*asterisks*` to show them in the fancy italic
> bronze style. Example: `Your rate, *fixed at booking.*`

---

## To publish your changes (Cloudflare Pages)

You deploy by uploading this whole folder to Cloudflare Pages.

**First time:**
1. Go to **dash.cloudflare.com** → **Workers & Pages** → **Create** → **Pages** →
   **Upload assets**.
2. Drag this entire folder in. Give it a name. Click **Deploy**.
3. Cloudflare gives you a web address. (You can connect your own domain later under
   **Custom domains**.)

**Every time after (to publish edits):**
1. Open your project in Cloudflare → **Create deployment** (or **Upload assets**).
2. Drag the folder in again (with your updated `content.json` / photos).
3. Deploy. Your site updates in under a minute.

That's it. You only ever edit through `admin.html` and re-upload.

---

## Want to preview before publishing?

Click **Preview site ↗** at the top of the editor. Because of browser security,
some photos/text may not refresh when previewing straight from your computer — that's
normal. The live Cloudflare site always shows the real, updated version.

---

## Quick reference — common edits

| You want to… | Where in the editor |
|---|---|
| Change the phone number | **Contact & booking** |
| Change hourly rate / tax | **Pricing (quote calculator)** |
| Change the big headline | **Top hero (first screen)** |
| Swap the main photo | **Top hero** → Hero photo |
| Add/remove a service area | **Service areas** |
| Change the accent color | **Colors & branding** → Accent (bronze) |
| Edit the booking link | **Contact & booking** → Calendly link |

---

## If something looks broken

Restore the backup: a copy of the original site is saved as
`index.original.backup.html`. You can also re-download `content.json` from the editor
at any time — it never changes your file until you click **Save changes**.
