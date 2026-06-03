import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { classSummaryData } from "../../../data/AdminDummyData";

export default function AdminReviewRateCard({ courseId }) {
  const navigate = useNavigate();

  const subject = classSummaryData.find((c) => c.id === courseId);
  const reviewRate = subject?.reviewRate ?? 0;

  const handleClick = () => {
    navigate(`/admin/kpi/${courseId}/review`);
  };

  return (
    <Card
      className="p-4 cursor-pointer hover:shadow-lg transition"
      onClick={handleClick}
    >
      <CardContent className="flex flex-col items-center justify-center">
        <h3 className="text-lg font-bold mb-2">평균 복습률</h3>
        <p className="text-3xl font-extrabold text-green-600 mb-2">
          {reviewRate}%
        </p>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-green-500 h-3 rounded-full"
            style={{ width: `${reviewRate}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          클릭하면 복습률 상세 페이지로 이동
        </p>
      </CardContent>
    </Card>
  );
}
