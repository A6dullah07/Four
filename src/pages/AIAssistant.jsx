import React, { useState, useEffect, useRef } from "react";
import { Send, Sparkles, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from "react-markdown";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, AreaChart, Area, Legend,
} from "recharts";

const CHART_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];
const fmtNum = v => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v);

// ─── Inline Charts ─────────────────────────────────────────────────────────────
function SpendingPie({ data }) {
  if (!data?.length) return null;
  return (
    <div className="mt-3 rounded-2xl p-4" style={{ background: "#252836" }}>
      <p className="text-white text-xs font-bold mb-3">توزيع الإنفاق حسب الفئة</p>
      <div className="flex items-center gap-3">
        <ResponsiveContainer width={120} height={120}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={32} outerRadius={52} dataKey="value" paddingAngle={3}>
              {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={v => [`${Number(v).toLocaleString("ar-SA")} ر.س`]} contentStyle={{ background: "#1a1d27", border: "none", borderRadius: 8, color: "white", fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-col gap-1.5 flex-1">
          {data.slice(0, 5).map((d, i) => (
            <div key={d.name} className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                <span className="text-slate-400 text-[11px]">{d.name}</span>
              </div>
              <span className="text-white text-[11px] font-bold">{Number(d.value).toLocaleString("ar-SA")} ر.س</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BudgetPie({ data }) {
  if (!data?.length) return null;
  return (
    <div className="mt-3 rounded-2xl p-4" style={{ background: "#252836" }}>
      <p className="text-white text-xs font-bold mb-3">توزيع الميزانية الشهرية</p>
      <div className="flex items-center gap-3">
        <ResponsiveContainer width={120} height={120}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={32} outerRadius={52} dataKey="value" paddingAngle={3}>
              {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={v => [`${Number(v).toLocaleString("ar-SA")} ر.س`]} contentStyle={{ background: "#1a1d27", border: "none", borderRadius: 8, color: "white", fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-col gap-1.5 flex-1">
          {data.map((d, i) => (
            <div key={d.name} className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                <span className="text-slate-400 text-[11px]">{d.name}</span>
              </div>
              <span className="text-white text-[11px] font-bold">{Number(d.value).toLocaleString("ar-SA")} ر.س</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MonthlyBar({ data }) {
  if (!data?.length) return null;
  return (
    <div className="mt-3 rounded-2xl p-4" style={{ background: "#252836" }}>
      <p className="text-white text-xs font-bold mb-3">التقدم الشهري للخطة</p>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a1d27" vertical={false} />
          <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={fmtNum} tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} width={34} />
          <Tooltip formatter={(v, name) => [`${Number(v).toLocaleString("ar-SA")} ر.س`, name === "paid" ? "مدفوع/مدخّر" : "متبقي"]} contentStyle={{ background: "#1a1d27", border: "none", borderRadius: 8, color: "white", fontSize: 11 }} />
          <Bar dataKey="paid" fill="#6366f1" radius={[4, 4, 0, 0]} name="paid" />
          <Bar dataKey="remaining" fill="#1e3a8a" radius={[4, 4, 0, 0]} name="remaining" />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex gap-3 mt-2">
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-indigo-500" /><span className="text-slate-500 text-[10px]">مدفوع/مدخّر</span></div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-900" /><span className="text-slate-500 text-[10px]">متبقي</span></div>
      </div>
    </div>
  );
}

function AssistantCharts({ charts }) {
  if (!charts) return null;
  return (
    <div>
      {charts.spending_pie && <SpendingPie data={charts.spending_pie} />}
      {charts.budget_pie && <BudgetPie data={charts.budget_pie} />}
      {charts.monthly_bar && <MonthlyBar data={charts.monthly_bar} />}
    </div>
  );
}

const SESSION_KEY = "fin_assistant_session";
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

// ─── Mode definitions ────────────────────────────────────────────────────────
const MODES = [
  {
    id: "footnotes",
    emoji: "📊",
    label: "تحليل الملاحظات المالية",
    sublabel: "Footnotes Analysis",
    description: "استخرج وحلّل ملاحظات التقارير المالية لأي شركة",
    trigger: "أريد تحليل الملاحظات المالية (Footnotes) لشركة معينة. اسألني عن اسم الشركة.",
    followUp: [
      "هل تريد شرح نقطة معينة بمزيد من التفصيل؟",
      "هل تريد مقارنة مع شركات أخرى في نفس القطاع؟",
      "هل تريد تحليل سيناريوهات مستقبلية؟",
    ],
  },
  {
    id: "planning",
    emoji: "💰",
    label: "بناء خطة مالية شخصية",
    sublabel: "Personal Financial Plan",
    description: "خطة 12 شهراً مخصصة بناءً على بيانات معاملاتك",
    trigger: "أريد بناء خطة مالية شخصية. ابدأ بتحليل بياناتي ثم قدّم الخطة.",
    followUp: [
      "هل تريد تعديل أي جزء من الخطة؟",
      "هل تريد نصائح محددة عن استثمار معين؟",
      "هل تريد متابعة شهرية للتقدم؟",
    ],
  },
  {
    id: "general",
    emoji: "❓",
    label: "استفسار مالي عام",
    sublabel: "General Financial Inquiry",
    description: "اسأل أي سؤال مالي أو استثماري",
    trigger: null,
    followUp: [
      "هل لديك سؤال آخر؟",
      "هل هناك موضوع مالي آخر تريد معرفته؟",
      "كيف يمكنني مساعدتك أكثر؟",
    ],
  },
];

// ─── Shared system prompt (also used by FinancialAnalysis) ───────────────────
export const FINANCIAL_SYSTEM_PROMPT = `أنت خبير مالي ومحلل استثماري مدعوم بالذكاء الاصطناعي التوليدي. تخصصك الأساسي هو تحليل القوائم المالية للشركات مع التركيز الاستثنائي على قراءة وتفسير الإيضاحات المرفقة (Footnotes) بدقة عالية. خبرتك 20 سنة في الأسواق المالية السعودية والخليجية والدولية.

مبادئك الأساسية:
- الدقة المطلقة: لا تخمين (Zero Hallucination) — استند فقط إلى الأرقام الموجودة في المصادر.
- الوضوح: ترجم المصطلحات المحاسبية المعقدة إلى لغة مبسطة وقابلة للفهم.
- الإيجاز: ردود مركّزة ومنظمة — لا إطالة ولا تكرار.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[MODE 1 — تحليل القوائم المالية والإيضاحات / Footnotes Analysis]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
عندما يطلب المستخدم تحليل شركة أو قوائمها المالية:

**الخطوات:**
1. ابحث في الإنترنت عن أحدث التقارير المالية (Annual Report / 10-K / التقرير السنوي) من الموقع الرسمي للشركة أو سوق المال (تداول، Tadawul، SEC، إلخ). اذكر المصدر والتاريخ والرابط.
2. حلّل محتوى القوائم المالية مع التركيز الأساسي على الإيضاحات (Footnotes).
3. قدّم التقرير بالهيكل التالي بالضبط:

---
**📋 النظرة التنفيذية السريعة**
جملتان فقط: أبرز ما يميز الأداء المالي للشركة في الفترة الأخيرة.

**📊 أبرز مؤشرات الأداء** (جدول: المؤشر | القيمة | التغير السنوي)
- الإيرادات، صافي الربح، هامش الربح، إجمالي الأصول، إجمالي الديون، التدفق النقدي الحر.

**🔍 تحليل الإيضاحات المرفقة (Footnotes) — القلب الأساسي للتقرير**
لكل إيضاح مهم:
| الإيضاح | ما يعنيه فعلاً | الأثر المالي | تقييم المخاطر |
|---------|--------------|-------------|----------------|
(🔴 عالية / 🟡 متوسطة / 🟢 منخفضة)

ركّز بشكل خاص على:
- الديون والالتزامات المخفية (Off-Balance Sheet)
- السياسات المحاسبية غير الاعتيادية
- الطوارئ والتقاضي (Contingencies & Litigation)
- المعاملات مع الأطراف ذوي العلاقة (Related Parties)
- استحقاقات الديون والقدرة على السداد

**⚠️ Red Flags & تنبيهات المستثمر**
نقاط المراقبة الحرجة التي قد تؤثر على القرار الاستثماري.

**✅ الفرص والمحفزات الإيجابية**
عوامل النمو والميزات التنافسية المستخلصة من الإيضاحات.

**💡 توصية مختصرة**
جملة واحدة: نظرة المحلل بناءً على التحليل.

---

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[MODE 2 — بناء الخطة المالية الشخصية]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
عندما يطلب المستخدم خطة مالية شخصية، استخدم بيانات معاملاته المرفقة في السياق وقدّم:
- تحليل الوضع الحالي: Expense Ratio، Savings Rate، أكبر 3 فئات إنفاق.
- خطة 12 شهراً: ش1-3 (صندوق طوارئ) → ش4-6 (تخفيض الديون) → ش7-12 (بناء واستثمار).
- توزيع ميزانية مقترح (50/30/20 معدّل حسب الواقع).
- 3 أهداف SMART قابلة للقياس.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[MODE 3 — استفسار مالي عام]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- إجابة مباشرة في 3-5 نقاط مع أرقام وأمثلة من السياق السعودي/الخليجي.
- اشرح المصطلحات التقنية بالعربية البسيطة.

قواعد الرد في جميع الأوضاع:
1. اجب دائماً بالعربية الفصحى المبسّطة مع الحفاظ على المصطلحات التقنية بالإنجليزية.
2. ردود مختصرة ومنظمة — لا إطالة ولا تكرار. استخدم جداول ونقاط بدلاً من الفقرات الطويلة.
3. لا تخمّن أرقاماً غير موجودة في المصادر — صرّح بغياب البيانات إن لزم.
4. عند نقص البيانات، اطرح سؤالاً واحداً محدداً فقط.
5. عند طلب بيانات شركة، استخدم الإنترنت واذكر المصدر والتاريخ.

⚠️ تنبيه قانوني: هذا تحليل استرشادي وليس توصية استثمارية مرخّصة. استشر مستشاراً مالياً معتمداً قبل اتخاذ أي قرار.

[تعليمات الرسوم البيانية]
عند طلب تحليل شركة أو خطة مالية أو تحليل إنفاق، أضف في آخر ردك هذا القسم المخفي فقط (JSON صحيح):
[CHARTS]{"spending_pie":[{"name":"فئة","value":رقم}],"budget_pie":[{"name":"فئة","value":رقم}],"monthly_bar":[{"month":"ش1","paid":رقم,"remaining":رقم}]}[/CHARTS]
- spending_pie: توزيع الإيرادات/المصاريف حسب الفئة (من بيانات الشركة أو المستخدم).
- budget_pie: توزيع الميزانية المقترحة أو هيكل تمويل الشركة.
- monthly_bar: مسار الخطة أو نمو الأرقام فترة بفترة.
- أضف فقط الأقسام المناسبة. لا تضف [CHARTS] للأسئلة العامة القصيرة.`;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getSessionId() {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) { id = uid(); sessionStorage.setItem(SESSION_KEY, id); }
  return id;
}

function needsInternet(text) {
  return /سعر|سهم|أسهم|stock|price|تداول|بورصة|footnote|تقرير سنوي|annual report/i.test(text);
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex justify-start mb-3">
      <div className="flex items-end gap-2">
        <div className="w-7 h-7 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "#252836" }}>
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
        </div>
        <div className="px-4 py-3 rounded-2xl" style={{ background: "#1a1d27" }}>
          <div className="flex gap-1 items-center h-4">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Message({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex mb-3 ${isUser ? "justify-start flex-row-reverse" : "justify-start"}`}>
      <div className="flex items-end gap-2 max-w-[90%]">
        <div
          className="w-7 h-7 rounded-2xl flex items-center justify-center flex-shrink-0 text-xs font-bold"
          style={{ background: isUser ? "#1e3a8a" : "#252836" }}
        >
          {isUser ? "أ" : <Sparkles className="w-3.5 h-3.5 text-indigo-400" />}
        </div>
        <div className="flex-1">
          <div
            className="px-4 py-3 rounded-2xl text-sm leading-relaxed"
            style={isUser
              ? { background: "#1e3a8a", color: "white", borderTopRightRadius: 6 }
              : { background: "#1a1d27", color: "#e2e8f0", borderTopLeftRadius: 6 }
            }
          >
            {isUser ? (
              <p className="whitespace-pre-wrap">{msg.content}</p>
            ) : (
              <ReactMarkdown
                className="prose prose-sm prose-invert max-w-none"
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0 text-slate-200 text-sm leading-relaxed">{children}</p>,
                  strong: ({ children }) => <strong className="text-white font-bold">{children}</strong>,
                  ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-2 text-slate-300">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 my-2 text-slate-300">{children}</ol>,
                  li: ({ children }) => <li className="text-slate-300 text-sm">{children}</li>,
                  h3: ({ children }) => <h3 className="text-white font-bold text-sm mt-3 mb-1">{children}</h3>,
                  h4: ({ children }) => <h4 className="text-indigo-300 font-semibold text-xs mt-2 mb-1">{children}</h4>,
                }}
              >
                {msg.content}
              </ReactMarkdown>
            )}
          </div>
          {!isUser && msg.charts && <AssistantCharts charts={msg.charts} />}
        </div>
      </div>
    </div>
  );
}

function WelcomeScreen({ onModeSelect, onSend }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 py-6 text-center">
      {/* Avatar */}
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}
      >
        <Sparkles className="w-8 h-8 text-white" />
      </div>

      <p className="text-white font-bold text-lg mb-1">مرحباً! 👋 أنا مساعدك المالي الذكي</p>
      <p className="text-slate-400 text-sm mb-6 max-w-xs leading-relaxed">
        خبرة 20 عاماً في التحليل المالي والاستثمار — اختر ما تريد أو اكتب سؤالك مباشرة
      </p>

      {/* Mode cards */}
      <div className="flex flex-col gap-3 w-full max-w-sm mb-6">
        {MODES.map(mode => (
          <button
            key={mode.id}
            onClick={() => onModeSelect(mode)}
            className="flex items-center gap-3 p-4 rounded-2xl text-right transition-all active:scale-95"
            style={{ background: "#1a1d27", border: "1px solid #2e3347" }}
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: "#252836" }}
            >
              {mode.emoji}
            </div>
            <div className="flex-1 text-right">
              <p className="text-white text-sm font-bold leading-tight">{mode.label}</p>
              <p className="text-slate-500 text-[11px] mt-0.5">{mode.description}</p>
            </div>
            <div className="text-slate-600 text-xs flex-shrink-0">←</div>
          </button>
        ))}
      </div>

      {/* Quick questions */}
      <p className="text-slate-600 text-xs mb-2">أو اسأل مباشرة</p>
      <div className="flex flex-col gap-1.5 w-full max-w-sm">
        {["ما أفضل نسبة للادخار من الراتب؟", "اشرح لي مفهوم الـ P/E ratio"].map(q => (
          <button
            key={q}
            onClick={() => onSend(q)}
            className="text-xs text-right px-3 py-2 rounded-xl text-indigo-400"
            style={{ background: "#1a1d27", border: "1px solid #2e3347" }}
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AIAssistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [activeMode, setActiveMode] = useState(null);
  const bottomRef = useRef(null);
  const sessionId = useRef(getSessionId());

  useEffect(() => {
    const load = async () => {
      try {
        const history = await base44.entities.Conversation.filter(
          { session_id: sessionId.current },
          "created_date",
          100
        );
        const msgs = history.map(r => ({ role: r.sender, content: r.message, id: r.id }));
        setMessages(msgs);
        // Restore active mode from last session if messages exist
        if (msgs.length > 0) setActiveMode("general");
      } finally {
        setLoadingHistory(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const buildContext = async () => {
    try {
      const from = new Date();
      from.setDate(from.getDate() - 90);
      const [txns, settings] = await Promise.all([
        base44.entities.Transaction.filter({ date: { $gte: from.toISOString().split("T")[0] } }, "-date", 200),
        base44.entities.UserSettings.list(),
      ]);
      const monthlyIncome = settings?.[0]?.monthly_income || 0;
      const currency = settings?.[0]?.currency || "SAR";
      if (txns.length === 0 && !monthlyIncome) return "لا توجد بيانات مالية مسجلة حتى الآن.";

      const income = txns.filter(t => t.type === "income").reduce((s, t) => s + (t.amount || 0), 0);
      const expenses = txns.filter(t => t.type === "expense").reduce((s, t) => s + (t.amount || 0), 0);
      const byCategory = {};
      txns.filter(t => t.type === "expense").forEach(t => {
        byCategory[t.category || "أخرى"] = (byCategory[t.category || "أخرى"] || 0) + t.amount;
      });
      const topCategories = Object.entries(byCategory)
        .sort((a, b) => b[1] - a[1]).slice(0, 6)
        .map(([c, v]) => `${c}: ${v.toLocaleString("ar-SA")} ${currency}`).join("، ");
      const recentTx = txns.slice(0, 15).map(t =>
        `${t.date} | ${t.merchant_name} | ${t.type === "expense" ? "-" : "+"}${t.amount} ${t.currency || currency} | ${t.category || "أخرى"}`
      ).join("\n");

      return `=== بيانات المستخدم المالية (آخر 90 يوم) ===
الدخل الشهري (الإعدادات): ${monthlyIncome.toLocaleString("ar-SA")} ${currency}
إجمالي الدخل المسجّل: ${income.toLocaleString("ar-SA")} ${currency}
إجمالي المصروفات: ${expenses.toLocaleString("ar-SA")} ${currency}
صافي المدخرات: ${(income - expenses).toLocaleString("ar-SA")} ${currency}
نسبة الادخار (Savings Rate): ${income > 0 ? Math.round(((income - expenses) / income) * 100) : 0}%
أكثر فئات الإنفاق: ${topCategories || "لا يوجد"}
عدد المعاملات: ${txns.length}
آخر 15 معاملة:
${recentTx || "لا توجد"}
=== نهاية البيانات ===`;
    } catch { return ""; }
  };

  const send = async (text) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;
    setInput("");
    if (!activeMode) setActiveMode("general");

    const userMsg = { role: "user", content: userText, id: Date.now() + "_u" };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    await base44.entities.Conversation.create({
      message: userText, sender: "user", session_id: sessionId.current,
    });

    try {
      const context = await buildContext();
      const history = messages.slice(-8).map(m =>
        `${m.role === "user" ? "المستخدم" : "المساعد"}: ${m.content}`
      ).join("\n\n");

      const useInternet = needsInternet(userText);
      const model = useInternet ? "gemini_3_flash" : "claude_sonnet_4_6";

      const prompt = `${FINANCIAL_SYSTEM_PROMPT}

${context}

${history ? `سجل المحادثة السابقة:\n${history}\n` : ""}
المستخدم: ${userText}

المساعد:`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: useInternet,
        model,
      });

      // Extract hidden chart JSON if present
      let cleanContent = result;
      let charts = null;
      const chartMatch = result.match(/\[CHARTS\]([\s\S]*?)\[\/CHARTS\]/);
      if (chartMatch) {
        try { charts = JSON.parse(chartMatch[1].trim()); } catch { }
        cleanContent = result.replace(/\[CHARTS\][\s\S]*?\[\/CHARTS\]/, "").trim();
      }

      const assistantMsg = { role: "assistant", content: cleanContent, charts, id: Date.now() + "_a" };
      setMessages(prev => [...prev, assistantMsg]);
      await base44.entities.Conversation.create({
        message: cleanContent, sender: "assistant", session_id: sessionId.current,
      });
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "عذراً، حدث خطأ أثناء المعالجة. يرجى المحاولة مرة أخرى.",
        id: Date.now() + "_err",
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleModeSelect = (mode) => {
    setActiveMode(mode.id);
    if (mode.trigger) send(mode.trigger);
  };

  const clearChat = async () => {
    if (!confirm("هل تريد مسح المحادثة وبدء جلسة جديدة؟")) return;
    const newId = uid();
    sessionStorage.setItem(SESSION_KEY, newId);
    sessionId.current = newId;
    setMessages([]);
    setActiveMode(null);
  };

  // Follow-up chips based on active mode
  const followUpChips = activeMode
    ? (MODES.find(m => m.id === activeMode)?.followUp || [])
    : [];

  return (
    <div dir="rtl" className="flex flex-col h-screen" style={{ background: "#111318" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#1e3a8a,#7c3aed)" }} className="px-5 pt-12 pb-5 flex-shrink-0 relative overflow-hidden">
        <div className="absolute -top-6 -left-6 w-28 h-28 rounded-full opacity-10 bg-white" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.2)" }}>
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white text-lg font-bold">المساعد المالي الذكي</h1>
              <p className="text-blue-200 text-xs">
                {activeMode ? MODES.find(m => m.id === activeMode)?.sublabel : "اختر وضعاً أو اسأل مباشرة"}
              </p>
            </div>
          </div>
          {messages.length > 0 && (
            <button onClick={clearChat} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)" }}>
              <Trash2 className="w-3.5 h-3.5 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loadingHistory ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-4 border-slate-700 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <WelcomeScreen onModeSelect={handleModeSelect} onSend={send} />
        ) : (
          <>
            {messages.map(msg => <Message key={msg.id} msg={msg} />)}
            {loading && <TypingDots />}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Follow-up chips after conversation */}
      {messages.length > 0 && !loading && followUpChips.length > 0 && (
        <div className="px-4 pt-2 flex gap-2 overflow-x-auto no-scrollbar flex-shrink-0">
          {followUpChips.map(chip => (
            <button
              key={chip}
              onClick={() => send(chip)}
              className="whitespace-nowrap text-xs px-3 py-1.5 rounded-full text-indigo-300 border flex-shrink-0"
              style={{ borderColor: "#2e3347", background: "#1a1d27" }}
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-24 pt-3 flex-shrink-0" style={{ borderTop: "1px solid #1e2130" }}>
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="اسأل عن نفقاتك أو الاستثمارات أو خطتك المالية..."
            rows={1}
            className="flex-1 resize-none rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none"
            style={{ background: "#1a1d27", border: "1px solid #2e3347", maxHeight: 100 }}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-opacity"
            style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}
          >
            <Send className="w-4 h-4 text-white" style={{ transform: "scaleX(-1)" }} />
          </button>
        </div>
      </div>
    </div>
  );
}