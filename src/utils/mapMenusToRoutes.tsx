import React from 'react';
import type { RouteObject } from 'react-router-dom';
import { Navigate } from 'react-router-dom';

interface Ibreadcrumb {
    title: string;
    href: string;
}
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

// 将动态路由映射到面包屑
export function mapRouteToBreadCrumb(curPath: string, userMenus: any) {
    const breadcrumb: Ibreadcrumb[] = [];
    for (const menu of userMenus) {
        for (const subMenu of menu.children) {
            if (subMenu.url === curPath) {
                // 先存储上一级路由
                breadcrumb.push({
                    title: menu.name,
                    href: menu.url
                });
                breadcrumb.push({
                    title: subMenu.name,
                    href: subMenu.url
                });

                return breadcrumb;
            }
        }
    }
    return breadcrumb;
}
