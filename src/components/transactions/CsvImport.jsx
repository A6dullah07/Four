import React, { useState, useRef } from "react";
import { X, Upload, CheckCircle, AlertCircle, FileText } from "lucide-react";
import { base44 } from "@/api/base44Client";

const REQUIRED_COLS = ["date", "merchant_name", "amount", "type"];
const VALID_TYPES = ["income", "expense"];
const CATEGORIES = ["طعام", "ترفيه", "تسوق", "إيجار", "فواتير", "تأمين", "مواصلات", "راتب", "أخرى"];

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) throw new Error("الملف فارغ أو لا يحتوي على بيانات");
  const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/\s+/g, "_"));
  const missing = REQUIRED_COLS.filter(c => !headers.includes(c));
  if (missing.length) throw new Error(`أعمدة مفقودة: ${missing.join(", ")}`);

  const rows = [];
  const errors = [];
  lines.slice(1).forEach((line, i) => {
    if (!line.trim()) return;
    const vals = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
    const row = {};
    headers.forEach((h, idx) => { row[h] = vals[idx] || ""; });

    const amount = parseFloat(row.amount);
    if (isNaN(amount) || amount <= 0) { errors.push(`سطر ${i + 2}: مبلغ غير صالح`); return; }
    if (!VALID_TYPES.includes(row.type)) { errors.push(`سطر ${i + 2}: النوع يجب أن يكون income أو expense`); return; }
    if (!row.date.match(/^\d{4}-\d{2}-\d{2}$/)) { errors.push(`سطر ${i + 2}: تاريخ غير صالح (يجب YYYY-MM-DD)`); return; }

    rows.push({
      date: row.date,
      merchant_name: row.merchant_name || "غير محدد",
      amount,
      currency: row.currency || "SAR",
      category: CATEGORIES.includes(row.category) ? row.category : "أخرى",
      type: row.type,
    });
  });

  return { rows, errors };
}

