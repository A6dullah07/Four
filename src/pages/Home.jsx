import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Bell, Eye, EyeOff, TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownLeft, BarChart3, Send } from "lucide-react";

export default function Home() {
  const [stats, setStats] = useState({ income: 0, expenses: 0 });
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [balanceVisible, setBalanceVisible] = useState(true);

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
        txns.forEach((t) => {
          if (t.type === "income") income += t.amount || 0;
          else expenses += t.amount || 0;
        });
        setStats({ income, expenses });
      } catch (e) {
        const me = await base44.auth.me().catch(() => null);
        setUser(me);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const savings = stats.income - stats.expenses;
  const savingsRate = stats.income > 0 ? Math.round((savings / stats.income) * 100) : 0;
  const fmt = (v) => v.toLocaleString("ar-SA", { minimumFractionDigits: 2 });
  const firstName = user?.full_name?.split(" ")[0] || "مستخدم";

  const quickActions = [
    { icon: Send, label: "تحويل" },
    { icon: ArrowDownLeft, label: "استلام" },
    { icon: BarChart3, label: "تحليل" },
    { icon: Wallet, label: "محفظة" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#0a0e1a" }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4">
        <div>
          <p className="text-slate-400 text-xs">مرحباً بك 👋</p>
          <h2 className="text-white font-bold text-lg">{firstName}</h2>
        </div>
        <button className="relative w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "#1a2340" }}>
          <Bell className="w-5 h-5 text-slate-300" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full"></span>
        </button>
      </div>

      {/* Balance Card */}
      <div className="mx-4 mb-5 rounded-3xl p-6 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #4f46e5 50%, #7c3aed 100%)" }}>
        {/* Decorative circles */}
        <div className="absolute -top-8 -left-8 w-40 h-40 rounded-full opacity-10" style={{ background: "white" }} />
        <div className="absolute -bottom-10 -right-6 w-36 h-36 rounded-full opacity-10" style={{ background: "white" }} />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-1">
            <span className="text-blue-200 text-xs">المدخرات الحالية</span>
            <button onClick={() => setBalanceVisible((v) => !v)} className="text-blue-200">
              {balanceVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>
          <div className="mb-4">
            {loading ? (
              <div className="h-9 w-32 bg-white/20 rounded-xl animate-pulse" />
            ) : (
              <p className="text-white text-3xl font-bold tracking-tight">
                {balanceVisible ? fmt(savings) : "••••••"} <span className="text-lg font-normal text-blue-200">ر.س</span>
              </p>
            )}
          </div>

          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div>
                <p className="text-blue-200 text-[10px]">الدخل</p>
                <p className="text-white text-sm font-semibold">{balanceVisible ? fmt(stats.income) : "••••"} ر.س</p>
              </div>
            </div>
            <div className="w-px bg-white/20" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-red-500/20 flex items-center justify-center">
                <TrendingDown className="w-3.5 h-3.5 text-red-400" />
              </div>
              <div>
                <p className="text-blue-200 text-[10px]">المصروفات</p>
                <p className="text-white text-sm font-semibold">{balanceVisible ? fmt(stats.expenses) : "••••"} ر.س</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mx-4 mb-5 rounded-2xl p-4" style={{ background: "#0f1525" }}>
        <div className="grid grid-cols-4 gap-2">
          {quickActions.map(({ icon: Icon, label }) => (
            <button key={label} className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "#1a2340" }}>
                <Icon className="w-5 h-5 text-indigo-400" />
              </div>
              <span className="text-slate-400 text-[11px]">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Savings Rate Card */}
      <div className="mx-4 rounded-2xl p-4" style={{ background: "#0f1525" }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-slate-300 text-sm font-semibold">نسبة الادخار هذا الشهر</span>
          <span className={`text-sm font-bold ${savingsRate >= 0 ? "text-emerald-400" : "text-red-400"}`}>{savingsRate}%</span>
        </div>
        <div className="w-full rounded-full h-2" style={{ background: "#1a2340" }}>
          <div
            className="h-2 rounded-full transition-all"
            style={{ width: `${Math.min(Math.max(savingsRate, 0), 100)}%`, background: "linear-gradient(90deg, #4f46e5, #7c3aed)" }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-slate-600 text-[10px]">0%</span>
          <span className="text-slate-600 text-[10px]">100%</span>
        </div>
      </div>
    </div>
  );
}