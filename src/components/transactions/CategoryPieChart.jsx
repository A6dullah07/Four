import React from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = ["#6366f1", "#f43f5e", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="700">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function CategoryPieChart({ transactions }) {
  const expenses = transactions.filter(t => t.type === "expense");
  const byCategory = {};
  expenses.forEach(t => { byCategory[t.category || "أخرى"] = (byCategory[t.category || "أخرى"] || 0) + (t.amount || 0); });
  const data = Object.entries(byCategory).map(([name, value]) => ({ name, value: Math.round(value) }));

  if (data.length === 0) {
    return (
      <div className="rounded-2xl p-10 text-center" style={{ background: "#1a1d27" }}>
        <div className="text-4xl mb-3">📊</div>
        <p className="text-slate-400 text-sm">لا توجد مصروفات لعرض المخطط</p>
        <p className="text-slate-600 text-xs mt-1">أضف بعض المعاملات أولاً</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-4" style={{ background: "#1a1d27" }}>
      <h3 className="text-white text-sm font-bold mb-4">توزيع المصروفات حسب الفئة</h3>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" labelLine={false} label={renderCustomLabel} outerRadius={90} dataKey="value">
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip
            formatter={(value, name) => [`${value.toLocaleString("ar-SA")} ر.س`, name]}
            contentStyle={{ background: "#252836", border: "none", borderRadius: 12, color: "white", fontSize: 12 }}
          />
          <Legend
            formatter={value => <span style={{ fontSize: 11, color: "#94a3b8" }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Category breakdown list */}
      <div className="mt-4 space-y-2">
        {data.sort((a, b) => b.value - a.value).map((item, i) => {
          const total = data.reduce((s, d) => s + d.value, 0);
          const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
          return (
            <div key={item.name} className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
              <span className="text-slate-300 text-xs flex-1">{item.name}</span>
              <span className="text-slate-500 text-xs">{pct}%</span>
              <span className="text-white text-xs font-semibold">{item.value.toLocaleString("ar-SA")} ر.س</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}