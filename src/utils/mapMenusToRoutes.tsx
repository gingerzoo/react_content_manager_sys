import React from 'react';
import type { RouteObject } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
const Main = React.lazy(() => import('@/pages/main/index'));
export function loadLocalRoutes(): RouteObject[] {
    // eager: true 的作用是一次性同步加载所有模块
    const modules = import.meta.glob('../router/main/**/*.tsx', { eager: true });
    // const routeModules = Object.values(m)
    const routeModules = Object.values(modules).map((mod: any) => mod.default);

    return routeModules;
}

// 通过用户菜单拿到动态路由
export function mapMeunsToRoutes(userMenus: any[]) {
    const localRoutes = loadLocalRoutes();
    const childrenRoutes: RouteObject[] = [];

    userMenus.forEach(menu => {
        // menu.children.forEach(subMenu => {
        //     const route = localRoutes.find(route => route.path === subMenu.url);

        //     // 给一级菜单一个重定向！！！
        //     if (route && !userRoutes.find(route => route.path === menu.url)) {
        //         userRoutes.push({
        //             path: menu.url,
        //             element: <Navigate to={subMenu.url} />
        //         });
        //     }
        //     userRoutes.push(route);
        // });

        if (menu.children && menu.children.length) {
            childrenRoutes.push({
                path: menu.url.replace('/main/', ''),
                element: <Navigate to={menu.children[0].url} />
            });

            menu.children.forEach(subMenu => {
                const matchedRoute = localRoutes.find(route => route.path === subMenu.url);
                if (matchedRoute) {
                    childrenRoutes.push({
                        path: subMenu.url.replace('/main/', ''),
                        element: matchedRoute.element
                    });
                }
            });
        }
    });
    return [
        {
            path: '/main',
            element: <Main />,
            children: childrenRoutes
        }
    ];
}

// 通过用户菜单拿到响应的路由映射
export function flatterMenuMap(userMenus: any[]) {
    const map = new Map();
    userMenus.forEach(menu => {
        map.set(menu.id, menu.url);
        if (menu.children) {
            menu.children.forEach(subMenu => {
                map.set(subMenu.id, subMenu.url);
            });
        }
    });
    return map;
}
