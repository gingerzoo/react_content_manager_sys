import store from '@/store/index';
import {
    changeUserMenusAction,
    changeUserInfoAction,
    changeUserTokenAction
} from '@/store/modules/login';

export default function loadDataFromRefresh() {
    const token = localStorage.getItem('token') || '';
    const userInfoStr = localStorage.getItem('userInfo');
    const userInfo = (userInfoStr && userInfoStr !== 'undefined') ? JSON.parse(userInfoStr) : {};
    const userMenus = JSON.parse(localStorage.getItem('userMenus') || '[]');
    if (token && userInfo && userMenus) {
        store.dispatch(changeUserTokenAction(token));
        store.dispatch(changeUserMenusAction(userMenus));
        store.dispatch(changeUserInfoAction(userInfo));
    }
}
