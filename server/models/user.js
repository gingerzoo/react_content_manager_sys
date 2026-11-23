const pool = require('../db');
const effectiveRoleMenus = require('./effectiveRoleMenus');

async function findUserById(id) {
    const [rows] = await pool.execute(
        `SELECT
        id,
        username,
        realname,
        cellphone,
        enable,
        role_id AS roleId,
        department_id AS departmentId
        FROM users 
        WHERE id = ?`, [id]);
    return rows[0] || null;
}


async function findMenusByRoleId(roleId) {
    const [rows] = await pool.execute(
        `SELECT m.id, m.name, m.url, m.parent_id FROM menus m JOIN ${effectiveRoleMenus} rm ON m.id = rm.menu_id WHERE rm.role_id = ? ORDER BY m.id`,
        [roleId]
    );
    return rows;

}


module.exports = {
    findUserById,
    findMenusByRoleId,
}
