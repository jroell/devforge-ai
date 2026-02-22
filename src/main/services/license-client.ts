import Store from 'electron-store'
import { getMachineFingerprint } from './fingerprint'

const LICENSE_API_URL = 'https://devforge-website.vercel.app'

const store = new Store({ name: 'license' })

export interface LicensePayload {
  status: 'trial' | 'expired' | 'licensed'
  machineId: string
  expiresAt: string | null
  timestamp: number
  signature: string
}

export interface LicenseState {
  status: 'trial' | 'expired' | 'licensed' | 'unknown'
  expiresAt: string | null
  daysRemaining: number | null
  lastValidated: number | null
}

export async function activateTrial(): Promise<LicensePayload> {
  const machineId = getMachineFingerprint()
  const response = await fetch(`${LICENSE_API_URL}/api/license/activate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ machineId }),
  })

  if (!response.ok) {
    throw new Error(`Activation failed: ${response.status}`)
  }

  const payload: LicensePayload = await response.json()
  cacheLicensePayload(payload)
  return payload
}

export async function validateLicense(): Promise<LicensePayload> {
  const machineId = getMachineFingerprint()
  const response = await fetch(`${LICENSE_API_URL}/api/license/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ machineId, clientTimestamp: Date.now() }),
  })

  if (!response.ok) {
    throw new Error(`Validation failed: ${response.status}`)
  }

  const payload: LicensePayload = await response.json()
  cacheLicensePayload(payload)
  return payload
}

export async function getCheckoutUrl(): Promise<string> {
  const machineId = getMachineFingerprint()
  const response = await fetch(`${LICENSE_API_URL}/api/stripe/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ machineId }),
  })

  if (!response.ok) {
    throw new Error(`Checkout failed: ${response.status}`)
  }

  const { url } = await response.json()
  return url
}

function cacheLicensePayload(payload: LicensePayload): void {
  store.set('cachedPayload', payload)
  store.set('lastValidated', Date.now())
}

export function getCachedLicenseState(): LicenseState {
  const cached = store.get('cachedPayload') as LicensePayload | undefined
  const lastValidated = store.get('lastValidated') as number | undefined

  if (!cached || !lastValidated) {
    return { status: 'unknown', expiresAt: null, daysRemaining: null, lastValidated: null }
  }

  const hoursSinceValidation = (Date.now() - lastValidated) / (1000 * 60 * 60)
  if (hoursSinceValidation > 48 && cached.status !== 'licensed') {
    return { status: 'unknown', expiresAt: cached.expiresAt, daysRemaining: null, lastValidated }
  }

  let daysRemaining: number | null = null
  if (cached.expiresAt && cached.status === 'trial') {
    daysRemaining = Math.max(0, Math.ceil(
      (new Date(cached.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    ))
  }

  return {
    status: cached.status,
    expiresAt: cached.expiresAt,
    daysRemaining,
    lastValidated,
  }
}

export async function checkLicense(): Promise<LicenseState> {
  try {
    const payload = await validateLicense()
    let daysRemaining: number | null = null
    if (payload.expiresAt && payload.status === 'trial') {
      daysRemaining = Math.max(0, Math.ceil(
        (new Date(payload.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      ))
    }
    return {
      status: payload.status,
      expiresAt: payload.expiresAt,
      daysRemaining,
      lastValidated: Date.now(),
    }
  } catch {
    return getCachedLicenseState()
  }
}
