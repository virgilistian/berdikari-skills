// SIPADI exposes the same tax object under multiple URLs (a /Pajak?id=...
// detail page, a /Lapor/PdlEdit?id=... edit form with the daily table) with
// a per-object id we can't pin — so instead of matching one exact path, we
// query every open tab on the origin and let sipadi-filler.js's DOM check
// decide which one is actually the fillable form. Probing is safe: the
// content script only ever writes fields after confirming period/category
// match, so trying the wrong tab first has no side effects.
const SIPADI_URL_PATTERN = 'https://sipadi.karawangkab.go.id/*'

console.log('[Berdikari SIPADI Autofill] background service worker started')

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'FILL_REQUEST') return false

  handleFillRequest(message.payload)
    .then(sendResponse)
    .catch(err => sendResponse({ ok: false, message: err?.message || 'Terjadi kesalahan tak terduga.' }))

  return true // keep the message channel open for the async sendResponse above
})

async function handleFillRequest(payload) {
  const tabs = await chrome.tabs.query({ url: SIPADI_URL_PATTERN })
  console.log(`[Berdikari SIPADI Autofill] FILL_REQUEST — found ${tabs.length} SIPADI tab(s):`, tabs.map(t => t.url))

  if (tabs.length === 0) {
    return {
      ok: false,
      message: 'Tab SIPADI tidak ditemukan. Buka https://sipadi.karawangkab.go.id, login, buka laporan pajak yang sesuai, lalu coba lagi.',
    }
  }

  let bestMismatch = null

  for (const tab of tabs) {
    let result
    try {
      result = await chrome.tabs.sendMessage(tab.id, { type: 'FILL_FORM', payload })
      console.log(`[Berdikari SIPADI Autofill] tab ${tab.id} (${tab.url}) replied:`, result)
    } catch (err) {
      // Content script not injected on this tab — either it's not the SIPADI
      // origin/matches pattern, or (much more likely during development) the
      // extension was reloaded after this tab was opened and the tab itself
      // hasn't been refreshed since, so the updated content script never ran.
      console.warn(`[Berdikari SIPADI Autofill] tab ${tab.id} (${tab.url}) unreachable — is it loaded/refreshed since the last extension reload?`, err)
      continue
    }

    if (result?.ok) {
      await focusTab(tab)
      return result
    }

    if (result?.formRecognized && !bestMismatch) {
      bestMismatch = { tab, result }
    }
  }

  if (bestMismatch) {
    await focusTab(bestMismatch.tab)
    return bestMismatch.result
  }

  return {
    ok: false,
    message: 'Tidak ada tab SIPADI yang menampilkan formulir Lapor Pajak. Buka laporan pajak yang sesuai di SIPADI, lalu coba lagi.',
  }
}

async function focusTab(tab) {
  await chrome.tabs.update(tab.id, { active: true })
  if (tab.windowId != null) {
    await chrome.windows.update(tab.windowId, { focused: true })
  }
}
