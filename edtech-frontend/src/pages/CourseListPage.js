// src/pages/CourseListPage.js
import Sidebar from "../components/Sidebar";
import api from "../api/axios";
import CourseCreateModal from "../components/CourseCreateModal";
import { getAuth } from "../utils/auth";
import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import QuizModal from "../components/QuizModal";
import ConfirmModal from "../components/ConfirmModal";

export default function CourseListPage() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const isAdmin = getAuth()?.role === "ADMIN";
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);   // 현재 삭제 중인 코스
  const [confirm, setConfirm] = useState({ open:false, id:null, title:'' }); // 확인 모달
  

  const handleGenerateQuiz = (clsId, crsId) => {
  if (!crsId) {
    alert("코스 ID가 없습니다.");
    return;
  }
  setSelectedCourseId(crsId);
  setShowQuizModal(true);
  };

  const deleteCourse = async (courseId) => {
    try {
      setDeletingId(courseId);
      await api.delete(`/classes/${classId}/courses/${courseId}`);
      // 낙관적 업데이트
      setCourses(prev => prev.filter(c => (c.courseId ?? c.id) !== courseId));
    } catch (e) {
      console.error("[CourseList] delete error:", e);
      alert("삭제에 실패했습니다.");
    } finally {
      setDeletingId(null);
      setConfirm({ open:false, id:null, title:'' });
    }
  };

  const load = useCallback(async () => {
    if (!classId) return;
    let alive = true;
    setLoading(true);
    try {
      const { data } = await api.get(`/classes/${classId}/courses`);
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.content)
        ? data.content
        : Array.isArray(data?.items)
        ? data.items
        : [];
      if (alive) setCourses(list);
    } catch (e) {
      console.error("[CourseList] load error:", e);
      if (alive) setCourses([]);
    } finally {
      if (alive) setLoading(false);
    }
    return () => {
      alive = false;
    };
  }, [classId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const handler = () => { if (isAdmin) setOpen(true); };
    window.addEventListener("open-course-create", handler);
    return () => window.removeEventListener("open-course-create", handler);
  }, [isAdmin]);

  return (
    <div className="flex min-h-screen bg-blue-50">
      {/* ✅ 왼쪽 사이드바 */}
      <Sidebar />

      {/* ✅ 오른쪽 메인 영역 */}
      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">내 강의 목록</h2>
          {isAdmin && (
            <button
              className="text-sm bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700"
              onClick={() => setOpen(true)}
            >
              과목 추가하기 +
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl shadow p-4 overflow-x-auto">
          <table className="w-full text-sm text-left table-auto">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="px-4 py-2">강의명</th>
                <th className="px-4 py-2">강사</th>
                <th className="px-4 py-2">태그</th>
                <th className="px-4 py-2 text-right">바로가기</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td className="px-4 py-3 text-gray-400" colSpan={4}>
                    불러오는 중…
                  </td>
                </tr>
              )}
              {!loading && courses.length === 0 && (
                <tr>
                  <td className="px-4 py-3 text-gray-400" colSpan={4}>
                    등록된 과목이 없습니다.
                  </td>
                </tr>
              )}
              {!loading &&
                courses.map((c) => (
                  <tr key={c.courseId ?? c.id} className="border-t">
                    <td className="px-4 py-3 font-semibold">{c.title}</td>
                    <td className="px-4 py-3">{c.instructor || "-"}</td>
                    <td className="px-4 py-3 space-x-2">
                      {(c.tag ? c.tag.split(",") : []).map((tag, i) => (
                        <span
                          key={`${c.courseId ?? c.id}-${i}`}
                          className="inline-block bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full"
                        >
                          {tag.trim()}
                        </span>
                      ))}
                    </td>
                    <td className="px-4 py-3">
  <div className="flex justify-end items-center gap-2">
    <button
      type="button"
      className="bg-indigo-600 text-white text-xs px-3 py-1 rounded hover:bg-indigo-700"
      onClick={(e) => {
        e.stopPropagation();
        console.log('[GOTO]', c.courseId ?? c.id);
        navigate(`/class/${classId}/courses/${c.courseId ?? c.id}/schedule`);
      }}
    >
      강의 바로가기 →
    </button>

    <button
  type="button"
  className="text-xs px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700"
  onClick={(e) => {
    e.stopPropagation();
    handleGenerateQuiz(classId, c.courseId ?? c.id);
  }}
>
  퀴즈 풀어보자 →
</button>

    {isAdmin && (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          console.log('[DELETE CLICK]', c.courseId ?? c.id, c.title);
          setConfirm({
            open: true,
            id: (c.courseId ?? c.id),
            title: c.title || ''
          });
        }}
        disabled={deletingId === (c.courseId ?? c.id)}
        className={`text-xs px-3 py-1 rounded
          ${deletingId === (c.courseId ?? c.id)
            ? "bg-red-300 text-white cursor-not-allowed"
            : "bg-red-600 text-white hover:bg-red-700"}`}
        title="이 강의를 삭제합니다"
      >
        {deletingId === (c.courseId ?? c.id) ? "삭제 중…" : "삭제"}
      </button>
    )}
  </div>
</td>

                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {open && (
          <CourseCreateModal
            classId={classId}
            onClose={() => setOpen(false)}
            onCreated={load}
          />
        )}
        {showQuizModal && (
  <QuizModal
    classId={classId}
    courseId={selectedCourseId}
    onClose={() => setShowQuizModal(false)}
  />
)}
<ConfirmModal
  open={confirm.open}
  title="강의 삭제"
  message={`‘${confirm.title}’ 강의를 정말 삭제할까요? 이 작업은 되돌릴 수 없습니다.`}
  confirmText="삭제"
  cancelText="취소"
  danger
  loading={deletingId !== null}
  onCancel={() => setConfirm({ open:false, id:null, title:"" })}
  onConfirm={() => deleteCourse(confirm.id)}
/>
      </main>
    </div>
  );
}
