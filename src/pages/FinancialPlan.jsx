import React from "react";
import { Target } from "lucide-react";

export default function FinancialPlan() {
  return (
    <div className="min-h-screen" style={{ background: "#111318" }}>
      <div className="px-5 pt-12 pb-5" style={{ background: "linear-gradient(135deg,#1e3a8a,#7c3aed)" }}>
        <h1 className="text-white text-xl font-bold">الخطة المالية</h1>
        <p className="text-blue-200 text-xs mt-0.5">خطط لمستقبلك المالي</p>
      </div>
      <div className="flex flex-col items-center justify-center py-20 text-center px-8">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "#1a1d27" }}>
          <Target className="w-7 h-7 text-indigo-400" />
        </div>
        <p className="text-white font-bold mb-2">الخطة المالية</p>
        <p className="text-slate-500 text-sm">سيتم بناء الخطة المالية هنا قريباً</p>
      </div>
    </div>
  );
}