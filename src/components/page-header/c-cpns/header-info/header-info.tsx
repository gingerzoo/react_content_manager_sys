import React, { memo, useState } from 'react';
import type { FC, ReactNode } from 'react';
import HeaderInfoWrap from './style';
import { useAppSelector } from '@/hooks/hook';
import { clearLoginStorage } from '@/utils/session';

import {
    MailOutlined,
    MessageOutlined,
    SearchOutlined,
    LoginOutlined,
    SolutionOutlined,
    UnlockOutlined
} from '@ant-design/icons';
import { Dropdown, Space } from 'antd';
import type { MenuProps, DropdownProps } from 'antd';

interface Iprops {
    children?: ReactNode;
}

const HeaderInfo: FC<Iprops> = props => {
    const username = useAppSelector(
        state => state.login.userInfo.username
    );
   
    const items: MenuProps['items'] = [
        {
            key: '1',
            label: '退出登录',
            icon: <LoginOutlined />
        },
        {
            type: 'divider'
        },
        {
            key: '2',
            label: '个人信息',
            icon: <SolutionOutlined />
        },
        {
            key: '3',
            label: '修改密码',
            icon: <UnlockOutlined />
        }
    ];
    const handleMenuClick: MenuProps['onClick'] = e => {
        if (e.key === '1') {
            clearLoginStorage();
            window.location.replace('/login');
        }
    };

    return (
        <HeaderInfoWrap>
            <div className='operation'>
                <span className='operation-item'>
                    <MailOutlined />
                </span>
                <span className='operation-item'>
                    <span className='dot'></span>
                    <MessageOutlined />
                </span>
                <span className='operation-item'>
                    <SearchOutlined />
                </span>
            </div>
            <div className='user-info'>
                <img
                    className='avatar-img'
                    src='https://fuss10.elemecdn.com/e/5d/4a731a90594a4af544c0c25941171jpeg.jpeg'
                />
                <Dropdown menu={{ items, onClick: handleMenuClick }}>
                    <Space>{username || '未登录'}</Space>
                </Dropdown>
            </div>
        </HeaderInfoWrap>
    );
};

export default memo(HeaderInfo);
