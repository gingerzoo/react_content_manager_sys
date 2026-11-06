const systemModel = require('../models/system');
const authModel = require('../models/auth');
const { 
    hashPassword,
    getPasswordError
} = require('../utils/password');

async function validateUserAssignments(data) {
    const hasField = key =>
        Object.prototype.hasOwnProperty.call(data, key);

    if (hasField('roleId')) {
        if (
            !Number.isSafeInteger(data.roleId) ||
            data.roleId < 0
        ) {
            return {
                status: 400,
                error: '角色 ID 必须是非负整数'
            };
        }

        if (data.roleId === 0) {
            return {
                status: 403,
                error: '不能通过此接口分配超级管理员角色'
            };
        }

        const role =
            await systemModel.findRoleById(data.roleId);

        if (!role) {
            return {
                status: 400,
                error: '所选角色不存在'
            };
        }
    }

    if (
        hasField('departmentId') &&
        data.departmentId !== null
    ) {
        if (
            !Number.isSafeInteger(data.departmentId) ||
            data.departmentId <= 0
        ) {
            return {
                status: 400,
                error: '部门 ID 必须是正整数或 null'
            };
        }

        const department =
            await systemModel.findDepartmentById(
                data.departmentId
            );

        if (!department) {
            return {
                status: 400,
                error: '所选部门不存在'
            };
        }
    }

    return null;
}



async function getUsersList({ 
    offset, 
    size, 
    username,
    realname,
    cellphone,
    enable,
    createdFrom,
    createdTo
}) {
    const filters = {
        username,
        realname,
        cellphone,
        enable,
        createdFrom,
        createdTo
    };
     const list = await systemModel.findUsersList(
        offset, 
        size, 
        filters
    );
     const totalCount = await systemModel.findUsersCount(filters);

   return {
       list,
       totalCount
   }
}

async function getRoleList() {
    const list = await systemModel.findRoleList();
    return {
        list,
    }
}

async function getDepartmentList() {
    const list = await systemModel.findDepartmentList();

   return {
       list,
   }
}

async function getMenuList() {
     const list = await systemModel.findMenuList();

   return {
       list,
   }
}

async function editUser(id, data) {
    // 请求体必须是一个对象。
    if (
        data === null ||
        typeof data !== 'object' ||
        Array.isArray(data)
    ) {
        return { status: 400, error: '编辑参数格式不正确' };
    }

        // 同时作为“允许修改的字段”和“数据库字段映射”。
    const fieldMap = {
        username: 'username',
        realname: 'realname',
        cellphone: 'cellphone',
        enable: 'enable',
        roleId: 'role_id',
        departmentId: 'department_id'
    };

    const entries = Object.entries(data);

    if (entries.length === 0) {
        return { status: 400, error: '请提供需要修改的字段' };
    }

    const hasUnknownField = entries.some(
        ([key]) =>
            !Object.prototype.hasOwnProperty.call(fieldMap, key)
    );

    if (hasUnknownField) {
        return { status: 400, error: '包含不允许修改的字段' };
    }

    // PATCH 允许只提交部分字段。
// 没有提交的字段，不参与本次校验和修改。
const hasField = key =>
    Object.prototype.hasOwnProperty.call(data, key);

    if (hasField('username')) {
        if (
            typeof data.username !== 'string' ||
            !/^[A-Za-z0-9][A-Za-z0-9_-]{2,49}$/.test(data.username)
        ) {
            return {
                status: 400,
                error: '用户名需为 3–50 位，以字母或数字开头，仅包含字母、数字、下划线和短横线'
            };
        }
    }

    if (hasField('realname')) {
        if (
            typeof data.realname !== 'string' ||
            data.realname.length > 100
        ) {
            return {
                status: 400,
                error: '真实姓名必须是字符串，且不能超过 100 个字符'
            };
        }
    }

    if (hasField('cellphone')) {
        if (
            typeof data.cellphone !== 'string' ||
            !/^(?:1[3-9]\d{9})?$/.test(data.cellphone)
        ) {
            return {
                status: 400,
                error: '手机号请留空或填写 11 位中国大陆手机号'
            };
        }
    }

    if (hasField('enable')) {
        if (data.enable !== 0 && data.enable !== 1) {
            return {
                status: 400,
                error: '状态只能为数字 0 或 1'
            };
        }
    }

    const user = await systemModel.findUserById(id);

    if (!user) {
        return { status: 404, error: '用户不存在' };
    }
    if (Number(user.role_id) === 0) {
        return {
            status: 403,
            error: '超级管理员不能编辑'
        };
    }

    const assignmentError =
        await validateUserAssignments(data);

    if (assignmentError) {
        return assignmentError;
    }

    if (hasField('username')) {
        const existingUser =
            await authModel.findByUsername(data.username);

        if (
            existingUser &&
            Number(existingUser.id) !== Number(user.id)
        ) {
            return {
                status: 409,
                error: '用户名已存在'
            };
        }
    }



    const mapped = {};
    for (const [key, value] of Object.entries(data)) {
        if (value === undefined) continue;
        const dbKey = fieldMap[key] || key;
        mapped[dbKey] = value;
    }

    await systemModel.editUser(id, mapped);
    return null;
}


async function deleteUser(id) {
     const user = await systemModel.findUserById(id);
      console.log('deleteUser - id:', id, 'user:', user);
     if (user && user.role_id == 0) {
        return { error: '超级管理员不能删除' };
     }

    await systemModel.deleteUser(id);
}


async function createUser(userInfo) {
    const {
        username,
        password,
        realname,
        cellphone,
        roleId,
        departmentId
    } = userInfo;

    // 服务端校验，不能只依赖前端表单。
    const passwordError = getPasswordError(password);

    if (passwordError) {
        return { error: passwordError };
    }

    if (
        typeof password !== 'string' ||
        password.length < 6 ||
        password.length > 128
    ) {
        return { error: '密码长度需要为 6–128 个字符' };
    }

    
    if (
        typeof cellphone !== 'string' ||
            !/^(?:1[3-9]\d{9})?$/.test(cellphone)
        ) {
            return {
                error: '手机号请留空或填写 11 位中国大陆手机号'
            };
        }

     if (!Number.isInteger(roleId)) {
        return { error: '请选择有效角色' };
    }

    const assignmentError =
    await validateUserAssignments(userInfo);

    if (assignmentError) {
        return assignmentError;
    }

    const existing = await authModel.findByUsername(username);
    if (existing) return { error: '用户名已存在' };

    const passwordHash = await hashPassword(password);

    const data = {
        username,
        password: passwordHash,
        realname: realname ?? '',
        cellphone: cellphone ?? '',
        role_id: roleId,
        department_id: departmentId ?? null
    };

    await systemModel.createUser(data);
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