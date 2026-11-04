const pool = require('../db');

async function findByUsername(username) {
    const [rows] = await pool.execute('SELECT id, username, password, enable FROM users WHERE username = ?', [username]);
    return rows[0] || null
}

async function createUser(username, password) {
    const [result] = await pool.execute('INSERT INTO users (username, password) VALUES (?, ?)', [username, password]);
    return result
}

module.exports = {
    findByUsername,
    createUser
}