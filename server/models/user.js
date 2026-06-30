const pool = require('../db');

async function findUserById(id) {
    const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0] || null;
}


async function findMenusByRoleId(roleId) {
    const [rows] = await pool.execute(
        'SELECT m.id, m.name, m.url, m.parent_id FROM menus m JOIN role_menus rm ON m.id = rm.menu_id WHERE rm.role_id = ?',
        [roleId]
    );
    console.log("findMenusByRoleId--------rows",rows)
    return rows;

}


module.exports = {
    findUserById,
    findMenusByRoleId,
}