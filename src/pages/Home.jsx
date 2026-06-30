import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { TrendingUp, TrendingDown, Wallet, PiggyBank } from "lucide-react";
import SummaryCard from "@/components/dashboard/SummaryCard";

export default function Home() {
  const [stats, setStats] = useState({ income: 0, expenses: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
        const transactions = await base44.entities.Transaction.filter({
          date: { $gte: startOfMonth },
        });
        let income = 0;
        let expenses = 0;
        transactions.forEach((t) => {
          if (t.type === "income") income += t.amount || 0;
          else expenses += t.amount || 0;
        });
        setStats({ income, expenses });
      } catch (e) {
        // no transactions yet
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const savings = stats.income - stats.expenses;
  const savingsRate = stats.income > 0 ? Math.round((savings / stats.income) * 100) : 0;

  const formatCurrency = (val) =>
    val.toLocaleString("ar-SA", { minimumFractionDigits: 0 }) + " ر.س";

  return (
    <div>
      {/* Header */}
      <div className="bg-gradient-to-l from-[#1e3a8a] to-[#7c3aed] px-5 pt-12 pb-10 rounded-b-3xl">
        <h1 className="text-2xl font-bold text-white mb-1">المساعد المالي الذكي</h1>
        <p className="text-blue-200 text-sm">تحليل مالي فوري مع نصائح محددة</p>
      </div>

      {/* Summary Cards */}
      <div className="px-4 -mt-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-7 h-7 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <SummaryCard
              icon={TrendingUp}
              label="الدخل هذا الشهر"
              value={formatCurrency(stats.income)}
              color="green"
            />
            <SummaryCard
              icon={TrendingDown}
              label="المصروفات هذا الشهر"
              value={formatCurrency(stats.expenses)}
              color="red"
            />
            <SummaryCard
              icon={Wallet}
              label="المدخرات الحالية"
              value={formatCurrency(savings)}
              color="blue"
            />
            <SummaryCard
              icon={PiggyBank}
              label="نسبة الادخار"
              value={`${savingsRate}%`}
              color="purple"
            />
          </div>
        )}
      </div>
    </div>
  );
}