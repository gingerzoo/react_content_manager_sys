const authService = require('../services/auth');
async function login(req, res, next) {
    const { name, password } = req.body;
    try {
        const result = await authService.login(name, password);
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

async function register(req, res, next) {
    const { name, password } = req.body;
    try {
        const result = await authService.register(name, password);
        if (!result) {
            return res.status(409).json({
                code: 400,
                message: '用户已存在'
            });
        }
        res.json({
            code: 200,
            message: '注册成功',

        });
    } catch (err) {
        next(err);
    }

}

module.exports = {
    login,
    register
}