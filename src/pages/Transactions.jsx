import React, { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { base44 } from "@/api/base44Client";
import TransactionForm from "@/components/transactions/TransactionForm";
import CategoryPieChart from "@/components/transactions/CategoryPieChart";

const PERIOD_OPTIONS = [
  { label: "30 يوم", days: 30 },
  { label: "90 يوم", days: 90 },
  { label: "الكل", days: null },
];

const CATEGORY_ICONS = {
  "طعام": "🍔", "ترفيه": "🎮", "تسوق": "🛍️", "إيجار": "🏠",
  "فواتير": "💡", "تأمين": "🛡️", "مواصلات": "🚗", "راتب": "💼", "أخرى": "💰"
};

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);
  const [showForm, setShowForm] = useState(false);
  const [editTx, setEditTx] = useState(null);
  const [activeTab, setActiveTab] = useState("list");

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      let filter = {};
      if (period !== null) {
        const from = new Date();
        from.setDate(from.getDate() - period);
        filter.date = { $gte: from.toISOString().split("T")[0] };
      }
      const data = await base44.entities.Transaction.filter(filter, "-date", 200);
      setTransactions(data);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { loadTransactions(); }, [loadTransactions]);

  const handleDelete = async (id) => {
    if (!confirm("هل أنت متأكد من حذف هذه المعاملة؟")) return;
    await base44.entities.Transaction.delete(id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const handleEdit = (tx) => { setEditTx(tx); setShowForm(true); };
  const handleAdd = () => { setEditTx(null); setShowForm(true); };
  const handleSave = () => { setShowForm(false); setEditTx(null); loadTransactions(); };

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + (t.amount || 0), 0);
  const totalExpenses = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + (t.amount || 0), 0);
  const fmt = (v) => v.toLocaleString("ar-SA", { minimumFractionDigits: 0 }) + " ر.س";

  return (
    <div dir="rtl" className="min-h-screen" style={{ background: "#0a0e1a" }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-5">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-white text-xl font-bold">المعاملات</h1>
          <button
            onClick={handleAdd}
            className="flex items-center gap-1.5 text-white text-xs font-medium px-3 py-2 rounded-xl"
            style={{ background: "#4f46e5" }}
          >
            <Plus className="w-3.5 h-3.5" />
            إضافة
          </button>
        </div>

        {/* Period filter */}
        <div className="flex gap-2 rounded-2xl p-1" style={{ background: "#0f1525" }}>
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              onClick={() => setPeriod(opt.days)}
              className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
              style={period === opt.days
                ? { background: "#4f46e5", color: "white" }
                : { color: "#64748b" }
              }
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="px-4 grid grid-cols-3 gap-3 mb-4">
        <div className="rounded-2xl p-3 text-center" style={{ background: "#0f1525" }}>
          <div className="flex justify-center mb-1">
            <TrendingDown className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-[10px] text-slate-500 mb-0.5">مصروفات</p>
          <p className="text-xs font-bold text-red-400">{fmt(totalExpenses)}</p>
        </div>
        <div className="rounded-2xl p-3 text-center" style={{ background: "#0f1525" }}>
          <div className="flex justify-center mb-1">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-[10px] text-slate-500 mb-0.5">دخل</p>
          <p className="text-xs font-bold text-emerald-400">{fmt(totalIncome)}</p>
        </div>
        <div className="rounded-2xl p-3 text-center" style={{ background: "#0f1525" }}>
          <p className="text-[10px] text-slate-500 mb-1 mt-5">عدد</p>
          <p className="text-xs font-bold text-slate-300">{transactions.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-4 flex gap-2 rounded-2xl p-1 mx-4" style={{ background: "#0f1525" }}>
        <button
          onClick={() => setActiveTab("list")}
          className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
          style={activeTab === "list" ? { background: "#1a2340", color: "white" } : { color: "#64748b" }}
        >
          القائمة
        </button>
        <button
          onClick={() => setActiveTab("chart")}
          className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
          style={activeTab === "chart" ? { background: "#1a2340", color: "white" } : { color: "#64748b" }}
        >
          المخطط
        </button>
      </div>

      <div className="px-4">
        {activeTab === "chart" ? (
          <CategoryPieChart transactions={transactions} />
        ) : loading ? (
          <div className="flex justify-center py-12">
            <div className="w-7 h-7 border-4 border-slate-700 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <p className="text-slate-500 text-sm">لا توجد معاملات في هذه الفترة</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center gap-3 p-4 rounded-2xl"
                style={{ background: "#0f1525" }}
              >
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: "#1a2340" }}>
                  {CATEGORY_ICONS[tx.category] || "💰"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{tx.merchant_name}</p>
                  <p className="text-slate-500 text-xs">{tx.category} · {tx.date}</p>
                </div>
                <div className="text-left flex-shrink-0">
                  <p className={`text-sm font-bold ${tx.type === "income" ? "text-emerald-400" : "text-red-400"}`}>
                    {tx.type === "income" ? "+" : "-"}{(tx.amount || 0).toLocaleString("ar-SA")}
                  </p>
                  <p className="text-slate-600 text-[10px] text-left">{tx.currency || "SAR"}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => handleEdit(tx)} className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: "#1a2340" }}>
                    <Pencil className="w-3 h-3 text-indigo-400" />
                  </button>
                  <button onClick={() => handleDelete(tx.id)} className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: "#1a2340" }}>
                    <Trash2 className="w-3 h-3 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <TransactionForm
          transaction={editTx}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditTx(null); }}
        />
      )}
    </div>
  );
}