import AppRequest from './request';
import axios from 'axios';
import { BASE_URL, TIME_OUT } from './config';
import { clearLoginStorage } from '@/utils/session';


// 多个请求同时返回 401 时，只执行一次跳转。
let redirectingToLogin = false;

const lxRequest = new AppRequest({
    baseURL: BASE_URL,
    timeout: TIME_OUT,
    interceptors: {
        requestSuccessFn: config => {
            const token = localStorage.getItem('token');
            if (config.headers && token) {
                // 每一个请求都自动携带token Bearer后面有一个空格！
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        responseFailureFn: (error: unknown) => {
            if (axios.isAxiosError(error)) {
                const status = error.response?.status;
                // 判断失败的是不是登录接口请求
                const isLoginRequest =
                    error.config?.url === '/login';
                // 判断浏览器当前是不是已经在登录页面
                const isOnLoginPage =
                    window.location.pathname === '/login';

                const currentToken =
                    localStorage.getItem('token');

                const requestToken =
                    error.config?.headers?.Authorization;

                // 防止旧请求的 401 清除后来登录得到的新 token。
                const belongsToCurrentSession = currentToken
                    ? requestToken === `Bearer ${currentToken}`
                    : true;

                if (
                    status === 401 &&
                    !isLoginRequest &&
                    !isOnLoginPage &&
                    belongsToCurrentSession &&
                    !redirectingToLogin
                ) {
                    redirectingToLogin = true;
                    clearLoginStorage();

                    window.location.replace('/login');
                }
            }

            // 保持失败状态，让调用方的 catch / unwrap 正常工作。
            return Promise.reject(error);
        }
    }
});

export default lxRequest;
