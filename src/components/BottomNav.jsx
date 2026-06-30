import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, ArrowLeftRight, MessageCircle, TrendingUp } from "lucide-react";

const navItems = [
  { path: "/", label: "الرئيسية", icon: Home },
  { path: "/transactions", label: "المعاملات", icon: ArrowLeftRight },
  { path: "/chat", label: "المحادثة", icon: MessageCircle },
  { path: "/investments", label: "الاستثمارات", icon: TrendingUp },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t" style={{ background: "#0f1525", borderColor: "#1e2a45" }}>
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all"
            >
              <div className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all ${isActive ? "bg-indigo-600" : ""}`}>
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-500"}`} />
              </div>
              <span className={`text-[10px] font-medium ${isActive ? "text-indigo-400" : "text-slate-600"}`}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}