import React from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from "recharts";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444"];

const fmt = v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v;

function BudgetPie({ monthlyIncome, monthlyPayment, monthlyExpenses }) {
  if (!monthlyIncome) return null;
  const payment = Math.round(monthlyPayment || 0);
  const expenses = Math.round(monthlyExpenses || monthlyIncome * 0.5);
  const savings = Math.max(0, Math.round(monthlyIncome * 0.1));
  const remaining = Math.max(0, monthlyIncome - payment - expenses - savings);

  const data = [
    { name: "الخطة", value: payment },
    { name: "مصاريف", value: expenses },
    { name: "ادخار", value: savings },
    { name: "متاح", value: remaining },
  ].filter(d => d.value > 0);

  return (
    <div className="rounded-2xl p-4" style={{ background: "#1a1d27" }}>
      <h3 className="text-white text-sm font-bold mb-0.5">توزيع الميزانية الشهرية</h3>
      <p className="text-slate-500 text-xs mb-3">كيف يُوزَّع دخلك الشهري</p>
      <div className="flex items-center gap-4">
        <ResponsiveContainer width={130} height={130}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={38} outerRadius={58} dataKey="value" paddingAngle={3}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip
              formatter={(v) => [`${v.toLocaleString("ar-SA")} ر.س`]}
              contentStyle={{ background: "#252836", border: "none", borderRadius: 10, color: "white", fontSize: 11 }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-col gap-2 flex-1">
          {data.map((d, i) => (
            <div key={d.name} className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="text-slate-400 text-xs">{d.name}</span>
              </div>
              <span className="text-white text-xs font-bold">{d.value.toLocaleString("ar-SA")} ر.س</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MonthlyBar({ chartData }) {
  if (!chartData?.months?.length) return null;

  // Show every month or every N months to keep it readable
  const step = chartData.months.length > 12 ? 3 : 1;
  const data = chartData.months
    .filter((_, i) => i % step === 0)
    .map((m, i) => {
      const idx = i * step;
      const balance = Math.max(0, Math.round(chartData.balances[idx] || 0));
      const paid = Math.max(0, Math.round((chartData.total_amount || 0) - balance));
      return { month: `ش${m}`, paid, balance };
    });

  return (
    <div className="rounded-2xl p-4" style={{ background: "#1a1d27" }}>
      <h3 className="text-white text-sm font-bold mb-0.5">التقدم الشهري</h3>
      <p className="text-slate-500 text-xs mb-3">المبلغ المدفوع مقابل المتبقي (ر.س)</p>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#252836" vertical={false} />
          <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={fmt} tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} width={36} />
          <Tooltip
            formatter={(v, name) => [`${v.toLocaleString("ar-SA")} ر.س`, name === "paid" ? "مدفوع" : "متبقي"]}
            contentStyle={{ background: "#252836", border: "none", borderRadius: 10, color: "white", fontSize: 11 }}
          />
          <Bar dataKey="paid" fill="#6366f1" radius={[4, 4, 0, 0]} name="paid" />
          <Bar dataKey="balance" fill="#1e3a8a" radius={[4, 4, 0, 0]} name="balance" />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex gap-3 mt-2">
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-indigo-500" /><span className="text-slate-400 text-xs">مدفوع</span></div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-blue-900" /><span className="text-slate-400 text-xs">متبقي</span></div>
      </div>
    </div>
  );
}

function ProgressArea({ chartData }) {
  if (!chartData?.months?.length) return null;

  const data = chartData.months.map((m, i) => ({
    month: `ش${m}`,
    balance: Math.max(0, Math.round(chartData.balances[i] || 0)),
  }));

  return (
    <div className="rounded-2xl p-4" style={{ background: "#1a1d27" }}>
      <h3 className="text-white text-sm font-bold mb-0.5">مسار تقدم الخطة</h3>
      <p className="text-slate-500 text-xs mb-3">الرصيد المتبقي شهرياً (ر.س)</p>
      <ResponsiveContainer width="100%" height={160}>
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
      <div className="flex gap-3 mt-3">
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

export default function PlanChart({ chartData, totalAmount, monthlyIncome, monthlyExpenses }) {
  if (!chartData?.months?.length) return null;

  return (
    <div className="space-y-3">
      <BudgetPie
        monthlyIncome={monthlyIncome || chartData.monthly_payment * 2}
        monthlyPayment={chartData.monthly_payment}
        monthlyExpenses={monthlyExpenses}
      />
      <MonthlyBar chartData={{ ...chartData, total_amount: totalAmount }} />
      <ProgressArea chartData={chartData} />
    </div>
  );
}