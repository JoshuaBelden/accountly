const SALT = new TextEncoder().encode("accountly-sync-v1")
const PBKDF2_ITERATIONS = 100_000

/** Derives an AES-GCM CryptoKey from a passphrase using PBKDF2. */
async function deriveKey(passphrase: string): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  )
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: SALT, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  )
}

/**
 * Derives a stable sync ID from a passphrase using SHA-256.
 * This is used as the MongoDB document key.
 */
export async function deriveSyncId(passphrase: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(passphrase))
  return Array.from(new Uint8Array(hash))
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("")
}

/**
 * Encrypts a plaintext string using AES-GCM.
 * Returns a base64-encoded string containing the IV prepended to the ciphertext.
 */
export async function encryptBlob(plaintext: string, passphrase: string): Promise<string> {
  const key = await deriveKey(passphrase)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plaintext),
  )
  const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(ciphertext), iv.byteLength)
  return btoa(String.fromCharCode(...combined))
}

/**
 * Decrypts a base64-encoded AES-GCM blob produced by encryptBlob.
 * Throws if the passphrase is wrong or the data is corrupted.
 */
export async function decryptBlob(blob: string, passphrase: string): Promise<string> {
  const key = await deriveKey(passphrase)
  const combined = Uint8Array.from(atob(blob), char => char.charCodeAt(0))
  const iv = combined.slice(0, 12)
  const ciphertext = combined.slice(12)
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext)
  return new TextDecoder().decode(plaintext)
}
