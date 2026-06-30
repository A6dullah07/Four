import React from "react";
import { Outlet } from "react-router-dom";
import BottomNav from "@/components/BottomNav";

export default function AppLayout() {
  return (
    <div dir="rtl" className="min-h-screen pb-20" style={{ background: "#0a0e1a" }}>
      <Outlet />
      <BottomNav />
    </div>
  );
}