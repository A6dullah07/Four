import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function AnalysisResult({ analysis, defaultOpen = true }) {
  const [open, setOpen] = React.useState(defaultOpen);
  const date = analysis.created_date
    ? new Date(analysis.created_date).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" })
    : "";

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#1a1d27" }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-4"
      >
        <div className="text-right">
          <p className="text-white text-sm font-bold truncate max-w-[220px]">{analysis.title || "تحليل"}</p>
          <p className="text-slate-500 text-xs mt-0.5">{date}</p>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
      </button>

      {open && (
        <div className="px-4 pb-4 border-t" style={{ borderColor: "#252836" }}>
          <div className="pt-4">
            <ReactMarkdown
              className="prose prose-sm prose-invert max-w-none"
              components={{
                p: ({ children }) => <p className="mb-3 text-slate-200 text-sm leading-relaxed">{children}</p>,
                strong: ({ children }) => <strong className="text-white font-bold">{children}</strong>,
                h1: ({ children }) => <h1 className="text-white font-bold text-base mt-4 mb-2 border-b pb-1" style={{ borderColor: "#252836" }}>{children}</h1>,
                h2: ({ children }) => <h2 className="text-indigo-300 font-bold text-sm mt-4 mb-2">{children}</h2>,
                h3: ({ children }) => <h3 className="text-indigo-200 font-semibold text-sm mt-3 mb-1">{children}</h3>,
                ul: ({ children }) => <ul className="list-disc list-inside space-y-1.5 my-2 text-slate-300">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside space-y-1.5 my-2 text-slate-300">{children}</ol>,
                li: ({ children }) => <li className="text-slate-300 text-sm leading-relaxed">{children}</li>,
                blockquote: ({ children }) => (
                  <blockquote className="border-r-4 border-indigo-500 pr-3 my-2 text-slate-400 text-sm italic">{children}</blockquote>
                ),
              }}
            >
              {analysis.result}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}