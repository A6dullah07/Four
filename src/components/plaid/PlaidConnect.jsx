import React, { useState, useEffect, useCallback } from "react";
import { Building2, RefreshCw, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function PlaidConnect({ onImported }) {
  const [step, setStep] = useState("idle"); // idle | linking | importing | done | error
  const [message, setMessage] = useState("");
  const [importedCount, setImportedCount] = useState(0);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => { if (u?.plaid_access_token) setConnected(true); });
  }, []);

  const loadPlaidScript = () => new Promise((resolve, reject) => {
    if (window.Plaid) return resolve();
    const script = document.createElement("script");
    script.src = "https://cdn.plaid.com/link/v2/stable/link-initialize.js";
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });

  const handleConnect = useCallback(async () => {
    setStep("linking");
    setMessage("");
    try {
      await loadPlaidScript();

      const { data } = await base44.functions.invoke("plaidCreateLinkToken", {});
      const linkToken = data.link_token;
      if (!linkToken) throw new Error(data.error || "فشل إنشاء رابط الاتصال");

      await new Promise((resolve, reject) => {
        const handler = window.Plaid.create({
          token: linkToken,
          onSuccess: async (publicToken) => {
            try {
              const res = await base44.functions.invoke("plaidExchangeToken", { public_token: publicToken });
              if (res.data?.error) throw new Error(res.data.error);
              setConnected(true);
              resolve();
            } catch (e) { reject(e); }
          },
          onExit: (err) => {
            if (err) reject(new Error(err.error_message || "تم إغلاق نافذة الاتصال"));
            else reject(new Error("cancelled"));
          },
        });
        handler.open();
      });

      setStep("idle");
    } catch (e) {
      if (e.message === "cancelled") { setStep("idle"); return; }
      setMessage(e.message);
      setStep("error");
    }
  }, []);

  const handleImport = useCallback(async () => {
    setStep("importing");
    setMessage("");
    try {
      const { data } = await base44.functions.invoke("plaidImportTransactions", {});
      if (data?.error) throw new Error(data.error);
      setImportedCount(data.imported || 0);
      setStep("done");
      if (onImported) onImported();
    } catch (e) {
      setMessage(e.message);
      setStep("error");
    }
  }, [onImported]);

  return (
    <div className="rounded-2xl p-4" style={{ background: "#1a1d27" }} dir="rtl">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "#252836" }}>
          <Building2 className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <p className="text-white text-sm font-bold">ربط الحساب البنكي</p>
          <p className="text-slate-500 text-xs">استيراد المعاملات تلقائياً عبر Plaid</p>
        </div>
        {connected && (
          <div className="mr-auto flex items-center gap-1 text-emerald-400 text-xs font-semibold">
            <CheckCircle className="w-3.5 h-3.5" />
            مربوط
          </div>
        )}
      </div>

      {step === "done" && (
        <div className="mb-3 flex items-center gap-2 text-emerald-400 text-xs rounded-xl p-3" style={{ background: "rgba(16,185,129,0.1)" }}>
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          تم استيراد {importedCount} معاملة بنجاح
        </div>
      )}

      {step === "error" && message && (
        <div className="mb-3 flex items-center gap-2 text-red-400 text-xs rounded-xl p-3" style={{ background: "rgba(239,68,68,0.1)" }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {message}
        </div>
      )}

      <div className="flex gap-2">
        {!connected ? (
          <button
            onClick={handleConnect}
            disabled={step === "linking"}
            className="flex-1 py-3 rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: "linear-gradient(135deg,#1e3a8a,#7c3aed)" }}
          >
            {step === "linking" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Building2 className="w-4 h-4" />}
            {step === "linking" ? "جاري الاتصال..." : "ربط الحساب"}
          </button>
        ) : (
          <>
            <button
              onClick={handleImport}
              disabled={step === "importing"}
              className="flex-1 py-3 rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: "linear-gradient(135deg,#1e3a8a,#7c3aed)" }}
            >
              {step === "importing" ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {step === "importing" ? "جاري الاستيراد..." : "استيراد المعاملات"}
            </button>
            <button
              onClick={handleConnect}
              disabled={step === "linking"}
              className="px-4 py-3 rounded-2xl text-xs text-slate-400 font-semibold"
              style={{ background: "#252836" }}
            >
              تغيير الحساب
            </button>
          </>
        )}
      </div>

      <p className="text-slate-600 text-[10px] text-center mt-3">
        بيانات تجريبية — Plaid Sandbox · المستخدم: user_good / pass_good
      </p>
    </div>
  );
}