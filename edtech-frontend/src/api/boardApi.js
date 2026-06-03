// src/api/boardApi.js
import axios from "axios";

const boardApi = axios.create({
  baseURL: "http://localhost:8083/api",
});

boardApi.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.debug("[boardApi] attach token", token.slice(0,12), "..."); // 확인용
  } else {
    console.warn("[boardApi] no token");
  }
  return config;
});

export default boardApi;
