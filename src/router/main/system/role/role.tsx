import React from 'react';
const Role = React.lazy(() => import('@/pages/main/system/role/role'));
export default {
    path: '/main/system/role',
    element: <Role />
};
