import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import axios from "axios";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 统一的 API 配置
const API_CONFIG = {
  development: {
    http: "http://micro.heiyu.space:8000/",
    wss: "wss://micro.heiyu.space:8000/",
  },
  production: {
    http: "https://dev.airag.click/",
    wss: "wss://dev.airag.click/",
  },
};

const currentEnv =
  process.env.NODE_ENV === "production" ? "production" : "development";

// HTTP 基础 URL
const HTTP_BASE_URL = API_CONFIG[currentEnv].http;

// WebSocket 基础 URL
const WS_BASE_URL = API_CONFIG[currentEnv].wss;

const axiosInstance = axios.create({
  baseURL: HTTP_BASE_URL,
  withCredentials: false,
  headers: {
    "Content-Type": "application/json",
  },
});

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

export const post = async (url: string, options?: any): Promise<any> => {
  const config: any = {};

  // Handle FormData for file uploads
  if (options instanceof FormData) {
    config.headers = {
      "Content-Type": "multipart/form-data",
    };
  }

  const response = await axiosInstance.post(url, options, config);
  return response.data;
};

// 获取 WebSocket URL 的辅助函数
export const getWebSocketUrl = (path: string) => {
  // 确保 path 以 / 开头
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${WS_BASE_URL.replace(/\/$/, "")}${normalizedPath}`;
};

// 流式请求函数，复用现有的配置
export const postStream = async (
  url: string,
  options?: any
): Promise<Response> => {
  const token = localStorage.getItem("token");

  return fetch(`${axiosInstance.defaults.baseURL}${url}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(options),
  });
};
