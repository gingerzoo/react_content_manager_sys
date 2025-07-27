import React from 'react';
const Menu = React.lazy(() => import('@/pages/main/system/menu/menu'));
export default {
    path: '/main/system/menu',
    element: <Menu />
};
