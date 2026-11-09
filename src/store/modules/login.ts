import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getAccountLogin, getUserInfoById, getCurrentUserMenus } from '@/service/login/login';
import type { Iaccount } from '@/types';
import axios from 'axios';
import { clearLoginStorage } from '@/utils/session';

const initialState = {
    token: localStorage.getItem('token') ?? '',
    userInfo: {},
    userMenus: []
};

// 登录的异步action
export const fetchLoginAction = createAsyncThunk(
    'login/fetchLogin',
    async (data: Iaccount, { dispatch, rejectWithValue  }) => {
        try {
            const loginRes = await getAccountLogin(data);
            if (loginRes.code !== 200 || !loginRes.data?.token) {
                throw new Error(loginRes.message || '登录失败，未获取到 token');
            }

            const loginData = loginRes.data;

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
        } catch (error: unknown) {
           clearLoginStorage();

            dispatch(changeUserTokenAction(''));
            dispatch(changeUserInfoAction({}));
            dispatch(changeUserMenusAction([]));

            // 让 thunk 进入 rejected，页面的 unwrap() 才能感知失败。
            let errorMessage = '登录失败，请稍后重试';

            if (axios.isAxiosError(error)) {
                const status = error.response?.status;
                const serverMessage = error.response?.data?.message;

                if (
                    error.code === 'ECONNABORTED' ||
                    error.code === 'ETIMEDOUT'
                ) {
                    errorMessage = '请求超时，请稍后重试';
                } else if (!error.response) {
                    errorMessage = '无法连接服务，请检查网络或稍后重试';
                } else if (status !== undefined && status >= 500) {
                    errorMessage = '服务暂时不可用，请稍后重试';
                } else if (
                    typeof serverMessage === 'string' &&
                    serverMessage.trim()
                ) {
                    errorMessage = serverMessage;
                }
            } else if (error instanceof Error) {
                errorMessage = error.message || errorMessage;
            }

            return rejectWithValue(errorMessage);
                        
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
