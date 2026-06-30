const systemModel = require('../models/system');
const authModel = require('../models/auth');



async function getUsersList(offset, size) {
     const list = await systemModel.findUsersList(offset, size);
     const totalCount = await systemModel.findUsersCount();

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
        name: 'username',
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

    const fieldMap = {
        roleId: 'role_id',
        departmentId: 'department_id',
        name: 'username',

    };

    const mapped = {};
    for (const [key, value] of Object.entries(userInfo)) {
        if (value === undefined) continue;  // 跳过 undefined
        const dbKey = fieldMap[key] || key;
        mapped[dbKey] = value;
    }

     const existing = await authModel.findByUsername(mapped.username);
    if (existing) return { error: '用户名已存在' };

    await systemModel.createUser(mapped);
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