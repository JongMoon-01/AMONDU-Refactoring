// src/components/Sidebar.js
import { Link, useLocation, useParams } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import api from "../api/axios";
import { getAuth } from "../utils/auth";
import homeIcon from "../assets/icons/icons8-home-100.png";
import courseIcon from "../assets/icons/icons8-course-100.png";
import attitudeIcon from "../assets/icons/icons8-report-100.png";

export default function Sidebar() {
  const location = useLocation();
  const { classId } = useParams();
  const [courses, setCourses] = useState([]);
  const isAdmin = getAuth()?.role === "ADMIN";
  const isStudent = getAuth()?.role === "STUDENT";

  useEffect(() => {
    if (!classId) return;
    api
      .get(`/classes/${classId}/courses`)
      .then((res) => setCourses(res.data ?? []))
      .catch(() => setCourses([]));
  }, [classId]);

  const isCourseDetailPage =
    location.pathname.includes(`/class/${classId}/courses/`) &&
    /(schedule|content|summary|resources)/.test(location.pathname);

  // 활성 상태 판별
  const path = location.pathname;
  const active = useMemo(
    () => ({
      home: path === `/class/${classId}`,
      coursesRoot: path === `/class/${classId}/courses`,
      students: path === `/class/${classId}/students`,
      adminDash: path === `/class/${classId}/adminDashboard`,
      myAttitude: path === `/class/${classId}/MyAttitude`,
      courseId: path.match(/\/courses\/(\d+)/)?.[1] ?? null,
    }),
    [path, classId]
  );

  // 아이콘 버튼(콤팩트 바에서 사용)
  const IconBtn = ({ to, src, alt, active }) => (
    <Link
      to={to}
      className={`p-2 rounded-xl transition ${
        active ? "bg-blue-100 ring-2 ring-blue-300" : "hover:bg-gray-100"
      }`}
    >
      <img src={src} alt={alt} className="w-6 h-6" />
    </Link>
  );

  if (isCourseDetailPage) {
    return (
      <aside className="w-16 bg-white border-r shadow px-3 py-4 flex flex-col items-center gap-4 sticky top-0 h-screen">
        <IconBtn to={`/class/${classId}`} src={homeIcon} alt="Home" active={active.home} />
        <IconBtn
          to={`/class/${classId}/courses`}
          src={courseIcon}
          alt="Courses"
          active={active.coursesRoot}
        />
        <IconBtn
          to={isStudent ? `/class/${classId}/MyAttitude` : `/class/${classId}/students`}
          src={attitudeIcon}
          alt="Report"
          active={isStudent ? active.myAttitude : active.students}
        />
      </aside>
    );
  }

  return (
    <aside className="w-72 bg-white border-r shadow-sm px-4 py-5 sticky top-0 h-screen overflow-y-auto">
      {/* 브랜드/홈 */}
      <Link
        to={`/class/${classId}`}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg font-bold tracking-wide
          ${active.home ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200" : "text-gray-800 hover:bg-gray-50"}`}
      >
        <img src={homeIcon} alt="" className="w-5 h-5 opacity-80" />
        HOME
      </Link>

      {/* 섹션: Courses */}
      <Section title="Courses">
        <LinkItem
          to={`/class/${classId}/courses`}
          label="모든 과목 보기"
          active={active.coursesRoot}
          icon={<img src={courseIcon} alt="" className="w-4 h-4 opacity-80" />}
        />

        <Divider />

        <ul className="mt-2 space-y-1">
          {courses.length === 0 && (
            <li className="text-xs text-gray-400 px-3 py-2">등록된 과목 없음</li>
          )}
          {courses.map((c) => {
            const id = c.courseId ?? c.id;
            const isActiveCourse = String(id) === active.courseId;
            return (
              <li key={id}>
  <Link
    to={`/class/${classId}/courses/${id}/schedule`}
    className={`group flex items-center justify-between px-3 py-2 rounded-md text-sm transition
      ${isActiveCourse ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200" : "hover:bg-gray-50"}`}
    title={c.title}
  >
    <span className="truncate">{c.title}</span>

    {/* 🔧 여기! 템플릿 리터럴로 전체를 백틱(`)으로 감싸야 함 */}
    <span
      className={`ml-3 shrink-0 text-[10px] rounded-full px-2 py-[2px] ${
        isActiveCourse ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"
      }`}
    >
      일정
    </span>
  </Link>
</li>
            );
          })}
        </ul>
      </Section>

      {/* 섹션: 관리 / 내 정보 */}
      <Section title="Actions">
        {isAdmin && (
          <>
            <LinkItem
              to={`/class/${classId}/students`}
              label="수강생 조회"
              active={active.students}
              icon={<span className="w-4 h-4 grid place-items-center text-[12px]">👥</span>}
            />
            <LinkItem
              to={`/class/${classId}/adminDashboard`}
              label="관리자 대시보드"
              active={active.adminDash}
              icon={<span className="w-4 h-4 grid place-items-center text-[12px]">📊</span>}
            />
          </>
        )}
        {isStudent && (
          <LinkItem
            to={`/class/${classId}/MyAttitude`}
            label="내 수업태도"
            active={active.myAttitude}
            icon={<img src={attitudeIcon} alt="" className="w-4 h-4 opacity-80" />}
          />
        )}
      </Section>

      <footer className="mt-6 text-[11px] text-gray-400 px-3">
        <Divider />
        <div className="mt-3">© AMONDU</div>
      </footer>
    </aside>
  );
}

/* ------- Sub components ------- */

function Section({ title, children }) {
  return (
    <div className="mt-5">
      <div className="px-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
        {title}
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function LinkItem({ to, label, active, icon }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition
        ${active ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200" : "hover:bg-gray-50"}`}
    >
      {icon}
      <span className="truncate">{label}</span>
    </Link>
  );
}

function Divider() {
  return <div className="h-px bg-gray-100 my-2" />;
}
