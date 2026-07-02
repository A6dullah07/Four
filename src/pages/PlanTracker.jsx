import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Circle, TrendingUp, Target, Plus, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

const MONTHS_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

export default function PlanTracker() {
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [milestones, setMilestones] = useState([]);
  const [newMilestone, setNewMilestone] = useState("");
  const [showAddMilestone, setShowAddMilestone] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [ps, txns, cfg] = await Promise.all([
          base44.entities.FinancialPlan.list("-created_date", 20),
          base44.entities.Transaction.filter(
            { date: { $gte: new Date(Date.now() - 90 * 86400000).toISOString().split("T")[0] } },
            "-date", 200
          ),
          base44.entities.UserSettings.list(),
        ]);
        setPlans(ps);
        if (ps.length > 0) setSelectedPlan(ps[0]);
        setTransactions(txns);
        setSettings(cfg?.[0] || null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Load milestones from localStorage keyed by plan id
  useEffect(() => {
    if (!selectedPlan) return;
    const saved = localStorage.getItem(`milestones_${selectedPlan.id}`);
    setMilestones(saved ? JSON.parse(saved) : []);
  }, [selectedPlan]);

  const saveMilestones = (items) => {
    setMilestones(items);
    if (selectedPlan) localStorage.setItem(`milestones_${selectedPlan.id}`, JSON.stringify(items));
  };

  const addMilestone = () => {
    if (!newMilestone.trim()) return;
    const updated = [...milestones, { id: Date.now(), text: newMilestone.trim(), done: false }];
    saveMilestones(updated);
    setNewMilestone("");
    setShowAddMilestone(false);
  };

  const toggleMilestone = (id) => {
    saveMilestones(milestones.map(m => m.id === id ? { ...m, done: !m.done } : m));
  };

  const deleteMilestone = (id) => {
    saveMilestones(milestones.filter(m => m.id !== id));
  };

  // ── Computed stats ──────────────────────────────────────────────────────────
  const currency = settings?.currency || "SAR";
  const monthlyIncome = settings?.monthly_income || 0;

  // Monthly expense breakdown (last 6 months)
  const monthlyChart = (() => {
    const map = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map[key] = { month: MONTHS_AR[d.getMonth()], expenses: 0, income: 0 };
    }
    transactions.forEach(t => {
      const key = t.date?.slice(0, 7);
      if (map[key]) {
        if (t.type === "expense") map[key].expenses += t.amount || 0;
        else map[key].income += t.amount || 0;
      }
    });
    return Object.values(map);
  })();

  const totalExpenses90 = transactions.filter(t => t.type === "expense").reduce((s, t) => s + (t.amount || 0), 0);
  const totalIncome90 = transactions.filter(t => t.type === "income").reduce((s, t) => s + (t.amount || 0), 0);
  const avgMonthlyExpense = totalExpenses90 / 3;
  const savingsRate = (monthlyIncome || totalIncome90 / 3) > 0
    ? Math.round(((((monthlyIncome || totalIncome90 / 3) - avgMonthlyExpense) / (monthlyIncome || totalIncome90 / 3)) * 100))
    : 0;

  // Plan progress
  const planProgress = (() => {
    if (!selectedPlan?.total_amount || !selectedPlan?.monthly_payment) return null;
    const elapsed = selectedPlan.months
      ? Math.round((Date.now() - new Date(selectedPlan.created_date).getTime()) / (30 * 86400000))
      : 0;
    const paid = Math.min(elapsed * selectedPlan.monthly_payment, selectedPlan.total_amount);
    const pct = Math.round((paid / selectedPlan.total_amount) * 100);
    const remaining = selectedPlan.total_amount - paid;
    return { paid, remaining, pct: Math.min(pct, 100) };
  })();

  const fmt = v => v.toLocaleString("ar-SA", { maximumFractionDigits: 0 }) + " " + currency;
  const doneMilestones = milestones.filter(m => m.done).length;

  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center" style={{ background: "#111318" }}>
        <div className="w-7 h-7 border-4 border-slate-700 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen pb-24" style={{ background: "#111318" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#1e3a8a,#7c3aed)" }} className="px-5 pt-12 pb-6 relative overflow-hidden rounded-b-3xl">
        <div className="absolute -top-8 -left-8 w-36 h-36 rounded-full opacity-10 bg-white" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-white text-xl font-bold">متابعة الخطة المالية</h1>
            <p className="text-blue-200 text-xs mt-0.5">تابع تقدمك نحو أهدافك المالية</p>
          </div>
          <Link to="/plan" className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)" }}>
            <ArrowRight className="w-4 h-4 text-white" />
          </Link>
        </div>
      </div>

      <div className="px-4 py-5 space-y-4">

        {/* Plan selector */}
        {plans.length > 1 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {plans.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedPlan(p)}
                className="whitespace-nowrap text-xs px-3 py-2 rounded-xl font-semibold flex-shrink-0 transition-all"
                style={selectedPlan?.id === p.id
                  ? { background: "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "white" }
                  : { background: "#1a1d27", color: "#64748b", border: "1px solid #2e3347" }
                }
              >
                {p.title}
              </button>
            ))}
          </div>
        )}

        {plans.length === 0 && (
          <div className="flex flex-col items-center py-16 text-center">
            <Target className="w-10 h-10 text-slate-600 mb-3" />
            <p className="text-white font-bold mb-1">لا توجد خطط مالية بعد</p>
            <p className="text-slate-500 text-sm mb-5">أنشئ خطة مالية أولاً لتتمكن من متابعتها</p>
            <Link to="/plan" className="px-5 py-3 rounded-2xl font-bold text-white text-sm" style={{ background: "linear-gradient(135deg,#1e3a8a,#7c3aed)" }}>
              إنشاء خطة
            </Link>
          </div>
        )}

        {/* Plan progress card */}
        {selectedPlan && planProgress && (
          <div className="rounded-2xl p-4" style={{ background: "#1a1d27" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-white font-bold text-sm">{selectedPlan.title}</span>
              <span className="text-indigo-400 font-bold text-sm">{planProgress.pct}%</span>
            </div>
            <div className="w-full h-3 rounded-full mb-3" style={{ background: "#252836" }}>
              <div
                className="h-3 rounded-full transition-all"
                style={{ width: `${planProgress.pct}%`, background: "linear-gradient(90deg,#4f46e5,#7c3aed)" }}
              />
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[10px] text-slate-500 mb-0.5">المدفوع</p>
                <p className="text-emerald-400 text-xs font-bold">{fmt(planProgress.paid)}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 mb-0.5">المتبقي</p>
                <p className="text-red-400 text-xs font-bold">{fmt(planProgress.remaining)}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 mb-0.5">شهرياً</p>
                <p className="text-slate-300 text-xs font-bold">{fmt(selectedPlan.monthly_payment)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Key metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl p-4" style={{ background: "#1a1d27" }}>
            <TrendingUp className="w-4 h-4 text-emerald-400 mb-2" />
            <p className="text-[10px] text-slate-500 mb-0.5">معدل الادخار</p>
            <p className="text-white font-bold text-lg">{savingsRate}%</p>
            <p className="text-[10px] text-slate-600 mt-0.5">الهدف: 20%+</p>
          </div>
          <div className="rounded-2xl p-4" style={{ background: "#1a1d27" }}>
            <Target className="w-4 h-4 text-indigo-400 mb-2" />
            <p className="text-[10px] text-slate-500 mb-0.5">متوسط الإنفاق / شهر</p>
            <p className="text-white font-bold text-lg">{fmt(avgMonthlyExpense)}</p>
            <p className="text-[10px] text-slate-600 mt-0.5">آخر 3 أشهر</p>
          </div>
        </div>

        {/* Monthly trend chart */}
        <div className="rounded-2xl p-4" style={{ background: "#1a1d27" }}>
          <p className="text-white font-bold text-sm mb-4">الإنفاق الشهري (آخر 6 أشهر)</p>
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={monthlyChart}>
              <defs>
                <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: "#252836", border: "none", borderRadius: 8, fontSize: 11, color: "white" }}
                formatter={v => [v.toLocaleString("ar-SA") + " " + currency, "مصروف"]}
              />
              <Area type="monotone" dataKey="expenses" stroke="#f43f5e" strokeWidth={2} fill="url(#expGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Milestones checklist */}
        <div className="rounded-2xl p-4" style={{ background: "#1a1d27" }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-white font-bold text-sm">خطوات الخطة</p>
              {milestones.length > 0 && (
                <p className="text-slate-500 text-[10px] mt-0.5">{doneMilestones} من {milestones.length} مكتملة</p>
              )}
            </div>
            <button
              onClick={() => setShowAddMilestone(s => !s)}
              className="w-7 h-7 rounded-xl flex items-center justify-center"
              style={{ background: "#252836" }}
            >
              <Plus className="w-3.5 h-3.5 text-indigo-400" />
            </button>
          </div>

          {showAddMilestone && (
            <div className="flex gap-2 mb-3">
              <input
                value={newMilestone}
                onChange={e => setNewMilestone(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addMilestone()}
                placeholder="أضف خطوة..."
                className="flex-1 text-sm text-white rounded-xl px-3 py-2 outline-none"
                style={{ background: "#252836", border: "1px solid #3e4459" }}
              />
              <button onClick={addMilestone} className="px-3 py-2 rounded-xl text-xs font-bold text-white" style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}>
                إضافة
              </button>
            </div>
          )}

          {milestones.length === 0 ? (
            <p className="text-slate-600 text-xs text-center py-4">أضف خطوات لمتابعة تقدمك نحو الهدف</p>
          ) : (
            <div className="space-y-2">
              {milestones.map(m => (
                <div key={m.id} className="flex items-center gap-2.5">
                  <button onClick={() => toggleMilestone(m.id)} className="flex-shrink-0">
                    {m.done
                      ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      : <Circle className="w-5 h-5 text-slate-600" />
                    }
                  </button>
                  <span className={`flex-1 text-sm ${m.done ? "line-through text-slate-500" : "text-slate-300"}`}>{m.text}</span>
                  <button onClick={() => deleteMilestone(m.id)}>
                    <Trash2 className="w-3.5 h-3.5 text-slate-700" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {milestones.length > 0 && (
            <div className="mt-3 w-full h-1.5 rounded-full" style={{ background: "#252836" }}>
              <div
                className="h-1.5 rounded-full transition-all"
                style={{ width: `${milestones.length > 0 ? Math.round((doneMilestones / milestones.length) * 100) : 0}%`, background: "linear-gradient(90deg,#10b981,#06b6d4)" }}
              />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}