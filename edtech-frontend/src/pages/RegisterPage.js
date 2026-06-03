import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("STUDENT"); // ✅ 기본값 학생
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const onSubmit = async () => {
    setError("");
    if (!email || !password || !name) {
      setError("이메일/비밀번호/ID(이름)을 입력하세요.");
      return;
    }
    if (password !== password2) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    try {
      setLoading(true);
      const { data } = await api.post("/auth/register", {
        name, email, password, phone, role   // ✅ phone, role 전송
      });
      localStorage.setItem("token", data.token);
      localStorage.setItem("userName", data.name);
      localStorage.setItem("userEmail", data.email);
      localStorage.setItem("userRole", data.role); // ✅ 저장
      navigate("/");
    } catch (e) {
      console.error("REG ERROR:", e.response?.data);
      setError(e.response?.data?.message || "회원가입 실패: 이미 존재하는 이메일일 수 있음");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center w-full min-h-[calc(93vh-3rem)] py-12 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-bold mb-4">회원가입</h2>
        {error && <div className="mb-3 text-sm text-red-600">{error}</div>}

        <label className="block mb-2">E-Mail</label>
        <input type="email" placeholder="Email@example.com"
               className="w-full p-2 mb-4 border rounded"
               value={email} onChange={(e) => setEmail(e.target.value)} />

        <label className="block mb-2">Password</label>
        <input type="password" placeholder="password"
               className="w-full p-2 mb-4 border rounded"
               value={password} onChange={(e) => setPassword(e.target.value)} />

        <label className="block mb-2">Password 확인</label>
        <input type="password" placeholder="password"
               className="w-full p-2 mb-4 border rounded"
               value={password2} onChange={(e) => setPassword2(e.target.value)} />

        <label className="block mb-2">ID (이름)</label>
        <input type="text" placeholder="User_ID"
               className="w-full p-2 mb-4 border rounded"
               value={name} onChange={(e) => setName(e.target.value)} />

        <label className="block mb-2">연락처</label>
        <input type="tel" placeholder="010-1234-5678"
               className="w-full p-2 mb-4 border rounded"
               value={phone} onChange={(e) => setPhone(e.target.value)} />

        <label className="block mb-2">역할</label>
        <select className="w-full p-2 mb-6 border rounded"
                value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="STUDENT">학생(STUDENT)</option>
          <option value="ADMIN">관리자(ADMIN)</option>
        </select>

        <button onClick={onSubmit} disabled={loading}
                className="w-full bg-blue-100 hover:bg-blue-200 disabled:opacity-60 text-blue-800 font-semibold py-2 rounded">
          {loading ? "처리 중..." : "회원가입"}
        </button>
      </div>
    </div>
  );
}
