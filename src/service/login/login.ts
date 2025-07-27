import lxRequest from '..';
import type { Iaccount } from '@/types';

export function getAccountLogin(data: Iaccount) {
    console.log('发送网络请求-----------', data);
    return lxRequest.request({
        method: 'POST',
        url: '/login',
        data
    });
}

// 获取用户信息
export function getUserInfoById(id: number) {
    return lxRequest.request({
        method: 'get',
        url: `/users/${id}`
    });
}

// 获取用户的角色
export function getMenusByRoleId(id: number) {
    return lxRequest.request({
        method: 'get',
        url: `/role/${id}/menu`
    });
}
