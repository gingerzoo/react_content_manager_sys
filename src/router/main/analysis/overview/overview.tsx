import React from 'react';
const Overview = React.lazy(() => import('@/pages/main/analysis/overview/overview'));
export default {
    path: '/main/analysis/overview',
    element: <Overview />
};
