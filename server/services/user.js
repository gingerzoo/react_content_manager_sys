const userModel = require('../models/user');



async function getUserById(id) {
     const user = await userModel.findById(id);
    if (!user) {
        return null;
    }


   return user
}

// async function register(name, password) {
//     const existingUser = await authModel.findByUsername(name);
//     if (existingUser) {
//         return null;
//     }

//     const result = await authModel.creatUser(name, password);
//     return result
// }

async function getMenusByRoleId(roleId) {
        const menus = await userModel.findMenusByRoleId(roleId);

    // 筛出一级菜单（parent_id 为 null）
    const parentMenus = menus.filter(m => m.parent_id === null);

    // 给每个一级菜单挂上 children
    return parentMenus.map(parent => ({
        ...parent,
        children: menus.filter(m => m.parent_id === parent.id)
    }));




}

module.exports = {
    getUserById
}