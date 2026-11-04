import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getAccountLogin, getUserInfoById, getCurrentUserMenus } from '@/service/login/login';
import type { Iaccount } from '@/types';

const initialState = {
    token: localStorage.getItem('token') ?? '',
    userInfo: {},
    userMenus: []
};

// 登录的异步action
export const fetchLoginAction = createAsyncThunk(
    'login/fetchLogin',
    async (data: Iaccount, { dispatch }) => {
        try {
            const loginRes = await getAccountLogin(data);
            if (loginRes.code !== 200 || !loginRes.data?.token) {
                throw new Error(loginRes.message || '登录失败，未获取到 token');
            }

            const loginData = loginRes.data;

            

            console.log('登录接口拿到的数据---------', loginData);

            dispatch(changeUserTokenAction(loginData.token));
            localStorage.setItem('token', loginData.token);
            const userInfoRes = await getUserInfoById(loginData.id);

            if (userInfoRes.code !== 200 || !userInfoRes.data) {
                throw new Error(userInfoRes.message || '获取用户信息失败');
            }

            const userInfo = userInfoRes.data;
            dispatch(changeUserInfoAction(userInfo));

            console.log('拿到用户信息---------', userInfo.data);

            const roleId = userInfo.roleId;

            if (roleId === undefined || roleId === null) {
                throw new Error('用户未配置角色');
            }

            const menusRes = await getCurrentUserMenus();

            if (menusRes.code !== 200 || !Array.isArray(menusRes.data)) {
                throw new Error(menusRes.message || '获取菜单失败');
            }

            dispatch(changeUserMenusAction(menusRes.data));

            // 用户信息本地存储
            localStorage.setItem('userInfo', JSON.stringify(userInfo));
            localStorage.setItem('userMenus', JSON.stringify(menusRes.data));

            // return res.data;
        } catch (err) {
            console.log('登录流程失败', err);
        }
    }
);

const loginStore = createSlice({
    name: 'login',
    initialState,
    reducers: {
        changeUserTokenAction(state, action: any) {
            state.token = action.payload;
        },
        changeUserInfoAction(state, action: any) {
            state.userInfo = action.payload;
        },
        changeUserMenusAction(state, action: any) {
            state.userMenus = action.payload;
        }
    }
});

export const { changeUserTokenAction, changeUserInfoAction, changeUserMenusAction } =
    loginStore.actions;
export default loginStore.reducer;
