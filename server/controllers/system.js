const systemService = require('../services/system');

function isValidDateString(value) {
    if (
        typeof value !== 'string' ||
        !/^[1-9]\d{3}-\d{2}-\d{2}$/.test(value)
    ) {
        return false;
    }

    const date = new Date(`${value}T00:00:00Z`);

    return (
        !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value
    );
}
async function getUsersList(req, res, next) {
    try {
        const { 
            offset = 0,
            size = 8,
            username = '',
            realname = '',
            cellphone = '',
            enable = null,
            createdFrom = null,
            createdTo = null
         } = req.body || {};

        if (
            !Number.isInteger(offset) ||
            offset < 0 ||
            !Number.isInteger(size) ||
            size < 1 ||
            size > 100
        ) {
            return res.status(400).json({
                code: 400,
                message: '分页参数不正确'
            });
        }

        const textFields = [
            { value: username, max: 50 },
            { value: realname, max: 100 },
            { value: cellphone, max: 32 }
        ];

        if (
            textFields.some(
                field =>
                    typeof field.value !== 'string' ||
                    field.value.length > field.max
            )
        ) {
            return res.status(400).json({
                code: 400,
                message: '搜索条件格式不正确'
            });
        }

        if (enable !== null && enable !== 0 && enable !== 1) {
            return res.status(400).json({
                code: 400,
                message: '状态只能为 0、1 或 null'
            });
        }

        const noDateFilter =
            createdFrom === null && createdTo === null;

        if (!noDateFilter) {
            if (
                !isValidDateString(createdFrom) ||
                !isValidDateString(createdTo)
            ) {
                return res.status(400).json({
                    code: 400,
                    message: '请选择完整且有效的创建日期范围'
                });
            }

            if (createdFrom > createdTo) {
                return res.status(400).json({
                    code: 400,
                    message: '开始日期不能晚于结束日期'
                });
            }

            // 后续 SQL 要计算结束日期的下一天，避免超出日期上限。
            if (createdTo === '9999-12-31') {
                return res.status(400).json({
                    code: 400,
                    message: '结束日期超出支持范围'
                });
            }
        }
        const usersList  = await systemService.getUsersList({
            offset,
            size,
            username: username.trim(),
            realname: realname.trim(),
            cellphone: cellphone.trim(),
            enable,
            createdFrom,
            createdTo
        });
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
        if (result && result.error) {
            const status = result.status ?? 400;

            return res.status(status).json({
                code: status,
                message: result.error
            });
        }
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
        if (result && result.error) {
            return res.json({ 
                code: 403, 
                message: result.error 
            });
        }
        res.json({ code: 200, message: '删除成功' });
    } catch (err) {
        next(err);
    }
}

async function createUser(req, res, next) {

    try {
        const userInfo = req.body;
        const result = await systemService.createUser(userInfo);
        if (result && result.error) {
           if (result && result.error) {
                const status = result.status ?? 400;
                return res.status(status).json({
                    code: status,
                    message: result.error
                });
            }
        }

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