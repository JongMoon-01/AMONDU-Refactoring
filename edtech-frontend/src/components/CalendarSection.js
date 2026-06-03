import React, { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./CustomCalendar.css"; // Tailwind 커스터마이징용

export default function CalendarSection() {
  const [value, setValue] = useState(new Date());

  return (
    <div className="bg-white rounded-xl p-4 shadow mb-6">
      <Calendar
        onChange={setValue}
        value={value}
        locale="ko-KR"
        tileClassName={({ date, view }) =>
          view === "month" && date.getDate() === value.getDate()
            ? "bg-blue-100 font-semibold rounded"
            : null
        }
      />
      <p className="mt-4 text-sm text-gray-500 text-center">
        선택된 날짜: <span className="font-medium">{value.toLocaleDateString()}</span>
      </p>
    </div>
  );
}
