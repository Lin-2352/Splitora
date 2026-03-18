"use client";
import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface GroupBalance {
  groupId: string;
  groupName: string;
  amount: number;
}

export default function BalanceChartCard() {
  const [data, setData] = useState<GroupBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTreemap = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await fetch('/api/user/dashboard/treemap', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Failed to fetch analytics');
        
        const activeBalances = result.groups.filter((g: GroupBalance) => Math.abs(g.amount) > 0.01);
        setData(activeBalances);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTreemap();
  }, []);

  // Cyan for money owed TO you, Purple for money you owe
  const chartData = data.map(d => ({
    ...d,
    absAmount: Math.abs(d.amount),
    color: d.amount > 0 ? '#00f2fe' : '#a82ee2',
    type: d.amount > 0 ? 'Owed to you' : 'You owe'
  }));

  const totalOwed = data.filter(d => d.amount > 0).reduce((sum, d) => sum + d.amount, 0);
  const totalDebt = Math.abs(data.filter(d => d.amount < 0).reduce((sum, d) => sum + d.amount, 0));
  const netBalance = totalOwed - totalDebt;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const { groupName, amount } = payload[0].payload;
      const isOwed = amount > 0;
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl">
          <p className="text-white font-bold mb-1">{groupName}</p>
          <p className={isOwed ? "text-[#00f2fe]" : "text-[#a82ee2]"}>
            {isOwed ? `You'll get: ₹${(amount || 0).toFixed(2)}` : `You pay: ₹${Math.abs(amount || 0).toFixed(2)}`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-app-card border border-app-border rounded-2xl p-6 shadow-sm flex flex-col h-full min-h-[350px]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-white">Net Balances</h2>
        <span className="material-symbols-outlined text-app-purple text-sm">pie_chart</span>
      </div>

      <div className="flex-1 relative flex items-center justify-center">
        {loading ? (
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-app-cyan"></div>
        ) : error ? (
          <p className="text-app-red text-sm">{error}</p>
        ) : chartData.length === 0 ? (
          <div className="text-center text-slate-500">
             <span className="material-symbols-outlined text-3xl mb-2 opacity-50">account_balance_wallet</span>
             <p className="text-sm">No active balances</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="absAmount"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    className="hover:opacity-80 transition-opacity cursor-pointer outline-none"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        )}
        
        {/* Center Label */}
        {!loading && chartData.length > 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xs text-slate-400">Net Balance</span>
            <span className={`text-lg font-bold ${netBalance >= 0 ? 'text-[#00f2fe]' : 'text-[#a82ee2]'}`}>
              {netBalance >= 0 ? '+' : '-'}₹{Math.abs(netBalance || 0).toFixed(0)}
            </span>
          </div>
        )}
      </div>

      {!loading && chartData.length > 0 && (
         <div className="mt-4 flex justify-between border-t border-slate-800 pt-4">
           <div>
             <p className="text-xs text-slate-500">You'll get</p>
             <p className="text-[#00f2fe] font-bold">₹{(totalOwed || 0).toFixed(2)}</p>
           </div>
           <div className="text-right">
             <p className="text-xs text-slate-500">You pay</p>
             <p className="text-[#a82ee2] font-bold">₹{(totalDebt || 0).toFixed(2)}</p>
           </div>
         </div>
      )}
    </div>
  );
}
