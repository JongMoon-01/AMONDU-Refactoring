// components/CourseCarousel.js
import { motion } from "framer-motion";
import { useState } from "react";
import classNames from "classnames";

const courses = ["Course1", "Course2", "Course3", "Course4", "Course5"];

export default function CourseCarousel() {
  const [active, setActive] = useState(0);

  const handleClick = (dir) => {
    setActive((prev) =>
      dir === "next" ? (prev + 1) % courses.length : (prev - 1 + courses.length) % courses.length
    );
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto px-4 py-6 overflow-visible">
      {/* 캐러셀 카드 영역 */}
      <div className="relative h-72 flex justify-center items-center">
        {courses.map((course, idx) => {
          const offset = idx - active;

          // ➤ 중심 기준 좌우 2개까지만 렌더링
          if (Math.abs(offset) > 2) return null;

          const isActive = offset === 0;
          const zIndex = 10 - Math.abs(offset);
          const translateX = offset * 180; // 카드 간 거리
          const rotateY = offset * -10; // 좌우 회전
          const scale = 1 - Math.abs(offset) * 0.04; // 크기 조정

          return (
            <motion.div
              key={course}
              className={classNames(
                "absolute w-56 h-60 p-4 bg-white rounded-xl shadow-lg text-center transition-all duration-500",
                {
                  "z-50 scale-105": isActive,
                  "scale-95 text-gray-400": !isActive,
                }
              )}
              style={{
                transform: `translateX(${translateX}px) rotateY(${rotateY}deg) scale(${scale})`,
                zIndex,
              }}
            >
              <h3 className="text-base font-bold">{course}</h3>
              <p className="text-sm mt-2 text-gray-500">Course Description</p>
            </motion.div>
          );
        })}
      </div>

      {/* 좌우 버튼 */}
      <div className="flex justify-center gap-4 mt-8">
        <button
          onClick={() => handleClick("prev")}
          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
        >
          ←
        </button>
        <button
          onClick={() => handleClick("next")}
          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
        >
          →
        </button>
      </div>

      {/* 인디케이터 */}
      <div className="flex justify-center mt-4 space-x-2">
        {courses.map((_, idx) => (
          <div
            key={idx}
            className={`w-3 h-3 rounded-full transition ${
              idx === active ? "bg-yellow-400" : "bg-gray-300"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
