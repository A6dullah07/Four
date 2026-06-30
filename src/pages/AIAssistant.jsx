import React, { useState, useEffect, useRef } from "react";
import { Send, Sparkles, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from "react-markdown";

const SESSION_KEY = "fin_assistant_session";
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

const SUGGESTED = [
  "حلّل نفقاتي لآخر 30 يوم",
  "ابنِ لي خطة سداد لمبلغ معين",
  "اشرح لي الفرق بين الربح والدخل",
];

const SYSTEM_PROMPT = `أنت مساعد مالي ذكي متخصص ودود. خبرتك 20 سنة في تحليل المالية والاستثمار في السوق السعودي والخليج.

دورك الأساسي:
- تحليل النفقات والدخل الشخصي
- قراءة وتحليل القوائم المالية المعقدة بما فيها الإيضاحات (Footnotes)
- إعطاء نصائح توفير محددة وقابلة للقياس
- بناء خطط مالية وخطط سداد
- شرح المفاهيم المالية بطريقة سهلة
- عند طلب المستخدم سعر سهم أو شركة، ابحث عن السعر الحالي من الإنترنت واذكر المصدر والوقت

قواعد الرد:
1. اجب دائماً بالعربية الفصحى المبسّطة مع الحفاظ على المصطلحات التقنية بالإنجليزية.
2. استخدم الأرقام والنسب المئوية في كل إجابة — لا تقل فقط "أعلى" أو "أقل".
3. ابدأ الإجابة بملخص سريع (جملة واحدة)، ثم التفاصيل، ثم النصائح.
4. لكل توصية، أعطِ نسبة ثقتك (مثال: ثقة 90%).
5. عند عدم كفاية البيانات، اطرح سؤالاً واضحاً بدلاً من التخمين.
6. اعتمد على بيانات المستخدم الفعلية (المعاملات والدخل) المرفقة في السياق عند توفرها.

تنبيه: أنت أداة مساعدة وليست بديلاً عن مستشار مالي مرخّص؛ ذكّر المستخدم بذلك عند إعطاء توصيات استثمارية.`;

function getSessionId() {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) { id = uid(); sessionStorage.setItem(SESSION_KEY, id); }
  return id;
}

// Detect if user is asking about a stock price to enable internet context
function needsInternet(text) {
  return /سعر|سهم|أسهم|stock|price|تداول|بورصة/.test(text);
}

function TypingDots() {
  return (
    <div className="flex justify-start mb-3">
      <div className="flex items-end gap-2">
        <div className="w-7 h-7 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "#252836" }}>
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
        </div>
        <div className="px-4 py-3 rounded-2xl rounded-tl-sm" style={{ background: "#1a1d27" }}>
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
      <div className="flex items-end gap-2 max-w-[85%]">
        <div
          className="w-7 h-7 rounded-2xl flex items-center justify-center flex-shrink-0 text-xs font-bold"
          style={{ background: isUser ? "#1e3a8a" : "#252836" }}
        >
          {isUser ? "أ" : <Sparkles className="w-3.5 h-3.5 text-indigo-400" />}
        </div>
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
      </div>
    </div>
  );
}

export default function AIAssistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
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
        setMessages(history.map(r => ({ role: r.sender, content: r.message, id: r.id })));
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
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([c, v]) => `${c}: ${v.toLocaleString("ar-SA")} ${currency}`)
        .join("، ");

      const recentTx = txns.slice(0, 10).map(t =>
        `${t.date} | ${t.merchant_name} | ${t.type === "expense" ? "-" : "+"}${t.amount} ${t.currency || currency} | ${t.category || "أخرى"}`
      ).join("\n");

      return `=== بيانات المستخدم المالية (آخر 90 يوم) ===
الدخل الشهري المُدخل في الإعدادات: ${monthlyIncome.toLocaleString("ar-SA")} ${currency}
إجمالي الدخل المسجّل (90 يوم): ${income.toLocaleString("ar-SA")} ${currency}
إجمالي المصروفات (90 يوم): ${expenses.toLocaleString("ar-SA")} ${currency}
صافي المدخرات: ${(income - expenses).toLocaleString("ar-SA")} ${currency}
نسبة الادخار: ${income > 0 ? Math.round(((income - expenses) / income) * 100) : 0}%
أكثر فئات الإنفاق: ${topCategories || "لا يوجد"}
عدد المعاملات: ${txns.length}

آخر 10 معاملات:
${recentTx || "لا توجد"}
=== نهاية البيانات ===`;
    } catch {
      return "";
    }
  };

  const send = async (text) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;
    setInput("");

    const userMsg = { role: "user", content: userText, id: Date.now() + "_u" };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    await base44.entities.Conversation.create({
      message: userText,
      sender: "user",
      session_id: sessionId.current,
    });

    try {
      const context = await buildContext();
      const history = messages.slice(-6).map(m =>
        `${m.role === "user" ? "المستخدم" : "المساعد"}: ${m.content}`
      ).join("\n\n");

      const useInternet = needsInternet(userText);
      const model = useInternet ? "gemini_3_flash" : undefined;

      const prompt = `${SYSTEM_PROMPT}

${context}

${history ? `سجل المحادثة:\n${history}\n` : ""}
المستخدم: ${userText}

المساعد:`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: useInternet,
        ...(model ? { model } : {}),
      });

      const assistantMsg = { role: "assistant", content: result, id: Date.now() + "_a" };
      setMessages(prev => [...prev, assistantMsg]);

      await base44.entities.Conversation.create({
        message: result,
        sender: "assistant",
        session_id: sessionId.current,
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

  const clearChat = async () => {
    if (!confirm("هل تريد مسح المحادثة وبدء جلسة جديدة؟")) return;
    const newId = uid();
    sessionStorage.setItem(SESSION_KEY, newId);
    sessionId.current = newId;
    setMessages([]);
  };

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
              <p className="text-blue-200 text-xs">يحلل بياناتك ويقدم نصائح مخصصة</p>
            </div>
          </div>
          {messages.length > 0 && (
            <button onClick={clearChat} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)" }}>
              <Trash2 className="w-3.5 h-3.5 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loadingHistory ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-4 border-slate-700 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "#1a1d27" }}>
              <Sparkles className="w-7 h-7 text-indigo-400" />
            </div>
            <p className="text-white font-bold mb-1">مرحباً! أنا مساعدك المالي</p>
            <p className="text-slate-500 text-sm mb-6 max-w-xs">خبرة 20 عاماً في المالية والاستثمار — اسألني عن أي شيء</p>
            <div className="flex flex-col gap-2 w-full max-w-sm">
              {SUGGESTED.map(s => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-sm text-right px-4 py-3 rounded-2xl text-indigo-300 border leading-snug"
                  style={{ borderColor: "#2e3347", background: "#1a1d27" }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map(msg => <Message key={msg.id} msg={msg} />)}
            {loading && <TypingDots />}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Starter chips (when there are messages) */}
      {messages.length > 0 && !loading && (
        <div className="px-4 pt-2 flex gap-2 overflow-x-auto no-scrollbar flex-shrink-0">
          {SUGGESTED.map(s => (
            <button
              key={s}
              onClick={() => send(s)}
              className="whitespace-nowrap text-xs px-3 py-1.5 rounded-full text-indigo-300 border flex-shrink-0"
              style={{ borderColor: "#2e3347", background: "#1a1d27" }}
            >
              {s}
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