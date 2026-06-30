const pool = require('../db');

async function findUsersList(offset, size) {
    const [rows] = await pool.execute("SELECT id, username AS name, realname, cellphone, enable,  DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS createAt, DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i:%s') AS updateAt FROM users LIMIT ? OFFSET ?", [String(size), String(offset)]);
    return rows
}



async function findUsersCount() {
    const [rows] = await pool.execute('SELECT COUNT(*) AS total FROM users');
    return rows[0].total;
}

async function findDepartmentList() {
     const [rows] = await pool.execute('SELECT id, name FROM departments');
     console.log("findDepartmentList--------rows",rows)
   return rows
}


async function findMenuList() {
     const [rows] = await pool.execute('SELECT * FROM menus');
     console.log("findMenuList--------rows",rows)


   return rows;
}

async function findRoleList() {
     const [rows] = await pool.execute('SELECT id, name FROM roles');
     console.log("findRoleList--------rows",rows)


   return rows;
}

async function editUser(id, data) {
    const fields = Object.keys(data).map(key => `${key}=?`).join(',');
    const values = Object.values(data);
    const [result] = await pool.execute(`UPDATE users SET ${fields} WHERE id=?`, [...values, id]);
    return result;

}


async function deleteUser(id) {
    const [result] = await pool.execute('DELETE FROM users WHERE id=?', [id]);
    return result;
}

async function findUserById(id) {
    const [rows] = await pool.execute('SELECT id, username, role_id FROM users WHERE id = ?', [id]);
    return rows[0] || null;
}


async function createUser(data) {
    const fields = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const values = Object.values(data);
    console.log('fields--------', fields);
    console.log('placeholders--------', placeholders);
    const [result] = await pool.execute(
        `INSERT INTO users (${fields}) VALUES (${placeholders})`,
        values
    );
    return result;
}


module.exports = {
    findUsersList,
    findUsersCount,
    findDepartmentList,
    findMenuList,
    findRoleList,
    editUser,
    deleteUser,
    createUser,
    findUserById
}