export default function CsvImport({ onDone, onClose }) {
  const [step, setStep] = useState("pick"); // pick | preview | importing | done
  const [parsed, setParsed] = useState(null);
  const [parseError, setParseError] = useState("");
  const [progress, setProgress] = useState(0);
  const [importErrors, setImportErrors] = useState([]);
  const fileRef = useRef();

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setParseError("");
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const result = parseCsv(ev.target.result);
        setParsed(result);
        setStep("preview");
      } catch (err) {
        setParseError(err.message);
      }
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleImport = async () => {
    setStep("importing");
    setProgress(0);
    const errs = [];
    const rows = parsed.rows;
    const batchSize = 20;
    let done = 0;

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      try {
        await base44.entities.Transaction.bulkCreate(batch);
      } catch {
        batch.forEach((_, j) => errs.push(`خطأ في السطر ${i + j + 2}`));
      }
      done += batch.length;
      setProgress(Math.round((done / rows.length) * 100));
    }

    setImportErrors(errs);
    setStep("done");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: "rgba(0,0,0,0.75)" }} onClick={onClose}>
      <div
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6"
        style={{ background: "#1a1d27" }}
        onClick={e => e.stopPropagation()}
        dir="rtl"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white text-lg font-bold">استيراد CSV</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#252836" }}>
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* STEP: pick */}
        {step === "pick" && (
          <div className="space-y-4">
            <div className="rounded-2xl p-4 text-xs text-slate-400 leading-relaxed" style={{ background: "#252836" }}>
              <p className="font-semibold text-slate-300 mb-2">📋 تنسيق الملف المطلوب:</p>
              <p className="font-mono text-[11px] text-indigo-300">date, merchant_name, amount, category, type, currency</p>
              <p className="mt-2">• التاريخ: YYYY-MM-DD</p>
              <p>• النوع: <span className="text-emerald-400">income</span> أو <span className="text-red-400">expense</span></p>
              <p>• العملة اختيارية (الافتراضي SAR)</p>
            </div>
            {parseError && (
              <div className="flex gap-2 items-start text-red-400 text-xs rounded-xl p-3" style={{ background: "rgba(239,68,68,0.1)" }}>
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{parseError}</span>
              </div>
            )}
            <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={handleFile} className="hidden" />
            <button
              onClick={() => fileRef.current.click()}
              className="w-full py-3.5 rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg,#1e3a8a,#7c3aed)" }}
            >
              <Upload className="w-4 h-4" />
              اختر ملف CSV
            </button>
          </div>
        )}

        {/* STEP: preview */}
        {step === "preview" && parsed && (
          <div className="space-y-4">
            <div className="rounded-2xl p-4" style={{ background: "#252836" }}>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span className="text-white text-sm font-semibold">معاينة البيانات</span>
              </div>
              <p className="text-slate-400 text-xs">✅ {parsed.rows.length} معاملة جاهزة للاستيراد</p>
              {parsed.errors.length > 0 && (
                <p className="text-amber-400 text-xs mt-1">⚠️ {parsed.errors.length} سطر تم تجاهله (بيانات غير صالحة)</p>
              )}
            </div>

            {/* Preview table */}
            <div className="rounded-2xl overflow-hidden" style={{ background: "#252836" }}>
              <div className="grid grid-cols-3 gap-2 px-3 py-2 text-[10px] text-slate-500 font-semibold border-b border-slate-700">
                <span>التاجر</span><span>المبلغ</span><span>التاريخ</span>
              </div>
              {parsed.rows.slice(0, 5).map((r, i) => (
                <div key={i} className="grid grid-cols-3 gap-2 px-3 py-2 text-xs border-b border-slate-800 last:border-0">
                  <span className="text-white truncate">{r.merchant_name}</span>
                  <span className={r.type === "income" ? "text-emerald-400" : "text-red-400"}>
                    {r.type === "income" ? "+" : "-"}{r.amount.toLocaleString("ar-SA")}
                  </span>
                  <span className="text-slate-400">{r.date}</span>
                </div>
              ))}
              {parsed.rows.length > 5 && (
                <p className="text-center text-slate-600 text-[10px] py-2">... و {parsed.rows.length - 5} معاملة أخرى</p>
              )}
            </div>

            {parsed.errors.length > 0 && (
              <div className="rounded-xl p-3 text-xs text-amber-400 space-y-1" style={{ background: "rgba(245,158,11,0.08)" }}>
                {parsed.errors.slice(0, 3).map((e, i) => <p key={i}>⚠️ {e}</p>)}
                {parsed.errors.length > 3 && <p>... و {parsed.errors.length - 3} أخطاء أخرى</p>}
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={() => { setStep("pick"); setParsed(null); }} className="flex-1 py-3 rounded-2xl text-sm font-semibold text-slate-400" style={{ background: "#252836" }}>
                رجوع
              </button>
              <button
                onClick={handleImport}
                disabled={parsed.rows.length === 0}
                className="flex-1 py-3 rounded-2xl font-bold text-white text-sm disabled:opacity-40"
                style={{ background: "linear-gradient(135deg,#1e3a8a,#7c3aed)" }}
              >
                استيراد {parsed.rows.length} معاملة
              </button>
            </div>
          </div>
        )}

        {/* STEP: importing */}
        {step === "importing" && (
          <div className="text-center py-8 space-y-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto" style={{ background: "#252836" }}>
              <div className="w-7 h-7 border-4 border-slate-700 border-t-indigo-500 rounded-full animate-spin" />
            </div>
            <p className="text-white font-semibold">جاري الاستيراد...</p>
            <div className="w-full h-2 rounded-full" style={{ background: "#252836" }}>
              <div className="h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: "linear-gradient(90deg,#4f46e5,#7c3aed)" }} />
            </div>
            <p className="text-slate-500 text-xs">{progress}%</p>
          </div>
        )}

        {/* STEP: done */}
        {step === "done" && (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto" style={{ background: "rgba(16,185,129,0.1)" }}>
              <CheckCircle className="w-7 h-7 text-emerald-400" />
            </div>
            <div>
              <p className="text-white font-bold text-base">تم الاستيراد بنجاح!</p>
              <p className="text-slate-400 text-xs mt-1">
                {parsed.rows.length - importErrors.length} معاملة تمت إضافتها
                {importErrors.length > 0 && ` • ${importErrors.length} فشلت`}
              </p>
            </div>
            <button
              onClick={() => { onDone(); onClose(); }}
              className="w-full py-3.5 rounded-2xl font-bold text-white text-sm"
              style={{ background: "linear-gradient(135deg,#1e3a8a,#7c3aed)" }}
            >
              عرض المعاملات
            </button>
          </div>
        )}
      </div>
    </div>
  );
}