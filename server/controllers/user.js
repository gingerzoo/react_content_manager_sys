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
        const roleId = req.params.id;
        const menus = await userService.getMenusByRoleId(roleId);
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