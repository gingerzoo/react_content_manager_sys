const pool = require('../db');

async function findUserById(id) {
    const [rows] = await pool.execute('SELECT id, username FROM users WHERE id = ?', [id]);
    return rows[0] || null;
}


async function findMenusByRoleId(roleId) {
    const [rows] = await pool.execute(
        'SELECT m.id, m.name, m.url, m.parent_id FROM menus m JOIN role_menus rm ON m.id = rm.menu_id WHERE rm.role_id = ?',
        [roleId]
    );
    return rows[0] || null;

}
module.exports = {
    findUserById
}