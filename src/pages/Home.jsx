import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { TrendingUp, TrendingDown, Wallet, PiggyBank, MessageCircle, Bell, Eye, EyeOff } from "lucide-react";

export default function Home() {
  const [stats, setStats] = useState({ income: 0, expenses: 0 });
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [me, txns] = await Promise.all([
          base44.auth.me(),
          base44.entities.Transaction.filter({
            date: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0] }
          })
        ]);
        setUser(me);
        let income = 0, expenses = 0;
        txns.forEach(t => { if (t.type === "income") income += t.amount || 0; else expenses += t.amount || 0; });
        setStats({ income, expenses });
      } catch { } finally { setLoading(false); }
    };
    load();
  }, []);

  const savings = stats.income - stats.expenses;
  const rate = stats.income > 0 ? Math.round((savings / stats.income) * 100) : 0;
  const fmt = v => visible ? v.toLocaleString("ar-SA", { minimumFractionDigits: 0 }) + " ر.س" : "••••";
  const firstName = user?.full_name?.split(" ")[0] || "مستخدم";
  const initials = firstName.charAt(0);

  const cards = [
    { label: "دخل هذا الشهر", value: fmt(stats.income), icon: TrendingUp, color: "#10b981", bg: "rgba(16,185,129,0.1)" },
    { label: "مصاريف هذا الشهر", value: fmt(stats.expenses), icon: TrendingDown, color: "#f43f5e", bg: "rgba(244,63,94,0.1)" },
    { label: "المدخرات", value: fmt(savings), icon: Wallet, color: "#6366f1", bg: "rgba(99,102,241,0.1)" },
    { label: "نسبة الادخار", value: visible ? `${rate}%` : "••", icon: PiggyBank, color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  ];

  return (
    <div dir="rtl" className="min-h-screen" style={{ background: "#111318" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #4f46e5 50%, #7c3aed 100%)" }} className="px-5 pt-12 pb-16 rounded-b-3xl relative overflow-hidden">
        <div className="absolute -top-10 -left-10 w-44 h-44 rounded-full opacity-10 bg-white" />
        <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full opacity-10 bg-white" />
        <div className="relative z-10 flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm" style={{ background: "rgba(255,255,255,0.2)" }}>
              {initials}
            </div>
            <div>
              <p className="text-blue-200 text-xs">مرحباً 👋</p>
              <p className="text-white font-bold text-sm">{firstName}</p>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <button onClick={() => setVisible(v => !v)} className="text-blue-200">
              {visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
            <button className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)" }}>
              <Bell className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
        <div className="relative z-10">
          <p className="text-blue-100 text-xs mb-0.5">المساعد المالي الذكي</p>
          <h1 className="text-white text-xl font-bold leading-snug">تحليل مالي فوري<br />مع نصائح محددة</h1>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="px-4 -mt-8">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-7 h-7 border-4 border-slate-700 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {cards.map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="rounded-2xl p-4" style={{ background: "#1a1d27" }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: bg }}>
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <p className="text-slate-500 text-[11px] mb-1">{label}</p>
                <p className="text-white font-bold text-sm">{value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Savings rate bar */}
      {!loading && stats.income > 0 && (
        <div className="mx-4 mt-4 rounded-2xl p-4" style={{ background: "#1a1d27" }}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-400 text-xs">نسبة الادخار هذا الشهر</span>
            <span className="text-indigo-400 text-xs font-bold">{rate}%</span>
          </div>
          <div className="w-full h-2 rounded-full" style={{ background: "#252836" }}>
            <div className="h-2 rounded-full transition-all" style={{ width: `${Math.min(Math.max(rate, 0), 100)}%`, background: "linear-gradient(90deg,#4f46e5,#7c3aed)" }} />
          </div>
        </div>
      )}

      {/* CTA Button */}
      <div className="mx-4 mt-4">
        <Link to="/assistant" className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-bold text-white text-sm" style={{ background: "linear-gradient(135deg,#1e3a8a,#7c3aed)" }}>
          <MessageCircle className="w-4 h-4" />
          ابدأ المحادثة مع المساعد
        </Link>
      </div>
    </div>
  );
}