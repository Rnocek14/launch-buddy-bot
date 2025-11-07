/**
 * Encryption utilities for sensitive data
 * Uses Web Crypto API for AES-256-GCM encryption
 */

const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;

/**
 * Derives an encryption key from the secret
 */
async function getEncryptionKey(): Promise<CryptoKey> {
  const secret = Deno.env.get("GMAIL_TOKEN_ENCRYPTION_KEY");
  if (!secret) {
    throw new Error("GMAIL_TOKEN_ENCRYPTION_KEY not configured");
  }

  // Use the secret to derive a consistent key
  const encoder = new TextEncoder();
  const keyMaterial = encoder.encode(secret);
  
  // Import the key material
  const key = await crypto.subtle.importKey(
    "raw",
    await crypto.subtle.digest("SHA-256", keyMaterial),
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  );

  return key;
}

/**
 * Encrypts a string value
 * Returns base64-encoded encrypted data with IV prepended
 */
export async function encrypt(plaintext: string): Promise<string> {
  if (!plaintext) return "";

  const key = await getEncryptionKey();
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

  // Generate a random IV for each encryption
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encryptedData = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    data
  );

  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encryptedData.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encryptedData), iv.length);

  // Return as base64
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypts a base64-encoded encrypted string
 */
export async function decrypt(encryptedBase64: string): Promise<string> {
  if (!encryptedBase64) return "";

  const key = await getEncryptionKey();

  // Decode from base64
  const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));

  // Extract IV and encrypted data
  const iv = combined.slice(0, 12);
  const encryptedData = combined.slice(12);

  const decryptedData = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    encryptedData
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedData);
}
