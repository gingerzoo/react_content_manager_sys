const pool = require('../db');

async function findRoleById(id) {
    const [rows] = await pool.execute(
        'SELECT id FROM roles WHERE id = ?',
        [id]
    );

    return rows[0] || null;
}

async function findDepartmentById(id) {
    const [rows] = await pool.execute(
        'SELECT id FROM departments WHERE id = ?',
        [id]
    );

    return rows[0] || null;
}

function buildUserFilter(filters = {}) {
    const conditions = [];
    const params = [];

    if (filters.username) {
        conditions.push('LOCATE(?, username) > 0');
        params.push(filters.username);
    }

    if (filters.realname) {
        conditions.push('LOCATE(?, realname) > 0');
        params.push(filters.realname);
    }

    if (filters.cellphone) {
        conditions.push('LOCATE(?, cellphone) > 0');
        params.push(filters.cellphone);
    }

    if (filters.enable !== null && filters.enable !== undefined) {
        conditions.push('enable = ?');
        params.push(filters.enable);
    }

    if (filters.createdFrom != null && filters.createdTo != null) {
        conditions.push('created_at >= ?');
        params.push(`${filters.createdFrom} 00:00:00`);

        conditions.push(
            'created_at < DATE_ADD(?, INTERVAL 1 DAY)'
        );
        params.push(`${filters.createdTo} 00:00:00`);
    }

    return {
        whereSql:
            conditions.length > 0
                ? `WHERE ${conditions.join(' AND ')}`
                : '',
        params
    };
}

async function findUsersList(offset, size, filters = {}) {
    const { whereSql, params } = buildUserFilter(filters);

    const [rows] = await pool.execute(
        `SELECT
            id,
            username,
            realname,
            cellphone,
            enable,
            role_id AS roleId,
            department_id AS departmentId,
            DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS createAt,
            DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i:%s') AS updateAt
         FROM users
         ${whereSql}
         ORDER BY id DESC
         LIMIT ? OFFSET ?`,
        [...params, String(size), String(offset)]
    );

    return rows;
}


async function findUsersCount(filters = {}) {
    const { whereSql, params } = buildUserFilter(filters);

    const [rows] = await pool.execute(
        `SELECT COUNT(*) AS total 
        FROM users
        ${whereSql}`,
        params
    );
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

async function findDepartmentPage({
    offset,
    size,
    name,
    leader
}) {
    const conditions = [];
    const params = [];

    if (name) {
        conditions.push('LOCATE(?, d.name) > 0');
        params.push(name);
    }

    if (leader) {
        conditions.push('LOCATE(?, d.leader) > 0');
        params.push(leader);
    }

    const whereSql = conditions.length
        ? `WHERE ${conditions.join(' AND ')}`
        : '';

    const [list] = await pool.execute(
        `SELECT
            d.id,
            d.name,
            d.leader,
            d.parent_id AS parentId,
            p.name AS parentName,
            DATE_FORMAT(d.created_at, '%Y-%m-%d %H:%i:%s') AS createAt,
            DATE_FORMAT(d.updated_at, '%Y-%m-%d %H:%i:%s') AS updateAt
         FROM departments AS d
         LEFT JOIN departments AS p ON d.parent_id = p.id
         ${whereSql}
         ORDER BY d.id ASC
         LIMIT ? OFFSET ?`,
        [...params, String(size), String(offset)]
    );

    const [rows] = await pool.execute(
        `SELECT COUNT(*) AS total
         FROM departments AS d
         ${whereSql}`,
        params
    );

    return {
        list,
        totalCount: rows[0].total
    };
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
    findUserById,
    findRoleById,
    findDepartmentById,
    findDepartmentPage
    
}