"use client";
import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import SpendingChart from '@/components/dashboard/SpendingChart';

export default function AnalyticsPage() {
  const [groupData, setGroupData] = useState<any[]>([]);
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
        if (res.ok) {
          setGroupData(data.groups || []);
        }
      } catch (err) {
        console.error('Analytics fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const barData = groupData.map(g => ({
    name: g.groupName || 'Group',
    balance: Number(g.amount.toFixed(2)),
    credit: g.amount > 0 ? g.amount : 0,
    spending: g.amount < 0 ? Math.abs(g.amount) : 0,
  }));

  const totalCredit = groupData.filter(g => g.amount > 0).reduce((s, g) => s + g.amount, 0);
  const totalSpending = Math.abs(groupData.filter(g => g.amount < 0).reduce((s, g) => s + g.amount, 0));
  const net = totalCredit - totalSpending;
  const groupCount = groupData.length;

  const pieData = barData.filter(d => (d.credit + d.spending) > 0).map((d, i) => ({
    name: d.name,
    value: d.credit + d.spending,
    color: ['#00f2fe', '#a82ee2', '#ec5b13', '#eab308', '#22c55e', '#06b6d4'][i % 6]
  }));

  const BarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-sm">
          <p className="text-white font-bold mb-1">{label}</p>
          <p className="text-[#00f2fe]">Credit: ₹{payload[0]?.value?.toFixed(0)}</p>
          <p className="text-[#a82ee2]">Spending: ₹{payload[1]?.value?.toFixed(0)}</p>
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-sm">
          <p className="text-white font-bold">{payload[0].name}</p>
          <p className="text-slate-300">₹{payload[0].value.toFixed(0)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-screen flex overflow-hidden bg-app-bg text-slate-300 font-sans">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Topbar />
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-[1600px] mx-auto space-y-6">

            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold text-white">Analytics</h1>
              <p className="text-sm text-slate-500 mt-1">Compare spending and credit across all your groups.</p>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-app-card border border-app-border rounded-xl p-4">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Groups</p>
                <p className="text-xl font-bold text-white mt-1">{groupCount}</p>
              </div>
              <div className="bg-app-card border border-app-border rounded-xl p-4">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Total Credit</p>
                <p className="text-xl font-bold text-[#00f2fe] mt-1">₹{totalCredit.toFixed(0)}</p>
              </div>
              <div className="bg-app-card border border-app-border rounded-xl p-4">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Total Spending</p>
                <p className="text-xl font-bold text-[#a82ee2] mt-1">₹{totalSpending.toFixed(0)}</p>
              </div>
              <div className="bg-app-card border border-app-border rounded-xl p-4">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Net Balance</p>
                <p className={`text-xl font-bold mt-1 ${net >= 0 ? 'text-[#00f2fe]' : 'text-[#a82ee2]'}`}>
                  {net >= 0 ? '+' : ''}₹{net.toFixed(0)}
                </p>
              </div>
            </div>

            {/* Big Spending Chart */}
            <SpendingChart title="Overall Spending Trends" />

            {/* Group Comparison Bar Chart */}
            <div className="bg-app-card border border-app-border rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-white mb-1">Group Comparison</h2>
              <p className="text-xs text-slate-500 mb-5">Credit vs Spending per group</p>

              <div className="w-full min-h-[320px]">
                {loading ? (
                  <div className="flex items-center justify-center h-[320px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-app-cyan"></div>
                  </div>
                ) : barData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[320px] text-slate-500">
                    <span className="material-symbols-outlined text-3xl mb-2 opacity-50">bar_chart</span>
                    <p className="text-sm">No group data yet</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={barData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="4 4" stroke="#2a2e3f" />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        axisLine={{ stroke: '#2a2e3f' }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        axisLine={{ stroke: '#2a2e3f' }}
                        tickLine={false}
                        tickFormatter={(v) => `₹${v}`}
                      />
                      <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                      <Bar dataKey="credit" name="Credit" fill="#00f2fe" radius={[6, 6, 0, 0]} maxBarSize={35} fillOpacity={0.85} />
                      <Bar dataKey="spending" name="Spending" fill="#a82ee2" radius={[6, 6, 0, 0]} maxBarSize={35} fillOpacity={0.85} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Bottom row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Group Activity Share Pie */}
              <div className="bg-app-card border border-app-border rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-white mb-1">Activity Share</h2>
                <p className="text-xs text-slate-500 mb-4">Which groups move the most money</p>
                <div className="w-full h-[250px] relative">
                  {pieData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500">
                      <span className="material-symbols-outlined text-3xl mb-2 opacity-50">pie_chart</span>
                      <p className="text-sm">No data</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value" stroke="none">
                          {pieData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<PieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
                {/* Legend */}
                <div className="flex flex-wrap gap-3 mt-2 justify-center">
                  {pieData.map((d, i) => (
                    <span key={i} className="flex items-center gap-1.5 text-xs text-slate-400">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }}></span>
                      {d.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Per‑group balance list */}
              <div className="bg-app-card border border-app-border rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-white mb-1">Per-Group Balances</h2>
                <p className="text-xs text-slate-500 mb-4">Your net position in each group</p>
                <ul className="space-y-2">
                  {groupData.length === 0 ? (
                    <li className="text-center text-slate-500 py-8 text-sm">No groups</li>
                  ) : (
                    groupData.map((g, i) => (
                      <li key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/30 border border-slate-800">
                        <span className="text-sm text-white font-medium truncate">{g.groupName}</span>
                        <span className={`text-sm font-bold ${g.amount >= 0 ? 'text-[#00f2fe]' : 'text-[#a82ee2]'}`}>
                          {g.amount >= 0 ? '+' : ''}₹{g.amount.toFixed(0)}
                        </span>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
