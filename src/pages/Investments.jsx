import React from "react";
import { TrendingUp } from "lucide-react";

export default function Investments() {
  return (
    <div className="min-h-screen" style={{ background: "#0a0e1a" }}>
      <div className="px-5 pt-12 pb-5">
        <h1 className="text-white text-xl font-bold">الاستثمارات</h1>
      </div>
      <div className="flex flex-col items-center justify-center text-center py-20">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "#0f1525" }}>
          <TrendingUp className="w-7 h-7 text-indigo-400" />
        </div>
        <p className="text-slate-400 text-sm">لا توجد استثمارات بعد</p>
        <p className="text-slate-600 text-xs mt-1">سيتم عرض تحليلات استثماراتك هنا</p>
      </div>
    </div>
  );
}