import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

interface lxRequestConfig extends AxiosRequestConfig {
    // 可以针对特定axios实例添加拦截器
    interceptors?: {
        requestSuccessFn?: (config: AxiosRequestConfig) => AxiosRequestConfig;
        requestFailureFn?: (err: any) => any;
        responseSuccessFn?: (res: AxiosResponse) => AxiosResponse;
        responseFailureFn?: (err: any) => any;
    };
}
class AppRequest {
    instance: AxiosInstance;
    constructor(config: lxRequestConfig) {
        this.instance = axios.create(config);

        // 全局请求拦截器
        this.instance.interceptors.request.use(
            config => {
                // 可以在这里写一些全局请求成功的拦截
                return config;
            },
            err => {
                // console.log('全局请求失败的拦截');
                return err;
            }
        );

        // 全局响应拦截器
        this.instance.interceptors.response.use(
            res => {
                return res.data;
            },
            err => {
                return err;
            }
        );

        // 针对特定的实例添加拦截器
        if (config.interceptors) {
            this.instance.interceptors.request.use(
                config.interceptors.requestSuccessFn,
                config.interceptors.requestFailureFn
            );
            this.instance.interceptors.response.use(
                config.interceptors.responseSuccessFn,
                config.interceptors.responseFailureFn
            );
        }
    }

    //封装网络请求的方法
    request<T = any>(config: lxRequestConfig) {
        // 更更精细化的控制===拦截器
        if (config?.interceptors) {
            config.interceptors.requestSuccessFn(config);
        }
        return new Promise<T>((resolve, reject) => {
            this.instance
                .request<any, T>(config)
                .then(res => {
                    // 单次请求的响应拦截器
                    if (config.interceptors?.responseSuccessFn) {
                        res = config.interceptors.responseSuccessFn(res);
                    }
                    resolve(res);
                })
                .catch(err => {
                    reject(err);
                });
        });
    }
}

export default AppRequest;
