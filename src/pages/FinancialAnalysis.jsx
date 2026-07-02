import React, { useState, useEffect, useRef } from "react";
import { BarChart2, Upload, FileText, Loader2, Trash2, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import AnalysisResult from "@/components/analysis/AnalysisResult";
import { FINANCIAL_SYSTEM_PROMPT } from "@/pages/AIAssistant";

const ANALYSIS_INSTRUCTION = `

حلّل هذه القائمة المالية بالتفصيل. ركّز بشكل خاص على الإيضاحات (Footnotes): اشرح ماذا تعني، وأبرز أي مخاطر أو التزامات أو بنود غير معتادة مخفية فيها. ثم أعطِ: (1) ملخص صحة الشركة المالية في 3 جمل، (2) أهم 5 نقاط من الإيضاحات بلغة بسيطة، (3) أي إشارات تحذيرية (Red Flags) مع نسبة ثقتك لكل واحدة.`;

export default function FinancialAnalysis() {
  const [analyses, setAnalyses] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    base44.entities.Analysis.filter({ type: "footnotes" }, "-created_date", 20)
      .then(setAnalyses)
      .finally(() => setLoadingHistory(false));
  }, []);

  const handleFile = async (file) => {
    if (!file) return;
    const allowed = ["application/pdf", "image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowed.includes(file.type)) {
      setError("يُقبل PDF والصور فقط (PNG, JPG, WEBP)");
      return;
    }
    setError("");
    setAnalyzing(true);

    try {
      // Upload file and get URL
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Extract content using the LLM with vision
      const prompt = `${FINANCIAL_SYSTEM_PROMPT}${ANALYSIS_INSTRUCTION}

محتوى الملف المرفق في الصورة/المستند أعلاه.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        file_urls: [file_url],
        model: "claude_sonnet_4_6",
      });

      const saved = await base44.entities.Analysis.create({
        type: "footnotes",
        title: file.name,
        result,
      });

      setAnalyses(prev => [{ ...saved, result, title: file.name }, ...prev]);
    } catch (e) {
      setError("حدث خطأ أثناء التحليل. يرجى المحاولة مجدداً.");
    } finally {
      setAnalyzing(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("هل تريد حذف هذا التحليل؟")) return;
    await base44.entities.Analysis.delete(id);
    setAnalyses(prev => prev.filter(a => a.id !== id));
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div dir="rtl" className="min-h-screen" style={{ background: "#111318" }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-6 relative overflow-hidden" style={{ background: "linear-gradient(135deg,#1e3a8a,#7c3aed)" }}>
        <div className="absolute -top-8 -left-8 w-36 h-36 rounded-full opacity-10 bg-white" />
        <div className="relative z-10">
          <h1 className="text-white text-xl font-bold">تحليل القوائم المالية</h1>
          <p className="text-blue-200 text-xs mt-0.5">ارفع قائمة مالية واحصل على تحليل AI متعمق للإيضاحات</p>
        </div>
      </div>

      <div className="px-4 py-5 space-y-5">
        {/* Upload area */}
        <div
          onDrop={onDrop}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => !analyzing && fileRef.current?.click()}
          className="rounded-2xl border-2 border-dashed flex flex-col items-center justify-center py-10 px-6 text-center cursor-pointer transition-all"
          style={{
            borderColor: dragOver ? "#6366f1" : "#2e3347",
            background: dragOver ? "rgba(99,102,241,0.08)" : "#1a1d27",
          }}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={e => handleFile(e.target.files[0])}
          />

          {analyzing ? (
            <>
              <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mb-3" />
              <p className="text-white font-bold text-sm mb-1">جاري التحليل بالذكاء الاصطناعي...</p>
              <p className="text-slate-500 text-xs">قد يستغرق دقيقة أو دقيقتين</p>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ background: "#252836" }}>
                <Upload className="w-6 h-6 text-indigo-400" />
              </div>
              <p className="text-white font-bold text-sm mb-1">ارفع القائمة المالية</p>
              <p className="text-slate-400 text-xs mb-3">PDF أو صورة (PNG, JPG, WEBP)</p>
              <div
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white"
                style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}
              >
                اختر ملفاً
              </div>
            </>
          )}
        </div>

        {error && (
          <div className="flex gap-2 items-start text-red-400 text-xs rounded-xl p-3" style={{ background: "rgba(239,68,68,0.1)" }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Past analyses */}
        {loadingHistory ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-4 border-slate-700 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : analyses.length > 0 ? (
          <div className="space-y-3">
            <p className="text-slate-500 text-xs font-semibold">التحليلات السابقة ({analyses.length})</p>
            {analyses.map((a, i) => (
              <div key={a.id} className="relative">
                <AnalysisResult analysis={a} defaultOpen={i === 0} />
                <button
                  onClick={() => handleDelete(a.id)}
                  className="absolute top-3 left-3 w-7 h-7 rounded-xl flex items-center justify-center"
                  style={{ background: "#252836" }}
                >
                  <Trash2 className="w-3 h-3 text-red-400" />
                </button>
              </div>
            ))}
          </div>
        ) : !analyzing ? (
          <div className="flex flex-col items-center py-10 text-center">
            <BarChart2 className="w-8 h-8 text-slate-600 mb-3" />
            <p className="text-slate-500 text-sm">لا توجد تحليلات سابقة</p>
            <p className="text-slate-600 text-xs mt-1">ارفع قائمة مالية لتبدأ</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}