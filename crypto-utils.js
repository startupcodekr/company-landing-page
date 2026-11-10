/**
 * Password Hashing & Verification Utilities
 * Uses Web Crypto API (Native to modern browsers & Cloudflare Workers/Pages Functions)
 */

/**
 * 16바이트 랜덤 솔트(Salt) 16진수 문자열 생성
 * @returns {string} Hex encoded salt
 */
export function generateSalt() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * 비밀번호와 솔트를 결합하여 SHA-256 해시값 생성
 * @param {string} password - 평문 비밀번호
 * @param {string} salt - 16진수 솔트 문자열
 * @returns {Promise<string>} Hex encoded SHA-256 hash
 */
export async function hashPassword(password, salt) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * 사용자가 입력한 비밀번호와 DB의 저장된 해시 일치 여부 검증
 * @param {string} inputPassword - 입력받은 평문 비밀번호
 * @param {string} storedHash - DB에 저장된 해시값
 * @param {string} storedSalt - DB에 저장된 솔트값
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(inputPassword, storedHash, storedSalt) {
  const computedHash = await hashPassword(inputPassword, storedSalt);
  return computedHash === storedHash;
}
