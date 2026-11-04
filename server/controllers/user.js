const userService = require('../services/user');
async function getUserInfo(req, res, next) {
    const userId = req.params.id;
    try {
        const result = await userService.getUserById(userId);
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
        console.log("获取菜单-----------",req)

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

        const menus = await userService.getMenusByRoleId(user.roleId);
        console.log("mmenus---------",menus)
        res.json({ code: 200, data: menus });
    } catch (err) {
        next(err);
    }


}






module.exports = {
    getUserInfo,
    getMenus,
}