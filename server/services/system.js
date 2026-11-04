const systemModel = require('../models/system');
const authModel = require('../models/auth');
const { 
    hashPassword,
    getPasswordError
} = require('../utils/password');



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
    const user = await systemModel.findUserById(id);
    if (user && user.role_id == 0) {
        return { error: '超级管理员不能编辑' };
    }

    const fieldMap = {
        roleId: 'role_id',
        departmentId: 'department_id'
    };

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

     if (!Number.isInteger(roleId)) {
        return { error: '请选择有效角色' };
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