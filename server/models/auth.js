const pool = require('../db');

async function findByCredential(name, password) {
    const [rows] = await pool.execute('SELECT * FROM users WHERE username = ? AND password = ?', [name, password]);
    return rows[0] || null
}

async function findByUsername(name) {
    const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [name]);
    return rows[0] || null
}

async function creatUser(name, password) {
    const [result] = await pool.execute('INSERT INTO users (username, password) VALUES (?, ?)', [name, password]);
    return result
}


module.exports = {
    findByCredential,
    findByUsername,
    creatUser
}