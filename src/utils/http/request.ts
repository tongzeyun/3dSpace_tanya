
import axios from "axios";
// import { createSignPackage } from "@/utils/common"
import type { AxiosResponse, AxiosInstance } from "axios";
import router from '@/router/index';
import { useUserStore } from "@/store/userInfo";

const path = '/api'

// 创建一个新的axios实例
const instance: AxiosInstance = axios.create({
  //@ts-ignore
  baseURL: import.meta.env.VITE_API_BASEURL + path,
  //请求头
  // headers: {'Authorization':`Bearer ${token}`},
  //超时
  timeout: 100000,
});
// console.log(import.meta.env.VITE_API_BASEURL)

// 无感刷新相关状态与方法
let isRefreshing = false;
let refreshSubscribers: ((token: string | null) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string | null) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string | null) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

async function refreshTokenRequest(): Promise<string> {
  // const refreshToken = sessionStorage.getItem("refreshToken") || "";
  const userStore = useUserStore();
  const refreshToken = userStore.refreshToken;
  // 使用原生 axios 绕过拦截器，避免死循环
  const res :any= await axios.post(
    import.meta.env.VITE_API_BASEURL + path + "/users/token/refresh/",
    { refresh: refreshToken },
    { timeout: 10000 }
  );
  // console.log(res)
  // 假设返回结构：{ code: 200, data: { token: 'newToken', refreshToken: 'newRefresh' } }
  if (res.data && res.status === 200) {
    // 如果服务返回新的 refreshToken，一并保存
    if (res.data.refresh) {
      userStore.refreshToken = res.data.refresh;
      // sessionStorage.setItem("refreshToken", res.data.data.refreshToken);
    }
    return res.data.access as string;
  }
  return Promise.reject(res.data);
}

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    // const userToken: any = sessionStorage.getItem("token") ? sessionStorage.getItem("token") : "";
    const userStore = useUserStore();
    const userToken = userStore.token ? userStore.token : "";
    let data :any = {};
    switch(config.method){
      case 'get' :
        data = config.params;break;
      case 'post':
      case 'put':
        data = config.data;break;
      case 'delete':
        data = {};break;
    };
    // 在请求发送前可以做一些处理，例如添加通用的请求头
    // config.headers["X-APP-USER-TOKEN"] = "";
    // console.log(userToken)
    if (userToken) {
      config.headers["Authorization"] = `Bearer ${userToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
instance.interceptors.response.use(
  (config: AxiosResponse) => {
    const code = config.data["code"] || 200;
    if (code == 200) {
      return Promise.resolve(config.data);
    } else {
      // console.log("code err", code);
      return Promise.reject(config.data);
    }
    // return config;
  },
  (error: any) => {
    console.log(error)
    const code = error.status;
    //签名验证失败
    if (code == 401) {
      // console.log('签名验证失败',code,router)
      // //TODO 返回到登录页
      // router.push('/login')
      // sessionStorage.clear()
      const originalRequest = error.config;
      if (!originalRequest || originalRequest._retry) {
        router.push('/login');
        // sessionStorage.clear();
        return Promise.reject(error);
      }
      if (isRefreshing) {
        // 已在刷新中，把请求加入队列，刷新完成后重新发送
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((token) => {
            if (token) {
              originalRequest.headers["Authorization"] = `Bearer ${token}`;
              resolve(instance(originalRequest));
            } else {
              reject(error);
            }
          });
        });
      }
      originalRequest._retry = true;
      isRefreshing = true;

      return new Promise((resolve, reject) => {
        refreshTokenRequest()
          .then((newToken) => {
            const userStore = useUserStore();
            sessionStorage.setItem("token", newToken);
            userStore.token = newToken;
            // 更新默认 header，保证后续请求带上新 token
            (instance.defaults.headers as any)["Authorization"] = `Bearer ${newToken}`;
            onRefreshed(newToken);
            // 重新发送原始请求
            originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
            resolve(instance(originalRequest));
          })
          .catch((err) => {
            onRefreshed(null);
            router.push('/login');
            // sessionStorage.clear();
            reject(err);
          })
          .finally(() => {
            isRefreshing = false;
          });
      });
    }
    
    return Promise.reject(error);
  }
);

// 封装常用的HTTP请求方法
export const http = {
  get<T = any>(url: string, params?: Record<string, any>) {
    return instance.get<T>(url, { params });
  },
  post<T = any>(url: string, data?: any) {
    return instance.post<T>(url, data);
  },
  patch<T = any>(url: string, data?: any) {
    return instance.patch<T>(url, data);
  },
  put<T = any>(url: string, data?: any) {
    return instance.put<T>(url, data);
  },
  delete<T = any>(url: string) {
    return instance.delete<T>(url,);
  },
};
