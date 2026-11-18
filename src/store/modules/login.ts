import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getAccountLogin, getUserInfoById, getCurrentUserMenus } from '@/service/login/login';
import type { Iaccount } from '@/types';
import axios from 'axios';
import { clearLoginStorage } from '@/utils/session';
import type { PayloadAction } from '@reduxjs/toolkit';

/**
 * 当前登录用户的基本信息。
 * 初始和退出登录时使用空对象，因此字段允许暂时缺省。
 */
interface LoginUserInfo {
    id?: number;
    username?: string;
    realname?: string;
    cellphone?: string;
    enable?: number;
    roleId?: number | null;
    departmentId?: number | null;
}

/**
 * 服务端返回的菜单节点。
 * 叶子菜单可以不包含 children。
 */
interface LoginMenu {
    id: number;
    name: string;
    url: string;
    parent_id?: number | null;
    children?: LoginMenu[];
}

export interface LoginState {
    token: string;
    userInfo: LoginUserInfo;
    userMenus: LoginMenu[];
}

const initialState: LoginState = {
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
        changeUserTokenAction(state, action: PayloadAction<string>) {
            state.token = action.payload;
        },
        changeUserInfoAction(state, action: PayloadAction<LoginUserInfo>) {
            state.userInfo = action.payload;
        },
        changeUserMenusAction(state, action: PayloadAction<LoginMenu[]>) {
            state.userMenus = action.payload;
        }
    }
});

export const { changeUserTokenAction, changeUserInfoAction, changeUserMenusAction } =
    loginStore.actions;
export default loginStore.reducer;
