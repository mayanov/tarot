
import { scryptSync, randomBytes, timingSafeEqual } from 'crypto';

/**
 * Hash a password using scrypt
 * @param {string} password - The plain text password
 * @returns {string} - The format "salt:hexHash"
 */
export function hashPassword(password) {
    const salt = randomBytes(16).toString('hex');
    const hashedPassword = scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hashedPassword}`;
}

/**
 * Verify a password against a stored hash
 * @param {string} password - The plain text password to check
 * @param {string} storedHash - The stored "salt:hexHash"
 * @returns {boolean}
 */
export function verifyPassword(password, storedHash) {
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) return false;

    const hashedBuffer = scryptSync(password, salt, 64);
    const keyBuffer = Buffer.from(key, 'hex');

    return timingSafeEqual(hashedBuffer, keyBuffer);
}
