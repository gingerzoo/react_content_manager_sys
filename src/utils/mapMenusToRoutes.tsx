import React from 'react';
import type { RouteObject } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import AuthRouter from '@/router/authRouter/authRouter';

interface Ibreadcrumb {
    title: string;
    href?: string;
    id?: string;
    childId?: string;
    onClick?: () => void;
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
    let firstPath = '';

    if (userMenus.length && userMenus[0].children.length) {
        const firstChildPath = userMenus[0].children[0].url.replace('/main/', '');

        // 在 childrenRoutes 前面加一个重定向
        childrenRoutes.push({
            path: '', // 等同于 path: ''
            element: <Navigate to={firstChildPath} replace />
        });
    }

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

            element: (
                <AuthRouter>
                    <Main />
                </AuthRouter>
            ),
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
export function mapRouteToBreadCrumb(
    curPath: string,
    userMenus: any,
    onCrumbItemClick: (id: any) => void
) {
    const breadcrumb: Ibreadcrumb[] = [];
    for (const menu of userMenus) {
        for (const subMenu of menu.children) {
            if (subMenu.url === curPath) {
                // 先存储上一级路由
                breadcrumb.push({
                    title: menu.name,
                    href: menu.url,
                    id: menu.id + '',
                    childId: menu.children[0].id + ''
                    // onClick: () => {
                    //     onCrumbItemClick(menu);
                    // }
                });
                breadcrumb.push({
                    title: subMenu.name
                });

                return breadcrumb;
            }
        }
    }
    return breadcrumb;
}

// 通过路由拿到菜单对应的id
export function mapPathToMenu(path, userMenus: any[]) {
    for (const menu of userMenus) {
        for (const subMenu of menu.children) {
            if (subMenu.url === path) {
                return [subMenu.id + '', menu.id + ''];
            }
        }
    }
    return [];
}
