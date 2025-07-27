import React from 'react';
const Department = React.lazy(() => import('@/pages/main/system/department/department'));
export default {
    path: '/main/system/department',
    element: <Department />
};
