const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), quiet: true });
const pool = require('../db');

/**
 * 幂等补齐四个菜单，并给管理员、默认查看者分配菜单；不改变已有用户角色。
 * @returns {Promise<void>} 提交菜单及授权事务，失败时回滚。
 */
async function seed() {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [roles] = await connection.execute('SELECT id FROM roles WHERE id IN (0, 2) FOR UPDATE');
        if (roles.length !== 2) throw new Error('缺少超级管理员或默认查看者角色，请先初始化数据库');
        const [existing] = await connection.execute('SELECT id, url FROM menus FOR UPDATE');
        let nextId = Math.max(0, ...existing.map(menu => menu.id)) + 1;
        const ids = new Map(existing.map(menu => [menu.url, menu.id]));
        const definitions = [
            ['系统管理', '/main/system', null],
            ['用户管理', '/main/system/user', '/main/system'],
            ['部门管理', '/main/system/department', '/main/system'],
            ['角色管理', '/main/system/role', '/main/system'],
            ['内容运营', '/main/story', null],
            ['内容助手', '/main/story/chat', '/main/story']
        ];
        for (const [name, url, parentUrl] of definitions) {
            if (!ids.has(url)) {
                const id = nextId++;
                await connection.execute('INSERT INTO menus (id, name, url, parent_id) VALUES (?, ?, ?, ?)',
                    [id, name, url, parentUrl ? ids.get(parentUrl) : null]);
                ids.set(url, id);
            }
            for (const roleId of [0, 2]) {
                await connection.execute(
                    'INSERT IGNORE INTO role_menus (role_id, menu_id) VALUES (?, ?)',
                    [roleId, ids.get(url)]
                );
            }
        }
        await connection.commit();
        console.log('已补齐用户、部门、角色、内容助手菜单，并授权管理员及默认查看者。');
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

seed().catch(error => {
    console.error('菜单初始化失败：', error.code || error.message);
    process.exitCode = 1;
}).finally(() => pool.end().catch(() => {}));
