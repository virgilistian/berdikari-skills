// Runs on Berdikari ERP pages. Bridges window.postMessage (used by the ERP
// SPA, which cannot call chrome.* APIs directly) to chrome.runtime messaging.
// Mirrors the protocol in berdikari-web/app/composables/useSipadiAutofill.ts
// — keep both in sync.
const CHANNEL = 'berdikari-sipadi-autofill'

window.addEventListener('message', (event) => {
  if (event.source !== window || event.origin !== window.location.origin) return
  const data = event.data
  if (!data || data.channel !== CHANNEL) return

  if (data.type === 'PING') {
    window.postMessage({ channel: CHANNEL, type: 'PONG' }, window.location.origin)
    return
  }

  if (data.type === 'FILL_REQUEST') {
    console.log('[Berdikari SIPADI Autofill] FILL_REQUEST received from ERP page', data.payload)
    chrome.runtime.sendMessage({ type: 'FILL_REQUEST', payload: data.payload }, (result) => {
      // Callback-style chrome.runtime.sendMessage doesn't throw on failure —
      // it sets chrome.runtime.lastError instead, which must be read here or
      // the failure is silently swallowed and the ERP page hangs until its
      // own timeout.
      if (chrome.runtime.lastError) {
        console.error('[Berdikari SIPADI Autofill] background script unreachable:', chrome.runtime.lastError.message)
        window.postMessage(
          { channel: CHANNEL, type: 'FILL_RESPONSE', requestId: data.requestId, ok: false, message: `Ekstensi tidak merespons: ${chrome.runtime.lastError.message}` },
          window.location.origin,
        )
        return
      }

      console.log('[Berdikari SIPADI Autofill] result from background script', result)
      const response = result ?? { ok: false, message: 'Ekstensi tidak merespons.' }
      window.postMessage(
        { channel: CHANNEL, type: 'FILL_RESPONSE', requestId: data.requestId, ...response },
        window.location.origin,
      )
    })
  }
})
