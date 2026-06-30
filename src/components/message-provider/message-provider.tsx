import { App } from 'antd';
import { useEffect } from 'react';
import { setMessageApi } from '@/utils/message';

const MessageProvider = () => {
    const { message } = App.useApp();
    useEffect(() => {
        setMessageApi(message);
    }, [message]);
    return null;
};

export default MessageProvider;
