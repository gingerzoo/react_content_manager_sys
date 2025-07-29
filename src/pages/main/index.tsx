import React, { memo, useState } from 'react';
import type { FC, ReactNode } from 'react';
import { useAppSelector } from '@/hooks/hook';
import {
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    UploadOutlined,
    UserOutlined,
    VideoCameraOutlined
} from '@ant-design/icons';
import { Button, Layout, Menu, theme } from 'antd';
import MainWrap from './style';
import SideMenu from '@/components/side-menu/side-menu';
import { Outlet } from 'react-router-dom';

interface Iprops {
    children?: ReactNode;
}

const Main: FC<Iprops> = props => {
    // const { userMenus } = useAppSelector(state => ({
    //     userMenus: state.login.userMenus
    // }));
    const { Header, Sider, Content } = Layout;
    const [collapsed, setCollapsed] = useState(false);
    const {
        token: { colorBgContainer, borderRadiusLG }
    } = theme.useToken();
    const userMenus = JSON.parse(localStorage.getItem('userMenus') ?? '[]');
    return (
        <MainWrap>
            <Layout>
                <Sider width={250} trigger={null} collapsible collapsed={collapsed}>
                    <div className='demo-logo-vertical' />
                    <SideMenu />
                </Sider>
                <Layout>
                    <Header style={{ padding: 0, background: colorBgContainer }}>
                        <Button
                            type='text'
                            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                            onClick={() => setCollapsed(!collapsed)}
                            style={{
                                fontSize: '16px',
                                width: 64,
                                height: 64
                            }}
                        />
                    </Header>
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
