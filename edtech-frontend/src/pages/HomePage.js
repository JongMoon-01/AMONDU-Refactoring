import React, { useState, useEffect } from "react";
import api from "../api/axios";
import ClassCard from "../components/ClassCard";
import ClassRegisterModal from "../components/ClassRegisterModal";
import { getAuth } from "../utils/auth";
import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const [classes, setClasses] = useState([]);
  const [enrolledIds, setEnrolledIds] = useState(new Set());
  const [applying, setApplying] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const auth = getAuth();
  const isAdmin = auth?.role === "ADMIN";
  const token = auth?.token || localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => { fetchClasses(); }, []);

  const fetchClasses = async () => {
    try {
      const { data } = await api.get("/classes");
      const list = Array.isArray(data) ? data : (Array.isArray(data?.content) ? data.content : []);
      setClasses(list);
      console.log("classes:", list);
    } catch (err) {
      console.error("클래스 불러오기 실패", err?.response?.data || err);
      setClasses([]);
    }
  };

  useEffect(() => {
    const fetchMyEnrollments = async () => {
      try {
        const { data } = await api.get("/classes/me/enrollments");
        const ids = Array.isArray(data) ? data : (Array.isArray(data?.ids) ? data.ids : []);
        setEnrolledIds(new Set(ids));
        console.log("my enrollments:", ids);
      } catch {
        setEnrolledIds(new Set());
      }
    };
    fetchMyEnrollments();
  }, [token]);

  const handleApply = async (classId) => {
    if (!auth) return navigate("/login");
    try {
      setApplying(true);
      await api.post(`/classes/${classId}/enroll`);
      setEnrolledIds(prev => new Set([...prev, classId]));
    } catch (e) {
      console.error("신청 실패", e?.response?.data || e);
      if (e?.response?.status === 401) navigate("/login");
    } finally {
      setApplying(false);
    }
  };

  const handleEnter = (classId) => navigate(`/class/${classId}`);

  const handleModalClose = () => { setIsModalOpen(false); fetchClasses(); };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="flex-grow p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <input type="text" placeholder="클래스 검색..." className="w-full max-w-md px-4 py-2 border rounded-lg shadow-sm" />
            {isAdmin && (
              <button onClick={() => setIsModalOpen(true)} className="ml-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow">
                클래스 등록하기
              </button>
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-6">
            {Array.isArray(classes) && classes.map(cls => (
              <ClassCard
                key={cls.classId}
                classId={cls.classId}
                title={cls.title}
                headcount={cls.headcount}
                isEnrolled={enrolledIds.has(cls.classId)}
                isAdmin={isAdmin}
                onApply={handleApply}
                onEnter={handleEnter}
                disabled={applying}
              />
            ))}
          </div>
        </div>
      </main>

      {isModalOpen && <ClassRegisterModal onClose={handleModalClose} />}
    </div>
  );
}
