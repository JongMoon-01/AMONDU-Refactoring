// src/pages/StudentsPage.js
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";

export default function StudentsPage() {
  const { classId } = useParams();
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    api.get(`/classes/${classId}/students`)
      .then(({ data }) => setRows(Array.isArray(data) ? data : []))
      .catch((e) => {
        setRows([]);
        // 403이면 관리자 전용임을 안내
        setError(e?.response?.status === 403 ? "관리자만 접근 가능합니다." : "불러오기 실패");
      });
  }, [classId]);

  const filtered = rows.filter((r) =>
    (r.name || "").toLowerCase().includes(q.toLowerCase()) ||
    (r.email || "").toLowerCase().includes(q.toLowerCase()) ||
    (r.phone || "").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold">수강생 조회</h2>
        <input
          placeholder="이름/이메일/연락처 검색"
          className="border rounded px-3 py-1"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {error && (
        <div className="mb-3 text-sm text-red-600">{error}</div>
      )}

      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">이름</th>
              <th className="px-4 py-2 text-left">이메일</th>
              <th className="px-4 py-2 text-left">연락처</th>
              <th className="px-4 py-2 text-left">신청일</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.userId} className="border-t">
                <td className="px-4 py-2">{s.name}</td>
                <td className="px-4 py-2">{s.email}</td>
                <td className="px-4 py-2">{s.phone || "-"}</td>
                <td className="px-4 py-2">{s.enrolledAt || "-"}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-gray-400" colSpan={4}>
                  데이터 없음
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
