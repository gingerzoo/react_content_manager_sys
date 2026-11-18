const { verifyPassword, hashPassword, getPasswordError } = require('../utils/password');
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

/**
 * 校验公开注册参数，并以哈希密码创建默认查看者账号。
 * @param {unknown} body - 请求体，仅允许 username、password 两个字段。
 * @returns {Promise<{id: number, username: string} | {status: number, error: string}>}
 * 成功返回账号摘要；业务校验失败返回 HTTP 状态码和可展示的错误。
 * @throws {Error} 非重复用户名的数据库故障或密码计算失败时抛出。
 */
async function register(body) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return { status: 400, error: '注册参数格式不正确' };
    }

    // 不接收 roleId、enable 等管理字段，阻止通过公开接口提升权限。
    if (Object.keys(body).some(key => !['username', 'password'].includes(key))) {
        return { status: 400, error: '注册仅支持用户名和密码' };
    }

    const { username, password } = body;
    if (
        typeof username !== 'string' ||
        !/^[A-Za-z0-9][A-Za-z0-9_-]{2,49}$/.test(username)
    ) {
        return {
            status: 400,
            error: '用户名需为 3–50 位，以字母或数字开头，仅包含字母、数字、下划线和短横线'
        };
    }

    const passwordError = getPasswordError(password);
    if (passwordError) return { status: 400, error: passwordError };

    const existingUser = await authModel.findByUsername(username);
    if (existingUser) {
        return { status: 409, error: '用户名已存在' };
    }

    const passwordHash = await hashPassword(password);
    try {
        const result = await authModel.createUser(username, passwordHash);
        return { id: result.insertId, username };
    } catch (error) {
        // 两次并发注册可能同时通过预查询，最终仍由数据库唯一索引兜底。
        if (error.code === 'ER_DUP_ENTRY') {
            return { status: 409, error: '用户名已存在' };
        }
        throw error;
    }
}


module.exports = {
    login,
    register
}
