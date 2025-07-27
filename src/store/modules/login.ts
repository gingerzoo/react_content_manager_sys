import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getAccountLogin, getUserInfoById, getMenusByRoleId } from '@/service/login/login';
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

            const loginData = loginRes.data;
            console.log('登录接口拿到的数据---------', loginData);

            dispatch(changeUserTokenAction(loginData.token));
            localStorage.setItem('token', loginData.token);

            const userInfo = await getUserInfoById(loginData.id);
            dispatch(changeUserInfoAction(userInfo.data));

            console.log('拿到用户信息---------', userInfo.data);

            const userMenus = await getMenusByRoleId(loginData.id);
            console.log('拿到用列表---------', userMenus);
            dispatch(changeUserMenusAction(userMenus.data));
            // loadLocalRoutes();
            // mapMeunsToRoutes(userMenus.data);

            // 用户信息本地存储
            localStorage.setItem('userInfo', JSON.stringify(userInfo.data));
            localStorage.setItem('userMenus', JSON.stringify(userMenus.data));

            // return res.data;
        } catch (err) {
            console.log('login接口请求失败', err);
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
