const authService = require('../services/auth');
async function login(req, res, next) {
    const { username, password } = req.body;
    try {
        const result = await authService.login(username, password);
        if (!result) {
            return res.status(401).json({
                code: 401,
                message: '用户名或密码错误'
            });
        }
        res.json({
            code: 200,
            message: '获取用户信息成功',
            data: result

        }
        );
    } catch (err) {
        next(err);
    }
}

/**
 * 处理公开注册，不签发登录 token，不返回密码或哈希。
 * @param {import('express').Request} req - 包含注册参数的 HTTP 请求。
 * @param {import('express').Response} res - HTTP 响应对象。
 * @param {import('express').NextFunction} next - 将系统错误交给统一处理器。
 * @returns {Promise<import('express').Response | void>} 注册结果或业务错误响应。
 */
async function register(req, res, next) {
    try {
        const result = await authService.register(req.body);
        if (result.error) {
            return res.status(result.status).json({
                code: result.status,
                message: result.error
            });
        }
        res.json({
            code: 200,
            message: '注册成功',
            data: result
        });
    } catch (err) {
        next(err);
    }

}

module.exports = {
    login,
    register
}
