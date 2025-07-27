import React from 'react';
const Category = React.lazy(() => import('@/pages/main/product/category/category'));
export default {
    path: '/main/product/category',
    element: <Category />
};

// const category = () => import('@/views/main/product/category/category.vue');
// export default {
//     path: '/main/product/category',
//     name: 'category',
//     component: category,
//     children: []
// };
