// encryption.js

const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const KEY = crypto.randomBytes(32); // Replace with your key
const iv = crypto.randomBytes(16); // Initialization vector

function encrypt(text) {
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag();
    return { encryptedData: encrypted, iv: iv.toString('hex'), tag: tag.toString('hex') };
}

function decrypt(encryptedData, iv, tag) {
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

module.exports = { encrypt, decrypt };