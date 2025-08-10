import React, { memo, useState, useEffect } from 'react';
import type { FC, ReactNode } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/hook';
import { Layout, theme } from 'antd';
import MainWrap from './style';
import SideMenu from '@/components/side-menu/side-menu';
import PageHeader from '@/components/page-header/page-header';
import { Outlet } from 'react-router-dom';
import { fetchPageEntriesAction } from '@/store/modules/main/main';

interface Iprops {
    children?: ReactNode;
}

const Main: FC<Iprops> = props => {
    const { Sider, Content } = Layout;
    const [collapsed, setCollapsed] = useState(false);
    const dispatch = useAppDispatch();
    useEffect(() => {
        dispatch(fetchPageEntriesAction());
    }, [dispatch]);
    // const {
    //     token: { colorBgContainer, borderRadiusLG }
    // } = theme.useToken();
    const userMenus = JSON.parse(localStorage.getItem('userMenus') ?? '[]');

    const handleCollapsedBtnClick = () => {
        setCollapsed(!collapsed);
    };
    return (
        <MainWrap>
            <Layout>
                <Sider width={250} trigger={null} collapsible collapsed={collapsed}>
                    <div className='demo-logo-vertical' />
                    <SideMenu isCollapsed={collapsed} />
                </Sider>
                <Layout style={{ display: 'flex', flexDirection: 'column' }}>
                    <PageHeader
                        isCollapsed={collapsed}
                        onCallapsedChange={handleCollapsedBtnClick}
                    />

                    <Content
                        style={{
                            margin: '24px',
                            flex: 1,
                            overflow: 'auto'
                        }}
                    >
                        <Outlet />
                    </Content>
                </Layout>
            </Layout>
        </MainWrap>
    );
};

export default memo(Main);
