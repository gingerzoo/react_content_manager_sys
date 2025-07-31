import React, { memo, useState } from 'react';
import type { FC, ReactNode } from 'react';
import { useAppSelector } from '@/hooks/hook';
import { Layout, theme } from 'antd';
import MainWrap from './style';
import SideMenu from '@/components/side-menu/side-menu';
import PageHeader from '@/components/page-header/page-header';
import { Outlet } from 'react-router-dom';

interface Iprops {
    children?: ReactNode;
}

const Main: FC<Iprops> = props => {
    const { Sider, Content } = Layout;
    const [collapsed, setCollapsed] = useState(false);
    const {
        token: { colorBgContainer, borderRadiusLG }
    } = theme.useToken();
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
                <Layout>
                    <PageHeader
                        isCollapsed={collapsed}
                        onCallapsedChange={handleCollapsedBtnClick}
                    />

                    <Content
                        style={{
                            margin: '24px 16px',
                            padding: 24,
                            minHeight: 280,
                            background: colorBgContainer,
                            borderRadius: borderRadiusLG
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
