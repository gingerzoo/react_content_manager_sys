import axios from 'axios';
import type {
    AxiosInstance,
    AxiosRequestConfig,
    AxiosResponse,
    InternalAxiosRequestConfig
} from 'axios';

// 实例拦截器接收 Axios 内部请求配置和原始响应对象。
interface InstanceRequestConfig extends AxiosRequestConfig {
    interceptors?: {
        requestSuccessFn?: (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig;
        requestFailureFn?: (err: any) => any;
        responseSuccessFn?: (res: AxiosResponse) => AxiosResponse;
        responseFailureFn?: (err: any) => any;
    };
}
// 单次请求的响应回调在 res.data 解包后执行，因此接收业务数据 T。
interface lxRequestConfig<T = any> extends AxiosRequestConfig {
    interceptors?: {
        requestSuccessFn?: (config: lxRequestConfig<T>) => lxRequestConfig<T>;
        responseSuccessFn?: (data: T) => T;
    };
}

class AppRequest {
    instance: AxiosInstance;
    constructor(config: InstanceRequestConfig) {
        this.instance = axios.create(config);

        // 全局请求拦截器
        this.instance.interceptors.request.use(
            config => {
                // 可以在这里写一些全局请求成功的拦截
                return config;
            },
            err => {
                // console.log('全局请求失败的拦截');
                return Promise.reject(err);
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
        // 响应按注册顺序执行：处理原始响应后，再统一取出业务数据。
        this.instance.interceptors.response.use(
            res => res.data,
            err => Promise.reject(err)
        );
    }

    /**
     * 发送请求，返回已从 Axios 响应中取出的业务数据。
     *
     * @template T - 业务响应数据类型。
     * @param {lxRequestConfig<T>} config - 请求配置及可选的单次请求回调。
     * @returns {Promise<T>} 业务数据；请求失败时保持 Promise 拒绝状态。
     */
    async request<T = any>(config: lxRequestConfig<T>): Promise<T> {
        const requestConfig = config.interceptors?.requestSuccessFn
            ? config.interceptors.requestSuccessFn(config)
            : config;

        const data = await this.instance.request<unknown, T>(requestConfig);

        if (config.interceptors?.responseSuccessFn) {
            return config.interceptors.responseSuccessFn(data);
        }

        return data;
    }
}

export default AppRequest;
