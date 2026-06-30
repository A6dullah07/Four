import React, { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown, Hash, Upload, Building2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import TransactionForm from "@/components/transactions/TransactionForm";
import CategoryPieChart from "@/components/transactions/CategoryPieChart";
import CsvImport from "@/components/transactions/CsvImport";
import PlaidConnect from "@/components/plaid/PlaidConnect";

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
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [showPlaid, setShowPlaid] = useState(false);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      let filter = {};
      if (period !== null) {
        const from = new Date();
        from.setDate(from.getDate() - period);
        filter.date = { $gte: from.toISOString().split("T")[0] };
      }
      const data = await base44.entities.Transaction.filter(filter, "-date", 500);
      setTransactions(data);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { loadTransactions(); }, [loadTransactions]);

  const handleDelete = async (id) => {
    if (!confirm("هل أنت متأكد من حذف هذه المعاملة؟")) return;
    await base44.entities.Transaction.delete(id);
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const handleEdit = (tx) => { setEditTx(tx); setShowForm(true); };
  const handleAdd = () => { setEditTx(null); setShowForm(true); };
  const handleSave = () => { setShowForm(false); setEditTx(null); loadTransactions(); };

  const totalIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + (t.amount || 0), 0);
  const totalExpenses = transactions.filter(t => t.type === "expense").reduce((s, t) => s + (t.amount || 0), 0);
  const fmt = v => v.toLocaleString("ar-SA", { minimumFractionDigits: 0 }) + " ر.س";

  return (
    <div dir="rtl" className="min-h-screen" style={{ background: "#111318" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #4f46e5 50%, #7c3aed 100%)" }} className="px-5 pt-12 pb-6 rounded-b-3xl relative overflow-hidden">
        <div className="absolute -top-8 -left-8 w-36 h-36 rounded-full opacity-10 bg-white" />
        <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full opacity-10 bg-white" />
        <div className="relative z-10 flex items-center justify-between mb-5">
          <div>
            <h1 className="text-white text-xl font-bold">المعاملات</h1>
            <p className="text-blue-200 text-xs mt-0.5">سجّل وتابع إنفاقك ودخلك</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPlaid(s => !s)}
              className="flex items-center gap-1 text-white text-xs font-bold px-3 py-2.5 rounded-xl"
              style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(4px)" }}
            >
              <Building2 className="w-3.5 h-3.5" />
              بنك
            </button>
            <button
              onClick={() => setShowCsvImport(true)}
              className="flex items-center gap-1 text-white text-xs font-bold px-3 py-2.5 rounded-xl"
              style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(4px)" }}
            >
              <Upload className="w-3.5 h-3.5" />
              CSV
            </button>
            <button
              onClick={handleAdd}
              className="flex items-center gap-1.5 text-white text-xs font-bold px-4 py-2.5 rounded-xl"
              style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(4px)" }}
            >
              <Plus className="w-3.5 h-3.5" />
              إضافة
            </button>
          </div>
        </div>

        {/* Period filter */}
        <div className="relative z-10 flex gap-1 rounded-2xl p-1" style={{ background: "rgba(0,0,0,0.2)" }}>
          {PERIOD_OPTIONS.map(opt => (
            <button
              key={opt.label}
              onClick={() => setPeriod(opt.days)}
              className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
              style={period === opt.days
                ? { background: "white", color: "#4f46e5" }
                : { color: "rgba(255,255,255,0.6)" }
              }
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="px-4 grid grid-cols-3 gap-3 mt-4 mb-4">
        <div className="rounded-2xl p-3 text-center" style={{ background: "#1a1d27" }}>
          <TrendingDown className="w-4 h-4 text-red-400 mx-auto mb-1" />
          <p className="text-[10px] text-slate-500 mb-0.5">مصروفات</p>
          <p className="text-xs font-bold text-red-400">{fmt(totalExpenses)}</p>
        </div>
        <div className="rounded-2xl p-3 text-center" style={{ background: "#1a1d27" }}>
          <TrendingUp className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
          <p className="text-[10px] text-slate-500 mb-0.5">دخل</p>
          <p className="text-xs font-bold text-emerald-400">{fmt(totalIncome)}</p>
        </div>
        <div className="rounded-2xl p-3 text-center" style={{ background: "#1a1d27" }}>
          <Hash className="w-4 h-4 text-slate-400 mx-auto mb-1" />
          <p className="text-[10px] text-slate-500 mb-0.5">عدد</p>
          <p className="text-xs font-bold text-slate-300">{transactions.length}</p>
        </div>
      </div>

      {/* Plaid connect panel */}
      {showPlaid && (
        <div className="px-4 mb-2">
          <PlaidConnect onImported={() => { loadTransactions(); setShowPlaid(false); }} />
        </div>
      )}

      {/* Tabs */}
      <div className="mx-4 mb-4 flex gap-1 rounded-2xl p-1" style={{ background: "#1a1d27" }}>
        <button
          onClick={() => setActiveTab("list")}
          className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
          style={activeTab === "list" ? { background: "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "white" } : { color: "#64748b" }}
        >
          القائمة
        </button>
        <button
          onClick={() => setActiveTab("chart")}
          className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
          style={activeTab === "chart" ? { background: "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "white" } : { color: "#64748b" }}
        >
          المخطط البياني
        </button>
      </div>

      {/* Content */}
      <div className="px-4 pb-4">
        {activeTab === "chart" ? (
          <CategoryPieChart transactions={transactions} />
        ) : loading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-4 border-slate-700 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-slate-400 text-sm font-medium">لا توجد معاملات</p>
            <p className="text-slate-600 text-xs mt-1">اضغط "إضافة معاملة" لتسجيل أول معاملة</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map(tx => (
              <div
                key={tx.id}
                className="flex items-center gap-3 p-4 rounded-2xl"
                style={{ background: "#1a1d27" }}
              >
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: "#252836" }}>
                  {CATEGORY_ICONS[tx.category] || "💰"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{tx.merchant_name}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{tx.category || "أخرى"} · {tx.date}</p>
                </div>
                <div className="text-left flex-shrink-0 ml-1">
                  <p className={`text-sm font-bold ${tx.type === "income" ? "text-emerald-400" : "text-red-400"}`}>
                    {tx.type === "income" ? "+" : "-"}{(tx.amount || 0).toLocaleString("ar-SA")}
                  </p>
                  <p className="text-slate-600 text-[10px] text-left">{tx.currency || "SAR"}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => handleEdit(tx)} className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: "#252836" }}>
                    <Pencil className="w-3 h-3 text-indigo-400" />
                  </button>
                  <button onClick={() => handleDelete(tx.id)} className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: "#252836" }}>
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
      {showCsvImport && (
        <CsvImport
          onDone={loadTransactions}
          onClose={() => setShowCsvImport(false)}
        />
      )}
    </div>
  );
}