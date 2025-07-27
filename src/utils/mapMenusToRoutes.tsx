import type { RouteObject } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
export function loadLocalRoutes(): RouteObject[] {
    // eager: true 的作用是一次性同步加载所有模块
    const modules = import.meta.glob('../router/main/**/*.tsx', { eager: true });
    // const routeModules = Object.values(m)
    const routeModules = Object.values(modules).map((mod: any) => mod.default);

    return routeModules;
}

export function mapMeunsToRoutes(userMenus: any[]) {
    const localRoutes = loadLocalRoutes();
    const userRoutes: RouteObject[] = [];
    userMenus.forEach(menu => {
        menu.children.forEach(subMenu => {
            const route = localRoutes.find(route => route.path === subMenu.url);

            // 给一级菜单一个重定向！！！
            if (route && !userRoutes.find(route => route.path === menu.url)) {
                userRoutes.push({
                    path: menu.url,
                    element: <Navigate to={subMenu.url} />
                });
            }
            userRoutes.push(route);
        });
    });
    return userRoutes;
}
