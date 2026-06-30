import React from "react";
import { Outlet } from "react-router-dom";
import BottomNav from "@/components/BottomNav";

export default function AppLayout() {
  return (
    <div dir="rtl" className="min-h-screen pb-20" style={{ background: "#111318", fontFamily: "'Tajawal', 'Cairo', Tahoma, Arial, sans-serif" }}>
      <Outlet />
      <BottomNav />
    </div>
  );
}