import React, { Children, memo, useState, useEffect } from 'react';
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
    }));
    const { isCollapsed } = props;
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const location = useLocation();

    const [openKeys, setOpenKeys] = useState<string[]>([]);

    // 只会执行一次
    // const defaultSelectedKeys = mapPathToMenu(location.pathname, userMenus);

    useEffect(() => {
        console.log('useEffect----');
        const defaultSelectedKeys = mapPathToMenu(location.pathname, userMenus);
        if (defaultSelectedKeys) {
            console.log('难道没进来------');

            dispatch(changeSelectedKeys(defaultSelectedKeys));
            setOpenKeys([defaultSelectedKeys[1]]);
        }
    }, [location.pathname, userMenus]);

    const menuItems: MenuItem[] = userMenus.map((menu, idx) => {
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

    const handleMenuItemClick: MenuProps['onClick'] = e => {
        console.log('click ', e.keyPath);
        const key = +e.key;
        dispatch(changeSelectedKeys(e.keyPath));

        const keyMapRoute = flatterMenuMap(userMenus);
        console.log('映射结果------------', keyMapRoute.get(key));
        navigate(keyMapRoute.get(key));

        /// 要映射路由啦
    };

    const handleOpenChange = (keys: string[]) => {
        setOpenKeys(keys);
    };

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
