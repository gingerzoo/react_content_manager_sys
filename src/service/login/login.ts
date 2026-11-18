import lxRequest from '..';
import type { Iaccount } from '@/types';

/**
 * 提交公开注册；只发送账号密码，确认密码仅用于前端一致性校验。
 * @param {Iaccount} data - 用户名与密码。
 * @returns {Promise<{code: number; message: string; data?: {id: number; username: string}}>}
 * 注册结果；HTTP 错误通过 Promise 拒绝传播。
 */
export function registerAccount(data: Iaccount) {
    return lxRequest.request<{
        code: number;
        message: string;
        data?: { id: number; username: string };
    }>({ method: 'POST', url: '/register', data });
}

export function getAccountLogin(data: Iaccount) {
    return lxRequest.request({
        method: 'POST',
        url: '/login',
        data
    });
}

// 获取用户信息
/**
 * 获取 token 所属账号的最新资料，用于刷新后同步管理权限。
 * @returns {Promise<object>} 包含当前账号信息的业务响应。
 */
export function getCurrentUserInfo() {
    return lxRequest.request({ method: 'GET', url: '/user/me' });
}

export function getUserInfoById(id: number) {
    return lxRequest.request({
        method: 'GET',
        url: `/user/${id}`
    });
}

// 获取用户的角色
export function getCurrentUserMenus() {
    return lxRequest.request({
        method: 'GET',
        url: `/user/me/menus`
    });
}
