import React, { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import TransactionForm from "@/components/transactions/TransactionForm";
import CategoryPieChart from "@/components/transactions/CategoryPieChart";

const PERIOD_OPTIONS = [
  { label: "آخر 30 يوم", days: 30 },
  { label: "آخر 90 يوم", days: 90 },
  { label: "كل الوقت", days: null },
];

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);
  const [showForm, setShowForm] = useState(false);
  const [editTx, setEditTx] = useState(null);

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
    <div dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-l from-[#1e3a8a] to-[#7c3aed] px-5 pt-12 pb-8 rounded-b-3xl">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">المعاملات</h1>
          <button
            onClick={handleAdd}
            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-sm font-medium px-3 py-1.5 rounded-xl transition"
          >
            <Plus className="w-4 h-4" />
            إضافة معاملة
          </button>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {/* Period filter */}
        <div className="flex gap-2">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              onClick={() => setPeriod(opt.days)}
              className={`flex-1 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                period === opt.days
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Summary bar */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center">
            <p className="text-[10px] text-gray-400 mb-1">المصروفات</p>
            <p className="text-sm font-bold text-red-500">{fmt(totalExpenses)}</p>
          </div>
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center">
            <p className="text-[10px] text-gray-400 mb-1">الدخل</p>
            <p className="text-sm font-bold text-emerald-500">{fmt(totalIncome)}</p>
          </div>
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center">
            <p className="text-[10px] text-gray-400 mb-1">عدد المعاملات</p>
            <p className="text-sm font-bold text-gray-700">{transactions.length}</p>
          </div>
        </div>

        {/* Pie chart */}
        <CategoryPieChart transactions={transactions} />

        {/* Transaction list */}
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-7 h-7 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <p className="text-gray-400 text-sm">لا توجد معاملات في هذه الفترة</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {transactions.map((tx, idx) => (
              <div
                key={tx.id}
                className={`flex items-center gap-3 px-4 py-3 ${idx !== 0 ? "border-t border-gray-50" : ""}`}
              >
                {/* Type indicator */}
                <div className={`w-1.5 h-10 rounded-full flex-shrink-0 ${tx.type === "income" ? "bg-emerald-400" : "bg-red-400"}`} />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{tx.merchant_name}</p>
                  <p className="text-xs text-gray-400">{tx.category} · {tx.date}</p>
                </div>

                {/* Amount */}
                <p className={`text-sm font-bold flex-shrink-0 ${tx.type === "income" ? "text-emerald-500" : "text-red-500"}`}>
                  {tx.type === "income" ? "+" : "-"}{(tx.amount || 0).toLocaleString("ar-SA")} {tx.currency || "ر.س"}
                </p>

                {/* Actions */}
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => handleEdit(tx)} className="text-gray-300 hover:text-indigo-500 p-1">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(tx.id)} className="text-gray-300 hover:text-red-500 p-1">
                    <Trash2 className="w-4 h-4" />
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