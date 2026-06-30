import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, ArrowLeftRight, MessageCircle, BarChart2, Target } from "lucide-react";

const navItems = [
  { path: "/", label: "الرئيسية", icon: Home },
  { path: "/transactions", label: "المعاملات", icon: ArrowLeftRight },
  { path: "/assistant", label: "المساعد", icon: MessageCircle },
  { path: "/analysis", label: "التحليل", icon: BarChart2 },
  { path: "/plan", label: "الخطة", icon: Target },
];

export default function BottomNav() {
  const location = useLocation();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50" style={{ background: "#1a1d27", borderTop: "1px solid #252836" }}>
      <div className="flex justify-around items-center h-16">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path;
          return (
            <Link key={path} to={path} className="flex flex-col items-center gap-0.5 px-2 py-1.5">
              <Icon className={`w-5 h-5 ${isActive ? "text-indigo-400" : "text-slate-500"}`} />
              <span className={`text-[10px] font-medium ${isActive ? "text-indigo-400" : "text-slate-600"}`}>{label}</span>
              {isActive && <div className="w-4 h-0.5 rounded-full bg-indigo-500 mt-0.5" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}