import React, { Children, memo, useState, useEffect, useMemo, useCallback } from 'react';
import type { FC, ReactNode } from 'react';
import type { MenuProps } from 'antd';
import { Menu } from 'antd';

import {
    LaptopOutlined,
    SettingOutlined,
    CommentOutlined,
    ShoppingOutlined
} from '@ant-design/icons';
import SideMenuWrap from './style';
import { useAppSelector, useAppDispatch } from '@/hooks/hook';
import { flatterMenuMap, mapPathToMenu } from '@/utils/mapMenusToRoutes';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '@/assets/img/logo.svg';
import { changeSelectedKeys } from '@/store/modules/main';
import { shallowEqual } from 'react-redux';

const iconList = [
    <LaptopOutlined />,
    <SettingOutlined />,
    <CommentOutlined />,
    <ShoppingOutlined />
];

interface Iprops {
    children?: ReactNode;
    isCollapsed: Boolean;
}

type MenuItem = Required<MenuProps>['items'][number];

const SideMenu: FC<Iprops> = props => {
    const { userMenus, selectedKeys } = useAppSelector(state => ({
        userMenus: state.login.userMenus,
        selectedKeys: state.main.selectedKeys
    }), shallowEqual);
    const { isCollapsed } = props;
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const location = useLocation();

    const [openKeys, setOpenKeys] = useState<string[]>([]);

     // 缓存 keyMapRoute 结果
     const keyMapRoute = useMemo(() => flatterMenuMap(userMenus), [userMenus]);


    useEffect(() => {
        const defaultSelectedKeys = mapPathToMenu(location.pathname, userMenus);
        if (defaultSelectedKeys) {

            dispatch(changeSelectedKeys(defaultSelectedKeys));
            setOpenKeys([defaultSelectedKeys[1]]);
        }
    }, [location.pathname, userMenus, dispatch]);

    // 监听selectedKeys变化
    useEffect(() => {
        if(selectedKeys && selectedKeys.length) {
            const key = +selectedKeys[0];
            const route = keyMapRoute.get(key);
            route && navigate(route);
        }
    }, [selectedKeys, keyMapRoute, dispatch]);

    // 优化点： 使用useMemo包裹这个menuItems
    const menuItems: MenuItem[] = useMemo(() => {
        return userMenus.map((menu, idx) => {
            const children = menu.children.map(subMenu => {
                return {
                    key: subMenu.id + '',
                    label: subMenu.name,
                    url: subMenu.url
                };
            });
            return {
                key: menu.id + '',
                label: menu.name,
                icon: iconList[idx],
                url: menu.url,
                children
            };
        });
    }, [userMenus]);

    const handleMenuItemClick: MenuProps['onClick'] = useCallback(e => {
        dispatch(changeSelectedKeys(e.keyPath));
    }, [dispatch])

    const handleOpenChange = useCallback((keys: string[]) => {
        setOpenKeys(keys);
    }, []);

    return (
        <SideMenuWrap>
            <div className='menu-title'>
                <img src={logo} className='menu-img' />
                {!isCollapsed && <span className='title-text'>贝卡管理系统</span>}
            </div>
            <Menu
                onClick={handleMenuItemClick}
                // defaultOpenKeys={[defaultSelectedKeys[1]]}
                selectedKeys={selectedKeys}
                openKeys={openKeys}
                onOpenChange={handleOpenChange}
                mode='inline'
                theme='dark'
                items={menuItems}
            />
        </SideMenuWrap>
    );
};

export default memo(SideMenu);
