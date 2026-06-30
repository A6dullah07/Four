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
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${
                isActive
                  ? "text-indigo-600"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[11px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}