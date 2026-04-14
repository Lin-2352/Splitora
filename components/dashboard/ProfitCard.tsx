"use client";
import React, { useState, useEffect } from 'react';
import { useInView } from '@/hooks/useInView';
import { useCountUp } from '@/hooks/useCountUp';

export default function ProfitCard() {
  const [totalOwed, setTotalOwed] = useState(0);
  const [totalDebt, setTotalDebt] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await fetch('/api/user/dashboard/treemap', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) return;

        const groups = data.groups || [];
        let owed = 0;
        let debt = 0;

        for (const g of groups) {
          if (g.amount > 0) owed += g.amount;
          else debt += Math.abs(g.amount);
        }

        setTotalOwed(owed);
        setTotalDebt(debt);
      } catch (err) {
        console.error('ProfitCard error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const netProfit = totalOwed - totalDebt;
  
  const { ref, inView } = useInView({ threshold: 0.2 });
  const animOwed = useCountUp(Math.round(totalOwed), inView && !loading, 2000);
  const animDebt = useCountUp(Math.round(totalDebt), inView && !loading, 2000);

  return (
    <div ref={ref} className="bg-slate-900/80 light:bg-white backdrop-blur-xl border border-slate-800 light:border-slate-200 rounded-3xl p-6 shadow-xl light:shadow-sm relative overflow-hidden flex flex-col gap-4 transition-all duration-300">
      <div className="flex justify-between items-center">
        <h3 className="text-white light:text-slate-900 font-bold tracking-tight">Summary</h3>
        <div className="flex flex-col text-right">
          <span className={`text-green-400 material-symbols-outlined text-sm ${inView ? 'animate-icon-bounce' : ''}`} style={{ animationDelay: '100ms' }}>arrow_upward</span>
          <span className={`text-red-400 material-symbols-outlined text-sm ${inView ? 'animate-icon-bounce' : ''}`} style={{ animationDelay: '300ms' }}>arrow_downward</span>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-app-cyan"></div>
        </div>
      ) : (
        <>
          <div>
            <p className="text-xs text-slate-500 mb-1">You&apos;ll Receive</p>
            <div className="flex justify-between items-center">
              <p className="text-white light:text-slate-900 font-bold text-lg tracking-tight">₹{animOwed}</p>
              <p className="text-green-400 text-xs flex items-center gap-1">
                <span className="material-symbols-outlined text-[10px]">arrow_upward</span>
                incoming
              </p>
            </div>
          </div>
          
          <div>
            <p className="text-xs text-slate-500 mb-1">You Owe</p>
            <div className="flex justify-between items-center">
              <p className="text-white light:text-slate-900 font-bold text-lg tracking-tight">₹{animDebt}</p>
              <p className="text-red-400 text-xs flex items-center gap-1">
                <span className="material-symbols-outlined text-[10px]">arrow_downward</span>
                outgoing
              </p>
            </div>
          </div>
          
          <div className="pt-4 border-t border-slate-800">
            <p className="text-xs text-slate-500 mb-1">Net Balance</p>
            <p className={`text-xl font-bold ${netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {netProfit >= 0 ? '+' : '-'}₹{Math.abs(Math.round(animOwed - animDebt))}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
