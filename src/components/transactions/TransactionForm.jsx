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

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.merchant_name || !form.amount || !form.date) return;
    setSaving(true);
    const data = { ...form, amount: parseFloat(form.amount) };
    try {
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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">
            {transaction?.id ? "تعديل المعاملة" : "إضافة معاملة"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type toggle */}
          <div className="flex rounded-xl overflow-hidden border border-gray-200">
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, type: "expense" }))}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                form.type === "expense" ? "bg-red-500 text-white" : "bg-white text-gray-500"
              }`}
            >
              مصروف
            </button>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, type: "income" }))}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                form.type === "income" ? "bg-emerald-500 text-white" : "bg-white text-gray-500"
              }`}
            >
              دخل
            </button>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">التاريخ</label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              required
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">اسم التاجر / المصدر</label>
            <input
              type="text"
              name="merchant_name"
              value={form.merchant_name}
              onChange={handleChange}
              required
              placeholder="مثال: مطعم الأصيل"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">المبلغ</label>
              <input
                type="number"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                placeholder="0.00"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div className="w-24">
              <label className="block text-sm text-gray-600 mb-1">العملة</label>
              <select
                name="currency"
                value={form.currency}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option>SAR</option>
                <option>USD</option>
                <option>EUR</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">الفئة</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-xl font-bold text-white text-sm bg-gradient-to-l from-[#1e3a8a] to-[#7c3aed] disabled:opacity-60"
          >
            {saving ? "جاري الحفظ..." : transaction?.id ? "حفظ التعديلات" : "إضافة المعاملة"}
          </button>
        </form>
      </div>
    </div>
  );
}