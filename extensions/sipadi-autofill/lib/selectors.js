// SIPADI (https://sipadi.karawangkab.go.id/Wp/Profil -> /Wp/LaporPajak form)
// field hooks. Calibrated against a real "Permainan Ketangkasan" (Jasa
// Kesenian dan Hiburan) tax object's Lapor Pajak form. If SIPADI changes
// their markup, update these three constants and content/sipadi-filler.js
// keeps working unchanged.
window.SIPADI_SELECTORS = {
  // Read-only display of which category the currently open tax object/report
  // is for (e.g. "Permainan Ketangkasan"). Not a picker — SIPADI ties the
  // category to which tax object page the user navigated to.
  categoryDisplay: 'input[name="rekening_name"]',

  // Hidden fields holding the tax period (month/year) this report covers.
  // Also not settable — SIPADI auto-advances to the next unreported period
  // for the open tax object.
  periodMonthHidden: '#LastPeriode_Month',
  periodYearHidden: '#LastPeriode_Year',

  // One <tr data-date="YYYY-MM-DD"> per calendar day in the period, each
  // containing the day's revenue <input class="input-harian">.
  dailyInputForDate(isoDate) {
    return `tr[data-date="${isoDate}"] input.input-harian`
  },
}
