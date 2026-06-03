import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const onSubmit = async () => {
    setError("");
    if (!email || !password) {
      setError("이메일/비밀번호를 입력하세요.");
      return;
    }
    try {
      setLoading(true);
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", data.token);
      localStorage.setItem("userName", data.name);
      localStorage.setItem("userEmail", data.email);
      navigate("/"); // 로그인 후 홈으로
    } catch (e) {
      setError("로그인 실패: 이메일/비밀번호 확인");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex items-center justify-center min-h-[89vh] bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
          로그인
        </h2>
        {error && <div className="mb-3 text-sm text-red-600">{error}</div>}

        <label className="block text-sm font-medium text-gray-700 mb-1">
          E-Mail
        </label>
        <input
          type="email"
          placeholder="Email@example.com"
          className="w-full mb-4 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <input
          type="password"
          placeholder="password"
          className="w-full mb-2 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="flex justify-end text-sm mb-6">
          <Link
            to="/register"
            className="text-indigo-600 hover:underline transition"
          >
            회원가입
          </Link>
        </div>

        <button
          onClick={onSubmit}
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-2 rounded-lg transition"
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>

        <div className="mt-6 border-t pt-4 text-sm text-center text-gray-500">
          <p className="mb-1">테스트용 ID</p>
          <p>테스트용 password</p>
        </div>
      </div>
    </div>
  );
}
