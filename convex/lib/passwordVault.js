'use node'

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import { Buffer } from 'node:buffer'
import process from 'node:process'
import { ConvexError } from 'convex/values'

/** Reversible encryption for student passwords, so a center admin can tell a student their
 * password. Only importable from "use node" action files. The key lives in the deployment's
 * environment (`npx convex env set PASSWORD_VAULT_KEY <64 hex chars>`), never in the database,
 * so a leaked data export alone does not reveal passwords. */

function vaultKey() {
  const hex = process.env.PASSWORD_VAULT_KEY ?? ''
  if (!/^[0-9a-f]{64}$/i.test(hex)) throw new ConvexError("Server sozlanmagan: PASSWORD_VAULT_KEY yo'q")
  return Buffer.from(hex, 'hex')
}

/** → `iv:tag:ciphertext` (hex). */
export function encryptPassword(plain) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', vaultKey(), iv)
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  return `${iv.toString('hex')}:${cipher.getAuthTag().toString('hex')}:${data.toString('hex')}`
}

export function decryptPassword(stored) {
  const [iv, tag, data] = stored.split(':')
  const decipher = createDecipheriv('aes-256-gcm', vaultKey(), Buffer.from(iv, 'hex'))
  decipher.setAuthTag(Buffer.from(tag, 'hex'))
  return Buffer.concat([decipher.update(Buffer.from(data, 'hex')), decipher.final()]).toString('utf8')
}
