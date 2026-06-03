// src/components/CourseCreateModal.js
import { useState } from "react";
import api from "../api/axios";
import { useParams } from "react-router-dom";

export default function CourseCreateModal({ onClose, onCreated }) {
  const { classId } = useParams();
  const [title, setTitle] = useState("");
  const [instructor, setInstructor] = useState("");
  const [tag, setTag] = useState("");
  const [materialUrl, setMaterialUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    setErr("");
    if (!title) { setErr("제목 필수"); return; }
    try {
      setSaving(true);
      await api.post(`/classes/${classId}/courses`, {
        title, instructor, tag, materialUrl
      });
      onCreated?.();    // 목록 새로고침
      onClose?.();
    } catch (e) {
      setErr("생성 실패");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-xl w-[420px] p-5 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">과목 생성</h3>
          <button onClick={onClose}>✕</button>
        </div>

        {err && <div className="text-red-600 text-sm mb-2">{err}</div>}

        <label className="block text-sm mb-1">제목</label>
        <input className="w-full border rounded p-2 mb-3" value={title} onChange={e=>setTitle(e.target.value)} />

        <label className="block text-sm mb-1">강사</label>
        <input className="w-full border rounded p-2 mb-3" value={instructor} onChange={e=>setInstructor(e.target.value)} />

        <label className="block text-sm mb-1">태그(쉼표로 구분)</label>
        <input className="w-full border rounded p-2 mb-3" value={tag} onChange={e=>setTag(e.target.value)} />

        <label className="block text-sm mb-1">자료 URL</label>
        <input className="w-full border rounded p-2 mb-4" value={materialUrl} onChange={e=>setMaterialUrl(e.target.value)} />

        <button onClick={submit} disabled={saving}
                className="w-full bg-indigo-600 text-white rounded py-2 disabled:opacity-60">
          {saving ? "저장 중..." : "생성"}
        </button>
      </div>
    </div>
  );
}
