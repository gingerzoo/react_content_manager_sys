const pool = require('../db');
const effectiveRoleMenus = require('./effectiveRoleMenus');
const adminMenus = require('../utils/adminMenus');

/**
 * 抛出可向用户展示的业务错误。
 * @param {number} status - HTTP 状态码。
 * @param {string} message - 业务错误说明。
 * @returns {never} 始终抛出错误。
 */
function fail(status, message) {
    const error = new Error(message);
    error.status = status;
    throw error;
}

/**
 * 查询角色分页及其用户数量、菜单权限，不返回账号密码。
 * @param {{offset: number, size: number, name: string}} filters - 分页和角色名称筛选。
 * @returns {Promise<{list: object[], totalCount: number}>} 当前页和筛选后的总数。
 */
async function findRolePage({ offset, size, name }) {
    const where = name ? 'WHERE LOCATE(?, r.name) > 0' : '';
    const params = name ? [name] : [];
    const [list] = await pool.execute(
        `SELECT r.id, r.name,
            (SELECT COUNT(*) FROM users u WHERE u.role_id = r.id) AS userCount
         FROM roles r ${where} ORDER BY r.id
         LIMIT ? OFFSET ?`, [...params, String(size), String(offset)]
    );
    const [counts] = await pool.execute(`SELECT COUNT(*) AS total FROM roles r ${where}`, params);
    if (list.length) {
        const [menus] = await pool.execute(
            `SELECT rm.role_id, m.id, m.name, m.parent_id, m.url FROM ${effectiveRoleMenus} rm
             JOIN menus m ON m.id = rm.menu_id
             WHERE rm.role_id IN (${list.map(() => '?').join(',')}) ORDER BY m.id`,
            list.map(role => role.id)
        );
        for (const role of list) {
            const assigned = menus.filter(menu =>
                menu.role_id === role.id && (role.id === 0 || !adminMenus.has(menu.url))
            );
            role.menuIds = assigned.map(menu => menu.id);
            role.menuNames = assigned.filter(menu => menu.parent_id !== null).map(menu => menu.name);
        }
    }
    return { list, totalCount: counts[0].total };
}

/**
 * 为上级部门选择器提供完整层级，不依赖当前列表的分页或筛选。
 * @returns {Promise<object[]>} 部门 ID、名称及父部门 ID。
 */
async function findDepartmentOptions() {
    const [rows] = await pool.execute('SELECT id, name, parent_id AS parentId FROM departments ORDER BY id');
    return rows;
}

/**
 * 在事务中新增、修改或删除部门；锁定层级，防止并发修改形成环。
 * @param {'create' | 'update' | 'delete'} action - 操作类型。
 * @param {number | null} id - 目标部门 ID；新增时为 null。
 * @param {{name?: string, leader?: string, parentId?: number | null}} data - 已校验字段。
 * @returns {Promise<{id: number}>} 操作的部门 ID。
 */
async function mutateDepartment(action, id, data) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [departments] = await connection.execute('SELECT id, name, parent_id FROM departments FOR UPDATE');
        if (action !== 'create' && !departments.some(item => item.id === id)) fail(404, '部门不存在');

        if (action === 'delete') {
            if (departments.some(item => item.parent_id === id)) fail(409, '部门下仍有子部门，不能删除');
            const [users] = await connection.execute('SELECT id FROM users WHERE department_id = ? LIMIT 1', [id]);
            if (users.length) fail(409, '部门下仍有用户，不能删除');
            await connection.execute('DELETE FROM departments WHERE id = ?', [id]);
        } else {
            if (departments.some(item => item.id !== id && item.name === data.name)) fail(409, '部门名称已存在');
            // 沿父链向上查找：新父节点不能是自己，也不能是自己的后代。
            let cursor = data.parentId;
            const visited = new Set();
            while (cursor !== null) {
                if (cursor === id || visited.has(cursor)) fail(400, '上级部门不能是自身或其子部门');
                visited.add(cursor);
                const parent = departments.find(item => item.id === cursor);
                if (!parent) fail(400, '上级部门不存在，请刷新后重试');
                cursor = parent.parent_id;
            }
            if (action === 'create') {
                const [result] = await connection.execute(
                    'INSERT INTO departments (name, leader, parent_id) VALUES (?, ?, ?)',
                    [data.name, data.leader, data.parentId]
                );
                id = result.insertId;
            } else {
                await connection.execute('UPDATE departments SET name = ?, leader = ?, parent_id = ? WHERE id = ?',
                    [data.name, data.leader, data.parentId, id]);
            }
        }
        await connection.commit();
        return { id };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

/**
 * 在事务中保存角色及菜单；父菜单自动补齐，角色和授权保持原子更新。
 * @param {'create' | 'update' | 'delete'} action - 操作类型。
 * @param {number | null} id - 角色 ID；新增时为 null。
 * @param {{name?: string, menuIds?: number[]}} data - 已校验的角色字段。
 * @returns {Promise<{id: number}>} 操作的角色 ID。
 */
async function mutateRole(action, id, data) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [roles] = await connection.execute('SELECT id, name FROM roles FOR UPDATE');
        if (action !== 'create') {
            if (!roles.some(role => role.id === id)) fail(404, '角色不存在');
            if (id === 0 || id === 2) fail(403, '超级管理员和默认查看者是内置角色，不能修改或删除');
        }
        if (action === 'delete') {
            const [users] = await connection.execute('SELECT id FROM users WHERE role_id = ? LIMIT 1', [id]);
            if (users.length) fail(409, '该角色仍有关联用户，不能删除');
            await connection.execute('DELETE FROM role_menus WHERE role_id = ?', [id]);
            await connection.execute('DELETE FROM roles WHERE id = ?', [id]);
        } else {
            if (roles.some(role => role.id !== id && role.name === data.name)) fail(409, '角色名称已存在');
            const [menus] = await connection.execute('SELECT id, parent_id, url FROM menus');
            const menuIds = new Set();
            for (const selectedId of data.menuIds) {
                let cursor = selectedId;
                while (cursor !== null && !menuIds.has(cursor)) {
                    const menu = menus.find(item => item.id === cursor);
                    if (!menu) fail(400, '选择的菜单不存在，请刷新后重试');
                    if (adminMenus.has(menu.url)) fail(403, '用户管理仅对管理员开放');
                    menuIds.add(cursor);
                    cursor = menu.parent_id;
                }
            }
            if (action === 'create') {
                // roles.id 不是 AUTO_INCREMENT；锁定角色表已有记录后分配新 ID。
                id = Math.max(0, ...roles.map(role => role.id)) + 1;
                await connection.execute('INSERT INTO roles (id, name) VALUES (?, ?)', [id, data.name]);
            } else {
                await connection.execute('UPDATE roles SET name = ? WHERE id = ?', [data.name, id]);
                await connection.execute('DELETE FROM role_menus WHERE role_id = ?', [id]);
            }
            for (const menuId of menuIds) {
                await connection.execute('INSERT INTO role_menus (role_id, menu_id) VALUES (?, ?)', [id, menuId]);
            }
        }
        await connection.commit();
        return { id };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

module.exports = { findRolePage, findDepartmentOptions, mutateDepartment, mutateRole };
