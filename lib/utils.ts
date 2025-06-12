import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import axios from "axios";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const axiosInstance = axios.create({
  baseURL: process.env.NODE_ENV === "production" 
    ? "https://dev.airag.click/" 
    : "http://176.32.79.7:5006/",
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
      'Content-Type': 'multipart/form-data'
    };
  }
  
  const response = await axiosInstance.post(url, options, config);
  return response.data;
};

// 流式请求函数，复用现有的配置
export const postStream = async (url: string, options?: any): Promise<Response> => {
  const token = localStorage.getItem("token");
  
  return fetch(`${axiosInstance.defaults.baseURL}${url}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    body: JSON.stringify(options),
  });
};
