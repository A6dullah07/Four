import React, { useState, useEffect } from "react";
import { Target, Plus, ChevronDown, ChevronUp, Trash2, X, Activity } from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from "react-markdown";
import PlanForm from "@/components/plan/PlanForm";
import PlanChart from "@/components/plan/PlanChart";

function PlanCard({ plan, onDelete }) {
  const [open, setOpen] = useState(false);

  // Try to parse stored chartData from notes if present
  let chartData = null;
  let notes = plan.notes || "";
  const chartMatch = notes.match(/\[CHART_DATA\]([\s\S]*?)(?:\[\/CHART_DATA\]|$)/);
  if (chartMatch) {
    try { chartData = JSON.parse(chartMatch[1].trim().replace(/```json|```/g, "").trim()); } catch { }
    notes = notes.replace(/\[CHART_DATA\][\s\S]*$/, "").trim();
  }
  // Use plan's own chart data if passed directly
  if (plan.chartData) chartData = plan.chartData;

  const date = plan.created_date
    ? new Date(plan.created_date).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" })
    : "";

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#1a1d27" }}>
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-4 py-4">
        <div className="text-right flex-1 min-w-0">
          <p className="text-white text-sm font-bold truncate">{plan.title}</p>
          <p className="text-slate-500 text-xs mt-0.5">
            {plan.total_amount ? `${plan.total_amount.toLocaleString("ar-SA")} ر.س` : ""}
            {plan.months ? ` · ${plan.months} شهر` : ""}
            {date ? ` · ${date}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 mr-2">
          <button
            onClick={e => { e.stopPropagation(); onDelete(plan.id); }}
            className="w-7 h-7 rounded-xl flex items-center justify-center"
            style={{ background: "#252836" }}
          >
            <Trash2 className="w-3 h-3 text-red-400" />
          </button>
          {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t" style={{ borderColor: "#252836" }}>
          <div className="pt-4">
            <PlanChart
              chartData={chartData}
              totalAmount={plan.total_amount}
              monthlyIncome={plan.monthly_income}
              monthlyExpenses={plan.monthly_expenses}
            />
          </div>
          {notes && (
            <ReactMarkdown
              className="prose prose-sm prose-invert max-w-none"
              components={{
                p: ({ children }) => <p className="mb-2 text-slate-200 text-sm leading-relaxed">{children}</p>,
                strong: ({ children }) => <strong className="text-white font-bold">{children}</strong>,
                h2: ({ children }) => <h2 className="text-indigo-300 font-bold text-sm mt-4 mb-1">{children}</h2>,
                h3: ({ children }) => <h3 className="text-indigo-200 font-semibold text-sm mt-3 mb-1">{children}</h3>,
                ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 my-2">{children}</ol>,
                li: ({ children }) => <li className="text-slate-300 text-sm">{children}</li>,
              }}
            >
              {notes}
            </ReactMarkdown>
          )}
        </div>
      )}
    </div>
  );
}

export default function FinancialPlan() {
  const [plans, setPlans] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    base44.entities.FinancialPlan.list("-created_date", 20)
      .then(setPlans)
      .finally(() => setLoadingHistory(false));
  }, []);

  const handlePlanCreated = (plan) => {
    setPlans(prev => [plan, ...prev]);
    setShowForm(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("هل تريد حذف هذه الخطة؟")) return;
    await base44.entities.FinancialPlan.delete(id);
    setPlans(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div dir="rtl" className="min-h-screen" style={{ background: "#111318" }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-6 relative overflow-hidden" style={{ background: "linear-gradient(135deg,#1e3a8a,#7c3aed)" }}>
        <div className="absolute -top-8 -left-8 w-36 h-36 rounded-full opacity-10 bg-white" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-white text-xl font-bold">الخطة المالية</h1>
            <p className="text-blue-200 text-xs mt-0.5">سداد الديون وأهداف الادخار بالذكاء الاصطناعي</p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/plan-tracker"
              className="flex items-center gap-1.5 text-white text-xs font-bold px-3 py-2.5 rounded-xl"
              style={{ background: "rgba(255,255,255,0.15)" }}
            >
              <Activity className="w-3.5 h-3.5" />
              متابعة
            </Link>
            <button
              onClick={() => setShowForm(s => !s)}
              className="flex items-center gap-1.5 text-white text-xs font-bold px-4 py-2.5 rounded-xl"
              style={{ background: "rgba(255,255,255,0.2)" }}
            >
              {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              {showForm ? "إلغاء" : "خطة جديدة"}
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 space-y-5">
        {/* Form */}
        {showForm && (
          <div className="rounded-2xl p-4" style={{ background: "#1a1d27" }}>
            <p className="text-white font-bold text-sm mb-4">أنشئ خطة سداد أو ادخار</p>
            <PlanForm onPlanCreated={handlePlanCreated} />
          </div>
        )}

        {/* Plans list */}
        {loadingHistory ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-4 border-slate-700 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : plans.length === 0 && !showForm ? (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "#1a1d27" }}>
              <Target className="w-7 h-7 text-indigo-400" />
            </div>
            <p className="text-white font-bold mb-1">لا توجد خطط مالية</p>
            <p className="text-slate-500 text-sm mb-5">اضغط "خطة جديدة" لإنشاء خطة ادخار أو سداد دين</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 rounded-2xl font-bold text-white text-sm flex items-center gap-2"
              style={{ background: "linear-gradient(135deg,#1e3a8a,#7c3aed)" }}
            >
              <Plus className="w-4 h-4" />
              أنشئ خطتك الأولى
            </button>
          </div>
        ) : plans.length > 0 ? (
          <div className="space-y-3">
            {!showForm && <p className="text-slate-500 text-xs font-semibold">خططك المالية ({plans.length})</p>}
            {plans.map((p, i) => (
              <PlanCard key={p.id} plan={p} onDelete={handleDelete} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}