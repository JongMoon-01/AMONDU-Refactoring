import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ExcelViewerPage from "./pages/ExcelViewerPage";
import HomePage from "./pages/HomePage";
import ClassDetailPage from "./pages/ClassDetailPage";
import CourseListPage from "./pages/CourseListPage";
import CourseDetailPage from "./pages/CourseDetailPage";
import CourseContentPage from "./pages/CourseContentPage";
import LectureSummaryPage from "./pages/LectureSummaryPage";
import StudentsPage from "./pages/StudentsPage";
import MainDashboard from "./pages/MainDashboard";
import AdminDashboard from "./pages/admin/AdminHomePage"
import AdminKpiPage from "./pages/admin/AdminKpiPage";
import AdminKpiDetailPage from "./pages/admin/AdminKpiDetailPage";
import QnaListPage from "./pages/qna/QnaListPage";
import QnaDetailPage from "./pages/qna/QnaDetailPage";
import QnaWritePage from "./pages/qna/QnaWritePage";
import QnaEditPage from "./pages/qna/QnaEditPage";
import NoticePage from "./pages/notice/NoticePage";
import NoticeDetailPage from "./pages/notice/NoticeDetailPage";
import NoticeWritePage from "./pages/notice/NoticeWritePage";
import NoticeEditPage from "./pages/notice/NoticeEditPage";

export default function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/excel" element={<ExcelViewerPage />} />
            <Route path="/" element={<HomePage />} />

            {/* 수강생 조회(관리자) */}
            <Route path="/class/:classId/students" element={<StudentsPage />} />
            {/* 본인 수업 태도 조회(학생) */}
            <Route path="/class/:classId/MyAttitude" element={<MainDashboard/>} />
            <Route path="/class/:classId" element={<ClassDetailPage />} />
            {/* 게시판 */}
            <Route path="/class/:classId/qna" element={<QnaListPage />} />
            <Route path="/class/:classId/qna/new" element={<QnaWritePage />} />
            <Route path="/class/:classId/qna/:postId" element={<QnaDetailPage />} />
            <Route path="/class/:classId/qna/:postId/edit" element={<QnaEditPage />} />

            <Route path="/class/:classId/notice" element={<NoticePage />} />
            <Route path="/class/:classId/notice/write" element={<NoticeWritePage />} />
            <Route path="/class/:classId/notice/:postId" element={<NoticeDetailPage />} />
            <Route path="/class/:classId/notice/:postId/edit" element={<NoticeEditPage />} />

            <Route path="/class/:classId/courses" element={<CourseListPage />} />
            <Route path="/class/:classId/adminDashboard" element={<AdminDashboard />} />
            <Route path="/class/:classId/adminDashboard/kpi/:courseId" element={<AdminKpiPage />} />
            <Route path="/class/:classId/adminDashboard/kpi/:courseId/:metric" element={<AdminKpiDetailPage />} />
            {/*<Route path="/class/:classId/adminDashboard/kpi"*/}
            <Route path="/class/:classId/courses/:courseId/schedule" element={<CourseDetailPage />} />
            <Route path="/class/:classId/courses/:courseId/content" element={<CourseContentPage />} />
            <Route path="/class/:classId/courses/:courseId/summary" element={<LectureSummaryPage />} />
            <Route path="/class/:classId/courses/:courseId/resources" element={<CourseDetailPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}
