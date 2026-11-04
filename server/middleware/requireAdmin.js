const userService = require('../services/user');

async function requireAdmin(req, res, next) {
    try {
        // 前面的 authMiddleware 已经验证 token。
        const user = await userService.getUserById(req.user.id);

        if (!user || Number(user.enable) !== 1) {
            return res.status(401).json({
                code: 401,
                message: '账号不存在或已停用'
            });
        }

        // 数据库中的 role_id 是 INT，查询返回 roleId。
        if (user.roleId !== 0) {
            return res.status(403).json({
                code: 403,
                message: '需要管理员权限'
            });
        }

        next();
    } catch (error) {
        next(error);
    }
}

module.exports = requireAdmin;