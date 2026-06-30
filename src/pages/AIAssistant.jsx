import React, { useState, useEffect, useRef } from "react";
import { Send, Sparkles, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ChatMessage from "@/components/assistant/ChatMessage";
const SESSION_KEY = "fin_assistant_session";
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

const SUGGESTED = [
  "كيف حالي المالي هذا الشهر؟",
  "أين أنفقت أكثر؟",
  "كم ادخرت هذا الشهر؟",
  "اقترح لي خطة توفير",
];

function getSessionId() {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) { id = uid(); sessionStorage.setItem(SESSION_KEY, id); }
  return id;
}

export default function AIAssistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const bottomRef = useRef(null);
  const sessionId = useRef(getSessionId());

  // Load conversation history for this session
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
      const txns = await base44.entities.Transaction.filter(
        { date: { $gte: from.toISOString().split("T")[0] } },
        "-date",
        200
      );
      if (txns.length === 0) return "لا توجد معاملات مسجلة حتى الآن.";

      const income = txns.filter(t => t.type === "income").reduce((s, t) => s + (t.amount || 0), 0);
      const expenses = txns.filter(t => t.type === "expense").reduce((s, t) => s + (t.amount || 0), 0);
      const byCategory = {};
      txns.filter(t => t.type === "expense").forEach(t => {
        byCategory[t.category || "أخرى"] = (byCategory[t.category || "أخرى"] || 0) + t.amount;
      });
      const topCategories = Object.entries(byCategory)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([c, v]) => `${c}: ${v.toLocaleString("ar-SA")} ر.س`)
        .join("، ");

      return `بيانات المستخدم المالية (آخر 90 يوم):
- إجمالي الدخل: ${income.toLocaleString("ar-SA")} ر.س
- إجمالي المصروفات: ${expenses.toLocaleString("ar-SA")} ر.س
- صافي المدخرات: ${(income - expenses).toLocaleString("ar-SA")} ر.س
- نسبة الادخار: ${income > 0 ? Math.round(((income - expenses) / income) * 100) : 0}%
- أكثر الفئات إنفاقاً: ${topCategories || "لا يوجد"}
- عدد المعاملات: ${txns.length}`;
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

    // Save user message
    await base44.entities.Conversation.create({
      message: userText,
      sender: "user",
      session_id: sessionId.current,
    });

    try {
      const context = await buildContext();
      const history = messages.slice(-8).map(m => `${m.role === "user" ? "المستخدم" : "المساعد"}: ${m.content}`).join("\n");

      const prompt = `أنت مساعد مالي ذكي باللغة العربية. تحدث بأسلوب ودود ومهني. قدم نصائح مالية محددة وعملية.

${context}

سجل المحادثة السابقة:
${history}

المستخدم: ${userText}

المساعد:`;

      const result = await base44.integrations.Core.InvokeLLM({ prompt });

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
        content: "عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.",
        id: Date.now() + "_err"
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
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loadingHistory ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-4 border-slate-700 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-10">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "#1a1d27" }}>
              <Sparkles className="w-7 h-7 text-indigo-400" />
            </div>
            <p className="text-white font-bold mb-1">مرحباً! أنا مساعدك المالي</p>
            <p className="text-slate-500 text-sm mb-6">أسألني عن وضعك المالي وسأساعدك</p>
            <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
              {SUGGESTED.map(s => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-xs text-right px-3 py-2.5 rounded-2xl text-indigo-300 border leading-snug"
                  style={{ borderColor: "#2e3347", background: "#1a1d27" }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map(msg => <ChatMessage key={msg.id} message={msg} />)}
            {loading && (
              <div className="flex justify-start">
                <div className="px-4 py-3 rounded-2xl rounded-tr-sm" style={{ background: "#1a1d27" }}>
                  <div className="flex gap-1 items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-24 pt-3 flex-shrink-0" style={{ borderTop: "1px solid #1e2130" }}>
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="اكتب سؤالك هنا..."
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