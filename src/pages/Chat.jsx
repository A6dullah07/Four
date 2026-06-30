import React from "react";
import { MessageCircle } from "lucide-react";

export default function Chat() {
  return (
    <div>
      <div className="bg-gradient-to-l from-[#1e3a8a] to-[#7c3aed] px-5 pt-12 pb-8 rounded-b-3xl">
        <h1 className="text-xl font-bold text-white">المحادثة</h1>
      </div>
      <div className="px-4 mt-8 flex flex-col items-center justify-center text-center py-16">
        <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
          <MessageCircle className="w-7 h-7 text-indigo-400" />
        </div>
        <p className="text-gray-500 text-sm">لا توجد محادثات بعد</p>
        <p className="text-gray-400 text-xs mt-1">ابدأ محادثة مع المساعد المالي</p>
      </div>
    </div>
  );
}