import React from 'react';
const Goods = React.lazy(() => import('@/pages/main/product/goods/goods'));
export default {
    path: '/main/product/goods',
    element: <Goods />
};
