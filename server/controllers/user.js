const userService = require('../services/user');
const adminMenus = require('../utils/adminMenus');

/**
 * 根据已验证 JWT 读取本人信息，不接受客户端提供的用户 ID。
 * @param {import('express').Request} req - 已认证请求。
 * @param {import('express').Response} res - JSON 响应。
 * @param {import('express').NextFunction} next - 异常处理器。
 * @returns {Promise<void>} 返回当前账号信息。
 */
async function getCurrentUser(req, res, next) {
    try {
        res.json({ code: 200, message: '获取当前用户成功', data: req.currentUser });
    } catch (error) {
        next(error);
    }
}
async function getUserInfo(req, res, next) {
    const userId = req.params.id;
    try {
        const currentUser = req.currentUser;
        const isSelf = String(currentUser.id) === userId;
        if (!isSelf && currentUser.roleId !== 0) {
            return res.status(403).json({ code: 403, message: '只能查看本人的资料' });
        }
        const result = isSelf ? currentUser : await userService.getUserById(userId);
        if (!result) {
            return res.status(404).json({
                code: 404,
                message: '用户不存在'
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

async function getMenus(req, res, next) {
    try {

        // authMiddleware 校验 token 后，将载荷放在 req.user 中。
        const userId = req.user.id;
        const user = await userService.getUserById(userId);

        if (!user || Number(user.enable) !== 1) {
            return res.status(401).json({
                code: 401,
                message: '账号不存在或已停用'
            });
        }

        if (user.roleId === null || user.roleId === undefined) {
            return res.status(403).json({
                code: 403,
                message: '账号尚未配置角色'
            });
        }

        let menus = await userService.getMenusByRoleId(user.roleId);
        if (user.roleId !== 0) {
            // 权限也由 API 单独校验。旧数据库中残留的授权不会重新显示这些页面。
            menus = menus
                .map(menu => ({
                    ...menu,
                    children: menu.children.filter(child => !adminMenus.has(child.url))
                }))
                .filter(menu => menu.children.length > 0);
        }
        res.json({ code: 200, data: menus });
    } catch (err) {
        next(err);
    }


}






module.exports = {
    getCurrentUser,
    getUserInfo,
    getMenus,
}
