import React, { memo } from 'react';
import type { FC, ReactNode } from 'react';
import { useAppSelector } from '@/hooks/hook';

interface Iprops {
    children?: ReactNode;
}

const Main: FC<Iprops> = props => {
    // const { userMenus } = useAppSelector(state => ({
    //     userMenus: state.login.userMenus
    // }));
    const userMenus = JSON.parse(localStorage.getItem('userMenus') ?? '[]');
    console.log('userMenus-----------', userMenus);
    return (
        <div>
            {userMenus?.map(item => {
                return (
                    <div key={item.id}>
                        <h1>{item?.name}</h1>
                        {item?.children?.map(subItem => {
                            return <div key={subItem.id}>{subItem.name}</div>;
                        })}
                    </div>
                );
            })}
        </div>
    );
};

export default memo(Main);
