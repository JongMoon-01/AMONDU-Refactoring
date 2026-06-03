// src/components/QuizModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios"; // JWT 포함된 axios 인스턴스

/**
 * props:
 *  - classId?: string|number (없으면 useParams에서 가져옴)
 *  - courseId?: string|number (없으면 useParams에서 가져옴)
 *  - onClose: () => void
 */
export default function QuizModal({ classId: propClassId, courseId: propCourseId, onClose }) {
  const params = useParams();
  const classId = useMemo(() => Number(propClassId ?? params.classId), [propClassId, params.classId]);
  const courseId = useMemo(() => Number(propCourseId ?? params.courseId), [propCourseId, params.courseId]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quizzes, setQuizzes] = useState([]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState({}); // { "0": "A", "1": "O", ... }
  const [result, setResult] = useState(null);   // {correct, total, score, feedback[]}
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    fetchQuizzes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, courseId]);

  async function fetchQuizzes() {
    if (!classId || !courseId) {
      setError("classId/courseId가 없습니다.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    setQuizzes([]);
    setIdx(0);
    setSelected({});
    setShowResult(false);
    setResult(null);

    try {
      // 스프링 → 파이썬 → 스프링 경유로 퀴즈 생성/수신
      const { data } = await api.post(`/quizzes/classes/${classId}/courses/${courseId}/generate`);
      if (!Array.isArray(data) || data.length === 0) {
        setError("퀴즈가 비어 있습니다.");
      } else {
        setQuizzes(data);
      }
    } catch (e) {
      console.error("[QuizModal] fetchQuizzes error:", e);
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.detail ||
        e?.message ||
        "퀴즈 생성 중 오류가 발생했습니다.";
      setError(humanizeError(msg));
    } finally {
      setLoading(false);
    }
  }

  function humanizeError(msg) {
    if (msg.includes("강의(lecture)가 없습니다")) return "이 코스에 연결된 강의가 없습니다. 관리자에게 문의하세요.";
    if (msg.includes("집중 안함 구간")) return "집중 안함 구간이 아직 없습니다. 강의 시청 후 다시 시도하세요.";
    if (msg.includes("VTT")) return "자막(VTT) 파일이 없습니다. 관리자에게 문의하세요.";
    return msg;
  }

  function onSelect(label) {
    setSelected((prev) => ({ ...prev, [String(idx)]: label }));
  }

  function onPrev() {
    if (idx > 0) setIdx(idx - 1);
  }
  function onNext() {
    if (idx < quizzes.length - 1) setIdx(idx + 1);
  }

  function onSubmit() {
    // 로컬 채점
    const feedback = quizzes.map((q, i) => {
      const sel = selected[String(i)];
      const correct = (q.answer ?? "").trim();
      return {
        question: q.question,
        selected: sel ?? "-",
        correct,
        is_correct: sel === correct,
      };
    });
    const correctCount = feedback.filter((f) => f.is_correct).length;
    const total = quizzes.length;
    const score = Math.round((correctCount / total) * 100);
    setResult({ correct: correctCount, total, score, feedback });
    setShowResult(true);
  }

  // --- 화면들 ---

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">퀴즈를 생성/불러오는 중…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md">
          <h3 className="text-lg font-semibold text-red-600 mb-3">오류</h3>
          <p className="text-gray-700 mb-4">{error}</p>
          <div className="flex gap-2">
            <button
              onClick={fetchQuizzes}
              className="bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-700"
            >
              다시 시도
            </button>
            <button
              onClick={onClose}
              className="bg-gray-500 text-white px-3 py-1.5 rounded hover:bg-gray-600"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showResult && result) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">퀴즈 결과</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
          </div>
          <p className="text-center text-lg mb-4">
            맞힌 개수: {result.correct} / {result.total} ({result.score}점)
          </p>
          <div className="space-y-3">
            {result.feedback.map((fb, i) => (
              <div key={i} className="p-3 border rounded">
                <p className="font-semibold mb-1">Q{i + 1}. {fb.question}</p>
                <p>선택: {fb.selected} · 정답: {fb.correct} {fb.is_correct ? "✅" : "❌"}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-2">
            <button onClick={fetchQuizzes} className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
              새 퀴즈 생성
            </button>
            <button onClick={onClose} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
              닫기
            </button>
          </div>
        </div>
      </div>
    );
  }

  const q = quizzes[idx];
  const curSel = selected[String(idx)];
  const isLast = idx === quizzes.length - 1;
  const allAnswered = quizzes.every((_, i) => !!selected[String(i)]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">퀴즈 풀기</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <p className="text-sm text-gray-500 mb-2">
          문제 {idx + 1} / {quizzes.length}
        </p>
        <h3 className="text-lg font-semibold mb-4">{q?.question}</h3>

        <div className="space-y-2 mb-6">
          {(q?.options ?? []).map((opt, i) => (
            <button
              key={i}
              onClick={() => onSelect(opt.label)}
              className={`w-full text-left p-3 rounded border ${
                curSel === opt.label ? "bg-indigo-100 border-indigo-600" : "border-gray-300"
              }`}
            >
              {opt.label}. {opt.text}
            </button>
          ))}
        </div>

        <div className="flex justify-between">
          <button
            onClick={onPrev}
            disabled={idx === 0}
            className="px-4 py-2 bg-gray-400 text-white rounded disabled:opacity-50"
          >
            이전
          </button>

          {!isLast ? (
            <button
              onClick={onNext}
              disabled={!curSel}
              className="px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-50"
            >
              다음
            </button>
          ) : (
            <button
              onClick={onSubmit}
              disabled={!allAnswered}
              className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
            >
              제출하기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
