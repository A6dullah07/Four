import React from "react";
import ReactMarkdown from "react-markdown";
import { Sparkles, User } from "lucide-react";

export default function ChatMessage({ message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div
        className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-1"
        style={{ background: isUser ? "linear-gradient(135deg,#4f46e5,#7c3aed)" : "#1a1d27" }}
      >
        {isUser
          ? <User className="w-3.5 h-3.5 text-white" />
          : <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
        }
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[78%] px-4 py-3 text-sm leading-relaxed ${
          isUser ? "rounded-2xl rounded-tl-sm" : "rounded-2xl rounded-tr-sm"
        }`}
        style={isUser
          ? { background: "linear-gradient(135deg,#1e3a8a,#4f46e5)", color: "white" }
          : { background: "#1a1d27", color: "#e2e8f0" }
        }
      >
        {isUser ? (
          <p style={{ whiteSpace: "pre-wrap" }}>{message.content}</p>
        ) : (
          <ReactMarkdown
            className="prose prose-sm prose-invert max-w-none"
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0 text-slate-200 text-sm leading-relaxed">{children}</p>,
              ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
              li: ({ children }) => <li className="text-slate-200 text-sm">{children}</li>,
              strong: ({ children }) => <strong className="text-white font-bold">{children}</strong>,
              h3: ({ children }) => <h3 className="text-white font-bold text-sm mb-1 mt-2">{children}</h3>,
            }}
          >
            {message.content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}