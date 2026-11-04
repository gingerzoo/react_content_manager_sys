const { verifyPassword } = require('../utils/password');
const authModel = require('../models/auth');
const jwt = require('jsonwebtoken');


async function login(username, password) {
    // 1. 服务端检查输入，不能只依赖前端表单校验
    if (
        typeof username !== 'string' ||
        !username.trim() ||
        typeof password !== 'string' ||
        !password ||
        password.length > 128
    ) {
        return null;
    }

    // 2. 根据账号查询用户
    const user = await authModel.findByUsername(username);

    if (!user) {
        return null;
    }

    // 3. 禁用账号不允许登录
    if (Number(user.enable) !== 1) {
        return null;
    }

    // 4. 使用用户输入的密码，校验数据库中的哈希
    const passwordMatched = await verifyPassword(
        password,
        user.password
    );

    if (!passwordMatched) {
        return null;
    }

   // 5. 只有校验通过，才签发 token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '12h' });
    return {
        token,
        id: user.id,
        username: user.username
    }
}

async function register(username, password) {
    const existingUser = await authModel.findByUsername(username);
    if (existingUser) {
        return null;
    }

    const result = await authModel.createUser(username, password);
    return result
}


module.exports = {
    login,
    register
}