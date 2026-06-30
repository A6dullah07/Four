import React from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function PlanChart({ chartData, totalAmount }) {
  if (!chartData?.months?.length) return null;

  const data = chartData.months.map((m, i) => ({
    month: `ش${m}`,
    balance: Math.max(0, Math.round(chartData.balances[i] || 0)),
  }));

  const fmt = v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v;

  return (
    <div className="rounded-2xl p-4" style={{ background: "#1a1d27" }}>
      <h3 className="text-white text-sm font-bold mb-1">مسار تقدم الخطة</h3>
      <p className="text-slate-500 text-xs mb-4">الرصيد المتبقي شهرياً (ر.س)</p>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#252836" />
          <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={fmt} tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} width={36} />
          <Tooltip
            formatter={v => [`${v.toLocaleString("ar-SA")} ر.س`, "الرصيد المتبقي"]}
            contentStyle={{ background: "#252836", border: "none", borderRadius: 10, color: "white", fontSize: 12 }}
          />
          <Area type="monotone" dataKey="balance" stroke="#6366f1" strokeWidth={2} fill="url(#balanceGrad)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>

      <div className="flex gap-3 mt-4">
        <div className="flex-1 rounded-xl p-3 text-center" style={{ background: "#252836" }}>
          <p className="text-xs text-slate-500 mb-0.5">الدفعة الشهرية</p>
          <p className="text-indigo-400 font-bold text-sm">{chartData.monthly_payment?.toLocaleString("ar-SA")} ر.س</p>
        </div>
        <div className="flex-1 rounded-xl p-3 text-center" style={{ background: "#252836" }}>
          <p className="text-xs text-slate-500 mb-0.5">مدة الخطة</p>
          <p className="text-emerald-400 font-bold text-sm">{chartData.total_months} شهر</p>
        </div>
      </div>
    </div>
  );
}