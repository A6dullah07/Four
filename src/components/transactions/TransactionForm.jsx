import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { base44 } from "@/api/base44Client";

const CATEGORIES = ["طعام", "ترفيه", "تسوق", "إيجار", "فواتير", "تأمين", "مواصلات", "راتب", "أخرى"];

const defaultForm = {
  date: new Date().toISOString().split("T")[0],
  merchant_name: "",
  amount: "",
  currency: "SAR",
  category: "أخرى",
  type: "expense",
};

const inputStyle = {
  background: "#252836",
  border: "1px solid #2e3347",
  borderRadius: 12,
  color: "white",
  width: "100%",
  padding: "11px 14px",
  fontSize: 14,
  outline: "none",
};

export default function TransactionForm({ transaction, onSave, onClose }) {
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (transaction) {
      setForm({
        date: transaction.date || defaultForm.date,
        merchant_name: transaction.merchant_name || "",
        amount: transaction.amount || "",
        currency: transaction.currency || "SAR",
        category: transaction.category || "أخرى",
        type: transaction.type || "expense",
      });
    }
  }, [transaction]);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.merchant_name || !form.amount || !form.date) return;
    setSaving(true);
    try {
      const data = { ...form, amount: parseFloat(form.amount) };
      if (transaction?.id) {
        await base44.entities.Transaction.update(transaction.id, data);
      } else {
        await base44.entities.Transaction.create(data);
      }
      onSave();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: "rgba(0,0,0,0.75)" }} onClick={onClose}>
      <div
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6"
        style={{ background: "#1a1d27" }}
        onClick={e => e.stopPropagation()}
        dir="rtl"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-lg font-bold">
            {transaction?.id ? "تعديل المعاملة" : "إضافة معاملة"}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#252836" }}>
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type toggle */}
          <div className="flex rounded-2xl overflow-hidden p-1 gap-1" style={{ background: "#252836" }}>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, type: "expense" }))}
              className="flex-1 py-2.5 text-sm font-bold rounded-xl transition-all"
              style={form.type === "expense" ? { background: "#ef4444", color: "white" } : { color: "#64748b" }}
            >
              مصروف
            </button>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, type: "income" }))}
              className="flex-1 py-2.5 text-sm font-bold rounded-xl transition-all"
              style={form.type === "income" ? { background: "#10b981", color: "white" } : { color: "#64748b" }}
            >
              دخل
            </button>
          </div>

          <div>
            <label className="block text-slate-400 text-xs mb-1.5">التاريخ</label>
            <input type="date" name="date" value={form.date} onChange={handleChange} required style={inputStyle} />
          </div>

          <div>
            <label className="block text-slate-400 text-xs mb-1.5">اسم التاجر / المصدر</label>
            <input type="text" name="merchant_name" value={form.merchant_name} onChange={handleChange} required placeholder="مثال: مطعم الأصيل" style={inputStyle} />
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-slate-400 text-xs mb-1.5">المبلغ</label>
              <input type="number" name="amount" value={form.amount} onChange={handleChange} required min="0" step="0.01" placeholder="0.00" style={inputStyle} />
            </div>
            <div className="w-24">
              <label className="block text-slate-400 text-xs mb-1.5">العملة</label>
              <select name="currency" value={form.currency} onChange={handleChange} style={inputStyle}>
                <option>SAR</option>
                <option>USD</option>
                <option>EUR</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 text-xs mb-1.5">الفئة</label>
            <select name="category" value={form.category} onChange={handleChange} style={inputStyle}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 rounded-2xl font-bold text-white text-sm disabled:opacity-60 mt-2"
            style={{ background: "linear-gradient(135deg,#1e3a8a,#7c3aed)" }}
          >
            {saving ? "جاري الحفظ..." : transaction?.id ? "حفظ التعديلات" : "إضافة المعاملة"}
          </button>
        </form>
      </div>
    </div>
  );
}