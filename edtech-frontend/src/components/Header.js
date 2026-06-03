import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const userName = localStorage.getItem("userName");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    navigate("/", { replace: true });
  };

  return (
    <header className="bg-blue-600 text-white px-6 py-3 flex justify-between items-center">
      {/* 왼쪽 로고 */}
      <Link to="/" className="flex items-center gap-2">
        <img
          src="/amondu.png" // public 폴더 기준
          alt="Logo"
          className="h-8 w-auto"
        />
      </Link>

      {/* 오른쪽 메뉴 */}
      <nav className="flex items-center gap-4">
        <Link to="/" className="hover:underline">
          홈
        </Link>
        <Link to="/excel" className="hover:underline">
          게시판
        </Link>

        {!token ? (
          <>
            <Link to="/login" className="hover:underline">
              로그인
            </Link>
            <Link to="/register" className="hover:underline">
              회원가입
            </Link>
          </>
        ) : (
          <>
            <span className="text-sm opacity-90">{userName}님</span>
            <button
              onClick={handleLogout}
              className="bg-white text-blue-600 rounded px-3 py-1 text-sm font-semibold hover:bg-blue-50"
            >
              로그아웃
            </button>
          </>
        )}
      </nav>
    </header>
  );
}
