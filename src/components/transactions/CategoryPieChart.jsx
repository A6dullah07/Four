import React from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = [
  "#6366f1", "#f43f5e", "#f59e0b", "#10b981", "#3b82f6",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316",
];

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="600">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function CategoryPieChart({ transactions }) {
  const expenses = transactions.filter((t) => t.type === "expense");
  const byCategory = {};
  expenses.forEach((t) => {
    byCategory[t.category] = (byCategory[t.category] || 0) + (t.amount || 0);
  });

  const data = Object.entries(byCategory).map(([name, value]) => ({ name, value }));

  if (data.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mt-4">
      <h3 className="text-sm font-bold text-gray-700 mb-3">توزيع المصروفات حسب الفئة</h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={85}
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [`${value.toLocaleString("ar-SA")} ر.س`, ""]}
            labelStyle={{ fontFamily: "Tahoma" }}
          />
          <Legend
            formatter={(value) => <span style={{ fontSize: 12 }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}