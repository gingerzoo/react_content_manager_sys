import React from 'react';
const Chat = React.lazy(() => import('@/pages/main/story/chat/chat'));
export default {
    path: '/main/story/chat',
    element: <Chat />
};
