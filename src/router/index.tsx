import type { RouteObject } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import React from 'react';
import AuthRouter from './authRouter/authRouter';
import { useAppSelector } from '@/hooks/hook';

// 使用懒加载
const Main = React.lazy(() => import('@/pages/main/index'));
const Login = React.lazy(() => import('@/pages/login/login'));

// const { userMenus } = useAppSelector(state => ({
//     userMenus: state.login.userMenus
// }));
// 动态路由加载
// const dynamicRoutes = mapMeunsToRoutes(userMenus);

// vue是path和component
const localRoutes: RouteObject[] = [
    {
        path: '/',
        element: <Navigate to='/main' />
    },
    {
        path: '/main',
        element: (
            <AuthRouter>
                <Main />
            </AuthRouter>
        )
    },
    {
        path: '/login',
        element: <Login />
    }
];

console.log('routes---------', localRoutes);

export default localRoutes;
