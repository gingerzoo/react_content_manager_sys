import { memo, Suspense, useState, useEffect } from 'react';
import type { FC, ReactNode } from 'react';
import { useAppSelector } from './hooks/hook';
import { useRoutes } from 'react-router-dom';
import { ConfigProvider, App as AntdApp } from 'antd';
import localRoutes from './router/index'; // 静态路由
import { mapMeunsToRoutes } from '@/utils/mapMenusToRoutes';
import type { RouteObject } from 'react-router-dom';
import { shallowEqual } from 'react-redux';
import MessageProvider from '@/components/message-provider/message-provider';

interface Iprops {
    children?: ReactNode;
}

const App: FC<Iprops> = () => {
    const { userMenus } = useAppSelector(state => ({
        userMenus: state.login.userMenus
    }), shallowEqual);
    const [appRoutes, setAppRoutes] = useState<RouteObject[]>([]);

    useEffect(() => {
        const routes = mapMeunsToRoutes(userMenus);
        setAppRoutes([...routes, ...localRoutes]);
    }, [userMenus]);

    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: '#00b96b'
                }
            }}
        >
            <AntdApp>
                <MessageProvider />
                <Suspense fallback={<div>Loading</div>}>{useRoutes(appRoutes)}</Suspense>
            </AntdApp>
        </ConfigProvider>
    );
};

export default memo(App);
