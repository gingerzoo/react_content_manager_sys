// 本地真实数据库集成检查。仅创建随机测试用户/部门/角色/会话，结束后清理。
// 运行前先执行：node server/scripts/seed-default-menus.js
const path = require('node:path');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), quiet: true });
const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { hashPassword } = require('../utils/password');

/**
 * 验证菜单、管理员组织 CRUD、只读权限、层级和会话归属，不调用付费模型。
 * @returns {Promise<void>} 完成检查与测试数据清理；失败时抛出断言错误。
 */
async function main() {
    const prefix = `orgtest_${randomUUID().slice(0, 8)}`;
    const users = [];
    const roleIds = [];
    const departmentIds = [];
    let server;
    let checks = 0;
    try {
        const passwordHash = await hashPassword('OrgTest2026!');
        for (const [suffix, roleId] of [['admin', 0], ['viewer', 2], ['other', 2]]) {
            const [result] = await pool.execute(
                'INSERT INTO users (username, password, role_id) VALUES (?, ?, ?)',
                [`${prefix}_${suffix}`, passwordHash, roleId]
            );
            users.push(result.insertId);
        }
        const tokens = users.map(id => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '10m' }));
        const [admin, viewer, other] = tokens;
        const app = express();
        app.use(express.json());
        app.use('/api', require('../routes/auth'));
        app.use('/api', require('../routes/system'));
        app.use('/api/user', require('../routes/user'));
        app.use('/api/agent', require('../routes/agent'));
        app.use((error, _req, res, _next) => {
            const status = ['ER_DUP_ENTRY', 'ER_ROW_IS_REFERENCED_2', 'ER_NO_REFERENCED_ROW_2'].includes(error.code) ? 409 : 500;
            res.status(status).json({ code: status, message: error.code || '服务器错误' });
        });
        server = app.listen(0, '127.0.0.1');
        await new Promise((resolve, reject) => {
            server.once('listening', resolve);
            server.once('error', reject);
        });
        const base = `http://127.0.0.1:${server.address().port}/api`;

        /**
         * 调用临时服务并同时检查 HTTP 与业务状态码。
         * @param {string} method - HTTP 方法。
         * @param {string} url - API 相对路径。
         * @param {string | null} token - 测试账号的 JWT；null 表示未登录。
         * @param {unknown} body - 可选 JSON 请求体。
         * @param {number} status - 预期状态码。
         * @returns {Promise<object>} JSON 响应。
         */
        const request = async (method, url, token, body, status = 200) => {
            const response = await fetch(base + url, {
                method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                ...(body === undefined ? {} : { body: JSON.stringify(body) })
            });
            const result = await response.json();
            assert.equal(response.status, status, `${method} ${url}: ${result.message}`);
            assert.equal(result.code, status);
            checks++;
            return result;
        };

        const menus = (await request('GET', '/user/me/menus', viewer)).data;
        const leaves = menus.flatMap(menu => menu.children ?? []);
        for (const url of ['/main/system/user', '/main/system/department', '/main/system/role', '/main/story/chat']) {
            assert(leaves.some(menu => menu.url === url), `查看者缺少菜单 ${url}`);
        }
        assert.equal((await request('GET', '/user/me', viewer)).data.roleId, 2);
        const userPage = await request('POST', '/users/list', viewer, { username: `${prefix}_viewer`, offset: 0, size: 4 });
        assert.equal(userPage.data.totalCount, 1);
        assert.equal('password' in userPage.data.list[0], false);
        const rolePage = await request('POST', '/roles/list', viewer, { name: '查看者', offset: 0, size: 4 });
        assert.equal(rolePage.data.totalCount, 1);
        assert.equal(rolePage.data.list[0].id, 2);
        await request('POST', '/departments/list', viewer, { offset: 0, size: 4 });
        for (const endpoint of ['/users/list', '/departments/list', '/roles/list']) {
            await request('POST', endpoint, null, {}, 401);
        }
        // 直接调 API 也不能绕过只读限制，不依赖前端是否展示按钮。
        for (const [method, url] of [
            ['POST', '/users'], ['PATCH', `/users/${users[1]}`], ['DELETE', `/users/${users[1]}`],
            ['POST', '/departments'], ['PATCH', '/departments/1'], ['DELETE', '/departments/1'],
            ['POST', '/roles'], ['PATCH', '/roles/1'], ['DELETE', '/roles/1']
        ]) await request(method, url, viewer, method === 'DELETE' ? undefined : {}, 403);

        const parent = (await request('POST', '/departments', admin, { name: `${prefix}_parent`, leader: '测试负责人', parentId: null })).data.id;
        departmentIds.push(parent);
        const child = (await request('POST', '/departments', admin, { name: `${prefix}_child`, leader: '', parentId: parent })).data.id;
        departmentIds.push(child);
        const grandchild = (await request('POST', '/departments', admin, { name: `${prefix}_grandchild`, leader: '', parentId: child })).data.id;
        departmentIds.push(grandchild);
        const page = await request('POST', '/departments/list', viewer, { name: prefix, offset: 1, size: 1 });
        assert.equal(page.data.list.length, 1);
        assert.equal(page.data.totalCount, 3);
        const filtered = await request('POST', '/departments/list', viewer, { name: prefix, leader: '测试负责人', size: 4 });
        assert.equal(filtered.data.totalCount, 1);
        const options = await request('GET', '/departments/options', admin);
        assert(options.data.some(item => item.id === grandchild && item.parentId === child));
        await request('PATCH', `/departments/${parent}`, admin, { name: `${prefix}_parent`, parentId: grandchild }, 400);
        await request('PATCH', `/departments/${child}`, admin, { name: `${prefix}_child2`, leader: '新负责人', parentId: parent });
        await request('POST', '/departments', admin, { name: `${prefix}_parent` }, 409);
        await request('POST', '/departments', admin, { name: ' ', parentId: null }, 400);
        await request('POST', '/departments', admin, { name: `${prefix}_invalid`, parentId: 2147483647 }, 400);
        await request('DELETE', `/departments/${parent}`, admin, undefined, 409);

        const chatMenu = leaves.find(menu => menu.url === '/main/story/chat').id;
        const userMenu = leaves.find(menu => menu.url === '/main/system/user').id;
        const role = (await request('POST', '/roles', admin, { name: `${prefix}_role`, menuIds: [chatMenu] })).data.id;
        roleIds.push(role);
        await pool.execute('UPDATE users SET role_id = ? WHERE id = ?', [role, users[2]]);
        await request('POST', '/users/list', other, {}, 403);
        const assigned = (await request('GET', '/user/me/menus', other)).data;
        assert(assigned.some(menu => menu.children.some(item => item.id === chatMenu)));
        await request('PATCH', `/roles/${role}`, admin, { name: `${prefix}_renamed`, menuIds: [chatMenu, userMenu] });
        await request('POST', '/users/list', other, { username: `${prefix}_other` });
        await request('POST', '/roles', admin, { name: `${prefix}_renamed`, menuIds: [] }, 409);
        await request('POST', '/roles', admin, { name: `${prefix}_invalid`, menuIds: [2147483647] }, 400);
        for (const builtIn of [0, 2]) {
            await request('PATCH', `/roles/${builtIn}`, admin, { name: '不应保存', menuIds: [] }, 403);
            await request('DELETE', `/roles/${builtIn}`, admin, undefined, 403);
        }
        await request('DELETE', `/roles/${role}`, admin, undefined, 409);
        await pool.execute('UPDATE users SET role_id = 2 WHERE id = ?', [users[2]]);
        await request('DELETE', `/roles/${role}`, admin);

        // 内容助手允许查看者创建自己的会话，但不能访问他人的会话。
        const conversation = (await request('POST', '/agent/conversations', viewer, { title: prefix }, 201)).data.id;
        await request('GET', `/agent/conversations/${conversation}/messages`, viewer);
        await request('GET', `/agent/conversations/${conversation}/messages`, other, undefined, 404);
        await request('POST', `/agent/conversations/${conversation}/messages`, other, { content: '不应执行模型调用' }, 404);
        await request('POST', `/agent/conversations/${conversation}/messages/stream`, other, { content: '不应执行模型调用' }, 404);
        await request('DELETE', `/agent/conversations/${conversation}`, other, undefined, 404);
        await request('DELETE', `/agent/conversations/${conversation}`, viewer);

        await pool.execute('UPDATE users SET department_id = ? WHERE id = ?', [grandchild, users[1]]);
        await request('DELETE', `/departments/${grandchild}`, admin, undefined, 409);
        await pool.execute('UPDATE users SET department_id = NULL, enable = 0 WHERE id = ?', [users[1]]);
        await request('POST', '/roles/list', viewer, {}, 401);
        await request('GET', '/agent/conversations', viewer, undefined, 401);
        await pool.execute('UPDATE users SET enable = 1 WHERE id = ?', [users[1]]);
        for (const id of [grandchild, child, parent]) await request('DELETE', `/departments/${id}`, admin);
        await request('POST', '/roles/list', admin, { size: 0 }, 400);
        await request('POST', '/departments/list', admin, { offset: -1 }, 400);
        console.log(`组织及权限集成检查通过：${checks} 次 HTTP 检查；涵盖四菜单、只读限制、CRUD、层级防环、关联保护、动态授权、停用账号及会话隔离。`);
    } finally {
        if (server) await new Promise(resolve => server.close(resolve));
        // 所有条件仅引用本次生成的 ID，不修改已有业务账号和会话。
        if (users.length) {
            const slots = users.map(() => '?').join(',');
            await pool.execute(`DELETE FROM agent_conversations WHERE user_id IN (${slots})`, users);
            await pool.execute(`DELETE FROM users WHERE id IN (${slots})`, users);
        }
        for (const id of roleIds) {
            await pool.execute('DELETE FROM role_menus WHERE role_id = ?', [id]);
            await pool.execute('DELETE FROM roles WHERE id = ?', [id]);
        }
        for (const id of departmentIds.reverse()) await pool.execute('DELETE FROM departments WHERE id = ?', [id]);
    }
}

main().catch(error => {
    console.error('组织集成检查失败：', error.code || error.message);
    process.exitCode = 1;
}).finally(() => pool.end().catch(() => {}));
