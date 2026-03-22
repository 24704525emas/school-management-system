'use strict';

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SALT_ROUNDS = 12;

async function hashPassword(password) {
    return await bcrypt.hash(password, SALT_ROUNDS);
}

async function comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
}

function generateToken(user, isRefresh = false) {
    const secret = isRefresh ? process.env.JWT_REFRESH_SECRET : process.env.JWT_SECRET;
    return jwt.sign({ id: user.id }, secret, { expiresIn: isRefresh ? '7d' : '1h' });
}

function verifyToken(token, isRefresh = false) {
    const secret = isRefresh ? process.env.JWT_REFRESH_SECRET : process.env.JWT_SECRET;
    return jwt.verify(token, secret);
}

module.exports = {
    hashPassword,
    comparePassword,
    generateToken,
    verifyToken,
};
