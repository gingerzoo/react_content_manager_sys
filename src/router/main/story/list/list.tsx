import React from 'react';
const List = React.lazy(() => import('@/pages/main/story/list/list'));
export default {
    path: '/main/story/list',
    element: <List />
};
