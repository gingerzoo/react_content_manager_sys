import React from 'react';
const Dashboard = React.lazy(() => import('@/pages/main/analysis/dashboard/dashboard'));
export default {
    path: '/main/analysis/dashboard',
    element: <Dashboard />
};
