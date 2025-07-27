import AppRequest from './request';
import { BASE_URL, TIME_OUT } from './config';

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
        }
    }
});

export default lxRequest;
