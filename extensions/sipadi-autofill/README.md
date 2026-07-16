# Berdikari SIPADI Autofill

Chrome/Edge extension that fills the SIPADI (Karawang Kabupaten) monthly tax
report form from a Berdikari ERP tax report — so the user reviews and submits
manually instead of retyping ~30 daily values by hand.

This file is developer documentation. For end-user installation steps in
Bahasa Indonesia, see [PANDUAN-INSTALASI.md](PANDUAN-INSTALASI.md).

## What it does / never does

- Fills every daily revenue value from the Berdikari ERP tax report
  currently open into SIPADI's "Pendapatan Harian" table, for **any**
  Berdikari tax category — not just restaurant/pool.
- **Verifies, but does not set, tax period — identifies the form by date.**
  Category and period are read-only on the real SIPADI Lapor Pajak form
  (SIPADI ties them to which tax object page the user navigated to, not to
  a picker). The daily-revenue cells are addressed purely by
  `tr[data-date="YYYY-MM-DD"]`, and that same table is reused across every
  non-PBB category, so **the tax period (month/year) is what actually
  identifies the right form to fill — not the category label.** The
  extension compares SIPADI's `LastPeriode_Month`/`LastPeriode_Year`
  against the Berdikari report and **aborts if the period doesn't match**,
  rather than risk writing one period's revenue into another period's
  report. SIPADI's category (`rekening_name`) is read and reported back in
  the success/error message for visibility, but doesn't block filling —
  Berdikari's own category labels aren't guaranteed to match SIPADI's exact
  wording, and blocking on that string previously produced false negatives.
  Correctness instead relies on the user having the intended SIPADI tax
  object tab open, same as picking the right report in Berdikari.
- **Never clicks Submit.** The last action is always writing a field value.
- **Never touches SIPADI credentials.** The extension only acts after the
  user has already logged into SIPADI themselves; it never sees a password.
- Only runs on the Berdikari ERP origin (to receive the fill request) and
  `sipadi.karawangkab.go.id` (to fill the form) — see `host_permissions` /
  `content_scripts.matches` in `manifest.json`.

## Which SIPADI URL it looks for

SIPADI exposes the same tax object under multiple URLs with a dynamic id,
e.g. `https://sipadi.karawangkab.go.id/Pajak?id=<hash>` (object detail page)
and `https://sipadi.karawangkab.go.id/Lapor/PdlEdit?id=<hash>` (the actual
Lapor Pajak edit form with the daily table — confirmed by testing). Since the
id can't be pinned and it's unclear which URL a given user keeps open, the
extension doesn't match one exact path: it runs on **any**
`sipadi.karawangkab.go.id/*` tab and asks each one's content script "are you
the Lapor Pajak form?" (a read-only DOM check). This is safe to do across
multiple open tabs because the content script never writes a field until
after that check *and* the period/category match — so probing the wrong tab
first has no side effects.

## How it's wired

```
Berdikari ERP page (pajak/[id].vue)
  -> window.postMessage({channel: 'berdikari-sipadi-autofill', type: 'FILL_REQUEST', payload})
content/erp-bridge.js (content script on the ERP origin)
  -> chrome.runtime.sendMessage({type: 'FILL_REQUEST', payload})
background.js (service worker)
  -> queries every open sipadi.karawangkab.go.id tab
  -> chrome.tabs.sendMessage({type: 'FILL_FORM', payload}) to each, in turn,
     until one reports ok (or, failing that, a genuine period mismatch on a
     recognized form) — then focuses that tab
content/sipadi-filler.js (content script on the SIPADI origin)
  -> checks it's actually the Lapor Pajak form, then fills the DOM and
     dispatches input/keyup/change/blur events
  -> result {ok, formRecognized, filled, total, message} bubbles back the
     same path
```

The ERP side lives in `berdikari-web/app/composables/useSipadiAutofill.ts`
and the button in `berdikari-web/app/pages/pajak/[id].vue`. The message
shape is duplicated (not imported) between that file and
`content/erp-bridge.js` because they're separate build targets — keep both
in sync if the protocol changes.

## Installing (unpacked, for development)

1. Chrome/Edge → `chrome://extensions` (or `edge://extensions`).
2. Enable **Developer mode**.
3. **Load unpacked** → select this `extensions/sipadi-autofill/` folder.
4. Open the Berdikari ERP app and a logged-in SIPADI tab on the Lapor Pajak
   form for the object/period you want to fill (e.g. `/Lapor/PdlEdit?id=...`).

## Before using against your real deployment

`manifest.json`'s `content_scripts[0].matches` only lists local dev origins
(`berdikari.test`, `localhost:3000`, `*.pages.dev`). Add your production
domain (e.g. `https://app.berdikari.id/*`) once it's fixed, or the ERP-side
button won't find the extension there.

## Selectors

`lib/selectors.js` was calibrated against a real Lapor Pajak form for the
**Permainan Ketangkasan** (Jasa Kesenian dan Hiburan) category:

- `input[name="rekening_name"]` — read-only category label, informational only.
- `#LastPeriode_Month` / `#LastPeriode_Year` — hidden fields holding the
  period this form covers — the actual safety gate (see above).
- `tr[data-date="YYYY-MM-DD"] input.input-harian` — one row per calendar
  day, each with a revenue input. This naturally handles 28/29/30/31-day
  months since the row set SIPADI renders already matches the period.

**Other categories weren't independently confirmed** — SIPADI appears to
reuse the same generic daily-revenue table (`Tanggal` / `Pendapatan (Rp)` /
`Pajak %`) across non-PBB tax categories, so this should work unchanged
regardless of category. The first time you autofill a different category,
check the fill-count toast; if it reports 0 filled, open DevTools on that
form and confirm the `data-date` / `input-harian` hooks still match, then
adjust `lib/selectors.js` if not.

If SIPADI redesigns the form later, update the three selectors in
`lib/selectors.js` — `content/sipadi-filler.js` doesn't need to change.
