"use client";
import React, { useState, useEffect } from 'react';

export default function BudgetAlertCard() {
  const [budget, setBudget] = useState<number | null>(null);
  const [spent, setSpent] = useState(0);
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load saved budget from localStorage
    const saved = localStorage.getItem('monthlyBudget');
    if (saved) setBudget(Number(saved));

    // Fetch current month's spending
    const fetchSpending = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await fetch('/api/user/dashboard/big-graph?range=month', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setSpent(data.totalSpending || 0);
        }
      } catch (err) {
        console.error('BudgetAlert error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSpending();
  }, []);

  const saveBudget = () => {
    const val = Number(inputVal);
    if (val > 0) {
      setBudget(val);
      localStorage.setItem('monthlyBudget', String(val));
    }
    setEditing(false);
    setInputVal('');
  };

  const clearBudget = () => {
    setBudget(null);
    localStorage.removeItem('monthlyBudget');
  };

  const percentage = budget ? Math.min((spent / budget) * 100, 100) : 0;
  const remaining = budget ? Math.max(budget - spent, 0) : 0;
  const isOver = budget ? spent > budget : false;
  const barColor = isOver ? 'var(--color-app-red)' : percentage > 75 ? 'var(--color-app-red)' : 'var(--color-app-cyan)';

  return (
    <div className="bg-slate-900/80 light:bg-white backdrop-blur-xl border border-slate-800 light:border-slate-200 rounded-3xl p-5 shadow-xl light:shadow-sm relative overflow-hidden hover:-translate-y-2 hover:shadow-2xl light:hover:shadow-lg transition-all duration-300">
      {/* Alert glow if over budget */}
      {isOver && (
        <div 
          className="absolute -top-10 -right-10 w-32 h-32 bg-app-red rounded-full filter blur-[80px] animate-pulse pointer-events-none"
          style={{ mixBlendMode: 'var(--glow-blend)' as any, opacity: 'var(--glow-opacity-strong)' }}
        ></div>
      )}

      <div className="flex items-center justify-between mb-3 relative z-10">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]" style={{ color: barColor }}>
            {isOver ? 'warning' : 'savings'}
          </span>
          <h3 className="text-sm font-bold text-white light:text-slate-900 tracking-tight">Budget</h3>
        </div>
        {budget !== null && (
          <button onClick={clearBudget} className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors cursor-pointer relative z-10">Reset</button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-app-cyan"></div>
        </div>
      ) : budget === null ? (
        // No budget set — show setup UI
        <div>
          {editing ? (
            <div className="space-y-2">
              <input
                type="number"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full bg-slate-800/50 light:bg-slate-100 border border-slate-700 light:border-slate-200 rounded-lg px-3 py-2 text-sm text-white light:text-slate-900 placeholder-slate-600 light:placeholder-slate-400 outline-none focus:border-app-cyan transition-colors"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && saveBudget()}
              />
              <div className="flex gap-2">
                <button
                  onClick={saveBudget}
                  className="flex-1 py-1.5 bg-app-cyan/20 text-app-cyan text-xs font-bold rounded-lg hover:bg-app-cyan/30 transition-colors cursor-pointer"
                >
                  Set
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="flex-1 py-1.5 bg-slate-800 text-slate-400 text-xs font-bold rounded-lg hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-2">
              <p className="text-xs text-slate-500 mb-3">Set a monthly spending limit</p>
              <button
                onClick={() => setEditing(true)}
                className="w-full py-2.5 bg-gradient-to-r from-[#00f2fe]/20 to-[#a82ee2]/20 border border-slate-700 light:border-slate-200 text-white light:text-slate-900 text-xs font-bold rounded-xl hover:border-app-cyan/50 transition-all cursor-pointer"
              >
                + Set Budget
              </button>
            </div>
          )}
        </div>
      ) : (
        // Budget exists — show progress
        <div className="space-y-3">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">₹{spent.toFixed(0)} spent</span>
            <span className="text-slate-500">₹{budget.toFixed(0)} limit</span>
          </div>
          
          {/* Progress bar */}
          <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${percentage}%`,
                backgroundColor: barColor,
                boxShadow: `0 0 12px ${barColor}60`
              }}
            ></div>
          </div>

          <div className="flex justify-between items-center">
            <span className={`text-xs font-bold ${isOver ? 'text-app-red' : 'text-slate-300'}`}>
              {isOver ? `₹${(spent - budget).toFixed(0)} over budget!` : `₹${remaining.toFixed(0)} remaining`}
            </span>
            <span className="text-xs font-bold" style={{ color: barColor }}>
              {percentage.toFixed(0)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
