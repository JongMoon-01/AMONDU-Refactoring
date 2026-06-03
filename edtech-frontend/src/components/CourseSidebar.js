import { NavLink, useParams } from "react-router-dom";

export default function CourseSidebar() {
  const { classId, courseId } = useParams();

  const menu = [
    { name: "수업 일정", path: `/class/${classId}/courses/${courseId}/schedule` },
    { name: "강의 콘텐츠", path: `/class/${classId}/courses/${courseId}/content` },
    { name: "Lecture Summary", path: `/class/${classId}/courses/${courseId}/summary` },
    { name: "강의 자료실", path: `/class/${classId}/courses/${courseId}/resources` },
  ];

  return (
    <aside className="w-48 bg-white border-r shadow p-4 space-y-4">
      {menu.map((item, idx) => (
        <NavLink
          key={idx}
          to={item.path}
          className={({ isActive }) =>
            `block px-3 py-2 rounded text-sm transition ${
              isActive
                ? "bg-blue-100 font-semibold text-blue-700"
                : "text-gray-700 hover:bg-blue-50"
            }`
          }
        >
          {item.name}
        </NavLink>
      ))}
    </aside>
  );
}
