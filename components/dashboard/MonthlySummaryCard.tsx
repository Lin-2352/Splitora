"use client";
import React, { useState, useEffect } from 'react';

export default function MonthlySummaryCard() {
  const [data, setData] = useState({ credit: 0, spending: 0, expenseCount: 0, groupCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Fetch spending trends for this month
        const res = await fetch('/api/user/dashboard/big-graph?range=month', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await res.json();
        if (!res.ok) return;

        const dp = result.dataPoints || [];
        const credit = dp.reduce((s: number, d: any) => s + (d.credit || 0), 0);
        const spending = dp.reduce((s: number, d: any) => s + (d.spending || 0), 0);
        const expenseCount = dp.reduce((s: number, d: any) => s + (d.creditCount || 0) + (d.spendingCount || 0), 0);

        // Get group count from treemap
        const treemapRes = await fetch('/api/user/dashboard/treemap', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const treemapData = await treemapRes.json();
        const groupCount = (treemapData.groups || []).length;

        setData({ credit, spending, expenseCount, groupCount });
      } catch (err) {
        console.error('MonthlySummary error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const net = data.credit - data.spending;
  const monthName = new Date().toLocaleDateString([], { month: 'long', year: 'numeric' });

  return (
    <div className="bg-app-card border border-app-border rounded-2xl p-5 shadow-sm relative overflow-hidden">
      {/* Subtle glow */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#00f2fe] rounded-full mix-blend-screen filter blur-[80px] opacity-10"></div>

      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-app-cyan text-[18px]">calendar_month</span>
        <h3 className="text-sm font-bold text-white">{monthName}</h3>
      </div>

      {loading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-app-cyan"></div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">Earned</span>
            <span className="text-sm font-bold text-[#00f2fe]">₹{data.credit.toFixed(0)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">Spent</span>
            <span className="text-sm font-bold text-[#a82ee2]">₹{data.spending.toFixed(0)}</span>
          </div>
          <div className="border-t border-slate-800 pt-3 flex justify-between items-center">
            <span className="text-xs text-slate-500">Net</span>
            <span className={`text-sm font-bold ${net >= 0 ? 'text-[#00f2fe]' : 'text-[#a82ee2]'}`}>
              {net >= 0 ? '+' : ''}₹{net.toFixed(0)}
            </span>
          </div>
          <div className="flex gap-4 pt-1">
            <div className="text-center flex-1">
              <p className="text-lg font-bold text-white">{data.expenseCount}</p>
              <p className="text-[10px] text-slate-500 uppercase">Expenses</p>
            </div>
            <div className="w-px bg-slate-800"></div>
            <div className="text-center flex-1">
              <p className="text-lg font-bold text-white">{data.groupCount}</p>
              <p className="text-[10px] text-slate-500 uppercase">Groups</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
