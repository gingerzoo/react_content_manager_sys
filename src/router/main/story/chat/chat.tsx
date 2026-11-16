import React from 'react';
// 懒加载内容助手页面，只有匹配该路由时才加载页面模块；外层路由负责登录与布局。
const Chat = React.lazy(() => import('@/pages/main/story/chat/chat'));
export default {
    path: '/main/story/chat',
    element: <Chat />
};
