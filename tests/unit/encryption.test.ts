import { describe, it, expect } from 'vitest';
import {
  encrypt,
  decrypt,
  generateSecureToken,
  computeHmac,
  verifyHmac,
} from '../../packages/security/src/encryption';

describe('Cryptographic Security Engine', () => {
  const secret = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

  it('performs AES-256-GCM encryption and decryption roundtrip', () => {
    const sensitiveData = 'router_super_secret_ssh_key_or_rpc_token_123!';
    const encrypted = encrypt(sensitiveData, secret);

    expect(encrypted).not.toBe(sensitiveData);
    expect(encrypted.split(':').length).toBe(3); // iv:tag:ciphertext

    const decrypted = decrypt(encrypted, secret);
    expect(decrypted).toBe(sensitiveData);
  });

  it('fails decryption if auth tag or ciphertext is tampered with', () => {
    const encrypted = encrypt('test-payload', secret);
    const parts = encrypted.split(':');
    // Tamper with ciphertext
    const tampered = `${parts[0]}:${parts[1]}:deadbeef`;

    expect(() => decrypt(tampered, secret)).toThrow();
  });

  it('generates secure pairing tokens with custom prefix', () => {
    const token = generateSecureToken('ng_pair', 16);
    expect(token.startsWith('ng_pair_')).toBe(true);
    expect(token.length).toBeGreaterThan(32);
  });

  it('computes and verifies HMAC-SHA256 signatures for replay resistance', () => {
    const payload = 'routerId:123;action:BLOCK_MAC;mac:AA:BB:CC:11:22:33;ts:1700000000';
    const sig = computeHmac(payload, secret);

    expect(verifyHmac(payload, secret, sig)).toBe(true);
    expect(verifyHmac(payload + ';tampered=true', secret, sig)).toBe(false);
  });
});
