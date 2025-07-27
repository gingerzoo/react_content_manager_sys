import { memo, Suspense } from 'react';
import type { FC, ReactNode } from 'react';
import { useAppSelector, useAppDispatch } from './hooks/hook';
import { addCountAction } from './store/modules/main';
import { useRoutes } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import localRoutes from './router/index'; // 静态路由
import { mapMeunsToRoutes } from '@/utils/mapMenusToRoutes';

interface Iprops {
    children?: ReactNode;
}

const App: FC<Iprops> = props => {
    const { userMenus } = useAppSelector(state => ({
        userMenus: state.login.userMenus
    }));
    const dispatch = useAppDispatch();
    const dynamicRoutes = mapMeunsToRoutes(userMenus);
    const appRoutes = [...dynamicRoutes, ...localRoutes];

    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: '#00b96b'
                }
            }}
        >
            <Suspense fallback={<div>Loading</div>}>{useRoutes(appRoutes)}</Suspense>
        </ConfigProvider>
    );
};

export default memo(App);
