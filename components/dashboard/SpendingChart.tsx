"use client";
import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SpendingChartProps {
  groupId?: string;
  title?: string;
}

export default function SpendingChart({ groupId, title = 'Spending Trends' }: SpendingChartProps) {
  const [data, setData] = useState<any[]>([]);
  const [totalCredit, setTotalCredit] = useState(0);
  const [totalSpending, setTotalSpending] = useState(0);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<'week' | 'month' | 'year'>('week');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) return;

        let url = `/api/user/dashboard/big-graph?range=${range}`;
        if (groupId) url += `&groupId=${groupId}`;

        const res = await fetch(url, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await res.json();
        if (!res.ok) return;

        setTotalCredit(result.totalCredit || 0);
        setTotalSpending(result.totalSpending || 0);

        const raw = result.dataPoints || [];

        const formatted = raw.map((dp: any) => {
          let label = dp.date;
          if (range === 'week') {
            try {
              label = new Date(dp.date).toLocaleDateString([], { weekday: 'short', day: 'numeric' });
            } catch { label = dp.date; }
          } else if (range === 'month') {
            const parts = dp.date.split('-');
            label = parts.length === 2 ? `W${parts[1]}` : dp.date;
          } else if (range === 'year') {
            try {
              const [y, m] = dp.date.split('-');
              label = new Date(Number(y), Number(m) - 1).toLocaleDateString([], { month: 'short' });
            } catch { label = dp.date; }
          }
          return { label, credit: dp.credit, spending: dp.spending };
        });

        if (formatted.length === 1) {
          formatted.unshift({ label: '', credit: 0, spending: 0 });
          formatted.push({ label: '', credit: 0, spending: 0 });
        }

        setData(formatted);
      } catch (err) {
        console.error('SpendingChart error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [range, groupId]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length && label) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-sm">
          <p className="text-white font-bold mb-1">{label}</p>
          <p className="text-[#00f2fe]">Credit: ₹{(payload[0]?.value || 0).toFixed(0)}</p>
          <p className="text-[#a82ee2]">Spending: ₹{(payload[1]?.value || 0).toFixed(0)}</p>
        </div>
      );
    }
    return null;
  };

  const rangeOptions: { id: 'week' | 'month' | 'year'; label: string }[] = [
    { id: 'week', label: '7D' },
    { id: 'month', label: '1M' },
    { id: 'year', label: '1Y' }
  ];

  const netBalance = totalCredit - totalSpending;

  return (
    <div className="bg-app-card border border-app-border rounded-2xl p-6 shadow-sm flex flex-col">
      {/* Title row */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        {/* Range Selector */}
        <div className="flex gap-1 bg-slate-900/50 rounded-lg p-1 border border-app-border">
          {rangeOptions.map(opt => (
            <button
              key={opt.id}
              onClick={() => setRange(opt.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                range === opt.id
                  ? 'bg-app-cyan text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      {!loading && data.length > 0 && (
        <div className="flex items-center gap-6 mt-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00f2fe] shadow-[0_0_8px_rgba(0,242,254,0.6)]"></span>
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Credit</p>
              <p className="text-sm font-bold text-[#00f2fe]">₹{(totalCredit || 0).toFixed(0)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#a82ee2] shadow-[0_0_8px_rgba(168,46,226,0.6)]"></span>
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Spending</p>
              <p className="text-sm font-bold text-[#a82ee2]">₹{(totalSpending || 0).toFixed(0)}</p>
            </div>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Net</p>
            <p className={`text-sm font-bold ${netBalance >= 0 ? 'text-[#00f2fe]' : 'text-[#a82ee2]'}`}>
              {netBalance >= 0 ? '+' : ''}₹{(netBalance || 0).toFixed(0)}
            </p>
          </div>
        </div>
      )}
      
      {/* Chart — taller area */}
      <div className="w-full mt-5">
        {loading ? (
          <div className="flex items-center justify-center h-[280px]">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-app-cyan"></div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[280px] text-slate-500">
            <span className="material-symbols-outlined text-3xl mb-2 opacity-50">show_chart</span>
            <p className="text-sm">No data for this period</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id={`cyanGrad-${groupId || 'all'}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00f2fe" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#00f2fe" stopOpacity={0} />
                </linearGradient>
                <linearGradient id={`purpleGrad-${groupId || 'all'}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a82ee2" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#a82ee2" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="#2a2e3f" />
              <XAxis
                dataKey="label"
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={{ stroke: '#2a2e3f' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={{ stroke: '#2a2e3f' }}
                tickLine={false}
                tickFormatter={(v) => `₹${v}`}
              />
              <Tooltip content={<CustomTooltip />} />
              {/* Cyan — Credit (money owed to you) */}
              <Area
                type="monotone"
                dataKey="credit"
                stroke="#00f2fe"
                strokeWidth={3}
                fill={`url(#cyanGrad-${groupId || 'all'})`}
                dot={false}
                activeDot={{ fill: '#00f2fe', r: 5, stroke: '#0f1117', strokeWidth: 2 }}
                style={{ filter: 'drop-shadow(0 0 8px rgba(0,242,254,0.5))' }}
              />
              {/* Purple — Spending (money you owe) */}
              <Area
                type="monotone"
                dataKey="spending"
                stroke="#a82ee2"
                strokeWidth={3}
                fill={`url(#purpleGrad-${groupId || 'all'})`}
                dot={false}
                activeDot={{ fill: '#a82ee2', r: 5, stroke: '#0f1117', strokeWidth: 2 }}
                style={{ filter: 'drop-shadow(0 0 8px rgba(168,46,226,0.5))' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
