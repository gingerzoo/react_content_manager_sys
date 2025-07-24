import type { RouteObject } from 'react-router-dom';
import React from 'react';

// 使用懒加载
const Main = React.lazy(() => import('@/pages/main'));

// vue是path和component
const routes: RouteObject[] = [
  {
    path: '/main',
    element: <Main />
  }
];

export default routes;
