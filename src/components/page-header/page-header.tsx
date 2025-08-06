import React, { memo, useState } from 'react';
import type { FC, ReactNode } from 'react';
import { Button, Layout, Breadcrumb, theme } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import PageHeaderWrap from './style';
import { mapRouteToBreadCrumb } from '@/utils/mapMenusToRoutes';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/hooks/hook';
import { changeSelectedKeys } from '@/store/modules/main';

interface Iprops {
    children?: ReactNode;
    onCallapsedChange: () => void;
    isCollapsed: Boolean;
}

const PageHeader: FC<Iprops> = props => {
    const { userMenus, selectedKeys } = useAppSelector(state => ({
        userMenus: state.login.userMenus,
        selectedKeys: state.main.selectedKeys
    }));
    const { isCollapsed, onCallapsedChange } = props;
    const { Header } = Layout;
    const loaction = useLocation();
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const [selectedIds, setSelectedIds] = useState<string[]>(selectedKeys);

    const {
        token: { colorBgContainer, borderRadiusLG }
    } = theme.useToken();
    const handleCrumbItemClick = data => {
        if (!data.href) {
            return;
        }
        const parenId = data.id;
        const childId = data.childId;
        localStorage.setItem('selectedKeys', JSON.stringify([childId, parenId]));
        dispatch(changeSelectedKeys([childId, parenId]));
        // navigate(data.href);
    };
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
                <Breadcrumb
                    items={breadcrumb.map(item => ({
                        title: <span onClick={() => handleCrumbItemClick(item)}>{item.title}</span>
                    }))}
                />
            </Header>
        </PageHeaderWrap>
    );
};

export default memo(PageHeader);
