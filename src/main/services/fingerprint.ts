import os from 'os'
import crypto from 'crypto'

/**
 * Generates a deterministic machine fingerprint using system properties.
 * SHA-256 of hostname + platform + arch + username + first MAC address.
 */
export function getMachineFingerprint(): string {
  const hostname = os.hostname()
  const platform = os.platform()
  const arch = os.arch()
  const username = os.userInfo().username

  const interfaces = os.networkInterfaces()
  let mac = 'no-mac'
  for (const name of Object.keys(interfaces)) {
    const nets = interfaces[name]
    if (!nets) continue
    for (const net of nets) {
      if (!net.internal && net.mac && net.mac !== '00:00:00:00:00:00') {
        mac = net.mac
        break
      }
    }
    if (mac !== 'no-mac') break
  }

  const raw = `${hostname}:${platform}:${arch}:${username}:${mac}`
  return crypto.createHash('sha256').update(raw).digest('hex')
}
