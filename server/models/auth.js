const pool = require('../db');

async function findByUsername(username) {
    const [rows] = await pool.execute('SELECT id, username, password, enable FROM users WHERE username = ?', [username]);
    return rows[0] || null
}

/**
 * 创建公开注册的普通账号，角色和启用状态由服务端固定。
 * @param {string} username - 已校验的用户名。
 * @param {string} passwordHash - scrypt 编码后的密码，禁止传入明文。
 * @returns {Promise<import('mysql2').ResultSetHeader>} 插入结果，包含 insertId。
 */
async function createUser(username, passwordHash) {
    const [result] = await pool.execute(
        `INSERT INTO users (username, password, role_id, enable, department_id)
         VALUES (?, ?, 2, 1, NULL)`,
        [username, passwordHash]
    );
    return result
}

module.exports = {
    findByUsername,
    createUser
}
