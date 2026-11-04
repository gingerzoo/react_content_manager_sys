const { randomBytes, scrypt, timingSafeEqual } = require('node:crypto');
const { promisify } = require('node:util');

const scryptAsync = promisify(scrypt);

// 固定计算参数；后续校验时必须使用相同参数。
const options = {
    N: 32768,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024
};

function getPasswordError(password) {
    if (
        typeof password !== 'string' ||
        password.length < 6 ||
        password.length > 128
    ) {
        return '密码长度需要为 6–128 个字符';
    }

    const hasLetter = /[A-Za-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    // 常见英文标点符号，不包含空格。
    const hasSpecial =
        /[\x21-\x2F\x3A-\x40\x5B-\x60\x7B-\x7E]/.test(password);

    const typeCount = [
        hasLetter,
        hasNumber,
        hasSpecial
    ].filter(Boolean).length;

    if (typeCount < 2) {
        return '密码需至少包含字母、数字、特殊符号中的两种';
    }

    return null;
}

// 创建账号时调用：将明文密码转换成可存入数据库的字符串。
async function hashPassword(password) {
    const errorMessage = getPasswordError(password);

    if (errorMessage) {
        throw new Error(errorMessage);
    }

    const salt = randomBytes(16).toString('hex');
    const key = await scryptAsync(password, salt, 64, options);

    return `scrypt-v1$${salt}$${key.toString('hex')}`;
}


// 登录时调用：校验输入密码是否与数据库中的哈希匹配。
async function verifyPassword(password, storedHash) {
    if (
        typeof password !== 'string' ||
        password.length > 128 ||
        typeof storedHash !== 'string'
    ) {
        return false;
    }

    const match =
        /^scrypt-v1\$([a-f0-9]{32})\$([a-f0-9]{128})$/.exec(storedHash);

    if (!match) return false;

    const salt = match[1];
    const expectedKey = Buffer.from(match[2], 'hex');
    const actualKey = await scryptAsync(password, salt, 64, options);

    return timingSafeEqual(actualKey, expectedKey);
}

module.exports = {
    hashPassword,
    verifyPassword,
    getPasswordError
};