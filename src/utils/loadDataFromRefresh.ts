import store from '@/store/index';
import { getCurrentUserInfo, getCurrentUserMenus } from '@/service/login/login';
import {
    changeUserMenusAction,
    changeUserInfoAction,
    changeUserTokenAction
} from '@/store/modules/login';

/**
 * 先恢复本地缓存，再向服务器同步本人角色和菜单，避免持续使用旧权限。
 * @returns {void} 后台同步自行处理失败，不阻塞 React 首次渲染。
 */
export default function loadDataFromRefresh() {
    const token = localStorage.getItem('token') || '';
    if (!token) return;
    try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        const userMenus = JSON.parse(localStorage.getItem('userMenus') || '[]');
        store.dispatch(changeUserTokenAction(token));
        if (Array.isArray(userMenus)) store.dispatch(changeUserMenusAction(userMenus));
        if (userInfo && typeof userInfo === 'object' && !Array.isArray(userInfo))
            store.dispatch(changeUserInfoAction(userInfo));
    } catch {
        // 缓存损坏时仍可通过已保存的 token 恢复权威资料。
    }

    void Promise.all([getCurrentUserInfo(), getCurrentUserMenus()])
        .then(([user, menus]) => {
            // 防止旧账号的慢请求覆盖后来登录账号的数据。
            if (localStorage.getItem('token') !== token) return;
            if (user.code !== 200 || !user.data || menus.code !== 200 || !Array.isArray(menus.data))
                return;
            store.dispatch(changeUserInfoAction(user.data));
            store.dispatch(changeUserMenusAction(menus.data));
            localStorage.setItem('userInfo', JSON.stringify(user.data));
            localStorage.setItem('userMenus', JSON.stringify(menus.data));
        })
        .catch(() => {
            // 401 由统一拦截器处理；临时网络失败保留缓存，实际接口仍由后端鉴权。
        });
}
