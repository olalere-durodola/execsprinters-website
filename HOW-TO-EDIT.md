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

## Booking & payment setup (Calendly) — one-time

Your site has a 3-step **Reserve** form. When a customer finishes it, the site opens
your **Calendly** so they can pick a time and pay — and you receive the full trip details.

For this to work, set up your Calendly booking event **once**:

1. In Calendly, open (or create) the event customers book — e.g. "Reserve a Sprinter".
2. **Turn on payments:** in that event's settings, enable **Collect Payments**
   (connect Stripe or PayPal). This is how the customer pays at booking.
3. **Add one custom question** to the event — call it something like **"Trip details"**.
   The site automatically fills this with the full reservation (service type, pick-up,
   stops, drop-off, date/time, vehicle, passengers, luggage, child seats, accessibility,
   flight #, and notes). You don't have to ask for any of that separately.
4. Make sure the booking link in the editor matches this event:
   **admin.html → Contact & booking → Calendly booking link**.

That's all. Every reservation then arrives in Calendly with payment + a complete
trip summary in the "Trip details" answer.

**To change what the form offers** (service types, child-seat types, number of stops,
or the hourly rate used for the live estimate), use the editor:
- **Booking form** section → service types, child seat types, max stops
- **Pricing** section → hourly rate, minimum hours, tax

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
| Add/remove a service type | **Booking form** → Service types |
| Change child-seat options or max stops | **Booking form** |

---

## If something looks broken

Restore the backup: a copy of the original site is saved as
`index.original.backup.html`. You can also re-download `content.json` from the editor
at any time — it never changes your file until you click **Save changes**.
