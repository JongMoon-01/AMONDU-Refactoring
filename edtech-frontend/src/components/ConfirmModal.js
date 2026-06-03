import React from "react";

export default function ConfirmModal({
  open,
  title = "확인",
  message,
  confirmText = "확인",
  cancelText = "취소",
  onConfirm,
  onCancel,
  loading = false,
  danger = false,
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center z-50">
      <div className="bg-white p-6 rounded-xl w-[420px] shadow-xl">
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        {message && <p className="text-sm text-gray-600 mb-4">{message}</p>}
        <div className="flex justify-end gap-2">
          <button
            className="px-3 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-60"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            className={`px-3 py-2 rounded text-white disabled:opacity-60 ${
              danger
                ? "bg-red-600 hover:bg-red-700"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "처리 중…" : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
