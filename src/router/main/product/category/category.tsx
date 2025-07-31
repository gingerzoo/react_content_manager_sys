import React from 'react';
const Category = React.lazy(() => import('@/pages/main/product/category/category'));
export default {
    path: '/main/product/category',
    element: <Category />
};