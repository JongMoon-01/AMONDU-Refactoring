// src/api/axios.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (config.url && config.url.startsWith("/auth/")) {
    delete config.headers.Authorization; // /auth는 토큰 제거
  } else if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 401 자동 처리(선택)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      localStorage.clear();
      // 필요하면 로그인으로 이동:
      // window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
