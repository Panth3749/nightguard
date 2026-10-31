import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV recommended for GCM

/**
 * Derives a 32-byte key from the provided secret string using SHA-256.
 */
function getKey(keyOrSecret: string): Buffer {
  if (keyOrSecret.length === 64 && /^[0-9a-fA-F]+$/.test(keyOrSecret)) {
    return Buffer.from(keyOrSecret, 'hex');
  }
  return crypto.createHash('sha256').update(keyOrSecret).digest();
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Output format: <hex_iv>:<hex_auth_tag>:<hex_ciphertext>
 */
export function encrypt(plaintext: string, secretKey: string): string {
  const key = getKey(secretKey);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
  ciphertext += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${authTag}:${ciphertext}`;
}

/**
 * Decrypts an AES-256-GCM encrypted payload.
 */
export function decrypt(encryptedPayload: string, secretKey: string): string {
  const parts = encryptedPayload.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted payload format. Expected iv:authTag:ciphertext');
  }

  const [ivHex, authTagHex, ciphertextHex] = parts;
  const key = getKey(secretKey);
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertextHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Generates a cryptographically secure random token (e.g., for router pairing).
 */
export function generateSecureToken(prefix = 'ng', bytes = 24): string {
  return `${prefix}_${crypto.randomBytes(bytes).toString('hex')}`;
}

/**
 * Computes an HMAC-SHA256 signature for replay protection and integrity verification.
 */
export function computeHmac(data: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

/**
 * Verifies an HMAC-SHA256 signature in constant time.
 */
export function verifyHmac(data: string, secret: string, signature: string): boolean {
  const expected = computeHmac(data, secret);
  return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
}
