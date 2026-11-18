// 本地集成检查：使用随机测试账号，结束后删除本次创建的账号。
// 运行：node server/scripts/test-register.js
const path = require('node:path');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), quiet: true });
const express = require('express');
const pool = require('../db');
const { verifyPassword } = require('../utils/password');
const authMiddleware = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');

/**
 * 验证真实 HTTP、数据库写入、密码哈希和权限；不调用模型服务。
 * @returns {Promise<void>} 检查通过后结束；失败时抛出断言或系统错误。
 */
async function main() {
    const username = `regtest_${randomUUID().replaceAll('-', '')}`;
    const racingUsername = `regtest_${randomUUID().replaceAll('-', '')}`;
    const password = 'RegisterTest_2026!';
    const app = express();
    app.use(express.json());
    app.use('/api', require('../routes/auth'));
    app.get('/admin-check', authMiddleware, requireAdmin, (_req, res) => res.sendStatus(204));
    app.use((error, _req, res, _next) => res.status(500).json({ code: 500 }));
    const server = app.listen(0, '127.0.0.1');

    try {
        await new Promise((resolve, reject) => {
            server.once('listening', resolve);
            server.once('error', reject);
        });
        const base = `http://127.0.0.1:${server.address().port}`;

        /**
         * 向临时测试服务提交 JSON 并校验 HTTP 状态码。
         * @param {string} endpoint - API 路径。
         * @param {unknown} body - JSON 请求体。
         * @param {number} expectedStatus - 预期 HTTP 状态。
         * @returns {Promise<object>} 已解析的业务响应。
         */
        const post = async (endpoint, body, expectedStatus) => {
            const response = await fetch(`${base}/api/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            assert.equal(response.status, expectedStatus);
            return response.json();
        };

        // 无效输入必须在写库前被拒绝。
        for (const body of [
            {}, [], { username, password: '123456' },
            { username: 'a', password },
            { username: 'invalid name', password },
            { username, password: `Aa${'1'.repeat(127)}` },
            { username, password, roleId: 0 },
            { username, password, enable: 1 }
        ]) {
            const result = await post('register', body, 400);
            assert.equal(result.code, 400);
        }

        const registered = await post('register', { username, password }, 200);
        assert.equal(registered.data.username, username);
        assert.equal('password' in registered.data, false);
        assert.equal('token' in registered.data, false);

        const [users] = await pool.execute(
            'SELECT id, password, role_id, enable, department_id FROM users WHERE username = ?',
            [username]
        );
        assert.equal(users.length, 1);
        assert.equal(users[0].role_id, 2);
        assert.equal(users[0].enable, 1);
        assert.equal(users[0].department_id, null);
        assert.notEqual(users[0].password, password);
        assert.match(users[0].password, /^scrypt-v1\$/);
        assert.equal(await verifyPassword(password, users[0].password), true);

        const duplicate = await post('register', { username, password }, 409);
        assert.equal(duplicate.code, 409);
        assert.equal(duplicate.message, '用户名已存在');

        // 并发预查询不能绕过唯一索引，最终只允许一个账号创建成功。
        const raced = await Promise.all([1, 2].map(() => fetch(`${base}/api/register`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: racingUsername, password })
        })));
        assert.deepEqual(raced.map(response => response.status).sort(), [200, 409]);
        await Promise.all(raced.map(response => response.json()));

        const login = await post('login', { username, password }, 200);
        assert.equal(login.data.id, registered.data.id);
        assert.equal(typeof login.data.token, 'string');
        await post('login', { username, password: 'WrongPassword1!' }, 401);
        const forbidden = await fetch(`${base}/admin-check`, {
            headers: { Authorization: `Bearer ${login.data.token}` }
        });
        assert.equal(forbidden.status, 403);
        await forbidden.json();
        console.log('注册集成检查通过：参数校验、密码哈希、重复/并发注册、默认普通角色、注册后登录和管理员权限隔离。');
    } finally {
        // 仅清理本次生成的两个随机账号，不修改已有业务账号。
        await new Promise(resolve => server.close(resolve));
        await pool.execute('DELETE FROM users WHERE username IN (?, ?)', [username, racingUsername]);
    }
}

main().catch(error => {
    console.error('注册集成检查失败：', error.code || error.message);
    process.exitCode = 1;
}).finally(() => pool.end().catch(() => {}));
