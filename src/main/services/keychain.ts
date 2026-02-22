import { safeStorage } from 'electron'
import Store from 'electron-store'

const store = new Store({ name: 'secure-keys' })

export function storeApiKey(provider: string, key: string): void {
  if (!safeStorage.isEncryptionAvailable()) {
    // Fallback: store plain (less secure but functional)
    store.set(`apiKey.${provider}`, key)
    return
  }
  const encrypted = safeStorage.encryptString(key)
  store.set(`apiKey.${provider}`, encrypted.toString('base64'))
  store.set(`apiKey.${provider}.encrypted`, true)
}

export function getApiKey(provider: string): string | null {
  const value = store.get(`apiKey.${provider}`) as string | undefined
  if (!value) return null
  const isEncrypted = store.get(`apiKey.${provider}.encrypted`) as boolean | undefined
  if (isEncrypted && safeStorage.isEncryptionAvailable()) {
    return safeStorage.decryptString(Buffer.from(value, 'base64'))
  }
  return value
}

export function deleteApiKey(provider: string): void {
  store.delete(`apiKey.${provider}`)
  store.delete(`apiKey.${provider}.encrypted`)
}

export function hasApiKey(provider: string): boolean {
  return store.has(`apiKey.${provider}`)
}
