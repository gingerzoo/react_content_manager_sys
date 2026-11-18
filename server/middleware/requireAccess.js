const userService = require('../services/user');

/**
 * 创建服务端菜单权限检查器。每次从数据库读取当前角色，不信任客户端角色。
 * @param {string | undefined} menuUrl - 必须具备的菜单地址；省略时仅检查账号启用。
 * @returns {import('express').RequestHandler} JWT 校验之后使用的权限中间件。
 */
function requireAccess(menuUrl) {
    return async function checkAccess(req, res, next) {
        try {
            const user = await userService.getUserById(req.user.id);
            if (!user || Number(user.enable) !== 1) {
                return res.status(401).json({ code: 401, message: '账号不存在或已停用' });
            }
            if (menuUrl && user.roleId !== 0) {
                const menus = await userService.getMenusByRoleId(user.roleId);
                const allowed = menus.some(menu =>
                    menu.url === menuUrl || menu.children?.some(child => child.url === menuUrl)
                );
                if (!allowed) {
                    return res.status(403).json({ code: 403, message: '没有访问该功能的权限' });
                }
            }
            next();
        } catch (error) {
            next(error);
        }
    };
}

module.exports = requireAccess;
