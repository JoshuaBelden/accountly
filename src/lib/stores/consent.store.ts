import { writable } from "svelte/store"

// Uses a non-"accountly:" key so clearAllStorage() never touches it,
// and it is intentionally excluded from the export envelope.
const CONSENT_KEY = "accountly_consent"

function readConsent(): boolean {
  if (typeof localStorage === "undefined") return false
  return localStorage.getItem(CONSENT_KEY) === "true"
}

function createConsentStore() {
  const store = writable(readConsent())

  return {
    subscribe: store.subscribe,
    /** Permanently records that the user has acknowledged the storage policy. */
    accept() {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(CONSENT_KEY, "true")
      }
      store.set(true)
    },
  }
}

export const consentStore = createConsentStore()
