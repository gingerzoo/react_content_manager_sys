import React, { Children, memo } from 'react';
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
import { useAppSelector } from '@/hooks/hook';
import { flatterMenuMap } from '@/utils/mapMenusToRoutes';
import { useNavigate } from 'react-router-dom';

const iconList = [
    <LaptopOutlined />,
    <SettingOutlined />,
    <CommentOutlined />,
    <ShoppingOutlined />
];

interface Iprops {
    children?: ReactNode;
}

type MenuItem = Required<MenuProps>['items'][number];

const SideMenu: FC<Iprops> = props => {
    const { userMenus } = useAppSelector(state => ({
        userMenus: state.login.userMenus
    }));
    const navigate = useNavigate();
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
        console.log('click ', e);
        const key = +e.key;

        const keyMapRoute = flatterMenuMap(userMenus);
        console.log('映射结果------------', keyMapRoute.get(key));
        navigate(keyMapRoute.get(key));

        /// 要映射路由啦
    };
    return (
        <SideMenuWrap>
            {' '}
            <Menu
                onClick={handleMenuItemClick}
                defaultSelectedKeys={['4']}
                defaultOpenKeys={['1']}
                mode='inline'
                theme='dark'
                items={menuItems}
            />
        </SideMenuWrap>
    );
};

export default memo(SideMenu);
