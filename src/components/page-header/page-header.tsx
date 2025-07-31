import React, { memo, useState } from 'react';
import type { FC, ReactNode } from 'react';
import { Button, Layout, Breadcrumb, theme } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import PageHeaderWrap from './style';
import { mapRouteToBreadCrumb } from '@/utils/mapMenusToRoutes';
import { useLocation } from 'react-router-dom';
import { useAppSelector } from '@/hooks/hook';

interface Iprops {
    children?: ReactNode;
    onCallapsedChange: () => void;
    isCollapsed: Boolean;
}

const PageHeader: FC<Iprops> = props => {
    const { userMenus } = useAppSelector(state => ({
        userMenus: state.login.userMenus
    }));
    const { isCollapsed, onCallapsedChange } = props;
    const { Header } = Layout;
    const loaction = useLocation();

    const {
        token: { colorBgContainer, borderRadiusLG }
    } = theme.useToken();
    const breadcrumb = mapRouteToBreadCrumb(loaction.pathname, userMenus);
    return (
        <PageHeaderWrap>
            <Header style={{ background: colorBgContainer }}>
                <Button
                    type='text'
                    icon={isCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                    onClick={onCallapsedChange}
                    style={{
                        fontSize: '22px',
                        width: 64,
                        height: 64
                    }}
                />
                <Breadcrumb items={breadcrumb} />
            </Header>
        </PageHeaderWrap>
    );
};

export default memo(PageHeader);
