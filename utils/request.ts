import axios from "axios";

// 创建 Axios 实例
const axiosInstance = axios.create({
  baseURL: "http://3.113.243.125:5006/",
  withCredentials: false,
  headers: {
    "Content-Type": "application/json",
  },
});

// 请求拦截器：你可以在这里添加请求头、认证信息等
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers!["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

// 响应拦截器：你可以在这里处理请求返回的数据
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.log("error: ", error);
    return Promise.reject(error);
  }
);

export default axiosInstance;

/**
 * @description post请求
 * @template T 响应数据的类型
 * @param {string} url 请求的URL
 * @param {any} [options] 请求的选项
 * @returns {Promise<any>} 返回一个Promise，其结果是any类型
 */
export const post = (url: string, options?: any): Promise<any> => {
  return axiosInstance.post(url, options).then((response) => response.data);
};
