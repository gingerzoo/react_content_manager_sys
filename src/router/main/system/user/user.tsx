import React from 'react';
const User = React.lazy(() => import('@/pages/main/system/user/user'));
export default {
    path: '/main/system/user',
    element: <User />
};
