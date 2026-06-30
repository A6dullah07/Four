import React from "react";
import { Outlet } from "react-router-dom";
import BottomNav from "@/components/BottomNav";

export default function AppLayout() {
  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 font-body pb-20">
      <Outlet />
      <BottomNav />
    </div>
  );
}