import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Bell, Plus, Eye, EyeOff, TrendingUp, TrendingDown } from "lucide-react";

const quickActions = [
  { emoji: "💸", label: "تحويل محلي" },
  { emoji: "🔄", label: "شحن رصيد" },
  { emoji: "📄", label: "دفع فواتير" },
  { emoji: "🌍", label: "تحويل دولي" },
  { emoji: "🏦", label: "تحويل بنكي" },
  { emoji: "👥", label: "رواتب" },
];

const trendingServices = [
  { bg: "linear-gradient(135deg, #22c55e, #16a34a)", title: "دفع الفواتير", desc: "ادفع كل فواتيرك في مكان واحد.", cta: "اضغط للمزيد ←" },
  { bg: "linear-gradient(135deg, #6366f1, #7c3aed)", title: "نقاط المكافآت", desc: "حوّل نقاطك إلى مزايا حصرية!", cta: "اضغط للمزيد ←" },
];

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
  const fmt = (v) => v.toLocaleString("ar-SA", { minimumFractionDigits: 2 });
  const firstName = user?.full_name?.split(" ")[0] || "مستخدم";
  const initials = firstName.charAt(0).toUpperCase();

  return (
    <div dir="rtl" className="min-h-screen overflow-x-hidden" style={{ background: "#111318" }}>

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-4 pt-12 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm relative" style={{ background: "linear-gradient(135deg,#6366f1,#7c3aed)" }}>
            {initials}
            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#111318]" />
          </div>
          <div>
            <p className="text-slate-400 text-xs">مرحباً 👋</p>
            <p className="text-white font-bold text-sm leading-tight">{firstName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Spin button */}
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white" style={{ background: "linear-gradient(135deg,#06b6d4,#7c3aed)" }}>
            🎯 سبين
          </button>
          <button className="w-10 h-10 rounded-full flex items-center justify-center relative" style={{ background: "#1e2130" }}>
            <Bell className="w-4 h-4 text-slate-300" />
          </button>
        </div>
      </div>

      {/* ── Balance Card ── */}
      <div className="mx-4 mt-2 rounded-3xl p-5" style={{ background: "#1a1d27" }}>
        {/* Account Balance row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-xs">رصيد الحساب</span>
            <button onClick={() => setBalanceVisible(v => !v)} className="text-slate-500">
              {balanceVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
          </div>
          <button className="flex items-center gap-1 px-4 py-1.5 rounded-full text-xs font-bold text-white" style={{ background: "linear-gradient(135deg,#6366f1,#7c3aed)" }}>
            <Plus className="w-3 h-3" /> إضافة رصيد
          </button>
        </div>

        {/* Big Balance */}
        {loading ? (
          <div className="h-10 w-36 rounded-xl mb-3 animate-pulse" style={{ background: "#2a2d3a" }} />
        ) : (
          <p className="text-white text-4xl font-bold tracking-tight mb-3">
            {balanceVisible ? fmt(savings) : "••••••"}
            <span className="text-slate-400 text-base font-normal mr-1">ر.س</span>
          </p>
        )}

        {/* Remaining amount */}
        <div className="border-t border-dashed mb-4" style={{ borderColor: "#2a2d3a" }} />
        <div className="flex items-center justify-between text-xs mb-4">
          <span className="text-slate-500">المبلغ المتبقي</span>
          <div className="flex gap-3">
            <span className="text-slate-300 font-semibold">{balanceVisible ? fmt(stats.income) : "••••"} <span className="text-slate-500 text-[10px]">دخل</span></span>
            <span className="text-slate-300 font-semibold">{balanceVisible ? fmt(stats.expenses) : "••••"} <span className="text-slate-500 text-[10px]">مصروف</span></span>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-3 gap-3">
          {quickActions.map(({ emoji, label }) => (
            <button key={label} className="flex flex-col items-center gap-1.5 py-2">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background: "#252836" }}>
                {emoji}
              </div>
              <span className="text-slate-400 text-[10px] text-center leading-tight">{label}</span>
            </button>
          ))}
        </div>

        {/* Dots indicator */}
        <div className="flex justify-center gap-1.5 mt-4">
          <div className="h-1 w-6 rounded-full" style={{ background: "#6366f1" }} />
          <div className="h-1 w-3 rounded-full" style={{ background: "#2a2d3a" }} />
        </div>
      </div>

      {/* ── Alinma Pay Logo strip ── */}
      <div className="flex justify-center my-4">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-lg" style={{ background: "linear-gradient(135deg,#06b6d4,#6366f1,#7c3aed)" }}>
          م
        </div>
      </div>

      {/* ── Trending Services ── */}
      <div className="mx-4 mb-6">
        <p className="text-slate-400 text-sm font-semibold mb-3">الخدمات الرائجة</p>
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          {trendingServices.map((s) => (
            <div
              key={s.title}
              className="flex-shrink-0 w-52 rounded-2xl p-4 relative overflow-hidden"
              style={{ background: s.bg }}
            >
              <p className="text-white font-bold text-sm mb-1">{s.title}</p>
              <p className="text-white/70 text-xs mb-3">{s.desc}</p>
              <p className="text-white text-xs font-semibold">{s.cta}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}