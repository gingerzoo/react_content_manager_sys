import type { RouteObject } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import React from 'react';

// 使用懒加载
const Login = React.lazy(() => import('@/pages/login/login'));
const NoContent = React.lazy(() => import('@/pages/no-content/index'))

// vue是path和component
const localRoutes: RouteObject[] = [
    {
        path: '/',
        element: <Navigate to='/main' />
    },
    {
        path: '/login',
        element: <Login />
    },
    {
        path: '*',
        element: <NoContent />
    }
];

export default localRoutes;
