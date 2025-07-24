import axios from 'axios';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';

// 创建axios实例
const request = axios.create({
  baseURL: '/api',
  timeout: 1000
});

// 请求拦截器
request.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// 响应拦截器
request.interceptors.response.use(
  res => res,
  err => Promise.reject(err)
);

// export default request;

const http = <T = any>(config: AxiosRequestConfig): Promise<T> => {
  return request(config).then((res: AxiosResponse<T>) => res.data);
};

export const get = <T>(url: string, config?: AxiosRequestConfig, params?: any) => {
  return http<T>({ ...config, method: 'GET', url });
};

export const post = <T>(url: string, data?: any, config?: AxiosRequestConfig) => {
  return http<T>({ ...config, method: 'POST', url, data });
};

export default http;
