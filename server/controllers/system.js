const systemService = require('../services/system');
async function getUsersList(req, res, next) {
    try {
        const { offset, size } = req.body;
        const usersList  = await systemService.getUsersList(offset, size);
        res.json({
            code: 200,
            message: '获取用户信息成功',
            data: usersList

        });
    } catch (err) {
        next(err);
    }
}

async function getRoleList(req, res, next) {
    try {

        const roleList  = await systemService.getRoleList();
        res.json({
            code: 200,
            message: '获取角色列表成功',
            data: roleList

        });
    } catch (err) {
        next(err);
    }
}

async function getDepartmentList(req, res, next) {
    try {
        const departmentList  = await systemService.getDepartmentList();
        res.json({
            code: 200,
            message: '获取部门信息成功',
            data: departmentList

        });
    } catch (err) {
        next(err);
    }
}

async function getMenuList(req, res, next) {
    try {
        const menuList  = await systemService.getMenuList();
        res.json({
            code: 200,
            message: '获取菜单成功',
            data: menuList

        });
    } catch (err) {
        next(err);
    }
}

async function editUser(req, res, next) {
    try {
        const id = req.params.id;
        const data = req.body;
        const result = await systemService.editUser(id, data);
        if (result && result.error) return res.json({ code: 403, message: result.error });
        res.json({
            code: 200,
            message: '编辑用户信息成功',
        });
    } catch (err) {
        next(err);
    }
}


async function deleteUser(req, res, next) {
    const userId = req.params.id;
    try {
        const result = await systemService.deleteUser(userId);
        if (result && result.error) return res.json({ code: 403, message: result.error });
        res.json({ code: 200, message: '删除成功' });
    } catch (err) {
        next(err);
    }
}

async function createUser(req, res, next) {

    try {
        const userInfo = req.body;
        const result = await systemService.createUser(userInfo);
        if (result && result.error) return res.json({ code: 400, message: result.error });

        res.json({ code: 200, message: '创建成功' });
    } catch (err) {
        next(err);
    }
}





module.exports = {
   getUsersList,
   getRoleList,
   getDepartmentList,
   getMenuList,
   editUser,
   deleteUser,
   createUser
}