// ClassCard.js
import React from "react";

export default function ClassCard({
  title, headcount, classId,
  isEnrolled = false,
  isAdmin = false,             // ✅ 추가
  onApply,
  onEnter,
  disabled = false,
}) {

  // 버튼 렌더링 결정
  const renderAction = () => {
    if (isAdmin || isEnrolled) {   // ✅ 관리자 → 항상 입장
      return (
        <button
          onClick={() => onEnter(classId)}
          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
        >
          입장
        </button>
      );
    }
    // 수강생 + 미신청 → 신청 버튼
    return (
      <button
        onClick={() => onApply(classId)}
        disabled={disabled}
        className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:opacity-60"
      >
        신청
      </button>
    );
  };

  return (
    <div className="border rounded-xl p-4 w-64 shadow bg-white">
      <h3 className="text-sm font-semibold text-gray-600 mb-2">{title}</h3>
      <p className="text-xl font-bold text-gray-800 mb-4">정원: {headcount}</p>
      <div className="flex justify-between items-center">
        {renderAction()}
        <span className="text-gray-500 text-sm">정원</span>
      </div>
    </div>
  );
}
