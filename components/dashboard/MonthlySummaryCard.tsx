"use client";
import React, { useState, useEffect } from 'react';
import { useInView } from '@/hooks/useInView';
import { useCountUp } from '@/hooks/useCountUp';

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

  const { ref, inView } = useInView({ threshold: 0.2 });
  const animCredit = useCountUp(Math.round(data.credit), inView && !loading, 2000);
  const animSpending = useCountUp(Math.round(data.spending), inView && !loading, 2000);
  const animExpenses = useCountUp(data.expenseCount, inView && !loading, 1600);
  const animGroups = useCountUp(data.groupCount, inView && !loading, 1600);

  return (
    <div ref={ref} className="bg-slate-900/80 light:bg-white backdrop-blur-xl border border-slate-800 light:border-slate-200 rounded-3xl p-5 shadow-xl light:shadow-sm relative overflow-hidden transition-all duration-300">
      {/* Subtle glow */}
      <div 
        className="absolute -top-10 -right-10 w-32 h-32 bg-app-cyan rounded-full filter blur-[80px]"
        style={{ mixBlendMode: 'var(--glow-blend)' as any, opacity: 'var(--glow-opacity-strong)' }}
      ></div>

      <div className="flex items-center gap-2 mb-4">
        <span className={`material-symbols-outlined text-app-cyan text-[18px] ${inView ? 'animate-icon-pop' : 'opacity-0'}`} style={{ animationDelay: '200ms' }}>calendar_month</span>
        <h3 className="text-sm font-bold text-white light:text-slate-900 tracking-tight">{monthName}</h3>
      </div>

      {loading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-app-cyan"></div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex justify-between items-center p-2.5 bg-[#00f2fe]/5 border border-[#00f2fe]/15 rounded-xl">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 rounded-full bg-[#00f2fe] shadow-[0_0_6px_rgba(0,242,254,0.5)]"></div>
              <span className="text-xs font-medium text-slate-400 light:text-slate-500">Earned (Credit)</span>
            </div>
            <span className="text-sm font-bold text-[#00f2fe]">₹{animCredit}</span>
          </div>
          <div className="flex justify-between items-center p-2.5 bg-[#a82ee2]/5 border border-[#a82ee2]/15 rounded-xl">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 rounded-full bg-[#a82ee2] shadow-[0_0_6px_rgba(168,46,226,0.5)]"></div>
              <span className="text-xs font-medium text-slate-400 light:text-slate-500">Spent</span>
            </div>
            <span className="text-sm font-bold text-[#a82ee2]">₹{animSpending}</span>
          </div>
          <div className="flex justify-between items-center p-2.5 bg-slate-800/40 light:bg-slate-50 border border-slate-700/40 light:border-slate-200 rounded-xl">
            <div className="flex items-center gap-2">
              <div className={`w-1 h-5 rounded-full ${net >= 0 ? 'bg-[#00f2fe] shadow-[0_0_6px_rgba(0,242,254,0.5)]' : 'bg-[#a82ee2] shadow-[0_0_6px_rgba(168,46,226,0.5)]'}`}></div>
              <span className="text-xs font-medium text-slate-400 light:text-slate-500">Net Balance</span>
            </div>
            <span className={`text-sm font-bold ${net >= 0 ? 'text-[#00f2fe]' : 'text-[#a82ee2]'}`}>
              {net >= 0 ? '+' : ''}₹{Math.abs(Math.round(net >= 0 ? animCredit - animSpending : animSpending - animCredit))}
            </span>
          </div>
          <div className="flex gap-3 pt-1">
            <div className="text-center flex-1 bg-slate-800/30 light:bg-slate-50 rounded-xl py-2 border border-slate-700/30 light:border-slate-200">
              <p className="text-base font-bold text-white light:text-slate-900">{animExpenses}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Expenses</p>
            </div>
            <div className="text-center flex-1 bg-slate-800/30 light:bg-slate-50 rounded-xl py-2 border border-slate-700/30 light:border-slate-200">
              <p className="text-base font-bold text-white light:text-slate-900">{animGroups}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Groups</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
