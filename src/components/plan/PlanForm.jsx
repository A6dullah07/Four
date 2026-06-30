import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

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

export default function PlanForm({ onPlanCreated }) {
  const [form, setForm] = useState({
    plan_type: "debt",
    total_amount: "",
    monthly_income: "",
    monthly_expenses: "",
    desired_months: "",
  });
  const [loading, setLoading] = useState(false);
  const [prefilling, setPrefilling] = useState(true);

  useEffect(() => {
    const prefill = async () => {
      try {
        const [settings, txns] = await Promise.all([
          base44.entities.UserSettings.list(),
          base44.entities.Transaction.filter(
            { date: { $gte: new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0] }, type: "expense" },
            "-date", 200
          ),
        ]);
        const income = settings?.[0]?.monthly_income || "";
        const expenses = Math.round(txns.reduce((s, t) => s + (t.amount || 0), 0));
        setForm(f => ({
          ...f,
          monthly_income: income || "",
          monthly_expenses: expenses || "",
        }));
      } finally {
        setPrefilling(false);
      }
    };
    prefill();
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const totalAmount = parseFloat(form.total_amount);
    const monthlyIncome = parseFloat(form.monthly_income);
    const monthlyExpenses = parseFloat(form.monthly_expenses);
    if (!totalAmount || !monthlyIncome) return;

    setLoading(true);
    try {
      const disposable = monthlyIncome - monthlyExpenses;
      const planTypeLabel = form.plan_type === "debt" ? "سداد دين" : "هدف ادخار";
      const desiredMonthsLine = form.desired_months ? `المدة المرغوبة: ${form.desired_months} شهر` : "المدة المرغوبة: غير محددة (احسب الأمثل)";

      const prompt = `أنت مساعد مالي ذكي متخصص ودود. خبرتك 20 سنة في تحليل المالية والاستثمار في السوق السعودي والخليج.

قواعد الرد:
1. اجب دائماً بالعربية الفصحى المبسّطة مع الحفاظ على المصطلحات التقنية بالإنجليزية.
2. استخدم الأرقام والنسب المئوية في كل إجابة.
3. لكل توصية، أعطِ نسبة ثقتك (مثال: ثقة 90%).

بيانات الخطة:
- نوع الخطة: ${planTypeLabel}
- المبلغ الإجمالي: ${totalAmount.toLocaleString("ar-SA")} ر.س
- الدخل الشهري: ${monthlyIncome.toLocaleString("ar-SA")} ر.س
- المصاريف الشهرية: ${monthlyExpenses ? monthlyExpenses.toLocaleString("ar-SA") + " ر.س" : "غير محددة"}
- الدخل المتاح للتصرف: ${disposable.toLocaleString("ar-SA")} ر.س
- ${desiredMonthsLine}

أنشئ خطة ${planTypeLabel} واقعية تشمل:
1. **ملخص سريع**: المبلغ الشهري الموصى به وعدد الأشهر اللازمة.
2. **جدول شهري مختصر**: اذكر على شكل قائمة نقاط لكل مرحلة (كل 3 أشهر أو شهر حسب المدة): الشهر، المبلغ المدفوع/المدخّر، الرصيد المتبقي.
3. **الدخل المتاح بعد الخطة**: كم يتبقى شهرياً بعد دفع/ادخار المبلغ.
4. **3 تعديلات عملية** لتحقيق الهدف أسرع، مع نسبة ثقة لكل واحدة.
5. **تحذير**: ذكّر المستخدم بأن هذه توصية استرشادية وليست نصيحة مالية مرخّصة.

أيضاً في النهاية أضف قسماً بعنوان **[CHART_DATA]** يحتوي فقط على JSON بهذا الشكل بدون أي نص إضافي:
{"months": [1,2,3,...], "balances": [remaining1, remaining2, ...], "monthly_payment": NUMBER, "total_months": NUMBER}
حيث balances هي الرصيد المتبقي بعد كل شهر (يبدأ من المبلغ الإجمالي وينخفض).`;

      const result = await base44.integrations.Core.InvokeLLM({ prompt, model: "claude_sonnet_4_6" });

      // Extract chart data
      let chartData = null;
      let cleanResult = result;
      const chartMatch = result.match(/\[CHART_DATA\]([\s\S]*?)(?:\[\/CHART_DATA\]|$)/);
      if (chartMatch) {
        try {
          const jsonStr = chartMatch[1].trim().replace(/```json|```/g, "").trim();
          chartData = JSON.parse(jsonStr);
          cleanResult = result.replace(/\[CHART_DATA\][\s\S]*$/, "").trim();
        } catch { /* use full result */ }
      }

      const title = `${form.plan_type === "debt" ? "سداد دين" : "هدف ادخار"} — ${totalAmount.toLocaleString("ar-SA")} ر.س`;

      const saved = await base44.entities.FinancialPlan.create({
        title,
        total_amount: totalAmount,
        monthly_payment: chartData?.monthly_payment || 0,
        months: chartData?.total_months || 0,
        notes: cleanResult,
      });

      onPlanCreated({ ...saved, title, notes: cleanResult, chartData });
    } finally {
      setLoading(false);
    }
  };

  if (prefilling) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-6 h-6 border-4 border-slate-700 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
      {/* Plan type */}
      <div>
        <label className="block text-slate-400 text-xs mb-1.5">نوع الخطة</label>
        <div className="flex rounded-2xl overflow-hidden p-1 gap-1" style={{ background: "#252836" }}>
          {[{ val: "debt", label: "سداد دين 💳" }, { val: "savings", label: "هدف ادخار 🎯" }].map(({ val, label }) => (
            <button
              key={val}
              type="button"
              onClick={() => set("plan_type", val)}
              className="flex-1 py-2.5 text-sm font-bold rounded-xl transition-all"
              style={form.plan_type === val
                ? { background: "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "white" }
                : { color: "#64748b" }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-slate-400 text-xs mb-1.5">
          {form.plan_type === "debt" ? "إجمالي الدين (ر.س)" : "مبلغ الهدف (ر.س)"}
        </label>
        <input
          type="number" min="1" step="1" required
          value={form.total_amount}
          onChange={e => set("total_amount", e.target.value)}
          placeholder="مثال: 50000"
          style={inputStyle}
        />
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-slate-400 text-xs mb-1.5">الدخل الشهري (ر.س)</label>
          <input
            type="number" min="1" step="1" required
            value={form.monthly_income}
            onChange={e => set("monthly_income", e.target.value)}
            placeholder="0"
            style={inputStyle}
          />
        </div>
        <div className="flex-1">
          <label className="block text-slate-400 text-xs mb-1.5">المصاريف الشهرية (ر.س)</label>
          <input
            type="number" min="0" step="1"
            value={form.monthly_expenses}
            onChange={e => set("monthly_expenses", e.target.value)}
            placeholder="تقديري"
            style={inputStyle}
          />
        </div>
      </div>

      <div>
        <label className="block text-slate-400 text-xs mb-1.5">المدة المرغوبة (أشهر) — اختياري</label>
        <input
          type="number" min="1" step="1"
          value={form.desired_months}
          onChange={e => set("desired_months", e.target.value)}
          placeholder="اتركه فارغاً لحساب الأمثل تلقائياً"
          style={inputStyle}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 rounded-2xl font-bold text-white text-sm disabled:opacity-60 flex items-center justify-center gap-2"
        style={{ background: "linear-gradient(135deg,#1e3a8a,#7c3aed)" }}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            جاري إنشاء الخطة...
          </>
        ) : "✨ أنشئ الخطة بالذكاء الاصطناعي"}
      </button>
    </form>
  );
}