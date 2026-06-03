import React, { useState } from "react";
import axios from "axios";

export default function ClassRegisterModal({ onClose }) {
  const [title, setTitle] = useState("");
  const [headcount, setHeadcount] = useState("");
  const [tags, setTags] = useState([]);
  const [inputTag, setInputTag] = useState("");
  const token = localStorage.getItem("token");

  const addTag = () => {
    if (tags.length < 5 && inputTag.length <= 10 && inputTag.trim() !== "") {
      setTags([...tags, inputTag]);
      setInputTag("");
    }
  };
  
  const removeTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSubmit = async () => {
  try {
    await axios.post("http://localhost:8080/api/classes", {
      title,
      tag: tags.join(","),
      headcount: parseInt(headcount),
    }, {
  headers: {
    Authorization: `Bearer ${token}` // ✅ 이거 추가
  }
  });

    alert("클래스 등록 완료");
    onClose();
    } catch (error) {
    console.error("클래스 등록 실패", error);
    alert("에러 발생");
    }
};
  // 썸네일은 나중에 구현
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 w-[400px] rounded-xl relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-red-500 text-xl"
        >
          ✕
        </button>
        
        <div className="text-center mb-4 text-lg font-semibold"> 
          📷 Class 썸네일 등록 
        </div>

        <input
          placeholder="클래스 제목"
          className="w-full mb-3 px-4 py-2 border rounded"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <input
          placeholder="정원"
          type="number"
          className="w-full mb-3 px-4 py-2 border rounded"
          value={headcount}
          onChange={(e) => setHeadcount(e.target.value)}
        />

        <div className="flex gap-2 mb-3">
          <input
            placeholder="태그(10글자 제한)"
            value={inputTag}
            onChange={(e) => setInputTag(e.target.value)}
            className="flex-1 px-3 py-1 border rounded"
          />
          <button
            onClick={addTag}
            className="bg-blue-600 hover:bg-blue-700 text-white px-2 rounded"
          >
            ＋
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          {tags.map((tag, idx) => (
            <div
              key={idx}
              className="bg-gray-200 px-2 py-1 rounded-full flex items-center gap-1"
            >
              #{tag}
              <button
                onClick={() => removeTag(tag)}
                className="text-red-500 font-bold"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          등록
        </button>
      </div>
    </div>
  );
}
