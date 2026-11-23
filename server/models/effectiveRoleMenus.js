// 合并显式授权和每个角色自带的助手菜单；UNION 会去掉旧授权中的重复项。
module.exports = `(
    SELECT role_id, menu_id FROM role_menus
    UNION
    SELECT r.id AS role_id, m.id AS menu_id
    FROM roles r CROSS JOIN menus m
    WHERE m.url IN ('/main/story', '/main/story/chat')
)`;
