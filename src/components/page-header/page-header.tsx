import React, { memo, useCallback, useState } from 'react';
import type { FC, ReactNode } from 'react';
import { Button, Layout, Breadcrumb, theme } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import PageHeaderWrap from './style';
import { mapRouteToBreadCrumb } from '@/utils/mapMenusToRoutes';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/hooks/hook';
import { changeSelectedKeys } from '@/store/modules/main';
import { shallowEqual } from 'react-redux';

interface Iprops {
    children?: ReactNode;
    onCallapsedChange: () => void;
    isCollapsed: Boolean;
}

const PageHeader: FC<Iprops> = props => {
    const { userMenus, selectedKeys } = useAppSelector(state => ({
        userMenus: state.login.userMenus,
        selectedKeys: state.main.selectedKeys
    }), shallowEqual);
    const { isCollapsed, onCallapsedChange } = props;
    const { Header } = Layout;
    const loaction = useLocation();
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const {
        token: { colorBgContainer, borderRadiusLG }
    } = theme.useToken();

    // 优化
    const handleCrumbItemClick = useCallback(data => {
        if (!data.href) {
            return;
        }
        const parenId = data.id;
        const childId = data.childId;
        // localStorage.setItem('selectedKeys', JSON.stringify([childId, parenId]));
        dispatch(changeSelectedKeys([childId, parenId]));
    }, [dispatch]);
    const breadcrumb = mapRouteToBreadCrumb(loaction.pathname, userMenus, handleCrumbItemClick);
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
                {
                    breadcrumb.length > 0 && (<Breadcrumb
                        items={breadcrumb.map(item => ({
                            title: <span onClick={() => handleCrumbItemClick(item)}>{item.title}</span>
                        }))}
                    />)
                }
            </Header>
        </PageHeaderWrap>
    );
};

export default memo(PageHeader);
