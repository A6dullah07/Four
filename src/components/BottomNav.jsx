import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, CreditCard, ShoppingCart, Grid } from "lucide-react";

const navItems = [
  { path: "/", label: "الرئيسية", icon: Home },
  { path: "/transactions", label: "المعاملات", icon: CreditCard },
  { path: "/chat", label: "المحادثة", icon: ShoppingCart },
  { path: "/investments", label: "المزيد", icon: Grid },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50" style={{ background: "#1a1d27", borderTop: "1px solid #252836" }}>
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link key={item.path} to={item.path} className="flex flex-col items-center gap-1 px-4 py-2">
              <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-500"}`} />
              <span className={`text-[10px] font-medium ${isActive ? "text-white" : "text-slate-600"}`}>{item.label}</span>
              {isActive && <div className="w-4 h-0.5 rounded-full" style={{ background: "#6366f1" }} />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}