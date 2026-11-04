const path = require('node:path');
const { createInterface } = require('node:readline/promises');
const { stdin, stdout } = require('node:process');

require('dotenv').config({
    path: path.join(__dirname, '../.env')
});

const pool = require('../db');
const { hashPassword } = require('../utils/password');

async function main() {
    const rl = createInterface({
        input: stdin,
        output: stdout
    });

    try {
        const username = (
            await rl.question('请输入网页管理员账号：')
        ).trim();

        if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{2,49}$/.test(username)) {
            throw new Error('账号需要为 3–50 位字母、数字、下划线或连字符');
        }

        // 此简单脚本的输入会显示在终端，请在私人环境中使用。
        const password = await rl.question('请输入密码（6–128 字符）：');
        const confirmPassword = await rl.question('请再次输入密码：');

        if (password !== confirmPassword) {
            throw new Error('两次密码不一致');
        }

        const passwordHash = await hashPassword(password);

        const [existingUsers] = await pool.execute(
            'SELECT id FROM users WHERE username = ?',
            [username]
        );

        if (existingUsers.length > 0) {
            throw new Error('账号已存在，请使用其他账号名');
        }

        await pool.execute(
            `INSERT INTO users
                (username, password, realname, role_id, enable)
             VALUES (?, ?, ?, ?, ?)`,
            [username, passwordHash, '系统管理员', 0, 1]
        );

        console.log('管理员创建成功。');
    } finally {
        rl.close();
        await pool.end();
    }
}

main().catch(error => {
    console.error('创建失败：', error.code || error.message);
    process.exitCode = 1;
});