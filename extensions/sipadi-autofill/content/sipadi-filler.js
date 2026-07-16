// Runs on any https://sipadi.karawangkab.go.id/* page — SIPADI exposes the
// same tax object under multiple URLs (e.g. /Pajak?id=... detail page,
// /Lapor/PdlEdit?id=... edit form with the daily table), and the id segment
// is per-object, so we can't pin one exact path. Instead this script checks
// the live DOM for the Lapor Pajak form's known fields; background.js tries
// every open SIPADI tab and uses whichever one actually has them.
//
// Category and tax period are read-only on that form (SIPADI ties them to
// which tax object page the user has open, not to a picker), so neither is
// settable. The daily-revenue cells are addressed purely by date
// (tr[data-date="YYYY-MM-DD"]), and that same table structure is reused
// across every non-PBB category — so the tax period, not the category
// label, is what actually identifies whether this is the right form to
// fill. We verify the period and abort on mismatch; category is read and
// reported back for visibility only, never gated on (Berdikari's category
// labels aren't guaranteed to match SIPADI's exact rekening_name wording).
console.log('[Berdikari SIPADI Autofill] content script loaded on', window.location.href, 'SIPADI_SELECTORS:', typeof SIPADI_SELECTORS)

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'FILL_FORM') return false
  console.log('[Berdikari SIPADI Autofill] FILL_FORM received', message.payload)
  try {
    const result = fillForm(message.payload)
    console.log('[Berdikari SIPADI Autofill] fillForm result', result)
    sendResponse(result)
  } catch (err) {
    console.error('[Berdikari SIPADI Autofill] fillForm threw', err)
    sendResponse({ ok: false, message: err?.message || 'Gagal mengisi formulir SIPADI.' })
  }
  return true
})

function fillForm(payload) {
  if (!isLaporPajakForm()) {
    return {
      ok: false,
      formRecognized: false,
      filled: 0,
      total: payload.days.length,
      message: 'Halaman ini bukan formulir Lapor Pajak SIPADI.',
    }
  }

  const mismatch = checkPeriod(payload)
  if (mismatch) return { ok: false, formRecognized: true, filled: 0, total: payload.days.length, message: mismatch }

  const sipadiCategory = document.querySelector(SIPADI_SELECTORS.categoryDisplay)?.value?.trim()
  let filled = 0
  const problems = []

  for (const { day, amount } of payload.days) {
    const isoDate = toIsoDate(payload.year, payload.month, day)
    const input = document.querySelector(SIPADI_SELECTORS.dailyInputForDate(isoDate))
    if (input && setDailyValue(input, amount)) filled++
    else problems.push(formatDate(payload.year, payload.month, day))
  }

  const categoryNote = sipadiCategory ? ` (kategori SIPADI: "${sipadiCategory}")` : ''
  return {
    ok: filled > 0,
    formRecognized: true,
    filled,
    total: payload.days.length,
    message: problems.length === 0
      ? `Semua kolom pendapatan harian berhasil diisi${categoryNote}. Periksa kembali sebelum submit.`
      : `Kolom berikut tidak ditemukan di formulir${categoryNote}: ${problems.join(', ')}.`,
  }
}

// Cheap, read-only check for whether this page is the Lapor Pajak edit form
// (as opposed to a detail/summary page for the same tax object). Safe to
// call on every open SIPADI tab while probing for the right one.
function isLaporPajakForm() {
  return !!(
    document.querySelector(SIPADI_SELECTORS.categoryDisplay)
    && document.querySelector(SIPADI_SELECTORS.periodMonthHidden)
    && document.querySelector(SIPADI_SELECTORS.periodYearHidden)
  )
}

function checkPeriod(payload) {
  const monthEl = document.querySelector(SIPADI_SELECTORS.periodMonthHidden)
  const yearEl = document.querySelector(SIPADI_SELECTORS.periodYearHidden)

  const formMonth = Number(monthEl.value)
  const formYear = Number(yearEl.value)

  if (formMonth !== payload.month || formYear !== payload.year) {
    return `Masa pajak di SIPADI (${formMonth}/${formYear}) tidak cocok dengan laporan Berdikari (${payload.month}/${payload.year}). Buka objek pajak untuk periode yang benar di SIPADI, lalu coba lagi.`
  }

  return null
}

function toIsoDate(year, month, day) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function formatDate(year, month, day) {
  return `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`
}

function setDailyValue(input, amount) {
  const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  const value = String(Math.round(amount))
  if (nativeSetter) nativeSetter.call(input, value)
  else input.value = value

  // The field has classes "number-only thousand" (a live thousand-separator
  // formatter) and the page recomputes Total Pendapatan/Nilai Pajak from
  // these inputs — fire every event a legacy jQuery mask/calc script might
  // listen for so both behaviors trigger reliably.
  input.dispatchEvent(new Event('input', { bubbles: true }))
  input.dispatchEvent(new Event('keyup', { bubbles: true }))
  input.dispatchEvent(new Event('change', { bubbles: true }))
  input.dispatchEvent(new Event('blur', { bubbles: true }))
  return true
}
